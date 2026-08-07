#!/usr/bin/env node
/**
 * check-corrections-ledger.mjs — validates data/cost-index-corrections.json.
 *
 * THE ONE RULE THAT MATTERS: every correction must name a GATE THAT EXISTS ON
 * DISK. That field is the whole asset. A correction that says "we were wrong,
 * sorry" is a confession and decays into embarrassment. A correction that says
 * "we were wrong, here is the check script that now makes this specific error
 * impossible, run it yourself" is evidence the machine improved — and it is
 * falsifiable by a stranger in the same thirty seconds that no-llm-ci.sh is.
 *
 * The rest of the rules keep the ledger a RECORD rather than a document:
 *   · append-only — an id may never disappear or change meaning
 *   · ids are dense and ordered (COR-001, COR-002, ...)
 *   · every entry carries all five contract fields, none empty
 *   · brokeOn <= foundOn, both real dates, neither in the future
 *   · a `pending` entry must say WHY it is pending, in the open
 *
 * The append-only check runs against data/cost-index-corrections.lock.json, a
 * hash-per-id manifest this script maintains. Editing a published correction
 * changes its hash and fails the gate.
 *
 *   node scripts/check-corrections-ledger.mjs
 *   node scripts/check-corrections-ledger.mjs --self-test
 *   node scripts/check-corrections-ledger.mjs --seal   # record new ids into the lock
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER = 'data/cost-index-corrections.json';
const LOCK = 'data/cost-index-corrections.lock.json';
const rd = (p) => { try { return JSON.parse(readFileSync(path.join(REPO, p), 'utf8')); } catch { return null; } };

export const REQUIRED = ['id', 'published', 'correct', 'brokeOn', 'foundOn', 'why', 'gate', 'surface', 'status'];
export const hashEntry = (e) => createHash('sha256').update(JSON.stringify(REQUIRED.map((k) => e[k]))).digest('hex').slice(0, 16);

export function validate(ledger, lock, gateExists, today = new Date().toISOString().slice(0, 10)) {
  const errors = [];
  const list = (ledger && ledger.corrections) || [];
  if (!Array.isArray(list)) return ['corrections is not an array'];

  const seen = new Set();
  list.forEach((e, i) => {
    const at = `${e && e.id ? e.id : `corrections[${i}]`}`;
    for (const k of REQUIRED) {
      if (e[k] == null || String(e[k]).trim() === '') errors.push(`${at}: missing required field "${k}"`);
    }
    if (!/^COR-\d{3}$/.test(e.id || '')) errors.push(`${at}: id must match COR-NNN`);
    if (seen.has(e.id)) errors.push(`${at}: duplicate id`);
    seen.add(e.id);
    if (Number(String(e.id).slice(4)) !== i + 1) errors.push(`${at}: ids must be dense and in order — expected COR-${String(i + 1).padStart(3, '0')}`);

    // THE LOAD-BEARING RULE.
    if (e.gate && !gateExists(e.gate)) {
      errors.push(`${at}: names gate "${e.gate}", which does not exist on disk. A correction's gate field is the entire asset — it must be a script a reader can run.`);
    }
    for (const d of ['brokeOn', 'foundOn']) {
      if (e[d] && !/^\d{4}-\d{2}-\d{2}$/.test(e[d])) errors.push(`${at}: ${d} is not an ISO date`);
      if (e[d] && e[d] > today) errors.push(`${at}: ${d} (${e[d]}) is in the future`);
    }
    if (e.brokeOn && e.foundOn && e.brokeOn > e.foundOn) errors.push(`${at}: brokeOn ${e.brokeOn} is after foundOn ${e.foundOn}`);
    if (!['corrected', 'pending'].includes(e.status)) errors.push(`${at}: status must be "corrected" or "pending"`);
    if (e.status === 'pending' && !e.pendingNote) {
      errors.push(`${at}: a pending correction must carry a pendingNote saying what is still owed — a half-shipped fix stated openly is the point`);
    }

    const prior = lock && lock.entries && lock.entries[e.id];
    if (prior && prior !== hashEntry(e)) {
      errors.push(`${at}: a PUBLISHED correction was edited. This ledger is append-only — publish a new entry instead. (run --seal only for genuinely new ids)`);
    }
  });

  for (const id of Object.keys((lock && lock.entries) || {})) {
    if (!seen.has(id)) errors.push(`${id}: present in the lock but missing from the ledger — a published correction was deleted`);
  }
  return errors;
}

function selfTest() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  FAIL:', m); } };
  const base = {
    id: 'COR-001', published: 'p', correct: 'c', brokeOn: '2026-01-01', foundOn: '2026-02-01',
    why: 'w', gate: 'scripts/real.mjs', surface: 's', status: 'corrected',
  };
  const G = (f) => f === 'scripts/real.mjs';
  const L = { entries: {} };
  ok(validate({ corrections: [base] }, L, G).length === 0, 'a complete entry validates');
  ok(validate({ corrections: [{ ...base, gate: 'scripts/nope.mjs' }] }, L, G).some((e) => /does not exist on disk/.test(e)), 'THE RULE: a gate that does not exist fails');
  ok(validate({ corrections: [{ ...base, gate: '' }] }, L, G).some((e) => /missing required field "gate"/.test(e)), 'an empty gate field fails');
  ok(validate({ corrections: [{ ...base, status: 'pending' }] }, L, G).some((e) => /pendingNote/.test(e)), 'a pending entry with no note fails');
  ok(validate({ corrections: [{ ...base, brokeOn: '2026-03-01' }] }, L, G).some((e) => /is after foundOn/.test(e)), 'brokeOn after foundOn fails');
  ok(validate({ corrections: [{ ...base, foundOn: '2099-01-01' }] }, L, G).some((e) => /in the future/.test(e)), 'a future date fails');
  ok(validate({ corrections: [base, { ...base, id: 'COR-003' }] }, L, G).some((e) => /dense and in order/.test(e)), 'a gap in the id sequence fails');
  const sealed = { entries: { 'COR-001': hashEntry(base) } };
  ok(validate({ corrections: [base] }, sealed, G).length === 0, 'a sealed, unedited entry validates');
  ok(validate({ corrections: [{ ...base, correct: 'EDITED' }] }, sealed, G).some((e) => /append-only/.test(e)), 'APPEND-ONLY: editing a published correction fails');
  ok(validate({ corrections: [] }, sealed, G).some((e) => /deleted/.test(e)), 'deleting a published correction fails');
  console.log(`corrections-ledger self-test: ${pass}/${pass + fail} passed.`);
  return fail === 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  if (process.argv.includes('--self-test')) process.exit(selfTest() ? 0 : 1);

  const ledger = rd(LEDGER);
  if (!ledger) { console.error(`✗ corrections-ledger: ${LEDGER} is missing or unparsable.`); process.exit(1); }
  const lock = rd(LOCK) || { entries: {} };
  const gateExists = (g) => existsSync(path.join(REPO, g));

  if (process.argv.includes('--seal')) {
    const entries = { ...lock.entries };
    for (const e of ledger.corrections || []) if (!entries[e.id]) entries[e.id] = hashEntry(e);
    writeFileSync(path.join(REPO, LOCK), JSON.stringify({
      _doc: 'Hash-per-id seal for data/cost-index-corrections.json. Makes the ledger append-only: editing or deleting a PUBLISHED correction changes/loses a hash and fails check-corrections-ledger.mjs. Add new ids with --seal; never regenerate wholesale.',
      entries,
    }, null, 2) + '\n');
    console.log(`Sealed ${Object.keys(entries).length} correction(s) into ${LOCK}.`);
    process.exit(0);
  }

  const errors = validate(ledger, lock, gateExists);
  if (errors.length) {
    console.error(`✗ corrections-ledger: ${errors.length} problem(s):`);
    errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
  const list = ledger.corrections || [];
  const pending = list.filter((e) => e.status === 'pending').length;
  console.log(`✓ corrections-ledger: ${list.length} correction(s), every one naming a gate that exists on disk${pending ? `; ${pending} pending, each stating what is still owed` : ''}.`);
}
