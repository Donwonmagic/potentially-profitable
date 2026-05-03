/**
 * Invoice Decoder — Optimistic save UI orchestrator (Wave 5.7).
 *
 * Surfaces a non-blocking "Saving in background — keep going" pill
 * the moment the operator clicks Save, replaces it with "Saved ✓"
 * (or "Save failed — retry") on completion. The actual encrypt + POST
 * still runs on the main thread (WebCrypto is fast enough that the
 * network round-trip dominates), but the pill makes the latency
 * non-blocking from the operator's perspective.
 *
 * Design note: a true background save worker would re-instantiate
 * WebCrypto + fetch in a Worker context; the encryption time on
 * modern devices is ~30ms which doesn't justify the worker plumbing
 * cost. The visible win — operator sees instant feedback — comes from
 * the optimistic pill, not from off-main-thread crypto.
 *
 * Privacy posture unchanged. No data touches this module beyond
 * a label and a status enum.
 */
(function (root) {
  'use strict';

  var PILL_ID = 'idSaveWorkerPill';
  var __counter = 0;
  var __activeTokens = Object.create(null);

  function _ensurePill() {
    if (typeof document === 'undefined') return null;
    var el = document.getElementById(PILL_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = PILL_ID;
    el.className = 'id-save-pill';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    document.body.appendChild(el);
    return el;
  }

  function _render() {
    var el = _ensurePill();
    if (!el) return;
    var tokens = Object.keys(__activeTokens);
    if (!tokens.length) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    var first = __activeTokens[tokens[0]];
    el.hidden = false;
    el.dataset.state = first.state;
    el.textContent = first.label;
  }

  // Start an optimistic save UI. Returns a token to pass to complete().
  function start(opts) {
    opts = opts || {};
    var token = 'save-' + (++__counter);
    __activeTokens[token] = {
      label: opts.label || 'Saving in the background — keep going.',
      state: 'busy',
      startedAt: Date.now()
    };
    _render();
    return token;
  }

  function update(token, opts) {
    var entry = __activeTokens[token];
    if (!entry) return;
    if (opts && opts.label) entry.label = opts.label;
    if (opts && opts.state) entry.state = opts.state;
    _render();
  }

  function complete(token, opts) {
    opts = opts || {};
    var entry = __activeTokens[token];
    if (!entry) return;
    entry.state = opts.ok ? 'ok' : 'fail';
    entry.label = opts.ok
      ? (opts.label || 'Saved ✓')
      : (opts.label || 'Save failed — retry');
    _render();
    // Auto-dismiss success after 2.5s; failures linger until the
    // operator dismisses or retries.
    if (opts.ok) {
      setTimeout(function () {
        delete __activeTokens[token];
        _render();
      }, 2500);
    }
  }

  function dismiss(token) {
    delete __activeTokens[token];
    _render();
  }

  var api = {
    start:    start,
    update:   update,
    complete: complete,
    dismiss:  dismiss,
    PILL_ID:  PILL_ID
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_SAVE_WORKER = api;
})(typeof window !== 'undefined' ? window : null);
