/**
 * Quota-aware localStorage helpers.
 *
 * Every Wave 5+ feature in the suite persists state to localStorage:
 * MuntinContext (cost trend, sku history, contract prices, dish cost
 * history, watches, dismissals), invoice telemetry counters,
 * onboarding flags, abandonment-resume records, capture-coach
 * preferences, device-tier toggle, notification state. Each path
 * called localStorage.setItem inside try/catch, but a thrown
 * QuotaExceededError was treated identically to "key not found" —
 * the write was just dropped and the operator never knew their
 * tool had quietly stopped learning.
 *
 * This module exposes:
 *
 *   MuntinSafeStorage.set(key, value, opts)
 *     → 'ok' | 'quota-exceeded' | 'unavailable'
 *
 *   MuntinSafeStorage.get(key, fallback)
 *     → string | fallback
 *
 *   MuntinSafeStorage.evict(pattern, opts)
 *     → number of keys removed
 *
 *   MuntinSafeStorage.usage()
 *     → { bytes, items, percent } (best-effort estimate)
 *
 *   MuntinSafeStorage.subscribe('quota-warning', fn)
 *     fires when a write fails with QuotaExceededError. UI surfaces
 *     can subscribe to show a one-time banner.
 *
 * Privacy: pure local read/write of the operator's own browser
 * storage. No fetch, no network, same posture as every other
 * Wave 5+ module.
 */
(function (root) {
  'use strict';

  var QUOTA_WARN_THRESHOLD = 0.85;          // 85% of estimated cap
  var ASSUMED_CAP_BYTES    = 5 * 1024 * 1024; // typical browser cap

  var __listeners = { 'quota-warning': [] };

  function _ls() {
    if (typeof root === 'undefined' || !root) return null;
    try { return root.localStorage; } catch (_) { return null; }
  }

  function _isQuotaError(err) {
    if (!err) return false;
    if (err.name === 'QuotaExceededError') return true;
    if (err.name === 'NS_ERROR_DOM_QUOTA_REACHED') return true;
    if (err.code === 22 || err.code === 1014) return true;
    return /quota|exceeded/i.test(String(err.message || ''));
  }

  function _notifyQuota(detail) {
    (__listeners['quota-warning'] || []).forEach(function (fn) {
      try { fn(detail); } catch (_) {}
    });
  }

  function set(key, value, opts) {
    var ls = _ls();
    if (!ls) return 'unavailable';
    opts = opts || {};
    try {
      ls.setItem(key, value);
      return 'ok';
    } catch (err) {
      if (!_isQuotaError(err)) return 'unavailable';
      // Try one round of eviction if a pattern was suggested.
      if (opts.evictPattern) {
        try { evict(opts.evictPattern, { keep: opts.keep || 0 }); }
        catch (_) {}
        try {
          ls.setItem(key, value);
          return 'ok';
        } catch (_) {}
      }
      _notifyQuota({ key: key, sizeChars: (value && value.length) || 0 });
      return 'quota-exceeded';
    }
  }

  function get(key, fallback) {
    var ls = _ls();
    if (!ls) return fallback != null ? fallback : null;
    try {
      var v = ls.getItem(key);
      return v == null ? (fallback != null ? fallback : null) : v;
    } catch (_) {
      return fallback != null ? fallback : null;
    }
  }

  function remove(key) {
    var ls = _ls();
    if (!ls) return false;
    try { ls.removeItem(key); return true; } catch (_) { return false; }
  }

  // Evict keys matching a regex (or string substring). Optional
  // `keep` argument retains the N most-recently-set keys (writes time
  // stamp on each set when opts.touch is on — but we don't track
  // timestamps yet, so keep is interpreted as "leave the last N keys
  // by lexical order").
  function evict(pattern, opts) {
    var ls = _ls();
    if (!ls) return 0;
    opts = opts || {};
    var rx = pattern instanceof RegExp ? pattern :
             (typeof pattern === 'string' ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) : null);
    if (!rx) return 0;
    var hits = [];
    try {
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && rx.test(k)) hits.push(k);
      }
    } catch (_) { return 0; }
    if (opts.keep && opts.keep > 0) hits = hits.slice(0, Math.max(0, hits.length - opts.keep));
    var removed = 0;
    hits.forEach(function (k) {
      try { ls.removeItem(k); removed++; } catch (_) {}
    });
    return removed;
  }

  // Best-effort estimate. Walks every key + value, sums character
  // length × 2 (UTF-16 in-memory). Cheap; called only on demand.
  function usage() {
    var ls = _ls();
    if (!ls) return { bytes: 0, items: 0, percent: 0 };
    var bytes = 0, items = 0;
    try {
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        var v = k && ls.getItem(k);
        if (k) bytes += k.length * 2;
        if (v) bytes += v.length * 2;
        items++;
      }
    } catch (_) {}
    return {
      bytes:   bytes,
      items:   items,
      percent: +(bytes / ASSUMED_CAP_BYTES).toFixed(3)
    };
  }

  function subscribe(event, fn) {
    if (typeof fn !== 'function') return;
    if (!__listeners[event]) __listeners[event] = [];
    __listeners[event].push(fn);
  }

  // Detect when usage is approaching the cap — useful before a known-
  // large write (e.g., MuntinContext.merge with a fresh skuHistory
  // entry) to proactively evict cold keys.
  function isNearQuota() {
    var u = usage();
    return u.percent >= QUOTA_WARN_THRESHOLD;
  }

  var api = {
    set:           set,
    get:           get,
    remove:        remove,
    evict:         evict,
    usage:         usage,
    isNearQuota:   isNearQuota,
    subscribe:     subscribe,
    _isQuotaError: _isQuotaError,
    QUOTA_WARN_THRESHOLD: QUOTA_WARN_THRESHOLD,
    ASSUMED_CAP_BYTES:    ASSUMED_CAP_BYTES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuntinSafeStorage = api;
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null));
