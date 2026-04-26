/**
 * Photo Brief Builder — pure math, dual-exported (browser + Node).
 *
 * What it does, said the way an owner would say it:
 *   "Walk into your photographer's session with a one-page brief that
 *    gets you the right photos in one shoot."
 *
 * Math layers visible in the brief (per the §3a "math-first posture"
 * mitigation in the plan):
 *
 *   1. Aspect-ratio math — every (source-aspect, destination-aspect)
 *      pair returns a deterministic crop rectangle.
 *   2. Shot-count math — naive (dishes × surfaces × angles) vs
 *      deduplicated (one source frame can serve multiple destinations
 *      via crop math).
 *   3. Day-rate ROI math — given photographer day rate + dedup'd shot
 *      count, computes cost-per-shot and a months-to-break-even
 *      estimate using the literature lift range.
 *
 * Privacy invariants:
 *   - Pure math. No fetch, no DOM, no storage.
 *   - The brief never leaves this function call.
 *   - Plausible bucket helpers are enum-locked: poison-string inputs
 *     return one of the declared values, never user data.
 */

(function(){
  'use strict';

  // ============================================================
  // Canonical destination surfaces — eight tickable destinations
  // each photo is composed for. Pixel resolutions are the
  // platform-published current values; aspect ratios are the math.
  // ============================================================
  var SURFACES = {
    'web-hero':     { label: 'Web hero',          ratio: 16/9,    pixels: { w: 1920, h: 1080 }, negDefault: 'right'  },
    'og-card':      { label: 'OG card',           ratio: 1.91,    pixels: { w: 1200, h: 630  }, negDefault: 'bottom' },
    'yelp':         { label: 'Yelp featured',     ratio: 3/2,     pixels: { w: 1500, h: 1000 }, negDefault: 'none'   },
    'gbp-cover':    { label: 'Google Business',   ratio: 16/9,    pixels: { w: 1080, h: 608  }, negDefault: 'none'   },
    'ig-grid':      { label: 'Instagram grid',    ratio: 1,       pixels: { w: 1080, h: 1080 }, negDefault: 'none'   },
    'ig-story':     { label: 'Instagram story',   ratio: 9/16,    pixels: { w: 1080, h: 1920 }, negDefault: 'top'    },
    'menu-inline':  { label: 'Menu page inline',  ratio: 4/3,     pixels: { w: 1200, h: 900  }, negDefault: 'none'   },
    'apple-maps':   { label: 'Apple Maps',        ratio: 4/3,     pixels: { w: 1024, h: 768  }, negDefault: 'none'   }
  };

  // Constrained vocabularies (the §3 Risk-1 mitigation: math, not text).
  var ANGLES    = ['overhead', '45deg', 'plate-level', 'detail', 'room', 'process'];
  var LIGHTING  = ['warm-window', 'bright-table', 'low-key', 'flash-fill', 'ambient'];
  var NEG_SPACE = ['none', 'left', 'right', 'top', 'bottom'];
  var CATEGORIES = ['appetizer', 'main', 'pasta', 'dessert', 'drink', 'wholeMenu', 'room'];

  // The cell-defaults matrix — every (surface, category) pair returns
  // a canonical (angle, lighting, neg-space) triple. Owner can
  // override per cell; the brief reports override count. This is the
  // structured-not-editorial property the plan's Risk-1 hinges on.
  function defaultsForCell(surfaceKey, category) {
    var s = SURFACES[surfaceKey];
    if (!s) return null;
    // Room shots always go to room/ambient regardless of surface.
    if (category === 'room') return { angle: 'room', lighting: 'ambient', negSpace: s.negDefault };

    // Per-surface defaults; per-category nudges layered on top.
    var base;
    switch (surfaceKey) {
      case 'web-hero':    base = { angle: '45deg',     lighting: 'warm-window' };  break;
      case 'og-card':     base = { angle: '45deg',     lighting: 'warm-window' };  break;
      case 'yelp':        base = { angle: '45deg',     lighting: 'warm-window' };  break;
      case 'gbp-cover':   base = { angle: '45deg',     lighting: 'warm-window' };  break;
      case 'ig-grid':     base = { angle: '45deg',     lighting: 'bright-table' }; break;
      case 'ig-story':    base = { angle: 'overhead',  lighting: 'bright-table' }; break;
      case 'menu-inline': base = { angle: 'overhead',  lighting: 'warm-window' };  break;
      case 'apple-maps':  base = { angle: 'room',      lighting: 'ambient' };      break;
      default:            base = { angle: '45deg',     lighting: 'warm-window' };
    }
    // Category nudges
    if (category === 'dessert' && (surfaceKey === 'web-hero' || surfaceKey === 'ig-grid' || surfaceKey === 'menu-inline')) {
      base.angle = 'overhead';
    }
    if (category === 'drink') {
      base.angle = 'plate-level';
    }
    if (category === 'wholeMenu') {
      base.angle = 'overhead';
      base.lighting = 'warm-window';
    }
    base.negSpace = s.negDefault;
    return base;
  }

  // ============================================================
  // 1. Aspect-ratio math
  //
  // Given a source frame and a destination surface, returns the
  // rectangle (within the source) that maps to the destination after
  // a maximum-coverage crop.
  //
  // Returns:
  //   {
  //     axis:           'horizontal' | 'vertical' | 'exact',
  //     cropFraction:   share of the source's *constrained* axis kept
  //     sourceRatio:    pass-through
  //     destRatio:      pass-through
  //     destPixels:     pass-through from the SURFACES table
  //   }
  // ============================================================
  function computeCropRectangle(sourceRatio, destSurfaceKey) {
    var s = SURFACES[destSurfaceKey];
    if (!s) return null;
    var src = Number(sourceRatio);
    var dst = s.ratio;
    if (!isFinite(src) || src <= 0) src = 3 / 2; // sensible default
    var out = { sourceRatio: src, destRatio: dst, destPixels: s.pixels };
    if (Math.abs(src - dst) < 1e-6) {
      out.axis = 'exact'; out.cropFraction = 1;
    } else if (src > dst) {
      // Source is wider than destination — crop horizontally.
      out.axis = 'horizontal';
      out.cropFraction = dst / src;
    } else {
      // Source is taller than destination — crop vertically.
      out.axis = 'vertical';
      out.cropFraction = src / dst;
    }
    return out;
  }

  // ============================================================
  // 2. Shot-count / dedup math
  //
  // Inputs:
  //   dishes:   array of { name, category, priority? }
  //   surfaces: array of surface keys (subset of SURFACES)
  //   anglesPerDish: integer (3 default — overhead + 45deg + detail)
  //
  // Output:
  //   {
  //     naive:       dishes.length * surfaces.length * anglesPerDish
  //     dedup:       sum over dishes of unique (angle, lighting)
  //                  tuples needed across all selected surfaces
  //     perDish:     [{ name, surfaces[], shots: number,
  //                    rows: [{ angle, lighting, negSpace, surfaces[] }] }]
  //   }
  // ============================================================
  function dedupShotList(dishes, surfaces, anglesPerDish) {
    var apd = Math.max(1, Number(anglesPerDish) || 3);
    var dl  = Array.isArray(dishes) ? dishes : [];
    var sf  = Array.isArray(surfaces) ? surfaces.filter(function(k){ return SURFACES[k]; }) : [];
    var perDish = dl.map(function(dish){
      // For each (surface) the dish appears on, compute its default
      // (angle, lighting). Collapse duplicates — one source frame
      // serves every surface that wants the same (angle, lighting).
      var keyed = {};
      sf.forEach(function(surfaceKey){
        var d = defaultsForCell(surfaceKey, dish.category || 'main');
        if (!d) return;
        var key = d.angle + '|' + d.lighting;
        if (!keyed[key]) {
          keyed[key] = { angle: d.angle, lighting: d.lighting, negSpace: d.negSpace, surfaces: [] };
        }
        keyed[key].surfaces.push(surfaceKey);
        // Negative-space: if any surface using this (angle, lighting)
        // needs a non-'none' neg-space, the source frame must reserve
        // for it. Pick the most demanding (anything but 'none').
        if (d.negSpace !== 'none' && keyed[key].negSpace === 'none') {
          keyed[key].negSpace = d.negSpace;
        }
      });
      var rows = Object.keys(keyed).map(function(k){ return keyed[k]; });
      return {
        name:     dish.name || '',
        category: dish.category || 'main',
        priority: dish.priority || 'standard',
        surfaces: sf.slice(),
        shots:    rows.length,
        rows:     rows
      };
    });
    var naive = dl.length * sf.length * apd;
    var dedup = perDish.reduce(function(sum, d){ return sum + d.shots; }, 0);
    return { naive: naive, dedup: dedup, perDish: perDish };
  }

  // ============================================================
  // 3. ROI math — given dedup'd shot count + photographer day rate,
  // compute cost-per-shot and an honest months-to-break-even
  // estimate using the literature lift range (Wansink 2005:
  // descriptive labels +27%; Cornell SHA 2014: photographic lift
  // 10–18% across casual / fine-dining tiers).
  // ============================================================
  function computeRoiMath(shotCount, dayRate, opts) {
    opts = opts || {};
    var sc       = Math.max(0, Number(shotCount) || 0);
    var rate     = Math.max(0, Number(dayRate) || 1800);
    var perDay   = Math.max(1, Number(opts.shotsPerDay) || 50);
    // Replacement modelling — how many existing photos are being
    // upgraded? Default to 3 (the "worst-performing 3" framing).
    var replaced = Math.max(1, Number(opts.replacedItems) || 3);
    var avgCm    = Math.max(0, Number(opts.avgCmDollars) || 8);   // $ CM per plate
    var sales    = Math.max(0, Number(opts.dailyUnitsSold) || 12); // per item
    var liftMid  = 0.14; // mid of Wansink/Cornell range

    var days       = sc > 0 ? Math.ceil(sc / perDay) : 0;
    var totalCost  = days * rate;
    var perShot    = sc > 0 ? totalCost / sc : 0;
    var monthlyLift = replaced * sales * 30 * liftMid * avgCm;
    var paybackMonths = (monthlyLift > 0) ? totalCost / monthlyLift : null;

    return {
      days:           days,
      totalCost:      totalCost,
      costPerShot:    perShot,
      monthlyLift:    monthlyLift,
      paybackMonths:  paybackMonths,
      assumptions: {
        shotsPerDay:    perDay,
        replacedItems:  replaced,
        avgCmDollars:   avgCm,
        dailyUnitsSold: sales,
        liftMid:        liftMid
      }
    };
  }

  // ============================================================
  // URL-fragment encoders/decoders.
  //
  // The Risk-3 mitigation depends on these — Menu Engineering / Brand
  // Suite / Plate Cost compose URLs with these fragments; the Photo
  // Brief page reads them on load and pre-fills the form.
  // ============================================================
  function encodeStarsFragment(dishes) {
    if (!Array.isArray(dishes) || !dishes.length) return '';
    var lines = dishes.map(function(d){
      return [
        String(d.name || '').replace(/\|/g, ''),
        d.category || 'main',
        d.priority || 'standard'
      ].join('|');
    }).join('~');
    try { return encodeURIComponent(lines); } catch (_) { return ''; }
  }
  function decodeStarsFragment(raw) {
    if (!raw) return [];
    var s;
    try { s = decodeURIComponent(raw); } catch (_) { return []; }
    return s.split('~').map(function(line){
      var p = line.split('|');
      return { name: p[0] || '', category: p[1] || 'main', priority: p[2] || 'standard' };
    }).filter(function(d){ return d.name; });
  }
  function encodePaletteFragment(hexCodes) {
    if (!Array.isArray(hexCodes)) return '';
    return hexCodes.filter(function(h){
      return typeof h === 'string' && /^#?[0-9a-f]{3,8}$/i.test(h);
    }).map(function(h){ return h.replace(/^#/, ''); }).join('-');
  }
  function decodePaletteFragment(raw) {
    if (!raw) return [];
    return String(raw).split('-').filter(function(h){
      return /^[0-9a-f]{3,8}$/i.test(h);
    }).map(function(h){ return '#' + h.toUpperCase(); }).slice(0, 5);
  }
  function encodeMarginsFragment(items) {
    if (!Array.isArray(items)) return '';
    var lines = items.map(function(it){
      return [
        String(it.name || '').replace(/\|/g, ''),
        Number(it.plateCost || 0).toFixed(2),
        Number(it.suggestedPrice || 0).toFixed(2)
      ].join('|');
    }).join('~');
    try { return encodeURIComponent(lines); } catch (_) { return ''; }
  }
  function decodeMarginsFragment(raw) {
    if (!raw) return [];
    var s;
    try { s = decodeURIComponent(raw); } catch (_) { return []; }
    return s.split('~').map(function(line){
      var p = line.split('|');
      return {
        name:           p[0] || '',
        plateCost:      Number(p[1]) || 0,
        suggestedPrice: Number(p[2]) || 0
      };
    }).filter(function(it){ return it.name; });
  }

  // ============================================================
  // Plausible bucket helpers — enum-locked, privacy-critical. Tested
  // with poison-string sweeps (XSS, control chars, SQL fragments).
  // ============================================================
  function bucketShotCount(n) {
    var v = Number(n);
    if (!isFinite(v) || v <= 0) return '0';
    if (v <= 10) return '1-10';
    if (v <= 25) return '11-25';
    if (v <= 50) return '26-50';
    return 'gt-50';
  }
  function bucketSurfaceCoverage(surfaces) {
    if (!Array.isArray(surfaces)) return 'minimal';
    var n = surfaces.filter(function(k){ return SURFACES[k]; }).length;
    if (n <= 2) return 'minimal';
    if (n <= 4) return 'standard';
    return 'full';
  }
  function bucketSourceMode(opts) {
    opts = opts || {};
    var stars   = !!opts.hasStars;
    var palette = !!opts.hasPalette;
    var margins = !!opts.hasMargins;
    var edited  = !!opts.userEdited;
    if (!stars && !palette && !margins) return 'manual';
    if (edited) return 'mixed';
    if (stars && palette && margins) return 'prefill-full';
    if (stars && !palette) return 'prefill-stars';
    if (palette && !stars) return 'prefill-palette';
    return 'prefill-stars';
  }

  // ============================================================
  // Sample fixture — 6 dishes, casual full-service Italian. Mirrors
  // the Cacio e pepe sample from Plate Cost so the toolkit shares a
  // canonical demo restaurant across surfaces.
  // ============================================================
  var SAMPLE_RECIPE_EN = {
    name: 'Osteria Giardino',
    photographer: '',
    dishes: [
      { name: 'Cacio e pepe',        category: 'pasta',    priority: 'hero'      },
      { name: 'Brodetto di pesce',   category: 'main',     priority: 'hero'      },
      { name: 'Tiramisu',            category: 'dessert',  priority: 'standard'  },
      { name: 'Focaccia + olive oil',category: 'appetizer',priority: 'standard'  },
      { name: 'Negroni sbagliato',   category: 'drink',    priority: 'secondary' },
      { name: 'Dining room',         category: 'room',     priority: 'standard'  }
    ],
    surfaces: ['web-hero', 'gbp-cover', 'ig-grid', 'menu-inline'],
    palette: ['#1F4E5B', '#C68A2C', '#FAF7F2', '#14161A', '#5A5752'],
    typographyMood: 'editorial',
    dayRate: 1800
  };
  var SAMPLE_RECIPE_ES = {
    name: 'Osteria Giardino',
    photographer: '',
    dishes: [
      { name: 'Cacio e pepe',         category: 'pasta',    priority: 'hero'      },
      { name: 'Brodetto de pescado',  category: 'main',     priority: 'hero'      },
      { name: 'Tiramisú',             category: 'dessert',  priority: 'standard'  },
      { name: 'Focaccia + aceite',    category: 'appetizer',priority: 'standard'  },
      { name: 'Negroni sbagliato',    category: 'drink',    priority: 'secondary' },
      { name: 'Sala del comedor',     category: 'room',     priority: 'standard'  }
    ],
    surfaces: ['web-hero', 'gbp-cover', 'ig-grid', 'menu-inline'],
    palette: ['#1F4E5B', '#C68A2C', '#FAF7F2', '#14161A', '#5A5752'],
    typographyMood: 'editorial',
    dayRate: 1800
  };

  // ============================================================
  // Public API
  // ============================================================
  var api = {
    SURFACES:               SURFACES,
    ANGLES:                 ANGLES,
    LIGHTING:               LIGHTING,
    NEG_SPACE:              NEG_SPACE,
    CATEGORIES:             CATEGORIES,
    defaultsForCell:        defaultsForCell,
    computeCropRectangle:   computeCropRectangle,
    dedupShotList:          dedupShotList,
    computeRoiMath:         computeRoiMath,
    encodeStarsFragment:    encodeStarsFragment,
    decodeStarsFragment:    decodeStarsFragment,
    encodePaletteFragment:  encodePaletteFragment,
    decodePaletteFragment:  decodePaletteFragment,
    encodeMarginsFragment:  encodeMarginsFragment,
    decodeMarginsFragment:  decodeMarginsFragment,
    bucketShotCount:        bucketShotCount,
    bucketSurfaceCoverage:  bucketSurfaceCoverage,
    bucketSourceMode:       bucketSourceMode,
    SAMPLE_RECIPE_EN:       SAMPLE_RECIPE_EN,
    SAMPLE_RECIPE_ES:       SAMPLE_RECIPE_ES
  };

  if (typeof window !== 'undefined') window.PB = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
