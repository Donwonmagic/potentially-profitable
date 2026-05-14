# Fact-check rule

**Every numeric or specific factual claim in the library must fit one of three patterns.** If it doesn't fit any of them, it doesn't belong in the library.

## The three valid patterns

### 1. Sourced via `data/sourced-claims.json`

A registry of verified claims, each with a public source URL and a `date_verified` stamp. The article cites the claim in prose and is implicitly backed by the registry entry. The registry is the system-of-record for facts the library asserts.

When adding a new factual claim to an article:

1. Add an entry to `data/sourced-claims.json` under `claims.<short_key>`.
2. Include `claim`, `source_url`, `source_name`, `date_verified`, and `used_in` (the article slugs that cite it).
3. If the source's exact figure may shift over time, document that in `notes`.

### 2. Cited inline via `<details class="cite">`

For one-off citations that don't deserve a registry entry, drop a citation drawer immediately below the figure:

```html
<details class="cite">
  <summary>Source: [name]</summary>
  <div class="cite-body">
    <p><span class="cite-source">Source Name</span> &mdash; "Quoted title or document name."</p>
    <p>Additional context about what the source says and how the article uses it.</p>
  </div>
</details>
```

The component CSS lives in `assets/site-article.css` under the `.cite` selector group.

### 3. Labeled illustrative in the prose

For ranges, scenario walkthroughs, or operator-experience framings that aren't measurements:

- Use directional language: "rising, not flat" / "in the low double digits" / "single-digit dip" / "materially higher saves."
- Name the framing: "illustrative ranges," "scenario walkthrough," "operator practice."
- The figcaption of any chart should say so explicitly if the bars are directional, not measured.
- The `<header>` dek should set expectations: "This piece is a playbook, not a case study; numbers are illustrative ranges anchored to [source]."

## What's NOT allowed

The patterns below have all returned to the library as invented data in earlier waves. They are blocked at publish time by `scripts/check-fabrications.mjs`:

- Specific operator-economics percentages and dollar amounts presented as if measured (`$4,000 incremental margin`, `kept margin climbed 56%`, `1.4% complaint rate vs 0.2%`).
- Named datasets that don't exist (`paired-restaurant operating ledgers`, `AI Overviews citation-tracking`, `90 days of paired queries`).
- Specific cohort sizes followed by percentage distributions (`100-restaurant DMV cohort`, `four-cause distribution: 40% / 30% / 15% / 15%`).
- Quarterly AI Overview share trajectories outside the single registered measurement.
- Bio claims about restaurants Don doesn't currently run. Current bio is: full-time Front-of-House Manager at Tacombi in Bethesda. Past roles are in the `/about/` timeline and in `data/sourced-claims.json#operator_experience_claims.past_roles`.

## Why this exists

In May 2026, an editorial review caught widespread fabricated operator data across the May-2026 wave articles and the trust pages that backed them. The pattern was consistent: earlier waves drafted authoritative-sounding industry analysis, and to make the prose feel grounded, agents invented operating data and dressed it as first-party experience. The fabrications propagated to seven downstream surfaces (JSON-LD abstracts, OG descriptions, RSS, llms-full.txt, audio narration scripts, `/methods/`, `/about/`, the article-author-card bio injected across all 62 articles).

The production pipeline had no verification gate. This document, the sourced-claims registry, and the fabrication blocklist together are that gate.

## When in doubt

Cut. A clean article with one verified figure beats a confident article with three invented ones. The reader's trust is the only asset; the moment one invented fact is caught, every other claim is suspect too.
