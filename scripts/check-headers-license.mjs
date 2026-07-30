#!/usr/bin/env node
/**
 * Header license-claim gate.
 *
 * WHY THIS EXISTS (2026-07-28)
 *
 * `_headers` can attach `Link: <...>; rel="license"` to a glob. That header is a
 * LICENSE CLAIM made in transit, and it is invisible from the file it describes:
 * nothing in cost-index/eia-energy-backdrop.json tells you a server rule is
 * announcing a different license for it than the one inside it.
 *
 * The risk is concrete. When CORS was added for the Cost Index data files, the
 * obvious move was one blanket `/cost-index/*.json` rule carrying CC0 — matching
 * the `/data/*.jsonl` block right above it. An audit stopped it: that directory
 * holds 9 files self-declaring CC0, 13 declaring CC BY 4.0, and 7 declaring
 * nothing. A blanket CC0 header would have stripped attribution from the CC-BY
 * set by wildcard — relicensing other people's data on the way out the door.
 *
 * The narrow rules that shipped are correct today. This gate is what keeps them
 * correct: the next person to widen a glob, or to drop a CC-BY file into a
 * directory a CC0 rule already matches, gets a failure instead of a quiet
 * relicense.
 *
 * THE INVARIANT: every file matched by a license-bearing `_headers` rule must
 * self-declare the same license in-band, or be explicitly waived with a reason.
 *
 * In-band means the payload says it: a `license` field (top level or under
 * `meta`) for JSON. Formats with nowhere to put one — CSV, plain text — cannot
 * self-declare, so they must be waived by name, which forces the claim to be
 * written down and reviewed rather than inherited from a glob.
 *
 * NDJSON is the third case: every line is a record, so there is no metadata slot
 * either — but `data/*.jsonl` already has an authoritative out-of-band map in
 * cost-index/open-data-catalog.json, and check-open-data-catalog.mjs enforces
 * that every data/*.jsonl is a catalogued CC0 gov dataset for exactly this
 * reason ("otherwise a future non-gov .jsonl would silently inherit the CC0
 * license Link"). This gate therefore accepts a catalog entry as a declaration
 * rather than re-litigating it, and stays focused on what that gate does not
 * cover: cost-index/ and anywhere a future glob wanders.
 *
 * Usage:
 *   node scripts/check-headers-license.mjs
 *   node scripts/check-headers-license.mjs --self-test
 *
 * Exit codes:
 *   0 — every license header matches what the files declare.
 *   1 — a header claims a license a file does not.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

const HEADERS_FILE = '_headers';

/**
 * Files that cannot carry an in-band license, with the reason the header claim
 * is nonetheless true. Keyed by repo-relative path glob; keep dated reasons.
 */
const WAIVERS = [
  {
    glob: '/cost-index/week-*.csv',
    license: 'CC0',
    // 2026-07-28: CSV has no header row for metadata. Each week-*.csv is emitted
    // by build-cost-index-dispatch.mjs from the same frozen edition as its
    // week-*.json sibling, which self-declares CC0 in-band and repeats it in the
    // edition's Dataset JSON-LD and printed "Cite this edition" line.
    why: 'same frozen snapshot as the CC0-declaring week-*.json sibling',
  },
  {
    glob: '/data/cpc-oni.txt',
    license: 'CC0',
    // 2026-07-28: fixed-width NOAA CPC text passthrough, no metadata slot. US
    // government work, redistributed verbatim — public domain at the source.
    why: 'raw NOAA CPC passthrough; US-gov public domain at source',
  },
];

/** Canonical form, so "CC0 1.0" and the CC0 deed URL compare equal. */
export function normalizeLicense(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return null;
  if (s.includes('publicdomain/zero') || /\bcc0\b/.test(s)) return 'CC0';
  const by = s.match(/licenses\/by(-[a-z-]+)?\/(\d\.\d)/);
  if (by) return `CC BY${(by[1] || '').toUpperCase().replace(/-/g, '-')} ${by[2]}`;
  const plain = s.match(/^cc[ -]by([ -][a-z-]+)?[ -](\d\.\d)/);
  if (plain) return `CC BY${(plain[1] || '').toUpperCase().replace(/[ ]/g, '-')} ${plain[2]}`;
  return String(raw).trim();
}

