/**
 * Shared analytics helpers for the Muntin Digital toolkit.
 *
 * Two concerns live here:
 *
 *   1. URL redaction. Every URL/audit tool logs the audited URL in
 *      Plausible event properties. If a user audits
 *      `https://example.com/admin/secret`, the path `/admin/secret`
 *      would leak into Plausible's collector. `redactUrlForAnalytics`
 *      strips path / query / fragment / userinfo and returns
 *      `protocol://host` only.
 *
 *   2. Event vocabulary lock (Sprint 15 — cohesion). EVENTS is the
 *      canonical list of every Plausible event name in use across
 *      the site. New event names must be added here first.
 *      `scripts/check-analytics-vocabulary.mjs` greps the codebase
 *      and fails when an event name is fired that isn't in this
 *      registry — catches typos and silent vocabulary drift.
 *
 * Both functions are pure; safe to import in Node tests.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinAnalytics = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function redactUrlForAnalytics(url) {
    if (typeof url !== 'string' || !url) return '';
    var trimmed = url.trim();
    if (!trimmed) return '';
    // URL parser is built into the browser + Node; safe across both.
    try {
      var u = new URL(trimmed);
      // Drop userinfo, path, query, fragment. Keep protocol + host
      // (which includes port if present).
      return u.protocol + '//' + u.host;
    } catch (_) {
      // If parsing fails, the value isn't a valid URL — return empty
      // rather than the raw input to be safe. Callers can then choose
      // to omit the prop entirely or use a placeholder.
      return '';
    }
  }

  // Canonical event vocabulary. Add new event names HERE FIRST,
  // then fire them from a tool. scripts/check-analytics-vocabulary.mjs
  // catches drift. Grouped by surface; alphabetical within group.
  // Group order is stable so a diff over time tells the reader where
  // new instrumentation landed.
  var EVENTS = {
    // Audits — restaurant audit tool's pipeline events.
    audit: [
      'Audit Auto-run',
      'Audit Business Type Corrected',
      'Audit Classification Overridden',
      'Audit Comparison Error',
      'Audit Comparison Run',
      'Audit Completed',
      'Audit Dev Brief Copied',
      'Audit Dev Brief Emailed',
      'Audit Dev Brief Printed',
      'Audit Dev-Prompt Copy',
      'Audit Error: Referrer Blocked',
      'Audit Feedback',
      'Audit PDF Email Failed',
      'Audit PDF Emailed',
      'Audit Permalink Copied',
      'Audit Reminder Scheduled',
      'Audit Retry',
      'Audit Share Card Downloaded',
      'Audit Shared',
      'Audit Shared: Image',
      'Audit Shared: Native',
      'Audit Snapshot Rerun',
      'Audit Started',
    ],
    // URL-fetching tool grades / scores.
    graders: [
      'Compare',
      'GBP Deep Scan',
      'GBP Grader',
      'GBP Share Saved',
      'Mobile Check',
      'SEO Grader',
      'Schema Check',
      'Schema Check Validate',
      'Search Ideas',
      'Speed Test',
      'Tech Stack',
    ],
    // Calculator tools — exports / runs / scenario pushes.
    calculators: [
      'Brand Suite Demo',
      'Brand Suite Export',
      'Brand Suite Extract',
      'Brand Suite Manual Apply',
      'Brand Suite Manual Open',
      'Brand Suite Workshop Open',
      'Brand Suite Workshop Pick',
      'Cost Pulse Loaded',
      'Invoice Decoder Accountant Export',
      'Invoice Decoder Adaptive Reread',
      'Invoice Decoder Bulk Confirm',
      'Invoice Decoder CSV Extract',
      'Invoice Decoder Category Set',
      'Invoice Decoder Comparison Opened',
      'Invoice Decoder Contract Set',
      'Invoice Decoder Filter Used',
      'Invoice Decoder Math Fix Applied',
      'Invoice Decoder PDF Extract',
      'Invoice Decoder Page Dedup',
      'Invoice Decoder Preprocess',
      'Invoice Decoder Read',
      'Invoice Decoder Row Confirmed',
      'Invoice Decoder Row Ignored',
      'Invoice Decoder Saved',
      'Invoice Decoder Unlocked',
      'Invoice Decoder Verify Speed',
      'Margin Math BreakEvenCovers',
      'Margin Math DeliveryBreakeven',
      'Margin Math PnL Shortcut',
      'Margin Math PriceRaise',
      'Margin Math PrimeCost',
      'Menu Copy Inspector Analysis',
      'Menu Copy Inspector Export',
      'Menu Design BRF Exported',
      'Menu Design Ctx Used',
      'Menu Design Downloaded',
      'Menu Design Draft Restored',
      'Menu Design Encouragement',
      'Menu Design Ghost Cleared',
      'Menu Design High Contrast Exported',
      'Menu Design Large Print Exported',
      'Menu Design PDF Failed',
      'Menu Design PNG Fallback',
      'Menu Design Paste',
      'Menu Design QR Exported',
      'Menu Design Quiz Picked',
      'Menu Design SSML Exported',
      'Menu Design Tablet Exported',
      'Menu Design Template Loaded',
      'Menu Design Text Exported',
      'Menu Engineering Analysis',
      'Menu Engineering Export',
      'Menu Engineering Whatif',
      'Open Hours Export',
      'Open Hours Render',
      'Photo Brief Compute',
      'Photo Brief Export',
      'Photo Brief Push',
      'Photo Brief Signature',
      'Plate Cost Compute',
      'Plate Cost Export',
      'Plate Cost Invoice Pulled',
      'Plate Cost OCR',
      'Plate Cost Push',
      'Plate Cost Signature',
    ],
    // Library — content engagement events.
    library: [
      'Checklist Completed',
      'Start Here Path',
      'Checklist Learn-more',
      'Checklist Subtype',
      'Glossary AZ',
      'Glossary Explainer Auto-play',
      'Glossary Filter',
      'Glossary Popover',
      'Glossary Search',
      'Glossary Topic',
      'Post Listened',
      'Post Listened: Completed',
      'Share',
    ],
    // Workshop / account — Sprint 15 will rename these in a future
    // pass to drop "Workbench" from the Plausible namespace too.
    // Until then they're registered as-is.
    workshop: [
      'Workbench Account Delete Request',
      'Workbench Open Saved',
      'Workbench Save',
      'Workbench Watch Attach',
      'Workbench Watch Detach',
      // Phase D (Storefront Health) — fired when intent=watch param
      // auto-opens the watch panel on tool arrival.
      'Workbench Watch Open',
      // Phase C (Storefront Health) — property lifecycle.
      'Property Created',
      'Property Verified',
      'Property Scorecard Refreshed',
      'Property Deleted',
      // Phase F (Field Notes) — submission lifecycle.
      'Submission Created',
      'Submission Approved',
      'Submission Rejected',
      'Submission Published',
    ],
    // Phase G (Growth) — diagnostics + broken-link surfacing.
    diagnostics: [
      '404 view',
    ],
    // Phase G.9 (Growth) — first-touch attribution + AI-search referrer
    // detection + tool-funnel + article-scroll instrumentation. Bounded
    // cardinality enforced by check-event-prop-cardinality.mjs.
    attribution: [
      'AI Search Landing',
      'Article Scroll',
      'Post-End CTA Click',
      'Returning Visitor',
      'Tool First Input',
      'Tool First Result',
      'Tool Save Intent',
    ],
    // Phase G.10 (Growth) — newsletter capture + double-opt confirm.
    newsletter: [
      'Lifecycle Email Click',
      'Lifecycle Email Opened',
      'Newsletter Confirmed',
      'Newsletter Signup',
    ],
    // Phase G.11 (Growth) — share-snapshot recipient banner click.
    share: [
      // 'Share' already registered under library; keeping recipient
      // events here for clarity. Plausible filters on props, not group.
    ],
    // Phase G.12 (Growth) — A/B framework + KPI dashboard events.
    experiments: [
      'Experiment Exposure',
      'Window Thread Resolved',
    ],
  };

  // Flat allowlist used by the CI checker.
  var EVENT_NAMES = Object.values(EVENTS).reduce(function (acc, group) {
    return acc.concat(group);
  }, []);

  return {
    redactUrlForAnalytics: redactUrlForAnalytics,
    EVENTS:      EVENTS,
    EVENT_NAMES: EVENT_NAMES,
  };
}));
