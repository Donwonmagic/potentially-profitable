#!/usr/bin/env node
/**
 * inject-about-cost-read.mjs — the /about/ "instrument" read.
 *
 * Stamps a sentinel-bracketed depth read of the LIVE basket (the same one the
 * Cost Index hub features) into /about/ and /es/about/, at the pledge sentence
 * "the numbers I check on my shifts / my own floor". Generator-produced from
 * data/cost-index.json (no client fetch; CSP-safe). EN + ES.
 *
 * The "depth feel" is founder-locked (docs/design/depth-immersion-dream-backlog.md
 * §Locked): the composite floats nearest, its measured movers recede as separate
 * strata behind it, parallax by TRANSLATION not rotation, flat-first with the 3D
 * as progressive enhancement (reduced-motion / no-JS render a fully-composed flat
 * read). Honesty is not in the 3D: the number is static; the confidence word and
 * "Not your prices" lead; freshness is a dated stamp with the last-good caveat.
 *
 *   node scripts/inject-about-cost-read.mjs           # rewrite
 *   node scripts/inject-about-cost-read.mjs --check   # exit 1 on diff
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const checkOnly = process.argv.includes('--check');

const CI = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8'));
const LABELS = (JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-labels.json'), 'utf8')).labels) || {};

const START = '<!-- about-cost-read:start -->';
const END = '<!-- about-cost-read:end -->';

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
function pct1(x) { const s = x >= 0 ? '+' : '−'; return `${s}${Math.abs(x * 100).toFixed(1)}%`; }
function nameOf(k, es) { const e = LABELS[k] || {}; return (es ? (e.es || e.en) : e.en) || k; }

// ---- read the live basket + its freshness + the biggest movers behind it ----
function payload() {
  const b = CI.basket, ing = CI.ingredients || {};
  const DEAD = 0.005;
  const contribs = (b.contributors || []).filter((c) => typeof c.pct === 'number');
  let above = 0, below = 0, flat = 0;
  for (const c of contribs) { if (c.pct > DEAD) above++; else if (c.pct < -DEAD) below++; else flat++; }
  // freshness floor + laggards, computed from each contributor's newest read
  const dated = contribs.map((c) => {
    const p = ((ing[c.ingredient] || {}).points || [])[0] || {};
    return { k: c.ingredient, a: p.asOf || null, pct: (p.trend && p.trend.pct), seasonal: !!(LABELS[c.ingredient] && LABELS[c.ingredient].seasonal) };
  }).filter((x) => x.a);
  const sortedDates = dated.map((x) => x.a).sort();
  const newest = sortedDates[sortedDates.length - 1] || b.asOf;
  const oldest = sortedDates[0] || b.asOf;
  const nMs = Date.parse(newest);
  const nLag = dated.filter((x) => isFinite(nMs) && (nMs - Date.parse(x.a)) > 21 * 864e5).length;
  // top movers by |pct| among contributors (the parts behind the composite)
  const movers = dated.filter((x) => typeof x.pct === 'number')
    .sort((p, q) => Math.abs(q.pct) - Math.abs(p.pct)).slice(0, 3);
  return { b, n: b.nContributing || contribs.length, above, below, flat, agreement: b.agreement, newest, oldest, nLag, movers };
}

const P = payload();

function block(locale) {
  const es = locale === 'es';
  const b = P.b;
  const base = es ? '/es' : '';
  const pctStr = pct1(b.pct);
  const confWord = { high: es ? 'confianza alta' : 'high confidence', medium: es ? 'confianza media' : 'medium confidence', low: es ? 'confianza baja' : 'low confidence' }[b.confidence] || (es ? 'confianza sin declarar' : 'confidence unstated');
  const split = (typeof P.agreement === 'number' && P.agreement < 0.6);
  const cap = es
    ? 'La canasta que estoy mirando esta semana — una lectura frente a su base, no un precio.'
    : 'The basket I’m watching this week — a reading against baseline, not a price.';
  const lab = es ? 'Canasta de Restaurante Muntin' : 'Muntin Restaurant Basket';
  const asOfTxt = es ? `al ${P.newest}` : `as of ${P.newest}`;
  const spread = es
    ? `<strong>${P.above}</strong> de ${P.n} por encima de su base · <strong>${P.below}</strong> por debajo · <strong>${P.flat}</strong> sin cambio.${split ? ' Casi divididos en partes iguales — una señal suave, no una cifra precisa.' : ''}`
    : `<strong>${P.above}</strong> of ${P.n} above their baseline · <strong>${P.below}</strong> below · <strong>${P.flat}</strong> flat.${split ? ' Nearly evenly split — a soft signal, not a precise figure.' : ''}`;
  const holdNote = P.nLag
    ? (es ? `<strong>${P.nLag}</strong> de ${P.n} mantienen su último dato desde el ${P.oldest}.` : `<strong>${P.nLag}</strong> of ${P.n} holding last-good since ${P.oldest}.`)
    : '';
  const notYours = es ? 'referencia mayorista — <b>no es tu precio</b>' : 'wholesale reference — <b>Not your prices</b>';
  const moverCap = es ? 'Algunos insumos detrás del número, cada uno leído frente a su propia base:' : 'A few of the staples behind it, each read against its own baseline:';
  const seasonalTag = es ? 'de temporada' : 'seasonal';
  const aboveW = es ? 'sobre su base' : 'above baseline';
  const belowW = es ? 'bajo su base' : 'below baseline';
  const linkTxt = es ? `Ver los ${P.n} →` : `See all ${P.n} →`;

  const strata = P.movers.map((m, idx) => {
    const up = m.pct >= 0;
    const arrow = up ? '▲' : '▼';
    const word = up ? aboveW : belowW;
    const tag = m.seasonal ? ` <span class="ar-seasonal">· ${seasonalTag}</span>` : '';
    return `        <li class="ar-mover" style="--i:${P.movers.length - idx}">`
      + `<span class="ar-mover__nm">${esc(nameOf(m.k, es))}</span>`
      + `<span class="ar-mover__d ${up ? 'is-up' : 'is-down'}">${arrow} ${pct1(m.pct)} <span class="ar-mover__w">${word}</span>${tag}</span></li>`;
  }).join('\n');

  // Scoped styles + the flat-first instrument; a tiny inline enhancer adds the
  // 3D depth only when motion is allowed. Everything below degrades to a clean
  // flat read with no JS. Colours come from the site tokens (theme-aware).
  return [
    START,
    '<style>',
    '.about-read{--ar-well:var(--surface-inset,#EDEEF1);--ar-line:var(--line,#E3E5E9);max-width:520px;margin:34px auto 8px;font-family:var(--font-body)}',
    '.ar-cap{font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--stone);margin:0 0 12px;text-align:left}',
    '.ar-scene{position:relative}',
    '.ar-rig{position:relative;display:flex;flex-direction:column;gap:12px}',
    '.ar-read{position:relative;background:var(--white,#fff);border:1.5px solid var(--ink);border-radius:8px;padding:18px 18px 15px;box-shadow:var(--elev-feature,0 4px 8px rgba(20,22,26,.05),0 24px 48px -12px rgba(20,22,26,.12))}',
    '.ar-read__top{display:flex;align-items:center;gap:10px;margin-bottom:12px}',
    '.ar-lab{font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.11em;color:var(--stone)}',
    '.ar-state{margin-left:auto;font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--stone);border:1px solid var(--ar-line);border-radius:999px;padding:3px 9px}',
    '.ar-well{background:var(--ar-well);border-radius:6px;padding:14px 14px 12px;box-shadow:inset 0 1px 1px rgba(20,22,26,.09),inset 0 0 0 1px var(--ar-line)}',
    '.ar-num{display:flex;align-items:baseline;gap:11px;flex-wrap:wrap}',
    '.ar-pct{font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:clamp(34px,7vw,44px);font-weight:600;letter-spacing:-.02em;line-height:1;color:var(--ink)}',
    '.ar-vs{font-size:13px;color:var(--ink-soft)}',
    '.ar-spread{margin:11px 0 0;font-size:12.5px;line-height:1.5;color:var(--ink-soft)}',
    '.ar-hold{margin:6px 0 0;font-size:11.5px;line-height:1.45;color:var(--stone)}',
    '.ar-conf{margin:11px 0 0;font-size:11.5px;letter-spacing:.01em;color:var(--stone)}',
    '.ar-conf b{color:var(--ink-soft)}',
    '.ar-strata{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}',
    '.ar-mover{display:flex;align-items:baseline;justify-content:space-between;gap:12px;background:var(--white,#fff);border:1px solid var(--ar-line);border-radius:6px;padding:9px 13px;font-size:13px;box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 6px 14px -10px rgba(20,22,26,.4)}',
    '.ar-mover__nm{font-weight:600;color:var(--ink)}',
    '.ar-mover__d{font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}',
    '.ar-mover__d.is-up{color:var(--rust)}.ar-mover__d.is-down{color:var(--teal-dark,#1F3A93)}',
    ':root[data-theme="dark"] .ar-mover__d.is-down{color:var(--teal)}',
    '.ar-mover__w,.ar-seasonal{font-family:var(--font-body);font-weight:500;font-size:11px;color:var(--stone)}',
    '.ar-link{display:inline-block;margin:14px 2px 0;font-size:13px;font-weight:600;color:var(--teal);text-decoration:none}',
    '.ar-link:hover{text-decoration:underline}',
    /* ---- progressive 3D: only when the enhancer opts in ---- */
    '.ar-scene.is-3d{perspective:1600px;perspective-origin:50% 40%}',
    '.ar-scene.is-3d .ar-rig{position:relative;transform-style:preserve-3d;transform:rotateX(3deg);height:var(--ar-h,360px);--px:0px;--py:0px}',
    '.ar-scene.is-3d .ar-strata{position:absolute;inset:0;gap:0}',
    '.ar-scene.is-3d .ar-mover{position:absolute;left:50%;top:34%;width:320px;margin-left:-160px;-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);background:color-mix(in srgb,var(--white,#fff) 84%,transparent)}',
    '.ar-scene.is-3d .ar-mover[style*="--i:3"]{transform:translateZ(-42px) translateY(-32px) translate(calc(var(--px)*-.42),calc(var(--py)*-.42));opacity:.97}',
    '.ar-scene.is-3d .ar-mover[style*="--i:2"]{transform:translateZ(-128px) translateY(-64px) translate(calc(var(--px)*-.25),calc(var(--py)*-.25));opacity:.62;filter:blur(.7px)}',
    '.ar-scene.is-3d .ar-mover[style*="--i:1"]{transform:translateZ(-214px) translateY(-96px) translate(calc(var(--px)*-.13),calc(var(--py)*-.13));opacity:.36;filter:blur(1.4px)}',
    '.ar-scene.is-3d .ar-read{position:absolute;left:50%;top:34%;width:380px;margin-left:-190px;z-index:2;transform:translateZ(58px) translate(calc(var(--px)*-.82),calc(var(--py)*-.82))}',
    '@media (prefers-reduced-motion:reduce){.ar-scene.is-3d{perspective:none}.ar-scene.is-3d .ar-rig{transform:none;min-height:0}.ar-scene.is-3d .ar-strata,.ar-scene.is-3d .ar-mover,.ar-scene.is-3d .ar-read{position:static;transform:none;width:auto;margin:0;left:auto;top:auto;opacity:1;filter:none;-webkit-backdrop-filter:none;backdrop-filter:none}.ar-scene.is-3d .ar-strata{gap:8px}}',
    '</style>',
    '<figure class="about-read" aria-label="' + (es ? 'La lectura de la canasta de esta semana' : 'This week’s basket reading') + '">',
    `  <figcaption class="ar-cap">${cap}</figcaption>`,
    '  <div class="ar-scene">',
    '    <div class="ar-rig">',
    '      <ul class="ar-strata">',
    strata,
    '      </ul>',
    '      <div class="ar-read">',
    '        <div class="ar-read__top">',
    `          <span class="ar-lab">${lab}</span>`,
    `          <span class="ar-state ci-asof" data-asof="${P.newest}">${asOfTxt}</span>`,
    '        </div>',
    '        <div class="ar-well">',
    `          <div class="ar-num"><span class="ar-pct">${pctStr}</span><span class="ar-vs">${es ? 'frente a su ventana base' : 'against its baseline window'}</span></div>`,
    `          <p class="ar-spread">${spread}</p>`,
    holdNote ? `          <p class="ar-hold">${holdNote}</p>` : '',
    '        </div>',
    `        <p class="ar-conf">${confWord} · ${notYours}</p>`,
    '      </div>',
    '    </div>',
    '  </div>',
    `  <p class="ar-mover-cap ar-cap" style="margin:16px 0 10px">${moverCap}</p>`,
    `  <a class="ar-link" href="${base}/cost-index/">${linkTxt}</a>`,
    '</figure>',
    '<script>(function(){var s=document.currentScript&&document.currentScript.previousElementSibling;var sc=document.querySelector(".about-read .ar-scene");if(!sc)return;if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;var rig=sc.querySelector(".ar-rig");rig.style.setProperty("--ar-h",rig.offsetHeight+"px");sc.classList.add("is-3d");var raf=0,px=0,py=0;sc.addEventListener("pointermove",function(e){var r=sc.getBoundingClientRect();px=((e.clientX-r.left)/r.width-.5)*20;py=((e.clientY-r.top)/r.height-.5)*14;if(!raf)raf=requestAnimationFrame(ap)});sc.addEventListener("pointerleave",function(){px=0;py=0;if(!raf)raf=requestAnimationFrame(ap)});function ap(){raf=0;rig.style.setProperty("--px",px.toFixed(2)+"px");rig.style.setProperty("--py",py.toFixed(2)+"px")}})();</script>',
    END,
  ].filter((l) => l !== '').join('\n');
}

const SENTINEL_RE = new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

const TARGETS = [
  { file: 'about/index.html', locale: 'en' },
  { file: 'es/about/index.html', locale: 'es' },
];

let changed = 0;
for (const { file, locale } of TARGETS) {
  const full = path.join(repoRoot, file);
  if (!fs.existsSync(full)) { console.warn(`skip (missing): ${file}`); continue; }
  const src = fs.readFileSync(full, 'utf8');
  const blk = block(locale);
  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, blk);
  } else {
    // Insert before the CTA button row inside <section class="block final" aria-labelledby="cta-heading">.
    const secIdx = src.indexOf('aria-labelledby="cta-heading"');
    if (secIdx === -1) { console.warn(`skip (no cta section): ${file}`); continue; }
    const anchor = src.indexOf('<div class="hero-ctas reveal"', secIdx);
    if (anchor === -1) { console.warn(`skip (no anchor): ${file}`); continue; }
    // back up to the start of the anchor's line for clean indentation
    const lineStart = src.lastIndexOf('\n', anchor) + 1;
    next = src.slice(0, lineStart) + blk + '\n\n' + src.slice(lineStart);
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(full, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${file}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s).`);
if (checkOnly && changed > 0) process.exit(1);
