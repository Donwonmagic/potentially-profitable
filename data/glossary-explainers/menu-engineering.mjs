// Glossary explainer — MENU ENGINEERING
//
// 90-second narrated diagram covering Kasavana & Smith's 2x2 of
// contribution margin × menu mix, the four quadrant labels, and a
// worked example showing what "decide which dish does the work"
// looks like in motion.
//
// Six scenes. The SVG holds one <g class="explainer-scene"> per
// scene; the runtime toggles is-active and CSS animates the inner
// data-anim elements. Keep this file authoritative — assets/site.js
// reads timing from <li data-duration-ms> in the rendered captions
// (not from this object), but the inject script copies durations
// into both, so this is the single source of truth.

export default {
  term_slug: 'menu-engineering',
  term_head: 'Menu engineering, in 90 seconds.',
  subhead:   'From a menu of dishes to a portfolio of decisions.',
  duration_ms: 90000,
  audio_url: null,
  // Spanish copy — used by the ES injection. Same scene IDs and
  // durations; only captions translate.
  scenes_es: [
    { id: 'open',         caption: 'Dos restaurantes. Mismo barrio. Mismo cheque promedio. P&L distinto. ¿La diferencia? Contaron historias distintas con los mismos platos.' },
    { id: 'axes',         caption: 'La ingeniería de menú es una idea de hace cincuenta años. Grafica cada plato en dos ejes. Vertical: margen de contribución — los dólares que te quedan por venta. Horizontal: menu mix — qué tan seguido se vende.' },
    { id: 'quadrants',    caption: 'Ahora divide por la mediana. Cuatro cuadrantes. Cuatro tipos de plato. Estrellas: alto margen, alto mix — protégelos. Caballos de tiro: alto mix, bajo margen — recosta o re-ingeniá. Acertijos: alto margen, bajo mix — re-fotografía, renombra, dales luz. Perros: bajos en ambos. Sácalos.' },
    { id: 'example',      caption: 'Aquí va un menú real. Seis platos graficados. La carbonara es Estrella. La ensalada vende mucho pero apenas cubre su costo — Caballo de tiro. El cordero cuesta más emplatarlo que lo que gana — Perro.' },
    { id: 'fix',          caption: 'Mira lo que pasa cuando actúas. Quitas el cordero. Re-fotografías la burrata. Recostas la ensalada y recuperas tres puntos. Todo el portafolio se desplaza arriba y a la derecha.' },
    { id: 'land',         caption: 'El plato favorito del chef no siempre es el héroe del restaurante. La ingeniería de menú es lo que te dice cuál es cuál.' },
  ],
  scenes: [
    {
      id: 'open',
      ms: 12000,
      caption: 'Two restaurants. Same neighborhood. Same average check. Different P&L. The difference? They told different stories with the same dishes.',
    },
    {
      id: 'axes',
      ms: 16000,
      caption: 'Menu engineering is a fifty-year-old idea. Plot every dish on two axes. Vertical: contribution margin — the dollars you keep per sale. Horizontal: menu mix — how often it sells.',
    },
    {
      id: 'quadrants',
      ms: 18000,
      caption: 'Now split at the median. Four quadrants. Four kinds of dish. Stars: high margin, high mix — protect them. Plowhorses: high mix, low margin — re-cost or re-engineer. Puzzles: high margin, low mix — re-photograph, re-name, give them light. Dogs: low on both. Drop them.',
    },
    {
      id: 'example',
      ms: 18000,
      caption: 'Here’s a real menu. Six dishes plotted. The carbonara is a Star. The garden salad sells a lot but barely covers its cost — Plowhorse. The lamb shank costs more to plate than it earns — Dog.',
    },
    {
      id: 'fix',
      ms: 16000,
      caption: 'Watch what happens when you act. Drop the lamb. Re-photograph the burrata so it sells. Re-cost the salad to recover three points. The whole portfolio drifts up and to the right.',
    },
    {
      id: 'land',
      ms: 10000,
      caption: 'The chef’s favorite isn’t always the restaurant’s hero. Menu engineering is what tells you which is which.',
    },
  ],
  svg: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of menu engineering">
  <defs>
    <linearGradient id="me-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#me-bg)"/>

  <!-- ============ SCENE: OPEN ============ -->
  <g class="explainer-scene" data-scene-id="open">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Two restaurants · same neighborhood</text>
    <!-- Restaurant card A (loses) -->
    <g data-anim="rise" style="--delay:120ms">
      <rect x="100" y="120" width="240" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <rect x="124" y="148" width="192" height="14" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="124" y="174" width="120" height="10" rx="3" fill="var(--line,#E8E2D6)"/>
      <line x1="124" y1="200" x2="316" y2="200" stroke="var(--line,#E8E2D6)" stroke-width="1"/>
      <text class="text-soft" x="124" y="240" font-size="14">Avg. check $25</text>
      <text class="text-stone" x="124" y="262" font-size="12">P&amp;L: −2 pts</text>
      <text class="text-stone" x="124" y="320" font-size="11" letter-spacing="0.1em">RESTAURANT A</text>
      <!-- subtle downward line -->
      <path d="M 124 290 L 316 296" stroke="var(--rust,#B8541A)" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>
    </g>
    <!-- Restaurant card B (lifts) -->
    <g data-anim="rise" style="--delay:280ms">
      <rect x="460" y="100" width="240" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <rect x="484" y="128" width="192" height="14" rx="3" fill="var(--teal-tint,#E8F1F3)"/>
      <rect x="484" y="154" width="120" height="10" rx="3" fill="var(--teal-tint,#E8F1F3)"/>
      <line x1="484" y1="180" x2="676" y2="180" stroke="var(--line,#E8E2D6)" stroke-width="1"/>
      <text class="text-soft" x="484" y="220" font-size="14">Avg. check $25</text>
      <text class="text-good" x="484" y="242" font-size="12">P&amp;L: +6 pts</text>
      <text class="text-teal" x="484" y="300" font-size="11" letter-spacing="0.1em">MENU-ENGINEERED</text>
      <path d="M 484 270 L 676 254" stroke="var(--teal,#1F4E5B)" stroke-width="2" fill="none"/>
    </g>
    <text class="text-soft" x="400" y="430" text-anchor="middle" font-size="16" data-anim="fade" style="--delay:1100ms">Same dishes. Different story.</text>
  </g>

  <!-- ============ SCENE: AXES ============ -->
  <g class="explainer-scene" data-scene-id="axes">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Plot every dish on two axes</text>
    <!-- axes -->
    <line class="axis-line-strong" x1="160" y1="100" x2="160" y2="430" data-anim="grow-y" style="transform-origin:left bottom; --delay:80ms"/>
    <line class="axis-line-strong" x1="160" y1="430" x2="700" y2="430" data-anim="grow-x" style="--delay:240ms"/>
    <!-- y-axis label -->
    <text class="text-soft" x="76"  y="270" font-size="13" transform="rotate(-90 76 270)" data-anim="fade" style="--delay:520ms">Contribution margin $</text>
    <!-- x-axis label -->
    <text class="text-soft" x="430" y="468" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:640ms">Menu mix %  (popularity)</text>
    <!-- arrowheads -->
    <path d="M 156 100 l 4 -10 l 4 10" fill="var(--ink-soft,#2A2D33)" data-anim="fade" style="--delay:520ms"/>
    <path d="M 700 426 l 10 4 l -10 4"  fill="var(--ink-soft,#2A2D33)" data-anim="fade" style="--delay:640ms"/>
    <!-- scattered dots (initial) -->
    <g data-anim="pop" style="--delay:900ms"><circle cx="240" cy="370" r="9" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:1080ms"><circle cx="320" cy="320" r="9" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:1260ms"><circle cx="420" cy="200" r="9" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:1440ms"><circle cx="540" cy="150" r="9" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:1620ms"><circle cx="380" cy="380" r="9" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:1800ms"><circle cx="600" cy="240" r="9" fill="var(--teal,#1F4E5B)"/></g>
  </g>

  <!-- ============ SCENE: QUADRANTS ============ -->
  <g class="explainer-scene" data-scene-id="quadrants">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Split at the median · four quadrants</text>
    <line class="axis-line-strong" x1="160" y1="100" x2="160" y2="430"/>
    <line class="axis-line-strong" x1="160" y1="430" x2="700" y2="430"/>
    <!-- quadrant fills -->
    <rect data-anim="fade" style="--delay:120ms" x="160" y="100" width="220" height="135" fill="var(--teal-tint,#E8F1F3)" opacity="0.55"/>
    <rect data-anim="fade" style="--delay:180ms" x="380" y="100" width="320" height="135" fill="rgba(31,107,58,0.10)"/>
    <rect data-anim="fade" style="--delay:240ms" x="160" y="235" width="220" height="195" fill="rgba(184,84,26,0.08)"/>
    <rect data-anim="fade" style="--delay:300ms" x="380" y="235" width="320" height="195" fill="rgba(194,139,46,0.10)"/>
    <!-- median splits -->
    <line data-anim="grow-y" style="transform-origin:left top; --delay:380ms" class="axis-line" stroke-dasharray="4 4" x1="380" y1="100" x2="380" y2="430"/>
    <line data-anim="grow-x" style="--delay:380ms" class="axis-line" stroke-dasharray="4 4" x1="160" y1="235" x2="700" y2="235"/>
    <!-- labels -->
    <text data-anim="rise" style="--delay:600ms" class="text-teal" x="270" y="160" text-anchor="middle" font-size="15" font-weight="500">PUZZLE</text>
    <text data-anim="rise" style="--delay:600ms" class="text-stone" x="270" y="180" text-anchor="middle" font-size="11">re-photo, re-name</text>
    <text data-anim="rise" style="--delay:720ms" class="text-good" x="540" y="160" text-anchor="middle" font-size="15" font-weight="500">STAR</text>
    <text data-anim="rise" style="--delay:720ms" class="text-stone" x="540" y="180" text-anchor="middle" font-size="11">protect</text>
    <text data-anim="rise" style="--delay:840ms" class="text-rust" x="270" y="320" text-anchor="middle" font-size="15" font-weight="500">DOG</text>
    <text data-anim="rise" style="--delay:840ms" class="text-stone" x="270" y="338" text-anchor="middle" font-size="11">drop</text>
    <text data-anim="rise" style="--delay:960ms" x="540" y="320" text-anchor="middle" font-size="15" font-weight="500" fill="#8A6018">PLOWHORSE</text>
    <text data-anim="rise" style="--delay:960ms" class="text-stone" x="540" y="338" text-anchor="middle" font-size="11">re-cost, re-engineer</text>
    <!-- axis labels (carry over) -->
    <text class="text-soft" x="76" y="270" font-size="13" transform="rotate(-90 76 270)">Contribution margin $</text>
    <text class="text-soft" x="430" y="468" text-anchor="middle" font-size="13">Menu mix %</text>
  </g>

  <!-- ============ SCENE: EXAMPLE ============ -->
  <g class="explainer-scene" data-scene-id="example">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">A real menu · six dishes plotted</text>
    <line class="axis-line-strong" x1="160" y1="100" x2="160" y2="430"/>
    <line class="axis-line-strong" x1="160" y1="430" x2="700" y2="430"/>
    <line class="axis-line" stroke-dasharray="4 4" x1="380" y1="100" x2="380" y2="430"/>
    <line class="axis-line" stroke-dasharray="4 4" x1="160" y1="235" x2="700" y2="235"/>

    <!-- Dish dots with labels -->
    <g data-anim="pop" style="--delay:120ms">
      <circle cx="560" cy="160" r="10" fill="var(--status-good,#1F6B3A)"/>
      <text class="text-soft" x="576" y="156" font-size="12">Carbonara</text>
      <text class="text-stone" x="576" y="172" font-size="10">★ STAR · $14 CM</text>
    </g>
    <g data-anim="pop" style="--delay:280ms">
      <circle cx="610" cy="200" r="10" fill="var(--status-good,#1F6B3A)"/>
      <text class="text-soft" x="626" y="196" font-size="12">Cacio e pepe</text>
      <text class="text-stone" x="626" y="212" font-size="10">★ STAR · $11 CM</text>
    </g>
    <g data-anim="pop" style="--delay:440ms">
      <circle cx="280" cy="180" r="10" fill="var(--teal,#1F4E5B)"/>
      <text class="text-soft" x="200" y="156" font-size="12">Burrata</text>
      <text class="text-stone" x="200" y="172" font-size="10">PUZZLE · $9 CM</text>
    </g>
    <g data-anim="pop" style="--delay:600ms">
      <circle cx="540" cy="350" r="10" fill="#8A6018"/>
      <text class="text-soft" x="556" y="350" font-size="12">Garden salad</text>
      <text class="text-stone" x="556" y="366" font-size="10">PLOWHORSE · $4 CM</text>
    </g>
    <g data-anim="pop" style="--delay:760ms">
      <circle cx="450" cy="310" r="10" fill="#8A6018"/>
      <text class="text-soft" x="466" y="306" font-size="12">House bread</text>
      <text class="text-stone" x="466" y="322" font-size="10">PLOWHORSE · $3 CM</text>
    </g>
    <g data-anim="pop" style="--delay:920ms">
      <circle cx="240" cy="380" r="10" fill="var(--rust,#B8541A)"/>
      <text class="text-rust" x="200" y="408" font-size="12">Lamb shank</text>
      <text class="text-stone" x="200" y="424" font-size="10">DOG · $2 CM</text>
    </g>
    <text class="text-soft" x="76" y="270" font-size="13" transform="rotate(-90 76 270)">Contribution margin $</text>
    <text class="text-soft" x="430" y="468" text-anchor="middle" font-size="13">Menu mix %</text>
  </g>

  <!-- ============ SCENE: FIX ============ -->
  <g class="explainer-scene" data-scene-id="fix">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Now act · the portfolio drifts up-right</text>
    <line class="axis-line-strong" x1="160" y1="100" x2="160" y2="430"/>
    <line class="axis-line-strong" x1="160" y1="430" x2="700" y2="430"/>
    <line class="axis-line" stroke-dasharray="4 4" x1="380" y1="100" x2="380" y2="430"/>
    <line class="axis-line" stroke-dasharray="4 4" x1="160" y1="235" x2="700" y2="235"/>

    <!-- Stars stay -->
    <circle cx="560" cy="160" r="10" fill="var(--status-good,#1F6B3A)"/>
    <circle cx="610" cy="200" r="10" fill="var(--status-good,#1F6B3A)"/>

    <!-- Burrata moves right (Puzzle → Star). Drawn as start dot + arc + end dot. -->
    <circle cx="280" cy="180" r="9" fill="var(--teal,#1F4E5B)" opacity="0.35"/>
    <path d="M 280 180 Q 380 140 470 170" stroke="var(--teal,#1F4E5B)" stroke-width="1.6" fill="none" stroke-dasharray="3 4" data-anim="grow-x" style="--delay:120ms; transform-origin:left center"/>
    <g data-anim="pop" style="--delay:900ms">
      <circle cx="470" cy="170" r="10" fill="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="486" y="166" font-size="12">Burrata · re-shot</text>
    </g>

    <!-- Salad moves up (Plowhorse → Star border). -->
    <circle cx="540" cy="350" r="9" fill="#8A6018" opacity="0.35"/>
    <path d="M 540 350 Q 540 280 540 240" stroke="#8A6018" stroke-width="1.6" fill="none" stroke-dasharray="3 4" data-anim="grow-y" style="--delay:480ms; transform-origin:bottom center"/>
    <g data-anim="pop" style="--delay:1300ms">
      <circle cx="540" cy="240" r="10" fill="#8A6018"/>
      <text style="fill:#8A6018" x="556" y="244" font-size="12">Salad · re-costed</text>
    </g>

    <!-- Lamb gets dropped — fade to a hollow ring -->
    <circle cx="240" cy="380" r="9" fill="none" stroke="var(--rust,#B8541A)" stroke-width="1.5" stroke-dasharray="3 3" data-anim="fade" style="--delay:1700ms"/>
    <line x1="220" y1="360" x2="260" y2="400" stroke="var(--rust,#B8541A)" stroke-width="1.6" data-anim="fade" style="--delay:1900ms"/>
    <line x1="260" y1="360" x2="220" y2="400" stroke="var(--rust,#B8541A)" stroke-width="1.6" data-anim="fade" style="--delay:1900ms"/>
    <text class="text-rust" x="200" y="424" font-size="11" data-anim="fade" style="--delay:2100ms">Lamb · dropped</text>

    <text class="text-soft" x="76" y="270" font-size="13" transform="rotate(-90 76 270)">Contribution margin $</text>
    <text class="text-soft" x="430" y="468" text-anchor="middle" font-size="13">Menu mix %</text>
  </g>

  <!-- ============ SCENE: LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="180" text-anchor="middle">Menu engineering</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="260" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="48" font-style="italic" fill="var(--ink,#14161A)">Decide.</text>
    <text data-anim="fade" style="--delay:780ms" class="text-stone" x="400" y="330" text-anchor="middle" font-size="14">The chef’s favorite isn’t always the restaurant’s hero.</text>
    <line data-anim="grow-x" style="--delay:980ms; transform-origin:center" x1="340" y1="360" x2="460" y2="360" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
