# ADR-007 (PROPOSAL) — Imagery priority: first-party over stock; "personal" means evidence

- **Status:** **Proposed** — taste contract; needs Brand sign-off (shares the banned-vocab logic)
- **Date:** 2026-06-20
- **Owner:** First-party imagery guild (proposing); Brand & Cohesion Lead co-signs
- **Review by:** 2026-09-20
- **Relates to:** ADR-005 (convening); ADR-006 (taxonomy that admits photos); ADR-008 (provenance registry that enforces source); `voice-canon-library.md` §8

> Proposal: the founder's instinct to add "public-domain photographs to feel more
> personal" is right in spirit and backwards in default. Generic stock/PD restaurant
> photography is the **visual equivalent of the banned-words list** — it makes a page
> feel like everyone else's content marketing, the opposite of personal. Rank image
> sources explicitly: **first-party operator evidence first, licensed/archival
> public-domain only when it has a job, generic stock never.**

## Context

muntin's whole register is anti-generic; the prose canon already bans marketing
filler. Photographs are subject to the same failure mode: a stock shot of "a chef
plating" is decoration that asserts nothing and could sit on any competitor's site.
The audit found zero photographs today — so the *first* photographs we admit set the
norm. "Personal," for this brand, is not warmth or ambiance; it is **operator-
specific evidence** the reader can't get anywhere else: a real (redacted) invoice, a
real supplier shelf, a real GSC panel, the actual Tacombi floor, a real pay stub
behind a service-charge comparison.

## Proposal

### The priority ladder (highest trust first)

1. **First-party operator imagery** — shot or scanned by the operator: anonymized
   invoices/receipts/pay-stubs, supplier shelves and price tags, the line/floor,
   real tool screenshots (`shot`). This is the personal layer and the default ask.
2. **Licensed public-domain / CC0 / properly-attributed CC-BY, *with a job*** —
   admitted only when it shows something first-party can't: a commodity at origin, a
   place/geography (`map`), an archival or historical image that contextualizes a
   claim. Never as ambiance.
3. **Generic stock photography — banned.** Plated-food, smiling-staff, generic-
   kitchen, handshake, "hospitality" stock. Treat a violation the way the gate
   treats a banned word.

### "Earn its place" test (every photo passes all three)

- **Evidentiary:** it shows the thing the argument claims, not a mood. If the
  caption could be "photo of a restaurant," it fails.
- **Sourced:** it has a provenance entry (ADR-008). First-party is a source too.
- **Honest:** anything depicting real operator data is **anonymized** — names,
  totals where identifying, account numbers, faces — and the figcaption says so.

### Anonymization discipline (first-party scans)

Redact business name, address, account/PO numbers, and any third-party staff PII;
keep the line items / numbers that make the figure evidence. Record
`anonymized: true` in the registry. A scan that can't be safely anonymized doesn't
ship — fall back to a `table` of the same numbers.

## Open questions for the corps

- What can Don realistically produce on a restaurant week's budget? The guild should
  hand back a concrete shot/scan list (suppliers he sees, invoices he already
  handles, the Bethesda floor) so editorial plans around real assets, not wishes.
- CC-BY attribution placement: figcaption, cite-drawer, or a page-foot credits
  block? (Coordinate with ADR-008's `credit` field.)
- Do tool screenshots (`shot`) of muntin's *own* product count as first-party
  (yes, proposed) and do they need the anonymization pass (only if they show real
  customer data)?

## Consequences

- **Positive:** the imagery program reinforces the trust moat (operator evidence
  vs. conflicted-vendor polish) instead of diluting it with stock.
- **Cost:** first-party imagery is slower to produce than dropping in a stock photo —
  by design. The ladder makes the slow, honest path the default and the fast,
  generic path impossible.
