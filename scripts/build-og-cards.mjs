#!/usr/bin/env node
/**
 * Spec-driven OG card builder.
 *
 * Why this exists
 * ---------------
 * The 55 hand-coded SVGs in brand/og/ drifted — footer URLs went
 * stale (muntin.digital/blog everywhere), absolute coordinates
 * pinned labels to shape positions with no baseline grid, and
 * every card composed eyebrow + 3-line headline + right-side data
 * card + footer bar with no consistent craft. A manifest + typed
 * templates eliminates that. Every card in brand/og/cards.json is
 * generated from one of four kind-templates (page | article |
 * research | tool) that share primitives (muntin-mark leitmotif,
 * 8px baseline grid, category accent, ornament signature, footer).
 * Design upgrades land in the template and propagate to every card
 * on the next build.
 *
 * Output policy
 * -------------
 * SVG viewBox is 1200x630 (what HTML meta declares), PNG is rendered
 * at 2400x1260 — 2x for retina + platforms that upscale (LinkedIn
 * renders OGs at ~1.5x in feed). Scrapers key off og:image:width/
 * height meta, not pixel dimensions, so the file is physically 2x
 * but semantically 1200x630.
 *
 * Fonts
 * -----
 * rsvg-convert resolves font-family via fontconfig. brand/fonts-
 * for-og/fonts.conf points it at assets/fonts/pdf/ (self-hosted
 * Fraunces + Inter TTFs). Without this, renders fall back to
 * Georgia + Arial.
 *
 * Usage
 * -----
 *   node scripts/build-og-cards.mjs              # render everything
 *   node scripts/build-og-cards.mjs --dry-run    # list, no writes
 *   node scripts/build-og-cards.mjs <slug>       # render one
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), "..");
const OG_DIR = path.join(REPO, "brand", "og");
const CARDS_JSON = path.join(OG_DIR, "cards.json");
const FONTS_DIR = path.join(REPO, "assets", "fonts", "pdf");
const FONTS_CONF_TEMPLATE = path.join(REPO, "brand", "fonts-for-og", "fonts.conf");

const CANVAS_W = 1200;
const CANVAS_H = 630;
const RENDER_W = CANVAS_W * 2;
const RENDER_H = CANVAS_H * 2;
const EDGE = 80;       // edge padding (up from 72 on legacy cards)
const BASELINE = 8;    // 8px baseline grid

// Single source of truth for category accents.
const PALETTE = {
  ink:    "#14161A",
  cream:  "#FAF7F2",
  teal:   "#1F4E5B",
  rust:   "#B8541A",
  gold:   "#C5A059",
  muted:  "#6B6B6B",
  rule:   "#E8E2D6",
  dim:    "rgba(250,247,242,0.55)",
};

// -------------------------------------------------------------
// helpers
// -------------------------------------------------------------

/** Snap a y-coordinate to the 8px baseline grid. */
const snap = (y) => Math.round(y / BASELINE) * BASELINE;

/** Escape XML text content (not attributes). */
function xmlEscape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -------------------------------------------------------------
// primitives — muntin-mark, footer, ornament
// -------------------------------------------------------------

/**
 * Muntin-mark leitmotif. A window-grid silhouette used as the
 * signature anchor on every card. `variant` controls size + placement:
 *   - "anchor":  bottom-left, large, low-opacity (page cards)
 *   - "inline":  mid-right corner, medium (article/research)
 *   - "focal":   oversized centerpiece for focus=type
 */
