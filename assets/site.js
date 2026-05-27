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

  // The Window CTA (.js-window) is hard-coded to /window/ on each
  // anchor so CTAs work even with JavaScript disabled. No JS hook
  // needed beyond standard navigation.
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

  // Reveal on scroll. Only adopt elements that exist (most pages
  // have zero .reveal now — the no-op homepage instances were
  // trimmed in Phase 3C-perf; the class is reserved for the viz
  // containers (.funnel, .recovery-stack, gauge wrappers) where
  // the .in class drives a real CSS animation).
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Reduced-motion users skip the staged reveal entirely —
      // every .reveal goes straight to its .in (final) state.
      revealEls.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach((el) => io.observe(el));
    }
  }

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

  /* ============ READ ALOUD ============
   * Extracted to /assets/js/listen.js — only the ~38 long-form posts
   * that mount #listen-btn need the speech-synthesis machinery, and
   * the JS-module-split phase moved it out of the global bundle.
   * Page-level script tag is stamped by inject-article-listen.mjs.
   */


  /* ============ INTERACTIVE CHECKLIST ============
   * Extracted to /assets/js/checklist.js — only the 2 checklist pages
   * (EN + ES /learn/checklists/restaurant-website-checklist/) need
   * the persistent state + score + filter machinery, and the JS-
   * module-split phase moved it out of the global bundle.
   * Page-level script tag is stamped by inject-checklist-script.mjs.
   * (Phase M6 Learn-more popover lives in the same module.)
   */

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

    function shareLandingKind(p) {
      // Phase G.9: bound Share-event cardinality to the same closed
      // enum used by first-touch.js so dashboard groupings line up.
      if (/^\/(?:es\/)?blog\//.test(p))     return 'article';
      if (/^\/(?:es\/)?tools\//.test(p))    return 'tool';
      if (/^\/(?:es\/)?glossary\//.test(p)) return 'glossary';
      if (p === '/' || p === '/es/')        return 'home';
      return 'other';
    }
    function track(target){
      if (typeof window.plausible === 'function') {
        window.plausible('Share', { props: { target: target, surface: shareLandingKind(window.location.pathname) } });
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
            // Bug B3.2 (proactive audit) — Clipboard API requires a
            // secure context. Fail fast (don't even try) when the
            // API isn't available so the user sees the manual-select
            // hint immediately. The existing catch covers async
            // throws from .writeText() itself.
            if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
              el.textContent = 'Copy failed — select the URL manually';
              return;
            }
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
        'system':      { label: 'The System (how this site is built)', href: '/system/'          },
        'colophon':    { label: 'The System (how this site is built)', href: '/system/'          },
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
        'sistema':        { label: 'El Sistema (cómo está construido el sitio)', href: '/es/system/'        },
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

    // Brand-name "pin": a curated top result for queries that name the
    // site itself. Pagefind's BM25-style ranking over-promotes short
    // utility/legal pages whose <title> contains "Muntin Digital" — the
    // contact form (/window/), the workshop (/workbench/), and the
    // "Data & privacy" glossary entry — because term density on a
    // five-section page beats density on the multi-hub homepage. For
    // a brand search the right answer is unambiguous (the front door),
    // so we pin the homepage to the top when the query matches a known
    // brand alias. Every other query still flows through Pagefind
    // untouched, and the pinned page is also de-duplicated from the
    // Pagefind results below it so the user never sees the homepage
    // listed twice.
    //
    // Adding an alias: lowercase, no punctuation, collapse to single
    // spaces (see normalizeBrandQuery). Adding a locale: also point
    // .url at that locale's homepage so the pin lands in-language.
    const BRAND_QUERY_PINS = {
      en: {
        aliases: [
          'muntin',
          'muntindigital',
          'muntin digital',
          'muntin digital tm',
          'muntin digital trademark',
          'muntindigitalcom',
          'muntin digital com',
        ],
        pin: {
          url:     '/',
          title:   'Muntin Digital — A restaurant web library & studio',
          excerpt: 'The home page — free library, free tools, and the studio behind the work.',
          kind:    'Home',
        },
      },
      es: {
        aliases: [
          'muntin',
          'muntindigital',
          'muntin digital',
        ],
        pin: {
          url:     '/es/',
          title:   'Muntin Digital — Una biblioteca web y estudio para restaurantes',
          excerpt: 'La página principal — biblioteca y herramientas gratis, y el estudio detrás del trabajo.',
          kind:    'Inicio',
        },
      },
    };

    function normalizeBrandQuery(q) {
      return String(q || '')
        .toLowerCase()
        .replace(/[™®©.,!?·\-_/\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function brandPinFor(q) {
      const key = normalizeBrandQuery(q);
      if (!key) return null;
      const cfg = BRAND_QUERY_PINS[locale] || BRAND_QUERY_PINS.en;
      return cfg.aliases.indexOf(key) !== -1 ? cfg.pin : null;
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
      // Brand-pin promotion. If the query names the site itself
      // ("Muntin Digital", "muntin", etc.), prepend the curated
      // homepage card as the top result and drop any duplicate
      // homepage entry that may have come back from Pagefind. See
      // BRAND_QUERY_PINS above for why this is necessary.
      const pin = brandPinFor(q);
      if (pin) {
        const pinUrl = pin.url;
        const deduped = data.filter((d) => {
          const u = (d.url || '').replace(/^https?:\/\/[^/]+/, '');
          return u !== pinUrl;
        });
        data = [{
          url: pinUrl,
          excerpt: escapeHtml(pin.excerpt),
          meta: { title: pin.title },
          __pinnedKind: pin.kind,
        }].concat(deduped).slice(0, 8);
      }

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
        // Pinned results carry their own kind label (e.g. "Home" /
        // "Inicio") because the URL — "/" — doesn't match any of the
        // section prefixes classify() recognizes.
        const kind  = d.__pinnedKind || classify(d.url);
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

    // SearchAction handler. The WebSite JSON-LD on the homepage
    // advertises `https://muntin.digital/?q={search_term_string}` as
    // the sitelinks-searchbox entry point. When a visitor lands with
    // ?q=… in the URL (whether from Google's searchbox or a deep
    // link), pre-fill the modal and run the query, then strip the
    // param from the URL so refresh + bookmarks stay clean.
    (() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const q = (params.get('q') || '').trim();
        if (!q) return;
        // Defer to next tick so the modal mounts after the page is
        // interactive (pagefind is lazy and a brief delay smooths LCP).
        setTimeout(() => {
          open(null);
          if (input) {
            input.value = q.slice(0, 256);
            onInput();
          }
        }, 0);
        // Clean the URL without a reload (no entry in history).
        params.delete('q');
        const next = params.toString();
        const clean = window.location.pathname + (next ? '?' + next : '') + window.location.hash;
        window.history.replaceState(null, '', clean);
      } catch (_) { /* no-op */ }
    })();

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
    //
    // Two layout shapes are supported:
    //   1. Canonical research-note shape (older notes):
    //      .research-hero h1 / .research-source-line / .research-dek /
    //      .research-note p / .research-findings > li / .research-original
    //   2. Article-body shape (newer notes that read more like longreads):
    //      <article class="article-body"> with <h1>, lede <p>, and a
    //      first <ul> or <ol> we can present as findings.
    // A note matching neither shape returns null and the drawer
    // falls back to its error state (which still offers the full
    // note in a new tab).
    function extract(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Shape 1: canonical research-note.
      if (doc.querySelector('.research-hero')) {
        const title = (doc.querySelector('.research-hero h1') || {}).innerHTML || '';
        const sourceLine = (doc.querySelector('.research-source-line') || {}).innerHTML || '';
        const dek = (doc.querySelector('.research-dek') || {}).textContent || '';
        const noteP = doc.querySelector('.research-note p');
        const note = noteP ? noteP.innerHTML : '';
        const findings = Array.from(doc.querySelectorAll('.research-findings > li')).slice(0, 3).map((li) => li.innerHTML);
        const origAnchor = doc.querySelector('.research-original a[href^="http"]');
        const originalHref = origAnchor ? origAnchor.getAttribute('href') : '';
        return { title, sourceLine, dek, note, findings, originalHref };
      }

      // Shape 2: article-body longread. Pull title from <h1>, lede
      // from the first paragraph after it, findings from the first
      // <ul>/<ol> in the body. No source line (these are original
      // notes, not external citations) and no separate Don note.
      const article = doc.querySelector('article.article-body, article.container.article-body, main article');
      if (!article) return null;
      const titleEl = article.querySelector('h1');
      if (!titleEl) return null;
      const title = titleEl.innerHTML;
      // Lede: first <p> that isn't a meta line. Skip <p class="meta">,
      // .article-meta, .breadcrumb-style paragraphs.
      const ps = Array.from(article.querySelectorAll(':scope > p, :scope > header > p, :scope > div > p'));
      const ledeP = ps.find((p) => {
        const cls = (p.className || '').toLowerCase();
        if (cls.indexOf('meta') !== -1) return false;
        if (cls.indexOf('eyebrow') !== -1) return false;
        if (cls.indexOf('breadcrumb') !== -1) return false;
        const txt = (p.textContent || '').trim();
        return txt.length > 40;
      });
      const dek = ledeP ? (ledeP.textContent || '') : '';
      // Findings: first list of 3+ <li> in the article.
      let findings = [];
      const lists = article.querySelectorAll('ul, ol');
      for (const list of lists) {
        const items = list.querySelectorAll(':scope > li');
        if (items.length >= 3) {
          findings = Array.from(items).slice(0, 3).map((li) => li.innerHTML);
          break;
        }
      }
      return { title, sourceLine: '', dek, note: '', findings, originalHref: '' };
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

/* ============ Glossary inline popover + explainer player ============
 * Both IIFEs extracted to /assets/js/glossary.js — only pages with
 * a[data-glossary-blurb] (inline popover) or .term-explainer (narrated
 * diagrams) need the code. Stamped by inject-glossary-script.mjs.
 */
