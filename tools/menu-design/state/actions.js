/**
 * Menu Design Suite — action types for the state store/reducer.
 *
 * Single source of truth for every mutation the editor can express.
 * Today the orchestrator (menu-design.js) calls a mix of
 *   pushUndo(); rows.splice(...); render(); scheduleSaveDraft();
 * patterns. The synthesized empowerment plan (Wave A1) replaces
 * those with `MD_STORE.dispatch({ type: ACTIONS.X, payload: ... })`,
 * funnelling every change through one door so:
 *
 *   - undo/redo is automatic (the store wraps MD_HISTORY)
 *   - autosave is automatic (the store wraps MD_DRAFT.persistDraft
 *     via a debounced subscriber)
 *   - cross-tool handoff knows when to write MuntinContext.menu
 *   - tests can drive the editor by dispatching action sequences
 *
 * Convention: action types are SCREAMING_SNAKE_CASE strings,
 * grouped by domain. Payload shapes are documented in the inline
 * JSDoc on each constant; the reducer enforces them.
 *
 * Migration tracking — incremental cutover so main never breaks.
 * Each constant carries a `// status:` tag:
 *   wired      → orchestrator already dispatches; reducer handles
 *   reducer    → reducer ready; orchestrator NOT yet dispatching
 *   pending    → not yet implemented in either place
 *
 * UMD-ish loader; attaches MD_ACTIONS on window.
 */
(function (root) {
  'use strict';

  var ACTIONS = Object.freeze({
    // ---------- Dish lifecycle ----------
    /** payload: { sectionId?, dish? } -- dish defaults to blankDish() */
    DISH_ADD:           'DISH_ADD',                   // status: reducer

    /** payload: { id, patch } -- patch is partial dish */
    DISH_UPDATE:        'DISH_UPDATE',                // status: reducer

    /** payload: { id } */
    DISH_REMOVE:        'DISH_REMOVE',                // status: reducer

    /** payload: { id, toIndex }  -- positions reorder within section */
    DISH_REORDER:       'DISH_REORDER',               // status: reducer

    /** payload: { id, sectionId, toIndex } */
    DISH_MOVE_SECTION:  'DISH_MOVE_SECTION',          // status: reducer

    // ---------- Section lifecycle ----------
    /** payload: { name, position? } */
    SECTION_ADD:        'SECTION_ADD',                // status: reducer

    /** payload: { id, patch } */
    SECTION_UPDATE:     'SECTION_UPDATE',             // status: reducer

    /** payload: { id, dishStrategy: 'absorb'|'remove' } */
    SECTION_REMOVE:     'SECTION_REMOVE',             // status: reducer

    /** payload: { id, toIndex } */
    SECTION_REORDER:    'SECTION_REORDER',            // status: reducer

    // ---------- Allergen + dietary ----------
    /** payload: { id, code, on } -- on=undefined means toggle */
    ALLERGEN_TOGGLE:    'ALLERGEN_TOGGLE',            // status: reducer

    /** payload: { id, code, state: 'contains'|'may' } */
    ALLERGEN_SET_STATE: 'ALLERGEN_SET_STATE',         // status: reducer

    /** payload: { id, code, on } */
    DIETARY_TOGGLE:     'DIETARY_TOGGLE',             // status: reducer

    /** payload: { regime } -- 'us-fda9'|'eu-fic14'|'uk-ppds'|'ca-health'|'au-fsanz' */
    REGIME_SET:         'REGIME_SET',                 // status: reducer

    // ---------- Theme + customize ----------
    /** payload: { themeId } */
    THEME_SET:          'THEME_SET',                  // status: reducer

    /** payload: partial customize -- { paper?, ink?, accent?, paperTexture?, font? } */
    THEME_CUSTOMIZE:    'THEME_CUSTOMIZE',            // status: reducer

    /** payload: { mod: 'season'|'daypart'|'event', value } */
    THEME_MOD_SET:      'THEME_MOD_SET',              // status: reducer

    // ---------- Meta ----------
    /** payload: partial meta */
    META_UPDATE:        'META_UPDATE',                // status: reducer

    // ---------- Logo + paper ----------
    /** payload: { dataUrl, sha256?, bytes? } */
    LOGO_SET:           'LOGO_SET',                   // status: reducer

    /** payload: null */
    LOGO_CLEAR:         'LOGO_CLEAR',                 // status: reducer

    /** payload: { customDims } -- { wMm, hMm } or null to clear */
    PAPER_SET_CUSTOM:   'PAPER_SET_CUSTOM',           // status: reducer

    // ---------- Bulk + lifecycle ----------
    /** payload: { menu } -- replace whole canonical menu (load template,
     *  load draft, accept handoff banner) */
    MENU_REPLACE:       'MENU_REPLACE',               // status: reducer

    /** payload: { rows } -- v2 row-stream from paste-ingest */
    MENU_PASTE_INGEST:  'MENU_PASTE_INGEST',          // status: reducer

    /** payload: null -- clear all dishes + sections (keep theme + meta) */
    MENU_CLEAR_DISHES:  'MENU_CLEAR_DISHES',          // status: reducer

    // ---------- History (intercepted by store, NOT the reducer) ----------
    /** payload: null */
    UNDO:               '@@UNDO',                     // status: wired (store)
    /** payload: null */
    REDO:               '@@REDO',                     // status: wired (store)

    // ---------- Cross-tool ----------
    /** payload: { tool, transitionFrom } -- bumps source.updatedAt */
    HANDOFF_NOTE:       'HANDOFF_NOTE',               // status: reducer

    // ---------- Pending (Wave B+) ----------
    /** Wave B10 OCR import */
    OCR_IMPORT:         'OCR_IMPORT',                 // status: pending

    /** Wave B11 studio handoff brief */
    STUDIO_HANDOFF:     'STUDIO_HANDOFF',             // status: pending
  });

  var api = { ACTIONS: ACTIONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_ACTIONS = api;
})(typeof window !== 'undefined' ? window : null);
