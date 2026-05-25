/**
 * Workshop Kit widget: rhythm-calendar
 *
 * Month-view calendar with recurring task pins + .ics export. Used in
 * L16 (The 30-day rhythm) to commit the post-launch cadence to a real
 * calendar the operator's calendar app understands.
 *
 * Four tasks are baked in: hours-check (monthly), reviews-triage
 * (biweekly), regen-redeploy (monthly), seo-sanity (quarterly).
 * Each can be set to weekly / biweekly / monthly / quarterly / off
 * via dropdowns. The calendar renders the current month with pins on
 * the days each task lands. Selected tasks export to a downloadable
 * .ics file that imports into Google Calendar, Apple Calendar, and
 * Outlook directly — RRULE'd recurring events with sensible defaults.
 *
 * Writes rhythmCadence: { hours, reviews, regen, seo } to
 * MuntinContext. The .ics generation happens entirely client-side
 * (no fetch); the download is a Blob URL.
 *
 * Markup expected (no inline config — the four tasks + their default
 * cadences are baked in):
 *
 *   <section class="course-widget" data-widget="rhythm-calendar"></section>
 *
 * Accessibility:
 *   - Each cadence picker is a labeled <select>.
 *   - The month calendar uses a <table> with <th> headers and
 *     scope="col". Task pins are visible text inside each <td>,
 *     not color alone.
 *   - The .ics export button announces "Calendar file downloaded."
 *     via a polite live region.
 */

export const tag = 'rhythm-calendar';
export const contextKeys = ['rhythmCadence'];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const TASKS = ['hours', 'reviews', 'regen', 'seo'];

const DEFAULT_CADENCE = {
  hours:   'monthly',
  reviews: 'biweekly',
  regen:   'monthly',
  seo:     'quarterly'
};

// Map cadence id → ICS RRULE fragment.
const RRULE = {
  weekly:    'FREQ=WEEKLY',
  biweekly:  'FREQ=WEEKLY;INTERVAL=2',
  monthly:   'FREQ=MONTHLY',
  quarterly: 'FREQ=MONTHLY;INTERVAL=3',
  off:       null
};

// Per-task pin color class (4 distinct colors).
const PIN_CLASS = {
  hours:   'rcw-pin--hours',
  reviews: 'rcw-pin--reviews',
  regen:   'rcw-pin--regen',
  seo:     'rcw-pin--seo'
};

function pad2(n) { return (n < 10 ? '0' : '') + n; }

function fmtICSDate(d) {
  // Local-time format (no Z) — calendar apps treat as floating local time.
  return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + 'T090000';
}

function nthCadenceDays(cadenceId, year, month) {
  // Returns array of day-of-month (1..31) on which a cadence lands in the
  // given month, assuming the first occurrence is on the 1st of the month.
  // Used purely for the calendar pin overlay (not the .ics, which uses RRULE).
  const result = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  switch (cadenceId) {
    case 'weekly':
      for (let d = 1; d <= daysInMonth; d += 7) result.push(d);
      break;
    case 'biweekly':
      for (let d = 1; d <= daysInMonth; d += 14) result.push(d);
      break;
    case 'monthly':
      result.push(1);
      break;
    case 'quarterly':
      if ([0, 3, 6, 9].indexOf(month) >= 0) result.push(1);
      break;
    default:
      break;
  }
  return result;
}

