/**
 * Workshop Kit widget: tab-flip
 *
 * A two-or-three-tab toggle for "good copy vs bad copy" rhetorical
 * examples. Implements the WAI-ARIA Authoring Practices tabs pattern:
 * Left/Right arrows move between tabs, Home/End jump to ends, Enter or
 * Space activates. Light, dependency-free, no state writes to context
 * — this is a viewing widget, not a producer.
 *
 * Used by: L3 (good vs bad promise), L4 (good vs bad customer paragraph),
 * L13 (good vs bad review responses).
 *
 * Markup expected:
 *
 *   <section class="course-widget" data-widget="tab-flip">
 *     <script type="application/json" class="tab-flip-config">
 *       {
 *         "tabs": [
 *           {"id":"bad","label":"Vague","label-es":"Vago","body":"<p>…</p>","body-es":"<p>…</p>"},
 *           {"id":"good","label":"Specific","label-es":"Específico","body":"<p>…</p>","body-es":"<p>…</p>"}
 *         ],
 *         "defaultIndex": 0
 *       }
 *     </script>
 *   </section>
 *
 * Body HTML is rendered as-is into the panel — keep it small, prefer
 * single-paragraph examples. Lesson author is responsible for the safety
 * of body content (these are lesson assets, not user input).
 *
 * Accessibility:
 *   - role="tablist" with horizontal orientation
 *   - role="tab" + aria-selected + aria-controls on each trigger
 *   - role="tabpanel" + aria-labelledby + tabindex="0" on each panel
 *   - Focus moves with arrow keys, focus mode = manual (Enter to activate)
 *     so screen reader users can preview tab labels without changing panel
 */

export const tag = 'tab-flip';
export const contextKeys = [];   // viewer-only widget

function escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function pickLocaleField(obj, field, locale) {
  return (locale === 'es' && obj[field + '-es']) ? obj[field + '-es'] : (obj[field] || '');
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const cfgScript = rootEl.querySelector('script.tab-flip-config[type="application/json"]');
  let cfg = { tabs: [], defaultIndex: 0 };
  if (cfgScript) {
    try { cfg = JSON.parse(cfgScript.textContent); }
    catch (e) {
      console.warn('[workshop:tab-flip] invalid JSON', e);
      rootEl.innerHTML = '<p class="workshop-error">Tab content failed to load.</p>';
      return { unmount: function () { rootEl.innerHTML = ''; } };
    }
  }

  if (!Array.isArray(cfg.tabs) || cfg.tabs.length < 2) {
    rootEl.innerHTML = '<p class="workshop-error">Tab widget needs at least two tabs.</p>';
    return { unmount: function () { rootEl.innerHTML = ''; } };
  }

  const baseId = 'tf-' + Math.random().toString(36).slice(2, 8);
  const defaultIdx = (typeof cfg.defaultIndex === 'number' && cfg.defaultIndex >= 0 && cfg.defaultIndex < cfg.tabs.length) ? cfg.defaultIndex : 0;

  const tabsHtml = cfg.tabs.map(function (t, i) {
    const label = pickLocaleField(t, 'label', locale);
    const selected = i === defaultIdx;
    return [
      '<button type="button" role="tab"',
        ' id="', baseId, '-tab-', i, '"',
        ' aria-controls="', baseId, '-panel-', i, '"',
        ' aria-selected="', selected ? 'true' : 'false', '"',
        ' tabindex="', selected ? '0' : '-1', '"',
        ' class="tf-tab', selected ? ' tf-tab--selected' : '', '"',
        '>',
        escHtml(label),
      '</button>'
    ].join('');
  }).join('');

  const panelsHtml = cfg.tabs.map(function (t, i) {
    const body = pickLocaleField(t, 'body', locale);
    const selected = i === defaultIdx;
    return [
      '<div role="tabpanel"',
        ' id="', baseId, '-panel-', i, '"',
        ' aria-labelledby="', baseId, '-tab-', i, '"',
        ' tabindex="0"',
        ' class="tf-panel"',
        selected ? '' : ' hidden',
        '>',
        body,
      '</div>'
    ].join('');
  }).join('');

  rootEl.innerHTML = [
    '<div class="tf">',
      '<div class="tf-tabs" role="tablist" aria-orientation="horizontal">', tabsHtml, '</div>',
      '<div class="tf-panels">', panelsHtml, '</div>',
    '</div>'
  ].join('');

  const tabs = Array.from(rootEl.querySelectorAll('[role="tab"]'));
  const panels = Array.from(rootEl.querySelectorAll('[role="tabpanel"]'));

  function activate(idx) {
    tabs.forEach(function (t, i) {
      const sel = i === idx;
      t.setAttribute('aria-selected', sel ? 'true' : 'false');
      t.setAttribute('tabindex', sel ? '0' : '-1');
      t.classList.toggle('tf-tab--selected', sel);
    });
    panels.forEach(function (p, i) {
      p.hidden = (i !== idx);
    });
    tabs[idx].focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activate(i); });
    tab.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          activate((i + 1) % tabs.length);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          activate((i - 1 + tabs.length) % tabs.length);
          break;
        case 'Home':
          e.preventDefault();
          activate(0);
          break;
        case 'End':
          e.preventDefault();
          activate(tabs.length - 1);
          break;
        default: break;
      }
    });
  });

  return {
    unmount: function () { rootEl.innerHTML = ''; }
  };
}

export function serialize() { return {}; }
