## Domain VIII — Accessibility & Inclusive Design

> Positioning Council, Batch VIII. Strategy briefs only — no live-site edits.
> The asymmetric thesis: the real reader is an immigrant, Spanish-first, often
> low-digital-literacy operator on a phone mid-shift with tired eyes.
> Accessibility + plain language + true ES parity is not compliance here — it is
> the only way to reach the restaurant workforce that ad-density platforms design
> past. We push toward WCAG AAA *where feasible* as a values proof those platforms
> structurally can't match.
>
> **Honesty-gate posture for this whole domain.** The site's published target is
> **WCAG 2.2 AA** (`accessibility.html`, `dateModified` 2026-05-01; `course/accessibility/index.html`).
> No AAA conformance is claimed anywhere, and these briefs do not claim one. All
> contrast figures below are computed (zero-dep, WCAG 2.x formula) from the live
> token values in `data/muntin.tokens.json` / `assets/site.css`, reproducing the
> method in `scripts/check-contrast.mjs`. Everything else is labeled repo-sourced,
> web-sourced (with date), or "illustrative / analyst assessment."
>
> **Standards sources (retrieved 2026-06-16).** WCAG 2.2 became a W3C
> Recommendation Oct 2023; AA contrast 4.5:1 normal / 3:1 large, AAA 7:1 normal /
> 4.5:1 large (W3C SC 1.4.3 / 1.4.6; WebAIM, Contrast & Color). Target Size:
> 2.5.8 Minimum = 24×24 CSS px (AA); 2.5.5 Enhanced = 44×44 CSS px (AAA) (Deque
> University WCAG 2.2; TestParty). Apple HIG: 44×44 pt minimum hit target
> (developer.apple.com/design/human-interface-guidelines). GOV.UK content design:
> write for reading age ~9, sentences < 20 words (ONS Service Manual; Home Office
> Design System, Readability).

---

### 56 · Accessibility Lead (WCAG 2.2 AA → AAA)

**Aspect & why it decides success.** Whether the site's *stated* standard
(AA) and its *actual* build stay locked together — and whether we can credibly
narrate selective AAA wins as the values proof. If the statement over-claims, the
honesty gate that defines the brand is the thing we broke.

**Current-state audit (score 7.5/10).** Real strengths, repo-verified:
`accessibility.html` is a genuine public statement with a 2-business-day SLA, a
"short version" plain-language callout, and an honest "Known Limitations" section;
`course/accessibility/index.html` carries a per-feature status table (ok/partial/gap)
— this is mature posture, not boilerplate. Two enforced contrast gates run in CI
(`check-contrast.mjs`, `check-dark-contrast.mjs`) and lock token values against
drift. WCAG 2.2-specific criteria are addressed: form inputs are `min-height:44px`
(`site.css` ~L1311), `@media (pointer:coarse)` enforces 44px targets in the course
(`course/accessibility/index.html` course-mobile-css), focus-visible rings exist
globally (`site.css` L1496–1507). Gap: the AA *claim* is partly aspirational — no
repo artifact shows a full per-page 2.2 AA audit log, and "Known Limitations" lists
no specific open SCs, so it reads complete when conformance is asserted, not proven.

**Benchmark gap (GOV.UK / Apple).** GOV.UK publishes a dated accessibility
statement naming *specific* non-conformances against named SCs and target fix
dates. Ours is warmer but vaguer; it asserts "we meet 2.2 AA new criteria" without
a tested basis on file.

**The Extend-Past move.** Reframe the statement from a *claim* ("we conform to AA")
to a *ledger* ("here is every SC, its state, and where we exceed it") — the same
receipts-culture the rest of the site runs on, applied to accessibility. Layer a
named, *scoped* AAA badge ("AAA contrast + AAA target size on core reading paths")
that giants optimizing for ad density cannot honestly post.

**Actions.**
1. Build `scripts/check-a11y-ledger.mjs` + `data/a11y-conformance.json`: one row
   per 2.2 SC × surface, state in {meets/partial/gap/n-a}, evidence link. Gate warns
   if the statement's claim outruns the ledger. **(L × 5)**
2. Rewrite `accessibility.html` "Known Limitations" to render *from* that JSON, with
   dated open items (GOV.UK pattern). EN + ES parity required. **(M × 4)**
3. Add a scoped AAA self-assessment for the *reading path only* (article body +
   nav + footer), where AAA is already in reach (see Brief 58), and label it exactly
   that scope — never a blanket "AAA site." **(M × 5)**
