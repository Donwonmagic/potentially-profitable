## Domain V — Product (Muntin Ledger) & Conversion

> Positioning Council · Domain V (briefs 33–40). Strategy only — no live-site edits land from this file.
> Asymmetric thesis: giants take a per-order rake (DoorDash), a payment rake (Toast), or sell a generic ledger (QuickBooks). Muntin converts on the inverse — free, private, no-signup utility plus a real operator's name on the work. We never deploy a manipulation a giant's growth team would reach for: no fake countdowns, no invented scarcity, no fabricated cohort sizes, no testimonials we don't have.
> Honesty gate is absolute and is itself the product here. Every number below is repo-sourced (cited), web-sourced (labeled + dated), or tagged "illustrative / analyst assessment."
> CTA canon is LOCKED (`methods/index.html` #voice-contract): **"Email Don" · "Run my free audit" · "See pricing" · "Try it free" · "Save this."** No new verbs invented anywhere below. "Join the founding list" is the existing on-page button label for the `/api/waitlist` form (`index.html` #founding) — kept verbatim, not proposed as a new canon verb.
> Source-of-truth files read: `index.html`, `never/index.html`, `methods/index.html` (#voice-contract), `data/tools.json`, `data/experiments.json`, `data/start-here-journeys.json`, `start/index.html`, `tools/margin-math/index.html`, `security/index.html` (grepped). Repo facts: 13 live tools / 5 roadmap (`data/tools.json`); Ledger GA 2026-11-13 at ledger.muntin.digital (separate domain, not in repo); today 2026-06-16.

---

### 33 · Product-Strategy Lead (Ledger) — the GA wedge vs Toast / QuickBooks

**Aspect & why it decides success.** Muntin Ledger is the only paid product, GA 2026-11-13 — ~5 months out as of today (2026-06-16). On muntin.digital its representation is the single thinnest, highest-leverage gap in the whole property: a product nobody can see, evaluate, or even read a problem-statement for. If the on-site wedge is wrong, every free-tool visitor we so carefully earn has nowhere coherent to land.

**Current-state audit (score 3/10).** Ledger's entire on-site footprint: (a) the `#founding` band on `index.html` — one paragraph, "A deterministic engine reads your vendor invoices into a searchable ledger — no AI reads your numbers, no ads, no tracking," plus an email form; (b) Never-promise #three (`never/index.html`): "Muntin Ledger's tiers are posted in writing at ledger.muntin.digital, with the per-invoice cost math published beside them"; (c) a nav link out to the subdomain. There is **no on-site product page, no GA date shown, no pricing, no named competitor, no problem-statement.** The wedge ("deterministic, not AI, reads your invoices") exists only as a single sentence. Score 3 — the promise is honest and differentiated, but it is one sentence carrying a whole product.

**Benchmark gap (QuickBooks / Toast).** QuickBooks is a generic ledger that makes a restaurant operator translate their world into chart-of-accounts abstractions; Toast monetizes by sitting in the payment flow and taking a rake. Neither will ever say "a deterministic engine, no AI reads your numbers" — surveillance and model-training are their business model, not a line they'd renounce. That renunciation is Muntin's entire wedge and it is currently buried.

**The Extend-Past move.** Build one honest on-site problem→wedge page at `/ledger/` (subdomain owns pricing + signup; muntin.digital owns the *argument*). The argument is the asymmetry made legible: "Your invoice data is yours. A deterministic parser reads it — no model trains on your numbers, no per-order rake, tiers posted in writing." That is a sentence Toast and QuickBooks structurally cannot copy.

**Actions.**
1. Ship `/ledger/` problem→wedge page (no pricing — link out with "See pricing"): name the operator pain, state the deterministic-not-AI wedge, restate the Never-promise, show GA "this fall" framing. **L × 5.**
2. Add a "vs the generic ledger / vs the POS rake" honest comparison block — claims only as repo-sourced or labeled analyst assessment; defer all pricing numbers to the subdomain. **M × 4.**
3. Surface the GA date *only once it is committed and de-riskable* — until then keep "opens this fall" (matches `index.html` comment rationale: Stripe price not final, launch can slip). Do not invent a countdown. **S × 3.**
4. Wire `/ledger/` into `start/index.html` journeys for the `paperwork: blank-slate` + `leak: margin` tuples, where invoice capture is the actual next step. **M × 4.**

**Risks & honesty-gate notes.** Showing a GA date we might miss is a fake-certainty trap — keep "this fall" until committed. Do not state pricing on muntin.digital that could drift from the subdomain (two sources of truth = a broken promise the moment they diverge). EN↔ES parity required for any new `/ledger/` page (`check-locale-parity.mjs`). "No AI reads your numbers" must stay literally true vs the build.

**One proof metric.** `/ledger/` → outbound "See pricing" click-through rate to ledger.muntin.digital (Plausible outbound event), as a share of `/ledger/` sessions.

---

### 34 · Conversion-Rate Optimizer — free tool → Ledger signup, via trust not dark patterns

**Aspect & why it decides success.** The whole funnel is free-tool utility → founding-list / Ledger intent. The conversion *method* is the brand: convert on trust and proven utility, or don't convert. A single dark pattern (fake "3 spots left," a guilt-decline checkbox) would contradict `/never/` and `/security/` and detonate the only moat we have.

**Current-state audit (score 6/10).** Strong honest foundations: the `#founding` form (`index.html`) carries a real Turnstile, a labeled honeypot (`name="hp"`), and zero fake-scarcity copy. `/never/`, `/security/` (nine claims, five runnable tests), `/receipts/` de-risk conversion structurally. The A/B system (`data/experiments.json`) buckets deterministically and fires "Experiment Exposure" once per session — clean instrumentation. Gap: the bridge between a finished tool result and the founding list is mostly **absent**. Margin Math (`tools/margin-math/`) ends in a print/`.ics`/share scenario — no honest, contextual "this is what Ledger automates" handoff. The one registered experiment (`window-cta-copy`) is still `status: draft` (last reviewed 2026-04-30) — the test engine is idle.

**Benchmark gap (Stripe / Dropbox).** Stripe converts developers by posting fees plainly — "no setup fees, monthly fees, or hidden fees... all fees listed on the website" ([Stripe Pricing](https://stripe.com/pricing); Synder, *Guide to Stripe Fees 2025*) — trust *is* the conversion mechanism. Dropbox's classic PLG loop converted on demonstrated utility, not coercion. Muntin already out-privacies both; the gap is that it under-converts because it doesn't *ask* at the honest moment.

**The Extend-Past move.** A "value-first ask": only after a tool delivers a real result (a costed plate, a margin verdict) does a quiet, contextual, dismissible Ledger handoff appear — framed as "this is the number Ledger keeps current for you," never as pressure. The ask earns its place by following proof.

**Actions.**
1. Add a post-result contextual Ledger handoff to the cost tools (plate-cost, margin-math, cost-pulse) — dismissible, no interstitial, no modal trap; uses "Join the founding list" (existing label) or "See pricing." **M × 5.**
2. Activate one honest A/B in `data/experiments.json`: test handoff *placement* (after-result vs page-footer), goal `Waitlist Signup`, `minExposuresPerArm` ≥ the existing 200 floor. **S × 4.** [ASYMMETRIC]
3. Add a "what we will never do to convert you" micro-line linking `/never/` near any signup form — turning the honesty gate into a conversion asset. **S × 3.** [ASYMMETRIC]
4. Instrument the funnel: tool-open → result-reached → handoff-seen → signup, all via bucketed Plausible props (never raw user values, per `/security/` claim). **M × 4.**

**Risks & honesty-gate notes.** No countdowns, no "N spots left" unless a cap is real *and* enforced (it currently is not — don't invent one). The handoff must be dismissible and must not block tool output (the tool's utility is unconditional — that's the promise). Bucketed analytics only; raw financial inputs never leave the browser (`tools/margin-math/` FAQ, `/security/`).

**One proof metric.** Tool-result → `Waitlist Signup` conversion rate (the honest funnel's headline number).

---

### 35 · Onboarding / Activation Designer — first value < 2 min for a non-technical restaurateur

**Aspect & why it decides success.** A no-signup tool's activation *is* its onboarding — there's no account to set up, so the only question is "did this stranger get a real, true answer about their own restaurant fast?" If first value is slow or demands a clean POS export up front, the non-technical owner bounces and the whole PLG engine stalls at the top.

**Current-state audit (score 6/10).** Two activation doors already exist and are good: the `/start/` three-question diagnostic (`data/start-here-journeys.json`) routes to a curated kit in ~30s, and the homepage flagship tools promise "about 30 seconds, no signup" (`index.html`). Friction points: the heaviest, highest-value tools (plate-cost, menu-engineering) require a **POS sales-mix upload** before any value appears — a real wall for an owner who doesn't have the export handy. There's no "try it with sample data" path to the aha-moment, and no explicit < 2-min first-value contract anywhere.

**Benchmark gap (Linear / Superhuman).** Linear's onboarding lets the product teach itself with contextual nudges, optimizing time-to-value — "the product does the teaching" (Product School, *Product-Led Onboarding 2025*; UserGuiding). Superhuman manufactured activation with a 30-min 1:1 and a quiz-gated readiness check ([First Round Review, *Superhuman Onboarding Playbook*](https://review.firstround.com/superhuman-onboarding-playbook/); growth.design). Muntin can't (and shouldn't) do 1:1 onboarding at PLG scale — but it can borrow the *guaranteed early aha*: a prefilled sample that delivers a real verdict in seconds.

**The Extend-Past move.** A "sample restaurant" warm-start on every upload-gated tool: one tap loads a realistic, clearly-labeled-illustrative dataset that drives the tool to a full result instantly, so the owner sees the payoff *before* hunting for their own export. Aha first, data-entry second.

**Actions.**
1. Add "Try it with a sample menu/POS export" to plate-cost and menu-engineering — labeled illustrative, drives a full result in one tap. **M × 5.**
2. Put an explicit first-value contract on each tool ("a real answer in under two minutes, nothing leaves your browser") — true, measurable, honesty-gate-clean. **S × 4.**
3. From a `/start/` journey result, deep-link straight into the matched tool *pre-seeded* with the journey context where possible, shrinking clicks-to-value. **M × 3.**
4. Add an inline "next 60 seconds" micro-step list to the two deepest tools so a non-technical owner always knows the next move (product-does-the-teaching). **S × 3.**

**Risks & honesty-gate notes.** Sample data MUST be labeled illustrative in-product (fact gate: no implying these are real Don/operator numbers). Don't gate the real tool behind the sample — sample is optional warm-start, not a wall. Keep client-side; sample mode must not introduce a fetch (`/security/` claims 1/2 are CI-enforced).

**One proof metric.** Median tool-open → first-result time (target < 120s), plus sample-mode → real-input continuation rate.

---

### 36 · Pricing-Page UX Lead — the most honest pricing page in restaurant tech

**Aspect & why it decides success.** "I will never hide pricing behind a call" is a load-bearing public promise (`/never/` #three). Restaurant tech is notorious for "contact sales" opacity — Toast/Restaurant365-class quotes. A genuinely legible pricing page is both a conversion unlock and a category-level differentiator. The catch: canonical pricing lives on ledger.muntin.digital (separate domain, not this repo), so muntin.digital's job is to *promise and route*, never to duplicate numbers.

**Current-state audit (score 4/10).** The promise is excellent and specific: tiers "posted in writing... with the per-invoice cost math published beside them" (`never/index.html`). The canon even reserves the exact CTA — **"See pricing" → the product's posted numbers at ledger.muntin.digital** (`methods/#voice-contract`). But on muntin.digital today the "See pricing" CTA is effectively unused on the main conversion surfaces — the `#founding` band offers only the email form and a demo link, not a "See pricing" route. The honest-pricing promise is asserted but not *demonstrated* on-site. Score 4 — promise strong, surfacing weak.

**Benchmark gap (Stripe / Vercel).** Stripe's posted, no-asterisk fee page is the trust benchmark ([Stripe Pricing](https://stripe.com/pricing)). The "most honest pricing page in restaurant tech" is a winnable title precisely because the incumbents won't post numbers. Muntin's per-invoice cost-math promise is *more* transparent than a flat price — it shows the unit economics, which no POS vendor does.

**The Extend-Past move.** Make "See pricing" a first-class, visible route from every Ledger touchpoint on muntin.digital (canon already blesses the verb), landing on the subdomain's posted tiers — and on-site, preview the *transparency model* ("tiers in writing, per-invoice math beside them") without quoting a number that could drift.

**Actions.**
1. Add the canon "See pricing" CTA to the `#founding` band and the proposed `/ledger/` page, routing to ledger.muntin.digital/pricing (outbound, link-equity-passing, Plausible-tracked). **S × 5.**
2. On-site, show the pricing *model* as a labeled preview ("you'll see tiers + per-invoice cost math — no call required"), explicitly NOT the dollar figures, to avoid two-sources-of-truth drift. **M × 4.** [ASYMMETRIC]
3. Coordinate one canonical pricing source on the subdomain; muntin.digital only ever links (kills drift risk against the `/never/` promise). **S × 4.**
4. EN↔ES parity for the "See pricing" affordance and any model-preview copy (ES: *Ver precios*, per canon). **S × 3.**

**Risks & honesty-gate notes.** Never print a price on muntin.digital that isn't mirrored live on the subdomain — divergence breaks promise #three the instant it happens. "No call required" must stay literally true (no sales-call gate may appear on the subdomain). Don't imply the per-invoice math if the subdomain doesn't actually publish it yet — sequence the on-site claim behind the subdomain reality.

**One proof metric.** "See pricing" click-through from muntin.digital → subdomain pricing page (Plausible outbound), and the on-site→pricing→signup assist rate.

---

### 37 · CTA & Funnel Architect — persuasive without manipulation; canon, intent params, smart-next

**Aspect & why it decides success.** The CTA system is where persuasion and the honesty gate meet most directly. The canon is already LOCKED to five verbs (`methods/#voice-contract`); the architect's job is to deploy them with the right intent, sequencing, and smart-next routing so the funnel is *persuasive by relevance*, never by manufactured pressure (the Booking/Amazon "1 left!" reflex is explicitly off-limits).

**Current-state audit (score 7/10).** The canon is enforced-by-design and disciplined — five verbs, each one job, EN+ES mapped. The homepage priority ladder is deliberate and documented (Run my free audit → Join the founding list → 60-min tour, `index.html` hero comment). `/start/` is a genuine intent-router. Gaps: there's no documented **intent-param** convention (e.g. `?from=plate-cost`) to make smart-next CTAs context-aware, and the `window-cta-copy` experiment is still `draft` so CTA copy is untested. The "Run my free audit" primary points at `/tools/audits/restaurant/` — strong, but the cost-tools (the deepest value) have no canon CTA pushing toward founding-list at their honest moment (overlaps with brief 34).

**Benchmark gap (Booking / Amazon).** Booking.com and Amazon are the canonical *dark-pattern* funnels — fake scarcity, urgency timers, confirm-shaming. Muntin's asymmetric move is to be as *persuasive* through relevance and proof as they are through pressure — to prove a high-trust funnel can convert. That's the entire point of the council's thesis.

**The Extend-Past move.** A documented intent-param + smart-next convention: CTAs carry where-you-came-from context so the *next* step is the most relevant true action (not the most aggressive). Persuasion = right CTA, right moment, honest verb.

**Actions.**
1. Define an intent-param convention (`?from=<tool>` / `?intent=<journey>`) and a smart-next routing table so post-result CTAs are context-aware. **M × 4.**
2. Run the dormant `window-cta-copy` experiment to conclusion (move `draft→running`, set `startedAt`), then promote or roll back per its own `minConversionDelta`. **S × 4.**
3. Audit every CTA across the property against the five-verb canon; flag any drift to a non-canon verb for correction (gate hygiene). **M × 4.** [ASYMMETRIC]
4. Add a one-line "no fake urgency here" stance to the funnel/CTA canon doc so future copy can't reach for a countdown. **S × 3.** [ASYMMETRIC]

**Risks & honesty-gate notes.** Intent params must stay PII-clean — `?from=plate-cost` is fine; encoding any financial input in a URL that hits the server is not (fragments only, per `tools/margin-math/` no-referrer + fragment design). No urgency/scarcity verbs may enter the canon. Smart-next must not become a forced linear funnel that traps the researcher who just wants to read.

**One proof metric.** Smart-next CTA click-through rate by intent source (does context-aware routing beat the generic CTA?), with zero dark-pattern complaints in the `/window/` inbox.

---

### 38 · Free-Tool Product Manager — the suite as PLG engine; private, no-signup, still converts

**Aspect & why it decides success.** The 13 live tools (`data/tools.json`) are the entire top-of-funnel acquisition and trust-building engine. They're the proof that the studio's claims are real (every tool is a runnable instance of the privacy promise). The strategic tension: HubSpot/Ahrefs free tools convert *by capturing an email at the result*; Muntin's tools are no-signup by binding constraint — so the suite must convert on *trust + memorability + return*, not gate-the-result.

**Current-state audit (score 8/10).** Genuinely strong: 13 live tools across 4 clusters + 4 goal-launchers (`data/tools.json`), all client-side/no-signup, shared libs in `tools/_shared/`, EN+ES throughout, schema'd (`tools/margin-math/` WebApplication + FAQ JSON-LD). Cost Pulse + Muntin Bench already create a *saved-invoice* surface (a return reason). 5 roadmap tools queued. The PLG gap vs the giants: because we (correctly) never gate results behind email, there's no built-in capture — conversion depends entirely on the (currently thin, per brief 34) handoff to founding-list, plus organic memory. Tool-to-tool cross-sell exists (Storefront Health links the next fix to its tool) but isn't systematic.

**Benchmark gap (HubSpot / Ahrefs).** HubSpot's Website Grader is "one of their most successful lead-generation tools" — but its mechanism is *email-for-result* ([Outgrow, *HubSpot Website Grader case study*](https://outgrow.co/blog/hubspot-website-grader-case-study)). Ahrefs Webmaster Tools is free with "no credit card to sign up" yet still funnels to paid via verified-site value ([Ahrefs Webmaster Tools](https://ahrefs.com/webmaster-tools)). Muntin's asymmetry: keep the *no-signup* promise (which HubSpot breaks) and still convert — by being the tool an operator *remembers and returns to*, then meets the founding list at an honest moment.

**The Extend-Past move.** Treat the suite as a *connected* engine, not 13 islands: every tool result names the single best *next* tool and the one true reason to come back (a saved scenario, a weekly index) — so the funnel is utility→utility→trust→Ledger, never utility→gate.

**Actions.**
1. Systematize tool-to-tool smart-next (extend the Storefront Health pattern to all 13) so each result routes to the next highest-value tool. **M × 5.** [ASYMMETRIC]
2. Add a privacy-as-conversion line to every tool result ("nothing left your browser — open DevTools and check," per Margin Math's existing stance) to convert on trust. **S × 4.** [ASYMMETRIC]
3. Prioritize the 5 roadmap tools (`data/tools.json` roadmap) by funnel value to Ledger — ship the ones nearest invoice/cost intent (schema-check, seo-grader are SEO-side; weigh against a cost-side addition). **L × 4.**
4. Add "Save this" (canon verb) handoffs from cost tools into Workshop so a result becomes a returnable artifact (the no-signup return hook). **M × 4.**

**Risks & honesty-gate notes.** Do NOT adopt the HubSpot email-gate — it violates the no-signup constraint that is the whole differentiator. "Nothing leaves your browser" must stay CI-true for any tool that claims it (`/security/` claims 1/2). Roadmap tool counts in `data/tools.json` feed `<!-- count:tools.live -->` sentinels — keep `data/site-counts.json` in sync when any ship.

**One proof metric.** Tools-per-session (does the suite behave as a connected engine?) and tool → founding-list assist rate, with no-signup preserved.

---

### 39 · Retention / Habit Designer — weekly Cost Index as an honest habit loop

**Aspect & why it decides success.** muntin.digital is mostly a consideration-stage property — people research, then leave. A *return* reason converts one-time tool users into a relationship, which is what eventually sells Ledger. The Cost Index's weekly refresh is the one native, honest habit hook on the property. The constraint: build a habit loop on *information value*, not Duolingo-style dopamine/loss-aversion traps — the data is the reward.

**Current-state audit (score 5/10).** The raw material is excellent: the Cost Index updates on a weekly read (homepage trust strip + stance three, `index.html`) with USDA/BLS/FRED sourcing — a legitimate, recurring reason to come back. Margin Math already ships an `.ics` "monthly check-in" recurring reminder and a printable monthly report (`tools/margin-math/` schema featureList) — honest habit scaffolding. Gaps: no opt-in weekly Cost Index notification (and the property is correctly *no remarketing pixel*, `/never/` #four — so any nudge must be pull, e.g. `.ics`/RSS/calendar, not push-tracking), and the weekly refresh isn't surfaced as a habit ("check it every Monday with your numbers").

**Benchmark gap (Duolingo).** Duolingo's loop — "complete one short lesson every day," with streaks driving ~2x daily retention and DAU from ~5M (2020) to 40M+ (2024) ([deconstructoroffun, *Duolingo Streaks*](https://duolingo.deconstructoroffun.com/mechanics/streaks); StriveCloud) — is the gold standard *and* the cautionary tale: it leans on loss-aversion and streak-anxiety. Muntin's asymmetric inversion: a weekly loop where the reward is *information an operator actually needs to price this week*, not a manufactured streak to protect. Honest habit, not a dopamine trap.

**The Extend-Past move.** A pull-based weekly ritual: "Check the Cost Index every Monday before you set the week's specials," supported by opt-in `.ics`/calendar and RSS (no pixel, no email-tracking) — the habit is anchored to a real operating decision, so the data does the retaining.

**Actions.**
1. Add a weekly-ritual frame to the Cost Index ("this week's read, dated" + "check before you price the week") and an opt-in `.ics`/RSS subscribe — pull, not push, no pixel. **M × 5.** [ASYMMETRIC]
2. Extend Margin Math's `.ics` monthly-reminder pattern to a Cost-Index weekly cadence option. **S × 4.**
3. Add an honest "what changed since last week" delta line to the Cost Index (information reward, not streak reward). **M × 4.** [ASYMMETRIC]
4. Cross-link the weekly Index into Cost Pulse / Muntin Bench so a returning operator lands on their own saved data + the fresh benchmark. **M × 3.**

**Risks & honesty-gate notes.** No remarketing/retargeting pixel may be added to create a habit — `/never/` #four is absolute. No streak-anxiety or fake-loss mechanics ("you'll lose your spot"). Every Cost Index number stays USDA/BLS/FRED-sourced and dated (`docs/fact-check.md` + `data/sourced-claims.json`); a "what changed" delta must be computed from sourced data, never illustrative-but-unlabeled.

**One proof metric.** Weekly-return rate to the Cost Index (returning visitors / prior-week visitors) — the honest-loop equivalent of DAU/MAU.

---

### 40 · Founding-Cohort Strategist — a founding cohort of real operators as proof

**Aspect & why it decides success.** With Ledger ~5 months from GA (2026-11-13) and zero public testimonials yet, the founding cohort is the only path to *earned* social proof by launch. Done honestly, a small cohort of named real operators becomes the credibility that converts the next wave — the asymmetric answer to a giant's logo wall. Done dishonestly (invented member counts, fake quotes), it incinerates `/never/` + `/security/` in one move.

**Current-state audit (score 5/10).** The capture exists and is clean: `#founding` band (`index.html`) with a real `/api/waitlist` proxy, Turnstile, honeypot, and deliberately honest framing — "no price, no date... the Stripe price isn't final and the launch can slip" (HTML comment). "Your numbers stay yours" reinforces the wedge. Gaps: no stated founding *benefit* on-site (the canon-correct move would be to post the founding rate in writing once it's set — consistent with promise #three), no waitlist position/transparency, no referral mechanism, and no plan for converting founders into (consented, real) proof. The framing is honest-but-vague; it asks for an email without yet saying what the founder *gets*.

**Benchmark gap (Superhuman).** Superhuman built demand with an invite-gated, quiz-screened, 1:1-onboarded founding motion that produced a large waitlist and genuine word-of-mouth ([First Round Review, *Superhuman Onboarding Playbook*](https://review.firstround.com/superhuman-onboarding-playbook/)). The transferable parts are honest: real screening (founding members should be real operators, which also makes their later testimonials credible) and earned scarcity (capacity is genuinely constrained — `/never/` already states the studio is capacity-capped). The non-transferable part: do NOT manufacture exclusivity numbers we can't back.

**The Extend-Past move.** A transparent founding cohort: post the founding rate/benefit in writing (promise #three consistency), be honest that capacity is real and limited (already true per `/never/`), and pre-plan a *consented* "founding operators" proof surface — real names, real shops, only with explicit permission — that becomes the launch-day credibility wall no giant can fake.

**Actions.**
1. State the founding *benefit* in writing on the `#founding` band + `/ledger/` (e.g. founding rate / first-access terms) once committed on the subdomain — posted, not call-gated. **M × 5.**
2. Add an honest, consent-based referral line ("know an operator who'd want first access? Send them the founding list") — no incentive that pressures, no fake leaderboard. **S × 4.** [ASYMMETRIC]
3. Pre-build a *consented* founding-operator proof template (real name + restaurant, explicit opt-in) to populate by GA — zero fabricated quotes/counts. **M × 5.** [ASYMMETRIC]
4. Give waitlist signups an honest confirmation of what happens next + when (matches the existing "check your inbox to confirm" pattern); no fake "position #" unless the queue is real and ordered. **S × 3.**

**Risks & honesty-gate notes.** Absolute: no invented cohort size, no fabricated testimonials, no fake "X founders joined" counter — `check-fabrications.mjs` + `docs/fact-check.md` reject invented operator data, and any number shown must be real and sourced. Earned scarcity only (capacity is genuinely limited per `/never/` #five) — never manufactured. Testimonials require explicit consent and must be real operators. Keep the "price can slip, date can move" honesty in all founding framing until GA is truly committed.

**One proof metric.** Verified founding signups (real, confirmed emails via `/api/waitlist`) and, by GA, count of *consented* named founding operators available as proof.

---

### Cross-domain dependencies

- **Briefs 33/36/40 ↔ ledger.muntin.digital (separate domain, not this repo):** the on-site `/ledger/` page, the "See pricing" route, and the founding rate/benefit all depend on the subdomain owning a single canonical source for pricing + tiers + GA date. muntin.digital must only *link and promise*, never duplicate numbers, or promise #three (`/never/`) breaks on the first divergence. Requires coordination with whoever owns the subdomain.
- **Briefs 34/37/38/39 ↔ Domain analytics + experiments + i18n:** every new handoff, smart-next CTA, intent param, and weekly-loop subscribe needs (a) bucketed-only Plausible instrumentation that never carries raw user values (`/security/` claims, CI-enforced), (b) an honest A/B slot in `data/experiments.json` for placement/copy tests, and (c) EN↔ES parity (`check-locale-parity.mjs`, `check-hreflang-orphans.mjs`) plus `data/site-counts.json` sync for any tool/count change — all of which sit at the seam with the Content/SEO and Engineering domains.
