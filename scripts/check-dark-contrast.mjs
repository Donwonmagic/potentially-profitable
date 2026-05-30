#!/usr/bin/env node
/**
 * check-dark-contrast.mjs — WCAG AA guard for the dark-mode palette.
 *
 * The site's contrast was historically only ever tuned on the cream (light)
 * surfaces; dark mode (OS preference or the [data-theme="dark"] toggle) had
 * no contrast gate, which is how the 2026-05-30 low-contrast regression
 * shipped (nav wordmark, outlined buttons, FAQ rows, eyebrows all failing in
 * dark mode). This locks the dark surface ramp + foreground tokens to AA.
 *
 * It checks the ACTUAL token values declared in assets/site.css (the
 * --refresh-* dark ramp), so if someone edits a value below AA the gate
 * fails. Zero-dep; same posture as the product's check-contrast.mjs.
 *
 * Thresholds: normal text 4.5:1, large text / UI component & graphics 3:1.
 *
 * Run:        node scripts/check-dark-contrast.mjs
 * Self-test:  node scripts/check-dark-contrast.mjs --self-test
 * CI:         scripts/check-all.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_CSS = path.join(__dirname, "..", "assets", "site.css");

function lin(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function L(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a, b) {
  const la = L(a), lb = L(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Read a base-palette token value from the dark token-flip block. The dark
 * theme remaps the base tokens (--ink, --cream, …) at the [data-theme="dark"]
 * root INSIDE the GEN:dark-mode block; that's the canonical dark ramp now.
 */
function tokenValue(css, name) {
  const gen = css.slice(css.indexOf("GEN:dark-mode:start"));
  // The flip block is the [data-theme="dark"]{…} that declares --ink (the
  // palette remap), not the inverted-surface scope-restore (which restores
  // --ink to the LIGHT value). Anchor on the remap block specifically.
  const start = gen.indexOf(':root[data-theme="dark"]{');
  const block = gen.slice(start, start + 1200);
  const m = new RegExp(`--${name}\\s*:\\s*(#[0-9A-Fa-f]{6})`).exec(block);
  return m ? m[1] : null;
}

function main() {
  if (process.argv.includes("--self-test")) {
    // White-on-black must pass; mid-gray-on-black must fail at 4.5.
    const ok = ratio("#FFFFFF", "#000000") >= 4.5;
    const bad = ratio("#595959", "#000000") < 4.5;
    if (!ok || !bad) {
      console.error("✗ check-dark-contrast self-test FAILED", { ok, bad });
      process.exit(1);
    }
    console.log("✓ check-dark-contrast self-test passed");
    return;
  }

  const css = fs.readFileSync(SITE_CSS, "utf8");
  // The dark theme flips the base palette tokens. Read the remapped values.
  const tok = {
    bg: tokenValue(css, "cream"), // page background
    s1: tokenValue(css, "white"), // raised cards
    s2: tokenValue(css, "cream-2"), // inset fills
    text: tokenValue(css, "ink"),
    soft: tokenValue(css, "ink-soft"),
    stone: tokenValue(css, "stone"),
    stone2: tokenValue(css, "stone-2"),
    accent: tokenValue(css, "teal"),
    accentDeep: tokenValue(css, "teal-dark"),
    rust: tokenValue(css, "rust"),
    lineDark: tokenValue(css, "line-dark"),
    lineInput: tokenValue(css, "line-input"),
    statusGood: tokenValue(css, "status-good"),
    statusWarn: tokenValue(css, "status-warn"),
  };

  const missing = Object.entries(tok).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error(`✗ check-dark-contrast: missing dark base token(s): ${missing.join(", ")}`);
    process.exit(1);
  }

  // [fg, bg, minRatio, label] — text 4.5:1, borders 3:1.
  const checks = [
    [tok.text, tok.bg, 4.5, "ink text on page"],
    [tok.text, tok.s1, 4.5, "ink text on card"],
    [tok.text, tok.s2, 4.5, "ink text on inset"],
    [tok.soft, tok.bg, 4.5, "ink-soft on page"],
    [tok.soft, tok.s1, 4.5, "ink-soft on card"],
    [tok.stone, tok.bg, 4.5, "stone on page"],
    [tok.stone, tok.s1, 4.5, "stone on card"],
    [tok.stone2, tok.s1, 4.5, "stone-2 (placeholder) on card"],
    [tok.accent, tok.bg, 4.5, "accent link on page"],
    [tok.accent, tok.s1, 4.5, "accent link on card"],
    [tok.accentDeep, tok.bg, 4.5, "accent-deep on page"],
    [tok.rust, tok.bg, 4.5, "rust on page"],
    [tok.statusGood, tok.s1, 4.5, "status-good on card"],
    [tok.statusWarn, tok.s1, 4.5, "status-warn on card"],
    // Inverted (light) primary pill: dark ink text on the light pill.
    ["#16181D", tok.text, 4.5, "primary-pill ink on light pill"],
    // Form/control borders (3:1 graphics threshold).
    [tok.lineInput, tok.s1, 3.0, "input border on card"],
    [tok.lineDark, tok.s1, 3.0, "strong border on card"],
  ];

  const fails = [];
  for (const [fg, bg, min, label] of checks) {
    const r = ratio(fg, bg);
    if (r < min) fails.push(`${label}: ${fg} on ${bg} = ${r.toFixed(2)}:1 (need ${min}:1)`);
  }

  if (fails.length) {
    console.error(`✗ dark-contrast: ${fails.length} pair(s) below WCAG AA:`);
    for (const f of fails) console.error("  - " + f);
    console.error("\nFix the dark token values in scripts/build-dark-mode.mjs (the DARK map), then regenerate.");
    process.exit(1);
  }
  console.log(`✓ dark-contrast: ${checks.length} dark-mode token pairs pass WCAG AA (text 4.5:1, borders 3:1)`);
}

main();
