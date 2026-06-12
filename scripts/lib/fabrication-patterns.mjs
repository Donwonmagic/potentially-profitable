/**
 * Shared fabrication-pattern registry.
 *
 * Single source of truth for the May-2026 fabrication blocklist. Both the
 * HTML/JSON gate (scripts/check-fabrications.mjs) and the language-aware
 * audio gate (scripts/check-audio-fabrications.mjs) import from here, so a
 * pattern is never defined twice and the two surfaces can never drift apart.
 *
 * Every rule carries a `langs` tag so the audio gate can apply the right
 * subset per spoken language:
 *   - 'invariant' — survives translation unchanged (URLs). Applied to EVERY
 *     audio language, because a fabricated deep-link reads identically in
 *     Mandarin as in English.
 *   - 'en'        — English prose patterns (bio drift, invented dataset names,
 *     cohort sizes, the English-number-word percentage trajectory). Applied to
 *     the English HTML and to audio.json.
 *   - 'es'        — Spanish bio-drift equivalents. Applied to the Spanish HTML
 *     and to audio.es.json.
 *
 * The HTML gate scans per-locale source already (en pages, es/ pages), so it
 * applies the whole set regardless of tag; the tag exists for the audio gate.
 *
 * See data/sourced-claims.json for the registry of verified claims and
 * docs/fact-check.md for the editorial rule.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
// scripts/lib/ -> repo root is two levels up.
export const repoRoot = path.resolve(path.dirname(__filename), '..', '..');

// Build a Set of URLs that have been verified and registered in
// data/sourced-claims.json with url_status: "deep-link". These URLs are
// exempt from the deep-link blocklist rules below — they're allowed
// because someone (presumably Don) confirmed they 200 in a real browser.
// To add a new verified deep-link, edit data/sourced-claims.json.
export const ALLOWED_DEEP_LINKS = (() => {
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

// Each rule: { pattern: RegExp, label, fix, langs }.
// `langs` controls which spoken languages the audio gate applies the rule to.
export const BLOCKED = [
  {
    pattern: /\btwo restaurants I manage\b/gi,
    label: 'bio: "two restaurants I manage"',
    fix: 'Bio is now singular (Tacombi Bethesda only). Rewrite to "the restaurant I manage" or "my front-of-house role" or remove the parenthetical.',
    langs: ['en'],
  },
  {
    pattern: /\bmanages two (DMV )?restaurants\b/gi,
    label: 'bio: "manages two restaurants"',
    fix: 'Don is currently full-time at Tacombi Bethesda only. Rewrite to "is a restaurant operator" or "is front-of-house manager at Tacombi Bethesda."',
    langs: ['en'],
  },
  {
    pattern: /\bI manage two (DMV )?restaurants\b/gi,
    label: 'bio: "I manage two restaurants"',
    fix: 'Don is currently full-time at Tacombi Bethesda only. Rewrite to first-person singular role.',
    langs: ['en'],
  },
  {
    pattern: /\bmanaging two (DMV )?restaurants\b/gi,
    label: 'bio: "managing two restaurants"',
    fix: 'Rewrite to "running front-of-house at a DMV restaurant" or similar.',
    langs: ['en'],
  },
  {
    pattern: /\bboth (DMV )?restaurants\b/gi,
    label: 'bio: "both restaurants" (references the dropped two-restaurant frame)',
    fix: 'Singular bio. Replace with "the restaurant" or rework the surrounding clause.',
    langs: ['en'],
  },
  {
    pattern: /\bthe two DMV restaurants( Don| I)?\b/gi,
    label: 'bio: "the two DMV restaurants"',
    fix: 'Singular bio. Replace with "the restaurant" or rework.',
    langs: ['en'],
  },
  {
    // 2026-06-11: "two current DMV restaurants" survived in the about
    // page's og:description because the pattern above required "the"
    // and no adjective. Any "two … restaurants" framed as CURRENT is
    // the same retired bio drift — catch the adjective variants.
    pattern: /\btwo (?:current|active|running) (?:DMV |D\.C\.? |Maryland )?restaurants\b/gi,
    label: 'bio: "two current/active DMV restaurants"',
    fix: 'Singular bio: full-time FOH manager at Tacombi in Bethesda. Past roles live in /about/#timeline.',
    langs: ['en'],
  },
  // ES equivalents
  {
    pattern: /\bLlevo dos restaurantes\b/gi,
    label: 'ES bio: "Llevo dos restaurantes"',
    fix: 'Reescribe a "Soy jefe de salón en Tacombi en Bethesda" o forma singular equivalente.',
    langs: ['es'],
  },
  {
    pattern: /\blos dos restaurantes que (manejo|llevo|administro)\b/gi,
    label: 'ES bio: "los dos restaurantes que manejo"',
    fix: 'Singular. Reescribe a "el restaurante que manejo".',
    langs: ['es'],
  },
  {
    pattern: /\bmaneja dos restaurantes\b/gi,
    label: 'ES bio: "maneja dos restaurantes"',
    fix: 'Reescribe a "es operador de restaurante".',
    langs: ['es'],
  },
  {
    pattern: /\badministra dos restaurantes\b/gi,
    label: 'ES bio: "administra dos restaurantes"',
    fix: 'Reescribe a "lleva el salón de un restaurante".',
    langs: ['es'],
  },
  {
    // Broad ES catch — covers the translator's phrasings ("Administro dos
    // restaurantes", "gestiona dos restaurantes DMV") that the narrow rules
    // above miss. The bio is singular in every language.
    pattern: /\b(?:administr[oa]|gestion[oa]|manej[oa]|llev[oa])\s+dos\s+restaurantes\b/gi,
    label: 'ES bio: "[administro/gestiona/manejo/llevo] dos restaurantes"',
    fix: 'Bio singular. Reescribe a "soy jefe de salón en Tacombi en Bethesda" o forma singular.',
    langs: ['es'],
  },
  // The keystone bio fabrication translated into the audio-only languages.
  // The site has no fr/it/pt/zh HTML surface, so these exist for the spoken
  // narration gate — the "two restaurants" drift propagated into every
  // translated track and is read aloud verbatim. The bio is singular: Don is
  // full-time FOH at Tacombi in Bethesda (data/sourced-claims.json).
  {
    pattern: /\bg[èe]re(?:nt|r)?\s+deux\s+restaurants\b/gi,
    label: 'FR bio: "gère deux restaurants"',
    fix: 'Bio au singulier. Réécrire en "est responsable de salle chez Tacombi à Bethesda" puis re-rendre l’audio.',
    langs: ['fr'],
  },
  {
    pattern: /\bgestisc[oe]\s+due\s+ristoranti\b/gi,
    label: 'IT bio: "gestisce due ristoranti"',
    fix: 'Bio al singolare. Riscrivere in "è responsabile di sala da Tacombi a Bethesda" e ri-renderizzare l’audio.',
    langs: ['it'],
  },
  {
    pattern: /\b(?:gerenci[oa]|administr[oa]|ger[ei])\s+dois\s+restaurantes\b/gi,
    label: 'PT bio: "gerencia dois restaurantes"',
    fix: 'Bio no singular. Reescrever para "é gerente de salão no Tacombi em Bethesda" e re-renderizar o áudio.',
    langs: ['pt'],
  },
  {
    pattern: /(管理|经营|經營|运营|運營)(两家|兩家)[A-Za-z]{0,4}餐(厅|廳)/g,
    label: 'ZH bio: "管理两家餐厅" (manages two restaurants)',
    fix: '简历应为单数。改写为"在贝塞斯达的 Tacombi 担任前厅经理"并重新渲染音频。',
    langs: ['zh'],
  },
  // Invented datasets — these were named on old /methods/ and across articles
  {
    pattern: /\bpaired[- ]restaurant operating ledgers?\b/gi,
    label: 'invented dataset: "paired-restaurant operating ledgers"',
    fix: 'This dataset does not exist. Cite a real source from data/sourced-claims.json or remove the claim.',
    langs: ['en'],
  },
  {
    pattern: /\bAI Overviews citation-tracking\b/gi,
    label: 'invented dataset: "AI Overviews citation-tracking" (the 90-day paired-query study)',
    fix: 'This dataset does not exist. Use the Search Engine Land March 2025 measurement (registered as ai_overview_share_march_2025) instead.',
    langs: ['en'],
  },
  {
    pattern: /\b90 days of paired (Google )?queries\b/gi,
    label: 'invented methodology: "90 days of paired queries"',
    fix: 'This study was never conducted. Cite the public AI Overview measurement or label the framing illustrative.',
    langs: ['en'],
  },
  {
    pattern: /\b(?:100|50)-restaurant DMV cohort\b/gi,
    label: 'invented sampling: "N-restaurant DMV cohort"',
    fix: 'No such measured cohort exists. Reframe as "in operator practice" or "across the restaurants Muntin audits" without specific N.',
    langs: ['en'],
  },
  // Quarterly AI Overview percentages outside the registered claim.
  // Only the March 2025 13.14% figure has a real source. The pattern keys on
  // English number words, so it is tagged 'en' (the audio gate's numeric-parity
  // tier is what catches stray percentages in the other languages).
  {
    pattern: /Q[1234]\s*20(2[4-9])\s*[\(:]?[^"<]{0,30}\b(?:six|nine|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*(percent|%)/gi,
    label: 'AI Overview quarterly trajectory (only Q1 2025 13.14% is sourced)',
    fix: 'Cite only the registered March 2025 13.14% figure (data/sourced-claims.json#ai_overview_share_march_2025). Report subsequent direction qualitatively as "rising, not flat".',
    langs: ['en'],
  },
  // External URL deep-link patterns previously caught as fabricated. Each
  // of these was a specific URL path that did not resolve on the live
  // source. These survive translation byte-for-byte, so they are
  // 'invariant' — the audio gate applies them to every language.
  {
    pattern: /https?:\/\/(?:www\.)?nngroup\.com\/articles\/[a-z0-9\-]+\/?/gi,
    label: 'NNG deep-link citation (slugs reported as 404)',
    fix: 'Replace with TLD-only link (https://www.nngroup.com/) and credit Nielsen Norman Group by name. If you must deep-link, paste the live URL from a browser visit and add the article to data/sourced-claims.json.',
    langs: ['invariant'],
  },
  {
    pattern: /https?:\/\/baymard\.com\/lists\/[a-z0-9\-]+/gi,
    label: 'Baymard deep-link citation (slug unverified)',
    fix: 'Replace with TLD-only link (https://baymard.com/) and credit Baymard Institute by name. If you must deep-link, paste the live URL from a browser visit and add the page to data/sourced-claims.json.',
    langs: ['invariant'],
  },
  {
    pattern: /https?:\/\/(?:www\.)?thinkwithgoogle\.com\/marketing-strategies\/[a-z0-9\-\/]+/gi,
    label: 'Think with Google deep-link citation (slug unverified)',
    fix: 'Replace with TLD-only link (https://www.thinkwithgoogle.com/) and credit Think with Google by name.',
    langs: ['invariant'],
  },
  {
    pattern: /https?:\/\/(?:www\.)?searchengineland\.com\/[a-z0-9\-]{6,}/gi,
    label: 'Search Engine Land deep-link citation (slug unverified)',
    fix: 'Replace with TLD-only link (https://searchengineland.com/) and credit Search Engine Land + the date and title of the article in the citation drawer.',
    langs: ['invariant'],
  },
  {
    pattern: /https?:\/\/restaurant\.org\/research-and-media\/[a-z0-9\-\/]+/gi,
    label: 'National Restaurant Association deep-link citation (slug unverified)',
    fix: 'Replace with TLD-only link (https://restaurant.org/) and credit the National Restaurant Association by name.',
    langs: ['invariant'],
  },
];

// Phrases-in-context that are allowed even though they pattern-match. These
// are the addressing-the-reader uses ("you manage two or more restaurants").
export const ALLOWED_CONTEXTS = [
  /You manage two or more restaurants/, // services/audit reader prompt
  /same day for two restaurants/, // services/audit booking policy
];

/**
 * Strip a trailing punctuation tail off a matched URL so it can be compared
 * against the registered deep-link allowlist. Mirrors the HTML gate.
 */
export function normalizeUrlMatch(matched) {
  return matched.replace(/[)\].,;]+$/, '');
}
