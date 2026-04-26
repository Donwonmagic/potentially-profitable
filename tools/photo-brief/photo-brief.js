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
  // Specs reviewed: 2026-04. Sources: Meta Help Center (Instagram
  // feed 4:5 best-practice), Google Business Profile help (cover
  // image minimum 1200×675), Yelp partner guidance (featured image
  // 1920×1280). Owner can still tick the 1:1 grid-square sub-option
  // for grid-harmony with older 1:1 posts.
  var SURFACES = {
    'web-hero':       { label: 'Web hero',         ratio: 16/9,    pixels: { w: 1920, h: 1080 }, negDefault: 'right'  },
    'og-card':        { label: 'OG card',          ratio: 1.91,    pixels: { w: 1200, h: 630  }, negDefault: 'bottom' },
    'yelp':           { label: 'Yelp featured',    ratio: 3/2,     pixels: { w: 1920, h: 1280 }, negDefault: 'none'   },
    'gbp-cover':      { label: 'Google Business',  ratio: 16/9,    pixels: { w: 1200, h: 675  }, negDefault: 'none'   },
    'ig-grid':        { label: 'Instagram feed',   ratio: 4/5,     pixels: { w: 1080, h: 1350 }, negDefault: 'none'   },
    'ig-grid-square': { label: 'Instagram square', ratio: 1,       pixels: { w: 1080, h: 1080 }, negDefault: 'none'   },
    'ig-story':       { label: 'Instagram story',  ratio: 9/16,    pixels: { w: 1080, h: 1920 }, negDefault: 'top'    },
    'menu-inline':    { label: 'Menu page inline', ratio: 4/3,     pixels: { w: 1200, h: 900  }, negDefault: 'none'   },
    'apple-maps':     { label: 'Apple Maps',       ratio: 4/3,     pixels: { w: 1024, h: 768  }, negDefault: 'none'   }
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
      case 'ig-grid':
      case 'ig-grid-square': base = { angle: '45deg', lighting: 'bright-table' }; break;
      case 'ig-story':    base = { angle: 'overhead',  lighting: 'bright-table' }; break;
      case 'menu-inline': base = { angle: 'overhead',  lighting: 'warm-window' };  break;
      case 'apple-maps':  base = { angle: 'room',      lighting: 'ambient' };      break;
      default:            base = { angle: '45deg',     lighting: 'warm-window' };
    }
    // Category nudges
    if (category === 'dessert' && (surfaceKey === 'web-hero' || surfaceKey === 'ig-grid' || surfaceKey === 'ig-grid-square' || surfaceKey === 'menu-inline')) {
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
  // Brief fragment encode/decode + quarterly ICS — the Reshoot
  // Check-in (Muntin signature). Encodes the entire brief into the
  // URL fragment of an iCalendar reminder so the operator's calendar
  // pings them quarterly with a one-click link back to the same
  // brief, ready to flag which dishes have changed and need a
  // reshoot. Per the HTTP spec, the part of a URL after "#" is never
  // sent to a server; the reminder lives only on the operator's
  // device.
  // ============================================================
  var PB_FRAGMENT_VERSION = '1';

  function encodeBriefField(s) {
    return encodeURIComponent(String(s == null ? '' : s))
      .replace(/\|/g, '%7C')
      .replace(/;/g,  '%3B')
      .replace(/&/g,  '%26')
      .replace(/=/g,  '%3D');
  }

  function encodeBriefFragment(brief, options) {
    if (!brief) return '';
    options = options || {};
    var dishes = (brief.dishes || []).filter(function(d){ return d && d.name; });
    var parts = [];
    parts.push('v=' + PB_FRAGMENT_VERSION);
    if (brief.restaurant)   parts.push('n=' + encodeBriefField(brief.restaurant));
    if (brief.photographer) parts.push('p=' + encodeBriefField(brief.photographer));
    if (brief.dayRate)      parts.push('r=' + Number(brief.dayRate));
    if (brief.sourceRatioLabel) parts.push('sr=' + encodeBriefField(brief.sourceRatioLabel));
    if (brief.surfaces && brief.surfaces.length) {
      parts.push('s=' + brief.surfaces.filter(function(k){ return SURFACES[k]; }).join(','));
    }
    if (dishes.length) {
      parts.push('d=' + dishes.map(function(d){
        return [
          encodeBriefField(d.name),
          d.category || 'main',
          d.priority || 'standard'
        ].join('|');
      }).join(';'));
    }
    if (options.date) parts.push('bd=' + encodeBriefField(options.date));
    if (options.mode) parts.push('mode=' + encodeBriefField(options.mode));
    return parts.join('&');
  }

  function decodeBriefFragment(fragment) {
    var s = String(fragment || '').replace(/^#/, '');
    if (!s) return null;
    // Honor a #brief=… key prefix as well as a bare fragment.
    var idx = s.indexOf('brief=');
    if (idx === 0) s = s.slice(6);
    var raw = {};
    s.split('&').forEach(function(pair){
      var eq = pair.indexOf('=');
      if (eq === -1) return;
      raw[pair.slice(0, eq)] = pair.slice(eq + 1);
    });
    if (raw.v !== PB_FRAGMENT_VERSION) return null;
    function dec(v) { try { return decodeURIComponent(v); } catch (e) { return v; } }
    var dishes = [];
    if (raw.d) {
      raw.d.split(';').forEach(function(seg){
        if (!seg) return;
        var f = seg.split('|').map(dec);
        if (!f[0]) return;
        dishes.push({
          name:     f[0],
          category: normalizeCategory(f[1] || 'main'),
          priority: normalizePriority(f[2] || 'standard')
        });
      });
    }
    var surfaces = raw.s
      ? raw.s.split(',').filter(function(k){ return SURFACES[k]; })
      : [];
    return {
      restaurant:       raw.n != null ? dec(raw.n) : '',
      photographer:     raw.p != null ? dec(raw.p) : '',
      dayRate:          Number(raw.r) || 1800,
      sourceRatioLabel: raw.sr != null ? dec(raw.sr) : '3:2',
      surfaces:         surfaces,
      dishes:           dishes,
      baselineDate:     raw.bd != null ? dec(raw.bd) : '',
      mode:             raw.mode != null ? dec(raw.mode) : ''
    };
  }

  // generateQuarterlyIcs — RFC 5545 calendar reminder. 8 events at
  // 3-month intervals, mirroring Plate Cost's Cost Drift Check-in
  // cadence. DTSTART is 90 days from today; URL field carries the
  // rehydration link.
  function generateQuarterlyIcs(scenarioUrl, options) {
    options = options || {};
    var locale = options.locale === 'es' ? 'es' : 'en';
    var url = String(scenarioUrl || '');
    var restaurant = String(options.restaurant || '').trim();
    var summary = locale === 'es'
      ? 'Brief de fotos — revisión trimestral' + (restaurant ? ' (' + restaurant + ')' : '')
      : 'Photo brief — quarterly reshoot check' + (restaurant ? ' (' + restaurant + ')' : '');
    var description = locale === 'es'
      ? ('Camina el comedor, abre tu sitio y tu Google Business Profile. ¿Qué fotos se ven viejas? ' +
         '¿Qué platos cambiaron? Marca solo esos en el brief — el Reshoot Ticket ' +
         'lista únicamente las tomas pendientes. Reabre el escenario: ' + url)
      : ('Walk the dining room, open your site and your Google Business Profile. ' +
         'Which photos look stale? Which dishes changed? Tick only those in the brief — ' +
         'the Reshoot Ticket lists only the frames actually due. Reopen the scenario: ' + url);
    var alarmMsg = locale === 'es'
      ? 'Recordatorio: revisar el brief de fotos mañana'
      : 'Reminder: walk the photo brief tomorrow';

    var p2 = function(n){ return (n < 10 ? '0' : '') + n; };
    var icsDate = function(d){
      return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) +
             'T' + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds()) + 'Z';
    };
    var slug = (restaurant || 'photo-brief').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var start = new Date();
    start.setUTCDate(start.getUTCDate() + 90);
    start.setUTCHours(15, 0, 0, 0);
    var end = new Date(start.getTime() + 30 * 60 * 1000);
    var uid = 'pb-quarterly-' + slug + '-' + start.getTime() + '@muntin.digital';

    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Muntin Digital//Photo Brief Builder//' + (locale === 'es' ? 'ES' : 'EN'),
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + icsDate(new Date()),
      'DTSTART:' + icsDate(start),
      'DTEND:' + icsDate(end),
      'RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=8',
      'SUMMARY:' + summary,
      'DESCRIPTION:' + description.replace(/\n/g, '\\n'),
      'URL:' + url,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + alarmMsg,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lines.join('\r\n') + '\r\n';
  }

  // verdictForAge — returns the photo-lifecycle drift verdict given a
  // baseline shoot date. Tones mirror plate-cost's: fresh / due /
  // stale / cold. Honest copy, not alarm copy.
  function verdictForAge(baselineDateStr, todayStr) {
    var b = baselineDateStr ? new Date(baselineDateStr) : null;
    var t = todayStr ? new Date(todayStr) : new Date();
    if (!b || isNaN(b.getTime())) return { tone: 'unknown', months: 0, copyEN: '', copyES: '' };
    var months = Math.max(0, Math.round((t.getTime() - b.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    if (months <= 6) {
      return { tone: 'fresh', months: months,
        copyEN: 'Photos are still fresh — last shoot ' + months + ' month' + (months === 1 ? '' : 's') + ' ago.',
        copyES: 'Las fotos están frescas — última sesión hace ' + months + ' mes' + (months === 1 ? '' : 'es') + '.' };
    }
    if (months <= 12) {
      return { tone: 'due', months: months,
        copyEN: 'Time to walk the dining room. Last shoot was ' + months + ' months ago.',
        copyES: 'Hora de caminar el comedor. Última sesión hace ' + months + ' meses.' };
    }
    if (months <= 18) {
      return { tone: 'stale', months: months,
        copyEN: 'Shoot is overdue at ' + months + ' months. Most operators are 18 months past their last refresh.',
        copyES: 'La sesión está atrasada (' + months + ' meses). Muchos operadores llevan 18 meses sin refresco.' };
    }
    return { tone: 'cold', months: months,
      copyEN: 'The site is showing its age — ' + months + ' months since the last shoot. Book the refresh.',
      copyES: 'El sitio se ve viejo — ' + months + ' meses desde la última sesión. Agenda el refresco.' };
  }

  // ============================================================
  // Paste-from-spreadsheet parser. Owners with a recipe spreadsheet
  // or a Menu Engineering CSV paste it directly. Auto-detects
  // delimiter (CSV / TSV / pipe), auto-maps headers via an alias
  // table that accepts EN + ES, normalises category + priority to
  // the declared enums.
  // ============================================================
  var HEADER_ALIASES = {
    name:     ['name', 'dish', 'item', 'product',
               'plato', 'platillo', 'nombre', 'producto'],
    category: ['category', 'cat', 'type', 'kind',
               'categoria', 'categoría', 'tipo'],
    priority: ['priority', 'rank', 'tier',
               'prioridad', 'jerarquía']
  };
  // Category aliases. Anything not matched falls back to 'main'.
  var CATEGORY_ALIASES = {
    'appetizer':  'appetizer', 'app': 'appetizer', 'starter': 'appetizer', 'antipasto': 'appetizer',
    'main':       'main', 'mains': 'main', 'entree': 'main', 'entrée': 'main',
    'pasta':      'pasta', 'noodle': 'pasta',
    'dessert':    'dessert', 'desserts': 'dessert', 'sweet': 'dessert', 'postre': 'dessert',
    'drink':      'drink', 'drinks': 'drink', 'beverage': 'drink', 'bebida': 'drink', 'cocktail': 'drink',
    'wholemenu':  'wholeMenu', 'whole-menu': 'wholeMenu', 'menu': 'wholeMenu', 'spread': 'wholeMenu',
    'room':       'room', 'space': 'room', 'interior': 'room', 'sala': 'room', 'comedor': 'room',
    // Spanish category names that don't already alias above
    'aperitivo':  'appetizer', 'entrante': 'appetizer',
    'principal':  'main', 'plato fuerte': 'main',
    'cóctel':     'drink'
  };
  function normalizeCategory(raw) {
    if (!raw) return 'main';
    var k = String(raw).trim().toLowerCase().replace(/[\s_-]+/g, '');
    return CATEGORY_ALIASES[k] || (CATEGORIES.indexOf(raw) !== -1 ? raw : 'main');
  }
  function normalizePriority(raw) {
    if (!raw) return 'standard';
    var k = String(raw).trim().toLowerCase();
    if (k === 'star' || k === 'hero' || k === 'estrella') return 'hero';
    if (k === 'plowhorse' || k === 'secondary' || k === 'caballo') return 'secondary';
    return 'standard';
  }

  function detectDelimiter(text){
    var firstLine = String(text).split(/\r?\n/)[0] || '';
    var counts = { ',': 0, '\t': 0, ';': 0, '|': 0 };
    for (var i = 0; i < firstLine.length; i++) {
      var c = firstLine[i];
      if (c in counts) counts[c]++;
    }
    var best = ',', bestCount = -1;
    for (var k in counts) if (counts[k] > bestCount) { best = k; bestCount = counts[k]; }
    return best;
  }
  function splitCsvLine(line, delim){
    var out = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (inQ) {
        if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQ = false; }
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === delim) { out.push(cur); cur = ''; }
        else cur += c;
      }
    }
    out.push(cur);
    return out.map(function(s){ return s.trim(); });
  }
  function isHeaderRow(cells){
    // Photo-brief data is all strings, so the numeric-vs-text
    // heuristic from Plate Cost over-fires. Instead: a row is a
    // header iff at least one cell matches a known field alias.
    for (var i = 0; i < cells.length; i++) {
      var norm = String(cells[i]).trim().toLowerCase().replace(/\s+/g, ' ');
      if (!norm) continue;
      for (var field in HEADER_ALIASES) {
        if (HEADER_ALIASES[field].indexOf(norm) !== -1) return true;
      }
    }
    return false;
  }
  function autoMapHeaders(headerCells){
    var mapping = {};
    headerCells.forEach(function(cell, idx){
      var norm = String(cell).trim().toLowerCase().replace(/\s+/g, ' ');
      Object.keys(HEADER_ALIASES).forEach(function(field){
        if (mapping[field] != null) return;
        if (HEADER_ALIASES[field].indexOf(norm) !== -1) mapping[field] = idx;
      });
    });
    return mapping;
  }

  function parseTabularText(text){
    var raw = String(text || '').replace(/^﻿/, '');
    if (!raw.trim()) return { rows: [], mapping: {}, headerRowDetected: false, warnings: ['Pasted text was empty.'] };

    var lines = raw.split(/\r?\n/).filter(function(l){ return l.trim().length > 0; });
    var delim = detectDelimiter(raw);
    var cellRows = lines.map(function(l){ return splitCsvLine(l, delim); });
    if (!cellRows.length) return { rows: [], mapping: {}, headerRowDetected: false, warnings: ['No rows detected.'] };

    var warnings = [];
    var headerRowDetected = isHeaderRow(cellRows[0]);
    var mapping;
    var dataRows;
    if (headerRowDetected) {
      mapping = autoMapHeaders(cellRows[0]);
      dataRows = cellRows.slice(1);
    } else {
      mapping = { name: 0, category: 1, priority: 2 };
      dataRows = cellRows;
      warnings.push('No header row detected — assumed columns: Dish, Category, Priority.');
    }

    if (mapping.name == null) {
      return { rows: [], mapping: mapping, headerRowDetected: headerRowDetected,
               warnings: warnings.concat(['Could not find a Dish/Name column. Add a header row, or paste columns in this order: Dish, Category, Priority.']) };
    }

    // Track silent normalizations so the UI can surface them. Owners
    // who paste "pizza" or "starter" deserve to know the tool re-
    // bucketed those into 'main' / 'appetizer' before the brief renders.
    var normalizations = [];
    var rows = dataRows.map(function(cells, i){
      function pick(field){
        var idx = mapping[field];
        if (idx == null || idx >= cells.length) return '';
        return String(cells[idx] == null ? '' : cells[idx]).trim();
      }
      var rawCat  = pick('category');
      var rawPri  = pick('priority');
      var category = normalizeCategory(rawCat);
      var priority = normalizePriority(rawPri);
      if (rawCat && category !== rawCat && CATEGORIES.indexOf(rawCat) === -1) {
        normalizations.push({ rowIndex: i + 1, field: 'category', original: rawCat, normalized: category });
      }
      if (rawPri && priority !== rawPri.toLowerCase() && ['hero','standard','secondary'].indexOf(rawPri.toLowerCase()) === -1) {
        normalizations.push({ rowIndex: i + 1, field: 'priority', original: rawPri, normalized: priority });
      }
      return { name: pick('name'), category: category, priority: priority };
    }).filter(function(r){ return r.name; });

    if (normalizations.length) {
      var sample = normalizations.slice(0, 3).map(function(n){
        return '"' + n.original + '" → ' + n.normalized;
      }).join(', ');
      var more = normalizations.length > 3 ? ' (+' + (normalizations.length - 3) + ' more)' : '';
      warnings.push('Reinterpreted ' + normalizations.length + ' value(s): ' + sample + more + '. Edit the dropdowns if any of those are wrong.');
    }

    return { rows: rows, mapping: mapping, headerRowDetected: headerRowDetected, warnings: warnings, normalizations: normalizations };
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
    encodeBriefFragment:    encodeBriefFragment,
    decodeBriefFragment:    decodeBriefFragment,
    generateQuarterlyIcs:   generateQuarterlyIcs,
    verdictForAge:          verdictForAge,
    parseTabularText:       parseTabularText,
    normalizeCategory:      normalizeCategory,
    normalizePriority:      normalizePriority,
    bucketShotCount:        bucketShotCount,
    bucketSurfaceCoverage:  bucketSurfaceCoverage,
    bucketSourceMode:       bucketSourceMode,
    SAMPLE_RECIPE_EN:       SAMPLE_RECIPE_EN,
    SAMPLE_RECIPE_ES:       SAMPLE_RECIPE_ES
  };

  if (typeof window !== 'undefined') window.PB = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
