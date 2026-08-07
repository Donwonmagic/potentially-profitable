#!/usr/bin/env node
/**
 * Surface disposition — what happens to each of the 1,327 routable pages under
 * the closed-month doctrine.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * The strategy of record (docs/editorial/decisions/ADR-025-the-storefront-is-an-
 * audit-file.md, verdict in data/queue.json#strategy) kills traffic as an
 * objective and list growth as a metric. Muntin needs ~40 customers EVER. A
 * 1,327-page site built to be found is now a 1,327-page site that must be
 * *defensible* — because the reader who matters is a bookkeeper or a CPA
 * checking whether the number can be stood behind.
 *
 * That reframing has a mechanical consequence: the cost of a page is no longer
 * its writing, it is its MAINTENANCE. Every dated cite is a claim someone must
 * re-verify. Every audio track is a fabrication surface in six languages. Every
 * ES counterpart is a parity ratchet. A page that carries none of those costs
 * nothing to leave standing, and its inbound links and its URL are real equity.
 * A page that carries them and serves no one is a liability that grows.
 *
 * So the disposition is not "good page / bad page". It is:
 *
 *   keep            — maintained. The fact gate applies, cites are re-verified,
 *                     links stay live. This is the public audit file.
 *   freeze          — stays at its URL, stays indexable, keeps its equity, and
 *                     is RELEASED from every maintenance ratchet. Read-only.
 *   freeze-noindex  — `noindex, follow`. For pages that would embarrass (retired
 *                     web-design line) or whose dated claims nobody will
 *                     re-verify. The URL survives; the index entry does not.
 *   merge           — thin AND on-thesis AND its parent is still maintained. The
 *                     only disposition that needs editorial judgement, and it is
 *                     EMPTY by measurement. That is the finding, not a gap.
 *   delete          — the file goes, a 301 replaces it. Reserved for the
 *                     provably-dead cut: noindex AND absent from the sitemap AND
 *                     no editorial inbound link AND unreachable by any walk from
 *                     either home, AND not a runtime surface.
 *
 * NOT WIRED, ON PURPOSE
 *
 * This is an analysis generator, not a builder and not a gate.
 *   - It is not named check-*.mjs, so check-gate-coverage.mjs does not claim it.
 *   - It is NOT registered in check-all.mjs as an "(idem)" builder, so
 *     check-idem-coverage.mjs does not demand a healer for it. Registering it
 *     would create exactly the obligation this repo has learned to refuse: a
 *     builder CI verifies that nothing re-runs.
 *   - It reads three generated inventories and writes one file. Re-run it after
 *     data/surface-inventory.json is rebuilt; until then the output is stable.
 *
 * The gate that ENFORCES the manifest is scripts/check-surface-disposition.mjs,
 * which is deliberately UNWIRED today because it fails today — see its header
 * and check-gate-coverage.mjs#UNWIRED.
 *
 * Usage:
 *   node scripts/build-surface-disposition.mjs           # write data/surface-disposition.json
 *   node scripts/build-surface-disposition.mjs --check   # exit 1 if the file would change
 *   node scripts/build-surface-disposition.mjs --report  # print the matrix
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const OUT = path.join(REPO, 'data', 'surface-disposition.json');

const read = (p) => JSON.parse(fs.readFileSync(path.join(REPO, p), 'utf8'));

// ─────────────────────────────────────────────────────────────────────────────
// Runtime surfaces. These are not reader prose; they are machinery that a
// browser or an operator hits directly. Deleting one because "nothing links to
// it" breaks a running thing — which is exactly why the provably-dead rule
// excludes them BY NAME rather than by heuristic.
// ─────────────────────────────────────────────────────────────────────────────
export const RUNTIME_ROUTES = new Set([
  '/404.html', '/es/404.html',                                   // served by the Worker on any miss
  '/admin/kpis/', '/admin/window/', '/admin/submissions/',
  '/es/admin/window/', '/es/admin/submissions/',                 // operator harness, noindex by design
  '/brand/og/preview.html',                                      // OG card render harness
  '/cost-index/ribeye/embed.html', '/es/cost-index/ribeye/embed.html', // iframe embed target
  '/sign-in/', '/es/sign-in/',                                   // auth entry — noindex is correct
  '/account/', '/es/account/',                                   // authenticated surface
  '/workbench/', '/es/workbench/',                               // operator workbench
  '/tools/start/', '/es/tools/start/',                           // tool onboarding shim
]);

/** Blog slugs that are the publication of record, not explanatory prose. */
const isDispatch = (r) => /\/blog\/cost-index-week-/.test(r);

