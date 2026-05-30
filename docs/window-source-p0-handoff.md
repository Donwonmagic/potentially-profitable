# P0 — Window cross-site `source` tag (in progress)

Branch: `claude/trusting-allen-aBcKf` (based on main `2718b5e68`, which has the merged dark-mode #394).

## Done (committed/working-tree)
- `src/lib/window.js`:
  - `WINDOW_SOURCES` set + `normalizeWindowSource()` (allowlist `ledger|digital|blog|tool`, else `''`). Unit-verified.
  - `createThread(env, sub, email, source='')` stamps `thread.source` once at creation.
  - `upsertAdminIndex` copies `thread.source` → admin index `entry.source`.
- `src/worker.js`: imported `normalizeWindowSource`; `handleWindowAppend` parses `body.source` → `windowSource`; passes it to `createWindowThread` (identified path, ~L6461).
- `assets/js/window.js`: append POST now submits `source` from hidden `#windowSource` (set by existing `applySource()`).
- All 3 files pass `node --check`.

## TODO (next session)
1. **Anon path**: `handleWindowAppend` has a second branch using `createAnonThread` (~L6356 area). Pass `windowSource` there too for parity (check `createAnonThread` signature in src/lib/window.js ~L660).
2. **Admin chip**: `assets/js/admin-window.js` — render a small "from Ledger" chip on thread rows when `entry.source === 'ledger'` (and generic for others). Find the row-render fn.
3. **Plausible**: optionally add `props.source` to the existing "Window Send" event in window.js.
4. Run `node scripts/check-all.mjs` (expect 147/147) + build chain; commit; push; PR.

## Notes
- Frontend `applySource()` (window.js ~L832) already captures+sanitizes `?source=` to hidden `#windowSource` — shipped in #395 but was never submitted (the gap P0 closes).
- Handoff doc of record: `docs/window-redesign-plan.md`. Deferred phases 0–5 are owner-blocked (secrets/legal/vendors) — not in scope.
- `/v1/hablanos` decommission = Don's decision, not actioned.
