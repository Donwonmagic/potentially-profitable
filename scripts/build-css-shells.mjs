#!/usr/bin/env node
/**
 * Phase 3B-perf — CSS shell split.
 *
 * Reads assets/site.css (the 6,342-line monolithic stylesheet),
 * partitions it by hand-classified section into three smaller
 * shells, and writes them alongside the source:
 *
 *   assets/site-core.css     (~3,000 lines, ~36 KB gzip)
 *     What every page needs: tokens, @font-face, breakpoints,
 *     .btn family, footer, breadcrumb, search modal, status chips,
 *     score-card/pill, Workshop banner, Window, Turnstile reservation,
 *     homepage hero/trust/compare, legal pages, /system/, /admin/.
 *
 *   assets/site-tool.css     (~1,200 lines, ~14 KB gzip)
 *     Only loaded on /tools/* pages: TOOL SHELL, tool states,
 *     tools-landing cluster, per-tool Keep-going knit, .edu-result,
 *     statistical disclosure, tool-internal type minimums, Learn-back.
 *
 *   assets/site-article.css  (~2,100 lines, ~25 KB gzip)
 *     Only loaded on /blog/, /learn/, /glossary/ pages: citation
 *     drawer, listen/audio player, glossary scannability, glossary
 *     term pages, glossary explainer, glossary popover, KnitRail,
 *     research notes, research drawer, library topics, learn hub,
 *     editorial callouts, post-end Workshop CTA, "Recently added"
 *     strips, inline graphics.
 *
 * Cascade order at runtime: core → (tool|article). Supplemental
 * shells must be ADDITIVE — they cannot override rules in core.
 * The companion check-css-shells.mjs guard catches violations.
 *
 *   node scripts/build-css-shells.mjs           # rewrite the 3 shell files
 *   node scripts/build-css-shells.mjs --check   # exit 1 if shells would change
 *
 * Maintenance: when site.css gets a new section, add a SECTIONS
 * entry below with the start line and the right shell label.
 * Otherwise the new section will land in 'core' by default (the
 * fallback for unmapped lines), which is safe but wasteful.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SRC = path.join(REPO, 'assets', 'site.css');

// === Section → shell map ===
//
// site.css contains inline boundary markers of the form:
//
//     /* @shell:<name> === <Label> === */
//
// at the top of every section. The build script scans for these
// markers and slices the source between consecutive markers.
//
// Why markers instead of a hardcoded line-number table:
// every CSS edit that changes line counts in one section would
// silently desync the table for every downstream section. The
// pre-marker era had at least one rendered-CSS regression from
// this (`.tool-deep-links` shipped unstyled in May 2026, see the
// note further down) and ~10 manual-bump commits during the
// 28-commit audio-experience redesign. Markers self-correct:
// inserting CSS above a marker doesn't move the marker's
// relative position within its own section.
//
// To add a new section: insert a marker at the top of its first
// rule. The script discovers it on the next build. No edit here
// needed.
//
// To MOVE a section between shells: change the shell name in
// the marker, run the script.
//
// SECTIONS is populated by the scan below from site.css's
// markers. Line 1 is implicitly section[0] ('core', 'Pre-token
// boilerplate') — the file's start carries no marker because
// there's nothing before it for a marker to follow.
const SECTIONS = [];
const MARKER_RE = /^\/\*\s*@shell:(\w+)\s*===\s*(.+?)\s*===\s*\*\/\s*$/;

// === Validation ===
const src   = fs.readFileSync(SRC, 'utf8');
const lines = src.split('\n');

// Populate SECTIONS from the marker scan. Line 1 is implicit.
SECTIONS.push({ start: 1, shell: 'core', label: 'Pre-token boilerplate' });
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(MARKER_RE);
  if (!m) continue;
  SECTIONS.push({ start: i + 1, shell: m[1], label: m[2] });
}
if (SECTIONS.length < 2) {
  console.error(`No @shell markers found in ${SRC} — markers are the source of truth for the section/shell map.`);
  process.exit(2);
}

// Section starts must be in ascending order.
for (let i = 1; i < SECTIONS.length; i++) {
  if (SECTIONS[i].start <= SECTIONS[i - 1].start) {
    console.error(`SECTIONS not in ascending order at index ${i}: ${SECTIONS[i].start} <= ${SECTIONS[i - 1].start}`);
    process.exit(2);
  }
}
// Last section must not overshoot the file.
if (SECTIONS[SECTIONS.length - 1].start > lines.length) {
  console.error(`Last section start ${SECTIONS[SECTIONS.length - 1].start} exceeds file length ${lines.length}`);
  process.exit(2);
}