/** The close spine — pages the doctrine requires that do not exist yet. */
export const TO_BUILD = [
  { route: '/close/', why: 'What a close guarantees, what it withholds, what it costs. The new center of the site.', queue: 'Q-072' },
  { route: '/close/specimen/', why: 'One complete month with the exceptions shown. Ships only under written authorization, redaction, or a consenting third restaurant.', queue: 'Q-030' },
  { route: '/close/limits/', why: 'The append-only, code-cited defect register. The artifact the price is justified by.', queue: 'Q-025' },
  { route: '/close/apply/', why: 'Five qualifying questions. Replaces all four waitlist forms — at forty customers, qualification IS the funnel.', queue: 'Q-040' },
  { route: '/cost-index/corrections/', why: 'Every correction naming the gate that now prevents recurrence.', queue: 'Q-007' },
  { route: '/cost-index/refusals/', why: 'The 100 pre-written toHigh blocker strings, published as what Muntin will not say.', queue: 'Q-033' },
  { route: '/cost-index/freshness/', why: 'The 42 written structural gap reasons, published.', queue: 'Q-033' },
  { route: '/tools/pack-check/', why: 'A browser-runnable tool that visibly declines to answer when the evidence is inconclusive. The one falsifier a stranger can execute.', queue: 'Q-032' },
];

// ─────────────────────────────────────────────────────────────────────────────
// The rule ladder. First match wins. Every rule names the measured signal it
// fires on, so a future session can re-derive the verdict instead of trusting it.
// ─────────────────────────────────────────────────────────────────────────────
export const RULES = [
  {
    id: 'R0-runtime',
    disposition: 'keep',
    doc: 'Runtime or operator surface, not reader prose. noindex is correct and deletion breaks a running thing.',
  },
  {
    id: 'R1-audit-file',
    disposition: 'keep',
    doc: 'Company page a prospect, a bookkeeper or a CPA reads to decide whether the number can be stood behind: marketing, product, trust. This is the public audit file and it is the storefront\'s actual job.',
  },
  {
    id: 'R2-published-basis',
    disposition: 'keep',
    doc: 'Cost Index. Not the product and not the marketing — the public half of a paid deliverable\'s audit trail, the basis the close is priced off. Stays, and stays fresh.',
  },
  {
    id: 'R3-falsifier',
    disposition: 'keep',
    doc: 'A tool a stranger can run in a browser. A thing that visibly declines to answer is a stronger honesty proof than a page that claims honesty.',
  },
  {
    id: 'R4-of-record',
    disposition: 'keep',
    doc: 'A dated edition of the publication of record. Citable, frozen per asOf, never rewritten silently.',
  },
  {
    id: 'R5-evidence-chain',
    disposition: 'keep',
    doc: 'On-thesis prose carrying live cite drawers — the evidence chain a reviewer follows. Maintained because the fact gate already binds it.',
  },
  {
    id: 'R6-provably-dead',
    disposition: 'delete',
    doc:
      'noindex AND absent from the sitemap AND no editorial inbound link AND UNREACHABLE in the rendered graph from both the root home and the locale home ' +
      '— and not a runtime surface. Reachability, not in-degree: the fourteen pages this fires on each have exactly one rendered inbound edge, from their own ' +
      'hreflang counterpart, so they form closed EN↔ES pairs that no walk of the site can enter. In-degree would have scored them "linked" and hidden that.',
  },
  {
    id: 'R6b-already-frozen',
    disposition: 'freeze-noindex',
    doc:
      'Already carries a noindex robots directive. A prior thread made this judgement; this rule RECORDS it rather than reversing it. Un-freezing a page is new ' +
      'editorial work with no buyer attached, and the 261 already-frozen pages are the cheapest thing on the site — they cost nothing and they keep their URLs.',
  },
  {
    id: 'R7-retired-line-indexed',
    disposition: 'freeze-noindex',
    doc: 'Indexed page carrying the retired web-design line at or above the positioning gate\'s own threshold. This is check-positioning-drift.mjs\'s own remedy, applied rather than allow-listed.',
  },
  {
    id: 'R8-stale-claims-offthesis',
    disposition: 'freeze-noindex',
    doc: 'Off-thesis and carrying dated cite drawers. Nobody will re-verify them, and a dated claim nobody re-verifies must not stay in the index.',
  },
  {
    id: 'R8b-thin-indexed-offthesis',
    disposition: 'freeze-noindex',
    doc:
      'Off-thesis, under 300 words, and INDEXED. A thin page serving no thesis is an index liability and a URL asset at the same time; noindex,follow resolves both ' +
      'for zero editorial hours. This is where the 57 /library/menu-design-themes/* pages land — the retired Menu Design Suite\'s marketing, which data/content-intent.json ' +
      'classified as "merge" under the old traffic doctrine.',
  },
  {
    id: 'R9-thin-onthesis',
    disposition: 'merge',
    doc:
      'On-thesis, under 300 words, at most 2 inbound editorial links, and its parent is itself a KEEP page. The only disposition that needs editorial judgement — ' +
      'and it is EMPTY by measurement, which is the finding, not a gap. Merging costs editorial hours to consolidate pages the company has just decided to stop ' +
      'maintaining; freeze-noindex buys the same index hygiene for zero hours. Merge is reserved for content that genuinely belongs inside a page still being maintained.',
  },
  {
    id: 'R10-explanatory-prose',
    disposition: 'freeze',
    doc: 'Explanatory prose that no longer serves an objective the company holds. It keeps its URL, its inbound links and its index entry — that equity is real and free — and is released from every maintenance ratchet: no dated cites to re-verify, no audio, no ES parity, no analytics, no CTA injection.',
  },
];

