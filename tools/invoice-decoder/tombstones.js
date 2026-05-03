/**
 * Invoice Decoder — Tombstone undo store (Wave 5.8).
 *
 * Records every save event so the operator can hit Undo within a
 * 7-day window — useful when an aggressive Trust-all bulk-confirm
 * surfaces a wrong row in next week's review.
 *
 * Storage: IndexedDB `invoice_tombstones` store with localStorage
 * fallback. Each tombstone holds the AAD + a snapshot of pre-save
 * row state + a deletedAt timestamp (null until the operator undoes).
 *
 * Privacy posture: tombstones live entirely on the device. They store
 * the same row data the operator just chose to save anyway, so no
 * additional surface. Auto-GC after 7 days keeps the store bounded.
 */
(function (root) {
  'use strict';

  var DB_NAME = 'mtn-invoice-decoder-tomb';
  var STORE = 'invoice_tombstones';
  var TTL_MS = 7 * 24 * 60 * 60 * 1000;
  var LS_KEY = 'mtn:id-tombstones';

  function _openDb() {
    return new Promise(function (resolve, reject) {
      try {
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (!db.objectStoreNames.contains(STORE)) {
            var st = db.createObjectStore(STORE, { keyPath: 'aad' });
            st.createIndex('savedAt', 'savedAt', { unique: false });
          }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      } catch (err) { reject(err); }
    });
  }

  // Add a tombstone for a fresh save.
  function record(entry) {
    if (!entry || !entry.aad) return Promise.resolve(false);
    entry.savedAt = Date.now();
    entry.deletedAt = null;
    return _openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(entry);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(_lsRecord(entry)); };
      });
    }).catch(function () { return _lsRecord(entry); });
  }
  function _lsRecord(entry) {
    try {
      var raw = localStorage.getItem(LS_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      arr.push(entry);
      // Cap LS fallback at 50 entries.
      if (arr.length > 50) arr = arr.slice(-50);
      localStorage.setItem(LS_KEY, JSON.stringify(arr)); // h8-exempt: aggregate row snapshots, on-device only
      return true;
    } catch (_) { return false; }
  }

  // Mark a tombstone as deleted (operator pressed Undo). Caller is
  // responsible for the actual server-side delete; this just records
  // intent and the timestamp.
  function markDeleted(aad) {
    if (!aad) return Promise.resolve(false);
    return _openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(STORE, 'readwrite');
        var st = tx.objectStore(STORE);
        var get = st.get(aad);
        get.onsuccess = function () {
          var rec = get.result;
          if (!rec) { resolve(false); return; }
          rec.deletedAt = Date.now();
          st.put(rec);
        };
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      });
    }).catch(function () { return false; });
  }

  function lookup(aad) {
    if (!aad) return Promise.resolve(null);
    return _openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(STORE, 'readonly');
        var r = tx.objectStore(STORE).get(aad);
        r.onsuccess = function () { resolve(r.result || null); };
        r.onerror = function () { resolve(null); };
      });
    }).catch(function () { return null; });
  }

  function listRecent(maxN) {
    maxN = maxN || 20;
    return _openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(STORE, 'readonly');
        var idx = tx.objectStore(STORE).index('savedAt');
        var req = idx.openCursor(null, 'prev');
        var out = [];
        req.onsuccess = function () {
          var cur = req.result;
          if (!cur || out.length >= maxN) { resolve(out); return; }
          out.push(cur.value);
          cur.continue();
        };
        req.onerror = function () { resolve(out); };
      });
    }).catch(function () { return []; });
  }

  // Sweep tombstones older than TTL. Runs opportunistically on init.
  function gc() {
    var cutoff = Date.now() - TTL_MS;
    return _openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(STORE, 'readwrite');
        var idx = tx.objectStore(STORE).index('savedAt');
        var range = IDBKeyRange.upperBound(cutoff);
        var req = idx.openCursor(range);
        var purged = 0;
        req.onsuccess = function () {
          var cur = req.result;
          if (!cur) { resolve(purged); return; }
          cur.delete();
          purged++;
          cur.continue();
        };
        req.onerror = function () { resolve(purged); };
      });
    }).catch(function () { return 0; });
  }

  // Run GC on module load.
  if (typeof root !== 'undefined' && root && root.indexedDB) {
    setTimeout(function () { gc().catch(function () {}); }, 5000);
  }

  var api = {
    record:      record,
    markDeleted: markDeleted,
    lookup:      lookup,
    listRecent:  listRecent,
    gc:          gc,
    _STORE:      STORE,
    _TTL_MS:     TTL_MS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_TOMBSTONES = api;
})(typeof window !== 'undefined' ? window : null);
