#!/usr/bin/env node
/**
 * build-corrections-page.mjs — renders /cost-index/corrections/ from the
 * append-only ledger at data/cost-index-corrections.json.
 *
 * WHY THIS PAGE LOOKS LIKE THIS. The free-authority panel's finding
 * (docs/handoff/bones/greats-free-authority.md:36,40,97) is that great authority
 * brands do not apologize for being wrong — they ship a mechanism and publish
 * the mechanism. Michelin prints star losses in the same document, on the same
 * day, as star gains: unsigned, unexplained, no apology, on a known calendar. A
 * prominent mea culpa would be both defensive and WEAKER than a quiet, dated,
 * permanent, append-only record a skeptic can find. So:
 *
 *   · no apology copy, no "we're sorry", no reassurance
 *   · every entry leads with what was published and what is true
 *   · every entry names the GATE that now prevents recurrence, with the script
 *     path, so a stranger can run it — this is the field that turns a confession
 *     into evidence the machine improved
 *   · `pending` entries are published BEFORE the prose is fixed, saying so
 *   · the page is findable, not announced
 *
 * Chrome (head, nav, footer) is cloned from a donor page so this file never
 * drifts from the site's shell. Deterministic; --check pins it in CI.
 *
 *   node scripts/build-corrections-page.mjs
 *   node scripts/build-corrections-page.mjs --check
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DONOR = 'cost-index/events/index.html';
const OUT = 'cost-index/corrections/index.html';
const URL = 'https://muntin.digital/cost-index/corrections/';
const TITLE = 'Corrections — every number we published and got wrong | Muntin Digital';
const DESC = 'An append-only record of figures the Muntin Cost Index published and got wrong: what was published, what is true, why it broke, and the check script that now prevents it.';

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ledger = JSON.parse(readFileSync(path.join(REPO, 'data/cost-index-corrections.json'), 'utf8'));
const donor = readFileSync(path.join(REPO, DONOR), 'utf8');

// ---- chrome ---------------------------------------------------------------
const headEnd = donor.indexOf('</head>');
const mainStart = donor.indexOf('<main id="main"');
const mainEnd = donor.indexOf('</main>') + '</main>'.length;
if (headEnd < 0 || mainStart < 0 || mainEnd < 7) throw new Error(`donor ${DONOR} does not have the expected shell`);

let head = donor.slice(0, headEnd);
// Swap every donor-specific metadata value. Done by targeted replacement rather
// than regex-over-everything so a miss is visible as a stale string in the diff.
head = head
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)}</title>`)
  .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(DESC)}" />`)
  .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${URL}" />`)
  .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(TITLE)}" />`)
  .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(DESC)}" />`)
  .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${URL}" />`)
  .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(TITLE)}" />`)
  .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(DESC)}" />`)
  // The corrections page is EN-only for now — no ES mirror exists, so shipping
  // hreflang alternates pointing at a 404 would be its own small dishonesty.
  .replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, '')
  .replace(/<meta property="og:locale:alternate"[^>]*\/>\n?/g, '');

// Replace the donor's JSON-LD graph wholesale.
const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Dataset',
      '@id': URL + '#dataset',
      name: 'Muntin Cost Index corrections',
      url: URL,
      description: DESC,
      license: 'https://creativecommons.org/publicdomain/zero/1.0/',
      creator: { '@id': 'https://muntin.digital/#business' },
      isAccessibleForFree: true,
      distribution: { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: 'https://muntin.digital/cost-index/corrections.json' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://muntin.digital/' },
        { '@type': 'ListItem', position: 2, name: 'Cost index', item: 'https://muntin.digital/cost-index/' },
        { '@type': 'ListItem', position: 3, name: 'Corrections', item: URL },
      ],
    },
  ],
};
head = head.replace(/<script type="application\/ld\+json">.*?<\/script>/s, `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`);

const extraCss = `
<style>
.cor-wrap{max-width:820px}
.cor-entry{border:1px solid var(--line);border-radius:14px;background:var(--white);padding:24px;margin:22px 0}
.cor-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:12px;margin-bottom:14px}
.cor-id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--stone)}
.cor-status{font-size:12px;letter-spacing:.04em;text-transform:uppercase;padding:3px 10px;border-radius:999px;border:1px solid var(--line);color:var(--ink-soft)}
.cor-status[data-s="pending"]{border-color:#D8C08A;color:var(--gold)}
.cor-dates{font-size:13px;color:var(--stone);margin-left:auto}
.cor-row{display:grid;grid-template-columns:132px 1fr;gap:10px 18px;padding:10px 0;border-top:1px solid var(--cream-2)}
.cor-row:first-of-type{border-top:0}
.cor-k{font-size:13px;color:var(--stone);padding-top:2px}
.cor-v{font-size:16px}
.cor-gate{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;background:var(--teal-wash);padding:2px 7px;border-radius:5px}
.cor-note{font-size:15px;color:var(--ink-soft);margin-top:6px}
@media (max-width:640px){.cor-row{grid-template-columns:1fr;gap:2px}.cor-dates{margin-left:0;width:100%}}
</style>`;

// ---- body -----------------------------------------------------------------
const row = (k, v, cls = '') => `<div class="cor-row"><div class="cor-k">${esc(k)}</div><div class="cor-v ${cls}">${v}</div></div>`;

const entries = (ledger.corrections || []).slice().reverse().map((c) => `
      <article class="cor-entry" id="${esc(c.id)}">
        <div class="cor-head">
          <span class="cor-id">${esc(c.id)}</span>
          <span class="cor-status" data-s="${esc(c.status)}">${esc(c.status)}</span>
          <span class="cor-dates">broke ${esc(c.brokeOn)} · found ${esc(c.foundOn)}</span>
        </div>
        ${row('We published', esc(c.published))}
        ${row('What is true', esc(c.correct))}
        ${row('Why it broke', esc(c.why))}
        ${row('Gate that now prevents it', `<code class="cor-gate">${esc(c.gate)}</code>${c.gateNote ? `<div class="cor-note">${esc(c.gateNote)}</div>` : ''}`)}
        ${row('Surface', `<a href="${esc(c.surface)}">${esc(c.surface)}</a>`)}
        ${c.pendingNote ? row('Still owed', esc(c.pendingNote)) : ''}
      </article>`).join('\n');

const main = `<main id="main" role="main">
  <div class="container cor-wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/cost-index/">Cost index</a> / Corrections</nav>

    <section class="ci-hero">
      <h1>Corrections</h1>
      <p>Every figure the Cost Index published and got wrong, with the check script that now prevents it. Append-only: entries are added, never edited or removed.</p>
      <p>This is not the revisions ledger. <a href="/cost-index/revisions.json">Revisions</a> record a public source changing its own number after the fact — someone else's correction. This page records ours.</p>
    </section>

    <section>
      <h2>How this works</h2>
      <p>A correction here carries five things: what was published, what is true, when it broke, why it broke, and the name of the gate that now makes that specific error fail a build. The last one is the point. A number being wrong is ordinary; what is checkable is whether the machine that produced it got better. Every gate named below is a script in the public repository — clone it and run it.</p>
      <p>Some entries are marked <strong>pending</strong>. That means the gate shipped before the prose was rewritten. Publishing them in that state is deliberate: the record should show what was known on the day it was known, not only after it was tidy.</p>
      <p>The machine-readable ledger is at <a href="/cost-index/corrections.json"><code>/cost-index/corrections.json</code></a>, public domain, same terms as the rest of the Index.</p>
    </section>

    <section>
      <h2>The record</h2>
${entries}
    </section>
  </div>
</main>`;

const body = donor.slice(headEnd + '</head>'.length, mainStart);
const tail = donor.slice(mainEnd);
const html = head + extraCss + '</head>' + body + main + tail;

// The public JSON mirror.
const json = JSON.stringify({
  _doc: ledger._doc,
  license: 'https://creativecommons.org/publicdomain/zero/1.0/',
  url: URL,
  count: (ledger.corrections || []).length,
  corrections: ledger.corrections,
}, null, 2) + '\n';

const targets = [[OUT, html], ['cost-index/corrections.json', json]];
const check = process.argv.includes('--check');
let drift = 0;
for (const [rel, content] of targets) {
  const full = path.join(REPO, rel);
  if (check) {
    const cur = existsSync(full) ? readFileSync(full, 'utf8') : null;
    if (cur !== content) { drift++; console.log(`would update ${rel}`); }
  } else {
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}
if (check) { console.log(`Corrections page: ${drift} file(s) would change of ${targets.length}.`); process.exit(drift ? 1 : 0); }
console.log(`Corrections page: wrote ${targets.length} file(s) — ${(ledger.corrections || []).length} correction(s).`);
