#!/usr/bin/env node
// Phase 3 #5: menu intelligence (prices + dish photos) regression test.
// Run via: `node scripts/test-menu-intelligence.mjs`
//
// Locks in the contract that drives the new menu-depth priority
// check: prefer the crawled menu-slot page, fall back to the
// homepage HTML, count price-pattern matches, count <img> tags,
// threshold against PRICE_FLOOR / PHOTO_FLOOR, and enumerate gaps.
//
// Pricing + photo thresholds are defensible FLOORS not medians —
// a menu with 4 prices has hidden most of the carte, and a page
// with 2 images is probably just a hero + logo.
//
// Exits non-zero on failure so CI can gate on it.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const C = require('../tools/audits/restaurant/restaurant-checks.js');
const {
  extractMenuSignals,
  MENU_INTEL_PRICE_FLOOR,
  MENU_INTEL_PHOTO_FLOOR
} = C;

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// Build a fake crawl bundle with a menu-slot page containing the
// supplied HTML. A bit over 2 KB padding keeps the size guard in
// extractMenuSignals happy (real menu pages are much larger).
function menuCrawl(html) {
  const padding = '<p>' + 'padding '.repeat(300) + '</p>';
  return {
    crawl: {
      pages: [
        { slot: 'menu', status: 200, url: 'https://example.com/menu/', html: html + padding }
      ],
      homepage: { html: '', url: 'https://example.com/' }
    }
  };
}

// --- Test 1: full menu page (prices + photos) -> all signals pass --
{
  const html = `
    <h1>Menu</h1>
    <ul>
      <li>Margherita <img src="/m.jpg" alt=""> $14.50</li>
      <li>Pepperoni <img src="/p.jpg" alt=""> $16.00</li>
      <li>Carbonara <img src="/c.jpg" alt=""> $18.25</li>
      <li>Tiramisu  <img src="/t.jpg" alt=""> $9.00</li>
      <li>Espresso  <img src="/e.jpg" alt=""> $3.50</li>
      <li>Wine glass $12</li>
    </ul>`;
  const out = extractMenuSignals(menuCrawl(html));
  assert('full-menu: hasMenuPage',       out.hasMenuPage);
  assert('full-menu: >= PRICE_FLOOR',     out.pricesCount >= MENU_INTEL_PRICE_FLOOR,
    'pricesCount=' + out.pricesCount);
  assert('full-menu: >= PHOTO_FLOOR',     out.imagesCount >= MENU_INTEL_PHOTO_FLOOR,
    'imagesCount=' + out.imagesCount);
  assertEq('full-menu: no gaps', out.gaps, []);
  assert('full-menu: sourceUrl set', out.sourceUrl === 'https://example.com/menu/');
}

// --- Test 2: prices visible, no photos ------------------------------
{
  const html = `
    <h1>Menu</h1>
    <ul>
      <li>Margherita $14.50</li>
      <li>Pepperoni  $16.00</li>
      <li>Carbonara  $18.25</li>
      <li>Tiramisu   $9.00</li>
      <li>Espresso   $3.50</li>
      <li>House red  12 USD</li>
    </ul>`;
  const out = extractMenuSignals(menuCrawl(html));
  assert('prices-no-photos: hasPriceCoverage', out.hasPriceCoverage);
  assert('prices-no-photos: !hasPhotoCoverage', !out.hasPhotoCoverage);
  assertEq('prices-no-photos: gaps contains photos only', out.gaps, ['photos']);
}

// --- Test 3: photos but no visible prices ---------------------------
{
  const html = `
    <h1>Our menu — ask your server about tonight's selection</h1>
    <div><img src="/1.jpg"><img src="/2.jpg"><img src="/3.jpg">
         <img src="/4.jpg"><img src="/5.jpg"></div>
    <p>Menu changes weekly. Call for details.</p>`;
  const out = extractMenuSignals(menuCrawl(html));
  assert('photos-no-prices: !hasPriceCoverage', !out.hasPriceCoverage);
  assert('photos-no-prices: hasPhotoCoverage',   out.hasPhotoCoverage);
  assertEq('photos-no-prices: gaps contains prices only', out.gaps, ['prices']);
}

// --- Test 4: neither prices nor photos ------------------------------
{
  const html = `
    <h1>Menu</h1>
    <p>Our chef uses the freshest seasonal ingredients.
       Call for tonight's specials.</p>`;
  const out = extractMenuSignals(menuCrawl(html));
  assert('neither: hasMenuPage',       out.hasMenuPage);
  assert('neither: !hasPriceCoverage', !out.hasPriceCoverage);
  assert('neither: !hasPhotoCoverage', !out.hasPhotoCoverage);
  assertEq('neither: gaps has both',  out.gaps, ['prices', 'photos']);
}

