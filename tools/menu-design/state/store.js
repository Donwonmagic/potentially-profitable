/**
 * Menu Design Suite — state store (Wave A1 of the empowerment plan).
 *
 * Wraps:
 *   - MD_REDUCER.reduce(state, action)   — pure transition
 *   - MD_HISTORY.create()                — undo/redo ring buffers
 *   - MD_DRAFT.persistDraft(...)         — debounced autosave
 *
 * Public API:
 *   var store = MD_STORE.create({ initialMenu, onPersist });
 *   store.getState()                     → current canonical menu (v3)
 *   store.dispatch(action)               → apply, snapshot, notify, persist
 *   store.subscribe(fn)                  → fn(state, action) on every change
 *                                          returns unsubscribe()
 *   store.undo() / store.redo()          → wraps history; notifies subscribers
 *   store.canUndo() / store.canRedo()    → booleans
 *
 * Migration plan (Wave A1 phases 1–6):
 *   Phase 1: ship store.js + reducer.js + actions.js (THIS COMMIT).
 *            Orchestrator menu-design.js does NOT yet dispatch.
 *   Phase 2: orchestrator opt-in for ALLERGEN_TOGGLE only — proves
 *            history + persist round-trip.
 *   Phase 3: dish CRUD migrates (ADD/UPDATE/REMOVE/REORDER).
 *   Phase 4: section + theme + meta migrate.
 *   Phase 5: paste-ingest + bulk ops migrate.
 *   Phase 6: orchestrator's local `rows[]`, `theme`, `meta`,
 *            `customize`, `customDims` all become projections of
 *            store.getState(). The mirror state is removed.
 *
 * Privacy: this module touches NO storage and NO network directly.
 * Persistence is delegated to the `onPersist` callback the caller
 * supplies (typically a thin wrapper over MD_DRAFT.persistDraft).
 * That keeps the existing `// h8-exempt:` annotations confined to
 * state/draft.js where the security checker already accepts them.
 *
 * UMD-ish loader; attaches MD_STORE on window.
 */
(function (root) {
  'use strict';

  var SCHEMA = (typeof MD_SCHEMA !== 'undefined') ? MD_SCHEMA
              : (typeof require !== 'undefined') ? require('../../_shared/menu-schema.js')
              : null;
  var REDUCER = (typeof MD_REDUCER !== 'undefined') ? MD_REDUCER
              : (typeof require !== 'undefined') ? require('./reducer.js')
              : null;
  var HISTORY = (typeof MD_HISTORY !== 'undefined') ? MD_HISTORY
              : (typeof require !== 'undefined') ? require('./history.js')
              : null;
  var ACT = (typeof MD_ACTIONS !== 'undefined') ? MD_ACTIONS.ACTIONS
            : (typeof require !== 'undefined') ? require('./actions.js').ACTIONS
            : null;
  if (!SCHEMA || !REDUCER || !HISTORY || !ACT) {
    throw new Error('MD_STORE requires MD_SCHEMA + MD_REDUCER + MD_HISTORY + MD_ACTIONS');
  }

  // Default debounce window for autosave. Match the existing
  // orchestrator behavior (~400ms after the last keystroke).
  var DEFAULT_PERSIST_DEBOUNCE_MS = 400;

  function create(opts) {
    opts = opts || {};
    var state = SCHEMA.migrate(opts.initialMenu || null);
    var history = HISTORY.create();
    var subs = [];
    var persistFn = (typeof opts.onPersist === 'function') ? opts.onPersist : null;
    var persistDebounceMs = (typeof opts.persistDebounceMs === 'number')
      ? opts.persistDebounceMs
      : DEFAULT_PERSIST_DEBOUNCE_MS;
    var persistTimer = null;

    function schedulePersist() {
      if (!persistFn) return;
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(function () {
        persistTimer = null;
        try { persistFn(state); } catch (_) {}
      }, persistDebounceMs);
    }

    function notify(action) {
      // Snapshot subs at notify time so a subscriber that unsubscribes
      // mid-loop doesn't skip its sibling.
      var snap = subs.slice();
      for (var i = 0; i < snap.length; i++) {
        try { snap[i](state, action); } catch (_) {}
      }
    }

    function dispatch(action) {
      if (!action || !action.type) return state;

      // Intercept history actions before the reducer (the reducer
      // throws on @@UNDO / @@REDO).
      if (action.type === ACT.UNDO) return undo();
      if (action.type === ACT.REDO) return redo();

      var prev = state;
      var next;
      try {
        next = REDUCER.reduce(prev, action);
      } catch (e) {
        // Browser path: log + drop. Test path: re-throw so failing
        // dispatches surface in node:test. The flag below keeps the
        // production behavior soft.
        if (typeof window !== 'undefined') {
          if (window.console && console.warn) console.warn('[MD_STORE]', e && e.message);
          return prev;
        }
        throw e;
      }
      if (next === prev) return prev; // no-op

      history.push(prev);  // snapshot the OLD state so undo restores it
      state = next;
      notify(action);
      schedulePersist();
      return state;
    }

    function undo() {
      var prev = history.undo(state);
      if (prev == null) return state;
      state = prev;
      notify({ type: ACT.UNDO });
      schedulePersist();
      return state;
    }

    function redo() {
      var next = history.redo(state);
      if (next == null) return state;
      state = next;
      notify({ type: ACT.REDO });
      schedulePersist();
      return state;
    }

    function subscribe(fn) {
      if (typeof fn !== 'function') return function () {};
      subs.push(fn);
      return function unsubscribe() {
        var i = subs.indexOf(fn);
        if (i >= 0) subs.splice(i, 1);
      };
    }

    // Test-only escape hatch — flushes the persist debounce so unit
    // tests can assert the persist callback ran. Not used in browser.
    function _flushPersistForTests() {
      if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
        if (persistFn) try { persistFn(state); } catch (_) {}
      }
    }

    return {
      getState: function () { return state; },
      dispatch: dispatch,
      subscribe: subscribe,
      undo: undo,
      redo: redo,
      canUndo: function () { return history.canUndo(); },
      canRedo: function () { return history.canRedo(); },
      _flushPersistForTests: _flushPersistForTests
    };
  }

  var api = {
    create: create,
    DEFAULT_PERSIST_DEBOUNCE_MS: DEFAULT_PERSIST_DEBOUNCE_MS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_STORE = api;
})(typeof window !== 'undefined' ? window : null);
