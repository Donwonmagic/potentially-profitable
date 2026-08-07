# Brand, Naming & Voice

## Thesis
The brand is not broken; it is out of date by exactly one strategy, and the mismatch is measurable rather than aesthetic. The storefront sells a $19/month invoice reader — `/ledger/index.html` still offers "three months free, then $19 a month per location for as long as they stay" — while ADR-030 withdrew that price and the company now sells a $600/location signed monthly close that appears on zero of 1,327 pages. The governing voice document is one month older than the decision that superseded it: `/methods/index.html:487` mandates "First-person singular ('I')… No royal 'we' — never a fake team" (v1.1, 2026-06-11), and the positioning pivot of 2026-07-11 mandates the opposite, and nobody rewrote the canon. So `/never/` speaks 11 first-person tokens and zero "we", `/studio/` speaks zero "I" and five "we", and both are linked from the same footer on every page. That is the split brain, and it is a governance defect, not a taste defect. The founder's word for what results is "emotionless," and the measurement is grammatical: `/studio/`, the company page, spends 5 second-person tokens across 384 words, and the homepage's three proof sections are titled "The fact gate," "The network tab," "The public scorecard" — three nouns naming Muntin's own machinery. Emotionless is Muntin occupying the subject slot of its own sentences. The single most damaging sentence on the property is on the honesty page: `/never/` guarantee three, "I will never hide pricing behind a call. Muntin Ledger's tiers are posted in writing at ledger.muntin.digital" — a trust guarantee whose proof link 404s (the product actually routes `app.muntin.digital`, per `apps/web/wrangler.jsonc:28`) and whose noun, "tiers," was abolished by decision. Meanwhile the best writing the company owns lives in `apps/web/lib/copy.ts` where no customer has read it, and 28 runnable falsifiers are fully built at `/verify/[slug]` in the product repo — baked into `apps/web/lib/verify-content.generated.ts` — and served from that same dead hostname. My position: the names are almost all right and the voice architecture is one register short. Fix the register count, name the thing being sold, and never again print a claim without the command that breaks it.

## Today
**The two decisions of record contradict each other, and the older one is the one with gates.** `/methods/index.html:487` (the binding voice contract, v1.1 2026-06-11): "POV. First-person singular ('I'), one human, named Don… No royal 'we' — never a fake team." `docs/handoff/founder-vision.md:125-142` (the positioning pivot, 2026-07-11): "Stop foregrounding 'it's one person'… Lead with product capability + craft in the company voice. 'Muntin' / 'we'." The pivot was never written into `/methods/`, never written into `docs/brand/voice-and-naming-architecture.md:76-84` (whose table still reads: Storefront POV = "First-person singular 'I'; never 'we'"), and never reached the pages.

**Measured POV split, same footer, same site** (my count, visible prose only): `/never/index.html` you/your=27, I/my=11, we/our=1. `/studio/index.html` you/your=5, I/my=0, we/our=5. `/about/index.html` I/my=26. `/index.html` you/your=54, I/my=3, we/our=6. `apps/web/lib/copy.ts` — the product — is uniformly system-"we" + "you".

**The storefront sells a withdrawn offer.** `ledger/index.html:~120` and 8 sibling pages (`index.html`, `es/index.html`, `es/ledger/index.html`, `ledger/demo/`, `es/ledger/demo/`, `claims/index.html`, `es/claims/index.html`): "three months free, then $19 a month per location for as long as they stay," rendered as a large `$19 / a month` price block. `$600` appears as a price on zero pages. "closed month" / "monthly close" appears on one page (`glossary/last-updated-signal/`, coincidental). 4 pages carry the waitlist form.

**The dead hostname is a brand failure, not a link failure.** 547 occurrences of `ledger.muntin.digital` across 405 HTML files; `data/surface-disposition.json` independently counts 501 `deadProductCta` across 402 pages. 138 of them are the site-wide primary CTA ("See Muntin Ledger" → `https://ledger.muntin.digital/`, vs 315 correctly pointing at `/ledger/`). The real host is `app.muntin.digital` (`apps/web/wrangler.jsonc:28`) and `api.muntin.digital` (`apps/api/wrangler.toml:22`) — and the product repo's own canonical/sitemap/robots code (`apps/web/app/layout.tsx`, `sitemap.ts`, `robots.ts`) also still says `ledger.muntin.digital`, so both repos disagree with the deploy config. Three published guarantees route through it: `/never/` #2 ("the code that enforces it at ledger.muntin.digital/promises"), #3 ("tiers are posted in writing at ledger.muntin.digital"), and `/studio/` ("Pricing is posted in writing at ledger.muntin.digital").

