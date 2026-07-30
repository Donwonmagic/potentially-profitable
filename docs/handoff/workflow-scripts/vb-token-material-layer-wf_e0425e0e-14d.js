export const meta = {
  name: 'vb-token-material-layer',
  description: 'Build the VB --vb-* material/type token substrate, then adversarially verify (theme paths, regression, a11y, gates)',
  phases: [
    { title: 'Build', detail: 'implement the token + material layer, both locales' },
    { title: 'Verify', detail: 'adversarial: theme-paths, regression, a11y/parity' },
    { title: 'Synthesize', detail: 'verdict + required fixes' },
  ],
}

const CONTEXT = `
Repo /home/user/potentially-profitable, branch claude/vendor-benchmark-redesign-yn273q. Static site,
vanilla CSS in an inline <style> block inside tools/vendor-benchmark/index.html (~300 lines of VB CSS)
and its mirror es/tools/vendor-benchmark/index.html. This is Phase-1 item "Establish the --vb-* material +
elevation + type token layer" of the Vendor Benchmark redesign — the shared visual substrate every later
component builds on. It is a VIEW change: touch CSS + class hooks only, never the honesty math, the JS
controller logic, or any network behavior.

## The visual direction (from the redesign panel) — a four-material "market instrument" system
1. INVOICE DESK — the input panel on warm paper (--vb-desk light #FBFAF7 / dark #191B1E) with a gold-derived
   hairline (--vb-desk-edge) and ledger-rule dated-price rows (--vb-rule). Warm confined to a hairline + a
   very-low-opacity tint on the INPUT zone only — NEVER a cream body fill, NEVER serif-on-cream (stay clear
   of the AI cream+terracotta cliche).
2. INSTRUMENT READOUT — the verdict panel raised to --elev-2 with a 2px tone-colored top bezel + a very-light
   tone tint wash. Hero = the rate-of-change gap number, tabular Fraunces at --vb-fs-verdict clamp(40px,8vw,68px).
3. MARKET WELL — the chart recessed onto --surface-inset with an inset shadow (--vb-well-inset), faint
   teal-derived gridlines (--vb-grid) and an emphasized indexed-to-100 baseline (--vb-grid-100).
4. LEDGER TAPE — receipt/attribution/timeline in a zero-DOWNLOAD system monospace stack
   (--vb-font-mono: ui-monospace,'SF Mono',Menlo,Consolas,monospace).
Type ladder collapses to a disciplined scale (display / verdict-number / stat-number / card-title / body /
meta / eyebrow) using the fluid --fs-* site tokens where they exist; FOUR weights only (400/500/600/700).
Verdict tone semantics are REUSED verbatim from the site: over=--rust, under=--teal, match=--status-good,
watch=--status-warn. A separate non-semantic --vb-signal (teal-cyan) is for compute-scan chrome / active
combobox row ONLY — NEVER a verdict number. Zone spacing tokens: --vb-zone-gap 28px / --vb-cluster-gap 14px
/ --vb-stat-gap 8px.

## Existing tokens to integrate with (verified)
- VB inline :root has: --cream #F6F7F8, --cream-2 #EDEEF1, --ink #16181D, --ink-soft #4A4F59, --teal #2A50C8,
  --font-display ('Fraunces',...serif), --font-body ('Inter',...sans), --stone #6B7280, --line, --teal-dark.
- The site CSS (assets/site-core.css, site-tool.css, site.css) defines with LIGHT + DARK values:
  --surface-inset (light #EDEEF1 / dark #21262E), --elev-1, --elev-2, --rust (light #C42E2E / dark #F0796A),
  --status-good/--status-warn (+ -tint/-deep), --ink (light #16181D / dark #F1EDE5). READ these files for the
  exact scale + the --fs-* fluid sizes before authoring.

## HARD CONSTRAINTS
- Every new --vb-* color/elevation token MUST declare all THREE theme paths so nothing recreates the old
  market-gap-panel dark-mode break: the default (light), @media (prefers-color-scheme: dark), AND
  :root[data-theme="dark"] (the site's explicit toggle stamps data-theme and must win), plus sensible
  grayscale under @media print. Mirror the pattern the site CSS already uses.
- NO regressions: the tool must look/work the same or better; do not remove or restyle functional elements,
  only re-materialize the three zones (recess input desk + evidence onto --surface-inset, raise readout to
  --elev-2, recess the chart) and define the tokens. Keep the ~10 literal font-sizes replaced by the scale
  where safe, but do not change any COPY.
- No CDN font/icon: --vb-font-mono is a system stack; Fraunces/Inter are already self-hosted.
- EN and ES index.html get the IDENTICAL CSS block (locale-parity is gated).
- Must pass: check-banned-words, check-locale-parity, check-fabrications, and the image/CLS gates.

## YOUR TASK (Build phase)
Edit BOTH tools/vendor-benchmark/index.html and es/tools/vendor-benchmark/index.html: add the --vb-* token
:root block (with all theme paths) near the existing :root in the inline <style>, and apply the material
recession/elevation to the input desk, the result/readout container, and the chart container using the new
tokens + the existing --surface-inset/--elev-2. Keep it additive and safe. Report: the token block you added,
which selectors you re-materialized, and confirm both locales are byte-identical in the CSS you changed.
`

