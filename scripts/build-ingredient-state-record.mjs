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
import { fileURLToPath } from 'node:url';
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
export function deriveOrigins(b) {
  const title = (s) => String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const tot = Object.values(b).reduce((a, c) => a + c, 0); if (!tot) return null;
  const sorted = Object.entries(b).map(([c, v]) => [c, v / tot]).sort((a, b) => b[1] - a[1]);
  const hhi = Math.round(sorted.reduce((a, pair) => a + pair[1] * pair[1], 0) * 100) / 100;
  const topShare = sorted[0][1];
  // "single-source" is reserved for a stream that really is ~one country (top >= 90%); a dominant-but-
  // -not-sole stream (Mexico 81% of tomatoes, 88% of avocados) is "concentrated", not "single-source"
  // (an 81% top share means a fifth comes from elsewhere — the old HHI>=0.5 label contradicted itself).
  const concentration = topShare >= 0.90 ? 'single-source' : (hhi >= 0.25 || topShare >= 0.50) ? 'concentrated' : 'diversified';
  return {
    import_top_sources: sorted.slice(0, 3).map((pair) => ({ country: title(pair[0]), share_pct: Math.round(pair[1] * 100) })),
    import_source_hhi: hhi,
    import_source_concentration: concentration,
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

// ---- US domestic exports (Census exports/HS, DF=1, HS6 monthly value) -------------------------
// The companion to the import stream: the value of US-PRODUCED goods shipped out (DF=1 = domestic
// exports, excluding foreign re-exports). Exports are pulled at HS6 because the US export schedule
// (Schedule B) and import schedule (HTS) only align at HS6 — so a slug's export is summed over the
// HS6 PARENTS of its import codes. Used to turn reliance into a true apparent-consumption share
// (production + imports - exports). Value only, nominal — never volume, never a delivered price.
function exportRawByHs6() {
  let lines; try { lines = fs.readFileSync(path.join(repoRoot, 'data/census-exports.jsonl'), 'utf8').trim().split('\n'); } catch { return null; }
  const byHs = {};
  for (const l of lines) {
    let o; try { o = JSON.parse(l); } catch { continue; }
    const rows = o.rows; if (!Array.isArray(rows) || rows.length < 2) continue;
    const H = rows[0], iV = H.indexOf('ALL_VAL_MO'), iY = H.indexOf('YEAR'), iC = H.indexOf('E_COMMODITY');
    for (const r of rows.slice(1)) {
      if (r[iV] == null) continue;
      const hs6 = String(iC >= 0 && r[iC] != null ? r[iC] : o.hs).slice(0, 6);
      const y = Number(iY >= 0 && r[iY] != null ? r[iY] : o.year);
      const b = byHs[hs6] = byHs[hs6] || {};
      b[y] = (b[y] || 0) + Number(r[iV]);
    }
  }
  return byHs; // hs6 -> { year: domestic-export value }
}
function exportBySlug() {
  const byHs6 = exportRawByHs6(); if (!byHs6) return null; // null => file not present yet
  const cross = rd('data/ingredient-hs-codes.json').codes;
  const slugHs6 = {};
  for (const [code, meta] of Object.entries(cross)) {
    const hs6 = String(code).slice(0, 6);
    for (const slug of meta.slugs) (slugHs6[slug] = slugHs6[slug] || new Set()).add(hs6);
  }
  const out = {};
  for (const [slug, set] of Object.entries(slugHs6)) {
    const annual = {};
    for (const hs6 of set) { const b = byHs6[hs6]; if (!b) continue; for (const [y, v] of Object.entries(b)) annual[y] = (annual[y] || 0) + v; }
    if (Object.keys(annual).length) out[slug] = annual; // { year: export value }
  }
  return out; // slug -> { year: value }
}

// ---- US domestic wild-landings layer (NOAA FOSS) ---------------------------------------------
// The seafood domestic pair for the import stream: US commercial WILD landings value, keyed to the
// slugs each species group serves. Read from the already-gated derived dataset
// (cost-index/noaa-landings-domestic.json) so the ISR and the landings explorer never diverge — a
// single source of truth. Null until that file lands, so the whole layer is inert until then. This is
// a WILD-CATCH figure set beside a largely-FARMED import stream; the harmony `catchpair` read NAMES
// that seam and never collapses it into the apparent-consumption share a crop's reliance forms.
// Which seafood species' US IMPORTS are predominantly AQUACULTURE (farmed abroad) vs wild-caught. The
// catchpair caveat may only assert "much of it farmed abroad" for these; for every OTHER seafood slug the
// imported supply is wild-caught and the caveat must stay mode-neutral (an earlier version hard-coded the
// farming claim on all 24 seafood records — false for octopus, lobster, squid, crab, cod, halibut, sole,
// grouper, snapper, mahi, anchovy, sardine, tuna, and US-import scallops/clams, which are wild-caught).
// Basis: the dominant farmed seafood imports to the US are shrimp, Atlantic salmon, and rainbow trout
// (NOAA FishWatch / FAO aquaculture). Editorial classification, not a fetched statistic — kept small and
// conservative (claim farming only where it is clearly the majority of the import stream).
const MOSTLY_FARMED_IMPORT = new Set([
  'shrimp', 'shrimp-head-on', 'shrimp-pd',
  'salmon-fillet', 'salmon-skin-on-fillet', 'whole-salmon',
  'whole-trout',
]);

function landingsBySlug() {
  let doc; try { doc = rd('cost-index/noaa-landings-domestic.json'); } catch { return null; }
  const groups = doc && doc.groups; if (!Array.isArray(groups)) return null;
  const out = {};
  for (const g of groups) {
    if (g.landings_usd == null) continue; // only groups carrying a $ value
    for (const slug of g.serves || []) out[slug] = { usd: g.landings_usd, year: g.latest_year, minimal: !!g.domestic_wild_minimal, group: g.id };
  }
  return out; // slug -> { usd, year, minimal, group }
}

// ---- US per-capita availability layer (USDA ERS, via cost-index/ers-food-availability.json) ----
// The VOLUME cross-check for the value-based reliance read: lbs/person/yr available domestically (ERS's
// supply-side proxy). Read from the already-gated derived dataset so the ISR and the ERS explorer never
// diverge. Null until that file lands. A supply-side PROXY for consumption, never a measured intake,
// never a price, never a forecast; published at the commodity level (a cut/variety carries its parent).
function percapBySlug() {
  let doc; try { doc = rd('cost-index/ers-food-availability.json'); } catch { return null; }
  const items = doc && doc.items; if (!Array.isArray(items)) return null;
  const out = {};
  for (const it of items) if (it.percap_lbs != null) out[it.slug] = { lbs: it.percap_lbs, year: it.latest_year };
  return out; // slug -> { lbs, year }
}

// ---- NASS domestic-supply layer (forward-compatible) -----------------------------------------
// Reads the raw national annual SURVEY rows the operator fetches into data/nass-domestic.jsonl
// (one line per commodity+statisticcat query: {commodity, stat, rows:[[year,class,refPeriod,unit,
// Value,short_desc], ...]}). Selects the clean series per ingredient (fresh-market production
// volume + $ value, marketing-year farm price, area, yield). Descriptive of the tracked record —
// farm price is farm-gate, a DISTINCT point in the chain, never the wholesale reference, never a
// forecast. Returns {} until the file lands, so the whole layer is inert until then.
// NOTE: NASS proliferates rows by class/period/unit; the selection heuristics below are conservative
// and MUST be verified against the first real pull (short_desc/class values confirm the picks).
const NASS_FILE = 'data/nass-domestic.jsonl';
function nassRaw() {
  let lines; try { lines = fs.readFileSync(path.join(repoRoot, NASS_FILE), 'utf8').trim().split('\n'); } catch { return null; }
  const byCom = {};
  for (const ln of lines) {
    let o; try { o = JSON.parse(ln); } catch { continue; }
    if (!o.commodity || !Array.isArray(o.rows)) continue;
    const c = byCom[o.commodity] = byCom[o.commodity] || {};
    (c[o.stat] = c[o.stat] || []).push(...o.rows);
  }
  return byCom;
}
function num(v) { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : null; }
function nassLatest(rows, pred) {
  // rows: [year, class_desc, reference_period_desc, unit_desc, Value, short_desc]
  const ok = (rows || []).map((r) => ({ y: Number(r[0]), cls: r[1] || '', rp: r[2] || '', u: r[3] || '', v: num(r[4]), sd: r[5] || '' }))
    .filter((r) => r.v != null && r.y && pred(r)).sort((a, b) => b.y - a.y);
  return ok[0] || null;
}
function nassBySlug() {
  const raw = nassRaw(); if (!raw) return null; // null => file not present yet
  const cross = (() => { try { return rd('data/ingredient-nass-codes.json').codes || {}; } catch { return {}; } })();
  // NASS files the FRESH MARKET / HEAD / BELL qualifier in short_desc, not class_desc (which is almost
  // always "ALL CLASSES"), so a class hit checks BOTH fields.
  const clsHit = (r, cls) => !cls || (r.cls || '').toUpperCase().includes(cls.toUpperCase()) || (r.sd || '').toUpperCase().includes(cls.toUpperCase());
  const isAgg = (r) => /ALL CLASSES|INCL CALVES|ALL UTILIZATION/i.test(r.cls || '');
  // Freshness floor for the DISPLAYED farm price only: NASS carries decades of history and some
  // commodities' latest marketing-year price is 20+ years stale (beets 1999, chickens 2007). Reliance
  // never uses farm price — it uses production VALUE, separately year-aligned to the import year — so
  // this guards just the displayed farm-gate tier, not the flagship cross-source read.
  const newestYear = Math.max(0, ...Object.values(raw).flatMap((c) => Object.values(c).flat()).map((r) => Number(r[0])).filter(Boolean));
  const out = {};
  for (const [slug, meta] of Object.entries(cross)) {
    const com = raw[meta.commodity]; if (!com) continue;
    const cls = meta.class || null;
    // Class-PREFERENCE cascade: a row carrying the crosswalk class (in class_desc or short_desc) first,
    // else the broadest ALL-CLASSES aggregate (the right denominator for reliance), else any valid row.
    // Recovers the 26 class-qualified crops whose $ value NASS only publishes at the ALL-CLASSES level.
    const bestOf = (rows, base) =>
         nassLatest(rows, (r) => base(r) && cls && clsHit(r, cls))
      || nassLatest(rows, (r) => base(r) && isAgg(r))
      || nassLatest(rows, (r) => base(r));
    const prodRows = com['PRODUCTION'] || [];
    // A production VALUE unit is "$" or a "$, ..." variant (citrus reports "$, PHD EQUIV"); a VOLUME
    // unit never starts with "$". "$ / CWT" (a price) starts with "$ " so it's excluded from both.
    const isVal = (r) => /^\$($|,)/.test(r.u);
    const vol = bestOf(prodRows, (r) => !/^\$/.test(r.u) && r.rp === 'YEAR' && /UTILIZED|PRODUCTION/.test(r.sd))
             || bestOf(prodRows, (r) => !/^\$/.test(r.u) && r.rp === 'YEAR');
    const usd = bestOf(prodRows, (r) => isVal(r) && r.rp === 'YEAR');
    // Farm price: marketing-year, a weight unit ($/CWT or $/LB) preferred over $/TON / box / parity.
    const priceRows = com['PRICE RECEIVED'] || [];
    const priceRaw = bestOf(priceRows, (r) => /^\$ \/ (CWT|LB)\b/.test(r.u) && r.rp === 'MARKETING YEAR')
                  || bestOf(priceRows, (r) => /^\$ \//.test(r.u) && r.rp === 'MARKETING YEAR');
    const price = priceRaw && priceRaw.y >= newestYear - 7 ? priceRaw : null;
    const area = bestOf(com['AREA HARVESTED'] || [], (r) => r.rp === 'YEAR');
    const yld = bestOf(com['YIELD'] || [], (r) => r.rp === 'YEAR');
    if (!vol && !usd && !price) continue;
    const years = [...(prodRows || [])].map((r) => Number(r[0])).filter(Boolean);
    out[slug] = {
      commodity: meta.commodity,
      production_volume: vol ? vol.v : null, production_unit: vol ? vol.u : null,
      production_usd: usd ? Math.round(usd.v) : null, production_usd_year: usd ? usd.y : null,
      farm_price: price ? price.v : null, farm_price_unit: price ? price.u.replace(/\s+/g, ' ').trim() : null,
      production_years: years.length ? Math.min(...years) + '-' + Math.max(...years) : null,
      area_acres: area ? Math.round(area.v) : null,
      yield_val: yld ? yld.v : null, yield_unit: yld ? yld.u : null,
    };
  }
  return out;
}

// ---- harmony: cross-source synthesis reads (structured; the island renders EN/ES) --------------
// Each entry fuses >=2 fields into a read no single field gives, and appears ONLY when its inputs
// are present (degrades by absence). STRUCTURED params only — bounded numbers + enums + in-corpus
// slugs, never free prose — so nothing here can forecast, assert cause, or price a delivered pound;
// the island owns the reviewed EN/ES sentence templates and resolves slugs to names. This is a pure
// function of the finished record (same semantics the island reads), so it is trivially testable.
//   supplyshape where the import stream comes from — origin concentration + top source (present today)
//   reliance    Import VALUE as a share of APPARENT CONSUMPTION — production + imports − exports (Census
//               imports + Census DF=1 exports + NASS production), the flagship cross-source read. Still a
//               cross-POINT proxy (import value carries freight the farm price does not), never exact.
//               The island states the caveat; here it is bounded params only.
//   persistence how long a move ran + (only when it clears the noise bar) the ingredient it most often
//               moved WITH — past-tense, co-occurrence, NEVER cause.
// (An earlier draft also carried `buyclock` and `served`; an adversarial audit dropped both — buyclock
//  mislabeled an import-VALUE peak as a supply/volume peak and added nothing to a buy the cheapest-month
//  field already decides; served crossed two different trim bases and mispriced raw-portioned cuts. The
//  served-pound teaching lives, properly caveated, in the menu-pricing dispatch instead.)
//
// A co-mover is NAMED only when it moved the same way in a MAJORITY of an ingredient's own moves
// (>=3 shared AND >=half of n). Argmax over ~100 candidates at n~6 is winner's-curse noise otherwise
// (it manufactured implausible pairs like avocado<->acorn-squash at 2/6); below the bar we keep the
// run-length and drop the co-mover.
export function strongComover(r) {
  const co = (r.comovers && r.comovers[0]) || null; if (!co) return null;
  const m = /^(\d+)\/(\d+)$/.exec(String(co.shared_of_n || '')); if (!m) return null;
  const k = Number(m[1]), n = Number(m[2]);
  return (k >= 3 && n > 0 && k / n >= 0.5) ? co : null;
}
export function harmonyFor(r) {
  const H = [];
  if (r.import_source_concentration && Array.isArray(r.import_top_sources) && r.import_top_sources.length) {
    const t = r.import_top_sources[0];
    H.push({ kind: 'supplyshape', concentration: r.import_source_concentration, hhi: r.import_source_hhi != null ? r.import_source_hhi : null, top_country: t.country, top_share: t.share_pct });
  }
  if (r.import_reliance_pct != null) {
    const t = (r.import_top_sources && r.import_top_sources[0]) || null;
    // the value read (import share of apparent consumption) carries its VOLUME companion when we have it:
    // ERS per-capita availability — lbs/person/yr available domestically. Two honest views of "how much
    // do we lean on imports": the customs-value ratio and the pounds-available proxy, never conflated.
    H.push({ kind: 'reliance', reliance_pct: r.import_reliance_pct, reliance_year: r.import_reliance_year != null ? r.import_reliance_year : null, scope: r.import_reliance_scope || null, commodity: r.nass_commodity || null, top_country: t ? t.country : null, top_share: t ? t.share_pct : null, percap_lbs: r.us_percap_lbs != null ? r.us_percap_lbs : null, percap_year: r.us_percap_lbs != null ? r.us_percap_year : null });
  }
  // catchpair — the SEAFOOD analog of reliance, kept deliberately distinct: US wild landings value set
  // beside the import value, but NEVER a supply share, because the domestic figure is WILD-caught while
  // the import is largely FARMED. Two dollar figures + the wild-minimal flag; the island states the seam.
  // The import $ is aligned to the SAME year as the landings figure when that year is in the annual
  // series (landings run a year behind imports), so the pair is a same-year comparison, never cross-year;
  // import_year is carried so the island can state (and, on the rare fallback, reconcile) the years.
  if (r.us_landings_value_usd != null && r.us_import_value_usd != null) {
    const ly = r.us_landings_year != null ? r.us_landings_year : null;
    const ann = r.import_annual_usd || {};
    let importUsd, importYear;
    if (ly != null && ann[ly] != null) { importUsd = Math.round(ann[ly]); importYear = ly; }
    else {
      importUsd = r.us_import_value_usd;
      const yrs = Object.keys(ann).map(Number).filter(Number.isFinite).sort((a, b) => b - a);
      importYear = yrs.length ? yrs[0] : null;
    }
    H.push({ kind: 'catchpair', landings_usd: r.us_landings_value_usd, import_usd: importUsd, import_year: importYear, wild_minimal: !!r.us_landings_wild_minimal, mostly_farmed: !!r.import_mostly_farmed, landings_year: ly });
  }
  if (r.notable_events_n && r.median_shock_days != null) {
    const co = strongComover(r);
    H.push({ kind: 'persistence', n: r.notable_events_n, median_days: r.median_shock_days, comover_slug: co ? co.slug : null, comover_shared: co ? co.shared_of_n : null });
  }
  return H.length ? H : null;
}

// ---- fuse ------------------------------------------------------------------
function build() {
  const P = pricingCards(repoRoot);
  const depth = (() => { try { return rd('data/ingredient-depth.json').ingredients || {}; } catch { return {}; } })();
  const pressure = (() => { try { return rd('data/cost-pressure.json').items || {}; } catch { return {}; } })();
  const imp = importBySlug();
  const evd = eventDepthBySlug();
  const lfAsOf = (() => { try { return rd('data/cost-lockfloat.json').asOf || null; } catch { return null; } })();
  // NASS domestic-supply layer. `nass` is null until data/nass-domestic.jsonl lands, so nassFields
  // adds NOTHING then (record schema unchanged) — forward-compatible, exactly like the specialty tier.
  const nass = nassBySlug();
  const exp = exportBySlug(); // slug -> { year: domestic-export value }; null until the file lands
  const exportInfo = (slug) => {
    const a = exp && exp[slug]; if (!a) return { usd: null, year: null };
    const yrs = Object.keys(a).map(Number).sort((x, y) => y - x);
    return { usd: Math.round(a[yrs[0]]), year: yrs[0] };
  };
  const exportAt = (slug, year) => (exp && exp[slug] && year != null && exp[slug][year] != null) ? exp[slug][year] : null;
  const landings = landingsBySlug(); // slug -> { usd, year, minimal }; null until the file lands
  const landingsFields = (slug) => {
    if (!landings) return {};
    const l = landings[slug] || null;
    return {
      us_landings_value_usd: l ? l.usd : null,
      us_landings_year: l ? l.year : null,
      us_landings_wild_minimal: l ? l.minimal : null,
      import_mostly_farmed: l ? MOSTLY_FARMED_IMPORT.has(slug) : null,
    };
  };
  const percap = percapBySlug(); // slug -> { lbs, year }; null until the ERS file lands
  const percapFields = (slug) => {
    if (!percap) return {};
    const p = percap[slug] || null;
    return { us_percap_lbs: p ? p.lbs : null, us_percap_year: p ? p.year : null };
  };
  // Commodity-scoped reliance: many slugs share one NASS commodity (cherry-tomato + tomato both map to
  // TOMATOES). A variety's NARROW import over the WHOLE commodity's production is a mismatched ratio
  // (cherry-tomato 14% vs tomato 81% off the same $754M TOMATOES production). So when >1 slug shares a
  // commodity, compute ONE commodity-level reliance from the BROADEST member import stream (the commodity-
  // level one) over the shared production, and apply it to every member that carries its own import —
  // labeled reliance_scope='commodity'. Single-slug commodities stay reliance_scope='item'.
  const commodityReliance = (() => {
    if (!nass) return {};
    const byCom = {};
    for (const [slug, n] of Object.entries(nass)) {
      if (!n || n.production_usd == null || !n.commodity) continue;
      (byCom[n.commodity] = byCom[n.commodity] || []).push(slug);
    }
    const out = {};
    for (const [com, slugs] of Object.entries(byCom)) {
      if (slugs.length < 2) continue; // only shared commodities need the fix
      const n0 = nass[slugs[0]];
      const prodUsd = n0.production_usd, prodYear = n0.production_usd_year;
      if (prodUsd == null) continue;
      let best = null; // the broadest member import stream, aligned to the production year
      for (const slug of slugs) {
        const im = imp[slug]; if (!im) continue;
        let iv = im.latest_year_usd, iy = im.latest_year;
        if (im.annual_usd && prodYear != null && im.annual_usd[prodYear] != null) { iv = im.annual_usd[prodYear]; iy = prodYear; }
        if (iv == null) continue;
        if (!best || iv > best.iv) best = { slug, iv, iy };
      }
      if (!best) continue;
      const exportUsd = exportAt(best.slug, best.iy);
      const apparent = prodUsd + best.iv - (exportUsd || 0);
      if (apparent <= 0) continue;
      // NOT clamped to 100: when a commodity is re-exported heavily its import can exceed apparent
      // consumption (>100%), a real signal the render surfaces as "imports exceed apparent consumption".
      out[com] = { pct: Math.max(0, Math.round((best.iv / apparent) * 100)), year: best.iy, members: slugs.slice() };
    }
    return out;
  })();
  const nassFields = (slug, im) => {
    if (!nass) return {};
    const n = nass[slug] || null;
    const prodUsd = n && n.production_usd != null ? n.production_usd : null;
    const prodYear = n && n.production_usd_year != null ? n.production_usd_year : null;
    // a shared-commodity slug that carries its own import inherits the ONE commodity-scoped reliance
    const cr = (im && n && commodityReliance[n.commodity]) || null;
    // Import share of APPARENT CONSUMPTION: import value ÷ (production + import − export), all aligned
    // to the production year. Netting US domestic exports (Census DF=1) out of the denominator makes
    // this a genuine "share of what is consumed DOMESTICALLY that is imported" rather than the old
    // import/(import+production) ratio, which ignored a big exporter's outflow and overstated the share.
    // It remains a cross-POINT dollar comparison (import value carries freight the farm price does not),
    // so still a proxy, never exact — descriptive, never a forecast. Align import to the production year
    // when the series reaches it; else use the latest import year. Export defaults to 0 when we have no
    // export figure for that year (not netted). Null unless import + production are both present — and
    // also null when a broad-HS6 export exceeds a narrow NASS commodity's production so apparent goes
    // <= 0 (a granularity mismatch, not a real signal): we keep the three raw dollar figures visible but
    // never fabricate a share we can't cleanly form. Degrade by absence.
    let importUsd = im ? im.latest_year_usd : null;
    let relianceYear = im ? im.latest_year : null;
    if (im && im.annual_usd && prodYear != null && im.annual_usd[prodYear] != null) { importUsd = im.annual_usd[prodYear]; relianceYear = prodYear; }
    const exportUsd = exportAt(slug, relianceYear);
    let reliance = null, relianceScope = null;
    if (cr) {
      // commodity-scoped: one honest number for the whole group (avoids the narrow-numerator artifact)
      reliance = cr.pct; relianceYear = cr.year; relianceScope = 'commodity';
    } else if (importUsd != null && prodUsd != null) {
      const apparent = prodUsd + importUsd - (exportUsd || 0);
      // NOT clamped to 100 — a re-exporter's import can exceed apparent consumption (brussels-sprouts,
      // papaya, asparagus, banana all land ~101-112%); the render labels >100% as a re-export signal
      // rather than masking it as a flat "100%".
      if (apparent > 0) { reliance = Math.max(0, Math.round((importUsd / apparent) * 100)); relianceScope = 'item'; }
    }
    return {
      nass_commodity: n ? n.commodity : null,
      us_production_usd: prodUsd,
      us_production_volume: n ? n.production_volume : null,
      us_production_unit: n ? n.production_unit : null,
      farm_price: n ? n.farm_price : null,
      farm_price_unit: n ? n.farm_price_unit : null,
      us_area_acres: n ? n.area_acres : null,
      us_yield: n ? n.yield_val : null,
      us_yield_unit: n ? n.yield_unit : null,
      production_years: n ? n.production_years : null,
      import_reliance_pct: reliance,
      import_reliance_year: reliance != null ? relianceYear : null,
      import_reliance_scope: reliance != null ? relianceScope : null,
    };
  };

  const records = P.cards.map((c) => {
    const d = depth[c.slug] || {}; const pr = pressure[c.slug]; const im = imp[c.slug]; const ed = evd[c.slug] || {}; const ex = exportInfo(c.slug);
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
      us_import_value_usd: im ? im.latest_year_usd : null,
      us_export_value_usd: ex.usd, us_export_year: ex.usd != null ? ex.year : null,
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
      ...nassFields(c.slug, im || null),
      ...landingsFields(c.slug),
      ...percapFields(c.slug),
    };
    rec.harmony = harmonyFor(rec);
    return rec;
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
    const ex = exportInfo(sp.slug);
    const rec = {
      slug: sp.slug, name: sp.name, category: sp.category || null,
      posture: null, band_pct: null,
      edible_yield_pct: sp.edible_yield_pct != null ? sp.edible_yield_pct : null,
      trim_tax: sp.edible_yield_pct != null ? Math.round((100 / sp.edible_yield_pct) * 100) / 100 : null,
      cooked_yield: sp.cooked_yield != null ? sp.cooked_yield : null,
      cheapest_month: null, save_pct: null, hedge_swap: null,
      pressure_dir: null, pressure_conf: null,
      us_import_value_usd: im ? im.latest_year_usd : null,
      us_export_value_usd: ex.usd, us_export_year: ex.usd != null ? ex.year : null,
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
      ...nassFields(sp.slug, im || null),
      ...landingsFields(sp.slug),
      ...percapFields(sp.slug),
    };
    rec.harmony = harmonyFor(rec);
    records.push(rec);
  }

  const meta = {
    dataset: 'Muntin Cost Index — Ingredient State Record',
    url: 'https://muntin.digital/cost-index/menu-pricing/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital)',
    audience: 'Food-cost intelligence for anyone who works with food — operators, chefs, home cooks, journalists, researchers. The wholesale price is a market-DIRECTION reference (your delivered or retail price tracks it with a lag and a markup); every other field is food-intrinsic and buyer-agnostic.',
    note: "One present-state record per ingredient, fusing pricing posture + own-baseline band, edible/cooked yield + trim tax, cheapest month, the price hedge swap, present pipeline direction, and the US import stream. Every field is descriptive of the tracked record — never a delivered/retail price, never a forecast, and co-occurrence is never cause. us_import_value_usd is the latest full calendar year of US general import VALUE for the ingredient's HS6 (US Census, public domain), nominal (mixes volume and price) — never import volume (not published at HS6). import_peak_months are the three highest-import calendar months averaged over 2010-2025; import_peak_quarter_share is the peak quarter's share of a typical year's import value (a within-year ratio, inflation-immune) — both descriptive seasonality, the supply-timing tell of when an ingredient leans on imports. import_top_sources / import_source_hhi / import_source_concentration describe the 2025 source-country mix (real countries only, trade blocs and continents excluded) and its Herfindahl concentration — a descriptive supply-diversity fact (raspberry ~100% Mexico, lobster ~99% Canada), never a risk forecast. import_annual_usd carries the full 2010-2025 annual series; import_yoy_pct is the latest full year versus the prior year (a descriptive change, nominal). notable_events_n, median_shock_days and biggest_move_pct+date summarize the ingredient's own notable sustained price moves in the deep history (descriptive, from the events dataset — a departure from its own baseline, never a delivered price). comovers lists the ingredients that most often moved the same way in the same six-week window, as k of this ingredient's own n moves — co-occurrence, NEVER cause. us_export_value_usd is the latest full year of US DOMESTIC exports (US Census, DF=1 = US-produced goods excluding foreign re-exports, HS6, nominal value). us_production_usd + farm_price are USDA NASS national annual figures (public domain); farm_price is a FARM-GATE price — a distinct point in the chain, never the wholesale reference. import_reliance_pct is import value as a share of APPARENT CONSUMPTION (production + imports − exports), all year-aligned — a descriptive cross-point proxy (the figures sit at different points in the chain: import value carries freight the farm-gate price does not), never a supply-security score, and withheld where the source granularities cannot form a clean share. Fields are null where a layer does not cover an ingredient.",
    rights: { corpus_columns: 'CC BY 4.0 (Muntin Cost Index)', import_columns: 'US Census general imports — public domain (US Government work)' },
    dateModified: lfAsOf,
    count: records.length,
    withImport: records.filter((r) => r.us_import_value_usd != null).length,
    withPressure: records.filter((r) => r.pressure_dir != null).length,
    ingredients: records,
  };

  const cols = ['slug', 'name', 'category', 'posture', 'band_pct', 'edible_yield_pct', 'trim_tax', 'cooked_yield', 'cheapest_month', 'save_pct', 'hedge_swap', 'pressure_dir', 'pressure_conf', 'us_import_value_usd', 'us_export_value_usd', 'us_production_usd', 'us_landings_value_usd', 'us_landings_year', 'us_landings_wild_minimal', 'import_mostly_farmed', 'farm_price', 'farm_price_unit', 'import_reliance_pct', 'import_reliance_year', 'import_reliance_scope', 'import_years', 'import_peak_months', 'import_peak_quarter_share', 'import_hs6', 'import_yoy_pct', 'import_source_concentration', 'import_source_hhi', 'import_top_sources', 'notable_events_n', 'median_shock_days', 'biggest_move_pct', 'biggest_move_date', 'comovers'];
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
// Guarded so the module can be imported (by the unit test) without building or writing; only a
// direct `node build-ingredient-state-record.mjs [--check]` invocation runs it. Matches the
// main-guard pattern in build-seasonality.mjs.
function run() {
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
}
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
