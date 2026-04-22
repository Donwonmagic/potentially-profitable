#!/usr/bin/env node
// D5: developer-handoff doc regression test.
// Run via: `node scripts/test-handoff-doc.mjs`
//
// Locks the contract of the buildHandoffMarkdown +
// buildHandoffPrintableHtml + sortChecksForHandoff helpers added to
// restaurant-checks.js. These produce the artifact that REPLACES the
// generic audit PDF for the "send this to my web developer" use case;
// the order, framing, and field round-tripping all need to stay
// stable as the surrounding code evolves.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  buildHandoffMarkdown,
  buildHandoffPrintableHtml,
  sortChecksForHandoff,
} = require('../tools/audits/restaurant/restaurant-checks.js');

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// Sample input — three failing checks of mixed effort, one unverified,
// one passing. Mirrors the real audit shape closely enough that the
// generator is exercised end-to-end.
const SAMPLE_PAYLOAD = {
  auditedUrl:   'https://pizzajoint.example/',
  host:         'pizzajoint.example',
  score:        62,
  capturedAt:   Date.UTC(2026, 3, 12, 17, 30, 0), // 2026-04-12
  permalinkUrl: 'https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK',
  subtype:      'casual-dining',
  language:     'en',
  verdict:      'Solid footing with room to tighten up.',
  checks: [
    { id: 'mobile-viewport', title: 'Mobile viewport meta tag',  state: 'fail', minutes: 5,   effort: 'self',    impact: 'Mobile traffic bounces when zoom-to-read is required.', note: 'No <meta name="viewport"> tag detected.' },
    { id: 'https',           title: 'HTTPS everywhere',          state: 'fail', minutes: 30,  effort: 'dev',     impact: 'Browsers warn visitors about insecure pages.',          note: 'http:// resources detected on https:// pages.' },
    { id: 'menu-published',  title: 'Menu published on the site', state: 'fail', minutes: 240, effort: 'rebuild', impact: 'Owners hand $$ to aggregators when the menu lives on a third party.', note: 'No menu page detected within 2 hops of /' },
    { id: 'hours-current',   title: 'Hours up to date',          state: 'unverified', minutes: 5, effort: 'self', impact: 'Wrong hours produce 1-star reviews about closed doors.', note: 'Hours found but freshness could not be confirmed.' },
    { id: 'schema-restaurant', title: 'Restaurant schema present', state: 'pass', minutes: null, effort: null, impact: null, note: null }
  ]
};

// --- sortChecksForHandoff: state ranking + effort secondary --------
{
  const sorted = sortChecksForHandoff(SAMPLE_PAYLOAD.checks);
  // Failures must come before unverified must come before pass.
  const states = sorted.map(c => c.state);
  assertEq('sort: state order', states, ['fail','fail','fail','unverified','pass']);
  // Within failures, self-effort first (smallest), then dev, then rebuild.
  const failureEfforts = sorted.filter(c => c.state === 'fail').map(c => c.effort);
  assertEq('sort: failure efforts ordered self < dev < rebuild', failureEfforts, ['self','dev','rebuild']);
}

// --- sortChecksForHandoff: minute tiebreaker ----------------------
{
  const sorted = sortChecksForHandoff([
    { id: 'a', state: 'fail', effort: 'dev', minutes: 90 },
    { id: 'b', state: 'fail', effort: 'dev', minutes: 30 },
    { id: 'c', state: 'fail', effort: 'dev', minutes: 60 },
  ]);
  assertEq('sort: minute tiebreaker ascending', sorted.map(s => s.id), ['b','c','a']);
}

// --- sortChecksForHandoff: input invariance -----------------------
{
  const input = [{ id: 'x', state: 'fail' }, { id: 'y', state: 'pass' }];
  const sorted = sortChecksForHandoff(input);
  assert('sort returns a NEW array (does not mutate input)', sorted !== input);
  assertEq('input order preserved after sort', input.map(i => i.id), ['x','y']);
}

