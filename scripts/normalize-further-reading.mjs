#!/usr/bin/env node
// Normalize the "back to" link in each blog post's .further-reading
// aside so it points at the Learn library hub instead of the bare blog
// index. Closes the ecosystem loop: a reader who finishes an article
// lands on the library shelf, not a list of more articles, which
// surfaces tools and the glossary alongside the next read.
//
// Idempotent: skips posts whose "back" link already points at /learn/
// (or /es/learn/) so re-runs are a no-op.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REPLACEMENTS = {
  en: {
    href: '/learn/',
    pattern: /<a href="\/blog\/">\s*<h4(?:\s+class="i18n")?>Back to Writing<\/h4>\s*<p>More notes from the studio\.<\/p>\s*<\/a>/,
    replacement:
      '<a href="/learn/">\n        <h4 class="i18n">Back to the library</h4>\n        <p>Articles, tools, glossary, and the checklist — all in one shelf.</p>\n      </a>',
  },
  es: {
    href: '/es/learn/',
    // ES posts vary: "Volver a Escritura", "Volver a los escritos",
    // "Volver al blog" — and the trailing teaser also varies. Match
    // the structural shape (href to /es/blog/ followed by an H4 that
    // starts with "Volver" and a one-line P) instead of literal copy.
    pattern: /<a href="\/es\/blog\/">\s*<h4(?:\s+class="i18n")?>Volver[^<]*<\/h4>\s*<p>[^<]*<\/p>\s*<\/a>/,
    replacement:
      '<a href="/es/learn/">\n        <h4 class="i18n">Volver a la biblioteca</h4>\n        <p>Artículos, herramientas, glosario y checklist — todo en un solo estante.</p>\n      </a>',
  },
};

function collectPosts(locale) {
  const blogDir = locale === 'en'
    ? path.join(repoRoot, 'blog')
    : path.join(repoRoot, locale, 'blog');
  if (!fs.existsSync(blogDir)) return [];
  return fs.readdirSync(blogDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== 'drafts')
    .map(e => path.join(blogDir, e.name, 'index.html'))
    .filter(p => fs.existsSync(p));
}

let updated = 0, alreadyOk = 0, noFurtherReading = 0;
for (const locale of ['en', 'es']) {
  const { pattern, replacement, href } = REPLACEMENTS[locale];
  for (const file of collectPosts(locale)) {
    const src = fs.readFileSync(file, 'utf8');
    if (!/<aside class="further-reading">/.test(src)) {
      noFurtherReading++;
      console.log(`no .further-reading [${locale}]: ${path.relative(repoRoot, file)}`);
      continue;
    }
    if (src.includes(`<a href="${href}">`) && /Back to the library|Volver a la biblioteca/.test(src)) {
      alreadyOk++;
      continue;
    }
    const next = src.replace(pattern, replacement);
    if (next === src) {
      console.warn(`pattern miss [${locale}]: ${path.relative(repoRoot, file)}`);
      continue;
    }
    fs.writeFileSync(file, next);
    updated++;
    console.log(`updated [${locale}]: ${path.relative(repoRoot, file)}`);
  }
}
console.log(`\n${updated} updated, ${alreadyOk} already pointed at library, ${noFurtherReading} have no .further-reading aside (manual addition needed)`);
