/**
 * probe-cost-index-new-sources.mjs — READ-ONLY live verification of the candidate
 * new sources from docs/cost-index-sourcing-master.md. Writes NOTHING; just hits
 * each source's live endpoint and reports PASS / FAIL / SKIP with the real value
 * and field names, so we only wire what actually resolves (the 7-agent sweep was
 * egress-blocked, so every series id/endpoint below is "confirmed-from-search" —
 * this turns it into "confirmed-live").
 *
 * Run on a clone with keys exported:
 *   NASS_KEY=… BLS_KEY=… CENSUS_KEY=… FRED_KEY=… AMS_KEY=… node scripts/probe-cost-index-new-sources.mjs
 * Missing a key → that family SKIPs (no failure). Get free keys:
 *   NASS  quickstats.nass.usda.gov/api   ·  CENSUS  api.census.gov/data/key_signup.html
 *   BLS   data.bls.gov/registrationEngine ·  FRED  fred.stlouisfed.org/docs/api/api_key.html
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const F = require('../tools/_shared/cost-index-fetch.js');

const K = (n) => process.env[n] && process.env[n].trim();
const rows = [];
const rec = (family, item, status, detail) => rows.push({ family, item, status, detail });
const j = (url, init) => F.fetchJson(url, init);   // retry + timeout + backoff from the shared fetcher

// ── NASS QuickStats prices-received (farm-gate $ LEVEL — the highest-leverage add) ──
async function probeNass() {
  const key = K('NASS_KEY');
  if (!key) return rec('NASS', '(all)', 'SKIP', 'set NASS_KEY (free: quickstats.nass.usda.gov/api)');
  const probes = [
    ['eggs $/doz', { commodity_desc: 'EGGS', statisticcat_desc: 'PRICE RECEIVED' }],
    ['broilers $/lb', { commodity_desc: 'CHICKENS', statisticcat_desc: 'PRICE RECEIVED' }],
    ['turkeys $/lb', { commodity_desc: 'TURKEYS', statisticcat_desc: 'PRICE RECEIVED' }],
    ['milk $/cwt', { commodity_desc: 'MILK', statisticcat_desc: 'PRICE RECEIVED' }],
    ['cattle $/cwt', { commodity_desc: 'CATTLE', statisticcat_desc: 'PRICE RECEIVED' }],
    ['hogs $/cwt', { commodity_desc: 'HOGS', statisticcat_desc: 'PRICE RECEIVED' }],
    ['sheep/lamb $/cwt', { commodity_desc: 'SHEEP, INCLUDING LAMBS', statisticcat_desc: 'PRICE RECEIVED' }],
    ['potatoes $/cwt', { commodity_desc: 'POTATOES', statisticcat_desc: 'PRICE RECEIVED' }],
    ['sweet potatoes', { commodity_desc: 'SWEET POTATOES', statisticcat_desc: 'PRICE RECEIVED' }],
    ['carrots', { commodity_desc: 'CARROTS', statisticcat_desc: 'PRICE RECEIVED' }],
    ['peppers bell', { commodity_desc: 'PEPPERS', statisticcat_desc: 'PRICE RECEIVED' }],
    ['mushrooms', { commodity_desc: 'MUSHROOMS', statisticcat_desc: 'PRICE RECEIVED' }],
    ['trout (grower)', { commodity_desc: 'TROUT', statisticcat_desc: 'PRICE RECEIVED' }],
  ];
  for (const [label, q] of probes) {
    const qs = new URLSearchParams({ key, agg_level_desc: 'NATIONAL', year__GE: '2023', format: 'JSON', ...q }).toString();
    try {
      const r = await j(`https://quickstats.nass.usda.gov/api/api_GET/?${qs}`);
      const data = (r && r.data) || [];
      if (!data.length) { rec('NASS', label, 'FAIL', 'no NATIONAL rows ≥2023 (try state/annual)'); continue; }
      const latest = data.sort((a, b) => (b.year - a.year) || String(b.reference_period_desc).localeCompare(a.reference_period_desc))[0];
      rec('NASS', label, 'PASS', `${latest.Value} (${latest.unit_desc}, ${latest.reference_period_desc} ${latest.year}; freq seen: ${[...new Set(data.map(d => d.freq_desc))].join('/')})`);
    } catch (e) { rec('NASS', label, 'FAIL', e.message); }
  }
}

// ── BLS PPI candidate per-commodity codes (independent index TYPE) ──
async function probeBls() {
  const key = K('BLS_KEY');
  const ids = {
    'salmon WPU02230103': 'WPU02230103', 'clams WPU02230504': 'WPU02230504',
    'flounder WPU02230131': 'WPU02230131', 'rockfish WPU02230135': 'WPU02230135',
    'tomato WPU01130217': 'WPU01130217', 'cucumber WPU01130234': 'WPU01130234',
    'eggplant WPU01130229': 'WPU01130229', 'beets WPU01130232': 'WPU01130232',
    'green-peppers WPU01130228': 'WPU01130228', 'round-red-potato WPU01130604': 'WPU01130604',
    'whole-chicken WPU02220105': 'WPU02220105', 'chicken-parts WPU02220106': 'WPU02220106',
    'turkey WPU022202': 'WPU022202', 'large-eggs WPU01710703': 'WPU01710703',
    'lemon WPU01110104': 'WPU01110104', 'grapefruit WPU01110101': 'WPU01110101',
  };
  if (!key) return rec('BLS', '(all)', 'SKIP', 'set BLS_KEY (free: data.bls.gov/registrationEngine)');
  try {
    const r = await j('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: Object.values(ids), startyear: '2024', endyear: '2026', registrationkey: key }),
    });
    const series = (r && r.Results && r.Results.series) || [];
    const byId = {}; series.forEach((s) => { byId[s.seriesID] = (s.data && s.data[0]) || null; });
    for (const [label, id] of Object.entries(ids)) {
      const d = byId[id];
      if (d && d.value) rec('BLS', label, 'PASS', `${d.value} (${d.periodName} ${d.year})`);
      else rec('BLS', label, 'FAIL', 'no recent data (discontinued?)');
    }
  } catch (e) { rec('BLS', '(batch)', 'FAIL', e.message); }
}

// ── Census import unit value ($/kg LEVEL — holy grail for imported produce) ──
async function probeCensus() {
  const key = K('CENSUS_KEY');
  if (!key) return rec('Census', '(all)', 'SKIP', 'set CENSUS_KEY (free: api.census.gov/data/key_signup.html)');
  const hs = { avocado: '080440', lime: '080550', banana: '080390', garlic: '070320', pineapple: '080430', ginger: '091011', 'bell-pepper': '070960' };
  // most recent closed month is ~6 weeks back; try a wider window.
  const months = (() => { const out = []; const d = new Date(); for (let i = 2; i <= 8; i++) { const m = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`); } return out; })();
  for (const [label, code] of Object.entries(hs)) {
    let done = false;
    for (const t of months) {
      const url = `https://api.census.gov/data/timeseries/intltrade/imports/hs?get=GEN_VAL_MO,GEN_QY1_MO,UNIT_QY1,I_COMMODITY_LDESC&I_COMMODITY=${code}&COMM_LVL=HS6&time=${t}&key=${key}`;
      try {
        const r = await j(url);
        if (Array.isArray(r) && r.length > 1) {
          const [hdr, ...data] = r; const gi = hdr.indexOf('GEN_VAL_MO'), qi = hdr.indexOf('GEN_QY1_MO'), ui = hdr.indexOf('UNIT_QY1');
          const tot = data.reduce((a, row) => ({ v: a.v + (+row[gi] || 0), q: a.q + (+row[qi] || 0) }), { v: 0, q: 0 });
          const unit = data[0][ui];
          if (tot.q > 0) { rec('Census', label, 'PASS', `$${(tot.v / tot.q).toFixed(2)}/${unit} (${t}, HS${code})`); done = true; break; }
        }
      } catch (e) { /* try next month */ }
    }
    if (!done) rec('Census', label, 'FAIL', `no import rows in last months (HS${code}) — verify 10-digit + unit`);
  }
}

