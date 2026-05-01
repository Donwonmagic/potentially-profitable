/**
 * Menu Design Suite — draft persistence module (W22 extraction).
 *
 * owns:    safeLs probe, persistDraft, loadDraft, clearDraft, plus
 *          the v1 -> v2 schema migrator
 * exports: MD_DRAFT on window; module.exports for tests
 * deps:    none (pure storage layer; orchestrator passes the whole
 *          state object in)
 * why:     The W5-8 autosave + draft-restore flow has been growing
 *          alongside the schema (now spans rows + theme + paper +
 *          customDims + meta + customize{mods}). Pulling the IO
 *          out of the orchestrator lets the migrator land in one
 *          place and lets the future state/store + state/reducer
 *          extractions reach in.
 *
 * Privacy posture: every localStorage call carries an
 * `// h8-exempt:` annotation per the build-invariant convention.
 * The keys ('mtn:menu-design:draft', 'mtn:menu-design:logo') are
 * the same as before the extraction so existing operator drafts
 * round-trip cleanly.
 */
(function (root) {
  'use strict';

  var DRAFT_KEY = 'mtn:menu-design:draft';
  var LOGO_KEY  = 'mtn:menu-design:logo';
  var LOGO_BUDGET = 200 * 1024; // 200KB

  function safeLs() {
    try {
      var probe = '__md_probe__';
      localStorage.setItem(probe, probe); // h8-exempt: storage probe
      localStorage.removeItem(probe);
      return localStorage;
    } catch (_) { return null; }
  }

  function persistDraft(draft, logoUrl) {
    var ls = safeLs();
    if (!ls) return false;
    try {
      ls.setItem(DRAFT_KEY, JSON.stringify(draft)); // h8-exempt: in-progress menu draft
      if (logoUrl && logoUrl.length <= LOGO_BUDGET) {
        ls.setItem(LOGO_KEY, logoUrl); // h8-exempt: in-progress menu logo
      } else if (!logoUrl) {
        ls.removeItem(LOGO_KEY);
      }
      return true;
    } catch (_) { /* quota — silent */ return false; }
  }

  function loadDraft() {
    var ls = safeLs();
    if (!ls) return null;
    try {
      var raw = ls.getItem(DRAFT_KEY); // h8-exempt: read draft
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || !Array.isArray(d.rows)) return null;
      return migrate(d);
    } catch (_) { return null; }
  }

  function loadLogo() {
    var ls = safeLs();
    if (!ls) return null;
    try { return ls.getItem(LOGO_KEY); } // h8-exempt: read logo draft
    catch (_) { return null; }
  }

  function clearDraft() {
    var ls = safeLs();
    if (!ls) return;
    try { ls.removeItem(DRAFT_KEY); ls.removeItem(LOGO_KEY); } catch (_) {}
  }

  // v1 -> v2 schema migrator. The original draft shape lacked
  // `version`, `meta`, `customize`, `customDims`. New fields default
  // to empty / null so a v1 draft round-trips through v2 without
  // surprising the operator.
  function migrate(d) {
    if (!d || typeof d !== 'object') return d;
    if (!d.version) {
      d.version = 2;
    }
    if (!d.meta) {
      d.meta = { tagline: '', story: '', coverPage: false,
                 address: '', hours: '', serviceCharge: '',
                 sourcing: '', disclaimer: '', askYourServer: '' };
    }
    if (!d.customize) {
      d.customize = { accent: null, paper: null, ink: null,
                      paperTexture: false,
                      mods: { season: 'none', daypart: 'none', event: 'none' } };
    }
    if (!d.customize.mods) {
      d.customize.mods = { season: 'none', daypart: 'none', event: 'none' };
    }
    return d;
  }

  var api = {
    DRAFT_KEY: DRAFT_KEY,
    LOGO_KEY:  LOGO_KEY,
    safeLs:    safeLs,
    persist:   persistDraft,
    load:      loadDraft,
    loadLogo:  loadLogo,
    clear:     clearDraft,
    migrate:   migrate
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_DRAFT = api;
})(typeof window !== 'undefined' ? window : null);
