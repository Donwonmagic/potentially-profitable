# Cost Index — Methodology Hardening Plan (2026-06-15)

Synthesis of a three-specialist methodology review (confidence aggregation, price-level
& bridge economics, projection/calibration/uncertainty). Each read the real code
(`composite-price.js`, `cost-confidence.js`, `pressure-calibrate.js`) and benchmarked
it against established practice. The goal the founder named: *methodologically* increase
confidence in muntin's projections — stronger reasoning, not more inputs.

## The one systemic finding (all three agree)
**The honesty *architecture* is strong and ahead of most public price products** — keep
it. The level/trend split, the measured/derived/absent spine, de-correlation by family
(6 AMS terminals = 1 methodology), and the pressure engine that *has no price field at
all* (a fabricated number is structurally impossible) are all the right instincts.

**But confidence and bands are ASSERTED, not EARNED.** They are computed from
input-counting rules and never reconciled against what prices actually did next:
- The published **band** is descriptive *dispersion of the inputs* (p25–p75 of market
  medians, a MAD volatility band) — it is **never scored for coverage**. A band that has
  never been checked against an outcome is a decoration, not an interval. The methodology
  page's own §7 standard ("the band is the relationship's error") is not met on the front page.
- The **confidence label** ("medium"/"high") is a statement about source agreement —
  **never verified as a frequency.** "Medium" is asserted by construction; nothing checks
  whether medium-labelled reads verify at a medium rate.
- **Disagreement and staleness don't lower confidence** the way they should. Dates are
  carried in provenance and thrown away (a 3-week-old "high" scores like a same-day one);
  source disagreement is a one-sided tripwire, never a symmetric downgrade.

**The fix is one coherent idea:** make every confidence claim *verifiable*, and make
disagreement/staleness *lower* it. Nothing below manufactures certainty — each upgrade
either turns an assertion into a measured, published rate, or adds a new way to *lose*
confidence. That property is exactly what makes the index quotable in AI/search: a band
that says "covered 79% of the last 52 prints" and a label that says "medium has verified
71% of the time (N=34)" cannot be argued with.

---

## Ranked build plan

### Tier 1 — Convert assertion into verification (the core of the ask)
**1. Coverage-validated bands (conformal).** Replace/augment the descriptive band with a
time-series conformal interval — **EnbPI** or **Adaptive Conformal Inference (ACI)** on the
next-print change (distribution-free, no exchangeability assumption, ACI auto-adjusts the
rate under regime shift). Add `check-band-coverage.mjs`: a rolling backtest that asserts
realized coverage ≈ nominal and **fails CI** when a published band drifts below its claim.
Publish the coverage number beside the band. *Single highest-value change — all three
specialists point here.* Honest caveat to state: conformal bands lose coverage at abrupt
breaks — so widen them and report coverage *per regime*.

**2. Calibration loop + reliability diagram.** Log the stated confidence label AND band
edges with every call (`pressure-history.json` already logs direction/realized — extend it).
Score against the next realized print: per-label realized hit-rate, per-band realized
coverage. Publish the **reliability diagram** (stated vs. observed frequency; on the
diagonal = calibrated) + Brier-decomposed resolution on the methodology page. Then let
**empirical reliability CAP the asserted label** (mirror the existing `overstated==0`
discipline, but driven by outcomes, not input rules). This is what makes "medium" *earned*.
Until N is large enough, the honest label is "provisional — N=k, rate not yet verified."

### Tier 2 — Make the confidence model principled (GRADE + pooling + staleness)
**3. Staleness penalty (the biggest quotable hole).** Add an explicit `ageDays` downgrade
to level AND trend confidence (e.g. ≤10d = 0, 11–21d = −1 step, >21d = −2 → low), thresholds
registered in the canon and printed on the card. Add "not stale" to the ship bar.

