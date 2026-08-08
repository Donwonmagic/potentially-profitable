#!/usr/bin/env node
/**
 * ARCHETYPE CONFORMANCE — did the design actually reach the pages?
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * This is the gate whose absence let a specimen ship to /about/ while 1,326
 * other pages disagreed with it and CI stayed green. Every existing design gate
 * asks "is this page well-formed?" — none asked "does this page look like the
 * others in its class?" A redesign that lands on one page is indistinguishable,
 * to every gate this repo had, from a redesign that landed everywhere. Worse,
 * the diff of a one-page redesign looks like progress, so review does not catch
 * it either.
 *
 * `data/surface-archetypes.json` assigns all 1,327 routable pages to 15
 * archetypes, and states the premise plainly: "the archetype is the design unit
 * — build one specimen per surviving archetype and the site is covered,
 * provably." That claim is only worth something if something checks it. This is
 * that check.
 *
 * HOW THE EXPECTED SIGNATURE IS DERIVED — from the members, never from a list
 *
 * Nothing here hardcodes what a shell should contain. For each archetype the
 * gate reads its own members and derives:
 *
 *   EXPECTED  a shell feature carried by >= 90% of members. If nearly every
 *             page in a class links site.css and carries body.page-glossary,
 *             that IS the class's shell, by observation.
 *   RARE      a feature exactly ONE member carries (in an archetype of >= 4).
 *             A marker one page in its class has is by definition not the
 *             shell — it is either a redesign that reached one page, or a
 *             leftover. Both are the defect this gate exists for.
 *
 * A page conforms when it carries every EXPECTED feature and no RARE one. That
 * makes the gate symmetric: it fails a page the design left behind AND a page
 * the design reached alone. The one-page redesign trips the second rule.
 *
 * WHY signatureFeatures IS REPORTED PER ARCHETYPE
 *
 * An archetype whose members agree on nothing has an empty EXPECTED set, and
 * then every member conforms vacuously — 100% that means nothing. Reporting the
 * size of each signature keeps a vacuous 100% from reading as a healthy one.
 *
 * DELETION IS NOT DESIGN IMPROVEMENT — `routesEmpty` counts member pages that
 * have been reduced to a stub. Emptying a page removes its hex literals and its
 * off-scale font sizes, so without this counter, deleting content would improve
 * every other number on the scorecard.
 *
 * Usage:
 *   node scripts/check-archetype-conformance.mjs                 # report
 *   node scripts/check-archetype-conformance.mjs --json
 *   node scripts/check-archetype-conformance.mjs --write-baseline
 *   node scripts/check-archetype-conformance.mjs --check         # fail on regression
 *   node scripts/check-archetype-conformance.mjs --archetype <id>
 *   node scripts/check-archetype-conformance.mjs --self-test
 *
 * Exit codes:
 *   0 — measured (or --check found no regression)
 *   1 — --check found a regression, or --self-test failed, or inputs missing
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

const ARCHETYPES = path.join('data', 'surface-archetypes.json');
const INVENTORY = path.join('data', 'surface-inventory.json');
const OUT_JSON = path.join('data', 'archetype-conformance.json');
/** Internal telemetry, deliberately NOT under data/ — _headers serves data/*.jsonl as CC0. */
const OUT_HISTORY = path.join('docs', 'handoff', 'telemetry', 'archetype-conformance-history.jsonl');

/** A feature carried by this share of members or more is the class's shell. */
export const EXPECTED_SHARE = 0.9;
/** Below this member count, "exactly one page has it" is not evidence of anything. */
export const RARE_MIN_MEMBERS = 4;

/* ================================================================== *
 * 1. FEATURE EXTRACTION — pure, exported so --self-test can pin it.
 * ================================================================== */

/**
 * The SHELL features of a page: what stylesheets it links and what classes its
 * <body> carries. Deliberately NOT the content — two glossary pages define
 * different terms and must still count as the same archetype.
 */
export function shellFeatures(html) {
  const f = new Set();

  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) continue;
    const href = (tag.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i) || [])
      .slice(2).find(Boolean);
    if (href) f.add(`sheet:${path.basename(href.split('?')[0])}`);
  }

  const body = html.match(/<body\b([^>]*)>/i);
  if (body) {
    const cls = (body[1].match(/\sclass\s*=\s*("([^"]*)"|'([^']*)')/i) || []).slice(2).find(Boolean) || '';
    for (const c of cls.split(/\s+/).filter(Boolean)) f.add(`bodyclass:${c}`);
    const dp = body[1].match(/\sdata-page\s*=\s*("([^"]*)"|'([^']*)')/i);
    if (dp) f.add(`datapage:${(dp[2] ?? dp[3])}`);
  }

  return f;
}

