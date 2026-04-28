# Adding Save-to-Workbench to a tool

This is the copy-paste recipe for putting a "Save to my Workbench"
affordance on any free tool. The first five tools (SEO grader,
speed test, mobile check, schema check, GBP grader) ship with the
logic inlined per-file as the proof of pattern. Every tool added
after Phase 2 should use the shared helper at
`assets/workbench-save.js` instead — it cuts the integration from
~80 lines per tool to ~10.

## Prerequisites

- The session-cookie auth surface is live (see `docs/auth-cutover.md`).
- The tool produces a serializable result (under 50 KB JSON).
- The tool has a render path you can call programmatically — i.e.
  there is some `renderResult(payload)` function (or equivalent)
  that turns a payload back into the visible output without
  re-calling any external API.

If those three boxes check, integration is mechanical.

## Step 1 — pick a `kind`

The kind is the closed enum tracked in `src/lib/workbench.js`.
The 15 kinds shipped at Phase 2:

```
audit, seo, gbp, mobile, schema, speed,
margin, plate, photo, menu, brand,
open-hours, compare, tech-stack, search-ideas
```

If your tool isn't in that list, add it to `ALLOWED_KINDS` in
`src/lib/workbench.js` AND add a label + URL entry in
`KIND_LABELS` / `KIND_URLS` of `workbench/index.html` and
`es/workbench/index.html` (these power the chip + Open link on the
Workshop list page).

## Step 2 — drop the CSS into the tool's inline `<style>`

```css
/* Phase 2 (Workshop) — Save-to-Workbench. Copy verbatim. */
.X-save { margin-top: 24px; padding: 18px 22px; background: var(--surface-inset); border: 1px solid var(--line); border-radius: var(--r-md); display: flex; gap: 14px; align-items: center; flex-wrap: wrap; justify-content: space-between; }
.X-save[hidden] { display: none; }
.X-save-text { font-size: 14px; color: var(--ink-soft); margin: 0; line-height: 1.5; flex: 1; min-width: 200px; }
.X-save-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border: 1px solid var(--ink); border-radius: 999px; background: var(--ink); color: var(--cream); font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; transition: background var(--t-fast) var(--ease), transform var(--t-fast) var(--ease); }
.X-save-btn:hover { background: var(--teal); transform: translateY(-1px); }
.X-save-btn[disabled] { opacity: 0.6; cursor: wait; }
.X-save-link { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border: 1px solid var(--line-dark); border-radius: 999px; color: var(--ink); font-size: 14px; font-weight: 500; text-decoration: none; transition: border-color var(--t-fast) var(--ease); }
.X-save-link:hover { border-color: var(--ink); }
.X-save-msg { font-size: 13px; color: var(--status-good); font-weight: 500; }
.X-save-msg.error { color: var(--rust); }
```

Replace `X` with the tool's prefix (e.g. `pc` for plate-cost,
`me` for menu-engineering). The class names are hardcoded per-tool
so two tools on the same page wouldn't collide; the IDs below are
what the helper actually targets.

## Step 3 — drop the HTML inside the result wrapper

```html
<div class="X-save" id="XSave" hidden>
  <p class="X-save-text" id="XSaveText">Save this result to your Workbench so it follows you across devices.</p>
  <button type="button" class="X-save-btn" id="XSaveBtn" hidden>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
    Save to my Workbench
  </button>
  <a class="X-save-link" id="XSaveLink" href="/sign-in/?returnTo=%2Ftools%2FYOUR-TOOL%2F" hidden>Sign in to save</a>
  <span class="X-save-msg" id="XSaveMsg" hidden role="status"></span>
</div>
```

Place it after your tool's existing CTA block, inside the same
visible-when-result-is-visible container. The helper reveals it
via `showAffordance(payload)`.

## Step 4 — load the helper + wire it up

At the bottom of the tool's HTML (before the closing tags):

