#!/usr/bin/env node
/**
 * check-working-set.mjs — the forgetting gate.
 *
 * ============================== WHY ==============================
 *
 * A forgetting policy already exists in this repo and it LOSES. The board was
 * consolidated to 252 lines on 2026-07-17 with the note "consolidated to load in
 * one read", and reached 1,504 lines within fourteen days across three further
 * manual compactions, each re-inflated inside 48 hours. Decay implemented as a
 * chore loses to write pressure 3 out of 3 times measured. Meanwhile the store
 * is 87.8% log by line and the fact-lines are the part that has gone false.
 *
 * So this gate does not ask anyone to tidy. It declares a WORKING SET — the
 * documents a session is actually told to read — gives it a line budget, and
 * fails when the budget is exceeded. Growing the working set requires retiring
 * from it in the same commit. That is the same one-in-one-out policy
 * `data/queue.json` already applies to mechanisms, applied to memory.
 *
 * ============================ THE THREE STATES ============================
 *
 * Every .md under the declared roots is exactly one of:
 *
 *   working    a session is pointed at it. Counted against the budget.
 *   reference  retrievable on demand, cited by something, not read by default.
 *   archive    under docs/archive/. Out of the working set. Git still holds it.
 *
 * There is no fourth state and no silent state. An unclassified file FAILS,
 * which is the same shape as check-gate-coverage.mjs (wired / UNWIRED / nothing
 * else) — the one meta-gate in this repo that demonstrably forced its own
 * registry to be cleaned when PR #530 deleted a script.
 *
 * ====================== THE FACTS / SKILLS / LOGS RATIO ======================
 *
 * A working-set document is additionally classified by SECTION into:
 *
 *   FACTS   durable claims about how things are
 *   SKILLS  runbooks, gotchas, operating procedure — how to do a thing
 *   LOGS    episodic narration of what happened
 *
 * Logs do not belong in the working set: `git log` already holds them, better,
 * with authorship and diffs. A working-set file above `budget.maxLogRatio` log
 * lines fails. This is the assertion that actually bites the board.
 *
 * ============================ HONEST LIMITS ============================
 *
 * Classification is a heuristic over headings and line markers, declared in
 * SECTION_KIND and LINE_LOG below. It is not semantic. It will mis-file a
 * runbook written in the past tense. That is why it reports the ratio with its
 * evidence rather than silently rewriting anything, and why the failure message
 * names the specific sections it counted.
 *
 * Usage:
 *   node scripts/check-working-set.mjs            # the gate
 *   node scripts/check-working-set.mjs --report   # the full classification
 *   node scripts/check-working-set.mjs --json
 *   node scripts/check-working-set.mjs --self-test
 *
 * Exit codes:
 *   0  working set inside budget, every file classified, no over-log file
 *   1  budget exceeded, an unclassified file, or a log-heavy working-set file
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const MANIFEST = path.join(REPO, 'docs', 'contracts', 'working-set.json');

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const asReport = argv.includes('--report');
const selfTest = argv.includes('--self-test');

/**
 * ROOTS — everything this gate is responsible for.
 *
 * Per SF-ROOT-LIST: it walks all of them and carries an explicit skip list
 * where every entry says why that path is not a document a session reads.
 */
const ROOTS = ['docs', 'CLAUDE.md'];

const SKIP = {
  'docs/archive': 'The archive itself. Being here IS the retired state; counting it would make retirement free of effect.',
  'docs/handoff/bones': 'Generated + dated foundation documents from the 2026-08 engagement. Frozen findings, not instructions; classified `reference` wholesale by the manifest.',
  'docs/drafts': 'Unpublished drafts. Not instructions to anyone; deleted or promoted, never read as guidance.',
  'docs/seo-drafts': 'Drafts for the retired web-design line. Off-funnel by CLAUDE.md; scheduled for archive, not read.',
  'docs/release-notes': 'Dated release notes. Episodic by construction — the same content git log holds.',
};

