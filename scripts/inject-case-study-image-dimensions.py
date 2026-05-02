#!/usr/bin/env python3
"""Stamp width/height attributes on every case-study <img> by
reading the actual PNG IHDR chunk. Replaces the aspect-ratio
fallback with intrinsic dimensions, killing CLS for these images
on slow connections.

Usage:
  python3 scripts/inject-case-study-image-dimensions.py [--check]
"""
from __future__ import annotations

import re
import struct
import sys
from pathlib import Path

REPO       = Path(__file__).resolve().parent.parent
CHECK_ONLY = "--check" in sys.argv

# Walk the case-study HTML files (EN + ES) and any <img> with a
# /work/<case>/ src that we can resolve on disk.
TARGETS = [
    "work/tacombi/index.html",
    "work/irish-inn-glen-echo/index.html",
    "work/off-day-collective/index.html",
    "es/work/tacombi/index.html",
    "es/work/irish-inn-glen-echo/index.html",
    "es/work/off-day-collective/index.html",
]

PNG_SIG = b"\x89PNG\r\n\x1a\n"


def read_png_size(path: Path) -> tuple[int, int] | None:
    """Read width/height from a PNG's IHDR chunk. Returns None if the
    file isn't a PNG or can't be parsed."""
    try:
        with path.open("rb") as f:
            sig = f.read(8)
            if sig != PNG_SIG:
                return None
            # IHDR comes first, length=13. Skip the length (4) and chunk
            # type (4), then read 8 bytes (width + height).
            f.read(8)  # length + type
            w, h = struct.unpack(">II", f.read(8))
            return w, h
    except OSError:
        return None


def resolve_src(html_path: Path, src: str) -> Path | None:
    """Map a src attribute to a path on disk. Both absolute (/work/...)
    and relative (./logo.png) paths are supported."""
    if src.startswith("http://") or src.startswith("https://"):
        return None
    if src.startswith("/"):
        return REPO / src.lstrip("/")
    return html_path.parent / src


# Match <img ...src="..."...> blocks that don't already carry
# width="N" — those have been stamped already and should be left
# alone (idempotent).
IMG_RE = re.compile(
    r'(<img\s+(?![^>]*\bwidth=)[^>]*?\bsrc="([^"]+)"[^>]*?>)',
    re.IGNORECASE,
)


def patch(html: str, html_path: Path) -> tuple[str, int]:
    changed = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal changed
        full = m.group(1)
        src = m.group(2)
        target = resolve_src(html_path, src)
        if target is None or not target.exists():
            return full
        size = read_png_size(target)
        if size is None:
            return full
        w, h = size
        # Only insert width/height; leave existing attributes alone.
        # Inserting right before the closing > so we don't disturb
        # other attributes' order.
        new = full[:-1] + f' width="{w}" height="{h}">'
        if new != full:
            changed += 1
        return new

    return IMG_RE.sub(repl, html), changed


def main() -> int:
    total_changed = 0
    files_touched = 0
    for rel in TARGETS:
        path = REPO / rel
        if not path.exists():
            continue
        src = path.read_text(encoding="utf-8")
        new, n = patch(src, path)
        if new != src:
            files_touched += 1
            total_changed += n
            if not CHECK_ONLY:
                path.write_text(new, encoding="utf-8")
            print(
                f"{'would update' if CHECK_ONLY else 'updated'}: {rel}  "
                f"({n} <img> stamped)"
            )

    print(f"\n{'would update' if CHECK_ONLY else 'updated'} {files_touched} file(s); "
          f"{total_changed} <img> stamp(s) total.")
    return 0 if not CHECK_ONLY or total_changed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
