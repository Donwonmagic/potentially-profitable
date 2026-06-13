#!/usr/bin/env node
/**
 * check-ingredient-jsonld.mjs — JSON-LD price-cleanliness gate.
 *
 * Answer engines lift JSON-LD answer text VERBATIM into AI Overviews. The
 * ingredient-yield pages show illustrative AP prices and time-varying WHOLESALE
 * references — neither may ever enter structured data as if it were a claimed,
 * transactable price. This gate asserts that every ingredient page's JSON-LD:
 *   1. carries NO dollar figure (the worked $ example stays in visible,
 *      illustrative-labeled HTML only), and
 *   2. declares NO Offer / Product / AggregateOffer / price type (a wholesale
 *      reference is not a retail offer — marking it as one is a policy violation).
 *
 * Usage: node scripts/check-ingredient-jsonld.mjs [--check]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['library/ingredient-yields', 'es/library/ingredient-yields'];
const BANNED_TYPES = /"@type"\s*:\s*"(Offer|AggregateOffer|Product)"/;
// A dollar amount, or a schema price/priceCurrency/MonetaryAmount field.
const DOLLARS = /\$\s?\d/;
const PRICE_FIELD = /"(price|priceCurrency|lowPrice|highPrice|estimatedCost)"\s*:/i;

function pages() {
  const out = [];
  for (const d of DIRS) {
    const abs = path.join(repoRoot, d);
    if (!existsSync(abs)) continue;
    for (const slug of readdirSync(abs)) {
      const f = path.join(abs, slug, 'index.html');
      if (existsSync(f)) out.push({ rel: `${d}/${slug}/`, file: f });
    }
  }
  return out;
}

export function jsonldIssues(html, rel) {
  const issues = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    const block = m[1];
    if (DOLLARS.test(block)) issues.push(`${rel} JSON-LD carries a dollar figure`);
    if (PRICE_FIELD.test(block)) issues.push(`${rel} JSON-LD carries a price field`);
    if (BANNED_TYPES.test(block)) issues.push(`${rel} JSON-LD declares an Offer/Product type`);
  }
  return issues;
}

function run(check) {
  const list = pages();
  if (!list.length) { console.log('check-ingredient-jsonld: no ingredient pages found (OK).'); return 0; }
  const issues = [];
  for (const p of list) issues.push(...jsonldIssues(readFileSync(p.file, 'utf8'), p.rel));
  if (issues.length) {
    issues.slice(0, 20).forEach((i) => console.log('  ✗ ' + i));
    console.error(`check-ingredient-jsonld: ${issues.length} price-leak(s) in ingredient JSON-LD across ${list.length} page(s).`);
    return check ? 1 : 0;
  }
  console.log(`check-ingredient-jsonld: ${list.length} page(s) — JSON-LD is price-clean (no $, no price field, no Offer/Product).`);
  return 0;
}

function selfTest() {
  const a = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exitCode = 1; } };
  a(jsonldIssues('<script type="application/ld+json">{"@type":"FAQPage","text":"yields 75%"}</script>', 'x').length === 0, 'clean passes');
  a(jsonldIssues('<script type="application/ld+json">{"text":"about $4.00/lb"}</script>', 'x').some((i) => /dollar/.test(i)), 'dollar caught');
  a(jsonldIssues('<script type="application/ld+json">{"@type":"Offer","price":"4"}</script>', 'x').some((i) => /Offer/.test(i)), 'Offer caught');
  a(jsonldIssues('<script type="application/ld+json">{"price":"4.00"}</script>', 'x').some((i) => /price field/.test(i)), 'price field caught');
  console.log(process.exitCode ? 'ingredient-jsonld self-test: FAILURES above.' : 'ingredient-jsonld self-test: 4/4 passed.');
  return process.exitCode || 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) process.exit(selfTest());
  process.exit(run(process.argv.includes('--check')));
}
