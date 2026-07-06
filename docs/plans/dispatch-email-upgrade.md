# Dispatch email upgrade — build-ready plan

**Date:** 2026-07-06. **Status:** approved-for-build pending founder picks (§3 fork, PR timing).
**Provenance:** 14-agent panel workflow (ground → 7 expert seats → synthesis → 3 adversarial
verdicts) + 2 founder-requested supplemental seats (data-viz-for-email, statistician /
uncertainty-communication). Every file:line claim in §2 was re-verified against committed code
by the adversarial pass; the §3 gated-flag counts were re-derived by hand from
`data/cost-index.json` before this doc was written.

**Governing requirement (founder, 2026-07-06):** the email leads with the biggest stories that
specifically CHANGED in the past week, framed so an operator can act — reprice, renegotiate,
substitute, lock/float, or explicitly hold. Not a digest: a decision brief. Actionable and
honest stay coupled — on a quiet week the honest lead is "hold, and here's why," stated with
confidence, because *do nothing, and know why* is also an operator decision.

---

## 0. North star

A 90-second, phone-first instrument reading of the measured week — Don's complete standalone
briefing in which a tired operator between tickets can name the read, see the one move
(dollar-grounded, persistence-counted), and act or put the phone down. Every number is
byte-traceable to that week's frozen CC0 snapshot and enforced by a golden-render CI gate
(the email's first — the templates sit outside every gate today). Delivery keeps exactly the
promise the signup form sold. Retention is earned by honest continuity — set-membership diffs
against the editions spine, the calibration miss-rate published weekly, the outage named in
one derived sentence. EN ships first and complete; ES is a leak-free render of the identical
payload landing on Spanish ground. The Tuesday habit is re-earned by being the most
*verifiable* cost email an operator receives, not the most engaging one.

## 1. The pipeline today (ground truth)

Tuesdays 14:00 UTC (`cost-index-dispatch.yml:40`, one hour after the 13:00 daily refresh):
`build-cost-index-dispatch.mjs --json` computes the insight payload → the dated EN-only post
publishes with its gates → the workflow POSTs the payload to
`/api/admin/cost-index-broadcast` (`src/worker.js:8720–8756`) → the Worker renders
`costIndexWeeklyEmail` (`src/lib/templates.js:176–238`, ES `templates.es.js:1148`) per
subscriber (status `active` AND source `cost-index`), cap 90/broadcast, idempotent per asOf,
sent via Resend from `don@muntin.digital`. Plain-text twin exists. The email is a genuine
standalone summary (basket, flashing rows, movers, drivers, one CTA to the post).

## 2. Verified defects (all confirmed in committed code by the adversarial pass)

| # | Defect | Where | Consequence |
|---|--------|-------|-------------|
| D1 | **Ungated action list.** The dispatch filters on `flag.actionBias === 're-price'` and never reads `flag.gated`. In the current data **all 15 re-price flags carry `gated:false`** — every one failed the index's own moving-block-bootstrap null with BY FDR (q=0.10, `tools/_shared/cost-null-gate.js`, wired in `build-cost-index.mjs:164–181`). The hub's verdict voice withholds `gated:false` to a neutral note; the email publishes it as an action command. | `build-cost-index-dispatch.mjs:132` vs `data/cost-index.json` | The email's action list is statistically indistinguishable from noise, by the site's own math |
| D2 | **Sign-contradicted reasons.** `flagReason()` (sign-aware) is applied only in `emit()` for the blog post; `computeInsight()` ships the raw reason. Live: bell-pepper `re-price`, reason "elevated and sustained — the increase looks real," trend **−17.1%**. | `build-cost-index-dispatch.mjs:342–350` applied at `:513` only | The emailed payload pairs minus numbers with increase language |
| D3 | **Confirmation emails cannot send.** `handleSubscribe`'s double-opt-in call passes neither `apiKey` nor `from` to `sendEmail(opts, apiKey)`; it fails silently inside `ctx.waitUntil`. New signups stay `pending` forever — the list cannot grow. | `src/worker.js:8834`; `src/lib/email.js:74–101` | Verify against production first, then fix |
| D4 | **Zero-send weeks stamp as sent.** The broadcast writes the idempotency stamp unconditionally; a Resend outage on send day stamps `sent=0` as done and is unretryable. | `src/worker.js:8753` | Stamp only when `sent>0`; return 502 otherwise |
| D5 | **162 ingredient-page signups never receive the weekly.** Their forms post `source="cost-index-ingredient"`, which the allowlist normalizes to `footer` — excluded from the broadcast filter despite being promised "the weekly index." | worker subscribe path | Migration + allowlist fix |
| D6 | **Cadence-false confirm copy.** The confirm email promises "Hard cap: four notes a quarter, ever" to weekly-list subscribers. | `templates.js:1429–1446` + ES | Branch copy on stored source |
| D7 | **ES render leaks.** ES subscribers get a Spanish email whose CTA lands on the EN post; no ES weekly post exists (the workflow's `es/blog/...` add is a no-op). | `src/worker.js:8741,8747` | CTA → `/es/cost-index/` (live board) + one "(en inglés)" link |
| D8 | **No List-Unsubscribe / RFC 8058 headers** on any broadcast. | `src/lib/email.js:79–101` | Deliverability + Gmail/Yahoo bulk-sender requirements |
| D9 | **"High confidence" basket label is uncalibrated.** `cost-index-health.json`: `highEligible: 0`; the calibration file has zero high-tier rows. The label has no realized track record anywhere. | dispatch prose + post | Never print "high confidence" until the tier has `items > 0` |
| D10 | **Basket decomposition contradicts the headline.** The JSON-LD declares a weighted **median** (−5.0% lands on cheddar's read); the contribution figure narrates weight×read sums (Σ = −1.79%, weights sum 1.07). A weighted-mean story about a weighted-median statistic. | week post + payload | Reframe as "biggest individual pulls," drop the summation claim |
| D11 | **No first-print qualifier** despite a public revision ledger: 1,255 revisions + 825 withdrawals, median \|revision\| 14%, p90 53% (`data/cost-revisions.json`). | dispatch prose | One standing derived sentence |

## 3. P0 — before the next send (Tuesday 14:00 UTC)

Panel and statistician agree on the defect set; they split on scope for the *comeback issue*:

- **P0-minimal (panel):** D2 (sign-correct at the payload source, one function moves ~200
  lines up the same file), D3, D4, D6. No body/subject redesign before the golden-render gate
  exists — the templates are outside every CI net today.
- **P0-plus (statistician, orchestrator-endorsed):** the above **plus D1** — thread
  `flag.gated` into the payload and demote `gated:false` items out of the action frame: they
  render as measured reads ("reads +X% against its own baseline, about $Y/unit
  wholesale") without command verbs; action verbs (`Re-price`) are reserved for
  `gated:true`. With today's data the comeback lead becomes the quiet-week read — "nothing
  cleared the noise gate; the loudest raw gap is green beans at +125%, which its own history
  can produce; hold" — plus the level board. The statistician's costly-signal argument: a
  publication that flags something every week is indistinguishable from a marketing engine;
  the quiet week is the only observable behavior that separates an honest gate from tea
  leaves.

**This is a founder fork** because it decides what subscribers see in the first email in
three weeks, and because the site's own published week post currently uses the ungated flags
(the email and hub verdict voice disagree today; P0-plus sides with the hub). Either way the
fix lands via PR to main before the cron.

Same-commit assertions whichever branch is picked: increase-vocabulary never accompanies
`pct<0` in either locale; no stamp on `sent=0`; confirm-copy fixture pins Tuesday/martes.

## 4. The claim taxonomy (statistician §B) — binding for all email prose

Every sentence types against one class; each has a required qualifier and a data backer:

| # | Class | Canonical phrasing | Licensed when | Backer |
|---|-------|-------------------|---------------|--------|
| 1 | Measured level + band | "about $X/unit wholesale (range $lo–$hi), as of DATE" | always, dollar basis | `level`; basis-leak gate |
| 2 | Gap vs own baseline | "reads +X% against its own tracked window — a snapshot, not a move" | always (shippable) | `trend.pct` |
| 3 | Noise-cleared move | "moved beyond what its own week-to-week noise produces (survived our false-discovery gate)" | `flag.gated === true` | null gate, BY q=0.10 |
| 4 | Sustained elevation | "elevated in N of the last M weeks" (windowed counter — **never** "N weeks running") | `elevatedWeeks ≥ 4` AND gated | `flag.elevatedWeeks` |
| 5 | Seasonal-band breach | "outside its typical July band ($p25–$p75, from N years)" / "normal for July" | `ready:true`, month `years ≥ 2` | `seasonality.json` |
| 6 | Week-over-week move | "the basket moved X pts since the DATE edition" | `computeWoW` `state:'moved'`, same weights version, refreshed anchor | editions spine |
| 7 | Directional context | "…points to easing on a 4–8 week lead — an association, not a measured cause, and not a price" | catalog-traced | pressure/drivers + gate |
| 8 | No meaningful change | "Nothing cleared the noise gate this week. Prices wandered; none of it is distinguishable from ordinary volatility." | zero gated stories | the gate itself |

**Confidence tiers in operator language:** medium → "two independent public series agree;
direction calls at this tier verify 62% of the time against a 53% coin-flip — the only tier
with a proven edge." Low/directional (89 of 100 items) → describe level and gap, never lean
on the arrow. "High confidence" appears nowhere until the tier earns calibration rows.

**Never claim (red lines, most already regex-banned elsewhere):** a price forecast at any
horizon; direction beyond one publish-step (`coneHonestThroughH: 1`); causal attribution;
regime breaks (anomaly log's own `_doc` bars it pending the hardened test); "high
confidence"; a dollar on a non-dollar basis; anything about the subscriber's own costs;
cohort/reader statistics (the May-2026 class); an additive decomposition of a median
headline; re-labeled confidence from the shadow score (`scoreSeparatesSkill: false`).

## 5. The story engine — deterministic lead selection (founder steer, statistician §C)

**Eligibility (all three):** (1) `isShippable`; (2) cleared the noise floor — `gated:true`,
OR a seasonal-band breach on a `ready` ingredient, OR a lock/float bucket change vs the prior
edition; (3) dollar-basis level present.

**Ranking:** score = \|pct\| × basket weight (or fixed panel weight) × persistence
multiplier; ties by `elevatedWeeks`, then slug. Same data → same leads, always. Story
selection is reproducible, never editorial.

**Actionability contract** — what each story shape licenses:

| Story shape | Trigger | Licensed action | Mandatory qualifier |
|-------------|---------|-----------------|---------------------|
| Noise-cleared rise | `gated:true` + structural | **Re-price** affected lines; open the renegotiate window vs the printed range | "cleared its own noise gate; wholesale reference, not your delivered price; first print, may revise" |
| Noise-cleared easing | `gated:true` + easing | **Renegotiate** — market eased; if your invoice didn't, that's the vendor conversation | same |
| Seasonal-band breach | outside month p25–p75, `ready:true` | **Substitute / rotate** toward in-band items, or wait it out if the band typically unwinds | "typical band from N years of that month" |
| Lock/float change | bucket change in `cost-lockfloat.json` | **Lock** (band proven tight) or **float** | "a risk read, never a direction call" |
| Basket moved | WoW `state:'moved'` | **Menu-wide margin review** | anchor dates + weights version |
| Quiet week | none of the above | **Hold prices** — the licensed action, framed as such | "the loudest raw gap was X%, which that item's history produces by chance" |

Ranked v1-ready weekly stats (all computed today, unshipped to email): lock-or-float posture
(`cost-lockfloat.json`: lock 15 / cushion 8 / float 4 / withhold 73, per-item coverage CIs);
percentile placement (`pos` — "sits at the 86th percentile of its tracked range");
the gated-movers list; seasonal-band status for the 39 `ready` items. **v1.5 policy
decision:** the h=1 outlook (`cost-outlook.json` exists, deliberately unshipped; backtest
licenses one step, range-and-direction only). **Out of scope:** regime breaks (unhardened),
"your invoice vs the band" (Ledger's lane; the independence gate keeps the index off invoice
data).

## 6. Email structure (panel synthesis, amended §6 per statistician)

1. Hidden preheader — basket read + spread + flag count; every numeral byte-matches the payload.
2. Masthead — "Week of {asOf} · {count} ingredients read" (never an issue counter — the spine has a hole; a counter would fabricate unbroken cadence).
3. Service note (conditional) — one spine-derived sentence naming a cadence gap; never an apology paragraph.
4. **The lede, three fixed beats** — THE NUMBER (basket + honest confidence chip), THE MEANING (breadth: 24 above / 21 flat / 36 below + pushing/easing hardest), THE MOVE (top *eligible* story with dollar grounding and its licensed action verb; quiet-week block when none).
5. Spread bar — up/flat/down proportional table bar; fixed caption "each ingredient vs its own tracked baseline — not week-over-week."
6. What's flashing — **amended:** action verbs only for `gated:true` stories; `gated:false` flags render as measured reads (class-2 phrasing + dollar band + elevated tag), closed by the honest remainder line and the two-bars sentence ("why the hub's stricter filter says 0 cleared").
7. Since last issue — set membership (new / still flashing / cleared) vs the prior edition, dated; basket delta only under the commensurability guard, else the stated withhold.
8. Driver read — one line, strongest agreeing driver, "association, not cause."
9. Single CTA — "Read the full week →"; ES CTA lands on `/es/cost-index/` + one "(en inglés)" link.
10. Check my math — link to `week-{asOf}.json/.csv` (CC0) + methodology; preflight-verified live; scoped to what the snapshot's fields can actually back (verdict-1 catch).
11. The record — stamped calibration line, misses included: "bands catch 77.2% vs the 80% design; only the strongest trend tier clears a coin flip."
12. Sign-off + reply line — "Seeing a different number on your invoice? Reply — I read every one." + the standing disclaimer.
13. Provenance plate — sources from the registry (`verified:true` only), weights + methodology versions, received-because line, visible unsubscribe + one-click headers.
14. Plain-text twin — every section stated in words; any visual the twin can't carry is decoration and gets cut.

**Subject system (P1, behind the golden-render gate):** stable prefix + top story + signed
pct + sign-aware verb; ISO date demoted to preheader; basket-disagreement suffix when signs
differ; quiet-week fallback "Cost Index — the panel reads hold." Same formatter as the body
so subject and body can never disagree.

## 7. Viz vocabulary for email (viz seat §A–B)

**The survivable toolkit is exactly four things:** tables with width/bgcolor *attributes*,
inline-styled text, Unicode glyphs (▲▼→ ●●○ — they survive every client, every dark mode,
the text part, and screen readers), and optionally pre-rendered PNG as enhancement-only.
The web post's viz cannot be ported: inline SVG, `var(--w)`, and `transform:scaleX` are all
stripped by Gmail and Outlook's Word renderer.

Ranked by "shows weekly change + cues action":

1. **Story cards** (top 2–4) — bulletproof nested-table cards: action chip (`RE-PRICE` /
   `WATCH` / `NEW` / `CLEARED`), the change line (`+81% → +125% vs baseline, widened +44 pts
   since 06-18`), dollar grounding from `medianCents/rangeCents`, one why-line, the licensed
   action cue. 100% client support.
2. **Quantized delta bars** — 120px table track, fill quantized to **8 integer steps**
   (the honesty guard: single-source, medium-confidence reads don't support pixel-continuous
   precision), delta always printed beside it.
3. **Band-position strip + seasonal chip** — 3-cell lo/●/hi track; seasonal chip only when
   `ready:true` and the month band was actually exited this edition.
4. **Glyph scan rows** — `▲ Green beans +125.4% ●●○ med $40.75/case` for everything else.
5. **Trajectory step-strip** — 8 bgcolor-bucketed cells (5-step ordinal ramp), endpoints
   printed. PNG sparklines deferred to stage 2, never load-bearing.
6. **Basket context** — one sentence; rings/decomposition stay on the site.

**Never:** color-only meaning (Gmail app inverts with no opt-out), continuous-precision
bars, zero-bars where truth is "not comparable" (withholds render as prose), third-party
chart APIs (tracking domain + nondeterminism), full 81-row tables (Gmail ~102KB clip hides
the unsubscribe footer — keep <80KB), emoji semantics, per-send manual work of any kind.

**Critical payload gap (viz E1):** the `--json` path ships NO week-over-week today —
`computeWoW` runs only inside `emit()`. The delta spine of every story card requires
attaching `wow` + ranked `stories[]` to the emailed payload.

## 8. CI gates — make overclaiming structurally impossible

The email's first gate is the precondition for everything (panel rank 4); the rest compose:

| Gate | What it pins | Idiom |
|------|--------------|-------|
| `check-cost-index-email.mjs` (golden render) | Committed preview artifact `cost-index/email/preview-{asOf}.html`+`.txt` (EN+ES) rendered from the exact POSTed payload shape; freshness vs latest edition; banned-technique scan (no `<svg>`, `var(`, `transform`); size <100KB; unsubscribe present | committed-derived-artifact + `check-*` auto-pickup in check-all |
| `check-dispatch-numbers.mjs` | Every %, $, count, week-count in body AND subject re-derives from `cost-index.json` + the edition snapshot within ±0.05pp; orphan number = fail | generalizes `check-cost-index-editors-note.mjs`'s `allowedNumbers()` |
| `check-dispatch-actionability.mjs` | Every lead story satisfies the eligibility criterion AND carries exactly one enumerated action cue consistent with §5; move-verbs ("jumped, spiked, surged") on `gated!==true` or sub-noise items = fail | the founder-steer contract, enforced |
| `check-dispatch-confidence-language.mjs` | Tier phrase table; "high confidence" only with calibration rows `items>0` (fails today, correctly); pressure adjectives rewritten to lead-indicator phrasing while `status:"preview"` | |
| `check-dispatch-wow.mjs` | "Since last edition" only under `state:'moved'` + matching weights version; cross-edition counts on the panel intersection (82→81 changed) | codifies the guard already in `computeWoW` |
| `check-dispatch-quiet-week.mjs` | Zero eligible stories ⇒ quiet-week lead MANDATORY; any eligible story ⇒ quiet-week lead forbidden. Determinism in both directions | |
| `check-dispatch-revision-disclosure.mjs` | Printed levels for items revised in trailing 13 weeks carry the first-print qualifier; the qualifier's own stats re-derive from the ledger | |
| Sign/verb agreement + withhold-state guard | Increase vocabulary never with `pct<0` (both locales); change-claim phrases forbidden when `wow.state !== 'available'` | fixture suite in `test-email-templates.mjs` |

All gates ship `--self-test`, per house convention.

## 9. Roadmap (merged: panel 14 + statistician D + viz E, deduplicated)

**P0 — before the next send** (S–M effort, one PR):
1. D2 sign-correct at the payload source (+ same-commit assertion).
2. D4 stamp-on-success; D3 confirm-send fix (verify prod first); D6 cadence-true confirm copy (EN+ES).
3. **[FORK]** D1 gate the action frame (statistician/orchestrator rec) — or defer to P1 with the golden-render gate.
4. One derived outage sentence for the comeback issue (spine-derived, no apology theater).

**P1 — the trustworthy body** (the golden-render gate is the precondition for all of it):
5. `check-cost-index-email.mjs` + committed preview (panel 4 / viz E4).
6. Payload WoW + ranked `stories[]` (viz E1); editions spine grows a per-item levels map for band-crossing detection (viz E6) — additive schema bump.
7. Email-viz helper lib (`src/lib/email-viz.js`, pure string builders + golden-string tests; viz E2).
8. Rewrite `costIndexWeeklyEmail` per §6 (EN+ES lockstep; viz E3) + subject/preheader system (panel 5).
9. Statistician gates 2–6 (§8) as the body grows the claims they police.
10. D5 ingredient-signup migration (panel 8); D8 List-Unsubscribe/one-click (panel 7); D7 ES CTA fix (panel 6).
11. Verifiability footer + the record line (panel 11); revisions qualifier (D11).

**P2 — the instrument layer:**
12. Spread bar, verdict chips, band strips, step-strips, masthead mark, dark-mode discipline (panel 13 / viz E7 shell hardening + one-time real-client screenshot pass).
13. Context layer: pressure digest (lead-indicator phrasing only), marked-to-market, seasonality tags (panel 12).
14. Growth + ES completion: pass-along block, aggregate-only measurement (no pixels), locale toggle, ES dated edition decision (panel 14).
15. Stage-2 PNG sparklines (viz E8) only if the step-strip proves insufficient. v1.5 policy call: the h=1 outlook.

## 10. Rejected (and why — keep this list; it's the plan's spine)

Ledger paragraph in the email (one link out, period; escalation lives on site surfaces) ·
lock-sheet line ("lock" reads as a guarantee while band coverage runs 0.772 vs 0.80 nominal) ·
"Issue #N" counter (the spine has a hole; a counter fabricates cadence) · any forward line
beyond h=1 (backtest licenses one step; rejected not deferred) · regime-break storytelling
(uncorrected Pettitt fires on 64–98% of driftless series; rejected not deferred) · widening
the broadcast to footer-source subscribers (consent mismatch — their promise is four notes a
quarter) · open pixels / per-subscriber click tracking (contradicts the moat; aggregate-only
kit instead) · stacked bilingual email or separate ES list (one list, per-subscriber locale
render wins) · hand-written apology copy or win-back drips (one derived sentence is the whole
acknowledgment) · shipping the new body/subject ahead of the golden-render gate.

## 11. Verdict cautions (the plan policing itself)

The adversarial honesty pass confirmed every defect above is real in committed code, and
caught the plan's own copy at the example level — binding lessons for whoever writes the
final strings:

- `elevatedWeeks` is a **windowed, non-consecutive** counter — "flagged N weeks running"
  overreads it. Phrase as "elevated in N of the last M weeks."
- The continuity example misstated set membership (green beans was already flashing on
  06-18, at −6.2%) — the "since last issue" block must be computed, never hand-written.
- "Check my math" may promise only what the snapshot's actual fields can back.
- The outage sentence must not promise archive coverage of a gap that holds no editions.
- The skeptical-operator pass: **the plan never counts its audience.** With D3 live (confirms
  can't send) and D5 live (ingredient signups mis-filed), the active cost-index list may be
  very small. Before investing P2 effort, derive the real number: KV `sub:` rows with
  status=active, source=cost-index. If it's a dozen people, P0+P1 are still right (they fix
  broken promises), but P2 sequencing should follow list growth, not precede it.
- D10 (median headline vs mean decomposition) needs a statistic-or-story fix in the *post*
  generator too, not just the email.

## 12. Effort + sequencing summary

P0 is one focused PR (S+M items, all in `build-cost-index-dispatch.mjs`, `src/worker.js`,
`src/lib/templates*.js` + fixtures) and must merge before Tuesday 14:00 UTC to affect the
comeback send. P1 is roughly a week of sessions, gate-first. P2 follows list health. Nothing
in any phase adds a manual per-send step, an external service in the send path, or an LLM
anywhere near subscriber data.
