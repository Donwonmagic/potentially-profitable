/**
 * Shared "what's new" pulse for cross-tool surfaces (Wave 14.8).
 *
 * Each secondary tool — Plate Cost, Cost Pulse, Margin Math, Menu
 * Engineering — gained cross-tool surfaces (stale banner, recipe
 * ripple, break-even shift, quadrant-move tag) when the Invoice
 * Decoder spine landed. Operators didn't ask for them and don't
 * discover them until something happens to fire one. This module
 * attaches a discoverable "✨ New" badge to each surface the first
 * time it becomes visible — dismissible, persisted per-operator.
 *
 * Privacy posture: per-surface dismissal flags live in
 * MuntinContext.whatsNewDismissed (a flat string-set keyed by
 * <toolKey>:<surfaceId>). Aggregate-only, plaintext aggregate, same
 * posture as every other Wave 10+ key.
 *
 * Usage from a tool's bootstrap:
 *
 *   MuntinWhatsNew.register({
 *     toolKey: 'plate-cost',
 *     surfaces: [
 *       {
 *         id: 'stale-banner',
 *         target: '#pcStaleBanner',
 *         title: 'New: invoice-aware recipe updates',
 *         body: 'When you save an invoice in the Invoice Decoder, recipes here auto-update. Tap to learn more.',
 *         shipDate: '2026-05-04'
 *       },
 *       …
 *     ]
 *   });
 *
 * The module attaches a tiny "✨ New" pill to each surface the
 * moment its target element becomes visible. Operator-time gates:
 *   - Don't show after surface.shipDate + 60 days (stops feeling new).
 *   - Don't show when MuntinContext.whatsNewDismissed[<key>] is set.
 *
 * Honors prefers-reduced-motion (no pulse animation).
 * Hidden in @media print.
 */
