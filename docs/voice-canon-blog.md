# Voice canon — Blog posts (`/blog/<slug>/`)

This is the authoritative voice + structure reference for any post that
ships at `/blog/<slug>/`, plus the per-post entries in `data/article-*`
JSON, the blog index card, the sitemap entry, the RSS feed (`feed.xml`),
and the LLM feed (`feed-llm.json`).

> This canon governs the studio voice on `muntin.digital`. How that voice
> relates to the Muntin Ledger product voice — and the one boundary between
> them — lives in `docs/brand/voice-and-naming-architecture.md`.

It is a **sister document** to `voice-canon-sheets.md`. Where this file
is silent, the sheets canon governs.

Where this file conflicts with `/methods/#voice-contract`, the
contract governs and this file is wrong — fix this file.

---

## 1. The blog vs. the library

Two separate surfaces with different jobs. Mixing them is the most
common mistake.

| | **Blog** (`/blog/`) | **Library** (`/library/`) |
| --- | --- | --- |
| **Window** | Current happenings — what changed this week, this month | Evergreen concepts — what is true regardless of week |
| **Half-life** | Weeks to months | 18+ months |
| **Anchor** | A specific date, event, product launch, policy shift, study release | A pattern, mechanism, or decision the operator faces repeatedly |
| **Voice on time** | "Inside four days, Google rebuilt AI Mode…" | "The model reads your prose, then reads your JSON-LD, then asks…" |
| **Headline shape** | Names the event or the date ("Discovery changed under you this spring") | Names the question or the move ("How to get cited in Google's AI Overviews") |
| **Updates** | Stamp `dateModified`; do not retitle. If the post is stale, write a new post and link back | Living documents; rewrite in place, bump `dateModified` |
| **SEO target** | Long-tail current-event queries ("google may 2026 core update restaurant", "gemini ai referral restaurants") | Foundational queries ("how to get my restaurant on google maps") |
| **Reader arriving** | Reading because something just happened and they want the operator read | Reading because they have a problem to solve and they want the playbook |

The test: **if a reader finds this post in twelve months and the news
peg is irrelevant, did the prose still teach them something?** If yes,
it might belong in the library. If no, it is correctly a blog post —
and that is fine, blog posts are allowed to age out.

---

## 2. The reader

A working operator. They run a kitchen, a host stand, a small ownership
group, or the floor of someone else's. They opened the link because:

1. Someone they trust forwarded it.
2. Google sent them — they typed the exact event into the search bar
   ("google ai mode restaurant 2026", "may 2026 core update").
3. They subscribe to the Library Letter and the weekly batch landed.

They are not a beginner. They are not a marketer. They are not a "lead
in a funnel." They are a working adult who needs to know, in the
twelve minutes between lunch and the dinner pre-shift, **what
changed and what they should do about it**.

Write to that person. Not to a search engine. The search engine reads
the same surface — write well and the keywords land themselves.

### The blog's tone, specifically: relate, don't perform.

The library teaches. The blog talks. The reader should finish a blog
post feeling like Don sat down across from them at the bar after
service, named the thing they have been quietly worrying about, and
told them what he is doing about it on his own floor.

That is **warmth through specificity**, not warmth through adjectives.
We do not say *"I know how stressful this is for you!"* We say *"I
watched the call button disappear off my own profile on a Tuesday in
April and spent the next shift wondering why the host stand felt slow."*
The reader feels seen because the moment is real, not because the
sentence is sympathetic.

