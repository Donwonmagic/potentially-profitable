/**
 * recall-roster.mjs — the per-ingredient "Food-safety recall history" section generator (Phase 2 of
 * spec-corpus-explorers.md §4). Given a tracked-ingredient slug and the CC-BY by-ingredient recall
 * index, it renders a static section for the cost-index/<slug>/ page (EN + ES), physically SEPARATE
 * from any price figure.
 *
 * HONESTY (ADR-011): a dated, documented FDA recall shown as CO-OCCURRENCE — never a cause, never a
 * magnitude, never joined to a price. The honest headline is DISTINCT EVENTS (event_id), not the raw
 * notice count. The slug tag is a whole-word product-text match, not a supply or price link. No
 * `cause`/`reason`/`why` field is rendered (the index drops `reason`). FDA jurisdiction only — the lane
 * is not complete. Ingredients with no recall in the openFDA window get a graceful, honest absence note.
 *
 * The section carries the co-occurrence marker verbatim ("co-occurrence in time, never a cause" /
 * "coincidencia en el tiempo, nunca una causa") — the same marker the events surface uses.
 */

export const ROSTER_SENTINEL = { start: '<!-- ingredient-recalls:start -->', end: '<!-- /ingredient-recalls:end -->' };
export const ROSTER_CSS_SENTINEL = { start: '/* ingredient-recalls-css:start */', end: '/* ingredient-recalls-css:end */' };

const MARK_EN = 'co-occurrence in time, never a cause';
const MARK_ES = 'coincidencia en el tiempo, nunca una causa';

export function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

const T = {
  h: (es) => (es ? 'Historial de retiros de seguridad alimentaria' : 'Food-safety recall history'),
  none: (es) => (es
    ? 'Sin retiro en el registro de openFDA (desde 2020). Solo alimentos regulados por la FDA — los retiros de carne, aves y huevo (USDA/FSIS) no aparecen aquí, así que la ausencia no es una garantía.'
    : 'No recall in the openFDA window (since 2020). FDA-regulated foods only — USDA/FSIS meat, poultry and egg recalls are absent here, so an empty record is not an all-clear.'),
  lede: (es, ev, ci) => (es
    ? `${ev} evento${ev === 1 ? '' : 's'} de retiro documentado${ev === 1 ? '' : 's'} nombran este ingrediente en el texto del producto${ci ? `, ${ci} de Clase I` : ''} — mostrados como co-ocurrencia, nunca una causa, nunca unidos a un precio.`
    : `${ev} documented recall event${ev === 1 ? '' : 's'} name this ingredient in the product text${ci ? `, ${ci} Class I` : ''} — shown as co-occurrence, never a cause, never joined to a price.`),
  when: (es) => (es ? 'Documentado alrededor de esta fecha' : 'Documented around this time'),
  marker: (es) => (es ? MARK_ES : MARK_EN),
  caveat: (es) => (es
    ? 'La etiqueta es una coincidencia de texto completo en el producto, no un vínculo de suministro ni de precio; puede incluir productos compuestos que solo mencionan el ingrediente. Los eventos son recuentos distintos, no avisos. Solo alimentos regulados por la FDA.'
    : 'The tag is a whole-word text match on the product, not a supply or price link; it can include composite products that merely name the ingredient. Events are distinct counts, not notices. FDA-regulated foods only.'),
  evLabel: (es) => (es ? 'eventos' : 'events'),
  nLabel: (es) => (es ? 'avisos' : 'notices'),
  latest: (es) => (es ? 'último' : 'latest'),
};

// One documented recall notice as a co-occurrence context block. Renders date · class · status · firm ·
// states · product verbatim — NO reason/cause field. Reuses the events surface's context styling name.
function ctxBlock(r, es) {
  const meta = [r.date, r.classification, r.status, r.firm, r.states].filter(Boolean).map(esc).join(' · ');
  return `<li class="ci-events__ctx ci-recalls__ctx"><p class="ci-recalls__when"><strong>${T.when(es)}</strong> — ${T.marker(es)}.</p><p class="ci-recalls__meta"><span class="mono">${meta}</span></p><p class="ci-recalls__prod">${esc(r.product)}</p></li>`;
}

/**
 * Render the section body (without sentinels). `entry` is the by-ingredient index row for this slug,
 * or null/undefined when the ingredient has no recall in the window (graceful absence).
 */
