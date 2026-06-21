#!/usr/bin/env node
/**
 * Stamps a "This week's Cost Index" hero card at the top of the library
 * (/library/ + /es/library/) between <!-- cost-index-hero:start --> and
 * <!-- cost-index-hero:end -->.
 *
 * Self-updating: the archive now retains every `cost-index-week-<date>` entry
 * in data/library-tags.json#blog_posts, so this picks the LATEST by date and
 * points the library hero at the newest week. Run it after the weekly dispatch ships.
 *
 *   node scripts/inject-library-cost-index-hero.mjs           # write
 *   node scripts/inject-library-cost-index-hero.mjs --check   # diff-only (exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const tags = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'library-tags.json'), 'utf8'));
// The archive now retains EVERY weekly edition (the prune-to-one was removed), so pick the
// LATEST by date rather than the first match — the hero always points at the newest week.
const entry = Object.entries(tags.blog_posts || {})
  .filter(([k]) => /^cost-index-week-\d{4}-\d{2}-\d{2}$/.test(k))
  .sort(([, a], [, b]) => String((b && b.date) || '').localeCompare(String((a && a.date) || '')))[0];

if (!entry) {
  console.log('cost-index-hero: no cost-index-week-* post in library-tags; nothing to stamp.');
  process.exit(0);
}

const [slug, post] = entry;
const date = post.date || slug.replace('cost-index-week-', '');
const [y, m, d] = date.split('-');
const MON_EN = { '01': 'January', '02': 'February', '03': 'March', '04': 'April', '05': 'May', '06': 'June', '07': 'July', '08': 'August', '09': 'September', '10': 'October', '11': 'November', '12': 'December' };
const MON_ES = { '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril', '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto', '09': 'septiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre' };
const humanEN = `${MON_EN[m]} ${parseInt(d, 10)}, ${y}`;
const humanES = `${parseInt(d, 10)} de ${MON_ES[m]} de ${y}`;

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function firstSentence(dek) {
  const t = String(dek || '').trim();
  if (t.length <= 170) return t;
  const cut = t.slice(0, 170);
  const i = cut.lastIndexOf('.');
  return i > 70 ? cut.slice(0, i + 1) : cut.replace(/\s+\S*$/, '') + '…';
}
const titleEN = esc(String(post.title || 'Restaurant Cost Index').replace(/[,:]?\s*week of.*$/i, ''));

function card(locale) {
  const href = locale === 'es' ? '/es/cost-index/' : `/blog/${slug}/`;
  const eyebrow = locale === 'es' ? `Índice de Costos de esta semana · ${humanES}` : `This week’s Cost Index · ${humanEN}`;
  const title = locale === 'es' ? 'El Índice de Costos: cómo está la canasta esta semana' : titleEN;
  const dek = locale === 'es'
    ? 'La lectura semanal de los costos mayoristas de ingredientes &mdash; niveles públicos, con fecha y fuente, nunca tu precio de entrega.'
    : esc(firstSentence(post.dek));
  const cta = locale === 'es' ? 'Leer el índice de esta semana &rarr;' : 'Read this week’s read &rarr;';
  return [
    '<!-- cost-index-hero:start -->',
    `<a class="ci-hero" href="${href}" style="display:block;margin:0 0 40px;padding:28px 32px;border-radius:16px;background:radial-gradient(140% 180% at 92% 50%,rgba(42,80,200,0.18) 0%,rgba(22,24,29,0) 62%),#16181D;color:#F6F7F8;text-decoration:none;border:1px solid rgba(246,247,248,0.12);box-shadow:0 18px 40px -28px rgba(0,0,0,0.5)">`,
    `  <span style="display:inline-block;font-family:Inter,system-ui,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;color:#9DB4FF;margin-bottom:10px">${eyebrow}</span>`,
    `  <h2 style="font-family:var(--font-display),Georgia,serif;font-size:clamp(23px,2.8vw,31px);font-weight:500;line-height:1.12;margin:0 0 10px;color:#F6F7F8;letter-spacing:-0.01em">${title}</h2>`,
    `  <p style="font-family:Inter,system-ui,sans-serif;font-size:16px;line-height:1.55;color:rgba(246,247,248,0.80);margin:0 0 16px;max-width:680px">${dek}</p>`,
    `  <span style="font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:700;color:#F6F7F8;border-bottom:1px dashed rgba(246,247,248,0.5);padding-bottom:1px">${cta}</span>`,
    '</a>',
    '<!-- cost-index-hero:end -->',
  ].join('\n');
}

const SENT = /<!-- cost-index-hero:start -->[\s\S]*?<!-- cost-index-hero:end -->/;
const targets = [
  { file: 'library/index.html', locale: 'en' },
  { file: 'es/library/index.html', locale: 'es' },
];

let changed = 0;
for (const { file, locale } of targets) {
  const fp = path.join(REPO, file);
  let src;
  try { src = fs.readFileSync(fp, 'utf8'); } catch { continue; }
  const block = card(locale);
  let next;
  if (SENT.test(src)) {
    next = src.replace(SENT, block);
  } else {
    const anchor = '<section class="lib-three"';
    if (!src.includes(anchor)) { console.warn(`${file}: no insertion anchor (lib-three), skipped`); continue; }
    next = src.replace(anchor, `${block}\n\n    ${anchor}`);
  }
  if (next !== src) {
    if (!checkOnly) fs.writeFileSync(fp, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${file}`);
  }
}
console.log(`cost-index-hero: ${changed} file(s) ${checkOnly ? 'would change' : 'changed'}; pointing at ${slug}.`);
if (checkOnly && changed > 0) process.exit(1);
