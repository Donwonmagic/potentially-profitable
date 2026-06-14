/**
 * Muntin — Cost Index live-fetch transport (shared by the verifier and the
 * orchestrator, so the two can never drift). Pure IO concerns:
 *   - a timeout + transient-only retry with jittered backoff (a flaky 5xx/429
 *     or network blip is retried; a 4xx bad id/key fails fast — that's the
 *     signal verify exists to surface; a 200 that parses is never retried —
 *     a contract failure is poison, not a blip, handled by the caller),
 *   - the AMS date-window + detail-section discovery,
 *   - bounded-concurrency fan-out (fetch terminals in parallel, politely).
 *
 * Node only (global fetch / AbortSignal). Not browser. CommonJS so the .mjs
 * scripts load it via createRequire, exactly like the other tools/_shared libs.
 */
'use strict';

var FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 25000);
var AMS_WINDOW_DAYS = Number(process.env.AMS_WINDOW_DAYS || 120);
var MAX_RETRIES = Number(process.env.FETCH_RETRIES || 3);
var AMS_CONCURRENCY = Number(process.env.AMS_CONCURRENCY || 2);   // polite to the single MARS host — heavy produce fetches starve other sources at higher fan-out

var TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);
var TRANSIENT_ERR = /ECONNRESET|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|ETIMEDOUT|UND_ERR|terminated|socket|network|fetch failed/i;

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// Node's global fetch wraps a transient network error as a bare "TypeError:
// fetch failed" with the real code (ECONNRESET, …) buried in e.cause — so check
// both, plus our own AbortSignal timeout. This is what made onion/russet ("fetch
// failed") never retry: the message alone matched nothing.
function isTransient(e) {
  if (!e) return false;
  if (e.name === 'TimeoutError' || e.name === 'AbortError') return true;
  var msg = String(e.message || '');
  var cause = e.cause ? String(e.cause.code || e.cause.message || e.cause) : '';
  return TRANSIENT_ERR.test(msg) || TRANSIENT_ERR.test(cause);
}

function backoff(attempt, headers) {
  var ms = Math.min(8000, 500 * Math.pow(2, attempt)) * (0.5 + Math.random());   // full jitter, cap 8s
  var ra = headers && headers.get && headers.get('retry-after');
  if (ra != null) { var s = Number(ra); if (isFinite(s)) ms = Math.max(ms, s * 1000); }   // honor Retry-After
  return ms;
}

async function fetchJson(url, init) {
  init = init || {};
  for (var attempt = 0; ; attempt++) {
    var res;
    try {
      res = await fetch(url, Object.assign({}, init, { signal: init.signal || AbortSignal.timeout(FETCH_TIMEOUT_MS) })); // h8-exempt: Node-only build/CI transport for the live Cost Index fetch; never bundled or served to the browser (no window export)
    } catch (e) {
      if (!isTransient(e) || attempt >= MAX_RETRIES) throw e;
      await sleep(backoff(attempt));
      continue;
    }
    if (res.ok) return res.json();
    if (!TRANSIENT_STATUS.has(res.status) || attempt >= MAX_RETRIES) throw new Error('HTTP ' + res.status);
    await sleep(backoff(attempt, res.headers));
  }
}

function amsWindow(days) {
  var f = function (d) { return ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2) + '/' + d.getFullYear(); };
  var end = new Date(); var start = new Date(end.getTime() - days * 864e5);
  return f(start) + ':' + f(end);
}

var MARS_BASE = 'https://marsapi.ams.usda.gov/services/v1.2/reports/';      // Market News (produce/poultry) — keyed
var LMR_BASE = 'https://mpr.datamart.ams.usda.gov/services/v1.1/reports/';  // LMR Datamart (boxed beef / negotiated pork) — typically keyless

/**
 * Fetch a report's DETAIL section (prices live there; the bare report is the
 * header). Windowed to recent dates so huge reports return a small current
 * slice; auto-corrects the section name when the API hands back the header
 * (section names differ: "Report Details" on produce, "Report Detail" on the
 * chicken report; the Datamart often has no section). Falls back to the
 * unwindowed fetch ONLY if a report REJECTS the date filter (4xx) — never on a
 * timeout/network failure, where the full-history fetch would deepen the stall.
 * Host-agnostic: shared by MARS (keyed) and the LMR Datamart (keyless).
 */
