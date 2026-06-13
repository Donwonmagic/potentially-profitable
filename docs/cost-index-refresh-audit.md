# Cost Index — Source Refresh Audit

> "Is every source regularly refreshing?" — the definitive map. Compiled 2026-06-13.
> Three independent refresh tracks; a source is only as fresh as its track.

## The three tracks

| Track | Workflow | Cadence | Commits? | What it refreshes |
|---|---|---|---|---|
| **Measured index** | `cost-index-refresh.yml` | **Daily** 13:00 UTC | yes (data + pages + seed + health + seasonality) | The wholesale levels/trends: AMS terminal, LMR cutout, NDPSR, BLS, FRED, EIA, NOAA FOSS |
| **Pressure nowcast** | `cost-pressure-refresh.yml` (`live`) | **Weekly** Mon 11:00 UTC | yes (pressure data + seed) | Live directional observations from the *live-friendly* sources |
| **Pressure calibration** | `cost-pressure-refresh.yml` (`calibrate`) | **Monthly** 1st 12:00 UTC *(added 2026-06-13)* | no (writes nothing — validation only) | Re-pulls + re-validates the *continuous, monthly-cadence* sources |

## Per-source refresh status

**Measured (daily):** AMS terminal produce, LMR beef/pork/lamb cutout, NDPSR
butter/cheddar, BLS PPI, FRED, EIA, NOAA FOSS seafood — all refresh daily via the
measured track (each samples on its own native publish clock; the daily cron just
catches it). ✓

**Pressure — live nowcast (weekly):** the verified live sources — `eia` (diesel),
`nass` (broiler placements, cattle-on-feed, hogs, cold storage ×5, milk, crop
condition), `usdm` (drought CA/AZ, FL/CA, ID), `nws` (`freeze-alert`), `season`
(lettuce/tomato/onion/potato transitions), `ams-move` (onion/lettuce/tomato/potato
movement). ✓ These are the signals that change week-to-week.

**Pressure — calibration only (now monthly):** the continuous, monthly-cadence
sources that are NOT in the weekly nowcast and refresh + re-validate on the
calibration track — `open-meteo` (`ca-frost` Yuma/Imperial min-temp), `fred` (the FX
pairs MXN/AUD/NZD/INR/NOK, feed-grain, freight, IMF salmon/shrimp), `ssb` (Norway
salmon price/volume), `foss` (salmon/shrimp import volume), `noaa-oni` (ENSO),
`eu-agri` (EU butter/cheddar). **Before 2026-06-13 these refreshed only on a manual
calibrate run** — the gap this audit closed by scheduling a monthly calibrate cron.
Calibrate writes nothing, so the monthly pass is a safe liveness + relationship
heartbeat: it surfaces a source that stopped publishing and keeps the proven-edge
set current. ⚠️→✓

## Why two tracks for pressure (not a bug)

The split is deliberate. Weekly-changing signals (freeze warnings, drought, movement,
placements) drive the **live nowcast**. Slow, monthly, zero-crossing series (FX, SST
anomalies, weather anomalies) are **calibration inputs** — they validate *which*
relationships are real (the hold-until-proven gate, methodology §10) rather than
nowcast a weekly tick. Both now run on a schedule, so neither goes stale.

## Known gaps (not yet refreshing)

- **APHIS HPAI (avian flu → eggs/poultry)** — the highest-value missing signal
  (roadmap §3e). Not built on *either* track: the structured source is CDC's
  `commercial-backyard-flocks.csv`, which **403s automated fetch** and needs a
  text/CSV fetch path (the live nowcast is JSON-only; the calibration has `fetchText`
  for ONI's flat file, the natural home). **Build on a connected run** where the CSV
  schema can be probed — a `fetchAphis` parser beside `fetchONI` + an `aphis` spec +
  an eggs rule. Until then eggs lean on cold-storage + feed-grain only.
- **GATS import unit value** (banana/avocado/lime derived levels) — measured-track
  add (`normalizeGats`), needs a FAS key + the API shape probed (adapter spec A).

## Heartbeat recommendation

The monthly calibrate pass partly fulfills the roadmap §6 "is it still publishing?"
idea. A dedicated `check-series-alive` that fails loudly when any *verified* source
returns zero rows for N cycles would close it fully — a small follow-up.
