/**
 * Workshop Kit widget: menu-builder
 *
 * Drag-to-reorder list of dishes with inline name + price editing.
 * Captures the operator's menu shortlist for the rest of the bootcamp
 * (lesson 14 generator renders this list onto the menu page; lesson
 * 12 local-SEO suggests keyword phrases from dish names; lesson 9
 * photo brief asks for a shot of each).
 *
 * Implementation: same keyboard-first up/down pattern as drag-rank.
 * Each row has a name input, a price input, and up/down/delete buttons.
 * Add button appends an empty row at the bottom (capped at 12 dishes).
 *
 * Markup expected:
 *
 *   <section class="course-widget"
 *            data-widget="menu-builder"
 *            data-context-key="dishes"
 *            data-min="3"
 *            data-max="12"></section>
 *
 * State written: `dishes: [{ name: string, price: string }, …]`
 * where price is a string (e.g. "12", "12.50", "Market") to allow the
 * operator to write whatever convention their menu uses without us
 * normalizing.
 *
 * Accessibility:
 *   - Each row is a fieldset with a visually-hidden legend ("Dish 3 of 8").
 *   - Move buttons have aria-labels with row context.
 *   - aria-live="polite" announcement on every reorder ("Hand-rolled
 *     pasta moved to position 2 of 8").
 *   - Add and delete buttons announce ("Added dish 5 of 8" / "Removed
 *     dish 3").
 *   - Empty-state hint surfaces below the form.
 */

export const tag = 'menu-builder';
export const contextKeys = ['dishes'];

const DEFAULT_MAX = 12;
const DEFAULT_MIN = 3;

