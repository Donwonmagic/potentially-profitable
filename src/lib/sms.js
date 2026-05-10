// src/lib/sms.js
//
// Phase 2.5 (Window redesign) — Twilio SMS dispatcher for crisis
// tier-1 alerts. Don's number is stored as the Cloudflare secret
// WINDOW_CRISIS_SMS_TO; the Twilio creds are TWILIO_ACCOUNT_SID +
// TWILIO_AUTH_TOKEN + TWILIO_FROM. All four must be set or sendCrisisSms
// silently no-ops (the feature stays dark until secrets land).
//
// Rate-limited to 3 sends per hour to defeat SMS-DoS. Subsequent
// hits in the same hour bucket flow through to the admin red bar +
// pendingDon email digest only.
//
// Plan §11.6 + §2.6.

const SMS_RATE_KEY = 'window:sms-rate:hourly';
const SMS_RATE_MAX_PER_HOUR = 3;
const SMS_RATE_TTL_SEC = 60 * 60 * 2; // 2h — covers a single bucket plus rollover slack

// Compute the YYYY-MM-DDTHH UTC bucket. Hourly granularity so the
// counter resets every hour without us tracking the rollover by
// timestamp diff.
function hourBucket(ts) {
  const d = new Date(ts || Date.now());
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  return y + '-' + m + '-' + dd + 'T' + hh;
}

// Returns { ok, count } or { ok:false, error:'rate-limited', count }.
async function checkAndStampSmsRate(env) {
  const now = Date.now();
  const bucket = hourBucket(now);
  let row = { bucket, count: 0 };
  try {
    const raw = await env.AUTH_SESSIONS.get(SMS_RATE_KEY);
    if (raw) {
      try { row = JSON.parse(raw); } catch (_) { /* reset */ }
    }
  } catch (_) { /* if KV is down, fall through and try the send */ }
  if (row.bucket !== bucket) {
    row.bucket = bucket;
    row.count = 0;
  }
  if (row.count >= SMS_RATE_MAX_PER_HOUR) {
    return { ok: false, error: 'rate-limited', count: row.count };
  }
  row.count = (row.count || 0) + 1;
  try {
    await env.AUTH_SESSIONS.put(SMS_RATE_KEY, JSON.stringify(row), { expirationTtl: SMS_RATE_TTL_SEC });
  } catch (_) { /* best effort */ }
  return { ok: true, count: row.count };
}

// Dispatch an SMS via Twilio's Messages API. Returns
// { ok, sid? } on success or { ok:false, error, status? } on failure.
async function twilioSend(env, to, body) {
  const sid = env && env.TWILIO_ACCOUNT_SID;
  const token = env && env.TWILIO_AUTH_TOKEN;
  const from = env && env.TWILIO_FROM;
  if (!sid || !token || !from) {
    return { ok: false, error: 'twilio-not-configured' };
  }
  const auth = btoa(sid + ':' + token);
  const url = 'https://api.twilio.com/2010-04-01/Accounts/' + encodeURIComponent(sid) + '/Messages.json';
  const params = new URLSearchParams();
  params.set('To', to);
  params.set('From', from);
  params.set('Body', body);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': 'Basic ' + auth,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (err) {
    return { ok: false, error: 'twilio-fetch-failed', detail: err && err.message };
  }
  if (!res.ok) {
    let txt = '';
    try { txt = await res.text(); } catch (_) {}
    return { ok: false, error: 'twilio-rejected', status: res.status, body: txt.slice(0, 200) };
  }
  try {
    const j = await res.json();
    return { ok: true, sid: j.sid || null };
  } catch (_) {
    return { ok: true, sid: null };
  }
}

// Build the SMS body. Cap aggressively — Twilio splits at 160 chars
// for one segment; we want one message. Format:
//   "[Window/urgent] {senderLabel}: {first 80 chars of message body}..."
//
// Audit B1: GSM-7 only. The em-dash (U+2014) and the horizontal
// ellipsis (U+2026) force UCS-2 encoding, which drops the segment
// cap from 160 to 70 chars — every alert ships as 2 segments.
// Replaced with " : " and "..." (three dots) to stay in GSM-7.
function buildCrisisSmsBody(senderLabel, messageBody) {
  const label = String(senderLabel || 'visitor').slice(0, 16);
  const excerpt = String(messageBody || '').replace(/\s+/g, ' ').slice(0, 80);
  return '[Window/urgent] ' + label + ': ' + excerpt + (messageBody && messageBody.length > 80 ? '...' : '');
}

// Send a crisis tier-1 SMS to Don. Silent no-op if any secret is
// missing or the rate cap is hit. Plan §11.6.
//
//   senderLabel: short string for the SMS body — typically the anonId
//     prefix or sub prefix; never an email/phone (privacy + 160-char
//     budget).
//   messageBody: the operator's message; we'll truncate.
//
// Returns { ok, sid?, skipped?, error? } — `skipped` is set when the
// feature is dark (no secrets) or rate-limited; `error` is set on
// genuine Twilio failure.
//
// Audit B2: precheck ALL four secrets BEFORE incrementing the rate
// counter. Pre-fix, a partial config (e.g., WINDOW_CRISIS_SMS_TO set
// but TWILIO_* missing) burned 3 rate slots before any real SMS
// could land — the rate limiter then declined legitimate sends.
export async function sendCrisisSms(env, senderLabel, messageBody) {
  if (!env || !env.WINDOW_CRISIS_SMS_TO || !env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) {
    return { ok: false, skipped: 'sms-not-configured' };
  }
  const rate = await checkAndStampSmsRate(env);
  if (!rate.ok) {
    return { ok: false, skipped: 'sms-rate-limited', count: rate.count };
  }
  const body = buildCrisisSmsBody(senderLabel, messageBody);
  return twilioSend(env, env.WINDOW_CRISIS_SMS_TO, body);
}
