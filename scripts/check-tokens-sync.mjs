#!/usr/bin/env node
/**
 * Token-sync gate — locks the site's core palette (the :root block at the
 * top of assets/site.css) to the canonical cross-brand token source of
 * truth, data/muntin.tokens.json (vendored from the Muntin Ledger repo,
 * packages/ui/muntin.tokens.json).
 *
 * The Muntin brand runs one palette in two registers. This site is the
 * EDITORIAL register: same cool slate + blue values as the product, but
 * Fraunces type + the deeper accent.text blue (#2A50C8) as its primary
 * accent for AA on light surfaces (see registers.editorial in the JSON).
 *
 * This gate asserts every legacy site var (--cream/--teal/--ink/...) still
 * resolves to its canonical value, so the site can't silently drift off
 * the spine. Pairs with migrate-warm-palette.mjs --check (which forbids the
 * RETIRED warm values); this one enforces the CURRENT cool ones. Fail-CI.
 *
 * Run:        node scripts/check-tokens-sync.mjs
 * Self-test:  node scripts/check-tokens-sync.mjs --self-test
 * CI:         scripts/check-all.mjs
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const SITE_CSS = path.join(REPO, "assets/site.css");
const SPEC = path.join(REPO, "data/muntin.tokens.json");

/** Pull the single #rrggbb out of a legacyVarMap description string. */
function hexOf(s) {
  const m = /#[0-9a-fA-F]{6}\b/.exec(s);
  return m ? m[0] : null;
}

/** Body of the FIRST `:root{...}` block (the core palette line). */
function firstRoot(css) {
  const i = css.indexOf(":root");
  if (i === -1) return "";
  const open = css.indexOf("{", i);
  let depth = 0;
  for (let k = open; k < css.length; k++) {
    if (css[k] === "{") depth++;
    else if (css[k] === "}" && --depth === 0) return css.slice(open + 1, k);
  }
  return "";
}

function parseVars(body) {
  const map = {};
  const re = /(--[a-z0-9-]+)\s*:\s*([^;}]+)/gi; // terminate on ; OR } (last decl has no ;)
  let m;
  while ((m = re.exec(body)) !== null) map[m[1]] = m[2].trim();
  return map;
}

const norm = (v) => v.trim().toLowerCase();

function check(cssText, spec) {
  const expected = {};
  const legacy = spec?.registers?.editorial?.legacyVarMap ?? {};
  for (const [v, desc] of Object.entries(legacy)) {
    const hex = hexOf(desc);
    if (hex) expected[v] = hex;
  }
  const vars = parseVars(firstRoot(cssText));
  const failures = [];
  for (const [v, hex] of Object.entries(expected)) {
    const actual = vars[v];
    if (actual == null) failures.push(`${v} missing from site.css :root (spec ${hex})`);
    else if (norm(actual) !== norm(hex)) failures.push(`${v}: site.css=${actual} != spec=${hex}`);
  }
  return { failures, count: Object.keys(expected).length };
}

function selfTest() {
  const spec = { registers: { editorial: { legacyVarMap: { "--teal": "accent (#2a50c8)" } } } };
  const ok = check(":root{--teal:#2A50C8}", spec).failures;
  const bad = check(":root{--teal:#1F4E5B}", spec).failures;
  // ADR-001 clause: the editorial Golden Hour accent must not appear in the spine.
  const spineClean = editorialAccentInSpine(`{"core":{"accent":{"default":"#3b68f5"}}}`).length === 0;
  const spineLeak = editorialAccentInSpine(`{"x":"#FFB020"}`).length === 1;
  if (ok.length !== 0 || bad.length === 0 || !spineClean || !spineLeak) {
    console.error("✗ self-test FAILED", { ok, bad, spineClean, spineLeak });
    process.exit(1);
  }
  console.log("✓ check-tokens-sync self-test passed");
}

// Cross-repo spine integrity: this vendored copy (site data/) and the
// canonical muntin.tokens.json (product packages/ui) MUST hold identical token
// VALUES. This pins a normalized hash (values only, ignoring $meta +
// formatting); if either copy changes without updating BOTH copies and this
// constant in BOTH guards, CI fails — keeping the two-repo single source of
// truth honest.
const EXPECTED_SPINE_HASH =
  "3681742a5d58d95835dee6f1a67fd4c550f6ba929548d1b872ff0b079dcb6e11";

// ADR-001: the studio "Golden Hour" accent (marigold #FFB020 / coral #FF6B5C) is an
// editorial-ONLY layer. It lives in this repo's editorial CSS (--light-marigold /
// --light-coral in assets/site.css) and in brand/og/* — but it must NEVER enter the
// SHARED cross-repo spine (data/muntin.tokens.json), or it would become available to
// the product and blur the two registers. The product's mirror gate
// (Muntin-Invoice-Decoder/scripts/check-editorial-accent-boundary.mjs) forbids these
// hexes anywhere in the product; this clause keeps them out of the spine on our side.
const EDITORIAL_ACCENT_IN_SPINE = /#(?:FFB020|FF6B5C)\b/gi;
function editorialAccentInSpine(rawSpecText) {
  const hits = rawSpecText.match(EDITORIAL_ACCENT_IN_SPINE);
  return hits ? [...new Set(hits.map((h) => h.toUpperCase()))] : [];
}
function spineHash(spec) {
  const j = JSON.parse(JSON.stringify(spec));
  delete j["$meta"];
  const st = (o) =>
    Array.isArray(o)
      ? o.map(st)
      : o && typeof o === "object"
        ? Object.keys(o)
            .sort()
            .reduce((a, k) => ((a[k] = st(o[k])), a), {})
        : o;
  return createHash("sha256").update(JSON.stringify(st(j))).digest("hex");
}

function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  const rawSpec = readFileSync(SPEC, "utf8");
  const leaked = editorialAccentInSpine(rawSpec);
  if (leaked.length) {
    console.error(
      `✗ editorial accent in spine: ${leaked.join(", ")} found in data/muntin.tokens.json`,
    );
    console.error(
      "  Golden Hour (marigold/coral) is an editorial-only layer (ADR-001) and must not enter the shared cross-repo spine.",
    );
    console.error(
      "  Keep it in assets/site.css (--light-marigold / --light-coral) and brand/og/*, not the token spine.",
    );
    process.exit(1);
  }
  const spec = JSON.parse(rawSpec);
  const hash = spineHash(spec);
  if (hash !== EXPECTED_SPINE_HASH) {
    console.error(`✗ spine integrity: muntin.tokens.json hash ${hash} != expected ${EXPECTED_SPINE_HASH}`);
    console.error("  Vendored (site) and canonical (product) token copies diverged, or tokens changed. Update BOTH copies + EXPECTED_SPINE_HASH in BOTH guards.");
    process.exit(1);
  }
  const { failures, count } = check(readFileSync(SITE_CSS, "utf8"), spec);
  if (failures.length) {
    console.error(`✗ token sync: ${failures.length} of ${count} site palette tokens drifted from data/muntin.tokens.json:`);
    for (const f of failures) console.error("  - " + f);
    console.error("\nFix: reconcile assets/site.css :root with the editorial register in data/muntin.tokens.json.");
    process.exit(1);
  }
  console.log(`✓ token sync: site.css :root matches the editorial register in muntin.tokens.json (${count} tokens)`);
}

main();
