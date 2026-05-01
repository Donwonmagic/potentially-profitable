/**
 * Differentiators registry — single source of truth for the
 * "vs Canva templates" / "vs Restaurant365 · MarginEdge · Plate IQ"
 * framing that appears on:
 *
 *   - homepage flagship hero cards
 *   - /tools/ Spotlight section cards
 *   - per-tool page hero subtitles
 *   - the Invoice Decoder post-save proof flyout
 *   - the Cost Pulse dashboard footer
 *   - per-tool OG card subtitles
 *   - the comparison-vs-competitor blog post intros
 *
 * One module, one set of strings, never drifts. EN + ES locales.
 *
 * Privacy posture: pure data. Zero fetch. Zero localStorage.
 * UMD wrapper so the module is Node-checkable for tests + can be
 * consumed in browser via window.MuntinDifferentiators.
 */
(function (root) {
  'use strict';

  // Per-tool registry. Each tool key returns:
  //   headline   — single sentence framed against named alternative
  //   alternatives — array of competitor names for the "vs X" chip
  //   comparisonRows — 5-7 rows for the inline comparison <details>
  //                    each row: { axis, ours, theirs }
  //   framing    — short paragraph (1-2 sentences) used on
  //                landing surfaces; reads honest, not snide.
  var REGISTRY = {
    'menu-design': {
      en: {
        headline: 'The only restaurant menu tool that auto-lays out 14 or 53 dishes from one paste — no Canva fight.',
        alternatives: ['Canva templates', 'InDesign'],
        chipLabel: 'vs Canva templates',
        comparisonRows: [
          { axis: 'Dish count',          ours: 'Any count — auto-paginates', theirs: 'Templates assume 12; resize fights' },
          { axis: 'Cuisine themes',      ours: '10 cuisine-specific (Trattoria, Cantina, Steakhouse...)', theirs: 'Generic templates, manual restyling' },
          { axis: 'Brand colors',        ours: 'Auto-pulls from Brand Suite + prior tools', theirs: 'Re-pick every time' },
          { axis: 'Output formats',      ours: 'PDF + QR HTML + IG square + Story + FB event', theirs: 'One file per export, redo per format' },
          { axis: 'Allergen tagging',    ours: 'Built-in glyphs (vegan, GF, nuts, dairy, ...)', theirs: 'Manual icon paste-in' },
          { axis: 'Print-vendor PDF',    ours: 'CMYK + 3mm bleed + crop marks (free)', theirs: 'Premium tier only' },
          { axis: 'Cost',                ours: 'Free, no signup', theirs: 'Free tier + watermarks; paid for print PDF' }
        ],
        framing: 'Canva templates assume your menu has 12 dishes. Real restaurants have 14, 27, or 53. This tool lays them out for the count you actually have, in 10 cuisine-specific themes, with a print-ready CMYK PDF on the free tier.'
      },
      es: {
        headline: 'La única herramienta de menú que acomoda 14 o 53 platos desde una pasada — sin pelearte con Canva.',
        alternatives: ['plantillas de Canva', 'InDesign'],
        chipLabel: 'vs plantillas de Canva',
        comparisonRows: [
          { axis: 'Cantidad de platos',    ours: 'Cualquier cantidad — paginación automática', theirs: 'Las plantillas asumen 12; pelea de redimensión' },
          { axis: 'Temas por cocina',      ours: '10 temas por estilo (Trattoria, Cantina, Steakhouse...)', theirs: 'Plantillas genéricas, retrabajo manual' },
          { axis: 'Colores de marca',      ours: 'Toma de Suite de Marca + herramientas previas', theirs: 'Re-elige cada vez' },
          { axis: 'Formatos de salida',    ours: 'PDF + QR HTML + IG square + Story + FB event', theirs: 'Un archivo por formato, rehacer cada vez' },
          { axis: 'Etiqueta de alérgenos', ours: 'Glifos integrados (vegano, sin gluten, nueces, lácteos...)', theirs: 'Pegar íconos a mano' },
          { axis: 'PDF para imprenta',     ours: 'CMYK + sangrado 3mm + marcas (gratis)', theirs: 'Solo tier premium' },
          { axis: 'Costo',                 ours: 'Gratis, sin registro', theirs: 'Tier gratis con marcas de agua; PDF imprenta de pago' }
        ],
        framing: 'Las plantillas de Canva asumen 12 platos. Los restaurantes reales tienen 14, 27, o 53. Esta herramienta los acomoda para la cantidad que tengas, en 10 temas por cocina, con un PDF imprimible CMYK en el tier gratis.'
      }
    },
    'invoice-decoder': {
      en: {
        headline: 'An invoice tool that locks your data with a secret only you know — Restaurant365 reads everything; we read nothing.',
        alternatives: ['Restaurant365', 'MarginEdge', 'Plate IQ'],
        chipLabel: 'vs Restaurant365 · MarginEdge · Plate IQ',
        comparisonRows: [
          { axis: 'Where invoices live',     ours: 'On your device, encrypted with your secret', theirs: 'Their cloud, their staff can read' },
          { axis: 'Who can read your data',  ours: 'Only you (AES-GCM 256, SubtleCrypto)',       theirs: 'Vendor + benchmark + ML training set' },
          { axis: 'Inputs accepted',         ours: 'Photo, PDF, CSV — any shape your distributor sends', theirs: 'PDF + POS integration only' },
          { axis: 'Vendor templates',        ours: 'Sysco, US Foods, GFS, Restaurant Depot, Shamrock, Sygma, PFG', theirs: 'Generic POS feed parser' },
          { axis: 'Bilingual',               ours: 'EN + ES lexicon (250+ entries)', theirs: 'EN-only' },
          { axis: 'Onboarding',              ours: '30 seconds. Snap, sort, save.', theirs: 'Weeks of POS integration setup' },
          { axis: 'Cost',                    ours: 'Free, no signup', theirs: '$300+/month subscription' }
        ],
        framing: 'Restaurant365 makes you upload your invoices to their servers. They read everything; their analysts read everything; their ML training set absorbs everything. We do the opposite: your invoice never leaves your device until you choose to save it, and when you save it we encrypt it with a secret only you know. We literally cannot read what we just stored.'
      },
      es: {
        headline: 'Una herramienta de facturas que bloquea tus datos con un secreto que solo tú conoces — Restaurant365 lee todo; nosotros no leemos nada.',
        alternatives: ['Restaurant365', 'MarginEdge', 'Plate IQ'],
        chipLabel: 'vs Restaurant365 · MarginEdge · Plate IQ',
        comparisonRows: [
          { axis: 'Dónde viven las facturas', ours: 'En tu dispositivo, encriptadas con tu secreto', theirs: 'Su nube, su personal puede leer' },
          { axis: 'Quién puede leer tus datos', ours: 'Solo tú (AES-GCM 256, SubtleCrypto)',     theirs: 'Proveedor + benchmark + entrenamiento de ML' },
          { axis: 'Entradas aceptadas',       ours: 'Foto, PDF, CSV — cualquier forma',           theirs: 'PDF + integración POS solamente' },
          { axis: 'Plantillas de proveedor',  ours: 'Sysco, US Foods, GFS, Restaurant Depot, Shamrock, Sygma, PFG', theirs: 'Parser POS genérico' },
          { axis: 'Bilingüe',                 ours: 'Léxico EN + ES (250+ entradas)',             theirs: 'Solo EN' },
          { axis: 'Onboarding',               ours: '30 segundos. Saca foto, ordena, guarda.',    theirs: 'Semanas de integración POS' },
          { axis: 'Costo',                    ours: 'Gratis, sin registro',                       theirs: 'Suscripción de $300+/mes' }
        ],
        framing: 'Restaurant365 te hace subir tus facturas a sus servidores. Ellos leen todo; sus analistas leen todo; su set de entrenamiento de ML absorbe todo. Hacemos lo opuesto: tu factura nunca sale de tu dispositivo hasta que decidas guardarla, y cuando la guardas la encriptamos con un secreto que solo tú conoces. Literalmente no podemos leer lo que acabamos de almacenar.'
      }
    }
  };

  function vsAlternative(toolId, locale) {
    var bucket = REGISTRY[toolId];
    if (!bucket) return null;
    var loc = (locale === 'es') ? 'es' : 'en';
    return bucket[loc] || bucket.en || null;
  }

  function listTools() { return Object.keys(REGISTRY); }

  var api = {
    REGISTRY: REGISTRY,
    vsAlternative: vsAlternative,
    listTools: listTools
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuntinDifferentiators = api;
})(typeof window !== 'undefined' ? window : null);
