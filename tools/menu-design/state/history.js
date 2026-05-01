/**
 * Menu Design Suite — undo/redo history module (W22 extraction).
 *
 * owns:    50-step undo + redo ring buffers and the snapshot
 *          serialization helper
 * exports: MD_HISTORY on window; module.exports for tests
 * deps:    none (pure data structure; orchestrator passes the
 *          state object in for snapshots)
 * why:     The W8-1 history stack was inlined alongside the
 *          orchestrator's state vars. Pulling it out lets the
 *          future state/store + state/reducer extractions hand
 *          the history a fresh snapshot via dispatch() instead
 *          of the orchestrator reaching across modules.
 */
(function (root) {
  'use strict';

  var CAP = 50;

  function makeHistory() {
    var past = [];
    var future = [];
    function clone(v) {
      // Deep-ish clone via JSON. Photo + hero data URLs intentionally
      // round-trip — undo of a photo upload should restore the photo.
      if (v == null) return v;
      try { return JSON.parse(JSON.stringify(v)); }
      catch (_) { return v; }
    }
    return {
      push: function (snapshot) {
        past.push(clone(snapshot));
        if (past.length > CAP) past.shift();
        future.length = 0;
      },
      undo: function (current) {
        if (!past.length) return null;
        future.push(clone(current));
        if (future.length > CAP) future.shift();
        return past.pop();
      },
      redo: function (current) {
        if (!future.length) return null;
        past.push(clone(current));
        if (past.length > CAP) past.shift();
        return future.pop();
      },
      canUndo: function () { return past.length > 0; },
      canRedo: function () { return future.length > 0; },
      reset: function () { past.length = 0; future.length = 0; }
    };
  }

  var api = {
    create: makeHistory,
    CAP:    CAP
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_HISTORY = api;
})(typeof window !== 'undefined' ? window : null);