// ── NOAA FOSS Landings (ex-vessel $/lb LEVEL — domestic seafood) ──
async function probeNoaaLandings() {
  const hosts = ['https://apps-st.fisheries.noaa.gov/ods/foss/landings/', 'https://www.st.nmfs.noaa.gov/ords/foss/landings/'];
  for (const base of hosts) {
    try {
      const r = await j(`${base}?q=${encodeURIComponent('{"year":2023}')}&limit=3`);
      const items = (r && (r.items || r)) || [];
      if (items.length) {
        const f = items[0]; const fields = Object.keys(f).slice(0, 8).join(',');
        rec('NOAA-landings', base.includes('apps-st') ? 'cloud host' : 'legacy host', 'PASS', `fields: ${fields}`);
        return;
      }
    } catch (e) { /* try next host */ }
  }
  rec('NOAA-landings', '(both hosts)', 'FAIL', 'no live ORDS response — check migration notice / field names manually');
}

// ── FRED/IMF & World Bank benchmark $ LEVELS ──
async function probeFred() {
  const key = K('FRED_KEY');
  if (!key) return rec('FRED', '(all)', 'SKIP', 'set FRED_KEY');
  const ids = { 'soybean-oil PSOILUSDM': 'PSOILUSDM', 'banana PBANSOPUSDM': 'PBANSOPUSDM', 'orange PORANGUSDM': 'PORANGUSDM', 'beef PBEEFUSDM': 'PBEEFUSDM', 'swine PPORKUSDM': 'PPORKUSDM', 'lamb PLAMBUSDM': 'PLAMBUSDM' };
  for (const [label, id] of Object.entries(ids)) {
    try {
      const r = await j(`https://api.stlouisfed.org/fred/series/observations?series_id=${id}&file_type=json&sort_order=desc&limit=1&api_key=${key}`);
      const o = r && r.observations && r.observations[0];
      if (o && o.value && o.value !== '.') rec('FRED', label, 'PASS', `${o.value} (${o.date})`);
      else rec('FRED', label, 'FAIL', 'no observation');
    } catch (e) { rec('FRED', label, 'FAIL', e.message); }
  }
}

