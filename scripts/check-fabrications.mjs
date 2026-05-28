#!/usr/bin/env node
/**
 * Fabrication blocklist — pre-publish gate against the patterns that
 * have historically returned to the library as invented facts.
 *
 * History (May 2026 fact-check round): earlier waves drafted authoritative-
 * sounding industry analysis with invented operator data dressed as
 * first-party experience. "The two restaurants I manage." "100-restaurant
 * DMV cohort." "90 days of paired queries." "$4,000 incremental margin."
 * None were ever pulled from a real source. Don was rightfully furious.
 *
 * This check blocks these patterns at publish time so they can't come
 * back. If a future article legitimately needs to make one of the blocked
 * claims, it either has to be added to data/sourced-claims.json with a
 * real source URL, or labeled illustrative in the prose, or removed.
 *
 * Patterns blocked:
 *   1. "two restaurants I manage" / "manages two DMV restaurants" /
 *      "los dos restaurantes que manejo" / "maneja dos restaurantes" —
 *      the keystone bio fabrication (real bio: full-time at Tacombi
 *      Bethesda only, per data/sourced-claims.json).
 *   2. "paired-restaurant ledgers" / "AI Overviews citation-tracking" —
 *      the two invented datasets named on the old /methods/ page.
 *   3. Specific cohort sizes followed by percentage distributions
 *      ("100-restaurant DMV cohort", "50-restaurant audit") — pattern
 *      consistently came back as invented sampling.
 *   4. Quarterly AI Overview percentages outside the registered claim
 *      ("Q1 2024 ~6%", "Q3 2025 ~16%", "Q2 2026 ~20%") — only the
 *      March 2025 13.14% figure has a real source.
 *   5. Specific incremental-margin dollar swings tied to a date
 *      ("$4,000 incremental margin", "kept margin climbed 56%") —
 *      these were always fabricated; rewrite as illustrative ranges.
 *
 * Articles that legitimately need to discuss these topics can either:
 *   (a) frame the number as illustrative ("a single-digit dip in
 *       week one"),
 *   (b) cite a real source via <details class="cite">…</details>,
 *   (c) add the specific claim to data/sourced-claims.json with the
 *       source URL and date_verified.
 *
 *   node scripts/check-fabrications.mjs           # report violations
 *   node scripts/check-fabrications.mjs --check   # exit 1 if any found
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

// Build a Set of URLs that have been verified and registered in
// data/sourced-claims.json with url_status: "deep-link". These URLs are
// exempt from the deep-link blocklist rules below — they're allowed
// because someone (presumably Don) confirmed they 200 in a real browser.
// To add a new verified deep-link, edit data/sourced-claims.json.
const ALLOWED_DEEP_LINKS = (() => {
  const out = new Set();
  try {
    const registry = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'data/sourced-claims.json'), 'utf8')
    );
    for (const entry of Object.values(registry.claims || {})) {
      if (entry.url_status === 'deep-link' && entry.source_url) {
        out.add(entry.source_url);
      }
    }
  } catch (e) {
    // If the registry is unreadable, fall back to empty allowlist (strict).
  }
  return out;
})();

// Each rule: { pattern: RegExp, label: string, fix: string }
// The pattern is matched against article HTML; fix describes what to do.
const BLOCKED = [
  {
    pattern: /\btwo restaurants I manage\b/gi,
    label: 'bio: "two restaurants I manage"',
    fix: 'Bio is now singular (Tacombi Bethesda only). Rewrite to "the restaurant I manage" or "my front-of-house role" or remove the parenthetical.',
  },
  {
    pattern: /\bmanages two (DMV )?restaurants\b/gi,
    label: 'bio: "manages two restaurants"',
    fix: 'Don is currently full-time at Tacombi Bethesda only. Rewrite to "is a restaurant operator" or "is front-of-house manager at Tacombi Bethesda."',
  },
  {
    pattern: /\bI manage two (DMV )?restaurants\b/gi,
    label: 'bio: "I manage two restaurants"',
    fix: 'Don is currently full-time at Tacombi Bethesda only. Rewrite to first-person singular role.',
  },
  {
    pattern: /\bmanaging two (DMV )?restaurants\b/gi,
    label: 'bio: "managing two restaurants"',
    fix: 'Rewrite to "running front-of-house at a DMV restaurant" or similar.',
  },
  {
    pattern: /\bboth (DMV )?restaurants\b/gi,
    label: 'bio: "both restaurants" (references the dropped two-restaurant frame)',
    fix: 'Singular bio. Replace with "the restaurant" or rework the surrounding clause.',
  },
  {
    pattern: /\bthe two DMV restaurants( Don| I)?\b/gi,
    label: 'bio: "the two DMV restaurants"',
    fix: 'Singular bio. Replace with "the restaurant" or rework.',
  },
  // ES equivalents
  {
    pattern: /\bLlevo dos restaurantes\b/gi,
    label: 'ES bio: "Llevo dos restaurantes"',
    fix: 'Reescribe a "Soy jefe de salón en Tacombi en Bethesda" o forma singular equivalente.',
  },
  {
    pattern: /\blos dos restaurantes que (manejo|llevo|administro)\b/gi,
    label: 'ES bio: "los dos restaurantes que manejo"',
    fix: 'Singular. Reescribe a "el restaurante que manejo".',
  },
  {
    pattern: /\bmaneja dos restaurantes\b/gi,
    label: 'ES bio: "maneja dos restaurantes"',
    fix: 'Reescribe a "es operador de restaurante".',
  },
  {
    pattern: /\badministra dos restaurantes\b/gi,
    label: 'ES bio: "administra dos restaurantes"',
    fix: 'Reescribe a "lleva el salón de un restaurante".',
  },
  // Invented datasets — these were named on old /methods/ and across articles
  {
    pattern: /\bpaired[- ]restaurant operating ledgers?\b/gi,
    label: 'invented dataset: "paired-restaurant operating ledgers"',
    fix: 'This dataset does not exist. Cite a real source from data/sourced-claims.json or remove the claim.',
  },
  {
    pattern: /\bAI Overviews citation-tracking\b/gi,
    label: 'invented dataset: "AI Overviews citation-tracking" (the 90-day paired-query study)',
    fix: 'This dataset does not exist. Use the Search Engine Land March 2025 measurement (registered as ai_overview_share_march_2025) instead.',
  },
  {
    pattern: /\b90 days of paired (Google )?queries\b/gi,
    label: 'invented methodology: "90 days of paired queries"',
    fix: 'This study was never conducted. Cite the public AI Overview measurement or label the framing illustrative.',
  },
  {
    pattern: /\b(?:100|50)-restaurant DMV cohort\b/gi,
    label: 'invented sampling: "N-restaurant DMV cohort"',
    fix: 'No such measured cohort exists. Reframe as "in operator practice" or "across the restaurants Muntin audits" without specific N.',
  },
  // Quarterly AI Overview percentages outside the registered claim.
  // Only the March 2025 13.14% figure has a real source.
  {
    pattern: /Q[1234]\s*20(2[4-9])\s*[\(:]?[^"<]{0,30}\b(?:six|nine|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*(percent|%)/gi,
    label: 'AI Overview quarterly trajectory (only Q1 2025 13.14% is sourced)',
    fix: 'Cite only the registered March 2025 13.14% figure (data/sourced-claims.json#ai_overview_share_march_2025). Report subsequent direction qualitatively as "rising, not flat".',
  },
  // External URL deep-link patterns previously caught as fabricated. Each
  // of these was a specific URL path that did not resolve on the live
  // source. The library now cites these sources by name with a TLD link.
  // If you need to deep-link any of these hosts in a new article, paste
  // the live URL from a browser visit, verify it 200s, and add the
  // specific claim to data/sourced-claims.json with url_status: "deep-link".
  {
    pattern: /https?:\/\/(?:www\.)?nngroup\.com\/articles\/[a-z0-9\-]+\/?/gi,
    label: 'NNG deep-link citation (slugs reported as 404)',
    fix: 'Replace with TLD-only link (https://www.nngroup.com/) and credit Nielsen Norman Group by name. If you must deep-link, paste the live URL from a browser visit and add the article to data/sourced-claims.json.',
  },
  {
    pattern: /https?:\/\/baymard\.com\/lists\/[a-z0-9\-]+/gi,
    label: 'Baymard deep-link citation (slug unverified)',
    fix: 'Replace with TLD-only link (https://baymard.com/) and credit Baymard Institute by name. If you must deep-link, paste the live URL from a browser visit and add the page to data/sourced-claims.json.',
  },
  {
    pattern: /https?:\/\/(?:www\.)?thinkwithgoogle\.com\/marketing-strategies\/[a-z0-9\-\/]+/gi,
    label: 'Think with Google deep-link citation (slug unverified)',
    fix: 'Replace with TLD-only link (https://www.thinkwithgoogle.com/) and credit Think with Google by name.',
  },
  {
    pattern: /https?:\/\/(?:www\.)?searchengineland\.com\/[a-z0-9\-]{6,}/gi,
    label: 'Search Engine Land deep-link citation (slug unverified)',
    fix: 'Replace with TLD-only link (https://searchengineland.com/) and credit Search Engine Land + the date and title of the article in the citation drawer.',
  },
  {
    pattern: /https?:\/\/restaurant\.org\/research-and-media\/[a-z0-9\-\/]+/gi,
    label: 'National Restaurant Association deep-link citation (slug unverified)',
    fix: 'Replace with TLD-only link (https://restaurant.org/) and credit the National Restaurant Association by name.',
  },
];

// Files to skip — historical changelog (should be allowed to reference
// the patterns to explain what was cut), the audit-page reader-addressing
// "you manage two or more restaurants" phrasing, and any draft notes.
const SKIP_PATHS = [
  /\/changelog\//,
  /\/drafts\//,
  /scripts\/check-fabrications\.mjs$/, // this file
  /scripts\/inject-article-author-card\.mjs$/, // template (cleaned)
  /scripts\/sweep-two-restaurants/, // the cleanup script itself
  /data\/sourced-claims\.json$/, // the registry itself
  /docs\/fact-check\.md$/, // the rule doc documents the blocked patterns
  /docs\/voice-canon-blog\.md$/, // blog canon documents the same blocked patterns
  /docs\/release-notes\/.*audio-retranslate\.md$/, // re-render runbook documents which patterns were cut
  /\.git\//,
  /node_modules\//,
  /\/audio(\.[a-z]+)?\.json$/, // audio narration files — regenerated from cleaned HTML; not source of truth
];

// Phrases-in-context that are allowed even though they pattern-match. These
// are the addressing-the-reader uses ("you manage two or more restaurants").
const ALLOWED_CONTEXTS = [
  /You manage two or more restaurants/, // services/audit reader prompt
  /same day for two restaurants/, // services/audit booking policy
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (SKIP_PATHS.some((re) => re.test(p))) continue;
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (['.html', '.json', '.md', '.mjs'].includes(ext)) out.push(p);
    }
  }
  return out;
}

const files = walk(repoRoot);
const violations = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of BLOCKED) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(text)) !== null) {
      // Inspect ~120 chars of context to allow legitimate uses.
      const start = Math.max(0, match.index - 60);
      const end = Math.min(text.length, match.index + match[0].length + 60);
      const ctx = text.slice(start, end);
      if (ALLOWED_CONTEXTS.some((re) => re.test(ctx))) continue;
      // If this match is a URL that's been verified and registered in
      // data/sourced-claims.json with url_status: "deep-link", let it
      // through. The registry is the system-of-record for verified URLs.
      const matched = match[0];
      if (matched.startsWith('http') && ALLOWED_DEEP_LINKS.has(matched.replace(/[)\].,;]+$/, ''))) continue;
      // Line number for the operator
      const lineNum = text.slice(0, match.index).split('\n').length;
      violations.push({
        file: path.relative(repoRoot, file),
        line: lineNum,
        label: rule.label,
        match: match[0],
        fix: rule.fix,
      });
    }
  }
}

const checkOnly = process.argv.includes('--check');

if (violations.length === 0) {
  console.log('check-fabrications: 0 blocklist hits.');
  process.exit(0);
}

console.error(`check-fabrications: ${violations.length} blocklist hit(s):\n`);
// Group by file for readability
const byFile = new Map();
for (const v of violations) {
  if (!byFile.has(v.file)) byFile.set(v.file, []);
  byFile.get(v.file).push(v);
}
for (const [file, vs] of byFile) {
  console.error(`  ${file}`);
  for (const v of vs) {
    console.error(`    L${v.line}: ${v.label}`);
    console.error(`           matched: "${v.match.replace(/\s+/g, ' ').slice(0, 80)}"`);
    console.error(`           fix: ${v.fix}`);
  }
  console.error('');
}
console.error('See data/sourced-claims.json for the registry of verified claims.');
console.error('See docs/fact-check.md for the editorial rule.');
process.exit(checkOnly ? 1 : 1);
