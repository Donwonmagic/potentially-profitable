#!/usr/bin/env node
/**
 * check-seasonality-fusion.mjs — the HONESTY gate for the corpus fusions on the
 * /open/seasonality/ hub (ADR-018 CHAIN surface). The hub now fuses the Ingredient
 * State Record (import-VALUE seasonality, origin concentration, reliance, hedge_swap,
 * co-movement) into per-item mechanism labels and a Swap Validator. This gate fails
 * the build if any of the fusions launder a supply claim out of value data, assert a
 * price cause, forecast, or surface a REFUSED (forecast-adjacent) field.
 *
 * It scans the BUILT HTML (open/seasonality/index.html + es mirror), separating the
 * site's OWN voice (labels, chips, tags, verdicts, headings, figcaptions, intro copy)
 * from the DISCLAIMER elements that legitimately name what they disclaim — the
 * `.sea-caveat` blocks, the `<details class="cite">` drawers, and `data-audio-alt`
 * narration attributes. The positive scans run on the site voice; the disclaimer
 * literal is asserted PRESENT.
 *
 *   node scripts/check-seasonality-fusion.mjs
 *   node scripts/check-seasonality-fusion.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// A supply-VOLUME claim laundered out of a value index/ratio — the contract's core ban.
const SUPPLY_RE = /\b(supplies?|supplied|backfill(?:s|ed|ing)?|fills?\s+the\s+gap|tonnage|supply\s+share|supply\s+volume)\b/i;
// A raw "volume" claim (its own token — 'value' is fine, 'volume' is not).
const VOLUME_RE = /\bvolume\b/i;
// A price cause asserted between the calendar/structure and price (scoped like the events gate,
// so an ordinary "not a cause" disclaimer does not trip it).
const CAUSAL_RE = [
  /\bcaused\s+(the\s+)?(price|prices|spike|jump|move|surge|increase)\b/i,
  /\bdrove\s+(the\s+)?prices?\b/i,
  /\bdriv(e|es|ing)\s+(the\s+)?(price|prices|both)\b/i,
  /\bprices?\s+(rose|jumped|spiked|climbed|fell)\s+because\b/i,
];
const FORECAST_RE = [
  /\bforecast(s|ed|ing)?\b/i, /\bprojected\b/i, /\bexpected?\s+to\s+(rise|fall|climb|drop)\b/i,
  /\bwill\s+(rise|fall|climb|drop|increase|decrease)\b/i, /\bnext\s+(year|month|season|quarter)\b/i,
];
const reHit = (res, t) => { for (const re of res) { const m = String(t).match(re); if (m) return m[0]; } return null; };

function stripTags(html) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

// Remove disclaimer elements (caveats, cite drawers) and narration attributes so the
// positive scans see only the site's affirmative voice.
function siteVoice(sectionHtml) {
  return sectionHtml
    .replace(/<div class="od-note sea-caveat"[\s\S]*?<\/div>/g, ' ')
    .replace(/<details class="cite"[\s\S]*?<\/details>/g, ' ')
    .replace(/\sdata-audio-alt="[^"]*"/g, ' ')
    .replace(/\stitle="[^"]*"/g, ' ');
}

// Extract a <section aria-labelledby="X">…</section> block by its labelledby id.
function section(html, id) {
  const re = new RegExp('<section[^>]*aria-labelledby="' + id + '"[\\s\\S]*?<\\/section>');
  const m = html.match(re);
  return m ? m[0] : '';
}

export function auditHtml(html, rel) {
  const problems = [];
  // ---- §4 mechanism section: no laundered supply/volume claim, no price cause, no forecast.
  const why = section(html, 'sea-why');
  if (!why) { problems.push(`${rel}: §4 mechanism section (aria-labelledby="sea-why") missing`); }
  else {
    const voice = stripTags(siteVoice(why));
    let h;
    if ((h = SUPPLY_RE.exec(voice))) problems.push(`${rel}: §4 site voice makes a supply claim from value data — "${h[0]}"`);
    if (VOLUME_RE.test(voice)) problems.push(`${rel}: §4 site voice says "volume" (import figure is value, never volume)`);
    if ((h = reHit(CAUSAL_RE, voice))) problems.push(`${rel}: §4 site voice asserts a price cause — "${h}"`);
    if ((h = reHit(FORECAST_RE, voice))) problems.push(`${rel}: §4 site voice speaks a forecast — "${h}"`);
    // The load-bearing import-value caveat must be present (EN or ES form).
    if (!/never volume, tonnage, or supply share|nunca volumen, tonelaje ni cuota de oferta/i.test(why)) {
      problems.push(`${rel}: §4 is missing the import-value caveat ("never volume, tonnage, or supply share")`);
    }
    // Every mechanism chip label must be one of the sanctioned, value-only labels.
    const chips = (why.match(/class="sea-mchip sea-mchip--[a-z-]+">[^<]*/g) || []);
    for (const c of chips) { if (SUPPLY_RE.test(c) || VOLUME_RE.test(c)) problems.push(`${rel}: mechanism chip carries a supply/volume token — "${stripTags(c)}"`); }
  }

  // ---- §6 Swap Validator: certifies offset only; no "driving", no cause, no forecast.
  const swap = section(html, 'sea-swap-h');
  if (swap) {
    const voice = stripTags(siteVoice(swap));
    let h;
    if (/\bdriv(e|es|ing)\b/i.test(voice)) problems.push(`${rel}: §6 swap voice says "driv*" (co-movement is co-occurrence, not driving)`);
    if ((h = reHit(CAUSAL_RE, voice))) problems.push(`${rel}: §6 swap voice asserts a cause — "${h}"`);
    if ((h = reHit(FORECAST_RE, voice))) problems.push(`${rel}: §6 swap voice speaks a forecast — "${h}"`);
    if (!/co-occurrence, not cause|coincidencia en el tiempo, no una causa/i.test(swap)) {
      problems.push(`${rel}: §6 is missing the co-occurrence caveat`);
    }
  }

  // ---- §3 bankability scatter: the signal-to-noise ratio must be labeled a HEURISTIC and
  // the band width must carry its "not a forecast" caveat, so the figure can't read as a
  // formal statistic or a prediction.
  const bank = section(html, 'sea-bank');
  if (bank) {
    const voice = stripTags(siteVoice(bank));
    let h;
    if ((h = reHit(CAUSAL_RE, voice))) problems.push(`${rel}: §3 scatter voice asserts a cause — "${h}"`);
    if ((h = reHit(FORECAST_RE, voice))) problems.push(`${rel}: §3 scatter voice speaks a forecast — "${h}"`);
    if (!/heuristic ratio|razón heurística/i.test(bank)) problems.push(`${rel}: §3 scatter must label signal-to-noise a "heuristic ratio"`);
    if (!/predictability descriptor, not a price forecast|un descriptor de previsibilidad, no un pronóstico/i.test(bank)) {
      problems.push(`${rel}: §3 scatter is missing the band-width "not a forecast" caveat`);
    }
  }

  // ---- REFUSED forecast-adjacent fields must never render on this surface.
  for (const bad of ['pressure_dir', 'pressure_conf', 'pressure_dir_es']) {
    if (html.includes(bad)) problems.push(`${rel}: REFUSED field '${bad}' leaked into the rendered page`);
  }

  // ---- §0 classification funnel must reconcile: ready >= classified >= window.
  const funnel = section(html, 'sea-hero2');
  const nums = (funnel.match(/<b>(\d+)<\/b>/g) || []).map((s) => Number(s.replace(/\D/g, '')));
  if (nums.length >= 3) {
    const [ready, classified, window] = nums;
    if (!(ready >= classified && classified >= window)) {
      problems.push(`${rel}: classification funnel does not reconcile (ready ${ready} ≥ classified ${classified} ≥ window ${window})`);
    }
  } else if (funnel) {
    problems.push(`${rel}: §0 funnel present but could not read its 3 counts`);
  }
  return problems;
}

