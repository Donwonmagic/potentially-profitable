/**
 * validator-corpus.mjs — parse the Phase-H validator reports into structured claims.
 *
 * The 15 `docs/handoff/bones/validate-*.md` reports are prose. Prose cannot be
 * counted, deduplicated or re-checked. This module turns them into records so
 * the verdict "13 of 15 NOT_READY" and the count "44 blocking" can both be
 * audited instead of quoted.
 *
 * The report shape is fixed by the phase's own prompt and is load-bearing here:
 *
 *   # <Domain title>
 *   **<VERDICT>**            NOT_READY | READY_WITH_GAPS | READY
 *   ## Thesis
 *   <one paragraph>
 *   ## Gaps
 *   - **[SEVERITY] <title>**
 *     - <evidence, carrying file:line pointers>
 *     - Cost: <consequence>
 *   ## Additions
 *   - [owner|cost] **<title>** — done when: <condition>
 *
 * Nothing here executes anything. Execution lives in audit-validator-calibration.mjs.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BONES = path.join(REPO, 'docs', 'handoff', 'bones');

export const VERDICTS = ['READY', 'READY_WITH_GAPS', 'NOT_READY'];
export const SEVERITIES = ['BLOCKING', 'MAJOR', 'MODERATE', 'MINOR'];

/** Repos a pointer may reference, and where they sit on this machine. */
export const REPO_PATHS = {
  'potentially-profitable': REPO,
  'Muntin-Invoice-Decoder': path.resolve(REPO, '..', 'Muntin-Invoice-Decoder'),
};

/**
 * A pointer is `path/to/file.ext` optionally followed by `:LINE` or `:LINE-LINE`.
 * Anchored on a real-looking extension so prose like "Q-041:" or "13-26 h/month"
 * cannot masquerade as evidence. Deliberately conservative: a missed pointer
 * under-counts checkable evidence, which biases the instrument AGAINST the
 * conclusion that validators were sloppy. A false pointer would bias toward it.
 */
// Extensions are ordered LONGEST-FIRST. Regex alternation is first-match, so
// `js|json` silently truncates `data/queue.json:1613` to `data/queue.js` with no
// line number — which reads as a MISSING FILE and would have made the validators
// look sloppier than they are. Caught by this module's own self-test.
const EXTS = ['nvmrc', 'jsonc', 'yaml', 'html', 'json', 'tsx', 'mjs', 'css', 'csv', 'sql', 'yml', 'txt', 'ts', 'js', 'md', 'py', 'sh'];
const POINTER_RE = new RegExp(
  `(?:^|[\\s\`("\\[])((?:[A-Za-z0-9._-]+/)*[A-Za-z0-9._()-]+\\.(?:${EXTS.join('|')}))(?::(\\d+)(?:-(\\d+))?)?`,
  'g',
);

