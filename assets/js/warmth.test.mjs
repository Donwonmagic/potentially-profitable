import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { todBand, ghEve, apply } = require('./warmth.js');

test('todBand maps the local hour to a time-of-day band', () => {
  assert.equal(todBand(0), 'night');
  assert.equal(todBand(4), 'night');
  assert.equal(todBand(5), 'dawn');
  assert.equal(todBand(7), 'dawn');
  assert.equal(todBand(8), 'day');
  assert.equal(todBand(12), 'day');
  assert.equal(todBand(16), 'day');
  assert.equal(todBand(17), 'golden');
  assert.equal(todBand(19), 'golden');
  assert.equal(todBand(20), 'dusk');
  assert.equal(todBand(23), 'dusk');
});

test('todBand refuses an out-of-range or non-numeric hour (no guess)', () => {
  assert.equal(todBand(-1), null);
  assert.equal(todBand(24), null);
  assert.equal(todBand(NaN), null);
  assert.equal(todBand('7'), null);
  assert.equal(todBand(undefined), null);
});

test('the whisper never exceeds ~0.06, and midday is byte-identical (0)', () => {
  assert.equal(ghEve('day'), 0); // certified default — no lean at midday
  assert.equal(ghEve('golden'), 0.06); // the warmest whisper
  assert.equal(ghEve('dusk'), 0.05);
  assert.equal(ghEve('dawn'), 0.035);
  assert.equal(ghEve('night'), 0.03);
  // The cap is a whisper, never a shift.
  for (const b of ['night', 'dawn', 'day', 'golden', 'dusk', 'nonsense']) {
    assert.ok(ghEve(b) <= 0.06, `${b} stays a whisper`);
  }
  assert.equal(ghEve('nonsense'), 0); // unknown band → certified default
});

// A tiny DOM stub so we can assert the fail-silent shell without a browser.
function stubDoc() {
  const attrs = {};
  const props = {};
  return {
    documentElement: {
      setAttribute: (k, v) => (attrs[k] = v),
      getAttribute: (k) => attrs[k] ?? null,
      style: { setProperty: (k, v) => (props[k] = v) },
    },
    _attrs: attrs,
    _props: props,
  };
}

test('apply stamps the band and only raises --gh-eve above the certified 0', () => {
  const dawn = stubDoc();
  apply(dawn, { getHours: () => 6 });
  assert.equal(dawn._attrs['data-warmth-tod'], 'dawn');
  assert.equal(dawn._props['--gh-eve'], '0.035');

  // Midday: the band is stamped, but --gh-eve is NEVER written (stays certified 0).
  const noon = stubDoc();
  apply(noon, { getHours: () => 12 });
  assert.equal(noon._attrs['data-warmth-tod'], 'day');
  assert.equal(noon._props['--gh-eve'], undefined); // no property write at all
});

test('apply is fail-silent on a broken document or clock (page = certified v3)', () => {
  assert.doesNotThrow(() => apply(null, { getHours: () => 18 }));
  assert.doesNotThrow(() => apply({}, { getHours: () => 18 }));
  const d = stubDoc();
  assert.doesNotThrow(() =>
    apply(d, {
      getHours: () => {
        throw new Error('clock blew up');
      },
    }),
  );
  assert.equal(d._attrs['data-warmth-tod'], undefined); // nothing stamped on failure
});
