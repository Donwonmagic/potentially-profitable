<!-- The storefront reinvention blueprint — synthesis of the 12-agent
     re-evaluation (competitor teardowns + full site audit + design-lead
     blueprint + completeness critique), with the founder vision + PR #501
     coordination folded in. Durable source of truth. Not web-routable.
     2026-07-11. Full raw agent outputs were in the workflow task result. -->

# Muntin storefront reinvention — blueprint

Grounding: `docs/handoff/founder-vision.md` (the mandate + the empowerment→advocacy
engine). North-star tokens: `Muntin-Invoice-Decoder/packages/ui/tokens.css`. Proven
migration recipe: `ledger/demo/index.html` (this session's incr. E/F).

## 1. Thesis

Muntin reads as **more trustworthy than MarginEdge / R365 / Toast** because it does the
one thing they structurally can't: it **shows its work at the moment of every claim** —
a market read graded against its own miss rate, numbers traceable to a dated public
report, code you can read, a network tab you can watch stay empty, one named operator who
answers in four hours. The incumbents *aggregate and rent* trust (crowd counts, logo
walls, certs-behind-NDA, agency rebrands over dated apps); Muntin *earns and demonstrates*
it, first-person, on the pixel. The site isn't emotionless because the substance is
missing — that world-class substance is **stranded in gray body text, run through the
retired cream/serif/teal editorial system**, while the PII proof sits one paragraph deep
or one domain away. Fix: make the rigor **legible as craft on every touchpoint**, and move
the human + the receipts to the point of decision.

**The distinctiveness correction (critical — do not skip):** slate + electric-blue +
Inter + tabular-nums + dark-first IS the generic Linear/Vercel/Stripe/Ramp house style.
Adopting it wins *consistency* but not *recognizability* — a lateral move on "emotionless."
Muntin's **ownable** identity, which no incumbent can copy, is two things:
1. **The muntin / window-grille motif** (`mun-pane`, the four panes) — promote it from a
   400ms load flourish to the **structural layout grammar**: the grille as the actual
   section/grid divider system, hairline mullions as the depth language.
2. **Published failure as visual identity** — the self-graded miss rate, the *withheld*
   week-over-week, the failing-build chip. Make these designed signature moments, not gray
   sentences. Everything else (Cmd+K, scan, count-up, dark mode) is table stakes we match;
   the grille + graded honesty is how the site reads as *Muntin*, not a Linear clone.

This is also the empowerment engine: an operator using a tool that *shows its own miss
rate and hides nothing* feels they're holding the sharpest, most honest instrument in the
room — the feeling that drives retention and advocacy.

## 2. How they got there → how we match → how we surpass (condensed)

| Dimension | Leaders' standard | Match | Surpass |
|---|---|---|---|
| Design craft | Toast: governed published design system, licensed Effra, 14 yrs of systematization | Adopt the app's `tokens.css` system site-wide (one slate ramp, one electric-blue accent, Inter+mono, tabular numerics, hairline depth) | **One system across *every* surface** + the grille-as-grammar signature; incumbents' tell is a glossy brochure over a dated app |
| Trust signalling | scale-as-proof (40k/156k restaurants), logo walls, review badges | named, role-attributed, sourced proof; the 43-row claim ledger | **verifiable-in-30-seconds** beats an inert badge: self-graded Cost Index (77% realized vs 80% target / 4,588 reads), CC0 data, SHA-256 hashes, RFC 9116, **published miss rate** |
| PII / security | Trust Center subdomains (SafeBase/Vanta), SOC2/ISO/PCI-behind-NDA, subprocessor lists | ship a real designed trust destination; encryption/retention/deletion/breach SLA in owner language; SOC2 as honest "in progress" | **the no-LLM CI build-gate as a hero artifact** (the claim no incumbent can make), two-lane framing (free tools hold nothing / Ledger holds data — here's how) |
| Technical credibility | Stripe/Vercel/Linear: docs-as-proof, tabular numerals, Cmd+K, dark-first | tabular-nums on data, Geist Mono on data, methodology like API docs, Cmd+K | **live (build-baked) real data** where incumbents screenshot; provenance + "download this figure's CSV" on every figure; performance as a stated feature |
| Emotion | Toast: humanist Effra + real-staff photos; MarginEdge "by restaurateurs" | Don on the company page, first-person, face, 4-hour promise | **a reachable, named, gated operator on the floor** — the one lever a 40-person marketing team can't pull |
| Motion | Linear discipline: 100–240ms, linear, no bounce, skeletons | retune 420/900ms → 120/180/240/320ms, `--ease-emphasis`, no bounce | signature motifs that **preview the product** (window-load, italic-on-commit, scan, bbox), compositor-only, reduced-motion-gated |

## 3. The new site-wide design language

**Governing move:** extend `tokens.css`; **alias** existing storefront token names to the
app's semantics so the whole site re-pigments with near-zero structural risk (the demo
incr. E proof). Do not invent a parallel palette.

- **Colour:** cool slate ramp does ~90% of surface work; **one** electric-blue accent
  `#3b68f5`(light)/`#5b82ff`(dark) as punctuation. Retire warm teal `#2A50C8` as the accent
  (survives only as `--accent-text`). **KILL the warm layer** (goldenhour gradient, marigold
  `#FFB020`, coral, amber, peach commit-italic, `#FAF7F2` chrome off-white, stray green
  upsell). Status/money colours (success/warning/danger) reserved, never decorative; map
  Cost Index hold/watch/re-price to semantic tokens.
  - **Contrast (critique fix — mandatory):** `#3b68f5` on white ≈ 3.7:1, **below AA** — small-text
    links must use `--accent-text #2a50c8`; reserve `#3b68f5` for fills/large/dark. State every
    pairing. **Status must not rely on hue alone** (CVD) — add a sign/glyph/shape to every
    verdict + pos/neg delta.
  - **Dark-first is canon** — `site-article.css` currently has ZERO dark rules and hardcodes
    gold/green; ship a real dark pass so the `viz-*` families are pixel-perfect both themes.
- **Type:** Inter body/chrome; **serif (Fraunces) demoted to editorial only** (library/blog
  long-form + About origin narrative). Move nav logo, footer headings, tool/price figures to
  Inter — "$19 in serif reads boutique; in tabular Inter it reads software." Display at
  instrument scale (`clamp(32,5vw,52)`), not billboard 84px.
  - **Tabular numerics (critique fix):** `tabular-nums lining-nums` on **data surfaces**
    (basket, tool outputs, prices, counts, dates) — **NOT** a body-prose default (degrades
    running text). Geist Mono for dense data columns + code.
  - Tokenize the ~9 inline heading clamps copy-pasted across ~300 files into named classes.
- **Spacing/grid/radii:** import the 4px/8px scale; three width measures (narrow 560 / prose
  760 / wide 1200); buttons → `radius-sm 6px` rects (retire 999px pills; pills survive for
  chips/status). **Grille-as-grammar:** use the muntin mullion as the section/divider system.
- **Motion:** fast, linear, no bounce; `--dur 120/180/240/320`; kill the ~1.5s hero draw;
  skeletons not spinners; all motion → 0ms under reduced-motion.
- **Signature motifs generalised:** window (`mun-pane`) on the hero data reveal + Ledger
  "reading an invoice"; italic-on-commit on Cost Index movers/tool commits; scan (1150ms) on
  the Ledger hero to *show* "rules, not a model"; bbox in the invoice-journey diagram;
  tabular numerics as the ambient signature.
- **Imagery/viz:** retire hand-drawn paper vignettes + fake line-marks; lead with the **real
  instrument** (build-baked Cost Index / Ledger render). Make `viz-*` flawless both themes,
  add scroll-draw + count-up (compositor-only) + a "download this figure's CSV" affordance.

## 4. Trust + PII competence strategy

Elevation from **design + density, not louder copy** (voice contract bans "world-class",
exclamation, fake-team "we"). Turn gate discipline into the design language — every trust
visual is a cited, narrated, inspectable figure.

- **Two-lane reframe** on `/security/` + `/trust/`: free tools/sheets *hold nothing* (verify
  in DevTools) vs Ledger/Workshop/billing *hold real data — here's exactly how*. **Pull the
  Ledger `/promises` PII proof on-site** (today it's one link to another domain — the site
  fails its own "privacy claim at the point of input" test for the one product that ingests PII).
- **Reusable trust-viz vocabulary** (on `viz-flow`): invoice-journey (upload → TLS → no-LLM
  CI-gated extraction → AES-256 store → dashboard → one-click delete+proof); "who can touch
  your data" (one named operator, admin MFA, no third-party human access, named subprocessors);
  encryption panel; deletion/export/continuity panel.
- **Honest seal strip** — designed to the incumbents' visual bar, but **every seal links to
  its proof**: Verifiable-in-DevTools, Cookieless, CC0, SHA-256, RFC 9116, **No-LLM CI gate**,
  72h breach notice. **New levers the critique surfaced:** the **already-shipped CSP/HSTS/
  security headers** in `_headers` (a 30-second DevTools artifact — the CSP itself proves the
  tiny first-party dependency graph); a link to the **public GitHub Actions run** of the no-LLM
  gate (not a screenshot); **SPF/DKIM/DMARC** (publicly checkable anti-spoofing); data-residency
  / hosting region; a **WCAG conformance statement**; incident history/postmortems on `/status/`.
- **No-LLM build-gate = hero artifact** (check-script name + green tick + honestly-labeled
  failing-build state) — the single most differentiated PII claim.
- **Real `/status/` board** (live Cost-Index last-refresh, gate state, backtest calibration,
  uptime) — but **measured, never asserted** (a published SLA you don't measure is the exact
  lie the company exists not to tell).
- **Legal layer:** DPA download + data-subject-rights (access/export/delete) block; surface
  the buried 72h breach / Maryland PIPA-45d commitment.
- **Reconcile `feed-llm.json` vs "no LLM reads your documents"** with one line (public content
  feed ≠ private-doc processing) before a skeptic screenshots it.
- **Per-capture cues:** every tool/form/sign-in/checkout gets point-of-capture microcopy +
  lock glyph + real link. **P0 defect:** the founding-list + newsletter handlers flip to
  success on *any* resolved response and swallow errors — a form that fabricates "check your
  inbox" on a 500 is off-brand for an honesty company. Rewrite to the `window.js` gold standard
  (check `res.ok`+body, real error element, `aria-busy`, in-flight guard, 303 → styled
  `/thanks/` on no-JS).
- **Precision fixes:** `/security/` miscounts its own claims (H2 "ten" vs headline "nine" vs
  ItemList 9→11); `/trust/` `WebPage` schema description is the AI page's text.

## 5. Emotion strategy

Flatness is a **distribution** failure, not a voice failure — the warmth exists (About:
"I re-price a plate at 4pm because lunch 86'd the branzino"); move it to the decision.
1. Founder band on `/studio/`: real headshot (`/about/portrait/don.avif`, unused there),
   first-person one-liner, `— Don` signature, 4-hour promise; add Don to JSON-LD (`#person-don`).
2. Lead the honesty story once with human stakes (why an invented number burns an operator).
3. Answer the PII objection **with a person** (one named operator on the LLC) — convert the
   one-person *scale weakness* into a *trust strength*.
4. Promote the `/system/` colophon into a designed "I built this myself — the craft is the
   résumé for handling your data" band with true proof chips.
5. **Confidence via restraint** (one accent as punctuation, tabular numerics, no-bounce motion)
   = the calm-authority register that actually answers "emotionless."
Guardrails: no invented testimonials/cohorts/restaurants/percentages; keep the "two locations,
one brand" Tacombi discipline; fix the emotion leaks (stale April-2026 note, the retired
"Google search into your dining room" metaphor, `/learn/` "book a call" vs the async model).

