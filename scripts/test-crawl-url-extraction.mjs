#!/usr/bin/env node
// Phase 3 #6: DOM-aware crawl URL extractor regression test.
// Run via: `node scripts/test-crawl-url-extraction.mjs`
//
// Locks in the contract that drives the augmented platform-detection
// pipeline. extractCrawlPageUrls walks the crawl bundle (homepage +
// follow-up pages) and pulls URLs out of the DOM attributes that
// platform embeds actually use:
//
//   <a href=>        direct link to ordering / reservations
//   <iframe src=>    embedded widget
//   <script src=>    widget loader
//   <form action=>   native checkout form
//
// Attributes on other tags (<img src>, <link href>, <video src>, etc.)
// are INTENTIONALLY excluded — those carry static assets, not
// platform identity. Including them would only inflate the URL list
// and risk false positives through the downstream boundary matcher.
//
// Exits non-zero on failure so CI can gate on it.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const { extractCrawlPageUrls } =
  require('../tools/audits/restaurant/restaurant-checks.js');

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

function page(slot, html) {
  return { slot: slot, url: 'https://example.com/' + slot, status: 200, html: html };
}

// --- Test 1: extract from <a href> on a follow-up page -------------
{
  const crawl = {
    homepage: { url: 'https://example.com/', html: '<h1>Home</h1>' },
    pages: [page('order',
      '<p>Order with <a href="https://www.toasttab.com/restaurants/foo/order">Toast</a></p>')]
  };
  const urls = extractCrawlPageUrls(crawl);
  assert('anchor href on follow-up page extracted',
    urls.indexOf('https://www.toasttab.com/restaurants/foo/order') !== -1,
    'got: ' + JSON.stringify(urls));
}

// --- Test 2: extract from <iframe src> ------------------------------
{
  const crawl = {
    homepage: { url: 'https://example.com/', html: '<h1>Home</h1>' },
    pages: [page('reserve',
      '<iframe src="https://widgets.resy.com/foo?key=abc" height="600"></iframe>')]
  };
  const urls = extractCrawlPageUrls(crawl);
  assert('iframe src extracted',
    urls.indexOf('https://widgets.resy.com/foo?key=abc') !== -1,
    'got: ' + JSON.stringify(urls));
}

// --- Test 3: extract from <script src> ------------------------------
{
  const crawl = {
    homepage: null,
    pages: [page('menu',
      '<script src="https://static.bentobox.com/widget.js" async></script>')]
  };
  const urls = extractCrawlPageUrls(crawl);
  assert('script src extracted',
    urls.indexOf('https://static.bentobox.com/widget.js') !== -1);
}

// --- Test 4: extract from <form action> -----------------------------
{
  const crawl = {
    homepage: null,
    pages: [page('order',
      '<form action="https://squareup.com/store/foo/checkout" method="POST"><input name="item"></form>')]
  };
  const urls = extractCrawlPageUrls(crawl);
  assert('form action extracted',
    urls.indexOf('https://squareup.com/store/foo/checkout') !== -1);
}

// --- Test 5: single-quoted AND unquoted attribute values -----------
{
  const crawl = {
    homepage: null,
    pages: [page('order', `
      <a href='https://example.chownow.com/order'>Order</a>
      <iframe src=https://widgets.opentable.com/foo></iframe>
    `)]
  };
  const urls = extractCrawlPageUrls(crawl);
  assert('single-quoted href extracted',
    urls.indexOf('https://example.chownow.com/order') !== -1);
  assert('unquoted src extracted',
    urls.indexOf('https://widgets.opentable.com/foo') !== -1);
}

// --- Test 6: fragment-only hrefs ARE filtered out -------------------
// "#menu" and "javascript:void(0)" can't carry a platform host, so
// they get dropped rather than cluttering the URL list.
{
  const crawl = {
    homepage: { url: 'https://example.com/',
      html: '<a href="#menu">Menu</a><a href="javascript:void(0)">X</a>' },
    pages: []
  };
  const urls = extractCrawlPageUrls(crawl);
  assertEq('fragment and js: hrefs filtered', urls, []);
}

