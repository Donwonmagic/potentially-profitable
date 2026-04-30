#!/usr/bin/env node
/**
 * Phase H.8 — assert /security/ pages render every claim from
 * data/security-claims.json and that EN ↔ ES claim count matches.
 * Catches drift if a claim is added to the JSON but the renderer
 * doesn't pick it up (or vice versa).
 *
 *   node scripts/check-security-claims.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const data = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/security-claims.json'), 'utf8'));
const expectedClaims = (data.claims || []).length;
const expectedTests = (data.audit_tests || []).length;
const expectedTiers = (data.data_tiers || []).length;

const failures = [];
for (const locale of ['en', 'es']) {
  const file = path.join(repoRoot, locale === 'es' ? 'es/security' : 'security', 'index.html');
  if (!fs.existsSync(file)) {
    failures.push(`${locale}/security/index.html: missing`);
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  // Each claim renders as <article class="security-claim" id="claim-N">
  const claimMatches = src.match(/class="security-claim"/g) || [];
  if (claimMatches.length !== expectedClaims) {
    failures.push(`${locale}/security/: rendered ${claimMatches.length} claim(s); expected ${expectedClaims}`);
  }
  // Schema JSON-LD also has 9 Claim items.
  const claimSchemaMatches = src.match(/"@type":\s*"Claim"/g) || [];
  if (claimSchemaMatches.length !== expectedClaims) {
    failures.push(`${locale}/security/: schema has ${claimSchemaMatches.length} Claim items; expected ${expectedClaims}`);
  }
  // Audit tests and tiers.
  const testRows = src.match(/security-audit__pass/g) || [];
  if (testRows.length !== expectedTests) {
    failures.push(`${locale}/security/: rendered ${testRows.length} audit row(s); expected ${expectedTests}`);
  }
  const tierCards = src.match(/class="security-tier"/g) || [];
  if (tierCards.length !== expectedTiers) {
    failures.push(`${locale}/security/: rendered ${tierCards.length} tier(s); expected ${expectedTiers}`);
  }
}

if (failures.length) {
  console.error(`Security claims: ${failures.length} drift(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  console.error('\nRun: node scripts/inject-security-page-schema.mjs');
  process.exit(1);
}
console.log(`Security claims: ${expectedClaims} claims × 2 locales, ${expectedTests} audit tests × 2, ${expectedTiers} tiers × 2 — all rendered + schema'd.`);
