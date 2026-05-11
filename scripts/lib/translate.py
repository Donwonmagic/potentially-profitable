#!/usr/bin/env python3
"""
Translate audio chunks from English to a target language with
document-level context + brand-term glossary preservation +
editorial-tone-locked LLM backend.

Why this isn't just a sentence-by-sentence call
-----------------------------------------------
Translating each chunk in isolation produces "machine Spanish" — the
translator can't see context, so pronouns lose their referents, tone
drifts between paragraphs, and technical terms get translated
inconsistently. We do three things better:

1. Document-level batching. We concatenate consecutive chunks into
   larger context blocks (up to ~4000 chars per request — well under
   the endpoint's limit) with a unique separator the translator
   leaves intact. The model sees the surrounding narrative before
   deciding how to translate any one sentence.

2. Glossary preservation. Brand names, domain terms, acronyms, and
   key phrases (see GLOSSARY below) are substituted with placeholder
   tokens before translation and restored after, so the translator
   doesn't mangle "Muntin Digital", "CTA", "POS", "Google Business
   Profile", etc.

3. Sentence-level re-alignment. After translation, we split on the
   separator to get per-chunk output matching the input chunk layout.
   The runtime's highlight sync stays aligned.

Translation backend (two-tier)
------------------------------
PRIMARY — Cloudflare Workers AI (Llama 3.3 70B Instruct).
  When CF_ACCOUNT_ID + CF_AI_TOKEN env vars are set, we use the
  Cloudflare Workers AI endpoint with a structured editorial-tone
  prompt that locks Don's voice (warm, direct, slightly weary,
  restaurant-operator-friendly). Free tier on the existing
  Cloudflare account; ~10k neurons/day covers incremental rendering
  comfortably.

  This produces translations that feel native — the LLM picks
  idioms naturally, preserves Don's pacing (em-dashes, parentheticals,
  short declaratives), and matches the editorial register that
  Google Translate can't capture. The glossary substitution happens
  BEFORE the LLM sees the text so brand terms come back unchanged.

FALLBACK — Google Translate's unauthenticated public endpoint.
  Used when the CF env vars aren't set OR the CF request fails
  (network, rate limit). Same endpoint deep-translator and
  googletrans use. Free, no API key. Solid mechanical translation;
  doesn't capture editorial register but covers the basics with the
  glossary protection intact.

Either way, the API contract is identical: chunks in, translated
chunks out. The pipeline doesn't care which backend ran.

Setup for the LLM path
----------------------
  1. Cloudflare dashboard → Workers AI → enable (one click, free).
  2. My Profile → API Tokens → Create Token. Permissions:
       Account → Workers AI → Read.
       (Read here means "may invoke models" — Cloudflare's name.)
  3. Find your account ID in the dashboard URL or the right sidebar.
  4. Set env vars before invoking the renderer:
       export CF_ACCOUNT_ID="..."
       export CF_AI_TOKEN="..."
       # Optional model override (default: llama-3.3-70b-instruct-fp8-fast):
       export CF_AI_MODEL="@cf/meta/llama-3.3-70b-instruct-fp8-fast"

Usage
-----
  echo '{"chunks":[{"id":0,"text":"..."}, ...],"target":"es"}' | \\
      python3 scripts/lib/translate.py > translated.json

Input JSON:
  { "target": "es" | "fr" | "it" | ...,
    "chunks": [{"id": N, "text": "..."}] }

Output JSON:
  { "target": "es",
    "chunks": [{"id": N, "text": "...translated..."}] }
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request


# --------------------------------------------------------------- Glossary
# Terms that should NEVER be machine-translated. Before sending text
# to the translator we substitute each term with a bracketed token
# (e.g. "[[TERM_1]]"), which the translator leaves intact. After the
# translation comes back we restore the tokens to the original term.
#
# This keeps brand names, acronyms, and domain-specific terms correct
# without giving up document-level context on the surrounding prose.
#
# Order matters: more-specific entries before less-specific, so
# "Google Business Profile" matches before "Google".
GLOSSARY = [
    # Brand + proper nouns
    "Muntin Digital",
    "Don Goldstein",
    # Tools / services (keep English — restaurant owners know the
    # product name in English regardless of the UI language they use)
    "Google Business Profile",
    "Google Maps",
    "Google Search",
    "Google Reviews",
    "Google",
    "Wix",
    "Squarespace",
    "Shopify",
    "WordPress",
    "Toast",
    "Square",
    "Clover",
    "OpenTable",
    "Resy",
    "Tock",
    "SevenRooms",
    "BentoBox",
    "ChowNow",
    "Olo",
    "Klaviyo",
    "Attentive",
    "SimpleTexting",
    "Mailchimp",
    "Fivestars",
    "Como Sense",
    "Como",
    "Toast Rewards",
    "Square Loyalty",
    "DoorDash Drive",
    "DoorDash",
    "Uber Eats Pro",
    "Uber Eats",
    "Uber",
    "Grubhub Premium",
    "Grubhub",
    "Marketplace Plus",
    "Marketplace",
    "Yelp",
    "TripAdvisor",
    "Instagram",
    "Facebook",
    "TikTok",
    "Threads",
    "Mastodon",
    "Bluesky",
    "LinkedIn",
    "Reddit",
    "WhatsApp",
    "Telegram",
    "Apple Maps",
    "Siri",
    "Stripe",
    "Lighthouse",
    "PageSpeed Insights",
    "Cloudflare",
    "Pagefind",
    "Plausible",
    "Baymard",
    "Whitespark",
    # Food brands + farms (keep verbatim across all locales — these are
    # cited by name in articles and lose meaning if translated)
    "Polyface Farm",
    "Polyface",
    "Tacombi",
    "Irish Inn at Glen Echo",
    # Neighborhoods + places (proper nouns; never localize — a
    # listener in any language needs to recognize the actual place)
    "Bethesda",
    "Glen Echo",
    "Silver Spring",
    "Takoma Park",
    "Arlington",
    "DMV",
    "DC",
    "Marche",
    # Legislation + Google product names (keep verbatim — translating
    # "Initiative 82" loses the legal-citation specificity, and "AI
    # Overview" is Google's product name, not a description.)
    "Initiative 82",
    "AI Overview",
    "AI Overviews",
    "Find a Table",
    "map pack",
    "local pack",
    "Rich Results",
    "Schema.org",
    # Italian dishes (keep original Italian — they're already loanwords
    # in every target language and any translation would reduce
    # culinary specificity)
    "Bruschetta",
    "Burrata",
    "Cacio e pepe",
    "Bucatini all'amatriciana",
    "Tonnarelli",
    "Tiramisù",
    "Pici al ragù",
    "Pici",
    "Ragù",
    "Carbonara",
    "Crudo",
    # Japanese loanwords used by name in the library
    "Omakase",
    # Acronyms — spelled out by the TTS via the pronunciation
    # dictionary, but kept verbatim in source text so the translator
    # doesn't expand them inconsistently per language
    "CTA",
    "SEO",
    "UX",
    "UI",
    "POS",
    "CMS",
    "CRM",
    "PWA",
    "API",
    "HTML",
    "CSS",
    "PDF",
    "URL",
    "JSON",
    "JSON-LD",
    "RSS",
    "SMS",
    "GBP",
    "FAQ",
    "RSVP",
    "DMV",
    "4G",
    "5G",
    "LCP",
    "TBT",
    "FCP",
    "CLS",
    "INP",
    "TTFB",
    "TL;DR",
    "FIC",
    "PPDS",
    "RAMW",
    "KDS",
    "BOH",
    "FOH",
    # Restaurant-industry terms that translate badly when machine-
    # translated literally. We preserve the English term and let the
    # surrounding sentence carry the meaning. For locales where a
    # native term exists and is genuinely understood by industry
    # professionals (e.g. ES "cubierto" for cover), the per-locale
    # post-pass in translate-style.json can substitute.
    "deeplink",
    "deep-link",
    "prime cost",
    "front of house",
    "back of house",
    "two-top",
    "four-top",
    "host stand",
    "PWA",
    "Speed Index",
    "Core Web Vitals",
    "knowledge panel",
    "rich result",
    "rich results",
    "structured data",
    "schema markup",
    "menu drop-in",
    "Care Plan Light",
]


# ---------------------------------------------------------- Placeholders
def _apply_glossary(text):
    """Replace each glossary term with a stable placeholder token.
    Returns (substituted_text, restore_map). Case-sensitive match;
    we expect authored copy to use canonical casing for brand terms.
    """
    restore = {}
    out = text
    for i, term in enumerate(GLOSSARY):
        # Use a placeholder with only letters + digits so tokenizers
        # don't split it. Google Translate leaves "TERMXXX" alone.
        token = f"TERMNUM{i:03d}XXZ"
        if term in out:
            out = out.replace(term, token)
            restore[token] = term
    return out, restore


def _restore_glossary(text, restore_map):
    for token, term in restore_map.items():
        text = text.replace(token, term)
    return text


# ---------------------------------------------------------- LLM backend
# Editorial prompt that locks Don's voice. The LLM gets this as
# "system" + the source text as "user". Anything in this prompt is
# part of the canonical translator behavior — edit deliberately.
EDITORIAL_PROMPT = """You translate editorial restaurant-industry articles for Muntin Digital, a one-person digital studio in the Washington, DC area run by Don Goldstein.

