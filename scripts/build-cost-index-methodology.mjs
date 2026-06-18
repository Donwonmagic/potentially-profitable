#!/usr/bin/env node
/**
 * build-cost-index-methodology.mjs — keep the methodology page's VERSION and CHANGE LOG
 * in lockstep with the machine-readable statement (cost-index/methodology.json).
 *
 * The #governance section long promised the methodology was "versioned … with a dated
 * change-log entry," but the page showed neither a version nor a log. This stamps both —
 * `methodologyVersion`, `effectiveDate`, and a rendered changelog — into the EN + ES pages
 * via <!-- method:KEY -->…<!-- /method --> sentinels, exactly mirroring the proven
 * inject-cost-index-calibration.mjs pattern, so the page can never drift from the JSON.
 *
 * Pure & deterministic. --check fails if the page sentinels are stale.
 *
 *   node scripts/build-cost-index-methodology.mjs            # stamp the pages
 *   node scripts/build-cost-index-methodology.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-index-methodology.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(repo, 'cost-index/methodology.json');
const PAGES = [
  ['cost-index/methodology/index.html', 'en'],
  ['es/cost-index/methodology/index.html', 'es'],
];

const SEMVER = /^\d+\.\d+\.\d+$/;
function rd(p) { return JSON.parse(readFileSync(p, 'utf8')); }
function cmpVer(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

// Values to stamp, per locale. Changelog is newest-first (index 0 = current version).
function valuesFor(m, locale) {
  const items = m.changelog.map((c) => {
    const text = (c.change && (c.change[locale] || c.change.en)) || '';
    return `<li><strong>${c.version}</strong> — ${c.date}: ${text}</li>`;
  }).join('');
  return {
    'version': m.methodologyVersion,
    'effectiveDate': m.effectiveDate,
    'changelog': `<ul class="ci-changelog">${items}</ul>`,
  };
}

function stamp(html, vals) {
  let out = html;
  for (const [key, val] of Object.entries(vals)) {
    const re = new RegExp('(<!-- method:' + key + ' -->)([\\s\\S]*?)(<!-- /method -->)');
    if (!re.test(out)) throw new Error(`sentinel method:${key} not found`);
    out = out.replace(re, (_m, a, _cur, b) => a + val + b);
  }
  return out;
}

function validate(m) {
  const errs = [];
  if (!SEMVER.test(m.methodologyVersion)) errs.push('methodologyVersion is not semver');
  if (!Array.isArray(m.changelog) || !m.changelog.length) errs.push('changelog is empty');
  else {
    if (m.changelog[0].version !== m.methodologyVersion) errs.push('methodologyVersion must equal the newest changelog entry');
    for (let i = 0; i < m.changelog.length; i++) {
      const c = m.changelog[i];
      if (!SEMVER.test(c.version || '')) errs.push(`changelog[${i}] version not semver`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date || '')) errs.push(`changelog[${i}] date not ISO`);
      if (!(c.change && (c.change.en || typeof c.change === 'string'))) errs.push(`changelog[${i}] missing change text`);
      if (i > 0 && cmpVer(m.changelog[i - 1].version, c.version) <= 0) errs.push(`changelog must be strictly newest-first at [${i}]`);
    }
  }
  return errs;
}

function main() {
  const m = rd(SRC);

  if (process.argv.includes('--self-test')) {
    const errs = validate(m);
    const checks = [
      ['methodology.json validates', errs.length === 0],
      ['both locales render a changelog', PAGES.every(([, l]) => valuesFor(m, l).changelog.startsWith('<ul'))],
      ['stamp is idempotent', (() => {
        const sample = '<!-- method:version --><!-- /method --><!-- method:effectiveDate --><!-- /method --><!-- method:changelog --><!-- /method -->';
        const once = stamp(sample, valuesFor(m, 'en'));
        return stamp(once, valuesFor(m, 'en')) === once;
      })()],
    ];
    errs.forEach((e) => console.error('  ✗ ' + e));
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-index-methodology self-test: ${checks.length - failed.length}/${checks.length} passed${errs.length ? ' (+' + errs.length + ' validation errors)' : ''}.`);
    process.exit(failed.length || errs.length ? 1 : 0);
  }

  const errs = validate(m);
  if (errs.length) { errs.forEach((e) => console.error('✗ ' + e)); process.exit(1); }

  if (process.argv.includes('--check')) {
    let drift = 0;
    for (const [rel, locale] of PAGES) {
      const fp = path.join(repo, rel);
      const cur = readFileSync(fp, 'utf8');
      const next = stamp(cur, valuesFor(m, locale));
      if (next !== cur) { drift++; console.log(`would update ${rel}`); }
    }
    if (drift) { console.error('✗ methodology page version/changelog is stale — run: node scripts/build-cost-index-methodology.mjs'); process.exit(1); }
    console.log('✓ methodology version & changelog in sync on both pages.');
    return;
  }

  for (const [rel, locale] of PAGES) {
    const fp = path.join(repo, rel);
    writeFileSync(fp, stamp(readFileSync(fp, 'utf8'), valuesFor(m, locale)));
  }
  console.log(`Stamped methodology v${m.methodologyVersion} (${m.changelog.length} changelog entr${m.changelog.length === 1 ? 'y' : 'ies'}) into EN + ES.`);
}

main();
