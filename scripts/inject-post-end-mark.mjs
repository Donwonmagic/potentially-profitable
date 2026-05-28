#!/usr/bin/env node
/**
 * Idempotent injector for the post-end-mark (a muntin pane signature
 * + italic line) at the close of every published blog post. Sits
 * between </article> and the see-also block as an editorial "fin."
 *
 * Skips drafts (the /blog/drafts/ directory) and pages already
 * injected. Walks /blog/ and /es/blog/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), "..");
const dryRun = process.argv.includes("--dry-run");

// muntin pane signature — small 3-pane window, same construction
// as the brand mark.
const PANE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
  <rect x="4" y="4" width="16" height="16"/>
  <line x1="12" y1="4" x2="12" y2="20"/>
  <line x1="4" y1="10" x2="20" y2="10"/>
</svg>`;

const COPY = {
  en: "More from the library.",
  es: "Más desde la biblioteca.",
};

function buildBlock(locale) {
  return `<aside class="post-end-mark" aria-hidden="true">
  <hr/>
  <span class="post-end-glyph">${PANE_SVG}</span>
  <p>${COPY[locale]}</p>
</aside>
`;
}

function processFile({ filePath, locale }) {
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes("post-end-mark")) return "skipped";
  if (!html.includes("</article>")) return "no-article";

  const block = buildBlock(locale);
  // Preferred anchor: just before the see-also marker.
  if (html.includes("<!-- LIBRARY:see-also:start -->")) {
    html = html.replace(
      "<!-- LIBRARY:see-also:start -->",
      `${block}\n    <!-- LIBRARY:see-also:start -->`
    );
  } else if (html.includes('<aside class="further-reading"')) {
    html = html.replace(
      '<aside class="further-reading"',
      `${block}\n    <aside class="further-reading"`
    );
  } else {
    // Last resort: right after the closing </article>.
    html = html.replace("</article>", `</article>\n\n    ${block}`);
  }

  if (!dryRun) fs.writeFileSync(filePath, html, "utf8");
  return "injected";
}

const stats = {};
for (const [base, locale] of [
  [path.join(REPO, "blog"),           "en"],
  [path.join(REPO, "es", "blog"),     "es"],
  [path.join(REPO, "library"),        "en"],
  [path.join(REPO, "es", "library"),  "es"],
]) {
  if (!fs.existsSync(base)) continue;
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "drafts") continue;
    const f = path.join(base, entry.name, "index.html");
    if (!fs.existsSync(f)) continue;
    const result = processFile({ filePath: f, locale });
    stats[result] = (stats[result] || 0) + 1;
    console.log(`  ${locale} ${entry.name.padEnd(60)} ${result}`);
  }
}

console.log(`\n${JSON.stringify(stats)}`);
