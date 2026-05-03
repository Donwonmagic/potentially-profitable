# Voice canon — Operator Sheets

This is the authoritative voice reference for any copy that ships in
`/sheets/<slug>/`, the `/sheets/` hub, the per-pack metadata in
`data/sheets.json` / `data/sheets.es.json`, and the prose that appears
in sheet fragments (field-help, callouts, error mirrors, draft
markers, recovery prompts).

If you are reviewing a PR that changes any of those surfaces, this
file is the spec. Lint catches a few mechanical things; everything
below is human-judgment.

## The reader

Operator paperwork is read by an operator. That operator has run a
kitchen, a host stand, or a back office for years. They have seen
1,000 forms. They can spot a generic template at 10 paces. They are
not a beginner; they are not a student; they are not a lead in a
funnel. They are a working adult who needs the sheet to do what it
says it does.

Treat them as such.

## The eight rules

### 1. Numbers first. Stories second. Adjectives last.

  - **In:** *"55–65% is the healthy band for full-service independents."*
  - **Out:** *"This is a really important number to track."*

### 2. Specific over vague.

  - **In:** *"Tuesday morning, closing the prior week. Before payroll. Before the produce reorder."* — three time anchors descending in scope.
  - **Out:** *"Use weekly to track your costs."*

### 3. Name the cause, not the symptom.

  - **In:** *"Forgetting employer payroll taxes inside labor — the result reads 4 to 6 points low."*
  - **Out:** *"Don't forget payroll taxes."*

### 4. Operator nouns. Never SaaS nouns.

  - **In:** the produce reorder · the kitchen lead · expo · the back door · the bar walk-in · the line · the host stand · the close
  - **Out:** your team · stakeholders · workflow · users · onboarding · synergies

### 5. Direct address only when warning of a result the operator will misread.

  - **In:** *"Do not skip — this is where prime cost reads low."*
  - **Out:** *"You should always include this!"* (exclamation point + chirp + generic "you").

### 6. Ranges, not vibes.

When a range exists, cite it. *"12–18% of wages,"* *"easily 90 cents per ticket,"* *"55–65%."* Never *"a small percentage,"* *"some operators,"* *"often."*

### 7. Past tense for what just happened. Present for what is true. No future tense for guarantees.

  - **In:** *"Cleared the Labor section."* · *"Voids running above 1% of sales."* · *"Healthy band: 55–65%."*
  - **Out:** *"Will save your work automatically!"*

### 8. The operator gets the last word.

When the sheet parses an input, surface what was understood. Never
silently overwrite.

  - **In:** *"I read this as $45.50. Tap to keep your text instead."*
  - **Out:** silent normalization to `45.50` with no echo.

## A consequence-named lexicon

The signature voice move is naming the consequence of an omission or
mistake. Examples already shipped in the catalog — these are the
template, not exceptions:

  - *"A waste log without dollars is a feelings journal."*
  - *"The bank can lose a slip; you cannot lose the number."*
  - *"The walk is the point; the signature is the proof."*
  - *"Cash that left the drawer needs a paper reason."*
  - *"The phone is dead, the WiFi is out — the printed sheet by the office phone is the safety net."*

When you write a new mistakes-bullet or field-help line, ask whether
it could fit on this list. If not, the line is probably documentation
rather than voice.

## In/Out — the quick reference

The cleanest mental model: would this line land in a Don blog post,
or in a SaaS onboarding email?

| In voice (Don's blog) | Out of voice (SaaS onboarding) |
|---|---|
| *"Tuesday morning, closing the prior week."* | *"Use this regularly!"* |
| *"A waste log without dollars is a feelings journal."* | *"Be sure to include cost data."* |
| *"Forgetting payroll taxes — the result reads 4 to 6 points low."* | *"Don't forget payroll taxes!"* |
| *"I read this as $45.50."* | (silent overwrite, no echo) |
| *"Picked up your draft from Saturday 8:42pm."* | *"Auto-saved ✓ Your work is safe!"* |
| *"Cleared the Labor section. Undo."* | *"Are you sure you want to delete? This cannot be undone!"* |
| *"3 of 5 sections — Sales, COGS, Labor done. Next: Sign-off."* | *"Great job! You're 60% complete!"* |
| *"Why this matters →"* (disclosure) | *"💡 Pro tip:"* |
| *"Stays in your browser."* | *"Privacy-first, GDPR-compliant!"* |

## ES localization rule

Translate the **framework**. Recast the **rhythm**.

Spanish allows shorter clauses than English makes natural. The line
*"un diario de sentimientos"* is the model — same image, native
cadence, not a literal *"un diario de feelings."*

Cap each ES bullet at the same beat-count as its EN counterpart, even
if the literal translation runs longer. Cut connector words rather
than expand. Use `usted/tú`-neutral phrasing that lands without
forcing a register choice.

Where a number, idiom, or platform name has a different operator
register in Spanish, use the operator's register, not the literal:

  - *"Net sales (sales tax included)"* → *"Ventas netas (sin IVA)"*, not *"sin sales tax."*
  - *"Tuesday morning"* → *"Martes en la mañana,"* not *"Martes por la mañana."* (when ES sheets cite the same operator practice as EN, the colloquial register matches what operators actually say.)
  - Platform names (Google Business Profile, DoorDash, OpenTable) stay in English. Function names (commission, prime cost) translate. Restaurant terms (expo, the line, the back door) translate to the local working register, not the dictionary.

## When inline guidance becomes patronization

Every popover, every helper line, every progress strip is a small
*let me explain that to you*. The cumulative effect matters more than
any single line.

Stop adding inline guidance when:

  - **Field-help is already on more than half the inputs in a fieldset.** If 3 of 5 labels carry help text, the fieldset reads as a tutorial. Help only the load-bearing one.
  - **The popover text is a paraphrase of the label.** *Voids ($)* with a popover that says "voided sales in dollars" adds nothing.
  - **The progress strip is the only thing that changes between visits.** If a sheet has nothing fresh to say about progress, do not invent something.
  - **The example is more interesting than the operator's reality.** Worked examples should sit at the boring middle of what operators actually run, not the most photogenic edge case.

## The test we run before shipping any new line

Read the line aloud to yourself. Then ask:

> *Would Don's chef-friend with twenty years on the line read this and feel respected, or talked down to?*

If the answer is "respected," ship it. If the answer is anywhere
else — even halfway — cut the celebratory adjective and try again.
If the answer is "talked down to," delete the line and let the
operator's experience do the work.

## What this canon does NOT cover

  - Visual treatment (covered by the Muntin brand canon: tokens, type, status palette)
  - Computational behavior (covered by `data/benchmarks.json` + per-sheet recalc functions)
  - Architectural decisions (covered by `/system/` and the build pipeline docs)

This file covers prose that an operator reads. Everything else is
elsewhere.
