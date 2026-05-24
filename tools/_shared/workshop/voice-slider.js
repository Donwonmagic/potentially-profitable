/**
 * Workshop Kit widget: voice-slider
 *
 * Three sliders capturing the operator's brand voice on three axes:
 *   - formality (formal ↔ casual)
 *   - era       (classic ↔ modern)
 *   - warmth    (terse ↔ warm)
 *
 * Below each slider, a sample sentence shows what voice at that
 * position SOUNDS like — pre-authored extremes for each axis, picked
 * from the inline config. The operator drags toward the version that
 * matches how their restaurant should speak.
 *
 * Writes voice: { formality, era, warmth } to MuntinContext as
 * integers 0..100. Used by L7 (palette + voice) alongside
 * palette-picker. The L14 generator + future Method-built products
 * can read voice and use it to retype CTAs, voicemail scripts, and
 * review-response templates.
 *
 * Markup expected:
 *
 *   <section class="course-widget" data-widget="voice-slider">
 *     <script type="application/json" class="voice-slider-config">
 *       {
 *         "samples": {
 *           "formality": {
 *             "low":  "We are honored to confirm your reservation.",
 *             "high": "Got you down for 6 — see you Saturday.",
 *             "low-es":  "Le confirmamos su reservación.",
 *             "high-es": "Te apunto para 6 — nos vemos el sábado."
 *           },
 *           "era": { "low": "Est. 1962. A neighborhood landmark.", "high": "Pop-up Tuesdays. New menu Fridays.", "low-es": "…", "high-es": "…" },
 *           "warmth": { "low": "Open 11–9. Closed Mondays.", "high": "Come hungry — we'll feed you.", "low-es": "…", "high-es": "…" }
 *         }
 *       }
 *     </script>
 *   </section>
 *
 * Inline config is required: this widget doesn't ship default sample
 * copy because the right examples depend on the lesson's framing.
 * Lesson author writes one extreme per axis × locale.
 *
 * Accessibility:
 *   - <input type="range"> per axis, with min=0/max=100/value=current,
 *     aria-labelledby pointing at the axis label.
 *   - Sample sentences below each slider update on input; an aria-live
 *     polite region announces "Voice formality: 80% casual — Got you
 *     down for 6 — see you Saturday."
 *   - Visible labels on both ends of each track so the slider's
 *     direction is obvious without dragging.
 */

export const tag = 'voice-slider';
export const contextKeys = ['voice'];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const AXES = [
  { id: 'formality', low: 'Formal',  high: 'Casual', 'low-es': 'Formal',   'high-es': 'Casual' },
  { id: 'era',       low: 'Classic', high: 'Modern', 'low-es': 'Clásico',  'high-es': 'Moderno' },
  { id: 'warmth',    low: 'Terse',   high: 'Warm',   'low-es': 'Conciso',  'high-es': 'Cálido' }
];

function pickLocaleField(obj, field, locale) {
  if (!obj) return '';
  return (locale === 'es' && obj[field + '-es']) ? obj[field + '-es'] : (obj[field] || '');
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const cfgScript = rootEl.querySelector('script.voice-slider-config[type="application/json"]');
  let cfg = { samples: {} };
  if (cfgScript) {
    try { cfg = JSON.parse(cfgScript.textContent); }
    catch (e) {
      console.warn('[workshop:voice-slider] invalid JSON', e);
      rootEl.innerHTML = '<p class="workshop-error">Voice samples failed to load.</p>';
      return { unmount: function () { rootEl.innerHTML = ''; } };
    }
  }

  const initial = (state && state.voice) || {};
  const values = {
    formality: Math.max(0, Math.min(100, Number.isFinite(initial.formality) ? initial.formality : 50)),
    era:       Math.max(0, Math.min(100, Number.isFinite(initial.era)       ? initial.era       : 50)),
    warmth:    Math.max(0, Math.min(100, Number.isFinite(initial.warmth)    ? initial.warmth    : 50))
  };

  const ariaLive = locale === 'es' ? 'Voz {axis}: {n}% — {sample}' : 'Voice {axis}: {n}% — {sample}';

  rootEl.innerHTML = [
    '<div class="vs">',
      AXES.map((axis) => {
        const lowLabel  = pickLocaleField(axis, 'low', locale);
        const highLabel = pickLocaleField(axis, 'high', locale);
        const sample = cfg.samples && cfg.samples[axis.id] ? cfg.samples[axis.id] : null;
        return [
          '<div class="vs-axis" data-axis="', axis.id, '">',
            '<label class="vs-axis-label" id="vsLabel-', axis.id, '">',
              escHtml(axis.id.charAt(0).toUpperCase() + axis.id.slice(1)),
              ': <span class="vs-tick vs-tick--low">', escHtml(lowLabel), '</span>',
              ' ↔ <span class="vs-tick vs-tick--high">', escHtml(highLabel), '</span>',
            '</label>',
            '<input type="range" class="vs-range" data-axis="', axis.id, '"',
              ' min="0" max="100" value="', String(values[axis.id]), '"',
              ' aria-labelledby="vsLabel-', axis.id, '" />',
            '<p class="vs-sample" data-axis="', axis.id, '">',
              sample ? escHtml(pickLocaleField(sample, values[axis.id] >= 50 ? 'high' : 'low', locale)) : '',
            '</p>',
          '</div>'
        ].join('');
      }).join(''),
      '<p class="vs-live sr-only" role="status" aria-live="polite"></p>',
    '</div>'
  ].join('');

  const liveEl = rootEl.querySelector('.vs-live');
  const ranges = rootEl.querySelectorAll('.vs-range');

  function updateSample(axisId, value) {
    const sample = cfg.samples && cfg.samples[axisId] ? cfg.samples[axisId] : null;
    if (!sample) return;
    const sentence = pickLocaleField(sample, value >= 50 ? 'high' : 'low', locale);
    const sampleEl = rootEl.querySelector('.vs-sample[data-axis="' + axisId + '"]');
    if (sampleEl) sampleEl.textContent = sentence;

    // Polite announcement — debounced naturally because the input
    // event fires per-drag-tick; reading the latest text is fine.
    const axisLabel = locale === 'es'
      ? ({ formality: 'formalidad', era: 'época', warmth: 'calidez' })[axisId]
      : axisId;
    liveEl.textContent = ariaLive
      .replace('{axis}', axisLabel)
      .replace('{n}', String(value))
      .replace('{sample}', sentence);
  }

  ranges.forEach((range) => {
    range.addEventListener('input', function () {
      const axisId = range.getAttribute('data-axis');
      const value = parseInt(range.value, 10) || 0;
      values[axisId] = value;
      updateSample(axisId, value);
      if (deps && typeof deps.commit === 'function') {
        deps.commit({ voice: { formality: values.formality, era: values.era, warmth: values.warmth } });
      }
    });
  });

  return {
    unmount: function () {
      rootEl.innerHTML = '';
    }
  };
}

export function serialize(rootEl) {
  const v = {};
  rootEl.querySelectorAll('.vs-range').forEach((range) => {
    v[range.getAttribute('data-axis')] = parseInt(range.value, 10) || 0;
  });
  return { voice: v };
}
