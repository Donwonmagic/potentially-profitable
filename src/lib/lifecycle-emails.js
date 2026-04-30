// Phase G.11 (Growth) — lifecycle email dispatcher.
//
// Reads sub:<hash> records from AUTH_SESSIONS and dispatches one of
// three lifecycle emails per state transition:
//
//   1. Welcome      first save while signed-in     +5 min
//   2. Nudge 7d     saved, never returned          T+7 days
//   3. Digest 30d   confirmed but no second save   T+30 days
//
// State stamps written to the sub record:
//   welcome_sent_at, nudge_7d_sent_at, digest_30d_sent_at,
//   lifecycle_quarter_count, lifecycle_quarter_resets_at
//
// Hard cap: 4 lifecycle emails per quarter per subscriber. The
// quarter rolls over via lifecycle_quarter_resets_at — a forward
// timestamp that, when crossed, resets the count to 0.
//
// Feature flag: env.LIFECYCLE_EMAILS_ENABLED must be the literal
// string "true" — defaults to off so the dispatcher can ship,
// pass tests, and only fire emails when Don explicitly opts in.

import {
  lifecycleWelcomeEmail,
  lifecycleSavedNoReturnEmail,
  lifecycleMonthlyDigestEmail,
} from './templates.js';
import { sendEmail } from './email.js';

const QUARTER_MS = 90 * 24 * 60 * 60 * 1000;
const FIVE_MIN_MS = 5 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_LIFECYCLE_EMAILS_PER_QUARTER = 4;

const PER_TICK_BUDGET = 100;

function isEnabled(env) {
  return env && env.LIFECYCLE_EMAILS_ENABLED === 'true';
}

function quarterCountUnderCap(sub, now) {
  const resetsAt = sub.lifecycle_quarter_resets_at || 0;
  if (now >= resetsAt) return 0;
  return sub.lifecycle_quarter_count || 0;
}

function tickQuarterCount(sub, now) {
  const resetsAt = sub.lifecycle_quarter_resets_at || 0;
  if (now >= resetsAt) {
    sub.lifecycle_quarter_count = 1;
    sub.lifecycle_quarter_resets_at = now + QUARTER_MS;
  } else {
    sub.lifecycle_quarter_count = (sub.lifecycle_quarter_count || 0) + 1;
  }
}

// Iterate all sub:<hash> rows. Skip sub-confirm:* (different prefix).
export async function* iterateAllSubscribers(env) {
  let cursor = null;
  while (true) {
    const opts = { prefix: 'sub:' };
    if (cursor) opts.cursor = cursor;
    const page = await env.AUTH_SESSIONS.list(opts);
    for (const k of page.keys) {
      // Defensive: list returns prefix matches; sub-confirm:* shares
      // a prefix only via the literal 'sub:' substring, but the KV
      // list filter is stricter than that. Still, double-check.
      if (!k.name.startsWith('sub:')) continue;
      if (k.name.startsWith('sub-confirm:')) continue;
      const raw = await env.AUTH_SESSIONS.get(k.name);
      if (!raw) continue;
      let sub;
      try { sub = JSON.parse(raw); } catch (_) { continue; }
      if (!sub) continue;
      yield { key: k.name, sub };
    }
    if (page.list_complete || !page.cursor) break;
    cursor = page.cursor;
  }
}

// Resolve a sender + base URL from env.
function dispatchContext(env) {
  const baseUrl = String(env.MAGIC_LINK_BASE_URL || 'https://muntin.digital').replace(/\/$/, '');
  const fromEmail = String(env.FROM_EMAIL || 'Don Goldstein <don@muntin.digital>');
  return { baseUrl, fromEmail };
}

function unsubUrlFor(baseUrl, subKey) {
  // sub:<hash> — the hash IS the unsubscribe token (stable per
  // subscriber, indistinguishable from a forged guess at scale).
  const hash = subKey.replace(/^sub:/, '');
  return `${baseUrl}/sub/unsubscribe?t=${hash}`;
}

function workshopUrlFor(baseUrl, locale) {
  return `${baseUrl}${locale === 'es' ? '/es' : ''}/workbench/`;
}

function windowUrlFor(baseUrl, locale) {
  return `${baseUrl}${locale === 'es' ? '/es' : ''}/window/`;
}

