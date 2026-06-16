## Domain X — Trust, Privacy & Security

*Positioning Council batch, specialists 69–75. Strategy only — nothing proposed here ships without passing `scripts/check-all.mjs` (~113 checks) and the honesty gate. Every external figure is dated + sourced or labeled "analyst assessment." Repo facts cite specific surfaces. Today: 2026-06-16.*

**The domain's asymmetric thesis (load-bearing for all seven briefs).** A platform funded by surveillance or rent — Google, Yelp, Toast, DoorDash — structurally *cannot* promise "we don't track you, your numbers never leave your laptop, we take no per-order rake," because that promise is adverse to its revenue. Muntin can make the promise *and prove it in the visitor's own browser*. Trust-as-architecture — provable, testable, falsifiable claims rather than asserted values — is the deepest moat a one-person shop holds against giants, because the moat is their business model, not their budget. Honesty is not a tone here; it is the positioning.

**Cross-cutting audit finding (referenced by briefs 69, 71, 73).** The trust spine is real and unusually deep for a one-person site — `/never/`, `/receipts/`, `/methods/`, `/security/`, `.well-known/security.txt`, `_headers`, plus the `check-no-third-party-plausible.mjs` CI guard — but it carries two coherence drags: (1) **stale services-era language** survives on the spine (`/never/` #5 "work I can't ship in the quoted window" + `#free-forever`'s "six polishes and one drop-in per week"; `/receipts/` "Two builds at a time," "Lead-to-call rate," "3 new productized offer pages at services/audit…"). This is not a fabrication-gate hit but it muddies the architecture story. (2) **The proofs are scattered across five URLs with no single canonical "Trust" index** a visitor or AI engine can land on. Several briefs converge on consolidating the spine into one provable surface.

---

### 69 · Trust-Architecture Lead

**Aspect & why it decides success.** For a one-person studio competing against funded incumbents, *trust is the entire product wrapper* — an operator hands over P&L-adjacent numbers only to a party they believe won't monetize them. The asymmetric advantage is that Muntin's trust claims are **architecturally testable**, not asserted; the job is to make that the site's defining noun, the way "infrastructure" is Stripe's.

**Current-state audit — score 8/10.** Among the strongest assets on the site. `/never/` ships five promises-by-absence (no lock-in, no data resale, no hidden pricing, no remarketing pixel on the library, no work outside the quoted window) with a changelog commitment if any breaks (`never/index.html` lines 430–456). `/receipts/` publishes a "What we don't track" block and ~60-event bounded registry, "updated weekly," last 2026-05-01 (`receipts/index.html` lines 458–481). `/security/` ships nine verifiable claims + a five-test self-audit + `integrity.txt` SHA-256 (lines 554–756). `.well-known/security.txt` is RFC 9116-valid (Expires 2027-05-01). The gap: these live as **four sibling pages with no parent "Trust" hub**, the footer "Trust" column (`security/index.html` lines 840–849) is the closest thing, and the spine carries stale services language (cross-cutting finding).

**Benchmark gap.** Stripe runs a public real-time status page (status.stripe.com) and a structured docs-grade trust center; Cloudflare publishes a system-status page and a public transparency report (analyst assessment, sources: status.stripe.com, cloudflarestatus.com, accessed 2026-06-16). DuckDuckGo's "we don't track you" is a single, repeated, falsifiable line (duckduckgo.com/privacy, accessed 2026-06-16). Muntin **leads** all three on *operator-runnable verification* (the five-test audit is unusual) and trails them only on *consolidation*: there is no single muntin.digital/trust front door, and no machine-readable status object.

**The Extend-Past move.** Build **`/trust/` as the canonical hub** that frames the spine as one architecture — "promises (`/never/`), proofs (`/security/`), public diary (`/receipts/`), sourcing (`/methods/`)" — and add a tiny self-hosted **status/uptime line** the studio can actually keep ("forms operational; last deploy hashed at /security/integrity.txt"). The giants can copy a trust page; they cannot copy *not having a rake to hide*, so the hub leads with the structural conflict, not feature parity.

**Actions (Effort × Impact).**
1. Ship `/trust/` hub (+ `/es/trust/` for locale parity) that links and summarizes the four spine pages; final-forever slug, so name it once and carefully. **Effort M × Impact 5 (ASYMMETRIC).**
2. Scrub services-era language from the spine (`/never/` #5 + `#free-forever`; `/receipts/` "two builds," "lead-to-call," "services/audit" bullets) so the architecture reads as a product company. **Effort M × Impact 4.**
3. Add a minimal, honest status indicator (static or `/api/health`-backed) — only claims the studio can hold, no fabricated 99.9% SLA. **Effort M × Impact 3.**
4. Stamp `/trust/` into the footer "Trust" column and the homepage trust strip as the single entry point. **Effort S × Impact 3.**
5. Add JSON-LD `WebPage` + `BreadcrumbList` to `/trust/` mirroring the `/never/` and `/receipts/` pattern. **Effort S × Impact 2.**

**Risks & honesty-gate notes.** A status page is a *promise generator* — only publish uptime/response claims that are measured (the "reply within 4 hours Mon–Fri" line is already on `/receipts/` and measurable in Plausible; do not invent a numeric SLA). `/trust/` must add an ES mirror or it fails `check-locale-parity.mjs` / `check-hreflang-orphans.mjs`. No new fabrication-gate exposure if it summarizes existing sourced claims.

**One proof metric.** Share of trust-spine sessions that pass through a single `/trust/` hub (vs. scattered direct hits to `/never//security//receipts/`), measured via the existing bounded page-arrival events on `/receipts/`.

---

### 70 · Privacy Engineer

**Aspect & why it decides success.** Privacy here is not a policy — it is **the product's core mechanism**: client-side tools that make no network call, so the operator's numbers are *un-leakable by construction*. This is the single most defensible asymmetry against any ad- or data-funded competitor, and it decides whether an operator types a real food-cost number into a tool at all.

**Current-state audit — score 9/10.** The strongest engineered asset in the domain. Tools run client-side; `check-tool-no-fetch.mjs` and `check-sheet-no-fetch.mjs` fail CI if a tool or sheet fragment contacts any URL (`data/security-claims.json` build-invariants; `security/index.html` claim 11). Plausible is self-hosted at `/assets/p.js`, proxied through `/api/event`, so the browser makes **zero third-party analytics requests** — enforced by `check-no-third-party-plausible.mjs` (fail-CI). The `_headers` CSP is `default-src 'self'` with a tight allowlist; `Permissions-Policy` disables camera/mic/geo and `interest-cohort=()` opts out of FLoC/Topics. Event properties are bounded enums ("a $25 ticket becomes 25-39"), never raw values. Near-perfect; the only gap is that the *no-fetch invariant is invisible to a non-technical visitor* until they open DevTools, and the audit-tool exemptions (`security-claims-exemptions.json`) are honest but not surfaced where a skeptic would look.

**Benchmark gap.** Apple's "what happens on your iPhone stays on your iPhone" frames on-device processing as the privacy guarantee (apple.com/privacy, accessed 2026-06-16); Proton ships open-source clients + published audits so claims are inspectable (proton.me, accessed 2026-06-16). Muntin **matches Apple's "on your device" architecture** for tools and **exceeds typical SaaS** by enforcing it in CI — but trails Proton on *legibility of the proof* (Proton's audits are linked front-and-center). Muntin's proof requires a DevTools step.

**The Extend-Past move.** Make the no-fetch invariant **demonstrable without DevTools**: ship a tiny, client-side **"network monitor" widget** on the `/security/` page (a `PerformanceObserver`/`fetch`-wrapper readout that shows "0 network requests fired while you used this tool" live), turning the inspect-this step into a visible, self-running proof. Apple says "on your device"; Muntin can *show the empty network tab to a non-engineer*.

**Actions (Effort × Impact).**
1. Build a client-side live network-activity readout on `/security/` (and optionally a tool page) — same-origin only, zero data leaves the page; itself an exhibit of the promise. **Effort M × Impact 5 (ASYMMETRIC).**
2. Surface the audit-tool exemptions honestly on `/security/` — a short "where a tool *does* fetch, and why" block sourced from `security-claims-exemptions.json` (audit tools take a URL the operator typed deliberately). **Effort S × Impact 4.**
3. Add a one-line "privacy by construction, enforced in CI" claim to the tool data-promise rail, linking the actual guard scripts by name. **Effort S × Impact 3.**
4. Document `interest-cohort=()` / no-Topics-API as an explicit promise on `/security/` or `/never/` — a falsifiable, dated absence most sites can't claim. **Effort S × Impact 3.**

**Risks & honesty-gate notes.** The live monitor must be *genuinely* client-side or it indicts the whole thesis; ship it under the existing CSP (no new third-party origin). Exemption copy must not overclaim — keep the "audit tools fetch a URL you typed; calculators never fetch your financial inputs" distinction exact (it's already the documented `security-claims-exemptions.json` rationale). Any new tool/sheet still routes through the no-fetch CI guards.

**One proof metric.** Tool engagement rate (first-result ÷ tool pageviews — already KPI #2 on `/receipts/`) on pages carrying the live monitor vs. those without; the hypothesis is that *visible* privacy lifts willingness to enter real numbers.

---

### 71 · Security Lead

**Aspect & why it decides success.** A tools site that asks operators to type business numbers must carry a **bank-grade transport and form posture** or the privacy promise is hollow. For a static Cloudflare site the bar is achievable solo, and a verifiably hard posture is itself a trust signal an under-resourced competitor skips.

**Current-state audit — score 8/10.** Excellent baseline. `_headers` ships HSTS with `includeSubDomains; preload`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`, and a scoped CSP. Forms are gated by Cloudflare Turnstile in Managed mode with a silent-OK honeypot fallback (`docs/turnstile-wiring.md`; the widget ships on the newsletter form, `security/index.html` line 877). `integrity.txt` publishes the deploy bundle's SHA-256. `.well-known/security.txt` gives a real disclosure channel. Two honest weaknesses: (1) the global CSP carries `'unsafe-inline'` in `script-src` (documented: required for inline JSON-LD + the Plausible init shim) and `'wasm-unsafe-eval'` site-wide (documented retraction after the invoice-decoder path-scoping broke, `_headers` lines 267–309) — both are reasoned trade-offs, but they're the softest spots in an otherwise tight policy; (2) there is **no public CSP/header report endpoint** so violations are invisible.

**Benchmark gap.** Stripe and Cloudflare publish status pages and run nonce/hash-based CSPs without blanket `'unsafe-inline'` (analyst assessment; status.stripe.com, cloudflarestatus.com, accessed 2026-06-16). Muntin's transport posture (HSTS preload, DENY, nosniff) is **at parity with bank-grade static sites**; it trails the giants only on CSP strictness (the `'unsafe-inline'` script allowance) and on having any violation telemetry.

**The Extend-Past move.** Tighten the script CSP toward **hash- or nonce-based inline allowance** (removing `'unsafe-inline'` from `script-src`), and add a `Content-Security-Policy-Report-Only` shadow policy + `report-to`/`report-uri` so the studio *sees* violations before enforcing — then publish "no `'unsafe-inline'` scripts" as a new `/security/` claim a competitor can verify in the response headers. The asymmetry: Muntin can show its CSP header is genuinely strict; most restaurant-SaaS marketing sites ship Tag Manager and can't.

**Actions (Effort × Impact).**
1. Pilot a `Report-Only` CSP that drops `script-src 'unsafe-inline'` (move inline JSON-LD + Plausible shim to hashes/nonce); measure violations via a report endpoint before enforcing. **Effort L × Impact 4.**
2. Add a 10th `/security/` claim — "strict CSP, no inline-script execution" — only after #1 enforces, with a `curl -I` verification step. **Effort S × Impact 3 (ASYMMETRIC; gated on #1).**
3. Verify the Turnstile site key is bound in production and the widget ships on **all four** documented endpoints (intake, sign-in, newsletter, checklist), not just the newsletter (per `docs/turnstile-wiring.md` §3). **Effort S × Impact 3.**
4. Add a Subresource-Integrity / pinned-version note for the one external script (Turnstile `api.js`) and confirm `connect-src` stays minimal. **Effort S × Impact 2.**
5. Bump `.well-known/security.txt` `Expires` review into the changelog cadence so it never lapses (currently 2027-05-01). **Effort S × Impact 1.**

**Risks & honesty-gate notes.** Do **not** publish a "strict CSP" claim until the header actually enforces it — the five-test ethos forbids a claim that fails its own inspect-this. CSP tightening risks breaking inline handlers (theme toggle, nav auth shim); use Report-Only first. Turnstile keys are owner-side secrets — the brief recommends verification, not committing keys. No fabricated penetration-test or "SOC 2" badge — receipts-based only.

**One proof metric.** Count of CSP violations in the Report-Only window trending to zero (proving the strict policy is safe to enforce), then the response-header `curl -I` check passing in CI.

---

### 72 · Data-Promise / Compliance Steward

**Aspect & why it decides success.** Promises an operator can verify beat policies they must trust. The asymmetry is **technically enforced compliance** — GDPR/CCPA data-minimization isn't a clause here, it's the architecture (no inputs collected = nothing to subject-access). Getting the legal rail and the engineering rail to say the *same* thing is what makes the promise un-fakeable.

**Current-state audit — score 8/10.** Strong and unusually coherent. `privacy.html` ships data-subject rights (access within 30 days, correction in 5 business days, self-serve deletion at `/account/`, marketing opt-out), names the GDPR/CCPA/PIPA frame, and commits to 72-hour breach notice + the 45-day Maryland PIPA filing window (lines 452–460). Vendors are enumerated with data-minimization rationale — Cloudflare, Resend, Plausible (+ Buttondown for lists) — each linked to its own policy (lines 462–467). `/receipts/` re-states the named commitments (CC BY-NC 4.0 library license, Maryland courts / no mandatory arbitration, three functional cookies). The data-promise rail (`security-claims.json#data_promise_rail_3line`) is stamped on every tool. The gap: there's **a minor vendor-list drift risk** (privacy.html names Resend for transactional email while `docs/turnstile-wiring.md` references the worker; the newsletter pitch says Buttondown in `privacy.html` but the footer form posts to `/api/subscribe`) — worth a single reconciliation pass — and **no machine-readable data-processing summary** for the AI/agent era.

**Benchmark gap.** Apple frames "on your device" so that the *absence of collection* is the compliance story (apple.com/privacy, accessed 2026-06-16); GDPR's data-minimization principle (Art. 5(1)(c)) and CCPA's right-to-know/delete (effective since 2020, CCPA/CPRA) reward exactly that posture (analyst summary of public regulation). Muntin **matches Apple's enforced-by-architecture model** and trails no one on small-studio compliance; the only headroom is *legibility* (a one-screen "your rights, the 60-second version") and machine-readability.

**The Extend-Past move.** Publish a **"Data promise, technically enforced"** one-pager that maps each legal right to its *architectural enforcement* ("Right to deletion → Workshop self-serve at /account/, effective in minutes; nothing to delete for anonymous tool use because nothing was collected"), and reconcile the vendor list to a single source of truth. Apple says on-device; Muntin can show the *clause-to-code* mapping line by line — a thing a data-broker-funded competitor cannot honestly print.

**Actions (Effort × Impact).**
1. Add a "rights → enforcement" mapping block to `/privacy.html` or `/security/` (legal clause on the left, the code/architecture that enforces it on the right). **Effort M × Impact 4 (ASYMMETRIC).**
2. Reconcile the vendor list (Resend / Buttondown / Cloudflare / Plausible) to one canonical list referenced by both `privacy.html` and `/receipts/`, so a new vendor is added in one place. **Effort S × Impact 4.**
3. Keep the 72-hour breach + 45-day PIPA commitment in sync between `privacy.html` and any `/trust/` hub (brief 69); date every change in the changelog. **Effort S × Impact 3.**
4. Confirm `/account/` deletion self-serve actually exists and matches the "effective within minutes" claim (it's `Disallow`-ed in robots.txt and noindex — verify the live behavior backs the prose). **Effort M × Impact 3.**

**Risks & honesty-gate notes.** Highest exposure is **claim-vs-reality drift**: every legal commitment (30-day access, 5-day correction, 72-hour breach, minutes-deletion) must be operationally true for a one-person studio — under-promise rather than overstate. The vendor list must be complete and current (an unnamed processor is a compliance and trust failure). Do not cite a specific GDPR/CCPA article number in visitor copy unless verified; "data-minimization" as a principle is safe, a mis-cited article is not.

**One proof metric.** Time-to-fulfillment on data-subject requests (access/deletion) measured against the published windows — the number that proves the legal promise is operationally real, logged via the Window thread that carries the request.

---

### 73 · Credibility / Social-Proof Engineer

**Aspect & why it decides success.** A one-person studio with no testimonials looks unproven *unless* it substitutes a harder currency: **receipts**. The asymmetry is that Muntin's credibility is built from verifiable artifacts (sourced claims, public counts, runnable tests, a real operator bio) rather than self-reported praise — which is both honesty-gate-safe and *more* trust-bearing to a burned operator than star ratings.

**Current-state audit — score 7/10.** Honest by design and correctly empty of fabrication: **no `AggregateRating`, no `Review` schema, no testimonials** are self-applied to Muntin's own LocalBusiness/Organization entity (verified — the only `reviewCount`/`AggregateRating` strings in the repo are the restaurant-audit tool *grading a customer's* GBP, and articles *teaching* schema). Credibility is carried instead by `/methods/` (sourcing policy, reviewed quarterly), `/receipts/` (public counts via `data/site-counts.json` sentinels), `/security/`'s five runnable tests, `data/sourced-claims.json`, and the dated, specific `/about/` operator timeline. The gap: this proof is **diffuse and not packaged as "proof"** — there is no single "Why trust a one-person studio" exhibit, and the receipts-based credibility isn't yet expressed in the kind of schema (e.g., `Claim`, `CreativeWork` citations) that AI answer engines reward.

**Benchmark gap.** Wirecutter's authority comes from *transparent methodology + named testers + disclosed conflicts* (nytimes.com/wirecutter, accessed 2026-06-16) — receipts, not stars. Stripe's credibility leans on named-customer logos with permission (analyst assessment). Muntin **matches Wirecutter's methodology-as-credibility model** (the `/methods/` + `/security/` spine is genuinely Wirecutter-grade for its size) and *correctly* declines Stripe's logo-wall (it has no permissioned client logos and must not fabricate them). Headroom is purely *packaging*.

**The Extend-Past move.** Build a **"Receipts, not reviews" credibility exhibit** that explicitly reframes the absence of testimonials as the proof: "We publish no testimonials. Here's what we publish instead — sourced claims, runnable tests, weekly counts, a real bio." It out-trusts a star rating precisely because a burned operator distrusts stars. If/when real permissioned proof exists (a named client quote with sign-off, a GitHub star count, a verifiable press mention), add it under a strict receipts-only rule.

**Actions (Effort × Impact).**
1. Ship a "Receipts, not reviews" section (on `/trust/` from brief 69, or `/methods/`) that names the substitution and links each proof artifact. **Effort S × Impact 4 (ASYMMETRIC).**
2. Add `Claim` / `ClaimReview`-adjacent or `CreativeWork`+`citation` JSON-LD to `/methods/` and `/security/` so answer engines can ingest the verifiable claims (extends the existing `/security/` `Claim[]` graph). **Effort M × Impact 4.**
3. Establish a **receipts-only intake rule** in `docs/` for any future social proof: a testimonial needs written sign-off + a `sourced-claims.json` entry before it ships; no stock logos, no invented ratings. **Effort S × Impact 3 (guardrail).**
4. Surface honest, already-true counts as proof chips (e.g., the `data/site-counts.json` sentinels: articles, tools, glossary terms) on the credibility exhibit. **Effort S × Impact 2.**

**Risks & honesty-gate notes.** This is the brief with the **highest fabrication temptation** — the antidote is the binding receipts-only rule: zero invented testimonials, logos, ratings, or "trusted by N restaurants" cohort claims (the latter is exactly the pattern `check-fabrications.mjs` blocks). Do **not** add self-applied `AggregateRating` schema (it would be unfounded and risks Google structured-data penalties). Any number on the exhibit must trace to `site-counts.json` or `sourced-claims.json`.

**One proof metric.** Conversion lift from the credibility exhibit — share of visitors who view "Receipts, not reviews" and then start a Window thread or run a tool (Window thread starts is KPI #6 on `/receipts/`).

---

### 74 · Consent / Cookie UX

**Aspect & why it decides success.** The consent experience is the *first* trust interaction on most sites and usually the most adversarial (dark-pattern banners). Muntin's asymmetry is that it has **almost nothing to consent to** — the right move is to make that absence legible and reassuring, not to bolt on theatre that would actively contradict the privacy thesis.

**Current-state audit — score 9/10.** Near-ideal and rare. `cookies.html` ships a "short version" stating three functional cookies (`md_locale`, `lang_hint_dismissed`, `md_session`), no tracking, no banner, Plausible cookieless — and explicitly argues *why* there's no banner ("Adding a banner would be theatre that hurts trust," lines 419–478). It distinguishes cookies from `md_*`/`workbench_*` localStorage, and offers three real opt-outs (use without sign-in, skip the language switcher, block cookies — site degrades gracefully). The Spanish language hint is opt-in (shown only if `navigator.languages` includes Spanish, not yet dismissed), which is itself good consent hygiene. The only gap: this excellent reasoning lives **only on `cookies.html`**; a first-time visitor never sees the "nothing to consent to" message at the moment they'd expect a banner.

**Benchmark gap.** GOV.UK's cookie pattern is the gold standard for minimal, honest, accessible consent (design-system.service.gov.uk, accessed 2026-06-16); DuckDuckGo's posture is "no cookie banner because no tracking" (duckduckgo.com, accessed 2026-06-16). Muntin is **at parity with DuckDuckGo** (genuinely nothing to consent to) and *ahead* of most sites that ship banners reflexively. The only headroom is making the absence a deliberate, visible trust beat.

**The Extend-Past move.** Turn the *non-banner* into a **one-line trust affordance** — a small, dismissible, non-blocking "No cookie banner, because nothing here tracks you. → How that works" link to `cookies.html`, shown once. It converts a missing dark pattern into an explicit promise. GOV.UK minimizes the banner; Muntin can *replace* it with a one-line brag that links to proof.

**Actions (Effort × Impact).**
1. Add a one-time, non-blocking "why there's no cookie banner" affordance (a quiet footer line or a dismiss-once note), linking `cookies.html`. **Effort S × Impact 4 (ASYMMETRIC).**
2. Keep it ES at parity and ensure it sets at most the existing `lang_hint_dismissed`-style functional flag (no new tracking cookie to remember dismissal — use the same minimal pattern). **Effort S × Impact 3.**
3. Reconcile the `md_session` description across `cookies.html` and `privacy.html` so the three-cookie list is identical wording in both. **Effort S × Impact 2.**
4. Confirm no third-party widget (Turnstile, embeds) sets a client-visible cookie that would break the "three cookies, that's the entire list" claim — Turnstile loads from `challenges.cloudflare.com`; verify it sets nothing first-party-visible on `muntin.digital`. **Effort S × Impact 3.**

**Risks & honesty-gate notes.** The "three cookies, no fourth" claim is falsifiable in DevTools — if Turnstile or any future embed sets a cookie on the apex, the claim breaks and `cookies.html` must update *first*. Do not add a consent banner "to be safe": it would contradict the documented privacy architecture and the `/never/` #4 promise. The dismissal mechanism must not itself introduce a tracking identifier.

**One proof metric.** Cookie-page → trust-spine flow (visitors who click the "how that works" affordance and land on `cookies.html`/`/security/`) — proof the absence is read as a feature, not an oversight.

---

### 75 · Reputation / Review Strategist

**Aspect & why it decides success.** Reviews are the one trust currency Muntin *doesn't yet hold* — and for a local DMV business (Silver Spring LLC), Google Business Profile reviews are decisive for local discovery and for the "is this real?" gut-check. This is **greenfield**: the asymmetry is to earn reviews honestly from real service interactions, never to manufacture them, and to turn the studio's own teaching (the published review-response playbook) into lived practice.

**Current-state audit — score 4/10.** The lowest score in the domain, by design rather than failure: there are **no published reviews and no `AggregateRating` schema** (correctly — fabricating them is the cardinal sin). But the *foundation* is unusually strong: `sameAs` on the business entity already lists Yelp and Google Maps profiles (`index.html` line 1283 ff.), the studio has published `library/google-review-response-playbook/index.html` (a full response playbook — teaching it but not yet living it), and `learn/research/dmv-restaurant-gbp-audit-2026/` shows GBP fluency. The gap is the entire *acquisition + response loop*: no documented ask-for-review moment, no response cadence, no honest seeding from real client/Window interactions.

**Benchmark gap.** Google's own guidance rewards *recency, volume, and owner responses*; Yelp explicitly penalizes solicitation and filters non-organic reviews (analyst summary of public platform policy, accessed 2026-06-16). Muntin **trails every established local competitor on review volume** (it has none visible) but is **uniquely positioned to do it cleanly** — it literally authored the response playbook and refuses fake reviews, which is exactly the posture Google/Yelp policy rewards and most small businesses violate.

**The Extend-Past move.** Operationalize an **honest review flywheel** that eats its own dog food: at the close of every genuine engagement (a completed Window thread that resolved, a shipped piece of work), a *non-incentivized* ask for an honest GBP review, paired with the published response playbook applied to every review within the studio's 4-hour reply standard. The asymmetry: Muntin can credibly say "we ask for honest reviews, never paid or filtered ones, and we respond to every one" — a claim the platforms' own policies bless and that a review-gaming competitor can't make.

**Actions (Effort × Impact).**
1. Write a one-page internal review-acquisition + response SOP in `docs/` (the honest ask: timing, wording, no incentive; the response cadence: every review, within the 4-hour standard, using the published playbook). **Effort S × Impact 4.**
2. Add a single, honest "leave an honest review" link to genuine post-engagement touchpoints (a resolved Window thread, an invoice footer) — never a pop-up, never incentivized. **Effort S × Impact 4 (ASYMMETRIC).**
3. **Defer `AggregateRating` schema until real reviews exist** — then add it sourced strictly from the live GBP count, with a `sourced-claims.json` entry; never hand-enter a rating. **Effort M × Impact 3 (gated).**
4. Apply the studio's own `google-review-response-playbook` to every received review publicly, as a living demonstration of the teaching. **Effort S × Impact 3.**
5. Keep Yelp posture policy-clean: do not solicit Yelp reviews (their policy penalizes it); let them be organic. **Effort S × Impact 2 (guardrail).**

**Risks & honesty-gate notes.** This is the **single highest fabrication-and-policy risk** in the domain. Absolute rules: no fake or incentivized reviews; no `AggregateRating` schema until a real, live rating exists and is sourced; no review-gating (asking only happy clients) — that violates platform policy and the honesty gate. Yelp solicitation is explicitly penalized — keep asks to GBP and keep them non-incentivized. Any review count that ever appears on-site must trace to the live platform, dated, in `sourced-claims.json`.

**One proof metric.** Count of organically earned GBP reviews + owner-response rate (target: 100% responded within the 4-hour standard) — the only review metric that is both honest and on-brand.

---

*End Domain X. Cross-domain dependencies are summarized in the digest returned to the council lead.*
