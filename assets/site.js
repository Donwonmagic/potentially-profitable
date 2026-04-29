  // i18n runtime: a tiny dictionary lookup with English literals as the
  // fallback. window.__i18n is populated on non-default-locale pages by
  // a <script> inside the nav partial that sync-includes.mjs stamps
  // from _includes/i18n.<locale>.json at build time. On English pages
  // there is no __i18n, so every i18n() call returns the literal and
  // the site behaves exactly as it did pre-i18n.
  //
  // Convention: keys are dotted ("nav.close_menu", "form.invalid_email")
  // and the English literal is always passed as the second argument so
  // a missing key is a one-language regression, not a broken UI.
  //
  // Named i18n() (not t()) to avoid shadowing collisions — several
  // nested functions in this file reuse `t` as a local time variable.
  //
  // SCOPE: this helper localizes VISUAL UI strings (aria-labels, form
  // errors, audio player controls, etc.) across the whole site,
  // including blog pages. The audio-narration VOICE choice (the
  // .listen-voice <select>) is intentionally INDEPENDENT of the page
  // locale — a Spanish reader may prefer an English narrator and vice
  // versa. See the block comment at the listen dock / card definitions.
  const i18n = (key, en) => {
    const d = (typeof window !== 'undefined' && window.__i18n) || null;
    return (d && typeof d[key] === 'string') ? d[key] : en;
  };

  // Language switcher: clicking the "Español" / "English" anchor in the
  // nav sets a functional cookie so the server can prefer the chosen
  // locale on first-load hints (see src/worker.js) and so the user's
  // preference survives across sessions. The anchor's href still points
  // to the counterpart page, so JS-off visitors just navigate there;
  // JS-on visitors additionally get the cookie write. The cookie is
  // strictly functional (not tracking) — disclosed in /cookies.html.
  document.querySelectorAll('.js-lang-switch').forEach((el) => {
    el.addEventListener('click', () => {
      const locale = el.getAttribute('data-set-locale');
      if (!locale) return;
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `md_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    });
  });

  // Opt-in Spanish banner. Shown only on English pages when the
  // reader's browser prefers Spanish and they haven't already set
  // a locale preference or dismissed the banner. Uses
  // navigator.languages for the detection (runs client-side with
  // no server involvement required). The Worker's x-locale-hint
  // header from src/worker.js is the complementary server-side
  // signal for caching/analytics; the banner itself works off
  // the browser-exposed language list.
  //
  // Dismissal is sticky for 30 days via a simple functional cookie
  // so visitors who don't want Spanish aren't nagged on every page.
  const hint = document.getElementById('langHint');
  if (hint) {
    const lang = (document.documentElement.lang || 'en').toLowerCase();
    const cookies = document.cookie || '';
    const hasLocalePref  = /(?:^|;\s*)md_locale=/.test(cookies);
    const hasDismissed   = /(?:^|;\s*)md_hint_dismissed=/.test(cookies);
    const navLangs       = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || ''];
    const prefersSpanish = navLangs.some((l) => String(l).toLowerCase().startsWith('es'));
    if (lang === 'en' && prefersSpanish && !hasLocalePref && !hasDismissed) {
      hint.hidden = false;
    }
    const dismiss = document.getElementById('langHintDismiss');
    if (dismiss) {
      dismiss.addEventListener('click', () => {
        hint.hidden = true;
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        // 30 days — long enough that a repeat visitor isn't nagged,
        // short enough that someone who changes their browser
        // language preference will eventually see the banner again.
        document.cookie = `md_hint_dismissed=1; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
      });
    }
  }

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
      toggle.setAttribute('aria-label', open ? i18n('nav.close_menu', 'Close menu') : i18n('nav.open_menu', 'Open menu'));
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
      if (e.target.closest('a')) setOpen(false);
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

  // Move focus to target section on in-page anchor clicks (SR + keyboard users).
  // Skip links short-circuit the smooth-scroll delay — keyboard users expect
  // the focus shift to be immediate (WCAG 2.4.1 Bypass Blocks).
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      const moveFocus = () => {
        const prev = target.getAttribute('tabindex');
        if (prev === null) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (prev === null) {
          target.addEventListener('blur', function onBlur() {
            target.removeAttribute('tabindex');
            target.removeEventListener('blur', onBlur);
          });
        }
      };
      if (a.classList.contains('skip-link')) { moveFocus(); return; }
      // Let native smooth scroll run, then move focus without re-scrolling
      setTimeout(moveFocus, 400);
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
        msg = i18n('form.field_required', 'This field is required.');
      } else if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        msg = i18n('form.invalid_email', 'Please enter a valid email address.');
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
        if (servicesError) servicesError.textContent = i18n('form.services_min_one', 'Please select at least one option.');
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
            : i18n('form.submit_fallback', 'Something went wrong. Please try again or email don@muntin.digital directly.');
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
  /* Audio edition of long-form posts. Renders a rich player card under
   * the post dek and, in later sprints, a floating mini-dock when the
   * card scrolls out of view. The card is built dynamically so blog
   * posts only need the legacy #listen-btn as a mount hook / no-JS
   * fallback.
   *
   * Chunk collection includes headings, paragraphs, list items, pull
   * quotes, figcaptions, and any element carrying a data-audio-alt
   * attribute (used to describe infographics / charts so audio stays
   * in parity with the visual version).
   *
   * This sprint: Web Speech API only, new card UI, no dock yet.
   */
  (function initReadAloud(){
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const listenBtn = document.getElementById('listen-btn');
    const postBody  = document.getElementById('post-body');
    if (!listenBtn || !postBody) return;

    /* ---- State ---- */
    let state = 'idle'; // 'idle' | 'playing' | 'paused' | 'loading'
    let chunks = [];
    let currentIndex = 0;
    let currentElement = null;
    let heartbeatTimer = null;

    // Engine selection. If the post's listen button points at a pre-
    // rendered MP3 (via data-audio-src) we use the HTMLAudioElement +
    // manifest path for high-quality playback. Otherwise we fall back
    // to the Web Speech API.
    const audioSrcBase = listenBtn.getAttribute('data-audio-src');
    // Languages available for this post. Authored list (e.g. "en,es")
    // is the source of truth; the player card only exposes what's
    // actually rendered. Base English lives at audio.mp3 / audio.json;
    // additional languages live at audio.<lang>.mp3 / audio.<lang>.json.
    const availableLanguages = (listenBtn.getAttribute('data-audio-languages') || 'en')
      .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!availableLanguages.includes('en')) availableLanguages.unshift('en');
    // User preference persists across posts via the shared prefs key.
    let currentLanguage = 'en';
    function audioSrcFor(lang) {
      if (!audioSrcBase) return null;
      return lang === 'en' ? audioSrcBase : audioSrcBase.replace(/\.mp3$/, `.${lang}.mp3`);
    }
    function manifestSrcFor(lang) {
      const a = audioSrcFor(lang);
      return a ? a.replace(/\.mp3$/, '.json') : null;
    }
    let audioSrc = audioSrcFor(currentLanguage);
    let manifestSrc = manifestSrcFor(currentLanguage);
    let engine = audioSrc ? 'audio' : 'speech';
    let audioEl = null;       // HTMLAudioElement (studio mode)
    let manifest = null;      // { chunks: [{ id, kind, headingAbove, start, end }], total }
    // (Studio-mode highlight tracking is event-driven off the audio
    //  element's timeupdate + seeked events — no rAF loop needed.)

    /* ---- Mount the rich player card (replaces the pill button) ---- */
    const card = buildCard();
    listenBtn.setAttribute('data-upgraded', 'true');
    listenBtn.setAttribute('aria-hidden', 'true');
    listenBtn.setAttribute('tabindex', '-1');
    // Insert the card immediately after the row that holds the legacy
    // button. If the button sits inside a .row-center wrapper, we hop
    // out one level so the card becomes a block-level element below
    // the share row rather than a flex child next to it.
    const rowParent = listenBtn.closest('.row-center') || listenBtn;
    rowParent.parentNode.insertBefore(card.root, rowParent.nextSibling);

    const playBtn    = card.root.querySelector('.listen-card-play');
    const chapterEl  = card.root.querySelector('.listen-card-chapter em');
    const progressEl = card.root.querySelector('.listen-card-progress');
    const progressFill = card.root.querySelector('.listen-card-progress-fill');
    const progressTicks = card.root.querySelector('.listen-card-progress-ticks');
    const waveformCanvas = card.root.querySelector('.listen-card-waveform');
    // Sprint A6: peaks array (one bin per column, 0..1). Populated
    // asynchronously once per audio URL; null until ready. Rendered
    // behind the progress fill to give the bar a voice-shaped body.
    let waveformPeaks = null;
    let waveformForUrl = null; // guards against a language swap mid-fetch
    const extrasEl   = card.root.querySelector('.listen-card-extras');
    const prevBtn    = card.root.querySelector('.listen-prev');
    const nextBtn    = card.root.querySelector('.listen-next');
    const back15Btn  = card.root.querySelector('.listen-back15');
    const fwd15Btn   = card.root.querySelector('.listen-fwd15');
    const rateSelect = card.root.querySelector('.listen-rate');
    const voiceSelect = card.root.querySelector('.listen-voice');
    const languageSelect = card.root.querySelector('.listen-language');
    const languageSelectLabel = card.root.querySelector('.listen-language-select');

    // Display names for the language picker. Shown in their own
    // endonym (Español, not Spanish) so a Spanish-speaking reader
    // finds their option at a glance.
    const LANGUAGE_NAMES = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      it: 'Italiano',
      pt: 'Português',
      hi: 'हिन्दी',
      ja: '日本語',
      zh: '中文',
    };

    // Populate the language dropdown when at least one non-English
    // language is rendered for this post. If only English exists,
    // keep the picker hidden (no point showing a one-option select).
    if (languageSelect && availableLanguages.length > 1) {
      languageSelect.replaceChildren();
      availableLanguages.forEach((code) => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = LANGUAGE_NAMES[code] || code.toUpperCase();
        languageSelect.appendChild(opt);
      });
      if (languageSelectLabel) languageSelectLabel.hidden = false;
    }

    /* ---- User preferences (persist speed + voice across posts) ---- */
    const PREF_KEY = 'muntin.audioPrefs.v1';
    const prefs = loadPrefs();
    if (rateSelect && prefs.rate) rateSelect.value = String(prefs.rate);

    // If this post will use a pre-rendered MP3, the browser's voice
    // list doesn't apply — the reader is already chosen at render time.
    // Hide the voice picker up-front so users aren't presented with a
    // "choose a name" dropdown that looks like it's demanding a
    // selection. (We still swap the source-of-truth note to "Narrated
    // in-house" once the manifest actually loads.)
    if (audioSrc && voiceSelect) {
      const voiceLabel = voiceSelect.closest('.listen-select');
      if (voiceLabel) voiceLabel.hidden = true;
      const srcNote = card.root.querySelector('.listen-source-note');
      if (srcNote) {
        srcNote.setAttribute('data-source', 'studio');
        srcNote.textContent = 'Narrated in-house';
      }
    }
    function loadPrefs() {
      try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; }
      catch (_) { return {}; }
    }
    function savePrefs() {
      try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (_) {}
    }
    function currentRate() {
      const v = rateSelect ? parseFloat(rateSelect.value) : 1;
      return isFinite(v) && v > 0 ? v : 1;
    }
    function currentVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || !voices.length) return null;
      if (voiceSelect && voiceSelect.value) {
        const chosen = voices.find((v) => v.voiceURI === voiceSelect.value);
        if (chosen) return chosen;
      }
      return pickVoice();
    }
    function populateVoices() {
      if (!voiceSelect) return;
      const voices = window.speechSynthesis.getVoices() || [];
      const english = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
      if (!english.length) return;
      const preferred = pickVoice();
      voiceSelect.replaceChildren();
      english.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.voiceURI;
        // Strip the "Microsoft"/"Google" prefix to keep the dropdown tidy
        const nice = v.name.replace(/^(Microsoft|Google)\s+/, '');
        opt.textContent = nice + (v.localService === false ? ' · cloud' : '');
        voiceSelect.appendChild(opt);
      });
      // Restore the saved choice if it still exists, otherwise default
      // to whatever pickVoice() returns.
      const target = (prefs.voiceURI && english.some((v) => v.voiceURI === prefs.voiceURI))
        ? prefs.voiceURI
        : (preferred && preferred.voiceURI);
      if (target) voiceSelect.value = target;
    }
    populateVoices();

    if (rateSelect) {
      rateSelect.addEventListener('change', () => {
        prefs.rate = currentRate();
        savePrefs();
        if (engine === 'audio' && audioEl) {
          // HTMLAudioElement supports changing playbackRate live
          audioEl.playbackRate = currentRate();
        } else if (state === 'playing') {
          // Web Speech needs a cancel/resume to pick up a new rate
          skipTo(currentIndex);
        }
      });
    }
    if (voiceSelect) {
      voiceSelect.addEventListener('change', () => {
        prefs.voiceURI = voiceSelect.value;
        savePrefs();
        if (state === 'playing') skipTo(currentIndex);
      });
    }

    // Restore saved language preference (applies across posts, so a
    // visitor who picked Spanish on one post lands on Spanish on the
    // next one too — as long as the next post rendered Spanish).
    if (prefs.language && availableLanguages.includes(prefs.language)) {
      currentLanguage = prefs.language;
      if (languageSelect) languageSelect.value = currentLanguage;
      applyLanguage(currentLanguage, /* userInitiated */ false);
    }

    if (languageSelect) {
      languageSelect.addEventListener('change', () => {
        const next = languageSelect.value;
        if (next === currentLanguage) return;
        prefs.language = next;
        savePrefs();
        applyLanguage(next, /* userInitiated */ true);
      });
    }

    // Swap the studio-mode source to the chosen language. Stops any
    // current playback cleanly; the next Play starts the new language
    // from the top. (Trying to preserve position across languages
    // would misalign the highlight because chunk timings differ.)
    function applyLanguage(lang, userInitiated) {
      currentLanguage = lang;
      audioSrc = audioSrcFor(lang);
      manifestSrc = manifestSrcFor(lang);
      engine = audioSrc ? 'audio' : 'speech';
      // Tear down cached audio + manifest so the next play fetches
      // the new language's assets.
      if (audioEl) {
        try { audioEl.pause(); } catch (_) {}
        try { audioEl.removeAttribute('src'); audioEl.load(); } catch (_) {}
        audioEl = null;
      }
      manifest = null;
      // Sprint A6: invalidate the peaks so the next play re-fetches
      // the language-specific MP3 (different duration, different peaks).
      waveformPeaks = null;
      waveformForUrl = null;
      if (waveformCanvas) {
        const ctx = waveformCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
      }
      updateMediaSessionMetadata();
      if (userInitiated) finishPlayback();
      // Swap the visible prose so a reader can follow along in the
      // chosen language. This is the difference between "audio
      // translation as an afterthought" and "intentional multilingual
      // accessibility" — the listener sees what they're hearing.
      applyVisualLanguage(lang);
      // UI translations cover the visible surface outside the article
      // chunks: infographic labels, callout tags, CTA button copy,
      // navigation strings, etc. Anything tagged with a .i18n class.
      applyUITranslations(lang);
    }

    /* ---- UI translations (infographics, callouts, buttons) ---- */
    // Designed alongside the article-chunk translation so the whole
    // surface switches together. Any element with class="i18n" is a
    // candidate — its English textContent is cached on first swap, and
    // translations live in <post>/translations.<lang>.json as a flat
    // map keyed by the original English text. On language change we
    // fetch the map (if we don't have it yet) and apply in one pass.
    const originalUICache = new WeakMap();
    const uiTranslationsByLang = new Map();
    async function applyUITranslations(lang) {
      const elements = Array.from(document.querySelectorAll('.i18n'));
      if (!elements.length) return;
      if (lang === 'en') {
        elements.forEach((el) => {
          const cached = originalUICache.get(el);
          if (cached != null) el.textContent = cached;
        });
        return;
      }
      let map = uiTranslationsByLang.get(lang);
      if (!map) {
        // Resolve the translations file against the audio-src directory
        // rather than the current page URL. That way a locale-routed
        // variant of a post (e.g. /es/blog/<slug>/) whose HTML points
        // its data-audio-src at the canonical /blog/<slug>/audio.mp3
        // also pulls /blog/<slug>/translations.<lang>.json — one set of
        // translations + audio files, consumed from many URLs.
        const base = audioSrcBase || '';
        const lastSlash = base.lastIndexOf('/');
        const translationsUrl = (lastSlash >= 0
          ? base.slice(0, lastSlash + 1)
          : '') + `translations.${lang}.json`;
        try {
          const res = await fetch(translationsUrl, { credentials: 'omit' });
          if (!res.ok) throw new Error('status ' + res.status);
          map = await res.json();
          uiTranslationsByLang.set(lang, map);
        } catch (e) {
          console.warn(`[readAloud] ui translations ${lang} not found`, e);
          uiTranslationsByLang.set(lang, {}); // cache empty to avoid re-fetching
          map = {};
        }
      }
      elements.forEach((el) => {
        // Cache the original English textContent the first time we
        // see this element, so a later switch back to English (or
        // jump to another language) can restore cleanly.
        let english = originalUICache.get(el);
        if (english == null) {
          english = el.textContent;
          originalUICache.set(el, english);
        }
        const translated = map[english.trim()] || map[english];
        if (translated) el.textContent = translated;
      });
    }

    /* ---- Visual language swap ---- */
    // Cache of original-English textContent keyed by the same chunk
    // selector the audio manifest uses. Populated lazily on first
    // swap, used to restore the page when the user flips back to
    // English without requiring a page reload.
    const originalTextCache = new Map();
    // Per-language manifest text cache so we don't refetch the JSON
    // every time the user toggles. The audio.<lang>.json carries the
    // translated chunk text we need anyway — reuse it for visuals.
    const translatedTextByLang = new Map();

    async function applyVisualLanguage(lang) {
      if (lang === 'en') {
        // Restore every cached element back to its original English.
        originalTextCache.forEach((original, selector) => {
          const el = postBody.querySelector(selector);
          if (el) el.textContent = original;
        });
        return;
      }

      // Fetch and cache the translated manifest if we haven't
      // already. This call is a small JSON (<30 kB per post) so
      // loading it on language change is fine even on mobile.
      let translated = translatedTextByLang.get(lang);
      if (!translated) {
        const src = manifestSrcFor(lang);
        if (!src) return;
        try {
          const res = await fetch(src, { credentials: 'omit' });
          if (!res.ok) throw new Error('manifest ' + res.status);
          const m = await res.json();
          translated = m.chunks || [];
          translatedTextByLang.set(lang, translated);
        } catch (e) {
          console.warn('[readAloud] visual translation fetch failed', e);
          return;
        }
      }

      // Apply translation to text-safe chunks only. Figures + callouts
      // (kind === 'figure') are skipped — translating their visible
      // text would break the layout around data-audio-alt cards and
      // infographics. The audio still plays Spanish for them; the
      // visible design stays as-authored.
      translated.forEach((chunk) => {
        if (chunk.kind === 'figure') return;
        if (!chunk.selector) return;
        const el = postBody.querySelector(chunk.selector);
        if (!el) return;
        // Only cache the original once, even across multiple
        // language swaps, so flipping en→es→fr→en restores cleanly.
        if (!originalTextCache.has(chunk.selector)) {
          originalTextCache.set(chunk.selector, el.textContent);
        }
        // Use textContent to avoid accidentally parsing stray HTML
        // inside the translation result. Inline emphasis (strong/em/a)
        // is flattened — a known tradeoff of visual translation
        // without HTML-preserving MT. Audio fidelity is preserved.
        el.textContent = chunk.text;
      });
    }

    /* ---- Chrome heartbeat (long-utterance bug workaround) ---- */
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

    /* ---- Chunk collection ---- */
    // Every spoken unit is a {text, element, kind} triple. `kind` lets
    // the UI show a helpful chapter label (e.g. "Section", "Figure").
    function collectChunks() {
      chunks = [];

      // Primary: headings, body paragraphs, list items, pull quotes.
      // Secondary: figcaptions + elements that carry their own spoken
      // alt text via data-audio-alt. The aria-label on .funnel[role=img]
      // is also promoted so infographics get voiced.
      const selector = [
        'h2', 'h3',
        'p', 'li',
        '.pull-quote',
        'figcaption',
        '[data-audio-alt]',
        '[role="img"][aria-label]'
      ].join(',');

      const seen = new Set();
      // Figures can contain several audio-eligible nodes (a
      // data-audio-alt on the figure, an aria-labelled graphic, a
      // figcaption). We only want one spoken chunk per figure, and the
      // branching below prefers data-audio-alt → aria-label → caption.
      const seenFigures = new Set();
      postBody.querySelectorAll(selector).forEach((el) => {
        if (el.closest('.inline-cta'))        return;
        if (el.closest('.further-reading'))   return;
        if (el.closest('.sources'))           return;
        if (seen.has(el)) return;
        seen.add(el);
        const fig = el.closest('figure');
        if (fig) {
          if (seenFigures.has(fig)) return;
          seenFigures.add(fig);
          // Promote the richest available audio description for this
          // figure, regardless of which element happened to match first.
          const override = fig.querySelector('[data-audio-alt]') || fig.closest('[data-audio-alt]');
          const graphic  = fig.querySelector('[role="img"][aria-label]');
          const caption  = fig.querySelector('figcaption');
          let text = '';
          if (override && override.getAttribute('data-audio-alt')) {
            text = override.getAttribute('data-audio-alt').trim();
          } else if (graphic) {
            text = (graphic.getAttribute('aria-label') || '').trim();
          } else if (caption) {
            text = (caption.innerText || caption.textContent || '').trim();
          }
          if (text.length >= 2) chunks.push({ text, element: fig, kind: 'figure' });
          return;
        }

        // Prefer an explicit audio override on the element itself
        const alt = el.getAttribute('data-audio-alt');
        let text = '';
        let kind = 'body';

        if (alt && alt.trim()) {
          text = alt.trim();
          kind = inferKind(el, 'figure');
          // Suppress anything nested inside — the override represents
          // the entire visual block in one spoken chunk, so we don't
          // want the inner <p>s/<li>s re-read afterwards.
          el.querySelectorAll(selector).forEach((d) => seen.add(d));
        } else if (el.matches('[role="img"][aria-label]')) {
          text = el.getAttribute('aria-label').trim();
          kind = 'figure';
        } else if (el.matches('figcaption')) {
          text = spokenText(el);
          kind = 'figure';
        } else if (el.matches('h2, h3')) {
          text = spokenText(el);
          kind = 'heading';
        } else {
          text = spokenText(el);
          kind = inferKind(el, 'body');
        }

        if (text.length < 2) return;
        // Resolve the visually-highlighted anchor — for figure content
        // we highlight the whole <figure> rather than just the caption
        const anchor = el.matches('figcaption, [role="img"], [data-audio-alt]')
          ? (el.closest('figure') || el)
          : el;
        chunks.push({ text, element: anchor, kind });
      });

      // Preserve document order (querySelectorAll already returns in
      // tree order; selector union preserves it too).
      // Finally, normalize each chunk's text so the Web Speech engine
      // reads "#1" as "number 1" and "$55" as "55 dollars" — same rule
      // set the Piper extractor uses so both engines sound alike.
      chunks.forEach((c) => { c.text = normalizeForSpeech(c.text); });
    }

    // Text → speech normalization. Keep in sync with the twin in
    // scripts/render-post-audio.mjs so studio + browser modes agree.
    // Common acronym-style expansions coach the synth into the
    // pronunciations a human reader would choose on a restaurant-
    // marketing blog (SEO → "S E O", 2026 → "twenty twenty-six").
    const ACRONYMS = ['SEO','CTA','URL','PDF','POS','API','DNS','CDN','CMS','DIY','CEO','ROI','UX','UI','HTML','CSS','HTTPS','FAQ','GBP','NAP'];
    const ACRONYM_RE = new RegExp('\\b(' + ACRONYMS.join('|') + ')\\b', 'g');
    const EXPANSIONS = {
      'Mr.': 'Mister', 'Mrs.': 'Missus', 'Ms.': 'Miss', 'Dr.': 'Doctor',
      'vs.': 'versus', 'etc.': 'et cetera', 'i.e.': 'that is',
      'e.g.': 'for example', 'approx.': 'approximately',
    };
    function numberWord(n) {
      if (n === 0) return 'hundred';
      const ones = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
      const tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
      if (n < 20) return ones[n];
      const t = Math.floor(n / 10), o = n % 10;
      return o ? tens[t] + '-' + ones[o] : tens[t];
    }
    // Contraction expansions — runtime twin of scripts/render-post-audio.mjs.
    // Same set, same order. Used by the Web Speech fallback (when no MP3
    // exists) so contractions are pronounced cleanly. The pre-rendered
    // MP3 already has these baked in via the build-time normalizer.
    const CONTRACTIONS = [
      [/\b(W|w)on't\b/g,   (_, c) => (c === 'W' ? 'Will' : 'will') + ' not'],
      [/\b(C|c)an't\b/g,   (_, c) => c === 'C' ? 'Cannot' : 'cannot'],
      [/\b(S|s)han't\b/g,  (_, c) => (c === 'S' ? 'Shall' : 'shall') + ' not'],
      [/\b([A-Za-z]+)n't\b/g, (_, w) => w + ' not'],
      [/\b([A-Za-z]+)'re\b/g, (_, w) => w + ' are'],
      [/\b([A-Za-z]+)'ve\b/g, (_, w) => w + ' have'],
      [/\b([A-Za-z]+)'ll\b/g, (_, w) => w + ' will'],
      [/\b([A-Za-z]+)'d\b/g,  (_, w) => w + ' would'],
      [/\b(I|i)'m\b/g,        (_, c) => c + ' am'],
      [/\b(I|i)t's\b/g,    (_, c) => c + 't is'],
      [/\b(T|t)hat's\b/g,  (_, c) => c + 'hat is'],
      [/\b(H|h)ere's\b/g,  (_, c) => c + 'ere is'],
      [/\b(T|t)here's\b/g, (_, c) => c + 'here is'],
      [/\b(W|w)hat's\b/g,  (_, c) => c + 'hat is'],
      [/\b(L|l)et's\b/g,   (_, c) => c + 'et us'],
      [/\b(H|h)e's\b/g,    (_, c) => c + 'e is'],
      [/\b(S|s)he's\b/g,   (_, c) => c + 'he is'],
      [/\b(W|w)ho's\b/g,   (_, c) => c + 'ho is'],
      [/\b(W|w)here's\b/g, (_, c) => c + 'here is'],
    ];

    function normalizeForSpeech(s) {
      if (!s) return s;
      let pre = s;
      for (const [re, rep] of CONTRACTIONS) pre = pre.replace(re, rep);
      return pre
        .replace(/#\s*(\d+)/g, 'number $1')
        .replace(/\$(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)/g, '$1 dollars')
        .replace(/(\d)\s*×\s*(\d|\$)/g, '$1 times $2')
        .replace(/(\d)\s*([ap])\.?\s*m\.?\b/gi, (_, n, ap) => n + ' ' + ap.toUpperCase() + 'M')
        .replace(ACRONYM_RE, (w) => w.split('').join(' '))
        .replace(/\b20(\d{2})\b/g, (_, xx) => 'twenty ' + numberWord(parseInt(xx, 10)))
        .replace(/\b(Mr|Mrs|Ms|Dr|vs|etc|i\.e|e\.g|approx)\.(?=\s|$)/g, (m) => EXPANSIONS[m] || m)
        .replace(/[\u00A0\u202F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Walk an element's text, substituting any inline element that
    // carries data-say="..." with its data-say value. This is the
    // runtime twin of the extractor's data-say handling — used so the
    // Web Speech fallback says English heteronyms ("live" the verb,
    // "read" past tense, "lead" the noun) the way the writer meant.
    function spokenText(el) {
      const parts = [];
      el.childNodes.forEach((node) => {
        if (node.nodeType === 3) { // text
          parts.push(node.textContent);
          return;
        }
        if (node.nodeType !== 1) return;
        const say = node.getAttribute && node.getAttribute('data-say');
        if (say) { parts.push(' ' + say + ' '); return; }
        parts.push(spokenText(node));
      });
      return parts.join('').replace(/\s+/g, ' ').trim();
    }

    function inferKind(el, fallback) {
      if (el.matches('.pull-quote')) return 'quote';
      if (el.closest('figure'))       return 'figure';
      if (el.matches('li'))           return 'list';
      return fallback;
    }

    /* ---- Highlight the currently-spoken block ---- */
    function setCurrent(el, chunk) {
      if (currentElement) {
        currentElement.classList.remove('is-reading');
        currentElement.classList.remove('is-reading-callout');
      }
      currentElement = el;
      if (el) {
        el.classList.add('is-reading');
        // Callouts (.revenue-math, figures, any data-audio-alt block)
        // already have their own background + foreground treatment;
        // painting a tint over them kills the designed contrast. We
        // tag them so the CSS can swap the background flood for a
        // soft outer accent ring instead.
        if (chunk && chunk.kind === 'figure') {
          el.classList.add('is-reading-callout');
        }
        // Update "now reading" label on the card
        if (chapterEl) setChapterText(chapterEl, chapterLabel(chunk));
        const rect = el.getBoundingClientRect();
        const isOutOfView = rect.top < 80 || rect.bottom > window.innerHeight - 80;
        if (isOutOfView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (chapterEl) {
        setChapterText(chapterEl, '');
      }
    }

    // Sprint A4: animate any chapter-label text change with a fade-slide
    // in — opacity + translateY + a 1.5px blur settle over 360ms. Uses
    // the remove/reflow/re-add class trick so the same keyframe can
    // re-trigger on each chunk boundary. Skipped when the text is
    // unchanged (a no-op tickStudio pass shouldn't re-animate).
    function setChapterText(el, next) {
      if (!el) return;
      const cur = el.textContent || '';
      const n = next || '';
      if (cur === n) return;
      el.textContent = n;
      el.classList.remove('lc-chapter-in');
      // Force a reflow so the browser treats the class removal +
      // re-add as a real transition boundary.
      void el.offsetWidth;
      if (n) el.classList.add('lc-chapter-in');
    }

    function chapterLabel(chunk) {
      if (!chunk) return '';
      if (chunk.kind === 'heading') return trimLabel(chunk.text);
      if (chunk.kind === 'figure')  return 'Graphic — ' + trimLabel(chunk.text, 80);
      if (chunk.kind === 'quote')   return 'Pull quote';
      if (chunk.kind === 'list')    return 'List item';
      // Use the nearest preceding heading as the section title
      const h = nearestHeading(chunk.element);
      return h ? trimLabel(h) : 'Reading…';
    }
    function trimLabel(str, max = 60) {
      const t = (str || '').replace(/\s+/g, ' ').trim();
      return t.length > max ? t.slice(0, max - 1) + '…' : t;
    }
    function nearestHeading(el) {
      let cur = el;
      while (cur && cur !== postBody) {
        let prev = cur.previousElementSibling;
        while (prev) {
          if (prev.matches && prev.matches('h2, h3')) {
            return (prev.innerText || prev.textContent || '').trim();
          }
          prev = prev.previousElementSibling;
        }
        cur = cur.parentElement;
      }
      return '';
    }

    /* ---- Voice selection ---- */
    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || !voices.length) return null;
      return voices.find((v) => v.lang && v.lang.startsWith('en') && /Natural|Google|Samantha|Alex|Daniel|Enhanced/i.test(v.name))
          || voices.find((v) => v.lang && v.lang.startsWith('en'))
          || null;
    }

    /* ---- Progress + skip controls ---- */
    function drawTicks() {
      if (!progressTicks || !chunks.length) return;
      // One tick per H2 boundary, so the progress bar doubles as a
      // chapter map. Fall back to a single no-tick bar if the post has
      // no H2s (short posts).
      // Sprint A3: each segment also carries its [startIdx, endIdx)
      // range on the dataset so tickStudio can flag the active chapter
      // without recomputing the mapping on every audio tick.
      const frag = document.createDocumentFragment();
      let lastFlex = 0;
      for (let i = 0; i < chunks.length; i++) {
        const isBoundary = chunks[i].kind === 'heading' && i > 0;
        if (isBoundary) {
          const seg = document.createElement('span');
          seg.style.flex = String(i - lastFlex);
          seg.dataset.startIdx = String(lastFlex);
          seg.dataset.endIdx   = String(i);
          frag.appendChild(seg);
          lastFlex = i;
        }
      }
      // Final segment through the end
      const tail = document.createElement('span');
      tail.style.flex = String(chunks.length - lastFlex);
      tail.dataset.startIdx = String(lastFlex);
      tail.dataset.endIdx   = String(chunks.length);
      frag.appendChild(tail);
      progressTicks.replaceChildren(frag);
    }

    /* -- Sprint A6: static peaks waveform ------------------------- */
    // Lightweight 32-bit FNV-1a hash so cache keys stay short even on
    // long audio URLs. Enough to avoid collisions across a handful of
    // language variants per post.
    function hashAudioUrl(s) {
      let h = 0x811c9dc5;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
      }
      return h.toString(16);
    }

    const PEAKS_CACHE_PREFIX = 'muntin.audioPeaks.v1.';
    const PEAKS_BIN_COUNT    = 120;

    function loadCachedPeaks(url) {
      try {
        const key = PEAKS_CACHE_PREFIX + hashAudioUrl(url);
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr) || arr.length !== PEAKS_BIN_COUNT) return null;
        return arr;
      } catch (_) { return null; }
    }
    function saveCachedPeaks(url, peaks) {
      try {
        const key = PEAKS_CACHE_PREFIX + hashAudioUrl(url);
        // Round to 3 decimals so the JSON stays under ~1.2 KB per post.
        const rounded = peaks.map((v) => Math.round(v * 1000) / 1000);
        localStorage.setItem(key, JSON.stringify(rounded));
      } catch (_) {}
    }

    // Decode audio → compute one peak bin per ~duration/PEAKS_BIN_COUNT
    // window from channel 0. Gracefully falls through to null on any
    // failure (CORS, decodeAudioData rejection, unsupported AudioContext)
    // and the card keeps its existing flat teal bar.
    async function computePeaksFrom(url) {
      const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!AC || !window.fetch) return null;
      try {
        const res = await fetch(url, { credentials: 'omit' });
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        // A 1-second / 1-channel / 22050-Hz context is enough to host
        // decodeAudioData without allocating a playback-sized buffer.
        const tempCtx = new AC(1, 22050, 22050);
        const audioBuf = await tempCtx.decodeAudioData(buf.slice(0));
        const ch = audioBuf.getChannelData(0);
        const bins = PEAKS_BIN_COUNT;
        const step = Math.floor(ch.length / bins) || 1;
        const peaks = new Array(bins);
        let max = 0;
        for (let b = 0; b < bins; b++) {
          let peak = 0;
          const start = b * step;
          const end = Math.min(start + step, ch.length);
          for (let i = start; i < end; i++) {
            const v = Math.abs(ch[i]);
            if (v > peak) peak = v;
          }
          peaks[b] = peak;
          if (peak > max) max = peak;
        }
        // Normalize to 0..1 so the tallest bin hits the top.
        if (max > 0) for (let b = 0; b < bins; b++) peaks[b] /= max;
        return peaks;
      } catch (e) {
        console.warn('[readAloud] peaks decode failed', e);
        return null;
      }
    }

    async function ensureWaveformPeaks() {
      if (!waveformCanvas || !audioSrc) return;
      // Respect Data Saver: skip the ~100-300 KB audio fetch.
      try {
        const c = navigator.connection;
        if (c && c.saveData) return;
      } catch (_) {}
      if (waveformForUrl === audioSrc) return;
      waveformForUrl = audioSrc;
      const cached = loadCachedPeaks(audioSrc);
      if (cached) { waveformPeaks = cached; renderWaveform(0); return; }
      const fresh = await computePeaksFrom(audioSrc);
      if (waveformForUrl !== audioSrc) return; // language changed mid-fetch
      if (fresh) {
        waveformPeaks = fresh;
        saveCachedPeaks(audioSrc, fresh);
        renderWaveform(lastKnownPlayedPct);
      }
    }

    let lastKnownPlayedPct = 0;
    function renderWaveform(playedPct) {
      if (!waveformCanvas || !waveformPeaks) return;
      lastKnownPlayedPct = playedPct || 0;
      const cssW = waveformCanvas.clientWidth;
      const cssH = waveformCanvas.clientHeight;
      if (!cssW || !cssH) return;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(cssW * dpr);
      const h = Math.floor(cssH * dpr);
      if (waveformCanvas.width !== w)  waveformCanvas.width  = w;
      if (waveformCanvas.height !== h) waveformCanvas.height = h;
      const ctx = waveformCanvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const bins = waveformPeaks.length;
      const barW = w / bins;
      const halfH = h / 2;
      const playedBoundary = (playedPct / 100) * w;
      const UNPLAYED = 'rgba(31,78,91,0.22)';
      const PLAYED   = 'rgba(31,78,91,0.85)';
      for (let i = 0; i < bins; i++) {
        const peak = waveformPeaks[i];
        const barH = Math.max(1, peak * (halfH - 1));
        const x = i * barW;
        ctx.fillStyle = (x + barW * 0.5) <= playedBoundary ? PLAYED : UNPLAYED;
        // Single rect centered vertically — symmetric around the midline.
        ctx.fillRect(Math.round(x), Math.round(halfH - barH), Math.max(1, Math.floor(barW * 0.6)), Math.round(barH * 2));
      }
    }

    // Re-paint on viewport resize so the canvas stays crisp at the
    // new width. Listeners fire after the progress bar relayouts.
    window.addEventListener('resize', () => {
      if (waveformPeaks) renderWaveform(lastKnownPlayedPct);
    });

    // Sprint A3: flag the tick segment whose [startIdx, endIdx) contains
    // the currently-playing chunk. CSS swells the current segment to
    // 1.08× and tints it with a soft teal, so the progress bar visibly
    // bubbles forward chapter by chapter as the audio advances.
    function markCurrentTickSegment(idx) {
      if (!progressTicks) return;
      const segs = progressTicks.children;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const a = Number(s.dataset.startIdx);
        const b = Number(s.dataset.endIdx);
        if (idx >= a && idx < b) s.setAttribute('data-current', 'true');
        else                     s.removeAttribute('data-current');
      }
    }

    function updateProgress() {
      if (!progressFill || !chunks.length) return;
      // Pct based on chunk index so mobile + desktop behave identically
      const pct = Math.min(100, Math.round(((currentIndex + 1) / chunks.length) * 100));
      progressFill.style.width = pct + '%';
      if (progressEl) progressEl.setAttribute('aria-valuenow', String(pct));
      if (prevBtn) prevBtn.disabled = currentIndex <= 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= chunks.length - 1;
      updateSkipButtons();
      updateDockProgress(pct);
      updateDockChapter(chunks[currentIndex]);
    }

    // Enable the ±15 buttons whenever there's something to seek
    // through. In studio mode we check real audio bounds; in the speech
    // fallback the buttons step by paragraph, so they follow the
    // paragraph-skip availability.
    function updateSkipButtons() {
      if (!back15Btn || !fwd15Btn) return;
      if (engine === 'audio' && audioEl && audioEl.duration) {
        back15Btn.disabled = audioEl.currentTime <= 0.1;
        fwd15Btn.disabled  = audioEl.currentTime >= audioEl.duration - 0.1;
      } else {
        back15Btn.disabled = currentIndex <= 0;
        fwd15Btn.disabled  = currentIndex >= chunks.length - 1;
      }
    }

    function revealPlayerChrome() {
      if (progressEl)  progressEl.hidden  = false;
      if (extrasEl)    extrasEl.hidden    = false;
    }

    function skipTo(idx) {
      if (!chunks.length) return;
      idx = Math.max(0, Math.min(chunks.length - 1, idx));
      if (engine === 'audio') { studioSkipTo(idx); return; }
      window.speechSynthesis.cancel();
      // Force into playing state so onend from the cancelled utterance
      // doesn't double-advance us past the target chunk.
      setState('playing');
      startHeartbeat();
      speakChunk(idx);
    }
    if (prevBtn) prevBtn.addEventListener('click', () => skipTo(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => skipTo(currentIndex + 1));
    if (back15Btn) back15Btn.addEventListener('click', () => seekBy(-15));
    if (fwd15Btn)  fwd15Btn.addEventListener('click',  () => seekBy(+15));

    // ±15 seconds relative seek. Studio mode uses clock-time; speech
    // fallback has no clock, so we approximate by stepping one chunk.
    function seekBy(seconds) {
      if (!chunks.length) return;
      if (engine === 'audio' && audioEl && audioEl.duration) {
        const t = Math.max(0, Math.min(audioEl.duration, audioEl.currentTime + seconds));
        // Find the chunk whose [start,end] spans t so the highlight
        // and currentIndex update in one step — without this, the
        // tick loop catches up but currentIndex can be stale if the
        // user double-taps.
        let idx = 0;
        for (let i = 0; i < chunks.length; i++) {
          if ((chunks[i].start || 0) <= t) idx = i; else break;
        }
        audioEl.currentTime = t;
        currentIndex = idx;
        setCurrent(chunks[idx].element, chunks[idx]);
        const pct = (t / audioEl.duration) * 100;
        if (progressFill) progressFill.style.width = pct.toFixed(2) + '%';
        if (progressEl) progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
        updateDockProgress(pct, t, audioEl.duration);
        updateDockChapter(chunks[idx]);
      } else {
        // Speech fallback: 15s ≈ 1 paragraph
        skipTo(currentIndex + (seconds > 0 ? 1 : -1));
      }
    }

    // Scrub on the progress bar. Supports both click-to-seek and
    // drag-to-scrub via Pointer Events (unifies mouse + touch). While
    // dragging we continuously update audio.currentTime and the UI
    // so the listener hears + sees the position changing; on release
    // we snap to the nearest chunk boundary so the highlight lines up.
    if (progressEl) attachScrub(progressEl);

    function attachScrub(bar) {
      let dragging = false;
      let pointerId = null;

      function seekToPointer(clientX, release) {
        if (!chunks.length) return;
        const rect = bar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        if (engine === 'audio' && audioEl && audioEl.duration) {
          const t = ratio * audioEl.duration;
          // Keep the audio at the scrub position live so the user
          // hears where they are.
          audioEl.currentTime = t;
          // Paint progress + update highlight on every move; snap to
          // nearest chunk boundary on release so the visual anchor
          // lines up with a paragraph.
          let idx = 0;
          for (let i = 0; i < chunks.length; i++) {
            if ((chunks[i].start || 0) <= t) idx = i; else break;
          }
          const pct = (t / audioEl.duration) * 100;
          if (progressFill) progressFill.style.width = pct.toFixed(2) + '%';
          if (progressEl) progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
          updateDockProgress(pct, t, audioEl.duration);
          updateDockChapter(chunks[idx]);
          if (idx !== currentIndex || release) {
            currentIndex = idx;
            setCurrent(chunks[idx].element, chunks[idx]);
          }
          if (release) {
            // Snap to chunk start so chaptered progress feels stable
            audioEl.currentTime = chunks[idx].start || 0;
          }
        } else {
          const idx = Math.floor(ratio * chunks.length);
          if (release) skipTo(idx);
        }
      }

      bar.addEventListener('pointerdown', (e) => {
        dragging = true;
        pointerId = e.pointerId;
        try { bar.setPointerCapture(pointerId); } catch (_) {}
        bar.classList.add('is-scrubbing');
        seekToPointer(e.clientX, false);
        e.preventDefault();
      });
      bar.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        seekToPointer(e.clientX, false);
      });
      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        bar.classList.remove('is-scrubbing');
        try { bar.releasePointerCapture(pointerId); } catch (_) {}
        pointerId = null;
        seekToPointer(e.clientX, true);
      }
      bar.addEventListener('pointerup', endDrag);
      bar.addEventListener('pointercancel', endDrag);
    }

    /* ---- Playback ---- */
    function speakChunk(idx) {
      if (idx >= chunks.length) {
        finishPlayback();
        if (window.plausible) window.plausible('Post Listened: Completed');
        return;
      }
      currentIndex = idx;
      const chunk = chunks[idx];
      setCurrent(chunk.element, chunk);
      updateProgress();

      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.rate   = currentRate();
      utterance.pitch  = 1.0;
      utterance.volume = 1.0;
      const voice = currentVoice();
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
      ensureMediaSession();
      if (engine === 'audio') return startStudioPlayback();
      if (state === 'paused') {
        window.speechSynthesis.resume();
        setState('playing');
        startHeartbeat();
        return;
      }
      collectChunks();
      if (!chunks.length) return;
      drawTicks();
      revealPlayerChrome();
      setState('playing');
      startHeartbeat();
      speakChunk(0);
      if (window.plausible) window.plausible('Post Listened');
    }

    function pausePlayback() {
      if (engine === 'audio') return pauseStudioPlayback();
      if (state !== 'playing') return;
      window.speechSynthesis.pause();
      setState('paused');
      stopHeartbeat();
    }

    function finishPlayback() {
      if (engine === 'audio') return finishStudioPlayback();
      window.speechSynthesis.cancel();
      setState('idle');
      currentIndex = 0;
      setCurrent(null, null);
      stopHeartbeat();
    }

    /* ---- Studio (pre-rendered MP3) engine ---- */
    // A manifest accompanies the MP3 describing each chunk's start/end
    // timestamp and its anchor element selector. We poll the audio
    // element's currentTime (via rAF) and use it to highlight the right
    // block and update progress.
    async function ensureStudioReady() {
      if (audioEl && manifest) return true;
      if (!audioSrc || !manifestSrc) return false;
      setState('loading');
      try {
        const [manifestRes] = await Promise.all([fetch(manifestSrc, { credentials: 'omit' })]);
        if (!manifestRes.ok) throw new Error('manifest ' + manifestRes.status);
        manifest = await manifestRes.json();
      } catch (e) {
        console.warn('[readAloud] studio manifest failed, falling back to speech', e);
        engine = 'speech';
        setState('idle');
        return false;
      }
      if (!audioEl) {
        audioEl = new Audio();
        audioEl.preload = 'metadata';
        audioEl.src = audioSrc;
        audioEl.addEventListener('ended', () => finishStudioPlayback(true));
        audioEl.addEventListener('error', () => {
          console.warn('[readAloud] studio audio error, falling back to speech');
          engine = 'speech';
          finishStudioPlayback();
        });
        // Drive the chunk highlight + progress UI from audio events
        // rather than a rAF loop. timeupdate fires regardless of tab
        // focus (rAF freezes when the document is hidden), so the
        // highlight stays in sync if the user switches tabs and comes
        // back, and the lock-screen position state keeps updating.
        // seeked fires after every scrub for instant response.
        audioEl.addEventListener('timeupdate', tickStudio);
        audioEl.addEventListener('seeked',     tickStudio);
        audioEl.addEventListener('play',       () => syncMediaSessionState());
        audioEl.addEventListener('pause',      () => syncMediaSessionState());
      }
      // Resolve manifest chunk anchors against the document. Each
      // manifest entry has a `selector` (stable CSS path) we use to
      // find the element to highlight. Missing anchors are OK — we
      // simply won't highlight for that chunk.
      if (Array.isArray(manifest.chunks)) {
        chunks = manifest.chunks.map((c) => ({
          text: c.text || '',
          element: c.selector ? postBody.querySelector(c.selector) : null,
          kind: c.kind || 'body',
          start: c.start || 0,
          end:   c.end   || 0,
        }));
      }
      // Point the source-of-truth note at the branded reader
      const note = card.root.querySelector('.listen-source-note');
      if (note) {
        note.setAttribute('data-source', 'studio');
        note.textContent = 'Narrated in-house';
      }
      // Studio mode uses Audio's native rate; remove the voice picker
      const voiceLabel = voiceSelect ? voiceSelect.closest('.listen-select') : null;
      if (voiceLabel) voiceLabel.hidden = true;
      // Sprint A6: kick off the peaks pipeline. Fire-and-forget; the
      // canvas stays blank (and the existing flat fill is the only
      // progress cue) until peaks resolve or fail silently.
      ensureWaveformPeaks();
      return true;
    }

    async function startStudioPlayback() {
      ensureMediaSession();
      // Fast path: already loaded and just paused — just resume.
      if (state === 'paused' && audioEl) {
        audioEl.playbackRate = currentRate();
        try { await audioEl.play(); } catch (e) { console.warn('[readAloud] resume rejected', e); return; }
        setState('playing');
        ensureAmplitudeAnalyser();
        tickStudio();
        return;
      }
      const ready = await ensureStudioReady();
      if (!ready) {
        // Fell back to speech; re-enter via the speech path
        return startPlayback();
      }
      drawTicks();
      revealPlayerChrome();
      audioEl.playbackRate = currentRate();
      // Create the AudioContext inside the user-gesture chain, before
      // the first await — Safari otherwise leaves it permanently
      // suspended. If analyser setup fails, playback continues without
      // the amplitude cue.
      ensureAmplitudeAnalyser();
      try { await audioEl.play(); } catch (e) {
        console.warn('[readAloud] audio.play rejected', e);
        return;
      }
      setState('playing');
      startAmplitudeLoop();
      tickStudio();
      if (window.plausible) window.plausible('Post Listened');
    }

    /* -- Sprint A7: amplitude-reactive play-button breathing --------
       First play lazily creates an AudioContext + MediaElementSource +
       AnalyserNode, chains source → analyser → destination so audio
       continues to play through speakers, then rAFs a loop that
       computes RMS per frame and writes it as `--listen-amp` on the
       play button. CSS uses the var to drive the outer aura ring's
       scale, so the button breathes with the voice.
       Every API entry is wrapped in try/catch; any failure (Safari
       MediaElementSource policy, CORS taint, unsupported AnalyserNode)
       leaves the static pulse rings as the only breathing cue. */
    let audioCtx = null;
    let audioCtxSource = null;
    let analyserNode = null;
    let amplitudeFrame = 0;
    let amplitudeBuffer = null;
    function ensureAmplitudeAnalyser() {
      if (!audioEl || !playBtn) return;
      if (analyserNode) { startAmplitudeLoop(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        audioCtx = new AC();
        audioCtxSource = audioCtx.createMediaElementSource(audioEl);
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.6;
        amplitudeBuffer = new Uint8Array(analyserNode.fftSize);
        audioCtxSource.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
      } catch (e) {
        console.warn('[readAloud] analyser setup failed', e);
        audioCtx = null; analyserNode = null; amplitudeBuffer = null;
        return;
      }
      // AudioContexts created before a user gesture start suspended on
      // some browsers; resume inside the gesture chain.
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      startAmplitudeLoop();
    }
    function startAmplitudeLoop() {
      if (amplitudeFrame) return;
      const root = document.documentElement;
      const tick = () => {
        if (!analyserNode || !amplitudeBuffer || !playBtn) { amplitudeFrame = 0; return; }
        if (state !== 'playing') {
          playBtn.style.setProperty('--listen-amp', '0');
          root.style.setProperty('--listen-amp', '0');
          amplitudeFrame = 0;
          return;
        }
        analyserNode.getByteTimeDomainData(amplitudeBuffer);
        // RMS of the centered waveform (samples are 0..255 with 128 at rest).
        let sumSq = 0;
        for (let i = 0; i < amplitudeBuffer.length; i++) {
          const v = (amplitudeBuffer[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / amplitudeBuffer.length);
        // Clamp to 0..1 and bias upward a touch so normal speech RMS
        // (~0.15–0.35) reads as active but not saturated.
        const amp = Math.min(1, rms * 2.2);
        const s = amp.toFixed(3);
        playBtn.style.setProperty('--listen-amp', s);
        // Sprint A9: also expose on the document root so the dock's
        // progress fill can read the same amplitude (siblings don't
        // share inherited custom-prop scope).
        root.style.setProperty('--listen-amp', s);
        amplitudeFrame = requestAnimationFrame(tick);
      };
      amplitudeFrame = requestAnimationFrame(tick);
    }

    function pauseStudioPlayback() {
      if (!audioEl) return;
      audioEl.pause();
      setState('paused');
    }

    function finishStudioPlayback(withFinale) {
      const completed = !!(audioEl && audioEl.duration && audioEl.currentTime >= audioEl.duration - 0.5);
      if (audioEl) { try { audioEl.pause(); } catch (_) {} audioEl.currentTime = 0; }
      if (window.plausible && completed) {
        window.plausible('Post Listened: Completed');
      }
      // Sprint A12: when the listener naturally reached the end, pause
      // the UI on a warm "finished" state for 2.8s before collapsing to
      // idle. This is the quiet emotional payoff — the moment the
      // cheerleading progress bar becomes a soft glow and the play icon
      // swaps to a checkmark. User-aborted stops skip the finale.
      if (withFinale && completed) {
        // Apply the localized finale copy into the chapter line so the
        // "Now reading" slot becomes the payoff message.
        if (chapterEl) setChapterText(chapterEl, finaleMessageForLanguage(currentLanguage));
        if (dockChapter) setChapterText(dockChapter, finaleMessageForLanguage(currentLanguage));
        setState('finished');
        syncMediaSessionPosition();
        setTimeout(() => {
          currentIndex = 0;
          setCurrent(null, null);
          if (chapterEl) setChapterText(chapterEl, '');
          if (dockChapter) setChapterText(dockChapter, '');
          setState('idle');
          syncMediaSessionPosition();
        }, 2800);
        return;
      }
      currentIndex = 0;
      setCurrent(null, null);
      setState('idle');
      syncMediaSessionPosition();
    }

    // Sprint A12: inline per-language finale copy. Inline rather than
    // via per-post translations.<lang>.json because this string is
    // global to every audio-equipped post and identical across posts —
    // it shouldn't be translated post-by-post. Falls back to English
    // for any audio language not listed.
    const FINALE_MESSAGES = {
      en: "You've reached the end",
      es: 'Has llegado al final',
      fr: 'Vous êtes arrivé à la fin',
      it: 'Sei arrivato alla fine',
      pt: 'Você chegou ao fim',
      hi: 'आप अंत तक पहुँच गए हैं',
      ja: '最後まで到達しました',
      zh: '您已到达终点',
    };
    function finaleMessageForLanguage(lang) {
      return FINALE_MESSAGES[lang] || FINALE_MESSAGES.en;
    }

    // Event-driven tick: registered as the timeupdate + seeked
    // listener on the <audio> element rather than a rAF loop. Fires
    // ~4x/sec while playing (browser-determined), continues firing
    // when the tab is backgrounded, and runs once on every seek for
    // instant scrubber response.
    function tickStudio() {
      if (!audioEl) return;
      const t = audioEl.currentTime;
      // Find the chunk whose [start, end) contains t. Chunks are sorted
      // so a short linear scan from the current position is adequate.
      let idx = currentIndex;
      while (idx + 1 < chunks.length && t >= chunks[idx + 1].start) idx++;
      while (idx > 0 && t < chunks[idx].start) idx--;
      if (idx !== currentIndex || !currentElement) {
        currentIndex = idx;
        const chunk = chunks[idx];
        if (chunk) setCurrent(chunk.element, chunk);
      }
      // Progress based on time, not chunk index — smoother on long posts
      const pct = audioEl.duration ? Math.min(100, (t / audioEl.duration) * 100) : 0;
      if (progressFill) progressFill.style.width = pct.toFixed(2) + '%';
      if (progressEl) progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
      renderWaveform(pct);
      updateDockProgress(pct, t, audioEl.duration || 0);
      updateDockChapter(chunks[currentIndex]);
      markCurrentTickSegment(currentIndex);
      if (prevBtn) prevBtn.disabled = currentIndex <= 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= chunks.length - 1;
      updateSkipButtons();
      syncMediaSessionPosition();
    }

    // Studio-mode seek by chunk. We update the highlight + dock
    // progress *immediately* — without this, the next tickStudio
    // iteration sees currentIndex unchanged (we just set it) and
    // skips its own highlight update, so the blue reading box gets
    // stuck on the pre-seek paragraph until the user pauses.
    function studioSkipTo(idx) {
      if (!audioEl || !chunks.length) return;
      idx = Math.max(0, Math.min(chunks.length - 1, idx));
      const chunk = chunks[idx];
      audioEl.currentTime = chunk.start || 0;
      currentIndex = idx;
      setCurrent(chunk.element, chunk);
      const pct = audioEl.duration ? ((chunk.start || 0) / audioEl.duration) * 100 : 0;
      if (progressFill) progressFill.style.width = pct.toFixed(2) + '%';
      if (progressEl) progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
      renderWaveform(pct);
      updateDockProgress(pct, chunk.start || 0, audioEl.duration || 0);
      updateDockChapter(chunk);
      markCurrentTickSegment(currentIndex);
      if (prevBtn) prevBtn.disabled = currentIndex <= 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= chunks.length - 1;
    }

    /* ---- State machine ---- */
    function setState(next) {
      state = next;
      syncMediaSessionState();
      card.root.setAttribute('data-state', next);
      const pressed = next === 'playing' ? 'true' : 'false';
      playBtn.setAttribute('aria-pressed', pressed);
      playBtn.setAttribute('aria-label',
        next === 'playing' ? i18n('audio.pause',  'Pause audio') :
        next === 'paused'  ? i18n('audio.resume', 'Resume audio') :
                             i18n('audio.play',   'Play audio version'));
      // Mirror onto the legacy pill so any integration that watches it
      // (analytics, tests) still sees the same state.
      listenBtn.setAttribute('data-state', next);
      listenBtn.setAttribute('aria-pressed', pressed);
      updateDockState();
      // Reset the collapsed state at the start of each new playback
      // so returning users get the full dock by default.
      if (next === 'idle') {
        dockCollapsed = false;
        dock.root.setAttribute('data-collapsed', 'false');
      }
      updateDockVisibility();
    }

    /* ---- Click handling ---- */
    function toggle() {
      if      (state === 'idle')    startPlayback();
      else if (state === 'playing') pausePlayback();
      else if (state === 'paused')  startPlayback();
    }
    playBtn.addEventListener('click', toggle);
    listenBtn.addEventListener('click', toggle);

    window.addEventListener('beforeunload', () => {
      if (state !== 'idle') window.speechSynthesis.cancel();
    });

    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
    }

    /* ---- Floating dock ---- */
    // Mirrors the card's state; only shown when (a) audio is active and
    // (b) the card is scrolled out of view. The header close button
    // collapses the dock to a compact pill (user can expand it again
    // via the chevron); the stop button is the actual "end playback"
    // action — hides the dock and returns to idle.
    const dock = buildDock();
    document.body.appendChild(dock.root);
    const dockPlayBtn = dock.root.querySelector('.listen-dock-play');
    const dockCollapse = dock.root.querySelector('.listen-dock-collapse');
    const dockStop    = dock.root.querySelector('.listen-dock-stop');
    const dockExpand  = dock.root.querySelector('.listen-dock-expand');
    const dockTitleEl = dock.root.querySelector('.listen-dock-title');
    const dockChapter = dock.root.querySelector('.listen-dock-chapter');
    const dockFill    = dock.root.querySelector('.listen-dock-progress-fill');
    const dockProgEl  = dock.root.querySelector('.listen-dock-progress');
    const dockPrevBtn = dock.root.querySelector('.listen-dock-prev');
    const dockNextBtn = dock.root.querySelector('.listen-dock-next');
    const dockTimeNow = dock.root.querySelector('.listen-dock-time-now');
    const dockTimeEnd = dock.root.querySelector('.listen-dock-time-end');
    let dockCollapsed = false;
    let cardInView = true;

    dockPlayBtn.addEventListener('click', toggle);
    // Collapse / expand is a presentational toggle only — playback
    // keeps running in the background. Only the Stop control ends
    // audio. This separation means a user who wants the dock out of
    // the way but audio still playing doesn't have to choose between
    // the two.
    dockCollapse.addEventListener('click', (e) => {
      e.stopPropagation();
      dockCollapsed = true;
      dock.root.setAttribute('data-collapsed', 'true');
    });
    dockExpand.addEventListener('click', () => {
      dockCollapsed = false;
      dock.root.setAttribute('data-collapsed', 'false');
    });
    dockStop.addEventListener('click', (e) => {
      e.stopPropagation();
      // Full stop — kills audio, returns to idle; updateDockVisibility
      // will then hide the dock because state is no longer active.
      finishPlayback();
    });
    if (dockPrevBtn) dockPrevBtn.addEventListener('click', () => skipTo(currentIndex - 1));
    if (dockNextBtn) dockNextBtn.addEventListener('click', () => skipTo(currentIndex + 1));
    // Same scrub helper handles click + drag for the dock's bar, so
    // the scrubbing UX is identical whether the player card is
    // on-screen or the user's deep into the post.
    if (dockProgEl) attachScrub(dockProgEl);

    let footerInView = false;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        cardInView = entries[0].isIntersecting;
        updateDockVisibility();
      }, { rootMargin: '-40px 0px 0px 0px', threshold: 0 });
      io.observe(card.root);

      // Hide the dock whenever the page footer comes into view — its
      // dark pill otherwise stacks on top of the dark footer CTA and
      // muddies the contrast. Visibility resumes when the user scrolls
      // back up into the article.
      const footer = document.querySelector('footer');
      if (footer) {
        const fo = new IntersectionObserver((entries) => {
          footerInView = entries[0].isIntersecting;
          updateDockVisibility();
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
        fo.observe(footer);
      }
    }

    function updateDockVisibility() {
      // Sprint A12: keep the dock visible during the 'finished' state
      // so a scrolled-away listener also sees the finale moment land
      // — the dock's chapter line already shows the localized finale
      // copy for the 2.8s window before state collapses to idle.
      const shouldShow = !cardInView && !footerInView
        && (state === 'playing' || state === 'paused' || state === 'finished');
      dock.root.setAttribute('data-visible', shouldShow ? 'true' : 'false');
      // Sprint A10: card-to-dock morph. When the dock takes over, dim
      // the card so it reads as handed-off (visible on scroll-back);
      // when the dock retires, the card restores to full opacity +
      // saturation. Card transitions start 40ms earlier than the dock
      // via CSS transition-delay, so on scroll-back the card de-dims
      // first and the dock slides out last.
      card.root.setAttribute('data-dimmed', shouldShow ? 'true' : 'false');
    }

    function updateDockState() {
      dock.root.setAttribute('data-state', state);
      dockPlayBtn.setAttribute('aria-label',
        state === 'playing' ? i18n('audio.pause', 'Pause audio') : i18n('audio.resume', 'Resume audio'));
    }

    function updateDockChapter(chunk) {
      if (dockChapter) setChapterText(dockChapter, chunk ? chapterLabel(chunk) : '');
    }

    function updateDockProgress(pct, elapsed, total) {
      if (dockFill) dockFill.style.width = pct + '%';
      if (dockPrevBtn) dockPrevBtn.disabled = currentIndex <= 0;
      if (dockNextBtn) dockNextBtn.disabled = currentIndex >= chunks.length - 1;
      if (dockTimeNow && dockTimeEnd) {
        // Studio mode passes real seconds; speech mode falls back to
        // chunk-count ("3 / 47") since we don't know per-chunk timing.
        if (typeof elapsed === 'number' && typeof total === 'number' && isFinite(total) && total > 0) {
          dockTimeNow.textContent = formatTime(elapsed);
          dockTimeEnd.textContent = '-' + formatTime(Math.max(0, total - elapsed));
        } else if (chunks.length) {
          dockTimeNow.textContent = String(currentIndex + 1);
          dockTimeEnd.textContent = '/ ' + chunks.length;
        }
      }
    }
    function formatTime(sec) {
      sec = Math.max(0, Math.round(sec));
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return m + ':' + (s < 10 ? '0' + s : s);
    }

    // Set the dock title once — from the page <h1> — so the user can
    // glance at it and know which post they're listening to when they've
    // scrolled far away.
    const postH1 = document.querySelector('.post-hero h1');
    if (postH1 && dockTitleEl) {
      dockTitleEl.textContent = (postH1.innerText || postH1.textContent || '').replace(/\s+/g, ' ').trim();
    }

    // i18n note for the audio player module (dock + card):
    // Visual UI labels (aria-labels, progress text, dropdown titles) are
    // localized via the i18n() helper above. The NARRATION VOICE choice
    // in .listen-voice <select> is deliberately decoupled from the page
    // locale — users may want a Spanish page read in an English voice
    // or the reverse. The voice selector filters available system
    // voices by each voice's own `v.lang` property, which is
    // independent of `document.documentElement.lang`. Changing the
    // site locale never overrides the user's voice pick; changing the
    // voice never overrides the site locale.
    //
    // Deeper blog-audio UI translation (the template-literal strings
    // below) lives in the sibling "improve blog audio" repo, which
    // will stamp localized labels into the innerHTML blocks.
    function buildDock() {
      const root = document.createElement('div');
      root.className = 'listen-dock';
      root.setAttribute('role', 'region');
      root.setAttribute('aria-label', i18n('audio.controls', 'Audio player controls'));
      root.setAttribute('data-state', 'idle');
      root.setAttribute('data-visible', 'false');
      root.setAttribute('data-collapsed', 'false');
      root.innerHTML = `
        <button type="button" class="listen-dock-play" aria-label="Resume audio">
          <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>
          <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>
        </button>
        <div class="listen-dock-meta">
          <span class="listen-dock-title">Audio edition</span>
          <span class="listen-dock-chapter"></span>
        </div>
        <div class="listen-dock-header-actions">
          <button type="button" class="listen-dock-stop" aria-label="Stop audio and close">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>
          </button>
          <button type="button" class="listen-dock-collapse" aria-label="Minimize audio controls">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        <button type="button" class="listen-dock-skip listen-dock-prev" aria-label="Previous paragraph" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" y1="5" x2="5" y2="19"/></svg>
        </button>
        <div class="listen-dock-track">
          <span class="listen-dock-time listen-dock-time-now">0:00</span>
          <div class="listen-dock-progress" role="progressbar" aria-label="Audio progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="listen-dock-progress-fill"></div></div>
          <span class="listen-dock-time listen-dock-time-end">0:00</span>
        </div>
        <button type="button" class="listen-dock-skip listen-dock-next" aria-label="Next paragraph" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        </button>
        <button type="button" class="listen-dock-expand" aria-label="Expand audio controls" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
      `;
      return { root };
    }

    /* ---- Media Session API (iOS / Android lock screen + headphones) ---- */
    // When audio plays, iOS / Android show generic "Audio playing"
    // chrome on the lock screen unless we tell them what's playing.
    // navigator.mediaSession lets us fill in title, artist, artwork
    // and bind hardware/lock-screen buttons (play, pause, skip ±15s,
    // previous/next paragraph, scrub) directly to our controls.
    //
    // We set the metadata once, lazily, on first play — iOS only
    // honours media session when invoked from a real user gesture.
    let mediaSessionWired = false;

    function ensureMediaSession() {
      if (mediaSessionWired) return;
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
      mediaSessionWired = true;

      updateMediaSessionMetadata();

      // Action handlers — every one of these maps to an existing
      // engine method. Wrap in try/catch because some browsers throw
      // for unsupported actions (e.g. seekto on iOS < 15.4).
      const bind = (action, fn) => {
        try { navigator.mediaSession.setActionHandler(action, fn); }
        catch (_) {}
      };
      bind('play',          () => { if (state !== 'playing') startPlayback(); });
      bind('pause',         () => { if (state === 'playing') pausePlayback(); });
      bind('stop',          () => finishPlayback());
      bind('seekbackward',  (d) => seekBy(-(d && d.seekOffset ? d.seekOffset : 15)));
      bind('seekforward',   (d) => seekBy(  d && d.seekOffset ? d.seekOffset : 15));
      bind('previoustrack', () => skipTo(currentIndex - 1));
      bind('nexttrack',     () => skipTo(currentIndex + 1));
      bind('seekto',        (d) => {
        if (engine !== 'audio' || !audioEl || d == null || d.seekTime == null) return;
        audioEl.currentTime = Math.max(0, Math.min(audioEl.duration || 0, d.seekTime));
      });
    }

    // Fills (or refreshes) the lock-screen metadata block. Called
    // on first play and again whenever the user switches language
    // so the album line reflects "Audio edition · Español" etc.
    function updateMediaSessionMetadata() {
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
      const h1   = document.querySelector('.post-hero h1');
      const meta = document.querySelector('meta[property="article:author"]');
      const og   = document.querySelector('meta[property="og:image"]');
      const title  = h1 ? (h1.innerText || h1.textContent || '').replace(/\s+/g, ' ').trim()
                        : document.title;
      const author = (meta && meta.getAttribute('content')) || 'Muntin Digital';
      const ogSrc  = og ? og.getAttribute('content') : '';
      const cover  = ogSrc.endsWith('.svg') ? ogSrc.replace(/\.svg$/, '-cover.png') : ogSrc;
      const artwork = cover ? [{ src: cover, sizes: '512x512', type: 'image/png' }] : [];
      const langName = LANGUAGE_NAMES[currentLanguage] || currentLanguage.toUpperCase();
      const albumLabel = currentLanguage === 'en'
        ? 'Audio edition'
        : `Audio edition · ${langName}`;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist: author + ' · Muntin Digital',
          album: albumLabel,
          artwork,
        });
      } catch (_) {}
    }

    function syncMediaSessionState() {
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
      navigator.mediaSession.playbackState =
        state === 'playing' ? 'playing' :
        state === 'paused'  ? 'paused'  : 'none';
    }

    function syncMediaSessionPosition() {
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
      if (engine !== 'audio' || !audioEl || !audioEl.duration) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audioEl.duration,
          playbackRate: audioEl.playbackRate || 1,
          position: Math.min(audioEl.currentTime, audioEl.duration),
        });
      } catch (_) {}
    }

    window.MuntinReadAloud = { stop: finishPlayback, toggle };

    /* ---- Card builder ---- */
    function buildCard() {
      const root = document.createElement('section');
      root.className = 'listen-card';
      root.setAttribute('data-state', 'idle');
      root.setAttribute('aria-label', i18n('audio.article_label', 'Audio edition of this article'));

      // Reading-time estimate from the post body. Average adult reading
      // pace is ~200 wpm; TTS at 1× is closer to ~155 wpm, so we use
      // 170 as a middle estimate that feels honest without overselling.
      const words = (postBody.innerText || postBody.textContent || '').trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.round(words / 170));

      root.innerHTML = `
        <button type="button" class="listen-card-play" aria-pressed="false" aria-label="Play audio version">
          <span class="listen-card-play-aura" aria-hidden="true"></span>
          <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>
          <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>
          <svg class="icon-finished" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"/></svg>
          <span class="listen-card-play-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
        <div class="listen-card-body">
          <p class="listen-card-kicker"><span>Audio edition</span></p>
          <h2 class="listen-card-title">Prefer to listen?</h2>
          <p class="listen-card-sub">Press play and we'll read the whole post aloud — charts and all.</p>
        </div>
        <div class="listen-card-meta"><strong>${minutes} min</strong><span>hands-free</span></div>
        <div class="listen-card-progress" hidden role="progressbar" aria-label="Audio progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><canvas class="listen-card-waveform" aria-hidden="true"></canvas><div class="listen-card-progress-fill"></div><div class="listen-card-progress-ticks"></div></div>
        <p class="listen-card-chapter"><span class="listen-card-chapter-label">Now reading</span><em></em></p>
        <div class="listen-card-extras" hidden>
          <div class="listen-card-skips">
            <button type="button" class="listen-iconbtn listen-prev" aria-label="Previous paragraph" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" y1="5" x2="5" y2="19"/></svg>
            </button>
            <button type="button" class="listen-iconbtn listen-back15" aria-label="Back 15 seconds" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 8 7 8"/></svg>
              <span class="listen-iconbtn-label">15</span>
            </button>
            <button type="button" class="listen-iconbtn listen-fwd15" aria-label="Forward 15 seconds" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 4 21 8 17 8"/></svg>
              <span class="listen-iconbtn-label">15</span>
            </button>
            <button type="button" class="listen-iconbtn listen-next" aria-label="Next paragraph" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>
          </div>
          <div class="listen-card-selects">
            <label class="listen-select listen-language-select" title="Language" hidden><span class="sr-only">Language</span>
              <select class="listen-language" aria-label="Language"></select>
            </label>
            <label class="listen-select" title="Playback speed"><span class="sr-only">Playback speed</span>
              <select class="listen-rate" aria-label="Playback speed">
                <option value="0.9">0.9×</option>
                <option value="1" selected>1×</option>
                <option value="1.2">1.2×</option>
                <option value="1.5">1.5×</option>
              </select>
            </label>
            <label class="listen-select" title="Reader voice"><span class="sr-only">Reader voice</span>
              <select class="listen-voice" aria-label="Reader voice"></select>
            </label>
          </div>
          <span class="listen-source-note" data-source="browser">Read by your browser</span>
        </div>
      `;

      return { root };
    }
  })();

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

  /* =========================================================
     SHARE WIDGET
     One initializer for every share widget on the page.
     Markup contract: any element with [data-share] carrying a
     .share-btn and a .share-menu with .share-item children that
     each declare data-share-to="x|linkedin|facebook|reddit|
     whatsapp|email|copy".
     The widget prefers navigator.share() (native OS share sheet)
     when available — that's the real "share anywhere" — and
     falls back to the dropdown menu when it isn't (Firefox).
     ========================================================= */
  (function initShare(){
    const roots = document.querySelectorAll('[data-share]');
    if (!roots.length) return;

    // One page = one canonical URL + og:title. Read once; every
    // widget on the page reuses them.
    const urlEl   = document.querySelector('link[rel="canonical"]');
    const titleEl = document.querySelector('meta[property="og:title"]');
    const url   = (urlEl && urlEl.href) || window.location.href;
    const title = (titleEl && titleEl.content) || (document.title || '').split(' | ')[0] || 'Muntin Digital';

    const enc = encodeURIComponent;
    // Microblog networks accept "text" as a single field; messengers are
    // a mix; Facebook/LinkedIn only accept a URL (they scrape og:* on
    // their end). Mastodon is federated — toot.kytta.dev is a neutral
    // instance picker so the user can pick their home server.
    const intents = {
      x:        'https://twitter.com/intent/tweet?url=' + enc(url) + '&text=' + enc(title),
      bluesky:  'https://bsky.app/intent/compose?text=' + enc(title + ' ' + url),
      threads:  'https://www.threads.net/intent/post?text=' + enc(title + ' ' + url),
      mastodon: 'https://toot.kytta.dev/?text=' + enc(title + ' ' + url),
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(url),
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url),
      reddit:   'https://www.reddit.com/submit?url=' + enc(url) + '&title=' + enc(title),
      whatsapp: 'https://api.whatsapp.com/send?text=' + enc(title + ' ' + url),
      telegram: 'https://t.me/share/url?url=' + enc(url) + '&text=' + enc(title),
      email:    'mailto:?subject=' + enc(title) + '&body=' + enc(url),
    };

    function track(target){
      if (typeof window.plausible === 'function') {
        window.plausible('Share', { props: { target: target, page: window.location.pathname } });
      }
    }

    roots.forEach((root) => {
      const btn  = root.querySelector('.share-btn');
      const menu = root.querySelector('.share-menu');
      if (!btn || !menu) return;

      const items = root.querySelectorAll('[data-share-to]');
      items.forEach((el) => {
        const target = el.getAttribute('data-share-to');
        if (target === 'copy') {
          el.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(url);
              const original = el.textContent;
              el.textContent = 'Link copied ✓';
              el.classList.add('copied');
              track('copy');
              setTimeout(() => {
                el.textContent = original;
                el.classList.remove('copied');
                closeMenu();
              }, 1500);
            } catch (_) {
              el.textContent = 'Copy failed — select the URL manually';
            }
          });
        } else if (intents[target]) {
          el.setAttribute('href', intents[target]);
          el.addEventListener('click', () => {
            track(target);
            // Close shortly after so the new tab has already opened.
            setTimeout(closeMenu, 50);
          });
        }
      });

      function openMenu(){
        menu.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
      function closeMenu(){
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }

      btn.addEventListener('click', (e) => {
        // Stop the document-level outside-click handler from closing on
        // the same tick as opening.
        e.stopPropagation();

        // Prefer the native OS share sheet (iOS, Android, macOS Safari,
        // Edge on Windows). It opens the user's full app list — WhatsApp,
        // Messages, Signal, Notes, Mail, any installed app — which is
        // what "share anywhere" actually means.
        if (navigator.share) {
          navigator.share({ title, url })
            .then(() => track('native'))
            .catch(() => { /* user dismissed; nothing to do */ });
          return;
        }

        // Firefox / older browsers: toggle the in-page menu.
        if (menu.hidden) openMenu(); else closeMenu();
      });

      // Click outside closes. closest() catches clicks on the button's
      // SVG child whose target is the <svg>/<path>, not the button.
      document.addEventListener('click', (e) => {
        if (menu.hidden) return;
        if (!root.contains(e.target)) closeMenu();
      });

      root.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.hidden) {
          closeMenu();
          btn.focus();
        }
      });
    });
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

  // ───────────────────────────────────────────────────────────────
  // SEARCH MODAL (Pagefind-backed)
  //
  // Opens on Cmd/Ctrl+K, forward-slash, or a click on any
  // .js-open-search element. Pagefind's JS + index live under
  // /pagefind/ (built during deploy) and are lazy-loaded on first
  // open so the search feature costs the page zero bytes until it's
  // actually used.
  //
  // Locale: Pagefind splits its index by <html lang>, so the user's
  // current page locale determines which results surface. No
  // per-request locale filter needed.
  //
  // Keyboard: ↑/↓ to move selection, ↵ to open, Esc to close. The
  // opener element is remembered so focus returns there on close
  // (follows the same pattern the checklist popover uses above).
  // ───────────────────────────────────────────────────────────────
  (() => {
    // No-op on browsers without <dialog>.showModal. Rather than ship a
    // polyfill for the 1% of tails that lack it, fall back to linking
    // to /learn/ — the hub still works and no crash ever surfaces.
    const testDialog = document.createElement('dialog');
    if (typeof testDialog.showModal !== 'function') {
      document.querySelectorAll('.js-open-search').forEach((el) => {
        if (el.tagName === 'BUTTON') el.addEventListener('click', () => { location.href = '/learn/'; });
      });
      return;
    }

    let dialog = null;       // the <dialog> element, created on first open
    let input = null;        // the text input
    let results = null;      // the results list container
    let pagefind = null;     // the Pagefind module, lazy-imported
    let pagefindPromise = null;
    let lastOpener = null;   // element to re-focus on close
    let debounce = null;     // debounce timer for search input
    let activeIndex = -1;    // currently-selected result index
    let lastQuery = '';

    const locale = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('es') ? 'es' : 'en';
    const strings = {
      placeholder: i18n('search.placeholder', 'Search articles, tools, glossary terms…'),
      close:       i18n('search.close',       'Close'),
      hintTitle:   i18n('search.hint_title',  'What are you looking for?'),
      hintBody:    i18n('search.hint_body',   'Try "DoorDash", "Core Web Vitals", or "menu prices." Results come from every article, tool, and glossary term in the library.'),
      empty:       i18n('search.empty',       'No results for'),
      emptyHint:   i18n('search.empty_hint',  'Try a shorter query or a different word.'),
      loading:     i18n('search.loading',     'Searching…'),
      navHint:     i18n('search.nav_hint',    'to navigate'),
      openHint:    i18n('search.open_hint',   'to open'),
      closeHint:   i18n('search.close_hint',  'to close'),
    };

    // Curated fallback for queries Pagefind drops as too-common.
    // Pagefind's v1.x index optimizer filters tokens that appear on
    // >~80% of pages (a relevance heuristic — common terms can't
    // discriminate between results). On a restaurant-website site,
    // "web" / "website" / "menu" / "restaurant" all blow through that
    // ceiling and get dropped from the index. Re-deriving the index
    // is out of scope; instead, when one of these queries returns 0
    // results, we render a "try our topic shelf for X" panel with
    // hand-picked landings so the operator never sees a dead-end.
    //
    // Adding a term: append it to the right locale block. The label
    // is what shows in the panel ("our SEO and discovery topic"),
    // the href is the actual landing.
    const COMMON_QUERY_REDIRECTS = {
      en: {
        'web':         { label: 'Speed & mobile',          href: '/learn/topics/speed-mobile/'   },
        'website':     { label: 'Speed & mobile',          href: '/learn/topics/speed-mobile/'   },
        'menu':        { label: 'Operations & margin',     href: '/learn/topics/operations-margin/' },
        'menus':       { label: 'Operations & margin',     href: '/learn/topics/operations-margin/' },
        'restaurant':  { label: 'For restaurants',         href: '/for/restaurants/'             },
        'restaurants': { label: 'For restaurants',         href: '/for/restaurants/'             },
        'tools':       { label: 'All free tools',          href: '/tools/'                       },
        'tool':        { label: 'All free tools',          href: '/tools/'                       },
        'library':     { label: 'Library home',            href: '/learn/'                       },
        'glossary':    { label: 'Glossary',                href: '/glossary/'                    },
      },
      es: {
        'web':            { label: 'Velocidad y móvil',           href: '/es/learn/topics/speed-mobile/'    },
        'sitio':          { label: 'Velocidad y móvil',           href: '/es/learn/topics/speed-mobile/'    },
        'sitio web':      { label: 'Velocidad y móvil',           href: '/es/learn/topics/speed-mobile/'    },
        'menu':           { label: 'Operaciones y márgenes',      href: '/es/learn/topics/operations-margin/' },
        'menú':           { label: 'Operaciones y márgenes',      href: '/es/learn/topics/operations-margin/' },
        'menús':          { label: 'Operaciones y márgenes',      href: '/es/learn/topics/operations-margin/' },
        'restaurante':    { label: 'Para restaurantes',           href: '/es/for/restaurants/'              },
        'restaurantes':   { label: 'Para restaurantes',           href: '/es/for/restaurants/'              },
        'herramientas':   { label: 'Todas las herramientas',      href: '/es/tools/'                        },
        'herramienta':    { label: 'Todas las herramientas',      href: '/es/tools/'                        },
        'biblioteca':     { label: 'Inicio de la biblioteca',     href: '/es/learn/'                        },
        'glosario':       { label: 'Glosario',                    href: '/es/glossary/'                     },
      },
    };
    const fallbackStrings = locale === 'es'
      ? { lead: 'No encontramos coincidencias exactas para',
          suggestion: 'Pero esa palabra aparece en casi todas las páginas, así que el buscador la ignora. Empieza por:',
          ctaPrefix: 'Ir a' }
      : { lead: 'No exact matches for',
          suggestion: 'That word shows up on almost every page, so the search index drops it. Start here instead:',
          ctaPrefix: 'Open' };

    function commonQueryFallback(q) {
      const key = String(q || '').trim().toLowerCase();
      if (!key) return null;
      const map = COMMON_QUERY_REDIRECTS[locale] || {};
      return map[key] || null;
    }

    // Classify a URL into a user-facing "kind" so the result meta row
    // can show something more useful than "/tools/seo-grader/" — e.g.
    // "TOOL · /tools/seo-grader/". Mapping lives here (JS side) rather
    // than in Pagefind meta tags so it's trivial to extend.
    function classify(url) {
      const u = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/es\//, '/');
      if (u.startsWith('/blog/'))            return i18n('search.kind_article',   'Article');
      if (u.startsWith('/tools/'))           return i18n('search.kind_tool',      'Tool');
      if (u.startsWith('/glossary/'))        return i18n('search.kind_term',      'Glossary');
      if (u.startsWith('/learn/checklists/')) return i18n('search.kind_resource',  'Guide');
      if (u.startsWith('/learn/'))           return i18n('search.kind_library',   'Library');
      if (u.startsWith('/work/'))      return i18n('search.kind_case',      'Case study');
      if (u.startsWith('/services/'))  return i18n('search.kind_service',   'Services');
      if (u.startsWith('/for/'))       return i18n('search.kind_industry',  'For you');
      return i18n('search.kind_page', 'Page');
    }

    // Build the modal DOM the first time the user opens search. This
    // keeps the baseline page weight at zero for readers who never
    // trigger it (including most mobile visitors on a single article).
    function ensureModal() {
      if (dialog) return;
      dialog = document.createElement('dialog');
      dialog.className = 'search-modal';
      dialog.setAttribute('aria-label', locale === 'es' ? 'Buscar' : 'Search');
      dialog.innerHTML = `
        <div class="search-modal-inner">
          <div class="search-input-wrap">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
            <input type="search" class="search-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="${strings.placeholder}" placeholder="${strings.placeholder}">
            <button type="button" class="search-close" aria-label="${strings.close}">${strings.close}</button>
          </div>
          <div class="search-results" role="listbox" aria-label="${strings.hintTitle}">
            <div class="search-hint"><strong>${strings.hintTitle}</strong>${strings.hintBody}</div>
          </div>
          <div class="search-footer" aria-hidden="true">
            <span class="search-footer-hints">
              <span><kbd>↑</kbd><kbd>↓</kbd> ${strings.navHint}</span>
              <span><kbd>↵</kbd> ${strings.openHint}</span>
              <span><kbd>esc</kbd> ${strings.closeHint}</span>
            </span>
            <span>Pagefind</span>
          </div>
        </div>`;
      document.body.appendChild(dialog);
      input   = dialog.querySelector('.search-input');
      results = dialog.querySelector('.search-results');
      dialog.querySelector('.search-close').addEventListener('click', close);
      dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
      dialog.addEventListener('close', () => {
        if (lastOpener && typeof lastOpener.focus === 'function') lastOpener.focus();
        lastOpener = null;
      });
      input.addEventListener('input', onInput);
      input.addEventListener('keydown', onInputKeydown);
    }

    // Lazy-load Pagefind from the static index directory. Returns a
    // cached promise so concurrent opens don't double-fetch.
    function ensurePagefind() {
      if (pagefindPromise) return pagefindPromise;
      pagefindPromise = import('/pagefind/pagefind.js')
        .then(async (mod) => { await mod.options({ baseUrl: '/' }); pagefind = mod; return mod; })
        .catch((err) => { console.warn('[search] pagefind failed to load', err); pagefindPromise = null; throw err; });
      return pagefindPromise;
    }

    function open(opener) {
      ensureModal();
      lastOpener = opener || document.activeElement;
      dialog.showModal();
      // Defer focus so the dialog is visible before the input grabs focus.
      requestAnimationFrame(() => { try { input.focus(); input.select(); } catch (_) {} });
      // Start warming the index in the background if it isn't loaded yet.
      ensurePagefind().catch(() => {});
    }

    function close() {
      if (dialog && dialog.open) dialog.close();
    }

    function onInput() {
      clearTimeout(debounce);
      const q = input.value.trim();
      if (q === lastQuery) return;
      lastQuery = q;
      if (!q) {
        results.innerHTML = `<div class="search-hint"><strong>${strings.hintTitle}</strong>${strings.hintBody}</div>`;
        activeIndex = -1;
        return;
      }
      // Show loading state while we wait for pagefind + results.
      results.innerHTML = `<div class="search-loading">${strings.loading}</div>`;
      debounce = setTimeout(() => runSearch(q), 140);
    }

    async function runSearch(q) {
      try {
        const mod = await ensurePagefind();
        if (q !== lastQuery) return; // user kept typing
        const res = await mod.search(q);
        if (q !== lastQuery) return;
        const hits = res.results.slice(0, 8);
        const data = await Promise.all(hits.map((r) => r.data()));
        if (q !== lastQuery) return;
        renderResults(q, data);
      } catch (err) {
        results.innerHTML = `<div class="search-empty"><strong>${strings.empty}</strong> "${escapeHtml(q)}"<br>${strings.emptyHint}</div>`;
      }
    }

    function renderResults(q, data) {
      if (!data.length) {
        // Try the curated common-query fallback first. If the query
        // is one Pagefind drops as too-common (web/website/menu/etc.),
        // surface a topical landing instead of the generic dead-end.
        const fb = commonQueryFallback(q);
        if (fb) {
          results.innerHTML = `<div class="search-empty">
            <strong>${fallbackStrings.lead}</strong> "${escapeHtml(q)}"<br>
            <span class="search-empty-help">${fallbackStrings.suggestion}</span>
            <a class="search-fallback-link" href="${escapeAttr(fb.href)}">
              ${escapeHtml(fallbackStrings.ctaPrefix)} ${escapeHtml(fb.label)}
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>`;
        } else {
          results.innerHTML = `<div class="search-empty"><strong>${strings.empty}</strong> "${escapeHtml(q)}"<br>${strings.emptyHint}</div>`;
        }
        activeIndex = -1;
        return;
      }
      const html = data.map((d, i) => {
        const kind  = classify(d.url);
        const title = (d.meta && d.meta.title) || d.url;
        const href  = d.url.replace(/^https?:\/\/[^/]+/, '');
        // Pagefind returns <mark> tags inside excerpts for highlight —
        // keep them, they style via .search-result-excerpt mark in CSS.
        return `<a class="search-result" role="option" href="${escapeAttr(href)}" data-idx="${i}">
          <div class="search-result-meta"><span class="search-result-kind">${escapeHtml(kind)}</span><span>${escapeHtml(href)}</span></div>
          <div class="search-result-title">${escapeHtml(title)}</div>
          <div class="search-result-excerpt">${d.excerpt}</div>
        </a>`;
      }).join('');
      results.innerHTML = html;
      activeIndex = 0;
      setActive(activeIndex);
      // Hover selects (mouse and keyboard share the visual highlight).
      results.querySelectorAll('.search-result').forEach((el, i) => {
        el.addEventListener('mouseenter', () => setActive(i));
      });
    }

    function setActive(i) {
      const items = results.querySelectorAll('.search-result');
      if (!items.length) return;
      activeIndex = (i + items.length) % items.length;
      items.forEach((el, idx) => el.classList.toggle('is-active', idx === activeIndex));
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    function onInputKeydown(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
      else if (e.key === 'Enter') {
        const items = results.querySelectorAll('.search-result');
        if (items[activeIndex]) { e.preventDefault(); items[activeIndex].click(); }
      }
    }

    // Global keybinding: Cmd+K / Ctrl+K, and `/` when not already
    // typing in a form. Ignore when any modifier-less key is pressed
    // inside an input so forms aren't hijacked.
    document.addEventListener('keydown', (e) => {
      const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open(e.target);
      } else if (e.key === '/' && !inField && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        open(e.target);
      }
    });

    // Hook up every search trigger on the page.
    document.querySelectorAll('.js-open-search').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); open(el); });
    });

    // Small HTML-escape helpers (Pagefind already escapes titles/urls,
    // but we re-escape when interpolating into the template to stay
    // defense-in-depth. Excerpts intentionally skipped: Pagefind emits
    // pre-escaped HTML with <mark> tags we want to render).
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }
    function escapeAttr(s) { return escapeHtml(s); }
  })();

  // ───────────────────────────────────────────────────────────────
  // RESEARCH DRAWER (inline research-note preview)
  //
  // Intercepts clicks on .cite-note-link (in blog post citations)
  // and .link-research (in audit result rows + the audit metric
  // glossary) — any anchor whose href points to a /learn/research/
  // page under either locale. Instead of opening a new tab, the
  // click lazy-fetches that research note's HTML, extracts the
  // preview sections (hero, Don's note, key findings, source), and
  // renders them into a side-sheet dialog. The reader keeps their
  // origin page (audit session or article scroll position) intact.
  //
  // Progressive enhancement: any of the following falls back to
  // the trigger's existing target="_blank" new-tab behavior —
  //   - <dialog>.showModal unavailable (old Safari, older Firefox)
  //   - DOMParser or fetch unavailable
  //   - reader holds ⌘/Ctrl/shift to force a new tab or new window
  //   - fetch fails (offline, 404)
  // Upshot: nothing breaks when the drawer can't open; the user
  // just gets the old new-tab flow.
  // ───────────────────────────────────────────────────────────────
  (() => {
    // Capability gate. Fall back to native new-tab if anything is
    // missing. No polyfills — the baseline already works.
    const probeDialog = document.createElement('dialog');
    if (typeof probeDialog.showModal !== 'function') return;
    if (typeof DOMParser !== 'function' || typeof fetch !== 'function') return;

    // Only hijack links that point at a research-note URL. Matches
    // /learn/research/<slug>/ and /es/learn/research/<slug>/ on the
    // same origin. External links and anchors to other pages keep
    // their current behavior.
    const RESEARCH_HREF_RE = /^\/(?:es\/)?learn\/research\/[a-z0-9-]+\/?$/i;

    // Copy keys localized via the existing i18n helper so ES readers
    // see Spanish strings. English literals are the fallback for any
    // missing key.
    const strings = {
      kicker:         i18n('drawer.kicker',        'Research note'),
      close:          i18n('drawer.close',         'Close'),
      loading:        i18n('drawer.loading',       'Loading the summary…'),
      errTitle:       i18n('drawer.err_title',     'Couldn’t load the summary'),
      errBody:        i18n('drawer.err_body',      'Open the full note in a new tab instead — it’s the same content, just more of it.'),
      findingsLabel:  i18n('drawer.findings_label','Key findings'),
      noteLabel:      i18n('drawer.note_label',    'Don’s note'),
      readFull:       i18n('drawer.read_full',     'Read the full note'),
      readOriginal:   i18n('drawer.read_original', 'See the original source'),
      openInNewTab:   i18n('drawer.open_new_tab',  'opens in a new tab'),
    };

    let dialog = null;
    let body = null;
    let actions = null;
    let lastOpener = null;
    const cache = new Map();   // slug → parsed preview object
    let inFlight = null;       // AbortController for the current fetch

    const EXTERNAL_ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="14" height="14"><path d="M7 17L17 7M9 7h8v8"/></svg>';

    function ensureDialog() {
      if (dialog) return;
      dialog = document.createElement('dialog');
      dialog.className = 'research-drawer';
      dialog.setAttribute('aria-label', strings.kicker);
      dialog.innerHTML =
        '<div class="research-drawer-inner">' +
          '<div class="research-drawer-head">' +
            '<span class="research-drawer-kicker">' + strings.kicker + '</span>' +
            '<button type="button" class="research-drawer-close" aria-label="' + strings.close + '">' + strings.close + '</button>' +
          '</div>' +
          '<div class="research-drawer-body" role="document"></div>' +
          '<div class="research-drawer-actions"></div>' +
        '</div>';
      document.body.appendChild(dialog);
      body = dialog.querySelector('.research-drawer-body');
      actions = dialog.querySelector('.research-drawer-actions');
      dialog.querySelector('.research-drawer-close').addEventListener('click', close);
      dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
      dialog.addEventListener('close', () => {
        if (lastOpener && typeof lastOpener.focus === 'function') lastOpener.focus();
        lastOpener = null;
        if (inFlight) { inFlight.abort(); inFlight = null; }
      });
    }

    function open(trigger, href) {
      ensureDialog();
      lastOpener = trigger;
      body.innerHTML = '<div class="research-drawer-loading">' + strings.loading + '</div>';
      actions.innerHTML = '';
      try { dialog.showModal(); } catch (_) { /* already open */ }

      // Serve from cache on second open.
      const slug = href.split('/').filter(Boolean).pop();
      if (cache.has(slug)) { render(href, cache.get(slug)); return; }

      // Fetch + extract.
      if (inFlight) inFlight.abort();
      inFlight = new AbortController();
      fetch(href, { signal: inFlight.signal, credentials: 'same-origin' })
        .then((res) => {
          if (!res.ok) throw new Error('status ' + res.status);
          return res.text();
        })
        .then((html) => {
          const preview = extract(html);
          if (!preview) throw new Error('preview extraction failed');
          cache.set(slug, preview);
          render(href, preview);
        })
        .catch((err) => {
          if (err && err.name === 'AbortError') return;
          renderError(href);
        });
    }

    function close() {
      if (dialog && dialog.open) dialog.close();
    }

    // Parse a research note's HTML and pull out the pieces that
    // make the preview. Tolerant to layout drift — each getter is
    // independently null-safe, so a redesigned note that drops
    // (say) the dek still renders the rest.
    function extract(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const hero = doc.querySelector('.research-hero');
      if (!hero) return null;
      const title = (doc.querySelector('.research-hero h1') || {}).innerHTML || '';
      const sourceLine = (doc.querySelector('.research-source-line') || {}).innerHTML || '';
      const dek = (doc.querySelector('.research-dek') || {}).textContent || '';
      // Don's note: prefer the first <p> inside .research-note.
      const noteP = doc.querySelector('.research-note p');
      const note = noteP ? noteP.innerHTML : '';
      // Top 3 findings (the note itself carries 5; keep the preview lean).
      const findings = Array.from(doc.querySelectorAll('.research-findings > li')).slice(0, 3).map((li) => li.innerHTML);
      // External source link — the "Read the original …" button in
      // the .research-original aside.
      const origAnchor = doc.querySelector('.research-original a[href^="http"]');
      const originalHref = origAnchor ? origAnchor.getAttribute('href') : '';
      return { title, sourceLine, dek, note, findings, originalHref };
    }

    function render(href, preview) {
      let html = '';
      if (preview.sourceLine) html += '<div class="research-drawer-source">' + preview.sourceLine + '</div>';
      if (preview.title)      html += '<h2 class="research-drawer-title">' + preview.title + '</h2>';
      if (preview.dek)        html += '<p class="research-drawer-dek">' + escapeHtml(preview.dek) + '</p>';
      if (preview.note) {
        html += '<p class="research-drawer-section-label">' + strings.noteLabel + '</p>';
        html += '<p class="research-drawer-note">' + preview.note + '</p>';
      }
      if (preview.findings && preview.findings.length) {
        html += '<p class="research-drawer-section-label">' + strings.findingsLabel + '</p>';
        html += '<ul class="research-drawer-findings">' + preview.findings.map((f) => '<li>' + f + '</li>').join('') + '</ul>';
      }
      body.innerHTML = html;

      // Action footer: "Read the full note" opens the full research
      // page in a new tab (keeps the origin page intact). "See the
      // original source" opens the external study.
      let actionsHtml =
        '<a class="btn btn-primary" href="' + escapeAttr(href) + '" target="_blank" rel="noopener">' +
          strings.readFull + EXTERNAL_ARROW_SVG +
          '<span class="sr-only"> (' + strings.openInNewTab + ')</span>' +
        '</a>';
      if (preview.originalHref) {
        actionsHtml +=
          '<a class="btn btn-ghost" href="' + escapeAttr(preview.originalHref) + '" target="_blank" rel="noopener noreferrer">' +
            strings.readOriginal + EXTERNAL_ARROW_SVG +
            '<span class="sr-only"> (' + strings.openInNewTab + ')</span>' +
          '</a>';
      }
      actions.innerHTML = actionsHtml;
    }

    function renderError(href) {
      body.innerHTML =
        '<p class="research-drawer-error">' +
          '<strong>' + strings.errTitle + '</strong>' + strings.errBody +
        '</p>';
      actions.innerHTML =
        '<a class="btn btn-primary" href="' + escapeAttr(href) + '" target="_blank" rel="noopener">' +
          strings.readFull + EXTERNAL_ARROW_SVG +
          '<span class="sr-only"> (' + strings.openInNewTab + ')</span>' +
        '</a>';
    }

    // Global click interceptor. Captures clicks on research-note
    // anchors during bubbling so nothing else has to know about the
    // drawer. Modifier keys (⌘/Ctrl/shift/middle-click) bypass us and
    // fall through to the browser's native new-tab/new-window handling
    // — preserves user intent on power-user clicks.
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!RESEARCH_HREF_RE.test(href)) return;
      // Same-origin only (the regex already guarantees a relative
      // href, so no cross-origin concern).
      e.preventDefault();
      open(a, href);
    });

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }
    function escapeAttr(s) { return escapeHtml(s); }
  })();