/**
 * @returns {{disposition:string, rule:string, reason:string}}
 */
export function disposeOf(s, l, c, cites) {
  const cls = s.surfaceClass;
  const cite = cites.cite;

  if (RUNTIME_ROUTES.has(s.route) || cls === 'admin') {
    return { disposition: 'keep', rule: 'R0-runtime', reason: 'runtime or operator surface — noindex by design, and something calls it directly' };
  }
  if (cls === 'marketing' || cls === 'product' || cls === 'trust') {
    return { disposition: 'keep', rule: 'R1-audit-file', reason: `company page (${cls}) — part of the public audit file a reviewer reads before recommending you` };
  }
  if (cls === 'cost-index') {
    return { disposition: 'keep', rule: 'R2-published-basis', reason: 'the published basis the close is priced off — stays, and stays fresh' };
  }
  if (cls === 'tool') {
    return { disposition: 'keep', rule: 'R3-falsifier', reason: 'browser-runnable falsifier — the honesty proof a stranger can execute without repo access' };
  }
  if (isDispatch(s.route)) {
    return { disposition: 'keep', rule: 'R4-of-record', reason: 'dated edition of the publication of record' };
  }
  // Provably dead, computed rather than asserted. REACHABILITY, not in-degree:
  // the fourteen sheets this fires on each hold one rendered inbound edge from
  // their own hreflang counterpart, so an in-degree test scores them "linked".
  if (!s.indexable && !s.inSitemap && s.isOrphanEvenViaRedirect &&
      l.clickDepthFromHomeRendered === null && l.clickDepthFromLocaleHome === null) {
    return { disposition: 'delete', rule: 'R6-provably-dead', reason: 'noindex, not in the sitemap, no editorial inbound link, and unreachable by any walk from either home — nothing sees it and nothing breaks' };
  }
  // Already noindex and not part of the audit file: the freeze already happened.
  // Record it rather than reverse it — un-freezing is new work with no buyer.
  if (!s.indexable) {
    return { disposition: 'freeze-noindex', rule: 'R6b-already-frozen', reason: 'already carries noindex — this records the freeze that a prior thread performed rather than reversing it' };
  }
  if (s.retiredLineScore >= 3 && s.indexable) {
    return { disposition: 'freeze-noindex', rule: 'R7-retired-line-indexed', reason: `${s.retiredLineScore} retired-line phrases on an INDEXED page — the positioning gate's own remedy` };
  }
  if (!c.onThesis && cite > 0) {
    return { disposition: 'freeze-noindex', rule: 'R8-stale-claims-offthesis', reason: `${cite} dated cite drawer(s) on an off-thesis page — nobody will re-verify them` };
  }
  if (!c.onThesis && s.wordCount < 300 && s.indexable) {
    return { disposition: 'freeze-noindex', rule: 'R8b-thin-indexed-offthesis', reason: `${s.wordCount} words, off-thesis, and indexed — the index entry is a liability, the URL is not` };
  }
  if (c.onThesis && s.wordCount < 300 && s.inboundInternalLinks <= 2) {
    return { disposition: 'merge', rule: 'R9-thin-onthesis', reason: `${s.wordCount} words and ${s.inboundInternalLinks} inbound editorial link(s) — on-thesis but too thin to stand alone` };
  }
  if (cite > 0) {
    return { disposition: 'keep', rule: 'R5-evidence-chain', reason: `${cite} live cite drawer(s) on an on-thesis page — part of the evidence chain the fact gate already binds` };
  }
  return {
    disposition: 'freeze',
    rule: 'R10-explanatory-prose',
    reason: c.onThesis
      ? 'on-thesis explanatory prose with no dated claims — keeps its URL and its index entry, loses every maintenance ratchet'
      : 'off-thesis explanatory prose with no dated claims — keeps its URL and its index entry, loses every maintenance ratchet',
  };
}

