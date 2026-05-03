#!/usr/bin/env node
/**
 * Invoice Decoder — EN ↔ ES parity check (Wave D.10).
 *
 * Validates that the Spanish mirror at es/tools/invoice-decoder/index.html
 * keeps structural parity with the English original at
 * tools/invoice-decoder/index.html, plus that every `tt(en, es)` call
 * site in the shared JS modules supplies both languages.
 *
 * What it catches:
 *   1. id="..." attributes present in EN but missing in ES (or vice
 *      versa). The most common drift cause: someone adds a feature
 *      to the EN file and forgets the ES mirror, leaving Spanish
 *      operators with broken JS that queries by id.
 *   2. Heading / button / details counts that diverge between EN and
 *      ES — a heuristic for "the ES file is missing an entire UX
 *      section."
 *   3. Stray <script src="..."> entries in EN missing from ES (or
 *      vice versa). Both mirrors load the same /tools/invoice-decoder
 *      modules, so the script tag list should match exactly.
 *   4. tt() call sites with only one argument — almost always a
 *      missing translation. Flags `tt('only en text')` while
 *      accepting the canonical `tt('en', 'es')` shape.
 *
 * What it intentionally does NOT catch:
 *   - String-content drift between EN and ES (translation quality is
 *     a human concern, not a structural one).
 *   - Re-orderings within sections (acceptable as long as ids match).
 *   - Whitespace / formatting differences.
 *
 * Exit codes:
 *   0 — parity holds; safe to merge.
 *   1 — drift detected; report printed to stdout. Fix in the same
 *     PR before merge.
 *
 * Usage:
 *   node scripts/check-invoice-decoder-i18n-parity.mjs
 *   (Add --verbose for the full id sets when debugging a diff.)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const verbose = process.argv.includes('--verbose');
// Strict mode: exit non-zero on ANY drift, even drift listed in the
// allowlist below. Default: report-only — catches NEW drift, ignores
// pre-existing drift that pre-dates this script. Once the allowlist
// is empty, the script can become part of CI with no flag changes.
const strict = process.argv.includes('--strict');

// ----------------------- Expected-drift allowlist -----------------------
// Pre-existing EN/ES drift that pre-dates this script. Each entry is
// expected to be REMOVED over time as the ES mirror catches up. Any
// id NOT on this list that appears as missing should fail the check.
//
// To remove an entry: add the missing id (or remove it from EN) and
// delete it from this list in the same PR.
const EXPECTED_ID_DRIFT = {
  // ids present in EN but missing from ES (pre-existing as of the
  // script's introduction, Wave D.10).
  missingFromEs: new Set([
    'idBulkCount',     // bulk-confirm row counter; mirrored markup not yet in ES
    'idBulkUndo',
    'idBulkUndoBtn',
    'idBulkUndoFill',
    'idBulkUndoMsg',
    'idCsvBlurb',      // ES CSV chip uses inline copy without aria-describedby
    'idFirstRun',      // first-run sample-demo strip not yet in ES
    'idPdfBlurb',      // ES PDF chip uses inline copy without aria-describedby
    'idPhotoBlurb',    // ES photo chip uses inline copy without aria-describedby
    'idSortToggle',    // sort-by-confidence toggle
    'langHint',        // language-mismatch banner
    'langHintDismiss'  // its dismiss button
  ]),
  missingFromEn: new Set([])
};
const EXPECTED_TAG_COUNT_DRIFT = {
  // ES has fewer of these because the bulk-undo banner, first-run
  // strip, and sort-toggle aren't mirrored yet (see EXPECTED_ID_DRIFT
  // above). The diffs here track what we expect; a different number
  // means the drift has CHANGED and warrants a look. When you add an
  // element to BOTH mirrors, bump both numbers in lockstep here so
  // the script's baseline stays accurate.
  h2:      { en: 3, es: 2 },
  h3:      { en: 4, es: 5 },
  button:  { en: 24, es: 18 },  // Wave E.5: +1 each side for #idPrivacyTestBtn
  details: { en: 7, es: 3 },
  summary: { en: 7, es: 3 },
  aside:   { en: 4, es: 3 },
  header:  { en: 1, es: 2 }
};

const EN_HTML = resolve(repoRoot, 'tools/invoice-decoder/index.html');
const ES_HTML = resolve(repoRoot, 'es/tools/invoice-decoder/index.html');
// Shared JS modules — both mirrors load these so any tt() drift here
// affects both. We only check the controller (which is where most
// user-visible strings live); per-module checks could be added if a
// pattern of regressions emerges in another file.
const SHARED_JS = [
  'tools/invoice-decoder/invoice-decoder.js',
  'tools/invoice-decoder/onboarding.js',
  'tools/invoice-decoder/proof-flyout.js',
  'tools/invoice-decoder/passphrase-modal.js'
].map(p => resolve(repoRoot, p));

// ----------------------- Helpers -----------------------

function readSafe(path) {
  if (!existsSync(path)) {
    console.error(`error: file not found: ${path}`);
    process.exit(1);
  }
  return readFileSync(path, 'utf8');
}

function extractIds(html) {
  const ids = new Set();
  // Match id="..." and id='...' (single or double quoted). Excludes
  // inline JS-string id concatenations (id="' + foo + '" etc.) by
  // requiring the value to be a plain literal.
  const re = /\sid="([^"<>]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    ids.add(m[1]);
  }
  return ids;
}

function countTag(html, tag) {
  // Counts opening tag occurrences, ignoring self-closing / void.
  // Tolerates attributes after the tag name. Misses the rare case
  // of a tag commented out with HTML comments — acceptable: an
  // operator who comments out a tag in EN but not ES will eventually
  // hit the id-set check.
  const re = new RegExp(`<${tag}\\b`, 'gi');
  return (html.match(re) || []).length;
}

function extractScriptSrcs(html) {
  const srcs = new Set();
  // Match <script src="..."> with single or double quotes and an
  // optional ?v=... query suffix. We strip the query to compare
  // by module identity, since EN and ES mirrors don't have to
  // bump version strings in lockstep.
  const re = /<script[^>]*\ssrc=["']([^"'?]+)(?:\?[^"']*)?["']/g;
  let m;
  while ((m = re.exec(html))) {
    srcs.add(m[1]);
  }
  return srcs;
}

function diffSets(a, b) {
  const onlyInA = [...a].filter(x => !b.has(x)).sort();
  const onlyInB = [...b].filter(x => !a.has(x)).sort();
  return { onlyInA, onlyInB };
}

// Check tt() call sites: every tt(...) should have exactly two
// string arguments. We're permissive about what's IN the strings
// (commas, dollars, escaped quotes) but strict about the count.
//
// The regex is best-effort: it matches the first two arguments and
// flags calls where the second arg is missing or where the first
// arg is followed by something other than a comma. This catches:
//   tt('only english')               → flagged (single arg)
//   tt('en text')                    → flagged
//   tt('en', undefined)              → not flagged (but caught at runtime)
//   tt('en' + foo, 'es' + bar)       → not flagged (computed args OK)
//
// It will miss some pathological shapes (multi-line concatenated
// strings split across lines) but those are rare in this codebase.
function findBareTtCalls(jsSrc, filePath) {
  const issues = [];
  // Iterate line-by-line so we can report the exact line in error
  // messages. This walks the file once, O(n).
  const lines = jsSrc.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip lines without tt(
    if (line.indexOf('tt(') === -1) continue;
    // Skip pure comment lines — `tt()` mentioned in documentation
    // shouldn't trip the check. We're conservative: only skip when
    // the WHOLE line up to the first `tt(` is whitespace + comment.
    const idxOfTt = line.indexOf('tt(');
    const before = line.slice(0, idxOfTt);
    if (/^\s*(\/\/|\*|\/\*)/.test(before)) continue;
    // Find every tt( call on this line and inspect its arguments.
    let idx = 0;
    while (true) {
      const at = line.indexOf('tt(', idx);
      if (at === -1) break;
      // Walk forward, counting parens, to find the matching close.
      let depth = 1;
      let j = at + 3;
      let inStr = null;
      let escaping = false;
      while (j < line.length && depth > 0) {
        const c = line[j];
        if (escaping) { escaping = false; j++; continue; }
        if (c === '\\') { escaping = true; j++; continue; }
        if (inStr) {
          if (c === inStr) inStr = null;
        } else if (c === '"' || c === "'") {
          inStr = c;
        } else if (c === '(') depth++;
        else if (c === ')') depth--;
        j++;
      }
      if (depth !== 0) {
        // Multi-line call — skip; can't reliably count args here.
        idx = at + 3;
        continue;
      }
      const argText = line.slice(at + 3, j - 1);
      // Count commas at depth 0 in argText (not inside strings).
      let commas = 0;
      let depth2 = 0;
      let inStr2 = null;
      let esc2 = false;
      for (let k = 0; k < argText.length; k++) {
        const c = argText[k];
        if (esc2) { esc2 = false; continue; }
        if (c === '\\') { esc2 = true; continue; }
        if (inStr2) { if (c === inStr2) inStr2 = null; continue; }
        if (c === '"' || c === "'") { inStr2 = c; continue; }
        if (c === '(' || c === '[' || c === '{') depth2++;
        else if (c === ')' || c === ']' || c === '}') depth2--;
        else if (c === ',' && depth2 === 0) commas++;
      }
      // A valid tt() call has exactly one top-level comma (separating
      // EN from ES). 0 commas → bare; 2+ commas → maybe options arg
      // we don't use, flag for human review.
      if (commas !== 1) {
        issues.push({
          file: filePath,
          line: i + 1,
          snippet: line.trim().slice(0, 120),
          reason: commas === 0 ? 'tt() called with single argument' : `tt() called with ${commas + 1} arguments — expected 2`
        });
      }
      idx = j;
    }
  }
  return issues;
}

// ----------------------- Run checks -----------------------

const en = readSafe(EN_HTML);
const es = readSafe(ES_HTML);

let failed = false;

// 1. id="..." set parity (with allowlist)
const enIds = extractIds(en);
const esIds = extractIds(es);
const idDiff = diffSets(enIds, esIds);
const newMissingFromEs = idDiff.onlyInA.filter(id => !EXPECTED_ID_DRIFT.missingFromEs.has(id));
const newMissingFromEn = idDiff.onlyInB.filter(id => !EXPECTED_ID_DRIFT.missingFromEn.has(id));
const expectedMissingFromEs = idDiff.onlyInA.filter(id => EXPECTED_ID_DRIFT.missingFromEs.has(id));
const expectedMissingFromEn = idDiff.onlyInB.filter(id => EXPECTED_ID_DRIFT.missingFromEn.has(id));
const ghostExpectedFromEs = [...EXPECTED_ID_DRIFT.missingFromEs].filter(id => !idDiff.onlyInA.includes(id));
const ghostExpectedFromEn = [...EXPECTED_ID_DRIFT.missingFromEn].filter(id => !idDiff.onlyInB.includes(id));

if (newMissingFromEs.length || newMissingFromEn.length || (strict && (expectedMissingFromEs.length || expectedMissingFromEn.length))) {
  failed = true;
  console.log('\n⛔  HTML id="..." parity MISMATCH between EN and ES mirrors');
  if (newMissingFromEs.length) {
    console.log(`    NEW drift — missing from ES (${newMissingFromEs.length}):`);
    newMissingFromEs.forEach(id => console.log(`      - ${id}`));
  }
  if (newMissingFromEn.length) {
    console.log(`    NEW drift — missing from EN (${newMissingFromEn.length}):`);
    newMissingFromEn.forEach(id => console.log(`      - ${id}`));
  }
  if (strict && expectedMissingFromEs.length) {
    console.log(`    Expected drift (allowlisted) missing from ES — ${expectedMissingFromEs.length} entries`);
  }
} else {
  console.log(`✓  HTML id parity (${enIds.size} ids EN, ${esIds.size} ES; ${expectedMissingFromEs.length + expectedMissingFromEn.length} known pre-existing drift entries allowlisted)`);
}
if (ghostExpectedFromEs.length || ghostExpectedFromEn.length) {
  // Allowlist contains entries that are no longer drifting. Either
  // the ES mirror caught up (good — clean the allowlist) or the EN
  // file lost the id (also good — clean the allowlist).
  console.log(`\nℹ  Allowlist cleanup needed — these ids no longer drift, remove from EXPECTED_ID_DRIFT:`);
  ghostExpectedFromEs.forEach(id => console.log(`    - ${id} (was: missing from ES)`));
  ghostExpectedFromEn.forEach(id => console.log(`    - ${id} (was: missing from EN)`));
}

// 2. Tag-count parity for high-signal elements (with allowlist)
const tagsToCheck = ['h1', 'h2', 'h3', 'h4', 'button', 'details', 'summary', 'fieldset', 'select', 'textarea', 'main', 'nav', 'aside', 'header', 'footer'];
const newTagDrift = [];
const expectedTagDrift = [];
for (const tag of tagsToCheck) {
  const enCount = countTag(en, tag);
  const esCount = countTag(es, tag);
  if (enCount === esCount) continue;
  const expected = EXPECTED_TAG_COUNT_DRIFT[tag];
  if (expected && expected.en === enCount && expected.es === esCount) {
    expectedTagDrift.push({ tag, enCount, esCount });
  } else {
    newTagDrift.push({ tag, enCount, esCount, expected });
  }
}
if (newTagDrift.length || (strict && expectedTagDrift.length)) {
  failed = true;
  console.log('\n⛔  HTML tag-count parity MISMATCH');
  for (const issue of newTagDrift) {
    const exp = issue.expected ? ` (allowlisted EN=${issue.expected.en}/ES=${issue.expected.es}; counts changed)` : '';
    console.log(`    <${issue.tag}>: EN=${issue.enCount}, ES=${issue.esCount}, diff=${issue.enCount - issue.esCount}${exp}`);
  }
  if (strict && expectedTagDrift.length) {
    console.log(`    + ${expectedTagDrift.length} known pre-existing tag-count drift (allowlisted)`);
  }
} else {
  console.log(`✓  HTML tag-count parity (${tagsToCheck.length} tag types checked, ${expectedTagDrift.length} known drift entries allowlisted)`);
}

// 3. <script src="..."> parity (ignoring ?v= query strings)
const enScripts = extractScriptSrcs(en);
const esScripts = extractScriptSrcs(es);
// Normalize script paths: EN uses './foo.js' relative paths, ES uses
// absolute '/tools/invoice-decoder/foo.js'. Compare by basename.
const enScriptBases = new Set([...enScripts].map(s => s.split('/').pop()));
const esScriptBases = new Set([...esScripts].map(s => s.split('/').pop()));
const scriptDiff = diffSets(enScriptBases, esScriptBases);
if (scriptDiff.onlyInA.length || scriptDiff.onlyInB.length) {
  failed = true;
  console.log('\n⛔  <script src="..."> parity MISMATCH');
  if (scriptDiff.onlyInA.length) {
    console.log(`    Missing from ES: ${scriptDiff.onlyInA.join(', ')}`);
  }
  if (scriptDiff.onlyInB.length) {
    console.log(`    Missing from EN: ${scriptDiff.onlyInB.join(', ')}`);
  }
} else {
  console.log(`✓  <script src="..."> parity (${enScriptBases.size} modules each)`);
}

// 4. tt() call-site coverage in shared JS
let totalTtIssues = 0;
for (const jsPath of SHARED_JS) {
  if (!existsSync(jsPath)) continue;
  const issues = findBareTtCalls(readSafe(jsPath), jsPath.replace(repoRoot + '/', ''));
  if (issues.length) {
    failed = true;
    totalTtIssues += issues.length;
    console.log(`\n⛔  tt() call-site issues in ${jsPath.replace(repoRoot + '/', '')}`);
    for (const issue of issues.slice(0, 10)) {
      console.log(`    line ${issue.line}: ${issue.reason}`);
      console.log(`      → ${issue.snippet}`);
    }
    if (issues.length > 10) {
      console.log(`    ... and ${issues.length - 10} more`);
    }
  }
}
if (!totalTtIssues) {
  console.log(`✓  tt() call-site coverage (${SHARED_JS.length} files checked)`);
}

if (verbose) {
  console.log('\n— verbose: full id set —');
  console.log('EN ids:', [...enIds].sort().join(', '));
  console.log('ES ids:', [...esIds].sort().join(', '));
}

if (failed) {
  console.log('\n❌  i18n parity check FAILED. Fix the diffs above before merging.');
  process.exit(1);
}
console.log('\n✓  i18n parity check passed');
process.exit(0);
