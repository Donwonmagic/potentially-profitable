#!/usr/bin/env node
/**
 * build-link-graph.mjs — the Link + Funnel Graph. Where attention flows, and where it dies.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * Sixteen planning documents (2,723 lines) describe this site's information architecture
 * in prose. None of them can be queried, joined, or diffed, and the 2026-08-07 company
 * audit measured what that costs: prior audits close at 26% and no closure in company
 * history came from anyone working a document's list. This repo's working architecture is
 * manifest -> injector -> gate. So the IA is written as a MANIFEST: nodes, edges, and
 * derived reachability, all measured from the HTML on disk.
 *
 * It is the second half of a pair. build-surface-inventory.mjs answers "what pages exist
 * and what is on them". This answers "how does a reader get from one to another, and can
 * they get from there to an ask". Both key on `route`, so they join.
 *
 * THE TWO MODELS, AND WHY BOTH ARE REPORTED
 *
 * The nav and footer appear on ~1,300 pages. Count them and every page is two clicks from
 * everything, no page is ever an orphan, and the graph says nothing. Ignore them and you
 * are lying about what a reader can click. So every reachability number is computed twice:
 *
 *   EDITORIAL (`body` zone only) — links an author placed in prose. This is the graph that
 *     answers "does this page pass attention along", and it is the one that moves.
 *   RENDERED  (body + nav + footer + breadcrumb) — every anchor a browser paints. This is
 *     what a reader can physically reach.
 *
 * The GAP between the two is the finding. A page the template can reach and the prose
 * cannot is a page nobody is actually sent to.
 *
 * ZONING IS VERIFIED, NOT ASSERTED. The four chrome regexes below mirror
 * build-surface-inventory.mjs (NAV_STRIP_RE / FOOTER_STRIP_RE / BREADCRUMB_RE /
 * LANGSWITCH_RE, that file ~:170-190) because that module does not export them. A copy can
 * drift, so the build re-derives the body with the imported `stripChrome()` on every page
 * and counts any character-level disagreement into `_parity.zoneDivergence`. Likewise the
 * anchor-text extractor re-implements href normalization, so the build asserts its href
 * sequence is identical to the imported `allLinks()` on every page
 * (`_parity.hrefDivergence`). Both must be 0; they are reported rather than assumed.
 *
 * ROOT LIST (CLAUDE.md, "A scanner is only as good as its root list"). The walk is the
 * imported `walkHtml()`, which carries build-surface-inventory's SKIP_TOP — one root list
 * for both instruments, so the graph and the BOM can never disagree about what a page is.
 * `_skippedRoots` republishes it with each reason.
 *
 * REDIRECTS HAVE TWO TIERS, AND ONLY ONE IS IN `_redirects`. That file is at Cloudflare's
 * 100-rule cap, so the biggest redirect families live in Worker code — the 53 /blog/ ->
 * /library/ moves, the 8 retired tools, and six inline prefix rules (course, method, start,
 * the course sheet pack, the folded research pages). Resolving links against `_redirects`
 * alone reported 836 broken internal links; reading BOTH tiers reports 21. The other 815
 * are live redirected links, and four of them are the only reason certain pages are
 * reachable at all. The Worker modules export their lookups, so they are imported.
 *
 * CONVERSION IS MEASURED, NOT ASSUMED. A conversion surface is a page that carries a
 * working ask: a form posting to a route src/worker.js actually handles, or the sign-in
 * surface itself. A link to `ledger.muntin.digital` is NOT counted as conversion — neither
 * repo routes that hostname (wrangler.jsonc declares no route for it, src/worker.js never
 * names it), so those anchors are counted separately as `deadProductCta`. Counting an
 * unrouted host as a funnel exit would have hidden the site's largest dead end.
 *
 * DETERMINISM. No wall clock. `asOf` is the newest commit date in the repo, so --check is
 * stable until a commit lands. Node 22 built-ins only; no dependencies.
 *
 * Output: data/link-graph.json
 *
 *   node scripts/build-link-graph.mjs              # write the manifest
 *   node scripts/build-link-graph.mjs --check      # CI: rebuild & diff (exit 1 on drift)
 *   node scripts/build-link-graph.mjs --self-test  # unit-test the pure helpers
 *   node scripts/build-link-graph.mjs --report     # print the rollups to stdout
 *   node scripts/build-link-graph.mjs --report --dry-run  # rollups only, write nothing
 *
 * NOT WIRED into check-all.mjs, for the same reason build-surface-inventory.mjs is not:
 * HTML changes on nearly every commit, so a --check here would red the deploy until
 * someone reran it. It is a measuring instrument, not a gate. The day anyone wires it, it
 * belongs in check-idem-coverage's MANUAL registry with who reruns it and when it drifts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  walkHtml,
  routeFor,
  classify,
  stripChrome,
  allLinks,
  resolveTarget,
  isNonHtmlTarget,
  parseRedirectRules,
  redirectOnce,
  decodeEntities,
} from './build-surface-inventory.mjs';

/**
 * THE SECOND REDIRECT TIER. `_redirects` is at Cloudflare's 100-rule cap (deploy error
 * 100324), so the site's largest redirect families live in Worker code instead:
 * src/lib/blog-library-redirects.js (53 /blog/ -> /library/ moves) and
 * src/lib/tool-redirects.js (the 8 retired tools), plus six inline prefix rules in
 * src/worker.js:534-590. A link resolver that reads only `_redirects` therefore reports
 * hundreds of live, redirected links as broken and can mark a reachable page unreachable.
 * The two modules export their lookups, so they are IMPORTED rather than re-encoded — the
 * graph cannot drift from the routing it is describing.
 */
import { lookupBlogLibraryRedirect } from '../src/lib/blog-library-redirects.js';
import { lookupToolRedirect } from '../src/lib/tool-redirects.js';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const OUT = path.join(REPO, 'data', 'link-graph.json');
const SITE = 'https://muntin.digital';

/* ------------------------------------------------------------------ chrome zones */

/**
 * Mirrors of build-surface-inventory.mjs's chrome boundaries. Copied, not imported: that
 * module strips chrome but never exposes the regions, and the zone breakdown is the whole
 * point here. `_parity.zoneDivergence` proves the copy still agrees.
 */
const NAV_RE = /(?:<script>\s*\/\* Platform-aware kbd hint(?:(?!<\/script>)[\s\S])*?<\/script>\s*)*<header class="nav" id="nav">[\s\S]*?<\/header>/;
const FOOTER_RE = /(?<=\n)<footer\b[^>]*>[\s\S]*$/;
const BREADCRUMB_RE = /<nav class="breadcrumb[\s\S]*?<\/nav>/g;
const LANGSWITCH_RE = /<nav class="lang-switch[\s\S]*?<\/nav>/g;

