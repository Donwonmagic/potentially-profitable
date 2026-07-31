#!/usr/bin/env node
/**
 * check-jsonl-integrity.mjs — every line of every published .jsonl corpus must parse.
 *
 * WHY THIS EXISTS
 * `data/census-imports.jsonl` shipped 21 unparseable lines, all one shape:
 *
 *     {"hs":"080390","year":2010,"rows":}
 *
 * When the Census API returned nothing for an HS/year, the writer emitted a truncated `rows`
 * value instead of `[]`. Eight HS codes across 2010–2011 (squid 030743 through 2016).
 *
 * Nothing caught it, because every consumer skips a bad line by design:
 *   build-ingredient-state-record.mjs:47  `try { o = JSON.parse(l); } catch { continue; }`
 *   build-ingredient-codes.mjs:398        `try { d = JSON.parse(line); } catch { continue; }`
 *
 * That try/catch is reasonable per-line defensive code and catastrophic as a system property: a
 * corrupt record and a legitimately absent one become the same nothing. It is ADR-023's shape at
 * the serialization layer — "no data returned" written so that it cannot be read, then silently
 * dropped. The corpus is published CC0/CC-BY and consumed by machines, so a line that no parser
 * accepts is worse than a missing line: it is a silent hole with a plausible-looking neighbour.
 *
 * The lines were repaired to `"rows":[]`, which is the honest record — we ASKED for that HS/year
 * and got nothing back. Deleting them would have destroyed that distinction.
 *
 * This gate makes the class impossible to reintroduce. It parses every line of every .jsonl under
 * data/ and reds on the first corpus with a failure, naming file, line number, and the raw text.
 *
 *   node scripts/check-jsonl-integrity.mjs
 *   node scripts/check-jsonl-integrity.mjs --json
 *   node scripts/check-jsonl-integrity.mjs --self-test
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'data')

/**
 * Validate one .jsonl body. A trailing newline is normal and not an error; any other blank line is
 * reported, since a stray blank usually means a writer bailed mid-record.
 */
export function validate (text) {
  const lines = String(text).split('\n')
  const malformed = []
  const blanks = []
  lines.forEach((line, i) => {
    const n = i + 1
    if (!line.trim()) {
      if (i !== lines.length - 1) blanks.push(n)   // trailing newline is fine
      return
    }
    try { JSON.parse(line) } catch { malformed.push({ line: n, text: line.slice(0, 120) }) }
  })
  return { total: lines.length, malformed, blanks }
}

export function scan (dir, readdir = readdirSync, read = (p) => readFileSync(p, 'utf8')) {
  return readdir(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .sort()
    .map((f) => ({ file: f, ...validate(read(join(dir, f))) }))
}

// ---------------------------------------------------------------------------
function selfTest () {
  let n = 0
  const ok = (c, m) => { n++; if (!c) { console.error(`  FAIL: ${m}`); process.exitCode = 1 } }

  ok(validate('{"a":1}\n{"b":2}\n').malformed.length === 0, 'valid jsonl with trailing newline passes')
  ok(validate('{"a":1}').malformed.length === 0, 'a single line with no trailing newline passes')
  ok(validate('{"a":1}\n').blanks.length === 0, 'a trailing newline is NOT reported as a blank')
  ok(validate('{"a":1}\n\n{"b":2}\n').blanks[0] === 2, 'an interior blank line IS reported, with its number')

  const real = validate('{"hs":"080390","year":2010,"rows":}\n')
  ok(real.malformed.length === 1, 'the exact shipped corruption is caught')
  ok(real.malformed[0].line === 1, 'reports a 1-indexed line number')
  ok(/rows/.test(real.malformed[0].text), 'carries the raw text so the failure is actionable')

  ok(validate('{"a":1}\nnot json\n{"b":2}\n').malformed[0].line === 2, 'finds a bad line between good ones')
  ok(validate('').malformed.length === 0, 'an empty file has no malformed lines')
  // a bare scalar IS valid JSON — do not over-reject
  ok(validate('123\n').malformed.length === 0, 'a bare number parses; the gate checks JSON, not object-ness')
  ok(validate('{"a":1}{"b":2}\n').malformed.length === 1, 'two objects on one line is a real failure')

  const s = scan('/x', () => ['a.jsonl', 'b.txt', 'c.jsonl'], () => '{"ok":1}\n')
  ok(s.length === 2, 'scans only .jsonl files')
  ok(s.map((x) => x.file).join(',') === 'a.jsonl,c.jsonl', 'results are sorted and filtered')

  console.log(`self-test: ${n} assertions${process.exitCode ? ' — FAILURES ABOVE' : ' passed'}`)
}

// ---------------------------------------------------------------------------
const argv = process.argv.slice(2)
if (argv.includes('--self-test')) {
  selfTest()
} else {
  const results = scan(DATA)
  if (argv.includes('--json')) { console.log(JSON.stringify(results, null, 2)); process.exit(0) }

  let bad = 0
  for (const r of results) {
    if (!r.malformed.length && !r.blanks.length) continue
    bad += r.malformed.length
    console.error(`  ${r.file} — ${r.malformed.length} malformed, ${r.blanks.length} stray blank(s)`)
    for (const m of r.malformed.slice(0, 5)) console.error(`      L${m.line}: ${m.text}`)
    if (r.malformed.length > 5) console.error(`      … and ${r.malformed.length - 5} more`)
  }
  if (bad) {
    console.error(`\ncheck-jsonl-integrity: ${bad} unparseable line(s) in a published corpus.`)
    console.error('  Consumers skip a bad line by design, so a corrupt record and an absent one')
    console.error('  become the same nothing. Repair the record — an empty result is "rows":[],')
    console.error('  which preserves that the fetch HAPPENED. Do not delete the line.')
    process.exit(1)
  }
  const lines = results.reduce((n, r) => n + r.total, 0)
  console.log(`check-jsonl-integrity: OK — ${results.length} corpus file(s), ${lines} line(s), all parse.`)
}
