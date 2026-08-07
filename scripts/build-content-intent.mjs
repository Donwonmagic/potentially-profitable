#!/usr/bin/env node
/**
 * build-content-intent.mjs — what every page is FOR. One classified record per route.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * scripts/build-surface-inventory.mjs answers "what is on this site". It does not
 * answer "what is this page FOR", and a page inventory without intent is a file
 * listing. The storefront's stated job in the run-up to the first product release is
 * to BRING TRAFFIC and BUILD CONFIDENCE, so every page either does one of those,
 * does something else the company still needs (proof, product, operator tooling),
 * or does nothing. This manifest says which, for all 1,327 routes, from measurable
 * signals only.
 *
 * The 2026-08-07 company audit measured why the sixteen prose planning documents in
 * docs/handoff/ never landed: prior audits close at 26%, and no closure in company
 * history came from anyone working a document's list. This repo's working
 * architecture is manifest -> injector -> gate. So the classification is DATA, and
 * the rules that produce it live in this header where a human can audit and tune
 * them — never an LLM judgement frozen into a JSON file nobody can re-derive.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INPUTS
 *
 *   data/surface-inventory.json  REQUIRED. The measured Surface BOM. Every
 *                                structural fact used below (indexable, inSitemap,
 *                                wordCount, figureCount, jsonLdTypes, inbound links,
 *                                ctaTargets, retiredLineByCategory, dateModified,
 *                                surfaceClass) is read from there, never re-derived,
 *                                so the two manifests cannot disagree.
 *   the page HTML on disk        Read again for the two signals the BOM does not
 *                                carry: topic-lexicon hits on the chrome-stripped
 *                                body, and interactive-tool detection.
 *   scripts/check-positioning-drift.mjs  RETIRED_VOCAB + ALLOW + prose + countRetired,
 *                                imported so the retired-line cluster and the gate
 *                                share one vocabulary by construction.
 *
 * STALENESS IS AN ERROR, NOT A GAP. The script re-walks the repo with the BOM's own
 * walkHtml and fails if disk and inventory disagree. A stale inventory would silently
 * classify a subset of the site — the exact failure mode CLAUDE.md's "a scanner is
 * only as good as its root list" lesson was written about. The root list itself is
 * the BOM's SKIP_TOP, echoed into the output as `_skippedRoots` with its reasons.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE RULES. All four fields are rule-based, ordered, first-match-wins, and every
 * record carries the `reasons` that fired, so any verdict can be traced to a signal.
 *
 * (1) primaryIntent — the job this page does for a traffic-and-confidence storefront.
 *
 *   dead      Cannot serve traffic OR confidence. Any of:
 *             • the route is shadowed by a 301 in _redirects (something else answers it)
 *             • surfaceClass 'legacy' (blog/drafts — never published)
 *             • surfaceClass 'admin' (operator render harnesses, noindex by design)
 *             • noindex AND no inbound editorial link even through a redirect
 *               (no crawler sees it, no reader can reach it)
 *             • noindex AND its topic cluster is retired-web-SEO (frozen off-thesis)
 *   convert   Asks for the product, the account, or the waitlist as its main act:
 *             surfaceClass 'product', OR a waitlist form in the body, OR a
 *             marketing-class page carrying at least one CTA target.
 *   trust     Proves the company is real and honest: surfaceClass 'trust'
 *             (methods/claims/receipts/security/status/changelog/system/legal/404),
 *             or surfaceRoot about|studio. Checked BEFORE the marketing-CTA half of
 *             convert — /about/ and /studio/ carry the same CTA every page does, and
 *             on a confidence storefront they ARE the confidence.
 *   acquire   An indexable ENTRY POINT a stranger can land on and immediately use or
 *             be routed by: an interactive calculator, or a hub (see isHub below).
 *   reference A LOOKUP surface: DefinedTerm JSON-LD, or surfaceClass glossary|sheet,
 *             or a non-hub cost-index data page. Short, structured, one question.
 *   educate   LONG-FORM prose: Article/BlogPosting/HowTo JSON-LD, or >= 400 words.
 *   (fallback) under 400 words -> reference, else educate. Nothing is unclassified.
 *
 *   Precedence is dead > convert > trust > acquire > reference > educate. It is a
 *   precedence, not a ranking: a glossary term that also happens to be long-form is
 *   filed as reference because lookup is the job it is built to do.
 *
 * (2) topicCluster — scored, highest wins, ties broken by the documented CLUSTER_ORDER.
 *
 *   Score = 8 x hits in the ROUTE + 5 x hits in TITLE+H1+META + 1 x hits in the
 *   chrome-stripped BODY. Chrome is stripped for the same reason the BOM strips it:
 *   the nav and footer ride ~1,300 pages, so counting them makes every page look
 *   like every other page.
 *
 *   retired-web-SEO takes its BODY score straight from the BOM's measured
 *   retiredLineByCategory (webBuild + seo + localGbp + brandDesign) rather than
 *   re-scanning, so it can never drift from the positioning gate. Its route/title
 *   score uses RETIRED_VOCAB imported from that gate. NO retired-line phrase list is
 *   duplicated in this file — duplication is how two scanners start disagreeing.
 *
 *   company/trust is assigned structurally (surfaceClass trust, or about|studio|
 *   home|marketing with no stronger topical signal), because a legal page is about
 *   the company no matter what nouns it contains.
 *
 *   A page whose top score is 0 is 'other'. That is a real answer, not a failure.
 *
 * (3) searchIntentGuess — navigational > commercial > informational.
 *
 *   navigational  hubs, trust, product, admin, legal — someone typing the brand or
 *                 looking for a known destination.
 *   commercial    a calculator/worksheet on the page, or COMMERCIAL_CUES in the
 *                 title/h1 ("vs", "best", "pricing", "how much", "worth it",
 *                 "alternatives", "review", "software", "calculator", ES equivalents).
 *   informational everything else. This is the honest default for a reference and
 *                 education corpus, and it is ~most of the site.
 *
 *   "Guess" is in the field name on purpose. Nothing here observes a real query; it
 *   reads the page's own framing. Real intent needs search-console data the container
 *   does not have.
 *
 * (4) keepVerdict — elevate | keep | merge | freeze | retire, first match wins.
 *
 *   retire   Shadowed by a 301, or an unpublished draft, or (frozen AND unlinked AND
 *            off-thesis) — nothing reaches it and nothing should.
 *   keep     surfaceClass admin — operator tooling, noindex by design, not content.
 *   freeze   INDEXED and its cluster is retired-web-SEO and the positioning gate does
 *            not allow it. This is that gate's own remedy, restated per page. Split in
 *            the rollup into gateVisible (webBuild >= 3, the gate can see it) and
 *            gateBlind (the gate cannot — it only reads the website-build vocabulary,
 *            so an SEO/GBP/brand-design page is invisible to it).
 *   merge    INDEXED, under MERGE_WORDS words, and <= MERGE_INBOUND inbound editorial
 *            links: too thin to earn a ranking of its own and barely referenced, so
 *            its value is higher folded into a parent than standing alone.
 *   elevate  INDEXED, on-thesis, and valueScore >= ELEVATE_AT. The flagships.
 *   keep     Everything else. The default is deliberately "keep": this script
 *            recommends, and freeze-don't-delete is the house doctrine.
 *
 * (5) valueScore — 0-100, every component measured and reported per page, so a
 *     flagship list can be argued with rather than believed.
 *
 *     reach      <= 25   6 * log2(1 + inboundInternalLinks)
 *     depth      <= 15   wordCount / 200
 *     craft      <= 10   figureCount * 2.5
 *     media      <=  5   hasAudio
 *     utility    <= 15   calculator 15, worksheet 8, widget 4, else 0
 *     thesis     <= 15   on-thesis cluster 15, company/trust 5, else 0
 *     funnel     <=  8   at least one in-content CTA target
 *     freshness  <=  7   dateModified <=90d 7, <=180d 4, <=365d 2, else 0
 *
 *     A noindex page scores 0 outright. A page crawlers are told to ignore cannot be
 *     a flagship for a storefront whose job is traffic, however good it is.
 *
 * FLAGSHIPS. Top FLAGSHIP_N by valueScore after EN/ES pair de-duplication (the BOM's
 * hreflang counterpart), keeping the higher-scoring side. Without that step the list
 * is fifteen articles printed twice.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Output: data/content-intent.json
 *
 *   node scripts/build-content-intent.mjs             # write the manifest
 *   node scripts/build-content-intent.mjs --check     # rebuild & diff (exit 1 on drift)
 *   node scripts/build-content-intent.mjs --self-test # unit-test the pure rules
 *   node scripts/build-content-intent.mjs --report    # print the rollups to stdout
 *   node scripts/build-content-intent.mjs --report --dry-run   # report, write nothing
 *
 * NOT WIRED into check-all.mjs, for the same reason build-surface-inventory.mjs is
 * not: it is derived from HTML that changes on nearly every commit, so a --check here
 * would red the deploy until someone reran it. It is a measuring instrument. The day
 * anyone wires it, it belongs in check-idem-coverage's MANUAL registry with who
 * reruns it and when it drifts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { RETIRED_VOCAB, countRetired, prose, allowKeyFor } from './check-positioning-drift.mjs';
import { stripChrome, allLinks, resolveTarget, walkHtml } from './build-surface-inventory.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const INVENTORY = path.join(REPO, 'data', 'surface-inventory.json');
const OUT = path.join(REPO, 'data', 'content-intent.json');

/* ------------------------------------------------------------------ thresholds */

