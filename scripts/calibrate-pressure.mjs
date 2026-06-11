/* calibrate-pressure.mjs — the honest backtest, run over every indicator→ingredient
 * edge in data/pressure-rules.json.
 *
 * For each edge it pulls the indicator's long monthly history + the ingredient's
 * long-history PRICE PROXY (a BLS PPI series, years deep — NOT our 26-week anchor),
 * aligns them, transforms to stationary deseasonalized monthly changes, and runs
 * tools/_shared/pressure-calibrate.js#calibrateEdge (lag frozen on train, p adjusted
 * for the search, sign must hold out-of-sample). Benjamini-Hochberg controls the
 * false-discovery rate across all edges. It writes data/pressure-calibration.json +
 * a console report putting the EMPIRICAL lag/sign/strength/N next to each hand-set
 * rule value and flagging every disagreement.
 *
 * It NEVER edits the rules. A human reads the report and applies weight/lag/sign
 * changes by hand with a _version bump (the canon forbids silent tuning).
 *
 *   node scripts/calibrate-pressure.mjs --selftest   # synthetic, no network
 *   BLS_KEY=… FRED_KEY=… EIA_KEY=… NASS_KEY=… node scripts/calibrate-pressure.mjs   # live (in the Action)
 *
 * Circularity guard: an indicator whose own source is the proxy's pipeline (a price
 * predicting the same price) is marked CIRCULAR and excluded from weight suggestions.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const C = require(path.join(repoRoot, 'tools/_shared/pressure-calibrate.js'));
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));
const arg = (f) => process.argv.includes(f);

const rules = rd('data/pressure-rules.json');
const specs = (rd('data/pressure-source-specs.json').specs) || {};

// Ingredient → long-history price PROXY (BLS PPI monthly; years deep). The target
// the leading indicators must predict. Produce share the coarse fresh-veg index
// (PPI doesn't resolve lettuce vs onion) — flagged in the report.
const PROXY = {
  'ribeye': 'WPU022101', 'beef-tenderloin': 'WPU022101',
  'pork-loin': 'WPU022104', 'pork-shoulder': 'WPU022104',
  'chicken-breast': 'WPU022203', 'whole-chicken': 'WPU022203',
  'butter': 'WPU02320114', 'cheddar-cheese': 'WPU023',
  'romaine-lettuce': 'WPU0113', 'tomato': 'WPU0113', 'onion': 'WPU0113', 'russet-potato': 'WPU0113',
  // seafood (import-dominated): the deep US seafood PPI is the monthly target; the IMF
  // global price + FX + feed are the international LEADING indicators tested against it.
  'salmon-fillet': 'WPU0223', 'shrimp': 'WPU02230501'
};
// Indicator source families that are themselves a PRICE in the proxy's pipeline →
// near-circular; calibrate for information but never suggest a weight.
const CIRCULAR_SOURCES = new Set([]);  // none today; e.g. add 'lmr-cutout' if introduced
// Indicator types we don't calibrate this pass (deterministic / event / windowed).
const SKIP_TYPES = new Set(['season', 'nws', 'ams-move']);

// ---- date normalization --------------------------------------------
// USDA reports date as MM/DD/YYYY; FRED/BLS/NASS as YYYY-MM-DD or YYYY-MM. Normalize
// everything to YYYY-MM-DD (or YYYY-MM) so the week/month bucketers agree — the
// MM/DD/YYYY anchors were silently bucketing to ZERO weeks → monthly fallback.
function normDate(s) {
  s = String(s || '');
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${('0' + m[1]).slice(-2)}-${('0' + m[2]).slice(-2)}`;
  m = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (m) return m[3] ? `${m[1]}-${m[2]}-${m[3]}` : `${m[1]}-${m[2]}`;
  return s;
}

// ---- monthly series helpers ----------------------------------------
const ym = (d) => normDate(d).slice(0, 7);               // → 'YYYY-MM'
function monthlyFromDated(pairs) {                         // [{date,value}] → sorted [{ym, v}] (avg per month)
  const by = {};
  pairs.forEach((p) => { const k = ym(p.date); const v = Number(p.value); if (!k || !isFinite(v)) return; (by[k] = by[k] || []).push(v); });
  return Object.keys(by).sort().map((k) => ({ ym: k, v: by[k].reduce((s, x) => s + x, 0) / by[k].length }));
}
function alignMonthly(a, b) {                              // inner-join two [{ym,v}] on ym
  const mb = {}; b.forEach((p) => { mb[p.ym] = p.v; });
  const out = [];
  a.forEach((p) => { if (p.ym in mb) out.push({ ym: p.ym, x: p.v, y: mb[p.ym] }); });
  return out.sort((p, q) => p.ym.localeCompare(q.ym));
}
function monthNums(rows) { return rows.map((r) => parseInt(r.ym.slice(5, 7), 10) - 1); }

// ---- WEEKLY machinery (the target-rebuild: align to the price we publish) -------
// The weekly anchor is the keystone fix — monthly PPI smeared away the weekly leads.
const WK = 7 * 864e5;
function weekKey(dateStr) {                                // any date → integer week bucket (sortable) + its month
  const m = normDate(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return { wk: Math.floor(t / WK), mo: +m[2] - 1 };
}
function weeklyFromDated(pairs) {                          // [{date,value}] → sorted [{wk, mo, v}] (avg per ISO week)
  const by = {};
  pairs.forEach((p) => { const k = weekKey(p.date); const v = Number(p.value); if (!k || !isFinite(v)) return; (by[k.wk] = by[k.wk] || { mo: k.mo, vals: [] }).vals.push(v); });
  return Object.keys(by).map(Number).sort((a, b) => a - b).map((w) => ({ wk: w, mo: by[w].mo, v: by[w].vals.reduce((s, x) => s + x, 0) / by[w].vals.length }));
}
function alignWeekly(a, b) {                               // inner-join two weekly series on wk
  const mb = {}; b.forEach((p) => { mb[p.wk] = p.v; });
  return a.filter((p) => p.wk in mb).map((p) => ({ wk: p.wk, mo: p.mo, x: p.v, y: mb[p.wk] })).sort((p, q) => p.wk - q.wk);
}

// Ingredient → the WEEKLY wholesale ANCHOR we actually publish — MIRRORS the exact
// source specs the MEASURED index uses (data/cost-index-sources.json), so the
// calibration target IS the published price. Meat/dairy: keyless LMR Datamart
// (mpr.datamart.ams.usda.gov). Chicken + produce: keyed MARS (marsapi). Scale is
// irrelevant (we calibrate on % CHANGES, which are scale-free). matchField filters
// rows to the cut/commodity; dateField is the report's own date column.
const LMR_BASE = 'https://mpr.datamart.ams.usda.gov/services/v1.1/reports/';
const MARS_BASE = 'https://marsapi.ams.usda.gov/services/v1.2/reports/';
const ANCHOR = {
  'ribeye':          { host: 'lmr', report: '2453', section: 'Choice Cuts', match: { field: 'item_description', value: 'Ribeye' }, field: 'weighted_average', dateField: 'report_date', winField: 'report_date', note: 'LMR 2453 Choice Cuts / Ribeye' },
  'beef-tenderloin': { host: 'lmr', report: '2453', section: 'Choice Cuts', match: { field: 'item_description', value: 'Butt Tender' }, field: 'weighted_average', dateField: 'report_date', winField: 'report_date', note: 'LMR 2453 / Loin, butt tender, trimmed (191A)' },
  'pork-loin':       { host: 'lmr', report: '2498', section: 'Cutout and Primal Values', field: 'pork_loin', dateField: 'report_date', winField: 'report_date', note: 'LMR 2498 cutout / pork_loin' },
  'pork-shoulder':   { host: 'lmr', report: '2498', section: 'Cutout and Primal Values', field: 'pork_butt', dateField: 'report_date', winField: 'report_date', note: 'LMR 2498 cutout / pork_butt' },
  'chicken-breast':  { host: 'mars', report: '3646', section: 'Report Detail', match: { field: 'item', value: 'Breast - B/S' }, field: 'wtd_avg_price', dateField: 'report_date', note: 'AMS 3646 Nat. Chicken / Breast B/S' },
  'whole-chicken':   { host: 'mars', report: '3646', section: 'Report Detail', match: { field: 'item', value: 'Whole' }, field: 'wtd_avg_price', dateField: 'report_date', note: 'AMS 3646 / Whole' },
  'butter':          { host: 'lmr', report: '2993', section: 'Butter Prices and Sales', field: 'Butter_Price', dateField: 'week_ending_date', winField: 'week_ending_date', note: 'NDPSR 2993 butter' },
  'cheddar-cheese':  { host: 'lmr', report: '2993', section: '40 Pound Block Cheddar Cheese Prices and Sales', field: 'cheese_40_Price', dateField: 'week_ending_date', winField: 'week_ending_date', note: 'NDPSR 2993 block cheddar' },
  // romaine + onion commodities carry a comma ("Lettuce, Romaine" / "Onions, Dry"), which
  // marsapi's exact filter splits on as its OR-separator → a server-side filter can never
  // match. anchorSeries applies the exact match CLIENT-side anyway, so we just drop
  // serverFilter and pull the report unfiltered, capped to maxYears to bound the download.
  'romaine-lettuce': { host: 'mars', report: '2307', section: 'Report Details', match: { field: 'commodity', value: 'Lettuce, Romaine', exact: true }, maxYears: 6, field: 'low_price', dateField: 'report_begin_date', note: 'LA terminal 2307 / Lettuce, Romaine (client-filtered: comma defeats server filter)' },
  'tomato':          { host: 'mars', report: '2307', section: 'Report Details', match: { field: 'commodity', value: 'Tomatoes', exact: true }, serverFilter: true, field: 'low_price', dateField: 'report_begin_date', note: 'LA terminal 2307 / Tomatoes' },
  'onion':           { host: 'mars', report: '2308', section: 'Report Details', match: { field: 'commodity', value: 'Onions, Dry', exact: true }, maxYears: 6, field: 'low_price', dateField: 'report_begin_date', note: 'LA terminal 2308 / Onions, Dry (client-filtered: comma defeats server filter)' },
  'russet-potato':   { host: 'mars', report: '2308', section: 'Report Details', match: { field: 'commodity', value: 'Potatoes', exact: true }, match2: { field: 'variety', value: 'Russet' }, serverFilter: true, field: 'low_price', dateField: 'report_begin_date', note: 'LA terminal 2308 / Potatoes×Russet variety' }
};
function amsAuth() { const k = process.env.AMS_KEY; return k ? 'Basic ' + Buffer.from(k + ':').toString('base64') : null; }
// Stitch a report's section across ~150-day windows back `years` (the APIs cap each
// call ~180d). Host-aware: LMR Datamart is keyless, MARS is keyed. A failed window
// is skipped (one gap can't drop the series).
async function fetchReportWindowed(spec, years) {
  const base = spec.host === 'lmr' ? LMR_BASE : MARS_BASE;
  const auth = spec.host === 'lmr' ? null : amsAuth();
  if (spec.host !== 'lmr' && !auth) return [];
  const winField = spec.winField || 'report_begin_date';
  const sect = spec.section ? `/${encodeURIComponent(spec.section)}` : '';
  const fmt = (d) => `${('0' + (d.getMonth() + 1)).slice(-2)}/${('0' + d.getDate()).slice(-2)}/${d.getFullYear()}`;
  years = Math.min(years, spec.maxYears || years);          // per-anchor cap (bounds an unfiltered client-side fetch)
  const now = Date.now(); const step = 150 * 864e5;
  // Build every window's URL up front, then fetch them CONCURRENTLY — the windows are
  // independent, so the sequential await-loop (≈10 round trips per anchor) was the main
  // thing pushing the calibrate job past its timeout. A failed window still drops out
  // silently (one gap can't sink the series).
  const urls = [];
  for (let end = now; end > now - years * 365 * 864e5; end -= step) {
    const e = new Date(end), s = new Date(end - step);
    // Server-side commodity filter (MARS supports `;`-AND) so a huge terminal report
    // returns only the one commodity's rows — the difference between a 60k-row and a
    // ~200-row response, which is what was timing the run out.
    let qstr = `${winField}=${fmt(s)}:${fmt(e)}`;
    if (spec.serverFilter && spec.match) qstr += `;${spec.match.field}=${spec.match.value}`;
    urls.push(`${base}${encodeURIComponent(spec.report)}${sect}?q=${encodeURIComponent(qstr)}`);
  }
  const init = auth ? { headers: { Authorization: auth } } : {};
  // Determinism guard: firing ~29 windows at one host concurrently rate-limits some, and
  // silently dropping them made the calibration non-reproducible (cheddar lost 43% of its
  // history one run → beef-tenderloin's edge flipped). So RETRY each window with backoff and
  // BOUND concurrency; if a window still fails after retries, count it and warn loudly so a
  // degraded run is never mistaken for a real signal change.
  async function getWindow(u) {
    for (let a = 0; a < 4; a++) {
      try { const j = await getJson(u, init); return (j && j.results) || []; }
      catch (e2) { if (a < 3) await new Promise((r) => setTimeout(r, 400 * Math.pow(2, a))); }
    }
    return null;   // null = hard failure after retries (distinct from an empty window)
  }
  const CONC = 6, out = []; let failed = 0;
  for (let i = 0; i < urls.length; i += CONC) {
    const batch = await Promise.all(urls.slice(i, i + CONC).map(getWindow));
    batch.forEach((rows) => { if (rows === null) failed++; else rows.forEach((r) => out.push(r)); });
  }
  if (failed) console.log(`  ⚠ ${spec.host}:${spec.report} — ${failed}/${urls.length} history windows failed after retries; this run's series is SHORT (verdicts may be unstable).`);
  return out;
}
// rows → [{date, value}] for one anchor: filter to the cut/commodity, read the price
// column + the report's date column. Scale-free (calibration uses % changes). `match`
// pins the commodity; optional `match2` narrows within it (e.g. variety=Russet inside
// commodity=Potatoes, since the terminal report breaks russet out by variety).
function matchRow(r, m) {
  if (!m) return true;
  const cv = String(r[m.field] || '');
  return m.exact ? cv === m.value : cv.toUpperCase().indexOf(String(m.value).toUpperCase()) >= 0;
}
function anchorSeries(rows, spec) {
  return (rows || []).filter((r) => matchRow(r, spec.match) && matchRow(r, spec.match2))
    .map((r) => ({ date: r[spec.dateField], value: r[spec.field] }))
    .filter((p) => p.date && p.value != null && p.value !== '' && isFinite(Number(String(p.value).replace(/[$,]/g, ''))));
}

// ---- live fetchers (run in the Action; each → [{date:'YYYY-MM-DD'|'YYYY-MM', value}]) ----
async function getJson(url, init) {
  const r = await fetch(url, Object.assign({ headers: { 'User-Agent': 'muntin.digital cost-index calibrate' } }, init || {}));
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function fetchProxy(seriesId) {                      // BLS PPI monthly, ~10y
  const key = process.env.BLS_KEY;
  const end = new Date().getFullYear();
  const body = { seriesid: [seriesId], startyear: String(end - 10), endyear: String(end) };
  if (key) body.registrationkey = key;
  const j = await getJson('https://api.bls.gov/publicAPI/v2/timeseries/data/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = (((j.Results || {}).series || [])[0] || {}).data || [];
  return data.filter((d) => /^M\d\d$/.test(d.period) && d.period !== 'M13')
    .map((d) => ({ date: `${d.year}-${d.period.slice(1)}`, value: d.value }));
}

// ---- Norway SSB PxWebApi v2 (keyless; weekly salmon export price + volume, 2000+) ------
// SSB bot-blocks default UAs (returns 403), so send a browser UA. We pull the whole table
// (Tid=all) as JSON-stat2 and flatten generically: locate the TIME dim + the CONTENTS dim,
// pick the price or volume measure by keyword, fix any other dims to their first category.
// Scale-free (calibration uses % changes). Period codes like '2024U15' → that ISO week's Monday.
const SSB_BASE = (t) => `https://data.ssb.no/api/pxwebapi/v2/tables/${t}`;
const SSB_META = (t) => `${SSB_BASE(t)}/metadata?lang=en`;
// PxWebApi v2 requires a selection for EVERY mandatory variable once you select any one
// ("Missing selection for mandatory variable"). So read the variable list from metadata and
// select all values (*) of each — that returns the full table (all weeks × commodity ×
// contents). ssbExtract then picks the time dim + the price/volume measure and fixes the
// commodity dim to its first value (fresh salmon).
function ssbAllVarsUrl(t, vars) {
  const sel = vars.map((v) => `valueCodes%5B${encodeURIComponent(v)}%5D=*`).join('&');
  return `${SSB_BASE(t)}/data?lang=en&outputFormat=json-stat2&${sel}`;
}
const SSB_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 muntin.digital';
async function uaGet(url) {
  const r = await fetch(url, { headers: { 'User-Agent': SSB_UA, Accept: 'application/json' } });
  if (!r.ok) { let b = ''; try { b = (await r.text()).slice(0, 300).replace(/\s+/g, ' '); } catch (e) { /* no body */ } throw new Error(`HTTP ${r.status}${b ? ' · ' + b : ''}`); }
  return r.json();
}
// ISO-8601 week → Monday date (week 1 holds the year's first Thursday).
function isoWeekToDate(y, w) {
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const wk1Mon = new Date(jan4); wk1Mon.setUTCDate(jan4.getUTCDate() - dow + 1);
  const d = new Date(wk1Mon); d.setUTCDate(wk1Mon.getUTCDate() + (w - 1) * 7);
  return `${d.getUTCFullYear()}-${('0' + (d.getUTCMonth() + 1)).slice(-2)}-${('0' + d.getUTCDate()).slice(-2)}`;
}
function ssbPeriodToDate(code) {
  let m = String(code).match(/^(\d{4})[UuVv](\d{1,2})$/); if (m) return isoWeekToDate(+m[1], +m[2]);   // week
  m = String(code).match(/^(\d{4})[Mm](\d{2})$/); if (m) return `${m[1]}-${m[2]}-15`;                   // month
  m = String(code).match(/^(\d{4})$/); if (m) return `${m[1]}-07-01`;                                    // year
  return null;
}
// Flatten a JSON-stat2 dataset to [{date,value}] for the chosen measure.
function ssbExtract(js, measure) {
  const dim = js.dimension || {};
  const ids = js.id || Object.keys(dim);
  const sizes = js.size || ids.map((id) => Object.keys(dim[id].category.index).length);
  const stride = new Array(ids.length); stride[ids.length - 1] = 1;
  for (let i = ids.length - 2; i >= 0; i--) stride[i] = stride[i + 1] * sizes[i + 1];
  // time dim: id 'Tid' or codes that look like periods
  let timeI = ids.indexOf('Tid');
  if (timeI < 0) timeI = ids.findIndex((id) => Object.keys(dim[id].category.index).some((c) => /^\d{4}([UuVvMm]\d{1,2})?$/.test(c)));
  // contents dim: id 'ContentsCode' or the dim carrying units
  let contI = ids.indexOf('ContentsCode');
  if (contI < 0) contI = ids.findIndex((id) => dim[id].category && dim[id].category.unit);
  if (timeI < 0) return [];
  // pick the measure category (price = kr/NOK per kg; volume = tonn/kg/weight/mengde)
  let contIdx = 0;
  if (contI >= 0) {
    const cat = dim[ids[contI]].category, lab = cat.label || {}, unit = cat.unit || {};
    const want = measure === 'volume' ? /(tonn|weight|mengde|quantity|kvantum|volume)/i : /(kr|nok|price|pris|per kg|øre)/i;   // NB: price unit is "NOK per kg" → keep 'kg' OUT of the volume set
    const code = Object.keys(cat.index).find((c) => want.test(`${lab[c] || ''} ${(unit[c] && (unit[c].base || unit[c].label)) || ''}`));
    if (code != null) contIdx = cat.index[code];
  }
  const tcat = dim[ids[timeI]].category, out = [];
  for (const [code, ti] of Object.entries(tcat.index)) {
    let flat = 0;
    for (let i = 0; i < ids.length; i++) flat += (i === timeI ? ti : i === contI ? contIdx : 0) * stride[i];
    const v = Number(js.value[flat]); const date = ssbPeriodToDate(code);
    if (date && isFinite(v)) out.push({ date, value: v });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
async function fetchSSB(spec) {
  const meta = await uaGet(SSB_META(spec.table));
  const vars = meta.id || Object.keys(meta.dimension || {});
  const s = ssbExtract(await uaGet(ssbAllVarsUrl(spec.table, vars)), spec.measure || 'price');
  if (s.length >= 60) return s;
  throw new Error(`SSB ${spec.table}: only ${s.length} pts after all-vars selection`);
}

// ---- NOAA Fisheries FOSS Foreign Trade API (keyless; monthly US seafood imports) -------
// Oracle ORDS REST. We pull IMPORT rows for the spec's HTS codes, sum the measure (kilos =
// supply, or val = $ landed) across all partner countries per year-month → a monthly supply
// series. Import VOLUME up → US supply up → cost DOWN (-1). Bot-blocks default UAs → browser
// UA (shared uaGet). ORDS pages via limit/offset + hasMore. 2009→present, ~6-8wk lag.
// Canonical ORDS endpoint (confirmed in NOAA's own developer docs). When it serves an HTML
// "Under Maintenance" page, uaGet's JSON parse throws → the indicator skips gracefully.
const FOSS_BASE = 'https://www.st.nmfs.noaa.gov/ords/foss/trade_data/';
function fossAggregate(items, measure) {                    // [{year,month,kilos,val,...}] → [{date,value}] (monthly sum)
  const by = {};
  for (const r of (items || [])) {
    const y = parseInt(r.year, 10), m = parseInt(r.month, 10);
    const v = Number(measure === 'val' ? r.val : r.kilos);
    if (!(y >= 1990) || !(m >= 1 && m <= 12) || !isFinite(v)) continue;
    const k = `${y}-${('0' + m).slice(-2)}`; by[k] = (by[k] || 0) + v;
  }
  return Object.keys(by).sort().map((k) => ({ date: `${k}-15`, value: by[k] }));
}
// One request per HTS code (avoids depending on ORDS '$in' support), paginated.
async function fetchFOSS(spec) {
  const source = spec.source || 'IMP', hts = (spec.hts && spec.hts.length) ? spec.hts : [null];
  const items = [];
  for (const code of hts) {
    const filter = { source }; if (code) filter.hts_number = code;
    const q = encodeURIComponent(JSON.stringify(filter));
    let offset = 0;
    for (let page = 0; page < 60; page++) {
      const j = await uaGet(`${FOSS_BASE}?q=${q}&limit=10000&offset=${offset}`);
      if (!j || !Array.isArray(j.items)) throw new Error('non-JSON response (endpoint under maintenance?)');
      j.items.forEach((r) => items.push(r));
      if (!j.hasMore) break;
      offset += (j.limit || j.items.length || 10000);
    }
  }
  return fossAggregate(items, spec.measure || 'kilos');
}

// ---- NOAA CPC ENSO / Oceanic Niño Index (keyless flat ASCII; monthly anomaly 1950+) -----
// One text file: rows `SEAS YR TOTAL ANOM`, SEAS a 3-month season centered on its middle
// month (DJF→Jan … NDJ→Dec). ANOM is the SST anomaly (°C, crosses zero) → use transform
// 'level' downstream, not pct change. value = ANOM; date = the center month.
const ONI_URL = 'https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt';
const ONI_SEAS = { DJF: '01', JFM: '02', FMA: '03', MAM: '04', AMJ: '05', MJJ: '06', JJA: '07', JAS: '08', ASO: '09', SON: '10', OND: '11', NDJ: '12' };
function parseONI(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const c = line.trim().split(/\s+/);
    if (c.length < 4) continue;
    const mo = ONI_SEAS[c[0].toUpperCase()], anom = Number(c[3]);
    if (!mo || !/^\d{4}$/.test(c[1]) || !isFinite(anom)) continue;
    out.push({ date: `${c[1]}-${mo}-15`, value: anom });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
async function fetchText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'muntin.digital cost-index calibrate' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}
async function fetchONI(spec) { return parseONI(await fetchText(spec.url || ONI_URL)); }

// ---- EU Agri-food Data Portal — dairy prices (keyless; weekly butter + cheddar) ---------
// The base host has moved; try a few. Endpoint /dairy/prices?products=&memberStateCodes=
// returns weekly observations [{ beginDate(DD/MM/YYYY), price, product, memberStateName }].
// EU price up → US dairy import cost up (sign +1). EU numbers may use a comma decimal.
const EU_BASES = ['https://www.ec.europa.eu/agrifood/api', 'https://api.tech.ec.europa.eu/agrifood', 'https://ec.europa.eu/agrifood/api'];
function euDate(s) { const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : (/^\d{4}-\d{2}-\d{2}/.test(s) ? String(s).slice(0, 10) : null); }
function euNum(s) { let t = String(s).replace(/[^\d.,-]/g, ''); if (/,\d{1,2}$/.test(t) && !/\.\d/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); else t = t.replace(/,/g, ''); return Number(t); }
function parseEUDairy(rows) {
  return (rows || []).map((r) => ({ date: euDate(r.beginDate || r.begindate || r.weekDate || r.date), value: euNum(r.price != null ? r.price : r.value) }))
    .filter((p) => p.date && isFinite(p.value)).sort((a, b) => a.date.localeCompare(b.date));
}
async function fetchEUAgri(spec) {
  const params = `products=${encodeURIComponent(spec.product)}&memberStateCodes=${encodeURIComponent(spec.member || 'EU')}`;
  let lastErr;
  for (const base of EU_BASES) {
    try {
      const j = await uaGet(`${base}/dairy/prices?${params}`);
      const rows = Array.isArray(j) ? j : (j.results || j.data || j.items || []);
      const s = parseEUDairy(rows); if (s.length >= 20) return s; lastErr = new Error(`${s.length} pts`);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('no EU agrifood host returned the series');
}

// ---- Open-Meteo ERA5 archive (keyless; daily weather → monthly anomaly) -----------------
// One point, one daily variable, 2015→now. Zip daily.time[] + daily[var][] → [{date,value}];
// the calibration aggregates to monthly + deseasonalizes (transform:level → the anomaly).
function zipDaily(j, v) {
  const t = (j && j.daily && j.daily.time) || [], val = (j && j.daily && j.daily[v]) || [], out = [];
  for (let i = 0; i < t.length; i++) { const x = Number(val[i]); if (/^\d{4}-\d{2}-\d{2}/.test(t[i]) && isFinite(x)) out.push({ date: t[i], value: x }); }
  return out;
}
async function fetchOpenMeteo(spec) {
  const end = new Date().toISOString().slice(0, 10), v = spec.variable;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${spec.lat}&longitude=${spec.lon}&start_date=2015-01-01&end_date=${end}&daily=${encodeURIComponent(v)}&timezone=UTC`;
  return zipDaily(await uaGet(url), v);
}

async function fetchIndicatorHistory(spec) {
  if (spec.type === 'fred') {
    const k = process.env.FRED_KEY; if (!k) return { skip: 'no FRED_KEY' };
    const j = await getJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(spec.series)}&api_key=${k}&file_type=json&observation_start=2015-01-01`);
    return { pairs: (j.observations || []).map((o) => ({ date: o.date, value: o.value })) };
  }
  if (spec.type === 'ssb') {                                // Norway SSB PxWebApi v2 (keyless)
    try { return { pairs: await fetchSSB(spec) }; }
    catch (e) { return { skip: `ssb ${spec.table}: ${e.message}` }; }
  }
  if (spec.type === 'foss') {                               // NOAA Fisheries FOSS trade (keyless)
    try { return { pairs: await fetchFOSS(spec) }; }
    catch (e) { return { skip: `foss ${(spec.hts || []).join('/')}: ${e.message}` }; }
  }
  if (spec.type === 'noaa-oni') {                            // NOAA CPC ENSO/ONI (keyless flat file)
    try { return { pairs: await fetchONI(spec) }; }
    catch (e) { return { skip: `oni: ${e.message}` }; }
  }
  if (spec.type === 'eu-agri') {                             // EU Agri-food dairy prices (keyless)
    try { return { pairs: await fetchEUAgri(spec) }; }
    catch (e) { return { skip: `eu-agri ${spec.product}: ${e.message}` }; }
  }
  if (spec.type === 'open-meteo') {                          // Open-Meteo ERA5 archive (keyless)
    try { return { pairs: await fetchOpenMeteo(spec) }; }
    catch (e) { return { skip: `open-meteo ${spec.variable}: ${e.message}` }; }
  }
  if (spec.type === 'eia') {
    const k = process.env.EIA_KEY; if (!k) return { skip: 'no EIA_KEY' };
    const j = await getJson(`https://api.eia.gov/v2/seriesid/${encodeURIComponent(spec.series)}?api_key=${k}`);
    const data = (j.response && j.response.data) || [];
    return { pairs: data.map((d) => ({ date: d.period, value: d.value })) };
  }
  if (spec.type === 'nass') {
    const k = process.env.NASS_KEY; if (!k) return { skip: 'no NASS_KEY' };
    const q = Object.entries(spec.query || {}).map(([a, b]) => `${a}=${encodeURIComponent(b)}`).join('&');
    const j = await getJson(`https://quickstats.nass.usda.gov/api/api_GET/?key=${k}&${q}&format=JSON`);
    const rows = (j.data || []).map((r) => ({ date: nassDate(r), value: String(r.Value || '').replace(/,/g, '') })).filter((r) => r.date);
    return { pairs: rows };
  }
  if (spec.type === 'usdm') {
    const aoi = (spec.areas || ['US']).join(',');
    const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    const end = new Date(), start = new Date(end.getTime() - 9 * 365 * 86400000);
    const url = `https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=${aoi}&startdate=${fmt(start)}&enddate=${fmt(end)}&statisticsType=1`;
    const rows = await getJson(url, { headers: { Accept: 'application/json' } });
    // severe share per row (d2+d3+d4), date = mapDate; monthlyFromDated averages.
    const pairs = (Array.isArray(rows) ? rows : []).map((r) => {
      const lc = {}; Object.keys(r).forEach((kk) => { lc[kk.toLowerCase()] = r[kk]; });
      const sev = (spec.categories || ['D2', 'D3', 'D4']).reduce((s, c) => s + (parseFloat(lc[c.toLowerCase()]) || 0), 0);
      const d = String(lc.mapdate || lc.validstart || '');
      const date = /^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
      return { date, value: sev };
    }).filter((p) => p.date);
    return { pairs };
  }
  return { skip: `type ${spec.type} not calibrated` };
}
// NASS date: prefer week_ending; else year + month-name; else year + begin_code as month.
const MONTHS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
function nassDate(r) {
  if (r.week_ending && /^\d{4}-\d\d-\d\d/.test(r.week_ending)) return r.week_ending;
  const y = r.year; if (!y) return null;
  const rp = String(r.reference_period_desc || '').toUpperCase();
  for (const m in MONTHS) if (rp.indexOf(m) === 0 || rp.indexOf(' ' + m) >= 0) return `${y}-${MONTHS[m]}`;
  const bc = parseInt(r.begin_code, 10);
  if (bc >= 1 && bc <= 12) return `${y}-${('0' + bc).slice(-2)}`;
  if (bc >= 1 && bc <= 53) { const mo = Math.min(12, Math.max(1, Math.ceil(bc / 4.345))); return `${y}-${('0' + mo).slice(-2)}`; }
  return null;
}

// ---- the run -------------------------------------------------------
// Integer month ordinal (year*12 + month) so monthly buckets key the same way weekly
// buckets do (integers) — the joint fit's `W − lag` arithmetic then works uniformly
// at both resolutions ('YYYY-MM' strings would break Number()/subtraction).
const monthOrd = (ymStr) => { const m = String(ymStr).match(/(\d{4})-(\d{2})/); return m ? (+m[1]) * 12 + (+m[2] - 1) : NaN; };
const bucketKey = (r) => (r.wk != null ? r.wk : monthOrd(r.ym));
// Native cadence of an indicator's own history: median gap between dated observations.
// Month-stamped series ('YYYY-MM', no day) and ≤3-point series read as monthly. This
// is what lets a MONTHLY driver be tested at monthly resolution against the monthly-
// aggregated anchor, instead of being starved on a weekly grid.
function medianCadence(pairs) {
  const ds = (pairs || []).map((p) => normDate(p.date)).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)).sort();
  if (ds.length < 4) return 'monthly';
  const gaps = [];
  for (let i = 1; i < ds.length; i++) { const a = Date.parse(ds[i - 1]), b = Date.parse(ds[i]); if (isFinite(a) && isFinite(b) && b > a) gaps.push((b - a) / 864e5); }
  if (!gaps.length) return 'monthly';
  gaps.sort((x, y) => x - y);
  return gaps[Math.floor(gaps.length / 2)] <= 10 ? 'weekly' : 'monthly';
}
// stationary deseasonalized changes of an aligned [{x,y,mo|ym}] series, robust to
// pctChange dropping a non-positive base (inner-join the x/y changes on their index).
// xt = the INDICATOR transform: 'pct' (default, for prices), 'diff' (first difference) or
// 'level' (use the raw value — correct for an already-stationary ANOMALY like ONI that
// crosses zero, where pct change would explode). The TARGET (price) is always pct change.
// Also returns xMap: the indicator change keyed by its week/month bucket (for the joint fit).
function keyedChanges(al, xt) {
  const xRaw = al.map((p) => p.x);
  let xCh;
  if (xt === 'level') xCh = xRaw.map((v, i) => ({ idx: i, v: Number(v) })).filter((o) => isFinite(o.v));
  else if (xt === 'diff') { xCh = []; for (let i = 1; i < xRaw.length; i++) { const a = Number(xRaw[i - 1]), b = Number(xRaw[i]); if (isFinite(a) && isFinite(b)) xCh.push({ idx: i, v: b - a }); } }
  else xCh = C.pctChange(xRaw, 1);
  const yCh = C.pctChange(al.map((p) => p.y), 1);
  const ym = {}; yCh.forEach((o) => { ym[o.idx] = o.v; });
  const idxs = [], xs = [], ys = [], mos = [];
  xCh.forEach((o) => { if (o.idx in ym) { idxs.push(o.idx); xs.push(o.v); ys.push(ym[o.idx]); const r = al[o.idx]; mos.push(r.mo != null ? r.mo : parseInt(String(r.ym).slice(5, 7), 10) - 1); } });
  const xc = C.deseasonalizeByMonth(xs, mos), yc = C.deseasonalizeByMonth(ys, mos);
  const xMap = {}; idxs.forEach((idx, i) => { xMap[bucketKey(al[idx])] = xc[i]; });
  return { xc, yc, xMap, n: xs.length };
}
// deseasonalized % change of a standalone series ([{wk,mo,v}] or [{ym,v}]), keyed by bucket.
function seriesChanges(series) {
  const ch = C.pctChange(series.map((p) => p.v), 1);
  const mos = ch.map((o) => { const r = series[o.idx]; return r.mo != null ? r.mo : parseInt(String(r.ym).slice(5, 7), 10) - 1; });
  const dc = C.deseasonalizeByMonth(ch.map((o) => o.v), mos);
  const map = {}; ch.forEach((o, i) => { map[bucketKey(series[o.idx])] = dc[i]; });
  return map;
}
// Joint per-item weight fit: assemble X from the survivors' lag-shifted change maps
// (survivor predicts target bucket W via xMap[W − lag]) vs the target change, run the
// sign-constrained NNLS. Buckets are integers at BOTH resolutions (week index or month
// ordinal), so the same W−lag join works weekly and monthly.
function fitItemWeights(targetChg, survivors, minRows) {
  minRows = minRows || 30;
  const Ws = Object.keys(targetChg).map(Number).filter((w) => isFinite(w)).sort((a, b) => a - b);
  const X = [], y = [];
  for (const W of Ws) {
    if (targetChg[W] == null) continue;
    const row = []; let ok = true;
    for (const s of survivors) { const v = s.xMap[W - s.lag]; if (v == null) { ok = false; break; } row.push(v); }
    if (ok) { X.push(row); y.push(targetChg[W]); }
  }
  if (X.length < minRows) return null;
  const fit = C.nnlsFit(X, y, survivors.map((s) => s.sign), { sumToOne: false });
  return { indicators: survivors.map((s, i) => ({ id: s.id, lag: s.lag, sign: s.sign, weight: Math.round(fit.weights[i] * 1000) / 1000 })), r2: Math.round(fit.r2 * 1000) / 1000, n: X.length };
}

