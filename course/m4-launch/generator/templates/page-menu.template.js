/**
 * Generator template: menu.html.
 *
 * Reads the operator's `dishes` array (captured by the L8 menu-builder
 * widget — each item shaped `{ name, price }`). Renders them as a
 * single column with the dish name + price; empty list produces a
 * "menu coming soon" placeholder. No descriptions, no allergens — the
 * L8 widget doesn't capture those, and L14's lesson is explicit about
 * not overpromising what's in the bundle.
 */

import { escHtml, pageOpen, pageClose, pickStrings } from './shared.js';

const PRICE_RE = /^\$?\d{1,4}(?:\.\d{1,2})?$/;

function safePrice(raw) {
  // Strip every whitespace before testing so "$ 12" and "12 .50" don't
  // squeak through with cosmetic whitespace; only digits + optional
  // leading $ + optional .NN remain.
  const s = String(raw == null ? '' : raw).replace(/\s+/g, '');
  if (!s) return '';
  if (PRICE_RE.test(s)) return s.startsWith('$') ? s : '$' + s;
  return '';
}

export function renderMenu(state, opts) {
  const { t } = pickStrings(opts);
  const dishes = Array.isArray(state && state.dishes) ? state.dishes : [];

  const rows = dishes
    .filter((d) => d && (d.name || d.price))
    .map((d) => {
      const name = escHtml((d.name || '').trim());
      const price = safePrice(d.price);
      return [
        '<li class="dish">',
        '<span class="dish-name">', name || '&nbsp;', '</span>',
        price ? '<span class="dish-price">' + escHtml(price) + '</span>' : '',
        '</li>'
      ].join('');
    });

  const body = rows.length
    ? '<ol class="menu">' + rows.join('') + '</ol>'
    : '<p>' + escHtml(t.menuEmpty) + '</p>';

  return [
    pageOpen(t.menuHeading, { ...opts, state, activePage: 'menu' }),
    '<style>',
    '.menu{list-style:none;padding:0;margin:24px 0 0;border-top:1px solid currentColor;opacity:1}',
    '.menu .dish{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:14px 0;border-bottom:1px solid;border-color:currentColor;opacity:1;font-family:Georgia,serif}',
    '.menu .dish-name{font-size:18px;font-weight:500}',
    '.menu .dish-price{font-size:15px;opacity:.7;font-family:-apple-system,sans-serif;font-weight:600;white-space:nowrap}',
    '</style>',
    '<h1>', escHtml(t.menuHeading), '</h1>',
    body,
    pageClose({ ...opts, state })
  ].join('');
}
