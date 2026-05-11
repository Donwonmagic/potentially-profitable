# Library Letter — Week 1 / May 11, 2026

**Send window:** Monday May 11, 2026 — morning, before 9am ET.
**Audience:** Quarterly Library Letter list (operators past the drip + opted-in).
**Tool:** Buttondown (or current studio tool).

The first letter under the new editorial cadence: weekly batches, Sunday night through Monday morning, anchored by an overview piece. Future batches will be smaller and event-driven; this week's is the foundation drop.

---

## Subject (pick one)

- `Week 1: Nine pieces, one operating thesis.`  *(recommended — sets the cadence framing)*
- `The May 2026 batch is up. Read the overview first.`
- `Search results aren't ten blue links anymore.`

I'd send the first one. Names the cadence explicitly ("Week 1") so subscribers calibrate the rhythm going forward; the rest of the subject signals there's a thesis to read.

---

## Preheader (under 80 chars)

`Nine new pieces shipped this weekend. Overview, then the AI Overview piece, then the rest.`

---

## Body

Hi —

This is Week 1 of a new editorial cadence. Each batch ships Sunday night through Monday morning, with an overview piece as the entry point. Future weeks will mostly hook to whatever's actually moving in the industry that week — a Google update, a delivery-platform policy change, a wage-law phase-in. This week's batch is the foundation the future ones build on.

Nine pieces shipped this weekend, English and Spanish, all backed by first-party operating data. Start here — it's the overview that ties them together and tells you what to read first:

→ [The May 2026 wave: nine pieces, one operating thesis](https://muntin.digital/blog/may-2026-wave-publishing-for-citation/)

The through-line: search results aren't ten blue links anymore. They're a paragraph Google wrote, citing two or three sources. For restaurant queries, that paragraph now appears above the map pack. If you're not one of the cited sources, you're not in the conversation. The piece that names this directly: [How to get your restaurant cited in Google's AI Overviews](https://muntin.digital/blog/how-to-get-cited-in-google-ai-overviews-restaurant/). Five paragraph-level moves, 90 days of citation-tracking data behind it.

The other eight ladder from there:

- [Restaurant schema markup: a paste-ready example](https://muntin.digital/blog/restaurant-schema-markup-complete-paste-ready-example/) — sixty lines of JSON-LD, seven fields to edit, the technical companion to the AI Overview piece.
- [My restaurant isn't on Google Maps](https://muntin.digital/blog/my-restaurant-isnt-on-google-maps-10-minute-diagnostic/) — the four causes that cover 100% of map-pack invisibility, plus the 10-minute diagnostic walk.
- [How to respond to Google reviews](https://muntin.digital/blog/how-to-respond-to-google-reviews-restaurant-playbook-2026/) — four review archetypes, four response shapes, what AI Overviews now do with your responses.
- [Instagram is a search engine now](https://muntin.digital/blog/instagram-as-restaurant-seo-strategy-2026/) — caption-level moves that delivered 4.3x save lift on a real DMV account.
- [Uber Eats vs DoorDash vs Grubhub: the honest math](https://muntin.digital/blog/uber-eats-vs-doordash-vs-grubhub-restaurant-math-2026/) — side-by-side margin walks on the same $42 ticket.
- [30 days after leaving DoorDash](https://muntin.digital/blog/30-days-after-leaving-doordash-restaurant-case-study/) — I delisted one of the two restaurants I manage on April 7. Kept margin climbed 56% by week four.
- [Loyalty programs: what actually pays](https://muntin.digital/blog/loyalty-programs-for-independent-restaurants-what-works-2026/) — four models compared over twelve months; the punch card beats the standalone platform on ROI.
- [Service charges vs tipping: the operator's math](https://muntin.digital/blog/service-charges-vs-tipping-restaurant-operator-math-2026/) — three compensation models on the same $200 check, post-Initiative-82.

All nine ship with audio in six languages — English, Spanish, French, Italian, Portuguese, Mandarin. The listen button is at the top of each piece.

The single operating principle behind all nine: ranking and being cited are not the same job. The first independent restaurant in a market to write for the citation, not just the rank, owns the answer box for the next twelve months. Most operators haven't made that shift yet. The window for being first is open right now.

The next batch goes out next Sunday — smaller, likely keyed to whatever moves in the industry between now and then. Reply to this if there's a piece you'd like covered. I read every one.

— Don

---

## Tracking links (Plausible)

Each link in the body is plain — Buttondown rewrites them with the campaign-tracking param on send. Confirm Plausible shows the `from=newsletter-2026-w1` referrer by 4pm ET on send day.

## Send checklist

- [ ] Confirm audio renders for the 10 pieces (9 articles + overview) are at `status=rendered` in `data/article-audio.json`
- [ ] Subject + preheader chosen
- [ ] Test send to don@muntin.digital
- [ ] Spot-check overview link, AI Overview link, and one mid-list link
- [ ] Schedule for Monday May 11, 8:00am ET (peak operator inbox window per the prior letter's open rate)
- [ ] After send: move this file to `sent/2026-05-11-week-1.md` and start the Week 2 draft

## Future cadence notes (for the file)

- **Week 2 onwards**: smaller batches — 1-2 articles + an overview. Hook to current events: Google product updates, delivery-platform policy shifts, wage-law inflections, industry news.
- **When the week is quiet**: send a shorter "what I'm working on" note rather than nothing. Better to maintain the rhythm than skip a week.
- **The overview piece becomes the canonical share-link**. Subject lines reference the overview's thesis, not individual pieces.
- **Audio coverage**: every batch ships audio-complete in 6 languages before the letter goes out. If audio isn't ready, the letter waits a day.
- **The release-gate script** (`scripts/stamp-release-gate.mjs`) handles future-batch articles that get authored ahead but shouldn't index until release. Not used for Week 1 — everything dropped together.