**The falsifier is built and hidden.** `apps/web/lib/verify-registry.ts` registers 28 files (`no-llm-ci.sh`, `threat-model.md`, `0015_rls_data_plane.sql`, `check-demo-no-persistence.mjs`, `privacy-ci.sh`, `pii-scrubber`, …) and `apps/web/lib/verify-content.generated.ts` (7,958 lines) bakes their full source so an anonymous visitor can read the gate in the browser. Its own header states the purpose: "every claim links to the code that enforces it… the verification stays verifiable." It ships to a hostname that does not route. On the storefront: "no language model" appears on 89 pages; `no-llm-ci` appears on 0.

**The CTA canon binds new copy to two dead things.** `/methods/index.html:~503`: "Run my free audit" (the retired web-design services line; on 2 pages) and "See pricing — the product's posted numbers at ledger.muntin.digital" (on 4). Meanwhile "See Muntin Ledger" — not in the canon — is on 605 pages.

**The banned-words list bans the founder's own thesis word.** `/methods/index.html:~497` bans "empower" (alongside "unlock," "journey," "solutions"). `docs/handoff/founder-vision.md:35` names the emotional engine: "the owner feels EMPOWERED." Both are correct. The site may not *say* empowered; it must *make* the reader feel it — that is the whole assignment, stated as a lint rule.

**Names as they stand.** "Muntin Digital" on 1,330 files (nav `_includes/nav.html:13`, footer, JSON-LD, wordmark in `--font-display` Fraunces). "Muntin Ledger" on 1,214. "Cost Index" on 781 (ES: "Índice de Costos"). "The Muntin Desk" byline on 636. `/ledger/` carries 89 inbound editorial links; `/cost-index/` carries 134. No `/corrections/` register exists.

**The gate landscape is friendlier than the documents.** `check-studio-voice-boundary.mjs` is wired (`check-all.mjs:151`) but blocks only fake-team constructions ("our team", "a team of", "our engineers") — never a bare "we". It currently passes clean. So the positioning pivot is executable today; only the published canon forbids it.

## Proposal
## I. THE NAMES — three calls, one rename, zero slug changes

**1. The display name shortens to "Muntin."** "Muntin Digital" is a web-studio name carried over from the retired services line; "Digital" is the suffix of the business that was killed. Legal name stays **Muntin Digital, LLC** (Maryland — it appears in the footer and it is true). Split it in JSON-LD: `"name": "Muntin"`, `"legalName": "Muntin Digital, LLC"`. Wordmark: `Muntin` in Fraunces 600, the ™ superscript retained. Zero URLs move; the change lives in `_includes/nav.html`, `_includes/footer.html`, and the JSON-LD builder. The domain reads `muntin.digital` and the company reads `Muntin` — that is a stronger pairing than a company that says its own TLD out loud.

**2. "Muntin Ledger" stays, and stops being the thing sold.** A ledger is a record; a close is a statement. The naming architecture is: **Muntin Ledger keeps the record. Muntin closes the month.** The product name is right for a system of record and it carries 1,214 files and 89 inbound links. What has no name today is the *deliverable*, which is why the storefront cannot describe what it sells.

**3. The deliverable is named "the Close," and it is addressable.** "Close" is the operator's own verb ("closing out the month") and the CPA's own noun. It is deliberately **not** audit vocabulary — no "opinion," no "attestation," no "certified," per the research's hard warning against borrowing assurance language. Every issued artifact has an identity in the same shape as a Cost Index edition:

> **Close 2026-02 · Bethesda, MD** — issued 2026-03-04

New route `/close/` on the storefront carrying one specimen. `/ledger/` is kept and rewritten to describe the system, not the offer. No slug is renamed.