// --- sortChecksForHandoff: defensive on garbage input -------------
assertEq('sort: null input → []',      sortChecksForHandoff(null),      []);
assertEq('sort: undefined input → []', sortChecksForHandoff(undefined), []);
assertEq('sort: non-array → []',       sortChecksForHandoff({}),         []);

// --- buildHandoffMarkdown: golden-path structure (EN voice) -------
{
  const md = buildHandoffMarkdown(SAMPLE_PAYLOAD);
  assert('md (EN): starts with localized H1',   md.startsWith('# Restaurant website audit — pizzajoint.example'));
  assert('md (EN): bolded score line',          md.indexOf('**Score 62/100**') !== -1);
  assert('md (EN): includes captured date',     md.indexOf('captured 2026-04-12') !== -1);
  assert('md (EN): audited URL line',           md.indexOf('**Audited URL:** https://pizzajoint.example/') !== -1);
  assert('md (EN): permalink line',             md.indexOf('**Live audit:** https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK') !== -1);
  assert('md (EN): verdict in blockquote',      md.indexOf('> Solid footing with room to tighten up.') !== -1);
  assert('md (EN): owner-language action header', md.indexOf('## What to fix first (4)') !== -1);
  // Failures come first, in self/dev/rebuild order.
  const i1 = md.indexOf('1. Mobile viewport');
  const i2 = md.indexOf('2. HTTPS everywhere');
  const i3 = md.indexOf('3. Menu published');
  const i4 = md.indexOf('4. Hours up to date');
  assert('md (EN): priority ordering', i1 > 0 && i2 > i1 && i3 > i2 && i4 > i3,
    'got: ' + JSON.stringify({ i1, i2, i3, i4 }));
  assert('md (EN): passing checks NOT listed',  md.indexOf('Restaurant schema present') === -1);
  assert('md (EN): warmer state labels',        md.indexOf('To fix') !== -1 && md.indexOf('To confirm') !== -1);
  assert('md (EN): no shouty SHOUTY labels',    md.indexOf('NEEDS FIX') === -1 && md.indexOf('NEEDS REVIEW') === -1);
  assert('md (EN): effort labels rendered',     md.indexOf('~5 min') !== -1 && md.indexOf('~30 min') !== -1 && md.indexOf('half-day project') !== -1);
  assert('md (EN): why-this-matters phrase',    md.indexOf('**Why this matters:**') !== -1);
  assert('md (EN): scope-of-work header',       md.indexOf('## Scope of work') !== -1);
  assert('md (EN): scope body present',         md.indexOf('sorted by priority') !== -1);
  assert('md (EN): footer voice line',          md.indexOf('Generated by the Muntin restaurant website audit') !== -1);
}

// --- buildHandoffMarkdown: ES voice round-trip --------------------
{
  const md = buildHandoffMarkdown({ ...SAMPLE_PAYLOAD, language: 'es' });
  assert('md (ES): localized H1 prefix',        md.startsWith('# Auditoría del sitio web del restaurante — pizzajoint.example'));
  assert('md (ES): localized score line',       md.indexOf('**Puntuación 62/100**') !== -1);
  assert('md (ES): localized "capturada"',      md.indexOf('capturada 2026-04-12') !== -1);
  assert('md (ES): localized audited label',    md.indexOf('**URL auditada:**') !== -1);
  assert('md (ES): localized permalink label',  md.indexOf('**Auditoría en vivo:**') !== -1);
  assert('md (ES): localized action header',    md.indexOf('## Qué arreglar primero (4)') !== -1);
  assert('md (ES): localized state labels',     md.indexOf('Por arreglar') !== -1 && md.indexOf('Por confirmar') !== -1);
  assert('md (ES): localized why-this-matters', md.indexOf('**Por qué importa:**') !== -1);
  assert('md (ES): localized scope header',     md.indexOf('## Alcance del trabajo') !== -1);
  assert('md (ES): localized scope body',       md.indexOf('ordenada por prioridad') !== -1);
  assert('md (ES): localized footer',           md.indexOf('Generada por la auditoría de sitios web de restaurantes de Muntin') !== -1);
  // Spot-check no English labels leaked through.
  assert('md (ES): no English action header',   md.indexOf('## What to fix first') === -1);
  assert('md (ES): no English audited label',   md.indexOf('Audited URL:') === -1);
  assert('md (ES): no English scope header',    md.indexOf('Scope of work') === -1);
}

