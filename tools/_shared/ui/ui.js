/**
 * Shared UI primitives for the Muntin Digital toolkit (Phase 1).
 *
 * Twenty-one tools hand-roll their own button markup, form-group, card,
 * error rendering, toast, modal — each subtly different. This module
 * gives every tool the same primitives so future design changes land
 * in one place.
 *
 * Primitives:
 *
 *   button({ label, variant, size, onClick, ariaLabel, type })
 *     -> <button class="mtn-btn mtn-btn--primary mtn-btn--md">…</button>
 *
 *   card({ title, body, footer, tone })
 *     -> <article class="mtn-card mtn-card--default">…</article>
 *
 *   formGroup({ id, label, hint, error, control })
 *     -> <div class="mtn-form-group">  label + hint + control + error  </div>
 *
 *   errorCard({ title, message, actionLabel, onAction })
 *     -> <div class="mtn-error-card" role="alert">…</div>
 *
 *   emptyState({ title, body, actionLabel, onAction, illustration })
 *     -> <div class="mtn-empty">…</div>
 *
 *   toast.show({ message, tone, durationMs }) -> dismiss()
 *     Mounts a singleton container in <body>.
 *
 *   modal.open({ title, body, actions, onClose })
 *     -> { close() } with backdrop + focus trap + Esc.
 *
 *   breadcrumb({ items: [{ label, href }] })
 *     -> <nav aria-label="Breadcrumb"><ol>…</ol></nav>
 *
 *   tabs({ tabs: [{ id, label, panel }], selectedId, onChange })
 *     -> { node, select(id) } with arrow-key a11y.
 *
 * All visual styling lives in /assets/site-core.css via the .mtn-*
 * class names. JS attaches behaviour and a11y; CSS owns appearance.
 * Tools never need to know about classes — they only consume the
 * returned DOM nodes.
 *
 * Pure DOM construction; safe to call before first paint. No external
 * dependencies; safe-html.js is used implicitly via createTextNode.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinUI = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function setText(el, txt) {
    if (txt == null) return;
    el.appendChild(document.createTextNode(String(txt)));
  }

  function attr(el, k, v) {
    if (v == null || v === false) return;
    if (v === true) { el.setAttribute(k, ''); return; }
    el.setAttribute(k, String(v));
  }

  function makeEl(tag, className, attrs) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { attr(el, k, attrs[k]); });
    return el;
  }

  // ---------- BUTTON ----------
  // spec: { label, variant, size, type, onClick, ariaLabel, disabled, iconBefore, iconAfter }
  function button(spec) {
    spec = spec || {};
    var variant = spec.variant || 'primary'; // primary | ghost | link | danger
    var size = spec.size || 'md';            // sm | md | lg
    var btn = makeEl('button', 'mtn-btn mtn-btn--' + variant + ' mtn-btn--' + size, {
      type: spec.type || 'button',
      'aria-label': spec.ariaLabel || null,
      disabled: spec.disabled ? '' : null
    });
    if (spec.iconBefore) btn.appendChild(spec.iconBefore);
    setText(btn, spec.label);
    if (spec.iconAfter) btn.appendChild(spec.iconAfter);
    if (typeof spec.onClick === 'function') btn.addEventListener('click', spec.onClick);
    return btn;
  }

  // ---------- CARD ----------
  // spec: { title, body, footer, tone }
  // tone: default | info | success | warning | danger
  function card(spec) {
    spec = spec || {};
    var tone = spec.tone || 'default';
    var art = makeEl('article', 'mtn-card mtn-card--' + tone);
    if (spec.title) {
      var h = makeEl('header', 'mtn-card__title');
      var hEl = makeEl(spec.titleTag || 'h3', null);
      setText(hEl, spec.title);
      h.appendChild(hEl);
      art.appendChild(h);
    }
    if (spec.body) {
      var body = makeEl('div', 'mtn-card__body');
      if (spec.body instanceof Node) body.appendChild(spec.body);
      else setText(body, spec.body);
      art.appendChild(body);
    }
    if (spec.footer) {
      var foot = makeEl('footer', 'mtn-card__footer');
      if (spec.footer instanceof Node) foot.appendChild(spec.footer);
      else setText(foot, spec.footer);
      art.appendChild(foot);
    }
    return art;
  }

  // ---------- FORM GROUP ----------
  // spec: { id, label, hint, error, control, required }
  function formGroup(spec) {
    spec = spec || {};
    var wrap = makeEl('div', 'mtn-form-group' + (spec.error ? ' mtn-form-group--error' : ''));
    if (spec.label) {
      var lbl = makeEl('label', 'mtn-form-label', { for: spec.id || null });
      setText(lbl, spec.label);
      if (spec.required) {
        var star = makeEl('span', 'mtn-form-required', { 'aria-hidden': 'true' });
        setText(star, ' *');
        lbl.appendChild(star);
      }
      wrap.appendChild(lbl);
    }
    if (spec.hint) {
      var hintId = (spec.id || '') + '-hint';
      var hint = makeEl('small', 'mtn-form-hint', { id: hintId });
      setText(hint, spec.hint);
      wrap.appendChild(hint);
    }
    if (spec.control) {
      if (spec.id && !spec.control.id) spec.control.id = spec.id;
      if (spec.hint && spec.control.getAttribute) {
        var prev = spec.control.getAttribute('aria-describedby') || '';
        spec.control.setAttribute('aria-describedby',
          (prev + ' ' + (spec.id || '') + '-hint').trim());
      }
      if (spec.required && spec.control.setAttribute) {
        spec.control.setAttribute('aria-required', 'true');
      }
      wrap.appendChild(spec.control);
    }
    if (spec.error) {
      var errId = (spec.id || '') + '-error';
      var err = makeEl('div', 'mtn-form-error', { id: errId, role: 'alert' });
      setText(err, spec.error);
      wrap.appendChild(err);
      if (spec.control && spec.control.setAttribute) {
        spec.control.setAttribute('aria-invalid', 'true');
        var prev2 = spec.control.getAttribute('aria-describedby') || '';
        spec.control.setAttribute('aria-describedby', (prev2 + ' ' + errId).trim());
      }
    }
    return wrap;
  }

  // ---------- ERROR CARD ----------
  // spec: { title, message, actionLabel, onAction, tone }
  function errorCard(spec) {
    spec = spec || {};
    var tone = spec.tone || 'danger';
    var wrap = makeEl('div', 'mtn-error-card mtn-error-card--' + tone, { role: 'alert' });
    if (spec.title) {
      var h = makeEl('strong', 'mtn-error-card__title');
      setText(h, spec.title);
      wrap.appendChild(h);
    }
    if (spec.message) {
      var msg = makeEl('p', 'mtn-error-card__msg');
      setText(msg, spec.message);
      wrap.appendChild(msg);
    }
    if (spec.actionLabel && typeof spec.onAction === 'function') {
      wrap.appendChild(button({
        label: spec.actionLabel,
        variant: 'ghost',
        size: 'sm',
        onClick: spec.onAction
      }));
    }
    return wrap;
  }

  // ---------- EMPTY STATE ----------
  function emptyState(spec) {
    spec = spec || {};
    var wrap = makeEl('div', 'mtn-empty');
    if (spec.illustration && spec.illustration instanceof Node) {
      var ill = makeEl('div', 'mtn-empty__illustration', { 'aria-hidden': 'true' });
      ill.appendChild(spec.illustration);
      wrap.appendChild(ill);
    }
    if (spec.title) {
      var h = makeEl('h3', 'mtn-empty__title');
      setText(h, spec.title);
      wrap.appendChild(h);
    }
    if (spec.body) {
      var p = makeEl('p', 'mtn-empty__body');
      setText(p, spec.body);
      wrap.appendChild(p);
    }
    if (spec.actionLabel && typeof spec.onAction === 'function') {
      wrap.appendChild(button({
        label: spec.actionLabel,
        variant: 'primary',
        size: 'md',
        onClick: spec.onAction
      }));
    }
    return wrap;
  }

  // ---------- TOAST (singleton) ----------
  var toastContainer = null;
  function ensureToastContainer() {
    if (toastContainer) return toastContainer;
    toastContainer = makeEl('div', 'mtn-toast-container', {
      'aria-live': 'polite',
      'aria-atomic': 'true',
      role: 'status'
    });
    if (document.body) document.body.appendChild(toastContainer);
    return toastContainer;
  }
  var toast = {
    show: function (spec) {
      spec = spec || {};
      var tone = spec.tone || 'default';
      var dur = spec.durationMs == null ? 3200 : spec.durationMs;
      var c = ensureToastContainer();
      var t = makeEl('div', 'mtn-toast mtn-toast--' + tone);
      setText(t, spec.message || '');
      c.appendChild(t);
      // Force reflow then add visible class for transition.
      void t.offsetWidth;
      t.classList.add('mtn-toast--visible');
      var timer = setTimeout(dismiss, dur);
      function dismiss() {
        clearTimeout(timer);
        t.classList.remove('mtn-toast--visible');
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
      }
      return { dismiss: dismiss };
    }
  };

  // ---------- MODAL ----------
  var lastFocusedBeforeModal = null;
  function focusableIn(root) {
    var sel = 'a[href],area[href],input:not([disabled]):not([type="hidden"]),' +
              'select:not([disabled]),textarea:not([disabled]),' +
              'button:not([disabled]),[tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }
  var modal = {
    open: function (spec) {
      spec = spec || {};
      lastFocusedBeforeModal = document.activeElement;
      var backdrop = makeEl('div', 'mtn-modal-backdrop');
      var dialog = makeEl('div', 'mtn-modal', {
        role: 'dialog',
        'aria-modal': 'true',
        tabindex: '-1'
      });
      var headerId = 'mtn-modal-h-' + Math.random().toString(36).slice(2, 8);
      dialog.setAttribute('aria-labelledby', headerId);
      if (spec.title) {
        var h = makeEl('h2', 'mtn-modal__title', { id: headerId });
        setText(h, spec.title);
        dialog.appendChild(h);
      }
      var body = makeEl('div', 'mtn-modal__body');
      if (spec.body instanceof Node) body.appendChild(spec.body);
      else if (spec.body) setText(body, spec.body);
      dialog.appendChild(body);
      var actionsRow = makeEl('div', 'mtn-modal__actions');
      (spec.actions || []).forEach(function (a) {
        actionsRow.appendChild(button({
          label: a.label,
          variant: a.variant || 'ghost',
          size: 'md',
          onClick: function () {
            try { a.onClick && a.onClick(); } finally {
              if (a.closesModal !== false) close();
            }
          }
        }));
      });
      if ((spec.actions || []).length) dialog.appendChild(actionsRow);
      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      function onKey(e) {
        if (e.key === 'Escape' && spec.dismissable !== false) {
          e.preventDefault();
          close();
          return;
        }
        if (e.key === 'Tab') {
          var f = focusableIn(dialog);
          if (!f.length) { e.preventDefault(); dialog.focus(); return; }
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
          }
        }
      }
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop && spec.dismissable !== false) close();
      });
      document.addEventListener('keydown', onKey);

      // Initial focus
      setTimeout(function () {
        var f = focusableIn(dialog);
        if (f.length) f[0].focus(); else dialog.focus();
      }, 0);

      function close() {
        document.removeEventListener('keydown', onKey);
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
          try { lastFocusedBeforeModal.focus(); } catch (_) {}
        }
        if (typeof spec.onClose === 'function') spec.onClose();
      }
      return { close: close };
    }
  };

  // ---------- BREADCRUMB ----------
  function breadcrumb(spec) {
    spec = spec || {};
    var nav = makeEl('nav', 'mtn-breadcrumb', { 'aria-label': spec.ariaLabel || 'Breadcrumb' });
    var ol = makeEl('ol', 'mtn-breadcrumb__list');
    (spec.items || []).forEach(function (item, i, arr) {
      var li = makeEl('li', 'mtn-breadcrumb__item');
      var isLast = i === arr.length - 1;
      if (item.href && !isLast) {
        var a = makeEl('a', null, { href: item.href });
        setText(a, item.label);
        li.appendChild(a);
      } else {
        var sp = makeEl('span', isLast ? 'mtn-breadcrumb__current' : null,
                        isLast ? { 'aria-current': 'page' } : null);
        setText(sp, item.label);
        li.appendChild(sp);
      }
      if (!isLast) {
        var sep = makeEl('span', 'mtn-breadcrumb__sep', { 'aria-hidden': 'true' });
        setText(sep, '/');
        li.appendChild(sep);
      }
      ol.appendChild(li);
    });
    nav.appendChild(ol);
    return nav;
  }

  // ---------- TABS ----------
  // spec: { tabs: [{ id, label, panel }], selectedId, onChange }
  // Returns { node, select(id) }. Each tab has role=tab; panels role=tabpanel.
  function tabs(spec) {
    spec = spec || {};
    var tabsList = spec.tabs || [];
    var current = spec.selectedId || (tabsList[0] && tabsList[0].id);
    var wrap = makeEl('div', 'mtn-tabs');
    var tablist = makeEl('div', 'mtn-tabs__list', { role: 'tablist' });
    var panelsRow = makeEl('div', 'mtn-tabs__panels');
    var btns = {}, panels = {};

    tabsList.forEach(function (t) {
      var tabId = 'mtn-tab-' + t.id;
      var panelId = 'mtn-panel-' + t.id;
      var b = makeEl('button', 'mtn-tabs__btn', {
        type: 'button',
        role: 'tab',
        id: tabId,
        'aria-controls': panelId,
        'aria-selected': t.id === current ? 'true' : 'false',
        tabindex: t.id === current ? '0' : '-1'
      });
      setText(b, t.label);
      btns[t.id] = b;
      tablist.appendChild(b);

      var p = makeEl('div', 'mtn-tabs__panel', {
        role: 'tabpanel',
        id: panelId,
        'aria-labelledby': tabId,
        tabindex: '0',
        hidden: t.id === current ? null : ''
      });
      if (t.panel instanceof Node) p.appendChild(t.panel);
      else if (t.panel) setText(p, t.panel);
      panels[t.id] = p;
      panelsRow.appendChild(p);

      b.addEventListener('click', function () { select(t.id); });
    });

    tablist.addEventListener('keydown', function (e) {
      var ids = tabsList.map(function (t) { return t.id; });
      var idx = ids.indexOf(current);
      if (idx < 0) return;
      var next = null;
      if (e.key === 'ArrowRight') next = ids[(idx + 1) % ids.length];
      else if (e.key === 'ArrowLeft') next = ids[(idx - 1 + ids.length) % ids.length];
      else if (e.key === 'Home') next = ids[0];
      else if (e.key === 'End') next = ids[ids.length - 1];
      if (next != null) {
        e.preventDefault();
        select(next);
        btns[next].focus();
      }
    });

    function select(id) {
      if (!btns[id]) return;
      current = id;
      Object.keys(btns).forEach(function (k) {
        var on = k === id;
        btns[k].setAttribute('aria-selected', on ? 'true' : 'false');
        btns[k].setAttribute('tabindex', on ? '0' : '-1');
        if (on) panels[k].removeAttribute('hidden');
        else panels[k].setAttribute('hidden', '');
      });
      if (typeof spec.onChange === 'function') spec.onChange(id);
    }

    wrap.appendChild(tablist);
    wrap.appendChild(panelsRow);
    return { node: wrap, select: select };
  }

  return {
    button: button,
    card: card,
    formGroup: formGroup,
    errorCard: errorCard,
    emptyState: emptyState,
    toast: toast,
    modal: modal,
    breadcrumb: breadcrumb,
    tabs: tabs
  };
}));
