# The Window — Redesign Plan (v3, post-second-round review)

> Status: synthesized from the audit, six specialist plans, one general
> review, and six second-round reviews (conversion, muntin-metaphor depth,
> felt experience, adversarial, operations, plain-English literacy).
> Pending one final consolidation pass. Ship-ready outline.

> **What changed from v2.** Six second-round reviews surfaced concerns
> that demanded structural changes, not just edits. v3 is smaller,
> safer, and warmer than v2:
>
> - **Smaller** — operations review showed the plan breaks Don between
>   25–35 sends/day; v3 adopts the minimum-viable cut.
> - **Safer** — adversarial review identified the `/now/` widget as a
>   stalking dossier and magic-link-as-reply as a phishing template;
>   v3 adds three-tier privacy + DMARC posture + Twilio masking + PII
>   pre-write gate.
> - **Warmer** — felt-experience and plain-English reviews showed the
>   page reads "gracious but ungreeted"; v3 promotes the empty-thread
>   line above the textarea, adds a "Don sometimes says no" tell, adds
>   a crisis-keyword referral footer, and rewrites strings for the
>   ELL fluent-spoken / hesitant-written persona.
> - **Truer to muntin** — brand-integrity review caught the 38.2% golden
>   split as borrowed (the brand mark is 1/2 vertical + 35% horizontal
>   transom); v3 corrects geometry and renames panes (top sash, bottom
>   sash, sidelight, sill) as literal CSS classes.

## 0. Thesis

**The Window is a windowsill, not a chatbot.** Operators write a note.
Don reads it on a real schedule. The page admits to being asynchronous
and is honest about latency. The brand metaphor — a muntin is the
slender strip that holds glass together — is now the IA in lexicon AND
geometry: the muntin is at 1/2 vertical (matching the brand mark, not
the golden ratio); the sash is the operable light; the sill is what
the note rests on once written; the casing is the muntin posture
site-wide.

The redesign treats the four wounds as a single problem: the visitor
cannot freely write because the page asks them to (1) sign in, (2) fill
a form, (3) know what to ask, before they have done the one thing they
came to do — write. v3 dissolves those frictions with surgical scope,
honest copy, and operational backstops that protect Don from his own
success.

## 1. The four wounds and how each is healed (v3)

| Wound | Healed by |
|---|---|
| **Sign-in friction kills first sends** | Anonymous-first send via cookie-bound thread. Sign-in becomes a post-send byproduct: Don's reply email IS the sign-in link (one email, one purpose). |
| **Composer feels like a contact form, not a conversation** | Two-pane composer divided by the literal muntin at 1/2 vertical (brand-mark accurate). Three context fields collapse into one optional `<details>`. Onramp chips become operator-note openers. The empty-thread welcome line is promoted above the textarea, not buried inside the placeholder. |
| **Operators don't know what to say (blank-page paralysis)** | Static welcome line above textarea: *"Whatever you'd type to a friend who knows this stuff — that's enough."* Six chips (including two non-priced empathy chips). Context-aware mirror on referrer. Fieldnotes peek shipping with 3 hand-curated seeded notes (not empty). |
| **The Window is invisible across the rest of the site** | Phase 2: pulse propagates to footer + audit/sheets handoff aside. Phase 4+ extensions deferred — operations review showed site-wide propagation is operationally fragile and conversion lift is bounded. |

## 2. Architecture

### 2.1 Anonymous-first state machine (v3)

Cookie-bound thread, claim-via-reply-email. Same as v2 except hardened
per adversarial review.

- New cookie `md_anon_thread_id`. HttpOnly, SameSite=Lax, Secure,
  Path=/, Max-Age 90 days. Value: `mintSaveItemId()` (10-char,
  src/lib/window.js:58-59).
- New KV prefix `window:thread:anon:<anonId>`.
- `threadKey()` accepts discriminated union: `{kind:'sub',sub,threadId}`
  vs `{kind:'anon',anonId}`.
- Throttle: per-anonId (5/day) AND per-IP-hash AND `cf.threatScore >= 30`
  pre-gate. **NEW:** Turnstile token required on first anon POST per IP
  (re-challenge every 30d for unidentified anons).
- Fallback chain: cookie → localStorage → URL `?anon=<sub>` (degraded
  mode, documented).

### 2.2 Magic-link claim — hardened (adversarial review)

- **Magic-link token shape:** 32 bytes, `crypto.getRandomValues`,
  base64url, single-use, 10-minute TTL, server-stamped `usedAt` so
  re-use 410s. Bound to `anonId` at issuance — even if the email is
  forwarded, the recipient can't claim a different thread.