// per-resolution test parameters.
const RES = {
  weekly:  { bucket: weeklyFromDated,  align: alignWeekly,  maxLag: 16, minN: 60, minAlign: 40, minFit: 30, unit: 'wk' },
  monthly: { bucket: monthlyFromDated, align: alignMonthly, maxLag: 12, minN: 36, minAlign: 24, minFit: 20, unit: 'mo' }
};
async function calibrate(getProxy, getIndicator, getAnchor) {
  const edges = [];
  const proxyCache = {}, anchorCache = {}, indHistCache = {};   // share fetches across items
  const perItem = {}, fits = {};   // per-item joint weight fit
  for (const [item, panel] of Object.entries(rules.items || {})) {
    // Build the published-anchor target at BOTH cadences. Each indicator is then tested
    // at min(anchor cadence, its own cadence): a MONTHLY driver (feed-grain, cold storage)
    // is judged at MONTHLY resolution against the monthly-AGGREGATED published price — not
    // starved on a weekly grid (the bug that buried cheddar↔feed-grain at N=29), and not
    // exiled to the PPI proxy. A WEEKLY driver (diesel, drought) still tests weekly.
    let weeklyTarget = null, monthlyTarget = null, weeklyLabel = null, monthlyLabel = null, anchorWeekly = false;
    const aspec = ANCHOR[item];
    if (getAnchor && aspec) {
      try {
        const akey = `${aspec.report}|${aspec.section}|${aspec.winField || ''}|${aspec.serverFilter && aspec.match ? aspec.match.value : ''}`;   // shared by report (or report+commodity when server-filtered)
        const arows = anchorCache[akey] = anchorCache[akey] || await getAnchor(aspec);
        const apairs = anchorSeries(arows, aspec);
        const wk = weeklyFromDated(apairs);
        if (wk.length >= 60) {
          weeklyTarget = wk; anchorWeekly = true; weeklyLabel = `${aspec.host}:${aspec.report}`;
          const am = monthlyFromDated(apairs);
          if (am.length >= 60) { monthlyTarget = am; monthlyLabel = weeklyLabel; }   // anchor deep enough to also be the monthly target
        }
      } catch (e) { /* fall back to PPI */ }
    }
    // Monthly target depth guard: a monthly edge needs depth (chicken's 3.8y anchor →
    // only ~27 monthly points, under the gate). When the anchor's monthly history is short
    // or absent, test MONTHLY edges against the DEEP BLS PPI index instead — decades-long,
    // the same economic price quantity. Weekly edges still use the published weekly anchor;
    // only the data-hungry monthly edges fall to the deep proxy (the mismatch caveat is in _doc).
    if (!monthlyTarget) {
      const proxyId = PROXY[item];
      if (proxyId) {
        try { monthlyTarget = proxyCache[proxyId] = proxyCache[proxyId] || monthlyFromDated(await getProxy(proxyId)); monthlyLabel = `${proxyId}${anchorWeekly ? ' (deep-proxy: anchor monthly <60mo)' : ''}`; }
        catch (e) { /* maybe weekly-only */ }
      }
    }
    if (!weeklyTarget && !monthlyTarget) { console.log(`  target ${item}: neither anchor nor proxy resolved`); continue; }
    perItem[item] = {
      weeklyChg: weeklyTarget ? seriesChanges(weeklyTarget) : null,
      monthlyChg: monthlyTarget ? seriesChanges(monthlyTarget) : null,
      cands: []
    };
    for (const ind of (panel.indicators || [])) {
      const spec = specs[ind.id] || resolveMoveSpec(ind.id);
      const type = spec ? spec.type : '(emit)';
      const rec = { item, indicator: ind.id, type, ruleSign: ind.sign, ruleWeight: ind.weight, ruleLeadWk: ind.lead ? `${ind.lead.min}-${ind.lead.max}` : null };
      if (!spec || SKIP_TYPES.has(type)) { rec.status = 'skipped'; rec.reason = !spec ? 'no spec' : `type ${type}`; rec.resolution = anchorWeekly ? 'weekly' : 'monthly'; edges.push(rec); continue; }
      let hist;
      try { hist = indHistCache[ind.id] = indHistCache[ind.id] || await getIndicator(spec); } catch (e) { rec.status = 'fetch-failed'; rec.reason = e.message; edges.push(rec); continue; }
      if (hist.skip) { rec.status = 'skipped'; rec.reason = hist.skip; edges.push(rec); continue; }
      // resolution per EDGE = min(anchor cadence, indicator cadence).
      const indWeekly = medianCadence(hist.pairs) === 'weekly';
      const resolution = (anchorWeekly && indWeekly) ? 'weekly' : 'monthly';
      const target = resolution === 'weekly' ? weeklyTarget : monthlyTarget;
      const R = RES[resolution];
      rec.resolution = resolution; rec.indCadence = indWeekly ? 'weekly' : 'monthly';
      rec.target = resolution === 'weekly' ? weeklyLabel : monthlyLabel;
      // weekly OR a long-lead monthly signal can be fairly judged; a short-lead signal on a monthly grid is blind.
      rec.fairness = resolution === 'weekly' ? 'judgeable' : ((ind.lead && ind.lead.max >= 8) ? 'judgeable' : 'short-lead (monthly test blind)');
      if (!target) { rec.status = 'skipped'; rec.reason = 'no target at resolution'; edges.push(rec); continue; }
      const al = R.align(R.bucket(hist.pairs), target);
      if (al.length < R.minAlign) { rec.status = 'insufficient'; rec.n = al.length; edges.push(rec); continue; }
      const ch = keyedChanges(al, spec.transform);
      const ed = C.calibrateEdge(ch.xc, ch.yc, { maxLag: R.maxLag, minN: R.minN });
      Object.assign(rec, ed, { status: ed.ok ? 'tested' : 'untestable', circular: CIRCULAR_SOURCES.has(ind.source), lagUnit: R.unit, transform: spec.transform || 'pct' });
      if (rec.status === 'tested') perItem[item].cands.push({ id: ind.id, rec, lag: ed.lag, sign: ind.sign, xMap: ch.xMap, res: resolution });
      edges.push(rec);
    }
  }
  const tested = edges.filter((e) => e.status === 'tested' && typeof e.p === 'number');
  C.benjaminiHochberg(tested, 0.10);
  tested.forEach((e) => { e.suggestWeight = e.circular ? 0 : C.suggestWeight(e, 3); });
  // Per-item joint NNLS over the survivors (BH+OOS+N), fit at the resolution where the
  // item has the most survivors (lags share a unit only within a resolution).
  for (const [item, pi] of Object.entries(perItem)) {
    const survivors = pi.cands.filter((c) => c.rec.bhPass && c.rec.oosPass && c.rec.enoughN && !c.rec.circular);
    if (!survivors.length) continue;
    const wkS = survivors.filter((c) => c.res === 'weekly'), moS = survivors.filter((c) => c.res === 'monthly');
    const useWeekly = wkS.length >= moS.length;
    const group = useWeekly ? wkS : moS, chg = useWeekly ? pi.weeklyChg : pi.monthlyChg;
    if (!chg || !group.length) continue;
    const f = fitItemWeights(chg, group, RES[useWeekly ? 'weekly' : 'monthly'].minFit);
    if (f) { f.resolution = useWeekly ? 'weekly' : 'monthly'; f.unit = RES[useWeekly ? 'weekly' : 'monthly'].unit; fits[item] = f; }
  }
  return { edges, fits };
}
// movement emits resolve to their ams-move spec (skipped anyway, but report the type)
function resolveMoveSpec(id) {
  for (const s of Object.values(specs)) if (s.type === 'ams-move' && s.emits && Object.values(s.emits).includes(id)) return s;
  return null;
}

