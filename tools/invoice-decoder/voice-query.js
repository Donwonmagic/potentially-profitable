/**
 * Voice query mode (Wave 13.2).
 *
 * Operator says "what's my Sysco spend this month" and the tool
 * answers via SpeechSynthesis using local data. webkitSpeechRecognition
 * routes audio through the platform's speech service (Apple/Google) —
 * disclosed in the Privacy Self-Check (separately tracked from
 * "image bytes never leave").
 *
 * 12 intent grammars matched via regex; each maps to a data-layer
 * call against MID_SKU_HISTORY / MID_INSIGHTS / MuntinContext.
 *
 * Public API:
 *   start()                    begin listening
 *   stop()                     end
 *   query(text)                non-voice path; useful for tests
 *   intents()                  registered intent list
 */
(function (root) {
  'use strict';

  if (typeof root === 'undefined' || !root) return;

  var INTENTS = [
    {
      id: 'vendor-spend',
      pattern: /(?:my )?(\w[\w\s]+?)\s+(?:spend|total|invoice total)\s+(?:this|last|in)\s+(week|month|year)/i,
      handler: function (m) {
        var vendor = m[1].trim().toLowerCase().replace(/\s+/g, '-');
        var window = m[2].toLowerCase();
        var ctx = root.MuntinContext; if (!ctx) return null;
        var trend = ctx.readTrend ? ctx.readTrend() : [];
        var horizonMs = (window === 'week' ? 7 : window === 'month' ? 30 : 365) * 86400000;
        var cutoff = Date.now() - horizonMs;
        var sum = trend
          .filter(function (e) { return e.savedAt > cutoff; })
          .filter(function (e) { return !vendor || (e.vendor && e.vendor.toLowerCase() === vendor); })
          .reduce(function (s, e) { return s + (e.parsedSum || 0); }, 0);
        if (!sum) return 'No invoices saved for ' + m[1] + ' in the last ' + window + '.';
        return 'You spent $' + sum.toFixed(0) + ' on ' + m[1] + ' in the last ' + window + '.';
      }
    },
    {
      id: 'top-overcharges',
      pattern: /(?:where|what)\s+am i (?:getting|being)?\s*overcharged/i,
      handler: function () {
        var dd = root.MuntinDishDrift;
        if (!dd || !dd.compute) return null;
        var dishes = dd.compute().slice(0, 3);
        if (!dishes.length) return 'No active overcharges flagged in your data.';
        return 'Top overcharge: ' + dishes[0].dish + ' at ' + dishes[0].deltaPctOnDish.toFixed(1) + ' percent over contract.';
      }
    },
    {
      id: 'sku-trend',
      pattern: /(?:has|did)\s+(\w[\w\s]+?)\s+(?:go|gone|moved|moving)\s+up/i,
      handler: function (m) {
        var name = m[1].trim();
        if (!root.MID_SKU_HISTORY) return null;
        var s = root.MID_SKU_HISTORY.summarizeRow({ name: name });
        if (!s || !s.observations) return 'No history yet for ' + name + '.';
        var dir = s.medianDelta > 0 ? 'up' : 'down';
        return name + ' is ' + Math.abs(s.medianDelta || 0).toFixed(0) + ' percent ' + dir + ' versus your typical.';
      }
    },
    {
      id: 'last-invoice',
      pattern: /read\s+(?:me\s+)?(?:the\s+)?last\s+(?:(\w[\w\s]+?)\s+)?invoice/i,
      handler: function (m) {
        var ctx = root.MuntinContext; if (!ctx) return null;
        var trend = ctx.readTrend ? ctx.readTrend() : [];
        var vendor = m[1] && m[1].trim().toLowerCase().replace(/\s+/g, '-');
        var hit = trend.find(function (e) { return !vendor || (e.vendor && e.vendor.toLowerCase() === vendor); });
        if (!hit) return 'No invoice found.';
        return 'Your last ' + (hit.vendor || '') + ' invoice was $' + hit.parsedSum.toFixed(0) + ' for ' + hit.itemCount + ' items.';
      }
    },
    {
      id: 'contract-status',
      pattern: /am i (?:on|at)\s+contract\s*(?:price)?/i,
      handler: function () {
        var dd = root.MuntinDishDrift;
        if (!dd || !dd.compute) return 'Contract drift data unavailable.';
        var dishes = dd.compute();
        var off = dishes.length;
        if (!off) return 'You are on contract across the dishes you track.';
        var total = dishes.reduce(function (s, d) { return s + Math.abs(d.overchargeOnDish || 0); }, 0);
        return off + ' dishes are off contract; total exposure is ' + total.toFixed(2) + ' dollars per plate.';
      }
    },
    {
      id: 'anomaly-list',
      pattern: /(?:anything|what'?s)\s+(?:weird|odd|anomalous|unusual)/i,
      handler: function () {
        if (!root.MID_INSIGHTS) return null;
        var shrink = root.MID_INSIGHTS.detectShrinkage();
        if (shrink && shrink.length) return shrink[0].label + ' has ' + shrink[0].recentCount + ' orders this week vs your usual ' + shrink[0].expectedCount + '.';
        return 'No active anomalies in your data.';
      }
    },
    {
      id: 'total-spend',
      pattern: /total\s+(?:food|spend|cost)\s+(?:this|last)\s+(week|month|year)/i,
      handler: function (m) {
        var window = m[1].toLowerCase();
        var ctx = root.MuntinContext; if (!ctx) return null;
        var trend = ctx.readTrend ? ctx.readTrend() : [];
        var horizonMs = (window === 'week' ? 7 : window === 'month' ? 30 : 365) * 86400000;
        var cutoff = Date.now() - horizonMs;
        var sum = trend.filter(function (e) { return e.savedAt > cutoff; }).reduce(function (s, e) { return s + (e.parsedSum || 0); }, 0);
        return 'Total spend the last ' + window + ': $' + sum.toFixed(0) + '.';
      }
    },
    {
      id: 'reorder-due',
      pattern: /(?:what|anything)\s+(?:should i|do i need to|need to)\s+(?:reorder|order)/i,
      handler: function () {
        if (!root.MID_INSIGHTS || !root.MID_INSIGHTS.buildReorderShortlist) return null;
        var list = root.MID_INSIGHTS.buildReorderShortlist({ max: 3 });
        if (!list.length) return 'Nothing pressing in your reorder shortlist.';
        return 'Likely due: ' + list.map(function (l) { return l.stem; }).join(', ') + '.';
      }
    },
    {
      id: 'supplier-health',
      pattern: /(?:how|what)(?:'s)?\s+(?:is\s+)?(\w[\w\s]+?)\s+(?:doing|health)/i,
      handler: function (m) {
        if (!root.MID_INSIGHTS) return null;
        var v = m[1].trim().toLowerCase().replace(/\s+/g, '-');
        var s = root.MID_INSIGHTS.supplierHealth(v);
        if (!s) return 'Not enough history for ' + m[1] + ' yet.';
        return m[1] + ' supplier health: ' + s.score + ' out of 100. ' + s.stats.invoicesSeen + ' invoices observed.';
      }
    },
    {
      id: 'forecast',
      pattern: /(?:what|how)\s+(?:should|will)\s+(?:my\s+)?(\w[\w\s]+?)\s+invoice\s+(?:be|cost)/i,
      handler: function (m) {
        if (!root.MID_INSIGHTS) return null;
        var v = m[1].trim().toLowerCase().replace(/\s+/g, '-');
        var f = root.MID_INSIGHTS.forecastInvoiceTotal([], v);
        if (!f) return 'Not enough history for ' + m[1] + ' yet.';
        return m[1] + ' typical: $' + f.expectedRange[0].toFixed(0) + ' to $' + f.expectedRange[1].toFixed(0) + '.';
      }
    },
    {
      id: 'help',
      pattern: /(?:help|what can you do|what.*ask)/i,
      handler: function () {
        return 'Try: my Sysco spend this month. Where am I overcharged. Should I reorder. Read the last invoice.';
      }
    },
    {
      id: 'repeat-last',
      pattern: /(?:say|repeat)\s+that\s+again/i,
      handler: function () { return root.__midLastVoiceAnswer || 'Nothing to repeat.'; }
    },
    // Wave D — briefing card actions, voice-driven. Each intent
    // resolves to the most recent matching Finding (read from the
    // briefing host's stashed __brief) and dispatches the same
    // action handler the on-screen button calls. Audit trail is
    // uniform across tap and voice paths.
    {
      id: 'voice-copy-dispute',
      pattern: /^(?:copy\s+)?(?:the\s+)?dispute(?:\s+(?:for|on)\s+(.+))?$/i,
      handler: function (m) {
        var hint = (m[1] || '').toLowerCase();
        var f = _findFinding('contract-overcharge', hint);
        if (!f) return 'No contract overcharge to dispute on this invoice.';
        var actions = root.MID_BRIEFING_ACTIONS;
        if (!actions || !actions.dispatch) return 'Action layer not loaded.';
        actions.dispatch(f.id, null);
        return 'Dispute note copied for ' + (f.stem || 'item') + '.';
      }
    },
    {
      id: 'voice-mark-expected',
      pattern: /(?:mark|that(?:'|')?s)\s+(.+?)\s+(?:as\s+)?expected/i,
      handler: function (m) {
        var hint = (m[1] || '').toLowerCase();
        var f = _findFinding(null, hint);
        if (!f) return 'No matching finding to mark as expected.';
        var actions = root.MID_BRIEFING_ACTIONS;
        if (!actions || !actions.dispatch) return 'Action layer not loaded.';
        // Force the dispatch into the mark-expected path by overriding
        // cta label briefly.
        var origCta = f.cta;
        f.cta = { label: 'Mark expected', payload: origCta && origCta.payload };
        actions.dispatch(f.id, null);
        f.cta = origCta;
        return 'Marked ' + (f.stem || hint) + ' as expected for the season.';
      }
    },
    {
      id: 'voice-track',
      pattern: /^track\s+(?:price\s+(?:on|of)\s+)?(.+)$/i,
      handler: function (m) {
        var hint = (m[1] || '').toLowerCase();
        var f = _findFinding('price-drift', hint) || _findFinding(null, hint);
        if (!f) return 'No matching finding to track.';
        var actions = root.MID_BRIEFING_ACTIONS;
        if (!actions || !actions.dispatch) return 'Action layer not loaded.';
        var origCta = f.cta;
        f.cta = { label: 'See history', payload: origCta && origCta.payload };
        actions.dispatch(f.id, null);
        f.cta = origCta;
        return 'Tracking ' + (f.stem || hint) + '.';
      }
    },
    {
      id: 'voice-switch-vendor',
      pattern: /switch\s+(.+?)\s+to\s+(.+)/i,
      handler: function (m) {
        var fromHint = (m[1] || '').toLowerCase();
        var toHint   = (m[2] || '').toLowerCase();
        var f = _findFinding('vendor-switch', fromHint + ' ' + toHint);
        if (!f) return 'No vendor-switch finding matches.';
        var actions = root.MID_BRIEFING_ACTIONS;
        if (!actions || !actions.dispatch) return 'Action layer not loaded.';
        actions.dispatch(f.id, null);
        return 'Switch saved: ' + (f.evidence && f.evidence.from) + ' to ' + (f.evidence && f.evidence.to) + '.';
      }
    },
    {
      id: 'voice-share-accountant',
      pattern: /(?:send|share)\s+(?:that|this|it)?\s*(?:to|with)\s+(?:my\s+)?accountant/i,
      handler: function () {
        var fs = _briefFindings();
        var f = fs[0];
        if (!f) return 'Nothing on the briefing to share.';
        var actions = root.MID_BRIEFING_ACTIONS;
        if (!actions || !actions.dispatch) return 'Action layer not loaded.';
        var origCta = f.cta;
        f.cta = { label: 'Share with accountant', payload: origCta && origCta.payload };
        actions.dispatch(f.id, null);
        f.cta = origCta;
        return 'Sent. CSV saved to downloads, email body copied to clipboard.';
      }
    }
  ];

  // Helpers used by the briefing-action voice intents.
  function _briefFindings() {
    var host = root.document && root.document.getElementById && root.document.getElementById('idBriefing');
    if (!host || !host.__brief) return [];
    var b = host.__brief;
    var fs = (b.findings || []).slice();
    if (Array.isArray(b.positives)) Array.prototype.push.apply(fs, b.positives);
    return fs;
  }
  function _findFinding(kind, hint) {
    var fs = _briefFindings();
    var hintLc = (hint || '').toLowerCase();
    function matches(f) {
      if (kind && f.kind !== kind) return false;
      if (!hintLc) return true;
      var hay = (f.message + ' ' + (f.stem || '') + ' ' + (f.vendor || '')).toLowerCase();
      // Loose match — every word of hint must appear in hay.
      var words = hintLc.split(/\s+/).filter(Boolean);
      return words.every(function (w) { return hay.indexOf(w) !== -1; });
    }
    for (var i = 0; i < fs.length; i++) if (matches(fs[i])) return fs[i];
    return null;
  }

  function query(text) {
    if (!text) return null;
    for (var i = 0; i < INTENTS.length; i++) {
      var m = INTENTS[i].pattern.exec(text);
      if (m) {
        try {
          var answer = INTENTS[i].handler(m);
          if (answer) {
            root.__midLastVoiceAnswer = answer;
            return { intent: INTENTS[i].id, answer: answer };
          }
        } catch (_) {}
      }
    }
    return { intent: 'no-match', answer: 'Sorry — I didn\'t catch a question I can answer.' };
  }

  function speak(text) {
    if (!text || typeof root.speechSynthesis === 'undefined') return;
    try {
      var ut = new SpeechSynthesisUtterance(text);
      ut.rate = 1.05;
      // Mexican-Spanish accent when document is set to es.
      var docLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      if (docLang === 'es') ut.lang = 'es-MX';
      root.speechSynthesis.speak(ut);
    } catch (_) {}
  }

  var __recognizer = null;
  var __listening = false;

  function start(opts) {
    if (typeof root === 'undefined') return;
    var SR = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!SR) return;
    if (__listening) return;
    __recognizer = new SR();
    __recognizer.lang = (opts && opts.lang) || 'en-US';
    __recognizer.interimResults = false;
    __recognizer.maxAlternatives = 3;
    __recognizer.onresult = function (ev) {
      var text = ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript;
      if (!text) return;
      var r = query(text);
      if (r && r.answer) {
        speak(r.answer);
        if (root.plausible) {
          try { root.plausible('Invoice Decoder Voice Query', { props: { intent: r.intent } }); } catch (_) {}
        }
      }
    };
    __recognizer.onend = function () { __listening = false; };
    try { __recognizer.start(); __listening = true; } catch (_) {}
  }
  function stop() {
    if (__recognizer) try { __recognizer.stop(); } catch (_) {}
    __listening = false;
  }
  function isListening() { return __listening; }
  function intents() { return INTENTS.map(function (i) { return i.id; }); }
  function isSupported() {
    return !!(root.SpeechRecognition || root.webkitSpeechRecognition);
  }

  var api = { start: start, stop: stop, query: query, speak: speak, isListening: isListening, isSupported: isSupported, intents: intents };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_VOICE_QUERY = api;
})(typeof window !== 'undefined' ? window : null);