function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const max = parseInt(rootEl.getAttribute('data-max'), 10) || DEFAULT_MAX;
  const min = parseInt(rootEl.getAttribute('data-min'), 10) || DEFAULT_MIN;

  const phrases = locale === 'es'
    ? { instruction: 'Lista de 3 a ' + max + ' platos. Arrastra para reordenar (flechas) o usa los botones. El precio puede ser un número o "Mercado".',
        addDish: 'Añadir plato',
        moveUp: 'Subir',
        moveDown: 'Bajar',
        remove: 'Eliminar',
        legendTpl: 'Plato {n} de {total}',
        announceMove: '{name} ahora en la posición {pos} de {total}.',
        announceAdd: 'Añadido el plato {n} de {total}. Escribe su nombre.',
        announceRemove: 'Eliminado el plato.',
        savedNow: 'Menú guardado en este navegador',
        emptyHint: 'Añade al menos ' + min + ' platos para continuar.',
        labelName: 'Nombre del plato',
        labelPrice: 'Precio',
        placeholderName: 'Pollo asado a la brasa',
        placeholderPrice: '14' }
    : { instruction: 'List 3 to ' + max + ' dishes. Drag to reorder (arrows) or use the buttons. Price can be a number or "Market".',
        addDish: 'Add dish',
        moveUp: 'Move up',
        moveDown: 'Move down',
        remove: 'Remove',
        legendTpl: 'Dish {n} of {total}',
        announceMove: '{name} now at position {pos} of {total}.',
        announceAdd: 'Added dish {n} of {total}. Type its name.',
        announceRemove: 'Dish removed.',
        savedNow: 'Menu saved in this browser',
        emptyHint: 'Add at least ' + min + ' dishes to continue.',
        labelName: 'Dish name',
        labelPrice: 'Price',
        placeholderName: 'Wood-fired rotisserie chicken',
        placeholderPrice: '14' };

  // Hydrate from state; default to 3 empty rows.
  let dishes = (state && Array.isArray(state.dishes) && state.dishes.length)
    ? state.dishes.slice(0, max).map(function (d) {
        return { name: String(d.name || ''), price: String(d.price || '') };
      })
    : [{ name: '', price: '' }, { name: '', price: '' }, { name: '', price: '' }];

  function render() {
    const total = dishes.length;
    const rowsHtml = dishes.map(function (d, i) {
      const inputIdN = 'mb-n-' + i + '-' + Math.random().toString(36).slice(2, 6);
      const inputIdP = 'mb-p-' + i + '-' + Math.random().toString(36).slice(2, 6);
      const legend = phrases.legendTpl.replace('{n}', String(i + 1)).replace('{total}', String(total));
      const isFirst = i === 0;
      const isLast = i === total - 1;
      return [
        '<fieldset class="mb-row" data-index="', i, '">',
          '<legend class="sr-only">', escHtml(legend), '</legend>',
          '<div class="mb-row-rank" aria-hidden="true">', (i + 1), '</div>',
          '<div class="mb-row-fields">',
            '<label class="sr-only" for="', inputIdN, '">', escHtml(phrases.labelName), '</label>',
            '<input id="', inputIdN, '" class="mb-name" type="text" maxlength="80"',
              ' placeholder="', escAttr(phrases.placeholderName), '"',
              ' value="', escAttr(d.name), '" autocomplete="off"/>',
            '<label class="sr-only" for="', inputIdP, '">', escHtml(phrases.labelPrice), '</label>',
            '<input id="', inputIdP, '" class="mb-price" type="text" maxlength="12"',
              ' placeholder="', escAttr(phrases.placeholderPrice), '"',
              ' value="', escAttr(d.price), '" autocomplete="off" inputmode="decimal"/>',
          '</div>',
          '<div class="mb-row-buttons">',
            '<button type="button" class="mb-up" ', isFirst ? 'disabled' : '',
              ' aria-label="', escAttr(phrases.moveUp + ': ' + (d.name || phrases.legendTpl.replace('{n}', String(i + 1)).replace('{total}', String(total)))), '">▲</button>',
            '<button type="button" class="mb-down" ', isLast ? 'disabled' : '',
              ' aria-label="', escAttr(phrases.moveDown + ': ' + (d.name || phrases.legendTpl.replace('{n}', String(i + 1)).replace('{total}', String(total)))), '">▼</button>',
            '<button type="button" class="mb-remove"',
              ' aria-label="', escAttr(phrases.remove + ': ' + (d.name || phrases.legendTpl.replace('{n}', String(i + 1)).replace('{total}', String(total)))), '">×</button>',
          '</div>',
        '</fieldset>'
      ].join('');
    }).join('');

    const addDisabled = dishes.length >= max ? 'disabled' : '';
    const emptyHint = dishes.length < min ? '<p class="mb-empty-hint">' + escHtml(phrases.emptyHint) + '</p>' : '';

    rootEl.innerHTML = [
      '<div class="mb">',
        '<p class="mb-instruction">', escHtml(phrases.instruction), '</p>',
        '<div class="mb-list">', rowsHtml, '</div>',
        emptyHint,
        '<div class="mb-actions">',
          '<button type="button" class="mb-add" ', addDisabled, '>+ ', escHtml(phrases.addDish), '</button>',
          '<span class="mb-count">', dishes.length, ' / ', max, '</span>',
        '</div>',
        '<p class="mb-announce sr-only" role="status" aria-live="polite"></p>',
        '<p class="mb-status" aria-live="polite"></p>',
      '</div>'
    ].join('');
  }

  function commit() {
    deps.commit({ dishes: dishes.slice() });
    const status = rootEl.querySelector('.mb-status');
    if (status) {
      status.textContent = phrases.savedNow;
      setTimeout(function () { status.textContent = ''; }, 1800);
    }
  }

  function announce(msg) {
    const a = rootEl.querySelector('.mb-announce');
    if (a) a.textContent = msg;
  }

  function move(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= dishes.length || fromIdx === toIdx) return;
    const dish = dishes[fromIdx];
    const movingUp = toIdx < fromIdx;
    dishes.splice(fromIdx, 1);
    dishes.splice(toIdx, 0, dish);
    render();
    wire();
    // Keep focus on the same direction button on the moved row so
    // further reorder is one click away — and so we don't yank focus
    // into a name input where the polite-region announcement and the
    // caret position would collide for NVDA users.
    const moved = rootEl.querySelectorAll('.mb-row')[toIdx];
    if (moved) {
      const preferred = moved.querySelector(movingUp ? '.mb-up' : '.mb-down');
      const fallback = moved.querySelector(movingUp ? '.mb-down' : '.mb-up');
      const btn = (preferred && !preferred.disabled) ? preferred
                : (fallback && !fallback.disabled) ? fallback
                : moved.querySelector('.mb-name');
      if (btn) btn.focus();
    }
    announce(phrases.announceMove
      .replace('{name}', dish.name || phrases.placeholderName)
      .replace('{pos}', String(toIdx + 1))
      .replace('{total}', String(dishes.length)));
    commit();
  }

  function remove(idx) {
    if (idx < 0 || idx >= dishes.length) return;
    dishes.splice(idx, 1);
    render();
    wire();
    announce(phrases.announceRemove);
    commit();
    // Focus the row that now occupies the deleted index (or the
    // previous row if we just removed the last one).
    const rows = rootEl.querySelectorAll('.mb-row');
    const focusIdx = Math.min(idx, rows.length - 1);
    if (rows[focusIdx]) {
      const nameInput = rows[focusIdx].querySelector('.mb-name');
      if (nameInput) nameInput.focus();
    }
  }

  function add() {
    if (dishes.length >= max) return;
    dishes.push({ name: '', price: '' });
    render();
    wire();
    const rows = rootEl.querySelectorAll('.mb-row');
    const last = rows[rows.length - 1];
    if (last) {
      const nameInput = last.querySelector('.mb-name');
      if (nameInput) nameInput.focus();
    }
    announce(phrases.announceAdd
      .replace('{n}', String(dishes.length))
      .replace('{total}', String(dishes.length)));
    commit();
  }

  let commitTimer = null;
  function scheduleCommit() {
    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(commit, 250);
  }

  function wire() {
    rootEl.querySelectorAll('.mb-up').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const idx = parseInt(btn.closest('.mb-row').getAttribute('data-index'), 10);
        move(idx, idx - 1);
      });
    });
    rootEl.querySelectorAll('.mb-down').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const idx = parseInt(btn.closest('.mb-row').getAttribute('data-index'), 10);
        move(idx, idx + 1);
      });
    });
    rootEl.querySelectorAll('.mb-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const idx = parseInt(btn.closest('.mb-row').getAttribute('data-index'), 10);
        remove(idx);
      });
    });
    rootEl.querySelectorAll('.mb-name').forEach(function (input, i) {
      input.addEventListener('input', function () {
        if (dishes[i]) {
          dishes[i].name = input.value;
          scheduleCommit();
        }
      });
    });
    rootEl.querySelectorAll('.mb-price').forEach(function (input, i) {
      input.addEventListener('input', function () {
        if (dishes[i]) {
          dishes[i].price = input.value;
          scheduleCommit();
        }
      });
    });
    const addBtn = rootEl.querySelector('.mb-add');
    if (addBtn) addBtn.addEventListener('click', add);
  }

  render();
  wire();
  // Commit hydrated state so downstream widgets see the menu even if
  // the operator never edits.
  commit();

  return {
    unmount: function () {
      if (commitTimer) clearTimeout(commitTimer);
      rootEl.innerHTML = '';
    },
    refresh: function (nextState) {
      const focused = rootEl.contains(document.activeElement);
      if (focused) return;
      if (nextState && Array.isArray(nextState.dishes)) {
        dishes = nextState.dishes.slice(0, max).map(function (d) {
          return { name: String(d.name || ''), price: String(d.price || '') };
        });
        render();
        wire();
      }
    }
  };
}

export function serialize(rootEl) {
  const rows = rootEl.querySelectorAll('.mb-row');
  const dishes = Array.from(rows).map(function (r) {
    return {
      name: r.querySelector('.mb-name').value,
      price: r.querySelector('.mb-price').value
    };
  });
  return { dishes: dishes };
}
