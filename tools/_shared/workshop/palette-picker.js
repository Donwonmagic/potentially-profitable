/**
 * Workshop Kit widget: palette-picker
 *
 * Three-swatch palette picker — accent, background (cream), ink — with
 * curated starting palettes by cuisine and a live WCAG contrast guard.
 * Writes the chosen colors into MuntinContext.palette so the live-
 * preview-frame (and ultimately the generator) repaint immediately.
 *
 * Used by: L7 "Palette + voice" (and any future lesson revisiting brand).
 *
 * Markup expected:
 *
 *   <section class="course-widget" data-widget="palette-picker"></section>
 *
 * The widget reads MuntinContext.restaurantProfile.cuisine (if present)
 * to suggest a starting palette appropriate to that cuisine. The
 * operator can pick a suggested palette, edit any swatch individually,
 * or reset to defaults. Every change commits via deps.commit({palette}).
 *
 * Accessibility:
 *   - Each swatch has a visible mini-label PLUS an aria-label for AT.
 *   - The current contrast ratio is announced via a polite live region.
 *   - When contrast drops below WCAG AA (4.5:1), a perceivable warning
 *     surfaces both visually and to AT.
 *   - prefers-reduced-motion is honored — no swatch animation, no
 *     transitions when set.
 *
 * Privacy / posture: no fetches, no account. Colors live in
 * MuntinContext.palette[] in this browser only.
 */

import { contrastRatio } from '/course/m4-launch/generator/templates/page-home.template.js';

export const tag = 'palette-picker';
export const contextKeys = ['palette', 'restaurantProfile'];

const DEFAULT = ['#1F4E5B', '#FAF7F2', '#14161A'];

