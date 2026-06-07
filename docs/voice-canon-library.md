# Voice canon — Library articles

This is the authoritative voice reference for any prose that ships at
`/library/<slug>/` — the article body, the dek, the TLDR, the H2s and
H3s, the figcaptions, the citation drawers, the JSON-LD `description`
and `headline`, the OG description, the LLM feeds (`llms.txt`,
`feed-llm.json`), and the audio narration scripts (which are read aloud
verbatim and so must clear the bar in both registers).

> This canon governs the studio voice on `muntin.digital`. How that voice
> relates to the Muntin Ledger product voice — and the one boundary between
> them — lives in `docs/brand/voice-and-naming-architecture.md`.

If you are reviewing a PR that touches any of those surfaces under
`/library/`, this file is the spec. The methods voice contract at
[`/methods/#voice-contract`](../methods/index.html) governs the whole
site; this document restates that contract in the library's register
and adds the rules that are specific to evergreen reference prose.

## What this canon does NOT cover

- The blog (`/blog/`) — sibling reference, see `docs/voice-canon-blog.md`.
- Operator sheets (`/sheets/`) — sibling reference, see `docs/voice-canon-sheets.md`.
- Glossary terms (`/glossary/`) — third-person reference voice; the term is the subject. See `/methods/#voice-contract` POV table.
- Tool pages (`/tools/`) — second-person operator voice ("your menu, your numbers"). See `/methods/#voice-contract` POV table.
- Visual treatment (tokens, type, status palette) — covered by the Muntin brand canon.
- Release-day mechanics — see [§14](#14-release-flow) below; the pattern is similar to `blog/drafts/README.md` but not identical.

## 1. The library vs. the blog — the load-bearing distinction

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
| Updates | Stamp `dateModified`, do not retitle. Write a new dispatch when stale | Living document. Rewrite in place. Bump `dateModified`. |

Same Don, different room. The blog is *"I just read the I/O recap on
the train back from Bethesda."* The library is *"the AI Overview
extractor walks the page in this order, and here is why your paragraph
either gets quoted or doesn't."*

## 2. The reader

Same operator the blog reads to. Different moment.

The blog reader is **reacting** — something happened this week, they
want to know what to do Monday morning. The library reader is
**planning** (onboarding a new GM, scoping a rebuild, evaluating a POS
swap), **troubleshooting** (the map pack dropped, the reservation page
is leaking, the loyalty bill jumped), or **referencing** (sent here by
a chef-friend, by a tool result block, by a search query they typed at
2 a.m.).

That reader has run a kitchen, a host stand, or a back office for
years. They can spot a generic SEO template at ten paces. They are not
a beginner; they are not a lead in a funnel; they are not a student.
They are a working adult who came here with a specific question and
will leave the moment the page stops answering it.

## 3. The byline and the voice register

**Byline.** Library articles ship under **The Muntin Desk** —
not *Don Goldstein*. The blog keeps the Don byline; the library carries
the studio's reference-desk label. This is a 2026 decision that updates
`/methods/#voice-contract` (the POV table row for "Library articles"
should now read: *third-person Muntin Desk byline; first-person Don
appears only as personal operator practice, per `docs/voice-canon-library.md`*).

**The I-rule.** *"I"* is rare on a library page. It appears only when
the prose is naming Don's own operator practice — something he has
seen or done on the floor that informs the mechanism the page is
explaining. It does not appear as the narrator of an event ("I was
reading…", "I sat down and watched…", "I opened the dashboard and…").
Those constructions are blog voice; on a library page, the subject is
the mechanism, not the person observing it.

  - **In:** *"I've seen the box quote longer paragraphs when the H2
    above is a literal question."* — personal operator practice,
    informs the mechanism rule.
  - **In:** *"In ten years of running floors I've watched the same
    three reservation leaks come back."* — operator experience, named
    once to earn the rule that follows.
  - **Out:** *"Last Tuesday I sat with my laptop and watched the
    extractor walk the page."* — narrator-of-event, that's a blog
    opening.
  - **Out:** *"I think this is the most important thing to do."* —
    opinion-as-subject; let the mechanism do the work.

A library article can ship with zero first-person uses. Most should.
When *"I"* appears, it carries weight; if every other paragraph opens
with one, cut all but the load-bearing two.

**The register.** The blog's warmth move is acknowledgement — the
reader's specific Tuesday-morning worry, named. The library's warmth
move is **clarity** — the operator finishes the page understanding
the mechanism well enough to teach it to a new GM on a Monday. Library
warmth is not the chef-friend at the bar with a beer; it is the
patient sous chef on a slow Wednesday afternoon, walking a new line
cook through a station.

That register means: subjects do work that adjectives can't. The
crawler revisits. The extractor reads. The model cross-references the
prose against the schema. Operators audit. Pages leak. When the
subject is the mechanism, the sentence carries the weight.

## 4. The eight rules

Restated from `/methods/#voice-contract` in the library's register.
Five rules carry over verbatim; three are sharper here than on the
blog. The methods contract governs where there is conflict.

### 1. Numbers first. Stories second. Adjectives last.

Same as the methods rule. On a library page, numbers must be either
(a) registered in `data/sourced-claims.json`, (b) cited inline via
`<details class="cite">`, or (c) labeled illustrative. See [§7](#7-the-fact-check-gate).

  - **In:** *"55–65% is the healthy prime-cost band for full-service independents."*
  - **Out:** *"A healthy prime cost is whatever works for your concept."*

### 2. Mechanism-time, not calendar-time.

This is the library's version of the sheets canon's "specific over
vague." Time anchors are how the mechanism moves, not what day it is.

  - **In:** *"The crawler revisits cited URLs faster than uncited ones, which is why a rewrite that breaks a quoted paragraph drops the citation within the next pass."*
  - **Out:** *"Last Tuesday, the crawler revisited Don's page and re-quoted the paragraph."* — that's a blog dispatch.
  - **Out (template):** *"AI is constantly evolving and changing the landscape."* — adjective, no mechanism.

### 3. Name the cause, not the symptom.

Carries over from the sheets canon. On the library, the cause is
usually a mechanism step the reader can audit.

  - **In:** *"Forgetting employer payroll taxes inside labor — the result reads four to six points low."*
  - **Out:** *"Don't forget payroll taxes."*

### 4. Operator nouns. Never SaaS nouns.

The produce reorder · the kitchen lead · expo · the back door · the
bar walk-in · the line · the host stand · the close · the deuce ·
covers · the open · the cut.

Never: stakeholders · workflow · users · onboarding · synergies ·
journey · ecosystem · partner up · loop in · circle back · deep-dive ·
low-hanging fruit · move the needle.

The banned-words list at `/methods/#voice-contract` is binding.

### 5. Direct address (`you`, `your`) is rationed.

This is sharper on the library than on the blog. The default subject
is the operator, the page, the model, the profile, the crawler — not
the reader. `you` appears when the sentence would otherwise be
ambiguous about who is doing the work, or when a warning would be
misread without direct address.

  - **In (mechanism):** *"The first paragraph below an H2 is the one extractors lift. Everything below it is context."*
  - **In (warning, direct address earns its keep):** *"Do not move the URL once the box cites it. The citation drops within the next crawl."*
  - **Out:** *"You should always think about what your customers want."* — generic *you*, no mechanism.

### 6. Ranges, not vibes.

Same as the sheets canon. When a range exists, cite it. *"12–18% of
wages,"* *"45 words or fewer,"* *"55–65%."* Never *"a small
percentage,"* *"some operators,"* *"often,"* *"in many cases."*

### 7. Present tense for what is true. Past for what just happened. No future tense for guarantees.

The library lives in the present. *Is.* *Reads.* *Revisits.*
*Includes.* Past tense appears only when narrating a sourced
measurement ("Google's AI Overview answered 13.14% of US desktop
searches in March 2025"). Future tense does not appear at all on
library pages — it reads as a promise the page cannot keep.

### 8. End on a noun, not a verb.

Same as the methods rule. *The citation.* *The mechanism.* *The
rotation.* *The cut.* The library's cadence depends on it — a
sentence that ends on a noun stays in the reader's head; a sentence
that ends on a verb reads as a fragment that didn't finish.

## 5. The structural skeleton

Library posts ship the same required boilerplate as blog posts. The
difference is in what the elements do, not which elements are
present.

**Required, in this order:**

1. **JSON-LD `@graph`** — `Article`, `AudioObject`, `BreadcrumbList`. Optional `HowTo` when the body is genuinely step-shaped (most library reference is not — most is decision-shaped or mechanism-shaped, neither of which is a HowTo).
2. **`<header>` block** containing: eyebrow line (`Reference · N min read · By The Muntin Desk`), `<h1>` naming the question or the move, listen button, dek paragraph that opens with a sourced fact or a mechanism summary.
3. **`<aside class="tldr">`** — three to five bullets, each a complete sentence. The TLDR is what an LLM lifts when summarizing the page; treat it as the reference card a reader would screenshot.
4. **Body** — H2s walk the mechanism, not the timeline. Each H2 has an `id` (anchor-link friendly). Each H2's first paragraph is a ≤45-word complete answer; everything after is context. This is the same rule the AI Overview extractor rewards, and the library is the first place to follow it.
5. **Two graphics minimum** — see [§8](#8-the-graphics-rule).
6. **`<details class="cite">` drawer** below any sourced figure.
7. **`<aside class="post-end-cta">`** — the Workshop-or-Window next step, per the CTA canon at `/methods/#voice-contract`.
8. **`<aside class="smart-next">`** — three links: a glossary term, a tool, the Window. Verbs locked: *Read · Try · Or send Don a note.*

**H1 patterns.**

- Names the question: *"What should be on a restaurant website?"*
- Names the move: *"How to get cited in Google's AI Overviews."*
- Names the comparison: *"Toast vs. Square vs. Clover: which POS integrates best?"*

Never an event ("Discovery changed under you this spring" is a blog
H1, not a library H1). Never a date.

**H2 patterns.**

- Names a mechanism step ("Ranking and being cited are not the same job").
- Names a sub-question the body answers ("When the rebuild question is actually a content question").
- Names a decision branch ("If you serve a single market: stay on Square").

Never a quarter, never a "this week." H2s have ID attributes so they
can be deep-linked from the smart-next block and from the LLM feeds.

**Confirmation reading.** Two existing posts that already ship this
skeleton clean: `library/how-to-get-cited-in-google-ai-overviews-restaurant/`
and `library/google-review-response-playbook/`. Read both before
drafting a new piece.

## 6. SEO discipline

Library wins **foundational queries**, not long-tail current-event
queries. The blog wins May-2026-this-week searches; the library wins
"how do I get my restaurant on google maps", "restaurant schema
markup", "toast vs square vs clover", "should my restaurant have an
app", "how to respond to a one-star review."

Three keywords per post, picked **before** writing — not after.
Specify their surface placement up front:

- **Title tag** — primary keyword, full phrase, ≤60 chars rendered.
- **Meta description** — primary keyword once, secondary once, written for the click, ≤155 chars rendered.
- **H1** — primary keyword as the natural English phrasing, not the awkward keyword stuffing.
- **Two or more H2s** — secondary keywords as natural section headers.
- **First paragraph** — primary keyword in the first 100 words, in the operator's natural register.

The slug is the canonical URL forever; it does not change after
publish even if the title changes. Slugs are kebab-case, no stop
words, no dates, no year stamps. *"restaurant-schema-markup-guide"* is
correct; *"restaurant-schema-markup-guide-2026"* is wrong — the page
is meant to be rewritten in place, not retired.

## 7. The fact-check gate

**Zero inventions. No exceptions.** This rule is absolute and is
restated here in the strongest available language because the May
2026 editorial review caught widespread fabricated operator data
across the May-2026 wave. The publishing pipeline now has a gate
(`scripts/check-fabrications.mjs`); this document, `docs/fact-check.md`,
and `data/sourced-claims.json` together are the editorial side of that
gate.

Every number, date, name, anecdote, restaurant, cohort, percentage,
and dollar figure on a library page must fit one of three patterns:

1. **Registered** in `data/sourced-claims.json` with `source_url`, `source_name`, and `date_verified`. The article cites the claim in prose; the registry is the system-of-record.
2. **Cited inline** via `<details class="cite">…</details>` immediately below the figure, naming the source by name, with the date or version of the source if it shifts.
3. **Labeled illustrative** in the prose, the figcaption, and the dek. Use directional language ("rising, not flat" / "in the low double digits" / "single-digit dip"). The dek must say so when the entire piece is illustrative: *"This is a playbook, not a case study; numbers are illustrative ranges anchored to [source]."*

There is no fourth pattern. If a claim doesn't fit any of these three,
it doesn't ship.

**The bio is singular.** The current operator bio is: *Don Goldstein,
full-time Front-of-House Manager at Tacombi in Bethesda.* Past roles
live in `/about/#timeline` and in
`data/sourced-claims.json#operator_experience_claims.past_roles`.
Phrases that frame Don as currently managing more than one restaurant
are blocked by `scripts/check-fabrications.mjs` and must not appear in
any library prose, audio script, or feed.

**When the canon and a deadline disagree, the canon wins.** A clean
article with one verified figure beats a confident article with three
invented ones. The reader's trust is the only asset the library has;
once one invented claim is caught, every other claim is suspect too.

## 8. The graphics rule

**Minimum two graphics per library post.** Library reference earns
trust faster when the mechanism is visible.

Use only the existing `viz-*` patterns from `assets/site-article.css`.
Each viz family carries a defined job:

- **`viz-bars`** — measured share, before/after on a single metric, comparative ranking. (Library uses sparingly; the blog leans on this.)
- **`viz-tree`** — decision diagnostics, branching troubleshooting. The library leans here.
- **`viz-ba`** — before/after rewrites of a specific paragraph, profile, or schema block. The library leans here.
- **`viz-flow`** — mechanism sequences, the order a process walks. The library leans here.
- **`viz-ring`** — composition or share-of-whole at a single point.
- **`viz-waterfall`** — margin walks, cost stacks, cumulative-then-net.

Every figure carries:

- **`data-audio-alt`** — full narration of what the figure shows, written as the audio script will read it. Not alt text; not figcaption text; the third surface.
- **`<figcaption>`** — names the takeaway in one sentence. Not what the figure is; what the figure says.
- **`<details class="cite">`** drawer immediately below — if the data is sourced.

Decorative graphics do not count toward the two-graphic floor.

## 9. Length

**2,800-word floor. No exceptions.**

The library catalog already runs in this range; new posts must too.
The 2,800-word floor is not a target — it is the minimum that allows
the mechanism to be explained well enough that a chef-friend can
teach it.

**Density rule.** Every paragraph carries a fact, a mechanism, or a
move. Cut what doesn't. A paragraph that restates the H2 above it is
filler; a paragraph that explains the same mechanism twice in
different words is filler; a paragraph that hedges ("of course it
depends," "every restaurant is different") is filler. Cut all three.

**Why the floor.** AI Overview extractors and Google's quality
classifiers both reward depth; reader trust rewards depth; the
operator who comes back to a library page six months later rewards
depth. A 1,200-word post on a foundational query reads as a thin SEO
template and underperforms in all three measures.

## 10. Localization

**Every library post ships with a Spanish translation** at
`/es/library/<es-slug>/`, linked via `hreflang` in both directions,
plus audio narration in `en/es/fr/it/pt/zh` at `status: rendered` in
`data/article-audio.json`. **Release does not happen** until the
six-language audio renders complete and the ES translation is on disk.

The ES rule from the sheets canon carries: **translate the framework,
recast the rhythm.** Spanish allows shorter clauses than the literal
translation makes natural. Cut connector words rather than expand. Use
`usted/tú`-neutral phrasing.

**Platform names** (Google Business Profile, DoorDash, OpenTable,
Toast, Square) stay in English. **Function names** (commission, prime
cost, citation, schema markup) translate to the operator's working
register, not the dictionary. **Restaurant terms** (expo, the line,
the back door, covers) translate to the local working register —
*"el pase"* for expo in DMV-Spanish operator practice; not the
literal dictionary form.

The audio scripts are read aloud verbatim, in all six languages. They
must clear the fact-check gate in every language; a fabrication that
slipped past the EN draft will be caught when the FR or ZH script
reads it back.

## 11. In/Out — the quick reference

The cleanest mental model: would this line land in the library, on
the blog, or on a generic SEO template page?

| In voice (library) | Out (blog voice) | Out (SEO template) |
|---|---|---|
| *"The extractor walks the page in subject-predicate-object shape."* | *"I sat down and watched the extractor walk the page."* | *"Modern AI systems are revolutionizing how content is discovered."* |
| *"55–65% is the healthy prime-cost band for full-service independents."* | *"Last week I ran the prime-cost math and the number was 62%."* | *"Maintaining healthy margins is critical for restaurant success."* |
| *"The crawler revisits cited URLs faster than uncited ones."* | *"Three days after the AI Overview cited the page, the crawler came back."* | *"Search engines love fresh, high-quality content."* |
| *"Do not move the URL once the box cites it. The citation drops within the next crawl."* | *"I learned this the hard way when I moved a page last spring."* | *"Always remember to maintain consistent URL structures!"* |
| *"Forgetting employer payroll taxes inside labor — the result reads four to six points low."* | *"My GM showed me this last Tuesday and the labor number was off."* | *"Don't forget to include all your costs in your calculations."* |
| *"Three reservation leaks come back across every audit: the menu PDF, the OpenTable redirect, and the mobile keyboard."* | *"Walked through three sites this morning and saw the same leaks."* | *"Many restaurants experience common conversion challenges."* |
| *"The model reads the prose, then reads the schema, then asks itself if they match."* | *"I watched this happen in real time on Wednesday."* | *"AI is changing the way search results are displayed."* |

The blog column is not wrong on the blog. It is wrong on the library.
The SEO template column is wrong everywhere.

## 12. The ship test

A library post is ready to ship when **all** of these are true. Any
"no" sends it back to the desk.

**Hard requirements (gated by automation; build fails on a `no`).**

- [ ] `scripts/check-fabrications.mjs --check` exits 0 on this file.
- [ ] `scripts/inject-site-counts.mjs --check` exits 0.
- [ ] JSON-LD validates: `Article` + `AudioObject` + `BreadcrumbList`, plus `HowTo` if the body is genuinely step-shaped.
- [ ] `hreflang` pair (EN ↔ ES) is stamped on both files and points to live URLs.
- [ ] Audio render status in `data/article-audio.json` is `rendered` for all six languages.
- [ ] Word count ≥2,800 on the EN body (rendered, not source).
- [ ] At least two `viz-figure` blocks, each with `data-audio-alt` and `<figcaption>`.
- [ ] Every sourced number has either a `data/sourced-claims.json` entry, a `<details class="cite">` drawer, or an illustrative-range label in the prose and figcaption.

**Editorial requirements (human judgement).**

- [ ] H1 names a question, a move, or a comparison — not an event, not a date.
- [ ] First paragraph below each H2 is a ≤45-word complete answer.
- [ ] *"I"* appears zero times, or appears only as personal operator practice. No narrator-of-event uses.
- [ ] The byline reads *The Muntin Desk*, not *Don Goldstein*.
- [ ] Three keywords are placed in title, description, H1, ≥2 H2s, and the first paragraph.
- [ ] Banned-word audit clean (run a grep against the methods.html banned list).
- [ ] No future-tense guarantees. No exclamation marks. No rhetorical-question headlines. No emoji.
- [ ] Slug is final-forever: kebab-case, no year, no stop words.
- [ ] Smart-next block uses the locked verbs (*Read · Try · Or send Don a note*).
- [ ] Post-end-cta uses a verb from the CTA canon at `/methods/#voice-contract`.

**Clarity check (the library's warmth move).** Read the body to a
chef-friend over a slow Wednesday coffee. They finish the page able
to teach the mechanism to a new GM on Monday. If they can't, the
mechanism isn't explained yet — the post is not ready.

## 13. The aloud test

Read the article aloud to yourself. Then ask:

1. *Would Don's chef-friend with twenty years on the line read this and feel respected, or talked down to?*
2. *Would that same chef-friend finish this page understanding the mechanism well enough to explain it to a new GM on a Monday morning?*
3. *Is every specific claim real, verifiable, and sourced — including operator anecdotes? Could the registry, the citation drawer, or the prose label support every single number on this page?*

If the answer to **(1)** is anything other than "respected," cut the
celebratory adjective and try again. If the answer to **(2)** is "not
quite," the mechanism is the missing piece; rewrite the H2 the gap
falls under. If the answer to **(3)** is anything other than an
unqualified yes, the post does not ship until it is.

## 14. Release flow

Library release is similar to the blog drafts pattern at
`blog/drafts/README.md` but not identical. Library posts do not sit
in a `drafts/` directory under `/library/`; they are drafted in the
private workbench, copy-reviewed against this canon, and then landed
directly at `/library/<slug>/` in a single PR that also lands the ES
translation, the six audio renders, and the smart-next plus
post-end-cta blocks.

The single-PR rule exists so the release atomically updates:

- `library/<slug>/index.html` and `es/library/<es-slug>/index.html`
- `data/article-audio.json` (status: `rendered` for all six languages)
- `data/sourced-claims.json` (any new registered claims, with `used_in: [<slug>]`)
- `data/library-tags.json` (topic pillar tags)
- `data/site-counts.json` (rebuilt by `scripts/build-site-counts.mjs`)
- `data/post-end-cta.json` and the smart-next anchor in `library/<slug>/index.html`
- `sitemap.xml` and the `library/index.html` hub article-list block
- `feed.xml`, `llms.txt`, `feed-llm.json` (rebuilt by their respective scripts)

A library release that breaks any of those atomically — for example,
landing the EN body without the ES translation, or shipping audio
that hasn't rendered — fails the CI gate and does not deploy.

When a library article is later **revised in place** (the living-doc
rule from the table in [§1](#1-the-library-vs-the-blog--the-load-bearing-distinction)),
bump `dateModified` in the JSON-LD, rerender any affected audio, and
land the revision in a single PR. Do not retitle and do not move the
slug; deep links from the smart-next blocks, from external citations,
and from the AI Overview rotation depend on slug stability.
