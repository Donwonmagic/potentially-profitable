/**
 * build-ingredient-state-record.mjs — the Ingredient State Record.
 *
 * One CC-BY row per Cost Index ingredient, fusing every PRESENT-STATE signal the
 * corpus already computes into a single record, plus the US import stream for
 * import-relevant ingredients. Nothing here forecasts, prices a delivered pound, or
 * asserts cause — it is a descriptive join of public data read against each
 * ingredient's own record.
 *
 * Inputs (all in-repo):
 *   - pricingCards() (scripts/lib/cost-research.mjs): posture, band, edible yield,
 *     trim tax, cheapest month, save %, the hedge swap.  [wholesale refs + yields + seasonality + co-movement]
 *   - data/ingredient-depth.json: cooked yield (the served-pound layer).
 *   - data/cost-pressure.json: present pipeline direction + confidence (12 panels).
 *   - data/ingredient-hs-codes.json (verified crosswalk) x data/census-imports-2025.jsonl:
 *     US general import value by HS6 (public domain) -> annual value + peak-import months.
 *
 * Outputs:
 *   - data/ingredient-state-record.json     (internal source of truth)
 *   - cost-index/ingredient-state-record.json / .csv   (CC-BY open-data downloads)
 *
 * Deterministic (no build clock): dateModified tracks data/cost-lockfloat.json asOf.
 *
 * Usage:  node scripts/build-ingredient-state-record.mjs            # build
 *         node scripts/build-ingredient-state-record.mjs --check    # CI: rebuild & diff (exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { pricingCards } from './lib/cost-research.mjs';

const repoRoot = process.cwd();
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repoRoot, p), 'utf8'));

// ---- US import stream (Census HS6, public domain) -------------------------
function importByHs() {
  const lines = fs.readFileSync(path.join(repoRoot, 'data/census-imports-2025.jsonl'), 'utf8').trim().split('\n');
  const out = {};
  for (const l of lines) {
    const hs = (l.match(/"hs":"(\d+)"/) || [])[1];
    let o; try { o = JSON.parse(l); } catch { continue; }
    const rows = o.rows; if (!Array.isArray(rows) || rows.length < 2) continue;
    const H = rows[0], iV = H.indexOf('GEN_VAL_MO'), iM = H.indexOf('MONTH');
    const data = rows.slice(1).filter((r) => r[iV] != null);
    if (!data.length) continue;
    const annual = data.reduce((a, r) => a + Number(r[iV] || 0), 0);
    const peak = data.map((r) => [Number(r[iM]), Number(r[iV])]).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]).sort((a, b) => a - b);
    out[hs] = { annual, peak };
  }
  return out;
}

function importBySlug() {
  const cross = rd('data/ingredient-hs-codes.json').codes;
  const byHs = importByHs();
  const bySlug = {};
  for (const [hs, meta] of Object.entries(cross)) {
    const imp = byHs[hs]; if (!imp) continue;               // no data returned for this code
    for (const slug of meta.slugs) {
      bySlug[slug] = { hs6: hs, sdesc: meta.sdesc, us_import_value_usd: imp.annual, import_peak_months: imp.peak, import_note: meta.note || null };
    }
  }
  return bySlug;
}

// ---- fuse ------------------------------------------------------------------
function build() {
  const P = pricingCards(repoRoot);
  const depth = (() => { try { return rd('data/ingredient-depth.json').ingredients || {}; } catch { return {}; } })();
  const pressure = (() => { try { return rd('data/cost-pressure.json').items || {}; } catch { return {}; } })();
  const imp = importBySlug();
  const lfAsOf = (() => { try { return rd('data/cost-lockfloat.json').asOf || null; } catch { return null; } })();

  const records = P.cards.map((c) => {
    const d = depth[c.slug] || {}; const pr = pressure[c.slug]; const im = imp[c.slug];
    const rec = {
      slug: c.slug, name: c.en, category: c.cat || null,
      posture: c.bucket,
      band_pct: c.bucket === 'withhold' ? (c.coverage ? c.bandPct : null) : c.bandPct,
      edible_yield_pct: c.yieldPct, trim_tax: c.trimTax,
      cooked_yield: d.cookedYield != null ? d.cookedYield : null,
      cheapest_month: c.worthTiming ? c.cheapMonth : null,
      save_pct: c.worthTiming ? c.savePct : null,
      hedge_swap: c.swap ? c.swap.en : null,
      pressure_dir: pr ? pr.direction : null,
      pressure_conf: pr ? pr.confidence : null,
      us_import_value_usd: im ? im.us_import_value_usd : null,
      import_peak_months: im ? im.import_peak_months : null,
      import_hs6: im ? im.hs6 : null,
      import_note: im ? im.import_note : null,
    };
    return rec;
  });

  const meta = {
    dataset: 'Muntin Cost Index — Ingredient State Record',
    url: 'https://muntin.digital/cost-index/menu-pricing/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital)',
    note: "One present-state record per ingredient, fusing pricing posture + own-baseline band, edible/cooked yield + trim tax, cheapest month, the price hedge swap, present pipeline direction, and the US import stream. Every field is descriptive of the tracked record — never a delivered/retail price, never a forecast, and co-occurrence is never cause. us_import_value_usd is US general import VALUE for the ingredient's HS6 (US Census, public domain) — a magnitude and seasonal shape of the import stream, never import volume (not published at HS6) and never a delivered cost. import_peak_months are the three highest-import calendar months (descriptive seasonality). Fields are null where a layer does not cover an ingredient.",
    rights: { corpus_columns: 'CC BY 4.0 (Muntin Cost Index)', import_columns: 'US Census general imports — public domain (US Government work)' },
    dateModified: lfAsOf,
    count: records.length,
    withImport: records.filter((r) => r.us_import_value_usd != null).length,
    withPressure: records.filter((r) => r.pressure_dir != null).length,
    ingredients: records,
  };

  const cols = ['slug', 'name', 'category', 'posture', 'band_pct', 'edible_yield_pct', 'trim_tax', 'cooked_yield', 'cheapest_month', 'save_pct', 'hedge_swap', 'pressure_dir', 'pressure_conf', 'us_import_value_usd', 'import_peak_months', 'import_hs6'];
  const esc = (v) => { if (v == null) return ''; const s = Array.isArray(v) ? v.join(';') : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [cols.join(',')].concat(records.map((r) => cols.map((k) => esc(r[k])).join(','))).join('\n') + '\n';

  return { internal: JSON.stringify({ _doc: meta.note, dateModified: lfAsOf, records }, null, 2) + '\n', json: JSON.stringify(meta, null, 2) + '\n', csv, meta };
}

// ---- write / check ---------------------------------------------------------
const out = build();
const targets = [
  ['data/ingredient-state-record.json', out.internal],
  ['cost-index/ingredient-state-record.json', out.json],
  ['cost-index/ingredient-state-record.csv', out.csv],
];
if (process.argv.includes('--check')) {
  let drift = 0;
  for (const [p, content] of targets) {
    const cur = fs.existsSync(path.join(repoRoot, p)) ? fs.readFileSync(path.join(repoRoot, p), 'utf8') : '';
    if (cur !== content) { console.error(`DRIFT: ${p} is stale — run: node scripts/build-ingredient-state-record.mjs`); drift++; }
  }
  if (drift) process.exit(1);
  console.log(`ingredient-state-record: OK — ${out.meta.count} records (${out.meta.withImport} with import, ${out.meta.withPressure} with pressure) in sync.`);
} else {
  for (const [p, content] of targets) fs.writeFileSync(path.join(repoRoot, p), content);
  console.log(`Wrote ${targets.length} file(s): ${out.meta.count} records, ${out.meta.withImport} with US import value, ${out.meta.withPressure} with pressure.`);
}