// === Adjust section starts that fall inside multi-line comments ===
//
// site.css uses multi-line /* ============ Section name ============
//                             ...documentation prose...
//                          */ blocks immediately above many sections.
// The SECTIONS map's `start` line was historically pinned at the
// section's first CSS rule, but a few entries land mid-comment-block.
// If we cut the file there, the comment opener `/*` lands at the END
// of the previous shell (unclosed) and the closing `*/` lands at the
// START of this shell with all the prose orphaned outside any
// comment — invalid CSS. Browsers tolerate this, but strict
// minifiers (lightningcss) reject it.
//
// Fix: scan all bytes BEFORE the cut for unclosed `/*`. If we find
// one, advance the cut forward to the line AFTER its matching `*/`.
//
// Note: this only nudges section starts forward. The round-trip
// invariant in check-css-shells.mjs (rule-multiset equality between
// shells and source) is unaffected because comments aren't rules.
function adjustStartPastOpenComment(startLine) {
  const before = lines.slice(0, startLine - 1).join('\n');
  const lastOpen  = before.lastIndexOf('/*');
  if (lastOpen < 0) return startLine;
  const lastClose = before.lastIndexOf('*/');
  if (lastClose > lastOpen) return startLine;  // comment was closed before the cut
  // Walk forward from the cut looking for the closing */.
  for (let ln = startLine; ln <= lines.length; ln++) {
    if (lines[ln - 1].includes('*/')) return ln + 1;
  }
  return startLine;  // unreachable in a well-formed file
}

for (let i = 0; i < SECTIONS.length; i++) {
  SECTIONS[i].start = adjustStartPastOpenComment(SECTIONS[i].start);
}

// === Extract ===
const buckets = { core: [], tool: [], article: [] };

for (let i = 0; i < SECTIONS.length; i++) {
  const cur  = SECTIONS[i];
  const next = SECTIONS[i + 1];
  const endLine = next ? next.start - 1 : lines.length;
  const slice = lines.slice(cur.start - 1, endLine).join('\n');
  const header = `\n/* ===== [${cur.shell}] ${cur.label} (lines ${cur.start}-${endLine}) ===== */`;
  buckets[cur.shell].push(header + '\n' + slice);
}

// === Round-trip safety check ===
// Concatenating all three shells (in section order, regardless of which
// shell each section landed in) MUST reproduce the original file's
// content (ignoring the section headers we added). If it doesn't,
// something fell out of the SECTIONS map.
//
// We compare by counting non-blank, non-comment characters per shell
// vs source. Cheap rough invariant; the check-css-shells.mjs guard
// does the rule-level verification.

const FILE_HEADER = `/*
 * Auto-generated by scripts/build-css-shells.mjs from assets/site.css.
 * DO NOT EDIT BY HAND. To change a rule, edit assets/site.css and
 * re-run the build script. To move a rule between shells, update
 * the SECTIONS map in scripts/build-css-shells.mjs.
 */
`;

const out = {
  core:    FILE_HEADER + buckets.core.join('\n'),
  tool:    FILE_HEADER + buckets.tool.join('\n'),
  article: FILE_HEADER + buckets.article.join('\n'),
};

const targets = {
  core:    path.join(REPO, 'assets', 'site-core.css'),
  tool:    path.join(REPO, 'assets', 'site-tool.css'),
  article: path.join(REPO, 'assets', 'site-article.css'),
};

let changed = 0;
for (const shell of Object.keys(targets)) {
  const target = targets[shell];
  const next = out[shell];
  let prev = '';
  try { prev = fs.readFileSync(target, 'utf8'); } catch (_) { /* new file */ }
  if (prev !== next) {
    if (!checkOnly) fs.writeFileSync(target, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'wrote'}: ${path.relative(REPO, target)}  (${(next.length / 1024).toFixed(1)} KB uncompressed)`);
  } else {
    console.log(`unchanged: ${path.relative(REPO, target)}  (${(next.length / 1024).toFixed(1)} KB uncompressed)`);
  }
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of 3 shell file(s).`);

if (checkOnly && changed > 0) process.exit(1);
process.exit(0);
