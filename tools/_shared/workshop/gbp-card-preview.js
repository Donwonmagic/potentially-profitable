/**
 * Workshop Kit widget: gbp-card-preview
 *
 * Live preview of how the operator's Google Business Profile card
 * will render in Google search results — built from whatever the
 * operator has put into MuntinContext so far. Pure preview: shows
 * the gaps as readiness flags so the operator can see which lessons
 * still need to be done before publishing the listing.
 *
 * The widget also captures one GBP-specific field that isn't
 * collected elsewhere — the Primary Category — since Google requires
 * exactly one and the choice has SEO consequences. Twelve common
 * restaurant categories ship as a dropdown; "Other" lets the operator
 * type their own.
 *
 * Reads:
 *   - restaurantProfile.name / cuisine / address / phone
 *   - hours              (today's status: open / closed / opening soon)
 *   - palette[0]         (accent for the photo placeholder + CTA)
 *   - shotList           (count of curated photos ready to upload)
 *   - gbpDescription     (the L11a text-input output; rendered live)
 *   - gbp.primaryCategory (the field this widget captures)
 *
 * Writes:
 *   - gbp: { primaryCategory }
 *
 * Markup expected (no inline config — primary-category list is baked in):
 *
 *   <section class="course-widget" data-widget="gbp-card-preview"></section>
 *
 * Accessibility:
 *   - <select> for primary category with a labeled option list.
 *     "Other" reveals a follow-up text input.
 *   - The card preview is rendered with semantic HTML (article + dl)
 *     so screen readers can navigate sections. Readiness flags are
 *     visible text + a colored dot, not color alone.
 *   - Polite live region announces "Primary category set to …."
 */

export const tag = 'gbp-card-preview';
export const contextKeys = ['gbp'];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const CATEGORIES_EN = [
  { id: 'restaurant',            label: 'Restaurant' },
  { id: 'mexican-restaurant',    label: 'Mexican restaurant' },
  { id: 'italian-restaurant',    label: 'Italian restaurant' },
  { id: 'japanese-restaurant',   label: 'Japanese restaurant' },
  { id: 'chinese-restaurant',    label: 'Chinese restaurant' },
  { id: 'thai-restaurant',       label: 'Thai restaurant' },
  { id: 'indian-restaurant',     label: 'Indian restaurant' },
  { id: 'french-restaurant',     label: 'French restaurant' },
  { id: 'korean-restaurant',     label: 'Korean restaurant' },
  { id: 'vietnamese-restaurant', label: 'Vietnamese restaurant' },
  { id: 'american-restaurant',   label: 'American restaurant' },
  { id: 'mediterranean-restaurant', label: 'Mediterranean restaurant' },
  { id: 'pizza-restaurant',      label: 'Pizza restaurant' },
  { id: 'cafe',                  label: 'Cafe' },
  { id: 'bakery',                label: 'Bakery' },
  { id: 'bar',                   label: 'Bar' },
  { id: 'wine-bar',              label: 'Wine bar' },
  { id: 'coffee-shop',           label: 'Coffee shop' },
  { id: 'breakfast-restaurant',  label: 'Breakfast restaurant' },
  { id: 'sandwich-shop',         label: 'Sandwich shop' },
  { id: 'taqueria',              label: 'Taqueria' },
  { id: 'sushi-restaurant',      label: 'Sushi restaurant' },
  { id: 'seafood-restaurant',    label: 'Seafood restaurant' },
  { id: 'steakhouse',            label: 'Steakhouse' },
  { id: 'vegan-restaurant',      label: 'Vegan restaurant' },
  { id: 'vegetarian-restaurant', label: 'Vegetarian restaurant' },
  { id: 'food-truck',            label: 'Food truck' }
];

const CATEGORIES_ES = [
  { id: 'restaurant',            label: 'Restaurante' },
  { id: 'mexican-restaurant',    label: 'Restaurante mexicano' },
  { id: 'italian-restaurant',    label: 'Restaurante italiano' },
  { id: 'japanese-restaurant',   label: 'Restaurante japonés' },
  { id: 'chinese-restaurant',    label: 'Restaurante chino' },
  { id: 'thai-restaurant',       label: 'Restaurante tailandés' },
  { id: 'indian-restaurant',     label: 'Restaurante indio' },
  { id: 'french-restaurant',     label: 'Restaurante francés' },
  { id: 'korean-restaurant',     label: 'Restaurante coreano' },
  { id: 'vietnamese-restaurant', label: 'Restaurante vietnamita' },
  { id: 'american-restaurant',   label: 'Restaurante americano' },
  { id: 'mediterranean-restaurant', label: 'Restaurante mediterráneo' },
  { id: 'pizza-restaurant',      label: 'Pizzería' },
  { id: 'cafe',                  label: 'Café' },
  { id: 'bakery',                label: 'Panadería' },
  { id: 'bar',                   label: 'Bar' },
  { id: 'wine-bar',              label: 'Bar de vinos' },
  { id: 'coffee-shop',           label: 'Cafetería' },
  { id: 'breakfast-restaurant',  label: 'Restaurante de desayunos' },
  { id: 'sandwich-shop',         label: 'Lugar de sándwiches' },
  { id: 'taqueria',              label: 'Taquería' },
  { id: 'sushi-restaurant',      label: 'Restaurante de sushi' },
  { id: 'seafood-restaurant',    label: 'Restaurante de mariscos' },
  { id: 'steakhouse',            label: 'Steakhouse' },
  { id: 'vegan-restaurant',      label: 'Restaurante vegano' },
  { id: 'vegetarian-restaurant', label: 'Restaurante vegetariano' },
  { id: 'food-truck',            label: 'Food truck' }
];

