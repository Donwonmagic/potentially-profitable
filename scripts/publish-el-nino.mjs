// One-shot publish for the El Niño / food-prices post (EN + ES).
//
// Run this AFTER the Colab has rendered + committed the English audio and you
// have pulled it:
//
//   node scripts/publish-el-nino.mjs
//
// It: (1) refuses to run until the English audio exists — that's the "ready as
// soon as the audio renders" gate; (2) moves both drafts live with git mv (keeps
// history + the audio.mp3/json siblings); (3) drops the noindex meta on both;
// (4) registers the post in data/library-tags.json (blog index cards) and the EN
// audio edition in data/article-audio.json; (5) regenerates the blog index +
// hreflang + sitemap from the posts now on disk. It STAGES everything and stops
// — nothing is committed, so you review the diff first:
//
//   git diff --cached --stat
//   git commit -m "Publish: A historic El Niño is forming (EN + ES)" && git push
//
// Everything else (bespoke OG cards, slug map, JSON-LD, figures, ES translation)
// is already in place, so this is the whole flip.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (rel) => path.join(REPO, rel);
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: REPO, stdio: 'inherit' });

const EN_DRAFT = 'blog/drafts/el-nino-food-prices-2026';
const EN_LIVE = 'blog/el-nino-food-prices-2026';
const ES_DRAFT = 'es/blog/drafts/el-nino-y-precios-de-alimentos-2026';
const ES_LIVE = 'es/blog/el-nino-y-precios-de-alimentos-2026';
const EN_SLUG = 'el-nino-food-prices-2026';

// 1. gate — the English audio must be rendered + committed first
if (!fs.existsSync(p(`${EN_DRAFT}/audio.mp3`)) && !fs.existsSync(p(`${EN_LIVE}/audio.mp3`))) {
  console.error(`\n✗ No audio.mp3 yet.\n  Render the English narration first with scripts/voice-refs/colab-render-el-nino-en.ipynb,`
    + `\n  pull the branch, then re-run this. (This is the only thing gating publish.)\n`);
  process.exit(1);
}

// 2. move both drafts live (git mv carries audio.mp3 + audio.json along)
for (const [d, l] of [[EN_DRAFT, EN_LIVE], [ES_DRAFT, ES_LIVE]]) {
  if (fs.existsSync(p(l))) { console.error(`✗ ${l} already exists — already published?`); process.exit(1); }
  if (!fs.existsSync(p(d))) { console.error(`✗ ${d} not found.`); process.exit(1); }
  sh('git', ['mv', d, l]);
  console.log(`moved  ${d} → ${l}`);
}

// 3. drop the draft noindex on both
for (const l of [EN_LIVE, ES_LIVE]) {
  const f = p(`${l}/index.html`);
  const before = fs.readFileSync(f, 'utf8');
  const after = before.replace(/[ \t]*<meta name="robots" content="noindex,\s*nofollow"\s*\/>\n?/i, '');
  if (after === before) console.warn(`  (no noindex meta found in ${l} — already removed?)`);
  fs.writeFileSync(f, after);
  console.log(`noindex removed: ${l}`);
}

// 4a. blog index card source (data/library-tags.json → blog_posts)
const tagsF = p('data/library-tags.json');
const tags = JSON.parse(fs.readFileSync(tagsF, 'utf8'));
tags.blog_posts = tags.blog_posts || {};
tags.blog_posts[EN_SLUG] = {
  topics: ['operations-margin'],
  title: "A historic El Niño is forming — and your food invoices haven't noticed",
  dek: 'A strong, possibly historic El Niño is forecast for 2026 — but the world food-price index is falling. '
    + 'What El Niño actually does to food prices, which restaurant lines are exposed, and why the bill (if any) lands in 2027.',
  date: '2026-07-10',
  read_min: 14,
};
fs.writeFileSync(tagsF, JSON.stringify(tags, null, 2) + '\n');
console.log('registered blog-index card: data/library-tags.json');

// 4b. English audio edition in the coverage manifest
const audF = p('data/article-audio.json');
const aud = JSON.parse(fs.readFileSync(audF, 'utf8'));
aud.blog = aud.blog || {};
aud.blog[EN_SLUG] = { languages: ['en'], status: 'rendered' };
fs.writeFileSync(audF, JSON.stringify(aud, null, 2) + '\n');
console.log('registered EN audio: data/article-audio.json');

// 5. regenerate derived surfaces from the posts now on disk
sh('node', ['scripts/build-blog-index.mjs']);   // blog/index.html + es/blog/index.html
sh('node', ['scripts/stamp-hreflang.mjs']);      // hreflang from the slug map
sh('node', ['scripts/build-sitemap.mjs']);       // sitemap.xml (skips noindex/drafts)

sh('git', ['add', '-A']);
console.log(`\n✓ Staged. Review, then commit:\n`
  + `    git diff --cached --stat\n`
  + `    git commit -m "Publish: A historic El Niño is forming (EN + ES)" && git push\n`);
