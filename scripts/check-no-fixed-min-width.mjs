#!/usr/bin/env node
/**
 * Phase I.6 (Cross-device usability) — guard against fixed-pixel
 * min-width declarations outside @media queries in tool inline CSS.
 *
 * This is the regression net for I.1 / I.2: a future tool that
 * ships a `min-width: 560px` on a data table or a `min-width: 200px`
 * on a flex child outside a media query forces horizontal scroll on
 * phones. CI catches it before it deploys.
 *
 * Scope: every `<style>` block inside `tools/**\/index.html` (and ES
 * counterparts). Site-wide `assets/site.css` is intentionally NOT
 * scanned — that file's chrome rules are reviewed by hand.
 *
 * Allowlist of always-acceptable values:
 *   - 0                    (flex min-width:0 idiom)
 *   - any pixel value ≤ 96 (intrinsic small sizes — tap targets,
 *                           value-readout columns, short-label cells.
 *                           None of these can overflow a 360px phone.)
 *   - max-content / auto / fit-content (intrinsic sizing keywords)
 *   - any `min-width:` whose value uses var(...), calc(...), or %
 *
 * Per-tool exemption: add `/* min-width-exempt:<reason> *\/` on the
 * preceding line. Reported but doesn't fail CI.
 *
 *   node scripts/check-no-fixed-min-width.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// Pixel allowlist:
//   - 0          (flex min-width:0 idiom)
//   - ≤96        (intrinsic small widths: tap targets, value readouts,
//                 short-label cells. None of these cause horizontal
//                 scroll on a 360px phone since they fit inside any
//                 flex parent's responsive width.)
// Anything >96 must be inside an @media query.
const ALLOWED_MAX_PX = 96;

function listToolPages() {
  const out = [];
  for (const root of [path.join(repoRoot, 'tools'), path.join(repoRoot, 'es', 'tools')]) {
    if (!fs.existsSync(root)) continue;
    for (const slug of fs.readdirSync(root)) {
      const p = path.join(root, slug, 'index.html');
      if (fs.existsSync(p)) out.push(p);
    }
  }
  return out;
}

function extractStyles(html) {
  const blocks = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html))) blocks.push({ css: m[1], offset: m.index + m[0].indexOf(m[1]) });
  return blocks;
}

function offsetToLine(html, offset) {
  return html.slice(0, offset).split('\n').length;
}

// Walk CSS char-by-char. When inside an `@media` (brace depth > 0
// after an @media at-rule), min-width:Npx is OK. Outside, it's a
// violation unless allowlisted.
function scanCss(css) {
  const violations = [];
  // Track brace stack: each entry is `true` if it was opened by an
  // `@media` (or `@supports`/`@container`) at-rule, `false` otherwise.
  const stack = [];
  let i = 0;
  while (i < css.length) {
    const ch = css[i];

    // At-rule
    if (ch === '@') {
      const remainder = css.slice(i);
      const atMatch = /^@([a-z-]+)/.exec(remainder);
      if (atMatch) {
        const name = atMatch[1];
        const conditional = name === 'media' || name === 'supports' || name === 'container';
        // Find next `{` or `;`
        let j = i;
        while (j < css.length && css[j] !== '{' && css[j] !== ';') j++;
        if (css[j] === '{') {
          stack.push(conditional);
          i = j + 1;
          continue;
        }
        // bare at-rule like @charset, @import — skip past `;`
        i = j + 1;
        continue;
      }
    }

    if (ch === '{') {
      // Selector block (not at-rule); push non-conditional frame.
      stack.push(false);
      i++;
      continue;
    }
    if (ch === '}') {
      stack.pop();
      i++;
      continue;
    }

    // Look for `min-width:`
    if (ch === 'm' && css.slice(i, i + 10).toLowerCase() === 'min-width:') {
      // Find end of declaration
      const decl = /min-width\s*:\s*([^;}]+)/i.exec(css.slice(i));
      if (decl) {
        const valueRaw = decl[1].trim();
        const inConditional = stack.some((b) => b === true);
        if (!inConditional && !isAllowed(valueRaw)) {
          violations.push({ offset: i, value: valueRaw });
        }
        i += decl[0].length;
        continue;
      }
    }

    i++;
  }
  return violations;
}

function isAllowed(value) {
  // Strip `!important` and trim.
  const v = value.replace(/!important/i, '').trim();
  // Keywords/functions that are intrinsic or relative.
  if (/^(auto|max-content|min-content|fit-content|0)$/i.test(v)) return true;
  if (/^var\(/i.test(v) || /^calc\(/i.test(v) || /^min\(/i.test(v) || /^max\(/i.test(v) || /^clamp\(/i.test(v)) return true;
  if (/^\d+%$/.test(v)) return true;
  if (/^0(\.\d+)?(em|rem|vw|vh|ch)$/.test(v)) return true;
  // Pixel value — allow if ≤ ALLOWED_MAX_PX (intrinsic small sizes).
  const px = /^(\d+)(?:\.\d+)?px$/.exec(v);
  if (px) return parseInt(px[1], 10) <= ALLOWED_MAX_PX;
  return false;
}

function exemptedAt(html, offset) {
  // Look back to the start of the line and any preceding /* min-width-exempt:... */ on prior line.
  const lineStart = html.lastIndexOf('\n', offset - 1) + 1;
  const prevLineEnd = lineStart - 1;
  const prevLineStart = html.lastIndexOf('\n', prevLineEnd - 1) + 1;
  const prevLine = html.slice(prevLineStart, prevLineEnd);
  return /min-width-exempt\s*:/.test(prevLine);
}

function main() {
  const pages = listToolPages();
  let violations = 0;
  let exempted = 0;
  let scanned = 0;

  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const blocks = extractStyles(html);
    for (const { css, offset } of blocks) {
      const found = scanCss(css);
      for (const v of found) {
        scanned++;
        const absOffset = offset + v.offset;
        if (exemptedAt(html, absOffset)) {
          exempted++;
          continue;
        }
        const line = offsetToLine(html, absOffset);
        const rel = path.relative(repoRoot, file);
        console.error(`${rel}:${line}  min-width: ${v.value} outside @media query`);
        violations++;
      }
    }
  }

  if (violations > 0) {
    console.error(`No-fixed-min-width: ${violations} violation(s) across ${pages.length} tool page(s).`);
    process.exit(1);
  }
  console.log(`No-fixed-min-width: ${pages.length} tool page(s) scanned; all min-width declarations are inside @media queries or allowlisted (44/48/0/intrinsic).${exempted ? ` ${exempted} exempted.` : ''}`);
}

main();
