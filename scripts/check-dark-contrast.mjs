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

/** Read a --refresh-* token value from the [data-theme="dark"] :root block. */
function tokenValue(css, name) {
  // The explicit-override declaration block holds the canonical values.
  const block = css.slice(css.indexOf(':root[data-theme="dark"]{'));
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
  const T = {};
  for (const n of [
    "bg", "surface-1", "surface-2", "text", "text-soft", "accent", "line-strong", "line",
  ]) {
    T[n] = tokenValue(css, n) || tokenValue(css, n.replace("-", "-"));
  }
  // Map the short names the loop expects.
  const tok = {
    bg: tokenValue(css, "refresh-bg"),
    s1: tokenValue(css, "refresh-surface-1"),
    s2: tokenValue(css, "refresh-surface-2"),
    text: tokenValue(css, "refresh-text"),
    soft: tokenValue(css, "refresh-text-soft"),
    accent: tokenValue(css, "refresh-accent"),
    lineStrong: tokenValue(css, "refresh-line-strong"),
  };

  const missing = Object.entries(tok).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error(`✗ check-dark-contrast: missing --refresh-* token(s): ${missing.join(", ")}`);
    process.exit(1);
  }

  // [fg, bg, minRatio, label]
  const checks = [
    [tok.text, tok.bg, 4.5, "text on bg"],
    [tok.text, tok.s1, 4.5, "text on surface-1"],
    [tok.text, tok.s2, 4.5, "text on surface-2"],
    [tok.soft, tok.bg, 4.5, "text-soft on bg"],
    [tok.soft, tok.s1, 4.5, "text-soft on surface-1"],
    [tok.soft, tok.s2, 4.5, "text-soft on surface-2"],
    [tok.accent, tok.bg, 4.5, "accent on bg"],
    [tok.accent, tok.s1, 4.5, "accent on surface-1"],
    [tok.accent, tok.s2, 4.5, "accent on surface-2"],
    // Light primary pill: dark ink text on the --text-colored pill.
    ["#16181D", tok.text, 4.5, "primary-pill ink on light pill"],
    // UI borders / chevrons (3:1 graphics threshold).
    [tok.lineStrong, tok.bg, 3.0, "line-strong border on bg"],
    [tok.lineStrong, tok.s1, 3.0, "line-strong border on surface-1"],
  ];

  const fails = [];
  for (const [fg, bg, min, label] of checks) {
    const r = ratio(fg, bg);
    if (r < min) fails.push(`${label}: ${fg} on ${bg} = ${r.toFixed(2)}:1 (need ${min}:1)`);
  }

  if (fails.length) {
    console.error(`✗ dark-contrast: ${fails.length} pair(s) below WCAG AA:`);
    for (const f of fails) console.error("  - " + f);
    console.error("\nFix the --refresh-* values in assets/site.css (the [data-theme=\"dark\"] block).");
    process.exit(1);
  }
  console.log(`✓ dark-contrast: ${checks.length} dark-mode token pairs pass WCAG AA (text 4.5:1, borders 3:1)`);
}

main();
