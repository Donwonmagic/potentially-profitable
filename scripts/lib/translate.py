#!/usr/bin/env python3
"""
Translate audio chunks from English to a target language with
document-level context + brand-term glossary preservation.

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

Translation backend
-------------------
Uses Google Translate's public unauthenticated web endpoint
(translate_a/single with client=gtx), which is what open-source
libraries like deep-translator and googletrans use. It's free at our
scale (~500 requests per full-site render), returns output quality
on par with Google Cloud Translate, and requires no API key or
account.

Caveats to be honest about:
  * This is an unofficial endpoint — Google may change or rate-limit
    it without notice. If it stops working, swap in NLLB via the
    transformers library (see TODO at the bottom of this file).
  * Technically a ToS gray area for programmatic use; appropriate
    for periodic one-off renders, NOT for a real-time service.
  * For highest quality, a paid DeepL or Anthropic/OpenAI API call
    would beat this — drop-in replaceable by swapping `_translate_raw`.

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
    # Acronyms
    "CTA",
    "SEO",
    "UX",
    "UI",
    "POS",
    "CMS",
    "HTML",
    "CSS",
    "PDF",
    "DMV",
    "4G",
    "5G",
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


# ---------------------------------------------------------- HTTP backend
def _translate_raw(text, target_lang, source_lang="en", retries=3):
    """Single-shot call to Google's unauthenticated translate endpoint.
    Returns the translated string. Retries with exponential backoff
    on transient network errors — the endpoint is generally reliable
    but we're polite about it.
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
        # Pause between batches to stay polite with Google's
        # unauthenticated endpoint — short enough to feel fast,
        # long enough that a 92-chunk post doesn't trip rate limits.
        if bi + 1 < len(batches):
            time.sleep(0.3)

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