// --- Test 5: no crawled menu page, fallback to homepage HTML -------
{
  const homepageHtml = `
    <h1>Welcome</h1>
    <section id="menu">
      <ul>
        <li>Margherita $14</li>
        <li>Pepperoni $16</li>
        <li>Carbonara $18</li>
        <li>Tiramisu $9</li>
        <li>Espresso $3.50</li>
      </ul>
      <img src="/hero.jpg"><img src="/dish1.jpg"><img src="/dish2.jpg">
    </section>` + '<p>' + 'x'.repeat(50) + '</p>';
  const ctx = {
    crawl: {
      pages: [],
      homepage: { html: homepageHtml, url: 'https://example.com/' }
    }
  };
  const out = extractMenuSignals(ctx);
  assert('homepage-fallback: hasMenuPage', out.hasMenuPage);
  assert('homepage-fallback: sourceUrl is homepage', out.sourceUrl === 'https://example.com/');
  assert('homepage-fallback: prices detected on homepage', out.hasPriceCoverage);
  assert('homepage-fallback: photos detected on homepage', out.hasPhotoCoverage);
}

// --- Test 6: no crawl at all -> unverified state --------------------
{
  const out = extractMenuSignals({});
  assert('empty-context: !hasMenuPage', !out.hasMenuPage);
  assertEq('empty-context: gaps marks menu-page', out.gaps, ['menu-page']);
  assertEq('empty-context: sourceUrl null', out.sourceUrl, null);
}

// --- Test 7: menu-slot page exists but was a failed fetch ----------
{
  const ctx = {
    crawl: {
      pages: [
        { slot: 'menu', status: 403, url: 'https://example.com/menu/', html: null }
      ],
      homepage: null
    }
  };
  const out = extractMenuSignals(ctx);
  assertEq('failed-menu-fetch: !hasMenuPage', out.hasMenuPage, false);
  assertEq('failed-menu-fetch: gaps marks menu-page', out.gaps, ['menu-page']);
}

// --- Test 8: menu-slot exists but HTML is below the 2KB floor ------
// extractMenuSignals rejects shell pages (empty or near-empty redirects)
// so we don't count a 200-status-but-no-content page as a real menu.
{
  const ctx = {
    crawl: {
      pages: [
        { slot: 'menu', status: 200, url: 'https://example.com/menu/', html: '<p>Loading...</p>' }
      ],
      homepage: null
    }
  };
  const out = extractMenuSignals(ctx);
  assertEq('empty-shell: !hasMenuPage', out.hasMenuPage, false);
}

// --- Test 9: currency variants recognized ---------------------------
{
  const html = `
    <ul>
      <li>Item A $5</li>
      <li>Item B €7.50</li>
      <li>Item C £9.00</li>
      <li>Item D ¥1200</li>
      <li>Item E 15 USD</li>
      <li>Item F 12 EUR</li>
    </ul>
    <img src="/a"><img src="/b"><img src="/c">`;
  const out = extractMenuSignals(menuCrawl(html));
  assert('currency-variants: prices detected across $€£¥/USD/EUR',
    out.hasPriceCoverage,
    'pricesCount=' + out.pricesCount);
}

// --- Test 10: street-address false-positive guard -------------------
// A menu page with "1847 Main St" in a footer should NOT count as a
// price. The price regex requires a currency symbol/suffix.
{
  const html = `
    <h1>About</h1>
    <p>Visit us at 1847 Main Street. Call 555-1234.</p>
    <img src="/1"><img src="/2"><img src="/3">`;
  const out = extractMenuSignals(menuCrawl(html));
  assert('address-no-prices: !hasPriceCoverage', !out.hasPriceCoverage,
    'pricesCount=' + out.pricesCount);
}

// --- Test 11: repeated regex calls stay correct (lastIndex reset) --
// extractMenuSignals runs inside the audit pipeline potentially
// multiple times (once for the main site, once per competitor). The
// regexes carry /g so we have to explicitly reset lastIndex each call.
{
  const html = '<ul><li>$1</li><li>$2</li><li>$3</li><li>$4</li><li>$5</li><li>$6</li></ul>' +
               '<img src="a"><img src="b"><img src="c">';
  const ctx = menuCrawl(html);
  const first  = extractMenuSignals(ctx);
  const second = extractMenuSignals(ctx);
  const third  = extractMenuSignals(ctx);
  assertEq('repeat-call 1: pricesCount', first.pricesCount,  6);
  assertEq('repeat-call 2: pricesCount', second.pricesCount, 6);
  assertEq('repeat-call 3: pricesCount', third.pricesCount,  6);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll menu-intelligence tests passed.');
