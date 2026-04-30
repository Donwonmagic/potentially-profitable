#!/usr/bin/env node
/**
 * Phase G.12 (Growth) — assert data/kpis.json is reviewed at least
 * once per 90 days. KPIs that never get re-examined silently rot:
 * targets become hopelessly optimistic or laughably conservative,
 * the metric definition drifts from what Plausible can actually
 * query, the dashboard turns into noise.
 *
 * Forces a quarterly re-look — even if the answer is "no changes."
 *
 *   node scripts/check-kpi-doc.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const FILE = path.join(repoRoot, 'data/kpis.json');
const STALE_DAYS = 90;

if (!fs.existsSync(FILE)) {
  console.error('data/kpis.json missing — KPI dashboard will 500.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const reviewed = data._lastReviewed;
if (!reviewed || !/^\d{4}-\d{2}-\d{2}$/.test(reviewed)) {
  console.error('data/kpis.json: _lastReviewed missing or wrong format (expected YYYY-MM-DD).');
  process.exit(1);
}
const ageDays = (Date.now() - Date.parse(reviewed)) / 86400000;
if (ageDays > STALE_DAYS) {
  console.error(`data/kpis.json: _lastReviewed=${reviewed} is ${Math.round(ageDays)} days old (>${STALE_DAYS}d).`);
  console.error('Re-examine the 5 KPIs and bump _lastReviewed.');
  process.exit(1);
}
console.log(`KPI doc: ${data.kpis.length} KPI(s); _lastReviewed=${reviewed} (${Math.round(ageDays)}d old).`);
