/**
 * Unit tests — tools/_shared/cross-vendor.js compare()
 * Run via:  node --test tools/_shared/cross-vendor.test.mjs
 *
 * Parity with apps/api cross-vendor.ts: recency window + inter-vendor overlap so
 * a market move can't masquerade as a vendor markup. Setting `window` before the
 * require makes _ctx()/_stem() read the injected globals instead of the real
 * context-bus (which needs a browser).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

globalThis.window = globalThis;
globalThis.MuntinStem = { extractStem: (x) => (x && x.name) || x };
let DATA = { skuHistory: {} };
globalThis.MuntinContext = { read: () => DATA };

const require = createRequire(import.meta.url);
const CV = require("./cross-vendor.js");

const DAY = 86400000;
const JUN = Date.UTC(2026, 5, 10);
function e(vendor, price, ts, unit = "lb") {
  return { vendor, comparablePrice: price, comparableUnit: unit, ts };
}

test("compares contemporaneous vendors on the same unit (cheapest-first, exact gap)", () => {
  DATA = {
    skuHistory: {
      romaine: [
        e("sysco", 1.25, JUN),
        e("sysco", 1.2, JUN - 5 * DAY),
        e("sysco", 1.3, JUN - 10 * DAY),
        e("usfoods", 1.1, JUN - 2 * DAY),
        e("usfoods", 1.05, JUN - 6 * DAY),
        e("usfoods", 1.15, JUN - 9 * DAY),
      ],
    },
  };
  const rows = CV.compare({ name: "romaine" });
  assert.ok(rows);
  assert.equal(rows[0].vendor, "usfoods");
  assert.equal(rows[1].vendor, "sysco");
  assert.equal(rows[1].gapPctVsCheapest, 13.6);
});

test("windows out a stale vendor (recency): its old price can't anchor a live gap", () => {
  DATA = {
    skuHistory: {
      romaine: [
        e("sysco", 1.25, JUN),
        e("sysco", 1.2, JUN - DAY),
        e("sysco", 1.3, JUN - 2 * DAY),
        e("usfoods", 1.1, JUN - 200 * DAY),
        e("usfoods", 1.05, JUN - 201 * DAY),
        e("usfoods", 1.15, JUN - 202 * DAY),
      ],
    },
  };
  assert.equal(CV.compare({ name: "romaine" }), null);
});

test("withholds disjoint clusters within the window (overlap): drift is not a markup", () => {
  DATA = {
    skuHistory: {
      romaine: [
        e("sysco", 1.25, JUN - 90 * DAY),
        e("sysco", 1.2, JUN - 91 * DAY),
        e("sysco", 1.3, JUN - 92 * DAY),
        e("usfoods", 1.1, JUN),
        e("usfoods", 1.05, JUN - DAY),
        e("usfoods", 1.15, JUN - 2 * DAY),
      ],
    },
  };
  assert.equal(CV.compare({ name: "romaine" }), null);
});

test("compares a recent SWITCH: adjacent clusters a few days apart (bounded gap, not overlap)", () => {
  DATA = {
    skuHistory: {
      romaine: [
        e("sysco", 1.25, JUN - 5 * DAY),
        e("sysco", 1.2, JUN - 4 * DAY),
        e("sysco", 1.3, JUN - 3 * DAY),
        e("usfoods", 1.1, JUN - 2 * DAY),
        e("usfoods", 1.05, JUN - DAY),
        e("usfoods", 1.15, JUN),
      ],
    },
  };
  const rows = CV.compare({ name: "romaine" });
  assert.ok(rows);
  assert.equal(rows[0].vendor, "usfoods");
  assert.equal(rows[1].gapPctVsCheapest, 13.6);
});
