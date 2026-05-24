/**
 * Workshop Kit widget: shot-list-grid
 *
 * Curated visual reference grid for L9a (Photo brief from scratch).
 *
 * Eight universal reference shots — each with a small SVG composition
 * sketch instead of a real food photo (the rail iframe + the no-fetch
 * posture rule out remote photo loads). When the operator has picked
 * a cuisine in L4/L5a/L6a, two cuisine-specific references append to
 * the universal eight. Tap any card to toggle it into the operator's
 * shotList. Selection order matters: the first three become the
 * "home-page set" the L14 generator reserves slots for.
 *
 * Writes shotList: [{ id, label, framing, source }] in selection order
 * to MuntinContext. Reads `restaurantProfile.cuisine` to drive the
 * cuisine-specific picks.
 *
 * Markup expected (no config block — references are baked in):
 *
 *   <section class="course-widget" data-widget="shot-list-grid"></section>
 *
 * Accessibility:
 *   - role="group" on the grid; each card is a <button> with
 *     aria-pressed reflecting selection state.
 *   - Selected state announced via polite live region: "Hero dish
 *     added to shot list — 1 of 3 home-page shots picked."
 *   - The home-page-3 indicator is also rendered as visible text, not
 *     just a colored ring, so it survives high-contrast modes.
 */

export const tag = 'shot-list-grid';
export const contextKeys = ['shotList'];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Composition sketches are inline SVG. Each is a 100x70 viewBox with a
// muted background, faint rule-of-thirds gridlines, and a filled
// focal area that hints at the shot's framing. All static — no JS
// drawing at runtime.
const FRAMES = {
  centerTop: '<rect x="0" y="0" width="100" height="70" fill="currentColor" opacity=".06"/><line x1="33" y1="0" x2="33" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="67" y1="0" x2="67" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="0" y1="23" x2="100" y2="23" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="0" y1="47" x2="100" y2="47" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><circle cx="50" cy="35" r="18" fill="currentColor" opacity=".55"/>',
  wide:      '<rect x="0" y="0" width="100" height="70" fill="currentColor" opacity=".06"/><line x1="33" y1="0" x2="33" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="67" y1="0" x2="67" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="0" y1="23" x2="100" y2="23" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="0" y1="47" x2="100" y2="47" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><rect x="8" y="42" width="84" height="22" fill="currentColor" opacity=".4"/>',
  thirdLeft: '<rect x="0" y="0" width="100" height="70" fill="currentColor" opacity=".06"/><line x1="33" y1="0" x2="33" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="67" y1="0" x2="67" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="0" y1="23" x2="100" y2="23" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="0" y1="47" x2="100" y2="47" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><circle cx="33" cy="35" r="14" fill="currentColor" opacity=".55"/><circle cx="33" cy="35" r="6" fill="currentColor" opacity=".7"/>',
  thirdRight:'<rect x="0" y="0" width="100" height="70" fill="currentColor" opacity=".06"/><line x1="33" y1="0" x2="33" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="67" y1="0" x2="67" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="0" y1="23" x2="100" y2="23" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="0" y1="47" x2="100" y2="47" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><circle cx="67" cy="35" r="14" fill="currentColor" opacity=".55"/>',
  vertical:  '<rect x="20" y="0" width="60" height="70" fill="currentColor" opacity=".06"/><line x1="40" y1="0" x2="40" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="60" y1="0" x2="60" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><rect x="32" y="22" width="36" height="34" fill="currentColor" opacity=".4"/>',
  macro:     '<rect x="0" y="0" width="100" height="70" fill="currentColor" opacity=".06"/><circle cx="50" cy="35" r="32" fill="currentColor" opacity=".4"/><circle cx="50" cy="35" r="14" fill="currentColor" opacity=".7"/>',
  flatlay:   '<rect x="0" y="0" width="100" height="70" fill="currentColor" opacity=".06"/><rect x="20" y="12" width="60" height="46" fill="currentColor" opacity=".35"/><circle cx="50" cy="35" r="9" fill="currentColor" opacity=".7"/><circle cx="32" cy="22" r="4" fill="currentColor" opacity=".7"/><circle cx="68" cy="22" r="4" fill="currentColor" opacity=".7"/><circle cx="32" cy="48" r="4" fill="currentColor" opacity=".7"/><circle cx="68" cy="48" r="4" fill="currentColor" opacity=".7"/>',
  portrait:  '<rect x="0" y="0" width="100" height="70" fill="currentColor" opacity=".06"/><line x1="33" y1="0" x2="33" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="67" y1="0" x2="67" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><circle cx="50" cy="26" r="11" fill="currentColor" opacity=".6"/><path d="M 30 70 Q 50 50 70 70 Z" fill="currentColor" opacity=".5"/>',
  action:    '<rect x="0" y="0" width="100" height="70" fill="currentColor" opacity=".06"/><line x1="33" y1="0" x2="33" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><line x1="67" y1="0" x2="67" y2="70" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 3"/><path d="M 10 50 Q 35 25 60 50 T 90 50" stroke="currentColor" stroke-width="3" fill="none" opacity=".6"/><circle cx="60" cy="40" r="6" fill="currentColor" opacity=".7"/>'
};

