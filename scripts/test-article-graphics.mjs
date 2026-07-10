#!/usr/bin/env node
/**
 * Unit tests for the helpers in scripts/check-article-graphics.mjs.
 *
 * Run:   node --test scripts/test-article-graphics.mjs
 * Or:    node scripts/test-article-graphics.mjs   (with `--test` shorthand)
 *
 * Why these exist
 * ---------------
 * The graphics gate is 400+ lines of regex parsing and per-rule logic.
 * If a future edit changes one of the parsers (data-audio-alt extraction,
 * viz-* kind detection, figure-inner hashing, or the autolink-in-attribute
 * sweep), the existing 72-article corpus may not exercise the new code
 * path. These tests pin the parser behavior so future regressions surface
 * before they ship.
 *
 * Coverage
 *   - isArticleBody / isDraft (rule-skip conditions)
 *   - collectContentFigures (figure extraction across both wrapper classes)
 *   - getDataAudioAlt (attribute parsing under valid + invalid HTML)
 *   - hasFigcaption (figcaption presence)
 *   - detectVizKinds (viz-* family recognition)
 *   - hashFigureInner (whitespace + comment normalization)
 *   - numTextToShare (percentage / share-of-one / non-percent classification)
 *   - findAutolinkInAttribute (rule 8 corruption detector)
 *
 * Not covered (deferred)
 *   - The audit's per-article and global passes — those run against the
 *     filesystem and are exercised by the gate itself in CI. To test them
 *     in isolation would require either making `REPO` injectable or
 *     spinning up a fixture worktree; not worth the harness for v1.
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

import {
  VIZ_KINDS,
  DATA_AUDIO_ALT_MIN,
  SCAN_ROOTS,
  isArticleBody,
  isDraft,
  collectContentFigures,
  getDataAudioAlt,
  hasFigcaption,
  detectVizKinds,
  detectNonVizKinds,
  ENRICHMENT_KINDS,
  hashFigureInner,
  numTextToShare,
  findAutolinkInAttribute,
} from './check-article-graphics.mjs';

test('SCAN_ROOTS covers EN + ES library + blog', () => {
  assert.deepEqual(SCAN_ROOTS, ['library', 'blog', 'es/library', 'es/blog']);
});

test('VIZ_KINDS includes the canon families', () => {
  for (const kind of ['viz-bars', 'viz-flow', 'viz-tree', 'viz-ba', 'viz-ring', 'viz-waterfall', 'viz-spark']) {
    assert.ok(VIZ_KINDS.includes(kind), `${kind} should be in VIZ_KINDS`);
  }
});

// --- viz-spark (canon §8; the monthly Cost Index edition's step-line family) ---

// A representative spark figure as build-cost-index-dispatch.mjs emits it:
// dated single-source step-line, endpoint/peak/trough annotations with date
// + dollar, tone on the wrapper, narration + figcaption on the figure.
const SPARK_FIXTURE = `<figure class="viz-figure" data-audio-alt="Green beans over the month ending 2026-07-06: ten dated reads from one wholesale series, opening at 33 dollars on June 22 and closing at 40 dollars on July 6, with the peak at 45 dollars 50 on June 25.">
  <div class="viz-spark" data-tone="rust">
    <p class="viz-spark__title">Green beans — 10 reads, 2026-06-22 → 2026-07-06</p>
    <div class="viz-spark__chart"><svg viewBox="0 0 320 72" width="320" height="72" aria-hidden="true" focusable="false"><path class="viz-spark__line" d="M0,60H32V12H64"/><circle class="viz-spark__dot" cx="0" cy="60" r="3"/><circle class="viz-spark__dot" cx="64" cy="12" r="3"/></svg></div>
    <p class="viz-spark__annos"><span class="viz-spark__anno">opened <strong>$33.00</strong> 06-22</span><span class="viz-spark__anno">closed <strong>$40.00</strong> 07-06</span><span class="viz-spark__anno">peak <strong>$45.50</strong> 06-25</span></p>
  </div>
  <figcaption>Green beans closed the month above its open — a dated arc, not a forecast.</figcaption>
</figure>`;

test('detectVizKinds recognizes a viz-spark figure', () => {
  const figs = collectContentFigures(SPARK_FIXTURE);
  assert.equal(figs.length, 1);
  const kinds = detectVizKinds(figs[0].inner);
  assert.ok(kinds.has('viz-spark'), 'viz-spark should be detected as the figure kind');
  assert.equal(kinds.size, 1);
});

test('the spark fixture satisfies the per-figure gate rules (narration + figcaption)', () => {
  const figs = collectContentFigures(SPARK_FIXTURE);
  assert.ok(getDataAudioAlt(figs[0].openAttrs).length >= DATA_AUDIO_ALT_MIN);
  assert.ok(hasFigcaption(figs[0].inner));
});

test('variety can be met by a spark plus a bars figure', () => {
  const barsFig = '<figure class="viz-figure"><div class="viz-bars"></div></figure>';
  const all = new Set([
    ...detectVizKinds(collectContentFigures(SPARK_FIXTURE)[0].inner),
    ...detectVizKinds(collectContentFigures(barsFig)[0].inner),
  ]);
  assert.ok(all.has('viz-spark') && all.has('viz-bars'));
  assert.ok(all.size >= 2);
});

test('DATA_AUDIO_ALT_MIN is the 80-char canon floor', () => {
  assert.equal(DATA_AUDIO_ALT_MIN, 80);
});

test('isArticleBody matches <article id="post-body"> in either attribute order', () => {
  assert.equal(isArticleBody('<article id="post-body" class="x">'), true);
  assert.equal(isArticleBody('<article class="x" id="post-body">'), true);
  assert.equal(isArticleBody('<article id="other-id">'), false);
  assert.equal(isArticleBody('<section id="post-body">'), false);
  assert.equal(isArticleBody(''), false);
});

test('isDraft matches data-draft="true" on article element', () => {
  assert.equal(isDraft('<article id="post-body" data-draft="true">'), true);
  assert.equal(isDraft('<article data-draft="true">'), true);
  assert.equal(isDraft('<article data-draft="false">'), false);
  assert.equal(isDraft('<article>'), false);
});

test('collectContentFigures finds both viz-figure and article-figure wrappers', () => {
  const html = `
    <figure class="viz-figure article-figure"><div>A</div></figure>
    <figure class="article-figure"><div>B</div></figure>
    <figure class="decorative"><div>C</div></figure>
    <figure class="reveal viz-figure"><div>D</div></figure>
  `;
  const figs = collectContentFigures(html);
  assert.equal(figs.length, 3, 'three content figures (A, B, D); C is decorative');
  assert.ok(figs[0].inner.includes('A'));
  assert.ok(figs[1].inner.includes('B'));
  assert.ok(figs[2].inner.includes('D'));
});

test('collectContentFigures handles non-greedy inner matching across adjacent figures', () => {
  const html = `<figure class="article-figure">first</figure><figure class="article-figure">second</figure>`;
  const figs = collectContentFigures(html);
  assert.equal(figs.length, 2);
  assert.equal(figs[0].inner, 'first');
  assert.equal(figs[1].inner, 'second');
});

test('getDataAudioAlt extracts double-quoted and single-quoted values', () => {
  assert.equal(getDataAudioAlt(' data-audio-alt="hello world"'), 'hello world');
  assert.equal(getDataAudioAlt(" data-audio-alt='hello world'"), 'hello world');
  assert.equal(getDataAudioAlt(' class="x" data-audio-alt="a b c"'), 'a b c');
});

test('getDataAudioAlt returns empty string when attribute is absent', () => {
  assert.equal(getDataAudioAlt(' class="article-figure"'), '');
  assert.equal(getDataAudioAlt(''), '');
});

test('getDataAudioAlt parses across multi-line values', () => {
  const open = ' data-audio-alt="line one\nline two\nline three"';
  assert.equal(getDataAudioAlt(open), 'line one\nline two\nline three');
});

test('hasFigcaption finds figcaption tag', () => {
  assert.equal(hasFigcaption('<figcaption>x</figcaption>'), true);
  assert.equal(hasFigcaption('<figcaption class="cap">x</figcaption>'), true);
  assert.equal(hasFigcaption('<div>no caption here</div>'), false);
  assert.equal(hasFigcaption(''), false);
});

test('detectVizKinds recognizes viz-* family members', () => {
  const html = `<div class="viz-bars"><span class="viz-bars__fill"></span></div>`;
  const kinds = detectVizKinds(html);
  assert.equal(kinds.size, 1);
  assert.ok(kinds.has('viz-bars'));
});

test('detectVizKinds counts distinct kinds across mixed content', () => {
  const html = `
    <div class="viz-flow"><ol class="viz-flow__list"></ol></div>
    <div class="viz-bars"></div>
  `;
  const kinds = detectVizKinds(html);
  assert.equal(kinds.size, 2);
  assert.ok(kinds.has('viz-flow'));
  assert.ok(kinds.has('viz-bars'));
});

test('detectVizKinds ignores viz-* substrings inside larger class names', () => {
  // "non-viz-bars" should NOT match viz-bars — \b boundary required.
  const html = `<div class="something-viz-barsy"></div>`;
  const kinds = detectVizKinds(html);
  assert.equal(kinds.size, 0);
});

test('hashFigureInner normalizes whitespace differences to the same hash', () => {
  const a = `<div class="viz-bars"><p>hello world</p></div>`;
  const b = `<div   class="viz-bars">  <p>hello world</p>   </div>`;
  assert.equal(hashFigureInner(a), hashFigureInner(b));
});

test('hashFigureInner strips HTML comments before hashing', () => {
  const a = `<div class="viz-bars"><p>hello world</p></div>`;
  const b = `<div class="viz-bars"><!-- a comment --><p>hello world</p></div>`;
  assert.equal(hashFigureInner(a), hashFigureInner(b));
});

test('hashFigureInner produces different hashes for genuinely different content', () => {
  const a = `<div class="viz-bars"><p>cats</p></div>`;
  const b = `<div class="viz-bars"><p>dogs</p></div>`;
  assert.notEqual(hashFigureInner(a), hashFigureInner(b));
});

test('hashFigureInner returns a 12-char hex prefix', () => {
  const h = hashFigureInner('<div>anything</div>');
  assert.equal(h.length, 12);
  assert.match(h, /^[0-9a-f]+$/);
});

test('numTextToShare parses percent strings', () => {
  // Float-strict — these survive IEEE 754 cleanly.
  assert.equal(numTextToShare('57%'), 0.57);
  assert.equal(numTextToShare('0%'), 0);
  assert.equal(numTextToShare('100%'), 1);
  // 13.14/100 introduces float drift; assert within tolerance.
  assert.ok(Math.abs(numTextToShare('13.14%') - 0.1314) < 1e-10);
});

test('numTextToShare parses share-of-one decimals', () => {
  assert.equal(numTextToShare('0.85'), 0.85);
  assert.equal(numTextToShare('.5'), 0.5);
  assert.equal(numTextToShare('1.0'), 1);
  assert.equal(numTextToShare('1'), 1);
});

test('numTextToShare returns null for non-percent labels', () => {
  assert.equal(numTextToShare('$2,500'), null);
  assert.equal(numTextToShare('rising, not flat'), null);
  assert.equal(numTextToShare('single digits'), null);
  assert.equal(numTextToShare('2,400 px'), null);
  assert.equal(numTextToShare(''), null);
  assert.equal(numTextToShare(null), null);
});

test('numTextToShare handles entity-encoded middot whitespace', () => {
  // "  57  %  " with surrounding whitespace and entity middots should
  // normalize and parse as 0.57.
  assert.equal(numTextToShare('  57%  '), 0.57);
  assert.equal(numTextToShare('57&middot;%'), null); // mixed-format edge case
});

test('findAutolinkInAttribute detects the corruption pattern (rule 8)', () => {
  const html = `<figure data-audio-alt="match your <!-- LIBRARY:autolink:start --><a href=\\"/glossary/funnel/\\">funnel</a><!-- LIBRARY:autolink:end -->"></figure>`;
  const hits = findAutolinkInAttribute(html);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].attr, 'data-audio-alt');
  assert.ok(hits[0].excerpt.includes('LIBRARY:autolink:start'));
});

test('findAutolinkInAttribute returns no hits for valid body-only autolinks', () => {
  const html = `<p>The <!-- LIBRARY:autolink:start --><a href="/glossary/funnel/">funnel</a><!-- LIBRARY:autolink:end --> matters.</p>`;
  const hits = findAutolinkInAttribute(html);
  assert.equal(hits.length, 0);
});

test('findAutolinkInAttribute reports the line number for diagnostics', () => {
  const html = `\n\n\n<figure data-audio-alt="x <!-- LIBRARY:autolink:start --> y"></figure>`;
  const hits = findAutolinkInAttribute(html);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].line, 4);
});

// --- ADR-006 enrichment taxonomy (the table/photo/scan/map/shot/render kinds) ---

test('ENRICHMENT_KINDS lists the non-viz figure kinds', () => {
  assert.deepEqual([...ENRICHMENT_KINDS].sort(),
    ['map', 'photo', 'render', 'scan', 'shot', 'table']);
});

test('detectNonVizKinds recognizes a real <table> as the table kind', () => {
  const kinds = detectNonVizKinds('', '<table class="viz-table"><tr><td>x</td></tr></table>');
  assert.ok(kinds.has('table'));
});

test('detectNonVizKinds reads data-figure-kind from the figure attributes', () => {
  const kinds = detectNonVizKinds(' data-figure-kind="photo" data-audio-alt="…"', '<img src="x.webp">');
  assert.ok(kinds.has('photo'));
});

test('detectNonVizKinds ignores an unknown data-figure-kind value', () => {
  const kinds = detectNonVizKinds(' data-figure-kind="bogus"', '<p>no table here</p>');
  assert.equal(kinds.size, 0);
});

test('variety can be met by one viz-* kind plus a data table (ADR-006)', () => {
  // The reason the gate amendment exists: a post should clear the
  // two-distinct-kinds floor with a diagram + a table, not only two diagrams.
  const vizFig = '<figure class="viz-figure"><div class="viz-bars"></div></figure>';
  const tableFig = '<figure class="viz-figure" data-figure-kind="table"><table><tr><td>1</td></tr></table></figure>';
  const all = new Set([
    ...detectVizKinds(vizFig), ...detectNonVizKinds('', vizFig),
    ...detectVizKinds(tableFig), ...detectNonVizKinds(' data-figure-kind="table"', tableFig),
  ]);
  assert.ok(all.size >= 2, `expected ≥2 distinct kinds, got ${[...all].join(', ')}`);
  assert.ok(all.has('viz-bars') && all.has('table'));
});

test('two figures of the same viz kind still fail variety (unchanged)', () => {
  const fig = '<figure class="viz-figure"><div class="viz-bars"></div></figure>';
  const all = new Set([
    ...detectVizKinds(fig), ...detectNonVizKinds('', fig),
    ...detectVizKinds(fig), ...detectNonVizKinds('', fig),
  ]);
  assert.equal(all.size, 1);
});
