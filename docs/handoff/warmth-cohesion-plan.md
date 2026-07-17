<!-- Warmth & cross-surface cohesion plan. Founder vision (2026-07-17): make the whole
     site feel warmer / more emotion / native / built-for-each-user / built into their
     browser / every surface talking to each other. Synthesized from an 8-agent grounded
     workflow (warmth-cohesion-ground-design) + the every-surface-map.md register table,
     adversarially critiqued. This is the decision record; update as moves ship. -->

# Warmth & cohesion — the plan

## The direction (the through-line)

**Warmth is light through the pane, not paint on the wall.** Every warm signal is computed
on the reader's OWN device from what their browser already knows — OS theme, locale, local
clock, `prefers-reduced-motion`, and the trail they themselves left in `localStorage` — and
**sent nowhere**. The personalization IS the privacy moat, not a trade against it. No new color
system, no greeting-by-name, no server profile. Warmth is delivered as **specificity and
continuity** (the operator's real clock; the ingredient they were just reading; a theme choice
that survives the crossing to the app) — never as adjectives or hype. Every move is additive,
reversible, and **degrades to exactly today's certified v3** when JS is off, storage is blocked,
motion is reduced, or a mount point is absent.

This layers on top of `every-surface-map.md`'s two already-documented intents: the **"trust-
defensiveness → ambient" pivot** (the founder's emotional pivot — stop arguing about ourselves,
speak to the person at the point of decision) and the **per-surface "register"** table (home =
live control room, about = a person's dossier, sign-in = the quiet threshold, course = a free
thing Don made). The palette-warmth ("re-pigment") is DONE — v3 shipped. What's open is the
**behavioral/experiential** warmth + device-local personalization.

**Key found asset:** a purpose-built **Golden Hour** warm token layer already exists at
`assets/site-core.css:21-41` (`--light-marigold`, `--gradient-goldenhour`, `--glass-warm`,
section-rhythm tokens) — declared additive + ungated + deliberately exempt from both the locked
cool-spine sync gate and the retired-warm blocklist. It is the sanctioned warmth vehicle; we
modulate it with a device signal, we do not invent a palette.

## Warmth primitives (the composable pieces)

1. **`warmth.js`** — one new fetch-free module in the footer `FOOTER_ASSETS` (loads every page),
   composing only on-device signals (`window.muntin.firstTouch()/session()`, matchMedia theme +
   reduced-motion, local hour, `Intl` timezone, `navigator.languages`, defensive localStorage
   reads) and decorating opt-in `[data-warmth-*]` mounts. No-op when a signal or mount is absent.
   Owns shared `ALLOW_MOTION` + safe-storage helpers so every warmth touch is motion- and
   quota-safe by construction. **The strongest move** — it makes the "on-device = privacy" thesis
   literally true and every later move a one-line hook, not new plumbing.
2. **Golden-Hour clock modulation** — a device-clock time-of-day class modulating ONLY the
   intensity/hue of the already-declared `--gradient-goldenhour` wash. No new color, no layout, no
   text. (Contrast-gated; see Fork 1 for loudness.)
3. **Cross-subdomain `mun_pref`** — one first-party `.muntin.digital` cookie carrying `{theme,
   locale}` so a dark+ES choice on the storefront arrives dark+ES in the app. (See Fork 3; note the
   critique's correction — a domain cookie IS transmitted each request, so "sent nowhere" is false
   for this one; needs a `/cookies` + privacy note.)
4. **Continuity trail** — a bounded, capped, TTL'd on-device visit-trail + a quiet "where you left
   off" chip. **The load-bearing warmth — and the biggest risk** (see Fork 2 / Claim-8).
5. **Reassurance-beat motion** — compositor-only (transform+opacity) confirmation grammar +
   `aria-live` on moments that currently confirm silently (theme swap, copy/cite/save), + a
   focus-visible warmth halo as a SECOND box-shadow that never weakens `--ring-focus`. Auto-
   neutralized by the global reduced-motion cap.

## The moves (ranked; verdict from the adversarial critique)

