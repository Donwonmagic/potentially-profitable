# The Window — Redesign Plan (Synthesis)

> Status: draft synthesis from six specialist plans (UX/composer, IA/distribution,
> multimodal-engineering, brand-voice/anti-chatbot, accessibility/i18n,
> engineering-architecture). Pending review-agent pass.

## 0. Thesis

**The Window is a windowsill, not a chatbot.** Operators write a note. Don
reads it on a real schedule. The page admits to being asynchronous and is
honest about latency. The brand metaphor — a muntin is the slender strip that
holds glass together — becomes the IA: hairlines, not buttons, are the
connective tissue. Contact UX is **carpentry, not signage**.

The redesign treats the four confirmed wounds as a single problem: the
visitor cannot freely write to Don because the page asks them to (1) sign
in, (2) fill a form, (3) know what to ask, before they have done the one
thing they came to do — write. Everything below dissolves those frictions
in order, layered against the standout posture (no fake presence, no
greeter, no widget chrome, real Don visible).

## 1. The four wounds and how each is healed

| Wound | Healed by |
|---|---|
| **Sign-in friction kills first sends** | Anonymous-first send via cookie-bound `md_anon_thread_id`. Sign-in becomes a post-send upgrade and a one-click magic-link claim embedded in Don's first reply email — not a gate. |
| **Composer feels like a contact form, not a conversation** | Two-pane composer at the 38.2% golden split. Left pane = presence (portrait + breathing dot + calendar-honest reply line). Right pane = note (caption "Don —" + textarea). Three context fields collapse into one optional `<details>`. Onramp chips become operator-note openers (not SDR scripts). |
| **Operators don't know what to say (blank-page paralysis)** | Three soft layers: rotating deterministic placeholder (7 prompts), a fifth chip "I don't know what I need yet," context-aware hint when arriving from `/studio/`/`/tools/`/`/sheets/`, and a fieldnotes peek showing redacted operator notes. |
| **The Window is invisible across the rest of the site** | Whole-site muntin posture via `_includes/nav.html`, `_includes/footer.html`, the existing KnitRail injector, and a new `assets/js/window-state.js` shared script. Pulse, pause-state, and canonical reply-time travel everywhere through one source. |

## 2. Architecture (engineering)

### 2.1 Anonymous-first state machine

Today every Window endpoint funnels through `_requireWorkbenchSession`
(src/worker.js:5059) and keys threads by `sub` (src/lib/window.js:8,61-63,109).
We introduce a **dual-identity** scheme without rewriting the contract.

- New cookie `md_anon_thread_id` minted server-side on first POST to
  `/api/window/append` when no session exists. HttpOnly, SameSite=Lax,
  Secure, Path=/, Max-Age 90 days. Value uses `mintSaveItemId()` for
  shape parity (src/lib/window.js:58-59).
- New KV prefix `window:thread:anon:<anonId>`. One thread per anon cookie
  — the cookie *is* the index.
- `threadKey()` accepts a discriminated union: `{kind:'sub',sub,threadId}`
  vs `{kind:'anon',anonId}`. Read paths converge.
- Throttle: `window:throttle:anon:<anonId>` AND coarser
  `window:throttle:ip:<sha256(ip)>` (defeats cookie-cycling). Lower cap
  `MAX_ANON_MSGS_PER_DAY = 5`.
- Cookie-blocked fallback (Safari ITP, third-party-cookies-off):
  server returns `anonSub` in JSON; client uses `localStorage` + `X-Anon-Sub`
  header; if both blocked, expose `?anon=<sub>` URL as the ride-back.

**Claim flow.** Don's first reply email IS the magic link.
The email body opens with a one-shot URL `/sign-in/?claim=<anonId>&t=<token>`.
On verify:

1. Read `window:thread:anon:<anonId>`; if missing/claimed → no-op.
2. Write `window:thread:<sub>:<threadId>` with same threadId. Message keys
   `window:msg:<threadId>:<msgId>` are sub-agnostic (src/lib/window.js:64-66) —
   they don't move. **This is the key insight: the migration is a single
   thread-row write, not a bulk re-key.**
3. Update `window:thread-index:<sub>`.
4. Stamp anon record `{claimedBy:sub, claimedAt}`, set 30-day TTL (preserve
   rollback path).
5. Refresh admin index entry to new `{sub, threadId}` shape.

**Cross-device claim is explicit.** The signing-in device claims silently;
on other devices the verify page prompts: "We found a previous thread on
this device — link it to your account?" KV's eventual consistency forbids
auto-merging an anonId from a different region with the verifying device's
session.