## 6. Phased roadmap (each phase independently shippable + gate-clean)

**Phase 0 — Correctness & precision (~1 day, pure trust wins, near-zero design risk).**
Fix the fire-and-forget form handlers (stop fabricating success) + no-JS `/thanks/`; renumber
`/security/` claims; fix `/trust/` schema; surface 72h/PIPA; fix the stale dated note + `/learn/`
"book a call." *An honesty company shipping a form that lies is the most damaging live defect.*

**Phase 1 — The one-move re-pigment (highest leverage; answers "emotionless" in one change).**
Retarget `--teal→#3b68f5` (+dark `#5b82ff`), `theme-color`, both critical-CSS copies; alias
storefront tokens to `tokens.css`; tabular-nums on **data surfaces**; Geist Mono on data; kill
the warm layer; port the demo recipe to `ledger/`, `cost-index/`, `tools/`; retune motion.
**Critique fold-in — do these IN Phase 1 (existing surfaces, else stranded):** re-render the
**287 `/brand/og/` cards**, `404.html`+`es/404.html`, the **dispatch email templates** (+ dark-mode
email), the **print** stylesheets, the **favicon/manifest** set. Apply the contrast-pairing +
CVD spec + tabular-nums scoping *before* pigment lands. Watch CLS on font/numeric swap; hold
locale parity. **Includes re-pigmenting #501's Vendor Benchmark + Cost Index once merged.**