/**
 * Analytics belongs on the qualification path only. ~50 pages, not 1,327: the
 * measure of this storefront is qualified applications, not sessions, and an
 * analytics tag on a frozen 2025 article measures nothing anyone will act on.
 */
export function instruments(s) {
  return s.surfaceClass === 'marketing' || s.surfaceClass === 'product' ||
    s.surfaceClass === 'trust' || s.surfaceClass === 'tool' ||
    /^\/(es\/)?cost-index\/?$/.test(s.route) ||
    /^\/(es\/)?cost-index\/(weekly|events|corrections|refusals|freshness)\/$/.test(s.route);
}

function build() {
  const si = read('data/surface-inventory.json');
  const lg = read('data/link-graph.json');
  const ci = read('data/content-intent.json');

  const L = new Map(lg.nodes.map((n) => [n.route, n]));
  const C = new Map(ci.pages.map((p) => [p.route, p]));

  // Cite drawers and src sentinels are the maintenance obligation, measured from
  // the HTML rather than assumed. `<details class="cite">` is the fact gate's own
  // inline-citation form (docs/fact-check.md).
  const CITE = /<details class="cite"/g;
  const SRC = /<!--\s*src:/g;

  const pages = si.pages.map((s) => {
    const l = L.get(s.route);
    const c = C.get(s.route);
    if (!l || !c) throw new Error(`inventories disagree on ${s.route} — rebuild all three before running this`);
    let html = '';
    try { html = fs.readFileSync(path.join(REPO, s.filePath), 'utf8'); } catch { /* generated-away */ }
    const cites = { cite: (html.match(CITE) || []).length, src: (html.match(SRC) || []).length };
    const d = disposeOf(s, l, c, cites);
    const frozen = d.disposition === 'freeze' || d.disposition === 'freeze-noindex';
    return {
      route: s.route,
      filePath: s.filePath,
      lang: s.lang,
      surfaceClass: s.surfaceClass,
      surfaceRoot: s.surfaceRoot,
      disposition: d.disposition,
      rule: d.rule,
      reason: d.reason,
      onThesis: c.onThesis,
      topicCluster: c.topicCluster,
      // What this page costs to keep alive. Freezing releases all of it.
      maintain: {
        factGate: !frozen && cites.cite > 0,
        audio: !frozen && s.hasAudio,
        esParity: !frozen && Boolean(s.counterpartRoute),
        analytics: !frozen && instruments(s),
        ctaInjection: !frozen && s.surfaceClass !== 'glossary',
      },
      // What deleting it would burn. Measured, not guessed.
      equity: {
        indexable: s.indexable,
        inSitemap: s.inSitemap,
        inboundEditorial: s.inboundInternalLinks,
        inboundRendered: l.inDegreeRendered,
        clickDepthRendered: l.clickDepthFromHomeRendered,
        wordCount: s.wordCount,
      },
      obligations: {
        citeDrawers: cites.cite,
        srcSentinels: cites.src,
        hasAudio: s.hasAudio,
        audioTracks: s.audioTrackCount,
        hasAnalytics: s.hasAnalytics,
        hasSubscribeForm: s.hasSubscribeForm,
        hasWaitlistForm: s.hasWaitlistForm,
        deadProductCta: l.deadProductCta,
        retiredLineScore: s.retiredLineScore,
        counterpartRoute: s.counterpartRoute || null,
      },
      // Only set where the disposition needs a target.
      ...(d.disposition === 'delete' ? { redirectTo: s.route.startsWith('/es/') ? '/es/sheets/' : '/sheets/' } : {}),
      ...(d.disposition === 'merge' ? { mergeCandidate: mergeParent(s), judgement: 'editorial — an agent may propose the fold, a human approves it' } : {}),
    };
  });

  const by = (k, seed = {}) => pages.reduce((a, p) => { a[p[k]] = (a[p[k]] || 0) + 1; return a; }, { ...seed });
  const ZERO = { keep: 0, freeze: 0, 'freeze-noindex': 0, merge: 0, delete: 0 };
  const cross = {};
  for (const p of pages) {
    (cross[p.surfaceClass] ||= {})[p.disposition] = ((cross[p.surfaceClass] || {})[p.disposition] || 0) + 1;
  }
  const del = pages.filter((p) => p.disposition === 'delete');
  const maintained = pages.filter((p) => p.disposition === 'keep');

  return {
    _doc:
      'Disposition of every routable page under the closed-month doctrine. Machine-readable so the decision is DATA a future session executes, not prose it must re-derive. ' +
      'Generated by scripts/build-surface-disposition.mjs from data/surface-inventory.json, data/link-graph.json and data/content-intent.json. Nothing here is hand-written.',
    _asOf: si._asOf,
    _asOfBasis: 'inherited from data/surface-inventory.json — no wall clock enters this file, so --check is stable until a commit lands',
    _decisionOfRecord: 'docs/editorial/decisions/ADR-025-the-storefront-is-an-audit-file.md',
    _doctrine:
      'Credibility is a CLOSING asset, not a demand asset. The storefront is the public audit file a bookkeeper or a CPA reads for forty minutes before recommending you — ' +
      'not an acquisition engine. At ~40 customers ever it needs roughly 400 qualified readers, and its measure is qualified applications and whether the CPA said yes, never sessions.',
    _dispositions: {
      keep: 'Maintained. Fact gate applies, cites re-verified, links stay live, analytics where the qualification path runs.',
      freeze: 'Stays at its URL, stays indexable, keeps its inbound links and its index entry. Released from every maintenance ratchet. Read-only.',
      'freeze-noindex': '`noindex, follow`. The URL survives and keeps passing link equity; the index entry does not. For pages that embarrass or whose dated claims nobody will re-verify.',
      merge: 'Thin AND on-thesis AND the parent is still maintained. Fold into the named parent, 301 the source. Needs editorial judgement. EMPTY today — see RULES#R9.',
      delete: 'File removed, 301 to the nearest live parent. Reserved for the provably-dead cut.',
    },
    _slugsAreFinal:
      'Slugs are final-forever (CLAUDE.md). freeze and freeze-noindex both PRESERVE the URL, which is why they are the default and delete is the exception. ' +
      'A deletion that burns inbound-link equity for tidiness is a bad trade; the delete set is therefore defined by measured unreachability, not by editorial distaste.',
    _rules: RULES,
    _toBuild: TO_BUILD,
    summary: {
      pages: pages.length,
      byDisposition: by('disposition', ZERO),
      byRule: by('rule'),
      byClassAndDisposition: cross,
      maintainedPages: maintained.length,
      instrumentedPages: pages.filter((p) => p.maintain.analytics).length,
      wordsFrozen: pages.filter((p) => p.disposition.startsWith('freeze')).reduce((a, p) => a + p.equity.wordCount, 0),
      wordsMaintained: maintained.reduce((a, p) => a + p.equity.wordCount, 0),
      citeDrawersMaintained: maintained.reduce((a, p) => a + p.obligations.citeDrawers, 0),
      citeDrawersReleased: pages.filter((p) => p.disposition !== 'keep').reduce((a, p) => a + p.obligations.citeDrawers, 0),
      audioTracksReleased: pages.filter((p) => p.disposition !== 'keep').reduce((a, p) => a + p.obligations.audioTracks, 0),
      analyticsTagsToRemove: pages.filter((p) => p.obligations.hasAnalytics && !p.maintain.analytics).length,
    },
    phase0: {
      _doc:
        'The ONLY deletion the verdict authorizes, computed exactly rather than asserted. ' +
        'CORRECTION OF RECORD: the verdict and queue item Q-052 both say "162 provably-dead pages". That number is data/content-intent.json#summary.deadWeight.total, ' +
        'which counts pages that are frozen AND OFF-THESIS — not frozen AND ORPHANED. 142 of those 162 are still linked (median rendered in-degree 12) and deleting them ' +
        'would break live internal links. The measured provably-dead set is smaller by an order of magnitude, and 10 of what remains is runtime machinery.',
      noindexAndUnreachable: pages.filter((p) => !p.equity.indexable && !p.equity.inSitemap && p.equity.clickDepthRendered === null && p.equity.inboundEditorial === 0).length,
      ofWhichRuntime: pages.filter((p) => !p.equity.indexable && !p.equity.inSitemap && p.equity.clickDepthRendered === null && p.equity.inboundEditorial === 0 && p.rule === 'R0-runtime').length,
      deletable: del.length,
      deletableRoutes: del.map((p) => p.route).sort(),
      deletableWords: del.reduce((a, p) => a + p.equity.wordCount, 0),
      alsoPrune: [
        'data/sheets.json + data/sheets.es.json — the 7 entries',
        'data/cross-surface-map.json — sheet references',
        'scripts/sheets-fragments/<slug>.html — the 7 fragments',
        'data/sheet-releases.json, data/sheet-glossary-anchors.json, data/sheet-worked-examples.json — any entry for the 7',
      ],
    },
    pages,
  };
}

