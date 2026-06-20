# ADR-008 (PROPOSAL) — Image-provenance registry and gate (the fact-gate analog for pictures)

- **Status:** **Proposed** — needs gate-authors sign-off; ships with ADR-006 or not at all
- **Date:** 2026-06-20
- **Owner:** Provenance & licensing bench (proposing); Gate authors own the new check
- **Review by:** 2026-09-20
- **Relates to:** ADR-005 (convening); ADR-006 (taxonomy); ADR-007 (priority ladder); `docs/fact-check.md` + `data/sourced-claims.json` (the model this mirrors)

> Proposal: admitting photographs without a provenance gate would reopen, in pixels,
> exactly the hole the fact gate closed in prose. Mirror `sourced-claims.json`:
> a registry `data/image-credits.json` plus `scripts/check-image-credits.mjs` wired
> into `check-all.mjs`, so every photograph/scan/map/screenshot is sourced, licensed,
> and (where it shows operator data) attested-anonymized — or CI fails.

## Context

Agent audit confirmed **no image-provenance registry exists today**: `sourced-claims.json`
covers numbers/dates/URLs, not images; there is no `image-credits.json`. The fact
gate's founding logic (ADR-000) is that an unsourced assertion on this site is one
the audio renderer can't be trusted with. A photograph is an assertion too — "this
is a real invoice," "this is what the basket cost" — and a licensing slip (using a
not-actually-PD image) is a legal assertion. Both need the same discipline the prose
already has. ADR-006 admits the media; this ADR makes admitting it safe.

## Proposal

### Registry — `data/image-credits.json`

One entry per image, keyed by a stable `id` referenced from the figure via
`data-credit-id`:

```json
{
  "id": "service-charge-paystub-modelA",
  "file": "assets/article-images/service-charge-vs-tipping-model/paystub-a.webp",
  "kind": "scan",
  "source": "first-party",
  "credit": "Operator (anonymized)",
  "source_url": null,
  "license": "first-party",
  "date_verified": "2026-06-20",
  "anonymized": true,
  "used_in": ["library/service-charge-vs-tipping-model"]
}
```

- `source` ∈ `first-party | public-domain | cc0 | cc-by | licensed`.
- `license` from an allowlist; `cc-by` requires a non-empty `credit` + `source_url`.
- `anonymized` is **required `true`** when `kind` is `scan` or any image depicting
  real operator/customer data (enforces ADR-007's discipline).
- `used_in` mirrors `sourced-claims.json` so an image's article footprint is
  auditable and locale-parity can confirm the ES mirror reuses the same `id`.

### Gate — `scripts/check-image-credits.mjs` (fail-CI, wired into `check-all.mjs`)

For every `<img>` inside an article `<figure>` whose `data-figure-kind` ∈
`{photo, scan, map, shot}`:

1. The figure carries a `data-credit-id` that resolves to a registry entry — else
   fail (the "unsourced image" catch, parallel to an unregistered claim).
2. The entry's `license` is in the allowlist; `cc-by`/`licensed` have `credit` +
   `source_url`; **`public-domain`/`cc0` require a `source_url`** proving the status.
3. `kind: scan` (and any flagged data image) has `anonymized: true`.
4. `used_in` contains the article's slug (keeps the registry honest as posts move).

Decorative/site-chrome images (logos, OG cards, the `viz` SVGs) are out of scope —
the gate keys on `data-figure-kind` photo/scan/map/shot only, so it never touches
the existing `brand/` pipeline.

### Where files live

Proposed: `assets/article-images/<article-slug>/<name>.webp` (co-located by article,
WebP/AVIF to satisfy `check-image-formats`, with `width`/`height` for
`check-image-dimensions` and `loading="lazy"`/`decoding="async"` for
`check-lazy-images`). One source of truth; ES mirror references the same file + `id`.

## Open questions for the corps

- Separate registry vs. an `images` block inside `sourced-claims.json`? Bench leans
  **separate file** (different schema, different cadence) but it should share the
  `date_verified`/`used_in` conventions verbatim.
- Do we need a periodic re-verification of `public-domain` `source_url`s (link-rot),
  the way `sourced-claims.json` tracks `url_status`? Propose: yes, fold into the
  existing URL-status sweep.
- License allowlist contents — who ratifies additions (Brand? Legal-doc owner)?

## Consequences

- **Positive:** photographs become as trustworthy as the prose; a licensing or
  anonymization miss fails CI before it ships, not after a takedown.
- **Cost:** every admitted image is now a registry entry to maintain — the same tax
  the fact gate levies on every number. Accepted: it is the price of the trust moat.