/** Tuned against the measured distribution 2026-08-07; every one is stated in the header. */
const MERGE_WORDS = 300;      // below this a page cannot carry a topic on its own
const MERGE_INBOUND = 2;      // and at or below this it is not carrying the graph either
const ELEVATE_AT = 70;        // see the ELEVATE_AT note in the header; ~top 4% of the corpus
const FLAGSHIP_N = 30;
const HUB_OUTBOUND = 20;      // a page linking out this much, this briefly, is routing traffic
const HUB_WORDS = 1200;
const HUB_CHILDREN = 5;       // a directory index parenting this many routes is a hub

/**
 * A cluster must score at least this much to be CLAIMED. Set to 3 to match the
 * positioning gate's own threshold — below three phrase hits a topic is a mention,
 * not a subject. Without a floor, /es/glossary/aspect-ratio/ was filed as
 * retired-web-SEO on a score of 2 purely because every other cluster scored 0, and
 * ~50 pages were assigned a topic by a single passing word.
 */
const CLAIM_FLOOR = 3;

/**
 * The retired-web-SEO cluster is held to a HIGHER bar than the others, on purpose,
 * because the two errors do not cost the same: filing an on-thesis page as
 * retired-line produces a `freeze` recommendation, which removes a good page from the
 * index; filing a retired page as on-thesis produces a `keep`, which the positioning
 * gate and a human still catch. Asymmetric cost, asymmetric rule. It must:
 *
 *   (a) beat the best topical cluster by RETIRED_MARGIN, and
 *   (b) clear RETIRED_DENSITY hits per 1,000 body words.
 *
 * (b) exists because raw counts scale with length. /library/third-party-delivery-
 * economics/ is 4,531 words about delivery commissions that names "Google Business
 * Profile" eight times in one section — 1.8 hits per 1,000 words, and it beat its own
 * topical score on volume alone. /glossary/map-pack/ is 33 hits in a few hundred
 * words. Only one of those two is a retired-line page.
 *
 * Every page these two rules demote is listed in the output as
 * `summary.positioningCrossCheck.retiredDemoted`, with both numbers. Nothing is
 * dropped silently — a suppression you cannot see is worse than no suppression.
 */
const RETIRED_MARGIN = 3;
const RETIRED_DENSITY = 3.0;

/* ------------------------------------------------------- functional noindex routes */

/**
 * Pages that are noindex AND carry no inbound editorial link, and are nonetheless
 * doing their job. Without this list the "noindex and unreachable" rule — which is
 * otherwise correct, and catches 16 genuinely stranded frozen sheets — files the 404
 * page and the Cost Index embed widgets as dead weight.
 *
 * Same discipline as the BOM's SKIP_TOP and the gate registries: an exemption exists
 * only with a stated reason. Anything not listed here is judged by the rule.
 */
const FUNCTIONAL_NOINDEX = [
  [/^\/(?:es\/)?404\.html$/, 'served by the edge on any unmatched path; it is reached by the server, never by a link, and noindex is correct for it'],
  [/\/embed\.html$/, 'an iframe widget embedded on OTHER sites; its inbound links are external by design and noindex is correct for an embed'],
];

/** The matching exemption's reason, or null. */
export function functionalNoindexReason(route) {
  for (const [re, why] of FUNCTIONAL_NOINDEX) if (re.test(route)) return why;
  return null;
}

/* -------------------------------------------------------------- topic lexicons */

/**
 * Phrase lexicons, EN + ES. Phrase-specific for the reason the positioning gate's
 * vocabulary is: a bare word like "cost" or "price" matches most of this corpus and
 * would separate nothing. Every phrase here is one whose presence says what the page
 * is ABOUT, not merely that the page mentions money.
 *
 * There is no retired-web-SEO list here on purpose — that cluster's body score is the
 * BOM's already-measured count and its route/title score uses the gate's exported
 * RETIRED_VOCAB. One vocabulary, one owner.
 */
const LEXICON = {
  'cost-intelligence': [
    'cost index', 'price index', 'wholesale price', 'wholesale prices', 'commodity price',
    'commodity prices', 'ingredient price', 'ingredient prices', 'price volatility',
    'price spike', 'price swing', 'market price', 'market prices', 'basket',
    'baseline window', 'deseasonalized', 'seasonality', 'usda', 'nass', 'bls', 'fred',
    'cpi', 'ppi', 'cold storage', 'crop condition', 'terminal market', 'futures',
    'commodity market', 'price forecast', 'cost pressure', 'open data', 'dataset',
    'índice de costos', 'precio mayorista', 'precios mayoristas', 'volatilidad',
    'precio de mercado', 'estacionalidad', 'materia prima',
  ],
  // NOT in this list, and the omissions are load-bearing:
  //   'ledger'      — the PRODUCT's name (Muntin Ledger). It rides the in-content
  //                   product rail on 220 library pages, so including it filed a
  //                   third-party-delivery essay as an invoice page. A brand name
  //                   measures where the CTA is, never what the page is about.
  //   'extraction'  — generic enough to hit data-methodology prose across the
  //                   Cost Index, which is a different cluster.
  invoices: [
    'invoice', 'invoices', 'vendor invoice', 'line item', 'line items', 'invoice line',
    'purchase order', 'receipt scan', 'ocr', 'accounts payable',
    'invoice decoder', 'paper invoice', 'invoice photo', 'bill from',
    'factura', 'facturas', 'línea de factura', 'orden de compra', 'cuentas por pagar',
  ],
  'inventory/food-cost': [
    'inventory count', 'inventory counts', 'take inventory', 'physical count',
    'par level', 'par levels', 'food cost percentage', 'food cost percent',
    'prime cost', 'theoretical usage', 'actual usage', 'variance', 'walk-in',
    'waste log', 'shrinkage', 'yield percentage', 'usable yield', 'shelf count',
    'beginning inventory', 'ending inventory', 'cost of goods', 'cogs',
    'inventario', 'conteo de inventario', 'costo de comida', 'merma', 'rendimiento',
    'costo primo', 'inventario inicial', 'inventario final',
  ],
  'menu-pricing': [
    'menu price', 'menu prices', 'menu pricing', 'menu engineering', 'plate cost',
    'plate costing', 'recipe cost', 'contribution margin', 'menu mix', 'price increase',
    'raise prices', 'portion size', 'portion cost', 'menu item', 'menu items',
    // 'markup' is deliberately absent: on this site it means schema markup at least
    // as often as price markup, and it filed structured-data articles as pricing.
    'price point', 'psychological pricing',
    'precio del menú', 'precios del menú', 'ingeniería de menú', 'costo del plato',
    'margen de contribución', 'subir precios', 'tamaño de porción',
  ],
  vendors: [
    'vendor', 'vendors', 'supplier', 'suppliers', 'distributor', 'distributors',
    'broadline', 'sysco', 'us foods', 'performance food group', 'vendor benchmark',
    'vendor price', 'vendor quote', 'delivery minimum', 'order guide', 'rebate',
    'purveyor', 'produce distributor',
    // Delivery marketplaces are filed here, not under invoices. A third party that
    // takes a cut of every order is a supplier relationship; the invoice is only the
    // paperwork. Before this, four of the site's strongest essays — the DoorDash and
    // Uber Eats economics pieces — were filed as invoice content.
    'doordash', 'uber eats', 'grubhub', 'third-party delivery', 'delivery app',
    'delivery apps', 'commission rate', 'aggregator', 'marketplace commission',
    'proveedor', 'proveedores', 'distribuidor', 'distribuidores', 'guía de pedidos',
    'aplicación de entrega', 'comisión de entrega',
  ],
};

/** Deterministic tie-break, most-specific first. */
const CLUSTER_ORDER = [
  'cost-intelligence', 'invoices', 'inventory/food-cost', 'menu-pricing',
  'vendors', 'retired-web-SEO', 'company/trust', 'other',
];

/** The clusters that ARE the company. Everything else is legacy, chrome, or noise. */
const ON_THESIS = new Set([
  'cost-intelligence', 'invoices', 'inventory/food-cost', 'menu-pricing', 'vendors',
]);

/**
 * Title/h1 phrases that mark a reader comparing, shopping or sizing a spend rather
 * than learning. EN + ES. "cost" alone is excluded — on this site it is the subject
 * of nearly every informational page and would make the whole corpus commercial.
 */
const COMMERCIAL_CUES = [
  ' vs ', ' vs. ', 'versus', 'best ', 'top 10', 'top 5', 'review', 'reviews',
  'pricing', 'price of', 'how much does', 'how much do', 'worth it', 'alternatives',
  'alternative to', 'compare', 'comparison', 'cheapest', 'software', 'calculator',
  'which ', 'should you buy', 'should i buy', 'buyer', 'free tool',
  'mejor ', 'mejores', 'precio de', 'cuánto cuesta', 'vale la pena', 'alternativas',
  'comparar', 'comparación', 'calculadora', 'reseña',
];