Three concrete moves that produce that feeling without breaking any
of the eight rules in §3:

  - **Name the worry before you name the fix.** *"You're not crazy. The
    phone really has stopped ringing the way it used to."* One sentence
    of acknowledgment, then back to the operator math.
  - **Name what the reader is already doing right.** Most operators are
    further along than they think; a post that opens by listing what
    they already have working ("you respond to reviews, you keep hours
    current, you posted the menu in plain text") earns the right to
    name what they're missing.
  - **Use the reader's actual day as the time-anchor.** *"Between the
    11am produce drop and the 4pm pre-shift"* lands warmer than *"in
    your free time"* and is more specific. The day is shared
    territory — the reader recognizes it.

What this is **not**: it is not a permission slip for chumminess. No
*"hey friend,"* no *"I get it,"* no exclamation marks, no winking. The
voice is the trusted regular at the bar — not the host trying too
hard.

---

## 3. The eight rules

These restate the methods.html voice contract in the register of a
blog post. They are not optional. A draft that breaks any of them gets
rewritten before publish — by the writer, the editor, or the model.

### 1. Numbers first. Stories second. Adjectives last.

  - **In:** *"Maps views are down 40.1%; food orders down 25.7% over two years."*
  - **Out:** *"Restaurant engagement on Maps is taking a real hit lately."*

Every numeric claim has a source in `data/sourced-claims.json` or an
inline `<details class="cite">` drawer (see §6).

### 2. Specific over vague.

  - **In:** *"Inside four days, Google rebuilt AI Mode on stage at I/O, started rolling out its second core search update of the year on May 21, and confirmed Gemini at 13.2% of AI referral traffic."*
  - **Out:** *"A lot has changed in search recently."*

The blog covers events. Name the date, the actor, and the version.

### 3. Name the cause, not the symptom.

  - **In:** *"Restaurant Maps views are down 40.1% because the AI answer now resolves the question — diner sees the hours, never opens the listing."*
  - **Out:** *"Maps engagement is declining for restaurants."*

A post that names the symptom is a press release. A post that names
the cause is operator reading.

### 4. Operator nouns. Never SaaS nouns.

  - **In:** the host stand · the close · the call button · the booking link · the back door · the kitchen lead · the produce reorder · the pre-shift
  - **Out:** your team · users · stakeholders · onboarding · the customer experience · the journey

### 5. Predicate sentences. No hedge tokens.

  - **Strike on every pass:** *approximately*, *usually*, *in some cases*, *most*, *often*, *typically*, *around*, *tend to*, *may*, *can*, *might*, *somewhat*, *fairly*, *quite*, *kind of*, *sort of*.
  - **Why:** the AI Overview extractor prunes them before the sentence ever ranks. The library has a whole post on this — practice what we preach.
  - **Exception:** when the hedge is the point. *"Google says rollout may take up to two weeks"* is an honest report of someone else's hedge, not your hedge.

### 6. One mid-sentence em-dash maximum. End on a noun.

  - **In:** *"One profile feeds four surfaces — the map pack, the AI Overview, Gemini, and the booking agent."*
  - **Out:** *"One profile — your Google Business Profile — feeds four surfaces, which is something every operator — especially indies — should understand and act on."*

### 7. First-person Don, one human — and the reader is in the room.

  - **In:** *"I was reading the I/O recap on the train back from
    Bethesda and stopped halfway down the page — Google had just
    announced the thing every operator I know has been bracing for."*
  - **In, addressing the reader:** *"If you have been watching your
    calls drop and your reviews still climb, you are reading the same
    chart I was reading."*
  - **Out:** *"We at Muntin Digital have observed declining Maps engagement…"*

Muntin Digital is the storefront, never the speaker. No royal "we." No
brand-as-character. The byline is Don Goldstein. The studio's
**current** operator credential is Front-of-House Manager at Tacombi
in Bethesda — see `docs/fact-check.md` for the bio rule. Past roles
are in `/about/` and `data/sourced-claims.json#operator_experience_claims.past_roles`.

The blog uses *you* more than the library does, on purpose. The
library is a reference book and refers to *the operator*; the blog is
a conversation and addresses the reader directly. *Your call button.
Your profile. Your Tuesday morning.* That direct address is what makes
the post feel personal — but it only earns its warmth when the next
sentence is a specific, sourced fact, not a sales line.

### 8. No marketing speak.

The banned-words list is in `/methods/#voice-contract` and is
authoritative. Excerpt for the daily-driver words a blog post is most
likely to slip into:

> *solutions · leverage · synergize · best-in-class · growth-hack · world-class · robust · scalable · end-to-end · unleash · unlock · empower · ecosystem · journey · partner up · reach out · dive in · deep-dive · loop in · circle back · low-hanging fruit · move the needle · just · simply · easy*

No exclamation marks. No emoji. No rhetorical questions in headlines.
No metaphor outside the window/muntin family.

---

## 4. The required structural skeleton

A blog post is not a free-form essay. It is a fixed structure with
slots. Every post fills every slot, in this order:

```
<head>                                         (§5)
  - title, description, canonical
  - hreflang (en + es minimum)
  - OG image at /brand/og/blog-<slug>.png
  - JSON-LD: Article + AudioObject + BreadcrumbList
  - JSON-LD: HowTo (only when the post has ordered, repeatable steps)
  - JSON-LD: article-abstract-mentions block (links to glossary terms)
<body>
  <header> — eyebrow ("The batch · DATE · N min read · By Don")
            H1 (event-named, ≤12 words, serif italic for the verb)
            Listen button (audio in 6 languages)
            Dek (≤55 words, names the change and the operator move)
  <aside class="tldr"> — 3-5 bullets, each ≤25 words   (§7)
  <article>
    H2 #1: Names the event, opens with the date         (§7)
    figure.viz-figure — graphic #1
    <details class="cite"> — source drawer
    [body paragraphs]
    H2 #2: Names the mechanism (cause, not symptom)
    [body paragraphs]
    figure.viz-figure — graphic #2
    H2 #3: Names the operator move
    <ul> of 3-5 bulleted actions (skim-rail)
    H2 #4 (optional): "What to do this week" — short list
  <aside class="key-takeaways">                          (§7)
  <aside class="smart-next"> — Read / Try / Or send Don a note (§7)
  <aside class="post-end-cta"> — audit ad                (§7)
```

Two graphics is the **floor**. Posts naming three or more shifts often
warrant three or four. One graphic per H2 is too many; one graphic per
two H2s is the rhythm.

---

## 5. SEO discipline (long-tail, current-event)

Blog posts target queries the operator types when something happened.
Three keywords per post, picked before writing:

  1. **Primary** — the event-named long-tail. ("may 2026 google core update restaurant", "gemini referral traffic restaurants 2026")
  2. **Secondary** — the operator-move adjacent query. ("what to do about ai overview restaurant", "google business profile ai search")
  3. **Topic anchor** — the broader category the post sits in. ("ai search restaurants", "restaurant local seo 2026")

### Where the keywords must appear

  - **Primary:** in the `<title>`, the `<meta name="description">`, the H1 (exact or near-exact), and once in the first 100 words of the dek + opening paragraph combined.
  - **Secondary:** in at least two H2 headers.
  - **Topic anchor:** in the introduction and at least one body paragraph.

### Where they must NOT appear

  - Stuffed into bullet lists with no surrounding sentence.
  - In the alt text of a graphic when the graphic isn't about the keyword.
  - In the byline, the footer, or the post-end-cta. Those slots are voice, not keyword real estate.

### The canonical, the slug, the breadcrumb

  - Slug: kebab-case, ≤7 words, contains the primary keyword's noun + year if event-anchored. (`google-ai-mode-restaurant-local-results-2026`)
  - Canonical: `https://muntin.digital/blog/<slug>/` — baked into draft from day one.
  - Breadcrumb: Home › Articles › [shortened title].

---

## 6. The fact-check gate — zero inventions, no exceptions

Restates and **sharpens** `docs/fact-check.md` for blog posts.

**The rule, stated once and absolutely: nothing in a blog post may be
invented. Not a number, not a date, not an operator anecdote, not a
study cite, not a quote, not a name, not a percentage, not a
"directional" figure that is actually a guess.** Every specific claim
must fit one of three patterns. There is no fourth pattern.

The May 2026 editorial review caught a wave of fabricated operator
data dressed as first-party experience. Those fabrications propagated
through JSON-LD abstracts, RSS, the LLM feed, audio narration, and
the author-card bio. The cost is the only asset the studio actually
has: the reader's trust. Once an invented fact is caught, every other
claim in the library is suspect. The gate exists because the gate
once failed.

**When the canon and a deadline disagree, the canon wins.** A post
ships late, or it ships short, or it doesn't ship — it does not ship
with a number that is not real.

### Pattern A — Registered in `data/sourced-claims.json`

For any claim cited in more than one post, or any claim that may be
re-verified later. Add an entry with: `claim`, `source_url`,
`source_name`, `date_verified`, `used_in` (slugs), `notes`.

### Pattern B — Inline `<details class="cite">` drawer

For one-off citations. Drop the drawer directly under the figure that
shows the data. Format:

```html
<details class="cite">
  <summary>Source: Source Name, publish date</summary>
  <div class="cite-body">
    <p><span class="cite-source">Source Name</span> &mdash;
       "Article title or document name" (publication, date).
       What the source says, in one sentence.</p>
  </div>
</details>
```

### Pattern C — Labeled illustrative

For ranges, scenario walkthroughs, operator-experience framings:

  - Directional language: *"rising, not flat"*, *"single-digit dip"*, *"the low double digits"*.
  - The figcaption of any chart says so explicitly if the bars are
    directional, not measured.
  - The dek sets expectations: *"Numbers are illustrative ranges
    anchored to [source]."*

### What is blocked at publish

`scripts/check-fabrications.mjs` blocks these patterns. They are not
allowed in a blog post under any framing:

  - Invented operator-economics dollar amounts ("$4,000 incremental margin").
  - Invented cohort sizes followed by percentage distributions
    ("100-restaurant DMV cohort, four-cause distribution: 40/30/15/15").
  - Named datasets that do not exist ("90 days of paired queries").
  - Bio claims about restaurants Don does not currently run.

**When in doubt, cut.** A clean post with one verified figure beats a
confident post with three invented ones.

---

## 7. The graphics rule

Two graphics is the floor. Three is the rhythm. They must use the
existing `viz-*` patterns from `assets/site-article.css`:

| Pattern | When to use | Existing example |
| --- | --- | --- |
| `.viz-bars` | Comparing 2-5 numbers on a single axis (shares, percentages, time series). Use `viz-bars__mark` (`--x`: 0..1) for a benchmark tick inside a track and `viz-bars__note` for a full-width takeaway row inside the figure; never ship a zero-width bar as a stand-in for "no data" | Gemini referral share, AI Overview share over time |
| `.viz-flow` | Stepwise process or hub-and-spoke convergence | "One profile, four surfaces" |
| `.viz-ba` | Before/after rewrite, before/after measurement | The citation-rewrite paragraph in `how-to-get-cited` |
| `.viz-tree` | Decision tree, diagnostic walk | "Citation problem or ranking problem?" |
| `.viz-waterfall` | Single-bar segmented by margin loss or cost stack | Delivery-platform margin walk |
| `.viz-ring` / `.viz-rings` | Composition of a whole, when bars would crowd | Profile completeness rings |

### Required for every graphic

  - Wrapped in `<figure class="viz-figure article-figure">`.
  - `data-audio-alt` attribute on the figure — a complete narration in
    plain English, suitable for blind readers and audio listeners. This
    is not alt text; it is a full description that reads aloud as part
    of the audio narration.
  - `<figcaption>` — one sentence naming the takeaway, not the
    contents. Italics. Stone color.
  - Citation drawer (`<details class="cite">`) directly below if the
    data is sourced.

### When NOT to use a graphic

  - When the data is one number. Put it in a sentence.
  - When the graphic is decorative. Cut it.
  - When the figcaption restates the bars. The figcaption is the
    takeaway, not a caption-of-the-caption.

---

## 8. The required boilerplate blocks

Every blog post carries these blocks. They are not optional. Each one
serves a downstream surface (RSS, LLM feed, search snippet,
recirculation).

| Block | Purpose | Length |
| --- | --- | --- |
| `<aside class="tldr">` (top) | Search snippet, share preview, scanner read | 3-5 bullets, ≤25 words each |
| `<aside class="key-takeaways">` (bottom) | LLM feed, audio recap, second-scan read | 4-6 bullets, ≤30 words each |
| `<aside class="smart-next">` | Recirculation to a glossary term + a tool + the Window | One link each, in that order |
| `<aside class="post-end-cta">` | The audit ad. **One per post. Same copy block.** | Pre-written; do not rewrite per post |
| `article-abstract-mentions` JSON-LD | Glossary anchoring for the AI Overview | One `DefinedTerm` per linked glossary URL |
| `article-howto` JSON-LD | Only for posts with ordered, repeatable steps | 3-7 steps |

The blog index card and the sitemap entry are added in the same commit
that publishes the post — see `blog/drafts/README.md` for the
release-day checklist.

---

## 9. The actionable-example rule

Each post carries **two to three specific, named, operator-shaped
examples** that demonstrate the move the post is arguing for.

  - Not "a restaurant might". A named restaurant, a named city, a
    named platform, a named number. Real or composited from operator
    practice (and labeled as such — see Pattern C above).
  - Not a hypothetical workflow. A specific Tuesday-morning thing the
    operator can do this week.
  - Not "best practices". A move, and what happens if you don't make it.

Examples already in the catalog, as the template:

  - The before/after paragraph rewrite in `how-to-get-cited-in-google-ai-overviews-restaurant`.
  - "Open Roma Cucina on Sunday" question-shape from the same post.
  - The four-number visibility check in `how-to-appear-in-ai-search-restaurant-2026`.

---

## 10. Length, cadence, and the CTA

  - **Length:** **2,800-word floor. No exceptions.** Existing posts in
    the catalog run 2,800-4,300 words (`30-days-after-leaving-doordash`
    at 4,197; `may-2026-discovery-changed-under-you` at 4,349;
    `ai-local-pack-restaurant-phone-calls-2026` at 3,014). A post below
    2,800 either has more to say and hasn't said it yet, or belongs in
    the Library Letter as a note. There is no shorter blog post.
  - **Density:** the 2,800 words must carry weight. If a paragraph can
    be cut without losing a fact, a move, or a moment of reader
    acknowledgment, cut it. Padding to hit a word count is the surest
    way to break the warmth rule in §2 — readers feel filler in the
    second sentence.
  - **Cadence:** weekly batch, Sunday night through Monday morning.
    Compressed cadence for a new domain — content volume beats
    drip-spacing because Google needs crawlable surfaces to build
    freshness signals (see `blog/drafts/README.md`).
  - **CTA:** every post ends with the same `post-end-cta` audit ad.
    The smart-next aside above it is the recirculation; the
    post-end-cta is the conversion. **Do not invent post-specific
    CTAs.** Consistency across the blog earns trust faster than
    cleverness on any single post.

The CTA canon (one verb, one job, locked in both languages) lives in
`/methods/#voice-contract`:

  - "Run my free audit" / "Audita mi sitio gratis" — the audit tool.
  - "Email Don" / "Escríbele a Don" — the open inbox.
  - "Book a 20-min call" / "Reservar una llamada de 20 min" — the calendar.

Pick one per post-end-cta. Default is "Run my free audit" unless the
post is specifically about something the audit can't measure.

---

## 11. Localization (ES + 5)

Every blog post ships with:

  - A Spanish translation at `/es/blog/<es-slug>/`, linked via
    `hreflang` (see `scripts/stamp-hreflang.mjs`).
  - Audio narration in **six languages**: English, Spanish, French,
    Italian, Portuguese, Mandarin. The listen button at the top of the
    post surfaces the language picker.

The translation rule from `voice-canon-sheets.md` applies here too:

> Translate the framework. Recast the rhythm.

Specifically: Spanish allows shorter clauses than English makes
natural. Don't write *"un diario de feelings"*. Write *"un diario de
sentimientos"* — same image, native cadence.

Platform names stay in English (Google Business Profile, DoorDash,
OpenTable). Function names translate (commission, prime cost).
Restaurant-floor terms translate to the local working register, not the
dictionary.

The release-day checklist does not publish a post until the audio
renders for all six languages are at `status=rendered` in
`data/article-audio.json`.

---

## 12. The In/Out quick reference

| In voice (Muntin blog) | Out of voice |
| --- | --- |
| *"You're not crazy. The phone really has stopped ringing."* (warm, specific, no marketing) | *"Many restaurant owners are feeling overwhelmed in today's fast-paced digital landscape."* |
| *"Inside four days, Google rebuilt AI Mode."* | *"In the dynamic world of search, change is the only constant."* |
| *"Restaurant Maps views are down 40.1%, even when your ranking didn't move."* | *"Engagement metrics are seeing significant shifts."* |
| *"83% of restaurants are invisible in AI search — and yes, that probably includes yours."* | *"Many restaurants face visibility challenges in the AI era."* |
| *"Wire OpenTable, Resy, or Tock. Pick one. Don't pick all three."* | *"Leverage a third-party reservation solution to optimize your guest journey."* |
| *"I was reading the I/O recap on the train back from Bethesda."* | *"As industry experts, we couldn't help but notice the trends emerging."* |
| Em-dash for one mid-sentence aside, no more | Em-dashes scattered across every paragraph |
| H2: "What it's costing you" | H2: "The Hidden Costs You Need to Know About" |
| Numbers in the lede sentence of every H2 | Welcome paragraph that sets up the answer two paragraphs later |
| One source per claim, drawer right under the figure | A "References" section at the bottom that nobody reads |
| *"Most operators I know are further along than they think."* (warmth = acknowledgment) | *"Don't worry, you've got this!"* (warmth = chirp) |

---

## 13. The ship test

Before any draft moves from `blog/drafts/<slug>/` to `blog/<slug>/`,
read it through this checklist out loud. Every line is a hard gate.

### Voice

  - [ ] First-person Don. No "we." No brand-as-speaker.
  - [ ] No banned words (run a find for the methods.html list).
  - [ ] No hedge tokens (run a find for: *approximately, usually, in some cases, most, often, typically, around, tend to, may, can, might*).
  - [ ] No exclamation marks. No emoji. No rhetorical-question H2s.
  - [ ] Every operator noun is a real one (the line, expo, the host stand, the close).

### Warmth (the §2 check)

  - [ ] At least one moment of direct reader acknowledgment in the first
    300 words ("you're not crazy," "if you've been watching X,"
    "you've probably already noticed Y").
  - [ ] At least one moment that names what the reader is **already
    doing right** before naming what they're missing.
  - [ ] Direct address (*you, your*) used naturally, not sprinkled for
    SEO. Count the *yous* — under twenty in a 2,800-word post is the
    healthy band; over forty is a sales letter, not a blog post.
  - [ ] No *"hey friend,"* no *"I get it,"* no winking, no chumminess.
    The voice is the trusted regular at the bar, not the host trying
    too hard.

### Facts (the absolute gate)

  - [ ] **Zero inventions.** Every number, date, name, anecdote,
    percentage, study cite, and quote is real and verifiable. If it
    isn't, it isn't in the post.
  - [ ] Every number has a source — registered in
    `data/sourced-claims.json`, inline-cited in `<details class="cite">`,
    or labeled illustrative in the prose.
  - [ ] `scripts/check-fabrications.mjs` passes.
  - [ ] The current-bio rule holds (no claims about restaurants Don
    doesn't currently run; past roles must match
    `data/sourced-claims.json#operator_experience_claims.past_roles`).
  - [ ] Every linked claim in `data/sourced-claims.json` has the post's
    slug in `used_in`.
  - [ ] Every operator anecdote names a real moment (date, place,
    detail) or is labeled illustrative. *"A restaurant I worked with"*
    is not acceptable unless that restaurant exists and the moment
    happened. **When in doubt, cut.**

### Structure

  - [ ] H1 names the event in ≤12 words; serif italic for the verb.
  - [ ] Dek ≤55 words, primary keyword in first 100 words.
  - [ ] TLDR aside present, 3-5 bullets, each ≤25 words.
  - [ ] Key takeaways aside present, 4-6 bullets, each ≤30 words.
  - [ ] Smart-next aside: Read / Try / Or send Don a note.
  - [ ] Post-end-cta present, canonical copy unchanged.
  - [ ] Article + AudioObject + BreadcrumbList JSON-LD all present.
  - [ ] If stepwise: HowTo JSON-LD with `step.url` anchors matching H2 ids.

### Graphics

  - [ ] ≥2 graphics, using existing viz-* patterns.
  - [ ] Every figure has `data-audio-alt` written as a full narration.
  - [ ] Every figure has a figcaption naming the takeaway (not the data).
  - [ ] If the data is sourced, a `<details class="cite">` drawer sits directly below.

### SEO

  - [ ] Primary keyword in title, description, H1, dek, ≥1 body paragraph.
  - [ ] Secondary keyword in ≥2 H2 headers.
  - [ ] Topic-anchor keyword in intro + ≥1 body paragraph.
  - [ ] Slug is kebab-case, ≤7 words, includes the primary keyword's noun.
  - [ ] Canonical URL baked in. Hreflang en + es minimum.

### Viewport

  - [ ] Renders at 360px without horizontal scroll (test in DevTools).
  - [ ] H1 wraps cleanly at 320, 375, 414, 768, 1024, 1440.
  - [ ] All viz-* graphics legible at 360px wide.
  - [ ] Listen button has tap target ≥44px.

### Localization

  - [ ] ES translation drafted at `/es/blog/<es-slug>/`.
  - [ ] Audio renders for en, es, fr, it, pt, zh at `status=rendered`.
  - [ ] Hreflang baked, `og:locale:alternate` set.

### Release

  - [ ] Post card added to `/blog/index.html` (newest first).
  - [ ] Sitemap entry added with `<changefreq>yearly</changefreq>`, `<priority>0.85</priority>`.
  - [ ] `noindex,nofollow` meta tag removed.
  - [ ] Commit message follows pattern: `Publish: [post title]`.

The post does not ship until every box is checked. If it can't pass,
it isn't a Muntin post yet — it's a draft.

---

## 14. The aloud test (the only one that matters)

Read the post aloud to yourself. Then ask three questions, in order.
A post has to pass all three. Failing any one of them means the post
is not Muntin yet.

> **1. Would Don's chef-friend with twenty years on the line read this
> and feel respected, or talked down to?**

If "respected," continue. If "talked down to," cut the celebratory
adjective and try again. If anywhere in between — even halfway —
delete the line and let the operator's experience do the work.

> **2. Would that same chef-friend read this and feel seen — like the
> writer knows the specific Tuesday-morning thing they have been
> quietly worrying about?**

If yes, continue. If no, find the one sentence in the post where the
reader's actual day shows up and make sure it lands in the first 300
words. The reader has to recognize themselves on the page.

> **3. Is every specific claim in this post real, verifiable, and
> sourced — including the operator anecdotes?**

If yes, ship it. If anything is invented, fabricated, or "directional
but probably accurate," **cut it**. There is no version of "almost
real" that survives in this canon. The post ships clean or it doesn't
ship.

---

## What this canon does NOT cover

  - The library (`/library/<slug>/`) — evergreen, longer, no event peg. Library voice inherits §3 but rewrites §1, §4, §5, §10.
  - Sheets (`/sheets/<slug>/`) — `voice-canon-sheets.md`.
  - Glossary terms (`/glossary/<term>/`) — third-person reference voice (see `/methods/#voice-contract` POV table).
  - Tools (`/tools/<slug>/`) — second-person operator voice.
  - Visual treatment (Muntin brand canon: tokens, type, status palette).
  - The release-day mechanics (see `blog/drafts/README.md`).
  - The fact-check enforcement script (`scripts/check-fabrications.mjs`).

This file covers prose that an operator reads, on the blog, when
something has changed in the world and they want the operator's read.
Everything else is elsewhere.
