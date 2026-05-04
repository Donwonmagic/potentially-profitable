#!/usr/bin/env node
/**
 * Operator Sheets — field-help cadence lint (Phase A5).
 *
 * Voice canon enforces two scriptable rules; richer judgment
 * (whether a help line meets the "skip-it-changes-result-by-5%"
 * threshold) lives in docs/voice-canon-sheets.md as a reviewer
 * checklist, not in code.
 *
 * Rules enforced here:
 *
 *   1. CAP — no fieldset may carry more than 1 .field-help element.
 *      The voice canon allows up to 1 per fieldset (the load-bearing
 *      one); 2+ means the fieldset is a tutorial.
 *
 *   2. DUPLICATE-OF-LABEL — a .field-help line whose text is a
 *      paraphrase of the preceding <label> text is documentation,
 *      not voice. We detect this with a normalized-string compare
 *      after stripping punctuation, lowercasing, and collapsing
 *      whitespace; matches above 0.6 Jaccard similarity flag.
 *
 * The lint runs against every fragment in scripts/sheets-fragments/.
 * Fragments are the source of truth for sheet form bodies; the
 * rendered sheet pages mirror them.
 *
 *   node scripts/check-sheet-help-cadence.mjs
 *   node scripts/check-sheet-help-cadence.mjs --check  (CI mode, fail on violations)
 *
 * Exits 0 when clean; 1 (in --check) when violations are found.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const FRAGMENT_DIR = path.join(repoRoot, 'scripts', 'sheets-fragments');
if (!fs.existsSync(FRAGMENT_DIR)) {
  console.log('No sheets-fragments directory — nothing to check.');
  process.exit(0);
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Jaccard similarity over word sets — cheap, no fancy nlp needed.
function jaccard(a, b) {
  const A = new Set(normalize(a).split(' ').filter(Boolean));
  const B = new Set(normalize(b).split(' ').filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

// Crude HTML walker: find every <fieldset>...</fieldset>, then within
// each, find every <label>...</label> + the .field-help span/p that
// follows or sits inside it. Crude is fine — fragments are a small,
// bounded shape.
function lint(html, file) {
  const violations = [];
  const fsRe = /<fieldset\b[^>]*>([\s\S]*?)<\/fieldset>/g;
  let m;
  let fsIdx = 0;
  while ((m = fsRe.exec(html)) !== null) {
    fsIdx++;
    const fsBody = m[1];
    const fsLineStart = html.slice(0, m.index).split('\n').length;
    // Count .field-help nodes.
    const helpRe = /<(?:span|p)\b[^>]*\bclass="(?:[^"]*\s)?field-help(?:\s[^"]*)?"[^>]*>([\s\S]*?)<\/(?:span|p)>/g;
    const helps = [];
    let hm;
    while ((hm = helpRe.exec(fsBody)) !== null) {
      helps.push({ html: hm[0], text: hm[1], idx: hm.index });
    }
    // Rule 1 — cap counter.
    if (helps.length > 1) {
      // Multiple field-help nodes are permissible if they sit on
      // genuinely different load-bearing inputs. The check-mode
      // version is strict — every fieldset over the cap is reported.
      // The reviewer's judgment-rule (which one to keep) lives in
      // docs/voice-canon-sheets.md.
      violations.push({
        kind: 'cap',
        file,
        line: fsLineStart,
        msg: 'fieldset #' + fsIdx + ' has ' + helps.length + ' .field-help nodes — voice canon caps at 1 per fieldset.',
      });
    }
    // Rule 2 — duplicate-of-label. For each .field-help, find the
    // nearest preceding <label> within the fieldset and compare.
    for (const h of helps) {
      const before = fsBody.slice(0, h.idx);
      const labelMatches = [...before.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)];
      const lastLabel = labelMatches[labelMatches.length - 1];
      if (!lastLabel) continue;
      // Prefer the <span> inside the label (the visible field name).
      const spanMatch = lastLabel[1].match(/<span\b[^>]*>([\s\S]*?)<\/span>/);
      const labelText = spanMatch ? spanMatch[1] : lastLabel[1];
      const sim = jaccard(labelText, h.text);
      if (sim >= 0.6) {
        violations.push({
          kind: 'duplicate',
          file,
          line: fsLineStart,
          msg: 'fieldset #' + fsIdx + ' .field-help paraphrases its label (Jaccard ' + sim.toFixed(2) + '). Replace with operator-context line or remove.',
          label: normalize(labelText).slice(0, 80),
          help:  normalize(h.text).slice(0, 80),
        });
      }
    }
  }
  return violations;
}

const allViolations = [];
const fragments = fs.readdirSync(FRAGMENT_DIR).filter((f) => f.endsWith('.html'));
for (const f of fragments) {
  const html = fs.readFileSync(path.join(FRAGMENT_DIR, f), 'utf8');
  const v = lint(html, f);
  for (const item of v) allViolations.push(item);
}

if (allViolations.length === 0) {
  console.log(`Sheet help-cadence: ${fragments.length} fragment(s) scanned; all within voice canon (cap ≤1 per fieldset, no duplicate-of-label).`);
  process.exit(0);
}

console.error('Sheet help-cadence: ' + allViolations.length + ' violation(s):');
for (const v of allViolations) {
  console.error('  ✗ ' + v.file + ':' + v.line + '  ' + v.kind + '  ' + v.msg);
  if (v.label && v.help) {
    console.error('        label: "' + v.label + '"');
    console.error('        help:  "' + v.help + '"');
  }
}
console.error('\nVoice canon: docs/voice-canon-sheets.md');
console.error('Reviewer rule (skip-it-changes-result-by-5%) is human judgment, not lint.');
if (checkMode) process.exit(1);