/* ---------------------------------------------------------------- pure helpers */

/** Route -> a lowercase phrase-matchable string ("/library/plate-cost/" -> " library plate cost "). */
export function routeWords(route) {
  return ` ${String(route).replace(/\.html$/, '').replace(/[/\-_]+/g, ' ').trim().toLowerCase()} `;
}

/** Case-insensitive phrase-hit count. Phrases with spaces are matched literally. */
export function hits(text, vocab) {
  return countRetired(text, vocab);
}

/**
 * What a reader can DO on this page, from the chrome-stripped body.
 *
 *   calculator  a NUMBER input, or a page-specific /tools/ script. The two shared
 *               chrome scripts (context-bus, tier-filter) are excluded: they ride the
 *               tools HUB, which routes rather than computes. One number input is
 *               enough — the 165 /library/ingredient-yields/<item>/ pages each carry a
 *               single-field yield calculator and they are the real thing.
 *   worksheet   three or more checkbox/text/date inputs — a printable operator sheet
 *               or a checklist, which is a thing to work through, not a thing to read.
 *   widget      a RANGE slider with no number field: the in-prose what-if control on
 *               13 essays. Interactive, but the page is still an essay, so it does not
 *               promote the page to acquire the way a calculator does.
 *   search      a search box and nothing else (a hub affordance).
 *   none
 *
 * Email capture is deliberately NOT in this ladder. 775 pages carry the newsletter
 * form; folding it in here would report three quarters of the site as interactive.
 * The BOM already measures capture separately as hasSubscribeFormInBody.
 */
