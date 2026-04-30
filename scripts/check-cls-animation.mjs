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
 * Ships as warning; promote to fail-CI after 30-day soak.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const WARN_ONLY = true;
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

const failures = [];
let scanned = 0, keyframes = 0;

for (const file of walk(repoRoot)) {
  scanned++;
  const src = fs.readFileSync(file, 'utf8');
  const blocks = [...src.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g)];
  for (const m of blocks) {
    keyframes++;
    const name = m[1];
    const body = m[2];
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
