/**
 * Workshop Kit widget: font-pair-picker
 *
 * Curated heading-+-body font-pair picker for L7 (palette + voice).
 * Six pre-vetted pairs — none of them require loading remote font
 * files, so the rail's sandbox="" iframe (and the no-fetch posture
 * generally) keep working. Each pair is a CSS font-family stack that
 * falls back through system-native typefaces.
 *
 * The widget renders six preview cards, each showing the same restaurant
 * name + tagline in that pair. Click to select. Writes
 *   fontPair: { id, heading, body }
 * to MuntinContext, where:
 *   id      — stable slug ('editorial-modern', 'diner-classic', …)
 *   heading — CSS font-family stack the L14 generator + rail use
 *   body    — CSS font-family stack for body copy
 *
 * Markup expected (no config block — pairs are baked in):
 *
 *   <section class="course-widget" data-widget="font-pair-picker"></section>
 *
 * Accessibility:
 *   - role="radiogroup" on the card container with aria-labelledby
 *     pointing at the widget heading.
 *   - Each card is role="radio" with aria-checked. Up/Down + Left/Right
 *     arrow keys move selection; Enter/Space commits the focused card.
 *   - Polite live region announces "Font pair: Editorial modern selected
 *     — heading <Heading sample>; body <body sample>."
 */