function muntinMark({ variant = "anchor", stroke = PALETTE.cream, opacity = 0.12 } = {}) {
  const specs = {
    anchor: { x: EDGE,  y: 310, size: 260, sw: 10 },
    inline: { x: 880,   y: 150, size: 180, sw: 7  },
    focal:  { x: 760,   y: 140, size: 340, sw: 12 },
  };
  const s = specs[variant] ?? specs.anchor;
  const mid = s.size / 2;
  const lintel = Math.round(s.size * 0.35);  // horizontal bar sits above midline
  return `
    <g transform="translate(${s.x}, ${s.y})"
       stroke="${stroke}" stroke-width="${s.sw}"
       stroke-linecap="square" stroke-linejoin="miter"
       fill="none" opacity="${opacity}">
      <rect x="0" y="0" width="${s.size}" height="${s.size}"/>
      <line x1="${mid}" y1="0" x2="${mid}" y2="${s.size}"/>
      <line x1="0" y1="${lintel}" x2="${s.size}" y2="${lintel}"/>
    </g>
  `;
}

/**
 * Footer line: 1px rule + MUNTIN DIGITAL (tracked, left) +
 * muntin.digital (right). No path, no date — timeless.
 */
function footer({ color = PALETTE.muted, ruleColor = PALETTE.rule } = {}) {
  const ruleY = snap(582);   // 582 → 584
  const textY = 614;
  return `
    <line x1="${EDGE}" y1="${ruleY}" x2="${CANVAS_W - EDGE}" y2="${ruleY}"
          stroke="${ruleColor}" stroke-width="1"/>
    <text x="${EDGE}" y="${textY}"
          font-family="Inter, Arial, sans-serif" font-size="14"
          font-weight="600" letter-spacing="2" fill="${color}">MUNTIN DIGITAL</text>
    <text x="${CANVAS_W - EDGE}" y="${textY}" text-anchor="end"
          font-family="Inter, Arial, sans-serif" font-size="14"
          font-weight="600" letter-spacing="1" fill="${color}">muntin.digital</text>
  `;
}

/**
 * Signature ornament: a small bracketed 'D' (Don) at card base,
 * centered below the title column. The author's stamp — intentionally
 * understated.
 */
function ornament({ color = PALETTE.muted, x = EDGE, y = 552 } = {}) {
  return `
    <g transform="translate(${x}, ${snap(y)})" fill="${color}" opacity="0.6">
      <circle cx="8" cy="8" r="8" fill="none" stroke="${color}" stroke-width="1"/>
      <text x="8" y="12" text-anchor="middle"
            font-family="Fraunces, Georgia, serif" font-style="italic"
            font-size="11" font-weight="500" fill="${color}">d</text>
    </g>
  `;
}

/**
 * Left-edge category strip (8px accent bar full-height). Dropped on
 * page cards that use ink/cream inverse — the background itself is
 * the category signal.
 */
function categoryStrip(accent) {
  if (accent === "ink") return "";
  // 12px rail — present but not loud. The top 40% is solid, below
  // fades to the accent at low opacity — a subtle editorial detail.
  return `
    <rect x="0" y="0" width="12" height="${CANVAS_H * 0.4}" fill="${accent}"/>
    <rect x="0" y="${CANVAS_H * 0.4}" width="12" height="${CANVAS_H * 0.6}" fill="${accent}" opacity="0.4"/>
  `;
}

// -------------------------------------------------------------
// focus modules — pluggable right-column content
// -------------------------------------------------------------