- **Email auth posture:** SPF, DKIM, DMARC `p=quarantine` for
  `muntin.digital`. Magic-link emails carry an `Authentication-Results`
  warning footer and a non-clickable token preview *("Token starts
  with: a3f…")* so operators can verify the link came from Don's
  domain. Defense against typo-domain phishing.
- **Don's reply email IS the magic link** (one email, one purpose):
  the email body opens with Don's actual reply text, with a small
  footer link "Sign in to keep this thread on your other devices."
  No standalone "click to verify" email — that smells like phishing
  and trains operators to mistrust legitimate Don messages.
- **Resend-quota partition:** reserve last 30/day for Don's outbound
  replies. Anon-confirmation emails skip when remaining < 30; magic-link
  emails skip when remaining < 10. If quota exhausts, the page-level
  success state remains primary feedback.

### 2.3 KV / R2 / config schema additions

| Key / binding | Purpose | Notes |
|---|---|---|
| `window:thread:anon:<anonId>` | Anon-cookie-bound thread | |
| `window:throttle:anon:<anonId>`, `window:throttle:ip:<hash>` | Anon throttling | |
| `window:attach:<threadId>:<attachId>` (KV metadata) | Attachment row | |
| R2 bucket `WINDOW_ATTACHMENTS` | Voice + photo storage | Worker-proxied only; CORS denies cross-origin |
| `window:transcript-queue:<attachId>` | Whisper job queue | Voice deferred to Phase 3 |
| `window:callback:<threadId>:<callbackId>` | Callback request | Phase 5+ for live; Phase 3 ships async-voicenote-pickup-time only |
| `window:thread:promoted:<threadId>` | Skip TTL | |
| `window:now` (single key) | Operator presence — fuzz-by-default, see §4.4 | Three-tier privacy |
| `window:meta:composing:<threadId>` | **CUT** in v3 | See §11.5 |
| `window:crisis-flag:<threadId>` | Tier-1 crisis keyword hit | See §11.6 |
| `window:bounce:<email>` | Email-bounce tracker | Resend webhook |

**Stay shared in `AUTH_SESSIONS`.** Splitting into a new namespace buys
nothing latency-wise.

### 2.4 No SSE in v3

v2 proposed SSE replacing the 5s poll. Cut from v3 — it adds complexity
without proportional value when the "Don is composing" presence is also
cut (see §11.5). 5s polling stays.

### 2.5 Cron — Phase 0 prerequisite

`triggers.crons` in `wrangler.jsonc:305-307` is currently commented out.
The `scheduled()` handler in `src/worker.js:670-700` is dead code today.
**Phase 0 must uncomment the cron block and confirm budget contracts**
before any consumer below relies on cron.

One cron `*/5 * * * *` with multi-step dispatcher:

1. Pending-Don batch flush (every tick).
2. Stale-thread SLA flag (every tick): scan iterateAdminQueue, mark
   threads where `now - lastUserMsgAt > 36h && !lastDonReplyAt > lastUserMsgAt`.
   **Client threads get 12h SLA; prospects get 36h** (operations review).
3. Anon thread cleanup (every 6th tick): archive >180d-inactive,
   hard-delete after another 30d.
4. Attachment R2 lifecycle (every 12th tick): TTL **voice = 30d**
   (BIPA-conservative); **photo = 90d**.
5. **Auto-pause vital-signs check (every tick):** if no admin login
   AND no `now` widget update AND no admin replies for 72h,
   automatic half-state activation. See §11.1.
6. **Resend bounce reconciliation (every 12th tick):** consume
   bounce webhook KV rows; mark threads with bounced emails.

### 2.6 Spam, throttle, deliverability (hardened)

> **Phase split (per §7):** the origin gate + the per-anonId / per-IP
> throttles ship in **Phase 1a step 1** (foundation) because they're
> the table-stakes for accepting any anonymous POST. The threat-score
> gate, Turnstile, PII pre-write gate, and `textContent` rendering
> rule ship in **Phase 1b** because they're the harden-before-flip
> requirements. The flag (`WINDOW_ANON_ENABLED`) MUST stay off until
> 1b lands. `docs/DEPLOY-CHECKPOINTS.md` holds the pre-flip checklist.

- Origin gate (`isOriginAllowed`) on the anon path — non-negotiable.
  *Phase 1a step 1.*
- Per-IP-hash throttle (5/day for anon). *Phase 1a step 1.*
- Per-anonId throttle (5/day, 60s back-pressure). *Phase 1a step 1.*
- Cloudflare threat-score gate (`isHighThreatIP`, 403 at >=30) — already
  in codebase, must be invoked. *Phase 1b.*
- Turnstile on first anon POST per IP; managed mode invisible 99% of the
  time. *Phase 1b.*
- **PII pre-write gate (NEW):** regex sweep for credit-card (PAN with
  Luhn), SSN, password-keyword-near-string. On match: do not store body;
  reply *"I don't take card numbers or passwords through the Window —
  email me directly or call."* Apply to voice transcripts too.
- **Render via `textContent` only.** Never `innerHTML` for any operator
  body. Existing `sanitizePlaintext` (src/lib/submissions.js:91-106)
  re-escapes correctly; the rule is enforced as a code-review lint.
- Resend-quota partition (see §2.2).
- Email-bounce loop handler (Resend webhook → KV → admin flag).

### 2.7 R2 access posture

Worker-proxied attachment download only. Per-request session/anon-cookie
re-check against `attach` KV row before serving bytes. CORS denies
cross-origin reads. Thread IDs at ~49 bits of entropy (`mintSaveItemId`)
are sufficient given enumeration is gated by per-thread auth.

### 2.8 Server-side EXIF strip

Photo EXIF is stripped client-side via canvas re-encode AND server-side
on R2 ingest. Don't trust client-side strip alone — adversarial uploads
can bypass it. Drop GPS, camera serial, timestamp. Admin renderer shows
attachments behind a 12px blur with tap-to-reveal (vendor-PII defense).

### 2.9 Voice — delete-transcript affordance

Per-message "Delete this transcript" button on visitor and admin sides.
KV row replaced with `{deleted:true, deletedAt}`; R2 object hard-deleted.
Required for the immigration-status / domestic-violence cases. The
button is a Phase 3 ship requirement, not a follow-on.

## 3. The composer redesign (v3 — corrected muntin geometry, named panes)

### 3.1 Geometry (corrected from v2)

The brand mark (window/index.html:58-66, brand/icons/icon-window.svg)
puts the vertical mullion at exact 1/2 (x=64 of 128) and the horizontal
transom at ~35% (y=51 of 88). v2 proposed a 38.2% golden split. **v3
adopts the brand mark's actual geometry:**

- **Vertical muntin at exactly 50%.**
- **Horizontal transom at exactly 35%** from top.
- Width: 1px elsewhere on the site, **2px on /window/ specifically**
  via `--muntin-weight` CSS var. The muntin is load-bearing here,
  slender elsewhere — weight variation is the carpentry gradient.
- File change: `assets/site-core.css` — change `.window-muntin
  { left: 38.2% }` declaration at line 2605 to `left: 50%`. Strike
  the "golden split" comment block at line 2570. Add
  `.window-transom { top: 35% }` rule.

### 3.2 Named panes (the deepest muntin move)

Real muntins divide a sash into named lights. Replace v2's "left pane"
/ "right pane" generics with carpenter words, both as visible structure
AND as literal CSS class names:

- `.sash--top` (transom): `window:now` presence — Don's shift, last-seen,
  return-date. Calendar-honest. One italic line.
- `.sash--bottom` (operable light): the customer's note. Textarea +
  chips + mic + photo. **The pane that opens.**
- `.sidelight` (narrow vertical, left): Don's portrait + the breathing
  dot. Stays even when the bottom sash slides up.
- `.muntin` (the slender strip): literal hairline at 50% (matching the
  brand mark). Recedes. **No longer carries the pulse** (see §3.6).
- `.sill` (below the sash): canonical reply-time line + escape hatches.
  The thing the note rests on once written.
- `.casing` (around the whole, site-wide): the muntin posture.

### 3.3 Layout (mobile-first)

- **Sidelight** carries Don's portrait at 56–64px circular and the
  pulse (relocated from the muntin).
- **Sash--top (transom)** carries the calendar-honest presence sentence
  read from `window:now` — fuzz-mode default.
- **Sash--bottom** carries:
  - The hostess line (NEW, promoted from v2's empty-thread micro-copy):
    a stone-italic line above the textarea, persistent: *"Whatever
    you'd type to a friend who knows this stuff — that's enough."*
    / ES: *"Lo que le escribirías a un amigo que sabe de esto — con
    eso basta."*
  - Five chips (see §3.4).
  - Textarea with static placeholder.
  - Mic (44×44 button), keyboard-aware reposition (above-textarea-right
    when iOS visual viewport indicates keyboard open).
  - Affordance row on focus: photo, sign-with-name. (Voice mic always
    visible; callback deferred to Phase 5+.)
- **Sill** carries the canonical reply-time and escape hatches.

### 3.4 Onramp chips (v3 — María-tested + empathy promoted)

| Chip label EN | Chip label ES | Prepend EN |
|---|---|---|
| **I'm not sure yet — let me explain** *(empathy, no price, position 1)* | **No sé todavía — déjame contarte** | *"I'm not sure yet. Here's what's going on: ___"* |
| **I'm not ready to hire — just want a second pair of eyes** *(no price, position 2)* | **No estoy lista para contratar — solo quiero que le eches un vistazo** | *"I'm not ready to hire — just want eyes on this: ___"* |
| New website — $2,500 to $15,000 *(position 3)* | Sitio web nuevo — $2,500 a $15,000 | *"Your place: ___. Your website (if you have one): ___. What I want a new site to fix: ___"* |
| Look at my site and tell me what's wrong — $499 *(position 4)* | Mira mi sitio y dime qué tiene mal — $499 | *"My website: ___. What's bothering me about it: ___"* |
| Take care of my site every month — $225/mo *(position 5)* | Hazte cargo de mi sitio cada mes — $225/mes | *"My website: ___. Who works on it now: ___. What's not working: ___"* |
| Something else | Otra cosa | (no prepend) |

**Six chips.** "Audit" → "Look at my site" (María-tested). "What's
broken" → "What's wrong" (warmer, less mechanical). "What's slipping"
→ "What's not working" (idiom-free). The two lead chips are
priceless — literally — to invite the operator who can't or won't
spend money tonight. The "Don sometimes says no" tell sits below the
chip row (see §3.5).

### 3.5 Trust tells

Below the chip row, one stone-italic line:

> *"If the answer is 'you don't need to spend money on this,' that's
> what I'll tell you. Has happened before."*

ES: *"Si la respuesta es 'no necesitas gastar en esto,' eso es lo que
te voy a decir. Ya ha pasado."*

This is new copy in Don's existing register (warm, plainspoken,
operator-grounded — the same register as about/index.html's narrative
section). It's the single biggest trust-builder in 200 words and costs
no Don-time. The operator learns — without being told — that Don will
tell them they don't need a $2,500 site, if that's true.

### 3.6 Pulse off the muntin

v2 put the pulse on the muntin itself. The muntin is *quiet* — it
recedes. Real muntins don't pulse; the world beyond the glass moves.

**v3:** the pulse moves to the **sidelight**, beside Don's portrait.
6px dot, breathes when `lastSeen < 90m`, still grey-ring when stale.
The muntin keeps its calm. CSS: `.window-muntin__pulse` repositions to
`.sidelight__pulse`.

### 3.7 Static placeholder + welcome line (Rule 9 honored)

The hostess line (§3.3) is promoted ABOVE the textarea, persistent (not
inside the placeholder). The placeholder itself stays minimal:

- **Placeholder EN:** *"Start anywhere — a line is enough."*
- **Placeholder ES:** *"Empieza por donde sea — con una línea basta."*

Rule 9 holds. The welcome work is done by the visible above-textarea
line; the placeholder stays Grade-3 plain.

### 3.8 Thumb-only path

When the message has at least one attachment (photo with alt-text, or
a recorded voice memo with transcript), `MIN_MSG_LENGTH = 0`
server-side. Chip + photo + send is a complete message. No typing
required.

### 3.9 Deletions from default render

- "What brings you in?" eyebrow (window/index.html:127).
- The three-field context grid (window/index.html:142-155) — collapsed
  into `<details>` labeled *"Tell me who you are (optional)"*.
- The textarea label "What's on your mind \*" — placeholder is the label.
- The counter — only renders at >87.5% of cap.
- The full-form sign-in CTA at window/index.html:182-184 — sign-in is
  now a byproduct of Don's reply, not a page element.

### 3.10 Mobile

- Sticky bottom-bar submit at `position: sticky; bottom:
  env(safe-area-inset-bottom)`.
- Mic placement: inside textarea right-edge on desktop; above-textarea-right
  when `visualViewport.height < window.innerHeight` (iOS keyboard open).
- Textarea opens at 3 rows, grows on input.
- Escape-hatch row collapses behind "More ways to reach Don" link.

### 3.11 Success state — artifact, not email-ask

v2's 2.5s reveal-fade-restore breaks the iMessage loop. **v3 cuts the
ceremony.** Replace with an inline confirmation that stays:

- The just-sent message renders into the thread above the composer.
- A single line above the new message stamp:
  *"That took something. Thank you for writing. I'll have something
  useful back to you by [calendar-honest time]."*
- Below the stamp, **the artifact**: a contextual link based on
  chip/keyword. Examples:
  - Chip "Look at my site": *"While you wait, here's the one thing I'd
    read tonight: [/blog/three-fixes-most-restaurant-sites-need]"*
  - Chip "I'm not ready to hire": *"While you wait — [/glossary/audit]
    explains what I'd actually do for $499."*
  - Voice memo present: *"I'll listen when I sit down. While you wait —
    [contextual link]."*
- The composer is **never disabled** — cursor returns to a fresh empty
  textarea below the new thread message. Follow-on sends are immediate.
- **No "Drop your email" ask.** The email arrives because Don replies;
  the page does not need to ask. (Muntin-integrity + felt-experience +
  plain-English convergence.)

### 3.12 Crisis allowlist — composer-side, not success-side

When the body (live, as the operator types — debounced 600ms after
last keystroke) matches Tier-1 crisis keywords, a quiet line reveals
*below the textarea, before send*:

> *"If tonight is heavier than the website, I'm still going to read
> this — and these folks pick up the phone faster than I can: 988
> (call or text), Chefs With Issues, CHOW."*

ES: *"Si esta noche pesa más que el sitio web, voy a leer esto igual —
y estas personas contestan más rápido que yo: 988 (llama o manda
texto), Chefs With Issues, CHOW."*

**Why composer-side, not success-state:** the operator can see the
resource BEFORE deciding whether to send to Don or call 988. Putting
the crisis line in the success state means they've already pressed
send before the resources surface — too late.

No interception. No blocking. No "are you sure?" modal. The line
*persists* into the success state if the body still matched at send
time, so the operator carries the resources with them while they wait
for Don. If the operator deletes the keyword before sending, the line
disappears and stays gone.

Don gets an SMS notification (if the message sends with Tier-1
keywords still present) + admin red-bar flag. See §11.6.

## 4. Whole-site distribution (v3 — minimum viable cut)

Operations review showed the full sync-include propagation across nav /
footer / sticky bar / asides / glossary / KnitRail / homepage was
operationally fragile. v3 ships the **highest-leverage two surfaces
only** in Phase 2:

### 4.1 The pulse: footer only (Phase 2)

- Edit `_includes/footer.html:3-8`: pulse dot LEFT of the
  "Got a question?" copy. Hidden by default; revealed by shared
  `assets/js/window-state.js` polling `/api/window/active`.
- **Skip** nav button pulse, mobile sticky bar pulse, and all in-article
  asides for Phase 2. Defer to Phase 5+ if conversion data justifies.

### 4.2 Tool result + sheets handoff aside (Phase 2)

The single highest-leverage distribution surface — operators who
already used a tool are pre-qualified. Same as v2:

```html
<aside class="window-handoff">
  <div class="window-muntin"></div>
  <p class="eyebrow">Slide this under his door — Tuesday, May 9.</p>
  <p>Your audit found 6 leaks. The two ranked Critical are usually
     the ones I'd start with.</p>
  <a class="btn btn-primary"
     href="/window/?topic=audit&prefill=tool:audit:<resultId>">
    Want me to take a look? →
  </a>
</aside>
```

Note copy: "Slide this under his door" replaces v2's "Hand this to
Don" — slightly more muntin-vocab, less generic. CTA: "Want me to
take a look?" replaces "Want a second pair of eyes?" (calques poorly
to ES).

