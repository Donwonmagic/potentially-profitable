/**
 * Invoice Decoder — client-side envelope encryption (Wave B6-2).
 *
 * AES-GCM 256 over plaintext invoice payloads. Key is derived in
 * the browser from a passphrase the operator supplies once per
 * session (B6-3 wires the UI prompt). Server stores ciphertext
 * + iv only; plaintext never crosses the wire.
 *
 * Threat model is operator-aligned: someone who has the operator's
 * sign-in cookie should still NOT be able to read past invoices
 * without the passphrase. The server has no decryption capability.
 *
 * Privacy: SubtleCrypto runs in the browser. No fetch from this
 * module. The check-tool-no-fetch invariant remains satisfied.
 *
 * Algorithms:
 *   PBKDF2-SHA256, 250000 iterations, 16-byte salt → 32-byte AES key
 *   AES-GCM with random 12-byte IV per write, AAD = sub || itemId
 *
 * Wire format (base64-everything):
 *   { v: 1, salt, iv, ct, aad }
 * v: 1 lets a future migration drop in higher iteration counts
 * or a different KDF without breaking existing reads.
 */
(function (root) {
  'use strict';

  function bytesToBase64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function base64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function strToBytes(s) {
    return new TextEncoder().encode(s);
  }
  function bytesToStr(b) {
    return new TextDecoder().decode(b);
  }

  // Derive a 256-bit AES key from the passphrase + salt. Cached
  // per-session so consecutive saves don't re-run 250k iterations.
  var __keyCache = new Map();
  function deriveKey(passphrase, saltBytes) {
    var cacheKey = passphrase + '|' + bytesToBase64(saltBytes);
    if (__keyCache.has(cacheKey)) return Promise.resolve(__keyCache.get(cacheKey));
    var enc = strToBytes(passphrase);
    return crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveKey'])
      .then(function (baseKey) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: saltBytes, iterations: 250000, hash: 'SHA-256' },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      })
      .then(function (key) {
        __keyCache.set(cacheKey, key);
        return key;
      });
  }

  // Encrypt a JS object. Caller passes passphrase + AAD context
  // (sub + itemId). Returns the wire-format object.
  function encryptPayload(payload, passphrase, aadString) {
    if (!payload || typeof payload !== 'object') return Promise.reject(new Error('payload required'));
    if (!passphrase || passphrase.length < 8) return Promise.reject(new Error('passphrase too short — needs ≥8 chars'));
    if (typeof crypto === 'undefined' || !crypto.subtle) return Promise.reject(new Error('SubtleCrypto unavailable'));
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv   = crypto.getRandomValues(new Uint8Array(12));
    var aad  = strToBytes(String(aadString || ''));
    var plaintext = strToBytes(JSON.stringify(payload));
    return deriveKey(passphrase, salt).then(function (key) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: aad }, key, plaintext);
    }).then(function (ctBuffer) {
      return {
        v: 1,
        salt: bytesToBase64(salt),
        iv: bytesToBase64(iv),
        ct: bytesToBase64(new Uint8Array(ctBuffer)),
        aad: aadString || ''
      };
    });
  }

  // Decrypt a wire-format object. Returns the original JS object
  // or rejects if AAD doesn't match (tamper detection).
  function decryptPayload(envelope, passphrase, aadString) {
    if (!envelope || envelope.v !== 1) return Promise.reject(new Error('unsupported envelope version'));
    if (!passphrase) return Promise.reject(new Error('passphrase required'));
    if (typeof crypto === 'undefined' || !crypto.subtle) return Promise.reject(new Error('SubtleCrypto unavailable'));
    var salt = base64ToBytes(envelope.salt);
    var iv   = base64ToBytes(envelope.iv);
    var ct   = base64ToBytes(envelope.ct);
    var aad  = strToBytes(String(aadString || envelope.aad || ''));
    return deriveKey(passphrase, salt).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv, additionalData: aad }, key, ct);
    }).then(function (plainBuffer) {
      var json = bytesToStr(new Uint8Array(plainBuffer));
      return JSON.parse(json);
    });
  }

  function clearKeyCache() { __keyCache.clear(); }

  var api = {
    encryptPayload:   encryptPayload,
    decryptPayload:   decryptPayload,
    clearKeyCache:    clearKeyCache,
    // exposed for tests
    _bytesToBase64:   bytesToBase64,
    _base64ToBytes:   base64ToBytes
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_ENCRYPT = api;
})(typeof window !== 'undefined' ? window : null);
