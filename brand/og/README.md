# Per-page OG (Open Graph) image cards

These are the 1200×630 social share cards for each indexed page. They're
authored as SVG here (one file per page) and are meant to be exported to
matching `.png` siblings for deployment, because Facebook, LinkedIn,
iMessage, WhatsApp, and Slack still render raster OG images more
reliably than SVG.

The page templates are already wired to point at the `.png` path. Drop
the exported files next to each SVG and you're live. Until then the
pages fall back to `/brand/og-image.png` (the master card).

## The full card inventory (EN + ES, 40 cards)

Each page has an English card in `/brand/og/<name>.svg` and a Spanish
sibling at `/brand/og/<name>-es.svg`. Same design system — same
palette, same Fraunces/Inter stack, same muntin-window mark — with
translated copy. Every ES page under `/es/*` points at the `-es` card
via `og:image` and `twitter:image`; every EN page points at the plain
sibling.

### Category cards

| EN SVG | ES SVG | Used by |
|---|---|---|
| `home.svg` | `home-es.svg` | `/` · `/es/` |
| `about.svg` | `about-es.svg` | `/about/` · `/es/about/` |
| `services.svg` | `services-es.svg` | `/services/` · `/es/services/` |
| `glossary.svg` | `glossary-es.svg` | `/glossary/` · `/es/glossary/` |
| `restaurants.svg` | `restaurants-es.svg` | `/for/restaurants/` · `/es/for/restaurants/` |
| `checklist.svg` | `checklist-es.svg` | `/resources/restaurant-website-checklist/` · `/es/…` |

### Portfolio cards

| EN SVG | ES SVG | Used by |
|---|---|---|
| `work.svg` | `work-es.svg` | `/work/` · `/es/work/` |
| `work-irish-inn.svg` | `work-irish-inn-es.svg` | `/work/irish-inn-glen-echo/` · `/es/…` |
| `work-off-day-collective.svg` | `work-off-day-collective-es.svg` | `/work/off-day-collective/` · `/es/…` |
| `work-tacombi.svg` | `work-tacombi-es.svg` | `/work/tacombi/` · `/es/…` |

### Tool cards

| EN SVG | ES SVG | Used by |
|---|---|---|
| `audit.svg` | `audit-es.svg` | `/tools/` + `/tools/audits/` (and ES mirrors) |
| `audit-restaurants.svg` | `audit-restaurants-es.svg` | `/tools/audits/restaurant/` · ES mirror |
| `tool-compare.svg` | `tool-compare-es.svg` | `/tools/compare/` · ES mirror |
| `tool-gbp-grader.svg` | `tool-gbp-grader-es.svg` | `/tools/gbp-grader/` · ES mirror |
| `tool-mobile-check.svg` | `tool-mobile-check-es.svg` | `/tools/mobile-check/` · ES mirror |
| `tool-schema-check.svg` | `tool-schema-check-es.svg` | `/tools/schema-check/` · ES mirror |
| `tool-search-ideas.svg` | `tool-search-ideas-es.svg` | `/tools/search-ideas/` · ES mirror |
| `tool-seo-grader.svg` | `tool-seo-grader-es.svg` | `/tools/seo-grader/` · ES mirror |
| `tool-speed-test.svg` | `tool-speed-test-es.svg` | `/tools/speed-test/` · ES mirror |
| `tool-tech-stack.svg` | `tool-tech-stack-es.svg` | `/tools/tech-stack/` · ES mirror |

### Blog cards (still EN-only; ES blog not yet live)

| SVG | Used by |
|---|---|
| `blog.svg` | `/blog/` landing |
| `blog-*.svg` | Individual blog posts (see file listing) |

### Rewiring

Every page's `og:image` points at the `.svg` above. The companion PNG
lives at the same filename with a `.png` extension (once exported).
To re-point every page after editing this inventory, run:

```sh
node scripts/rewire-og-cards.mjs
```

The script is idempotent and safe to re-run. The ES restaurant-audit
mirror is regenerated alongside via `scripts/stamp-es-restaurant-audit.mjs`
(already wired into the Cloudflare Pages build).

## Why SVG + PNG

Raster is the safe format for OG images in 2026. SVG is the safe format
for the source file — you can open it in any vector editor, tweak the
copy, change colors, swap fonts, and re-export without losing fidelity.
Keeping both means edits are cheap and deployment is robust.

## Exporting to PNG

The fastest paths, in order of "zero-setup":

### Option 1 — Figma (recommended for you)

1. In Figma, create a 1200×630 frame.
2. File menu → Place Image → select one of the `.svg` files from
   this directory.
3. **Replace the system-font text** with the real Muntin type (Fraunces
   for Inter/Garamond display, Playfair Display for the Irish Inn card,
   Cormorant Garamond for the Off Day Collective card) — the SVGs were
   written with Georgia/Arial fallbacks because the sandbox that built
   them can't embed fonts. Figma has your real fonts installed, so this
   is where the cards get their final polish.
4. Export the frame as PNG at 1×, 1200×630.
5. Save as `[same name].png` next to the SVG in this directory.
6. Commit and push.

### Option 2 — Browser + screenshot (fine for a first pass)

1. Open the `.svg` file in Chrome, Safari, or Firefox.
2. Use a screenshot tool (macOS: Cmd-Shift-5, Windows: Snipping Tool).
3. Capture at exactly 1200×630 — resize the browser window to match
   the viewBox or use the browser's devtools "device mode" to force
   the viewport.
4. Save as `[same name].png`.
5. Commit and push.

Result will have the browser's default serif (Times New Roman on most
systems), which is close to but not quite Fraunces/Playfair. Good
enough for v1.

### Option 3 — Online converter

Drop the SVG into https://cloudconvert.com/svg-to-png (or any
equivalent), set output dimensions to 1200×630, download.

### Option 4 — ImageMagick / rsvg-convert (if you have them locally)

```sh
# macOS with homebrew: brew install librsvg
rsvg-convert -w 1200 -h 630 home.svg -o home.png

# Or with ImageMagick:
magick convert -density 200 home.svg -resize 1200x630 home.png
```

## Design tokens used in these cards

Pulled from the Muntin design system (`/assets/site.css`):

| Role | Hex | Used on |
|---|---|---|
| Cream | `#FAF7F2` | home, checklist, audit, audit-restaurants |
| Cream (warm) | `#F9F7F2` | work-irish-inn, work-off-day-collective |
| Ink | `#14161A` | home, checklist body |
| Teal | `#1F4E5B` | restaurants, audit accents |
| Gold (Irish Inn) | `#C5A059` | work-irish-inn accents |
| Gold (ODC) | `#C9A84C` | work-off-day-collective accents |
| Irish Inn green | `#123821` | work-irish-inn background |
| ODC warm near-black | `#0D0C0A` | work-off-day-collective background |
| Amber (warn) | `#D97706` | audit-restaurants score ring |
| Stone | `#6B6B6B` | secondary text |

## Typography

- **Display** — Fraunces (system fallback: Georgia)
- **Irish Inn display** — Playfair Display (system fallback: Fraunces)
- **Off Day Collective display** — Cormorant Garamond (system fallback: Fraunces)
- **Body / labels** — Inter (system fallback: Arial)
- **Irish Inn body** — Lato (system fallback: Inter)

When you re-export from Figma/Illustrator with the real fonts
installed, the cards pick up their intended voice automatically.

## If you edit one of these

Edit the SVG here first (it's the source of truth), then re-export the
PNG next to it. The page meta tags point at the PNG path so you don't
need to touch any HTML.