// --- Test 7: static-asset tags are NOT harvested -------------------
// <img src>, <link href>, <video src> carry assets, not platform
// identity. Extracting them would only risk false positives.
{
  const crawl = {
    homepage: { url: 'https://example.com/',
      html: `
        <img src="https://cdn.example.com/hero.jpg">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=x">
        <video src="https://media.example.com/bg.mp4"></video>
      ` },
    pages: []
  };
  const urls = extractCrawlPageUrls(crawl);
  assertEq('asset tags not harvested', urls.length, 0);
}

// --- Test 8: homepage + multiple follow-up pages merged -------------
{
  const crawl = {
    homepage: { url: 'https://example.com/',
      html: '<a href="https://example.com/order">Order here</a>' },
    pages: [
      page('order',   '<iframe src="https://www.toasttab.com/order/foo"></iframe>'),
      page('reserve', '<iframe src="https://widgets.resy.com/book"></iframe>'),
      page('menu',    '<p>No external embeds.</p>')
    ]
  };
  const urls = extractCrawlPageUrls(crawl);
  assert('homepage anchor present', urls.indexOf('https://example.com/order') !== -1);
  assert('order iframe present',    urls.indexOf('https://www.toasttab.com/order/foo') !== -1);
  assert('reserve iframe present',  urls.indexOf('https://widgets.resy.com/book') !== -1);
}

// --- Test 9: empty / null / malformed crawl -------------------------
assertEq('null crawl returns []',                extractCrawlPageUrls(null), []);
assertEq('undefined crawl returns []',           extractCrawlPageUrls(undefined), []);
assertEq('string crawl returns []',              extractCrawlPageUrls('nope'), []);
assertEq('empty crawl object returns []',        extractCrawlPageUrls({}), []);
assertEq('crawl with null homepage returns []',  extractCrawlPageUrls({ homepage: null, pages: [] }), []);
assertEq('crawl with html:null page returns []',
  extractCrawlPageUrls({ homepage: null, pages: [{ slot: 'order', status: 403, html: null }] }),
  []);

// --- Test 10: follow-up page with empty HTML is skipped ------------
// A crawled page that returned 200 but with near-empty body shouldn't
// contribute URLs; skipping saves an unnecessary regex pass.
{
  const crawl = {
    homepage: null,
    pages: [
      { slot: 'order', status: 200, html: '' },
      page('menu', '<a href="https://example.chownow.com/order">Menu</a>')
    ]
  };
  const urls = extractCrawlPageUrls(crawl);
  assertEq('empty-html page skipped; menu URL extracted', urls,
    ['https://example.chownow.com/order']);
}

// --- Test 11: repeated invocations stay correct (lastIndex reset) --
{
  const crawl = {
    homepage: null,
    pages: [page('order',
      '<a href="https://example.chownow.com/1">1</a>' +
      '<a href="https://example.chownow.com/2">2</a>' +
      '<a href="https://example.chownow.com/3">3</a>')]
  };
  const a = extractCrawlPageUrls(crawl);
  const b = extractCrawlPageUrls(crawl);
  const c = extractCrawlPageUrls(crawl);
  assertEq('repeat call 1 count', a.length, 3);
  assertEq('repeat call 2 count', b.length, 3);
  assertEq('repeat call 3 count', c.length, 3);
}

// --- Test 12: Toast detection via iframe would now fire -----------
// Integration-style: the crawler fetched /order/ and found an iframe
// pointing at Toast. Before this change, PSI's homepage audit wouldn't
// have seen this URL and detectPlatforms would have missed Toast.
// After this change, the URL is in the augmented list; detectPlatforms
// (unchanged) will match the `toasttab` pattern against the host.
{
  const crawl = {
    homepage: { url: 'https://example.com/', html: '<h1>Welcome</h1>' },
    pages: [page('order',
      '<section><iframe src="https://www.toasttab.com/restaurants/foo/v2/online-ordering" height="1000"></iframe></section>')]
  };
  const urls = extractCrawlPageUrls(crawl);
  const toastHit = urls.some(u => u.indexOf('toasttab.com') !== -1);
  assert('toast iframe URL reaches the augmented list', toastHit,
    'got: ' + JSON.stringify(urls));
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll crawl-url-extraction tests passed.');
