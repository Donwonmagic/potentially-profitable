#!/usr/bin/env node
/**
 * publish-explorers.mjs — site-integrate the standalone open-data explorers (ADR-018 surface 3) into
 * /open/<slug>/index.html. The explorers are self-contained (inline data + viz + a rich provenance
 * footer) but built without site chrome; this injects the head meta/canonical/hreflang/og/breadcrumb +
 * the body-top skip-link/batch-banner/nav, keeping each explorer's own <style>, masthead, main and
 * footer intact (the CSS links land BEFORE the inline <style> so the explorer's viz styling wins).
 *
 * Source explorers are passed as a directory via --src (default: the session scratchpad). EN-only for
 * now — the es hreflang/og-alternate points at the future ES page, matching the site's rollout
 * convention; locale-parity is warn-only during rollout so these join the translator punch-list.
 *
 *   node scripts/publish-explorers.mjs --src /path/to/explorers
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcArg = process.argv.indexOf('--src');
const SRC = srcArg >= 0 ? process.argv[srcArg + 1] : path.join(repo, 'scratch-explorers');

const OG = 'https://muntin.digital/brand/og/tool-cost-pulse.png';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function headChrome({ title, desc, url, urlEs, name }) {
  const t = esc(title), d = esc(desc);
  return `<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<meta name="description" content="${d}" />
<meta name="theme-color" content="#2A50C8" />
<link rel="canonical" href="${url}" />
<link rel="alternate" hreflang="en" href="${url}" />
<link rel="alternate" hreflang="es" href="${urlEs}" />
<link rel="alternate" hreflang="x-default" href="${url}" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="es_US" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="Muntin Digital" />
<meta property="og:image" content="${OG}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${OG}" />
<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://muntin.digital/"},{"@type":"ListItem","position":2,"name":"Open data","item":"https://muntin.digital/open/"},{"@type":"ListItem","position":3,"name":"${esc(name)}","item":"${url}"}]}</script>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/fraunces-v38-latin-500.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-v20-latin-regular.woff2" crossorigin>
<link rel="stylesheet" href="/assets/site-core.css" />
`;
}

const NAV = `<a class="skip-link" href="#main">Skip to content</a>
<!-- batch-banner:start --><!-- batch-banner:end -->
<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="/" class="logo" aria-label="Muntin Digital">
      <img class="logo-mark" src="/brand/mark/mark-square-ink.svg" alt="" width="36" height="36" />
      <span class="logo-text">Muntin Digital</span>
    </a>
    <nav class="nav-links" aria-label="Primary"><a href="/open/">Open data</a><a href="/cost-index/">Cost Index</a></nav>
  </div>
</header>
`;

function integrate(html, slug) {
  const titleM = html.match(/<title>([^<]*)<\/title>/);
  const title = titleM ? titleM[1].trim() : slug;
  const descM = html.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const desc = descM ? descM[1].replace(/\\"/g, '"').replace(/\s+/g, ' ').trim().slice(0, 300) : title;
  // human name = title before the first em/en dash or "·"
  const name = title.split(/\s+[—–·|]\s+/)[0].trim();
  const url = `https://muntin.digital/open/${slug}/`;
  const urlEs = `https://muntin.digital/es/open/${slug}/`;

  // 1) head chrome before the first inline <style> (so its rules win the cascade)
  const styleAt = html.indexOf('<style>');
  if (styleAt < 0) throw new Error(`${slug}: no <style> to anchor head chrome`);
  html = html.slice(0, styleAt) + headChrome({ title, desc, url, urlEs, name }) + html.slice(styleAt);

  // 2) skip-link + batch-banner + nav at the start of the visible body. The explorers are structurally
  //    inconsistent (some have <body>, some omit it; some close </head>, some don't), so anchor on the
  //    first real content element (mast/main/h1 — never matches CSS text inside <style>).
  const contentM = html.match(/<(?:header|main|h1)\b/);
  const contentIdx = contentM ? html.indexOf(contentM[0]) : -1;
  if (contentIdx < 0) throw new Error(`${slug}: no content anchor (header/main/h1)`);
  const bodyTagM = html.slice(0, contentIdx).match(/<body[^>]*>/);
  if (bodyTagM) {
    const at = html.indexOf(bodyTagM[0]) + bodyTagM[0].length;
    html = html.slice(0, at) + '\n' + NAV + html.slice(at);
  } else {
    html = html.slice(0, contentIdx) + '<body>\n' + NAV + html.slice(contentIdx);
  }
  return html;
}

if (!fs.existsSync(SRC)) { console.error(`publish-explorers: source dir not found: ${SRC}`); process.exit(1); }
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.html'));
let n = 0;
for (const f of files) {
  const slug = f.replace(/\.html$/, '');
  const src = fs.readFileSync(path.join(SRC, f), 'utf8');
  const out = integrate(src, slug);
  const dir = path.join(repo, 'open', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out);
  n++;
  console.log(`  published /open/${slug}/`);
}
console.log(`publish-explorers: ${n} explorer(s) -> /open/<slug>/index.html`);
