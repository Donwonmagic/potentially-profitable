/**
 * Open Hours — restaurant-hours rules engine + cross-platform generators.
 *
 * Loaded as a classic script in ./index.html (EN + ES). Also Node-
 * importable for unit tests via scripts/test-open-hours.mjs.
 * Dual-export pattern matches brand-suite.js, margin-math.js,
 * menu-engineering.js, menu-copy.js.
 *
 * The tool's audience is a restaurant owner who may have no
 * technical background. The math is rules-based and conservative;
 * the generators emit exact strings the owner pastes into Google,
 * Yelp, Apple Maps, or sends to a website builder. Schema.org
 * compliance is real but never named in the surface UI.
 *
 * Privacy invariants (tested in scripts/test-open-hours.mjs):
 *   1. Every exported function is pure — no fetch, no localStorage,
 *      no cookies, no side effects beyond attaching to window.OH.
 *   2. Bucket helpers (ohBucketWeeklyOpenDays, ohBucketServiceTiers,
 *      ohBucketClosureCount) return values only from fixed enums.
 *      No restaurant name, address, or specific time ever leaks.
 */

// ------------------------------------------------------------
// Time + day helpers
//
// All internal times are stored as 24-hour "HH:MM" strings. Past-
// midnight closes use the conventional "next day" flag rather than
// 25:00-style hours so the data model stays Schema.org-friendly
// (Schema accepts a close-time on the FOLLOWING day; the JSON-LD
// generator handles the wrap).
// ------------------------------------------------------------

var OH_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var OH_DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
var OH_DAYS_FULL_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

function ohPad2(n) { return (n < 10 ? '0' : '') + n; }

function ohParseTime(s) {
  // Accepts "9:00", "9:00 AM", "21:00", "9 pm". Returns "HH:MM" 24h
  // or null. Strict-ish: rejects "25:00" and other obviously broken.
  if (s == null) return null;
  var raw = String(s).trim().toLowerCase();
  if (!raw) return null;
  // Detect am/pm whether or not there's a space ("9pm", "9 pm",
  // "9 PM", "9p.m." all valid). \b doesn't work because a digit is
  // a word char; use a simpler trailing-suffix match.
  var ampm = null;
  var amRe = /(am|a\.m\.)\s*$/;
  var pmRe = /(pm|p\.m\.)\s*$/;
  if (pmRe.test(raw)) ampm = 'pm';
  else if (amRe.test(raw)) ampm = 'am';
  raw = raw.replace(/(am|pm|a\.m\.|p\.m\.)\s*$/g, '').trim();
  var m = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(raw);
  if (!m) return null;
  var h = parseInt(m[1], 10);
  var min = m[2] ? parseInt(m[2], 10) : 0;
  if (!isFinite(h) || !isFinite(min) || min < 0 || min > 59) return null;
  if (ampm === 'am') {
    if (h === 12) h = 0;
    else if (h < 0 || h > 12) return null;
  } else if (ampm === 'pm') {
    if (h === 12) {/* noop */}
    else if (h >= 1 && h <= 11) h += 12;
    else return null;
  } else {
    if (h < 0 || h > 23) return null;
  }
  return ohPad2(h) + ':' + ohPad2(min);
}

