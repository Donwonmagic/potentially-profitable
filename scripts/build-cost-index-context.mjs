#!/usr/bin/env node
/**
 * build-cost-index-context.mjs — the market-context seed for Vendor Benchmark.
 *
 * Vendor Benchmark places an operator's paid price against the wholesale Cost Index
 * reference (the "gap"). Its honesty contract: the index is WHOLESALE, delivered runs
 * higher, so a price above the reference is NOT overpaying — never claim otherwise. This
 * seed lets the tool add one HONEST piece of context WITHOUT touching that rule: it says
 * something about the REFERENCE's own state, never about the operator's price. Per tracked
 * ingredient:
 *   - vol         — how volatile the line is (wild / swingy / steady), from the detected moves
 *   - now         — is the reference itself unusual RIGHT NOW? current smoothed level vs its own
 *                   trailing-year normal → { pct, state: elevated | depressed | normal }
 *   - recentEvent — the most recent DOCUMENTED market event affecting it (label + year), from the
 *                   cited registry (cost-index/events.json). Co-occurrence context, never a cause.
 * So the tool can say "the market reference is itself ~X% above its own normal, and the most
 * recent documented event was Y — part of any gap is the market, not your vendor." No causal
 * claim about the operator's specific price; the gap math is unchanged.
 *
 * PURE & DETERMINISTIC (no `now`; recency is judged against the data's own latest date). Emits
 * a browser global (data/cost-index-context.js → window.MUNTIN_COST_CONTEXT) + a JSON mirror.
 *   node scripts/build-cost-index-context.mjs            # write the seed
 *   node scripts/build-cost-index-context.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-index-context.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JS = path.join(repo, 'data/cost-index-context.js');
const OUT_JSON = path.join(repo, 'data/cost-index-context.json');

const NOW_THRESH = 12;    // % from own trailing normal to call the reference "unusual" right now
const RECENT_YEARS = 3;   // a documented event within this many years of the item's latest reading is "recent"
const DAY = 864e5;

function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }
function median(a) {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Volatility class from the detected moves — same thresholds as the page's operator takeaway.
function volClass(rec) {
  const evs = (rec && rec.events) || [];
  const biggest = evs.reduce((m, e) => Math.max(m, Math.abs(e.pctFromNormal)), 0);
  const perDecade = rec && rec.span && rec.span.years ? evs.length / (rec.span.years / 10) : 0;
  if (biggest >= 80 || (biggest >= 50 && perDecade >= 2)) return 'wild';
  if (biggest >= 40 || perDecade >= 1.8) return 'swingy';
  return 'steady';
}

// Is the reference itself unusual right now? current smoothed level vs its own trailing-year
// normal (the normal window ENDS ~a month before the latest print so the current move can't
// define its own baseline). Null when there isn't enough history to judge.
function nowState(points) {
  const vals = points.map((p) => p.valueCents);
  const n = vals.length;
  if (n < 20) return null;
  const current = median(vals.slice(Math.max(0, n - 3)));
  const normal = median(vals.slice(Math.max(0, n - 57), Math.max(1, n - 5)));
  if (!(normal > 0)) return null;
  const pct = Math.round(((current - normal) / normal) * 100);
  const state = pct >= NOW_THRESH ? 'elevated' : pct <= -NOW_THRESH ? 'depressed' : 'normal';
  return { pct, state };
}

// Most recent documented event affecting the slug, from the cited registry.
function recentEventFor(slug, registryBySlug, latestMs) {
  const list = registryBySlug[slug];
  if (!list || !list.length) return null;
  const best = list.slice().sort((a, b) => b.endMs - a.endMs)[0];
  const year = String(best.ev.endDate || best.ev.startDate).slice(0, 4);
  const recent = latestMs != null && best.endMs >= latestMs - RECENT_YEARS * 365.25 * DAY;
  return { label: best.ev.label, year, recent };
}

function build() {
  const ci = rd('data/cost-index.json') || { ingredients: {} };
  const hist = (rd('data/cost-index-history.json') || {}).ingredients || {};
  const detection = (rd('data/cost-index-events.json') || {}).items || {};
  const registry = (rd('cost-index/events.json') || {}).events || [];

  const regBySlug = {};
  const parse = (s) => { const a = String(s).split('-').map(Number); return Date.UTC(a[0], (a[1] || 1) - 1, a[2] || 28); };
  for (const ev of registry) {
    if (!ev || !Array.isArray(ev.affectedSlugs)) continue;
    const endMs = parse(ev.endDate || ev.startDate);
    for (const s of ev.affectedSlugs) (regBySlug[s] || (regBySlug[s] = [])).push({ ev, endMs });
  }

  const items = {};
  for (const slug of Object.keys(ci.ingredients || {}).sort()) {
    const points = Array.isArray(hist[slug]) ? hist[slug].filter((p) => p && typeof p.valueCents === 'number' && typeof p.date === 'string') : [];
    const now = nowState(points);
    const latestMs = points.length ? Date.parse(points[points.length - 1].date) : null;
    const rev = recentEventFor(slug, regBySlug, latestMs);
    const vol = volClass(detection[slug]);
    // Only ship a slug that carries at least one useful signal.
    if (!now && !rev && vol === 'steady') continue;
    const entry = { vol };
    if (now) entry.now = now;
    if (rev) entry.recentEvent = rev;
    items[slug] = entry;
  }
  return {
    _doc: 'Market-context seed for Vendor Benchmark — per tracked ingredient: volatility class (vol), whether the wholesale reference is itself unusual right now vs its own trailing-year normal (now), and the most recent DOCUMENTED market event affecting it (recentEvent, from the cited registry). Used only to add co-occurrence context about the REFERENCE’s state — never a claim about the operator’s own price, which keeps the fair-price-gap honesty contract intact. Pure/deterministic; recency judged against the data’s own latest date. Built by scripts/build-cost-index-context.mjs; CI re-checks with --check.',
    _version: 1,
    params: { nowThreshold: NOW_THRESH, recentYears: RECENT_YEARS },
    generatedFrom: { index: 'data/cost-index.json', history: 'data/cost-index-history.json', events: 'data/cost-index-events.json', registry: 'cost-index/events.json' },
    items,
  };
}

function serialize(report) {
  const json = JSON.stringify(report, null, 2) + '\n';
  const js = `/**\n * Cost Index — market-context seed (Vendor Benchmark). GENERATED — do not edit by hand.\n * Written by scripts/build-cost-index-context.mjs. Sets window.MUNTIN_COST_CONTEXT; loaded\n * same-origin so Vendor Benchmark stays no-fetch. See the JSON mirror for the schema.\n */\n(function (root) {\n  'use strict';\n  root.MUNTIN_COST_CONTEXT = ${JSON.stringify(report.items)};\n}(typeof window !== 'undefined' ? window : this));\n`;
  return { json, js };
}

function main() {
  const report = build();
  const { json, js } = serialize(report);

  if (process.argv.includes('--self-test')) {
    const items = report.items;
    const vals = Object.values(items);
    const checks = [
      ['built some items', Object.keys(items).length > 0],
      ['every vol is a known class', vals.every((v) => ['wild', 'swingy', 'steady'].includes(v.vol))],
      ['now.state agrees with now.pct sign/threshold', vals.every((v) => !v.now || (
        (v.now.state === 'elevated') === (v.now.pct >= NOW_THRESH) &&
        (v.now.state === 'depressed') === (v.now.pct <= -NOW_THRESH)))],
      ['recentEvent has label + 4-digit year', vals.every((v) => !v.recentEvent || (typeof v.recentEvent.label === 'string' && /^\d{4}$/.test(v.recentEvent.year)))],
      ['no bare steady/normal/no-event item shipped', vals.every((v) => v.now || v.recentEvent || v.vol !== 'steady')],
      ['no operator-price field leaked (context is reference-only)', vals.every((v) => !('paid' in v) && !('overpay' in v) && !('gap' in v))],
      ['nowState math: elevated example', (() => { const s = nowState(Array.from({ length: 30 }, (_, i) => ({ valueCents: i >= 27 ? 200 : 100, date: '2020-01-01' }))); return s && s.state === 'elevated'; })()],
      ['nowState null on short series', nowState([{ valueCents: 100, date: 'x' }]) === null],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-index-context self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let curJs = '', curJson = '';
    try { curJs = readFileSync(OUT_JS, 'utf8'); } catch {}
    try { curJson = readFileSync(OUT_JSON, 'utf8'); } catch {}
    if (curJs !== js || curJson !== json) { console.error('✗ cost-index context seed is stale — run: node scripts/build-cost-index-context.mjs'); process.exit(1); }
    console.log(`✓ cost-index context seed in sync — ${Object.keys(report.items).length} ingredient(s).`);
    return;
  }

  writeFileSync(OUT_JSON, json);
  writeFileSync(OUT_JS, js);
  const withNow = Object.values(report.items).filter((v) => v.now && v.now.state !== 'normal').length;
  const withEv = Object.values(report.items).filter((v) => v.recentEvent).length;
  console.log(`Wrote market context for ${Object.keys(report.items).length} ingredient(s) (${withNow} currently unusual, ${withEv} with a documented event) → data/cost-index-context.{js,json}`);
}

main();
