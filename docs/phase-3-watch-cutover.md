# Phase 3 Watch cutover runbook

This runbook walks through turning on the Watch list in production —
the scheduled re-checks of saved audits, GBP grades, SEO grades,
and other watchable kinds. Phase 3's data plane and API surface
landed in commit `de24add2` (worker.js + workbench.js) but the
Cron Trigger that actually fires the re-checks is commented out
in `wrangler.jsonc` so nothing runs until ops is ready.

The runbook is split into four phases.

- **Phase A — Implement re-check functions.** Write one function
  per watchable kind that re-runs the check and returns a 0-100
  score. Code-only change; deployed but unused until Phase D.
- **Phase B — Implement the diff-email template.** Write the
  email an operator gets when their watched item's score changes
  past a threshold. Locale-aware (EN + ES).
- **Phase C — Wire the scheduled handler.** Connect the re-check
  functions to `iterateAllWatches()` in `worker.js#scheduled`.
  Send the diff email when the change is interesting.
- **Phase D — Flip the cron on.** Uncomment the `triggers.crons`
  block in `wrangler.jsonc`, deploy, and watch logs for 24h.

You can stop after Phase A or B and the system stays in a clean
"watches persisted, nothing fires" state. Phase D is the only
externally-visible change.

---

## Prerequisites

- Phase 2 auth cutover already complete (`docs/auth-cutover.md`).
  Watch endpoints require a valid session.
- The Watch UI is live at `/workbench/` (commit `<this-one>`)
  so operators can attach watches via the browser.
- `AUTH_SESSIONS` KV is provisioned (Phase 2 prerequisite).

To verify your starting state:

```bash
curl -i https://muntin.digital/api/workbench/watch-list \
  -b 'md_session=<your-cookie>'
# → 200 with { ok: true, items: [], max: 25 } for a fresh account
```

---

## Phase A — Implement re-check functions

Create `src/lib/watch-checks.js`. One exported function per
watchable kind. Each takes `(env, savedItem)` and returns
`Promise<{ ok, score, error? }>`.

```js
// src/lib/watch-checks.js (new file)
import { sha256Hex } from './auth.js';

export async function recheckAudit(env, savedItem) {
  // savedItem.payload has { auditedUrl, score, ... } from the
  // restaurant audit's buildSnapshotPayload(). Re-fetch PSI for
  // the URL, run the same priority-checks scoring, return a
  // fresh 0..100 score. Cap upstream concurrency — see below.
  const url = savedItem.payload && savedItem.payload.auditedUrl;
  if (!url) return { ok: false, error: 'no-url' };
  // ... PSI call + scoring ...
  return { ok: true, score: newScore };
}

export async function recheckSeo(env, savedItem) {
  // Re-fetch the title + description via the existing
  // /api/seo-check internal handler, recompute grades.
}

export async function recheckGbp(env, savedItem) {
  // Re-call /api/gbp-lookup with the saved query, re-score.
}

export async function recheckMobile(env, savedItem) { /* ... */ }
export async function recheckSchema(env, savedItem) { /* ... */ }
export async function recheckSpeed(env, savedItem)  { /* ... */ }

export const RECHECK_BY_KIND = {
  audit:  recheckAudit,
  seo:    recheckSeo,
  gbp:    recheckGbp,
  mobile: recheckMobile,
  schema: recheckSchema,
  speed:  recheckSpeed,
};
```

### Concurrency

A daily cron at 14:00 UTC fires once and runs across all watches.
With 25 watches × 100 users = 2500 re-checks, hitting PSI/Places
serially would take ~20 minutes. Two mitigations:

1. **Per-tick budget.** Process at most N watches per tick. Track
   `lastCheckedAt` so the next tick picks up where the previous
   left off. With N=200 and a daily cron, full saturation comes
   at ~12.5 days from cold-start.
2. **Concurrency cap inside the tick.** Use `Promise.all` over
   slices of 5 (PSI's daily quota is 25k requests on the free
   tier; 5-wide is well under their per-second limit).

Sample harness:

```js
const PER_TICK_BUDGET = 200;
const PER_TICK_CONCURRENCY = 5;

let processed = 0;
const queue = [];
for await (const entry of iterateAllWatches(env)) {
  queue.push(entry);
  if (queue.length >= PER_TICK_BUDGET) break;
}
// Sort oldest-checked first so cold watches catch up.
queue.sort((a, b) => (a.watch.lastCheckedAt || 0) - (b.watch.lastCheckedAt || 0));

for (let i = 0; i < queue.length; i += PER_TICK_CONCURRENCY) {
  const batch = queue.slice(i, i + PER_TICK_CONCURRENCY);
  await Promise.all(batch.map(processOne));
}
```

### Schedule semantics

The cron fires daily, but `watch.schedule` may be `'weekly'`. The
loop checks the schedule before re-running:

```js
function isDueForRecheck(watch) {
  if (!watch.lastCheckedAt) return true; // never checked
  const intervalMs = watch.schedule === 'weekly' ? 7*24*3600*1000 : 24*3600*1000;
  return (Date.now() - watch.lastCheckedAt) >= intervalMs - (60*60*1000); // 1h grace
}
```

---

## Phase B — Implement the diff-email template

Add `watchDiffEmail({ kind, title, oldScore, newScore, link, locale })`
to `src/lib/templates.js` and `src/lib/templates.es.js`. Modeled
on the existing `magicLinkEmail` shape. The email is short — score
delta + a link back to the saved item on `/workbench/`. Examples:

```
Subject (EN): Your audit score moved — Joe's Pizza now 78 (+5)
Subject (ES): Tu puntaje de auditoría cambió — Joe's Pizza ahora 78 (+5)
```

### Threshold for sending

Don't email on every micro-change. Only when:

- `Math.abs(newScore - oldScore) >= 3` for audit/seo/speed
- Any state change for mobile (pass→fail or vice versa)
- Any score change for gbp/schema (rare; usually means structural)

Each watch tracks `baselineScore` (set at attach time) and
`lastScore` (most recent). The threshold compares against
`lastScore`, not baseline — otherwise small ongoing drift triggers
weekly emails.

---

## Phase C — Wire the scheduled handler

Edit `src/worker.js`'s `scheduled()` — currently a no-op that
just logs the tick + count. Replace the loop body:

```js
import { RECHECK_BY_KIND } from './lib/watch-checks.js';
import { watchDiffEmail } from './lib/templates.js';
import { recordWatchCheck, getItem } from './lib/workbench.js';

async scheduled(controller, env, ctx) {
  if (!env || !env.AUTH_SESSIONS) return;
  let processed = 0;
  let emailed = 0;
  for await (const entry of iterateAllWatches(env)) {
    if (processed >= 200) break;
    if (!isDueForRecheck(entry.watch)) continue;
    const fn = RECHECK_BY_KIND[entry.watch.kind];
    if (!fn) continue;
    try {
      const savedItem = await getItem(env, entry.sub, entry.watch.savedItemId);
      if (!savedItem) continue;
      const result = await fn(env, savedItem);
      if (!result.ok) continue;
      await recordWatchCheck(env, entry.sub, entry.watch.savedItemId, result.score);
      // Threshold check — Phase B logic.
      if (shouldEmail(entry.watch, result.score)) {
        const userRow = await env.AUTH_SESSIONS.get('user:' + entry.sub);
        const email = userRow && JSON.parse(userRow).email;
        if (email) {
          await sendEmail(watchDiffEmail({
            kind: entry.watch.kind,
            title: savedItem.title,
            oldScore: entry.watch.lastScore,
            newScore: result.score,
            link: 'https://muntin.digital/workbench/',
            locale: 'en', // Phase 3+: per-user locale preference
          }), env.RESEND_API_KEY);
          emailed++;
        }
      }
      processed++;
    } catch (err) {
      console.warn('[cron] watch failed', entry.watch.savedItemId, err && err.message);
    }
  }
  console.log(JSON.stringify({
    event: 'cron.watch_tick',
    processed, emailed,
    cron: controller && controller.cron,
  }));
}
```

Deploy this WITHOUT enabling the cron. The handler is wired but
never invoked.

---

## Phase D — Flip the cron on

In `wrangler.jsonc`, find the commented `"triggers.crons"` block:

```jsonc
// "triggers": {
//   "crons": ["0 14 * * *"]
// },
```

Uncomment it, save, then:

```bash
wrangler deploy
```

The cron fires within the next ~15 minutes (Cloudflare's scheduling
granularity). Verify in real-time:

```bash
wrangler tail --format=json | grep cron.watch_tick
```

You should see one line per tick. The first tick processes whatever
watches exist; subsequent ticks process only items past their
schedule interval.

### Rollback

If something goes wrong:

```bash
# Comment the triggers.crons block back out
git revert HEAD
git push origin main
wrangler deploy
```

The cron stops firing immediately. Active sessions and saved items
are unaffected. Watches stay attached but no re-checks run.

To delete all watches (last-resort cleanup):

```bash
wrangler kv:key list --binding=AUTH_SESSIONS --prefix watch: \
  | jq -r '.[].name' \
  | xargs -I {} wrangler kv:key delete --binding=AUTH_SESSIONS {}
```

---

## Phase D smoke test (read this before deploying)

After Phase D ships:

1. **Attach a test watch.** Sign in. Save an audit. Click "+ Watch
   daily" on `/workbench/`. Confirm KV: `wrangler kv:key list
   --binding=AUTH_SESSIONS --prefix=watch:`.
2. **Force a tick early.** Wrangler doesn't expose a "fire cron now"
   command for production, but `wrangler dev --test-scheduled` works
   in local dev. For prod, just wait until the next daily fire.
3. **Verify the tick fired.** `wrangler tail` should show
   `cron.watch_tick` with processed > 0.
4. **Verify the score updated.** `wrangler kv:key get
   --binding=AUTH_SESSIONS watch:<sub>:<id>` should show
   `lastCheckedAt: <recent-ms>` and `lastScore: <number>`.
5. **Verify (or not) the email.** If the score didn't change past
   threshold, no email is expected. Force one by manually editing
   `lastScore` in KV to a value far from the current score, then
   wait for the next tick.

---

## Reference

- Watch helpers: `src/lib/workbench.js` (search `WATCH_KEY_PREFIX`)
- Watch endpoints: `src/worker.js` (search `handleWorkbenchWatch`)
- scheduled() handler stub: `src/worker.js` (end of `default` export)
- Cron trigger config: `wrangler.jsonc` (commented block, search "Phase 3")
- Watch UI: `workbench/index.html` + `es/workbench/index.html`
  (search `WATCHABLE_KINDS`)
- Auth runbook (prerequisite): `docs/auth-cutover.md`
- Save pattern (for adding new watchable kinds): `docs/workbench-save-pattern.md`
