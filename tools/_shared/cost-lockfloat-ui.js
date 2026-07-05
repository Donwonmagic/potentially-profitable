/**
 * cost-lockfloat-ui.js — the Lock Sheet renderer for the reframed Cost Pulse.
 *
 * Reads the same-origin seed window.MUNTIN_COST_LOCKFLOAT (built by
 * scripts/build-cost-lockfloat.mjs) and renders the predictability instrument:
 *   · a four-lane hero strip (Lock / Cushion / Float / Won't-call) with LIVE counts,
 *   · the "how often can you reprint?" horizon control (the primary control),
 *   · the predictability ladder (band LENGTH = next-week reach; one hue; no arrow),
 *   · per-item decision cards (inline coverage receipt + horizon stamp + lock≠cheap),
 *   · the Refusal Wall (the withheld majority, itemized with machine reasons).
 *
 * HONEST BY CONSTRUCTION: it speaks HOW FAR a price tends to move, never WHICH WAY;
 * "lock" = steady-enough-to-commit (never "cheap"/"buy now"), "float" = too volatile
 * to commit (never "will fall"). Every band ships its raw coverage + Wilson CI + read
 * count; withheld items are handed back, never guessed. Pure DOM (no innerHTML), no
 * fetch, no storage. Browser: window.MuntinLockFloatUI.
 */
