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
async function calibrate(getProxy, getIndicator) {
  const edges = [];
  const proxyCache = {};
  for (const [item, panel] of Object.entries(rules.items || {})) {
    const proxyId = PROXY[item]; if (!proxyId) continue;
    let proxy;
    try { proxy = proxyCache[proxyId] = proxyCache[proxyId] || monthlyFromDated(await getProxy(proxyId)); }
    catch (e) { console.log(`  proxy ${item} (${proxyId}) failed: ${e.message}`); continue; }
    for (const ind of (panel.indicators || [])) {
      const spec = specs[ind.id] || resolveMoveSpec(ind.id);
      const type = spec ? spec.type : '(emit)';
      const rec = { item, indicator: ind.id, type, ruleSign: ind.sign, ruleWeight: ind.weight, ruleLeadWk: ind.lead ? `${ind.lead.min}-${ind.lead.max}` : null, proxy: proxyId };
      if (!spec || SKIP_TYPES.has(type) || !PROXY[item]) { rec.status = 'skipped'; rec.reason = !spec ? 'no spec' : `type ${type}`; edges.push(rec); continue; }
      let hist;
      try { hist = await getIndicator(spec); } catch (e) { rec.status = 'fetch-failed'; rec.reason = e.message; edges.push(rec); continue; }
      if (hist.skip) { rec.status = 'skipped'; rec.reason = hist.skip; edges.push(rec); continue; }
      const indM = monthlyFromDated(hist.pairs);
      const al = alignMonthly(indM, proxy);
      if (al.length < 24) { rec.status = 'insufficient'; rec.n = al.length; edges.push(rec); continue; }
      // stationary monthly changes, deseasonalized
      const xRaw = C.pctChange(al.map((p) => p.x), 1), yRaw = C.pctChange(al.map((p) => p.y), 1);
      const idxMonths = monthNums(al).slice(1);
      const xc = C.deseasonalizeByMonth(xRaw.map((o) => o.v), idxMonths);
      const yc = C.deseasonalizeByMonth(yRaw.map((o) => o.v), idxMonths);
      const ed = C.calibrateEdge(xc, yc, { maxLag: 12, minN: 36 });
      Object.assign(rec, ed, { status: ed.ok ? 'tested' : 'untestable', circular: CIRCULAR_SOURCES.has(ind.source) });
      edges.push(rec);
    }
  }
  // FDR across all tested edges
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
  console.log('  edge'.padEnd(40) + 'ruleLead  empLag  ruleSign empSign  N    p      OOS   BH  →weight  flag');
  for (const e of edges) {
    const tag = `${e.item}/${e.indicator}`.padEnd(38);
    if (e.status !== 'tested') { console.log(`  ${tag}  ${e.status}${e.reason ? ' (' + e.reason + ')' : ''}`); continue; }
    const signFlag = (e.ruleSign != null && e.sign != null && e.ruleSign !== e.sign) ? 'SIGN-FLIP!' : '';
    const empWk = `~${Math.round(e.lag * 4.345)}wk`;
    console.log('  ' + tag + `  ${String(e.ruleLeadWk || '?').padEnd(8)}  ${empWk.padEnd(6)}  ${String(e.ruleSign).padEnd(8)} ${String(e.sign).padEnd(7)} ${String(e.n).padEnd(4)} ${e.p.toFixed(3)}  ${e.oosPass ? 'hold' : 'fail'}  ${e.bhPass ? '✓' : '·'}  ${String(e.suggestWeight).padEnd(7)} ${signFlag}`);
  }
  const pass = tested.filter((e) => e.bhPass && e.oosPass && e.enoughN);
  console.log(`\n  ${tested.length} edge(s) tested · ${pass.length} survived (BH+OOS+N) · ${tested.filter((e) => e.ruleSign !== e.sign && e.ok).length} sign disagreement(s).`);
  console.log('  Review data/pressure-calibration.json, then apply weight/lag/sign edits by hand with a _version bump.');
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
  return calibrate(getProxy, getInd).then((edges) => {
    rules.items = realRules;
    const lead = edges.find((e) => e.indicator === '_lead'), noise = edges.find((e) => e.indicator === '_noise');
    let fail = 0; const ok = (c, m) => { console.log(`  ${c ? '✓' : '✗ FAIL'} ${m}`); if (!c) fail++; };
    console.log('calibrate-pressure selftest (synthetic, no network):');
    ok(lead && lead.status === 'tested' && Math.abs(lead.lag - 3) <= 1, `recovers the 3-month lead (got ${lead && lead.lag})`);
    ok(lead && lead.sign === 1 && lead.oosPass, 'lead: correct sign, holds OOS');
    ok(lead && lead.suggestWeight > 0, `lead earns a weight (${lead && lead.suggestWeight})`);
    ok(noise && (!noise.bhPass || !noise.oosPass) && noise.suggestWeight === 0, 'noise earns weight 0');
    console.log(fail ? `\ncalibrate-pressure: ${fail} FAIL` : '\ncalibrate-pressure: OK — pipeline recovers truth, rejects noise.');
    process.exit(fail ? 1 : 0);
  });
}

if (arg('--selftest')) { selftest(); }
else {
  calibrate(fetchProxy, fetchIndicatorHistory).then((edges) => {
    report(edges);
    const out = { _doc: 'GENERATED by scripts/calibrate-pressure.mjs — empirical lead/sign/strength per indicator→ingredient edge vs the hand-set rule, backtested on long BLS-PPI price history. Informs human weight edits; never auto-applied. No price.', generatedAt: new Date().toISOString().slice(0, 10), edges };
    writeFileSync(path.join(repoRoot, 'data/pressure-calibration.json'), JSON.stringify(out, null, 2) + '\n');
    console.log('\nWrote data/pressure-calibration.json');
  }).catch((e) => { console.error('calibrate failed:', e.message); process.exit(1); });
}