// --- buildHandoffMarkdown: empty list omits scope paragraph -------
{
  const md = buildHandoffMarkdown({
    ...SAMPLE_PAYLOAD,
    checks: [{ id: 'x', state: 'pass', title: 'X' }],
  });
  assert('md (empty actions): localized empty copy', md.indexOf('Every check is passing') !== -1);
  assert('md (empty actions): NO scope paragraph',   md.indexOf('Scope of work') === -1);
}

// --- buildHandoffMarkdown: empty checks array ---------------------
{
  const md = buildHandoffMarkdown({ ...SAMPLE_PAYLOAD, checks: [] });
  assert('md (empty): localized empty copy', md.indexOf('Every check is passing') !== -1);
}

// --- buildHandoffMarkdown: missing optional fields ----------------
{
  const md = buildHandoffMarkdown({
    auditedUrl: 'https://example.com/',
    host:       'example.com',
    score:      80,
    checks:     [{ id: 'x', title: 'X', state: 'fail' }],
  });
  assert('md (no permalink): omits permalink line', md.indexOf('Live audit:') === -1);
  assert('md (no verdict): no blockquote',          md.indexOf('> ') === -1);
  assert('md (no date): omits captured suffix',     md.indexOf('captured ') === -1);
  assert('md: includes the one fail',               md.indexOf('1. X') !== -1);
}

// --- buildHandoffMarkdown: defensive ------------------------------
assertEq('md: null payload → empty string',       buildHandoffMarkdown(null),      '');
assertEq('md: undefined payload → empty string',  buildHandoffMarkdown(undefined), '');
assertEq('md: string payload → empty string',     buildHandoffMarkdown('nope'),    '');

// --- buildHandoffMarkdown: markdown escape for backticks/pipes ----
{
  const md = buildHandoffMarkdown({
    auditedUrl: 'https://x.example/',
    host:       'x.example',
    score:      50,
    checks:     [{ id: 'y', title: 'Use `<picture>` and a|b table syntax', state: 'fail' }],
  });
  // Backtick + pipe must be escaped to avoid breaking surrounding Markdown.
  assert('md: backticks escaped in title', md.indexOf('Use \\`<picture>\\` and a\\|b table syntax') !== -1,
    'got title line: ' + (md.match(/3?\. .*/) || ['(none)'])[0]);
}

// --- buildHandoffPrintableHtml: golden-path structure (EN voice) --
{
  const html = buildHandoffPrintableHtml(SAMPLE_PAYLOAD);
  assert('html (EN): starts with doctype',            html.toLowerCase().startsWith('<!doctype html>'));
  assert('html (EN): lang="en"',                      html.indexOf('lang="en"') !== -1);
  assert('html (EN): localized title',                html.indexOf('<title>Restaurant website audit — pizzajoint.example</title>') !== -1);
  assert('html (EN): H1 includes host',               html.indexOf('<h1>pizzajoint.example</h1>') !== -1);
  assert('html (EN): localized eyebrow',              html.indexOf('class="doc-eyebrow">Developer handoff</p>') !== -1);
  assert('html (EN): score with strong-tag bolded',   html.indexOf('Score <strong>62/100</strong>') !== -1);
  assert('html (EN): captured-date suffix',           html.indexOf('captured 2026-04-12') !== -1);
  assert('html (EN): audited-URL label localized',    html.indexOf('<strong>Audited URL:</strong>') !== -1);
  assert('html (EN): permalink-label localized',      html.indexOf('<strong>Live audit:</strong>') !== -1);
  assert('html (EN): permalink anchor',               html.indexOf('href="https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK"') !== -1);
  assert('html (EN): verdict pull-quote',             html.indexOf('class="verdict"') !== -1 && html.indexOf('Solid footing with room to tighten up.') !== -1);
  assert('html (EN): owner-language section header',  html.indexOf('What to fix first (4)') !== -1);
  assert('html (EN): state-fail chip',                html.indexOf('class="chip state-fail"') !== -1);
  assert('html (EN): state-unverified chip',          html.indexOf('class="chip state-unverified"') !== -1);
  assert('html (EN): warmer state copy',              html.indexOf('>To fix<') !== -1 && html.indexOf('>To confirm<') !== -1);
  assert('html (EN): pass check NOT rendered',        html.indexOf('Restaurant schema present') === -1);
  assert('html (EN): why-this-matters phrase',        html.indexOf('<strong>Why this matters:</strong>') !== -1);
  assert('html (EN): scope-of-work section header',   html.indexOf('Scope of work') !== -1);
  assert('html (EN): scope body container',           html.indexOf('class="scope-body"') !== -1);
  assert('html (EN): print media query',              html.indexOf('@media print') !== -1);
  assert('html (EN): footer voice line',              html.indexOf('Generated by the Muntin restaurant website audit') !== -1);
}

