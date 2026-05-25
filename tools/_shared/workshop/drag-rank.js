/**
 * Workshop Kit widget: drag-rank
 *
 * Force-rank a list of cards from most to least important. Implemented as
 * a keyboard-first list with explicit up/down buttons (and arrow-key
 * shortcuts), NOT HTML5 drag-and-drop. Reasoning: HTML5 DnD is
 * notoriously inaccessible on touch, fragile across browsers, and tells
 * the wrong story pedagogically — "rank this" should be a deliberate
 * decision, not a flick. The up/down pattern works identically on phone,
 * keyboard, screen reader, and mouse.
 *
 * Used by: L2 (rank what a restaurant site is for), L6b (rank what's
 * leaking on a bad site), L8 (rank dish priority), L11b (rank GBP fix
 * priorities).
 *
 * Markup expected:
 *
 *   <section class="course-widget"
 *            data-widget="drag-rank"
 *            data-context-key="siteJobsRank"
 *            data-instruction="Rank these from most to least important for your restaurant."
 *            data-instruction-es="Ordena de más a menos importante para tu restaurante.">
 *     <script type="application/json" class="drag-rank-items">
 *       [
 *         {"id":"book","label":"Book a table","label-es":"Reservar una mesa","desc":"…","desc-es":"…"},
 *         {"id":"hours","label":"Find hours + location",…}
 *       ]
 *     </script>
 *   </section>
 *
 * The widget renders the items in their current order (from context if
 * present, otherwise the source order) and commits the ranked id-array
 * to the named context key on every reorder.
 *
 * Optional data-severity="true" colors each card by its current rank
 * position (top = important = teal; bottom = least = stone). Useful for
 * L6b ("rank the leaks — top three are critical").
 *
 * Accessibility:
 *   - Each card is in a <ul> with role="listbox" semantics swapped for
 *     a true keyboard-controlled list (arrow-up/arrow-down moves the
 *     focused item).
 *   - Move buttons have aria-labels with the item title for context.
 *   - aria-live="polite" announcement on every reorder describes the new
 *     position ("X moved to position 2 of 6").
 */

export const tag = 'drag-rank';
export const contextKeys = ['siteJobsRank', 'leakRank', 'menuRank', 'gbpFixRank', 'genericRank'];

function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function safeColor(severity, rank, total) {
  if (!severity) return '';
  // Top third teal, middle third ink-soft, bottom third stone.
  if (rank < Math.ceil(total / 3)) return 'data-tier="high"';
  if (rank >= total - Math.ceil(total / 3)) return 'data-tier="low"';
  return 'data-tier="mid"';
}

function readItemsConfig(rootEl) {
  const script = rootEl.querySelector('script.drag-rank-items[type="application/json"]');
  if (!script) {
    console.warn('[workshop:drag-rank] missing <script class="drag-rank-items">');
    return [];
  }
  try { return JSON.parse(script.textContent); }
  catch (e) { console.warn('[workshop:drag-rank] invalid JSON', e); return []; }
}

