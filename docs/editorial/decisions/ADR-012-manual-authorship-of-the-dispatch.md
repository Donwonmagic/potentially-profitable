# ADR-012 — Manual authorship of the monthly dispatch (the machine reminds, humans write)

- **Status:** Accepted (founder decisions 2026-07-09, in session)
- **Date:** 2026-07-09
- **Owner:** Strategic council (founder-signed)
- **Review by:** 2026-10-09
- **Relates to:** ADR-011 (cadence — stands); ADR-010 (grammar — stands);
  `docs/fact-check.md` (the absolute number rule — stands and is the load-bearing wall
  of this decision).

> Decision: monthly dispatch editions are HAND-WRITTEN and HAND-PUBLISHED. No cron
> generates or publishes posts. The founder's words: "I don't want a generated index
> post… we can simply post ourselves every month" and "I want a hand-written,
> informative, complex simplification of deep information."

## What changed (all on 2026-07-09)

1. **`cost-index-dispatch.yml`:** schedule/cron REMOVED; the workflow survives as the
   one-click EMAIL button only (`workflow_dispatch`, dry-run-guarded, idempotent per
   asOf). Run it with dry-run=false AFTER a hand-written edition is live.
2. **`cost-index-refresh.yml` catch-up step:** no longer generates or publishes
   anything. When the data runs >38d past the last published dispatch it FAILS RED as
   the write-the-edition reminder (GitHub emails the founder).
3. **The generated July draft was deleted** (page + spine/library-tags registrations
   reverted). The generator + `.viz-spark` + the payload spine remain as dormant
   tooling: figures for authored pieces, the email payload, and the verification
   substrate.

## What did NOT change (binding on every hand-written edition)

- **Every number must re-derive** from the committed payload
  (`EDITION_DATE=… build-cost-index-dispatch.mjs --json`) or a named gated file.
  Hand-typed numbers are the May-2026 fabrication class; the fact gates, article-
  graphics 8 rules, drivers/editors-note gates, and the audio pipeline all apply to
  authored editions exactly as before.
- ADR-010's forward grammar governs any Looking-ahead prose.
- Slug/title/dek formulas per ADR-011 §3.
- The editions spine + CC0 per-edition snapshots still get produced at publish (the
  citable data layer is not optional).

## The publish runbook (per month)

1. Author the edition (founder + council; workflows may CRAFT drafts — authored
   writing, bespoke visuals — but nothing template-generates or auto-publishes).
2. Founder reads and marks up; council revises; gates green
   (article-graphics, fabrications, drivers, editors-note, orphan-number sweep).
3. Hand-publish: commit the post + registrations (spine, snapshots, blog index, RSS,
   sitemap, llms.txt) — the standard registration scripts run manually.
4. Send the email: dispatch workflow, dry-run=false. Idempotent per asOf.
5. The 38d freshness gate is the only automation left — a reminder, never a writer.