**4. "the Cost Index" is untouchable — it is the strongest asset the company owns.** But the *edition* is misnamed. `blog/cost-index-week-<asOf>/` is a monthly publication with a weekly slug (kept — final-forever) titled as a narrative ("the basket reads −5.0% vs baseline"). The research is unambiguous that a citable object is a named benchmark, not a story. Change the display title only: **"Wholesale produce and protein, February 2026 — 81 ingredients, priced against their own baseline"**. Slug unchanged, cost is editorial.

## II. THE VOICE — three registers, because two cannot hold the strategy

The board's tension — company voice vs a hand-signed service — dissolves the moment you separate **the speaker** from **the signatory**. Every serious institution already does this. An audit firm issues; the engagement partner signs. The Economist writes unsigned. A signature on a financial statement is not an admission of smallness — it is an **assumption of liability**, and it is the strongest possible move for a company whose entire promise is that a number can be stood behind. A SaaS vendor cannot sign anything. Muntin can.

**Register M — Muntin (the company).** Storefront, Cost Index, `/ledger/`, `/close/`, tools, marketing. Subject of every section-opening sentence is **the operator or the operator's money**, never Muntin and never a Muntin mechanism. "Muntin" as subject when a subject is needed; "we" permitted for mechanism only ("we hold the number back"), never for reassurance ("your data is safe with us"). Never a headcount claim, never "our team." This replaces first-person "I" on every marketing and trust surface.

**Register S — the system (Muntin Ledger).** `apps/web/lib/copy.ts`, product email, digests. Already correct and already the best writing the company owns — `"Held to check"`, `"Read clean"`, `"We flag it; we do not change it"`, `"No prior count, so there is no beginning to compare."` **Do not touch it.** Its only defect is that it is invisible; the fix is to lift its vocabulary onto the storefront, not to rewrite it.

**Register D — the signatory (Don Goldstein).** First person, past tense, specific, no marketing. Permitted at exactly four points and nowhere else: (a) the signature block of an issued Close; (b) the "From the floor" note on a Cost Index edition — the gated block that already exists in `data/cost-index-editors-notes.json`; (c) an entry in the corrections register; (d) a reply to a flagged claim. Every one of those is a **liability moment**. That is the rule: *first person appears only where a person is on the hook.*

This retires "I" from `/never/`, `/ai/`, `/methods/`, `/security/`, and the POV-by-page-type table's "Trust pages — first-person Don" row — and it retires nothing from `/about/`, where "I" is biography and belongs.

## III. THE RUNNABLE CLAIM — the falsifier gets a sentence shape, not a page

The research finding is that citation UI raises trust whether or not the citation is faithful, and the counter-move is a claim a stranger can execute. Muntin has 28 executable claims already built and zero of them printed. The design is not a `/verify/` page bolted on the side — it is a **rule about how a claim is allowed to be set**:

> **A claim and the command that breaks it occupy the same block. A claim that cannot carry a falsifier is deleted, not softened.**

Component `.claim` — a paragraph whose final child is a mono line:

```
No language model ever reads your invoices.
$ bash scripts/no-llm-ci.sh            read the gate →
```

Type: claim in body Inter 17px/1.6; falsifier in `--font-mono` 13px, `--stone`, on a `--cream-2` band with a 2px `--teal` left rule, `$` prompt in `--stone-2`, the link right-aligned to the measure. No icon. No badge. No shield. It looks like a terminal line because it is one.

Enforcement — the part that survives 108 agent sessions where 1 loads CLAUDE.md: `scripts/check-runnable-claims.mjs`, registry-driven off `data/verifiable-claims.json` (vendored from `apps/web/lib/verify-registry.ts` the same way `cost-index-snapshot.json` is vendored). Any page containing a registered claim string must contain its falisifier within the same block element, and every falsifier slug must resolve to a `/verify/<slug>` that exists. Wire it after the violations are fixed — the 89 pages shrink to the ~12 that can carry the proof, and that shrinkage **is** the retirement.

## IV. THE AESTHETIC RISK — the stamp

One risk, taken deliberately. The site has no mark of authorship anywhere except a byline. I propose a single typographic device, used on exactly three surfaces:

```
──────────────────────────────────────────────────────
CLOSE 2026-02 · BETHESDA, MD                  ∑ FOOTED
ISSUED 2026-03-04 · MUNTIN
SIGNED  DON GOLDSTEIN
```

`--font-mono`, 12.5px, `letter-spacing:.06em`, uppercase, `--stone`, above a 1px `--line-dark` rule at full measure; the tickmark (`∑ footed`, `✓ traced`) right-aligned. It is deliberately unlovely — a stamp, not a logo. It appears at the foot of a Close, at the foot of a Cost Index edition, and at the foot of a corrections-register entry. Nowhere else, ever.

Its scarcity is the entire design. Three surfaces out of 1,327 carry a signature, and those three are the ones with liability attached — so the stamp *means* something the moment a reader sees it twice. It is also the exact inverse of every AI-slop tell in the research: no gradient, no card, no rounded icon tile, no glass, no bento. It works because the rest of the site is not doing it.

The honesty boundary is hard-coded into the words: **ISSUED · MUNTIN / SIGNED · DON GOLDSTEIN**. Never "opinion," never "attested," never "certified," never "audited." Borrow the ordering; never borrow the assurance vocabulary.

The precedent for the specimen already exists: `/ledger/index.html:589` ships "**Illustrative sample** — how a filed invoice line gets flagged against your own price history. Not live or customer data." The `/close/` specimen carries the same label and the same discipline, because Don manages Tacombi, he does not own it, and its food cost is not his to publish.

## V. THE FOUR HARD MOMENTS — specified as copy, not as principles

**A withheld number.** Never a dash, never "unavailable," never a spinner, never an apology. The cell keeps its slot, its tabular width and its baseline, and fills with three things: what is missing, why that blocks the number, and the one action that clears it. Register M.

> `Usage — not computed`
> No ending count for Walk-in. Usage needs a closing figure. **Enter the count →**

The vocabulary already exists in `copy.ts:80` (`causeNoValuation: "No price yet. Send an invoice for this item."`) — port the shape, do not invent new words. And on the storefront, describe the *rule*, never the *record*: Muntin has zero users and cannot yet claim its held lines were the right ones to hold. Print coverage (measured), withhold any claim that the coverage is good (not yet supportable) — which is itself the most on-brand sentence available.

**A correction.** Third person. No apology in the first sentence, and never an apology in place of the fact. Four parts: what was published / what is true / when it changed / what changed in the process. That last clause is the whole mechanism — it converts an admission into an instance of a routine, which is the documented difference between a correction that costs trust and one that does not. New dated artifact, never an in-place edit.

> **2026-03-11 · Correction.** The February close for Bethesda reported purchases of $41,208. The correct figure is $40,932; a credit memo posted after issue was not netted. Superseded by **Close 2026-02r**; the original stays at its address. Credit memos now block a close until netted.

**A missed close.** The failure that costs the most is silence. Announce it *before* the deadline, name the blocker, give a new date, and do not offer a discount unprompted — a discount converts a service failure into a transaction and forfeits the trust the honesty is meant to buy. Register D, because a missed delivery is a liability moment.

> **Close 2026-02 will not issue on the 4th.** Three ImperialDade invoices are still unread. A close that leaves them out would misstate purchases, so it is not going out. New date: the 7th. If it slips again you will hear it from me before the 7th, not after. — *Don Goldstein*

**A price increase.** The number, the effective date, the reason in one clause, and what does not change. Never "to continue delivering the best experience." And the discipline that matters today: the price is $600, set 2026-08-07, with zero customers — so print the price *and the date it was set*, and never print "our price has never gone up." A company with no customers has no track record to claim.

> **The price goes to $X per location on 2027-01-01.** [One clause of reason.] Locations invoiced before that date hold their rate through 2027. Nothing about what you get changes; if it did, that would be on this page too.

## VI. THE FIX FOR "EMOTIONLESS" — it is a grammar rule, not a tone

The measurement says the further a page gets from the operator's hands, the more Muntin occupies the subject slot. The rule is one line and it is reviewable by an agent: **on any Register M surface, the subject of the first sentence of every section is the operator or the operator's money.** The mechanism becomes the kicker underneath, in the `.claim` band, where it also becomes falsifiable. Applied to the homepage's three self-defense sections:

