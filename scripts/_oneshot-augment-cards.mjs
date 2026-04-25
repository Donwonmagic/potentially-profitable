#!/usr/bin/env node
/**
 * One-shot: augment brand/og/cards.json with the `glyph` field on
 * existing entries + add manifest entries for all PNGs that exist
 * on disk without a manifest record (so the spec-driven builder
 * propagates template upgrades to every card going forward).
 *
 * Idempotent: re-running only adds the glyph field where missing
 * and inserts new entries by slug if absent. Hand edits are
 * preserved.
 *
 * Delete this script after running once; the augmentation is the
 * commit, not the script.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), "..");
const CARDS = path.join(REPO, "brand", "og", "cards.json");

// -------------------------------------------------------------
// glyph + accent map for existing entries (60 cards)
// -------------------------------------------------------------
//
// Format: slug → { glyph, accent? }. Accent override only set when
// the audit found drift from the documented rule (Part 1c of the
// plan). When undefined, leave the existing accent alone.
const EXISTING = {
  // System / colophon
  system:                                      { glyph: "code" },
  "system-es":                                  { glyph: "code" },
  // Library
  learn:                                       { glyph: "glossary" },
  "learn-es":                                   { glyph: "glossary" },
  "learn-start-here":                           { glyph: "glossary" },
  "learn-start-here-es":                        { glyph: "glossary" },
  "learn-research":                             { glyph: "research" },
  "learn-research-es":                          { glyph: "research" },
  library:                                     { glyph: "glossary" },
  "library-es":                                 { glyph: "glossary" },
  topics:                                      { glyph: "glossary" },
  "topics-es":                                  { glyph: "glossary" },
  // Topics — accent locked to subject family
  "topic-speed-mobile":                         { glyph: "speed",       accent: "teal" },
  "topic-speed-mobile-es":                      { glyph: "speed",       accent: "teal" },
  "topic-conversions":                          { glyph: "conversions", accent: "rust" },
  "topic-conversions-es":                       { glyph: "conversions", accent: "rust" },
  "topic-local-seo":                            { glyph: "local-seo",   accent: "teal" },
  "topic-local-seo-es":                         { glyph: "local-seo",   accent: "teal" },
  "topic-operations-margin":                    { glyph: "margin",      accent: "gold" },
  "topic-operations-margin-es":                 { glyph: "margin",      accent: "gold" },
  "topic-trust-reviews":                        { glyph: "trust" },
  "topic-trust-reviews-es":                     { glyph: "trust" },
  "topic-brand-design":                         { glyph: "brand" },
  "topic-brand-design-es":                      { glyph: "brand" },
  // Research
  "research-mobile-page-speed":                 { glyph: "speed" },
  "research-mobile-page-speed-es":              { glyph: "speed" },
  "research-fittss-law":                        { glyph: "research" },
  "research-fittss-law-es":                     { glyph: "research" },
  "research-local-business-websites":           { glyph: "local-seo" },
  "research-local-business-websites-es":        { glyph: "local-seo" },
  "research-cart-abandonment-rate":             { glyph: "conversions" },
  "research-cart-abandonment-rate-es":          { glyph: "conversions" },
  "research-lighthouse-performance-scoring":    { glyph: "speed" },
  "research-lighthouse-performance-scoring-es": { glyph: "speed" },
  // Articles
  "blog-losing-reservations":                   { glyph: "reservations" },
  "blog-losing-reservations-es":                { glyph: "reservations" },
  "blog-doordash-math":                         { glyph: "delivery" },
  "blog-doordash-math-es":                      { glyph: "delivery" },
  "blog-menu-prices":                           { glyph: "margin" },
  "blog-menu-prices-es":                        { glyph: "margin" },
  "blog-restaurant-cost":                       { glyph: "margin" },
  "blog-restaurant-cost-es":                    { glyph: "margin" },
  "blog-wix-vs-custom":                         { glyph: "brand" },
  "blog-wix-vs-custom-es":                      { glyph: "brand" },
  // Tools (already in manifest)
  audit:                                       { glyph: "audit" },
  "audit-es":                                   { glyph: "audit" },
  "audit-restaurants":                          { glyph: "audit" },
  "audit-restaurants-es":                       { glyph: "audit" },
  "tool-margin-math":                           { glyph: "margin" },
  "tool-margin-math-es":                        { glyph: "margin" },
  "tool-brand-suite":                           { glyph: "brand" },
  "tool-brand-suite-es":                        { glyph: "brand" },
  // Pages
  home:                                        { glyph: "brand" },
  "home-es":                                    { glyph: "brand" },
  about:                                       { glyph: "brand" },
  "about-es":                                   { glyph: "brand" },
  services:                                    { glyph: "audit" },
  "services-es":                                { glyph: "audit" },
  restaurants:                                 { glyph: "reservations" },
  "restaurants-es":                             { glyph: "reservations" },
};

// -------------------------------------------------------------
// new entries — close manifest gap for existing PNGs + new pages
// -------------------------------------------------------------

const NEW_ENTRIES = [
  // ---- Hubs ----
  {
    slug: "blog", kind: "page", locale: "en", accent: "ink", glyph: "glossary",
    eyebrow: "ARTICLES",
    title_1: "Honest essays", title_italic: "about the", title_2: "small-business web.",
    dek: "Plain math, named tradeoffs, written from inside hospitality.",
    focus: { type: "type" },
  },
  {
    slug: "blog-es", kind: "page", locale: "es", accent: "ink", glyph: "glossary",
    eyebrow: "ARTÍCULOS",
    title_1: "Ensayos honestos", title_italic: "sobre la", title_2: "web de negocios.",
    dek: "Cuentas claras, decisiones nombradas, escritos desde adentro.",
    focus: { type: "type" },
  },
  {
    slug: "glossary", kind: "page", locale: "en", accent: "ink", glyph: "glossary",
    eyebrow: "WEBSITE GLOSSARY",
    title_1: "Plain English,", title_italic: "every", title_2: "term defined.",
    dek: "Ninety-seven definitions written for owners, not developers.",
    focus: { type: "stat", value: "97", caption: "terms, every one written for owners", source: "THE GLOSSARY" },
  },
  {
    slug: "glossary-es", kind: "page", locale: "es", accent: "ink", glyph: "glossary",
    eyebrow: "GLOSARIO WEB",
    title_1: "Español claro,", title_italic: "cada", title_2: "término definido.",
    dek: "Noventa y siete definiciones escritas para dueños, no para programadores.",
    focus: { type: "stat", value: "97", caption: "términos, todos escritos para dueños", source: "EL GLOSARIO" },
  },
  {
    slug: "work", kind: "page", locale: "en", accent: "ink", glyph: "brand",
    eyebrow: "SELECTED CASE STUDIES",
    title_1: "Range, by", title_italic: "showing", title_2: "the work.",
    dek: "A landmark restaurant redesign and a pre-launch lifestyle brand narrative.",
    focus: { type: "type" },
  },
  {
    slug: "work-es", kind: "page", locale: "es", accent: "ink", glyph: "brand",
    eyebrow: "ESTUDIOS DE CASO",
    title_1: "Rango,", title_italic: "mostrando", title_2: "el trabajo.",
    dek: "Un rediseño de restaurante histórico y una marca de estilo de vida pre-lanzamiento.",
    focus: { type: "type" },
  },
  {
    slug: "tools", kind: "page", locale: "en", accent: "ink", glyph: "audit",
    eyebrow: "FREE TOOLS",
    title_1: "Eight ways to", title_italic: "check", title_2: "your own site.",
    dek: "No signup. Each tool answers one specific question — in about thirty seconds.",
    focus: { type: "type" },
  },
  {
    slug: "tools-es", kind: "page", locale: "es", accent: "ink", glyph: "audit",
    eyebrow: "HERRAMIENTAS GRATIS",
    title_1: "Ocho formas de", title_italic: "revisar", title_2: "tu propio sitio.",
    dek: "Sin registro. Cada herramienta responde una pregunta — en treinta segundos.",
    focus: { type: "type" },
  },
  {
    slug: "resources", kind: "page", locale: "en", accent: "ink", glyph: "resources",
    eyebrow: "RESOURCES",
    title_1: "Free checklists", title_italic: "and", title_2: "interactive guides.",
    dek: "Audit your own restaurant website in minutes. Progress saves automatically.",
    focus: { type: "type" },
  },
  {
    slug: "resources-es", kind: "page", locale: "es", accent: "ink", glyph: "resources",
    eyebrow: "RECURSOS",
    title_1: "Listas gratis", title_italic: "y", title_2: "guías interactivas.",
    dek: "Audita tu propia web de restaurante en minutos. Tu progreso se guarda solo.",
    focus: { type: "type" },
  },
  {
    slug: "checklist", kind: "tool", locale: "en", accent: "gold", glyph: "audit",
    eyebrow: "FREE INTERACTIVE CHECKLIST",
    title_1: "Thirty things", title_italic: "your site", title_2: "should do in 2026.",
    dek: "Score your own restaurant website in ten minutes. Progress saves automatically.",
    focus: { type: "checks", items: [
      { label: "Phone number tap-to-call",  pass: true  },
      { label: "Menu loads in under 2 s",   pass: true  },
      { label: "Reservation in viewport",   pass: false },
      { label: "Schema marks the cuisine",  pass: false },
    ] },
  },
  {
    slug: "checklist-es", kind: "tool", locale: "es", accent: "gold", glyph: "audit",
    eyebrow: "LISTA INTERACTIVA GRATIS",
    title_1: "Treinta cosas", title_italic: "que tu web", title_2: "debe hacer en 2026.",
    dek: "Califica tu propia web de restaurante en diez minutos. Tu progreso se guarda solo.",
    focus: { type: "checks", items: [
      { label: "Teléfono toca-para-llamar",  pass: true  },
      { label: "Menú carga en menos de 2 s", pass: true  },
      { label: "Reserva visible al cargar",  pass: false },
      { label: "Schema marca la cocina",     pass: false },
    ] },
  },
  // ---- Tool pages ----
  {
    slug: "tool-mobile-check", kind: "tool", locale: "en", accent: "gold", glyph: "speed",
    eyebrow: "FREE TOOL · MOBILE CHECK",
    title_1: "Three mobile", title_italic: "checks", title_2: "in ten seconds.",
    dek: "Viewport, tap targets, text size — graded against current Google standards.",
    focus: { type: "checks", items: [
      { label: "Viewport set",            pass: true  },
      { label: "Tap targets ≥ 44 px",     pass: true  },
      { label: "Body text ≥ 16 px",       pass: true  },
      { label: "Reservation in fold",     pass: false },
    ] },
  },
  {
    slug: "tool-mobile-check-es", kind: "tool", locale: "es", accent: "gold", glyph: "speed",
    eyebrow: "HERRAMIENTA · MÓVIL",
    title_1: "Tres pruebas", title_italic: "móviles", title_2: "en diez segundos.",
    dek: "Viewport, tamaño de toque y texto — calificados contra los estándares de Google.",
    focus: { type: "checks", items: [
      { label: "Viewport configurado",     pass: true  },
      { label: "Toques ≥ 44 px",           pass: true  },
      { label: "Texto ≥ 16 px",            pass: true  },
      { label: "Reserva visible al cargar",pass: false },
    ] },
  },
  {
    slug: "tool-schema-check", kind: "tool", locale: "en", accent: "gold", glyph: "code",
    eyebrow: "FREE TOOL · SCHEMA",
    title_1: "Does Google", title_italic: "understand", title_2: "your business?",
    dek: "Detect the structured data on your site — see what Google is reading about you.",
    focus: { type: "type" },
  },
  {
    slug: "tool-schema-check-es", kind: "tool", locale: "es", accent: "gold", glyph: "code",
    eyebrow: "HERRAMIENTA · SCHEMA",
    title_1: "¿Google", title_italic: "entiende", title_2: "tu negocio?",
    dek: "Detecta los datos estructurados — mira lo que Google lee sobre ti.",
    focus: { type: "type" },
  },
  {
    slug: "tool-speed-test", kind: "tool", locale: "en", accent: "gold", glyph: "speed",
    eyebrow: "FREE TOOL · SPEED",
    title_1: "How fast is", title_italic: "your site,", title_2: "in plain English?",
    dek: "One mobile speed number, named in everyday terms. Ten seconds. No signup.",
    focus: { type: "score-ring", value: 72, label: "MOBILE PERFORMANCE" },
  },
  {
    slug: "tool-speed-test-es", kind: "tool", locale: "es", accent: "gold", glyph: "speed",
    eyebrow: "HERRAMIENTA · VELOCIDAD",
    title_1: "¿Qué tan rápido", title_italic: "es tu sitio,", title_2: "en español claro?",
    dek: "Un solo número de velocidad móvil, en palabras cotidianas. Diez segundos.",
    focus: { type: "score-ring", value: 72, label: "RENDIMIENTO MÓVIL" },
  },
  {
    slug: "tool-tech-stack", kind: "tool", locale: "en", accent: "gold", glyph: "code",
    eyebrow: "FREE TOOL · TECH STACK",
    title_1: "What is", title_italic: "your site", title_2: "actually built on?",
    dek: "CMS, analytics, booking platform, fonts — detected in ten seconds. No signup.",
    focus: { type: "type" },
  },
  {
    slug: "tool-tech-stack-es", kind: "tool", locale: "es", accent: "gold", glyph: "code",
    eyebrow: "HERRAMIENTA · STACK",
    title_1: "¿Sobre qué", title_italic: "está hecho", title_2: "tu sitio web?",
    dek: "CMS, analítica, plataforma de reservas, tipografía — detectados en diez segundos.",
    focus: { type: "type" },
  },
  {
    slug: "tool-gbp-grader", kind: "tool", locale: "en", accent: "gold", glyph: "local-seo",
    eyebrow: "FREE TOOL · GBP GRADER",
    title_1: "Grade your", title_italic: "Google", title_2: "Business Profile.",
    dek: "See how your GBP stacks up against the local competition — in about ten seconds.",
    focus: { type: "score-ring", value: 64, label: "GBP COMPLETENESS" },
  },
  {
    slug: "tool-gbp-grader-es", kind: "tool", locale: "es", accent: "gold", glyph: "local-seo",
    eyebrow: "HERRAMIENTA · GBP",
    title_1: "Califica tu", title_italic: "Perfil de", title_2: "Empresa de Google.",
    dek: "Mira cómo tu GBP se compara con la competencia local — en diez segundos.",
    focus: { type: "score-ring", value: 64, label: "PERFIL COMPLETO" },
  },
  {
    slug: "tool-compare", kind: "tool", locale: "en", accent: "gold", glyph: "brand",
    eyebrow: "FREE TOOL · COMPARE",
    title_1: "Your site,", title_italic: "side by side", title_2: "with a competitor.",
    dek: "Two URLs. Speed, mobile, SEO. Free, ten seconds, no signup.",
    focus: { type: "type" },
  },
  {
    slug: "tool-compare-es", kind: "tool", locale: "es", accent: "gold", glyph: "brand",
    eyebrow: "HERRAMIENTA · COMPARAR",
    title_1: "Tu sitio,", title_italic: "lado a lado", title_2: "con un competidor.",
    dek: "Dos URLs. Velocidad, móvil, SEO. Gratis, diez segundos, sin registro.",
    focus: { type: "type" },
  },
  {
    slug: "tool-search-ideas", kind: "tool", locale: "en", accent: "gold", glyph: "local-seo",
    eyebrow: "FREE TOOL · SEARCH IDEAS",
    title_1: "What people", title_italic: "actually", title_2: "search near you.",
    dek: "Real Google autocomplete suggestions for your business type and city. Free.",
    focus: { type: "type" },
  },
  {
    slug: "tool-search-ideas-es", kind: "tool", locale: "es", accent: "gold", glyph: "local-seo",
    eyebrow: "HERRAMIENTA · BÚSQUEDAS",
    title_1: "Lo que la gente", title_italic: "busca", title_2: "cerca de ti.",
    dek: "Sugerencias reales de Google autocomplete para tu tipo de negocio y ciudad.",
    focus: { type: "type" },
  },
  {
    slug: "tool-seo-grader", kind: "tool", locale: "en", accent: "gold", glyph: "local-seo",
    eyebrow: "FREE TOOL · SEO GRADER",
    title_1: "Grade your", title_italic: "title and", title_2: "meta description.",
    dek: "Length, intent, brand placement — graded in ten seconds. Free.",
    focus: { type: "score-ring", value: 81, label: "TITLE + META" },
  },
  {
    slug: "tool-seo-grader-es", kind: "tool", locale: "es", accent: "gold", glyph: "local-seo",
    eyebrow: "HERRAMIENTA · SEO",
    title_1: "Califica tu", title_italic: "título y", title_2: "meta descripción.",
    dek: "Largo, intención, marca — calificados en diez segundos. Gratis.",
    focus: { type: "score-ring", value: 81, label: "TÍTULO + META" },
  },
  // ---- Work case studies ----
  {
    slug: "work-tacombi", kind: "page", locale: "en", accent: "rust", glyph: "brand",
    eyebrow: "CASE STUDY · TACOMBI",
    title_1: "Three years", title_italic: "of neighborhood", title_2: "marketing.",
    dek: "Cross-promotions, loyalty, print collateral — designed from inside the restaurant.",
    focus: { type: "type" },
  },
  {
    slug: "work-tacombi-es", kind: "page", locale: "es", accent: "rust", glyph: "brand",
    eyebrow: "CASO · TACOMBI",
    title_1: "Tres años", title_italic: "de marketing", title_2: "de barrio.",
    dek: "Promociones, lealtad, impresos — diseñados desde adentro del restaurante.",
    focus: { type: "type" },
  },
  {
    slug: "work-irish-inn", kind: "page", locale: "en", accent: "teal", glyph: "brand",
    eyebrow: "CASE STUDY · IRISH INN",
    title_1: "A 1931", title_italic: "landmark,", title_2: "reimagined.",
    dek: "An independent redesign study for a Washington-area dining institution.",
    focus: { type: "type" },
  },
  {
    slug: "work-irish-inn-es", kind: "page", locale: "es", accent: "teal", glyph: "brand",
    eyebrow: "CASO · IRISH INN",
    title_1: "Un ícono", title_italic: "de 1931,", title_2: "reimaginado.",
    dek: "Un estudio de rediseño independiente para una institución gastronómica de Washington.",
    focus: { type: "type" },
  },
  {
    slug: "work-off-day-collective", kind: "page", locale: "en", accent: "ink", glyph: "brand",
    eyebrow: "CASE STUDY · OFF DAY COLLECTIVE",
    title_1: "Silence,", title_italic: "curated", title_2: "before pixels.",
    dek: "Brand strategy and design — what intentional rest looks like before launch.",
    focus: { type: "type" },
  },
  {
    slug: "work-off-day-collective-es", kind: "page", locale: "es", accent: "ink", glyph: "brand",
    eyebrow: "CASO · OFF DAY COLLECTIVE",
    title_1: "Silencio,", title_italic: "curado antes", title_2: "de los pixeles.",
    dek: "Estrategia de marca y diseño — el descanso intencional antes del lanzamiento.",
    focus: { type: "type" },
  },
  // ---- Blog posts (published + drafts that have on-disk PNGs) ----
  {
    slug: "blog-google-reviews", kind: "article", locale: "en", accent: "teal", glyph: "reviews",
    eyebrow: "REVIEWS · PRACTICAL",
    title_1: "How to get", title_italic: "more Google", title_2: "reviews.",
    dek: "QR postcards, timing, staff scripts, and the one thing most owners skip.",
    focus: { type: "type" },
  },
  {
    slug: "blog-google-reviews-es", kind: "article", locale: "es", accent: "teal", glyph: "reviews",
    eyebrow: "RESEÑAS · PRÁCTICO",
    title_1: "Cómo conseguir", title_italic: "más reseñas", title_2: "en Google.",
    dek: "Tarjetas con QR, tiempos, guiones y lo único que casi todos olvidan.",
    focus: { type: "type" },
  },
  {
    slug: "blog-google-business-profile-setup", kind: "article", locale: "en", accent: "teal", glyph: "local-seo",
    eyebrow: "LOCAL SEO · SETUP",
    title_1: "Set up", title_italic: "Google Business", title_2: "Profile.",
    dek: "Claiming, verification, categories, photos, menu links — and the settings most owners miss.",
    focus: { type: "type" },
  },
  {
    slug: "blog-google-business-profile-setup-es", kind: "article", locale: "es", accent: "teal", glyph: "local-seo",
    eyebrow: "SEO LOCAL · CONFIGURACIÓN",
    title_1: "Configura tu", title_italic: "Perfil de", title_2: "Empresa.",
    dek: "Reclamo, verificación, categorías, fotos, menú — y los ajustes que casi todos olvidan.",
    focus: { type: "type" },
  },
  {
    slug: "blog-google-find-a-table", kind: "article", locale: "en", accent: "rust", glyph: "reservations",
    eyebrow: "RESERVATIONS · DISCOVERY",
    title_1: "Recover", title_italic: "reservations from", title_2: "Find-a-Table.",
    dek: "How Google's reservation surface works — and the integrations that get you in it.",
    focus: { type: "type" },
  },
  {
    slug: "blog-pos-comparison", kind: "article", locale: "en", accent: "teal", glyph: "code",
    eyebrow: "OPERATIONS · POS",
    title_1: "Toast vs Square", title_italic: "vs Clover for", title_2: "restaurants.",
    dek: "Hardware, fees, lock-in, integrations — compared in plain numbers.",
    focus: { type: "type" },
  },
  {
    slug: "blog-restaurant-website-pages", kind: "article", locale: "en", accent: "teal", glyph: "brand",
    eyebrow: "WEB · ESSENTIALS",
    title_1: "What should", title_italic: "be on a", title_2: "restaurant site.",
    dek: "The fewest pages that still cover everything a diner needs to decide.",
    focus: { type: "type" },
  },
  {
    slug: "blog-chatgpt-restaurant-website", kind: "article", locale: "en", accent: "teal", glyph: "code",
    eyebrow: "AI · CRAFT",
    title_1: "Can ChatGPT", title_italic: "write your", title_2: "restaurant site?",
    dek: "What it can draft, what it gets wrong, and where a human still has to sit.",
    focus: { type: "type" },
  },
  {
    slug: "blog-one-percent-margin", kind: "article", locale: "en", accent: "gold", glyph: "margin",
    eyebrow: "MARGIN · WEB",
    title_1: "Five web", title_italic: "changes that", title_2: "recover 1% margin.",
    dek: "Where the website is leaking money — and the smallest interventions that close the gap.",
    focus: { type: "type" },
  },
  {
    slug: "blog-restaurant-app", kind: "article", locale: "en", accent: "teal", glyph: "code",
    eyebrow: "APPS · SHOULD YOU?",
    title_1: "Should your", title_italic: "restaurant", title_2: "have an app?",
    dek: "When an app earns its weight, when a website is enough, and what most owners miss.",
    focus: { type: "type" },
  },
  {
    slug: "blog-restaurant-need-website", kind: "article", locale: "en", accent: "teal", glyph: "brand",
    eyebrow: "WEB · BASICS",
    title_1: "Does my", title_italic: "restaurant", title_2: "need a website?",
    dek: "When social media is enough, when it isn't, and what a website actually owes a diner.",
    focus: { type: "type" },
  },
];

// -------------------------------------------------------------
// run
// -------------------------------------------------------------

const manifest = JSON.parse(fs.readFileSync(CARDS, "utf8"));
let updated = 0;
let added = 0;

// Update _comment to document the schema additions.
manifest._comment = "OG card manifest. Each entry produces <slug>.svg + <slug>.png in brand/og/. kind selects the template (page|article|research|tool). accent keys into PALETTE in scripts/build-og-cards.mjs (per accent rule: speed/mobile=teal, conversions/reservations=rust, local-seo=teal, margin/operations=gold, trust=ink, brand=cream-on-ink/teal-on-cream, research=rust, tools=gold, hubs=ink). glyph keys into the GLYPHS registry in build-og-cards.mjs and renders left of the eyebrow as a subject cue. focus is an optional module { type: 'type'|'funnel'|'stat'|'score-ring'|'list'|'quote'|'checks', ...data }. locale is for hreflang pairing; ES cards use slug '-es' suffix.";

const bySlug = new Map(manifest.cards.map((c) => [c.slug, c]));

// 1) Augment existing entries.
for (const card of manifest.cards) {
  const augment = EXISTING[card.slug];
  if (!augment) continue;
  let changed = false;
  if (augment.glyph && card.glyph !== augment.glyph) {
    card.glyph = augment.glyph;
    changed = true;
  }
  if (augment.accent && card.accent !== augment.accent) {
    card.accent = augment.accent;
    changed = true;
  }
  if (changed) updated++;
}

// 2) Add new entries (skip if a slug already exists).
//    Gated by env var so Sprint 2A (existing-only) and Sprint 2C
//    (add new) commit independently.
if (process.env.ADD_NEW_ENTRIES === "1") {
  for (const entry of NEW_ENTRIES) {
    if (bySlug.has(entry.slug)) continue;
    manifest.cards.push(entry);
    added++;
  }
}

fs.writeFileSync(CARDS, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`updated existing: ${updated}`);
console.log(`added new:        ${added}`);
console.log(`total cards:      ${manifest.cards.length}`);