// Curated cuisine -> palette starting points. The middle color is
// always a cream/background; the first is the accent; the third is
// the ink. All combinations clear WCAG AA contrast at body sizes.
const SUGGESTIONS = {
  Mexican:       { en: 'Warm clay', es: 'Barro cálido',     palette: ['#B8541A', '#FAF3E6', '#2A1A0F'] },
  Mexicana:      { en: 'Warm clay', es: 'Barro cálido',     palette: ['#B8541A', '#FAF3E6', '#2A1A0F'] },
  Italian:       { en: 'Olive grove', es: 'Olivar',         palette: ['#4A6B2A', '#F5F1E6', '#1F1A14'] },
  Italiana:      { en: 'Olive grove', es: 'Olivar',         palette: ['#4A6B2A', '#F5F1E6', '#1F1A14'] },
  Vietnamese:    { en: 'River jade', es: 'Jade del río',    palette: ['#1F6B6B', '#F4F5EE', '#0F1F1F'] },
  Vietnamita:    { en: 'River jade', es: 'Jade del río',    palette: ['#1F6B6B', '#F4F5EE', '#0F1F1F'] },
  Japanese:      { en: 'Ink and rice', es: 'Tinta y arroz', palette: ['#3A3A3A', '#FAFAF5', '#0A0A0A'] },
  Japonesa:      { en: 'Ink and rice', es: 'Tinta y arroz', palette: ['#3A3A3A', '#FAFAF5', '#0A0A0A'] },
  American:      { en: 'Brick + cream', es: 'Ladrillo y crema', palette: ['#9A2A2A', '#FBF5EC', '#1A1010'] },
  Estadounidense:{ en: 'Brick + cream', es: 'Ladrillo y crema', palette: ['#9A2A2A', '#FBF5EC', '#1A1010'] },
  Mediterranean: { en: 'Coast blue', es: 'Azul costero',    palette: ['#1F5A7A', '#FAF7EE', '#101822'] },
  Mediterránea:  { en: 'Coast blue', es: 'Azul costero',    palette: ['#1F5A7A', '#FAF7EE', '#101822'] },
  Indian:        { en: 'Marigold', es: 'Cempasúchil',       palette: ['#C66A1A', '#FBF1E0', '#221206'] },
  India:         { en: 'Marigold', es: 'Cempasúchil',       palette: ['#C66A1A', '#FBF1E0', '#221206'] },
  Thai:          { en: 'Lemongrass', es: 'Hierba limón',    palette: ['#4F7A2A', '#F8F6E8', '#1A2010'] },
  Tailandesa:    { en: 'Lemongrass', es: 'Hierba limón',    palette: ['#4F7A2A', '#F8F6E8', '#1A2010'] },
  French:        { en: 'Wine cellar', es: 'Bodega de vino', palette: ['#5A1F2A', '#F6F0E8', '#1A0F12'] },
  Francesa:      { en: 'Wine cellar', es: 'Bodega de vino', palette: ['#5A1F2A', '#F6F0E8', '#1A0F12'] },
  BBQ:           { en: 'Smoke + amber', es: 'Humo y ámbar', palette: ['#A04A1A', '#FAF3E6', '#1F1108'] }
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function safeHex(v, fallback) {
  return (typeof v === 'string' && HEX_RE.test(v)) ? v.toUpperCase() : fallback;
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const profile = (state && state.restaurantProfile) || {};
  const cuisine = profile.cuisine || '';

  const phrases = locale === 'es'
    ? { hAccent: 'Acento', hCream: 'Fondo (crema)', hInk: 'Tinta', suggestionsLabel: 'Paletas sugeridas',
        contrastOk: 'Contraste {ratio}:1 — legible.',
        contrastWarn: 'Contraste {ratio}:1 — bajo. Los clientes con vista baja tendrán dificultad.',
        contrastBad: 'Contraste {ratio}:1 — muy bajo. El texto será ilegible.',
        savedNow: 'Paleta guardada en este navegador',
        suggestionFor: 'Sugerido para cocina {cuisine}:',
        suggestionGeneric: 'Empezar con una paleta sugerida:',
        reset: 'Restablecer paleta',
        accentDesc: 'El color de tus botones y acentos',
        creamDesc: 'El fondo de tu sitio',
        inkDesc: 'El texto principal' }
    : { hAccent: 'Accent', hCream: 'Background (cream)', hInk: 'Ink', suggestionsLabel: 'Suggested palettes',
        contrastOk: 'Contrast {ratio}:1 — readable.',
        contrastWarn: 'Contrast {ratio}:1 — low. Low-vision diners will struggle.',
        contrastBad: 'Contrast {ratio}:1 — very low. The text will be unreadable.',
        savedNow: 'Palette saved in this browser',
        suggestionFor: 'Suggested for {cuisine} cuisine:',
        suggestionGeneric: 'Start with a suggested palette:',
        reset: 'Reset palette',
        accentDesc: 'Your button and accent color',
        creamDesc: 'Your site background',
        inkDesc: 'Your main text color' };

  const current = Array.isArray(state && state.palette) && state.palette.length >= 3
    ? [safeHex(state.palette[0], DEFAULT[0]), safeHex(state.palette[1], DEFAULT[1]), safeHex(state.palette[2], DEFAULT[2])]
    : DEFAULT.slice();

  // Build the suggestions list — the cuisine-specific suggestion first
  // (if any), then 3 generic ones the operator can compare.
  const suggestionsList = [];
  const cuisineSugg = cuisine && SUGGESTIONS[cuisine];
  if (cuisineSugg) suggestionsList.push({ ...cuisineSugg, source: 'cuisine' });
  ['Italian', 'Vietnamese', 'Japanese'].forEach(function (k) {
    if (!cuisineSugg || k.toLowerCase() !== cuisine.toLowerCase()) {
      suggestionsList.push({ ...SUGGESTIONS[k], source: 'generic' });
    }
  });

  const suggestionHtml = suggestionsList.slice(0, 4).map(function (s) {
    const label = s[locale] || s.en;
    return [
      '<button type="button" class="pp-sugg" data-palette="' + s.palette.join(',') + '">',
        '<span class="pp-sugg-swatches" aria-hidden="true">',
          '<span style="background:' + s.palette[0] + '"></span>',
          '<span style="background:' + s.palette[1] + '"></span>',
          '<span style="background:' + s.palette[2] + '"></span>',
        '</span>',
        '<span class="pp-sugg-label">' + escHtml(label) + '</span>',
      '</button>'
    ].join('');
  }).join('');

  const suggestionsHeading = cuisineSugg && cuisine
    ? phrases.suggestionFor.replace('{cuisine}', escHtml(cuisine))
    : phrases.suggestionGeneric;

  rootEl.innerHTML = [
    '<div class="pp">',
      '<fieldset class="pp-swatches">',
        '<legend class="sr-only">' + escHtml(phrases.hAccent) + ', ' + escHtml(phrases.hCream) + ', ' + escHtml(phrases.hInk) + '</legend>',
        '<div class="pp-swatch">',
          '<label class="pp-swatch-label" for="pp-accent">' + escHtml(phrases.hAccent) + '</label>',
          '<input id="pp-accent" type="color" class="pp-color" data-pos="0" value="' + current[0] + '" aria-describedby="pp-accent-desc"/>',
          '<p id="pp-accent-desc" class="pp-swatch-desc">' + escHtml(phrases.accentDesc) + '</p>',
          '<output class="pp-swatch-hex" for="pp-accent">' + current[0] + '</output>',
        '</div>',
        '<div class="pp-swatch">',
          '<label class="pp-swatch-label" for="pp-cream">' + escHtml(phrases.hCream) + '</label>',
          '<input id="pp-cream" type="color" class="pp-color" data-pos="1" value="' + current[1] + '" aria-describedby="pp-cream-desc"/>',
          '<p id="pp-cream-desc" class="pp-swatch-desc">' + escHtml(phrases.creamDesc) + '</p>',
          '<output class="pp-swatch-hex" for="pp-cream">' + current[1] + '</output>',
        '</div>',
        '<div class="pp-swatch">',
          '<label class="pp-swatch-label" for="pp-ink">' + escHtml(phrases.hInk) + '</label>',
          '<input id="pp-ink" type="color" class="pp-color" data-pos="2" value="' + current[2] + '" aria-describedby="pp-ink-desc"/>',
          '<p id="pp-ink-desc" class="pp-swatch-desc">' + escHtml(phrases.inkDesc) + '</p>',
          '<output class="pp-swatch-hex" for="pp-ink">' + current[2] + '</output>',
        '</div>',
      '</fieldset>',
      '<p class="pp-contrast" role="status" aria-live="polite"></p>',
      '<section class="pp-suggestions" aria-labelledby="pp-sugg-h">',
        '<p id="pp-sugg-h" class="pp-sugg-h">' + suggestionsHeading + '</p>',
        '<div class="pp-sugg-grid">' + suggestionHtml + '</div>',
      '</section>',
      '<div class="pp-actions">',
        '<button type="button" class="pp-reset">' + escHtml(phrases.reset) + '</button>',
        '<span class="pp-status" role="status" aria-live="polite"></span>',
      '</div>',
    '</div>'
  ].join('');

  const colorInputs = rootEl.querySelectorAll('.pp-color');
  const hexOutputs  = rootEl.querySelectorAll('.pp-swatch-hex');
  const contrastEl  = rootEl.querySelector('.pp-contrast');
  const statusEl    = rootEl.querySelector('.pp-status');
  const suggButtons = rootEl.querySelectorAll('.pp-sugg');
  const resetButton = rootEl.querySelector('.pp-reset');

  function readPalette() {
    return [
      safeHex(colorInputs[0].value, DEFAULT[0]),
      safeHex(colorInputs[1].value, DEFAULT[1]),
      safeHex(colorInputs[2].value, DEFAULT[2])
    ];
  }

  function paintContrast(p) {
    const r = contrastRatio(p[0], p[1]);
    const rounded = r.toFixed(1);
    let phrase;
    let severity;
    if (r < 3.0)       { phrase = phrases.contrastBad;  severity = 'critical'; }
    else if (r < 4.5)  { phrase = phrases.contrastWarn; severity = 'warning'; }
    else               { phrase = phrases.contrastOk;   severity = 'ok'; }
    contrastEl.textContent = phrase.replace('{ratio}', rounded);
    contrastEl.setAttribute('data-severity', severity);
  }

  function commit(p) {
    deps.commit({ palette: p });
    statusEl.textContent = phrases.savedNow;
    setTimeout(function () { statusEl.textContent = ''; }, 1800);
  }

  function applyPalette(p, source) {
    for (let i = 0; i < 3; i++) {
      colorInputs[i].value = p[i];
      hexOutputs[i].textContent = p[i];
    }
    paintContrast(p);
    commit(p);
  }

  // Wire individual swatch edits.
  colorInputs.forEach(function (input, i) {
    input.addEventListener('input', function () {
      hexOutputs[i].textContent = safeHex(input.value, DEFAULT[i]);
      const p = readPalette();
      paintContrast(p);
      commit(p);
    });
  });

  // Wire suggestion buttons.
  suggButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const raw = btn.getAttribute('data-palette') || '';
      const parts = raw.split(',');
      if (parts.length !== 3 || !parts.every(function (h) { return HEX_RE.test(h); })) return;
      applyPalette(parts.map(function (h) { return h.toUpperCase(); }), 'suggestion');
    });
  });

  resetButton.addEventListener('click', function () {
    applyPalette(DEFAULT.slice(), 'reset');
  });

  // First paint of the contrast announcement.
  paintContrast(current);

  return {
    unmount: function () { rootEl.innerHTML = ''; },
    refresh: function (nextState) {
      // Only refresh when the change came from outside this widget
      // (e.g. another tab edited the palette).
      const focused = rootEl.contains(document.activeElement);
      if (focused) return;
      const next = Array.isArray(nextState && nextState.palette) && nextState.palette.length >= 3
        ? nextState.palette.map(function (h, i) { return safeHex(h, DEFAULT[i]); })
        : DEFAULT.slice();
      for (let i = 0; i < 3; i++) {
        if (colorInputs[i].value.toUpperCase() !== next[i]) {
          colorInputs[i].value = next[i];
          hexOutputs[i].textContent = next[i];
        }
      }
      paintContrast(next);
    }
  };
}

export function serialize(rootEl) {
  const inputs = rootEl.querySelectorAll('.pp-color');
  if (inputs.length !== 3) return {};
  return {
    palette: [
      safeHex(inputs[0].value, DEFAULT[0]),
      safeHex(inputs[1].value, DEFAULT[1]),
      safeHex(inputs[2].value, DEFAULT[2])
    ]
  };
}
