/**
 * Invoice Decoder — Device tier detector (Wave 9.1).
 *
 * Decides whether this device should auto-load the heavy-mode OCR
 * stack (PaddleOCR-WASM ensemble + Asian language packs + 4-tap
 * bicubic super-resolution) vs stay on the lean ~25 MB default.
 *
 * Per the user's "tier by device" preference: capable devices on
 * wifi or wired get the heavy stack automatically; cellular and
 * low-RAM phones never pay the bytes. The decision is sticky once
 * made — operators who opt in via the manual toggle pin themselves
 * regardless of detector state.
 *
 * Capability rule (all must hold):
 *   - navigator.deviceMemory >= 4
 *   - effective connection in {'4g', 'wifi', 'ethernet'} OR no NetInfo
 *   - hardwareConcurrency >= 4 (proxy for "phone CPU class >= flagship")
 *
 * Manual override stored in localStorage so it survives reloads.
 * Manual OFF takes precedence over detector ON; manual ON takes
 * precedence over detector OFF.
 */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'mtn:id-heavy-mode';   // 'on' | 'off' | null

  function _getManual() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      if (v === 'on' || v === 'off') return v;
    } catch (_) {}
    return null;
  }
  function setManual(state) {
    try {
      if (state === 'on' || state === 'off') localStorage.setItem(STORAGE_KEY, state); // h8-exempt: device-tier toggle, on-device only
      else localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  function _detectorSaysCapable() {
    if (typeof root === 'undefined' || !root || !root.navigator) return false;
    var nav = root.navigator;
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false;
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return false;
    var conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      if (conn.saveData) return false;
      var et = conn.effectiveType;
      if (et && et !== '4g') return false;
    }
    return true;
  }

  // Returns one of 'capable' / 'lean' / 'manual-on' / 'manual-off'.
  // 'capable' / 'lean' come from the detector; 'manual-*' from the
  // explicit toggle, which always wins.
  function tier() {
    var manual = _getManual();
    if (manual === 'on') return 'manual-on';
    if (manual === 'off') return 'manual-off';
    return _detectorSaysCapable() ? 'capable' : 'lean';
  }

  // Convenience: is heavy mode active right now?
  function heavyEnabled() {
    var t = tier();
    return t === 'capable' || t === 'manual-on';
  }

  // Reasons why heavy mode is off, for operator-visible UI copy.
  function explainTier() {
    if (heavyEnabled()) return null;
    var nav = root && root.navigator;
    if (!nav) return 'no navigator';
    var manual = _getManual();
    if (manual === 'off') return 'manually disabled';
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return 'device has < 4 GB RAM';
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return 'device has < 4 CPU cores';
    var conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn && conn.saveData) return 'data-saver is on';
    if (conn && conn.effectiveType && conn.effectiveType !== '4g') return 'on a slow connection (' + conn.effectiveType + ')';
    return 'unknown';
  }

  var api = {
    tier:           tier,
    heavyEnabled:   heavyEnabled,
    setManual:      setManual,
    explainTier:    explainTier
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_DEVICE_TIER = api;
})(typeof window !== 'undefined' ? window : null);
