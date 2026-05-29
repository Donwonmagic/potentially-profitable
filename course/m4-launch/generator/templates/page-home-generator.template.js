/**
 * Generator template: index.html (the home page in the downloaded ZIP).
 *
 * Sibling of page-home.template.js (which renders the rail's preview
 * iframe with no real navigation). This template uses the shared
 * pageOpen/pageClose chrome so the deployed home page has working
 * nav links to menu.html, about.html, contact.html.
 *
 * The rail intentionally keeps its own renderHome() — the iframe
 * srcdoc is sandbox="" so cross-page links would 404 anyway, and the
 * rail's hero treatment is tighter (skeleton boxes for empty state,
 * palette hint, etc.). Both templates evolve in parallel as needed.
 */

import { escHtml, pageOpen, pageClose, pickStrings, readPalette } from './shared.js';

export function renderHomeForBundle(state, opts) {
  const { locale, t } = pickStrings(opts);
  const { accent, cream } = readPalette(state);
  const profile = (state && state.restaurantProfile) || {};
  const name = profile.name || '';
  const cuisine = profile.cuisine || '';
  const promise = (state && state.onePromise) || '';

  const titleCopy = name || (locale === 'es' ? 'Tu restaurante' : 'Your restaurant');
  const promiseEmpty = locale === 'es'
    ? 'Una promesa de una frase: lo que va a recordar el comensal después de irse.'
    : "One sentence about what the diner will remember after they leave.";

  const cuisineChip = cuisine
    ? '<span style="display:inline-block;padding:4px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;background:' + accent + ';color:' + cream + ';border-radius:999px;margin-bottom:18px;font-weight:600">' + escHtml(cuisine) + '</span>'
    : '';

  return [
    pageOpen(titleCopy, { ...opts, state, activePage: 'home' }),
    '<div style="text-align:center;padding:16px 0 8px">',
    cuisineChip,
    '<h1 style="font-size:44px;margin:0 0 16px">', escHtml(titleCopy), '</h1>',
    '<p style="font-size:19px;line-height:1.5;max-width:480px;margin:0 auto 22px;opacity:.85">',
      promise ? escHtml(promise) : '<em>' + escHtml(promiseEmpty) + '</em>',
    '</p>',
    '<a class="cta" href="contact.html">', escHtml(t.cta), '</a>',
    '</div>',
    pageClose({ ...opts, state })
  ].join('');
}
