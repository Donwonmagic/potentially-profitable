/**
 * Workshop Kit widget: text-input
 *
 * Parameterized prose-capture widget. The lesson author picks the field
 * to write to via data-context-key. Used by L1 (name / cuisine / address),
 * L3 (one-promise paragraph), L4 (customer paragraph + neighborhood),
 * and any future lesson that needs to capture short or medium-form text
 * and have it surface in the rail.
 *
 * Markup expected:
 *
 *   <section class="course-widget"
 *            data-widget="text-input"
 *            data-context-key="restaurantProfile.name"
 *            data-label="Restaurant name"
 *            data-label-es="Nombre del restaurante"
 *            data-placeholder="Joe's Taqueria"
 *            data-placeholder-es="Taquería La Bendición"
 *            data-help="The name as it appears on your sign."
 *            data-help-es="El nombre tal como aparece en tu letrero."
 *            data-max="80"
 *            data-multiline="false"></section>
 *
 * Supported context keys (per the engine allowlist):
 *   restaurantProfile.*  — name, cuisine, address, phone, priceTier
 *   onePromise           — single-line value proposition
 *   customerParagraph    — multi-sentence persona description
 *   neighborhoodAnchor   — one-phrase neighborhood reference
 *
 * The widget autosaves on input with 250 ms debounce (the engine's own
 * commit debounce stacks on top), writes through MuntinContext via
 * deps.commit, and surfaces a polite live region announcement when the
 * save lands. No fetches. No account.
 */

export const tag = 'text-input';
export const contextKeys = [
  'restaurantProfile',
  'onePromise',
  'customerParagraph',
  'neighborhoodAnchor'
];

function readNested(obj, dottedKey) {
  if (!obj || !dottedKey) return undefined;
  var parts = dottedKey.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur == null) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}

function buildNested(dottedKey, value) {
  var parts = dottedKey.split('.');
  if (parts.length === 1) {
    var o = {};
    o[parts[0]] = value;
    return o;
  }
  var root = {};
  var cur = root;
  for (var i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return root;
}

function localize(rootEl, attr, locale, fallback) {
  if (locale === 'es') {
    var es = rootEl.getAttribute('data-' + attr + '-es');
    if (es) return es;
  }
  return rootEl.getAttribute('data-' + attr) || fallback || '';
}

export function mount(rootEl, state, deps) {
  var locale = (deps && deps.locale) || 'en';
  var contextKey = rootEl.getAttribute('data-context-key') || '';
  var label       = localize(rootEl, 'label', locale, contextKey);
  var help        = localize(rootEl, 'help', locale, '');
  var placeholder = localize(rootEl, 'placeholder', locale, '');
  var maxAttr     = rootEl.getAttribute('data-max');
  var max         = maxAttr ? parseInt(maxAttr, 10) : 0;
  var multiline   = rootEl.getAttribute('data-multiline') === 'true';
  var inputId     = 'ti-' + Math.random().toString(36).slice(2, 8);
  var helpId      = inputId + '-help';

  var phrases = locale === 'es'
    ? { savedNow: 'Guardado en este navegador',
        chars: 'caracteres' }
    : { savedNow: 'Saved in this browser',
        chars: 'characters' };

  function escAttr(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  var currentValue = readNested(state, contextKey) || '';

  var control = multiline
    ? '<textarea id="' + inputId + '" class="ti-input ti-input--multi" rows="4"'
        + (max ? ' maxlength="' + max + '"' : '')
        + ' placeholder="' + escAttr(placeholder) + '"'
        + (help ? ' aria-describedby="' + helpId + '"' : '')
        + '>' + escHtml(currentValue) + '</textarea>'
    : '<input id="' + inputId + '" type="text" class="ti-input" autocomplete="off"'
        + (max ? ' maxlength="' + max + '"' : '')
        + ' placeholder="' + escAttr(placeholder) + '"'
        + ' value="' + escAttr(currentValue) + '"'
        + (help ? ' aria-describedby="' + helpId + '"' : '')
        + '/>';

  rootEl.innerHTML = [
    '<div class="ti">',
      '<label for="', inputId, '" class="ti-label">', escHtml(label), '</label>',
      help ? '<p id="' + helpId + '" class="ti-help">' + escHtml(help) + '</p>' : '',
      control,
      '<div class="ti-meta">',
        max ? '<span class="ti-count" aria-live="off"><span class="ti-count-now">' + currentValue.length + '</span>/<span class="ti-count-max">' + max + '</span> ' + escHtml(phrases.chars) + '</span>' : '<span></span>',
        '<span class="ti-status" role="status" aria-live="polite"></span>',
      '</div>',
    '</div>'
  ].join('');

  var input = rootEl.querySelector('.ti-input');
  var status = rootEl.querySelector('.ti-status');
  var countNow = rootEl.querySelector('.ti-count-now');

  var commitTimer = null;
  function scheduleCommit() {
    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(function () {
      var v = input.value;
      var patch = buildNested(contextKey, v);
      deps.commit(patch);
      status.textContent = phrases.savedNow;
      // Clear the status after a short while so the live region
      // doesn't keep nagging the screen-reader user.
      setTimeout(function () { status.textContent = ''; }, 1800);
    }, 250);
  }

  input.addEventListener('input', function () {
    if (countNow) countNow.textContent = input.value.length;
    scheduleCommit();
  });
  input.addEventListener('change', scheduleCommit);

  return {
    unmount: function () {
      if (commitTimer) clearTimeout(commitTimer);
      rootEl.innerHTML = '';
    },
    refresh: function (nextState) {
      var v = readNested(nextState, contextKey) || '';
      if (v !== input.value && document.activeElement !== input) {
        input.value = v;
        if (countNow) countNow.textContent = v.length;
      }
    },
    getValue: function () { return input.value; }
  };
}

export function serialize(rootEl) {
  var contextKey = rootEl.getAttribute('data-context-key') || '';
  var input = rootEl.querySelector('.ti-input');
  if (!input || !contextKey) return {};
  return buildNested(contextKey, input.value);
}

export function validate(state) {
  // Lesson author can refine this per instance via data-validation
  // attributes in a future revision. For now, presence-only.
  return { ok: true };
}
