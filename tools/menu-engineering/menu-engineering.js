/**
 * Menu Engineering Matrix — pure math + classification.
 *
 * Loaded as a classic script in ./index.html (EN + ES). Also Node-
 * importable for unit tests via scripts/test-menu-engineering.mjs.
 * Dual-export pattern matches brand-suite.js + margin-math.js.
 *
 * Privacy invariants (tested in scripts/test-menu-engineering.mjs):
 *   1. Every exported function is pure — no fetch, no localStorage,
 *      no cookies, no side effects beyond attaching to window.ME.
 *   2. Bucket helpers (meBucketMenuSize, meBucketPrimeCostBand,
 *      meBucketDogsRatio) return values only from fixed enumerated
 *      sets. No raw input value (item name, hex price) is ever
 *      reflected.
 *
 * Method reference:
 *   - Kasavana & Smith, "Menu Engineering: A Practical Guide to
 *     Menu Analysis" (1990) — the canonical Stars / Plowhorses /
 *     Puzzles / Dogs framework. Median split on contribution-margin
 *     dollars × menu-mix share.
 */

// ------------------------------------------------------------
// Item normalization + contribution margin
// ------------------------------------------------------------

function meCoerceNumber(v) {
  // Accepts numbers, numeric strings ("$24.50", "24.50", "1,250"),
  // and returns a finite number or NaN. Null and empty string → 0
  // so empty rows in the manual-entry grid don't poison the totals.
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return isFinite(v) ? v : NaN;
  var s = String(v).trim().replace(/[$\s]/g, '').replace(/,/g, '');
  if (s === '') return 0;
  var n = parseFloat(s);
  return isFinite(n) ? n : NaN;
}

function meNormalizeItem(raw) {
  // Returns a clean item object. Fields: item (string), price,
  // food_cost, units_sold (numbers), category (optional string).
  return {
    item:       String((raw && raw.item) || '').trim(),
    price:      meCoerceNumber(raw && raw.price),
    food_cost:  meCoerceNumber(raw && raw.food_cost),
    units_sold: meCoerceNumber(raw && raw.units_sold),
    category:   raw && raw.category ? String(raw.category).trim() : ''
  };
}

function meContributionMargin(item) {
  // CM dollars: price - food_cost.
  // CM percent: CM dollars / price (0 if price is 0).
  // Always returns finite numbers; negatives are valid (a money-
  // losing item has negative CM and the UI flags it).
  var n = meNormalizeItem(item);
  var dollars = n.price - n.food_cost;
  var pct = n.price > 0 ? dollars / n.price : 0;
  return { dollars: dollars, percent: pct };
}

// ------------------------------------------------------------
// Median utility — used for both axes of the matrix.
// Median (not mean) is the standard menu-engineering convention so
// one runaway item doesn't drag the bar.
// ------------------------------------------------------------

