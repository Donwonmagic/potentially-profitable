/**
 * Menu Copy Inspector — rules-based menu-language analyzer.
 *
 * Loaded as a classic script in ./index.html (EN + ES). Also Node-
 * importable for unit tests via scripts/test-menu-copy.mjs.
 * Dual-export pattern matches brand-suite.js, margin-math.js, and
 * menu-engineering.js.
 *
 * Privacy invariants (tested in scripts/test-menu-copy.mjs):
 *   1. Every exported function is pure — no fetch, no localStorage,
 *      no cookies, no side effects beyond attaching to window.MC.
 *   2. Bucket helpers (mcBucketItemCount, mcBucketAvgWordCount,
 *      mcBucketRewriteRatio) return values only from fixed enumerated
 *      sets. No raw input value (item name, description text, hex
 *      price) is ever reflected.
 *
 * Method references:
 *   - Wansink (2005), "How descriptive food names bias sensory
 *     perceptions in restaurants" — descriptive labels lift selection
 *     rate +27% on average.
 *   - Cornell School of Hotel Administration menu-language research,
 *     2014 — length sweet-spot, hedge-word drag, provenance lift.
 *   - Kimes & Wirtz (Cornell), pricing-presentation studies — dollar
 *     sign / decimal effects on per-cover spend.
 *
 * The tool is deliberately a teaching tool, not a rewriter. It
 * surfaces patterns and explains them; it never generates replacement
 * copy. That choice future-proofs the tool against LLM commodification
 * (any chatbot can rewrite copy by 2027) by anchoring its value in a
 * permanent skill upgrade for the owner who runs it, not a one-time
 * output.
 */

// Lexicons + helpers + scoring functions populated below in
// subsequent edits.

// ------------------------------------------------------------
// Sensory-adjective lexicon
//
// Four categories per Wansink: flavor, texture, temperature,
// preparation. Words are stored lowercase; matching ignores case
// and trailing punctuation. Variants (smoked / smoky / smoking)
// are handled by stem-matching at lookup time, not enumerated
// here — keeps the lexicon scannable and readable as a teaching
// reference.
// ------------------------------------------------------------

var MC_SENSORY_FLAVOR = [
  'briny', 'bright', 'buttery', 'caramelized', 'citrus', 'citrusy',
  'creamy', 'earthy', 'fiery', 'floral', 'fragrant', 'fruity',
  'garlicky', 'grassy', 'herbaceous', 'honeyed', 'malty', 'meaty',
  'mellow', 'nutty', 'peppery', 'pungent', 'rich', 'roasted',
  'robust', 'salty', 'savory', 'sharp', 'silky', 'smoky',
  'sour', 'spicy', 'sweet', 'tangy', 'tart', 'umami',
  'vibrant', 'warming', 'woody', 'yeasty', 'zesty', 'bitter',
  'aromatic', 'piquant', 'mineral', 'oceanic', 'lemony', 'limey'
];

var MC_SENSORY_TEXTURE = [
  'airy', 'al dente', 'chewy', 'crackling', 'creamy', 'crisp',
  'crispy', 'crumbly', 'crunchy', 'delicate', 'dense', 'flaky',
  'fluffy', 'gooey', 'juicy', 'lush', 'molten', 'plump',
  'pillowy', 'silky', 'silken', 'smooth', 'snappy', 'springy',
  'sticky', 'supple', 'tender', 'thick', 'velvety', 'wispy',
  'meltingly', 'meaty', 'flaky', 'crackling', 'shatteringly'
];

var MC_SENSORY_TEMPERATURE = [
  'blistering', 'chilled', 'cold', 'cool', 'frosty', 'hot',
  'icy', 'lukewarm', 'molten', 'piping', 'searing', 'sizzling',
  'steaming', 'warm', 'glacial'
];

var MC_SENSORY_PREP = [
  'aged', 'blackened', 'blistered', 'blanched', 'braised', 'brined',
  'broiled', 'burnished', 'butter-poached', 'caramelized', 'charred',
  'chargrilled', 'confit', 'cured', 'dehydrated', 'dry-aged',
  'fermented', 'fire-roasted', 'flame-kissed', 'glazed', 'grilled',
  'hand-cut', 'hand-pulled', 'hand-rolled', 'house-made', 'in-house',
  'lacquered', 'marinated', 'oven-roasted', 'pan-seared', 'pickled',
  'poached', 'pounded', 'pressed', 'reduced', 'rested', 'roasted',
  'rolled', 'salt-baked', 'scratch-made', 'seared', 'shaved', 'simmered',
  'slow-cooked', 'slow-roasted', 'smoked', 'spit-roasted', 'steamed',
  'stewed', 'sun-dried', 'twice-cooked', 'wood-fired', 'wood-grilled'
];

// ------------------------------------------------------------
// Technique lexicon — what was DONE to the food, distinct from
// what it tastes like. Aaker-style competence signals; lift is
// different in character from sensory lift (Wansink).
// ------------------------------------------------------------

