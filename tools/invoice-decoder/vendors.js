/**
 * Invoice Decoder — vendors.js (Wave B3).
 *
 * Vendor-aware parser registry. Each vendor exports a detect()
 * function that decides whether the OCR'd top-of-page text
 * matches that vendor's letterhead, plus optional parser hints
 * (column anchors, header skip patterns) that bias the generic
 * 5-pattern parser toward that vendor's known layout.
 *
 * detect(text) returns { score: 0..1, label }; the orchestrator
 * picks the highest-scoring vendor or falls through to the
 * generic parser when no vendor passes the 0.5 threshold.
 *
 * Atomic-sprint cadence: each vendor lands in its own commit so
 * the diff per signature stays small and inspectable. Sysco
 * ships first (most common across independent restaurants).
 */
(function (root) {
  'use strict';

  function topText(text, n) {
    return String(text || '').slice(0, n || 600).toLowerCase();
  }

  // Vendor: Sysco. Letterhead matches vary across regional ops
  // (Sysco Houston, Sysco Memphis, Sysco-branded subsidiaries),
  // so detect() scores positives for any of: brand mention,
  // SKU column header, "ship to" pattern, customer-number stamp.
  // Threshold is 0.5; a single brand mention alone is enough.
  var SYSCO = {
    id: 'sysco',
    label_en: 'Sysco',
    label_es: 'Sysco',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bsysco\b/.test(top)) score += 0.6;
      if (/sysco\s+(houston|chicago|atlanta|memphis|kansas|denver|seattle|portland|baltimore|cincinnati|nashville|jacksonville)/i.test(top)) score += 0.2;
      if (/customer\s+number\s*:?\s*\d{6,}/.test(top)) score += 0.15;
      if (/\bsupc\b|\bsupc#\b/.test(top)) score += 0.15; // Sysco Universal Product Code
      if (/sysco\s+pickup/.test(top)) score += 0.1;
      return { score: Math.min(1, score), label: SYSCO.label_en };
    },
    // Parser hints: Sysco prints SKU / qty / unit / desc / unit-
    // price / extended-price. The shipped Pattern D in parse.js
    // already handles SKU-prefixed lines, so for v1 we don't
    // override the parser — we just bias confidence upward when
    // we know it's Sysco.
    confidenceBoost: 12,
    // Header lines specific to Sysco invoices that the generic
    // header-skip regex might miss.
    headerLines: [
      /^pack\s+brand\s+description/i,
      /^supc\s+pack\s+size/i,
      /^marketplace\s+order/i
    ]
  };

  // Vendor: US Foods. Letterhead almost always says "US Foods"
  // verbatim (with or without "Inc"); pack-size column ("12/16OZ"
  // shape) is a high-precision signature when present.
  var US_FOODS = {
    id: 'us-foods',
    label_en: 'US Foods',
    label_es: 'US Foods',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bus\s*foods\b/.test(top)) score += 0.6;
      if (/\busfoods\b/.test(top)) score += 0.5;
      if (/\busf\b/.test(top)) score += 0.15;
      if (/pack\s*\/\s*size/.test(top)) score += 0.15;
      if (/\d+\s*\/\s*\d+\s*(oz|lb|ct|ea)/i.test(top)) score += 0.15;
      if (/division\s+of\s+us\s*foods/i.test(top)) score += 0.2;
      return { score: Math.min(1, score), label: US_FOODS.label_en };
    },
    confidenceBoost: 12,
    headerLines: [
      /^pack\s*\/\s*size/i,
      /^prod\s+id/i
    ]
  };

  // Vendor: Gordon Food Service (GFS). Item-class codes (PRD,
  // PRO, DRY, PAP, FRZ) printed right of SKU are a high-precision
  // signal — those exact 3-letter abbreviations rarely appear
  // elsewhere on an invoice.
  var GFS = {
    id: 'gfs',
    label_en: 'Gordon Food Service',
    label_es: 'Gordon Food Service',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/gordon\s+food\s+service/.test(top)) score += 0.6;
      if (/\bgfs\b/.test(top)) score += 0.4;
      if (/\bgfs\s+marketplace/.test(top)) score += 0.2;
      // Item-class codes — when several appear in the body text
      // it's almost certainly GFS.
      var classCodes = top.match(/\b(prd|pro|dry|pap|frz|bev|jan|sml|equ)\b/g);
      if (classCodes && classCodes.length >= 3) score += 0.25;
      return { score: Math.min(1, score), label: GFS.label_en };
    },
    confidenceBoost: 14, // GFS gives free category labels — bias higher
    headerLines: [
      /^item\s+class/i,
      /^prd\s+pro\s+dry/i
    ]
  };

  // Vendor: Restaurant Depot. Often bilingual EN+ES; printed
  // header includes the warehouse number stamp. Their wholesale
  // pricing notation ("MEMBER PRICE") is distinctive.
  var REST_DEPOT = {
    id: 'restaurant-depot',
    label_en: 'Restaurant Depot',
    label_es: 'Restaurant Depot',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/restaurant\s+depot/.test(top)) score += 0.6;
      if (/\brdmember\b|member\s+price/.test(top)) score += 0.2;
      if (/jetro\s+cash\s+&\s+carry/.test(top)) score += 0.5; // sister brand
      if (/warehouse\s*#?\s*\d{2,3}/.test(top)) score += 0.15;
      if (/cash\s+and\s+carry/.test(top)) score += 0.1;
      return { score: Math.min(1, score), label: REST_DEPOT.label_en };
    },
    confidenceBoost: 10
  };

  // Vendor: Shamrock Foods. Mountain-West regional; letterhead
  // always says "Shamrock Foods" verbatim. Item-class column
  // sometimes includes 2-letter codes (PR/PD/DG) — useful but
  // not required for detection.
  var SHAMROCK = {
    id: 'shamrock',
    label_en: 'Shamrock Foods',
    label_es: 'Shamrock Foods',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/shamrock\s+foods/.test(top)) score += 0.6;
      if (/\bshamrock\b/.test(top))     score += 0.4;
      if (/phoenix|denver|albuquerque|salt\s+lake/.test(top)) score += 0.1;
      if (/clover\s*pricing|clover\s*list/.test(top)) score += 0.15;
      return { score: Math.min(1, score), label: SHAMROCK.label_en };
    },
    confidenceBoost: 10,
    headerLines: [
      /^item\s+class/i,
      /^prod\s*#\s+description/i
    ]
  };

  // Vendor: Sygma. Sysco subsidiary but distinct invoice format —
  // uses customer SKU + house SKU columns side-by-side.
  var SYGMA = {
    id: 'sygma',
    label_en: 'Sygma',
    label_es: 'Sygma',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bsygma\b/.test(top))                     score += 0.6;
      if (/sygma\s+network/.test(top))               score += 0.2;
      if (/cust\s*item\s*#\s+house\s*item/.test(top)) score += 0.2;
      return { score: Math.min(1, score), label: SYGMA.label_en };
    },
    confidenceBoost: 10
  };

  // Vendor: Performance Food (PFG) / Vistar / Reinhart. Major
  // East-Coast and chain-restaurant distributor. PFG umbrella
  // includes Vistar (vending/concessions) and Reinhart (broadliner).
  var PFG = {
    id: 'pfg',
    label_en: 'Performance Food Group',
    label_es: 'Performance Food Group',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/performance\s+food/.test(top)) score += 0.6;
      if (/\bpfg\b/.test(top))            score += 0.4;
      if (/\bvistar\b/.test(top))         score += 0.5;
      if (/reinhart\s+foodservice/.test(top)) score += 0.5;
      if (/\breinhart\b/.test(top))       score += 0.3;
      if (/pfg\s+customized/.test(top))   score += 0.2;
      return { score: Math.min(1, score), label: PFG.label_en };
    },
    confidenceBoost: 10,
    headerLines: [
      /^item\s+#\s+description/i,
      /^pfg\s+#/i
    ]
  };

  // ===================================================================
  // Wave 4.2 — additional priority vendors
  // ===================================================================

  // Cheney Brothers — FL/GA/SC/AL/TN/NC dominant broadliner. The "Sysco
  // of the Southeast" for indie restaurants — biggest single coverage
  // gap before this addition.
  var CHENEY = {
    id: 'cheney-brothers',
    label_en: 'Cheney Brothers',
    label_es: 'Cheney Brothers',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bcheney\s+brothers\b/.test(top)) score += 0.6;
      if (/\bcbi\s+invoice\b/.test(top)) score += 0.3;
      if (/\bcheney\b/.test(top)) score += 0.3;
      if (/riviera\s+beach|ocala|punta\s+gorda|north\s+carolina/.test(top)) score += 0.05;
      return { score: Math.min(1, score), label: CHENEY.label_en };
    },
    confidenceBoost: 11,
    headerLines: [/^cbi\s+item/i, /^pack\s+brand\s+description/i]
  };

  // Ben E. Keith Foods — TX/OK/AR/NM/LA/MS broadliner; covers most
  // TexMex independents and BBQ shops Sysco doesn't lock up.
  var BEN_E_KEITH = {
    id: 'ben-e-keith',
    label_en: 'Ben E. Keith Foods',
    label_es: 'Ben E. Keith Foods',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/ben\s*e\.?\s*keith/.test(top)) score += 0.6;
      if (/\bbek\s+invoice\b/.test(top)) score += 0.3;
      if (/dallas|fort\s+worth|houston|san\s+antonio|amarillo|albuquerque/.test(top)) score += 0.05;
      return { score: Math.min(1, score), label: BEN_E_KEITH.label_en };
    },
    confidenceBoost: 11
  };

  // Imperial Dade — paper / chemical / disposables across NE+FL+CA
  // after rolling up >70 regionals. Almost every restaurant orders
  // weekly. Distinct because everything is paper/cleaning category.
  var IMPERIAL_DADE = {
    id: 'imperial-dade',
    label_en: 'Imperial Dade',
    label_es: 'Imperial Dade',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/imperial\s+dade/.test(top)) score += 0.6;
      if (/\bimp\s+dade\b/.test(top)) score += 0.3;
      // Their invoices are almost always paper/cleaning — strong signal.
      if (/janitorial|disposables|packaging|food\s*service\s+supplies/.test(top)) score += 0.1;
      return { score: Math.min(1, score), label: IMPERIAL_DADE.label_en };
    },
    confidenceBoost: 9,
    // Hint to the categorizer: bias toward paper/cleaning when this
    // vendor matches; consumed by Wave 4.2 categorization pipeline.
    categoryBias: { paper: 1.2, cleaning: 1.2 }
  };

  // KeHE Distributors — natural / specialty grocery; feeds plant-
  // forward, gluten-free, and Whole-Foods-style cafés.
  var KEHE = {
    id: 'kehe',
    label_en: 'KeHE Distributors',
    label_es: 'KeHE Distributors',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bkehe\b/.test(top)) score += 0.6;
      if (/kehe\s+distributors|kehe\s+specialty/.test(top)) score += 0.2;
      if (/natural\s+foods|specialty\s+foods|organic\s+grocery/.test(top)) score += 0.05;
      return { score: Math.min(1, score), label: KEHE.label_en };
    },
    confidenceBoost: 9
  };

  // UNFI (United Natural Foods) — same niche as KeHE plus organic
  // produce. Together they cover ~80% of independent natural cafés.
  var UNFI = {
    id: 'unfi',
    label_en: 'UNFI',
    label_es: 'UNFI',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bunfi\b/.test(top)) score += 0.6;
      if (/united\s+natural\s+foods/.test(top)) score += 0.4;
      if (/super\s*valu|supervalu/.test(top)) score += 0.1;
      return { score: Math.min(1, score), label: UNFI.label_en };
    },
    confidenceBoost: 9
  };

  // Baldor Specialty Foods — NYC/Boston/DC/Philly/Miami specialty
  // produce + protein. THE vendor for fine-dining and farm-to-table.
  var BALDOR = {
    id: 'baldor',
    label_en: 'Baldor Specialty Foods',
    label_es: 'Baldor Specialty Foods',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bbaldor\b/.test(top)) score += 0.6;
      if (/baldor\s+specialty/.test(top)) score += 0.3;
      if (/bronx|the\s+bronx|ny|new\s+york/.test(top)) score += 0.05;
      return { score: Math.min(1, score), label: BALDOR.label_en };
    },
    confidenceBoost: 11,
    categoryBias: { produce: 1.15, seafood: 1.1, protein: 1.1 }
  };

  // FreshPoint — Sysco produce subsidiary with distinct invoice
  // format despite Sysco ownership.
  var FRESHPOINT = {
    id: 'freshpoint',
    label_en: 'FreshPoint',
    label_es: 'FreshPoint',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bfreshpoint\b/.test(top)) score += 0.6;
      if (/fresh\s+point/.test(top)) score += 0.4;
      if (/produce\s+invoice|produce\s+order/.test(top)) score += 0.05;
      return { score: Math.min(1, score), label: FRESHPOINT.label_en };
    },
    confidenceBoost: 12,
    categoryBias: { produce: 1.25 }
  };

  // Maines Paper & Food — Northeast broadliner; indie pizza/diner core.
  var MAINES = {
    id: 'maines',
    label_en: 'Maines Paper & Food',
    label_es: 'Maines Paper & Food',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bmaines\b/.test(top)) score += 0.55;
      if (/maines\s+paper\s+(and|&)\s+food/.test(top)) score += 0.3;
      if (/conklin|broome\s+county/.test(top)) score += 0.05;
      return { score: Math.min(1, score), label: MAINES.label_en };
    },
    confidenceBoost: 10
  };

  // H Mart Wholesale + Asian wholesalers — frequently bilingual EN/KO/ZH.
  var ASIAN_WHOLESALE = {
    id: 'asian-wholesale',
    label_en: 'Asian wholesale (H Mart / 99 Ranch / Restaurant Depot Asia)',
    label_es: 'Mayorista asiático',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bh\s*mart\b|hmart/.test(top)) score += 0.6;
      if (/99\s*ranch/.test(top)) score += 0.6;
      if (/restaurant\s+depot\s+asia|rd\s+asia/.test(top)) score += 0.5;
      if (/asian\s+wholesale|korean\s+market|chinese\s+market/.test(top)) score += 0.2;
      return { score: Math.min(1, score), label: ASIAN_WHOLESALE.label_en };
    },
    confidenceBoost: 8
  };

  // Mexican wholesalers — TX/AZ/CA Mexican-cuisine indies; bilingual.
  var MEXICAN_WHOLESALE = {
    id: 'mexican-wholesale',
    label_en: 'Mexican wholesaler',
    label_es: 'Mayorista mexicano',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/la\s+michoacana\s+meat/.test(top)) score += 0.55;
      if (/northgate\s+market\s+foodservice|northgate\s+gonzalez/.test(top)) score += 0.5;
      if (/mariscos\s+linares/.test(top)) score += 0.5;
      if (/carniceria\s+|carnicería\s+/.test(top)) score += 0.2;
      if (/abarrotes\s+y\s+mas|abarrotes\s+y\s+más/.test(top)) score += 0.2;
      if (/proveedor\s+mexicano|distribuidor\s+latino/.test(top)) score += 0.2;
      return { score: Math.min(1, score), label: MEXICAN_WHOLESALE.label_en };
    },
    confidenceBoost: 8
  };

  var REGISTRY = [
    SYSCO, US_FOODS, GFS, REST_DEPOT, SHAMROCK, SYGMA, PFG,
    // Wave 4.2 additions
    CHENEY, BEN_E_KEITH, IMPERIAL_DADE, KEHE, UNFI, BALDOR,
    FRESHPOINT, MAINES, ASIAN_WHOLESALE, MEXICAN_WHOLESALE
  ];

  // detectVendor returns highest-scoring vendor with score >=
  // threshold (0.5), or null when none match. Caller falls
  // through to the generic parser when null.
  function detectVendor(ocrText, threshold) {
    var t = (typeof threshold === 'number') ? threshold : 0.5;
    var best = null;
    for (var i = 0; i < REGISTRY.length; i++) {
      var v = REGISTRY[i];
      var r = v.detect(ocrText);
      if (r && r.score >= t && (!best || r.score > best.score)) {
        best = { id: v.id, label: r.label, score: r.score, vendor: v };
      }
    }
    return best;
  }

  function applyVendorBoost(rows, vendor) {
    if (!vendor || !vendor.vendor) return rows;
    var boost = vendor.vendor.confidenceBoost || 0;
    rows.forEach(function (r) {
      r.confidence = Math.min(100, (r.confidence || 0) + boost);
      r.vendorDetected = vendor.id;
    });
    return rows;
  }

  var api = {
    REGISTRY: REGISTRY,
    detectVendor: detectVendor,
    applyVendorBoost: applyVendorBoost
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_VENDORS = api;
})(typeof window !== 'undefined' ? window : null);
