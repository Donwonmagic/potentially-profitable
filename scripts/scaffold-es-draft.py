#!/usr/bin/env python3
"""Scaffold /es/blog/drafts/<slug>/index.html from the English draft.

Pipeline
--------
1. Parse the English draft HTML (lxml).
2. Swap head metadata: lang=es, canonical, hreflang alternates, og:locale,
   og:url, twitter:*, JSON-LD @id/url/inLanguage/breadcrumbs.
3. Translate all <title>, meta[content], visible text nodes inside
   <main>, and specific aria-label/alt/data-audio-alt attributes via
   scripts.lib.translate (document-level batching + glossary).
4. Rewrite <button id="listen-btn">'s data-audio-src to the absolute
   canonical path /blog/drafts/<slug>/audio.mp3 so the ES page pulls
   the same MP3/manifest pair (saves bandwidth + keeps translations
   loader pointed at the canonical dir).
5. Point lang-switch anchors at the EN counterpart.
6. Write to es/blog/drafts/<slug>/index.html.

After running, execute scripts/sync-includes.mjs to swap the English
nav + footer chrome for the Spanish partials. The scaffold itself
leaves the EN chrome in place — sync-includes is the single source
of truth for nav/footer and will do the locale-correct substitution.

Usage
-----
  python3 scripts/scaffold-es-draft.py <slug> [<slug2> ...]
  python3 scripts/scaffold-es-draft.py --all
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "scripts" / "lib"))

from bs4 import BeautifulSoup, NavigableString, Comment  # noqa: E402
import translate as _translate  # noqa: E402

TARGET = "es"

DRAFTS_DIR = REPO / "blog" / "drafts"
OUT_DIR = REPO / "es" / "blog" / "drafts"

# Attributes whose value is user-visible prose and needs translation.
TRANSLATABLE_ATTRS = ("alt", "aria-label", "data-audio-alt", "placeholder", "title")

# Tags whose text content is NOT prose — skip.
NON_PROSE_TAGS = {"script", "style", "code", "pre", "time", "svg"}

# Strings that are structural flags / IDs and should never be translated.
SKIP_TEXT_EXACT = {"•", "·", "→", "·", "&middot;", "\u2022", "\u00b7"}


def _should_translate_node(node: NavigableString) -> bool:
    if isinstance(node, Comment):
        return False
    text = str(node)
    if not text.strip():
        return False
    # Walk up parents — bail if we're inside a non-prose container.
    p = node.parent
    while p is not None:
        name = getattr(p, "name", None)
        if name in NON_PROSE_TAGS:
            return False
        p = getattr(p, "parent", None)
    return True


def _collect_translatables(root):
    """Return (chunks, back_refs). chunks is the payload for
    translate.translate_chunks; back_refs[i] describes where chunk i
    came from so we can put the translation back.

    back_refs shapes:
      ("text", NavigableString)
      ("attr", Tag, attr_name)
    """
    chunks = []
    refs = []

    def add(text, ref):
        s = text.strip()
        if not s or s in SKIP_TEXT_EXACT:
            return
        # Preserve leading/trailing whitespace separately so reinsertion
        # keeps the original spacing.
        lead = text[: len(text) - len(text.lstrip())]
        trail = text[len(text.rstrip()) :]
        refs.append((ref, lead, trail))
        chunks.append({"id": len(chunks), "text": s})

    # Attributes first (simpler — no whitespace issues inside attrs).
    for tag in root.find_all(True):
        for a in TRANSLATABLE_ATTRS:
            if a in tag.attrs:
                v = tag.attrs[a]
                if isinstance(v, str) and v.strip():
                    chunks.append({"id": len(chunks), "text": v.strip()})
                    refs.append((("attr", tag, a), "", ""))

    # Then text nodes under <main>.
    main = root.find("main", id="main") or root.find("main") or root
    for tnode in list(main.descendants):
        if isinstance(tnode, NavigableString) and _should_translate_node(tnode):
            add(str(tnode), ("text", tnode))

    return chunks, refs


def _apply_translations(refs, translated):
    """Walk refs in order and apply translated[i] to each source site."""
    for ref_info, pieces in zip(refs, translated):
        tag_info, lead, trail = ref_info
        txt = pieces["text"]
        kind = tag_info[0]
        if kind == "text":
            node = tag_info[1]
            if node.parent is None:
                # Detached (likely because a sibling replacement collapsed
                # it into the new string). Skip — the surviving sibling
                # already carries the translated text for this span.
                continue
            node.replace_with(NavigableString(lead + txt + trail))
        elif kind == "attr":
            tag = tag_info[1]
            attr = tag_info[2]
            tag[attr] = txt


def _rewrite_head(soup: BeautifulSoup, slug: str):
    """Rewrite head meta for /es/ locale. Assumes translation pass has
    already updated <title> + meta[content]; this step handles the
    URL/locale-structural bits that don't go through the translator."""
    en_url = f"https://muntin.digital/blog/drafts/{slug}/"
    es_url = f"https://muntin.digital/es/blog/drafts/{slug}/"

    html = soup.find("html")
    if html is not None:
        html["lang"] = "es"

    # Canonical points at the ES page itself.
    canon = soup.find("link", rel="canonical")
    if canon is not None:
        canon["href"] = es_url

    # hreflang block: add an EN alternate + self alternate if not present.
    head = soup.find("head")
    if head is not None:
        # Remove any existing hreflang alternates so we own this state.
        for lnk in head.find_all("link", rel="alternate"):
            if lnk.get("hreflang"):
                lnk.decompose()
        for (lang, href) in [
            ("en", en_url),
            ("es", es_url),
            ("x-default", en_url),
        ]:
            tag = soup.new_tag(
                "link",
                rel="alternate",
                hreflang=lang,
                href=href,
            )
            canon.insert_after(tag) if canon else head.append(tag)

        # og:locale for ES.
        og_locale = head.find("meta", property="og:locale")
        if og_locale is None:
            tag = soup.new_tag("meta")
            tag["property"] = "og:locale"
            tag["content"] = "es_US"
            head.append(tag)
        else:
            og_locale["content"] = "es_US"
        # og:locale:alternate → en_US
        has_alt = any(
            m.get("property") == "og:locale:alternate"
            for m in head.find_all("meta")
        )
        if not has_alt:
            tag = soup.new_tag("meta")
            tag["property"] = "og:locale:alternate"
            tag["content"] = "en_US"
            head.append(tag)

        # og:url + twitter URLs.
        og_url = head.find("meta", property="og:url")
        if og_url is not None:
            og_url["content"] = es_url

    # Rewrite URLs inside the JSON-LD @graph.
    for sc in soup.find_all("script", type="application/ld+json"):
        try:
            raw = sc.string or "".join(
                str(c) for c in sc.contents if isinstance(c, NavigableString)
            )
            data = json.loads(raw)
        except Exception:
            continue
        _rewrite_jsonld(data, en_url, es_url)
        sc.string = json.dumps(data, indent=2, ensure_ascii=False)


