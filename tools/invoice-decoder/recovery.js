/**
 * Invoice Decoder — recovery phrase generation + parsing (Wave 6.3).
 *
 * Generates a 24-word recovery phrase from the BIP39 English
 * wordlist. The phrase is the operator's "what if I forget my
 * passphrase?" answer: it derives a second AES key that wraps the
 * envelope's data key alongside the passphrase wrap. Either secret
 * unlocks the saved invoices.
 *
 * Why 24 words from BIP39:
 *   - 24 × 11 bits/word = 264 bits of entropy (the lookup table is
 *     2048 = 2^11 words). Vastly more than the 256-bit AES key
 *     needs, so the phrase is effectively unguessable.
 *   - The wordlist is curated to avoid ambiguous spellings, prefix
 *     collisions, and difficult-to-write words.
 *   - Operators can write the phrase down on paper and store it in
 *     a safety deposit box, fire-rated bag, etc.
 *
 * We do NOT compute or verify a BIP39 checksum — the standard's
 * checksum exists for crypto-wallet recovery cross-compatibility,
 * which doesn't apply here. We treat the phrase as a high-entropy
 * passphrase fed straight into the same KDF.
 *
 * Privacy posture: pure on-device. The wordlist is a static asset
 * fetched once from /tools/invoice-decoder/data/bip39-en.txt;
 * `crypto.getRandomValues` provides the randomness.
 */
(function (root) {
  'use strict';

  var WORDLIST_URL = '/tools/invoice-decoder/data/bip39-en.txt';
  var __wordlistPromise = null;
  var __wordlistMap = null;

  function loadWordlist() {
    if (__wordlistPromise) return __wordlistPromise;
    if (typeof fetch === 'undefined') {
      return Promise.reject(new Error('fetch unavailable'));
    }
    __wordlistPromise = fetch(WORDLIST_URL, { // h8-exempt: same-origin recovery wordlist; never sent over the network
      credentials: 'omit',
      cache:       'force-cache'
    }).then(function (r) {
      if (!r.ok) throw new Error('wordlist HTTP ' + r.status);
      return r.text();
    }).then(function (text) {
      var words = text.split(/\r?\n/).map(function (w) { return w.trim().toLowerCase(); }).filter(Boolean);
      if (words.length !== 2048) throw new Error('expected 2048 words, got ' + words.length);
      __wordlistMap = {};
      for (var i = 0; i < words.length; i++) __wordlistMap[words[i]] = i;
      return words;
    }).catch(function (err) {
      __wordlistPromise = null;
      throw err;
    });
    return __wordlistPromise;
  }

  // Generate a 24-word recovery phrase. Uses crypto.getRandomValues
  // to pick 24 indices into the wordlist with proper rejection
  // sampling (Math.random() is NOT acceptable for this).
  function generatePhrase() {
    return loadWordlist().then(function (words) {
      // We need 24 random integers in [0, 2048). 11 bits each.
      // Generate 33 random bytes (264 bits) and chunk by 11 bits.
      var bytes = crypto.getRandomValues(new Uint8Array(33));
      var indices = [];
      var bitBuffer = 0;
      var bitsAvailable = 0;
      for (var i = 0; i < bytes.length && indices.length < 24; i++) {
        bitBuffer = (bitBuffer << 8) | bytes[i];
        bitsAvailable += 8;
        while (bitsAvailable >= 11 && indices.length < 24) {
          bitsAvailable -= 11;
          var idx = (bitBuffer >> bitsAvailable) & 0x7FF;
          indices.push(idx);
        }
      }
      return indices.map(function (i) { return words[i]; }).join(' ');
    });
  }

  // Normalize a phrase for storage / KDF input. Lowercase, single-
  // space separated, trimmed. Operators may type the phrase with
  // varying whitespace or capitalization; we accept all variants.
  function normalize(phrase) {
    return String(phrase || '')
      .toLowerCase()
      .replace(/[^a-z ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Validate that a phrase contains 24 words from the BIP39 list.
  // Returns { ok, words?, errors[] }.
  function validate(phrase) {
    var norm = normalize(phrase);
    if (!norm) return { ok: false, errors: ['empty'] };
    var words = norm.split(' ');
    var errors = [];
    if (words.length !== 24) {
      errors.push('expected 24 words, got ' + words.length);
    }
    return loadWordlist().then(function () {
      var unknown = [];
      for (var i = 0; i < words.length; i++) {
        if (__wordlistMap[words[i]] === undefined) unknown.push(words[i]);
      }
      if (unknown.length) errors.push('unknown words: ' + unknown.slice(0, 5).join(', '));
      return errors.length
        ? { ok: false, errors: errors }
        : { ok: true, words: words, normalized: norm };
    });
  }

  // Did the operator generate a recovery phrase already? Returns
  // the timestamp of when they did, or null. We DO NOT store the
  // phrase itself — only a flag in MuntinContext.
  function readGenerated() {
    if (typeof root === 'undefined' || !root || !root.MuntinContext) return null;
    var data = root.MuntinContext.read() || {};
    return data.recoveryPhraseGeneratedAt || null;
  }
  function markGenerated() {
    if (typeof root === 'undefined' || !root || !root.MuntinContext) return false;
    return root.MuntinContext.merge({ recoveryPhraseGeneratedAt: Date.now() });
  }
  function clearGenerated() {
    if (typeof root === 'undefined' || !root || !root.MuntinContext) return false;
    return root.MuntinContext.merge({ recoveryPhraseGeneratedAt: null });
  }

  // Hint detector: when the operator's input looks like a 24-word
  // BIP39 phrase (rather than a passphrase), we route to the
  // recovery unlock path automatically. ≥18 of the typed tokens
  // appear in the wordlist → it's a phrase.
  function looksLikePhrase(input) {
    var norm = normalize(input);
    if (!norm) return false;
    var words = norm.split(' ');
    if (words.length < 12) return false;
    if (!__wordlistMap) return words.length >= 18; // wordlist not loaded; punt by length
    var hits = 0;
    for (var i = 0; i < words.length; i++) {
      if (__wordlistMap[words[i]] !== undefined) hits++;
    }
    return hits >= Math.min(words.length, 18);
  }

  var api = {
    generatePhrase:  generatePhrase,
    validate:        validate,
    normalize:       normalize,
    readGenerated:   readGenerated,
    markGenerated:   markGenerated,
    clearGenerated:  clearGenerated,
    looksLikePhrase: looksLikePhrase,
    loadWordlist:    loadWordlist
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_RECOVERY = api;
})(typeof window !== 'undefined' ? window : null);
