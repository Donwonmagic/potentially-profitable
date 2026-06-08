#!/usr/bin/env node
/**
 * Unit tests for the per-language audio fact gate
 * (scripts/check-audio-fabrications.mjs) and the shared fabrication
 * registry (scripts/lib/fabrication-patterns.mjs).
 *
 * Run:   node --test scripts/test-audio-fabrications.mjs
 *
 * Why these exist
 * ---------------
 * The audio gate is the only thing standing between a translated fabrication
 * and six TTS voices reading it aloud. Its behavior is two-tiered and
 * language-aware, so a future edit to the language filter, the number
 * normalizer, or the waiver matcher could silently widen the hole. These
 * tests pin the load-bearing logic against fixtures (no filesystem walk).
 *
 * Coverage
 *   - langOf (filename -> spoken language)
 *   - ruleAppliesTo (invariant on all langs; en/es/.. only on their track)
 *   - scanPatterns (bio drift caught per language; invariant URL on every
 *     track; an EN-only rule does NOT fire on a zh track)
 *   - extractNumbers (locale-separator normalization for numeric parity)
 *   - waiverFor (known-stale dir matching)
 *
 * Not covered (deferred): the filesystem walk + reporting + exit codes —
 * those are exercised by the gate itself in CI against the real ~328-file
 * corpus.
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

import {
  langOf,
  ruleAppliesTo,
  scanPatterns,
  extractNumbers,
  waiverFor,
  STALE_AUDIO_WAIVERS,
} from './check-audio-fabrications.mjs';

test('langOf maps narration filenames to spoken language', () => {
  assert.equal(langOf('audio.json'), 'en'); // unsuffixed = source track
  assert.equal(langOf('audio.es.json'), 'es');
  assert.equal(langOf('audio.zh.json'), 'zh');
  assert.equal(langOf('audio.fr.json'), 'fr');
});

test('ruleAppliesTo: invariant rules apply to every language', () => {
  const invariant = { langs: ['invariant'] };
  for (const lang of ['en', 'es', 'fr', 'it', 'pt', 'zh']) {
    assert.equal(ruleAppliesTo(invariant, lang), true, `invariant should apply to ${lang}`);
  }
});

test('ruleAppliesTo: a language rule applies only to its own track', () => {
  const enRule = { langs: ['en'] };
  assert.equal(ruleAppliesTo(enRule, 'en'), true);
  assert.equal(ruleAppliesTo(enRule, 'zh'), false);
  assert.equal(ruleAppliesTo(enRule, 'es'), false);
});

test('scanPatterns catches the EN two-restaurants bio on the en track', () => {
  const hits = scanPatterns('I manage two restaurants in the DMV.', 'en');
  assert.ok(hits.length >= 1, 'expected an EN bio-drift hit');
  assert.match(hits[0].label, /bio/i);
});

test('scanPatterns catches the ES bio drift the narrow rules missed', () => {
  const hits = scanPatterns('Administro dos restaurantes en el DMV.', 'es');
  assert.ok(hits.length >= 1, 'expected an ES bio-drift hit');
});

test('scanPatterns catches the bio drift in fr / it / pt / zh tracks', () => {
  assert.ok(scanPatterns('Je gère deux restaurants dans le DMV.', 'fr').length >= 1, 'fr');
  assert.ok(scanPatterns('Gestisco due ristoranti in DMV.', 'it').length >= 1, 'it');
  assert.ok(scanPatterns('Eu gerencio dois restaurantes na DMV.', 'pt').length >= 1, 'pt');
  assert.ok(scanPatterns('我在DMV管理两家餐厅。', 'zh').length >= 1, 'zh');
});

test('scanPatterns: an EN prose rule does NOT fire on a zh track', () => {
  // The English bio sentence on a Mandarin track must not match an EN rule —
  // that is the language filter doing its job (zh drift is caught by the zh rule).
  const hits = scanPatterns('I manage two restaurants in the DMV.', 'zh');
  assert.equal(hits.length, 0);
});

test('scanPatterns: a fabricated source deep-link is caught on EVERY track', () => {
  const url = 'https://www.nngroup.com/articles/some-invented-slug/';
  for (const lang of ['en', 'es', 'fr', 'it', 'pt', 'zh']) {
    const hits = scanPatterns(`see ${url} for more`, lang);
    assert.ok(hits.length >= 1, `invariant URL should be caught on ${lang} track`);
  }
});

test('extractNumbers normalizes locale separators to bare digits', () => {
  // "$40,000" (en), "40.000" (it/pt), "40 000" (fr) must all compare equal.
  assert.ok(extractNumbers('$40,000').has('40000'));
  assert.ok(extractNumbers('40.000').has('40000'));
  assert.ok(extractNumbers('40 000').has('40000'));
  // decimals collapse too; leading zeros drop.
  assert.ok(extractNumbers('13.14%').has('1314'));
  assert.ok(extractNumbers('03').has('3'));
  assert.ok(extractNumbers('2026').has('2026'));
});

test('numeric-parity building block: a stray figure is detectable', () => {
  const source = extractNumbers('the article cites 30% and $1,200');
  const spoken = extractNumbers('the translation says 56% and $1,200');
  const stray = [...spoken].filter((n) => !source.has(n));
  assert.deepEqual(stray, ['56']); // invented 56% not in the source article
});

test('waiverFor matches known-stale dirs and nothing else', () => {
  assert.ok(STALE_AUDIO_WAIVERS.length >= 1, 'expected seeded waivers');
  const waived = STALE_AUDIO_WAIVERS[0].dir;
  assert.ok(waiverFor(`${waived}/audio.zh.json`), 'a file under a waived dir is waived');
  assert.equal(waiverFor('library/some-clean-post/audio.zh.json'), undefined);
});