// ── AMS MARS — the lamb-cutout rescue + retail $ levels ──
async function probeAms() {
  const key = K('AMS_KEY');
  if (!key) return rec('AMS', '(all)', 'SKIP', 'set AMS_KEY');
  const lmrAuth = process.env.LMR_KEY ? 'Basic ' + Buffer.from(process.env.LMR_KEY + ':').toString('base64') : undefined;
  const amsAuth = 'Basic ' + Buffer.from(key + ':').toString('base64');
  // lamb cutout/boxed are LMR Datamart reports (not the MARS produce endpoint);
  // retail chicken/turkey are MMN reports (slug-based) — try MARS, may need MMN.
  const reports = [
    ['lamb cutout 2649', '2649', 'lmr'], ['lamb boxed 2648', '2648', 'lmr'],
    ['retail chicken 2499', '2499', 'ams'], ['retail turkey 3375', '3375', 'ams'],
  ];
  for (const [label, id, kind] of reports) {
    try {
      const r = kind === 'lmr' ? await F.fetchLmrReport(id, null, lmrAuth, 30) : await F.fetchAmsReport(id, null, amsAuth, 30);
      const rowsR = (r && (r.results || (r.report && r.report.results))) || (Array.isArray(r) ? r : []);
      if (rowsR && rowsR.length) {
        const fields = Object.keys(rowsR[0] || {}).slice(0, 6).join(',');
        rec('AMS', label, 'PASS', `${rowsR.length} rows · fields: ${fields}`);
      } else {
        const secs = (r && (r.reportSections || (r.report && r.report.reportSections))) || [];
        rec('AMS', label, secs.length ? 'PARTIAL' : 'FAIL', secs.length ? `0 default rows; sections: ${secs.map((s) => (typeof s === 'string' ? s : s.name)).join(' · ')}` : 'no rows');
      }
    } catch (e) { rec('AMS', label, 'FAIL', e.message); }
  }
}

async function main() {
  console.log('Probing candidate new Cost Index sources (read-only)…\n');
  await probeNass(); await probeBls(); await probeCensus();
  await probeNoaaLandings(); await probeFred(); await probeAms();
  const pad = (s, n) => String(s).padEnd(n);
  const icon = (s) => ({ PASS: '[PASS]', FAIL: '[FAIL]', SKIP: '[skip]', PARTIAL: '[part]' }[s] || '[ ? ]');
  let fam = '';
  for (const r of rows) {
    if (r.family !== fam) { fam = r.family; console.log(`\n── ${fam} ──`); }
    console.log(`  ${icon(r.status)} ${pad(r.item, 24)} ${r.detail}`);
  }
  const n = (s) => rows.filter((r) => r.status === s).length;
  console.log(`\n${n('PASS')} pass · ${n('FAIL')} fail · ${n('PARTIAL')} partial · ${n('SKIP')} skipped (no key).`);
  console.log('PASS = wire it. FAIL = re-check the id/HS-10/field before wiring. Paste this back.');
}
main().catch((e) => { console.error(e); process.exit(1); });
