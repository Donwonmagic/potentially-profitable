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
      'Audit Error: Client Timeout',
      'Audit Error: PSI Failed',
      'Audit Error: PSI Failed (Timeout)',
      'Audit Error: Referrer Blocked',
      'Audit Error: Watchdog Timeout',
      'Audit Feedback',
      'Audit PDF Email Failed',
      'Audit PDF Emailed',
      'Audit Permalink Copied',
      'Audit PSI Desktop Fallback',
      'Audit Reaudit Click',
      'Audit Reminder Scheduled',
      'Audit Retry',
      'Audit Self-Fix Filter',
      'Audit Share Card Downloaded',
      'Audit Shared',
      'Audit Shared: Image',
      'Audit Shared: Native',
      'Audit Snapshot Rerun',
      'Audit Started',
      'Audit Weekend Mode Enter',
      'Audit Weekend Mode Exit',
      'Audit Weekend Mode No Self Items',
    ],
    // URL-fetching tool grades / scores.
    graders: [
      'Compare',
      'GBP Deep Scan',
      'GBP Grader',
      'GBP Share Saved',
      'Page Health Mobile',
      'SEO Grader',
      'Schema Check',
      'Schema Check Validate',
      'Search Ideas',
      'Page Health',
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
      'Bench Assessed',
      'Bench Loaded',
      'Bench Multi-Date Computed',
      'Bench Example Loaded',
      'Bench Ask Copied',
      'Bench Brief Copied',
      'Bench Brief Printed',
      'Bench Contract Saved',
      'Cost Pulse Loaded',
      'Cost Pulse Horizon Picked',
      'Cost Pulse Lock Sheet Printed',
      'Invoice Decoder Accountant Export',
      'Invoice Decoder Adaptive Reread',
      'Invoice Decoder Briefing Action',
      'Invoice Decoder Briefing Undo',
      'Invoice Decoder Bulk Confirm',
      'Invoice Decoder Coach Capture',
      'Invoice Decoder Coach Done',
      'Invoice Decoder CSV Extract',
      'Invoice Decoder Category Set',
      'Invoice Decoder Comparison Opened',
      'Invoice Decoder Contract Set',
      'Invoice Decoder Device Paired',
      // OCR overhaul — V2 + escalation telemetry (commit ae1a83b2).
      // Six events surface the new pipeline's behaviour to plausible:
      // hard error taxonomy, V2 success/fail/fallback paths, layout-
      // model failure mode, operator-driven setting changes.
      'Invoice Decoder Error',
      'Invoice Decoder Filter Used',
      'Invoice Decoder Ghost Accepted',
      'Invoice Decoder Installed',
      'Invoice Decoder Layout Model Failed',
      'Invoice Decoder Math Fix Applied',
      'Invoice Decoder Paddle Ensemble',
      'Invoice Decoder PDF Extract',
      'Invoice Decoder Page Dedup',
      'Invoice Decoder Preprocess',
      'Invoice Decoder Read',
      'Invoice Decoder Reader Setting Changed',
      'Invoice Decoder Recon Note Copied',
      'Invoice Decoder Recovery Set',
      'Invoice Decoder Rotation Fallback',
      'Invoice Decoder Row Confirmed',
      'Invoice Decoder Row Ignored',
      'Invoice Decoder Saved',
      'Invoice Decoder Self Check',
      'Invoice Decoder Share Received',
      'Invoice Decoder Unlocked',
      'Invoice Decoder V2 Escalation Fail',
      'Invoice Decoder V2 Escalation Win',
      'Invoice Decoder V2 Fallback',
      'Invoice Decoder Vendor Learned',
      'Invoice Decoder Verify Speed',
      // Wave 10-13 — gold-standard push: cross-tool spine, owner-grade
      // insights, surprise-and-delight. Pre-registered so the tooling
      // doesn't trip the analytics-vocabulary check when each lands.
      'Invoice Decoder Bookmarklet Receive',
      'Invoice Decoder Cell History',
      'Invoice Decoder Forecast Shown',
      'Invoice Decoder Insight Card Shared',
      'Invoice Decoder PDF Annotated',
      'Invoice Decoder Reorder Copied',
      'Invoice Decoder Run Rate',
      'Invoice Decoder Seasonality',
      'Invoice Decoder Supplier Health',
      'Invoice Decoder Theft Flag',
      'Invoice Decoder Tour Completed',
      'Invoice Decoder Tour Skipped',
      'Invoice Decoder Tour Started',
      'Invoice Decoder Vendor Switch ROI',
      'Invoice Decoder Voice Query',
      'Invoice Decoder What-If',
      'Margin Math Break-Even Shift',
      'Menu Engineering Bucket Move',
      'Plate Cost Ghost Update',
      'Plate Cost Stale Accept',
      'Cost Pulse Recipe Ripple',
      'Margin Math BreakEvenCovers',
      'Margin Math DeliveryBreakeven',
      'Margin Math PnL Shortcut',
      'Margin Math PriceRaise',
      'Margin Math PrimeCost',
      'Menu Converter Handoff',
      'Menu Copy Handoff',
      'Menu Copy Inspector Analysis',
      'Menu Copy Inspector Export',
      'Menu Design BRF Exported',
      'Menu Design Ctx Used',
      // Wave A6 — funnel events added by the empowerment plan to
      // close the diagnosis gap between Tool Loaded and Outbound CTA
      // (the studio handoff). Bounded prop sets enforced by
      // scripts/check-event-prop-cardinality.mjs.
      'Menu Design CDN Fallback',
      'Menu Design Custom Logo Added',
      'Menu Design Disclaimer Read',
      'Menu Design Downloaded',
      'Menu Design Draft Restored',
      'Menu Design Encouragement',
      'Menu Design Export Failed',
      'Menu Design First Dish',
      'Menu Design Ghost Cleared',
      'Menu Design High Contrast Exported',
      'Menu Design Large Print Exported',
      'Menu Design Outbound Drop-In',
      'Menu Design Outbound Polish',
      'Menu Design Outbound Print Shop',
      'Menu Design Pack Exported',
      'Menu Design PDF Failed',
      'Menu Design PNG Fallback',
      'Menu Design Paste',
      'Menu Design QR Exported',
      'Menu Design Quiz Picked',
      'Menu Design Save Failed',
      'Menu Design SSML Exported',
      'Menu Design Social Exported',
      'Menu Design Specials Exported',
      'Menu Design Tablet Exported',
      'Menu Design Template Loaded',
      'Menu Design Thermal Exported',
      'Menu Design Text Exported',
      'Menu Design Theme Changed',
      'Menu Design Tool Loaded',
      'Menu Engineering Analysis',
      'Menu Engineering Export',
      'Menu Engineering Handoff',
      'Menu Engineering Whatif',
      'Store Hours Export',
      'Store Hours Render',
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
      // Wave 14.8 — cross-tool "what's new" pulse on surfaces operators
      // gained when the Invoice Decoder spine landed. Tool + surface ID
      // are bounded (per registry), no operator data carried.
      'Whats New Clicked Through',
      'Whats New Dismissed',
      'Whats New Opened',
    ],
    // Library — content engagement events.
    library: [
      'Checklist Completed',
      'Start Here Path',
      'Start Journey',
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
      // Audio experience redesign — events fired from assets/js/listen.js.
      // Naming convention: "Audio: <Verb>" — namespaced so they sort
      // together in Plausible and don't collide with the older bare
      // "Post Listened" events that pre-date the redesign.
      'Audio: Preview',
      'Audio: Keyboard Shortcut',
      'Audio: Deep Link',
      'Audio: Shared with Timestamp',
      'Audio: Resume Chip Shown',
      'Audio: Resume Chip Tapped',
      'Audio: Sentence Click Seek',
      'Audio: Chapter Jump',
      'Audio: Help Opened',
      'Audio: Finished Prompt Shown',
      'Audio: Finished Prompt Clicked',
      // Lesson Mode (Phase 3.2 + 3.3) — fires from assets/js/listen.js
      // (Widget Pause) and the inline mark-complete script
      // (Celebration Audio). Both are bounded — one event per
      // pause-or-completion, no per-chunk-or-progress firehose.
      'Audio: Widget Pause',
      'Audio: Widget Resume',
      'Course Celebration Audio',
      // Open the Doors bootcamp — engagement + progression events.
      // 'Course Lesson View' fires on page load (debounced via
      // sessionStorage so reload-storm doesn't double-count). The other
      // three fire on mark-complete: 'Course Lesson Complete' always,
      // 'Course Module Complete' at M1/M2/M3 boundaries, 'Course
      // Bootcamp Complete' on the final lesson. Props standardized to
      // { module, lesson, locale } so cohort segmentation in Plausible
      // is uniform across the funnel.
      'Course Lesson View',
      'Course Lesson Complete',
      'Course Module Complete',
      'Course Bootcamp Complete',
      // Fired from course/m4-launch/generator/generator.js when the
      // operator downloads the generated static-site ZIP — the L14
      // payoff moment.
      'Course Generator Download',
      // Fired when a signed-in operator clicks "Save to the Workshop"
      // on the L14 generator page — persists the MuntinContext
      // snapshot under kind=course-generator-output.
      'Course Generator Save',
      'Share',
      // Phase 3A (launch) — Cal.com booking surface (/studio/call/).
      // Fires once per page view, ~800ms after load (after the embed
      // settles). One bounded event, no per-source props — that
      // discipline matches 'Start Here Path' above.
      'Call Page View',
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
      // B7 (Operator Sheets) — fired when the Workshop's Reopen button
      // hands the operator off to a sheet with prefilled values.
      'Workbench Sheet Reopen',
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
      // Phase 2 hub redesign — tracks which tier filter visitors pick.
      // Props: { tier: 'all' | 'quick' | 'standard' | 'deep' }.
      'Tools Hub Filter',
      // Phase 7 dark-mode toggle — tracks user override of OS pref.
      // Props: { theme: 'auto' | 'light' | 'dark' }.
      'Theme Toggle',
      // Phase 9 light-refresh — voice search inside the Pagefind modal.
      // Fired when the user activates speech-to-text input. Mounted only
      // when window.SpeechRecognition (Chromium/Safari) is available, so
      // event volume is naturally capped by browser support.
      // Props: { locale: 'en-US' | 'es-ES' } — bounded cardinality.
      'Voice Search',
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
    // Ledger funnel — outbound routing from muntin.digital content to
    // the Muntin Ledger product (ledger.muntin.digital). Fired
    // declaratively (Plausible class API) on a Ledger CTA click at the
    // end of a feeder article; props are bounded to { source:
    // '<feeder-slug>' }, a closed set drawn from data/ledger-cta.json,
    // so the cardinality guard stays calm. Nav-link clicks are captured
    // by Plausible's automatic outbound-link tracking instead.
    ledger: [
      'Ledger Route Click',
    ],
    // Phase G.10 (Growth) — newsletter capture + double-opt confirm.
    newsletter: [
      'Lifecycle Email Click',
      'Lifecycle Email Opened',
      'Newsletter Confirmed',
      'Newsletter Signup',
      // Ledger founding-list capture — fired by the hero founding-form
      // (index.html + es/index.html, data-event="Waitlist Signup").
      'Waitlist Signup',
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
    // Window redesign — composer, attachments, callback, /now/, asides.
    // Phase 1a–5+ events fired by /window/ + admin queue + site-wide
    // aside scripts. See docs/window-redesign-plan.md §G.10.
    window: [
      'Window Send',
      'Window Error',
      'Window Chip',
      'Window Crisis Flag',
      'Window Claimed',
      'Window Prefill',
      'Window Aside Shown',
      'Window Aside Clicked',
      'Window Attach Photo',
      'Window Attach Voice',
      'Window Callback Request',
      'Window Now Edit',
    ],
    // Micro-offer funnel — productized offers below the $499 floor.
    // Phase 0 fires view_micro_offer on landing-page load. Phase 1
    // (paid checkout) adds start_checkout, complete_checkout,
    // intake_submitted, delivered, upgrade_credit_used. Props are
    // capped at { sku, locale } so the cardinality guard stays calm.
    micro_offers: [
      'view_micro_offer',
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
