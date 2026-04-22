#!/usr/bin/env node
// Remove legacy old-shape breadcrumbs from ES blog posts where the
// original breadcrumb injection script (scripts/inject-blog-
// breadcrumbs.mjs) missed them due to divergent attribute order
// (aria-label="Miga de pan" vs "Breadcrumb") and appended a second
// new-shape breadcrumb instead of replacing.
//
// Removes the OLD-shape one (identified by href="/es/blog/">Blog</a>
// or the "Miga de pan" attribute), keeps the new "Aprende > Artículos"
// crumb that my later injection added. Idempotent.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(repoRoot, 'es/blog');
if (!fs.existsSync(dir)) process.exit(0);

// Match the OLD-shape breadcrumb: either aria-label="Miga de pan" or
// contains href="/es/blog/">Blog</a> (with "Blog", not "Artículos").
// Match the whole <nav ...>...</nav> block.
const LEGACY_RE = /<nav[^>]*aria-label="Miga de pan"[^>]*>[\s\S]*?<\/nav>\s*/g;

let fixed = 0;
for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'drafts') continue;
  const file = path.join(dir, entry.name, 'index.html');
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const next = src.replace(LEGACY_RE, '');
  if (next !== src) {
    fs.writeFileSync(file, next);
    fixed++;
    console.log(`cleaned ${path.relative(repoRoot, file)}`);
  }
}
console.log(`\n${fixed} file(s) cleaned of duplicate breadcrumbs.`);
