# ADR-011 — Monthly cadence: first-Tuesday dispatch, Mon/Wed/Fri refresh

- **Status:** Accepted (founder decisions 2026-07-06, merged to main via PR #505/#507)
- **Date:** 2026-07-06
- **Owner:** Strategic council (founder-signed)
- **Review by:** 2026-10-06
- **Relates to:** ADR-010 (insight grammar + its 2026-07-06 ratified one-print extension);
  `docs/plans/monthly-dispatch-site-edition.md`; `docs/plans/dispatch-email-upgrade.md`;
  **partially superseded by ADR-012** (publish mechanics only — the cadence stands, the
  auto-publish does not).

> Decision: the Cost Index dispatch (post + subscriber email) moves from weekly to
> MONTHLY; the data refresh moves from daily to MONDAY/WEDNESDAY/FRIDAY 13:00 UTC.
> Every promise surface states exactly this and no more.

## Decisions bound here

1. **Dispatch cadence — monthly.** Founder picks (2026-07-06, recorded in session):
   skip the 2026-07-07 weekly entirely; the July edition is a delayed hand-published
   edition; monthly editions anchor to the **first Tuesday** as the editorial deadline.
   The subscriber promise everywhere is "one email a month — the first Tuesday"
   (confirm email, signup captures, hub pitches, EN+ES).
2. **Refresh cadence — Mon/Wed/Fri 13:00 UTC.** Heartbeat threshold 6d; dispatch
   freshness threshold 38d (a max first-Tuesday cycle + slack, self-tested).
3. **Edition naming — founder-signed 2026-07-06:** slug family `blog/cost-index-YYYY-MM/`
   (month hard in title/H1, honesty in the dek: "a dated read, not a month average");
   existing `cost-index-week-*` slugs final-forever; `-update` suffix on collision.
4. **Forwards within license:** every edition looks backwards AND forwards, composed
   only from ADR-010's grammar — pressure leads (association + stated windows), the
   seasonal calendar (months with ≥2 years), lock/float postures, and the ratified
   h=1 one-print tilt (site edition only, never the email).

## Consequences

- All cadence-promise surfaces were swept in the same commits (signup captures,
  confirm email + fixtures, homepage EN+ES, edition archive copy, library hero).
- The email trust rails (golden render at `data/email-preview/`,
  `check-cost-index-email.mjs`) verify the monthly email; the 38d freshness gate is
  the publication reminder.
- 2026-07-07 live test: the cron fired and the monthly gate skipped cleanly (no post,
  no email) — then ADR-012 removed the cron entirely.
