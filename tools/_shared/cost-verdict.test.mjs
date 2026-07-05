import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { verdict } = require('./cost-verdict.js');

test('no flag → null', () => {
  assert.equal(verdict(null, 'high'), null);
  assert.equal(verdict({}, 'high'), null);
});

test('structural on FIRM data → elevated (descriptive, "reads" not "weeks")', () => {
  const v = verdict({ verdict: 'structural', elevatedWeeks: 5 }, 'medium');
  assert.equal(v.tone, 'reprice');                 // internal tone key = the "elevated" state
  assert.match(v.note_en, /5 reads/);              // period-count, frequency-agnostic
  assert.doesNotMatch(v.note_en, /re-?price|real reset|not a blip/i);  // no forward imperative
});

test('structural on THIN data → downgraded to watch (the honesty fix)', () => {
  for (const c of ['low', 'directional']) {
    const v = verdict({ verdict: 'structural', elevatedWeeks: 5 }, c);
    assert.equal(v.tone, 'watch', `confidence ${c} must downgrade structural→watch`);
    assert.match(v.note_en, /thin/);
  }
});

test('spike / easing / flat → hold (low-regret)', () => {
  for (const k of ['spike', 'easing', 'flat']) {
    assert.equal(verdict({ verdict: k }, 'high').tone, 'hold');
  }
});

test('emerging + insufficient → watch', () => {
  assert.equal(verdict({ verdict: 'emerging' }, 'high').tone, 'watch');
  assert.equal(verdict({ verdict: 'whatever-unknown' }, 'high').tone, 'watch');
});

test('every result carries bilingual verb + note', () => {
  for (const k of ['structural', 'spike', 'easing', 'emerging', 'flat', 'insufficient']) {
    const v = verdict({ verdict: k }, 'medium');
    for (const f of ['verb_en', 'verb_es', 'note_en', 'note_es']) {
      assert.ok(v[f] && v[f].length > 0, `${k}.${f} present`);
    }
  }
});