// In-run cache: a report+section+window is fetched ONCE per process and reused.
// Beef ribeye + tenderloin share one report (2453/Choice Cuts) — without this it
// was fetched twice and the second timed out. Caches the in-flight promise so
// concurrent callers also share. (One run = fresh data; the process exits after.)
var _reportCache = new Map();

async function _doFetchReport(baseUrl, reportId, sectionRaw, auth, winField, days) {
  var d = days == null ? AMS_WINDOW_DAYS : days;
  var h = auth ? { Authorization: auth } : {};   // LMR is keyless → no header
  var win = d > 0 ? '?q=' + encodeURIComponent((winField || 'report_begin_date') + '=' + amsWindow(d)) : '';
  var base = baseUrl + reportId;
  var want = sectionRaw === '' ? '' : (sectionRaw || 'Report Details');
  async function get(section) {
    var path = section === '' ? '' : '/' + encodeURIComponent(section);
    try { return await fetchJson(base + path + win, { headers: h }); }
    catch (e) {
      if (win && /HTTP 4\d\d/.test(String(e && e.message))) return fetchJson(base + path, { headers: h });
      throw e;
    }
  }
  var j = await get(want);
  if (want && j && j.reportSection === 'Report Header' && want !== 'Report Header' && Array.isArray(j.reportSections)) {
    var sections = j.reportSections.filter(function (s) { return s && s !== 'Report Header'; });
    var detail = sections.find(function (s) { return /report detail/i.test(s); })
              || sections.find(function (s) { return /detail/i.test(s); })
              || sections[0];
    if (detail && detail !== want) j = await get(detail);
  }
  return j;
}

function fetchReport(baseUrl, reportId, sectionRaw, auth, winField, days) {
  var key = [baseUrl, reportId, sectionRaw == null ? '' : sectionRaw, winField || '', days == null ? '' : days].join('|');
  var hit = _reportCache.get(key);
  if (hit) return hit;                                  // reuse the in-flight or completed fetch
  var pr = _doFetchReport(baseUrl, reportId, sectionRaw, auth, winField, days)
    .catch(function (e) { _reportCache.delete(key); throw e; });   // a failed fetch shouldn't poison the cache
  _reportCache.set(key, pr);
  return pr;
}

// MARS report: keyed, windows on report_begin_date, section defaults to "Report Details".
function fetchAmsReport(reportId, sectionRaw, auth, days) {
  return fetchReport(MARS_BASE, reportId, sectionRaw, auth, 'report_begin_date', days);
}
// LMR Datamart report: keyless (auth optional), NO section by default (the
// Datamart returns results directly) — override with spec.section. Windows on
// report_date by DEFAULT, but NDPSR dairy reports (2993) date rows by
// week_ending_date and carry no report_date, so a report_date window returns 0
// rows — pass winField (the spec's dateField) to window on the real date column.
function fetchLmrReport(reportId, sectionRaw, auth, days, winField) {
  return fetchReport(LMR_BASE, reportId, sectionRaw == null ? '' : sectionRaw, auth, winField || 'report_date', days);
}

// NOAA Fisheries customs trade (FOSS ORDS, keyless). The host has moved before,
// and ORDS returns HTML without an Accept header — so try both hosts WITH the
// JSON Accept header, using the first that returns parseable JSON.
var NOAA_TRADE_HOSTS = [
  'https://apps-st.fisheries.noaa.gov/ods/foss/trade_data/',    // current — FOSS migrated /ords/ → /ods/ (cloud move)
  'https://apps-st.fisheries.noaa.gov/ords/foss/trade_data/',   // legacy fallbacks
  'https://www.st.nmfs.noaa.gov/ords/foss/trade_data/'
];
var NOAA_TRADE_BASE = NOAA_TRADE_HOSTS[0];

