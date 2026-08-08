#!/usr/bin/env node
/**
 * audit-design-teeth.mjs — can ANY gate in this repo be shown to catch a design
 * regression?
 *
 * ============================== WHY ==============================
 *
 * The forensic that names this script's job: "Not one of the 169 check scripts
 * enforces that a design decision reached the surfaces it claims." That sentence
 * was produced by READING the gates. Reading is exactly how
 * check-cost-index-basis-leak.mjs got its reputation: it was green in CI, carried
 * 22 passing self-test assertions, named cost-index/feed.json in its own header,
 * and published ground beef at $393.06/lb — 71x the price the same repo printed
 * elsewhere. Every assertion was true. None was about the thing that was wrong.
 * Five verify commands in data/readiness-register.json failed the same way: they
 * exited 0 without testing the property they were named for.
 *
 * Design has its own instance on the record. docs/design/craft-scorecard.md
 * describes itself as "re-runnable, falsifiable" and instructs "RE-RENDER on
 * engagement start." Its history has exactly one entry, 2026-06-07. An unrun
 * measurement and an unfalsifiable one are the same object.
 *
 * So this script does not read gates. It BREAKS the design and watches which
 * gates notice. It converts the forensic claim from an inference into an exit
 * code, and it produces the number that any new design instrument has to beat.
 *
 * It is the sibling of scripts/audit-gate-teeth.mjs, which mutation-tests gates
 * whose inputs are data/*.json. That machinery cannot judge design: its generic
 * "perturb every number by 3x, invert every boolean" mutation has nothing to
 * bite on when the input is 1,3xx HTML pages and five stylesheets. The METHOD is
 * inherited — snapshot, damage, run, restore, always restore. The mutations are
 * design-specific, and each one is NAMED rather than generic, because "an
 * off-token hex literal" is a defect a human can act on and "field 7 tripled"
 * is not.
 *
 * ============================ THE METHOD ============================
 *
 * The whole test happens inside a SANDBOX COPY OF THE REPO. Nothing in the real
 * working tree is written, moved, or restored — because there is nothing to
 * restore. Concurrent design work holds this tree, and a harness that mutated
 * those files would be indistinguishable from the damage it is looking for.
 * (This is not hypothetical: an earlier revision of this script was itself
 * deleted mid-run by a concurrent `git clean`. Hence discovery, below.)
 *
 *   1. `git archive <ref> | tar -x` into a temp dir (html/css/json/md only — the
 *      repo's brand binaries are ~1.2 GB and no gate here reads them).
 *   2. Copy the gates in. Every gate derives its REPO from its own __filename,
 *      so running scripts/X.mjs from inside the sandbox makes the SANDBOX the
 *      repo: its pages, its stylesheets, its baseline files.
 *   3. Prove every gate is GREEN on the pristine sandbox. A gate already red
 *      cannot have its teeth measured, and is reported that way rather than
 *      counted as a catch.
 *   4. For each named mutation: apply it, run every gate, record exit codes,
 *      then restore the file and assert the restore is byte-identical.
 *
 * TWO KINDS OF INSTRUMENT, MEASURED DIFFERENTLY
 *
 *   BINARY GATES — the design-relevant check-*.mjs that exist at HEAD. They
 *     publish no number. The only question is: does the process exit non-zero
 *     when the design is damaged? This is the honest measure of the CURRENT
 *     protection, and it is the baseline the forensic claim is about.
 *
 *   SCORED INSTRUMENTS — a gate that publishes metrics via --json and enforces
 *     direction via --check. These are DISCOVERED on disk, not assumed: if
 *     check-design-scorecard.mjs is present it is measured, and if it is not, it
 *     is reported ABSENT rather than skipped silently. For these, two separate
 *     claims are recorded, because collapsing them is how a gate gets credit for
 *     protection it does not provide:
 *       METRIC MOVED  — the published number moved the predicted wrong way.
 *                       Proves the measurement is sensitive.
 *       GATE WENT RED — its own --check exited 1.
 *                       Proves the regression wiring converts sensitivity into
 *                       a failure.
 *
 * VERDICTS (scored instruments)
 *   TEETH                      number moved the wrong way AND --check exited 1.
 *   MEASURED-NOT-ENFORCED      number moved, --check stayed green.
 *   RED-BUT-NOT-VIA-THIS-METRIC  --check went red through some other measure.
 *   NO-TEETH                   the mutation landed and nothing moved.
 *   NOT-APPLIED                the mutation could not be applied. UNTRUSTED —
 *                              never counted as a pass.
 *   UNEXERCISED                a published metric no mutation here targets.
 *                              Reported as UNTRUSTED, not as passing.
 *
 * DECLARED ROOTS, JUSTIFIED OMISSIONS
 *
 * CLAUDE.md records this rule three times over, each time learned by shipping
 * the bug first: "a scanner is only as good as its root list." The gate list
 * below is explicit and every omission carries a reason. Running all 140
 * check-*.mjs against 19 mutations would be ~2,660 gate invocations, and the
 * ones omitted are omitted because their subject is prose, data or routing —
 * not because nobody looked.
 *
 * DELIBERATELY NOT WIRED into check-all.mjs. It materialises a ~160 MB sandbox
 * and runs every design gate once per mutation — minutes, not seconds — and a
 * deploy has no business doing that.
 *
 * AND IT IS DELIBERATELY NOT IN check-gate-coverage.mjs's UNWIRED REGISTRY,
 * which is worth stating plainly because the instruction to register it there
 * looks obviously right and is wrong. That gate's findCheckScripts() matches
 * `check-*.mjs` only, and its staleEntries() flags any UNWIRED key that is not
 * in that set. Adding `audit-design-teeth.mjs` there makes check-gate-coverage
 * report a stale entry and go RED — verified, not assumed:
 *   node -e "const m=await import('./scripts/check-gate-coverage.mjs');
 *            console.log(m.staleEntries(['check-a.mjs'],'',
 *              {'audit-design-teeth.mjs':{since:'x',status:'y',why:'z'}}))"
 *   → [ 'audit-design-teeth.mjs' ]
 * The `audit-` prefix is what keeps this script outside the coverage gate's
 * scope BY CONSTRUCTION, which is the same reason scripts/audit-gate-teeth.mjs
 * carries it. (That script's own header claims it "is listed in
 * check-gate-coverage's UNWIRED registry with exactly that reason." It is not,
 * and cannot be — `'audit-gate-teeth.mjs' in UNWIRED` is false. A small, real
 * instance of a document asserting a fact about code that the code denies.)
 * If this is ever renamed to `check-`, it MUST be added to UNWIRED in the same
 * commit or gate-coverage goes red.
 *
 * Usage:
 *   node scripts/audit-design-teeth.mjs                    # every mutation vs HEAD
 *   node scripts/audit-design-teeth.mjs --ref eb652f015    # any commit
 *   node scripts/audit-design-teeth.mjs --only color-hex-in-css,sentinel-corrupt
 *   node scripts/audit-design-teeth.mjs --gate check-contrast.mjs
 *   node scripts/audit-design-teeth.mjs --json             # write data/design-teeth-audit.json
 *   node scripts/audit-design-teeth.mjs --keep-sandbox
 *   node scripts/audit-design-teeth.mjs --self-test
 *
 * Exit codes:
 *   0 — every selected mutation ran and every gate's response was characterised.
 *   1 — a restore was not byte-identical, or the self-test failed. NOT an exit
 *       code about the verdicts: NO-TEETH is a finding to report, not a build
 *       to break.
 *
 * Node 22 built-ins only. No network. Deterministic given a ref.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const OUT = path.join(REPO, 'data', 'design-teeth-audit.json');

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

/* ================================================================== *
 * 1. THE GATES UNDER TEST
 * ================================================================== */

