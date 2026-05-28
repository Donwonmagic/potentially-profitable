# Voice canon — Blog dispatches

This is the authoritative voice reference for any prose that ships at
`/blog/<slug>/` — the article body, the dek, the TLDR, the H2s and
H3s, the figcaptions, the citation drawers, the JSON-LD `description`
and `headline`, the OG description, the LLM feeds (`llms.txt`,
`feed-llm.json`), and the audio narration scripts.

If you are reviewing a PR that touches any of those surfaces under
`/blog/`, this file is the spec. The methods voice contract at
[`/methods/#voice-contract`](../methods/index.html) governs the whole
site; this document restates that contract in the blog's register and
adds the rules that are specific to dispatches.

## What this canon does NOT cover

- The library (`/library/`) — sibling reference, see `docs/voice-canon-library.md`.
- Operator sheets (`/sheets/`) — sibling reference, see `docs/voice-canon-sheets.md`.
- Glossary terms (`/glossary/`) — third-person reference voice. See `/methods/#voice-contract` POV table.
- Tool pages (`/tools/`) — second-person operator voice. See `/methods/#voice-contract` POV table.
- Visual treatment (tokens, type, status palette) — covered by the Muntin brand canon.
- Release-day mechanics — see [§14](#14-release-flow) below, which extends `blog/drafts/README.md`.

## 1. The blog vs. the library — the load-bearing distinction

The blog is dispatches. The library is reference. Read the same
operator a year apart:

| | Blog (`/blog/`) | Library (`/library/`) |
|---|---|---|
| Window | What changed this week | What is true regardless of week |
| Half-life | Weeks to months | 18+ months |
| Anchor | A date, an event, an I/O keynote, a study release | A mechanism, a decision, a repeated operator question |
| Time in the prose | "Inside four days, Google rebuilt AI Mode…" | "The model reads the prose, then reads the schema, then asks itself if they match…" |
| Headline | Names the event ("Discovery changed under you this spring") | Names the question or the move ("How to get cited in Google's AI Overviews") |
| Address | Direct to the reader; more *you*, more *your* | More the operator, the page, the model — subjects are the mechanism, not the person |
| Warmth move | Acknowledge the reader's specific Tuesday-morning worry | Earn trust by explaining the mechanism cleanly so the reader can do it themselves next time |
| Reading mode | Read once, act this week | Bookmark, return to, send to a chef-friend six months later |
| Updates | Stamp `dateModified`, do not retitle. Write a new dispatch when stale. | Living document. Rewrite in place. Bump `dateModified`. |

Same Don, different room. The blog is *"I just read the I/O recap on
the train back from Bethesda."* The library is *"the AI Overview
extractor walks the page in this order, and here is why your paragraph
either gets quoted or doesn't."*

## 2. The reader

Same operator the library reads to. Different moment.

The library reader is **planning**, **troubleshooting**, or
**referencing** — they came with a specific evergreen question. The
blog reader is **reacting**. Something happened this week — a Google
update, a delivery-platform fee change, a study release, an I/O
keynote — and they want to know what to do about it Monday morning.
They may have heard the headline already; they want the operator's
read.

That reader has run a kitchen, a host stand, or a back office for
years. They are scanning between covers, between line checks,
between the morning meeting and the produce reorder. They do not
have time for a 4,000-word setup before the practical move. They
came for the move.

## 3. The byline and the voice register

**Byline.** Blog dispatches ship under **Don Goldstein** — first
name, last name, full first-person. The library shifted to *The
Muntin Desk* in 2026; the blog kept the Don byline because the
register is different. A dispatch is a person reading their inbox
and pulling out what mattered, then writing it up for an operator
who will see the same news in a different shape on LinkedIn or in
Search Engine Land. The voice is the human reading the news first.

**The I-rule (blog version).** *"I"* is the narrator's seat on a
blog post. Don is the one who read the I/O recap, the one who
checked the Search Status Dashboard, the one who ran the math on
the BrightEdge readout. The "I" appears as event-narrator (*"I
sat down on Tuesday and ran the same four queries…"*), as
operator-practice (*"I've watched this same leak come back in
every audit this spring"*), and as register-marker (*"I think
the cleanest move is…"* — but used sparingly, since opinion is
implied by the byline).

A blog post can — and most should — open with an "I" sentence
that situates the dispatch in a specific moment. That moment is
the post's anchor; without it, the dispatch reads like a library
piece in the wrong room.

  - **In:** *"I sat down on Tuesday morning and typed the four queries
    a Silver Spring diner would type at six p.m."* — narrator-of-event,
    earns the dispatch frame.
  - **In:** *"I've watched this leak come back in every audit this
    spring."* — operator practice, names the pattern.
  - **In:** *"I think the cleanest move is to ship the schema this
    weekend."* — opinion, used once per piece at most.
  - **Out:** *"The extractor walks the page in subject-predicate-object
    shape."* — that's library voice; rewrite as *"I watched the
    extractor walk the page in this order…"* or move the line to a
    library piece.

**The register.** The blog's warmth move is **acknowledgement** — the
reader's specific Tuesday-morning worry, named. The library's
warmth move is clarity; the blog's warmth move is recognition.
Operators read a Don dispatch because Don reacted to the news
the same way they did, then went one step further and worked out
what to do.

That register means: subjects can be people, dates, calendar
moments. *I read.* *Google rolled out.* *The week of May 19 was
not most weeks.* *Inside four days, Google rebuilt AI Mode.*
Calendar-time is allowed and often load-bearing. The dispatch is
a snapshot; the date stamp is part of the value.

## 4. The eight rules

Restated from `/methods/#voice-contract` in the blog's register.
Five rules carry over verbatim; three are sharper here than on the
library. The methods contract governs where there is conflict.

### 1. Numbers first. Stories second. Adjectives last.

Same as the methods rule. On a blog dispatch, numbers must be either
(a) registered in `data/sourced-claims.json`, (b) cited inline via
`<details class="cite">`, or (c) labeled illustrative. See [§7](#7-the-fact-check-gate).
The dispatch's date stamp does not exempt the figures from sourcing.

  - **In:** *"Gemini's AI-referral share tripled in one quarter: 4.3% in January to 13.2% in April."*
  - **Out:** *"AI referral traffic exploded this quarter."*

### 2. Calendar-time, not mechanism-time.

This is the blog's version of the library's "mechanism-time" rule —
inverted. Time anchors are calendar moments, not how the
mechanism walks. The date is part of the news.

  - **In:** *"The week of May 19, 2026 was not most weeks. Inside four days, Google rebuilt AI Mode on stage, started its second core update of the year, and BrightEdge confirmed Gemini at 13.2% of AI referrals."*
  - **In:** *"The May 21 core update began rolling out Wednesday morning; the dashboard says up to two weeks to complete."*
  - **Out:** *"The crawler revisits cited URLs faster than uncited ones."* — that's library voice; rewrite the dispatch around the specific re-crawl event you watched.

### 3. Name the cause, not the symptom.

Carries over from the sheets canon. On a dispatch, the cause is
usually a specific event the reader can verify themselves.

  - **In:** *"The traffic drop is the core update reweighting under the AI Overview, not your content going stale. Search Console will show it inside 72 hours."*
  - **Out:** *"You might see some traffic changes."*

### 4. Operator nouns. Never SaaS nouns.

The produce reorder · the kitchen lead · expo · the back door · the
bar walk-in · the line · the host stand · the close · the deuce ·
covers · the open · the cut.

Never: stakeholders · workflow · users · onboarding · synergies ·
journey · ecosystem · partner up · loop in · circle back · deep-dive ·
low-hanging fruit · move the needle.

The banned-words list at `/methods/#voice-contract` is binding on
the blog too.

### 5. Direct address (`you`, `your`) is the default subject.

This is sharper on the blog than on the library. The dispatch is
written *to* an operator about something that just changed *for*
them. The reader is in the room.

  - **In:** *"Your map pack ranking did not move. Your AI Overview ranking did, and the surface is new."*
  - **In:** *"If you are on Toast, the integration is already live; if you are on Square, the connector ships in late June."*
  - **Out:** *"Operators on Toast see the integration live."* — that's library voice; rewrite as direct address.

### 6. Ranges, not vibes.

Same as the sheets canon. When a range exists, cite it. Never *"a
small percentage,"* *"some operators,"* *"often,"* *"in many
cases."* The dispatch's recency does not earn it the right to
hedge.

### 7. Past tense for what just happened. Present for what is true. No future tense for guarantees.

This carries over from sheets verbatim. Blog dispatches lean on
past tense more than library reference does, because the event
that anchors the dispatch is in the past.

  - **In:** *"Google rolled out the core update Wednesday morning."*
  - **In:** *"The May 19 keynote announced agentic restaurant booking through OpenTable, Resy, and Tock."*
  - **Out:** *"Your bookings will rise once you add schema."* — no future-tense guarantee, on the blog or anywhere else.

### 8. End on a noun, not a verb.

Same as the methods rule. *The dispatch.* *The week.* *The move.*
*The cut.* The blog's cadence depends on it as much as the
library's does.

## 5. The structural skeleton

Blog dispatches ship the same required boilerplate as library posts.
The difference is in what the elements do, not which elements are
present.

**Required, in this order:**

1. **JSON-LD `@graph`** — `Article`, `AudioObject`, `BreadcrumbList`. Optional `HowTo` when the body is genuinely step-shaped (most dispatches are not).
2. **`<header>` block** containing: eyebrow line (`The batch · May 23, 2026 · N min read · By Don Goldstein` or `Op-ed · May 23, 2026 · N min read · By Don Goldstein`), `<h1>` naming the event, listen button, dek paragraph that opens with the news in one sentence.
3. **`<aside class="tldr">`** — three to five bullets, each a complete sentence. The TLDR is what an LLM lifts and what a busy reader scans first.
4. **Body** — H2s walk the dispatch's argument in time order (what happened, what it means, what to do, what to watch next). Each H2 has an `id`. First paragraph below each H2 stands alone as a complete answer in ≤45 words — the citation-extractor rule from the library applies here too.
5. **Two graphics minimum** — see [§8](#8-the-graphics-rule).
6. **`<details class="cite">` drawer** below any sourced figure.
7. **`<aside class="key-takeaways">`** — the "key takeaways" block, blog-specific, summarizes the operator's three moves out of the dispatch. (Library posts use the TLDR for this; blog posts carry both.)
8. **`<aside class="post-end-cta">`** — the Workshop-or-Window next step, per the CTA canon at `/methods/#voice-contract`.
9. **`<aside class="smart-next">`** — three links: a glossary term, a tool, the Window. Verbs locked: *Read · Try · Or send Don a note.*

**H1 patterns.**

- Names the event: *"Discovery changed under you this spring. Five pieces, one thesis."*
- Names the dispatch's argument: *"The May 2026 wave: nine pieces, one operating thesis."*
- Names the new traffic source or surface: *"Gemini just passed Perplexity. What that does to your front door."*

Never a foundational question (that's a library H1). Always
anchored to a specific moment, even when the moment is "this
quarter" or "this spring."

**H2 patterns.**

- Names the event sequence ("The three shifts happened at once").
- Names the operator's question about the event ("What 'legibility' and 'bookability' actually mean operationally").
- Names the action ("What to do this week").

H2s carry IDs so the smart-next blocks, the LLM feeds, and the
batch-overview cross-references all link cleanly.

**Confirmation reading.** Two existing dispatches that already ship
this skeleton clean: `blog/may-2026-discovery-changed-under-you/`
(batch overview) and `blog/30-days-after-leaving-doordash-restaurant-case-study/`
(single-piece op-ed). Read both before drafting a new dispatch.

## 6. SEO discipline

Blog wins **timely, news-peg queries**, not foundational evergreen.
The library wins "restaurant schema markup" and "toast vs square vs
clover" forever. The blog wins "google may 2026 core update
restaurant," "gemini ai referral traffic restaurants," "ai mode
restaurant booking" for the weeks the news matters.

Three keywords per dispatch, picked **before** writing.
Specify their surface placement up front:

- **Title tag** — primary keyword, full phrase, ≤60 chars rendered. Include a year stamp only when the news genuinely changes year-over-year and the reader is searching with the year.
- **Meta description** — primary keyword once, secondary once, written for the click, ≤155 chars rendered.
- **H1** — primary keyword as natural English; the dispatch can carry the date in the eyebrow rather than the H1 to keep the headline readable.
- **Two or more H2s** — secondary keywords as natural section headers.
- **First paragraph** — primary keyword in the first 100 words, in the operator's natural register.

**Slug rule.** Blog slugs may include a date prefix when the
dispatch is genuinely tied to a calendar moment (`may-2026-discovery-changed-under-you`),
or may be content-only when the piece is closer to op-ed than to
news (`30-days-after-leaving-doordash-restaurant-case-study`). The
slug is final-forever once published; if the news goes stale,
write a new dispatch — do not retitle and move the old one.

**Recency signals.** The blog earns its Google freshness with
`datePublished` + `dateModified` in JSON-LD; both stamp at the
moment of publication and `dateModified` bumps only when the body
is substantively revised (typo fixes do not bump). The hub at
`/blog/` lists posts in reverse-chronological order; the wave-toc
block at the foot of each batch overview cross-links the pieces in
order.

## 7. The fact-check gate

**Zero inventions. No exceptions.** This rule is absolute and is
restated here in the strongest available language because the May
2026 editorial review caught widespread fabricated operator data
across the May-2026 wave. The publishing pipeline now has a gate
(`scripts/check-fabrications.mjs`); this document, `docs/fact-check.md`,
and `data/sourced-claims.json` together are the editorial side of
that gate.

Every number, date, name, anecdote, restaurant, cohort, percentage,
and dollar figure on a blog dispatch must fit one of three patterns:

1. **Registered** in `data/sourced-claims.json` with `source_url`, `source_name`, and `date_verified`. The article cites the claim in prose; the registry is the system-of-record.
2. **Cited inline** via `<details class="cite">…</details>` immediately below the figure, naming the source by name, with the date or version of the source.
3. **Labeled illustrative** in the prose, the figcaption, and the dek. Use directional language ("rising, not flat" / "in the low double digits" / "single-digit dip"). The dek must say so when the entire piece is illustrative: *"This is a playbook, not a case study; numbers are illustrative ranges anchored to [source]."*

There is no fourth pattern.

**The bio is singular.** The current operator bio is: *Don
Goldstein, full-time Front-of-House Manager at Tacombi in
Bethesda.* Past roles live in `/about/#timeline` and in
`data/sourced-claims.json#operator_experience_claims.past_roles`.
Phrases that frame Don as currently managing more than one
restaurant are blocked by `scripts/check-fabrications.mjs` and
must not appear in any blog prose, audio script, or feed.

**The dispatch is in a hurry; the fact-check is not.** When the
canon and a deadline disagree, the canon wins. A clean dispatch
with one verified figure beats a confident dispatch with three
invented ones. The reader's trust is the only asset the blog has;
once one invented claim is caught, every other claim is suspect
too.

## 8. The graphics rule

**Minimum two graphics per dispatch.** A dispatch earns trust
faster when the news is visible.

Use only the existing `viz-*` patterns from `assets/site-article.css`.
Each viz family carries a defined job:

- **`viz-bars`** — measured share, before/after on a single metric, comparative ranking. **The blog leans here**, because dispatches usually anchor on a measured event.
- **`viz-flow`** — sequences (the order three announcements landed, the order an agent walks a booking flow). The blog uses this for the *"what just happened"* narrative.
- **`viz-tree`** — decision diagnostics. Used on the blog when the dispatch carries an operator's *"so what do I do"* branch.
- **`viz-ba`** — before/after; used on the blog when the dispatch shows a specific rewrite or a specific profile change.
- **`viz-ring`** — composition or share-of-whole.
- **`viz-waterfall`** — cost stacks, margin walks.

Every figure carries:

- **`data-audio-alt`** — full narration of what the figure shows, written as the audio script will read it.
- **`<figcaption>`** — names the takeaway in one sentence. Not what the figure is; what the figure says.
- **`<details class="cite">`** drawer immediately below — if the data is sourced.

Decorative graphics do not count toward the two-graphic floor.

## 9. Length

**2,800-word floor. No exceptions.**

The blog catalog already runs in this range; new dispatches must
too. The 2,800-word floor is not a target — it is the minimum that
lets the dispatch carry the news, the operator's read on it, and
the move, with sourcing.

**Density rule.** Every paragraph carries a fact, a mechanism, or
a move. Cut what doesn't. A paragraph that restates the H2 above
it is filler; a paragraph that softens the news with hedging is
filler; a paragraph that opens *"of course, every restaurant is
different…"* is filler. Cut all three.

**Why the floor.** Dispatches that come in under 2,800 words read
as Twitter takes in essay clothing. The reader who came back to
the blog after a Search Engine Land headline expects depth that
the headline did not provide — that is the value the blog adds.
Under 2,800 words, that value evaporates.

## 10. Localization

**Every dispatch ships with a Spanish translation** at
`/es/blog/<es-slug>/`, linked via `hreflang` in both directions,
plus audio narration in `en/es/fr/it/pt/zh` at `status: rendered`
in `data/article-audio.json`. **Release does not happen** until the
six-language audio renders complete and the ES translation is on
disk.

The ES rule from the sheets canon carries: **translate the
framework, recast the rhythm.** Spanish allows shorter clauses
than the literal translation makes natural. Cut connector words
rather than expand. Use `usted/tú`-neutral phrasing.

**Platform names** (Google Business Profile, DoorDash, OpenTable,
Toast, Square) stay in English. **Function names** (commission,
prime cost, core update, citation) translate to the operator's
working register. **Event names** (Google I/O, the May 2026 core
update) translate the descriptor (*"el update central de mayo de
2026"*) and keep the proper noun (*Google I/O*).

The audio scripts are read aloud verbatim, in all six languages.
They must clear the fact-check gate in every language; a
fabrication that slipped past the EN draft will be caught when the
FR or ZH script reads it back.

## 11. In/Out — the quick reference

The cleanest mental model: would this line land on the blog, in
the library, or on a generic SEO template?

| In voice (blog) | Out (library voice) | Out (SEO template) |
|---|---|---|
| *"I sat down on Tuesday and watched the extractor walk the page."* | *"The extractor walks the page in subject-predicate-object shape."* | *"Modern AI systems are revolutionizing how content is discovered."* |
| *"Inside four days, Google rebuilt AI Mode."* | *"AI Mode resolves the local query as a composed answer."* | *"Google continues to innovate in AI-powered search."* |
| *"Your map pack ranking did not move. Your AI Overview ranking did."* | *"Map-pack ranking and AI-Overview citation are different jobs."* | *"There are many factors that affect your search rankings."* |
| *"The May 21 core update began rolling out Wednesday morning; the dashboard says up to two weeks to complete."* | *"Google rolls out a small number of core updates each year; the dashboard documents each one."* | *"Google regularly updates its search algorithm."* |
| *"I've watched the same three reservation leaks come back in every audit this spring."* | *"Three reservation leaks come back across every audit: the menu PDF, the OpenTable redirect, and the mobile keyboard."* | *"Restaurants face common conversion challenges."* |
| *"If you are on Toast, the integration is already live; if you are on Square, the connector ships in late June."* | *"Toast's integration is in the agent's allowlist; Square's is not yet."* | *"Check with your POS provider for the latest integration status."* |
| *"I think the cleanest move is to ship the schema this weekend."* | *"Shipping the schema is the cleanest move."* | *"It is recommended that you update your structured data regularly."* |

The library column is not wrong on the library; it is wrong on the
blog. The SEO template column is wrong everywhere.

## 12. The ship test

A blog dispatch is ready to ship when **all** of these are true.
Any "no" sends it back to the desk.

**Hard requirements (gated by automation; build fails on a `no`).**

- [ ] `scripts/check-fabrications.mjs --check` exits 0 on this file.
- [ ] `scripts/inject-site-counts.mjs --check` exits 0.
- [ ] JSON-LD validates: `Article` + `AudioObject` + `BreadcrumbList`, plus `HowTo` if step-shaped.
- [ ] `hreflang` pair (EN ↔ ES) is stamped and points to live URLs.
- [ ] Audio render status in `data/article-audio.json` is `rendered` for all six languages.
- [ ] Word count ≥2,800 on the EN body (rendered, not source).
- [ ] At least two `viz-figure` blocks, each with `data-audio-alt` and `<figcaption>`.
- [ ] Every sourced number has a `data/sourced-claims.json` entry, a `<details class="cite">` drawer, or an illustrative-range label in the prose and figcaption.

**Editorial requirements (human judgement).**

- [ ] H1 names the event, the dispatch's argument, or the new surface — not a foundational question.
- [ ] Eyebrow carries the date stamp (`The batch · May 23, 2026 · N min read · By Don Goldstein`).
- [ ] First paragraph below each H2 is a ≤45-word complete answer.
- [ ] Byline reads *Don Goldstein* and links to `/about/#don-goldstein`.
- [ ] *"I"* appears as event-narrator, operator-practice, or register-marker — never as filler.
- [ ] Three keywords are placed in title, description, H1, ≥2 H2s, and the first paragraph.
- [ ] Banned-word audit clean (run a grep against the methods.html banned list).
- [ ] No future-tense guarantees. No exclamation marks. No rhetorical-question headlines. No emoji.
- [ ] Smart-next block uses the locked verbs (*Read · Try · Or send Don a note*).
- [ ] Post-end-cta uses a verb from the CTA canon at `/methods/#voice-contract`.

**Warmth check (the blog's warmth move).** Read the body to an
operator whose week was disrupted by the same news. They feel
recognized — the dispatch named the specific worry they had on
Tuesday morning, and the move on the other side is one they can
make this week. If they feel lectured at, the dispatch is not
ready.

## 13. The aloud test

Read the dispatch aloud to yourself. Then ask:

1. *Would Don's chef-friend with twenty years on the line read this and feel respected, or talked down to?*
2. *Would that same chef-friend finish this dispatch knowing what to do this week — not next quarter, not when the next thing changes, this week?*
3. *Is every specific claim real, verifiable, and sourced — including the date stamps, the company names, and the operator anecdotes? Could the registry, the citation drawer, or the prose label support every single number on this page?*

If the answer to **(1)** is anything other than "respected," cut
the celebratory adjective and try again. If the answer to **(2)**
is "not quite," the move is missing; rewrite the closing H2. If the
answer to **(3)** is anything other than an unqualified yes, the
dispatch does not ship until it is.

## 14. Release flow

Blog release follows the drafts pattern at `blog/drafts/README.md`.
The summary, with the editorial layer this canon adds:

1. **Draft** in `blog/drafts/<final-slug>/index.html` with `<meta name="robots" content="noindex,nofollow">` in the head and the final canonical URL already baked in. The draft sits in the deployed repo, hidden from search.
2. **Copy review** against this canon. The ship-test checklist in [§12](#12-the-ship-test) is the gate.
3. **Translate** to `es/blog/drafts/<es-slug>/index.html` and render audio in all six languages; both must complete before release.
4. **Release day** — `git mv` from drafts to the live path, remove the `noindex` tag, add the post card to `blog/index.html`, add the URL to `sitemap.xml`, commit and push.
5. **Cross-link** — when the dispatch is part of a batch (a `wave-toc` block), update the sibling pieces' wave-toc blocks to include the new piece in order.

The release-day checklist at `blog/drafts/README.md` is the
mechanical sequence; this canon is the editorial gate that runs
before it.

**When a dispatch goes stale.** Do not retitle and do not move the
slug. Write a new dispatch that responds to the new news, and cross-link
the older piece as the prior moment. The blog earns its archive
value when an operator can scroll back through the dispatches and
see how the picture changed week by week; rewritten dispatches
break that record.

**When a dispatch is wrong.** Bump `dateModified`, add a correction
note at the top of the body in a `<aside class="correction">`
block, and surface the correction in `/changelog/`. The post stays
at its original URL; readers who deep-linked the old version see
the correction at the top of the page.

## Open editorial decisions

One item to flag — the sibling library canon was drafted first, in
the same branch, and assumes this document exists as the sibling.
If the §1 table here ever drifts from the version in
`docs/voice-canon-library.md`, the two should be reconciled in a
single PR; both rows describe the same load-bearing distinction
and either side drifting is a sign the line moved without the
other room noticing.