const UNIVERSAL = [
  { id: 'hero-dish',           framing: 'centerTop',  label_en: 'Hero dish, lit from above',            label_es: 'Plato emblemático, iluminado desde arriba', desc_en: 'Center-frame top-down. Your menu shortlist dish at dinner-service light.', desc_es: 'Vista cenital, centrado. Tu plato principal con la luz real de la cena.' },
  { id: 'room-wide',           framing: 'wide',       label_en: 'The room, wide and warm',              label_es: 'El lugar, abierto y cálido',                desc_en: 'Wide letterbox of FoH at dinner service. Sense of the space.', desc_es: 'Toma ancha del comedor en servicio. La sensación del lugar.' },
  { id: 'hands-cooking',       framing: 'action',     label_en: 'Hands at work in the kitchen',         label_es: 'Manos trabajando en la cocina',             desc_en: 'Process shot — shaping, slicing, plating. Hands in motion.', desc_es: 'Foto de proceso — moldeando, cortando, emplatando. Manos en movimiento.' },
  { id: 'exterior-evening',    framing: 'vertical',   label_en: 'The exterior at evening',              label_es: 'El exterior al anochecer',                  desc_en: 'Facade from the street with the lights on. Helps diners find you.', desc_es: 'La fachada desde la calle con las luces prendidas. Ayuda a encontrar el lugar.' },
  { id: 'close-up-texture',    framing: 'macro',      label_en: 'Close-up of a single texture',         label_es: 'Acercamiento a una sola textura',           desc_en: 'Tortillas blistering, cheese pulling, broth steaming. Sensory.', desc_es: 'Tortillas levantándose, queso jalándose, caldo humeando. Sensorial.' },
  { id: 'two-people',          framing: 'thirdRight', label_en: 'Two diners sharing a moment',          label_es: 'Dos comensales compartiendo un momento',    desc_en: 'Rule-of-thirds candid — real customers if possible. Avoid model-shot vibe.', desc_es: 'Rule-of-thirds candid — clientes reales si es posible. Evita onda de modelos.' },
  { id: 'signature-ingredient',framing: 'flatlay',    label_en: 'Signature ingredient, raw',            label_es: 'Ingrediente emblemático, crudo',            desc_en: 'Bag of beans, fish on ice, morning produce delivery. Provenance.', desc_es: 'Saco de frijoles, pescado sobre hielo, productos de la mañana. Procedencia.' },
  { id: 'chef-portrait',       framing: 'portrait',   label_en: 'The chef, looking at the camera',      label_es: 'El chef, mirando a la cámara',              desc_en: 'Only essential if the chef is the brand. Skip otherwise.', desc_es: 'Solo esencial si el chef es la marca. Sáltalo si no.' }
];