function report(result) {
  const edges = result.edges || result, fits = result.fits || {};
  console.log('\nCALIBRATION — empirical lead/sign/strength vs the hand-set rule:\n');
  const tested = edges.filter((e) => e.status === 'tested');
  console.log('  edge'.padEnd(40) + 'res ruleLd  empLag ruleSgn empSgn  N    p      OOS   BH  →wt    flag   (res W=weekly anchor, m=monthly PPI)');
  for (const e of edges) {
    const tag = `${e.item}/${e.indicator}`.padEnd(38);
    if (e.status !== 'tested') { console.log(`  ${tag}  ${e.status}${e.reason ? ' (' + e.reason + ')' : ''}`); continue; }
    const signFlag = (e.ruleSign != null && e.sign != null && e.ruleSign !== e.sign) ? 'SIGN-FLIP!' : '';
    const empWk = e.lagUnit === 'wk' ? `~${e.lag}wk` : `~${Math.round(e.lag * 4.345)}wk`;
    const res = e.resolution === 'weekly' ? 'W' : 'm';
    console.log('  ' + tag + ` ${res} ${String(e.ruleLeadWk || '?').padEnd(7)} ${empWk.padEnd(6)} ${String(e.ruleSign).padEnd(7)} ${String(e.sign).padEnd(7)} ${String(e.n).padEnd(4)} ${e.p.toFixed(3)}  ${e.oosPass ? 'hold' : 'fail'}  ${e.bhPass ? '✓' : '·'}  ${String(e.suggestWeight).padEnd(6)} ${signFlag}`);
  }
  const wk = tested.filter((e) => e.resolution === 'weekly'), mo = tested.filter((e) => e.resolution === 'monthly');
  const judge = tested.filter((e) => e.fairness === 'judgeable');
  const pass = judge.filter((e) => e.bhPass && e.oosPass && e.enoughN);
  const holdRightSign = judge.filter((e) => e.oosPass && e.ruleSign === e.sign);
  console.log(`\n  ${tested.length} edge(s) tested — ${wk.length} against the WEEKLY anchor (the price we publish), ${mo.length} at monthly resolution (anchor-monthly when the anchor is ≥60mo deep, else the deep BLS-PPI index).`);
  console.log(`  ${pass.length} survived BH+OOS+N · ${holdRightSign.length} hold OOS with the rule's sign · ${judge.filter((e) => e.ruleSign !== e.sign).length} sign disagreement(s).`);
  // Suggested weights — the sign-constrained NNLS fit over each item's survivors.
  const items = Object.keys(fits);
  if (items.length) {
    console.log('\n  SUGGESTED WEIGHTS (sign-constrained NNLS over the survivors — review, then apply by hand + _version bump):');
    for (const it of items) {
      const f = fits[it];
      console.log(`    ${it.padEnd(16)} [${f.resolution}] R²=${f.r2} (N=${f.n}): ` + f.indicators.map((i) => `${i.id}=${i.weight}@${i.lag}${f.unit || 'wk'}`).join('  '));
    }
  } else {
    console.log('\n  SUGGESTED WEIGHTS: none — no item had enough weekly survivors to fit (expected until the weekly anchor + signals clear the bar).');
  }
  console.log('  Apply by hand with a _version bump; weekly edges that still flip sign are real evidence now.');
}

