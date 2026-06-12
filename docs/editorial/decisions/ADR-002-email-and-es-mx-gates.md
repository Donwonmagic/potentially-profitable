# ADR-002 — Email gate coverage + es-MX register gate (product)

- **Status:** Accepted
- **Date:** 2026-06-08
- **Owner:** Editorial Lead
- **Review by:** 2026-09-08
- **Relates to:** ADR-000; ground-truth seams #1 (email, closed) and #3 (product-ES, partial)

> Decision: bring the product's transactional + digest **email** under the same
> banned-phrase and reading-grade gates the product UI already passes, and machine-check
> the es-MX **tuteo** register.

## Email (seam #1)

Email was Register B copy scanned only by `check-voice-boundary` (the "Don" check); the
brand's banned phrases and the FK ≤ 7 bar stopped at `copy.ts` + routes. A digest reaches
the operator directly and is rarely re-read.

- `check-verboten-phrases`: added `email.ts` + the two digest builders to `TARGETS`
  (same set as voice-boundary). Passes clean — email copy was already on-voice.
- `check-copy-grade`: grades the email files. Customer prose lives in double-quoted
  `*_COPY` objects (the shape the extractor handles); a prose filter drops
  HTML/CSS/attribute/URL/single-token strings, and Spanish strings are skipped (FK is
  English-calibrated, the `copy.es.ts` rationale). One internal admin-triage string is
  dated-allowlisted. 5 bundles, all ≤ grade 7.

Both gates already run in CI node-lints — no new wiring.

## es-MX register (seam #3, machine part)

The es-MX canon (`docs/voice-es-mx.md` §5) mandates the informal singular **tú** +
imperative; the formal **usted** "no encaja" — except the contractual `docs/es/` legal
voice, which uses it on purpose.

- `scripts/check-voice-es-mx.mjs` (new, wired into node-lints): blocks the formal
  singular pronoun `usted` on the operative surfaces (`copy.es.ts` + email). **Load-bearing
  nuance:** word-bounded `\busted\b` never matches **`ustedes`** — in es-MX that is the
  ordinary *informal plural* "you" (no "vosotros"), so it is correct register. `docs/es/`
  is out of scope by construction. Passes clean (forward protection).

## Status / residual

Seam #1 closed. Seam #3 is **partial**: the register is gated, but the es-MX canon is
still draft v0.1 pending a human **bilingual review** (Don) — so scorecard Dim 4 stays at
2 until that lands. Formal-imperative detection (Confirme/Envíe/Abra) and a Spanish
reading-grade heuristic are follow-ons.

## Note on history

These gates were first built earlier in the engagement but on a branch that diverged from
`main` while the Brand lead merged overlapping banned-vocab work. They were re-applied
cleanly on current `main` here; they are self-contained (no dependency on the proposed
shared catalog — see ADR-004).
