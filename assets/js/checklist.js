// Interactive checklist + Phase-M6 popover — extracted from
// assets/site.js as part of the JS module split (PR-B).
//
// Loaded only on the 2 checklist pages (EN + ES) — every OTHER page
// on the site dropped this 437-line block (~5 KB gzipped) when this
// module shipped. The two IIFEs early-return on missing markup, so
// they cost nothing extra on the few pages where checklist.js loads
// but no .check-item exists (none today, but future-proof).
//
// External dependencies:
//   - window.plausible — analytics events (optional; checked at use)
//   - i18n() helper — duplicated below so this file loads independently

(function () {
  'use strict';

  // Duplicated from site.js so this module loads independently. Same
  // contract as the original: dotted key + English literal as fallback.
  const i18n = (key, en) => {
    const d = (typeof window !== 'undefined' && window.__i18n) || null;
    return (d && typeof d[key] === 'string') ? d[key] : en;
  };

  /* ============ INTERACTIVE CHECKLIST ============
   * Progressive-enhancement layer for the restaurant checklist page.
   * Page-specific concerns (storage key, total, share text) come
   * from data-* attributes on <body> and on individual items, so
   * this file stays generic enough to host a second vertical later
   * without further refactoring if we re-expand.
   *
   * Features, roughly in order of visibility to the user:
   *   1. Persistent checkbox state (localStorage, per page).
   *   2. Sticky progress bar with band-aware color.
   *   3. Floating score pill with animated ring + count.
   *   4. Per-category counters in the TOC and each cat-header.
   *   5. Subtype "Tailor to" filter — items with data-na="foo bar"
   *      dim and drop out of the score denominator when foo or bar
   *      is selected.
   *   6. "Compact" and "Hide done" toggles on the progress toolbar.
   *   7. First-visit tip under the progress bar (dismissible).
   *   8. "You're here" ribbon on the matching Score-yourself card.
   *   9. Completion celebration + Plausible event.
   *  10. Share dropdown with native-share fallback on small screens.
   */
  (function initChecklist() {
    const items = Array.from(document.querySelectorAll('.check-item[data-check-id]'));
    if (!items.length) return;

    const body = document.body;
    const kind = body.dataset.checklistKind || 'restaurant';
    const STORAGE_KEY = body.dataset.checklistKey || ('muntin:checklist:' + kind);
    const SUBTYPE_KEY = STORAGE_KEY + ':subtype';
    const HIDE_KEY    = STORAGE_KEY + ':hide';
    const COMPACT_KEY = STORAGE_KEY + ':compact';
    const HINT_KEY    = STORAGE_KEY + ':hint-dismissed';

    const progressSection = document.querySelector('.checklist-progress-section');
    const progressFill    = document.getElementById('progressFill');
    const progressCountEl = document.getElementById('progressCount');
    const resetBtn        = document.getElementById('progressReset');
    const celebration     = document.getElementById('checklistCelebration');
    const tailorPills     = document.getElementById('tailorPills');
    const toggleCompact   = document.getElementById('toggleCompact');
    const toggleHide      = document.getElementById('toggleHide');
    const firstHint       = document.getElementById('firstHint');
    const firstHintDismiss= document.getElementById('firstHintDismiss');
    const scoreBands      = document.getElementById('scoreBands');

    /* ---- Floating score pill ---- */
    const pill      = document.getElementById('scorePill');
    const pillBtn   = document.getElementById('scorePillBtn');
    const pillNum   = document.getElementById('scorePillNum');
    const pillLabel = document.getElementById('scorePillLabel');
    const pillRing  = pill ? pill.querySelector('.score-ring-fill') : null;
    const pillTotalEl = pill ? pill.querySelector('.score-pill-total') : null;
    const RING_CIRC = 2 * Math.PI * 19;
    if (pill) {
      pill.hidden = false;
      requestAnimationFrame(() => pill.classList.add('is-visible'));
    }

    /* Proportional bands — ratio-based so the same thresholds still
     * work when the subtype filter trims the denominator. Thresholds
     * match the copy on the three "Score yourself" cards at the
     * bottom of the checklist page. */
    function scoreBandFor(done, total) {
      if (done === 0 || total === 0)   return { band: 'idle',     label: 'Not started' };
      if (done === total)              return { band: 'complete', label: 'All ' + total + ' — nice' };
      const ratio = done / total;
      if (ratio < 1 / 3)               return { band: 'failing',  label: 'Failing' };
      if (ratio < 2 / 3)               return { band: 'middling', label: 'Middling' };
      return                                 { band: 'solid',    label: 'Solid' };
    }

    function safeGet(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function safeSet(key, val) {
      try { localStorage.setItem(key, val); } catch (e) { /* quota/private */ }
    }
    function loadState() {
      const raw = safeGet(STORAGE_KEY);
      try { return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
    }
    function saveState(state) {
      safeSet(STORAGE_KEY, JSON.stringify(state));
    }

    const state = loadState();
    let activeSubtype = safeGet(SUBTYPE_KEY) || 'all';

    /* ---- Subtype-aware voice ----
     * Each subtype has its own noun (singular + plural) so the
     * on-page copy, the N/A badge, and the hidden form field that
     * travels with the PDF-request email all read right for the
     * kind of business the user picked. `all` is the generic
     * default that matches the HTML as written.
     *
     * New subtypes: add an entry here + a data-subtype="..." pill
     * in the page + (optionally) a matching entry on the server in
     * src/lib/templates.js -> checklistKind(body) so the email
     * auto-reply voices the same noun. */
    const RESTAURANT_VOICE = {
      'all':          { noun: 'restaurant',           nounPlural: 'restaurant',          naLabel: 'N/A for your kind' },
      'fine-dining':  { noun: 'restaurant',           nounPlural: 'fine-dining',         naLabel: 'N/A for fine dining' },
      'casual':       { noun: 'restaurant',           nounPlural: 'casual',              naLabel: 'N/A for casual spots' },
      'fast-casual':  { noun: 'spot',                 nounPlural: 'fast-casual',         naLabel: 'N/A for fast-casuals' },
      'bar':          { noun: 'bar',                  nounPlural: 'bar & cocktail',      naLabel: 'N/A for bars' },
      'cafe':         { noun: 'cafe',                 nounPlural: 'cafe & bakery',       naLabel: 'N/A for cafes' },
      'truck':        { noun: 'truck',                nounPlural: 'food truck & pop-up', naLabel: 'N/A for food trucks' },
    };
    // Wellness voice map retired alongside the wellness checklist.
    // VOICE_MAP stays as a variable (rather than inlining RESTAURANT_VOICE
    // everywhere) so a future vertical can plug back in with one line.
    const VOICE_MAP = RESTAURANT_VOICE;

    function currentVoice() {
      return VOICE_MAP[activeSubtype] || VOICE_MAP.all;
    }

    function itemNAList(item) {
      return (item.getAttribute('data-na') || '').split(/\s+/).filter(Boolean);
    }
    function isItemNA(item) {
      if (activeSubtype === 'all') return false;
      return itemNAList(item).indexOf(activeSubtype) !== -1;
    }

    function applySubtypeState() {
      const voice = currentVoice();

      items.forEach((item) => {
        const na = isItemNA(item);
        item.classList.toggle('is-na', na);
        const input = item.querySelector('.check-toggle');
        if (input) {
          input.disabled = na;
          if (na && input.checked) input.checked = false;
        }
        if (na) item.setAttribute('data-na-label', voice.naLabel);
        else    item.removeAttribute('data-na-label');
      });

      if (tailorPills) {
        tailorPills.querySelectorAll('.tailor-pill').forEach((p) => {
          p.classList.toggle('is-active', p.dataset.subtype === activeSubtype);
        });
      }

      // Swap every tokenised span on the page to the subtype's noun.
      // The default text in the HTML is already the 'all'-subtype
      // value, so this is effectively idempotent when subtype === all.
      document.querySelectorAll('[data-token]').forEach((el) => {
        const token = el.dataset.token;
        const value = voice[token];
        if (typeof value === 'string') el.textContent = value;
      });

      // Mirror the active subtype into the hidden form field so the
      // worker's auto-reply can personalize by subtype, not just kind.
      const hiddenSubtype = document.getElementById('cl-subtype');
      if (hiddenSubtype) hiddenSubtype.value = activeSubtype;

      // Advertise the active subtype on <body> for CSS hooks.
      body.dataset.activeSubtype = activeSubtype;
    }

    function countActive() {
      let total = 0, done = 0;
      items.forEach((item) => {
        if (isItemNA(item)) return;
        total++;
        const input = item.querySelector('.check-toggle');
        if (input && input.checked) done++;
      });
      return { total: total, done: done };
    }

    function countInBlock(id) {
      const block = document.getElementById(id);
      if (!block) return { total: 0, done: 0 };
      let total = 0, done = 0;
      block.querySelectorAll('.check-item').forEach((item) => {
        if (item.classList.contains('is-na')) return;
        total++;
        const input = item.querySelector('.check-toggle');
        if (input && input.checked) done++;
      });
      return { total: total, done: done };
    }

    function updateCatCounters() {
      document.querySelectorAll('[data-cat-count]').forEach((el) => {
        const { total, done } = countInBlock(el.dataset.catCount);
        el.textContent = done + ' / ' + total;
        el.classList.toggle('is-complete', total > 0 && done === total);
      });
      document.querySelectorAll('[data-cat-done]').forEach((el) => {
        const { total, done } = countInBlock(el.dataset.catDone);
        el.textContent = done + ' / ' + total + ' done';
        el.classList.toggle('is-complete', total > 0 && done === total);
      });
    }

    function updateProgress() {
      const { total, done } = countActive();
      const pct = total ? Math.round((done / total) * 100) : 0;

      if (progressFill) progressFill.style.width = pct + '%';
      if (progressCountEl) {
        const html = '<strong>' + done + '</strong> of ' + total + ' complete';
        if (progressCountEl.innerHTML !== html) progressCountEl.innerHTML = html;
      }
      if (resetBtn) resetBtn.hidden = done === 0;

      const { band, label } = scoreBandFor(done, total);
      if (progressSection) progressSection.dataset.band = band;

      if (celebration) {
        const isDone = done === total && total > 0;
        celebration.hidden = !isDone;
        if (isDone && !celebration.dataset.fired && window.plausible) {
          celebration.dataset.fired = '1';
          window.plausible('Checklist Completed', { props: { kind: kind, subtype: activeSubtype } });
        }
      }

      if (scoreBands) {
        scoreBands.querySelectorAll('.service[data-band]').forEach((card) => {
          const active = done > 0 && card.dataset.band === band;
          card.classList.toggle('is-current-band', active);
        });
      }

      if (pill) {
        pill.dataset.band = band;
        if (pillLabel) pillLabel.textContent = label;
        if (pillTotalEl) pillTotalEl.textContent = '/' + total;
        if (pillBtn) {
          pillBtn.setAttribute(
            'aria-label',
            'Jump to checklist progress bar. ' + done + ' of ' + total + ' complete. ' + label + '.'
          );
        }
        if (pillRing) {
          const offset = total ? RING_CIRC * (1 - (done / total)) : RING_CIRC;
          pillRing.style.strokeDashoffset = String(offset);
        }
        if (pillNum) {
          const prev = pillNum.textContent;
          const next = String(done);
          if (prev !== next) {
            pillNum.textContent = next;
            pillNum.classList.remove('bumping');
            void pillNum.offsetWidth;
            pillNum.classList.add('bumping');
          }
        }
      }

      updateCatCounters();
    }

    /* ---- Progress toolbar toggles ---- */
    function bindToggle(btn, bodyClass, storageKey) {
      if (!btn) return;
      const on = safeGet(storageKey) === '1';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      body.classList.toggle(bodyClass, on);
      btn.addEventListener('click', () => {
        const next = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', next ? 'true' : 'false');
        body.classList.toggle(bodyClass, next);
        safeSet(storageKey, next ? '1' : '0');
      });
    }
    bindToggle(toggleCompact, 'compact-mode', COMPACT_KEY);
    bindToggle(toggleHide,    'hide-checked', HIDE_KEY);

    /* ---- First-visit hint ---- */
    if (firstHint && safeGet(HINT_KEY) !== '1') {
      firstHint.hidden = false;
    }
    if (firstHintDismiss) {
      firstHintDismiss.addEventListener('click', () => {
        if (firstHint) firstHint.hidden = true;
        safeSet(HINT_KEY, '1');
      });
    }

    /* ---- Subtype pills ---- */
    if (tailorPills) {
      tailorPills.addEventListener('click', (e) => {
        const btn = e.target.closest('.tailor-pill');
        if (!btn) return;
        const next = btn.dataset.subtype || 'all';
        if (next === activeSubtype) return;
        activeSubtype = next;
        safeSet(SUBTYPE_KEY, next);
        applySubtypeState();
        updateProgress();
        if (window.plausible) {
          window.plausible('Checklist Subtype', { props: { kind: kind, subtype: next } });
        }
      });
    }

    if (pillBtn) {
      pillBtn.addEventListener('click', () => {
        const section = document.querySelector('.checklist-progress-section');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    /* ---- Hydrate checkbox state ---- */
    items.forEach((item) => {
      const id = item.getAttribute('data-check-id');
      const input = item.querySelector('.check-toggle');
      if (!input) return;
      if (state[id]) input.checked = true;
      input.addEventListener('change', () => {
        if (input.disabled) { input.checked = false; return; }
        if (input.checked) state[id] = 1;
        else delete state[id];
        saveState(state);
        updateProgress();
      });
    });

    applySubtypeState();
    updateProgress();

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        items.forEach((item) => {
          const input = item.querySelector('.check-toggle');
          if (input) input.checked = false;
        });
        Object.keys(state).forEach((k) => delete state[k]);
        saveState(state);
        updateProgress();
      });
    }

    // Share widget used to live inline here with hand-coded share URLs
    // and element IDs. It's now a generic [data-share] component wired up
    // by initShare() at the end of this file, so the checklist uses the
    // same code path as the blog posts.
  })();

  /* ============ PHASE M6: Checklist Learn-more popover ============
   * Wires the .learn-more-btn buttons on /learn/checklists/
   * restaurant-website-checklist/ to the single shared <dialog id="checklistPopover">
   * added in Sprint M5. Click a Learn-more button, the handler reads
   * the button's data-popover-* attributes, populates the dialog's
   * title / body / glossary link / optional audit link, and calls
   * dialog.showModal(). Escape-to-close is native to <dialog>;
   * click-outside (backdrop) is wired manually because the native
   * backdrop swallows clicks silently by default. Focus returns to
   * the originating button on close.
   */
  (function initChecklistPopover() {
    const dialog = document.getElementById('checklistPopover');
    if (!dialog || typeof dialog.showModal !== 'function') return; // SSR/feature-missing: no-op.

    const titleEl    = document.getElementById('checklistPopoverTitle');
    const bodyEl     = document.getElementById('checklistPopoverBody');
    const glossaryEl = document.getElementById('checklistPopoverGlossary');
    const auditEl    = document.getElementById('checklistPopoverAudit');
    const closeBtn   = dialog.querySelector('.checklist-popover-close');
    let lastOpener   = null;

    function openPopover(btn) {
      const title      = btn.getAttribute('data-popover-title')    || 'Learn more';
      const body       = btn.getAttribute('data-popover-body')     || '';
      const glossaryId = btn.getAttribute('data-popover-glossary') || '';
      const auditTo    = btn.getAttribute('data-popover-audit')    || '';
      if (titleEl) titleEl.textContent = title;
      if (bodyEl)  bodyEl.textContent  = body;
      if (glossaryEl) {
        glossaryEl.href = glossaryId
          ? '/glossary/#' + glossaryId
          : '/glossary/';
      }
      if (auditEl) {
        if (auditTo) {
          auditEl.href   = auditTo === '1' ? '/tools/audits/restaurant/' : auditTo;
          auditEl.hidden = false;
        } else {
          auditEl.hidden = true;
        }
      }
      lastOpener = btn;
      dialog.showModal();
      if (window.plausible) window.plausible('Checklist Learn-more', { props: { id: btn.getAttribute('data-popover-glossary') || 'unknown' } });
    }

    function closePopover() {
      if (dialog.open) dialog.close();
    }

    // Delegated handler — one listener on the document handles every
    // checklist item's Learn-more button, including items added
    // dynamically (e.g. future subtype filter). Attached in the
    // CAPTURE phase so it fires BEFORE the enclosing <label>'s
    // default checkbox-toggle behavior: each .check-item is a
    // <label> with a nested <input type=checkbox>, and without
    // intercepting early, clicking Learn-more would also flip the
    // item's completion state.
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('.learn-more-btn');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      openPopover(btn);
    }, true);

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closePopover();
      });
    }

    // Click-outside (on the backdrop) closes. We detect this by
    // checking whether the click landed on the dialog element itself
    // (the backdrop fires a click on the dialog node) rather than on
    // its .checklist-popover-inner child.
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closePopover();
    });

    // Return focus to the originating button on close, so keyboard
    // users land back where they were.
    dialog.addEventListener('close', () => {
      if (lastOpener && typeof lastOpener.focus === 'function') {
        lastOpener.focus();
      }
      lastOpener = null;
    });
  })();
})();
