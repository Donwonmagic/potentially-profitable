#!/usr/bin/env node
/**
 * Phase F.1 (Field Notes) — one-off seeder.
 *
 * Stamps empty sentinel pairs into every blog article that has the
 * post-end-cta + see-also anchors. Two pairs per article:
 *
 *   <!-- field-notes:start -->...<!-- field-notes:end -->
 *     inserted directly after <aside class="post-end-mark">,
 *     before <!-- post-end-cta:start -->.
 *
 *   <!-- field-notes-submit:start -->...<!-- field-notes-submit:end -->
 *     inserted directly after <!-- LIBRARY:see-also:end -->.
 *
 * This is intentionally NOT in the build chain — it runs once to
 * seed the anchors, then the per-phase inject scripts replace
 * content between sentinels going forward.
 *
 * Usage:
 *   node scripts/seed-field-notes-sentinels.mjs           # rewrite in place
 *   node scripts/seed-field-notes-sentinels.mjs --check   # exit 1 if any change
 *
 * Idempotent: re-running emits 0 changes once seeded.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const POST_END_MARK_RE = /(<aside class="post-end-mark"[^>]*>[\s\S]*?<\/aside>)([\s\S]*?)(<!-- post-end-cta:start -->)/;
const SEE_ALSO_END = '<!-- LIBRARY:see-also:end -->';
const FIELD_NOTES_RE = /<!-- field-notes:start -->[\s\S]*?<!-- field-notes:end -->/;
const FORM_RE = /<!-- field-notes-submit:start -->[\s\S]*?<!-- field-notes-submit:end -->/;

const EMPTY_FIELD_NOTES = '<!-- field-notes:start --><!-- field-notes:end -->';
const EMPTY_FORM        = '<!-- field-notes-submit:start --><!-- field-notes-submit:end -->';

function findArticles() {
  const out = [];
  for (const dir of ['blog', 'es/blog', 'library', 'es/library']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    for (const slug of fs.readdirSync(root)) {
      const file = path.join(root, slug, 'index.html');
      if (!fs.existsSync(file)) continue;
      const src = fs.readFileSync(file, 'utf8');
      if (!src.includes('<!-- post-end-cta:start -->')) continue;
      out.push(file);
    }
  }
  return out;
}

function seed(file) {
  const src = fs.readFileSync(file, 'utf8');
  let next = src;

  // Pair 1: field-notes between post-end-mark and post-end-cta:start.
  // Fallback: if no post-end-mark, insert directly before
  // post-end-cta:start (a few articles ship without the decorative
  // mark; the position relative to the CTA still works).
  if (!FIELD_NOTES_RE.test(next)) {
    if (POST_END_MARK_RE.test(next)) {
      next = next.replace(
        POST_END_MARK_RE,
        (m, mark, between, ctaStart) => `${mark}${between}${EMPTY_FIELD_NOTES}\n      ${ctaStart}`
      );
    } else if (next.includes('<!-- post-end-cta:start -->')) {
      next = next.replace('<!-- post-end-cta:start -->', `${EMPTY_FIELD_NOTES}\n      <!-- post-end-cta:start -->`);
    } else {
      console.warn(`  warn: ${path.relative(repoRoot, file)} missing post-end-cta:start anchor; skipping field-notes seed`);
    }
  }

  // Pair 2: field-notes-submit after LIBRARY:see-also:end.
  if (!FORM_RE.test(next)) {
    if (next.includes(SEE_ALSO_END)) {
      next = next.replace(SEE_ALSO_END, `${SEE_ALSO_END}\n      ${EMPTY_FORM}`);
    } else {
      console.warn(`  warn: ${path.relative(repoRoot, file)} missing LIBRARY:see-also:end anchor; skipping form seed`);
    }
  }

  if (next === src) return false;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  return true;
}

let changed = 0;
const files = findArticles();
for (const f of files) {
  if (seed(f)) changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${files.length} article(s).`);
if (checkOnly && changed > 0) process.exit(1);