4. Wire the ledger check into `check-all.mjs` so the claim can never silently
   exceed reality. **(S × 4)**

**Risks & honesty-gate notes.** The single largest risk in this whole domain is
claiming an AAA level we have not tested across all SCs — AAA includes non-contrast
SCs (sign language, extended audio description, reading level) we have NOT verified.
Every badge must name its scope. Do not let the rewrite imply the *client work* is
AAA; the statement covers the site.

**One proof metric.** % of WCAG 2.2 SCs with a state + evidence link in
`a11y-conformance.json` (target: 100% logged, even where the state is "gap").

---

### 57 · Screen-Reader / AT Specialist

**Aspect & why it decides success.** Whether a non-visual user — including a
low-vision operator running VoiceOver in Spanish — can *complete a task* (read an
article, run a calculator, reach Don), not just perceive that content exists.

**Current-state audit (score 7/10).** Unusually strong for a static site.
Every content figure carries a `data-audio-alt` written as full narration
(≥80 chars, gate-enforced) plus a `<figcaption>` — verified live in
`library/third-party-delivery-comparison/index.html` and four other articles. This
is a deliberate non-visual layer most sites lack. The Margin Math tool is
well-scaffolded: `role="status"` + `aria-live="polite"` results region (L900),
`role="group"` labelled action sets (L882), `aria-label`s throughout
(`tools/margin-math/index.html`). Nav (`_includes/nav.html`) has a skip link,
`aria-label`ed landmarks, `aria-expanded`/`aria-controls` on the menu toggle,
`.sr-only` " (opens in new tab)" on the Instagram link, and `aria-hidden` on
decorative SVGs/pulses. Gaps: `data-audio-alt` is a *custom* attribute — it feeds
the audio pipeline, NOT assistive tech, so a screen reader never reads it; the
visual `<figcaption>` is the only AT-exposed description, and complex viz-* figures
(trees, waterfalls) may under-describe for AT. No evidence of a documented
VoiceOver/NVDA pass; `aria-live` politeness on rapidly-updating calc fields can
over-announce.

**Benchmark gap (GOV.UK / VoiceOver).** GOV.UK ships components with documented
screen-reader test notes per AT (VoiceOver/JAWS/NVDA) and a known-issues list. We
have the markup discipline but not the *tested-with* evidence.

**The Extend-Past move.** We already author full prose narration for every figure
(the `data-audio-alt`). Bridge that asset into AT: give complex figures a visually
hidden long-description that screen readers actually reach — turning our audio
investment into a genuine non-visual *equivalence*, not two parallel layers.

**Actions.**
1. For complex viz-* figures, add an AT-reachable description (`aria-describedby` →
   `.sr-only` block, or `<figcaption>` carrying the full takeaway) so SR users get
   the same content the audio track narrates. Keep body text OUT of attribute
   values (article-graphics rule 8). **(M × 5)**
2. Document a VoiceOver-on-iOS-in-Spanish + NVDA pass for the 3 core templates
   (article, tool, contact) in the conformance ledger; log findings. **(M × 4)** [ASYMMETRIC]
3. Audit `aria-live` regions for over-announcement; debounce calc output and confirm
   `aria-live="polite"` (never `assertive`) on Margin Math. **(S × 3)**
4. Verify every interactive control has an accessible name in BOTH locales (the
   `aria-label`s in `_includes/nav.html` are English-only literals — confirm the ES
   nav partial localizes them). **(S × 4)** [ASYMMETRIC]

**Risks & honesty-gate notes.** `data-audio-alt` must never be conflated with alt
text in any claim — it is narration for the MP3 pipeline, invisible to AT. Don't
state "screen-reader tested" until a logged pass exists. ES `aria-label`s are a
parity item, not optional polish.

**One proof metric.** Task-completion rate in a logged VoiceOver(ES)/NVDA pass
across the 3 core templates (target: 3/3 templates complete end-to-end, 0 blockers).

---

### 58 · Contrast / Vision Specialist

**Aspect & why it decides success.** Whether the brand palette is legible for a
tired operator on a sun-glared phone — and whether we can push the *reading path*
to AAA contrast without abandoning the financial-grade slate+blue identity.

**Current-state audit (score 8/10).** Two CI gates already lock AA in both
themes (`check-contrast.mjs`, `check-dark-contrast.mjs`); dark mode is a principled
token-flip, not an allowlist (`scripts/build-dark-mode.mjs`). Computed ratios from
live tokens (WCAG 2.x; method per `check-contrast.mjs`) — the load-bearing finding
is that the body reading path is **already at AAA**, while the *accent* is the one
thing standing between us and an AAA reading-path claim:

