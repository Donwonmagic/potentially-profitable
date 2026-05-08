/**
 * Invoice Decoder — client-side envelope encryption (Wave 6.1).
 *
 * Two envelope versions in production simultaneously:
 *
 *   v=1 (legacy) — single-key envelope.
 *     { v:1, salt, iv, ct, aad }
 *     Plaintext is encrypted DIRECTLY with a passphrase-derived key.
 *     Loses recoverability if the operator forgets the passphrase.
 *     Only read; new saves always emit v=2.
 *
 *   v=2 (dual-wrap) — data-key + multiple wraps.
 *     {
 *       v:2,
 *       iv,                                          (12 bytes for the body)
 *       ct,                                          (AES-GCM(dataKey, plaintext))
 *       aad,
 *       wraps: [
 *         { kind:'passphrase', kdf:..., m,t,p|iter, salt, iv, wrap },
 *         { kind:'recovery',   kdf:..., m,t,p,      salt, iv, wrap }
 *         // future: { kind:'paired-device', publicKey, ... }
 *       ]
 *     }
 *     A random 256-bit data key encrypts the payload. Each wrap
 *     stores AES-GCM(KEK, dataKey) where KEK is derived from a
 *     different secret (passphrase, recovery phrase, paired-device
 *     key). On unlock, the operator supplies one of those secrets;
 *     we try each wrap until one succeeds.
 *
 * Privacy posture:
 *   - SubtleCrypto runs in-browser; Argon2id WASM also in-browser.
 *   - The server stores ciphertext + wrap envelope only. Server has
 *     no decryption capability and never sees the data key.
 *   - Forward-compatible: more wrap kinds can be added (paired
 *     device, WebAuthn passkey) without changing existing readers.
 *
 * Migration: when decryptPayload reads a v=1 envelope, the wrap
 * helper exposes the recovered data key plus a flag the controller
 * can act on; controller asks the operator if they want to add a
 * recovery code, then re-saves as v=2.
 */