### 2.2 KV / R2 / config schema additions

| Key / binding | Purpose | Owner |
|---|---|---|
| `window:thread:anon:<anonId>` | Anon-cookie-bound thread | Engineering |
| `window:throttle:anon:<anonId>`, `window:throttle:ip:<hash>` | Anon throttling | Engineering |
| `window:attach:<threadId>:<attachId>` (KV metadata only) | Attachment row | Multimodal |
| R2 bucket `WINDOW_ATTACHMENTS` (key shape `attach/<threadId>/<msgId>/<attachId>.<ext>`) | Voice + photo storage | Multimodal |
| `window:transcript-queue:<attachId>` | Whisper job queue | Multimodal |
| `window:callback:<threadId>:<callbackId>` | Callback request | Multimodal |
| `window:thread:promoted:<threadId>` | Skip 90-day attachment TTL | Engineering |
| `window:now` (single key) | Operator presence blob — `{shift, reading, building, updatedAt}` | Engineering |
| `window:meta:composing:<threadId>` (30s TTL) | Honest "Don is replying" presence | Engineering |

**Stay shared in `AUTH_SESSIONS`.** Splitting into a new namespace buys
nothing latency-wise (KV reads are isolate-cached per-key) and triples
ops surface area.

### 2.3 Polling vs SSE

**SSE on `/window/` thread page only.** Replace the 5s poll
(assets/js/window.js:291-300) with `/api/window/stream`: a 60s streaming
`Response` that emits `event: poll` on KV deltas via 2s server-side
checks. EventSource handles reconnect. `/api/window/active` stays a 60s
fetch (already cache-controlled).

**"Don is composing" presence.** New key `window:meta:composing:<threadId>`,
30s TTL, refreshed by admin only after >10s of real composing (debounced).
The visitor sees one calendar-honest line: "Don is writing — give him a
minute." Never on focus. Never simulated. The anti-fake-presence guarantee.

> **Caveat (review-flagged):** the current `assets/js/admin-window.js` is the
> queue browser only — there is no per-thread reply-composer wiring in the
> repo. The keystroke listener + TTL refresher must be built into whichever
> admin reply UI Don is using; this is a Phase-2/3 dependency, not a "drop
> in." If admin reply happens via email-out-of-band, this presence
> mechanism is moot and should be cut.

### 2.4 Cron

> **Phase 0 prerequisite (review-flagged):** `triggers.crons` in
> `wrangler.jsonc:305-307` is currently commented out. The `scheduled()`
> handler in `src/worker.js:670-700` is dead code today. **Phase 0 must
> uncomment the cron block and confirm the `PER_TICK_BUDGET=200` and
> 30s wall-budget hold under 5-minute cadence** before any consumer
> below relies on cron. Sized originally for daily watch checks, not
> 5-minute Window flushes.

One cron `*/5 * * * *` with a multi-step dispatcher (matches the existing
src/worker.js:670-700 tick lock pattern, once enabled):

1. Pending-Don batch flush (every tick) — already designed.
2. Stale-thread SLA flag (every tick): scan iterateAdminQueue, mark threads
   where `now - lastUserMsgAt > 36h && !lastDonReplyAt > lastUserMsgAt`.
3. Anon thread cleanup (every 6th tick = 30 min): archive >180d-inactive
   anon threads; hard-delete archived after another 30d.
4. Attachment R2 lifecycle (every 12th tick = hourly): TTL unpromoted
   attachments. **Voice TTL = 30 days (BIPA-conservative); photo TTL = 90 days.**

Voice transcripts are inline (Workers AI binding `AI`), not crontab —
fewer moving parts.

### 2.5 Spam, throttle, and email deliverability

Anon-first opens new abuse vectors. Defenses, in layers:

- **Origin gate stays on the anon path.** `handleWindowAppend` already runs
  `isOriginAllowed(request)` (src/worker.js:5855-5856 pattern); the anon
  branch must inherit that gate, not bypass it.
- **Turnstile on first anon POST.** The footer Turnstile widget exists
  site-wide (`_includes/footer.html:80-85`). Extend it: when posting
  without a session AND no `md_anon_thread_id` cookie present, require
  a `cf-turnstile-response` token. Subsequent appends to the same anon
  thread reuse the cookie and skip the challenge (managed mode is
  invisible 99% of the time).
- **Per-IP throttle in addition to per-anonId.** `window:throttle:ip:<sha256(ip)>`
  defeats cookie-cycling at low cost. Cap: same 5/day as `MAX_ANON_MSGS_PER_DAY`.