| Pair (light) | Ratio | AA (4.5) | AAA (7) |
|---|---|---|---|
| ink `#16181D` on cream `#F6F7F8` | **16.56:1** | pass | pass |
| ink-soft `#4A4F59` on cream | **7.67:1** | pass | pass |
| teal `#2A50C8` on cream (links) | **6.36:1** | pass | **MISS** |
| teal-dark `#1F3A93` on cream | **9.39:1** | pass | **pass** |
| stone `#6B7280` on cream | 4.51:1 | pass | miss |
| rust `#C42E2E` on cream | 5.18:1 | pass | miss |

Dark mode: ink `#F1EDE5` on `#16181D` = **15.21:1** (AAA); teal `#7AA7FF` on bg =
**7.44:1** (AAA), but on raised cards `#1B1E24` = **7.00:1** — exactly at the AAA
line, i.e. fragile. The course page already ships `@media (prefers-contrast:more)`
to darken body text and invert table headers — a real high-contrast affordance.

**Benchmark gap (WCAG / Stark).** Stark-style audits flag "passes AA, fails AAA"
per element. Our links (`#2A50C8`, 6.36:1) and dark-mode card accent (7.00:1) are
exactly those near-miss cases. We already *own* an AAA-grade blue: `teal-dark`
`#1F3A93` at 9.39:1.

**The Extend-Past move.** Promote the existing AAA-grade `teal-dark` to the
default link/accent-*text* color on reading surfaces (keep `#2A50C8` for large
UI/fills where 3:1/4.5:1 large-text thresholds already pass). One token reassignment
moves the entire body reading path from "AA" to a defensible "AAA contrast,"
brand-intact — a values claim ad-optimized sites won't make because denser palettes
sell better.

**Actions.**
1. On reading surfaces, switch link/accent-text to `teal-dark` `#1F3A93` (9.39:1);
   reserve `#2A50C8` for large text and component fills. Regenerate via the token
   build so both gates re-verify. **(M × 5)** [ASYMMETRIC]
2. Nudge the dark-mode card accent off the 7.00:1 knife-edge (e.g. toward the
   `#9DBEFF` hover token, ~higher ratio) so AAA holds with margin; update the
   `DARK` map in `build-dark-mode.mjs` and re-run `check-dark-contrast.mjs`. **(S × 4)**
3. Extend `check-contrast.mjs` with an AAA tier (7:1 reading path) emitted as a
   *report* line, plus a hard fail for the reading-path link token specifically. **(M × 5)**
4. Propagate `@media (prefers-contrast:more)` from the course page to the global
   stylesheet (boost `stone`/`ink-soft` to `ink`, strengthen hairlines). **(M × 4)**
5. Add a non-color status channel everywhere status color is used (icon/text), so
   color-blind operators aren't reliant on the green/amber/red `ok/partial/gap`
   cells. **(S × 4)**

**Risks & honesty-gate notes.** Claim AAA only for the *named reading path*, not
the whole UI — large text and fills legitimately sit at AA thresholds and that's
compliant, not a defect. `stone` at 4.51:1 is a real AA floor: do not use it for
long-form body copy. Re-pigment must not break the tokens-parity guard with the
Ledger product (`check-tokens-parity.mjs`); `teal-dark` is already an
editorial-specific token, so reassigning its *usage* is safe.

**One proof metric.** % of reading-path text/link pairs (article body, nav, footer)
at ≥7:1 in both themes (target: 100%, up from links currently at 6.36:1).

---

### 59 · Cognitive-Load / Plain-Language Lead

**Aspect & why it decides success.** A stressed, low-digital-literacy operator
reading on a phone mid-shift abandons anything that feels like homework. Clarity is
the difference between "this helped" and a closed tab — in BOTH languages.