| # | Move | Eff | Verdict | In-container |
|---|---|---|---|---|
| 1 | Fix the royal-we POV in the founding-form error (EN+ES) — "I'll add you by hand" | S | **KEEP — SHIPPED** | ✅ |
| 2 | `warmth.js` site-wide substrate + shared motion/storage helpers | M | **KEEP (strongest)** | ✅ |
| 3 | Golden-Hour clock modulation of the hero wash | M | REVISE (whisper + contrast) | ✅ |
| 4 | `mun_pref` cross-subdomain theme+locale cookie | L | REVISE (cookie IS sent; +`/cookies`) | dev-env |
| 5 | Theme-swap cross-fade + reassurance beats (copy/save/cite) | M | **KEEP** | ✅ |
| 6 | Visit-trail writer + "where you left off" chip | M | **REVISE — borders on CUT** (Claim-8) | ✅ |
| 7 | Close the Cost-Index loop: tool card → its own reference page | S | **KEEP (best cohesion/effort)** | ✅ |
| 8 | Cross-link weekly dispatch ↔ per-ingredient reference pages | M | **KEEP** (name only, generator) | ✅ |
| 9 | Tools read `?from` and echo one locale-aware continuity line | M | REVISE (EN+ES + registered title map) | ✅ |
| 10 | Warm the plate-cost empty state + confirm coda (EN+ES) | S | **KEEP** | ✅ |
| 11 | Visible tool breadcrumb + Window field-notes empty voice | S | **KEEP** | ✅ |
| 12 | Time-aware Cost Index cadence reframe vs the local clock | S | REVISE (derive live edition from real asOf) | ✅ |

**Also (P0 honesty defect the every-surface-map flagged — the OPPOSITE of warm/native):** the
founding-capture handler fires the success confirm on a 4xx/5xx (`fetch` resolves on error). A
warm site cannot fabricate "check your inbox" on a 500. The sign-in/account flow (`res.ok` check +
persistent error) is the gold standard to copy. Fold into Phase 1.

## Phased plan

- **Phase 1 (all in-container verifiable):** Move 1 (done), Move 2 (inert substrate + helpers,
  prove no-op under JS-off/storage-blocked/absent-mount), Moves 7/10/11 (copy + reciprocal-link +
  breadcrumb — no signal needed), + the fabricated-success handler fix. Gate: check-locale-parity,
  check-fabrications, check-contrast, article-graphics, + a Playwright reduced-motion + focus-ring pass.
- **Phase 2 (on-device warmth made visible):** Move 5 (theme cross-fade + beats), Move 3 (Golden-
  Hour whisper, contrast-gated), Move 6 (only if Fork 2 clears Claim-8), Move 12 (real-asOf reframe).
  Verify contrast + CLS/LCP (translateY not height; never opacity-gate the LCP hero) + empty-signal no-op.
- **Phase 3 (cross-property / generator):** Move 4 (`mun_pref`; storefront half in-container, app half
  needs the Next.js dev env + a real cross-domain browser walk), Move 8 (dispatch↔ingredient generator),
  Move 9 (`?from` title map). Vendor shared token/brand-mark specs as checked-in artifacts per repo, not
  a live cross-repo deploy dependency.

## The genuine founder forks (yours to decide — see the chat)

1. **Golden-Hour loudness** — whisper (rec) / felt shift / skip time-of-day.
2. **Claim-8 & continuity (the biggest risk).** The "where you left off" chip contradicts the
   published, machine-readable `security/` Claim-8: *"no account, no saved history, no 'welcome back'
   — unless you sign in to the optional Workshop."* Options: (A) no anonymous continuity cue, honor the
   Claim literally; (B) device-local chip explicitly framed "your browser remembered — we didn't" (the
   critique says copy can't override a schema.org Claim); (C) reconcile/amend Claim-8; **(D) scope
   continuity to the signed-in Workshop only — the promise's own exception already ALLOWS it.** Rec: D
   (honest for anonymous, warm for signed-in) or A.
3. **Cross-subdomain cookie** — one first-party `.muntin.digital` `{theme,locale}` cookie (rec, gated
   behind the dev-env walk) / CTA locale-param only / leave the crossing as-is.

## Biggest risk (from the critique)

Move 6 vs Claim-8 (above). Shipping an anonymous welcome-back turns the honesty moat into a caught,
machine-readable contradiction. Do not ship any continuity cue until Fork 2 is decided.
