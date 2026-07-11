<!-- Durable capture of the founder's vision for the storefront reinvention
     (2026-07-11 session). Feeds the storefront-reinvention blueprint + the
     eventual implementation. Not web-routable. -->

# Founder vision — storefront reinvention

The strategic intent behind the full-site design/UX reinvention, in the founder's
own framing. This is the lens the reinvention blueprint and every implementation
phase must be measured against.

## The mandate

The storefront currently reads **emotionless** and lacks the **technicality and
design strength** of the category leaders (MarginEdge, Restaurant365, Toast).
We must make restaurant owners believe Muntin is **more trustworthy than these
longstanding incumbents** — with no brand legacy to lean on, **execution is the
proof**. Three levers:

1. **Differentiation** — lean on what makes us genuinely better (no per-order rake;
   no LLM in the invoice path, build-gated; data stays yours; pricing in writing;
   the public, sourced Cost Index).
2. **PII / data competence** — make it unmistakable, and visceral, that we are
   competent to hold customer PII + invoices safely.
3. **Cutting-edge design craft on every touchpoint** — technical expertise
   demonstrated through the design itself, everywhere.

Method: understand **how the leaders got to their standard**, reach it, then
**surpass it with better practices**. Every touchpoint considered; every line read
before reinventing.

## The emotional engine (the point of it all)

Cutting-edge craft is not decoration — it is a **feeling** we engineer in the user:

> **cutting-edge craft → the owner feels EMPOWERED** (ahead of their peers, in
> command of their costs, holding a technical superpower their competitors lack)
> **→ they keep using the product** because it makes them feel capable **→ they
> evangelize it** and become followers/advocates of the brand.

The design bar: every touchpoint must answer not only *"is this trustworthy?"* but
*"does using this make me feel like I just leveled up?"* — the same mechanism that
built cult followings for Superhuman, Linear, Ramp, Arc, Notion.

## North star (already in hand)

The real Muntin Ledger app (`Muntin-Invoice-Decoder/packages/ui/tokens.css`) already
has a financial-grade design system (Linear/Mercury/Ramp: slate ramp, electric-blue
#3b68f5, Inter + tabular numerics, serif retired from chrome, dark-first, hairline
depth; signature interactions italic-on-commit / window / bbox / scan). The
storefront should **extend this language site-wide**. The `/ledger/demo/` was already
re-skinned to it this session (commits incr. E/F) as the first proof.

## The design-language fork (confirmed 2026-07-11, incl. PR #501)

The site currently runs **two design languages**, and the reinvention must unify them:

- **App financial-grade** (slate + electric-blue #3b68f5 + Inter tabular, serif retired,
  dark-first) — the REAL app (`Muntin-Invoice-Decoder`) and, as of this session, the
  re-skinned `/ledger/demo/` (incr. E/F).
- **Warm editorial** (cream/ink + teal #2A50C8 + Fraunces serif) — the entire marketing
  site AND the freshly-redesigned Vendor Benchmark + Cost Index expansion in **PR #501**
  (verified: `#501` Vendor Benchmark uses `--teal` #2A50C8 ×49, Fraunces, `--cream/--ink-soft/
  --stone/--rust`; zero electric-blue / `--mun-*` / slate). Warm-editorial IS the
  "emotionless" register the founder flagged.

**Decision the mandate implies:** unify the whole storefront on the **app financial-grade
language** (cutting-edge, matches the product, delivers the empowerment feeling). The
warm-editorial surfaces — including #501's — become **re-pigment targets**, not rebuilds:
as the demo proved (incr. E), the neutral ramp already matches; only accent (teal→
electric-blue) and type (Fraunces→Inter) change, via scoped token overrides.

**PR #501 coordination:** let it merge — do NOT block/rework it. It lands a strong
Vendor Benchmark + Cost Index into `main`; those two surfaces then join the reinvention
re-pigment roadmap, and the pre-#501 audit of them is refreshed after merge.

## Guardrails the reinvention must never break

The absolute fact/honesty gates; EN↔ES parity; performance budgets; accessibility;
the ~249 CI gates. Trust is earned by discipline as much as by craft — a polished
site that overclaims would destroy the very trust we're building.