function ohTimeToMinutes(hhmm) {
  // "HH:MM" → minutes since midnight. Returns null on bad input.
  if (typeof hhmm !== 'string') return null;
  var m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  var h = parseInt(m[1], 10), min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function ohMinutesToTime(min) {
  // Inverse of ohTimeToMinutes. Wraps modulo 24h.
  var v = ((min % 1440) + 1440) % 1440;
  return ohPad2(Math.floor(v / 60)) + ':' + ohPad2(v % 60);
}

// Display formatting for the user-facing UI + printable Sign.
// Drops :00 minute tail when zero in BOTH locales (so the UI reads
// "9 PM" / "21h" instead of "9:00 PM" / "21:00"). Locale-aware:
//   EN → 12-hour with AM/PM ("9 PM", "9:30 PM")
//   ES → 24-hour with the Spanish "h" suffix ("21h", "21:30")
// Pre-T1e ES returned the raw "HH:MM" — uneven against EN, and the
// audit flagged the inconsistency as a polish issue (an owner who
// switches locales sees the layout shift). Now both locales drop :00
// when zero and read uniformly.
function ohFormatTime(hhmm, locale) {
  if (typeof hhmm !== 'string') return '';
  var min = ohTimeToMinutes(hhmm);
  if (min == null) return '';
  var h = Math.floor(min / 60), m = min % 60;
  if (locale === 'es') {
    // 24-hour with "h" suffix — common Spanish-language convention.
    // Drop minutes when zero ("21h" instead of "21:00").
    return m === 0 ? (h + 'h') : (ohPad2(h) + ':' + ohPad2(m));
  }
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  return h12 + (m === 0 ? '' : ':' + ohPad2(m)) + ' ' + ampm;
}

// ------------------------------------------------------------
// Input normalization
//
// The page's week-grid lets the owner enter up to 3 service rows
// per day (Brunch / Lunch / Dinner by default; renameable). Each
// row has {label, opens, closes, closesNextDay}. Closed = empty
// rows. ohNormalizeWeek accepts whatever shape the UI passes and
// returns a clean 7-day structure where every day is an array of
// validated services. Bad or empty rows are dropped silently —
// validateHours surfaces user-facing warnings.
// ------------------------------------------------------------

function ohNormalizeService(raw) {
  var label = (raw && raw.label) ? String(raw.label).trim() : '';
  var opens = ohParseTime(raw && raw.opens);
  var closes = ohParseTime(raw && raw.closes);
  var nextDay = !!(raw && raw.closesNextDay);
  if (!opens || !closes) return null;
  return { label: label, opens: opens, closes: closes, closesNextDay: nextDay };
}

function ohNormalizeWeek(raw) {
  // Accepts either { Mon: [...], Tue: [...] } or
  //                 { mon: [...], tuesday: [...] } (case-insensitive).
  // Returns an object keyed by canonical OH_DAYS abbreviations.
  var out = {};
  OH_DAYS.forEach(function(d){ out[d] = []; });
  if (!raw || typeof raw !== 'object') return out;
  Object.keys(raw).forEach(function(key){
    var lower = String(key).slice(0, 3).toLowerCase();
    var canon = OH_DAYS.find(function(d){ return d.toLowerCase() === lower; });
    if (!canon) return;
    var rows = raw[key];
    if (!Array.isArray(rows)) return;
    out[canon] = rows.map(ohNormalizeService).filter(Boolean);
  });
  return out;
}

// ------------------------------------------------------------
// Validation
//
// Returns { warnings: [{day, message}], allClear: bool }.
// Each warning is a one-sentence plain-English string the UI
// surfaces inline. The owner sees the *consequence*, not the rule.
// ------------------------------------------------------------

function ohValidateDay(day, services) {
  var warnings = [];
  if (!services || !services.length) return warnings;

  // Sort by opens for overlap detection.
  var sorted = services.slice().sort(function(a, b){
    return ohTimeToMinutes(a.opens) - ohTimeToMinutes(b.opens);
  });

  for (var i = 0; i < sorted.length; i++) {
    var s = sorted[i];
    var openMin = ohTimeToMinutes(s.opens);
    var closeMin = ohTimeToMinutes(s.closes);
    if (openMin == null || closeMin == null) continue;
    var effectiveClose = closeMin + (s.closesNextDay ? 1440 : 0);

    // Same open + close → likely a typo.
    if (effectiveClose === openMin) {
      warnings.push({ day: day, message: 'On ' + day + ', "' + (s.label || 'service') + '" opens and closes at the same time. Did you mean to enter different times?' });
      continue;
    }

    // Close before open without next-day flag.
    // Two common owner intents — disambiguate by the close-time shape:
    //   (a) Bare-number close in 1..11 range typed without AM/PM →
    //       most likely a PM time the parser read as 24h. e.g.
    //       "opens 9, closes 5" → really 9 AM – 5 PM. Suggest the
    //       12-hour interpretation explicitly.
    //   (b) Close reads as a real morning time (or PM-but-shorter
    //       than open) → suggest the after-midnight flag.
    if (effectiveClose < openMin) {
      var closeH = Math.floor(closeMin / 60);
      var pmHint = '';
      if (closeH >= 1 && closeH <= 11) {
        var pmGuess = ohFormatTime(ohPad2(closeH + 12) + ':' + ohPad2(closeMin % 60));
        pmHint = ' Did you mean ' + pmGuess + '?';
      }
      warnings.push({
        day: day,
        message: 'On ' + day + ', "' + (s.label || 'service') +
                 '" closes (' + ohFormatTime(s.closes) +
                 ') before it opens (' + ohFormatTime(s.opens) + ').' + pmHint +
                 ' If you meant to close after midnight, check the "closes next day" box.'
      });
      continue;
    }

    // AM/PM mistake heuristic (Phase A3 rewrite). Catches the typo
    // pattern "opens 9, closes 11" where the user meant "9 AM – 11
    // PM": both times parse as morning AND the gap is suspiciously
    // short. The close-before-open check above already catches the
    // commoner "11 – 5" → 11:00-05:00 typo. Constraint: BOTH bounds
    // strictly before noon, gap ≤ 4 hours, not next-day. Brunch
    // services that close in the afternoon (11:00–15:00) don't fire.
    if (!s.closesNextDay && openMin < 12 * 60 && closeMin < 12 * 60 &&
        closeMin > openMin && (closeMin - openMin) <= 4 * 60) {
      warnings.push({
        day: day,
        message: 'On ' + day + ', "' + (s.label || 'service') +
                 '" runs only ' + Math.round((closeMin - openMin) / 60) +
                 ' hour' + ((closeMin - openMin) === 60 ? '' : 's') +
                 ' (' + ohFormatTime(s.opens) + ' to ' + ohFormatTime(s.closes) +
                 '). Did you mean PM for the close?'
      });
    }

    // Overlap with the next service.
    if (i + 1 < sorted.length) {
      var next = sorted[i + 1];
      var nextOpenMin = ohTimeToMinutes(next.opens);
      if (nextOpenMin != null && effectiveClose > nextOpenMin) {
        warnings.push({ day: day, message: 'On ' + day + ', "' + (s.label || 'service') + '" overlaps with "' + (next.label || 'next service') + '". Adjust one so they don\'t conflict.' });
      }
    }
  }
  return warnings;
}

function ohValidateHours(input) {
  // Input shape: { week: {Mon: [...], ...}, name: "...", city: "..." }
  // Returns: { week, warnings, summary, allClear }
  var week = ohNormalizeWeek(input && input.week);
  var allWarnings = [];
  OH_DAYS.forEach(function(d){
    allWarnings = allWarnings.concat(ohValidateDay(d, week[d]));
  });

  // Compose an aggregate summary the UI uses for the action checklist.
  var openDays = OH_DAYS.filter(function(d){ return (week[d] || []).length > 0; }).length;
  var hasMultiService = OH_DAYS.some(function(d){ return (week[d] || []).length > 1; });
  var summary = {
    openDaysCount: openDays,
    closedDaysCount: 7 - openDays,
    hasMultiService: hasMultiService,
    warningCount: allWarnings.length
  };

  return {
    week: week,
    warnings: allWarnings,
    summary: summary,
    allClear: openDays > 0 && allWarnings.length === 0,
    name:       String((input && input.name) || ''),
    city:       String((input && input.city) || ''),
    street:     String((input && input.street) || ''),
    region:     String((input && input.region) || ''),
    postalCode: String((input && input.postalCode) || '')
  };
}

// ------------------------------------------------------------
// JSON-LD generator
//
// Emits Schema.org "Restaurant" with embedded
// OpeningHoursSpecification entries — what Google reads to display
// hours in search results. Validates against
// schema.org/OpeningHoursSpecification minimums (dayOfWeek as full
// names, opens/closes as 24h "HH:MM"). Compresses identical hours
// into shared dayOfWeek arrays so a 7-day-same-hours restaurant
// renders one OHS, not seven.
// ------------------------------------------------------------

function ohNextDayName(dayFullName) {
  // Used by the closesNextDay defensive emit (Phase B2): when a
  // service crosses midnight we emit two consecutive intervals, the
  // second on the next day. Wraps Sunday → Monday.
  var idx = OH_DAYS_FULL.indexOf(dayFullName);
  if (idx < 0) return dayFullName;
  return OH_DAYS_FULL[(idx + 1) % 7];
}

function ohGenerateJsonLd(input, options) {
  options = options || {};
  var v = ohValidateHours(input);
  var entries = [];

  // Group days that have identical service-row signatures.
  var sigToDays = {};
  OH_DAYS.forEach(function(d, idx){
    var services = v.week[d] || [];
    if (!services.length) return;
    var sig = services.map(function(s){
      return s.opens + '-' + s.closes + (s.closesNextDay ? 'n' : '');
    }).join('|');
    if (!sigToDays[sig]) sigToDays[sig] = { services: services, days: [] };
    sigToDays[sig].days.push(OH_DAYS_FULL[idx]);
  });

  Object.keys(sigToDays).forEach(function(sig){
    var group = sigToDays[sig];
    group.services.forEach(function(s){
      if (s.closesNextDay && s.closes !== '00:00') {
        // Phase B2: emit two consecutive intervals so Google's parser
        // never has to interpret a close-before-open. Same day:
        // opens → 23:59. Next day: 00:00 → closes.
        group.days.forEach(function(dayName){
          entries.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: dayName,
            opens: s.opens,
            closes: '23:59'
          });
          entries.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ohNextDayName(dayName),
            opens: '00:00',
            closes: s.closes
          });
        });
      } else {
        // Same-day close. Single entry covers all days in the group.
        entries.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: group.days.length === 1 ? group.days[0] : group.days.slice(),
          opens: s.opens,
          closes: s.closes === '00:00' && s.closesNextDay ? '23:59' : s.closes
        });
      }
    });
  });

  // Phase B1 — full PostalAddress. Emit only the keys that are non-empty
  // so a single-city user still gets a valid (if minimal) address block.
  var addr = null;
  if (v.city || v.street || v.region || v.postalCode) {
    addr = { '@type': 'PostalAddress' };
    if (v.street)     addr.streetAddress   = v.street;
    if (v.city)       addr.addressLocality = v.city;
    if (v.region)     addr.addressRegion   = v.region;
    if (v.postalCode) addr.postalCode      = v.postalCode;
  }

  var doc = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: v.name || undefined,
    address: addr || undefined,
    openingHoursSpecification: entries
  };

  // Phase A2 — SpecialOpeningHoursSpecification for picked closures.
  // Each closure is a fully-closed day: opens=closes=00:00 between
  // validFrom and validThrough (same date). Without this Google keeps
  // showing standard hours on Thanksgiving until a customer reports it.
  var closures = (input && Array.isArray(input.closures)) ? input.closures : [];
  if (closures.length) {
    doc.specialOpeningHoursSpecification = closures
      .filter(function(c){ return c && c.date; })
      .map(function(c){
        return {
          '@type': 'OpeningHoursSpecification',
          validFrom:    c.date,
          validThrough: c.date,
          opens:  '00:00',
          closes: '00:00'
        };
      });
  }

  // Strip undefined keys for clean output.
  Object.keys(doc).forEach(function(k){ if (doc[k] === undefined) delete doc[k]; });

  if (options.format === 'object') return doc;
  // Default: pretty-printed string ready to drop into a <script>.
  return JSON.stringify(doc, null, 2);
}

