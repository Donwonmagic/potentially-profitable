#!/usr/bin/env node
/**
 * check-cost-index-email.mjs — the dispatch email's trust gate. The templates
 * sat outside every CI net until 2026-07-06; this gate makes overclaiming in
 * the subscriber email structurally impossible rather than merely discouraged
 * (docs/plans/dispatch-email-upgrade.md §8).
 *
 * Recomputes the golden render (scripts/build-cost-index-email-preview.mjs
 * renderPreview()) and enforces, on BOTH locales, html + text:
 *
 *   1. survivable-techniques only — no <svg>, no var(, no transform: (all die
 *      in Gmail / the Outlook Word renderer; the web viz families cannot be
 *      ported into the email).
 *   2. size — each html part under 100KB (Gmail clips ~102KB, hiding the
 *      unsubscribe footer).
 *   3. unsubscribe link present in every part.
 *   4. sign/verb agreement — no increase-vocabulary on the same line as a
 *      negative percentage (the bell-pepper class: -17.1% "the increase looks
 *      real").
 *   5. confidence language — the strings "high confidence" / "confianza high"
 *      / "confianza alta" may render ONLY when
 *      data/cost-confidence-calibration.json carries a high tier with
 *      items > 0 (today: zero — the label has no realized track record).
 *   6. numeric parity — every percentage token in the text parts must
 *      re-derive from the payload through the template's own formatter; the
 *      spread sentence must state the payload's exact counts. An orphan
 *      number is a fabrication.
 *   7. quiet-lead determinism — the hold line renders IFF the gated action
 *      lists are empty. Editorial whim can neither manufacture nor suppress
 *      a lead.
 *   8. first-print coupling — if any dollar amount appears in the body, the
 *      revision qualifier must too ("first print" EN / "primera impresión"
 *      ES; backed by data/cost-revisions.json). Empty-set passes today; the
 *      moment P1 adds dollar grounding, this forces the qualifier to ship
 *      with it.
 *   9. edition-claim guard — "since the <date> edition" phrasing may render
 *      only when wow.basket.state === 'moved' (the commensurability guards).
 *
 *   node scripts/check-cost-index-email.mjs              # gate
 *   node scripts/check-cost-index-email.mjs --self-test  # rule fixtures
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPreview } from './build-cost-index-email-preview.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const pc = (x) => `${x >= 0 ? '+' : ''}${(Number(x) * 100).toFixed(1)}%`;

// ---- rules (pure, fixture-testable) ----------------------------------------

export function ruleBannedTech(html) {
  const hits = [];
  if (/<svg\b/i.test(html)) hits.push('<svg>');
  if (/\bvar\(/.test(html)) hits.push('var(');
  // The CSS transform property (scaleX bars etc. — stripped by Gmail/Outlook).
  // text-transform: is email-safe and allowed.
  if (/(?:^|[^-a-zA-Z])transform\s*:/.test(html)) hits.push('transform:');
  return hits;
}

export function ruleSignAgreement(text) {
  const bad = [];
  for (const line of text.split('\n')) {
    if (/-\d+(?:\.\d+)?%/.test(line) && /increase|rise|climb|surge|jump|sube|subida|aumento|incremento/i.test(line)) bad.push(line.trim());
  }
  return bad;
}

export function ruleConfidenceLanguage(all, highCalibrated) {
  if (highCalibrated) return [];
  const bad = [];
  for (const phrase of ['high confidence', 'confianza high', 'confianza alta']) {
    if (all.toLowerCase().includes(phrase)) bad.push(phrase);
  }
  return bad;
}

export function ruleNumericParity(text, insight) {
  const allowed = new Set();
  for (const i of (insight.items || [])) if (typeof i.pct === 'number') allowed.add(pc(i.pct));
  for (const d of (insight.drivers || [])) if (typeof d.pct === 'number') allowed.add(pc(d.pct));
  if (insight.basket && typeof insight.basket.pct === 'number') allowed.add(pc(insight.basket.pct));
  const orphans = [];
  for (const m of text.matchAll(/[+-]\d+(?:\.\d+)?%/g)) {
    if (!allowed.has(m[0])) orphans.push(m[0]);
  }
  return orphans;
}

export function ruleSpreadCounts(text, insight, locale) {
  const want = locale === 'es'
    ? `${insight.up} de ${insight.count} por encima de la línea base, ${insight.down} por debajo`
    : `${insight.up} of ${insight.count} above baseline, ${insight.down} below`;
  return text.includes(want) ? [] : [`missing exact spread sentence: "${want}"`];
}

export function ruleQuietDeterminism(text, insight, locale) {
  const hold = locale === 'es' ? 'Nada estructural' : 'Nothing structural';
  const quiet = !((insight.reprice || []).length + (insight.watch || []).length);
  if (quiet && !text.includes(hold)) return [`quiet edition but hold line ("${hold}") missing`];
  if (!quiet && text.includes(hold)) return [`gated stories exist but hold line ("${hold}") rendered`];
  return [];
}

export function ruleFirstPrintCoupling(text, locale) {
  // Dollar amounts in prose (not URLs) demand the revision qualifier.
  const body = text.replace(/https?:\/\/\S+/g, '');
  if (!/\$\d/.test(body)) return [];
  const marker = locale === 'es' ? 'primera impresión' : 'first print';
  return body.toLowerCase().includes(marker) ? [] : [`dollar amounts present without the "${marker}" revision qualifier`];
}

export function ruleEditionClaimGuard(text, insight, locale) {
  const claim = locale === 'es' ? /desde la edición/i : /since the \d{4}-\d{2}-\d{2} edition/i;
  if (!claim.test(text)) return [];
  const moved = insight.wow && insight.wow.basket && insight.wow.basket.state === 'moved';
  return moved ? [] : ['edition-over-edition claim rendered while wow.basket.state !== "moved"'];
}

// ---- self-test --------------------------------------------------------------

function selfTest() {
  const fx = [
    ['banned tech catches svg', ruleBannedTech('<svg></svg>').length === 1],
    ['banned tech catches var(', ruleBannedTech('style="width:var(--w)"').length === 1],
    ['banned tech passes clean table html', ruleBannedTech('<table width="120"><td bgcolor="#9C3B2E"></td></table>').length === 0],
    ['banned tech allows text-transform', ruleBannedTech('<p style="text-transform:uppercase">LABEL</p>').length === 0],
    ['banned tech still catches bare transform', ruleBannedTech('<div style="transform:scaleX(0.5)"></div>').length === 1],
    ['sign rule catches the bell-pepper class', ruleSignAgreement('RE-PRICE Bell pepper -17.1% — the increase looks real').length === 1],
    ['sign rule passes corrected copy', ruleSignAgreement('Bell pepper -17.1% — reading well below baseline and holding').length === 0],
    ['confidence rule blocks uncalibrated high', ruleConfidenceLanguage('basket at high confidence', false).length === 1],
    ['confidence rule allows calibrated high', ruleConfidenceLanguage('basket at high confidence', true).length === 0],
    ['parity flags an orphan number', ruleNumericParity('Green beans +99.9%', { items: [{ pct: 1.2535 }] }).length === 1],
    ['parity passes a derived number', ruleNumericParity('Green beans +125.4%', { items: [{ pct: 1.2535 }] }).length === 0],
    ['quiet rule demands the hold line', ruleQuietDeterminism('no hold here', { reprice: [], watch: [] }, 'en').length === 1],
    ['quiet rule forbids hold with stories', ruleQuietDeterminism('Nothing structural', { reprice: [{}], watch: [] }, 'en').length === 1],
    ['first-print couples dollars to the qualifier', ruleFirstPrintCoupling('about $40.75/case wholesale', 'en').length === 1],
    ['first-print passes when qualifier present', ruleFirstPrintCoupling('about $40.75/case wholesale. These are first prints.', 'en').length === 0],
    ['first-print ignores dollar-free copy', ruleFirstPrintCoupling('no dollars, only reads', 'en').length === 0],
    ['edition-claim guard blocks unmoved claims', ruleEditionClaimGuard('widened since the 2026-06-18 edition', { wow: { basket: { state: 'anchor-unchanged' } } }, 'en').length === 1],
    ['edition-claim guard allows moved claims', ruleEditionClaimGuard('widened since the 2026-06-18 edition', { wow: { basket: { state: 'moved' } } }, 'en').length === 0],
  ];
  const failed = fx.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`email content gate self-test: ${fx.length - failed.length}/${fx.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();

// ---- gate -------------------------------------------------------------------

// "high confidence" may render only when the high tier has a realized track
// record: a byPublishedConfidence row with tier "high" and items > 0
// (data/cost-confidence-calibration.json; today the tier has no rows at all —
// cost-index-health.json says highEligible: 0). Parse failure stays false,
// the conservative default.
let highCalibrated = false;
try {
  const cal = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-confidence-calibration.json'), 'utf8'));
  const high = (cal.byPublishedConfidence || []).find((r) => r.tier === 'high');
  highCalibrated = !!(high && high.items > 0);
} catch { /* stays false — the conservative default */ }

