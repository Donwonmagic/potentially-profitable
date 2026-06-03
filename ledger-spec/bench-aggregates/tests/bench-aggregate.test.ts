/**
 * bench-aggregate.test.ts — the privacy lock (pure half; the SQL half is
 * migrations/0037_bench_kanon.test.sql, proven against real Postgres).
 *
 * Pins: K_ANON_FLOOR === 10 (so the constant and the view's HAVING can't
 * drift), the count is banded (exact n never leaks), the public bucket carries
 * no org_id/vendor_id/sku, and a point price (median) is suppressed below
 * POINT_PRICE_FLOOR — ranges only.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  K_ANON_FLOOR, VENDOR_FLOOR, DOMINANCE_CAP, POINT_PRICE_FLOOR,
  bandSampleN, toPublicBucket, type RawBucketRow,
} from '../src/bench-aggregate-store.js';

function row(over: Partial<RawBucketRow> = {}): RawBucketRow {
  return {
    category: 'romaine', pack_bucket: 'case', region_bucket: 'us-northeast', week: '2026-04-06',
    p10_cents: 1100, p25_cents: 1250, p50_cents: 1400, p75_cents: 1550, p90_cents: 1700,
    n_obs: 240, n_orgs: 14, n_vendors: 6, ...over,
  };
}

test('LOCK: the floors match the SQL view HAVING (cannot silently drift)', () => {
  assert.equal(K_ANON_FLOOR, 10);
  assert.equal(VENDOR_FLOOR, 5);
  assert.equal(DOMINANCE_CAP, 0.40);
  assert.equal(POINT_PRICE_FLOOR, 30);
});

test('bandSampleN never reveals an exact count', () => {
  assert.equal(bandSampleN(10), '10–24');
  assert.equal(bandSampleN(24), '10–24');
  assert.equal(bandSampleN(25), '25–49');
  assert.equal(bandSampleN(60), '50–99');
  assert.equal(bandSampleN(300), '100+');
});

test('toPublicBucket strips identifiers, bands the count, always gives a range', () => {
  const b = toPublicBucket(row())!;
  // structural: only the safe keys exist
  assert.deepEqual(Object.keys(b).sort(), ['category', 'medianCents', 'pack', 'rangeCents', 'region', 'sampleBand', 'spreadCents', 'week']);
  assert.deepEqual(b.rangeCents, [1250, 1550]);   // p25–p75 always present
  assert.deepEqual(b.spreadCents, [1100, 1700]);  // p10–p90
  assert.equal(b.sampleBand, '10–24');
  // no identifier value anywhere in the serialized bucket
  assert.doesNotMatch(JSON.stringify(b), /org_id|vendor_id|sku|orgC|vend/i);
});

test('median (a point price) is suppressed below POINT_PRICE_FLOOR — ranges only', () => {
  assert.equal(toPublicBucket(row({ n_orgs: 14 }))!.medianCents, null); // k<30 → no point
  assert.equal(toPublicBucket(row({ n_orgs: 30 }))!.medianCents, 1400); // k>=30 → point allowed
});

test('a sub-floor row never produces a bucket (last fence behind the view)', () => {
  assert.equal(toPublicBucket(row({ n_orgs: 9 })), null);   // below k=10
  assert.equal(toPublicBucket(row({ n_vendors: 4 })), null); // below vendor floor
});