// --- buildHandoffPrintableHtml: ES voice round-trip ---------------
{
  const html = buildHandoffPrintableHtml({ ...SAMPLE_PAYLOAD, language: 'es' });
  assert('html (ES): lang="es"',                      html.indexOf('lang="es"') !== -1);
  assert('html (ES): localized title prefix',         html.indexOf('<title>Auditoría del sitio web del restaurante — pizzajoint.example</title>') !== -1);
  assert('html (ES): localized eyebrow',              html.indexOf('class="doc-eyebrow">Para tu desarrollador</p>') !== -1);
  assert('html (ES): localized score label',          html.indexOf('Puntuación <strong>62/100</strong>') !== -1);
  assert('html (ES): localized "capturada"',          html.indexOf('capturada 2026-04-12') !== -1);
  assert('html (ES): localized audited label',        html.indexOf('<strong>URL auditada:</strong>') !== -1);
  assert('html (ES): localized permalink label',      html.indexOf('<strong>Auditoría en vivo:</strong>') !== -1);
  assert('html (ES): localized actions header',       html.indexOf('Qué arreglar primero (4)') !== -1);
  assert('html (ES): localized state-fail copy',      html.indexOf('>Por arreglar<') !== -1);
  assert('html (ES): localized state-unverified copy', html.indexOf('>Por confirmar<') !== -1);
  assert('html (ES): localized why-this-matters',     html.indexOf('<strong>Por qué importa:</strong>') !== -1);
  assert('html (ES): localized scope header',         html.indexOf('Alcance del trabajo') !== -1);
  assert('html (ES): localized footer line',          html.indexOf('Generada por la auditoría de sitios web de restaurantes de Muntin') !== -1);
}

// --- buildHandoffPrintableHtml: HTML escape applied --------------
{
  const html = buildHandoffPrintableHtml({
    auditedUrl: 'https://x.example/',
    host:       'x.example',
    score:      50,
    checks:     [{ id: 'y', title: '<script>alert("xss")</script>', state: 'fail', impact: '<b>nope</b>' }],
  });
  assert('html: title HTML-escaped',  html.indexOf('&lt;script&gt;alert(&quot;xss&quot;)') !== -1);
  assert('html: impact HTML-escaped', html.indexOf('&lt;b&gt;nope&lt;/b&gt;') !== -1);
  assert('html: no raw script tag',   html.indexOf('<script>alert') === -1);
}

// --- buildHandoffPrintableHtml: defensive -------------------------
assertEq('html: null payload → empty',      buildHandoffPrintableHtml(null),      '');
assertEq('html: undefined payload → empty', buildHandoffPrintableHtml(undefined), '');
assertEq('html: string payload → empty',    buildHandoffPrintableHtml('nope'),    '');

// --- buildHandoffPrintableHtml: language attribute round-trips ----
{
  const html = buildHandoffPrintableHtml({ ...SAMPLE_PAYLOAD, language: 'es' });
  assert('html (es): lang="es" attribute', html.indexOf('lang="es"') !== -1);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll handoff-doc tests passed.');
