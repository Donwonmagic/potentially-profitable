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
        if (res.ok) {
          intakeForm.hidden = true;
          formSuccess.hidden = false;
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const heading = document.getElementById('formSuccessHeading');
          if (heading) setTimeout(() => heading.focus(), 300);
        } else {
          throw new Error('Form submission failed');
        }
      } catch (err) {
        formSubmit.classList.remove('is-loading');
        formSubmit.disabled = false;
        showSubmitError('Something went wrong. Please try again or email don@muntin.digital directly.');
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