// ---- anchor discovery: confirm each weekly target report's fields ----------
async function anchorDiscover() {
  const auth = amsAuth();
  if (!auth) { console.log('anchor-discover needs AMS_KEY.'); process.exit(1); }
  console.log('ANCHOR discovery — does each weekly target resolve to a price series? (writes nothing)\n');
  for (const [item, a] of Object.entries(ANCHOR)) {
    try {
      const rows = await fetchReportWindowed(a, 12);                 // full live depth — so the span we print is the real archive reach
      const ser = anchorSeries(rows, a);                             // apply the configured extraction
      const ok = ser.length >= 4;
      console.log(`  ${ok ? '✓' : '✗'} ${item.padEnd(16)} [${a.host} ${a.report}/${a.section}] rows=${rows.length} → matched ${ser.length} priced weeks — ${a.note}`);
      if (!ok && rows[0]) {
        const r0 = rows[0];
        const nums = Object.keys(r0).filter((k) => r0[k] !== '' && r0[k] != null && isFinite(Number(String(r0[k]).replace(/[$,]/g, ''))) && !/date|year|_id|code|format/i.test(k));
        console.log(`      → field '${a.field}' or match '${a.match ? a.match.field + '=' + a.match.value : '(none)'}' didn't resolve. value-candidates: ${nums.join(', ') || '(none)'}`);
        console.log(`      keys: ${Object.keys(r0).join(', ')}`);
        if (a.match) { const dv = []; rows.forEach((r) => { const c = r[a.match.field]; if (c && dv.indexOf(c) < 0 && dv.length < 40) dv.push(c); }); console.log(`      actual ${a.match.field} values: ${dv.join(' | ') || '(field empty/absent)'}`); }
        // If a secondary (variety) filter is what's killing the match, dump its distinct
        // values among the primary-matched rows so the right one can be pinned.
        if (a.match2) { const dv = []; rows.filter((r) => matchRow(r, a.match)).forEach((r) => { const c = r[a.match2.field]; if (c && dv.indexOf(c) < 0 && dv.length < 40) dv.push(c); }); console.log(`      actual ${a.match2.field} values (within ${a.match.value}): ${dv.join(' | ') || '(field empty/absent)'}`); }
      } else if (ok) {
        // Print the TRUE span so we can see if an anchor is genuinely short (needs an
        // archive/longer report) vs just truncated recent (a data-feed ceiling).
        const wk = weeklyFromDated(ser);
        const dates = ser.map((p) => normDate(p.date)).filter(Boolean).sort();
        const yrs = ((Date.parse(dates[dates.length - 1]) - Date.parse(dates[0])) / (365 * 864e5));
        console.log(`      span: ${dates[0]} → ${dates[dates.length - 1]} (${isFinite(yrs) ? yrs.toFixed(1) : '?'}y, ${wk.length} distinct weeks) · latest=${ser[ser.length - 1].value}`);
      } else {
        // 0 rows. Peel the query back one layer at a time to reveal WHY, so the right
        // report/section/commodity can be pinned next pass without guessing:
        //   1) drop the server-side commodity filter (wrong string eliminates every row)
        //   2) if still empty, drop the section too (wrong section name) — confirms the
        //      report id itself resolves on marsapi and dumps whatever it returns.
        console.log('      (no rows under the configured query)');
        const hint = item.split('-')[0].slice(0, 4).toLowerCase();      // e.g. 'roma','onio','russ','toma'
        try {
          const unfiltered = Object.assign({}, a); delete unfiltered.serverFilter;
          let raw = await fetchReportWindowed(unfiltered, 0.25);          // ~3 months, no commodity filter
          let where = `section '${a.section}'`;
          if (!raw.length) {                                             // section likely wrong → drop it
            const noSect = Object.assign({}, unfiltered); delete noSect.section;
            raw = await fetchReportWindowed(noSect, 0.25);
            where = 'no section';
          }
          if (!raw.length) { console.log(`      report ${a.report} returned nothing even unfiltered/section-less — confirm the report id resolves on marsapi.`); }
          else {
            const dv = [];
            raw.forEach((r) => { const c = r[a.match.field]; if (c && dv.indexOf(c) < 0) dv.push(c); });
            const matches = dv.filter((c) => String(c).toLowerCase().includes(hint));
            console.log(`      unfiltered (${where}): ${raw.length} rows. ${dv.length} distinct ${a.match.field}.`);
            if (matches.length) {
              console.log(`      → '${hint}*' matches: ${matches.join(' | ')}   (commodity has a comma → marsapi exact-filter splits it on ','; need a comma-free handle)`);
              // Dump the comma-free fields (category/group/variety) for the matched rows so a
              // server-filterable handle without a comma can be pinned next pass.
              const mr = raw.filter((r) => String(r[a.match.field] || '').toLowerCase().includes(hint));
              for (const f of ['category', 'group', 'variety']) {
                const vv = []; mr.forEach((r) => { const c = r[f]; if (c && vv.indexOf(c) < 0 && vv.length < 12) vv.push(c); });
                if (vv.length) console.log(`        ${f}: ${vv.join(' | ')}`);
              }
            }
            else console.log(`      → no ${a.match.field} contains '${hint}' here. first 40: ${dv.slice(0, 40).join(' | ')}`);
            if (raw[0]) console.log(`      keys: ${Object.keys(raw[0]).join(', ')}`);
          }
        } catch (e2) { console.log(`      re-probe failed: ${e2.message}`); }
      }
    } catch (e) { console.log(`  ✗ ${item.padEnd(16)} failed: ${e.message}`); }
  }
  console.log('\nGreen rows = the weekly target resolves; I wire those into calibrate. Red rows = paste the keys/candidates and I pin them.');
}