Result-aware copy on sheets per v2.

### 4.3 Reply-time canonicalization (Phase 1)

**Canonical sentence (v3):**

> EN: *"Mondays through Fridays, I usually write back within 4 hours
> of when I see your note. On weekends, I'll write back by Monday
> morning. Some weeks I'm on the floor and slower — the page will
> say so."*
>
> ES: *"De lunes a viernes, normalmente respondo a las 4 horas de
> haber visto tu mensaje. Los fines de semana, respondo el lunes en
> la mañana. Algunas semanas estoy en el restaurante y más lento —
> la página lo va a decir."*

Three shifts from v2:
- "Within 4 hours" → "within 4 hours of when I see your note"
  (collapsed to "within 4 hours" + clarifying "of when I see your
  note" via the trailing clause). Removes the "within 4 hours of
  *what?*" ambiguity.
- "Mondays through Fridays" replaces "weekdays" / "días hábiles"
  / "días laborales" (María-tested).
- Adds the honest half-state qualifier ("Some weeks I'm on the floor
  and slower — the page will say so") that buys Don the auto-half-state
  without lying.

Edit locations (corrected from v2's first review):
- `_includes/footer.html:66` — the partial that stamps the foot-trust
  line site-wide. Edit here, not the rendered output.
- `window/index.html:88` (hero) and `:166` (reassurance) — direct edits.
- ES mirrors in `_includes/es/` partials and `es/window/index.html`.

Single source: `data/window-config.json`. CI guard
`scripts/check-reply-time-canon.mjs` fails the build on legacy variants.

### 4.4 `/now/` operator presence — three-tier privacy (NEW, Phase 4)

v2 proposed publishing Don's current location ("at Tacombi until
close"). **Adversarial review identified this as a stalking dossier.**
v3 retains the widget — it's the strongest standout-vs-chatbot signal —
but with safety rails:

- **Three modes** stored in `window:now.privacy`:
  - `precise` — "at Tacombi until close" (full location + time).
  - `fuzz` (DEFAULT) — "in DC tonight" / "between shifts" /
    "back tomorrow morning."
  - `private` — widget hidden; presence line reads "Don reads every
    one" without last-seen qualifier.
- **Hard-coded refusal:** `precise` mode is silently downgraded to
  `fuzz` between 21:00–06:00 local. The late-night precision window
  is the stalker risk.
- **Surface scope:** `/window/` only in Phase 4. Defer `/about/`,
  homepage to Phase 5+ (operations: less surface to maintain).
- **Update cadence:** weekly Mondays + after notable shifts. **14-day
  staleness threshold** (`now - updatedAt > 14d`) hides the widget
  site-wide and the line reads simply *"Don reads every one."*
- **Pulse vital signs:** if `lastSeen` AND `now` haven't updated in
  72h, automatic auto-pause activation (§11.1).

### 4.5 Callback flow — async voicenote pickup (Phase 3)

v2 proposed live phone callbacks via Twilio. **Operations review
showed live calls are 40-60 min/day at scale = unsustainable.**

**v3 split:**

- **Phase 3 (prospects):** "Want me to call back?" chip opens an
  email pre-filled with a 90s voicenote slot + pickup-time. Don
  records back asynchronously. No live phone burden.
- **Phase 5+ (Care-Plan clients only):** live callback with curated
  weekly slots (Sun 6-8pm, Tue 8-10am — Don's actual free time).
  **Twilio masking number** so Don's real number is never exposed
  to the operator. Operator's number salted+hashed in KV; raw
  purged at +7d.

## 5. Voice and copy (v3 — María-tested)

### 5.1 Honest-async UI vocabulary

| Old | New |
|---|---|
| "Sent it. Don has the note." | Branched by `data-tod` (kept from v2): weekday 9-7 → *"Sent. Don will read between rushes today."*; weekend or late → *"Sent. Filed for Monday morning's read."* — wait, "Filed for" failed plain-English. **Replace with:** *"Sent. Don will read it Monday morning."* |
| "Online / Offline / Away" | Three calendar states from `window:now`: *"Don is around"* (lastSeen <90m), *"Don is between shifts"* (90m–4h), *"Don is in DC tonight"* (fuzz default — never exposes restaurant name without precise mode). |
| "Slow down a moment — wait 60 seconds" | *"Too many notes coming in right now. Try again in a minute, or email don@muntin.digital and I'll add yours by hand."* |
| Day-break separator | Keep `— Friday, May 9 —`. When gap >3 days, prepend *"— After a quiet stretch —"*. |
| "Don is composing" presence | **CUT entirely** in v3 (see §11.5). |

### 5.2 Multimodal copy (María-tested)

| Element | EN | ES |
|---|---|---|
| Voice memo affordance | *"Send a voice note (60 sec)"* | *"Manda una nota de voz (60 seg)"* |
| Recording state | *"Listening. Tap to stop."* | *"Escuchando. Toca para parar."* |
| Length-cap warning at 50s | *"Ten seconds left — wrap it up."* | *"Diez segundos — termina."* |
| Voice privacy disclosure | *"I keep your voice note only until I write back. No outside company listens to it. No AI is taught from it."* | *"Guardo tu nota de voz solo hasta que te respondo. Ninguna empresa de afuera la escucha. Ninguna IA aprende de ella."* |
| Photo affordance | *"Add a photo of your place or your menu"* | *"Añade una foto de tu local o tu menú"* |
| Photo loading | *"Sending the photo…"* | *"Enviando la foto…"* |
| Alt-text capture | *"Describe the photo (helpful for screen readers — and for me)"* | *"Describe la foto (ayuda a lectores de pantalla — y a mí)"* |
| Voice memo default length | **60 seconds** (was 90s). Extend to 90 on demand. | |
| Mic blocked | *"Your phone won't let me use the mic. No problem — type your note, or email don@muntin.digital."* | *"Tu teléfono no me deja usar el micrófono. No hay problema — escribe tu nota, o envía un correo a don@muntin.digital."* |
| Voice memo nudge (idle typist 15s focus + 0 chars) | *"When typing feels like work, the mic is here. I'd rather hear your voice anyway. — D"* | *"Cuando escribir cuesta, el micrófono está aquí. Mejor te oigo. — D"* |

### 5.3 Empty thread state

The line is **promoted from inside the placeholder to a persistent
above-textarea welcome:** *"Whatever you'd type to a friend who knows
this stuff — that's enough."* / *"Lo que le escribirías a un amigo
que sabe de esto — con eso basta."*

### 5.4 Sign-in / claim copy (María-tested)

| Old | New EN | New ES |
|---|---|---|
| "Magic link" | *"I'll email you a sign-in link — just click it."* | *"Te envío un enlace por correo — solo dale clic."* |
| "Anonymous" (anywhere user-facing) | *"You can write without an account."* | *"Puedes escribir sin tener cuenta."* |
| "We found a previous thread on this device — link it to your account?" | *"We found an earlier conversation on this device. Connect it to your account?"* | *"Encontramos una conversación anterior en este aparato. ¿La conectamos con tu cuenta?"* |

### 5.5 Escape hatches

> EN: *"Prefer to talk? Book a 20-minute call. Prefer email? Write to don@muntin.digital. Prefer Instagram? Send me a message there."*
>
> ES: *"¿Prefieres hablar? Reserva una llamada de 20 minutos. ¿Prefieres correo? Escribe a don@muntin.digital. ¿Prefieres Instagram? Mándame un mensaje allá."*

Plain-English review removed "DM" jargon and replaced "second pair of
eyes" idiom.

### 5.6 Anti-chatbot design rules (v3 — 11 rules)

1. No emoji in Window UI.
2. No exclamation marks except in operator quotes.
3. Hairlines, not cards.
4. Never use "live" without specifying the source.
5. No bottom-up entrance animations. Messages enter via opacity + 4-6px
   translate **down**.
6. Date-stamp messages older than yesterday, not relative-time alone.
7. No floating bubble bottom-right anywhere on the site.
8. Operator-named, not "support" / "we" / "our team."
9. No greeter on arrival. First-paint is silent until operator types.
10. Calendar before clock. "Tomorrow morning" beats "in 14 hours."
11. **NEW — Panes have names, not numbers.** `.sash--top`, `.sash--bottom`,
    `.sidelight`, `.sill`, `.muntin`. Carpenter words; lexicon over
    abstraction.

## 6. Accessibility, i18n, literacy

### 6.1 The persona lens

Six-card lens carried from v2. Validated against María (plain-English
review's persona for fluent-spoken / hesitant-written ELL operator).

### 6.2 Cognitive-load target

**≤4 user actions on a first-time send, ≤3 on returning sends.**

- Voice path (first time): tap-hold mic → grant permission → release +
  tap send → confirmation. 4 actions.
- Voice path (returning): 3 actions.
- Text path: type a line → submit → confirmation. 3 actions.
- Chip path: tap chip → fill → submit → confirmation. 4 actions.
- Thumb-only path (§3.8): tap chip → tap photo + select → submit →
  confirmation. 4 actions, no typing, no mic permission.

### 6.3 Voice as literacy

- 60s default; extend to 90s on demand (operations review).
- **Idle-typist nudge fires at 15s of focus + 0 characters typed**
  (halfway between too-aggressive 5s and too-patient 30s — long enough
  not to interrupt mid-thought for slower typists, short enough to
  reach the truly stuck operator before they give up). Polite
  `aria-live="polite"` line on a sibling element, not a placeholder
  swap. Hides on first character or on mic engagement.
- Inline editable transcript before send: *"Here's what I heard. Fix
  anything before sending — or send as-is."* / *"Esto es lo que
  escuché. Corrige lo que quieras antes de enviar — o envíalo tal cual."*
- Transcript displayed inline in thread by default (WCAG 1.2.1).
- Whisper auto-detects language; transcript renders in spoken language.
- Per-message delete-transcript affordance (adversarial review).

### 6.4 Photo accessibility

- Alt-text capture shown by default. Empty alt → server stores `"[image]"`.
- Drag-drop is augmentation. The path is always a `<button>`.
- Progress announcements via `aria-live="polite"`.
- **Server-side EXIF strip** (don't trust client) — see §2.8.

### 6.5 Spanish-first posture

- **No redirect.** Honor the existing "deliberately do NOT redirect"
  contract (src/worker.js:512-515).
- **Banner copy upgrade — welcoming, not informational:**
  *"Si prefieres escribir en español, escribe nomás — Don lee y responde
  en los dos idiomas. Todo el sitio también."*
  (was: *"Tenemos una versión completa."*)
- i18n parity audit checklist (CI): every chip, error, voice/photo
  string ships in EN+ES same PR.

### 6.6 Late-night-operator path

`<body data-tod>` toggled by the worker.

- `late` / `weekend`: reassurance line softens —
  *"I'll see this in the morning. No rush — I read every one."*
- default: the canonical reply line.

### 6.7 Submit button

EN: **"Send the note"** / ES: **"Enviar a Don"**.

### 6.8 WCAG 2.2 AA matrix

Same as v2. Test plan: axe-core CI on `/window/` and `/es/window/`
from Phase 2 onward.

## 7. Phasing (v3 — minimum viable cut)

Per operations review, v3 ships in 3 active phases (plus Phase 0 + 5+
deferred).

| Phase | Scope | Flag | Risk |
|---|---|---|---|
| **0 (week 0)** | Enable cron trigger; uncomment `triggers.crons` in `wrangler.jsonc:305-307`; confirm budget contracts hold under `*/5` cadence; deploy + observe one cycle. **Also:** measure /window/ baseline send-rate for 14 days before shipping anything (per §9.6). | None | Low. Prerequisite. |
| **1a (week 1)** | Anon plumbing: cookie + new KV prefix + `handleWindowAppend` accepts no-session + magic-link token shape (32-byte, base64url, 10-min TTL, anonId-bound) + DMARC/SPF/DKIM posture + Resend quota partition. | `WINDOW_ANON_ENABLED` | Medium. Auth is load-bearing. |
| **1b (week 2)** | Reply-time canon edits in `_includes/footer.html:66` + `window/index.html:88,166` + ES mirrors + CI guard + sign-in CTA rewrite at `window/index.html:182-184` + `/sign-in/?claim=&t=` claim branch + Cloudflare threat-score gate + PII pre-write gate (CC/SSN/password regex) + crisis Tier-1 + Tier-2 keyword allowlist (server-side scan only, admin red/yellow bar; SMS dispatch deferred to Phase 2). | `WINDOW_ANON_ENABLED` | Medium. Polish on top of 1a. |
| **2 (week 3-4)** | Composer redesign (named panes, corrected geometry at 50% + 35% transom, hostess line above textarea, six chips with empathy promoted, "Don sometimes says no" tell, static placeholder, mic with keyboard-aware reposition, thumb-only `MIN_MSG_LENGTH=0` override, success state with artifact + contextual link, no email-ask, crisis allowlist UI line debounced 600ms) + footer-pulse propagation + tool-result + sheets handoff aside + axe-core CI + measurement (custom Plausible events) + textContent rendering audit (lint rule + grep CI) + Twilio SMS dispatch for crisis Tier-1 + email-bounce webhook (Resend → KV → admin flag). | None (template change) | Medium. Visible UI shift + Twilio vendor onboarding. |
| **3 (week 5-6)** | Multimodal: photo first (server+client EXIF strip, default-blur admin), voice second (60s default, BIPA 30d retention, delete-transcript affordance, behind flag pending legal sign-off), async-voicenote-pickup-time as the callback shim. | `WINDOW_PHOTO_ENABLED`, `WINDOW_VOICE_ENABLED` | Medium. New R2 binding. Workers AI quota. |
| **4 (deferred — month 2+)** | `window:now` widget on `/window/` ONLY, three-tier privacy (fuzz default, precise blackout 21:00-06:00). Skip /about/ + homepage. | `WINDOW_NOW_ENABLED` | Low. Additive. |
| **5+ (deferred — when volume/data justifies)** | Live callbacks for Care-Plan clients only with Twilio masking + curated slots. Glossary asides, KnitRail nudges, in-article asides, /about/ presence, homepage muntin strip. Site-wide nav + sticky bar pulse. | Various | Defer until Phase 1-3 conversion data confirms ROI. |

Existing `WINDOW_ENABLED` (src/worker.js:5847-5849) remains the master kill.

## 8. Operational backstops (NEW — operations review)

These are non-negotiable. The plan demands them or it overburdens Don.

### 8.1 Auto-pause vital-signs check (cron)

Three tiers, automatic, no manual intervention:

- `lastAdminLogin > 72h` AND no `now` widget update AND no admin
  replies → site-wide half-state copy: *"Don is on the floor this
  week — slower than usual. I'll get to your note within 2 business
  days, sometimes faster."*
- `unrepliedThreadCount > 30` → same half-state + admin SMS alert.
- `unrepliedThreadCount > 75` → composer disables with copy:
  *"Don is buried — try again Monday, or email don@muntin.digital
  for emergencies."* + email-direct lane.

Recoverable via admin dashboard toggle. Cron runs at every tick (§2.5).

### 8.2 Queue-depth daily cap

`MAX_NEW_THREADS_PER_DAY = 25` site-wide. Beyond cap, composer renders
half-success state: *"I've got a stack today. Your note is filed for
tomorrow morning."* / *"Tengo una pila hoy. Tu nota queda para mañana."*
Mathematical bound on Don's day.

### 8.3 Templates library + AI-draft path (admin)

Saved-snippets feature in admin reply UI keyed by topic (audit referrals,
Care-Plan onboarding, Spanish replies, "this is outside what I do"
turn-down). AI-draft-then-Don-reviews path framed in admin only
(operator-facing copy reads as Don's reply, no chatbot smell). The
AI is internal infrastructure; the operator never knows it touched
their thread.

**Rule:** Don edits every AI draft before send. No auto-reply ever.

### 8.4 Client-vs-prospect queue separation

Tag threads `client | prospect | cold` in the admin queue. Client
threads get visible priority + 12h SLA flag (vs 36h for prospect).
Color-coded entries.

### 8.5 Email-out-of-band as load-shedding lane

Promote `don@muntin.digital` in escape hatches (§5.5) with note:
*"If this is a Care-Plan emergency, email is faster than the Window."*
(For Care-Plan clients only; not surfaced for prospects to avoid
unauthenticated flood.)

### 8.6 Voice-memo per-anon caps

- Max voice memos per anon per day: 5.
- Max voice minutes per anon per day: 5.
- Max attachments per anon lifetime: 12 (3/day × 4 days enrollment grace).
  After cap, attachments require sign-in.

## 9. Conversion mechanics (NEW — conversion review)

The wins that ship in v3 because they're zero-Don-time:

### 9.1 Inline URL preview (Phase 2)

When the operator pastes/types a URL into the optional context field,
fire a lightweight check (HTTP, mobile-friendly, last-modified, hero
image size). Surface ONE finding inline above the textarea:

> *"Quick scan: your hero image is 4.2 MB. That's the first thing I'd
> fix."* / *"Vistazo rápido: tu imagen principal pesa 4.2 MB. Eso es
> lo primero que arreglaría."*

**Reciprocity at the moment of decision.** Converts cold visitors into
warm ones in a single round-trip. Lift estimate: +25-40% sends among
URL-providers.

Implementation: client-side fetch (no Worker labor), result inserted
into composer. No data persists; finding is ephemeral. Client-side
only — no Don time, no KV writes.

### 9.2 Populated fieldnotes rail (Phase 2 — ship full, not empty)

`MUNTIN_FIELDNOTES_ENABLED` defaults ON in production with **3 hand-
curated, Don-authored, redacted real notes** seeded in
`data/fieldnotes-sample.json`. Empty rail = missed conversion.

### 9.3 Specificity ladder in presence line (Phase 2)

The `/now/` presence line, when active, can include rotating real-data
social proof from the admin queue (server-rendered, no PII):

> *"3 restaurants wrote in this week. The last reply went out 14 minutes
> ago."*

Derived from `iterateAdminQueue()`; no new instrumentation.

### 9.4 Newsletter checkbox in success state (Phase 2)

A single-checkbox below the success state (NOT replacing the artifact):

> *"Also send me Don's notes (~2/month)"* — **unchecked by default**.

The footer newsletter pitch already promises "four notes a quarter, no
funnels"; a pre-checked box would contradict that voice and create
CAN-SPAM / CASL / GDPR exposure. Opt-in keeps the brand posture honest
and gives compliant capture across all geos at the cost of ~30%
capture-rate vs. pre-checked. The trade is correct.

Captures the cohort of /window/ visitors who write but won't pay this
quarter. Checkbox state submits with the message.

### 9.5 Pricing-grounding sentence above chips

> *"These are the rooms I work in — I'll tell you which fits when I
> see yours."* / *"Estos son los locales con los que trabajo — te
> digo cuál encaja cuando vea el tuyo."*

Stone-italic line above the chip row. Converts the price-shocked
visitor instead of bouncing them.

### 9.6 Measurement plan

Phase 0 prerequisite: **measure baseline send-rate for 14 days** before
shipping anything. Today this number is unknown.

Plausible custom events (additive to v2's set):

- `window-send-anon`, `window-send-identified`
- `window-attach-photo`, `window-attach-voice`
- `window-callback-request` (Phase 5+)
- `window-magic-link-claim`, `window-magic-link-claim-rejected`
- `window-day-cap`, `window-rate-limit`
- `window-aside-shown`, `window-aside-clicked`
- `window-now-edit`
- **NEW:** `window-newsletter-optin`, `window-send-followup`,
  `window-url-preview-shown`, `window-url-preview-converted`,
  `window-fieldnotes-peek-opened`, `window-chip-clicked`
  (with `data-chip-id`), `window-paste-detected`,
  `window-back-to-composer-from-success`,
  `window-crisis-flag-tier1`, `window-crisis-flag-tier2`

North-star: sends per 100 pageviews on `/window/` + window-affordance
entries. Cohort: 14d rolling, segmented by entry path (homepage / blog
/ tool-result / window-direct / sticky-bar). Sticky-bar audit-clicks
must be cohort-separated (5-10× higher intent).

## 10. User decisions (post-review)

Carried from v2. All four user-confirmed.

| Question | Decision |
|---|---|
| Voice biometric storage | Ship voice in Phase 3 with 30-day R2 retention + privacy disclosure + delete-transcript affordance + per-anon caps. `WINDOW_VOICE_ENABLED` off until written legal sign-off. |
| Spanish-first on /window/ | No redirect. Banner copy upgrade only (now also welcoming, not informational). |
| Rotating placeholder vs Rule 9 | Static line. Rule 9 holds. Hostess line above textarea carries the welcome. |
| `/now/` widget cadence | Weekly Mondays + after notable shifts. 14-day staleness threshold. **NEW:** three-tier privacy with fuzz default + precise blackout 21:00-06:00. |

## 11. Failure-mode coverage (v3)

### 11.1 Vacation half-state — auto-triggered

`window:now.shift === 'away'` AND `now - lastSeen > 7d` (manual or
auto-triggered per §8.1):

- Calendar-honest sentence: *"Don is back the week of [returnDate] —
  write now and I'll thread it on return."*
- Success-state line softens: *"Saved for the week of [returnDate].
  No rush."* (replaces v2's "Filed for" — María-tested.)
- Pulse goes still, grey ring instead of teal dot. Site-wide.

### 11.2 Tab-close / double-send race

On `/window/` boot, the client always polls `/api/window/thread`
before showing the empty composer. Existing anon thread → render
existing thread; never spawn a fresh duplicate from a second tab.
60s back-pressure catches duplicate-send attempts.

### 11.3 Resend deliverability

Quota partition (§2.2): 30 reserved for replies, 30-min anon-confirm
threshold, 10-min magic-link threshold. Page-level success state is
primary feedback. Email-bounce webhook (§2.6) flags threads with
bounced emails for manual handling.

### 11.4 Pulse staleness circuit-breaker

If `window:now.updatedAt > 14d`, pulse hides site-wide; left-pane
presence reads simply *"Don reads every one"* without last-seen
qualifier. Better quietly absent than visibly stale.

### 11.5 "Don is composing" — CUT in v3

Three reviews independently called for the cut: muntin (typing-dot
in clothes), operations (admin instrumentation overhead), adversarial
(spoofable presence). The pulse + read-receipt + sash-top status
already cover visible-Don.

### 11.6 Crisis-message handling (NEW — backend for §3.12)

**Triage signal, not diagnosis.** Two scans run on every body change
+ on send: (1) client-side debounced scan that drives the §3.12 UI
reveal, (2) server-side scan on send that drives the SMS + admin flag.
Narrow allowlists. No logging of the match content (only the tier).

- **Tier 1** (urgent surface): `suicide`, `kill myself`, `end it`,
  `can't go on`, `hurt myself`, `suicidio`, `quitarme la vida`,
  `acabar con todo`. Tier-1 hits at send time trigger an immediate SMS
  to Don's phone (Twilio, separate from Resend) + admin queue red bar.
  **Not** an automated reply to the operator (false positives would be
  cruel). The composer-side referral line (§3.12) does the operator-
  facing work; the SMS does the Don-facing work.
  - **Routing:** Don's real cell number, set via Cloudflare secret
    `WINDOW_CRISIS_SMS_TO` (`wrangler secret put WINDOW_CRISIS_SMS_TO`).
    The number never appears in source-controlled files. If exposure
    becomes a concern at higher volume, swap the secret value to a
    Twilio masking number — no code change needed.
  - **Twilio account ID + auth token** stored as
    `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` secrets. The Twilio
    SMS-from number stored as `TWILIO_FROM` secret.
- **Tier 2** (welfare check): `crisis`, `breakdown`, `evicted`,
  `closing tomorrow`, `bankruptcy`, `domestic`, `quiebra`. Admin queue
  yellow bar; no SMS, no operator-side UI change.
- **Don's reply guidance** (admin templates §8.3): distress-flagged
  threads get a draft template — acknowledges first, business
  second, never reverse.
- **No 988 widget.** No banner. No "we care about wellness."
  Appears only when the words appear. Quiet competence. (See §3.12
  for the operator-facing surface.)
- **Liability:** referral availability documents reasonable care.
  Cap Tier-1 SMS at 3/hour to prevent SMS-DoS; subsequent matches
  go to admin red-bar only.

### 11.7 Family-iPad shared device

Per-thread "Forget this device" button visible whenever cookie age
> 24h with no recent send. Tap → cookie cleared, thread orphaned but
recoverable via magic link.

### 11.8 Fieldnotes moderation pipeline

`MUNTIN_FIELDNOTES_ENABLED` ON in production with 3 seeded notes (§9.2).
Future visitor-submitted fieldnotes: Don manually approves each from
admin queue. Server-side redaction with explicit allowlist (no
auto-publish).

### 11.9 Don's safety

- `/now/` defaults to `fuzz` mode (§4.4); precise mode blackout 21:00-06:00.
- Twilio masking number for callback flow (§4.5).
- Single keyword "private" in admin shift field flips widget to
  private mode (hides line entirely).

## 12. Outgoing-email muntin posture (NEW — muntin-depth review)

When Don replies to an anon thread, the email itself wears the muntin:

- HTML email template at `_includes/email/window-reply.html`.
- Top: a 1px hairline + dated "From the desk · Tuesday, May 9" eyebrow.
- Body: Don's reply text, plain.
- Bottom: small footer link *"Sign in to keep this thread on your other
  devices."* + the Authentication-Results warning preview (§2.2).
- Same Fraunces+Inter typography (web-safe fallbacks: Georgia + Helvetica).
- Plain-text alternative for accessibility / clients that strip HTML.

The email IS the window when it lands in the operator's inbox.

## 13. The deepest muntin move (carpenter-vocab admin)

Admin metrics page (`/admin/window/metrics`) renames its surfaces in
carpenter vocab:

- "open threads" → **open sashes**
- "stale" → **fogged**
- "anon-pending-claim" → **unclaimed lights**
- "attachment count" → **packages on the sill**
- "oldest unanswered" → **oldest letter**

Don's lexicon for thinking about his own admin work matches the
brand he's selling. Lexicon over abstraction.
