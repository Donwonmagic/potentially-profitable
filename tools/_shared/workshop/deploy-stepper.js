/**
 * Workshop Kit widget: deploy-stepper
 *
 * Vertical 7-step deploy tracker for L15 (Deploy). Renders the
 * universal deploy flow that applies across Cloudflare Pages,
 * Netlify, and Vercel — operator marks each step done as they
 * complete it, and a celebration card appears at step 7.
 *
 * The host-specific instructions (with screenshots' worth of detail)
 * live in the sibling tab-flip widget below. This stepper is the
 * "where am I in the flow" anchor that survives across reloads + cross-
 * device sync.
 *
 * Step labels customize slightly when deployTarget is set (e.g. step 5
 * says "your-restaurant.pages.dev" for Cloudflare vs ".netlify.app"
 * for Netlify), but the seven-step structure is identical so the
 * progress survives if the operator switches hosts mid-deploy.
 *
 * Reads:
 *   - deployTarget        (existing context key)
 *   - deployProgress      (this widget's own key)
 *   - restaurantProfile.name (used in example URLs to make steps concrete)
 *
 * Writes:
 *   - deployTarget        (when operator picks a host from the top selector)
 *   - deployProgress: { stepId: bool, ... }
 *
 * Markup expected (no inline config — steps are baked in):
 *
 *   <section class="course-widget" data-widget="deploy-stepper"></section>
 *
 * Accessibility:
 *   - <ol> with each step as an <li>. Mark-done button is a real
 *     <button> with aria-pressed reflecting state.
 *   - Polite live region announces "Step 3 of 7 marked done." and
 *     "All 7 steps done — your site is live."
 *   - Celebration card respects prefers-reduced-motion (no confetti
 *     in reduced-motion mode; static checkmark replaces the burst).
 */

export const tag = 'deploy-stepper';
export const contextKeys = ['deployTarget', 'deployProgress'];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const STEPS = [
  { id: 'unzip',     icon: '📦' },
  { id: 'signup',    icon: '🔑' },
  { id: 'upload',    icon: '⬆️' },
  { id: 'name',      icon: '🏷️' },
  { id: 'live-url',  icon: '🌐' },
  { id: 'custom-domain', icon: '🔗' },
  { id: 'dns-wait',  icon: '⏱️' }
];

const STEP_COPY = {
  en: {
    unzip:         { title: 'Unzip the file from Lesson 14',                     body: 'Find <code>your-restaurant.zip</code> in your Downloads. Double-click it. You should see a folder with <code>index.html</code> + 7 other files.' },
    signup:        { title: 'Create a free account with your host',              body: 'Use your operator email — the one diners reach you at, not a personal address. Verify the link Google sends to that inbox.' },
    upload:        { title: 'Drag the folder into the host\'s deploy area',      body: 'Cloudflare Pages: Workers & Pages → Create → Pages → Upload assets. Netlify: app.netlify.com/drop. Vercel: dashboard → Add New → Project → template.' },
    name:          { title: 'Name the project',                                  body: 'Lowercase, dashes only. Example: <code>{slug}</code>. This becomes your free interim URL until you connect your real domain.' },
    'live-url':    { title: 'Visit your free interim URL',                       body: 'It will look like <code>{slug}.{hostDomain}</code>. Test it on your phone over cellular (not WiFi) so you see what diners see.' },
    'custom-domain':{ title: 'Add your real domain in the host\'s settings',     body: 'Custom domains → Set up → enter <code>www.your-restaurant.com</code>. The host gives you DNS records (a CNAME, sometimes an A record) to paste at your domain registrar.' },
    'dns-wait':    { title: 'Wait 10-60 minutes for DNS to propagate',           body: 'The phone book of the internet has to catch up. Go work on something else. Come back, type your real domain into a browser — your site loads.' }
  },
  es: {
    unzip:         { title: 'Descomprime el archivo de la Lección 14',            body: 'Encuentra <code>tu-restaurante.zip</code> en Descargas. Doble-clic. Deberías ver una carpeta con <code>index.html</code> + 7 archivos más.' },
    signup:        { title: 'Crea una cuenta gratis con tu host',                 body: 'Usa el correo del operador — al que llegan los comensales, no uno personal. Verifica el link que Google manda a esa bandeja.' },
    upload:        { title: 'Arrastra la carpeta al área de deploy del host',    body: 'Cloudflare Pages: Workers & Pages → Create → Pages → Upload assets. Netlify: app.netlify.com/drop. Vercel: dashboard → Add New → Project → template.' },
    name:          { title: 'Nombra el proyecto',                                 body: 'Minúsculas, solo guiones. Ejemplo: <code>{slug}</code>. Esto se vuelve tu URL interina gratis hasta que conectes tu dominio real.' },
    'live-url':    { title: 'Visita tu URL interina gratis',                      body: 'Se va a ver como <code>{slug}.{hostDomain}</code>. Pruébala en tu teléfono con datos móviles (no WiFi) para ver lo que ven los comensales.' },
    'custom-domain':{ title: 'Añade tu dominio real en la configuración del host',body: 'Custom domains → Set up → escribe <code>www.tu-restaurante.com</code>. El host te da registros DNS (un CNAME, a veces un A record) para pegar en tu registrador de dominio.' },
    'dns-wait':    { title: 'Espera 10-60 minutos para que el DNS propague',       body: 'La libreta de teléfonos de internet tarda en ponerse al día. Ve a hacer otra cosa. Vuelve, escribe tu dominio real en un navegador — tu sitio carga.' }
  }
};