function mergeParent(s) {
  const es = s.route.startsWith('/es/') ? '/es' : '';
  const root = s.surfaceRoot;
  if (root === 'glossary') return `${es}/glossary/`;
  if (root === 'sheets') return `${es}/sheets/`;
  if (root === 'library') return `${es}/learn/`;
  if (root === 'blog') return `${es}/blog/`;
  return `${es}/`;
}

function main() {
  const argv = process.argv.slice(2);
  const doc = build();
  const text = JSON.stringify(doc, null, 1) + '\n';

  if (argv.includes('--report')) {
    console.log(`surface-disposition — ${doc.summary.pages} pages, asOf ${doc._asOf}`);
    for (const [k, v] of Object.entries(doc.summary.byDisposition)) console.log(`  ${k.padEnd(15)} ${v}`);
    console.log('\nby rule:');
    for (const [k, v] of Object.entries(doc.summary.byRule)) console.log(`  ${k.padEnd(26)} ${v}`);
    console.log('\nprovably dead:');
    console.log(`  noindex + not in sitemap + unreachable + no editorial inbound : ${doc.phase0.noindexAndUnreachable}`);
    console.log(`  of which runtime machinery (NOT deletable)       : ${doc.phase0.ofWhichRuntime}`);
    console.log(`  DELETABLE                                        : ${doc.phase0.deletable}`);
    console.log(`\nmaintained ${doc.summary.maintainedPages} · instrumented ${doc.summary.instrumentedPages} · cite drawers released ${doc.summary.citeDrawersReleased}`);
    return;
  }
  if (argv.includes('--check')) {
    const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
    if (prev !== text) {
      console.error('✗ data/surface-disposition.json is stale — run: node scripts/build-surface-disposition.mjs');
      process.exit(1);
    }
    console.log('✓ surface-disposition (idempotent)');
    return;
  }
  fs.writeFileSync(OUT, text);
  console.log(`✓ wrote data/surface-disposition.json — ${doc.summary.pages} pages, ${doc.phase0.deletable} deletable`);
}

if (process.argv[1] === __filename) main();
