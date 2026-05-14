# Tool suite — performance + accessibility baseline

This document captures the state of the tool suite after Phases 0–5 of the May 2026 upgrade and lists the work that still needs a human pass.

## Performance budget (target, not yet enforced)

Each tool page should aim for:

- JS shipped (compressed): **≤ 50 KB**
- CSS shipped (compressed): **≤ 20 KB** (shared shells: site-core ~50 KB + site-tool ~12 KB; per-tool inline CSS counts toward the budget)
- LCP on mid-tier mobile (Slow 4G profile): **< 2.5 s**
- CLS: **< 0.1**
- a11y score (axe): **0 critical violations**

`lighthouserc.js` already runs Lighthouse CI against every tool. Phase 5 follow-up should turn the existing pass/fail into hard budgets that fail the build, with a per-tool exemption table for `audits/restaurant` (19,200 lines) and `brand-suite` (3,919 lines) that have a documented remediation plan.

**Current state**: no per-tool budgets are pinned. The next session should run Lighthouse once across every tool, write the actual JS/CSS/LCP numbers into a table, and use those as the floor (no regressions allowed without a budget bump).

## Accessibility — what passes today

The Phase 0–4 work added a11y in places it had been missing:

- **Hub** (`tools/index.html`, `es/tools/index.html`):
  - Tier-filter strip: `role="group"`, `aria-pressed` toggled per button, `:focus-visible` ring via `var(--ring-focus)`.
  - Hero CTAs: primary `<a class="btn btn-primary">` + ghost variant, both are focusable + tab-orderable.
  - `.ctx-pill`: `role="status"` + `aria-live="polite"`; the "Continue → Tool" chip is a real `<a>`.
- **Tool result regions** (post-Phase 3 hardening: schema-check, tech-stack, mobile-check):
  - Every render goes through `MuntinSafeHtml.setHTML` or DOM construction; no innerHTML+string-concat survives.
  - Result containers carry `aria-live="polite"` (where the original markup had it; Phase 3 retrofits preserved it).
- **Shared UI primitives** (`tools/_shared/ui/ui.js`):
  - `button()` — proper `<button>` element, `aria-label` passthrough, `:focus-visible` ring.
  - `formGroup()` — auto-wires `aria-required`, `aria-invalid`, `aria-describedby` (with append-not-overwrite if the control already had one).
  - `tabs()` — full keyboard a11y (Arrow-left/right/Home/End), `aria-selected`, `aria-controls`.
  - `modal()` — focus trap, Esc dismiss, initial focus inside dialog, returns focus to opener on close.
  - `toast()` — `aria-live="polite"` + `aria-atomic="true"` on the singleton container.
  - `breadcrumb()` — `<nav aria-label="Breadcrumb">` + `aria-current="page"` on last item.

## Accessibility — what still needs a manual pass

These items were intentionally deferred to a session where a screen-reader test is in the loop:

- **VoiceOver iOS** on hub + 5 highest-traffic tools (plate-cost, gbp-grader, menu-copy, audits/restaurant, brand-suite). Verify focus order, aria-live announcements when async results arrive, breadcrumb pronunciation, modal focus trap.
- **Contrast pass** on the dark-mode token block (`prefers-color-scheme: dark` + `[data-theme="dark"]`). Phase 5 ships the token swap; the status palette (`--status-good`, `--status-warn-deep`, etc.) keeps its values because they were tuned on cream. Components that put status text on status-tint backgrounds pass AA in light; dark needs verification.
- **Keyboard-only flow**: tab from hub hero → tier filter → cluster → tool card → tool form → result. Should be a fluid path with no traps or invisible focus states.
- **Per-tool retrofit gap**: 14 of 19 tools still have legacy innerHTML/string-concat render paths (Phase 3 hardened 3). Each retrofit gets the safe-html + DOM-construction pattern; the `check-no-innerhtml.mjs` baseline drops as tracks land.

## Dark mode

**Status**: tokens land in this commit; user-facing toggle does not.

- `prefers-color-scheme: dark` automatically activates the dark `--mtn-*` token set; pages with `data-theme="light"` on `<html>` override back to light.
- `[data-theme="dark"]` on `<html>` is an explicit override the future toggle button will set.
- The toggle UI deliberately ships in a follow-up because placement (header / footer / settings drawer) is an owner decision. Until then the OS preference governs.
- Persistence path is reserved: `MuntinSafeStorage.set('theme', 'dark'|'light'|'auto')` with the existing quota-aware wrapper. The toggle reads this on init and writes on click; no localStorage namespace conflict because the key sits outside `MuntinContext`.

## Analytics deprecation runway

The Phase 2 CTA unification renamed every tool's CTA text; the underlying Plausible events kept their old names because the registry (`tools/_shared/analytics.js`) is the authority. No deprecation needed for CTAs.

Phase 3 hardening did not rename events. Phase 4 added one new event (`Tools Hub Filter`).

When the tool merges in `docs/tool-merge-plan.md` ship, the merged tools must fire both old (`Open Hours Generated`, `Holiday Hours Generated`, `Speed Test Run`, `Mobile Check Verdict`) and new event names for 30 days so historical Plausible trend data doesn't snap.

## What ships in production after this branch lands

- 12 confirmed bare-code render fixes (Phase 0)
- 5 new shared utility modules + 9 UI primitives + design tokens + new CI check (Phase 1)
- Hub redesign with tier filter, unified CTAs, promoted quiz (Phase 2)
- 3 tools hardened to safe-html DOM construction (Phase 3 batch 1)
- Restaurant Profile + next-tool recommender (Phase 4)
- Dark mode tokens (Phase 5)

## What is NOT in this branch (deferred to a dedicated session)

- The two tool merges (`store-hours`, `page-health`) — documented in `docs/tool-merge-plan.md`.
- Hardening of the remaining 14 tools — driven by `check-no-innerhtml.mjs` baseline ratchet.
- Dark-mode toggle button UI — placement decision pending.
- Per-tool Playwright snapshot matrix (228 snapshots × 3 viewports × 4 states) — needs a dedicated CI runner allocation.
- Per-tool a11y screen-reader pass — needs an iOS device or BrowserStack VoiceOver session.

## How to run the gates manually

```bash
# Master check (existing — passes 116/118; 2 pre-existing glossary drifts)
node scripts/check-all.mjs

# innerHTML baseline (advisory mode prints current count + top files)
node scripts/check-no-innerhtml.mjs

# innerHTML baseline (strict — fails if count > pinned BASELINE_COUNT)
node scripts/check-no-innerhtml.mjs --check

# CSS shells (must be clean after editing assets/site.css)
node scripts/check-css-shells.mjs

# Locale parity (EN ↔ ES tool tree must match)
node scripts/check-locale-parity.mjs

# Lighthouse CI (existing — currently runs but doesn't gate on budgets)
npx lhci autorun
```