// ---- SSB discovery: find the working v2 query, dump structure + what the picker resolves -
function ssbDumpDims(js) {
  const dim = js.dimension || {}, ids = js.id || Object.keys(dim), sizes = js.size || [];
  console.log(`      dims = ${ids.map((id, i) => `${id}(${sizes[i] != null ? sizes[i] : '?'})`).join(' × ')}, ${(js.value || []).length} values`);
  for (const id of ids) {
    const cat = (dim[id] && dim[id].category) || { index: {} }, codes = Object.keys(cat.index || {});
    const lab = cat.label || {}, unit = cat.unit || {};
    const isTime = codes.length > 30 && codes.some((c) => /^\d{4}([UuVvMm]\d{1,2})?$/.test(c));
    const show = isTime
      ? `${codes[0]} … ${codes[codes.length - 1]} (${codes.length} periods)`
      : codes.map((c) => `${c}=${lab[c] || ''}${unit[c] ? ` [${unit[c].base || unit[c].label || ''}]` : ''}`).join(' | ');
    console.log(`      ${id} [${(dim[id] && dim[id].label) || ''}]: ${show}`);
  }
  for (const measure of ['price', 'volume']) {
    const s = ssbExtract(js, measure);
    console.log(`      → measure '${measure}': ${s.length} points` + (s.length ? `, ${s[0].date} → ${s[s.length - 1].date}, latest=${s[s.length - 1].value}` : ' (0 — adjust the keyword picker)'));
  }
}
async function ssbDiscover() {
  console.log('SSB discovery — Norway PxWebApi v2 (writes nothing). v2 needs ALL mandatory vars selected.\n');
  const t = '03024';
  let vars;
  try { const meta = await uaGet(SSB_META(t)); vars = meta.id || Object.keys(meta.dimension || {}); console.log(`  metadata ✓ — mandatory vars: ${vars.join(', ')}`); ssbDumpDims(meta); }
  catch (e) { console.log(`  ✗ metadata: ${e.message}`); return; }
  const u = ssbAllVarsUrl(t, vars);
  try { const js = await uaGet(u); const n = (js.dimension && js.dimension.Tid && Object.keys(js.dimension.Tid.category.index).length) || 0; console.log(`  ✓ all-vars query → ${n} weeks\n      ${u}`); ssbDumpDims(js); }
  catch (e) { console.log(`  ✗ ${u}\n      ${e.message}`); }
  console.log('\nGreen all-vars query = salmon-norway-price/volume now resolve.');
}

