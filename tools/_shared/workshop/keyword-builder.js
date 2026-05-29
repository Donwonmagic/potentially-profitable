/**
 * Workshop Kit widget: keyword-builder
 *
 * The L12 local-SEO companion. Currently L12 substitutes a plain
 * text-input where the operator types 8 keyword phrases freehand;
 * this widget seeds the same 8 slots with auto-generated suggestions
 * derived from restaurantProfile.cuisine + restaurantProfile.address
 * + (optional) operator-typed neighborhood override.
 *
 * Eight slots, four formulas (each appearing twice with different
 * second words):
 *   1. cuisine + neighborhood       — "mexican restaurant silver spring"
 *   2. dish + neighborhood          — "carnitas silver spring"
 *   3. occasion + neighborhood      — "date night silver spring downtown"
 *   4. intent + cuisine + neighborhood — "vegetarian mexican silver spring"
 *
 * Writes localKeywords as a newline-separated string — same shape the
 * L12 text-input writes today, so the L14 generator + readiness
 * checklist + sheets pack keep working without changes.
 *
 * Markup expected (no config block — the widget reads everything from
 * MuntinContext):
 *
 *   <section class="course-widget" data-widget="keyword-builder"></section>
 *
 * Accessibility:
 *   - Each row is a labeled <input type="text"> with a leading formula
 *     name as the visible label. aria-describedby points at the
 *     example string ("e.g., mexican restaurant silver spring") so
 *     the screen reader hears the seed without the operator having
 *     to type it first.
 *   - A "regenerate from context" button reseeds all 8 slots from the
 *     latest cuisine + neighborhood values; aria-live polite announces
 *     "8 keyword slots refilled from your current profile."
 */