function buildICS(cadences, taskCopy, restaurantName) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Muntin Digital//Rhythm Calendar//EN',
    'CALSCALE:GREGORIAN'
  ];
  const now = new Date();
  const dtstamp = fmtICSDate(now);
  // First event lands on the upcoming Monday at 9 AM local. Subsequent
  // recurrences follow the RRULE.
  const firstMonday = new Date(now);
  while (firstMonday.getDay() !== 1) firstMonday.setDate(firstMonday.getDate() + 1);

  TASKS.forEach((tid) => {
    const cad = cadences[tid] || 'off';
    const rule = RRULE[cad];
    if (!rule) return;
    const copy = taskCopy[tid] || { summary: tid, description: '' };
    const summary = restaurantName ? (copy.summary + ' — ' + restaurantName) : copy.summary;
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + tid + '-' + dtstamp + '@muntin.digital',
      'DTSTAMP:' + dtstamp,
      'DTSTART:' + fmtICSDate(firstMonday),
      'DTEND:'   + fmtICSDate(new Date(firstMonday.getTime() + 30 * 60 * 1000)),
      'RRULE:' + rule,
      'SUMMARY:' + summary.replace(/[\r\n,;]/g, ' '),
      'DESCRIPTION:' + String(copy.description || '').replace(/[\r\n]/g, ' \\n ').replace(/[,;]/g, ' '),
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';

  // Read incoming cadence — handle legacy string format gracefully.
  let initial = Object.assign({}, DEFAULT_CADENCE);
  if (state && state.rhythmCadence && typeof state.rhythmCadence === 'object' && !Array.isArray(state.rhythmCadence)) {
    TASKS.forEach((tid) => {
      if (typeof state.rhythmCadence[tid] === 'string' && RRULE.hasOwnProperty(state.rhythmCadence[tid])) {
        initial[tid] = state.rhythmCadence[tid];
      }
    });
  }

  const profile = (state && state.restaurantProfile) || {};
  const restaurantName = profile.name || '';

  const t = locale === 'es' ? {
    label: 'Tu ritmo mensual',
    cadenceHead: 'Frecuencia por tarea',
    cadenceOptions: {
      off: 'apagado', weekly: 'semanal', biweekly: 'quincenal', monthly: 'mensual', quarterly: 'trimestral'
    },
    taskNames: {
      hours: 'Revisión de horarios', reviews: 'Respuesta a reseñas', regen: 'Regenerar + redesplegar', seo: 'Revisión de SEO'
    },
    icsCopy: {
      hours:   { summary: 'Revisión de horarios (ritmo Muntin)',      description: 'Abre GBP y el sitio en vivo lado a lado. Confirma que ambos muestren los mismos horarios.' },
      reviews: { summary: 'Respuesta a reseñas (ritmo Muntin)',        description: 'Abre GBP. Responde a cada reseña nueva.' },
      regen:   { summary: 'Regenerar + redesplegar (ritmo Muntin)',    description: 'Abre el generador de la L14. Verifica la lista de revisión. Descarga el nuevo ZIP, arrástralo al host.' },
      seo:     { summary: 'Revisión de SEO (ritmo Muntin)',            description: 'Abre el SEO Grader, corre tu URL en vivo. Confirma que las 8 frases clave coinciden con lo que busca tu barrio.' }
    },
    monthDOW: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    download: 'Descargar archivo de calendario (.ics)',
    downloadHelp: 'Importa este archivo a Google Calendar / Apple Calendar / Outlook para crear los eventos recurrentes automáticamente.',
    announceDownload: 'Archivo de calendario descargado.',
    legend: 'Leyenda'
  } : {
    label: 'Your monthly rhythm',
    cadenceHead: 'Cadence per task',
    cadenceOptions: {
      off: 'off', weekly: 'weekly', biweekly: 'biweekly', monthly: 'monthly', quarterly: 'quarterly'
    },
    taskNames: {
      hours: 'Hours check', reviews: 'Reviews triage', regen: 'Regenerate + redeploy', seo: 'SEO sanity'
    },
    icsCopy: {
      hours:   { summary: 'Hours check (Muntin rhythm)',          description: 'Open GBP and the live site side by side. Confirm both show the same hours.' },
      reviews: { summary: 'Reviews triage (Muntin rhythm)',       description: 'Open GBP. Respond to every new review.' },
      regen:   { summary: 'Regenerate + redeploy (Muntin rhythm)',description: 'Open the L14 generator. Check the readiness list. Download the new ZIP, drag onto your host.' },
      seo:     { summary: 'SEO sanity (Muntin rhythm)',           description: 'Open the SEO Grader, run your live URL. Confirm your 8 keyword phrases still match neighborhood search behavior.' }
    },
    monthDOW: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    download: 'Download calendar file (.ics)',
    downloadHelp: 'Import this file into Google Calendar / Apple Calendar / Outlook to create the recurring events automatically.',
    announceDownload: 'Calendar file downloaded.',
    legend: 'Legend'
  };

  function cadenceOptionsHTML(currentValue) {
    return ['off', 'weekly', 'biweekly', 'monthly', 'quarterly'].map((opt) => {
      return '<option value="' + opt + '"' + (opt === currentValue ? ' selected' : '') + '>' + escHtml(t.cadenceOptions[opt]) + '</option>';
    }).join('');
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  rootEl.innerHTML = [
    '<div class="rcw">',
      '<h3 class="rcw-label">', escHtml(t.label), '</h3>',

      '<div class="rcw-cadences">',
        '<p class="rcw-section-head">', escHtml(t.cadenceHead), '</p>',
        '<div class="rcw-cadence-grid">',
          TASKS.map((tid) => {
            return [
              '<label class="rcw-cad">',
                '<span class="rcw-cad-swatch" data-task="', escAttr(tid), '" aria-hidden="true"></span>',
                '<span class="rcw-cad-name">', escHtml(t.taskNames[tid]), '</span>',
                '<select class="rcw-cad-sel" data-task="', escAttr(tid), '">',
                  cadenceOptionsHTML(initial[tid]),
                '</select>',
              '</label>'
            ].join('');
          }).join(''),
        '</div>',
      '</div>',

      '<div class="rcw-month">',
        '<p class="rcw-month-head">', escHtml(t.monthNames[month] + ' ' + year), '</p>',
        '<table class="rcw-month-table" aria-label="', escAttr(t.monthNames[month] + ' ' + year), '">',
          '<thead><tr>',
            t.monthDOW.map((d) => '<th scope="col">' + escHtml(d) + '</th>').join(''),
          '</tr></thead>',
          '<tbody class="rcw-month-body"></tbody>',
        '</table>',
      '</div>',

      '<div class="rcw-export">',
        '<button type="button" class="rcw-download">', escHtml(t.download), '</button>',
        '<p class="rcw-export-help">', escHtml(t.downloadHelp), '</p>',
      '</div>',

      '<p class="rcw-live sr-only" role="status" aria-live="polite"></p>',
    '</div>'
  ].join('');

  const els = {
    body:     rootEl.querySelector('.rcw-month-body'),
    download: rootEl.querySelector('.rcw-download'),
    live:     rootEl.querySelector('.rcw-live')
  };

  function commit() {
    if (deps && typeof deps.commit === 'function') {
      const snapshot = {};
      TASKS.forEach((tid) => { snapshot[tid] = initial[tid]; });
      deps.commit({ rhythmCadence: snapshot });
    }
  }

  function renderMonth() {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday-first weekday: 0=Mon,...,6=Sun.
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // Sunday=0
    const leadingBlanks = (firstDayOfMonth + 6) % 7;

    // Map day-of-month → array of tasks pinned there.
    const dayPins = {};
    TASKS.forEach((tid) => {
      const days = nthCadenceDays(initial[tid], year, month);
      days.forEach((d) => {
        if (!dayPins[d]) dayPins[d] = [];
        dayPins[d].push(tid);
      });
    });

    const cells = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push('<td class="rcw-day rcw-day--blank" aria-hidden="true"></td>');
    for (let d = 1; d <= daysInMonth; d++) {
      const pins = dayPins[d] || [];
      const isToday = (d === now.getDate() && month === now.getMonth() && year === now.getFullYear());
      cells.push([
        '<td class="rcw-day', isToday ? ' rcw-day--today' : '', pins.length ? ' rcw-day--pinned' : '', '">',
          '<span class="rcw-day-n">', d, '</span>',
          pins.map((tid) => '<span class="rcw-pin ' + PIN_CLASS[tid] + '" title="' + escAttr(t.taskNames[tid]) + '">' + escHtml(t.taskNames[tid].split(' ')[0]) + '</span>').join(''),
        '</td>'
      ].join(''));
    }
    while (cells.length % 7) cells.push('<td class="rcw-day rcw-day--blank" aria-hidden="true"></td>');

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push('<tr>' + cells.slice(i, i + 7).join('') + '</tr>');
    }
    els.body.innerHTML = rows.join('');
  }

  rootEl.querySelectorAll('.rcw-cad-sel').forEach((sel) => {
    const tid = sel.getAttribute('data-task');
    sel.addEventListener('change', () => {
      initial[tid] = sel.value;
      commit();
      renderMonth();
    });
  });

  els.download.addEventListener('click', () => {
    const ics = buildICS(initial, t.icsCopy, restaurantName);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muntin-rhythm.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    els.live.textContent = t.announceDownload;
  });

  renderMonth();

  return {
    unmount: function () { rootEl.innerHTML = ''; }
  };
}

export function serialize(rootEl) {
  const out = {};
  rootEl.querySelectorAll('.rcw-cad-sel').forEach((sel) => {
    const tid = sel.getAttribute('data-task');
    if (tid) out[tid] = sel.value;
  });
  return { rhythmCadence: out };
}