export function rosterSection(slug, entry, es = false) {
  const id = `ci-recalls-h-${slug}`;
  if (!entry || !entry.events) {
    return `<section class="ci-profile ci-recalls ci-recalls--none" aria-labelledby="${id}">
    <h2 id="${id}">${T.h(es)}</h2>
    <p class="ci-recalls__none">${T.none(es)}</p>
  </section>`;
  }
  const ci = entry.class_i_events || 0;
  const recent = (entry.recent || []).slice(0, 5);
  const stat = es
    ? `${entry.events} ${T.evLabel(es)} · ${entry.n} ${T.nLabel(es)} · ${T.latest(es)} ${esc(entry.latest || '—')}`
    : `${entry.events} ${T.evLabel(es)} · ${entry.n} ${T.nLabel(es)} · ${T.latest(es)} ${esc(entry.latest || '—')}`;
  return `<section class="ci-profile ci-recalls" aria-labelledby="${id}">
    <h2 id="${id}">${T.h(es)}</h2>
    <p class="ci-recalls__lede">${T.lede(es, entry.events, ci)}</p>
    <p class="ci-recalls__stat mono">${stat}</p>
    <ul class="ci-recalls__list">${recent.map((r) => ctxBlock(r, es)).join('')}</ul>
    <p class="ci-recalls__caveat">${T.caveat(es)}</p>
  </section>`;
}

// The head <style> block (kept minimal; inherits the page's ci-* tokens). Physically separated look.
export function rosterCss() {
  return `${ROSTER_CSS_SENTINEL.start}
.ci-recalls__lede{color:var(--ink-soft,#4a525a);margin:.2em 0 .3em;max-width:66ch}
.ci-recalls__stat{font-size:13px;color:var(--muted,#676b66);margin:.1em 0 .8em}
.ci-recalls__list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ci-recalls__ctx{border:1px solid var(--line,#e5ddce);border-left:3px solid var(--gold,#8a6216);border-radius:10px;background:var(--surface,#fffdf9);padding:9px 12px}
.ci-recalls__ctx p{margin:2px 0}
.ci-recalls__when{font-size:12px;color:var(--gold,#8a6216);font-weight:600}
.ci-recalls__meta{font-size:12.5px;color:var(--ink-soft,#4a525a)}
.ci-recalls__prod{font-size:13.5px;color:var(--ink,#1b1f24)}
.ci-recalls__caveat,.ci-recalls__none{font-size:12px;color:var(--muted,#676b66);font-style:italic;margin-top:.6em}
${ROSTER_CSS_SENTINEL.end}`;
}

export function wrap(html) { return `${ROSTER_SENTINEL.start}${html}${ROSTER_SENTINEL.end}`; }

// Shared injection — the SINGLE code path used by both inject-ingredient-recalls.mjs (writing the
// committed pages) and build-cost-index-pages.mjs (the engine mirror), so the injected page and a
// from-scratch regenerate are byte-identical. Idempotent: strips any prior injection as a unit first.
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function stripUnit(s, start, end) {
  return s.replace(new RegExp('[ \\t]*' + reEsc(start) + '[\\s\\S]*?' + reEsc(end) + '\\n?', 'g'), '');
}
export function injectRecall(html, slug, index, es = false) {
  const block = wrap(rosterSection(slug, (index && index[slug]) || null, es));
  const css = rosterCss();
  // 1) idempotent removal of any prior injection (body + head CSS), each stripped as a unit
  html = stripUnit(html, ROSTER_SENTINEL.start, ROSTER_SENTINEL.end);
  html = stripUnit(html, ROSTER_CSS_SENTINEL.start, ROSTER_CSS_SENTINEL.end);
  // 2a) CSS into the first <style>, BEFORE the supply-picture CSS block if present (so supply-picture
  //     stays immediately before </style> and its own --check re-injection order holds), else </style>.
  let cssAt = html.indexOf('/* supply-picture-css:start */');
  if (cssAt < 0) cssAt = html.indexOf('</style>');
  if (cssAt < 0) return html; // no <style>: nothing to hang CSS on, leave the page untouched
  html = html.slice(0, cssAt) + css + '\n' + html.slice(cssAt);
  // 2b) body block before the FAQ section (so it follows supply-picture, clear of the price hero);
  //     fall back to before </main> on the expanding "not wired up yet" pages that carry no FAQ.
  const faq = html.indexOf('class="ci-faq"');
  const sIdx = faq >= 0 ? html.lastIndexOf('<section', faq) : html.lastIndexOf('</main>');
  if (sIdx < 0) return html;
  const lineStart = html.lastIndexOf('\n', sIdx) + 1;
  const indent = html.slice(lineStart, sIdx);
  return html.slice(0, lineStart) + indent + block + '\n' + html.slice(lineStart);
}

