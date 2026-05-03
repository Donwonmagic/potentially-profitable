// Glossary inline popover + Glossary explainer player — extracted
// from assets/site.js as part of the JS module split (PR-C).
//
// Loaded only on pages that mount glossary affordances:
//   - a[data-glossary-blurb]  → inline popover on autolinked terms
//                                (~27 article pages today)
//   - .term-explainer         → 90-second narrated diagrams
//                                (anticipatory; 0 pages mount this
//                                 today but the 5 flagship glossary
//                                 pages will when they land)
//
// Both IIFEs are top-level and self-contained (no i18n() dependency,
// no other site.js helpers). The explainer player early-returns on
// missing markup, so it costs nothing on pages that have the popover
// but not the explainer (the common case for the 27 article pages).

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
    // The full glossary entry opens in a new tab so the reader doesn't
    // lose their place in the article. The popover already shows the
    // first-sentence definition inline; the new tab is a deeper read,
    // not a navigation away.
    more.setAttribute('target', '_blank');
    more.setAttribute('rel', 'noopener');
    // Localised "read the full definition" label. Read once from the
    // page's <html lang> attribute — no message bundle needed for one
    // string used by one component.
    var lang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2);
    more.textContent = (lang === 'es' ? 'Leer la definición completa ↗' : 'Read the full definition ↗');

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

    // Touch / coarse-pointer devices have no hover. Without this
    // handler, tapping the term opens the full glossary entry in a
    // new tab (because the inline link carries target="_blank") and
    // the reader never sees the inline definition. With this handler,
    // the first tap shows the popover with the first-sentence
    // definition; the popover's "Read full" CTA inside is the
    // explicit path to the full term in a new tab. Tapping the same
    // link again, or tapping anywhere outside the popover, dismisses.
    link.addEventListener('click', (function(L){ return function(e){
      if (!window.matchMedia || !window.matchMedia('(hover: none)').matches) return;
      if (activeLink === L) { hide(); return; }
      e.preventDefault();
      window.clearTimeout(hideTimer);
      show(L);
    }; })(link));
  }

  // Tap-outside on touch devices closes the popover. Pointer events
  // unify mouse + touch so this also serves as desktop click-outside.
  document.addEventListener('click', function(e){
    if (!activeLink) return;
    if (!window.matchMedia || !window.matchMedia('(hover: none)').matches) return;
    var target = e.target;
    if (popover && popover.contains(target)) return;
    if (target === activeLink || (activeLink && activeLink.contains(target))) return;
    hide();
  });

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

  // ----------------------------------------------------------------
  // W3-6 — global clear-on-leave hook for invoice-decoder secrets.
  //
  // The Invoice Decoder caches two pieces of in-memory state across
  // saves on a single tab: the derived AES-GCM key (encrypt.js
  // __keyCache) and the passphrase memory (passphrase-modal.js
  // __ppMemory). Both are good UX — saving 4 invoices in a session
  // shouldn't require typing the secret 4 times. But we want them
  // gone on tab close, on extended tab-hide, and when the operator
  // signs out.
  //
  // The two modules each register their own beforeunload listener,
  // but those only fire on tab close. This adds:
  //   1. pagehide → same as beforeunload but Safari-friendly.
  //   2. visibilitychange (>5 min hidden) → defensive zero-out so a
  //      shared device doesn't leave keys in memory across a long
  //      gap.
  //   3. delegated click on any a[href*="sign-out"] or
  //      a[data-act="signout"] → wipes immediately, before the
  //      navigation lands.
  //
  // No-ops cleanly when the modules aren't loaded on the page.
  // ----------------------------------------------------------------
  (function () {
    function wipeSecrets() {
      try { if (window.MID_ENCRYPT && MID_ENCRYPT.clearKeyCache) MID_ENCRYPT.clearKeyCache(); } catch (_) {}
      try { if (window.MID_PASS    && MID_PASS.forget)           MID_PASS.forget();           } catch (_) {}
    }
    window.addEventListener('pagehide', wipeSecrets);
    var hiddenSince = 0;
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        hiddenSince = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenSince) {
        // 5-minute threshold — long enough that brief background-tab
        // moments don't force a re-prompt; short enough that a
        // walked-away device gets re-secured.
        if (Date.now() - hiddenSince > 5 * 60 * 1000) wipeSecrets();
        hiddenSince = 0;
      }
    });
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a');
      if (!a || !a.getAttribute) return;
      var href = (a.getAttribute('href') || '').toLowerCase();
      var act  = (a.getAttribute('data-act') || '').toLowerCase();
      if (href.indexOf('sign-out') !== -1 || href.indexOf('signout') !== -1 ||
          href.indexOf('logout')   !== -1 || act === 'signout') {
        wipeSecrets();
      }
    }, true);
  })();
})();