// NOAA import unit value: pull recent trade_data rows (ORDS JSON), scoped to the
// last `years` years, following ORDS pagination (items + hasMore) up to a cap.
// Returns { items:[...], _host } for normalizeNoaaTrade. Keyless. Cached per run.
async function fetchNoaaTrade(opts) {
  opts = opts || {};
  var years = opts.years || 2;
  var thisYear = new Date().getFullYear();
  var yearList = [];
  for (var y = 0; y < years; y++) yearList.push(String(thisYear - y));   // ['2026','2025'] — query each year
  var pageSize = opts.pageSize || 5000, cap = opts.maxRows || 50000;
  var hosts = opts.hosts || NOAA_TRADE_HOSTS;
  var headers = { Accept: 'application/json' };   // force JSON (ORDS serves HTML to header-less requests)
  var key = 'noaa-trade|' + yearList.join(',') + '|' + pageSize;
  if (_reportCache.has(key)) return _reportCache.get(key);
  var pr = (async function () {
    var lastErr;
    for (var hi = 0; hi < hosts.length; hi++) {
      try {
        var base = hosts[hi], items = [];
        for (var yi = 0; yi < yearList.length; yi++) {
          // EQUALITY filter per year — the Akamai WAF blocks the {"$gte":...}
          // operator (looks like an injection probe) but allows {"year":"2026"}.
          var q = '?q=' + encodeURIComponent(JSON.stringify({ year: yearList[yi] }));
          var offset = 0;
          for (var guard = 0; guard < 40 && items.length < cap; guard++) {
            var j = await fetchJson(base + q + '&limit=' + pageSize + '&offset=' + offset, { headers: headers });
            var page = (j && (j.items || j.results)) || [];
            items = items.concat(page);
            if (!j || j.hasMore !== true || page.length === 0) break;
            offset += page.length;
          }
        }
        return { items: items, _host: base };   // first host that returns parseable JSON wins
      } catch (e) { lastErr = e; }               // HTML/parse/network → try the next host
    }
    throw lastErr || new Error('NOAA trade_data: no host returned JSON');
  })().catch(function (e) { _reportCache.delete(key); throw e; });
  _reportCache.set(key, pr);
  return pr;
}

var EIA_BASE = 'https://api.eia.gov/v2/';   // EIA Open Data API v2 — needs EIA_KEY

// EIA v2 time series. spec: { route, facets:{sectorid,stateid,...}, frequency, value }.
// /data/ is the last node; data[]=<value>, facets[id][]=code, sort by period desc.
// Response value array at response.data[]. Cached per run.
async function fetchEia(spec) {
  spec = spec || {};
  var key = process.env.EIA_KEY;
  if (!key) throw new Error('no EIA_KEY');
  var route = String(spec.route || '').replace(/^\/+|\/+$/g, '');
  var valueCol = spec.value || 'value';
  var params = ['api_key=' + encodeURIComponent(key), 'frequency=' + (spec.frequency || 'monthly'),
    'data[]=' + encodeURIComponent(valueCol), 'sort[0][column]=period', 'sort[0][direction]=desc',
    'offset=0', 'length=' + (spec.length || 5000)];
  var facets = spec.facets || {};
  for (var f in facets) if (Object.prototype.hasOwnProperty.call(facets, f)) params.push('facets[' + f + '][]=' + encodeURIComponent(facets[f]));
  var url = EIA_BASE + route + '/data/?' + params.join('&');
  var cacheKey = 'eia|' + route + '|' + valueCol + '|' + JSON.stringify(facets) + '|' + (spec.frequency || 'monthly');
  if (_reportCache.has(cacheKey)) return _reportCache.get(cacheKey);
  var pr = fetchJson(url, { headers: { Accept: 'application/json' } }).catch(function (e) { _reportCache.delete(cacheKey); throw e; });
  _reportCache.set(cacheKey, pr);
  return pr;
}

/**
 * Bounded-concurrency map. Fans out up to `limit` at a time (per-host politeness
 * — all AMS terminals share one host) and ALWAYS settles every item: one
 * failure can't reject the batch (the cardinal rule — a dead market drops only
 * itself). Returns results in input order: { ok:true, value } | { ok:false, error }.
 */
