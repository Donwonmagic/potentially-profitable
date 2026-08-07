# ADR-022 — The corrections policy: publish the mechanism, not the apology

**Status:** Accepted
**Date:** 2026-08-07
**Owner:** Don Goldstein

> **Decision.** Muntin publishes an append-only public ledger of its own errors at
> `/cost-index/corrections/`. Every entry carries five fields, and the fifth —
> **the name of the check script that now prevents recurrence** — is mandatory and
> gated. We do not apologize, do not announce, and do not retract. A correction is
> a scheduled, permanent, findable record that the machine improved; it is not a
> reputational event to be managed.

## Context

On 2026-08-07 a company audit found that `blog/cost-index-2026-07/index.html` — the
flagship dispatch — carries 72 published claims that are currently false. All of
them were true on publication day. It also found that `cost-index/feed.json` was
publishing ground beef at `$393.06` per pound, a BLS index value rendered as a
price, 71× the `$5.51/lb` the same repository published in `cost-index/index.json`
for the same slug.

The instinct in a one-person company with zero revenue and zero confirmed users is
to treat this as an emergency: pull the post, write an apology, promise better.
Every input we have says that instinct is wrong.

`docs/handoff/bones/greats-free-authority.md` convened the authority brands that
survived being wrong in public. The finding was unanimous. Michelin publishes star
losses in the same document, on the same day, as star gains — unsigned,
unexplained, no apology, on a known calendar. A demotion is a scheduled event, not
a crisis response. Consumer Reports publishes the retest that reverses its own
verdict. Neither apologizes; both ship the mechanism. From that panel, verbatim:

> the great authority brands do not apologize for being wrong, they ship a
> mechanism and publish the mechanism, because a correction that names the gate now
> preventing recurrence is stronger evidence of integrity than never having erred.

And on the failure mode to avoid:

> An apologetic, one-off, prominently-placed mea culpa about the 72 false claims
> would be both defensive and weaker than the alternative: a quiet, dated,
> permanent, append-only ledger that a skeptic can find and verify. Trust goes
> ambient. The correction should be findable, not announced.

There is also a specific gap this fills. `data/cost-revisions.json` holds 10,294
entries — but every one of them is a **source** revision: USDA or BLS changing its
own number after the fact. Nothing in either repository logged a number **Muntin**
published and got wrong. For a company whose product promise is "it shows what it
measured, labels what it estimated, and holds a number back rather than print a
guess," that is precisely the ledger that buys trust, and it was the only one
missing.

## The flow

1. An error is found — by a gate, an audit, or a reader.
2. An entry is appended to `data/cost-index-corrections.json` with five required
   fields: `published`, `correct`, `brokeOn`, `foundOn`, `why`, plus `gate`,
   `surface` and `status`.
3. `scripts/check-corrections-ledger.mjs` validates it. The load-bearing rule:
   **`gate` must name a script that exists on disk.** An entry naming a gate that
   is not there fails CI.
4. `scripts/build-corrections-page.mjs` renders `/cost-index/corrections/` and the
   CC0 mirror at `/cost-index/corrections.json`.
5. `--seal` records a hash per id in `data/cost-index-corrections.lock.json`.
   Editing or deleting a published correction after that changes or loses a hash
   and fails the gate. The ledger is append-only in enforcement, not just in
   intention.

## Decision

1. **The `gate` field is mandatory and machine-verified.** This is the entire
   asset. "We were wrong, sorry" is a confession and decays into embarrassment.
   "We were wrong, here is the check script that now makes this specific error
   fail a build, run it yourself" is evidence that the machine improved — and it
   is falsifiable by a stranger in the same thirty seconds that `no-llm-ci.sh`
   makes the no-LLM claim falsifiable. A correction with no gate is not publishable.

2. **No apology copy.** No "we're sorry", no reassurance, no explanation of how
   seriously we take it. The entry states what was published, what is true, why it
   broke, and what now catches it. The tone is a maintenance log.

3. **Findable, not announced.** The page is linked from the Cost Index and the
   methodology surface. It is not promoted, not broadcast, not a blog post. A
   skeptic looking for it finds it; nobody is asked to admire it.

4. **Correct in place; do not retract.** A retraction removes the evidence of the
   fix, which is the only part with lasting value. Dated prose is corrected in
   place with a correction notice, and the slug never changes (slugs are
   final-forever).

5. **Publish `pending` entries before the prose is fixed.** When a gate ships
   ahead of the rewrite, the entry goes up marked `pending` with a `pendingNote`
   saying exactly what is still owed — enforced by the gate, which rejects a
   pending entry with no note. The record should show what was known on the day it
   was known, not only after it was tidy. This is the hardest clause to honor and
   the one that makes the ledger worth reading.

6. **This ledger is distinct from `cost-revisions.json` and says so on the page.**
   Source revisions are someone else's correction. This page is ours.

## Walk receipt

Verified in this container on 2026-08-07 by running the code, not by reading it:

- `node scripts/check-corrections-ledger.mjs --self-test` → 10/10. The assertions
  that matter: an entry naming a nonexistent gate fails; an empty `gate` fails; a
  `pending` entry with no note fails; editing a sealed entry fails with
  "append-only"; deleting a sealed entry fails.
- `node scripts/check-corrections-ledger.mjs` → 3 corrections, every one naming a
  gate that exists on disk, 2 pending with stated remainders.
- `node scripts/build-corrections-page.mjs && … --check` → 0 drift on the second
  run, so the builder is idempotent and safe to wire as `(idem)`.
- Rendered page verified for correct canonical, no donor-page metadata bleed, 3
  entries, and the gate script path present in the markup.

**Honest verification limits.** No browser exists in this container, so the page
was verified as markup and not as a rendered layout in light and dark themes. The
hreflang alternates were stripped because no ES mirror exists yet; shipping
alternates pointing at a 404 would be its own small dishonesty, and ES parity for
this page is deliberately deferred rather than forgotten (site-wide EN↔ES parity
as a ratchet was killed in the 2026-08-07 strategy of record).

## Alternatives rejected

- **A prominent apology post.** Defensive, one-off, and weaker. It also violates
  the founder's own positioning pivot. Rejected on the free-authority panel's
  explicit finding.
- **Retract the July dispatch.** Removes the evidence of the fix and breaks deep
  links from smart-next blocks and any external citation. Slugs are final-forever
  for the same reason.
- **Fix the numbers quietly and say nothing.** This is the option that is actually
  tempting at zero users, and it is the one that forecloses the asset. The errors
  are already public in a public repository; the only question is whether the
  company is the one that surfaces them.
- **A `corrections` field on each affected page instead of a central ledger.**
  Distributes the record so no reader can see the pattern — and the pattern (three
  errors, three gates added, all in one day) is the trust artifact.

## Consequences

- Every future error carries an obligation to write a gate before it can be
  published as corrected. That is a real cost and it is the point: it converts
  error-handling from a writing task into an engineering task.
- The page will grow. It is designed to; a long, dated, gated corrections ledger
  reads as a company that finds its own mistakes. An empty one reads as a company
  that does not look.
- **What this retires:** nothing is deleted, but this ADR closes the question of
  how Muntin responds to being wrong in public. Future sessions do not relitigate
  it — no apology posts, no retractions, no quiet edits.