def _rewrite_jsonld(node, en_url, es_url):
    if isinstance(node, dict):
        for k, v in list(node.items()):
            if k in ("@id", "url", "mainEntityOfPage", "item") and isinstance(v, str):
                if v == en_url:
                    node[k] = es_url
                elif v == en_url + "#article":
                    node[k] = es_url + "#article"
                elif v.startswith(en_url):
                    # e.g. #article fragment
                    node[k] = es_url + v[len(en_url):]
                elif v == "https://muntin.digital/" and k == "item":
                    node[k] = "https://muntin.digital/es/"
                elif v == "https://muntin.digital/blog/" and k == "item":
                    node[k] = "https://muntin.digital/es/blog/"
            elif k == "inLanguage" and isinstance(v, str):
                node[k] = "es"
            else:
                _rewrite_jsonld(v, en_url, es_url)
    elif isinstance(node, list):
        for item in node:
            _rewrite_jsonld(item, en_url, es_url)


def _rewrite_body_urls(soup: BeautifulSoup, slug: str):
    """Fix up audio src, skip-link, and lang-switch anchors."""
    # Audio: point at canonical EN directory via absolute path.
    listen = soup.find("button", id="listen-btn")
    if listen is not None:
        listen["data-audio-src"] = f"/blog/drafts/{slug}/audio.mp3"

    # Lang-switch header anchors point at the EN counterpart.
    for a in soup.select('a.js-lang-switch, a.mobile-lang'):
        a["href"] = f"/blog/drafts/{slug}/"
        a["hreflang"] = "en"
        a["lang"] = "en"

    # Breadcrumb anchors: rewrite root + blog links to /es/ equivalents.
    bc = soup.find("nav", class_="breadcrumb")
    if bc is not None:
        for a in bc.find_all("a"):
            href = a.get("href", "")
            if href == "/":
                a["href"] = "/es/"
            elif href == "/blog/":
                a["href"] = "/es/blog/"