/** Zone codes. Index into this array is what an edge tuple stores. */
export const ZONES = ['body', 'nav', 'footer', 'breadcrumb', 'langswitch'];
const Z = Object.fromEntries(ZONES.map((z, i) => [z, i]));

/** Zones a reader's browser paints (all of them) vs zones an author authored (body). */
const EDITORIAL_ZONES = new Set([Z.body]);

/* -------------------------------------------------------------- conversion surfaces */

/**
 * Form endpoints that src/worker.js actually handles (verified 2026-08-07 against its
 * route table at src/worker.js:467 and :471). A form posting anywhere else is markup, not
 * a funnel exit.
 */
const CONVERSION_FORMS = [
  ['waitlist-form', /<form[^>]*\baction=["']\/api\/waitlist["']/i],
  ['subscribe-form', /<form[^>]*\baction=["']\/api\/subscribe["']/i],
];

/** The sign-in surface is itself an account entry point. */
const SIGNIN_ROUTE_RE = /^\/(?:es\/)?sign-in\/$/;

/**
 * The product page. Pre-launch, this is the one surface a reader can land on that both
 * explains the product and carries the waitlist form, so "can a reader get here" is the
 * question the storefront exists to answer.
 */
const PRODUCT_ROUTE_RE = /^\/(?:es\/)?ledger\/$/;

/**
 * Off-site product hosts. `ledger.muntin.digital` carries the storefront's product CTA on
 * hundreds of pages and is routed by NEITHER repo — verified by grepping wrangler.jsonc,
 * _redirects, _headers and src/ for the hostname (zero hits, 2026-08-07). `app.muntin.digital`
 * is the operator-app host named in Muntin-Invoice-Decoder/CLAUDE.md. Both are matched so
 * the split is measured rather than guessed; `_unroutedHosts` records the evidence.
 */
const PRODUCT_HOST_RE = /^https:\/\/(?:app|ledger)\.muntin\.digital(?:\/|$)/;

/** Anchor text longer than this is truncated in the pool; full text is never load-bearing. */
const ANCHOR_MAX = 140;

/* ---------------------------------------------------------------- pure helpers */

/**
 * Split a page's `<body>` into the four chrome zones plus the editorial remainder.
 * Returns `{ zones: {name: [chunk,...]}, body }`. Order matches stripChrome() exactly.
 */
export function zoneSplit(html) {
  const at = html.search(/<body\b/i);
  let rest = at === -1 ? html : html.slice(at);
  const zones = { nav: [], footer: [], breadcrumb: [], langswitch: [] };

  const nav = rest.match(NAV_RE);
  if (nav) zones.nav.push(nav[0]);
  rest = rest.replace(NAV_RE, ' ');

  const foot = rest.match(FOOTER_RE);
  if (foot) zones.footer.push(foot[0]);
  rest = rest.replace(FOOTER_RE, ' ');

  zones.breadcrumb = rest.match(BREADCRUMB_RE) || [];
  rest = rest.replace(BREADCRUMB_RE, ' ');
  zones.langswitch = rest.match(LANGSWITCH_RE) || [];
  rest = rest.replace(LANGSWITCH_RE, ' ');

  return { zones, body: rest };
}

/**
 * Visible text of an anchor: tags dropped, entities decoded, whitespace collapsed. An
 * image-only anchor falls back to its alt text, then to '(no text)' — never to the URL,
 * which would make an empty anchor look descriptive.
 */
export function anchorText(inner) {
  let t = decodeEntities(String(inner).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  if (!t) {
    const alt = String(inner).match(/\balt=["']([^"']*)["']/i);
    t = alt ? decodeEntities(alt[1]).replace(/\s+/g, ' ').trim() : '';
  }
  if (!t) t = '(no text)';
  return t.length > ANCHOR_MAX ? t.slice(0, ANCHOR_MAX - 1) + '…' : t;
}

/**
 * Every anchor in a chunk as `{ href, text }`. href normalization is character-for-character
 * the same operation the imported allLinks() performs — same open-tag regex, same
 * same-host collapse, same relative resolution, same fragment/query drop — so the two can
 * be diffed. The build does exactly that on every page and reports the result.
 */
export function linksWithAnchors(chunk, fromRoute) {
  const out = [];
  const re = /<a\b[^>]*\bhref=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(chunk)) !== null) {
    let href = decodeEntities(m[1]).trim();
    if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
    if (/^(?:mailto:|tel:|javascript:|data:|#)/i.test(href) || !href) continue;

    // Anchor text: from the end of THIS open tag to the next </a>. Deriving it from the
    // open-tag match (rather than a separate <a>…</a> regex) is what keeps the href
    // sequence identical to allLinks() even where markup is unbalanced.
    const tagEnd = chunk.indexOf('>', m.index);
    const close = tagEnd === -1 ? -1 : chunk.indexOf('</a', tagEnd);
    const text = anchorText(tagEnd !== -1 && close > tagEnd ? chunk.slice(tagEnd + 1, close) : '');

    if (/^https?:/i.test(href)) { out.push({ href: href.split('#')[0], text }); continue; }
    if (!href.startsWith('/')) {
      const base = fromRoute.endsWith('/') ? fromRoute : fromRoute.replace(/[^/]*$/, '');
      href = path.posix.normalize(base + href);
    }
    href = href.split('#')[0].split('?')[0];
    if (href) out.push({ href, text });
  }
  return out;
}

/**
 * The six inline prefix 301s in src/worker.js, in the order the Worker evaluates them
 * (worker.js:534, :552, :567, :580 — ES branch always tested before its EN sibling, which
 * matters because '/es/course/' also startsWith nothing EN, but the ordering is preserved
 * anyway so this table can be diffed against the source by eye). Encoded as
 * [exactPaths, prefixes, target].
 */
const WORKER_INLINE_301 = [
  [['/es/start', '/es/start/'], ['/es/start/'], '/es/cost-index/'],
  [['/start', '/start/'], ['/start/'], '/cost-index/'],
  [['/es/course', '/es/method'], ['/es/course/', '/es/method/'], '/es/cost-index/'],
  [['/course', '/method'], ['/course/', '/method/'], '/cost-index/'],
  [[], ['/es/sheets/course-'], '/es/sheets/'],
  [[], ['/sheets/course-'], '/sheets/'],
  [['/es/cost-index/research', '/es/cost-index/research/'], ['/es/cost-index/research/'], '/es/cost-index/menu-pricing/'],
  [['/cost-index/research', '/cost-index/research/'], ['/cost-index/research/'], '/cost-index/menu-pricing/'],
];

/**
 * A path -> its Worker-issued 301 target, or null. Mirrors the dispatch order in
 * src/worker.js: blog->library map, retired-tool map, then the inline prefix rules.
 */
export function workerRedirect(pathname) {
  if (pathname.startsWith('/blog/') || pathname.startsWith('/es/blog/')) {
    const t = lookupBlogLibraryRedirect(pathname);
    if (t) return t;
  }
  if (pathname.startsWith('/tools/') || pathname.startsWith('/es/tools/')) {
    const t = lookupToolRedirect(pathname);
    if (t) return t;
  }
  for (const [exact, prefixes, target] of WORKER_INLINE_301) {
    if (exact.includes(pathname)) return target;
    for (const p of prefixes) if (pathname.startsWith(p)) return target;
  }
  return null;
}

/**
 * Breadth-first shortest hop count over an adjacency list of integer node ids.
 * Returns an Int32Array where -1 means "not reached".
 */
export function bfs(adj, seeds, n) {
  const dist = new Int32Array(n).fill(-1);
  let frontier = [];
  for (const s of seeds) if (s >= 0 && dist[s] === -1) { dist[s] = 0; frontier.push(s); }
  let d = 0;
  while (frontier.length) {
    const next = [];
    d++;
    for (const u of frontier) {
      for (const v of adj[u]) if (dist[v] === -1) { dist[v] = d; next.push(v); }
    }
    frontier = next;
  }
  return dist;
}

/** Histogram of a distance array: { "0": n, "1": n, …, "unreachable": n }. */
export function histogram(dist) {
  const h = {};
  let unreachable = 0;
  for (const v of dist) {
    if (v < 0) unreachable++;
    else h[v] = (h[v] || 0) + 1;
  }
  const out = {};
  for (const k of Object.keys(h).map(Number).sort((a, b) => a - b)) out[k] = h[k];
  out.unreachable = unreachable;
  return out;
}

/** Cumulative "reachable within N clicks" from a histogram, for N = 1..maxN. */
export function within(dist, maxN) {
  const out = {};
  for (let n = 1; n <= maxN; n++) out[n] = dist.reduce((s, v) => s + (v >= 0 && v <= n ? 1 : 0), 0);
  return out;
}

/**
 * Weakly-connected components over a subset of nodes: link direction is ignored, so a
 * cluster that links richly among itself but that nothing outside points into still shows
 * up as one island rather than as N lonely pages. This is the shape that matters —
 * "76 pages nobody can reach" is one decision, not seventy-six.
 */
export function components(adj, radj, members) {
  const inSet = new Set(members);
  const seen = new Set();
  const out = [];
  for (const s of members) {
    if (seen.has(s)) continue;
    const comp = [];
    const stack = [s];
    seen.add(s);
    while (stack.length) {
      const u = stack.pop();
      comp.push(u);
      for (const v of [...adj[u], ...radj[u]]) {
        if (inSet.has(v) && !seen.has(v)) { seen.add(v); stack.push(v); }
      }
    }
    out.push(comp.sort((a, b) => a - b));
  }
  return out.sort((a, b) => b.length - a.length);
}

/* ------------------------------------------------------------------------- io */

function readIf(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

/** Newest commit date in the repo — the deterministic clock. Null when git is unavailable. */
function newestCommitISO() {
  try {
    return execFileSync('git', ['log', '-1', '--pretty=format:%cI'], { cwd: REPO, encoding: 'utf8' }).trim() || null;
  } catch { return null; }
}

/* ------------------------------------------------------------------------ build */

function build() {
  const files = walkHtml(REPO);
  const routes = files.map(routeFor);
  const idOf = new Map(routes.map((r, i) => [r, i]));
  const routeSet = new Set(routes);
  const n = routes.length;

  const redirectRules = parseRedirectRules(readIf(path.join(REPO, '_redirects')));

  /**
   * sitemap.xml, joined in so the manifest can answer the question a traffic storefront
   * actually cares about: how much of what we ASK Google to crawl can a reader reach? A URL
   * that is submitted and unreachable collects no internal link equity and is a standing
   * bet that external links alone will carry it.
   */
  const sitemapRoutes = new Set(
    [...readIf(path.join(REPO, 'sitemap.xml')).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
      .map((m) => (m[1].startsWith(SITE) ? m[1].slice(SITE.length) || '/' : m[1])));

  // Per-node accumulators.
  const nodes = routes.map((route, i) => {
    const c = classify(route);
    return {
      route,
      filePath: files[i],
      lang: c.lang,
      surfaceClass: c.surfaceClass,
      surfaceRoot: c.surfaceRoot,
      conversionKinds: [],
      deadProductCta: 0,
      liveProductCta: 0,
      externalOut: 0,
      brokenOut: 0,
      nonHtmlOut: 0,
    };
  });

  const anchorPool = new Map(); // text -> index
  const anchorList = [];
  const anchorId = (t) => {
    let id = anchorPool.get(t);
    if (id === undefined) { id = anchorList.length; anchorPool.set(t, id); anchorList.push(t); }
    return id;
  };

  const edges = [];              // [fromId, toId, anchorId, zoneId] — one per anchor instance
  const broken = [];             // { from, href, zone }
  const externalHosts = new Map();
  let viaWorker = 0;
  const parity = { zoneDivergence: 0, hrefDivergence: 0, zoneDivergentPages: [], hrefDivergentPages: [] };

  for (let i = 0; i < n; i++) {
    const route = routes[i];
    const html = fs.readFileSync(path.join(REPO, files[i]), 'utf8');
    const { zones, body } = zoneSplit(html);

    // Parity check 1: my zoning must reproduce the imported stripChrome() byte for byte.
    if (body !== stripChrome(html).body) {
      parity.zoneDivergence++;
      if (parity.zoneDivergentPages.length < 20) parity.zoneDivergentPages.push(route);
    }

    const chunks = [[Z.body, [body]], [Z.nav, zones.nav], [Z.footer, zones.footer],
                    [Z.breadcrumb, zones.breadcrumb], [Z.langswitch, zones.langswitch]];

    // Parity check 2: my href sequence must equal the imported allLinks() over the whole body.
    const mine = [];
    for (const [, cs] of chunks) for (const c of cs) for (const l of linksWithAnchors(c, route)) mine.push(l.href);
    const at = html.search(/<body\b/i);
    const theirs = allLinks(at === -1 ? html : html.slice(at), route);
    if (mine.length !== theirs.length || mine.slice().sort().join('\u0000') !== theirs.slice().sort().join('\u0000')) {
      parity.hrefDivergence++;
      if (parity.hrefDivergentPages.length < 20) parity.hrefDivergentPages.push(route);
    }

    // Conversion mechanisms, measured per zone. A footer subscribe box is a template ask;
    // an in-body one is an editorial ask. They are recorded as different kinds because
    // conflating them makes every page on the site look like a conversion surface.
    for (const [kind, re] of CONVERSION_FORMS) {
      if (re.test(body)) nodes[i].conversionKinds.push(kind);
      else if (zones.footer.some((f) => re.test(f)) || zones.nav.some((f) => re.test(f))) {
        nodes[i].conversionKinds.push(`${kind}:chrome`);
      }
    }
    if (SIGNIN_ROUTE_RE.test(route)) nodes[i].conversionKinds.push('sign-in-surface');

    for (const [zone, cs] of chunks) {
      for (const chunk of cs) {
        for (const { href, text } of linksWithAnchors(chunk, route)) {
          if (/^https?:/i.test(href)) {
            nodes[i].externalOut++;
            let host = '';
            try { host = new URL(href).host; } catch { host = '(unparseable)'; }
            externalHosts.set(host, (externalHosts.get(host) || 0) + 1);
            if (PRODUCT_HOST_RE.test(href) && zone === Z.body) nodes[i].deadProductCta++;
            continue;
          }
          // Resolution order: the page on disk, then the Worker's own 301 tier, then
          // _redirects. One hop only in each tier — this repo's rules are flat, and a
          // chain would need cycle detection for no measured benefit.
          let target = resolveTarget(href, routeSet);
          if (!target) {
            const wr = workerRedirect(href);
            if (wr) { target = resolveTarget(wr, routeSet); if (target) viaWorker++; }
          }
          if (!target) {
            const hop = redirectOnce(href, redirectRules);
            if (hop && hop.startsWith('/')) target = resolveTarget(hop, routeSet);
          }
          if (target) {
            edges.push([i, idOf.get(target), anchorId(text), zone]);
            if (zone === Z.body && PRODUCT_ROUTE_RE.test(target)) nodes[i].liveProductCta++;
          } else if (isNonHtmlTarget(href)) {
            nodes[i].nonHtmlOut++;
          } else {
            nodes[i].brokenOut++;
            if (broken.length < 500) broken.push({ from: route, href, zone: ZONES[zone] });
          }
        }
      }
    }
  }

  /* ------------------------------------------------------------ adjacency + degrees */

  const adjEd = Array.from({ length: n }, () => new Set());
  const radjEd = Array.from({ length: n }, () => new Set());
  const adjRd = Array.from({ length: n }, () => new Set());
  const radjRd = Array.from({ length: n }, () => new Set());
  const inEdgesEd = new Int32Array(n), outEdgesEd = new Int32Array(n);
  const inEdgesRd = new Int32Array(n), outEdgesRd = new Int32Array(n);

  for (const [f, t, , z] of edges) {
    adjRd[f].add(t); radjRd[t].add(f); inEdgesRd[t]++; outEdgesRd[f]++;
    if (EDITORIAL_ZONES.has(z)) { adjEd[f].add(t); radjEd[t].add(f); inEdgesEd[t]++; outEdgesEd[f]++; }
  }
  // Self-links (a page linking to itself, e.g. a canonical crumb) inflate degree without
  // moving a reader. Dropped from the neighbour sets, still visible in the edge counts.
  for (let i = 0; i < n; i++) { adjEd[i].delete(i); radjEd[i].delete(i); adjRd[i].delete(i); radjRd[i].delete(i); }

  const arr = (sets) => sets.map((s) => [...s].sort((a, b) => a - b));
  const adjEdA = arr(adjEd), radjEdA = arr(radjEd), adjRdA = arr(adjRd), radjRdA = arr(radjRd);

  /* --------------------------------------------------------------- reachability */

  /**
   * The Worker runs BEFORE static assets, so any route that also matches a Worker 301 is
   * unreachable no matter what is on disk. Measured rather than assumed — if this is ever
   * nonzero the resolution order above becomes load-bearing and must be revisited.
   */
  const shadowedByWorker = routes.filter((r) => workerRedirect(r) !== null);

  const home = idOf.get('/');
  const esHome = idOf.get('/es/');
  const depthEd = bfs(adjEdA, [home], n);
  const depthRd = bfs(adjRdA, [home], n);
  // Locale-home depth: EN measured from /, ES from /es/. Without it the 645 Spanish pages
  // read as "unreachable" in the editorial model purely because the language switch is
  // chrome, which would be a true number telling a false story.
  const depthEdLocale = (() => {
    const en = bfs(adjEdA, [home], n);
    const es = bfs(adjEdA, [esHome], n);
    const out = new Int32Array(n);
    for (let i = 0; i < n; i++) out[i] = nodes[i].lang === 'es' ? es[i] : en[i];
    return out;
  })();

  /* ---------------------------------------------------------------- the funnel */

  const isRealAsk = (k) => !k.endsWith(':chrome');
  const convEd = [];   // editorial: an ask an author placed in the page body
  const convRd = [];   // rendered: that, plus the template's footer ask
  for (let i = 0; i < n; i++) {
    const k = nodes[i].conversionKinds;
    if (k.some(isRealAsk)) convEd.push(i);
    if (k.length) convRd.push(i);
  }
  const distConvEd = bfs(radjEdA, convEd, n);   // reverse edges: clicks FROM page TO an ask
  const distConvRd = bfs(radjRdA, convRd, n);

  /**
   * THE PRE-LAUNCH FUNNEL, measured separately. `distanceToConversion` above is dominated
   * by the newsletter box, which sits in-body on every Cost Index ingredient page — so
   * almost the whole site scores 1 or 2 and the number stops discriminating. The question
   * the storefront actually exists to answer before first release is narrower: can a reader
   * reach the PRODUCT (the /ledger/ page, which is also where the waitlist form lives)?
   * Both are reported; only this one moves when the funnel is fixed.
   */
  const waitlistSeeds = [];
  const productSeeds = [];
  for (let i = 0; i < n; i++) {
    if (nodes[i].conversionKinds.includes('waitlist-form')) waitlistSeeds.push(i);
    if (PRODUCT_ROUTE_RE.test(nodes[i].route)) productSeeds.push(i);
  }
  const distWaitEd = bfs(radjEdA, waitlistSeeds, n);
  const distWaitRd = bfs(radjRdA, waitlistSeeds, n);
  const distProdEd = bfs(radjEdA, productSeeds, n);

  /* ------------------------------------------------------------------ node rows */

  for (let i = 0; i < n; i++) {
    const nd = nodes[i];
    nd.inDegree = adjEd.length ? radjEdA[i].length : 0;
    nd.outDegree = adjEdA[i].length;
    nd.inEdges = inEdgesEd[i];
    nd.outEdges = outEdgesEd[i];
    nd.inDegreeRendered = radjRdA[i].length;
    nd.outDegreeRendered = adjRdA[i].length;
    nd.inEdgesRendered = inEdgesRd[i];
    nd.outEdgesRendered = outEdgesRd[i];
    nd.isOrphan = nd.inDegree === 0;
    nd.isOrphanRendered = nd.inDegreeRendered === 0;
    nd.clickDepthFromHome = depthEd[i] < 0 ? null : depthEd[i];
    nd.clickDepthFromHomeRendered = depthRd[i] < 0 ? null : depthRd[i];
    nd.clickDepthFromLocaleHome = depthEdLocale[i] < 0 ? null : depthEdLocale[i];
    nd.distanceToConversion = distConvEd[i] < 0 ? null : distConvEd[i];
    nd.distanceToConversionRendered = distConvRd[i] < 0 ? null : distConvRd[i];
    nd.distanceToWaitlist = distWaitEd[i] < 0 ? null : distWaitEd[i];
    nd.distanceToWaitlistRendered = distWaitRd[i] < 0 ? null : distWaitRd[i];
    nd.distanceToProduct = distProdEd[i] < 0 ? null : distProdEd[i];
    nd.isConversionSurface = nd.conversionKinds.some(isRealAsk);
    nd.inSitemap = sitemapRoutes.has(nd.route);
  }

  /* ------------------------------------------------------------------- islands */

  // Islands are computed on the RENDERED graph: a cluster nav and footer cannot reach is
  // unreachable in the strongest sense available, with no argument left about chrome.
  const stranded = [];
  for (let i = 0; i < n; i++) if (depthRd[i] < 0) stranded.push(i);
  const islands = components(adjRdA, radjRdA, stranded).map((c) => {
    const set = new Set(c);
    const roots = {};
    for (const i of c) {
      const k = nodes[i].route.replace(/^\/es/, '').split('/').slice(0, 3).join('/') + '/';
      roots[k] = (roots[k] || 0) + 1;
    }
    let internalEdges = 0;
    // An island with a nonzero inbound-from-reachable count would mean the BFS is wrong,
    // so the number is measured and published rather than assumed to be zero.
    let inboundFromReachable = 0;
    for (const [f, t] of edges) {
      if (set.has(t)) { if (set.has(f)) internalEdges++; else if (depthRd[f] >= 0) inboundFromReachable++; }
    }
    return {
      pages: c.length,
      sections: Object.entries(roots).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} (${v})`),
      internalEdges,
      inboundFromReachable,
      routes: c.map((i) => nodes[i].route),
    };
  });

  /* --------------------------------------------------------------------- rollups */

  const byIn = [...nodes].sort((a, b) =>
    b.inDegree - a.inDegree || b.inEdges - a.inEdges || (a.route < b.route ? -1 : 1));
  const topHubs = byIn.slice(0, 25).map((x) => ({
    route: x.route, surfaceClass: x.surfaceClass, inDegree: x.inDegree, inEdges: x.inEdges,
    outDegree: x.outDegree, clickDepthFromHome: x.clickDepthFromHome,
    distanceToConversion: x.distanceToConversion, distanceToProduct: x.distanceToProduct,
  }));

  /**
   * LEAK POINTS. A hub (top decile by editorial inDegree) that collects readers and passes
   * none of them onward to an ask. Reported against BOTH funnels, because they answer
   * different questions and only one of them is currently interesting:
   *   `noAsk`      — no editorial path to any ask at all. Near-zero, because the newsletter
   *                  box is in-body on 165 pages; a page reaching it is not "converting".
   *   `noProduct`  — no editorial path to the product page. This is the pre-launch fix list.
   */
  const inSorted = nodes.map((x) => x.inDegree).sort((a, b) => b - a);
  const hubCut = Math.max(3, inSorted[Math.floor(n * 0.1)] ?? 3);
  const hubs = nodes.filter((x) => x.inDegree >= hubCut);
  const leakRow = (x) => ({
    route: x.route, surfaceClass: x.surfaceClass, inDegree: x.inDegree, outDegree: x.outDegree,
    deadProductCta: x.deadProductCta, liveProductCta: x.liveProductCta,
    clickDepthFromLocaleHome: x.clickDepthFromLocaleHome,
    distanceToConversion: x.distanceToConversion, distanceToProduct: x.distanceToProduct,
  });
  const byInDesc = (a, b) => b.inDegree - a.inDegree || (a.route < b.route ? -1 : 1);
  const leaks = {
    hubCutoffInDegree: hubCut,
    hubCount: hubs.length,
    noAsk: hubs.filter((x) => x.distanceToConversion === null).sort(byInDesc).map(leakRow),
    noProduct: hubs.filter((x) => x.distanceToProduct === null).sort(byInDesc).map(leakRow),
    /**
     * The leak the site actually has. These pages DO make a product ask in their prose —
     * and every one of those asks points at the unrouted `ledger.muntin.digital`, with no
     * accompanying link to the routed `/ledger/`. The reader is asked and then dropped.
     * Sorted by inDegree so the fix list starts where the most readers arrive.
     */
    deadCtaOnly: nodes.filter((x) => x.deadProductCta > 0 && x.liveProductCta === 0)
      .sort(byInDesc).map(leakRow),
  };

  const orphans = nodes.filter((x) => x.isOrphan)
    .map((x) => ({ route: x.route, surfaceClass: x.surfaceClass, inDegreeRendered: x.inDegreeRendered }));
  const orphansRendered = nodes.filter((x) => x.isOrphanRendered).map((x) => x.route);

  const byClass = {};
  for (const x of nodes) {
    const b = (byClass[x.surfaceClass] ||= {
      pages: 0, orphans: 0, unreachableRendered: 0, noPathToConversion: 0, noPathToProduct: 0,
      medianInDegree: 0, deadProductCta: 0, deadCtaOnly: 0, _in: [],
    });
    b.pages++;
    if (x.isOrphan) b.orphans++;
    if (x.distanceToConversion === null) b.noPathToConversion++;
    if (x.distanceToProduct === null) b.noPathToProduct = (b.noPathToProduct || 0) + 1;
    if (x.deadProductCta > 0 && x.liveProductCta === 0) b.deadCtaOnly = (b.deadCtaOnly || 0) + 1;
    if (x.clickDepthFromHomeRendered === null) b.unreachableRendered = (b.unreachableRendered || 0) + 1;
    b.deadProductCta += x.deadProductCta;
    b._in.push(x.inDegree);
  }
  for (const b of Object.values(byClass)) {
    b._in.sort((a, c) => a - c);
    b.medianInDegree = b._in[Math.floor(b._in.length / 2)];
    delete b._in;
  }

  const external = [...externalHosts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([host, count]) => ({ host, count }));

  const doc = {
    _doc: 'Internal link + funnel graph of muntin.digital, measured from the HTML on disk. '
      + 'Nodes are routes; edges are anchor instances tagged by page zone. Every reachability '
      + 'number exists twice: EDITORIAL (body prose only) and RENDERED (plus nav/footer/breadcrumb). '
      + 'Joins to data/surface-inventory.json on `route`. Generated — do not hand-edit.',
    _asOf: newestCommitISO(),
    _asOfBasis: 'newest commit date in the repo; no wall clock enters this file',
    _generator: 'scripts/build-link-graph.mjs',
    _zones: ZONES,
    _zoneNote: 'edge tuples are [fromNodeIndex, toNodeIndex, anchorPoolIndex, zoneIndex]. '
      + 'The `langswitch` zone measures 0 edges site-wide, and that is correct rather than '
      + 'broken: the language switch is rendered INSIDE <header class="nav">, so its links '
      + 'are attributed to `nav`. It is why the nav link-set differs on nearly every page.',
    _editorialZones: [...EDITORIAL_ZONES].map((z) => ZONES[z]),
    _parity: {
      zoneDivergence: parity.zoneDivergence,
      zoneDivergentPages: parity.zoneDivergentPages,
      hrefDivergence: parity.hrefDivergence,
      hrefDivergentPages: parity.hrefDivergentPages,
      note: 'both must be 0. Nonzero means this script\'s copy of the chrome regexes or of '
        + 'href normalization has drifted from build-surface-inventory.mjs and the two '
        + 'instruments no longer describe the same site.',
    },
    _unroutedHosts: {
      hosts: ['ledger.muntin.digital'],
      evidence: 'grep of wrangler.jsonc, _redirects, _headers and src/ for the hostname returns '
        + 'zero hits (2026-08-07); Muntin-Invoice-Decoder declares no route for it either. Links '
        + 'to it are counted as deadProductCta, never as a funnel exit.',
    },
    _skippedRoots: 'see build-surface-inventory.mjs SKIP_TOP — this script imports its walkHtml(), '
      + 'so both instruments share one root list by construction.',
    summary: {
      nodes: n,
      edges: edges.length,
      edgesByZone: Object.fromEntries(ZONES.map((z, zi) => [z, edges.filter((e) => e[3] === zi).length])),
      distinctAnchorTexts: anchorList.length,
      brokenInternalLinks: nodes.reduce((s, x) => s + x.brokenOut, 0),
      edgesResolvedByWorkerRedirect: viaWorker,
      routesShadowedByWorkerRedirect: shadowedByWorker,
      nonHtmlTargets: nodes.reduce((s, x) => s + x.nonHtmlOut, 0),
      externalLinks: nodes.reduce((s, x) => s + x.externalOut, 0),
      deadProductCtaAnchors: nodes.reduce((s, x) => s + x.deadProductCta, 0),
      deadProductCtaPages: nodes.filter((x) => x.deadProductCta > 0).length,
      orphansEditorial: orphans.length,
      orphansRendered: orphansRendered.length,
      conversionSurfacesEditorial: convEd.length,
      conversionSurfacesRendered: convRd.length,
      reach: {
        editorialFromHome: { within: within(depthEd, 5), histogram: histogram(depthEd) },
        editorialFromLocaleHome: { within: within(depthEdLocale, 5), histogram: histogram(depthEdLocale) },
        renderedFromHome: { within: within(depthRd, 5), histogram: histogram(depthRd) },
      },
      funnel: {
        anyAskEditorial: { histogram: histogram(distConvEd), noPath: [...distConvEd].filter((v) => v < 0).length },
        anyAskRendered: { histogram: histogram(distConvRd), noPath: [...distConvRd].filter((v) => v < 0).length },
        waitlistEditorial: { histogram: histogram(distWaitEd), noPath: [...distWaitEd].filter((v) => v < 0).length },
        waitlistRendered: { histogram: histogram(distWaitRd), noPath: [...distWaitRd].filter((v) => v < 0).length },
        productEditorial: { histogram: histogram(distProdEd), noPath: [...distProdEd].filter((v) => v < 0).length },
      },
      islands: { count: islands.length, pages: stranded.length, largest: islands[0]?.pages ?? 0 },
      sitemap: {
        urls: sitemapRoutes.size,
        submittedAndUnreachableRendered: nodes.filter((x) => x.inSitemap && x.clickDepthFromHomeRendered === null).length,
        submittedAndEditorialOrphan: nodes.filter((x) => x.inSitemap && x.isOrphan).length,
        submittedAndNoPathToProduct: nodes.filter((x) => x.inSitemap && x.distanceToProduct === null).length,
        reachablePagesNotSubmitted: nodes.filter((x) => !x.inSitemap && x.clickDepthFromHomeRendered !== null).length,
      },
      hubCutoffInDegree: hubCut,
      leakPoints: {
        noAsk: leaks.noAsk.length,
        noProduct: leaks.noProduct.length,
        deadCtaOnly: leaks.deadCtaOnly.length,
      },
      productCta: {
        pagesWithLiveProductCta: nodes.filter((x) => x.liveProductCta > 0).length,
        pagesWithDeadProductCta: nodes.filter((x) => x.deadProductCta > 0).length,
        pagesWithBoth: nodes.filter((x) => x.deadProductCta > 0 && x.liveProductCta > 0).length,
        liveAnchors: nodes.reduce((s2, x) => s2 + x.liveProductCta, 0),
        deadAnchors: nodes.reduce((s2, x) => s2 + x.deadProductCta, 0),
      },
    },
    byClass,
    topHubs,
    leakPoints: leaks,
    islands,
    orphans,
    orphansRendered,
    conversionSurfaces: convEd.map((i) => ({ route: nodes[i].route, kinds: nodes[i].conversionKinds })),
    externalHosts: external,
    brokenSample: broken,
    anchors: anchorList,
    nodes,
    edges,
  };
  return doc;
}

/* ------------------------------------------------------------------ serialization */

/**
 * JSON with 2-space indent, except an array whose elements are ALL primitives prints on one
 * line. Keeps 80k edge tuples and the anchor pool readable and diffable instead of turning
 * the file into 320,000 lines of single integers.
 */
export function pretty(value, indent = 0) {
  const pad = ' '.repeat(indent);
  const pad2 = ' '.repeat(indent + 2);
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.every((v) => v === null || typeof v !== 'object')) return JSON.stringify(value);
    return '[\n' + value.map((v) => pad2 + pretty(v, indent + 2)).join(',\n') + '\n' + pad + ']';
  }
  const keys = Object.keys(value).filter((k) => value[k] !== undefined);
  if (keys.length === 0) return '{}';
  return '{\n' + keys.map((k) => pad2 + JSON.stringify(k) + ': ' + pretty(value[k], indent + 2)).join(',\n')
    + '\n' + pad + '}';
}

/* ---------------------------------------------------------------------- report */

function report(d) {
  const s = d.summary;
  const L = console.log;
  L('');
  L(`LINK + FUNNEL GRAPH — ${s.nodes} routable pages, ${s.edges} internal anchor instances (asOf ${d._asOf})`);
  L(`  parity: zoneDivergence=${d._parity.zoneDivergence} hrefDivergence=${d._parity.hrefDivergence} (both must be 0)`);
  L(`  edges by zone: ${Object.entries(s.edgesByZone).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  L('');
  L('REACH FROM HOME');
  for (const [name, r] of Object.entries(s.reach)) {
    L(`  ${name.padEnd(26)} <=1:${String(r.within[1]).padStart(5)}  <=2:${String(r.within[2]).padStart(5)}`
      + `  <=3:${String(r.within[3]).padStart(5)}  <=5:${String(r.within[5]).padStart(5)}`
      + `  unreachable:${r.histogram.unreachable}`);
  }
  L('');
  L('ORPHANS');
  L(`  editorial (no in-body inbound link): ${s.orphansEditorial}`);
  L(`  rendered  (no inbound link at all):  ${s.orphansRendered}`);
  L('');
  L('ISLANDS — clusters nav, footer and prose all fail to reach');
  L(`  ${s.islands.count} island(s), ${s.islands.pages} pages stranded, largest ${s.islands.largest}`);
  for (const isl of d.islands.slice(0, 8)) {
    L(`  ${String(isl.pages).padStart(4)} pages  inboundFromReachable:${isl.inboundFromReachable}  ${isl.sections.slice(0, 3).join(' ')}`);
  }
  L('');
  L('SITEMAP vs REACHABILITY');
  L(`  submitted URLs: ${s.sitemap.urls}`);
  L(`  submitted but UNREACHABLE by any click: ${s.sitemap.submittedAndUnreachableRendered}`);
  L(`  submitted but no in-body inbound link:  ${s.sitemap.submittedAndEditorialOrphan}`);
  L(`  reachable pages NOT submitted:          ${s.sitemap.reachablePagesNotSubmitted}`);
  L('');
  L('FUNNEL — clicks to the nearest working ask');
  L(`  conversion surfaces: editorial=${s.conversionSurfacesEditorial} rendered=${s.conversionSurfacesRendered}`);
  for (const [k, v] of Object.entries(s.funnel)) {
    L(`  ${k.padEnd(20)} ${JSON.stringify(v.histogram)}`);
  }
  L(`  dead product CTAs: ${s.deadProductCtaAnchors} anchors on ${s.deadProductCtaPages} pages -> unrouted host`);
  L('');
  L(`TOP 25 HUBS BY EDITORIAL inDegree`);
  for (const h of d.topHubs) {
    L(`  ${String(h.inDegree).padStart(5)}  depth:${String(h.clickDepthFromHome ?? '-').padStart(2)}`
      + `  toAsk:${String(h.distanceToConversion ?? 'none').padStart(4)}`
      + `  toProduct:${String(h.distanceToProduct ?? 'none').padStart(4)}  ${h.route}`);
  }
  L('');
  L(`LEAK POINTS — of ${d.leakPoints.hubCount} hubs (inDegree >= ${s.hubCutoffInDegree}):`);
  L(`  no editorial path to ANY ask: ${s.leakPoints.noAsk}`);
  L(`  no editorial path to the PRODUCT: ${s.leakPoints.noProduct}`);
  L('');
  L(`PRODUCT CTA — live (/ledger/) vs dead (unrouted host), in-body anchors only`);
  L(`  live: ${s.productCta.liveAnchors} anchors on ${s.productCta.pagesWithLiveProductCta} pages`);
  L(`  dead: ${s.productCta.deadAnchors} anchors on ${s.productCta.pagesWithDeadProductCta} pages`);
  L(`  pages carrying BOTH: ${s.productCta.pagesWithBoth}`);
  L(`  DEAD-CTA-ONLY (asks the reader, sends them nowhere): ${s.leakPoints.deadCtaOnly} pages`);
  for (const h of d.leakPoints.deadCtaOnly.slice(0, 15)) {
    L(`  ${String(h.inDegree).padStart(5)}  deadCTA:${h.deadProductCta}  ${h.route}`);
  }
  L('');
  L('BY SURFACE CLASS');
  for (const [k, v] of Object.entries(d.byClass).sort((a, b) => b[1].pages - a[1].pages)) {
    L(`  ${k.padEnd(12)} pages:${String(v.pages).padStart(5)} orph:${String(v.orphans).padStart(4)}`
      + ` unreach:${String(v.unreachableRendered).padStart(4)}`
      + ` noAsk:${String(v.noPathToConversion).padStart(4)} noProd:${String(v.noPathToProduct).padStart(5)}`
      + ` medIn:${String(v.medianInDegree).padStart(4)} deadCTA:${String(v.deadProductCta).padStart(4)}`
      + ` deadOnly:${v.deadCtaOnly}`);
  }
  L('');
}

/* -------------------------------------------------------------------- self-test */

function selfTest() {
  const cases = [
    [anchorText('Read <em>this</em>&nbsp;now'), 'Read this now', 'anchor text strips tags and decodes entities'],
    [anchorText('<img src="x.png" alt="Cost Index chart">'), 'Cost Index chart', 'image-only anchors fall back to alt'],
    [anchorText('<img src="x.png">'), '(no text)', 'a textless anchor is labelled, never filled with its URL'],
    [linksWithAnchors('<a href="/tools/">Tools</a>', '/').map((l) => l.href + '|' + l.text).join(),
      '/tools/|Tools', 'a simple internal link yields path and text'],
    [linksWithAnchors('<a href="../glossary/">G</a>', '/library/x/')[0].href,
      '/library/glossary/', 'relative hrefs resolve against the page route'],
    [linksWithAnchors(`<a href="${SITE}/tools/?a=1#b">T</a>`, '/')[0].href,
      '/tools/', 'same-host absolutes collapse; query and fragment drop'],
    [linksWithAnchors('<a href="https://ledger.muntin.digital/">Open</a>', '/')[0].href,
      'https://ledger.muntin.digital/', 'off-site hosts survive verbatim'],
    [linksWithAnchors('<a href="#top">Top</a><a href="mailto:a@b.c">M</a>', '/').length,
      0, 'bare fragments and mailto are not destinations'],
    [PRODUCT_HOST_RE.test('https://ledger.muntin.digital/'), true, 'the unrouted product host is matched'],
    [PRODUCT_HOST_RE.test('https://ledgerx.muntin.digital/'), false, 'a lookalike host is not matched'],
    [SIGNIN_ROUTE_RE.test('/es/sign-in/'), true, 'the ES sign-in surface counts'],
    [SIGNIN_ROUTE_RE.test('/library/sign-in-notes/'), false, 'a route merely containing sign-in does not'],
    [workerRedirect('/tools/gbp-grader/'), '/tools/', 'a retired tool resolves through the Worker map'],
    [workerRedirect('/es/tools/menu-copy/'), '/es/tools/menu-engineering/', 'the ES retired-tool target keeps its prefix'],
    [workerRedirect('/course/lesson-1/'), '/cost-index/', 'the retired course namespace 301s into the funnel'],
    [workerRedirect('/methods/'), null, "'/methods/' is a live page and must NOT match the '/method/' rule"],
    [workerRedirect('/sheets/course-prep/'), '/sheets/', 'the retired course sheet pack 301s to the sheets catalog'],
    [workerRedirect('/sheets/recipe-cost-card/'), null, 'a live operator sheet is untouched'],
    [workerRedirect('/cost-index/research/eggs/'), '/cost-index/menu-pricing/', 'the folded research pages 301 to the playbook'],
    [workerRedirect('/tools/cost-pulse/'), null, 'a live tool is not redirected'],
    [typeof lookupBlogLibraryRedirect('/blog/x/'), 'object', 'the blog->library map is importable and returns null or a string'],
    [JSON.stringify([...bfs([[1], [2], []], [0], 3)]), '[0,1,2]', 'bfs walks a chain'],
    [JSON.stringify([...bfs([[1], [], []], [0], 3)]), '[0,1,-1]', 'an unreached node stays -1'],
    [JSON.stringify(histogram([0, 1, 1, -1])), '{"0":1,"1":2,"unreachable":1}', 'histogram counts unreachable separately'],
    [JSON.stringify(within([0, 1, 3, -1], 3)), '{"1":2,"2":2,"3":3}', 'within() is cumulative and ignores unreachable'],
    [pretty({ a: [1, 2, 3] }), '{\n  "a": [1,2,3]\n}', 'primitive arrays print on one line'],
    [pretty({ a: [{ b: 1 }] }), '{\n  "a": [\n    {\n      "b": 1\n    }\n  ]\n}', 'object arrays stay expanded'],
    [(() => { const { zones, body } = zoneSplit('<body><header class="nav" id="nav"><a href="/x/">n</a></header><p><a href="/y/">b</a></p>\n<footer><a href="/z/">f</a></footer>'); return [zones.nav.length, zones.footer.length, /\/y\//.test(body), /\/x\//.test(body)].join(); })(),
      '1,1,true,false', 'zoneSplit separates nav, footer and body'],
  ];
  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`x self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }
  // Every conversion form must name an endpoint src/worker.js actually routes. A funnel
  // measured against an endpoint nobody handles is the exact failure this script exists
  // to expose, so it may not commit that failure itself.
  const worker = readIf(path.join(REPO, 'src', 'worker.js'));
  for (const [kind, re] of CONVERSION_FORMS) {
    const endpoint = String(re).match(/action=\\?\["'\]\\?\/([^\\"']+)/)?.[0] || '';
    const p = '/api/' + kind.replace('-form', '');
    if (worker && !worker.includes(p)) {
      console.error(`x self-test: ${kind} posts to ${p}, which src/worker.js does not route (${endpoint})`);
      process.exit(2);
    }
    pass++;
  }
  console.log(`build-link-graph --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

/* ---------------------------------------------------------------------- runner */

function main(argv) {
  if (argv.includes('--self-test')) selfTest();
  const doc = build();
  const built = pretty(doc) + '\n';
  const s = doc.summary;
  const tag = `${s.nodes} nodes, ${s.edges} edges, ${s.orphansEditorial} editorial orphan(s), `
    + `${s.islands.pages} page(s) stranded in ${s.islands.count} island(s), `
    + `${s.funnel.productEditorial.noPath} page(s) with no editorial path to the product`;

  if (doc._parity.zoneDivergence || doc._parity.hrefDivergence) {
    console.error(`! link graph: PARITY BROKEN — zone=${doc._parity.zoneDivergence} href=${doc._parity.hrefDivergence}. `
      + 'This script and build-surface-inventory.mjs no longer describe the same site.');
  }

  if (argv.includes('--check')) {
    let current = '';
    try { current = fs.readFileSync(OUT, 'utf8'); } catch { /* missing -> stale */ }
    if (current !== built) {
      console.error('link graph: data/link-graph.json is stale — run `node scripts/build-link-graph.mjs` and commit.');
      process.exit(1);
    }
    console.log(`link graph: in sync — ${tag}.`);
    if (argv.includes('--report')) report(doc);
    process.exit(0);
  }

  if (argv.includes('--report') && argv.includes('--dry-run')) { report(doc); process.exit(0); }
  fs.writeFileSync(OUT, built);
  console.log(`link graph: wrote data/link-graph.json — ${tag}.`);
  if (argv.includes('--report')) report(doc);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
