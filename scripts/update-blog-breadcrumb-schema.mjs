#!/usr/bin/env node
// Bring each blog post's JSON-LD BreadcrumbList into alignment with
// the visible breadcrumb (Home > Learn > Articles > Title). The EN
// and ES blog posts were created before the Learn IA landed, so
// their schema still reads Home > Blog > Title. Google uses the
// JSON-LD breadcrumb for rich results; leaving it stale means
// search snippets show the old path.
//
// Transforms:
//   position 2 "Blog" → position 2 "Learn"  (+ position 3 "Articles")
//   bumps the post's position 3 entry to position 4
//
// Locale-aware via file path. Idempotent: re-running on an already-
// updated post is a no-op.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LOCALES = [
  { dir: 'blog',    base: 'https://muntin.digital',     learn: 'Learn',    articles: 'Articles',    blogPath: '/blog/',    learnPath: '/learn/' },
  { dir: 'es/blog', base: 'https://muntin.digital',     learn: 'Aprende',  articles: 'Artículos',   blogPath: '/es/blog/', learnPath: '/es/learn/' },
];

let updated = 0;
for (const L of LOCALES) {
  const root = path.join(repoRoot, L.dir);
  if (!fs.existsSync(root)) continue;
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === 'drafts') continue;
    const file = path.join(root, e.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, 'utf8');

    // Idempotency: already has a "Learn"/"Aprende" entry at position 2.
    if (new RegExp('"position":\\s*2,\\s*"name":\\s*"' + L.learn + '"').test(src)) continue;

    // Find the "Blog" entry at position 2 and replace with two
    // entries (Learn + Articles), bumping the post's own entry
    // from position 3 to position 4.
    const oldPos2 = new RegExp(
      '(\\{\\s*"@type":\\s*"ListItem",\\s*"position":\\s*2,\\s*"name":\\s*"Blog",\\s*"item":\\s*"[^"]+"\\s*\\})',
      'g'
    );
    const hasOld = oldPos2.test(src);
    if (!hasOld) continue;
    oldPos2.lastIndex = 0;

    const newEntries =
      '{\n          "@type": "ListItem",\n          "position": 2,\n          "name": "' + L.learn + '",\n          "item": "' + L.base + L.learnPath + '"\n        },\n        {\n          "@type": "ListItem",\n          "position": 3,\n          "name": "' + L.articles + '",\n          "item": "' + L.base + L.blogPath + '"\n        }';
    src = src.replace(oldPos2, newEntries);

    // Bump the post's ListItem position from 3 to 4.
    src = src.replace(
      /("@type":\s*"ListItem",\s*"position":\s*)3(\s*,\s*"name":\s*"(?!Articles|Artículos)[^"]+")/g,
      '$14$2'
    );

    fs.writeFileSync(file, src);
    updated++;
    console.log(`updated ${path.relative(repoRoot, file)}`);
  }
}
console.log(`\n${updated} blog-post JSON-LD breadcrumb(s) aligned to the Learn > Articles IA.`);