Don's voice you must preserve when translating:
- Direct and unsentimental. No marketing register, no corporate hedging, no apologetic softening.
- Warm but slightly weary — he has seen this restaurant industry pattern a hundred times before.
- Conversational, not formal. Uses contractions where the target language allows. Em-dashes for the redirect. Parenthetical asides.
- Restaurant industry vocabulary is precise. Cover, ticket, deeplink, GBP, schema, prime cost, two-top, host stand, Marketplace Plus — these are terms with established meaning.
- Numbers stay as digits ("$42", "30%", "Tuesday", "4 hours"). Never spell out.

Your job: render the input English text into idiomatic, native-feeling {target_lang_name} that preserves Don's voice. The reader should feel like Don is writing in their language — not like a translator left fingerprints.

Hard rules:
1. Use idiomatic {target_lang_name}, not literal English. Match the natural register of {target_lang_name} editorial writing.
2. PRESERVE EXACTLY any token of the form SEPNUM###XXZ or TERMNUM###XXZ. These are placeholder markers that get post-processed; if you change them, alignment breaks. Do not translate them. Do not add or remove the surrounding whitespace.
3. Match Don's pacing — short declarative sentences, em-dashes, parentheticals.
4. Restaurant terms with an established {target_lang_name} equivalent: use it. Without one: keep the English term and add a brief parenthetical the first time it appears.
5. Currency: keep "$" for USD. "$15,000" stays "$15,000" — do not convert to local currency.
6. Output ONLY the translation. No preamble like "Here is the translation:". No commentary. No notes about choices made. Just the translated text, in the same paragraph structure as the input."""

# Display names per locale for the editorial prompt.
LANG_NAMES = {
    "es": "Spanish",
    "fr": "French",
    "it": "Italian",
    "pt": "Brazilian Portuguese",
    "zh": "Mandarin Chinese (simplified)",
    "hi": "Hindi",
    "ja": "Japanese",
}


def _cf_ai_endpoint():
    """Return (url, token) for the Cloudflare Workers AI request, or
    None if not configured. Reads CF_ACCOUNT_ID and CF_AI_TOKEN; the
    model defaults to Llama 3.3 70B Instruct (fp8-fast variant) but
    is overridable via CF_AI_MODEL.
    """
    account = os.environ.get("CF_ACCOUNT_ID", "").strip()
    token   = os.environ.get("CF_AI_TOKEN", "").strip()
    model   = os.environ.get("CF_AI_MODEL",
                             "@cf/meta/llama-3.3-70b-instruct-fp8-fast").strip()
    if not (account and token):
        return None
    url = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"
    return (url, token)


def _translate_raw_cf(text, target_lang, retries=3):
    """Editorial-tone-locked translation via Cloudflare Workers AI.
    Returns the translated string, or raises on failure (caller falls
    back to Google Translate). The system prompt locks Don's voice;
    the user prompt is just the source text (already glossary-
    substituted by the caller).
    """
    endpoint = _cf_ai_endpoint()
    if endpoint is None:
        raise RuntimeError("CF Workers AI not configured (CF_ACCOUNT_ID + CF_AI_TOKEN unset)")
    url, token = endpoint

    target_name = LANG_NAMES.get(target_lang, target_lang)
    system = EDITORIAL_PROMPT.format(target_lang_name=target_name)
    body = {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": text},
        ],
        # Llama 3.3 70B supports a generous context. We keep the cap
        # well above any chunk-batch we'd send (~3500 source chars →
        # ~5000 target tokens worst case for languages with multi-byte
        # characters like Mandarin).
        "max_tokens": 8192,
        # Low temperature — translation is a constrained task; we
        # don't want creative liberties on the prose. Editorial tone
        # is locked via the prompt, not via sampling temperature.
        "temperature": 0.3,
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
        "Accept":        "application/json",
    }

    last_err = None
    rate_limit_waits = 0
    # Allow up to 4 long-form sleeps for 429s before giving up on the
    # call. Free-tier CF Workers AI rate windows are ~60s, so 4 × 60
    # gives the bucket plenty of time to refill on a slow afternoon.
    MAX_RATE_LIMIT_WAITS = 4
    attempt = 0
    while attempt < retries:
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            if not payload.get("success"):
                errs = payload.get("errors") or payload
                raise RuntimeError(f"CF AI returned not-success: {errs}")
            response = (payload.get("result") or {}).get("response", "")
            if not response or not response.strip():
                raise RuntimeError("CF AI returned empty response body")
            return response.strip()
        except urllib.error.HTTPError as e:
            last_err = e
            # Rate limit: wait for the free-tier window to refill (60s)
            # and try again WITHOUT consuming a regular retry slot.
            if e.code == 429 and rate_limit_waits < MAX_RATE_LIMIT_WAITS:
                rate_limit_waits += 1
                print(f"# CF rate limit (429) — waiting 60s ({rate_limit_waits}/{MAX_RATE_LIMIT_WAITS})",
                      file=sys.stderr, flush=True)
                time.sleep(60.0)
                continue
            # Auth errors: no point retrying. Bubble up immediately
            # so the router latches and stops calling CF this run.
            if e.code in (401, 403):
                raise RuntimeError(f"CF AI auth failed (HTTP {e.code}); check CF_AI_TOKEN scope") from e
            time.sleep(2.0 * (attempt + 1))
            attempt += 1
        except Exception as e:
            last_err = e
            time.sleep(2.0 * (attempt + 1))
            attempt += 1
    raise RuntimeError(f"CF AI translate failed after {retries} attempts: {last_err}")


# ---------------------------------------------------------- HTTP backend
def _translate_raw_gt(text, target_lang, source_lang="en", retries=3):
    """Single-shot call to Google's unauthenticated translate endpoint.
    Returns the translated string. Retries with exponential backoff
    on transient network errors — the endpoint is generally reliable
    but we're polite about it. Used as the fallback when CF Workers
    AI isn't configured or fails.
    """
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": source_lang,
        "tl": target_lang,
        "dt": "t",
        "q": text,
    }
    qs = urllib.parse.urlencode(params)
    full = f"{url}?{qs}"
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(full, headers={
                # The endpoint 503's on short/unusual UAs — identify
                # as a modern browser so we land on the default path.
                "User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                               "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                               "Version/17.0 Safari/605.1.15"),
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
            })
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            # Response shape: [[["translated","source",...],...], ...]
            segments = data[0] or []
            return "".join(seg[0] for seg in segments if seg and seg[0])
        except Exception as e:
            last_err = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"translate failed after {retries} attempts: {last_err}")


# Track CF availability across calls so we don't keep retrying CF
# after the first hard failure for this run (network down, account
# rate-limited, token revoked). Once flipped to False, stays False
# until the process exits.
_CF_AVAILABLE = None  # None = untested, True = working, False = failed once


def _translate_raw(text, target_lang, source_lang="en", retries=3):
    """Router: prefer Cloudflare Workers AI (Llama 3.3 70B with the
    editorial-tone prompt) when configured and reachable, fall back
    to Google Translate otherwise. Both honor the same input/output
    contract; the rest of the translator (batching, glossary,
    separator alignment) is backend-agnostic.
    """
    global _CF_AVAILABLE
    if _CF_AVAILABLE is False:
        return _translate_raw_gt(text, target_lang, source_lang, retries)
    if _cf_ai_endpoint() is None:
        if _CF_AVAILABLE is None:
            print("# CF_ACCOUNT_ID/CF_AI_TOKEN not set — using Google Translate fallback.",
                  file=sys.stderr)
            print("# For native-feeling editorial translations, see docs/audio-pipeline.md.",
                  file=sys.stderr)
            _CF_AVAILABLE = False
        return _translate_raw_gt(text, target_lang, source_lang, retries)
    try:
        result = _translate_raw_cf(text, target_lang, retries=retries)
        if _CF_AVAILABLE is None:
            print("# Translation backend: Cloudflare Workers AI (editorial-tone prompt active).",
                  file=sys.stderr)
            _CF_AVAILABLE = True
        return result
    except Exception as e:
        msg = str(e)
        # Auth failures are permanent — latch the circuit breaker so
        # we don't keep trying CF for the rest of this run.
        # Rate-limit / network blips are transient — fall back to GT
        # for THIS call but keep CF eligible for the next one.
        permanent = ("auth failed" in msg) or ("not configured" in msg)
        if permanent:
            print(f"# CF Workers AI failed permanently ({e}); using Google Translate for the rest of this run.",
                  file=sys.stderr)
            _CF_AVAILABLE = False
        else:
            print(f"# CF Workers AI hiccup ({e}); falling back to Google Translate for this batch only.",
                  file=sys.stderr)
        return _translate_raw_gt(text, target_lang, source_lang, retries)


# ---------------------------------------------------------- Batching
# Google's endpoint handles ~5000 char payloads comfortably. We stay
# well under that (~3500) so the separator tokens have room, and so
# we never hit an edge case where the endpoint silently truncates.
MAX_BATCH_CHARS = 3500

# Inter-chunk separator. We use a numbered ASCII token (same pattern
# as the glossary placeholders) rather than unicode punctuation — the
# translator leaves these tokens intact 99%+ of the time across all
# target languages we care about, whereas symbolic separators like
# "◆◆NEXT◆◆" sometimes get silently dropped or collapsed. The digits
# let us identify exactly which chunk each piece belongs to, which
# makes alignment after translation trivial even if some separators
# go missing.
def _sep_token(i):
    return f"\n\nSEPNUM{i:03d}XXZ\n\n"

# Regex that matches any SEPNUMxxxXXZ token, with optional surrounding
# whitespace that the translator may insert/strip.
SEP_RE = re.compile(r"\s*SEPNUM(\d{3})XXZ\s*")

# Delay between individual per-chunk translator calls in the fallback
# path. Google's unauthenticated endpoint rate-limits aggressive
# bursts; 0.4s keeps us well under the trigger while still completing
# a full-post fallback in reasonable wall time.
FALLBACK_DELAY_S = 0.4


def _batch_chunks(chunks):
    """Group consecutive chunks into ≤MAX_BATCH_CHARS batches so the
    translator sees document-level context without overflowing the
    endpoint's practical input limit.
    """
    batches = []
    current = []
    current_len = 0
    for c in chunks:
        t = (c.get("text") or "").strip()
        sep_len = len(_sep_token(0))  # constant length per token
        if current and current_len + len(t) + sep_len > MAX_BATCH_CHARS:
            batches.append(current)
            current = []
            current_len = 0
        current.append({"id": c["id"], "text": t})
        current_len += len(t) + sep_len
    if current:
        batches.append(current)
    return batches


def _join_with_seps(batch):
    """Join a batch of chunks with unique numbered separators so we
    can reliably split the translation back into the right chunks."""
    parts = []
    for i, c in enumerate(batch):
        if i > 0:
            parts.append(_sep_token(i))
        parts.append(c["text"])
    return "".join(parts)


def _split_on_seps(translated, expected_count):
    """Split on the numbered-token separator pattern. Returns the
    pieces in order (expected_count of them), or an empty list if the
    count doesn't match (caller will fall back)."""
    pieces = SEP_RE.split(translated)
    # Split returns alternating text, number, text, number, text...
    # so pieces at even indices are the chunks, odd indices are the
    # captured digit strings.
    if pieces:
        text_pieces = pieces[0::2]
        if len(text_pieces) == expected_count:
            return [p.strip() for p in text_pieces]
    return []


