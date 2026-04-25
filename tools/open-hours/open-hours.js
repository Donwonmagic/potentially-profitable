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
// Drops :00 minute tail when zero ("11 AM" not "11:00 AM"); keeps
// minutes when present. Locale-aware: ES uses 24-hour "11:00".
function ohFormatTime(hhmm, locale) {
  if (typeof hhmm !== 'string') return '';
  var min = ohTimeToMinutes(hhmm);
  if (min == null) return '';
  if (locale === 'es') {
    return hhmm; // 24-hour for Spanish-language menus
  }
  var h = Math.floor(min / 60), m = min % 60;
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
    if (effectiveClose < openMin) {
      warnings.push({ day: day, message: 'On ' + day + ', "' + (s.label || 'service') + '" closes (' + ohFormatTime(s.closes) + ') before it opens (' + ohFormatTime(s.opens) + '). If you meant to close after midnight, check the "closes next day" box.' });
      continue;
    }

    // Late close (after 1 AM) without next-day flag → probable bug.
    if (closeMin >= 0 && closeMin < 6 * 60 && !s.closesNextDay && openMin > closeMin) {
      // Already caught above.
    }

    // AM/PM mistake heuristic: the row "opens 9, closes 21" reads
    // fine, but "opens 9, closes 9" with no next-day is sus.
    if (openMin === 9 * 60 && closeMin === 9 * 60 && !s.closesNextDay) {
      warnings.push({ day: day, message: 'On ' + day + ', "' + (s.label || 'service') + '" opens at 9 AM and closes at 9 AM. Did you mean 9 PM (21:00) for the close?' });
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
    name: String((input && input.name) || ''),
    city: String((input && input.city) || '')
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
      // Compute closing time. If closesNextDay, Schema accepts a
      // close that is logically after opens; we emit the literal
      // close time and let Schema/Google interpret day boundary.
      entries.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: group.days.length === 1 ? group.days[0] : group.days.slice(),
        opens: s.opens,
        closes: s.closes
      });
    });
  });

  var doc = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: v.name || undefined,
    address: v.city ? {
      '@type': 'PostalAddress',
      addressLocality: v.city
    } : undefined,
    openingHoursSpecification: entries
  };
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

function ohGenerateIcs(closures, options) {
  options = options || {};
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
    var name = String(c.name || 'Closed').replace(/[\r\n,;\\]/g, ' ');
    var uid = (options.prefix || 'oh') + '-' + d + '-' + i + '@muntin.digital';
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('DTSTAMP:' + d + 'T000000Z');
    lines.push('DTSTART;VALUE=DATE:' + d);
    lines.push('DTEND;VALUE=DATE:' + d);
    lines.push('SUMMARY:Closed — ' + name);
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  // RFC 5545 requires CRLF line endings.
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

function ohHolidaysForYear(year) {
  // Returns the full year's slate. Caller filters by date range.
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

  return [
    { id: 'new-years',     name: "New Year's Day",     date: year + '-01-01', note: 'Most restaurants close or open late.' },
    { id: 'mlk',           name: 'MLK Jr. Day',        date: ohFmtDate(ohNthWeekdayOfMonth(year, 1, 1, 3)), note: 'Federal holiday; up to you.' },
    { id: 'mardi-gras',    name: 'Mardi Gras',         date: ohFmtDate(mardiGras),                          note: 'Some restaurants run a special menu instead of closing.' },
    { id: 'easter',        name: 'Easter Sunday',      date: ohFmtDate(easter),                             note: 'Brunch service common; full-day close also common.' },
    { id: 'mothers-day',   name: "Mother's Day",       date: ohFmtDate(mothers),                            note: 'Busiest brunch of the year — usually open with reservations.' },
    { id: 'memorial-day',  name: 'Memorial Day',       date: ohFmtDate(memorial),                           note: 'Outdoor patio kickoff; most casual restaurants stay open.' },
    { id: 'fathers-day',   name: "Father's Day",       date: ohFmtDate(fathers),                            note: 'Steakhouse Sunday; usually open.' },
    { id: 'july-4',        name: 'Independence Day',   date: year + '-07-04',                               note: 'Many restaurants close, especially with patios near fireworks.' },
    { id: 'labor-day',     name: 'Labor Day',          date: ohFmtDate(labor),                              note: 'Last summer holiday; up to you.' },
    { id: 'thanksgiving',  name: 'Thanksgiving',       date: ohFmtDate(thanksgiving),                       note: 'Most independent restaurants close.' },
    { id: 'black-friday',  name: 'Day After Thanksgiving', date: ohFmtDate(blackFriday),                    note: 'Optional close; staff often appreciates it.' },
    { id: 'christmas-eve', name: 'Christmas Eve',      date: year + '-12-24',                               note: 'Early close (5–7 PM) is the norm.' },
    { id: 'christmas-day', name: 'Christmas Day',      date: year + '-12-25',                               note: 'Most restaurants close.' },
    { id: 'new-years-eve', name: "New Year's Eve",     date: year + '-12-31',                               note: 'Special menu / late close common.' }
  ];
}

function ohHolidaysInRange(startDate, endDate) {
  // startDate / endDate as Date objects (defaults: today + 365 days UTC).
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
  for (var y = startYear; y <= endYear; y++) pool = pool.concat(ohHolidaysForYear(y));
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
