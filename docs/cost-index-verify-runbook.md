# Cost Index — founder verify & go-live runbook

The single biggest currency unlock: flip the **44 staged sources**
(`verified:false` in `data/cost-index-sources.json`) to live, so the dashboard
and all the ingredient-yield pages light up real market reads for those
ingredients. Everything is staged and gated — this is a verification + key
session, not engineering. Run it from your laptop (it needs the API keys).

The dormant features that turn on **automatically** on the next live fetch once
a source is verified: the live market read + buy/hold verdict + live edible-unit
cost on the yield page, the **measured market spread** band (Phase B), the **EIA
electricity driver**, and the weekly **history** accumulation (sparklines).

---

## 0. Keys (once)

```bash
export FRED_KEY=…    # required
export BLS_KEY=…     # required
export AMS_KEY=…     # required (USDA MARS)
export EIA_KEY=…     # optional — lights up the electricity driver
export LMR_KEY=…     # optional — LMR Datamart (boxed beef / pork); keyless works too
```

The **sustainable** path is to set these as GitHub Actions repo secrets
(Settings → Secrets and variables → Actions). Then the Monday `cost-index-refresh`
cron does fetch → vendor → rebuild → commit every week with no laptop, and the
new heartbeat monitor emails you if it ever stalls. The local pass below is just
to confirm the staged ids before you flip them on.

## 1. Dry-run verify — see what's READY

```bash
node scripts/verify-cost-index-sources.mjs
```

Prints, per source, the live level/trend + whether it's **READY** (level in-bounds
+ ≥2 sources), **directional** (trend-only), or needs work. The footer tells you
how many are flippable.

## 2. Discovery — only for sources that don't match yet

Replace any best-guess commodity term / report id with a confirmed one:

```bash
# exact produce / fruit commodity terms (avoids the plural-guess trap)
node scripts/verify-cost-index-sources.mjs --list-commodities 2278      # vegetables
node scripts/verify-cost-index-sources.mjs --list-commodities 2277      # fruit

# items likely on a separate report
node scripts/verify-cost-index-sources.mjs --discover "mushroom"
node scripts/verify-cost-index-sources.mjs --discover "herbs"

# beef/lamb wholesale (striploin, leg-of-lamb) on the LMR Datamart
node scripts/verify-cost-index-sources.mjs --discover-lmr "boxed beef"
node scripts/verify-cost-index-sources.mjs --discover-lmr "lamb"

# a DISTINCT second PPI to lift a shared-PPI produce item medium → high
node scripts/verify-cost-index-sources.mjs --discover-fred "spinach ppi"
```

Edit the confirmed `commodity` / `reportId` / `seriesId` into
`data/cost-index-sources.json`, then re-run step 1 until the source reads READY.

## 3. Flip the READY ones

```bash
node scripts/verify-cost-index-sources.mjs --flip
```

Rewrites `verified:true` **only** for READY/directional ingredients; never touches
the rest. Commit `data/cost-index-sources.json`.

## 4. Go live (or just let the weekly cron do it)

If keys are repo secrets, skip this — the Monday cron runs it. To do it now:

```bash
node scripts/fetch-cost-index-sources.mjs --live --out /tmp/ci-artifact.json
node scripts/build-cost-index.mjs --artifact /tmp/ci-artifact.json   # fact-gated vendor
node scripts/build-cost-index-seed.mjs
node scripts/build-ingredient-yield-pages.mjs
node scripts/inject-lazy-script-loader.mjs
node scripts/build-sitemap.mjs
node scripts/check-all.mjs            # must be green before committing
git add -A && git commit -m "data(cost-index): verify pass — N sources live" && git push
```

The vendor step is fact-gated (`build-cost-index.mjs` shares the same predicate as
`check-cost-index-sync.mjs`): a source that's unverified, out-of-bounds, or stale
contributes nothing — a stale-but-true index beats a fresh-but-wrong one.

## 5. Still-open items (lower priority)

- **vegetable-oil** stays directional — no free wholesale fryer-oil series exists
  (a true ceiling, honestly labeled).
- **whole-branzino** likely has no free wholesale source — accept no market read
  (the yield page still serves the yield depth).
- **count-unit produce** (avocado/lime "each") can't show a live EP cost until a
  density (count↔weight) feed lands — see the FoodData Central note in
  `cost-index-progress.md`. The yield page is correct meanwhile.

After this pass, the engine is producing current, sourced, actionable reads
across the whole staged set, refreshed weekly and monitored for staleness.
