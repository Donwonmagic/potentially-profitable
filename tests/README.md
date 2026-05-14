# Playwright tests for muntin.digital tool suite

Phase 8 of the May 2026 upgrade. These tests catch the regression class that triggered the whole branch: "the bottom half of some tools glitch out half way down the page and display bare code."

## Setup (one-time, local)

The repo's `.gitignore` excludes `package.json` (convention: contributors maintain their own for scripts that need npm modules — puppeteer PDFs, Playwright, etc). Create one locally with:

```bash
cat > package.json <<'EOF'
{
  "name": "muntin-digital",
  "type": "module",
  "scripts": {
    "test:playwright": "playwright test",
    "test:playwright:update": "playwright test --update-snapshots"
  },
  "devDependencies": { "@playwright/test": "^1.56.1" }
}
EOF
npm install
npx playwright install chromium
```

## Run

```bash
# All tests (scroll-bottom regression + hub baseline) × 3 viewports
npm run test:playwright

# Refresh snapshots after intentional visual changes
npm run test:playwright:update

# Just the scroll-bottom regression (the original complaint test)
npx playwright test scroll-bottom.spec.mjs
```

The config serves the static site via Python's `http.server` on port 8765 — no Node web-server dependency. Make sure `python3` is on PATH.

## What each test file does

- **`scroll-bottom.spec.mjs`** — loads every live tool, scrolls to the bottom, asserts no bare HTML markup leaks into rendered text, page height > 600px, no console errors. This is the gate that catches Phase 0's failure mode.

- **`hub-baseline.spec.mjs`** — asserts the Start-here CTA is above the fold, the tier filter strip activates with JS, the filter actually hides non-matching cards, and a desktop visual snapshot of the hub stays stable. Masks the `.ctx-pill` since its content varies by localStorage state.

## CI

Not yet wired into `scripts/check-all.mjs`. Phase 8 deliverable is the test suite + config; CI integration is a follow-up so you can review the snapshot baseline first.

To wire later: add `playwright test` to a GitHub Actions workflow under `.github/workflows/`, install Chromium via `npx playwright install --with-deps chromium`, and gate merge on green.
