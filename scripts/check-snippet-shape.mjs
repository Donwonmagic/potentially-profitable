#!/usr/bin/env node
/**
 * AEO — answer-first snippet shape for question H2s.
 *
 * Answer engines (Google AI Overviews, Perplexity, ChatGPT) lift the
 * sentence that directly answers a question heading. When a question-style
 * H2 ("How much do marketplaces take?", "¿Qué es el SEO local?") is followed
 * by a paragraph that opens with throat-clearing ("Below is…", "Let's…",
 * "There are…"), the liftable answer is buried and the extraction misses.
 *
 * Canon: the first paragraph after a question-style H2 must LEAD with the
 * answer — a declarative sentence, not a transition. This gate flags the
 * question-H2 → transition-opener pattern across library + es/library
 * articles, EN and ES.
 *
 * Warn-first by design: prints a worklist and exits 0 so it never blocks a
 * PR while the cadence resumes. Pass --strict (or --check) to fail CI once
 * the backlog is clear.
 *
 *   node scripts/check-snippet-shape.mjs            # report + exit 0 (warn)
 *   node scripts/check-snippet-shape.mjs --check    # exit 1 on any offender
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const strict     = process.argv.includes('--check') || process.argv.includes('--strict');

// Only the evergreen reference articles are AEO answer targets. Scan both
// locales' library trees; skip the hub index pages (no #post-body article).
const ROOTS = ['library', 'es/library'];

// High precision: a heading counts as a question only when it ends in a
// literal "?" (covers EN "…need?" and ES "¿…?", which also ends in "?").
// Section titles that merely start with what/which/why ("What $100 becomes",
// "Which one I'd pick") are NOT questions and are left alone.
const IS_QUESTION = /\?\s*$/;

// Paragraph openers that defer the answer instead of stating it. Deliberately
// excludes "there is/are" — "There is no fixed number" directly answers
// "how many?", so it is answer-first, not throat-clearing.
const TRANSITION = /^(below\b|here(?:&rsquo;s| is|'s)?\b|let(?:&rsquo;s| us|'s)\b|first[,.]|the following\b|in this\b|this (?:section|page|article|guide)\b|to answer\b|start by\b|start with\b|before you\b|once you\b|now[,.]|so[,.]|abajo\b|aqu[ií]\b|primero[,.]|lo siguiente\b|en (?:esta|este)\b|esta (?:secci[óo]n|p[áa]gina|gu[íi]a)\b|este art[íi]culo\b|para responder\b|empieza por\b|empieza con\b|antes de\b|una vez\b|ahora[,.]|entonces[,.])/i;

function stripTags(s) {
  return s.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}
function deburr(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function* walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name === 'index.html') yield p;
  }
}

// Pair each H2 with the paragraph that immediately follows it (allowing
// HTML comments between — autolink/sentinel markers are common there).
const PAIR_RE = /<h2\b[^>]*>([\s\S]*?)<\/h2>\s*(?:<!--[\s\S]*?-->\s*)*<p\b[^>]*>([\s\S]*?)<\/p>/g;

const offenders = [];
let scanned = 0;

for (const root of ROOTS) {
  for (const file of walk(path.join(repoRoot, root))) {
    let src;
    try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }
    // Article bodies only — skip hubs/landing pages without the post body.
    if (!src.includes('id="post-body"')) continue;
    scanned++;
    let m;
    PAIR_RE.lastIndex = 0;
    while ((m = PAIR_RE.exec(src))) {
      const head = stripTags(m[1]);
      const body = stripTags(m[2]);
      if (!head || !body) continue;
      if (!IS_QUESTION.test(head)) continue;
      if (TRANSITION.test(deburr(body))) {
        offenders.push({ file: path.relative(repoRoot, file), head: head.slice(0, 56), open: body.slice(0, 60) });
      }
    }
  }
}

if (offenders.length === 0) {
  console.log(`Snippet shape: clean — every question H2 leads answer-first. (${scanned} articles scanned.)`);
  process.exit(0);
}

console.log(`Snippet shape: ${offenders.length} question H2(s) bury the answer behind a transition, across ${new Set(offenders.map((o) => o.file)).size} article(s):\n`);
for (const o of offenders.slice(0, 30)) {
  console.log(`  ${o.file}`);
  console.log(`    H2: ${o.head}`);
  console.log(`    ¶ : ${o.open}…`);
}
if (offenders.length > 30) console.log(`  … and ${offenders.length - 30} more.`);
console.log(`\nFix: open the paragraph after a question H2 with the answer itself\n(a declarative sentence), then elaborate. Reorder existing sourced prose —\ndon't add new claims. ${strict ? '' : '(warn-only; pass --check to enforce.)'}`);

process.exit(strict && offenders.length > 0 ? 1 : 0);
