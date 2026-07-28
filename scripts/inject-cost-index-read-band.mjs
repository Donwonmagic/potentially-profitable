#!/usr/bin/env node
/**
 * inject-cost-index-read-band.mjs — the M/W/F observation band under the basket reading
 * on /cost-index/ (EN + ES).
 *
 * WHAT IT SAYS AND WHY THAT WORDING. The refresh runs Mon/Wed/Fri, but the basket rides
 * mostly MONTHLY public series, so the read usually does NOT move between refreshes. The
 * band therefore reports the observation record rather than implying a new number:
 *
 *     Observed Mon/Wed/Fri · this read is unchanged since 28 Jul 2026, last checked
 *     30 Jul 2026 · data through 2026-06-01
 *
 * "We checked and nothing moved" is true and useful to an operator. "Updated today" over
 * an April data vintage would be manufactured freshness, which docs/fact-check.md forbids.
 *
 * HONESTY:
 *   - Both dates always shown, never collapsed: the DATA vintage (dataAsOf) and the
 *     OBSERVATION dates (firstSeenAt / lastCheckedAt).
 *   - Every figure is read from cost-index/reads.json, itself a deterministic recompute of
 *     the committed measured data. Nothing here is typed, estimated, or forecast.
 *   - A wholesale reference, never a delivered price. No direction call, no prediction.
 *   - This band is NOT a dispatch. The dispatch stays monthly, hand-written and
 *     hand-published (ADR-011, ADR-012); no post is generated and no email is sent.
 *
 * Idempotent strip+rewrite between sentinels; runs after build-cost-index-pages.mjs.
 *
 *   node scripts/inject-cost-index-read-band.mjs           # rewrite in place
 *   node scripts/inject-cost-index-read-band.mjs --check   # exit 1 if out of sync
 *   node scripts/inject-cost-index-read-band.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const START = '<!-- ci-read-band:start -->';
const END = '<!-- /ci-read-band:end -->';
const ANCHOR = '<section class="ci-scorecard"';
const SRC = 'cost-index/reads.json';

const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const MON_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_ES = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function human(iso, es) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  return es ? `${d} ${MON_ES[m]} ${y}` : `${d} ${MON_EN[m]} ${y}`;
}

const CSS = `<style>/* ci-read-band */
.ci-readband{margin:10px 0 0;padding:10px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px;line-height:1.55}
.ci-readband__cad{font-family:var(--font-display);font-size:12px;letter-spacing:.02em;text-transform:uppercase;opacity:.7}
.ci-readband__dl{margin-left:6px}
</style>`;

export function bandHtml(reads, es) {
  if (!Array.isArray(reads) || !reads.length) return null;
  const latest = reads[reads.length - 1];
  const changed = reads.length > 1;
  const cadence = es ? 'Observado lun/mié/vie' : 'Observed Mon/Wed/Fri';

  const state = latest.firstSeenAt === latest.lastCheckedAt
    ? (es ? `lectura registrada el ${human(latest.firstSeenAt, true)}` : `read recorded ${human(latest.firstSeenAt, false)}`)
    : (es
        ? `sin cambios desde el ${human(latest.firstSeenAt, true)}, comprobado por última vez el ${human(latest.lastCheckedAt, true)}`
        : `unchanged since ${human(latest.firstSeenAt, false)}, last checked ${human(latest.lastCheckedAt, false)}`);

  const vintage = es
    ? `datos hasta ${esc(latest.dataAsOf)}`
    : `data through ${esc(latest.dataAsOf)}`;

  const hist = changed
    ? (es ? ` · ${reads.length} lecturas registradas` : ` · ${reads.length} recorded reads`)
    : '';

  const dl = es
    ? `<a class="ci-readband__dl" href="/cost-index/reads.json">registro completo (CC0)</a>`
    : `<a class="ci-readband__dl" href="/cost-index/reads.json">full read log (CC0)</a>`;

  const note = es
    ? 'La referencia mayorista, nunca un precio entregado ni un pronóstico. El despacho mensual se escribe a mano.'
    : 'A wholesale reference, never a delivered price and never a forecast. The monthly dispatch is hand-written.';

  return `${START}${CSS}
  <p class="ci-readband"><span class="ci-readband__cad">${cadence}</span> · ${state} · ${vintage}${hist}${dl}<br><span style="opacity:.7">${note}</span></p>
