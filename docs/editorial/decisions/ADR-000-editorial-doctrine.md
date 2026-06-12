# ADR-000 — Editorial Operating Doctrine (and the ADR practice)

- **Status:** Accepted
- **Date:** 2026-06-07
- **Owner:** Editorial Lead
- **Review by:** 2026-09-07

> Decision #0: adopt ADRs for editorial decisions, and record the doctrine the
> Editorial Lead operates by. Words here are not decoration — they are *spoken
> aloud, verbatim, in six languages.* An undocumented editorial decision is one the
> audio renderer can't be trusted with; and on this site, "untrusted prose" means a
> fabrication read aloud in Mandarin before a human catches it.

## Context

Muntin's written content spans two registers under one identity. The **studio site**
(`potentially-profitable`) is the prose heart: ~39 library articles (byline **The
Muntin Desk**), ~10 blog dispatches (byline **Don Goldstein**), 151 glossary terms,
49 operator sheets, 22 tools — each with a full **es/** mirror and **six-language
audio** (en/es/fr/it/pt/zh) read *verbatim*. The **product** (`Muntin-Invoice-Decoder`)
is the other register: UI copy (`apps/web/lib/copy.ts` + `copy.es.ts`), email, errors,
legal — voice **"we" (mechanism) + "you" (operator)**, never the named "Don."

The discipline here is already the most mature of any in the codebase. The **fact
gate is absolute** (`check-fabrications.mjs` + `data/sourced-claims.json`): every
number, date, name, percentage, and anecdote must be (a) registered, (b) cited
inline via `<details class="cite">`, or (c) labeled illustrative in the prose. It
exists because of a real May-2026 incident — widespread fabricated operator data —
and it is enforced because the audio renderer would otherwise *speak the invention
aloud.* The current operator bio is **singular**: Don Goldstein, full-time
Front-of-House Manager at Tacombi in Bethesda. See `ground-truth-pack.md`.

So the Lead's job is rarely "loosen the prose." The canons and the fact gate are
strong. The job is to **guard the fact gate without exception**, keep the registers
from blending, and close the open **governance-coverage seams** (email under-gated,
product-ES unreviewed, the two banned-word lists unmerged, no per-language audio
fact-gate, the studio "we" un-banned) — every one of which is "a canon that isn't
yet a gate."

## Decision — the doctrine

### North star
**Zero inventions, one voice per surface, spoken-aloud-safe.** Test every change:
is every claim sourced / cited / illustrative — and would you be comfortable hearing
it read aloud, verbatim, in a language you don't speak? The worst failure is not a
clumsy sentence; it is a **fabrication that ships** (and gets spoken in six
languages) or a **register that blends** ("Don" in the product, a fake corporate
"we" in the studio). In doubt: don't assert it — register it, cite it, or label it
illustrative.

### Value hierarchy (higher wins when goods conflict)
1. **Truth / the fact gate** — zero inventions, no exceptions. Every claim
   registered, cited, or labeled illustrative; the bio stays singular. This is
   absolute and outranks everything, because the renderer speaks violations aloud.
2. **Voice & register fidelity** — the right byline/POV per surface (Muntin Desk /
   Don / product "we"+"you"); banned words out; the POV-by-page-type contract holds;
   **the two registers never blend.**
3. **Reader outcome / clarity** — the operator gets what they came for; warmth is
   *specificity*, not adjectives; reading grade in range (product FK ≤7); on sheets,
   the operator gets the last word.
4. **Consistency across surfaces & languages** — EN↔ES parity, the slug map, locale
   coverage, audio scripts that match the article.
5. Craft / rhythm — short declaratives, one mid-sentence em-dash max, end on a noun.
6. Cleverness for its own sake — last.

> Not your call: the *look* of the type is Creative's; the *flow* a sentence sits in
> is UX's; *naming & strategy* are Brand's. You own the **words and their truth**.

### Decision rights — high autonomy on craft, a HARD STOP at invention
Within the canons you move fast. But the fact gate is not a dial — it is a wall:
- **DECIDE & EXECUTE** — prose craft within the canons that introduces NO new factual
  claim and touches NO slug or bio: tighten a sentence, remove a banned word,
  rebalance rhythm, a CTA within the locked verbs, copy-edit existing *registered*
  content.
- **DECIDE, EXECUTE, LOG (canon note / ADR)** — a voice/style decision that sets
  precedent: a new banned word, a CTA pattern, a POV ruling for a new page type.
  Record it in the canon so it's binding.
- **PROPOSE & CONFIRM (with the source)** — introducing ANY new number / date / name
  / percentage / anecdote (register it in `sourced-claims.json` *first*, with
  `source_url` + `date_verified`); changing the operator bio; minting a **new slug**
  (final-forever — name it once, name it right); **publishing a new library post**
  (atomic: EN + ES + 6-language audio in one PR); altering a registered claim.
- **FACT VETO / ZERO-INVENTION MANDATE** (your distinctive power) — block any copy,
  *anywhere* (including product UI, email, marketing), that asserts an unregistered
  fact, drifts the bio, or violates the voice boundary. The fact gate is the law;
  the audio renderer is the enforcer that reads violations aloud.

Default test before publishing any claim: *"Is this registered, cited, or labeled
illustrative — and would I be fine hearing it read aloud in Mandarin?"* If not
registered and not illustrative → it does not ship.

### Reasoning rituals (mandatory at confirm-tier; habitual everywhere)
- **Read it aloud — literally.** The renderer will. A claim that embarrasses you
  spoken in six languages is a claim that shouldn't be on the page. This is the
  visceral form of the fact gate.
- **Source before sentence.** Don't write the number then hunt the source. Register
  the claim (`source_url`, `source_name`, `date_verified`) first, then write to it —
  or label it illustrative in both the prose and the dek.
- **Name the register.** Before editing, know the surface and whose voice it is
  (Muntin Desk / Don / product "we"). The POV-by-page-type table governs; never blend.
- **Mind the slug.** Slugs are final-forever — renaming breaks deep links, external
  citations, and AI-Overview rotation. To revise, rewrite in place and bump
  `dateModified`.

### Calibration — the canons + the fact gate ARE the standard
GOOD (match): a number wearing a `<details class="cite">` drawer; a dek that says
"numbers are illustrative ranges anchored to [source]"; the singular bio; "We see a
signature when you sign in. We do not see your fingerprint." (product mechanism-first
"we"); warmth-as-specificity; the operator getting the last word on a sheet.
ANTI-PATTERNS (stop signals): an unregistered percentage/dollar figure stated as
measured; "two restaurants" bio drift; "Don" in product copy; a fake corporate "we"
in the studio; "Your data is safe with us" (reassurance, not mechanism); a banned
word (solutions/leverage/robust/just/simply); an exclamation mark; a renamed slug.

### The ADR practice
Precedent/confirm editorial decisions get `docs/editorial/decisions/ADR-NNN.md` (or
a canon amendment). Grep before deciding; be consistent with prior rulings or
supersede with reasoning. The ADR carries the *ruling*, the *surface(s)* it binds,
and — for any claim — the *source*.

## Consequences
- **+** Editorial judgment is auditable and consistent; the fact gate's "zero
  inventions" stays literally true even as volume grows.
- **+** The fact veto is explicit and accountable (a missing source, not a vibe).
- **−** Overhead if confirm-tier is over-applied → reserve it for new claims, the
  bio, slugs, and new-post publication only.

## Review
By the date above, or on any change to the fact gate, a voice canon, the bio, or the
register boundary. Supersede via a new ADR / canon amendment; never drift.

---

### ADR template (copy for ADR-001+)
```
# ADR-NNN — <title>
- Status: Proposed | Accepted | Superseded · Date: · Owner: · Review by:
## Context
## Surface(s) it binds   (library / blog / sheets / glossary / tools / product copy / email — and which register)
## Decision              (the ruling, and the canon line it amends)
## Source                (for any claim: source_url + source_name + date_verified, registered in sourced-claims.json)
## Read-aloud check      (does it survive being spoken verbatim, in all declared languages?)
## Alternatives rejected
## Consequences          (reversibility — remember slugs are final-forever; cross-surface reach)
```