**4. GRADE-style "ceiling minus named downgrades"** replacing the count-gate as the *frame*.
Keep `nTypes ≥ 2` as the **ceiling/moat** (the independence floor), but make **agreement,
precision, and staleness first-class numeric downgrades** (GRADE's structure: start high,
subtract for inconsistency/imprecision/indirectness). Ship **two headline grades** ("high
on price, medium on direction"); reserve `min(level,trend)` for one explicit interlock,
not the general headline.

**5. Inverse-variance pooling of the level.** Pool per-type medians weighted by `1/spread²`
so a tight, fresh source rightly dominates two vague ones (fixes "2 mediocre > 1 excellent").
Exposes `relSE` → an **imprecision downgrade** (`relSE > 0.20` → −1 step). Replace the single
`typeDispersion > 0.15` cliff with a **graded** inconsistency table.

**6. Symmetric disagreement downgrade.** Disagreement (cross-type, cross-market, *cross-chain*)
must actively *lower* confidence and *widen the band* — never silently pick a winner.
Generalize the existing `typeDispersion` cap to any two reconciled chain points, using the
bridge's own residual spread `σ_r` as the threshold.

**7. Effective-independent-source count `n_eff`.** Turn the family/type distinction into a
measured statistic: `n_eff = (Σw)²/Σw²` (or eigenvalue-based) on the source correlation
matrix, so "8 AMS terminals" counts as ≈1–2 independent looks. Makes the moat quantitative;
add an **independent-source-disagreement data-integrity alarm** (two methodologically
independent sources diverging > historical spread = a mis-parse/unit/stale-series gate).

### Tier 3 — Make the bridge & forward layer rigorous
**8. Rigorous ratio-bridge.** Replace the undefined "bounded residual variance" stability
gate with a **stationarity test on the log markup ratio** `r_t = log(W_t) − log(X_{t−k})`
(cointegration — a high R² on price *levels* is the Granger–Newbold spurious-regression
trap). Estimate a single lag `k` by max overlap correlation. The derived band becomes the
**empirical residual prediction interval** (conformal-style, distribution-free → captures
the asymmetric "rockets-and-feathers" passthrough), unioned with input dispersion + inflated
for n. Reconcile non-reference sources to one declared reference basis via the measured
margin (USDA-ERS Meat Price Spreads model), precision-weighted — don't discard them by
priority. **Cross-chain agreement *through a validated bridge* (`|d| = |logW−logŴ|/σ_r ≤ 1`)
is the honest path to `high`** the canon adopted; raw cross-basis agreement without the
proven link is not. Require a registered causal mechanism per bridge (auditable, not editorial).

**9. Forward-layer multiplicity + walk-forward + refutation log.**
- Count the *full* search space (items × indicators × transforms × resolutions) when
  reporting FDR, not just the rows BH sees; add a **Benjamini–Yekutieli** mode (shared
  drivers break BH's PRDS assumption) and a **deflated-significance** for the "PROVEN" set
  (Bailey–López de Prado: trying many variants and keeping the best inflates the max stat).
- Replace the single 70/30 split with **expanding-window walk-forward** + a **purge/embargo**
  of ≥ `maxLag` around each split (the current single cut makes an episodic edge's OOS
  verdict a coin-flip; boundary rows leak).
- The 19 dropped sign-flips become a **published refutation log** (`data/pressure-refuted.json`:
  "textbook channel +1, 12y data −1, no mechanism → no call") — the §6 `absent`-tier
  philosophy applied to projections. Silently deleting them re-opens the multiple-testing
  door BH closed and hides the honest "we can't project this."

---

## Keep — do not touch
- The **level/trend split** and **dual-confidence** modules (the right instinct).
- **De-correlation by family/type** (genuinely the strongest part).
- The **pressure engine's no-price-field wall** — the load-bearing honesty mechanism. Every
  upgrade lives in labels/bands/gates, never by letting the forward layer emit a number.
- The measured/derived/absent spine; the noise self-cap; the existing strong calibration
  guards (HAC/Newey–West SEs, BH, frozen-on-train lag, N-gate, overstated==0).

## Don't over-build (rigor theater to avoid)
Full hedonic quality adjustment, the BLS FD-ID demand tree, X-13 seasonal adjustment,
superlative (Fisher/Törnqvist) index formulas, a full VECM. We publish *per-item levels*,
not an aggregate index number, so most index-number machinery doesn't apply.

## The reframe for the published methodology page
Every confidence word should eventually carry a sample size and a realized rate behind it.
The maximally honest, maximally citable asset is a **reliability diagram on the diagonal +
a band-coverage number** — "medium means medium, and here's the proof." That is the thing
that out-reasons Urner Barry: not more sources, but *verified* confidence.

## Established practice leaned on (for the methodology page citations)
- **GRADE** certainty framework (ceiling minus named downgrades) — confidence structure.
- **Inverse-variance meta-analysis** + Cochran's Q / I² — pooling & agreement.
- **Conformal prediction** (EnbPI, ACI) + **reliability diagrams / Brier decomposition** —
  honest, coverage-validated bands and calibrated labels.
- **Cointegration / Granger–Newbold**, **asymmetric price transmission** (rockets-and-feathers),
  **USDA-ERS Meat Price Spreads**, **BLS PPI overlap-linking** — the bridge & level economics.
- **Benjamini–Yekutieli**, **Deflated Sharpe / FDR-in-finance**, **purged/walk-forward CV** —
  the forward-layer multiplicity & validation.
