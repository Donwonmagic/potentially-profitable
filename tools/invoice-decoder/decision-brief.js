/**
 * Decision Brief — actionable-intelligence synthesis engine.
 *
 * Composes findings from every existing detector into ONE ranked
 * list. Pure module; no DOM. Node-testable. Wave A of the briefing
 * card pipeline.
 *
 *   MID_DECISION_BRIEF.synthesize(rows, parsed, vendor, opts)
 *     → { state: 'findings', findings: Finding[], errors, perf }
 *     | { state: 'ok-to-save', positives: Finding[], errors, perf }
 *
 * Each Finding shape (informal — no TS):
 *   { id, kind, source, severity, dollarImpact, certainty,
 *     actionability, recencyMs, novelty, message,
 *     rowIdx?, stem?, vendor?, category?,
 *     why: { inputs, formula, sampleSize? },
 *     evidence?, cta?, composedFrom? }
 *
 * The renderer (Wave B briefing-card.js) consumes the result and
 * produces the on-screen card. The action layer (Wave C) maps each
 * Finding's kind + cta to a one-tap workflow.
 *
 * Privacy: everything runs locally. No fetch, no upload, same
 * posture as every other Wave 5+ module.
 */
(function (root) {
  'use strict';

  // ---------- Tunable constants (exported for tests) ----------

  // Score weights — tuned so $50 contract overcharge ≈ 92pt critical
  // beats supplier-health-78 at ≈ 60pt info, but a $5000/yr vendor-
  // switch at ≈ 78pt out-ranks a $50 overcharge when both fire.
  var WEIGHTS = {
    dollar:        0.40,
    certainty:     0.20,
    actionability: 0.15,
    recency:       0.10,
    novelty:       0.10,
    severity:      0.05
  };

  var GLOBAL_FLOOR        = 35;     // score below this is dropped
  var TOP_N               = 5;      // briefing card max
  var MAX_PER_KIND        = 2;      // diversity cap
  var DETECTOR_DEADLINE_MS = 12;
  var GREEN_INFO_BUDGET    = 25;    // sum of info-level |$| allowed for green

  var SEVERITY_BIAS = {
    critical: 1.0,
    warn:     0.7,
    positive: 0.4,
    info:     0.2
  };

  // ---------- Pure helpers ----------

  function _now() { return Date.now(); }

  function normDollar(x) {
    var v = Math.max(Math.abs(+x || 0), 1);
    return Math.max(0, Math.min(1, Math.log(v) / Math.log(10000)));
  }

  function recencyDecay(ageMs) {
    var fortnight = 14 * 86400000;
    if (!isFinite(ageMs) || ageMs < 0) return 1;
    return Math.exp(-ageMs / fortnight);
  }

  function severityBias(sev) {
    return SEVERITY_BIAS[sev] != null ? SEVERITY_BIAS[sev] : 0.2;
  }

  // Stable hash for finding ids — short, no plaintext SKU names.
  function _hashShort(input) {
    var s = String(input || '');
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36).slice(0, 8);
  }

  function score(finding) {
    if (!finding) return 0;
    var s =
      WEIGHTS.dollar        * normDollar(finding.dollarImpact)         +
      WEIGHTS.certainty     * (finding.certainty || 0)                 +
      WEIGHTS.actionability * (finding.actionability || 0)             +
      WEIGHTS.recency       * recencyDecay(finding.recencyMs || 0)     +
      WEIGHTS.novelty       * (finding.novelty || 0)                   +
      WEIGHTS.severity      * severityBias(finding.severity);
    return Math.round(s * 100);
  }

  // Deadline wrapper. Each adapter returns Finding[] or [].
  function _withDeadline(label, fn, errors) {
    var t0 = _now();
    try {
      var out = fn();
      if (!Array.isArray(out)) return [];
      var elapsed = _now() - t0;
      if (elapsed > DETECTOR_DEADLINE_MS) {
        errors.push({ label: label, kind: 'overrun', ms: elapsed });
      }
      return out;
    } catch (err) {
      errors.push({ label: label, kind: 'threw', message: err && err.message });
      return [];
    }
  }

  // ---------- Adapters ----------

  function fromMathFix(parsed, errors) {
    return _withDeadline('math-fix', function () {
      var fix = parsed && parsed._mathFix;
      if (!fix) {
        var P = root && root.MID_PARSE;
        if (P && typeof P.suggestMathFix === 'function' &&
            parsed && Array.isArray(parsed.rows) && parsed.printedTotal) {
          fix = P.suggestMathFix(parsed.rows, parsed.printedTotal);
        }
      }
      if (!fix || fix.kind === 'rounding') return [];
      var dollar = Math.abs(fix.delta || 0);
      if (dollar < 0.5) return [];
      var f = {
        id:           'mathfix:' + _hashShort(fix.kind + ':' + (fix.rowIdx || 0) + ':' + dollar),
        kind:         'math-fix',
        source:       'parse',
        severity:     'critical',
        dollarImpact: dollar,
        certainty:    fix.kind === 'digit-flip' ? 0.95 : 0.7,
        actionability: 1,
        recencyMs:    0,
        novelty:      0.5,
        message:      fix.message || ('Math is $' + dollar.toFixed(2) + ' off — likely OCR digit-flip.'),
        rowIdx:       (typeof fix.rowIdx === 'number') ? fix.rowIdx : undefined,
        why: {
          formula: fix.kind === 'digit-flip' && fix.from != null
            ? 'Row ' + ((fix.rowIdx || 0) + 1) + ': $' + fix.from + ' → $' + fix.to + ' balances printed total'
            : 'Printed total $' + parsed.printedTotal + ' vs sum $' + (+parsed.printedTotal - +fix.delta).toFixed(2),
          inputs: { delta: fix.delta, kind: fix.kind, rowIdx: fix.rowIdx }
        },
        evidence: fix,
        cta: fix.kind === 'digit-flip' && fix.to != null
          ? { label: 'Apply fix', payload: { rowIdx: fix.rowIdx, to: fix.to } }
          : { label: 'View evidence', payload: {} }
      };
      return [f];
    }, errors);
  }

  function fromContract(rows, errors) {
    return _withDeadline('contract', function () {
      var H = root && root.MID_SKU_HISTORY;
      if (!H || typeof H.checkRow !== 'function') return [];
      if (!Array.isArray(rows)) return [];
      var findings = [];
      rows.forEach(function (r, idx) {
        if (!r || (r.kind && r.kind !== 'item')) return;
        var c;
        try { c = H.checkRow(r); } catch (_) { return; }
        if (!c || !c.isOver || c.overcharge < 1) return;
        if (Math.abs(c.diffPct) < 1) return;
        findings.push({
          id:            'contract:' + _hashShort((r.name || '') + ':' + idx),
          kind:          'contract-overcharge',
          source:        'contract-watch',
          severity:      c.overcharge >= 25 ? 'critical' : 'warn',
          dollarImpact:  c.overcharge,
          certainty:     c.isStale ? 0.7 : 0.95,
          actionability: 1,
          recencyMs:     0,
          novelty:       0.5,
          message:       (r.name || 'item') + ' $' + c.overcharge.toFixed(2) + ' over your contract',
          rowIdx:        idx,
          stem:          r.name,
          vendor:        c.vendor,
          why: {
            formula: '$' + c.actualPrice + '/' + (c.actualComparableUnit || 'u') +
                     ' billed vs $' + c.contractPrice + '/' + (c.contractComparableUnit || 'u') +
                     ' contract = +$' + c.overcharge.toFixed(2),
            inputs: c
          },
          evidence: c,
          cta: { label: 'Copy dispute', payload: { rowIdx: idx, vendor: c.vendor } }
        });
      });
      return findings;
    }, errors);
  }

  function fromTopMovers(rows, errors) {
    return _withDeadline('top-movers', function () {
      var H = root && root.MID_SKU_HISTORY;
      if (!H || typeof H.topMovers !== 'function') return [];
      var movers = H.topMovers(rows, { max: 5, minPct: 5 });
      if (!Array.isArray(movers)) return [];
      var findings = [];
      movers.forEach(function (m, i) {
        if (!m || m.deltaPct == null) return;
        var dollar = Math.abs((m.deltaPct / 100) * (m.unitPrice || 0)) * (m.observations || 1);
        if (dollar < 5) return;
        var dir = m.deltaPct > 0 ? '+' : '';
        findings.push({
          id:            'drift:' + _hashShort((m.name || '') + ':' + i),
          kind:          'price-drift',
          source:        'sku-history',
          severity:      'info',
          dollarImpact:  dollar,
          certainty:     Math.min(1, (m.observations || 0) / 6),
          actionability: 0.5,
          recencyMs:     0,
          novelty:       0.5,
          message:       (m.name || 'item') + ' ' + dir + m.deltaPct.toFixed(1) + '% vs your baseline',
          stem:          m.name,
          category:      m.category || null,
          why: {
            formula: 'Median90: $' + (m.median90 || 0) + ' → now $' + (m.unitPrice || 0) +
                     ' (' + (m.observations || 0) + ' obs)',
            inputs: m,
            sampleSize: m.observations || 0
          },
          evidence: m,
          cta: { label: 'See history', payload: { stem: m.name } }
        });
      });
      return findings;
    }, errors);
  }

  function fromForecast(rows, vendor, errors) {
    return _withDeadline('forecast', function () {
      var I = root && root.MID_INSIGHTS;
      if (!I || typeof I.forecastInvoiceTotal !== 'function') return [];
      var f = I.forecastInvoiceTotal(rows, vendor);
      if (!f || f.sampleSize < 4) return [];
      var deltaPct = +f.deltaPct || 0;
      if (Math.abs(deltaPct) < 8) return [];
      var dollar = Math.abs(f.actual - f.median);
      return [{
        id:            'forecast:' + _hashShort(vendor + ':' + Math.round(f.actual)),
        kind:          'forecast-anomaly',
        source:        'insights',
        severity:      Math.abs(deltaPct) >= 20 ? 'warn' : 'info',
        dollarImpact:  dollar,
        certainty:     Math.min(1, f.sampleSize / 8),
        actionability: 0.4,
        recencyMs:     0,
        novelty:       0.6,
        message:       'Invoice runs ' + (deltaPct > 0 ? '+' : '') + deltaPct.toFixed(1) +
                       '% vs typical ($' + Math.round(f.expectedRange[0]) + '–$' + Math.round(f.expectedRange[1]) + ')',
        vendor:        vendor,
        why: {
          formula: 'Actual $' + f.actual + ' vs vendor median $' + f.median + ' over ' + f.sampleSize + ' invoices',
          inputs: f,
          sampleSize: f.sampleSize
        },
        evidence: f,
        cta: { label: 'What changed', payload: { vendor: vendor } }
      }];
    }, errors);
  }

  function fromShrinkage(errors) {
    return _withDeadline('shrinkage', function () {
      var I = root && root.MID_INSIGHTS;
      if (!I || typeof I.detectShrinkage !== 'function') return [];
      var hits = I.detectShrinkage();
      if (!Array.isArray(hits)) return [];
      return hits.map(function (h) {
        return {
          id:            'shrinkage:' + _hashShort(h.stem + ':' + h.vendor),
          kind:          'shrinkage',
          source:        'insights',
          severity:      'warn',
          dollarImpact:  h.dollarExposure,
          certainty:     Math.min(1, h.z / 4),
          actionability: 0.5,
          recencyMs:     0,
          novelty:       0.7,
          message:       (h.label || h.stem) + ' ' + h.recentCount +
                         ' orders this week vs usual ' + h.expectedCount,
          stem:          h.stem,
          vendor:        h.vendor,
          why: {
            formula: 'z-score ' + h.z + ' on weekly bucket count, $' + h.dollarExposure + ' exposure',
            inputs: h
          },
          evidence: h,
          cta: { label: 'Flag for review', payload: { stem: h.stem, vendor: h.vendor } }
        };
      });
    }, errors);
  }

  function fromVendorSwitchRoi(errors) {
    return _withDeadline('vendor-switch', function () {
      var I = root && root.MID_INSIGHTS;
      if (!I || typeof I.aggregateVendorSwitchRoi !== 'function') return [];
      var swaps = I.aggregateVendorSwitchRoi({ max: 3 });
      if (!Array.isArray(swaps)) return [];
      return swaps.map(function (s) {
        return {
          id:            'vswitch:' + _hashShort(s.from + '->' + s.to),
          kind:          'vendor-switch',
          source:        'insights',
          severity:      'positive',
          dollarImpact:  s.monthlyDelta,
          certainty:     Math.min(1, (s.stems || []).length / 6),
          actionability: 0.7,
          recencyMs:     0,
          novelty:       0.6,
          message:       s.from + ' → ' + s.to + ': $' + Math.round(s.monthlyDelta) +
                         '/mo across ' + (s.stems || []).length + ' SKUs',
          vendor:        s.from,
          why: {
            formula: 'Σ(fromMedian − toMedian) × monthlyQty across ' + (s.stems || []).length + ' stems',
            inputs: s
          },
          evidence: s,
          cta: { label: 'See switch plan', payload: { from: s.from, to: s.to } }
        };
      });
    }, errors);
  }

  function fromSupplierHealth(vendor, errors) {
    return _withDeadline('supplier-health', function () {
      var I = root && root.MID_INSIGHTS;
      if (!I || typeof I.supplierHealth !== 'function' || !vendor) return [];
      var h = I.supplierHealth(vendor);
      if (!h || h.score >= 70) return [];
      // Estimate $ impact from invoicesSeen × backorder rate × $50 placeholder.
      var dollar = (h.stats.backorderRate / 100) * (h.stats.invoicesSeen || 1) * 50;
      return [{
        id:            'supplier:' + _hashShort(vendor + ':' + h.score),
        kind:          'supplier-health',
        source:        'insights',
        severity:      h.score < 50 ? 'warn' : 'info',
        dollarImpact:  dollar,
        certainty:     Math.min(1, (h.stats.invoicesSeen || 0) / 6),
        actionability: 0.4,
        recencyMs:     0,
        novelty:       0.5,
        message:       vendor + ' reliability ' + h.score + '/100 (backorder ' +
                       h.stats.backorderRate + '%, price CV ' + h.stats.priceCV + '%)',
        vendor:        vendor,
        why: {
          formula: 'backorder ' + h.breakdown.backorder + ' + stability ' + h.breakdown.stability +
                   ' + contract ' + h.breakdown.contract + ' + subst ' + h.breakdown.substitution +
                   ' + surcharge ' + h.breakdown.surcharge,
          inputs: h
        },
        evidence: h,
        cta: { label: 'Compare vendor', payload: { vendor: vendor } }
      }];
    }, errors);
  }

  function fromDishDrift(errors) {
    return _withDeadline('dish-drift', function () {
      var D = root && root.MuntinDishDrift;
      if (!D || typeof D.compute !== 'function') return [];
      var drift;
      try { drift = D.compute(); } catch (_) { return []; }
      if (!drift || !Array.isArray(drift.dishes)) return [];
      var findings = [];
      drift.dishes.forEach(function (d) {
        if (!d || !d.deltaPct || Math.abs(d.deltaPct) < 3) return;
        var weeklyImpact = Math.abs(d.deltaDollar || 0) * 7; // rough monthly→weekly fudge
        if (weeklyImpact < 20) return;
        findings.push({
          id:            'dish:' + _hashShort(d.name + ':' + Math.round(d.deltaPct)),
          kind:          'dish-margin',
          source:        'dish-drift',
          severity:      'warn',
          dollarImpact:  weeklyImpact,
          certainty:     0.7,
          actionability: 0.4,
          recencyMs:     0,
          novelty:       0.5,
          message:       d.name + ' plate cost ' + (d.deltaPct > 0 ? '+' : '') +
                         d.deltaPct.toFixed(1) + '% from this invoice',
          why: {
            formula: 'Plate cost ' + d.beforePct + '% → ' + d.afterPct + '% (' +
                     (d.driverStem || 'driver') + ')',
            inputs: d
          },
          evidence: d,
          cta: { label: 'Adjust price', payload: { dish: d.name } }
        });
      });
      return findings;
    }, errors);
  }

  // ---------- Dedupe + compose ----------

  function _dedupe(findings) {
    // Dedupe key — same row, same stem, or same vendor (kind-family
    // dependent). Per-row family: math-fix, contract-overcharge,
    // price-drift, shrinkage on the SAME row index.
    // Per-stem family: contract / drift / shrinkage on the SAME stem.
    // Per-vendor family: forecast / supplier / vendor-switch on same vendor.
    var byKey = {};

    function familyOf(f) {
      var perRow    = f.rowIdx != null ? 'row:' + f.rowIdx : null;
      var perStem   = f.stem ? 'stem:' + f.stem : null;
      var perVendor = f.vendor ? 'vendor:' + f.vendor : null;
      // Math-fix wins per-row; contract-overcharge composes with drift on same stem.
      if (f.kind === 'math-fix' && perRow) return perRow;
      if (f.kind === 'contract-overcharge' && perStem) return perStem;
      if (f.kind === 'price-drift' && perStem) return perStem;
      if (f.kind === 'shrinkage' && perStem) return perStem;
      if (f.kind === 'forecast-anomaly' && perVendor) return perVendor;
      if (f.kind === 'supplier-health' && perVendor) return perVendor;
      if (f.kind === 'vendor-switch' && perVendor) return 'vswitch:' + f.vendor;  // separate vswitch lane
      return f.id;
    }

    // First pass — group.
    findings.forEach(function (f) {
      var k = familyOf(f);
      if (!byKey[k]) byKey[k] = [];
      byKey[k].push(f);
    });

    var out = [];
    Object.keys(byKey).forEach(function (k) {
      var group = byKey[k];
      if (group.length === 1) { out.push(group[0]); return; }
      // Compose: pick highest-severity primary; attach others' why.
      var sevRank = { critical: 3, warn: 2, info: 1, positive: 0 };
      group.sort(function (a, b) { return sevRank[b.severity] - sevRank[a.severity]; });
      var primary = Object.assign({}, group[0]);
      primary.composedFrom = group.map(function (g) { return g.kind; });
      primary.why = Object.assign({}, primary.why, {
        also: group.slice(1).map(function (g) {
          return { kind: g.kind, formula: g.why && g.why.formula };
        })
      });
      // Math-fix dominates absolutely — never let a contract-overcharge
      // outrank a math-fix on the same row.
      var mf = group.filter(function (g) { return g.kind === 'math-fix'; })[0];
      if (mf) {
        primary = Object.assign({}, mf, {
          composedFrom: primary.composedFrom,
          why: Object.assign({}, mf.why, { also: primary.why.also })
        });
      }
      // Take MAX dollar impact across the group (don't sum disjoint streams).
      primary.dollarImpact = group.reduce(function (m, g) {
        return Math.max(m, Math.abs(g.dollarImpact || 0));
      }, 0);
      out.push(primary);
    });
    return out;
  }

  // ---------- Top-N with diversity ----------

  function _topN(findings) {
    if (!findings.length) return [];
    findings.forEach(function (f) { f._score = score(f); });
    findings.sort(function (a, b) { return b._score - a._score; });
    var out = [];
    var byKind = {};
    var displaced = [];
    findings.forEach(function (f) {
      if (out.length >= TOP_N) { displaced.push(f); return; }
      var n = byKind[f.kind] || 0;
      if (n >= MAX_PER_KIND && f.severity !== 'critical') {
        displaced.push(f);
        return;
      }
      out.push(f);
      byKind[f.kind] = n + 1;
    });
    // Diversity rescue: if out has 3+ of one kind, swap a displaced
    // higher-scoring different-kind in (within 15pt).
    var kindCounts = {};
    out.forEach(function (f) { kindCounts[f.kind] = (kindCounts[f.kind] || 0) + 1; });
    var dominant = Object.keys(kindCounts).filter(function (k) { return kindCounts[k] >= 3; })[0];
    if (dominant && displaced.length) {
      for (var i = out.length - 1; i >= 0; i--) {
        if (out[i].kind === dominant && out[i].severity !== 'critical') {
          var swap = null;
          for (var j = 0; j < displaced.length; j++) {
            if (displaced[j].kind === dominant) continue;
            if (out[i]._score - displaced[j]._score <= 15) { swap = j; break; }
          }
          if (swap != null) {
            out[i] = displaced[swap];
            displaced.splice(swap, 1);
            break;
          }
        }
      }
    }
    // Backfill: when no other kinds exist to satisfy diversity, the
    // MAX_PER_KIND cap shouldn't leave the briefing under-filled.
    // Take displaced findings (already score-sorted) until TOP_N is hit.
    while (out.length < TOP_N && displaced.length) {
      out.push(displaced.shift());
    }
    return out;
  }

  // ---------- Public ----------

  function synthesize(rows, parsed, vendor, opts) {
    opts = opts || {};
    var t0 = _now();
    var errors = [];

    var raw = []
      .concat(fromMathFix(parsed, errors))
      .concat(fromContract(rows, errors))
      .concat(fromTopMovers(rows, errors))
      .concat(fromForecast(rows, vendor, errors))
      .concat(fromShrinkage(errors))
      .concat(fromVendorSwitchRoi(errors))
      .concat(fromSupplierHealth(vendor, errors))
      .concat(fromDishDrift(errors));

    // Apply global score floor PRE-dedupe (so noise doesn't compose into signal).
    raw = raw.filter(function (f) { return score(f) >= GLOBAL_FLOOR; });

    var deduped = _dedupe(raw);
    var ranked  = _topN(deduped);
    var perfMs  = _now() - t0;

    // Green-path detection.
    var hasCriticalOrWarn = ranked.some(function (f) {
      return f.severity === 'critical' || f.severity === 'warn';
    });
    var infoSum = ranked
      .filter(function (f) { return f.severity === 'info'; })
      .reduce(function (s, f) { return s + Math.abs(f.dollarImpact || 0); }, 0);
    var detectorsHealthy = errors.filter(function (e) { return e.kind === 'threw'; }).length === 0;
    var positives = ranked.filter(function (f) { return f.severity === 'positive'; });
    var hasMathFix = ranked.some(function (f) { return f.kind === 'math-fix'; });

    if (!hasCriticalOrWarn && !hasMathFix && infoSum < GREEN_INFO_BUDGET && detectorsHealthy) {
      return {
        state: 'ok-to-save',
        positives: positives,
        findings: [],
        errors: errors,
        perf: { ms: perfMs }
      };
    }
    return {
      state:    'findings',
      findings: ranked,
      errors:   errors,
      perf:     { ms: perfMs }
    };
  }

  var api = {
    synthesize:    synthesize,
    score:         score,
    normDollar:    normDollar,
    recencyDecay:  recencyDecay,
    severityBias:  severityBias,
    WEIGHTS:       WEIGHTS,
    GLOBAL_FLOOR:  GLOBAL_FLOOR,
    TOP_N:         TOP_N,
    MAX_PER_KIND:  MAX_PER_KIND,
    GREEN_INFO_BUDGET: GREEN_INFO_BUDGET,
    _adapters: {
      fromMathFix:           fromMathFix,
      fromContract:          fromContract,
      fromTopMovers:         fromTopMovers,
      fromForecast:          fromForecast,
      fromShrinkage:         fromShrinkage,
      fromVendorSwitchRoi:   fromVendorSwitchRoi,
      fromSupplierHealth:    fromSupplierHealth,
      fromDishDrift:         fromDishDrift
    },
    _dedupe: _dedupe,
    _topN:   _topN
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_DECISION_BRIEF = api;
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null));
