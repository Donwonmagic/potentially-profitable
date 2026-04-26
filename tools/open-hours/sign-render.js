/**
 * Open Hours — Storefront Sign + Open Hours Card renderer.
 *
 * Two distinct outputs, both same-origin Canvas 2D, both via toBlob().
 *
 *   Storefront Sign — 1200×1800 (letter portrait at ~150 DPI).
 *   The signature deliverable. The owner prints, trims, tapes inside
 *   the door, OR slots into an A-frame board, OR posts to Instagram
 *   before holiday closures. No watermark; the URL is a discreet
 *   footer line so a designer can find the source.
 *
 *   Open Hours Card — 1200×1500. Companion shareable. Bundles the
 *   weekly grid, upcoming closures, JSON-LD code block, and cross-
 *   platform paste blocks into one image — used when the owner is
 *   forwarding the analysis to a partner or developer instead of
 *   printing for the door.
 *
 * Privacy invariants (mirrors brand-suite/pane-render.js,
 * menu-engineering/card-render.js, menu-copy/card-render.js):
 *   - Pure rendering. No fetch, no storage, no DOM mutation outside
 *     the offscreen canvas this module creates.
 *   - Output via canvas.toBlob() so bytes stay same-origin.
 */

(function(){
  // ------------------------------------------------------------
  // Geometry
  // ------------------------------------------------------------
  var SIGN_W = 1200;
  var SIGN_H = 1800;
  var CARD_W = 1200;
  var CARD_H = 1500;

  var INK    = '#14161A';
  var CREAM  = '#FAF7F2';
  var CREAM2 = '#F2EEE5';
  var STONE  = '#5A5752';
  var TEAL   = '#1F4E5B';
  var LINE   = '#E5E0D8';

  var FONT_DISPLAY = '"Fraunces", "Times New Roman", serif';
  var FONT_BODY    = '"Inter", -apple-system, "Segoe UI", sans-serif';

  // ------------------------------------------------------------
  // Helpers (shared with the existing card-render modules in spirit)
  // ------------------------------------------------------------
  function roundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    var words = String(text || '').split(/\s+/);
    var lines = [];
    var current = '';
    for (var i = 0; i < words.length; i++) {
      var test = current ? current + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = words[i];
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function fmtHolidayShort(iso, locale) {
    if (!iso) return '';
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return d.toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US',
      { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  // ------------------------------------------------------------
  // Storefront Sign — vertical layout, large legible type
  // ------------------------------------------------------------
  function renderStorefrontSign(opts) {
    opts = opts || {};
    var summary = opts.summary || { week: {}, name: '', city: '' };
    var closures = opts.closures || [];
    var strings = opts.strings || DEFAULT_STRINGS_EN;
    var locale = opts.locale || 'en';
    var formatTime = opts.formatTime || function(t){ return t || ''; };

    var canvas = document.createElement('canvas');
    canvas.width = SIGN_W;
    canvas.height = SIGN_H;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, SIGN_W, SIGN_H);

    // Outer hairline frame for printed visual containment.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, SIGN_W - 80, SIGN_H - 80);

    // Restaurant name (huge, display)
    var name = summary.name || strings.placeholderName;
    ctx.fillStyle = INK;
    ctx.font = '500 84px ' + FONT_DISPLAY;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    var nameLines = wrapText(ctx, name, SIGN_W - 200);
    var ny = 160;
    nameLines.slice(0, 2).forEach(function(l, i){
      ctx.fillText(l, SIGN_W / 2, ny + i * 92);
    });

    // Eyebrow under the name
    ctx.fillStyle = STONE;
    ctx.font = '600 18px ' + FONT_BODY;
    ctx.textBaseline = 'alphabetic';
    var eyebrow = strings.signEyebrow.toUpperCase();
    // Letterspacing trick — draw chars with a fixed gap.
    ctx.save();
    ctx.translate(0, 0);
    drawTrackedText(ctx, eyebrow, SIGN_W / 2, ny + nameLines.length * 92 + 30, 4);
    ctx.restore();

    // "Open hours" heading
    var weekY = 380;
    ctx.fillStyle = INK;
    ctx.font = '500 36px ' + FONT_DISPLAY;
    ctx.textAlign = 'left';
    ctx.fillText(strings.signWeeklyHeader, 100, weekY);

    // A horizontal rule under the heading.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, weekY + 14);
    ctx.lineTo(SIGN_W - 100, weekY + 14);
    ctx.stroke();

    // Per-day rows. 7 days × 60 px = 420; comfortable.
    var rowH = 64;
    var rowY = weekY + 60;
    var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var DAY_FULL_LOCAL = locale === 'es'
      ? ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    DAYS.forEach(function(d, idx){
      var y = rowY + idx * rowH;
      // Day name
      ctx.fillStyle = INK;
      ctx.font = '500 28px ' + FONT_DISPLAY;
      ctx.textAlign = 'left';
      ctx.fillText(capitalize(DAY_FULL_LOCAL[idx]), 110, y);
      // Hours (right-aligned)
      var services = (summary.week && summary.week[d]) || [];
      var label;
      if (!services.length) {
        label = strings.signClosed;
        ctx.fillStyle = STONE;
      } else {
        label = services.map(function(s){
          return formatTime(s.opens, locale) + ' – ' + formatTime(s.closes, locale);
        }).join('  ·  ');
        ctx.fillStyle = INK;
      }
      ctx.font = '500 26px ' + FONT_BODY;
      ctx.textAlign = 'right';
      ctx.fillText(label, SIGN_W - 110, y);
      // Subtle divider between rows
      if (idx < DAYS.length - 1) {
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(110, y + 22);
        ctx.lineTo(SIGN_W - 110, y + 22);
        ctx.stroke();
      }
    });

    // Closures — show up to 4 upcoming.
    var closuresY = rowY + 7 * rowH + 50;
    var upcoming = closures.slice(0, 4);
    if (upcoming.length) {
      ctx.fillStyle = INK;
      ctx.font = '500 28px ' + FONT_DISPLAY;
      ctx.textAlign = 'left';
      ctx.fillText(strings.signClosuresHeader, 100, closuresY);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, closuresY + 14);
      ctx.lineTo(SIGN_W - 100, closuresY + 14);
      ctx.stroke();
      var cy = closuresY + 56;
      upcoming.forEach(function(c, i){
        ctx.fillStyle = INK;
        ctx.font = '500 22px ' + FONT_BODY;
        ctx.textAlign = 'left';
        var label = fmtHolidayShort(c.date, locale) + '  —  ' + (c.name || strings.signClosed);
        ctx.fillText(label, 110, cy + i * 38);
      });
    }

    // Footer: city line, freshness band ("Printed [date] · Reprint
    // after [latest closure date]"), then the unified Muntin credit
    // at 60% opacity per the §3a recessive-credit rule. The freshness
    // band tells the owner exactly when to come back; the credit
    // reads like a maker's stamp.
    ctx.fillStyle = STONE;
    ctx.font = '500 16px ' + FONT_BODY;
    ctx.textAlign = 'center';
    ctx.fillText(strings.signFooterPrefix + ' ' + (summary.city || ''), SIGN_W / 2, SIGN_H - 122);

    // Freshness band
    var freshness = buildFreshnessLine(closures, locale, strings);
    ctx.fillStyle = INK;
    ctx.font = '600 13px ' + FONT_BODY;
    ctx.textAlign = 'center';
    drawTrackedText(ctx, freshness.toUpperCase(), SIGN_W / 2, SIGN_H - 92, 3);

    // Recessive Muntin credit
    ctx.fillStyle = 'rgba(20,22,26,0.6)';
    ctx.font = '500 12px ' + FONT_BODY;
    drawTrackedText(ctx, (strings.signFooterCredit || '').toUpperCase(), SIGN_W / 2, SIGN_H - 60, 3);

    return canvas;
  }

  function buildFreshnessLine(closures, locale, strings) {
    // "Printed Apr 26, 2026 · Reprint after Dec 25, 2026" — the
    // reprint-after date is the latest closure in the user's list.
    // If no closures, fall back to "Re-run hours quarterly".
    var now = new Date();
    var dateLocale = locale === 'es' ? 'es-US' : 'en-US';
    var printed = now.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
    var printedLabel = (strings.signPrintedPrefix || 'Printed') + ' ' + printed;
    if (!closures || !closures.length) {
      return printedLabel + ' · ' + (strings.signRerunFallback || 'Re-run hours quarterly');
    }
    var latest = closures.slice().sort(function(a, b){
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    })[0];
    if (!latest || !latest.date) return printedLabel;
    var p = String(latest.date).split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    var lastClosure = d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    return printedLabel + ' · ' + (strings.signReprintAfter || 'Reprint after') + ' ' + lastClosure;
  }

  function drawTrackedText(ctx, text, cx, y, tracking) {
    // Hand-rolled letter-spacing for the eyebrow + footer credit.
    // Ample tracking turns the tiny line into a typographic accent.
    if (!text) return;
    ctx.textAlign = 'left';
    var chars = text.split('');
    var widths = chars.map(function(c){ return ctx.measureText(c).width + tracking; });
    var total = widths.reduce(function(a, b){ return a + b; }, 0) - tracking;
    var x = cx - total / 2;
    chars.forEach(function(c, i){
      ctx.fillText(c, x, y);
      x += widths[i];
    });
  }
  function capitalize(s) {
    return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
  }

  // ------------------------------------------------------------
  // Open Hours Card — companion shareable image
  //   header (120) + body (1140) + footer (60)
  //   body split:
  //     top-left  (560×560)  — weekly grid
  //     top-right (560×560)  — upcoming closures
  //     bottom-left (560×580) — JSON-LD code block
  //     bottom-right (560×580) — cross-platform copy blocks
  // ------------------------------------------------------------
  function renderOpenHoursCard(opts) {
    opts = opts || {};
    var summary = opts.summary || { week: {}, name: '', city: '' };
    var closures = opts.closures || [];
    var googleCopy = opts.googleCopy || '';
    var strings = opts.strings || DEFAULT_STRINGS_EN;
    var locale = opts.locale || 'en';
    var formatTime = opts.formatTime || function(t){ return t || ''; };

    var canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = CREAM2;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Header
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, CARD_W, 120);
    ctx.fillStyle = CREAM;
    ctx.font = '600 30px ' + FONT_DISPLAY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardTitle, 48, 50);
    ctx.fillStyle = 'rgba(250,247,242,0.72)';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.fillText(summary.name || '—', 48, 86);
    ctx.fillStyle = 'rgba(250,247,242,0.72)';
    ctx.textAlign = 'right';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.fillText(strings.date, CARD_W - 48, 86);
    ctx.fillStyle = CREAM;
    ctx.font = '500 13px ' + FONT_BODY;
    ctx.fillText(strings.brand, CARD_W - 48, 50);

    // Body — 4-pane muntin window. Phase D6: the four panes are
    // separated by 3-px ink crossbars that read as muntins, and the
    // brand mark sits at the intersection. Same visual signature
    // Menu Engineering's matrix uses (commit b484d25), making the
    // family resemblance unmistakable.
    var bodyTop = 150;
    var bodyBot = CARD_H - 60;
    var bodyL = 40;
    var bodyR = CARD_W - 40;
    var bodyMidX = (bodyL + bodyR) / 2;
    var bodyMidY = (bodyTop + bodyBot) / 2;
    var paneInset = 22; // padding inside each pane

    // Outer frame
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, bodyL, bodyTop, bodyR - bodyL, bodyBot - bodyTop, 10); ctx.fill();

    // Top-left — weekly grid
    drawWeekPanel(ctx, summary,
      bodyL + paneInset, bodyTop + paneInset,
      bodyMidX - bodyL - paneInset * 1.2, bodyMidY - bodyTop - paneInset * 1.2,
      strings, locale, formatTime);
    // Top-right — closures
    drawClosuresPanel(ctx, closures,
      bodyMidX + paneInset * 1.2, bodyTop + paneInset,
      bodyR - bodyMidX - paneInset * 1.2, bodyMidY - bodyTop - paneInset * 1.2,
      strings, locale);
    // Bottom-left — Today panel
    drawTodayPanel(ctx, summary, closures,
      bodyL + paneInset, bodyMidY + paneInset * 1.2,
      bodyMidX - bodyL - paneInset * 1.2, bodyBot - bodyMidY - paneInset * 1.2,
      strings, locale, formatTime);
    // Bottom-right — Google paste block
    drawGooglePanel(ctx, googleCopy,
      bodyMidX + paneInset * 1.2, bodyMidY + paneInset * 1.2,
      bodyR - bodyMidX - paneInset * 1.2, bodyBot - bodyMidY - paneInset * 1.2,
      strings.cardGoogleLabel);

    // Muntin crossbars — 3px ink, drawn after the panels so they sit
    // on top. Vertical bar, then horizontal bar.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bodyMidX, bodyTop);
    ctx.lineTo(bodyMidX, bodyBot);
    ctx.moveTo(bodyL, bodyMidY);
    ctx.lineTo(bodyR, bodyMidY);
    ctx.stroke();

    // Outer frame stroke
    ctx.lineWidth = 3;
    roundRect(ctx, bodyL + 0.5, bodyTop + 0.5, bodyR - bodyL - 1, bodyBot - bodyTop - 1, 10);
    ctx.stroke();

    // Brand mark at the muntin intersection — cream halo so panel
    // content can't bleed through, then the window-and-muntin glyph
    // in the brand teal. Same construction as Menu Engineering.
    var markSize = 56;
    var haloR = markSize / 2 + 12;
    ctx.fillStyle = CREAM2;
    ctx.beginPath();
    ctx.arc(bodyMidX, bodyMidY, haloR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    roundRect(ctx, bodyMidX - markSize / 2, bodyMidY - markSize / 2, markSize, markSize, 6);
    ctx.fill();
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 4;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    var inset = 14;
    ctx.beginPath();
    ctx.rect(bodyMidX - markSize / 2 + inset, bodyMidY - markSize / 2 + inset,
             markSize - inset * 2, markSize - inset * 2);
    ctx.moveTo(bodyMidX, bodyMidY - markSize / 2 + inset);
    ctx.lineTo(bodyMidX, bodyMidY + markSize / 2 - inset);
    ctx.moveTo(bodyMidX - markSize / 2 + inset, bodyMidY - 4);
    ctx.lineTo(bodyMidX + markSize / 2 - inset, bodyMidY - 4);
    ctx.stroke();

    // Unified footer treatment across all five Cards: ink ground,
    // single recessive cream-on-ink line at 60% opacity. 48 px keep-out
    // from each edge.
    ctx.fillStyle = INK;
    ctx.fillRect(0, CARD_H - 60, CARD_W, 60);
    ctx.fillStyle = 'rgba(250,247,242,0.6)';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardFooterLeft, 48, CARD_H - 30);
    ctx.textAlign = 'right';
    ctx.fillText(strings.cardFooterRight, CARD_W - 48, CARD_H - 30);

    return canvas;
  }

  function drawTodayPanel(ctx, summary, closures, x, y, w, h, strings, locale, formatTime) {
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardTodayLabel || 'Today', x, y);

    // Compute Open / Closed status
    var now = new Date();
    var jsDay = now.getDay();
    var dayIdx = (jsDay + 6) % 7;
    var DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var DAYS_FULL = locale === 'es'
      ? ['lunes','martes','miércoles','jueves','viernes','sábado','domingo']
      : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    var nowMin = now.getHours() * 60 + now.getMinutes();
    function tm(hhmm){
      if (typeof hhmm !== 'string') return null;
      var m = /^(\d{2}):(\d{2})$/.exec(hhmm); if (!m) return null;
      return parseInt(m[1],10)*60 + parseInt(m[2],10);
    }
    // Today closed by special-hours? (derived from closures list)
    var todayIso = now.getFullYear() + '-' +
                   ('0'+(now.getMonth()+1)).slice(-2) + '-' +
                   ('0'+now.getDate()).slice(-2);
    var isHolidayClosed = (closures || []).some(function(c){ return c && c.date === todayIso; });

    var status = 'closed';
    var detail = '';
    if (isHolidayClosed) {
      detail = (locale === 'es' ? 'Hoy: cerrado por feriado' : 'Today: closed for holiday');
    } else {
      var prev = (summary.week && summary.week[DAYS[(dayIdx + 6) % 7]]) || [];
      for (var i = 0; i < prev.length; i++) {
        if (prev[i].closesNextDay) {
          var pc = tm(prev[i].closes);
          if (pc != null && nowMin < pc) {
            status = 'open';
            detail = (locale === 'es' ? 'Cierra ' : 'Closes ') + formatTime(prev[i].closes, locale);
            break;
          }
        }
      }
      if (status === 'closed') {
        var todays = ((summary.week && summary.week[DAYS[dayIdx]]) || []).slice().sort(function(a,b){
          return tm(a.opens) - tm(b.opens);
        });
        for (var j = 0; j < todays.length; j++) {
          var s = todays[j];
          var so = tm(s.opens), sc = tm(s.closes);
          if (so == null || sc == null) continue;
          var eff = sc + (s.closesNextDay ? 1440 : 0);
          if (nowMin >= so && nowMin < eff) {
            status = 'open';
            detail = (locale === 'es' ? 'Cierra ' : 'Closes ') + formatTime(s.closes, locale) +
                     (s.closesNextDay ? (locale === 'es' ? ' (sig. día)' : ' (next day)') : '');
            break;
          }
          if (nowMin < so) {
            detail = (locale === 'es' ? 'Abre ' : 'Opens ') + formatTime(s.opens, locale);
            break;
          }
        }
        if (!detail) {
          for (var d = 1; d <= 7; d++) {
            var ns = ((summary.week && summary.week[DAYS[(dayIdx + d) % 7]]) || [])[0];
            if (ns) {
              detail = (locale === 'es' ? 'Abre ' : 'Opens ') +
                       DAYS_FULL[(dayIdx + d) % 7].slice(0, 3) + ' ' +
                       formatTime(ns.opens, locale);
              break;
            }
          }
        }
      }
    }

    // Status pill
    var pillY = y + 44;
    ctx.fillStyle = status === 'open' ? '#1F7A33' : (isHolidayClosed ? '#B8541A' : STONE);
    ctx.font = '600 32px ' + FONT_DISPLAY;
    ctx.textAlign = 'left';
    ctx.fillText(status === 'open'
      ? (locale === 'es' ? 'Abierto ahora' : 'Open now')
      : (locale === 'es' ? 'Cerrado' : 'Closed'),
      x, pillY);

    if (detail) {
      ctx.fillStyle = INK;
      ctx.font = '500 16px ' + FONT_BODY;
      ctx.fillText(detail, x, pillY + 36);
    }

    // Today's day label + full hours
    var tStr = (locale === 'es' ? 'Horario hoy' : 'Today\'s hours') + ' (' + DAYS_FULL[dayIdx] + ')';
    ctx.fillStyle = STONE;
    ctx.font = '600 11px ' + FONT_BODY;
    ctx.fillText(tStr.toUpperCase(), x, pillY + 76);
    var todayServices = (summary.week && summary.week[DAYS[dayIdx]]) || [];
    var todayLabel = !todayServices.length
      ? (locale === 'es' ? 'cerrado' : 'closed')
      : todayServices.map(function(s){
          return formatTime(s.opens, locale) + ' – ' + formatTime(s.closes, locale);
        }).join('  ·  ');
    ctx.fillStyle = INK;
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.fillText(todayLabel, x, pillY + 96);
  }

  function drawCardPanel(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill || '#FFFFFF';
    roundRect(ctx, x, y, w, h, 8); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 8); ctx.stroke();
  }

  function drawWeekPanel(ctx, summary, x, y, w, h, strings, locale, formatTime) {
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardWeekLabel, x, y);
    var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var DAY_FULL_LOCAL = locale === 'es'
      ? ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var rowH = (h - 36) / 7;
    var ry = y + 36;
    DAYS.forEach(function(d, idx){
      var yy = ry + idx * rowH;
      ctx.fillStyle = INK;
      ctx.font = '500 14px ' + FONT_BODY;
      ctx.textAlign = 'left';
      ctx.fillText(capitalize(DAY_FULL_LOCAL[idx]), x, yy);
      var services = (summary.week && summary.week[d]) || [];
      var label = !services.length ? strings.signClosed
        : services.map(function(s){ return formatTime(s.opens, locale) + ' – ' + formatTime(s.closes, locale); }).join(' · ');
      ctx.fillStyle = services.length ? INK : STONE;
      ctx.font = '500 13px ' + FONT_BODY;
      ctx.textAlign = 'right';
      ctx.fillText(label, x + w, yy);
    });
  }

  function drawClosuresPanel(ctx, closures, x, y, w, h, strings, locale) {
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardClosuresLabel, x, y);
    var list = (closures || []).slice(0, 12);
    if (!list.length) {
      ctx.fillStyle = STONE;
      ctx.font = 'italic 13px ' + FONT_BODY;
      ctx.fillText(strings.cardClosuresEmpty, x, y + 36);
      return;
    }
    list.forEach(function(c, i){
      var yy = y + 36 + i * 30;
      ctx.fillStyle = INK;
      ctx.font = '500 13px ' + FONT_BODY;
      ctx.textAlign = 'left';
      ctx.fillText(fmtHolidayShort(c.date, locale), x, yy);
      ctx.fillStyle = STONE;
      ctx.font = '400 13px ' + FONT_BODY;
      ctx.fillText(c.name || '', x + 90, yy);
    });
  }

  function drawCodePanel(ctx, code, x, y, w, h, label) {
    ctx.fillStyle = CREAM;
    ctx.font = '600 11px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(String(label || '').toUpperCase(), x, y);
    var lines = String(code || '').split('\n').slice(0, 22);
    ctx.fillStyle = '#A8DCE0';
    ctx.font = '400 10px ui-monospace, SFMono-Regular, Consolas, monospace';
    lines.forEach(function(line, i){
      // Truncate long lines.
      var l = line.length > 78 ? line.slice(0, 76) + '…' : line;
      ctx.fillText(l, x, y + 24 + i * 14);
    });
  }

  function drawGooglePanel(ctx, copy, x, y, w, h, label) {
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y);
    var lines = String(copy || '').split('\n').slice(0, 8);
    ctx.fillStyle = INK;
    ctx.font = '400 12.5px ui-monospace, SFMono-Regular, Consolas, monospace';
    lines.forEach(function(line, i){
      ctx.fillText(line, x, y + 36 + i * 22);
    });
  }

  // ------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------
  function canvasToPngBlob(canvas) {
    return new Promise(function(resolve, reject){
      try {
        canvas.toBlob(function(blob){
          if (blob) resolve(blob); else reject(new Error('toBlob-null'));
        }, 'image/png');
      } catch (e) { reject(e); }
    });
  }

  // Resolve when the page's web fonts (Fraunces, Inter) are ready, so
  // the Sign / Card paint with their proper display face. No-op in
  // environments without document.fonts (jsdom, older browsers).
  function awaitFonts() {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.ready) {
      return Promise.resolve();
    }
    return document.fonts.ready;
  }

  // ------------------------------------------------------------
  // Default copy strings
  // ------------------------------------------------------------
  var DEFAULT_STRINGS_EN = {
    placeholderName: 'Your Restaurant',
    signEyebrow: 'Open Hours',
    signWeeklyHeader: 'Weekly hours',
    signClosed: 'Closed',
    signClosuresHeader: 'Upcoming closures',
    signFooterPrefix: 'Always-current hours at',
    signFooterCredit: 'Generated by Muntin · Open Hours · muntin.digital',
    signPrintedPrefix: 'Printed',
    signReprintAfter: 'Reprint after',
    signRerunFallback: 'Re-run hours quarterly',
    cardTitle: 'Open Hours',
    cardWeekLabel: 'Weekly schedule',
    cardClosuresLabel: 'Upcoming closures',
    cardClosuresEmpty: 'No closures selected.',
    cardTodayLabel: 'Today',
    cardGoogleLabel: 'For Google Business Profile',
    date: new Date().toISOString().slice(0, 10),
    brand: 'Muntin Digital',
    cardFooterLeft: 'Generated by Muntin · Open Hours · muntin.digital',
    cardFooterRight: new Date().toISOString().slice(0, 10)
  };

  var DEFAULT_STRINGS_ES = {
    placeholderName: 'Tu Restaurante',
    signEyebrow: 'Horario Abierto',
    signWeeklyHeader: 'Horario semanal',
    signClosed: 'Cerrado',
    signClosuresHeader: 'Próximos cierres',
    signFooterPrefix: 'Horario actualizado en',
    signFooterCredit: 'Generado por Muntin · Horario Abierto · muntin.digital',
    signPrintedPrefix: 'Impreso el',
    signReprintAfter: 'Reimprimir después del',
    signRerunFallback: 'Vuelve a correr el horario trimestralmente',
    cardTitle: 'Horario Abierto',
    cardWeekLabel: 'Horario semanal',
    cardClosuresLabel: 'Próximos cierres',
    cardClosuresEmpty: 'Sin cierres seleccionados.',
    cardTodayLabel: 'Hoy',
    cardGoogleLabel: 'Para Google Business Profile',
    date: new Date().toISOString().slice(0, 10),
    brand: 'Muntin Digital',
    cardFooterLeft: 'Generado por Muntin · Horario Abierto · muntin.digital',
    cardFooterRight: new Date().toISOString().slice(0, 10)
  };

  var api = {
    renderStorefrontSign: renderStorefrontSign,
    renderOpenHoursCard:  renderOpenHoursCard,
    canvasToPngBlob:      canvasToPngBlob,
    awaitFonts:           awaitFonts,
    DEFAULT_STRINGS_EN:   DEFAULT_STRINGS_EN,
    DEFAULT_STRINGS_ES:   DEFAULT_STRINGS_ES,
    SIGN_W: SIGN_W, SIGN_H: SIGN_H,
    CARD_W: CARD_W, CARD_H: CARD_H
  };

  if (typeof window !== 'undefined') window.OHSign = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
