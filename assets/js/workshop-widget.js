/**
 * Workshop Kit — widget engine.
 *
 * Part of the Muntin Method infrastructure. Loads on any page that hosts
 * a Workshop Kit widget (the bootcamp's lesson pages, the Workshop Kit
 * reference pages at /method/workshop/, and any future Method-built
 * product). Discovers every `.course-widget[data-widget="<tag>"]` element,
 * dynamically imports the matching renderer from
 * `/tools/_shared/workshop/<tag>.js`, hydrates state from URL fragment →
 * localStorage → renderer defaults, debounces saves back to
 * MuntinContext, and broadcasts changes as a CustomEvent('mtn:context-
 * change') that the rail and any other widget can subscribe to.
 *
 * Widget renderer contract — each module at /tools/_shared/workshop/<tag>.js
 * exports:
 *
 *   export const tag           = 'live-preview-frame';
 *   export const contextKeys   = ['businessName', 'palette'];     // optional
 *   export function mount(rootEl, state, deps) -> { unmount, getState? };
 *   export function serialize(rootEl) -> state;                   // optional
 *   export function validate(state) -> { ok: bool, errors? };     // optional
 *
 * `state` passed to mount() is the union of relevant fields from
 * MuntinContext + any URL-fragment overrides. The renderer is
 * responsible for rendering its UI into `rootEl` and wiring its own
 * event listeners. When the user changes anything, the renderer calls
 * `deps.commit(patch)` — which:
 *   1. Merges into MuntinContext (localStorage namespace `mtn:context`).
 *   2. Updates the URL fragment via MuntinFragment.encode (if available).
 *   3. Fires CustomEvent('mtn:context-change') on window so the rail and
 *      any other mounted widget can react.
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
  var registry = Object.create(null);    // tag -> renderer module promise

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
    if (!Array.isArray(keys) || !keys.length) return ctx;
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (ctx[k] !== undefined) out[k] = ctx[k];
    }
    // Also expose the restaurant profile under a known key so widgets
    // can read businessName/cuisine/etc. without each spelling out
    // every field name. The rail reads this directly.
    if (typeof root.MuntinContext === 'object' && typeof root.MuntinContext.readRestaurantProfile === 'function') {
      var profile = root.MuntinContext.readRestaurantProfile();
      if (profile) out.restaurantProfile = profile;
    }
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

  function commitFactory(tag) {
    var write = debounce(function (patch) {
      if (!patch || typeof patch !== 'object') return;
      if (!root.MuntinContext || typeof root.MuntinContext.merge !== 'function') return;
      root.MuntinContext.merge(patch);
      // Try URL fragment too (best-effort; some pages opt out).
      if (root.MuntinFragment && typeof root.MuntinFragment.encode === 'function') {
        try { root.MuntinFragment.encode(patch); } catch (_) { /* ignore */ }
      }
      try {
        root.dispatchEvent(new CustomEvent(CONTEXT_CHANGE_EVENT, {
          detail: { tag: tag, patch: patch }
        }));
      } catch (_) {
        // IE/old-Edge fallback path; we don't really support those, but
        // never let event-construction failures break the widget.
      }
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
        return;
      }
      var keys = mod.contextKeys || [];
      var state = readContextState(keys);
      var commit = commitFactory(tag);
      try {
        var handle = mod.mount(el, state, { commit: commit, dispatch: root.dispatchEvent.bind(root) });
        if (handle && typeof handle.unmount === 'function') {
          el._workshopHandle = handle;   // for HMR / re-mount during dev
        }
        // Re-render on cross-tab context changes (e.g. user changed
        // palette in tab A; tab B's live-preview-frame should refresh).
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

  // Public surface for ad-hoc mounting (e.g. the rail injects widgets
  // dynamically in its sandboxed preview controls).
  root.WorkshopKit = {
    mount: mountWidget,
    discoverAndMount: discoverAndMount,
    CONTEXT_CHANGE_EVENT: CONTEXT_CHANGE_EVENT
  };

})(typeof self !== 'undefined' ? self : this, document);