export function extractPointers(text) {
  const out = [];
  const seen = new Set();
  for (const m of text.matchAll(POINTER_RE)) {
    // A leading "(" survives the char class (paths legitimately contain parens,
    // e.g. apps/web/app/(product)/inbox). Strip only an UNBALANCED leading one.
    let file = m[1];
    while (file.startsWith('(') && (file.match(/\)/g) || []).length < (file.match(/\(/g) || []).length) file = file.slice(1);
    // Prose artifacts: a bare filename with no directory and no line is usually
    // a script being NAMED, not cited. Keep it — existence is still checkable —
    // but mark it so the reproduction score can weight cited-line evidence higher.
    const line = m[2] ? Number(m[2]) : null;
    const endLine = m[3] ? Number(m[3]) : null;
    const key = `${file}:${line ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ file, line, endLine, hasLine: line !== null, bare: !file.includes('/') });
  }
  return out;
}

/** Split a markdown document into `## Heading` sections, preserving order. */
function sections(md) {
  const out = {};
  let cur = null;
  for (const raw of md.split('\n')) {
    const h = raw.match(/^##\s+(.+?)\s*$/);
    if (h) {
      cur = h[1].toLowerCase();
      out[cur] = [];
      continue;
    }
    if (cur) out[cur].push(raw);
  }
  for (const k of Object.keys(out)) out[k] = out[k].join('\n');
  return out;
}

/**
 * Gaps are a two-level bullet list. Top-level `- **[SEV] title**`, child `  - text`.
 * The first child is evidence; a child beginning `Cost:` is the consequence.
 */
function parseGaps(block, domain) {
  const gaps = [];
  let cur = null;
  for (const raw of (block || '').split('\n')) {
    const top = raw.match(/^-\s+\*\*\[([A-Z]+)\]\s*(.*)$/);
    if (top) {
      if (cur) gaps.push(cur);
      cur = {
        domain,
        severity: top[1],
        title: top[2].replace(/\*\*\s*$/, '').trim(),
        evidence: [],
        cost: '',
      };
      continue;
    }
    if (!cur) continue;
    const child = raw.match(/^\s{2,}-\s+(.*)$/);
    if (child) {
      const t = child[1].trim();
      if (/^Cost:/i.test(t)) cur.cost = t.replace(/^Cost:\s*/i, '');
      else cur.evidence.push(t);
      continue;
    }
    // continuation of the current bullet (wrapped title or evidence)
    const cont = raw.trim();
    if (!cont) continue;
    if (cur.cost) cur.cost += ' ' + cont;
    else if (cur.evidence.length) cur.evidence[cur.evidence.length - 1] += ' ' + cont;
    else cur.title += ' ' + cont.replace(/\*\*\s*$/, '');
  }
  if (cur) gaps.push(cur);
  return gaps.map((g, i) => {
    g.title = g.title.replace(/\*\*\s*$/, '').trim();
    g.id = `${domain}#${i + 1}`;
    g.evidenceText = g.evidence.join(' ');
    g.pointers = extractPointers(g.evidenceText);
    return g;
  });
}

/** Additions are `- [owner|cost] **title** — done when: condition`. */
function parseAdditions(block, domain) {
  const out = [];
  for (const raw of (block || '').split('\n')) {
    const m = raw.match(/^-\s+\[([^\]]*)\]\s*(.*)$/);
    if (!m) continue;
    const bracket = m[1];
    const owner = /^founder/i.test(bracket) ? 'founder' : /^agent/i.test(bracket) ? 'agent' : 'unknown';
    const rest = m[2];
    const dw = rest.split(/—\s*done when:/i);
    out.push({
      domain,
      owner,
      cost: bracket,
      title: (dw[0] || '').replace(/\*\*/g, '').replace(/\s*—\s*$/, '').trim(),
      doneWhen: (dw[1] || '').trim(),
      /** A doneWhen with no command-shaped or file-shaped proof is a DECISION, not a gap. */
      hasProofShape:
        /`[^`]+`/.test(rest) ||
        /\b(exits?|exit code|returns?|node scripts\/|grep|pnpm|bash )\b/i.test(dw[1] || '') ||
        extractPointers(dw[1] || '').length > 0,
    });
  }
  return out;
}

export function parseReport(file) {
  const md = readFileSync(file, 'utf8');
  const domain = path.basename(file).replace(/^validate-/, '').replace(/\.md$/, '');
  const title = (md.match(/^#\s+(.+)$/m) || [, domain])[1].trim();
  const verdictMatch = md.match(/^\*\*([A-Z_]+)\*\*\s*$/m);
  const verdict = verdictMatch ? verdictMatch[1] : 'UNPARSED';
  const s = sections(md);
  const gaps = parseGaps(s.gaps, domain);
  return {
    domain,
    title,
    verdict,
    file: path.relative(REPO, file),
    thesis: (s.thesis || '').trim(),
    thesisPointers: extractPointers(s.thesis || ''),
    gaps,
    additions: parseAdditions(s.additions, domain),
  };
}

export function loadCorpus(dir = BONES) {
  return readdirSync(dir)
    .filter((f) => /^validate-.*\.md$/.test(f))
    .sort()
    .map((f) => parseReport(path.join(dir, f)));
}
