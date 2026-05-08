#!/usr/bin/env node
/**
 * Audit fix (C6) — verify the EN and ES invoice-decoder pages have
 * structural parity for the user-facing surfaces that gate access
 * to features (Reader settings panel, kill-switch, privacy panel,
 * verify-it-yourself disclosure).
 *
 * Why this exists: during the OCR overhaul (Slice 3), the EN page
 * gained a new "Reader settings" disclosure with a radio-group
 * kill-switch, but the ES page never got the matching block. The
 * marquee feature of the slice was undelivered for half the
 * audience for the entire branch lifetime, and no CI gate caught
 * it because the existing checks audit per-page semantics, not
 * cross-locale parity.
 *
 * This check is INTENTIONALLY narrow. It doesn't try to validate
 * translation quality (jargon, register, tone) — that's a human
 * review concern. It only verifies that load-bearing structural
 * IDs and feature toggles exist in BOTH pages.
 *
 * Usage:
 *   node scripts/check-invoice-decoder-bilingual-parity.mjs
 *   node scripts/check-invoice-decoder-bilingual-parity.mjs --check  (CI mode)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const EN_PAGE = path.join(repoRoot, 'tools',    'invoice-decoder', 'index.html');
const ES_PAGE = path.join(repoRoot, 'es',       'tools', 'invoice-decoder', 'index.html');

// Each entry is a substring or regex that MUST appear in both pages.
// Add to this list whenever a new locale-spanning feature ships.
// IDs/classes are reliable; visible-text strings rot fast and are
// not enforced here.
const REQUIRED_PARITY = [
  { id: 'reader-settings-panel',   needle: 'id="idReaderSettings"' },
  { id: 'reader-settings-fs',      needle: 'id="idReaderSettingsFs"' },
  { id: 'reader-settings-status',  needle: 'id="idReaderSettingsStatus"' },
  { id: 'reader-auto-radio',       needle: 'id="idReaderAuto"' },
  { id: 'reader-v1-radio',         needle: 'id="idReaderV1"' },
  { id: 'reader-v2-radio',         needle: 'id="idReaderV2"' },
  { id: 'reader-setting-event',    needle: "'Invoice Decoder Reader Setting Changed'" },
  { id: 'verify-it-yourself',      needle: 'class="id-verify"' },
  { id: 'compare-mount',           needle: 'id="idCompareMount"' },
  { id: 'engine-v2-localstorage',  needle: "'id-engine-v2'" },
];

function loadPage(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`page missing: ${path.relative(repoRoot, p)}`);
  }
  return fs.readFileSync(p, 'utf8');
}

const en = loadPage(EN_PAGE);
const es = loadPage(ES_PAGE);

const failures = [];
for (const rule of REQUIRED_PARITY) {
  const inEn = en.includes(rule.needle);
  const inEs = es.includes(rule.needle);
  if (inEn && !inEs) {
    failures.push(`  ✗ ${rule.id}: present in EN, MISSING in ES (${rule.needle})`);
  } else if (inEs && !inEn) {
    failures.push(`  ✗ ${rule.id}: present in ES, MISSING in EN (${rule.needle})`);
  } else if (!inEn && !inEs) {
    failures.push(`  ✗ ${rule.id}: MISSING in BOTH locales (${rule.needle}) — was the rule retired without removing from this list?`);
  }
}

if (failures.length) {
  console.error('Invoice Decoder bilingual parity: FAIL');
  for (const f of failures) console.error(f);
  console.error(`\nFix: mirror the missing block from the locale that has it into the locale that doesn't.`);
  console.error(`     EN page: ${path.relative(repoRoot, EN_PAGE)}`);
  console.error(`     ES page: ${path.relative(repoRoot, ES_PAGE)}`);
  if (checkMode) process.exit(1);
} else {
  console.log(`Invoice Decoder bilingual parity: ${REQUIRED_PARITY.length} structural rule(s) match across EN+ES.`);
}