function pickLocaleField(obj, field, locale) {
  return (locale === 'es' && obj[field + '-es']) ? obj[field + '-es'] : (obj[field] || '');
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const contextKey = rootEl.getAttribute('data-context-key') || 'genericRank';
  const instruction = (locale === 'es' && rootEl.getAttribute('data-instruction-es'))
    ? rootEl.getAttribute('data-instruction-es')
    : (rootEl.getAttribute('data-instruction') || '');
  const severity = rootEl.getAttribute('data-severity') === 'true';

  const phrases = locale === 'es'
    ? { moveUp: 'Subir', moveDown: 'Bajar', position: 'Posición', of: 'de',
        announce: '{label} ahora en la posición {pos} de {total}.',
        savedNow: 'Orden guardado en este navegador' }
    : { moveUp: 'Move up', moveDown: 'Move down', position: 'Position', of: 'of',
        announce: '{label} now at position {pos} of {total}.',
        savedNow: 'Order saved in this browser' };

  const items = readItemsConfig(rootEl);
  if (!items.length) {
    rootEl.innerHTML = '<p class="workshop-error">' + (locale === 'es' ? 'No hay elementos para ordenar.' : 'No items to rank.') + '</p>';
    return { unmount: function () { rootEl.innerHTML = ''; } };
  }

  // Hydrate from context: if the saved order contains a permutation of
  // our item ids, apply it; otherwise use source order.
  let savedOrder = Array.isArray(state && state[contextKey]) ? state[contextKey].slice() : null;
  let ordered;
  if (savedOrder) {
    const byId = Object.create(null);
    items.forEach(function (it) { byId[it.id] = it; });
    ordered = savedOrder.filter(function (id) { return !!byId[id]; }).map(function (id) { return byId[id]; });
    // Append any items not in saved order (in case items were added later).
    items.forEach(function (it) { if (savedOrder.indexOf(it.id) < 0) ordered.push(it); });
  } else {
    ordered = items.slice();
  }

  function render() {
    const listHtml = ordered.map(function (it, i) {
      const label = pickLocaleField(it, 'label', locale);
      const desc = pickLocaleField(it, 'desc', locale);
      const isFirst = i === 0;
      const isLast = i === ordered.length - 1;
      const sevAttr = safeColor(severity, i, ordered.length);
      // Non-color tier signal: when severity is enabled, render a
      // visible text label (★ critical / watch / later) next to the
      // rank number. Color reinforces, doesn't replace, the label —
      // so operators with color vision deficiency don't lose the
      // ranking semantics.
      let tierLabel = '';
      if (severity) {
        const tierMatch = sevAttr.match(/data-tier="(\w+)"/);
        const tier = tierMatch ? tierMatch[1] : '';
        const tierStrings = locale === 'es'
          ? { high: '★ crítico', mid: 'revisar', low: 'luego' }
          : { high: '★ critical', mid: 'watch',  low: 'later' };
        if (tierStrings[tier]) {
          tierLabel = '<span class="dr-tier-label" data-tier="' + escHtml(tier) + '">' + escHtml(tierStrings[tier]) + '</span>';
        }
      }
      return [
        '<li class="dr-item" data-id="', escHtml(it.id), '" data-index="', i, '" ', sevAttr, ' tabindex="0">',
          '<div class="dr-rank" aria-hidden="true">', (i + 1), '</div>',
          tierLabel,
          '<div class="dr-content">',
            '<p class="dr-label">', escHtml(label), '</p>',
            desc ? '<p class="dr-desc">' + escHtml(desc) + '</p>' : '',
          '</div>',
          '<div class="dr-buttons">',
            '<button type="button" class="dr-up" ', isFirst ? 'disabled' : '', ' aria-label="', escHtml(phrases.moveUp + ': ' + label), '">▲</button>',
            '<button type="button" class="dr-down" ', isLast ? 'disabled' : '', ' aria-label="', escHtml(phrases.moveDown + ': ' + label), '">▼</button>',
          '</div>',
        '</li>'
      ].join('');
    }).join('');

    rootEl.innerHTML = [
      '<div class="dr">',
        instruction ? '<p class="dr-instruction">' + escHtml(instruction) + '</p>' : '',
        '<ol class="dr-list" aria-label="', escHtml(instruction), '">' + listHtml + '</ol>',
        '<p class="dr-announce sr-only" role="status" aria-live="polite"></p>',
        '<p class="dr-status" aria-live="polite"></p>',
      '</div>'
    ].join('');
  }

  function commit() {
    const order = ordered.map(function (it) { return it.id; });
    const patch = {};
    patch[contextKey] = order;
    deps.commit(patch);
    const status = rootEl.querySelector('.dr-status');
    if (status) {
      status.textContent = phrases.savedNow;
      setTimeout(function () { status.textContent = ''; }, 1800);
    }
  }

  function announceMove(item, newIdx) {
    const announce = rootEl.querySelector('.dr-announce');
    if (!announce) return;
    const label = pickLocaleField(item, 'label', locale);
    announce.textContent = phrases.announce
      .replace('{label}', label)
      .replace('{pos}', String(newIdx + 1))
      .replace('{total}', String(ordered.length));
  }

  function move(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= ordered.length || fromIdx === toIdx) return;
    const item = ordered[fromIdx];
    ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, item);
    render();
    // Restore focus to the moved card at its new index.
    const moved = rootEl.querySelector('.dr-item[data-id="' + item.id.replace(/"/g, '\\"') + '"]');
    if (moved) moved.focus();
    announceMove(item, toIdx);
    commit();
    wire();
  }

  function wire() {
    const list = rootEl.querySelector('.dr-list');
    if (!list) return;
    list.querySelectorAll('.dr-up').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const li = btn.closest('.dr-item');
        const idx = parseInt(li.getAttribute('data-index'), 10);
        move(idx, idx - 1);
      });
    });
    list.querySelectorAll('.dr-down').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const li = btn.closest('.dr-item');
        const idx = parseInt(li.getAttribute('data-index'), 10);
        move(idx, idx + 1);
      });
    });
    list.querySelectorAll('.dr-item').forEach(function (li) {
      li.addEventListener('keydown', function (e) {
        const idx = parseInt(li.getAttribute('data-index'), 10);
        if ((e.key === 'ArrowUp' && (e.altKey || e.metaKey)) || e.key === 'k') {
          e.preventDefault();
          move(idx, idx - 1);
        } else if ((e.key === 'ArrowDown' && (e.altKey || e.metaKey)) || e.key === 'j') {
          e.preventDefault();
          move(idx, idx + 1);
        }
      });
    });
  }

  render();
  wire();
  // Commit the hydrated order on mount so downstream widgets get the
  // current ranking even if the user never reorders.
  commit();

  return {
    unmount: function () { rootEl.innerHTML = ''; },
    refresh: function () { /* Only refresh on outside-of-widget changes; reorder doesn't really apply here. */ }
  };
}

export function serialize(rootEl) {
  const contextKey = rootEl.getAttribute('data-context-key') || 'genericRank';
  const ids = Array.from(rootEl.querySelectorAll('.dr-item')).map(function (li) {
    return li.getAttribute('data-id');
  });
  const patch = {};
  patch[contextKey] = ids;
  return patch;
}
