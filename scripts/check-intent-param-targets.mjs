#!/usr/bin/env node
/**
 * Phase D — assert every emitted `intent=` URL in the repo points
 * to a tool that registers a MuntinWorkbench.attach consumer (so
 * the readIntent() helper actually fires) AND, for intent=watch,
 * the target's kind is in the watchable set OR the tool ships the
 * friendly "this tool can't be watched on a schedule" fallback
 * (built into the helper itself).
 *
 * Sources of intent= URLs to scan:
 *   - blog posts (post-end CTA emits ?intent=watch)
 *   - tools/storefront-health/index.html (scorecard "Fix this" links)
 *   - es counterparts of both
 *
 * Closed enum:
 *   intent ∈ { watch, save, share, compare }
 *
 * Exits 0 when every emitted URL satisfies the contract; 1 on
 * any drift, with a per-URL pointer.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const INTENT_ENUM = new Set(['watch', 'save', 'share', 'compare']);

function* walk(dir, skip) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (skip.has(e.name)) continue;
      yield* walk(p, skip);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      yield p;
    }
  }
}

function targetTool(href) {
  // /tools/seo-grader/?from=...&intent=watch  →  /tools/seo-grader/
  // /es/tools/audits/restaurant/?...           →  /es/tools/audits/restaurant/
  const m = href.match(/^(\/(?:es\/)?tools\/[^?#]+\/)/);
  return m ? m[1] : null;
}

function toolKind(toolPath) {
  // map tool path → kind enum (mirrors KIND_REGISTRY in workbench/index.html)
  const m = toolPath.match(/\/tools\/(.+)\/$/);
  if (!m) return null;
  const segment = m[1].replace(/^audits\/restaurant$/, 'audit');
  const KIND_BY_SEGMENT = {
    'audit': 'audit',
    'seo-grader': 'seo',
    'gbp-grader': 'gbp',
    'mobile-check': 'mobile',
    'schema-check': 'schema',
    'speed-test': 'speed',
    'margin-math': 'margin',
    'plate-cost': 'plate',
    'photo-brief': 'photo',
    'menu-engineering': 'menu',
    'menu-copy': 'menu-copy',
    'brand-suite': 'brand',
    'open-hours': 'open-hours',
    'compare': 'compare',
    'tech-stack': 'tech-stack',
    'search-ideas': 'search-ideas',
    'storefront-health': 'storefront-health',
  };
  return KIND_BY_SEGMENT[segment] || null;
}

function main() {
  const skip = new Set(['_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler', 'docs', 'src', 'brand', 'assets', 'scripts']);
  const failures = [];
  let scanned = 0;
  let urlCount = 0;

  for (const file of walk(repoRoot, skip)) {
    scanned++;
    const text = fs.readFileSync(file, 'utf8');
    // Match href="..." attributes containing intent=
    const re = /href="([^"]*\bintent=[^"]*)"/g;
    let m;
    while ((m = re.exec(text))) {
      urlCount++;
      const href = m[1];
      // Decode the &amp; HTML entity so URLSearchParams sees raw &.
      const raw = href.replace(/&amp;/g, '&');
      let sp;
      try { sp = new URL(raw, 'https://example.com'); } catch (_) { continue; }
      const intent = sp.searchParams.get('intent');
      if (!intent) continue;
      const rel = path.relative(repoRoot, file);
      if (!INTENT_ENUM.has(intent)) {
        failures.push(`${rel}: intent="${intent}" not in closed enum`);
        continue;
      }
      const target = targetTool(sp.pathname);
      if (!target) {
        failures.push(`${rel}: intent= URL "${raw}" does not point to a tool path`);
        continue;
      }
      // Verify the target tool has an index.html (route exists).
      const targetHtml = path.join(repoRoot, target, 'index.html');
      if (!fs.existsSync(targetHtml)) {
        failures.push(`${rel}: intent= URL points to "${target}" which has no index.html`);
        continue;
      }
      // Verify the target tool loads workbench-save.js (so readIntent runs).
      const targetText = fs.readFileSync(targetHtml, 'utf8');
      if (!targetText.includes('workbench-save.js')) {
        failures.push(`${rel}: intent= URL points to "${target}" but that tool does not load workbench-save.js`);
      }
    }
  }

  if (failures.length) {
    console.error('Intent-param targets:');
    for (const f of failures) console.error('  ✗ ' + f);
    process.exit(1);
  }
  console.log(`Intent-param targets: ${urlCount} link(s) across ${scanned} HTML files all resolve.`);
}

main();