var MC_TECHNIQUES = [
  'baked', 'barbecued', 'basted', 'battered', 'beer-battered', 'blackened',
  'blanched', 'boiled', 'braised', 'breaded', 'brined', 'broiled',
  'butterflied', 'butter-poached', 'butter-basted', 'caramelized', 'charred',
  'chargrilled', 'confit', 'cured', 'deboned', 'deep-fried', 'dry-aged',
  'dry-rubbed', 'dehydrated', 'emulsified', 'en papillote', 'fermented',
  'finished with', 'fire-roasted', 'flambéed', 'flash-fried', 'foamed',
  'folded', 'fried', 'glazed', 'gratinéed', 'griddled', 'grilled',
  'hand-cut', 'hand-rolled', 'hand-pulled', 'house-made', 'lacquered',
  'lardo-wrapped', 'made-to-order', 'marinated', 'oven-roasted', 'pan-fried',
  'pan-seared', 'pickled', 'plated', 'poached', 'pounded', 'pressed',
  'reduced', 'rendered', 'roasted', 'rolled', 'salt-baked', 'salted',
  'scratch-made', 'seared', 'shaved', 'simmered', 'sliced', 'slow-cooked',
  'slow-roasted', 'smoked', 'sous vide', 'spatchcocked', 'spit-roasted',
  'steamed', 'stewed', 'stuffed', 'sun-dried', 'tempered', 'twice-cooked',
  'whipped', 'wood-fired', 'wood-grilled', 'wrapped'
];

// ------------------------------------------------------------
// Hedge lexicon — words that correlate with REDUCED selection
// rate per Cornell. Each carries a one-line reason the UI surfaces
// when the word fires. A blocklist, not a banlist — sometimes a
// hedge is the right word, but every hedge should be a deliberate
// choice rather than reflex.
// ------------------------------------------------------------

var MC_HEDGES = {
  'just': "filler — adds no information; usually trims cleanly.",
  'simply': "filler — promises ease but lowers perceived craft.",
  'nice': "vague positive — every dish should aim higher.",
  'great': "vague positive — what makes it great?",
  'amazing': "marketing-speak — readers tune it out.",
  'delicious': "circular — a menu is not the place to claim deliciousness.",
  'tasty': "weakly evocative — name a flavor instead.",
  'yummy': "register-mismatch — too casual for most menus.",
  'our': "ownership claim adds nothing readers don't already assume.",
  'quality': "telling, not showing — what makes it quality?",
  'fresh': "over-used to meaninglessness; specify when picked / made.",
  'authentic': "claim that invites scepticism; show provenance instead.",
  'traditional': "claim of authority that needs concrete backing.",
  'real': "implies its absence elsewhere; usually empty.",
  'special': "vague differentiator.",
  'unique': "vague differentiator.",
  'gourmet': "register-mismatch outside fine dining; cliched within it.",
  'artisan': "diluted by ubiquitous use.",
  'artisanal': "diluted by ubiquitous use.",
  'crafted': "diluted by ubiquitous use.",
  'house': "needs a noun ('house-made X') — bare 'house' is empty.",
  'classic': "claim of pedigree without specifics.",
  'world-famous': "claim that needs evidence; usually drags.",
  'best': "comparative without referent.",
  'finest': "comparative without referent."
};

// ------------------------------------------------------------
// Provenance patterns — concrete signals that the dish has a
// traceable origin. Selection lift in restaurant-research literature
// averages 13–20% from adding one credible signal.
//
// The match logic looks for:
//   1. Capitalized place names (a region, country, body of water)
//   2. "house-made", "in-house", "scratch", "estate", "wild", "local"
//   3. Concrete number + unit ("48-hour", "12-month aged",
//      "200-day", "two-pound")
//   4. "from <Capitalized>" (named producer)
// ------------------------------------------------------------

var MC_PROVENANCE_KEYWORDS = [
  'house-made', 'house made', 'in-house', 'in house', 'scratch-made',
  'scratch made', 'made to order', 'made-to-order', 'estate', 'estate-grown',
  'estate grown', 'wild', 'wild-caught', 'wild caught', 'local',
  'locally sourced', 'locally-sourced', 'farm-to-table', 'farm to table',
  'family farm', 'small farm', 'free-range', 'free range', 'pasture-raised',
  'pasture raised', 'grass-fed', 'grass fed', 'line-caught', 'line caught',
  'hand-harvested', 'hand harvested', 'organic', 'biodynamic', 'heirloom',
  'heritage', 'foraged', 'seasonal', 'in season'
];

// Common region/origin tokens that count as provenance even when not
// proper-cased (so "from the eastern shore" still matches). Tested by
// case-insensitive whole-token match.
var MC_PROVENANCE_REGIONS = [
  'adriatic', 'mediterranean', 'aegean', 'pacific', 'atlantic',
  'chesapeake', 'eastern shore', 'shenandoah', 'piedmont', 'sonoma',
  'napa', 'tuscan', 'tuscany', 'sicilian', 'sicily', 'provence',
  'provençal', 'provencal', 'andalusian', 'andalusia', 'catalan',
  'catalonia', 'galician', 'galicia', 'maine', 'gulf', 'hudson valley',
  'finger lakes', 'central coast', 'big sur', 'east coast', 'west coast'
];