// ---- FOSS discovery: confirm the ORDS trade API shape + the monthly import series ------
async function fossDiscover() {
  console.log('FOSS discovery — NOAA Fisheries ORDS trade API (writes nothing). Endpoint confirmed in NOAA docs; last run it was "Under Maintenance".\n');
  // 1) Is the canonical endpoint serving JSON yet? Show status + a snippet (HTML = still down).
  for (const u of [`${FOSS_BASE}?limit=2`, 'https://www.st.nmfs.noaa.gov/ords/foss/metadata-catalog/trade_data/']) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': SSB_UA, Accept: 'application/json' } });
      const t = (await r.text()).replace(/\s+/g, ' ').slice(0, 160);
      const json = t.trim().startsWith('{');
      console.log(`  ${json ? '✓' : '✗'} ${r.status} ${u}\n      ${json ? 'JSON: ' : 'HTML/down: '}${t}`);
    } catch (e) { console.log(`  ✗ ${u} — ${e.message}`); }
  }
  // 2) If a host works, show the resolved monthly series + a sample row's field names.
  for (const p of [{ id: 'salmon', hts: ['030214', '030313', '030441', '030481'], source: 'IMP' }, { id: 'shrimp', hts: ['030617', '160521', '160529'], source: 'IMP' }]) {
    try { const ser = await fetchFOSS(p); console.log(`  → ${p.id}: ${ser.length} months${ser.length ? `, ${ser[0].date} → ${ser[ser.length - 1].date}, latest kilos=${Math.round(ser[ser.length - 1].value)}` : ''}`); }
    catch (e) { console.log(`  → ${p.id}: ${e.message}`); }
  }
  console.log('\nThe ✓ JSON host + the sample fields tell me the base URL + field names to pin.');
}

