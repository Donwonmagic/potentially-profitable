#!/usr/bin/env node
/**
 * inject-receipts-kpis.mjs — keep the public KPI list on /receipts/ (and its
 * Spanish mirror) in lockstep with the canonical north-star registry,
 * data/kpis.json — the same file the /admin/kpis/ dashboard renders and
 * check-kpi-doc.mjs reviews quarterly.
 *
 * Why this exists (brief 83): a public "receipts, not reviews" page must never
 * contradict its own metrics registry. It did — /receipts/ claimed "Six
 * north-star KPIs" and /es/receipts/ claimed "Siete" (and the ES list still
 * carried the retired services-era lead-to-call KPI) while kpis.json defined
 * four. Hand-reconciliation fixes the symptom; this generator removes the drift
 * class: the count word and the list are now stamped from the registry, so the
 * page and kpis.json cannot disagree again.
 *
 * Stamps two sentinel regions per locale (added once, by hand, to each page):
 *   <!-- kpis:count -->Four<!-- /kpis:count -->                  the count word
 *   <!-- kpis:list:start --> … <li>…</li> … <!-- kpis:list:end -->   the list
 *
 *   node scripts/inject-receipts-kpis.mjs           # rewrite in place
 *   node scripts/inject-receipts-kpis.mjs --check   # exit 1 if any page drifts
 *
 * Idempotent: re-running on an in-sync page produces no diff. Its --check mode
 * is wired into check-all as the parity gate.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const kpis = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'kpis.json'), 'utf8')).kpis || [];
const n = kpis.length;

// Number → word, EN + ES, for the count in the intro sentence. Covers the
// realistic range for a deliberately-short north-star list.
const WORDS = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  es: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'],
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function countWord(locale) {
  const w = WORDS[locale] && WORDS[locale][n];
  return w ? cap(w) : String(n);
}
const escHtml = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const targets = [
  { file: 'receipts/index.html',    locale: 'en', label: (k) => k.label_en },
  { file: 'es/receipts/index.html', locale: 'es', label: (k) => k.label_es },
];

const COUNT_RE = /(<!-- kpis:count -->)[\s\S]*?(<!-- \/kpis:count -->)/;
const LIST_RE  = /(<!-- kpis:list:start -->)[\s\S]*?(<!-- kpis:list:end -->)/;

let changed = 0;
const missing = [];
for (const t of targets) {
  const fp = path.join(repoRoot, t.file);
  if (!fs.existsSync(fp)) { missing.push(t.file); continue; }
  const before = fs.readFileSync(fp, 'utf8');
  if (!COUNT_RE.test(before) || !LIST_RE.test(before)) { missing.push(`${t.file} (sentinels absent)`); continue; }

  const lis = kpis.map((k) => `        <li>${escHtml(t.label(k))}</li>`).join('\n');
  const next = before
    .replace(COUNT_RE, `$1${countWord(t.locale)}$2`)
    .replace(LIST_RE, `$1\n${lis}\n        $2`);

  if (next !== before) {
    if (!checkOnly) fs.writeFileSync(fp, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${t.file}`);
    changed++;
  }
}

if (missing.length) {
  console.error(`inject-receipts-kpis: ${missing.length} target(s) missing or un-sentineled:`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}

console.log(`receipts KPIs: ${changed} file(s) ${checkOnly ? 'would change' : 'updated'} — registry has ${n} KPI(s).`);
if (checkOnly && changed > 0) {
  console.error('  /receipts/ KPI list has drifted from data/kpis.json — run: node scripts/inject-receipts-kpis.mjs');
  process.exit(1);
}