// ------------------------------------------------------------
// Spanish lexicons (Phase 4)
//
// These are NOT translations of the EN lists — Spanish menu-copy
// patterns differ in register, conventional vocabulary, and
// pricing-presentation conventions. Curated independently per the
// plan in /root/.claude/plans/transient-sparking-galaxy.md.
//
// The page passes locale: 'es' on the ES tool page; the scoring
// functions select the right lexicon per call. EN remains the
// default so existing scoreItem() calls work unchanged.
// ------------------------------------------------------------

var MC_SENSORY_FLAVOR_ES = [
  'ahumado', 'amargo', 'ácido', 'acidulado', 'azucarado', 'cítrico',
  'dulce', 'especiado', 'fresco', 'herbáceo', 'mantecoso', 'mineral',
  'nuez', 'picante', 'profundo', 'redondo', 'robusto', 'sabroso',
  'salado', 'salobre', 'sazonado', 'suave', 'tostado', 'umami'
];
var MC_SENSORY_TEXTURE_ES = [
  'aireado', 'al dente', 'compacto', 'crocante', 'crujiente', 'cremoso',
  'denso', 'esponjoso', 'firme', 'fundente', 'jugoso', 'meloso',
  'pegajoso', 'sedoso', 'suculento', 'terso', 'tierno', 'untuoso'
];
var MC_SENSORY_TEMPERATURE_ES = [
  'ardiente', 'caliente', 'cálido', 'helado', 'fresco', 'frío',
  'humeante', 'tibio', 'fundido', 'derretido'
];
var MC_SENSORY_PREP_ES = [
  'añejado', 'asado', 'al carbón', 'a la brasa', 'a la leña', 'a la parrilla',
  'a la plancha', 'a la sal', 'al horno', 'al vapor', 'braseado', 'caramelizado',
  'cocido', 'confitado', 'curado', 'dorado', 'encurtido', 'estofado',
  'fermentado', 'frito', 'glaseado', 'grillado', 'hecho a mano',
  'horneado', 'macerado', 'marinado', 'reducido', 'rostizado', 'salteado',
  'sellado', 'tostado', 'flameado', 'ahumado'
];

// Spanish technique lexicon — culinary craft signals. Plural forms
// for multi-word entries are listed explicitly because the v1
// stem-matcher is English-biased (-ed/-ing/-s/-y stripping doesn't
// fit Spanish gender + number morphology).
var MC_TECHNIQUES_ES = [
  'asado', 'asados', 'a la brasa', 'al carbón', 'a la leña', 'a la parrilla',
  'a la plancha', 'a la sal', 'al horno', 'al vapor', 'apanado',
  'braseado', 'braseados', 'cocido', 'cocidos', 'confitado', 'confitados',
  'curado', 'curados', 'deshuesado', 'dorado', 'dorados',
  'emparedado', 'empanizado', 'enrollado', 'envuelto', 'envueltos', 'estofado', 'estofados',
  'fermentado', 'fermentados', 'flameado', 'frito', 'fritos', 'glaseado', 'glaseados', 'grillado',
  'hecho a mano', 'hechos a mano', 'hecha a mano', 'hechas a mano',
  'horneado', 'horneados', 'macerado', 'marinado', 'marinados', 'pochado',
  'prensado', 'reducido', 'relleno', 'rellenos', 'rostizado', 'rostizados', 'salado',
  'salteado', 'salteados', 'sellado', 'sous vide', 'tostado', 'tostados', 'envasado al vacío'
];

// Spanish hedges. Cornell research on hedges replicates broadly
// across languages but the specific words differ; these are the
// most common Spanish-language fillers that drag selection.
var MC_HEDGES_ES = {
  'rico':         "vago — todo plato debería aspirar a más.",
  'delicioso':    "circular — el menú no es el lugar para reclamar deliciosidad.",
  'bueno':        "positivo vago — qué lo hace bueno?",
  'sabroso':      "evocativo débil — nombra un sabor.",
  'fresco':       "sobreusado al punto de no significar nada; especifica cuándo o dónde.",
  'auténtico':    "claim que invita escepticismo; muestra procedencia en su lugar.",
  'tradicional':  "claim de autoridad que necesita respaldo concreto.",
  'casero':       "necesita un sustantivo concreto.",
  'nuestro':      "redundante: el lector ya asume.",
  'gourmet':      "registro mal calibrado fuera de alta cocina; clisé adentro.",
  'artesanal':    "diluido por uso ubicuo.",
  'simplemente':  "relleno — promete facilidad pero baja la artesanía percibida.",
  'sólo':         "relleno — usualmente se quita limpio.",
  'mejor':        "comparativo sin referente.",
  'único':        "diferenciador vago.",
  'especial':     "diferenciador vago.",
  'genial':       "positivo vago.",
  'increíble':    "marketing-speak — los lectores lo ignoran.",
  'famoso':       "claim que necesita evidencia."
};

// Spanish provenance keywords.
var MC_PROVENANCE_KEYWORDS_ES = [
  'hecho en casa', 'hecho a mano', 'de la casa', 'de origen', 'de productor',
  'de granja', 'pequeña granja', 'de pesca', 'pesca del día', 'silvestre',
  'orgánico', 'biodinámico', 'de temporada', 'de pastura', 'de libre pastoreo',
  'criado en pastura', 'capturado a la línea', 'añejado', 'curado en casa',
  'fermentado en casa', 'cosechado a mano', 'patrimonial', 'reliquia'
];