// ---- self-test -----------------------------------------------------------------------------------
async function selfTest() {
  const { causalHit, forecastHit } = await import('./co-occurrence-patterns.mjs');
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) pass++; else { fail++; console.error('  ✗', n); } };
  const entry = { slug: 'onion', n: 143, events: 33, class_i_events: 28, class_ii_events: 5, class_iii_events: 0, latest: '2026-02-04', order_key: '2025-10-22',
    recent: [
      { date: '2026-02-04', classification: 'Class I', status: 'Ongoing', product: 'Fresh Diced Onion 5 lb', firm: 'Acme Produce', states: 'MD, VA' },
      { date: '2025-11-15', classification: 'Class I', status: 'Completed', product: 'Whole Yellow Onions', firm: 'Gills Onions, LLC', states: 'Nationwide' },
    ] };
  const en = rosterSection('onion', entry, false);
  const es = rosterSection('onion', entry, true);
  ok('EN leads with distinct events (33), not notices', /33 events/.test(en) && !/33 notices/.test(en));
  ok('EN carries the co-occurrence marker', en.includes(MARK_EN));
  ok('ES carries the Spanish co-occurrence marker', es.includes(MARK_ES));
  ok('every context block is tagged "Documented around this time"', (en.match(/Documented around this time/g) || []).length === 2);
  ok('renders product verbatim (matcher leak visible, not laundered)', en.includes('Fresh Diced Onion 5 lb'));
  ok('no cause/reason/why field rendered', !/(reason|cause|why)\s*[:=]/i.test(en) && !/data-(reason|cause|why)/.test(en));
  ok('no price token in the section', !/\$/.test(en) && !/\$/.test(es));
  ok('no causation phrasing (shared regex)', causalHit(en.replace(/<[^>]+>/g, ' ')) === null);
  ok('no forecast phrasing (shared regex)', forecastHit(en.replace(/<[^>]+>/g, ' ')) === null);
  ok('the ci-events__ctx class is reused (events-gate co-occurrence hook)', /class="ci-events__ctx/.test(en));
  ok('Class-I count surfaced in the lede', /28 Class I/.test(en));
  // graceful absence
  const none = rosterSection('kohlrabi', null, false);
  const noneEs = rosterSection('kohlrabi', undefined, true);
  ok('graceful absence: no recall in the openFDA window', none.includes('No recall in the openFDA window'));
  ok('graceful absence states FDA-only incompleteness', /FDA-regulated foods only/.test(none) && /an empty record is not an all-clear/.test(none));
  ok('graceful absence (ES) present', noneEs.includes('Sin retiro en el registro de openFDA'));
  ok('none-variant carries the ci-recalls--none marker', none.includes('ci-recalls--none'));
  ok('css block is sentinel-wrapped', rosterCss().startsWith(ROSTER_CSS_SENTINEL.start) && rosterCss().trim().endsWith(ROSTER_CSS_SENTINEL.end));
  ok('wrap() applies the body sentinels', wrap('X') === ROSTER_SENTINEL.start + 'X' + ROSTER_SENTINEL.end);
  // injectRecall — the shared code path: idempotent (strip(inject(x)) fixed point), anchors correctly
  const idx = { onion: entry };
  const shippable = '<html><head><style>.a{}\n/* supply-picture-css:start */.sp{}/* supply-picture-css:end */\n</style></head><body><main>\n    <section class="ci-supply">x</section>\n    <section class="ci-faq" id="f"><h2>FAQ</h2></section>\n  </main></body></html>';
  const once = injectRecall(shippable, 'onion', idx, false);
  const twice = injectRecall(once, 'onion', idx, false);
  ok('injectRecall is idempotent (fixed point)', once === twice);
  ok('injectRecall places the body before the FAQ section', once.indexOf('ci-recalls') < once.indexOf('class="ci-faq"'));
  ok('injectRecall places recall CSS before the supply-picture CSS', once.indexOf('ingredient-recalls-css:start') < once.indexOf('supply-picture-css:start'));
  ok('injectRecall leaves exactly one recall body block', (once.match(/ingredient-recalls:start/g) || []).length === 1);
  // expanding page (no FAQ) → anchors before </main>
  const expanding = '<html><head><style>.a{}\n</style></head><body><main>\n    <div class="ci-cta-row">x</div>\n  </main></body></html>';
  const exp = injectRecall(expanding, 'onion', idx, false);
  ok('expanding page: recall body lands before </main>', exp.indexOf('ci-recalls') >= 0 && exp.indexOf('ci-recalls') < exp.indexOf('</main>'));
  ok('expanding page: injectRecall idempotent', injectRecall(exp, 'onion', idx, false) === exp);
  ok('graceful-absence via injectRecall for an unlisted slug', /ci-recalls--none/.test(injectRecall(shippable, 'nope', idx, false)));
  console.log(`recall-roster self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('recall-roster.mjs') && process.argv.includes('--self-test')) selfTest();
