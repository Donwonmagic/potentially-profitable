#!/usr/bin/env node
/**
 * Phase G.12 (Growth) — assert no @keyframes animation animates a
 * layout-affecting property. Animating top/left/width/height/margin
 * triggers reflow on every frame and makes Cumulative Layout Shift
 * unpredictable across the whole document.
 *
 * Allowed transforms: opacity, transform (translate/scale/rotate),
 * filter, color, background, box-shadow.
 *
 *   node scripts/check-cls-animation.mjs --check
 *
 * Promote-to-fail history: shipped warn-only originally; the body-
 * extraction regex (`\n\}` for the closing brace) ate everything
 * past the keyframe block whenever the closing brace was indented,
 * generating spurious flags on innocent keyframes (eyebrow-shimmer
 * etc. that animate background-position only). The current code
 * uses a brace-counting parser to extract the body cleanly. After
 * the fix landed and surfaced the actual layout-affecting set, the
 * --strict gate is gated on (a) the regex producing zero false
 * positives, (b) the real offenders being either fixed or
 * allowlisted with a justified comment.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// Once the regex bug was fixed (brace-counting body extractor), the
// check found zero real layout-affecting keyframes across 117 blocks,
// so the warn-only gate was no longer protecting us from a fix
// backlog — the only thing it was hiding was its own false positives.
// Promoting to fail-CI from this PR.
const WARN_ONLY = false;
const FORBIDDEN_PROPS = ['top', 'left', 'right', 'bottom', 'width', 'height', 'margin', 'padding', 'inset'];

const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'dist', '.wrangler', 'docs']);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && (e.name.endsWith('.css') || e.name.endsWith('.html'))) yield p;
  }
}

// Extract every @keyframes block from `src` as { name, body, line }.
// A naive `[\s\S]*?\n\}` tail is wrong: each percentage stage has its
// own `{ ... }` and the keyframes block's closing brace is typically
// indented (`\n    }`), so the lazy match terminates too early or too
// late depending on the file's whitespace. Walk the source instead,
// counting `{` vs `}` after the block-opening brace.
function extractKeyframes(src) {
  const out = [];
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const name  = m[1];
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      i++;
    }
    if (depth !== 0) continue; // unbalanced — bail rather than mis-extract
    const end = i - 1; // position of the matching `}`
    out.push({ name, body: src.slice(start, end) });
    re.lastIndex = i;
  }
  return out;
}

const failures = [];
let scanned = 0, keyframes = 0;

for (const file of walk(repoRoot)) {
  scanned++;
  const src = fs.readFileSync(file, 'utf8');
  const blocks = extractKeyframes(src);
  for (const block of blocks) {
    keyframes++;
    const { name, body } = block;
    for (const prop of FORBIDDEN_PROPS) {
      const re = new RegExp(`(?:^|[\\s;{])${prop}\\s*:\\s*[^;]+`, 'i');
      if (re.test(body)) {
        failures.push(`${path.relative(repoRoot, file)}  @keyframes ${name} animates layout-affecting property: ${prop}`);
        break;
      }
    }
  }
}

if (failures.length) {
  console.log(`CLS animation${WARN_ONLY ? ' (warning)' : ''}: ${failures.length} @keyframes block(s) animate layout properties across ${scanned} file(s):`);
  for (const f of failures.slice(0, 20)) console.log('  · ' + f);
  if (failures.length > 20) console.log(`  … and ${failures.length - 20} more`);
  if (!WARN_ONLY) process.exit(1);
} else {
  console.log(`CLS animation: ${keyframes} @keyframes block(s) across ${scanned} file(s); all use compositor-friendly properties.`);
}
