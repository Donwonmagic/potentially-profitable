/**
 * Menu Design Suite — pure reducer for the canonical v3 menu schema.
 *
 * Contract: (state, action) → newState. Pure. No side effects.
 * Never mutates `state`; always returns a new top-level object
 * (deep-cloned only on the slices that change). Throws on
 * unknown action types so typos surface in tests.
 *
 * Depends on:
 *   tools/_shared/menu-schema.js   (MD_SCHEMA)  — blank constructors,
 *                                                 mintId helpers
 *   tools/menu-design/state/actions.js (MD_ACTIONS) — type constants
 *
 * Loaded in browser as MD_REDUCER.reduce(state, action). Tested in
 * Node via require(). The store (state/store.js) wraps this in
 * dispatch + history + autosave plumbing.
 *
 * Wired-in slice tracking: each case carries a `// status:` tag so
 * the orchestrator's incremental cutover (Wave A1 phase 1 → 6) is
 * legible from this file alone.
 */
(function (root) {
  'use strict';

  var SCHEMA = (typeof MD_SCHEMA !== 'undefined') ? MD_SCHEMA
              : (typeof require !== 'undefined') ? require('../../_shared/menu-schema.js')
              : null;
  var ACT = (typeof MD_ACTIONS !== 'undefined') ? MD_ACTIONS.ACTIONS
            : (typeof require !== 'undefined') ? require('./actions.js').ACTIONS
            : null;
  if (!SCHEMA || !ACT) throw new Error('reducer requires MD_SCHEMA + MD_ACTIONS');

  // ---------- helpers ----------
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function bumpSource(state, action) {
    var src = clone(state.source || { tool: '', updatedAt: 0, transitionFrom: '' });
    src.updatedAt = Date.now();
    return src;
  }

  function dishById(state, id) {
    return (state.dishes || []).find(function (d) { return d.id === id; }) || null;
  }
  function sectionById(state, id) {
    return (state.sections || []).find(function (s) { return s.id === id; }) || null;
  }

  // Renormalize section + dish positions to be 0..N-1 contiguous.
  function renormalize(menu) {
    menu.sections = (menu.sections || [])
      .slice()
      .sort(function (a, b) { return (a.position || 0) - (b.position || 0); })
      .map(function (s, i) { s.position = i; return s; });
    var dishesBySection = {};
    (menu.dishes || []).forEach(function (d) {
      var sid = d.sectionId;
      (dishesBySection[sid] = dishesBySection[sid] || []).push(d);
    });
    var out = [];
    menu.sections.forEach(function (s) {
      var arr = (dishesBySection[s.id] || []).slice()
        .sort(function (a, b) { return (a.position || 0) - (b.position || 0); })
        .map(function (d, i) { d.position = i; return d; });
      out = out.concat(arr);
    });
    // Append orphan dishes (sectionId not found) under a synthetic
    // section if any — should not happen post-A5 migration but
    // defends against partial v2 imports.
    var sectionIds = {};
    menu.sections.forEach(function (s) { sectionIds[s.id] = true; });
    var orphans = (menu.dishes || []).filter(function (d) { return !sectionIds[d.sectionId]; });
    if (orphans.length) {
      var s = SCHEMA.blankSection({ name: '', position: menu.sections.length });
      menu.sections.push(s);
      orphans.forEach(function (d, i) { d.sectionId = s.id; d.position = i; out.push(d); });
    }
    menu.dishes = out;
    return menu;
  }

  // ---------- the reducer ----------
  function reduce(state, action) {
    if (!state || state.v !== SCHEMA.SCHEMA_VERSION) {
      // Defensive: any pre-v3 state coming in should be migrated
      // by the store before it ever reaches here. If it didn't, do
      // it now — a no-op for fully-formed v3 inputs.
      state = SCHEMA.migrate(state);
    }
    if (!action || !action.type) return state;

    switch (action.type) {
      // ============== DISH ==============
      case ACT.DISH_ADD: { // status: reducer
        var p = action.payload || {};
        var sectionId = p.sectionId;
        // If no section specified, append into the last section (or
        // create one if there are none).
        if (!sectionId) {
          if (!state.sections.length) {
            state = clone(state);
            var s0 = SCHEMA.blankSection({ name: '', position: 0 });
            state.sections.push(s0);
            sectionId = s0.id;
          } else {
            sectionId = state.sections[state.sections.length - 1].id;
          }
        }
        var dish = SCHEMA.blankDish(Object.assign({ sectionId: sectionId }, p.dish || {}));
        var next = clone(state);
        // place at end of section
        var inSection = next.dishes.filter(function (d) { return d.sectionId === sectionId; });
        dish.position = inSection.length;
        next.dishes.push(dish);
        next.source = bumpSource(next, action);
        return next;
      }

      case ACT.DISH_UPDATE: { // status: reducer
        var p2 = action.payload || {};
        if (!p2.id || !p2.patch) return state;
        var next2 = clone(state);
        var d = dishById(next2, p2.id);
        if (!d) return state;
        for (var k in p2.patch) {
          if (Object.prototype.hasOwnProperty.call(p2.patch, k)) d[k] = p2.patch[k];
        }
        next2.source = bumpSource(next2, action);
        return next2;
      }

      case ACT.DISH_REMOVE: { // status: reducer
        var id = (action.payload || {}).id;
        if (!id) return state;
        var next3 = clone(state);
        next3.dishes = next3.dishes.filter(function (d) { return d.id !== id; });
        next3 = renormalize(next3);
        next3.source = bumpSource(next3, action);
        return next3;
      }

      case ACT.DISH_REORDER: { // status: reducer
        var p4 = action.payload || {};
        if (!p4.id || typeof p4.toIndex !== 'number') return state;
        var next4 = clone(state);
        var d4 = dishById(next4, p4.id);
        if (!d4) return state;
        var sectionDishes = next4.dishes.filter(function (x) { return x.sectionId === d4.sectionId; });
        sectionDishes.sort(function (a, b) { return (a.position || 0) - (b.position || 0); });
        var fromIdx = sectionDishes.findIndex(function (x) { return x.id === d4.id; });
        if (fromIdx < 0) return state;
        sectionDishes.splice(fromIdx, 1);
        sectionDishes.splice(Math.max(0, Math.min(p4.toIndex, sectionDishes.length)), 0, d4);
        sectionDishes.forEach(function (x, i) { x.position = i; });
        next4 = renormalize(next4);
        next4.source = bumpSource(next4, action);
        return next4;
      }

      case ACT.DISH_MOVE_SECTION: { // status: reducer
        var p5 = action.payload || {};
        if (!p5.id || !p5.sectionId) return state;
        var next5 = clone(state);
        var d5 = dishById(next5, p5.id);
        var s5 = sectionById(next5, p5.sectionId);
        if (!d5 || !s5) return state;
        d5.sectionId = p5.sectionId;
        d5.position = (typeof p5.toIndex === 'number') ? p5.toIndex : 9999;
        next5 = renormalize(next5);
        next5.source = bumpSource(next5, action);
        return next5;
      }

      // ============== SECTION ==============
      case ACT.SECTION_ADD: { // status: reducer
        var sa = action.payload || {};
        var next6 = clone(state);
        var newSec = SCHEMA.blankSection({
          name: sa.name || '',
          position: typeof sa.position === 'number' ? sa.position : next6.sections.length
        });
        next6.sections.push(newSec);
        next6 = renormalize(next6);
        next6.source = bumpSource(next6, action);
        return next6;
      }

      case ACT.SECTION_UPDATE: { // status: reducer
        var su = action.payload || {};
        if (!su.id || !su.patch) return state;
        var next7 = clone(state);
        var s7 = sectionById(next7, su.id);
        if (!s7) return state;
        for (var sk in su.patch) {
          if (Object.prototype.hasOwnProperty.call(su.patch, sk)) s7[sk] = su.patch[sk];
        }
        next7.source = bumpSource(next7, action);
        return next7;
      }

      case ACT.SECTION_REMOVE: { // status: reducer
        var sr = action.payload || {};
        if (!sr.id) return state;
        var strategy = sr.dishStrategy || 'absorb';
        var next8 = clone(state);
        var sec = sectionById(next8, sr.id);
        if (!sec) return state;
        if (strategy === 'remove') {
          next8.dishes = next8.dishes.filter(function (d) { return d.sectionId !== sr.id; });
        } else {
          // absorb into preceding section (or create one if none)
          var sortedSecs = next8.sections.slice().sort(function (a, b) { return (a.position || 0) - (b.position || 0); });
          var idx = sortedSecs.findIndex(function (s) { return s.id === sr.id; });
          var target = (idx > 0) ? sortedSecs[idx - 1] : sortedSecs[idx + 1];
          if (!target) {
            target = SCHEMA.blankSection({ name: '', position: 0 });
            next8.sections.push(target);
          }
          next8.dishes.forEach(function (d) {
            if (d.sectionId === sr.id) d.sectionId = target.id;
          });
        }
        next8.sections = next8.sections.filter(function (s) { return s.id !== sr.id; });
        next8 = renormalize(next8);
        next8.source = bumpSource(next8, action);
        return next8;
      }

      case ACT.SECTION_REORDER: { // status: reducer
        var so = action.payload || {};
        if (!so.id || typeof so.toIndex !== 'number') return state;
        var next9 = clone(state);
        var sorted = next9.sections.slice().sort(function (a, b) { return (a.position || 0) - (b.position || 0); });
        var from = sorted.findIndex(function (x) { return x.id === so.id; });
        if (from < 0) return state;
        var moving = sorted.splice(from, 1)[0];
        sorted.splice(Math.max(0, Math.min(so.toIndex, sorted.length)), 0, moving);
        sorted.forEach(function (x, i) { x.position = i; });
        next9.sections = sorted;
        next9 = renormalize(next9);
        next9.source = bumpSource(next9, action);
        return next9;
      }

      // ============== ALLERGEN + DIETARY ==============
      case ACT.ALLERGEN_TOGGLE: { // status: reducer
        var at = action.payload || {};
        if (!at.id || !at.code) return state;
        var nextA = clone(state);
        var dA = dishById(nextA, at.id);
        if (!dA) return state;
        dA.allergens = Array.isArray(dA.allergens) ? dA.allergens.slice() : [];
        var has = dA.allergens.indexOf(at.code) >= 0;
        var on  = (typeof at.on === 'boolean') ? at.on : !has;
        if (on && !has) dA.allergens.push(at.code);
        if (!on && has) dA.allergens = dA.allergens.filter(function (c) { return c !== at.code; });
        // Drop stale allergenStates for codes no longer present.
        if (dA.allergenStates) {
          if (!on) delete dA.allergenStates[at.code];
        }
        nextA.source = bumpSource(nextA, action);
        return nextA;
      }

      case ACT.ALLERGEN_SET_STATE: { // status: reducer
        var as = action.payload || {};
        if (!as.id || !as.code || (as.state !== 'contains' && as.state !== 'may')) return state;
        var nextB = clone(state);
        var dB = dishById(nextB, as.id);
        if (!dB) return state;
        dB.allergens = Array.isArray(dB.allergens) ? dB.allergens.slice() : [];
        if (dB.allergens.indexOf(as.code) < 0) dB.allergens.push(as.code);
        dB.allergenStates = Object.assign({}, dB.allergenStates || {});
        dB.allergenStates[as.code] = as.state;
        nextB.source = bumpSource(nextB, action);
        return nextB;
      }

      case ACT.DIETARY_TOGGLE: { // status: reducer
        var dt = action.payload || {};
        if (!dt.id || !dt.code) return state;
        var nextC = clone(state);
        var dC = dishById(nextC, dt.id);
        if (!dC) return state;
        dC.dietary = Array.isArray(dC.dietary) ? dC.dietary.slice() : [];
        var hasD = dC.dietary.indexOf(dt.code) >= 0;
        var onD  = (typeof dt.on === 'boolean') ? dt.on : !hasD;
        if (onD && !hasD) dC.dietary.push(dt.code);
        if (!onD && hasD) dC.dietary = dC.dietary.filter(function (c) { return c !== dt.code; });
        nextC.source = bumpSource(nextC, action);
        return nextC;
      }

      case ACT.REGIME_SET: { // status: reducer
        var rs = action.payload || {};
        if (!rs.regime || !SCHEMA.REGIMES[rs.regime]) return state;
        var nextR = clone(state);
        nextR.meta.allergenRegime = rs.regime;
        nextR.source = bumpSource(nextR, action);
        return nextR;
      }

      // ============== THEME ==============
      case ACT.THEME_SET: { // status: reducer
        var ts = action.payload || {};
        var nextT = clone(state);
        nextT.theme.id = ts.themeId || '';
        nextT.source = bumpSource(nextT, action);
        return nextT;
      }

      case ACT.THEME_CUSTOMIZE: { // status: reducer
        var tc = action.payload || {};
        var nextU = clone(state);
        ['paper', 'ink', 'accent', 'paperTexture', 'font'].forEach(function (k) {
          if (Object.prototype.hasOwnProperty.call(tc, k)) nextU.theme[k] = tc[k];
        });
        nextU.source = bumpSource(nextU, action);
        return nextU;
      }

      case ACT.THEME_MOD_SET: { // status: reducer
        var tm = action.payload || {};
        if (!tm.mod || ['season','daypart','event'].indexOf(tm.mod) < 0) return state;
        var nextV = clone(state);
        nextV.theme.mods = Object.assign({}, nextV.theme.mods, _kv(tm.mod, tm.value || ''));
        nextV.source = bumpSource(nextV, action);
        return nextV;
      }

      // ============== META ==============
      case ACT.META_UPDATE: { // status: reducer
        var mu = action.payload || {};
        var nextM = clone(state);
        for (var mk in mu) if (Object.prototype.hasOwnProperty.call(mu, mk)) nextM.meta[mk] = mu[mk];
        nextM.source = bumpSource(nextM, action);
        return nextM;
      }

      // ============== LOGO + PAPER ==============
      case ACT.LOGO_SET: { // status: reducer
        var ls = action.payload || {};
        if (!ls.dataUrl) return state;
        var nextL = clone(state);
        nextL.logos.primary = {
          dataUrl: ls.dataUrl,
          sha256: ls.sha256 || '',
          bytes: ls.bytes || 0
        };
        nextL.source = bumpSource(nextL, action);
        return nextL;
      }

      case ACT.LOGO_CLEAR: { // status: reducer
        var nextLC = clone(state);
        nextLC.logos.primary = null;
        nextLC.source = bumpSource(nextLC, action);
        return nextLC;
      }

      case ACT.PAPER_SET_CUSTOM: { // status: reducer
        var pc = action.payload || {};
        var nextP = clone(state);
        nextP.theme.customDims = pc.customDims || null;
        nextP.source = bumpSource(nextP, action);
        return nextP;
      }

      // ============== BULK + LIFECYCLE ==============
      case ACT.MENU_REPLACE: { // status: reducer
        var mr = action.payload || {};
        if (!mr.menu) return state;
        var migrated = SCHEMA.migrate(mr.menu);
        migrated.source = bumpSource(migrated, action);
        return migrated;
      }

      case ACT.MENU_PASTE_INGEST: { // status: reducer
        var mi = action.payload || {};
        if (!Array.isArray(mi.rows)) return state;
        // Build a v2-ish shape and migrate; preserves theme + meta from
        // the existing state.
        var v2Shape = {
          rows: mi.rows,
          theme: state.theme.id,
          meta: clone(state.meta),
          customize: {
            paper:        state.theme.paper,
            ink:          state.theme.ink,
            accent:       state.theme.accent,
            paperTexture: state.theme.paperTexture,
            font:         state.theme.font,
            mods:         clone(state.theme.mods)
          },
          customDims: state.theme.customDims
        };
        var nextI = SCHEMA.migrate(v2Shape);
        nextI.source = bumpSource(nextI, action);
        return nextI;
      }

      case ACT.MENU_CLEAR_DISHES: { // status: reducer
        var nextX = clone(state);
        nextX.dishes = [];
        nextX.sections = [];
        nextX.source = bumpSource(nextX, action);
        return nextX;
      }

      // ============== CROSS-TOOL ==============
      case ACT.HANDOFF_NOTE: { // status: reducer
        var hn = action.payload || {};
        var nextH = clone(state);
        nextH.source = {
          tool: hn.tool || nextH.source.tool || '',
          updatedAt: Date.now(),
          transitionFrom: hn.transitionFrom || ''
        };
        return nextH;
      }

      // ============== UNKNOWN ==============
      default:
        // Strict mode for tests: throw on typos. Browser code wraps
        // dispatch with a try/catch so a stray dispatch doesn't kill
        // the editor — see store.js.
        throw new Error('reducer: unknown action type "' + action.type + '"');
    }
  }

  function _kv(k, v) { var o = {}; o[k] = v; return o; }

  var api = { reduce: reduce };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_REDUCER = api;
})(typeof window !== 'undefined' ? window : null);
