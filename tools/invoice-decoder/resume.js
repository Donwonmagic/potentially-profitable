/**
 * Invoice Decoder — Resume / abandonment recovery (Wave 6.10).
 *
 * Persists a small "in-progress" record on each preprocessing-complete
 * event so an operator who closed the tab mid-flow can pick up where
 * they left off within a 24-hour window.
 *
 * Stored shape (IndexedDB → fallback localStorage):
 *   {
 *     savedAt: <ms epoch>,
 *     vendor: <string|null>,
 *     parsedRows: [...],            // pre-edit parsed rows
 *     pendingPagesMeta: [{name, size}, ...],   // metadata only, no
 *                                              // image bytes — those
 *                                              // would explode storage
 *     classification: {kind, profile, vendorHint, scannerHint}
 *   }
 *
 * Privacy posture: rows + classification only. Image bytes never
 * touch this store; the operator re-uploads the file if needed.
 * Single-record store keyed by 'in-progress'; cleared on save.
 */
(function (root) {
  'use strict';

  var DB_NAME = 'mtn-invoice-decoder';
  var STORE = 'resume';
  var KEY = 'in-progress';
  var TTL_MS = 24 * 60 * 60 * 1000;
  var LS_KEY = 'mtn:id-resume';

  function _openDb() {
    return new Promise(function (resolve, reject) {
      try {
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE);
          }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      } catch (err) { reject(err); }
    });
  }

  function _idbWrite(value) {
    return _openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        var st = tx.objectStore(STORE);
        st.put(value, KEY);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  function _idbRead() {
    return _openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var st = tx.objectStore(STORE);
        var r = st.get(KEY);
        r.onsuccess = function () { resolve(r.result || null); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }
  function _idbClear() {
    return _openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(KEY);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function save(record) {
    if (!record) return Promise.resolve();
    record.savedAt = Date.now();
    return _idbWrite(record).catch(function () {
      try { localStorage.setItem(LS_KEY, JSON.stringify(record)); } catch (_) {} // h8-exempt: aggregate metadata only, no image bytes
    });
  }
  function load() {
    return _idbRead().then(function (r) {
      if (r) return r;
      try {
        var raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (_) { return null; }
    }).then(function (r) {
      if (!r) return null;
      if (Date.now() - (r.savedAt || 0) > TTL_MS) {
        clear();
        return null;
      }
      return r;
    }).catch(function () { return null; });
  }
  function clear() {
    return _idbClear().catch(function () {}).then(function () {
      try { localStorage.removeItem(LS_KEY); } catch (_) {}
    });
  }

  var api = { save: save, load: load, clear: clear, _STORE: STORE, _KEY: KEY, _TTL_MS: TTL_MS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_RESUME = api;
})(typeof window !== 'undefined' ? window : null);
