#!/usr/bin/env node
/**
 * Phase H.2 (Information Security) — render the /security/ page
 * (EN + ES) from data/security-claims.json. Two passes per locale:
 *
 *   1. HTML body: stamp the 9 claims, the 5-test audit table, and
 *      the 4-tier grid into their sentinel-bracketed slots:
 *        <!-- security-claims:start --> ... <!-- security-claims:end -->
 *        <!-- security-audit:start --> ... <!-- security-audit:end -->
 *        <!-- security-tiers:start --> ... <!-- security-tiers:end -->
 *
 *   2. JSON-LD: a single <script type="application/ld+json"> block
 *      between <!-- security-page-schema:start --> sentinels.
 *      Carries CollectionPage + TechArticle + ItemList of Claim
 *      items so search engines + LLMs can lift the structured
 *      claims directly.
 *
 *   node scripts/inject-security-page-schema.mjs
 *   node scripts/inject-security-page-schema.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const dataPath = path.join(repoRoot, 'data/security-claims.json');
if (!fs.existsSync(dataPath)) { console.log('security-claims data missing'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const claims = data.claims || [];
const tests = data.audit_tests || [];
const tiers = data.data_tiers || [];

const SENTINELS = {
  schema:  /<!-- security-page-schema:start -->[\s\S]*?<!-- security-page-schema:end -->/,
  claims:  /<!-- security-claims:start[^>]*-->[\s\S]*?<!-- security-claims:end -->/,
  audit:   /<!-- security-audit:start[^>]*-->[\s\S]*?<!-- security-audit:end -->/,
  tiers:   /<!-- security-tiers:start[^>]*-->[\s\S]*?<!-- security-tiers:end -->/,
};

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function renderClaims(locale) {
  const items = claims.map((c) => {
    const headline = locale === 'es' ? c.headline_es : c.headline_en;
    const claim   = locale === 'es' ? c.claim_es   : c.claim_en;
    const verify  = locale === 'es' ? c.verify_es  : c.verify_en;
    const inspect = locale === 'es' ? 'Verifícalo' : 'Inspect this';
    return `      <article class="security-claim" id="claim-${c.id}">
        <span class="security-claim__num" aria-hidden="true">${c.id}</span>
        <div class="security-claim__body">
          <h3 class="security-claim__title">${escHtml(headline)}</h3>
          <p class="security-claim__text">${escHtml(claim)}</p>
          <details class="security-claim__inspect"><summary>${inspect}</summary>
            <p class="security-claim__verify">${escHtml(verify)}</p>
          </details>
        </div>
      </article>`;
  }).join('\n');
  return [
    '<!-- security-claims:start (rendered by scripts/inject-security-page-schema.mjs) -->',
    '      <div class="security-claims-list">',
    items,
    '      </div>',
    '      <!-- security-claims:end -->',
  ].join('\n');
}

function renderAudit(locale) {
  const cols = locale === 'es'
    ? { test: 'La prueba', muntin: 'Muntin', typical: 'Herramienta típica' }
    : { test: 'The test',   muntin: 'Muntin', typical: 'Typical free tool' };
  const rows = tests.map((t) => {
    const test = locale === 'es' ? t.test_es : t.test_en;
    const hint = locale === 'es' ? t.hint_es : t.hint_en;
    const pass = locale === 'es' ? t.muntin_pass_es : t.muntin_pass_en;
    const fail = locale === 'es' ? t.typical_fail_es : t.typical_fail_en;
    return `        <tr>
          <td><strong>${t.id}. ${escHtml(test)}</strong><br><span class="security-audit__hint">${escHtml(hint)}</span></td>
          <td class="security-audit__pass">${escHtml(pass)}</td>
          <td class="security-audit__fail">${escHtml(fail)}</td>
        </tr>`;
  }).join('\n');
  return [
    '<!-- security-audit:start (rendered by scripts/inject-security-page-schema.mjs) -->',
    '      <table class="security-audit">',
    '        <thead><tr>',
    `          <th scope="col">${cols.test}</th>`,
    `          <th scope="col">${cols.muntin}</th>`,
    `          <th scope="col">${cols.typical}</th>`,
    '        </tr></thead>',
    '        <tbody>',
    rows,
    '        </tbody>',
    '      </table>',
    '      <!-- security-audit:end -->',
  ].join('\n');
}

function renderTiers(locale) {
  const labels = locale === 'es' ? { tier: 'Tier', share: 'Compartir con:' } : { tier: 'Tier', share: 'Share with:' };
  const items = tiers.map((t) => {
    const name = locale === 'es' ? t.name_es : t.name_en;
    const desc = locale === 'es' ? t.desc_es : t.desc_en;
    const examples = locale === 'es' ? t.examples_es : t.examples_en;
    const share = locale === 'es' ? t.share_es : t.share_en;
    return `      <article class="security-tier" data-tier="${t.id}">
        <header><span class="security-tier__label">${labels.tier} ${t.id}</span><h3>${escHtml(name)}</h3></header>
        <p class="security-tier__desc">${escHtml(desc)}</p>
        <ul>${examples.map((x) => `<li>${escHtml(x)}</li>`).join('')}</ul>
        <p class="security-tier__share"><strong>${labels.share}</strong> ${escHtml(share)}</p>
      </article>`;
  }).join('\n');
  return [
    '<!-- security-tiers:start (rendered by scripts/inject-security-page-schema.mjs) -->',
    '      <div class="security-tiers-grid">',
    items,
    '      </div>',
    '      <!-- security-tiers:end -->',
  ].join('\n');
}

function buildSchemaBlock(locale) {
  const baseUrl = `${SITE}${locale === 'es' ? '/es' : ''}/security/`;
  const obj = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}#collection`,
        name: locale === 'es' ? 'Datos y seguridad' : 'Data & security',
        url: baseUrl,
        inLanguage: locale === 'es' ? 'es-US' : 'en-US',
        about: { '@id': `${baseUrl}#claims-article` },
        publisher: { '@id': `${SITE}/#business` },
      },
      {
        '@type': 'TechArticle',
        '@id': `${baseUrl}#claims-article`,
        headline: locale === 'es' ? 'Cómo manejamos tus datos — nueve afirmaciones verificables' : 'How we handle your data — nine verifiable claims',
        url: baseUrl,
        author: { '@id': `${SITE}/#don-goldstein` },
        publisher: { '@id': `${SITE}/#business` },
        proficiencyLevel: 'Beginner',
        mainEntity: { '@id': `${baseUrl}#claim-list` },
        inLanguage: locale === 'es' ? 'es-US' : 'en-US',
      },
      {
        '@type': 'ItemList',
        '@id': `${baseUrl}#claim-list`,
        numberOfItems: claims.length,
        itemListElement: claims.map((c) => ({
          '@type': 'Claim',
          '@id': `${baseUrl}#claim-${c.id}`,
          position: c.id,
          name: locale === 'es' ? c.headline_es : c.headline_en,
          text: locale === 'es' ? c.claim_es : c.claim_en,
          appearance: { '@type': 'WebPageElement', url: `${baseUrl}#claim-${c.id}` },
        })),
      },
    ],
  };
  return [
    '<!-- security-page-schema:start -->',
    `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`,
    '<!-- security-page-schema:end -->',
  ].join('\n');
}

let changed = 0;
for (const locale of ['en', 'es']) {
  const file = path.join(repoRoot, locale === 'es' ? 'es/security' : 'security', 'index.html');
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  let next = src;
  next = next.replace(SENTINELS.schema, buildSchemaBlock(locale));
  next = next.replace(SENTINELS.claims, renderClaims(locale));
  next = next.replace(SENTINELS.audit,  renderAudit(locale));
  next = next.replace(SENTINELS.tiers,  renderTiers(locale));
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} security page(s).`);
if (checkOnly && changed > 0) process.exit(1);