const HOST_OPTIONS_EN = [
  { id: '',                  label: 'No host picked' },
  { id: 'cloudflare-pages',  label: 'Cloudflare Pages',  shortLabel: 'CF Pages',  hostDomain: 'pages.dev'    },
  { id: 'netlify',           label: 'Netlify',           shortLabel: 'Netlify',   hostDomain: 'netlify.app'  },
  { id: 'vercel',            label: 'Vercel',            shortLabel: 'Vercel',    hostDomain: 'vercel.app'   }
];
const HOST_OPTIONS_ES = [
  { id: '',                  label: 'Sin host elegido' },
  { id: 'cloudflare-pages',  label: 'Cloudflare Pages',  shortLabel: 'CF Pages',  hostDomain: 'pages.dev'    },
  { id: 'netlify',           label: 'Netlify',           shortLabel: 'Netlify',   hostDomain: 'netlify.app'  },
  { id: 'vercel',            label: 'Vercel',            shortLabel: 'Vercel',    hostDomain: 'vercel.app'   }
];

function slugify(name) {
  return String(name || 'your-restaurant')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'your-restaurant';
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const STR = STEP_COPY[locale] || STEP_COPY.en;
  const HOSTS = locale === 'es' ? HOST_OPTIONS_ES : HOST_OPTIONS_EN;

  const profile = (state && state.restaurantProfile) || {};
  const slug = slugify(profile.name);
  const initialTarget = (state && state.deployTarget) || '';
  const initialProgress = (state && state.deployProgress && typeof state.deployProgress === 'object') ? Object.assign({}, state.deployProgress) : {};

  const t = locale === 'es' ? {
    label: 'Tu trayecto de deploy',
    hostSelLabel: 'Elige tu host (opcional)',
    markDone: 'marcar listo',
    markUndo: 'deshacer',
    doneStatus: 'listo',
    pendingStatus: 'pendiente',
    progressN: function (n) { return n + ' de 7'; },
    celebrationHead: '¡Tu sitio está en vivo! 🎉',
    celebrationBody: 'Los siete pasos están listos. Tu sitio es accesible en tu dominio real. Toma 30 segundos para verlo en tu teléfono y compartirlo con un colega para una segunda mirada.',
    announceDone: function (n, total) { return 'Paso ' + n + ' de ' + total + ' marcado listo.'; },
    announceUndo: function (n) { return 'Paso ' + n + ' marcado pendiente.'; },
    announceAll: '¡Los siete pasos están listos! Tu sitio está en vivo.'
  } : {
    label: 'Your deploy journey',
    hostSelLabel: 'Pick your host (optional)',
    markDone: 'mark done',
    markUndo: 'undo',
    doneStatus: 'done',
    pendingStatus: 'pending',
    progressN: function (n) { return n + ' of 7'; },
    celebrationHead: 'Your site is live! 🎉',
    celebrationBody: 'All seven steps complete. Your site is reachable at your real domain. Take 30 seconds to look at it on your phone and to send a colleague for a second pair of eyes.',
    announceDone: function (n, total) { return 'Step ' + n + ' of ' + total + ' marked done.'; },
    announceUndo: function (n) { return 'Step ' + n + ' marked pending.'; },
    announceAll: 'All seven steps done — your site is live.'
  };

  const target = { current: initialTarget };

  function activeHost() {
    return HOSTS.find((h) => h.id === target.current) || HOSTS[0];
  }

  function fillTokens(text, host) {
    return text
      .replace(/\{slug\}/g, escHtml(slug))
      .replace(/\{hostDomain\}/g, host && host.hostDomain ? escHtml(host.hostDomain) : 'host.example');
  }

  function doneCount() {
    return STEPS.reduce((acc, s) => acc + (initialProgress[s.id] ? 1 : 0), 0);
  }

  function commit() {
    if (deps && typeof deps.commit === 'function') {
      deps.commit({
        deployTarget: target.current,
        deployProgress: Object.assign({}, initialProgress)
      });
    }
  }

  function render() {
    const host = activeHost();
    const done = doneCount();
    const allDone = done === STEPS.length;

    const hostSelOptions = HOSTS.map((h) => {
      return '<option value="' + escAttr(h.id) + '"' + (h.id === target.current ? ' selected' : '') + '>' + escHtml(h.label) + '</option>';
    }).join('');

    const stepsHTML = STEPS.map((step, i) => {
      const copy = STR[step.id] || { title: step.id, body: '' };
      const isDone = !!initialProgress[step.id];
      return [
        '<li class="dsw-step', isDone ? ' dsw-step--done' : '', '" data-id="', escAttr(step.id), '">',
          '<div class="dsw-step-num" aria-hidden="true">', isDone ? '✓' : (i + 1), '</div>',
          '<div class="dsw-step-body">',
            '<h4 class="dsw-step-title">', escHtml(copy.title), '</h4>',
            '<div class="dsw-step-desc">', fillTokens(copy.body, host), '</div>',
            '<div class="dsw-step-actions">',
              '<button type="button" class="dsw-toggle" aria-pressed="', isDone ? 'true' : 'false', '">',
                isDone ? escHtml(t.markUndo) : escHtml(t.markDone),
              '</button>',
              '<span class="dsw-step-status">', escHtml(isDone ? t.doneStatus : t.pendingStatus), '</span>',
            '</div>',
          '</div>',
        '</li>'
      ].join('');
    }).join('');

    rootEl.innerHTML = [
      '<div class="dsw">',
        '<div class="dsw-head">',
          '<h3 class="dsw-label">', escHtml(t.label), '</h3>',
          '<p class="dsw-progress"><strong>', escHtml(t.progressN(done)), '</strong></p>',
        '</div>',
        '<label class="dsw-host-field">',
          '<span class="dsw-host-lbl">', escHtml(t.hostSelLabel), '</span>',
          '<select class="dsw-host-sel">', hostSelOptions, '</select>',
        '</label>',
        '<ol class="dsw-steps">', stepsHTML, '</ol>',
        allDone
          ? ('<div class="dsw-celebration" role="status">' +
               '<h4 class="dsw-cele-head">' + escHtml(t.celebrationHead) + '</h4>' +
               '<p class="dsw-cele-body">' + escHtml(t.celebrationBody) + '</p>' +
             '</div>')
          : '',
        '<p class="dsw-live sr-only" role="status" aria-live="polite"></p>',
      '</div>'
    ].join('');

    rootEl.querySelectorAll('.dsw-toggle').forEach((btn) => {
      const li = btn.closest('.dsw-step');
      if (!li) return;
      const id = li.getAttribute('data-id');
      const idx = STEPS.findIndex((s) => s.id === id);
      btn.addEventListener('click', () => {
        const prev = !!initialProgress[id];
        initialProgress[id] = !prev;
        commit();
        const live = rootEl.querySelector('.dsw-live');
        if (initialProgress[id]) {
          if (doneCount() === STEPS.length) {
            if (live) live.textContent = t.announceAll;
          } else if (live) {
            live.textContent = t.announceDone(idx + 1, STEPS.length);
          }
        } else if (live) {
          live.textContent = t.announceUndo(idx + 1);
        }
        render();
      });
    });

    const sel = rootEl.querySelector('.dsw-host-sel');
    if (sel) {
      sel.addEventListener('change', () => {
        target.current = sel.value;
        commit();
        render();
      });
    }
  }

  render();

  return {
    unmount: function () { rootEl.innerHTML = ''; }
  };
}

export function serialize(rootEl) {
  const sel = rootEl.querySelector('.dsw-host-sel');
  const target = sel ? sel.value : '';
  const progress = {};
  rootEl.querySelectorAll('.dsw-step').forEach((li) => {
    const id = li.getAttribute('data-id');
    if (id) progress[id] = li.classList.contains('dsw-step--done');
  });
  return { deployTarget: target, deployProgress: progress };
}
