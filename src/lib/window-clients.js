// §8.4 — Window client roster (drives the admin-queue client/prospect SLA tag).
//
// WHY THIS LIVES UNDER src/ (and not data/): the build tars the repo into
// dist/ for static serving and EXCLUDES src/ (see wrangler.jsonc "build").
// Files in data/ ARE served publicly (the Worker even fetches
// /data/kpis.json over HTTP), so a client-email list there would be
// world-readable at muntin.digital/data/…. This module is bundled INTO the
// Worker instead, so the roster never leaves the server.
//
// HOW TO MAINTAIN: add a client's email below (one per line), commit, and
// `wrangler deploy`. Matching is case-insensitive and trims whitespace.
// An empty roster is the safe default — every identified thread reads as
// `prospect` and every anonymous thread as `cold`, i.e. single-tier 36h.
//
// PRIVACY NOTE: emails here are plaintext for ease of maintenance. They are
// only ever compared server-side; the admin queue stores the resulting tag
// (`client|prospect|cold`), never the email, on its index entry.

import { sha256Hex } from './auth.js';

// ── The roster. Edit this list. ──────────────────────────────────────────
export const WINDOW_CLIENT_EMAILS = [
  // 'owner@example-restaurant.com',
];

// Normalize an email the same way the sign-in path does before it hashes to
// a `sub` (worker.js mints `sub = sha256(email.trim().toLowerCase())`), so
// the sub-hash fallback below matches identified threads exactly.
export function normalizeClientEmail(e) {
  return String(e || '').trim().toLowerCase();
}

const EMAIL_SET = new Set(WINDOW_CLIENT_EMAILS.map(normalizeClientEmail).filter(Boolean));

// Pure tier logic — sync + testable. `cold` = no identity at all (anonymous,
// pre-claim). `client` = email on the roster. Everyone else identified is a
// `prospect`. Pass a custom rosterSet in tests.
export function classifyClientTier(emailLower, hasIdentity, rosterSet = EMAIL_SET) {
  if (!emailLower && !hasIdentity) return 'cold';
  if (emailLower && rosterSet && rosterSet.size && rosterSet.has(emailLower)) return 'client';
  return 'prospect';
}

// Lazily hash the roster once into a Set of `sub` values, memoized. Only the
// sub-hash fallback path needs this, so an empty roster never pays for it.
let _subSet = null;
async function clientSubSet() {
  if (_subSet) return _subSet;
  const s = new Set();
  for (const e of EMAIL_SET) s.add(await sha256Hex(e));
  _subSet = s;
  return s;
}

// Thread-level classifier used by upsertAdminIndex. Prefers the plaintext
// `email` stored on the thread; falls back to matching the thread's `sub`
// (= sha256 of the normalized email) when the email wasn't stored. Returns
// 'client' | 'prospect' | 'cold'.
export async function classifyThreadClientStatus(thread) {
  if (!thread) return 'cold';
  const emailLower = normalizeClientEmail(thread.email);
  const sub = typeof thread.sub === 'string' ? thread.sub : '';
  const hasIdentity = !!(emailLower || sub);
  let tier = classifyClientTier(emailLower, hasIdentity);
  // Identified thread with no stored email but a sub that hashes to a roster
  // address — promote to client.
  if (tier === 'prospect' && !emailLower && sub && EMAIL_SET.size) {
    if ((await clientSubSet()).has(sub)) tier = 'client';
  }
  return tier;
}
