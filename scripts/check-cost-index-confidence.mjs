#!/usr/bin/env node
/**
 * check-cost-index-confidence.mjs — the honesty gate for the Cost Index
 * "instrument" surfaces.
 *
 * The depth refresh (2026-07) made three surfaces speak one instrument language:
 * the /about/ live read, the hub composite band, and every per-ingredient
 * "Market read". Their credibility rests on framing that must NEVER be dropped
 * by a future generator/injector edit:
 *
 *   - a read is a REFERENCE (wholesale / against baseline), never a delivered or
 *     retail price the operator pays;
 *   - a plain-language confidence label rides with the number;
 *   - the /about/ read carries the explicit "Not your prices" negation, where a
 *     skeptic would otherwise mistake wholesale for a quote.
 *
 * This gate asserts those phrases are present on each surface, in EN and ES.
 * It does NOT invent or grade confidence — it only guards that the honest
 * framing the surfaces already ship cannot silently disappear.
 *
 *   node scripts/check-cost-index-confidence.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const issues = [];
const read = (rel) => { try { return fs.readFileSync(path.join(repoRoot, rel), 'utf8'); } catch { return null; } };
const has = (s, ...needles) => needles.every((n) => s.includes(n));
const hasAny = (s, ...needles) => needles.some((n) => s.includes(n));

// ---- 1. Per-ingredient "Market read" — every .ci-read is a wholesale reference ----
let ciReadPages = 0;
for (const dir of ['cost-index', 'es/cost-index']) {
  const root = path.join(repoRoot, dir);
  if (!fs.existsSync(root)) continue;
  for (const slug of fs.readdirSync(root)) {
    if (slug === 'index.html') continue;               // the hub, handled below
    const rel = `${dir}/${slug}/index.html`;
    const src = read(rel);
    if (!src || !src.includes('class="ci-read"')) continue;
    ciReadPages++;
    if (!hasAny(src, 'wholesale', 'mayorista')) {
      issues.push(`${rel}: .ci-read is missing the wholesale-reference framing (a read is never a delivered price)`);
    }
    if (!hasAny(src, 'confidence', 'confianza')) {
      issues.push(`${rel}: .ci-read is missing a confidence label`);
    }
  }
}

// ---- 2. Hub composite band — confidence + baseline + not-week-over-week ----
for (const [rel, es] of [['cost-index/index.html', false], ['es/cost-index/index.html', true]]) {
  const src = read(rel);
  if (!src) { issues.push(`${rel}: missing`); continue; }
  const m = src.match(/<section class="ci-composite"[\s\S]*?<\/section>/);
  if (!m) { issues.push(`${rel}: no .ci-composite band found`); continue; }
  const band = m[0];
  const need = es
    ? { conf: ['confianza'], base: ['ventana base', 'su base'], wow: ['semana'] }
    : { conf: ['confidence'], base: ['baseline'], wow: ['week-over-week'] };
  if (!hasAny(band, ...need.conf)) issues.push(`${rel}: composite band missing a confidence label`);
  if (!hasAny(band, ...need.base)) issues.push(`${rel}: composite band missing the "against baseline" framing`);
  if (!hasAny(band, ...need.wow)) issues.push(`${rel}: composite band missing the "not a week-over-week move" framing`);
}

// ---- 3. /about/ instrument read — negation + wholesale + confidence ----
for (const [rel, es] of [['about/index.html', false], ['es/about/index.html', true]]) {
  const src = read(rel);
  if (!src) { issues.push(`${rel}: missing`); continue; }
  const m = src.match(/<!-- about-cost-read:start -->[\s\S]*?<!-- about-cost-read:end -->/);
  if (!m) { issues.push(`${rel}: no about-cost-read block found (run inject-about-cost-read.mjs)`); continue; }
  const blk = m[0];
  if (es) {
    if (!blk.includes('no es tu precio')) issues.push(`${rel}: /about/ read missing the "no es tu precio" negation`);
    if (!blk.includes('referencia mayorista')) issues.push(`${rel}: /about/ read missing the wholesale-reference framing`);
    if (!blk.includes('confianza')) issues.push(`${rel}: /about/ read missing a confidence label`);
  } else {
    if (!blk.includes('Not your prices')) issues.push(`${rel}: /about/ read missing the "Not your prices" negation`);
    if (!blk.includes('wholesale reference')) issues.push(`${rel}: /about/ read missing the wholesale-reference framing`);
    if (!blk.includes('confidence')) issues.push(`${rel}: /about/ read missing a confidence label`);
  }
}

if (issues.length) {
  console.error(`✗ Cost-index confidence framing: ${issues.length} issue(s) — the honest framing must never be dropped:`);
  for (const i of issues) console.error(`  - ${i}`);
  process.exit(1);
}
console.log(`cost-index confidence framing: OK — ${ciReadPages} ingredient read(s) + hub composite (EN+ES) + /about/ read (EN+ES) all carry their wholesale/confidence/negation framing.`);
