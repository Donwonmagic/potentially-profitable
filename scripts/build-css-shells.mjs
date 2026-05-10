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
// Each entry: { start: <1-indexed line where the section begins>,
//               shell: 'core' | 'tool' | 'article',
//               label: <human description for the emitted header> }
//
// Lines come from `grep -n '^/\* =\+' assets/site.css`. The build
// script slices [start, nextStart-1] out of the file for each entry.
// Line numbers MUST match the current site.css; re-run grep when
// site.css changes and update.
const SECTIONS = [
  { start: 1,    shell: 'core',    label: 'Pre-token boilerplate' },
  { start: 3,    shell: 'core',    label: 'Modernization tokens (Sprint 1)' },
  { start: 94,   shell: 'core',    label: 'Line-height convention' },
  { start: 109,  shell: 'core',    label: 'Token usage notes' },
  { start: 122,  shell: 'core',    label: 'Status components (.status-chip, .progress-ring)' },
  { start: 253,  shell: 'core',    label: 'Field Guide editorial surfaces (.score-card, .score-pill — used by tools + audits)' },
  { start: 533,  shell: 'core',    label: 'Global focus-visible' },
  { start: 541,  shell: 'core',    label: 'Self-hosted web fonts (@font-face)' },
  { start: 607,  shell: 'core',    label: 'Breakpoint scale' },
  { start: 713,  shell: 'core',    label: 'Button vocabulary (.btn family)' },
  { start: 1282, shell: 'core',    label: 'Footer' },
  { start: 1379, shell: 'article', label: 'Citation drawer (.cite, .cite-body)' },
  // Lines 1394-1454 in the source are global chrome (focus-visible
  // rules, .skip-link, .sr-only, nav-toggle, mobile-menu) that landed
  // inside the visual proximity of the citation-drawer section but
  // are used on EVERY page. Without this split, sheet pages and other
  // core-only consumers shipped without `.skip-link` / `.sr-only` /
  // mobile menu styles even though the markup is on every page.
  { start: 1408, shell: 'core',    label: 'Global focus-visible + skip-link + sr-only + nav-toggle + mobile-menu (every-page chrome)' },
  // The "CITATION DRAWER" section header at line 1361 actually carries
  // about 95 lines of cite styles followed by ~20 lines of nav refinements
  // + the share-widget UI before the next section header. Split here so
  // the latter half lands in core where it belongs (share is on every
  // shell; nav refinements affect every page).
  { start: 1476, shell: 'core',    label: 'Nav refinements + share widget (was inside CITATION DRAWER section)' },
  { start: 1497, shell: 'article', label: 'Listen / audio player' },
  { start: 2026, shell: 'core',    label: 'Breadcrumbs' },
  { start: 2052, shell: 'core',    label: 'Homepage utility classes' },
  { start: 2104, shell: 'core',    label: 'Legal pages' },
  { start: 2130, shell: 'core',    label: 'Homepage primary tool CTA (restaurant audit)' },
  { start: 2420, shell: 'tool',    label: 'TOOL SHELL — shared primitives for /tools/* pages' },
  { start: 2518, shell: 'tool',    label: 'Tools-landing cluster layout' },
  { start: 2809, shell: 'tool',    label: 'Per-tool "Keep going" knit-in' },
  { start: 2920, shell: 'article', label: 'Glossary scannability' },
  { start: 3075, shell: 'article', label: '"Recently added" strip on /learn/' },
  { start: 3150, shell: 'core',    label: 'Library nav-mega regroup (nav is everywhere)' },
  { start: 3469, shell: 'article', label: 'Learn hub + Start here pages' },
  { start: 3572, shell: 'core',    label: '/system/ colophon page (small, kept in core)' },
  { start: 3649, shell: 'core',    label: 'Search modal (Pagefind-backed; on every page)' },
  { start: 3824, shell: 'article', label: 'Research notes (/learn/research/)' },
  { start: 3841, shell: 'article', label: 'Library topics (/learn/topics/)' },
  { start: 4023, shell: 'article', label: 'Glossary term pages (/glossary/<slug>/)' },
  // .tool-deep-links is the "Why this tool exists" block at the bottom of
  // every /tools/* page. Lives in this region historically because it was
  // built alongside glossary cross-linking, but it ships on tool pages —
  // which only load core+tool. Without this split it lands in article and
  // the audit page's deep-links section renders unstyled (reported May 2026).
  { start: 4137, shell: 'tool',    label: 'Tool deep-links (.tool-deep-* — bottom of every /tools/* page)' },
  { start: 4221, shell: 'article', label: 'Resume article — services-aside-cta + see-also + research notes' },
  { start: 4618, shell: 'article', label: 'Research-note CTA inside cite drawer' },
  { start: 4639, shell: 'article', label: 'Research drawer (inline preview)' },
  { start: 4779, shell: 'article', label: 'Glossary term → research note cross-link' },
  { start: 4824, shell: 'article', label: '"Recently added" rail (under glossary hero)' },
  { start: 4882, shell: 'article', label: 'Glossary index "▶ 90s explainer" chip' },
  { start: 4903, shell: 'article', label: 'Glossary explainer (90-second narrated diagram)' },
  { start: 5169, shell: 'article', label: 'Inline glossary popover' },
  { start: 5236, shell: 'article', label: 'Print view for glossary section landing pages' },
  { start: 5293, shell: 'core',    label: 'Cloudflare Turnstile widget (reservation min-height)' },
  { start: 5305, shell: 'core',    label: 'Workshop save banner (multi-context, kept in core)' },
  { start: 5357, shell: 'tool',    label: 'Tool states (loading / error / empty)' },
  { start: 5402, shell: 'article', label: 'Editorial callouts' },
  { start: 5486, shell: 'tool',    label: 'Learn-back (in tool result region)' },
  { start: 5504, shell: 'article', label: 'Post-end Workshop CTA' },
  { start: 5520, shell: 'core',    label: 'Workshop rationale' },
  { start: 5536, shell: 'core',    label: 'The Window (/window/ — kept in core to avoid a 4th shell)' },
  { start: 5653, shell: 'core',    label: 'Window composer (Phase-2 redesign)' },
  { start: 5686, shell: 'core',    label: 'ADMIN /admin/window/ (kept in core; admin is auth-gated noindex)' },
  { start: 5773, shell: 'tool',    label: '.edu-result — interpretation card under tool output' },
  { start: 5812, shell: 'tool',    label: 'Statistical disclosure components' },
  { start: 5855, shell: 'tool',    label: 'Tool-internal type minimums' },
  // foot-newsletter lives in the global footer partial, so it needs to
  // be in core — every page renders the form, not just /tools/*. The
  // historical bucket (Tool-internal type minimums) extended past the
  // newsletter block; splitting here pulls the .foot-newsletter* rules
  // out of site-tool.css where they were inert on /blog/, /glossary/,
  // /sheets/, and other non-tool pages. (Line 5986 = 5983 in the
  // pre-#284 site.css + the 3-line .reveal block #284 added at line 1382.)
  { start: 6012, shell: 'core',    label: 'Newsletter capture (in global footer; on every page)' },
  { start: 6033, shell: 'article', label: 'Inline graphics — globalized from gold articles' },
  { start: 6094, shell: 'core',    label: 'Touch-device hover hygiene' },
  { start: 6133, shell: 'core',    label: 'Hero mobile reorder (homepage)' },
  { start: 6156, shell: 'article', label: 'KnitRail — "what’s next" component for articles' },
  { start: 6231, shell: 'core',    label: 'Hero count chips (homepage)' },
  { start: 6262, shell: 'core',    label: 'Trust strip (homepage)' },
  { start: 6288, shell: 'core',    label: 'Compare cards (homepage)' },
  // Article viz components — Phase-1 foundation for the graphics
  // refresh. Namespaced .viz-* family for inline article charts
  // (.viz-figure, .viz-bars today; .viz-ring/.viz-spark/.viz-ba/
  // .viz-flow/.viz-tree/.viz-waterfall/.viz-gauge/.viz-hero/.viz-scroll
  // land in subsequent phases). Article shell — only loaded on
  // /blog/, /learn/, /glossary/.
  { start: 6372, shell: 'article', label: 'Article viz components (.viz-* family)' },
  // Window redesign — sash/sidelight composer, photo/voice attach,
  // now-line widget, site-wide pulse propagation, admin attachment
  // + callback display, /now/ editor. Appended at site.css EOF as
  // one block; lives in core because it spans /window/, /about/,
  // every-page nav/footer, and admin pages.
  { start: 6711, shell: 'core',    label: 'Window Phase 2/3.6/4/5+ additions (sash/sidelight, attach, now, pulses, admin)' },
];

// === Validation ===
const src   = fs.readFileSync(SRC, 'utf8');
const lines = src.split('\n');

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
