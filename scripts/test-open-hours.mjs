#!/usr/bin/env node
// Open Hours — rules-engine + generator regression tests.
// Run via: `node scripts/test-open-hours.mjs`
//
// Three assertion categories (mirrors the prior tools' test pattern):
//
// 1. Hours math: time parsing, day validation, overlap detection,
//    AM/PM mistakes, past-midnight close handling.
// 2. JSON-LD + cross-platform copy: Schema.org compliance, day-
//    grouping compression, locale-aware formatting.
// 3. Privacy / bucket purity: every bucket helper returns enum-
//    locked values across full input ranges + poison strings.
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const O = require('../tools/open-hours/open-hours.js');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ' + JSON.stringify(expected) +
                        ', got ' + JSON.stringify(actual) + ')'));
  if (!ok) failures++;
}
function assert(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label);
  if (!cond) failures++;
}

// ------------------------------------------------------------
// Time parsing — accepts "9:00", "9 PM", "21:00", etc.
// ------------------------------------------------------------
assertEq('parse "9:00"',     O.parseTime('9:00'),    '09:00');
assertEq('parse "9 AM"',     O.parseTime('9 AM'),    '09:00');
assertEq('parse "9pm"',      O.parseTime('9pm'),     '21:00');
assertEq('parse "12 AM"',    O.parseTime('12 AM'),   '00:00');
assertEq('parse "12 PM"',    O.parseTime('12 PM'),   '12:00');
assertEq('parse "21:00"',    O.parseTime('21:00'),   '21:00');
assertEq('parse "11:30 PM"', O.parseTime('11:30 PM'), '23:30');
assertEq('parse "00:00"',    O.parseTime('00:00'),   '00:00');
assertEq('parse "23:59"',    O.parseTime('23:59'),   '23:59');
assertEq('parse empty',      O.parseTime(''),        null);
assertEq('parse null',       O.parseTime(null),      null);
assertEq('parse "25:00"',    O.parseTime('25:00'),   null);
assertEq('parse "13 PM"',    O.parseTime('13 PM'),   null);
assertEq('parse "9:75"',     O.parseTime('9:75'),    null);
assertEq('parse "five"',     O.parseTime('five'),    null);

// timeToMinutes / minutesToTime round-trip
assertEq('timeToMinutes 09:00',  O.timeToMinutes('09:00'),   9 * 60);
assertEq('timeToMinutes 23:59',  O.timeToMinutes('23:59'),   23 * 60 + 59);
assertEq('timeToMinutes invalid', O.timeToMinutes('25:00'),  null);
assertEq('minutesToTime 540',    O.minutesToTime(540),       '09:00');
assertEq('minutesToTime 0',      O.minutesToTime(0),         '00:00');
assertEq('minutesToTime wrap',   O.minutesToTime(1500),      '01:00'); // 25h → 1am

// formatTime — display-only
assertEq('formatTime 09:00 EN', O.formatTime('09:00'),       '9 AM');
assertEq('formatTime 21:30 EN', O.formatTime('21:30'),       '9:30 PM');
assertEq('formatTime 12:00 EN', O.formatTime('12:00'),       '12 PM');
assertEq('formatTime 00:00 EN', O.formatTime('00:00'),       '12 AM');
assertEq('formatTime 09:00 ES', O.formatTime('09:00', 'es'), '09:00');

// ------------------------------------------------------------
// Validation — overlap, same-time, AM/PM mistakes
// ------------------------------------------------------------
{
  // Clean week, no warnings.
  const v = O.validateHours({
    name: 'Test',
    week: {
      Mon: [],
      Tue: [{ label: 'Dinner', opens: '17:00', closes: '22:00' }],
      Wed: [{ label: 'Dinner', opens: '17:00', closes: '22:00' }],
      Thu: [],
      Fri: [],
      Sat: [
        { label: 'Brunch', opens: '11:00', closes: '15:00' },
        { label: 'Dinner', opens: '17:00', closes: '23:00' }
      ],
      Sun: []
    }
  });
  assertEq('clean week no warnings', v.warnings.length, 0);
  assertEq('clean week open count',  v.summary.openDaysCount, 3);
  assertEq('clean week multi',       v.summary.hasMultiService, true);
}

{
  // Same open + close → typo warning.
  const v = O.validateHours({
    week: { Mon: [{ opens: '11:00', closes: '11:00' }] }
  });
  assert('same-time typo warning', v.warnings.some(w => /opens and closes at the same/i.test(w.message)));
}

{
  // Close before open without next-day flag.
  const v = O.validateHours({
    week: { Mon: [{ opens: '17:00', closes: '01:00', closesNextDay: false }] }
  });
  assert('close-before-open warning', v.warnings.some(w => /closes.*before it opens/i.test(w.message)));
}