const focusModules = {
  /** Typography-only focus. The mark itself is the anchor. */
  type: ({ card, fg }) => muntinMark({
    variant: "focal",
    stroke: fg,
    opacity: 0.14,
  }),

  /**
   * Numbered list. Up to 5 items. Sits on the right side of the card.
   * focus.items is an array of strings.
   * focus.label is the column header (tracked Inter).
   */
  list: ({ card, fg, accentHex }) => {
    const items = (card.focus?.items ?? []).slice(0, 5);
    const label = xmlEscape((card.focus?.label ?? "").toUpperCase());
    const x = 760;
    const yStart = 150;
    const rowH = 64;    // 8px × 8 = snap-friendly
    const rows = items.map((item, i) => {
      const y = yStart + 40 + i * rowH;
      const n = i + 1;
      return `
        <circle cx="${x}" cy="${y - 14}" r="18" fill="none"
                stroke="${accentHex}" stroke-width="1.5" opacity="0.75"/>
        <text x="${x}" y="${y - 9}" text-anchor="middle"
              font-family="Fraunces, Georgia, serif" font-style="italic"
              font-size="18" font-weight="500" fill="${accentHex}">${n}</text>
        <text x="${x + 36}" y="${y - 8}"
              font-family="Inter, Arial, sans-serif" font-size="18"
              font-weight="500" fill="${fg}" opacity="0.88">${xmlEscape(item)}</text>
      `;
    }).join("");
    return `
      <text x="${x}" y="${yStart}"
            font-family="Inter, Arial, sans-serif" font-size="12"
            font-weight="700" letter-spacing="3" fill="${fg}" opacity="0.5">${label}</text>
      ${rows}
    `;
  },

  /**
   * Horizontal funnel showing stage-by-stage dropoff. Ported from
   * the reservations post's inline figure. focus.data = array of
   * numbers (start large, end small), focus.labels = optional
   * array same length, focus.lost_label = caption under the final
   * lost figure. Colors intensify toward the bottom.
   */
  funnel: ({ card, fg, accentHex }) => {
    const data = card.focus?.data ?? [];
    if (!data.length) return "";
    const labels = card.focus?.labels ?? [];
    const lostLabel = xmlEscape(card.focus?.lost_label ?? "");
    const label = xmlEscape((card.focus?.label ?? "").toUpperCase());
    const x = 700;
    const yStart = snap(160);
    const maxW = 340;
    const top = data[0] || 1;
    const rowH = 28;
    const gap = 8;
    const rows = data.map((n, i) => {
      const w = Math.round((n / top) * maxW);
      const y = yStart + 32 + i * (rowH + gap);
      const opacity = 0.35 + (i / Math.max(1, data.length - 1)) * 0.55;
      const color = i === data.length - 1 ? accentHex : PALETTE.teal;
      const lbl = labels[i] ?? String(n);
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${rowH}" rx="3"
              fill="${color}" opacity="${opacity}"/>
        <text x="${x + maxW + 16}" y="${y + 19}"
              font-family="Inter, Arial, sans-serif" font-size="14"
              font-weight="${i === data.length - 1 ? 700 : 500}"
              fill="${i === data.length - 1 ? accentHex : PALETTE.muted}">${xmlEscape(String(lbl))}</text>
      `;
    }).join("");
    const yCaption = yStart + 32 + data.length * (rowH + gap) + 20;
    return `
      <text x="${x}" y="${yStart}"
            font-family="Inter, Arial, sans-serif" font-size="12"
            font-weight="700" letter-spacing="3" fill="${PALETTE.muted}">${label}</text>
      ${rows}
      ${lostLabel ? `<text x="${x}" y="${yCaption}"
            font-family="Inter, Arial, sans-serif" font-size="13"
            font-weight="600" fill="${accentHex}">${lostLabel}</text>` : ""}
    `;
  },

  /**
   * Pull quote with attribution. focus.text = the quote (no outer
   * quotation marks — we stamp them), focus.attribution = who said
   * it, focus.wrap = optional max chars/line hint (default 28).
   */
  quote: ({ card, fg, accentHex, onLight = false }) => {
    const raw = card.focus?.text ?? "";
    const attribution = xmlEscape(card.focus?.attribution ?? "");
    const max = card.focus?.wrap ?? 28;
    // Greedy wrap into lines.
    const words = raw.split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; }
      else { cur = (cur + " " + w).trim(); }
    }
    if (cur) lines.push(cur);
    const x = 700;
    const xMark = 680;
    const yStart = snap(208);
    const lineH = 58;
    const quoteColor = onLight ? PALETTE.ink : fg;
    const rows = lines.map((ln, i) => `
      <text x="${x}" y="${yStart + i * lineH}"
            font-family="Fraunces, Georgia, serif" font-style="italic"
            font-size="38" font-weight="500" letter-spacing="-1"
            fill="${quoteColor}">${xmlEscape(ln)}</text>
    `).join("");
    const yAttr = yStart + lines.length * lineH + 24;
    return `
      <text x="${xMark}" y="${yStart - 36}"
            font-family="Fraunces, Georgia, serif" font-size="112"
            font-weight="500" fill="${accentHex}" opacity="0.35">&#x201C;</text>
      ${rows}
      <line x1="${x}" y1="${yAttr - 14}" x2="${x + 36}" y2="${yAttr - 14}"
            stroke="${accentHex}" stroke-width="2"/>
      <text x="${x + 48}" y="${yAttr - 10}"
            font-family="Inter, Arial, sans-serif" font-size="14"
            font-weight="600" letter-spacing="2" fill="${accentHex}">${attribution}</text>
    `;
  },

  /**
   * Score ring — circular gauge with threshold zones (for Lighthouse).
   * focus.value = numeric score (0-100), focus.label = under ring.
   * Teal ≥70, gold 50-69, rust <50.
   */
  "score-ring": ({ card, fg, onLight = false }) => {
    const value = Math.max(0, Math.min(100, Number(card.focus?.value ?? 0)));
    const label = xmlEscape((card.focus?.label ?? "").toUpperCase());
    const cx = 920;
    const cy = 300;
    const r = 110;
    const circ = 2 * Math.PI * r;
    const filled = (value / 100) * circ;
    const empty = circ - filled;
    const zoneColor = value >= 70 ? PALETTE.teal : value >= 50 ? PALETTE.gold : PALETTE.rust;
    const trackColor = onLight ? "rgba(20,22,26,0.08)" : "rgba(250,247,242,0.14)";
    const numberColor = onLight ? PALETTE.ink : fg;
    // Threshold ticks at 50 and 90 (outer).
    const tick = (pct) => {
      const a = -Math.PI / 2 + (pct / 100) * 2 * Math.PI;
      const r1 = r + 12, r2 = r + 24;
      return `<line x1="${cx + r1 * Math.cos(a)}" y1="${cy + r1 * Math.sin(a)}"
                    x2="${cx + r2 * Math.cos(a)}" y2="${cy + r2 * Math.sin(a)}"
                    stroke="${onLight ? PALETTE.muted : PALETTE.dim}" stroke-width="2"/>`;
    };
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${trackColor}" stroke-width="18"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${zoneColor}" stroke-width="18"
              stroke-dasharray="${filled} ${empty}"
              transform="rotate(-90 ${cx} ${cy})"
              stroke-linecap="butt"/>
      ${tick(50)}
      ${tick(90)}
      <text x="${cx}" y="${cy + 18}" text-anchor="middle"
            font-family="Fraunces, Georgia, serif" font-size="96"
            font-weight="500" letter-spacing="-4" fill="${numberColor}">${value}</text>
      <text x="${cx}" y="${cy + r + 56}" text-anchor="middle"
            font-family="Inter, Arial, sans-serif" font-size="12"
            font-weight="700" letter-spacing="3" fill="${zoneColor}">${label}</text>
    `;
  },

  /**
   * Single large statistic. focus.value = display number/string,
   * focus.caption = line under value, focus.source = attribution line.
   */
  stat: ({ card, fg, accentHex }) => {
    const value = xmlEscape(card.focus?.value ?? "");
    const caption = xmlEscape(card.focus?.caption ?? "");
    const source = xmlEscape((card.focus?.source ?? "").toUpperCase());
    const x = 780;
    return `
      <text x="${x}" y="${snap(200)}"
            font-family="Inter, Arial, sans-serif" font-size="12"
            font-weight="700" letter-spacing="3" fill="${fg}" opacity="0.5">${source}</text>
      <text x="${x}" y="${snap(320)}"
            font-family="Fraunces, Georgia, serif" font-size="128"
            font-weight="500" letter-spacing="-4" fill="${accentHex}">${value}</text>
      <text x="${x}" y="${snap(376)}"
            font-family="Inter, Arial, sans-serif" font-size="18"
            font-weight="500" fill="${fg}" opacity="0.78">${caption}</text>
    `;
  },
};

// -------------------------------------------------------------
// templates — one per kind
// -------------------------------------------------------------

/**
 * page — home, about, services, learn hub, /system/, etc.
 * Brand-forward: ink background, cream type, big muntin mark.
 */
function renderPage(card) {
  const bg = PALETTE.ink;
  const fg = PALETTE.cream;
  const dim = PALETTE.dim;
  // Pages are brand-forward (ink bg). When a focus module needs an
  // accent color (stat value, list numbers), fall back to a warm
  // highlight rather than cream — keeps the focal point readable.
  const accentHex = card.accent && card.accent !== "ink" ? PALETTE[card.accent] : PALETTE.gold;
  const eyebrow = (card.eyebrow ?? "").toUpperCase();

  const title1 = xmlEscape(card.title_1 ?? "");
  const titleItalic = xmlEscape(card.title_italic ?? "");
  const title2 = xmlEscape(card.title_2 ?? "");
  const dek = xmlEscape(card.dek ?? "");

  const focus = (focusModules[card.focus?.type] ?? (() => ""))({ card, fg, accentHex });

  // 8px baseline positions.
  const yEyebrow = snap(128);    // 128
  const yT1 = snap(232);         // 232
  const yTi = snap(312);         // 312
  const yT2 = snap(392);         // 392
  const yDek = snap(472);        // 472

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="${CANVAS_W}" height="${CANVAS_H}">
  <defs>
    <radialGradient id="glow" cx="85%" cy="20%" r="70%">
      <stop offset="0%" stop-color="${PALETTE.teal}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="${bg}"/>
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#glow)"/>

  ${focus}

  <text x="${EDGE}" y="${yEyebrow}"
        font-family="Inter, Arial, sans-serif" font-size="14"
        font-weight="700" letter-spacing="5" fill="${fg}" opacity="0.55">${xmlEscape(eyebrow)}</text>

  <text x="${EDGE}" y="${yT1}"
        font-family="Fraunces, Georgia, serif" font-size="76"
        font-weight="500" letter-spacing="-2" fill="${fg}">${title1}</text>
  <text x="${EDGE}" y="${yTi}"
        font-family="Fraunces, Georgia, serif" font-style="italic"
        font-size="76" font-weight="400" letter-spacing="-2"
        fill="${fg}" opacity="0.82">${titleItalic}</text>
  <text x="${EDGE}" y="${yT2}"
        font-family="Fraunces, Georgia, serif" font-size="76"
        font-weight="500" letter-spacing="-2" fill="${fg}">${title2}</text>

  <text x="${EDGE}" y="${yDek}"
        font-family="Inter, Arial, sans-serif" font-size="22"
        font-weight="400" fill="${fg}" opacity="0.65">${dek}</text>

  ${ornament({ color: fg })}
  ${footer({ color: dim, ruleColor: "rgba(250,247,242,0.18)" })}
</svg>
`;
}

/**
 * research — short notes under /learn/research/. Cream background,
 * rust accent (the evidence-shelf color), serif headline, right-
 * column focus module.
 */
function renderResearch(card) {
  const bg = PALETTE.cream;
  const fg = PALETTE.ink;
  const accentHex = PALETTE[card.accent ?? "rust"] ?? PALETTE.rust;
  const eyebrow = (card.eyebrow ?? "").toUpperCase();

  const title1 = xmlEscape(card.title_1 ?? "");
  const titleItalic = xmlEscape(card.title_italic ?? "");
  const title2 = xmlEscape(card.title_2 ?? "");
  const dek = xmlEscape(card.dek ?? "");

  const focusFn = focusModules[card.focus?.type];
  const focus = focusFn
    ? focusFn({ card, fg, accentHex, onLight: true })
    : "";

  // 8px baseline positions. Tighter vertical rhythm than page
  // because research cards trend toward more on-canvas content.
  const yEyebrow = snap(104);
  const yT1 = snap(192);
  const yTi = snap(260);
  const yT2 = snap(328);
  const yDek = snap(408);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="${CANVAS_W}" height="${CANVAS_H}">
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="${bg}"/>
  ${categoryStrip(accentHex)}

  <text x="${EDGE}" y="${yEyebrow}"
        font-family="Inter, Arial, sans-serif" font-size="13"
        font-weight="700" letter-spacing="4" fill="${accentHex}">${xmlEscape(eyebrow)}</text>

  <text x="${EDGE}" y="${yT1}"
        font-family="Fraunces, Georgia, serif" font-size="60"
        font-weight="500" letter-spacing="-2" fill="${fg}">${title1}</text>
  <text x="${EDGE}" y="${yTi}"
        font-family="Fraunces, Georgia, serif" font-style="italic"
        font-size="60" font-weight="400" letter-spacing="-2"
        fill="${accentHex}">${titleItalic}</text>
  <text x="${EDGE}" y="${yT2}"
        font-family="Fraunces, Georgia, serif" font-size="60"
        font-weight="500" letter-spacing="-2" fill="${fg}">${title2}</text>

  <text x="${EDGE}" y="${yDek}"
        font-family="Inter, Arial, sans-serif" font-size="20"
        font-weight="400" fill="${PALETTE.muted}">${dek}</text>

  ${focus}

  ${ornament({ color: PALETTE.muted })}
  ${footer({ color: PALETTE.muted, ruleColor: PALETTE.rule })}
</svg>
`;
}

/**
 * article — blog posts under /blog/. Same cream-bg editorial
 * language as research, but teal accent (per the design brief:
 * Articles → teal) and a slightly roomier title block to
 * accommodate the longer editorial headlines.
 */
function renderArticle(card) {
  const bg = PALETTE.cream;
  const fg = PALETTE.ink;
  const accentHex = PALETTE[card.accent ?? "teal"] ?? PALETTE.teal;
  const eyebrow = (card.eyebrow ?? "").toUpperCase();

  const title1 = xmlEscape(card.title_1 ?? "");
  const titleItalic = xmlEscape(card.title_italic ?? "");
  const title2 = xmlEscape(card.title_2 ?? "");
  const dek = xmlEscape(card.dek ?? "");

  const focusFn = focusModules[card.focus?.type];
  const focus = focusFn ? focusFn({ card, fg, accentHex, onLight: true }) : "";

  const yEyebrow = snap(96);
  const yT1 = snap(184);
  const yTi = snap(256);
  const yT2 = snap(328);
  const yDek = snap(408);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="${CANVAS_W}" height="${CANVAS_H}">
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="${bg}"/>
  ${categoryStrip(accentHex)}

  <text x="${EDGE}" y="${yEyebrow}"
        font-family="Inter, Arial, sans-serif" font-size="13"
        font-weight="700" letter-spacing="4" fill="${accentHex}">${xmlEscape(eyebrow)}</text>

  <text x="${EDGE}" y="${yT1}"
        font-family="Fraunces, Georgia, serif" font-size="58"
        font-weight="500" letter-spacing="-2" fill="${fg}">${title1}</text>
  <text x="${EDGE}" y="${yTi}"
        font-family="Fraunces, Georgia, serif" font-style="italic"
        font-size="58" font-weight="400" letter-spacing="-2"
        fill="${accentHex}">${titleItalic}</text>
  <text x="${EDGE}" y="${yT2}"
        font-family="Fraunces, Georgia, serif" font-size="58"
        font-weight="500" letter-spacing="-2" fill="${fg}">${title2}</text>

  <text x="${EDGE}" y="${yDek}"
        font-family="Inter, Arial, sans-serif" font-size="20"
        font-weight="400" fill="${PALETTE.muted}">${dek}</text>

  ${focus}

  ${ornament({ color: PALETTE.muted })}
  ${footer({ color: PALETTE.muted, ruleColor: PALETTE.rule })}
</svg>
`;
}

const templates = {
  page: renderPage,
  research: renderResearch,
  article: renderArticle,
};

// -------------------------------------------------------------
// rendering — rsvg-convert on CI, resvg-js fallback locally
// -------------------------------------------------------------

function buildFontconfig() {
  if (!fs.existsSync(FONTS_CONF_TEMPLATE) || !fs.existsSync(FONTS_DIR)) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "og-fontconfig-"));
  const confPath = path.join(tmp, "fonts.conf");
  const src = fs.readFileSync(FONTS_CONF_TEMPLATE, "utf8").replace(/\{\{FONTS_DIR\}\}/g, FONTS_DIR);
  fs.writeFileSync(confPath, src, "utf8");
  return confPath;
}

function hasRsvgConvert() {
  try {
    execFileSync("rsvg-convert", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function renderPng(svgPath, pngPath) {
  const fontconfigFile = buildFontconfig();
  if (hasRsvgConvert()) {
    const env = { ...process.env };
    if (fontconfigFile) env.FONTCONFIG_FILE = fontconfigFile;
    execFileSync(
      "rsvg-convert",
      ["-w", String(RENDER_W), "-h", String(RENDER_H), "-b", "white", svgPath, "-o", pngPath],
      { env, stdio: "inherit" }
    );
    return "rsvg-convert";
  }
  // Local dev fallback: @resvg/resvg-js from /tmp/og-render-deps.
  // This path is only for visual QA on a laptop that doesn't have
  // rsvg-convert. CF Pages build has rsvg-convert installed.
  const scratch = "/tmp/og-render-deps/node_modules/@resvg/resvg-js/index.js";
  if (!fs.existsSync(scratch)) {
    throw new Error("Neither rsvg-convert nor @resvg/resvg-js available. Install rsvg-convert or `npm i --prefix /tmp/og-render-deps @resvg/resvg-js`.");
  }
  const { Resvg } = await import(scratch);
  const fontFiles = fs.readdirSync(FONTS_DIR)
    .filter((f) => f.endsWith(".ttf"))
    .map((f) => path.join(FONTS_DIR, f));
  const svg = fs.readFileSync(svgPath);
  const r = new Resvg(svg, {
    fitTo: { mode: "width", value: RENDER_W },
    background: "white",
    font: {
      fontFiles,
      loadSystemFonts: false,
      defaultFontFamily: "Inter",
      serifFamily: "Fraunces",
      sansSerifFamily: "Inter",
    },
  });
  fs.writeFileSync(pngPath, r.render().asPng());
  return "resvg-js";
}

// -------------------------------------------------------------
// main
// -------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const only = args.find((a) => !a.startsWith("--"));

  const manifest = JSON.parse(fs.readFileSync(CARDS_JSON, "utf8"));
  const cards = manifest.cards.filter((c) => !only || c.slug === only);

  let wrote = 0;
  let skipped = 0;
  for (const card of cards) {
    const render = templates[card.kind];
    if (!render) {
      console.error(`  ! unknown kind: ${card.kind} (${card.slug})`);
      continue;
    }
    const svg = render(card);
    const svgPath = path.join(OG_DIR, `${card.slug}.svg`);
    const pngPath = path.join(OG_DIR, `${card.slug}.png`);

    if (dryRun) {
      console.log(`  · ${card.slug}.svg (${card.kind})`);
      continue;
    }

    const prev = fs.existsSync(svgPath) ? fs.readFileSync(svgPath, "utf8") : "";
    if (prev !== svg) {
      fs.writeFileSync(svgPath, svg, "utf8");
    }
    const svgMtime = fs.statSync(svgPath).mtimeMs;
    const pngMtime = fs.existsSync(pngPath) ? fs.statSync(pngPath).mtimeMs : 0;
    if (pngMtime >= svgMtime && prev === svg) {
      skipped++;
      continue;
    }
    const engine = await renderPng(svgPath, pngPath);
    console.log(`  ✓ ${card.slug}.png  [${engine}]`);
    wrote++;
  }
  console.log(`\nrendered ${wrote}, skipped ${skipped}, total ${cards.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