- "**01 The fact gate** / An invented number here isn't edited out. It fails the build." → **"You will never have to check our arithmetic against our marketing."** kicker: `node scripts/check-fabrications.mjs — an invented number fails the build.`
- "**02 The network tab** / Free tools compute in your browser." → **"Your prices never leave the laptop you typed them on."** kicker: `open DevTools and type; the request list does not grow. check-tool-no-fetch`
- "**03 The public scorecard** / The Cost Index grades its own forecasts in public." → **"When we are wrong about a price, you find out from us first."** kicker: the scored-weeks figures, already sourced.

Same facts, same gates, same receipts. The company stops being the subject and starts being the guarantee — which is the emotional pivot executed at the only level it can be executed cheaply: the sentence.

## Moves
- **Kill `ledger.muntin.digital` sitewide and delete the withdrawn $19 offer. One injector rewrites 547 occurrences across 405 files (138 of them the site-wide primary CTA) to `/ledger/` or `app.muntin.digital`; the `$19 / three months free / tiers` blocks come out of `index.html`, `ledger/index.html`, `ledger/demo/`, `claims/index.html` and their four ES mirrors. Add `check-dead-host.mjs` (fail-CI) so it cannot come back. In the same commit, rewrite `/never/` #3 and `/studio/`'s pricing line to point at the real price surface or say plainly that the price is quoted in writing on request.** [2h founder (agent executes; founder reviews diff + deploys)]
  - This is the loudest brand failure on the property and it is not a link bug: it is a published honesty guarantee — 'I will never hide pricing behind a call' — whose proof link 404s and whose noun ('tiers') was abolished by ADR-030. A CPA who clicks it once is done. Nothing else in this plan matters if a reader can prove the trust page wrong in one click.
- **Rewrite `/methods/#voice-contract` to the three registers (M / S / D), update the two-voice table in `docs/brand/voice-and-naming-architecture.md:76-84`, and record it as ADR-034 with the positioning pivot as its context. Invert the doc comment on `check-studio-voice-boundary.mjs` — it now guards against a fabricated headcount, not against 'we' — and keep its patterns unchanged (it already passes clean, so the pivot is executable today).** [2h]
  - Two decisions of record currently contradict each other and the obsolete one is the one that governs 1,327 pages and loads into every prose review. Until the canon is rewritten, every voice change an agent makes is a violation of a published contract, and the pivot cannot be executed at all.
- **Ship the `.claim` component and `check-runnable-claims.mjs`, vendoring `apps/web/lib/verify-registry.ts` (28 entries) into `data/verifiable-claims.json` the way `cost-index-snapshot.json` is already vendored. Mirror `/verify/<slug>` onto the storefront. Then run the retirement it forces: the 89 pages carrying 'no language model' shrink to the set that can print `bash scripts/no-llm-ci.sh` next to it; the rest lose the claim.** [3h]
  - The research finding is that citations raise trust whether or not they are faithful, and the counter-move is a claim a stranger can execute. Muntin has 28 of these fully built, generated at every build, and served from the hostname move #1 is deleting — while the claim they prove is asserted 89 times with no proof. This is the cheapest credibility move available and it is currently at zero.
- **Convert `/never/` and `/ai/` (EN + ES, 4 files) from Register D to Register M. Delete the 11 and 12 first-person tokens; the guarantees stop being personal promises and become company mechanisms with falsifiers attached. Delete the CTA-canon rows 'Run my free audit' (retired services line) and 'See pricing' (dead host); canon drops from five verbs to four.** [1.5h]
  - These two pages are the purest form of the superseded voice and the purest form of the defensive posture the founder retired — a page arguing for itself in the first person. Converting them is also the proof that Register M can carry a guarantee without a fake team, which is the objection the whole three-register split exists to answer.
