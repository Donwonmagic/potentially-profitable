/**
 * Invoice Decoder — Sample-run demo (Wave 6.6).
 *
 * Three pre-baked fixtures (Sysco, Restaurant Depot, generic produce
 * jobber) that skip the file-pick + Tesseract round-trip and feed the
 * existing parser directly. Used on first run so the operator sees
 * the entire pipeline (parse → categorize → render → trust summary)
 * inside ~2 seconds before they upload anything real.
 *
 * Design: the samples are the same lines a real OCR pass would emit,
 * stamped with confidence values that mirror real-world reads. The
 * downstream code (parse / categorize / vendors / sku-history) treats
 * them identically to OCR output.
 *
 * Privacy posture unchanged — no fetch, no upload, no save (samples
 * never touch the encrypted save path; an explicit dismissal exits).
 */
(function (root) {
  'use strict';

  var FIXTURES = {
    sysco: {
      label: 'Sysco invoice',
      vendor: 'sysco',
      lines: [
        { text: 'SYSCO FOOD SERVICES OF NEW ENGLAND',     confidence: 95 },
        { text: 'CUSTOMER NUMBER: 8842910',                confidence: 92 },
        { text: '6741034 ROMAINE HEARTS GREEN LEAF 24CT  2 CS  $48.00', confidence: 88 },
        { text: '4451221 GROUND CHUCK 80/20 10LB  2 CT  $58.00', confidence: 85 },
        { text: '8821456 STELLA ARTOIS 24/12 BTL  1 CS  $42.00', confidence: 91 },
        { text: '7710023 CHICKEN BREAST BNLS SKLS 4/5LB  3 CS  $96.00', confidence: 89 },
        { text: '6601122 OLIVE OIL EXTRA VIRGIN 1 GAL  1 EA  $28.00', confidence: 87 },
        { text: '5510889 PAPER NAPKIN DINNER 250CT  4 CS  $18.40', confidence: 90 },
        { text: '5520421 SIMPLE GREEN CONC 1 GAL  1 EA  $22.00', confidence: 84 },
        { text: 'SUBTOTAL: $312.40',                        confidence: 95 },
        { text: 'FUEL SURCHARGE: $4.50',                    confidence: 95 },
        { text: 'TOTAL: $316.90',                           confidence: 95 }
      ]
    },
    'rest-depot': {
      label: 'Restaurant Depot',
      vendor: 'restaurant-depot',
      lines: [
        { text: 'RESTAURANT DEPOT',                         confidence: 95 },
        { text: '2 LB GROUND BEEF 80/20  $7.98',            confidence: 90 },
        { text: '1 GAL VEGETABLE OIL  $14.99',              confidence: 92 },
        { text: '1 CS NAPKINS 250CT  $9.49',                confidence: 88 },
        { text: '3 LB CHEDDAR CHEESE BLOCK  $11.97',        confidence: 91 },
        { text: '5 LB CHICKEN WINGS  $19.95',               confidence: 89 },
        { text: '1 EA TOMATOES 25LB BOX  $24.50',           confidence: 88 },
        { text: '2 CT LETTUCE ROMAINE 24CT  $32.00',        confidence: 87 },
        { text: 'TOTAL: $120.88',                           confidence: 95 }
      ]
    },
    'produce': {
      label: 'Produce jobber',
      vendor: null,
      lines: [
        { text: 'JIMMY\'S PRODUCE',                         confidence: 92 },
        { text: 'CILANTRO 1 BUNCH  $1.50',                  confidence: 88 },
        { text: 'TOMATOES VINE-RIPE 25LB  $24.00',          confidence: 91 },
        { text: 'ONIONS YELLOW 50LB BAG  $18.00',           confidence: 89 },
        { text: 'GARLIC PEELED 1 LB  $4.50',                confidence: 87 },
        { text: 'JALAPENO 5 LB  $8.00',                     confidence: 88 },
        { text: 'PEPPERS GREEN BELL 25LB  $22.00',          confidence: 90 },
        { text: 'TOTAL: $78.00',                            confidence: 95 }
      ]
    }
  };

  function listFixtures() {
    return Object.keys(FIXTURES).map(function (k) {
      return { id: k, label: FIXTURES[k].label };
    });
  }

  // Wave 14.6 — seed demo data so the sample run actually exercises
  // the cross-tool spine (contract chip, drift insights, vendor-pulse
  // top-movers). Only seeds when the operator's MuntinContext is
  // empty (tourCompletedAt unset AND no real skuHistory) — never
  // overwrites real data. Tagged with __sampleSeed:true so a future
  // "reset" can wipe just the demo entries.
  function seedDemoContext() {
    var ctx = root && root.MuntinContext;
    if (!ctx || typeof ctx.read !== 'function' || typeof ctx.merge !== 'function') return false;
    var data = ctx.read() || {};
    if (data.invoiceDecoder && data.invoiceDecoder.tourCompletedAt) return false;
    if (data.skuHistory && Object.keys(data.skuHistory).length) return false;
    var now = Date.now();
    var weekMs = 7 * 86400000;
    // Stem keys mirror what MuntinStem.extractStem produces from the
    // sample row names. Keep the entries plausible but synthetic.
    var skuHistory = {
      'romaine hearts green leaf': [
        { vendor: 'sysco', ts: now - weekMs * 1, qty: 2, unit: 'cs', unitPrice: 41.00, comparablePrice: 41.00, comparableUnit: 'cs', __sampleSeed: true },
        { vendor: 'sysco', ts: now - weekMs * 3, qty: 2, unit: 'cs', unitPrice: 39.00, comparablePrice: 39.00, comparableUnit: 'cs', __sampleSeed: true },
        { vendor: 'sysco', ts: now - weekMs * 5, qty: 2, unit: 'cs', unitPrice: 39.50, comparablePrice: 39.50, comparableUnit: 'cs', __sampleSeed: true }
      ],
      'ground chuck': [
        { vendor: 'sysco', ts: now - weekMs * 1, qty: 2, unit: 'ct', unitPrice: 27.00, comparablePrice: 2.70, comparableUnit: 'lb', __sampleSeed: true },
        { vendor: 'sysco', ts: now - weekMs * 3, qty: 2, unit: 'ct', unitPrice: 26.00, comparablePrice: 2.60, comparableUnit: 'lb', __sampleSeed: true },
        { vendor: 'restaurant-depot', ts: now - weekMs * 4, qty: 2, unit: 'ct', unitPrice: 24.50, comparablePrice: 2.45, comparableUnit: 'lb', __sampleSeed: true }
      ],
      'stella artois': [
        { vendor: 'sysco', ts: now - weekMs * 2, qty: 1, unit: 'cs', unitPrice: 39.00, comparablePrice: 0.135, comparableUnit: 'fl_oz', __sampleSeed: true },
        { vendor: 'sysco', ts: now - weekMs * 4, qty: 1, unit: 'cs', unitPrice: 38.00, comparablePrice: 0.132, comparableUnit: 'fl_oz', __sampleSeed: true }
      ]
    };
    var contractPrices = {
      'romaine hearts green leaf': { unitPrice: 39.00, vendor: 'sysco', unit: 'cs', setAt: now - weekMs * 8, __sampleSeed: true },
      'ground chuck':              { unitPrice: 25.00, vendor: 'sysco', unit: 'ct', comparablePrice: 2.50, comparableUnit: 'lb', setAt: now - weekMs * 8, __sampleSeed: true }
    };
    ctx.merge({
      skuHistory: skuHistory,
      contractPrices: contractPrices
    });
    return true;
  }

  // Run a fixture — returns the same shape MID_PARSE.parseLines + the
  // existing render pipeline expects. No OCR, no preprocess; we feed
  // synthetic OCR output straight into the parser.
  function runFixture(id) {
    var f = FIXTURES[id];
    if (!f) return null;
    if (typeof root === 'undefined' || !root || !root.MID_PARSE) return null;
    // Wave 14.6 — seed cross-tool demo data BEFORE parsing so the
    // sample render lights up contract chips + drift cards on the
    // first pass.
    try { seedDemoContext(); } catch (_) {}
    var fullText = f.lines.map(function (l) { return l.text; }).join('\n');
    var parsed = root.MID_PARSE.parseLines(f.lines, fullText);
    parsed._isSample = true;
    parsed._sampleId = id;
    if (f.vendor && root.MID_VENDORS) {
      var registry = root.MID_VENDORS.REGISTRY || [];
      for (var i = 0; i < registry.length; i++) {
        if (registry[i].id === f.vendor) {
          var vMatch = { id: registry[i].id, label: registry[i].label_en, score: 0.9, vendor: registry[i] };
          root.MID_VENDORS.applyVendorBoost(parsed.rows, vMatch);
          parsed.vendor = vMatch.id;
          break;
        }
      }
    }
    return parsed;
  }

  var api = {
    listFixtures:    listFixtures,
    runFixture:      runFixture,
    seedDemoContext: seedDemoContext,
    FIXTURES:        FIXTURES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_SAMPLES = api;
})(typeof window !== 'undefined' ? window : null);