// ============================================================
// Spam-defense: stamp every /api/* form with a load-time
// timestamp. Pairs with isTimestampSane() in src/lib/validation.js
// — the worker rejects any submit that's missing the field (i.e.
// the bot didn't run JS) or that arrives faster than 1.5s after
// page load (i.e. an instant-submit auto-poster). Safe to run
// more than once: the IIFE finds an existing _ts input before
// creating one, so a re-render that re-mounts a form updates
// rather than duplicates the field. Auto-applies to all current
// and future forms whose action starts with "/api/".
// ============================================================
(function stampFormTimestamps(){
  function stamp() {
    var ts = String(Date.now());
    var forms = document.querySelectorAll('form[action^="/api/"]');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      var existing = form.querySelector('input[name="_ts"]');
      if (existing) { existing.value = ts; continue; }
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_ts';
      input.value = ts;
      form.appendChild(input);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stamp);
  } else {
    stamp();
  }
})();

/* ============ Glossary inline popover ============
 *
 * Progressive enhancement for in-article glossary autolinks. The build
 * step (autoLinkGlossary in scripts/build-library.mjs) stamps every
 * inline /glossary/<term>/ link with three data attributes:
 *   data-glossary-head   — the term's display headword
 *   data-glossary-aka    — optional AKA / sub-head
 *   data-glossary-blurb  — first sentence of the definition
 *
 * On hover or keyboard focus this script renders a small popover near
 * the link with that content + a "read more" link. The link still
 * works without JS — popover is decoration only. One reusable popover
 * element is appended to <body>; positioned via getBoundingClientRect.
 * Dismissal: mouseleave (with grace timer), blur, click outside,
 * Escape, scroll. Respects prefers-reduced-motion (no fade transition).
 */