/**
 * Design-relevant gates that exist at HEAD, WITH THE EXACT ARGV check-all.mjs
 * uses to invoke them.
 *
 * The argv matters more than it looks. check-lazy-images.mjs and
 * check-image-formats.mjs are `--check` in check-all; invoked bare they print a
 * report and exit 0. An earlier revision of this harness ran every gate with no
 * arguments and recorded check-lazy-images as blind to a defect it in fact
 * catches — a false NO-TEETH, which is the same defect class as the vacuous
 * verify commands this script exists to prevent. If a gate's CI invocation
 * changes, change it here in the same commit.
 *
 * `sandboxBlind` marks a gate whose subject is not in the sandbox at all. The
 * sandbox carries html/css/json/md only, because the repo's brand binaries run
 * to ~1.2 GB. check-og-images.mjs resolves og:image paths to PNG files on disk,
 * so inside the sandbox it reports 1,175 dangling references that are all
 * present in the real repo (verified: it exits 0 there). Reporting that as
 * ALREADY-RED would be an artifact of the harness dressed up as a finding.
 */
export const BINARY_GATES = [
  ['check-contrast.mjs', [], 'locks the section-rhythm token palette to site.css'],
  ['check-dark-contrast.mjs', [], 'keeps the generated dark ramp AA at token level'],
  ['check-stone-2-usage.mjs', [], 'counts uses of a tone documented as failing AAA as body text'],
  ['check-css-drift.mjs', [], 'hardcoded-hex debt tracker; UNWIRED and documented as FAILING'],
  ['check-css-shells.mjs', ['--check'], 'guards the per-page CSS shell injection'],
  ['check-image-dimensions.mjs', ['--check'], 'CLS guard — <img> must carry width/height'],
  ['check-image-formats.mjs', ['--check'], 'AVIF/WebP sibling policy (warn tier in check-all)'],
  ['check-lazy-images.mjs', ['--check'], 'LCP guard — below-fold <img> must be lazy + async'],
  ['check-og-images.mjs', [], 'social card images', { sandboxBlind: 'resolves og:image to brand/*.png, which the sandbox excludes' }],
  ['check-article-graphics.mjs', [], 'the 9-rule article figure gate (viz-* families, audio-alt, figcaption)'],
];

/**
 * OMITTED, and why. Not "nobody looked": each of these has a subject that no
 * mutation in this file touches, so running it would add ~2,400 invocations of
 * guaranteed silence and dilute the measurement.
 *   - fact / claim / fabrication / audio gates .... subject is PROSE and sourced
 *     numbers. No mutation here writes prose.
 *   - queue / readiness / ADR / working-set gates . subject is the ledgers.
 *   - cost-index / events / driver gates .......... subject is data/*.json.
 *   - locale / hreflang / sitemap / link gates .... subject is ROUTING. A
 *     mutation that stripped a page's <link rel=stylesheet> does not move a
 *     route.
 * If a future mutation damages prose, data or routing, move the matching gate
 * into BINARY_GATES in the same commit.
 */
export const OMITTED_GATE_FAMILIES = [
  ['fact/claim/fabrication/audio', 'subject is prose and sourced numbers; no mutation here writes prose'],
  ['queue/readiness/ADR/working-set', 'subject is the ledgers, not the rendered surface'],
  ['cost-index/events/drivers', 'subject is data/*.json — covered by scripts/audit-gate-teeth.mjs'],
  ['locale/hreflang/sitemap/link-graph', 'subject is routing; no mutation here moves a route'],
];

/**
 * Scored instruments, DISCOVERED rather than assumed. `measure` and `check` are
 * the instrument's OWN CLI: nothing here re-implements a metric or a regression
 * rule, because a harness that recomputed the verdict would be testing itself.
 */
export const SCORED_INSTRUMENTS = {
  scorecard: {
    script: 'check-design-scorecard.mjs',
    baseline: ['--working', '--baseline'],
    measure: ['--working', '--json'],
    check: ['--working', '--check'],
    pick: (j) => ({ ...j.metrics }),
  },
  archetype: {
    script: 'check-archetype-conformance.mjs',
    baseline: ['--write-baseline'],
    measure: ['--json'],
    check: ['--check'],
    pick: (j) => {
      const out = {};
      for (const [k, v] of Object.entries(j.summary || {})) if (typeof v === 'number') out[`summary.${k}`] = v;
      for (const a of j.archetypes || []) {
        if (typeof a.conformance === 'number') out[`archetype.${a.id}.conformance`] = a.conformance;
        for (const [k, v] of Object.entries(a.discipline || {})) out[`archetype.${a.id}.${k}`] = v;
      }
      return out;
    },
  },
  contrast: {
    script: 'check-contrast-ratios.mjs',
    baseline: ['--baseline'],
    measure: ['--json'],
    check: ['--check'],
    pick: (j) => ({ ...j.measures }),
  },
};

/* ================================================================== *
 * 2. PURE MUTATORS — exported so --self-test can pin their behaviour.
 *
 * Every one is a string -> string transform. None touches the filesystem: the
 * harness owns application and restoration, so a mutator cannot leave a file
 * dirty even if it throws.
 * ================================================================== */

/** A block of CSS the site cannot already contain, appended verbatim. */
export function appendCss(text, block) {
  return text + '\n/* AUDIT-DESIGN-TEETH MUTATION — must never be committed */\n' + block + '\n';
}

/**
 * Delete every `font-variant-numeric: tabular-nums` declaration. This company
 * prints money a CPA aligns in a column; losing the rule is a real defect, and
 * an instrument that shrugs at it is not measuring what it says it measures.
 */
export function stripTabularNums(css) {
  return css.replace(/font-variant-numeric\s*:\s*[^;{}]*tabular-nums[^;{}]*;?/gi, '');
}

/**
 * Walk a stylesheet line by line, tracking whether we are inside a
 * prefers-color-scheme:dark block. Shared by the mutator and the finder so the
 * two cannot disagree about what "dark" means.
 */
export function eachLineWithDarkFlag(css, fn) {
  let depth = 0, inDark = false, darkDepth = 0;
  const lines = css.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inDark && /@media[^{]*prefers-color-scheme\s*:\s*dark/i.test(line)) { inDark = true; darkDepth = depth; }
    const before = depth;
    depth += (line.match(/\{/g) || []).length;
    depth -= (line.match(/\}/g) || []).length;
    if (inDark && depth <= darkDepth && before > darkDepth) inDark = false;
    fn(line, inDark, i);
  }
  return lines;
}

const tokenDefRe = (token) => new RegExp(`(^|[;{\\s])${token.replace(/-/g, '\\-')}\\s*:`);

