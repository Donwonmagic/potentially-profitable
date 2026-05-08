#!/usr/bin/env node
/**
 * One-shot polish pass: hand-curate data-audio-alt on the figures
 * whose existing aria-label is too short to narrate richly. Each
 * description is written in the article's primary language, in Don's
 * editorial voice, covering the figure's data points so the audio
 * narration of the figure stands on its own.
 *
 * Run once. Each figure entry is matched on a unique inner anchor
 * string so we don't accidentally double-stamp.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const PATCHES = [
  {
    file: 'blog/how-to-read-restaurant-google-search-console/index.html',
    anchor: 'Discovered — not indexed',
    desc: "Three Coverage red flags in Google Search Console, in priority order. Status A &mdash; Discovered, not indexed: Google found the URL and decided not to index it. Almost always thin content or a duplicate template. The fix is to rewrite the page. Status B &mdash; Crawled, currently not indexed: Google looked, then waited. Speed or trust signal too low. Fix L C P and fix the canonical. Status C &mdash; Excluded by &lsquo;noindex&rsquo;: a meta tag or HTTP header is telling Google to skip the page. If it&rsquo;s unintentional, it&rsquo;s the cheapest fix on this list &mdash; grep your codebase for &lsquo;noindex&rsquo; and you&rsquo;ll find it.",
  },
  {
    file: 'blog/restaurant-photo-spec-sheet/index.html',
    anchor: 'Specific subject',
    desc: "Three rules for restaurant alt text &mdash; what Google&rsquo;s parser keeps and what it discards. One: specific subject. &lsquo;Plate of carnitas&rsquo; &mdash; not &lsquo;delicious food&rsquo;, not &lsquo;lunch&rsquo;. Name the dish. Two: context noun. &lsquo;On a wood board.&rsquo; &lsquo;On the patio.&rsquo; Where the photo is, not just what&rsquo;s in it. Three: no filename, no marketing. &lsquo;I M G underscore 4 5 2 1 dot J P G&rsquo; is useless. &lsquo;Mouthwatering food&rsquo; is worse &mdash; Google strips marketing language entirely. Describe, don&rsquo;t sell.",
  },
  {
    file: 'es/blog/como-leer-google-search-console-de-tu-restaurante/index.html',
    anchor: 'Banderas rojas en Coverage',
    desc: "Tres banderas rojas en Coverage de Google Search Console, en orden de prioridad. Estado A &mdash; Descubierta, no indexada: Google encontr&oacute; la URL y decidi&oacute; no indexarla. Casi siempre es contenido superficial o una plantilla duplicada. El arreglo es reescribir la p&aacute;gina. Estado B &mdash; Rastreada, actualmente no indexada: Google mir&oacute;, despu&eacute;s esper&oacute;. Se&ntilde;al de velocidad o confianza demasiado baja. Arregla el L C P y el canonical. Estado C &mdash; Excluida por &lsquo;noindex&rsquo;: una etiqueta meta o cabecera H T T P le est&aacute; diciendo a Google que se salte la p&aacute;gina. Si fue sin querer, es el arreglo m&aacute;s barato de la lista &mdash; busca &lsquo;noindex&rsquo; en tu c&oacute;digo y lo encuentras.",
  },
  {
    file: 'es/blog/especificaciones-de-fotos-para-restaurantes/index.html',
    anchor: 'Sujeto espec',
    desc: "Tres reglas para el alt text de restaurante &mdash; qu&eacute; guarda el parser de Google y qu&eacute; descarta. Uno: sujeto espec&iacute;fico. &lsquo;Plato de carnitas&rsquo; &mdash; no &lsquo;comida deliciosa&rsquo;, no &lsquo;almuerzo&rsquo;. Nombra el plato. Dos: sustantivo de contexto. &lsquo;Sobre tabla de madera.&rsquo; &lsquo;En el patio.&rsquo; D&oacute;nde est&aacute; la foto, no solo qu&eacute; hay. Tres: sin nombre de archivo, sin marketing. &lsquo;I M G gui&oacute;n bajo 4 5 2 1 punto J P G&rsquo; no sirve. &lsquo;Comida deliciosa&rsquo; sirve menos &mdash; Google descarta el lenguaje de marketing por completo. Describe, no vendas.",
  },
  {
    file: 'blog/restaurant-schema-markup-6-types-google-uses/index.html',
    anchor: 'The Menu schema field that does the work',
    desc: "The Menu schema field that does the work for A I citations: description, not name. The name field is required, but it&rsquo;s used for the listing title only &mdash; title-only role, no extra weight. The description field is optional in the schema spec, but it&rsquo;s the field A I Overviews quote verbatim. Skip it and your dishes don&rsquo;t get cited. That&rsquo;s the A I field.",
  },
  {
    file: 'es/blog/los-6-tipos-de-schema-markup-que-google-usa/index.html',
    anchor: 'El campo del schema Menu que hace el trabajo',
    desc: "El campo del schema Menu que hace el trabajo para las citas de I A: description, no name. El campo name es obligatorio, pero solo se usa para el t&iacute;tulo del listado &mdash; rol de solo t&iacute;tulo, sin peso extra. El campo description es opcional en la especificaci&oacute;n, pero es el campo que A I Overviews cita textualmente. S&aacute;ltalo y tus platos no se citan. Ese es el campo de I A.",
  },
];

let changed = 0;
for (const p of PATCHES) {
  const fp = path.join(repoRoot, p.file);
  let html = fs.readFileSync(fp, 'utf8');
  // Find the figure that contains the anchor string. Add data-audio-alt
  // to its opening <figure ...> tag if it doesn't already have one.
  const figRe = /<figure([^>]*class="[^"]*article-figure[^"]*"[^>]*)>([\s\S]*?)<\/figure>/g;
  let m, hits = 0;
  let next = html;
  while ((m = figRe.exec(html)) !== null) {
    if (!m[2].includes(p.anchor)) continue;
    if (/data-audio-alt=/.test(m[1])) {
      console.log(`already has data-audio-alt: ${p.file}`);
      hits++;
      continue;
    }
    const newOpen = `<figure${m[1]} data-audio-alt="${p.desc}">`;
    next = next.replace(m[0].split('>')[0] + '>', newOpen);
    hits++;
    changed++;
    console.log(`stamped: ${p.file}`);
    break;
  }
  if (hits === 0) {
    console.warn(`anchor not found in ${p.file}: "${p.anchor}"`);
    continue;
  }
  if (next !== html) fs.writeFileSync(fp, next);
}
console.log(`\nstamped ${changed} of ${PATCHES.length}`);
