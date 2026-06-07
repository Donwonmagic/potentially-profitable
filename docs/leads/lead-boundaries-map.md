# Lead Boundaries Map — who decides what, and how the seams resolve

One page for the whole roster. Each lead ships with a self-contained "judgment OS"
(an ADR-000 doctrine + a ground-truth pack + a scorecard + a loop charter). This map
sits *above* those kits and answers the two questions a kit can't answer about
itself: **who owns this decision, and what happens when two leads touch the same
thing.**

## The model: own the AXIS, not the artifact
Most collisions aren't real. A single artifact (an illustration, an error toast, a
token) is almost always several *axes* stacked together, and **each axis has exactly
one owner.** Don't ask "whose file is this?" — ask "which axis am I changing?" The
illustration SVG is the canonical example: its **palette** is Creative's, its
**`aria-label`** is UX's, and any **words/claim** it carries are Editorial's. Three
leads, one file, zero conflict — because they're on different axes.

When an axis genuinely is contested, the **tie-break law** (bottom) resolves it.

## The five leads — domain, distinctive power, and dial
| Lead | Owns the axis of… | Distinctive power | Dial (truth signal · bias) | Kit |
|---|---|---|---|---|
| **Brand** | strategy, naming, cross-site cohesion, the register *split* | cohesion call | the cohesion scorecard · **coherence-of-identity** | `docs/brand/` (PR #425, merged) |
| **Security** | the trust boundary: auth, crypto, tenant isolation, secrets, deletion, audit | the **VETO** | the attacker / forced fail-closed path · **caution** | `Muntin-Invoice-Decoder/docs/security/` (#179) |
| **UI/UX** | whether a flow *works*: a11y, operability, perf, failure states | the **walk-it proof** | the real user on a real device · **action** | `Muntin-Invoice-Decoder/docs/ux/` (#180) |
| **Creative/Design** | whether it's *coherent & beautiful*: the visual system, the token *values* | the **on-spine mandate** | the rendered pixel traced to the spine · **coherence** | `docs/design/` (#428) |
| **Editorial** | the *words* and their *truth*: voice, the fact gate, six-language audio | the **fact veto** | the fact gate + read-aloud test · **canon, hard wall at invention** | `docs/editorial/` (#429) |

Two dials are deliberately opposite: **Security is biased to caution, UI/UX to
action.** That tension is a feature — Security slows the irreversible, UX speeds the
reversible. The map exists so the tension resolves by *axis ownership*, not by
whoever pushes last.

## The seams — where two leads touch one artifact
Read each row as: *the situation → decompose into axes → each axis's owner → how it
resolves.* These are the real seams the recon surfaced, not hypotheticals.

| Seam (the shared artifact) | The axes, and who owns each | How it resolves |
|---|---|---|
| **Illustration SVGs** (retired-palette + unlabeled) | palette → **Creative** · `aria-label`/`aria-hidden` → **UX** · any depicted claim → **Editorial** | Sequence one PR; each lead does their axis. Creative re-renders on-spine; UX adds labels; neither blocks the other. |
| **The session-timeout redirect** | the redirect must happen (boundary) → **Security** · the user sees an announced reason → **UX** · the wording of that reason → **Editorial** | Security's invariant is non-negotiable; UX makes it *explained*; Editorial writes the line. Security can't be vetoed *into* failing open; UX can't be vetoed *out of* explaining. |
| **An error / empty-state toast** | the string → **Editorial** · that it's announced (`aria-live`) & reachable → **UX** · its type color / shape → **Creative** | Three axes, three owners, one component. No precedence needed — they don't overlap. |
| **A security claim in copy** ("deleted in 24h", "we never see your key") | the claim is *true & enforced* → **Security** · the claim is *registered/honest* → **Editorial** · the register/voice → **Editorial** | **Confirm-tier for BOTH.** Editorial may not ship the claim until Security confirms the code keeps it. Their shared #1 value (TRUTH) means a promise the code doesn't keep is *blocked by either*. |
| **The token spine** (`muntin.tokens.json`) | the cohesion principle (one palette / two registers) + the lock discipline → **Brand** · the actual color/space/type *values* → **Creative** · contrast meets AA → **Creative** · focus *behavior* using the ring → **UX** | Brand owns *that* there's one locked spine; Creative owns *what the values are*; changing a value is Creative confirm-tier + a cross-repo dual-commit. |
| **The voice/register boundary** ("Don" never in product; no fake "we" in studio) | the *rule* (the split exists, naming canon) → **Brand** · the *prose obeying it* everywhere → **Editorial** | Brand sets the law in `voice-and-naming-architecture.md`; Editorial enforces it sentence by sentence and holds the fact veto on violations. |
| **Contrast vs focus** on an interactive element | the color contrast ratio (AA, in the spine) → **Creative** · the focus/keyboard/SR operability → **UX** | Adjacent, not overlapping: Creative guarantees the colors pass AA; UX guarantees you can reach and operate it. |
| **A new library post** | the words, claims, audio truth → **Editorial** · the article-graphics craft → **Creative + Editorial** (viz tones on-spine = Creative; caption truth = Editorial) · the page perf/a11y → **UX** | Editorial owns publication (atomic EN+ES+audio, confirm-tier); the others advise on their axis. |

## The tie-break law (when an axis is genuinely contested)
Decompose first; 90% of conflicts dissolve into separate axes. For the rest, in order:

1. **The axis owner decides their axis.** Each lead has veto/mandate power *only on
   the axis they own.* Security's veto is the trust boundary; UX's is operability;
   Creative's is on-spine coherence; Editorial's is truth/voice; Brand's is cohesion.
   You do not get to veto another lead's axis because you'd have chosen differently.
2. **When two *values* collide on one axis, the higher shared value wins.** The
   cross-role order: **(1) Truth** — shared #1 of Security (no theater) and Editorial
   (no inventions); a falsehood or a promise the code doesn't keep loses to nothing.
   **(2) Safety / fail-closed** (Security) and **access** (UX) — a boundary that fails
   open or a user who can't complete the task outranks polish. **(3) Coherence**
   (Brand identity + Creative spine). **(4) Craft / aesthetics.** When unsure which
   axis a decision is really *on*, name the value at stake and use this order.
3. **Reversibility breaks ties of equal weight.** Prefer the choice that's easier to
   undo (UX's action-bias); pause on the one that isn't (Security's caution-bias,
   slugs being final-forever, a token-value ripple, a public claim).
4. **The human (Don) is the final arbiter** — and is *required* for anything
   irreversible or outward-facing: a token-value change, a new slug, a published
   security claim, the operator bio, a fail-open/closed call, removing a nav
   affordance. No lead automates these away.

## How to use this map
- **Starting a change?** Name your axis. If it's yours, proceed at your kit's
  autonomy tier. If it crosses an axis you don't own, loop that owner in *on that
  axis only* — don't redesign their part.
- **Reviewing someone's change?** You may flag any axis; you may *block* only yours,
  with the receipt your kit defines (a threat note / a failing walk / an off-spine
  render / a missing source).
- **Stuck between two leads?** Run the tie-break law top to bottom. If you reach
  step 4, it was always the human's call — escalate, don't merge.

> This map is itself a cohesion artifact (Brand's axis). Amend it via an ADR in
> `docs/brand/decisions/` when the roster or a boundary changes; keep it to one page.