/** Every colour-token definition in this sheet, tagged light or dark. */
export function tokenDefinitions(css) {
  const defs = [];
  eachLineWithDarkFlag(css, (line, inDark, i) => {
    const m = line.match(/(^|[;{\s])(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/);
    if (m) defs.push({ token: m[2], dark: inDark, line: i });
  });
  return defs;
}

/**
 * DELETE — not comment out — a colour token's redefinition(s) inside dark
 * blocks. The classic broken-dark-mode shape: light keeps its value, dark falls
 * back to the light one, and the theme silently stops being a theme.
 *
 * The line is removed outright. An earlier revision substituted a marker comment
 * LONGER than the declaration it replaced, so total CSS bytes went UP and the
 * scorecard went red for a reason that had nothing to do with the theme. A
 * mutation whose side effect trips a different metric proves nothing about the
 * metric it was aimed at — the same defect class as a vacuous verify command.
 */
export function deleteDarkRedefinition(css, token, { all = false } = {}) {
  const keep = [];
  let removed = 0;
  eachLineWithDarkFlag(css, (line, inDark) => {
    if (inDark && (all || removed === 0) && tokenDefRe(token).test(line)) { removed++; return; }
    keep.push(line);
  });
  if (!removed) throw new Error(`deleteDarkRedefinition: ${token} not found inside a dark block`);
  return keep.join('\n');
}

/** Break the FIRST `<!-- /count -->` closer, leaving an unbalanced sentinel. */
export function corruptSentinel(html) {
  if (!/<!--\s*\/count\s*-->/.test(html)) throw new Error('corruptSentinel: no count sentinel');
  return html.replace(/<!--\s*\/count\s*-->/, '<!-- count-closed -->');
}

/** Strip every stylesheet <link> — the page loses its archetype's shell. */
export function stripStylesheetLinks(html) {
  const out = html.replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, '');
  if (out === html) throw new Error('stripStylesheetLinks: no stylesheet link found');
  return out;
}

/** Give ONE page a body class and a sheet none of its siblings carry. */
export function addRareShellMarkers(html) {
  const out = html
    .replace(/<body\b([^>]*)class=(["'])([^"']*)\2/i, '<body$1class=$2$3 tt-mutant-rare-shell$2')
    .replace(/<\/head>/i, '<link rel="stylesheet" href="/assets/tt-mutant-rare.css">\n</head>');
  if (out === html) throw new Error('addRareShellMarkers: no body class / </head> to edit');
  return out;
}

/** Empty a page to a stub — deletion must not read as design improvement. */
export function emptyPage() {
  return '<!doctype html><html><head><title>x</title></head><body></body></html>\n';
}

/** Add a page-level <style> block full of raw hex. */
export function addHexStyleBlock(html) {
  const block = '<style>.tt-mutant-hexblock{color:#bada55;background:#c0ffee;border:1px solid #ff00aa}</style>';
  if (!/<\/head>/i.test(html)) throw new Error('addHexStyleBlock: no </head>');
  return html.replace(/<\/head>/i, block + '\n</head>');
}

/** Put a colour literal in a style="" attribute. */
export function addInlineStyleColor(html) {
  if (!/<body\b/i.test(html)) throw new Error('addInlineStyleColor: no <body>');
  return html.replace(/<body\b([^>]*)>/i, '<body$1><p style="color:#bada55">.</p>');
}

/** Hardcode a colour in an SVG presentation attribute. */
export function addSvgAttrColor(html) {
  if (!/<body\b/i.test(html)) throw new Error('addSvgAttrColor: no <body>');
  return html.replace(/<body\b([^>]*)>/i,
    '<body$1><svg width="1" height="1" aria-hidden="true"><rect width="1" height="1" fill="#bada55" stroke="#c0ffee"/></svg>');
}

/** Remove width/height from the first <img> that carries both. */
export function stripImgDimensions(html) {
  const m = html.match(/<img\b[^>]*\bwidth=[^>]*\bheight=[^>]*>/i) || html.match(/<img\b[^>]*\bheight=[^>]*\bwidth=[^>]*>/i);
  if (!m) throw new Error('stripImgDimensions: no <img> with both dimensions');
  const stripped = m[0].replace(/\s(width|height)=(["'])[^"']*\2/gi, '').replace(/\s(width|height)=\d+/gi, '');
  return html.replace(m[0], stripped);
}

/** Remove loading="lazy" from every <img> on the page. */
export function stripLazyLoading(html) {
  const out = html.replace(/\sloading=(["'])lazy\1/gi, '');
  if (out === html) throw new Error('stripLazyLoading: no lazy <img>');
  return out;
}

/* ================================================================== *
 * 3. VERDICT LOGIC — exported so --self-test can pin it.
 * ================================================================== */

export function movedWrongWay(before, after, dir) {
  if (typeof before !== 'number' || typeof after !== 'number') return false;
  return dir === 'up' ? after > before : after < before;
}

export function verdictOf({ anyMetricMoved, gateWentRed, applied }) {
  if (!applied) return 'NOT-APPLIED';
  if (anyMetricMoved && gateWentRed) return 'TEETH';
  if (anyMetricMoved && !gateWentRed) return 'MEASURED-NOT-ENFORCED';
  if (!anyMetricMoved && gateWentRed) return 'RED-BUT-NOT-VIA-THIS-METRIC';
  return 'NO-TEETH';
}

/* ================================================================== *
 * 4. TARGET FINDERS
 *
 * No mutation hardcodes a page path. A path that vanished would make this
 * harness quietly measure nothing — the exact failure it exists to catch. Each
 * finder searches the sandbox deterministically and THROWS if it finds nothing,
 * which surfaces as NOT-APPLIED rather than as a pass.
 * ================================================================== */

let htmlCache = null;
function htmlFiles(root) {
  if (htmlCache && htmlCache.root === root) return htmlCache.files;
  const files = [];
  const skip = new Set(['node_modules', '.git', '.github', 'dist', '.wrangler', 'brand', 'tests', 'scripts']);
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith('.html')) files.push(path.relative(root, p));
    }
  })(root);
  htmlCache = { root, files };
  return files;
}

/** First page (sorted, so deterministic) whose text satisfies `pred`. */
function findPage(root, pred, why) {
  for (const rel of htmlFiles(root)) {
    const t = fs.readFileSync(path.join(root, rel), 'utf8');
    if (pred(t, rel)) return rel;
  }
  throw new Error(`no page found: ${why}`);
}

/** A stylesheet that must exist for the design system to mean anything. */
function css(root, name) {
  const rel = path.join('assets', name);
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`missing stylesheet ${rel}`);
  return rel;
}

/** Every stylesheet the gates read, sorted, relative to `root`. */
function allSheets(root) {
  const dir = path.join(root, 'assets');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.css')).sort().map((f) => path.join('assets', f));
}

/**
 * The colour token defined in light that carries the FEWEST dark definitions
 * across every stylesheet, with the sheets holding them.
 *
 * The first version of this finder searched a single sheet and picked `--cream`,
 * which turned out to hold five dark definitions in site-core.css and five more
 * in site.css. Deleting one changed nothing, and the run reported a blind spot
 * the instrument did not have. A harness that manufactures a false NO-TEETH is
 * worse than no harness: it sends someone to fix a gate that was working. So the
 * mutation now removes EVERY dark definition of its chosen token — the token is
 * then genuinely unthemed, and a theme metric that still does not move has
 * nowhere left to hide.
 */
function findPairedDarkToken(root) {
  const darkCount = new Map(), darkSheets = new Map(), lightTokens = new Set();
  for (const rel of allSheets(root)) {
    for (const d of tokenDefinitions(fs.readFileSync(path.join(root, rel), 'utf8'))) {
      if (d.dark) {
        darkCount.set(d.token, (darkCount.get(d.token) || 0) + 1);
        if (!darkSheets.has(d.token)) darkSheets.set(d.token, new Set());
        darkSheets.get(d.token).add(rel);
      } else lightTokens.add(d.token);
    }
  }
  const paired = [...darkCount.entries()].filter(([t]) => lightTokens.has(t))
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
  if (!paired.length) throw new Error('no colour token defined in BOTH light and dark');
  const [token, count] = paired[0];
  return { token, count, sheets: [...darkSheets.get(token)].sort() };
}

/**
 * A member of the largest archetype that has a real signature. Mutating a page
 * in a vacuous archetype (no required markers) would prove nothing — every page
 * conforms there by construction.
 */
function findArchetypeMember(root) {
  const invPath = path.join(root, 'data', 'surface-inventory.json');
  const archPath = path.join(root, 'data', 'surface-archetypes.json');
  if (!fs.existsSync(invPath) || !fs.existsSync(archPath)) throw new Error('surface inventory/archetypes not in this tree');
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const arch = JSON.parse(fs.readFileSync(archPath, 'utf8'));
  const fileOf = new Map(inv.pages.map((p) => [p.route, p.filePath]));
  const groups = new Map();
  for (const a of arch.assignment) {
    if (!groups.has(a.archetype)) groups.set(a.archetype, []);
    groups.get(a.archetype).push(a.route);
  }
  const bySize = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  for (const [id, routes] of bySize) {
    if (routes.length < 10) continue;
    for (const route of routes.slice().sort()) {
      const rel = fileOf.get(route);
      const abs = rel && path.join(root, rel);
      if (abs && fs.existsSync(abs) && fs.readFileSync(abs, 'utf8').length > 2000) return { archetype: id, route, rel };
    }
  }
  throw new Error('no archetype with >=10 members and a readable page');
}

/* ================================================================== *
 * 5. THE MUTATION REGISTRY
 *
 * Each entry names ONE deliberate design defect. `expect` is the falsifiable
 * prediction for the SCORED instruments; for the binary gates the prediction is
 * implicit and identical for all of them — somebody should notice.
 * ================================================================== */

export const MUTATIONS = [
  /* ---------------- colour ---------------- */
  {
    id: 'color-hex-in-css',
    instrument: 'scorecard',
    why: 'An off-token hex literal in a shipped stylesheet. This is the defect check-no-offspine-color.mjs was named by the loop charter to catch and never existed to catch.',
    targets: (root) => [{ rel: css(root, 'site.css'), apply: (t) => appendCss(t, '.tt-mutant-a{color:#bada55;border-color:#c0ffee;background:rgb(1,2,3)}') }],
    expect: [
      { metric: 'color.offTokenLiterals', dir: 'up' },
      { metric: 'color.offTokenCssOnly', dir: 'up' },
      { metric: 'weight.totalCssBytes', dir: 'up' },
    ],
  },
  {
    id: 'color-svg-attr',
    instrument: 'scorecard',
    why: 'A hardcoded fill/stroke in an SVG presentation attribute — the illustration drift a stylesheet-only scanner never sees.',
    targets: (root) => [{ rel: findPage(root, (t) => /<body\b/i.test(t) && t.length > 2000, 'a real page with a <body>'), apply: addSvgAttrColor }],
    expect: [{ metric: 'color.svgAttrLiterals', dir: 'up' }, { metric: 'color.offTokenLiterals', dir: 'up' }],
  },
  {
    id: 'color-inline-style',
    instrument: 'scorecard',
    why: 'A colour literal in a style="" attribute — off-spine colour that no stylesheet audit reaches.',
    targets: (root) => [{ rel: findPage(root, (t) => /<body\b/i.test(t) && t.length > 2000, 'a real page with a <body>'), apply: addInlineStyleColor }],
    expect: [{ metric: 'color.inlineStyleLiterals', dir: 'up' }, { metric: 'color.offTokenLiterals', dir: 'up' }],
  },

  /* ---------------- type + space ---------------- */
  {
    id: 'type-offscale-fontsize',
    instrument: 'scorecard',
    why: 'A font-size off the declared scale. A type system with 134 distinct sizes is not a scale, and a gate that cannot see the 135th is not guarding one.',
    targets: (root) => [{ rel: css(root, 'site.css'), apply: (t) => appendCss(t, '.tt-mutant-b{font-size:13.77px}') }],
    expect: [
      { metric: 'type.distinctFontSizeValues', dir: 'up' },
      { metric: 'type.distinctFontSizeValuesCss', dir: 'up' },
      { metric: 'type.offScaleFontSizeDecls', dir: 'up' },
    ],
  },
  {
    id: 'space-offscale',
    instrument: 'scorecard',
    why: 'Padding, margin and gap drawn from nowhere — the spacing form of the same defect.',
    targets: (root) => [{ rel: css(root, 'site.css'), apply: (t) => appendCss(t, '.tt-mutant-c{padding:13.77px;margin:19.33px;gap:7.11px}') }],
    expect: [
      { metric: 'space.distinctValues', dir: 'up' },
      { metric: 'space.distinctValuesCss', dir: 'up' },
      { metric: 'space.offScaleDecls', dir: 'up' },
    ],
  },
  {
    id: 'font-family-rogue',
    instrument: 'scorecard',
    why: 'A seventh typeface. Typeface count is the coarsest coherence read there is and it should still be sensitive to one new face.',
    targets: (root) => [{ rel: css(root, 'site.css'), apply: (t) => appendCss(t, '.tt-mutant-d{font-family:"Mutant Grotesk",sans-serif}') }],
    expect: [{ metric: 'font.distinctFamilies', dir: 'up' }],
  },

  /* ---------------- tabular numerics ---------------- */
  {
    id: 'tabular-strip-all',
    instrument: 'scorecard',
    why: 'Delete every tabular-nums rule in every stylesheet. This company prints money a CPA aligns in a column; if that silently stops, the product looks like it guesses.',
    targets: (root) => allSheets(root).map((rel) => ({ rel, apply: stripTabularNums })),
    expect: [{ metric: 'tabular.declarations', dir: 'down' }, { metric: 'tabular.uncoveredNumericCells', dir: 'up' }],
  },
  {
    id: 'tabular-strip-one-sheet',
    instrument: 'scorecard',
    why: 'The SAME defect confined to one stylesheet. This mutation exists to characterise a known blind spot, not to pass: numeric cells are reached by selectors in several sheets at once, so coverage is redundant and losing one sheet leaves uncoveredNumericCells unmoved while the declaration COUNT still falls. Worth knowing which of the two numbers is doing the work.',
    targets: (root) => [{ rel: css(root, 'site-article.css'), apply: stripTabularNums }],
    expect: [{ metric: 'tabular.declarations', dir: 'down' }, { metric: 'tabular.uncoveredNumericCells', dir: 'up' }],
  },

  /* ---------------- theme completeness ---------------- */
  {
    id: 'theme-dark-redef-deleted',
    instrument: 'scorecard',
    why: 'Delete a colour token\'s dark redefinition everywhere it is defined. Light keeps its value, dark silently inherits it, and the theme stops being a theme.',
    targets: (root) => {
      const { token, count, sheets } = findPairedDarkToken(root);
      return sheets.map((rel) => ({
        rel,
        apply: (t) => deleteDarkRedefinition(t, token, { all: true }),
        note: `token ${token} — all ${count} dark definition(s) removed`,
      }));
    },
    expect: [{ metric: 'theme.lightColorTokensMissingDark', dir: 'up' }],
  },
  {
    id: 'theme-dark-only-token',
    instrument: 'scorecard',
    why: 'A token whose ONLY definition lives inside a dark block — the classic broken-dark-mode bug, invisible in light mode and therefore invisible to most reviewers.',
    targets: (root) => [{ rel: css(root, 'site-core.css'), apply: (t) => appendCss(t, '@media (prefers-color-scheme: dark){:root{--tt-mutant-orphan:#123456}}') }],
    expect: [{ metric: 'theme.darkOnlyColorTokens', dir: 'up' }],
  },

  /* ---------------- weight + sentinels ---------------- */
  {
    id: 'weight-bloat',
    instrument: 'scorecard',
    why: 'Forty kilobytes of dead CSS. Weight is the one measure where regression is invisible to the eye and obvious to the network.',
    targets: (root) => [{
      rel: css(root, 'site-tool.css'),
      apply: (t) => appendCss(t, Array.from({ length: 900 }, (_, i) => `.tt-mutant-bloat-${i}{outline-offset:${i}px}`).join('\n')),
    }],
    expect: [{ metric: 'weight.totalCssBytes', dir: 'up' }],
  },
  {
    id: 'sentinel-corrupt',
    instrument: 'scorecard',
    why: 'Break a <!-- count: --> sentinel closer. A broken sentinel silently breaks the gate that reads it — the bar here is ZERO, not "no worse".',
    targets: (root) => [{ rel: findPage(root, (t) => /<!--\s*\/count\s*-->/.test(t), 'a page carrying a count sentinel'), apply: corruptSentinel }],
    expect: [{ metric: 'sentinel.corruptions', dir: 'up' }],
  },

  /* ---------------- did the design reach the pages? ---------------- */
  {
    id: 'shell-stylesheets-stripped',
    instrument: 'archetype',
    why: 'One member page loses its stylesheet links — the design never reached this page. Half of the failure that let a specimen ship to /about/ while 1,326 pages disagreed and CI stayed green.',
    targets: (root) => { const m = findArchetypeMember(root); return [{ rel: m.rel, apply: stripStylesheetLinks, note: `${m.archetype} member ${m.route}` }]; },
    expect: [{ metric: 'summary.conforming', dir: 'down' }, { metric: 'summary.conformance', dir: 'down' }],
  },
  {
    id: 'shell-rare-marker',
    instrument: 'archetype',
    why: 'One member page gains a body class and a stylesheet none of its siblings carry — the design reached ONLY this page. The other half, and the one a diff review never catches because the diff looks like progress.',
    targets: (root) => { const m = findArchetypeMember(root); return [{ rel: m.rel, apply: addRareShellMarkers, note: `${m.archetype} member ${m.route}` }]; },
    expect: [{ metric: 'summary.conforming', dir: 'down' }, { metric: 'summary.conformance', dir: 'down' }],
  },
  {
    id: 'page-emptied',
    instrument: 'archetype',
    why: 'A page truncated to a stub. Deleting content removes hex literals and px font-sizes, so without a measure for this, DELETION reads as design improvement.',
    targets: (root) => { const m = findArchetypeMember(root); return [{ rel: m.rel, apply: emptyPage, note: `${m.archetype} member ${m.route}` }]; },
    expect: [{ metric: 'summary.routesEmpty', dir: 'up' }, { metric: 'summary.conforming', dir: 'down' }],
  },
  {
    id: 'discipline-hex-style-block',
    instrument: 'archetype',
    why: 'A page-level <style> block full of raw hex. Token discipline is recorded per archetype and going UP is the regression.',
    targets: (root) => { const m = findArchetypeMember(root); return [{ rel: m.rel, apply: addHexStyleBlock, note: `${m.archetype} member ${m.route}` }]; },
    expect: [{ metric: 'summary.hexLiterals', dir: 'up' }],
  },

  /* ---------------- contrast + a11y ---------------- */
  {
    id: 'contrast-pair-broken',
    instrument: 'contrast',
    why: 'A grey-on-grey text pairing at roughly 1.3:1. accessibility.html publishes a WCAG 2.2 AA conformance target; an instrument that cannot see this cannot support that sentence.',
    targets: (root) => [{ rel: css(root, 'site.css'), apply: (t) => appendCss(t, '.tt-mutant-lowcontrast{color:#777777;background-color:#888888}') }],
    expect: [{ metric: 'textAaFailures', dir: 'up' }, { metric: 'textAaFailuresLight', dir: 'up' }],
  },
  {
    id: 'focus-ring-suppressed',
    instrument: 'contrast',
    why: 'outline:none on an interactive selector with no :focus-visible restoration — a keyboard user loses the ring and nothing on screen says so.',
    targets: (root) => [{ rel: css(root, 'site.css'), apply: (t) => appendCss(t, 'a.tt-mutant-link:focus{outline:none}') }],
    expect: [{ metric: 'focusVisibleGaps', dir: 'up' }],
  },
  {
    id: 'motion-uncovered',
    instrument: 'contrast',
    why: 'An animation no prefers-reduced-motion block neutralises. Motion-safe is ADR-004 doctrine in the product repo and unmeasured on the storefront.',
    targets: (root) => [{ rel: css(root, 'site.css'), apply: (t) => appendCss(t, '@keyframes ttmutantspin{to{transform:rotate(360deg)}}\n.tt-mutant-spin{animation:ttmutantspin 2s linear infinite}') }],
    expect: [{ metric: 'motionGaps', dir: 'up' }],
  },
  {
    id: 'img-dimensions-stripped',
    instrument: 'contrast',
    why: 'An <img> loses width/height — the CLS defect check-image-dimensions.mjs is wired into check-all to guard. This is the control: a defect an EXISTING gate should catch, proving the harness can tell a caught defect from an uncaught one.',
    targets: (root) => [{ rel: findPage(root, (t) => /<img\b[^>]*\bwidth=[^>]*\bheight=/i.test(t), 'a page with a dimensioned <img>'), apply: stripImgDimensions }],
    expect: [{ metric: 'imgMissingDims', dir: 'up' }],
  },
  {
    id: 'img-lazy-stripped-sitewide',
    instrument: 'contrast',
    why: 'Strip loading="lazy" from EVERY page that has it. The maximal form of the LCP defect check-lazy-images.mjs is wired into check-all to guard. If the gate still exits 0 after this, it is not narrow — it is vacuous on this corpus, and its green is the appearance of protection rather than protection.',
    targets: (root) => {
      const hits = htmlFiles(root)
        .filter((rel) => /loading=["']?lazy/i.test(fs.readFileSync(path.join(root, rel), 'utf8')))
        .map((rel) => ({ rel, apply: stripLazyLoading }));
      if (!hits.length) throw new Error('no page carries loading="lazy"');
      return hits;
    },
    expect: [{ metric: 'imgMissingLazy', dir: 'up' }],
  },
];

/* ================================================================== *
 * 6. SANDBOX
 * ================================================================== */

function materialiseSandbox(ref, gateFiles) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-teeth-'));
  execFileSync('/bin/sh', ['-c',
    `git -C ${JSON.stringify(REPO)} archive ${JSON.stringify(ref)} | `
    + `tar -x -C ${JSON.stringify(dir)} --wildcards '*.html' '*.css' '*.json' '*.md'`,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  // Gates come from the WORKING TREE: some are new and not yet in any commit.
  // Each resolves REPO from its own __filename, so copying them here makes the
  // sandbox the repo they measure and baseline against.
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const f of gateFiles) {
    const src = path.join(REPO, 'scripts', f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, 'scripts', f));
  }
  return dir;
}

function runScript(sandbox, script, args = []) {
  try {
    const stdout = execFileSync('node', [path.join('scripts', script), ...args], {
      cwd: sandbox, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000,
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status == null ? -1 : e.status, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
}

/* ================================================================== *
 * 7. SELF-TEST
 * ================================================================== */

function selfTest() {
  let n = 0;
  const fails = [];
  const ok = (name, cond) => { n++; if (!cond) fails.push(name); };
  const eq = (name, a, b) => { n++; if (JSON.stringify(a) !== JSON.stringify(b)) fails.push(`${name}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`); };

  const cssIn = ':root{--a:#fff}\n.x{font-variant-numeric:tabular-nums;color:var(--a)}\n';
  ok('appendCss grows', appendCss(cssIn, '.y{color:#000}').length > cssIn.length);
  ok('appendCss is pure', cssIn === ':root{--a:#fff}\n.x{font-variant-numeric:tabular-nums;color:var(--a)}\n');
  ok('stripTabularNums removes the declaration', !/tabular-nums/.test(stripTabularNums(cssIn)));
  ok('stripTabularNums keeps the rest', /color:var\(--a\)/.test(stripTabularNums(cssIn)));

  const themed = ':root{--fg:#111111}\n@media (prefers-color-scheme: dark){\n:root{--fg:#eeeeee}\n}\n';
  const cut = deleteDarkRedefinition(themed, '--fg');
  ok('deleteDarkRedefinition removes the dark half', !/#eeeeee/.test(cut));
  ok('deleteDarkRedefinition keeps the light half', /#111111/.test(cut));
  // Must SHRINK. An earlier revision substituted a marker comment longer than
  // the declaration, pushing total CSS bytes UP and turning the scorecard red
  // for the wrong reason.
  ok('deleteDarkRedefinition shrinks the sheet (no marker-comment inflation)', cut.length < themed.length);
  ok('deleteDarkRedefinition leaves no marker behind', !/AUDIT-DESIGN-TEETH/.test(cut));
  let threw = false;
  try { deleteDarkRedefinition(':root{--fg:#111}', '--fg'); } catch { threw = true; }
  ok('deleteDarkRedefinition throws when there is no dark block', threw);

  const defs = tokenDefinitions(themed);
  eq('tokenDefinitions separates light from dark', defs.map((d) => `${d.token}:${d.dark ? 'dark' : 'light'}`), ['--fg:light', '--fg:dark']);
  const twoDark = ':root{--fg:#111111}\n@media (prefers-color-scheme: dark){:root{--fg:#eee}}\n@media (prefers-color-scheme: dark){.x{--fg:#ddd}}\n';
  eq('tokenDefinitions counts repeated dark definitions', tokenDefinitions(twoDark).filter((d) => d.dark).length, 2);
  eq('all:true removes every dark definition', tokenDefinitions(deleteDarkRedefinition(twoDark, '--fg', { all: true })).filter((d) => d.dark).length, 0);
  eq('all:false removes exactly one', tokenDefinitions(deleteDarkRedefinition(twoDark, '--fg')).filter((d) => d.dark).length, 1);

  const sent = '<p><!-- count:x -->3<!-- /count --></p>';
  ok('corruptSentinel unbalances', !/<!--\s*\/count\s*-->/.test(corruptSentinel(sent)));
  threw = false; try { corruptSentinel('<p>no sentinel</p>'); } catch { threw = true; }
  ok('corruptSentinel throws with no sentinel', threw);

  const page = '<!doctype html><html><head><link rel="stylesheet" href="/assets/site.css"></head>'
    + '<body class="page x"><img src="a.png" width="10" height="20" loading="lazy" alt="">'
    + '<img src="b.png" loading="lazy" alt=""></body></html>';
  ok('stripStylesheetLinks removes the link', !/stylesheet/.test(stripStylesheetLinks(page)));
  ok('addRareShellMarkers adds a body class', /tt-mutant-rare-shell/.test(addRareShellMarkers(page)));
  ok('addRareShellMarkers adds a sheet', /tt-mutant-rare\.css/.test(addRareShellMarkers(page)));
  ok('addHexStyleBlock adds hex', /#bada55/.test(addHexStyleBlock(page)));
  ok('addInlineStyleColor adds a style attr', /style="color:#bada55"/.test(addInlineStyleColor(page)));
  ok('addSvgAttrColor adds a fill attr', /fill="#bada55"/.test(addSvgAttrColor(page)));
  ok('emptyPage is a stub', emptyPage(page).length < 120);
  const noDims = stripImgDimensions(page);
  ok('stripImgDimensions drops width', !/\bwidth=/.test(noDims));
  ok('stripImgDimensions drops height', !/\bheight=/.test(noDims));
  ok('stripImgDimensions keeps the img', /<img/.test(noDims));
  ok('stripImgDimensions leaves the second img alone', (noDims.match(/<img/g) || []).length === 2);
  ok('stripLazyLoading removes every lazy', !/loading=/.test(stripLazyLoading(page)));
  threw = false; try { stripLazyLoading('<img src="a.png">'); } catch { threw = true; }
  ok('stripLazyLoading throws with no lazy img', threw);
  threw = false; try { stripImgDimensions('<p>no img</p>'); } catch { threw = true; }
  ok('stripImgDimensions throws with no img', threw);

  ok('up is worse when it goes up', movedWrongWay(1, 2, 'up'));
  ok('up is not worse when it goes down', !movedWrongWay(2, 1, 'up'));
  ok('down is worse when it goes down', movedWrongWay(2, 1, 'down'));
  ok('unchanged is never worse', !movedWrongWay(2, 2, 'up') && !movedWrongWay(2, 2, 'down'));
  ok('a missing metric is never worse', !movedWrongWay(undefined, 2, 'up'));

  eq('teeth', verdictOf({ anyMetricMoved: true, gateWentRed: true, applied: true }), 'TEETH');
  eq('measured not enforced', verdictOf({ anyMetricMoved: true, gateWentRed: false, applied: true }), 'MEASURED-NOT-ENFORCED');
  eq('no teeth', verdictOf({ anyMetricMoved: false, gateWentRed: false, applied: true }), 'NO-TEETH');
  eq('red via another metric', verdictOf({ anyMetricMoved: false, gateWentRed: true, applied: true }), 'RED-BUT-NOT-VIA-THIS-METRIC');
  eq('not applied', verdictOf({ anyMetricMoved: true, gateWentRed: true, applied: false }), 'NOT-APPLIED');

  ok('every mutation names a known scored instrument', MUTATIONS.every((m) => SCORED_INSTRUMENTS[m.instrument]));
  ok('every mutation predicts at least one metric', MUTATIONS.every((m) => m.expect.length > 0));
  ok('mutation ids are unique', new Set(MUTATIONS.map((m) => m.id)).size === MUTATIONS.length);
  ok('every mutation says why', MUTATIONS.every((m) => typeof m.why === 'string' && m.why.length > 40));
  ok('every binary gate carries argv and a stated job', BINARY_GATES.every(([g, a, j]) => g.endsWith('.mjs') && Array.isArray(a) && typeof j === 'string' && j.length > 10));
  ok('gate names are unique', new Set(BINARY_GATES.map(([g]) => g)).size === BINARY_GATES.length);
  ok('a sandbox-blind gate states why', BINARY_GATES.every(([, , , o]) => !o?.sandboxBlind || o.sandboxBlind.length > 20));
  ok('every omitted family carries a reason', OMITTED_GATE_FAMILIES.every(([, r]) => r.length > 20));

  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'design-teeth-st-'));
  const f = path.join(d, 'x.css');
  fs.writeFileSync(f, cssIn);
  const original = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, appendCss(original, '.z{color:#f00}'));
  ok('mutation reached disk', fs.readFileSync(f, 'utf8') !== original);
  fs.writeFileSync(f, original);
  eq('restore is byte-identical', sha(fs.readFileSync(f, 'utf8')), sha(original));
  fs.rmSync(d, { recursive: true, force: true });

  if (fails.length) {
    console.error('SELF-TEST FAILED');
    for (const x of fails) console.error('  x ' + x);
    process.exit(1);
  }
  console.log(`[audit-design-teeth] self-test OK — ${n} assertions across the mutators, the direction logic, the verdict table, the registry contracts and the apply/restore round-trip.`);
  process.exit(0);
}

/* ================================================================== *
 * 8. CLI
 * ================================================================== */

// Importable: the mutators and the verdict table are exported so another script
// can reuse them. A module that ran a multi-minute audit on import would make
// that impossible.
const RAN_DIRECTLY = process.argv[1] && path.resolve(process.argv[1]) === __filename;
const argv = process.argv.slice(2);
const arg = (name, fb = null) => { const i = argv.indexOf(name); return i === -1 ? fb : (argv[i + 1] ?? fb); };
const has = (name) => argv.includes(name);

if (!RAN_DIRECTLY) { /* library import — no CLI side effects */ } else {

if (has('--self-test')) selfTest();

const ref = arg('--ref', 'HEAD');
const onlyIds = arg('--only', null)?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;
const onlyGate = arg('--gate', null);

// Proof, recorded before and after, that this harness never wrote the tree
// concurrent design work is holding.
const gitState = () => execFileSync('git', ['-C', REPO, 'status', '--porcelain'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const repoStateBefore = gitState();

const selected = MUTATIONS.filter((m) => !onlyIds || onlyIds.includes(m.id));
if (!selected.length) { console.error('no mutations selected'); process.exit(1); }

const gates = BINARY_GATES.filter(([g]) => !onlyGate || g === onlyGate);
const refSha = execFileSync('git', ['-C', REPO, 'rev-parse', ref], { encoding: 'utf8' }).trim();

// Discover which scored instruments exist. Absent is a REPORTED STATE, never a
// silent skip: an instrument that vanished between runs is exactly the kind of
// thing an audit is supposed to notice.
const scoredPresent = {}, scoredAbsent = [];
for (const [id, inst] of Object.entries(SCORED_INSTRUMENTS)) {
  if (fs.existsSync(path.join(REPO, 'scripts', inst.script))) scoredPresent[id] = inst;
  else scoredAbsent.push(inst.script);
}

console.error(`[audit-design-teeth] materialising ${ref} = ${refSha.slice(0, 9)} …`);
const sandbox = materialiseSandbox(ref, [...gates.map(([g]) => g), ...Object.values(scoredPresent).map((i) => i.script)]);

const results = [];
const gateBaseline = {};
const pristine = {};
const coverage = {};
let hardFailure = null;

try {
  /* --- every binary gate must be GREEN on the pristine tree --- */
  console.error('[audit-design-teeth] proving the gates are green on the pristine sandbox …');
  for (const [g, gargs, job, opts = {}] of gates) {
    if (!fs.existsSync(path.join(sandbox, 'scripts', g))) { gateBaseline[g] = { state: 'ABSENT', job }; continue; }
    if (opts.sandboxBlind) { gateBaseline[g] = { state: 'SANDBOX-BLIND', job, why: opts.sandboxBlind }; continue; }
    const r = runScript(sandbox, g, gargs);
    gateBaseline[g] = { state: r.code === 0 ? 'GREEN' : 'ALREADY-RED', exit: r.code, job, argv: gargs };
  }

  /* --- baseline each scored instrument --- */
  for (const [id, inst] of Object.entries(scoredPresent)) {
    console.error(`[audit-design-teeth] baselining ${inst.script} …`);
    const b = runScript(sandbox, inst.script, inst.baseline);
    if (b.code !== 0) { delete scoredPresent[id]; scoredAbsent.push(`${inst.script} (baseline exited ${b.code})`); continue; }
    const m = runScript(sandbox, inst.script, inst.measure);
    if (m.code !== 0) { delete scoredPresent[id]; scoredAbsent.push(`${inst.script} (--json exited ${m.code})`); continue; }
    const raw = JSON.parse(m.stdout);
    pristine[id] = { metrics: inst.pick(raw), raw };
  }

  /* --- one mutation at a time --- */
  for (const mut of selected) {
    process.stderr.write(`[audit-design-teeth] ${mut.id} … `);
    const inst = scoredPresent[mut.instrument] || null;
    const snapshots = [];
    const record = {
      id: mut.id, why: mut.why,
      scoredInstrument: inst ? inst.script : null,
      targets: [], applied: false,
      metrics: [], gateExit: null, verdict: null, note: null,
      binary: { caughtBy: [], blindTo: [], notRun: [] },
    };

    let targets;
    try { targets = mut.targets(sandbox); }
    catch (e) {
      record.verdict = 'NOT-APPLIED';
      record.note = `target not found: ${e.message}`;
      results.push(record);
      console.error('NOT-APPLIED');
      continue;
    }

    try {
      for (const t of targets) {
        const abs = path.join(sandbox, t.rel);
        const before = fs.readFileSync(abs, 'utf8');
        snapshots.push({ abs, rel: t.rel, before, hash: sha(before) });
        fs.writeFileSync(abs, t.apply(before));
        record.targets.push({ file: t.rel, note: t.note ?? null });
      }
      record.applied = true;

      /* the scored instrument, if one exists for this defect */
      if (inst) {
        const m = runScript(sandbox, inst.script, inst.measure);
        const after = m.code === 0 ? inst.pick(JSON.parse(m.stdout)) : {};
        for (const e of mut.expect) {
          const b = pristine[mut.instrument]?.metrics[e.metric];
          const a = after[e.metric];
          record.metrics.push({ metric: e.metric, expected: e.dir, before: b ?? null, after: a ?? null, moved: movedWrongWay(b, a, e.dir) });
        }
        record.gateExit = runScript(sandbox, inst.script, inst.check).code;
      }

      /* every binary gate */
      for (const [g, gargs] of gates) {
        const base = gateBaseline[g];
        if (!base || base.state !== 'GREEN') { record.binary.notRun.push(g); continue; }
        const r = runScript(sandbox, g, gargs);
        (r.code !== 0 ? record.binary.caughtBy : record.binary.blindTo).push(g);
      }
    } finally {
      // ALWAYS restore, including on crash, and PROVE the restore.
      for (const s of snapshots) {
        fs.writeFileSync(s.abs, s.before);
        if (sha(fs.readFileSync(s.abs, 'utf8')) !== s.hash) hardFailure = `restore of ${s.rel} was not byte-identical`;
      }
    }

    record.verdict = inst
      ? verdictOf({ anyMetricMoved: record.metrics.some((m) => m.moved), gateWentRed: record.gateExit === 1, applied: record.applied })
      : (record.binary.caughtBy.length ? 'CAUGHT-BY-EXISTING-GATE' : 'UNCAUGHT');
    results.push(record);
    console.error(`${record.verdict}  [existing gates: ${record.binary.caughtBy.length ? record.binary.caughtBy.join(', ') : 'none'}]`);
  }

  /* --- coverage: published metrics no mutation exercises --- */
  for (const [id, inst] of Object.entries(scoredPresent)) {
    const published = Object.keys(pristine[id]?.metrics || {});
    const exercised = new Set(results.filter((r) => r.scoredInstrument === inst.script).flatMap((r) => r.metrics.map((m) => m.metric)));
    coverage[id] = {
      gate: inst.script,
      publishedMetrics: published.length,
      exercised: [...exercised].sort(),
      unexercised: published.filter((k) => !exercised.has(k)).sort(),
    };
  }
} finally {
  if (has('--keep-sandbox')) console.error(`[audit-design-teeth] sandbox kept at ${sandbox}`);
  else fs.rmSync(sandbox, { recursive: true, force: true });
}

const untouched = sha(repoStateBefore) === sha(gitState());

/* ================================================================== *
 * 9. REPORT
 * ================================================================== */

const applied = results.filter((r) => r.verdict !== 'NOT-APPLIED');
const uncaughtByAnyExisting = applied.filter((r) => r.binary.caughtBy.length === 0);
const L = [];
L.push('');
L.push(`DESIGN INSTRUMENT TEETH — ${ref} = ${refSha.slice(0, 9)}`);
L.push(`${results.length} deliberate design regression(s), each applied to a sandbox copy of the repo and then reverted.`);
L.push('');

L.push('  EXISTING GATES — green on the pristine tree, then asked to notice each defect');
for (const [g, gargs, job] of gates) {
  const b = gateBaseline[g] || {};
  const caught = applied.filter((r) => r.binary.caughtBy.includes(g));
  const cell = b.state === 'GREEN' ? `${caught.length}/${applied.length}` : b.state || '?';
  L.push(`    ${cell.padEnd(14)} ${(g + (gargs.length ? ' ' + gargs.join(' ') : '')).padEnd(38)} ${job}`);
  if (caught.length) L.push(`${' '.repeat(19)}caught: ${caught.map((r) => r.id).join(', ')}`);
  if (b.why) L.push(`${' '.repeat(19)}not measurable here: ${b.why}`);
}
L.push('');

L.push('  PER-DEFECT');
for (const r of results) {
  L.push(`    ${r.verdict.padEnd(28)} ${r.id}`);
  for (const m of r.metrics) {
    L.push(`        ${m.moved ? 'MOVED  ' : 'STILL  '} ${m.metric}: ${m.before} -> ${m.after}  (predicted ${m.expected})`);
  }
  if (r.scoredInstrument) {
    L.push(`        ${r.scoredInstrument} --check exit ${r.gateExit === null ? 'n/a' : r.gateExit}`
      + (r.gateExit === 1 ? '  (RED — enforced)' : r.gateExit === 0 ? '  (GREEN — measured but not enforced)' : ''));
  }
  if (r.verdict !== 'NOT-APPLIED') {
    L.push(`        existing gates that noticed: ${r.binary.caughtBy.length ? r.binary.caughtBy.join(', ') : 'NONE'}`);
  }
  if (r.note) L.push(`        note: ${r.note}`);
}
L.push('');

L.push('  HEADLINE');
L.push(`    ${uncaughtByAnyExisting.length} of ${applied.length} deliberate design regressions passed EVERY existing design gate in this repo.`);
L.push(`    Uncaught: ${uncaughtByAnyExisting.map((r) => r.id).join(', ') || 'none'}`);
L.push('');

if (Object.keys(scoredPresent).length) {
  const by = (v) => results.filter((r) => r.verdict === v).length;
  L.push('  SCORED INSTRUMENTS');
  L.push(`    TEETH                        ${by('TEETH')}   number moved the wrong way AND --check exited 1`);
  L.push(`    MEASURED-NOT-ENFORCED        ${by('MEASURED-NOT-ENFORCED')}   number moved, gate stayed green`);
  L.push(`    RED-BUT-NOT-VIA-THIS-METRIC  ${by('RED-BUT-NOT-VIA-THIS-METRIC')}   gate caught it via a different measure`);
  L.push(`    NO-TEETH                     ${by('NO-TEETH')}   defect landed, instrument did not notice`);
  L.push(`    NOT-APPLIED                  ${by('NOT-APPLIED')}   UNTRUSTED, not passing`);
  for (const c of Object.values(coverage)) {
    L.push(`    ${c.gate}: ${c.exercised.length}/${c.publishedMetrics} published metrics exercised`);
    for (const k of c.unexercised.slice(0, 30)) L.push(`        UNEXERCISED (untrusted) · ${k}`);
    if (c.unexercised.length > 30) L.push(`        … ${c.unexercised.length - 30} more unexercised`);
  }
  L.push('');
}
if (scoredAbsent.length) {
  L.push('  SCORED INSTRUMENTS ABSENT FROM THIS TREE — reported, not skipped');
  for (const s of scoredAbsent) L.push(`    · ${s}`);
  L.push('    Every defect above was therefore judged by the existing gates alone.');
  L.push('');
}

L.push('  OMITTED GATE FAMILIES — declared roots, justified omissions');
for (const [fam, why] of OMITTED_GATE_FAMILIES) L.push(`    · ${fam}: ${why}`);
L.push('');
L.push(`  REPO SAFETY: git status --porcelain ${untouched ? 'IDENTICAL before and after — the working tree was never written' : 'CHANGED — investigate before trusting this run'}`);
L.push('');
L.push('  HONEST LIMITS — what these numbers do NOT capture');
L.push('    Every measure here is a property of files. None of them is design quality.');
L.push('    A page can score perfectly and be ugly, incoherent, or wrong for its reader.');
L.push('    Not measured, and not measurable by this harness: visual hierarchy (is the');
L.push('    most important thing the most prominent thing), typographic rhythm, colour');
L.push('    HARMONY as opposed to colour COUNT, whether an archetype\'s shared shell is');
L.push('    the RIGHT shell, information density, emotional register, and whether a');
L.push('    reader trusts the page. There is also no browser in this container: every');
L.push('    contrast number is a selector-graph approximation, not a render, and nothing');
L.push('    here has seen a screen reader, a real viewport, or a human.');
L.push('    A human still has to look at the pages. These instruments only guarantee');
L.push('    that when the measurable half gets worse, someone finds out.');
L.push('');
console.log(L.join('\n'));

if (has('--json')) {
  fs.writeFileSync(OUT, JSON.stringify({
    _doc: 'Measured, not inferred: which gates go red when a NAMED design defect is deliberately introduced. Produced by scripts/audit-design-teeth.mjs against a sandbox copy of the repo — the working tree is never written. UNCAUGHT and UNEXERCISED are review queues, not verdicts of worthlessness.',
    _generator: 'scripts/audit-design-teeth.mjs',
    generatedAt: new Date().toISOString().slice(0, 10),
    ref, refCommit: refSha,
    repoWorkingTreeUntouched: untouched,
    gateBaseline, scoredAbsent, coverage, results,
    headline: {
      defectsApplied: applied.length,
      uncaughtByEveryExistingGate: uncaughtByAnyExisting.length,
      uncaught: uncaughtByAnyExisting.map((r) => r.id),
    },
  }, null, 2) + '\n');
  console.log(`Wrote ${path.relative(REPO, OUT)}`);
}

if (hardFailure) {
  console.error(`\n[audit-design-teeth] HARD FAILURE: ${hardFailure}`);
  process.exit(1);
}
process.exit(0);

} // end RAN_DIRECTLY