const buildReport = await agent(`${CONTEXT}\n\nDo the Build task now. Edit the two files directly. When done, output a concise report: the --vb-* :root block, the selectors you changed, and a note confirming EN/ES CSS parity and that no copy/JS/logic changed.`,
  { label: 'build:token-layer', phase: 'Build', effort: 'high' })

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    lens: { type: 'string' },
    issues: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
      problem: { type: 'string' }, where: { type: 'string' }, fix: { type: 'string' },
    }, required: ['severity', 'problem'] } },
    verdict: { type: 'string', enum: ['clean', 'fix-needed'] },
  },
  required: ['lens', 'issues', 'verdict'],
}

const VERIFY = [
  { key: 'theme-regression', brief: `Lens: THEME PATHS + REGRESSION. Run \`git --no-pager diff tools/vendor-benchmark/index.html es/tools/vendor-benchmark/index.html\`. Verify EVERY new --vb-* color/elevation token declares light + prefers-color-scheme dark + :root[data-theme=dark] + print, and that dark mode is coherent (no light-on-light or invisible text). Verify NO existing selector's behavior was broken (spot-check the input rows, buttons, result blocks still have sane color/contrast in both themes). Flag any token missing a theme path or any regression.` },
  { key: 'a11y-parity', brief: `Lens: A11Y + LOCALE PARITY. Confirm the EN and ES CSS blocks are identical (diff them). Confirm no contrast regression (text on the new --vb-desk / --surface-inset must clear WCAG AA — the earlier fix moved micro-labels to --ink-soft; ensure that still holds). Confirm no copy changed (only CSS/classes). Run node scripts/check-locale-parity.mjs and node scripts/check-banned-words.mjs and report exit codes.` },
  { key: 'skeptic', brief: `Lens: SKEPTIC / SCOPE. Did the implementer touch anything it shouldn't — the JS controller, the honesty math, copy, or network behavior? Is this genuinely just a token+material CSS layer, or did it over-reach into Phase-2 component redesign (which should NOT happen yet)? Is the --vb-signal kept OFF verdict numbers? Any AI-design-cliche creep (cream body fill, serif-on-cream, gradient)? Run node scripts/check-fabrications.mjs. Report the single biggest risk.` },
]

const reviews = await parallel(VERIFY.map((v) => () =>
  agent(`${CONTEXT}\n\n### The implementer reported:\n${buildReport}\n\n${v.brief}\n\nGround every claim in the actual diff/files. Return structured findings.`,
    { label: `verify:${v.key}`, phase: 'Verify', schema: VERDICT_SCHEMA })
))

const synth = await agent(`${CONTEXT}\n\nBuild report:\n${buildReport}\n\nVerifier findings:\n${JSON.stringify(reviews.filter(Boolean), null, 1)}\n\nYou are the synthesizer. Summarize: is the token/material layer sound and regression-free, or what MUST be fixed before commit? List concrete required fixes (if any) in priority order, and confirm which hard constraints are met.`,
  { label: 'synthesize', phase: 'Synthesize', effort: 'high' })

return { buildReport, reviews: reviews.filter(Boolean), synthesis: synth }
