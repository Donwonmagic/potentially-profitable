/**
 * Shared cross-tool context bus for the Muntin Digital toolkit.
 *
 * Problem: every tool collects pieces of the same restaurant context —
 * business name, neighborhood, cuisine, hours, palette, dishes, the URL
 * they audited last — and asks the user to type it again. Nothing is
 * shared. This module is the single localStorage-backed namespace
 * `mtn:context` that any tool can read from on load and write to on
 * save. Each tool owns one or more keys; reads are best-effort; writes
 * are deliberate.
 *
 * Privacy posture stays intact: the data lives in the user's browser
 * localStorage, never leaves the device, never enters analytics events.
 * The tool's own data-promise card already documents zero-fetch behavior;
 * this bus is a cousin of url-fragment.js — same idea, longer lifetime.
 *
 * Shape (additive; tools may carry extra keys without breaking older
 * readers):
 *
 *   {
 *     v: 1,                     // schema version, integer
 *     businessName: string,     // "Joe's Taqueria"
 *     address: string,          // "1234 Main St, Silver Spring, MD 20910"
 *     phone: string,            // "+13015551234" (E.164 preferred)
 *     cuisine: string,          // "Mexican" | "Italian" | "Vietnamese" | …
 *     neighborhood: string,     // "Silver Spring"
 *     city: string,             // "Silver Spring, MD"
 *     platform: string,         // "wix" | "squarespace" | "wordpress" | …
 *     palette: string[],        // ["#B8541A", "#1F4E5B", …]  uppercase hex
 *     hours: object,            // shape from open-hours.js exporter
 *     dishes: object[],         // [{ name, price, foodCost, units }]
 *     lastUrl: string,          // most recently audited URL
 *     updatedAt: number         // epoch ms of last write
 *   }
 *
 * Wiring (typical reader, e.g. seo-grader prefilling cuisine field):
 *
 *   var ctx = MuntinContext.read();
 *   if (ctx.cuisine && cuisineEl.value === '') cuisineEl.value = ctx.cuisine;
 *
 * Wiring (typical writer, e.g. plate-cost saving its dish list):
 *
 *   MuntinContext.merge({ dishes: rows.map(toDish) });
 *
 * Tools should NOT assume keys are present and SHOULD validate types
 * before use. `read()` always returns an object; missing keys are
 * undefined.
 *
 * Pure-ish: the only side effect is localStorage. Safe to no-op in Node
 * (e.g. tests). Throws are caught — a corrupt blob returns {}.
 */