// Spanish provenance regions (Latin America + Spain biased toward
// likely DMV-area Spanish-speaking restaurant audience).
var MC_PROVENANCE_REGIONS_ES = [
  'oaxaca', 'oaxaqueño', 'oaxaqueña', 'puebla', 'poblano', 'poblana',
  'yucatán', 'yucateco', 'yucateca', 'veracruz', 'veracruzano',
  'chiapas', 'chiapaneco', 'jalisco', 'tapatío', 'sonora', 'sonorense',
  'baja california', 'baja', 'sinaloa', 'sinaloense', 'michoacán',
  'antioquia', 'paisa', 'valle del cauca', 'caribe', 'caribeño',
  'pacífico colombiano', 'andina', 'argentina', 'pampeano',
  'salamanca', 'galicia', 'gallego', 'gallega', 'asturias', 'andalucía',
  'andaluz', 'cataluña', 'catalán', 'país vasco', 'vasco', 'rioja',
  'mediterráneo', 'atlántico'
];

// Supported locales — explicit allow-list. Adding a third (e.g. 'fr')
// requires adding the matching lexicon constants AND extending this
// list, which forces a deliberate decision instead of silently mis-
// scoring foreign menus against English hedges.
var MC_SUPPORTED_LOCALES = ['en', 'es'];

// Lexicon selector. EN is default; passing locale 'es' switches to
// the Spanish lists. Unknown locales emit a one-time console warning
// (so a future `locale: 'fr'` typo doesn't silently score French
// copy as English) and fall back to EN. T4 — was previously a silent
// fallback that the audit flagged as a real-user failure mode.
var _mcWarnedLocales = {};
function mcLexiconsFor(locale) {
  if (locale === 'es') {
    return {
      flavor:      MC_SENSORY_FLAVOR_ES,
      texture:     MC_SENSORY_TEXTURE_ES,
      temperature: MC_SENSORY_TEMPERATURE_ES,
      preparation: MC_SENSORY_PREP_ES,
      technique:   MC_TECHNIQUES_ES,
      hedges:      MC_HEDGES_ES,
      provenance_keywords: MC_PROVENANCE_KEYWORDS_ES,
      provenance_regions:  MC_PROVENANCE_REGIONS_ES
    };
  }
  if (locale && locale !== 'en' && MC_SUPPORTED_LOCALES.indexOf(locale) === -1) {
    if (!_mcWarnedLocales[locale]) {
      _mcWarnedLocales[locale] = true;
      try {
        // typeof console check protects Workers / minimal embeds
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('Menu Copy: unknown locale "' + locale + '" — falling back to English lexicons. ' +
                       'Supported locales: ' + MC_SUPPORTED_LOCALES.join(', ') + '. ' +
                       'Scoring with the wrong locale produces nonsense results.');
        }
      } catch (_) {}
    }
  }
  return {
    flavor:      MC_SENSORY_FLAVOR,
    texture:     MC_SENSORY_TEXTURE,
    temperature: MC_SENSORY_TEMPERATURE,
    preparation: MC_SENSORY_PREP,
    technique:   MC_TECHNIQUES,
    hedges:      MC_HEDGES,
    provenance_keywords: MC_PROVENANCE_KEYWORDS,
    provenance_regions:  MC_PROVENANCE_REGIONS
  };
}

// ------------------------------------------------------------
// Tokenisation + matching helpers
// ------------------------------------------------------------

