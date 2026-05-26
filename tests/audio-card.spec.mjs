// Audio card — feature regression tests for the listen.js redesign.
//
// What's covered here:
//   - The dropdown overlap fix (Phase 1)
//   - The eyebrow + muntin underline + headline refresh (Phase 2)
//   - The studio-mode signature byline (Phase 2)
//   - Preview button visibility + speech-fallback hiding (Phase 5)
//   - Share-with-timestamp button (Phase 5)
//   - Resume chip render conditions + dismiss behavior (Phase 5)
//   - `?t=` deep link parsing (Phase 5)
//   - `?seek=1` flag gates body[data-audio-seek] (Phase 4)
//   - Spanish localization of card text (i18n)
//
// What's NOT covered: actual audio playback. Studio MP3 playback in
// headless Chromium is flaky (autoplay policy, AudioContext suspend,
// no real audio output device). We test the WIRING of state changes
// and rendered chrome, not the audible result. The build-time
// scripts/audio-post-process.mjs has its own measurement-based
// verification (ffmpeg loudnorm JSON) that's appropriate for that
// layer.
//
// Article under test:
//   /blog/30-days-after-leaving-doordash-restaurant-case-study/
//   Has 6 language variants, a chapter manifest, and 13 minutes of
//   audio — long enough that the resume chip's "> 30s in, < 95% of
//   duration" eligibility window can be exercised.

import { test, expect } from '@playwright/test';

const ARTICLE = '/blog/30-days-after-leaving-doordash-restaurant-case-study/';
const ARTICLE_ES = '/es/blog/wix-vs-custom-for-restaurants/';

test.describe('Audio card — visual chrome', () => {
  test('eyebrow renders in stone with a teal underline (muntin motif)', async ({ page }) => {
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    const kicker = page.locator('.listen-card-kicker').first();
    const color = await kicker.evaluate((el) => getComputedStyle(el).color);
    const border = await kicker.evaluate((el) => getComputedStyle(el).borderBottom);
    // --stone = #6B7280 = rgb(107, 114, 128)
    expect(color).toBe('rgb(107, 114, 128)');
    // 3px solid + current --teal (#2A50C8 = rgb(42, 80, 200))
    expect(border).toMatch(/3px solid rgb\(42, 80, 200\)/);
  });

  // Desktop / tablet branch — runs in projects with viewport >= 720.
  test('headline clamp() lands between 22 and 26 px above 720', async ({ page, viewport }) => {
    test.skip(viewport.width < 720, 'desktop/tablet only');
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    const size = await page.locator('.listen-card-title').evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    );
    expect(size).toBeGreaterThanOrEqual(22);
    expect(size).toBeLessThanOrEqual(26);
  });
  // Mobile branch — verifies the @media (max-width:720) override fires.
  // Previously folded into the same test with a viewport-conditional
  // branch, which made the mobile branch dead code under --project=desktop
  // (audit finding #4).
  test('headline drops to 20px under the 720 breakpoint', async ({ page, viewport }) => {
    test.skip(viewport.width >= 720, 'mobile only');
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    const size = await page.locator('.listen-card-title').evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    );
    expect(size).toBeCloseTo(20, 0);
  });

  test('language select reserves room for the globe glyph', async ({ page }) => {
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    const padLeft = await page
      .locator('.listen-card .listen-language')
      .evaluate((el) => getComputedStyle(el).paddingLeft);
    // 32px reservation; the globe ::before is at left:12px width:14px.
    // Before the fix this was 10px (the bug shown in the user's screenshot).
    expect(parseFloat(padLeft)).toBeGreaterThanOrEqual(28);
  });
});

test.describe('Audio card — affordances', () => {
  test('30-second preview button renders in studio mode', async ({ page }) => {
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    const preview = page.locator('.listen-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(/30-second preview|30 segundos/);
  });

  test('share button mounted inside extras row', async ({ page }) => {
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    const share = page.locator('.listen-card-extras .listen-share');
    // Extras row is hidden until first play, but the BUTTON is still in DOM.
    await expect(share).toHaveCount(1);
  });

  test('resume chip renders when localStorage has a recent saved position', async ({ page, context }) => {
    // Pre-seed the prefs key with a recent saved position for this slug.
    await context.addInitScript(() => {
      localStorage.setItem('muntin.audioPrefs.v1', JSON.stringify({
        lastPosition: {
          '30-days-after-leaving-doordash-restaurant-case-study': {
            t: 252,                              // 4:12
            savedAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
          },
        },
      }));
    });
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    const chip = page.locator('.listen-resume');
    await expect(chip).toBeVisible();
    const timeText = await page.locator('.listen-resume-time').textContent();
    expect(timeText).toBe('4:12');
  });

  test('resume chip suppressed when `?t=` deep link is present', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('muntin.audioPrefs.v1', JSON.stringify({
        lastPosition: {
          '30-days-after-leaving-doordash-restaurant-case-study': {
            t: 252, savedAt: Date.now() - 1000 * 60 * 30,
          },
        },
      }));
    });
    await page.goto(ARTICLE + '?t=2m');
    await page.waitForSelector('.listen-card');
    const chip = page.locator('.listen-resume');
    await expect(chip).toBeHidden();
  });

  test('resume chip dismiss button clears the saved record', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('muntin.audioPrefs.v1', JSON.stringify({
        lastPosition: {
          '30-days-after-leaving-doordash-restaurant-case-study': {
            t: 252, savedAt: Date.now() - 1000 * 60 * 30,
          },
        },
      }));
    });
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-resume:not([hidden])');
    await page.locator('.listen-resume-dismiss').click();
    await expect(page.locator('.listen-resume')).toBeHidden();
    // Confirm the prefs record was deleted.
    const remaining = await page.evaluate(() => {
      const prefs = JSON.parse(localStorage.getItem('muntin.audioPrefs.v1') || '{}');
      return prefs.lastPosition?.['30-days-after-leaving-doordash-restaurant-case-study'];
    });
    expect(remaining).toBeUndefined();
  });
});