const CUISINE_EXTRA = {
  mexican:       [{ id: 'comal-tortillas',  framing: 'macro',  label_en: 'Tortillas on the comal',         label_es: 'Tortillas en el comal',         desc_en: 'Hand-shaped tortillas blistering on the griddle.', desc_es: 'Tortillas hechas a mano levantándose en el comal.' },
                  { id: 'salsa-flight',     framing: 'flatlay', label_en: 'Salsa flight',                    label_es: 'Tabla de salsas',                desc_en: 'Three salsas in molcajetes; warm chip basket at the edge.', desc_es: 'Tres salsas en molcajetes; canasta de totopos al borde.' }],
  italian:       [{ id: 'pasta-rolling',    framing: 'action', label_en: 'Pasta on the bench',              label_es: 'Pasta en la mesa',               desc_en: 'Hands rolling pasta in the morning prep light.', desc_es: 'Manos estirando pasta en la luz de la mañana.' },
                  { id: 'wine-pour',        framing: 'thirdLeft', label_en: 'Wine pour',                     label_es: 'Servir el vino',                  desc_en: 'Pouring red into a glass at table — half-full bottle.', desc_es: 'Sirviendo tinto en la copa a la mesa — botella a la mitad.' }],
  japanese:      [{ id: 'sushi-counter',    framing: 'wide',   label_en: 'Sushi counter',                   label_es: 'Barra de sushi',                 desc_en: 'Diners at the counter, chef across with knife in hand.', desc_es: 'Comensales en la barra, el chef enfrente con cuchillo en mano.' },
                  { id: 'plating-zen',      framing: 'centerTop', label_en: 'Plating — minimal',           label_es: 'Emplatado — minimal',             desc_en: 'Single piece on white plate, negative space.', desc_es: 'Una sola pieza sobre plato blanco, mucho espacio negativo.' }],
  chinese:       [{ id: 'wok-fire',         framing: 'action', label_en: 'Wok fire',                         label_es: 'Fuego del wok',                   desc_en: 'Flame leaping from the wok at peak service.', desc_es: 'Llama saltando del wok en pleno servicio.' },
                  { id: 'dim-sum-stack',    framing: 'flatlay', label_en: 'Dim sum stack',                  label_es: 'Pila de dim sum',                 desc_en: 'Bamboo steamers stacked on the table.', desc_es: 'Vaporeras de bambú apiladas en la mesa.' }],
  thai:          [{ id: 'curry-aromatics', framing: 'macro',   label_en: 'Curry aromatics',                  label_es: 'Aromáticos de curry',             desc_en: 'Lemongrass, galangal, chili paste on the cutting board.', desc_es: 'Hierba limón, galanga, pasta de chile en la tabla.' },
                  { id: 'thai-tea-pour',    framing: 'thirdLeft', label_en: 'Thai tea pour',                 label_es: 'Servir té tailandés',             desc_en: 'Orange tea poured from height; condensed milk swirl.', desc_es: 'Té naranja servido desde alto; remolino de leche condensada.' }],
  indian:        [{ id: 'tandoor-fire',     framing: 'macro',  label_en: 'Tandoor fire',                     label_es: 'Fuego del tandoor',               desc_en: 'Naan against the wall of the tandoor; orange glow.', desc_es: 'Naan contra la pared del tandoor; resplandor naranja.' },
                  { id: 'spice-grinding',   framing: 'flatlay', label_en: 'Spice grinding',                  label_es: 'Moliendo especias',               desc_en: 'Whole spices in small bowls; mortar and pestle.', desc_es: 'Especias enteras en cuencos; mortero y mano.' }],
  mediterranean: [{ id: 'bread-oil',        framing: 'centerTop', label_en: 'Bread + good olive oil',       label_es: 'Pan + buen aceite de oliva',      desc_en: 'Torn bread, oil pooled on the plate, flakes of salt.', desc_es: 'Pan partido, aceite acumulado en el plato, escamas de sal.' },
                  { id: 'mezze-spread',     framing: 'flatlay', label_en: 'Mezze spread',                   label_es: 'Tabla de mezze',                   desc_en: 'Small plates: hummus, baba ganoush, olives, dolma.', desc_es: 'Platos pequeños: hummus, baba ganoush, aceitunas, dolma.' }],
  american:      [{ id: 'griddle-burger',   framing: 'macro',  label_en: 'Griddle — burger smash',          label_es: 'Plancha — burger smash',           desc_en: 'Patty smashed onto the flat-top; cheese melting.', desc_es: 'Hamburguesa aplastada en la plancha; queso derritiéndose.' },
                  { id: 'counter-seats',    framing: 'wide',   label_en: 'Counter at lunch',                 label_es: 'Mostrador al mediodía',            desc_en: 'Counter stools with regulars; menu board behind.', desc_es: 'Banquillos del mostrador con habituales; pizarra de menú al fondo.' }],
  french:        [{ id: 'butchery-board',   framing: 'action', label_en: 'Butchery on the board',           label_es: 'Cortes en la tabla',               desc_en: 'Whole chicken being broken down; knife in motion.', desc_es: 'Pollo entero siendo despiezado; cuchillo en movimiento.' },
                  { id: 'mise-en-place',    framing: 'flatlay', label_en: 'Mise en place',                   label_es: 'Mise en place',                    desc_en: 'Prep bowls aligned; everything where it belongs.', desc_es: 'Cuencos de prep alineados; cada cosa en su lugar.' }],
  korean:        [{ id: 'banchan-spread',   framing: 'flatlay', label_en: 'Banchan spread',                  label_es: 'Banchan en la mesa',               desc_en: 'Six small plates of side dishes radiating from the center.', desc_es: 'Seis platos pequeños de acompañamientos saliendo del centro.' },
                  { id: 'bulgogi-grill',    framing: 'action', label_en: 'Bulgogi on the grill',            label_es: 'Bulgogi en la parrilla',           desc_en: 'Marinated beef on the tabletop grill; smoke rising.', desc_es: 'Res marinada en la parrilla de mesa; humo subiendo.' }],
  vietnamese:    [{ id: 'pho-pour',         framing: 'thirdLeft', label_en: 'Pho broth pour',              label_es: 'Servir el caldo de pho',          desc_en: 'Hot broth ladled over noodles + raw beef; steam rising.', desc_es: 'Caldo caliente sobre los fideos + res cruda; vapor subiendo.' },
                  { id: 'herb-platter',     framing: 'flatlay', label_en: 'Herb platter',                    label_es: 'Plato de hierbas',                 desc_en: 'Basil, mint, cilantro, bean sprouts, lime, chili.', desc_es: 'Albahaca, menta, cilantro, brotes, limón, chile.' }],
  ethiopian:     [{ id: 'injera-tear',      framing: 'macro',  label_en: 'Tearing the injera',              label_es: 'Partiendo el injera',              desc_en: 'Hands tearing injera to scoop the stews.', desc_es: 'Manos partiendo el injera para tomar los guisos.' },
                  { id: 'coffee-ceremony',  framing: 'centerTop', label_en: 'Coffee ceremony',              label_es: 'Ceremonia de café',                desc_en: 'Beans roasting on the brazier; jebena and small cups.', desc_es: 'Granos tostándose en el brasero; jebena y tacitas.' }]
};

