# ADR-015 — The open-data explore surfaces (co-movement honesty + the CC0/CC-BY split)

- **Status:** Accepted (autonomous build session, 2026-07-11); founder review open.
- **Date:** 2026-07-11
- **Owner:** Cost-Index / open-data thread
- **Review by:** 2026-10-11
- **Relates to:** ADR-011 (notable price events surface — this extends it to per-event
  detail pages + an events explorer); ADR-013 (gov-data-sources policy — this defines
  the redistribution license per file); ADR-010 (citable publication — same honesty
  contract); `docs/fact-check.md` (the absolute number rule — load-bearing here too).

> Decision: the Cost Index becomes **partially a data company and an open-source
> library**. The events, yields, seasonality, lock-or-float and anomaly datasets ship
> as explorable surfaces *and* downloadable open datasets under an explicit,
> per-file **CC0 / CC-BY split**. Co-movement is published as a **directed, bounded,
> anchored** measure — co-occurrence, never cause. Everything measured-tier stays home.

## Context

The events and ingredient-yield surfaces previously offered only a raw JSON file under
`/open/`. The build-out gave each a real explore surface (searchable/sortable hub,
per-event detail pages, an anchored co-movement explorer, an AP→EP calculator) and, for
the first time, a coherent **open-data product line**: six datasets, each downloadable
in JSON + CSV, catalogued in a `DataCatalog`, and cross-linked for easy citation.

That raised three decisions of record.

## Decision 1 — The co-movement measure is directed, bounded, and anchored

When two ingredients move off their own normal in the same ~6-week window, we report it
as **"K of anchor X's own N notable moves were shared by ingredient Y"** — a fraction of
one ingredient's own history, asymmetric (chicken-breast→thigh 5/6 is not thigh→breast
5/5). We do **not** publish a global undirected pair count (the discarded "romaine ↔
red-leaf co-moved 46 times" framing invites a false sense of a measured relationship).

- Visual form is **anchored single-hue bars** (pick an anchor, see its co-movers), never
  a correlation matrix, chord diagram, or network graph — those imply a measured coupling
  we do not claim.
- The headline stat — **"94% of notable shocks had company" (407 of 432)** — is a plain
  count with the arithmetic shown, framed above the bars as **co-occurrence in time, not
  cause**: a shared episode (a growing region, a shipping lane, a supermarket aisle), never
  a coefficient, lead, lag, or forecast.

## Decision 2 — Per-file license: CC0 for gov recompute, CC-BY for Muntin's compilation

- **CC0 / public domain** — a deterministic recompute of public-domain U.S. government
  data, no creative selection: the **index**, the **seasonal normals**, the **detected
  price moves**, and the **co-movement** extract.
- **CC-BY 4.0** (reuse freely, credit "Muntin Digital") — Muntin's compiled or curated
  work: the **market-events registry** (compiled prose + citations), **ingredient
  yields** (curated from CIA/USDA-FBG tables), **lock-or-float** (the thresholds +
  lock/cushion/float/withhold vocabulary), and the **anomaly log** (a named-method
  statistical compilation).
- **Never published** — the measured-tier recipe (`data/cost-index-sources.json`), the
  master price-bulk / raw levels, the Vendor Benchmark reference context, proxies framed
  as measured, any forward forecast, the raw data-quality audit, and any operator data.
  Lock-or-float ships the *decision + band width* only, never the price level; the
  anomaly log ships a reference level at a date, never a delivered price.

Every license claimed on `/open` and in `llms.txt` must match the `license` field inside
the file itself (cross-checked in build). The prior blanket "Cost Index data files are
CC0" was **wrong** for the four CC-BY sets and is retired.

## Decision 3 — Per-event detail pages: page date ≠ event date

The 39×2 per-event pages set schema.org `datePublished` to the **surface-publish date**
(a fixed constant, 2026-07-11 — deterministic for `--check`), not the event's own start
date; the documented event window rides in **`temporalCoverage`** (an ISO-8601 interval),
the correct home for "what the article is about." Setting `datePublished` to the event
date misrepresented pages built this week as years-old content.

## Gate coverage (the invariant is enforced where the prose lives)

- `check-cost-index-events.mjs` now scans the **78 per-event detail pages** (previously
  invisible to its one-level walk): the site's own framing — JSON-LD, scripts, `<details>`
  drawers and `[data-quoted-source]` documented prose stripped — may assert no causation
  and no forecast, and each page must carry its co-occurrence caveat (EN + ES).
- The five open-data reshapes are `--check`-gated in `check-all.mjs` (byte-sync +
  honesty self-tests) and re-run in `cost-index-refresh.yml` so a data refresh can never
  leave a published dataset stale. They are **not** in the deploy build chain, so the
  `--check` is the load-bearing guard.

## Consequences

- The open datasets are citable, catalogued, and license-honest — a real foundation for
  the "data company / open-source library" posture, and DOI (Zenodo) minting is now an
  operator-side step (the on-site `DataCatalog` + CC-BY + cite blocks are in place).
- Any new open dataset must declare its CC0-vs-CC-BY tier by Decision 2's test
  (gov-recompute vs Muntin-compilation), ship JSON+CSV with an in-file `license`, add an
  `/open` card + `llms.txt` entry, and wire a `--check` into `check-all` + the refresh.
- Any co-movement or events prose that reads as causation or forecast is a gate failure,
  now including the detail pages.