function run() {
  if (process.argv.includes('--self-test')) return selfTest();
  const files = ['open/seasonality/index.html', 'es/open/seasonality/index.html'];
  const problems = [];
  for (const rel of files) {
    const abs = path.join(repo, rel);
    if (!fs.existsSync(abs)) { problems.push(`${rel}: missing (run CI_ONLY_PATH=open/seasonality node scripts/build-cost-index-pages.mjs)`); continue; }
    problems.push(...auditHtml(fs.readFileSync(abs, 'utf8'), rel));
  }
  if (problems.length) {
    problems.forEach((p) => console.error('✗ ' + p));
    console.error(`✗ seasonality fusion honesty gate: ${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log('✓ seasonality fusion honesty gate — mechanism labels are value-only (no supply/volume/cause), swap verdicts certify offset only, caveats present, funnel reconciles, no forecast field leaked.');
  process.exit(0);
}

function selfTest() {
  const ok = [];
  const goodWhy = '<section aria-labelledby="sea-why"><h2>Why</h2><p class="od-sub">shape of the curve, never a price cause</p>'
    + '<span class="sea-mchip sea-mchip--counter-phase">⇄ Import-value counter-phase</span>'
    + '<p class="sea-mechcard__tag">Import value rises in November and December, when the domestic wholesale reference dips — two calendars in counter-phase.</p>'
    + '<div class="od-note sea-caveat"><p>never volume, tonnage, or supply share; reliance is a value proxy</p></div></section>';
  ok.push(['clean §4 passes', auditHtml(goodWhy, 'x').length === 0]);
  const badLaunder = goodWhy.replace('two calendars in counter-phase.', 'off-season imports backfill the gap.');
  ok.push(['laundered "backfill" caught', auditHtml(badLaunder, 'x').some((p) => /supply claim/.test(p))]);
  const badVolume = goodWhy.replace('two calendars in counter-phase.', 'import volume rises then.');
  ok.push(['"volume" caught', auditHtml(badVolume, 'x').some((p) => /volume/.test(p))]);
  const noCaveat = goodWhy.replace(/<div class="od-note sea-caveat">[\s\S]*?<\/div>/, '');
  ok.push(['missing caveat caught', auditHtml(noCaveat, 'x').some((p) => /import-value caveat/.test(p))]);
  const badSwap = '<section aria-labelledby="sea-swap-h"><p class="sea-swap__line">the anchor is driving both prices</p></section>';
  ok.push(['swap "driving" caught', auditHtml(badSwap, 'x').some((p) => /driv/.test(p))]);
  const refused = goodWhy + '<span>pressure_dir</span>';
  ok.push(['REFUSED field caught', auditHtml(refused, 'x').some((p) => /REFUSED/.test(p))]);
  const badFunnel = '<section aria-labelledby="sea-hero2"><b>10</b><b>20</b><b>5</b></section>';
  ok.push(['funnel non-reconcile caught', auditHtml(badFunnel, 'x').some((p) => /reconcile/.test(p))]);
  const goodFunnel = '<section aria-labelledby="sea-hero2"><b>84</b><b>74</b><b>57</b></section>';
  ok.push(['good funnel passes', !auditHtml(goodFunnel, 'x').some((p) => /reconcile/.test(p))]);
  const disclaimerCite = '<section aria-labelledby="sea-why"><span class="sea-mchip sea-mchip--counter-phase">⇄ Import-value counter-phase</span>'
    + '<details class="cite"><summary>Source</summary><p>nominal value, never tonnage</p></details>'
    + '<div class="od-note sea-caveat"><p>never volume, tonnage, or supply share</p></div></section>';
  ok.push(['cite-drawer "tonnage" disclaimer exempt', auditHtml(disclaimerCite, 'x').length === 0]);
  // §3 bankability scatter arm
  const goodBank = goodWhy + '<section aria-labelledby="sea-bank"><p>signal-to-noise is a heuristic ratio of two percentages, not a formal statistic.</p>'
    + '<div class="od-note sea-caveat"><p>Band width is how far this item routinely swings — a predictability descriptor, not a price forecast or a direction call.</p></div></section>';
  ok.push(['clean §3 scatter passes', auditHtml(goodBank, 'x').length === 0]);
  const noHeur = goodWhy + '<section aria-labelledby="sea-bank"><p>signal-to-noise ratio</p>'
    + '<div class="od-note sea-caveat"><p>a predictability descriptor, not a price forecast</p></div></section>';
  ok.push(['§3 missing "heuristic ratio" label caught', auditHtml(noHeur, 'x').some((p) => /heuristic ratio/.test(p))]);

  const failed = ok.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`check-seasonality-fusion self-test: ${ok.length - failed.length}/${ok.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
