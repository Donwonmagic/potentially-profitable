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
// LMR Datamart report: keyless (auth optional), windows on report_date, NO section
// by default (the Datamart returns results directly) — override with spec.section.
function fetchLmrReport(reportId, sectionRaw, auth, days) {
  return fetchReport(LMR_BASE, reportId, sectionRaw == null ? '' : sectionRaw, auth, 'report_date', days);
}

// NOAA Fisheries customs trade (FOSS ORDS, keyless). The host has moved before,
// and ORDS returns HTML without an Accept header — so try both hosts WITH the
// JSON Accept header, using the first that returns parseable JSON.
var NOAA_TRADE_HOSTS = [
  'https://apps-st.fisheries.noaa.gov/ords/foss/trade_data/',
  'https://www.st.nmfs.noaa.gov/ords/foss/trade_data/'
];
var NOAA_TRADE_BASE = NOAA_TRADE_HOSTS[0];

// NOAA import unit value: pull recent trade_data rows (ORDS JSON), scoped to the
// last `years` years, following ORDS pagination (items + hasMore) up to a cap.
// Returns { items:[...], _host } for normalizeNoaaTrade. Keyless. Cached per run.
async function fetchNoaaTrade(opts) {
  opts = opts || {};
  var years = opts.years || 2;
  var fromYear = (new Date().getFullYear()) - (years - 1);
  var q = encodeURIComponent(JSON.stringify({ year: { '$gte': fromYear } }));   // ORDS filter
  var pageSize = opts.pageSize || 5000, cap = opts.maxRows || 50000;
  var hosts = opts.hosts || NOAA_TRADE_HOSTS;
  var headers = { Accept: 'application/json' };   // force JSON (ORDS serves HTML to header-less requests)
  var key = 'noaa-trade|' + fromYear + '|' + pageSize;
  if (_reportCache.has(key)) return _reportCache.get(key);
  var pr = (async function () {
    var lastErr;
    for (var hi = 0; hi < hosts.length; hi++) {
      try {
        var base = hosts[hi], items = [], offset = 0;
        for (var guard = 0; guard < 40; guard++) {
          var url = base + '?q=' + q + '&limit=' + pageSize + '&offset=' + offset;
          var j = await fetchJson(url, { headers: headers });   // throws on HTML (json parse) → next host
          var page = (j && (j.items || j.results)) || [];
          items = items.concat(page);
          if (!j || j.hasMore !== true || page.length === 0 || items.length >= cap) break;
          offset += page.length;
        }
        return { items: items, _host: base };   // first host that returns parseable JSON wins
      } catch (e) { lastErr = e; }               // HTML/parse/network → try the next host
    }
    throw lastErr || new Error('NOAA trade_data: no host returned JSON');
  })().catch(function (e) { _reportCache.delete(key); throw e; });
  _reportCache.set(key, pr);
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

module.exports = {
  fetchJson: fetchJson,
  isTransient: isTransient,
  amsWindow: amsWindow,
  fetchAmsReport: fetchAmsReport,
  fetchLmrReport: fetchLmrReport,
  fetchNoaaTrade: fetchNoaaTrade,
  LMR_BASE: LMR_BASE,
  NOAA_TRADE_BASE: NOAA_TRADE_BASE,
  mapLimit: mapLimit,
  FETCH_TIMEOUT_MS: FETCH_TIMEOUT_MS,
  AMS_WINDOW_DAYS: AMS_WINDOW_DAYS,
  AMS_CONCURRENCY: AMS_CONCURRENCY,
};