export const tag = 'keyword-builder';
export const contextKeys = ['localKeywords', 'restaurantProfile'];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Try to pull a neighborhood + city from a one-line or multi-line
// address. Heuristic: the second-to-last comma-separated chunk is
// usually the city; otherwise fall back to the last alphabetic token.
function neighborhoodFromAddress(address) {
  if (!address) return '';
  const parts = String(address).split(/[,\n]/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return '';
  // "8245 Georgia Ave, Silver Spring, MD 20910" → second-from-end "Silver Spring"
  if (parts.length >= 3) return parts[parts.length - 2].toLowerCase();
  // "Silver Spring, MD" → first chunk
  return parts[0].toLowerCase();
}

const DISH_BANK = {
  mexican:       ['carnitas',   'tacos'],
  italian:       ['carbonara',  'wood-fired pizza'],
  japanese:      ['ramen',      'omakase'],
  chinese:       ['dumplings',  'mapo tofu'],
  thai:          ['pad see ew', 'green curry'],
  indian:        ['biryani',    'butter chicken'],
  mediterranean: ['mezze',      'lamb kabob'],
  american:      ['burger',     'fried chicken'],
  french:        ['steak frites','coq au vin'],
  korean:        ['kbbq',       'bibimbap'],
  vietnamese:    ['pho',        'banh mi'],
  ethiopian:     ['injera',     'doro wat'],
  default:       ['signature dish', 'house special']
};

function dishesForCuisine(cuisine) {
  const c = String(cuisine || '').toLowerCase();
  for (const key of Object.keys(DISH_BANK)) {
    if (key !== 'default' && c.includes(key)) return DISH_BANK[key];
  }
  return DISH_BANK.default;
}

function buildSuggestions(cuisine, neighborhood, locale) {
  const c = (cuisine || '').trim().toLowerCase() || (locale === 'es' ? 'restaurante' : 'restaurant');
  const n = (neighborhood || '').trim().toLowerCase() || (locale === 'es' ? 'tu barrio' : 'your neighborhood');
  const dishes = dishesForCuisine(c);
  const occasions = locale === 'es'
    ? ['cena romántica', 'desayuno familiar']
    : ['date night', 'family breakfast'];
  const intents = locale === 'es'
    ? ['vegetariano', 'abierto tarde']
    : ['vegetarian', 'late-night'];

  return [
    // Formula 1: cuisine + neighborhood (×2 — base + with downtown qualifier)
    `${c} ${n}`,
    `${c} restaurante ${n} centro`.replace('restaurante', locale === 'es' ? 'restaurante' : 'restaurant'),
    // Formula 2: dish + neighborhood (×2)
    `${dishes[0]} ${n}`,
    `${dishes[1]} ${n}`,
    // Formula 3: occasion + neighborhood (×2)
    `${occasions[0]} ${n}`,
    `${occasions[1]} ${n}`,
    // Formula 4: intent + cuisine + neighborhood (×2)
    `${intents[0]} ${c} ${n}`,
    `${intents[1]} ${c} ${n}`
  ].map((s) => s.replace(/\s+/g, ' ').trim());
}

const FORMULA_LABELS_EN = [
  'Cuisine + neighborhood',
  'Cuisine + neighborhood + downtown qualifier',
  'Top dish + neighborhood',
  '2nd dish + neighborhood',
  'Occasion (date night) + neighborhood',
  'Occasion (family meal) + neighborhood',
  'Intent (vegetarian) + cuisine + neighborhood',
  'Intent (late-night) + cuisine + neighborhood'
];
const FORMULA_LABELS_ES = [
  'Cocina + barrio',
  'Cocina + barrio + matiz de centro',
  'Plato principal + barrio',
  '2do plato + barrio',
  'Ocasión (cena romántica) + barrio',
  'Ocasión (comida familiar) + barrio',
  'Intención (vegetariano) + cocina + barrio',
  'Intención (abierto tarde) + cocina + barrio'
];

function parseExistingKeywords(raw) {
  return String(raw || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function serializeKeywords(values) {
  return values
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 8)
    .join('\n');
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const labels = locale === 'es' ? FORMULA_LABELS_ES : FORMULA_LABELS_EN;

  const profile = (state && state.restaurantProfile) || {};
  const cuisineFromContext = profile.cuisine || '';
  const neighborhoodFromContext = neighborhoodFromAddress(profile.address);

  // Operator-typed overrides; default to the context values.
  let cuisine = cuisineFromContext;
  let neighborhood = neighborhoodFromContext;

  // Existing keywords (if the operator has typed any before) win over
  // the seed. Otherwise seed from suggestions.
  const existing = parseExistingKeywords(state && state.localKeywords);
  const seed = buildSuggestions(cuisine, neighborhood, locale);
  let values = [0,1,2,3,4,5,6,7].map((i) => existing[i] || seed[i] || '');

  const copy = locale === 'es' ? {
    headerCuisine: 'Cocina (de tu perfil)',
    headerNeighborhood: 'Barrio (detectado de la dirección, edita si hace falta)',
    regenerate: 'Volver a generar los 8 slots desde el perfil',
    regenLive: '8 slots de palabras clave rellenados desde tu perfil actual.',
    help: 'Edita cada fila a algo que un comensal real escribiría. Las sugerencias son punto de partida, no respuesta final.',
    placeholderRow: 'Tu frase clave aquí'
  } : {
    headerCuisine: 'Cuisine (from your profile)',
    headerNeighborhood: 'Neighborhood (detected from address — edit if needed)',
    regenerate: 'Refill all 8 slots from profile',
    regenLive: '8 keyword slots refilled from your current profile.',
    help: 'Edit each row to what a real diner would type. The suggestions are a starting point, not the final answer.',
    placeholderRow: 'Your keyword phrase here'
  };

  rootEl.innerHTML = [
    '<div class="kwb">',
      '<div class="kwb-context">',
        '<label class="kwb-ctx-field">',
          '<span class="kwb-ctx-label">', escHtml(copy.headerCuisine), '</span>',
          '<input type="text" class="kwb-ctx kwb-ctx-cuisine" value="', escAttr(cuisine), '" placeholder="mexican / italian / american breakfast" />',
        '</label>',
        '<label class="kwb-ctx-field">',
          '<span class="kwb-ctx-label">', escHtml(copy.headerNeighborhood), '</span>',
          '<input type="text" class="kwb-ctx kwb-ctx-neighborhood" value="', escAttr(neighborhood), '" placeholder="silver spring" />',
        '</label>',
        '<button type="button" class="kwb-regen">↻ ', escHtml(copy.regenerate), '</button>',
      '</div>',
      '<ol class="kwb-rows">',
        values.map((v, i) => [
          '<li class="kwb-row">',
            '<span class="kwb-formula" id="kwbFormula-', i, '">', escHtml(labels[i]), '</span>',
            '<input type="text" class="kwb-input" data-i="', i, '" value="', escAttr(v), '"',
              ' placeholder="', escAttr(copy.placeholderRow), '"',
              ' aria-describedby="kwbFormula-', i, '" />',
          '</li>'
        ].join('')).join(''),
      '</ol>',
      '<p class="kwb-help">', escHtml(copy.help), '</p>',
      '<p class="kwb-live sr-only" role="status" aria-live="polite"></p>',
    '</div>'
  ].join('');

  const cuisineEl  = rootEl.querySelector('.kwb-ctx-cuisine');
  const neighEl    = rootEl.querySelector('.kwb-ctx-neighborhood');
  const regenBtn   = rootEl.querySelector('.kwb-regen');
  const inputs     = rootEl.querySelectorAll('.kwb-input');
  const liveEl     = rootEl.querySelector('.kwb-live');

  function commit() {
    if (deps && typeof deps.commit === 'function') {
      deps.commit({ localKeywords: serializeKeywords(values) });
    }
  }

  function refillFromSeed() {
    const fresh = buildSuggestions(cuisineEl.value, neighEl.value, locale);
    values = fresh.slice();
    inputs.forEach((el, i) => { el.value = values[i] || ''; });
    liveEl.textContent = copy.regenLive;
    commit();
  }

  cuisineEl.addEventListener('input', () => { cuisine = cuisineEl.value; });
  neighEl.addEventListener('input',   () => { neighborhood = neighEl.value; });
  regenBtn.addEventListener('click', refillFromSeed);

  inputs.forEach((el) => {
    el.addEventListener('input', () => {
      const i = parseInt(el.getAttribute('data-i'), 10);
      values[i] = el.value;
      commit();
    });
  });

  // First mount: ensure the seeded values land in MuntinContext if
  // nothing was there before. Skip if the operator already had values.
  if (!existing.length) commit();

  return {
    unmount: function () { rootEl.innerHTML = ''; }
  };
}

export function serialize(rootEl) {
  const out = [];
  rootEl.querySelectorAll('.kwb-input').forEach((el) => out.push(el.value));
  return { localKeywords: serializeKeywords(out) };
}