async function sendLifecycle(env, ctx, key, sub, tpl) {
  const { fromEmail } = ctx;
  const sendRes = await sendEmail({
    from: fromEmail,
    to: sub.email,
    replyTo: 'don@muntin.digital',
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  }, env.RESEND_API_KEY);
  if (sendRes && sendRes.ok) return true;
  console.warn('[lifecycle] send failed', { key, error: sendRes && sendRes.error });
  return false;
}

async function processOne(env, ctx, now, key, sub) {
  if (sub.status !== 'active') return false;
  if (sub.unsubscribedAt) return false;
  if (quarterCountUnderCap(sub, now) >= MAX_LIFECYCLE_EMAILS_PER_QUARTER) return false;

  const { baseUrl } = ctx;
  const locale = sub.locale === 'es' ? 'es' : 'en';
  const unsubUrl = unsubUrlFor(baseUrl, key);

  // Welcome — fired when last_save_at is set, welcome_sent_at is not,
  // and at least 5 min have passed since the save.
  if (sub.last_save_at && !sub.welcome_sent_at && now - sub.last_save_at >= FIVE_MIN_MS) {
    const tpl = lifecycleWelcomeEmail({
      locale,
      workshopUrl: workshopUrlFor(baseUrl, locale),
      unsubUrl,
    });
    if (await sendLifecycle(env, ctx, key, sub, tpl)) {
      sub.welcome_sent_at = now;
      tickQuarterCount(sub, now);
      await env.AUTH_SESSIONS.put(key, JSON.stringify(sub));
      return true;
    }
    return false;
  }

  // Saved-never-returned nudge — last_save_at + 7d, no return signal.
  // We use last_save_at as a stand-in for "last activity" in this v1;
  // a future last_active_at field would be more precise.
  if (sub.last_save_at && !sub.nudge_7d_sent_at && sub.welcome_sent_at && now - sub.last_save_at >= SEVEN_DAYS_MS) {
    const tpl = lifecycleSavedNoReturnEmail({
      locale,
      windowUrl: windowUrlFor(baseUrl, locale),
      unsubUrl,
      savedKind: sub.last_save_kind || (locale === 'es' ? 'auditoría' : 'audit'),
    });
    if (await sendLifecycle(env, ctx, key, sub, tpl)) {
      sub.nudge_7d_sent_at = now;
      tickQuarterCount(sub, now);
      await env.AUTH_SESSIONS.put(key, JSON.stringify(sub));
      return true;
    }
    return false;
  }

  // Monthly digest — confirmedAt + 30d, no second save signal.
  if (sub.confirmedAt && !sub.digest_30d_sent_at && now - sub.confirmedAt >= THIRTY_DAYS_MS) {
    // For v1, the digest items list is supplied by the caller (cron
    // tick passes the latest blog post + glossary term + tool from
    // RSS). When ctx.digestItems is empty, skip — empty digest is
    // worse than no digest.
    if (!Array.isArray(ctx.digestItems) || ctx.digestItems.length === 0) return false;
    const tpl = lifecycleMonthlyDigestEmail({
      locale,
      items: ctx.digestItems,
      unsubUrl,
    });
    if (await sendLifecycle(env, ctx, key, sub, tpl)) {
      sub.digest_30d_sent_at = now;
      tickQuarterCount(sub, now);
      await env.AUTH_SESSIONS.put(key, JSON.stringify(sub));
      return true;
    }
    return false;
  }

  return false;
}

// Public entry: iterate all subscribers, dispatch state-machine
// transitions. Bounded by PER_TICK_BUDGET. Returns a tally for
// the cron caller's logs.
export async function dispatchLifecycleEmails(env, opts = {}) {
  if (!isEnabled(env)) return { skipped: 'flag-off' };
  if (!env.AUTH_SESSIONS || !env.RESEND_API_KEY) return { skipped: 'bindings-missing' };

  const ctx = dispatchContext(env);
  ctx.digestItems = Array.isArray(opts.digestItems) ? opts.digestItems : [];
  const now = Date.now();
  let attempted = 0, fired = 0;

  for await (const { key, sub } of iterateAllSubscribers(env)) {
    if (attempted >= PER_TICK_BUDGET) break;
    attempted++;
    try {
      if (await processOne(env, ctx, now, key, sub)) fired++;
    } catch (err) {
      console.warn('[lifecycle] processOne failed', err && err.message);
    }
  }
  return { attempted, fired };
}