/** Visible text length of <body>, used to tell a page from a stub. */
export function bodyTextLength(html) {
  const m = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const inner = m ? m[1] : html;
  return inner
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

/** A page below this many visible characters is a stub, not a page. */
export const EMPTY_TEXT_CHARS = 120;

/** Per-page design-discipline counts. Hex literals are the headline. */
export function disciplineOf(html) {
  let hexLiterals = 0, styleBlocks = 0, inlineStyles = 0, svgPaints = 0;
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    styleBlocks++;
    hexLiterals += countHex(m[1]);
  }
  for (const m of html.matchAll(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const v = m[2] ?? m[3] ?? '';
    inlineStyles++;
    hexLiterals += countHex(v);
  }
  for (const m of html.matchAll(/\s(?:fill|stroke|stop-color)\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const v = (m[2] ?? m[3] ?? '').trim();
    if (!v || /^(none|currentcolor|inherit|transparent|url\()/i.test(v)) continue;
    svgPaints++;
    hexLiterals += countHex(v);
  }
  return { hexLiterals, styleBlocks, inlineStyles, svgPaints };
}

function countHex(s) {
  let n = 0;
  for (const m of String(s).matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const len = m[0].length - 1;
    if (len === 3 || len === 4 || len === 6 || len === 8) n++;
  }
  return n;
}

/* ================================================================== *
 * 2. SIGNATURE DERIVATION — the core idea, pure and testable.
 * ================================================================== */

/**
 * Given every member's feature set, derive what this archetype's shell IS.
 * `featureSets` is an array of Set<string>.
 */
export function deriveSignature(featureSets, {
  expectedShare = EXPECTED_SHARE, rareMinMembers = RARE_MIN_MEMBERS,
} = {}) {
  const n = featureSets.length;
  const counts = new Map();
  for (const s of featureSets) for (const f of s) counts.set(f, (counts.get(f) || 0) + 1);

  const expected = new Set(), rare = new Set();
  for (const [f, c] of counts) {
    if (n > 0 && c / n >= expectedShare) expected.add(f);
    if (n >= rareMinMembers && c === 1) rare.add(f);
  }
  return { expected, rare, counts, members: n };
}

/** A page conforms when it has every expected feature and no rare one. */
export function conformsTo(features, signature) {
  const missing = [...signature.expected].filter((f) => !features.has(f));
  const stray = [...features].filter((f) => signature.rare.has(f));
  return { conforms: missing.length === 0 && stray.length === 0, missing, stray };
}

/* ================================================================== *
 * 3. MEASUREMENT
 * ================================================================== */

export function measure(root, { only = null } = {}) {
  const archPath = path.join(root, ARCHETYPES);
  const invPath = path.join(root, INVENTORY);
  if (!fs.existsSync(archPath)) throw new Error(`missing ${ARCHETYPES}`);
  if (!fs.existsSync(invPath)) throw new Error(`missing ${INVENTORY}`);

  const arch = JSON.parse(fs.readFileSync(archPath, 'utf8'));
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const fileOf = new Map(inv.pages.map((p) => [p.route, p.filePath]));
  const meta = new Map(arch.archetypes.map((a) => [a.id, a]));

  // group routes by archetype
  const groups = new Map();
  for (const a of arch.assignment) {
    if (only && a.archetype !== only) continue;
    if (!groups.has(a.archetype)) groups.set(a.archetype, []);
    groups.get(a.archetype).push(a.route);
  }

  // pass 1 — read every member once
  const read = new Map(); // archetype -> [{route, rel, features, textLen, discipline}]
  let routesMissing = 0;
  for (const [id, routes] of groups) {
    const rows = [];
    for (const route of routes.sort()) {
      const rel = fileOf.get(route);
      const abs = rel ? path.join(root, rel) : null;
      if (!abs || !fs.existsSync(abs)) { routesMissing++; continue; }
      const html = fs.readFileSync(abs, 'utf8');
      rows.push({
        route, rel,
        features: shellFeatures(html),
        textLen: bodyTextLength(html),
        discipline: disciplineOf(html),
      });
    }
    read.set(id, rows);
  }

  // pass 2 — derive signature per archetype, then score
  const archetypes = [];
  let conforming = 0, assessed = 0, routesEmpty = 0;
  const totals = { hexLiterals: 0, styleBlocks: 0, inlineStyles: 0, svgPaints: 0 };
  const offenders = [];

  for (const [id, rows] of [...read.entries()].sort()) {
    const sig = deriveSignature(rows.map((r) => r.features));
    const m = meta.get(id) || {};
    let ok = 0, empty = 0;
    const d = { hexLiterals: 0, styleBlocks: 0, inlineStyles: 0, svgPaints: 0 };
    const bad = [];

    for (const r of rows) {
      const verdict = conformsTo(r.features, sig);
      const isEmpty = r.textLen < EMPTY_TEXT_CHARS;
      if (isEmpty) empty++;
      if (verdict.conforms && !isEmpty) ok++;
      else bad.push({ route: r.route, missing: verdict.missing, stray: verdict.stray, empty: isEmpty });
      for (const k of Object.keys(d)) d[k] += r.discipline[k];
    }

    conforming += ok; assessed += rows.length; routesEmpty += empty;
    for (const k of Object.keys(totals)) totals[k] += d[k];
    offenders.push(...bad.slice(0, 5).map((b) => ({ archetype: id, ...b })));

    archetypes.push({
      id,
      name: m.name || id,
      verdict: m.verdict || null,
      members: rows.length,
      conforming: ok,
      empty,
      conformance: rows.length ? Math.round((ok / rows.length) * 10000) / 100 : 0,
      signatureFeatures: sig.expected.size,
      rareFeatures: sig.rare.size,
      signature: [...sig.expected].sort(),
      discipline: {
        ...d,
        hexPerPage: rows.length ? Math.round((d.hexLiterals / rows.length) * 10) / 10 : 0,
      },
      nonConforming: bad.slice(0, 8),
    });
  }

  const summary = {
    pages: assessed,
    conforming,
    nonConforming: assessed - conforming,
    conformance: assessed ? Math.round((conforming / assessed) * 10000) / 100 : 0,
    routesEmpty,
    routesMissing,
    archetypes: archetypes.length,
    vacuousArchetypes: archetypes.filter((a) => a.signatureFeatures === 0).length,
    hexLiterals: totals.hexLiterals,
    styleBlocks: totals.styleBlocks,
    inlineStyles: totals.inlineStyles,
    svgPaints: totals.svgPaints,
  };

  return { summary, archetypes, offenders: offenders.slice(0, 40) };
}

/* ================================================================== *
 * 4. REGRESSION
 * ================================================================== */

export const WORSE = {
  'summary.conforming': 'down',
  'summary.conformance': 'down',
  'summary.nonConforming': 'up',
  'summary.routesEmpty': 'up',
  'summary.routesMissing': 'up',
  'summary.vacuousArchetypes': 'up',
  'summary.hexLiterals': 'up',
  'summary.inlineStyles': 'up',
  'summary.svgPaints': 'up',
};

export function flatten(res) {
  const out = {};
  for (const [k, v] of Object.entries(res.summary)) if (typeof v === 'number') out[`summary.${k}`] = v;
  for (const a of res.archetypes) {
    out[`archetype.${a.id}.conformance`] = a.conformance;
    for (const [k, v] of Object.entries(a.discipline)) out[`archetype.${a.id}.${k}`] = v;
  }
  return out;
}

export function regressions(before, after, worse = WORSE) {
  const out = [];
  const dirFor = (k) => worse[k]
    ?? (/\.conformance$/.test(k) ? 'down' : /\.(hexLiterals|inlineStyles|svgPaints|hexPerPage)$/.test(k) ? 'up' : null);
  for (const k of Object.keys(after || {})) {
    const dir = dirFor(k);
    if (!dir) continue;
    const b = before?.[k], a = after?.[k];
    if (typeof b !== 'number' || typeof a !== 'number') continue;
    if (dir === 'up' ? a > b : a < b) out.push({ metric: k, before: b, after: a, dir });
  }
  return out;
}

/* ================================================================== *
 * 5. CLI
 * ================================================================== */

function report(res) {
  const s = res.summary;
  const L = [];
  L.push('\nARCHETYPE CONFORMANCE — does the design reach the pages?');
  L.push('='.repeat(72));
  L.push(`\n  ${s.conforming} of ${s.pages} pages conform to their own archetype's derived shell  (${s.conformance}%)`);
  L.push(`  ${s.routesEmpty} stub pages · ${s.routesMissing} assigned routes with no file · ${s.vacuousArchetypes} vacuous archetypes (no shared signature)`);
  L.push(`  page-level literals: ${s.hexLiterals.toLocaleString('en-US')} hex across ${s.styleBlocks.toLocaleString('en-US')} <style> blocks, `
    + `${s.inlineStyles.toLocaleString('en-US')} style="" attrs, ${s.svgPaints.toLocaleString('en-US')} svg paints`);
  L.push('');
  L.push('  archetype              members  conform      %   sig  rare   hex/page');
  L.push('  ' + '-'.repeat(70));
  for (const a of [...res.archetypes].sort((x, y) => x.conformance - y.conformance)) {
    L.push('  ' + a.id.padEnd(22)
      + String(a.members).padStart(7)
      + String(a.conforming).padStart(9)
      + String(a.conformance.toFixed(2)).padStart(7)
      + String(a.signatureFeatures).padStart(6)
      + String(a.rareFeatures).padStart(6)
      + String(a.discipline.hexPerPage).padStart(11)
      + (a.signatureFeatures === 0 ? '   ← vacuous' : ''));
  }
  if (res.offenders.length) {
    L.push('\n  worst offenders (page left behind, or design reached only this page):');
    for (const o of res.offenders.slice(0, 12)) {
      const why = o.empty ? 'STUB'
        : o.stray.length ? `carries rare ${o.stray.slice(0, 2).join(',')}`
          : `missing ${o.missing.slice(0, 2).join(',')}`;
      L.push(`    ${o.archetype.padEnd(20)} ${o.route.slice(0, 44).padEnd(46)} ${why}`);
    }
  }
  L.push('');
  return L.join('\n');
}

function selfTest() {
  const t = [];
  const ok = (name, cond) => t.push({ name, pass: !!cond });
  const S = (...a) => new Set(a);

  ok('shellFeatures finds stylesheet',
    shellFeatures('<link rel="stylesheet" href="/assets/site.css">').has('sheet:site.css'));
  ok('shellFeatures strips query',
    shellFeatures('<link rel=stylesheet href="/assets/site.css?v=2">').has('sheet:site.css'));
  ok('shellFeatures finds body classes',
    shellFeatures('<body class="a b">').has('bodyclass:a'));
  ok('shellFeatures finds data-page',
    shellFeatures('<body data-page="glossary">').has('datapage:glossary'));
  ok('shellFeatures ignores non-stylesheet link',
    !shellFeatures('<link rel="icon" href="/x.css">').has('sheet:x.css'));

  ok('bodyTextLength ignores tags/script',
    bodyTextLength('<body><script>var x=123456789</script><p>hi</p></body>') === 2);
  ok('emptyPage is a stub',
    bodyTextLength('<!doctype html><html><head><title>x</title></head><body></body></html>') < EMPTY_TEXT_CHARS);

  ok('disciplineOf counts hex in style block',
    disciplineOf('<style>.a{color:#bada55;background:#c0ffee;border:1px solid #ff00aa}</style>').hexLiterals === 3);
  ok('disciplineOf counts inline style hex',
    disciplineOf('<p style="color:#bada55">').hexLiterals === 1);
  ok('disciplineOf counts svg paint hex',
    disciplineOf('<rect fill="#bada55" stroke="#c0ffee"/>').hexLiterals === 2);
  ok('disciplineOf skips fill=none',
    disciplineOf('<rect fill="none"/>').svgPaints === 0);

  // signature derivation
  const sets = [S('sheet:a', 'bodyclass:x'), S('sheet:a', 'bodyclass:x'),
    S('sheet:a', 'bodyclass:x'), S('sheet:a', 'bodyclass:x')];
  const sig = deriveSignature(sets);
  ok('deriveSignature: universal features are expected',
    sig.expected.has('sheet:a') && sig.expected.has('bodyclass:x'));
  ok('deriveSignature: nothing rare when all agree', sig.rare.size === 0);

  const withRare = [...sets.map((s) => new Set(s)), S('sheet:a', 'bodyclass:x', 'bodyclass:ONLY-ME')];
  const sig2 = deriveSignature(withRare);
  ok('deriveSignature: a one-page marker is RARE', sig2.rare.has('bodyclass:ONLY-ME'));
  ok('deriveSignature: rare marker is not expected', !sig2.expected.has('bodyclass:ONLY-ME'));
  ok('conformsTo: the page with the rare marker FAILS',
    !conformsTo(S('sheet:a', 'bodyclass:x', 'bodyclass:ONLY-ME'), sig2).conforms);
  ok('conformsTo: its siblings still pass',
    conformsTo(S('sheet:a', 'bodyclass:x'), sig2).conforms);
  ok('conformsTo: a page missing the shell FAILS',
    !conformsTo(S('bodyclass:x'), sig2).conforms);
  ok('conformsTo reports what is missing',
    conformsTo(S('bodyclass:x'), sig2).missing.includes('sheet:a'));

  const tiny = deriveSignature([S('a'), S('a', 'b')]);
  ok('deriveSignature: no RARE below the member floor', tiny.rare.size === 0);

  ok('regressions: conformance down is a regression',
    regressions({ 'summary.conformance': 99 }, { 'summary.conformance': 98 }).length === 1);
  ok('regressions: conformance up is fine',
    regressions({ 'summary.conformance': 98 }, { 'summary.conformance': 99 }).length === 0);
  ok('regressions: hexLiterals up is a regression',
    regressions({ 'summary.hexLiterals': 1 }, { 'summary.hexLiterals': 2 }).length === 1);
  ok('regressions: per-archetype conformance is covered by the fallback',
    regressions({ 'archetype.foo.conformance': 100 }, { 'archetype.foo.conformance': 99 }).length === 1);

  const failed = t.filter((x) => !x.pass);
  for (const x of t) console.log(`${x.pass ? '✓' : '✗'} ${x.name}`);
  console.log(`\n${t.length - failed.length}/${t.length} self-tests passed`);
  return failed.length === 0;
}

const RAN_DIRECTLY = process.argv[1] && path.resolve(process.argv[1]) === __filename;
const argv = RAN_DIRECTLY ? process.argv.slice(2) : [];
const has = (f) => argv.includes(f);
const arg = (f, fb = null) => { const i = argv.indexOf(f); return i === -1 ? fb : (argv[i + 1] ?? fb); };

if (RAN_DIRECTLY) {
  if (has('--self-test')) process.exit(selfTest() ? 0 : 1);

  let res;
  try {
    res = measure(REPO, { only: arg('--archetype') });
  } catch (e) {
    console.error(`✗ check-archetype-conformance: ${e.message}`);
    process.exit(1);
  }

  if (has('--json')) console.log(JSON.stringify({ asOf: new Date().toISOString(), ...res }, null, 2));
  else console.log(report(res));

  if (has('--write-baseline') || has('--record') || has('--baseline')) {
    const payload = { asOf: new Date().toISOString(), summary: res.summary, archetypes: res.archetypes, offenders: res.offenders };
    fs.mkdirSync(path.join(REPO, path.dirname(OUT_JSON)), { recursive: true });
    fs.writeFileSync(path.join(REPO, OUT_JSON), JSON.stringify(payload, null, 2) + '\n');
    fs.mkdirSync(path.join(REPO, path.dirname(OUT_HISTORY)), { recursive: true });
    fs.appendFileSync(path.join(REPO, OUT_HISTORY),
      JSON.stringify({ asOf: payload.asOf, metrics: flatten(res) }) + '\n');
    console.error(`recorded → ${OUT_JSON} and appended → ${OUT_HISTORY}`);
  }

  if (has('--check')) {
    const p = path.join(REPO, OUT_JSON);
    if (!fs.existsSync(p)) { console.error(`✗ no baseline at ${OUT_JSON} — run --write-baseline first`); process.exit(1); }
    const base = JSON.parse(fs.readFileSync(p, 'utf8'));
    const regs = regressions(flatten(base), flatten(res));
    if (regs.length) {
      console.error(`\n✗ archetype conformance: ${regs.length} regression(s) vs ${base.asOf}\n`);
      for (const r of regs.slice(0, 30)) console.error(`  ${r.metric}: ${r.before} → ${r.after} (worse is ${r.dir})`);
      console.error('');
      process.exit(1);
    }
    console.error(`✓ archetype conformance: no regression vs ${base.asOf}`);
  }
}