async function mapLimit(items, limit, fn) {
  var out = new Array(items.length);
  var next = 0;
  var n = Math.max(1, Math.min(limit || 1, items.length));
  async function worker() {
    while (next < items.length) {
      var idx = next++;
      try { out[idx] = { ok: true, value: await fn(items[idx], idx) }; }
      catch (e) { out[idx] = { ok: false, error: e }; }
    }
  }
  var workers = [];
  for (var i = 0; i < n; i++) workers.push(worker());
  await Promise.all(workers);
  return out;
}

// Deep multi-year AMS fetch for the seasonal backfill. MARS truncates a single
// report_begin_date window (~180d), so a multi-year ask in ONE call returns a short
// or empty slice — which is exactly why the produce deep-history backfill came back
// nearly empty. Stitch fixed 150-day windows back `days` and MERGE their detail rows
// (the proven recipe from calibrate-pressure.fetchReportWindowed), kept here in the
// shared transport so the vendor's --history-out path gets full produce history on the
// SAME normalize path (no scale drift). Returns the report-JSON shape
// ({ results, reportSection }) so normalizeAms consumes it unchanged. Per-window
// failures are tolerated (one gap can't sink the series); fetchJson already retries 5xx.
async function fetchAmsReportDeep(reportId, sectionRaw, auth, days, winField) {
  winField = winField || 'report_begin_date';
  var h = auth ? { Authorization: auth } : {};
  var base = MARS_BASE + reportId;
  var f = function (d) { return ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2) + '/' + d.getFullYear(); };
  var rangeUrl = function (section, s, e) {
    var path = section === '' ? '' : '/' + encodeURIComponent(section);
    return base + path + '?q=' + encodeURIComponent(winField + '=' + f(s) + ':' + f(e));
  };
  var STEP = 150 * 864e5, now = Date.now();
  // Resolve the real detail section ONCE on the newest window (handles the
  // "Report Header" → detail correction), then reuse it for every window.
  var section = sectionRaw === '' ? '' : (sectionRaw || 'Report Details');
  try {
    var probe = await fetchJson(rangeUrl(section, new Date(now - STEP), new Date(now)), { headers: h });
    if (section && probe && probe.reportSection === 'Report Header' && Array.isArray(probe.reportSections)) {
      var secs = probe.reportSections.filter(function (s) { return s && s !== 'Report Header'; });
      var detail = secs.find(function (s) { return /report detail/i.test(s); }) || secs.find(function (s) { return /detail/i.test(s); }) || secs[0];
      if (detail) section = detail;
    }
  } catch (e) { /* probe failed → proceed; each window still tries the default section */ }
  var ranges = [];
  for (var end = now; end > now - days * 864e5; end -= STEP) ranges.push([new Date(end - STEP), new Date(end)]);
  var merged = [];
  for (var i = 0; i < ranges.length; i += AMS_CONCURRENCY) {
    var batch = ranges.slice(i, i + AMS_CONCURRENCY).map(function (r) {
      return fetchJson(rangeUrl(section, r[0], r[1]), { headers: h })
        .then(function (j) { return (j && j.results) || []; }, function () { return []; });   // tolerate a dead window
    });
    (await Promise.all(batch)).forEach(function (rows) { for (var k = 0; k < rows.length; k++) merged.push(rows[k]); });
  }
  return { results: merged, reportSection: section };
}

module.exports = {
  fetchJson: fetchJson,
  isTransient: isTransient,
  amsWindow: amsWindow,
  fetchAmsReport: fetchAmsReport,
  fetchAmsReportDeep: fetchAmsReportDeep,
  fetchLmrReport: fetchLmrReport,
  fetchNoaaTrade: fetchNoaaTrade,
  fetchEia: fetchEia,
  LMR_BASE: LMR_BASE,
  NOAA_TRADE_BASE: NOAA_TRADE_BASE,
  EIA_BASE: EIA_BASE,
  mapLimit: mapLimit,
  FETCH_TIMEOUT_MS: FETCH_TIMEOUT_MS,
  AMS_WINDOW_DAYS: AMS_WINDOW_DAYS,
  AMS_CONCURRENCY: AMS_CONCURRENCY,
};