def scaffold(slug: str):
    src = DRAFTS_DIR / slug / "index.html"
    dst = OUT_DIR / slug / "index.html"
    if not src.exists():
        print(f"[skip] {slug}: source not found at {src}", file=sys.stderr)
        return False

    html = src.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "lxml")

    # Translate <head> strings: <title>, meta[name|property="*"][content]
    head = soup.find("head")
    head_chunks = []
    head_refs = []
    if head is not None:
        title = head.find("title")
        if title and title.string:
            head_chunks.append({"id": len(head_chunks), "text": title.string.strip()})
            head_refs.append((("text", title.string), "", ""))
        for meta in head.find_all("meta"):
            name = meta.get("name") or meta.get("property") or ""
            if name in (
                "description",
                "og:title",
                "og:description",
                "twitter:title",
                "twitter:description",
                "twitter:image:alt",
            ):
                v = meta.get("content", "")
                if v:
                    head_chunks.append({"id": len(head_chunks), "text": v})
                    head_refs.append((("attr", meta, "content"), "", ""))

    # Translate body chunks (inside <main>) + selected attributes.
    body_chunks, body_refs = _collect_translatables(soup)

    # Renumber combined list with stable IDs for the translator.
    combined = head_chunks + body_chunks
    for i, c in enumerate(combined):
        c["id"] = i
    print(
        f"[{slug}] head:{len(head_chunks)} body:{len(body_chunks)} → {len(combined)} chunks",
        file=sys.stderr,
    )

    translated = _translate.translate_chunks(combined, TARGET)
    # Re-split
    translated_head = translated[: len(head_chunks)]
    translated_body = translated[len(head_chunks) :]

    _apply_translations(head_refs, translated_head)
    _apply_translations(body_refs, translated_body)

    # Post-translation head rewrite (URLs, locale, JSON-LD).
    _rewrite_head(soup, slug)
    _rewrite_body_urls(soup, slug)

    dst.parent.mkdir(parents=True, exist_ok=True)
    out = soup.encode(formatter="html").decode("utf-8")
    # lxml strips the doctype into a sentinel; re-prepend and strip the
    # bare "HTML" literal bs4 leaves behind when it serializes an html5
    # document with a custom doctype.
    if not out.lstrip().startswith("<!doctype"):
        out = re.sub(r"^\s*HTML\s*", "", out, count=1, flags=re.IGNORECASE)
        out = "<!doctype html>\n" + out.lstrip()
    dst.write_text(out, encoding="utf-8")
    print(f"  wrote {dst.relative_to(REPO)}", file=sys.stderr)
    return True


def main():
    args = sys.argv[1:]
    if not args:
        print("usage: scaffold-es-draft.py <slug>... | --all", file=sys.stderr)
        return 2
    if args == ["--all"]:
        slugs = [p.name for p in sorted(DRAFTS_DIR.iterdir()) if p.is_dir()]
    else:
        slugs = args
    ok = 0
    for s in slugs:
        try:
            if scaffold(s):
                ok += 1
        except Exception as e:
            print(f"[error] {s}: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
    print(f"\nscaffolded {ok}/{len(slugs)} drafts → es/blog/drafts/", file=sys.stderr)
    return 0 if ok == len(slugs) else 1


if __name__ == "__main__":
    sys.exit(main())
