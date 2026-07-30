export const meta = {
  name: 'design-ingredient-glyphs',
  description: 'Design a clean, modern, bespoke line-glyph system for Cost Index ingredient cards (spec → draw → critique → revise)',
  phases: [
    { title: 'System' },
    { title: 'Draw' },
    { title: 'Critique' },
    { title: 'Revise' },
  ],
}

const BRAND = `muntin.digital — a restaurant food-cost data product. Aesthetic: editorial, calm, precise. Display face Fraunces (a warm modern serif); body sans-serif. Palette tokens: --ink #16181D, --ink-soft #4A4F59, --stone #6B7280, --teal #2A50C8 (calm/down), --rust #A23B2D (hot/up), --gold #B7791F, --season #6b4fa1, cream surfaces #F6F7F8/#EDEEF1. Pages render in BOTH light and dark mode. The cards are text-forward and currently have no imagery; we want a small glyph per ingredient to add a little warmth and recognition without clutter.`;

const DIRECTION = `We are designing a BESPOKE GLYPH SYSTEM — one small icon per ingredient (and one per category), used at ~24-40px on cost-index cards. NON-NEGOTIABLE house style, chosen because it is both modern AND reliably drawable as clean SVG:
- MONO-LINE line-art: strokes only, NO fills (or at most one subtle accent detail). stroke="currentColor" so the glyph inherits the card's ink and works in light AND dark, and can be tinted per category via CSS.
- 24x24 viewBox, ~2px safe padding, single stroke-width 1.6, stroke-linecap="round", stroke-linejoin="round".
- GEOMETRIC & ICONIC, not realistic illustration: build each mark from a few confident primitives (circles, arcs, ellipses, straight segments, simple quadratic curves). A recognizable silhouette at 16px beats detail. Think a refined, consistent pictogram set — one designer's hand across all of them.
- Consistent level of abstraction, corner language, and visual weight across the whole set. No text, no emoji, no drop shadows, no gradients, no external refs, no <script>.
- Modern warmth: a slight looseness/asymmetry is welcome over stiff clip-art, but stay disciplined.`;

const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    system: { type: 'string' },
    strokeWidth: { type: 'number' },
    viewBox: { type: 'string' },
    constructionRules: { type: 'array', items: { type: 'string' } },
    categoryMotifs: { type: 'array', items: { type: 'object', properties: { category: { type: 'string' }, motif: { type: 'string' } }, required: ['category', 'motif'] } },
    exampleSvg: { type: 'string' },
    pitfalls: { type: 'array', items: { type: 'string' } },
  },
  required: ['system', 'strokeWidth', 'viewBox', 'constructionRules', 'categoryMotifs'],
};

const GLYPH_SCHEMA = {
  type: 'object',
  properties: {
    glyphs: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' },
      kind: { type: 'string', enum: ['category', 'ingredient'] },
      category: { type: 'string' },
      svg: { type: 'string' },
      note: { type: 'string' },
    }, required: ['id', 'kind', 'category', 'svg'] } },
  },
  required: ['glyphs'],
};

const QA_SCHEMA = {
  type: 'object',
  properties: {
    reviews: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' },
      recognizable: { type: 'integer' },
      onSpec: { type: 'integer' },
      consistent: { type: 'integer' },
      verdict: { type: 'string', enum: ['keep', 'revise', 'reject'] },
      fix: { type: 'string' },
    }, required: ['id', 'recognizable', 'onSpec', 'consistent', 'verdict'] } },
    setNotes: { type: 'string' },
  },
  required: ['reviews'],
};

// Pilot set: 7 category glyphs + a diverse spread of ingredients that exercises the style.
const ASSIGN = [
  { category: 'beef', items: ['ribeye', 'ground-beef', 'short-rib'] },
  { category: 'poultry', items: ['chicken-breast', 'whole-chicken', 'chicken-thigh'] },
  { category: 'pork', items: ['pork-loin', 'bacon'] },
  { category: 'seafood', items: ['salmon-fillet', 'shrimp', 'whole-lobster'] },
  { category: 'produce', items: ['tomato', 'avocado', 'romaine-lettuce', 'carrot', 'garlic', 'lemon'] },
  { category: 'dairy-eggs', items: ['butter', 'eggs', 'cheddar-cheese'] },
  { category: 'pantry', items: ['coffee', 'flour', 'olive-oil'] },
];

phase('System');
log('Design director drafting the glyph style system...');
const spec = await agent(`${BRAND}\n\n${DIRECTION}\n\nYou are the DESIGN DIRECTOR. Write the definitive glyph style system the illustrators will follow to the letter: the construction grammar (grid, stroke, caps, how much abstraction), a one-line MOTIF for each of the 7 categories (beef, poultry, pork, seafood, produce, dairy-eggs, pantry) so the set coheres, an exampleSvg of ONE fully-worked glyph (e.g. a lemon or an egg) as the reference for hand/quality, and the pitfalls to avoid. Favor forms that are reliably drawable as clean geometric SVG.`, { label: 'director', phase: 'System', schema: SPEC_SCHEMA, effort: 'high' });
const SPEC_STR = JSON.stringify(spec, null, 1);

