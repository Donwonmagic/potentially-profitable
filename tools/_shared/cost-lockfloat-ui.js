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

  // Cuisine starter books — a one-click way to seed "Your Lock Book" from the kitchen
  // you run, instead of hunting 101 rows. Slugs are filtered to the live catalog at
  // apply time, so a retired ingredient just drops out. These are seed sets, not
  // recommendations — the operator prunes to what they actually buy.
  var STARTERS = [
    { id: 'taqueria',   en: 'Taquería',      es: 'Taquería',      slugs: ['avocado', 'lime', 'cilantro', 'jalapeno', 'tomato', 'onion', 'poblano-pepper', 'chicken-thigh', 'ground-beef'] },
    { id: 'pizzeria',   en: 'Pizzeria',      es: 'Pizzería',      slugs: ['tomato', 'basil', 'button-mushroom', 'bell-pepper', 'garlic', 'onion', 'eggplant', 'zucchini'] },
    { id: 'steakhouse', en: 'Steakhouse',    es: 'Parrilla',      slugs: ['ribeye', 'striploin', 'short-rib', 'beef-tenderloin', 'russet-potato', 'button-mushroom', 'asparagus', 'butter'] },
    { id: 'seafood',    en: 'Seafood house', es: 'Marisquería',   slugs: ['salmon-fillet', 'shrimp', 'scallops', 'clams', 'whole-halibut', 'tuna-loin', 'lemon', 'whole-crab'] },
    { id: 'cafe',       en: 'Café / brunch', es: 'Café / brunch', slugs: ['eggs', 'butter', 'spinach', 'tomato', 'avocado', 'cheddar-cheese', 'apple', 'blueberry'] },
    { id: 'sushi',      en: 'Sushi bar',     es: 'Sushi',         slugs: ['salmon-fillet', 'tuna-loin', 'shrimp', 'scallops', 'cucumber', 'ginger', 'green-onion', 'octopus'] },
  ];

  // Persistence — the Lock Book lives ONLY in the operator's own browser: the
  // MuntinContext bus (localStorage, device-local, never fetched, never in analytics)
  // under the 'costPulse' key, plus a shareable URL hash (#book=slug,slug). Both are
  // best-effort; if the bus is absent the book still works in-session via the hash.
  var BOOK_KEY = 'costPulse';
  function ctxRead() { try { return (typeof MuntinContext !== 'undefined' && MuntinContext.get) ? (MuntinContext.get(BOOK_KEY) || {}) : {}; } catch (e) { return {}; } }
  function ctxWrite(patch) { try { if (typeof MuntinContext !== 'undefined' && MuntinContext.merge) { var cur = ctxRead(), next = {}, k; for (k in cur) next[k] = cur[k]; for (k in patch) next[k] = patch[k]; var p = {}; p[BOOK_KEY] = next; MuntinContext.merge(p); } } catch (e) {} }
  function hashParts() { try { return ((typeof location !== 'undefined' && location.hash) || '').replace(/^#/, '').split('&').filter(Boolean); } catch (e) { return []; } }
  function hashBook() { var ps = hashParts(); for (var i = 0; i < ps.length; i++) { var kv = ps[i].split('='); if (kv[0] === 'book' && kv[1]) { try { return decodeURIComponent(kv[1]).split(',').filter(Boolean); } catch (e) { return null; } } } return null; }
  function writeHashBook(slugs) {
    try {
      if (typeof location === 'undefined' || typeof history === 'undefined' || !history.replaceState) return;
      var parts = hashParts().filter(function (p) { return p.indexOf('book=') !== 0; });
      if (slugs && slugs.length) parts.push('book=' + encodeURIComponent(slugs.join(',')));
      history.replaceState(null, '', parts.length ? '#' + parts.join('&') : location.pathname + location.search);
    } catch (e) {}
  }

  function api(es) {
    function L(en, esT) { return es ? esT : en; }
    function money(c, u) { if (!(c > 0)) return null; var d = c / 100; var s = d >= 100 ? '$' + Math.round(d).toLocaleString() : '$' + d.toFixed(2); return u ? s : s; }
    function pctTxt(p) { return (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(Math.round(p * 100)) + '%'; }

    // Lock Book state, set by render() (it needs DATA). Held at api scope so the card
    // and refusal-wall renderers can drop a star without threading it through every call.
    var STATE = null;   // { book:Set, changed:{slug:{from,to}}, seenAsOf, toggle, applyStarter, clear }

    function starBtn(slug) {
      var on = STATE && STATE.book.has(slug);
      var b = el('button', 'lf-star' + (on ? ' is-on' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? L('In your Lock Book — tap to remove', 'En tu Libro — toca para quitar') : L('Add to your Lock Book', 'Añadir a tu Libro'));
      b.setAttribute('title', on ? L('In your Lock Book', 'En tu Libro') : L('Add to your Lock Book', 'Añadir a tu Libro'));
      b.appendChild(el('span', 'lf-star-ic', on ? '★' : '☆'));
      b.addEventListener('click', function (ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); if (STATE) STATE.toggle(slug); });
      return b;
    }

    function starterRow() {
      var wrap = el('div', 'lf-starters');
      wrap.appendChild(el('span', 'lf-starters-lab', L('Start from your kitchen:', 'Empieza desde tu cocina:')));
      var btns = el('div', 'lf-starter-btns'); btns.setAttribute('role', 'group');
      STARTERS.forEach(function (s) {
        var avail = s.slugs.filter(function (sl) { return STATE && STATE.has(sl); });
        if (!avail.length) return;
        var b = el('button', 'lf-starter', L(s.en, s.es)); b.type = 'button';
        b.setAttribute('aria-label', L('Add the ' + s.en + ' starter set', 'Añadir el set ' + s.es));
        b.addEventListener('click', function () { if (STATE) STATE.applyStarter(avail); });
        btns.appendChild(b);
      });
      wrap.appendChild(btns);
      return wrap;
    }

    function uncertaintyLine(mine) {
      // "Uncertainty you're carrying" — a ranked MAGNITUDE read across the operator's
      // own items: widest vs steadiest next-week reach. Never a direction, never a $
      // figure, never an overpayment read — just how much the prices you track wobble.
      var fenced = mine.filter(function (it) { return it.bucket !== 'withhold' && it.halfWidthPct != null; });
      var held = mine.length - fenced.length;
      var p = el('p', 'lf-book-uncert');
      if (!fenced.length) {
        p.appendChild(document.createTextNode(L(
          'None of your ' + mine.length + ' tracked items carry a band we’ll publish yet — ' + held + ' are held back.',
          'Ninguno de tus ' + mine.length + ' artículos tiene una banda publicable aún — ' + held + ' están retenidos.')));
        return p;
      }
      var sorted = fenced.slice().sort(function (a, b) { return b.halfWidthPct - a.halfWidthPct; });
      var widest = sorted[0], steadiest = sorted[sorted.length - 1];
      p.appendChild(el('strong', null, L('Uncertainty you’re carrying: ', 'Incertidumbre que llevas: ')));
      p.appendChild(document.createTextNode(L(
        'the widest next-week reach in your book is ' + shortName(widest.name) + ' at ±' + Math.round(widest.halfWidthPct * 100) + '%, the steadiest ' + shortName(steadiest.name) + ' at ±' + Math.round(steadiest.halfWidthPct * 100) + '%' + (held ? '; ' + held + ' more we won’t fence.' : '.'),
        'el mayor alcance de la próxima semana en tu libro es ' + shortName(widest.name) + ' con ±' + Math.round(widest.halfWidthPct * 100) + '%, el más estable ' + shortName(steadiest.name) + ' con ±' + Math.round(steadiest.halfWidthPct * 100) + '%' + (held ? '; ' + held + ' más que no acotamos.' : '.'))));
      return p;
    }

    function bookRow(it, horizon) {
      var bk = reclassify(it, horizon);
      var changed = STATE && STATE.changed[it.slug];
      var row = el('div', 'lf-brow' + (changed ? ' is-changed' : ''));
      row.appendChild(starBtn(it.slug));
      row.appendChild(el('span', 'lf-bname', shortName(it.name)));
      row.appendChild(el('span', 'lf-pill lf-pill--' + BK[bk].cls, bk === 'withhold' ? L('held back', 'retenido') : L(BK[bk].en, BK[bk].es)));
      var reach = el('span', 'lf-breach');
      if (bk !== 'withhold' && it.halfWidthPct != null) { reach.textContent = '±' + Math.round(it.halfWidthPct * 100) + '%'; reach.setAttribute('title', L('worst-side next-week reach', 'alcance de la próxima semana, lado más amplio')); }
      else reach.textContent = L('can’t fence', 'sin acotar');
      row.appendChild(reach);
      return row;
    }

    function lockBook(items, horizon) {
      var mine = items.filter(function (it) { return STATE && STATE.book.has(it.slug); });
      var sec = el('section', 'lf-book');
      var head = el('div', 'lf-book-h');
      head.appendChild(el('h2', 'lf-book-title', L('Your Lock Book', 'Tu Libro de Fijación')));
      if (mine.length) {
        var badge = el('span', 'lf-book-count', mine.length + L(' tracked', ' seguidos'));
        head.appendChild(badge);
        var clr = el('button', 'lf-book-clear', L('Clear', 'Vaciar')); clr.type = 'button';
        clr.setAttribute('aria-label', L('Clear your Lock Book', 'Vaciar tu Libro'));
        clr.addEventListener('click', function () { if (STATE) STATE.clear(); });
        head.appendChild(clr);
      }
      sec.appendChild(head);
      if (!mine.length) {
        sec.appendChild(el('p', 'lf-book-empty', L(
          'Star the ingredients you actually buy — they gather here with their read, and we flag any that crossed a line since your last visit. It stays in your browser; a shareable link travels with it.',
          'Marca los ingredientes que de verdad compras — se juntan aquí con su lectura, y señalamos los que cruzaron una línea desde tu última visita. Se queda en tu navegador; un enlace para compartir lo acompaña.')));
        sec.appendChild(starterRow());
        return sec;
      }
      // Change-led lead: what crossed a Lock/Cushion/Float line since the operator's
      // own last visit (the underlying weekly data moved it — not the horizon control).
      var changes = mine.filter(function (it) { return STATE.changed[it.slug]; });
      if (STATE.seenAsOf && changes.length) {
        var lead = el('div', 'lf-book-changes');
        lead.appendChild(el('p', 'lf-book-changes-h', L(
          changes.length + (changes.length === 1 ? ' item crossed a line' : ' items crossed a line') + ' since you last looked (' + STATE.seenAsOf + '):',
          changes.length + (changes.length === 1 ? ' artículo cruzó una línea' : ' artículos cruzaron una línea') + ' desde tu última visita (' + STATE.seenAsOf + '):')));
        var ul = el('ul', 'lf-book-changelist');
        changes.forEach(function (it) {
          var ch = STATE.changed[it.slug];
          var li = el('li', 'lf-book-change');
          li.appendChild(el('span', 'lf-book-cn', shortName(it.name)));
          li.appendChild(el('span', 'lf-chip lf-chip--' + BK[ch.from].cls, L(BK[ch.from].en, BK[ch.from].es)));
          li.appendChild(el('span', 'lf-book-arrow', '→'));
          li.appendChild(el('span', 'lf-chip lf-chip--' + BK[ch.to].cls, L(BK[ch.to].en, BK[ch.to].es)));
          ul.appendChild(li);
        });
        lead.appendChild(ul);
        sec.appendChild(lead);
      } else if (STATE.seenAsOf) {
        sec.appendChild(el('p', 'lf-book-nochange', L(
          'Nothing in your book crossed a line since you last looked (' + STATE.seenAsOf + ').',
          'Nada en tu libro cruzó una línea desde tu última visita (' + STATE.seenAsOf + ').')));
      }
      sec.appendChild(uncertaintyLine(mine));
      var list = el('div', 'lf-book-rows');
      var order = { lock: 0, cushion: 1, float: 2, withhold: 3 };
      mine.slice().sort(function (a, b) {
        var ca = STATE.changed[a.slug] ? 0 : 1, cb = STATE.changed[b.slug] ? 0 : 1;
        if (ca !== cb) return ca - cb;
        var ba = reclassify(a, horizon), bb = reclassify(b, horizon);
        return (order[ba] - order[bb]) || ((a.halfWidthPct == null ? 9 : a.halfWidthPct) - (b.halfWidthPct == null ? 9 : b.halfWidthPct));
      }).forEach(function (it) { list.appendChild(bookRow(it, horizon)); });
      sec.appendChild(list);
      sec.appendChild(starterRow());
      return sec;
    }
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

    // Backtest Replay — the signature proof figure. Renders the RAW walk-forward
    // hit/miss strip (it.replay, a '1'/'0' string oldest→newest from cost-conformal's
    // hitSeq) so the reader SEES the band scoring itself, not just a stated rate. Two
    // paths keep it cheap (not one rect per week); a catch sits low in the steady hue,
    // a miss runs full-height in the volatile hue — so it reads without color alone,
    // and the figcaption decodes it. Fully static: no motion to gate on reduced-motion.
    function replayStrip(it) {
      var seq = it.replay || '';
      var n = seq.length; if (!n) return null;
      var W = 240, H = 22, pad = 1;
      var fig = el('figure', 'lf-replay');
      var svg = svgEl('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, class: 'lf-replay-svg', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
      svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 3, fill: 'var(--lf-surface-2)' }));
      var hitD = '', missD = '', hits = 0, i;
      for (i = 0; i < n; i++) {
        var x = (pad + (n === 1 ? 0 : (i / (n - 1)) * (W - 2 * pad))).toFixed(2);
        if (seq.charAt(i) === '1') { hits++; hitD += 'M' + x + ' 12L' + x + ' 20'; }
        else { missD += 'M' + x + ' 2L' + x + ' 20'; }
      }
      if (hitD) svg.appendChild(svgEl('path', { d: hitD, stroke: 'var(--lf-lock)', 'stroke-width': '1', 'stroke-opacity': '.5', 'vector-effect': 'non-scaling-stroke' }));
      if (missD) svg.appendChild(svgEl('path', { d: missD, stroke: 'var(--lf-float)', 'stroke-width': '1.3', 'vector-effect': 'non-scaling-stroke' }));
      fig.appendChild(svg);
      var miss = n - hits;
      fig.appendChild(el('figcaption', 'lf-replay-cap', L(
        'Backtest replay — each mark is one ' + (it.monthly ? 'month' : 'week') + ' the band was scored on real history: ' + hits + ' caught the next print, ' + miss + ' slipped past. The ' + Math.round(it.coverage * 100) + '% is that count, replayed — not a forecast.',
        'Repetición del backtest — cada marca es un ' + (it.monthly ? 'mes' : 'semana') + ' en que se evaluó la banda sobre historial real: ' + hits + ' capturaron la próxima lectura, ' + miss + ' se escaparon. El ' + Math.round(it.coverage * 100) + '% es ese conteo, repetido — no un pronóstico.')));
      return fig;
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
      var right = el('div', 'lf-card-tr');
      right.appendChild(pill);
      if (STATE && it.slug) right.appendChild(starBtn(it.slug));
      top.appendChild(left); top.appendChild(right); c.appendChild(top);

      if (it.upPct != null && it.downPct != null && !(it.upPct === 0 && it.downPct === 0)) {
        var bandWrap = el('div', 'lf-card-band');
        var row = el('div', 'lf-cb-row');
        row.appendChild(el('span', null, pctTxt(-it.downPct)));
        row.appendChild(el('span', 'lf-cb-now', L('today', 'hoy')));
        row.appendChild(el('span', null, pctTxt(it.upPct)));
        bandWrap.appendChild(row);
        bandWrap.appendChild(bandSvg(it, bk === 'withhold' ? 'hold' : BK[bk].cls));
        c.appendChild(bandWrap);
        if (bk !== 'withhold' && it.coverage != null) {
          c.appendChild(receiptLine(it));
          if (it.replay) { var rp = replayStrip(it); if (rp) c.appendChild(rp); }
        }
      }
      if (it.spark) c.appendChild(sparkSvg(it.spark, BK[bk].cls));

      if (bk === 'withhold') {
        var w = el('p', 'lf-why'); var wr = REASON[it.reason] || REASON.thin;
        w.appendChild(el('strong', null, L('Held back: ', 'Retenido: ')));
        w.appendChild(document.createTextNode(L(wr.en, wr.es) + '.'));
        c.appendChild(w);
      } else {
        // Menu cushion — a decision job, on the buckets where holding a fixed menu
        // price is realistic (lock/cushion). Reframes the certified UP-side reach as
        // margin headroom: size for the +up% top and the backtested band held it. It
        // is a MAGNITUDE read (how much to absorb), never a forecast that prices rise,
        // and the two-sided coverage attributed to the one edge is deliberately
        // conservative. Float gets NO cushion line — its absence is the honest message.
        if ((bk === 'lock' || bk === 'cushion') && it.upPct != null && it.upPct > 0 && it.coverage != null) {
          c.appendChild(menuCushion(it));
        }
        // horizon stamp + lock≠cheap discipline
        var stamp = el('p', 'lf-stamp', L('Next-week reach — ' + HORIZONS[horizon].stamp_en + '.', 'Alcance de la próxima semana — ' + HORIZONS[horizon].stamp_es + '.'));
        c.appendChild(stamp);
        if (bk === 'lock') c.appendChild(el('p', 'lf-caveat', L('Steady, not necessarily a level you want to marry.', 'Estable, no necesariamente un nivel al que quieras casarte.')));
      }
      return c;
    }

    function menuCushion(it) {
      var up = Math.round(it.upPct * 100), cov = Math.round(it.coverage * 100);
      var p = el('p', 'lf-cushion');
      p.appendChild(el('strong', null, L('Menu cushion: ', 'Margen de menú: ')));
      p.appendChild(document.createTextNode(L(
        'setting a price to hold? Build ' + up + '% of headroom into your margin — the top of the band we backtested at ' + cov + '%. It sizes next-week reach, so a price you hold for months wants more.',
        '¿fijas un precio para sostener? Construye ' + up + '% de holgura en tu margen — el tope de la banda con backtest de ' + cov + '%. Dimensiona el alcance de la próxima semana, así que un precio que sostienes meses pide más.')));
      return p;
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
        sec.appendChild(cards);
        sec.appendChild(bucketCta(key));
        box.appendChild(sec);
      });
      return box;
    }

    // Per-bucket honest next-step. Each bucket's action is concrete and true to what
    // the read supports — commit vs. build headroom vs. don't commit — and hands off
    // to Ledger as "check it against YOUR invoices", never as manufactured urgency and
    // never as a buy/sell/direction call.
    var BUCKET_CTA = {
      lock:    { en: 'Worth committing: a standing order, a fixed contract, or a menu price you set and leave. Then watch, in Muntin Ledger, whether your own invoices actually hold this steady.', es: 'Vale comprometerse: un pedido fijo, un contrato o un precio de menú que fijas y dejas. Luego observa, en Muntin Ledger, si tus propias facturas de verdad lo mantienen estable.' },
      cushion: { en: 'Commit if you build the headroom in — a fixed price works here only with margin to absorb the swing. Muntin Ledger tracks whether your delivered price stays inside it.', es: 'Comprométete solo si dejas la holgura — un precio fijo aquí funciona con margen para absorber el vaivén. Muntin Ledger vigila si tu precio entregado se mantiene dentro.' },
      float:   { en: 'Keep this one on flexible terms — the swing is too wide to fence a fixed price around, and that is the finding, not a call on where it goes. Ledger flags when your invoice leaves the band.', es: 'Déjalo en términos flexibles — el vaivén es muy amplio para acotar un precio fijo, y ese es el hallazgo, no un pronóstico. Ledger avisa cuando tu factura sale de la banda.' },
    };
    function bucketCta(key) {
      var c = BUCKET_CTA[key];
      var p = el('p', 'lf-bucket-cta lf-bucket-cta--' + BK[key].cls);
      p.appendChild(document.createTextNode(L(c.en, c.es)));
      return p;
    }

    function termWord(t) { return t === 'weekly' ? L('a week', 'una semana') : t === 'monthly' ? L('a month', 'un mes') : L('a season', 'una temporada'); }

    // Before-you-sign contract checker — a decision job for the moment an operator is
    // about to COMMIT (standing order / fixed contract). It never calls direction; it
    // answers "is a fixed price a fair bet at this length, and what does it cost you
    // either way?" — with the two caveats a weekly band owes a term commitment: it
    // can't see term-length drift, and a fixed price locks you out of down-moves too.
    // Withheld ingredients are refused as blind commitments. cstate persists the
    // selection across full redraws (star/horizon), so it isn't reset out from under.
    function contractChecker(items, DATA, cstate) {
      var sec = el('section', 'lf-contract');
      sec.appendChild(el('h2', 'lf-contract-h', L('Before you sign a fixed price', 'Antes de fijar un precio')));
      sec.appendChild(el('p', 'lf-contract-lead', L(
        'About to commit a standing order or a fixed contract? Pick the ingredient and how long you would lock it. We won’t tell you which way it goes — we’ll tell you whether a fixed price is a fair bet at that length, and what it costs you either way.',
        '¿A punto de comprometer un pedido fijo o un contrato? Elige el ingrediente y cuánto lo fijarías. No te diremos hacia dónde va — te diremos si un precio fijo es una apuesta razonable a ese plazo, y qué te cuesta en cualquier caso.')));
      var body = el('div', 'lf-contract-body');
      sec.appendChild(body);
      var sorted = items.slice().sort(function (a, b) { var an = shortName(a.name), bn = shortName(b.name); return an < bn ? -1 : an > bn ? 1 : 0; });

      function redraw() {
        while (body.firstChild) body.removeChild(body.firstChild);
        var ctrls = el('div', 'lf-contract-ctrls');
        var select = el('select', 'lf-contract-sel'); select.setAttribute('aria-label', L('Ingredient to check', 'Ingrediente a revisar'));
        var ph = el('option', null, L('Choose an ingredient…', 'Elige un ingrediente…')); ph.value = ''; select.appendChild(ph);
        sorted.forEach(function (it) { var o = el('option', null, shortName(it.name)); o.value = it.slug; select.appendChild(o); });
        select.value = cstate.sel || '';
        select.addEventListener('change', function () { cstate.sel = select.value; redraw(); });
        ctrls.appendChild(select);
        var terms = el('div', 'lf-contract-terms'); terms.setAttribute('role', 'group'); terms.setAttribute('aria-label', L('Commitment length', 'Duración del compromiso'));
        [['weekly', L('For a week', 'Por una semana')], ['monthly', L('For a month', 'Por un mes')], ['seasonal', L('For a season', 'Por una temporada')]].forEach(function (t) {
          var b = el('button', 'lf-cterm' + (t[0] === cstate.term ? ' is-on' : ''), t[1]); b.type = 'button'; b.setAttribute('aria-pressed', t[0] === cstate.term ? 'true' : 'false');
          b.addEventListener('click', function () { cstate.term = t[0]; redraw(); });
          terms.appendChild(b);
        });
        ctrls.appendChild(terms);
        body.appendChild(ctrls);
        if (cstate.sel && DATA.items[cstate.sel]) body.appendChild(verdictBlock(Object.assign({ slug: cstate.sel }, DATA.items[cstate.sel]), cstate.term));
      }
      redraw();
      return sec;
    }

    function verdictBlock(it, term) {
      var wrap = el('div', 'lf-verdict');
      if (it.bucket === 'withhold' || it.upPct == null || it.downPct == null || it.coverage == null) {
        var wr = REASON[it.reason] || REASON.thin;
        wrap.className = 'lf-verdict lf-verdict--hold';
        wrap.appendChild(el('p', 'lf-verdict-head', L('We can’t fence ' + shortName(it.name) + '.', 'No podemos acotar ' + shortName(it.name) + '.')));
        wrap.appendChild(el('p', 'lf-verdict-body', L(
          'Reason: ' + (it.bucket === 'withhold' ? wr.en : 'no publishable band') + '. A fixed price here is a blind commitment — with no band, nothing can say a locked number is fair. Keep it flexible, or bring your own invoice history to Muntin Ledger, where your record is the only read there is.',
          'Motivo: ' + (it.bucket === 'withhold' ? wr.es : 'sin banda publicable') + '. Un precio fijo aquí es un compromiso a ciegas — sin banda, nada puede decir si un número fijo es justo. Déjalo flexible, o lleva tu historial de facturas a Muntin Ledger, donde tu registro es la única lectura que hay.')));
        return wrap;
      }
      var bk = reclassify(it, term);
      var fair = (bk === 'lock' || bk === 'cushion');
      var up = Math.round(it.upPct * 100), down = Math.round(it.downPct * 100), cov = Math.round(it.coverage * 100);
      wrap.className = 'lf-verdict lf-verdict--' + (fair ? BK[bk].cls : 'float');
      wrap.appendChild(el('p', 'lf-verdict-head', fair
        ? L('A fixed price for ' + shortName(it.name) + ' is a fair bet for ' + termWord(term) + '.', 'Un precio fijo de ' + shortName(it.name) + ' es una apuesta razonable por ' + termWord(term) + '.')
        : L('Think twice before fixing ' + shortName(it.name) + ' for ' + termWord(term) + '.', 'Piénsalo antes de fijar ' + shortName(it.name) + ' por ' + termWord(term) + '.')));
      wrap.appendChild(el('p', 'lf-verdict-band', L(
        'Its next-week band reaches +' + up + '% / −' + down + '%, and that band caught the next print ' + cov + '% of the time.',
        'Su banda semanal alcanza +' + up + '% / −' + down + '%, y esa banda capturó la próxima lectura el ' + cov + '% de las veces.')));
      wrap.appendChild(el('p', 'lf-verdict-caveat', L(
        'That band measures ONE week. Over ' + termWord(term) + ' a price can drift past it — a weekly read can’t see ' + termWord(term) + ' of drift, so treat it as a floor on the risk, not a ceiling.',
        'Esa banda mide UNA semana. En ' + termWord(term) + ' un precio puede desviarse más allá — una lectura semanal no ve ' + termWord(term) + ' de deriva, así que tómalo como un piso del riesgo, no un techo.')));
      wrap.appendChild(el('p', 'lf-verdict-caveat', L(
        'A fixed price also locks you OUT of any down-move — you’re buying certainty, not the lowest number. And this is the wholesale reference; your delivered price runs higher and moves on its own.',
        'Un precio fijo también te deja FUERA de cualquier baja — compras certeza, no el número más bajo. Y esta es la referencia mayorista; tu precio entregado es más alto y se mueve por su cuenta.')));
      return wrap;
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
        if (STATE && it.slug) li.appendChild(starBtn(it.slug));
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
      sec.appendChild(bandProofFigure());
      var a = el('a', 'lf-ledger-cta', L('See Muntin Ledger →', 'Ver Muntin Ledger →'));
      a.href = 'https://ledger.muntin.digital/';
      sec.appendChild(a);
      return sec;
    }

    // Two-panel proof: the SAME band, two series. Left = the market (this public
    // read); right = your own invoices (in Ledger), with the one print that leaves
    // the band flagged. Deliberately SCHEMATIC — fixed illustrative shapes, no $ and
    // no ingredient, so it makes no factual claim (it's a diagram of the handoff, not
    // data). Honest framing: "the print that leaves the band is the one worth a
    // question" — never "your vendor overcharged / is above market".
    function bandPanel(pts, flagIdx, hue) {
      var W = 150, H = 66, bandTop = 20, bandBot = 46;
      var svg = svgEl('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, class: 'lf-proof-svg', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
      svg.appendChild(svgEl('rect', { x: 0, y: bandTop, width: W, height: bandBot - bandTop, rx: 4, fill: 'var(--lf-lock)', 'fill-opacity': '.14' }));
      svg.appendChild(svgEl('line', { x1: 0, y1: (bandTop + bandBot) / 2, x2: W, y2: (bandTop + bandBot) / 2, stroke: 'var(--lf-ink)', 'stroke-opacity': '.22', 'stroke-dasharray': '3 3' }));
      var d = 'M', i, xs = [];
      for (i = 0; i < pts.length; i++) { var x = 8 + (i / (pts.length - 1)) * (W - 16); xs.push(x); d += (i ? ' L ' : '') + x.toFixed(1) + ' ' + pts[i]; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--lf-' + hue + ')', 'stroke-width': '1.8', 'vector-effect': 'non-scaling-stroke' }));
      if (flagIdx != null) svg.appendChild(svgEl('circle', { cx: xs[flagIdx].toFixed(1), cy: pts[flagIdx], r: 3.4, fill: 'var(--lf-float)', stroke: 'var(--lf-surface-2)', 'stroke-width': '1' }));
      return svg;
    }
    function bandProofFigure() {
      var fig = el('figure', 'lf-proof');
      var panels = el('div', 'lf-proof-panels');
      [[L('The market — here', 'El mercado — aquí'), [34, 40, 30, 42, 33, 39, 31], null, 'lock'],
       [L('Your invoices — in Ledger', 'Tus facturas — en Ledger'), [38, 34, 40, 36, 8, 35, 33], 4, 'cushion']].forEach(function (panel) {
        var col = el('div', 'lf-proof-col');
        col.appendChild(el('div', 'lf-proof-lab', panel[0]));
        col.appendChild(bandPanel(panel[1], panel[2], panel[3]));
        panels.appendChild(col);
      });
      fig.appendChild(panels);
      fig.appendChild(el('figcaption', 'lf-proof-cap', L(
        'Illustration: the same band, two series. The public read is the market’s move; your own line is the only thing that shows whether your delivered price held to it — and the one print that leaves the band is the one worth a question.',
        'Ilustración: la misma banda, dos series. La lectura pública es el movimiento del mercado; tu propia línea es lo único que muestra si tu precio entregado se mantuvo en ella — y la lectura que sale de la banda es la que merece una pregunta.')));
      return fig;
    }

    function shortName(n) { return n.replace(/\s*\([^)]*\)/, ''); }

    function render(mount, DATA, opts) {
      opts = opts || {};
      var horizon = opts.horizon || 'monthly';
      if (!DATA || !DATA.items) return;
      var track = opts.track || function () {};

      // --- Lock Book state (device-local; no fetch) ---
      // Native (data-driven, horizon-independent) bucket per slug — the baseline the
      // "crossed a line" change detector compares against, so a change reflects new
      // vendor data, never the operator toggling the horizon control.
      var nativeBucket = {};
      Object.keys(DATA.items).forEach(function (k) { nativeBucket[k] = DATA.items[k].bucket; });
      var persisted = ctxRead();
      var fromHash = hashBook();
      var seed = (fromHash && fromHash.length) ? fromHash : (Array.isArray(persisted.starred) ? persisted.starred : []);
      var bookSet = new Set(seed.filter(function (s) { return DATA.items[s]; }));
      // Change detection vs the operator's OWN last snapshot — computed once per load.
      var changed = {};
      var prevSeen = persisted.lastSeen && persisted.lastSeen.buckets;
      var seenAsOf = (persisted.lastSeen && persisted.lastSeen.asOf) || null;
      if (prevSeen) Object.keys(nativeBucket).forEach(function (s) { if (prevSeen[s] && prevSeen[s] !== nativeBucket[s]) changed[s] = { from: prevSeen[s], to: nativeBucket[s] }; });

      function persistBook() { var arr = Array.from(bookSet); ctxWrite({ starred: arr }); writeHashBook(arr); }
      STATE = {
        book: bookSet,
        changed: changed,
        seenAsOf: seenAsOf,
        has: function (slug) { return !!DATA.items[slug]; },
        toggle: function (slug) { if (bookSet.has(slug)) bookSet.delete(slug); else { bookSet.add(slug); track('Cost Pulse Item Starred'); } persistBook(); draw(); },
        applyStarter: function (slugs) { slugs.forEach(function (s) { if (DATA.items[s]) bookSet.add(s); }); track('Cost Pulse Starter Book Applied'); persistBook(); draw(); },
        clear: function () { bookSet.clear(); persistBook(); track('Cost Pulse Book Cleared'); draw(); },
      };
      // A shared link's book is adopted as the operator's own on first load.
      if (fromHash && fromHash.length) persistBook();

      // Contract-checker selection persists across full redraws (star/horizon).
      var cstate = { sel: '', term: 'monthly' };

      function draw() {
        while (mount.firstChild) mount.removeChild(mount.firstChild);
        var hero = heroStrip(DATA, horizon);
        var promise = el('p', 'lf-promise', L(
          "We don't tell you which way a price is headed — no one honestly can from price history. We tell you how far its next print tends to move, and whether a fixed price survives it.",
          'No te decimos hacia dónde va un precio — nadie puede honestamente con solo el historial. Te decimos cuánto tiende a moverse su próxima lectura, y si un precio fijo lo resiste.'));
        mount.appendChild(hero.strip);
        mount.appendChild(promise);
        mount.appendChild(lockBook(hero.items, horizon));
        mount.appendChild(horizonControl(horizon, function (h) { horizon = h; track('Cost Pulse Horizon Picked'); draw(); }));
        mount.appendChild(ladder(hero.items, horizon));
        mount.appendChild(board(hero.items, horizon));
        mount.appendChild(contractChecker(hero.items, DATA, cstate));
        mount.appendChild(refusalWall(hero.items, DATA));
        mount.appendChild(ledgerBridge(DATA));
        if (DATA.asOf) mount.appendChild(el('p', 'lf-asof', L('As of ' + DATA.asOf + ' · wholesale reference, delivered price runs higher.', 'Al ' + DATA.asOf + ' · referencia mayorista, el precio entregado es más alto.')));
      }
      draw();
      // Record this visit's snapshot as the new baseline — ONCE, after the change-led
      // view has already been drawn against the prior one.
      ctxWrite({ lastSeen: { asOf: DATA.asOf || null, buckets: nativeBucket } });
    }

    return { render: render, reclassify: reclassify, HORIZONS: HORIZONS };
  }

  var mod = { create: api };
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (typeof self !== 'undefined') self.MuntinLockFloatUI = mod;
  if (root) root.MuntinLockFloatUI = mod;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
