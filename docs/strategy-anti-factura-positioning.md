<!-- Internal strategy note (NOT web-routable). Competitive positioning vs.
     Factura.ai. Honesty discipline: every external claim is labelled by
     confidence; nothing here is publish-ready until the egress caveat (below)
     is cleared and the named-vs-unnamed fork is decided by the founder. -->

# Anti-Factura positioning (internal strategy)

**Date:** 2026-06-26 · **Status:** internal positioning — NOT publish-ready
**Source:** background competitive audit (web research). **Egress caveat:**
`factura.ai` was blocked by this session's network policy (proxy 403 on CONNECT),
so the ToS / privacy / AI quotes below came via search-engine snippets + third
parties, **not** Factura's own pages loaded directly. **Before ANY public surface
references Factura, pull `factura.ai/terms-of-use` + `factura.ai/privacy-statement`
verbatim from an unrestricted network and re-confirm the wording.**

## Who Factura is (so we don't fight the wrong battle)
- **Factura.ai** (The Deposit Exchange Inc.; founder Bradley Bloch) — "accounts
  payable automation software designed for multi-unit and multi-entity
  businesses." Launched 2019.
- **Jobs:** invoice OCR + line-item capture, automatic GL coding, multi-location
  invoice splitting, approval routing, vendor payment, document storage.
- **Beachhead:** ~10+ location operators (QSR franchisees, hotel/hospitality
  groups, c-stores, grocery, cannabis). **Larger / multi-unit — NOT muntin's
  single-independent-operator niche.** We are not head-to-head; we contrast on
  *trust*, not feature parity.
- **Pricing:** from ~$50/location/mo. Integrates with R365, MarginEdge, Sage
  Intacct, NetSuite, QuickBooks. (Performance claims — "$1.3B processed," "90%
  touchless," "12x" — are vendor self-reported → **unverified**.)

## The data finding (the actual wedge)
- **Tech is OCR + machine learning that "continuously learns" and "learns from
  user GL-code corrections" — described as ML, NOT an LLM.** → We must **never**
  say "Factura uses an LLM / trains an LLM on your invoices." Unverified and
  likely false.
- **ToS data-rights language (via snippet, verify before quoting publicly):** an
  "irrevocable, worldwide… license… to access, collect, store and use any data…
  that you load… into the Factura Services" for purposes including to "fix,
  maintain, **enhance and modify** the Factura Services," plus "Aggregated
  Statistical Information for any purpose."
- **No discoverable** no-training commitment, trust center, or SOC 2 / ISO claim
  across factura.ai, G2, Crunchbase, Capterra. **This is an *absence*, framed as
  an absence — not evidence that they train on or sell customer data.**

## The honest "anti-Factura" = be the positive contrast (don't throw stones)

| Factura (as publicly described) | muntin's honest, earned-in-code equivalent |
|---|---|
| OCR + ML that learns from your corrections (your edits shape a shared model) | **Deterministic extraction — same input, same output; no model that drifts on your data** |
| ToS license to "store and use any data" to "enhance the Services" | **"Your data is yours" — never a language model, no LLM in the customer-data path** |
| "Aggregated Statistical Information for any purpose" | **No aggregate-for-resale clause; cohort insights (if ever) dormant until opt-in + k≥10 + ratios-only** |
| 90% "touchless," opaque coding | **Show-your-work: every number traceable + auditable, not black-box** |

**Sharpest TRUE contrasts (all things muntin can prove):** (1) deterministic,
no-LLM-in-the-data-path; (2) "your data is yours, never trained on"; (3)
show-your-work / auditable vs. black-box; (4) privacy-first independent-operator
tool vs. cloud-ingested multi-unit platform.

## Honesty guardrails (binding)
- **Don't** claim Factura "uses an LLM," "trains an LLM on you," "sells your data,"
  or "has no security." All unverified.
- **Do** state muntin's OWN verifiable commitments; where Factura is referenced,
  **quote the ToS verbatim** (after egress-verification) and frame absences as
  absences ("we found no published no-training commitment").
- **Don't** claim muntin is faster / more accurate — no benchmark exists. Stay on
  the trust/determinism axis.

## To EARN each contrast (must actually ship)
1. A publishable, plain-English **"we never train on your data / your data is
   yours / never a language model"** policy that is *true* of the Ledger/decoder
   data path.
2. A **deterministic, LLM-free extraction** path provable in code (the decoder's
   golden suite + a "no-LLM-in-the-data-path" architecture statement).
3. A working **show-your-work** extraction so "auditable vs. black-box" is
   demonstrable, not slogan.

## Recommended action (founder fork — see chat)
- **Default (safe, on-brand):** strengthen muntin's OWN trust surfaces (`/never`,
  `/security`, `/ai`, `/privacy`) with the no-training / deterministic / your-data
  commitments — **without naming Factura.** "Old-fashioned honest" is better served
  by stating true commitments than by attacking a named competitor.
- **Optional (needs founder go + egress-verified ToS + legal care):** a named
  comparison surface. Higher risk; only with verbatim-verified quotes.
