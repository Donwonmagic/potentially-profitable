#!/usr/bin/env python3
"""Render 1200x630 PNG counterparts for every OG SVG in brand/og/ and
swap every og:image / twitter:image / JSON-LD image reference from
.svg to .png across the entire site.

Why
---
Twitter/X, LinkedIn, Facebook, WhatsApp, iMessage, and native share
sheets on macOS/Windows/Android don't reliably render SVG og:images
(Twitter outright rejects them). The site declared og:image:width
=1200 + og:image:height=630 already; this script produces the raster
asset those tags promised.

The script is safe to re-run — skips PNGs newer than their SVG, and
the HTML rewrite is a plain text substitution that becomes a no-op
after the first pass.

Usage
-----
  python3 scripts/render-og-pngs.py
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OG = REPO / "brand" / "og"

ENTITY_MAP = {
    "&rdquo;": "\u201d", "&ldquo;": "\u201c",
    "&rsquo;": "\u2019", "&lsquo;": "\u2018",
    "&mdash;": "\u2014", "&ndash;": "\u2013",
    "&hellip;": "\u2026", "&middot;": "\u00b7",
    "&nbsp;": "\u00a0",
}


def _fix_entities(svg_path: Path) -> bool:
    """rsvg-convert is strict-XML and rejects HTML named entities.
    Replace with Unicode chars in place. Returns True if modified."""
    s = svg_path.read_text(encoding="utf-8")
    orig = s
    for k, v in ENTITY_MAP.items():
        s = s.replace(k, v)
    if s != orig:
        svg_path.write_text(s, encoding="utf-8")
        return True
    return False


def _render(svg_path: Path) -> Path:
    png_path = svg_path.with_suffix(".png")
    if png_path.exists() and png_path.stat().st_mtime >= svg_path.stat().st_mtime:
        return png_path
    result = subprocess.run(
        [
            "rsvg-convert",
            "-w", "1200",
            "-h", "630",
            "-b", "white",
            str(svg_path),
            "-o", str(png_path),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        # Maybe still has an HTML entity we didn't catch. Fix + retry once.
        if "Entity" in result.stderr and _fix_entities(svg_path):
            return _render(svg_path)
        raise RuntimeError(
            f"rsvg-convert failed on {svg_path.name}:\n{result.stderr}"
        )
    return png_path


def _rewrite_html(repo: Path) -> int:
    """Swap every /brand/og/<name>.svg → .png where a PNG exists.
    Flip og:image:type from image/svg+xml to image/png when the
    adjacent og:image is now pointing at a PNG."""
    changed = 0
    for html in repo.rglob("*.html"):
        # Skip vendor / ignored dirs.
        parts = set(html.parts)
        if any(p in parts for p in ("node_modules", ".git", "dist", ".wrangler")):
            continue
        s = html.read_text(encoding="utf-8")
        orig = s

        # For every /brand/og/<name>.svg, check if a .png exists; if so,
        # rewrite. Skips any stray SVG ref whose PNG we haven't built.
        def _swap(m: re.Match) -> str:
            name = m.group(1)
            if (OG / f"{name}.png").exists():
                return f"/brand/og/{name}.png"
            return m.group(0)

        s = re.sub(r"/brand/og/([a-z0-9-]+)\.svg", _swap, s)

        # Type header. If the document no longer has an SVG og:image
        # ref anywhere, we can safely flip every image/svg+xml to
        # image/png. Leaves image/svg+xml alone on pages that still
        # reference one (e.g. favicons).
        if "/brand/og/" not in s or ".svg" not in "".join(
            m.group(0) for m in re.finditer(r"/brand/og/[^\"\s]+", s)
        ):
            s = s.replace(
                '<meta property="og:image:type" content="image/svg+xml" />',
                '<meta property="og:image:type" content="image/png" />',
            )

        if s != orig:
            html.write_text(s, encoding="utf-8")
            changed += 1
    return changed


def main():
    svgs = sorted(OG.glob("*.svg"))
    rendered = 0
    for svg in svgs:
        # Fix any entities pre-emptively so the first render doesn't fail.
        _fix_entities(svg)
        try:
            png = _render(svg)
            if png.stat().st_mtime >= svg.stat().st_mtime:
                rendered += 1
                print(f"  \u2713 {png.name}")
        except Exception as e:
            print(f"  \u2717 {svg.name}: {e}", file=sys.stderr)

    print(f"\nrendered {rendered}/{len(svgs)} PNGs")
    html_changed = _rewrite_html(REPO)
    print(f"rewrote {html_changed} HTML files")


if __name__ == "__main__":
    sys.exit(main() or 0)