${END}`;
}

export function injectBand(html, reads, es) {
  const i = html.indexOf(START);
  if (i >= 0) {
    const j = html.indexOf(END, i);
    if (j >= 0) {
      let from = i, to = j + END.length;
      while (from > 0 && /\s/.test(html[from - 1])) from--;
      while (to < html.length && /\s/.test(html[to])) to++;
      html = html.slice(0, from) + html.slice(to);
    }
  }
  const block = bandHtml(reads, es);
  if (block === null) return html; // no reads yet — leave the page untouched
  const at = html.indexOf(ANCHOR);
  if (at < 0) return null;
  let ins = at;
  while (ins > 0 && /\s/.test(html[ins - 1])) ins--;
  return html.slice(0, ins) + '\n\n  ' + block + '\n\n  ' + html.slice(at);
}

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  let fail = 0; const t = (n, c) => { if (!c) { console.error('  ✗', n); fail++; } };
  const one = [{ dataAsOf: '2026-06-01', firstSeenAt: '2026-07-28', lastCheckedAt: '2026-07-28', pct: -0.005 }];
  const two = [one[0], { dataAsOf: '2026-07-01', firstSeenAt: '2026-08-03', lastCheckedAt: '2026-08-07', pct: 0.01 }];
  const page = '<main><section class="ci-composite">basket</section><section class="ci-scorecard">score</section></main>';

  const a = injectBand(page, one, false);
  t('places the band before the scorecard', a.indexOf(START) < a.indexOf(ANCHOR));
  t('first-day wording avoids a false "unchanged"', a.includes('read recorded') && !a.includes('unchanged since'));
  t('shows the data vintage', a.includes('data through 2026-06-01'));
  t('links the CC0 log', a.includes('/cost-index/reads.json'));
  t('carries the not-a-delivered-price caveat', /never a delivered price/.test(a));
  t('carries the not-a-forecast caveat', /never a forecast/.test(a));
  t('states the dispatch is hand-written', /hand-written/.test(a));

  const b = injectBand(page, two, false);
  t('unchanged wording appears once dates differ', b.includes('unchanged since 3 Aug 2026') && b.includes('last checked 7 Aug 2026'));
  t('reports the recorded-read count', b.includes('2 recorded reads'));

  const twice = injectBand(a, one, false);
  t('idempotent (byte-identical on re-run)', twice === a);
  t('exactly one band after re-run', (twice.match(/ci-read-band:start/g) || []).length === 1);

  const es = injectBand(page, two, true);
  t('ES cadence', es.includes('Observado lun/mié/vie'));
  t('ES unchanged wording', es.includes('sin cambios desde'));
  t('ES caveat', es.includes('nunca un precio entregado'));

  t('no reads -> page untouched', injectBand(page, [], false) === page);
  t('no anchor -> null', injectBand('<div>x</div>', one, false) === null);
  // must never imply a fresh number over a stale vintage
  t('never says "updated today"', !/updated today|actualizado hoy/i.test(a + es));

  if (fail) { console.error(`inject-cost-index-read-band self-test: ${fail} failure(s).`); process.exit(1); }
  console.log('inject-cost-index-read-band self-test: 17/17 passed (placement, two-date wording, idempotency, ES, no manufactured freshness).');
  process.exit(0);
}

// ── run ──────────────────────────────────────────────────────────────────────
if (!fs.existsSync(path.join(repo, SRC))) {
  console.error(`  - ${SRC} missing — run scripts/build-cost-index-reads.mjs first.`);
  process.exit(CHECK ? 1 : 0);
}
const reads = rd(SRC).reads || [];

let changed = 0; const skipped = [];
for (const [rel, es] of [['cost-index/index.html', false], ['es/cost-index/index.html', true]]) {
  const abs = path.join(repo, rel);
  if (!fs.existsSync(abs)) { skipped.push(`${rel}: missing`); continue; }
  const before = fs.readFileSync(abs, 'utf8');
  const after = injectBand(before, reads, es);
  if (after === null) { skipped.push(`${rel}: no ${ANCHOR} anchor`); continue; }
  if (after !== before) { changed++; if (!CHECK) fs.writeFileSync(abs, after); }
}

if (skipped.length) for (const s of skipped) console.error('  - ' + s);
if (CHECK) {
  if (changed || skipped.length) { console.error(`✗ ci-read-band: ${changed} page(s) out of sync — run: node scripts/inject-cost-index-read-band.mjs`); process.exit(1); }
  console.log(`✓ ci-read-band: observation band in sync on both hubs (${reads.length} recorded read(s)).`);
} else {
  console.log(`ci-read-band: ${changed} file(s) changed (${reads.length} recorded read(s)).`);
}
