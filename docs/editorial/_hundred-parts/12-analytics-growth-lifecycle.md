## Domain XII — Analytics, Growth & Lifecycle

> Positioning Council batch brief. Strategy only — no live-site edits in this pass.
> Honesty gate: every number below is repo-sourced (file cited), web-sourced (source + date), or labeled *illustrative / analyst assessment*. No traffic or conversion numbers are asserted as fact — current performance baselines are **TBD until measured in Plausible**.
> Operator bio is singular (Don Goldstein, full-time FoH at Tacombi, Bethesda). Asymmetric thesis: a surveillance-funded giant grows by paid acquisition + retargeting; Muntin must compound via organic + AEO + operator word-of-mouth, measured **without** surveillance — a discipline the giant has no reason to build and no standing to claim.

---

### 82 · Growth / Acquisition Lead — channel strategy after the stall

**Aspect & why it decides success.** With no paid budget and a stalled publishing heartbeat, *every* future visitor must arrive through a compounding, owned channel: organic search, AI-search citation, the free tools, or operator referral. If the channel mix isn't deliberately re-pointed at compounding sources, the stall becomes the steady state.

**Current-state audit (score 6/10).** The acquisition surfaces exist and are unusually strong for a one-person shop: 47 articles + 13 tools + 150 glossary terms (`receipts/index.html` counts), a 7-corner diagnostic router (`data/start-here-journeys.json`), 7 library topics including a dedicated `ai-search` topic (`data/topics.json`), and a north-star KPI named *organic-search sessions/week* with `target_initial: 600 → target_q3: 1500` (`data/kpis.json`). What's missing is a *publishing cadence* and a single owned-channel scorecard — the stall named in the brief. Score reflects strong inventory, idle engine.