(function (root) {
  'use strict';

  // Encoding helpers — duplicated from kdf.js for the legacy v=1
  // path that doesn't go through MID_KDF.
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

  // -------------------- Legacy v=1 path --------------------
  // Kept for read compatibility. encryptPayload no longer emits v=1.
  var __legacyKeyCache = new Map();
  function deriveLegacyKey(passphrase, saltBytes, iterations) {
    var iter = iterations || 250000;
    var ck = passphrase + '|' + bytesToBase64(saltBytes) + '|' + iter;
    if (__legacyKeyCache.has(ck)) return Promise.resolve(__legacyKeyCache.get(ck));
    var enc = strToBytes(passphrase);
    return crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveKey'])
      .then(function (baseKey) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: saltBytes, iterations: iter, hash: 'SHA-256' },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      })
      .then(function (key) { __legacyKeyCache.set(ck, key); return key; });
  }
  function decryptV1(envelope, passphrase, aadString) {
    var salt = base64ToBytes(envelope.salt);
    var iv   = base64ToBytes(envelope.iv);
    var ct   = base64ToBytes(envelope.ct);
    var aad  = strToBytes(String(aadString || envelope.aad || ''));
    var iter = envelope.iter || 250000;
    return deriveLegacyKey(passphrase, salt, iter).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv, additionalData: aad }, key, ct);
    }).then(function (plainBuffer) {
      var json = bytesToStr(new Uint8Array(plainBuffer));
      return JSON.parse(json);
    });
  }

  // -------------------- v=2 helpers --------------------
  function kdfMod() {
    // Read from globalThis so this works in both browser
    // (window.MID_KDF) and Node tests (which set
    // globalThis.window.MID_KDF). The IIFE's captured `root` may be
    // null in Node CommonJS contexts where `window` is undefined at
    // module load time.
    var g = (typeof globalThis !== 'undefined') ? globalThis : null;
    var kdf = g && (g.MID_KDF || (g.window && g.window.MID_KDF));
    if (!kdf) throw new Error('MID_KDF module missing — encrypt.js depends on kdf.js');
    return kdf;
  }

  // Wrap a 32-byte data key with a secret-derived KEK. Returns the
  // wrap entry (without `kind` — caller adds it).
  function buildWrap(dataKey, secret, kdfParams) {
    if (!secret || typeof secret !== 'string') return Promise.reject(new Error('secret required'));
    var KDF = kdfMod();
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv   = crypto.getRandomValues(new Uint8Array(12));
    return KDF.deriveKey(secret, salt, kdfParams).then(function (kekBytes) {
      return KDF.importAesKey(kekBytes);
    }).then(function (kek) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, kek, dataKey);
    }).then(function (wrappedBuf) {
      var wrap = {
        kdf:  kdfParams.kdf || 'pbkdf2',
        salt: bytesToBase64(salt),
        iv:   bytesToBase64(iv),
        wrap: bytesToBase64(new Uint8Array(wrappedBuf))
      };
      if (kdfParams.kdf === 'argon2id') {
        wrap.m = kdfParams.m;
        wrap.t = kdfParams.t;
        wrap.p = kdfParams.p;
      } else {
        wrap.iter = kdfParams.iter || 600000;
      }
      return wrap;
    });
  }

  // Unwrap one wrap entry with a candidate secret. Returns the
  // recovered 32-byte data key on success, rejects on failure.
  function unwrap(wrap, secret) {
    var KDF = kdfMod();
    var salt = base64ToBytes(wrap.salt);
    var iv   = base64ToBytes(wrap.iv);
    var ct   = base64ToBytes(wrap.wrap);
    var params;
    if (wrap.kdf === 'argon2id') {
      params = { kdf: 'argon2id', m: wrap.m, t: wrap.t, p: wrap.p };
    } else {
      params = { kdf: 'pbkdf2', iter: wrap.iter || 600000 };
    }
    return KDF.deriveKey(secret, salt, params).then(function (kekBytes) {
      return KDF.importAesKey(kekBytes);
    }).then(function (kek) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, kek, ct);
    }).then(function (buf) {
      return new Uint8Array(buf);
    });
  }

  // Default KDF parameters. We default to Argon2id when hash-wasm is
  // available; PBKDF2 otherwise. The KDF dispatcher handles both.
  var DEFAULT_KDF_PARAMS = { kdf: 'argon2id', m: 65536, t: 3, p: 1 };

  // ---------------------------------------------------------------
  // Public API — encrypt
  // ---------------------------------------------------------------
  // encryptPayload(payload, passphrase, aadString, opts?) — emits v=2.
  //   opts:
  //     recoveryPhrase: string (24 BIP39 words)  → adds a recovery wrap
  //     kdfParams:      override defaults
  function encryptPayload(payload, passphrase, aadString, opts) {
    if (!payload || typeof payload !== 'object') return Promise.reject(new Error('payload required'));
    if (!passphrase || passphrase.length < 8) return Promise.reject(new Error('passphrase too short — needs ≥8 chars'));
    if (typeof crypto === 'undefined' || !crypto.subtle) return Promise.reject(new Error('SubtleCrypto unavailable'));
    opts = opts || {};
    var kdfParams = Object.assign({}, DEFAULT_KDF_PARAMS, opts.kdfParams || {});
    var KDF = kdfMod();

    // 1. Generate a random 256-bit data key.
    var dataKey = crypto.getRandomValues(new Uint8Array(32));
    var iv      = crypto.getRandomValues(new Uint8Array(12));
    var aad     = strToBytes(String(aadString || ''));
    var plaintext = strToBytes(JSON.stringify(payload));

    // 2. Encrypt the payload with the data key.
    var bodyPromise = KDF.importAesKey(dataKey).then(function (dk) {
      return crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv, additionalData: aad },
        dk,
        plaintext
      );
    });

    // 3. Build the passphrase wrap (always present).
    var wrapsPromise = buildWrap(dataKey, passphrase, kdfParams).then(function (pw) {
      pw.kind = 'passphrase';
      var wraps = [pw];
      if (opts.recoveryPhrase) {
        return buildWrap(dataKey, opts.recoveryPhrase, kdfParams).then(function (rw) {
          rw.kind = 'recovery';
          wraps.push(rw);
          return wraps;
        });
      }
      return wraps;
    });

    // 4. Compose envelope.
    return Promise.all([bodyPromise, wrapsPromise]).then(function (results) {
      // Wipe the plaintext data key from memory ASAP.
      dataKey.fill(0);
      return {
        v:     2,
        iv:    bytesToBase64(iv),
        ct:    bytesToBase64(new Uint8Array(results[0])),
        aad:   aadString || '',
        wraps: results[1]
      };
    });
  }

  // Add a new wrap to an existing v=2 envelope (e.g., add a recovery
  // wrap to an envelope that was originally saved without one, or
  // add a paired-device wrap with a friendly label).
  // Requires unlocking via an existing wrap, then deriving a fresh
  // wrap for the new secret.
  //
  // wrapMeta: { kind, label?, addedAt? } — kind is required; the
  // optional label + addedAt let the UI list paired devices and
  // surface "added 3 days ago" affordances.
  function addWrap(envelope, knownSecret, newSecret, wrapMeta, kdfParams) {
    if (!envelope || envelope.v !== 2) return Promise.reject(new Error('addWrap only supports v=2 envelopes'));
    if (!Array.isArray(envelope.wraps)) return Promise.reject(new Error('envelope.wraps missing'));
    kdfParams = Object.assign({}, DEFAULT_KDF_PARAMS, kdfParams || {});
    // Backward compat: callers that pass a string (the previous
    // 'newWrapKind' arg) get a wrap with just the kind set.
    var meta = (typeof wrapMeta === 'string')
      ? { kind: wrapMeta || 'extra' }
      : (wrapMeta || { kind: 'extra' });
    return tryUnwrapAny(envelope.wraps, knownSecret).then(function (dataKey) {
      return buildWrap(dataKey, newSecret, kdfParams).then(function (w) {
        w.kind = meta.kind;
        if (meta.label)   w.label   = String(meta.label).slice(0, 60);
        if (meta.addedAt) w.addedAt = meta.addedAt;
        else              w.addedAt = Date.now();
        // Wipe data key.
        dataKey.fill(0);
        var next = JSON.parse(JSON.stringify(envelope));
        next.wraps = (next.wraps || []).concat([w]);
        return next;
      });
    });
  }

  // Remove a wrap from an envelope. Used to revoke a paired-device
  // wrap when the operator loses access to that device. Identifies
  // the wrap by kind + label (so multiple paired-device wraps can
  // coexist with distinct labels). Always preserves at least one
  // wrap — refuses to remove the last unlock path so the operator
  // can't accidentally lock themselves out.
  function removeWrap(envelope, kind, label) {
    if (!envelope || envelope.v !== 2 || !Array.isArray(envelope.wraps)) {
      return null;
    }
    var remaining = envelope.wraps.filter(function (w) {
      if (w.kind !== kind) return true;
      if (label && w.label !== label) return true;
      return false;
    });
    if (!remaining.length) return null;  // refuse to leave envelope unwrappable
    var next = JSON.parse(JSON.stringify(envelope));
    next.wraps = remaining;
    return next;
  }

  // Try each wrap in order; resolve with the data key from the first
  // wrap that unlocks, reject when all fail.
  function tryUnwrapAny(wraps, secret) {
    var attempts = (wraps || []).map(function (w) {
      return function () { return unwrap(w, secret); };
    });
    if (!attempts.length) return Promise.reject(new Error('no wraps in envelope'));
    return new Promise(function (resolve, reject) {
      var idx = 0;
      function next() {
        if (idx >= attempts.length) return reject(new Error('no wrap accepts this secret'));
        attempts[idx++]().then(resolve).catch(next);
      }
      next();
    });
  }

  // ---------------------------------------------------------------
  // Public API — decrypt
  // ---------------------------------------------------------------
  // decryptPayload(envelope, secret, aadString) — accepts v=1 + v=2.
  // For v=2, `secret` may be the passphrase OR the recovery phrase;
  // we try every wrap.
  function decryptPayload(envelope, secret, aadString) {
    if (!envelope) return Promise.reject(new Error('envelope required'));
    if (!secret) return Promise.reject(new Error('secret required'));
    if (typeof crypto === 'undefined' || !crypto.subtle) return Promise.reject(new Error('SubtleCrypto unavailable'));

    if (envelope.v === 1) {
      return decryptV1(envelope, secret, aadString);
    }
    if (envelope.v !== 2) return Promise.reject(new Error('unsupported envelope version: ' + envelope.v));

    var KDF = kdfMod();
    return tryUnwrapAny(envelope.wraps, secret).then(function (dataKey) {
      var iv  = base64ToBytes(envelope.iv);
      var ct  = base64ToBytes(envelope.ct);
      var aad = strToBytes(String(aadString || envelope.aad || ''));
      return KDF.importAesKey(dataKey).then(function (dk) {
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv, additionalData: aad }, dk, ct);
      }).then(function (buf) {
        // Wipe the data key from memory.
        dataKey.fill(0);
        var json = bytesToStr(new Uint8Array(buf));
        return JSON.parse(json);
      });
    });
  }

  // Helper: which wrap kinds does this envelope support? Used by the
  // controller to decide whether to surface a "use recovery code"
  // option.
  function envelopeWrapKinds(envelope) {
    if (!envelope || envelope.v === 1) return ['passphrase'];
    if (envelope.v === 2 && Array.isArray(envelope.wraps)) {
      return envelope.wraps.map(function (w) { return w.kind || 'unknown'; });
    }
    return [];
  }

  function clearKeyCache() {
    __legacyKeyCache.clear();
    if (root && root.MID_KDF && typeof root.MID_KDF.clearKeyCache === 'function') {
      root.MID_KDF.clearKeyCache();
    }
  }

  var api = {
    encryptPayload:     encryptPayload,
    decryptPayload:     decryptPayload,
    addWrap:            addWrap,
    removeWrap:         removeWrap,
    envelopeWrapKinds:  envelopeWrapKinds,
    clearKeyCache:      clearKeyCache,
    DEFAULT_KDF_PARAMS: DEFAULT_KDF_PARAMS,
    // exposed for tests
    _bytesToBase64:     bytesToBase64,
    _base64ToBytes:     base64ToBytes,
    _buildWrap:         buildWrap,
    _unwrap:            unwrap,
    _tryUnwrapAny:      tryUnwrapAny
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_ENCRYPT = api;
})(typeof window !== 'undefined' ? window : null);