// Lowercase + strip surrounding punctuation. Internal hyphens and
// apostrophes are preserved so multi-word lexicon entries like
// "house-made" and "wood-fired" still match.
function mcNormalizeWord(s) {
  return String(s || '').toLowerCase()
    .replace(/^[^a-z0-9]+/, '')
    .replace(/[^a-z0-9'-]+$/, '')
    .replace(/[.,;:!?]+$/g, '');
}

function mcTokenize(text) {
  // Splits on whitespace; preserves hyphens. Returns lowercased
  // tokens with surrounding punctuation stripped. Empty strings
  // filtered. Multi-word matches handled separately by the scoring
  // functions; this is for the single-word path.
  return String(text || '').split(/\s+/).map(mcNormalizeWord).filter(Boolean);
}

function mcWordCount(text) {
  // Counts whitespace-separated tokens, ignoring pure punctuation.
  var n = 0;
  String(text || '').split(/\s+/).forEach(function(w){
    if (w.replace(/[^a-z0-9]/gi, '').length > 0) n++;
  });
  return n;
}

// Tests whether a phrase (possibly multi-word) appears in the text
// as a whole-token match. Case-insensitive. Used for entries like
// "house-made", "made to order", and the regional lexicon.
function mcPhraseAppears(text, phrase) {
  if (!phrase) return false;
  var hay = ' ' + String(text || '').toLowerCase().replace(/[^a-z0-9'\- ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  var needle = ' ' + String(phrase).toLowerCase().replace(/[^a-z0-9'\- ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  return hay.indexOf(needle) >= 0;
}

// Stem-ish matcher: a token "smoked" should fire on "smoke",
// "smoky", and "smoking" too. We don't ship a real stemmer; the
// lexicon-author convention is to enter the canonical form and
// the matcher checks token + a few common suffix variants.
function mcStemMatches(token, lexiconWord) {
  if (token === lexiconWord) return true;
  // Strip trailing 'ed', 'ing', 'y', 's' and re-compare both ways.
  var stems = [token, token.replace(/(ed|ing|s|y)$/, ''), token.replace(/ies$/, 'y')];
  var lex = [lexiconWord, lexiconWord.replace(/(ed|ing|s|y)$/, ''), lexiconWord.replace(/ies$/, 'y')];
  for (var i = 0; i < stems.length; i++) {
    for (var j = 0; j < lex.length; j++) {
      if (stems[i] && lex[j] && stems[i] === lex[j] && stems[i].length >= 4) return true;
    }
  }
  return false;
}

// ------------------------------------------------------------
// Sensory scorer — counts hits per category and reports diversity.
// Returns { count, byCategory, hits: [{word, category}], categoriesUsed }.
// ------------------------------------------------------------

function mcScoreSensory(text, locale) {
  var lex = mcLexiconsFor(locale);
  var tokens = mcTokenize(text);
  var hits = [];
  var byCategory = { flavor: 0, texture: 0, temperature: 0, preparation: 0 };
  var seenWords = {};

  function pickup(category, lex) {
    // Multi-word phrases first; single-word stems second. seenWords
    // dedupes across sub-categories — a word that fires in flavor
    // doesn't also count as preparation, even if its stem matches.
    // First-category-wins keeps the cats count honest.
    lex.forEach(function(entry){
      if (/\s|-/.test(entry) && mcPhraseAppears(text, entry)) {
        var key = entry.toLowerCase();
        if (seenWords[key]) return;
        seenWords[key] = true;
        hits.push({ word: entry, category: category });
        byCategory[category]++;
      }
    });
    tokens.forEach(function(tok){
      lex.forEach(function(entry){
        if (/\s|-/.test(entry)) return;
        if (mcStemMatches(tok, entry)) {
          var key = tok;
          if (seenWords[key]) return;
          seenWords[key] = true;
          hits.push({ word: tok, category: category });
          byCategory[category]++;
        }
      });
    });
  }

  pickup('flavor',      lex.flavor);
  pickup('texture',     lex.texture);
  pickup('temperature', lex.temperature);
  pickup('preparation', lex.preparation);

  var categoriesUsed = 0;
  Object.keys(byCategory).forEach(function(c){ if (byCategory[c] > 0) categoriesUsed++; });

  return {
    count: hits.length,
    byCategory: byCategory,
    hits: hits,
    categoriesUsed: categoriesUsed
  };
}

// ------------------------------------------------------------
// Provenance scorer — counts concrete origin signals.
// Returns { count, hits: [{word, kind}] } where kind is one of:
//   'keyword'   — house-made, wild-caught, etc.
//   'region'    — named geography
//   'numeric'   — concrete number-unit ("48-hour", "12-month")
//   'capitalized' — sequence of 2+ capitalised tokens (proper noun)
// ------------------------------------------------------------

function mcScoreProvenance(text, locale) {
  var lex = mcLexiconsFor(locale);
  var hits = [];
  var seen = {};
  function pushHit(kind, word) {
    var key = kind + ':' + word.toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    hits.push({ kind: kind, word: word });
  }

  // 1. Keyword matches (multi-word and single-word entries).
  lex.provenance_keywords.forEach(function(kw){
    if (mcPhraseAppears(text, kw)) pushHit('keyword', kw);
  });

  // 2. Region matches (case-insensitive whole-token).
  lex.provenance_regions.forEach(function(region){
    if (mcPhraseAppears(text, region)) pushHit('region', region);
  });

  // 3. Numeric provenance — "<number><unit>" like 48-hour, 12-month,
  //    200-day, two-pound. Spelled-out numbers two-twelve recognised.
  var numRe = /\b(?:\d{1,4}|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[\s-]?(?:hour|hours|day|days|week|weeks|month|months|year|years|pound|pounds|lb|lbs|oz|ounce|ounces|degree|degrees|hr|hrs)\b/gi;
  var numMatches = String(text || '').match(numRe);
  if (numMatches) numMatches.forEach(function(m){ pushHit('numeric', m.trim()); });

  // 4. Two-or-more-word capitalised proper nouns. Filter sentence-start
  //    artefacts by requiring at least two capitalised tokens in a row,
  //    or a "from <Capitalized>" / "<Capitalized>'s" pattern.
  var capRe = /\b(?:from\s+)?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})(?:'s)?\b/g;
  var capMatch;
  while ((capMatch = capRe.exec(String(text || ''))) !== null) {
    var phrase = capMatch[1];
    // Skip false positives: known non-provenance proper nouns the
    // lexicon-author can extend over time. Empty for now; adding
    // ['Cacio', 'Pepe', 'Caesar'] would be category-specific noise.
    if (phrase.length < 4) continue;
    pushHit('capitalized', phrase);
  }

  return { count: hits.length, hits: hits };
}

// ------------------------------------------------------------
// Technique scorer — count + variety of culinary techniques.
// Returns { count, hits: [string] }.
// ------------------------------------------------------------

function mcScoreTechnique(text, locale) {
  var lex = mcLexiconsFor(locale);
  var tokens = mcTokenize(text);
  var hits = [];
  var seen = {};

  lex.technique.forEach(function(entry){
    if (/\s|-/.test(entry) && mcPhraseAppears(text, entry)) {
      var k = entry.toLowerCase();
      if (seen[k]) return;
      seen[k] = true;
      hits.push(entry);
    }
  });
  tokens.forEach(function(tok){
    lex.technique.forEach(function(entry){
      if (/\s|-/.test(entry)) return;
      if (mcStemMatches(tok, entry)) {
        if (seen[tok]) return;
        seen[tok] = true;
        hits.push(tok);
      }
    });
  });

  return { count: hits.length, hits: hits };
}

// ------------------------------------------------------------
// Length scorer — word count + verdict ("short" / "in-range" / "long").
// Sweet spot per Cornell SHA: 9–15 words for casual, 12–22 for fine.
// We default to the casual range; the page-level UI can pass a tier.
// ------------------------------------------------------------

var MC_LENGTH_RANGES = {
  casual:    { min: 9,  max: 15, label: 'casual'    },
  fineDining:{ min: 12, max: 22, label: 'fine dining' }
};

function mcScoreLength(text, tier) {
  var range = MC_LENGTH_RANGES[tier] || MC_LENGTH_RANGES.casual;
  var n = mcWordCount(text);
  var verdict;
  if (n < range.min) verdict = n < (range.min - 3) ? 'short' : 'short-edge';
  else if (n > range.max) verdict = n > (range.max + 5) ? 'long' : 'long-edge';
  else verdict = 'in-range';
  return {
    words: n,
    range: range,
    verdict: verdict
  };
}

// ------------------------------------------------------------
// Hedge scorer — counts hedge words from the blocklist.
// Returns { count, hits: [{word, reason}] }.
// ------------------------------------------------------------

function mcScoreHedges(text, locale) {
  var lex = mcLexiconsFor(locale);
  var tokens = mcTokenize(text);
  var hits = [];
  var seen = {};
  tokens.forEach(function(tok){
    if (lex.hedges[tok] && !seen[tok]) {
      seen[tok] = true;
      hits.push({ word: tok, reason: lex.hedges[tok] });
    }
  });
  return { count: hits.length, hits: hits };
}

// ------------------------------------------------------------
// Pricing presentation scorer.
// Input: a price string like "$24", "24.00", "$19.99", "19.95", "24".
// Detects: dollarSign (bool), decimals (0/1/2), charm (true if .95/.99/.49),
// trailingZeros (true if .00). Returns + a "signals" array of one-line
// reads the UI can surface.
// ------------------------------------------------------------

function mcScorePricing(priceText) {
  var raw = String(priceText == null ? '' : priceText).trim();
  if (!raw) return { hasPrice: false, signals: [] };
  var dollarSign = raw.indexOf('$') >= 0;
  // Strip $ and whitespace; accept commas as thousands separators.
  var clean = raw.replace(/[$\s,]/g, '');
  // Accept negative as zero-decimal for safety; we don't expect it here.
  var m = /^(-?\d+)(?:\.(\d+))?$/.exec(clean);
  if (!m) return { hasPrice: false, signals: ['Could not parse "' + raw + '" as a price.'] };
  var intPart = m[1];
  var decPart = m[2] || '';
  var decimals = decPart.length;
  var trailingZeros = decimals >= 2 && /^0+$/.test(decPart);
  var charm = decimals >= 2 && /(95|99|49|97|89)$/.test(decPart);

  var signals = [];
  if (!dollarSign) {
    signals.push('No dollar sign — Cornell research found dropping the dollar sign lifted average spend ~8%.');
  } else {
    signals.push('Dollar sign present — fine-dining tier often drops it; casual tier keeps it for clarity.');
  }
  if (decimals === 0) {
    signals.push('Whole-number price — reads as confident, fine-dining-tier convention.');
  } else if (trailingZeros) {
    signals.push('Trailing zeros (.00) — adds visual noise without information; consider whole numbers.');
  } else if (charm) {
    signals.push('Charm pricing (' + raw + ') — communicates value, but undercuts perceived quality at the upper price tiers.');
  } else {
    signals.push('Decimal price — sits between charm and whole-number; rare and usually unintentional.');
  }
  return {
    hasPrice: true,
    raw: raw,
    dollarSign: dollarSign,
    decimals: decimals,
    trailingZeros: trailingZeros,
    charm: charm,
    signals: signals
  };
}

// ------------------------------------------------------------
// Aggregate verdict — combines the six rule families into one
// "polish" / "rewrite" / "in-between" call. Score is 0–100 with
// 50 as neutral; thresholds:
//   >= 65 → "polish" (most signals present, ≤ 1 hedge, length OK)
//   <= 40 → "rewrite" (multiple categories empty, length way off, or 4+ hedges)
//   else  → "edit" (your call — needs 1–2 specific tweaks)
//
// The verdict is the only opinionated output. Every other score is
// descriptive.
// ------------------------------------------------------------

var MC_VERDICTS = ['polish', 'edit', 'rewrite'];

function mcAggregateVerdict(parts) {
  var s = parts || {};
  var score = 50;

  var sensoryCats = (s.sensory && s.sensory.categoriesUsed) || 0;
  score += sensoryCats * 8;                                // up to +32
  if (s.provenance && s.provenance.count > 0) score += 10;
  if (s.technique && s.technique.count > 0)   score += 8;

  var lenVerdict = s.length && s.length.verdict;
  if (lenVerdict === 'in-range')        score += 8;
  else if (lenVerdict === 'short-edge') score -= 4;
  else if (lenVerdict === 'long-edge')  score -= 4;
  else if (lenVerdict === 'short')      score -= 14;
  else if (lenVerdict === 'long')       score -= 12;

  var hedges = (s.hedges && s.hedges.count) || 0;
  score -= hedges * 8;

  // Pricing presentation is reported but does not move the verdict
  // here — it's a separate per-item axis. The Card displays both.

  score = Math.max(0, Math.min(100, score));
  var verdict;
  if (score >= 65) verdict = 'polish';
  else if (score <= 40) verdict = 'rewrite';
  else verdict = 'edit';

  return { score: score, verdict: verdict };
}

// ------------------------------------------------------------
// Public scoreItem — wraps all rule families for a single item.
// ------------------------------------------------------------

function mcScoreItem(input, options) {
  var item = input || {};
  var locale = (options && options.locale) || item.locale || 'en';
  var description = String(item.description || '');
  var sensory    = mcScoreSensory(description, locale);
  var provenance = mcScoreProvenance(description, locale);
  var technique  = mcScoreTechnique(description, locale);
  var length     = mcScoreLength(description, item.tier);
  var hedges     = mcScoreHedges(description, locale);
  var pricing    = mcScorePricing(item.price);
  var agg        = mcAggregateVerdict({ sensory: sensory, provenance: provenance, technique: technique, length: length, hedges: hedges });
  return {
    name: String(item.name || ''),
    description: description,
    price: String(item.price == null ? '' : item.price),
    locale: locale,
    sensory: sensory,
    provenance: provenance,
    technique: technique,
    length: length,
    hedges: hedges,
    pricing: pricing,
    score: agg.score,
    verdict: agg.verdict
  };
}

// Score a list of items. Returns the per-item analyses + a small
// "summary" object the UI uses for the page-level bucket events.
function mcScoreMenu(items, options) {
  var list = (items || []).map(function(it){ return mcScoreItem(it, options); });
  var totalWords = 0;
  var rewriteCount = 0;
  list.forEach(function(it){
    totalWords += it.length.words;
    if (it.verdict === 'rewrite') rewriteCount++;
  });
  return {
    items: list,
    summary: {
      itemCount: list.length,
      avgWordCount: list.length ? totalWords / list.length : 0,
      rewriteCount: rewriteCount
    }
  };
}

// ------------------------------------------------------------
// Action ladder — given a scored item, suggest 1–4 specific moves
// in priority order. Each move is a *direction*, not a rewrite —
// the Inspector teaches what to look for, not what words to use.
// ------------------------------------------------------------

function mcActionLadder(scored) {
  var moves = [];
  if (!scored) return moves;
  var s = scored.sensory && scored.sensory.categoriesUsed || 0;
  var hedgeCount = scored.hedges && scored.hedges.count || 0;
  var hasProv = scored.provenance && scored.provenance.count > 0;
  var hasTech = scored.technique && scored.technique.count > 0;
  var lenVerdict = scored.length && scored.length.verdict;

  if (hedgeCount > 0) {
    moves.push({
      lift: 'small',
      headline: 'Cut ' + hedgeCount + ' hedge word' + (hedgeCount === 1 ? '' : 's') + '.',
      detail: 'Drop or replace each flagged word. Most are filler that adds no information; the description usually tightens cleanly.'
    });
  }
  if (s < 1) {
    moves.push({
      lift: 'large',
      headline: 'Add 1 sensory adjective.',
      detail: 'Pick one word from flavor / texture / temperature / preparation that actually fits the dish. Wansink found descriptive labels lifted selection +27% on average.'
    });
  } else if (s < 2) {
    moves.push({
      lift: 'medium',
      headline: 'Add a second sensory category.',
      detail: 'You have one sensory dimension; reaching for a second (combine flavor + texture, or texture + temperature) compounds the lift.'
    });
  }
  if (!hasProv) {
    moves.push({
      lift: 'medium',
      headline: 'Name a producer or origin.',
      detail: 'A specific farm, region, breed, or aging duration. Provenance signals carry 13–20% selection lift in restaurant studies and convert vague claims into evidence.'
    });
  }
  if (!hasTech) {
    moves.push({
      lift: 'medium',
      headline: 'Surface a technique.',
      detail: 'What was DONE to the food (braised, charred, dry-aged) communicates competence. Different audience, different lift than sensory words.'
    });
  }
  if (lenVerdict === 'short' || lenVerdict === 'short-edge') {
    moves.push({
      lift: 'small',
      headline: 'Stretch the description.',
      detail: 'Targeting 9–15 words for casual, 12–22 for fine. Below 6 reads as a stub.'
    });
  } else if (lenVerdict === 'long' || lenVerdict === 'long-edge') {
    moves.push({
      lift: 'small',
      headline: 'Trim the description.',
      detail: 'Past 22–25 words, attention drops. Cut explanation that the dish name already implies.'
    });
  }
  return moves;
}

// ------------------------------------------------------------
// Plausible bucket helpers — enum-locked, privacy-critical.
// No raw input value (item name, description text, hex price) ever
// appears in a bucket return; tests sweep across full input ranges
// + poison strings to lock this property.
// ------------------------------------------------------------

var MC_ITEM_COUNT_BUCKETS = ['1', '2-5', '6-15', 'gt-15'];

function mcBucketItemCount(n) {
  var v = typeof n === 'number' && isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  if (v <= 1) return '1';
  if (v <= 5) return '2-5';
  if (v <= 15) return '6-15';
  return 'gt-15';
}

var MC_AVG_WORD_BUCKETS = ['lt-6', '6-12', '12-20', 'gt-20'];

function mcBucketAvgWordCount(avg) {
  var v = typeof avg === 'number' && isFinite(avg) && avg >= 0 ? avg : 0;
  if (v < 6) return 'lt-6';
  if (v < 12) return '6-12';
  if (v < 20) return '12-20';
  return 'gt-20';
}

var MC_REWRITE_RATIO_BUCKETS = ['none', 'lt-25pct', '25-50pct', 'gt-50pct'];

function mcBucketRewriteRatio(itemCount, rewriteCount) {
  var n = typeof itemCount    === 'number' && isFinite(itemCount)    && itemCount    > 0 ? itemCount    : 0;
  var r = typeof rewriteCount === 'number' && isFinite(rewriteCount) && rewriteCount >= 0 ? rewriteCount : 0;
  if (n === 0 || r === 0) return 'none';
  var ratio = r / n;
  if (ratio < 0.25) return 'lt-25pct';
  if (ratio < 0.50) return '25-50pct';
  return 'gt-50pct';
}

// ------------------------------------------------------------
// Public surface
// ------------------------------------------------------------

var MC_PUBLIC = {
  // Tokenisation
  normalizeWord:     mcNormalizeWord,
  tokenize:          mcTokenize,
  wordCount:         mcWordCount,
  // Scorers
  scoreSensory:      mcScoreSensory,
  scoreProvenance:   mcScoreProvenance,
  scoreTechnique:    mcScoreTechnique,
  scoreLength:       mcScoreLength,
  scoreHedges:       mcScoreHedges,
  scorePricing:      mcScorePricing,
  // Aggregate
  aggregateVerdict:  mcAggregateVerdict,
  scoreItem:         mcScoreItem,
  scoreMenu:         mcScoreMenu,
  actionLadder:      mcActionLadder,
  // Bucket helpers
  bucketItemCount:    mcBucketItemCount,
  bucketAvgWordCount: mcBucketAvgWordCount,
  bucketRewriteRatio: mcBucketRewriteRatio,
  // Lexicons (so the Pattern Explorer UI can render them)
  SENSORY_FLAVOR:      MC_SENSORY_FLAVOR,
  SENSORY_TEXTURE:     MC_SENSORY_TEXTURE,
  SENSORY_TEMPERATURE: MC_SENSORY_TEMPERATURE,
  SENSORY_PREP:        MC_SENSORY_PREP,
  TECHNIQUES:          MC_TECHNIQUES,
  HEDGES:              MC_HEDGES,
  PROVENANCE_KEYWORDS: MC_PROVENANCE_KEYWORDS,
  PROVENANCE_REGIONS:  MC_PROVENANCE_REGIONS,
  // Spanish lexicons (Phase 4)
  SENSORY_FLAVOR_ES:      MC_SENSORY_FLAVOR_ES,
  SENSORY_TEXTURE_ES:     MC_SENSORY_TEXTURE_ES,
  SENSORY_TEMPERATURE_ES: MC_SENSORY_TEMPERATURE_ES,
  SENSORY_PREP_ES:        MC_SENSORY_PREP_ES,
  TECHNIQUES_ES:          MC_TECHNIQUES_ES,
  HEDGES_ES:              MC_HEDGES_ES,
  PROVENANCE_KEYWORDS_ES: MC_PROVENANCE_KEYWORDS_ES,
  PROVENANCE_REGIONS_ES:  MC_PROVENANCE_REGIONS_ES,
  lexiconsFor:            mcLexiconsFor,
  // Enums
  VERDICTS:                MC_VERDICTS,
  ITEM_COUNT_BUCKETS:      MC_ITEM_COUNT_BUCKETS,
  AVG_WORD_BUCKETS:        MC_AVG_WORD_BUCKETS,
  REWRITE_RATIO_BUCKETS:   MC_REWRITE_RATIO_BUCKETS,
  LENGTH_RANGES:           MC_LENGTH_RANGES
};

if (typeof self !== 'undefined' && typeof module === 'undefined') {
  self.MC = MC_PUBLIC;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MC_PUBLIC;
}
