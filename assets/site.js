  // Opt out of the browser's automatic scroll restoration so that navigating
  // to a new page from low on the previous page doesn't leave the new page
  // scrolled to an arbitrary offset. We handle hash targets ourselves below;
  // for all other loads, start at the top.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.addEventListener('pageshow', () => {
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  });

  // Booking URL is now hard-coded on each .js-book anchor so that CTAs work
  // even with JavaScript disabled. This block is intentionally small.
  const EMAIL = 'don@muntin.digital';
  document.querySelectorAll('.js-email').forEach((el) => {
    el.setAttribute('href', 'mailto:' + EMAIL);
    el.textContent = EMAIL;
  });

  // Nav background on scroll
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle with focus trap + inert background
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('mobileMenu');
  const mainEl = document.getElementById('main');
  if (toggle && menu) {
    let lastFocused = null;
    const getFocusables = () =>
      menu.querySelectorAll('a[href], button:not([disabled])');
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
      nav.classList.toggle('menu-open', open);
      if (mainEl) {
        if (open) mainEl.setAttribute('inert', '');
        else mainEl.removeAttribute('inert');
      }
      if (open) {
        lastFocused = document.activeElement;
        const first = getFocusables()[0];
        if (first) first.focus();
      } else if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };
    toggle.addEventListener('click', () => {
      setOpen(menu.hidden);
    });
    menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (menu.hidden) return;
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'Tab') {
        const f = Array.from(getFocusables());
        if (!f.length) return;
        const first = f[0];
        const last  = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }

  // Move focus to target section on in-page anchor clicks (SR + keyboard users)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      // Let native smooth scroll run, then move focus without re-scrolling
      setTimeout(() => {
        const prev = target.getAttribute('tabindex');
        if (prev === null) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (prev === null) {
          target.addEventListener('blur', function onBlur() {
            target.removeAttribute('tabindex');
            target.removeEventListener('blur', onBlur);
          });
        }
      }, 400);
    });
  });

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // ============================================================
  // Intake form — validation + async Formspree submission
  // ============================================================
  const intakeForm = document.getElementById('intakeForm');
  const formSuccess = document.getElementById('formSuccess');
  const formSubmit = document.getElementById('formSubmit');

  if (intakeForm) {
    const servicesGroup = document.getElementById('f-services-group');
    const servicesError = document.getElementById('f-services-error');
    const serviceChecks = intakeForm.querySelectorAll('input[name="services"]');
    const submitError   = document.getElementById('formSubmitError');

    // Real-time validation on blur
    intakeForm.querySelectorAll('input[required], textarea[required]').forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('invalid')) validateField(field);
      });
    });

    // Clear checkbox-group error as soon as the user selects one
    serviceChecks.forEach((cb) => {
      cb.addEventListener('change', () => {
        if (intakeForm.querySelectorAll('input[name="services"]:checked').length > 0) {
          clearServicesError();
        }
      });
    });

    // Toggle the submit button's .ready state whenever the form's
    // completeness could have changed. This does not run validation or
    // surface any errors — it just signals visually that the button is
    // ready to accept a submit.
    function checkFormReady() {
      if (!formSubmit) return;
      const required = intakeForm.querySelectorAll('input[required], textarea[required]');
      let allFilled = true;
      for (const f of required) {
        if (!f.value.trim()) { allFilled = false; break; }
        if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) {
          allFilled = false; break;
        }
      }
      const hasService = intakeForm.querySelectorAll('input[name="services"]:checked').length > 0;
      formSubmit.classList.toggle('ready', allFilled && hasService);
    }
    intakeForm.querySelectorAll('input, textarea, select').forEach((field) => {
      field.addEventListener('input', checkFormReady);
      field.addEventListener('change', checkFormReady);
    });
    checkFormReady();

    function validateField(field) {
      const errId = field.getAttribute('aria-describedby');
      const err = errId ? document.getElementById(errId) : field.parentElement.querySelector('.field-error');
      let msg = '';
      if (field.required && !field.value.trim()) {
        msg = 'This field is required.';
      } else if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        msg = 'Please enter a valid email address.';
      }
      field.classList.toggle('invalid', !!msg);
      if (msg) {
        field.setAttribute('aria-invalid', 'true');
      } else {
        field.removeAttribute('aria-invalid');
      }
      if (err) err.textContent = msg;
      return !msg;
    }

    function validateServices() {
      const anyChecked = intakeForm.querySelectorAll('input[name="services"]:checked').length > 0;
      if (!anyChecked) {
        servicesGroup.classList.add('invalid');
        servicesGroup.setAttribute('aria-invalid', 'true');
        if (servicesError) servicesError.textContent = 'Please select at least one option.';
      } else {
        clearServicesError();
      }
      return anyChecked;
    }

    function clearServicesError() {
      servicesGroup.classList.remove('invalid');
      servicesGroup.removeAttribute('aria-invalid');
      if (servicesError) servicesError.textContent = '';
    }

    function showSubmitError(msg) {
      if (!submitError) return;
      submitError.textContent = msg;
      submitError.hidden = false;
    }

    function clearSubmitError() {
      if (!submitError) return;
      submitError.textContent = '';
      submitError.hidden = true;
    }

    intakeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearSubmitError();

      // Validate all required fields
      let valid = true;
      intakeForm.querySelectorAll('input[required], textarea[required]').forEach((f) => {
        if (!validateField(f)) valid = false;
      });

      // Validate checkbox group
      if (!validateServices()) valid = false;

      if (!valid) {
        // Focus the first invalid control (includes the checkbox group)
        const firstInvalidField = intakeForm.querySelector('input[aria-invalid="true"], textarea[aria-invalid="true"]');
        if (firstInvalidField) {
          firstInvalidField.focus();
        } else if (servicesGroup && servicesGroup.classList.contains('invalid')) {
          const firstBox = serviceChecks[0];
          if (firstBox) firstBox.focus();
        }
        return;
      }

      // Submit
      formSubmit.classList.add('is-loading');
      formSubmit.disabled = true;

      try {
        const data = new FormData(intakeForm);
        const res = await fetch(intakeForm.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' },
        });
        // Try to parse the response body as JSON regardless of status.
        // The Cloudflare Worker at /api/intake always responds with a
        // structured { ok, status | error } payload, so a 400 validation
        // failure surfaces a real "please enter a valid email" message
        // to the user instead of a generic "something went wrong".
        let body = null;
        try { body = await res.json(); } catch (e) { /* non-JSON body */ }
        if (res.ok && body && body.ok) {
          intakeForm.hidden = true;
          formSuccess.hidden = false;
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const heading = document.getElementById('formSuccessHeading');
          if (heading) setTimeout(() => heading.focus(), 300);
        } else {
          const msg = (body && body.error)
            ? body.error
            : 'Something went wrong. Please try again or email don@muntin.digital directly.';
          throw new Error(msg);
        }
      } catch (err) {
        formSubmit.classList.remove('is-loading');
        formSubmit.disabled = false;
        showSubmitError(
          (err && err.message) ||
          'Something went wrong. Please try again or email don@muntin.digital directly.'
        );
      }
    });
  }

  // Subtle tilt on the hero window (desktop only, respects reduced motion).
  // Caches getBoundingClientRect() between invalidating events instead of
  // reading it on every mousemove — the previous implementation caused a
  // read-after-write layout thrash flagged by Lighthouse as "Forced reflow".
  // rAF batches the transform write so we never force sync layout inside
  // the mousemove handler.
  const win = document.querySelector('.window');
  const canHover = window.matchMedia('(hover: hover)').matches;
  const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (win && canHover && !reduced) {
    let cachedRect = null;
    let rafPending = false;
    const refreshRect = () => { cachedRect = win.getBoundingClientRect(); };
    win.addEventListener('mouseenter', refreshRect);
    window.addEventListener('resize', refreshRect, { passive: true });
    window.addEventListener('scroll', refreshRect, { passive: true });
    win.addEventListener('mousemove', (e) => {
      if (!cachedRect || rafPending) return;
      rafPending = true;
      const cx = e.clientX;
      const cy = e.clientY;
      requestAnimationFrame(() => {
        rafPending = false;
        const r = cachedRect;
        if (!r) return;
        const x = (cx - r.left) / r.width - 0.5;
        const y = (cy - r.top) / r.height - 0.5;
        win.style.transform = `perspective(1200px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg) translateZ(0)`;
      });
    });
    win.addEventListener('mouseleave', () => {
      win.style.transform = 'perspective(1200px) rotateX(0) rotateY(0)';
    });
  }

  /* ============ READ ALOUD ============ */
  /* Uses the browser's native SpeechSynthesis API to read blog posts
   * out loud. Free, no backend, no third-party service. Auto-attaches
   * when the current page has both a #listen-btn button and an
   * #post-body article container.
   */
  (function initReadAloud(){
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const listenBtn = document.getElementById('listen-btn');
    const postBody  = document.getElementById('post-body');
    if (!listenBtn || !postBody) return;

    let state = 'idle'; // 'idle' | 'playing' | 'paused'
    let chunks = [];
    let currentIndex = 0;
    let currentElement = null;
    let heartbeatTimer = null;

    // Chrome has a long-standing bug where speechSynthesis will silently
    // stop after ~15 seconds of continuous speech. Ping pause/resume on
    // an interval to keep it alive during long utterances.
    function startHeartbeat() {
      stopHeartbeat();
      heartbeatTimer = setInterval(() => {
        if (state === 'playing' && window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    }
    function stopHeartbeat() {
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    }

    function collectChunks() {
      const nodes = postBody.querySelectorAll('h2, h3, p, li, .pull-quote');
      chunks = [];
      nodes.forEach((el) => {
        // Skip anything inside a non-readable container
        if (el.closest('.inline-cta')) return;
        if (el.closest('figure'))       return;
        if (el.closest('.further-reading')) return;
        if (el.closest('.sources'))     return;
        const raw = (el.innerText || el.textContent || '').trim();
        if (raw.length < 2) return;
        chunks.push({ text: raw, element: el });
      });
    }

    function updateButtonLabel(label) {
      const textEl = listenBtn.querySelector('.listen-label');
      if (textEl) textEl.textContent = label;
      listenBtn.setAttribute('data-state', state);
      listenBtn.setAttribute('aria-pressed', state === 'playing' ? 'true' : 'false');
    }

    function setCurrent(el) {
      if (currentElement) currentElement.classList.remove('is-reading');
      currentElement = el;
      if (el) {
        el.classList.add('is-reading');
        // Scroll the current paragraph into view smoothly, but only if
        // the user hasn't scrolled away from the reading area.
        const rect = el.getBoundingClientRect();
        const isOutOfView = rect.top < 80 || rect.bottom > window.innerHeight - 80;
        if (isOutOfView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || !voices.length) return null;
      // Prefer natural-sounding English voices if the OS exposes them
      return voices.find((v) => v.lang && v.lang.startsWith('en') && /Natural|Google|Samantha|Alex|Daniel|Enhanced/i.test(v.name))
          || voices.find((v) => v.lang && v.lang.startsWith('en'))
          || null;
    }

    function speakChunk(idx) {
      if (idx >= chunks.length) {
        finishPlayback();
        if (window.plausible) window.plausible('Post Listened: Completed');
        return;
      }
      currentIndex = idx;
      const chunk = chunks[idx];
      setCurrent(chunk.element);

      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.rate   = 1.0;
      utterance.pitch  = 1.0;
      utterance.volume = 1.0;
      const voice = pickVoice();
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        if (state === 'playing') speakChunk(idx + 1);
      };
      utterance.onerror = (e) => {
        console.warn('[readAloud] utterance error', e);
        if (state === 'playing') speakChunk(idx + 1);
      };

      window.speechSynthesis.speak(utterance);
    }

    function startPlayback() {
      if (state === 'paused') {
        window.speechSynthesis.resume();
        state = 'playing';
        updateButtonLabel('Pause');
        startHeartbeat();
        return;
      }
      collectChunks();
      if (!chunks.length) return;
      state = 'playing';
      updateButtonLabel('Pause');
      startHeartbeat();
      speakChunk(0);
      if (window.plausible) window.plausible('Post Listened');
    }

    function pausePlayback() {
      if (state !== 'playing') return;
      window.speechSynthesis.pause();
      state = 'paused';
      updateButtonLabel('Resume');
      stopHeartbeat();
    }

    function finishPlayback() {
      window.speechSynthesis.cancel();
      state = 'idle';
      currentIndex = 0;
      setCurrent(null);
      updateButtonLabel('Listen to this article');
      stopHeartbeat();
    }

    listenBtn.addEventListener('click', () => {
      if      (state === 'idle')    startPlayback();
      else if (state === 'playing') pausePlayback();
      else if (state === 'paused')  startPlayback();
    });

    // Clean up if the visitor navigates away mid-read
    window.addEventListener('beforeunload', () => {
      if (state !== 'idle') window.speechSynthesis.cancel();
    });

    // Some browsers load the voices list asynchronously
    if (window.speechSynthesis.getVoices().length === 0 && 'onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => { /* voices now ready */ };
    }

    // Expose minimal public surface for any custom stop button
    window.MuntinReadAloud = { stop: finishPlayback };
  })();

  /* ============ INTERACTIVE CHECKLIST ============
   * Progressive-enhancement layer for the restaurant + wellness
   * checklists. Both pages share this block; page-specific concerns
   * (storage key, total, share text) come from data-* attributes on
   * <body> and on individual items, so this file stays generic.
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

    /* Proportional bands — ratio-based so the same thresholds work
     * on the 24-item restaurant checklist and the 20-item wellness
     * one, AND continue to work when the subtype filter trims the
     * denominator. Thresholds match the copy on the three
     * "Score yourself" cards at the bottom of each page. */
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

    function itemNAList(item) {
      return (item.getAttribute('data-na') || '').split(/\s+/).filter(Boolean);
    }
    function isItemNA(item) {
      if (activeSubtype === 'all') return false;
      return itemNAList(item).indexOf(activeSubtype) !== -1;
    }

    function applySubtypeState() {
      items.forEach((item) => {
        const na = isItemNA(item);
        item.classList.toggle('is-na', na);
        const input = item.querySelector('.check-toggle');
        if (!input) return;
        input.disabled = na;
        if (na && input.checked) input.checked = false;
      });
      if (tailorPills) {
        tailorPills.querySelectorAll('.tailor-pill').forEach((p) => {
          p.classList.toggle('is-active', p.dataset.subtype === activeSubtype);
        });
      }
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

    /* ---- Share dropdown ---- */
    const shareBtn = document.getElementById('shareBtn');
    const shareMenu = document.getElementById('shareMenu');
    const copyBtn = document.getElementById('copyLinkBtn');

    // Derive share text from the page so one block serves both the
    // restaurant and wellness pages. Total is the raw item count (not
    // the subtype-filtered total), to match the canonical headline.
    const shareTitle = (document.title || '').split(' | ')[0] || 'Muntin Digital Checklist';
    const shareUrl = window.location.origin + window.location.pathname;
    const shareText = items.length + ' things your ' + kind + ' website should do in 2026. Free, takes 10 minutes.';

    function closeShare() {
      if (!shareMenu || !shareBtn) return;
      shareMenu.hidden = true;
      shareBtn.setAttribute('aria-expanded', 'false');
    }
    function openShare() {
      if (!shareMenu || !shareBtn) return;
      shareMenu.hidden = false;
      shareBtn.setAttribute('aria-expanded', 'true');
    }
    if (shareBtn && shareMenu) {
      shareBtn.addEventListener('click', (e) => {
        // Prevent the document-level "click outside" listener from
        // immediately closing the menu on the same tick.
        e.stopPropagation();
        // On mobile, prefer the native share sheet if available.
        // If the user dismisses it (AbortError) or it isn't supported,
        // fall back to the custom dropdown.
        if (navigator.share && window.matchMedia('(max-width: 820px)').matches) {
          navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          }).catch(() => { /* user dismissed — do nothing */ });
          return;
        }
        if (shareMenu.hidden) openShare();
        else closeShare();
      });
      // Close when clicking outside. Use closest() so clicks on the
      // SVG icon INSIDE the button (where e.target is the <svg> or
      // <path>, not the button itself) still count as "on the button"
      // and don't accidentally close a just-opened menu.
      document.addEventListener('click', (e) => {
        if (shareMenu.hidden) return;
        const clickedDropdown = e.target.closest && e.target.closest('#shareDropdown');
        if (!clickedDropdown) closeShare();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !shareMenu.hidden) {
          closeShare();
          shareBtn.focus();
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          const original = copyBtn.textContent;
          copyBtn.textContent = 'Link copied ✓';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = original;
            copyBtn.classList.remove('copied');
            closeShare();
          }, 1500);
        } catch (e) {
          copyBtn.textContent = 'Copy failed — select the URL manually';
        }
      });
    }
  })();
