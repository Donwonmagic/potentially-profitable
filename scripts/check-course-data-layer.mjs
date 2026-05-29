#!/usr/bin/env node
// Fixture-based test for src/lib/course.js (progress + config data
// layer). Runs against a mock KV namespace (in-memory Map) so it can
// exercise the round-trip without a worker runtime.
//
// What it asserts:
//   - emptyProgress shape is the default on first read.
//   - mergeProgress: track replace, completed upsert by lesson, sort
//     by `at`, latest-timestamp wins on dupe, cap at COMPLETED_MAX.
//   - mergeProgress: invalid track/lesson values get dropped silently
//     (don't corrupt state). startedAt is set-once.
//   - readProgress normalizes a hand-edited record back to schema.
//   - writeConfig: unknown top-level keys stripped, size cap enforced,
//     well-formed config round-trips.
//   - resetProgress: deletes both keys.
//
//   node scripts/check-course-data-layer.mjs

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const libUrl = pathToFileURL(path.join(repoRoot, 'src/lib/course.js')).href;

const {
  readProgress,
  mergeProgress,
  resetProgress,
  readConfig,
  writeConfig,
  CONSTANTS
} = await import(libUrl);

function makeMockEnv() {
  const store = new Map();
  return {
    _store: store,
    AUTH_SESSIONS: {
      async get(key)         { return store.has(key) ? store.get(key) : null; },
      async put(key, value)  { store.set(key, value); },
      async delete(key)      { store.delete(key); }
    }
  };
}

const failures = [];
let assertions = 0;