**Current-state audit (score 6.5/10).** The voice canon already bans jargon and
governs CTA language (`/methods/` #voice-contract; `docs/voice-canon-*.md`), and
the accessibility statement's "short version" callout is a model plain-language
pattern. The glossary (150 terms) + autolink system means jargon is *defined*
in-context. But there is no *measured* readability floor: no gate checks sentence
length or reading grade, and the financial subject matter (prime cost, break-even,
commission tiers — see Margin Math FAQ) trends well above GOV.UK's reading-age-9
target. The Spanish surfaces inherit English sentence structure via translation,
which often *raises* complexity rather than lowering it.

**Benchmark gap (GOV.UK plain English).** GOV.UK writes for reading age ~9,
sentences < 20 words, simple words over complex (ONS Service Manual; Home Office
Readability, retrieved 2026-06-16). We have a banned-words list but no
reading-level target and no measurement.

**The Extend-Past move.** Make plain language *measured*, not just aspirational —
a warn-first readability gate keyed to the actual audience, applied to ES on its own
terms (Spanish readability metric, not an English one applied blindly). Lead each
long article and tool with a GOV.UK-style "short version" summary box, mirrored in
ES, so an exhausted reader gets the answer before the depth.

**Actions.**
1. Add `scripts/check-readability.mjs` (warn-first): flag article/tool intros and
   the accessibility/legal pages above a target grade; report sentence-length
   outliers (>25 words). Tune thresholds to subject matter, not a blanket 9. **(L × 4)**
2. Standardize a "short version" summary box at the top of long library articles +
   each tool, EN and ES, ≤ 3 sentences (extends the existing `accessibility.html`
   pattern). **(M × 5)** [ASYMMETRIC]
3. Run the ES readability check with a Spanish-appropriate metric (e.g.
   Fernández-Huerta / INFLESZ family) — never score Spanish with an English
   formula. **(M × 4)** [ASYMMETRIC]
4. Add a "define-on-first-use" lint: any glossary term's first article appearance
   should carry the autolink, so jargon is always one tap from a definition. **(S × 3)**

**Risks & honesty-gate notes.** Readability gate is warn-first — never auto-rewrite
prose (the voice canon and fact gate govern wording; a rewrite could strip a cited
number or break the singular-operator bio). Plain-language edits must preserve every
sourced claim and the `<details class="cite">` drawers. ES is not "English, shorter"
— it gets its own measurement.

**One proof metric.** Median reading grade of article/tool intro paragraphs, EN +
ES, trending toward the audience target (illustrative target: ≤ grade 8), tracked
per release.

---

### 60 · Motor / Tap-Target Specialist

**Aspect & why it decides success.** The operator's hands are wet, greasy, cold,
and moving; the phone is one-handed. A 24px target is "compliant"; a 44px target is
*usable* in a working kitchen. This is where AA and AAA diverge in felt experience.

**Current-state audit (score 7.5/10).** Already ahead of AA. Form inputs are
`min-height:44px` (`site.css` ~L1311); the nav hamburger is an explicit
`width:44px;height:44px` (critical CSS, `_includes/nav.html` context); the course
page enforces `@media (pointer:coarse){…min-height:44px}` across pagers, buttons,
track tiles, and bumps drag handles / palette swatches to 44–56px on small screens
(`course/accessibility/index.html`). It also pairs targets with
`prefers-reduced-motion`-gated active states. So the *44px (AAA 2.5.5)* bar is
already met in several key places — a real foundation. Gaps: the 44px discipline is
applied per-surface, not site-wide; dense link clusters (footer nav columns
`_includes/footer.html`, breadcrumb, inline body links, glossary autolinks) likely
fail 2.5.8 spacing on a phone; no gate verifies target size, so it can regress
silently like the dark-contrast bug did.

**Benchmark gap (Apple HIG / Material).** Apple HIG: 44×44 pt minimum
(developer.apple.com/design/human-interface-guidelines, retrieved 2026-06-16);
Material uses 48dp. We hit 44 in places but have no enforcement and inconsistent
coverage in dense link areas.

**The Extend-Past move.** Adopt 44px (AAA 2.5.5 Enhanced) as the *site-wide default*
for every interactive target — not the 24px AA floor — and prove it with a gate.
"Usable with greasy hands" becomes a stated, enforced standard, the opposite of
ad-dense layouts that pack tiny tappable inventory.

**Actions.**
1. Add a base rule: all `a`/`button`/`[role=button]`/form controls get a
   min 44×44 hit area site-wide (padding or `::before` hit-expansion where layout
   forbids growth). Promote the course's `@media (pointer:coarse)` block toward a
   global default. **(M × 5)** [ASYMMETRIC]
2. Build `scripts/check-tap-targets.mjs` (static heuristic over rendered HTML/CSS):
   flag interactive elements whose computed box < 24px (hard fail, AA) and < 44px
   (warn, AAA target). Wire into `check-all.mjs`. **(L × 4)**
3. Fix dense clusters: footer columns, breadcrumb, inline/glossary autolinks — add
   vertical padding / line-height so spacing meets 2.5.8. **(M × 4)**
4. Keep the mobile sticky CTA bar buttons (`mobile-cta-bar`, `_includes/footer.html`)
   ≥ 44px and confirm thumb-zone placement. **(S × 3)** [ASYMMETRIC]

**Risks & honesty-gate notes.** Don't claim "AAA target size" site-wide until the
gate is green everywhere — today it's true on the course/forms, not yet on dense
link clusters; state the scope. Hit-area expansion must not create overlapping
targets (a 2.5.8 failure of a different kind). No fabricated "tested with N
operators" claims.

**One proof metric.** % of interactive targets ≥ 44×44px site-wide per the new gate
(target: ≥ 95%; 100% ≥ 24px AA floor as the hard gate).

---

### 61 · Inclusive-Design Researcher

**Aspect & why it decides success.** This is the domain's keystone. If the design
doesn't actually fit an immigrant, Spanish-first, low-digital-literacy operator on a
phone mid-shift, every other brief optimizes for the wrong person. Reaching the real
restaurant workforce IS the differentiated market position.

**Current-state audit (score 7/10).** The infrastructure for this audience is
genuinely unusual and largely real: full EN↔ES parity on most surfaces with an
enforced gate (`check-locale-parity.mjs`, `check-hreflang-orphans.mjs`); an opt-in
Spanish banner that speaks Spanish to Spanish-browser visitors and remembers the
choice (`_includes/nav.html` `#langHint`); audio narration in six languages
(en/es/fr/it/pt/zh) so a low-literacy or eyes-busy operator can *listen*; privacy-
first, account-free, client-side tools with no sign-up wall (`tools/margin-math/`).
This is a stack designed around the thesis audience, not retrofitted. Gaps: fr/it/pt/zh
are audio-only (no text parity) — a partial, not full, inclusion for those readers;
no logged research with actual operators (everything is inferred); the ES experience
depends on translation quality that isn't measured for *clarity* (see Brief 59); and
nav `aria-label`s are English literals (Brief 57) — a parity seam.

**Benchmark gap (GOV.UK / Airbnb).** GOV.UK and Airbnb run documented inclusive-
design research with users at the margins and publish what they changed. Our
audience-fit is *designed-for* and credible, but *assumed* — no field evidence on
file, which is itself an honesty-gate exposure if we ever claim "built with
operators."

**The Extend-Past move.** Turn the implicit thesis into an explicit, evidenced
design principle: a published "who this is for" inclusive-design note + a lightweight,
privacy-clean operator-feedback loop, so the audience-fit is demonstrated, not just
asserted — the proof a platform monetizing attention can't replicate because its
actual customer is the advertiser, not the operator.

**Actions.**
1. Write a one-page inclusive-design principle (the thesis audience, the constraints:
   phone, mid-shift, ES-first, low-digital-literacy) into `docs/` as a binding design
   canon other briefs cite. **(S × 5)** [ASYMMETRIC]
2. Add a privacy-clean, no-PII feedback affordance on tools/articles ("was this
   clear?" — bucketed, client-side, no raw text stored) to gather real signal in EN
   and ES. **(M × 4)** [ASYMMETRIC]
3. Decide and *state* the fr/it/pt/zh posture: either commit to text parity or label
   them explicitly "audio-only" in the conformance ledger so the limitation is honest. **(S × 4)**
4. Recruit a small, consented operator panel (paid, disclosed) for one task-based
   usability pass in Spanish on a phone; log it for the ledger. **(L × 5)** [ASYMMETRIC]
5. Validate the opt-in Spanish banner actually fires for `navigator.languages`
   Spanish users and respects the dismiss/cookie state across the 3 core templates. **(S × 3)**

**Risks & honesty-gate notes.** Never claim "designed/tested with immigrant
operators" until a logged, consented pass exists — until then the framing is
"designed *for*," which is honest. Any feedback mechanism must stay PII-clean and
client-side to survive the privacy-first constraint and the static/Cloudflare model.
The singular-operator bio holds in any new ES copy. fr/it/pt/zh audio-only must be
labeled, not implied as full support.

**One proof metric.** Whether ≥ 1 consented, logged operator-in-Spanish usability
pass exists per release cycle, and the # of changes shipped from it (target: ≥ 1
pass, ≥ 3 changes) — moving the thesis from asserted to evidenced.

---

*End Domain VIII. Cross-domain dependencies: contrast re-pigment (Brief 58) touches
the Brand/Design-System domain via the Ledger tokens-parity guard; the readability +
inclusive-design canons (59, 61) bind the Editorial/Voice domain; the conformance
ledger (56) is the artifact the Trust/Receipts domain should surface publicly.*
