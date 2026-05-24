/**
 * Workshop Kit — widget engine.
 *
 * Part of the Muntin Method infrastructure. Loads on any page that hosts
 * a Workshop Kit widget (the bootcamp's lesson pages, the Workshop Kit
 * reference pages at /method/workshop/, and any future Method-built
 * product). Discovers every `.course-widget[data-widget="<tag>"]` element,
 * dynamically imports the matching renderer from
 * `/tools/_shared/workshop/<tag>.js`, hydrates state from MuntinContext,
 * debounces saves back, and broadcasts changes as a CustomEvent
 * `mtn:context-change` that the rail and any other widget can subscribe
 * to.
 *
 * Widget renderer contract — each module at /tools/_shared/workshop/<tag>.js
 * exports:
 *
 *   export const tag           = 'live-preview-frame';
 *   export const contextKeys   = ['businessName', 'palette'];     // optional
 *   export function mount(rootEl, state, deps) -> { unmount, refresh? };
 *   export function serialize(rootEl) -> state;                   // optional
 *   export function validate(state) -> { ok: bool, errors? };     // optional
 *
 * deps passed to mount():
 *   commit(patch)  — merge into MuntinContext, fire change event
 *   locale         — 'en' | 'es' — read from page <html lang>
 *   dispatch(evt)  — escape hatch for cross-widget broadcasts
 *
 * commit(patch) enforces a soft allowlist when the widget exports
 * contextKeys: any patch key not in contextKeys produces a console.warn
 * and is dropped from the commit. This prevents one widget from
 * accidentally overwriting another's vocabulary as the kit grows.
 *
 * Zero fetches. Zero account. State lives in the browser. Same posture
 * as every other Muntin tool — see tools/_shared/context-bus.js for the
 * substrate.
 */
(function (root, doc) {
  'use strict';

  var WIDGET_MODULE_BASE = '/tools/_shared/workshop/';
  var COMMIT_DEBOUNCE_MS = 250;
  var CONTEXT_CHANGE_EVENT = 'mtn:context-change';
  var registry = Object.create(null);

  function loadRenderer(tag) {
    if (registry[tag]) return registry[tag];
    var url = WIDGET_MODULE_BASE + tag + '.js';
    registry[tag] = import(url).catch(function (err) {
      console.warn('[workshop] failed to load widget renderer:', tag, err);
      return null;
    });
    return registry[tag];
  }

  function readContextState(keys) {
    var ctx = (root.MuntinContext && root.MuntinContext.read()) || {};
    var profile = (root.MuntinContext && typeof root.MuntinContext.readRestaurantProfile === 'function')
      ? root.MuntinContext.readRestaurantProfile()
      : null;
    if (!Array.isArray(keys) || !keys.length) {
      var all = {};
      for (var k in ctx) if (Object.prototype.hasOwnProperty.call(ctx, k)) all[k] = ctx[k];
      if (profile) all.restaurantProfile = profile;
      return all;
    }
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key === 'restaurantProfile') {
        if (profile) out.restaurantProfile = profile;
      } else if (ctx[key] !== undefined) {
        out[key] = ctx[key];
      }
    }
    if (profile) out.restaurantProfile = profile;
    return out;
  }

  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments;
      var self = this;
      if (t) clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function detectLocale() {
    var docLang = (doc.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return docLang.indexOf('es') === 0 ? 'es' : 'en';
  }

  function filterPatchByAllowlist(tag, patch, contextKeys) {
    if (!Array.isArray(contextKeys) || !contextKeys.length) return patch;
    var out = {};
    var dropped = [];
    for (var k in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, k)) continue;
      // restaurantProfile is read via a special API; writes route through
      // writeRestaurantProfile, not via this allowlist. Accept other
      // declared keys.
      if (contextKeys.indexOf(k) >= 0 || k === 'restaurantProfile') {
        out[k] = patch[k];
      } else {
        dropped.push(k);
      }
    }
    if (dropped.length) {
      console.warn('[workshop:' + tag + '] commit dropped keys not in contextKeys:', dropped,
        'Declare them in contextKeys or use a different widget for those fields.');
    }
    return out;
  }

  function commitFactory(tag, contextKeys) {
    var write = debounce(function (patch) {
      if (!patch || typeof patch !== 'object') return;
      var filtered = filterPatchByAllowlist(tag, patch, contextKeys);
      if (!Object.keys(filtered).length) return;
      if (!root.MuntinContext) return;

      // Special-case: restaurantProfile writes go through the
      // writeRestaurantProfile API which has its own field allowlist.
      if (filtered.restaurantProfile && typeof root.MuntinContext.writeRestaurantProfile === 'function') {
        var profilePatch = filtered.restaurantProfile;
        delete filtered.restaurantProfile;
        root.MuntinContext.writeRestaurantProfile(profilePatch);
      }
      if (Object.keys(filtered).length && typeof root.MuntinContext.merge === 'function') {
        root.MuntinContext.merge(filtered);
      }
      try {
        root.dispatchEvent(new CustomEvent(CONTEXT_CHANGE_EVENT, {
          detail: { tag: tag, patch: patch }
        }));
      } catch (_) { /* swallow event-construction failures */ }
    }, COMMIT_DEBOUNCE_MS);
    return function commit(patch) { write(patch); };
  }

  function mountWidget(el) {
    var tag = el.getAttribute('data-widget');
    if (!tag) return;
    if (el.dataset.workshopMounted === '1') return;
    el.dataset.workshopMounted = '1';

    loadRenderer(tag).then(function (mod) {
      if (!mod || typeof mod.mount !== 'function') {
        el.setAttribute('data-workshop-error', 'renderer-missing');
        el.innerHTML = '<p class="workshop-error">' + (detectLocale() === 'es'
          ? 'Esta actividad no se pudo cargar. Recarga la página.'
          : 'This activity could not load. Refresh the page.') + '</p>';
        return;
      }
      var keys = mod.contextKeys || [];
      var state = readContextState(keys);
      var commit = commitFactory(tag, mod.contextKeys);
      var locale = detectLocale();
      try {
        var handle = mod.mount(el, state, {
          commit: commit,
          locale: locale,
          dispatch: root.dispatchEvent.bind(root)
        });
        if (handle && typeof handle.unmount === 'function') {
          el._workshopHandle = handle;
        }
        if (root.MuntinContext && typeof root.MuntinContext.subscribe === 'function') {
          root.MuntinContext.subscribe(function () {
            if (handle && typeof handle.refresh === 'function') {
              handle.refresh(readContextState(keys));
            }
          });
        }
      } catch (err) {
        console.error('[workshop] widget mount failed:', tag, err);
        el.setAttribute('data-workshop-error', 'mount-threw');
        el.innerHTML = '<p class="workshop-error">' + (detectLocale() === 'es'
          ? 'Esta actividad no se pudo iniciar. Recarga la página.'
          : 'This activity could not start. Refresh the page.') + '</p>';
      }
    });
  }

  function discoverAndMount(scope) {
    var nodes = (scope || doc).querySelectorAll('.course-widget[data-widget]');
    for (var i = 0; i < nodes.length; i++) mountWidget(nodes[i]);
  }

  function ready(fn) {
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () { discoverAndMount(doc); });

  root.WorkshopKit = {
    mount: mountWidget,
    discoverAndMount: discoverAndMount,
    CONTEXT_CHANGE_EVENT: CONTEXT_CHANGE_EVENT,
    detectLocale: detectLocale
  };

})(typeof self !== 'undefined' ? self : this, document);