(function (root) {
  'use strict';
  if (typeof root === 'undefined' || !root || !root.document) return;

  var STYLE_ID = 'mtn-whats-new-style';
  function _ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.mtn-wn-pill{position:absolute;z-index:30;display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:var(--teal,#1F4E5B);color:#fff;font:600 11px/1 -apple-system,system-ui,sans-serif;letter-spacing:.04em;cursor:pointer;border:none;box-shadow:0 2px 8px rgba(20,22,26,.18)}',
      '.mtn-wn-pill::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;animation:mtn-wn-pulse 2.2s ease-in-out infinite}',
      '@keyframes mtn-wn-pulse{0%,100%{opacity:.45;transform:scale(.85)}50%{opacity:1;transform:scale(1.18)}}',
      '@media (prefers-reduced-motion:reduce){.mtn-wn-pill::before{animation:none}}',
      '.mtn-wn-pill:hover{filter:brightness(1.08)}',
      '.mtn-wn-pill:focus-visible{outline:3px solid #fff;outline-offset:-5px;box-shadow:0 0 0 4px var(--teal,#1F4E5B)}',
      '.mtn-wn-pop{position:absolute;z-index:31;width:max-content;max-width:min(320px,calc(100vw - 24px));padding:12px 14px;background:#FAF7F2;border:1px solid #d6d2c2;border-radius:10px;box-shadow:0 8px 26px rgba(20,22,26,.22);font:14px/1.5 -apple-system,system-ui,sans-serif;color:#14161A}',
      '.mtn-wn-pop[hidden]{display:none}',
      '.mtn-wn-pop-title{margin:0 0 4px;font-weight:600;font-size:13.5px;color:#14161A}',
      '.mtn-wn-pop-body{margin:0 0 10px;font-size:12.5px;color:#2A2D33;line-height:1.5}',
      '.mtn-wn-pop-actions{display:flex;gap:6px;justify-content:flex-end}',
      '.mtn-wn-pop-dismiss{font:inherit;font-size:12px;padding:5px 11px;border-radius:6px;border:1px solid #d6d2c2;background:#fff;color:#14161A;cursor:pointer}',
      '.mtn-wn-pop-dismiss:hover{border-color:#2A2D33}',
      '.mtn-wn-pop-cta{font:inherit;font-size:12px;padding:5px 11px;border-radius:6px;border:1px solid var(--teal,#1F4E5B);background:var(--teal,#1F4E5B);color:#fff;cursor:pointer;text-decoration:none}',
      '.mtn-wn-pop-cta:hover{filter:brightness(1.05)}',
      '@media print{.mtn-wn-pill,.mtn-wn-pop{display:none !important}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function _ctx() {
    return (typeof root.MuntinContext !== 'undefined' && root.MuntinContext) || null;
  }
  function _isDismissed(toolKey, surfaceId) {
    var c = _ctx();
    if (!c || typeof c.read !== 'function') return false;
    try {
      var data = c.read() || {};
      var map = data.whatsNewDismissed || {};
      return !!map[toolKey + ':' + surfaceId];
    } catch (_) { return false; }
  }
  function _dismiss(toolKey, surfaceId) {
    var c = _ctx();
    if (!c || typeof c.merge !== 'function') return;
    try {
      var data = c.read() || {};
      var map = Object.assign({}, data.whatsNewDismissed || {});
      map[toolKey + ':' + surfaceId] = Date.now();
      c.merge({ whatsNewDismissed: map });
    } catch (_) {}
  }

  // The freshness gate: drop the pulse 60 days after shipDate. Old
  // surfaces stop feeling "new" and shouldn't keep nagging.
  function _isFresh(shipDate) {
    if (!shipDate) return true;
    var ts = Date.parse(shipDate);
    if (isNaN(ts)) return true;
    return (Date.now() - ts) < 60 * 86400000;
  }

  function _findTarget(target) {
    if (!target) return null;
    var sels = String(target).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el && !el.hidden && el.offsetParent !== null) return el;
    }
    return null;
  }

  // Mount a pill on the target, set up popover + dismissal handler.
  function _mountPill(toolKey, surface, target) {
    if (target.querySelector(':scope > .mtn-wn-pill[data-surface="' + surface.id + '"]')) return;
    if (getComputedStyle(target).position === 'static') {
      target.style.position = 'relative';
    }
    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'mtn-wn-pill';
    pill.dataset.surface = surface.id;
    pill.style.top = '8px';
    pill.style.right = '8px';
    pill.setAttribute('aria-label', surface.title || 'What\'s new');
    pill.textContent = (surface.label || 'New');
    target.appendChild(pill);

    pill.addEventListener('click', function (ev) {
      ev.stopPropagation();
      _showPopover(pill, target, toolKey, surface);
    });
  }

  function _showPopover(pill, target, toolKey, surface) {
    _closePopover();
    var pop = document.createElement('div');
    pop.className = 'mtn-wn-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'false');
    pop.innerHTML =
      '<p class="mtn-wn-pop-title"></p>' +
      '<p class="mtn-wn-pop-body"></p>' +
      '<div class="mtn-wn-pop-actions">' +
        '<button type="button" class="mtn-wn-pop-dismiss">Got it</button>' +
        (surface.cta ? '<a class="mtn-wn-pop-cta" target="_blank" rel="noopener"></a>' : '') +
      '</div>';
    pop.querySelector('.mtn-wn-pop-title').textContent = surface.title || 'New';
    pop.querySelector('.mtn-wn-pop-body').textContent = surface.body || '';
    if (surface.cta) {
      var ctaEl = pop.querySelector('.mtn-wn-pop-cta');
      ctaEl.href = surface.cta.href;
      ctaEl.textContent = surface.cta.label;
    }
    document.body.appendChild(pop);
    var rect = pill.getBoundingClientRect();
    pop.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    pop.style.left = Math.max(8, Math.min(window.innerWidth - 340, rect.left + window.scrollX - 280)) + 'px';

    function close() {
      try { pop.parentNode.removeChild(pop); } catch (_) {}
      document.removeEventListener('click', _outside, true);
      document.removeEventListener('keydown', _esc);
    }
    function _outside(ev) { if (!pop.contains(ev.target) && ev.target !== pill) close(); }
    function _esc(ev) { if (ev.key === 'Escape') close(); }
    setTimeout(function () {
      document.addEventListener('click', _outside, true);
      document.addEventListener('keydown', _esc);
    }, 0);

    pop.querySelector('.mtn-wn-pop-dismiss').addEventListener('click', function () {
      _dismiss(toolKey, surface.id);
      try { pill.parentNode.removeChild(pill); } catch (_) {}
      close();
      if (root.plausible) {
        try { root.plausible('Whats New Dismissed', { props: { tool: toolKey, surface: surface.id } }); } catch (_) {}
      }
    });
    var ctaA = pop.querySelector('.mtn-wn-pop-cta');
    if (ctaA) {
      ctaA.addEventListener('click', function () {
        _dismiss(toolKey, surface.id);     // count CTA-click as dismissal
        try { pill.parentNode.removeChild(pill); } catch (_) {}
        if (root.plausible) {
          try { root.plausible('Whats New Clicked Through', { props: { tool: toolKey, surface: surface.id } }); } catch (_) {}
        }
      });
    }
    if (root.plausible) {
      try { root.plausible('Whats New Opened', { props: { tool: toolKey, surface: surface.id } }); } catch (_) {}
    }
  }
  function _closePopover() {
    var existing = document.querySelectorAll('.mtn-wn-pop');
    Array.prototype.forEach.call(existing, function (e) { try { e.parentNode.removeChild(e); } catch (_) {} });
  }

  function _attemptMount(toolKey, surface) {
    if (_isDismissed(toolKey, surface.id)) return false;
    if (!_isFresh(surface.shipDate)) return false;
    var target = _findTarget(surface.target);
    if (!target) return false;
    _mountPill(toolKey, surface, target);
    return true;
  }

  // Public — register surfaces for a tool. The module polls for
  // target visibility on a 1.5s interval (drop on first successful
  // mount). Cheap; the surfaces are typically rendered well before
  // the operator scrolls to them.
  function register(config) {
    if (!config || !config.toolKey || !Array.isArray(config.surfaces)) return;
    _ensureStyle();
    var pending = config.surfaces.filter(function (s) { return s && s.id && s.target; });
    if (!pending.length) return;
    function tick() {
      pending = pending.filter(function (s) {
        return !_attemptMount(config.toolKey, s);
      });
      if (!pending.length) {
        clearInterval(__poll);
        return;
      }
    }
    var __poll = setInterval(tick, 1500);
    setTimeout(tick, 200);
    // Stop polling after 60 seconds. Surfaces that haven't fired by
    // then probably won't this session.
    setTimeout(function () { clearInterval(__poll); }, 60000);
    // Also re-check on cross-tab MuntinContext changes.
    if (root.MuntinContext && typeof root.MuntinContext.subscribe === 'function') {
      root.MuntinContext.subscribe(function () { tick(); });
    }
  }

  var api = { register: register, _isDismissed: _isDismissed, _dismiss: _dismiss };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuntinWhatsNew = api;
})(typeof window !== 'undefined' ? window : null);
