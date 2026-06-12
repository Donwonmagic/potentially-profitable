# Token Spine — the vendor runbook

- **Status:** Authoritative (current). How the cross-repo design-token spine is owned,
  vendored, and kept honest. **Verified:** 2026-06-07 against live code.

> One palette, two registers, two repos, **no shared package registry**. The spine is
> kept in sync by a vendored copy + a hash lock, not by an npm dependency. This runbook
> makes the update mechanical so it stops being tribal knowledge.

## Who owns what

| | |
|---|---|
| **Canonical source** | `{product}` `packages/ui/muntin.tokens.json` — the product's `tokens.css` is the visual anchor (financial-grade slate + blue). |
| **Vendored copy** | `{site}` `data/muntin.tokens.json` — a byte copy of the canonical. |
| **Hash lock** | `EXPECTED_SPINE_HASH` (sha256 of the normalized token *values*, `$meta` + formatting ignored), pinned **identically** in both guards. |

The two registers share this palette and differ only by **typography, theme, and which
blue is primary** — never by surface color. Editorial warmth lives in type + layout, and
the Golden Hour accent (`#FFB020`/`#FF6B5C`) is **forbidden from the spine** (ADR-001;
`check-tokens-sync.mjs` enforces on this side, `check-editorial-accent-boundary.mjs` on
the product side).

## The guards

| Guard | Repo | Asserts |
|---|---|---|
| `check-tokens-sync.mjs` | {site} | site `:root` resolves to the spine **and** the vendored copy hashes to `EXPECTED_SPINE_HASH` |
| `check-tokens-parity.mjs` | {product} | `tokens.css` core+dark match the canonical **and** it hashes to `EXPECTED_SPINE_HASH` |
| `vendor-tokens.mjs --check` | {site} | the vendored copy still matches the hash pinned in the guard (also in `check-all.mjs`) |

If the two JSON copies ever diverge, **both** repos' CI fails with the same message —
fragile *by design*: it fails loud and safe.

## Updating the spine (the only sanctioned path)

1. Edit the **canonical** `{product}/packages/ui/muntin.tokens.json`.
2. From the **site** repo, re-vendor in one command (point at your local product checkout):
   ```sh
   node scripts/vendor-tokens.mjs --from ../Muntin-Invoice-Decoder/packages/ui/muntin.tokens.json
   ```
   This copies the file and **prints the new spine hash**.
3. Paste that hash into `EXPECTED_SPINE_HASH` in **both** guards
   (`{site}/scripts/check-tokens-sync.mjs` and `{product}/scripts/check-tokens-parity.mjs`).
4. Commit in **both** repos in the same change set. Done — `vendor-tokens.mjs --check`
   and both token guards go green.

**Before committing**, sanity-check the two copies are value-identical:
```sh
node scripts/vendor-tokens.mjs --diff ../Muntin-Invoice-Decoder/packages/ui/muntin.tokens.json
```

## Why not just publish an npm package?

A real `@muntin/tokens` package (registry + versioned consume) is the textbook fix and
remains the long-term option. It is **not** worth the registry/versioning/CI-publish
overhead for a two-surface, one-maintainer brand today. The vendored-copy + hash-lock +
this scripted vendor step gives the same guarantee (the copies cannot silently diverge)
at a fraction of the moving parts. Revisit if a third surface appears.
