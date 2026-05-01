/**
 * Invoice Decoder — multi-device pairing (Wave 6.3 second half).
 *
 * Generates a labeled per-device unlock secret and adds it to the
 * envelope as a `kind: 'paired-device'` wrap. The operator types
 * the secret on Device B (or eventually scans a QR — deferred to
 * v2) to unlock without sharing their primary passphrase.
 *
 * Why per-device wraps:
 *   - Each device gets its own credential, independently
 *     revocable. If a device is lost or sold, the operator
 *     removes only that wrap from the envelope; their other
 *     devices keep working.
 *   - Labeled audit trail: "Phone added 2026-04-12, Laptop added
 *     2026-04-15." Listing exposed via listDevices(envelope).
 *   - Builds on the dual-wrap envelope architecture (encrypt.js)
 *     and the BIP39 24-word generator already shipped for the
 *     recovery phrase (recovery.js). Same UX shape, same KDF
 *     pipeline, same crypto primitives.
 *
 * Privacy posture:
 *   - The pair token never crosses the network. Device A generates
 *     it locally, the operator transcribes/transports it to
 *     Device B, Device B types it into the unlock modal and
 *     decrypts the envelope through the existing decryptPayload
 *     path.
 *   - Removing a device wrap doesn't touch the data key — the
 *     other wraps still unlock the envelope unchanged.
 *
 * Future v2 enhancements (deferred):
 *   - QR scanning via BarcodeDetector API for the typed-phrase
 *     bypass.
 *   - ECDH-based pairing ceremony so the secret never appears
 *     anywhere outside the two devices.
 *   - Local persistence of unlocked data keys per device so
 *     subsequent unlocks are automatic (currently the operator
 *     types the secret each session).
 */
(function (root) {
  'use strict';

  var WRAP_KIND = 'paired-device';

  // Generate a 24-word pairing token. We delegate to MID_RECOVERY's
  // generator so the wordlist + entropy story stays single-source.
  function generateToken() {
    if (typeof root === 'undefined' || !root || !root.MID_RECOVERY ||
        typeof root.MID_RECOVERY.generatePhrase !== 'function') {
      return Promise.reject(new Error('MID_RECOVERY missing — pairing.js depends on recovery.js'));
    }
    return root.MID_RECOVERY.generatePhrase();
  }

  // Add a paired-device wrap to an envelope. Returns Promise<{
  // envelope, token, label }> on success, rejects on encryption
  // failure. Caller is responsible for re-saving the envelope to
  // the server.
  function addDevice(envelope, currentSecret, label, opts) {
    if (!envelope || envelope.v !== 2) {
      return Promise.reject(new Error('paired-device wraps require a v=2 envelope'));
    }
    if (!currentSecret) return Promise.reject(new Error('currentSecret required'));
    if (typeof root === 'undefined' || !root || !root.MID_ENCRYPT ||
        typeof root.MID_ENCRYPT.addWrap !== 'function') {
      return Promise.reject(new Error('MID_ENCRYPT.addWrap unavailable'));
    }
    var deviceLabel = String(label || '').trim().slice(0, 60) || 'Device';
    return generateToken().then(function (token) {
      return root.MID_ENCRYPT.addWrap(
        envelope,
        currentSecret,
        token,
        { kind: WRAP_KIND, label: deviceLabel, addedAt: Date.now() },
        (opts && opts.kdfParams) || null
      ).then(function (newEnvelope) {
        return { envelope: newEnvelope, token: token, label: deviceLabel };
      });
    });
  }

  // List paired-device wraps with their labels + addedAt timestamps.
  // Returns the array — empty when no devices are paired.
  function listDevices(envelope) {
    if (!envelope || envelope.v !== 2 || !Array.isArray(envelope.wraps)) return [];
    var out = [];
    for (var i = 0; i < envelope.wraps.length; i++) {
      var w = envelope.wraps[i];
      if (w.kind === WRAP_KIND) {
        out.push({
          label:   w.label || 'Unlabeled device',
          addedAt: w.addedAt || null,
          index:   i
        });
      }
    }
    return out;
  }

  // Revoke a paired device by removing its wrap. Identified by
  // label (case-sensitive). Returns the new envelope, or null if
  // removal would leave the envelope without any wraps (we refuse
  // to lock the operator out by mistake).
  function removeDevice(envelope, label) {
    if (typeof root === 'undefined' || !root || !root.MID_ENCRYPT ||
        typeof root.MID_ENCRYPT.removeWrap !== 'function') {
      return null;
    }
    return root.MID_ENCRYPT.removeWrap(envelope, WRAP_KIND, label);
  }

  var api = {
    generateToken: generateToken,
    addDevice:     addDevice,
    listDevices:   listDevices,
    removeDevice:  removeDevice,
    WRAP_KIND:     WRAP_KIND
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PAIRING = api;
})(typeof window !== 'undefined' ? window : null);
