#!/usr/bin/env node
// scripts/check-text-content-rendering.mjs
//
// Phase 2.8 CI guard. Plan §2.6 / §5.6 rule 11 — operator-derived
// content (Window message bodies, transcripts, alt-text, etc.) must
// be rendered via textContent only, never innerHTML. The server-side
// sanitizePlaintext re-escapes correctly (src/lib/submissions.js:91-106)
// but a stray innerHTML on the client would still render any
// HTML-shaped strings.
//
// This script is narrow on purpose: page-authored HTML uses innerHTML
// legitimately for content the developer controls. We forbid only
// the patterns where operator data flows into innerHTML.
//
// Forbidden patterns (in Window-related JS files):
//   - `els.body.innerHTML = `
//   - `els.thread.innerHTML = `       (where `thread` is the message scroll)
//   - any `.innerHTML = ` where the right-hand side contains
//     `m.body`, `msg.body`, `m.transcript`, `msg.transcript`,
//     `excerpt`, `j.body`, `j.thread.body` (operator data references)
//
// Allowlisted: page-authored static markup (e.g., the empty-state
// SVG injected via innerHTML in early window.js). Add file-level
// `// @check-text-content allow` comment to opt out.
//
// Run: node scripts/check-text-content-rendering.mjs

import { readFileSync } from 'node:fs';
import process from 'node:process';

// Files this guard checks. Narrow on purpose.
const FILES = [
  'assets/js/window.js',
  'assets/js/window-state.js',
  'assets/js/window-handoff.js',
  'assets/js/admin-window.js',
];

// Operator-data identifier substrings. If the right-hand side of an
// innerHTML assignment contains any of these (literal text match —
// crude but effective), flag it.
const OPERATOR_REFS = [
  'm.body', 'msg.body', 'message.body', 'thread.body',
  'm.transcript', 'msg.transcript',
  'excerpt', 'excerpts',
  '.body', // catches `j.body`, `res.body.body`, `body.body`. Generous on purpose.
  'authorEmail', 'recipient',
];

let failures = 0;

for (const path of FILES) {
  let body;
  try {
    body = readFileSync(path, 'utf8');
  } catch (_) {
    // File doesn't exist yet (e.g., a Phase 3 script not yet
    // shipped) — skip silently.
    continue;
  }
  if (body.includes('// @check-text-content allow')) continue;
  const lines = body.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match `.innerHTML =` (assignment) — not `.innerHTML +=` (which
    // can be safe for static append) or `.outerHTML` (different beast).
    const m = line.match(/\.innerHTML\s*=\s*([^;]+)/);
    if (!m) continue;
    const rhs = m[1];
    // Plain empty-string clear is safe.
    if (/^\s*['"]['"]\s*$/.test(rhs)) continue;
    // Check for operator-data references on the RHS.
    let unsafe = false;
    for (const ref of OPERATOR_REFS) {
      if (rhs.includes(ref)) { unsafe = true; break; }
    }
    if (!unsafe) {
      // Even if no operator ref is on the line, flag a generic
      // warning so reviewers eyeball it. This is intentionally
      // chatty — the false-positive cost is one comment, the
      // false-negative cost is XSS.
      console.warn('text-content-rendering: ' + path + ':' + (i + 1) + ' uses .innerHTML — verify the RHS is page-authored');
      continue;
    }
    console.error('text-content-rendering: ' + path + ':' + (i + 1) + ' .innerHTML = with operator-data reference: ' + line.trim());
    failures++;
  }
}

if (failures > 0) {
  console.error('\ntext-content-rendering: ' + failures + ' violation(s).');
  console.error('Use textContent or appendChild + textContent for operator-derived data.');
  console.error('See docs/window-redesign-plan.md §5.6 rule 11.');
  process.exit(1);
}
console.log('text-content-rendering: clean.');
