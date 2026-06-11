# /about/portrait/ — placeholder for Don's headshot

The /about/index.html page (line ~416) references
`/about/portrait/don.png` as Don's headshot. The file does not yet
exist; the `<img>` element falls back to a CSS-rendered "D"
lettermark.

The trust audit flagged this as the highest-leverage single trust fix
on the site. A real photo of the founder beats a typographic placeholder
on Muntin Digital's About page, every time.

When you're ready to ship the photo:

1. Drop the image at `/about/portrait/don.png`.
   - Square, centered, ≥640×640, 75% quality JPG-converted-to-PNG or AVIF.
   - Plain background works fine; restaurant kitchen / Glen Echo / DMV-area
     setting works better.
2. Add `width="320" height="320"` to the `<img>` so layout doesn't shift.
3. Re-run `node scripts/build-og-cards.mjs` if you want the photo on the
   About OG card too.
4. Delete this README.
