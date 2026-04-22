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

// --- buildHandoffMarkdown: golden-path structure ------------------
{
  const md = buildHandoffMarkdown(SAMPLE_PAYLOAD);
  assert('md: starts with H1 header',           md.startsWith('# Website audit handoff — pizzajoint.example'));
  assert('md: includes score',                  md.indexOf('Score **62/100**') !== -1);
  assert('md: includes captured date',          md.indexOf('captured 2026-04-12') !== -1);
  assert('md: includes audited URL',            md.indexOf('https://pizzajoint.example/') !== -1);
  assert('md: includes permalink URL',          md.indexOf('?s=ABCDEFGHJK') !== -1);
  assert('md: includes verdict in blockquote',  md.indexOf('> Solid footing with room to tighten up.') !== -1);
  assert('md: action header reflects count',    md.indexOf('## Action items (4)') !== -1);
  // Failures come first, in self/dev/rebuild order.
  const i1 = md.indexOf('1. Mobile viewport');
  const i2 = md.indexOf('2. HTTPS everywhere');
  const i3 = md.indexOf('3. Menu published');
  const i4 = md.indexOf('4. Hours up to date');
  assert('md: items appear in priority order', i1 > 0 && i2 > i1 && i3 > i2 && i4 > i3,
    'got: ' + JSON.stringify({ i1, i2, i3, i4 }));
  assert('md: passing checks are NOT listed',   md.indexOf('schema-restaurant') === -1 && md.indexOf('Restaurant schema present') === -1);
  assert('md: state labels rendered',           md.indexOf('NEEDS FIX') !== -1 && md.indexOf('NEEDS REVIEW') !== -1);
  assert('md: effort labels rendered',          md.indexOf('~5 min') !== -1 && md.indexOf('~30 min') !== -1 && md.indexOf('half-day project') !== -1);
  assert('md: footer includes muntin link',     md.indexOf('muntin.digital/tools/audits/restaurant') !== -1);
}

// --- buildHandoffMarkdown: empty checks array ---------------------
{
  const md = buildHandoffMarkdown({ ...SAMPLE_PAYLOAD, checks: [] });
  assert('md (empty): includes "no actionable" copy', md.indexOf('No actionable items') !== -1);
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

// --- buildHandoffPrintableHtml: golden-path structure -------------
{
  const html = buildHandoffPrintableHtml(SAMPLE_PAYLOAD);
  assert('html: starts with doctype',                 html.toLowerCase().startsWith('<!doctype html>'));
  assert('html: lang attribute matches payload',      html.indexOf('lang="en"') !== -1);
  assert('html: title includes host',                 html.indexOf('<title>Website audit handoff — pizzajoint.example</title>') !== -1);
  assert('html: H1 includes host',                    html.indexOf('<h1>pizzajoint.example</h1>') !== -1);
  assert('html: score badge present',                 html.indexOf('Score <strong>62/100</strong>') !== -1);
  assert('html: captured date present',               html.indexOf('captured 2026-04-12') !== -1);
  assert('html: permalink rendered as anchor',        html.indexOf('href="https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK"') !== -1);
  assert('html: verdict in pull-quote container',     html.indexOf('class="verdict"') !== -1 && html.indexOf('Solid footing with room to tighten up.') !== -1);
  assert('html: action-items section header',         html.indexOf('Action items (4)') !== -1);
  assert('html: state-fail chip class present',       html.indexOf('class="chip state-fail"') !== -1);
  assert('html: state-unverified chip class present', html.indexOf('class="chip state-unverified"') !== -1);
  assert('html: pass check NOT rendered',             html.indexOf('Restaurant schema present') === -1);
  assert('html: print media query in style',          html.indexOf('@media print') !== -1);
  assert('html: muntin footer link present',          html.indexOf('href="https://muntin.digital/tools/audits/restaurant/"') !== -1);
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