{
  // Past midnight handled when flag is set — no warning.
  const v = O.validateHours({
    week: { Fri: [{ opens: '17:00', closes: '01:00', closesNextDay: true }] }
  });
  assertEq('past-midnight ok no warnings', v.warnings.length, 0);
}

{
  // 9 AM open + 9 AM close → AM/PM mistake heuristic.
  const v = O.validateHours({
    week: { Mon: [{ opens: '09:00', closes: '09:00' }] }
  });
  assert('AM/PM mistake warning', v.warnings.some(w => /9 AM/i.test(w.message) || /same time/i.test(w.message)));
}

{
  // Overlapping services on same day.
  const v = O.validateHours({
    week: {
      Sat: [
        { label: 'Brunch', opens: '11:00', closes: '17:00' },
        { label: 'Dinner', opens: '15:00', closes: '22:00' }
      ]
    }
  });
  assert('overlap warning', v.warnings.some(w => /overlap/i.test(w.message)));
}

// ------------------------------------------------------------
// JSON-LD generation — Schema.org compliance
// ------------------------------------------------------------
{
  const json = O.generateJsonLd({
    name: 'Test Restaurant',
    city: 'Silver Spring',
    week: {
      Mon: [{ opens: '11:00', closes: '21:00' }],
      Tue: [{ opens: '11:00', closes: '21:00' }],
      Wed: [{ opens: '11:00', closes: '21:00' }]
    }
  });
  const doc = JSON.parse(json);
  assertEq('JSON-LD @context',    doc['@context'],            'https://schema.org');
  assertEq('JSON-LD @type',       doc['@type'],               'Restaurant');
  assertEq('JSON-LD name',        doc.name,                   'Test Restaurant');
  assertEq('JSON-LD address',     doc.address.addressLocality, 'Silver Spring');
  assert('JSON-LD has OHS array', Array.isArray(doc.openingHoursSpecification));
  assertEq('JSON-LD compresses identical days', doc.openingHoursSpecification.length, 1);
  assertEq('JSON-LD groups Mon/Tue/Wed',
           doc.openingHoursSpecification[0].dayOfWeek,
           ['Monday', 'Tuesday', 'Wednesday']);
  assertEq('JSON-LD opens 24h', doc.openingHoursSpecification[0].opens, '11:00');
  assertEq('JSON-LD closes 24h', doc.openingHoursSpecification[0].closes, '21:00');
}

{
  // Different days, different hours — separate OHS entries.
  const doc = O.generateJsonLd({
    name: 'X',
    week: {
      Mon: [{ opens: '11:00', closes: '21:00' }],
      Tue: [{ opens: '11:00', closes: '22:00' }]
    }
  }, { format: 'object' });
  assertEq('different hours → separate entries',
           doc.openingHoursSpecification.length, 2);
}

{
  // Single day vs grouped: scalar dayOfWeek when 1, array when more.
  const doc = O.generateJsonLd({
    name: 'X',
    week: { Fri: [{ opens: '17:00', closes: '23:00' }] }
  }, { format: 'object' });
  assertEq('single-day scalar dayOfWeek',
           doc.openingHoursSpecification[0].dayOfWeek, 'Friday');
}

{
  // Empty week → empty array.
  const doc = O.generateJsonLd({ name: 'X', week: {} }, { format: 'object' });
  assertEq('empty week → empty OHS', doc.openingHoursSpecification, []);
}

// generateJsonLdScript wraps in <script> tag
{
  const s = O.generateJsonLdScript({ name: 'X', week: { Mon: [{opens:'11:00',closes:'21:00'}] } });
  assert('JSON-LD script open tag',  /^<script type="application\/ld\+json">/.test(s));
  assert('JSON-LD script close tag', /<\/script>$/.test(s));
}

// ------------------------------------------------------------
// Cross-platform copy — Google / Yelp / Apple
// ------------------------------------------------------------
{
  const input = {
    name: 'X',
    week: {
      Mon: [],
      Tue: [{ opens: '17:00', closes: '22:00' }],
      Sat: [
        { opens: '11:00', closes: '15:00' },
        { opens: '17:00', closes: '23:00' }
      ]
    }
  };
  const g = O.generatePlatformCopy(input, 'google');
  assert('google has "Monday: closed"',     /Monday: closed/.test(g));
  assert('google has Tuesday hours',        /Tuesday: 5 PM – 10 PM/.test(g));
  assert('google has Saturday two services', /Saturday: 11 AM – 3 PM, 5 PM – 11 PM/.test(g));

  const y = O.generatePlatformCopy(input, 'yelp');
  assert('yelp uses abbreviated Mon', /^Mon /m.test(y));
  assert('yelp uses dash separator',  /5 PM - 10 PM/.test(y));

  const a = O.generatePlatformCopy(input, 'apple');
  assert('apple uses en-dash format', /5 PM–10 PM/.test(a));

  const es = O.generatePlatformCopy(input, 'google', 'es');
  assert('ES google uses lowercase day', /lunes:/.test(es) || /Lunes:/.test(es));
  assert('ES google uses 24-hour times',  /17:00/.test(es));
}