test.describe('Audio card — click-to-seek flag', () => {
  // We can't reliably play audio in headless Chromium (autoplay policy,
  // AudioContext suspend, no output device). Instead we drive the engine
  // by clicking the play button — listen.js's startPlayback calls
  // setState('loading') which fires the data-audio-seek toggle inside
  // the production code path. The audio fetch may fail in headless,
  // but the setState side-effect runs synchronously before the await.
  // Audit finding #3 — previously the test re-implemented the gate
  // logic inline and passed without touching production code.

  test('?seek=1 absent: body[data-audio-seek] never appears even after state transitions', async ({ page }) => {
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    // Click play to trigger setState. The engine's seekFlagOn const
    // is captured at init time from the URL — without ?seek=1 it's
    // false, and setState's `next !== 'idle' && seekFlagOn` evaluates
    // false for every transition.
    await page.locator('.listen-card-play').click().catch(() => {});
    // Give setState a tick to fire and toggle the attr (if it would).
    await page.waitForTimeout(200);
    const hasAttr = await page.evaluate(() => document.body.hasAttribute('data-audio-seek'));
    expect(hasAttr).toBe(false);
    const cursor = await page.locator('.article-body p').first().evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('auto');
  });

  test('?seek=1 present: body[data-audio-seek] appears once state leaves idle', async ({ page }) => {
    await page.goto(ARTICLE + '?seek=1');
    await page.waitForSelector('.listen-card');
    // Pre-state: idle. The attr should NOT yet exist.
    const preAttr = await page.evaluate(() => document.body.hasAttribute('data-audio-seek'));
    expect(preAttr).toBe(false);
    // Click play. setState('loading') runs inside startStudioPlayback
    // synchronously before its first await. data-audio-seek toggles
    // because state !== 'idle' AND seekFlagOn is true.
    await page.locator('.listen-card-play').click().catch(() => {});
    await page.waitForTimeout(200);
    const postAttr = await page.evaluate(() => document.body.hasAttribute('data-audio-seek'));
    expect(postAttr).toBe(true);
    const cursor = await page.locator('.article-body p').first().evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
  });
});