(function(){
  if (typeof document === 'undefined') return;
  var triggers = document.querySelectorAll('a[data-glossary-blurb]');
  if (!triggers.length) return;

  var popover     = null;
  var hideTimer   = 0;
  var activeLink  = null;
  var prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensurePopover(){
    if (popover) return popover;
    popover = document.createElement('div');
    popover.className = 'glossary-popover';
    popover.setAttribute('role', 'tooltip');
    popover.setAttribute('aria-hidden', 'true');
    popover.innerHTML =
      '<p class="glossary-popover__head"></p>' +
      '<p class="glossary-popover__aka"></p>' +
      '<p class="glossary-popover__blurb"></p>' +
      '<a class="glossary-popover__more" href="#"></a>';
    document.body.appendChild(popover);

    // Keep open while the cursor is on the popover itself, so the
    // reader can move from the link to the popover to click "read more".
    popover.addEventListener('mouseenter', function(){ window.clearTimeout(hideTimer); });
    popover.addEventListener('mouseleave', scheduleHide);
    return popover;
  }

  function show(link){
    var head  = link.getAttribute('data-glossary-head')  || '';
    var aka   = link.getAttribute('data-glossary-aka')   || '';
    var blurb = link.getAttribute('data-glossary-blurb') || '';
    var href  = link.getAttribute('href') || '';
    if (!head || !blurb) return;

    var p = ensurePopover();
    p.querySelector('.glossary-popover__head').textContent = head;
    var akaEl = p.querySelector('.glossary-popover__aka');
    akaEl.textContent = aka;
    akaEl.style.display = aka ? '' : 'none';
    p.querySelector('.glossary-popover__blurb').textContent = blurb;
    var more = p.querySelector('.glossary-popover__more');
    more.setAttribute('href', href);
    // Localised "read the full definition" label. Read once from the
    // page's <html lang> attribute — no message bundle needed for one
    // string used by one component.
    var lang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2);
    more.textContent = (lang === 'es' ? 'Leer la definición completa' : 'Read the full definition') + ' →';

    var rect = link.getBoundingClientRect();
    var popH = p.offsetHeight || 140;
    var popW = Math.min(360, window.innerWidth - 24);
    p.style.maxWidth = popW + 'px';
    var preferAbove = rect.top > popH + 16;
    var top  = preferAbove ? (rect.top - popH - 8) : (rect.bottom + 8);
    var left = Math.max(12, Math.min(window.innerWidth - popW - 12, rect.left + (rect.width / 2) - (popW / 2)));
    p.style.top  = (top + window.scrollY) + 'px';
    p.style.left = (left + window.scrollX) + 'px';
    p.setAttribute('data-position', preferAbove ? 'above' : 'below');
    p.setAttribute('aria-hidden', 'false');
    p.classList.add('is-visible');
    activeLink = link;

    if (window.plausible) {
      window.plausible('Glossary Popover', { props: { term: href } });
    }
  }

  function hide(){
    if (!popover) return;
    popover.classList.remove('is-visible');
    popover.setAttribute('aria-hidden', 'true');
    activeLink = null;
  }

  function scheduleHide(){
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(hide, prefersReduce ? 0 : 200);
  }

  for (var i = 0; i < triggers.length; i++) {
    var link = triggers[i];
    link.addEventListener('mouseenter', (function(L){ return function(){
      window.clearTimeout(hideTimer);
      show(L);
    }; })(link));
    link.addEventListener('mouseleave', scheduleHide);
    link.addEventListener('focus', (function(L){ return function(){
      window.clearTimeout(hideTimer);
      show(L);
    }; })(link));
    link.addEventListener('blur', scheduleHide);
  }

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && activeLink) {
      hide();
      activeLink && activeLink.blur();
    }
  });
  // Hide on scroll (popover would otherwise drift away from its anchor).
  window.addEventListener('scroll', function(){ if (activeLink) hide(); }, { passive: true });
})();

