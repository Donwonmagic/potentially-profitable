/**
 * Generator template: contact.html.
 *
 * Address + tappable phone + weekly hours grid + a "find us" map
 * link. Pulls from L1 (address), L10 (phone + hours). The hours
 * structure mirrors the weekly-hours-grid widget contract:
 * `hours: { monday: { open, close, closed }, ... }`.
 */

import { escHtml, escAttr, pageOpen, pageClose, pickStrings } from './shared.js';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function renderHoursTable(hours, t) {
  const safeHours = (hours && typeof hours === 'object') ? hours : {};
  const rows = DAYS.map((day) => {
    const h = safeHours[day] || {};
    const closed = h.closed === true || (!h.open && !h.close);
    const value = closed
      ? '<span class="closed">' + escHtml(t.contactClosed) + '</span>'
      : escHtml((h.open || '') + ' – ' + (h.close || ''));
    return [
      '<tr>',
      '<th scope="row">', escHtml(t.daysFull[day] || day), '</th>',
      '<td>', value, '</td>',
      '</tr>'
    ].join('');
  });
  return '<table class="hours"><tbody>' + rows.join('') + '</tbody></table>';
}

export function renderContact(state, opts) {
  const { locale, t } = pickStrings(opts);
  const profile = (state && state.restaurantProfile) || {};
  const address = profile.address || '';
  const phone = profile.phone || '';
  const hours = state && state.hours;

  const addressEmpty = locale === 'es' ? 'Agrega tu dirección en la Lección 1.' : 'Add your address in Lesson 1.';
  const phoneEmpty   = locale === 'es' ? 'Agrega tu teléfono en la Lección 10.' : 'Add your phone in Lesson 10.';
  const hoursEmpty   = locale === 'es' ? 'Marca tus horarios en la Lección 10.' : 'Set your hours in Lesson 10.';
  const mapsLabel    = locale === 'es' ? 'Abrir en Google Maps' : 'Open in Google Maps';

  const addressBlock = address
    ? [
        '<address style="font-style:normal;font-size:18px;line-height:1.5;margin:0 0 14px">',
        escHtml(address).replace(/\r?\n/g, '<br/>'),
        '</address>',
        '<p><a href="https://www.google.com/maps?q=', escAttr(encodeURIComponent(address)), '" target="_blank" rel="noopener">', escHtml(mapsLabel), ' →</a></p>'
      ].join('')
    : '<p><em>' + escHtml(addressEmpty) + '</em></p>';

  const phoneBlock = phone
    ? '<p style="font-size:20px;font-weight:600;margin:0"><a href="tel:' + escAttr(phone) + '">' + escHtml(phone) + '</a></p>'
    : '<p><em>' + escHtml(phoneEmpty) + '</em></p>';

  const hoursBlock = (hours && Object.keys(hours).length)
    ? renderHoursTable(hours, t)
    : '<p><em>' + escHtml(hoursEmpty) + '</em></p>';

  return [
    pageOpen(t.contactHeading, { ...opts, state, activePage: 'contact' }),
    '<style>',
    '.hours{border-collapse:collapse;margin:8px 0 0;font-family:Georgia,serif;font-size:16px}',
    '.hours th,.hours td{padding:8px 14px;text-align:left;border-bottom:1px solid currentColor;opacity:1;vertical-align:baseline}',
    '.hours th{font-weight:500;min-width:110px}',
    '.hours td{font-family:-apple-system,sans-serif;font-size:15px}',
    '.hours .closed{opacity:.55;font-style:italic}',
    '</style>',
    '<h1>', escHtml(t.contactHeading), '</h1>',
    addressBlock,
    '<h2>', escHtml(t.contactPhone), '</h2>',
    phoneBlock,
    '<h2>', escHtml(t.contactHours), '</h2>',
    hoursBlock,
    pageClose({ ...opts, state })
  ].join('');
}
