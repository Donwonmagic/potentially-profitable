<!-- The unified, autonomous execution spine for the storefront redesign. Folds the
     reinvention master plan (correctness→prune→re-pigment→retention→trust→content→craft)
     together with the macro design direction locked from the flagship prototype. This is
     the doc the overnight autonomous run follows. Updated as phases move. 2026-07-11. -->

# Storefront redesign — unified execution plan (autonomous run)

**Founder directive (2026-07-11):** "Fold both plans together. Execute the entirety of the
redesign as I sleep, in a cadence of build → audit → iterate, frequently, and continue all
the way through." Macro-first, not piecemeal. Breathe life + personality into the storefront.

**Two plans, folded:**
1. `docs/handoff/reinvention-master-plan.md` — the 7-phase PRUNE→REFOCUS→ELEVATE reinvention.
2. The **macro design direction**, locked from the flagship prototype (artifact "flagship-macro-v1"):
   one unified **app-grade financial design language** + the **one-window-many-panes** personality +
   the **emotional arc** (their world → you can see it coming → who you become → Don, one of them →
   ambient trust). Feeds: `founder-vision.md`, `retention-strategy.md`, `site-reinvention-blueprint.md`.

## The locked macro direction (the thing everything derives from)

- **Design language (unify the site's two split languages onto ONE):** app financial-grade —
  chosen slate-blue-biased neutrals (not default grey), ONE electric-blue accent (#2a50c8 on light /
  #5b82ff on dark, AA-safe), Inter-adjacent UI sans + a **tabular mono that carries the data
  personality** (the price numbers are the hero), dark-first but both themes first-class, hairline
  depth, signature motion (count-up on a real answer, scan sweep, italic-on-commit, the muntin
  grille draw-in). Fraunces/serif stays editorial-only, retired from chrome. Warm-editorial surfaces
  (incl. #501's Vendor Benchmark + Cost Index) become **re-pigment targets** (accent + type via scoped
  token overrides), not rebuilds.
- **Personality = one window, many panes.** The *muntin* (the slim bar between panes) is the brand
  metaphor: separate clear views into your cost world, one frame. Each surface its own register:
  **Market read** (Cost Index) · **Workbench** (free tools — "you leave with a number") ·
  **Reference** (library) · **Cockpit** (Ledger) · **The human** (About / from-the-floor). Coherent
  system, distinct voices — evokes personality "rather than every page looking like the last."
- **Emotion → empowerment → retention → advocacy.** The site is about the OPERATOR and how they feel
  (a week ahead, calm, in command), NOT about us defending our honesty. Craft delivers the feeling.
- **Trust is AMBIENT.** Stated once, quietly (a single strip: invoices stay yours · pricing in
  writing · public sourced index · export anytime). NEVER a defensive headline or section. Honesty
  is the foundation we stand on, not the flag on every wall.
- **Guardrails (never broken):** the absolute fact/honesty gate (zero fabricated numbers/cohorts/
  testimonials), EN↔ES parity, performance budgets, a11y, the ~258 CI gates, slugs-are-final.

## Execution order (macro → micro). Each item = build → audit (adversarial/expert) → iterate → commit+push.

**PHASE 0 — correctness/honesty (finish; precondition).**
- ✅ Tool dead-navs + Tesseract-CDN OCR (`3be5e1d82`), escalate repoints (`29343de52`), forms
  fabricated-success (`15528ae7a`).
- ☐ Generator-owned pages still carry the old forms handler (cost-index/*, /open/*, ES) — fix in the
  template pass (their generators re-embed the footer).
- ☐ Cost-index cadence contradiction → monthly everywhere; kill the stale-anchor open.
- ☐ `/security/` claim-count + schema bugs; audit-found fact defects.

**PHASE A — lock the macro design system (the foundation).**
- ☐ Iterate the flagship prototype to v2 on the panel's findings; land the FINAL macro direction.
- ☐ Extract the unified token system + component vocabulary into a concrete, buildable spec that maps
  onto the live `assets/site.css` source (a re-pigment token layer + the pane-register system).

**PHASE B — the flagship (home), live.** Cascade the locked direction into `index.html` + `es/index.html`:
hero-as-instrument, the emotional arc, one-window-many-panes, ambient-trust strip, honest CTAs.

**PHASE C — pane archetypes (re-pigment + register each to the unified language):**
Market read (`/cost-index/` + Vendor Benchmark) · Workbench (`/tools/*`) · Reference (`/library/`) ·
Cockpit (`/ledger/`) · Human (`/about/`, `/methods/`, `/window/`). One representative per register
first (build the pattern), then propagate via the generators/shells.

**PHASE D — components + details + the long tail.** Nav/footer chrome freshness (the deferred stale
footers), card/table/figure components, the generated corpora via their builders, motion polish,
a11y sweep, the "Zero requests fire" honesty reconciliation, the Invoice-Decoder feature decision.

## Autonomous-run protocol
- One increment at a time; adversarial/expert agent(s) audit before commit; iterate on real findings.
- Commit + push every increment (branch `claude/muntin-strategic-council-exsghc`). No PR unless asked.
- Update the strategic-council board's top block after each increment so a fresh context can resume.
- Re-arm self-continuation each cycle so the loop survives idle gaps overnight.
- Stop conditions: a genuine fork that needs the founder's call (surface it, keep moving on other
  tracks), a gate that can't be honestly satisfied, or the plan is exhausted.
