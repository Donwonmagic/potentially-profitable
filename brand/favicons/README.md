# Favicons

Google Search, modern browsers, iOS Safari, and Android Chrome all
want favicon files in different formats and sizes. We keep the
master source as an SVG at `/brand/mark/mark-square-ink.svg` and
generate a full set of raster favicons from it.

## Why this matters

Google Search prefers PNG favicons at 48×48 or larger for its
search results display. If the only favicon on the site is an
SVG (which was the state before sprint 30b), Google's search
crawler often falls back to "no favicon" — which is exactly why
the Muntin Digital search result currently shows no icon next to
the URL. Google supports SVG favicons in the browser tab, but
the search-result favicon pipeline prefers raster.

Sprint 30b already wired the HTML `<link rel="icon">` tags to
expect PNG files at the paths listed below. Until the actual PNG
files exist in this directory, browsers fall back to the SVG
(which still works everywhere) and Google Search shows no icon.
Dropping the generated files in place fixes both issues in one
step — no HTML change needed.

## Generation recipe (3 minutes, no install)

1. Go to **https://favicon.io/favicon-converter/**
2. Upload `/brand/mark/mark-square-ink.svg`
3. Click **Download** — favicon.io returns a zip with every
   format Google, Apple, and Android want.
4. Unzip the package. You'll see:
   - `favicon.ico`
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `favicon-48x48.png`  ← critical for Google Search
   - `favicon-96x96.png`
   - `android-chrome-192x192.png`
   - `android-chrome-512x512.png`
   - `apple-touch-icon.png`  (180×180)
   - `site.webmanifest`
5. Drop every file **except `favicon.ico`** into this directory
   (`/brand/favicons/`).
6. Drop `favicon.ico` at the **repo root** (`/favicon.ico`).
   This is where browsers look by default when no other favicon
   tag is set. Old browsers, email clients, feed readers, and
   some link-preview scrapers still use this path.

## Files expected at the end

```
/favicon.ico
/brand/favicons/
  favicon-16x16.png
  favicon-32x32.png
  favicon-48x48.png
  favicon-96x96.png
  android-chrome-192x192.png
  android-chrome-512x512.png
  apple-touch-icon.png
  site.webmanifest
```

The HTML is already wired to reference every one of these paths
on the homepage, so no additional code change is needed after
you commit the files.

## Adjust site.webmanifest (optional but recommended)

favicon.io's default manifest is bare. Replace its contents with
this brand-aware version before committing:

```json
{
  "name": "Muntin Digital",
  "short_name": "Muntin",
  "description": "Web design, branding, and social media for small businesses — handled by one person.",
  "icons": [
    {
      "src": "/brand/favicons/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/brand/favicons/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#1F4E5B",
  "background_color": "#FAF7F2",
  "display": "standalone",
  "start_url": "/"
}
```

The `theme_color` and `background_color` are pulled from the
Muntin design tokens in `/assets/site.css` — they match the rest
of the brand system so Android's PWA install experience feels
continuous with the site.

## Commit

```sh
git add favicon.ico brand/favicons/
git commit -m "Add favicon bundle generated from brand/mark SVG"
git push
```

## After it ships

Google Search takes **1–4 weeks** (sometimes longer) to pick up
a new favicon for an existing site, especially for a young
domain. You'll know it worked when a search for `muntin digital`
shows the window-mark glyph next to the result URL in the
search listing.

To speed up discovery after the files are live:

1. Open Google Search Console (see
   `/docs/search-console-setup.md`)
2. Use the URL Inspection tool on `https://muntin.digital/`
3. Click **Request indexing**
4. Wait — Google typically re-crawls and picks up the new
   favicon within 72 hours after a manual indexing request,
   though this is not guaranteed.
