/**
 * L14 generator orchestrator.
 *
 * Wires the download button on the L14 lesson page to:
 *   1. Read MuntinContext (anonymous-first, localStorage-only).
 *   2. Render the four HTML pages + sitemap + robots + README via the
 *      ES-module templates under ./templates/.
 *   3. Lazy-load JSZip from /assets/vendor/jszip@3.10.1/jszip.min.js
 *      (already SRI-pinned in scripts/expected-integrity.json).
 *   4. Pack everything into <slug>.zip, trigger a blob download.
 *   5. Fire a Plausible Course Generator Download event (if present).
 *
 * No fetches to muntin.digital. No network calls except the JSZip
 * static asset on first click. The operator's data never leaves
 * their browser.
 *
 * The script is conditionally imported by the L14 lesson page only
 * when the readiness checklist confirms the required fields are
 * present — that's why the button starts enabled but the actual
 * orchestrator is loaded on click, not on page load.
 */

import { renderHome as renderHomeRail } from './templates/page-home.template.js';
import { renderHomeForBundle } from './templates/page-home-generator.template.js';
import { renderMenu } from './templates/page-menu.template.js';
import { renderAbout } from './templates/page-about.template.js';
import { renderContact } from './templates/page-contact.template.js';
import { renderSitemap } from './templates/sitemap.template.js';
import { renderRobots } from './templates/robots.template.js';
import { renderReadme } from './templates/readme.template.js';

const JSZIP_URL = '/assets/vendor/jszip@3.10.1/jszip.min.js';

/**
 * Read MuntinContext + restaurantProfile. Returns the consolidated
 * shape the templates expect.
 */
export function readState() {
  const w = (typeof window !== 'undefined') ? window : {};
  const ctx = (w.MuntinContext && typeof w.MuntinContext.read === 'function')
    ? (w.MuntinContext.read() || {}) : {};
  const profile = (w.MuntinContext && typeof w.MuntinContext.readRestaurantProfile === 'function')
    ? (w.MuntinContext.readRestaurantProfile() || {}) : {};
  return {
    palette: ctx.palette,
    onePromise: ctx.onePromise,
    customerParagraph: ctx.customerParagraph,
    dishes: ctx.dishes,
    hours: ctx.hours,
    localKeywords: ctx.localKeywords,
    deployTarget: ctx.deployTarget,
    restaurantProfile: profile
  };
}

/**
 * Build every file the ZIP needs. Returns a map of { filename: string }.
 * Pure — no DOM, no network. Easy to test in isolation.
 *
 * @param {object} state — from readState() or a test fixture.
 * @param {object} opts — { locale: 'en' | 'es' }.
 * @returns {Object<string,string>} filename → text content.
 */
export function buildBundle(state, opts) {
  const o = { locale: 'en', ...(opts || {}) };
  return {
    'index.html':   renderHomeForBundle(state, o),
    'menu.html':    renderMenu(state, o),
    'about.html':   renderAbout(state, o),
    'contact.html': renderContact(state, o),
    'sitemap.xml':  renderSitemap(),
    'robots.txt':   renderRobots(),
    'README.md':    renderReadme(state, o)
  };
}

/**
 * Slugify the restaurant name for the ZIP filename.
 * "Joe's Café" → "joes-cafe". Falls back to "your-restaurant".
 */
export function slugify(name) {
  const fallback = 'your-restaurant';
  if (!name) return fallback;
  const s = String(name)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return s || fallback;
}

let jszipPromise = null;

/**
 * Lazy-load JSZip exactly once per page. The vendor file is pinned via
 * SRI in scripts/expected-integrity.json; the actual <script> tag
 * doesn't need the integrity attribute because we're a same-origin
 * load and the file ships with the deploy bundle.
 */
function loadJSZip() {
  if (typeof window !== 'undefined' && window.JSZip) return Promise.resolve(window.JSZip);
  if (jszipPromise) return jszipPromise;
  jszipPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSZIP_URL;
    s.async = true;
    s.onload = () => {
      if (window.JSZip) resolve(window.JSZip);
      else reject(new Error('JSZip loaded but global not present'));
    };
    s.onerror = () => reject(new Error('Failed to load ' + JSZIP_URL));
    document.head.appendChild(s);
  });
  return jszipPromise;
}

/**
 * Build + pack + trigger the download. Returns a Promise that resolves
 * with { filename, size, mime } once the blob URL is created, or
 * rejects with an Error.
 */
export async function downloadBundle(opts) {
  const o = { locale: 'en', ...(opts || {}) };
  const state = readState();
  const JSZip = await loadJSZip();
  const zip = new JSZip();
  const bundle = buildBundle(state, o);
  Object.keys(bundle).forEach((filename) => {
    zip.file(filename, bundle[filename]);
  });
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const name = (state.restaurantProfile && state.restaurantProfile.name) || '';
  const filename = slugify(name) + '.zip';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
    try {
      window.plausible('Course Generator Download', { props: { locale: o.locale, slug: slugify(name) } });
    } catch (e) { /* analytics is fire-and-forget */ }
  }

  return { filename, size: blob.size, mime: blob.type };
}

/**
 * Wire the lesson page's download button. Called from the inline
 * script tag at the bottom of /course/m4-launch/generator/ once the
 * readiness checklist confirms required fields are present.
 */
export function mount(buttonEl, opts) {
  if (!buttonEl) return;
  // Caller's locale wins. Otherwise infer from <html lang>. Default 'en'.
  let locale;
  if (opts && opts.locale && (opts.locale === 'es' || opts.locale === 'en')) {
    locale = opts.locale;
  } else {
    const pageLang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    locale = pageLang.startsWith('es') ? 'es' : 'en';
  }

  buttonEl.addEventListener('click', async (e) => {
    e.preventDefault();
    const originalLabel = buttonEl.innerHTML;
    buttonEl.disabled = true;
    buttonEl.setAttribute('aria-busy', 'true');
    const busyText = locale === 'es' ? 'Empaquetando…' : 'Packing…';
    buttonEl.innerHTML = '<span aria-hidden="true">⏳</span><span>' + busyText + '</span>';
    try {
      const r = await downloadBundle({ locale });
      const successText = locale === 'es' ? '¡Descargado! ' + r.filename : 'Downloaded! ' + r.filename;
      buttonEl.innerHTML = '<span aria-hidden="true">✓</span><span>' + successText + '</span>';
      setTimeout(() => {
        buttonEl.innerHTML = originalLabel;
        buttonEl.disabled = false;
        buttonEl.removeAttribute('aria-busy');
      }, 2500);
    } catch (err) {
      const errorText = locale === 'es' ? 'Error al empaquetar — intenta de nuevo' : 'Pack failed — try again';
      buttonEl.innerHTML = '<span aria-hidden="true">✕</span><span>' + errorText + '</span>';
      setTimeout(() => {
        buttonEl.innerHTML = originalLabel;
        buttonEl.disabled = false;
        buttonEl.removeAttribute('aria-busy');
      }, 3500);
      if (typeof console !== 'undefined' && console.error) console.error('[L14 generator]', err);
    }
  });
}