test.describe('Audio card — help dialog', () => {
  // The help dialog is the home for the keyboard shortcuts (otherwise
  // undiscoverable) and a short editorial note about the synthetic
  // narration. These tests lock in the audit-driven UX choices: focus
  // lands on the title (not the close button — Space/Enter reflex
  // protection), Space inside the dialog doesn't toggle play, ESC
  // closes natively, and outside-click only fires for genuine backdrop.

  async function openHelpAndReady(page) {
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    // Audit finding #2: help button is in the always-visible meta
    // column, NOT in .listen-card-extras. No reveal needed — the
    // dialog is discoverable from idle.
    await page.locator('.listen-help').click();
    await page.waitForTimeout(150);
  }

  test('opens with focus on the title (not the close button)', async ({ page }) => {
    await openHelpAndReady(page);
    const focused = await page.evaluate(() => ({
      className: document.activeElement?.className,
      tagName: document.activeElement?.tagName,
    }));
    expect(focused.tagName).toBe('H3');
    expect(focused.className).toContain('listen-help-title');
  });

  test('Space inside the dialog does not toggle the player', async ({ page }) => {
    // The global keyboard handler bails first on `state === 'idle'`,
    // THEN on the dialog-open guard (listen.js:1987 then 1994). Both
    // gates terminate the handler the same way, so a test where state
    // never leaves idle can't distinguish whether the dialog gate
    // works or not — audit finding #1. Prime past idle by clicking
    // Play before opening the dialog. In headless the play() call
    // rejects (no audio device), but setState('loading') runs
    // SYNCHRONOUSLY before that rejection — state transitions to
    // 'loading' and stays there until something else moves it.
    await page.goto(ARTICLE);
    await page.waitForSelector('.listen-card');
    await page.locator('.listen-card-play').click({ force: true }).catch(() => {});
    // Poll for the state transition rather than fixed-sleeping; the
    // engine fires setState synchronously inside the click handler so
    // this completes in milliseconds — but be tolerant of slow CI
    // runners. If it never transitions, that's a real bug to
    // investigate, not a test to skip silently.
    await expect.poll(async () =>
      await page.locator('.listen-card').getAttribute('data-state'),
      { timeout: 2000, message: 'engine never transitioned past idle — Space-in-dialog test cannot verify the bail-out gate (audit finding #3)' }
    ).not.toBe('idle');
    // Open the dialog
    await page.locator('.listen-help').click();
    await expect(page.locator('.listen-help-dialog[open]')).toHaveCount(1);
    // Now press Space inside the dialog. The bail-out should
    // intercept before the handler reaches the play/pause case.
    const before = await page.locator('.listen-card').getAttribute('data-state');
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    const after = await page.locator('.listen-card').getAttribute('data-state');
    expect(after).toBe(before);
  });

  test('ESC closes the dialog (native <dialog> behavior)', async ({ page }) => {
    await openHelpAndReady(page);
    await expect(page.locator('.listen-help-dialog[open]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await expect(page.locator('.listen-help-dialog[open]')).toHaveCount(0);
  });

  test('close button × dismisses the dialog', async ({ page }) => {
    await openHelpAndReady(page);
    await page.locator('.listen-help-close').click();
    await page.waitForTimeout(150);
    await expect(page.locator('.listen-help-dialog[open]')).toHaveCount(0);
  });

  test('chapter list is populated from article H2s (excluding card headline)', async ({ page }) => {
    await openHelpAndReady(page);
    await expect(page.locator('.listen-help-chapters-section')).toBeVisible();
    const chapterTexts = await page.locator('.listen-help-chapters button').allTextContents();
    expect(chapterTexts.length).toBeGreaterThanOrEqual(2);
    // The audio card's own H2 ("Prefer to listen?") is filtered out by
    // the .listen-card exclusion — assert it's NOT in the list.
    expect(chapterTexts).not.toContain('Prefer to listen?');
    // First chapter on the test article is the H2 introducing week 1.
    expect(chapterTexts[0]).toMatch(/Week 1/);
  });

  test('clicking a chapter closes the dialog and scrolls to the H2', async ({ page }) => {
    await openHelpAndReady(page);
    // Click the second chapter to ensure scroll/seek behavior is real
    // (the first might already be in view).
    const secondChapter = page.locator('.listen-help-chapters button').nth(1);
    const chapterId = await secondChapter.getAttribute('data-chapter-id');
    await secondChapter.click();
    // Dialog closes
    await expect(page.locator('.listen-help-dialog[open]')).toHaveCount(0);
    // The corresponding H2 is now visible (smooth-scroll happened).
    // We poll briefly because smooth scroll is animated.
    await expect.poll(async () => {
      return page.locator(`#${chapterId}`).isVisible();
    }, { timeout: 2000 }).toBe(true);
  });

  test('content includes the documented shortcut rows in order', async ({ page }) => {
    await openHelpAndReady(page);
    // Audit finding #4 — assert the EXACT sequence so a future refactor
    // that collapses J and K into <kbd>J / K</kbd> would fail this test
    // (per the contract: each shortcut gets its own kbd element).
    const kbdTexts = await page.locator('.listen-help-kbd kbd').allTextContents();
    expect(kbdTexts).toEqual(['Space', 'J', 'K', '←', '→']);
  });
});

test.describe('Audio card — i18n', () => {
  test('Spanish article localizes the visible card chrome', async ({ page }) => {
    await page.goto(ARTICLE_ES);
    await page.waitForSelector('.listen-card');
    // These three are visible on initial render — verify visibility AND copy.
    await expect(page.locator('.listen-card-kicker')).toBeVisible();
    await expect(page.locator('.listen-card-kicker')).toHaveText(/Edición en audio/i);
    await expect(page.locator('.listen-card-title')).toBeVisible();
    await expect(page.locator('.listen-card-title')).toHaveText(/Prefieres escucharlo/);
    await expect(page.locator('.listen-card-sub')).toBeVisible();
    await expect(page.locator('.listen-card-sub')).toContainText('Pulsa reproducir');
  });

  // The byline lives inside .listen-card-extras which is hidden until first
  // play (`assets/js/listen.js:2297`). toHaveText reads textContent, which
  // is populated at mount — so we assert the copy is right BUT also flip
  // the extras row visible first so a `display:none` regression on
  // .listen-source-note would surface (audit finding #5).
  test('Spanish byline text is "Narrado para The Muntin Desk" and visible when revealed', async ({ page }) => {
    await page.goto(ARTICLE_ES);
    await page.waitForSelector('.listen-card');
    await page.locator('.listen-card-extras').evaluate((el) => { el.hidden = false; });
    await expect(page.locator('.listen-source-note')).toBeVisible();
    await expect(page.locator('.listen-source-note')).toHaveText(/Narrado para The Muntin Desk/);
  });
});
