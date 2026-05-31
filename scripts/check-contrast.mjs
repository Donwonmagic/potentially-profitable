#!/usr/bin/env node
/**
 * WCAG contrast gate for the section-rhythm surface system.
 *
 * The 2026 "section rhythm" redesign separates page sections with
 * alternating surface tiers + a crisp hairline, in both light and dark.
 * This gate proves the system stays inside WCAG AA: every text-on-surface
 * pair the system introduces is computed in BOTH themes and the build
 * fails on any violation (4.5:1 normal text; 3:1 large text / non-text).
 *
 * It also locks the canonical token values below to assets/site.css so
 * the palette can't silently drift out of compliance. Divider visibility
 * is reported (warn) — a hairline isn't a WCAG-required component, but a
 * too-faint one defeats the redesign's purpose.
 *
 *   node scripts/check-contrast.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(REPO, "assets/site.css"), "utf8");

// Canonical section-system tokens — source of truth, mirrored in site.css.
const T = {
  light: {
    "section-base": "#F6F7F8", "section-alt": "#FFFFFF", "section-raised": "#FFFFFF",
    "section-line": "#CDD2DA",
    ink: "#16181D", "ink-soft": "#4A4F59", stone: "#6B7280", teal: "#2A50C8",
  },
  dark: {
    "section-base": "#16181D", "section-alt": "#1E232B", "section-raised": "#1B1E24",
    "section-line": "#3A414C",
    ink: "#F1EDE5", "ink-soft": "#BBB6AB", stone: "#9CA3AE", teal: "#7AA7FF",
  },
};

// sRGB hex -> relative luminance (WCAG 2.x).
function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function lum(hex) {
  const m = hex.replace("#", "");
  return 0.2126 * lin(parseInt(m.slice(0, 2), 16))
       + 0.7152 * lin(parseInt(m.slice(2, 4), 16))
       + 0.0722 * lin(parseInt(m.slice(4, 6), 16));
}
function ratio(a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }

const SURFACES = ["section-base", "section-alt", "section-raised"];
const TEXTS = [["ink", 4.5], ["ink-soft", 4.5], ["stone", 4.5], ["teal", 4.5]];

const fails = [];
const warns = [];
let checks = 0;

for (const mode of ["light", "dark"]) {
  const t = T[mode];
  for (const s of SURFACES) {
    for (const [tx, min] of TEXTS) {
      checks++;
      const r = ratio(t[tx], t[s]);
      if (r < min) fails.push(`${mode}: ${tx} on ${s} = ${r.toFixed(2)}:1 (need ${min}:1)`);
    }
  }
  // Divider visibility (report-only): the section hairline against the two
  // grounds it most often sits between.
  for (const s of ["section-base", "section-alt"]) {
    const r = ratio(t["section-line"], t[s]);
    if (r < 1.3) warns.push(`${mode}: section-line vs ${s} = ${r.toFixed(2)}:1 (divider may read too faint)`);
  }
}

// Drift lock: each section-* token must be declared with this exact value
// in site.css (light value somewhere outside the dark block + dark value
// inside it — presence check is enough to catch a stale palette).
for (const mode of ["light", "dark"]) {
  for (const [name, val] of Object.entries(T[mode])) {
    if (!name.startsWith("section-")) continue;
    const re = new RegExp("--" + name + "\\s*:\\s*" + val, "i");
    if (!re.test(css)) fails.push(`drift: --${name} (${mode}) is not declared as ${val} in assets/site.css`);
  }
}

if (warns.length) for (const w of warns) console.warn(`  ! ${w}`);
if (fails.length) {
  console.error(`✗ contrast: ${fails.length} issue(s) across ${checks} text/surface checks:`);
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`✓ contrast: ${checks} text/surface pairs pass WCAG AA across light + dark; section tokens locked to site.css.`);
