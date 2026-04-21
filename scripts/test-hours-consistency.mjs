#!/usr/bin/env node
// Phase 3 #1: hours-consistency parser regression test.
// Run via: `node scripts/test-hours-consistency.mjs`
//
// Locks in the canonical-key contract that drives the cross-source
// hours comparison in renderNapCheck (tools/audits/restaurant/
// index.html). Two parsers normalize different upstream shapes:
//
//   parsePlacesHoursText(arr)    — Google Places weekdayDescriptions
//   parseSchemaHoursObjects(obj) — schema.org openingHoursSpecification
//
// Both must produce maps that serializeHoursDayMap() turns into the
// SAME stable string when the underlying hours actually match.
// Without that property the renderNapCheck card would flag false
// positives every time a restaurant published hours in multiple
// formats. Exits non-zero on failure so CI can gate on it.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const C = require('../tools/audits/restaurant/restaurant-checks.js');
const {
  parseHoursTimeToMinutes,
  parsePlacesHoursLine,
  parsePlacesHoursText,
  parseSchemaHoursObjects,
  serializeHoursDayMap
} = C;

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// --- parseHoursTimeToMinutes ---------------------------------------
assertEq('ISO 09:00',     parseHoursTimeToMinutes('09:00'),    540);
assertEq('ISO 09:00:30',  parseHoursTimeToMinutes('09:00:30'), 540);
assertEq('ISO 23:59',     parseHoursTimeToMinutes('23:59'),    1439);
assertEq('ISO 00:00',     parseHoursTimeToMinutes('00:00'),    0);
assertEq('11 AM',         parseHoursTimeToMinutes('11 AM'),    660);
assertEq('11:30 AM',      parseHoursTimeToMinutes('11:30 AM'), 690);
assertEq('11:30am',       parseHoursTimeToMinutes('11:30am'),  690);
assertEq('11:30 a.m.',    parseHoursTimeToMinutes('11:30 a.m.'), 690);
assertEq('12 PM noon',    parseHoursTimeToMinutes('12 PM'),    720);
assertEq('12 AM midnight',parseHoursTimeToMinutes('12 AM'),    0);
assertEq('1 PM',          parseHoursTimeToMinutes('1 PM'),     780);
assertEq('garbage',       parseHoursTimeToMinutes('whenever'), null);
assertEq('null',          parseHoursTimeToMinutes(null),       null);
assertEq('empty',         parseHoursTimeToMinutes(''),         null);
// 13 PM is bogus on a 12-hour clock — must reject, not coerce.
assertEq('13 PM rejected', parseHoursTimeToMinutes('13 PM'),   null);

// --- parsePlacesHoursLine ------------------------------------------
assertEq('Mon 11 AM – 10 PM',
  parsePlacesHoursLine('Monday: 11:00 AM – 10:00 PM'),
  { day: 'Mo', ranges: [[660, 1320]] });
assertEq('Tue lunch + dinner',
  parsePlacesHoursLine('Tuesday: 11:00 AM – 2:30 PM, 5 PM – 10 PM'),
  { day: 'Tu', ranges: [[660, 870], [1020, 1320]] });
assertEq('Sat overnight 11 AM – 1 AM',
  parsePlacesHoursLine('Saturday: 11 AM – 1 AM'),
  { day: 'Sa', ranges: [[660, 60 + 1440]] });
assertEq('Sun closed',
  parsePlacesHoursLine('Sunday: Closed'),
  { day: 'Su', ranges: [] });
assertEq('Mon 24 hours',
  parsePlacesHoursLine('Monday: Open 24 hours'),
  { day: 'Mo', ranges: [[0, 1440]] });
assertEq('Hyphen separator',
  parsePlacesHoursLine('Wednesday: 9:00 AM - 5:00 PM'),
  { day: 'We', ranges: [[540, 17 * 60]] });
assertEq('Em-dash separator',
  parsePlacesHoursLine('Thursday: 9 AM — 5 PM'),
  { day: 'Th', ranges: [[540, 17 * 60]] });
assertEq('Garbage day',
  parsePlacesHoursLine('Funday: 9 AM – 5 PM'),
  null);
assertEq('Empty line',
  parsePlacesHoursLine(''),
  null);

// --- parsePlacesHoursText (full week) ------------------------------
{
  const week = [
    'Monday: 11:00 AM – 10:00 PM',
    'Tuesday: 11:00 AM – 10:00 PM',
    'Wednesday: 11:00 AM – 10:00 PM',
    'Thursday: 11:00 AM – 10:00 PM',
    'Friday: 11:00 AM – 11:00 PM',
    'Saturday: 11:00 AM – 11:00 PM',
    'Sunday: Closed'
  ];
  const map = parsePlacesHoursText(week);
  assertEq('full-week Mo ranges', map.Mo, [[660, 1320]]);
  assertEq('full-week Su closed', map.Su, []);
  assertEq('serialize stable',
    serializeHoursDayMap(map),
    'Mo:0660-1320|Tu:0660-1320|We:0660-1320|Th:0660-1320|Fr:0660-1380|Sa:0660-1380|Su:closed'
  );
}