export const tag = 'font-pair-picker';
export const contextKeys = ['fontPair'];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// CSS font-family stacks intentionally use system + commonly-installed
// fallbacks so the widget works without any web-font load. Real Google
// Fonts (Fraunces, Inter, Playfair, etc.) come through the L14
// generator's @import block at deploy time, not here.
const PAIRS = [
  {
    id: 'editorial-modern',
    name_en: 'Editorial modern',
    name_es: 'Editorial moderno',
    heading: "'Fraunces','Playfair Display',Georgia,serif",
    body:    "'Inter','Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    blurb_en: 'Restrained serif with the warmth of italic. The Method default — the bootcamp itself is set in this pair.',
    blurb_es: 'Serif comedido con la calidez de la cursiva. El default del Método — el bootcamp mismo está en este par.'
  },
  {
    id: 'diner-classic',
    name_en: 'Diner classic',
    name_es: 'Clásico de diner',
    heading: "'Bebas Neue','Oswald','Impact','Arial Narrow',sans-serif",
    body:    "Georgia,'Times New Roman',serif",
    blurb_en: 'Condensed sans headline + serif body. Works for breakfast spots, classic American counters, anywhere a diner sign would look right.',
    blurb_es: 'Sans condensado en titular + serif en cuerpo. Funciona para lugares de desayuno, mostradores americanos clásicos, donde un letrero de diner se vería bien.'
  },
  {
    id: 'trattoria',
    name_en: 'Trattoria',
    name_es: 'Trattoria',
    heading: "'Playfair Display','Cormorant Garamond',Garamond,Georgia,serif",
    body:    "'Lora','EB Garamond',Georgia,serif",
    blurb_en: 'All-serif pair with the heading in a contrasty display weight. The Italian-restaurant default; reads as established without trying too hard.',
    blurb_es: 'Par todo-serif con el titular en un peso display de mucho contraste. El default de restaurante italiano; lee como establecido sin esforzarse demasiado.'
  },
  {
    id: 'taqueria',
    name_en: 'Taqueria',
    name_es: 'Taquería',
    heading: "'Anton','Bebas Neue','Impact',sans-serif",
    body:    "'Inter','Helvetica Neue',-apple-system,sans-serif",
    blurb_en: 'Ultra-bold compressed sans + clean body sans. Reads street, reads loud — the right voice for hand-painted-sign-style restaurants.',
    blurb_es: 'Sans comprimido ultra-bold + sans limpio en cuerpo. Lee callejero, lee fuerte — la voz correcta para restaurantes estilo letrero pintado a mano.'
  },
  {
    id: 'minimal-tasting',
    name_en: 'Minimal tasting',
    name_es: 'Minimal de degustación',
    heading: "'Inter','Helvetica Neue','Arial',sans-serif",
    body:    "'Inter','Helvetica Neue','Arial',sans-serif",
    blurb_en: 'All-sans, two-weight system. Quiet, modern, expensive-feeling. Works for tasting menus, wine bars, anything where the restraint IS the brand.',
    blurb_es: 'Todo-sans, sistema de dos pesos. Tranquilo, moderno, con sensación cara. Funciona para menús de degustación, bares de vino, donde la sobriedad ES la marca.'
  },
  {
    id: 'corner-store',
    name_en: 'Corner-store warmth',
    name_es: 'Calidez de tienda de la esquina',
    heading: "'Caveat','Kalam','Comic Sans MS',cursive",
    body:    "'Inter','Helvetica Neue',-apple-system,sans-serif",
    blurb_en: 'Hand-script heading + clean body. Reads as actual-human-wrote-this. Cafes, bakeries, juice bars — anywhere the brand is "the person behind the counter."',
    blurb_es: 'Titular manuscrito + cuerpo limpio. Lee como humano-real-escribió-esto. Cafés, panaderías, jugueras — donde la marca es "la persona detrás del mostrador."'
  }
];

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const initial = (state && state.fontPair && state.fontPair.id) || null;

  const heading = locale === 'es' ? 'Elige un par tipográfico' : 'Pick a font pair';
  const sampleName_en = 'Jolene\'s Cafe';
  const sampleName_es = 'Café Jolene';
  const sampleTag_en = 'The Tuesday-night breakfast place your block tells other blocks about.';
  const sampleTag_es = 'El lugar de desayuno de los martes que tu cuadra le recomienda a otras cuadras.';
  const sampleName = locale === 'es' ? sampleName_es : sampleName_en;
  const sampleTag  = locale === 'es' ? sampleTag_es  : sampleTag_en;
  const announceTpl = locale === 'es'
    ? 'Par tipográfico {n} seleccionado.'
    : '{n} font pair selected.';

  rootEl.innerHTML = [
    '<div class="fpp">',
      '<h3 id="fppLabel" class="fpp-label">', escHtml(heading), '</h3>',
      '<div class="fpp-grid" role="radiogroup" aria-labelledby="fppLabel">',
        PAIRS.map((p, i) => {
          const name = locale === 'es' ? p.name_es : p.name_en;
          const blurb = locale === 'es' ? p.blurb_es : p.blurb_en;
          const checked = p.id === initial;
          return [
            '<div class="fpp-card" role="radio" tabindex="', (checked || (!initial && i === 0)) ? '0' : '-1', '"',
              ' aria-checked="', checked ? 'true' : 'false', '"',
              ' data-id="', escAttr(p.id), '"',
              ' data-i="', i, '">',
              '<div class="fpp-preview">',
                '<div class="fpp-sample-name" style="font-family:', escAttr(p.heading), '">', escHtml(sampleName), '</div>',
                '<div class="fpp-sample-tag"  style="font-family:', escAttr(p.body),    '">', escHtml(sampleTag), '</div>',
              '</div>',
              '<div class="fpp-meta">',
                '<div class="fpp-meta-name">', escHtml(name), '</div>',
                '<div class="fpp-meta-blurb">', escHtml(blurb), '</div>',
              '</div>',
            '</div>'
          ].join('');
        }).join(''),
      '</div>',
      '<p class="fpp-live sr-only" role="status" aria-live="polite"></p>',
    '</div>'
  ].join('');

  const cards = rootEl.querySelectorAll('.fpp-card');
  const liveEl = rootEl.querySelector('.fpp-live');
  let focused = Math.max(0, Array.from(cards).findIndex((c) => c.getAttribute('aria-checked') === 'true'));
  if (focused < 0) focused = 0;

  function select(i, opts) {
    const opt = opts || {};
    cards.forEach((card, j) => {
      const isThis = i === j;
      card.setAttribute('aria-checked', isThis ? 'true' : 'false');
      card.setAttribute('tabindex', isThis ? '0' : '-1');
      card.classList.toggle('fpp-card--selected', isThis);
    });
    const pair = PAIRS[i];
    if (deps && typeof deps.commit === 'function') {
      deps.commit({ fontPair: { id: pair.id, heading: pair.heading, body: pair.body } });
    }
    const niceName = locale === 'es' ? pair.name_es : pair.name_en;
    liveEl.textContent = announceTpl.replace('{n}', niceName);
    if (opt.focus !== false) cards[i].focus();
  }

  cards.forEach((card, i) => {
    card.addEventListener('click', () => { focused = i; select(i); });
    card.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          focused = (i + 1) % cards.length;
          select(focused);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          focused = (i - 1 + cards.length) % cards.length;
          select(focused);
          break;
        case 'Home':
          e.preventDefault();
          focused = 0; select(focused);
          break;
        case 'End':
          e.preventDefault();
          focused = cards.length - 1; select(focused);
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          select(i);
          break;
      }
    });
  });

  return {
    unmount: function () { rootEl.innerHTML = ''; }
  };
}

export function serialize(rootEl) {
  const sel = rootEl.querySelector('.fpp-card[aria-checked="true"]');
  if (!sel) return {};
  const id = sel.getAttribute('data-id');
  const pair = PAIRS.find((p) => p.id === id);
  if (!pair) return {};
  return { fontPair: { id: pair.id, heading: pair.heading, body: pair.body } };
}
