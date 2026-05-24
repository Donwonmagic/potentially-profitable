/**
 * Workshop Kit widget: weekly-hours-grid
 *
 * Seven-row grid (Monday–Sunday) where the operator sets opening and
 * closing times per day, or marks the day closed. Captures hours data
 * for the L14 generator (which renders them on the home page footer +
 * a contact section) and for Lesson 12 local-SEO (which checks that
 * site hours match GBP hours).
 *
 * Markup:
 *
 *   <section class="course-widget" data-widget="weekly-hours-grid">
 *   </section>
 *
 * State written: `hours: { monday: {open, close, closed}, …, sunday: … }`
 * where open / close are strings in 24h "HH:MM" format and closed is
 * a boolean. Reading code can format for display.
 *
 * Accessibility:
 *   - Each day is a row with the day name as the row label.
 *   - Time inputs are native <input type="time"> — best AT support.
 *   - "Closed" checkbox disables the time inputs visually and
 *     semantically (aria-disabled).
 *   - Live region announces the saved state.
 */

export const tag = 'weekly-hours-grid';
export const contextKeys = ['hours'];

const DAYS = [
  { id: 'monday',    en: 'Monday',    es: 'Lunes' },
  { id: 'tuesday',   en: 'Tuesday',   es: 'Martes' },
  { id: 'wednesday', en: 'Wednesday', es: 'Miércoles' },
  { id: 'thursday',  en: 'Thursday',  es: 'Jueves' },
  { id: 'friday',    en: 'Friday',    es: 'Viernes' },
  { id: 'saturday',  en: 'Saturday',  es: 'Sábado' },
  { id: 'sunday',    en: 'Sunday',    es: 'Domingo' }
];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function defaultHours() {
  // A reasonable default for a dinner-only spot: Tue-Sat open, Sun-Mon closed.
  return {
    monday:    { open: '',      close: '',      closed: true  },
    tuesday:   { open: '17:00', close: '22:00', closed: false },
    wednesday: { open: '17:00', close: '22:00', closed: false },
    thursday:  { open: '17:00', close: '22:00', closed: false },
    friday:    { open: '17:00', close: '23:00', closed: false },
    saturday:  { open: '17:00', close: '23:00', closed: false },
    sunday:    { open: '',      close: '',      closed: true  }
  };
}

