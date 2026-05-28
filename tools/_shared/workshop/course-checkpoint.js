/**
 * Workshop Kit widget: course-checkpoint
 *
 * Mid-lesson retrieval-practice prompt. Single multiple-choice
 * question (3-5 options) with immediate feedback per option. Not
 * graded; not gating. The point is forcing the operator to PAUSE
 * and think about a key claim from the lesson — closing the gap
 * between reading-fluently and learning.
 *
 * Reads + writes nothing to MuntinContext (no commit). The widget's
 * job is the retrieval moment itself; the operator's response is
 * theirs to keep. Local session-storage records which checkpoints
 * have been "interacted with" so the widget shows a subtle "you
 * answered this one" state on reload without revealing which option
 * was picked.
 *
 * Markup expected (inline config required — lesson author writes the
 * question + options + feedback):
 *
 *   <section class="course-widget" data-widget="course-checkpoint">
 *     <script type="application/json" class="course-checkpoint-config">
 *       {
 *         "question": "Diners decide on the second photo, not the tenth. What does that imply for your shot priority?",
 *         "question-es": "...",
 *         "options": [
 *           { "text": "Shoot more photos so I have lots to choose from", "text-es": "...", "feedback": "Photo count isn't the lever — placement is. The second photo is the one that matters; the tenth is filler.", "feedback-es": "..." },
 *           { "text": "Spend more time on the first 3 shots, less on the rest", "text-es": "...", "feedback": "Yes. The first three shots carry ~80% of the diner's impression. Optimize those.", "feedback-es": "..." },
 *           { "text": "Skip photos entirely and rely on the menu page", "text-es": "...", "feedback": "Photos drive trust at a level menu copy can't. They're not optional; just prioritize the top 3.", "feedback-es": "..." }
 *         ]
 *       }
 *     </script>
 *   </section>
 *
 * Accessibility:
 *   - role="radiogroup" with aria-labelledby pointing at the question
 *   - Each option is a real <button> (not <input type="radio"> because
 *     we want immediate feedback inline, not a separate submit step)
 *   - Polite live region announces the feedback after click
 *   - Keyboard: Tab to enter the group; Arrow keys move between
 *     options; Enter / Space picks
 */

