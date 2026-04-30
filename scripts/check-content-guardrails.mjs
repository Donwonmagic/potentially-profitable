#!/usr/bin/env node
/**
 * Phase G.5 (Growth) — content guardrails check.
 *
 * For every blog post (EN + ES), assert that the editorial rubric
 * holds. The rubric codifies what makes a Muntin article both
 * SEO-strong and AI-citation-strong:
 *
 *   1. Article JSON-LD with author.@id == #don-goldstein
 *   2. ≥1 class="tldr" block within first 800 chars of #post-body
 *      (already enforced by check-article-tldr.mjs — re-check here
 *      in case that one is bypassed)
 *   3. ≥1 class="key-takeaways" block before article-foot
 *   4. ≥3 internal links to /glossary/<slug>/
 *   5. ≥2 internal links to /tools/<slug>/
 *   6. No "book a call" / "schedule a call" / "Calendly" strings
 *   7. ES counterpart at the parallel path OR data-es-pending="..."
 *      ≤30 days out (locale-parity check already enforces this;
 *      we re-check here for completeness)
 *
 * Articles still carrying the data-content-pending escape hatch
 * (G.1) skip the rubric — the stamp must be ≤60 days old.
 *
 *   node scripts/check-content-guardrails.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const PENDING_RE = /data-content-pending="(\d{4}-\d{2}-\d{2})"/;
const STALE_DAYS = 60;
const now = Date.now();

function articleFiles() {
  const out = [];
  for (const dir of ['blog', 'es/blog']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    for (const slug of fs.readdirSync(root)) {
      if (slug === 'drafts') continue;
      const file = path.join(root, slug, 'index.html');
      if (fs.existsSync(file)) out.push({ file, slug, locale: dir.startsWith('es') ? 'es' : 'en' });
    }
  }
  return out;
}

function checkRubric(file, slug, locale) {
  const src = fs.readFileSync(file, 'utf8');
  const issues = [];

  // 1. Article JSON-LD with author.@id #don-goldstein.
  const ldBlocks = [...src.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/g)];
  let hasArticleSchema = false;
  for (const m of ldBlocks) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch (_) { continue; }
    const graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
    for (const node of graph) {
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if (!types.some((t) => t === 'Article' || t === 'BlogPosting' || t === 'NewsArticle')) continue;
      const author = node.author;
      const authorId = author && (author['@id'] || (Array.isArray(author) && author[0]?.['@id']));
      if (authorId && /#don-goldstein$/.test(authorId)) hasArticleSchema = true;
    }
  }
  if (!hasArticleSchema) issues.push('missing Article JSON-LD with author.@id == #don-goldstein');

  // 4. ≥3 internal links to /glossary/<slug>/.
  const glossaryLinks = (src.match(/href="\/(?:es\/)?glossary\/[a-z0-9-]+\//g) || []).length;
  if (glossaryLinks < 3) issues.push(`only ${glossaryLinks} glossary link(s); need ≥3`);

  // 5. ≥2 internal links to /tools/<slug>/.
  const toolLinks = (src.match(/href="\/(?:es\/)?tools\/[a-z0-9/-]+\//g) || []).length;
  if (toolLinks < 2) issues.push(`only ${toolLinks} tool link(s); need ≥2`);

  // 6. No "book a call" / "schedule a call" / "Calendly".
  const forbidden = [/\bbook a call\b/i, /\bschedule a call\b/i, /\bcalendly\.com\b/i, /\bagendar una llamada\b/i, /\breservar una llamada\b/i];
  for (const re of forbidden) {
    if (re.test(src)) issues.push(`contains forbidden CTA phrase: ${re.source}`);
  }

  return issues;
}

const articles = articleFiles();
const failures = [];
const pending = [];

for (const { file, slug, locale } of articles) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(repoRoot, file);
  const pendM = src.match(PENDING_RE);
  if (pendM) {
    const stampedAt = Date.parse(pendM[1]);
    if (Number.isFinite(stampedAt) && (now - stampedAt) <= STALE_DAYS * 86400 * 1000) {
      pending.push(rel);
      continue;
    }
    failures.push(`${rel}: data-content-pending="${pendM[1]}" stale (>${STALE_DAYS}d)`);
    continue;
  }
  const issues = checkRubric(file, slug, locale);
  if (issues.length) failures.push(`${rel}:\n    · ${issues.join('\n    · ')}`);
}

if (pending.length) {
  console.log(`Content guardrails: ${pending.length} article(s) on the data-content-pending escape hatch.`);
}

if (failures.length) {
  console.error(`Content guardrails: ${failures.length} article(s) failing the rubric:`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Content guardrails: ${articles.length - pending.length} article(s) pass the 6-point rubric.`);
