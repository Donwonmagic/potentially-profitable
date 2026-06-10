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
  'romaine-lettuce': 'WPU0113', 'tomato': 'WPU0113', 'onion': 'WPU0113', 'russet-potato': 'WPU0113'
};
// Indicator source families that are themselves a PRICE in the proxy's pipeline →
// near-circular; calibrate for information but never suggest a weight.
const CIRCULAR_SOURCES = new Set([]);  // none today; e.g. add 'lmr-cutout' if introduced
// Indicator types we don't calibrate this pass (deterministic / event / windowed).
const SKIP_TYPES = new Set(['season', 'nws', 'ams-move']);

// ---- monthly series helpers ----------------------------------------
const ym = (d) => String(d || '').slice(0, 7);           // 'YYYY-MM-DD' → 'YYYY-MM'
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
function weekKey(dateStr) {                                // 'YYYY-MM-DD' → integer week bucket (sortable) + its month
  const m = String(dateStr || '').match(/(\d{4})-(\d{2})-(\d{2})/);
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
  'beef-tenderloin': { host: 'lmr', report: '2453', section: 'Choice Cuts', match: { field: 'item_description', value: 'Tenderloin' }, field: 'weighted_average', dateField: 'report_date', winField: 'report_date', note: 'LMR 2453 / Tenderloin' },
  'pork-loin':       { host: 'lmr', report: '2498', section: 'Cutout and Primal Values', field: 'pork_loin', dateField: 'report_date', winField: 'report_date', note: 'LMR 2498 cutout / pork_loin' },
  'pork-shoulder':   { host: 'lmr', report: '2498', section: 'Cutout and Primal Values', field: 'pork_butt', dateField: 'report_date', winField: 'report_date', note: 'LMR 2498 cutout / pork_butt' },
  'chicken-breast':  { host: 'mars', report: '3646', section: 'Report Detail', match: { field: 'item', value: 'Breast - B/S' }, field: 'wtd_avg_price', dateField: 'report_date', note: 'AMS 3646 Nat. Chicken / Breast B/S' },
  'whole-chicken':   { host: 'mars', report: '3646', section: 'Report Detail', match: { field: 'item', value: 'Whole' }, field: 'wtd_avg_price', dateField: 'report_date', note: 'AMS 3646 / Whole' },
  'butter':          { host: 'lmr', report: '2993', section: 'Butter Prices and Sales', field: 'Butter_Price', dateField: 'week_ending_date', winField: 'week_ending_date', note: 'NDPSR 2993 butter' },
  'cheddar-cheese':  { host: 'lmr', report: '2993', section: '40 Pound Block Cheddar Cheese Prices and Sales', field: 'cheese_40_Price', dateField: 'week_ending_date', winField: 'week_ending_date', note: 'NDPSR 2993 block cheddar' },
  'romaine-lettuce': { host: 'mars', report: 'hc_fv020', section: 'Report Details', match: { field: 'commodity', value: 'Lettuce, Romaine', exact: true }, serverFilter: true, field: 'low_price', dateField: 'report_begin_date', note: 'LA terminal / Romaine' },
  'tomato':          { host: 'mars', report: 'hc_fv020', section: 'Report Details', match: { field: 'commodity', value: 'Tomatoes', exact: true }, serverFilter: true, field: 'low_price', dateField: 'report_begin_date', note: 'LA terminal / Tomatoes' },
  'onion':           { host: 'mars', report: 'hc_fv020', section: 'Report Details', match: { field: 'commodity', value: 'Onions' }, serverFilter: true, field: 'low_price', dateField: 'report_begin_date', note: 'LA terminal / Onions' },
  'russet-potato':   { host: 'mars', report: 'hc_fv020', section: 'Report Details', match: { field: 'commodity', value: 'Potatoes' }, serverFilter: true, field: 'low_price', dateField: 'report_begin_date', note: 'LA terminal / Potatoes (may be absent → monthly fallback)' }
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
  const out = []; const now = Date.now(); const step = 150 * 864e5;
  for (let end = now; end > now - years * 365 * 864e5; end -= step) {
    const e = new Date(end), s = new Date(end - step);
    // Server-side commodity filter (MARS supports `;`-AND) so a huge terminal report
    // returns only the one commodity's rows — the difference between a 60k-row and a
    // ~200-row response, which is what was timing the run out.
    let qstr = `${winField}=${fmt(s)}:${fmt(e)}`;
    if (spec.serverFilter && spec.match) qstr += `;${spec.match.field}=${spec.match.value}`;
    const q = `?q=${encodeURIComponent(qstr)}`;
    try {
      const j = await getJson(`${base}${encodeURIComponent(spec.report)}${sect}${q}`, auth ? { headers: { Authorization: auth } } : {});
      (j && j.results || []).forEach((r) => out.push(r));
    } catch (e2) { /* skip this window */ }
  }
  return out;
}
// rows → [{date, value}] for one anchor: filter to the cut/commodity, read the price
// column + the report's date column. Scale-free (calibration uses % changes).
function anchorSeries(rows, spec) {
  const m = spec.match;
  return (rows || []).filter((r) => {
    if (!m) return true;
    const cv = String(r[m.field] || '');
    return m.exact ? cv === m.value : cv.toUpperCase().indexOf(String(m.value).toUpperCase()) >= 0;
  }).map((r) => ({ date: r[spec.dateField], value: r[spec.field] }))
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
async function fetchIndicatorHistory(spec) {
  if (spec.type === 'fred') {
    const k = process.env.FRED_KEY; if (!k) return { skip: 'no FRED_KEY' };
    const j = await getJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(spec.series)}&api_key=${k}&file_type=json&observation_start=2015-01-01`);
    return { pairs: (j.observations || []).map((o) => ({ date: o.date, value: o.value })) };
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
// stationary deseasonalized changes of an aligned [{x,y,mo|ym}] series, robust to
// pctChange dropping a non-positive base (inner-join the x/y changes on their index).
function alignedChanges(al) {
  const xCh = C.pctChange(al.map((p) => p.x), 1), yCh = C.pctChange(al.map((p) => p.y), 1);
  const ym = {}; yCh.forEach((o) => { ym[o.idx] = o.v; });
  const xs = [], ys = [], mos = [];
  xCh.forEach((o) => { if (o.idx in ym) { xs.push(o.v); ys.push(ym[o.idx]); const r = al[o.idx]; mos.push(r.mo != null ? r.mo : parseInt(String(r.ym).slice(5, 7), 10) - 1); } });
  return { xc: C.deseasonalizeByMonth(xs, mos), yc: C.deseasonalizeByMonth(ys, mos), n: xs.length };
}

async function calibrate(getProxy, getIndicator, getAnchor) {
  const edges = [];
  const proxyCache = {}, anchorCache = {}, indHistCache = {};   // share fetches across items
  for (const [item, panel] of Object.entries(rules.items || {})) {
    // Prefer the WEEKLY anchor (the price we publish); fall back to monthly PPI.
    let resolution = 'monthly', target = null, targetLabel = null;
    const aspec = ANCHOR[item];
    if (getAnchor && aspec) {
      try {
        const akey = `${aspec.report}|${aspec.section}|${aspec.winField || ''}|${aspec.serverFilter && aspec.match ? aspec.match.value : ''}`;   // shared by report (or report+commodity when server-filtered)
        const arows = anchorCache[akey] = anchorCache[akey] || await getAnchor(aspec);
        const wk = weeklyFromDated(anchorSeries(arows, aspec));
        if (wk.length >= 60) { resolution = 'weekly'; target = wk; targetLabel = `${aspec.host}:${aspec.report}`; }
      } catch (e) { /* fall back to PPI */ }
    }
    if (!target) {
      const proxyId = PROXY[item]; if (!proxyId) continue;
      try { target = proxyCache[proxyId] = proxyCache[proxyId] || monthlyFromDated(await getProxy(proxyId)); targetLabel = proxyId; }
      catch (e) { console.log(`  target ${item} failed: ${e.message}`); continue; }
    }
    const bucket = resolution === 'weekly' ? weeklyFromDated : monthlyFromDated;
    const align = resolution === 'weekly' ? alignWeekly : alignMonthly;
    const maxLag = resolution === 'weekly' ? 16 : 12;     // 16 weeks vs 12 months
    const minN = resolution === 'weekly' ? 60 : 36, minAlign = resolution === 'weekly' ? 40 : 24;
    for (const ind of (panel.indicators || [])) {
      const spec = specs[ind.id] || resolveMoveSpec(ind.id);
      const type = spec ? spec.type : '(emit)';
      const rec = { item, indicator: ind.id, type, resolution, target: targetLabel, ruleSign: ind.sign, ruleWeight: ind.weight, ruleLeadWk: ind.lead ? `${ind.lead.min}-${ind.lead.max}` : null };
      // WEEKLY resolution can fairly judge short-lead signals; monthly cannot.
      rec.fairness = resolution === 'weekly' ? 'judgeable' : ((ind.lead && ind.lead.max >= 8) ? 'judgeable' : 'short-lead (monthly test blind)');
      if (!spec || SKIP_TYPES.has(type)) { rec.status = 'skipped'; rec.reason = !spec ? 'no spec' : `type ${type}`; edges.push(rec); continue; }
      let hist;
      try { hist = indHistCache[ind.id] = indHistCache[ind.id] || await getIndicator(spec); } catch (e) { rec.status = 'fetch-failed'; rec.reason = e.message; edges.push(rec); continue; }
      if (hist.skip) { rec.status = 'skipped'; rec.reason = hist.skip; edges.push(rec); continue; }
      const al = align(bucket(hist.pairs), target);
      if (al.length < minAlign) { rec.status = 'insufficient'; rec.n = al.length; edges.push(rec); continue; }
      const ch = alignedChanges(al);
      const ed = C.calibrateEdge(ch.xc, ch.yc, { maxLag, minN });
      Object.assign(rec, ed, { status: ed.ok ? 'tested' : 'untestable', circular: CIRCULAR_SOURCES.has(ind.source), lagUnit: resolution === 'weekly' ? 'wk' : 'mo' });
      edges.push(rec);
    }
  }
  const tested = edges.filter((e) => e.status === 'tested' && typeof e.p === 'number');
  C.benjaminiHochberg(tested, 0.10);
  tested.forEach((e) => { e.suggestWeight = e.circular ? 0 : C.suggestWeight(e, 3); });
  return edges;
}
// movement emits resolve to their ams-move spec (skipped anyway, but report the type)
function resolveMoveSpec(id) {
  for (const s of Object.values(specs)) if (s.type === 'ams-move' && s.emits && Object.values(s.emits).includes(id)) return s;
  return null;
}

function report(edges) {
  console.log('\nCALIBRATION — empirical lead/sign/strength vs the hand-set rule (BLS PPI proxy):\n');
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
  console.log(`\n  ${tested.length} edge(s) tested — ${wk.length} against the WEEKLY anchor (the price we publish), ${mo.length} on the monthly PPI fallback.`);
  console.log(`  ${pass.length} survived BH+OOS+N · ${holdRightSign.length} hold OOS with the rule's sign · ${judge.filter((e) => e.ruleSign !== e.sign).length} sign disagreement(s).`);
  console.log('  NEXT: NNLS-fit the surviving edges per item (the weights), benchmark vs equal-weight OOS, apply by hand with a _version bump. Weekly edges that still flip sign are now real evidence (the resolution excuse is gone); monthly-fallback edges keep the proxy caveat.');
}

// ---- anchor discovery: confirm each weekly target report's fields ----------
async function anchorDiscover() {
  const auth = amsAuth();
  if (!auth) { console.log('anchor-discover needs AMS_KEY.'); process.exit(1); }
  console.log('ANCHOR discovery — does each weekly target resolve to a price series? (writes nothing)\n');
  for (const [item, a] of Object.entries(ANCHOR)) {
    try {
      const rows = await fetchReportWindowed(a, 0.5);                 // ~6 months
      const ser = anchorSeries(rows, a);                             // apply the configured extraction
      const ok = ser.length >= 4;
      console.log(`  ${ok ? '✓' : '✗'} ${item.padEnd(16)} [${a.host} ${a.report}/${a.section}] rows=${rows.length} → matched ${ser.length} priced weeks — ${a.note}`);
      if (!ok && rows[0]) {
        const r0 = rows[0];
        const nums = Object.keys(r0).filter((k) => r0[k] !== '' && r0[k] != null && isFinite(Number(String(r0[k]).replace(/[$,]/g, ''))) && !/date|year|_id|code|format/i.test(k));
        console.log(`      → field '${a.field}' or match '${a.match ? a.match.field + '=' + a.match.value : '(none)'}' didn't resolve. value-candidates: ${nums.join(', ') || '(none)'}`);
        console.log(`      keys: ${Object.keys(r0).join(', ')}`);
        if (a.match) { const dv = []; rows.forEach((r) => { const c = r[a.match.field]; if (c && dv.indexOf(c) < 0 && dv.length < 40) dv.push(c); }); console.log(`      actual ${a.match.field} values: ${dv.join(' | ') || '(field empty/absent)'}`); }
      } else if (ok) {
        console.log(`      latest: ${ser[ser.length - 1].date} = ${ser[ser.length - 1].value}`);
      } else console.log('      (no rows — confirm slug/section/host)');
    } catch (e) { console.log(`  ✗ ${item.padEnd(16)} failed: ${e.message}`); }
  }
  console.log('\nGreen rows = the weekly target resolves; I wire those into calibrate. Red rows = paste the keys/candidates and I pin them.');
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
  return calibrate(getProxy, getInd, getAnchor).then((edges) => {
    rules.items = realRules;
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
    console.log(fail ? `\ncalibrate-pressure: ${fail} FAIL` : '\ncalibrate-pressure: OK — pipeline recovers truth, rejects noise.');
    process.exit(fail ? 1 : 0);
  });
}

if (arg('--selftest')) { selftest(); }
else if (arg('--anchor-discover')) { anchorDiscover(); }
else {
  const getAnchor = (spec) => fetchReportWindowed(spec, 4);   // ~4 years of weekly anchor history (server-filtered + cached)
  calibrate(fetchProxy, fetchIndicatorHistory, getAnchor).then((edges) => {
    report(edges);
    const out = { _doc: 'GENERATED by scripts/calibrate-pressure.mjs — empirical lead/sign/strength per indicator→ingredient edge vs the hand-set rule. TARGET: each ingredient is backtested against the WEEKLY wholesale anchor it actually publishes (LMR cutout / AMS terminal / NDPSR dairy, via the same source specs as data/cost-index-sources.json) at WEEKLY resolution; items whose weekly anchor does not resolve fall back to the monthly BLS-PPI proxy (resolution:monthly). Informs human weight edits; NEVER auto-applied. No price. CAVEATS: weekly-anchor edges that still flip sign are real evidence (no resolution excuse); monthly-fallback edges keep the proxy mismatch caveat. Surviving edges are hypotheses to NNLS-fit + benchmark vs equal-weight OOS, then apply by hand with a _version bump.', generatedAt: new Date().toISOString().slice(0, 10), edges };
    writeFileSync(path.join(repoRoot, 'data/pressure-calibration.json'), JSON.stringify(out, null, 2) + '\n');
    console.log('\nWrote data/pressure-calibration.json');
  }).catch((e) => { console.error('calibrate failed:', e.message); process.exit(1); });
}