/* ============ Glossary explainer player ============
 *
 * Drives the 90-second narrated diagrams on the five flagship
 * glossary term pages. Pure progressive enhancement; the captions
 * (which are the narration script) are visible without JS, and the
 * SVG renders the first scene as a static frame. JS adds the timed
 * scene transitions, the play/pause/scrub chrome, and the active-
 * caption highlight.
 *
 * Reads scene timing from data-duration-ms on each [data-scene-id]
 * <g> in the SVG and on each <li data-scene-id> in the captions
 * column. The runtime never invents timing; it just plays back what
 * the data says.
 *
 * Future audio support: when an .audio_url is added to the data
 * file, the wire script will append <audio src="..."> alongside the
 * stage; this runtime detects it and switches to audio.currentTime
 * as the source of truth instead of a setInterval. The visible
 * chrome doesn't change; only the timing source.
 */
(function(){
  if (typeof document === 'undefined') return;
  var explainers = document.querySelectorAll('.term-explainer');
  if (!explainers.length) return;

  for (var i = 0; i < explainers.length; i++) {
    initExplainer(explainers[i]);
  }

  function initExplainer(root){
    var stage     = root.querySelector('.term-explainer__stage svg');
    var sceneEls  = stage ? Array.prototype.slice.call(stage.querySelectorAll('g.explainer-scene')) : [];
    var capEls    = Array.prototype.slice.call(root.querySelectorAll('.term-explainer__captions li[data-scene-id]'));
    var capList   = root.querySelector('.term-explainer__captions ol');
    var playBtn   = root.querySelector('.term-explainer__playpause');
    var scrub     = root.querySelector('.term-explainer__scrub');
    var scrubFill = root.querySelector('.term-explainer__scrub-fill');
    var scrubDots = Array.prototype.slice.call(root.querySelectorAll('.term-explainer__scrub-dot'));
    var timeEl    = root.querySelector('.term-explainer__time');
    var restart   = root.querySelector('.term-explainer__restart');
    var audio     = root.querySelector('audio');
    if (!sceneEls.length || !capEls.length || !playBtn) return;

    // Build the scene list from the caption order (which is the
    // canonical script). Each scene gets {id, ms, start} where start
    // is cumulative.
    var scenes = [];
    var total = 0;
    for (var i = 0; i < capEls.length; i++) {
      var li = capEls[i];
      var id = li.getAttribute('data-scene-id');
      var ms = parseInt(li.getAttribute('data-duration-ms') || '0', 10);
      if (!id || ms <= 0) continue;
      scenes.push({ id: id, ms: ms, start: total });
      total += ms;
    }
    if (!scenes.length) return;

    var elapsed = 0;
    var playing = false;
    var raf = 0;
    var lastTick = 0;
    var activeIdx = -1;
    var prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setActive(idx){
      if (idx === activeIdx) return;
      activeIdx = idx;
      var scene = scenes[idx];
      // Toggle SVG scene layers.
      for (var i = 0; i < sceneEls.length; i++) {
        sceneEls[i].classList.toggle('is-active', sceneEls[i].getAttribute('data-scene-id') === scene.id);
      }
      // Toggle caption emphasis + scroll the active caption into view.
      capEls.forEach(function(el, i){
        el.classList.toggle('is-active', i === idx);
        el.classList.toggle('is-past',   i <  idx);
      });
      scrubDots.forEach(function(d, i){ d.classList.toggle('is-passed', i <= idx); });
      if (capList) {
        var active = capEls[idx];
        var listRect = capList.parentElement.getBoundingClientRect();
        var elRect   = active.getBoundingClientRect();
        var offset = (elRect.top - listRect.top) - (listRect.height / 2) + (elRect.height / 2);
        // Translate the <ol> rather than using scrollTop so the
        // animation feels intentional (smooth crossfade-style).
        var current = parseFloat((capList.style.transform || '').replace(/[^-\d.]/g, '')) || 0;
        capList.style.transform = 'translateY(' + (current - offset) + 'px)';
      }
    }

    function tick(now){
      if (!playing) return;
      var dt = lastTick ? (now - lastTick) : 0;
      lastTick = now;
      if (audio && !audio.paused) {
        elapsed = (audio.currentTime || 0) * 1000;
      } else {
        elapsed += dt;
      }
      if (elapsed >= total) {
        elapsed = total;
        pause();
        // Auto-rewind to start so the next play press starts fresh.
        window.setTimeout(function(){ if (!playing) seek(0); }, 1200);
        renderProgress();
        return;
      }
      renderProgress();
      raf = window.requestAnimationFrame(tick);
    }

    function renderProgress(){
      // Find the active scene by elapsed.
      var idx = 0;
      for (var i = 0; i < scenes.length; i++) {
        if (elapsed >= scenes[i].start) idx = i;
        else break;
      }
      setActive(idx);
      if (scrubFill) scrubFill.style.width = (elapsed / total * 100).toFixed(2) + '%';
      if (timeEl)    timeEl.textContent = formatTime(elapsed) + ' / ' + formatTime(total);
    }

    function play(){
      playing = true;
      root.classList.add('is-playing');
      playBtn.setAttribute('aria-label', 'Pause');
      if (audio) { try { audio.play(); } catch(_){} }
      lastTick = 0;
      raf = window.requestAnimationFrame(tick);
    }
    function pause(){
      playing = false;
      root.classList.remove('is-playing');
      playBtn.setAttribute('aria-label', 'Play');
      window.cancelAnimationFrame(raf);
      if (audio) { try { audio.pause(); } catch(_){} }
    }
    function seek(ms){
      elapsed = Math.max(0, Math.min(total, ms));
      if (audio) { try { audio.currentTime = elapsed / 1000; } catch(_){} }
      renderProgress();
    }

    playBtn.addEventListener('click', function(){
      if (playing) pause(); else play();
    });
    if (restart) restart.addEventListener('click', function(){
      seek(0);
      if (!playing) play();
    });
    scrubDots.forEach(function(dot, i){
      dot.addEventListener('click', function(){
        seek(scenes[i].start);
      });
      dot.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seek(scenes[i].start); }
      });
    });
    if (scrub) scrub.addEventListener('click', function(e){
      // Ignore clicks on the dot children (handled separately).
      if (e.target.classList && e.target.classList.contains('term-explainer__scrub-dot')) return;
      var rect = scrub.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seek(Math.floor(pct * total));
    });

    // Keyboard: arrow keys when the player has focus step scenes.
    root.addEventListener('keydown', function(e){
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); seek(scenes[Math.min(scenes.length - 1, activeIdx + 1)].start); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(scenes[Math.max(0, activeIdx - 1)].start); }
      else if (e.key === ' ') { e.preventDefault(); if (playing) pause(); else play(); }
    });

    // Render the static first frame on init so the explainer reads as
    // intentional (not blank) before the user presses play.
    renderProgress();

    // Auto-play once the explainer scrolls into view, but only if the
    // user has expressed motion preference. Respect prefers-reduced-
    // motion: stay paused until the user explicitly hits play.
    if (!prefersReduce && 'IntersectionObserver' in window) {
      var triggered = false;
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (!en.isIntersecting || triggered || playing) return;
          // Half visible — start.
          if (en.intersectionRatio >= 0.55) {
            triggered = true;
            play();
            io.disconnect();
            if (window.plausible) {
              window.plausible('Glossary Explainer Auto-play', { props: { term: root.getAttribute('data-term-slug') || '' } });
            }
          }
        });
      }, { threshold: [0.55] });
      io.observe(root);
    }

    function formatTime(ms){
      var s = Math.floor(ms / 1000);
      var m = Math.floor(s / 60);
      var ss = s - m * 60;
      return m + ':' + (ss < 10 ? '0' : '') + ss;
    }
  }
})();
