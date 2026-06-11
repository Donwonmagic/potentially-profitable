import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { encode, decode } = require('./pressure-scenario.js');

test('encodes only the indicators moved off the live base', () => {
  const base = { 'feed-futures': -0.09, diesel: 0.01 };
  const scenario = { 'feed-futures': 0.06, diesel: 0.01 }; // only feed moved
  const frag = encode('chicken-breast', scenario, base);
  assert.equal(frag, '#v=1&it=chicken-breast&o=feed-futures:0.06');
});

test('no moves → item only', () => {
  const base = { diesel: 0.01 };
  assert.equal(encode('ribeye', { diesel: 0.01 }, base), '#v=1&it=ribeye');
});

test('round-trips through decode', () => {
  const base = { 'feed-futures': -0.09, diesel: 0.01 };
  const scenario = { 'feed-futures': 0.06, diesel: 0.05 };
  const r = decode(encode('chicken-breast', scenario, base));
  assert.equal(r.item, 'chicken-breast');
  assert.deepEqual(r.obs, { 'feed-futures': 0.06, diesel: 0.05 });
});

test('decode tolerates junk + unknown versions (forward-compat)', () => {
  assert.equal(decode(''), null);
  assert.equal(decode('#v=2&it=x'), null);          // future version ignored
  assert.equal(decode('#it=chicken-breast'), null); // no version
  const r = decode('#v=1&it=onion&o=diesel:0.04;bogus;drought:notanum');
  assert.deepEqual(r.obs, { diesel: 0.04 });          // junk pairs dropped
});

test('rejects unsafe item/id tokens', () => {
  assert.equal(decode('#v=1&it=../etc/passwd'), null);
  const r = decode('#v=1&it=onion&o=evil<script>:1');
  assert.deepEqual(r.obs, {});
});
