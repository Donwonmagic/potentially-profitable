#!/usr/bin/env node
/**
 * check-seasonality-education.mjs — gate for the per-card seasonality primers
 * (data/seasonality-education.json, roadmap S2).
 *
 * Enforces the operator's sourcing posture (precise USDA-sourced windows): every
 * entry MUST carry a `source`, both EN and ES sides, and resolve to a real
 * ingredient (a card that exists). It also bounds length (a primer is a sentence,
 * not an essay) and guards a few banned marketing words, because this text renders
 * client-side from the seed and so is invisible to the HTML-scanning voice gates.
 *
 * Keys beginning with `_` (the `_doc` / `_schema_example` blocks) are ignored.
 * An empty `education` map is valid — the feature simply renders nothing until it
 * is populated on a connected run.
 *
 *   node scripts/check-seasonality-education.mjs            # CI gate
 *   node scripts/check-seasonality-education.mjs --self-test
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = ['peak_en', 'peak_es', 'note_en', 'note_es', 'source'];
const MAX = { peak_en: 80, peak_es: 80, note_en: 220, note_es: 240, source: 160 };
// A minimal banned-marketing guard — this content is client-rendered, so the
// HTML-scanning voice gates never see it. Sourced factual primers shouldn't trip
// these anyway; the guard just keeps the surface honest if someone embellishes.
const BANNED = [/\bgame[- ]chang/i, /\bworld[- ]class\b/i, /\bbest[- ]in[- ]class\b/i, /\bdisrupt/i, /\bsupercharge/i, /\bunlock\b/i];

// Validate the education map against the set of real ingredient keys. Pure, so the
// self-test can pass a synthetic key set. Returns an array of error strings.
export function validate(edu, validKeys) {
  const errors = [];
  const keys = Object.keys(edu || {}).filter((k) => !k.startsWith('_'));
  for (const k of keys) {
    if (!validKeys.has(k)) { errors.push(`${k}: not a known ingredient (no label in data/cost-index-labels.json)`); continue; }
    const e = edu[k] || {};
    for (const f of REQUIRED) {
      if (typeof e[f] !== 'string' || !e[f].trim()) { errors.push(`${k}.${f}: missing or empty (a sourced primer needs all of ${REQUIRED.join(', ')})`); }
      else if (e[f].length > MAX[f]) { errors.push(`${k}.${f}: too long (${e[f].length} > ${MAX[f]})`); }
    }
    for (const f of ['peak_en', 'peak_es', 'note_en', 'note_es']) {
      const v = typeof e[f] === 'string' ? e[f] : '';
      const hit = BANNED.find((rx) => rx.test(v));
      if (hit) errors.push(`${k}.${f}: banned marketing word (${hit})`);
    }
  }
  return errors;
}

function run() {
  if (process.argv.includes('--self-test')) return selfTest();
  let edu, labels;
  try { edu = (JSON.parse(readFileSync(path.join(repoRoot, 'data/seasonality-education.json'), 'utf8')).education) || {}; }
  catch (e) { console.error('seasonality education: cannot read data/seasonality-education.json —', e.message); process.exit(1); }
  try { labels = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index-labels.json'), 'utf8')).labels || {}; }
  catch (e) { console.error('seasonality education: cannot read data/cost-index-labels.json —', e.message); process.exit(1); }
  const validKeys = new Set(Object.keys(labels));
  const errors = validate(edu, validKeys);
  const n = Object.keys(edu).filter((k) => !k.startsWith('_')).length;
  if (errors.length) {
    for (const e of errors) console.error('  ✗ ' + e);
    console.error(`seasonality education: ${errors.length} problem(s) across ${n} entry(ies).`);
    process.exit(1);
  }
  console.log(`seasonality education: OK — ${n} sourced primer(s)${n === 0 ? ' (empty — feature dormant until populated)' : ''}.`);
  process.exit(0);
}

function selfTest() {
  const cases = [];
  const ok = (name, got, want) => cases.push({ name, pass: got === want, got, want });
  const keys = new Set(['asparagus', 'romaine-lettuce']);
  const good = { peak_en: 'Spring', peak_es: 'Primavera', note_en: 'A spring crop; supply thins by summer.', note_es: 'Cultivo de primavera; la oferta baja en verano.', source: 'USDA AMS Seasonal Produce Guide' };

  ok('valid entry → 0 errors', validate({ asparagus: good }, keys).length, 0);
  ok('empty map → 0 errors', validate({}, keys).length, 0);
  ok('_doc ignored', validate({ _doc: 'x', _schema_example: {} }, keys).length, 0);
  ok('missing source → error', validate({ asparagus: { ...good, source: '' } }, keys).length, 1);
  ok('missing ES side → error', validate({ asparagus: { ...good, note_es: '' } }, keys).length, 1);
  ok('unknown key → error', validate({ kohlrabi: good }, keys).length, 1);
  ok('over-long note → error', validate({ asparagus: { ...good, note_en: 'x'.repeat(221) } }, keys).length, 1);
  ok('banned word → error', validate({ asparagus: { ...good, note_en: 'A game-changer crop.' } }, keys).length, 1);

  const failed = cases.filter((c) => !c.pass);
  for (const c of failed) console.error(`  ✗ ${c.name}: got ${JSON.stringify(c.got)}, want ${JSON.stringify(c.want)}`);
  console.log(`seasonality education self-test: ${cases.length - failed.length}/${cases.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