function detectCuisineKey(cuisineStr) {
  if (!cuisineStr) return null;
  const c = String(cuisineStr).toLowerCase();
  const map = ['mexican','italian','japanese','chinese','thai','indian','mediterranean','american','french','korean','vietnamese','ethiopian'];
  for (const k of map) {
    if (c.indexOf(k) !== -1) return k;
  }
  return null;
}

function readAccent(state) {
  const p = state && state.palette;
  if (Array.isArray(p) && typeof p[0] === 'string' && /^#[0-9A-Fa-f]{6}$/.test(p[0])) return p[0].toUpperCase();
  return '#1F4E5B';
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const cuisineKey = detectCuisineKey(state && state.restaurantProfile && state.restaurantProfile.cuisine);

  const t = locale === 'es' ? {
    label: 'Selecciona las tomas de referencia',
    universalHeader: 'Esenciales para cualquier restaurante',
    cuisineHeader: function (cuisine) { return 'Específicas para ' + cuisine; },
    add: 'añadir',
    selected: 'seleccionada',
    homepageBadge: function (n) { return n + ' de 3 para inicio'; },
    selectedHeader: 'Tu shot list',
    emptyState: 'Selecciona arriba para construir tu shot list. Las tres primeras se reservan para la página de inicio.',
    overcapNote: 'Hasta 8 tomas — quita una para añadir otra.',
    announceAdd: function (label, n) { return label + ' añadida — ' + n + ' de 3 para inicio.'; },
    announceRemove: function (label) { return label + ' eliminada del shot list.'; },
    announceCap: 'Máximo de 8 tomas. Quita una primero.'
  } : {
    label: 'Pick reference shots',
    universalHeader: 'Essential for any restaurant',
    cuisineHeader: function (cuisine) { return 'Specific to ' + cuisine; },
    add: 'add',
    selected: 'selected',
    homepageBadge: function (n) { return n + ' of 3 for home page'; },
    selectedHeader: 'Your shot list',
    emptyState: 'Click cards above to build your shot list. The first three become the home-page set.',
    overcapNote: 'Up to 8 shots — remove one to add another.',
    announceAdd: function (label, n) { return label + ' added — ' + n + ' of 3 for the home page.'; },
    announceRemove: function (label) { return label + ' removed from shot list.'; },
    announceCap: 'Maximum of 8 shots. Remove one first.'
  };

  const cuisineHumanNames = {
    mexican: locale === 'es' ? 'cocina mexicana' : 'Mexican',
    italian: locale === 'es' ? 'cocina italiana' : 'Italian',
    japanese: locale === 'es' ? 'cocina japonesa' : 'Japanese',
    chinese: locale === 'es' ? 'cocina china' : 'Chinese',
    thai: locale === 'es' ? 'cocina tailandesa' : 'Thai',
    indian: locale === 'es' ? 'cocina india' : 'Indian',
    mediterranean: locale === 'es' ? 'mediterránea' : 'Mediterranean',
    american: locale === 'es' ? 'americana' : 'American',
    french: locale === 'es' ? 'cocina francesa' : 'French',
    korean: locale === 'es' ? 'cocina coreana' : 'Korean',
    vietnamese: locale === 'es' ? 'cocina vietnamita' : 'Vietnamese',
    ethiopian: locale === 'es' ? 'cocina etíope' : 'Ethiopian'
  };

  const CATALOG = UNIVERSAL.map((r) => Object.assign({ source: 'universal' }, r));
  if (cuisineKey && CUISINE_EXTRA[cuisineKey]) {
    CUISINE_EXTRA[cuisineKey].forEach((r) => { CATALOG.push(Object.assign({ source: 'cuisine', cuisineKey: cuisineKey }, r)); });
  }

  const accent = readAccent(state);
  const initial = Array.isArray(state && state.shotList) ? state.shotList.slice(0, 8) : [];

  function findRef(id) { return CATALOG.find((r) => r.id === id); }

  const cardHTML = (ref, idx, selectedIdx) => {
    const pressed = selectedIdx >= 0;
    const isHomepageSet = pressed && selectedIdx < 3;
    const label = locale === 'es' ? ref.label_es : ref.label_en;
    const desc  = locale === 'es' ? ref.desc_es  : ref.desc_en;
    return [
      '<button type="button" class="slg-card', pressed ? ' slg-card--selected' : '', '"',
        ' aria-pressed="', pressed ? 'true' : 'false', '"',
        ' data-id="', escAttr(ref.id), '"',
        '>',
        '<svg class="slg-frame" viewBox="0 0 100 70" aria-hidden="true" style="color:', escAttr(accent), '">', FRAMES[ref.framing] || FRAMES.centerTop, '</svg>',
        '<div class="slg-card-body">',
          '<div class="slg-card-label">', escHtml(label), '</div>',
          '<div class="slg-card-desc">', escHtml(desc), '</div>',
          pressed
            ? ('<div class="slg-card-state">' +
                 (isHomepageSet
                   ? '<span class="slg-badge slg-badge--home">' + escHtml(t.homepageBadge(selectedIdx + 1)) + '</span>'
                   : '<span class="slg-badge">#' + (selectedIdx + 1) + '</span>'
                 ) +
               '</div>')
            : ('<div class="slg-card-state slg-card-state--idle">' + escHtml(t.add) + '</div>'),
        '</div>',
      '</button>'
    ].join('');
  };

  function render() {
    const selectedIds = initial.map((r) => r.id);
    function selectedIdx(id) { return selectedIds.indexOf(id); }

    const universalCards = CATALOG.filter((r) => r.source === 'universal').map((ref) => cardHTML(ref, 0, selectedIdx(ref.id))).join('');
    const cuisineCards = cuisineKey
      ? CATALOG.filter((r) => r.source === 'cuisine').map((ref) => cardHTML(ref, 0, selectedIdx(ref.id))).join('')
      : '';

    const selectedRows = initial.length
      ? initial.map((r, i) => {
          const ref = findRef(r.id);
          const label = ref ? (locale === 'es' ? ref.label_es : ref.label_en) : (r.label || r.id);
          return [
            '<li class="slg-sel-row">',
              '<span class="slg-sel-rank">', (i + 1), '</span>',
              '<span class="slg-sel-label">', escHtml(label), '</span>',
              i < 3 ? '<span class="slg-sel-badge slg-sel-badge--home">home</span>' : '',
              '<button type="button" class="slg-sel-remove" data-id="', escAttr(r.id), '" aria-label="', escAttr(t.announceRemove(label)), '">×</button>',
            '</li>'
          ].join('');
        }).join('')
      : ('<li class="slg-sel-empty">' + escHtml(t.emptyState) + '</li>');

    rootEl.innerHTML = [
      '<div class="slg">',
        '<h3 class="slg-label">', escHtml(t.label), '</h3>',
        '<p class="slg-section-head">', escHtml(t.universalHeader), '</p>',
        '<div class="slg-grid" role="group" aria-label="', escAttr(t.universalHeader), '">', universalCards, '</div>',
        cuisineKey
          ? ('<p class="slg-section-head">' + escHtml(t.cuisineHeader(cuisineHumanNames[cuisineKey] || cuisineKey)) + '</p>' +
             '<div class="slg-grid" role="group" aria-label="' + escAttr(t.cuisineHeader(cuisineHumanNames[cuisineKey] || cuisineKey)) + '">' + cuisineCards + '</div>')
          : '',
        '<div class="slg-selected">',
          '<p class="slg-section-head">', escHtml(t.selectedHeader), '</p>',
          '<ol class="slg-sel-list">', selectedRows, '</ol>',
          initial.length >= 8 ? ('<p class="slg-help">' + escHtml(t.overcapNote) + '</p>') : '',
        '</div>',
        '<p class="slg-live sr-only" role="status" aria-live="polite"></p>',
      '</div>'
    ].join('');

    rootEl.querySelectorAll('.slg-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        toggle(id);
      });
    });
    rootEl.querySelectorAll('.slg-sel-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        toggle(id, true);
      });
    });
  }

  function toggle(id, forceRemove) {
    const ref = findRef(id);
    if (!ref) return;
    const idx = initial.findIndex((r) => r.id === id);
    const label = locale === 'es' ? ref.label_es : ref.label_en;

    if (idx >= 0 || forceRemove) {
      if (idx >= 0) initial.splice(idx, 1);
      commit();
      render();
      const live = rootEl.querySelector('.slg-live');
      if (live) live.textContent = t.announceRemove(label);
      return;
    }

    if (initial.length >= 8) {
      const live = rootEl.querySelector('.slg-live');
      if (live) live.textContent = t.announceCap;
      return;
    }
    initial.push({ id: ref.id, label: label, framing: ref.framing, source: ref.source });
    commit();
    render();
    const live = rootEl.querySelector('.slg-live');
    if (live) {
      const homeCount = Math.min(initial.length, 3);
      live.textContent = t.announceAdd(label, homeCount);
    }
  }

  function commit() {
    if (deps && typeof deps.commit === 'function') {
      deps.commit({ shotList: initial.slice() });
    }
  }

  render();

  return {
    unmount: function () { rootEl.innerHTML = ''; }
  };
}

export function serialize(rootEl) {
  const buttons = Array.from(rootEl.querySelectorAll('.slg-sel-row'));
  const list = buttons.map((row) => {
    const removeBtn = row.querySelector('.slg-sel-remove');
    const id = removeBtn ? removeBtn.getAttribute('data-id') : null;
    const label = (row.querySelector('.slg-sel-label') || { textContent: '' }).textContent;
    return id ? { id: id, label: label } : null;
  }).filter(Boolean);
  return { shotList: list };
}
