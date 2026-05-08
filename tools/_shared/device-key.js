/**
 * Invoice Decoder — per-device AES-GCM wrap for localStorage handoff
 * (Phase 7 W3-4).
 *
 * The privacy contradiction: Wave B6-4 ships an encrypted server-side
 * envelope, but the cross-tool handoff (`MuntinContext.merge({
 * invoiceItems: slim })`) writes the same dish names + prices to
 * localStorage IN PLAINTEXT so Plate Cost / Menu Engineering / Margin
 * Math can pre-fill from the last invoice. That broke the claim.
 *
 * Threat model honestly stated: this is at-rest obfuscation against
 * an extension or sibling tool casually grepping localStorage for
 * "ground chuck" or "$48.00". A determined co-resident attacker can
 * read the device-id, re-derive the key, and decrypt — that's not
 * what we're defending against. We're defending the marketing claim
 * that invoice CONTENTS aren't sitting plaintext in the browser
 * profile.
 *
 * Algorithm:
 *   - Per-device IKM lives in localStorage['mtn:device-id'] (random
 *     UUID, generated once on first save, never sent anywhere).
 *   - HKDF-SHA256 over the IKM to a 32-byte AES-GCM key. Derived
 *     once per session, cached in module-scope. The localStorage
 *     value is the SECRET INPUT, not the cryptographic key.
 *   - AES-GCM-256 with random 96-bit IV per write. AAD = "mtn-device-v1".
 *
 * Privacy posture: zero fetch. SubtleCrypto only.
 */
(function (root) {
  'use strict';

  var DEVICE_ID_KEY = 'mtn:device-id';
  var AAD = 'mtn-device-v1';
  var INFO = 'muntin-device-key-v1';
  var __derivedKey = null;

  function getCrypto() {
    return (root && root.crypto && root.crypto.subtle) ? root.crypto : null;
  }

  function strToBytes(s) {
    return new TextEncoder().encode(String(s || ''));
  }
  function bytesToStr(b) {
    return new TextDecoder().decode(b);
  }
  function bytesToBase64(b) {
    var bin = '';
    for (var i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
    return root.btoa(bin);
  }
  function base64ToBytes(s) {
    var bin = root.atob(String(s || ''));
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // Lazy device-id provisioning — created on first wrap, persisted
  // forever after. crypto.randomUUID is available everywhere we
  // support; fall back to RNG bytes hex-formatted on older runtimes.
  function ensureDeviceId() {
    try {
      var existing = localStorage.getItem(DEVICE_ID_KEY); // h8-exempt: device-id read; not exfiltrated
      if (existing) return existing;
      var id;
      if (root.crypto && typeof root.crypto.randomUUID === 'function') {
        id = root.crypto.randomUUID();
      } else if (root.crypto && root.crypto.getRandomValues) {
        var b = new Uint8Array(16);
        root.crypto.getRandomValues(b);
        id = Array.prototype.map.call(b, function (x) {
          return ('0' + x.toString(16)).slice(-2);
        }).join('');
      } else {
        id = String(Date.now()) + Math.random().toString(36).slice(2);
      }
      localStorage.setItem(DEVICE_ID_KEY, id); // h8-exempt: device-id; never sent over network
      return id;
    } catch (_) {
      return null;
    }
  }

  // HKDF-SHA256(IKM, salt='', info='muntin-device-key-v1') → 32B
  // SubtleCrypto exposes HKDF directly; use it instead of a manual
  // PBKDF2 since this isn't password-derived.
  function deriveKey() {
    if (__derivedKey) return Promise.resolve(__derivedKey);
    var c = getCrypto();
    if (!c) return Promise.reject(new Error('SubtleCrypto unavailable'));
    var deviceId = ensureDeviceId();
    if (!deviceId) return Promise.reject(new Error('localStorage unavailable'));
    return c.subtle.importKey(
      'raw',
      strToBytes(deviceId),
      { name: 'HKDF' },
      false,
      ['deriveKey']
    ).then(function (ikm) {
      return c.subtle.deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: new Uint8Array(0),
          info: strToBytes(INFO)
        },
        ikm,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }).then(function (key) {
      __derivedKey = key;
      return key;
    });
  }

  function wrap(obj) {
    var c = getCrypto();
    if (!c) return Promise.reject(new Error('SubtleCrypto unavailable'));
    return deriveKey().then(function (key) {
      var iv = new Uint8Array(12);
      c.getRandomValues(iv);
      var pt = strToBytes(JSON.stringify(obj == null ? null : obj));
      return c.subtle.encrypt(
        { name: 'AES-GCM', iv: iv, additionalData: strToBytes(AAD) },
        key,
        pt
      ).then(function (ctBuf) {
        return {
          v: 1,
          iv: bytesToBase64(iv),
          ct: bytesToBase64(new Uint8Array(ctBuf))
        };
      });
    });
  }

  function unwrap(env) {
    if (!env || env.v !== 1 || !env.iv || !env.ct) {
      return Promise.reject(new Error('unsupported envelope'));
    }
    var c = getCrypto();
    if (!c) return Promise.reject(new Error('SubtleCrypto unavailable'));
    return deriveKey().then(function (key) {
      var iv = base64ToBytes(env.iv);
      var ct = base64ToBytes(env.ct);
      return c.subtle.decrypt(
        { name: 'AES-GCM', iv: iv, additionalData: strToBytes(AAD) },
        key,
        ct
      ).then(function (ptBuf) {
        var json = bytesToStr(new Uint8Array(ptBuf));
        try { return JSON.parse(json); }
        catch (_) { return null; }
      });
    });
  }

  function clearDeviceKey() {
    __derivedKey = null;
    try { localStorage.removeItem(DEVICE_ID_KEY); } catch (_) {}
  }

  // One-shot migration: if a previous (plaintext) MuntinContext write
  // left an `invoiceItems` array in `mtn:context`, scrub it. The
  // updated invoice-decoder save handler writes the wrapped envelope
  // under a different field (`invoiceItemsEnc`) so the plaintext
  // shape is gone forever after the next save. This call is a
  // best-effort scrub on tool load — invoked from the boot of
  // tools/invoice-decoder/invoice-decoder.js.
  function migratePlaintextInvoiceItems() {
    try {
      if (typeof root.MuntinContext === 'undefined') return;
      var ctx = root.MuntinContext.read() || {};
      if (Array.isArray(ctx.invoiceItems)) {
        // Wipe the plaintext field; do NOT re-wrap (we have no
        // assurance the operator wants those rows preserved without
        // a fresh save).
        root.MuntinContext.merge({ invoiceItems: null });
      }
    } catch (_) {}
  }

  var api = {
    wrap:                       wrap,
    unwrap:                     unwrap,
    deriveKey:                  deriveKey,
    clearDeviceKey:             clearDeviceKey,
    migratePlaintextInvoiceItems: migratePlaintextInvoiceItems
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_DEVICE_KEY = api;
})(typeof window !== 'undefined' ? window : null);