export function interactivityOf(body) {
  const toolScripts = [...body.matchAll(/<script[^>]+src=["'](\/tools\/[^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((s) => !/\/tools\/_shared\/(context-bus|tier-filter)\.js/.test(s));
  if (/<input\b[^>]*type=["']number["']/i.test(body) || toolScripts.length) return 'calculator';
  const worksheetInputs =
    (body.match(/<input\b[^>]*type=["'](?:checkbox|text|date)["']/gi) || []).length +
    (body.match(/<textarea\b/gi) || []).length;
  if (worksheetInputs >= 3) return 'worksheet';
  if (/<input\b[^>]*type=["']range["']/i.test(body)) return 'widget';
  if (/<input\b[^>]*type=["']search["']/i.test(body)) return 'search';
  return 'none';
}

/** Cluster scores for one page. Returns every score, not just the winner. */
export function clusterScores({ route, titleText, bodyText, retiredBodyHits }) {
  const r = routeWords(route);
  const t = ` ${String(titleText || '').toLowerCase()} `;
  const scores = {};
  for (const [name, vocab] of Object.entries(LEXICON)) {
    scores[name] = 8 * hits(r, vocab) + 5 * hits(t, vocab) + 1 * hits(bodyText, vocab);
  }
  // Body score is INHERITED from the BOM's measured four-category count; only the
  // route and title are scored here, with the positioning gate's own vocabulary.
  scores['retired-web-SEO'] =
    8 * hits(r, RETIRED_VOCAB) + 5 * hits(t, RETIRED_VOCAB) + 1 * retiredBodyHits;
  return scores;
}

/** Retired-line hits per 1,000 words of body prose. 0 words -> 0, never a divide-by-zero. */
export function retiredDensity(retiredHits, bodyWords) {
  return bodyWords > 0 ? Math.round((retiredHits / bodyWords) * 1000 * 100) / 100 : 0;
}

/**
 * Highest score wins, but only above CLAIM_FLOOR; CLUSTER_ORDER breaks ties. A page
 * that clears nothing falls back to its structural cluster, or to 'other'.
 * retired-web-SEO additionally has to clear RETIRED_MARGIN and RETIRED_DENSITY (see
 * their definition above); when it does not, it is demoted and `retiredDemoted` says so.
 */
export function pickCluster(scores, structural, opts = {}) {
  const {
    floor = CLAIM_FLOOR, retiredMargin = RETIRED_MARGIN, retiredDensityFloor = RETIRED_DENSITY,
    retiredHits = 0, bodyWords = 0,
  } = opts;

  const rank = (exclude) => {
    let best = null;
    let bestScore = floor - 1;
    for (const name of CLUSTER_ORDER) {
      if (name === exclude) continue;
      const s = scores[name] || 0;
      if (s > bestScore) { best = name; bestScore = s; }
    }
    return { best, bestScore };
  };

  const top = rank(null);
  if (top.best !== 'retired-web-SEO') {
    if (top.best) return { cluster: top.best, score: top.bestScore, retiredDemoted: null };
    const topAny = Math.max(0, ...CLUSTER_ORDER.map((n) => scores[n] || 0));
    return { cluster: structural || 'other', score: topAny, retiredDemoted: null };
  }

  const rest = rank('retired-web-SEO');
  const bestOther = Math.max(0, rest.bestScore >= floor ? rest.bestScore : 0,
    ...CLUSTER_ORDER.filter((n) => n !== 'retired-web-SEO').map((n) => scores[n] || 0));
  const density = retiredDensity(retiredHits, bodyWords);
  const marginOk = top.bestScore >= bestOther + retiredMargin;
  const densityOk = density >= retiredDensityFloor;
  if (marginOk && densityOk) return { cluster: 'retired-web-SEO', score: top.bestScore, retiredDemoted: null };

  const demoted = {
    retiredScore: top.bestScore, bestTopicalScore: bestOther, density,
    why: !marginOk && !densityOk ? 'margin and density both below the bar'
      : !marginOk ? `margin ${top.bestScore - bestOther} < ${retiredMargin}`
        : `density ${density}/1k < ${retiredDensityFloor}/1k`,
  };
  if (rest.best) return { cluster: rest.best, score: rest.bestScore, retiredDemoted: demoted };
  const topAny = Math.max(0, ...CLUSTER_ORDER.filter((n) => n !== 'retired-web-SEO').map((n) => scores[n] || 0));
  return { cluster: structural || 'other', score: topAny, retiredDemoted: demoted };
}

/** primaryIntent. Ordered; returns the verdict and the rule that produced it. */
export function intentOf(p, ctx) {
  if (p.shadowedByRedirect) return ['dead', `a 301 (${p.shadowedByRedirect}) already answers this route`];
  if (p.surfaceClass === 'legacy') return ['dead', 'unpublished draft — never shipped to a reader'];
  if (p.surfaceClass === 'admin') return ['dead', 'operator render harness, noindex by design — not reader content'];
  if (!p.indexable && p.isOrphanEvenViaRedirect && !ctx.functionalNoindexReason) {
    return ['dead', 'noindex AND no inbound editorial link — no crawler sees it, no reader reaches it'];
  }
  if (!p.indexable && ctx.cluster === 'retired-web-SEO') return ['dead', 'frozen retired-line content — off-thesis and already out of the index'];

  if (p.surfaceClass === 'product') return ['convert', 'product surface — the ask IS the page'];
  if (p.hasWaitlistFormInBody) return ['convert', 'carries the waitlist form in the body'];

  // trust is checked BEFORE the marketing-CTA convert rule, and the order matters:
  // /about/ and /studio/ are marketing-class and carry the same CTA every page does,
  // which filed the two pages a reader visits to decide whether the company is real
  // as conversion surfaces. On a storefront whose job is confidence, they are the
  // confidence.
  if (p.surfaceClass === 'trust') return ['trust', 'integrity surface — methods, claims, receipts, status, or legal'];
  if (p.surfaceRoot === 'about' || p.surfaceRoot === 'studio') return ['trust', 'company page — who is behind this'];

  if (p.surfaceClass === 'marketing' && p.ctaTargets.length) return ['convert', `marketing page with ${p.ctaTargets.length} in-content CTA target(s)`];

  if (p.indexable && ctx.interactivity === 'calculator') return ['acquire', 'indexable interactive calculator — a stranger can land and use it immediately'];
  if (p.indexable && ctx.isHub) return ['acquire', `indexable hub — routes readers onward (${p.outboundInternalLinks} outbound, ${ctx.childRoutes} child routes)`];

  // DefinedTerm is NOT usable on its own here and the first version was wrong to try:
  // build-library.mjs emits it for every autolinked glossary term, so it rides 310
  // library articles and 31 blog posts and filed the site's best essays as lookups.
  // It is only a lookup signal on a page whose whole job is the definition.
  if (p.surfaceClass === 'glossary' || p.surfaceClass === 'sheet') return ['reference', `${p.surfaceClass} surface — built for lookup, not for a read`];
  if (p.surfaceClass === 'cost-index') return ['reference', 'cost-index data page — answers one measured question'];

  if (p.jsonLdTypes.some((t) => t === 'Article' || t === 'BlogPosting' || t === 'HowTo')) {
    return ['educate', 'long-form article schema'];
  }
  if (p.wordCount >= 400) return ['educate', `${p.wordCount} words of prose`];
  return p.wordCount < 400
    ? ['reference', `only ${p.wordCount} words — a lookup-sized page with no article schema`]
    : ['educate', 'default'];
}

/** searchIntentGuess. Ordered. */
export function searchIntentOf(p, ctx) {
  if (ctx.isHub) return ['navigational', 'hub page — a destination, not an answer'];
  if (p.surfaceClass === 'trust' || p.surfaceClass === 'product' || p.surfaceClass === 'admin') {
    return ['navigational', `${p.surfaceClass} surface — reached by name, not by question`];
  }
  if (ctx.interactivity === 'calculator' || ctx.interactivity === 'worksheet') {
    return ['commercial', `${ctx.interactivity} on the page — the reader came to do something`];
  }
  const t = ` ${String(p.title || '')} ${String(p.h1 || '')} `.toLowerCase();
  const cue = COMMERCIAL_CUES.find((c) => t.includes(c));
  if (cue) return ['commercial', `title/h1 carries a shopping cue ("${cue.trim()}")`];
  return ['informational', 'no commercial cue and no destination signal — a question page'];
}

/** valueScore with every component exposed. A noindex page scores 0 outright. */
export function valueScoreOf(p, ctx) {
  if (!p.indexable) {
    return { total: 0, components: { noindex: 'crawlers are told to ignore this page; it cannot be a traffic flagship' } };
  }
  const c = {
    reach: Math.min(25, Math.round(6 * Math.log2(1 + p.inboundInternalLinks) * 10) / 10),
    depth: Math.min(15, Math.round((p.wordCount / 200) * 10) / 10),
    craft: Math.min(10, p.figureCount * 2.5),
    media: p.hasAudio ? 5 : 0,
    utility: ctx.interactivity === 'calculator' ? 15 : ctx.interactivity === 'worksheet' ? 8
      : ctx.interactivity === 'widget' ? 4 : 0,
    thesis: ON_THESIS.has(ctx.cluster) ? 15 : ctx.cluster === 'company/trust' ? 5 : 0,
    funnel: p.ctaTargets.length ? 8 : 0,
    freshness: p.dateModifiedDaysAgo == null ? 0
      : p.dateModifiedDaysAgo <= 90 ? 7 : p.dateModifiedDaysAgo <= 180 ? 4 : p.dateModifiedDaysAgo <= 365 ? 2 : 0,
  };
  const total = Math.round(Object.values(c).reduce((a, b) => a + b, 0) * 10) / 10;
  return { total, components: c };
}

/** keepVerdict. Ordered; returns [verdict, reason]. */
export function verdictOf(p, ctx) {
  if (p.shadowedByRedirect) return ['retire', `a 301 (${p.shadowedByRedirect}) already answers this route — the file is unreachable`];
  if (p.surfaceClass === 'legacy') return ['retire', 'unpublished draft — it has never been a page'];
  if (p.surfaceClass === 'admin') return ['keep', 'operator render harness — noindex by design, not content to judge'];
  if (ctx.functionalNoindexReason) return ['keep', `noindex and unlinked, but functional — ${ctx.functionalNoindexReason}`];
  if (!p.indexable && p.isOrphanEvenViaRedirect) {
    return ['retire', 'frozen AND unreachable — no crawler sees it and no internal link leads to it, whatever it is about'];
  }
  // Two structural exemptions from freeze, both on the positioning gate's own
  // precedent (its ALLOW entries for blog/index.html and glossary/index.html):
  //
  //   a HUB's vocabulary is the vocabulary of the pages it LISTS, not its own subject,
  //   and freeze-don't-delete means a frozen page stays reachable — so freezing the
  //   hub that reaches it hides a live page instead of retiring a dead one;
  //
  //   a TRUST surface's job IS the record. /changelog/ names what the company built
  //   and retired; that is the honesty surface working, not positioning drift.
  //
  // Both still carry the measured retired-line score in `signals`, so neither is
  // hidden — they are exempted from the REMEDY, not from the measurement.
  if (p.indexable && ctx.cluster === 'retired-web-SEO' && !ctx.positioningAllowKey) {
    if (ctx.isHub) {
      return ['keep', `hub listing retired-line entries (${ctx.retiredBodyHits} phrase(s)) — its vocabulary is its children's; freezing it would hide live pages, per check-positioning-drift's own blog/glossary hub allowance`];
    }
    if (p.surfaceClass === 'trust') {
      return ['keep', `trust surface carrying ${ctx.retiredBodyHits} retired-line phrase(s) — an integrity record naming what was retired is the honesty surface working, not drift`];
    }
    return ['freeze', `INDEXED retired-line content (${ctx.retiredBodyHits} retired-line phrase(s), ${retiredDensity(ctx.retiredBodyHits, ctx.bodyWords)}/1k words) — the positioning gate's own remedy`];
  }
  if (p.indexable && p.wordCount < MERGE_WORDS && p.inboundInternalLinks <= MERGE_INBOUND) {
    return ['merge', `${p.wordCount} words and ${p.inboundInternalLinks} inbound link(s) — too thin to rank alone, worth more folded into a parent`];
  }
  if (p.indexable && ON_THESIS.has(ctx.cluster) && ctx.valueScore >= ELEVATE_AT) {
    return ['elevate', `on-thesis (${ctx.cluster}) and scores ${ctx.valueScore}/100 — a page the rebuild should be built around`];
  }
  return ['keep', ctx.keepWhy || 'serves a job and shows no disqualifying signal'];
}

/* ------------------------------------------------------------------------ build */

function build() {
  let inv;
  try {
    inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  } catch {
    console.error('build-content-intent: data/surface-inventory.json is missing or unreadable.');
    console.error('  Run `node scripts/build-surface-inventory.mjs` first — this manifest classifies that one.');
    process.exit(2);
  }

  // Staleness is an error. Classifying a subset of the site silently is the exact
  // failure CLAUDE.md's root-list lesson was written about.
  const onDisk = new Set(walkHtml(REPO));
  const inInv = new Set(inv.pages.map((p) => p.filePath));
  const missing = [...onDisk].filter((f) => !inInv.has(f));
  const ghosts = [...inInv].filter((f) => !onDisk.has(f));
  if (missing.length || ghosts.length) {
    console.error('build-content-intent: data/surface-inventory.json is STALE — it does not match the repo.');
    if (missing.length) console.error(`  ${missing.length} page(s) on disk are absent from it, e.g. ${missing.slice(0, 5).join(', ')}`);
    if (ghosts.length) console.error(`  ${ghosts.length} page(s) in it no longer exist, e.g. ${ghosts.slice(0, 5).join(', ')}`);
    console.error('  Run `node scripts/build-surface-inventory.mjs`, then rerun this.');
    process.exit(2);
  }

  const byRoute = new Map(inv.pages.map((p) => [p.route, p]));
  const routeSet = new Set(byRoute.keys());

  // Pass 1 — read each page for the two signals the BOM does not carry, plus the
  // outbound edge list needed for the link-POSITION signals below.
  const ctxByRoute = new Map();
  const outboundByRoute = new Map();
  for (const p of inv.pages) {
    const html = fs.readFileSync(path.join(REPO, p.filePath), 'utf8');
    const { body } = stripChrome(html);
    const bodyText = prose(body);
    const titleText = `${p.title || ''} ${p.h1 || ''} ${p.metaDescription || ''}`;
    const retiredBodyHits = Object.values(p.retiredLineByCategory).reduce((a, b) => a + b, 0);
    const scores = clusterScores({ route: p.route, titleText, bodyText, retiredBodyHits });
    const interactivity = interactivityOf(body);
    const bodyWords = bodyText.trim() ? bodyText.trim().split(/\s+/).length : 0;

    const edges = new Set();
    for (const href of allLinks(body, p.route)) {
      const t = resolveTarget(href, routeSet);
      if (t && t !== p.route) edges.add(t);
    }
    outboundByRoute.set(p.route, edges);
    ctxByRoute.set(p.route, { scores, interactivity, retiredBodyHits, bodyWords });
  }

  // Pass 2 — hub detection, then the link-position signals that depend on it.
  const childCount = new Map();
  for (const r of routeSet) {
    // A route's parent directory, when that directory is itself a served route.
    const parent = r.replace(/[^/]+\/?$/, '');
    if (parent !== r && routeSet.has(parent)) childCount.set(parent, (childCount.get(parent) || 0) + 1);
  }
  for (const p of inv.pages) {
    const ctx = ctxByRoute.get(p.route);
    const kids = childCount.get(p.route) || 0;
    ctx.childRoutes = kids;
    // JSON-LD is NOT a hub signal on this site and the first version was wrong to use
    // it: CollectionPage rides 64 library ARTICLES and ItemList 72, both emitted by
    // the knit/related rails injected into article footers. Trusting the schema
    // reported 248 hubs — 115 of them individual glossary terms. Hubs are structural:
    // a route that PARENTS other routes, or one that links out heavily and briefly
    // while still parenting something.
    ctx.isHub = Boolean(
      kids >= HUB_CHILDREN
      || (p.outboundInternalLinks >= HUB_OUTBOUND && p.wordCount < HUB_WORDS && kids >= 1),
    );
  }
  const hubRoutes = new Set(inv.pages.filter((p) => ctxByRoute.get(p.route).isHub).map((p) => p.route));
  const homeRoutes = new Set(['/', '/es/']);
  for (const p of inv.pages) {
    const ctx = ctxByRoute.get(p.route);
    ctx.linkedFromHome = 0;
    ctx.linkedFromHub = 0;
  }
  for (const [from, edges] of outboundByRoute) {
    const fromHome = homeRoutes.has(from);
    const fromHub = hubRoutes.has(from);
    if (!fromHome && !fromHub) continue;
    for (const t of edges) {
      const ctx = ctxByRoute.get(t);
      if (!ctx) continue;
      if (fromHome) ctx.linkedFromHome++;
      if (fromHub) ctx.linkedFromHub++;
    }
  }

  // Pass 3 — classify.
  const records = [];
  for (const p of inv.pages) {
    const ctx = ctxByRoute.get(p.route);
    const structural =
      p.surfaceClass === 'trust' || p.surfaceRoot === 'about' || p.surfaceRoot === 'studio'
        || p.surfaceRoot === '(home)' || p.surfaceClass === 'marketing'
        ? 'company/trust'
        : null;
    const { cluster, score, retiredDemoted } = pickCluster(ctx.scores, structural, {
      retiredHits: ctx.retiredBodyHits, bodyWords: ctx.bodyWords,
    });
    ctx.cluster = cluster;
    ctx.retiredDemoted = retiredDemoted;
    ctx.functionalNoindexReason = functionalNoindexReason(p.route);
    ctx.positioningAllowKey = allowKeyFor(p.filePath);

    const [primaryIntent, intentReason] = intentOf(p, ctx);
    const [searchIntentGuess, searchReason] = searchIntentOf(p, ctx);
    const value = valueScoreOf(p, ctx);
    ctx.valueScore = value.total;
    ctx.keepWhy = ctx.positioningAllowKey
      ? `retired-line vocabulary present but allowlisted by check-positioning-drift (${ctx.positioningAllowKey})`
      : null;
    const [keepVerdict, keepReason] = verdictOf(p, ctx);

    records.push({
      route: p.route,
      filePath: p.filePath,
      lang: p.lang,
      surfaceClass: p.surfaceClass,
      title: p.title,
      primaryIntent,
      primaryIntentReason: intentReason,
      topicCluster: cluster,
      topicClusterScore: score,
      topicClusterScores: Object.fromEntries(
        Object.entries(ctx.scores).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]),
      ),
      onThesis: ON_THESIS.has(cluster),
      searchIntentGuess,
      searchIntentReason: searchReason,
      keepVerdict,
      keepVerdictReason: keepReason,
      valueScore: value.total,
      valueComponents: value.components,
      signals: {
        indexable: p.indexable,
        inSitemap: p.inSitemap,
        wordCount: p.wordCount,
        figureCount: p.figureCount,
        inboundInternalLinks: p.inboundInternalLinks,
        outboundInternalLinks: p.outboundInternalLinks,
        isOrphan: p.isOrphan,
        interactivity: ctx.interactivity,
        isHub: ctx.isHub,
        childRoutes: ctx.childRoutes,
        linkedFromHome: ctx.linkedFromHome,
        linkedFromHub: ctx.linkedFromHub,
        ctaTargets: p.ctaTargets.length,
        hasAudio: p.hasAudio,
        hasAnalytics: p.hasAnalytics,
        retiredLineHits: ctx.retiredBodyHits,
        retiredLineDensityPer1k: retiredDensity(ctx.retiredBodyHits, ctx.bodyWords),
        retiredWebBuildHits: p.retiredLineByCategory.webBuild,
        retiredDemoted: ctx.retiredDemoted,
        positioningAllowKey: ctx.positioningAllowKey,
        functionalNoindexReason: ctx.functionalNoindexReason,
        dateModifiedDaysAgo: p.dateModifiedDaysAgo,
        counterpartRoute: p.counterpartRoute,
      },
    });
  }
  records.sort((a, b) => (a.route < b.route ? -1 : 1));

  /* ------------------------------------------------------------------ rollups */

  const tally = (arr, fn) => {
    const o = {};
    for (const x of arr) { const k = fn(x); if (k == null) continue; o[k] = (o[k] || 0) + 1; }
    return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));
  };
  const cross = (arr, rowFn, colFn) => {
    const o = {};
    for (const x of arr) {
      const r = rowFn(x); const c = colFn(x);
      (o[r] ||= {})[c] = (o[r][c] || 0) + 1;
    }
    for (const r of Object.keys(o)) o[r] = Object.fromEntries(Object.entries(o[r]).sort((a, b) => b[1] - a[1]));
    return Object.fromEntries(Object.entries(o).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
  };

  const thesisBucket = (r) =>
    r.onThesis ? 'servesThesis' : r.topicCluster === 'retired-web-SEO' ? 'retiredLine' : 'neither';

  // Flagships: EN/ES pair de-duplication, higher score wins the pair.
  const scoreByRoute = new Map(records.map((r) => [r.route, r.valueScore]));
  const seenPair = new Set();
  const flagCandidates = [];
  for (const r of [...records].sort((a, b) => b.valueScore - a.valueScore || (a.route < b.route ? -1 : 1))) {
    const mate = r.signals.counterpartRoute;
    const key = mate && scoreByRoute.has(mate) ? [r.route, mate].sort().join('|') : r.route;
    if (seenPair.has(key)) continue;
    seenPair.add(key);
    flagCandidates.push(r);
  }
  const flagships = flagCandidates.slice(0, FLAGSHIP_N).map((r, i) => ({
    rank: i + 1,
    route: r.route,
    valueScore: r.valueScore,
    primaryIntent: r.primaryIntent,
    topicCluster: r.topicCluster,
    keepVerdict: r.keepVerdict,
    title: r.title,
    words: r.signals.wordCount,
    inbound: r.signals.inboundInternalLinks,
    figures: r.signals.figureCount,
    interactivity: r.signals.interactivity,
    esCounterpart: r.signals.counterpartRoute,
  }));

  /**
   * The flagship list is a ranking of PAGES, and pages built from one template repeat.
   * Reporting the top 30 without saying that would hide the single most useful fact in
   * it — that a large share of the site's highest-value assets are one builder's output.
   */
  const flagshipFamilies = (() => {
    const o = {};
    for (const f of flagships) {
      const fam = f.route.replace(/^\/es\//, '/').split('/').filter(Boolean)[0] || '(home)';
      (o[fam] ||= { pages: 0, routes: [] });
      o[fam].pages++;
      o[fam].routes.push(f.route);
    }
    return Object.fromEntries(Object.entries(o).sort((a, b) => b[1].pages - a[1].pages));
  })();

  const freezeCandidates = records.filter((r) => r.keepVerdict === 'freeze');
  const indexable = records.filter((r) => r.signals.indexable);

  const summary = {
    pages: records.length,
    byPrimaryIntent: tally(records, (r) => r.primaryIntent),
    byTopicCluster: tally(records, (r) => r.topicCluster),
    bySearchIntent: tally(records, (r) => r.searchIntentGuess),
    byKeepVerdict: tally(records, (r) => r.keepVerdict),

    thesis: {
      _doc: 'How much of the corpus serves the cost-intelligence thesis, how much is the retired web-design/SEO line, and how much is neither.',
      allPages: tally(records, thesisBucket),
      indexableOnly: tally(indexable, thesisBucket),
      wordsByBucket: (() => {
        const o = {};
        for (const r of records) o[thesisBucket(r)] = (o[thesisBucket(r)] || 0) + r.signals.wordCount;
        return o;
      })(),
      neitherByCluster: tally(records.filter((r) => thesisBucket(r) === 'neither'), (r) => r.topicCluster),
      neitherBySurfaceClass: tally(records.filter((r) => thesisBucket(r) === 'neither'), (r) => r.surfaceClass),
    },

    deadWeight: {
      _doc: 'Pages that can serve neither traffic nor confidence, by the rule that fired.',
      total: records.filter((r) => r.primaryIntent === 'dead').length,
      byReason: tally(records.filter((r) => r.primaryIntent === 'dead'), (r) => r.primaryIntentReason),
      bySurfaceClass: tally(records.filter((r) => r.primaryIntent === 'dead'), (r) => r.surfaceClass),
      routes: records.filter((r) => r.primaryIntent === 'dead').map((r) => r.route),
    },

    positioningCrossCheck: {
      _doc: 'This manifest vs scripts/check-positioning-drift.mjs. The gate reads ONLY the website-build vocabulary (RETIRED_VOCAB) on the full HTML of every indexed page outside its skip list, at threshold 3. Any difference below is a scope difference, stated.',
      gateVisibleViolations: freezeCandidates.filter((r) => r.signals.retiredWebBuildHits >= 3).map((r) => r.route),
      gateBlindCandidates: freezeCandidates.filter((r) => r.signals.retiredWebBuildHits < 3).map((r) => ({
        route: r.route, retiredHits: r.signals.retiredLineHits, webBuildHits: r.signals.retiredWebBuildHits,
      })),
      indexablePagesAtOrOverGateThreshold: indexable.filter((r) => r.signals.retiredWebBuildHits >= 3).length,
      ofThoseAllowlisted: indexable.filter((r) => r.signals.retiredWebBuildHits >= 3 && r.signals.positioningAllowKey).length,
      retiredDemoted: records.filter((r) => r.signals.retiredDemoted).map((r) => ({
        route: r.route, landedIn: r.topicCluster, indexable: r.signals.indexable,
        ...r.signals.retiredDemoted,
      })),
      retiredDemotedCount: records.filter((r) => r.signals.retiredDemoted).length,
      gateSkipsThisManifestScans: ['brand/og/preview.html'],
      gateSkipNote: 'check-positioning-drift skips the brand/ tree at depth 0; the surface BOM walks it (brand/og/preview.html, an OG-card render harness, classified admin -> dead here). That single page is the whole difference in scanned population: 1,066 indexable + 260 frozen = 1,326 seen by the gate vs 1,327 pages here.',
    },

    intentByClass: cross(records, (r) => r.surfaceClass, (r) => r.primaryIntent),
    verdictByCluster: cross(records, (r) => r.topicCluster, (r) => r.keepVerdict),
    clusterByLang: cross(records, (r) => r.topicCluster, (r) => r.lang),

    /**
     * EN and ES counterparts are the SAME article. Whenever they land in different
     * clusters the difference is the lexicons, not the pages — this is the honest
     * self-measurement of how much thinner the Spanish vocabulary is. It is a known
     * limit of this manifest, published rather than hidden.
     */
    localeClusterParity: (() => {
      const byRoute = new Map(records.map((r) => [r.route, r]));
      const pairs = [];
      const mismatches = [];
      for (const r of records) {
        if (r.lang !== 'en') continue;
        const mate = r.signals.counterpartRoute && byRoute.get(r.signals.counterpartRoute);
        if (!mate) continue;
        pairs.push(r.route);
        if (mate.topicCluster !== r.topicCluster) {
          mismatches.push({ en: r.route, enCluster: r.topicCluster, es: mate.route, esCluster: mate.topicCluster });
        }
      }
      return {
        pairsCompared: pairs.length,
        mismatched: mismatches.length,
        rate: pairs.length ? Math.round((mismatches.length / pairs.length) * 1000) / 10 : 0,
        sample: mismatches.slice(0, 20),
      };
    })(),

    thin: {
      _doc: 'Indexable pages under MERGE_WORDS words. Only the subset that is ALSO under MERGE_INBOUND inbound links gets a merge verdict; a thin page a family cross-links is not automatically a merge, but it is still thin.',
      indexableUnderMergeWords: indexable.filter((r) => r.signals.wordCount < MERGE_WORDS).length,
      ofThoseVerdictMerge: indexable.filter((r) => r.signals.wordCount < MERGE_WORDS && r.keepVerdict === 'merge').length,
      largestThinFamilies: (() => {
        const o = {};
        for (const r of indexable) {
          if (r.signals.wordCount >= MERGE_WORDS) continue;
          const parent = r.route.replace(/[^/]+\/?$/, '');
          o[parent] = (o[parent] || 0) + 1;
        }
        return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 12));
      })(),
    },

    interactivity: tally(records, (r) => r.signals.interactivity),
    hubs: {
      total: records.filter((r) => r.signals.isHub).length,
      routes: records.filter((r) => r.signals.isHub).map((r) => r.route),
    },

    valueScore: (() => {
      const s = records.map((r) => r.valueScore).sort((a, b) => a - b);
      const q = (f) => s[Math.min(s.length - 1, Math.floor(s.length * f))];
      return {
        zero: s.filter((x) => x === 0).length,
        p25: q(0.25), p50: q(0.5), p75: q(0.75), p90: q(0.9), p99: q(0.99), max: s[s.length - 1],
        atOrOverElevateThreshold: s.filter((x) => x >= ELEVATE_AT).length,
      };
    })(),

    funnelGaps: {
      _doc: 'On-thesis indexable pages missing the things a traffic-and-confidence storefront needs on them.',
      onThesisIndexable: indexable.filter((r) => r.onThesis).length,
      onThesisNoCta: indexable.filter((r) => r.onThesis && !r.signals.ctaTargets).length,
      onThesisNoAnalytics: indexable.filter((r) => r.onThesis && !r.signals.hasAnalytics).length,
      onThesisOrphan: indexable.filter((r) => r.onThesis && r.signals.isOrphan).length,
      onThesisNotLinkedFromAnyHub: indexable.filter((r) => r.onThesis && !r.signals.linkedFromHub).length,
      acquirePagesNoAnalytics: indexable.filter((r) => r.primaryIntent === 'acquire' && !r.signals.hasAnalytics).length,
    },

    flagshipFamilies,

    thresholds: {
      MERGE_WORDS, MERGE_INBOUND, ELEVATE_AT, FLAGSHIP_N, HUB_OUTBOUND, HUB_WORDS,
      HUB_CHILDREN, CLAIM_FLOOR, RETIRED_MARGIN, RETIRED_DENSITY,
    },
  };

  return {
    _doc: 'Content intent — one RULE-BASED record per routable page: what job it does (primaryIntent), what it is about (topicCluster), who would search for it (searchIntentGuess), and what the rebuild should do with it (keepVerdict), each with the reason that fired. Derived from data/surface-inventory.json plus two signals read from the page HTML (topic-lexicon hits on the chrome-stripped body, interactive-tool detection). The rules live in the header of scripts/build-content-intent.mjs so a human can audit and tune them; no judgement is baked into this file that cannot be re-derived.',
    _asOf: inv._asOf,
    _asOfBasis: 'Inherited from data/surface-inventory.json. No wall clock enters this file, so --check is stable until a commit lands.',
    _inventoryGenerator: inv._generator,
    _generator: 'scripts/build-content-intent.mjs',
    _skippedRoots: inv._skippedRoots,
    _skippedRootsNote: 'The root list is the surface BOM\'s, inherited whole. This manifest classifies exactly the population that manifest measures, and refuses to run if the two disagree.',
    _taxonomy: {
      primaryIntent: ['acquire', 'educate', 'convert', 'trust', 'reference', 'dead'],
      topicCluster: CLUSTER_ORDER,
      searchIntentGuess: ['informational', 'commercial', 'navigational'],
      keepVerdict: ['elevate', 'keep', 'merge', 'freeze', 'retire'],
    },
    summary,
    flagships,
    pages: records,
  };
}

/* ---------------------------------------------------------------------- report */

function report(doc) {
  const s = doc.summary;
  const row = (o) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join('  ');
  console.log(`content intent — ${s.pages} pages classified, asOf ${doc._asOf}`);
  console.log(`  primaryIntent   ${row(s.byPrimaryIntent)}`);
  console.log(`  topicCluster    ${row(s.byTopicCluster)}`);
  console.log(`  searchIntent    ${row(s.bySearchIntent)}`);
  console.log(`  keepVerdict     ${row(s.byKeepVerdict)}`);
  console.log(`  THESIS (all)    ${row(s.thesis.allPages)}`);
  console.log(`  THESIS (indexed)${row(s.thesis.indexableOnly)}`);
  console.log(`  words by bucket ${row(s.thesis.wordsByBucket)}`);
  console.log(`  "neither" is    ${row(s.thesis.neitherByCluster)}`);
  console.log(`  dead weight     ${s.deadWeight.total} pages — ${row(s.deadWeight.bySurfaceClass)}`);
  console.log(`  interactivity   ${row(s.interactivity)}`);
  console.log(`  hubs            ${s.hubs.total}`);
  console.log(`  valueScore      p50=${s.valueScore.p50} p75=${s.valueScore.p75} p90=${s.valueScore.p90} p99=${s.valueScore.p99} max=${s.valueScore.max}; ${s.valueScore.zero} score 0 (noindex); ${s.valueScore.atOrOverElevateThreshold} at/over the ${s.thresholds.ELEVATE_AT} elevate line`);
  console.log(`  funnel gaps     on-thesis indexed=${s.funnelGaps.onThesisIndexable}; no CTA=${s.funnelGaps.onThesisNoCta}; no analytics=${s.funnelGaps.onThesisNoAnalytics}; orphan=${s.funnelGaps.onThesisOrphan}; not linked from any hub=${s.funnelGaps.onThesisNotLinkedFromAnyHub}`);
  console.log(`  positioning     ${s.positioningCrossCheck.indexablePagesAtOrOverGateThreshold} indexed pages at/over the gate threshold, ${s.positioningCrossCheck.ofThoseAllowlisted} allowlisted; ${s.positioningCrossCheck.gateVisibleViolations.length} gate-visible freeze candidate(s), ${s.positioningCrossCheck.gateBlindCandidates.length} gate-blind`);
  console.log(`  retired demoted ${s.positioningCrossCheck.retiredDemotedCount} page(s) failed the retired-line margin/density bar and were filed topically instead`);
  console.log(`  thin            ${s.thin.indexableUnderMergeWords} indexable pages under ${s.thresholds.MERGE_WORDS} words (${s.thin.ofThoseVerdictMerge} verdict=merge)`);
  console.log(`  EN/ES parity    ${s.localeClusterParity.mismatched}/${s.localeClusterParity.pairsCompared} counterpart pairs land in different clusters (${s.localeClusterParity.rate}%) — a lexicon-coverage limit, not a page difference`);
  console.log(`  flagship famil. ${Object.entries(s.flagshipFamilies).map(([k, v]) => `${k}=${v.pages}`).join('  ')}`);
  console.log('\n  FLAGSHIPS (top 30, EN/ES pairs de-duplicated)');
  for (const f of doc.flagships) {
    console.log(`   ${String(f.rank).padStart(2)}. ${String(f.valueScore).padStart(5)}  ${f.primaryIntent.padEnd(10)} ${f.topicCluster.padEnd(20)} ${f.route}`);
  }
}

/* ------------------------------------------------------------------- self-test */

function selfTest() {
  const basePage = {
    route: '/library/x/', filePath: 'library/x/index.html', surfaceClass: 'library',
    surfaceRoot: 'library', indexable: true, inSitemap: true, wordCount: 1200,
    figureCount: 2, inboundInternalLinks: 10, outboundInternalLinks: 5, isOrphan: false,
    isOrphanEvenViaRedirect: false, ctaTargets: ['/ledger/'], hasAudio: false,
    hasAnalytics: true, hasWaitlistFormInBody: false, jsonLdTypes: ['Article'],
    shadowedByRedirect: null, dateModifiedDaysAgo: 30, title: 'x', h1: 'x',
    metaDescription: '', retiredLineByCategory: { webBuild: 0, seo: 0, localGbp: 0, brandDesign: 0 },
    counterpartRoute: null,
  };
  const baseCtx = { cluster: 'cost-intelligence', interactivity: 'none', isHub: false, childRoutes: 0, retiredBodyHits: 0, positioningAllowKey: null, valueScore: 0 };
  const P = (o) => ({ ...basePage, ...o });
  const C = (o) => ({ ...baseCtx, ...o });

  const cases = [
    // routeWords / hits
    [routeWords('/library/plate-cost/'), ' library plate cost ', 'route becomes phrase-matchable words'],
    [routeWords('/404.html'), ' 404 ', 'the .html suffix is dropped before matching'],
    [hits(' menu engineering and plate cost ', LEXICON['menu-pricing']), 2, 'lexicon phrases are counted'],
    [hits(' food cost and prime cost ', LEXICON['menu-pricing']), 0, 'a near-miss phrase does not match menu-pricing'],
    [hits(' we hired a web designer ', RETIRED_VOCAB), 1, 'the gate vocabulary is the one imported, not a copy'],

    // interactivity
    [interactivityOf('<input type="number" id="a">'), 'calculator', 'ONE number input is a calculator — the 165 ingredient-yield pages are single-field and real'],
    [interactivityOf('<input type="range" id="a">'), 'widget', 'a bare range slider is an in-prose widget, not a calculator'],
    [interactivityOf('<input type="number"><input type="range">'), 'calculator', 'a slider beside a number field is part of a calculator'],
    [interactivityOf('<script src="/tools/plate-cost/app.js"></script>'), 'calculator', 'a page-specific tools script is a calculator'],
    [interactivityOf('<script src="/tools/_shared/tier-filter.js"></script>'), 'none', 'the shared hub chrome scripts are NOT a calculator — the tools hub routes, it does not compute'],
    [interactivityOf('<input type="checkbox"><input type="checkbox"><input type="checkbox">'), 'worksheet', 'three checkboxes are a worksheet'],
    [interactivityOf('<input type="checkbox"><input type="checkbox">'), 'none', 'two inputs are not yet a worksheet'],
    [interactivityOf('<input type="search" id="q">'), 'search', 'a lone search box is a hub affordance'],
    [interactivityOf('<input type="email" name="email">'), 'none', 'the newsletter form on 775 pages is NOT interactivity'],
    [interactivityOf('<p>prose</p>'), 'none', 'plain prose is not interactive'],

    // clusters
    [pickCluster({ 'cost-intelligence': 10, vendors: 3 }).cluster, 'cost-intelligence', 'highest score wins'],
    [pickCluster({ 'cost-intelligence': 5, vendors: 5 }).cluster, 'cost-intelligence', 'a tie breaks on CLUSTER_ORDER'],
    [pickCluster({}, 'company/trust').cluster, 'company/trust', 'an all-zero page falls back to its structural cluster'],
    [pickCluster({}).cluster, 'other', 'an all-zero page with no structure is "other", which is a real answer'],
    [pickCluster({ 'retired-web-SEO': 2 }).cluster, 'other', 'a score of 2 is a mention, not a subject — CLAIM_FLOOR rejects it'],
    [pickCluster({ 'retired-web-SEO': 30 }, null, { retiredHits: 30, bodyWords: 300 }).cluster, 'retired-web-SEO', 'a dense, unopposed retired page is claimed'],
    [pickCluster({ 'retired-web-SEO': 2 }, 'company/trust').cluster, 'company/trust', 'below the floor the structural cluster wins'],
    [pickCluster({ vendors: 2 }).score, 2, 'the top score is still reported even when nothing is claimed'],

    // the asymmetric retired-line bar
    [retiredDensity(8, 4531), 1.77, 'density is hits per 1,000 body words'],
    [retiredDensity(5, 0), 0, 'a wordless page has 0 density, not a divide-by-zero'],
    [pickCluster({ 'retired-web-SEO': 9, invoices: 5 }, null, { retiredHits: 8, bodyWords: 4531 }).cluster, 'invoices',
      'a long article that names GBP eight times is NOT retired-line — 1.77 hits/1k fails the density bar'],
    [pickCluster({ 'retired-web-SEO': 9, invoices: 5 }, null, { retiredHits: 8, bodyWords: 4531 }).retiredDemoted.why.startsWith('density'), true,
      'the demotion states which bar it failed'],
    [pickCluster({ 'retired-web-SEO': 10, invoices: 7 }, null, { retiredHits: 10, bodyWords: 2199 }).cluster, 'retired-web-SEO',
      '4.5 hits/1k with a 3-point margin IS retired-line'],
    [pickCluster({ 'retired-web-SEO': 5, invoices: 4 }, null, { retiredHits: 40, bodyWords: 300 }).cluster, 'invoices',
      'dense but only 1 point clear of a topical cluster — the margin bar demotes it'],
    [pickCluster({ 'retired-web-SEO': 5, invoices: 4 }, null, { retiredHits: 40, bodyWords: 300 }).retiredDemoted.why.startsWith('margin'), true,
      'a margin failure names the margin'],
    [pickCluster({ 'retired-web-SEO': 4, vendors: 2 }, 'company/trust', { retiredHits: 4, bodyWords: 300 }).cluster, 'company/trust',
      'a demoted retired page with no topical cluster above the floor falls to its structural cluster, never back to retired'],
    [pickCluster({ 'retired-web-SEO': 40 }, null, { retiredHits: 40, bodyWords: 300 }).retiredDemoted, null,
      'an unopposed dense retired page is not demoted'],
    [clusterScores({ route: '/library/plate-cost/', titleText: '', bodyText: '', retiredBodyHits: 0 })['menu-pricing'], 8, 'a route hit is worth 8'],
    [clusterScores({ route: '/x/', titleText: 'plate cost', bodyText: '', retiredBodyHits: 0 })['menu-pricing'], 5, 'a title hit is worth 5'],
    [clusterScores({ route: '/x/', titleText: '', bodyText: 'plate cost', retiredBodyHits: 0 })['menu-pricing'], 1, 'a body hit is worth 1'],
    [clusterScores({ route: '/x/', titleText: '', bodyText: '', retiredBodyHits: 7 })['retired-web-SEO'], 7, 'the retired cluster inherits the BOM body count verbatim'],

    // intent
    [intentOf(P({ shadowedByRedirect: '/course/*' }), C())[0], 'dead', 'a 301-shadowed route is dead'],
    [intentOf(P({ surfaceClass: 'legacy' }), C())[0], 'dead', 'a draft is dead'],
    [intentOf(P({ surfaceClass: 'admin' }), C())[0], 'dead', 'an operator harness is dead for storefront purposes'],
    [intentOf(P({ indexable: false, isOrphanEvenViaRedirect: true }), C())[0], 'dead', 'noindex plus unreachable is dead'],
    [intentOf(P({ route: '/404.html', surfaceClass: 'trust', indexable: false, isOrphanEvenViaRedirect: true }), C({ functionalNoindexReason: 'served by the edge' }))[0], 'trust', 'the 404 page is noindex and unlinked BY DESIGN — not dead weight'],
    [functionalNoindexReason('/404.html') !== null, true, 'the 404 page is exempt'],
    [functionalNoindexReason('/es/404.html') !== null, true, 'the ES 404 page is exempt'],
    [functionalNoindexReason('/cost-index/ribeye/embed.html') !== null, true, 'an iframe embed widget is exempt — its inbound links are external by design'],
    [functionalNoindexReason('/sheets/holiday-hours-planner/'), null, 'a stranded frozen sheet is NOT exempt'],
    [intentOf(P({ indexable: false }), C({ cluster: 'retired-web-SEO' }))[0], 'dead', 'frozen retired-line content is dead'],
    [intentOf(P({ indexable: false }), C({ cluster: 'cost-intelligence' }))[0], 'educate', 'frozen but linked ON-thesis prose still teaches — not dead'],
    [intentOf(P({ surfaceClass: 'product' }), C())[0], 'convert', 'a product surface converts'],
    [intentOf(P({ hasWaitlistFormInBody: true }), C())[0], 'convert', 'a waitlist form in the body converts'],
    [intentOf(P({ surfaceClass: 'marketing' }), C())[0], 'convert', 'a marketing page with a CTA converts'],
    [intentOf(P({ surfaceClass: 'marketing', surfaceRoot: 'about' }), C())[0], 'trust', 'the about page is trust even though it is marketing-class and carries a CTA'],
    [intentOf(P({ surfaceClass: 'marketing', surfaceRoot: 'studio' }), C())[0], 'trust', 'the company page is trust, not a conversion surface'],
    [intentOf(P({ surfaceClass: 'marketing', ctaTargets: [] }), C())[0], 'educate', 'a marketing page with NO CTA is not a conversion surface'],
    [intentOf(P({ surfaceClass: 'trust' }), C())[0], 'trust', 'an integrity surface is trust'],
    [intentOf(P({ surfaceRoot: 'about' }), C())[0], 'trust', 'the company page is trust'],
    [intentOf(P(), C({ interactivity: 'calculator' }))[0], 'acquire', 'an indexable calculator acquires'],
    [intentOf(P({ indexable: false }), C({ interactivity: 'calculator', cluster: 'cost-intelligence' }))[0], 'educate', 'a NOINDEX calculator cannot acquire'],
    [intentOf(P(), C({ isHub: true }))[0], 'acquire', 'an indexable hub acquires'],
    [intentOf(P({ jsonLdTypes: ['DefinedTerm', 'Article'] }), C())[0], 'educate', 'DefinedTerm alone does NOT make a page a lookup — it rides 310 library articles as autolink schema'],
    [intentOf(P({ surfaceClass: 'glossary', jsonLdTypes: ['DefinedTerm'] }), C())[0], 'reference', 'a glossary term is a lookup'],
    [intentOf(P({ surfaceClass: 'sheet', jsonLdTypes: [] }), C())[0], 'reference', 'an operator sheet is a lookup'],
    [intentOf(P({ surfaceClass: 'cost-index', jsonLdTypes: [] }), C())[0], 'reference', 'a cost-index data page is a lookup'],
    [intentOf(P({ jsonLdTypes: [] }), C())[0], 'educate', '1,200 words with no schema still educates'],
    [intentOf(P({ jsonLdTypes: [], wordCount: 80, surfaceClass: 'library' }), C())[0], 'reference', 'an 80-word page is lookup-sized, not an article'],

    // search intent
    [searchIntentOf(P(), C({ isHub: true }))[0], 'navigational', 'a hub is navigational'],
    [searchIntentOf(P({ surfaceClass: 'trust' }), C())[0], 'navigational', 'trust pages are reached by name'],
    [searchIntentOf(P(), C({ interactivity: 'calculator' }))[0], 'commercial', 'a calculator means the reader came to do something'],
    [searchIntentOf(P({ title: 'Toast vs Square for restaurants' }), C())[0], 'commercial', 'a "vs" title is a shopping query'],
    [searchIntentOf(P({ title: 'How much does a walk-in cost' }), C())[0], 'commercial', '"how much does" is a shopping query'],
    [searchIntentOf(P({ title: 'What is prime cost' }), C())[0], 'informational', 'a definition question is informational'],
    [searchIntentOf(P({ title: 'Your food cost, honestly' }), C())[0], 'informational', 'bare "cost" is NOT a commercial cue — it would make the whole site commercial'],

    // value score
    [valueScoreOf(P({ indexable: false }), C()).total, 0, 'a noindex page scores 0 outright'],
    [valueScoreOf(P({ inboundInternalLinks: 0, wordCount: 0, figureCount: 0, ctaTargets: [], dateModifiedDaysAgo: 9999 }), C({ cluster: 'other' })).total, 0, 'an empty on-nothing page scores 0'],
    [valueScoreOf(P({ inboundInternalLinks: 1000, wordCount: 99999, figureCount: 99, hasAudio: true, dateModifiedDaysAgo: 1 }), C({ interactivity: 'calculator', cluster: 'cost-intelligence' })).total, 100, 'every component caps at a documented maximum, summing to 100'],
    [valueScoreOf(P(), C()).components.thesis, 15, 'an on-thesis cluster is worth 15'],
    [valueScoreOf(P(), C({ cluster: 'other' })).components.thesis, 0, 'an off-thesis cluster earns no thesis points'],

    // verdicts
    [verdictOf(P({ shadowedByRedirect: '/course/*' }), C())[0], 'retire', 'a 301-shadowed route is retired'],
    [verdictOf(P({ surfaceClass: 'legacy' }), C())[0], 'retire', 'a draft is retired'],
    [verdictOf(P({ surfaceClass: 'admin' }), C())[0], 'keep', 'an operator harness is kept, not judged as content'],
    [verdictOf(P(), C({ cluster: 'retired-web-SEO' }))[0], 'freeze', 'INDEXED retired-line content is frozen'],
    [verdictOf(P(), C({ cluster: 'retired-web-SEO', positioningAllowKey: 'x' }))[0], 'keep', 'an allowlisted page is NOT re-flagged — the gate already ruled'],
    [verdictOf(P(), C({ cluster: 'retired-web-SEO', isHub: true }))[0], 'keep', 'a HUB is never frozen — its vocabulary is its children\'s, and freezing it would hide live pages'],
    [verdictOf(P({ surfaceClass: 'trust' }), C({ cluster: 'retired-web-SEO' }))[0], 'keep', 'a trust surface naming what was retired is the record working, not drift'],
    [verdictOf(P({ indexable: false, isOrphanEvenViaRedirect: true }), C({ cluster: 'retired-web-SEO' }))[0], 'retire', 'frozen + unlinked is retired whatever it is about'],
    [verdictOf(P({ indexable: false, isOrphanEvenViaRedirect: true }), C({ functionalNoindexReason: 'served by the edge' }))[0], 'keep', 'a functional noindex page is kept, not retired'],
    [verdictOf(P({ wordCount: 120, inboundInternalLinks: 1 }), C())[0], 'merge', 'thin and barely linked is a merge'],
    [verdictOf(P({ wordCount: 120, inboundInternalLinks: 50 }), C())[0], 'keep', 'thin but heavily linked is load-bearing, not a merge'],
    [verdictOf(P(), C({ valueScore: 80 }))[0], 'elevate', 'a high-scoring on-thesis page is elevated'],
    [verdictOf(P(), C({ valueScore: 80, cluster: 'other' }))[0], 'keep', 'a high-scoring OFF-thesis page is not elevated'],
    [verdictOf(P(), C({ valueScore: 10 }))[0], 'keep', 'the default verdict is keep — freeze-don\'t-delete is the house doctrine'],
  ];

  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`x self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }

  // Every taxonomy value the rules can emit must be declared, and every declared
  // value must be reachable — a taxonomy that drifts from the rules is a lie.
  const declared = new Set(CLUSTER_ORDER);
  for (const k of Object.keys(LEXICON)) {
    if (!declared.has(k)) { console.error(`x self-test: LEXICON key "${k}" is not in CLUSTER_ORDER`); process.exit(2); }
    pass++;
  }
  for (const k of ON_THESIS) {
    if (!declared.has(k)) { console.error(`x self-test: ON_THESIS "${k}" is not in CLUSTER_ORDER`); process.exit(2); }
    pass++;
  }
  // Every functional-noindex exemption needs a substantive reason, for the same
  // reason the BOM's SKIP_TOP entries do: an unexplained exemption is a blind spot.
  for (const [re, why] of FUNCTIONAL_NOINDEX) {
    if (!why || why.length < 40) { console.error(`x self-test: FUNCTIONAL_NOINDEX ${re} needs a substantive reason`); process.exit(2); }
    pass++;
  }
  // A lexicon phrase that also appears in another cluster's lexicon makes the score
  // meaningless. Overlap is allowed only if it is intentional and stated here.
  const seen = new Map();
  for (const [name, vocab] of Object.entries(LEXICON)) {
    for (const p of vocab) {
      if (seen.has(p)) { console.error(`x self-test: phrase "${p}" is in both ${seen.get(p)} and ${name}`); process.exit(2); }
      seen.set(p, name);
    }
    pass++;
  }
  console.log(`build-content-intent --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

/* ---------------------------------------------------------------------- runner */

function main(argv) {
  if (argv.includes('--self-test')) selfTest();
  const doc = build();
  const built = JSON.stringify(doc, null, 2) + '\n';
  const s = doc.summary;
  const tag = `${s.pages} pages — ${s.thesis.allPages.servesThesis || 0} on-thesis, ${s.thesis.allPages.retiredLine || 0} retired-line, ${s.thesis.allPages.neither || 0} neither; ${s.deadWeight.total} dead`;

  if (argv.includes('--check')) {
    let current = '';
    try { current = fs.readFileSync(OUT, 'utf8'); } catch { /* missing -> stale */ }
    if (current !== built) {
      console.error('content intent: data/content-intent.json is stale — run `node scripts/build-content-intent.mjs` and commit.');
      process.exit(1);
    }
    console.log(`content intent: in sync — ${tag}.`);
    if (argv.includes('--report')) report(doc);
    process.exit(0);
  }

  if (argv.includes('--report') && argv.includes('--dry-run')) { report(doc); process.exit(0); }
  fs.writeFileSync(OUT, built);
  console.log(`content intent: wrote data/content-intent.json — ${tag}.`);
  if (argv.includes('--report')) report(doc);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