```html
<script src="/assets/workbench-save.js?v=20260428-sprint0-tokens"></script>
<script>
  (function () {
    var wb = MuntinWorkbench.attach({
      elements: {
        box:  '#XSave',
        btn:  '#XSaveBtn',
        link: '#XSaveLink',
        text: '#XSaveText',
        msg:  '#XSaveMsg',
      },
      locale: 'en',                              // 'en' | 'es'
      kind:   'YOUR_KIND',                       // see Step 1
      titleFor: function (p) {
        return 'YOUR LABEL — ' + (p.someField || 'untitled');
      },
      onRehydrate: function (payload) {
        // Replay your tool's render with the saved payload.
        // No API re-fetch — the saved payload is the source of truth.
        renderResult(payload);
      },
      workbenchUrl: '/workbench/',
      signinUrl:    '/sign-in/?returnTo=%2Ftools%2FYOUR-TOOL%2F',
    });

    // After every fresh render — submit handler, recompute, etc. —
    // call this with the same payload you'd want to save.
    // Wire it up wherever your tool produces a result:
    //
    //   var payload = { url: url, score: score, /* ... */ };
    //   renderResult(payload);
    //   wb.showAffordance(payload);
    //
  })();
</script>
```

That's it. The helper handles:

- Caching `/api/auth/me` on load (one round-trip, not per-render)
- Toggling Save button vs. "Sign in to save" link based on auth state
- POSTing to `/api/workbench/save` when the user clicks Save
- Locale-aware error copy for 401 (session expired), 409
  (limit-reached), 5xx (generic), and network failure
- Rehydrating from `?saved=<id>` on page load, calling your
  `onRehydrate(payload)` and stripping the query param so a
  refresh re-runs against the live tool

## Step 5 — Spanish mirror

Mirror the same edits to `es/tools/YOUR-TOOL/index.html` with
`locale: 'es'`, `signinUrl: '/es/sign-in/?returnTo=%2Fes%2Ftools%2FYOUR-TOOL%2F'`,
and `workbenchUrl: '/es/workbench/'`. The helper picks Spanish
copy from its built-in dictionary.

## Step 6 — run the check scripts

```bash
node scripts/check-css-drift.mjs
node scripts/check-locale-parity.mjs --check
node scripts/test-cards-qa.mjs
```

If all three are clean, commit and push.

## Payload design — what to save

The saved payload is whatever JSON your tool needs to re-render
without calling external APIs. Keep it under 50 KB serialized.
Examples from the existing five integrations:

| Tool         | Payload shape |
|---|---|
| SEO grader   | `{ url, title, description, titleScore, descScore, gradedAt }` |
| Speed test   | `{ url, score, lcp, fcp, tbt, cls, testedAt }` |
| Mobile check | `{ url, results: [...], passCount, failCount, unknownCount, checkedAt }` |
| Schema check | `{ url, foundTypes, checkedAt }` |
| GBP grader   | `{ chosen, deepScan, peerMedians, query, wasPicked, savedAt }` |

The fields aren't standardized — each tool stores what its
render path needs.

## Anti-patterns

- **Don't save sensitive data.** The KV value is per-user but
  it's still server-stored. Don't save anything the user wouldn't
  paste into a Slack DM.
- **Don't save more than 50 KB.** The cap in
  `src/lib/workbench.js` is enforced; oversized saves return 400.
- **Don't migrate the existing 5 inlined integrations** unless
  there's a specific reason. They work, the helper is functionally
  equivalent, and the migration risk outweighs the consistency
  gain. New tools use the helper; old tools stay as-is.
- **Don't add a kind to `ALLOWED_KINDS` without also adding it
  to `KIND_LABELS` and `KIND_URLS` in the workbench list pages.**
  The list will silently render the kind string as the chip label
  and link to `/tools/` (the fallback) until both sides are
  updated.

## Migrating an existing tool to the helper (optional)

If you ever want to migrate one of the five existing inlined
integrations, the steps are:

1. Delete the inlined `authState`, `showSaveAffordance`,
   `if (saveBtn) saveBtn.addEventListener(...)`, and
   `rehydrateFromSaved(...)` blocks.
2. Delete the `try { ... __sp.get('saved') ... }` block at the
   bottom of the IIFE.
3. Add the `<script src="/assets/workbench-save.js">` tag.
4. Add the `MuntinWorkbench.attach({...})` config.
5. Replace inline `showSaveAffordance(payload)` calls with
   `wb.showAffordance(payload)`.

Each migration drops ~70 lines from the tool file. Save it for a
quiet sprint when no one is changing the affected tool's logic.
