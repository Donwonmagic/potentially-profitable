/**
 * Proactive push layer (Wave E).
 *
 * Surfaces actionable intelligence WITHOUT the operator opening the
 * tool. Critical: this layer uses ONLY local notifications via
 * ServiceWorkerRegistration.showNotification(). No Web Push API,
 * no FCM/APNs gateway, no server endpoint. Bodies assemble on-device
 * from MuntinContext data the operator has already seen. The
 * Wave 8.6 egress sentinel keeps holding.
 *
 * Lifecycle:
 *   - Page-load reckon (primary): on DOMContentLoaded, evaluate every
 *     trigger against current MuntinContext + invoiceTrend. Any
 *     fired trigger renders an in-app return banner immediately AND
 *     queues a notification (delivered if permission granted).
 *   - Save-time reckon: invoice-decoder.js calls reckon({immediate:
 *     true}) at the tail of the save flow — the moment T1/T2/T4 are
 *     most likely to fire.
 *   - SW periodicsync (when supported): the page writes a
 *     precomputed "snapshot" to a Cache; the SW reads on
 *     periodicsync('mid-reckon') and dispatches stored notifications.
 *
 * iOS Safari fallback chain:
 *   1. PWA + iOS 16.4+ → permission earned + notifications work.
 *   2. Non-PWA iOS → silent: skip permission prompt, rely on
 *      in-app return banner on next visit.
 *   3. Soft "Add to Home Screen for reminders" nudge once.
 *
 * Opt-in flow:
 *   - Permission prompted ONLY after invoice #3 saved AND first
 *     in-app banner has fired in this session. CTA in that banner
 *     handles requestPermission() (user-gesture requirement).
 *
 * Trigger taxonomy + thresholds: see TRIGGERS below.
 *
 * Privacy: notification bodies assembled on-device via
 * MID_NOTIFY_TEMPLATES with privacy-guard fill. Click-through deep
 * links carry only short SHA-1 prefix hashes; the page reverses via
 * MuntinContext.read() lookup. Plaintext stem/vendor names never
 * appear in URLs or notification props.
 */