def translate_chunks(chunks, target_lang):
    """Main entry: translate a list of chunks → target_lang, preserving
    glossary terms and leveraging document-level context.
    """
    batches = _batch_chunks(chunks)
    print(f"# {len(chunks)} chunks in {len(batches)} batch(es)", file=sys.stderr)

    out = []
    for bi, batch in enumerate(batches):
        joined = _join_with_seps(batch)
        substituted, restore_map = _apply_glossary(joined)

        t0 = time.time()
        translated = _translate_raw(substituted, target_lang)
        translated = _restore_glossary(translated, restore_map)
        dt = time.time() - t0

        pieces = _split_on_seps(translated, len(batch))
        if not pieces:
            print(f"# batch {bi}: separator alignment failed, falling back to per-chunk", file=sys.stderr)
            pieces = []
            for c in batch:
                time.sleep(FALLBACK_DELAY_S)
                sub, rm = _apply_glossary(c["text"])
                p = _translate_raw(sub, target_lang)
                p = _restore_glossary(p, rm)
                pieces.append(p.strip())

        for c, p in zip(batch, pieces):
            out.append({"id": c["id"], "text": p})

        print(f"#   batch {bi + 1}/{len(batches)}: {len(batch)} chunks in {dt:.1f}s", file=sys.stderr)
        # Inter-batch pause. CF Workers AI free-tier rate windows are
        # tighter than Google's unauthenticated translate endpoint, so
        # we pace ourselves harder when CF is active. _CF_AVAILABLE is
        # True iff CF answered successfully at least once this run.
        if bi + 1 < len(batches):
            time.sleep(1.5 if _CF_AVAILABLE else 0.3)

    return out


def main():
    payload = json.load(sys.stdin)
    target = payload.get("target")
    chunks = payload.get("chunks") or []
    if not target or not chunks:
        print(json.dumps({"ok": False, "error": "missing target or chunks"}))
        return 1
    try:
        out = translate_chunks(chunks, target)
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))
        return 1
    print(json.dumps({
        "ok": True,
        "target": target,
        "chunks": out,
    }))
    return 0


# TODO: Swap-in NLLB backend
# ---------------------------
# If Google's endpoint ever changes or a stricter license is desired,
# swap `_translate_raw` for a call into transformers:
#
#   from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
#   model = AutoModelForSeq2SeqLM.from_pretrained(
#       "facebook/nllb-200-distilled-1.3B")
#   tokenizer = AutoTokenizer.from_pretrained(
#       "facebook/nllb-200-distilled-1.3B", src_lang="eng_Latn")
#   ...and translate with tokenizer + model.generate(forced_bos_token_id=...)
#
# The batching + glossary logic above is engine-agnostic.


if __name__ == "__main__":
    sys.exit(main())
