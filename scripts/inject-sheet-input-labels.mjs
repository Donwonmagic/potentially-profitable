#!/usr/bin/env node
/**
 * inject-sheet-input-labels.mjs — give every Operator Sheet form control an
 * accessible name.
 *
 * THE PROBLEM (measured 2026-07-28 with axe-core against the built pages):
 * the sheets are fillable worksheets, and the ones built on a row-table put
 * their controls in bare <td> cells:
 *
 *   <thead><tr><th>Ingredient</th><th>Qty</th><th>Unit</th>…
 *   <tbody><tr><td><input name="ing_name_1"></td><td><input name="ing_qty_1"></td>…
 *
 * A sighted operator reads the column header. A screen-reader user gets
 * "edit text, blank" — 1216 `label` + 193 `select-name` violations across 26
 * of 33 sheet pages, i.e. essentially the whole Operator Sheets line was
 * unusable with assistive tech. (Controls already wrapped in a <label> — the
 * non-table sheets — were fine and are left alone.)
 *
 * THE FIX: derive each control's accessible name from the structure that
 * already carries the meaning — its column header, plus a row identifier —
 * and stamp it as an aria-label on the control:
 *
 *   <input name="ing_qty_1" aria-label="Qty — Ingredient 1">
 *
 * The row identifier prefers a static text cell in the row (many sheets name
 * their rows: "Walk-in cooler", "Monday"), and falls back to "row N". That
 * keeps the name meaningful when a table has 30 identical-looking rows.
 *
 * Nothing visual changes: aria-label is invisible to sighted users, so the
 * sheets look and print exactly as before.
 *
 * SCOPE — fragments AND the built pages. The fragment
 * (scripts/sheets-fragments/<slug>.html) is the source of truth for future
 * renders, but this script also stamps the already-built
 * sheets/<slug>/index.html + es/sheets/<slug>/index.html directly, for two
 * reasons:
 *
 *   1. build-sheet-pages.mjs only renders the 15 slugs marked live in
 *      data/sheets.json, while 33 sheet pages are committed — regenerating
 *      would leave 18 pages (vendor-contact-sheet, photo-shot-list, …)
 *      unfixed.
 *   2. That builder emits a SKELETON page (nav/footer are restored later by
 *      sync-includes.mjs). Running it here to deliver an aria-label would
 *      strip ~600 lines of nav from each committed page. Stamping the
 *      attribute in place is a pure addition — it cannot disturb the
 *      surrounding markup.
 *
 * The edit is idempotent: a control that already has an aria-label is
 * skipped, so this is safe to re-run and safe to gate with --check.
 *
 *   node scripts/inject-sheet-input-labels.mjs           # rewrite
 *   node scripts/inject-sheet-input-labels.mjs --check   # exit 1 on drift
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRAG_DIR = path.join(repoRoot, 'scripts', 'sheets-fragments');
const checkOnly = process.argv.includes('--check');

const CONTROL_RE = /<(input|select|textarea)\b[^>]*>/gi;

/** Strip tags + collapse entities/whitespace into a short human label. */
function textOf(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** A control already has an accessible name if it carries one explicitly. */
function hasName(tag) {
  return /\saria-label\s*=/.test(tag) || /\saria-labelledby\s*=/.test(tag) || /\stype\s*=\s*"hidden"/i.test(tag);
}

/** aria-label values are attribute content — keep them quote-safe and terse. */
function attrSafe(s) {
  return String(s).replace(/"/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

/**
 * Add aria-label to controls inside one <table> block.
 * Returns the rewritten table HTML and a count of labels added.
 */
function labelTable(tableHtml) {
  let added = 0;

  // Column headers from the first header row.
  const thead = tableHtml.match(/<thead[\s\S]*?<\/thead>/i);
  if (!thead) return { html: tableHtml, added };
  const headers = [...thead[0].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => textOf(m[1]));
  if (!headers.length) return { html: tableHtml, added };

  const tbodyM = tableHtml.match(/<tbody[\s\S]*?<\/tbody>/i);
  if (!tbodyM) return { html: tableHtml, added };

  let rowIndex = 0;
  const newTbody = tbodyM[0].replace(/<tr\b[\s\S]*?<\/tr>/gi, (rowHtml) => {
    rowIndex++;

    // Prefer a human row identifier: the first cell that is static text
    // (no control in it). Many sheets label their rows; those names are far
    // more useful than an ordinal.
    let rowLabel = '';
    const cells = [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)];
    for (const c of cells) {
      if (/<(input|select|textarea)\b/i.test(c[1])) continue;
      const t = textOf(c[1]);
      if (t && t !== '—' && t !== '-') { rowLabel = t; break; }
    }
    const rowRef = rowLabel || `row ${rowIndex}`;

    // Walk cells in order so the cell index maps onto the header list.
    let cellIndex = -1;
    return rowHtml.replace(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi, (cellHtml) => {
      cellIndex++;
      if (!/<(input|select|textarea)\b/i.test(cellHtml)) return cellHtml;
      // A control wrapped in its own <label> already has a name — leave it.
      if (/<label\b/i.test(cellHtml)) return cellHtml;

      const header = headers[cellIndex] || '';
      return cellHtml.replace(CONTROL_RE, (tag) => {
        if (hasName(tag)) return tag;
        const name = attrSafe(header ? `${header} — ${rowRef}` : rowRef);
        if (!name) return tag;
        added++;
        // Insert the attribute right after the tag name so the diff is stable.
        return tag.replace(/^<(input|select|textarea)\b/i, (m) => `${m} aria-label="${name}"`);
      });
    });
  });

  return { html: tableHtml.replace(tbodyM[0], newTbody), added };
}

function processFragment(src) {
  let total = 0;
  const out = src.replace(/<table\b[\s\S]*?<\/table>/gi, (tableHtml) => {
    const { html, added } = labelTable(tableHtml);
    total += added;
    return html;
  });
  return { out, added: total };
}

// Every file this script owns: the fragments (source of truth for future
// renders) plus the committed EN/ES sheet pages (what actually ships today).
function targets() {
  const out = [];
  if (fs.existsSync(FRAG_DIR)) {
    for (const f of fs.readdirSync(FRAG_DIR).filter((f) => f.endsWith('.html')).sort()) {
      out.push(path.join(FRAG_DIR, f));
    }
  }
  for (const dir of ['sheets', 'es/sheets']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    for (const slug of fs.readdirSync(root).sort()) {
      const p = path.join(root, slug, 'index.html');
      if (fs.existsSync(p)) out.push(p);
    }
  }
  return out;
}

const files = targets();

let changedFiles = 0;
let totalAdded = 0;
const drifted = [];

for (const p of files) {
  const src = fs.readFileSync(p, 'utf8');
  const { out, added } = processFragment(src);
  if (out !== src) {
    changedFiles++;
    totalAdded += added;
    drifted.push(`${path.relative(repoRoot, p)} (+${added} label${added === 1 ? '' : 's'})`);
    if (!checkOnly) fs.writeFileSync(p, out);
  }
}

if (checkOnly) {
  if (changedFiles) {
    console.error(`✗ sheet input labels: ${changedFiles} file(s) would gain ${totalAdded} aria-label(s) — run: node scripts/inject-sheet-input-labels.mjs`);
    for (const d of drifted.slice(0, 12)) console.error(`  - ${d}`);
    process.exit(1);
  }
  console.log(`✓ sheet input labels: all ${files.length} file(s) name every row-table control.`);
} else {
  console.log(`sheet input labels: ${changedFiles} file(s) updated, ${totalAdded} aria-label(s) added across ${files.length} file(s).`);
}
