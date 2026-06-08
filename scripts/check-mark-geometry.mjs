#!/usr/bin/env node
/**
 * Window-mark geometry gate (studio side).
 *
 * The Muntin mark — "The Pane" — has one canonical geometry, specified in
 * docs/brand/window-mark-geometry.md. The studio ships it as six SVG variants
 * under brand/mark/ on a 128-unit grid (the 32u canonical grid ×4). This gate
 * asserts every one of those SVGs carries the canonical four-pane path set, so
 * a variant can't silently drift from the spec (or from its siblings).
 *
 * The product side (Muntin-Invoice-Decoder/scripts/check-mark-geometry.mjs)
 * guards the 32u canonical encodings (WindowMark.tsx, the favicon, the gradient
 * field). Both gates hold the same canonical numbers in lockstep with the spec.
 *
 * Run:        node scripts/check-mark-geometry.mjs
 * Self-test:  node scripts/check-mark-geometry.mjs --self-test
 * CI:         scripts/check-all.mjs
 * Spec:       docs/brand/window-mark-geometry.md
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const MARK_DIR = path.join(REPO, "brand/mark");

// Canonical four-pane paths on the 128u grid (= the 32u spec paths ×4).
// Source of truth: docs/brand/window-mark-geometry.md.
const CANON_128 = [
  "M32 8 H58 V46 H8 V32 A24 24 0 0 1 32 8 Z",
  "M70 8 H96 A24 24 0 0 1 120 32 V46 H70 V8 Z",
  "M8 58 H58 V120 H32 A24 24 0 0 1 8 96 V58 Z",
  "M70 58 H120 V96 A24 24 0 0 1 96 120 H70 V58 Z",
];

// Collapse whitespace so path matching survives reformatting.
const squash = (s) => s.replace(/\s+/g, " ").trim();

function check(markFiles) {
  const failures = [];
  for (const { name, text } of markFiles) {
    const hay = squash(text);
    const missing = CANON_128.filter((p) => !hay.includes(squash(p)));
    if (missing.length)
      failures.push(
        `${name}: missing ${missing.length}/4 canonical pane path(s) — drifted from window-mark-geometry.md`,
      );
  }
  return failures;
}

function selfTest() {
  const good = CANON_128.map((p) => `<path d="${p}"/>`).join("\n");
  const bad = good.replace("V46", "V40"); // nudge the transom -> must fail
  const okPass = check([{ name: "good.svg", text: good }]).length === 0;
  const okFail = check([{ name: "bad.svg", text: bad }]).length === 1;
  // whitespace tolerance
  const spaced = CANON_128.map((p) => `<path d="  ${p.replace(/ /g, "  ")}  "/>`).join("\n");
  const okSpaced = check([{ name: "spaced.svg", text: spaced }]).length === 0;
  if (!okPass || !okFail || !okSpaced) {
    console.error("✗ check-mark-geometry self-test FAILED", { okPass, okFail, okSpaced });
    process.exit(1);
  }
  console.log("✓ check-mark-geometry self-test passed");
}

function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  let names;
  try {
    names = readdirSync(MARK_DIR).filter((n) => n.endsWith(".svg"));
  } catch {
    console.log("✓ mark geometry: no brand/mark/ directory (nothing to check)");
    return;
  }
  const markFiles = names.map((name) => ({
    name: `brand/mark/${name}`,
    text: readFileSync(path.join(MARK_DIR, name), "utf8"),
  }));
  const failures = check(markFiles);
  if (failures.length) {
    console.error(`✗ mark geometry: ${failures.length} studio mark(s) drifted from the spec:`);
    for (const f of failures) console.error("  - " + f);
    console.error("\nSee docs/brand/window-mark-geometry.md. All brand/mark/*.svg use the canonical 128u path set.");
    process.exit(1);
  }
  console.log(`✓ mark geometry: ${markFiles.length} studio mark(s) carry the canonical Pane geometry`);
}

main();