(function (root) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var MAXREACH = 70;   // ladder axis half-range, %

  // Horizon re-sort: how often the operator can revisit. A weekly reprinter can
  // commit a slightly looser item (they re-check in a week); a seasonal reprinter
  // needs a steadier one. This is a PLANNING rule of thumb keyed to revisit cadence,
  // NOT a claim that the weekly band measures a longer horizon — the stamp says so.
  var HORIZONS = {
    weekly:   { lockHw: 0.12, label_en: 'weekly',   label_es: 'semanalmente', stamp_en: "you reprint weekly, so a slightly looser band is fine — you'll revisit in a week", stamp_es: 'reimprimes cada semana, así que una banda algo más amplia está bien — la revisas en una semana' },
    monthly:  { lockHw: 0.08, label_en: 'monthly',  label_es: 'mensualmente', stamp_en: "you reprint monthly — we only call it lockable if its week-to-week band is tight, since you won't revisit soon", stamp_es: 'reimprimes cada mes — solo lo llamamos fijable si su banda semanal es estrecha, porque no lo revisarás pronto' },
    seasonal: { lockHw: 0.05, label_en: 'by season', label_es: 'por temporada', stamp_en: 'you commit for a season, so only the very steadiest earn a lock — and even then this measures next-week reach, not months of drift', stamp_es: 'te comprometes por una temporada, así que solo lo más estable se fija — y aun así esto mide el alcance de la próxima semana, no meses de deriva' },
  };

  var BK = {
    lock:     { cls: 'lock',     en: 'Lock it',      es: 'Fíjalo',        verb_en: 'Plan around it',  verb_es: 'Planea con él' },
    cushion:  { cls: 'cushion',  en: 'Keep a cushion', es: 'Deja margen', verb_en: 'Leave headroom',  verb_es: 'Deja holgura' },
    float:    { cls: 'float',    en: 'Float it',     es: 'Déjalo variable', verb_en: "Don't commit",  verb_es: 'No te comprometas' },
    withhold: { cls: 'hold',     en: "Won't call it", es: 'No lo llamamos', verb_en: 'Withheld',       verb_es: 'Retenido' },
  };
  var REASON = {
    'no-series':    { en: 'no public history to band yet', es: 'aún sin historial público para acotar' },
    'monthly-thin': { en: 'prints too thin to band — only a monthly read', es: 'muy pocas lecturas para acotar — solo lectura mensual' },
    'thin':         { en: 'not enough history to back a band', es: 'historial insuficiente para respaldar una banda' },
    'flat':         { en: 'flat and stale — nothing to call', es: 'plano y sin cambios — nada que llamar' },
    'volatile':     { en: 'swings too wide to fence', es: 'oscila demasiado para acotar' },
  };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function svgEl(tag, attrs) { var e = document.createElementNS(NS, tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function xreach(p) { return ((p + MAXREACH) / (2 * MAXREACH)) * 100; }

  function api(es) {
    function L(en, esT) { return es ? esT : en; }
    function money(c, u) { if (!(c > 0)) return null; var d = c / 100; var s = d >= 100 ? '$' + Math.round(d).toLocaleString() : '$' + d.toFixed(2); return u ? s : s; }
    function pctTxt(p) { return (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(Math.round(p * 100)) + '%'; }
    function reclassify(it, horizon) {
      // Re-bucket from the SAME allowlisted fields (halfWidthPct, coverageLo) under
      // the chosen revisit horizon; withheld stays withheld (never re-opened).
      if (it.bucket === 'withhold') return 'withhold';
      var hw = it.halfWidthPct, lockHw = HORIZONS[horizon].lockHw;
      if (hw == null) return 'withhold';
      if (hw <= lockHw && it.coverageLo != null && it.coverageLo >= 0.60) return 'lock';
      if (hw <= 0.20) return 'cushion';
      if (hw <= 0.30) return 'float';
      return 'withhold';
    }

    function heroStrip(DATA, horizon) {
      var items = Object.keys(DATA.items).map(function (k) { return Object.assign({ slug: k }, DATA.items[k]); });
      var counts = { lock: 0, cushion: 0, float: 0, withhold: 0 };
      items.forEach(function (it) { counts[reclassify(it, horizon)]++; });
      var strip = el('div', 'lf-lanes');
      [['lock', counts.lock], ['cushion', counts.cushion], ['float', counts.float], ['withhold', counts.withhold]].forEach(function (p) {
        var lane = el('div', 'lf-lane lf-lane--' + BK[p[0]].cls);
        lane.appendChild(el('span', 'lf-lane-n', String(p[1])));
        lane.appendChild(el('span', 'lf-lane-lab', L(BK[p[0]].en, BK[p[0]].es)));
        strip.appendChild(lane);
      });
      return { strip: strip, counts: counts, items: items };
    }

    function horizonControl(current, onPick) {
      var wrap = el('div', 'lf-horizon');
      wrap.appendChild(el('span', 'lf-horizon-q', L('How often can you reprint your menu?', '¿Con qué frecuencia reimprimes tu menú?')));
      var group = el('div', 'lf-horizon-btns'); group.setAttribute('role', 'group');
      ['weekly', 'monthly', 'seasonal'].forEach(function (h) {
        var b = el('button', 'lf-hbtn' + (h === current ? ' is-on' : ''), L(cap(HORIZONS[h].label_en), cap(HORIZONS[h].label_es)));
        b.type = 'button'; b.setAttribute('aria-pressed', h === current ? 'true' : 'false');
        b.addEventListener('click', function () { onPick(h); });
        group.appendChild(b);
      });
      wrap.appendChild(group);
      return wrap;
    }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function ladder(items, horizon) {
      var order = { lock: 0, cushion: 1, float: 2, withhold: 3 };
      var rows = items.slice().sort(function (a, b) {
        var ba = reclassify(a, horizon), bb = reclassify(b, horizon);
        return (order[ba] - order[bb]) || ((a.halfWidthPct == null ? 9 : a.halfWidthPct) - (b.halfWidthPct == null ? 9 : b.halfWidthPct));
      });
      var box = el('div', 'lf-ladder');
      var scaleWrap = el('div', 'lf-scale');
      [-60, -30, 0, 30, 60].forEach(function (t) { var s = el('span', 'lf-tick', (t > 0 ? '+' : '') + t + '%'); s.style.left = xreach(t) + '%'; scaleWrap.appendChild(s); });
      box.appendChild(scaleWrap);
      rows.forEach(function (it) {
        var bk = reclassify(it, horizon);
        var row = el('div', 'lf-lrow');
        var nm = el('div', 'lf-lname'); nm.appendChild(el('span', null, shortName(it.name)));
        var u = el('span', 'lf-lunit', it.unit ? ' /' + it.unit : ''); nm.appendChild(u);
        var track = el('div', 'lf-ltrack');
        [-60, -30, 30, 60].forEach(function (g) { var gl = el('span', 'lf-grid'); gl.style.left = xreach(g) + '%'; track.appendChild(gl); });
        var z = el('span', 'lf-grid lf-grid--zero'); z.style.left = xreach(0) + '%'; track.appendChild(z);
        if (it.upPct != null && it.downPct != null && !(it.upPct === 0 && it.downPct === 0)) {
          var lft = xreach(-it.downPct * 100), rgt = xreach(it.upPct * 100);
          var band = el('div', 'lf-band lf-band--' + BK[bk].cls);
          band.style.left = lft + '%'; band.style.width = Math.max(1.2, rgt - lft) + '%';
          if (bk === 'withhold') band.style.opacity = '.4';
          track.appendChild(band);
        } else {
          var cap2 = el('span', 'lf-lcap', it.reason === 'flat' ? L('flat — no range', 'plano — sin rango') : L('withheld', 'retenido'));
          cap2.style.left = xreach(0) + '%'; track.appendChild(cap2);
        }
        row.appendChild(nm); row.appendChild(track); box.appendChild(row);
      });
      return box;
    }

    function bandSvg(it, bk) {
      var W = 240, H = 26;
      var svg = svgEl('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, class: 'lf-cbsvg', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
      svg.appendChild(svgEl('rect', { x: 0, y: 5, width: W, height: 16, rx: 4, fill: 'var(--lf-surface-2)' }));
      var lo = xreach(-it.downPct * 100) / 100 * W, hi = xreach(it.upPct * 100) / 100 * W;
      svg.appendChild(svgEl('rect', { x: lo.toFixed(1), y: 6, width: Math.max(2, hi - lo).toFixed(1), height: 14, rx: 3, fill: 'var(--lf-' + bk + ')', 'fill-opacity': '.9' }));
      svg.appendChild(svgEl('rect', { x: (W / 2 - 1).toFixed(1), y: 3, width: 2, height: 20, fill: 'var(--lf-ink)', 'fill-opacity': '.5' }));
      return svg;
    }
    function sparkSvg(vals, bk) {
      var W = 240, H = 30, pad = 2;
      var svg = svgEl('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, class: 'lf-spark', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
      if (!vals || vals.length < 2) return svg;
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rng = (mx - mn) || 1;
      var d = 'M', i;
      for (i = 0; i < vals.length; i++) { var x = pad + (i / (vals.length - 1)) * (W - 2 * pad); var y = pad + (1 - (vals[i] - mn) / rng) * (H - 2 * pad); d += (i ? ' L ' : '') + x.toFixed(1) + ' ' + y.toFixed(1); }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--lf-' + bk + ')', 'stroke-width': '1.6', 'vector-effect': 'non-scaling-stroke' }));
      return svg;
    }

    function receiptLine(it) {
      var per = it.monthly ? L('monthly', 'mensual') : L('weekly', 'semanal');
      var p = el('p', 'lf-receipt');
      p.appendChild(document.createTextNode(L('A band this wide caught the next ' + per + ' print ', 'Una banda así capturó la próxima lectura ' + per + ' ')));
      var b = el('strong', null, Math.round(it.coverage * 100) + '%'); p.appendChild(b);
      p.appendChild(document.createTextNode(L(' of the time (' + Math.round(it.coverageLo * 100) + '–' + Math.round(it.coverageHi * 100) + '%, over ' + it.nTested + ' reads).',
        ' de las veces (' + Math.round(it.coverageLo * 100) + '–' + Math.round(it.coverageHi * 100) + '%, en ' + it.nTested + ' lecturas).')));
      return p;
    }

    function card(it, horizon) {
      var bk = reclassify(it, horizon);
      var c = el('div', 'lf-card');
      var top = el('div', 'lf-card-top');
      var left = el('div');
      left.appendChild(el('div', 'lf-card-name', it.name));
      var mv = money(it.level, it.unit);
      if (mv && bk !== 'withhold') { var lv = el('div', 'lf-card-lvl'); lv.appendChild(el('span', 'lf-card-lvln', mv)); lv.appendChild(document.createTextNode(it.unit ? ' /' + it.unit : '')); left.appendChild(lv); }
      var pill = el('span', 'lf-pill lf-pill--' + BK[bk].cls, bk === 'withhold' ? L('held back', 'retenido') : L(BK[bk].en, BK[bk].es));
      top.appendChild(left); top.appendChild(pill); c.appendChild(top);

      if (it.upPct != null && it.downPct != null && !(it.upPct === 0 && it.downPct === 0)) {
        var bandWrap = el('div', 'lf-card-band');
        var row = el('div', 'lf-cb-row');
        row.appendChild(el('span', null, pctTxt(-it.downPct)));
        row.appendChild(el('span', 'lf-cb-now', L('today', 'hoy')));
        row.appendChild(el('span', null, pctTxt(it.upPct)));
        bandWrap.appendChild(row);
        bandWrap.appendChild(bandSvg(it, bk === 'withhold' ? 'hold' : BK[bk].cls));
        c.appendChild(bandWrap);
        if (bk !== 'withhold' && it.coverage != null) c.appendChild(receiptLine(it));
      }
      if (it.spark) c.appendChild(sparkSvg(it.spark, BK[bk].cls));

      if (bk === 'withhold') {
        var w = el('p', 'lf-why'); var wr = REASON[it.reason] || REASON.thin;
        w.appendChild(el('strong', null, L('Held back: ', 'Retenido: ')));
        w.appendChild(document.createTextNode(L(wr.en, wr.es) + '.'));
        c.appendChild(w);
      } else {
        // horizon stamp + lock≠cheap discipline
        var stamp = el('p', 'lf-stamp', L('Next-week reach — ' + HORIZONS[horizon].stamp_en + '.', 'Alcance de la próxima semana — ' + HORIZONS[horizon].stamp_es + '.'));
        c.appendChild(stamp);
        if (bk === 'lock') c.appendChild(el('p', 'lf-caveat', L('Steady, not necessarily a level you want to marry.', 'Estable, no necesariamente un nivel al que quieras casarte.')));
      }
      return c;
    }

    function board(items, horizon) {
      var box = el('div', 'lf-board');
      [['lock', BK.lock], ['cushion', BK.cushion], ['float', BK.float]].forEach(function (g) {
        var key = g[0], meta = g[1];
        var group = items.filter(function (it) { return reclassify(it, horizon) === key; });
        if (!group.length) return;
        var sec = el('div', 'lf-bucket lf-bucket--' + meta.cls);
        var h = el('div', 'lf-bucket-h');
        h.appendChild(el('h3', null, L(meta.en, meta.es)));
        h.appendChild(el('span', 'lf-bucket-verb', L(meta.verb_en, meta.verb_es)));
        h.appendChild(el('span', 'lf-bucket-cnt', group.length + L(' of ' + items.length, ' de ' + items.length)));
        sec.appendChild(h);
        var cards = el('div', 'lf-cards');
        group.sort(function (a, b) { return (a.halfWidthPct == null ? 9 : a.halfWidthPct) - (b.halfWidthPct == null ? 9 : b.halfWidthPct); });
        group.forEach(function (it) { cards.appendChild(card(it, horizon)); });
        sec.appendChild(cards); box.appendChild(sec);
      });
      return box;
    }

    function refusalWall(items, DATA) {
      var withheld = items.filter(function (it) { return it.bucket === 'withhold'; });
      var sec = el('section', 'lf-refusal');
      var h = el('h2', 'lf-refusal-h', L("What we won't call", 'Lo que no llamamos'));
      sec.appendChild(h);
      var lead = el('p', 'lf-refusal-lead', L(
        'The majority of the catalog — ' + DATA.counts.withhold + ' of ' + DATA.catalog + ' ingredients — we refuse to fence, and we say why. A tool that sells alerts would have shown you something here.',
        'La mayoría del catálogo — ' + DATA.counts.withhold + ' de ' + DATA.catalog + ' ingredientes — nos negamos a acotar, y decimos por qué. Una herramienta que vende alertas te habría mostrado algo aquí.'));
      sec.appendChild(lead);
      var list = el('ul', 'lf-refusal-list');
      // Feature the recognizable staples first (a wild center-of-plate line is the headline).
      withheld.sort(function (a, b) { return (a.level && b.level) ? (b.level - a.level) : 0; });
      withheld.slice(0, 24).forEach(function (it) {
        var li = el('li', 'lf-refusal-item');
        li.appendChild(el('span', 'lf-refusal-name', it.name));
        var wr = REASON[it.reason] || REASON.thin;
        li.appendChild(el('span', 'lf-refusal-reason', L(wr.en, wr.es)));
        list.appendChild(li);
      });
      sec.appendChild(list);
      return sec;
    }

    function ledgerBridge(DATA) {
      // Pillar 6: the free tool and Ledger are the SAME band on different series —
      // public wholesale here, the operator's own invoices there. Honest handoff, no
      // manufactured urgency, no forbidden claim. Framed off the live lockable count.
      var sec = el('section', 'lf-ledger');
      sec.appendChild(el('h2', 'lf-ledger-h', L('Same read, on your own invoices', 'La misma lectura, en tus propias facturas')));
      var p = el('p', 'lf-ledger-p');
      p.appendChild(document.createTextNode(L(
        'This is the market’s band. Whether YOUR vendor actually passed it through — line by line — is the one thing a public read can’t see. Muntin Ledger runs the same band on your own invoice history and flags a price that steps off it. For the ' + DATA.counts.withhold + ' we won’t call, your own record is the only edge there is.',
        'Esta es la banda del mercado. Si TU proveedor de verdad la trasladó — línea por línea — es lo único que una lectura pública no puede ver. Muntin Ledger corre la misma banda sobre tu historial de facturas y marca un precio que se sale de ella. Para los ' + DATA.counts.withhold + ' que no llamamos, tu propio registro es la única ventaja.')));
      sec.appendChild(p);
      var a = el('a', 'lf-ledger-cta', L('See Muntin Ledger →', 'Ver Muntin Ledger →'));
      a.href = 'https://ledger.muntin.digital/';
      sec.appendChild(a);
      return sec;
    }

    function shortName(n) { return n.replace(/\s*\([^)]*\)/, ''); }

    function render(mount, DATA, opts) {
      opts = opts || {};
      var horizon = opts.horizon || 'monthly';
      if (!DATA || !DATA.items) return;
      var track = opts.track || function () {};
      function draw() {
        while (mount.firstChild) mount.removeChild(mount.firstChild);
        var hero = heroStrip(DATA, horizon);
        var promise = el('p', 'lf-promise', L(
          "We don't tell you which way a price is headed — no one honestly can from price history. We tell you how far its next print tends to move, and whether a fixed price survives it.",
          'No te decimos hacia dónde va un precio — nadie puede honestamente con solo el historial. Te decimos cuánto tiende a moverse su próxima lectura, y si un precio fijo lo resiste.'));
        mount.appendChild(hero.strip);
        mount.appendChild(promise);
        mount.appendChild(horizonControl(horizon, function (h) { horizon = h; track('Cost Pulse Horizon Picked'); draw(); }));
        mount.appendChild(ladder(hero.items, horizon));
        mount.appendChild(board(hero.items, horizon));
        mount.appendChild(refusalWall(hero.items, DATA));
        mount.appendChild(ledgerBridge(DATA));
        if (DATA.asOf) mount.appendChild(el('p', 'lf-asof', L('As of ' + DATA.asOf + ' · wholesale reference, delivered price runs higher.', 'Al ' + DATA.asOf + ' · referencia mayorista, el precio entregado es más alto.')));
      }
      draw();
    }

    return { render: render, reclassify: reclassify, HORIZONS: HORIZONS };
  }

  var mod = { create: api };
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (typeof self !== 'undefined') self.MuntinLockFloatUI = mod;
  if (root) root.MuntinLockFloatUI = mod;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
