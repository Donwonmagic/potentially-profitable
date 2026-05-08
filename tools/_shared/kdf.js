/**
 * Invoice Decoder — key-derivation functions (Wave 6.1).
 *
 * Two KDFs supported:
 *   - PBKDF2-SHA256 with 600k iterations (v=1 envelopes; OWASP 2024
 *     recommendation; backward-compatible with the legacy 250k v=1
 *     envelopes via the `iter` field stored in the envelope).
 *   - Argon2id with m=64 MiB, t=3, p=1 (v=2 envelopes; the modern
 *     memory-hard standard).
 *
 * Argon2id raises the cost of offline brute-force from ~$1k/key
 * (PBKDF2 on a single GPU) to ~$10k+/key (Argon2id with 64 MiB
 * memory bottleneck). Loaded lazily via hash-wasm when the v=2
 * path is taken; PBKDF2 always available via SubtleCrypto.
 *
 * Privacy posture: all derivations run in-browser. The argon2 WASM
 * loads from /assets/vendor/hash-wasm@<version>/, same-origin and
 * SRI-pinned by the build's vendor-pin step.
 */
(function (root) {
  'use strict';

  // -------------------- Encoding helpers --------------------
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

  // -------------------- Cache --------------------
  // Per-session cache: keyed by passphrase + salt + algo. Cleared on
  // tab close (memory-only) plus the existing visibilitychange/blur
  // handlers in encrypt.js.
  var __cache = new Map();
  function cacheKey(secret, salt, algo) {
    return algo + '|' + secret.length + '|' + bytesToBase64(salt);
  }
  function clearKeyCache() { __cache.clear(); }

  // -------------------- PBKDF2 --------------------
  // Returns a 32-byte raw key as Uint8Array. The caller wraps it
  // into an AES-GCM CryptoKey via crypto.subtle.importKey.
  function deriveKeyPbkdf2(secret, saltBytes, iterations) {
    var iter = (typeof iterations === 'number' && iterations > 0) ? iterations : 600000;
    var ck = cacheKey(secret, saltBytes, 'pbkdf2-' + iter);
    if (__cache.has(ck)) return Promise.resolve(__cache.get(ck));
    var enc = strToBytes(secret);
    return crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits'])
      .then(function (baseKey) {
        return crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: saltBytes, iterations: iter, hash: 'SHA-256' },
          baseKey,
          256
        );
      })
      .then(function (bits) {
        var keyBytes = new Uint8Array(bits);
        __cache.set(ck, keyBytes);
        return keyBytes;
      });
  }

  // -------------------- Argon2id (lazy-loaded) --------------------
  // hash-wasm exposes window.hashwasm.argon2id when loaded as UMD.
  var __hashWasmPromise = null;
  function loadHashWasm() {
    if (root.hashwasm && root.hashwasm.argon2id) {
      return Promise.resolve(root.hashwasm);
    }
    if (__hashWasmPromise) return __hashWasmPromise;
    if (typeof root.MID_VENDORS_CFG === 'undefined' || !root.MID_VENDORS_CFG.loadScript) {
      // Fallback path used in unit tests (Node) where vendor-config
      // isn't present. Caller will see a rejection.
      return Promise.reject(new Error('vendor-config missing — cannot load argon2'));
    }
    __hashWasmPromise = root.MID_VENDORS_CFG.loadScript('argon2').then(function () {
      if (root.hashwasm && root.hashwasm.argon2id) return root.hashwasm;
      __hashWasmPromise = null;
      throw new Error('Argon2id loaded but global missing');
    }).catch(function (err) {
      __hashWasmPromise = null;
      throw err;
    });
    return __hashWasmPromise;
  }

  // Default Argon2id parameters. Memory in KiB; iterations; parallel
  // lanes. 64 MiB / 3 / 1 is the OWASP 2024 recommendation that
  // pencils out to ~250-400ms on a modern phone.
  var ARGON2_DEFAULTS = { m: 65536, t: 3, p: 1 };

  function deriveKeyArgon2id(secret, saltBytes, params) {
    params = Object.assign({}, ARGON2_DEFAULTS, params || {});
    var ck = cacheKey(secret, saltBytes, 'argon2-' + params.m + '-' + params.t + '-' + params.p);
    if (__cache.has(ck)) return Promise.resolve(__cache.get(ck));
    return loadHashWasm().then(function (hw) {
      return hw.argon2id({
        password:    secret,
        salt:        saltBytes,
        parallelism: params.p,
        iterations:  params.t,
        memorySize:  params.m,    // KiB
        hashLength:  32,           // 32 bytes → AES-256 key
        outputType:  'binary'
      });
    }).then(function (keyBytes) {
      // hash-wasm returns a Uint8Array directly when outputType=binary.
      __cache.set(ck, keyBytes);
      return keyBytes;
    });
  }

  // -------------------- Unified entry --------------------
  // Pick the KDF based on the params. Used by encrypt.js's wrap /
  // unwrap pair so the wire format dictates the algorithm.
  //
  //   params:
  //     { kdf: 'pbkdf2', iter: 600000 }
  //     { kdf: 'argon2id', m: 65536, t: 3, p: 1 }
  function deriveKey(secret, saltBytes, params) {
    params = params || {};
    var kdf = params.kdf || 'pbkdf2';
    if (kdf === 'argon2id') return deriveKeyArgon2id(secret, saltBytes, params);
    if (kdf === 'pbkdf2')   return deriveKeyPbkdf2(secret, saltBytes, params.iter);
    return Promise.reject(new Error('unknown KDF: ' + kdf));
  }

  // Import a 32-byte raw key as an AES-GCM CryptoKey usable for
  // encrypt + decrypt. encrypt.js calls this once per derived key.
  function importAesKey(rawKey) {
    return crypto.subtle.importKey(
      'raw', rawKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }

  var api = {
    deriveKey:           deriveKey,
    deriveKeyPbkdf2:     deriveKeyPbkdf2,
    deriveKeyArgon2id:   deriveKeyArgon2id,
    importAesKey:        importAesKey,
    clearKeyCache:       clearKeyCache,
    ARGON2_DEFAULTS:     ARGON2_DEFAULTS,
    // Encoding helpers shared with encrypt.js (avoids duplicating).
    _bytesToBase64:      bytesToBase64,
    _base64ToBytes:      base64ToBytes,
    _strToBytes:         strToBytes
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_KDF = api;
})(typeof window !== 'undefined' ? window : null);
