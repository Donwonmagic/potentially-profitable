// Listen player — extracted from assets/site.js as part of the JS module
// split (Phase 3 of the launch plan).
//
// Loaded only on pages that mount #listen-btn (long-form articles + the
// 38-or-so blog/glossary posts that render an audio edition). Saves the
// ~22 KB speech-synthesis machinery from the 470+ pages that don't.
//
// External dependencies:
//   - speechSynthesis (Web Speech API) — feature-detected
//   - HTMLAudioElement — for prerendered MP3 playback
//   - window.plausible — analytics events (optional; checked at use)
//   - i18n() helper — duplicated below so this file loads independently
//
// Exposes window.MuntinReadAloud = { stop, toggle } for cross-script
// coordination (e.g. the smart-next CTA stops playback on navigation).

(function () {
  'use strict';

  // Duplicated from site.js so this module loads independently. Same
  // contract: dotted key + English literal as fallback. window.__i18n
  // is the override dict populated on non-default-locale pages.
  const i18n = (key, en) => {
    const d = (typeof window !== 'undefined' && window.__i18n) || null;
    return (d && typeof d[key] === 'string') ? d[key] : en;
  };

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
    // selection. (We still swap the source-of-truth note to "Voiced
    // for The Muntin Desk" once the manifest actually loads.)
    if (audioSrc && voiceSelect) {
      const voiceLabel = voiceSelect.closest('.listen-select');
      if (voiceLabel) voiceLabel.hidden = true;
      const srcNote = card.root.querySelector('.listen-source-note');
      if (srcNote) {
        srcNote.setAttribute('data-source', 'studio');
        srcNote.textContent = 'Voiced for The Muntin Desk';
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
      // Phase 4: re-segment sentences under the new locale on the next
      // chunk activation. The language-swap reapply-translations path
      // (below) replaces the wrapped spans by rewriting prose, so the
      // next mountSentenceSpans pass starts fresh.
      resetSentenceSegmenter();
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
      // Drop any stale sentence highlight from the previous chunk.
      if (currentSentSpan) {
        currentSentSpan.classList.remove('is-sent-reading');
        currentSentSpan = null;
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
        // Phase 4: wrap sentences on first activation of a body chunk.
        // No-op for figure/list/quote/heading chunks.
        mountSentenceSpans(el, chunk);
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

    /* ---- Sentence-level reading sync (Phase 4) -----------------------
       Lazily wraps the text of an active body chunk in <span.listen-sent>
       elements with proportional [data-sent-start, data-sent-end] time
       windows derived from the chunk's own [start, end). Only body
       chunks — figure/quote/list/heading chunks have non-linear text
       (multiple sentences in a caption, fragmentary list items) where
       proportional splitting would drift visibly.
       Wraps once per element, cached in sentencedEls. The mutation only
       runs the first time a chunk becomes active during this session,
       so it costs at most N writes per article — not per tick.
       Selector resolution at lines ~1141-1174 uses el.textContent which
       is transparent to child spans, so the chunk-to-element map stays
       valid after wrapping.
       Per-sentence duration is capped at 4.5s so a runaway estimate
       (a 200-char sentence in a chunk with only 1s of audio left)
       doesn't park the highlight on a single sentence visibly. */
    let sentenceSegmenter = null;
    let segmenterLang = null;
    function getSentenceSegmenter() {
      if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return null;
      const lang = currentLanguage || 'en';
      if (sentenceSegmenter && segmenterLang === lang) return sentenceSegmenter;
      try {
        sentenceSegmenter = new Intl.Segmenter(lang, { granularity: 'sentence' });
        segmenterLang = lang;
        return sentenceSegmenter;
      } catch (_) {
        return null;
      }
    }
    // Re-segment under the active locale on next chunk activation.
    function resetSentenceSegmenter() {
      sentenceSegmenter = null;
      segmenterLang = null;
    }
    // We probe the DOM itself rather than maintain a WeakSet: the
    // language-swap path destroys the wrapped spans by replacing prose
    // wholesale, and a Set would carry stale truth across that swap.
    function isAlreadySentenced(el) {
      const first = el.firstElementChild;
      return !!(first && first.classList && first.classList.contains('listen-sent'));
    }
    function mountSentenceSpans(el, chunk) {
      if (!el || !chunk) return;
      if (chunk.kind !== 'body') return;
      if (isAlreadySentenced(el)) return;
      // Skip elements with mixed children (links, code, em, strong).
      // Wrapping those would lose the inline formatting.
      for (const child of el.childNodes) {
        if (child.nodeType !== Node.TEXT_NODE) return;
      }
      const seg = getSentenceSegmenter();
      if (!seg) return;
      const text = el.textContent || '';
      const segs = Array.from(seg.segment(text));
      if (segs.length < 2) return;  // single sentence — no benefit to wrap
      const totalChars = text.length;
      const start = chunk.start || 0;
      const end = chunk.end || 0;
      const dur = end - start;
      if (totalChars <= 0 || dur <= 0) return;
      // Proportional sentEnd computed from CUMULATIVE character offset
      // so the windows naturally sum to chunk.end. The earlier per-
      // sentence Math.min(...,4.5) cap caused downstream drift in
      // studio mode (any capped sentence shifted later windows early
      // and made the last sentence absorb the slack — its highlight
      // activated too soon). For studio audio chunk.end already
      // matches real audio; no cap needed.
      const frag = document.createDocumentFragment();
      let charsSoFar = 0;
      let prevEnd = start;
      for (let i = 0; i < segs.length; i++) {
        const piece = segs[i].segment;
        charsSoFar += piece.length;
        // Cumulative proportional end — the last sentence lands exactly on chunk.end
        // by construction since charsSoFar === totalChars on the final iteration.
        const sentEnd = i === segs.length - 1 ? end : (start + dur * (charsSoFar / totalChars));
        // Intl.Segmenter includes trailing whitespace in each piece.
        // Painting `.is-sent-reading` background + the bottom border
        // under that trailing space leaves a small highlight tail
        // before the next sentence. Strip the trailing whitespace
        // from the span and emit it as a sibling text node so the
        // paragraph still reads correctly and selection still works.
        const trailing = piece.match(/\s+$/);
        const core = trailing ? piece.slice(0, -trailing[0].length) : piece;
        const span = document.createElement('span');
        span.className = 'listen-sent';
        span.dataset.sentStart = prevEnd.toFixed(3);
        span.dataset.sentEnd = sentEnd.toFixed(3);
        span.textContent = core;
        frag.appendChild(span);
        if (trailing) frag.appendChild(document.createTextNode(trailing[0]));
        prevEnd = sentEnd;
      }
      el.textContent = '';
      el.appendChild(frag);
    }
    let currentSentSpan = null;
    function tickSentence(t) {
      // Cheap exit: the current chunk isn't a body chunk (or hasn't been
      // wrapped). Drop any stale highlight from a previous chunk.
      if (!currentElement || !isAlreadySentenced(currentElement)) {
        if (currentSentSpan) {
          currentSentSpan.classList.remove('is-sent-reading');
          currentSentSpan = null;
        }
        return;
      }
      // Linear scan — typical chunk has 1-6 sentences. A binary search
      // would be overkill and obscure the intent.
      const spans = currentElement.querySelectorAll('.listen-sent');
      let next = null;
      for (const s of spans) {
        const start = parseFloat(s.dataset.sentStart);
        const end = parseFloat(s.dataset.sentEnd);
        if (t >= start && t < end) { next = s; break; }
      }
      if (next === currentSentSpan) return;
      if (currentSentSpan) currentSentSpan.classList.remove('is-sent-reading');
      if (next) next.classList.add('is-sent-reading');
      currentSentSpan = next;
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
      //
      // Selector caveat: render-post-audio.mjs's extractor builds
      // selectors like `#post-body > p:nth-of-type(N)` by counting
      // ALL <p> matches in the body, including ones nested inside
      // <aside>/<figure>. CSS :nth-of-type only counts DIRECT
      // children, so the two counts diverge as soon as a TL;DR aside
      // or figure with nested paragraphs lands above. The selector
      // resolves to the WRONG element and the highlight tracks
      // somewhere other than the audio. Pre-built audio.json files
      // can't be re-extracted without a re-render, so we add a
      // text-matching fallback: walk every speakable element in the
      // current DOM, map them by their first 60 normalized chars,
      // and prefer the text-match over the broken selector when
      // both resolve.
      const normalizeForMatch = (s) => (s || '')
        .replace(/[‘’“”]/g, "'")     // smart quotes → straight
        .replace(/&[a-z]+;/gi, ' ')                       // strip leftover entities
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .slice(0, 60);
      const speakableSel = 'h2, h3, p, li, blockquote, figcaption, [data-audio-alt]';
      const speakableEls = Array.from(postBody.querySelectorAll(speakableSel))
        .filter((el) => !el.closest('.inline-cta, .further-reading, .sources, .knit-rail, .wave-toc, .smart-next, .post-end-cta, .post-end-mark'))
        // Inside <figure>, only consider the figure itself (so the
        // figcaption / data-audio-alt match resolves to the whole figure).
        .map((el) => el.matches('figcaption, [role="img"], [data-audio-alt]')
          ? (el.closest('figure') || el)
          : el);
      const elsByText = new Map();
      for (const el of speakableEls) {
        const key = normalizeForMatch(el.textContent);
        if (key && !elsByText.has(key)) elsByText.set(key, el);
      }
      const resolveChunkElement = (c) => {
        // Prefer text match: it survives DOM restructure (TL;DR
        // injection, knit-rail moves, etc.) AND fixes the nested-p
        // nth-of-type miscount described above.
        const key = normalizeForMatch(c.text);
        if (key) {
          const hit = elsByText.get(key);
          if (hit) return hit;
        }
        // Fall back to selector — for legacy chunks whose text was
        // normalized differently or that don't survive entity decode.
        if (c.selector) return postBody.querySelector(c.selector);
        return null;
      };
      if (Array.isArray(manifest.chunks)) {
        chunks = manifest.chunks.map((c) => ({
          text: c.text || '',
          element: resolveChunkElement(c),
          kind: c.kind || 'body',
          start: c.start || 0,
          end:   c.end   || 0,
        }));
      }
      // Point the source-of-truth note at the branded reader. Reads as
      // a publication byline ("Voiced for The Muntin Desk"), not as a
      // technical disclosure — the curiosity-driven listener can dig
      // into how-we-make-these from the settings dialog.
      const note = card.root.querySelector('.listen-source-note');
      if (note) {
        note.setAttribute('data-source', 'studio');
        note.textContent = 'Voiced for The Muntin Desk';
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
      // Phase 5 — share-with-timestamp deep link. `?t=4m12s` (or
      // `4:12` or `252s` or bare `252`) seeks the audio to that
      // position on first play. Consumed once per page load so a
      // pause/resume doesn't keep snapping back. Wins over the
      // preview cap (deep link is explicit user intent, preview is
      // tentative); we clear previewLimit to honor that precedence.
      if (!deepLinkConsumed) {
        deepLinkConsumed = true;
        const t = parseTimestampParam();
        if (t !== null && t > 0) {
          previewLimit = null;
          try { audioEl.currentTime = t; } catch (_) {}
          if (window.plausible) {
            try { window.plausible('Audio: Deep Link'); } catch (_) {}
          }
        }
      }
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
      // Phase 5: preview cap. If a 30s preview is in flight and the
      // playhead reached the limit, pause the audio and clear the cap.
      // Doesn't touch state until after the pause completes so the
      // existing finishStudioPlayback path stays in charge of UI state.
      if (previewLimit !== null && t >= previewLimit) {
        previewLimit = null;
        try { audioEl.pause(); } catch (_) {}
        setState('paused');
        return;
      }
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
      // Phase 4: sentence highlight piggybacks the same tick. Single
      // event loop, no new rAF or audio event listener — the audit
      // explicitly mandated a single-tick architecture.
      tickSentence(t);
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
    // Phase 5 affordance: 30-second preview. Sample the voice without
    // committing to the full 11-minute reading. Clicking the main play
    // button at any point clears the preview cap and lets playback run
    // to completion — the preview button is the low-commitment door,
    // the play button is the commitment.
    let previewLimit = null;  // audio time (seconds) at which to auto-pause; null = no cap
    // Phase 5 — `?t=4m12s` deep-link consumption flag. Honored once on
    // the first studio play; pause/resume after that does not re-seek.
    let deepLinkConsumed = false;
    function parseTimestampParam() {
      try {
        if (typeof window === 'undefined' || !window.location) return null;
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('t');
        if (!raw) return null;
        // Accept "1h2m3s", "4m12s", "252s", "252" (seconds), "4:12" (mm:ss).
        const colon = raw.match(/^(\d+):(\d+)$/);
        if (colon) return parseInt(colon[1], 10) * 60 + parseInt(colon[2], 10);
        const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s?)?$/i);
        if (!m || (!m[1] && !m[2] && !m[3])) return null;
        return (parseInt(m[1] || '0', 10) * 3600)
             + (parseInt(m[2] || '0', 10) * 60)
             + parseFloat(m[3] || '0');
      } catch (_) {
        return null;
      }
    }
    function toggle() {
      if      (state === 'idle')    { previewLimit = null; startPlayback(); }
      else if (state === 'playing') pausePlayback();
      else if (state === 'paused')  { previewLimit = null; startPlayback(); }
    }
    function startPreview() {
      previewLimit = 30;
      if (audioEl) {
        try { audioEl.currentTime = 0; } catch (_) {}
      }
      if (state === 'playing') pausePlayback();
      startPlayback();
      if (window.plausible) {
        try { window.plausible('Audio: Preview'); } catch (_) {}
      }
    }
    playBtn.addEventListener('click', toggle);
    listenBtn.addEventListener('click', toggle);

    // Phase 5 — share with timestamp. Mirror of the ?t= deep link
    // parser: takes the current playhead, formats it the same way the
    // parser accepts, copies the URL to clipboard, and surfaces a
    // toast. The share button lives in the extras row (post-play
    // visible) because before play `currentTime` is meaningless.
    function formatTimestampParam(seconds) {
      const t = Math.max(0, Math.floor(seconds || 0));
      if (t < 60) return `${t}s`;
      const m = Math.floor(t / 60);
      const s = t % 60;
      return s === 0 ? `${m}m` : `${m}m${s}s`;
    }
    function showShareToast(msg) {
      let container = document.querySelector('.mtn-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'mtn-toast-container';
        document.body.appendChild(container);
      }
      const node = document.createElement('div');
      node.className = 'mtn-toast mtn-toast--success';
      node.setAttribute('role', 'status');
      node.textContent = msg;
      container.appendChild(node);
      requestAnimationFrame(() => node.classList.add('mtn-toast--visible'));
      setTimeout(() => {
        node.classList.remove('mtn-toast--visible');
        setTimeout(() => node.remove(), 240);
      }, 2400);
    }
    async function shareAtCurrentTime() {
      const t = audioEl ? audioEl.currentTime : 0;
      const tParam = formatTimestampParam(t);
      const url = `${location.origin}${location.pathname}?t=${tParam}`;
      let copied = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          copied = true;
        }
      } catch (_) {}
      // Display the moment as mm:ss to match what audio players show,
      // not the URL-param syntax — operators see "Link copied at 4:12",
      // not "Link copied at 4m12s".
      const mm = Math.floor(t / 60);
      const ss = Math.floor(t % 60).toString().padStart(2, '0');
      showShareToast(copied ? `Link copied at ${mm}:${ss}` : 'Copy failed — clipboard blocked');
      if (window.plausible) {
        try { window.plausible('Audio: Shared with Timestamp'); } catch (_) {}
      }
    }
    const shareBtn = card.root.querySelector('.listen-share');
    if (shareBtn) shareBtn.addEventListener('click', shareAtCurrentTime);

    const previewBtn = card.root.querySelector('.listen-preview');
    // Speech-fallback mode has no scrubable timeline; hide the preview
    // affordance there so the button doesn't suggest a feature we
    // can't deliver cleanly.
    if (previewBtn) {
      if (!audioSrc) {
        previewBtn.hidden = true;
      } else {
        previewBtn.addEventListener('click', startPreview);
      }
    }

    // Phase 5 — keyboard shortcuts. Only active once the user has
    // engaged the player at least once (state !== 'idle'); otherwise
    // Space would hijack page scroll for every visitor whether or not
    // they care about audio. Form inputs and contenteditable surfaces
    // are skipped so the user's typing flow is never interrupted.
    function isTypingTarget(t) {
      if (!t) return false;
      if (t.matches && t.matches('input, textarea, select, [contenteditable], [contenteditable=""], [contenteditable="true"]')) return true;
      if (t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return true;
      return false;
    }
    document.addEventListener('keydown', (e) => {
      if (state === 'idle') return;
      if (isTypingTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          toggle();
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          seekBy(-15);
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          seekBy(+15);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTo(currentIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTo(currentIndex + 1);
          break;
        default:
          return;
      }
      if (window.plausible) {
        try { window.plausible('Audio: Keyboard Shortcut'); } catch (_) {}
      }
    });

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
          <button type="button" class="listen-preview" aria-label="Play a 30-second preview">Hear a 30-second preview →</button>
        </div>
        <div class="listen-card-meta">
          <strong>${minutes} min</strong><span>hands-free</span>
          <label class="listen-select listen-language-select" title="Language" style="margin-top:2px" hidden><span class="sr-only">Language</span>
            <select class="listen-language" aria-label="Language"></select>
          </label>
        </div>
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
            <button type="button" class="listen-iconbtn listen-share" aria-label="Copy share link at current moment">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71"/></svg>
            </button>
          </div>
          <span class="listen-source-note" data-source="browser">Read by your browser</span>
        </div>
      `;

      return { root };
    }
  })();
})();