function normalizeHours(input) {
  const out = defaultHours();
  if (!input || typeof input !== 'object') return out;
  DAYS.forEach(function (d) {
    const src = input[d.id];
    if (src && typeof src === 'object') {
      out[d.id] = {
        open: typeof src.open === 'string' ? src.open : '',
        close: typeof src.close === 'string' ? src.close : '',
        closed: !!src.closed
      };
    }
  });
  return out;
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';

  const phrases = locale === 'es'
    ? { instruction: 'Pon tus horarios para cada día. Marca "Cerrado" para los días que no abres. Se guarda mientras editas.',
        dayHeading: 'Día',
        openLabel: 'Abre',
        closeLabel: 'Cierra',
        closedLabel: 'Cerrado',
        copyMonToFri: 'Copiar lunes a vie',
        copyAllOpenDays: 'Copiar primer día abierto a todos',
        savedNow: 'Horarios guardados en este navegador',
        announceClosed: '{day} marcado como cerrado.',
        announceOpen: '{day} abierto de {open} a {close}.',
        invalid: '{day}: la hora de cierre debe ser después de la de apertura.' }
    : { instruction: 'Set your hours for each day. Tick "Closed" for the days you\'re not open. Saves as you edit.',
        dayHeading: 'Day',
        openLabel: 'Opens',
        closeLabel: 'Closes',
        closedLabel: 'Closed',
        copyMonToFri: 'Copy Mon to Fri',
        copyAllOpenDays: 'Copy first open day to all',
        savedNow: 'Hours saved in this browser',
        announceClosed: '{day} marked closed.',
        announceOpen: '{day} open from {open} to {close}.',
        invalid: '{day}: closing time must be after opening time.' };

  let hours = normalizeHours(state && state.hours);

  function dayLabel(d) { return locale === 'es' ? d.es : d.en; }

  function render() {
    const rowsHtml = DAYS.map(function (d) {
      const h = hours[d.id];
      const closed = h.closed;
      const openId = 'whg-o-' + d.id;
      const closeId = 'whg-c-' + d.id;
      const closedId = 'whg-x-' + d.id;
      return [
        '<div class="whg-row" data-day="', d.id, '">',
          '<div class="whg-day-name"><label for="', closedId, '">', escHtml(dayLabel(d)), '</label></div>',
          '<div class="whg-time-fields">',
            '<label class="whg-time-label" for="', openId, '">', escHtml(phrases.openLabel), '</label>',
            '<input id="', openId, '" class="whg-open" type="time" value="', escAttr(h.open), '"',
              closed ? ' disabled aria-disabled="true"' : '', '/>',
            '<label class="whg-time-label" for="', closeId, '">', escHtml(phrases.closeLabel), '</label>',
            '<input id="', closeId, '" class="whg-close" type="time" value="', escAttr(h.close), '"',
              closed ? ' disabled aria-disabled="true"' : '', '/>',
          '</div>',
          '<div class="whg-closed-cell">',
            '<input id="', closedId, '" class="whg-closed" type="checkbox" ', closed ? 'checked' : '', '/>',
            '<label for="', closedId, '" class="whg-closed-label">', escHtml(phrases.closedLabel), '</label>',
          '</div>',
        '</div>'
      ].join('');
    }).join('');

    rootEl.innerHTML = [
      '<div class="whg">',
        '<p class="whg-instruction">', escHtml(phrases.instruction), '</p>',
        '<div class="whg-list" role="group" aria-label="', escAttr(phrases.dayHeading), '">',
          rowsHtml,
        '</div>',
        '<div class="whg-shortcuts">',
          '<button type="button" class="whg-copy-monfri" ', (hours.monday.closed || !hours.monday.open) ? 'disabled' : '', '>', escHtml(phrases.copyMonToFri), '</button>',
          '<button type="button" class="whg-copy-all">', escHtml(phrases.copyAllOpenDays), '</button>',
        '</div>',
        '<p class="whg-announce sr-only" role="status" aria-live="polite"></p>',
        '<p class="whg-status" aria-live="polite"></p>',
        '<p class="whg-error" role="status" aria-live="polite"></p>',
      '</div>'
    ].join('');
  }

  function commit() {
    deps.commit({ hours: hours });
    const status = rootEl.querySelector('.whg-status');
    if (status) {
      status.textContent = phrases.savedNow;
      setTimeout(function () { status.textContent = ''; }, 1800);
    }
  }

  function validate() {
    const errEl = rootEl.querySelector('.whg-error');
    if (!errEl) return true;
    for (let i = 0; i < DAYS.length; i++) {
      const d = DAYS[i];
      const h = hours[d.id];
      if (!h.closed && h.open && h.close && h.close <= h.open) {
        errEl.textContent = phrases.invalid.replace('{day}', dayLabel(d));
        return false;
      }
    }
    errEl.textContent = '';
    return true;
  }

  function announce(msg) {
    const a = rootEl.querySelector('.whg-announce');
    if (a) a.textContent = msg;
  }

  let commitTimer = null;
  function scheduleCommit() {
    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(function () {
      validate();
      commit();
    }, 250);
  }

  function onChange(day, field, value) {
    if (field === 'closed') {
      hours[day].closed = !!value;
      // Re-render to enable/disable the time inputs.
      render();
      wire();
      const d = DAYS.find(function (dd) { return dd.id === day; });
      announce(value
        ? phrases.announceClosed.replace('{day}', dayLabel(d))
        : phrases.announceOpen
            .replace('{day}', dayLabel(d))
            .replace('{open}', hours[day].open || '?')
            .replace('{close}', hours[day].close || '?'));
    } else {
      hours[day][field] = value;
    }
    scheduleCommit();
  }

  function copyMonToFri() {
    const mon = hours.monday;
    // Refuse to copy when Monday is closed — would silently zero out
    // Tue-Fri, which is destructive and surprising. The shortcut is
    // disabled in the UI when Monday is closed; this is the belt to
    // the suspender.
    if (mon.closed || !mon.open) return;
    ['tuesday', 'wednesday', 'thursday', 'friday'].forEach(function (id) {
      hours[id] = { open: mon.open, close: mon.close, closed: false };
    });
    render();
    wire();
    commit();
  }

  function copyFirstOpenToAll() {
    // Find the first day in week order with closed=false.
    let src = null;
    for (let i = 0; i < DAYS.length; i++) {
      if (!hours[DAYS[i].id].closed) { src = hours[DAYS[i].id]; break; }
    }
    if (!src) return;
    DAYS.forEach(function (d) {
      if (!hours[d.id].closed) {
        hours[d.id] = { open: src.open, close: src.close, closed: false };
      }
    });
    render();
    wire();
    commit();
  }

  function wire() {
    DAYS.forEach(function (d) {
      const row = rootEl.querySelector('.whg-row[data-day="' + d.id + '"]');
      if (!row) return;
      row.querySelector('.whg-open').addEventListener('input', function (e) {
        onChange(d.id, 'open', e.target.value);
      });
      row.querySelector('.whg-close').addEventListener('input', function (e) {
        onChange(d.id, 'close', e.target.value);
      });
      row.querySelector('.whg-closed').addEventListener('change', function (e) {
        onChange(d.id, 'closed', e.target.checked);
      });
    });
    const monFri = rootEl.querySelector('.whg-copy-monfri');
    if (monFri) monFri.addEventListener('click', copyMonToFri);
    const allBtn = rootEl.querySelector('.whg-copy-all');
    if (allBtn) allBtn.addEventListener('click', copyFirstOpenToAll);
  }

  render();
  wire();
  commit();

  return {
    unmount: function () {
      if (commitTimer) clearTimeout(commitTimer);
      rootEl.innerHTML = '';
    },
    refresh: function (nextState) {
      const focused = rootEl.contains(document.activeElement);
      if (focused) return;
      hours = normalizeHours(nextState && nextState.hours);
      render();
      wire();
    }
  };
}

export function serialize(rootEl) {
  const hours = {};
  DAYS.forEach(function (d) {
    const row = rootEl.querySelector('.whg-row[data-day="' + d.id + '"]');
    if (!row) return;
    hours[d.id] = {
      open: row.querySelector('.whg-open').value,
      close: row.querySelector('.whg-close').value,
      closed: row.querySelector('.whg-closed').checked
    };
  });
  return { hours: hours };
}
