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

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    read: read,
    write: write,
    merge: merge,
    get: get,
    clear: clear,
    subscribe: subscribe,
    writeInvoiceItems: writeInvoiceItems,
    readInvoiceItems:  readInvoiceItems
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MuntinContext = api;
  }
})(typeof self !== 'undefined' ? self : this);