- **Name the deliverable. Build `/close/` carrying one specimen Close: the four legs of `Beginning + Purchases − Ending = Usage` footing on screen, the coverage line ('answered N of M lines; held K, with reasons'), one worked withheld cell, and the stamp. Label it 'Illustrative specimen — not live or customer data,' the exact discipline already shipped at `ledger/index.html:589`. Rewrite `/ledger/` to describe the system of record rather than the offer.** [3h]
  - The company sells an artifact that has no name and appears on no page: 'closed month' is on one page by coincidence, $600 on none. A buyer cannot want a thing they cannot see, and a CPA cannot evaluate a promise. Naming it 'the Close' also fixes the sentence the storefront has never been able to write: Muntin Ledger keeps the record; Muntin closes the month.
- **Ship the stamp: one CSS block (`.stamp`), mono, uppercase, hairline rule, tickmark right-aligned, three permitted uses (a Close, an Index edition, a corrections entry) and a gate that fails if a fourth appears. Words fixed at ISSUED · MUNTIN / SIGNED · DON GOLDSTEIN — never opinion, attested, certified, audited.** [1h]
  - This is the aesthetic risk and the resolution of the board's tension in a single object: the company issues, a named human signs. A signature reads as assumed liability, not as smallness — and no incumbent SaaS vendor can put one on anything. Scarcity does the work; a stamp on three surfaces out of 1,327 means something the second time a reader sees it.
- **Rewrite the homepage's three section heads so the subject is the operator, moving the mechanism into a `.claim` kicker underneath (EN + ES). 'The fact gate' → 'You will never have to check our arithmetic against our marketing.' 'The network tab' → 'Your prices never leave the laptop you typed them on.' 'The public scorecard' → 'When we are wrong about a price, you find out from us first.'** [1.5h]
  - 'Emotionless' is measurable and it is grammatical: `/studio/` spends 5 second-person tokens in 384 words and the homepage's proof sections are three nouns naming Muntin's own machinery. Same facts, same receipts, subject moved — this is the emotional pivot executed at the only level a 13-26 h/month company can execute it.
- **Write `docs/voice-canon-moments.md` (≤120 lines, four templates: withheld number, correction, missed close, price increase) and scaffold `/corrections/` as a dated append-only register — before any of the 72 published falsehoods are edited, not after.** [2h]
  - The corrections research is that a correction read as an admission costs trust and a correction read as a routine executing does not, and the difference is entirely whether the apparatus was declared in advance. Editing 72 claims first makes them 72 quiet rewrites indistinguishable from a cover-up and forfeits the single largest trust asset the company owns. The register must exist first; that ordering is the whole move.
- **Shorten the display name to Muntin. `_includes/nav.html:13`, `_includes/footer.html`, wordmark, and the JSON-LD builder split into `"name": "Muntin"` / `"legalName": "Muntin Digital, LLC"`. No URL, slug, domain or legal-entity change.** [2h]
  - 'Digital' is the suffix of the killed services line and reads as an agency to a bookkeeper deciding whether to recommend you. The rename costs two partials and one builder because the name never entered a slug, and it is the last visible artifact of the business the company already retired.
- **Retitle the Cost Index edition as a named benchmark: slug family `cost-index-week-<asOf>` unchanged (final-forever), display title and `<h1>` changed to the comparison form — '81 ingredients priced against their own baseline, February 2026'.** [1h]
  - The reported citation data says primary research earns roughly 3.3x citation density almost entirely when packaged as a measurable comparison rather than a narrative, and the Cost Index currently ships as prose ('the basket reads −5.0% vs baseline'). This is the one discovery move that is pure editorial framing over data that already exists, with zero slug risk.
- **Fix the product repo's own hostname drift in the same window: `apps/web/app/layout.tsx`, `sitemap.ts`, `robots.ts`, `.well-known/security.txt/route.ts` and the marketing components all emit `ledger.muntin.digital` while `apps/web/wrangler.jsonc:28` routes `app.muntin.digital`.** [1h]
  - Move #1 removes the storefront half of a broken hostname; leaving the product half emitting a dead canonical, a dead sitemap and a dead security.txt means the two repos still disagree with the deploy config, and the `/verify/` surface the whole claim design depends on stays unreachable at its own advertised address.