- **Resend free-tier quota awareness.** Magic-link claim emails and Don's
  reply emails share the 100/day Resend quota (worker.js:131 comment). If
  an attacker triggers 50+ anon sends to drain the quota, magic-link claims
  fail silently. Mitigation: (a) Don's reply email IS the claim link
  (one email serves two purposes — see §2.1), (b) admin metrics surface
  daily Resend send-count so we see drain attempts, (c) on quota exhaustion,
  the visitor still has the thread — they just don't get the email; the
  page-level success state (§3.7) is the primary feedback.
- **Magic-link email scope.** The email body is **Don's actual reply**
  with a small footer link: *"Sign in to keep this thread on your other
  devices."* Do NOT make the entire email a claim ceremony — that smells
  like a phishing email and trains operators to mistrust it.

## 3. The composer redesign

### 3.1 Layout

- **Two literal panes, divided by the existing `.window-muntin` hairline**
  at the 38.2% golden split (window/index.html:95-97).
- **Left pane** (the narrow): Don's portrait at 56-64px circular (reuse
  /about/portrait/don.webp), the breathing dot already wired, and one
  calendar-honest sentence read from `window:now`:
  "Don is between shifts · last seen 14m ago" / "Don is on shift at
  Tacombi until close · reply tomorrow morning."
- **Right pane** (the wide): the existing `Don —` caption
  (window/index.html:135), then the textarea — nothing above it.

### 3.2 Deletions from default render

- The eyebrow "What brings you in?" (window/index.html:127) — the muntin
  pane already says that visually.
- The three-field context grid (window/index.html:142-155) — collapsed
  into a single `<details>` labeled "Tell me who you are (optional)"
  inside the right pane below the textarea. Inside `<details>`, fields
  are ordered **Restaurant + city → Current website → Your name**
  (operators identify by room before name).
- The textarea label "What's on your mind \*" (window/index.html:157) —
  the placeholder is the label.
- The counter (window/index.html:160) — only renders when body length
  crosses 3,500 chars (87.5% of cap), as a quiet warning.
- The full-form sign-in CTA (window/index.html:182-184) — sign-in moves
  to the post-send moment.

### 3.3 Mic is the exception — visible without scroll

The mic is **inside the textarea's right edge**, 44×44 button, visible
without scroll on a 360px viewport. Voice is the literacy lever; it
does not hide behind a focus event. Other affordances appear on
textarea focus or paste-detection: `[+] photo · [calendar] schedule a
callback · [pen] sign with name`.

### 3.4 Onramp chips — operator-note openers, plus "I don't know"

Replace the SDR-style prepended sentences (window/index.html:128-131) with
operator-note skeletons. Add a fifth chip for paralysis.