// --- parseSchemaHoursObjects ---------------------------------------
{
  const objects = [
    {
      '@type': 'Restaurant',
      'openingHoursSpecification': [
        { '@type': 'OpeningHoursSpecification', 'dayOfWeek': 'Monday',
          'opens': '11:00', 'closes': '22:00' },
        { '@type': 'OpeningHoursSpecification', 'dayOfWeek': 'Tuesday',
          'opens': '11:00', 'closes': '22:00' },
        { '@type': 'OpeningHoursSpecification',
          'dayOfWeek': ['Wednesday', 'Thursday'],
          'opens': '11:00', 'closes': '22:00' },
        { '@type': 'OpeningHoursSpecification',
          'dayOfWeek': ['Friday', 'Saturday'],
          'opens': '11:00', 'closes': '23:00' },
        { '@type': 'OpeningHoursSpecification', 'dayOfWeek': 'Sunday',
          'opens': null, 'closes': null }
      ]
    }
  ];
  const map = parseSchemaHoursObjects(objects);
  assertEq('schema Mo ranges',  map.Mo, [[660, 1320]]);
  assertEq('schema Th ranges',  map.Th, [[660, 1320]]);
  assertEq('schema Sa ranges',  map.Sa, [[660, 1380]]);
  assertEq('schema Su closed',  map.Su, []);
  assertEq('schema serialize matches places serialize',
    serializeHoursDayMap(map),
    'Mo:0660-1320|Tu:0660-1320|We:0660-1320|Th:0660-1320|Fr:0660-1380|Sa:0660-1380|Su:closed'
  );
}

// --- Cross-source consistency: same hours -> same canonical key ----
{
  const placesText = [
    'Monday: 11:00 AM – 10:00 PM',
    'Tuesday: 11:00 AM – 10:00 PM'
  ];
  const schemaObjs = [{
    'openingHoursSpecification': [
      { 'dayOfWeek': 'Monday',  'opens': '11:00', 'closes': '22:00' },
      { 'dayOfWeek': 'Tuesday', 'opens': '11:00', 'closes': '22:00' }
    ]
  }];
  const placesKey = serializeHoursDayMap(parsePlacesHoursText(placesText));
  const schemaKey = serializeHoursDayMap(parseSchemaHoursObjects(schemaObjs));
  assertEq('cross-source match -> identical keys', placesKey, schemaKey);
  assert  ('cross-source match -> non-empty key',  placesKey.length > 0);
}

// --- Cross-source DRIFT: real-world skew flagged correctly ---------
// Owner closed early Sunday but never updated their schema.
{
  const places = parsePlacesHoursText([
    'Monday: 11:00 AM – 10:00 PM',
    'Sunday: 11:00 AM – 6:00 PM'   // closed earlier than schema
  ]);
  const schema = parseSchemaHoursObjects([{
    'openingHoursSpecification': [
      { 'dayOfWeek': 'Monday', 'opens': '11:00', 'closes': '22:00' },
      { 'dayOfWeek': 'Sunday', 'opens': '11:00', 'closes': '22:00' }
    ]
  }]);
  const placesKey = serializeHoursDayMap(places);
  const schemaKey = serializeHoursDayMap(schema);
  assert('drift -> different keys', placesKey !== schemaKey,
    'places=' + placesKey + ' schema=' + schemaKey);
}

// --- Multi-segment day matches across sources -----------------------
{
  const places = parsePlacesHoursText([
    'Tuesday: 11:00 AM – 2:30 PM, 5 PM – 10 PM'
  ]);
  // Schema source emits TWO openingHoursSpecification entries for the
  // same day to model the same lunch + dinner pattern.
  const schema = parseSchemaHoursObjects([{
    'openingHoursSpecification': [
      { 'dayOfWeek': 'Tuesday', 'opens': '11:00', 'closes': '14:30' },
      { 'dayOfWeek': 'Tuesday', 'opens': '17:00', 'closes': '22:00' }
    ]
  }]);
  assertEq('multi-segment match', serializeHoursDayMap(places), serializeHoursDayMap(schema));
}

// --- Schema entries arrive in reverse order -> still match ---------
{
  const a = parseSchemaHoursObjects([{
    'openingHoursSpecification': [
      { 'dayOfWeek': 'Tuesday', 'opens': '11:00', 'closes': '14:30' },
      { 'dayOfWeek': 'Tuesday', 'opens': '17:00', 'closes': '22:00' }
    ]
  }]);
  const b = parseSchemaHoursObjects([{
    'openingHoursSpecification': [
      { 'dayOfWeek': 'Tuesday', 'opens': '17:00', 'closes': '22:00' },
      { 'dayOfWeek': 'Tuesday', 'opens': '11:00', 'closes': '14:30' }
    ]
  }]);
  assertEq('reverse-order serializes identically',
    serializeHoursDayMap(a), serializeHoursDayMap(b));
}

// --- Empty / defensive inputs --------------------------------------
assertEq('parsePlacesHoursText null',  parsePlacesHoursText(null),  null);
assertEq('parsePlacesHoursText []',    parsePlacesHoursText([]),    null);
assertEq('parseSchemaHoursObjects null', parseSchemaHoursObjects(null), null);
assertEq('parseSchemaHoursObjects []',   parseSchemaHoursObjects([]),   null);
assertEq('serializeHoursDayMap null',  serializeHoursDayMap(null),  null);
assertEq('serializeHoursDayMap {}',    serializeHoursDayMap({}),    '');

// --- schema.org URI day form ----------------------------------------
{
  const objs = [{
    'openingHoursSpecification': [
      { 'dayOfWeek': 'https://schema.org/Monday', 'opens': '11:00', 'closes': '22:00' }
    ]
  }];
  const map = parseSchemaHoursObjects(objs);
  assertEq('URI day form recognized', map.Mo, [[660, 1320]]);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll hours-consistency tests passed.');