// Wraps the JSON-LD in the actual <script> tag a website builder
// pastes into the page <head>. The owner forwards this exact block.
function ohGenerateJsonLdScript(input) {
  var json = ohGenerateJsonLd(input);
  return '<script type="application/ld+json">\n' + json + '\n</script>';
}

// ------------------------------------------------------------
// Cross-platform copy generators
//
// Each platform has a different conventional format for hours.
// Owners paste these strings directly into the platform's hours
// field. Format strings tested against the actual Google /
// Yelp / Apple-Maps "Edit hours" UI as of 2026.
// ------------------------------------------------------------

function ohFormatServicesForDay(services, locale, sep) {
  if (!services.length) return locale === 'es' ? 'cerrado' : 'closed';
  return services.map(function(s){
    var open = ohFormatTime(s.opens, locale);
    var close = ohFormatTime(s.closes, locale);
    var nextDay = s.closesNextDay ? (locale === 'es' ? ' (siguiente día)' : ' (next day)') : '';
    return open + (sep || ' – ') + close + nextDay;
  }).join(', ');
}

function ohGeneratePlatformCopy(input, platform, locale) {
  var v = ohValidateHours(input);
  locale = locale || 'en';
  var lines = [];
  var dayLabels = locale === 'es' ? OH_DAYS_FULL_ES : OH_DAYS_FULL;

  switch (platform) {
    case 'google':
      // Google Business Profile: "Monday: 11 AM – 9 PM"
      OH_DAYS.forEach(function(d, idx){
        var name = dayLabels[idx].charAt(0).toUpperCase() + dayLabels[idx].slice(1);
        var label = name + ': ' + ohFormatServicesForDay(v.week[d], locale, ' – ');
        lines.push(label);
      });
      break;
    case 'yelp':
      // Yelp: "Mon 11:00 am - 9:00 pm" with abbreviated days.
      var yelpDays = locale === 'es'
        ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      OH_DAYS.forEach(function(d, idx){
        var label = yelpDays[idx] + ' ' + ohFormatServicesForDay(v.week[d], locale, ' - ');
        lines.push(label);
      });
      break;
    case 'apple':
      // Apple Maps: identical to Google's format in casual usage.
      OH_DAYS.forEach(function(d, idx){
        var name = dayLabels[idx].charAt(0).toUpperCase() + dayLabels[idx].slice(1);
        var label = name + ': ' + ohFormatServicesForDay(v.week[d], locale, '–');
        lines.push(label);
      });
      break;
    case 'plain':
    default:
      OH_DAYS.forEach(function(d, idx){
        var name = dayLabels[idx].charAt(0).toUpperCase() + dayLabels[idx].slice(1);
        lines.push(name + ': ' + ohFormatServicesForDay(v.week[d], locale, ' – '));
      });
  }
  return lines.join('\n');
}