| Chip label (EN) | Prepend (EN) |
|---|---|
| New site · $2,500–15k | `The room: . The URL (if any): . What I'm hoping a new site fixes: ` |
| Look at my site · $499 | `Site URL: . What's bugging me about it: ` |
| Take over my Care Plan · $225/mo | `Site URL: . Who currently maintains it: . What's slipping: ` |
| Something else | (no prepend) |
| **I don't know what I need yet** | `I'm not sure what I need yet. Here's what's going on: ` |

(Spanish strings ship in same PR — see §6.) "Audit" is rendered "Look at
my site and tell me what's broken" because trade-words read as IRS to
the "what's an audit?" persona. The productized name still rides in
`data-prepend` for Don's inbox view.

### 3.5 Three soft paralysis layers (no decision tree)

1. **Static placeholder (honors Rule 9 "no greeter").** A single line
   that does not rotate per visit:
   - **EN:** *"Start anywhere — a line is enough."*
   - **ES:** *"Empieza por donde sea — con una línea basta."*

   Decision: the rotating-prompt approach (earlier draft) was itself
   a greeter pattern. We hold the rule and accept that paralysis is
   carried by layers 2 and 3 below + the chip set in §3.4 + the
   fieldnotes peek.
2. **Fieldnotes peek.** Below the textarea, one chip: "I'm not sure
   what to ask — show me what others have written." Click expands the
   (currently empty) fieldnotes rail (window/index.html:187-194)
   inline as a peek: 3 redacted operator notes drawn from
   `data/fieldnotes-sample.json` (gated by `MUNTIN_FIELDNOTES_ENABLED`).
3. **Context-aware mirror.** On referrer match (`/studio/`, `/tools/`,
   `/sheets/`), append a single italic stone-color line above the
   textarea: "Coming from /studio/audit/? Tell me your URL — I'll
   start there." Context-mirror, not decision-tree.

### 3.6 Thumb-only send path (no typing, no mic permission)

The "owner whose hands are dirty" persona needs a path that requires
neither typing nor mic permission. Today `MIN_MSG_LENGTH = 1`
(src/lib/window.js:46) blocks empty-body sends. Override:

- When the message has at least one attachment (photo or — in voice
  mode — recorded audio that has produced a transcript), `MIN_MSG_LENGTH`
  is treated as 0 server-side.
- The chip prepends + a photo + send is a complete message.
- A photo with an alt-text caption is a complete message even without a
  chip. The alt-text counts as body content for the purposes of the
  email digest.

This is the structural answer to Rule 9 worry: the chip is text the
operator chose, not text the page wrote.

### 3.6 Mobile

- Submit button = full-bleed thumb-zone bar at
  `position: sticky; bottom: env(safe-area-inset-bottom)`.
- Mic at position 1, 56×56 tap target, **right of the textarea, not below.**
- Textarea opens at 3 rows, grows on input.
- Fieldnotes peek + escape-hatch row collapse behind a single
  "More ways to reach Don" link.

### 3.7 Success state — 2.5s reveal-fade-restore

Replaces the composer area for 2.5s (sequenced after `loadThread()`
re-fetch completes — never before):

- **Line 1**: just-sent message stamp, animated as if pressed against
  glass: *"You · 11:47 PM Tue"*. Reuses `.window-msg__stamp` styling.
- **Line 2**: the canonical reply line (§5.1) — repeated here so the
  promise made in the hero is restated at the moment of trust transfer.
- **Line 3**: soft sign-in upgrade. One inline field, one button:
  *"Keep this on your other devices? Drop your email."* If the
  visitor types, magic-link sends and the block is replaced with
  *"We'll email you when Don writes back."*

After 2.5s the composer fades back, cursor in a fresh empty textarea,
ready for follow-up. **No fake "Don is typing…"** Ever.

## 4. Whole-site distribution

### 4.1 The muntin posture, in three rules

1. Hairlines, not buttons, are the connective tissue.
2. The pulse travels — same `windowPulse` element, beside the "Email Don"
   nav button and inline in the foot-cta strip.
3. No floats. No widgets. No "How can I help?" The Window is a
   destination, not chrome.

### 4.2 Phase 1 — partials only (single source-of-truth edits)

Edits to:
- `_includes/nav.html` (line 61-63 today): pulse dot beside the envelope SVG;
  hidden by default; revealed by shared `assets/js/window-state.js` polling
  `/api/window/active`. Title: "Don is around — last seen Xm ago."
- `_includes/footer.html` (line 3-8 today): pulse dot LEFT of the
  "Got a question?" copy. Pause-state swaps the copy via `data-paused`
  attribute.
- `_includes/footer.html` (line 110-119, mobile sticky bar): same
  pulse dot. Bar collapses to single audit button when paused.
- `data/window-config.json` (new): `{replyTimeEn, replyTimeEs,
  replyTimePromise}` — single source.
- `assets/js/window-state.js` (new, ~1KB): one `/api/window/active`
  poll per page (cached 60s); resolves `enabled, lastSeen, returnDate,
  shift` from the extended endpoint.
- `scripts/check-reply-time-canon.mjs` (new): grep CI guard against
  legacy reply-time variants.

`scripts/sync-includes.mjs` propagates these to every page in one build.

### 4.3 Phase 2 — handoff asides on tools and sheets

The KnitRail injector (`scripts/inject-knit-rail.mjs`) already provides
a "Talk" lane prepending `?topic=<slug>`. **Do not add a second aside;
extend this one** with an optional `.knit-rail__nudge` line drawn from
`data/article-window-nudges.json` (per-topic copy, EN+ES).

Tool result pages get a new aside between the result panel and the
foot-cta strip:

```html
<aside class="window-handoff">
  <div class="window-muntin"></div>  <!-- the same hairline -->
  <p class="eyebrow">Hand this to Don</p>
  <p>Your audit found 6 leaks. The two ranked Critical
     are usually the ones I'd start with.</p>
  <a class="btn btn-primary"
     href="/window/?topic=audit&prefill=tool:audit:<resultId>">
    Want a second pair of eyes? →
  </a>