## Retires
- `ledger.muntin.digital` — the hostname, entirely. 547 occurrences across 405 HTML files, including 138 site-wide primary CTAs and the proof links inside three published trust guarantees (`/never/` #2, `/never/` #3, `/studio/`).
- The withdrawn price copy: 'three months free, then $19 a month per location for as long as they stay' and the large `$19 / a month` price block, on `index.html`, `ledger/index.html`, `ledger/demo/`, `claims/index.html` and their four ES mirrors. Withdrawn by ADR-030 on 2026-08-07 and still published.
- The word 'tiers' as applied to Muntin Ledger pricing (`/never/` #3, `/studio/`) — ADR-030 collapsed pricing to one entry; a tier is a thing that no longer exists.
- `/methods/#voice-contract` rule 1 in full ('First-person singular ("I")… No royal "we"') and the POV-by-page-type table's 'Marketing pages — first-person Don' and 'Trust pages — first-person Don' rows. Superseded 2026-07-11; the document outlived its decision by four weeks.
- The two-voice table in `docs/brand/voice-and-naming-architecture.md:76-84` (Storefront = 'I', never 'we'), replaced by the three-register table.
- First-person 'I' as narrative voice on `/never/` (11 tokens), `/ai/` (12), `/methods/`, `/security/` and their ES mirrors. 'I' survives only in Register D — signature blocks, editor's notes, corrections, flagged-claim replies — and in `/about/`, where it is biography.
- The CTA-canon entries 'Run my free audit' (retired services line, on 2 pages) and 'See pricing' (dead host, on 4). Canon goes from five locked verbs to four.
- The 'no language model' claim on every page that cannot print `bash scripts/no-llm-ci.sh` beside it — 89 pages carry the claim today; the falsifier gate is what forces the shrink, and the shrink is the retirement.
- The homepage's three self-defense section titles ('The fact gate', 'The network tab', 'The public scorecard') — the mechanism moves into the `.claim` kicker and the operator takes the subject slot.
- 'Muntin Digital' as the display name and wordmark. Retained only as `legalName` in JSON-LD and in the footer's Maryland-LLC line, where it is legally true.
- `showWorkTitle` / `showWorkLead` staying buried in the count flow (`count-client.tsx:329`) — the 'show your work' drawer moves to the Close, per item, per leg, rather than being duplicated.
- The premise (not the code) of `check-studio-voice-boundary.mjs`: it stops guarding against corporate 'we' and starts guarding only against a fabricated headcount. Patterns unchanged; header comment inverted.

## Risk
**Register D is the most attractive voice to write, and there is no detector for using it in the wrong place.** First person, past tense, a real floor, a named human on the hook — that is the seat every writer wants, and 80-84% of commits are agent-authored. The whitelist ('signature block, editor's note, correction, flagged-claim reply') is enforceable as a path allowlist, but nothing can mechanically catch a sentence in Register M that *should* have stayed in Register M and drifted into confession. The likely failure is not a fabricated team — the existing gate blocks that — it is a slow return to the defensive posture through the back door of authenticity, one signed note at a time, until the site is again a person explaining himself. `docs/contracts/rules.json` already labels 5 of its 26 rules as having no detector; this is honestly a sixth, and it should be written down as one rather than dressed as enforced.

**The naming risk is sharper and is mine to own.** Naming the deliverable 'the Close' commits the brand to shipping one, and today zero closes exist for zero customers. Renaming around an artifact that has never issued replaces *stale* copy with *aspirational* copy — and the honesty contract treats aspiration worse than staleness, because staleness is a maintenance failure and aspiration is a claim. The mitigation is real but partial: the `/close/` specimen must carry 'Illustrative specimen — not live or customer data' with the same discipline as `ledger/index.html:589`, and the storefront may describe the *rule* by which a number is held but may never state that the holding has been *correct*, since there is no calibration data and will not be until a real month closes. If the first Close has not issued by CP-60, the honest move is to freeze `/close/` rather than keep the promise on the page — and I would rather name that trigger now than discover it as drift.

**And the smaller one:** the three-register split is more machinery than a one-person company has ever successfully maintained, and this company has closed audits at 26%. If only one move survives contact with the calendar, it should be move #1 — the dead hostname and the withdrawn price — because a broken honesty guarantee is worse than an inconsistent voice, and every other item here is an improvement on a brand that is currently disprovable in one click.