**Benchmark gap (Notion).** Notion turned user-generated templates + an unpaid ambassador program into "an organic, compounding force" ([Bettermode, "Notion Community Led Growth", 2024](https://bettermode.com/blog/notion-community-led-growth)). Muntin's tools + Cost Index are its template-gallery analog, but nothing yet recirculates that output into discovery.

**The Extend-Past move.** Treat the **13 tools + weekly Cost Index as the publishing heartbeat** — not the blog. A tool result and a Cost Index update are publishable, AEO-citable artifacts that need no new long-form. Re-anchor the cadence on "ship one tool improvement or one Cost Index reading per week," and let the library compound behind it.

**Actions.**
1. Define an "owned-channel mix" board on `/receipts/` (organic / AI-search / tool-direct / referral shares), all sourced from existing Plausible goals. **S × 4**
2. Re-cast the weekly heartbeat as Cost Index + one tool note (publishable without a full article). **M × 5**
3. Add AEO-targeted FAQ blocks to the 13 tool pages so each tool earns AI-Overview citation, not just rank. **M × 4** (article-graphics gate applies only to library/blog, not tool pages — confirm before shipping).
4. Stand up a quarterly "what compounded" note in `/learn/research/` tying traffic shape to publishing acts. **M × 3**

**Risks & honesty-gate notes.** Do not publish a "we grew N%" claim until Plausible has the baseline — current daily traffic is *faltering* (brief) and any growth figure today is fabrication. Cadence promises must respect the public "two builds at a time" commitment (`receipts/index.html`) — don't imply unbounded output.

**One proof metric.** Organic + AI-search sessions/week trending toward `target_initial: 600` (`data/kpis.json`), reported on `/receipts/`.

---

### 83 · Analytics Engineer — the privacy-first KPI loop

**Aspect & why it decides success.** The asymmetric thesis lives or dies here: prove a rigorous, *actionable* analytics loop on bucketed, cookieless data. If the loop is real, privacy becomes a growth advantage; if it's decorative, the giant's surveillance stack simply out-measures Muntin.

**Current-state audit (score 7/10).** Genuinely strong bones. Plausible is self-hosted (`/assets/p.js` same-origin, events POST `/api/event`) and a **fail-CI guard** forbids any third-party `plausible.io` request (`scripts/check-no-third-party-plausible.mjs`). Event naming is locked to a registry (`tools/_shared/analytics.js`, ~400+ names) by `check-analytics-vocabulary.mjs`, and prop cardinality is bounded (no raw URLs / emails / timestamps) by `check-event-prop-cardinality.mjs`. KPIs are documented and force-reviewed every 90 days (`check-kpi-doc.mjs`). **Two honest gaps drag the score:** (a) `data/kpis.json` defines **5** KPIs while `/receipts/` publishes **7** ("Library depth ratio" and "AI-search arrivals share" are public but not in the JSON) — the public page and the source of truth disagree; (b) `check-analytics-vocabulary.mjs` is still **warn-only** (`--check` documented as "Sprint 16 flips to fail-CI") — drift can land today.

**Benchmark gap (Amplitude / Mixpanel — concepts only).** Those tools offer funnel + path rigor Muntin lacks ([Webeyez, "Amplitude vs Mixpanel", 2025](https://webeyez.com/insights/guides/amplitude-vs-mixpanel-comparison-guide-2025)). But the cautionary half is the asymmetric proof: Mixpanel's **Nov 2025 breach** led OpenAI to terminate its contract ([SalesHive Mixpanel profile, 2026](https://saleshive.com/vendors/mixpanel/)). Muntin's bucketed-only posture means there is no user-level dataset to breach — a trust signal a surveillance vendor structurally cannot offer.

**The Extend-Past move.** Reconcile the KPI registry to the public list and **flip the vocabulary gate to fail-CI**, then publish the gate names themselves on `/receipts/` — "our analytics can't drift because the build won't let it." Rigor *as* the marketing.

**Actions.**
1. Reconcile `data/kpis.json` (5) with `/receipts/` (7): add the two missing KPIs to the JSON or correct the page; bump `_lastReviewed` (`check-kpi-doc.mjs` will pass it). **S × 5** [ASYMMETRIC]
2. Promote `check-analytics-vocabulary.mjs --check` to fail-CI in `check-all.mjs`; clear any stale registry entries first. **M × 4**
3. Add a one-line "verifiable in DevTools → Network" pointer beside each KPI on `/receipts/` (the no-keystroke-logging claim is already there). **S × 3** [ASYMMETRIC]
4. Document the bucketing rule (SHA256(sub‖YYYY-MM) / SHA256(IP‖UA‖YYYY-MM-DD), per `data/experiments.json` `_doc`) on `/system/` so the privacy method is auditable. **S × 3**

**Risks & honesty-gate notes.** The 5-vs-7 mismatch must be fixed *before* any "we measure ourselves rigorously" external claim — shipping the claim over a known inconsistency is the exact credibility risk the audience has been burned by. Targets in `kpis.json` are explicitly "aspirational, not promises" — keep that framing.

**One proof metric.** Zero KPI-definition drift: `data/kpis.json` count == `/receipts/` published count, both green under `check-kpi-doc.mjs`.

---

### 84 · Lifecycle / Email Lead — the Ledger-first drip

**Aspect & why it decides success.** The founding list is the only first-party lifecycle seed — the one channel Muntin owns outright, immune to algorithm shifts. An honest drip that *helps before it sells* converts the list into the warm pipeline for Muntin Ledger; a salesy drip burns the studio's hardest-won asset (trust).

**Current-state audit (score 5/10).** The capture exists and is on-brand: the `#founding` band (`index.html`, `founding-capture:start`) posts to first-party `/api/waitlist`, promises "no AI reads your numbers, no ads, no tracking," and a double-opt confirm ("check your inbox to confirm your spot"). Lifecycle events are pre-registered — `Newsletter Signup`, `Newsletter Confirmed`, `Lifecycle Email Opened`, `Lifecycle Email Click` (`tools/_shared/analytics.js`). **Real gap:** the form fires `data-event="Waitlist Signup"` (`index.html`) — a name **not in the registry** (registry has `Newsletter Signup`). Under the planned fail-CI vocabulary gate this drifts; today it's an untracked signup. No drip content is in-repo (no sequence doc). So: capture good, instrumentation inconsistent, nurture undefined.

**Benchmark gap (Morning Brew).** Brew's lifecycle is milestone-driven and near-zero marginal cost — exclusive content + community invites as rewards, with congratulate/nudge emails on a schedule ([ReferralRock, "Morning Brew Referral Program", 2024](https://referralrock.com/blog/morning-brew-referral-program/)). Muntin has the assets (tools, sheets, research notes) to build a *help-first* equivalent without discounting.

**The Extend-Past move.** A **"receipts drip"**: each email leads with one usable artifact (a sheet, a Cost Index reading, a tool walkthrough) and *defers the Ledger ask* to a single honest line at the foot — the email version of the homepage's "apply it yourself" stance (`index.html`).

**Actions.**
1. Reconcile the founding-form event to the registry — either rename the fire to `Newsletter Signup`/add `Waitlist Signup` to `analytics.js` first. **S × 5** (blocks the fail-CI flip in #83).
2. Draft a 4–5 email help-first sequence in `docs/` (artifact-led, single soft Ledger line), EN + ES for parity. **M × 4** [ASYMMETRIC]
3. Instrument open/click with the existing `Lifecycle Email Opened` / `Lifecycle Email Click` events; keep props bounded (`{ step }` enum). **S × 3**
4. Add a plain "what you'll get / what we'll never do" expectation line under the capture button. **S × 4**

**Risks & honesty-gate notes.** No fabricated list size or open-rate — baseline is TBD. "Opens this fall" (`index.html`) is a dated promise; the drip must not contradict it. Privacy: no open-pixel that sets a third-party cookie; Plausible-style first-party measurement only (consistent with `/never/`).

**One proof metric.** Founding-list confirm rate (`Newsletter Confirmed ÷ Newsletter Signup`) — baseline TBD, then a target after first 30 days.

---

### 85 · Referral / Word-of-Mouth Strategist — operator-to-operator loops

**Aspect & why it decides success.** In a tight-knit DMV operator world, a trusted peer's word outweighs any ad. Word-of-mouth is the one channel a surveillance budget can't buy and the one most native to Muntin's "operator who runs real shifts" credibility. Without an explicit loop, referrals stay accidental.

**Current-state audit (score 3/10).** Sharing primitives exist — `Share`, `Audit Shared`, `Audit Share Card Downloaded`, share-snapshot recipient banners (`tools/_shared/analytics.js`; Phase G.11 share group). Tools are no-signup and shareable, which is the right substrate. But there is **no referral mechanic, no double-sided incentive, no "invite a peer" surface** anywhere in the repo (registry + grep). Score reflects raw sharing telemetry without an intentional loop.

**Benchmark gap (Dropbox / Robinhood).** Dropbox's double-sided storage reward drove ~3900% growth in 15 months ([Prefinery case study](https://www.prefinery.com/blog/dropbox-referral-program-3900percent-growth-study/)); Robinhood proved exclusivity + clear mechanics rival cash ([Tremendous, 2025](https://www.tremendous.com/blog/10-examples-of-successful-referral-programs/)). Muntin can't (and shouldn't) pay cash — but it can offer *access* and *recognition*, the Robinhood lesson.

**The Extend-Past move.** A **"pass the tool" loop** with a non-monetary, privacy-safe reward: an operator who shares a tool result or the Cost Index earns earlier Ledger founding access (recognition, not cash) — measured by the *existing* `Share`/recipient events, no new cross-site identifier.

**Actions.**
1. Add a "send this to an operator who needs it" CTA on tool-result + Cost Index, firing the existing `Share` event (no new vocabulary). **S × 4** [ASYMMETRIC]
2. Tie a recognition reward (earlier founding access) to confirmed peer signups via first-party `/api/waitlist` referral source — bounded prop `{ ref: <bucketed-source> }`, never an email or raw URL (respects `check-event-prop-cardinality.mjs`). **M × 5** [ASYMMETRIC]
3. Seed a DMV "operators who use this" wall on a trust page (opt-in names only, fact-gated). **M × 3**

**Risks & honesty-gate notes.** **Privacy is the binding constraint:** referral attribution must be first-party + bucketed — no referral cookie that tracks across sites, no email in a prop. Any operator name shown must be opt-in and fact-checkable (no invented cohort). Reward must avoid manufactured urgency — "earlier access," not a fake countdown.

**One proof metric.** Operator-attributed founding signups/month (first-party `ref` bucket) — baseline TBD.

---

### 86 · Funnel / Attribution Analyst — tool → content → Ledger paths

**Aspect & why it decides success.** Muntin's value chain is *tool → content → founding list → Ledger*. If those hops aren't modeled, the studio can't tell which free tool actually feeds the product — and optimizes blind. Doing this *without* cross-site tracking is the discipline that proves the thesis.

**Current-state audit (score 6/10).** The funnel is unusually well-instrumented for cookieless: first-touch attribution + AI-search detection (`AI Search Landing`, `Returning Visitor`), tool micro-funnel (`Tool First Input → Tool First Result → Tool Save Intent`), `Article Scroll`, `Post-End CTA Click`, and the Ledger handoff (`Ledger Route Click`, bounded to `{ source: <feeder-slug> }` from `data/ledger-cta.json`) — all in `tools/_shared/analytics.js`. KPIs already encode two funnel ratios: `tool-engagement-rate` (`Tool First Result ÷ tools pageview`, target 0.28) and `workshop-save-rate` (target 0.12) (`data/kpis.json`). **Gap:** these are point metrics, not an end-to-end path; there is no documented model of tool→Ledger, and Plausible funnels/props aren't assembled into one view.

**Benchmark gap (Mixpanel).** Mixpanel's Flows show paths rigid funnels miss ([Webeyez, 2025](https://webeyez.com/insights/guides/amplitude-vs-mixpanel-comparison-guide-2025)). The asymmetric constraint: Muntin must reach that insight with *bucketed first-party events only* — no user-level identity stitch — which is harder, and the point.

**The Extend-Past move.** Build the **honest funnel as a Plausible goal-funnel** using only events that already exist (`AI Search Landing`/organic → `Tool First Result` → `Newsletter Signup` → `Ledger Route Click`), documented in `docs/` so the model is auditable and reproducible without a tracking vendor.

**Actions.**
1. Document the canonical tool→content→Ledger funnel (events + bounded props) in `docs/` and add it to `check-kpi-doc.mjs`'s review scope. **M × 5** [ASYMMETRIC]
2. Add a `step` enum prop (closed set) to lifecycle events so funnel position is queryable without per-path strings. **S × 4**
3. Surface the funnel's top line on `/receipts/` ("of tool users, N% reach the founding list") once baselined — label TBD until measured. **S × 3**

**Risks & honesty-gate notes.** No conversion-rate numbers until Plausible has data — publish the *model* now, the *numbers* later. Attribution must stay bucketed: no `location.href`, `pathname`, email, or session id as a prop (`check-event-prop-cardinality.mjs` is fail-CI). Do not stitch a cross-surface user identity to "complete" the funnel — the gap is acceptable; surveillance is not.

**One proof metric.** A reproducible Plausible funnel from organic/AI landing → `Ledger Route Click` with each hop's drop-off — assembled, baseline TBD.

---

### 87 · Experimentation / A-B Lead — the experiments.json system

**Aspect & why it decides success.** A live experiment loop is how a one-person studio earns the right to claim rigor — and avoids shipping on opinion. The apparatus exists but is idle; an unused testing system is just config.

**Current-state audit (score 4/10).** The framework is real and privacy-clean: `data/experiments.json` is read by `src/worker.js` HTMLRewriter, buckets per visitor (SHA256(sub‖YYYY-MM) signed-in; SHA256(IP‖UA‖YYYY-MM-DD) anon), stamps `data-experiment/data-treatment`, fires `Experiment Exposure` once/session (deduped via sessionStorage), and CSS swaps on `[data-treatment]`. Promotion is a config edit. **But the apparatus is idle:** exactly **one** experiment (`window-cta-copy`) in `status: "draft"`, `startedAt: null`, `concludedAt: null` (`data/experiments.json`). It has honest guardrails pre-set — `minExposuresPerArm: 200`, `minConversionDelta: 10`, `goalEvent: "Window Sent"`. Score reflects excellent infrastructure, zero shipped tests.

**Benchmark gap (Booking.com / Netflix).** Booking runs ~1,000 concurrent experiments and treats *experiment quality* as the goal — "no change ships without an A/B test proclaiming victory" ([VWO, "Booking.com CRO culture"](https://vwo.com/blog/cro-best-practices-booking/)). Muntin can't match volume; it can adopt the *discipline at n=1* — one well-powered test at a time, concluded honestly.

**The Extend-Past move.** **Ship the one draft experiment** end to end as the proof artifact, then publish the result (win *or* null) on `/receipts/` — "we test, and we tell you when the test said no." Honesty as the differentiator a hype-driven competitor won't replicate.

**Actions.**
1. Move `window-cta-copy` `draft → running`: set `startedAt`, confirm `goalEvent: Window Sent` is firing, respect `minExposuresPerArm: 200` before reading. **S × 5** [ASYMMETRIC]
2. Add a one-paragraph "how we decide a winner" note (the pre-set thresholds) to `/system/` or `/receipts/`. **S × 4** [ASYMMETRIC]
3. On conclusion, record outcome in `data/experiments.json` (`promoted`/`rolled-back`) and publish the call, including nulls. **S × 3**
4. Pre-register the *next* experiment (e.g., founding-band copy) so the apparatus stays warm. **S × 3**

**Risks & honesty-gate notes.** Do not read results before `minExposuresPerArm` — underpowered "wins" are the exact rigor failure to avoid; with low current traffic this may take weeks (honest, not a delay to hide). Bucketing already privacy-safe; keep `Experiment Exposure` props bounded. No invented lift numbers — report the actual delta or "inconclusive."

**One proof metric.** Experiments concluded with a published decision (target: ≥1 this quarter), each meeting `minExposuresPerArm: 200` (`data/experiments.json`).

---

### 88 · Community / Network Builder — DMV operators → national

**Aspect & why it decides success.** A community of operators who *belong* is the one moat a surveillance-funded giant cannot buy — it's earned through trust and local presence, exactly Muntin's edge (Don works real DMV shifts). It compounds the other six domains: members refer (85), test copy (87), seed the list (84), and create AEO-citable signal (82).

**Current-state audit (score 2/10).** There is **no community surface**. A repo grep for community/forum/cohort/directory returns only incidental prose mentions in library articles and tools — no member space, no operator directory, no gathering point. The raw materials are present: a tight DMV focus (`receipts/index.html` city subpages — Silver Spring, Bethesda, Takoma Park, DC, Arlington), the Window inbound channel (`/window/`), and the founding list. Score reflects strong latent network, zero structure.

**Benchmark gap (Indie Hackers / Notion).** Indie Hackers shows community is a multi-month commitment that converts far better than one-shot launches (~23% per engaged post in one 2024 study) and becomes an acquisition moat ([Awesome Directories, 2025](https://awesome-directories.com/blog/indie-hackers-launch-strategy-guide-2025/); [Built This Week, 2025](https://learn.builtthisweek.com/startup-life/best-online-communities-for-indie-hackers-in-2025)). Notion's unpaid ambassadors prove recognition alone sustains contribution ([Bettermode, 2024](https://bettermode.com/blog/notion-community-led-growth)).

**The Extend-Past move.** Start with a **low-cost "DMV operators' table"** — a privacy-first, opt-in surface (a periodic local note + an opt-in operator wall) rather than a heavy forum. Local-tight first, national later. No third-party community widget that sets cookies — the surface must survive `/never/` and the privacy gate.

**Actions.**
1. Ship an opt-in "DMV operators" page (fact-gated names, links to their sites) seeded from Window/founding contacts who consent. **M × 4** [ASYMMETRIC]
2. Convert the lifecycle drip (84) into a light "operators' note" with one local data point per send. **S × 4**
3. Recognition tier (Notion model): name contributors who share a tool win — recognition, not pay. **S × 3** [ASYMMETRIC]
4. Defer any hosted forum until the note has a repeatable cadence — avoid a third-party embed that breaks the privacy posture. **S × 3** (a *decision*, low effort).

**Risks & honesty-gate notes.** **Privacy first:** no third-party community SaaS that drops cookies or tracks across sites; opt-in only; every operator name fact-checkable (no invented members or cohort sizes — `check-fabrications.mjs`). Don't imply Don runs/mentors multiple restaurants — he convenes peers, he doesn't operate them (singular-bio constraint). No manufactured "join now" scarcity.

**One proof metric.** Opt-in operators on the DMV wall (consented, fact-gated) — baseline 0, growth tracked first-party.

---

*Cross-domain note:* #83's fail-CI vocabulary flip is blocked until #84 fixes the `Waitlist Signup` event-name drift. #85, #86, and #88 all depend on the bounded-prop discipline of `check-event-prop-cardinality.mjs` — referral source, funnel step, and any community signal must be first-party + bucketed.