const { insight, en, es } = renderPreview();
const failures = [];
const add = (part, list) => { for (const f of list) failures.push(`${part}: ${f}`); };

for (const [locale, r] of [['en', en], ['es', es]]) {
  add(`${locale} html`, ruleBannedTech(r.html));
  if (Buffer.byteLength(r.html) > 100 * 1024) failures.push(`${locale} html: ${Buffer.byteLength(r.html)} bytes exceeds the 100KB clip budget`);
  for (const [part, s] of [['html', r.html], ['text', r.text]]) {
    if (!s.includes('unsubscribe') && !s.includes('Cancelar suscripci')) failures.push(`${locale} ${part}: unsubscribe link missing`);
  }
  add(`${locale} text`, ruleSignAgreement(r.text));
  add(`${locale} subject`, ruleSignAgreement(r.subject));
  add(`${locale}`, ruleConfidenceLanguage(r.html + '\n' + r.text + '\n' + r.subject, highCalibrated));
  add(`${locale} text`, ruleNumericParity(r.text, insight));
  add(`${locale} subject`, ruleNumericParity(r.subject, insight));
  add(`${locale} text`, ruleSpreadCounts(r.text, insight, locale));
  add(`${locale} text`, ruleQuietDeterminism(r.text, insight, locale));
  add(`${locale} text`, ruleFirstPrintCoupling(r.text, locale));
  add(`${locale} text`, ruleEditionClaimGuard(r.text, insight, locale));
}

if (failures.length) {
  console.error(`✗ cost-index email content gate: ${failures.length} violation(s):`);
  for (const f of failures) console.error('  · ' + f);
  process.exit(1);
}
console.log(`✓ cost-index email content gate: EN+ES html/text/subject clean — asOf ${insight.asOf}, ${(insight.reprice || []).length + (insight.watch || []).length} action item(s), high-tier calibrated: ${highCalibrated}.`);