function eq(actual, expected, label) {
  assertions++;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
function truthy(v, label) {
  assertions++;
  if (!v) failures.push(`${label}: expected truthy, got ${JSON.stringify(v)}`);
}
function falsy(v, label) {
  assertions++;
  if (v) failures.push(`${label}: expected falsy, got ${JSON.stringify(v)}`);
}

const SUB = 'user-sub-abc-123';

// ---- fixture: empty read ----------------------------------------
{
  const env = makeMockEnv();
  const p = await readProgress(env, SUB);
  eq(p.track, null, 'empty.progress.track');
  eq(p.completed, [], 'empty.progress.completed');
  eq(p.v, CONSTANTS.SCHEMA_VERSION, 'empty.progress.v');

  const c = await readConfig(env, SUB);
  eq(c, null, 'empty.config returns null when no record');
}

// ---- fixture: track + completed merge ---------------------------
{
  const env = makeMockEnv();

  const r1 = await mergeProgress(env, SUB, {
    track: 'fresh',
    completed: [
      { lesson: 'welcome', at: 1000 },
      { lesson: 'one-promise', at: 2000 }
    ]
  });
  truthy(r1.ok, 'merge.first-write.ok');
  eq(r1.progress.track, 'fresh', 'merge.first.track');
  eq(r1.progress.completed.length, 2, 'merge.first.completed.length');
  truthy(r1.progress.startedAt, 'merge.first.startedAt set');

  // Second merge adds a new lesson + bumps timestamp on an existing.
  const r2 = await mergeProgress(env, SUB, {
    completed: [
      { lesson: 'welcome', at: 1500 },  // later than 1000 — should replace
      { lesson: 'customer', at: 3000 }  // new
    ]
  });
  truthy(r2.ok, 'merge.second.ok');
  eq(r2.progress.track, 'fresh', 'merge.second.track preserved');
  eq(r2.progress.completed.length, 3, 'merge.second.completed.length');
  const welcomeEntry = r2.progress.completed.find((e) => e.lesson === 'welcome');
  eq(welcomeEntry.at, 1500, 'merge.second.welcome.at updated to latest');

  // Third merge: same lesson with EARLIER timestamp should not replace.
  const r3 = await mergeProgress(env, SUB, {
    completed: [{ lesson: 'welcome', at: 500 }]
  });
  truthy(r3.ok, 'merge.third.ok');
  const welcomeAfterStale = r3.progress.completed.find((e) => e.lesson === 'welcome');
  eq(welcomeAfterStale.at, 1500, 'merge.third.welcome.at unchanged (stale at rejected)');

  // Read back — should match the last merge.
  const reread = await readProgress(env, SUB);
  eq(reread.completed.length, 3, 'reread.completed.length');
  eq(reread.track, 'fresh', 'reread.track');
}

// ---- fixture: validators reject bad input -----------------------
{
  const env = makeMockEnv();
  await mergeProgress(env, SUB, { track: 'fresh' });

  // Bad track values get ignored (track stays 'fresh').
  const r1 = await mergeProgress(env, SUB, { track: 'lazyriver' });
  eq(r1.progress.track, 'fresh', 'validator.bad-track ignored');

  const r2 = await mergeProgress(env, SUB, { track: '' });
  eq(r2.progress.track, 'fresh', 'validator.empty-track ignored');

  // Bad lesson slugs get filtered out (others survive).
  const r3 = await mergeProgress(env, SUB, {
    completed: [
      { lesson: 'WELCOME', at: 100 },               // uppercase — gets lowercased, passes
      { lesson: 'has spaces', at: 100 },            // spaces — fails
      { lesson: 'has/slashes', at: 100 },           // slashes — fails (matches fork paths only as full strings, but slug regex is alphanumeric+dash only)
      { lesson: 'one-promise', at: 100 }            // valid
    ]
  });
  truthy(r3.ok, 'validator.bad-slugs merge still returns ok');
  const slugs = r3.progress.completed.map((e) => e.lesson).sort();
  eq(slugs, ['one-promise', 'welcome'], 'validator.bad-slugs filtered, valid ones remain');

  // Slug over 50 chars gets dropped.
  const r4 = await mergeProgress(env, SUB, {
    completed: [{ lesson: 'a'.repeat(51), at: 100 }]
  });
  // Total count unchanged from r3 (no new valid entry).
  eq(r4.progress.completed.length, 2, 'validator.over-cap-slug dropped');
}

// ---- fixture: completed cap -------------------------------------
{
  const env = makeMockEnv();
  // Fill past the cap.
  const lots = [];
  for (let i = 0; i < CONSTANTS.COMPLETED_MAX + 10; i++) {
    lots.push({ lesson: 'lesson-' + i, at: 1000 + i });
  }
  const r = await mergeProgress(env, SUB, { completed: lots });
  truthy(r.ok, 'cap.merge.ok');
  eq(r.progress.completed.length, CONSTANTS.COMPLETED_MAX, 'cap.length === COMPLETED_MAX');
  // The latest entries should win — slice(-MAX) keeps the most recent.
  const oldest = r.progress.completed[0];
  truthy(oldest.lesson.startsWith('lesson-'), 'cap.oldest-kept is still a lesson- entry');
}

// ---- fixture: config replace + size cap -------------------------
{
  const env = makeMockEnv();

  // Well-formed config — known keys + an unknown key that should get stripped.
  const r1 = await writeConfig(env, SUB, {
    restaurantProfile: { name: "Jolene's", cuisine: 'Breakfast' },
    palette: ['#2A4F3B', '#F5EFE3', '#1A1A1A'],
    onePromise: 'A test promise.',
    dishes: [{ name: 'Pancakes', price: '9' }],
    hours: { monday: { closed: true } },
    rogue_field: 'should be stripped'
  });
  truthy(r1.ok, 'config.write.ok');
  eq(r1.config.rogue_field, undefined, 'config.rogue-field stripped');
  eq(r1.config.restaurantProfile.name, "Jolene's", 'config.restaurantProfile preserved');

  // Read back — unknown key gone, allowed keys preserved.
  const c = await readConfig(env, SUB);
  truthy(c, 'config.read returns non-null');
  eq(c.rogue_field, undefined, 'config.reread.rogue-field still stripped');
  eq(c.onePromise, 'A test promise.', 'config.reread.onePromise');

  // Size cap — payload over 16 KB rejected.
  const huge = { customerParagraph: 'x'.repeat(CONSTANTS.CONFIG_MAX_BYTES + 100) };
  const rHuge = await writeConfig(env, SUB, huge);
  falsy(rHuge.ok, 'config.too-large rejected');
  eq(rHuge.error, 'too-large', 'config.too-large.error');
  truthy(rHuge.max === CONSTANTS.CONFIG_MAX_BYTES, 'config.too-large.max reported');
  truthy(rHuge.size > CONSTANTS.CONFIG_MAX_BYTES, 'config.too-large.size reported');

  // Read after rejected write — the previous good config still wins.
  const cAfter = await readConfig(env, SUB);
  truthy(cAfter, 'config.read after rejected write');
  eq(cAfter.restaurantProfile.name, "Jolene's", 'config.read after reject preserves last good');
}

// ---- fixture: reset deletes both keys ---------------------------
{
  const env = makeMockEnv();
  await mergeProgress(env, SUB, {
    track: 'shared',
    completed: [{ lesson: 'welcome', at: 1000 }]
  });
  await writeConfig(env, SUB, {
    restaurantProfile: { name: 'Test' }
  });

  // Both records present.
  truthy(env._store.has(CONSTANTS.PROGRESS_KEY_PREFIX + SUB), 'reset.before.progress present');
  truthy(env._store.has(CONSTANTS.CONFIG_KEY_PREFIX + SUB), 'reset.before.config present');

  const r = await resetProgress(env, SUB);
  truthy(r.ok, 'reset.ok');

  // Both records gone.
  falsy(env._store.has(CONSTANTS.PROGRESS_KEY_PREFIX + SUB), 'reset.after.progress deleted');
  falsy(env._store.has(CONSTANTS.CONFIG_KEY_PREFIX + SUB), 'reset.after.config deleted');

  // Read after reset returns the default empty shape.
  const p = await readProgress(env, SUB);
  eq(p.track, null, 'reset.read.track');
  eq(p.completed, [], 'reset.read.completed');
}

// ---- fixture: normalizeProgress handles legacy/hand-edited record
{
  const env = makeMockEnv();
  // Stuff a hand-edited blob into KV — schema-incompliant on purpose.
  env._store.set(CONSTANTS.PROGRESS_KEY_PREFIX + SUB, JSON.stringify({
    track: 'invalid-track-from-prior-version',
    completed: [
      { lesson: 'welcome' },                          // no at
      { lesson: 'BAD SLUG', at: 1000 },               // bad slug
      { lesson: 'one-promise', at: 'not-a-number' },  // bad at
      { lesson: 'customer', at: 1500 },               // valid
      'totally not an object'                         // not an object
    ],
    extraField: 'should be dropped on normalize'
  }));

  const p = await readProgress(env, SUB);
  eq(p.track, null, 'normalize.bad-track → null');
  // Only the two with valid slugs survive — 'welcome' (at=null) and 'customer' (at=1500).
  // 'one-promise' has at='not-a-number' → at coerced to null but lesson valid → kept.
  const slugs = p.completed.map((e) => e.lesson).sort();
  eq(slugs, ['customer', 'one-promise', 'welcome'], 'normalize.completed valid slugs preserved');
  eq(p.extraField, undefined, 'normalize.extraField stripped');
}

// ---- fixture: celebrations field — schema-additive, first-write-wins
{
  const env = makeMockEnv();

  // First fire: M1 celebration records at t=1000.
  const r1 = await mergeProgress(env, SUB, {
    celebrations: { 'm1-orient': 1000 }
  });
  truthy(r1.ok, 'cele.first-write.ok');
  eq(r1.progress.celebrations['m1-orient'], 1000, 'cele.first-write.timestamp recorded');

  // Second fire: same key with LATER timestamp — first-write-wins, stale rejected.
  const r2 = await mergeProgress(env, SUB, {
    celebrations: { 'm1-orient': 2000 }
  });
  eq(r2.progress.celebrations['m1-orient'], 1000, 'cele.first-write-wins (later timestamp ignored)');

  // Different key adds independently.
  const r3 = await mergeProgress(env, SUB, {
    celebrations: { 'm2-decide': 3000, 'bootcamp': 4000 }
  });
  eq(r3.progress.celebrations['m1-orient'], 1000, 'cele.previous-key preserved');
  eq(r3.progress.celebrations['m2-decide'], 3000, 'cele.new-key recorded');
  eq(r3.progress.celebrations['bootcamp'],   4000, 'cele.bootcamp-key recorded');

  // Unknown keys (e.g. 'm4-launch' which we intentionally never fire) get dropped.
  const r4 = await mergeProgress(env, SUB, {
    celebrations: { 'm4-launch': 5000, 'something-else': 6000 }
  });
  eq(r4.progress.celebrations['m4-launch'], undefined, 'cele.m4-launch key dropped (off-allowlist)');
  eq(r4.progress.celebrations['something-else'], undefined, 'cele.unknown-key dropped');

  // Bogus values (negative, zero, NaN, strings) get rejected silently.
  const r5 = await mergeProgress(env, SUB, {
    celebrations: { 'm3-assemble': -100 }
  });
  eq(r5.progress.celebrations['m3-assemble'], undefined, 'cele.negative-timestamp rejected');

  const r6 = await mergeProgress(env, SUB, {
    celebrations: { 'm3-assemble': 'soon' }
  });
  eq(r6.progress.celebrations['m3-assemble'], undefined, 'cele.string-timestamp rejected');

  // Read back — round-trip preserves the 3 valid keys.
  const reread = await readProgress(env, SUB);
  eq(reread.celebrations['m1-orient'], 1000, 'cele.reread.m1');
  eq(reread.celebrations['m2-decide'], 3000, 'cele.reread.m2');
  eq(reread.celebrations['bootcamp'],   4000, 'cele.reread.bootcamp');
}

// ---- fixture: legacy v1 record without celebrations field reads cleanly
{
  const env = makeMockEnv();
  // Simulate an older client that wrote progress before celebrations
  // shipped — record has completed[] but no celebrations field.
  await env.AUTH_SESSIONS.put('course:' + SUB, JSON.stringify({
    track: 'fresh',
    completed: [{ lesson: 'welcome', at: 100 }],
    startedAt: 100,
    updatedAt: 100,
    v: 1
  }));

  const p = await readProgress(env, SUB);
  eq(typeof p.celebrations, 'object', 'legacy-read.celebrations is object');
  eq(Object.keys(p.celebrations).length, 0, 'legacy-read.celebrations defaults to empty');
  eq(p.completed.length, 1, 'legacy-read.completed preserved');
}

// ---- fixture: reset clears celebrations along with progress -----
{
  const env = makeMockEnv();
  await mergeProgress(env, SUB, {
    completed: [{ lesson: 'welcome', at: 100 }],
    celebrations: { 'm1-orient': 100 }
  });
  await resetProgress(env, SUB);
  const after = await readProgress(env, SUB);
  eq(after.completed.length, 0, 'reset.completed cleared');
  eq(Object.keys(after.celebrations).length, 0, 'reset.celebrations cleared');
}

// ---- report -----------------------------------------------------
console.log(`\n[course-data-layer] Ran ${assertions} assertion(s).`);

if (failures.length) {
  console.log(`\n[course-data-layer] FAIL — ${failures.length} assertion(s) failed:`);
  for (const f of failures) console.log(`  • ${f}`);
  process.exit(1);
}

console.log('[course-data-layer] OK — all assertions passed.');
process.exit(0);