/** Section headings that mark a section as LOG or SKILLS. Everything else is FACTS. */
const SECTION_KIND = [
  [/CURRENT STATE|SESSION \d|^#+\s*(?:🟣|⮕)?\s*SESSION|RE-AUDIT|this session|thread landed|Older open threads|Prior state/i, 'log'],
  [/Runbook|Gotcha|Operating mode|How to|Checklist|Recipe/i, 'skills'],
];

/** Line-level log markers, used for the ratio inside a section. */
const LINE_LOG = [
  /\b[0-9a-f]{7,40}\b/, // commit sha
  /\bPR #\d+|\(#\d{2,4}\)/, // pull request
  /\b(shipped|landed|merged|pushed|committed|reverted|re-rendered|regenerated)\b/i,
];

// ---------------------------------------------------------------------------

function loadManifest() {
  if (!fs.existsSync(MANIFEST)) {
    console.error(`check-working-set: missing ${path.relative(REPO, MANIFEST)}. This gate has no policy without it.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const abs = path.join(dir, e.name);
    const rel = path.relative(REPO, abs);
    if (e.isDirectory()) {
      if (SKIP[rel]) continue;
      walk(abs, out);
    } else if (e.name.endsWith('.md')) {
      out.push(rel);
    }
  }
  return out;
}

function collect() {
  const out = [];
  for (const r of ROOTS) {
    const abs = path.join(REPO, r);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else out.push(r);
  }
  return out.sort();
}

/** Classify a file's lines into facts / skills / logs by section. */
export function classify(text) {
  const lines = text.split('\n');
  const sections = [];
  let cur = { heading: '(preamble)', kind: 'facts', start: 1, lines: [] };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,3}\s/.test(l)) {
      sections.push(cur);
      let kind = 'facts';
      for (const [re, k] of SECTION_KIND) {
        if (re.test(l)) {
          kind = k;
          break;
        }
      }
      cur = { heading: l.replace(/^#+\s*/, '').slice(0, 90), kind, start: i + 1, lines: [] };
    }
    cur.lines.push(l);
  }
  sections.push(cur);

  const totals = { facts: 0, skills: 0, logs: 0 };
  for (const s of sections) {
    if (s.kind === 'log') {
      totals.logs += s.lines.length;
      s.logLines = s.lines.length;
    } else {
      // Inside a non-log section, individual lines can still be log lines.
      let logish = 0;
      for (const l of s.lines) if (LINE_LOG.some((re) => re.test(l))) logish++;
      totals.logs += logish;
      totals[s.kind === 'skills' ? 'skills' : 'facts'] += s.lines.length - logish;
      s.logLines = logish;
    }
  }
  const total = lines.length;
  return { total, ...totals, logRatio: total ? totals.logs / total : 0, sections };
}

// ---------------------------------------------------------------------------

if (selfTest) {
  const sample = [
    '# Doc',
    'A durable fact about the system.',
    '## CURRENT STATE — thread 2026-01-01',
    'we shipped a thing',
    'and another thing',
    '## Runbooks',
    'To rebuild, run node scripts/x.mjs',
  ].join('\n');
  const c = classify(sample);
  let bad = 0;
  if (c.logs < 3) {
    console.error(`  FAIL  CURRENT STATE section not counted as log (logs=${c.logs})`);
    bad++;
  }
  if (!c.sections.some((s) => s.kind === 'skills')) {
    console.error('  FAIL  Runbooks section not classified skills');
    bad++;
  }
  if (!c.sections.some((s) => s.kind === 'facts')) {
    console.error('  FAIL  no facts section');
    bad++;
  }
  console.log(bad === 0 ? 'check-working-set self-test: OK (3 assertions)' : `check-working-set self-test: ${bad} FAILURES`);
  process.exit(bad ? 1 : 0);
}

const manifest = loadManifest();
const files = collect();
const classified = new Map(Object.entries(manifest.classification));

/**
 * Directory defaults. ADRs are decisions of record (ADR-028 §6) and are excluded
 * by RULE, not by enumeration — otherwise writing an ADR reds this gate, which
 * would teach people not to write ADRs. Everything else must be named.
 */
for (const [prefix, entry] of Object.entries(manifest.defaults || {})) {
  for (const f of files) {
    if (f.startsWith(prefix) && !classified.has(f)) classified.set(f, entry);
  }
}

const unclassified = files.filter((f) => !classified.has(f));
const missingOnDisk = [...classified.keys()].filter((f) => !fs.existsSync(path.join(REPO, f)));

const rows = [];
for (const f of files) {
  const entry = classified.get(f);
  if (!entry) continue;
  const text = fs.readFileSync(path.join(REPO, f), 'utf8');
  const c = classify(text);
  rows.push({ file: f, set: entry.set, why: entry.why, generated: !!entry.generated, ...c, sections: undefined, _sections: c.sections });
}

const working = rows.filter((r) => r.set === 'working');
/**
 * GENERATED working documents are reported but NOT budgeted.
 *
 * docs/handoff/QUEUE.md is rendered from data/queue.json and its length is a
 * function of how much OPEN WORK exists. Budgeting it would punish the one
 * mechanism in this company that converts a finding into work, and the only way
 * to clear the red would be to close or delete queue items — which is either
 * real progress (fine, but not something a budget should demand) or deletion of
 * work nobody did (exactly the disease). The budget exists to stop HAND-WRITTEN
 * prose accumulating; that is what it counts.
 */
const authored = working.filter((r) => !r.generated);
const generated = working.filter((r) => r.generated);
const workingLines = authored.reduce((a, r) => a + r.total, 0);
const generatedLines = generated.reduce((a, r) => a + r.total, 0);
const budget = manifest.budget.lines;
const maxLogRatio = manifest.budget.maxLogRatio;

const overLog = working.filter((r) => r.logRatio > maxLogRatio && !manifest.budget.logRatioAllow?.[r.file]);

if (asJson) {
  console.log(
    JSON.stringify(
      {
        asOf: new Date().toISOString().slice(0, 10),
        budget: manifest.budget,
        workingLines,
        generatedLines,
        workingFiles: working.length,
        totals: {
          facts: working.reduce((a, r) => a + r.facts, 0),
          skills: working.reduce((a, r) => a + r.skills, 0),
          logs: working.reduce((a, r) => a + r.logs, 0),
        },
        rows: rows.map((r) => ({ file: r.file, set: r.set, generated: r.generated, total: r.total, facts: r.facts, skills: r.skills, logs: r.logs, logRatio: +r.logRatio.toFixed(3) })),
        unclassified,
        missingOnDisk,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (asReport) {
  const bySet = { working: [], reference: [], archive: [] };
  for (const r of rows) (bySet[r.set] ||= []).push(r);
  for (const set of ['working', 'reference', 'archive']) {
    const list = (bySet[set] || []).sort((a, b) => b.total - a.total);
    const sum = list.reduce((a, r) => a + r.total, 0);
    console.log(`\n=== ${set.toUpperCase()} — ${list.length} files, ${sum} lines ===`);
    for (const r of list.slice(0, 30)) {
      console.log(
        `  ${String(r.total).padStart(5)}  F${String(r.facts).padStart(5)} S${String(r.skills).padStart(4)} L${String(r.logs).padStart(5)}  (${(r.logRatio * 100).toFixed(0)}% log)  ${r.file}`,
      );
    }
    if (list.length > 30) console.log(`  … ${list.length - 30} more`);
  }
}

let bad = 0;
const say = (s) => console.error(s);

if (unclassified.length) {
  say(`check-working-set: ${unclassified.length} document(s) are in neither the working set, the reference set, nor the archive.`);
  say('  There is no fourth state. Add each to docs/contracts/working-set.json#classification with a `set` and a `why`.');
  for (const f of unclassified.slice(0, 40)) say('  UNCLASSIFIED  ' + f);
  if (unclassified.length > 40) say(`  … ${unclassified.length - 40} more`);
  bad = 1;
}

if (missingOnDisk.length) {
  say(`check-working-set: ${missingOnDisk.length} classified path(s) no longer exist. The registry has outlived what it documents.`);
  for (const f of missingOnDisk) say('  STALE  ' + f);
  bad = 1;
}

if (workingLines > budget) {
  say(`check-working-set: WORKING SET OVER BUDGET — ${workingLines} authored lines against a budget of ${budget} (plus ${generatedLines} generated lines, not budgeted).`);
  say('  Growing the working set requires retiring from it in the same commit (SF-RETIRE-ONE).');
  say('  Largest authored working-set documents:');
  for (const r of [...authored].sort((a, b) => b.total - a.total).slice(0, 8)) {
    say(`    ${String(r.total).padStart(5)} lines  ${(r.logRatio * 100).toFixed(0)}% log  ${r.file}`);
  }
  say('  Move one to `reference`, or to docs/archive/ and set `archive`. Do not raise the budget without an ADR.');
  bad = 1;
}

for (const r of overLog) {
  say(
    `check-working-set: ${r.file} is ${(r.logRatio * 100).toFixed(0)}% log (${r.logs} of ${r.total} lines), over the ${(maxLogRatio * 100).toFixed(0)}% ceiling.`,
  );
  const worst = r._sections.filter((s) => s.kind === 'log').sort((a, b) => b.lines.length - a.lines.length).slice(0, 4);
  for (const s of worst) say(`    ${String(s.lines.length).padStart(5)} lines at :${s.start}  ${s.heading}`);
  say('    Episodic narration belongs in git log. Move these sections to docs/archive/ or delete them.');
  bad = 1;
}

const t = {
  facts: working.reduce((a, r) => a + r.facts, 0),
  skills: working.reduce((a, r) => a + r.skills, 0),
  logs: working.reduce((a, r) => a + r.logs, 0),
};
const allWorkingLines = workingLines + generatedLines;
const pct = (n) => ((n / Math.max(1, allWorkingLines)) * 100).toFixed(1) + '%';

if (!bad) {
  console.log(
    `check-working-set: OK — ${working.length} working documents, ${workingLines}/${budget} authored lines (+${generatedLines} generated) ` +
      `(FACTS ${t.facts} ${pct(t.facts)} · SKILLS ${t.skills} ${pct(t.skills)} · LOGS ${t.logs} ${pct(t.logs)}); ` +
      `${rows.filter((r) => r.set === 'reference').length} reference, ${rows.filter((r) => r.set === 'archive').length} archived.`,
  );
} else {
  say(
    `\ncheck-working-set: working set is ${allWorkingLines} lines (${workingLines} authored + ${generatedLines} generated) — ` +
      `FACTS ${t.facts} ${pct(t.facts)}, SKILLS ${t.skills} ${pct(t.skills)}, LOGS ${t.logs} ${pct(t.logs)}.`,
  );
}
process.exit(bad);