// One-sentence email template the owner can copy verbatim and send
// to whoever built their site. Locale-aware.
function ohGenerateBuilderEmail(input, locale) {
  var v = ohValidateHours(input);
  if (locale === 'es') {
    return 'Hola — ¿podrías pegar este bloque dentro del <head> de nuestro sitio web? Es nuestro horario en un formato que Google entiende. Gracias — ' + (v.name || '[tu nombre]');
  }
  return "Hi — could you paste this block into the <head> of our website? It's our hours in a format Google understands. Thanks — " + (v.name || '[your name]');
}

// ------------------------------------------------------------
// ICS calendar generator (Phase 2 — stub for now)
//
// Phase 1 ships the function signature so the dual-export contract
// is locked, but the holiday-closures input shape is finalized in
// Phase 2 along with the holiday-picker UI. v1 returns an empty
// VCALENDAR envelope; v2 wraps each closure in a VEVENT.
// ------------------------------------------------------------

function ohIcsAddDays(yyyymmdd, days) {
  // Returns "YYYYMMDD" + N days. Uses UTC to dodge local-tz off-by-one.
  var y = parseInt(yyyymmdd.slice(0, 4), 10);
  var m = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
  var d = parseInt(yyyymmdd.slice(6, 8), 10);
  var dt = new Date(Date.UTC(y, m, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  var p2 = function(n){ return (n < 10 ? '0' : '') + n; };
  return dt.getUTCFullYear() + p2(dt.getUTCMonth() + 1) + p2(dt.getUTCDate());
}

function ohIcsEscape(s) {
  // RFC 5545 text-value escaping.
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function ohGenerateIcs(closures, options) {
  // Builds a VCALENDAR with one all-day VEVENT per closure. RFC 5545
  // requires DTEND be exclusive for all-day events, so DTEND = DTSTART+1
  // (without this, some clients drop the event entirely). Each VEVENT
  // carries a VALARM that fires the morning before — that's the
  // "you'll get a reminder the morning before" promise on the page.
  options = options || {};
  var locale = options.locale === 'es' ? 'es' : 'en';
  var alarmMsg = locale === 'es' ? 'Cerrado mañana' : 'Closed tomorrow';
  var summaryPrefix = locale === 'es' ? 'Cerrado — ' : 'Closed — ';
  var lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Muntin Digital//Open Hours//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');

  (closures || []).forEach(function(c, i){
    if (!c || !c.date) return;
    // c.date: 'YYYY-MM-DD'
    var d = String(c.date).replace(/-/g, '');
    if (d.length !== 8) return;
    var dEnd = ohIcsAddDays(d, 1);
    var name = ohIcsEscape(c.name || (locale === 'es' ? 'Cerrado' : 'Closed'));
    var uid = (options.prefix || 'oh') + '-' + d + '-' + i + '@muntin.digital';
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('DTSTAMP:' + d + 'T000000Z');
    lines.push('DTSTART;VALUE=DATE:' + d);
    lines.push('DTEND;VALUE=DATE:' + dEnd);
    lines.push('SUMMARY:' + summaryPrefix + name);
    lines.push('TRANSP:TRANSPARENT');
    // Day-before display alarm — fires at 9 AM the prior day in the
    // user's local TZ (calendar clients expand the relative trigger).
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-P1D');
    lines.push('ACTION:DISPLAY');
    lines.push('DESCRIPTION:' + alarmMsg + ' — ' + name);
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  // RFC 5545 requires CRLF line endings.
  return lines.join('\r\n') + '\r\n';
}

function ohGenerateQuarterlyIcs(scenarioUrl, options) {
  // Phase D — Quarterly Drift Check-in. 8 occurrences over 2 years
  // (RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=8). DTSTART = today + 90 days.
  // The URL field carries the rehydration link so clicking the calendar
  // reminder reopens Open Hours with the saved scenario.
  options = options || {};
  var locale = options.locale === 'es' ? 'es' : 'en';
  var url = String(scenarioUrl || '');
  var summary = locale === 'es'
    ? 'Horario Abierto — revisión trimestral del horario'
    : 'Open Hours — quarterly hours check-in';
  var description = locale === 'es'
    ? 'Una revisión trimestral del horario de tu restaurante. Reabre tu escenario guardado: ' + url
    : 'A quarterly check-in on your restaurant hours. Reopen your saved scenario: ' + url;
  var p2 = function(n){ return (n < 10 ? '0' : '') + n; };
  var icsDate = function(d){
    return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) +
           'T' + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds()) + 'Z';
  };
  var start = new Date();
  start.setUTCDate(start.getUTCDate() + 90);
  start.setUTCHours(15, 0, 0, 0); // 10 AM ET / 11 AM EDT-ish; harmless.
  var end = new Date(start.getTime() + 30 * 60 * 1000);
  var uid = 'oh-quarterly-' + start.getTime() + '@muntin.digital';
  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Muntin Digital//Open Hours//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + uid,
    'DTSTAMP:' + icsDate(new Date()),
    'DTSTART:' + icsDate(start),
    'DTEND:' + icsDate(end),
    'RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=8',
    'SUMMARY:' + ohIcsEscape(summary),
    'DESCRIPTION:' + ohIcsEscape(description)
  ];
  if (url) lines.push('URL:' + url);
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

// ------------------------------------------------------------
// Holiday data
//
// Returns the rolling-12-month list of holidays a US restaurant is
// likely to consider for closure or modified hours. Each entry has:
//   id        — stable slug (used as React-key equivalent)
//   name      — display string
//   date      — 'YYYY-MM-DD'
//   note      — short guidance line ("most restaurants close",
//               "early close common", etc.); the UI surfaces this
//               so the owner can decide quickly.
//
// Floating dates (Memorial Day, Thanksgiving, etc.) are computed
// from rules; fixed dates are formatted from numeric month + day.
// Easter dates are computed via the canonical anonymous Gregorian
// algorithm. Range default: 12 months from today (UTC).
// ------------------------------------------------------------

function ohNthWeekdayOfMonth(year, month, weekday, n) {
  // month: 1-12; weekday: 0=Sun..6=Sat; n: 1-5 (1st, 2nd, 3rd, 4th, 5th)
  var d = new Date(Date.UTC(year, month - 1, 1));
  var firstWd = d.getUTCDay();
  var offset = (weekday - firstWd + 7) % 7;
  var day = 1 + offset + (n - 1) * 7;
  return new Date(Date.UTC(year, month - 1, day));
}

function ohLastWeekdayOfMonth(year, month, weekday) {
  // month: 1-12; weekday: 0=Sun..6=Sat
  var d = new Date(Date.UTC(year, month, 0)); // last day of month
  var lastDay = d.getUTCDate();
  var lastWd = d.getUTCDay();
  var offset = (lastWd - weekday + 7) % 7;
  var day = lastDay - offset;
  return new Date(Date.UTC(year, month - 1, day));
}

function ohEasterDate(year) {
  // Anonymous Gregorian algorithm.
  var a = year % 19;
  var b = Math.floor(year / 100), c = year % 100;
  var d = Math.floor(b / 4),       e = b % 4;
  var f = Math.floor((b + 8) / 25);
  var g = Math.floor((b - f + 1) / 3);
  var h = (19 * a + b - d - g + 15) % 30;
  var i = Math.floor(c / 4),       k = c % 4;
  var l = (32 + 2 * e + 2 * i - h - k) % 7;
  var m = Math.floor((a + 11 * h + 22 * l) / 451);
  var month = Math.floor((h + l - 7 * m + 114) / 31);
  var day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function ohFmtDate(d) {
  var y = d.getUTCFullYear();
  var m = ohPad2(d.getUTCMonth() + 1);
  var day = ohPad2(d.getUTCDate());
  return y + '-' + m + '-' + day;
}

function ohHolidaysForYear(year, locale) {
  // Returns the full year's slate. Caller filters by date range.
  // Locale-aware: 'es' substitutes Spanish-language names, adds
  // Latin-American observances common to DMV-area Spanish-speaking
  // restaurants (Día de los Muertos, Cinco de Mayo, Hispanic
  // Heritage Month start), and de-emphasises some US federal
  // holidays whose closure decisions vary widely.
  var easter = ohEasterDate(year);
  // Mardi Gras (Fat Tuesday) is 47 days before Easter.
  var mardiGras = new Date(easter); mardiGras.setUTCDate(mardiGras.getUTCDate() - 47);
  // Mother's Day = 2nd Sunday of May.
  var mothers = ohNthWeekdayOfMonth(year, 5, 0, 2);
  // Father's Day = 3rd Sunday of June.
  var fathers = ohNthWeekdayOfMonth(year, 6, 0, 3);
  // Memorial Day = last Monday of May.
  var memorial = ohLastWeekdayOfMonth(year, 5, 1);
  // Labor Day = 1st Monday of September.
  var labor = ohNthWeekdayOfMonth(year, 9, 1, 1);
  // Thanksgiving = 4th Thursday of November.
  var thanksgiving = ohNthWeekdayOfMonth(year, 11, 4, 4);
  // Black Friday = day after Thanksgiving.
  var blackFriday = new Date(thanksgiving); blackFriday.setUTCDate(blackFriday.getUTCDate() + 1);
  // MLK Jr. Day = 3rd Monday of January.
  var mlk = ohNthWeekdayOfMonth(year, 1, 1, 3);
  // Super Bowl Sunday = 2nd Sunday of February (NFL's 17-game era,
  // 2022 onward). One of the highest takeout/wings days of the year
  // for casual independents — owners regularly forget to plan for it.
  var superBowl = ohNthWeekdayOfMonth(year, 2, 0, 2);

  if (locale === 'es') {
    // Spanish-language slate. Latin-American observances added,
    // some US federal holidays kept but with more neutral notes.
    return [
      { id: 'new-years',     name: 'Año Nuevo',           date: year + '-01-01', note: 'La mayoría cierra o abre tarde.' },
      { id: 'reyes',         name: 'Día de Reyes',        date: year + '-01-06', note: 'Tradición en muchas familias latinas; algunos cierran o tienen menú especial.' },
      { id: 'mlk',           name: 'Día de MLK Jr.',      date: ohFmtDate(mlk),  note: 'Feriado federal; depende de ti.' },
      { id: 'super-bowl',    name: 'Super Bowl',          date: ohFmtDate(superBowl), note: 'Uno de los días más fuertes de takeout y delivery del año — alitas, pizza, parrillada para llevar.' },
      { id: 'valentines',    name: 'Día de San Valentín', date: year + '-02-14', note: 'Una de las noches más reservadas del año — usualmente abierto con reservas y menú especial.' },
      { id: 'mardi-gras',    name: 'Martes de Carnaval',  date: ohFmtDate(mardiGras), note: 'Algunos restaurantes corren un menú especial en vez de cerrar.' },
      { id: 'st-patricks',   name: 'Día de San Patricio', date: year + '-03-17', note: 'Noche fuerte para bares y pubs; la mayoría abre con horario extendido.' },
      { id: 'cinco-mayo',    name: 'Cinco de Mayo',       date: year + '-05-05', note: 'Fecha clave para restaurantes mexicanos y mexicano-americanos.' },
      { id: 'easter',        name: 'Domingo de Pascua',   date: ohFmtDate(easter), note: 'Brunch común; cierre todo el día también común.' },
      { id: 'mothers-day',   name: 'Día de la Madre',     date: ohFmtDate(mothers), note: 'El brunch más concurrido del año — usualmente abierto con reservas.' },
      { id: 'memorial-day',  name: 'Memorial Day',        date: ohFmtDate(memorial), note: 'Inicio de temporada de patio; la mayoría sigue abierta.' },
      { id: 'juneteenth',    name: 'Juneteenth',          date: year + '-06-19', note: 'Feriado federal desde 2021; depende de ti.' },
      { id: 'fathers-day',   name: 'Día del Padre',       date: ohFmtDate(fathers), note: 'Domingo de carne; usualmente abierto.' },
      { id: 'july-4',        name: 'Día de Independencia EE.UU.', date: year + '-07-04', note: 'Muchos cierran, especialmente con patios cerca de fuegos artificiales.' },
      { id: 'hispanic-heritage', name: 'Inicio del Mes de la Herencia Hispana', date: year + '-09-15', note: 'Quince de septiembre — muchos restaurantes corren menús o eventos especiales.' },
      { id: 'mexican-indep', name: 'Día de la Independencia de México', date: year + '-09-16', note: 'Tradición central para restaurantes mexicanos; especiales y eventos.' },
      { id: 'labor-day',     name: 'Día del Trabajo',     date: ohFmtDate(labor), note: 'Último feriado de verano; depende de ti.' },
      { id: 'halloween',     name: 'Halloween',           date: year + '-10-31', note: 'Punto de decisión para restaurantes con familias; bares suelen tener noche fuerte.' },
      { id: 'dia-muertos',   name: 'Día de los Muertos',  date: year + '-11-02', note: 'Importante para restaurantes mexicanos; muchos corren menús u ofrendas.' },
      { id: 'veterans-day',  name: 'Día de los Veteranos', date: year + '-11-11', note: 'Feriado federal; depende de ti.' },
      { id: 'thanksgiving',  name: 'Día de Acción de Gracias', date: ohFmtDate(thanksgiving), note: 'La mayoría de los restaurantes independientes cierran.' },
      { id: 'black-friday',  name: 'Día Después del Día de Acción de Gracias', date: ohFmtDate(blackFriday), note: 'Cierre opcional; al equipo le suele gustar.' },
      { id: 'guadalupe',     name: 'Día de la Virgen de Guadalupe', date: year + '-12-12', note: 'Importante para restaurantes mexicanos; algunos corren menús especiales.' },
      { id: 'christmas-eve', name: 'Nochebuena',          date: year + '-12-24', note: 'Cierre temprano (5–7 PM) es lo común.' },
      { id: 'christmas-day', name: 'Navidad',             date: year + '-12-25', note: 'La mayoría cierra.' },
      { id: 'san-esteban',   name: 'Día de San Esteban',  date: year + '-12-26', note: 'Tradición navideña en algunas familias latinas; cierre opcional.' },
      { id: 'new-years-eve', name: 'Nochevieja',          date: year + '-12-31', note: 'Menú especial / cierre tarde son comunes.' }
    ];
  }

  return [
    { id: 'new-years',     name: "New Year's Day",     date: year + '-01-01', note: 'Most restaurants close or open late.' },
    { id: 'mlk',           name: 'MLK Jr. Day',        date: ohFmtDate(mlk), note: 'Federal holiday; up to you.' },
    { id: 'super-bowl',    name: 'Super Bowl Sunday',  date: ohFmtDate(superBowl),                          note: 'One of the biggest takeout/delivery days of the year — wings, pizza, BBQ-to-go.' },
    { id: 'valentines',    name: "Valentine's Day",    date: year + '-02-14', note: 'One of the most-reserved nights of the year — usually open with reservations and a fixed menu.' },
    { id: 'mardi-gras',    name: 'Mardi Gras',         date: ohFmtDate(mardiGras),                          note: 'Some restaurants run a special menu instead of closing.' },
    { id: 'st-patricks',   name: "St. Patrick's Day",  date: year + '-03-17', note: 'Big night for bars and pubs; most open with extended hours.' },
    { id: 'easter',        name: 'Easter Sunday',      date: ohFmtDate(easter),                             note: 'Brunch service common; full-day close also common.' },
    { id: 'mothers-day',   name: "Mother's Day",       date: ohFmtDate(mothers),                            note: 'Busiest brunch of the year — usually open with reservations.' },
    { id: 'memorial-day',  name: 'Memorial Day',       date: ohFmtDate(memorial),                           note: 'Outdoor patio kickoff; most casual restaurants stay open.' },
    { id: 'juneteenth',    name: 'Juneteenth',         date: year + '-06-19', note: 'Federal holiday since 2021; up to you.' },
    { id: 'fathers-day',   name: "Father's Day",       date: ohFmtDate(fathers),                            note: 'Steakhouse Sunday; usually open.' },
    { id: 'july-4',        name: 'Independence Day',   date: year + '-07-04',                               note: 'Many restaurants close, especially with patios near fireworks.' },
    { id: 'labor-day',     name: 'Labor Day',          date: ohFmtDate(labor),                              note: 'Last summer holiday; up to you.' },
    { id: 'halloween',     name: 'Halloween',          date: year + '-10-31', note: 'Decision point for family-leaning restaurants; bars often run a costume night.' },
    { id: 'veterans-day',  name: 'Veterans Day',       date: year + '-11-11', note: 'Federal holiday; up to you.' },
    { id: 'thanksgiving',  name: 'Thanksgiving',       date: ohFmtDate(thanksgiving),                       note: 'Most independent restaurants close.' },
    { id: 'black-friday',  name: 'Day After Thanksgiving', date: ohFmtDate(blackFriday),                    note: 'Optional close; staff often appreciates it.' },
    { id: 'christmas-eve', name: 'Christmas Eve',      date: year + '-12-24',                               note: 'Early close (5–7 PM) is the norm.' },
    { id: 'christmas-day', name: 'Christmas Day',      date: year + '-12-25',                               note: 'Most restaurants close.' },
    { id: 'new-years-eve', name: "New Year's Eve",     date: year + '-12-31',                               note: 'Special menu / late close common.' }
  ];
}

function ohHolidaysInRange(startDate, endDate, locale) {
  // startDate / endDate as Date objects (defaults: today + 365 days UTC).
  // locale: 'en' (default) or 'es' to switch to the Spanish slate.
  var now = new Date();
  var start = startDate || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  var end = endDate;
  if (!end) {
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 365);
  }
  var startMs = start.getTime();
  var endMs = end.getTime();
  var startYear = start.getUTCFullYear();
  var endYear = end.getUTCFullYear();
  var pool = [];
  for (var y = startYear; y <= endYear; y++) pool = pool.concat(ohHolidaysForYear(y, locale));
  return pool.filter(function(h){
    var t = Date.UTC(
      parseInt(h.date.slice(0, 4), 10),
      parseInt(h.date.slice(5, 7), 10) - 1,
      parseInt(h.date.slice(8, 10), 10)
    );
    return t >= startMs && t <= endMs;
  }).sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
}

// ------------------------------------------------------------
// Custom-closures from a comma-separated string (Phase E4).
// Owners often have 3-4 dates in mind at once ("11/27, 12/24, 12/25").
// Power-user shortcut: paste the dates into the closure-name input
// and we parse them into N closures. Accepts MM/DD, MM/DD/YYYY, or
// ISO YYYY-MM-DD; assumes current year if omitted.
// ------------------------------------------------------------

function ohParseDateList(text) {
  if (!text) return null;
  var year = new Date().getUTCFullYear();
  var raw = String(text).split(/[,;]+/).map(function(s){ return s.trim(); }).filter(Boolean);
  if (raw.length < 2) return null; // 1-token strings are still names, not date lists
  var dates = [];
  for (var i = 0; i < raw.length; i++) {
    var iso = ohNormalizeDate(raw[i], year);
    if (!iso) return null;
    dates.push(iso);
  }
  return dates;
}

function ohNormalizeDate(s, defaultYear) {
  s = String(s).trim();
  // ISO: 2026-12-25
  var iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (iso) {
    var y = +iso[1], m = +iso[2], d = +iso[3];
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return y + '-' + (m<10?'0':'') + m + '-' + (d<10?'0':'') + d;
  }
  // US: 12/25 or 12/25/2026 or 12-25
  var us = /^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/.exec(s);
  if (us) {
    var mm = +us[1], dd = +us[2];
    var yy = us[3] ? (+us[3] < 100 ? 2000 + +us[3] : +us[3]) : defaultYear;
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    return yy + '-' + (mm<10?'0':'') + mm + '-' + (dd<10?'0':'') + dd;
  }
  return null;
}

// ------------------------------------------------------------
// URL-fragment scenario encoding (Phase D — Muntin signature).
//
// The Quarterly Drift Check-in needs the calendar reminder to lead
// the owner back to a fully-rehydrated form. Same shape as Margin
// Math's mmEncodeState/mmDecodeState (URL-safe key=value pairs, not
// base64) so the family pattern is recognizable.
//
// Fragment schema (v1):
//   v=1
//   n=<encoded restaurant name>
//   c=<encoded city>
//   s=<encoded street>          (optional)
//   r=<encoded region>          (optional)
//   z=<encoded postal code>     (optional)
//   w.Mon=<services-string>     // "Dinner|17:00|22:00|0,Brunch|11:00|15:00|0"
//   w.Tue=...
//   cl=<id>,<id>,custom-YYYY-MM-DD-Name
//
// Privacy-safe: data lives only in the user's URL bar. forward-compat:
// unknown keys are ignored on decode so a future v=2 round-trips cleanly.
// ------------------------------------------------------------

var OH_FRAGMENT_VERSION = '1';

function ohEncodeServices(services) {
  if (!Array.isArray(services) || !services.length) return '';
  return services.map(function(s){
    var label = (s.label || '').replace(/[|,]/g, ' '); // strip our delimiters
    var open  = ohParseTime(s.opens) || '';
    var close = ohParseTime(s.closes) || '';
    var nd    = s.closesNextDay ? '1' : '0';
    return label + '|' + open + '|' + close + '|' + nd;
  }).join(',');
}

function ohDecodeServices(str) {
  if (!str) return [];
  return String(str).split(',').map(function(seg){
    var parts = seg.split('|');
    if (parts.length < 3) return null;
    var opens = ohParseTime(parts[1]);
    var closes = ohParseTime(parts[2]);
    if (!opens || !closes) return null;
    return {
      label: parts[0] || '',
      opens: opens,
      closes: closes,
      closesNextDay: parts[3] === '1'
    };
  }).filter(Boolean);
}

function ohEncodeClosures(closures) {
  if (!Array.isArray(closures) || !closures.length) return '';
  return closures.map(function(c){
    if (!c || !c.date) return '';
    if (/^custom-/.test(c.id || '')) {
      var safeName = String(c.name || 'Closed').replace(/[,;\s]+/g, '+');
      return 'custom-' + c.date + '-' + safeName;
    }
    return String(c.id || '');
  }).filter(Boolean).join(',');
}

function ohDecodeClosures(str, holidays) {
  // holidays: optional array from ohHolidaysInRange used to resolve
  // preset IDs to {name, date}. Without it, preset IDs are dropped.
  if (!str) return [];
  var byId = {};
  (holidays || []).forEach(function(h){ byId[h.id] = h; });
  return String(str).split(',').map(function(s){
    if (!s) return null;
    var custom = /^custom-(\d{4}-\d{2}-\d{2})-(.+)$/.exec(s);
    if (custom) {
      return {
        id: 'custom-' + custom[1],
        name: String(custom[2]).replace(/\+/g, ' '),
        date: custom[1],
        source: 'custom'
      };
    }
    var preset = byId[s];
    if (preset) return { id: s, name: preset.name, date: preset.date, source: 'preset' };
    return null;
  }).filter(Boolean);
}

function ohEncodeState(state) {
  state = state || {};
  var parts = ['v=' + OH_FRAGMENT_VERSION];
  function push(key, val) {
    if (val === undefined || val === null || val === '') return;
    parts.push(key + '=' + encodeURIComponent(String(val)));
  }
  push('n', state.name);
  push('c', state.city);
  push('s', state.street);
  push('r', state.region);
  push('z', state.postalCode);
  if (state.week && typeof state.week === 'object') {
    OH_DAYS.forEach(function(d){
      var enc = ohEncodeServices(state.week[d]);
      if (enc) parts.push('w.' + d + '=' + encodeURIComponent(enc));
    });
  }
  if (state.closures && state.closures.length) {
    var clEnc = ohEncodeClosures(state.closures);
    if (clEnc) parts.push('cl=' + encodeURIComponent(clEnc));
  }
  return parts.join('&');
}

function ohDecodeState(hash, holidays) {
  // Always returns a week-initialized shape so callers can blindly
  // access out.week.Mon without null-checking.
  var out = { week: {} };
  OH_DAYS.forEach(function(d){ out.week[d] = []; });
  if (typeof hash !== 'string') return out;
  if (hash.charAt(0) === '#') hash = hash.slice(1);
  if (!hash) return out;
  var pairs = hash.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var eq = pairs[i].indexOf('=');
    if (eq < 0) continue;
    var key = pairs[i].slice(0, eq);
    var raw = pairs[i].slice(eq + 1);
    var val;
    try { val = decodeURIComponent(raw); } catch (_) { continue; }
    if (key === 'v') continue;
    if (key === 'n') out.name = val;
    else if (key === 'c') out.city = val;
    else if (key === 's') out.street = val;
    else if (key === 'r') out.region = val;
    else if (key === 'z') out.postalCode = val;
    else if (key === 'cl') out.closures = ohDecodeClosures(val, holidays);
    else if (key.indexOf('w.') === 0) {
      var d = key.slice(2);
      if (OH_DAYS.indexOf(d) >= 0) out.week[d] = ohDecodeServices(val);
    }
    // Unknown keys ignored — forward-compat with v=2.
  }
  return out;
}

// ------------------------------------------------------------
// Plausible bucket helpers — enum-locked, privacy-critical.
// Same pattern as menu-engineering / menu-copy.
// ------------------------------------------------------------

var OH_OPEN_DAYS_BUCKETS = ['1-3', '4-5', '6-7'];

function ohBucketWeeklyOpenDays(n) {
  var v = typeof n === 'number' && isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  if (v <= 3) return '1-3';
  if (v <= 5) return '4-5';
  return '6-7';
}

var OH_SERVICE_TIERS = ['single', 'multi-service', 'kitchen-bar'];

function ohBucketServiceTiers(input) {
  var v = ohValidateHours(input);
  if (v.summary.hasMultiService) return 'multi-service';
  // kitchen-bar would require the v2 split-grid input; not in Phase 1.
  return 'single';
}

var OH_CLOSURE_BUCKETS = ['0', '1-3', '4-8', 'gt-8'];

function ohBucketClosureCount(n) {
  var v = typeof n === 'number' && isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  if (v === 0) return '0';
  if (v <= 3) return '1-3';
  if (v <= 8) return '4-8';
  return 'gt-8';
}

// ------------------------------------------------------------
// Dual export — browser window + Node module.
// ------------------------------------------------------------

var OH_PUBLIC = {
  // Time helpers
  parseTime:           ohParseTime,
  timeToMinutes:       ohTimeToMinutes,
  minutesToTime:       ohMinutesToTime,
  formatTime:          ohFormatTime,
  // Normalization + validation
  normalizeService:    ohNormalizeService,
  normalizeWeek:       ohNormalizeWeek,
  validateDay:         ohValidateDay,
  validateHours:       ohValidateHours,
  // Generators
  generateJsonLd:      ohGenerateJsonLd,
  generateJsonLdScript: ohGenerateJsonLdScript,
  generatePlatformCopy: ohGeneratePlatformCopy,
  generateBuilderEmail: ohGenerateBuilderEmail,
  generateIcs:         ohGenerateIcs,
  generateQuarterlyIcs: ohGenerateQuarterlyIcs,
  // Date parsing (Phase E4)
  parseDateList:       ohParseDateList,
  normalizeDate:       ohNormalizeDate,
  // URL-fragment scenario serialization (Phase D Muntin signature)
  encodeState:         ohEncodeState,
  decodeState:         ohDecodeState,
  encodeServices:      ohEncodeServices,
  decodeServices:      ohDecodeServices,
  encodeClosures:      ohEncodeClosures,
  decodeClosures:      ohDecodeClosures,
  // Holiday helpers
  easterDate:          ohEasterDate,
  nthWeekdayOfMonth:   ohNthWeekdayOfMonth,
  lastWeekdayOfMonth:  ohLastWeekdayOfMonth,
  holidaysForYear:     ohHolidaysForYear,
  holidaysInRange:     ohHolidaysInRange,
  // Bucket helpers
  bucketWeeklyOpenDays: ohBucketWeeklyOpenDays,
  bucketServiceTiers:   ohBucketServiceTiers,
  bucketClosureCount:   ohBucketClosureCount,
  // Enums + constants
  DAYS:                OH_DAYS,
  DAYS_FULL:           OH_DAYS_FULL,
  DAYS_FULL_ES:        OH_DAYS_FULL_ES,
  OPEN_DAYS_BUCKETS:   OH_OPEN_DAYS_BUCKETS,
  SERVICE_TIERS:       OH_SERVICE_TIERS,
  CLOSURE_BUCKETS:     OH_CLOSURE_BUCKETS
};

if (typeof self !== 'undefined' && typeof module === 'undefined') {
  self.OH = OH_PUBLIC;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OH_PUBLIC;
}
