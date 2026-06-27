// ============================================================
// muntin.digital — Cloudflare Worker entry point
// ============================================================
//
// This Worker serves the static site (via env.ASSETS) AND handles
// a small set of /api/* routes for form submissions. The Workers
// Static Assets platform lets a single Worker do both:
//
//   1. Request comes in
//   2. This fetch handler runs first
//   3. If the path is /api/*, we route it to a form handler
//   4. Otherwise, we pass the request through to env.ASSETS.fetch()
//      which serves the corresponding file from /dist
//
// Before Sprint 7 the site had no Worker script at all — wrangler
// just uploaded the static assets. Sprint 7 added this script so we
// can replace the three Formspree endpoints (new-project intake,
// restaurant-website-checklist PDF request, and audit-report-email)
// with self-hosted form handlers that cost zero and give us
// automated responses without the Formspree subscription.
//
// Sprint 7 progression:
//
//   7a  — Scaffold + routing. /api/* returns stub 501 responses.
//   7b  — Email library + templates (pure library, not wired).
//   7c (THIS SPRINT) — Handlers wired. Each endpoint validates the
//        body, checks the honeypot, builds notification + auto-
//        responder emails from templates.js, and sends both via
//        sendEmail() in parallel. Partial failures are surfaced:
//        notification failure = 500 back to user (their message
//        didn't get through); notification ok but auto-responder
//        failure = 200 to user + console.error for us.
//   7d  — Deployment guide + HTML form cutover (Formspree retirement)
//
// Handlers are STILL not called by the production forms — those
// still post to Formspree. Sprint 7d cuts them over. Until then
// /api/* is only reachable by curl or a manual test.

import { sendEmail } from './lib/email.js';
import {
  isValidEmail,
  isSpamHoneypot,
  requireFields,
  enforceMaxLengths,
  assertSafeHttpUrl,
  pickLang,
  isOriginAllowed,
  isHighThreatIP,
  isTimestampSane,
  classifySpam,
} from './lib/validation.js';
import { withAuditCache } from './lib/audit-cache.js';
import { checkTurnstile } from './lib/turnstile.js';
import { createRateLimiter, clientIpFromRequest } from './lib/rate-limit.js';
import { RateLimiter, checkDurableRateLimit } from './lib/rate-limiter-do.js';
import { saveSnapshot, getSnapshot, getSnapshotOg, isValidTokenShape } from './lib/audit-snapshots.js';
// Phase G.11 (Growth) — generalized share-snapshot store.
import { SHARE_KINDS, saveShareSnapshot, getShareSnapshot, isValidShareKind, isValidShareTokenShape } from './lib/share-snapshots.js';
// Phase G.11 (Growth) — lifecycle email dispatcher (cron-driven).
import { dispatchLifecycleEmails, iterateAllSubscribers } from './lib/lifecycle-emails.js';
import {
  mintMagicLinkToken,
  mintSessionToken,
  isValidMagicLinkTokenShape,
  signSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
  sha256Hex,
  MAGIC_LINK_TTL_SECONDS,
  SESSION_TTL_SECONDS,
} from './lib/auth.js';
import {
  validateSaveBody,
  saveItem,
  listItemsForUser,
  getItem,
  deleteItem,
  isValidSaveItemIdShape,
  MAX_SAVES_PER_USER,
  attachWatch,
  listWatchesForUser,
  detachWatch,
  iterateAllWatches,
  ALLOWED_SCHEDULES,
  WATCHABLE_KINDS,
  MAX_WATCHES_PER_USER,
  recordWatchCheck,
  markWatchStalled,
  STALL_THRESHOLD,
  // Phase C.1 (Storefront Health) — property helpers.
  createProperty,
  getProperty,
  listPropertiesForUser,
  attachCheckToProperty,
  detachCheckFromProperty,
  rollupProperty,
  deleteProperty,
  iterateAllProperties,
  MAX_PROPERTIES_PER_USER,
  PROPERTY_CHECK_KINDS,
} from './lib/workbench.js';
import { RECHECK_BY_KIND, kindLabel, shouldNotify } from './lib/watch-checks.js';

// Durable Object classes must be re-exported from the Worker entry
// module so the runtime can instantiate them when the binding fires.
// Leaving this export in place when the binding is still commented in
// wrangler.jsonc is harmless — the class is defined but never
// instantiated.
export { RateLimiter };

// Compute the X-Audit-Cache header value from a withAuditCache result.
// Three states: 'hit' (fresh, within TTL), 'stale-fallback' (upstream
// errored, served a cached value between TTL and 2× TTL), 'miss'
// (fresh upstream fetch). Owners can see which they got via devtools
// and the UI can surface stale-fallback as a disclosure.
function auditCacheHeader(cached) {
  if (!cached) return 'miss';
  if (cached.staleFallback) return 'stale-fallback';
  return cached.cacheHit ? 'hit' : 'miss';
}

// Per-isolate rate limiter. 30 requests per IP per 60 s — generous
// enough that a real owner re-auditing after every fix never hits it,
// tight enough to blunt the common "one IP, many URLs" burst attack
// that would otherwise exhaust PSI / Places / Resend / LLM quotas.
// See src/lib/rate-limit.js for the full scope discussion.
const API_RATE_LIMITER = createRateLimiter({ windowMs: 60_000, max: 30 });

// Form / email endpoints have a tighter budget because each POST
// triggers up to two Resend emails (free tier: 100/day).
const FORM_RATE_LIMITER = createRateLimiter({ windowMs: 3600_000, max: 10 });

const FORM_RATE_LIMIT_PATHS = new Set([
  '/api/intake',
  '/api/checklist',
  '/api/audit-report',
  '/api/schedule-reaudit',
  // Sprint 0 (Workshop) — magic-link sign-in. Form-tier (10/IP/hour)
  // is the right gate: each POST triggers a Resend email and a KV
  // write.
  '/api/auth/magic-link',
  // Bug B2.2 (proactive audit) — magic-link verify. Tokens are
  // 10-character random strings (~49 bits entropy) with 15-min TTL
  // and one-shot consumption, so brute-force is impractical at any
  // tier. Form-tier (10/IP/hour) is defense-in-depth: caps how
  // often a single IP can probe verify endpoints (e.g., to enumerate
  // session token shapes against rate-limit logs).
  '/api/auth/verify',
  '/api/auth/signout',
  // Phase 3 — destructive: form-tier rate-limit (10/IP/hour). Each
  // POST mints a delete: token + sends an email; confirm side stays
  // on the lighter tier since GETs are idempotent.
  '/api/auth/account-delete-request',
  // Phase C.2 (Storefront Health) — property writes. Each create
  // can synchronously fan out to up to 6 child tool runs, so a
  // tighter cap than the api-tier (30/min) is appropriate. Reads
  // (list/get/rollup) stay on api-tier.
  '/api/workbench/property/create',
  '/api/workbench/property/delete',
  '/api/workbench/property/attach',
  '/api/workbench/property/detach',
  // Phase F.3 (Field Notes) — write paths. Each create triggers an
  // email to NOTIFY_EMAIL; each decide triggers an email to the
  // contributor on approve. Form-tier (10/IP/hour) caps abuse.
  '/api/submission/create',
  '/api/submission/withdraw',
  '/api/admin/submissions/decide',
  '/api/admin/submissions/publish-data',
  // Phase W.1 (The Window) — write paths.
  '/api/window/append',
  '/api/admin/window/reply',
  '/api/admin/window/draft',
  '/api/admin/window/close',
  '/api/admin/window/archive',
  // Phase course — bootcamp progress + config sync. Both POSTs touch
  // KV per call; form-tier (10/IP/hour) keeps a misbehaving client
  // (or open-tab background sync loop) from hammering. /reset is
  // destructive — same tier.
  '/api/course/progress',
  '/api/course/config',
  '/api/course/reset',
  // 2026-06-15 (Muntin Ledger pre-launch) — founding-member waitlist.
  // Each POST triggers an upstream call to api.muntin.digital, so the
  // tighter form-tier (10/IP/hour) is the right gate.
  '/api/waitlist',
]);
// D1: /api/audit-snapshot intentionally stays on the lighter
// api-tier (30/min/IP) — a legit shared link might be opened by
// half a dozen collaborators from one office NAT, and legitimate
// POSTs only fire when an owner clicks "share" (once per session).
import {
  intakeNotification,
  intakeAutoResponder,
  checklistNotification,
  checklistAutoResponder,
  auditReportNotification,
  auditReportAutoResponder,
  auditDeepReportNotification,
  auditDeepReportAutoResponder,
  reauditReminder,
  magicLinkEmail,
  accountDeleteEmail,
  watchDiffEmail,
  // Phase F.3 (Field Notes) — submission notification + approval emails.
  submissionNotificationEmail,
  submissionApprovedEmail,
  // Phase W.2 (The Window) — notify-Don batch, reply-to-user, confirmation.
  windowNotifyDonEmail,
  windowReplyToUserEmail,
  windowConfirmationEmail,
  // Phase G.10 (Growth) — newsletter double-opt confirmation email.
  subscriberConfirmEmail,
  // Weekly Cost Index broadcast email.
  costIndexWeeklyEmail,
} from './lib/templates.js';
import {
  // Phase F.3 (Field Notes) — server-side submission storage + validation.
  validateSubmissionBody,
  mintSubmissionId,
  submissionKey,
  approvedFieldnoteKey,
  decisionKey,
  listSubmissionsForUser,
  countSubmissionsForArticle,
  getSubmission,
  iterateAllSubmissions,
  iterateAllApprovedFieldnotes,
  ipHash as submissionIpHash,
  MAX_SUBMISSIONS_PER_USER,
  MAX_SUBMISSIONS_PER_USER_PER_ARTICLE,
  REJECTED_TTL_SEC,
  STALL_AGE_MS,
  SUBMISSION_KEY_PREFIX,
} from './lib/submissions.js';
import { ARTICLE_SLUGS } from './lib/article-slugs.generated.js';
import {
  // Phase course — Open the Doors bootcamp per-user progress + config sync.
  // Anonymous-first; signed-in operators get cross-device sync of
  // course:<sub> (progress) and course-config:<sub> (normalized
  // generator config snapshot). Both live in env.AUTH_SESSIONS
  // alongside the rest of the workbench surface.
  readProgress as readCourseProgress,
  mergeProgress as mergeCourseProgress,
  resetProgress as resetCourseProgress,
  readConfig as readCourseConfig,
  writeConfig as writeCourseConfig,
} from './lib/course.js';
import {
  // Phase W.1 (The Window) — direct-line correspondence storage.
  validateMessageBody as validateWindowMessageBody,
  normalizeWindowSource,
  getOpenThreadForUser,
  getThreadById,
  listThreadMessages,
  createThread as createWindowThread,
  appendMessageToThread,
  iterateAdminQueue,
  upsertAdminIndex as upsertWindowAdminIndex,
  dayBucket as windowDayBucket,
  computeAutoPauseLevel,
  AUTOPAUSE_STALE_HOURS,
  MAX_NEW_THREADS_PER_DAY,
  newThreadsDayKey,
  checkAndStampThrottle as checkAndStampWindowThrottle,
  pushPendingDon,
  iteratePendingDonReady,
  msgKey as windowMsgKey,
  setActiveMeta as setWindowActiveMeta,
  getActiveMeta as getWindowActiveMeta,
  // Phase 4 — /now/ operator presence widget.
  getNowMeta as getWindowNowMeta,
  setNowMeta as setWindowNowMeta,
  resolveNowForVisitor,
  threadKey as windowThreadKey,
  // Phase 1a (Window redesign) — anonymous-first send.
  mintAnonId,
  anonThreadKey as windowAnonThreadKey,
  getOpenThreadForAnon,
  createAnonThread,
  appendMessageToAnonThread,
  checkAndStampAnonThrottle,
  checkAndStampIpThrottle,
  hashIp,
  // Phase 1a step 2 — magic-link claim flow.
  setAnonThreadEmail,
  migrateAnonThread,
  checkAndStampEmailAttachThrottle,
  // Phase 1b — PII pre-write gate + crisis keyword scan.
  detectLikelyPII,
  detectCrisisTier,
  // Phase 2.6 — email-bounce ledger.
  isEmailBounced,
  recordEmailBounce,
  // Phase 3.1 — multimodal attachment caps.
  MAX_ATTACHMENTS_PER_MSG,
  MAX_PHOTO_SIZE_BYTES,
} from './lib/window.js';
import {
  // Phase 3.2 — photo upload + EXIF strip + attachment KV.
  mintAttachId,
  attachKey as windowAttachKey,
  getAttachmentRow,
  createAttachmentRow,
  checkAttachmentLifetime,
  stampAttachmentLifetime,
  stripImageExif,
  r2Key as windowR2Key,
  r2TtlSeconds,
  // Phase 3.3 — voice memo + Whisper transcript.
  markForTranscript,
  unmarkTranscript,
  iterateTranscriptQueue,
  transcribeVoice,
  setAttachmentTranscript,
  checkVoiceDailyCap,
  stampVoiceDaily,
  // Phase 3.4 — async voicenote callback shim.
  normalizePhone,
  maskPhone,
  getCallbackSlotLabel,
  createCallbackRequest,
  // Phase 3.5 — visitor-side attachment display + delete-transcript.
  listAttachmentsForThread,
  // Phase 3.6 — voice hard-delete (replaces transcript-only soft-delete).
  deleteVoiceAttachment,
  // Phase 3.6b — admin attachment display.
  listCallbacksForThread,
} from './lib/window-attachments.js';
import { MAX_VOICE_DURATION_HARD_MS } from './lib/window.js';
import { sanitizePlaintext as sanitizeWindowBody } from './lib/submissions.js';
import { sendCrisisSms } from './lib/sms.js';
import { lookupBlogLibraryRedirect } from './lib/blog-library-redirects.js';
import { lookupToolRedirect } from './lib/tool-redirects.js';


// ------------------------------------------------------------
// API route table
// ------------------------------------------------------------

const API_ROUTES = {
  '/api/intake':        handleIntake,
  '/api/checklist':     handleChecklist,
  '/api/audit-report':  handleAuditReport,
  '/api/audit-snapshot': handleAuditSnapshot,
  '/api/og-snapshot':    handleOgSnapshot,
  '/api/ping':          handlePing,
  '/api/gbp-lookup':    handleGbpLookup,
  '/api/seo-check':     handleSeoCheck,
  '/api/schema-check':  handleSchemaCheck,
  '/api/page-crawl':    handlePageCrawl,
  '/api/psi':           handlePsi,
  '/api/did-you-mean':  handleDidYouMean,
  '/api/observatory':   handleObservatory,
  '/api/wayback-first-seen': handleWaybackFirstSeen,
  '/api/crux-history':  handleCruxHistory,
  '/api/gbp-details':   handleGbpDetails,
  '/api/brand-dossier': handleBrandDossier,
  '/api/dns-email-health': handleDnsEmailHealth,
  '/api/schedule-reaudit': handleScheduleReaudit,
  // Sprint 0 (Workshop) — magic-link auth. Wired but private:
  // there is no public sign-in page or nav link in this sprint. The
  // /workbench/ gate (below) is the only thing that consumes a
  // verified session. Phase 2 will turn on the public surface.
  '/api/auth/magic-link': handleAuthMagicLink,
  '/api/auth/verify':     handleAuthVerify,
  '/api/auth/me':         handleAuthMe,
  '/api/auth/signout':    handleAuthSignout,
  // Phase 3 (Workshop) — destructive-action two-step:
  //   request: typed-email confirm → mint delete:<TOKEN10> → email
  //   confirm: GET clicked from email → wipe user + saves + watches
  '/api/auth/account-delete-request': handleAuthAccountDeleteRequest,
  '/api/auth/account-delete-confirm': handleAuthAccountDeleteConfirm,
  // Phase 2 (Workshop) — saved-items library. All four require a
  // valid session; anonymous calls return 401. Per-user scoping at
  // the KV-key level (save:<sub>:...) means a missing IDOR check
  // can't leak items across users.
  '/api/workbench/save':   handleWorkbenchSave,
  '/api/workbench/list':   handleWorkbenchList,
  '/api/workbench/sheet-history': handleWorkbenchSheetHistory,
  '/api/workbench/get':    handleWorkbenchGet,
  '/api/workbench/delete': handleWorkbenchDelete,
  // Phase 3 (Workshop) — Watch scaffolding. Endpoints are live now
  // so the UI can let an operator opt in / out, but the cron that
  // actually re-runs the underlying check is commented out in
  // wrangler.jsonc until ops is ready to flip it on. Until then
  // attaching a watch persists the intent without consuming any
  // upstream API quota.
  '/api/workbench/watch':         handleWorkbenchWatchAttach,
  '/api/workbench/watch-list':    handleWorkbenchWatchList,
  '/api/workbench/watch-delete':  handleWorkbenchWatchDelete,
  // Phase C.2 (Storefront Health) — property endpoints. All flag-
  // gated via env.STOREFRONT_HEALTH_ENABLED — return 404 when
  // disabled so the surface is invisible until C.5 flips the flag.
  '/api/workbench/property/create':  handleWorkbenchPropertyCreate,
  '/api/workbench/property/list':    handleWorkbenchPropertyList,
  '/api/workbench/property/get':     handleWorkbenchPropertyGet,
  '/api/workbench/property/delete':  handleWorkbenchPropertyDelete,
  '/api/workbench/property/attach':  handleWorkbenchPropertyAttach,
  '/api/workbench/property/detach':  handleWorkbenchPropertyDetach,
  '/api/workbench/property/rollup':  handleWorkbenchPropertyRollup,
  // Phase F.3 (Field Notes) — submission lifecycle. All flag-gated
  // via env.FIELD_NOTES_ENABLED — return 404 when disabled so the
  // surface is invisible until F.6 flips the flag.
  '/api/submission/create':          handleSubmissionCreate,
  '/api/submission/list-mine':       handleSubmissionListMine,
  '/api/submission/withdraw':        handleSubmissionWithdraw,
  '/api/admin/submissions/list':     handleAdminSubmissionsList,
  '/api/admin/submissions/decide':   handleAdminSubmissionsDecide,
  '/api/admin/submissions/publish-data': handleAdminSubmissionsPublishData,
  // Phase W.1 (The Window) — direct-line correspondence. All gated
  // via env.WINDOW_ENABLED — return 404 when disabled.
  '/api/window/start':               handleWindowStart,
  '/api/window/append':              handleWindowAppend,
  '/api/window/thread':              handleWindowThread,
  '/api/window/poll':                handleWindowPoll,
  '/api/window/active':              handleWindowActive,
  '/api/window/turnstile-state':     handleWindowTurnstileState,
  '/api/window/me-unread':           handleWindowMeUnread,
  // Phase 1a step 2 — operator attaches an email to their anon
  // thread so Don's reply email + claim-magic-link can find them.
  '/api/window/email':               handleWindowEmail,
  // Phase course — Open the Doors bootcamp progress + config sync.
  // All five require a valid session; anonymous calls return 401
  // (anonymous operators get the same UX from localStorage). The
  // five-route surface lets the client poll-and-merge progress
  // independently of the heavier config snapshot.
  '/api/course/progress':            handleCourseProgress,
  '/api/course/config':              handleCourseConfig,
  '/api/course/reset':               handleCourseReset,
  // Phase 2.6 — Resend webhook for email-bounce events.
  '/api/webhook/resend-bounce':      handleResendBounceWebhook,
  // Phase 3.2 — multimodal photo upload (POST). Download path
  // (/api/window/attach/<id>) is dispatched separately from the
  // path-prefix handler above the exact-match table because of
  // the dynamic id segment.
  '/api/window/attach':              handleWindowAttachUpload,
  // Phase 3.4 — async voicenote callback shim. Operator submits
  // phone + window slot (+ optional voice memo attachId); worker
  // records the request and posts an auto-confirmation thread
  // message from "Don" so the visitor sees acknowledgement.
  '/api/window/callback':            handleWindowCallback,
  // Phase 3.6 — visitor-deletable voice attachment. Hard-deletes the
  // R2 object + tombstones the KV row (deleted:true, deletedAt).
  // BIPA-aligned with plan §2.9 + §11.6 — operator clicks Delete
  // and the audio + transcript both vanish immediately. The legacy
  // path /api/window/attach/transcript-delete is mapped to the same
  // handler but the handler returns 410 + "refresh" hint (audit
  // Section 4 MED — Phase 3.5 client's confirm dialog promised
  // audio retention; the handler now hard-deletes, so refusing the
  // legacy path is the only honest response).
  '/api/window/attach/voice-delete':       handleWindowAttachVoiceDelete,
  '/api/window/attach/transcript-delete':  handleWindowAttachVoiceDelete,
  '/api/admin/window/list':          handleAdminWindowList,
  '/api/admin/window/thread':        handleAdminWindowThread,
  '/api/admin/window/reply':         handleAdminWindowReply,
  '/api/admin/window/draft':         handleAdminWindowDraft,
  '/api/admin/window/close':         handleAdminWindowClose,
  '/api/admin/window/archive':       handleAdminWindowArchive,
  // Phase 4 — /now/ operator presence widget. Public GET returns
  // the privacy-resolved view (post-blackout-downgrade, post-
  // staleness check). Admin GET returns the raw row; admin POST
  // writes a new row. Plan §4.4 + §11.4.
  '/api/window/now':                 handleWindowNow,
  '/api/admin/window/now':           handleAdminWindowNow,
  // Phase G.10 (Growth) — newsletter subscription + double-opt confirm.
  '/api/subscribe':                  handleSubscribe,
  // Pre-launch (Muntin Ledger) — founding-member waitlist. First-party
  // proxy: forwards server-to-server to api.muntin.digital; the product
  // owns storage + the confirmation email. Auto-gated POST-only below.
  '/api/waitlist':                   handleWaitlist,
  // Weekly Cost Index broadcast — secret-gated, called by the publish Action.
  '/api/admin/cost-index-broadcast': handleCostIndexBroadcast,
  // Phase 3B — Plausible analytics events proxy. Self-hosted tracker
  // at /assets/p.js posts here; we forward to plausible.io with the
  // visitor's CF-Connecting-IP so analytics see the right client IP
  // instead of every request originating from the worker. Lets us
  // drop plausible.io from CSP connect-src.
  '/api/event':                      handlePlausibleEvent,
  '/sub/confirm':                    handleSubscribeConfirm,
  '/sub/unsubscribe':                handleSubscribeUnsubscribe,
  // Phase G.11 (Growth) — generalized share-snapshot endpoints.
  '/api/share/tool-result':          handleShareToolResult,
  '/api/share/storefront-health':    handleShareStorefrontHealth,
  '/api/share/get':                  handleShareGet,
  '/api/share/og':                   handleShareOg,
  // Phase G.12 (Growth) — admin KPI dashboard data endpoint.
  '/api/admin/kpis':                 handleAdminKpis,
  // Phase G.10 (Growth) — Workshop nav count badge endpoint.
  '/api/workbench/count':            handleWorkbenchCount,
};


// ------------------------------------------------------------
// Worker entry point
// ------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Phase 7 — /blog/<slug>/ → /library/<slug>/ permanent redirects.
    // Lives in code (not _redirects) because Cloudflare Workers Static
    // Assets caps _redirects at 100 rules and the 53 entries here used
    // to push the file over the limit (deploy error 100324). The Map
    // lookup is O(1) and only fires for GET requests against the
    // /blog/ and /es/blog/ namespaces, so the cost is negligible.
    if (request.method === 'GET' && (pathname.startsWith('/blog/') || pathname.startsWith('/es/blog/'))) {
      const target = lookupBlogLibraryRedirect(pathname);
      if (target) {
        const location = target + url.search;
        return new Response(null, { status: 301, headers: { location } });
      }
    }

    // 2026-06-26 tools migration — retired-tool 301s. Lives in code
    // (src/lib/tool-redirects.js) rather than /_redirects because that
    // file is at Cloudflare's 100-rule cap. Prefix match covers the tool
    // root and every sub-path/asset, so no per-asset wildcard rules are
    // needed. Fires only for GET against the /tools/ namespaces.
    if (request.method === 'GET' && (pathname.startsWith('/tools/') || pathname.startsWith('/es/tools/'))) {
      const target = lookupToolRedirect(pathname);
      if (target) {
        const location = target + url.search;
        return new Response(null, { status: 301, headers: { location } });
      }
    }

    // 2026-06-26 tools migration — the retired /start/ 30-second triage
    // (and its ES twin) now lead into the Cost Index, the funnel's front
    // door. Prefix match covers any sub-path. In code for the same
    // _redirects-cap reason as the tool redirects above.
    if (request.method === 'GET') {
      if (pathname === '/start' || pathname === '/start/' || pathname.startsWith('/start/')) {
        return new Response(null, { status: 301, headers: { location: '/cost-index/' + url.search } });
      }
      if (pathname === '/es/start' || pathname === '/es/start/' || pathname.startsWith('/es/start/')) {
        return new Response(null, { status: 301, headers: { location: '/es/cost-index/' + url.search } });
      }
    }

    // Sprint D3: embeddable SVG audit badge. Handled outside the
    // /api/* routing because it serves an SVG (not JSON) and is
    // meant to be dropped into an <img src=...> on a restaurant's
    // own website.
    if (pathname === '/badge/restaurant') {
      return handleBadgeRestaurant(request, env, ctx);
    }
    if (pathname === '/api/badge-snapshot') {
      return handleBadgeSnapshot(request, env, ctx);
    }

    // Phase G.11 — /api/share/og/<token>(.png) prefix route. Routes
    // through handleShareOg which does its own slug parsing.
    if (request.method === 'GET' && pathname.startsWith('/api/share/og/')) {
      return handleShareOg(request, env, ctx);
    }

    // Phase 3.2 — attachment download proxy. Dynamic id segment, so
    // dispatched before the exact-match table. Path:
    //   GET /api/window/attach/<attachId>
    // Phase 3.6 — kind-aware probe at /api/window/attach/probe?kind=<photo|voice>.
    // Audit B1 fix: lets each client (window-photos.js / window-voice.js)
    // detect ITS modality's flag without revealing the other modality's
    // affordance when partial flags are flipped.
    if (request.method === 'GET' && pathname === '/api/window/attach/probe') {
      return handleWindowAttachProbe(request, env, ctx);
    }
    if (request.method === 'GET' && pathname.startsWith('/api/window/attach/')) {
      return handleWindowAttachDownload(request, env, ctx);
    }

    // API routes — check the exact-match table first.
    if (pathname.startsWith('/api/')) {
      const handler = API_ROUTES[pathname];
      if (!handler) {
        return jsonResponse(
          { ok: false, error: 'Unknown API endpoint', path: pathname },
          404
        );
      }
      // /api/brand-dossier accepts POST only (it carries the signal
      // payload in the body). Not in the GET-allowlist below, so it
      // falls through to the default POST-only branch.
      //
      // D1: /api/audit-snapshot accepts BOTH — POST creates a new
      // snapshot, GET (?token=XXX) reads one. Branches via a third
      // arm so neither of the existing method-checks below rejects
      // a legitimate call.
      if (pathname === '/api/audit-snapshot' || pathname === '/api/auth/account-delete-confirm' || pathname === '/api/course/progress' || pathname === '/api/course/config') {
        // Both endpoints branch on method internally:
        //   - audit-snapshot: GET reads, POST creates
        //   - account-delete-confirm: GET renders confirmation page,
        //     POST does the wipe (split prevents email-prefetch wipes)
        if (request.method !== 'GET' && request.method !== 'POST') {
          return jsonResponse({ ok: false, error: 'Method not allowed — endpoint accepts GET or POST' }, 405);
        }
      } else if (pathname === '/api/og-snapshot' || pathname === '/api/ping' || pathname === '/api/gbp-lookup' || pathname === '/api/seo-check' || pathname === '/api/schema-check' || pathname === '/api/page-crawl' || pathname === '/api/psi' || pathname === '/api/did-you-mean' || pathname === '/api/observatory' || pathname === '/api/wayback-first-seen' || pathname === '/api/crux-history' || pathname === '/api/gbp-details' || pathname === '/api/dns-email-health' || pathname === '/api/auth/verify' || pathname === '/api/auth/me' || pathname === '/api/workbench/list' || pathname === '/api/workbench/get' || pathname === '/api/workbench/sheet-history' || pathname === '/api/workbench/watch-list' || pathname === '/api/workbench/property/list' || pathname === '/api/workbench/property/get' || pathname === '/api/workbench/property/rollup' || pathname === '/api/submission/list-mine' || pathname === '/api/admin/submissions/list' || pathname === '/api/window/thread' || pathname === '/api/window/poll' || pathname === '/api/window/active' || pathname === '/api/window/turnstile-state' || pathname === '/api/window/me-unread' || pathname === '/api/admin/window/list' || pathname === '/api/admin/window/thread') {
        if (request.method !== 'GET') {
          return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
        }
      } else {
        if (request.method !== 'POST') {
          return jsonResponse(
            { ok: false, error: 'Method not allowed — form endpoints accept POST only' },
            405
          );
        }
      }
      // Sprint U2: every API request gets an X-Request-Id. If the
      // caller supplied one we honor it (makes client-side retry
      // correlation trivial); otherwise we mint a new one.
      const reqId = request.headers.get('x-request-id') || crypto.randomUUID();
      const started = Date.now();

      // Per-IP throttle. /api/ping bypasses so ops can health-check
      // without burning the caller's own budget. Form endpoints use a
      // tighter per-hour budget because each hits Resend's free tier.
      //
      // Two-tier enforcement:
      //   1. Durable-Object sliding window (global across isolates)
      //      when env.RATE_LIMITER is bound. Authoritative.
      //   2. In-isolate sliding window as the fallback when the DO
      //      binding is absent (local dev, pre-deploy, or after a DO
      //      outage). Less precise but zero extra latency.
      // checkDurableRateLimit never throws — a DO outage is logged
      // and the request is treated as allowed by that layer so a
      // real user is never blocked because of an infrastructure
      // blip. The in-isolate fallback still caps bursts within one
      // isolate in that degraded mode.
      if (pathname !== '/api/ping') {
        const ip = clientIpFromRequest(request);
        const isForm = FORM_RATE_LIMIT_PATHS.has(pathname);
        const tier = isForm
          ? { name: 'form', windowMs: 3600_000, max: 10 }
          : { name: 'api',  windowMs: 60_000,   max: 30 };

        let deny = null;
        if (env.RATE_LIMITER) {
          deny = await checkDurableRateLimit(env, tier.name + ':' + ip, tier.windowMs, tier.max);
        } else {
          const localLimiter = isForm ? FORM_RATE_LIMITER : API_RATE_LIMITER;
          deny = localLimiter.check(ip);
        }

        if (deny) {
          console.log(JSON.stringify({
            event: 'api.rate_limited',
            path: pathname,
            method: request.method,
            retryAfter: deny.retryAfterSeconds,
            tier: tier.name,
            reqId: reqId
          }));
          const throttled = jsonResponse({ ok: false, error: 'rate-limited', retryAfterSeconds: deny.retryAfterSeconds }, 429);
          throttled.headers.set('Retry-After', String(deny.retryAfterSeconds));
          throttled.headers.set('X-Request-Id', reqId);
          return throttled;
        }
      }

      try {
        const response = await handler(request, env, ctx);
        // Sprint U1: structured access log, one JSON line per request,
        // so Cloudflare's observability panel can slice by event /
        // status / path / duration without regex parsing.
        console.log(JSON.stringify({
          event: 'api.response',
          path: pathname,
          method: request.method,
          status: response.status,
          ms: Date.now() - started,
          reqId: reqId
        }));
        // Clone headers on the way out so we can stamp the request id
        // without mutating the handler's response (Response headers
        // are immutable after construction).
        const out = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers)
        });
        out.headers.set('X-Request-Id', reqId);
        return out;
      } catch (err) {
        console.log(JSON.stringify({
          event: 'api.error',
          path: pathname,
          method: request.method,
          ms: Date.now() - started,
          reqId: reqId,
          error: err && err.message ? err.message : String(err)
        }));
        console.error('[api]', pathname, err && err.stack ? err.stack : err);
        const fallback = jsonResponse(
          { ok: false, error: 'Internal error — please try again in a moment', reqId: reqId },
          500
        );
        fallback.headers.set('X-Request-Id', reqId);
        return fallback;
      }
    }

    // Not an API route. Before falling through to static assets,
    // sniff for a Spanish-speaking first-time visitor at the site
    // root and attach an advisory header so the page can show an
    // opt-in "Ver en español" banner client-side. We deliberately
    // do NOT redirect — redirects on "/" are hostile to crawlers,
    // curl, and cache keys. Deep links to /es/* are always served
    // verbatim from the static assets below.
    //
    // The hint fires only when:
    //   - the request is GET
    //   - the path is exactly "/" (root)
    //   - the visitor has no md_locale preference cookie yet
    //   - Accept-Language leads with a Spanish tag
    //
    // This is a pure passive signal. Omitting it has zero
    // functional impact on the site.
    if (request.method === 'GET' && pathname === '/') {
      const cookies = request.headers.get('cookie') || '';
      const hasPref = /(?:^|;\s*)md_locale=/.test(cookies);
      if (!hasPref) {
        const accept = (request.headers.get('accept-language') || '').toLowerCase();
        // Match "es" or "es-XX" as the leading language tag. We avoid
        // a broad /es/ regex to keep "fr-CA,es;q=0.1" from tripping
        // the hint — only visitors whose browser asks for Spanish
        // first (or right after English) get the banner.
        const leadsWithSpanish = /^\s*es\b/.test(accept)
          || /^\s*en[^,]*,\s*es\b/.test(accept);
        if (leadsWithSpanish) {
          const res = await env.ASSETS.fetch(request);
          const h = new Headers(res.headers);
          h.set('x-locale-hint', 'es');
          // Any downstream cache keyed on Accept-Language should know
          // that this response's payload is identical but headers vary.
          const existingVary = h.get('vary');
          h.set('vary', existingVary ? `${existingVary}, Accept-Language` : 'Accept-Language');
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: h,
          });
        }
      }
    }

    // D7b: social-crawler meta injection for shared audit permalinks.
    // When the request is for the audit tool page AND carries a valid
    // ?s=<token> query param, pull the snapshot metadata from KV and
    // rewrite og:*/twitter:* meta tags on the static response so Slack,
    // LinkedIn, X, Facebook, etc. render the per-snapshot score card
    // instead of the generic site OG. The rewrite is streaming via
    // HTMLRewriter — zero overhead when ?s= isn't present.
    const snapshotPaths = ['/tools/audits/restaurant/', '/tools/audits/restaurant/index.html',
                           '/es/tools/audits/restaurant/', '/es/tools/audits/restaurant/index.html'];
    if (request.method === 'GET' && snapshotPaths.includes(pathname)) {
      const snapToken = url.searchParams.get('s');
      if (snapToken && isValidTokenShape(snapToken) && env.AUDIT_SNAPSHOTS) {
        const snap = await getSnapshot(env, snapToken);
        if (snap.ok && snap.snapshot) {
          const base = await env.ASSETS.fetch(request);
          return rewriteAuditPageForSnapshot(base, snap.snapshot, snapToken, url);
        }
      }
    }

    // Sprint 0 (Workshop) — private /workbench/ gate. The static
    // HTML for /workbench/ exists in dist/, but ASSETS.fetch only
    // gets to serve it when the visitor presents a valid signed
    // session cookie. Anonymous + tampered + expired cookies all
    // get a 404 (not 401 or 302) so the route is indistinguishable
    // from a non-existent path. /api/auth/verify mints the cookie
    // and 302s here, so the FIRST request after a magic-link click
    // is already authenticated and passes the gate.
    //
    // robots.txt also disallows these paths, but defense in depth:
    // a misbehaving crawler that ignores robots still gets 404'd.
    const workbenchPaths = [
      '/workbench/', '/workbench/index.html',
      '/es/workbench/', '/es/workbench/index.html',
      // Phase 3 (Workshop) — /account/ joins the gated set with the
      // same 404-for-anonymous posture. Operators only reach it from
      // /workbench/'s "Account" link or from a deep-link they've
      // bookmarked themselves; nothing crawlable points here.
      '/account/', '/account/index.html',
      '/es/account/', '/es/account/index.html',
    ];
    if (request.method === 'GET' && workbenchPaths.includes(pathname)) {
      const session = await getSessionFromRequest(request, env);
      if (!session) {
        return new Response(null, { status: 404 });
      }
    }

    // Phase G.11 — /health/<token>/ resolves a shared Storefront
    // Health snapshot. Redirects to the tool page with ?s= so the
    // recipient lands on a rehydrated scorecard. 404 on unknown
    // tokens (consistent with audit-snapshot's behaviour).
    if (request.method === 'GET') {
      const healthM = pathname.match(/^\/(?:es\/)?health\/([A-Z0-9]{10})\/?$/);
      if (healthM) {
        const tok = healthM[1];
        if (isValidShareTokenShape(tok) && env.AUTH_SESSIONS) {
          const snap = await getShareSnapshot(env, SHARE_KINDS.STOREFRONT_HEALTH, tok);
          if (snap && snap.ok) {
            const isEs = pathname.startsWith('/es/');
            const dest = `${isEs ? '/es' : ''}/tools/storefront-health/?s=${tok}&shared=1`;
            return new Response(null, { status: 302, headers: { location: dest } });
          }
        }
        return new Response(null, { status: 404 });
      }
    }

    // Fall through to the static-asset server. Three HTMLRewriter
    // passes when the response is HTML:
    //   1. Phase G.3  — inject <link rel="alternate" type="application/rss+xml">
    //   2. Phase G.11 — when ?s= is present on a tool page, stamp the
    //      recipient-side "Want one for your place?" banner.
    //   3. Phase G.12 — A/B experiment data-attributes on <html>.
    const assetResponse = await env.ASSETS.fetch(request);
    if (request.method === 'GET' && assetResponse.ok) {
      const ct = assetResponse.headers.get('content-type') || '';
      if (ct.startsWith('text/html')) {
        let r = rewriteWithRssAlternate(assetResponse, pathname);
        if (url.searchParams.has('s') && pathname.match(/^\/(?:es\/)?tools\//)) {
          r = rewriteWithShareBanner(r, pathname, url.searchParams.get('s'));
        }
        const aiEngine = detectAiEngineFromReferer(request.headers.get('referer'));
        if (aiEngine) r = rewriteWithAiEngineAttr(r, aiEngine);
        return rewriteForExperiment(r, request, pathname);
      }
    }
    return assetResponse;
  },

  // ============================================================
  // Phase 3 (Workshop) — scheduled() Cron Trigger handler.
  // ============================================================
  //
  // Wrangler.jsonc's `triggers.crons` stays commented out until
  // ops is ready to flip on Watch. When that lands, this handler
  // fires on the configured cadence (proposed: daily at 14:00 UTC).
  //
  // Today's behavior (cron disabled):
  //   - The handler is exported but never invoked.
  //   - Code below is the scaffold so a future flip-the-switch
  //     change is one wrangler.jsonc edit, not a code release.
  //
  // Tomorrow's behavior (cron enabled):
  //   1. iterateAllWatches(env) yields { sub, watch } for every
  //      watch row in AUTH_SESSIONS.
  //   2. For each, look up the underlying save:<sub>:<savedItemId>,
  //      re-run the kind's check against the saved URL/query,
  //      compare the new score to watch.lastScore + watch.baselineScore.
  //   3. If the delta crosses a per-kind threshold, send a diff
  //      email via Resend (the existing email.js pipeline).
  //   4. recordWatchCheck(env, sub, savedItemId, newScore).
  //
  // Re-check functions live in src/lib/watch-checks.js (a Phase 3
  // implementation file, not in this scaffolding sprint). Each
  // function takes (env, savedItem) and returns a number 0..100.
  //
  // The handler is wrapped so a single watch's failure doesn't
  // halt the run — log + continue.
  async scheduled(controller, env, ctx) {
    // Guard rails: refuse to run if the auth bindings aren't
    // configured. The cron staying enabled with a missing namespace
    // would otherwise log an error every tick.
    if (!env || !env.AUTH_SESSIONS) {
      console.warn('[cron] scheduled() invoked but AUTH_SESSIONS missing; skipping');
      return;
    }

    // Bug B3.4 (proactive audit) — single-flight tick lock. If a
    // tick is still running when the next fires (slow KV reads,
    // upstream timeouts), the second tick races against the first
    // for the same watches. Defensive only: at today's PER_TICK_BUDGET
    // (200) and BATCH_SIZE (5) the run finishes well inside the
    // 30-second cron-worker budget. The lock TTL is 60s — KV's
    // minimum — so a single missed tick re-acquires on the next.
    const TICK_LOCK_KEY = 'cron:tick:lock';
    try {
      const held = await env.AUTH_SESSIONS.get(TICK_LOCK_KEY);
      if (held) {
        console.warn('[cron] tick lock held; skipping this tick');
        return;
      }
      await env.AUTH_SESSIONS.put(TICK_LOCK_KEY, String(Date.now()), { expirationTtl: 60 });
    } catch (err) {
      // KV failure during lock acquire shouldn't block the tick
      // entirely — let it run; the budget caps still apply.
      console.warn('[cron] tick lock acquire failed; proceeding without lock', err && err.message);
    }

    const t0 = Date.now();
    // Per-tick budget: bail at ~200 watches so a runaway namespace
    // can't blow the Cron Worker's 30s execution budget. At today's
    // scale this is hugely overkill; revisit once active accounts
    // pass ~500.
    const PER_TICK_BUDGET = 200;
    // Concurrency: process up to BATCH_SIZE watches in parallel via
    // Promise.allSettled so one slow upstream (PSI cold cache) can't
    // serialize the others.
    const BATCH_SIZE = 5;

    let attempted = 0;
    let rechecked = 0;
    let notified  = 0;
    let errors    = 0;
    let batch     = [];

    async function processOne(entry) {
      const { sub, watch } = entry;
      const kind = watch && watch.kind;
      const recheck = RECHECK_BY_KIND[kind];
      if (!recheck) return;
      const itemId = watch.savedItemId;
      // Bug B2.7 (proactive audit) — skip watches already marked
      // stalled. A successful recheck (next time the user re-saves
      // or re-attaches) clears the flag in recordWatchCheck.
      if (watch.stalled) return;
      try {
        // Pull the underlying save row for the URL/payload context.
        const saved = await getItem(env, sub, itemId);
        if (!saved) {
          // Save row was deleted but watch row survived — clean up.
          // Phase 4 follow-up could detach the orphan watch here;
          // for now just skip so the cron tick stays read-mostly.
          return;
        }
        const result = await recheck(env, saved);
        rechecked++;
        const oldScore = (typeof watch.lastScore === 'number') ? watch.lastScore
                       : (typeof watch.baselineScore === 'number') ? watch.baselineScore
                       : null;
        const newScore = (result && typeof result.score === 'number') ? result.score : null;
        // Persist newScore even when null — recordWatchCheck handles
        // the null case (preserves prior lastScore but updates lastCheckedAt).
        await recordWatchCheck(env, sub, itemId, newScore);

        if (!result || !result.ok) return;
        if (!shouldNotify(oldScore, newScore, kind)) return;
        if (!env.RESEND_API_KEY) {
          console.warn('[cron] would notify but RESEND_API_KEY missing');
          return;
        }

        // Look up the user's email from user:<sub> so we can address
        // the email. A missing user row means the account was deleted
        // but the watch row survived — same orphan case as above.
        let email = null;
        try {
          const userRaw = await env.AUTH_SESSIONS.get('user:' + sub);
          if (userRaw) {
            const userRow = JSON.parse(userRaw);
            if (userRow && typeof userRow.email === 'string') email = userRow.email;
          }
        } catch (_) { /* fall through to skip */ }
        if (!email) return;

        // Locale: derive from the saved item title (no per-user
        // locale stored yet). ASCII-friendly fallback to 'en'.
        const locale = (typeof saved.title === 'string' && /[áéíóúñ¿¡]/i.test(saved.title)) ? 'es' : 'en';
        const baseUrl = (env.MAGIC_LINK_BASE_URL && String(env.MAGIC_LINK_BASE_URL)) || 'https://muntin.digital';
        const watchUrl = baseUrl + (locale === 'es' ? '/es/workbench/' : '/workbench/');
        // Best-effort deep-link back to the originating tool.
        const toolPathFor = (k, lang) => {
          const map = {
            audit:  '/tools/audits/restaurant/',
            seo:    '/tools/seo-grader/',
            gbp:    '/tools/gbp-grader/',
            mobile: '/tools/mobile-check/',
            schema: '/tools/schema-check/',
            speed:  '/tools/speed-test/',
          };
          const path = map[k] || '/tools/';
          return baseUrl + (lang === 'es' ? '/es' : '') + path + '?saved=' + encodeURIComponent(itemId);
        };

        const tpl = watchDiffEmail({
          locale,
          kindLabel: kindLabel(kind, locale),
          title: saved.title || '',
          oldScore,
          newScore,
          link: toolPathFor(kind, locale),
          watchUrl,
        });
        const fromEmail = (env.FROM_EMAIL && String(env.FROM_EMAIL)) || 'Don Goldstein <don@muntin.digital>';
        const sendRes = await sendEmail({
          from: fromEmail,
          to: email,
          replyTo: 'don@muntin.digital',
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        }, env.RESEND_API_KEY);
        if (sendRes && sendRes.ok) {
          notified++;
        } else {
          console.warn('[cron] watchDiffEmail send failed:', sendRes && sendRes.error);
        }
      } catch (err) {
        errors++;
        console.warn('[cron] watch processing failed', err && err.message);
        // Bug B2.7 (proactive audit) — flag the failure on the watch
        // row so consecutiveFailures can converge to STALL_THRESHOLD
        // and the cron stops retrying a doomed call. Best-effort —
        // if the failure-record itself fails (KV unavailable), let
        // the next tick try again.
        try {
          const recorded = await recordWatchCheck(env, sub, itemId, null, true);
          if (recorded && recorded.ok && recorded.watch) {
            const row = recorded.watch;
            const fails = row.consecutiveFailures || 0;
            if (fails >= STALL_THRESHOLD && !row.stalled) {
              // Mark stalled so subsequent ticks skip this watch and
              // the user sees one notification, not ongoing spam.
              await markWatchStalled(env, sub, itemId);
              // TODO(B2.7): wire a stalled-watch email template into
              // src/lib/templates.js and send via sendEmail here.
              // Until that copy is authored, log so ops can flag the
              // user manually. The skip-on-stalled guard at the top
              // of processOne already prevents quota burn.
              console.warn('[cron] watch stalled', { sub, itemId, kind, fails });
            }
          }
        } catch (_) { /* swallow */ }
      }
    }

    try {
      for await (const entry of iterateAllWatches(env)) {
        attempted++;
        if (attempted > PER_TICK_BUDGET) break;
        batch.push(processOne(entry));
        if (batch.length >= BATCH_SIZE) {
          await Promise.allSettled(batch);
          batch = [];
        }
      }
      if (batch.length) await Promise.allSettled(batch);
    } catch (err) {
      console.warn('[cron] iterateAllWatches failed', err && err.message);
    }

    // Phase C.4 (Storefront Health) — property rollup pass.
    // Cheap: each rollup just re-reads the referenced save:<sub>:<id>
    // rows and recomputes the average. No upstream API calls. Hard
    // cap at PROPERTY_TICK_BUDGET=30 properties per tick to keep the
    // total KV-read budget bounded. Skipped entirely when the flag
    // is off.
    let propertiesProcessed = 0;
    if (_storefrontHealthGate(env)) {
      const PROPERTY_TICK_BUDGET = 30;
      try {
        for await (const entry of iterateAllProperties(env)) {
          if (propertiesProcessed >= PROPERTY_TICK_BUDGET) break;
          try {
            await rollupProperty(env, entry.sub, entry.property.id);
            propertiesProcessed++;
          } catch (e) {
            console.warn('[cron] rollupProperty failed', { id: entry.property && entry.property.id, err: e && e.message });
          }
        }
      } catch (err) {
        console.warn('[cron] iterateAllProperties failed', err && err.message);
      }
    }

    // Phase F.3 (Field Notes) — stale sweep + orphan check.
    // Cheap (KV reads only). Marks pending submissions older than
    // STALL_AGE_MS (60d) as 'stalled' so the admin queue can filter
    // them out. Logs orphans (approved fieldnotes whose articleSlug
    // is no longer in the build-time allowlist) without auto-deleting
    // — Don's call.
    let submissionsStalled = 0;
    let submissionOrphans = 0;
    if (_fieldNotesGate(env)) {
      const STALE_BUDGET = 50;
      const now = Date.now();
      try {
        let scanned = 0;
        for await (const { sub, submission } of iterateAllSubmissions(env)) {
          if (scanned >= STALE_BUDGET) break;
          scanned++;
          if (submission.status !== 'pending') continue;
          const age = now - (submission.createdAt || now);
          if (age < STALL_AGE_MS) continue;
          submission.status = 'stalled';
          submission.decidedAt = now;
          await env.AUTH_SESSIONS.put(submissionKey(sub, submission.id), JSON.stringify(submission));
          submissionsStalled++;
          console.log(JSON.stringify({ event: 'submission.stalled', sub, submissionId: submission.id, ts: now }));
        }
      } catch (err) {
        console.warn('[cron] submission stale sweep failed', err && err.message);
      }
      try {
        for await (const row of iterateAllApprovedFieldnotes(env)) {
          if (!row || !row.articleSlug) continue;
          if (!_ARTICLE_SLUGS_SET.has(row.articleSlug)) {
            submissionOrphans++;
            console.warn('[cron] submission.orphan-slug', { articleSlug: row.articleSlug, id: row.id });
          }
        }
      } catch (err) {
        console.warn('[cron] approved-fieldnote orphan check failed', err && err.message);
      }
    }

    // Phase W.2 (The Window) — flush pending-don email batches.
    // Each pending row carries the firstAt timestamp; when older
    // than PENDING_DON_BATCH_MS (2 min), we emit a single
    // coalesced email to Don summarizing the batched messages,
    // then delete the pending row. Capped per-tick to keep the
    // existing PER_TICK_BUDGET healthy.
    let windowBatchesFlushed = 0;
    let windowBatchesFailed = 0;
    if (_windowGate(env) && env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
      const WINDOW_BATCH_BUDGET = 20;
      try {
        let processed = 0;
        for await (const { suffix, sub, anonId, kind, row, key } of iteratePendingDonReady(env)) {
          if (processed >= WINDOW_BATCH_BUDGET) break;
          processed++;
          try {
            // Resolve the thread for the email body. Identified rows
            // route through the per-user thread index; anon rows
            // resolve directly by anonId (the cookie IS the index).
            // Audit B1: anon rows previously fell through getOpenThreadForUser
            // and silently dropped — fixed by dispatching on `kind`.
            let thread;
            if (kind === 'anon') {
              thread = await getOpenThreadForAnon(env, anonId);
            } else {
              thread = await getOpenThreadForUser(env, sub);
            }
            if (!thread) {
              await env.AUTH_SESSIONS.delete(key);
              continue;
            }
            const allMsgs = await listThreadMessages(env, thread.id, 100);
            const batch = allMsgs.filter((m) => (row.msgIds || []).includes(m.id) && m.from === 'user');
            if (!batch.length) {
              await env.AUTH_SESSIONS.delete(key);
              continue;
            }
            const excerpts = batch.map((m) => String(m.body || '').slice(0, 240)).reverse();
            const isEs = thread.locale === 'es';
            // Defensive: anon threads have null email + null sub.
            // Use anonId.slice for the author label so the template
            // never receives undefined or null.
            const authorLabel = thread.email || (suffix && typeof suffix === 'string' ? suffix.slice(0, 8) : 'visitor');
            const tmpl = windowNotifyDonEmail({
              locale: isEs ? 'es' : 'en',
              author: authorLabel,
              email: thread.email || '',
              excerpts,
              adminUrl: isEs ? 'https://muntin.digital/es/admin/window/' : 'https://muntin.digital/admin/window/',
              // Pass both: existing templates use `sub`; new admin
              // queue UI may switch on kind to render anon links.
              sub: kind === 'identified' ? sub : null,
              anonId: kind === 'anon' ? anonId : null,
              kind,
              threadId: thread.id,
              // Phase 1b — crisis tier surfaces in Don's digest
              // (subject [urgent]/[heads up] prefix + body banner)
              // before Phase 2's Twilio SMS dispatcher ships.
              crisisTier: thread.crisisTier || null,
            });
            await sendEmail({
              from: env.FROM_EMAIL || 'Muntin Digital <hi@muntin.digital>',
              to: env.NOTIFY_EMAIL,
              subject: tmpl.subject,
              html: tmpl.html,
              text: tmpl.text,
            }, env.RESEND_API_KEY);
            await env.AUTH_SESSIONS.delete(key);
            windowBatchesFlushed++;
          } catch (err) {
            windowBatchesFailed++;
            console.warn('[cron] window batch flush failed', { suffix, kind, err: err && err.message });
          }
        }
      } catch (err) {
        console.warn('[cron] iteratePendingDonReady failed', err && err.message);
      }
    }

    // Phase 3.3 — voice transcript backfill. Drains up to 5 entries
    // per tick (each Whisper call ~2-5s; 5×5s = 25s under the 30s
    // CPU budget). Successes update the attachment row + delete the
    // queue entry. Failures increment attempts; after 3 attempts
    // we give up + delete the queue entry (the audio stays in R2,
    // just transcript-less).
    let transcriptsAttempted = 0;
    let transcriptsCompleted = 0;
    if (_windowGate(env) && env.AI && env.WINDOW_ATTACHMENTS) {
      try {
        for await (const { row, key } of iterateTranscriptQueue(env, 5)) {
          transcriptsAttempted++;
          try {
            const attachRow = await getAttachmentRow(env, row.attachId);
            if (!attachRow || attachRow.transcript || attachRow.deleted) {
              // Already transcribed by inline path or deleted — drop the queue entry.
              await env.AUTH_SESSIONS.delete(key);
              continue;
            }
            const obj = await env.WINDOW_ATTACHMENTS.get(attachRow.r2Key);
            if (!obj) {
              await env.AUTH_SESSIONS.delete(key);
              continue;
            }
            const audioBytes = new Uint8Array(await obj.arrayBuffer());
            const result = await transcribeVoice(env, audioBytes);
            if (result.ok) {
              await setAttachmentTranscript(env, row.attachId, result.text, result.language);
              await env.AUTH_SESSIONS.delete(key);
              transcriptsCompleted++;
              // Audit B-2 — same crisis re-scan as the inline path.
              const transcriptTier = detectCrisisTier(result.text);
              if (transcriptTier === 'tier1') {
                console.log(JSON.stringify({ event: 'window.crisis-flag', kind: 'voice-transcript', tier: 'tier1', source: 'cron', attachId: row.attachId }));
                try {
                  const senderLabel = (attachRow.sub || attachRow.anonId || 'visitor').slice(0, 8) + ' (voice)';
                  const out = await sendCrisisSms(env, senderLabel, '[voice transcript] ' + result.text);
                  if (out.ok) {
                    console.log(JSON.stringify({ event: 'window.crisis-sms.sent', kind: 'voice-transcript', source: 'cron', attachId: row.attachId, sid: out.sid }));
                  } else {
                    console.warn('[cron] voice-crisis-sms', { attachId: row.attachId, skipped: out.skipped || null, error: out.error || null });
                  }
                } catch (err) {
                  console.warn('[cron] voice-crisis-sms threw', { attachId: row.attachId, err: err && err.message });
                }
              }
            } else {
              row.attempts = (row.attempts || 0) + 1;
              if (row.attempts >= 3) {
                await env.AUTH_SESSIONS.delete(key);
                console.warn('[cron] transcript gave up after 3 attempts', { attachId: row.attachId, error: result.error });
              } else {
                await env.AUTH_SESSIONS.put(key, JSON.stringify(row), { expirationTtl: 24 * 3600 });
              }
            }
          } catch (err) {
            console.warn('[cron] transcript backfill threw', { attachId: row.attachId, err: err && err.message });
          }
        }
      } catch (err) {
        console.warn('[cron] iterateTranscriptQueue failed', err && err.message);
      }
    }

    // Phase G.11 — lifecycle email dispatcher. Runs after the watch
    // tick + window batch flush so the same lock window covers both.
    // Feature-flagged via env.LIFECYCLE_EMAILS_ENABLED — defaults
    // to off so the pathway can ship + soak before firing emails.
    let lifecycleAttempted = 0;
    let lifecycleFired = 0;
    let lifecycleSkipped = null;
    try {
      const result = await dispatchLifecycleEmails(env, { digestItems: [] });
      if (result && result.skipped) {
        lifecycleSkipped = result.skipped;
      } else if (result) {
        lifecycleAttempted = result.attempted || 0;
        lifecycleFired = result.fired || 0;
      }
    } catch (err) {
      console.warn('[cron] lifecycle dispatcher failed', err && err.message);
    }

    // Phase G.12 — weekly KPI snapshot email. Sends Don a 5-KPI
    // summary every Monday morning. Idempotent via a KV stamp
    // (cron:kpi-snapshot:<YYYY-WW>); duplicate cron runs in the
    // same week skip silently. Off when KPI_SNAPSHOT_ENABLED is
    // not "true" so the cron can ship before Plausible API is wired.
    let kpiSnapshotSent = false;
    let kpiSnapshotSkipped = null;
    try {
      const result = await dispatchKpiSnapshot(env);
      if (result && result.skipped) kpiSnapshotSkipped = result.skipped;
      else if (result && result.sent) kpiSnapshotSent = true;
    } catch (err) {
      console.warn('[cron] kpi snapshot failed', err && err.message);
    }

    // Phase 0 (Window redesign) — daily vital-signs snapshot. Writes a
    // once-per-UTC-day record of the Window's load to KV so we have a
    // server-side ground-truth baseline (not only Plausible events) for
    // the 14-day measurement, and the raw inputs the Phase-8 auto-pause
    // backstop will read (new-threads-today, pending-Don depth, oldest
    // unanswered age). Idempotent via a per-day stamp; extra ticks no-op.
    let windowVitalsWritten = false;
    try {
      const result = await snapshotWindowVitals(env);
      windowVitalsWritten = !!(result && result.written);
    } catch (err) {
      console.warn('[cron] window vitals snapshot failed', err && err.message);
    }

    // Phase 8.1 — auto-pause vital-signs check (every tick). Reads the
    // unreplied depth + operator presence, runs the hysteresis machine,
    // persists the level for handleWindowActive to surface.
    let windowAutoPauseLevel = null;
    try {
      const result = await computeAndPersistAutoPause(env);
      windowAutoPauseLevel = (result && typeof result.level === 'number') ? result.level : null;
    } catch (err) {
      console.warn('[cron] window auto-pause check failed', err && err.message);
    }

    console.log(JSON.stringify({
      event: 'cron.watch_tick',
      cron: (controller && controller.cron) || null,
      scheduledTime: (controller && controller.scheduledTime) || null,
      attempted,
      rechecked,
      notified,
      errors,
      propertiesProcessed,
      submissionsStalled,
      submissionOrphans,
      windowBatchesFlushed,
      windowBatchesFailed,
      lifecycleAttempted,
      lifecycleFired,
      lifecycleSkipped,
      kpiSnapshotSent,
      kpiSnapshotSkipped,
      windowVitalsWritten,
      windowAutoPauseLevel,
      ms: Date.now() - t0,
    }));
  },
};

// Phase G.12 — weekly KPI snapshot dispatcher. Reads data/kpis.json
// for the registry, builds a plain-text summary email keyed by ISO
// week, and sends to env.NOTIFY_EMAIL. KV stamps prevent duplicates.
async function dispatchKpiSnapshot(env) {
  if (env.KPI_SNAPSHOT_ENABLED !== 'true') return { skipped: 'flag-off' };
  if (!env.AUTH_SESSIONS || !env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return { skipped: 'bindings-missing' };
  // Only fire on Mondays in UTC. Other ticks return without sending.
  const now = new Date();
  if (now.getUTCDay() !== 1) return { skipped: 'not-monday' };
  // ISO-week key for de-dup. Sufficient for the once-a-week rhythm.
  const yyyy = now.getUTCFullYear();
  const week = isoWeekNumber(now);
  const key = `cron:kpi-snapshot:${yyyy}-${String(week).padStart(2, '0')}`;
  const already = await env.AUTH_SESSIONS.get(key);
  if (already) return { skipped: 'already-sent' };

  // Load KPI registry from /data/kpis.json via env.ASSETS.
  let kpis;
  try {
    const r = await env.ASSETS.fetch(new Request('https://muntin.digital/data/kpis.json'));
    if (!r.ok) return { skipped: 'kpi-data-missing' };
    const json = await r.json();
    kpis = json.kpis || [];
  } catch (_) { return { skipped: 'kpi-fetch-failed' }; }

  const lines = [
    `KPI snapshot — ISO week ${yyyy}-W${String(week).padStart(2, '0')}`,
    '',
    'Live values are not yet wired (Plausible Stats API requires a separate token). This email confirms the cron ran and lists the targets so the rhythm establishes itself.',
    '',
  ];
  for (const k of kpis) {
    lines.push(`${k.label_en}`);
    if (k.target_initial != null) lines.push(`  target_initial: ${k.target_initial}`);
    if (k.metric)                 lines.push(`  metric: ${k.metric}`);
    if (k.window)                 lines.push(`  window: ${k.window}`);
    lines.push('');
  }
  lines.push('Open dashboard: https://muntin.digital/admin/kpis/');
  const text = lines.join('\n');
  const subject = `KPI snapshot — week ${yyyy}-W${String(week).padStart(2, '0')}`;
  await sendEmail({
    from: env.FROM_EMAIL || 'Muntin Digital <hi@muntin.digital>',
    to: env.NOTIFY_EMAIL,
    subject,
    text,
    html: `<pre style="font-family:ui-monospace,monospace;white-space:pre-wrap">${text.replace(/[&<>]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' })[c])}</pre>`,
  }, env.RESEND_API_KEY);
  await env.AUTH_SESSIONS.put(key, '1', { expirationTtl: 14 * 24 * 60 * 60 });
  return { sent: true };
}

function isoWeekNumber(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = (date - firstThursday) / 86400000;
  return 1 + Math.floor(diff / 7);
}

// Phase 0 (Window redesign) — daily vital-signs snapshot. Aggregates the
// Window's standing load from the admin index and writes one record per
// UTC day to window:vitals:<day> (90-day TTL). Server-side ground-truth
// baseline for the 14-day measurement + the raw inputs the §8 auto-pause
// backstop reads. Idempotent via a per-day guard; read-only + one put.
async function snapshotWindowVitals(env) {
  if (!env || !env.AUTH_SESSIONS) return { written: false, skipped: 'bindings-missing' };
  if (!_windowGate(env)) return { written: false, skipped: 'window-off' };

  const now = Date.now();
  const today = windowDayBucket(now);
  const stampKey = 'window:vitals:' + today;
  const existing = await env.AUTH_SESSIONS.get(stampKey);
  if (existing) return { written: false, skipped: 'already-today' };

  // Audit F (known limitation): the admin index iterates the last 30
  // day-buckets keyed by updatedAt, so a thread untouched for >30 days
  // is invisible here — unansweredThreads and oldestUnansweredHrs reflect
  // the *recent* backlog (≤~720h), not all-time. Acceptable: auto-pause
  // is a load gauge on the active queue, and a 30-day-stale thread isn't
  // driving today's load. Revisit only if a true all-time SLA is needed.
  let entries = [];
  try { entries = await iterateAdminQueue(env, 30); }
  catch (_) { return { written: false, skipped: 'queue-unavailable' }; }

  const DAY_MS = 24 * 3600 * 1000;
  const vitals = {
    day: today, capturedAt: now,
    totalThreads30d: entries.length,
    openThreads: 0, unansweredThreads: 0, newToday: 0, new7d: 0,
    crisisFlagged: 0, oldestUnansweredHrs: 0,
    bySource: {}, byKind: { identified: 0, anon: 0 },
  };
  let oldestUnansweredAt = now;
  for (const e of entries) {
    const updatedAt = e.updatedAt || 0;
    if (e.status === 'open') vitals.openThreads++;
    if (e.unreadByAdmin) {
      vitals.unansweredThreads++;
      if (updatedAt && updatedAt < oldestUnansweredAt) oldestUnansweredAt = updatedAt;
    }
    if (updatedAt && (now - updatedAt) < DAY_MS) vitals.newToday++;
    if (updatedAt && (now - updatedAt) < 7 * DAY_MS) vitals.new7d++;
    if (e.crisisTier) vitals.crisisFlagged++;
    const src = e.source || '(none)';
    vitals.bySource[src] = (vitals.bySource[src] || 0) + 1;
    if (e.kind === 'anon' || (!e.sub && e.anonId)) vitals.byKind.anon++;
    else vitals.byKind.identified++;
  }
  vitals.oldestUnansweredHrs = vitals.unansweredThreads > 0
    ? Math.round((now - oldestUnansweredAt) / 3600000) : 0;

  try {
    await env.AUTH_SESSIONS.put(stampKey, JSON.stringify(vitals), { expirationTtl: 90 * 24 * 3600 });
  } catch (err) {
    console.warn('[cron] window vitals snapshot write failed', err && err.message);
    return { written: false, skipped: 'write-failed' };
  }
  console.log(JSON.stringify({ event: 'window.vitals', ...vitals }));
  return { written: true, vitals };
}

// Phase 8.1 (Window redesign) — auto-pause vital-signs check (every tick).
// Counts unreplied (open) threads + measures operator presence via the
// breathing-dot lastSeen, runs the pure hysteresis machine seeded with the
// PREVIOUS persisted level (so it can't flap), persists the level into
// window:active-meta.autoPause for handleWindowActive to surface. Auto-
// recovers by load. Tier-2 logs an alert; SMS lands in Phase 2 (Twilio).
async function computeAndPersistAutoPause(env) {
  if (!env || !env.AUTH_SESSIONS) return { level: null, skipped: 'bindings-missing' };
  if (!_windowGate(env)) return { level: null, skipped: 'window-off' };

  let unreplied = 0;
  try {
    const entries = await iterateAdminQueue(env, 30);
    for (const e of entries) {
      if (e.unreadByAdmin && e.status !== 'closed' && e.status !== 'archived') unreplied++;
    }
  } catch (_) { return { level: null, skipped: 'queue-unavailable' }; }

  const meta = await getWindowActiveMeta(env);
  const prevLevel = (meta && meta.autoPause && typeof meta.autoPause.level === 'number')
    ? meta.autoPause.level : 0;
  const lastSeen = meta && meta.lastSeen ? meta.lastSeen : null;
  const staleHours = lastSeen ? (Date.now() - lastSeen) / 3600000 : (AUTOPAUSE_STALE_HOURS + 1);

  const level = computeAutoPauseLevel(prevLevel, unreplied, staleHours);

  if (prevLevel === level && meta && meta.autoPause && meta.autoPause.unreplied === unreplied) {
    return { level, unreplied, unchanged: true };
  }
  const since = (prevLevel !== level)
    ? Date.now()
    : ((meta && meta.autoPause && meta.autoPause.since) || Date.now());
  await setWindowActiveMeta(env, { autoPause: { level, unreplied, since } });

  if (prevLevel !== level) {
    console.log(JSON.stringify({ event: 'window.autopause', from: prevLevel, to: level, unreplied, staleHours: Math.round(staleHours) }));
  }
  if (level === 2 && prevLevel < 2) {
    console.warn(JSON.stringify({ event: 'window.autopause.alert', level: 2, unreplied, note: 'composer disabled; SMS pending Twilio (Phase 2)' }));
  }
  return { level, unreplied };
}

// Phase 8.2 (Window redesign) — queue-depth daily cap. Increments the
// per-UTC-day new-thread counter and returns the new count. The note is
// NEVER rejected — when the count exceeds MAX_NEW_THREADS_PER_DAY the
// caller flags dayCapped for the "filed for tomorrow" half-success copy.
// 2-day TTL self-prunes; read-then-write race is immaterial at a 25/day bound.
async function _bumpWindowNewThreadCount(env) {
  const key = newThreadsDayKey(windowDayBucket(Date.now()));
  let n = 0;
  try { n = parseInt((await env.AUTH_SESSIONS.get(key)) || '0', 10) || 0; } catch (_) { /* treat as 0 */ }
  n += 1;
  try { await env.AUTH_SESSIONS.put(key, String(n), { expirationTtl: 2 * 24 * 3600 }); } catch (_) { /* best-effort */ }
  return n;
}

// D7b: rewrite og:*/twitter:* meta tags on the audit tool page so
// shared permalinks get a rich per-snapshot social card. Uses
// HTMLRewriter, which Cloudflare offers as a zero-parse streaming
// transformer — each matched element handler runs as the bytes flow
// through, no DOM construction.
//
// String computation extracted to buildSnapshotMetaOverrides() so the
// logic can be unit-tested without needing an HTMLRewriter instance.
export function buildSnapshotMetaOverrides(snapshot, token, reqUrl) {
  const score = (typeof snapshot.score === 'number') ? Math.round(snapshot.score) : null;
  // Bug B3.5 (proactive audit) — host extraction. The URL constructor
  // rejects any hostname with characters that could break out of an
  // HTML attribute (quotes, angle brackets, etc.), and HTMLRewriter's
  // setAttribute() auto-escapes the value when written. The catch
  // branch's String().slice() is the only path that can carry a raw
  // string with attribute-breaking characters; if you ever switch
  // from setAttribute() to template-string injection downstream,
  // this fallback needs an explicit attr-escape pass.
  const host = (function() {
    try { return new URL(snapshot.auditedUrl).host.replace(/^www\./i, ''); }
    catch (_) { return String(snapshot.auditedUrl || '').slice(0, 80); }
  })();
  const isEs = snapshot.language === 'es';
  const titleLabel = isEs ? 'Puntuación de auditoría' : 'Audit score';
  const ogTitle = (score !== null)
    ? `${titleLabel}: ${score}/100 — ${host}`
    : `${isEs ? 'Auditoría compartida' : 'Shared audit'} — ${host}`;
  // Description: verdict if present, otherwise a generic one.
  const rawVerdict = (snapshot.verdict || '').replace(/\s+/g, ' ').trim();
  const ogDescription = rawVerdict
    ? (rawVerdict.length > 200 ? rawVerdict.slice(0, 199) + '…' : rawVerdict)
    : (isEs
        ? `Auditoría del sitio web del restaurante compartida desde muntin.digital.`
        : `A restaurant website audit snapshot shared from muntin.digital.`);
  // og:image: always the snapshot OG endpoint. When no custom OG
  // was saved, /api/og-snapshot redirects to the static brand card.
  const origin = reqUrl.origin;
  const ogImage = `${origin}/api/og-snapshot?token=${encodeURIComponent(token)}`;
  // og:url: honor the locale path the request came in on.
  const canonicalUrl = `${origin}${reqUrl.pathname}?s=${encodeURIComponent(token)}`;
  return { ogTitle, ogDescription, ogImage, canonicalUrl };
}

// Phase G.12 (Growth) — A/B experiment registry.
//
// Mirror of data/experiments.json — kept in sync by hand. The
// dashboard view at /admin/kpis/ reads the JSON; the worker reads
// this const at request time. Mismatch is caught by the
// check-experiments-parity guard (see scripts/).
//
// To run an experiment: bump status from 'draft' to 'running'
// here AND in data/experiments.json. To roll back: status to
// 'draft'. To promote a winning treatment: pick the winner, drop
// the [data-treatment="…"] selector swap from the CSS, set
// status to 'promoted'.
//
// Bucketing:
//   anonymous: SHA256(IP || UA || YYYY-MM-DD), first 2 hex chars
//              → mod 100 → bucket index. Fresh bucket per visitor
//              per UA per day; cross-day visits roll the dice
//              again — accepted limitation for v1.
//   signed-in: would use SHA256(sub || YYYY-MM) for monthly
//              persistence. Not wired here yet because the
//              session cookie isn't read on the static-asset
//              path; a future iteration adds it.
const EXPERIMENTS = Object.freeze({
  'window-cta-copy': {
    status: 'running',
    treatments: ['control', 'warmer'],
    weight: [50, 50],
    surfaces: ['/'],
  },
});

function pickTreatment(experiment, bucket) {
  const treatments = experiment.treatments || ['control'];
  const weights = experiment.weight || treatments.map(() => 100 / treatments.length);
  let acc = 0;
  for (let i = 0; i < treatments.length; i++) {
    acc += weights[i] || 0;
    if (bucket < acc) return treatments[i];
  }
  return treatments[treatments.length - 1];
}

async function bucketForRequest(request) {
  const ip = clientIpFromRequest(request) || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const enc = new TextEncoder().encode(ip + '|' + ua + '|' + day);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const hex = Array.from(new Uint8Array(buf)).slice(0, 1)[0];
  return hex % 100;
}

function activeExperimentForPath(pathname) {
  for (const [name, exp] of Object.entries(EXPERIMENTS)) {
    if (exp.status !== 'running') continue;
    if (Array.isArray(exp.surfaces) && !exp.surfaces.some((p) => pathname === p || pathname.startsWith(p) && p !== '/')) continue;
    return { name, exp };
  }
  return null;
}

// Phase G.9 — AI-search referrer detection at the edge. Stamps
// <html data-ai-engine="<engine>"> on responses where the
// Referer header matches an AI-search engine. The same closed
// enum lives client-side in assets/js/first-touch.js. Fires from
// HTMLRewriter so it's a streaming pass — zero overhead when
// the referer doesn't match.
const AI_SEARCH_HOST_RE = [
  { engine: 'chatgpt',    re: /(?:^|\.)(?:chatgpt|chat\.openai)\.com$/i },
  { engine: 'perplexity', re: /(?:^|\.)perplexity\.ai$/i },
  { engine: 'copilot',    re: /(?:^|\.)(?:copilot\.microsoft|bing)\.com$/i },
  { engine: 'gemini',     re: /(?:^|\.)gemini\.google\.com$/i },
  { engine: 'claude',     re: /(?:^|\.)claude\.ai$/i },
  { engine: 'you',        re: /(?:^|\.)you\.com$/i },
  { engine: 'phind',      re: /(?:^|\.)phind\.com$/i },
  { engine: 'kagi',       re: /(?:^|\.)kagi\.com$/i },
];
function detectAiEngineFromReferer(refererHeader) {
  if (!refererHeader) return null;
  let host;
  try { host = new URL(refererHeader).host; } catch (_) { return null; }
  for (const { engine, re } of AI_SEARCH_HOST_RE) {
    if (re.test(host)) return engine;
  }
  return null;
}
function rewriteWithAiEngineAttr(response, engine) {
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  const rw = new HTMLRewriter().on('html', {
    element(el) { el.setAttribute('data-ai-engine', engine); },
  });
  return rw.transform(new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}

// Phase G.11 — recipient-side banner on shared tool URLs. When a
// visitor lands on /tools/<slug>/?s=<token> (or /health/<token>/
// after the redirect adds ?s=), inject a quiet banner above the
// hero offering "Want one for your place? — run the tool yourself."
// Fires Share recipient-banner Plausible event from a tiny inline
// script. The HTMLRewriter is no-op on non-HTML.
function rewriteWithShareBanner(response, pathname, token) {
  const isEs = pathname.startsWith('/es/');
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  const headline = isEs
    ? 'Alguien compartió esto contigo. ¿Quieres uno para tu local? Corre la herramienta tú mismo.'
    : 'Someone shared this with you. Want one for your place? Run the tool yourself.';
  const cta = isEs ? 'Empezar de cero' : 'Start fresh';
  const ctaHref = pathname.replace(/\/?$/, '/');
  const banner = `
<aside class="share-recipient-banner" role="note">
  <p>${headline}</p>
  <a class="share-recipient-banner__cta" href="${ctaHref}">${cta}</a>
</aside>
<script>
(function () {
  if (typeof window.plausible === 'function') {
    try { window.plausible('Share', { props: { target: 'recipient-banner', surface: 'tool' } }); } catch (_) {}
  }
})();
</script>`;
  // Phase G.11 — swap og:image / twitter:image to the per-token
  // share OG endpoint when ?s= is present. Crawlers + chat unfurls
  // get a tied-to-the-share preview instead of the generic site OG.
  const isStorefront = /\/tools\/storefront-health\//.test(pathname);
  const shareOgUrl = `https://muntin.digital/api/share/og/${token}.png?kind=${isStorefront ? 'storefront-health' : 'tool-result'}`;
  const rw = new HTMLRewriter()
    .on('main, body', { element(el) { el.prepend(banner, { html: true }); } })
    .on('meta[property="og:image"]',  { element(el) { el.setAttribute('content', shareOgUrl); } })
    .on('meta[name="twitter:image"]', { element(el) { el.setAttribute('content', shareOgUrl); } });
  return rw.transform(new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}

// Phase G.3 — inject <link rel="alternate" type="application/rss+xml">
// into the <head> of every HTML response. Locale-aware via path prefix.
// Idempotent if the link already exists (HTMLRewriter doesn't dedupe,
// so we rely on the fact that hand-edited pages don't already declare
// the link — true today; a future cohesion-check could verify).
function rewriteWithRssAlternate(response, pathname) {
  const isEs = pathname === '/es/' || pathname.startsWith('/es/');
  const feedUrl = isEs ? 'https://muntin.digital/es/feed.xml' : 'https://muntin.digital/feed.xml';
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  const rw = new HTMLRewriter().on('head', {
    element(el) {
      el.append(`<link rel="alternate" type="application/rss+xml" title="Muntin Digital" href="${feedUrl}" />`, { html: true });
    },
  });
  return rw.transform(new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}

// Stamps data-experiment + data-treatment on <html> for the active
// experiment matching the request's path. Returns the original
// response untouched when no experiment is running on this surface.
async function rewriteForExperiment(response, request, pathname) {
  const match = activeExperimentForPath(pathname);
  if (!match) return response;
  const bucket = await bucketForRequest(request);
  const treatment = pickTreatment(match.exp, bucket);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  const rw = new HTMLRewriter().on('html', {
    element(el) {
      el.setAttribute('data-experiment', match.name);
      el.setAttribute('data-treatment', treatment);
    },
  });
  return rw.transform(new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}

function rewriteAuditPageForSnapshot(response, snapshot, token, reqUrl) {
  const { ogTitle, ogDescription, ogImage, canonicalUrl } = buildSnapshotMetaOverrides(snapshot, token, reqUrl);

  const rw = new HTMLRewriter()
    .on('meta[property="og:title"]',       { element(el) { el.setAttribute('content', ogTitle); } })
    .on('meta[name="twitter:title"]',      { element(el) { el.setAttribute('content', ogTitle); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', ogDescription); } })
    .on('meta[name="twitter:description"]',{ element(el) { el.setAttribute('content', ogDescription); } })
    .on('meta[property="og:image"]',       { element(el) { el.setAttribute('content', ogImage); } })
    .on('meta[name="twitter:image"]',      { element(el) { el.setAttribute('content', ogImage); } })
    .on('meta[property="og:url"]',         { element(el) { el.setAttribute('content', canonicalUrl); } });
  // Clone so we can strip the content-length header that won't be
  // accurate once the rewriter streams its output.
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  // Social crawlers sometimes aggressively cache OG lookups.
  // Short cache is fine because snapshots are immutable once written.
  const existingCc = headers.get('cache-control');
  if (!existingCc || existingCc.indexOf('no-store') === -1) {
    headers.set('cache-control', 'public, max-age=300, s-maxage=900');
  }
  return rw.transform(new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}


// ============================================================
// Sprint 7c: real form handlers
// ============================================================
//
// All three handlers follow the same pipeline:
//
//   1. Parse body (supports urlencoded, multipart, and JSON)
//   2. Check the honeypot — silently drop spam submissions with a
//      fake-success 200 so bots get no signal
//   3. Validate: required fields, email format, length guards
//   4. Build notification (to Don) + auto-responder (to the user)
//      from the templates module
//   5. Send both in parallel via Promise.allSettled so one failing
//      doesn't block the other
//   6. Decide outcome:
//        - Notification failed → 500 to user. The message didn't
//          reach Don so we have to tell them. They can email him
//          directly as a fallback
//        - Notification ok, auto-responder failed → 200 to user.
//          Their message went through; they just won't see a
//          confirmation email. We console.error for observability
//          so we can fix the issue later
//        - Both ok → 200 to user
//
// The consistent shape returned to the client is:
//   { ok: true,  status: "sent"  | "sent-without-confirmation" }
//   { ok: false, error: "..." }


async function handleIntake(request, env, ctx) {
  // Spam-defense layer 1+2: cheap edge checks before parsing the
  // body. Origin allowlist catches form-action scrapers; Cloudflare
  // threat score catches bot-network IPs.
  if (!isOriginAllowed(request)) {
    console.warn('intake:spam', { reason: 'no-origin' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  if (isHighThreatIP(request)) {
    console.warn('intake:spam', { reason: 'high-threat' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }

  const body = await parseFormBody(request);

  // Silently accept spam so bots get no signal
  if (isSpamHoneypot(body)) {
    console.warn('intake:spam', { reason: 'honeypot' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  if (!isTimestampSane(body)) {
    console.warn('intake:spam', { reason: 'timestamp' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  // Layer-2 anti-spam: Turnstile. No-op until TURNSTILE_SECRET_KEY is
  // bound (skipped: true), so this PR is a true zero-impact change in
  // production until the owner finishes the dashboard wiring. Failure
  // is silent (200 OK) to match the rest of the spam-defense surface
  // — bots get no signal, legitimate humans whose token expired get
  // an unfortunate silent-drop, but the rate is low and beats UX
  // friction for everyone else.
  const turnstile = await checkTurnstile(body, env, request);
  if (!turnstile.ok && !turnstile.skipped) {
    console.warn('intake:spam', { reason: 'turnstile', code: turnstile.error });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  const heuristic = classifySpam(body);
  if (heuristic.spam) {
    console.warn('intake:spam', { reason: 'content', signals: heuristic.reasons });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }

  // Locale comes from a hidden <input name="locale"> on the form.
  // The Spanish /es/ pages stamp "es"; English pages omit the field
  // and default to "en". Used here to surface validation errors in
  // the same language the user is reading. Anything else is treated
  // as English for safety.
  const locale = (String(body.locale || '').trim().toLowerCase() === 'es') ? 'es' : 'en';
  const err = (en, es) => (locale === 'es' ? es : en);

  // Required fields: name, email, services, goals. Business,
  // website, budget, and referral are optional per the form HTML.
  const required = requireFields(body, ['name', 'email', 'services', 'goals']);
  if (!required.ok) {
    // The validation helpers embed the missing field name in English;
    // we localize the wrapper ("Missing required field") and keep the
    // field name untouched so the developer can trace form-field
    // mismatches without a Spanish dictionary.
    const fieldName = required.error.replace(/^Missing required field:\s*/i, '');
    const message = err(required.error, 'Falta un campo obligatorio: ' + fieldName);
    return jsonResponse({ ok: false, error: message }, 400);
  }
  if (!isValidEmail(body.email)) {
    return jsonResponse({ ok: false, error: err('Please enter a valid email address', 'Ingresa un correo electrónico válido') }, 400);
  }
  const lengths = enforceMaxLengths(body);
  if (!lengths.ok) {
    // enforceMaxLengths embeds a field name + limit. Preserve the
    // structural details, just localize the framing.
    const m = lengths.error.match(/^Field '(.+?)' is longer than the (\d+)-character limit$/);
    const message = (locale === 'es' && m)
      ? 'El campo «' + m[1] + '» supera el límite de ' + m[2] + ' caracteres.'
      : lengths.error;
    return jsonResponse({ ok: false, error: message }, 400);
  }

  const notificationTmpl = intakeNotification(body);
  const autoReplyTmpl    = intakeAutoResponder(body);

  return await sendPair({
    env,
    userEmail: body.email.trim(),
    notification: notificationTmpl,
    autoReply:    autoReplyTmpl,
    endpoint:     'intake',
  });
}


async function handleChecklist(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    console.warn('checklist:spam', { reason: 'no-origin' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  if (isHighThreatIP(request)) {
    console.warn('checklist:spam', { reason: 'high-threat' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }

  const body = await parseFormBody(request);

  if (isSpamHoneypot(body)) {
    console.warn('checklist:spam', { reason: 'honeypot' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  if (!isTimestampSane(body)) {
    console.warn('checklist:spam', { reason: 'timestamp' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  // Layer-2 anti-spam: Turnstile. Skipped until secret is wired.
  {
    const turnstile = await checkTurnstile(body, env, request);
    if (!turnstile.ok && !turnstile.skipped) {
      console.warn('checklist:spam', { reason: 'turnstile', code: turnstile.error });
      return jsonResponse({ ok: true, status: 'sent' }, 200);
    }
  }
  const checklistHeuristic = classifySpam(body);
  if (checklistHeuristic.spam) {
    console.warn('checklist:spam', { reason: 'content', signals: checklistHeuristic.reasons });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }

  const required = requireFields(body, ['email']);
  if (!required.ok) {
    return jsonResponse({ ok: false, error: required.error }, 400);
  }
  if (!isValidEmail(body.email)) {
    return jsonResponse({ ok: false, error: 'Please enter a valid email address' }, 400);
  }
  const lengths = enforceMaxLengths(body);
  if (!lengths.ok) {
    return jsonResponse({ ok: false, error: lengths.error }, 400);
  }

  const notificationTmpl = checklistNotification(body);
  const autoReplyTmpl    = checklistAutoResponder(body);

  return await sendPair({
    env,
    userEmail: body.email.trim(),
    notification: notificationTmpl,
    autoReply:    autoReplyTmpl,
    endpoint:     'checklist',
  });
}


async function handleAuditReport(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    console.warn('audit-report:spam', { reason: 'no-origin' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  if (isHighThreatIP(request)) {
    console.warn('audit-report:spam', { reason: 'high-threat' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }

  const body = await parseFormBody(request);

  if (isSpamHoneypot(body)) {
    console.warn('audit-report:spam', { reason: 'honeypot' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  if (!isTimestampSane(body)) {
    console.warn('audit-report:spam', { reason: 'timestamp' });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }
  const auditHeuristic = classifySpam(body);
  if (auditHeuristic.spam) {
    console.warn('audit-report:spam', { reason: 'content', signals: auditHeuristic.reasons });
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }

  const required = requireFields(body, ['email']);
  if (!required.ok) {
    return jsonResponse({ ok: false, error: required.error }, 400);
  }
  if (!isValidEmail(body.email)) {
    return jsonResponse({ ok: false, error: 'Please enter a valid email address' }, 400);
  }
  const lengths = enforceMaxLengths(body);
  if (!lengths.ok) {
    return jsonResponse({ ok: false, error: lengths.error }, 400);
  }

  // Phase L4: dispatch on body.interest. Phase J retired its
  // deep-report email gate (Sprint L1); the two live interest
  // values are now:
  //   restaurant-audit-report       — top + bottom PDF CTAs
  //                                   (Sprint L2/L3); the audit
  //                                   PDF rides along in body.pdf_b64
  //   restaurant-audit-deep-report  — retained route for any
  //                                   legacy cached-page submits.
  //                                   Same templates + same PDF
  //                                   handling as the main flow.
  const interestStr = String(body.interest || '').trim();
  const useDeepTmpl = interestStr === 'restaurant-audit-report' ||
                      interestStr === 'restaurant-audit-deep-report';
  const notificationTmpl = useDeepTmpl
    ? auditDeepReportNotification(body)
    : auditReportNotification(body);
  const autoReplyTmpl = useDeepTmpl
    ? auditDeepReportAutoResponder(body)
    : auditReportAutoResponder(body);

  // Phase L4: if the client built a PDF of their audit, forward it
  // as a Resend attachment on BOTH the notification and the auto-
  // responder so Don sees the same deliverable the user received.
  const attachments = buildPdfAttachments(body);

  return await sendPair({
    env,
    userEmail: body.email.trim(),
    notification: notificationTmpl,
    autoReply:    autoReplyTmpl,
    attachments:  attachments,
    endpoint:     useDeepTmpl ? 'audit-deep-report' : 'audit-report',
  });
}

// Pull pdf_b64 + pdf_filename off the form body and return the
// Resend-ready attachment array. Returns an empty array when no
// valid PDF is on the body — callers just pass the result through
// to sendEmail's opts.attachments without further checks.
function buildPdfAttachments(body) {
  const b64  = typeof body.pdf_b64      === 'string' ? body.pdf_b64.trim()      : '';
  const name = typeof body.pdf_filename === 'string' ? body.pdf_filename.trim() : '';
  if (!b64) return [];
  // A PDF starts with 'JVBERi0' in base64 ('%PDF-' decoded). If the
  // prefix doesn't match we assume the client sent junk and silently
  // drop the attachment — the email still goes through.
  if (b64.indexOf('JVBERi0') !== 0 && b64.indexOf('JVBER') !== 0) return [];
  const safeName = /^[-_.A-Za-z0-9]+$/.test(name) && /\.pdf$/i.test(name)
    ? name
    : 'muntin-audit.pdf';
  return [{ filename: safeName, content: b64 }];
}


// ------------------------------------------------------------
// Shared send-pair helper
// ------------------------------------------------------------
//
// Handles the common "send notification to Don + send auto-responder
// to user" flow. Every handler calls this with its already-built
// templates. All error surfacing, outcome classification, and
// response shaping lives here so the handlers above stay focused
// on validation and template assembly.

async function sendPair({ env, userEmail, notification, autoReply, endpoint, attachments }) {
  if (!env.RESEND_API_KEY) {
    // Misconfiguration — the Worker was deployed without the
    // RESEND_API_KEY secret being set. This should never happen
    // in production (the deploy guide tells you to set it first)
    // but surface it clearly so the fix is obvious.
    console.error('[api]', endpoint, 'RESEND_API_KEY secret is not configured');
    return jsonResponse(
      { ok: false, error: "We're having a configuration issue on our end. Please email don@muntin.digital directly and I'll take care of you." },
      500
    );
  }

  const fromEmail   = env.FROM_EMAIL   || 'Muntin Digital <don@muntin.digital>';
  const notifyEmail = env.NOTIFY_EMAIL || 'don@muntin.digital';

  // Fire both in parallel. Promise.allSettled so one failing doesn't
  // short-circuit the other.
  const [notifyResult, autoResult] = await Promise.allSettled([
    sendEmail(
      {
        to:      notifyEmail,
        from:    fromEmail,
        // Reply-To set to the user's email so Don can just hit Reply
        // in his inbox to respond directly. This is the single most
        // important piece of ergonomics on the notification email.
        replyTo: userEmail,
        subject: notification.subject,
        html:    notification.html,
        text:    notification.text,
        attachments: attachments,
      },
      env.RESEND_API_KEY
    ),
    sendEmail(
      {
        to:      userEmail,
        from:    fromEmail,
        // Reply-To the real inbox so if the user hits Reply to the
        // auto-responder, their message lands with Don, not nowhere.
        replyTo: notifyEmail,
        subject: autoReply.subject,
        html:    autoReply.html,
        text:    autoReply.text,
        attachments: attachments,
      },
      env.RESEND_API_KEY
    ),
  ]);

  const notifySent = notifyResult.status === 'fulfilled' && notifyResult.value && notifyResult.value.ok;
  const autoSent   = autoResult.status === 'fulfilled' && autoResult.value && autoResult.value.ok;

  if (!notifySent) {
    // Notification failed — the submission didn't reach Don. We
    // HAVE to tell the user. They can email him directly as a
    // fallback path (mentioned in the error copy).
    const reason = notifyResult.status === 'fulfilled'
      ? (notifyResult.value && notifyResult.value.error)
      : (notifyResult.reason && notifyResult.reason.message);
    console.error('[api]', endpoint, 'notification failed:', reason);
    return jsonResponse(
      {
        ok: false,
        error: "We couldn't deliver your message just now. Please email don@muntin.digital directly — I'll get it from there.",
      },
      500
    );
  }

  if (!autoSent) {
    // Notification went through but the auto-responder failed.
    // The user's message still reached Don — we don't want to
    // scare them with an error here. Log it so we can investigate
    // (maybe the user's address bounced, maybe Resend flagged it
    // as a dupe of the notification) and return success.
    const reason = autoResult.status === 'fulfilled'
      ? (autoResult.value && autoResult.value.error)
      : (autoResult.reason && autoResult.reason.message);
    console.error('[api]', endpoint, 'auto-responder failed:', reason);
    return jsonResponse(
      { ok: true, status: 'sent-without-confirmation' },
      200
    );
  }

  // Both succeeded — the happy path
  return jsonResponse({ ok: true, status: 'sent' }, 200);
}


// ------------------------------------------------------------
// Diagnostic: /api/ping
// ------------------------------------------------------------

async function handlePing(request, env, ctx) {
  return jsonResponse(
    {
      ok: true,
      service: 'muntin-digital forms api',
      sprint: '7c',
      timestamp: new Date().toISOString(),
      routes: Object.keys(API_ROUTES),
      // Configuration readiness without leaking the actual key.
      // A false value here means the corresponding feature will
      // fall back to its unconfigured branch (PSI direct-call
      // fallback, Places lookup disabled, email send disabled,
      // …) so ops can verify secrets are plumbed without actually
      // exercising the upstreams.
      configured: {
        resend:  Boolean(env.RESEND_API_KEY),
        from:    Boolean(env.FROM_EMAIL),
        notify:  Boolean(env.NOTIFY_EMAIL),
        psi:     Boolean(env.PSI_API_KEY),
        places:  Boolean(env.GOOGLE_PLACES_KEY),
        // Sprint T3: binding-present flag so ops can verify the KV
        // cache + future AI Gateway bindings are wired without
        // exercising them.
        auditCache: Boolean(env.AUDIT_CACHE),
        aiGateway:  Boolean(env.AI),
      },
    },
    200
  );
}


// ------------------------------------------------------------
// GBP Lookup — proxies Google Places API, keeping the key
// server-side. Client sends GET /api/gbp-lookup?q=business+name
// and receives a JSON payload with rating, review count, types,
// hours, photos count, and address.
// ------------------------------------------------------------

async function handleGbpLookup(request, env, ctx) {
  const apiKey = env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return jsonResponse({ ok: false, error: 'Google Places API key not configured' }, 503);
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  if (!query) {
    return jsonResponse({ ok: false, error: 'Missing ?q= parameter — pass your business name + city' }, 400);
  }

  try {
    // Step 1: Text Search to find the place
    const searchRes = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          // Sprint M1.1: expanded field mask. The previous mask fetched
          // only enough to answer "is this the right business?" The new
          // mask asks Places for every signal the audit can use to
          // eliminate its Yes/No unverified-check dance:
          //   * priceLevel           → drives schema.priceRange fuse
          //   * businessStatus       → confidence signal (open / closed)
          //   * dineIn/takeout/delivery → resolves conversions unverified
          //   * serves*              → resolves dietary, corroborates subtype
          //   * reservable           → resolves reservations unverified
          //   * primaryTypeDisplayName → corroborates subtype detector
          //   * editorialSummary     → feeds brand copy + detector hints
          //   * nationalPhoneNumber  → resolves phone unverified
          //   * currentOpeningHours.weekdayDescriptions → human hours text
          //   * location             → resolves map unverified (lat/lng)
          // Every added field is SKU-compatible with the existing call
          // (standard SKUs only, no Pro-only fields), so cost per
          // lookup is unchanged.
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.rating',
            'places.userRatingCount',
            'places.types',
            'places.regularOpeningHours',
            'places.currentOpeningHours.weekdayDescriptions',
            'places.photos',
            'places.websiteUri',
            'places.googleMapsUri',
            'places.priceLevel',
            'places.businessStatus',
            'places.dineIn',
            'places.takeout',
            'places.delivery',
            'places.reservable',
            'places.servesBreakfast',
            'places.servesLunch',
            'places.servesDinner',
            'places.servesBrunch',
            'places.servesVegetarianFood',
            'places.servesBeer',
            'places.servesWine',
            'places.servesCocktails',
            'places.servesCoffee',
            'places.servesDessert',
            'places.primaryTypeDisplayName',
            'places.editorialSummary',
            'places.nationalPhoneNumber',
            'places.location'
          ].join(',')
        },
        // Sprint G1: request the top 5 candidates so the client can
        // disambiguate on common names like "Joe's Pizza" where
        // Places' first match may not be the business the owner
        // actually runs. maxResultCount=5 is Places' recommended
        // upper bound for text search; beyond that the tail is noise.
        body: JSON.stringify({ textQuery: query, maxResultCount: 5 })
      }
    );

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      console.error('[gbp-lookup] Places API error:', searchRes.status, errBody);
      return jsonResponse({ ok: false, error: 'Google Places API returned an error' }, 502);
    }

    const searchData = await searchRes.json();
    const places = searchData.places || [];
    if (!places.length) {
      return jsonResponse({ ok: false, error: 'No business found for that search. Try adding your city name.' }, 404);
    }

    function buildCandidate(p) {
      // Sprint M1.1: pass every newly-requested field through to the
      // client. Null/undefined-safe because Places omits fields Google
      // can't verify (e.g. a restaurant with no confirmed takeout
      // returns no `takeout` key rather than `false`). Detectors in
      // restaurant-checks.js treat `null` as "unknown" and `true/false`
      // as confident.
      const weekdayHours = p.currentOpeningHours && p.currentOpeningHours.weekdayDescriptions
        ? p.currentOpeningHours.weekdayDescriptions : null;
      return {
        placeId:    p.id || null,
        name:       p.displayName ? p.displayName.text : null,
        address:    p.formattedAddress || null,
        rating:     p.rating || null,
        reviewCount: p.userRatingCount || 0,
        types:      (p.types || []).slice(0, 5),
        photoCount: p.photos ? p.photos.length : 0,
        hasHours:   !!(p.regularOpeningHours && p.regularOpeningHours.periods && p.regularOpeningHours.periods.length),
        website:    p.websiteUri || null,
        mapsUrl:    p.googleMapsUri || null,
        // New in M1.1 — these are the signals every detector fuse
        // (M1.5–M1.14) reads from to eliminate unverified statuses.
        priceLevel:              typeof p.priceLevel === 'string' ? p.priceLevel : null,
        businessStatus:          p.businessStatus || null,
        dineIn:                  typeof p.dineIn   === 'boolean' ? p.dineIn   : null,
        takeout:                 typeof p.takeout  === 'boolean' ? p.takeout  : null,
        delivery:                typeof p.delivery === 'boolean' ? p.delivery : null,
        reservable:              typeof p.reservable === 'boolean' ? p.reservable : null,
        servesBreakfast:         typeof p.servesBreakfast        === 'boolean' ? p.servesBreakfast        : null,
        servesLunch:             typeof p.servesLunch            === 'boolean' ? p.servesLunch            : null,
        servesDinner:            typeof p.servesDinner           === 'boolean' ? p.servesDinner           : null,
        servesBrunch:            typeof p.servesBrunch           === 'boolean' ? p.servesBrunch           : null,
        servesVegetarianFood:    typeof p.servesVegetarianFood   === 'boolean' ? p.servesVegetarianFood   : null,
        servesBeer:              typeof p.servesBeer             === 'boolean' ? p.servesBeer             : null,
        servesWine:              typeof p.servesWine             === 'boolean' ? p.servesWine             : null,
        servesCocktails:         typeof p.servesCocktails        === 'boolean' ? p.servesCocktails        : null,
        servesCoffee:            typeof p.servesCoffee           === 'boolean' ? p.servesCoffee           : null,
        servesDessert:           typeof p.servesDessert          === 'boolean' ? p.servesDessert          : null,
        primaryTypeDisplayName:  p.primaryTypeDisplayName && p.primaryTypeDisplayName.text
                                   ? p.primaryTypeDisplayName.text : null,
        editorialSummary:        p.editorialSummary && p.editorialSummary.text
                                   ? p.editorialSummary.text : null,
        nationalPhoneNumber:     p.nationalPhoneNumber || null,
        weekdayHoursText:        weekdayHours,
        location:                p.location && typeof p.location.latitude === 'number' && typeof p.location.longitude === 'number'
                                   ? { lat: p.location.latitude, lng: p.location.longitude }
                                   : null
      };
    }

    const candidates = places.map(buildCandidate);
    const top = candidates[0];

    // Preserve the historical top-level shape for backwards-compat
    // with any caller that wasn't expecting the `candidates` array,
    // while adding the full top-5 under `candidates` for the new
    // disambiguation UI (G3, future sprint).
    const result = Object.assign({ ok: true }, top, {
      candidates: candidates
    });

    return jsonResponse(result, 200);
  } catch (err) {
    console.error('[gbp-lookup] exception:', err && err.stack ? err.stack : err);
    return jsonResponse({ ok: false, error: 'Failed to reach Google Places API' }, 502);
  }
}


// ------------------------------------------------------------
// SEO Check — fetches a page server-side and extracts the
// <title> and <meta name="description"> content that Lighthouse
// doesn't reliably expose in its audit details.
// ------------------------------------------------------------

async function handleSeoCheck(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  // Sprint E2: SSRF guard — refuse non-http(s), private IP ranges,
  // localhost aliases, URLs with embedded credentials, and URLs
  // longer than 2048 chars.
  const gate = assertSafeHttpUrl(target, pickLang(request));
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(gate.url.toString(), {
      headers: { 'User-Agent': 'MuntinDigital-SEO-Check/1.0' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return jsonResponse({ ok: false, error: 'Could not fetch the page (HTTP ' + res.status + ')' }, 502);
    }

    // Cap at 1.5 MB. Title + meta description live in <head>; we only
    // need the first chunk of the document. A pathological upstream
    // can't force the Worker to buffer a multi-MB body.
    const read = await readTextCapped(res, 1_500_000);
    const html = read.text;

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null;

    // Extract <meta name="description" content="...">
    const descMatch = html.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*>/i)
      || html.match(/<meta[^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*name\s*=\s*["']description["'][^>]*>/i);
    const description = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : null;

    return jsonResponse({ ok: true, title, description }, 200);
  } catch (err) {
    console.error('[seo-check] exception:', err && err.stack ? err.stack : err);
    return jsonResponse({ ok: false, error: 'Failed to fetch the page' }, 502);
  }
}


// ------------------------------------------------------------
// Schema Check — fetches a page server-side and extracts all
// JSON-LD @type values from <script type="application/ld+json">
// blocks. Fallback for when Lighthouse's structured-data audit
// doesn't return data.
// ------------------------------------------------------------

async function handleSchemaCheck(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  // Sprint E3: SSRF guard — same ruleset as E2.
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }

  try {
    const res = await fetch(gate.url.toString(), {
      headers: { 'User-Agent': 'MuntinDigital-Schema-Check/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const m = lang === 'es'
        ? 'No se pudo cargar la página (HTTP ' + res.status + ')'
        : 'Could not fetch the page (HTTP ' + res.status + ')';
      return jsonResponse({ ok: false, error: m }, 502);
    }

    // Cap at 1.5 MB. JSON-LD blocks are always inline in <head> or
    // early <body>; streaming with a hard cap prevents a 10 MB asset
    // dump from exhausting Worker memory before truncation can run.
    const schemaRead = await readTextCapped(res, 1_500_000);
    const html = schemaRead.text;
    const parsed = extractJsonLd(html);
    const validation = validateRestaurantSchema(parsed.objects, lang);

    return jsonResponse({
      ok: true,
      types: parsed.types,
      blockCount: parsed.blockCount,
      parseErrorCount: parsed.parseErrorCount,
      objects: parsed.objects,
      validation: validation
    }, 200);
  } catch (err) {
    console.error('[schema-check] exception:', err && err.stack ? err.stack : err);
    return jsonResponse({ ok: false, error: 'Failed to fetch the page' }, 502);
  }
}

// Schema types we treat as "Restaurant-like" for validation.
// Matches the breadth we want the audit to recognize — a bakery
// with @type: Bakery should still be validated against the
// Restaurant checklist (hours, address, phone) because the audit
// cares about local-business signal regardless of subtype.
const RESTAURANT_LIKE_SCHEMA_TYPES = {
  'Restaurant':           true,
  'FastFoodRestaurant':   true,
  'FoodEstablishment':    true,
  'CafeOrCoffeeShop':     true,
  'Cafe':                 true,
  'Bakery':               true,
  'BarOrPub':             true,
  'Brewery':              true,
  'Winery':               true,
  'Distillery':           true,
  'IceCreamShop':         true,
  'LocalBusiness':        true,
  'FoodService':          true
};

// Return true if an object's @type (string or array) includes any
// Restaurant-like schema type.
function isRestaurantLikeSchema(obj) {
  if (!obj) return false;
  const t = obj['@type'];
  if (typeof t === 'string') return !!RESTAURANT_LIKE_SCHEMA_TYPES[t];
  if (Array.isArray(t)) {
    for (let i = 0; i < t.length; i++) {
      if (typeof t[i] === 'string' && RESTAURANT_LIKE_SCHEMA_TYPES[t[i]]) return true;
    }
  }
  return false;
}

// ------------------------------------------------------------
// Restaurant schema validation — Phase F
// ------------------------------------------------------------
// Walks the parsed JSON-LD objects and reports on the fields the
// restaurant audit cares about. Each sprint in Phase F adds a new
// field-level check to the returned validation object:
//
//   F2: openingHours      — presence + 7-day completeness
//   F3: priceRange, servesCuisine (planned)
//   F4: acceptsReservations, hasMenu (planned)
//   F5: hours mismatch vs Places (planned; consumer-side)
//   F6: NAP consistency  (planned; consumer-side)
// Sprint ES3: localized reason strings for the H1-H4 validators.
// Each validator sets .reasonKey; finalizeSchemaReasons() maps it to
// EN or ES text based on the request locale. Keys stay stable for
// client-side rendering + parity checks.
const SCHEMA_REASONS = {
  'hours.missing':        { en: 'No openingHours or openingHoursSpecification on the Restaurant schema.',
                            es: 'No hay openingHours ni openingHoursSpecification en el schema del restaurante.' },
  'hours.partial':        { en: 'Only {dayCount} of 7 days covered — Google shows the rich-hours panel only when every day is present.',
                            es: 'Solo {dayCount} de 7 días cubiertos — Google muestra el panel de horarios enriquecidos solo cuando están todos los días.' },
  'hours.badTimes':       { en: '{timeFieldsBad} time values are not in HH:MM format — Google may silently drop the hours panel.',
                            es: '{timeFieldsBad} valores de hora no están en formato HH:MM — Google puede omitir silenciosamente el panel de horarios.' },
  'hours.parseErrors':    { en: '{parseErrors} day name could not be parsed — use Mo/Tu/We/Th/Fr/Sa/Su or full English names.',
                            es: 'No se pudo interpretar {parseErrors} nombre de día — usa Mo/Tu/We/Th/Fr/Sa/Su o nombres en inglés completos.' },
  'price.missing':        { en: 'No priceRange on the Restaurant schema. Google uses this to filter by price level.',
                            es: 'No hay priceRange en el schema del restaurante. Google lo usa para filtrar por nivel de precio.' },
  'price.badShape':       { en: 'priceRange "{value}" does not match a recognized shape (e.g. "$$", "$15-30", or "$25").',
                            es: 'priceRange "{value}" no coincide con un formato reconocido (p. ej. "$$", "$15-30" o "$25").' },
  'address.missing':      { en: 'No address on the Restaurant schema.',
                            es: 'No hay address en el schema del restaurante.' },
  'address.string':       { en: 'Address is a bare string; Google prefers a structured PostalAddress with streetAddress, addressLocality, addressRegion, and postalCode.',
                            es: 'La dirección es solo una cadena; Google prefiere un PostalAddress estructurado con streetAddress, addressLocality, addressRegion y postalCode.' },
  'address.missingFields':{ en: 'Address is missing: {fields}. Add these fields to qualify for local-search rich results.',
                            es: 'A la dirección le falta: {fields}. Agrega estos campos para calificar para resultados enriquecidos de búsqueda local.' },
  // Sprint M1.2: reasons for the three validators that previously
  // returned presence-only booleans. These feed the client's schema
  // gaps list and let ES renders show grammatical Spanish.
  'cuisine.missing':      { en: 'No servesCuisine on the Restaurant schema. Google uses this to match queries like "Mexican near me".',
                            es: 'No hay servesCuisine en el schema del restaurante. Google lo usa para emparejar búsquedas como "mexicano cerca de mí".' },
  'cuisine.tooGeneric':   { en: 'servesCuisine is only "{value}" — pair it with one or two specific cuisines (e.g. "Italian, Neapolitan Pizza") for better local-search match.',
                            es: 'servesCuisine solo dice "{value}" — acompáñalo con una o dos cocinas específicas (p. ej. "Italiana, Pizza Napolitana") para mejorar la coincidencia en búsquedas locales.' },
  'reservations.missing': { en: 'No acceptsReservations on the Restaurant schema. Even declaring `false` helps Google route reservation-intent queries away from you when you want walk-ins only.',
                            es: 'No hay acceptsReservations en el schema del restaurante. Incluso declarar `false` ayuda a Google a desviar búsquedas con intención de reserva cuando solo tomas walk-ins.' },
  'reservations.malformed':{ en: 'acceptsReservations is "{value}" — Google expects `true`, `false`, or a Reservation sub-object, not free-form text.',
                            es: 'acceptsReservations es "{value}" — Google espera `true`, `false` o un sub-objeto Reservation, no texto libre.' },
  'menu.missing':         { en: 'No hasMenu on the Restaurant schema. Adding a menu URL (or Menu sub-object) unlocks Google\'s menu rich-result card.',
                            es: 'No hay hasMenu en el schema del restaurante. Agregar una URL de menú (o un sub-objeto Menu) desbloquea la tarjeta enriquecida de menú en Google.' },
  'menu.badUrl':          { en: 'hasMenu is declared but the URL isn\'t http(s) — Google will silently drop the menu panel.',
                            es: 'hasMenu está declarado pero la URL no es http(s) — Google omitirá silenciosamente el panel del menú.' }
};
function formatReason(reasonKey, vars, lang) {
  if (!reasonKey) return null;
  const entry = SCHEMA_REASONS[reasonKey];
  if (!entry) return reasonKey;
  const tmpl = (lang === 'es' && entry.es) || entry.en;
  if (!vars) return tmpl;
  return tmpl.replace(/\{(\w+)\}/g, function(_m, k){
    return vars[k] != null ? String(vars[k]) : '';
  });
}

function validateRestaurantSchema(objects, lang) {
  const restaurantObjects = (objects || []).filter(isRestaurantLikeSchema);
  const L = lang || 'en';
  const hours = validateOpeningHours(restaurantObjects);
  if (hours.reasonKey) hours.reason = formatReason(hours.reasonKey, hours.reasonVars, L);
  const price = validatePriceRange(restaurantObjects);
  if (price.reasonKey) price.reason = formatReason(price.reasonKey, price.reasonVars, L);
  const address = validateAddress(restaurantObjects);
  if (address.reasonKey) address.reason = formatReason(address.reasonKey, address.reasonVars, L);
  // Sprint M1.2: finish the three validators that used to return
  // presence-only booleans — cuisine, reservations, and menu — and
  // resolve their localized reason strings on the way out.
  const cuisine = validateServesCuisine(restaurantObjects);
  if (cuisine.reasonKey) cuisine.reason = formatReason(cuisine.reasonKey, cuisine.reasonVars, L);
  const reservations = validateAcceptsReservations(restaurantObjects);
  if (reservations.reasonKey) reservations.reason = formatReason(reservations.reasonKey, reservations.reasonVars, L);
  const menu = validateHasMenu(restaurantObjects);
  if (menu.reasonKey) menu.reason = formatReason(menu.reasonKey, menu.reasonVars, L);
  return {
    restaurantObjectCount: restaurantObjects.length,
    openingHours:        hours,
    priceRange:          price,
    servesCuisine:       cuisine,
    acceptsReservations: reservations,
    hasMenu:             menu,
    address:             address
  };
}

// Sprint H3: address validation. Looks at the .address field on
// each restaurant-like object. Address can be a string (discouraged
// but legal), or a PostalAddress object with named sub-fields. We
// report { present, valid, reason, missingFields } so the renderer
// can surface "you have an address but postalCode is missing" —
// exactly the kind of gap that prevents Rich Results eligibility.
function validateAddress(restaurantObjects) {
  let present = false;
  const wanted = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode'];
  const found = Object.create(null);
  let rawAddress = null;
  for (let i = 0; i < restaurantObjects.length; i++) {
    const addr = restaurantObjects[i].address;
    if (!addr) continue;
    present = true;
    if (typeof addr === 'string') {
      rawAddress = addr;
      continue; // string form — can't audit sub-fields, just presence
    }
    if (typeof addr === 'object') {
      rawAddress = rawAddress || addr;
      wanted.forEach(function(k){
        if (typeof addr[k] === 'string' && addr[k].trim()) found[k] = true;
      });
    }
  }
  const missingFields = wanted.filter(function(k){ return !found[k]; });
  const valid = present && missingFields.length === 0;
  let reasonKey = null;
  let reasonVars = null;
  if (!present) reasonKey = 'address.missing';
  else if (typeof rawAddress === 'string') reasonKey = 'address.string';
  else if (missingFields.length) {
    reasonKey = 'address.missingFields';
    reasonVars = { fields: missingFields.join(', ') };
  }
  return {
    present: present, valid: valid,
    reasonKey: reasonKey, reasonVars: reasonVars, reason: null,
    missingFields: missingFields
  };
}

// F4: acceptsReservations validation. schema.org permits either a
// boolean or a Reservation type object; we accept both. Missing is
// meaningful on fine-dining / casual-dining sites but irrelevant
// for ghost-kitchen / food-truck — the subtype-weight map in
// subtypes.js already encodes that, so here we just report the
// raw signal.
function validateAcceptsReservations(restaurantObjects) {
  let present = false;
  let value = null;
  for (let i = 0; i < restaurantObjects.length; i++) {
    const raw = restaurantObjects[i].acceptsReservations;
    if (raw === undefined || raw === null) continue;
    present = true;
    value = raw;
    break;
  }
  // Normalize: true/false/'True'/'https://schema.org/True' all
  // collapse to boolean so the audit can just check `accepts`.
  let accepts = null;
  if (typeof value === 'boolean') accepts = value;
  else if (typeof value === 'string') {
    const v = value.toLowerCase().replace(/^https?:\/\/schema\.org\//, '').trim();
    if (v === 'true')  accepts = true;
    if (v === 'false') accepts = false;
  } else if (value && typeof value === 'object') {
    // A Reservation sub-object counts as "yes, we accept"
    accepts = true;
  }
  // Sprint M1.2: match the {present, valid, reasonKey, reasonVars,
  // reason, value} shape the other validators return. `valid` means
  // "Google can understand it" — not "this restaurant accepts
  // reservations." A strictly-false declaration is still valid.
  let reasonKey = null;
  let reasonVars = null;
  if (!present) reasonKey = 'reservations.missing';
  else if (accepts === null) {
    reasonKey = 'reservations.malformed';
    reasonVars = { value: typeof value === 'string' ? value : JSON.stringify(value) };
  }
  return {
    present: present,
    valid: present && accepts !== null,
    reasonKey: reasonKey,
    reasonVars: reasonVars,
    reason: null,
    accepts: accepts,
    value: value
  };
}

// F4: hasMenu validation. Accepts either a URL string or a
// { '@type': 'Menu', url: '…' } object. Validates that at least
// one URL parses as an HTTP(S) URL — we don't fetch it here
// (that's the crawl endpoint's job), but an unparseable URL
// is a schema error worth flagging.
function validateHasMenu(restaurantObjects) {
  let present = false;
  let urlValid = false;
  const urls = [];
  for (let i = 0; i < restaurantObjects.length; i++) {
    const raw = restaurantObjects[i].hasMenu;
    if (raw === undefined || raw === null) continue;
    present = true;
    pushMenu(raw);
  }
  function pushMenu(val) {
    if (!val) return;
    if (typeof val === 'string') {
      urls.push(val);
      if (isValidHttpUrl(val)) urlValid = true;
      return;
    }
    if (Array.isArray(val)) { val.forEach(pushMenu); return; }
    if (typeof val === 'object') {
      // Menu sub-object — pull its `url` field (or hasPart arrays,
      // but we keep the shape small for now).
      if (typeof val.url === 'string') pushMenu(val.url);
    }
  }
  // Sprint M1.2: adopt the unified {present, valid, reasonKey,
  // reasonVars, reason, value} shape. `valid` means hasMenu is
  // present AND at least one URL is http(s)-parseable. `urls` kept
  // for backwards compatibility with any consumer that already
  // expected it on the response.
  let reasonKey = null;
  if (!present) reasonKey = 'menu.missing';
  else if (!urlValid) reasonKey = 'menu.badUrl';
  return {
    present: present,
    valid: present && urlValid,
    reasonKey: reasonKey,
    reasonVars: null,
    reason: null,
    urls: urls,
    urlValid: urlValid
  };
}

function isValidHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) { return false; }
}

// ------------------------------------------------------------
// Schema-vs-Places hours cross-check — Phase F5
// ------------------------------------------------------------
// Compares what the site publishes in JSON-LD vs what Google Places
// has on file for the same business. Stale schema is a real-world
// problem: a restaurant updates its hours on Google Business Profile
// but not in its website's schema markup, and the Rich Results
// snippet then serves Sunday-closed to customers who could have
// walked in.
//
// Inputs:
//   schemaOpeningHours - validation.openingHours from
//                        validateRestaurantSchema (F2). Uses the
//                        raw restaurantObjects to rebuild per-day
//                        coverage if needed.
//   placesRegularHours - the Places v1 regularOpeningHours shape:
//                        { periods: [{ open: {day,...}, close: {day,...} }], ... }
//                        day is 0-6 with SUN=0 per Google's convention.
//
// Output:
//   {
//     checkable:     boolean,        // both sources present
//     schemaDays:    string[],       // ['Mo','Tu','We',...] from schema
//     placesDays:    string[],       // ditto from Places
//     agreed:        string[],       // days both agree are OPEN
//     onlyInSchema:  string[],       // days schema says open, Places silent
//     onlyInPlaces:  string[],       // days Places says open, schema silent
//     match:         boolean         // no disagreement
//   }
function compareSchemaVsPlacesHours(restaurantObjects, placesRegularHours) {
  const schemaDays = schemaDaysFromObjects(restaurantObjects);
  const placesDays = placesDaysFromRegularHours(placesRegularHours);

  const checkable = schemaDays.length > 0 && placesDays.length > 0;
  const onlyInSchema = schemaDays.filter(function(d){ return placesDays.indexOf(d) < 0; });
  const onlyInPlaces = placesDays.filter(function(d){ return schemaDays.indexOf(d) < 0; });
  const agreed       = schemaDays.filter(function(d){ return placesDays.indexOf(d) >= 0; });

  return {
    checkable:    checkable,
    schemaDays:   schemaDays,
    placesDays:   placesDays,
    agreed:       agreed,
    onlyInSchema: onlyInSchema,
    onlyInPlaces: onlyInPlaces,
    match:        checkable && onlyInSchema.length === 0 && onlyInPlaces.length === 0
  };
}

// Extract the set of 'Mo'/'Tu'/.../'Su' codes that schema covers.
// Mirrors the day-name parsing in validateOpeningHours but returns
// the set directly instead of the {present,dayCount,complete,…} summary.
function schemaDaysFromObjects(restaurantObjects) {
  const DAY_NAMES = {
    'monday':'Mo','mo':'Mo','mon':'Mo',
    'tuesday':'Tu','tu':'Tu','tue':'Tu','tues':'Tu',
    'wednesday':'We','we':'We','wed':'We',
    'thursday':'Th','th':'Th','thu':'Th','thur':'Th','thurs':'Th',
    'friday':'Fr','fr':'Fr','fri':'Fr',
    'saturday':'Sa','sa':'Sa','sat':'Sa',
    'sunday':'Su','su':'Su','sun':'Su'
  };
  const covered = Object.create(null);
  function addDay(raw) {
    if (!raw) return;
    const s = String(raw).toLowerCase().replace(/^https?:\/\/schema\.org\//, '').trim();
    if (DAY_NAMES[s]) { covered[DAY_NAMES[s]] = true; return; }
    const tail = s.split('/').pop();
    if (DAY_NAMES[tail]) { covered[DAY_NAMES[tail]] = true; }
  }
  (restaurantObjects || []).forEach(function(obj){
    const spec = obj.openingHoursSpecification;
    if (Array.isArray(spec)) spec.forEach(function(e){
      if (!e) return;
      const d = e.dayOfWeek;
      if (Array.isArray(d)) d.forEach(addDay);
      else addDay(d);
    });
    else if (spec && typeof spec === 'object') {
      const d = spec.dayOfWeek;
      if (Array.isArray(d)) d.forEach(addDay);
      else addDay(d);
    }
    const legacy = obj.openingHours;
    if (typeof legacy === 'string' || Array.isArray(legacy)) {
      const strs = Array.isArray(legacy) ? legacy : [legacy];
      const rangeRe = /\b(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?\b/g;
      const order = ['Mo','Tu','We','Th','Fr','Sa','Su'];
      strs.forEach(function(s){
        let m;
        while ((m = rangeRe.exec(s)) !== null) {
          const start = order.indexOf(m[1]);
          const end   = m[2] ? order.indexOf(m[2]) : start;
          if (start < 0 || end < 0) continue;
          let i = start;
          while (true) {
            covered[order[i]] = true;
            if (i === end) break;
            i = (i + 1) % 7;
          }
        }
      });
    }
  });
  return Object.keys(covered);
}

// Map Places v1 regularOpeningHours.periods to day codes. Google
// convention: periods[].open.day is 0-6 with SUNDAY = 0. We also
// honor the legacy Places v0 shape where period.open.day is 0-6
// via the same offset, and periods that carry a string day like
// 'MONDAY'.
// ------------------------------------------------------------
// NAP (name/address/phone) consistency — Phase F6
// ------------------------------------------------------------
// Compares what the site's JSON-LD publishes against what Places
// has on file. NAP drift (different street address on the website
// than on Google Business Profile, a phone number that changed on
// one but not the other) is a classic local-SEO problem — Google
// trusts Places first, and the drift actively hurts rankings
// until it's resolved.
//
// Inputs:
//   restaurantObjects - the filtered list from
//                       validateRestaurantSchema. Uses .name,
//                       .address.{streetAddress,addressLocality,
//                       addressRegion,postalCode}, .telephone.
//   placesData        - the Places v1 shape our /api/gbp-lookup
//                       already returns: { displayName:{text},
//                       formattedAddress, nationalPhoneNumber,
//                       internationalPhoneNumber }.
//
// Output: per-field { checkable, match, schemaValue, placesValue }.
function compareSchemaVsPlacesNap(restaurantObjects, placesData) {
  const schemaName    = firstStringField(restaurantObjects, 'name');
  const schemaAddr    = firstAddressField(restaurantObjects);
  const schemaPhone   = firstStringField(restaurantObjects, 'telephone');

  const placesName    = placesData && placesData.displayName && placesData.displayName.text
                        ? String(placesData.displayName.text) : null;
  const placesAddr    = placesData && placesData.formattedAddress
                        ? String(placesData.formattedAddress) : null;
  const placesPhone   = (placesData && (placesData.nationalPhoneNumber || placesData.internationalPhoneNumber)) || null;

  return {
    name:    compareNames(schemaName, placesName),
    address: compareAddresses(schemaAddr, placesAddr),
    phone:   comparePhones(schemaPhone, placesPhone)
  };
}

function firstStringField(objects, key) {
  for (let i = 0; i < (objects || []).length; i++) {
    const v = objects[i][key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function firstAddressField(objects) {
  for (let i = 0; i < (objects || []).length; i++) {
    const a = objects[i].address;
    if (a && typeof a === 'object') return a;
  }
  return null;
}

// Normalize: lowercase, strip punctuation + whitespace, drop common
// suffixes ('restaurant', 'bar & grill') so 'Joe's Pizza' and
// 'Joes Pizza Restaurant' match. Loose by design — NAP checks
// should forgive typographic drift, not demand byte-equality.
function normalizeName(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .replace(/(restaurant|bistro|cafe|bar|pizzeria|bakery|kitchen)$/g, '');
}

function compareNames(schemaName, placesName) {
  const checkable = !!(schemaName && placesName);
  const a = normalizeName(schemaName);
  const b = normalizeName(placesName);
  let match = false;
  if (checkable) {
    // Either fully matches or one contains the other (handles
    // "Joe's Pizza" vs "Joe's Pizza & Pasta").
    match = a === b || a.includes(b) || b.includes(a);
  }
  return { checkable: checkable, match: match, schemaValue: schemaName, placesValue: placesName };
}

// Flatten a schema.org PostalAddress into a single string for
// substring matching. Preserves digits (street numbers, ZIP)
// because those are the highest-signal fields.
function flattenSchemaAddress(addr) {
  if (!addr || typeof addr !== 'object') return '';
  const parts = [
    addr.streetAddress,
    addr.addressLocality,
    addr.addressRegion,
    addr.postalCode,
    addr.addressCountry
  ];
  return parts.filter(function(p){ return typeof p === 'string'; }).join(' ');
}

function normalizeAddress(s) {
  if (!s) return '';
  return String(s).toLowerCase()
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bsuite\b/g, 'ste')
    .replace(/\bapartment\b/g, 'apt')
    .replace(/\bnorth\b/g, 'n')
    .replace(/\bsouth\b/g, 's')
    .replace(/\beast\b/g, 'e')
    .replace(/\bwest\b/g, 'w')
    .replace(/\b(usa|united states|united states of america)\b/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function compareAddresses(schemaAddr, placesFormattedAddr) {
  const flat = flattenSchemaAddress(schemaAddr);
  const checkable = !!(flat && placesFormattedAddr);
  const a = normalizeAddress(flat);
  const b = normalizeAddress(placesFormattedAddr);
  let match = false;
  if (checkable) {
    // Substring match handles a schema that omits country or
    // suite numbers present in Places' formatted string.
    match = a === b || a.includes(b) || b.includes(a);
  }
  return {
    checkable:   checkable,
    match:       match,
    schemaValue: flat || null,
    placesValue: placesFormattedAddr
  };
}

function normalizePhoneDigits(s) {
  if (!s) return '';
  // Keep only digits; drop leading '1' if present for US-style
  // numbers so '+1 (212) 555-1212' matches '(212) 555-1212'.
  let digits = String(s).replace(/\D+/g, '');
  if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
  return digits;
}

function comparePhones(schemaPhone, placesPhone) {
  const a = normalizePhoneDigits(schemaPhone);
  const b = normalizePhoneDigits(placesPhone);
  const checkable = !!(a && b);
  let match = false;
  if (checkable) match = a === b;
  return { checkable: checkable, match: match, schemaValue: schemaPhone, placesValue: placesPhone };
}

function placesDaysFromRegularHours(regularOpeningHours) {
  const INDEX_TO_CODE = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const STR_TO_CODE = {
    'sunday':'Su','monday':'Mo','tuesday':'Tu','wednesday':'We',
    'thursday':'Th','friday':'Fr','saturday':'Sa'
  };
  const covered = Object.create(null);
  const periods = regularOpeningHours && regularOpeningHours.periods;
  if (!Array.isArray(periods)) return [];
  periods.forEach(function(p){
    const open = p && p.open;
    if (!open) return;
    if (typeof open.day === 'number' && open.day >= 0 && open.day <= 6) {
      covered[INDEX_TO_CODE[open.day]] = true;
      return;
    }
    if (typeof open.day === 'string') {
      const code = STR_TO_CODE[open.day.toLowerCase()];
      if (code) covered[code] = true;
    }
  });
  return Object.keys(covered);
}

// F3: priceRange validation. Schema.org priceRange is free-form but
// Google's Rich Results docs strongly prefer the $-symbol form
// ('$', '$$', '$$$', '$$$$'). We accept numeric-range strings too
// ('15-30', '$15 to $30') since they still describe the signal
// well; the validation just flags 'present + looks reasonable'
// vs 'present but junk' vs 'missing'.
function validatePriceRange(restaurantObjects) {
  let present = false;
  let wellFormed = false;
  let value = null;
  for (let i = 0; i < restaurantObjects.length; i++) {
    const raw = restaurantObjects[i].priceRange;
    if (typeof raw !== 'string' || !raw.trim()) continue;
    present = true;
    value = value || raw.trim();
    // Dollar-sign shorthand (1-4 $'s, possibly with hyphen between)
    if (/^\${1,4}(?:\s*-\s*\${1,4})?$/.test(raw.trim())) wellFormed = true;
    // Numeric range like '$15-30' or '15-30' or '$15 to $30'
    else if (/\$?\d+\s*(?:-|to|–)\s*\$?\d+/i.test(raw)) wellFormed = true;
    // Single number fallback ('$25') — legal but loses the range signal
    else if (/^\$?\d+(?:\.\d{1,2})?$/.test(raw.trim())) wellFormed = true;
  }
  // Sprint H2/H4: single-sentence reason + valid flag so this field
  // can be rendered alongside openingHours/address in a consistent
  // shape. "Present but mal-formed" is a real-world failure mode we
  // want to surface distinctly from "missing entirely".
  let reasonKey = null;
  let reasonVars = null;
  if (!present) reasonKey = 'price.missing';
  else if (!wellFormed) { reasonKey = 'price.badShape'; reasonVars = { value: value || '' }; }
  return {
    present: present,
    wellFormed: wellFormed,
    value: value,
    valid: present && wellFormed,
    reasonKey: reasonKey, reasonVars: reasonVars, reason: null
  };
}

// F3: servesCuisine validation. Accepts a single string or an
// array of strings. Reports count (how many cuisines declared) and
// a flat list (lowercased, deduped) so downstream callers can
// cross-reference against menu-text keywords without extra parsing.
function validateServesCuisine(restaurantObjects) {
  const seen = Object.create(null);
  const cuisines = [];
  for (let i = 0; i < restaurantObjects.length; i++) {
    const raw = restaurantObjects[i].servesCuisine;
    if (typeof raw === 'string') {
      const v = raw.trim().toLowerCase();
      if (v && !seen[v]) { seen[v] = true; cuisines.push(v); }
    } else if (Array.isArray(raw)) {
      raw.forEach(function(x){
        if (typeof x !== 'string') return;
        const v = x.trim().toLowerCase();
        if (v && !seen[v]) { seen[v] = true; cuisines.push(v); }
      });
    }
  }
  // Sprint M1.2: unified shape + a "tooGeneric" flag for the
  // single-value "restaurant"/"food" pattern that doesn't buy any
  // local-search match. Single specific cuisine (e.g. "Italian") is
  // valid; single generic term with no specifier is weakly valid.
  const GENERIC = { 'restaurant': 1, 'food': 1, 'dining': 1, 'cuisine': 1 };
  const present = cuisines.length > 0;
  const tooGeneric = cuisines.length === 1 && !!GENERIC[cuisines[0]];
  let reasonKey = null;
  let reasonVars = null;
  if (!present) reasonKey = 'cuisine.missing';
  else if (tooGeneric) { reasonKey = 'cuisine.tooGeneric'; reasonVars = { value: cuisines[0] }; }
  return {
    present: present,
    valid: present && !tooGeneric,
    reasonKey: reasonKey,
    reasonVars: reasonVars,
    reason: null,
    count: cuisines.length,
    values: cuisines
  };
}

// F2: openingHoursSpecification validation. Recognizes both the
// structured form (array of OpeningHoursSpecification entries with
// dayOfWeek/opens/closes) and the legacy `openingHours: "Mo-Fr
// 08:00-17:00"` string form some generators still emit.
//
// dayCount counts distinct weekdays covered. 7 means the site
// publishes hours for every day of the week (including explicit
// "closed" days as opens=null + closes=null or a "Closed" marker).
// The audit flags <7 as an actionable gap because Google's Rich
// Results for restaurants wants every day listed.
function validateOpeningHours(restaurantObjects) {
  const DAY_NAMES = {
    'monday':    'Mo', 'mo': 'Mo', 'mon': 'Mo',
    'tuesday':   'Tu', 'tu': 'Tu', 'tue': 'Tu', 'tues': 'Tu',
    'wednesday': 'We', 'we': 'We', 'wed': 'We',
    'thursday':  'Th', 'th': 'Th', 'thu': 'Th', 'thur': 'Th', 'thurs': 'Th',
    'friday':    'Fr', 'fr': 'Fr', 'fri': 'Fr',
    'saturday':  'Sa', 'sa': 'Sa', 'sat': 'Sa',
    'sunday':    'Su', 'su': 'Su', 'sun': 'Su'
  };
  const covered = Object.create(null);
  let found = false;
  let parseErrors = 0;
  // Sprint H1: track time-format validity. schema.org's
  // openingHoursSpecification.opens / .closes expect ISO-8601 time
  // ("HH:MM" or "HH:MM:SS"). Sites that feed "9am" or "opens at
  // 9" pass presence but fail strict validation, which is exactly
  // why Google occasionally refuses to render rich-hours panels.
  let timeFieldsSeen = 0;
  let timeFieldsBad = 0;
  const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
  function checkTime(val) {
    if (val === undefined || val === null || val === '') return;
    timeFieldsSeen++;
    if (typeof val !== 'string' || !TIME_RE.test(val.trim())) timeFieldsBad++;
  }

  function addDay(raw) {
    if (!raw) return;
    const s = String(raw).toLowerCase().replace(/^https?:\/\/schema\.org\//, '').trim();
    if (DAY_NAMES[s]) { covered[DAY_NAMES[s]] = true; return; }
    // URI form from schema.org e.g. "https://schema.org/Monday"
    const tail = s.split('/').pop();
    if (DAY_NAMES[tail]) { covered[DAY_NAMES[tail]] = true; return; }
    parseErrors++;
  }

  restaurantObjects.forEach(function(obj){
    // Structured form: openingHoursSpecification = [{ dayOfWeek, opens, closes }]
    const spec = obj.openingHoursSpecification;
    if (Array.isArray(spec)) {
      found = true;
      spec.forEach(function(entry){
        if (!entry) return;
        const dow = entry.dayOfWeek;
        if (Array.isArray(dow)) dow.forEach(addDay);
        else addDay(dow);
        checkTime(entry.opens);
        checkTime(entry.closes);
      });
    } else if (spec && typeof spec === 'object') {
      found = true;
      const dow = spec.dayOfWeek;
      if (Array.isArray(dow)) dow.forEach(addDay);
      else addDay(dow);
      checkTime(spec.opens);
      checkTime(spec.closes);
    }

    // Legacy string form: openingHours: "Mo-Fr 08:00-17:00 Sa 09:00-13:00"
    const legacy = obj.openingHours;
    if (typeof legacy === 'string' || Array.isArray(legacy)) {
      found = true;
      const strs = Array.isArray(legacy) ? legacy : [legacy];
      const rangeRe = /\b(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?\b/g;
      const order = ['Mo','Tu','We','Th','Fr','Sa','Su'];
      strs.forEach(function(s){
        let m;
        while ((m = rangeRe.exec(s)) !== null) {
          const start = order.indexOf(m[1]);
          const end   = m[2] ? order.indexOf(m[2]) : start;
          if (start < 0 || end < 0) { parseErrors++; continue; }
          // Wrap through Sunday if start > end (rare but legal).
          let i = start;
          while (true) {
            covered[order[i]] = true;
            if (i === end) break;
            i = (i + 1) % 7;
          }
        }
        // H1: validate embedded time ranges like "08:00-17:00".
        const timeRanges = s.match(/\d{1,2}:\d{2}(?::\d{2})?/g) || [];
        timeRanges.forEach(checkTime);
      });
    }
  });

  const dayCount = Object.keys(covered).length;
  const timesValid = timeFieldsSeen > 0 && timeFieldsBad === 0;
  // Sprint H4: add a single-sentence `reason` for renderers that want
  // to show the owner WHY the audit flagged this field rather than
  // just "unverified". Null when everything looks fine.
  let reasonKey = null;
  let reasonVars = null;
  if (!found) reasonKey = 'hours.missing';
  else if (dayCount < 7) { reasonKey = 'hours.partial'; reasonVars = { dayCount: dayCount }; }
  else if (timeFieldsSeen > 0 && timeFieldsBad > 0) { reasonKey = 'hours.badTimes'; reasonVars = { timeFieldsBad: timeFieldsBad }; }
  else if (parseErrors > 0) { reasonKey = 'hours.parseErrors'; reasonVars = { parseErrors: parseErrors }; }
  return {
    present:     found,
    dayCount:    dayCount,
    complete:    dayCount === 7,
    parseErrors: parseErrors,
    timesValid:  timesValid,
    timeFieldsSeen: timeFieldsSeen,
    timeFieldsBad:  timeFieldsBad,
    valid:       found && dayCount === 7 && (timeFieldsSeen === 0 || timesValid) && parseErrors === 0,
    reasonKey:   reasonKey, reasonVars: reasonVars, reason: null
  };
}

// ------------------------------------------------------------
// JSON-LD extraction — Phase F
// ------------------------------------------------------------
// Extracts every <script type="application/ld+json"> block and
// parses each one properly with JSON.parse. Phase F1 replaces the
// regex-based @type scraper with structured parsing so later
// sprints can validate field-level content (openingHours,
// priceRange, servesCuisine, acceptsReservations, hasMenu,
// address/telephone for NAP consistency).
//
// Shape returned:
//   {
//     types:            string[],       // unique @type values seen
//     blockCount:       number,         // total <script> blocks found
//     parseErrorCount:  number,         // JSON.parse failures
//     objects: [                        // flattened list of every
//       {                               // schema object, including
//         "@type":  string|string[],    // entries from @graph arrays
//         ...                           // all other schema fields
//       }
//     ]
//   }
//
// Regex fallback: if JSON.parse fails on a block (very common with
// Squarespace/Wix-generated sites that double-encode entities), we
// still scrape @type values from the raw text so legacy callers
// that only read `types` keep working. New callers should prefer
// `objects` for field-level work.
function extractJsonLd(html) {
  const blockRe = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = blockRe.exec(html)) !== null) blocks.push(m[1]);

  const objects = [];
  let parseErrorCount = 0;
  for (let i = 0; i < blocks.length; i++) {
    const raw = blocks[i].trim();
    if (!raw) continue;
    try {
      const val = JSON.parse(raw);
      // JSON-LD can be a single object, an array of objects, or
      // an object with @graph (and sometimes nested arrays). Flatten
      // aggressively so later validators have a simple list to walk.
      flattenJsonLd(val, objects);
    } catch (e) {
      parseErrorCount++;
      // Fall back to the old regex scrape for just @type values so
      // parse errors don't silently delete known types from the
      // response — the type list stays useful even when strict
      // parsing can't fully read the block.
      const fallback = scrapeTypesFromString(raw);
      fallback.forEach(function(t){ objects.push({ '@type': t, _parseError: true }); });
    }
  }

  // Collect unique @type values across all objects.
  const seen = Object.create(null);
  const types = [];
  for (let k = 0; k < objects.length; k++) {
    const t = objects[k] && objects[k]['@type'];
    if (Array.isArray(t)) {
      t.forEach(function(s){ if (typeof s === 'string' && !seen[s]) { seen[s] = true; types.push(s); } });
    } else if (typeof t === 'string' && !seen[t]) {
      seen[t] = true; types.push(t);
    }
  }
  return { types: types, blockCount: blocks.length, parseErrorCount: parseErrorCount, objects: objects };
}

// Walk a parsed JSON-LD value (object, array, or object with
// @graph) and push every schema object into `out`. Nested
// schemas like { address: { @type: PostalAddress, ... } } are
// intentionally NOT flattened — they stay attached to their parent
// so validators can see the relationship (a Restaurant's address,
// not a free-floating PostalAddress).
function flattenJsonLd(val, out) {
  if (!val) return;
  if (Array.isArray(val)) {
    val.forEach(function(v){ flattenJsonLd(v, out); });
    return;
  }
  if (typeof val !== 'object') return;
  if (Array.isArray(val['@graph'])) {
    val['@graph'].forEach(function(v){ flattenJsonLd(v, out); });
    // Drop the @graph wrapper itself but keep any sibling fields
    // (rare but legal: a top-level context-only object with @graph).
    const wrapper = {};
    Object.keys(val).forEach(function(k){ if (k !== '@graph') wrapper[k] = val[k]; });
    if (Object.keys(wrapper).length) out.push(wrapper);
    return;
  }
  out.push(val);
}

// Regex fallback for unparseable blocks. Returns every @type
// string seen in the raw text, single or array form.
function scrapeTypesFromString(text) {
  const out = [];
  const seen = Object.create(null);
  const typeRe = /"@type"\s*:\s*"([A-Za-z]+)"/g;
  let m;
  while ((m = typeRe.exec(text)) !== null) {
    if (!seen[m[1]]) { seen[m[1]] = true; out.push(m[1]); }
  }
  const arrayRe = /"@type"\s*:\s*\[([^\]]+)\]/g;
  while ((m = arrayRe.exec(text)) !== null) {
    const inner = m[1].match(/"([A-Za-z]+)"/g);
    if (inner) inner.forEach(function(t){
      t = t.replace(/"/g, '');
      if (!seen[t]) { seen[t] = true; out.push(t); }
    });
  }
  return out;
}


// ------------------------------------------------------------
// Multi-page crawl — Phase E
// ------------------------------------------------------------
// Fetches the target homepage plus up to 5 key internal pages so the
// restaurant audit can evaluate menu-format / conversions / schema /
// NAP-consistency against the page that's ACTUALLY responsible for
// each check, not just the homepage.
//
//   GET /api/page-crawl?url=https://example.com/
//     → 200 {
//         ok: true,
//         homepage: { url, status, html },
//         candidates: [{ slot, url }, …],   // what we tried
//         pages: [{ slot, url, status, html, error? }, …], // what we got
//         capHit: boolean                   // true = 15s global timer fired
//       }
//     → 400 missing/bad url
//     → 502 homepage fetch failed / non-2xx / upstream timeout
//
// Budget: 8s homepage + up to 5 × 6s follow-ups (all parallel), with
// a 15s global cap. HTML bodies are truncated at PAGE_CRAWL_MAX_HTML
// bytes per page so a pathological CMS page cannot blow the Worker
// response budget — the client-side checks only need the first
// chunk of any realistic restaurant page (nav, menu, schema).
const PAGE_CRAWL_MAX_HTML         = 500_000;  // ~500 KB per page
// Sprint M1.3: bump to 8 so the three newly-added slots (wholesale,
// gift, careers) can land alongside the existing five without
// squeezing the original coverage.
const PAGE_CRAWL_MAX_CANDIDATES   = 8;
const PAGE_CRAWL_PER_URL_TIMEOUT  = 6000;
const PAGE_CRAWL_GLOBAL_CAP       = 15000;
const PAGE_CRAWL_HOMEPAGE_TIMEOUT = 8000;

async function handlePageCrawl(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  // Sprint E4: SSRF guard on the entry URL so a crafted input can't
  // coax the Worker into fetching an internal host.
  const gate = assertSafeHttpUrl(target, pickLang(request));
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }

  const homepage = await fetchPageForCrawl(gate.url.toString(), PAGE_CRAWL_HOMEPAGE_TIMEOUT);
  if (!homepage.ok) {
    return jsonResponse({ ok: false, error: homepage.error || 'Fetch failed' }, 502);
  }

  // Sprint E2: rank up to PAGE_CRAWL_MAX_CANDIDATES internal-link
  // candidates from the homepage HTML.
  // Sprint E4: each extracted candidate is ALSO re-checked through
  // assertSafeHttpUrl. A restaurant site that links to a private IP
  // or a non-http(s) URL in its own HTML would otherwise be followed.
  const candidates = extractInternalLinkCandidates(homepage.html, homepage.url)
    .filter(function(c){ return assertSafeHttpUrl(c.url).ok; })
    .slice(0, PAGE_CRAWL_MAX_CANDIDATES);

  // Sprint E3: fetch the candidates in parallel, per-URL timeout,
  // with a global cap. Promise.allSettled so one slow/broken page
  // cannot starve the whole batch, wrapped in Promise.race against
  // a timer so the WHOLE operation cannot exceed the cap even if
  // AbortController support drifts across Workers runtimes.
  const fetches = candidates.map(function(c){
    return fetchPageForCrawl(c.url, PAGE_CRAWL_PER_URL_TIMEOUT)
      .then(function(r){ return { slot: c.slot, url: c.url, result: r }; });
  });
  const globalCap = new Promise(function(resolve){
    setTimeout(function(){ resolve(null); }, PAGE_CRAWL_GLOBAL_CAP);
  });
  const settled = await Promise.race([
    Promise.allSettled(fetches),
    globalCap.then(function(){ return null; })
  ]);
  const pages = [];
  if (Array.isArray(settled)) {
    for (let i = 0; i < settled.length; i++) {
      const entry = settled[i];
      if (entry.status === 'fulfilled' && entry.value) {
        const v = entry.value;
        if (v.result && v.result.ok) {
          const trimmed = truncateHtml(v.result.html, PAGE_CRAWL_MAX_HTML);
          // Sprint M1.3: extract title + h1 per page so the detector
          // fuses (M1.9 menu, M1.10 catering/wholesale) can confirm a
          // slot page matches its intent without scanning the full
          // HTML twice.
          const meta = extractTitleAndH1(trimmed);
          pages.push({
            slot: v.slot,
            url: v.url,
            status: v.result.status,
            html: trimmed,
            title: meta.title,
            h1: meta.h1
          });
        } else {
          pages.push({
            slot: v.slot,
            url: v.url,
            status: (v.result && v.result.status) || 0,
            html: null,
            title: null,
            h1: null,
            error: (v.result && v.result.error) || 'fetch-failed'
          });
        }
      }
    }
  }
  // If the global cap won the race, fall back to an empty pages list —
  // caller still has a usable homepage plus the candidate URLs to
  // retry against later.
  const capHit = !Array.isArray(settled);

  // Sprint M1.3: also extract title + h1 from the homepage so the
  // client has a consistent shape for every crawled page.
  const homepageHtml = truncateHtml(homepage.html, PAGE_CRAWL_MAX_HTML);
  const homepageMeta = extractTitleAndH1(homepageHtml);

  return jsonResponse({
    ok: true,
    homepage: {
      url: homepage.url,
      status: homepage.status,
      html: homepageHtml,
      title: homepageMeta.title,
      h1: homepageMeta.h1
    },
    candidates: candidates,
    pages: pages,
    capHit: capHit
  }, 200);
}

// Cap each HTML body at maxBytes so a pathological CMS page cannot
// blow the Worker's response budget. The client-side checks only
// need the first few-hundred KB of any realistic restaurant page
// (nav, menu, schema scripts). Returns the original string when it
// is already under the limit — avoids a copy on the common path.
function truncateHtml(html, maxBytes) {
  if (!html || typeof html !== 'string') return html;
  if (html.length <= maxBytes) return html;
  return html.slice(0, maxBytes);
}

// Stream a Response body as text, aborting at maxBytes. Without this,
// a malicious or broken upstream returning a 10 MB document forces the
// Worker to buffer the entire response before truncateHtml can even
// look at it — blowing memory and the 128 MB response budget. Reading
// chunk-by-chunk and cancelling the reader at the byte cap keeps us
// under the limit even when the upstream lies about its Content-Length.
//
// Returns { text, truncated, bytesRead }. `truncated: true` signals the
// cap was reached and the tail of the document was discarded — callers
// that need a deterministic doc length (schema parser, title extractor)
// still work correctly because the returned text is valid UTF-8 prefix.
export async function readTextCapped(res, maxBytes) {
  const limit = Math.max(0, maxBytes | 0) || 0;
  // Degenerate cap: if a caller passes 0 (or a negative) we refuse to
  // read anything. Cancel the body so the upstream doesn't keep
  // sending. Returning an empty string is the only honest answer.
  if (limit === 0) {
    try {
      if (res && res.body && typeof res.body.cancel === 'function') {
        await res.body.cancel();
      }
    } catch (_) { /* ignore */ }
    return { text: '', truncated: true, bytesRead: 0 };
  }
  const body = res && res.body;
  if (!body || typeof body.getReader !== 'function') {
    // No streamable body (shouldn't happen in Workers runtime, but be
    // defensive for mocked / non-streaming test responses).
    const fallback = await res.text();
    if (limit && fallback.length > limit) {
      return { text: fallback.slice(0, limit), truncated: true, bytesRead: limit };
    }
    return { text: fallback, truncated: false, bytesRead: fallback.length };
  }
  const reader = body.getReader();
  const chunks = [];
  let bytes = 0;
  let truncated = false;
  try {
    while (true) {
      const step = await reader.read();
      if (step.done) break;
      const value = step.value;
      if (!value) continue;
      const len = value.byteLength;
      if (limit > 0 && bytes + len > limit) {
        const remaining = Math.max(0, limit - bytes);
        if (remaining > 0) chunks.push(value.subarray(0, remaining));
        bytes = limit;
        truncated = true;
        try { await reader.cancel(); } catch (_) { /* ignore */ }
        break;
      }
      chunks.push(value);
      bytes += len;
    }
  } finally {
    try { reader.releaseLock(); } catch (_) { /* ignore */ }
  }
  // Concatenate once and decode the full buffer so no UTF-8 character
  // is split across a chunk boundary. TextDecoder with fatal:false
  // emits U+FFFD on a split at the tail; acceptable for our purposes
  // (schema parser + regex extractors ignore replacement characters).
  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  const text = new TextDecoder('utf-8', { fatal: false }).decode(merged);
  return { text: text, truncated: truncated, bytesRead: bytes };
}

// Slot-assigned link-text patterns. Each pattern matches a category
// of page that the audit wants to inspect separately. Order matters:
// we stop at the first slot that matches a given anchor, so more
// specific slots ('catering', 'events') should come before generic
// ones ('menu'). Patterns match against the anchor's visible text
// AND the href path (e.g. /catering-menu.pdf) so sites that style
// their nav with icons and aria-labels still classify.
const PAGE_CRAWL_SLOTS = [
  { slot: 'reserve',     patterns: [/reserv/i, /book\s*a?\s*table/i, /\bbooking\b/i] },
  { slot: 'order',       patterns: [/order\s*(online|now|here)?/i, /start\s+(an\s+)?order/i, /\bpickup\b/i, /\bdelivery\b/i] },
  { slot: 'catering',    patterns: [/\bcatering\b/i, /\bcater\s*your\b/i, /private\s+event/i, /\brfq\b/i] },
  { slot: 'events',      patterns: [/\bevents?\b/i, /\bparties\b/i, /\bweddings?\b/i, /private\s+dining/i] },
  // Phase 3 #5b: menu-slot patterns expanded to close the crawl-reach
  // limitation surfaced after shipping menu-depth. Three specific
  // additions, each chosen for low false-positive risk:
  //   /\bcarte\b/    — almost exclusively fine-dining menu pages
  //                    ("prix fixe", "à la carte"); zero hits on
  //                    generic English body copy
  //   /\bto-go\b/    — ordering-flow pages that carry the menu
  //                    alongside the pickup flow
  //   /\border[-\s]online\b/  — same; normalizes "Order Online" or
  //                    "order-online" URL slugs
  // Broader candidates rejected: /food/ matches "About our food" pages
  // and nav links; /eats/ collides with brand names; /kitchen/ matches
  // "Our Kitchen" about-us content.
  { slot: 'menu',        patterns: [/\bmenu\b/i, /\bmenus\b/i, /food\s*&?\s*drink/i, /\bwine\s+list\b/i, /\bdrink\s+list\b/i, /\bcarte\b/i, /\bto-go\b/i, /\border[-\s]online\b/i] },
  { slot: 'contact',     patterns: [/\bcontact\b/i, /\bvisit\b/i, /location/i, /find\s+us/i, /hours/i] },
  { slot: 'about',       patterns: [/\babout\b/i, /our\s+story/i, /\bchef\b/i, /\bteam\b/i] },
  // Sprint M1.3: three new slots so the existence of a dedicated
  // wholesale / gift-cards / careers page resolves the corresponding
  // priority checks without asking the owner "Is this right?".
  // Order after 'about' matters only for tie-breaking; each slot's
  // patterns are distinct enough that an anchor won't double-match.
  { slot: 'wholesale',   patterns: [/\bwholesale\b/i, /\bbulk\s+order/i, /\btrade\s+account/i, /\bB2B\b/i] },
  { slot: 'gift',        patterns: [/gift\s*cards?/i, /gift\s*certificate/i, /\begift\b/i, /e-?gift/i] },
  { slot: 'careers',     patterns: [/\bcareers?\b/i, /\bjobs\b/i, /\bjoin\s+(our|the)\s+team\b/i, /\bhiring\b/i, /\bwork\s+with\s+us\b/i] }
];

// Sprint M1.3: extract the first <h1> and <title> from HTML so the
// client can fingerprint a slot page without fully rendering it.
// Regex-based (HTMLRewriter would be better; this is cheap and
// correct for the shapes restaurant sites actually ship). Returns
// null on miss. Strips nested tags + collapses whitespace.
function extractTitleAndH1(html) {
  if (typeof html !== 'string' || !html) return { title: null, h1: null };
  let title = null, h1 = null;
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null;
    if (title && title.length > 180) title = title.slice(0, 180);
  }
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    h1 = h1Match[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim() || null;
    if (h1 && h1.length > 180) h1 = h1.slice(0, 180);
  }
  return { title: title, h1: h1 };
}

// Extract up to 5 internal-link candidates from homepage HTML, one
// per priority slot. Returns an array of { slot, url } pointing at
// same-origin pages the caller should fetch to enrich the audit.
//
// Parsing is regex-based (HTMLRewriter would be more robust but
// requires streaming semantics this endpoint doesn't need). We
// capture every <a href="..."> with its inner text, then walk each
// PAGE_CRAWL_SLOTS entry in order and pick the SHORTEST matching
// same-origin URL — shortest wins because '/menu' is almost always
// the canonical menu page and '/menu/lunch-prix-fixe' is a sub-page.
function extractInternalLinkCandidates(html, baseUrlString) {
  if (!html || !baseUrlString) return [];
  let base;
  try { base = new URL(baseUrlString); } catch (e) { return []; }

  const anchorRe = /<a\s+[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const anchors = [];
  let m;
  while ((m = anchorRe.exec(html)) !== null) {
    const href = m[1];
    // Inner text: strip nested tags, collapse whitespace. Also pick
    // up aria-label if present in the surrounding <a> open tag.
    const rawText = m[2].replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
    const text = rawText.replace(/\s+/g, ' ').trim();
    anchors.push({ href: href, text: text });
  }

  const candidates = [];
  const usedUrls = new Set();
  for (let i = 0; i < PAGE_CRAWL_SLOTS.length; i++) {
    const slotDef = PAGE_CRAWL_SLOTS[i];
    // Find all anchors whose text OR href matches any pattern in this slot.
    const matching = anchors.filter(function(a){
      const haystack = (a.text || '') + ' ' + (a.href || '');
      return slotDef.patterns.some(function(re){ return re.test(haystack); });
    });
    if (!matching.length) continue;
    // Resolve each match to an absolute URL, filter to same-origin.
    const resolved = [];
    for (let j = 0; j < matching.length; j++) {
      let abs;
      try { abs = new URL(matching[j].href, base).href; } catch (e) { continue; }
      const absUrl = new URL(abs);
      if (absUrl.origin !== base.origin) continue;
      // Skip the homepage itself (already fetched) and anchor-only links.
      if (absUrl.pathname === '/' && !absUrl.search) continue;
      if (absUrl.href === base.href) continue;
      // Skip file downloads that aren't HTML — PDFs/images aren't
      // useful for our text-based checks.
      if (/\.(pdf|jpe?g|png|gif|webp|svg|mp4|mp3|zip)$/i.test(absUrl.pathname)) continue;
      resolved.push(absUrl.href);
    }
    if (!resolved.length) continue;
    // Prefer the shortest URL for this slot (canonical > sub-page).
    resolved.sort(function(a, b){ return a.length - b.length; });
    for (let k = 0; k < resolved.length; k++) {
      if (!usedUrls.has(resolved[k])) {
        candidates.push({ slot: slotDef.slot, url: resolved[k] });
        usedUrls.add(resolved[k]);
        break;
      }
    }
    if (candidates.length >= 5) break;
  }
  return candidates;
}

// Shared single-URL fetch helper. Same shape as the other page-
// reading endpoints. Timeout is configurable so Phase E3 can use a
// tighter 6s per follow-up fetch while the homepage gets the
// default 8s — the homepage is the one we can't proceed without.
async function fetchPageForCrawl(target, timeoutMs) {
  const controller = new AbortController();
  const ms = (typeof timeoutMs === 'number' && timeoutMs > 0) ? timeoutMs : 8000;
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(target, {
      headers: { 'User-Agent': 'MuntinDigital-PageCrawl/1.0' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return { ok: false, url: target, status: res.status, error: 'HTTP ' + res.status };
    }
    // Stream with a hard cap so a 10 MB homepage cannot exhaust the
    // Worker's memory budget before truncateHtml downstream can cap
    // it. PAGE_CRAWL_MAX_HTML is the outer intent; we allocate a
    // slightly larger byte budget so multi-byte UTF-8 doesn't clip
    // the truncateHtml char cap applied by the caller.
    const read = await readTextCapped(res, PAGE_CRAWL_MAX_HTML * 2);
    return { ok: true, url: res.url || target, status: res.status, html: read.text };
  } catch (err) {
    clearTimeout(timeout);
    const msg = (err && err.name === 'AbortError') ? 'Fetch timed out' : 'Fetch failed';
    return { ok: false, url: target, status: 0, error: msg };
  }
}


// ------------------------------------------------------------
// PageSpeed Insights proxy
// ------------------------------------------------------------
// Client-facing audit tools (restaurant + wellness) used to call PSI
// directly with an HTTP-referrer-restricted API key embedded in the
// HTML. That pattern is documented by Google for client-side keys,
// but (a) the key lives in git history forever, (b) referrer
// enforcement is spoofable, and (c) a key rotation has to fan out
// to every HTML page. This proxy keeps the key in env.PSI_API_KEY
// and forwards the client's request parameters to PSI unchanged.
//
// Behavior:
//   GET /api/psi?url=...&strategy=mobile&category=performance&...
//     → 200 with the full PSI JSON response on success
//     → 503 with error='psi-proxy-unconfigured' when env.PSI_API_KEY
//       is not set (lets the client detect this and transparently
//       fall back to the direct-PSI path during the migration
//       window; once the secret is set, the fallback dead-codes)
//     → 400 on missing/bad `url` parameter
//     → 4xx/5xx from PSI passed through with the error body
//
// Rate limiting: not enforced in this Worker — rely on Cloudflare's
// edge rate-limiting rules (configured in the dashboard) and on
// Google's own per-key quotas. Adding KV-backed per-IP limits here
// would require a KV namespace binding; that's a future upgrade.
async function handlePsi(request, env, ctx) {
  if (!env.PSI_API_KEY) {
    return jsonResponse(
      { ok: false, error: 'psi-proxy-unconfigured', errorKind: 'psi-unconfigured' },
      503
    );
  }

  const incoming = new URL(request.url);
  const target   = (incoming.searchParams.get('url') || '').trim();
  if (!target) {
    return jsonResponse({ ok: false, error: 'Missing ?url= parameter', errorKind: 'bad-request' }, 400);
  }
  // Require http(s) — don't let the client coax us into hitting
  // javascript:, data:, file:, or internal http://10.x URLs via PSI
  let parsedTarget;
  try {
    parsedTarget = new URL(target);
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Invalid URL', errorKind: 'bad-request' }, 400);
  }
  if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
    return jsonResponse({ ok: false, error: 'Only http(s) URLs are supported', errorKind: 'bad-request' }, 400);
  }

  // Pass through all the audit's forwarded params; just swap in our key.
  const upstream = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  incoming.searchParams.forEach((value, key) => {
    if (key === 'key') return; // never honor a client-supplied key
    upstream.searchParams.append(key, value);
  });
  upstream.searchParams.set('key', env.PSI_API_KEY);

  // Sprint AUDIT-LOAD-FIX + Wave-E4: PSI fetch budget.
  //
  // Cloudflare Workers enforce a per-fetch wall-time limit of ~30s for
  // outbound subrequests. The 30s is PER FETCH, not aggregate across
  // the handler — so each individual `fetch()` below sits inside that
  // budget. But the Cloudflare HTTP edge will close the client
  // connection if the overall worker invocation exceeds ~100s of upstream
  // wait, and the frontend's own AbortController caps the request at
  // 35s (see callPsi in tools/audits/restaurant/index.html). Practical
  // total budget is therefore: 35s client cap ≥ first-attempt + retry
  // wall time + small grace.
  //
  // First attempt: 25s. Retry (429/503 only): 4s. Sleep between: 1.0s.
  // Worst case 30.0s — fits inside the 35s client cap with headroom.
  //
  // Wave-E4 tightening: the prior retry timeout was 20s, giving 46.5s
  // worst-case total that exceeded the frontend's 35s client cap and
  // wasted retry budget on a path that's only useful for transient
  // throttling. 4s is enough to clear a typical PSI burst-throttle
  // without compounding a slow first attempt.
  //
  // On real timeout (TimeoutError below), the frontend transparently
  // retries with ?strategy=desktop — that's where the meaningful
  // recovery happens, not in this worker.
  try {
    let res = await fetch(upstream.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(25000)
    });
    if (res.status === 429 || res.status === 503) {
      // PSI throttles on burst traffic (e.g. competitor-comparison
      // flow fires 3 audits back-to-back); a short retry recovers the
      // most common transient case. Wave-E4 cut from 20s to 4s — if
      // PSI is THAT slow after a throttle, the frontend's desktop
      // fallback is the better recovery path.
      await new Promise((r) => setTimeout(r, 1000));
      res = await fetch(upstream.toString(), {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
    }
    const body = await res.text();
    // Pass through status + JSON body so the client can see PSI's
    // structured error shape (body.error.message) unchanged. Echo the
    // strategy that was used (defaults to mobile) so the frontend can
    // label the result correctly when it falls back to desktop.
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'X-Generator': MUNTIN_GENERATOR,
        'X-Powered-By': 'Muntin Digital',
        'X-Muntin-Psi-Strategy': (incoming.searchParams.get('strategy') || 'mobile'),
      }
    });
  } catch (err) {
    console.error('[psi] upstream fetch failed:', err && err.stack ? err.stack : err);
    const isTimeout = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    // Sprint ES3: localized PSI error messages.
    const L = pickLang(request);
    const MSG = {
      timeout: { en: 'PageSpeed Insights took longer than 25s — please retry',
                 es: 'PageSpeed Insights tardó más de 25s — por favor reintenta' },
      fail:    { en: 'Failed to reach PageSpeed Insights',
                 es: 'No se pudo conectar con PageSpeed Insights' }
    };
    const pick = (m) => (L === 'es' && m.es) || m.en;
    // Sprint AUDIT-LOAD-FIX: include errorKind so the frontend can
    // distinguish a timeout (retry with desktop strategy) from a hard
    // network failure (surface to the user). The legacy `error` string
    // stays for back-compat.
    return jsonResponse(
      {
        ok: false,
        error: isTimeout ? pick(MSG.timeout) : pick(MSG.fail),
        errorKind: isTimeout ? 'psi-timeout' : 'psi-fetch-failed',
        strategy: (incoming.searchParams.get('strategy') || 'mobile')
      },
      isTimeout ? 504 : 502
    );
  }
}



// ------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------

// Sprint BB5: canonical generator header shared by every JSON
// response. Pairs with the HTML <meta name="generator"> tag set in
// BB4 so anyone introspecting the API or the page sees the same
// Muntin Digital attribution. Version string should move in lockstep
// with the HTML meta when the audit engine materially changes.
const MUNTIN_GENERATOR = 'Muntin Digital Audit v1.1';

// ------------------------------------------------------------
// /api/did-you-mean — DNS-over-HTTPS typo-suggestion helper.
//
// When the restaurant audit (or any future tool) fails because a
// user's URL doesn't resolve, the client calls this endpoint with
// the offending URL. We generate a small set of plausible typo
// corrections (single-character deletion + adjacent transposition
// on the SLD portion of the hostname) and DNS-query each against
// 1.1.1.1 via DNS-over-HTTPS. The first candidate that actually
// resolves gets returned as the suggestion.
//
// Rationale: a wrong suggestion is worse than no suggestion, so
// we only propose candidates that ALSO resolve — this avoids
// suggesting `example.co` or `exampl.com` as alternatives if
// those don't exist.
//
// Response shape:
//   { ok: true, input, suggestion: 'irishinnglenecho.com',
//     suggestedUrl: 'https://irishinnglenecho.com/' }
//   { ok: true, input, suggestion: null }   // no plausible match
//
// Budgeted at ~2s total: 40 DoH lookups in parallel, each capped
// at 1.5s. DoH at 1.1.1.1 answers in tens of milliseconds for
// unresolved names, so this rarely uses its full budget.
// ------------------------------------------------------------

async function handleDidYouMean(request, env, ctx) {
  const urlObj = new URL(request.url);
  const raw = (urlObj.searchParams.get('url') || '').trim();
  const gate = assertSafeHttpUrl(raw, pickLang(request));
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  const parsed = gate.url;
  const host = parsed.hostname.toLowerCase();
  const cands = didYouMeanCandidates(host).slice(0, 40);

  const MAX_WAIT = 2000;
  const started = Date.now();
  let suggestion = null;
  const lookups = cands.map(async (cand) => {
    if (suggestion || Date.now() - started > MAX_WAIT) return;
    const ok = await dnsResolves(cand).catch(() => false);
    if (ok && !suggestion) suggestion = cand;
  });
  await Promise.race([
    Promise.all(lookups),
    new Promise((r) => setTimeout(r, MAX_WAIT))
  ]);

  if (!suggestion) {
    return jsonResponse({ ok: true, input: host, suggestion: null });
  }
  // Preserve the user's scheme, port, and path when echoing the
  // suggested URL back so the client can retry the full request.
  const out = new URL(parsed.toString());
  out.hostname = suggestion;
  return jsonResponse({
    ok: true,
    input: host,
    suggestion: suggestion,
    suggestedUrl: out.toString()
  });
}

// Build a small set of plausible typo-correction candidates for a
// hostname. Operates on the "second-level" portion only — e.g. for
// `irisihinnglenecho.com` we edit `irisihinnglenecho` and keep `.com`
// — so deletions don't turn `.com` into `.co` or `.om`, which would
// resolve but be wrong-domain suggestions. Preserves any `www.`
// prefix on the way out.
function didYouMeanCandidates(hostname) {
  const labels = hostname.split('.');
  if (labels.length < 2) return [];
  const hadWww = labels[0] === 'www';
  const withoutWww = hadWww ? labels.slice(1) : labels;
  if (withoutWww.length < 2) return [];
  const tld  = withoutWww.slice(-1)[0];
  const tld2 = withoutWww.length >= 3 ? withoutWww.slice(-2).join('.') : null; // handle co.uk etc.
  // Use the compound TLD only when both parts look like TLDs (<=3 chars).
  const useTld2 = tld2 && withoutWww.length >= 3 && withoutWww.slice(-2).every((l) => l.length <= 3);
  const suffix = useTld2 ? withoutWww.slice(-2).join('.') : tld;
  const sldEnd = useTld2 ? withoutWww.length - 2 : withoutWww.length - 1;
  const sld = withoutWww.slice(0, sldEnd).join('.');
  if (!sld || sld.length < 3) return [];

  const variants = new Set();
  // 1. Single-character deletions.
  for (let i = 0; i < sld.length; i++) {
    variants.add(sld.slice(0, i) + sld.slice(i + 1));
  }
  // 2. Adjacent transpositions.
  for (let i = 0; i < sld.length - 1; i++) {
    if (sld[i] === sld[i + 1]) continue; // transposing identical chars is a no-op
    variants.add(sld.slice(0, i) + sld[i + 1] + sld[i] + sld.slice(i + 2));
  }
  // 3. Remove doubled-letter runs (e.g. `irisih` → `irish` via
  //    collapsing `ih` would not help, but `bookking` → `booking`
  //    by collapsing `kk` would). Conceptually a deletion already
  //    covers this, but adding targeted collapses helps when the
  //    SLD is long and we'd otherwise prune the right candidate.
  for (let i = 0; i < sld.length - 1; i++) {
    if (sld[i] === sld[i + 1]) variants.add(sld.slice(0, i) + sld.slice(i + 1));
  }
  variants.delete(sld);

  const prefix = hadWww ? 'www.' : '';
  const out = [];
  for (const v of variants) {
    if (v.length < 3) continue; // too short to be a real domain
    out.push(prefix + v + '.' + suffix);
  }
  return out;
}

async function dnsResolves(hostname) {
  const url = 'https://cloudflare-dns.com/dns-query?name=' +
              encodeURIComponent(hostname) + '&type=A';
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(1500)
    });
    if (!res.ok) return false;
    const data = await res.json();
    // Status 0 = NOERROR. Answer[] contains A records when resolved.
    return data && data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch (_) {
    return false;
  }
}

// ------------------------------------------------------------
// /api/observatory — Mozilla HTTP Observatory proxy.
//
// Deep Scan adds a one-letter security-headers grade (A+ / A / B /
// C / D / F) sourced from Mozilla's free observatory. The API is
// two-step: POST /analyze kicks off a scan; GET /analyze polls for
// the result. We budget up to 10s across 5 polls — if the grade
// isn't ready by then we return ok:false and the client simply
// doesn't render the grade chip. Accuracy rule: we NEVER show a
// speculative grade. If observatory times out or errors, the UI
// omits the section entirely.
// ------------------------------------------------------------
async function handleObservatory(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  const host = gate.url.hostname;

  // Sprint T3: 24h cache keyed on hostname. Security-header grades
  // change when a site redeploys — 24h is a reasonable freshness
  // window, and the withAuditCache helper no-ops when the
  // AUDIT_CACHE binding isn't provisioned (i.e. today).
  const cached = await withAuditCache(env, request, ['observatory', host], 86400, async () => {
    return await observatoryScan(host);
  });
  const res = jsonResponse(cached.value, cached.value && cached.value.ok === false ? 502 : 200);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

async function observatoryScan(host) {
  try {
    const startRes = await fetch(
      'https://http-observatory.security.mozilla.org/api/v1/analyze?host=' + encodeURIComponent(host),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'hidden=false&rescan=false',
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!startRes.ok) return { ok: false, error: 'observatory-start-failed' };
    let data = await startRes.json();
    const deadline = Date.now() + 10000;
    let polls = 0;
    while (data && (data.state === 'PENDING' || data.state === 'STARTING' || data.state === 'RUNNING') && Date.now() < deadline && polls < 5) {
      await new Promise((r) => setTimeout(r, 1500));
      polls++;
      const pollRes = await fetch(
        'https://http-observatory.security.mozilla.org/api/v1/analyze?host=' + encodeURIComponent(host),
        { signal: AbortSignal.timeout(4000) }
      );
      if (!pollRes.ok) break;
      data = await pollRes.json();
    }
    if (!data || data.state !== 'FINISHED' || typeof data.grade !== 'string') {
      return { ok: false, error: 'observatory-not-ready' };
    }
    return {
      ok: true,
      grade: data.grade,
      score: typeof data.score === 'number' ? data.score : null,
      tests_passed: data.tests_passed || null,
      tests_failed: data.tests_failed || null,
      tests_quantity: data.tests_quantity || null,
      scan_id: data.scan_id || null
    };
  } catch (err) {
    console.error('[observatory]', err && err.stack ? err.stack : err);
    return { ok: false, error: 'observatory-unreachable' };
  }
}

// ------------------------------------------------------------
// /api/wayback-first-seen — Internet Archive CDX lookup.
//
// Returns the year a URL was first captured by the Wayback Machine
// + total snapshot count. Deep Scan renders a subtle "live since
// YYYY" chip when the answer is definite; omits the chip when CDX
// returns nothing (accuracy rule: we do not show a year we are
// uncertain about). Free public API, no key required.
// ------------------------------------------------------------
async function handleWaybackFirstSeen(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  // Sprint T3: 7-day cache. First-seen year is stable by definition;
  // the Wayback CDX answer for a given URL never moves earlier.
  const cached = await withAuditCache(env, request, ['wayback', gate.url.toString()], 7 * 86400, async () => {
    return await waybackLookup(gate.url.toString());
  });
  const res = jsonResponse(cached.value, cached.value && cached.value.ok === false ? 502 : 200);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

async function waybackLookup(targetUrl) {
  try {
    const cdxUrl = 'https://web.archive.org/cdx/search/cdx?url=' +
                   encodeURIComponent(targetUrl) +
                   '&output=json&fl=timestamp&limit=1&filter=statuscode:200';
    const res = await fetch(cdxUrl, {
      headers: { 'User-Agent': 'MuntinDigital-Audit/1.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return { ok: false, error: 'wayback-unreachable' };
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length < 2 || !rows[1] || !rows[1][0]) {
      return { ok: true, firstSeen: null, year: null };
    }
    const ts = String(rows[1][0]);
    const year = parseInt(ts.slice(0, 4), 10);
    if (!Number.isFinite(year) || year < 1996 || year > (new Date().getUTCFullYear() + 1)) {
      return { ok: true, firstSeen: null, year: null };
    }
    return { ok: true, firstSeen: ts, year: year };
  } catch (err) {
    console.error('[wayback]', err && err.stack ? err.stack : err);
    return { ok: false, error: 'wayback-error' };
  }
}

// ------------------------------------------------------------
// /api/crux-history — CrUX History API proxy.
//
// Returns 25 weeks of Core Web Vitals p75 history for the origin
// (LCP, INP, CLS) plus experience.overall if available. Sparkline
// rendering in the Deep Scan UI reads from this. Accuracy rule:
// we only surface metrics where history has ≥2 data points; a
// single-point series is not a trend. Uses the existing
// PSI_API_KEY env (CrUX History is covered by the same Google
// API key quota).
// ------------------------------------------------------------
async function handleCruxHistory(request, env, ctx) {
  if (!env.PSI_API_KEY) {
    return jsonResponse({ ok: false, error: 'crux-unconfigured' }, 503);
  }
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  // Sprint T3: 48h cache. Google publishes CrUX weekly so a 2-day
  // cache captures any new data while still cutting quota pressure
  // in half for frequent re-audits.
  const cached = await withAuditCache(env, request, ['crux', gate.url.origin], 48 * 3600, async () => {
    return await cruxHistoryQuery(env.PSI_API_KEY, gate.url.origin);
  });
  const status = (cached.value && cached.value.ok === false) ? 502 : 200;
  const res = jsonResponse(cached.value, status);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

async function cruxHistoryQuery(apiKey, origin) {
  try {
    const res = await fetch(
      'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=' + encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin,
          formFactor: 'PHONE',
          metrics: [
            'largest_contentful_paint',
            'interaction_to_next_paint',
            'cumulative_layout_shift'
          ]
        }),
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!res.ok) {
      if (res.status === 404) return { ok: true, hasData: false, reason: 'no-crux-record' };
      return { ok: false, error: 'crux-upstream-' + res.status };
    }
    const body = await res.json();
    const metrics = body && body.record && body.record.metrics ? body.record.metrics : null;
    if (!metrics) return { ok: true, hasData: false, reason: 'empty-metrics' };
    function seriesFor(key) {
      const m = metrics[key];
      if (!m || !Array.isArray(m.percentilesTimeseries) && !m.percentilesTimeseries) return null;
      const pts = m.percentilesTimeseries && m.percentilesTimeseries.p75s;
      if (!Array.isArray(pts) || pts.length < 2) return null;
      const values = pts.map(function(v){
        if (v === null || v === undefined) return null;
        var n = typeof v === 'string' ? parseFloat(v) : v;
        return Number.isFinite(n) ? n : null;
      });
      return { p75: values };
    }
    const periods = (body.record && Array.isArray(body.record.collectionPeriods))
      ? body.record.collectionPeriods.map(function(p){
          const d = p && p.lastDate;
          return d && d.year ? (d.year + '-' + String(d.month).padStart(2, '0') + '-' + String(d.day).padStart(2, '0')) : null;
        })
      : [];
    const out = {
      ok: true, hasData: true, periods: periods,
      lcp: seriesFor('largest_contentful_paint'),
      inp: seriesFor('interaction_to_next_paint'),
      cls: seriesFor('cumulative_layout_shift')
    };
    if (!out.lcp && !out.inp && !out.cls) {
      return { ok: true, hasData: false, reason: 'insufficient-samples' };
    }
    return out;
  } catch (err) {
    console.error('[crux-history]', err && err.stack ? err.stack : err);
    return { ok: false, error: 'crux-error' };
  }
}

// ------------------------------------------------------------
// /api/gbp-details — Places Details v1 (reviews + extended fields).
//
// Second Places call, called only in Deep Scan. Takes a placeId
// (from the Fast Scan gbp-lookup response) and requests the
// review-level payload that's too quota-expensive for every audit:
// up to 5 recent reviews + owner-response presence, and the full
// currentOpeningHours.weekdayDescriptions as a fallback when the
// initial field mask didn't get them.
//
// Accuracy rule: we surface review counts and owner-reply presence
// as raw facts. We do NOT mine review text for sentiment in Sprint
// 2 — sentiment analysis would cross into the "judgment, not fact"
// zone we're deferring.
// ------------------------------------------------------------
async function handleGbpDetails(request, env, ctx) {
  if (!env.GOOGLE_PLACES_KEY) {
    return jsonResponse({ ok: false, error: 'places-unconfigured' }, 503);
  }
  const url = new URL(request.url);
  const placeId = (url.searchParams.get('placeId') || '').trim();
  if (!placeId || !/^[A-Za-z0-9_-]+$/.test(placeId) || placeId.length > 200) {
    return jsonResponse({ ok: false, error: 'invalid-placeId' }, 400);
  }
  // Sprint T3: 24h cache. Reviews change, but a day's staleness is
  // acceptable for a Deep Scan payload — the tradeoff is a huge cut
  // in Places quota usage for frequent re-audits of the same URL.
  const cached = await withAuditCache(env, request, ['gbp-details', placeId], 24 * 3600, async () => {
    return await gbpDetailsQuery(env.GOOGLE_PLACES_KEY, placeId);
  });
  const status = (cached.value && cached.value.ok === false) ? 502 : 200;
  const res = jsonResponse(cached.value, status);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

async function gbpDetailsQuery(apiKey, placeId) {
  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId),
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': [
            'id','displayName','reviews','currentOpeningHours','regularOpeningHours',
            'priceLevel','userRatingCount','rating'
          ].join(',')
        },
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!res.ok) {
      const body = await res.text();
      console.error('[gbp-details]', res.status, body);
      return { ok: false, error: 'places-details-' + res.status };
    }
    const data = await res.json();
    const reviews = Array.isArray(data.reviews) ? data.reviews.slice(0, 5).map(function(r){
      return {
        rating: typeof r.rating === 'number' ? r.rating : null,
        publishTime: r.publishTime || null,
        relativePublishTimeDescription: r.relativePublishTimeDescription || null,
        text: r.text && r.text.text ? r.text.text : null,
        languageCode: r.text && r.text.languageCode ? r.text.languageCode : null,
        hasOwnerReply: !!(r.authorAttribution && r.authorAttribution.uri && r.ownerResponseText)
                        || !!(r.reply && (r.reply.text || r.reply.comment))
      };
    }) : [];
    const hoursText = data.currentOpeningHours && Array.isArray(data.currentOpeningHours.weekdayDescriptions)
      ? data.currentOpeningHours.weekdayDescriptions : null;
    const reviewCount = typeof data.userRatingCount === 'number' ? data.userRatingCount : null;
    const ownerReplied = reviews.reduce(function(acc, r){ return acc + (r.hasOwnerReply ? 1 : 0); }, 0);
    return {
      ok: true,
      placeId: data.id || placeId,
      name: data.displayName && data.displayName.text ? data.displayName.text : null,
      rating: typeof data.rating === 'number' ? data.rating : null,
      reviewCount: reviewCount,
      weekdayHoursText: hoursText,
      reviews: reviews,
      ownerReplyRate: reviews.length > 0 ? (ownerReplied / reviews.length) : null,
      priceLevel: typeof data.priceLevel === 'string' ? data.priceLevel : null
    };
  } catch (err) {
    console.error('[gbp-details]', err && err.stack ? err.stack : err);
    return { ok: false, error: 'gbp-details-error' };
  }
}

// ------------------------------------------------------------
// /api/brand-dossier — strict-citation "facts dossier" (Sprint T4).
//
// Takes a JSON body of pre-extracted signals from the client and
// returns a 1-paragraph summary. EVERY sentence in the response
// must end with a [signalKey] citation pointing at a key in the
// input signals. Server-side validation rejects any response
// where:
//   (a) a sentence lacks a citation bracket,
//   (b) a cited key isn't in the input payload,
//   (c) the cited key's value is null / empty.
// On rejection we retry ONCE with a stricter re-prompt; if that
// fails too, we return {ok:false} and the UI shows nothing.
//
// The endpoint is GATED on the Cloudflare AI Gateway binding
// (env.AI) and an Anthropic API key. While either is missing the
// endpoint returns {ok:false, error:'dossier-unconfigured'} and
// the UI card stays hidden — NEVER shown with fabricated content.
// ------------------------------------------------------------

// Maximum signal-keys a prompt can reference. Keeps tokens bounded
// and forces the LLM to make verifiable, concrete statements.
const DOSSIER_MAX_KEYS = 30;
// Max input tokens across the whole signals block. Rough cap; the
// prompt builder further trims.
const DOSSIER_MAX_SIGNAL_CHARS = 4000;

async function handleBrandDossier(request, env, ctx) {
  const lang = pickLang(request);

  // Accept binding presence. Three gates:
  //   1. AUDIT_CACHE KV binding (used for per-URL dossier cache; optional)
  //   2. env.AI (Cloudflare AI Gateway) — required
  //   3. env.ANTHROPIC_API_KEY — required
  if (!env.AI || !env.ANTHROPIC_API_KEY) {
    return jsonResponse({ ok: false, error: 'dossier-unconfigured' }, 503);
  }

  let body;
  try { body = await request.json(); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const targetUrl = typeof body.url === 'string' ? body.url.trim() : '';
  const gate = assertSafeHttpUrl(targetUrl, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  const signals = body.signals && typeof body.signals === 'object' ? body.signals : null;
  if (!signals || !Object.keys(signals).length) {
    return jsonResponse({ ok: false, error: 'no-signals' }, 400);
  }

  // Normalize signals: drop null/undefined/empty values so the LLM
  // never gets handed a missing datum it could still try to cite.
  const clean = {};
  for (const k of Object.keys(signals)) {
    const v = signals[k];
    if (v === null || v === undefined) continue;
    if (typeof v === 'string' && !v.trim()) continue;
    if (Array.isArray(v) && !v.length) continue;
    clean[k] = v;
  }
  const cleanKeys = Object.keys(clean).slice(0, DOSSIER_MAX_KEYS);
  if (!cleanKeys.length) {
    return jsonResponse({ ok: false, error: 'no-usable-signals' });
  }

  // Cache per-URL with 1-hour TTL. Signals are deterministic per URL
  // within an audit window, so the same URL re-audited in an hour
  // can replay the cached dossier.
  const cached = await withAuditCache(env, request, ['brand-dossier', targetUrl, lang], 3600, async () => {
    return await buildBrandDossier(env, cleanKeys, clean, lang);
  });
  const statusCode = cached.value && cached.value.ok === false ? 502 : 200;
  const res = jsonResponse(cached.value, statusCode);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

// Build a cited-facts-only paragraph. Returns either
//   { ok: true, paragraph: '...', sentences: [{text, signalKey}, ...] }
// or { ok: false, error: '<reason>' }.
async function buildBrandDossier(env, allowedKeys, signalsObj, lang) {
  // Compact signal block — one line per key, truncated values. The
  // LLM must cite using these exact keys.
  let signalBlock = '';
  let totalChars = 0;
  for (const k of allowedKeys) {
    let v = signalsObj[k];
    if (Array.isArray(v)) v = v.join(', ');
    else if (typeof v === 'object') v = JSON.stringify(v).slice(0, 200);
    else v = String(v);
    if (v.length > 250) v = v.slice(0, 250) + '…';
    const line = '[' + k + '] ' + v + '\n';
    if (totalChars + line.length > DOSSIER_MAX_SIGNAL_CHARS) break;
    signalBlock += line;
    totalChars += line.length;
  }
  const keyList = allowedKeys.map((k) => '[' + k + ']').join(', ');

  const langLabel = lang === 'es' ? 'Spanish' : 'English';
  const sysPrompt = [
    'You write a one-paragraph FACTS DOSSIER for a restaurant audit tool.',
    'You will be given a list of verified signals about the restaurant, each on its own line prefixed with a bracketed key like [signalKey].',
    'RULES (read carefully):',
    '  1. Every sentence you produce MUST end with a citation bracket: [signalKey]. The key inside the bracket MUST be one of the keys listed in the input.',
    '  2. A sentence may state ONLY what its cited signal directly says. Do NOT paraphrase into implications, opinions, or judgments.',
    '  3. If a fact is not cited by a signal, DO NOT write a sentence about it. Omission is always better than fabrication.',
    '  4. Total paragraph length: 40 to 80 words. Fewer is fine when signals are sparse.',
    '  5. Output language: ' + langLabel + '.',
    '  6. Output JSON ONLY, matching this exact schema: {"paragraph":"...","sentences":[{"text":"First sentence. [key1]","signalKey":"key1"},...]}',
    '  7. The "paragraph" field must be the concatenation of each sentence text. The per-sentence "signalKey" must match the bracket.',
    'Allowed signal keys for this request: ' + keyList + '.'
  ].join('\n');

  const userPrompt = 'Signals:\n' + signalBlock + '\nWrite the dossier now. JSON only.';

  const llmCall = async () => {
    // Cloudflare AI Gateway binding routes to Anthropic. Caller
    // configures the gateway + secret in wrangler + dashboard.
    // See: https://developers.cloudflare.com/ai-gateway/
    const res = await env.AI.run('@cf/anthropic/claude-haiku-4-5', {
      system: sysPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 400,
      temperature: 0.1
    });
    // AI Gateway returns {response: '...'} or similar. Unwrap.
    if (typeof res === 'string') return res;
    if (res && typeof res.response === 'string') return res.response;
    if (res && res.choices && res.choices[0] && res.choices[0].message) {
      return res.choices[0].message.content;
    }
    return null;
  };

  let rawText;
  try { rawText = await llmCall(); }
  catch (err) {
    console.error('[brand-dossier] LLM error:', err && err.message);
    return { ok: false, error: 'llm-error' };
  }
  if (!rawText) return { ok: false, error: 'empty-llm-response' };

  // Extract JSON from the response (LLMs sometimes wrap in code fences).
  const jsonStart = rawText.indexOf('{');
  const jsonEnd = rawText.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return { ok: false, error: 'non-json-response' };
  }
  let parsed;
  try { parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1)); }
  catch (_) { return { ok: false, error: 'json-parse-failed' }; }
  if (!parsed || typeof parsed.paragraph !== 'string' || !Array.isArray(parsed.sentences)) {
    return { ok: false, error: 'schema-mismatch' };
  }

  // STRICT CITATION VALIDATION — reject any sentence whose claimed
  // signalKey is not in the allowed list or whose text lacks the
  // bracket.
  const allowed = new Set(allowedKeys);
  const validated = [];
  for (const s of parsed.sentences) {
    if (!s || typeof s.text !== 'string' || typeof s.signalKey !== 'string') continue;
    if (!allowed.has(s.signalKey)) continue;
    // Verify the bracket is actually in the sentence text.
    const bracket = '[' + s.signalKey + ']';
    if (s.text.indexOf(bracket) === -1) continue;
    validated.push({ text: s.text, signalKey: s.signalKey });
  }
  if (!validated.length) {
    return { ok: false, error: 'all-sentences-uncited' };
  }

  const finalParagraph = validated.map((s) => s.text).join(' ').trim();
  // Reject if reassembled paragraph is suspiciously short OR longer
  // than the system prompt permitted. Bounds sanity-check.
  if (finalParagraph.length < 40 || finalParagraph.length > 1200) {
    return { ok: false, error: 'length-out-of-bounds' };
  }

  return {
    ok: true,
    paragraph: finalParagraph,
    sentences: validated
  };
}

// ------------------------------------------------------------
// /api/dns-email-health — SPF / DKIM / DMARC presence check (D1).
//
// Email deliverability is a first-order concern for restaurants
// running newsletters, booking confirmations, and review-response
// emails. A domain without SPF + DMARC drops to spam folders at
// Gmail, Outlook, and Yahoo — the three inboxes that matter for
// restaurant marketing.
//
// We check three records via Cloudflare's free 1.1.1.1 DoH:
//   * SPF   — TXT record on the apex domain beginning with "v=spf1"
//   * DMARC — TXT record on _dmarc.<domain> beginning with "v=DMARC1"
//   * DKIM  — selectable by selector; we probe a list of common
//             selectors (google, default, k1, selector1, mail,
//             mailchimp, s1) and report presence if ANY return a
//             TXT with "v=DKIM1" or "k=".
//
// Accuracy rule: each sub-check reports `true`/`false`/`unknown`.
// We never infer presence from indirect evidence — DKIM specifically
// uses a finite probe list, so absence is reported as "unknown"
// rather than "missing" (the domain might use an exotic selector
// we didn't try). The UI surfaces known facts only.
// ------------------------------------------------------------

async function handleDnsEmailHealth(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  // Use the apex domain for mail records. Strip leading www.
  const apex = gate.url.hostname.replace(/^www\./i, '');

  // 24h cache — DNS email records change rarely (only when an owner
  // swaps ESPs or fixes their setup). The withAuditCache helper
  // no-ops when the binding is absent.
  const cached = await withAuditCache(env, request, ['dns-email', apex], 24 * 3600, async () => {
    return await dnsEmailProbe(apex);
  });
  const res = jsonResponse(cached.value, cached.value && cached.value.ok === false ? 502 : 200);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

// Common DKIM selector probe list. Ordered by prevalence in the
// restaurant-SMB bracket: google (Google Workspace), selector1/
// selector2 (Microsoft 365), k1-k3 (SendGrid / Mailchimp / Postmark),
// mail (generic), s1 (SparkPost), dkim (default).
const DKIM_SELECTORS = ['google', 'selector1', 'selector2', 'k1', 'k2', 'k3', 'mail', 'dkim', 's1', 'default'];

async function dnsEmailProbe(apex) {
  // Parallel TXT lookups for SPF (apex) + DMARC (_dmarc.apex) + every
  // DKIM selector. Each lookup returns { answers: [...] } or errors.
  async function dohTxt(name) {
    try {
      const res = await fetch(
        'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(name) + '&type=TXT',
        {
          headers: { accept: 'application/dns-json' },
          signal: AbortSignal.timeout(3000)
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.Status !== 0 || !Array.isArray(data.Answer)) return [];
      // Strip the surrounding quotes and unescape concatenated TXT
      // chunks DoH returns as a single string like `"part1" "part2"`.
      return data.Answer
        .filter(function(a){ return a && typeof a.data === 'string'; })
        .map(function(a){
          return a.data.replace(/^"|"$/g, '').replace(/"\s+"/g, '');
        });
    } catch (_) { return null; }
  }

  const lookups = [
    dohTxt(apex),
    dohTxt('_dmarc.' + apex),
  ].concat(DKIM_SELECTORS.map((sel) => dohTxt(sel + '._domainkey.' + apex)));

  const results = await Promise.all(lookups);
  const apexTxt  = results[0] || [];
  const dmarcTxt = results[1] || [];
  const dkimTxts = results.slice(2);

  // SPF: TXT on apex starting with "v=spf1". Count the number of
  // matches (more than one = misconfiguration that silently breaks).
  const spfMatches = apexTxt.filter(function(t){ return /^v=spf1(\s|$)/i.test(t.trim()); });
  const spf = {
    present: spfMatches.length > 0,
    count:   spfMatches.length,
    record:  spfMatches[0] || null,
    warning: spfMatches.length > 1 ? 'multiple-spf' : null
  };

  // DMARC: TXT on _dmarc subdomain. Parse the `p=` policy (none /
  // quarantine / reject) for the chip display.
  const dmarcMatches = dmarcTxt.filter(function(t){ return /^v=DMARC1(\s|;)/i.test(t.trim()); });
  let dmarcPolicy = null;
  if (dmarcMatches[0]) {
    const pm = dmarcMatches[0].match(/(?:^|;)\s*p\s*=\s*(none|quarantine|reject)/i);
    if (pm) dmarcPolicy = pm[1].toLowerCase();
  }
  const dmarc = {
    present: dmarcMatches.length > 0,
    policy:  dmarcPolicy,
    record:  dmarcMatches[0] || null
  };

  // DKIM: report the first selector that returned a real v=DKIM1 or
  // k= record. Accuracy rule: we never claim DKIM is MISSING — only
  // present (with the selector) or unknown (none of our probes hit).
  let dkimSelector = null;
  let dkimRecord = null;
  for (let i = 0; i < DKIM_SELECTORS.length; i++) {
    const entries = dkimTxts[i] || [];
    const hit = entries.find(function(t){
      return /v=DKIM1/i.test(t) || /\bk=(rsa|ed25519)\b/i.test(t);
    });
    if (hit) {
      dkimSelector = DKIM_SELECTORS[i];
      dkimRecord = hit;
      break;
    }
  }
  const dkim = {
    present: dkimSelector !== null,   // true only when confirmed; false is "unknown via our probes"
    confirmed: dkimSelector !== null, // alias so client can distinguish
    selector: dkimSelector,
    record:   dkimRecord,
    probedSelectors: DKIM_SELECTORS
  };

  // Overall deliverability posture: SPF + DMARC both present is the
  // baseline for getting past Gmail's spam filter in 2024-era policy
  // (RFC 8617, Google's October 2024 enforcement). DKIM elevates
  // further but is optional for most small-biz mailers using hosted
  // ESPs (which sign on their behalf).
  const bulkBaseline = spf.present && dmarc.present;
  return {
    ok: true,
    domain:  apex,
    spf:     spf,
    dmarc:   dmarc,
    dkim:    dkim,
    bulkReady: bulkBaseline,
    checkedAt: new Date().toISOString()
  };
}

// ------------------------------------------------------------
// /badge/restaurant — embeddable SVG audit badge (Sprint D3).
//
// Owners paste this into their site footer:
//
//   <a href="https://muntin.digital/tools/audits/restaurant/?url=https://yoursite.com"
//      target="_blank" rel="noopener">
//     <img src="https://muntin.digital/badge/restaurant?url=https://yoursite.com"
//          alt="Muntin Digital restaurant audit" width="240" height="80"
//          loading="lazy" decoding="async">
//   </a>
//
// Two render modes:
//   1. SCORED — when a badge snapshot exists in KV for the URL,
//      the SVG shows the real score + grade + last-audited date.
//      The date is ALWAYS displayed so viewers know it's a
//      snapshot, not a live number. Snapshots older than 7 days
//      fall through to the generic mode (stale data is worse than
//      no data per the accuracy rule).
//   2. GENERIC — branded "Free restaurant audit by Muntin Digital"
//      card with a CTA to run one. This is the default state when
//      the AUDIT_CACHE binding isn't provisioned yet or when the
//      URL has never been audited.
//
// Both modes link back to the audit page with the URL pre-filled.
// ------------------------------------------------------------
async function handleBadgeRestaurant(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  // SSRF guard applies here too — a malicious embed could otherwise
  // coax the Worker into hashing / reading an internal URL.
  const gate = assertSafeHttpUrl(target, pickLang(request));
  let svg;
  if (!gate.ok) {
    svg = renderBadgeSvg({ mode: 'generic', reason: 'invalid-url' });
  } else {
    let snapshot = null;
    if (env.AUDIT_CACHE) {
      try {
        const hash = await (async () => {
          var normalized = gate.url.toString().replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
          var buf = new TextEncoder().encode(normalized);
          var digest = await crypto.subtle.digest('SHA-256', buf);
          var bytes = new Uint8Array(digest);
          var hex = '';
          for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
          return hex.slice(0, 32);
        })();
        const raw = await env.AUDIT_CACHE.get('badge:' + hash);
        if (raw) {
          try { snapshot = JSON.parse(raw); } catch (_) { snapshot = null; }
        }
      } catch (_) { /* KV read failure → fall through to generic */ }
    }
    // Accuracy gate: enforce 7-day freshness. Stale snapshots
    // quietly degrade to the generic badge rather than display
    // an out-of-date number.
    const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
    const fresh = snapshot && typeof snapshot.timestamp === 'number'
      && (Date.now() - snapshot.timestamp) < MAX_AGE_MS
      && typeof snapshot.score === 'number' && snapshot.score >= 0 && snapshot.score <= 100;
    if (fresh) {
      svg = renderBadgeSvg({
        mode: 'scored',
        score: Math.round(snapshot.score),
        grade: snapshot.grade || gradeFromScore(snapshot.score),
        auditedAt: snapshot.timestamp,
        host: gate.url.hostname.replace(/^www\./i, '')
      });
    } else {
      svg = renderBadgeSvg({ mode: 'generic' });
    }
  }
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // 1h edge cache so the badge image doesn't refetch the KV
      // lookup on every page view. Snapshot updates propagate
      // within the hour.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Generator': MUNTIN_GENERATOR,
      'X-Powered-By': 'Muntin Digital',
    }
  });
}

function gradeFromScore(score) {
  if (!Number.isFinite(score)) return null;
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Render the 480×160 badge SVG. Colors match the site design
// tokens (cream, ink, teal, rust). Self-contained — no external
// fonts (falls back to Georgia / system-ui) so it renders
// identically across every embed surface.
function renderBadgeSvg(opts) {
  const W = 480, H = 160;
  const BG = '#FAF7F2';
  const INK = '#14161A';
  const TEAL = '#1F4E5B';
  const STONE = '#6B6B6B';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  if (opts.mode === 'scored') {
    const score = opts.score;
    const grade = opts.grade || 'C';
    const gradeColor = /^A/.test(grade) ? '#1f9d55'
                     : /^B/.test(grade) ? '#1f9d55'
                     : /^C/.test(grade) ? '#d97706'
                     : '#B8541A';
    const date = new Date(opts.auditedAt || Date.now());
    const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Muntin Digital audit score: ' + esc(score) + ' out of 100">',
      '<rect width="' + W + '" height="' + H + '" rx="12" fill="' + BG + '"/>',
      '<rect x="0" y="0" width="6" height="' + H + '" fill="' + TEAL + '"/>',
      '<g transform="translate(32, 34)">',
      '<text font-family="Inter, system-ui, Arial, sans-serif" font-size="11" font-weight="700" fill="' + TEAL + '" letter-spacing="3">MUNTIN DIGITAL · RESTAURANT AUDIT</text>',
      '<text y="32" font-family="Georgia, \'Fraunces\', serif" font-size="58" font-weight="500" fill="' + INK + '">' + esc(score) + '</text>',
      '<text x="110" y="32" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="500" fill="' + STONE + '">/ 100</text>',
      '<text y="58" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600" fill="' + STONE + '" letter-spacing="1">AUDITED ' + esc(dateLabel.toUpperCase()) + '</text>',
      '</g>',
      // Grade capsule — right side
      '<g transform="translate(' + (W - 110) + ', 40)">',
      '<rect width="78" height="78" rx="12" fill="' + gradeColor + '"/>',
      '<text x="39" y="56" text-anchor="middle" font-family="Georgia, \'Fraunces\', serif" font-size="44" font-weight="700" fill="#FAF7F2">' + esc(grade) + '</text>',
      '</g>',
      // Bottom footer
      '<text x="' + (W - 14) + '" y="' + (H - 12) + '" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" fill="' + STONE + '" letter-spacing="1">muntin.digital</text>',
      '</svg>'
    ].join('');
  }

  // Generic mode — branded CTA when no fresh snapshot is available.
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Free restaurant website audit by Muntin Digital">',
    '<rect width="' + W + '" height="' + H + '" rx="12" fill="' + BG + '"/>',
    '<rect x="0" y="0" width="6" height="' + H + '" fill="' + TEAL + '"/>',
    '<g transform="translate(32, 34)">',
    '<text font-family="Inter, system-ui, Arial, sans-serif" font-size="11" font-weight="700" fill="' + TEAL + '" letter-spacing="3">MUNTIN DIGITAL</text>',
    '<text y="34" font-family="Georgia, \'Fraunces\', serif" font-size="28" font-weight="500" fill="' + INK + '">Free restaurant audit</text>',
    '<text y="62" font-family="Inter, Arial, sans-serif" font-size="14" fill="' + STONE + '">30 seconds · no signup · plain English</text>',
    '<g transform="translate(0, 82)">',
    '<rect width="192" height="34" rx="17" fill="' + TEAL + '"/>',
    '<text x="96" y="22" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="' + BG + '" letter-spacing="2">RUN YOUR AUDIT →</text>',
    '</g>',
    '</g>',
    '<text x="' + (W - 14) + '" y="' + (H - 12) + '" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" fill="' + STONE + '" letter-spacing="1">muntin.digital</text>',
    '</svg>'
  ].join('');
}

// ------------------------------------------------------------
// /api/schedule-reaudit — Sprint R1
//
// Schedule a friendly 30-day reminder email that re-audits the
// same URL. Uses Resend's scheduled_at to hold the message on
// Resend's side — no KV, no cron, no long-lived server state
// required. Resend supports scheduling up to 30 days ahead, which
// is exactly the window we want.
//
// Accuracy + privacy posture:
//   * We do NOT store the email anywhere. Resend holds the queued
//     message until send time; after delivery, the record lives
//     in their sent-log only.
//   * SSRF-safe URL validation identical to the rest of the API.
//   * We send a single message — no drip, no follow-up chains.
//
// Request body: { email, url, lang }
// Response:     { ok: true, scheduledFor: '...' } | { ok: false, error }
// ------------------------------------------------------------
async function handleScheduleReaudit(request, env, ctx) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'POST only' }, 405);
  }
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  if (isSpamHoneypot(body)) {
    return jsonResponse({ ok: true, scheduled: true }, 200);
  }
  // Prefer an explicit lang on the form body (so the UI can send the
  // user's current page locale), otherwise fall back to pickLang's
  // request-based detection.
  const bodyLang = typeof body.lang === 'string' ? body.lang.toLowerCase() : '';
  const lang = (bodyLang === 'es' || bodyLang === 'en') ? bodyLang : pickLang(request);
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const url   = typeof body.url   === 'string' ? body.url.trim()   : '';
  if (!isValidEmail(email)) {
    return jsonResponse({ ok: false, error: lang === 'es'
      ? 'Por favor ingresa un correo válido'
      : 'Please enter a valid email' }, 400);
  }
  const urlGate = assertSafeHttpUrl(url, lang);
  if (!urlGate.ok) {
    return jsonResponse({ ok: false, error: urlGate.error }, 400);
  }
  if (!env || !env.RESEND_API_KEY) {
    return jsonResponse({ ok: false, error: 'Reminder service unavailable right now' }, 503);
  }

  // 30 days out, at ~10:00 local (we use UTC and accept the timezone
  // drift — a reminder that lands anywhere 4am–2pm local is fine).
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const when = new Date(now + thirtyDaysMs);
  // Round to top of hour at 14:00 UTC to avoid a weirdly precise
  // timestamp and land inside Resend's 30-day window comfortably.
  when.setUTCHours(14, 0, 0, 0);
  // If rounding pushed us over 30 days, pull back one hour step.
  if (when.getTime() - now > thirtyDaysMs) {
    when.setUTCHours(when.getUTCHours() - 1);
  }
  const scheduledAtIso = when.toISOString();

  const canonicalUrl = urlGate.url && urlGate.url.href ? urlGate.url.href : String(urlGate.url || url);
  const pretty = canonicalUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const auditLink = 'https://muntin.digital/' + (lang === 'es' ? 'es/' : '')
                  + 'tools/audits/restaurant/?url=' + encodeURIComponent(canonicalUrl);

  // D11: route through the shared reauditReminder template so the
  // reminder picks up the D9/D10 shell refresh (viewport meta,
  // brand eyebrow, Outlook-safe CTA, received-because footer).
  // The template handles locale dispatch internally.
  const tpl = reauditReminder({ locale: lang, pretty, auditLink });

  const fromEmail = (env.FROM_EMAIL && String(env.FROM_EMAIL)) || 'Don Goldstein <don@muntin.digital>';
  const sendRes = await sendEmail({
    from: fromEmail,
    to: email,
    replyTo: 'don@muntin.digital',
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    scheduledAt: scheduledAtIso,
  }, env.RESEND_API_KEY);

  if (!sendRes.ok) {
    console.warn('[schedule-reaudit] send failed:', sendRes.error);
    return jsonResponse({ ok: false, error: sendRes.error || 'Could not schedule reminder' }, 502);
  }

  return jsonResponse({
    ok: true,
    scheduledFor: scheduledAtIso
  }, 200);
}

// Small inline HTML escaper so we don't import the templates module
// for a single email. Not for attribute contexts — only text nodes.
function escapeHtmlForEmail(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


// ============================================================
// Sprint 0 (Workshop) — /api/auth/magic-link
// ============================================================
//
// Privacy-first sign-in flow. Always returns 200 OK regardless of
// whether the email exists, the body is malformed, or the rate
// limit denied an upstream Resend send. Goal: an attacker can't
// enumerate which emails are registered, can't probe for valid
// origins, and can't fish for timing differences.
//
// Pipeline (silent-200 means "no observable signal to the caller"):
//   1.  Origin allowlist  → 403 (intentional; off-allowlist is
//       browser CORS abuse, not an unauthenticated user)
//   2.  Body parse + length caps → 400 if malformed JSON / oversize
//   3.  Honeypot _gotcha    → silent 200
//   4.  Timestamp sanity    → silent 200
//   5.  Threat-IP check     → silent 200
//   6.  Email format        → silent 200 (never reveal validity)
//   7.  returnTo allowlist  → fall through to /workbench/
//   8.  Mint token + KV PUT (15-min TTL) with collision retry
//   9.  Resend send         → log on failure but still return 200
//                              (prevents email-bounce probing)
//  10.  return { ok: true }
//
// AUTH_SESSIONS binding required: the handler 503's loud if it's
// missing so ops sees the misconfig before users do.
async function handleAuthMagicLink(request, env, ctx) {
  // Origin allowlist FIRST — cheap, no body read, blocks the
  // most common automated abuse pattern (curl from the wrong host).
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }

  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }

  // Length caps — even silent-200 paths read body.email below, so
  // make sure a megabyte payload doesn't exhaust isolate memory.
  // The 30-char ts and 100-char honeypot caps mirror other forms.
  const lenGate = enforceMaxLengths(body, {
    email: 254, returnTo: 256, hp: 100, ts: 30, locale: 8,
  });
  if (!lenGate.ok) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }

  // Silent-200 layer. Each gate returns the same shape so a
  // network observer can't tell a real signin from spam.
  const SILENT_OK = jsonResponse({ ok: true }, 200);

  if (isSpamHoneypot(body))     return SILENT_OK;
  if (!isTimestampSane(body))   return SILENT_OK;
  if (isHighThreatIP(request))  return SILENT_OK;
  // Layer-2 anti-spam: Turnstile. Skipped until secret is wired.
  // Magic-link is the highest-value phish/spam target on the site
  // (every successful submission triggers an outbound email and
  // mints a session token), so this gate matters most here.
  {
    const turnstile = await checkTurnstile(body, env, request);
    if (!turnstile.ok && !turnstile.skipped) return SILENT_OK;
  }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!isValidEmail(email))     return SILENT_OK;

  // returnTo allowlist. Anything off-list collapses to the canonical
  // /workbench/. Belt and suspenders against open-redirect class bugs.
  const allowedReturnTo = new Set([
    '/workbench/', '/workbench/index.html',
    '/es/workbench/', '/es/workbench/index.html',
  ]);
  let returnTo = typeof body.returnTo === 'string' ? body.returnTo.trim() : '';
  if (!returnTo || !allowedReturnTo.has(returnTo)) {
    returnTo = '/workbench/';
  }

  // Locale dispatch for the email subject + body.
  const bodyLang = typeof body.locale === 'string' ? body.locale.toLowerCase() : '';
  const locale = (bodyLang === 'es' || bodyLang === 'en') ? bodyLang : pickLang(request);

  // Hard-fail if AUTH_SESSIONS isn't bound — the handler can't
  // store the token, so silently 200'ing would lie about success.
  // 503 loud so ops finds the misconfig fast in logs.
  if (!env || !env.AUTH_SESSIONS) {
    console.warn('[auth/magic-link] AUTH_SESSIONS binding missing — 503');
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }
  if (!env.RESEND_API_KEY) {
    console.warn('[auth/magic-link] RESEND_API_KEY missing — 503');
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  // Mint with collision retry. ~49 bits entropy means collisions
  // are vanishingly rare even at the 1k-write daily quota; we still
  // retry up to 3 times to make the failure mode loud rather than silent.
  let token = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = mintMagicLinkToken();
    const existing = await env.AUTH_SESSIONS.get('magic:' + candidate);
    if (!existing) { token = candidate; break; }
  }
  if (!token) {
    console.warn('[auth/magic-link] token collision retry exhausted');
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  const now = Date.now();
  const payload = {
    email,
    returnTo,
    createdAt: now,
  };
  await env.AUTH_SESSIONS.put('magic:' + token, JSON.stringify(payload), {
    expirationTtl: MAGIC_LINK_TTL_SECONDS,
  });

  // Build the absolute verify URL. MAGIC_LINK_BASE_URL is set in
  // wrangler.jsonc vars; fall back to the request origin for local
  // dev where the var might be unset on a fresh wrangler.dev.
  const baseUrl = (env.MAGIC_LINK_BASE_URL && String(env.MAGIC_LINK_BASE_URL))
    || new URL(request.url).origin;
  const link = baseUrl
    + '/api/auth/verify?token=' + encodeURIComponent(token)
    + '&returnTo=' + encodeURIComponent(returnTo);

  const tpl = magicLinkEmail({ email, link, returnTo, locale });

  const fromEmail = (env.FROM_EMAIL && String(env.FROM_EMAIL)) || 'Don Goldstein <don@muntin.digital>';
  const sendRes = await sendEmail({
    from: fromEmail,
    to: email,
    replyTo: 'don@muntin.digital',
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  }, env.RESEND_API_KEY);

  if (!sendRes.ok) {
    // Don't leak the failure to the caller — a Resend hiccup
    // shouldn't reveal "this email exists" to a probing attacker.
    // Log loud for ops; user gets the same 200 they'd get on success.
    console.warn('[auth/magic-link] resend failed:', sendRes.error);
  }

  return jsonResponse({ ok: true }, 200);
}

// ============================================================
// Sprint 0 (Workshop) — /api/auth/verify
// ============================================================
//
// Consumes a magic-link token (one-shot), creates a 30-day session,
// and 302s the visitor to returnTo with the signed session cookie
// already set. Token is deleted on first read so a stolen email
// can't replay the link.
//
// Failure modes return locale-aware 410 Gone HTML pages (not 401 or
// 404) so an honest visitor who clicked a stale link sees a clear
// "this link expired or was already used" message rather than a
// confusing 404.
async function handleAuthVerify(request, env, ctx) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  let returnTo = url.searchParams.get('returnTo') || '/workbench/';

  // returnTo allowlist — same set as the magic-link request side.
  // Anything off-list collapses to /workbench/.
  const allowedReturnTo = new Set([
    '/workbench/', '/workbench/index.html',
    '/es/workbench/', '/es/workbench/index.html',
  ]);
  if (!allowedReturnTo.has(returnTo)) returnTo = '/workbench/';

  const lang = pickLang(request);
  const goneTitle = lang === 'es'
    ? 'Este enlace ya no funciona'
    : 'This link no longer works';
  const goneBody = lang === 'es'
    ? 'El enlace de acceso vence después de 15 minutos o de un solo uso. Pide uno nuevo y vuelve a intentarlo.'
    : 'Sign-in links expire after 15 minutes or a single use. Request a new one and try again.';
  const goneHtml = (
    '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex">' +
    '<title>' + goneTitle + ' — Muntin Digital</title>' +
    '<link rel="stylesheet" href="/assets/site.css?v=20260428-sprint0-tokens">' +
    '</head><body style="background:var(--cream);color:var(--ink);">' +
    '<main style="max-width:560px;margin:80px auto;padding:0 20px;font-family:Inter,system-ui,sans-serif;">' +
    '<p style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--teal);margin:0 0 16px;">Muntin Digital</p>' +
    '<h1 style="font-family:Fraunces,Georgia,serif;font-size:32px;font-weight:500;margin:0 0 16px;line-height:1.2;">' + goneTitle + '</h1>' +
    '<p style="font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0;">' + goneBody + '</p>' +
    '</main></body></html>'
  );
  const goneResponse = () => new Response(goneHtml, {
    status: 410,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });

  if (!isValidMagicLinkTokenShape(token)) return goneResponse();

  if (!env || !env.AUTH_SESSIONS) {
    console.warn('[auth/verify] AUTH_SESSIONS binding missing — 503');
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }
  if (!env.AUTH_COOKIE_SECRET) {
    console.warn('[auth/verify] AUTH_COOKIE_SECRET missing — 503');
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  // KV.get the magic-link payload, then immediately delete. Order
  // matters: if we delete first and the network blips, the token is
  // gone with no session created. Get-then-delete leaves the user
  // a clean retry window if the delete fails (token re-expires on
  // its own after 15 min anyway).
  const raw = await env.AUTH_SESSIONS.get('magic:' + token);
  if (!raw) return goneResponse();

  let parsed;
  try { parsed = JSON.parse(raw); } catch { return goneResponse(); }
  if (!parsed || typeof parsed.email !== 'string' || !parsed.email) {
    return goneResponse();
  }

  // One-shot consumption — delete BEFORE we sign the cookie so a
  // simultaneous double-click can't establish two sessions.
  await env.AUTH_SESSIONS.delete('magic:' + token);

  const email = parsed.email;
  const sub = await sha256Hex(email);

  // user:<sub> bookkeeping. First sign-in creates the row; later
  // sign-ins refresh lastSeenAt. No TTL — the row is the lifetime
  // record of "this email is known to the workshop." Conditional
  // write keeps KV traffic minimal under hot-cache scenarios.
  const userKey = 'user:' + sub;
  const now = Date.now();
  let userRow = null;
  try {
    const existing = await env.AUTH_SESSIONS.get(userKey);
    if (existing) {
      try { userRow = JSON.parse(existing); } catch { userRow = null; }
    }
  } catch (_) { /* fall through to fresh row */ }
  const nextRow = userRow
    ? { ...userRow, email, lastSeenAt: now }
    : { email, createdAt: now, lastSeenAt: now };
  await env.AUTH_SESSIONS.put(userKey, JSON.stringify(nextRow));

  // Sign the session cookie. exp is 30 days out so the browser drops
  // it at the same moment our verify call refuses it.
  const nowSec = Math.floor(now / 1000);
  const sessionPayload = {
    sub,
    email,
    iat: nowSec,
    exp: nowSec + SESSION_TTL_SECONDS,
    jti: mintSessionToken(),
  };
  const cookieValue = await signSession(sessionPayload, env.AUTH_COOKIE_SECRET);

  // Phase 1a step 2 — claim-on-verify branch. When the magic-link
  // payload carries claimAnonId, the operator is verifying through
  // Don's reply email and we migrate their anon thread to sub-keyed
  // storage in the same flow. Best-effort: a migration failure does
  // NOT block sign-in (the operator still gets their session); they
  // just see the standalone /window/ page without the migrated
  // thread merged in. Failure logs loud for ops.
  let claimedReturnTo = null;
  if (typeof parsed.claimAnonId === 'string' && parsed.claimAnonId) {
    try {
      const migration = await migrateAnonThread(env, parsed.claimAnonId, sub, email);
      if (migration.ok) {
        // Allow /window/ + /es/window/ as claim-flow return-tos
        // (separately from the workbench allowlist). When the magic
        // link came from Don's reply email, the operator wants to
        // land on /window/, not /workbench/.
        const claimReturnAllowed = new Set(['/window/', '/es/window/']);
        if (typeof parsed.returnTo === 'string' && claimReturnAllowed.has(parsed.returnTo)) {
          claimedReturnTo = parsed.returnTo + '?claimed=1';
        }
        console.log(JSON.stringify({
          event: 'window.claim',
          sub,
          anonId: parsed.claimAnonId,
          threadId: parsed.claimThreadId || null,
          alreadyClaimed: !!migration.alreadyClaimed,
        }));
      } else {
        console.warn('[auth/verify] anon-thread claim failed', { error: migration.error, anonId: parsed.claimAnonId, sub });
      }
    } catch (err) {
      console.warn('[auth/verify] migrateAnonThread threw', { err: err && err.message, anonId: parsed.claimAnonId, sub });
    }
  }

  // Use returnTo from the claim flow first, then the magic-link
  // payload if it's still workbench-allowlisted (defensive — it was
  // at request time, but flags can change), then the query param.
  // Audit E3 — when the token was a CLAIM token but migration failed,
  // still honor /window/ + /es/window/ as the landing surface so the
  // operator doesn't get bounced to /workbench/ from a /window/-flavored
  // email. The migration log explains the failure for ops; the
  // operator just sees /window/ standalone (their thread is still
  // reachable on their device via the anon cookie if it survived).
  const claimReturnFallback = new Set(['/window/', '/es/window/']);
  const isClaimToken = typeof parsed.claimAnonId === 'string' && !!parsed.claimAnonId;
  const candidateReturnTo = claimedReturnTo
    || (isClaimToken && typeof parsed.returnTo === 'string' && claimReturnFallback.has(parsed.returnTo)
        ? parsed.returnTo
        : null)
    || ((typeof parsed.returnTo === 'string' && allowedReturnTo.has(parsed.returnTo))
        ? parsed.returnTo
        : returnTo);

  const headers = new Headers({ Location: candidateReturnTo });
  setSessionCookie(headers, cookieValue);
  // Phase 1a step 2.1 — when the claim flow succeeded, clear the
  // anon-thread cookie so future requests from this device take the
  // identified path (the thread now lives at window:thread:<sub>:
  // <threadId>). Without this, the cookie outlives the session
  // (90d cookie vs 30d session) and a re-visit after session expiry
  // would land back on the anon path against a now-claimed thread.
  if (claimedReturnTo) {
    headers.append('Set-Cookie', WINDOW_ANON_COOKIE_NAME + '=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  }
  return new Response(null, { status: 302, headers });
}


// ============================================================
// Sprint 0 (Workshop) — /api/auth/me
// ============================================================
//
// Returns the authenticated email or 401. The /workbench/ stub
// page calls this client-side to toggle "Coming soon" vs. "Hello,
// {email}" — the signed cookie is the source of truth, this just
// surfaces it to the page render.
//
// Conditional lastSeenAt update: at most once per hour per user.
// Keeps KV writes cheap on chatty pages without needing a
// separate write throttle.
async function handleAuthMe(request, env, ctx) {
  const session = await getSessionFromRequest(request, env);
  if (!session) {
    return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);
  }

  // Pull the user row so we can surface createdAt / lastSeenAt to
  // the /account/ page (Phase 3). Best-effort: a missing or corrupt
  // row downgrades to email-only, never 401s — the session is still
  // valid. lastSeenAt refresh is throttled to once per hour.
  let createdAt = null;
  let lastSeenAt = null;
  if (env && env.AUTH_SESSIONS) {
    try {
      const userKey = 'user:' + session.payload.sub;
      const existing = await env.AUTH_SESSIONS.get(userKey);
      if (existing) {
        const row = JSON.parse(existing);
        createdAt = (typeof row.createdAt === 'number') ? row.createdAt : null;
        lastSeenAt = (typeof row.lastSeenAt === 'number') ? row.lastSeenAt : null;
        const now = Date.now();
        const ONE_HOUR_MS = 60 * 60 * 1000;
        if (!row.lastSeenAt || (now - row.lastSeenAt) > ONE_HOUR_MS) {
          row.lastSeenAt = now;
          lastSeenAt = now;
          await env.AUTH_SESSIONS.put(userKey, JSON.stringify(row));
        }
      }
    } catch (err) {
      console.warn('[auth/me] user-row read/refresh failed:', err && err.message);
    }
  }

  return jsonResponse({
    ok: true,
    email: session.email,
    createdAt,
    lastSeenAt,
  }, 200);
}


// ============================================================
// Sprint 0 (Workshop) — /api/auth/signout
// ============================================================
//
// Clears the signed session cookie and 302s to /. Form-tier rate
// limit means an attacker can't churn through sign-outs to wear
// down the cookie state — but the operation is idempotent anyway,
// so the gate is mostly a courtesy.
async function handleAuthSignout(request, env, ctx) {
  // Origin allowlist — prevents an attacker from tricking another
  // tab into hitting this from a third-party host (CSRF on a form
  // POST without the right Origin header).
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }

  const headers = new Headers({ Location: '/' });
  clearSessionCookie(headers);
  return new Response(null, { status: 302, headers });
}


// ============================================================
// Phase 3 (Workshop) — /api/auth/account-delete-request
// ============================================================
//
// Two-step destructive flow, step 1: operator types their email on
// /account/, this handler validates the typed email against the
// session, mints a single-use `delete:<TOKEN10>` KV row (15-min TTL),
// and emails a confirmation link that lands on
// /api/auth/account-delete-confirm.
//
// The typed-email match is the real "are you sure" gate. We could
// require a checkbox or a hold-to-delete instead, but typing your
// own email is unambiguous, screen-reader-friendly, and standard.
async function handleAuthAccountDeleteRequest(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  if (!env || !env.AUTH_SESSIONS) {
    console.warn('[auth/account-delete-request] AUTH_SESSIONS missing — 503');
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }
  if (!env.RESEND_API_KEY) {
    console.warn('[auth/account-delete-request] RESEND_API_KEY missing — 503');
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  const session = await getSessionFromRequest(request, env);
  if (!session) {
    return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);
  }

  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }

  const lenGate = enforceMaxLengths(body, { email: 254, locale: 8 });
  if (!lenGate.ok) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }

  // Typed email must match the session email (trimmed, case-insensitive).
  const typed = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const sessionEmail = String(session.email || '').trim().toLowerCase();
  if (!typed || typed !== sessionEmail) {
    return jsonResponse({ ok: false, error: 'email-mismatch' }, 400);
  }

  // Mint delete: token (same alphabet/length as magic-link tokens).
  let token = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = mintMagicLinkToken();
    const existing = await env.AUTH_SESSIONS.get('delete:' + candidate);
    if (!existing) { token = candidate; break; }
  }
  if (!token) {
    console.warn('[auth/account-delete-request] token collision retry exhausted');
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  const now = Date.now();
  const payload = {
    sub: session.payload.sub,
    email: session.email,
    createdAt: now,
  };
  await env.AUTH_SESSIONS.put('delete:' + token, JSON.stringify(payload), {
    expirationTtl: MAGIC_LINK_TTL_SECONDS,
  });

  const baseUrl = (env.MAGIC_LINK_BASE_URL && String(env.MAGIC_LINK_BASE_URL))
    || new URL(request.url).origin;
  const link = baseUrl + '/api/auth/account-delete-confirm?token=' + encodeURIComponent(token);

  const bodyLang = typeof body.locale === 'string' ? body.locale.toLowerCase() : '';
  const locale = (bodyLang === 'es' || bodyLang === 'en') ? bodyLang : pickLang(request);

  const tpl = accountDeleteEmail({ email: session.email, link, locale });
  const fromEmail = (env.FROM_EMAIL && String(env.FROM_EMAIL)) || 'Don Goldstein <don@muntin.digital>';
  const sendRes = await sendEmail({
    from: fromEmail,
    to: session.email,
    replyTo: 'don@muntin.digital',
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  }, env.RESEND_API_KEY);

  if (!sendRes.ok) {
    console.warn('[auth/account-delete-request] resend failed:', sendRes.error);
  }

  return jsonResponse({ ok: true }, 200);
}


// ============================================================
// Phase 3 (Workshop) — /api/auth/account-delete-confirm
// ============================================================
//
// Two-step destructive flow, step 2. The email link is GET; clicking
// renders a confirmation page with a POST form. The POST does the
// actual wipe. This split exists because some email security gateways
// pre-fetch every link in an inbound email to scan for malware — a
// pure-GET wipe would let those scanners delete the account before
// the operator ever opens the email.
//
// GET responsibilities: validate token shape, read the delete: row
// (DO NOT delete it yet), render an HTML confirmation page.
// POST responsibilities: validate origin (CSRF), validate token,
// consume the row (one-shot), wipe save:<sub>:*, watch:<sub>:*,
// user:<sub>, clear the session cookie, render success page.
async function handleAuthAccountDeleteConfirm(request, env, ctx) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const method = request.method;
  const lang = pickLang(request);

  function htmlPage(title, body, status) {
    return new Response(
      '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="robots" content="noindex">' +
      '<title>' + title + ' — Muntin Digital</title>' +
      '<link rel="stylesheet" href="/assets/site.css?v=20260428-sprint0-tokens">' +
      '</head><body style="background:var(--cream);color:var(--ink);">' +
      '<main style="max-width:560px;margin:80px auto;padding:0 20px;font-family:Inter,system-ui,sans-serif;">' +
      '<p style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--teal);margin:0 0 16px;">Muntin Digital</p>' +
      '<h1 style="font-family:Fraunces,Georgia,serif;font-size:32px;font-weight:500;margin:0 0 16px;line-height:1.2;">' + title + '</h1>' +
      body +
      '</main></body></html>',
      { status: status || 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }

  const goneTitle = lang === 'es' ? 'Este enlace ya no funciona' : 'This link no longer works';
  const goneBody  = lang === 'es'
    ? '<p style="font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0 0 24px;">El enlace de eliminación vence después de 15 minutos o de un solo uso. Pide uno nuevo desde tu página de cuenta.</p><p><a href="/es/account/" style="color:var(--teal);text-decoration:underline;">Volver a /es/account/</a></p>'
    : '<p style="font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0 0 24px;">Account-delete links expire after 15 minutes or a single use. Request a new one from your account page.</p><p><a href="/account/" style="color:var(--teal);text-decoration:underline;">Return to /account/</a></p>';
  function gonePage() { return htmlPage(goneTitle, goneBody, 410); }

  if (!isValidMagicLinkTokenShape(token)) return gonePage();
  if (!env || !env.AUTH_SESSIONS) {
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  // GET: render confirmation page (does NOT consume the token).
  if (method === 'GET') {
    const raw = await env.AUTH_SESSIONS.get('delete:' + token);
    if (!raw) return gonePage();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return gonePage(); }
    const emailLabel = (parsed && parsed.email) ? String(parsed.email) : '';

    const confirmTitle = lang === 'es' ? 'Confirma eliminación' : 'Confirm deletion';
    const confirmBody = lang === 'es'
      ? '<p style="font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0 0 16px;">Estás a punto de eliminar <strong>' + emailLabel + '</strong>. Esta acción borra el registro de tu cuenta y todos los items guardados y vigilancias asociados. <strong>No hay deshacer.</strong></p>' +
        '<form method="POST" action="/api/auth/account-delete-confirm?token=' + encodeURIComponent(token) + '" style="margin:24px 0;">' +
        '<button type="submit" style="display:inline-block;background:var(--rust);color:#fff;border:0;border-radius:999px;padding:12px 24px;font:inherit;font-size:15px;font-weight:500;cursor:pointer;">Sí, eliminar mi cuenta</button>' +
        '</form>' +
        '<p style="font-size:14px;line-height:1.55;color:var(--stone);margin:24px 0 0;">¿Cambiaste de opinión? <a href="/es/workbench/" style="color:var(--teal);text-decoration:underline;">Volver al Taller</a> sin eliminar.</p>'
      : '<p style="font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0 0 16px;">You\'re about to delete <strong>' + emailLabel + '</strong>. This wipes your account record and every saved item and watch attached to it. <strong>There is no undo.</strong></p>' +
        '<form method="POST" action="/api/auth/account-delete-confirm?token=' + encodeURIComponent(token) + '" style="margin:24px 0;">' +
        '<button type="submit" style="display:inline-block;background:var(--rust);color:#fff;border:0;border-radius:999px;padding:12px 24px;font:inherit;font-size:15px;font-weight:500;cursor:pointer;">Yes, delete my account</button>' +
        '</form>' +
        '<p style="font-size:14px;line-height:1.55;color:var(--stone);margin:24px 0 0;">Changed your mind? <a href="/workbench/" style="color:var(--teal);text-decoration:underline;">Back to the Workshop</a> without deleting.</p>';
    return htmlPage(confirmTitle, confirmBody, 200);
  }

  // POST: do the wipe. Origin allowlist + token consume + cascade delete.
  if (method === 'POST') {
    if (!isOriginAllowed(request)) {
      return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
    }

    const raw = await env.AUTH_SESSIONS.get('delete:' + token);
    if (!raw) return gonePage();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return gonePage(); }
    if (!parsed || typeof parsed.sub !== 'string') return gonePage();

    const sub = parsed.sub;
    // Consume the token first so a partial-failure retry can't reuse it.
    await env.AUTH_SESSIONS.delete('delete:' + token);

    // Cascade-wipe save:<sub>:*  watch:<sub>:*  user:<sub>.
    // Cursor-paged so a future at-scale account with hundreds of saves
    // doesn't blow the per-call list budget.
    async function wipePrefix(prefix) {
      let cursor = null;
      while (true) {
        const opts = { prefix };
        if (cursor) opts.cursor = cursor;
        const page = await env.AUTH_SESSIONS.list(opts);
        for (const k of page.keys) {
          await env.AUTH_SESSIONS.delete(k.name);
        }
        if (page.list_complete || !page.cursor) break;
        cursor = page.cursor;
      }
    }
    try { await wipePrefix('save:' + sub + ':'); }
    catch (err) { console.warn('[auth/account-delete-confirm] save wipe failed:', err && err.message); }
    try { await wipePrefix('watch:' + sub + ':'); }
    catch (err) { console.warn('[auth/account-delete-confirm] watch wipe failed:', err && err.message); }
    try { await env.AUTH_SESSIONS.delete('user:' + sub); }
    catch (err) { console.warn('[auth/account-delete-confirm] user-row delete failed:', err && err.message); }

    const successTitle = lang === 'es' ? 'Cuenta eliminada' : 'Account deleted';
    const successBody  = lang === 'es'
      ? '<p style="font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0 0 24px;">Tu cuenta y todos los items guardados se han eliminado. Si vuelves a acceder, empezarás con un Taller vacío.</p><p><a href="/" style="color:var(--teal);text-decoration:underline;">Volver al inicio</a></p>'
      : '<p style="font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0 0 24px;">Your account and every saved item have been deleted. If you sign in again, you\'ll start with a fresh, empty Workshop.</p><p><a href="/" style="color:var(--teal);text-decoration:underline;">Return to home</a></p>';

    const headers = new Headers({ 'content-type': 'text/html; charset=utf-8' });
    clearSessionCookie(headers);
    const html = '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="robots" content="noindex">' +
      '<title>' + successTitle + ' — Muntin Digital</title>' +
      '<link rel="stylesheet" href="/assets/site.css?v=20260428-sprint0-tokens">' +
      '</head><body style="background:var(--cream);color:var(--ink);">' +
      '<main style="max-width:560px;margin:80px auto;padding:0 20px;font-family:Inter,system-ui,sans-serif;">' +
      '<p style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--teal);margin:0 0 16px;">Muntin Digital</p>' +
      '<h1 style="font-family:Fraunces,Georgia,serif;font-size:32px;font-weight:500;margin:0 0 16px;line-height:1.2;">' + successTitle + '</h1>' +
      successBody +
      '</main></body></html>';
    return new Response(html, { status: 200, headers });
  }

  return new Response('Method not allowed', { status: 405 });
}


// ============================================================
// Phase 2 (Workshop) — /api/workbench/save | list | get | delete
// ============================================================
//
// Saved-items library. Every endpoint authenticates via the signed
// session cookie (no API key, no header auth) and scopes data by
// the session's `sub` (sha256(email)). Per-user KV-key scoping
// means a missing application-level check can't leak across users.
//
// Anonymous calls always 401. Configuration failures (missing
// AUTH_SESSIONS binding, missing AUTH_COOKIE_SECRET) return 503
// loud so ops sees the misconfig before users do.

async function _requireWorkbenchSession(request, env) {
  if (!env || !env.AUTH_SESSIONS) {
    return { error: jsonResponse({ ok: false, error: 'service-unavailable' }, 503) };
  }
  const session = await getSessionFromRequest(request, env);
  if (!session) {
    return { error: jsonResponse({ ok: false, error: 'unauthenticated' }, 401) };
  }
  return { sub: session.payload.sub, email: session.email };
}

// POST /api/workbench/save
//   body: { kind, title, payload }
// Returns: { ok: true, id, createdAt } or { ok: false, error }
async function handleWorkbenchSave(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;

  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const validated = validateSaveBody(body);
  if (!validated.ok) {
    return jsonResponse({ ok: false, error: validated.error }, 400);
  }
  const result = await saveItem(env, auth.sub, validated.item);
  if (!result.ok) {
    if (result.error === 'limit-reached') {
      return jsonResponse({
        ok: false,
        error: 'limit-reached',
        max: result.max,
      }, 409);
    }
    return jsonResponse({ ok: false, error: result.error }, 500);
  }

  // Phase G.11 — stamp the user's subscriber record with last_save_at
  // so the lifecycle dispatcher can fire a welcome email at +5 min.
  // Best-effort: a missing subscriber row, KV failure, or absent
  // user.email is non-fatal — the save itself already succeeded.
  ctx.waitUntil((async () => {
    try {
      const userRaw = await env.AUTH_SESSIONS.get('user:' + auth.sub);
      if (!userRaw) return;
      let user; try { user = JSON.parse(userRaw); } catch (_) { return; }
      if (!user || typeof user.email !== 'string' || !user.email) return;
      const subKey = 'sub:' + (await sha256Hex(user.email.toLowerCase()));
      const subRaw = await env.AUTH_SESSIONS.get(subKey);
      if (!subRaw) return;
      let sub; try { sub = JSON.parse(subRaw); } catch (_) { return; }
      if (!sub || sub.status !== 'active') return;
      sub.last_save_at = Date.now();
      sub.last_save_kind = validated.item.kind || 'audit';
      await env.AUTH_SESSIONS.put(subKey, JSON.stringify(sub));
    } catch (err) {
      console.warn('[lifecycle] save-stamp failed', err && err.message);
    }
  })());

  return jsonResponse({ ok: true, id: result.id, createdAt: result.createdAt }, 200);
}

// GET /api/workbench/list
// Returns: { ok: true, items: [{ id, kind, title, createdAt }, ...] }
async function handleWorkbenchList(request, env, ctx) {
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const items = await listItemsForUser(env, auth.sub);
  return jsonResponse({ ok: true, items, max: MAX_SAVES_PER_USER }, 200);
}

// GET /api/workbench/get?id=...
// Returns: { ok: true, item: { id, kind, title, payload, createdAt } }
async function handleWorkbenchGet(request, env, ctx) {
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!isValidSaveItemIdShape(id)) {
    return jsonResponse({ ok: false, error: 'invalid-id' }, 400);
  }
  const item = await getItem(env, auth.sub, id);
  if (!item) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  return jsonResponse({ ok: true, item }, 200);
}

// GET /api/workbench/sheet-history?slug=<slug>
// Returns: { ok: true, slug, label, values: [number...], band }
//
// Phase B6 — Operator Sheets time-series memory. The standard
// /api/workbench/list endpoint omits payload by design (keeps the
// response small); sparkline trends need the per-save outputs, which
// requires reading individual rows. Bounded by MAX_SAVES_PER_USER
// (the existing per-user save cap) so this stays cheap.
//
// Slug → primary metric mapping with v-absent fallback (Phase B2).
const SHEET_PRIMARY_METRIC = {
  'weekly-prime-cost-worksheet': { key: 'prime_cost_pct',  label_en: 'Prime cost trend',         label_es: 'Tendencia de costo primo' },
  'recipe-cost-card':            { key: 'plate_cost',      label_en: 'Plate cost trend',         label_es: 'Tendencia de costo del plato' },
  'third-party-channel-pnl':     { key: 'contrib_pct',     label_en: 'Channel margin trend',     label_es: 'Tendencia de margen del canal' },
  'gbp-monthly-audit':           { key: 'score',           label_en: 'GBP audit score trend',    label_es: 'Tendencia del puntaje GBP' },
  'daily-sales-recap':           { key: 'avg_check',       label_en: 'Average check trend',      label_es: 'Tendencia del cheque promedio' },
  'monthly-pnl-snapshot':        { key: 'prime_pct',       label_en: 'Prime cost trend',         label_es: 'Tendencia de costo primo' },
  'waste-log':                   { key: 'total',           label_en: 'Weekly waste trend',       label_es: 'Tendencia de desperdicio semanal' },
  'reservation-no-show-log':     { key: 'ns_rate',         label_en: 'No-show rate trend',       label_es: 'Tendencia de tasa de no-shows' },
  'website-conversion-checklist':{ key: 'score',           label_en: 'Conversion score trend',   label_es: 'Tendencia del puntaje de conversión' },
  'review-response-log':         { key: 'response_rate',   label_en: 'Response rate trend',      label_es: 'Tendencia de tasa de respuesta' },
};

function _extractSheetMetric(item, metricKey) {
  // Versioned payload (v:1) — outputs is structured.
  if (item && item.payload && item.payload.v === 1 && item.payload.outputs) {
    const v = item.payload.outputs[metricKey];
    if (typeof v === 'number' && isFinite(v)) return v;
    // Some outputs ship as strings like "$45.50" or "62.3%" — try to
    // pull the numeric portion.
    if (typeof v === 'string') {
      const m = v.match(/-?\d+(?:\.\d+)?/);
      if (m) {
        const n = parseFloat(m[0]);
        if (isFinite(n)) return n;
      }
    }
  }
  // v-absent fallback — payload may have the metric at root, or as
  // a row in the legacy flat-rows shape. The earlier saves before
  // versioned payloads landed used the rows shape; we don't try to
  // scrape numeric values from those because the layout is per-sheet.
  if (item && item.payload && typeof item.payload[metricKey] === 'number') {
    return item.payload[metricKey];
  }
  return null;
}

async function handleWorkbenchSheetHistory(request, env, ctx) {
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') || '';
  if (!slug || !/^[a-z0-9-]{1,64}$/.test(slug)) {
    return jsonResponse({ ok: false, error: 'invalid-slug' }, 400);
  }
  const metricSpec = SHEET_PRIMARY_METRIC[slug];
  if (!metricSpec) {
    // No primary metric mapped — quietly empty so the client UI
    // hides the sparkline rather than 404'ing.
    return jsonResponse({ ok: true, slug, values: [], label: '' }, 200);
  }
  // List the user's saves (light list — id/kind/title/createdAt only).
  const list = await listItemsForUser(env, auth.sub);
  // Filter by kind === 'sheet' and (best-effort) slug from title or
  // payload.slug — we have to read each row to confirm slug. Bounded
  // to the user's MAX_SAVES_PER_USER cap.
  const sheetItems = list.filter((it) => it.kind === 'sheet');
  // Pull full payloads for at most the most recent 24 sheet saves.
  const sortedDesc = [...sheetItems].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 24);
  const matches = [];
  for (const it of sortedDesc) {
    const full = await getItem(env, auth.sub, it.id);
    if (!full) continue;
    if (!full.payload || full.payload.slug !== slug) continue;
    const v = _extractSheetMetric(full, metricSpec.key);
    if (v == null) continue;
    matches.push({ value: v, createdAt: full.createdAt });
  }
  // Re-sort ascending so the sparkline reads left-to-right by time.
  matches.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const values = matches.slice(-12).map((m) => m.value); // last 12
  const locale = (request.headers.get('accept-language') || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  const label = locale === 'es' ? metricSpec.label_es : metricSpec.label_en;
  // Last value's band, evaluated against the same metric on the server.
  // Keep simple — band is just the most recent value's diff vs prior.
  let band = 'idle';
  if (values.length >= 2) {
    const last = values[values.length - 1];
    const prior = values[values.length - 2];
    if (last > prior) band = 'good';   // for cost%-style metrics this may be wrong; tuned later
    else if (last < prior) band = 'warn';
  }
  return jsonResponse({ ok: true, slug, values, label, band, max: MAX_SAVES_PER_USER }, 200);
}

// POST /api/workbench/delete
//   body: { id }
// Returns: { ok: true, deleted: boolean }
async function handleWorkbenchDelete(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const result = await deleteItem(env, auth.sub, id);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.error }, 400);
  }
  return jsonResponse({ ok: true, deleted: result.deleted }, 200);
}


// ============================================================
// Phase 3 (Workshop) — /api/workbench/watch{-list,-delete}
// ============================================================
//
// Attaches a re-check schedule to an existing saved item. The
// underlying Cron Trigger that actually runs the re-checks is
// commented out in wrangler.jsonc until ops is ready (see the
// scheduled() export below — it ships as a no-op for now). So
// these endpoints persist intent and let the UI render a Watch
// list, but no upstream API quota burns until the cron flips on.

// POST /api/workbench/watch
//   body: { savedItemId, schedule }   schedule: 'daily' | 'weekly'
// Returns: { ok: true, watch: {...} }
async function handleWorkbenchWatchAttach(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const savedItemId = typeof body.savedItemId === 'string' ? body.savedItemId.trim() : '';
  const schedule    = typeof body.schedule    === 'string' ? body.schedule.trim()    : '';
  const result = await attachWatch(env, auth.sub, savedItemId, schedule);
  if (!result.ok) {
    if (result.error === 'limit-reached') {
      return jsonResponse({ ok: false, error: 'limit-reached', max: result.max }, 409);
    }
    if (result.error === 'save-not-found') {
      return jsonResponse({ ok: false, error: 'save-not-found' }, 404);
    }
    if (result.error === 'kind-not-watchable' || result.error === 'invalid-id' || result.error === 'invalid-schedule') {
      return jsonResponse({ ok: false, error: result.error }, 400);
    }
    return jsonResponse({ ok: false, error: result.error }, 500);
  }
  return jsonResponse({ ok: true, watch: result.watch }, 200);
}

// GET /api/workbench/watch-list
// Returns: { ok: true, items: [...], max }
async function handleWorkbenchWatchList(request, env, ctx) {
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const items = await listWatchesForUser(env, auth.sub);
  return jsonResponse({ ok: true, items, max: MAX_WATCHES_PER_USER }, 200);
}

// POST /api/workbench/watch-delete
//   body: { savedItemId }
// Returns: { ok: true, detached: boolean }
async function handleWorkbenchWatchDelete(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const savedItemId = typeof body.savedItemId === 'string' ? body.savedItemId.trim() : '';
  const result = await detachWatch(env, auth.sub, savedItemId);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.error }, 400);
  }
  return jsonResponse({ ok: true, detached: result.detached }, 200);
}


// ============================================================
// Phase C.2 (Storefront Health) — /api/workbench/property/*
// ============================================================
//
// Property endpoints. All gated on env.STOREFRONT_HEALTH_ENABLED:
// when 'true' the surface is live; otherwise every endpoint
// returns 404 (indistinguishable from a non-existent route, so
// the surface is invisible until C.5 flips the flag).

function _storefrontHealthGate(env) {
  return env && (env.STOREFRONT_HEALTH_ENABLED === 'true' || env.STOREFRONT_HEALTH_ENABLED === true);
}

async function handleWorkbenchPropertyCreate(request, env, ctx) {
  if (!_storefrontHealthGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const gate = assertSafeHttpUrl(url, pickLang(request));
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  const result = await createProperty(env, auth.sub, { url: gate.url.toString(), title });
  if (!result.ok) {
    if (result.error === 'limit-reached') {
      return jsonResponse({ ok: false, error: 'limit-reached', max: result.max }, 409);
    }
    return jsonResponse({ ok: false, error: result.error }, 400);
  }
  return jsonResponse({ ok: true, id: result.id, existing: !!result.existing }, 200);
}

async function handleWorkbenchPropertyList(request, env, ctx) {
  if (!_storefrontHealthGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const items = await listPropertiesForUser(env, auth.sub);
  return jsonResponse({ ok: true, items, max: MAX_PROPERTIES_PER_USER }, 200);
}

async function handleWorkbenchPropertyGet(request, env, ctx) {
  if (!_storefrontHealthGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const u = new URL(request.url);
  const id = u.searchParams.get('id') || '';
  if (!isValidSaveItemIdShape(id)) {
    return jsonResponse({ ok: false, error: 'invalid-id' }, 400);
  }
  const item = await getProperty(env, auth.sub, id);
  if (!item) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  return jsonResponse({ ok: true, item }, 200);
}

async function handleWorkbenchPropertyDelete(request, env, ctx) {
  if (!_storefrontHealthGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const result = await deleteProperty(env, auth.sub, id);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.error }, 400);
  }
  return jsonResponse({ ok: true, deleted: result.deleted }, 200);
}

async function handleWorkbenchPropertyAttach(request, env, ctx) {
  if (!_storefrontHealthGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const propertyId = typeof body.propertyId === 'string' ? body.propertyId.trim() : '';
  const kind = typeof body.kind === 'string' ? body.kind.trim() : '';
  const savedItemId = typeof body.savedItemId === 'string' ? body.savedItemId.trim() : '';
  const result = await attachCheckToProperty(env, auth.sub, propertyId, kind, savedItemId);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.error }, result.error === 'property-not-found' ? 404 : 400);
  }
  return jsonResponse({ ok: true }, 200);
}

async function handleWorkbenchPropertyDetach(request, env, ctx) {
  if (!_storefrontHealthGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const propertyId = typeof body.propertyId === 'string' ? body.propertyId.trim() : '';
  const kind = typeof body.kind === 'string' ? body.kind.trim() : '';
  const result = await detachCheckFromProperty(env, auth.sub, propertyId, kind);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.error }, result.error === 'property-not-found' ? 404 : 400);
  }
  return jsonResponse({ ok: true }, 200);
}

async function handleWorkbenchPropertyRollup(request, env, ctx) {
  if (!_storefrontHealthGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const u = new URL(request.url);
  const id = u.searchParams.get('id') || '';
  if (!isValidSaveItemIdShape(id)) {
    return jsonResponse({ ok: false, error: 'invalid-id' }, 400);
  }
  const result = await rollupProperty(env, auth.sub, id);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.error }, result.error === 'property-not-found' ? 404 : 500);
  }
  return jsonResponse({ ok: true, rollup: result.rollup }, 200);
}


// ============================================================
// Phase F.3 (Field Notes) — submission endpoints + admin gate
// ============================================================
//
// All routes are gated on env.FIELD_NOTES_ENABLED. When the flag is
// off (or unset), every endpoint returns 404 — indistinguishable
// from a typo'd path, so the surface stays invisible until F.6
// flips the flag.

function _fieldNotesGate(env) {
  return env && (env.FIELD_NOTES_ENABLED === 'true' || env.FIELD_NOTES_ENABLED === true);
}

async function _requireAdminSession(request, env) {
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth;
  const want = String(env.NOTIFY_EMAIL || '').toLowerCase();
  const have = String(auth.email || '').toLowerCase();
  if (!want || want !== have) {
    return { error: jsonResponse({ ok: false, error: 'forbidden' }, 403) };
  }
  return auth;
}

// ------------------------------------------------------------
// Course (Open the Doors bootcamp) — progress + config sync
// ------------------------------------------------------------
//
// All three handlers share the workbench session shape — env.AUTH_SESSIONS
// for storage, getSessionFromRequest for the cookie check, anonymous
// callers get 401. The client layer falls back to localStorage for
// anonymous-first parity; these endpoints only kick in when an
// operator signs in and wants cross-device sync.

async function _requireCourseSession(request, env) {
  if (!env || !env.AUTH_SESSIONS) {
    return { error: jsonResponse({ ok: false, error: 'service-unavailable' }, 503) };
  }
  const session = await getSessionFromRequest(request, env);
  if (!session) {
    return { error: jsonResponse({ ok: false, error: 'unauthenticated' }, 401) };
  }
  return { sub: session.payload.sub };
}

async function handleCourseProgress(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireCourseSession(request, env);
  if (auth.error) return auth.error;

  if (request.method === 'GET') {
    const progress = await readCourseProgress(env, auth.sub);
    return jsonResponse({ ok: true, progress });
  }

  // POST — merge semantics. The client sends a partial update;
  // completed[] entries are upserted by lesson with latest-timestamp
  // wins. Reset is a separate endpoint.
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }

  const result = await mergeCourseProgress(env, auth.sub, body);
  if (!result.ok) {
    const status = result.error === 'service-unavailable' ? 503
                 : result.error === 'invalid-body'        ? 400
                 : 500;
    return jsonResponse({ ok: false, error: result.error }, status);
  }
  return jsonResponse({ ok: true, progress: result.progress });
}

async function handleCourseConfig(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireCourseSession(request, env);
  if (auth.error) return auth.error;

  if (request.method === 'GET') {
    const config = await readCourseConfig(env, auth.sub);
    return jsonResponse({ ok: true, config });
  }

  // POST — full replace. The client always sends the complete
  // normalized snapshot; per-field merging happens client-side.
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }

  const result = await writeCourseConfig(env, auth.sub, body);
  if (!result.ok) {
    if (result.error === 'too-large') {
      return jsonResponse({
        ok: false,
        error: 'too-large',
        max: result.max,
        size: result.size
      }, 413);
    }
    const status = result.error === 'service-unavailable' ? 503
                 : result.error === 'invalid-body'        ? 400
                 : 500;
    return jsonResponse({ ok: false, error: result.error }, status);
  }
  return jsonResponse({ ok: true, config: result.config });
}

async function handleCourseReset(request, env, ctx) {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed — POST only' }, 405);
  }
  const auth = await _requireCourseSession(request, env);
  if (auth.error) return auth.error;

  const result = await resetCourseProgress(env, auth.sub);
  if (!result.ok) {
    const status = result.error === 'service-unavailable' ? 503 : 500;
    return jsonResponse({ ok: false, error: result.error }, status);
  }
  return jsonResponse({ ok: true });
}

const _ARTICLE_SLUGS_SET = new Set(ARTICLE_SLUGS);

async function handleSubmissionCreate(request, env, ctx) {
  if (!_fieldNotesGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;

  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }

  const validated = validateSubmissionBody(body, _ARTICLE_SLUGS_SET);
  if (!validated.ok) {
    const status = validated.error === 'unknown-article' ? 400
                 : validated.error === 'invalid-locale' ? 400
                 : validated.error === 'word-count-out-of-range' ? 400
                 : 400;
    return jsonResponse({ ok: false, ...validated }, status);
  }
  const item = validated.item;

  // Per-user lifetime cap (counts pending + approved together).
  const existing = await listSubmissionsForUser(env, auth.sub);
  const active = existing.filter((it) => it.status === 'pending' || it.status === 'approved');
  if (active.length >= MAX_SUBMISSIONS_PER_USER) {
    return jsonResponse({ ok: false, error: 'limit-reached', scope: 'user', max: MAX_SUBMISSIONS_PER_USER }, 409);
  }
  // Per-user, per-article cap.
  const perArticle = await countSubmissionsForArticle(env, auth.sub, item.articleSlug);
  if (perArticle >= MAX_SUBMISSIONS_PER_USER_PER_ARTICLE) {
    return jsonResponse({ ok: false, error: 'limit-reached', scope: 'article', max: MAX_SUBMISSIONS_PER_USER_PER_ARTICLE }, 409);
  }

  // Mint a unique id (3 attempts to dodge the rare collision).
  let id = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = mintSubmissionId();
    const probe = await env.AUTH_SESSIONS.get(submissionKey(auth.sub, candidate));
    if (!probe) { id = candidate; break; }
  }
  if (!id) return jsonResponse({ ok: false, error: 'mint-collision' }, 500);

  const ip = request.headers.get('cf-connecting-ip') || '';
  const ipHashHex = await submissionIpHash(ip, env.MAGIC_LINK_BASE_URL || 'muntin');

  const now = Date.now();
  const row = {
    id,
    kind: 'submission',
    status: 'pending',
    articleSlug: item.articleSlug,
    locale: item.locale,
    body: item.body,
    authorDisplayName: item.authorDisplayName,
    authorEmail: auth.email,
    ipHash: ipHashHex,
    createdAt: now,
  };
  await env.AUTH_SESSIONS.put(submissionKey(auth.sub, id), JSON.stringify(row));

  // Best-effort: notify Don. On failure, the submission still exists;
  // the admin queue will surface it on next visit.
  let emailDelivered = true;
  try {
    if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
      const articleTitle = item.articleSlug; // F.4 will look up the title from page metadata
      const adminBase = item.locale === 'es'
        ? 'https://muntin.digital/es/admin/submissions/'
        : 'https://muntin.digital/admin/submissions/';
      const tmpl = submissionNotificationEmail({
        locale: item.locale,
        author: item.authorDisplayName,
        authorEmail: auth.email,
        articleTitle,
        articleSlug: item.articleSlug,
        body: item.body,
        adminUrl: adminBase,
      });
      await sendEmail({
        from: env.FROM_EMAIL || 'Muntin Digital <hi@muntin.digital>',
        to: env.NOTIFY_EMAIL,
        subject: tmpl.subject,
        html: tmpl.html,
        text: tmpl.text,
      }, env.RESEND_API_KEY);
    }
  } catch (err) {
    emailDelivered = false;
    console.warn('[submission] notify email failed', { id, sub: auth.sub, err: err && err.message });
  }

  console.log(JSON.stringify({ event: 'submission.created', sub: auth.sub, submissionId: id, articleSlug: item.articleSlug, locale: item.locale, ts: now }));
  return jsonResponse({ ok: true, id, status: 'pending', emailDelivered }, 200);
}

async function handleSubmissionListMine(request, env, ctx) {
  if (!_fieldNotesGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const items = (await listSubmissionsForUser(env, auth.sub)).map((it) => ({
    id: it.id,
    articleSlug: it.articleSlug,
    locale: it.locale,
    status: it.status,
    createdAt: it.createdAt,
    decidedAt: it.decidedAt || null,
  }));
  return jsonResponse({ ok: true, items, max: MAX_SUBMISSIONS_PER_USER }, 200);
}

async function handleSubmissionWithdraw(request, env, ctx) {
  if (!_fieldNotesGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const row = await getSubmission(env, auth.sub, id);
  if (!row) return jsonResponse({ ok: false, error: 'not-found' }, 404);
  if (row.status !== 'pending') {
    return jsonResponse({ ok: false, error: 'already-decided', status: row.status }, 409);
  }
  row.status = 'withdrawn';
  row.decidedAt = Date.now();
  await env.AUTH_SESSIONS.put(submissionKey(auth.sub, id), JSON.stringify(row), { expirationTtl: REJECTED_TTL_SEC });
  console.log(JSON.stringify({ event: 'submission.withdrawn', sub: auth.sub, submissionId: id, ts: row.decidedAt }));
  return jsonResponse({ ok: true, status: 'withdrawn' }, 200);
}

async function handleAdminSubmissionsList(request, env, ctx) {
  if (!_fieldNotesGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  const items = [];
  for await (const { sub, submission } of iterateAllSubmissions(env)) {
    if (submission.status !== 'pending') continue;
    items.push({
      id: submission.id,
      sub,
      articleSlug: submission.articleSlug,
      locale: submission.locale,
      authorDisplayName: submission.authorDisplayName,
      authorEmail: submission.authorEmail,
      body: submission.body,
      createdAt: submission.createdAt,
    });
  }
  items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return jsonResponse({ ok: true, items, count: items.length }, 200);
}

async function handleAdminSubmissionsDecide(request, env, ctx) {
  if (!_fieldNotesGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const submissionId = typeof body.submissionId === 'string' ? body.submissionId.trim() : '';
  const sub          = typeof body.sub === 'string' ? body.sub.trim() : '';
  const decision     = body.decision === 'approve' ? 'approve' : (body.decision === 'reject' ? 'reject' : null);
  const reviewerNote = typeof body.reviewerNote === 'string' ? body.reviewerNote.trim().slice(0, 500) : '';
  const donsResponse = typeof body.donsResponse === 'string' ? body.donsResponse.trim().slice(0, 800) : '';
  if (!submissionId || !sub || !decision) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }

  // (a) idempotency: check decision: row first.
  const existing = await env.AUTH_SESSIONS.get(decisionKey(submissionId));
  if (existing) {
    let prev;
    try { prev = JSON.parse(existing); } catch (_) { prev = null; }
    if (prev && prev.decision === decision) {
      return jsonResponse({ ok: true, idempotent: true }, 200);
    }
    return jsonResponse({ ok: false, error: 'already-decided', priorDecision: prev && prev.decision }, 409);
  }

  const row = await getSubmission(env, sub, submissionId);
  if (!row) return jsonResponse({ ok: false, error: 'not-found' }, 404);
  if (row.status !== 'pending') {
    return jsonResponse({ ok: false, error: 'already-decided', status: row.status }, 409);
  }

  const now = Date.now();
  // (b) write decision: row (audit trail + idempotency key).
  const decisionPayload = {
    decision,
    reviewerNote,
    donsResponse: decision === 'approve' && donsResponse ? donsResponse : '',
    decidedAt: now,
    reviewerEmail: auth.email,
    submissionId,
    sub,
    articleSlug: row.articleSlug,
    locale: row.locale,
  };
  await env.AUTH_SESSIONS.put(decisionKey(submissionId), JSON.stringify(decisionPayload));

  // (c) update submission row.
  row.status = decision === 'approve' ? 'approved' : 'rejected';
  row.decidedAt = now;
  if (decision === 'approve' && donsResponse) row.donsResponse = donsResponse;
  if (decision === 'reject' && reviewerNote) row.reviewerNote = reviewerNote;
  const subPutOpts = decision === 'reject' ? { expirationTtl: REJECTED_TTL_SEC } : undefined;
  await env.AUTH_SESSIONS.put(submissionKey(sub, submissionId), JSON.stringify(row), subPutOpts);

  // (d) on approve: write the public projection.
  if (decision === 'approve') {
    const publicRow = {
      id: submissionId,
      articleSlug: row.articleSlug,
      locale: row.locale,
      author: row.authorDisplayName,
      body: row.body,
      donsResponse: donsResponse || '',
      approvedAt: now,
    };
    await env.AUTH_SESSIONS.put(approvedFieldnoteKey(row.articleSlug, submissionId), JSON.stringify(publicRow));

    // (e) email the contributor (best-effort).
    try {
      if (env.RESEND_API_KEY && row.authorEmail) {
        const articleUrl = (row.locale === 'es' ? 'https://muntin.digital/es/blog/' : 'https://muntin.digital/blog/') + row.articleSlug + '/';
        const tmpl = submissionApprovedEmail({
          locale: row.locale,
          articleTitle: row.articleSlug,
          articleUrl,
        });
        await sendEmail({
          from: env.FROM_EMAIL || 'Muntin Digital <hi@muntin.digital>',
          to: row.authorEmail,
          subject: tmpl.subject,
          html: tmpl.html,
          text: tmpl.text,
        }, env.RESEND_API_KEY);
      }
    } catch (err) {
      console.warn('[submission] approval email failed', { submissionId, err: err && err.message });
    }
  }

  console.log(JSON.stringify({ event: 'submission.' + (decision === 'approve' ? 'approved' : 'rejected'), sub, submissionId, articleSlug: row.articleSlug, locale: row.locale, ts: now }));
  return jsonResponse({ ok: true, decision, decidedAt: now }, 200);
}

async function handleAdminSubmissionsPublishData(request, env, ctx) {
  if (!_fieldNotesGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;

  // Build the canonical data/article-fieldnotes.json shape from KV.
  const fieldnotes = {};
  for await (const row of iterateAllApprovedFieldnotes(env)) {
    if (!row || !row.articleSlug || !row.locale) continue;
    if (!fieldnotes[row.articleSlug]) fieldnotes[row.articleSlug] = { en: [], es: [] };
    const arr = fieldnotes[row.articleSlug][row.locale];
    if (!arr) continue;
    const entry = {
      author: row.author,
      body: row.body,
      approvedAt: row.approvedAt,
    };
    if (row.donsResponse) entry.donsResponse = row.donsResponse;
    arr.push(entry);
  }
  // Sort each locale array by approvedAt asc (oldest first; latest at
  // the bottom of the rendered stack so a returning author sees their
  // newest note last).
  for (const slug of Object.keys(fieldnotes)) {
    for (const loc of ['en', 'es']) {
      fieldnotes[slug][loc].sort((a, b) => (a.approvedAt || 0) - (b.approvedAt || 0));
      if (!fieldnotes[slug][loc].length) delete fieldnotes[slug][loc];
    }
    if (!Object.keys(fieldnotes[slug]).length) delete fieldnotes[slug];
  }

  const payload = {
    _doc: 'AUTO-GENERATED via /api/admin/submissions/publish-data. Source of truth: approved-fieldnote: KV rows. Commit this file to git to publish a batch.',
    fieldnotes,
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="article-fieldnotes.json"',
    },
  });
}


// ============================================================
// Phase W.1 (The Window) — direct-line endpoints
// ============================================================
//
// All routes gated on env.WINDOW_ENABLED. Off (or unset) → 404
// silently, indistinguishable from a typo'd path. The visitor
// surface at /window/ shows pause copy; the admin surface at
// /admin/window/ shows "Direct line is paused."

function _windowGate(env) {
  return env && (env.WINDOW_ENABLED === 'true' || env.WINDOW_ENABLED === true);
}

// Phase 1a (Window redesign) — anonymous-first send.
// Sub-flag inside the master WINDOW_ENABLED gate. Default off so the
// path ships dark and Don can flip via `wrangler` vars when ready.
function _windowAnonGate(env) {
  return env && (env.WINDOW_ANON_ENABLED === 'true' || env.WINDOW_ANON_ENABLED === true);
}

// Phase 2.7 — Turnstile gate on anon POST. When this flag is on AND
// no anon cookie is yet present (i.e., first POST from this device),
// the request must carry a valid cf-turnstile-response token.
// Subsequent POSTs trust the cookie. Plan §2.6.
//
// Two-flag design (vs piggybacking on TURNSTILE_SECRET_KEY's
// presence): the secret is shared with /api/auth/magic-link and
// the newsletter form, so its mere presence shouldn't activate
// Window-side Turnstile until the /window/ composer has shipped
// the widget UI.
function _windowTurnstileAnonGate(env) {
  return env && (env.WINDOW_TURNSTILE_ANON_ENABLED === 'true' || env.WINDOW_TURNSTILE_ANON_ENABLED === true);
}

const WINDOW_ANON_COOKIE_NAME = 'md_anon_thread_id';
const WINDOW_ANON_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

// Read the anon-thread cookie from the request. Returns null if
// missing or shape-invalid (audit B4: malformed cookies must not
// reach KV — they'd amplify abuse and confuse the throttle).
function _readWindowAnonCookie(request) {
  const raw = request && request.headers ? request.headers.get('cookie') : null;
  if (!raw || typeof raw !== 'string') return null;
  const parts = raw.split(';');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name !== WINDOW_ANON_COOKIE_NAME) continue;
    const value = part.slice(eq + 1).trim();
    if (!value) return null;
    // Shape-validate so a malformed cookie is treated as no-cookie:
    // the next append re-mints a fresh anonId. Defends against
    // attacker-forged cookies creating bogus throttle rows or
    // 500-ing the createAnonThread path with `invalid-anon-id`.
    if (!isValidSaveItemIdShape(value)) return null;
    return value;
  }
  return null;
}

// Append a Set-Cookie header for the anon-thread cookie.
// HttpOnly + SameSite=Lax + Secure + Path=/ + 90-day Max-Age.
function _setWindowAnonCookie(headers, anonId) {
  const cookie =
    WINDOW_ANON_COOKIE_NAME + '=' + anonId +
    '; HttpOnly; Secure; SameSite=Lax; Path=/' +
    '; Max-Age=' + WINDOW_ANON_COOKIE_MAX_AGE;
  headers.append('Set-Cookie', cookie);
}

// Read the visitor's IP from Cloudflare's CF-Connecting-IP header.
// Returns null if absent. Used as input to hashIp() for per-IP
// throttle (we never store the raw IP).
function _readClientIp(request) {
  if (!request || !request.headers) return null;
  return request.headers.get('cf-connecting-ip') || null;
}

async function handleWindowStart(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  // Phase 1a: try identified path first; if no session and the anon
  // gate is on, return the anon thread (or null if none yet — first
  // append mints the cookie).
  const session = env && env.AUTH_SESSIONS ? await getSessionFromRequest(request, env) : null;
  if (session) {
    const sub = session.payload.sub;
    let thread = await getOpenThreadForUser(env, sub);
    if (!thread || (thread.msgCount || 0) >= 100) {
      try { thread = await createWindowThread(env, sub, session.email); }
      catch (_) { return jsonResponse({ ok: false, error: 'mint-collision' }, 500); }
    }
    return jsonResponse({ ok: true, threadId: thread.id, status: thread.status, msgCount: thread.msgCount }, 200);
  }
  if (_windowAnonGate(env)) {
    const anonId = _readWindowAnonCookie(request);
    if (anonId) {
      const thread = await getOpenThreadForAnon(env, anonId);
      if (thread) {
        return jsonResponse({ ok: true, threadId: thread.id, status: thread.status, msgCount: thread.msgCount, anon: true }, 200);
      }
    }
    // No cookie yet, or no thread for this cookie — let the visitor
    // start composing; the first append mints the cookie + thread.
    return jsonResponse({ ok: true, threadId: null, status: null, msgCount: 0, anon: true }, 200);
  }
  return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);
}

async function handleWindowAppend(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  // 503 first if the binding is missing (matches pre-commit ordering;
  // audit minor #8 — service-unavailable should out-rank
  // unauthenticated so monitoring distinguishes config errors from
  // expected anonymous reads).
  if (!env || !env.AUTH_SESSIONS) {
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  // Branch 1: identified send (existing behavior, unchanged).
  // Branch 2 (Phase 1a): anonymous send when no session AND anon gate on.
  const session = await getSessionFromRequest(request, env);
  const anonEnabled = _windowAnonGate(env);

  if (!session && !anonEnabled) {
    return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);
  }

  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const sanitized = sanitizeWindowBody(body && body.body);

  // Phase 3.2 — parse attach_ids (comma-separated, max 4). Each id
  // shape-validates and ownership is checked further down once we
  // know the sub/anonId. The textarea body is allowed to be empty
  // when at least one attachment is present (plan §3.6, thumb-only
  // path); otherwise the validateWindowMessageBody check below
  // catches the empty body.
  const attachIdsRaw = typeof body.attach_ids === 'string' ? body.attach_ids : '';
  const attachIds = attachIdsRaw.split(',').map(s => s.trim()).filter(Boolean).slice(0, MAX_ATTACHMENTS_PER_MSG);
  const hasAttachments = attachIds.length > 0;

  // Cross-site origin tag (plan §W). Allowlisted to a known set; used
  // only when this POST opens a NEW thread (the source is the property
  // the operator first arrived from and is sticky for the thread's life).
  const windowSource = normalizeWindowSource(body && body.source);

  // Allow empty body only when attachments are present.
  if (!hasAttachments) {
    const validated = validateWindowMessageBody({ body: sanitized });
    if (!validated.ok) {
      return jsonResponse({ ok: false, ...validated }, 400);
    }
  }

  // Phase 1b — PII pre-write gate. Refuses to store credit-card
  // numbers, SSNs, or password reveals. Polite redirect to email.
  // Applies to BOTH identified and anon paths (an authed user can
  // still accidentally type their own card number).
  const pii = detectLikelyPII(sanitized);
  if (pii) {
    return jsonResponse({
      ok: false,
      error: 'pii-blocked',
      kind: pii.kind,
    }, 422);
  }

  // Phase 1b — crisis keyword scan. Returns null / 'tier1' / 'tier2'.
  // The tier is tagged on the thread row and admin index entry so
  // Don's queue UI can render a red/yellow bar (UI lands in Phase 2).
  // SMS dispatch for tier1 is deferred to Phase 2 (Twilio onboarding).
  const crisisTier = detectCrisisTier(sanitized);

  if (session) {
    // ── Identified path (unchanged) ─────────────────────────────
    const sub = session.payload.sub;
    const email = session.email;

    const t = await checkAndStampWindowThrottle(env, sub);
    if (!t.ok) {
      return jsonResponse({ ok: false, ...t }, t.error === 'rate-limited' ? 429 : 409);
    }

    let thread = await getOpenThreadForUser(env, sub);
    let dayCapped = false;
    let isNewThread = false;
    if (!thread || (thread.msgCount || 0) >= 100) {
      try { thread = await createWindowThread(env, sub, email, windowSource); }
      catch (_) { return jsonResponse({ ok: false, error: 'mint-collision' }, 500); }
      isNewThread = true;
    }

    // Phase 1b — pre-stamp crisis tier on the thread so the
    // appendMessageToThread → upsertAdminIndex path persists both
    // the thread row and the index entry with the tier in one pass.
    // Audit Bug 1 fix: tier1 is sticky — once Don has been alerted
    // ("urgent surface"), a later tier2 keyword on the same thread
    // must not silently downgrade the flag.
    if (crisisTier && (crisisTier === 'tier1' || thread.crisisTier !== 'tier1')) {
      thread.crisisTier = crisisTier;
      thread.crisisFlaggedAt = Date.now();
    }

    const result = await appendMessageToThread(env, sub, thread, 'user', sanitized);
    if (!result.ok) {
      return jsonResponse({ ok: false, ...result }, result.error === 'thread-full' ? 409 : 500);
    }
    // §8.2 daily cap — bump AFTER a successful append so a failed send
    // doesn't over-count. The note is still filed; dayCapped only drives
    // the "filed for tomorrow" half-success copy past the 25/day bound.
    if (isNewThread) {
      const newCount = await _bumpWindowNewThreadCount(env);
      dayCapped = newCount > MAX_NEW_THREADS_PER_DAY;
    }
    // Phase 3.2 — link pending attachments to the new msg row.
    if (hasAttachments) {
      await _linkAttachmentsToMessage(env, attachIds, { sub, anonId: null, threadId: thread.id, msgId: result.msg.id });
    }

    if (crisisTier) {
      console.log(JSON.stringify({ event: 'window.crisis-flag', kind: 'identified', tier: crisisTier, sub, threadId: thread.id, msgId: result.msg.id }));
      // Phase 2.5 — Twilio SMS to Don for tier-1. Best-effort: a
      // fetch failure here doesn't fail the send. Rate-limited 3/hr.
      if (crisisTier === 'tier1') {
        ctx.waitUntil((async () => {
          try {
            const out = await sendCrisisSms(env, (sub || 'visitor').slice(0, 8), sanitized);
            if (!out.ok) {
              console.warn('[window] crisis-sms', { kind: 'identified', threadId: thread.id, msgId: result.msg.id, skipped: out.skipped || null, error: out.error || null });
            } else {
              console.log(JSON.stringify({ event: 'window.crisis-sms.sent', kind: 'identified', threadId: thread.id, msgId: result.msg.id, sid: out.sid }));
            }
          } catch (err) {
            console.warn('[window] crisis-sms threw', { err: err && err.message });
          }
        })());
      }
    }

    await pushPendingDon(env, sub, result.msg.id);

    const isFirstUserMessage = (result.thread.msgCount || 0) === 1;
    if (isFirstUserMessage) {
      try {
        if (env.RESEND_API_KEY && email) {
          const isEs = (request.headers.get('accept-language') || '').toLowerCase().includes('es');
          const tmpl = windowConfirmationEmail({
            locale: isEs ? 'es' : 'en',
            windowUrl: isEs ? 'https://muntin.digital/es/window/' : 'https://muntin.digital/window/',
          });
          await sendEmail({
            from: env.FROM_EMAIL || 'Muntin Digital <hi@muntin.digital>',
            to: email,
            subject: tmpl.subject,
            html: tmpl.html,
            text: tmpl.text,
          }, env.RESEND_API_KEY);
        }
      } catch (err) {
        console.warn('[window] confirmation email failed', { msgId: result.msg.id, err: err && err.message });
      }
    }

    console.log(JSON.stringify({ event: 'window.append', sub, threadId: thread.id, msgId: result.msg.id, ts: result.msg.createdAt, firstMsg: isFirstUserMessage }));
    return jsonResponse({ ok: true, threadId: thread.id, msgId: result.msg.id, createdAt: result.msg.createdAt, msgCount: result.thread.msgCount, dayCapped }, 200);
  }

  // ── Anonymous path (Phase 1a) ─────────────────────────────────

  // Phase 1b — Cloudflare threat-score gate. Anon path only;
  // identified users went through magic-link sign-in which already
  // checks threat score. Silent 503 keeps the abuse vector
  // signal-free (an attacker can't probe whether the gate fired
  // vs the rate limit fired vs the day cap fired).
  if (isHighThreatIP(request)) {
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  // Mint cookie on first send if not present; reuse on subsequent sends.
  let anonId = _readWindowAnonCookie(request);
  let mintedNewCookie = false;
  if (!anonId) {
    // Phase 2.7 — Turnstile gate on the cookie-minting path. Only
    // first POSTs from this device hit this; subsequent POSTs trust
    // the cookie. checkTurnstile returns { skipped:true } if
    // TURNSTILE_SECRET_KEY isn't bound; we treat skipped as a hard
    // no-go when the gate is on so a misconfigured deploy can't
    // bypass.
    if (_windowTurnstileAnonGate(env)) {
      const turnstile = await checkTurnstile(body, env, request);
      if (!turnstile.ok) {
        const reason = turnstile.skipped ? 'turnstile-not-configured' : ('turnstile-' + (turnstile.error || 'failed'));
        return jsonResponse({ ok: false, error: reason }, 403);
      }
    }
    anonId = mintAnonId();
    mintedNewCookie = true;
  }

  // Per-anonId throttle (5/day, 60s back-pressure).
  const aT = await checkAndStampAnonThrottle(env, anonId);
  if (!aT.ok) {
    return jsonResponse({ ok: false, ...aT }, aT.error === 'rate-limited' ? 429 : 409);
  }

  // Per-IP throttle (5/day) defeats cookie-cycling abuse. Best-effort
  // — if no IP header, skips silently.
  const clientIp = _readClientIp(request);
  const ipHash = clientIp ? await hashIp(clientIp) : null;
  if (ipHash) {
    const ipT = await checkAndStampIpThrottle(env, ipHash);
    if (!ipT.ok) {
      return jsonResponse({ ok: false, ...ipT }, 429);
    }
  }

  // Locale hint for the admin queue and future email templates.
  const acceptLanguage = (request.headers.get('accept-language') || '').toLowerCase();
  const locale = acceptLanguage.includes('es') ? 'es' : 'en';

  // Get or create the anon thread (one per cookie lifetime).
  let thread = await getOpenThreadForAnon(env, anonId);
  let isNewThread = false;
  if (!thread || (thread.msgCount || 0) >= 100) {
    try {
      thread = await createAnonThread(env, anonId, locale, windowSource);
      isNewThread = true;
    } catch (err) {
      if (err && err.message === 'anon-id-claimed') {
        // Audit S3 — stale cookie pointing at a row that's already
        // been migrated to sub-keyed storage. Clear the cookie + tell
        // the visitor to sign in (their thread now lives at
        // window:thread:<claimedBy>:<threadId>).
        const headers = new Headers({ 'content-type': 'application/json; charset=utf-8' });
        headers.append('Set-Cookie', WINDOW_ANON_COOKIE_NAME + '=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
        return new Response(JSON.stringify({ ok: false, error: 'thread-claimed-please-signin' }), { status: 409, headers });
      }
      return jsonResponse({ ok: false, error: 'mint-collision' }, 500);
    }
  }

  // Pre-stamp crisis tier on the anon thread so appendMessageToAnonThread
  // → upsertAdminIndex carries the flag in one pass (mirrors the
  // identified path). Audit Bug 1 fix: tier1 sticks; tier2 cannot
  // overwrite an existing tier1.
  if (crisisTier && (crisisTier === 'tier1' || thread.crisisTier !== 'tier1')) {
    thread.crisisTier = crisisTier;
    thread.crisisFlaggedAt = Date.now();
  }

  const result = await appendMessageToAnonThread(env, anonId, thread, 'user', sanitized);
  if (!result.ok) {
    return jsonResponse({ ok: false, ...result }, result.error === 'thread-full' ? 409 : 500);
  }
  // §8.2 daily cap — anon threads count toward the same site-wide 25/day
  // bound. Bump AFTER a successful append (no over-count on failure).
  let dayCapped = false;
  if (isNewThread) {
    const newCount = await _bumpWindowNewThreadCount(env);
    dayCapped = newCount > MAX_NEW_THREADS_PER_DAY;
  }
  // Phase 3.2 — link pending attachments to the new anon msg row.
  if (hasAttachments) {
    await _linkAttachmentsToMessage(env, attachIds, { sub: null, anonId, threadId: thread.id, msgId: result.msg.id });
  }

  if (crisisTier) {
    console.log(JSON.stringify({ event: 'window.crisis-flag', kind: 'anon', tier: crisisTier, anonId, threadId: thread.id, msgId: result.msg.id }));
    if (crisisTier === 'tier1') {
      ctx.waitUntil((async () => {
        try {
          const out = await sendCrisisSms(env, (anonId || 'visitor').slice(0, 8) + ' (anon)', sanitized);
          if (!out.ok) {
            console.warn('[window] crisis-sms', { kind: 'anon', threadId: thread.id, msgId: result.msg.id, skipped: out.skipped || null, error: out.error || null });
          } else {
            console.log(JSON.stringify({ event: 'window.crisis-sms.sent', kind: 'anon', threadId: thread.id, msgId: result.msg.id, sid: out.sid }));
          }
        } catch (err) {
          console.warn('[window] crisis-sms threw', { err: err && err.message });
        }
      })());
    }
  }

  // Anon threads notify Don via the pending-don batch tagged with
  // kind:'anon'. The cron flush dispatches on kind to use
  // getOpenThreadForAnon (anonId-keyed) instead of the sub-keyed path.
  // Audit B1.
  await pushPendingDon(env, anonId, result.msg.id, 'anon');

  console.log(JSON.stringify({ event: 'window.append.anon', anonId, threadId: thread.id, msgId: result.msg.id, ts: result.msg.createdAt, firstMsg: (result.thread.msgCount || 0) === 1, mintedCookie: mintedNewCookie }));

  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8' });
  if (mintedNewCookie) {
    _setWindowAnonCookie(headers, anonId);
  }
  const payload = { ok: true, threadId: thread.id, msgId: result.msg.id, createdAt: result.msg.createdAt, msgCount: result.thread.msgCount, anon: true, dayCapped };
  return new Response(JSON.stringify(payload), { status: 200, headers });
}

async function handleWindowThread(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  // Origin gate on read endpoints: anon cookies travel SameSite=Lax
  // on top-level navigations. A cross-origin top-level GET to
  // /api/window/thread would otherwise leak the visitor's anon
  // thread. Cheap defense; matches handleWindowAppend's gate.
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const session = env && env.AUTH_SESSIONS ? await getSessionFromRequest(request, env) : null;
  if (session) {
    const sub = session.payload.sub;
    const thread = await getOpenThreadForUser(env, sub);
    if (!thread) {
      return jsonResponse({ ok: true, thread: null, messages: [] }, 200);
    }
    const messages = await listThreadMessages(env, thread.id, 100);
    if (thread.unreadByUser) {
      thread.unreadByUser = false;
      await env.AUTH_SESSIONS.put(windowThreadKey(sub, thread.id), JSON.stringify(thread));
    }
    const attachmentsByMsgId = await _loadAttachmentsByMsgId(env, thread.id);
    return jsonResponse({ ok: true, thread, messages, attachmentsByMsgId }, 200);
  }
  if (_windowAnonGate(env)) {
    const anonId = _readWindowAnonCookie(request);
    if (!anonId) {
      return jsonResponse({ ok: true, thread: null, messages: [], anon: true }, 200);
    }
    const thread = await getOpenThreadForAnon(env, anonId);
    if (!thread) {
      return jsonResponse({ ok: true, thread: null, messages: [], anon: true }, 200);
    }
    const messages = await listThreadMessages(env, thread.id, 100);
    if (thread.unreadByUser) {
      thread.unreadByUser = false;
      await env.AUTH_SESSIONS.put(windowAnonThreadKey(anonId), JSON.stringify(thread));
    }
    const attachmentsByMsgId = await _loadAttachmentsByMsgId(env, thread.id);
    return jsonResponse({ ok: true, thread, messages, attachmentsByMsgId, anon: true }, 200);
  }
  return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);
}

// Phase 3.5 — group thread attachments by msgId for inline render.
// Strips R2 keys + lifetime details from the visitor-facing payload
// (only the visitor-relevant fields surface).
async function _loadAttachmentsByMsgId(env, threadId) {
  const attachments = await listAttachmentsForThread(env, threadId);
  const byMsg = {};
  for (const a of attachments) {
    if (!a.msgId) continue;  // skip pending uploads (not yet linked)
    if (!byMsg[a.msgId]) byMsg[a.msgId] = [];
    // Phase 3.6 audit (Section 4 MED): tombstoned rows surface a
    // minimal payload only — id + kind + the two deleted flags
    // the renderer needs. mime / sizeBytes / durationMs would
    // otherwise leak through (BIPA-relevant for voice). Single
    // branch covers both the visitor and admin endpoints since
    // they share this loader.
    if (a.deleted) {
      byMsg[a.msgId].push({
        id: a.id,
        kind: a.kind,
        deleted: true,
        transcriptDeleted: true,
      });
      continue;
    }
    byMsg[a.msgId].push({
      id: a.id,
      kind: a.kind,
      mime: a.mime,
      sizeBytes: a.sizeBytes,
      durationMs: a.durationMs || null,
      transcript: a.transcript || null,
      transcriptLanguage: a.transcriptLanguage || null,
      transcriptDeleted: !!a.transcriptDeleted,
      deleted: false,
      altText: a.altText || null,
      // The download URL is built client-side: /api/window/attach/<id>.
      // No R2 key, no IP hash, no lifetime row leaks into the response.
    });
  }
  return byMsg;
}

async function handleWindowPoll(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const session = env && env.AUTH_SESSIONS ? await getSessionFromRequest(request, env) : null;
  if (session) {
    const sub = session.payload.sub;
    const thread = await getOpenThreadForUser(env, sub);
    if (!thread) {
      return jsonResponse({ ok: true, hasThread: false }, 200);
    }
    return jsonResponse({
      ok: true,
      hasThread: true,
      threadId: thread.id,
      updatedAt: thread.updatedAt,
      msgCount: thread.msgCount,
      unreadByUser: !!thread.unreadByUser,
    }, 200);
  }
  if (_windowAnonGate(env)) {
    const anonId = _readWindowAnonCookie(request);
    if (!anonId) {
      return jsonResponse({ ok: true, hasThread: false, anon: true }, 200);
    }
    const thread = await getOpenThreadForAnon(env, anonId);
    if (!thread) {
      return jsonResponse({ ok: true, hasThread: false, anon: true }, 200);
    }
    return jsonResponse({
      ok: true,
      hasThread: true,
      threadId: thread.id,
      updatedAt: thread.updatedAt,
      msgCount: thread.msgCount,
      unreadByUser: !!thread.unreadByUser,
      anon: true,
    }, 200);
  }
  return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);
}

async function handleWindowActive(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  // Public; no auth required. The breathing-dot signal + the §8.1
  // auto-pause level so the composer can render the half-state copy.
  const meta = await getWindowActiveMeta(env);
  const autoPauseLevel = (meta && meta.autoPause && typeof meta.autoPause.level === 'number')
    ? meta.autoPause.level : 0;
  return new Response(JSON.stringify({
    ok: true,
    lastSeen: meta && meta.lastSeen ? meta.lastSeen : null,
    autoPauseLevel,
  }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
}

// Phase 2.7 — Turnstile-required signal for the composer. Returns
// { required: bool }. Because the anon cookie is HttpOnly (JS can't
// read it), the server is the only place that knows whether THIS
// visitor's next send is the cookie-minting first POST that the
// _windowTurnstileAnonGate challenges. Required iff: not signed in,
// anon gate on, turnstile gate on, AND no anon cookie yet. This is
// per-visitor state, so it MUST NOT be cached — `private, no-store`
// (unlike /api/window/active, which is a shared, cacheable signal).
async function handleWindowTurnstileState(request, env, ctx) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store',
  };
  if (!_windowGate(env)) {
    return new Response(JSON.stringify({ ok: false, error: 'not-found' }), { status: 404, headers });
  }
  let required = false;
  // Signed-in visitors are never challenged (identified path).
  const session = env && env.AUTH_SESSIONS ? await getSessionFromRequest(request, env) : null;
  if (!session && _windowAnonGate(env) && _windowTurnstileAnonGate(env)) {
    // Challenge only the first POST from a device — i.e. before the
    // anon cookie exists. A returning anon (cookie present) is trusted.
    required = !_readWindowAnonCookie(request);
  }
  return new Response(JSON.stringify({ ok: true, required }), { status: 200, headers });
}

// Phase 1a step 2 — operator attaches an email to their anon thread
// so Don's reply can include a claim-magic-link. Only mutates the
// anon thread row; identified threads already have email captured at
// session creation. Per-anon throttle handles abuse.
async function handleWindowEmail(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  if (!_windowAnonGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!env || !env.AUTH_SESSIONS) {
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }
  // Only meaningful on the anon path; identified visitors already
  // have email on their thread row from sign-in.
  const anonId = _readWindowAnonCookie(request);
  if (!anonId) {
    return jsonResponse({ ok: false, error: 'no-thread' }, 400);
  }
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !isValidEmail(email)) {
    return jsonResponse({ ok: false, error: 'invalid-email' }, 400);
  }
  // Audit S2 — back-pressure prevents churn-the-email-before-Don-replies abuse.
  const t = await checkAndStampEmailAttachThrottle(env, anonId);
  if (!t.ok) {
    return jsonResponse({ ok: false, ...t }, 429);
  }
  const thread = await setAnonThreadEmail(env, anonId, email);
  if (!thread) {
    return jsonResponse({ ok: false, error: 'no-thread' }, 404);
  }
  console.log(JSON.stringify({ event: 'window.email.attached', anonId, threadId: thread.id }));
  return jsonResponse({ ok: true, threadId: thread.id }, 200);
}

// Phase 2.6 — Resend bounce webhook. Resend posts JSON like:
//   {
//     "type": "email.bounced",
//     "data": {
//       "to": ["recipient@example.com"],
//       "bounce": { "type": "Permanent", "subType": "General" },
//       ...
//     }
//   }
// We record a window:bounce:<sha256(email)> row with 90d TTL so the
// admin reply path can skip outbound email + surface the bounce.
//
// Webhook auth: HMAC-SHA256 of the raw body keyed by RESEND_WEBHOOK_SECRET,
// compared to the `svix-signature` header. The header carries one or more
// space-separated `v1,<base64sig>` entries; any match passes. Resend
// rotates the signing secret via the dashboard.
async function handleResendBounceWebhook(request, env, ctx) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method-not-allowed' }, 405);
  }
  if (!env || !env.AUTH_SESSIONS) {
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // No secret configured → reject loudly so a misconfigured webhook
    // doesn't silently no-op.
    return jsonResponse({ ok: false, error: 'webhook-not-configured' }, 503);
  }
  // Read the raw body once (signature verify needs the bytes; JSON.parse
  // also needs them).
  let raw;
  try { raw = await request.text(); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  // Svix signature format: "v1,<base64>" — possibly multiple, space-separated.
  const sigHeader = request.headers.get('svix-signature') || '';
  const msgId = request.headers.get('svix-id') || '';
  const ts = request.headers.get('svix-timestamp') || '';
  if (!sigHeader || !msgId || !ts) {
    return jsonResponse({ ok: false, error: 'missing-signature' }, 401);
  }
  // Compute HMAC of `${id}.${timestamp}.${body}`.
  const enc = new TextEncoder();
  const toSign = msgId + '.' + ts + '.' + raw;
  let secretBytes;
  try {
    // Resend secrets are prefixed `whsec_`; the actual key is base64 after the prefix.
    const stripped = String(secret).replace(/^whsec_/, '');
    secretBytes = Uint8Array.from(atob(stripped), c => c.charCodeAt(0));
  } catch (_) {
    return jsonResponse({ ok: false, error: 'webhook-secret-bad' }, 503);
  }
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(toSign));
  const sigBytes = new Uint8Array(sigBuf);
  let computedB64 = '';
  // Build base64 manually (Workers btoa expects a string).
  let bin = '';
  for (let i = 0; i < sigBytes.length; i++) bin += String.fromCharCode(sigBytes[i]);
  computedB64 = btoa(bin);
  // The header may carry multiple sigs; check each. Constant-time
  // comparison via the simple equal-length string compare (timing
  // attack risk is low here — webhook caller is Resend, not a user).
  const sigs = sigHeader.split(' ');
  let matched = false;
  for (const entry of sigs) {
    const idx = entry.indexOf(',');
    if (idx === -1) continue;
    const v = entry.slice(0, idx);
    const sig = entry.slice(idx + 1);
    if (v === 'v1' && sig === computedB64) {
      matched = true;
      break;
    }
  }
  if (!matched) {
    return jsonResponse({ ok: false, error: 'signature-mismatch' }, 401);
  }
  // Parse + dispatch on event type.
  let payload;
  try { payload = JSON.parse(raw); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-json' }, 400);
  }
  const eventType = payload && payload.type;
  if (eventType !== 'email.bounced' && eventType !== 'email.complained') {
    // We only act on bounces + complaints; other events 200 silently.
    return jsonResponse({ ok: true, ignored: eventType || 'unknown' }, 200);
  }
  const data = (payload && payload.data) || {};
  const recipients = Array.isArray(data.to) ? data.to : [];
  const reason = (data.bounce && data.bounce.subType) || (eventType === 'email.complained' ? 'spam-complaint' : 'bounce');
  let recorded = 0;
  for (const r of recipients) {
    if (typeof r !== 'string') continue;
    const ok = await recordEmailBounce(env, r, reason);
    if (ok) recorded++;
  }
  console.log(JSON.stringify({ event: 'window.bounce.recorded', count: recorded, type: eventType, reason }));
  return jsonResponse({ ok: true, recorded }, 200);
}

// Phase 3.6 — kind-aware probe. GET /api/window/attach/probe?kind=<photo|voice>.
//
// Audit B1: window-photos.js and window-voice.js previously both
// POSTed to /api/window/attach with no body and treated any non-404
// as "my modality is enabled." That coupled the two modalities — a
// voice-only flag flip would still reveal the photo button (uploads
// then 403'd), and vice versa. This endpoint splits the detection
// so each client can ask only about its own modality.
async function handleWindowAttachProbe(request, env, ctx) {
  if (!_windowGate(env)) {
    return new Response(null, { status: 404 });
  }
  if (!isOriginAllowed(request)) {
    return new Response(null, { status: 403 });
  }
  const u = new URL(request.url);
  const kind = u.searchParams.get('kind') || '';
  let enabled = false;
  if (kind === 'photo') {
    enabled = env.WINDOW_PHOTO_ENABLED === 'true' || env.WINDOW_PHOTO_ENABLED === true;
  } else if (kind === 'voice') {
    enabled = env.WINDOW_VOICE_ENABLED === 'true' || env.WINDOW_VOICE_ENABLED === true;
  } else {
    return new Response(null, { status: 400 });
  }
  if (!enabled) return new Response(null, { status: 404 });
  return jsonResponse({ ok: true, kind }, 200);
}

// Phase 3.6 — visitor-deletable voice attachment.
// POST /api/window/attach/voice-delete (or legacy /transcript-delete).
//
// Body: { attachId }. Worker verifies the caller owns the attachment,
// then HARD-deletes the R2 audio + tombstones the KV row (audit
// fix: plan §2.9 promised R2 hard-delete, Phase 3.5 only soft-deleted
// transcript). Idempotent.
async function handleWindowAttachVoiceDelete(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  // Phase 3.6 audit (Section 4 MED): refuse the legacy
  // /transcript-delete alias. The Phase 3.5 client showed a confirm
  // dialog promising "the audio stays until the retention limit"
  // but Phase 3.6 hard-deletes it. The dialog lies. A cached
  // 24h-old client tab is the worst case; rather than silently
  // change semantics, return 410 + a refresh hint so the visitor
  // gets accurate consent on the next attempt.
  const u = new URL(request.url);
  if (u.pathname === '/api/window/attach/transcript-delete') {
    return jsonResponse({
      ok: false,
      error: 'endpoint-renamed',
      message: 'This endpoint has moved. Refresh the page and try again.',
    }, 410);
  }
  if (!env || !env.AUTH_SESSIONS) {
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const attachId = typeof body.attachId === 'string' ? body.attachId.trim() : '';
  if (!isValidSaveItemIdShape(attachId)) {
    return jsonResponse({ ok: false, error: 'invalid-attach-id' }, 400);
  }
  const row = await getAttachmentRow(env, attachId);
  if (!row) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (row.kind !== 'voice') {
    return jsonResponse({ ok: false, error: 'not-voice' }, 400);
  }

  // Ownership check.
  const session = await getSessionFromRequest(request, env);
  const callerSub = session ? session.payload.sub : null;
  const callerAnon = _readWindowAnonCookie(request);
  let allowed = false;
  if (callerSub && row.sub === callerSub) allowed = true;
  else if (callerAnon && row.anonId === callerAnon) allowed = true;
  if (!allowed) {
    return jsonResponse({ ok: false, error: 'not-yours' }, 403);
  }

  const result = await deleteVoiceAttachment(env, attachId);
  if (!result.ok) {
    return jsonResponse({ ok: false, ...result }, 500);
  }
  console.log(JSON.stringify({
    event: 'window.attach.voice-deleted',
    attachId,
    sub: callerSub ? callerSub.slice(0, 8) : null,
    anonId: callerAnon ? callerAnon.slice(0, 8) : null,
    alreadyDeleted: !!result.alreadyDeleted,
  }));
  return jsonResponse({ ok: true, alreadyDeleted: !!result.alreadyDeleted }, 200);
}

// Phase 3.4 — async voicenote callback shim. POST /api/window/callback.
//
// Operator submits {phone, slot, voiceAttachId?} after recording an
// optional voice memo. Worker:
//   1. Gates on WINDOW_CALLBACK_ENABLED + identity (sub or anonId
//      cookie). Anon path requires a thread already (cookie present).
//   2. Validates phone via E.164 normalization.
//   3. Validates slot key against the allowlist.
//   4. (Optional) verifies the voice attachId belongs to the caller.
//   5. Creates the callback KV row.
//   6. Posts a 'don' auto-confirmation message into the thread:
//      "Got it. I'll call you between [slot label]. If something
//      changes, just write back here."
//   7. Logs window.callback.requested for ops.
//
// Phase 3.4 is the SHIM — no Twilio call dispatched. Don sees
// requests in admin and replies asynchronously (with his own
// voicenote, or a regular text note). Phase 5+ adds live calls
// with Twilio masking for Care-Plan-only.
async function handleWindowCallback(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (env.WINDOW_CALLBACK_ENABLED !== 'true' && env.WINDOW_CALLBACK_ENABLED !== true) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  if (!env || !env.AUTH_SESSIONS) {
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }

  // Identity resolution — same shape as photo/voice upload. Anon
  // path requires the operator already has a thread (cookie present).
  const session = await getSessionFromRequest(request, env);
  let sub = null;
  let anonId = null;
  let thread = null;
  if (session) {
    sub = session.payload.sub;
    thread = await getOpenThreadForUser(env, sub);
  } else if (_windowAnonGate(env)) {
    anonId = _readWindowAnonCookie(request);
    if (!anonId) {
      return jsonResponse({ ok: false, error: 'send-first' }, 409);
    }
    thread = await getOpenThreadForAnon(env, anonId);
  } else {
    return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);
  }
  if (!thread) {
    return jsonResponse({ ok: false, error: 'no-thread' }, 409);
  }

  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }

  // Phone — normalize + validate via the lib helper.
  const phoneE164 = normalizePhone(body.phone);
  if (!phoneE164) {
    return jsonResponse({ ok: false, error: 'invalid-phone' }, 400);
  }

  // Slot — must be in the allowlist; getCallbackSlotLabel returns
  // null for unknown slots.
  const slotKey = typeof body.slot === 'string' ? body.slot.trim() : '';
  const locale = (body.locale === 'es' || thread.locale === 'es') ? 'es' : 'en';
  const slotLabel = getCallbackSlotLabel(slotKey, locale);
  if (!slotLabel) {
    return jsonResponse({ ok: false, error: 'invalid-slot' }, 400);
  }

  // Optional voice attachment ownership check.
  const voiceAttachId = typeof body.voiceAttachId === 'string' && body.voiceAttachId.trim()
    ? body.voiceAttachId.trim()
    : null;
  if (voiceAttachId) {
    if (!isValidSaveItemIdShape(voiceAttachId)) {
      return jsonResponse({ ok: false, error: 'invalid-attach-id' }, 400);
    }
    const attachRow = await getAttachmentRow(env, voiceAttachId);
    if (!attachRow || attachRow.kind !== 'voice') {
      return jsonResponse({ ok: false, error: 'attach-not-found' }, 404);
    }
    // Ownership: caller must match the attach row's owner.
    if (sub && attachRow.sub !== sub) return jsonResponse({ ok: false, error: 'attach-not-yours' }, 403);
    if (anonId && attachRow.anonId !== anonId) return jsonResponse({ ok: false, error: 'attach-not-yours' }, 403);
  }

  // Audit B2 — order: create the callback row FIRST (with
  // msgId:null), then append the auto-confirmation, then
  // best-effort update the row's msgId. Pre-fix order
  // (append → create) produced an orphan thread message when
  // KV PUT failed — the visitor saw "Got it. I'll call you"
  // but Don never saw the request in admin.
  let callbackRow;
  try {
    callbackRow = await createCallbackRequest(env, {
      threadId: thread.id,
      msgId: null,
      sub,
      anonId,
      phoneE164,
      slotKey,
      voiceAttachId,
      locale,
    });
  } catch (err) {
    console.warn('[window] callback row create failed', { threadId: thread.id, err: err && err.message });
    return jsonResponse({ ok: false, error: 'storage-failed' }, 500);
  }

  const masked = maskPhone(phoneE164);
  const confirmation = locale === 'es'
    ? 'Listo. Te llamo al ' + masked + ' ' + slotLabel + '. Si algo cambia, escríbeme aquí.'
    : "Got it. I'll call " + masked + ' ' + slotLabel + '. If something changes, just write back here.';

  // Audit E1 — dispatch on identity (sub vs anonId) rather than
  // thread.kind. Identified threads have no `kind` field, but a
  // claim-flow edge could leave kind:'anon' on a sub-keyed thread;
  // the prior dispatch would have crashed routing to anon-append
  // with anonId=null. Sub-vs-anonId is the canonical identity check.
  const appendResult = sub
    ? await appendMessageToThread(env, sub, thread, 'don', confirmation)
    : await appendMessageToAnonThread(env, anonId, thread, 'don', confirmation);
  if (!appendResult.ok) {
    // Roll back the callback row so admin doesn't see a request
    // without a thread message backing it. Best-effort.
    try { await env.AUTH_SESSIONS.delete('window:callback:' + thread.id + ':' + callbackRow.id); } catch (_) {}
    return jsonResponse({ ok: false, ...appendResult }, 500);
  }

  // Update the callback row's msgId so admin display can backref.
  // Best-effort: a KV failure here doesn't fail the user-visible
  // success (the auto-confirmation is already in the thread; the
  // admin queue still has the callback row, just without the
  // message backref).
  try {
    callbackRow.msgId = appendResult.msg.id;
    await env.AUTH_SESSIONS.put(
      'window:callback:' + thread.id + ':' + callbackRow.id,
      JSON.stringify(callbackRow),
      { expirationTtl: 30 * 24 * 60 * 60 }
    );
  } catch (err) {
    console.warn('[window] callback msgId backref update failed', { threadId: thread.id, callbackId: callbackRow.id, err: err && err.message });
  }

  console.log(JSON.stringify({
    event: 'window.callback.requested',
    callbackId: callbackRow.id,
    threadId: thread.id,
    msgId: appendResult.msg.id,
    slotKey,
    sub: sub ? sub.slice(0, 8) : null,
    anonId: anonId ? anonId.slice(0, 8) : null,
    // Don't log the full E.164 — last-4 only.
    phoneLast4: phoneE164.slice(-4),
    voiceAttachId: voiceAttachId || null,
  }));

  return jsonResponse({
    ok: true,
    callbackId: callbackRow.id,
    threadId: thread.id,
    msgId: appendResult.msg.id,
    slotLabel,
  }, 200);
}

// Phase 3.2 — photo upload. POST /api/window/attach (multipart).
//
// Visitor (anon or identified) uploads a single photo file in the
// `file` field of a multipart/form-data body. Worker:
//   1. Gates on WINDOW_PHOTO_ENABLED + WINDOW_ENABLED + origin +
//      session-or-anon presence.
//   2. Validates the size + MIME (jpeg/webp/png only).
//   3. Server-side EXIF strip (defense-in-depth: client also strips).
//   4. Lifetime cap check via checkAttachmentLifetime.
//   5. Mints an attachId + a placeholder threadId/msgId binding
//      (the operator hasn't sent the message yet — we'll associate
//      via attachIds on the subsequent /api/window/append POST).
//   6. PUTs the stripped bytes to R2.
//   7. Writes the KV metadata row.
//   8. Returns { ok, attachId, mime, sizeBytes } so the client can
//      pass the attachId in the form body of the actual send.
//
// Per-message validation (the attachId belongs to the same anon/sub
// that's now sending) lives in handleWindowAppend.
//
// Per audit S3 + plan §2.3: per-anon lifetime cap (12) + per-day
// bytes cap (8 MB) enforced here so abusers can't mint orphan
// attachments forever.
// Phase 3.2 — link pending attachments to a freshly-appended msg.
// Best-effort: a single failed link doesn't fail the message send
// (the message is already persisted; the visitor sees their note,
// just minus the failing attachment). Each link verifies that the
// pending row's sub/anonId matches the caller's identity to defend
// against attachment-id-stuffing attacks.
async function _linkAttachmentsToMessage(env, attachIds, identity) {
  const linked = [];
  for (const attachId of attachIds) {
    if (!isValidSaveItemIdShape(attachId)) continue;
    let row;
    try {
      const raw = await env.AUTH_SESSIONS.get(windowAttachKey(attachId));
      if (!raw) continue;
      row = JSON.parse(raw);
    } catch (_) { continue; }
    if (!row.pending) continue;
    // Ownership check.
    if (identity.sub && row.sub !== identity.sub) continue;
    if (identity.anonId && row.anonId !== identity.anonId) continue;
    if (!identity.sub && !identity.anonId) continue;
    row.threadId = identity.threadId;
    row.msgId = identity.msgId;
    row.pending = false;
    row.linkedAt = Date.now();
    try {
      // Drop the 1h pending TTL — linked rows persist for the
      // R2 lifecycle window (30d voice / 90d photo).
      await env.AUTH_SESSIONS.put(windowAttachKey(attachId), JSON.stringify(row));
      linked.push(attachId);
    } catch (err) {
      console.warn('[window] attach link failed', { attachId, err: err && err.message });
    }
  }
  if (linked.length) {
    console.log(JSON.stringify({
      event: 'window.attach.linked',
      count: linked.length,
      threadId: identity.threadId,
      msgId: identity.msgId,
    }));
  }
}

async function handleWindowAttachUpload(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  // Phase 3.2 + 3.3 — gate is per-modality. Photo flag OR voice flag
  // unlocks the endpoint; the multipart `kind` field (or MIME sniff)
  // disambiguates further down.
  const photoOn = env.WINDOW_PHOTO_ENABLED === 'true' || env.WINDOW_PHOTO_ENABLED === true;
  const voiceOn = env.WINDOW_VOICE_ENABLED === 'true' || env.WINDOW_VOICE_ENABLED === true;
  if (!photoOn && !voiceOn) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  if (!env || !env.AUTH_SESSIONS) {
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  }
  if (!env.WINDOW_ATTACHMENTS) {
    return jsonResponse({ ok: false, error: 'attachments-not-configured' }, 503);
  }

  // Identity: sub OR anonId, never both. (Identified path takes
  // precedence; anon path requires _windowAnonGate.)
  const session = await getSessionFromRequest(request, env);
  let identitySuffix = null;  // for lifetime cap
  let sub = null;
  let anonId = null;
  if (session) {
    sub = session.payload.sub;
    identitySuffix = sub;
  } else if (_windowAnonGate(env)) {
    anonId = _readWindowAnonCookie(request);
    if (!anonId) {
      // No anon cookie yet — visitor must send the first message
      // through /api/window/append (which mints the cookie) before
      // they can upload attachments. Defends against attackers who
      // skip the throttle by uploading directly.
      return jsonResponse({ ok: false, error: 'send-first' }, 409);
    }
    identitySuffix = anonId;
  } else {
    return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);
  }

  // Multipart parse — Workers' Request.formData() handles this.
  let form;
  try { form = await request.formData(); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-multipart' }, 400);
  }
  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return jsonResponse({ ok: false, error: 'no-file' }, 400);
  }
  const declaredMime = String(file.type || '').toLowerCase();
  const photoMimes = new Set(['image/jpeg', 'image/jpg', 'image/webp', 'image/png']);
  const voiceMimes = new Set(['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/mpeg', 'audio/ogg']);
  // Strip codec suffix for the lookup (Safari sends 'audio/mp4' but
  // Chrome can send 'audio/webm;codecs=opus').
  const baseMime = declaredMime.split(';')[0].trim();
  let kind = null;
  if (photoMimes.has(declaredMime) || photoMimes.has(baseMime)) kind = 'photo';
  else if (voiceMimes.has(declaredMime) || voiceMimes.has(baseMime)) kind = 'voice';
  else {
    return jsonResponse({ ok: false, error: 'unsupported-mime', mime: declaredMime }, 415);
  }
  if (kind === 'photo' && !photoOn) {
    return jsonResponse({ ok: false, error: 'photo-not-enabled' }, 403);
  }
  if (kind === 'voice' && !voiceOn) {
    return jsonResponse({ ok: false, error: 'voice-not-enabled' }, 403);
  }

  const buf = await file.arrayBuffer();
  if (buf.byteLength < 16) {
    return jsonResponse({ ok: false, error: 'file-too-small' }, 400);
  }

  let storedBytes;
  let storedMime;
  let storedExt;
  let durationMs = null;

  if (kind === 'photo') {
    if (buf.byteLength > MAX_PHOTO_SIZE_BYTES) {
      return jsonResponse({ ok: false, error: 'photo-too-large', max: MAX_PHOTO_SIZE_BYTES }, 413);
    }
    // Lifetime + per-day-bytes cap.
    const lifetimeCheck = await checkAttachmentLifetime(env, identitySuffix, buf.byteLength);
    if (!lifetimeCheck.ok) {
      return jsonResponse({ ok: false, ...lifetimeCheck }, 429);
    }
    // Server-side EXIF strip (defense-in-depth — client canvas
    // re-encode already strips, but a curl uploader bypasses JS).
    const stripped = stripImageExif(new Uint8Array(buf), declaredMime);
    if (!stripped.ok) {
      return jsonResponse({ ok: false, ...stripped }, 400);
    }
    storedBytes = stripped.bytes;
    storedMime = stripped.mime;
    storedExt = stripped.kind === 'jpeg' ? 'jpg' : stripped.kind;
  } else {
    // Voice. Per-day cap (voice-daily key tracks count + minutes).
    // Duration is supplied by the client in the form (durationMs).
    // Audit S-1 — client-side duration is spoofable: a malicious
    // client could send durationMs=1 for a 60s recording to evade
    // the daily-minutes cap. Defense: derive an estimate from the
    // byte size assuming Opus@64kbps (the typical MediaRecorder
    // default in Chrome/Firefox); cap the trusted duration at
    // 1.5× that estimate. The 2 MB hard cap below already bounds
    // the worst case at ~256s, so this just tightens the inner cap.
    const declaredDuration = Number(form.get('durationMs') || 0);
    if (!Number.isFinite(declaredDuration) || declaredDuration <= 0) {
      return jsonResponse({ ok: false, error: 'duration-required' }, 400);
    }
    // Opus @ 64 kbps = 8000 bytes/s. Multiply by 1.5 to allow for
    // bitrate variance (codecs can spike higher on speech).
    const estimatedMs = Math.round((buf.byteLength / 8000) * 1000);
    const estimatedMaxMs = Math.round(estimatedMs * 1.5);
    durationMs = Math.min(
      declaredDuration,
      MAX_VOICE_DURATION_HARD_MS,
      Math.max(estimatedMaxMs, 1000) // never go below 1s, in case the size estimate underflows on tiny clips
    );
    // Voice file size cap: 10s of headroom over Opus@64kbps × 90s ≈
    // 720KB. Cap at 2MB to be generous to lossier codecs.
    const VOICE_BYTES_HARD_CAP = 2 * 1024 * 1024;
    if (buf.byteLength > VOICE_BYTES_HARD_CAP) {
      return jsonResponse({ ok: false, error: 'voice-too-large', max: VOICE_BYTES_HARD_CAP }, 413);
    }
    // Voice-daily cap (count + minutes).
    const dailyCheck = await checkVoiceDailyCap(env, identitySuffix, durationMs);
    if (!dailyCheck.ok) {
      return jsonResponse({ ok: false, ...dailyCheck }, 429);
    }
    // Lifetime + per-day-bytes cap (shared with photos).
    const lifetimeCheck = await checkAttachmentLifetime(env, identitySuffix, buf.byteLength);
    if (!lifetimeCheck.ok) {
      return jsonResponse({ ok: false, ...lifetimeCheck }, 429);
    }
    // No EXIF-equivalent stripping for voice — Opus/AAC don't carry
    // location metadata. Pass the bytes through.
    storedBytes = new Uint8Array(buf);
    storedMime = baseMime;
    storedExt = baseMime === 'audio/mp4' ? 'm4a' :
                baseMime === 'audio/mpeg' ? 'mp3' :
                baseMime === 'audio/ogg' ? 'ogg' : 'webm';
  }

  // R2 key uses the identity prefix from the start (audit B2 fix).
  const attachId = mintAttachId();
  const identityPrefix = identitySuffix.slice(0, 10);
  const r2KeyStr = 'attach/' + identityPrefix + '/' + attachId + '.' + storedExt;

  try {
    await env.WINDOW_ATTACHMENTS.put(r2KeyStr, storedBytes, {
      httpMetadata: {
        contentType: storedMime,
        cacheControl: 'private, max-age=0, must-revalidate',
      },
      customMetadata: {
        attachId,
        identitySuffix,
        kind,
      },
    });
  } catch (err) {
    console.warn('[window] r2 put failed', { attachId, kind, err: err && err.message });
    return jsonResponse({ ok: false, error: 'storage-failed' }, 500);
  }

  // Pending KV row.
  const pendingRow = {
    id: attachId,
    pending: true,
    threadId: null,
    msgId: null,
    sub: sub || null,
    anonId: anonId || null,
    kind,
    mime: storedMime,
    sizeBytes: storedBytes.length,
    r2Key: r2KeyStr,
    createdAt: Date.now(),
  };
  if (durationMs) pendingRow.durationMs = durationMs;
  await env.AUTH_SESSIONS.put(windowAttachKey(attachId), JSON.stringify(pendingRow), {
    expirationTtl: 3600,
  });
  await stampAttachmentLifetime(env, identitySuffix, storedBytes.length);

  // Voice path: enqueue for transcription + try inline (fire-and-
  // forget via ctx.waitUntil — don't block the upload response).
  if (kind === 'voice') {
    await stampVoiceDaily(env, identitySuffix, durationMs);
    await markForTranscript(env, attachId);
    ctx.waitUntil((async () => {
      try {
        const result = await transcribeVoice(env, storedBytes);
        if (result.ok) {
          await setAttachmentTranscript(env, attachId, result.text, result.language);
          await unmarkTranscript(env, attachId);
          // Audit B-2 — re-run crisis detection on the transcript.
          // The body-text crisis check (handleWindowAppend) doesn't
          // see voice content; without this, a tier-1 keyword
          // SPOKEN into a voice memo would silently bypass the
          // SMS-to-Don path (plan §11.6 promises Don-facing
          // SMS work).
          const transcriptTier = detectCrisisTier(result.text);
          if (transcriptTier === 'tier1') {
            console.log(JSON.stringify({ event: 'window.crisis-flag', kind: 'voice-transcript', tier: 'tier1', attachId }));
            try {
              const senderLabel = (sub || anonId || 'visitor').slice(0, 8) + ' (voice)';
              const out = await sendCrisisSms(env, senderLabel, '[voice transcript] ' + result.text);
              if (!out.ok) {
                console.warn('[window] voice-crisis-sms', { attachId, skipped: out.skipped || null, error: out.error || null });
              } else {
                console.log(JSON.stringify({ event: 'window.crisis-sms.sent', kind: 'voice-transcript', attachId, sid: out.sid }));
              }
            } catch (err) {
              console.warn('[window] voice-crisis-sms threw', { attachId, err: err && err.message });
            }
          }
          console.log(JSON.stringify({ event: 'window.transcribe.inline', attachId, language: result.language || null, len: result.text.length }));
        } else {
          // Leave it on the queue — cron will retry.
          console.warn('[window] inline transcribe deferred to cron', { attachId, error: result.error });
        }
      } catch (err) {
        console.warn('[window] transcribe threw', { attachId, err: err && err.message });
      }
    })());
  }

  console.log(JSON.stringify({
    event: 'window.attach.upload',
    attachId,
    kind,
    mime: storedMime,
    sizeBytes: storedBytes.length,
    durationMs: durationMs || null,
    sub: sub ? sub.slice(0, 8) : null,
    anonId: anonId ? anonId.slice(0, 8) : null,
  }));
  return jsonResponse({
    ok: true,
    attachId,
    kind,
    mime: storedMime,
    sizeBytes: storedBytes.length,
    durationMs: durationMs || null,
  }, 200);
}

// Phase 3.2 — proxied attachment download.
//   GET /api/window/attach/<attachId>
// Returns the file bytes streamed from R2. Auth: requester must
// match the attachment's owner (sub or anonId). Admin bypass: a
// signed-in admin can fetch any attachment (for the admin reply
// surface in Phase 3.5).
async function handleWindowAttachDownload(request, env, ctx) {
  if (!_windowGate(env)) {
    return new Response(null, { status: 404 });
  }
  if (env.WINDOW_PHOTO_ENABLED !== 'true' && env.WINDOW_PHOTO_ENABLED !== true &&
      env.WINDOW_VOICE_ENABLED !== 'true' && env.WINDOW_VOICE_ENABLED !== true) {
    return new Response(null, { status: 404 });
  }
  if (!env.WINDOW_ATTACHMENTS) {
    return new Response(null, { status: 503 });
  }
  if (!isOriginAllowed(request)) {
    return new Response(null, { status: 403 });
  }

  const u = new URL(request.url);
  const prefix = '/api/window/attach/';
  if (!u.pathname.startsWith(prefix)) {
    return new Response(null, { status: 404 });
  }
  const attachId = u.pathname.slice(prefix.length);
  if (!attachId || !isValidSaveItemIdShape(attachId)) {
    return new Response(null, { status: 400 });
  }

  const row = await getAttachmentRow(env, attachId);
  if (!row || row.deleted) {
    return new Response(null, { status: 404 });
  }

  // Ownership check: caller is the original uploader OR a signed-in
  // admin. Phase 3.5 admin display uses the admin path.
  const session = await getSessionFromRequest(request, env);
  const callerSub = session ? session.payload.sub : null;
  const callerAnon = _readWindowAnonCookie(request);
  let allowed = false;
  if (callerSub && row.sub === callerSub) allowed = true;
  else if (callerAnon && row.anonId === callerAnon) allowed = true;
  else if (callerSub && env.ADMIN_SUB_HASH && callerSub === env.ADMIN_SUB_HASH) allowed = true;
  if (!allowed) {
    return new Response(null, { status: 403 });
  }

  let obj;
  try {
    obj = await env.WINDOW_ATTACHMENTS.get(row.r2Key);
  } catch (err) {
    console.warn('[window] r2 get failed', { attachId, err: err && err.message });
    return new Response(null, { status: 500 });
  }
  if (!obj) return new Response(null, { status: 404 });

  return new Response(obj.body, {
    status: 200,
    headers: {
      'content-type': row.mime || 'application/octet-stream',
      // Worker-proxied (not R2-public); short-cache. Plan §2.7.
      'cache-control': 'private, max-age=0, must-revalidate',
      'x-content-type-options': 'nosniff',
    },
  });
}

// Phase 4 — /now/ operator presence widget. Public read endpoint.
// GET returns the privacy-resolved view: text + mode + lastSeen,
// or { show: false } when widget should be hidden (private mode,
// staleness >14d, missing row, or post-blackout-downgrade with
// empty fuzzText). Cached 60s at the edge — the value changes
// on weekly cadence, so this matches the 60s pulse cache.
async function handleWindowNow(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (env.WINDOW_NOW_ENABLED !== 'true' && env.WINDOW_NOW_ENABLED !== true) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const now = await getWindowNowMeta(env);
  const u = new URL(request.url);
  const locale = u.searchParams.get('locale') === 'es' ? 'es' : 'en';
  const view = resolveNowForVisitor(now, locale);
  if (!view) {
    return jsonResponse({ ok: true, show: false }, 200);
  }
  return jsonResponse({
    ok: true,
    show: true,
    text: view.text,
    mode: view.mode,
    shift: view.shift,
    lastSeen: view.lastSeen,
  }, 200);
}

// Phase 4 audit (Issue 3.1 HIGH) — tag-stripping validator for the
// /now/ text fields. The visitor surface renders these via
// textContent, so we do NOT entity-escape (sanitizeWindowBody does,
// which would surface `Rosa&#39;s place` literally). Strip <tags>,
// drop control chars, slice, trim. textContent prevents
// script-injection at read time regardless of what's stored.
function _sanitizeNowText(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, '')
    .slice(0, 200)
    .trim();
}

// Phase 4 — admin endpoint for the /now/ widget. GET returns the
// raw row (privacy text in BOTH modes — admin can see what's
// queued for precise vs fuzz). POST writes a new row.
//
// Body shape (POST, form-encoded):
//   privacy=precise|fuzz|private
//   fuzzText="in DC tonight"
//   preciseText="at Tacombi until close"
//   shift=around|between-shifts|away  (optional)
//   timezone=America/New_York         (optional, defaults to NY)
//
// Plan §4.4 server-side rules:
//   - 'precise' is downgraded to 'fuzz' between 21:00-06:00 local
//     at READ time (not at write — admin can queue precise text;
//     the resolver downgrades on the fly).
//   - 14-day staleness hides the row at READ time.
async function handleAdminWindowNow(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  if (request.method === 'GET') {
    const now = await getWindowNowMeta(env);
    return jsonResponse({ ok: true, now: now || null }, 200);
  }
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method-not-allowed' }, 405);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const privacy = typeof body.privacy === 'string' ? body.privacy : 'fuzz';
  if (['precise', 'fuzz', 'private'].indexOf(privacy) === -1) {
    return jsonResponse({ ok: false, error: 'invalid-privacy' }, 400);
  }
  // Phase 4 audit (Issue 2.1 LOW): validate the shift field against
  // the documented enum. Admin <select> already constrains it, but a
  // raw POST could store arbitrary 40-char strings that future surfaces
  // might trust.
  const shift = typeof body.shift === 'string' ? body.shift : '';
  if (['', 'around', 'between-shifts', 'away'].indexOf(shift) === -1) {
    return jsonResponse({ ok: false, error: 'invalid-shift' }, 400);
  }
  // Phase 4 audit (Issue 3.1 HIGH): the now text fields render via
  // textContent on the visitor surface, so sanitizeWindowBody (which
  // ENTITY-ESCAPES at write time) would produce literal `&#39;` etc.
  // in the DOM the first time Don types a possessive or quote. Use a
  // local tag-stripping validator that does NOT escape — textContent
  // makes script-injection impossible at read time, so the stored
  // value can stay human-readable.
  const fuzzText      = _sanitizeNowText(body.fuzzText || '');
  const fuzzTextEs    = _sanitizeNowText(body.fuzzTextEs || '');
  const preciseText   = _sanitizeNowText(body.preciseText || '');
  const preciseTextEs = _sanitizeNowText(body.preciseTextEs || '');
  if (privacy !== 'private' && !fuzzText) {
    return jsonResponse({ ok: false, error: 'fuzz-required' }, 400);
  }
  // Phase 4 audit (Issue 1.2 LOW): require non-empty preciseText when
  // privacy is 'precise' — otherwise the resolver silently falls back
  // to fuzz with the precise underline-mark (visual lie). Mirrors the
  // fuzz-required check above.
  if (privacy === 'precise' && !preciseText) {
    return jsonResponse({ ok: false, error: 'precise-required' }, 400);
  }
  const next = await setWindowNowMeta(env, {
    privacy,
    fuzzText,
    fuzzTextEs,
    preciseText,
    preciseTextEs,
    shift: shift || null,
    timezone: body.timezone || undefined,
  });
  console.log(JSON.stringify({
    event: 'window.now.updated',
    privacy: next.privacy,
    hasPrecise: !!next.preciseText,
    shift: next.shift,
  }));
  return jsonResponse({ ok: true, now: next }, 200);
}

async function handleWindowMeUnread(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const thread = await getOpenThreadForUser(env, auth.sub);
  return jsonResponse({ ok: true, unread: thread ? !!thread.unreadByUser : false }, 200);
}

async function handleAdminWindowList(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  const queue = await iterateAdminQueue(env, 30);
  return jsonResponse({ ok: true, items: queue, count: queue.length }, 200);
}

// Phase 1a step 1 (audit B3) — resolve the admin's target thread
// regardless of identified vs anonymous. Callers pass sub OR anonId
// (mutually exclusive); the helper returns a normalized envelope
// `{ kind, sub|null, anonId|null, threadId, thread }` on success
// or `{ error }` on shape failure / not-found.
async function _resolveAdminWindowThread(env, params) {
  const sub = typeof params.sub === 'string' ? params.sub.trim() : '';
  const anonId = typeof params.anonId === 'string' ? params.anonId.trim() : '';
  const threadId = typeof params.threadId === 'string' ? params.threadId.trim() : '';
  if (!threadId) return { error: 'invalid-body', status: 400 };
  if (sub && anonId) return { error: 'invalid-body', status: 400 };
  if (sub) {
    const thread = await getThreadById(env, sub, threadId);
    if (!thread) return { error: 'not-found', status: 404 };
    return { kind: 'identified', sub, anonId: null, threadId, thread };
  }
  if (anonId) {
    if (!isValidSaveItemIdShape(anonId)) return { error: 'invalid-body', status: 400 };
    const thread = await getOpenThreadForAnon(env, anonId);
    if (thread && thread.id === threadId) {
      return { kind: 'anon', sub: null, anonId, threadId, thread };
    }
    // Audit B1 — getOpenThreadForAnon returns null when the row has
    // a `claimedBy` stamp (step 2.1 defense). For admin replies, that
    // null doesn't mean "thread gone" — it means "thread migrated."
    // Read the anon row directly; if it carries claimedBy, route the
    // admin op to the sub-keyed thread that now lives at
    // window:thread:<claimedBy>:<threadId>. Failing this re-route,
    // every concurrent claim+reply would 404.
    const anonRaw = await env.AUTH_SESSIONS.get(windowAnonThreadKey(anonId));
    if (anonRaw) {
      let anonRow;
      try { anonRow = JSON.parse(anonRaw); } catch (_) { anonRow = null; }
      if (anonRow && anonRow.claimedBy && anonRow.id === threadId) {
        const subThread = await getThreadById(env, anonRow.claimedBy, threadId);
        if (subThread) {
          return { kind: 'identified', sub: anonRow.claimedBy, anonId: null, threadId, thread: subThread };
        }
      }
    }
    return { error: 'not-found', status: 404 };
  }
  return { error: 'invalid-body', status: 400 };
}

async function handleAdminWindowThread(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  const u = new URL(request.url);
  const params = {
    sub: u.searchParams.get('sub') || '',
    anonId: u.searchParams.get('anonId') || '',
    threadId: u.searchParams.get('id') || '',
  };
  const resolved = await _resolveAdminWindowThread(env, params);
  if (resolved.error) {
    return jsonResponse({ ok: false, error: resolved.error }, resolved.status);
  }
  const messages = await listThreadMessages(env, resolved.threadId, 100);
  // Phase 3.6b — admin attachment + callback display. Attachments
  // are returned grouped by msgId so the operator-side renderer can
  // hang them off the message they belong to. Callbacks are a flat
  // list (rendered as a separate panel — they're per-thread, not
  // per-message). Phone numbers ride E.164 but the renderer masks
  // them by default and reveals on tap (plan §11.6 — admin shoulder-
  // surf privacy).
  const attachmentsByMsgId = await _loadAttachmentsByMsgId(env, resolved.threadId);
  const rawCallbacks = await listCallbacksForThread(env, resolved.threadId);
  // Phase 3.6 audit (Section 3 MED): a callback row's voiceAttachId
  // can outlive the underlying attachment if the visitor hits the
  // "Delete voice note" button between request and dial. Enrich
  // each callback with a voiceDeleted flag so the admin renderer
  // can swap the <audio> element for a "Voice memo deleted" marker
  // instead of rendering a control that 404s on play.
  const callbacks = await Promise.all(rawCallbacks.map(async (cb) => {
    let voiceDeleted = false;
    if (cb.voiceAttachId) {
      const attachRow = await getAttachmentRow(env, cb.voiceAttachId);
      voiceDeleted = !attachRow || !!attachRow.deleted;
    }
    return {
      id: cb.id,
      msgId: cb.msgId || null,
      phoneE164: cb.phoneE164,
      phoneMasked: maskPhone(cb.phoneE164),
      slotKey: cb.slotKey,
      slotLabel: getCallbackSlotLabel(cb.slotKey, cb.locale || 'en') || cb.slotKey,
      voiceAttachId: cb.voiceAttachId || null,
      voiceDeleted,
      locale: cb.locale || 'en',
      status: cb.status || 'requested',
      requestedAt: cb.requestedAt,
    };
  }));
  return jsonResponse({
    ok: true,
    thread: resolved.thread,
    messages,
    kind: resolved.kind,
    attachmentsByMsgId,
    callbacks,
    // Phase 8.3b — tells the admin UI whether to reveal the "Draft reply"
    // button (flag on AND the Workers AI binding is present).
    aiDraftEnabled: _aiDraftEnabled(env),
  }, 200);
}

async function handleAdminWindowReply(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const resolved = await _resolveAdminWindowThread(env, {
    sub: body.sub,
    anonId: body.anonId,
    threadId: body.threadId,
  });
  if (resolved.error) {
    return jsonResponse({ ok: false, error: resolved.error }, resolved.status);
  }
  const sanitized = sanitizeWindowBody(body.body);
  const validated = validateWindowMessageBody({ body: sanitized });
  if (!validated.ok) {
    return jsonResponse({ ok: false, ...validated }, 400);
  }
  // Append Don's message via the kind-appropriate path.
  let result;
  if (resolved.kind === 'anon') {
    result = await appendMessageToAnonThread(env, resolved.anonId, resolved.thread, 'don', sanitized);
  } else {
    result = await appendMessageToThread(env, resolved.sub, resolved.thread, 'don', sanitized);
  }
  if (!result.ok) {
    return jsonResponse({ ok: false, ...result }, result.error === 'thread-full' ? 409 : 500);
  }
  // Update Don's "active" signal so the breathing dot lights up.
  // touch:true — a reply is real operator presence, so refresh lastSeen.
  // (The cron auto-pause write deliberately omits touch so it can't fake
  // presence and defeat the 72h staleness floor.)
  await setWindowActiveMeta(env, { replyingTo: resolved.threadId }, { touch: true });

  // Email the visitor with Don's reply inline. Best-effort — the
  // message is already persisted; visitor will see it on their
  // next visit/poll regardless of email delivery. Anon threads have
  // null email until the operator provides one (via /api/window/email);
  // reply still lands in the thread, visible on next poll.
  const recipientEmail = resolved.thread.email || null;
  // Phase 2.6 — bounce-aware send. If we've recorded a Resend bounce
  // for this address recently, skip the outbound email and log so
  // Don sees the skip in the admin queue. The thread still gets the
  // reply persisted; the visitor sees it on next /window/ poll.
  let bounceSkipped = false;
  if (recipientEmail) {
    try {
      if (await isEmailBounced(env, recipientEmail)) {
        bounceSkipped = true;
        console.log(JSON.stringify({ event: 'window.reply.bounce-skipped', kind: resolved.kind, threadId: resolved.threadId, msgId: result.msg.id, recipient: recipientEmail.slice(0, 4) + '…' }));
      }
    } catch (_) { /* if KV's down, fall through to send */ }
  }
  if (recipientEmail && !bounceSkipped) {
    try {
      if (env.RESEND_API_KEY) {
        const isEs = String(body.locale || '').toLowerCase() === 'es';

        // Phase 1a step 2 — when replying to an anon thread with an
        // email, mint a one-shot claim-magic-link token bound to the
        // anonId. The reply email IS the claim ceremony (no separate
        // "click to verify" step). On verify, handleAuthVerify
        // detects the claimAnonId payload and runs migrateAnonThread.
        let claimUrl = '';
        if (resolved.kind === 'anon' && env.AUTH_SESSIONS) {
          let token = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            const candidate = mintMagicLinkToken();
            const existing = await env.AUTH_SESSIONS.get('magic:' + candidate);
            if (!existing) { token = candidate; break; }
          }
          if (token) {
            const claimReturnTo = isEs ? '/es/window/' : '/window/';
            await env.AUTH_SESSIONS.put('magic:' + token, JSON.stringify({
              email: recipientEmail,
              returnTo: claimReturnTo,
              createdAt: Date.now(),
              claimAnonId: resolved.anonId,
              claimThreadId: resolved.threadId,
            }), { expirationTtl: MAGIC_LINK_TTL_SECONDS });
            const baseUrl = (env.MAGIC_LINK_BASE_URL && String(env.MAGIC_LINK_BASE_URL))
              || new URL(request.url).origin;
            claimUrl = baseUrl
              + '/api/auth/verify?token=' + encodeURIComponent(token)
              + '&returnTo=' + encodeURIComponent(claimReturnTo);
          } else {
            console.warn('[window] claim-token mint exhausted; reply email omits claim footer', { threadId: resolved.threadId });
          }
        }

        const tmpl = windowReplyToUserEmail({
          locale: isEs ? 'es' : 'en',
          body: sanitized,
          windowUrl: isEs ? 'https://muntin.digital/es/window/' : 'https://muntin.digital/window/',
          claimUrl,
        });
        await sendEmail({
          from: env.FROM_EMAIL || 'Muntin Digital <hi@muntin.digital>',
          to: recipientEmail,
          subject: tmpl.subject,
          html: tmpl.html,
          text: tmpl.text,
        }, env.RESEND_API_KEY);
      }
    } catch (err) {
      console.warn('[window] reply email failed', { msgId: result.msg.id, err: err && err.message });
    }
  } else if (!recipientEmail) {
    console.log(JSON.stringify({ event: 'window.reply.no-email', kind: resolved.kind, threadId: resolved.threadId, msgId: result.msg.id }));
  } /* else: bounceSkipped already logged above */

  console.log(JSON.stringify({
    event: 'window.reply',
    kind: resolved.kind,
    sub: resolved.sub,
    anonId: resolved.anonId,
    threadId: resolved.threadId,
    msgId: result.msg.id,
    ts: result.msg.createdAt,
  }));
  return jsonResponse({ ok: true, msgId: result.msg.id, createdAt: result.msg.createdAt }, 200);
}

// Phase 8.3b — admin AI-draft. Workers AI text model used to suggest a
// reply Don edits before sending. Cheap 8B instruct model; the draft is
// always operator-reviewed, never auto-sent.
const WINDOW_AI_DRAFT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

function _aiDraftEnabled(env) {
  return (env.WINDOW_AI_DRAFT_ENABLED === 'true' || env.WINDOW_AI_DRAFT_ENABLED === true)
    && !!(env.AI && typeof env.AI.run === 'function');
}

// Build the chat prompt from the thread transcript. Don's voice, brief,
// first-person, no sign-off. Kept free of specific bio claims so the
// fabrication gate stays green and the draft can't assert facts Don didn't.
function _buildDraftPrompt(messages, thread, locale) {
  const isEs = locale === 'es';
  const sys = isEs
    ? "Eres Don, que lleva un estudio web de una sola persona para restaurantes. Redacta un BORRADOR breve y directo, en primera persona y en su tono práctico, para responder a este visitante. Sin relleno de marketing, sin firma, máximo 3 frases. Es un borrador para que Don lo revise y edite antes de enviar; nunca se envía solo."
    : "You are Don, who runs a one-person restaurant web studio. Draft a brief, direct, first-person reply in his plain, practical voice. No marketing filler, no sign-off, 3 sentences max. This is a DRAFT for Don to review and edit before sending — it is never sent automatically.";
  const ordered = messages.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const transcript = ordered
    .map((m) => (m.from === 'don' ? 'Don' : 'Visitor') + ': ' + (m.body || ''))
    .join('\n')
    .slice(0, 6000); // bound the context window defensively
  const ctxLine = thread && thread.source ? ('\n\n(This thread came in from: ' + thread.source + '.)') : '';
  const user = (isEs ? 'Conversación hasta ahora:\n' : 'Conversation so far:\n')
    + transcript + ctxLine
    + (isEs ? "\n\nRedacta la siguiente respuesta de Don:" : "\n\nDraft Don's next reply:");
  return [
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ];
}

async function handleAdminWindowDraft(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  // Ships dark — flag off (or AI binding absent) → 503 so the UI can hide
  // the button and degrade gracefully.
  if (!_aiDraftEnabled(env)) {
    return jsonResponse({ ok: false, error: 'disabled' }, 503);
  }
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const resolved = await _resolveAdminWindowThread(env, {
    sub: body.sub,
    anonId: body.anonId,
    threadId: body.threadId,
  });
  if (resolved.error) {
    return jsonResponse({ ok: false, error: resolved.error }, resolved.status);
  }
  const messages = await listThreadMessages(env, resolved.threadId, 100);
  if (!messages.length) {
    return jsonResponse({ ok: false, error: 'empty-thread' }, 400);
  }
  const locale = body.locale === 'es' ? 'es' : 'en';
  let draft = '';
  try {
    const out = await env.AI.run(WINDOW_AI_DRAFT_MODEL, {
      messages: _buildDraftPrompt(messages, resolved.thread, locale),
      max_tokens: 320,
      temperature: 0.4,
    });
    draft = String((out && (out.response || out.result)) || '').trim();
  } catch (_) {
    return jsonResponse({ ok: false, error: 'ai-error' }, 502);
  }
  if (!draft) {
    return jsonResponse({ ok: false, error: 'empty-draft' }, 502);
  }
  // Never exceed the composer's hard limit (textarea maxlength=4000).
  if (draft.length > 4000) draft = draft.slice(0, 4000);
  return jsonResponse({ ok: true, draft }, 200);
}

async function handleAdminWindowClose(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const resolved = await _resolveAdminWindowThread(env, {
    sub: body.sub,
    anonId: body.anonId,
    threadId: body.threadId,
  });
  if (resolved.error) {
    return jsonResponse({ ok: false, error: resolved.error }, resolved.status);
  }
  resolved.thread.status = 'closed';
  resolved.thread.updatedAt = Date.now();
  const writeKey = resolved.kind === 'anon'
    ? windowAnonThreadKey(resolved.anonId)
    : windowThreadKey(resolved.sub, resolved.threadId);
  await env.AUTH_SESSIONS.put(writeKey, JSON.stringify(resolved.thread));
  // Audit C — re-index so the admin index reflects status:'closed';
  // otherwise the §8.1 auto-pause count keeps counting this thread as
  // unreplied. Ensure kind/anonId are present so anon threads index right.
  if (resolved.kind === 'anon') { resolved.thread.kind = 'anon'; resolved.thread.anonId = resolved.anonId; }
  await upsertWindowAdminIndex(env, resolved.thread);
  console.log(JSON.stringify({ event: 'window.close', kind: resolved.kind, sub: resolved.sub, anonId: resolved.anonId, threadId: resolved.threadId, ts: resolved.thread.updatedAt }));
  return jsonResponse({ ok: true, status: 'closed' }, 200);
}

async function handleAdminWindowArchive(request, env, ctx) {
  if (!_windowGate(env)) {
    return jsonResponse({ ok: false, error: 'not-found' }, 404);
  }
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  }
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const resolved = await _resolveAdminWindowThread(env, {
    sub: body.sub,
    anonId: body.anonId,
    threadId: body.threadId,
  });
  if (resolved.error) {
    return jsonResponse({ ok: false, error: resolved.error }, resolved.status);
  }
  resolved.thread.status = 'archived';
  resolved.thread.updatedAt = Date.now();
  const writeKey = resolved.kind === 'anon'
    ? windowAnonThreadKey(resolved.anonId)
    : windowThreadKey(resolved.sub, resolved.threadId);
  await env.AUTH_SESSIONS.put(writeKey, JSON.stringify(resolved.thread));
  // Audit C — re-index so the index entry carries status:'archived'.
  // The admin queue still shows archived threads (visually deprioritized)
  // so Don can un-archive; but the §8.1 auto-pause count filters them out,
  // which only works if the index status is current.
  if (resolved.kind === 'anon') { resolved.thread.kind = 'anon'; resolved.thread.anonId = resolved.anonId; }
  await upsertWindowAdminIndex(env, resolved.thread);
  console.log(JSON.stringify({ event: 'window.archive', kind: resolved.kind, sub: resolved.sub, anonId: resolved.anonId, threadId: resolved.threadId, ts: resolved.thread.updatedAt }));
  return jsonResponse({ ok: true, status: 'archived' }, 200);
}


// ------------------------------------------------------------
// /api/badge-snapshot — accept a score payload from the audit UI
// and store it in KV under badge:<urlHash>. No-ops when the
// AUDIT_CACHE binding isn't present. Client POSTs this after a
// successful audit so the embeddable badge (D3) reflects the
// current score. Accuracy gate: we validate the score is a
// number in [0, 100] and refuse anything else.
// ------------------------------------------------------------
async function handleBadgeSnapshot(request, env, ctx) {
  let body;
  try { body = await request.json(); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const target = typeof body.url === 'string' ? body.url : '';
  const gate = assertSafeHttpUrl(target, pickLang(request));
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  const score = typeof body.score === 'number' ? body.score : null;
  if (score === null || !Number.isFinite(score) || score < 0 || score > 100) {
    return jsonResponse({ ok: false, error: 'invalid-score' }, 400);
  }
  const grade = typeof body.grade === 'string' && /^[A-F][+-]?$/.test(body.grade) ? body.grade : gradeFromScore(score);
  if (!env.AUDIT_CACHE) {
    // No KV → no persistence. Return ok:false so the client knows
    // the snapshot didn't land and doesn't point owners at a badge
    // that can't update. This flips to persisted when the binding
    // is provisioned.
    return jsonResponse({ ok: false, error: 'badge-cache-unconfigured' });
  }
  try {
    const normalized = gate.url.toString().replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
    const buf = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    const bytes = new Uint8Array(digest);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
    const key = 'badge:' + hex.slice(0, 32);
    const payload = {
      score: score,
      grade: grade,
      timestamp: Date.now(),
      host: gate.url.hostname.replace(/^www\./i, '')
    };
    // 30-day TTL at the KV level; the /badge endpoint enforces a
    // stricter 7-day freshness window at serve time.
    await env.AUDIT_CACHE.put(key, JSON.stringify(payload), { expirationTtl: 30 * 24 * 3600 });
    return jsonResponse({ ok: true, expiresInDays: 30 });
  } catch (err) {
    console.error('[badge-snapshot]', err && err.message);
    return jsonResponse({ ok: false, error: 'badge-write-failed' }, 502);
  }
}

// D1: audit-snapshot endpoint. Single route, two methods:
//   POST  body: { auditedUrl, score, verdict, results, language, subtype, meta }
//         returns { ok: true, token, shareUrl, expiresAt }
//   GET   ?token=XXXXXXXXXX
//         returns { ok: true, snapshot } | { ok: false, error }
//
// Rate-limiting, rate-limit tier, CORS + request-id logging are all
// handled upstream in the main fetch handler (see API_ROUTES dispatch).
async function handleAuditSnapshot(request, env, ctx) {
  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); }
    catch (_) { return jsonResponse({ ok: false, error: 'invalid-body' }, 400); }

    // Sanity-check the URL before trusting the client-supplied
    // payload. The URL goes into the snapshot and is displayed
    // on the hydrated audit page; it must at minimum parse as an
    // http(s) URL, not a data: / javascript: smuggle.
    const gate = assertSafeHttpUrl(body.auditedUrl, pickLang(request));
    if (!gate.ok) {
      return jsonResponse({ ok: false, error: gate.error }, gate.status);
    }

    const result = await saveSnapshot(env, body);
    if (!result.ok) {
      if (result.error === 'snapshot-storage-unavailable') {
        return jsonResponse({ ok: false, error: 'snapshot-storage-unavailable' }, 503);
      }
      return jsonResponse({ ok: false, error: result.error }, 400);
    }

    // Build the share URL against the request origin so local dev
    // (http://localhost:8787) returns matching links.
    const origin = new URL(request.url).origin;
    const shareUrl = `${origin}/tools/audits/restaurant/?s=${result.token}`;
    const shareUrlEs = `${origin}/es/tools/audits/restaurant/?s=${result.token}`;
    return jsonResponse({
      ok: true,
      token: result.token,
      shareUrl,
      shareUrlEs,
      expiresAt: result.expiresAt,
      bytes: result.byteLength,
    });
  }

  // GET: read a saved snapshot.
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || url.searchParams.get('s') || '';
  if (!isValidTokenShape(token)) {
    return jsonResponse({ ok: false, error: 'invalid-token' }, 400);
  }
  const result = await getSnapshot(env, token);
  if (!result.ok) {
    if (result.error === 'snapshot-storage-unavailable') {
      return jsonResponse({ ok: false, error: 'snapshot-storage-unavailable' }, 503);
    }
    if (result.error === 'not-found') {
      return jsonResponse({ ok: false, error: 'not-found' }, 404);
    }
    return jsonResponse({ ok: false, error: result.error }, 400);
  }
  // Short edge cache — the snapshot is immutable once written, but
  // we don't want to hold it forever in case of manual deletion.
  return new Response(JSON.stringify({ ok: true, snapshot: result.snapshot }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
}

// D7b: /api/og-snapshot?token=<token>
// Returns the per-snapshot OG PNG (uploaded in D7a) with
// content-type:image/png and a long cache-control. When no custom
// OG was saved (legacy snapshots, client-side Canvas failure, OG
// write failure), redirects to the static brand card so every
// shared link has SOMETHING for crawlers to fetch.
async function handleOgSnapshot(request, env, ctx) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || url.searchParams.get('s') || '';
  if (!isValidTokenShape(token)) {
    // Garbage token → redirect to the static brand OG so a
    // malformed share link still renders a social preview.
    return Response.redirect(`${url.origin}/brand/og/audit-restaurants.png`, 302);
  }
  const og = await getSnapshotOg(env, token);
  if (og.ok && og.bytes) {
    return new Response(og.bytes, {
      status: 200,
      headers: {
        'content-type': 'image/png',
        // 7-day cache: snapshots are immutable once written, so
        // crawlers can hold onto the image for a long time.
        'cache-control': 'public, max-age=604800, s-maxage=604800, immutable',
        'access-control-allow-origin': '*',
      },
    });
  }
  // Missing custom OG → fall back to the static brand card. 302
  // rather than returning the bytes so the URL stays stable while
  // the crawler cache learns the permanent location.
  return Response.redirect(`${url.origin}/brand/og/audit-restaurants.png`, 302);
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Generator': MUNTIN_GENERATOR,
      'X-Powered-By': 'Muntin Digital',
    },
  });
}

async function parseFormBody(request) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    return await request.json();
  }

  const formData = await request.formData();
  const obj = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') continue;
    if (key in obj) {
      obj[key] = obj[key] + ', ' + value;
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

// ─────────────────────────────────────────────────────────────────
// Phase G.10 (Growth) — newsletter subscription endpoints.
//
// Storage in AUTH_SESSIONS KV:
//   sub:<sha256(email)>      → { email, locale, status, source,
//                                createdAt, confirmedAt? }
//   sub-confirm:<token>      → { sub, email, locale }   TTL 24h
//
// Status enum: pending | active | unsubscribed.
// Source enum: footer | article-end | workshop-empty-state | window.
//
// All endpoints are silent-200 on validation failure (mirrors
// /api/auth/magic-link) — a network observer cannot tell a real
// signup from spam. Hard-503 only when KV/Resend bindings missing.

// sha256Hex is already imported from ./lib/auth.js — reuse it.

// ===== Phase 3B — Plausible analytics events proxy =====
//
// The self-hosted tracker at /assets/p.js POSTs events to /api/event
// instead of plausible.io directly. We forward to plausible.io's
// /api/event endpoint with the visitor's CF-Connecting-IP carried
// through as X-Forwarded-For so analytics see the real client IP
// (without it, every event would look like it came from the worker).
//
// Why this matters:
//   - Drops plausible.io from CSP connect-src (one fewer third-party).
//   - Drops the preconnect/dns-prefetch lines from every page head.
//   - Lets Plausible (or any drop-in replacement) be swapped without
//     touching site-wide HTML — only the upstream URL here changes.
//
// Wire-shape: pass-through. Plausible's tracker sends a small JSON
// body with { n, u, d, r, p, ... }. We don't parse it; we just
// forward bytes. Failure-mode is silent (204) so the user's session
// isn't disrupted by upstream hiccups.
const PLAUSIBLE_UPSTREAM = 'https://plausible.io/api/event';

async function handlePlausibleEvent(request, env, ctx) {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { allow: 'POST' } });
  }
  // Plausible is happy to ignore an empty body; cap the request so
  // a malicious POST can't tie up isolate memory. 8 KB is generous.
  let body;
  try {
    body = await request.text();
    if (body.length > 8192) {
      return new Response(null, { status: 413 });
    }
  } catch (_) {
    return new Response(null, { status: 400 });
  }

  const clientIp = request.headers.get('cf-connecting-ip') || '';
  const userAgent = request.headers.get('user-agent') || '';

  // Best-effort forward. Don't await for too long; the visitor
  // doesn't see this latency but we shouldn't tie up the worker
  // either. 5s upper bound is plenty for Plausible's siteverify.
  let upstreamRes;
  try {
    upstreamRes = await fetch(PLAUSIBLE_UPSTREAM, {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',  // Plausible accepts text/plain JSON
        'user-agent': userAgent,
        ...(clientIp ? { 'x-forwarded-for': clientIp } : {}),
      },
      body,
      signal: AbortSignal.timeout ? AbortSignal.timeout(5_000) : undefined,
    });
  } catch (_) {
    // Network blip; return 202 (Accepted) so the tracker treats
    // it as success and doesn't retry-storm.
    return new Response(null, { status: 202 });
  }

  // Mirror upstream status so the tracker can react if needed.
  // Body content from Plausible is minimal; we don't relay it.
  return new Response(null, { status: upstreamRes.status });
}

const SUBSCRIBE_SOURCES = new Set(['footer', 'article-end', 'workshop-empty-state', 'window', 'cost-index']);

// Constant-time string equality (compares fixed-length SHA-256 digests so the
// compare time is independent of where the strings first differ).
async function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const va = new Uint8Array(ha), vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

// Weekly Cost Index broadcast. Called once a week by the publish Action (NOT a
// browser) with a Bearer secret + the insight JSON computed by
// scripts/build-cost-index-dispatch.mjs --json. Sends costIndexWeeklyEmail to
// every ACTIVE subscriber whose source is 'cost-index' (so only people who opted
// into the price index get it). Idempotent per week (re-runs/retries no-op).
async function handleCostIndexBroadcast(request, env, ctx) {
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'method-not-allowed' }, 405);
  const provided = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!env.COST_INDEX_BROADCAST_SECRET) return jsonResponse({ ok: false, error: 'broadcast-not-configured' }, 503);
  if (!(await constantTimeEqual(provided, String(env.COST_INDEX_BROADCAST_SECRET)))) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  if (!env.AUTH_SESSIONS) return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  if (!env.RESEND_API_KEY) return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);

  let insight;
  try { insight = await request.json(); } catch (_) { return jsonResponse({ ok: false, error: 'invalid-body' }, 400); }
  const asOf = String((insight && insight.asOf) || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) return jsonResponse({ ok: false, error: 'invalid-asof' }, 400);

  // Idempotency — never send the same week twice (Action retries, re-runs).
  const stampKey = 'cost-index:broadcast:' + asOf;
  const already = await env.AUTH_SESSIONS.get(stampKey);
  if (already) { let s; try { s = JSON.parse(already); } catch (_) { s = {}; } return jsonResponse({ ok: true, status: 'already-sent', stamp: s }); }

  const baseUrl = (env.MAGIC_LINK_BASE_URL && String(env.MAGIC_LINK_BASE_URL)) || 'https://muntin.digital';
  const fromEmail = (env.FROM_EMAIL && String(env.FROM_EMAIL)) || 'Don Goldstein <don@muntin.digital>';
  const postUrl = String((insight && insight.postUrl) || (baseUrl + '/cost-index/'));
  const CAP = 90;   // Resend free tier is 100/day — stay under; larger lists need batching/queue.

  let sent = 0, failed = 0, skipped = 0;
  for await (const { key, sub } of iterateAllSubscribers(env)) {
    if (!sub || sub.status !== 'active' || sub.source !== 'cost-index') continue;
    if (sent >= CAP) { skipped++; continue; }
    const unsubUrl = `${baseUrl}/sub/unsubscribe?t=${key.replace(/^sub:/, '')}`;
    const msg = costIndexWeeklyEmail(Object.assign({}, insight, { locale: sub.locale, unsubUrl, postUrl }));
    let res;
    try { res = await sendEmail({ to: sub.email, from: fromEmail, replyTo: 'don@muntin.digital', subject: msg.subject, html: msg.html, text: msg.text }, env.RESEND_API_KEY); }
    catch (e) { res = { ok: false, error: e && e.message }; }
    if (res && res.ok) sent++; else failed++;
  }
  await env.AUTH_SESSIONS.put(stampKey, JSON.stringify({ sent, failed, skipped, at: Date.now() }), { expirationTtl: 120 * 24 * 3600 });
  return jsonResponse({ ok: true, asOf, sent, failed, skipped });
}

async function handleSubscribe(request, env, ctx) {
  if (!isOriginAllowed(request)) return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);

  // A native form POST — JS disabled, or a submit that beat the page's
  // eager enhancer — arrives as a browser *navigation*, not a fetch.
  // Returning JSON paints the raw {"ok":true} in the address bar; send
  // those visitors back to the page they came from instead. Same-origin
  // referers only (never honor an off-site referer — that would be an
  // open redirect). The enhanced path posts via fetch and still gets
  // JSON. A no-JS POST can't clear the ts/Turnstile gates anyway, so
  // this only avoids the raw-JSON screen; it does not claim a signup
  // that did not happen.
  let okReply = jsonResponse({ ok: true }, 200);
  if ((request.headers.get('sec-fetch-mode') || '') === 'navigate') {
    let backTo = '/';
    try {
      const ref = request.headers.get('referer');
      if (ref) {
        const r = new URL(ref);
        if (r.origin === new URL(request.url).origin) backTo = r.pathname + r.search + r.hash;
      }
    } catch (_) { /* malformed referer → home */ }
    okReply = new Response(null, { status: 303, headers: { location: backTo } });
  }

  let body;
  try { body = await parseFormBody(request); } catch (_) { return jsonResponse({ ok: false, error: 'invalid-body' }, 400); }
  const lenGate = enforceMaxLengths(body, { email: 254, source: 32, locale: 8, hp: 100, ts: 30 });
  if (!lenGate.ok) return jsonResponse({ ok: false, error: 'invalid-body' }, 400);

  const SILENT_OK = okReply;
  if (isSpamHoneypot(body))    return SILENT_OK;
  if (!isTimestampSane(body))  return SILENT_OK;
  if (isHighThreatIP(request)) return SILENT_OK;
  // Layer-2 anti-spam: Turnstile. Skipped until the secret is wired.
  const turnstile = await checkTurnstile(body, env, request);
  if (!turnstile.ok && !turnstile.skipped) return SILENT_OK;
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!isValidEmail(email))    return SILENT_OK;

  const bodyLang = typeof body.locale === 'string' ? body.locale.toLowerCase() : '';
  const locale = (bodyLang === 'es' || bodyLang === 'en') ? bodyLang : pickLang(request);
  const source = SUBSCRIBE_SOURCES.has(body.source) ? body.source : 'footer';

  if (!env || !env.AUTH_SESSIONS) return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  if (!env.RESEND_API_KEY)        return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);

  const subKey = 'sub:' + (await sha256Hex(email.toLowerCase()));
  const existingRaw = await env.AUTH_SESSIONS.get(subKey);
  if (existingRaw) {
    let existing; try { existing = JSON.parse(existingRaw); } catch (_) { existing = null; }
    // Idempotency: if already active, silent-200 without re-emailing.
    if (existing && existing.status === 'active') return SILENT_OK;
  }

  let token;
  for (let i = 0; i < 5; i++) {
    const candidate = mintMagicLinkToken();
    const collision = await env.AUTH_SESSIONS.get('sub-confirm:' + candidate);
    if (!collision) { token = candidate; break; }
  }
  if (!token) return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);

  const now = Date.now();
  const subRecord = {
    email, locale, source,
    status: 'pending',
    createdAt: now,
  };
  await env.AUTH_SESSIONS.put(subKey, JSON.stringify(subRecord));
  await env.AUTH_SESSIONS.put('sub-confirm:' + token, JSON.stringify({ sub: subKey, email, locale }), {
    expirationTtl: 24 * 60 * 60,
  });

  const baseUrl = String(env.MAGIC_LINK_BASE_URL || 'https://muntin.digital').replace(/\/$/, '');
  const confirmUrl = `${baseUrl}/sub/confirm?t=${token}`;
  const tmpl = subscriberConfirmEmail({ confirmUrl, locale });
  ctx.waitUntil(sendEmail({ env, to: email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text }));
  return SILENT_OK;
}

// ─────────────────────────────────────────────────────────────────
// Pre-launch (Muntin Ledger) — founding-member waitlist proxy.
//
// First-party /api/waitlist endpoint. Mirrors handleSubscribe's
// anti-spam gates (origin → honeypot → timestamp → threat-IP →
// Turnstile → email validity), then forwards the lead server-to-
// server to the product API at api.muntin.digital. The product owns
// storage + the double-opt confirmation email; we never persist the
// lead here. Same silent-200-on-failure posture so a network observer
// can't distinguish a real signup from spam; hard-503 only when the
// upstream call itself fails (so the client's inline-success UI is
// honest — it only flips to "check your inbox" on a 200).
const WAITLIST_SOURCES  = new Set(['studio', 'studio-hero', 'studio-product', 'studio-banner']);
const WAITLIST_UPSTREAM  = 'https://api.muntin.digital/v1/waitlist';

async function handleWaitlist(request, env, ctx) {
  if (!isOriginAllowed(request)) return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  let body;
  try { body = await parseFormBody(request); } catch (_) { return jsonResponse({ ok: false, error: 'invalid-body' }, 400); }
  const lenGate = enforceMaxLengths(body, { email: 254, name: 120, business: 160, source: 32, locale: 8, founding_member: 8, hp: 100, ts: 30 });
  if (!lenGate.ok) return jsonResponse({ ok: false, error: 'invalid-body' }, 400);

  const SILENT_OK = jsonResponse({ ok: true }, 200);
  if (isSpamHoneypot(body))    return SILENT_OK;
  if (!isTimestampSane(body))  return SILENT_OK;
  if (isHighThreatIP(request)) return SILENT_OK;
  // Layer-2 anti-spam: Turnstile. Skipped until the secret is wired.
  const turnstile = await checkTurnstile(body, env, request);
  if (!turnstile.ok && !turnstile.skipped) return SILENT_OK;
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!isValidEmail(email))    return SILENT_OK;

  const bodyLang = typeof body.locale === 'string' ? body.locale.toLowerCase() : '';
  const locale = (bodyLang === 'es' || bodyLang === 'en') ? bodyLang : pickLang(request);
  const source = WAITLIST_SOURCES.has(body.source) ? body.source : 'studio';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const business = typeof body.business === 'string' ? body.business.trim() : '';
  // Default to founding-member opt-in; only an explicit 'false' opts out.
  const foundingMember = String(body.founding_member).toLowerCase() !== 'false';

  // Forward server-to-server. The product API owns storage and the
  // confirmation email; we just relay the validated lead. The proxy
  // key + real-visitor IP let the product rate-limit per visitor
  // (the worker is the only origin it ever sees otherwise).
  const upstreamUrl = String(env.WAITLIST_UPSTREAM_URL || WAITLIST_UPSTREAM);
  const params = new URLSearchParams();
  params.set('email', email);
  params.set('name', name);
  params.set('business', business);
  params.set('founding_member', foundingMember ? 'true' : 'false');
  params.set('source', source);
  params.set('locale', locale);

  const headers = { 'content-type': 'application/x-www-form-urlencoded' };
  if (env.WAITLIST_PROXY_KEY) {
    headers['x-muntin-proxy-key'] = String(env.WAITLIST_PROXY_KEY);
    headers['x-muntin-client-ip'] = request.headers.get('cf-connecting-ip') || '';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: params.toString(),
      signal: controller.signal,
    });
    if (res.ok) return jsonResponse({ ok: true }, 200);
    // Never leak upstream status/body — a generic 503 is all the
    // client needs to keep the form in its pre-submit state.
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  } catch (_) {
    return jsonResponse({ ok: false, error: 'service-unavailable' }, 503);
  } finally {
    clearTimeout(timer);
  }
}

async function handleSubscribeConfirm(request, env, ctx) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');
  if (!token || !env || !env.AUTH_SESSIONS) {
    return new Response('Invalid or expired link.', { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  const ckey = 'sub-confirm:' + token;
  const raw = await env.AUTH_SESSIONS.get(ckey);
  if (!raw) {
    return new Response('Invalid or expired link.', { status: 410, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  let payload; try { payload = JSON.parse(raw); } catch (_) { payload = null; }
  if (!payload || !payload.sub) {
    return new Response('Invalid or expired link.', { status: 410, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  const subRaw = await env.AUTH_SESSIONS.get(payload.sub);
  let sub; try { sub = JSON.parse(subRaw || 'null'); } catch (_) { sub = null; }
  if (!sub) {
    return new Response('Invalid or expired link.', { status: 410, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  sub.status = 'active';
  sub.confirmedAt = Date.now();
  await env.AUTH_SESSIONS.put(payload.sub, JSON.stringify(sub));
  await env.AUTH_SESSIONS.delete(ckey);
  const dest = sub.locale === 'es' ? '/es/?subscribed=1' : '/?subscribed=1';
  return new Response(null, { status: 302, headers: { location: dest } });
}

// ─────────────────────────────────────────────────────────────────
// Phase G.11 (Growth) — generalized share-snapshot endpoints.
//
// Mirror of the audit-snapshot pattern, generalized via kind tag.
// Each kind has a dedicated handler so we can validate kind-specific
// payload shape without a giant switch — a new kind = a new handler.
// Both endpoints write to AUTH_SESSIONS KV via saveShareSnapshot.

// Phase G.10 (Growth) — Workshop nav count badge data endpoint.
const _wbCountCache = new Map();
async function handleWorkbenchCount(request, env, ctx) {
  const auth = await _requireWorkbenchSession(request, env);
  if (auth.error) return auth.error;
  const sub = auth.sub;
  const now = Date.now();
  const cached = _wbCountCache.get(sub);
  if (cached && cached.expiresAt > now) {
    return jsonResponse({ ok: true, count: cached.count }, 200);
  }
  let count = 0;
  let cursor = null;
  for (let page = 0; page < 5; page++) {
    const opts = { prefix: `save:${sub}:` };
    if (cursor) opts.cursor = cursor;
    const r = await env.AUTH_SESSIONS.list(opts);
    count += r.keys.length;
    if (r.list_complete || !r.cursor) break;
    cursor = r.cursor;
  }
  _wbCountCache.set(sub, { count, expiresAt: now + 60_000 });
  return jsonResponse({ ok: true, count }, 200);
}

// Phase G.12 (Growth) — admin KPI dashboard data endpoint.
// Reads data/kpis.json via env.ASSETS so the JSON file is the
// single source of truth (no duplicated copy bundled into the
// Worker). Admin-gated via _requireAdminSession (NOTIFY_EMAIL
// match). Returns the registry verbatim with ok:true wrapper.
async function handleAdminKpis(request, env, ctx) {
  const auth = await _requireAdminSession(request, env);
  if (auth.error) return auth.error;
  try {
    const url = new URL(request.url);
    const assetReq = new Request(url.origin + '/data/kpis.json', { headers: { 'accept': 'application/json' } });
    const r = await env.ASSETS.fetch(assetReq);
    if (!r.ok) return jsonResponse({ ok: false, error: 'kpi-data-missing' }, 503);
    const data = await r.json();
    return jsonResponse({ ok: true, kpis: data.kpis || [], _lastReviewed: data._lastReviewed || null }, 200);
  } catch (err) {
    console.warn('[admin/kpis] fetch failed', err && err.message);
    return jsonResponse({ ok: false, error: 'kpi-data-error' }, 500);
  }
}

// Phase G.11 — share-snapshot per-token OG image endpoint.
// Receives /api/share/og/<token>.png (token + kind in query)
// or just /api/share/og?t=<token>&kind=<kind>. v1 redirects to
// the kind's static brand card so social crawlers always have a
// rich preview. v2 will render a per-token Canvas card via
// resvg-js, mirroring the audit-snapshot OG path.
async function handleShareOg(request, env, ctx) {
  const url = new URL(request.url);
  // Support both ?t= and the trailing-slug form /api/share/og/<token>
  // (the HTMLRewriter sets the trailing slug).
  let token = url.searchParams.get('t') || '';
  if (!token) {
    const m = url.pathname.match(/\/api\/share\/og\/([A-Z0-9]{10})(?:\.png)?$/);
    if (m) token = m[1];
  }
  const kind = url.searchParams.get('kind') || 'storefront-health';
  // Fallback target — the static kind-level card.
  const fallback = kind === 'storefront-health'
    ? `${url.origin}/brand/og/tool-storefront-health.png`
    : `${url.origin}/brand/og/tools.png`;
  if (!isValidShareTokenShape(token) || !isValidShareKind(kind)) {
    return Response.redirect(fallback, 302);
  }
  // Verify the token resolves before redirecting; on miss, fall
  // back to kind-level card so a stale crawler still renders.
  const snap = await getShareSnapshot(env, kind, token);
  if (!snap || !snap.ok) return Response.redirect(fallback, 302);
  // v1: redirect to the kind's static card. The token having
  // resolved is the validation step. v2 swaps in a Canvas render.
  return Response.redirect(fallback, 302);
}

// Phase G.11 — share-snapshot read endpoint. Tool client-side JS
// calls /api/share/get?kind=<kind>&t=<token> on load when ?s=
// is present in the URL, hydrates the form/scorecard, fires
// "Share" recipient-render Plausible event.
async function handleShareGet(request, env, ctx) {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') || '';
  const token = url.searchParams.get('t') || '';
  if (!isValidShareKind(kind) || !isValidShareTokenShape(token)) {
    return jsonResponse({ ok: false, error: 'invalid-args' }, 400);
  }
  const snap = await getShareSnapshot(env, kind, token);
  if (!snap || !snap.ok) return jsonResponse({ ok: false, error: 'not-found' }, 404);
  // Snapshots are immutable, so cache aggressively at the edge.
  return new Response(JSON.stringify({ ok: true, kind, snapshot: snap.snapshot }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

async function handleShareToolResult(request, env, ctx) {
  if (!isOriginAllowed(request)) return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  let body;
  try { body = await request.json(); } catch (_) { return jsonResponse({ ok: false, error: 'invalid-body' }, 400); }
  if (!body || typeof body.tool !== 'string' || !body.payload) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  // Sanitize: tool slug must match /^[a-z0-9-/]+$/, payload size cap
  // is enforced inside saveShareSnapshot.
  if (!/^[a-z0-9/-]+$/.test(body.tool) || body.tool.length > 60) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  // Strip any obvious PII at validation time — share-snapshot payloads
  // must NEVER contain emails, sub IDs, or auth tokens. Reject if found.
  const flat = JSON.stringify(body.payload).toLowerCase();
  if (/\bemail\b/.test(flat) || /\bsub:[a-f0-9]/.test(flat)) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const result = await saveShareSnapshot(env, SHARE_KINDS.TOOL_RESULT, { tool: body.tool, payload: body.payload });
  if (!result.ok) return jsonResponse({ ok: false, error: result.error }, 503);
  const url = `/tools/${body.tool}/?s=${result.token}`;
  return jsonResponse({ ok: true, token: result.token, url, expiresAt: result.expiresAt }, 200);
}

async function handleShareStorefrontHealth(request, env, ctx) {
  if (!isOriginAllowed(request)) return jsonResponse({ ok: false, error: 'forbidden-origin' }, 403);
  let body;
  try { body = await request.json(); } catch (_) { return jsonResponse({ ok: false, error: 'invalid-body' }, 400); }
  if (!body || typeof body.propertyName !== 'string' || !body.scores) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  if (body.propertyName.length > 200) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const flat = JSON.stringify(body.scores).toLowerCase();
  if (/\bemail\b/.test(flat) || /\bsub:[a-f0-9]/.test(flat)) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const result = await saveShareSnapshot(env, SHARE_KINDS.STOREFRONT_HEALTH, {
    propertyName: body.propertyName,
    scores: body.scores,
    payload: body.payload || null,
  });
  if (!result.ok) return jsonResponse({ ok: false, error: result.error }, 503);
  const url = `/health/${result.token}/`;
  return jsonResponse({ ok: true, token: result.token, url, expiresAt: result.expiresAt }, 200);
}

async function handleSubscribeUnsubscribe(request, env, ctx) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');
  if (!token || !env || !env.AUTH_SESSIONS) {
    return new Response('Invalid link.', { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  // Token form: sha256-hex of email — same key as sub:<hash>. Stable
  // per-subscriber so unsubscribe links work indefinitely.
  const subKey = 'sub:' + token.toLowerCase();
  const raw = await env.AUTH_SESSIONS.get(subKey);
  if (!raw) {
    return new Response('Already unsubscribed.', { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  let sub; try { sub = JSON.parse(raw); } catch (_) { sub = null; }
  if (sub) {
    sub.status = 'unsubscribed';
    sub.unsubscribedAt = Date.now();
    await env.AUTH_SESSIONS.put(subKey, JSON.stringify(sub));
  }
  return new Response('Done. You will not receive further newsletter emails.', {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
