## Domain I — Positioning & Brand Strategy

*Positioning Council batch, specialists 01–08. Strategy only — no live-site edits proposed here ship without passing `scripts/check-all.mjs` (~113 checks) and the honesty gate. Every external figure is dated + sourced or labeled "analyst assessment." Repo facts cite specific surfaces. Today: 2026-06-16.*

**Cross-cutting audit finding (referenced by several briefs below):** the site is mid-migration from a *services-era* identity ("web studio," "two builds at a time," "six polishes and one drop-in per week," services/* offer pages) to a *company/product-era* identity (Cost Index + free tools + Muntin Ledger). The migration is ~80% done on the front door (`index.html`, `studio/index.html`) but **stale services language survives on the trust spine** — `/methods/` §"Three classes of claim" still says *"Two builds active at a time"*; `/never/` #5 is *"I will never take work I can't ship in the quoted window"* + the `#free-forever` block's *"six polishes and one drop-in per week"*; `/receipts/` lists *"Two builds at a time"*, *"Lead-to-call rate"*, and *"3 new productized offer pages at services/audit…"*. This is not a fabrication-gate failure, but it is a **positioning-coherence** failure that undercuts the asymmetric thesis. Fixing it is the connective tissue across briefs 01, 02, 05, 06, 07.

---

### 01 · Category Designer

**Aspect & why it decides success.** A company that doesn't name its category gets sorted into someone else's — and "restaurant web studio" files Muntin next to Wix templaters and freelancers, where price is the only axis and the giant wins. Category design (Stripe = "payments infrastructure," Drift = "conversational marketing") is the one move a one-person shop can make that a giant *structurally won't*: incumbents are incentivized to keep the category vague so they can sell everything into it.

**Current-state audit — score 6/10.** The repo has *already abandoned* "web studio" on the front door: homepage meta is "Restaurant cost intelligence & the free operator library" (`index.html` line 8), the H1 is "Know what every plate costs before the week eats the margin" (line 433–435), and `studio/index.html` H1 is "The company where the numbers are checked before they ship" (line 447–449). Strong raw material. But there is **no coined category noun** — the site describes *what it makes* (Cost Index, tools, Ledger) without naming *the space it owns*. CLAUDE.md itself still opens "a one-person restaurant web studio." The pieces of a category exist (sourced data + owner-operator + privacy) with no label to make rivals react.

**Benchmark gap.** Stripe didn't sell "a payment form"; it named "payments infrastructure for the internet" and forced competitors to position against it (analyst assessment). Muntin trails Stripe on *naming discipline* but leads every restaurant-tech incumbent on the raw substance a category needs: Toast/DoorDash sell rails that extract rent; none can credibly own "sourced, no-rake restaurant cost intelligence" because their business model is the rake.

**The Extend-Past move.** Coin **"Restaurant Cost Intelligence"** as the category and make Muntin its definitional source — the play Toast/DoorDash can't run because honest, un-monetized cost data is adverse to their revenue. The category's load-bearing claim is *"every number traces to the agency that published it"* (true today via Cost Index → USDA/BLS/FRED). A giant can copy a dashboard; it cannot copy *not selling your data*, which is the category's price of entry.

**Concrete actions.**
1. Write a canonical category-definition page at `/cost-index/` intro or a new `/what-is-restaurant-cost-intelligence/` library article (Muntin Desk byline), defining the term in primary-source language. **Effort M × Impact 4.**
2. Thread the exact phrase "restaurant cost intelligence" into the homepage hero sub and `studio/` lead (it's already in meta — promote it to visible H-copy). **Effort S × Impact 4.**
3. Update CLAUDE.md's opening line from "restaurant web studio" to the company/category framing so internal memory stops re-seeding the retired label. **Effort S × Impact 3.**
4. Add `DefinedTerm` JSON-LD for the category so AI answer engines learn Muntin as the definitional source. **Effort S × Impact 4 (ASYMMETRIC — see brief 05).**
5. Retire "studio" as a noun in net-new copy; keep only where a slug is final-forever (`/studio/` path stays, label already reads "Company"). **Effort S × Impact 2.**

**Risks & honesty-gate notes.** Do not claim Muntin *invented* the term if it didn't — frame as "the category we build for" (assessment), not a false first-mover claim. Keep "Cost Index" (the product surface) and "cost intelligence" (the category) distinct so naming stays clean (brief 04). No new numbers required, so no fact-gate exposure.

**One proof metric.** AI Overview / LLM citations that return Muntin for the unbranded query "what is restaurant cost intelligence" (track via the AI-search-arrivals watch metric on `/receipts/`).

---

### 02 · Positioning Strategist

**Aspect & why it decides success.** The one-line answer to "why Muntin, why now" is what a distracted operator and an AI answer engine both reduce you to. If it's "another restaurant website tool," the giant's distribution buries it. The asymmetric line has to name a structural conflict the incumbent can't resolve.

**Current-state audit — score 7/10.** The positioning *spine* is excellent and already shipped: three signature stances on the homepage (`index.html` lines 497–521) — "Most restaurants don't need a rebuild," "DoorDash is a margin tax," "Your costs move every week, you should be able to see it" — each backed by a real artifact (article + tool + Cost Index). The trust strip (lines 573–587) lists hard constraints, not benefits. The weakness: there is **no single compressed line** that fuses honesty + owner-operator + no-rake. The hero sub does work ("I run front-of-house at a DMV restaurant; these are the numbers I check on my own shifts") but it's three sentences, not one weapon. The stale services language (cross-cutting finding) muddies the "why now."

**Benchmark gap.** Apple's "we don't sell your data, you're not the product" is the template: a one-line anti-platform stance that competitors with ad/rake models *cannot mirror without indicting themselves* (analyst assessment). Toast positions on "all-in-one platform," DoorDash on reach, Wix on ease — all rent-or-scale stories. Muntin leads all three on the one axis they can't claim (no rake, no data resale, sourced numbers) and trails them only on breadth, which is deliberate.

**The Extend-Past move.** Lock a single positioning line: **"The restaurant numbers company that doesn't rent your guests back to you."** It encodes the anti-platform stance (DoorDash/Toast monetize the guest relationship; Muntin's `/never/` #1–2 forbid lock-in and data resale). The giant cannot run this line because renting the guest relationship *is* their model.

**Concrete actions.**
1. Draft and A/B the one-liner as the homepage eyebrow or a new line under the H1; keep the existing H1 (slug-independent copy, low risk). **Effort S × Impact 5.**
2. Resolve the services/company tension: scrub "two builds at a time" / "lead-to-call rate" from `/receipts/` and `/methods/` so "why now" reads as a product company, not a freelancer. **Effort M × Impact 4.**
3. Build a one-screen "Muntin vs Toast vs Wix vs Yelp" honest comparison (feeds brief 05) anchored on the conflict axis, not feature checkboxes. **Effort M × Impact 4 (ASYMMETRIC).**
4. Ensure the one-liner ships EN + ES at parity (locale-parity gate) — true Spanish-native positioning is itself the asymmetry (brief 08). **Effort S × Impact 3.**

**Risks & honesty-gate notes.** "Doesn't rent your guests back to you" must stay literally true — it's defensible today because the site runs no remarketing pixel (`/never/` #4, `/receipts/` "what we don't track"). If Ledger ever adds a referral/ad surface, the line retires. Avoid banned words (no "seamless/powerful"); "rent your guests back" is operator-noun language, in-voice.

**One proof metric.** Branded + category search share-of-voice vs "restaurant website" generic queries — specifically, the lead-to-Window-thread rate from visitors who land on the positioning line (Window thread starts per week, `/receipts/` KPI #6).

---

### 03 · Brand-Narrative Lead

**Aspect & why it decides success.** A one-person company reads as "small/risky" *unless* the founder story is reframed as the moat. Basecamp (opinionated founders as the product) and Patagonia (founder values as durable trust) prove a singular human can out-trust a faceless platform — but only if the narrative is disciplined and verifiable.

**Current-state audit — score 8/10.** This is the strongest asset on the site. `/about/` carries a dated, specific, *sourced* operator narrative: full-time FOH manager at Tacombi in Bethesda, a 10-year timeline (Tacombi → Irish Inn at Glen Echo → Tacombi → Nobu → Kapnos), five real credentials (ServSafe Manager/Allergens/Handler, RAM, MC ABS), bilingual working register (lines 631–634, 649–685). The narrative *earns* the authority instead of asserting it ("Most web designers who work with restaurants have never managed one. This is the receipt." line 646). The voice canon protects it (blog = first-person Don). Minor gap: the JSON-LD `jobTitle` still reads "Founder & Lead Designer" (line 73) — a *services-era* title that lags the company/product framing.

**Benchmark gap.** Patagonia's narrative authority comes from founder values *enforced operationally* (analyst assessment) — exactly Muntin's `/never/` model. Muntin already leads most SaaS founders on specificity (real restaurants, real dates). It trails Basecamp only on *reach*: the story lives on `/about/` but isn't yet a distribution engine (brief 08 picks this up).

**The Extend-Past move.** Turn the singular bio from a *limitation to defend* into the *category's credibility proof*: "the cost tools are built by the person who checks these numbers on his own Friday-night shift." A giant's PM has never 86'd the branzino at 4pm (the literal `/about/` anecdote, line 633). Make operator-authenticity the narrative spine — the one thing a venture-funded competitor cannot buy.

**Concrete actions.**
1. Update the `/about/` JSON-LD `jobTitle` to align with the company era (e.g., "Founder, Muntin Digital" — already present in the second Person node, line 146; fix the first). **Effort S × Impact 3.**
2. Add a short "why I built the tools" origin note to `studio/#about` linking the floor anecdotes to specific tools (Plate Cost ← "86'd the branzino"; Cost Index ← "the numbers I check"). **Effort S × Impact 4.**
3. Keep the bio SINGULAR in every net-new surface — never imply two concurrent restaurants (fail-CI pattern in `check-fabrications.mjs`); past roles stay in `/about/#timeline`. **Effort S × Impact 5 (guardrail).**
4. Carry the narrative into ES at parity so the bilingual claim is lived, not translated (the `/about/` ES anecdote already exists). **Effort S × Impact 3.**

**Risks & honesty-gate notes.** The single highest fabrication risk in the whole domain lives here: any phrasing that frames Don as *currently* running/managing more than one restaurant is blocked CI-side and would, if it slipped, be spoken aloud in six languages by the audio renderer. All anecdotes are already registered/sourced; new ones need `sourced-claims.json` entries or "illustrative" labels.

**One proof metric.** `/about/` → product/tool conversion rate (visitors who read the bio and then run a tool or join the founding list) — the number that proves the story *sells*, not just charms.

---

### 04 · Naming & Nomenclature Architect

**Aspect & why it decides success.** A product family with muddy names lets competitors and AI engines blur you into the category soup. Apple (iPhone/iPad/Mac — one pattern) and Linear (sharp, ownable nouns) show that a clean naming system is a moat: rivals literally can't reference you imprecisely.

**Current-state audit — score 6/10.** A real governance spine exists: `docs/brand/voice-and-naming-architecture.md` §3 defines the canon (Muntin Digital = parent; Muntin Ledger = product; "the Workshop" = on-site tool workspace; "Muntin `<Noun>`" = future products) and a fail-CI `check-name-coherence.mjs` enforces Workbench→Workshop. **But the live surfaces show drift the canon hasn't caught up to:**
- **"Cost Index" (product, `/cost-index/`) vs "Cost Pulse" (a tool, `data/tools.json`)** — two "Cost"-prefixed names, different things, easy to conflate.
- **"Muntin Bench"** is the *display* name for the tool whose slug/key is `vendor-benchmark` (`data/tools.json` lines 274–289) — a half-applied "Muntin `<Noun>`" rename; the slug and label diverge.
- The "Muntin `<Noun>`" pattern is applied to *one* tool (Bench) but not others (Margin Math, Plate Cost), so the system reads as inconsistent rather than intentional.

**Benchmark gap.** Linear's naming is ruthlessly consistent (analyst assessment); every surface reinforces the others. Muntin *has the rulebook* (ahead of most one-person shops) but trails on *application* — the canon governs the studio↔product boundary well, yet the tool-name layer is unsystematized.

**The Extend-Past move.** Publish and enforce a **three-tier naming system** competitors can't muddy: Tier 1 brand (Muntin Digital), Tier 2 named products (Muntin Ledger, Cost Index — capitalized proper nouns), Tier 3 tools (descriptive: "Margin Math," "Plate Cost"). Decide deliberately whether "Muntin Bench" graduates to a Tier-2 product or reverts to descriptive "Vendor Benchmark" — and resolve the Cost Index / Cost Pulse collision (rename Cost Pulse, or explicitly document them as Index=public data, Pulse=your-own-invoices dashboard).

**Concrete actions.**
1. Add a naming-tier table + the Cost Index vs Cost Pulse boundary to `voice-and-naming-architecture.md` §3, then extend `check-name-coherence.mjs` to assert it. **Effort M × Impact 4 (ASYMMETRIC — a CI-enforced naming system rivals can't blur).**
2. Decide Bench's tier; if it stays "Muntin Bench," apply the pattern consistently or document why it's the sole branded tool. **Effort S × Impact 3.**
3. Disambiguate Cost Index / Cost Pulse in user copy (one line each on `/tools/` and `/cost-index/`). **Effort S × Impact 3.**
4. Keep tool *slugs* final-forever even when display names change (slugs are immutable per CLAUDE.md) — change labels only. **Effort S × Impact 4 (guardrail).**

**Risks & honesty-gate notes.** No fact-gate exposure. The real risk is breaking deep links by renaming slugs — the system must change *labels*, never paths (`vendor-benchmark` slug stays even as "Muntin Bench" shows). Keep names within the window/operator metaphor family (the only sanctioned family).

**One proof metric.** Zero name-coherence CI failures across a quarter *and* zero "Cost Index/Cost Pulse" confusion in Window threads.

---

### 05 · Competitive-Intelligence Lead

**Aspect & why it decides success.** Knowing exactly where Toast/DoorDash/Owner.com/Yelp/QuickBooks are *structurally* conflicted tells Muntin which fights to pick. Amazon's working-backwards discipline is the model: start from the seam the incumbent can't close and build the wedge there.

**Current-state audit — score 7/10.** The site already fights on the right axes: the "DoorDash is a margin tax" stance (homepage), the Margin Math tool (30% take vs $0 own-channel), the sourced delivery-economics library articles, and `ledger-cta.json` routing finance readers to Ledger as "the privacy posture this article describes, shipped as a product." `/methods/` cites the real incumbent numbers (DoorDash Basic 15% / Plus 25% / Premier 30%; Toast/Square/Clover loyalty pricing). The gap: there's **no single competitive map** that names the seams; the intelligence is scattered across articles, and product comparisons live off-site (`ledger.muntin.digital/vs/`).

**Benchmark gap (named, dated, sourced).** The sharpest competitor to study is **Owner.com**: flat $499/mo, commission-free, $1B valuation May 2025, 10,000+ restaurants, ~$81M ARR 2025 ([Sacra](https://sacra.com/c/owner/); [Owner.com pricing](https://www.owner.com/pricing)). It proves the commission-free wedge is a billion-dollar market — *and* exposes the seam: Owner.com still charges $499/mo and owns the guest data/app. **DoorDash** confirms the rake Muntin attacks: 15/25/30% tiers, Premier now bundling "automatic ads run on your behalf" ([DoorDash merchant blog](https://merchants.doordash.com/en-us/blog/new-partnership-plans); [Restaurant Business](https://www.restaurantbusinessonline.com/technology/doordash-unveils-tiered-pricing-plan-restaurants)). Muntin leads all of them on *trust architecture* (sourced numbers, no tracking, no lock-in) and trails on breadth/capital.

**The Extend-Past move.** Map four seams incumbents can't close and build a public, honest comparison around them: (1) **commission-free is structurally adverse to DoorDash's P&L** — they can't truly zero the rake; (2) **Toast/QuickBooks monetize data and lock-in** — Muntin's `/never/` forbids both, verifiably; (3) **Owner.com still rents the relationship at $499/mo** — Muntin's free tools + posted Ledger pricing undercut the opacity; (4) **Yelp/Google answer-engine extraction** — Muntin wins by being the *cited source*, not the listing. The asymmetry: publish the comparison with *Muntin's own weaknesses named* (smaller, newer) — radical-transparency competitive intel no incumbent will reciprocate.

**Concrete actions.**
1. Build `/library/` or `/studio/compare/` honest comparison pages on the four seams, every claim sourced inline (`<details class="cite">`) — including where Muntin loses. **Effort L × Impact 5 (ASYMMETRIC).**
2. Add a `sourced-claims.json` block for incumbent pricing (Owner.com $499/mo, DoorDash tiers) with dates so the audio + AI feeds can speak them safely. **Effort M × Impact 4.**
3. Update the homepage "DoorDash is a margin tax" stance to reflect the 2026 ad-bundling change (Premier auto-ads) — keeps the stance current and sourced. **Effort S × Impact 3.**
4. Scrub residual services-era competitive framing from `/receipts/` (the "3 productized offer pages" line) so the competitive story is product-vs-platform, not freelancer-vs-agency. **Effort S × Impact 3.**

**Risks & honesty-gate notes.** Comparison pages are the highest fact-gate surface in this domain — every competitor figure must be dated + sourced or the build fails; competitor pricing drifts, so register it in `sourced-claims.json` with `date_verified` for quarterly recheck. Never overstate Muntin's scale to match Owner.com's 10,000 restaurants — honesty *is* the wedge.

**One proof metric.** Win-rate / citation-rate on comparative queries ("Owner.com alternative," "commission-free vs DoorDash") in AI Overviews and organic — the seam converting to arrivals.

---

### 06 · Pricing & Packaging Strategist

**Aspect & why it decides success.** Pricing is positioning made numeric. The free-tools funnel + Ledger tiers must *signal honesty* (Stripe's transparent per-transaction pricing; Notion's genuine free tier) rather than bait-and-switch. The asymmetry: a pricing model with **no per-order rake** is one DoorDash/Toast can't match without breaking their own economics.

**Current-state audit — score 6/10.** The honest-pricing posture is real and partly shipped: `/never/` #3 "I will never hide pricing behind a call," tools are "free, no signup" (homepage, repeated), Ledger pricing is "posted in writing… with the per-invoice cost math published beside" (`studio/index.html` line 466). But the on-site Ledger presence is **thin** — the front door's Ledger surface is essentially "Join the founding list" + the `/never/` pricing promise; actual tiers live off-site. Ledger is "Free while in private beta" (GA 2026-11-13, five months out). The `#free-forever` block on `/never/` is a strong honesty signal but still carries services-era residue ("six polishes and one drop-in per week," "$249" print framing).

**Benchmark gap.** Stripe/Notion freemium works because the free tier is *genuinely useful and uncapped where it counts* (analyst assessment). Muntin already does this better than most — `/never/#free-forever` lists what stays free "and complete." It trails on *Ledger pricing legibility on the .digital domain itself* (the operator has to leave the site to see numbers, which slightly dents the "no hidden pricing" promise even though the pricing exists off-site).

**The Extend-Past move.** Make **"no per-order rake, pricing on the page"** the packaging signal. Surface Ledger's posted tiers (or a faithful summary + the per-invoice cost math) *on muntin.digital*, not only on the subdomain — so the honesty promise is kept on the surface that makes it. Frame the free tools as "the actual output, not a teaser" (already the `/never/` language) and Ledger as flat/transparent vs Owner.com's $499/mo opacity (brief 05). The giant can't post "no rake" because the rake is the business.

**Concrete actions.**
1. Add a thin Ledger pricing summary block to `studio/#product` (mirror the subdomain's posted tiers + per-invoice math), keeping the subdomain canonical. **Effort M × Impact 4.**
2. Refresh `/never/#free-forever` to drop services-era specifics ("six polishes/one drop-in," the $249 one-shot framing) and re-anchor on the tools + Ledger. **Effort S × Impact 3.**
3. Add a one-line "what the founding list is and isn't" honesty note near the homepage founding-list CTA (no fake urgency, no fake cohort size). **Effort S × Impact 4.**
4. When Ledger GA pricing locks (by 2026-11-13), register every tier number in `sourced-claims.json`. **Effort S × Impact 3 (timed).**

**Risks & honesty-gate notes.** Zero invented pricing, zero fake urgency/scarcity, no invented founding-list count (binding constraint #1). "Free while in private beta" must stay literally true through GA. If summarizing off-site tiers on-site, the two must not diverge (a self-inflicted "hidden/contradictory pricing" failure).

**One proof metric.** Founding-list join rate from operators who viewed posted pricing on-site (vs. those who bounced to the subdomain) — pricing legibility → intent.

---

### 07 · Mission & Values Architect

**Aspect & why it decides success.** Values that are *enforced* beat values that are *stated*. Basecamp and DuckDuckGo win trust because their refusals are operationally real (no tracking, no ads), not slogans. For Muntin, the entire asymmetric thesis rests on this: honesty isn't a value, it's a *build step*.

**Current-state audit — score 9/10.** This is the second-strongest asset (after the founder narrative) and the truest expression of the thesis. `/never/` ships five promises-by-absence (no lock-in, no data resale, no hidden pricing, no remarketing pixel, no work outside the window). `studio/#honesty` states it plainly: "Not a slogan — a build step… an invented statistic fails the build before it can publish." This is *literally true*: `check-fabrications.mjs`, `check-all.mjs`, `check-banned-words.mjs`, the audio fact gate, cookieless self-hosted Plausible (`/never/` #4, `/receipts/` "what we don't track" — verifiable in DevTools). The only deduction: promise #5 ("work I can't ship in the quoted window") is a *services-era* value the product company no longer fully embodies — a values statement that's drifting out of true.

**Benchmark gap.** DuckDuckGo's "we don't track you" is enforced by architecture (analyst assessment); the value is the product. Muntin matches this and arguably *exceeds* it on verifiability — DDG asks you to trust; Muntin says "run the five tests yourself" (`/security/`) and ships SHA-256 of the production bundle (`/receipts/`). Muntin leads here. The gap is only internal coherence (services-era promise #5).

**The Extend-Past move.** Reframe `/never/` from "studio refusals" to **"company guarantees a platform can't make,"** and make every promise point to its *enforcing mechanism* (the CI gate, the cookieless analytics, the git-history audit trail). Replace the retiring services promise (#5) with a product-era guarantee that's equally binding and equally verifiable — e.g., "I will never put a language model in the path of your invoices" (already true and CI-enforced per `studio/#product` line 465: "a CI gate blocks anyone from adding one"). The giant can't publish enforced refusals because its revenue depends on the things Muntin refuses.

**Concrete actions.**
1. Rewrite `/never/` #5 from the services promise to a product-era, CI-enforced guarantee (the no-LLM-in-invoice-path promise is shipped and verifiable). **Effort M × Impact 5 (ASYMMETRIC — a refusal enforced in CI).**
2. Add the *enforcing mechanism* beside each of the five promises (link the gate/script or the DevTools test). **Effort S × Impact 4.**
3. Align `/methods/` "Studio claims" and `/receipts/` "public commitments" with the product era — swap "two builds at a time" for the live guarantees. **Effort M × Impact 4.**
4. Keep the changelog-first discipline ("if any of these stops being true, the changelog will say so") — it's the values' integrity proof. **Effort S × Impact 3 (guardrail).**

**Risks & honesty-gate notes.** Every promise must stay literally enforceable — do not add a sixth promise you can't verify in code or DevTools (that would invert the whole asset). The no-LLM-in-invoice-path claim is true today; if Ledger's architecture ever changes, the promise and the changelog move together.

**One proof metric.** Number of `/never/` promises with a *linked, runnable* enforcing mechanism (target: 5/5) — the ratio that turns slogans into guarantees.

---

### 08 · Founder-Market-Fit Amplifier

**Aspect & why it decides success.** Don's FOH credibility is latent *distribution*, not just a trust badge. In the operator-creator economy, operator-to-operator trust is the one channel a venture-funded competitor cannot buy — a working manager forwarding a tool to another working manager outperforms any ad (analyst assessment).

**Current-state audit — score 5/10.** The *raw fit* is elite (see brief 03) and the voice canon is built for distribution (blog = first-person Don, "the trusted regular at the bar," `voice-canon-blog.md` §2). The blog dispatches are written to be forwarded ("Someone they trust forwarded it," §2). But the *amplification machinery is thin*: the bio's reach is mostly passive (`/about/`), the founding-list CTA is the main capture, and there's no operator-referral or operator-network loop. `sameAs` lists 10 social profiles (`/receipts/`) but social presence ≠ operator-to-operator distribution. The credibility is parked, not pumped.

**Benchmark gap.** The operator-creator model (a credible practitioner whose audience *is* the distribution) is what Muntin is structurally set up for but hasn't activated. Muntin leads on *authenticity of the operator* (genuinely on the floor, not an ex-operator influencer) and trails badly on *distribution mechanics* — no newsletter-forward incentive, no "operators who use this" social proof loop (which must be real, not fabricated).

**The Extend-Past move.** Turn Don's floor into a *publishing cadence* that compounds: the weekly blog batch (already canon) + the Library Letter become the operator-to-operator channel, and the bio's specificity ("I check these numbers on my own shift") becomes the recurring proof. The asymmetry: a giant's content is written by marketers; Muntin's is written by someone who 86'd the branzino that afternoon. Lean into *real, dated operator moments* as the distribution fuel — the one content a competitor can't manufacture honestly.

**Concrete actions.**
1. Make the Library Letter capture more prominent and operator-framed ("four notes a quarter, no funnels" already exists in the footer, `studio/index.html` line 597) — promote it beyond the footer. **Effort S × Impact 4.**
2. Establish a sustainable from-the-floor cadence in the blog (the `/about/#about-from-the-desk` "From the desk" dated note pattern, line 578–591, is the template) — operator moments, sourced or illustrative-labeled. **Effort M × Impact 4 (ASYMMETRIC).**
3. Add *honest, opt-in* social proof only if real (e.g., public count of tool uses from `/receipts/`) — never fabricated testimonials/cohorts (binding constraint #1). **Effort M × Impact 3.**
4. Cross-link the founder narrative to the founding list so bio-readers convert to the operator channel. **Effort S × Impact 3.**

**Risks & honesty-gate notes.** Highest temptation surface for fabrication: invented testimonials, invented "operators love it" cohorts, or bio drift toward "runs multiple restaurants." All are fail-CI. Operator anecdotes must be real-and-dated or labeled illustrative (`voice-canon-blog.md` §6). Distribution claims ("X operators subscribe") must be sourced from real counts or omitted.

**One proof metric.** Library Letter subscribers + organic/AI-search sessions per week (`/receipts/` KPI #1) — the leading indicator that operator-to-operator distribution is compounding.
