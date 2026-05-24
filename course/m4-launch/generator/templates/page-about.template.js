/**
 * Generator template: about.html.
 *
 * Two paragraphs: the operator's one-promise (from L3) as the lead,
 * then the customer paragraph (from L4) as the "who we cook for"
 * supporting copy. Both fields may be missing — the template degrades
 * gracefully with placeholder copy that nudges the operator back to
 * the lesson that captures the field.
 */

import { escHtml, pageOpen, pageClose, pickStrings } from './shared.js';

// Split on blank-line boundaries (one or more empty lines) and emit
// one <p> per chunk. Operators who paste multi-paragraph copy get
// real paragraphs instead of a single run-on block.
function renderParagraphs(text) {
  const chunks = String(text || '').split(/\r?\n\s*\r?\n/).map((c) => c.trim()).filter(Boolean);
  if (!chunks.length) return '';
  return chunks
    .map((c) => '<p>' + escHtml(c).replace(/\r?\n/g, '<br/>') + '</p>')
    .join('');
}

export function renderAbout(state, opts) {
  const { locale, t } = pickStrings(opts);
  const profile = (state && state.restaurantProfile) || {};
  const name = profile.name || '';
  const promise = (state && state.onePromise) || '';
  const customer = (state && state.customerParagraph) || '';

  const promiseEmpty = locale === 'es'
    ? 'Tu promesa de una frase aparece aquí cuando termines la Lección 3.'
    : 'Your one-sentence promise lands here once you finish Lesson 3.';
  const customerEmpty = locale === 'es'
    ? 'El párrafo de tu cliente — quién viene a comer, qué busca — aparece aquí desde la Lección 4.'
    : "Your customer paragraph — who comes in, what they're looking for — shows here from Lesson 4.";

  const aboutLead = name
    ? (locale === 'es' ? 'Acerca de ' + escHtml(name) : 'About ' + escHtml(name))
    : escHtml(t.aboutHeading);

  const promiseHtml = promise
    ? '<p style="font-size:19px;line-height:1.5">' + escHtml(promise) + '</p>'
    : '<p style="font-size:19px;line-height:1.5"><em>' + escHtml(promiseEmpty) + '</em></p>';
  const customerHtml = customer
    ? renderParagraphs(customer)
    : '<p><em>' + escHtml(customerEmpty) + '</em></p>';

  return [
    pageOpen(t.aboutHeading, { ...opts, state, activePage: 'about' }),
    '<h1>', aboutLead, '</h1>',
    promiseHtml,
    customerHtml,
    pageClose({ ...opts, state })
  ].join('');
}
