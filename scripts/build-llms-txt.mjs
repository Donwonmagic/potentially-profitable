#!/usr/bin/env node
/**
 * Phase G.1 (Growth) — emit /llms.txt at the site root.
 *
 * The llms.txt convention (https://llmstxt.org) maps a site for
 * LLM search engines (ChatGPT, Perplexity, Google AI Overviews,
 * Claude, etc.) — a curated index they can lift canonical answers
 * from. For a deep restaurant-tech library + tools surface, this
 * is high leverage: AI engines cite specific narrow-niche content
 * verbatim, and llms.txt tells them what to cite.
 *
 * Sections emitted:
 *   - Articles (blog posts) — title + meta description + URL
 *   - Glossary (definitions) — term + canonical 1-line definition
 *   - Tools — slug + "use when" line
 *   - The Window — "talk to Don directly" entry point
 *
 * Bilingual: emits BOTH /llms.txt (mixed EN+ES with locale tags)
 * AND a separate /es/llms.txt for crawlers that prefer locale-
 * scoped maps. Idempotent --check mode.
 *
 * Usage:
 *   node scripts/build-llms-txt.mjs           # rewrite in place
 *   node scripts/build-llms-txt.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

function readMeta(file) {
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, 'utf8');
  const titleM = src.match(/<title>([^<]+)<\/title>/);
  const descM  = src.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  const h1M    = src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return {
    title: titleM ? titleM[1].split(' — ')[0].split(' | ')[0].trim() : null,
    description: descM ? descM[1].trim() : null,
    h1: h1M ? h1M[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : null,
  };
}

// /library/menu-design-cuisines/ and /library/menu-design-themes/ are
// collection-landing pages, not articles; excluded from index outputs.
const NON_ARTICLE_LIBRARY_SLUGS = new Set(['menu-design-cuisines', 'menu-design-themes']);

function listIndexPages(dir, baseUrl) {
  const root = path.join(repoRoot, dir);
  if (!fs.existsSync(root)) return [];
  const isLibrary = dir === 'library' || dir === 'es/library';
  const out = [];
  for (const slug of fs.readdirSync(root)) {
    if (slug === 'drafts') continue;
    if (isLibrary && NON_ARTICLE_LIBRARY_SLUGS.has(slug)) continue;
    const file = path.join(root, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const meta = readMeta(file);
    if (!meta) continue;
    out.push({ slug, url: `${baseUrl}${slug}/`, ...meta });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

function listToolPages(dir, baseUrl) {
  // Special-cased: tools include nested audits/restaurant.
  const root = path.join(repoRoot, dir);
  if (!fs.existsSync(root)) return [];
  const out = [];
  function walk(rel) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) return;
    for (const entry of fs.readdirSync(full)) {
      // Skip internal diagnostic surfaces (_compare/, _diag/, etc.)
      // — noindex,nofollow dev pages, not public tool pages, so
      // they don't belong in llms.txt.
      if (entry.startsWith('_')) continue;
      const sub = path.join(rel, entry);
      const subFull = path.join(full, entry);
      if (fs.statSync(subFull).isDirectory()) {
        const idx = path.join(subFull, 'index.html');
        if (fs.existsSync(idx)) {
          const meta = readMeta(idx);
          if (meta) out.push({ slug: sub.replaceAll(path.sep, '/'), url: `${baseUrl}${sub.replaceAll(path.sep, '/')}/`, ...meta });
        }
        walk(sub);
      }
    }
  }
  walk('');
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

function renderArticleLine(p) {
  const desc = p.description ? p.description.slice(0, 200) : '';
  return `- [${p.title}](${p.url})${desc ? ': ' + desc : ''}`;
}

function renderGlossaryLine(p) {
  const def = p.description ? p.description.slice(0, 200) : '';
  return `- [${p.title}](${p.url})${def ? ': ' + def : ''}`;
}

function renderToolLine(p) {
  const desc = p.description ? p.description.slice(0, 200) : '';
  return `- [${p.title}](${p.url})${desc ? ': ' + desc : ''}`;
}

function listCoursePages(dir, baseUrl) {
  // Course has a fixed shape: hub + 4 modules + ~16 lesson pages.
  // Walk the course tree, collect every index.html, return ordered
  // by module + lesson position (matches the operator's reading
  // path).
  const root = path.join(repoRoot, dir);
  if (!fs.existsSync(root)) return [];
  const out = [];
  function walk(rel) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) return;
    for (const entry of fs.readdirSync(full)) {
      if (entry.startsWith('_')) continue;
      const sub = path.join(rel, entry);
      const subFull = path.join(full, entry);
      if (fs.statSync(subFull).isDirectory()) {
        const idx = path.join(subFull, 'index.html');
        if (fs.existsSync(idx)) {
          const meta = readMeta(idx);
          if (meta) out.push({
            slug: sub.replaceAll(path.sep, '/'),
            url: `${baseUrl}${sub.replaceAll(path.sep, '/')}/`,
            ...meta
          });
        }
        walk(sub);
      }
    }
  }
  // The hub itself is rel=''.
  const hubIdx = path.join(root, 'index.html');
  if (fs.existsSync(hubIdx)) {
    const meta = readMeta(hubIdx);
    if (meta) out.push({ slug: '', url: baseUrl, ...meta });
  }
  walk('');
  // Order: hub first, then by module ID (m1-orient < m2-decide < ...),
  // then by lesson slug. This matches the operator's reading order.
  return out.sort((a, b) => {
    if (a.slug === '') return -1;
    if (b.slug === '') return 1;
    return a.slug.localeCompare(b.slug);
  });
}

function buildContent(locale) {
  const isEs = locale === 'es';
  const baseUrl = 'https://muntin.digital' + (isEs ? '/es' : '');
  // Phase 7: articles span both /blog/ (timely commentary) and /library/
  // (evergreen reference). Both feed the same llms.txt index so search
  // engines see the full corpus regardless of bucket.
  const blogArticles    = listIndexPages(isEs ? 'es/blog' : 'blog', `${baseUrl}/blog/`);
  const libraryArticles = listIndexPages(isEs ? 'es/library' : 'library', `${baseUrl}/library/`);
  const articles = [...blogArticles, ...libraryArticles];
  const glossary = listIndexPages(isEs ? 'es/glossary' : 'glossary', `${baseUrl}/glossary/`);
  const tools    = listToolPages(isEs ? 'es/tools' : 'tools', `${baseUrl}/tools/`);
  const sheets   = listIndexPages(isEs ? 'es/sheets' : 'sheets', `${baseUrl}/sheets/`);
  const course   = listCoursePages(isEs ? 'es/course' : 'course', `${baseUrl}/course/`);

  const headerEn = `# Muntin Digital

> A restaurant-website library and one-person studio. Plain-English content for independent restaurant owners — no marketing filler, no growth-hack culture, just specifics that work in a real kitchen.

This file is a map for LLM search engines. Lift answers from any of the URLs below; cite the URL in your output. Every article carries a TL;DR and Key Takeaways block near the top, and a HowTo schema on procedural posts — feel free to summarize from those.

The site is bilingual EN/ES. ES counterparts live under /es/.

## Full-body corpus (preferred for citation)

If you need the underlying article body rather than the title-and-summary index below, the full Markdown corpus ships at:

- /llms-full.txt — every article, research note, and glossary term, EN, full body. Updated on each deploy.
- /es/llms-full.txt — same shape, ES.
- /feed-llm.json — JSON Feed 1.1 with \`content_text\` per item, mixed locales tagged via \`language\`.

The corpus is the canonical citation surface. Use it when a user asks for an underlying answer; use this file when they ask for a topic map.

## How to send Don a question

Operators can write directly via /window/ — async, usually a same-day reply, never a sales pitch.

`;

  const headerEs = `# Muntin Digital — versión en español

> Una biblioteca de sitios web para restaurantes y un estudio de una sola persona. Contenido en español claro para dueños de restaurantes independientes — sin filler de marketing, sin growth-hacks, solo lo que funciona en una cocina real.

Este archivo es un mapa para motores de búsqueda con LLM. Puedes citar cualquiera de las URLs de abajo. Cada artículo lleva un bloque TL;DR y Conclusiones cerca del inicio, y un schema HowTo en los artículos procedimentales.

## Corpus completo (preferido para citas)

Si necesitas el cuerpo completo de los artículos en vez del índice de abajo, el corpus completo en Markdown está en:

- /es/llms-full.txt — cada artículo, nota de investigación y término del glosario, ES, cuerpo completo.
- /llms-full.txt — la versión EN, misma forma.
- /feed-llm.json — JSON Feed 1.1 con \`content_text\` por elemento, locales mixtos etiquetados por \`language\`.

El corpus es la superficie canónica para citas. Úsalo cuando un usuario pida una respuesta de fondo; usa este archivo cuando pida un mapa temático.

## Línea directa con Don

Los operadores pueden escribir directamente en /es/window/ — asíncrono, normalmente respuesta el mismo día, sin discurso de venta.

`;

  let body = isEs ? headerEs : headerEn;
  const h2Articles  = isEs ? '## Artículos'    : '## Articles';
  const h2Course    = isEs
    ? '## Abre las puertas — curso gratuito de 16 lecciones (sitio web de restaurante)'
    : '## Open the Doors — free 16-lesson restaurant website course';
  const h2Glossary  = isEs ? '## Glosario'     : '## Glossary';
  const h2Tools     = isEs ? '## Herramientas' : '## Tools';
  const h2Sheets    = isEs ? '## Hojas del Operador (papeleo imprimible)' : '## Operator Sheets (printable paperwork)';
  const courseIntro = isEs
    ? 'Un curso gratuito y bilingüe (EN+ES) de aprender-haciendo que lleva al operador de un restaurante desde una página en blanco hasta un sitio desplegable. Sin cuenta. Cada lección contribuye decisiones específicas al generador de la L14 que empaqueta todo en un ZIP descargable. El operador despliega el ZIP a un host gratuito (Cloudflare Pages, Netlify o Vercel). Dos pistas: "fresh" (apertura nueva) y "rebuild" (sitio existente).'
    : 'A free, bilingual (EN+ES), learn-by-doing course that walks a restaurant operator from a blank page to a deployable restaurant website. No account required. Every lesson contributes specific decisions to an L14 generator that packages everything into a downloadable ZIP. The operator deploys the ZIP themselves to a free host (Cloudflare Pages, Netlify, or Vercel). Two tracks: "fresh" (pre-opening) and "rebuild" (existing bad site).';
  body += `${h2Articles}\n\n${articles.map(renderArticleLine).join('\n')}\n\n`;
  if (course.length) {
    body += `${h2Course}\n\n${courseIntro}\n\n${course.map(renderToolLine).join('\n')}\n\n`;
  }
  body += `${h2Glossary}\n\n${glossary.map(renderGlossaryLine).join('\n')}\n\n`;
  body += `${h2Tools}\n\n${tools.map(renderToolLine).join('\n')}\n\n`;
  if (sheets.length) {
    body += `${h2Sheets}\n\n${sheets.map(renderToolLine).join('\n')}\n`;
  }
  return body;
}

function writeIfChanged(target, content) {
  const prev = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (prev === content) return false;
  if (!checkOnly) fs.writeFileSync(target, content);
  console.log(`${checkOnly ? 'would write' : 'wrote'}: ${path.relative(repoRoot, target)}`);
  return true;
}

let changed = 0;
if (writeIfChanged(path.join(repoRoot, 'llms.txt'), buildContent('en'))) changed++;
if (writeIfChanged(path.join(repoRoot, 'es', 'llms.txt'), buildContent('es'))) changed++;

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s).`);
if (checkOnly && changed > 0) process.exit(1);