// ---- EU agri-food discovery: find the working host + confirm butter/cheddar series -------
async function euDiscover() {
  console.log('EU agri-food discovery — dairy prices host + product codes (writes nothing)\n');
  for (const base of EU_BASES) {
    const u = `${base}/dairy/prices?products=butter&memberStateCodes=EU`;
    try {
      const r = await fetch(u, { headers: { 'User-Agent': SSB_UA, Accept: 'application/json' } });
      const txt = await r.text(); const json = txt.trim().startsWith('[') || txt.trim().startsWith('{');
      console.log(`  ${json ? '✓' : '✗'} ${r.status} ${u}`);
      if (json) {
        const j = JSON.parse(txt); const rows = Array.isArray(j) ? j : (j.results || j.data || j.items || []);
        console.log(`      rows=${rows.length}${rows[0] ? ` · keys: ${Object.keys(rows[0]).join(', ')}` : ''}`);
        const s = parseEUDairy(rows); if (s.length) console.log(`      → ${s.length} weeks, ${s[0].date} → ${s[s.length - 1].date}, latest=${s[s.length - 1].value}`);
        break;
      } else console.log(`      ${txt.replace(/\s+/g, ' ').slice(0, 120)}`);
    } catch (e) { console.log(`  ✗ ${u} — ${e.message}`); }
  }
  for (const [prod, ms] of [['butter', 'EU'], ['cheddar', 'IE'], ['cheddar', 'EU']]) {
    try { const s = await fetchEUAgri({ product: prod, member: ms }); console.log(`  → ${prod}/${ms}: ${s.length} weeks${s.length ? `, latest ${s[s.length - 1].date}=${s[s.length - 1].value}` : ''}`); }
    catch (e) { console.log(`  → ${prod}/${ms}: ${e.message}`); }
  }
  console.log('\nThe ✓ host + the product/member that returns weeks tell me what to pin for butter/cheddar.');
}

