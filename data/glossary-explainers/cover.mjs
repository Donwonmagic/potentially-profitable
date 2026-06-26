// Glossary explainer — COVER
//
// What a "cover" actually is — one guest served, not a table, not a
// ticket, not an order — and why it is the unit nearly every restaurant
// number is really measured in. Walks from the definition (a four-top is
// four covers) to the per-cover math (check average, labor, rent), to the
// table-count trap, to the move (track covers), and lands on the punchline:
// tables are furniture, covers are people. All figures are an illustrative
// example — two hypothetical Fridays, one made-up shift — not measured
// operator data.

export default {
  term_slug: 'cover',
  term_head: 'Cover, in 90 seconds.',
  subhead:   'The one unit every restaurant number is really measured in.',
  duration_ms: 73000,
  audio_url: null,
  scenes_es: [
    { id: 'define', caption: 'Un comensal es una persona servida — no una mesa, no un ticket, no una orden. Una mesa de cuatro que comparte dos platos fuertes sigue siendo cuatro comensales. El comensal es la persona en la silla.' },
    { id: 'unit',   caption: 'Casi todo número que importa es, en realidad, por comensal. El ticket promedio son las ventas divididas entre los comensales. La productividad de la mano de obra son comensales por hora trabajada. Hasta la renta tiene sentido como renta por comensal. Cuenta mesas y se te escapan las personas; cuenta comensales y la matemática cuadra.' },
    { id: 'trap',   caption: '"Hicimos ochenta mesas" te dice menos que "hicimos doscientos diez comensales." Dos viernes llenos con el mismo número de mesas pueden estar a miles de dólares de distancia, porque uno llenó las sillas y el otro dejó pares de personas en mesas para cuatro.' },
    { id: 'move',   caption: 'Así que lleva la cuenta de los comensales — por turno, por mesero, por hora. Es el denominador que vive debajo de tu ticket promedio, de tu porcentaje de mano de obra, y del pronóstico de la semana que viene.' },
    { id: 'land',   caption: 'Las mesas son muebles. Los comensales son personas. Saca las cuentas sobre las personas.' },
  ],
  scenes: [
    { id: 'define', ms: 13000, caption: 'A cover is one guest served — not a table, not a ticket, not an order. A four-top that splits two entrees is still four covers. The cover is the person in the seat.' },
    { id: 'unit',   ms: 16000, caption: 'Almost every number that matters is really per-cover. Average check is sales divided by covers. Labor productivity is covers per labor hour. Even rent makes sense as rent per cover. Count tables and you miss the people; count covers and the math lines up.' },
    { id: 'trap',   ms: 15000, caption: '"We did eighty tables" tells you less than "we did two hundred ten covers." Two busy Fridays with the same table count can be thousands of dollars apart, because one filled the seats and the other left twos at four-tops.' },
    { id: 'move',   ms: 15000, caption: 'So track covers — per shift, per server, per hour. It is the denominator sitting under your check average, your labor percentage, and next week’s forecast.' },
    { id: 'land',   ms: 14000, caption: 'Tables are furniture. Covers are people. Run the numbers on the people.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of a restaurant cover — one guest served as the unit behind every restaurant number">
  <defs>
    <linearGradient id="cv-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#cv-bg)"/>

  <!-- ============ DEFINE ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">One guest, one cover</text>
    <!-- the table -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="320" y="200" width="160" height="100" rx="10" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)" stroke-width="2"/>
      <text class="text-stone" x="400" y="256" text-anchor="middle" font-size="13" letter-spacing="0.1em">ONE TABLE</text>
    </g>
    <!-- four seats, highlighted -->
    <g data-anim="grow-x" style="--delay:500ms">
      <circle cx="370" cy="172" r="22" fill="var(--teal,#1F4E5B)"/>
      <circle cx="430" cy="172" r="22" fill="var(--teal,#1F4E5B)"/>
      <circle cx="370" cy="328" r="22" fill="var(--teal,#1F4E5B)"/>
      <circle cx="430" cy="328" r="22" fill="var(--teal,#1F4E5B)"/>
    </g>
    <!-- two shared entrees on the table -->
    <g data-anim="fade" style="--delay:900ms">
      <circle cx="372" cy="250" r="13" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <circle cx="428" cy="250" r="13" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <text class="text-stone" x="400" y="290" text-anchor="middle" font-size="11">2 entrees, split</text>
    </g>
    <!-- the count -->
    <g data-anim="rise" style="--delay:1200ms">
      <text class="text-rust" x="620" y="240" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="96">4</text>
      <text class="text-stone" x="620" y="288" text-anchor="middle" font-size="16" letter-spacing="0.08em">COVERS</text>
    </g>
    <text class="text-soft" x="400" y="416" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1600ms">Not the table. Not the two tickets. The four people.</text>
  </g>

  <!-- ============ UNIT ============ -->
  <g class="explainer-scene" data-scene-id="unit">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Everything is really per-cover</text>
    <!-- formula 1: average check -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="80" y="120" width="640" height="74" rx="10" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="108" y="165" font-size="16">Average check</text>
      <text class="text-stone" x="360" y="165" font-size="15">=</text>
      <text class="text-soft" x="690" y="165" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">sales <tspan class="text-stone" font-size="18" font-family="-apple-system, system-ui, sans-serif">/</tspan> covers</text>
    </g>
    <!-- formula 2: labor productivity -->
    <g data-anim="rise" style="--delay:420ms">
      <rect x="80" y="208" width="640" height="74" rx="10" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="108" y="253" font-size="16">Labor productivity</text>
      <text class="text-stone" x="360" y="253" font-size="15">=</text>
      <text class="text-soft" x="690" y="253" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">covers <tspan class="text-stone" font-size="18" font-family="-apple-system, system-ui, sans-serif">/</tspan> labor hour</text>
    </g>
    <!-- formula 3: rent per cover -->
    <g data-anim="rise" style="--delay:700ms">
      <rect x="80" y="296" width="640" height="74" rx="10" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="108" y="341" font-size="16">Even rent</text>
      <text class="text-stone" x="360" y="341" font-size="15">=</text>
      <text class="text-soft" x="690" y="341" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">rent <tspan class="text-stone" font-size="18" font-family="-apple-system, system-ui, sans-serif">/</tspan> cover</text>
    </g>
    <text class="text-teal" x="400" y="420" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1100ms">Count covers and the math lines up.</text>
  </g>

  <!-- ============ TRAP ============ -->
  <g class="explainer-scene" data-scene-id="trap">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Same tables, different night</text>
    <!-- Friday A: full seats -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="90" y="110" width="280" height="270" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="114" y="150" font-size="11" letter-spacing="0.1em">FRIDAY · SEATS FILLED</text>
      <!-- four-top, all four full -->
      <rect x="170" y="180" width="120" height="64" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <circle cx="200" cy="174" r="12" fill="var(--teal,#1F4E5B)"/>
      <circle cx="260" cy="174" r="12" fill="var(--teal,#1F4E5B)"/>
      <circle cx="200" cy="250" r="12" fill="var(--teal,#1F4E5B)"/>
      <circle cx="260" cy="250" r="12" fill="var(--teal,#1F4E5B)"/>
      <text class="text-stone" x="230" y="296" text-anchor="middle" font-size="12">80 tables</text>
      <text class="text-teal" x="230" y="346" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">210</text>
      <text class="text-stone" x="230" y="366" text-anchor="middle" font-size="11" letter-spacing="0.08em">COVERS</text>
    </g>
    <!-- Friday B: twos at four-tops -->
    <g data-anim="rise" style="--delay:520ms">
      <rect x="430" y="110" width="280" height="270" rx="14" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="454" y="150" font-size="11" letter-spacing="0.1em">FRIDAY · TWOS AT FOUR-TOPS</text>
      <!-- four-top, only two full -->
      <rect x="510" y="180" width="120" height="64" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <circle cx="540" cy="174" r="12" fill="var(--rust,#B8541A)"/>
      <circle cx="600" cy="174" r="12" fill="var(--rust,#B8541A)"/>
      <circle cx="540" cy="250" r="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)" stroke-dasharray="3 3"/>
      <circle cx="600" cy="250" r="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)" stroke-dasharray="3 3"/>
      <text class="text-stone" x="570" y="296" text-anchor="middle" font-size="12">80 tables</text>
      <text class="text-rust" x="570" y="346" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">150</text>
      <text class="text-stone" x="570" y="366" text-anchor="middle" font-size="11" letter-spacing="0.08em">COVERS</text>
    </g>
    <text class="text-soft" x="400" y="424" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1100ms">Same table count. Thousands of dollars apart.</text>
  </g>

  <!-- ============ MOVE ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Track the denominator</text>
    <!-- the per-shift covers tally -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="120" y="100" width="560" height="190" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="148" y="138" font-size="11" letter-spacing="0.12em">COVERS · FRIDAY DINNER</text>
      <line x1="148" y1="156" x2="652" y2="156" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="148" y="192" font-size="14">5–7 pm</text>
      <text class="text-soft" x="652" y="192" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="20">64</text>
      <text class="text-soft" x="148" y="226" font-size="14">7–9 pm</text>
      <text class="text-soft" x="652" y="226" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="20">98</text>
      <text class="text-soft" x="148" y="260" font-size="14">9–11 pm</text>
      <text class="text-soft" x="652" y="260" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="20">48</text>
      <line x1="148" y1="276" x2="652" y2="276" stroke="var(--ink,#14161A)" stroke-width="1.5"/>
    </g>
    <g data-anim="rise" style="--delay:700ms">
      <text class="text-stone" x="148" y="324" font-size="13" letter-spacing="0.1em">SHIFT TOTAL</text>
      <text class="text-teal" x="652" y="332" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="40">210</text>
    </g>
    <!-- what it feeds -->
    <g data-anim="fade" style="--delay:1100ms">
      <text class="text-stone" x="400" y="392" text-anchor="middle" font-size="13">feeds:</text>
      <text class="text-soft" x="400" y="416" text-anchor="middle" font-size="14">check average&#160;&#160;·&#160;&#160;labor %&#160;&#160;·&#160;&#160;next week’s forecast</text>
    </g>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="170" text-anchor="middle">Cover</text>
    <g data-anim="rise" style="--delay:380ms">
      <text x="400" y="252" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" fill="var(--ink,#14161A)">Tables are furniture.</text>
      <text x="400" y="306" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--rust,#B8541A)">Covers are people.</text>
    </g>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="362" text-anchor="middle" font-size="15">Run the numbers on the people.</text>
    <line data-anim="grow-x" style="--delay:1020ms; transform-origin:center" x1="340" y1="392" x2="460" y2="392" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