(function (root) {
  'use strict';

  var STORAGE_KEY = 'mtn:context';
  var SCHEMA_VERSION = 1;

  function safeStorage() {
    try {
      if (typeof localStorage === 'undefined') return null;
      // Some privacy modes throw on access.
      var probe = '__mtn_probe__';
      localStorage.setItem(probe, probe); // h8-exempt: quota-availability probe; immediately removed
      localStorage.removeItem(probe);
      return localStorage;
    } catch (e) {
      return null;
    }
  }

  function read() {
    var ls = safeStorage();
    if (!ls) return {};
    try {
      var raw = ls.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch (e) {
      return {};
    }
  }

  function write(obj) {
    var ls = safeStorage();
    if (!ls) return false;
    try {
      var clean = obj && typeof obj === 'object' ? obj : {};
      clean.v = SCHEMA_VERSION;
      clean.updatedAt = Date.now();
      ls.setItem(STORAGE_KEY, JSON.stringify(clean));
      return true;
    } catch (e) {
      return false;
    }
  }

  function merge(patch) {
    if (!patch || typeof patch !== 'object') return false;
    var current = read();
    Object.keys(patch).forEach(function (k) {
      if (patch[k] === null || typeof patch[k] === 'undefined') {
        delete current[k];
      } else {
        current[k] = patch[k];
      }
    });
    return write(current);
  }

  function get(key) {
    var ctx = read();
    return ctx[key];
  }

  function clear() {
    var ls = safeStorage();
    if (!ls) return false;
    try {
      ls.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Subscribe to cross-tab updates. Fires when another tab writes the
  // bus (e.g. user opens schema-check in tab A and open-hours in tab B —
  // changing hours in B should refresh the schema preview in A).
  function subscribe(callback) {
    if (typeof callback !== 'function') return function () {};
    if (typeof root.addEventListener !== 'function') return function () {};
    var handler = function (e) {
      if (e && e.key === STORAGE_KEY) {
        try { callback(read()); } catch (err) { /* swallow */ }
      }
    };
    root.addEventListener('storage', handler);
    return function () { root.removeEventListener('storage', handler); };
  }

  // ----------------------------------------------------------------
  // W3-4 — encrypted invoice handoff helpers.
  //
  // The cross-tool handoff for invoice items used to be a plaintext
  // localStorage write (MuntinContext.merge({ invoiceItems: slim })).
  // That contradicted the privacy claim — saved invoices live as
  // AES-GCM ciphertext on the server, but the SAME line items sat
  // unencrypted in the browser profile so other tools could pre-fill.
  //
  // Now: writeInvoiceItems wraps the array via MID_DEVICE_KEY (per-
  // device AES-GCM key, see tools/invoice-decoder/device-key.js) and
  // stores the envelope under `invoiceItemsEnc`. readInvoiceItems
  // resolves to the decrypted array — async because SubtleCrypto is.
  //
  // Failure mode: when MID_DEVICE_KEY is absent (it loads only on
  // pages that include invoice-decoder/device-key.js), these helpers
  // resolve to null on read and reject on write so the caller can
  // detect and surface a "module missing" hint instead of falling
  // back to plaintext writes.
  // ----------------------------------------------------------------
  function writeInvoiceItems(items) {
    if (!root.MID_DEVICE_KEY || typeof root.MID_DEVICE_KEY.wrap !== 'function') {
      return Promise.reject(new Error('device-key module missing'));
    }
    return root.MID_DEVICE_KEY.wrap(items || []).then(function (env) {
      // Drop any legacy plaintext invoiceItems alongside the wrap.
      var current = read();
      if (Array.isArray(current.invoiceItems)) delete current.invoiceItems;
      current.invoiceItemsEnc = env;
      return write(current);
    });
  }

  // ----------------------------------------------------------------
  // W4-7 — invoiceTrend persistence (operations spine v1).
  //
  // Each saved invoice appends a slim summary entry to a 12-deep
  // ring buffer in MuntinContext.invoiceTrend so downstream tools
  // (Cost Pulse dashboard, Plate Cost stale banner, Margin Math
  // food-cost-band hint, GBP category-shift CTA) can compute drift,
  // share-shifts, and rolling medians from local data alone.
  //
  // Schema:
  //   { vendor, savedAt, totalsByCategory, parsedSum, itemCount }
  //
  // No item names, no SKUs, no raw OCR — only aggregates. Keeps the
  // entry under ~600 bytes typed so the 50KB-per-key Workshop budget
  // never gets squeezed even at full 12-entry capacity. Plaintext
  // (these are aggregates, not row-level data) but still device-
  // local; the W3-4 wrap covers row-level invoiceItems separately.
  // ----------------------------------------------------------------
  function pushTrendEntry(entry) {
    if (!entry || typeof entry !== 'object') return false;
    var slim = {
      vendor:           entry.vendor || null,
      savedAt:          entry.savedAt || Date.now(),
      totalsByCategory: entry.totalsByCategory || {},
      parsedSum:        +(entry.parsedSum || 0).toFixed(2),
      itemCount:        entry.itemCount || 0
    };
    var current = read();
    var trend = Array.isArray(current.invoiceTrend) ? current.invoiceTrend.slice() : [];
    trend.unshift(slim);             // newest first
    if (trend.length > 12) trend = trend.slice(0, 12);
    current.invoiceTrend = trend;
    return write(current);
  }

  function readTrend() {
    var current = read();
    return Array.isArray(current.invoiceTrend) ? current.invoiceTrend : [];
  }

  function readInvoiceItems() {
    var current = read();
    var env = current && current.invoiceItemsEnc;
    if (!env || !env.ct) return Promise.resolve(null);
    if (!root.MID_DEVICE_KEY || typeof root.MID_DEVICE_KEY.unwrap !== 'function') {
      return Promise.resolve(null);
    }
    return root.MID_DEVICE_KEY.unwrap(env).then(function (arr) {
      return Array.isArray(arr) ? arr : null;
    }).catch(function () {
      // Stale envelope (device-id rotated, key import failure, etc).
      // Resolve null rather than throwing — callers degrade to "no
      // last invoice" cleanly.
      return null;
    });
  }

  // ----------------------------------------------------------------
  // Wave 10.0d — storage budget contract.
  //
  // The MuntinContext payload sits in localStorage which the browser
  // caps at ~5 MB. Workshop quota concerns surface earlier — at
  // ~250 KB the read/write hot path starts measurably slowing on
  // older Android devices. Each ring-buffer cap below is sized so
  // the worst-case combined payload fits well under 200 KB:
  //
  //   invoiceTrend         12 × ~600 B          =   ~7 KB
  //   skuHistory          200 × 24 × ~120 B    =  ~58 KB  (stem store)
  //   contractPrices      100 × ~120 B          =  ~12 KB
  //   dishCostHistory      60 × 12 × ~80 B     =  ~58 KB  (per-dish ring)
  //   recipeStaleQueue    100 × ~150 B          =  ~15 KB
  //   skuMatchLearnings   100 × ~120 B          =  ~12 KB
  //   yieldLearnings      100 × ~80 B           =   ~8 KB
  //   invoiceLearnings    100 × ~100 B          =  ~10 KB
  //   invoiceItemsEnc      one envelope, capped at ~30 KB ciphertext
  //   miscellaneous flags / tokens                ~5 KB
  //                                              -------
  //                                              ~215 KB
  //
  // The latestByStem() projection is computed sync from skuHistory[0]
  // entries — no separate store, no extra bytes.
  //
  // Ring caps (RECIPE_*, etc) are exported so consumers can sanity-
  // check before writes; runtime enforcement happens inside each
  // helper's eviction logic.
  // ----------------------------------------------------------------
  var STORAGE_BUDGET = {
    DISH_COST_HISTORY_DISH_CAP:   60,
    DISH_COST_HISTORY_RING_DEPTH: 12,
    RECIPE_STALE_QUEUE_CAP:       100,
    SKU_MATCH_LEARNINGS_CAP:      100,
    YIELD_LEARNINGS_CAP:          100,
    SOFT_PAYLOAD_BYTES_TARGET:    200 * 1024
  };

  // Per-dish ring buffer write helper. Stores `{ts, foodCost,
  // foodCostPct, vendorTrigger}` slim entries for at-most
  // DISH_COST_HISTORY_RING_DEPTH revisions per dish, across at most
  // DISH_COST_HISTORY_DISH_CAP dishes (newest-touched-first eviction).
  function pushDishCostEntry(dishKey, entry) {
    if (!dishKey || !entry || typeof entry !== 'object') return false;
    var current = read();
    var map = (current && current.dishCostHistory) || {};
    var ring = Array.isArray(map[dishKey]) ? map[dishKey].slice() : [];
    ring.unshift({
      ts:           entry.ts || Date.now(),
      foodCost:     +(entry.foodCost || 0).toFixed(4),
      foodCostPct:  (typeof entry.foodCostPct === 'number') ? +entry.foodCostPct.toFixed(4) : null,
      vendorTrigger: entry.vendorTrigger || null
    });
    if (ring.length > STORAGE_BUDGET.DISH_COST_HISTORY_RING_DEPTH) {
      ring = ring.slice(0, STORAGE_BUDGET.DISH_COST_HISTORY_RING_DEPTH);
    }
    map[dishKey] = ring;
    // Evict oldest-touched dishes when we exceed the dish cap.
    var keys = Object.keys(map);
    if (keys.length > STORAGE_BUDGET.DISH_COST_HISTORY_DISH_CAP) {
      keys
        .map(function (k) { return { k: k, ts: (map[k][0] && map[k][0].ts) || 0 }; })
        .sort(function (a, b) { return a.ts - b.ts; })
        .slice(0, keys.length - STORAGE_BUDGET.DISH_COST_HISTORY_DISH_CAP)
        .forEach(function (e) { delete map[e.k]; });
    }
    current.dishCostHistory = map;
    return write(current);
  }

  function readDishCostHistory(dishKey) {
    var current = read();
    var map = (current && current.dishCostHistory) || {};
    if (!dishKey) return map;
    return Array.isArray(map[dishKey]) ? map[dishKey] : [];
  }

  // ----------------------------------------------------------------
  // Wave 10.3 (cross-tool sync read) — latestSkuByStem.
  //
  // Mirrors MID_SKU_HISTORY.latestByStem(), but lives on the context
  // bus so cross-tool consumers (Plate Cost, Menu Engineering,
  // Margin Math, Cost Pulse) don't need to load invoice-decoder
  // modules just to read the operator's own stem→latest-price
  // projection. Returns:
  //
  //   { [stem]: { perBaseUnit, baseUnit, vendor, ts, qty, unit, source } }
  //
  // Pure read — no side effects, no decrypt. Computed sync from the
  // existing skuHistory[stem][0] entries; no parallel store.
  // ----------------------------------------------------------------
  function latestSkuByStem(opts) {
    opts = opts || {};
    var current = read();
    var map = (current && current.skuHistory) || {};
    var out = {};
    var minObs = opts.minObservations || 1;
    var stems = Object.keys(map);
    for (var i = 0; i < stems.length; i++) {
      var stem = stems[i];
      var list = map[stem];
      if (!Array.isArray(list) || list.length < minObs) continue;
      var latest = list[0];
      if (!latest) continue;
      if (typeof latest.comparablePrice === 'number' && latest.comparableUnit) {
        out[stem] = {
          perBaseUnit: +latest.comparablePrice.toFixed(4),
          baseUnit:    latest.comparableUnit,
          vendor:      latest.vendor || null,
          ts:          latest.ts || 0,
          qty:         latest.qty || null,
          unit:        latest.unit || null,
          source:      'pack'
        };
      } else if (typeof latest.unitPrice === 'number' && latest.unit) {
        out[stem] = {
          perBaseUnit: +latest.unitPrice.toFixed(4),
          baseUnit:    String(latest.unit).toLowerCase(),
          vendor:      latest.vendor || null,
          ts:          latest.ts || 0,
          qty:         latest.qty || null,
          unit:        latest.unit || null,
          source:      'unit'
        };
      }
    }
    return out;
  }

  // ----------------------------------------------------------------
  // Wave 10.5 helper — recipeStaleQueue read/clear.
  //
  // Plate Cost's stale banner reads on cold load, decrements/dismisses
  // entries the operator handles. Pure helpers; runtime state lives
  // in MuntinContext.recipeStaleQueue.
  // ----------------------------------------------------------------
  function readRecipeStaleQueue() {
    var current = read();
    return Array.isArray(current && current.recipeStaleQueue) ? current.recipeStaleQueue : [];
  }
  function clearRecipeStaleQueue() {
    var current = read();
    if (current && Array.isArray(current.recipeStaleQueue)) {
      current.recipeStaleQueue = [];
      return write(current);
    }
    return true;
  }
  function ackRecipeStaleEntries(predicate) {
    if (typeof predicate !== 'function') return false;
    var current = read();
    if (!current || !Array.isArray(current.recipeStaleQueue)) return true;
    current.recipeStaleQueue = current.recipeStaleQueue.filter(function (e) {
      return !predicate(e);
    });
    return write(current);
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORAGE_BUDGET: STORAGE_BUDGET,
    read: read,
    write: write,
    merge: merge,
    get: get,
    clear: clear,
    subscribe: subscribe,
    writeInvoiceItems: writeInvoiceItems,
    readInvoiceItems:  readInvoiceItems,
    pushTrendEntry:    pushTrendEntry,
    readTrend:         readTrend,
    pushDishCostEntry:    pushDishCostEntry,
    readDishCostHistory:  readDishCostHistory,
    latestSkuByStem:      latestSkuByStem,
    readRecipeStaleQueue: readRecipeStaleQueue,
    clearRecipeStaleQueue: clearRecipeStaleQueue,
    ackRecipeStaleEntries: ackRecipeStaleEntries
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MuntinContext = api;
  }
})(typeof self !== 'undefined' ? self : this);
