#!/usr/bin/env node
/**
 * Surface archetypes — the smallest set of page TEMPLATES such that every one
 * of the 1,327 routable pages belongs to exactly one.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * "Redesign every surface" has been proposed five times in docs/handoff/
 * (reinvention-master-plan, site-reinvention-blueprint, redesign-execution-plan,
 * redesign-v3-system, warmth-cohesion-plan — 717 lines) and shipped zero times.
 * It fails for a structural reason, not a willpower one: "every surface" has no
 * denominator, so no plan can ever be *finished*, and an unfinishable plan is
 * indistinguishable from an abandoned one.
 *
 * This file supplies the denominator. 1,327 pages are not 1,327 designs — they
 * are 15 templates rendered many times. Build 15 specimens and the site is
 * covered, provably, with a number that closes.
 *
 * The manifest is also the retirement instrument. Two of the fifteen archetypes
 * account for 436 pages (definition-card 342 + menu-design-showcase 94) that a
 * cost-intelligence company has no reason to render, and one (yield-table, 236)
 * duplicates another archetype's slug 90 times. You cannot see that from a page
 * list. You can only see it from a template list with counts attached.
 *
 * ASSIGNMENT IS EXCLUSIVE AND TOTAL
 *
 * RULES is an ordered list; first match wins; the last rule is a catch-all that
 * is expected to capture zero pages. `summary.unassigned` MUST be 0 and
 * `summary.assigned` MUST equal `summary.pages`. If a new page tree appears and
 * lands in `A99-unclassified`, that is the finding — a page nobody can name the
 * template for is a page nobody is maintaining.
 *
 * WHAT EACH ARCHETYPE RECORDS
 *
 *   rule          the route predicate, in prose, that assigns membership
 *   producedBy    the script that emits it, or "hand-authored", or — the
 *                 dangerous third state — "committed, no live generator"
 *   verdict       survives | absorbs | merges | becomes | retires
 *                 A STRUCTURAL call, never a styling note.
 *   forcedBy      the measured counts that make the verdict non-optional
 *
 * NOT WIRED, ON PURPOSE — same reasoning as build-surface-disposition.mjs:
 *   - not named check-*.mjs, so check-gate-coverage.mjs does not claim it
 *   - NOT registered as an "(idem)" builder in check-all.mjs, so
 *     check-idem-coverage.mjs does not demand a healer nothing re-runs
 *   - reads three generated inventories, writes one file. Re-run after
 *     data/surface-inventory.json is rebuilt.
 *
 * Usage:
 *   node scripts/build-surface-archetypes.mjs            # write data/surface-archetypes.json
 *   node scripts/build-surface-archetypes.mjs --check    # exit 1 if the file would change
 *   node scripts/build-surface-archetypes.mjs --report   # print the coverage table
 *   node scripts/build-surface-archetypes.mjs --verdicts # print the structural calls
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const OUT = path.join(REPO, 'data', 'surface-archetypes.json');

const read = (p) => JSON.parse(fs.readFileSync(path.join(REPO, p), 'utf8'));

// ─────────────────────────────────────────────────────────────────────────────
// Route helpers. Every rule is written against the LOCALE-STRIPPED route so an
// archetype spans EN and ES by construction — a Spanish mirror is the same
// template, and treating it as its own archetype would double the specimen
// count for zero design decisions.
// ─────────────────────────────────────────────────────────────────────────────

const strip = (r) => (r.startsWith('/es/') ? r.slice(3) : r === '/es/' ? '/' : r);

// /cost-index/<seg>/ segments that are apparatus, not an ingredient reading.
const CI_APPARATUS = new Set(['basket', 'lab', 'menu-pricing', 'methodology', 'sources', 'weekly', 'events']);

// data/ingredient-yields.json carries one row per ingredient; every OTHER
// directory under /library/ingredient-yields/ is a category collection page.
const YIELD_INGREDIENTS = new Set(read('data/ingredient-yields.json').map((r) => r.slug));

// ─────────────────────────────────────────────────────────────────────────────
// THE RULES — ordered, first match wins.
// ─────────────────────────────────────────────────────────────────────────────

const RULES = [
  {
    id: 'harness',
    order: 'A01',
    name: 'Operator harness',
    rule: 'route is under /admin/ or /brand/ — an operator render surface, noindex by design',
    test: (p, r) => /^\/(admin|brand)\//.test(r),
  },
  {
    id: 'app-surface',
    order: 'A02',
    name: 'Product app surface',
    rule: 'surfaceClass === "product" — a storefront stub that hands off to app.muntin.digital',
    test: (p) => p.surfaceClass === 'product',
  },
  {
    id: 'institutional-record',
    order: 'A03',
    name: 'Institutional record',
    rule: 'surfaceClass === "trust" — the standing statements a reviewer checks (methods, claims, receipts, security, status, changelog, legal)',
    test: (p) => p.surfaceClass === 'trust',
  },
  {
    id: 'instrument-record',
    order: 'A04',
    name: 'Market-event record',
    rule: 'route matches /cost-index/events/<slug>/ — one dated, cited historical market event',
    test: (p, r) => /^\/cost-index\/events\/[^/]+\/$/.test(r),
  },
  {
    id: 'instrument-reading',
    order: 'A05',
    name: 'Ingredient reading',
    rule: 'route matches /cost-index/<slug>/ where <slug> is not apparatus — one ingredient measured against its own baseline window',
    test: (p, r) => {
      const m = /^\/cost-index\/([^/]+)\/$/.exec(r);
      return !!m && !CI_APPARATUS.has(m[1]);
    },
  },
  {
    id: 'instrument-apparatus',
    order: 'A06',
    name: 'Instrument apparatus',
    rule: 'any remaining /cost-index/ route — the hub, basket, methodology, sources, weekly archive, pressure lab, events hub, embeds',
    test: (p, r) => r.startsWith('/cost-index/') || r === '/cost-index/',
  },
  {
    id: 'open-dataset',
    order: 'A07',
    name: 'Open dataset explorer',
    rule: 'route is under /open/ — a public-domain source series published as a browsable, downloadable dataset',
    test: (p, r) => r === '/open/' || r.startsWith('/open/'),
  },
  {
    id: 'yield-table',
    order: 'A08',
    name: 'Ingredient yield table',
    rule: '/library/ingredient-yields/<slug>/ where <slug> is a row in data/ingredient-yields.json',
    test: (p, r) => {
      const m = /^\/library\/ingredient-yields\/([^/]+)\/$/.exec(r);
      return !!m && YIELD_INGREDIENTS.has(m[1]);
    },
  },
  {
    id: 'menu-design-showcase',
    order: 'A09',
    name: 'Menu-design showcase',
    rule: '/library/menu-design-themes/<slug>/ or /library/menu-design-cuisines/<slug>/ — a rendered menu specimen or a cuisine landing for the retired design line',
    test: (p, r) => /^\/library\/menu-design-(themes|cuisines)\/[^/]+\/$/.test(r),
  },
  {
    id: 'definition-card',
    order: 'A10',
    name: 'Definition card',
    rule: '/glossary/<term>/ — one page per term',
    test: (p, r) => /^\/glossary\/[^/]+\/$/.test(r),
  },
  {
    id: 'worksheet',
    order: 'A11',
    name: 'Operator worksheet',
    rule: 'surfaceClass === "sheet" below the index, or a /learn/checklists/ leaf — a downloadable form the operator fills in by hand',
    test: (p, r) =>
      (p.surfaceClass === 'sheet' && r !== '/sheets/') || /^\/learn\/checklists\/[^/]+\/$/.test(r),
  },
  {
    id: 'calculator',
    order: 'A12',
    name: 'Interactive calculator',
    rule: '/tools/<slug>/ — client-side arithmetic the reader runs on their own numbers',
    test: (p, r) => /^\/tools\/[^/]+\/$/.test(r),
  },
  {
    id: 'essay',
    order: 'A13',
    name: 'Long-form essay',
    rule: 'a hand-written article: /library/<slug>/, /blog/<slug>/, /learn/research/<slug>/, /learn/topics/<topic>/<slug>/',
    test: (p, r) =>
      (/^\/library\/[^/]+\/$/.test(r) &&
        !/^\/library\/(ingredient-yields|menu-design-themes|menu-design-cuisines)\/$/.test(r)) ||
      /^\/blog\/[^/]+\/$/.test(r) ||
      /^\/learn\/research\/[^/]+\/$/.test(r) ||
      /^\/learn\/topics\/[^/]+\/[^/]+\/$/.test(r),
  },
  {
    id: 'pitch',
    order: 'A14',
    name: 'Positioning page',
    rule: 'surfaceClass === "marketing", or /learn/start-here/ — a page whose only job is to say what the company is',
    test: (p, r) => p.surfaceClass === 'marketing' || r === '/learn/start-here/',
  },
  {
    id: 'collection-index',
    order: 'A15',
    name: 'Collection index',
    rule: 'a page whose body is a list of other pages: every corpus hub (/library/, /glossary/, /blog/, /sheets/, /tools/, /learn/), the nine /learn/topics/ hubs, the yield category pages, the yield/theme/cuisine hubs',
    test: (p, r) =>
      /^\/(library|glossary|blog|sheets|tools|learn)\/$/.test(r) ||
      /^\/learn\/(topics|research|checklists)\/$/.test(r) ||
      /^\/learn\/topics\/[^/]+\/$/.test(r) ||
      /^\/library\/(ingredient-yields|menu-design-themes|menu-design-cuisines)\/$/.test(r) ||
      /^\/library\/ingredient-yields\/[^/]+\/$/.test(r),
  },
  {
    id: 'unclassified',
    order: 'A99',
    name: 'UNCLASSIFIED — a page no template claims',
    rule: 'catch-all. Expected count: 0. Any member is the finding.',
    test: () => true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION + STRUCTURAL VERDICTS.
//
// `producedBy` is measured against scripts/ by reading, not guessed. The third
// state — "committed, no live generator" — is the one that matters: those pages
// cannot be restyled by editing a template, because there is no template.
// ─────────────────────────────────────────────────────────────────────────────

const META = {
  harness: {
    producedBy: 'hand-authored',
    producedByKind: 'hand',
    verdict: 'retires',
    becomes: 'leaves the public route tree entirely; /admin/submissions/ goes with the lane it served',
    forcedBy:
      '6 pages, 6 orphans, 0 indexable, 117 median words. /admin/submissions/ serves the operator-submitter data lane that ADR-031 forecloses forever, so it is a route maintained for a decision already reversed.',
  },
  'app-surface': {
    producedBy: 'hand-authored',
    producedByKind: 'hand',
    verdict: 'survives',
    becomes:
      'the seam between storefront and product; unchanged in shape, but /ledger/demo/ becomes the specimen close rather than a feature tour',
    forcedBy:
      '12 pages, 239 median words, only 6 of 12 indexable, and 396 of the site\'s CTA targets already point at ledger.muntin.digital. The handoff is load-bearing and thin.',
  },
  'institutional-record': {
    producedBy: 'hand-authored + inject-* stamps',
    producedByKind: 'hand',
    verdict: 'survives',
    becomes:
      'promoted from footer legal to the primary surface. Under the closing-asset doctrine this archetype IS the product demo for the reviewer who signs off.',
    forcedBy:
      '26 pages, 25 of 26 carrying analytics — the highest instrumentation rate on the site — median 6 inbound links and 971 words. It is measured and unlinked: an audit file nobody is routed to.',
  },
  'instrument-record': {
    producedBy: 'committed HTML; only inject-event-exposure.mjs touches it',
    producedByKind: 'no-generator',
    verdict: 'becomes',
    becomes:
      'a render target of cost-index/events.json emitted by build-cost-index-pages.mjs, at the same URLs, with the detail route reserved for events carrying a measured co-occurrence and the rest folding into the hub',
    forcedBy:
      '78 pages; 78 of 78 are orphans (zero internal inbound links); 0 carry a CTA; 0 carry a figure; 0 carry analytics. inject-event-exposure.mjs states in its own header that these pages "run AHEAD of the in-container build engine" and a rebuild "would regress them" — 78 indexable pages with no live generator and no reader path.',
  },
  'instrument-reading': {
    producedBy: 'scripts/build-cost-index-pages.mjs',
    producedByKind: 'generated',
    verdict: 'absorbs',
    becomes:
      'the atom of the company. One ingredient, one page, absorbing the yield table, the event records that touch it, and the seasonality band — the page a bookkeeper opens to check one line of the close.',
    forcedBy:
      '188 pages, median 73 inbound links and 79 outbound — the densest node class in the graph — 0 orphans, 0 retired-line hits, median 2 days since last commit (rebuilt daily), 162 of 188 already carrying a CTA. It is the only archetype that is simultaneously fresh, on-thesis and linked.',
  },
  'instrument-apparatus': {
    producedBy: 'scripts/build-cost-index-pages.mjs + build-cost-index-archive.mjs + build-cost-index-methodology.mjs',
    producedByKind: 'generated',
    verdict: 'absorbs',
    becomes:
      'one evidence spine that also absorbs open-dataset: methodology, sources, basket, corrections, weekly archive and the 18 open datasets are the same claim ("here is what we measured and how") rendered by two unrelated builders today',
    forcedBy:
      '20 apparatus pages + 20 open-dataset pages = 40 routes carrying the credibility argument, of which 13 open-data pages are orphans and 0 of the 40 carry a CTA. The doctrine says credibility is a CLOSING asset; 40 unlinked pages cannot close anything.',
  },
  'open-dataset': {
    producedBy: 'scripts/build-open-{demand,labor,recalls}-page.mjs + build-*-open-data.mjs family',
    producedByKind: 'generated',
    verdict: 'merges',
    becomes: 'merged into instrument-apparatus as the "sources" leg — same template, same job',
    forcedBy:
      '20 pages, 18 EN / 2 ES — the worst locale asymmetry on the site — 13 of 20 orphaned, 0 CTA, 0 analytics, median 1,163 words. Real data, published into a room with no door.',
  },
  'yield-table': {
    producedBy: 'scripts/build-ingredient-yield-pages.mjs',
    producedByKind: 'generated',
    verdict: 'merges',
    becomes:
      'a section inside instrument-reading. Yield % is an input to plate cost, not a separate subject; the 28 yield-only slugs become rows on the yields collection page until they earn a reading.',
    forcedBy:
      '236 pages, 118 EN ingredients — and 90 of those 118 slugs ALREADY have a page at /cost-index/<same-slug>/. Two URLs about tomato is not a corpus, it is a fork. Median 510 words, 0 figures, 0 analytics, median 9 inbound vs the reading page\'s 73.',
  },
  'menu-design-showcase': {
    producedBy: 'scripts/build-theme-story-pages.mjs + build-cuisine-landing-pages.mjs',
    producedByKind: 'generated',
    verdict: 'retires',
    becomes: 'nothing. 301 to /cost-index/.',
    forcedBy:
      '94 pages serving the retired web-design line. Median 235 words (themes) and 190 (cuisines), median 2 inbound links, 0 figures, 0 analytics on any of the 94. The Menu Design Suite tool they market was itself retired in 2026-06.',
  },
  'definition-card': {
    producedBy: 'hand-authored shells + 17 inject-glossary-*.mjs injectors',
    producedByKind: 'hand+injected',
    verdict: 'retires',
    becomes:
      'not a page type. ~60 cost terms become entries on one glossary page plus the autolink popover that inject-glossary-autolinks.mjs already renders inline; the rest go.',
    forcedBy:
      '342 pages — 26% of the entire site — with 0 of 342 carrying an in-content CTA, 0 carrying analytics, 0 carrying a figure, median 469 words. 133 score >=3 on retired-line vocabulary and only 98 of 171 EN terms are still indexable. 53 of 171 EN terms sit in the retired-web-SEO cluster and 51 more in "other". A definition is a tooltip, and this site already ships the tooltip.',
  },
  worksheet: {
    producedBy: 'scripts/build-sheet-pages.mjs',
    producedByKind: 'generated',
    verdict: 'becomes',
    becomes:
      'the manual half of the close. Keep the ~6 that feed Beginning + Purchases - Ending = Usage (count sheet, recipe cost card, prime cost, monthly P&L); every worksheet that duplicates something Muntin Ledger now computes stops being published.',
    forcedBy:
      '82 pages, 18 of 39 EN sheets off-thesis by measurement (brand-asset-inventory, gbp-monthly-audit, local-keyword-map, nap-consistency-tracker, photo-shot-list, social-content-calendar...), 14 orphans, only 44 of 80 indexable, median 2 inbound links. A worksheet is a pre-product; the product shipped.',
  },
  calculator: {
    producedBy: 'hand-authored + inject-tool-*.mjs rails',
    producedByKind: 'hand+injected',
    verdict: 'becomes',
    becomes:
      'the qualification instrument. Each calculator runs the SAME arithmetic the closed month runs, on the reader\'s numbers, and ends by naming what it could not stand behind — a preview of the deliverable rather than a free giveaway.',
    forcedBy:
      '16 pages with median 37 inbound links — the highest of any archetype except the ingredient reading — 12 of 16 instrumented, 10 of 16 carrying a CTA, and the only interactive surface on the site. Highest leverage per page and the smallest count.',
  },
  essay: {
    producedBy: 'hand-authored + scripts/build-library.mjs (autolinks, rails, graphics)',
    producedByKind: 'hand+injected',
    verdict: 'becomes',
    becomes:
      'the worked example. One essay per recurring exception in a real close — not a topic, an incident: what the invoice said, what the count said, what we withheld and why. Cut to the ~18 EN library essays and ~11 EN dispatches that are on-thesis.',
    forcedBy:
      '123 pages and the highest craft on the site (median 3,742 words, 3 figures for library essays) pointed largely at the retired line: only 18 of 37 EN library essays are on-thesis, only 16 of 37 still indexable, 54 of 80 score >=3 on retired-line vocabulary. This archetype is where the design investment already exists and where the subject is most wrong.',
  },
  pitch: {
    producedBy: 'hand-authored',
    producedByKind: 'hand',
    verdict: 'becomes',
    becomes:
      'one page that states the offer and shows the specimen close, plus /about/. /never/ and /studio/ are residue of the retired services line and stop being pitches.',
    forcedBy:
      '14 pages for a company with one price and ~40 customers ever. 4 pages on the entire site carry a waitlist form; the home page is one of them. 3 of 14 score >=3 on retired-line vocabulary.',
  },
  'collection-index': {
    producedBy: 'mixed: build-library.mjs, build-sheets-index.mjs, build-tools-index.mjs, build-blog-index.mjs, build-ingredient-yield-pages.mjs',
    producedByKind: 'generated',
    verdict: 'survives',
    becomes:
      'one template, five instances instead of thirty-six. When yield-table merges, definition-card retires and menu-design-showcase goes, 19 of the 36 EN collection pages lose their corpus and go with it.',
    forcedBy:
      '72 pages whose entire body is a list of children — 36 EN, of which 15 are yield category pages and 9 are /learn/topics/ hubs for a taxonomy where ADR-026 records that 6 of 9 topics name the retired line. A collection page cannot survive its collection.',
  },
  unclassified: {
    producedBy: 'n/a',
    producedByKind: 'n/a',
    verdict: 'n/a',
    becomes: 'n/a',
    forcedBy: 'expected empty',
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const median = (nums) => {
  if (!nums.length) return null;
  const s = nums.slice().sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

function build() {
  const inv = read('data/surface-inventory.json');
  const intent = read('data/content-intent.json');
  const graph = read('data/link-graph.json');
  const disp = read('data/surface-disposition.json');

  const byRouteIntent = new Map(intent.pages.map((p) => [p.route, p]));
  const byRouteGraph = new Map(graph.nodes.map((n) => [n.route, n]));
  const byRouteDisp = new Map(disp.pages.map((p) => [p.route, p]));

  const members = new Map(RULES.map((r) => [r.id, []]));
  const assignment = [];

  for (const p of inv.pages) {
    const r = strip(p.route);
    const hit = RULES.find((rule) => rule.test(p, r)) || RULES[RULES.length - 1];
    members.get(hit.id).push(p);
    assignment.push({ route: p.route, archetype: hit.id });
  }

  const archetypes = RULES.map((rule) => {
    const g = members.get(rule.id);
    const en = g.filter((p) => p.lang === 'en');
    const es = g.filter((p) => p.lang === 'es');
    const meta = META[rule.id] || {};

    const intents = {};
    const clusters = {};
    const dispositions = {};
    let onThesis = 0;
    for (const p of g) {
      const ip = byRouteIntent.get(p.route);
      if (ip) {
        intents[ip.primaryIntent] = (intents[ip.primaryIntent] || 0) + 1;
        clusters[ip.topicCluster] = (clusters[ip.topicCluster] || 0) + 1;
        if (ip.onThesis) onThesis++;
      }
      const dp = byRouteDisp.get(p.route);
      if (dp) dispositions[dp.disposition] = (dispositions[dp.disposition] || 0) + 1;
    }

    const depths = g
      .map((p) => (byRouteGraph.get(p.route) || {}).clickDepthFromHomeRendered)
      .filter((d) => typeof d === 'number');

    return {
      id: rule.id,
      order: rule.order,
      name: rule.name,
      rule: rule.rule,
      members: g.length,
      share: g.length ? Number(((g.length / inv.pages.length) * 100).toFixed(1)) : 0,
      langSplit: { en: en.length, es: es.length },
      exemplars: en.slice(0, 4).map((p) => p.route),
      producedBy: meta.producedBy || null,
      producedByKind: meta.producedByKind || null,
      structure: {
        medianInboundLinks: median(g.map((p) => p.inboundInternalLinks || 0)),
        medianOutboundLinks: median(g.map((p) => p.outboundInternalLinks || 0)),
        orphans: g.filter((p) => p.isOrphan).length,
        orphanRate: g.length ? Number(((g.filter((p) => p.isOrphan).length / g.length) * 100).toFixed(1)) : 0,
        medianClickDepthFromHome: median(depths),
        indexable: g.filter((p) => p.indexable).length,
        withCta: g.filter((p) => (p.ctaTargets || []).length > 0).length,
        withAnalytics: g.filter((p) => p.hasAnalytics).length,
        withWaitlistForm: g.filter((p) => p.hasWaitlistForm).length,
        withAudio: g.filter((p) => p.hasAudio).length,
        medianRetiredLineScore: median(g.map((p) => p.retiredLineScore || 0)),
        retiredLineOverThreshold3: g.filter((p) => (p.retiredLineScore || 0) >= 3).length,
        medianWordCount: median(g.map((p) => p.wordCount || 0)),
        medianFigures: median(g.map((p) => p.figureCount || 0)),
        medianAgeDays: median(g.map((p) => (p.lastCommitDaysAgo == null ? 9999 : p.lastCommitDaysAgo))),
      },
      intent: { onThesis, byPrimaryIntent: intents, byTopicCluster: clusters },
      currentDisposition: dispositions,
      verdict: meta.verdict || null,
      becomes: meta.becomes || null,
      forcedBy: meta.forcedBy || null,
    };
  }).filter((a) => a.id !== 'unclassified' || a.members > 0);

  const assigned = archetypes.reduce((n, a) => n + a.members, 0);
  const unclassified = (members.get('unclassified') || []).length;

  const byVerdict = {};
  for (const a of archetypes) {
    if (!a.verdict) continue;
    byVerdict[a.verdict] = (byVerdict[a.verdict] || 0) + a.members;
  }

  return {
    _doc:
      'Every routable page belongs to exactly one archetype. The archetype is the design unit: build one specimen per surviving archetype and the site is covered, provably.',
    _asOf: inv._asOf,
    _asOfBasis: inv._asOfBasis,
    _generator: 'scripts/build-surface-archetypes.mjs',
    _inputs: [
      'data/surface-inventory.json',
      'data/content-intent.json',
      'data/link-graph.json',
      'data/surface-disposition.json',
      'data/ingredient-yields.json',
    ],
    _verdicts: {
      survives: 'the template is right; the specimen redesigns it',
      absorbs: 'survives AND takes over another archetype\'s job',
      merges: 'stops being its own template; its pages re-render under another archetype',
      becomes: 'the URL survives but the UNIT changes — a different thing lives at that route',
      retires: 'stops existing; 301 to the funnel',
    },
    summary: {
      pages: inv.pages.length,
      archetypes: archetypes.filter((a) => a.id !== 'unclassified').length,
      assigned,
      unassigned: inv.pages.length - assigned,
      unclassified,
      coverageProven: assigned === inv.pages.length && unclassified === 0,
      pagesByVerdict: byVerdict,
      specimensToBuild: archetypes.filter((a) => ['survives', 'absorbs', 'becomes'].includes(a.verdict)).length,
      pagesRetiredOrMerged: archetypes
        .filter((a) => ['retires', 'merges'].includes(a.verdict))
        .reduce((n, a) => n + a.members, 0),
    },
    archetypes,
    assignment,
  };
}

function main() {
  const argv = process.argv.slice(2);
  const doc = build();
  const text = JSON.stringify(doc, null, 1) + '\n';

  if (argv.includes('--report')) {
    console.log(`surface-archetypes — ${doc.summary.pages} pages in ${doc.summary.archetypes} archetypes, asOf ${doc._asOf}`);
    console.log(
      `coverage: ${doc.summary.assigned}/${doc.summary.pages} assigned · unclassified ${doc.summary.unclassified} · proven ${doc.summary.coverageProven}\n`,
    );
    const h = ['id', 'n', 'en/es', 'inb', 'orph%', 'idx', 'cta', 'anlt', 'rl>=3', 'words', 'age', 'verdict'];
    console.log(h[0].padEnd(22) + h.slice(1).map((x) => x.padStart(8)).join(''));
    for (const a of doc.archetypes) {
      const s = a.structure;
      console.log(
        a.id.padEnd(22) +
          [
            String(a.members),
            `${a.langSplit.en}/${a.langSplit.es}`,
            String(s.medianInboundLinks),
            String(s.orphanRate),
            String(s.indexable),
            String(s.withCta),
            String(s.withAnalytics),
            String(s.retiredLineOverThreshold3),
            String(s.medianWordCount),
            String(s.medianAgeDays),
            String(a.verdict),
          ]
            .map((x) => x.padStart(8))
            .join(''),
      );
    }
    console.log('\npages by verdict:');
    for (const [k, v] of Object.entries(doc.summary.pagesByVerdict)) console.log(`  ${k.padEnd(10)} ${v}`);
    console.log(`\nspecimens to build: ${doc.summary.specimensToBuild}`);
    console.log(`pages retired or merged away: ${doc.summary.pagesRetiredOrMerged}`);
    return;
  }

  if (argv.includes('--verdicts')) {
    for (const a of doc.archetypes) {
      console.log(`\n${a.order} ${a.id} — ${a.members} pages (${a.langSplit.en} EN / ${a.langSplit.es} ES)`);
      console.log(`  produced by : ${a.producedBy}`);
      console.log(`  VERDICT     : ${a.verdict}`);
      console.log(`  becomes     : ${a.becomes}`);
      console.log(`  forced by   : ${a.forcedBy}`);
    }
    return;
  }

  if (argv.includes('--check')) {
    const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
    if (prev !== text) {
      console.error('✗ data/surface-archetypes.json is stale — run: node scripts/build-surface-archetypes.mjs');
      process.exit(1);
    }
    console.log('✓ surface-archetypes (idempotent)');
    return;
  }

  if (!doc.summary.coverageProven) {
    console.error(
      `✗ coverage NOT proven: ${doc.summary.assigned}/${doc.summary.pages} assigned, ${doc.summary.unclassified} unclassified`,
    );
  }
  fs.writeFileSync(OUT, text);
  console.log(
    `✓ wrote data/surface-archetypes.json — ${doc.summary.pages} pages in ${doc.summary.archetypes} archetypes, ${doc.summary.specimensToBuild} specimens to build, ${doc.summary.pagesRetiredOrMerged} pages retired or merged`,
  );
}

if (process.argv[1] === __filename) main();