function readAccent(state) {
  const p = state && state.palette;
  if (Array.isArray(p) && typeof p[0] === 'string' && /^#[0-9A-Fa-f]{6}$/.test(p[0])) return p[0].toUpperCase();
  return '#1F4E5B';
}

// Today's open/closed status from MuntinContext.hours. Returns:
//   { state: 'open'|'closed'|'unknown', label: '…' }
// hours shape: { monday: { open: 'HH:MM', close: 'HH:MM', closed: false }, ... }
function todayStatus(state, locale) {
  const hours = state && state.hours;
  if (!hours || typeof hours !== 'object') {
    return { state: 'unknown', label: locale === 'es' ? 'Horario no establecido' : 'Hours not set' };
  }
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const today = days[new Date().getDay()];
  const entry = hours[today];
  if (!entry || entry.closed) {
    return { state: 'closed', label: locale === 'es' ? 'Cerrado hoy' : 'Closed today' };
  }
  if (entry.open && entry.close) {
    return { state: 'open', label: locale === 'es'
        ? 'Abierto · ' + entry.open + '–' + entry.close
        : 'Open · ' + entry.open + '–' + entry.close };
  }
  return { state: 'unknown', label: locale === 'es' ? 'Horario incompleto' : 'Hours incomplete' };
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const CATS = locale === 'es' ? CATEGORIES_ES : CATEGORIES_EN;

  const t = locale === 'es' ? {
    sectionLabel: 'Vista previa de tu ficha de Google',
    categoryLabel: 'Categoría principal de GBP',
    categoryHelp: 'Google requiere exactamente una categoría principal. Es la más importante para el ranking de búsqueda local — elige la específica, no la genérica.',
    categoryPlaceholder: 'Selecciona una categoría…',
    otherOption: 'Otra (escribe abajo)',
    otherInputPlaceholder: 'Escribe tu categoría',
    readiness: 'Lista de revisión',
    cardEyebrow: 'Vista previa · ficha de Google',
    cardCategoryEmpty: 'Categoría pendiente',
    cardAddressEmpty: 'Dirección pendiente',
    cardPhoneEmpty: 'Teléfono pendiente',
    cardDescEmpty: 'Descripción pendiente',
    cardPhotosLine: function (n) { return n === 0 ? 'Sin fotos' : (n + ' foto' + (n === 1 ? '' : 's') + ' lista' + (n === 1 ? '' : 's')); },
    cardCta: 'Reservar',
    cardWebsite: 'Sitio web',
    cardCall: 'Llamar',
    cardDirections: 'Indicaciones',
    readyName: 'Nombre del negocio',
    readyCategory: 'Categoría principal',
    readyAddress: 'Dirección',
    readyPhone: 'Teléfono',
    readyHours: 'Horarios',
    readyDescription: 'Descripción',
    readyPhotos: 'Fotos (3+ recomendado)',
    statusReady: 'Listo',
    statusMissing: 'Falta',
    statusPartial: 'Parcial',
    announceCategory: function (label) { return 'Categoría principal puesta a ' + label + '.'; }
  } : {
    sectionLabel: 'Preview your Google Business card',
    categoryLabel: 'GBP primary category',
    categoryHelp: 'Google requires exactly one primary category. It is the single biggest factor in local-search ranking — pick the specific one, not the generic one.',
    categoryPlaceholder: 'Select a category…',
    otherOption: 'Other (type below)',
    otherInputPlaceholder: 'Type your category',
    readiness: 'Readiness checklist',
    cardEyebrow: 'Preview · Google Business card',
    cardCategoryEmpty: 'Category pending',
    cardAddressEmpty: 'Address pending',
    cardPhoneEmpty: 'Phone pending',
    cardDescEmpty: 'Description pending',
    cardPhotosLine: function (n) { return n === 0 ? 'No photos' : (n + ' photo' + (n === 1 ? '' : 's') + ' ready'); },
    cardCta: 'Reserve',
    cardWebsite: 'Website',
    cardCall: 'Call',
    cardDirections: 'Directions',
    readyName: 'Business name',
    readyCategory: 'Primary category',
    readyAddress: 'Address',
    readyPhone: 'Phone',
    readyHours: 'Hours',
    readyDescription: 'Description',
    readyPhotos: 'Photos (3+ recommended)',
    statusReady: 'Ready',
    statusMissing: 'Missing',
    statusPartial: 'Partial',
    announceCategory: function (label) { return 'Primary category set to ' + label + '.'; }
  };

  const initialCat = (state && state.gbp && typeof state.gbp.primaryCategory === 'string') ? state.gbp.primaryCategory : '';
  const initialIsKnown = !!CATS.find((c) => c.id === initialCat || c.label === initialCat);

  rootEl.innerHTML = [
    '<div class="gcp">',
      '<div class="gcp-controls">',
        '<label class="gcp-field">',
          '<span class="gcp-lbl">', escHtml(t.categoryLabel), '</span>',
          '<select class="gcp-select" data-field="primaryCategory">',
            '<option value="" disabled', initialCat ? '' : ' selected', '>', escHtml(t.categoryPlaceholder), '</option>',
            CATS.map((c) => '<option value="' + escAttr(c.id) + '"' + (c.id === initialCat ? ' selected' : '') + '>' + escHtml(c.label) + '</option>').join(''),
            '<option value="__other__"', (!initialIsKnown && initialCat) ? ' selected' : '', '>', escHtml(t.otherOption), '</option>',
          '</select>',
          '<p class="gcp-help">', escHtml(t.categoryHelp), '</p>',
          '<input class="gcp-input gcp-other" type="text" placeholder="', escAttr(t.otherInputPlaceholder), '" value="', escAttr((!initialIsKnown && initialCat) ? initialCat : ''), '" style="', (!initialIsKnown && initialCat) ? '' : 'display:none', '">',
        '</label>',
      '</div>',

      '<div class="gcp-preview-wrap">',
        '<p class="gcp-preview-eyebrow">', escHtml(t.cardEyebrow), '</p>',
        '<article class="gcp-card" aria-label="', escAttr(t.cardEyebrow), '">',
          '<div class="gcp-card-photo" aria-hidden="true">',
            '<div class="gcp-photo-stack"></div>',
            '<span class="gcp-photo-count"></span>',
          '</div>',
          '<div class="gcp-card-body">',
            '<h4 class="gcp-card-name"></h4>',
            '<p class="gcp-card-line gcp-card-cat"></p>',
            '<p class="gcp-card-line gcp-card-hours"></p>',
            '<p class="gcp-card-line gcp-card-addr"></p>',
            '<p class="gcp-card-line gcp-card-phone"></p>',
            '<p class="gcp-card-desc"></p>',
            '<div class="gcp-card-actions">',
              '<span class="gcp-card-action">📞 ', escHtml(t.cardCall), '</span>',
              '<span class="gcp-card-action">🌐 ', escHtml(t.cardWebsite), '</span>',
              '<span class="gcp-card-action gcp-card-action--cta">', escHtml(t.cardCta), '</span>',
            '</div>',
          '</div>',
        '</article>',
      '</div>',

      '<div class="gcp-readiness">',
        '<h4 class="gcp-readiness-head">', escHtml(t.readiness), '</h4>',
        '<ul class="gcp-readiness-list"></ul>',
      '</div>',

      '<p class="gcp-live sr-only" role="status" aria-live="polite"></p>',
    '</div>'
  ].join('');

  const els = {
    select: rootEl.querySelector('[data-field="primaryCategory"]'),
    other:  rootEl.querySelector('.gcp-other'),
    name:   rootEl.querySelector('.gcp-card-name'),
    cat:    rootEl.querySelector('.gcp-card-cat'),
    hours:  rootEl.querySelector('.gcp-card-hours'),
    addr:   rootEl.querySelector('.gcp-card-addr'),
    phone:  rootEl.querySelector('.gcp-card-phone'),
    desc:   rootEl.querySelector('.gcp-card-desc'),
    photo:  rootEl.querySelector('.gcp-card-photo'),
    photoStack: rootEl.querySelector('.gcp-photo-stack'),
    photoCount: rootEl.querySelector('.gcp-photo-count'),
    readyList: rootEl.querySelector('.gcp-readiness-list'),
    live:   rootEl.querySelector('.gcp-live')
  };

  function readContext() {
    if (window.MuntinContext && typeof window.MuntinContext.read === 'function') {
      const ctx = window.MuntinContext.read() || {};
      return Object.assign({}, state || {}, ctx);
    }
    return state || {};
  }

  function categoryLabel(idOrCustom) {
    if (!idOrCustom) return '';
    const found = CATS.find((c) => c.id === idOrCustom);
    return found ? found.label : idOrCustom;
  }

  function commit() {
    const sel = els.select.value;
    let v = '';
    if (sel === '__other__') {
      v = (els.other.value || '').trim();
    } else if (sel) {
      v = sel;
    }
    if (deps && typeof deps.commit === 'function') {
      deps.commit({ gbp: { primaryCategory: v } });
    }
  }

  function rowHTML(label, value, statusKind) {
    const statusLabel = statusKind === 'ready' ? t.statusReady : (statusKind === 'partial' ? t.statusPartial : t.statusMissing);
    return [
      '<li class="gcp-ready-row gcp-ready-row--', statusKind, '">',
        '<span class="gcp-ready-dot" aria-hidden="true"></span>',
        '<span class="gcp-ready-label">', escHtml(label), '</span>',
        '<span class="gcp-ready-status">', escHtml(statusLabel), '</span>',
      '</li>'
    ].join('');
  }

  function render() {
    const ctx = readContext();
    const profile = ctx.restaurantProfile || {};
    const accent = readAccent(ctx);
    const today = todayStatus(ctx, locale);
    const description = ctx.gbpDescription || '';
    const category = (ctx.gbp && ctx.gbp.primaryCategory) || '';
    const shotCount = Array.isArray(ctx.shotList) ? ctx.shotList.length : 0;

    els.name.textContent = profile.name || (locale === 'es' ? 'Tu restaurante' : 'Your restaurant');
    els.cat.innerHTML  = category ? escHtml(categoryLabel(category)) : ('<span class="gcp-empty">' + escHtml(t.cardCategoryEmpty) + '</span>');
    els.hours.innerHTML = '<span class="gcp-hours-dot gcp-hours-dot--' + today.state + '"></span>' + escHtml(today.label);
    els.addr.innerHTML  = profile.address ? escHtml(String(profile.address).replace(/\s+/g,' ')) : ('<span class="gcp-empty">' + escHtml(t.cardAddressEmpty) + '</span>');
    els.phone.innerHTML = profile.phone   ? escHtml(profile.phone)   : ('<span class="gcp-empty">' + escHtml(t.cardPhoneEmpty) + '</span>');
    els.desc.innerHTML  = description ? escHtml(description) : ('<span class="gcp-empty">' + escHtml(t.cardDescEmpty) + '</span>');

    els.photo.style.background = accent + '22';
    els.photoStack.style.background = accent + '88';
    els.photoCount.textContent = t.cardPhotosLine(shotCount);

    const ctaEl = rootEl.querySelector('.gcp-card-action--cta');
    if (ctaEl) ctaEl.style.background = accent;

    const photosStatus = shotCount === 0 ? 'missing' : (shotCount < 3 ? 'partial' : 'ready');
    const rows = [
      rowHTML(t.readyName,        profile.name,                  profile.name ? 'ready' : 'missing'),
      rowHTML(t.readyCategory,    category,                      category ? 'ready' : 'missing'),
      rowHTML(t.readyAddress,     profile.address,               profile.address ? 'ready' : 'missing'),
      rowHTML(t.readyPhone,       profile.phone,                 profile.phone ? 'ready' : 'missing'),
      rowHTML(t.readyHours,       today.label,                   today.state === 'unknown' ? 'missing' : 'ready'),
      rowHTML(t.readyDescription, description,                   description ? 'ready' : 'missing'),
      rowHTML(t.readyPhotos,      String(shotCount),              photosStatus)
    ];
    els.readyList.innerHTML = rows.join('');
  }

  els.select.addEventListener('change', () => {
    if (els.select.value === '__other__') {
      els.other.style.display = '';
      els.other.focus();
    } else {
      els.other.style.display = 'none';
      els.other.value = '';
    }
    commit();
    render();
    const v = els.select.value === '__other__' ? els.other.value : els.select.value;
    if (v) els.live.textContent = t.announceCategory(categoryLabel(v));
  });
  els.other.addEventListener('input', () => {
    commit();
    render();
  });

  function onContextChange() { render(); }
  document.addEventListener('mtn:context-change', onContextChange);

  render();

  return {
    unmount: function () {
      document.removeEventListener('mtn:context-change', onContextChange);
      rootEl.innerHTML = '';
    }
  };
}

export function serialize(rootEl) {
  const sel = rootEl.querySelector('[data-field="primaryCategory"]');
  const other = rootEl.querySelector('.gcp-other');
  if (!sel) return {};
  let v = '';
  if (sel.value === '__other__') v = ((other && other.value) || '').trim();
  else if (sel.value) v = sel.value;
  return { gbp: { primaryCategory: v } };
}
