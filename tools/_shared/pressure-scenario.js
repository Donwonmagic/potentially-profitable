/**
 * Muntin — Pressure Lab scenario permalinks (URL-fragment, no fetch/storage).
 *
 * Encodes a what-if scenario into the URL hash so an operator can share
 * "look what happens to beef if feed spikes" — mirroring Plate Cost's
 * fragment model (the part of a URL after # is never sent to a server). Only
 * indicators MOVED off the live base are encoded, so links stay short and
 * "what did they change" is self-evident. Carries % deltas only — never a price.
 *
 *   encode(item, scenario, base) -> '#v=1&it=<item>&o=<id>:<delta>;<id>:<delta>'
 *   decode(hash)                 -> { item, obs: { id: changePct } } | null
 *
 * Pure, deterministic, no DOM. Node: module.exports. Browser: window.MuntinPressureScenario.
 */
(function (root) {
  'use strict';
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }
  function round(v) { return Math.round(v * 1000) / 1000; }

  function encode(item, scenario, base) {
    if (!item || !scenario) return '';
    base = base || {};
    var parts = [];
    Object.keys(scenario).forEach(function (id) {
      var v = scenario[id];
      if (typeof v !== 'number' || !isFinite(v)) return;
      if (base[id] === v) return;                 // unchanged → omit (rehydrates to live)
      if (!/^[a-z0-9-]+$/.test(id)) return;        // defensive: ids are slug-safe
      parts.push(id + ':' + round(v));
    });
    var frag = '#v=1&it=' + encodeURIComponent(item);
    if (parts.length) frag += '&o=' + parts.join(';');
    return frag;
  }

  function decode(hash) {
    if (!hash) return null;
    var h = String(hash).replace(/^#/, '');
    var seg = {};
    h.split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i > 0) seg[kv.slice(0, i)] = kv.slice(i + 1);
    });
    if (seg.v !== '1' || !seg.it) return null;     // forward-compat: unknown versions ignored
    var item = decodeURIComponent(seg.it);
    if (!/^[a-z0-9-]+$/.test(item)) return null;
    var obs = {};
    if (seg.o) {
      seg.o.split(';').forEach(function (pair) {
        var c = pair.indexOf(':');
        if (c < 0) return;
        var id = pair.slice(0, c), v = num(pair.slice(c + 1));
        if (/^[a-z0-9-]+$/.test(id) && v != null) obs[id] = v;
      });
    }
    return { item: item, obs: obs };
  }

  var api = { encode: encode, decode: decode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinPressureScenario = api;
  if (root) root.MuntinPressureScenario = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