export const tag = 'course-checkpoint';
export const contextKeys = [];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function pickField(obj, base, locale) {
  if (!obj) return '';
  if (locale === 'es' && obj[base + '-es']) return obj[base + '-es'];
  return obj[base] || '';
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';

  // Inline config required — lesson author writes the question.
  const cfgEl = rootEl.querySelector('script.course-checkpoint-config[type="application/json"]');
  if (!cfgEl) {
    rootEl.innerHTML = '<p class="workshop-error">course-checkpoint: missing inline config block.</p>';
    return { unmount: function () { rootEl.innerHTML = ''; } };
  }
  let cfg;
  try { cfg = JSON.parse(cfgEl.textContent || '{}'); }
  catch (e) {
    rootEl.innerHTML = '<p class="workshop-error">course-checkpoint: inline config is not valid JSON.</p>';
    return { unmount: function () { rootEl.innerHTML = ''; } };
  }

  const question = pickField(cfg, 'question', locale);
  const options  = Array.isArray(cfg.options) ? cfg.options : [];
  if (!question || options.length === 0) {
    rootEl.innerHTML = '<p class="workshop-error">course-checkpoint: config needs a question + at least one option.</p>';
    return { unmount: function () { rootEl.innerHTML = ''; } };
  }

  const t = locale === 'es' ? {
    label: 'Pausa — pregunta de chequeo',
    instruction: 'Una respuesta tuya. Sin calificación, sin guardado. Pulsa para ver el comentario.',
    answered: 'Respondida antes — pulsa otra opción para releer su comentario.',
    feedbackHeader: 'Comentario'
  } : {
    label: 'Pause — checkpoint question',
    instruction: 'One answer from you. Not graded, not saved. Click to see the feedback.',
    answered: 'Answered before — click another option to re-read its feedback.',
    feedbackHeader: 'Feedback'
  };

  // Build a stable storage key from the question text — different
  // checkpoints on the same page get different keys without the
  // lesson author having to assign ids.
  const storageKey = 'mtn:checkpoint:' + (function () {
    let h = 2166136261;
    for (let i = 0; i < question.length; i++) {
      h ^= question.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h.toString(36);
  })();
  let answeredBefore = false;
  try { answeredBefore = sessionStorage.getItem(storageKey) === '1'; }
  catch (_) {}

  const labelId = 'cqq-' + Math.random().toString(36).slice(2, 9);

  rootEl.innerHTML = [
    '<div class="cqp">',
      '<p class="cqp-eyebrow">', escHtml(t.label), '</p>',
      '<h4 id="', labelId, '" class="cqp-question">', escHtml(question), '</h4>',
      answeredBefore
        ? '<p class="cqp-instruction cqp-instruction--answered">' + escHtml(t.answered) + '</p>'
        : '<p class="cqp-instruction">' + escHtml(t.instruction) + '</p>',
      '<div class="cqp-options" role="radiogroup" aria-labelledby="' + labelId + '">',
        options.map((opt, i) => {
          const text = pickField(opt, 'text', locale);
          return [
            '<button type="button" class="cqp-option" role="radio" aria-checked="false" data-i="', i, '" tabindex="', (i === 0 ? '0' : '-1'), '">',
              escHtml(text),
            '</button>'
          ].join('');
        }).join(''),
      '</div>',
      '<div class="cqp-feedback" role="status" aria-live="polite" hidden>',
        '<p class="cqp-feedback-head">', escHtml(t.feedbackHeader), '</p>',
        '<p class="cqp-feedback-body"></p>',
      '</div>',
    '</div>'
  ].join('');

  const buttons = Array.from(rootEl.querySelectorAll('.cqp-option'));
  const feedbackEl = rootEl.querySelector('.cqp-feedback');
  const feedbackBody = rootEl.querySelector('.cqp-feedback-body');

  function pickOption(i) {
    buttons.forEach((b, j) => {
      b.setAttribute('aria-checked', i === j ? 'true' : 'false');
      b.setAttribute('tabindex', i === j ? '0' : '-1');
      b.classList.toggle('cqp-option--picked', i === j);
    });
    const opt = options[i];
    const fb = pickField(opt, 'feedback', locale);
    feedbackBody.textContent = fb;
    feedbackEl.removeAttribute('hidden');
    buttons[i].focus();
    try { sessionStorage.setItem(storageKey, '1'); } catch (_) {} // h8-exempt:per-session "answered-before" UI state; never leaves the browser, never crosses tabs
    // Lesson Mode signal — the audio player listens for this event to
    // resume narration after a retrieval-practice pause. The widget
    // doesn't grade answers (every option produces a feedback string),
    // so we dispatch on every click. detail.optionIndex helps the
    // listener distinguish first-answer-of-the-pause from re-clicks
    // (the operator clicking a second option after reading the first
    // option's feedback) without re-triggering audio resume.
    try {
      document.dispatchEvent(new CustomEvent('mtn:checkpoint-answered', {
        detail: { storageKey: storageKey, optionIndex: i }
      }));
    } catch (_) {}
  }

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => pickOption(i));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (i + 1) % buttons.length;
        buttons[next].focus();
        buttons[next].setAttribute('tabindex', '0');
        btn.setAttribute('tabindex', '-1');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (i - 1 + buttons.length) % buttons.length;
        buttons[prev].focus();
        buttons[prev].setAttribute('tabindex', '0');
        btn.setAttribute('tabindex', '-1');
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        pickOption(i);
      }
    });
  });

  return {
    unmount: function () { rootEl.innerHTML = ''; }
  };
}

export function serialize() { return {}; }