**Phase 2 — Make the proof visible.** Live (**build-baked, honestly dated** — resolves the
"network stays empty" contradiction) Cost Index instrument in the home hero; stances → scorecard/
gauge row; calibration → hero gauge + basket sparkline; no-LLM gate → designed artifact;
"Network tab stays empty" → reused signature; founding offer → price object. Design the
**withheld-WoW** and **refresh-failed** states as signature honesty moments. **ES home-hero
fallback** required (Cost Index dispatch is EN-only → parity break otherwise).

**Phase 3 — The trust destination (beat the incumbents' Trust Center).** Two-lane `/security/`
+ `/trust/`; Ledger `/promises` on-site; trust-viz vocabulary; clickable seal strip (+ CSP/
headers panel, public CI link, SPF/DKIM/DMARC, data-residency, a11y statement); real measured
`/status/` board + incident history; DPA + data-subject-rights; `/trust/` as visual hub.

**Phase 4 — The human.** Founder band on `/studio/`; PII answered by Don; `/system/` colophon
band; certs header reframed (must not imply data-security certification we don't hold); one
`viz-flow` on `/studio/`; prune dead retired-services CSS.

**Phase 5 — Content-experience polish.** Tokenize the editorial type scale; dark-mode pass on
`viz-*`; glossary integrity repair (120/171 "Used in: Nothing yet" + 404 links); repeatable
proof-component set; curated hub + blog masthead; restrained scroll-draw/count-up.

**Phase 6 — Signature craft & surpass.** Site-wide Cmd+K; window/scan/italic-on-commit on hero +
Ledger + tool results; scroll-draw + count-up + "download CSV" on viz; methodology page as
Stripe-grade reference; performance as a stated feature; unified validation across all forms.

## 7. Invariants (every phase) + coordination

- **Gates:** the ~249 CI checks (`check-all.mjs`) — fabrication blocklist, article-graphics,
  overview quality, image dims/formats/lazy, locale parity, hreflang, cost-index driver +
  editor's-note. Every new number → registered in `sourced-claims.json` + cited via
  `<details class="cite">` + dated (`retrievedAt`, gate warns >365d). **Budget a claims-
  registration + ES-parity line-item per new component** (the trust hub introduces many numbers).
- **EN↔ES parity** on every surface (each new component is 2× work + a parity/hreflang gate risk).
- **Performance** (LCP/CLS — critical CSS, self-hosted variable fonts, no shift); **accessibility**
  (WCAG 2.2 AA, focus ring, reduced-motion, `aria-live`); **mobile-first** (touch targets, thumb
  reach, Cost-Index-first mobile nav, instrument/bento reflow — the owner checks on a phone during
  service). Slugs final-forever. Don't run `sync-includes` in cost-index flows. Don't commit `package.json`.
- **PR #501 coordination:** let it merge (strong Vendor Benchmark + Cost Index work, on the old
  warm system). Its surfaces join the **Phase 1 re-pigment** list; refresh the pre-#501 audit of
  those two surfaces after merge; rebase `claude/muntin-strategic-council-exsghc` onto the new `main`.

## 8. The distinctiveness principle (keep it Muntin, not a Linear clone)

Two things make the system read as *Muntin* and nothing else — protect them in every phase:
**(a) the window-grille as structural grammar** (not a load animation), and **(b) published
failure as the visual identity** (the graded miss rate, the withheld WoW, the failing-build
chip as designed hero moments). Everything else is table stakes we execute flawlessly; these
two are the moat that turns competence into a *recognizable, followable* brand.
