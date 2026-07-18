/**
 * build-ingredient-state-record.mjs — the Ingredient State Record.
 *
 * One CC-BY row per Cost Index ingredient, fusing every PRESENT-STATE signal the
 * corpus already computes into a single record, plus the US import stream for
 * import-relevant ingredients. Nothing here forecasts, prices a delivered pound, or
 * asserts cause — it is a descriptive join of public data read against each
 * ingredient's own record. Built for anyone who works with food, not only operators.
 *
 * Inputs (all in-repo):
 *   - pricingCards() (scripts/lib/cost-research.mjs): posture, band, edible yield,
 *     trim tax, cheapest month, save %, the hedge swap.
 *   - data/ingredient-depth.json: cooked yield (the served-pound layer).
 *   - data/cost-pressure.json: present pipeline direction + confidence (12 panels).
 *   - data/ingredient-hs-codes.json (verified crosswalk) x data/census-imports.jsonl:
 *     US general import VALUE by HS6, 2010-2025 (public domain). Derived to a latest-year
 *     magnitude, a robust seasonal peak, and a peak-quarter concentration share.
 *
 * Outputs:
 *   - data/ingredient-state-record.json     (internal source of truth; carries the annual series)
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
import { loadEventsData, coMovement } from './lib/cost-events-analysis.mjs';

const repoRoot = process.cwd();
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repoRoot, p), 'utf8'));

// ---- US import stream (Census HS6 monthly value, 2010-2025, public domain) ----
// Value only — HS6 does not publish quantity. Value is nominal (mixes volume + price),
// so we surface the latest-year magnitude, the robust seasonal PEAK (which months
// imports concentrate — a supply-timing tell), and the peak-QUARTER share (a within-year
// ratio, so inflation-immune). All descriptive; never volume, never a delivered price,
// never a forecast.
function rawSeriesByHs() {
  const lines = fs.readFileSync(path.join(repoRoot, 'data/census-imports.jsonl'), 'utf8').trim().split('\n');
  const acc = {};
  for (const l of lines) {
    let o; try { o = JSON.parse(l); } catch { continue; }
    const rows = o.rows; if (!Array.isArray(rows) || rows.length < 2) continue;
    const H = rows[0], iS = H.indexOf('I_COMMODITY_SDESC'), iV = H.indexOf('GEN_VAL_MO'), iM = H.indexOf('MONTH'), iY = H.indexOf('YEAR'), iC = H.indexOf('I_COMMODITY');
    for (const r of rows.slice(1)) {
      if (r[iV] == null) continue;
      // Key each row by its OWN HS code (the I_COMMODITY column), not the file-line wrapper, so a
      // wildcard fetch (PARENT* -> many leaf codes in one response) groups by leaf. Falls back to
      // the wrapper hs for older single-code lines, where the two are identical (drift-safe).
      const code = iC >= 0 && r[iC] != null ? String(r[iC]) : String(o.hs);
      const a = acc[code] = acc[code] || { sdesc: null, series: [] };
      a.sdesc = a.sdesc || r[iS];
      a.series.push([Number(iY >= 0 && r[iY] != null ? r[iY] : o.year), Number(r[iM]), Number(r[iV])]);
    }
  }
  return acc; // hs -> { sdesc, series:[[year,month,value]] }
}
// Derive the per-ingredient import shape from a raw [[year,month,value]] series. Works for one
// HS code or the UNION of several (fresh+frozen, a primal split across codes) — aggregation
// happens on the raw series, then the seasonal / peak / YoY shape is derived once over the whole.
function deriveSeries(a) {
  const s = a.series; if (!s.length) return null;
  const years = [...new Set(s.map((x) => x[0]))].sort((x, y) => x - y);
  const annual = {}; for (const [y, , v] of s) annual[y] = (annual[y] || 0) + v;
  const byMonth = {}; for (const [, m, v] of s) (byMonth[m] = byMonth[m] || []).push(v);
  const meanMonth = {}; for (const m of Object.keys(byMonth)) meanMonth[m] = byMonth[m].reduce((p, q) => p + q, 0) / byMonth[m].length;
  const peak = Object.entries(meanMonth).sort((x, y) => y[1] - x[1]).slice(0, 3).map((x) => Number(x[0])).sort((x, y) => x - y);
  const q = [0, 0, 0, 0]; for (const m of Object.keys(meanMonth)) q[Math.floor((Number(m) - 1) / 3)] += meanMonth[m];
  const totalMean = q.reduce((p, x) => p + x, 0);
  const peakQ = q.indexOf(Math.max(...q));
  const last = years[years.length - 1];
  return {
    sdesc: a.sdesc, span: years[0] + '-' + last,
    latest_year: last, latest_year_usd: Math.round(annual[last]),
    peak_months: peak, peak_quarter: peakQ + 1,
    peak_quarter_share: totalMean ? Math.round((q[peakQ] / totalMean) * 100) : null,
    // 12-month seasonal fingerprint: each month's mean import value / the average month,
    // so 1.0 = a typical month, >1 = above-average import month. A within-year ratio, so
    // inflation-immune — the honest seasonal shape of the import stream.
    import_seasonal_index: (() => { const av = totalMean / 12; const arr = []; for (let mo = 1; mo <= 12; mo++) arr.push(av > 0 && meanMonth[mo] != null ? Math.round((meanMonth[mo] / av) * 100) / 100 : null); return arr; })(),
    import_yoy_pct: (annual[last] != null && annual[years[years.length - 2]] > 0) ? Math.round((annual[last] / annual[years[years.length - 2]] - 1) * 1000) / 10 : null,
    annual_usd: Object.fromEntries(years.map((y) => [y, Math.round(annual[y])])),
  };
}

// ---- shock history + co-movement per ingredient (from the events engine) --------
// Descriptive of the tracked record: how often an ingredient posts a notable move, how
// long moves last, its biggest historical departure, and which ingredients co-moved with
// it (directed: k of this ingredient's own n moves). Co-occurrence, NEVER cause.
function eventDepthBySlug() {
  let d; try { d = loadEventsData(repoRoot); } catch { return {}; }
  const co = coMovement(d);
  const out = {};
  for (const slug of Object.keys(d.items || {})) {
    const evs = (d.items[slug].events) || []; if (!evs.length) continue;
    const durs = evs.map((e) => e.durationDays).filter((x) => x > 0).sort((a, b) => a - b);
    const med = durs.length ? durs[Math.floor((durs.length - 1) * 0.5)] : null;
    const biggest = evs.slice().sort((a, b) => Math.abs(b.pctFromNormal) - Math.abs(a.pctFromNormal))[0];
    const c = co[slug];
    out[slug] = {
      notable_events_n: evs.length,
      median_shock_days: med,
      biggest_move_pct: biggest ? biggest.pctFromNormal : null,
      biggest_move_date: biggest ? biggest.date : null,
      comovers: c ? c.neighbors.slice(0, 3).map((pair) => ({ slug: pair[0], shared_of_n: pair[1] + '/' + c.n })) : null,
    };
  }
  return out;
}

// Import ORIGIN: the 2025 source-country mix per HS6 (data/census-import-origins-2025.jsonl,
// per-country x month). Groupings (continents, trade blocs, world total) are excluded — only
// real countries (4-digit CTY_CODE >= 1010). Top sources + a Herfindahl concentration index +
// a plain label. Descriptive of where the import stream came from — a supply-diversity fact,
// never a risk forecast.
function rawOriginsByHs() {
  let lines; try { lines = fs.readFileSync(path.join(repoRoot, 'data/census-import-origins-2025.jsonl'), 'utf8').trim().split('\n'); } catch { return {}; }
  const byHs = {};
  for (const l of lines) {
    let o; try { o = JSON.parse(l); } catch { continue; }
    const rows = o.rows; if (!Array.isArray(rows) || rows.length < 2) continue;
    const H = rows[0], iCty = H.indexOf('CTY_CODE'), iN = H.indexOf('CTY_NAME'), iV = H.indexOf('GEN_VAL_MO'), iCom = H.indexOf('I_COMMODITY');
    for (const r of rows.slice(1)) {
      const cty = r[iCty]; if (!/^\d{4}$/.test(cty) || Number(cty) < 1010) continue;
      // key by the row's own HS code (wildcard-safe), fall back to the wrapper for single-code lines
      const code = iCom >= 0 && r[iCom] != null ? String(r[iCom]) : String(o.hs);
      const b = byHs[code] = byHs[code] || {};
      b[r[iN]] = (b[r[iN]] || 0) + Number(r[iV] || 0);
    }
  }
  return byHs; // hs -> { COUNTRY_NAME: value }
}
// Derive the source-concentration shape from a per-country {name: value} map (one HS code or a
// summed union). Top-3 sources + a Herfindahl index + a plain label. Descriptive supply diversity.
function deriveOrigins(b) {
  const title = (s) => String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const tot = Object.values(b).reduce((a, c) => a + c, 0); if (!tot) return null;
  const sorted = Object.entries(b).map(([c, v]) => [c, v / tot]).sort((a, b) => b[1] - a[1]);
  const hhi = Math.round(sorted.reduce((a, pair) => a + pair[1] * pair[1], 0) * 100) / 100;
  return {
    import_top_sources: sorted.slice(0, 3).map((pair) => ({ country: title(pair[0]), share_pct: Math.round(pair[1] * 100) })),
    import_source_hhi: hhi,
    import_source_concentration: hhi >= 0.5 ? 'single-source' : hhi >= 0.25 ? 'concentrated' : 'diversified',
    import_source_countries_n: sorted.length,
  };
}

function importBySlug() {
  const cross = rd('data/ingredient-hs-codes.json').codes;
  const rawS = rawSeriesByHs();
  const rawO = rawOriginsByHs();
  // slug -> [hs codes]. A slug may draw on several codes (fresh+frozen, or a primal split across
  // HS10 lines); those are aggregated on the raw series + origins BEFORE the shape is derived, so
  // ribeye = the whole rib primal, not half of it. First non-empty crosswalk note wins.
  const slugCodes = {}; const slugNote = {};
  for (const [hs, meta] of Object.entries(cross)) {
    for (const slug of meta.slugs) { (slugCodes[slug] = slugCodes[slug] || []).push(hs); if (meta.note && !slugNote[slug]) slugNote[slug] = meta.note; }
  }
  // A crosswalk key may be an 8-digit HS8 SUBHEADING prefix: it stands for every HS10 leaf under
  // it (e.g. 07096040 = all sweet-bell-type peppers), summed. 6- and 10-digit keys match exactly.
  // Our data holds only HS6 (6) and HS10 (10) codes, so an 8-digit key is unambiguously a prefix.
  const dataKeys = Object.keys(rawS);
  const expand = (key) => (String(key).length === 8 ? dataKeys.filter((k) => k.startsWith(key)) : [key]);
  const bySlug = {};
  for (const [slug, codes] of Object.entries(slugCodes)) {
    const present = [...new Set(codes.flatMap(expand))].filter((hs) => rawS[hs] && rawS[hs].series.length);
    if (!present.length) continue;
    const series = [].concat(...present.map((hs) => rawS[hs].series));
    const der = deriveSeries({ sdesc: rawS[present[0]].sdesc, series });
    if (!der) continue;
    const originAcc = {};
    for (const hs of present) { const b = rawO[hs]; if (!b) continue; for (const [c, v] of Object.entries(b)) originAcc[c] = (originAcc[c] || 0) + v; }
    // Display code: the crosswalk KEYS that carried data (an HS8 prefix stays a prefix, not its
    // 20+ expanded leaves); collapse a long leaf set to "<HS6> (+N HS10 lines)" so the card reads.
    const dispCodes = codes.filter((k) => expand(k).some((hs) => rawS[hs] && rawS[hs].series.length));
    const hs6 = dispCodes.length <= 3 ? dispCodes.join('+') : dispCodes[0].slice(0, 6) + ' (+' + dispCodes.length + ' HS10 lines)';
    bySlug[slug] = Object.assign({ hs6, note: slugNote[slug] || null }, der, deriveOrigins(originAcc) || {});
  }
  return bySlug;
}

// ---- fuse ------------------------------------------------------------------
function build() {
  const P = pricingCards(repoRoot);
  const depth = (() => { try { return rd('data/ingredient-depth.json').ingredients || {}; } catch { return {}; } })();
  const pressure = (() => { try { return rd('data/cost-pressure.json').items || {}; } catch { return {}; } })();
  const imp = importBySlug();
  const evd = eventDepthBySlug();
  const lfAsOf = (() => { try { return rd('data/cost-lockfloat.json').asOf || null; } catch { return null; } })();

  const records = P.cards.map((c) => {
    const d = depth[c.slug] || {}; const pr = pressure[c.slug]; const im = imp[c.slug]; const ed = evd[c.slug] || {};
    return {
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
      us_import_value_usd: im ? im.latest_year_usd : null,
      import_years: im ? im.span : null,
      import_peak_months: im ? im.peak_months : null,
      import_peak_quarter_share: im ? im.peak_quarter_share : null,
      import_hs6: im ? im.hs6 : null,
      import_yoy_pct: im ? im.import_yoy_pct : null,
      import_seasonal_index: im ? im.import_seasonal_index : null,
      import_source_concentration: im ? im.import_source_concentration || null : null,
      import_source_hhi: im && im.import_source_hhi != null ? im.import_source_hhi : null,
      import_top_sources: im ? im.import_top_sources || null : null,
      import_annual_usd: im ? im.annual_usd : null,
      import_note: im ? im.note : null,
      notable_events_n: ed.notable_events_n != null ? ed.notable_events_n : null,
      median_shock_days: ed.median_shock_days != null ? ed.median_shock_days : null,
      biggest_move_pct: ed.biggest_move_pct != null ? ed.biggest_move_pct : null,
      biggest_move_date: ed.biggest_move_date || null,
      comovers: ed.comovers || null,
    };
  });

  // Specialty / import-defined ingredients (data/ingredient-specialty.json): NOT wholesale-priced,
  // so they carry an import stream (+ a sourced yield where present) and nothing else — band,
  // posture, seasonality, co-movement all honestly absent. Appended after the 100 priced records.
  const specialty = (() => { try { return rd('data/ingredient-specialty.json').ingredients || []; } catch { return []; } })();
  for (const sp of specialty) {
    const im = imp[sp.slug];
    // Forward-compatible: a specialty ingredient with neither an import stream nor a book yield
    // has nothing to show yet, so it's skipped until its data lands (list it in the registry now;
    // it appears the moment its HS codes are fetched). Keeps the record honest — no empty entries.
    if (!im && sp.edible_yield_pct == null) continue;
    records.push({
      slug: sp.slug, name: sp.name, category: sp.category || null,
      posture: null, band_pct: null,
      edible_yield_pct: sp.edible_yield_pct != null ? sp.edible_yield_pct : null,
      trim_tax: sp.edible_yield_pct != null ? Math.round((100 / sp.edible_yield_pct) * 100) / 100 : null,
      cooked_yield: sp.cooked_yield != null ? sp.cooked_yield : null,
      cheapest_month: null, save_pct: null, hedge_swap: null,
      pressure_dir: null, pressure_conf: null,
      us_import_value_usd: im ? im.latest_year_usd : null,
      import_years: im ? im.span : null,
      import_peak_months: im ? im.peak_months : null,
      import_peak_quarter_share: im ? im.peak_quarter_share : null,
      import_hs6: im ? im.hs6 : null,
      import_yoy_pct: im ? im.import_yoy_pct : null,
      import_seasonal_index: im ? im.import_seasonal_index : null,
      import_source_concentration: im ? im.import_source_concentration || null : null,
      import_source_hhi: im && im.import_source_hhi != null ? im.import_source_hhi : null,
      import_top_sources: im ? im.import_top_sources || null : null,
      import_annual_usd: im ? im.annual_usd : null,
      import_note: im ? im.note : null,
      notable_events_n: null, median_shock_days: null, biggest_move_pct: null, biggest_move_date: null,
      comovers: null, specialty: true,
    });
  }

  const meta = {
    dataset: 'Muntin Cost Index — Ingredient State Record',
    url: 'https://muntin.digital/cost-index/menu-pricing/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital)',
    audience: 'Food-cost intelligence for anyone who works with food — operators, chefs, home cooks, journalists, researchers. The wholesale price is a market-DIRECTION reference (your delivered or retail price tracks it with a lag and a markup); every other field is food-intrinsic and buyer-agnostic.',
    note: "One present-state record per ingredient, fusing pricing posture + own-baseline band, edible/cooked yield + trim tax, cheapest month, the price hedge swap, present pipeline direction, and the US import stream. Every field is descriptive of the tracked record — never a delivered/retail price, never a forecast, and co-occurrence is never cause. us_import_value_usd is the latest full calendar year of US general import VALUE for the ingredient's HS6 (US Census, public domain), nominal (mixes volume and price) — never import volume (not published at HS6). import_peak_months are the three highest-import calendar months averaged over 2010-2025; import_peak_quarter_share is the peak quarter's share of a typical year's import value (a within-year ratio, inflation-immune) — both descriptive seasonality, the supply-timing tell of when an ingredient leans on imports. import_top_sources / import_source_hhi / import_source_concentration describe the 2025 source-country mix (real countries only, trade blocs and continents excluded) and its Herfindahl concentration — a descriptive supply-diversity fact (raspberry ~100% Mexico, lobster ~99% Canada), never a risk forecast. import_annual_usd carries the full 2010-2025 annual series; import_yoy_pct is the latest full year versus the prior year (a descriptive change, nominal). notable_events_n, median_shock_days and biggest_move_pct+date summarize the ingredient's own notable sustained price moves in the deep history (descriptive, from the events dataset — a departure from its own baseline, never a delivered price). comovers lists the ingredients that most often moved the same way in the same six-week window, as k of this ingredient's own n moves — co-occurrence, NEVER cause. Fields are null where a layer does not cover an ingredient.",
    rights: { corpus_columns: 'CC BY 4.0 (Muntin Cost Index)', import_columns: 'US Census general imports — public domain (US Government work)' },
    dateModified: lfAsOf,
    count: records.length,
    withImport: records.filter((r) => r.us_import_value_usd != null).length,
    withPressure: records.filter((r) => r.pressure_dir != null).length,
    ingredients: records,
  };

  const cols = ['slug', 'name', 'category', 'posture', 'band_pct', 'edible_yield_pct', 'trim_tax', 'cooked_yield', 'cheapest_month', 'save_pct', 'hedge_swap', 'pressure_dir', 'pressure_conf', 'us_import_value_usd', 'import_years', 'import_peak_months', 'import_peak_quarter_share', 'import_hs6', 'import_yoy_pct', 'import_source_concentration', 'import_source_hhi', 'import_top_sources', 'notable_events_n', 'median_shock_days', 'biggest_move_pct', 'biggest_move_date', 'comovers'];
  const esc = (v) => { if (v == null) return ''; const s = Array.isArray(v) ? v.join(';') : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const cell = (r, k) => {
    if (k === 'comovers') return esc((r.comovers || []).map((x) => x.slug + ':' + x.shared_of_n).join(';'));
    if (k === 'import_top_sources') return esc((r.import_top_sources || []).map((x) => x.country + ':' + x.share_pct + '%').join(';'));
    return esc(r[k]);
  };
  const csv = [cols.join(',')].concat(records.map((r) => cols.map((k) => cell(r, k)).join(','))).join('\n') + '\n';

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
  console.log(`Wrote ${targets.length} file(s): ${out.meta.count} records, ${out.meta.withImport} with US import value (2010-2025), ${out.meta.withPressure} with pressure.`);
}