// ------------------------------------------------------------
// Builder email template
// ------------------------------------------------------------
{
  const en = O.generateBuilderEmail({ name: 'Joe' });
  assert('builder email mentions head + paste', /head/i.test(en) && /paste/i.test(en));
  assert('builder email signs off with name',   /Joe$/.test(en));
  const es = O.generateBuilderEmail({ name: 'José' }, 'es');
  assert('ES builder email greets in Spanish',  /Hola/.test(es));
  assert('ES builder email signs off with name', /José$/.test(es));
}

// ------------------------------------------------------------
// ICS generator (Phase 1 ships envelope; Phase 2 adds full events)
// ------------------------------------------------------------
{
  const ics = O.generateIcs([]);
  assert('ICS empty has BEGIN:VCALENDAR',  /BEGIN:VCALENDAR/.test(ics));
  assert('ICS empty has VERSION:2.0',      /VERSION:2\.0/.test(ics));
  assert('ICS empty has PRODID Muntin',    /PRODID:.*Muntin Digital/.test(ics));
  assert('ICS empty has END:VCALENDAR',    /END:VCALENDAR/.test(ics));
  assert('ICS uses CRLF',                  /\r\n/.test(ics));
}

{
  const ics = O.generateIcs([
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-07-04', name: 'July 4' }
  ]);
  assert('ICS has VEVENT for closure',     /BEGIN:VEVENT/.test(ics));
  assert('ICS has DTSTART for Dec 25',     /DTSTART;VALUE=DATE:20261225/.test(ics));
  assert('ICS has SUMMARY with name',      /SUMMARY:Closed — Christmas Day/.test(ics));
  assert('ICS strips commas from name',    !/,/.test(ics.match(/SUMMARY:[^\r]+/)[0].split('SUMMARY:')[1]));
}

// ------------------------------------------------------------
// Privacy-critical bucket helpers — enum purity + poison strings
// ------------------------------------------------------------
{
  const seen = new Set();
  for (let n = 0; n <= 12; n++) seen.add(O.bucketWeeklyOpenDays(n));
  for (const v of seen) {
    if (!O.OPEN_DAYS_BUCKETS.includes(v)) {
      console.log('FAIL  bucketWeeklyOpenDays non-enum: ' + JSON.stringify(v));
      failures++;
    }
  }
  console.log('PASS  bucketWeeklyOpenDays sweep (' + seen.size + ' unique, all in enum)');
}
assertEq('open days 0  → 1-3', O.bucketWeeklyOpenDays(0),  '1-3');
assertEq('open days 3  → 1-3', O.bucketWeeklyOpenDays(3),  '1-3');
assertEq('open days 4  → 4-5', O.bucketWeeklyOpenDays(4),  '4-5');
assertEq('open days 5  → 4-5', O.bucketWeeklyOpenDays(5),  '4-5');
assertEq('open days 6  → 6-7', O.bucketWeeklyOpenDays(6),  '6-7');
assertEq('open days 7  → 6-7', O.bucketWeeklyOpenDays(7),  '6-7');
assertEq('open days NaN → 1-3', O.bucketWeeklyOpenDays(NaN), '1-3');

assertEq('closures 0   → 0',     O.bucketClosureCount(0),   '0');
assertEq('closures 1   → 1-3',   O.bucketClosureCount(1),   '1-3');
assertEq('closures 4   → 4-8',   O.bucketClosureCount(4),   '4-8');
assertEq('closures 12  → gt-8',  O.bucketClosureCount(12),  'gt-8');

// Service-tiers bucket
{
  const single = O.bucketServiceTiers({ week: { Mon: [{ opens: '11:00', closes: '21:00' }] } });
  assertEq('single-service tier', single, 'single');
  const multi = O.bucketServiceTiers({ week: { Sat: [
    { opens: '11:00', closes: '15:00' },
    { opens: '17:00', closes: '23:00' }
  ] } });
  assertEq('multi-service tier', multi, 'multi-service');
}

// Poison-string tests — no raw input may leak through any bucket.
{
  const poison = 'SECRET_RESTAURANT_NAME';
  assert('no SECRET leak from bucketWeeklyOpenDays',
         ('' + O.bucketWeeklyOpenDays(poison)).indexOf('SECRET') === -1);
  assert('no SECRET leak from bucketClosureCount',
         ('' + O.bucketClosureCount(poison)).indexOf('SECRET') === -1);
  assert('no SECRET leak from bucketServiceTiers',
         ('' + O.bucketServiceTiers(poison)).indexOf('SECRET') === -1);
}

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed.');