function meMedian(values) {
  if (!values || !values.length) return 0;
  var sorted = values.slice().sort(function(a, b){ return a - b; });
  var n = sorted.length;
  var mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// ------------------------------------------------------------
// Quadrant assignment
//
// Median split on:
//   x: contribution-margin dollars
//   y: menu-mix share (units_sold / total_units)
//
// Quadrants:
//   high CM × high pop = Star
//   low  CM × high pop = Plowhorse
//   high CM × low  pop = Puzzle
//   low  CM × low  pop = Dog
//
// Items at exactly the median go to the "high" side (>=) so the
// classification is total and stable across reruns.
// ------------------------------------------------------------

var ME_QUADRANTS = ['Star', 'Plowhorse', 'Puzzle', 'Dog'];

function meSummariseMenu(rawItems, options) {
  // Input:
  //   rawItems: array of raw item objects.
  //   options: { groupBy: 'category' } — when set, run the median split
  //            within each category. Items with no category fall under
  //            the implicit '(uncategorised)' bucket.
  // Output: {
  //   items: enriched items (incl. cm, share, quadrant),
  //   totals: { revenue, food_cost, contribution_margin, units, item_count, prime_cost_pct },
  //   thresholds: { median_cm_dollars, median_share },        // whole-menu split
  //   thresholds_by_category: { <cat>: { median_cm_dollars, median_share, item_count } },
  //   group_by: 'category' | undefined,
  //   warnings: array of strings describing degenerate cases
  // }
  var groupBy = options && options.groupBy === 'category' ? 'category' : undefined;
  var items = (rawItems || []).map(meNormalizeItem).filter(function(it){
    // Drop completely empty rows (no name AND no numbers); leave
    // the rest alone so users see warnings on partial input.
    return it.item || it.price || it.food_cost || it.units_sold;
  });

  var warnings = [];
  if (items.length === 0) {
    return {
      items: [],
      totals: { revenue: 0, food_cost: 0, contribution_margin: 0, units: 0, item_count: 0, prime_cost_pct: 0 },
      thresholds: { median_cm_dollars: 0, median_share: 0 },
      thresholds_by_category: {},
      group_by: groupBy,
      warnings: ['No items entered yet.']
    };
  }
  if (items.length < 6) {
    warnings.push('Fewer than 6 items — the median split is unstable. Add more items for a reliable matrix.');
  }

  // Compute totals + per-item CM and share.
  var totalUnits = 0;
  for (var i = 0; i < items.length; i++) totalUnits += items[i].units_sold;

  var enriched = items.map(function(it){
    var cm = meContributionMargin(it);
    var share = totalUnits > 0 ? it.units_sold / totalUnits : 0;
    return {
      item: it.item,
      price: it.price,
      food_cost: it.food_cost,
      units_sold: it.units_sold,
      category: it.category,
      cm_dollars: cm.dollars,
      cm_percent: cm.percent,
      share: share,
      revenue: it.price * it.units_sold,
      total_food_cost: it.food_cost * it.units_sold
    };
  });

  // Thresholds: median CM dollars and median share, computed only
  // over items with non-zero data so a placeholder row of all zeros
  // doesn't drag the median to zero. If everything is zero (e.g.
  // user pasted prices but no units), thresholds fall back to zero
  // and the UI will surface a warning.
  var nonZeroCmValues = enriched.map(function(e){ return e.cm_dollars; });
  var nonZeroShareValues = enriched
    .filter(function(e){ return e.units_sold > 0; })
    .map(function(e){ return e.share; });

  var medianCm = meMedian(nonZeroCmValues);
  var medianShare = nonZeroShareValues.length ? meMedian(nonZeroShareValues) : 0;

  // Detect axis-collapse: every item at the same CM (or same share).
  var distinctCms = {};
  enriched.forEach(function(e){ distinctCms[e.cm_dollars.toFixed(4)] = true; });
  if (Object.keys(distinctCms).length <= 1 && enriched.length > 1) {
    warnings.push('Every item has the same contribution margin — the x-axis collapses. Check that prices and food costs vary across items.');
  }
  var distinctShares = {};
  enriched.forEach(function(e){ distinctShares[e.share.toFixed(4)] = true; });
  if (Object.keys(distinctShares).length <= 1 && enriched.length > 1) {
    warnings.push('Every item has the same sales count — the y-axis collapses. Add real units_sold figures.');
  }

  // Per-category thresholds always computed — even in whole-menu mode,
  // the per-category breakdown is useful in the per-item table.
  var thresholdsByCategory = {};
  var byCat = {};
  enriched.forEach(function(e){
    var cat = e.category || '(uncategorised)';
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(e);
  });
  Object.keys(byCat).forEach(function(cat){
    var grp = byCat[cat];
    var grpCms = grp.map(function(e){ return e.cm_dollars; });
    var grpShares = grp.filter(function(e){ return e.units_sold > 0; }).map(function(e){ return e.share; });
    thresholdsByCategory[cat] = {
      median_cm_dollars: meMedian(grpCms),
      median_share: grpShares.length ? meMedian(grpShares) : 0,
      item_count: grp.length
    };
  });

  // Assign quadrants. Items with non-positive CM always land in Dog —
  // a zero-CM item (sold at exact cost, comp, free promo) is making
  // the rest of the menu work harder for it, regardless of popularity.
  // In `groupBy: 'category'` mode the median split runs within each
  // category (a $38 entrée and a $6 bread basket should not share an
  // x-axis). Per Pavesic's refinement of Kasavana & Smith.
  enriched.forEach(function(e){
    var thr;
    if (groupBy === 'category') {
      var cat = e.category || '(uncategorised)';
      thr = thresholdsByCategory[cat];
    } else {
      thr = { median_cm_dollars: medianCm, median_share: medianShare };
    }
    var highCm = e.cm_dollars >= thr.median_cm_dollars;
    var highPop = e.share >= thr.median_share;
    if (e.cm_dollars <= 0) {
      e.quadrant = 'Dog';
    } else if (highCm && highPop)        e.quadrant = 'Star';
    else if (!highCm && highPop)         e.quadrant = 'Plowhorse';
    else if (highCm && !highPop)         e.quadrant = 'Puzzle';
    else                                 e.quadrant = 'Dog';
  });

  if (groupBy === 'category') {
    var thinCats = Object.keys(thresholdsByCategory).filter(function(c){
      return thresholdsByCategory[c].item_count < 3;
    });
    if (thinCats.length) {
      warnings.push('Categories with fewer than 3 items have unstable medians: ' + thinCats.join(', ') + '.');
    }
  }

  // Totals.
  var revenue = 0, foodCost = 0, contributionMargin = 0;
  enriched.forEach(function(e){
    revenue += e.revenue;
    foodCost += e.total_food_cost;
    contributionMargin += e.cm_dollars * e.units_sold;
  });
  var primeCostPct = revenue > 0 ? foodCost / revenue : 0;

  return {
    items: enriched,
    totals: {
      revenue: revenue,
      food_cost: foodCost,
      contribution_margin: contributionMargin,
      units: totalUnits,
      item_count: enriched.length,
      prime_cost_pct: primeCostPct
    },
    thresholds: {
      median_cm_dollars: medianCm,
      median_share: medianShare
    },
    thresholds_by_category: thresholdsByCategory,
    group_by: groupBy,
    warnings: warnings
  };
}

// ------------------------------------------------------------
// What-if simulation
//
// changes is a list of { index, price?, food_cost?, units_sold? }
// patches. Returns a fresh summary so the caller can render a "before
// vs after" view. Pure: never mutates the input items.
// ------------------------------------------------------------

function meSimulateChange(items, changes, options) {
  var byIndex = {};
  (changes || []).forEach(function(c){ if (typeof c.index === 'number') byIndex[c.index] = c; });
  var patched = (items || []).map(function(it, idx){
    var p = byIndex[idx];
    if (!p) return it;
    return {
      item:       it.item,
      price:      p.price       != null ? p.price       : it.price,
      food_cost:  p.food_cost   != null ? p.food_cost   : it.food_cost,
      units_sold: p.units_sold  != null ? p.units_sold  : it.units_sold,
      category:   it.category
    };
  });
  return meSummariseMenu(patched, options);
}

// ------------------------------------------------------------
// Recommended action per quadrant — short, on-brand language.
// ------------------------------------------------------------

var ME_ACTIONS_EN = {
  Star: {
    headline: 'Protect them.',
    detail: 'These already work. Don’t mess with the recipe; protect the price; feature them in photos, in the server’s spiel, on the homepage.'
  },
  Plowhorse: {
    headline: 'Re-engineer the cost.',
    detail: 'Popular but margin-thin. Walk the recipe back through Margin Math: a 5–10% portion-size or sourcing change can lift CM without losing volume.'
  },
  Puzzle: {
    headline: 'Reposition them.',
    detail: 'Profitable but ignored. Re-photograph, re-describe, move higher on the menu, train the staff to suggest. Most Puzzles are presentation problems, not product problems.'
  },
  Dog: {
    headline: 'Drop or replace.',
    detail: 'Low margin, low volume. Every Dog you keep is a slot you can’t use for something better. Replace with a tested LTO; if it sticks, promote it.'
  }
};

// ------------------------------------------------------------
// Tabular text parsing — accepts CSV, TSV, or directly-pasted
// spreadsheet selections. Auto-detects delimiter (tab vs comma)
// and auto-maps column headers to the canonical fields.
//
// Privacy posture: pure string parsing, no network, no eval.
// ------------------------------------------------------------

// Header aliases for each canonical field. Matching is case-
// insensitive and ignores punctuation/spacing. Both EN and ES
// header conventions covered so a Spanish-language POS export
// auto-maps too.
var ME_HEADER_ALIASES = {
  item:       ['item', 'name', 'dish', 'menu item', 'product', 'plato', 'nombre', 'producto'],
  price:      ['price', 'sell price', 'menu price', 'list price', 'precio', 'pvp'],
  food_cost:  ['food cost', 'cost', 'plate cost', 'cogs', 'recipe cost', 'costo', 'costo de comida', 'costo del plato'],
  units_sold: ['units sold', 'units', 'qty', 'quantity', 'sold', 'sales', 'count', 'unidades', 'cantidad', 'vendidos', 'ventas'],
  category:   ['category', 'section', 'menu section', 'group', 'categoria', 'categoría', 'sección', 'seccion', 'grupo']
};

function meNormalizeHeader(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function meDetectDelimiter(text) {
  // First non-empty line decides. Prefer tab if present, else comma,
  // else fall back to any run of 2+ spaces.
  var firstLine = String(text || '').split(/\r?\n/).find(function(l){ return l.trim().length > 0; }) || '';
  if (firstLine.indexOf('\t') >= 0) return '\t';
  if (firstLine.indexOf(',')  >= 0) return ',';
  return /\s{2,}/.test(firstLine) ? /\s{2,}/ : ',';
}

function meSplitCsvLine(line, delim) {
  // Minimal CSV-aware splitter: handles "..." quoted cells with
  // doubled-quote escapes ("a ""b"" c"). Tab/regex delimiters skip
  // the quote logic since spreadsheets don't quote tab-delimited.
  if (delim instanceof RegExp || delim === '\t') {
    return String(line).split(delim).map(function(s){ return s.trim(); });
  }
  var out = [];
  var cur = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (line.charAt(i + 1) === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      out.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function meAutoMapHeaders(headers) {
  // Returns a mapping { item: colIndex, price: colIndex, ... } where
  // any field with no confident match is omitted. Caller can override.
  var normalized = headers.map(meNormalizeHeader);
  var mapping = {};
  Object.keys(ME_HEADER_ALIASES).forEach(function(field){
    var aliases = ME_HEADER_ALIASES[field].map(meNormalizeHeader);
    for (var i = 0; i < normalized.length; i++) {
      if (aliases.indexOf(normalized[i]) >= 0) {
        mapping[field] = i;
        break;
      }
    }
  });
  return mapping;
}

function meHasHeaderRow(firstCells) {
  // Heuristic: if at least half the cells are non-numeric, treat as
  // a header row. Pure pasted data tends to be all numeric (except
  // the item column); a header row is overwhelmingly text.
  var nonNumeric = 0;
  for (var i = 0; i < firstCells.length; i++) {
    var s = String(firstCells[i]).trim();
    if (s === '') continue;
    if (isNaN(meCoerceNumber(s))) nonNumeric++;
  }
  // Account for the item-name column always being non-numeric.
  return nonNumeric >= Math.max(2, Math.ceil(firstCells.length / 2));
}

function meParseTabularText(text) {
  // Returns { items: [...], mapping, headerRowDetected, warnings }.
  // items is in the canonical {item, price, food_cost, units_sold,
  // category} shape; ready to feed straight into summariseMenu.
  var raw = String(text || '').replace(/^﻿/, '');  // strip BOM
  if (!raw.trim()) return { items: [], mapping: {}, headerRowDetected: false, warnings: ['Pasted text was empty.'] };

  var lines = raw.split(/\r?\n/).filter(function(l){ return l.trim().length > 0; });
  var delim = meDetectDelimiter(raw);
  var rows = lines.map(function(l){ return meSplitCsvLine(l, delim); });
  if (!rows.length) return { items: [], mapping: {}, headerRowDetected: false, warnings: ['No rows detected.'] };

  var warnings = [];
  var headerRowDetected = meHasHeaderRow(rows[0]);
  var mapping;
  var dataRows;
  if (headerRowDetected) {
    mapping = meAutoMapHeaders(rows[0]);
    dataRows = rows.slice(1);
  } else {
    // No header — assume positional order: item, price, food_cost, units_sold, [category].
    mapping = { item: 0, price: 1, food_cost: 2, units_sold: 3 };
    if (rows[0].length >= 5) mapping.category = 4;
    dataRows = rows;
    warnings.push('No header row detected — assumed columns: Item, Price, Food cost, Units sold, [Category].');
  }

  if (mapping.item == null && mapping.price == null) {
    return { items: [], mapping: mapping, headerRowDetected: headerRowDetected,
             warnings: warnings.concat(['Could not find an Item or Price column. Add a header row, or paste exactly: Item, Price, Food cost, Units sold.']) };
  }

  // Track which mandatory fields are missing so the caller can warn.
  ['item', 'price', 'food_cost', 'units_sold'].forEach(function(field){
    if (mapping[field] == null) warnings.push('Could not find a "' + field.replace('_', ' ') + '" column — items will be parsed without it.');
  });

  var items = dataRows.map(function(cells){
    function pick(field) {
      var idx = mapping[field];
      return idx == null || idx >= cells.length ? '' : cells[idx];
    }
    return {
      item:       pick('item'),
      price:      pick('price'),
      food_cost:  pick('food_cost'),
      units_sold: pick('units_sold'),
      category:   pick('category')
    };
  });

  return { items: items, mapping: mapping, headerRowDetected: headerRowDetected, warnings: warnings };
}

// ------------------------------------------------------------
// Plausible bucket helpers — enum-locked, privacy-critical.
// No raw input value (item name, price, count) ever appears in a
// bucket return; tests sweep across full input ranges + poison
// strings to lock this property.
// ------------------------------------------------------------

var ME_SIZE_BUCKETS = ['lt-10-items', '10-25-items', '25-50-items', 'gt-50-items'];

function meBucketMenuSize(itemCount) {
  var n = typeof itemCount === 'number' && isFinite(itemCount) && itemCount >= 0 ? Math.floor(itemCount) : 0;
  if (n < 10)  return 'lt-10-items';
  if (n < 25)  return '10-25-items';
  if (n < 50)  return '25-50-items';
  return 'gt-50-items';
}

var ME_PRIME_COST_BANDS = ['lt-25pct', '25-30pct', '30-35pct', 'gt-35pct'];

function meBucketPrimeCostBand(totalFoodCost, totalRevenue) {
  var fc = typeof totalFoodCost === 'number' && isFinite(totalFoodCost) && totalFoodCost >= 0 ? totalFoodCost : 0;
  var r  = typeof totalRevenue   === 'number' && isFinite(totalRevenue)  && totalRevenue  >= 0 ? totalRevenue  : 0;
  if (r <= 0) return 'lt-25pct';
  var ratio = fc / r;
  if (ratio < 0.25) return 'lt-25pct';
  if (ratio < 0.30) return '25-30pct';
  if (ratio < 0.35) return '30-35pct';
  return 'gt-35pct';
}

var ME_DOGS_RATIO_BUCKETS = ['none', 'lt-10pct', '10-25pct', 'gt-25pct'];

function meBucketDogsRatio(itemCount, dogCount) {
  var n = typeof itemCount === 'number' && isFinite(itemCount) && itemCount > 0 ? itemCount : 0;
  var d = typeof dogCount  === 'number' && isFinite(dogCount)  && dogCount  >= 0 ? dogCount  : 0;
  if (n === 0 || d === 0) return 'none';
  var ratio = d / n;
  if (ratio < 0.10) return 'lt-10pct';
  if (ratio < 0.25) return '10-25pct';
  return 'gt-25pct';
}

// ------------------------------------------------------------
// Dual export — browser window + Node module.
// ------------------------------------------------------------

var ME_PUBLIC = {
  coerceNumber:        meCoerceNumber,
  normalizeItem:       meNormalizeItem,
  contributionMargin:  meContributionMargin,
  median:              meMedian,
  summariseMenu:       meSummariseMenu,
  simulateChange:      meSimulateChange,
  parseTabularText:    meParseTabularText,
  detectDelimiter:     meDetectDelimiter,
  autoMapHeaders:      meAutoMapHeaders,
  bucketMenuSize:      meBucketMenuSize,
  bucketPrimeCostBand: meBucketPrimeCostBand,
  bucketDogsRatio:     meBucketDogsRatio,
  QUADRANTS:           ME_QUADRANTS,
  SIZE_BUCKETS:        ME_SIZE_BUCKETS,
  PRIME_COST_BANDS:    ME_PRIME_COST_BANDS,
  DOGS_RATIO_BUCKETS:  ME_DOGS_RATIO_BUCKETS,
  ACTIONS_EN:          ME_ACTIONS_EN,
  HEADER_ALIASES:      ME_HEADER_ALIASES
};

if (typeof self !== 'undefined' && typeof module === 'undefined') {
  self.ME = ME_PUBLIC;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ME_PUBLIC;
}
