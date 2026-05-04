/**
 * Menu Design Suite — papers catalog (Wave studio-quality, code-split).
 *
 * The PAPERS object lived inside menu-render-pdf.js — but the orchestrator
 * needs PAPERS at boot to render the paper picker. menu-render-pdf.js
 * itself is now lazy-loaded only when the operator hits a PDF export.
 * Extracting the catalog into its own ~3KB module lets the boot bundle
 * stay tiny while the heavy renderer stays gated behind first-export.
 *
 * Dimensions are PostScript points (72/inch) — kept identical to the
 * jsPDF-native unit so menu-render-pdf.js consumes the catalog verbatim.
 *
 * exports: MD_PAPERS on window; module.exports for tests.
 */
(function (root) {
  'use strict';

  var PAPERS = {
    // -------- Sheets --------
    'letter':       { w: 612,    h: 792,    flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 48, label: 'Letter (8.5×11)',          stock: '24lb-text' },
    'letter-land':  { w: 792,    h: 612,    flow: 'page',  cat: 'sheet',  orient: 'landscape', margin: 48, label: 'Letter landscape (11×8.5)', stock: '24lb-text' },
    'a4':           { w: 595.28, h: 841.89, flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 48, label: 'A4 (210×297mm)',           stock: '24lb-text' },
    'a4-land':      { w: 841.89, h: 595.28, flow: 'page',  cat: 'sheet',  orient: 'landscape', margin: 48, label: 'A4 landscape',             stock: '24lb-text' },
    'legal':        { w: 612,    h: 1008,   flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 48, label: 'Legal (8.5×14)',           stock: '24lb-text' },
    'tabloid':      { w: 792,    h: 1224,   flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 60, label: 'Tabloid (11×17)',          stock: '32lb-text' },
    'half-page':    { w: 612,    h: 396,    flow: 'page',  cat: 'sheet',  orient: 'landscape', margin: 30, label: 'Half-page (8.5×5.5)',      stock: '32lb-text' },
    'quarter-pc':   { w: 306,    h: 396,    flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 24, label: 'Postcard (4.25×5.5)',      stock: '80lb-cover' },
    // -------- Folded multi-panel --------
    'bifold-letter': { w: 792, h: 612, flow: 'panel', cat: 'folded', orient: 'landscape', panels: 4, fold: 'bifold',
                       panelMap: ['back', 'front', 'inside-L', 'inside-R'], gutter: 18, margin: 36,
                       label: 'Bi-fold (letter, 4 panels)', stock: '80lb-cover' },
    'trifold-letter-z': { w: 792, h: 612, flow: 'panel', cat: 'folded', orient: 'landscape', panels: 6, fold: 'z-fold',
                          panelMap: ['front', 'inside-1', 'inside-2', 'back', 'address', 'tear'],
                          panelWidths: [264, 264, 264], gutter: 12, margin: 24,
                          label: 'Tri-fold Z (letter)', stock: '80lb-cover' },
    'trifold-letter-gate': { w: 792, h: 612, flow: 'panel', cat: 'folded', orient: 'landscape', panels: 6, fold: 'gate-fold',
                             panelWidths: [198, 396, 198],
                             panelMap: ['gate-L', 'front', 'gate-R', 'inside-L', 'center', 'inside-R'],
                             gutter: 12, margin: 24, label: 'Tri-fold gate (letter)', stock: '80lb-cover' },
    'trifold-legal': { w: 1008, h: 612, flow: 'panel', cat: 'folded', orient: 'landscape', panels: 6, fold: 'z-fold',
                       panelMap: ['front', 'inside-1', 'inside-2', 'back', 'inside-3', 'inside-4'],
                       panelWidths: [336, 336, 336], gutter: 12, margin: 24,
                       label: 'Tri-fold Z (legal — more dishes)', stock: '80lb-cover' },
    // -------- Table formats --------
    'table-tent':   { w: 360, h: 720, flow: 'panel', cat: 'table', orient: 'portrait', panels: 2, fold: 'tent',
                      panelMap: ['side-A', 'side-B'], gutter: 6, margin: 18,
                      label: 'Table tent (5×10 folded to 5×5)', stock: '100lb-cover' },
    // Wave studio-quality (C1 partial) — 4-panel table tent. Operators
    // running a "front + back + sides" tent (rotating specials, drink
    // list, kids menu, dessert menu on the four faces) currently have
    // to use two separate 2-panel tents. This 4-panel single-print
    // covers it. Legal-sheet sized so all four panels fit one sheet.
    'table-tent-4panel': { w: 612, h: 1008, flow: 'panel', cat: 'table', orient: 'portrait', panels: 4, fold: 'tent',
                           panelMap: ['side-A', 'side-B', 'side-C', 'side-D'],
                           panelWidths: [612, 612, 612, 612], gutter: 6, margin: 18,
                           label: 'Table tent 4-panel (8.5×14 folded to 4-sided)', stock: '100lb-cover' },
    // Wave studio-quality (C1 partial) — Beer-mat round. Square
    // bleed-aware paper (4.25" round). Operators at brewery taprooms
    // and beer halls hand customers a beer-mat-sized menu on each
    // round of beers; reorders happen on flips. Renderer treats the
    // square stock as a circle-trimmed canvas with conservative
    // inner safety zone so dish names don't sit on the trim line.
    'beer-mat-round':   { w: 306, h: 306, flow: 'page',  cat: 'table', orient: 'square', margin: 32,
                          shape: 'round',
                          label: 'Beer-mat (4.25" round)', stock: '120lb-coaster' },
    'table-card':   { w: 360, h: 504, flow: 'page',  cat: 'table', orient: 'portrait', margin: 18, label: 'Table card (5×7)',   stock: '100lb-cover' },
    'placemat':     { w: 720, h: 1008, flow: 'page', cat: 'table', orient: 'landscape', margin: 36, label: 'Placemat (10×14)',  stock: '70lb-uncoated' },
    'wine-narrow':  { w: 306, h: 792, flow: 'page',  cat: 'table', orient: 'portrait',  margin: 24, label: 'Wine list (4.25×11)', stock: '32lb-text' },
    'specials':     { w: 360, h: 504, flow: 'page',  cat: 'table', orient: 'portrait',  margin: 18, label: 'Specials card (5×7)', stock: '100lb-cover' },
    // -------- Board / poster --------
    'a2-board':     { w: 1190.55, h: 1683.78, flow: 'page', cat: 'board', orient: 'portrait', margin: 72, label: 'A2 menu board',     stock: 'rigid-board' },
    'a1-board':     { w: 1683.78, h: 2383.94, flow: 'page', cat: 'board', orient: 'portrait', margin: 96, label: 'A1 menu board',     stock: 'rigid-board' },
    // -------- Digital display --------
    'digital-16x9': { w: 1440,    h: 810,     flow: 'page', cat: 'digital', orient: 'landscape', margin: 60, label: 'Digital screen 16:9',     stock: 'screen-rgb' },
    'digital-9x16': { w: 810,     h: 1440,    flow: 'page', cat: 'digital', orient: 'portrait',  margin: 48, label: 'Digital screen 9:16 (TV)', stock: 'screen-rgb' },
    // -------- Custom (resolved at runtime) --------
    'custom':       { w: 612,     h: 792,     flow: 'page', cat: 'custom', orient: 'portrait',  margin: 48, label: 'Custom dimensions', stock: 'operator-choice', custom: true }
  };

  var api = { PAPERS: PAPERS, get: function (k) { return PAPERS[k] || null; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_PAPERS = api;
})(typeof window !== 'undefined' ? window : null);
