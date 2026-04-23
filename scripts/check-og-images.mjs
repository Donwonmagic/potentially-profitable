#!/usr/bin/env node
/**
 * Validate that every og:image + twitter:image reference on every
 * HTML page resolves to a file that actually exists in brand/og/.
 *
 * Runs after scripts/build-og-cards.mjs in the deploy build. Fails
 * with a non-zero exit if a dangling reference is found — this is
 * the safety net that catches a forgotten cards.json entry or an
 * HTML page pointing at a retired slug before the build reaches
 * production.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OG_PREFIX = "https://muntin.digital/brand/og/";
const META_RE = /<meta[^>]+(?:property|name)="(og:image|twitter:image)"[^>]+content="([^"]+)"/g;

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".wrangler", "_includes"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const htmlFiles = walk(REPO);
const missing = [];
const checked = new Set();

for (const file of htmlFiles) {
  const text = fs.readFileSync(file, "utf8");
  META_RE.lastIndex = 0;
  let m;
  while ((m = META_RE.exec(text))) {
    const [, prop, href] = m;
    if (!href.startsWith(OG_PREFIX)) continue;
    const rel = href.slice(OG_PREFIX.length);
    const abs = path.join(REPO, "brand", "og", rel);
    const key = `${file}\t${rel}`;
    if (checked.has(key)) continue;
    checked.add(key);
    if (!fs.existsSync(abs)) {
      missing.push({ file: path.relative(REPO, file), prop, rel });
    }
  }
}

if (missing.length) {
  console.error(`\n✗ ${missing.length} dangling og:image reference(s):\n`);
  for (const m of missing) {
    console.error(`  ${m.file}`);
    console.error(`    ${m.prop} → brand/og/${m.rel}  (file not found)`);
  }
  console.error();
  process.exit(1);
}

console.log(`✓ ${checked.size} og:image / twitter:image references resolve (across ${htmlFiles.length} HTML pages)`);