phase('Draw');
log(`Drawing ${ASSIGN.reduce((n, a) => n + a.items.length + 1, 0)} glyphs across ${ASSIGN.length} illustrators...`);
const drawn = await parallel(ASSIGN.map((a) => () =>
  agent(`${BRAND}\n\n${DIRECTION}\n\nGLYPH STYLE SYSTEM (follow EXACTLY):\n${SPEC_STR}\n\nYou are an illustrator on the team. Draw these glyphs as inline SVG, in ONE consistent hand, all obeying the system (24x24 viewBox, stroke-width ${spec && spec.strokeWidth || 1.6}, currentColor, round caps/joins, strokes only, no <script>/fills/gradients/external refs):\n- ONE category glyph, id "cat-${a.category}", kind "category", that reads as the whole "${a.category}" category.\n- one glyph per ingredient: ${a.items.join(', ')} (kind "ingredient", category "${a.category}").\nReturn full <svg ...>...</svg> for each. Make each recognizable at 16px; prefer a confident simple silhouette over detail. Keep every glyph in this batch visibly consistent with the others.`, { label: `draw:${a.category}`, phase: 'Draw', schema: GLYPH_SCHEMA })
));
const glyphs = drawn.filter(Boolean).flatMap((d) => d.glyphs || []);
log(`${glyphs.length} glyphs drawn. Critiquing...`);

phase('Critique');
// Two lenses over the full set: recognizability and cross-set consistency/spec-compliance.
const critiques = await parallel([
  { lens: 'recognizability', ask: 'Score each glyph on how clearly it reads as its ingredient/category at small size (recognizable), and whether it obeys the system (onSpec) and matches the set (consistent). Reject anything ambiguous, generic, or that needs a label to understand.' },
  { lens: 'consistency-spec', ask: 'Score each glyph, focusing on ONE-HAND consistency (stroke weight, corner language, abstraction level, optical weight) and strict spec compliance (viewBox, currentColor, strokes-only, no fills/script/external). Flag any outlier that breaks the set\u2019s coherence.' },
].map((c) => () =>
  agent(`${BRAND}\n\nGLYPH STYLE SYSTEM:\n${SPEC_STR}\n\nYou are a DESIGN QA reviewer — lens: ${c.lens}. Here is the full drawn set (id + svg):\n${JSON.stringify(glyphs.map((g) => ({ id: g.id, kind: g.kind, category: g.category, svg: g.svg })), null, 1)}\n\n${c.ask} For every glyph give recognizable/onSpec/consistent (1-5), a verdict keep/revise/reject, and a concrete fix if not keep.`, { label: `qa:${c.lens}`, phase: 'Critique', schema: QA_SCHEMA })
));
// Merge the two reviews: a glyph needs revision if EITHER reviewer says revise/reject.
const reviewById = {};
critiques.filter(Boolean).forEach((cr) => (cr.reviews || []).forEach((r) => {
  const cur = reviewById[r.id];
  const bad = r.verdict !== 'keep';
  if (!cur || (bad && cur.verdict === 'keep')) reviewById[r.id] = r;
  else if (bad && cur.fix && r.fix) cur.fix = cur.fix + ' | ' + r.fix;
}));
const toRevise = glyphs.filter((g) => reviewById[g.id] && reviewById[g.id].verdict !== 'keep');
log(`${glyphs.length - toRevise.length}/${glyphs.length} glyphs passed QA; revising ${toRevise.length}.`);

phase('Revise');
const revised = await parallel(toRevise.map((g) => () =>
  agent(`${BRAND}\n\nGLYPH STYLE SYSTEM:\n${SPEC_STR}\n\nRe-draw ONE glyph that QA flagged. id "${g.id}" (${g.kind}, category "${g.category}"). Current SVG:\n${g.svg}\n\nQA fix required: ${reviewById[g.id].fix || 'improve recognizability + consistency with the set'}.\nReturn the improved full <svg> in the exact house style (24x24, stroke-width ${spec && spec.strokeWidth || 1.6}, currentColor, round caps, strokes only). Keep it consistent with the rest of the set.`, { label: `revise:${g.id}`, phase: 'Revise', schema: GLYPH_SCHEMA })
));
// Splice revised glyphs back in.
const revisedById = {};
revised.filter(Boolean).forEach((d) => (d.glyphs || []).forEach((g) => { revisedById[g.id] = g; }));
const finalGlyphs = glyphs.map((g) => revisedById[g.id] || g);

return { count: finalGlyphs.length, revisedCount: Object.keys(revisedById).length, spec, glyphs: finalGlyphs, reviews: Object.values(reviewById) };