// ---- selftest: synthetic dated series, no network ------------------
function selftest() {
  // Build a proxy (random-ish monthly walk) and an indicator that leads it by 3
  // months, plus a noise indicator — confirm the pipeline assembles + classifies.
  function mul(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rnd = mul(7), randn = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const months = []; let y = 2016, m = 1;
  for (let i = 0; i < 120; i++) { months.push(`${y}-${('0' + m).slice(-2)}`); if (++m > 12) { m = 1; y++; } }
  const proxyLvl = [100]; for (let i = 1; i < 120; i++) proxyLvl.push(Math.max(20, proxyLvl[i - 1] * (1 + 0.02 * randn())));
  const proxyPairs = months.map((mm, i) => ({ date: mm + '-15', value: proxyLvl[i] }));
  const pc = C.pctChange(proxyLvl, 1).map((o) => o.v);
  const leadLvl = [100]; for (let i = 1; i < 120; i++) { const f = i + 3 < pc.length ? pc[i + 3] : 0; leadLvl.push(Math.max(20, leadLvl[i - 1] * (1 + f + 0.01 * randn()))); }
  const getProxy = async () => proxyPairs;
  const getInd = async (spec) => {
    if (spec.series === 'LEAD') return { pairs: months.map((mm, i) => ({ date: mm + '-15', value: leadLvl[i] })) };
    return { pairs: months.map((mm) => ({ date: mm + '-15', value: 100 + 5 * randn() })) };  // noise
  };
  // Inject two fake edges via a tiny synthetic rules/specs override.
  const realRules = JSON.parse(JSON.stringify(rules.items));
  rules.items = { ribeye: { indicators: [{ id: '_lead', source: 'x', sign: 1, weight: 1, lead: { min: 8, max: 12 } }, { id: '_noise', source: 'x', sign: 1, weight: 1, lead: { min: 0, max: 4 } }] } };
  specs._lead = { type: 'fred', series: 'LEAD' }; specs._noise = { type: 'fred', series: 'NOISE' };
  const getAnchor = async () => [];   // no anchor in selftest → exercises the monthly fallback path
  return calibrate(getProxy, getInd, getAnchor).then((result) => {
    rules.items = realRules;
    const edges = result.edges;
    const lead = edges.find((e) => e.indicator === '_lead'), noise = edges.find((e) => e.indicator === '_noise');
    let fail = 0; const ok = (c, m) => { console.log(`  ${c ? '✓' : '✗ FAIL'} ${m}`); if (!c) fail++; };
    console.log('calibrate-pressure selftest (synthetic, no network):');
    ok(lead && lead.status === 'tested' && Math.abs(lead.lag - 3) <= 1, `recovers the 3-month lead (got ${lead && lead.lag})`);
    ok(lead && lead.sign === 1 && lead.oosPass, 'lead: correct sign, holds OOS');
    ok(lead && lead.suggestWeight > 0, `lead earns a weight (${lead && lead.suggestWeight})`);
    ok(noise && (!noise.bhPass || !noise.oosPass) && noise.suggestWeight === 0, 'noise earns weight 0');
    // weekly machinery (the target-rebuild plumbing)
    const wkly = weeklyFromDated([{ date: '2026-01-05', value: 10 }, { date: '2026-01-07', value: 12 }, { date: '2026-01-12', value: 20 }]);
    ok(wkly.length === 2 && Math.abs(wkly[0].v - 11) < 1e-9, `weeklyFromDated buckets+averages by ISO week (got ${wkly.length} weeks)`);
    const al = alignWeekly([{ wk: 1, mo: 0, v: 5 }, { wk: 2, mo: 0, v: 6 }], [{ wk: 2, v: 7 }, { wk: 3, v: 8 }]);
    ok(al.length === 1 && al[0].x === 6 && al[0].y === 7, 'alignWeekly inner-joins two weekly series');
    // anchorSeries: filter to the cut + read the configured price/date columns
    const aser = anchorSeries(
      [{ commodity: 'Ribeye', Weighted_Average: '8.50', report_date: '2026-06-01' }, { commodity: 'Chuck', Weighted_Average: '4.00', report_date: '2026-06-01' }, { commodity: 'Ribeye', Weighted_Average: '', report_date: '2026-06-08' }],
      { match: { field: 'commodity', value: 'Ribeye' }, field: 'Weighted_Average', dateField: 'report_date' });
    ok(aser.length === 1 && aser[0].value === '8.50' && aser[0].date === '2026-06-01', `anchorSeries filters cut + reads price/date (got ${aser.length} priced rows)`);
    // SSB JSON-stat2 flatten: a 2-measure × 3-week dataset must pick the right measure and
    // map ISO-week codes to that week's Monday. value array is row-major over [ContentsCode, Tid].
    ok(isoWeekToDate(2024, 15) === '2024-04-08', `isoWeekToDate(2024,W15) = Monday 2024-04-08 (got ${isoWeekToDate(2024, 15)})`);
    {
      const js = {
        id: ['ContentsCode', 'Tid'], size: [2, 3],
        dimension: {
          ContentsCode: { label: 'contents', category: { index: { Pris: 0, Mengde: 1 }, label: { Pris: 'Price', Mengde: 'Weight' }, unit: { Pris: { base: 'NOK per kg' }, Mengde: { base: 'tonnes' } } } },
          Tid: { label: 'week', category: { index: { '2024U14': 0, '2024U15': 1, '2024U16': 2 } } }
        },
        value: [80, 81, 82, /* price rows */ 500, 510, 520 /* volume rows */]
      };
      const pr = ssbExtract(js, 'price'), vol = ssbExtract(js, 'volume');
      ok(pr.length === 3 && pr[1].value === 81 && pr[1].date === '2024-04-08', `ssbExtract picks PRICE by keyword + ISO-week date (got ${pr.length}, ${pr[1] && pr[1].value}@${pr[1] && pr[1].date})`);
      ok(vol.length === 3 && vol[1].value === 510, `ssbExtract picks VOLUME measure (got ${vol[1] && vol[1].value})`);
    }
    // FOSS aggregate: sum kilos across countries/HTS per year-month → monthly supply series.
    {
      const items = [
        { year: 2024, month: 1, kilos: '100', val: '900', cntry_name: 'Chile' },
        { year: 2024, month: 1, kilos: '50', val: '450', cntry_name: 'Norway' },
        { year: 2024, month: 2, kilos: '200', val: '1800', cntry_name: 'Chile' },
        { year: 'x', month: 1, kilos: '999' }   // junk row dropped
      ];
      const k = fossAggregate(items, 'kilos'), d = fossAggregate(items, 'val');
      ok(k.length === 2 && k[0].value === 150 && k[0].date === '2024-01-15', `fossAggregate sums kilos per month across countries (got ${k.length}, ${k[0] && k[0].value})`);
      ok(d.length === 2 && d[0].value === 1350, `fossAggregate can sum the $ measure too (got ${d[0] && d[0].value})`);
    }
    // ONI parse: 'SEAS YR TOTAL ANOM' → center-month date + anomaly (crosses zero).
    {
      const oni = parseONI('DJF 1999 25.0 -1.50\nNDJ 2015 27.2 2.31\nbad row\nNDJ 2015 27.2 2.31');
      ok(oni.length === 3 && oni[0].date === '1999-01-15' && oni[0].value === -1.5, `parseONI maps SEAS→center month + signed anomaly (got ${oni.length}, ${oni[0] && oni[0].date}=${oni[0] && oni[0].value})`);
      ok(oni[2].date === '2015-12-15' && oni[2].value === 2.31, `parseONI handles positive El Niño anomaly (got ${oni[2] && oni[2].value})`);
    }
    // EU dairy parse: DD/MM/YYYY → YYYY-MM-DD, and comma-decimal European prices.
    {
      const eu = parseEUDairy([{ beginDate: '07/01/2024', price: '4 500,50' }, { beginDate: '14/01/2024', price: '€4600.00' }, { beginDate: 'bad', price: 'x' }]);
      ok(eu.length === 2 && eu[0].date === '2024-01-07' && Math.abs(eu[0].value - 4500.5) < 1e-6, `parseEUDairy reorders date + parses comma-decimal (got ${eu.length}, ${eu[0] && eu[0].date}=${eu[0] && eu[0].value})`);
      ok(eu[1].value === 4600, `parseEUDairy parses dot-decimal + strips currency (got ${eu[1] && eu[1].value})`);
    }
    // Open-Meteo zip: daily.time[] + daily[var][] → [{date,value}], junk dropped.
    {
      const z = zipDaily({ daily: { time: ['2024-01-01', '2024-01-02', 'bad'], soil_moisture_0_to_7cm: [0.31, 0.28, 9] } }, 'soil_moisture_0_to_7cm');
      ok(z.length === 2 && z[1].date === '2024-01-02' && z[1].value === 0.28, `zipDaily pairs time+variable, drops bad dates (got ${z.length}, ${z[1] && z[1].value})`);
    }
    // keyedChanges transforms: 'level' must use the raw (zero-crossing-safe) x, not pct change.
    {
      const al = [{ x: -1, y: 100, ym: '2020-01' }, { x: 0, y: 102, ym: '2020-02' }, { x: 1, y: 101, ym: '2020-03' }, { x: 2, y: 105, ym: '2020-04' }];
      const lev = keyedChanges(al, 'level'), pct = keyedChanges(al, 'pct');
      ok(lev.xc.length === 3 && lev.xc.some((v) => v === 0 || Math.abs(v) <= 2), `keyedChanges 'level' keeps raw zero-crossing x (n=${lev.xc.length})`);
      ok(pct.xc.length < lev.xc.length, `keyedChanges 'pct' drops the zero base that 'level' keeps (pct n=${pct.xc.length} < level n=${lev.xc.length})`);
    }
    // fitItemWeights: a survivor that leads the target by lag L with a known sign must
    // earn a positive-magnitude weight; a useless survivor must be pinned to ~0. Build a
    // weekly target change map + two survivor change maps keyed by integer week.
    {
      const rnd2 = mul(99), rn = () => { let u = 0, v = 0; while (!u) u = rnd2(); while (!v) v = rnd2(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const target = {}, good = {}, junk = {}, L = 3;
      for (let w = 1000; w < 1240; w++) { target[w] = 0.02 * rn(); junk[w] = rn(); }       // target noise + a pure-noise survivor
      for (let w = 1000; w < 1240; w++) { good[w - L] = target[w] + 0.3 * 0.02 * rn(); }    // good LEADS target by L weeks
      const fit = fitItemWeights(target, [
        { id: 'good', lag: L, sign: 1, xMap: good },
        { id: 'junk', lag: 0, sign: 1, xMap: junk }
      ], 30);
      ok(fit && fit.n >= 30, `fitItemWeights assembles enough lag-shifted rows (n=${fit && fit.n})`);
      const gw = fit && fit.indicators.find((i) => i.id === 'good'), jw = fit && fit.indicators.find((i) => i.id === 'junk');
      ok(gw && gw.weight > 0.3, `fitItemWeights gives the true leader a real weight (got ${gw && gw.weight})`);
      ok(jw && Math.abs(jw.weight) < 0.2, `fitItemWeights pins the useless survivor near 0 (got ${jw && jw.weight})`);
    }
    // monthOrd keying: a MONTHLY survivor (month-ordinal keys) must join + fit the same
    // way — this is the per-edge-resolution unlock for feed-grain / cold storage.
    ok(monthOrd('2024-01') + 12 === monthOrd('2025-01') && monthOrd('2024-03') - monthOrd('2024-01') === 2, 'monthOrd is a contiguous integer month index');
    {
      const rnd3 = mul(123), rn = () => { let u = 0, v = 0; while (!u) u = rnd3(); while (!v) v = rnd3(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const tgt = {}, drv = {}, base = monthOrd('2016-01'), L = 2;
      for (let i = 0; i < 90; i++) tgt[base + i] = 0.02 * rn();
      for (let i = 0; i < 90; i++) drv[base + i - L] = tgt[base + i] + 0.3 * 0.02 * rn();   // leads target by L MONTHS, positive sign
      const mf = fitItemWeights(tgt, [{ id: 'drvm', lag: L, sign: 1, xMap: drv }], 20);
      ok(mf && mf.n >= 20 && Math.abs(mf.indicators[0].weight) > 0.3, `fitItemWeights joins monthly ordinals + fits (n=${mf && mf.n}, w=${mf && mf.indicators[0].weight})`);
    }
    console.log(fail ? `\ncalibrate-pressure: ${fail} FAIL` : '\ncalibrate-pressure: OK — pipeline recovers truth, rejects noise.');
    process.exit(fail ? 1 : 0);
  });
}

if (arg('--selftest')) { selftest(); }
else if (arg('--anchor-discover')) { anchorDiscover(); }
else if (arg('--ssb-discover')) { ssbDiscover(); }
else if (arg('--foss-discover')) { fossDiscover(); }
else if (arg('--eu-discover')) { euDiscover(); }
else {
  const getAnchor = (spec) => fetchReportWindowed(spec, 12);  // ~12 years — pull the full report archive (2x the N-gate minimum) so the starved monthly meat/dairy edges clear; windows before a report existed return empty and drop out. Concurrent + server-filtered + cached keeps it inside the timeout.
  calibrate(fetchProxy, fetchIndicatorHistory, getAnchor).then((result) => {
    report(result);
    const { edges, fits } = result;
    const out = { _doc: 'GENERATED by scripts/calibrate-pressure.mjs — empirical lead/sign/strength per indicator→ingredient edge vs the hand-set rule. TARGET: each ingredient is backtested against the wholesale anchor it actually publishes (LMR cutout / AMS terminal / NDPSR dairy, via the same source specs as data/cost-index-sources.json). RESOLUTION is matched PER EDGE = min(anchor cadence, indicator cadence): a weekly driver (diesel, drought) tests against the weekly anchor; a monthly driver (feed-grain, cold storage) tests against the same anchor AGGREGATED to monthly — so monthly inputs are no longer starved on a weekly grid. MONTHLY-target depth guard: when the anchor monthly history is <60mo (e.g. chicken 3646 starts 2022) or absent, monthly edges test against the DEEP decades-long BLS-PPI index instead (same economic price, far more N); weekly edges still use the published weekly anchor. Informs human weight edits; NEVER auto-applied. No price. CAVEATS: anchor edges that still flip sign are real evidence (no resolution excuse); monthly-PPI-fallback edges keep the proxy mismatch caveat. Surviving edges are hypotheses to NNLS-fit + benchmark vs equal-weight OOS, then apply by hand with a _version bump. fits = the sign-constrained NNLS joint weight fit per item over its surviving edges, fit at the resolution where the item has the most survivors (suggestions only).', generatedAt: new Date().toISOString().slice(0, 10), edges, fits };
    writeFileSync(path.join(repoRoot, 'data/pressure-calibration.json'), JSON.stringify(out, null, 2) + '\n');
    console.log('\nWrote data/pressure-calibration.json');
  }).catch((e) => { console.error('calibrate failed:', e.message); process.exit(1); });
}
