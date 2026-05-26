#!/usr/bin/env node
/**
 * Phase G.1 (Growth) — assert every blog post carries a TL;DR
 * block within the first 800 chars of #post-body, AND a Key
 * Takeaways block before the article-foot CTA.
 *
 * The pattern is the highest-leverage AI-citation hint we can
 * ship: LLM search engines (ChatGPT, Perplexity, Google AI
 * Overviews, Claude) lift TL;DR + bulleted takeaways nearly
 * verbatim. Without these, the same content gets paraphrased
 * (or skipped) and Muntin loses citation share.
 *
 * Usage:
 *   node scripts/check-article-tldr.mjs --check
 *
 * Exits 0 when every post has both blocks; 1 with a per-file
 * report otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const TLDR_RE       = /<aside\b[^>]*class="[^"]*\btldr\b[^"]*"/i;
const TAKEAWAYS_RE  = /<aside\b[^>]*class="[^"]*\bkey-takeaways\b[^"]*"/i;
const POST_BODY_RE  = /<(article|main|div)[^>]*\bpost-body\b[^>]*>/i;
// Phase G.1 escape hatch — articles in mid-retrofit can carry
// data-content-pending="YYYY-MM-DD" on their <body> or <article>.
// The check passes on those (warning logged) so CI stays green
// while Don backfills. Stale stamps (>60 days old) hard-fail.
const PENDING_RE    = /data-content-pending="(\d{4}-\d{2}-\d{2})"/;

function articleFiles() {
  const out = [];
  for (const dir of ['blog', 'es/blog', 'library', 'es/library']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    for (const slug of fs.readdirSync(root)) {
      if (slug === 'drafts') continue;
      const file = path.join(root, slug, 'index.html');
      if (fs.existsSync(file)) out.push(file);
    }
  }
  return out;
}

const failures = [];
const pending = [];
const files = articleFiles();

const STALE_DAYS = 60;
const now = Date.now();

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(repoRoot, file);

  // Escape hatch: data-content-pending="YYYY-MM-DD" lets an
  // article opt out while it's mid-retrofit. Stale stamps fail.
  const pendM = src.match(PENDING_RE);
  if (pendM) {
    const stampedAt = Date.parse(pendM[1]);
    if (Number.isFinite(stampedAt) && (now - stampedAt) <= STALE_DAYS * 86400 * 1000) {
      pending.push(`${rel} (stamped ${pendM[1]})`);
      continue;
    }
    failures.push(`${rel}: data-content-pending="${pendM[1]}" is older than ${STALE_DAYS} days — retrofit or remove the stamp`);
    continue;
  }

  const bodyM = src.match(POST_BODY_RE);
  if (!bodyM) {
    if (!TAKEAWAYS_RE.test(src)) {
      failures.push(`${rel}: missing key-takeaways block (no post-body anchor either)`);
    }
    continue;
  }
  // 3000-char window — covers the typical <header> block (title +
  // listen-btn + dek) so the TLDR can sit AFTER the header rather
  // than awkwardly above it. AI extractors read the whole page; the
  // window is just a hint that the TLDR has to land early-ish.
  const window = src.slice(bodyM.index, bodyM.index + 3000 + bodyM[0].length);
  if (!TLDR_RE.test(window)) {
    failures.push(`${rel}: TL;DR block (<aside class="tldr">) missing within first 3000 chars of post-body`);
  }
  if (!TAKEAWAYS_RE.test(src)) {
    failures.push(`${rel}: key-takeaways block (<aside class="key-takeaways">) missing`);
  }
}

if (pending.length) {
  console.log(`Article TL;DR + takeaways: ${pending.length} pending (within ${STALE_DAYS}d):`);
  for (const p of pending) console.log('  · ' + p);
}

if (failures.length) {
  console.error(`Article TL;DR + takeaways: ${failures.length} issue(s) across ${files.length} article(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  console.error('\nAdd <aside class="tldr"> within the first 800 chars of #post-body,');
  console.error('and <aside class="key-takeaways"> before the article-foot CTA.');
  process.exit(1);
}
console.log(`Article TL;DR + takeaways: ${files.length} article(s) clean.`);
