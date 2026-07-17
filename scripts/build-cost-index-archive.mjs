/* build-cost-index-archive.mjs — the Cost Index weekly edition archive.
 *
 * Renders /cost-index/weekly/ (EN) and /es/cost-index/weekly/ (ES): a reverse-chronological
 * index of every weekly dispatch edition, from data/cost-index-editions.json. This is the
 * "all weeks" surface a journalist or AI links to for the series, and the canonical home of
 * the dated editions (which carry hide_from_recents so they don't flood the homepage strip).
 *
 * Chrome (head boilerplate, nav, footer, count sentinels, inline CSS) is cloned from the
 * methodology page — a known-good cost-index/ surface — so the archive inherits the same
 * passing nav/footer/count-sentinel state. Only the <main>, the head metadata, and the
 * JSON-LD are swapped.
 *
 *   node scripts/build-cost-index-archive.mjs           # write both locales
 *   node scripts/build-cost-index-archive.mjs --check   # exit 1 if output is stale
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));
const check = process.argv.includes('--check');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (x) => (typeof x === 'number' ? `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)}%` : '—');

const SITE = 'https://muntin.digital';

const COPY = {
  en: {
    donor: 'cost-index/methodology/index.html',
    out: 'cost-index/weekly/index.html',
    lang: 'en-US',
    title: 'Cost Index — edition archive | Muntin Digital',
    desc: 'Every weekly Restaurant Cost Index edition: the basket reading, confidence, and a link to each dispatch and its open data. Public wholesale levels.',
    eyebrow: 'Cost Index · Edition archive',
    h1: 'Every edition',
    lede: 'The Restaurant Cost Index publishes a dated dispatch — monthly on the first Tuesday since August 2026, weekly before that — where the weighted basket stands, what is flashing a re-price or watch signal, and the driver context behind it. This is the full run, newest first. Each edition is a permanent, citable record; the native editions ship an open per-edition dataset alongside the read.',
    crumbHome: 'Home', crumbCi: 'Cost index', crumbHere: 'Edition archive',
    thWeek: 'Week of', thBasket: 'Basket vs baseline', thConf: 'Confidence', thSpread: 'Above baseline', thRead: 'Read', thData: 'Data',
    read: 'Open dispatch', data: 'JSON', recon: 'reconstructed',
    note: 'Editions marked “reconstructed” were backfilled at basket level from the published dispatch before the per-week dataset existed; they carry no open data file and never anchor a per-ingredient week-over-week claim. Native editions ship an open snapshot (CC0) at /cost-index/week-&lt;date&gt;.json.',
    methodLink: 'How these numbers are built →',
  },
  es: {
    donor: 'es/cost-index/methodology/index.html',
    out: 'es/cost-index/weekly/index.html',
    lang: 'es-US',
    title: 'Índice de costos — archivo de ediciones | Muntin Digital',
    desc: 'Cada edición del Índice de costos: la canasta, la confianza y enlaces a cada despacho y sus datos abiertos. Precios mayoristas públicos.',
    eyebrow: 'Índice de costos · Archivo de ediciones',
    h1: 'Todas las ediciones',
    lede: 'El Índice de costos de restaurantes publica un despacho fechado — mensual el primer martes desde agosto de 2026, semanal antes de eso: dónde se ubica la canasta ponderada, qué activa una señal de reprecio o de vigilancia, y el contexto de los factores detrás. Esta es la serie completa, de la más reciente a la más antigua. Cada edición es un registro permanente y citable; las ediciones nativas incluyen un conjunto de datos abierto por edición junto a la lectura.',
    crumbHome: 'Inicio', crumbCi: 'Índice de costos', crumbHere: 'Archivo de ediciones',
    thWeek: 'Semana del', thBasket: 'Canasta vs. base', thConf: 'Confianza', thSpread: 'Por encima de la base', thRead: 'Leer', thData: 'Datos',
    read: 'Abrir despacho', data: 'JSON', recon: 'reconstruida',
    note: 'Las ediciones marcadas como “reconstruidas” se rellenaron a nivel de canasta a partir del despacho publicado antes de que existiera el conjunto de datos por semana; no incluyen archivo de datos abierto y nunca anclan una comparación semana a semana por ingrediente. Las ediciones nativas incluyen una instantánea abierta (CC0) en /cost-index/week-&lt;fecha&gt;.json.',
    methodLink: 'Cómo se construyen estos números →',
  },
};

function editionsDesc(c, editions) {
  const rows = editions.map((e) => {
    const slug = `cost-index-week-${e.asOf}`;
    const dispatch = `/blog/${slug}/`;
    const dataLink = (!e.reconstructed && existsSync(path.join(repoRoot, `cost-index/week-${e.asOf}.json`)))
      ? `<a href="/cost-index/week-${e.asOf}.json">${c.data}</a>` : '—';
    const conf = e.basket && e.basket.confidence ? esc(e.basket.confidence) : '—';
    const spread = e.spread ? `${e.spread.above} / ${e.spread.panel}` : '—';
    const reconTag = e.reconstructed ? ` <span style="opacity:.55;font-size:.85em">(${c.recon})</span>` : '';
    return `          <tr>
            <td data-label="${c.thWeek}"><strong>${esc(e.asOf)}</strong>${reconTag}</td>
            <td data-label="${c.thBasket}">${pct(e.basket && e.basket.pct)}</td>
            <td data-label="${c.thConf}">${conf}</td>
            <td data-label="${c.thSpread}">${spread}</td>
            <td data-label="${c.thRead}" style="white-space:nowrap"><a href="${dispatch}">${c.read}</a></td>
            <td data-label="${c.thData}" style="white-space:nowrap">${dataLink}</td>
          </tr>`;
  }).join('\n');

  return `<div class="container">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="/">${c.crumbHome}</a> ›
    <a href="/cost-index/">${c.crumbCi}</a> ›
    ${c.crumbHere}
  </nav>
  <section class="ci-hero">
    <p class="ci-eyebrow">${c.eyebrow}</p>
    <h1>${c.h1}</h1>
    <p class="ci-lede">${c.lede}</p>
  </section>
  <div class="ci-body" style="margin-inline:0">
    <div class="ci-archive-wrap" style="margin:8px 0 24px">
    <table class="ci-archive" style="width:100%;border-collapse:collapse;font-size:15.5px">
      <thead>
        <tr style="text-align:left;border-bottom:2px solid var(--line)">
          <th style="padding:10px 12px">${c.thWeek}</th>
          <th style="padding:10px 12px">${c.thBasket}</th>
          <th style="padding:10px 12px">${c.thConf}</th>
          <th style="padding:10px 12px">${c.thSpread}</th>
          <th style="padding:10px 12px;white-space:nowrap">${c.thRead}</th>
          <th style="padding:10px 12px;white-space:nowrap">${c.thData}</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
    </div>
    <p style="font-size:13.5px;color:var(--ink-soft);line-height:1.55">${c.note}</p>
    <p><a href="/cost-index/methodology/">${c.methodLink}</a></p>
  </div>
</div>`;
}

function jsonLd(c, editions, urlEn) {
  const url = `${SITE}/${c.out.replace(/index\.html$/, '')}`;
  const items = editions.map((e, idx) => ({
    '@type': 'ListItem', position: idx + 1,
    name: `Restaurant Cost Index — week of ${e.asOf}`,
    item: `${SITE}/blog/cost-index-week-${e.asOf}/`,
  }));
  const datasets = editions.filter((e) => !e.reconstructed && existsSync(path.join(repoRoot, `cost-index/week-${e.asOf}.json`)))
    .map((e) => `${SITE}/blog/cost-index-week-${e.asOf}/#dataset`);
  const graph = [
    { '@type': 'CollectionPage', '@id': `${url}#page`, url, name: c.title.replace(' | Muntin Digital', ''), inLanguage: c.lang, isPartOf: { '@id': `${SITE}/#website` }, breadcrumb: { '@id': `${url}#breadcrumbs` } },
    { '@type': 'DataCatalog', '@id': `${url}#catalog`, name: 'Muntin Restaurant Cost Index — weekly editions', url, inLanguage: c.lang, isAccessibleForFree: true, publisher: { '@id': `${SITE}/#business` }, dataset: datasets.map((d) => ({ '@id': d })) },
    { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`, itemListElement: [
      { '@type': 'ListItem', position: 1, name: c.crumbHome, item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: c.crumbCi, item: `${SITE}/cost-index/` },
      { '@type': 'ListItem', position: 3, name: c.crumbHere, item: url },
    ] },
    { '@type': 'ItemList', '@id': `${url}#editions`, itemListElement: items },
  ];
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

function render(locale) {
  const c = COPY[locale];
  const archive = rd('data/cost-index-editions.json');
  const editions = [...(archive.editions || [])].sort((a, b) => (a.asOf < b.asOf ? 1 : -1)); // newest first
  let html = readFileSync(path.join(repoRoot, c.donor), 'utf8');

  // 1. Re-point every methodology URL at the weekly archive (canonical, hreflang, og, twitter).
  html = html.replace(/cost-index\/methodology\//g, 'cost-index/weekly/');
  // 2. Strip the donor's JSON-LD; inject our own.
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLd(c, editions, locale));
  // 3. Swap head metadata.
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(c.title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(c.desc)}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(c.title)}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(c.desc)}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(c.title)}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(c.desc)}" />`);
  // 4. Swap the <main> body.
  html = html.replace(/(<main id="main" role="main">)[\s\S]*?(<\/main>)/, `$1\n${editionsDesc(c, editions)}\n$2`);
  return html;
}

let stale = 0;
for (const locale of Object.keys(COPY)) {
  const c = COPY[locale];
  const html = render(locale);
  const outPath = path.join(repoRoot, c.out);
  const cur = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
  if (check) {
    if (cur !== html) { console.error(`stale: ${c.out} (run scripts/build-cost-index-archive.mjs)`); stale++; }
  } else {
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    console.log(`wrote ${c.out} (${(rd('data/cost-index-editions.json').editions || []).length} editions)`);
  }
}
if (check && stale) process.exit(1);
