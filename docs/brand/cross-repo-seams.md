# Cross-Repo Seams — the coupling map

- **Status:** Authoritative (current). The single inventory of every point where the
  studio (`{site}` = muntin.digital) and the product (`{product}` = Muntin Ledger,
  app.muntin.digital) touch.
- **Verified:** 2026-06-07 against live code. **Owner:** Brand & Cohesion Lead.
- **Supersedes** the seam claims in `ground-truth-pack.md §6` where they disagree (this
  doc was written from a fresh code audit; some §6 claims were aspirational).

> Two repos, two deploys, one brand and one funnel. These seams are load-bearing: a
> drifted link breaks attribution or the entity graph silently, across a repo boundary
> where no single build sees both sides. This map + `check-cross-repo-seams.mjs`
> ({product}) make the drift-prone ones un-regressible.

## Canonical constants

| Constant | Value | Owner |
|---|---|---|
| Studio origin | `https://muntin.digital` | {site} |
| Product origin | `https://ledger.muntin.digital` (`NEXT_PUBLIC_SITE_URL`) | {product} |
| Shared business entity `@id` | `https://muntin.digital/#business` | {site} (declared 777×) |
| Cross-product contact | `hello@muntin.digital` | both |
| Contact route (studio "Window") | `https://muntin.digital{/es}/window?source=ledger` | {product} → {site} |
| Studio→product CTA target | `https://ledger.muntin.digital` | {site} |

Role addresses (`privacy@`, `security@`, `legal@`, `accessibility@`, `ops@`, …) are
**product-specific** and legitimate — only `hello@` is the shared cross-product contact.

## The seams (verified)

### Studio → Product
- `{site}/data/ledger-cta.json` + `scripts/inject-ledger-cta.mjs` — per-article end CTA
  routing high-intent library readers to `ledger.muntin.digital`. Click fires the
  Plausible **"Ledger Route Click"** event (declarative `plausible-event-*` class API,
  bounded `source` prop). EN + ES.
- Nav / footer CTA → `ledger.muntin.digital`.

### Product → Studio
- Contact routes to the studio "Window": `MarketingFooter.tsx`, `BookkeeperBody.tsx`,
  `hablanos/page.tsx`, `talk-to-us/page.tsx`, `app/page.tsx` — all
  `muntin.digital{/es}/window?source=ledger` (8 uses / 5 files). **`source=ledger` is the
  attribution invariant** — gated.
- `MarketingFooter` renders `<BrandLockup/>`; contact + error surfaces use
  `hello@muntin.digital` (root org schema `email` + `contactPoint`; `@muntin/ui`
  ErrorBanner).
- Root `Organization` JSON-LD (`apps/web/app/layout.tsx`): `@id`
  `…ledger.muntin.digital/#organization`, `legalName "Muntin Digital"`,
  `parentOrganization` now carries the canonical **`@id https://muntin.digital/#business`**
  — so the product's parent IS the studio's business entity (one brand graph, not two).

## Audit corrections (what `ground-truth-pack.md §6` got wrong)

- **"Shared Org @id":** previously stated as a shared fact. At audit the product had
  **zero** references to `…/#business`; it described its parent by name+url only. Fixed
  this cycle by anchoring `parentOrganization.@id` to the canonical business id, and
  gated so it can't drift back.
- **"Funnel event names must match across repos":** they don't, and don't need to — the
  two surfaces use **different** analytics by design. {product} emits a custom funnel
  (`funnel.*` via `funnel-emit.ts` → `api.muntin.digital/v1/funnel`); {site} marks the
  cross-link with its Plausible **"Ledger Route Click"** event. There is no shared
  `funnel.*` vocabulary to enforce. (Unifying analytics is a product/analytics decision,
  not a brand-cohesion one — logged, not actioned.)

## Enforcement

`{product}/scripts/check-cross-repo-seams.mjs` (in `ci.yml`), `--self-test`:
1. every studio `/window` link carries `?source=ledger` (attribution);
2. the root org's `parentOrganization` uses the canonical business `@id`;
3. the canonical contact `hello@muntin.digital` is present in the root org schema.

No `{site}` gate this cycle — the site already declares the canonical `@id` consistently
(777×, template-generated) and routes via `ledger-cta.json`. A site-side `@id`-consistency
check is a possible future hardening (low value: already consistent).