(function (root) {
  'use strict';

  if (!root || !root.document) return;

  var STORAGE_KEY = 'mtn:id-notify-state';
  var DEFAULT_PREFS = {
    enabled:       false,
    mutedTriggers: [],
    mutedVendors:  [],
    mutedStems:    [],
    quietHours:    { start: 22, end: 7 },
    digestTime:    21,
    weeklyDay:     0
  };

  // Cooldown (per trigger × stem/vendor key) — same trigger cannot
  // fire more than once per 7d.
  var COOLDOWN_MS = 7 * 86400000;

  // ---------- Storage ----------

  function _readState() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { prefs: Object.assign({}, DEFAULT_PREFS), cooldowns: {}, lastDailyFiredOn: null, lastWeeklyFiredOn: null };
      var s = JSON.parse(raw);
      s.prefs = Object.assign({}, DEFAULT_PREFS, s.prefs || {});
      s.cooldowns = s.cooldowns || {};
      return s;
    } catch (_) {
      return { prefs: Object.assign({}, DEFAULT_PREFS), cooldowns: {}, lastDailyFiredOn: null, lastWeeklyFiredOn: null };
    }
  }
  function _writeState(s) {
    try { root.localStorage && root.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } // h8-exempt: notify state, on-device only
    catch (_) {}
  }
  function _ctx() { return root.MuntinContext; }
  function _invoicesSaved() {
    if (root.MID_TELEMETRY && root.MID_TELEMETRY.get) return root.MID_TELEMETRY.get('invoicesSaved') || 0;
    return 0;
  }

  // ---------- Trigger evaluators ----------
  // Each returns an array of {triggerId, key, body, title, deepLink}
  // or [] when nothing fires.

  function _evalDrift() {
    var ctx = _ctx();
    if (!ctx || !ctx.read) return [];
    var data = ctx.read() || {};
    var skuMap = data.skuHistory || {};
    var out = [];
    Object.keys(skuMap).forEach(function (stem) {
      var list = skuMap[stem];
      if (!Array.isArray(list) || list.length < 4) return;
      var prices = list.map(function (e) { return e.unitPrice; }).filter(function (p) { return typeof p === 'number'; });
      if (prices.length < 4) return;
      var sorted = prices.slice().sort(function (a, b) { return a - b; });
      var med = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
      var current = list[0].unitPrice;
      if (!med || !current) return;
      var deltaPct = ((current - med) / med) * 100;
      if (Math.abs(deltaPct) < 15) return;
      // Estimate $ impact: |delta| × monthly qty
      var thirtyDaysAgo = Date.now() - 30 * 86400000;
      var monthlyQty = list.filter(function (e) { return e.ts > thirtyDaysAgo; }).reduce(function (s, e) { return s + (e.qty || 1); }, 0);
      var dollarImpact = Math.abs(current - med) * monthlyQty;
      if (dollarImpact < 50) return;
      out.push({
        triggerId: 'DRIFT',
        key:       'DRIFT:' + stem,
        body:      { stem: stem, pct: Math.abs(deltaPct).toFixed(0), impact: dollarImpact.toFixed(0) },
        deepLink:  '/tools/invoice-decoder/?focus=stem&stem=' + encodeURIComponent(_shortHash(stem))
      });
    });
    return out;
  }

  function _evalOvercharge() {
    var ctx = _ctx();
    if (!ctx || !ctx.read) return [];
    var data = ctx.read() || {};
    var trend = (ctx.readTrend ? ctx.readTrend() : (data.invoiceTrend || [])) || [];
    if (!trend.length) return [];
    // Cumulative monthly overage requires per-row checks. We approximate
    // via skuHistory entries vs contractPrices — sum overcharges for
    // entries within last 30 days where stem has a contract.
    var thirtyDaysAgo = Date.now() - 30 * 86400000;
    var byVendor = {};
    var contracts = data.contractPrices || {};
    Object.keys(data.skuHistory || {}).forEach(function (stem) {
      var c = contracts[stem];
      if (!c || typeof c.unitPrice !== 'number') return;
      var entries = (data.skuHistory[stem] || []).filter(function (e) { return e.ts > thirtyDaysAgo; });
      entries.forEach(function (e) {
        if (typeof e.unitPrice !== 'number' || !e.vendor) return;
        var diff = e.unitPrice - c.unitPrice;
        if (diff <= 0) return;
        var qty = e.qty || 1;
        byVendor[e.vendor] = (byVendor[e.vendor] || 0) + diff * qty;
      });
    });
    var out = [];
    Object.keys(byVendor).forEach(function (vendor) {
      if (byVendor[vendor] < 100) return;
      out.push({
        triggerId: 'OVERCHARGE',
        key:       'OVERCHARGE:' + vendor,
        body:      { vendor: vendor, over: byVendor[vendor].toFixed(0) },
        deepLink:  '/workbench/?filter=overcharge&vendor=' + encodeURIComponent(_shortHash(vendor))
      });
    });
    return out;
  }

  function _evalReliability() {
    if (!root.MID_INSIGHTS || !root.MID_INSIGHTS.supplierHealth) return [];
    var ctx = _ctx();
    if (!ctx) return [];
    var trend = ctx.readTrend ? ctx.readTrend() : [];
    var vendors = {};
    trend.forEach(function (e) { if (e.vendor) vendors[e.vendor] = true; });
    var out = [];
    Object.keys(vendors).forEach(function (vendor) {
      var h;
      try { h = root.MID_INSIGHTS.supplierHealth(vendor); } catch (_) { return; }
      if (!h || h.score >= 85) return;
      if (h.stats.invoicesSeen < 5) return;
      out.push({
        triggerId: 'RELIABILITY',
        key:       'RELIABILITY:' + vendor,
        body:      { vendor: vendor, score: h.score },
        deepLink:  '/workbench/?vendor=' + encodeURIComponent(_shortHash(vendor)) + '&panel=health'
      });
    });
    return out;
  }

  function _evalMargin() {
    if (!root.MuntinDishDrift || !root.MuntinDishDrift.compute) return [];
    var drift;
    try { drift = root.MuntinDishDrift.compute(); } catch (_) { return []; }
    if (!drift || !Array.isArray(drift.dishes)) return [];
    var out = [];
    drift.dishes.forEach(function (d) {
      if (!d || typeof d.deltaPct !== 'number') return;
      var pp = (d.afterPct - d.beforePct);
      if (Math.abs(pp) < 3) return;
      out.push({
        triggerId: 'MARGIN',
        key:       'MARGIN:' + (d.name || ''),
        body:      { dish: d.name, pp: pp.toFixed(1) },
        deepLink:  '/tools/plate-cost/?dish=' + encodeURIComponent(_shortHash(d.name))
      });
    });
    return out;
  }

  function _evalDailyDigest(state) {
    var ctx = _ctx();
    if (!ctx) return [];
    var trend = ctx.readTrend ? ctx.readTrend() : [];
    if (!trend.length) return [];
    var todayKey = _todayKey();
    if (state.lastDailyFiredOn === todayKey) return [];
    var dayStart = _startOfDay();
    var todayInvoices = trend.filter(function (e) { return e.savedAt >= dayStart; });
    if (!todayInvoices.length) return [];
    var spend = todayInvoices.reduce(function (s, e) { return s + (e.parsedSum || 0); }, 0);
    // Top mover from today's invoices' SKUs — approximate.
    var movers = (root.MID_SKU_HISTORY && root.MID_SKU_HISTORY.topMovers && trend[0] && trend[0].rows)
      ? root.MID_SKU_HISTORY.topMovers(trend[0].rows, { max: 3 }).length : 0;
    return [{
      triggerId: 'DAILY',
      key:       'DAILY:' + todayKey,
      body:      { spend: Math.round(spend), n: todayInvoices.length, movers: movers },
      deepLink:  '/workbench/?digest=today'
    }];
  }

  function _evalWeeklyDigest(state) {
    var ctx = _ctx();
    if (!ctx) return [];
    var trend = ctx.readTrend ? ctx.readTrend() : [];
    if (!trend.length) return [];
    var nowD = new Date();
    if (nowD.getDay() !== state.prefs.weeklyDay) return [];
    var weekKey = _weekKey();
    if (state.lastWeeklyFiredOn === weekKey) return [];
    var weekAgo = Date.now() - 7 * 86400000;
    var thisWeek = trend.filter(function (e) { return e.savedAt >= weekAgo; });
    if (thisWeek.length < 3) return [];
    var spend = thisWeek.reduce(function (s, e) { return s + (e.parsedSum || 0); }, 0);
    // Pick top mover stem from skuHistory drift.
    var topStem = null, topPct = 0;
    var data = ctx.read ? ctx.read() : {};
    Object.keys(data.skuHistory || {}).forEach(function (stem) {
      var list = data.skuHistory[stem];
      if (!Array.isArray(list) || list.length < 3) return;
      var p0 = list[0].unitPrice, p1 = list[Math.min(list.length - 1, 4)].unitPrice;
      if (!p0 || !p1) return;
      var d = ((p0 - p1) / p1) * 100;
      if (Math.abs(d) > Math.abs(topPct)) { topPct = d; topStem = stem; }
    });
    return [{
      triggerId: 'WEEKLY',
      key:       'WEEKLY:' + weekKey,
      body:      { spend: Math.round(spend), stem: topStem || '', pct: topPct ? Math.round(topPct) : 0 },
      deepLink:  '/workbench/?digest=week'
    }];
  }

  // ---------- Helpers ----------

  function _shortHash(s) {
    var h = 5381;
    var str = String(s || '');
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36).slice(0, 8);
  }
  function _startOfDay() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  function _todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function _weekKey() {
    var d = new Date();
    var jan1 = new Date(d.getFullYear(), 0, 1);
    var week = Math.ceil((((d - jan1) / 86400000) + jan1.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + week;
  }
  function _isQuiet(prefs) {
    var h = new Date().getHours();
    var s = prefs.quietHours.start, e = prefs.quietHours.end;
    if (s === e) return false;
    if (s < e) return h >= s && h < e;
    return h >= s || h < e;
  }
  function _isMuted(prefs, item) {
    if (prefs.mutedTriggers.indexOf(item.triggerId) !== -1) return true;
    var b = item.body || {};
    if (b.vendor && prefs.mutedVendors.indexOf(b.vendor) !== -1) return true;
    if (b.stem && prefs.mutedStems.indexOf(b.stem) !== -1) return true;
    return false;
  }

  // ---------- Reckon ----------

  function reckon(opts) {
    opts = opts || {};
    var state = _readState();

    // Merge collected items.
    var items = [].concat(
      _evalDrift(),
      _evalOvercharge(),
      _evalReliability(),
      _evalMargin(),
      _evalDailyDigest(state),
      _evalWeeklyDigest(state)
    );
    if (!items.length) return [];

    // Cooldown filter.
    var now = Date.now();
    var passed = items.filter(function (it) {
      var lastFired = state.cooldowns[it.key] || 0;
      if (now - lastFired < COOLDOWN_MS) return false;
      if (_isMuted(state.prefs, it)) return false;
      return true;
    });
    if (!passed.length) return [];

    // Render each item — banner + (notif when allowed).
    var allowNotifications = state.prefs.enabled
      && root.Notification
      && root.Notification.permission === 'granted'
      && !_isQuiet(state.prefs);

    passed.forEach(function (it) {
      _renderBanner(it);
      if (allowNotifications) _showNotification(it);
      state.cooldowns[it.key] = now;
      if (it.triggerId === 'DAILY')  state.lastDailyFiredOn  = _todayKey();
      if (it.triggerId === 'WEEKLY') state.lastWeeklyFiredOn = _weekKey();
    });
    _writeState(state);

    // Opt-in nudge: invoice #3+ AND at least one banner just rendered.
    if (!state.prefs.enabled && _invoicesSaved() >= 3) {
      _showOptInNudge();
    }
    return passed;
  }

  // ---------- In-app banner ----------

  function _renderBanner(item) {
    var host = root.document.getElementById('idResume');
    if (!host) return;
    if (host.querySelector && host.querySelector('[data-proactive="' + item.key + '"]')) return;
    var T = root.MID_NOTIFY_TEMPLATES;
    if (!T) return;
    var body = T.build(item.triggerId, item.body || {});
    if (!body) return;
    var note = root.document.createElement('div');
    note.setAttribute('data-proactive', item.key);
    note.style.cssText = 'margin:6px 0;padding:10px 12px;background:#FFF6E5;border:1px solid #E8C97A;border-left:3px solid #B25C2A;border-radius:8px;font-size:13.5px;color:#14161A';
    note.innerHTML = '<strong>' + _esc(T.title(item.triggerId)) + '.</strong> ' + _esc(body);
    host.appendChild(note);
    host.hidden = false;
  }
  function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---------- Notification ----------

  function _showNotification(item) {
    if (!root.navigator || !root.navigator.serviceWorker) return;
    root.navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg || !reg.showNotification) return;
      var T = root.MID_NOTIFY_TEMPLATES;
      var body  = T && T.build(item.triggerId, item.body || {});
      var title = T && T.title(item.triggerId);
      if (!body || !title) return;
      reg.showNotification(title, {
        body:    body,
        icon:    '/tools/invoice-decoder/icon-192.png',
        badge:   '/tools/invoice-decoder/icon-192.png',
        tag:     item.key,
        data:    { deepLink: item.deepLink, triggerId: item.triggerId },
        silent:  false
      }).catch(function () {});
    }).catch(function () {});
  }

  // ---------- Opt-in nudge ----------

  function _showOptInNudge() {
    var host = root.document.getElementById('idResume');
    if (!host) return;
    if (host.querySelector && host.querySelector('[data-proactive-optin]')) return;
    var es = (root.document.documentElement.lang || 'en').toLowerCase().slice(0, 2) === 'es';
    var msg = es
      ? '¿Quieres avisos cuando los precios se muevan? Los avisos se envían desde tu dispositivo, sin servidor.'
      : 'Want a heads-up when prices move? Notifications fire from your device — no server.';
    var ctaLabel = es ? 'Activar avisos' : 'Enable alerts';
    var nudge = root.document.createElement('div');
    nudge.setAttribute('data-proactive-optin', 'true');
    nudge.style.cssText = 'margin:6px 0;padding:10px 12px;background:#FAF6EE;border:1px solid #d6d2c2;border-left:3px solid #1F4E5B;border-radius:8px;font-size:13.5px;color:#14161A';
    nudge.innerHTML = _esc(msg) + ' <button type="button" data-proactive-enable style="margin-left:8px;padding:5px 11px;border-radius:6px;border:1px solid #1F4E5B;background:#1F4E5B;color:#fff;font-size:12px;cursor:pointer">' + _esc(ctaLabel) + '</button>';
    host.appendChild(nudge);
    host.hidden = false;
    var btn = nudge.querySelector('[data-proactive-enable]');
    if (btn) btn.addEventListener('click', enable);
  }

  function enable() {
    if (!root.Notification || !root.Notification.requestPermission) return Promise.resolve(false);
    return root.Notification.requestPermission().then(function (perm) {
      var state = _readState();
      state.prefs.enabled = (perm === 'granted');
      _writeState(state);
      if (perm === 'granted') {
        // Try to register periodicsync if supported.
        if (root.navigator && root.navigator.serviceWorker) {
          root.navigator.serviceWorker.ready.then(function (reg) {
            if (reg.periodicSync && reg.periodicSync.register) {
              reg.periodicSync.register('mid-reckon', { minInterval: 12 * 3600 * 1000 }).catch(function () {});
            }
          });
        }
      }
      return perm === 'granted';
    });
  }
  function disable() {
    var state = _readState();
    state.prefs.enabled = false;
    _writeState(state);
  }

  function setPrefs(patch) {
    var state = _readState();
    state.prefs = Object.assign({}, state.prefs, patch || {});
    _writeState(state);
  }
  function getPrefs() { return _readState().prefs; }

  // ---------- Page-load wiring ----------

  function _ready(fn) {
    if (root.document.readyState !== 'loading') fn();
    else root.document.addEventListener('DOMContentLoaded', fn);
  }
  _ready(function () {
    // Defer 600ms so the first render completes before we evaluate.
    setTimeout(function () { try { reckon(); } catch (_) {} }, 600);
  });

  var api = {
    reckon:   reckon,
    enable:   enable,
    disable:  disable,
    setPrefs: setPrefs,
    getPrefs: getPrefs,
    _evals: {
      drift:       _evalDrift,
      overcharge:  _evalOvercharge,
      reliability: _evalReliability,
      margin:      _evalMargin
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PROACTIVE = api;
})(typeof window !== 'undefined' ? window : null);
