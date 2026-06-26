// Glossary explainer — AI OVERVIEW
//
// What the AI Overview is (the generated paragraph Google writes above the
// blue links, naming a handful of sources), why it now matters more (its
// share of restaurant-related searches roughly doubled — to about an eighth
// of them — so for more diners it is the first thing they read), how it
// chooses which page to quote (a clean, self-contained answer in plain prose
// up top that matches the page's own structured data), and the concrete move
// (put a complete answer in the first forty or so words under a question-
// shaped heading). The only quantitative claim is the sourced ~6%→~13%
// doubling of AI-Overview presence — every other figure is avoided on
// purpose. This is a mechanism explainer, not a numbers one.

export default {
  term_slug: 'ai-overview',
  term_head: 'AI Overviews, in 90 seconds.',
  subhead:   'How the answer box decides which restaurant it quotes.',
  duration_ms: 73000,
  audio_url: null,
  scenes_es: [
    { id: 'what',  caption: 'El AI Overview es el párrafo que Google escribe arriba de todo en los resultados — por encima de los enlaces azules. Es generado, y nombra el puñado de fuentes de donde sacó la respuesta.' },
    { id: 'shift', caption: 'Ya no es una función de nicho. En las búsquedas sobre restaurantes, la proporción que muestra un AI Overview prácticamente se duplicó a comienzos de 2026 — a cerca de una de cada ocho búsquedas — así que para más comensales la respuesta generada es lo primero que leen.' },
    { id: 'picks', caption: 'Cita las páginas que responden la pregunta con limpieza: una respuesta completa en prosa clara, en la primera oración, que coincide con los datos estructurados de la propia página. Las páginas que entierran la respuesta tres párrafos abajo no se eligen.' },
    { id: 'move',  caption: 'Así que el movimiento es concreto. Pon una respuesta completa en las primeras cuarenta palabras, más o menos, bajo un encabezado en forma de pregunta. Ese fragmento extraíble es lo que el recuadro puede citar sin tener que reescribirlo.' },
    { id: 'land',  caption: 'No puedes comprar tu lugar en el recuadro. Te lo ganas siendo la respuesta más clara y mejor corroborada a la pregunta exacta que escribió un comensal.' },
  ],
  scenes: [
    { id: 'what',  ms: 13000, caption: 'The AI Overview is the paragraph Google writes at the very top of the results — above the blue links. It is generated, and it names a handful of sources it pulled the answer from.' },
    { id: 'shift', ms: 15000, caption: 'It is not a fringe feature anymore. On restaurant-related searches the share showing an AI Overview roughly doubled in early 2026 — to about an eighth of searches — so for more diners the generated answer is the first thing they read.' },
    { id: 'picks', ms: 16000, caption: 'It quotes the pages that answer the question cleanly: a self-contained answer in plain prose, in the first sentence, that matches the page’s own structured data. Pages that bury the answer three paragraphs down do not get pulled.' },
    { id: 'move',  ms: 15000, caption: 'So the move is concrete. Put a complete answer in the first forty or so words under a question-shaped heading. That liftable span is what the box can quote without rewriting.' },
    { id: 'land',  ms: 14000, caption: 'You cannot buy your way into the box. You earn it by being the clearest, best-corroborated answer to the exact question a diner typed.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of how Google's AI Overview answer box chooses which restaurant page it quotes">
  <defs>
    <linearGradient id="ao-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#ao-bg)"/>

  <!-- ============ WHAT ============ -->
  <g class="explainer-scene" data-scene-id="what">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The answer box, on top</text>
    <!-- the generated answer box -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="120" y="80" width="560" height="150" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="146" y="112" font-size="11" letter-spacing="0.12em">AI OVERVIEW · GENERATED</text>
      <line x1="146" y1="126" x2="654" y2="126" stroke="var(--line,#E8E2D6)"/>
      <rect x="146" y="142" width="500" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="146" y="160" width="508" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="146" y="178" width="430" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <!-- source chips -->
      <g data-anim="fade" style="--delay:700ms">
        <rect x="146" y="200" width="92" height="20" rx="10" fill="var(--cream,#FAF7F2)" stroke="var(--teal,#1F4E5B)"/>
        <text class="text-teal" x="192" y="214" text-anchor="middle" font-size="11">source</text>
        <rect x="248" y="200" width="92" height="20" rx="10" fill="var(--cream,#FAF7F2)" stroke="var(--teal,#1F4E5B)"/>
        <text class="text-teal" x="294" y="214" text-anchor="middle" font-size="11">source</text>
        <rect x="350" y="200" width="92" height="20" rx="10" fill="var(--cream,#FAF7F2)" stroke="var(--teal,#1F4E5B)"/>
        <text class="text-teal" x="396" y="214" text-anchor="middle" font-size="11">source</text>
      </g>
    </g>
    <!-- the blue links, below -->
    <g data-anim="rise" style="--delay:1000ms">
      <text class="text-stone" x="120" y="276" font-size="11" letter-spacing="0.12em">THE BLUE LINKS · BELOW</text>
      <rect x="120" y="294" width="300" height="8" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="120" y="312" width="420" height="8" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="120" y="348" width="300" height="8" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="120" y="366" width="420" height="8" rx="4" fill="var(--line,#E8E2D6)"/>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1500ms">A paragraph Google wrote, naming the sources it pulled from.</text>
  </g>

  <!-- ============ SHIFT ============ -->
  <g class="explainer-scene" data-scene-id="shift">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Restaurant searches with an AI Overview</text>
    <!-- before bar ~6% -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="80" y="158" font-size="11" letter-spacing="0.1em">BEFORE</text>
      <rect x="80" y="172" height="56" rx="4" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:400ms" width="74"/>
      <text class="text-soft" x="172" y="210" font-family="Fraunces, Georgia, serif" font-size="26">~6%</text>
    </g>
    <!-- after bar ~13% (roughly double) -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-stone" x="80" y="288" font-size="11" letter-spacing="0.1em">EARLY 2026 · ROUGHLY DOUBLED</text>
      <rect x="80" y="302" height="56" rx="4" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:1100ms" width="160"/>
      <text class="text-soft" x="258" y="340" font-family="Fraunces, Georgia, serif" font-size="26">~13%</text>
    </g>
    <text class="text-stone" x="400" y="420" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">About one in eight restaurant searches now opens with the generated answer.</text>
  </g>

  <!-- ============ PICKS ============ -->
  <g class="explainer-scene" data-scene-id="picks">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Which page gets quoted</text>
    <!-- good page: answer up top (teal) -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="90" y="100" width="280" height="290" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <rect x="114" y="124" width="180" height="10" rx="5" fill="var(--teal,#1F4E5B)"/>
      <rect x="114" y="150" width="232" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="114" y="168" width="232" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="114" y="186" width="170" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="114" y="230" width="232" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="114" y="246" width="232" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="114" y="280" width="232" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="114" y="296" width="200" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <text class="text-teal" x="230" y="356" text-anchor="middle" font-size="13">answer in the first sentence</text>
      <g data-anim="fade" style="--delay:800ms">
        <rect x="150" y="368" width="160" height="22" rx="11" fill="var(--teal,#1F4E5B)"/>
        <text x="230" y="383" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)" letter-spacing="0.06em">QUOTED</text>
      </g>
    </g>
    <!-- bad page: answer buried (rust) -->
    <g data-anim="rise" style="--delay:500ms">
      <rect x="430" y="100" width="280" height="290" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <rect x="454" y="124" width="232" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="454" y="140" width="232" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="454" y="166" width="232" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="454" y="182" width="200" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="454" y="226" width="180" height="10" rx="5" fill="var(--rust,#B8541A)"/>
      <rect x="454" y="252" width="232" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="454" y="270" width="170" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <text class="text-rust" x="570" y="356" text-anchor="middle" font-size="13" font-style="italic">answer buried three down</text>
      <g data-anim="fade" style="--delay:1100ms">
        <rect x="490" y="368" width="160" height="22" rx="11" fill="var(--cream,#FAF7F2)" stroke="var(--rust,#B8541A)"/>
        <text class="text-rust" x="570" y="383" text-anchor="middle" font-size="12" letter-spacing="0.06em">SKIPPED</text>
      </g>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:1500ms">Clean answer up top, matching the page&#8217;s own structured data.</text>
  </g>

  <!-- ============ MOVE ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The move</text>
    <!-- a page with a question heading + a highlighted first-40-words span -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="140" y="92" width="520" height="300" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <!-- question-shaped heading -->
      <text class="text-soft" x="172" y="146" font-family="Fraunces, Georgia, serif" font-size="22">How much does it cost?</text>
      <line x1="172" y1="160" x2="628" y2="160" stroke="var(--line,#E8E2D6)"/>
    </g>
    <!-- the liftable span, highlighted -->
    <g data-anim="grow-x" style="--delay:600ms">
      <rect x="160" y="182" width="480" height="92" rx="8" fill="rgba(31,78,91,0.10)" stroke="var(--teal,#1F4E5B)" stroke-dasharray="4 3"/>
    </g>
    <g data-anim="fade" style="--delay:1000ms">
      <rect x="176" y="204" width="448" height="9" rx="4" fill="var(--teal,#1F4E5B)" opacity="0.55"/>
      <rect x="176" y="222" width="448" height="9" rx="4" fill="var(--teal,#1F4E5B)" opacity="0.55"/>
      <rect x="176" y="240" width="300" height="9" rx="4" fill="var(--teal,#1F4E5B)" opacity="0.55"/>
      <text class="text-teal" x="600" y="294" text-anchor="end" font-size="12" letter-spacing="0.08em">FIRST ~40 WORDS</text>
    </g>
    <!-- the rest of the page, plain -->
    <g data-anim="fade" style="--delay:1300ms">
      <rect x="176" y="300" width="448" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="176" y="316" width="448" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="176" y="346" width="380" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1600ms">A complete answer the box can quote without rewriting it.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="170" text-anchor="middle">AI Overview</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="248" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">Earned, not bought.</text>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="312" text-anchor="middle" font-size="14">The clearest, best-corroborated answer to the exact question typed.</text>
    <line data-anim="grow-x" style="--delay:1020ms; transform-origin:center" x1="340" y1="342" x2="460" y2="342" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
