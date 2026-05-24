#!/usr/bin/env python3
"""One-time SEO enrichment for every blog post (drafts + published).

Adds three structured-data + performance signals that were missing
on the full set:

  1. JSON-LD `keywords` inside the BlogPosting node for every post
     that doesn't already have one (hand-curated, long-tail phrases
     actual restaurant operators search for).
  2. JSON-LD `speakable` SpeakableSpecification on every post's
     BlogPosting — tells Google Assistant / Alexa that article#post-
     body is the readable prose. Pair it with the existing MP3 and
     voice assistants pick the post up cleanly.
  3. `<link rel="preload" as="audio" type="audio/mpeg"
     href="audio.mp3">` in <head> so the Listen button's payload
     starts fetching while the reader is still above the fold.

Re-running is safe — the script detects existing markers and skips.

Keywords per post are curated below. Intentionally long-tail, in the
register a restaurant operator actually types into Google at 11pm
on a Tuesday. Four to six per post, specific > generic.

Usage
-----
  python3 scripts/enrich-post-seo.py [--check]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CHECK_ONLY = "--check" in sys.argv

# Long-tail keyword sets by slug. Operator-register phrases the
# BlogPosting should list explicitly alongside the existing `about[]`
# nouns — Google uses `keywords` for ranking, `about` for entity
# disambiguation, so both earn their keep.
KEYWORDS = {
    # Drafts
    "can-chatgpt-write-your-restaurant-website": [
        "can chatgpt write restaurant website",
        "ai restaurant copywriting",
        "chatgpt restaurant about page",
        "ai website content restaurant",
        "chatgpt menu descriptions",
        "restaurant website ai briefing",
    ],
    "five-restaurant-website-changes-recover-one-percent-margin": [
        "restaurant website conversion optimization",
        "recover restaurant profit margin",
        "restaurant website changes 2026",
        "restaurant website checklist operator",
        "small website changes big impact restaurant",
    ],
    "how-to-raise-restaurant-menu-prices-without-losing-reservations": [
        "how to raise restaurant menu prices",
        "restaurant menu price increase 2026",
        "raise prices without losing customers restaurant",
        "restaurant price anchoring",
        "restaurant menu engineering inflation",
    ],
    "how-to-recover-reservations-from-googles-find-a-table": [
        "google find a table restaurant",
        "restaurant bypass opentable google",
        "direct restaurant reservations google",
        "google business profile reservations link",
        "restaurant booking google maps",
    ],
    "is-doordash-worth-it-for-restaurants-in-2026": [
        "is doordash worth it for restaurants",
        "doordash vs direct delivery restaurant",
        "doordash commission restaurant 2026",
        "restaurant third party delivery economics",
        "doordash alternatives for restaurants",
    ],
    "should-your-restaurant-have-an-app-in-2026": [
        "should restaurant have an app",
        "restaurant app vs website 2026",
        "restaurant loyalty app alternatives",
        "pwa for restaurants",
        "small restaurant app worth it",
    ],
    # Published — the one missing a keywords block, plus enrichment
    # everywhere that could sharpen existing ranking targets.
    "why-your-restaurant-loses-reservations-every-night": [
        "restaurant losing reservations",
        "restaurant website mobile leaks",
        "restaurant booking conversion",
        "why restaurants lose bookings",
        "restaurant website optimization checklist",
    ],
    # ---- Wave-1 (2026-05-11) ----
    "may-2026-wave-publishing-for-citation": [
        "restaurant ai search citation",
        "restaurant google ai overview ranking",
        "ai overview citation rules",
        "restaurant seo 2026 batch",
        "operator playbook ai search restaurant",
    ],
    "how-to-get-cited-in-google-ai-overviews-restaurant": [
        "google ai overview restaurant citation",
        "how to get cited ai overview",
        "ai overview citation paragraph structure",
        "restaurant content for ai search",
        "google sge citation restaurant",
    ],
    "instagram-as-restaurant-seo-strategy-2026": [
        "instagram restaurant seo 2026",
        "instagram caption seo restaurant",
        "restaurant instagram search optimization",
        "google indexes instagram captions",
        "restaurant social seo instagram",
    ],
    "uber-eats-vs-doordash-vs-grubhub-restaurant-math-2026": [
        "uber eats vs doordash vs grubhub commission",
        "restaurant third party delivery math 2026",
        "doordash commission breakdown restaurant",
        "best delivery platform for restaurants",
        "restaurant delivery margin comparison",
    ],
    "30-days-after-leaving-doordash-restaurant-case-study": [
        "leaving doordash restaurant case study",
        "30 days after leaving doordash",
        "delisting from doordash results",
        "restaurant direct ordering after doordash",
        "doordash exit case study",
    ],
    "loyalty-programs-for-independent-restaurants-what-works-2026": [
        "loyalty programs for independent restaurants",
        "restaurant loyalty 2026 what works",
        "restaurant punch card vs app loyalty",
        "small restaurant loyalty program roi",
        "restaurant customer retention program",
    ],
    "how-to-respond-to-google-reviews-restaurant-playbook-2026": [
        "how to respond to google reviews restaurant",
        "restaurant review response playbook",
        "respond to 3 star reviews restaurant",
        "negative review response restaurant",
        "google review reply best practice 2026",
    ],
    "service-charges-vs-tipping-restaurant-operator-math-2026": [
        "service charges vs tipping restaurant",
        "restaurant tip pool vs service charge math",
        "restaurant service charge legal",
        "tipped vs no tip restaurant comparison",
        "service charge model operator math",
    ],
    "my-restaurant-isnt-on-google-maps-10-minute-diagnostic": [
        "my restaurant not on google maps",
        "restaurant missing google maps",
        "google business profile not showing",
        "restaurant gbp diagnostic 10 minute",
        "fix restaurant invisible google maps",
    ],
    "restaurant-schema-markup-complete-paste-ready-example": [
        "restaurant schema markup example",
        "restaurant json ld paste ready",
        "restaurant menu schema markup",
        "restaurant.org schema example",
        "google rich result restaurant schema",
    ],
    # ---- Wave-2 (2026-05-23) ----
    "may-2026-discovery-changed-under-you": [
        "ai mode restaurant search 2026",
        "google ai mode restaurant",
        "google business profile ai search 2026",
        "restaurant discovery may 2026 change",
        "gemini restaurant referral",
    ],
    "google-ai-mode-restaurant-local-results-2026": [
        "google ai mode local result restaurant",
        "google io 2026 ai mode restaurants",
        "ai mode reservation opentable resy tock",
        "agentic restaurant booking google",
        "google ai mode local pack rebuild",
    ],
    "how-to-appear-in-ai-search-restaurant-2026": [
        "how to appear in ai search restaurant",
        "chatgpt restaurant visibility check",
        "gemini perplexity restaurant rating floor",
        "ai assistant rating floor restaurant",
        "restaurant visibility ai overview",
    ],
    "ai-local-pack-restaurant-phone-calls-2026": [
        "google call button missing restaurant",
        "ai local pack restaurant calls down",
        "restaurant maps views declining 2026",
        "google business profile call decline",
        "restaurant directions clicks falling",
    ],
    "gemini-ai-referral-traffic-restaurants-2026": [
        "gemini referral traffic restaurant",
        "gemini ai search restaurant 2026",
        "gemini.google.com restaurant referral",
        "gemini vs chatgpt referral share restaurant",
        "google business profile gemini citation",
    ],
    "google-ai-mode-reservation-booking-restaurant-2026": [
        "ai mode reservation booking restaurant",
        "google ai mode opentable resy tock booking",
        "agentic booking restaurant 2026",
        "restaurant direct booking vs agent",
        "ai assistant reservation restaurant",
    ],
    # ---- Wave-3 (2026-06-01) ----
    "dmv-math-moved-june-2026": [
        "dc restaurant wage 18.40 july 2026",
        "dmv restaurant cost pressures june 2026",
        "streatery removal dc restaurant",
        "beef price restaurant 2026",
        "june 2026 restaurant operator playbook",
    ],
    "dc-minimum-wage-restaurants-july-2026": [
        "dc minimum wage 18.40 july 2026",
        "dc tipped wage 10.30 july 2026",
        "dc initiative 82 restaurant wage",
        "dc restaurant wage step price",
        "dc restaurant wage july 1 deadline",
    ],
    "dc-streatery-removal-restaurant-covers-2026": [
        "dc streatery removal restaurant covers",
        "dc ddot road rent streatery",
        "dc restaurant patio loss 2026",
        "dc curb seating end restaurant",
        "rebuild covers after streatery removal",
    ],
    "restaurant-food-cost-increases-2026": [
        "restaurant food cost increases 2026",
        "beef price 6.90 per pound 2026",
        "fafh price forecast 3.6 percent 2026",
        "restaurant re-cost five plates",
        "selective menu re-pricing restaurant",
    ],
    "independent-restaurant-june-2026-calendar": [
        "june 2026 restaurant operator calendar",
        "father's day restaurant 2026",
        "summer hiring restaurant 2026",
        "june restaurant marketing calendar",
        "independent restaurant june playbook",
    ],
}


def _preload_block(audio_href: str) -> str:
    return (
        f'<link rel="preload" as="audio" type="audio/mpeg" '
        f'href="{audio_href}" fetchpriority="high" />'
    )


PRELOAD_MARK = "i18n:audio-preload"
# Match the START sentinel with or without trailing context
# (older runs wrote `START (generated by scripts/enrich-post-seo.py)`).
PRELOAD_RE = re.compile(
    r'<!-- ' + re.escape(PRELOAD_MARK) + r' START[^>]*-->[\s\S]*?<!-- ' + re.escape(PRELOAD_MARK) + r' END -->\n?'
)


def wrap_preload(href: str) -> str:
    return (
        f"<!-- {PRELOAD_MARK} START (generated by scripts/enrich-post-seo.py) -->\n"
        f"{_preload_block(href)}\n"
        f"<!-- {PRELOAD_MARK} END -->\n"
    )


SPEAKABLE = {
    "@type": "SpeakableSpecification",
    "cssSelector": ["article#post-body", "h1", ".post-dek"],
}


def _patch_jsonld(html: str, slug: str, is_es: bool) -> tuple[str, bool]:
    """Returns (new_html, changed). Adds keywords + speakable."""
    changed = False
    script_re = re.compile(
        r'(<script type="application/ld\+json">\s*)([\s\S]*?)(\s*</script>)',
        re.IGNORECASE,
    )
    match = script_re.search(html)
    if not match:
        return html, False
    try:
        data = json.loads(match.group(2))
    except json.JSONDecodeError:
        return html, False

    graph = data.get("@graph")
    if not isinstance(graph, list):
        return html, False

    for node in graph:
        if not isinstance(node, dict):
            continue
        # Older posts use BlogPosting; newer ones (the May-2026 publication
        # wave and onward, scaffolded by new-article-skeleton.mjs) use
        # Article. Both are valid Schema.org types for the same role and
        # both get the same speakable + keywords treatment. Without this,
        # every Article-typed post silently skipped this enrichment and
        # shipped without SpeakableSpecification (May 2026 audit found
        # 18 such posts).
        if node.get("@type") not in ("BlogPosting", "Article"):
            continue
        # keywords
        if "keywords" not in node and slug in KEYWORDS:
            node["keywords"] = KEYWORDS[slug]
            changed = True
        # speakable
        if "speakable" not in node:
            node["speakable"] = SPEAKABLE
            changed = True

    if not changed:
        return html, False

    new_block = json.dumps(data, indent=2, ensure_ascii=False)
    new_html = html[: match.start(2)] + new_block + html[match.end(2) :]
    return new_html, True


def _patch_preload(html: str, is_draft: bool, slug: str, is_es: bool) -> tuple[str, bool]:
    """Remove any audio preload sentinel block from <head>.

    Earlier versions of this script injected a high-priority audio
    preload to warm the Listen button's MP3 ahead of LCP. On mid-tier
    Android over 4G the ~5 MB MP3 saturated the connection before LCP
    could paint, stalling perceived load by 15-30 seconds for a feature
    most readers never used. The audio element on the page sets
    `preload="none"` and only fetches when the user clicks Listen.

    The function stays idempotent: if a sentinel block is present, it's
    removed; if not, no-op."""
    del is_draft, slug, is_es  # signature preserved for caller compatibility
    if PRELOAD_RE.search(html):
        new = PRELOAD_RE.sub("", html)
        return new, new != html
    return html, False


def _slug_from_path(path: Path) -> tuple[str, bool, bool]:
    """Returns (slug, is_draft, is_es). slug is the post directory name."""
    parts = path.parts
    is_draft = "drafts" in parts
    is_es = "es" in parts[:2]
    slug = path.parent.name
    return slug, is_draft, is_es


def process(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    slug, is_draft, is_es = _slug_from_path(path)

    # Only patch pages that actually carry a Listen button (audio
    # pipeline wired up). A post without audio shouldn't get a
    # preload hint or speakable.
    if "listen-btn" not in html:
        return False

    orig = html
    html, _ = _patch_jsonld(html, slug, is_es)
    html, _ = _patch_preload(html, is_draft, slug, is_es)

    if html == orig:
        return False
    if CHECK_ONLY:
        print(f"would update: {path.relative_to(REPO)}")
        return True
    path.write_text(html, encoding="utf-8")
    print(f"updated: {path.relative_to(REPO)}")
    return True


def main():
    roots = [REPO / "blog", REPO / "es" / "blog"]
    changed = 0
    total = 0
    for root in roots:
        for p in sorted(root.rglob("index.html")):
            total += 1
            if process(p):
                changed += 1
    print(f"\n{'would update' if CHECK_ONLY else 'updated'} {changed}/{total}")
    return 0 if not CHECK_ONLY or changed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
