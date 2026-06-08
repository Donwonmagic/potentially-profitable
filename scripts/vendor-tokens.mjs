#!/usr/bin/env node
/**
 * Token-spine vendor tool — the scripted "publish-and-vendor" step for the
 * cross-repo design-token spine.
 *
 * The canonical token spine lives in the PRODUCT repo
 * (Muntin-Invoice-Decoder/packages/ui/muntin.tokens.json). This site VENDORS a
 * copy at data/muntin.tokens.json. Two guards — check-tokens-sync.mjs (here) and
 * the product's check-tokens-parity.mjs — pin the same EXPECTED_SPINE_HASH (a
 * sha256 of the normalized token VALUES, ignoring $meta + formatting), so the two
 * copies can't silently diverge.
 *
 * Before this tool, updating tokens was a manual 4-step ritual (edit both JSON
 * copies, recompute the hash by hand, paste it into both guards). This mechanizes
 * the copy + the hash, so the only human step left is pasting one printed hash.
 * Runbook: docs/brand/token-spine.md.
 *
 * Modes:
 *   --check                 (default) hash the vendored copy; assert it equals the
 *                           EXPECTED_SPINE_HASH pinned in check-tokens-sync.mjs. Exit 1 on mismatch.
 *   --from <canonical.json> re-vendor: copy a canonical token file into
 *                           data/muntin.tokens.json, then print the new hash + next steps.
 *   --diff <canonical.json> value-diff the vendored copy against a canonical file
 *                           (no write) — the local cross-repo divergence check.
 *   --self-test             verify the hash normalization is stable.
 *
 * The spineHash() normalization below MUST match check-tokens-sync.mjs /
 * check-tokens-parity.mjs exactly; --check cross-verifies against the live guard.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const VENDORED = path.join(REPO, "data/muntin.tokens.json");
const GUARD = path.join(REPO, "scripts/check-tokens-sync.mjs");

// MUST stay identical to check-tokens-sync.mjs spineHash().
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

function pinnedHashFromGuard() {
  const m = /EXPECTED_SPINE_HASH\s*=\s*"([0-9a-f]{64})"/.exec(readFileSync(GUARD, "utf8"));
  return m ? m[1] : null;
}

function hashOf(file) {
  return spineHash(JSON.parse(readFileSync(file, "utf8")));
}

function selfTest() {
  const a = spineHash({ $meta: { x: 1 }, b: 2, a: 1 });
  const b = spineHash({ a: 1, b: 2, $meta: { different: true } }); // $meta + order ignored
  if (a !== b) {
    console.error("✗ vendor-tokens self-test FAILED: hash not normalized", { a, b });
    process.exit(1);
  }
  console.log("✓ vendor-tokens self-test passed");
}

function reVendor(fromArg) {
  const from = path.resolve(process.cwd(), fromArg);
  if (!existsSync(from)) {
    console.error(`✗ canonical file not found: ${from}`);
    process.exit(1);
  }
  const newHash = hashOf(from);
  copyFileSync(from, VENDORED);
  console.log(`✓ vendored ${path.relative(REPO, VENDORED)} ← ${fromArg}`);
  console.log(`  new spine hash: ${newHash}`);
  const pinned = pinnedHashFromGuard();
  if (newHash === pinned) {
    console.log("  EXPECTED_SPINE_HASH already matches — no guard edit needed.");
  } else {
    console.log("\n  NEXT: paste this hash into EXPECTED_SPINE_HASH in BOTH guards:");
    console.log("    • potentially-profitable/scripts/check-tokens-sync.mjs");
    console.log("    • Muntin-Invoice-Decoder/scripts/check-tokens-parity.mjs");
    console.log(`    EXPECTED_SPINE_HASH = "${newHash}"`);
  }
}

function diff(fromArg) {
  const from = path.resolve(process.cwd(), fromArg);
  if (!existsSync(from)) {
    console.error(`✗ file not found: ${from}`);
    process.exit(1);
  }
  const a = hashOf(VENDORED);
  const b = hashOf(from);
  if (a === b) {
    console.log(`✓ value-identical spine (hash ${a.slice(0, 12)}…)`);
  } else {
    console.error(`✗ spines DIVERGE:\n    vendored:  ${a}\n    canonical: ${b}`);
    console.error("  Re-vendor with:  node scripts/vendor-tokens.mjs --from " + fromArg);
    process.exit(1);
  }
}

function check() {
  const have = hashOf(VENDORED);
  const pinned = pinnedHashFromGuard();
  if (!pinned) {
    console.error("✗ could not read EXPECTED_SPINE_HASH from check-tokens-sync.mjs");
    process.exit(1);
  }
  if (have !== pinned) {
    console.error(`✗ vendored spine ${have} != pinned ${pinned}`);
    console.error("  The vendored token copy and the guard's pinned hash disagree.");
    console.error("  Re-vendor + update EXPECTED_SPINE_HASH in BOTH guards (see docs/brand/token-spine.md).");
    process.exit(1);
  }
  console.log(`✓ token spine: vendored copy matches the pinned hash (${pinned.slice(0, 12)}…)`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) return selfTest();
  const fromIdx = args.indexOf("--from");
  if (fromIdx !== -1) return reVendor(args[fromIdx + 1]);
  const diffIdx = args.indexOf("--diff");
  if (diffIdx !== -1) return diff(args[diffIdx + 1]);
  return check();
}

main();