/** Turn an _headers path pattern into an anchored RegExp. `*` never spans `/`. */
export function globToRegExp(glob) {
  const body = glob
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${body}$`);
}

/** Parse _headers into [{ path, license }] for rules that make a license claim. */
export function parseLicenseRules(source) {
  const rules = [];
  let current = null;
  for (const line of source.split('\n')) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    if (/^\//.test(line)) {
      current = { path: line.trim(), license: null };
      rules.push(current);
      continue;
    }
    const m = line.match(/^\s+Link:\s*<([^>]+)>\s*;\s*rel="license"/i);
    if (m && current) current.license = normalizeLicense(m[1]);
  }
  return rules.filter((r) => r.license);
}

/** The license a payload declares about itself, or null. */
export function declaredLicense(rel, read) {
  if (!rel.endsWith('.json')) return null;
  try {
    const j = JSON.parse(read(rel));
    return normalizeLicense(j.license ?? j.License ?? j?.meta?.license);
  } catch {
    return null;
  }
}

const CATALOG = 'cost-index/open-data-catalog.json';

/**
 * The open-data catalog's path -> license map. This is a real declaration, not a
 * convenience: check-open-data-catalog.mjs fails CI if a data/*.jsonl is missing
 * from it or catalogued as anything but CC0, so the mapping cannot silently rot.
 */
export function catalogLicenses(read) {
  const map = new Map();
  let parsed;
  try {
    parsed = JSON.parse(read(CATALOG));
  } catch {
    return map;
  }
  for (const d of parsed.datasets || []) {
    for (const dl of d.downloads || []) {
      if (dl?.path) map.set(`/${dl.path}`, normalizeLicense(d.license));
    }
  }
  return map;
}

function waiverFor(webPath, license) {
  return WAIVERS.find(
    (w) => globToRegExp(w.glob).test(webPath) && normalizeLicense(w.license) === license,
  );
}

/** Every repo file whose served path would match `pattern`. */
function filesMatching(pattern) {
  const re = globToRegExp(pattern);
  const dir = pattern.slice(1, pattern.lastIndexOf('/'));
  const abs = path.join(REPO, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .map((name) => `/${dir}/${name}`)
    .filter((webPath) => re.test(webPath));
}

function selfTest() {
  const cases = [
    [normalizeLicense('https://creativecommons.org/publicdomain/zero/1.0/'), 'CC0', 'CC0 deed URL'],
    [normalizeLicense('CC0 1.0'), 'CC0', 'CC0 short form'],
    [normalizeLicense('https://creativecommons.org/licenses/by/4.0/'), 'CC BY 4.0', 'CC-BY deed URL'],
    [normalizeLicense('CC BY 4.0'), 'CC BY 4.0', 'CC-BY short form'],
    [normalizeLicense(''), null, 'empty declares nothing'],
    [globToRegExp('/cost-index/*.json').test('/cost-index/a.json'), true, 'glob matches sibling'],
    [globToRegExp('/cost-index/*.json').test('/cost-index/sub/a.json'), false, '* must not span a slash'],
    [globToRegExp('/cost-index/week-*.json').test('/cost-index/week-2026-07-06.json'), true, 'prefixed glob matches'],
    [globToRegExp('/cost-index/week-*.json').test('/cost-index/index.json'), false, 'prefixed glob is not blanket'],
    [parseLicenseRules('/a/*\n  Access-Control-Allow-Origin: *\n').length, 0, 'a CORS-only rule makes no claim'],
    [parseLicenseRules('/a/*\n  Link: <https://creativecommons.org/publicdomain/zero/1.0/>; rel="license"\n')[0].license, 'CC0', 'a license rule is captured'],
    [parseLicenseRules('# /commented/*\n  Link: <x>; rel="license"\n').length, 0, 'commented rules are ignored'],
    [declaredLicense('x.json', () => '{"license":"CC BY 4.0"}'), 'CC BY 4.0', 'top-level license field'],
    [declaredLicense('x.json', () => '{"meta":{"license":"CC0 1.0"}}'), 'CC0', 'nested meta.license'],
    [declaredLicense('x.json', () => 'not json'), null, 'unparseable declares nothing'],
    [declaredLicense('x.csv', () => ''), null, 'csv cannot self-declare'],
    [
      catalogLicenses(() => '{"datasets":[{"license":"CC0 1.0","downloads":[{"path":"data/a.jsonl"}]}]}').get('/data/a.jsonl'),
      'CC0',
      'catalog maps a download path to its license',
    ],
    [
      catalogLicenses(() => '{"datasets":[{"license":"CC BY 4.0","downloads":[{"path":"data/b.jsonl"}]}]}').get('/data/b.jsonl'),
      'CC BY 4.0',
      'catalog carries CC-BY through unchanged',
    ],
    [catalogLicenses(() => 'not json').size, 0, 'an unreadable catalog declares nothing'],
    [catalogLicenses(() => '{"datasets":[]}').get('/data/ghost.jsonl'), undefined, 'an uncatalogued path stays undeclared'],
  ];
  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`✗ self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }
  // The failure this gate was built for: a blanket CC0 glob over a CC-BY file.
  const blanket = globToRegExp('/cost-index/*.json');
  if (!blanket.test('/cost-index/eia-energy-backdrop.json')) {
    console.error('✗ self-test: a blanket glob must match the CC-BY files it would relicense');
    process.exit(2);
  }
  pass++;
  console.log(`check-headers-license --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

function main(argv) {
  if (argv.includes('--self-test')) selfTest();

  const abs = path.join(REPO, HEADERS_FILE);
  if (!fs.existsSync(abs)) {
    console.error(`check-headers-license: FAIL — ${HEADERS_FILE} is missing.`);
    process.exit(1);
  }

  const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
  const rules = parseLicenseRules(fs.readFileSync(abs, 'utf8'));
  const catalog = catalogLicenses(read);

  const violations = [];
  let checked = 0;
  let waived = 0;
  let viaCatalog = 0;

  for (const rule of rules) {
    for (const webPath of filesMatching(rule.path)) {
      const rel = webPath.slice(1);
      if (!fs.statSync(path.join(REPO, rel)).isFile()) continue;
      checked++;
      const declared = declaredLicense(rel, read);
      if (declared === rule.license) continue;
      if (catalog.get(webPath) === rule.license) {
        viaCatalog++;
        continue;
      }
      if (waiverFor(webPath, rule.license)) {
        waived++;
        continue;
      }
      violations.push({
        webPath,
        claimed: rule.license,
        declared: declared ?? catalog.get(webPath) ?? '(nothing in-band, absent from the catalog)',
        rule: rule.path,
      });
    }
  }

  if (!violations.length) {
    console.log(
      `check-headers-license: ${rules.length} license rule(s) over ${checked} file(s) — every claim matches (${viaCatalog} via the open-data catalog, ${waived} waived). 0 violations.`,
    );
    process.exit(0);
  }

  console.error(`check-headers-license: ${violations.length} header(s) claim a license the file does not:\n`);
  for (const v of violations) {
    console.error(`  ✗ ${v.webPath}`);
    console.error(`      rule ${v.rule} sends: ${v.claimed}`);
    console.error(`      the file declares:   ${v.declared}`);
  }
  console.error(`
A license header is a claim made in transit, and it overrides nothing inside the
file — it just contradicts it for anyone reading headers. Claiming CC0 over a
CC-BY payload strips attribution from data this site redistributes but does not
own. Fix by narrowing the glob so it matches only files that declare that
license, NOT by editing the payload to match the header.`);
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