</aside>
```

The composer reads `?prefill=` and pulls the result data from
sessionStorage on landing. **Result-aware copy** — sheets that detect
prime cost >65% say "These are tight margins. Want a second
opinion?"; healthy results say "This looks tight. Want Don to
sanity-check?" Print media queries hide the aside on paper.

### 4.4 Phase 4 — glossary asides + KnitRail nudges + operator presence

- Glossary aside on jargon-heavy terms (skip allowlist at
  `data/glossary-window-skip.json` — "alt-text" skips, "menu
  engineering" keeps).
- `data/article-window-nudges.json` strings ship to ~12
  topic-tagged articles via the KnitRail extension.
- Operator presence renders in three places: `/window/` hero (replaces
  the static "I read every one" line), `/about/` from-the-desk,
  homepage muntin strip. **Never in nav.** Nav-adjacent currents
  become a status widget — that's the chatbot smell.

## 5. Voice and copy

### 5.1 Reply-time canonical sentence

**EN:** *"Usually within 4 hours on weekdays. Always within 2 business days."*
**ES:** *"Normalmente en menos de 4 horas en días laborales. Siempre dentro de 2 días hábiles."*

(`días laborales` over `lunes a viernes` — accommodates holidays.)

This is the line. It replaces:

- `window/index.html:88` (hero) and `:166` (reassurance) — direct edits.
- **`_includes/footer.html:66`** — the source of truth for the foot-trust
  line. About/index.html:742 and every other rendered page is just the
  stamped output; editing the rendered HTML gets wiped on next
  `sync-includes` build. The partial is the fix location.
- ES mirror in `_includes/es/footer.html` (or wherever the ES partial
  lives) and `es/window/index.html:80,147`.

Single source: `data/window-config.json`. CI guard
`scripts/check-reply-time-canon.mjs` fails the build on any legacy variant
of "under 4 hours, Mon–Fri" / "same business day, always inside two."

### 5.2 Honest-async UI vocabulary

| Old | New |
|---|---|
| "Typing…" (would-be) | *"Don is writing — give him a minute"* (only after >10s real composing) |
| "Sent it. Don has the note." (assets/js/window.js:21) | Branched by `data-tod`: weekday 9-7 → *"Sent. Don will read between rushes today."* / weekend or late → *"Sent. Filed for Monday morning's read."* |
| "Online / Offline / Away" | Three calendar states only: *"Don is around"* (lastSeen <90m), *"Don is between shifts"* (90m–4h), *"Don is on shift at Tacombi until close"* (read from `window:now`). |
| "Slow down a moment — wait 60 seconds" (assets/js/window.js:25) | *"Hold up — Don's getting a flood of these right now. Try again in 60 seconds, or email don@muntin.digital and I'll thread it manually."* |
| Day-break separator (assets/js/window.js:204-211) | Keep `— Friday, May 9 —`. When gap >3 days, prepend *"— After a quiet stretch —"*. |

### 5.3 Multimodal copy

- **Voice memo**: "Talk it out (60 sec)" / "Cuéntalo en voz (60 s)"
- **Recording state**: "Listening. Tap to stop." (with VU bar, NOT waveform)
- **Length-cap warning at 80s**: "Ten seconds left — wrap it." Per
  WCAG 2.2.1, announced via `role="status"`.
- **Voice privacy disclosure** (visible above mic on first use, then
  collapsed to `i` icon): *"Voice notes are stored only until I've
  replied; never analyzed by a third party, never used to train a model."*
- **Photo affordance**: "Add a photo of the room or the menu"
- **Photo loading**: "Reading the photo…" (not "Uploading")
- **Alt-text capture (always shown, default-on)**: "Describe the photo
  (helpful for screen readers — and for me)"
- **Callback time-window chips in operator vocabulary**:
  "Tomorrow before service (8–11am)" / "Tomorrow between rushes (2–4pm)"
  / "Tomorrow after close (10pm–midnight)"
- **Callback auto-confirmation thread message** (auto-posted by Don's
  thread bot): *"Got it. I'll call [name] at [number] [window]. If
  something changes, just write back here."*

### 5.4 The transcript-edit moment (literacy lever)

When a transcript returns, render it editable in a textarea with a
single line above: *"Here's what I heard. Fix anything before sending —
or send as-is."* / *"Esto es lo que escuché. Corrige lo que quieras
antes de enviar — o envíalo tal cual."* No auto-send-on-stop. The
operator owns the correction.

### 5.5 Empty thread

Empty-thread state stays editorially silent — but adds one line:
*"Whatever you'd type to a friend who knows this stuff — that's enough."*
*"Lo que le escribirías a un amigo que sabe del tema — con eso basta."*

The muntin SVG (window/index.html:101-109) keeps its place.

### 5.6 Anti-chatbot design rules (enforced in code review)

1. No emoji in Window UI.
2. No exclamation marks except in operator quotes.
3. Hairlines, not cards (cards = chatbot vocabulary).
4. Never use "live" without specifying the source.
5. No bottom-up entrance animations. Messages enter via opacity + 4-6px
   translate **down** (editorial "rolling in"), not up.
6. Date-stamp messages older than yesterday ("Tue, May 6, 4:12pm"),
   not relative-time alone.
7. No floating bubble bottom-right anywhere on the site.
8. Operator-named, not "support" / "we" / "our team."
9. No greeter on arrival. First-paint is silent until the operator types.
10. Calendar before clock. "Tomorrow morning" beats "in 14 hours."

## 6. Accessibility, i18n, literacy

### 6.1 The persona lens

Every agent's proposal is justified against ≥2 of these six situations
(not personas). They are the test:

- The two-finger typist
- The fluent-spoken / hesitant-written ELL operator
- The iMessage native who has never used a "contact form"
- The "what's an audit?" owner
- The 11pm operator with fading vision
- The owner whose hands are dirty

### 6.2 Cognitive load target

**Target: ≤4 user actions on a first-time send, ≤3 on returning sends.**
The first-time visitor's mic-permission grant is the unavoidable extra
gesture; we count it honestly rather than hide it.

- Voice path (first time): tap-hold mic → grant permission → release +
  tap send → confirmation. 4 actions.
- Voice path (returning): tap-hold mic → release + tap send → confirmation.
  3 actions.
- Text path: type a line → submit → confirmation. 3 actions.
- Chip path: tap chip → fill → submit → confirmation. 4 actions
  (acceptable; chip is optional and prepends content for free).
- Thumb-only path (§3.6): tap chip → tap photo + select → submit →
  confirmation. 4 actions, no typing, no mic.

The context fields collapsed into `<details>` is a non-negotiable. Any
proposal that breaks the budget for the bare-minimum send is rejected.

### 6.3 Voice as literacy

- Mic placement: 44×44 real `<button>`, not a custom element. Space/Enter
  starts/stops; Escape cancels.
- **Placement rule** (review-flagged): on desktop, the mic sits inside the
  textarea's right edge. On mobile with the keyboard open, iOS Safari and
  some Android keyboards partially occlude the right edge with their own
  toolbar. **The mic must reposition above-textarea-right when the
  keyboard is open** (detect via `visualViewport.height < window.innerHeight`).
  Test path: iOS Safari with keyboard open at 360px viewport must show the
  mic without scroll.
- Idle-typist nudge: 5s of focus + 0 chars → polite `aria-live` line:
  *"Or tap and hold the mic — speak it."*
- Permission denial: do NOT clear the textarea. `role="status"` line:
  *"Mic blocked. No problem — type it, or email don@muntin.digital."*
- Transcript displays inline in thread by default (WCAG 1.2.1 / 1.2.5).
- Whisper auto-detects language; transcript renders in spoken language
  regardless of page locale. Don's inbox view shows both: spoken-language
  transcript + auto-translated EN.

### 6.4 Photo accessibility

- Alt-text capture shown by default. Empty alt → server stores `"[image]"`
  (never empty, never missing).
- Drag-drop is augmentation. The path is always a `<button>`.
- Progress announcements via `aria-live="polite"` (file selected →
  uploading 30/60/90% → ready).

### 6.5 Spanish-first posture

- **No redirect.** Honor the existing "we deliberately do NOT redirect"
  contract in `src/worker.js:512-515` — redirects on root paths are
  hostile to crawlers, curl, and cache keys, and `/window/` does not
  earn an exception that's worth breaking that contract.
- **Banner copy upgrade** in the partial that produces the Spanish-hint
  banner (currently `about/index.html:370` is the rendered output;
  source is the language-hint partial referenced by sync-includes):
  *"Todo el sitio en español — 139 términos del glosario, todas las
  herramientas, todos los artículos."* The banner remains opt-in and
  dismissible. Make Spanish parity legible; don't choose it for the
  visitor.
- **i18n parity audit checklist (CI)**: every chip, every error, every
  voice/photo/callback string ships in EN+ES same PR. New CI script
  `scripts/check-window-locale-parity.mjs` (already exists per audit
  — extend it to cover the new strings).

### 6.6 Late-night-operator path

`<body data-tod>` toggled by the worker (server-stamped, no flash).
Three states: `late` (≥21:00 local), `weekend` (Fri 17:00 → Mon 06:00),
`business`.

- Reassurance line absorbs the time-of-day:
  - `late` / `weekend`: *"I'll see this in the morning. No rush — I read every one."* / *"Lo veo en la mañana. Sin prisa — leo cada mensaje."*
  - default: the canonical reply line.
- Submit copy unchanged ("Send the note" — see §6.7).

### 6.7 Submit button

EN: **"Send the note"** (replacing "Send it over" — cleaner ES parity).
ES: **"Enviar a Don"** (already canonical at line 49 in window.js).

### 6.8 WCAG 2.2 AA compliance matrix (new components)

| SC | Component | Mitigation |
|---|---|---|
| 1.1.1 | Photo upload | Default alt `[image]`; visible alt-text field |
| 1.2.1 / 1.2.5 | Voice memo | Inline transcript displayed by default |
| 2.2.1 | Voice timeout | 20s-before-cap announcement via `role="status"` |
| 2.4.7 | Focus visible | `--ring-focus` inherits to all new components |
| 2.5.7 | Drag-drop | File-picker button is the primary affordance |
| 2.5.8 | Target size | All new chips/buttons ≥44×44 mobile |
| 3.3.7 | Redundant entry | localStorage already handles name/restaurant; extend to phone |

Test plan: axe-core CI on `/window/` and `/es/window/` (Phase 2 onward),
manual VoiceOver iOS pass on mic flow, NVDA pass on transcript edit,
TalkBack pass on chip aria-pressed.

## 7. Phasing

| Phase | Scope | Flag | Risk |
|---|---|---|---|
| **0 (week 0)** | Enable cron trigger: uncomment `triggers.crons` in `wrangler.jsonc:305-307`, confirm `PER_TICK_BUDGET=200` and 30s wall-budget hold under `*/5` cadence, deploy + observe one cycle. | None (config change) | Low. No user-facing change. Prerequisite for everything below. |
| **1 (week 1)** | Anonymous-first send + reply-time canonicalization + sign-in CTA rewrite at `window/index.html:182-184` + `/sign-in/?claim=&t=` query-param branch. **Honest scope: Phase 1 *does* touch UI** — the existing sign-in section reframes from "Want replies threaded with you?" to a post-send upgrade only, and `/sign-in/` learns to claim anon threads. Reply-time canon edits `_includes/footer.html:66` (the partial, not rendered pages). | `WINDOW_ANON_ENABLED` | Medium. Biggest WOUND fix but auth path is load-bearing. |
| **2 (week 2)** | Composer redesign (two-pane, static placeholder, `<details>` context fields, mic with keyboard-aware reposition, thumb-only override of `MIN_MSG_LENGTH`) + sync-include propagation (nav/footer/sticky pulse) + KnitRail nudge requires new template branch in `scripts/inject-knit-rail.mjs:213-225` + per-topic data file + new `.knit-rail__nudge` CSS in `assets/site-article.css` + axe-core CI. | None (template change) | Medium. Visible UI shift. |
| **3 (week 3-4)** | Multimodal: photo first → voice second (BIPA-conservative 30-day R2 retention + privacy disclosure, ships behind flag pending legal sign-off) → callback third. | `WINDOW_PHOTO_ENABLED`, `WINDOW_VOICE_ENABLED`, `WINDOW_CALLBACK_ENABLED` | Medium. New R2 binding. Workers AI quota. |
| **4 (week 5+)** | Operator presence (`window:now` widget on /window/, /about/, homepage; **14-day staleness circuit-breaker** hides the widget when `updatedAt > 14d`), tool-result asides on top 5 tools, sheets contact, glossary asides on jargon-heavy terms. | `WINDOW_NOW_ENABLED` | Low. Additive. |

Existing `WINDOW_ENABLED` (src/worker.js:5847-5849) remains the master kill.

## 8. Observability

Plausible custom events (no PII):

- `window-send-anon` (first send while anon)
- `window-send-identified`
- `window-attach-photo`, `window-attach-voice`
- `window-callback-request`
- `window-magic-link-claim`, `window-magic-link-claim-rejected`
- `window-day-cap`, `window-rate-limit`
- `window-aside-shown`, `window-aside-clicked`
- `window-now-edit`

Admin metrics page at `/admin/window/metrics`: server-rendered HTML,
KV-derived counts (open threads, stale, anon-pending-claim, attachment
count, oldest unanswered), embedded Plausible iframe for events. Don
checks weekly. Not real-time SaaS.

## 9. Open conflicts resolved

| Conflict | Resolution |
|---|---|
| Optional context fields placement | `<details>` collapse below textarea. Restaurant → URL → Name order. (Accessibility wins on cognitive load.) |
| Onramp chips count | Keep 4 + add 5th "I don't know what I need yet". Brand-voice chip copy adopted. |
| Anon claim cross-device | Silent on signing-in device; explicit "link this previous thread?" on others. (Engineering wins on KV correctness.) |
| Reply-time string | Synthesized: *"Usually within 4 hours on weekdays. Always within 2 business days."* / ES *"…días laborales. …2 días hábiles."* |
| /now/ source of truth | KV blob `window:now` editable via admin endpoint. (No rebuild for Don's edits.) |
| Mic placement | Inside textarea right edge, visible without scroll. (Accessibility wins on literacy.) |
| Submit button copy | "Send the note" (EN parity with ES). |

## 10. User decisions (post-review)

The four post-review judgment calls landed as follows. These are
final; the plan above already reflects them.

| Question | Decision |
|---|---|
| Voice biometric storage under BIPA / CUBI / MHMDA | **Ship voice in Phase 3 with 30-day R2 retention** + privacy disclosure visible above mic on first use. `WINDOW_VOICE_ENABLED` stays off until written legal sign-off lands. Photos retain 90 days; voice is the BIPA-conservative subset. |
| Spanish-first on /window/ | **No redirect.** Banner-copy upgrade only — make Spanish parity legible without breaking the existing "deliberately do NOT redirect" contract. (See §6.5.) |
| Rotating placeholder vs Rule 9 | **Static line wins.** Single placeholder: *"Start anywhere — a line is enough."* / *"Empieza por donde sea — con una línea basta."* Rule 9 holds. (See §3.5.) |
| `/now/` widget cadence | **Weekly Monday + after notable shifts.** 14-day staleness threshold hides the widget when Don falls behind, rather than showing stale presence. Admin metrics surface a "now is X days old" reminder. |

## 11. Failure-mode coverage (review-additions)

### 11.1 Vacation half-state (Don is around but silent)

Today's pause copy (window/index.html:75-80) handles the all-or-nothing
case (Window paused, no replies). But "open but Don is on vacation 7
days" has no honest answer. Resolve:

When `window:now.shift === 'away'` AND `now - lastSeen > 7d`:

- The calendar-honest sentence in the left pane reads:
  *"Don is back the week of [returnDate] — write now and I'll thread
  it on return."*
- The success-state line (§3.7 line 2) softens to:
  *"Filed for the week of [returnDate]. No rush."*
- The pulse goes still (no breathing animation), grey ring instead of
  teal dot. Site-wide.

Distinct from full-pause (`WINDOW_ENABLED=false` returns 404 from the
poll endpoint and renders the standalone paused section). The half-state
keeps the form active but tunes expectations down.

### 11.2 Tab-close / double-send race

Same device, two tabs, sender double-posts. The `md_anon_thread_id`
cookie catches this, but the second-tab UX must reflect it:

- On `/window/` boot, the client always polls `/api/window/thread`
  before showing the empty composer. If an existing anon thread is
  found, the page renders **the existing thread** (not a fresh empty
  composer). Existing message scroll, fresh empty textarea below.
- 60s back-pressure (`APPEND_BACK_PRESSURE_MS`, src/lib/window.js:49)
  catches the actual duplicate-send attempt server-side; client surfaces
  the rate-limit copy from §5.2.

### 11.3 Magic-link email deliverability

Resend free-tier 100/day quota (src/worker.js:131 comment) is a fragile
pin. Mitigations:

- Don's reply email IS the magic link (one email serves two purposes).
  No separate "click to claim" email.
- Admin metrics page (`/admin/window/metrics`) surfaces daily Resend
  send-count so drain attempts are visible.
- On quota exhaustion, the visitor's send still succeeds — the page-level
  success state is the primary feedback. The email is supplemental.

### 11.4 Pulse staleness circuit-breaker

If `window:now.updatedAt > 14d`, the pulse hides site-wide and the
left-pane presence line reads simply *"Don reads every one"* without a
last-seen qualifier. Better to be quietly absent than visibly stale.

### 11.5 Admin reply-composer presence prerequisite

The "Don is composing" presence (§2.3) requires keystroke-listener
instrumentation in the admin reply UI. Today `assets/js/admin-window.js`
is the queue browser only — there is no per-thread reply composer in
this repo. Either:

- (a) Build the admin reply composer in Phase 2 (it's needed anyway
  for the reply-from-browser workflow), and instrument the keystroke
  listener at the same time, OR
- (b) Cut the "Don is composing" presence from scope. The pulse +
  read-receipt + left-pane shift status already cover the visible-Don
  story without it.

Recommendation: **(b)** cut from initial scope. Add only if the admin
reply composer ends up built for reasons beyond presence. Anti-fake-
presence is the rule; absence of presence is honest.
