// Glossary explainer — BREAK-EVEN
//
// The sales line where total revenue exactly equals total cost — the
// covers you have to sell before a dollar is yours. Walks the formula
// (fixed costs ÷ contribution margin per cover), the two fast levers
// versus the slow one, and the discount trap that pushes the line up.
// All figures are an illustrative worked example — one hypothetical
// month — not measured operator data.

export default {
  term_slug: 'break-even',
  term_head: 'Break-even, in 90 seconds.',
  subhead:   'The covers you have to sell before a dollar is yours.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'define', caption: 'El punto de equilibrio es la línea de ventas donde el ingreso total iguala exactamente al costo total. Un dólar por debajo, estás perdiendo dinero; un dólar por encima, por fin lo estás ganando.' },
    { id: 'math',   caption: 'La fórmula es costos fijos divididos entre el margen de contribución por cubierto. Digamos que renta, sueldos y seguro suman $40,000 al mes, y cada cubierto deja $18 después de sus costos variables. $40,000 entre $18 son unos 2,200 cubiertos al mes — más o menos 74 al día — solo para llegar a cero.' },
    { id: 'levers', caption: 'Solo hay dos formas rápidas de llegar a esa línea antes: subir la contribución por cubierto (precio, o costo del plato), o bajar el gasto fijo. "Hacer más cubiertos" es la más lenta de las tres.' },
    { id: 'trap',   caption: 'Aquí está la trampa. Un descuento llena mesas pero recorta la contribución por cubierto — lo que empuja el punto de equilibrio hacia arriba. Puedes estar más ocupado el viernes y más lejos del equilibrio que el martes.' },
    { id: 'land',   caption: 'El punto de equilibrio no es un número que alcanzas una vez. Es la línea que mueve cada decisión de precio y costo. Sabe dónde está el tuyo antes de lanzar la próxima promoción.' },
  ],
  scenes: [
    { id: 'define', ms: 14000, caption: 'Break-even is the sales line where total revenue exactly equals total cost. A dollar below it, you are losing money; a dollar above it, you are finally making it.' },
    { id: 'math',   ms: 16000, caption: 'The formula is fixed costs divided by contribution margin per cover. Say rent, salaries, and insurance run forty thousand dollars a month, and each cover leaves eighteen dollars after its variable costs. Forty thousand divided by eighteen is about two thousand two hundred covers a month — roughly seventy-four a day — just to reach zero.' },
    { id: 'levers', ms: 15000, caption: 'There are only two fast ways to reach that line sooner: lift the contribution per cover (price, or plate cost), or lower the fixed nut. "Just do more covers" is the slowest of the three.' },
    { id: 'trap',   ms: 15000, caption: 'Here is the trap. A discount fills seats but cuts the contribution per cover — which pushes break-even higher. You can be busier on Friday and further from break-even than you were on Tuesday.' },
    { id: 'land',   ms: 14000, caption: 'Break-even is not a number you hit once. It is the line every pricing and cost decision moves. Know where yours sits before you run the next promotion.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant break-even — the covers you must sell before a dollar is yours">
  <defs>
    <linearGradient id="be-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#be-bg)"/>

  <!-- ============ DEFINE ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Where the lines cross</text>
    <!-- axes -->
    <g data-anim="fade" style="--delay:120ms">
      <line x1="120" y1="400" x2="700" y2="400" stroke="var(--line-dark,#D4CCBC)" stroke-width="2"/>
      <line x1="120" y1="110" x2="120" y2="400" stroke="var(--line-dark,#D4CCBC)" stroke-width="2"/>
      <text class="text-stone" x="410" y="436" text-anchor="middle" font-size="12" letter-spacing="0.1em">COVERS SOLD →</text>
      <text class="text-stone" x="92" y="255" text-anchor="middle" font-size="12" letter-spacing="0.1em" transform="rotate(-90 92 255)">DOLLARS →</text>
    </g>
    <!-- total-cost line (rust): starts above zero at fixed cost, rises gently -->
    <line x1="120" y1="300" x2="700" y2="220" stroke="var(--rust,#B8541A)" stroke-width="3" data-anim="grow-x" style="--delay:500ms"/>
    <text class="text-rust" x="704" y="222" font-size="13">total cost</text>
    <!-- revenue line (teal): from origin, steeper -->
    <line x1="120" y1="400" x2="700" y2="150" stroke="var(--teal,#1F4E5B)" stroke-width="3" data-anim="grow-x" style="--delay:900ms"/>
    <text class="text-teal" x="704" y="152" font-size="13">revenue</text>
    <!-- crossing point ~ where the two lines meet -->
    <g data-anim="fade" style="--delay:1500ms">
      <circle cx="406" cy="278" r="7" fill="var(--cream,#FAF7F2)" stroke="var(--ink,#14161A)" stroke-width="2"/>
      <line x1="406" y1="278" x2="406" y2="400" stroke="var(--ink,#14161A)" stroke-dasharray="3 3"/>
      <text class="text-soft" x="406" y="250" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="18">break-even</text>
    </g>
    <text class="text-stone" x="250" y="370" text-anchor="middle" font-size="12" font-style="italic" data-anim="fade" style="--delay:1800ms">losing</text>
    <text class="text-stone" x="560" y="200" text-anchor="middle" font-size="12" font-style="italic" data-anim="fade" style="--delay:1800ms">finally making it</text>
  </g>

  <!-- ============ MATH ============ -->
  <g class="explainer-scene" data-scene-id="math">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The formula</text>
    <!-- fixed costs over contribution -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="220" y="150" text-anchor="middle" font-size="12" letter-spacing="0.1em">FIXED COSTS / MONTH</text>
      <text class="text-soft" x="220" y="206" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44">$40,000</text>
      <text class="text-stone" x="220" y="230" text-anchor="middle" font-size="11">rent · salaries · insurance</text>
      <line x1="90" y1="252" x2="350" y2="252" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="220" y="284" text-anchor="middle" font-size="12" letter-spacing="0.1em">CONTRIBUTION / COVER</text>
      <text class="text-soft" x="220" y="340" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44">$18</text>
      <text class="text-stone" x="220" y="364" text-anchor="middle" font-size="11">left after variable costs</text>
    </g>
    <text class="text-stone" x="420" y="262" text-anchor="middle" font-size="44" data-anim="fade" style="--delay:800ms">=</text>
    <g data-anim="rise" style="--delay:1100ms">
      <text class="text-teal" x="610" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="72">≈ 2,222</text>
      <text class="text-stone" x="610" y="296" text-anchor="middle" font-size="14">covers a month to reach zero</text>
      <text class="text-soft" x="610" y="340" text-anchor="middle" font-size="16" font-style="italic">≈ 74 a day</text>
    </g>
  </g>

  <!-- ============ LEVERS ============ -->
  <g class="explainer-scene" data-scene-id="levers">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Three ways to the line · two are fast</text>
    <!-- lever 1: raise contribution (teal, fast) -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="100" y="120" width="600" height="80" rx="10" fill="rgba(31,78,91,0.08)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="130" y="156" font-size="16" font-family="Fraunces, Georgia, serif">Lift contribution per cover</text>
      <text class="text-stone" x="130" y="180" font-size="13">raise price, or cut plate cost</text>
      <line x1="500" y1="160" x2="640" y2="160" stroke="var(--teal,#1F4E5B)" stroke-width="3" data-anim="grow-x" style="--delay:520ms"/>
      <path d="M634 152 L650 160 L634 168 Z" fill="var(--teal,#1F4E5B)" data-anim="fade" style="--delay:760ms"/>
      <text class="text-teal" x="572" y="148" text-anchor="middle" font-size="12" letter-spacing="0.1em">FAST</text>
    </g>
    <!-- lever 2: cut fixed cost (teal, fast) -->
    <g data-anim="rise" style="--delay:560ms">
      <rect x="100" y="220" width="600" height="80" rx="10" fill="rgba(31,78,91,0.08)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="130" y="256" font-size="16" font-family="Fraunces, Georgia, serif">Lower the fixed nut</text>
      <text class="text-stone" x="130" y="280" font-size="13">renegotiate rent, trim standing cost</text>
      <line x1="500" y1="260" x2="640" y2="260" stroke="var(--teal,#1F4E5B)" stroke-width="3" data-anim="grow-x" style="--delay:920ms"/>
      <path d="M634 252 L650 260 L634 268 Z" fill="var(--teal,#1F4E5B)" data-anim="fade" style="--delay:1160ms"/>
      <text class="text-teal" x="572" y="248" text-anchor="middle" font-size="12" letter-spacing="0.1em">FAST</text>
    </g>
    <!-- lever 3: more covers (rust, slow) -->
    <g data-anim="rise" style="--delay:1000ms">
      <rect x="100" y="320" width="600" height="80" rx="10" fill="rgba(184,84,26,0.07)" stroke="var(--rust,#B8541A)" stroke-dasharray="4 3"/>
      <text class="text-rust" x="130" y="356" font-size="16" font-family="Fraunces, Georgia, serif">Just do more covers</text>
      <text class="text-stone" x="130" y="380" font-size="13">add seats, add turns, add hours</text>
      <line x1="520" y1="360" x2="620" y2="360" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="6 4" data-anim="grow-x" style="--delay:1360ms"/>
      <path d="M614 353 L628 360 L614 367 Z" fill="var(--rust,#B8541A)" data-anim="fade" style="--delay:1600ms"/>
      <text class="text-rust" x="572" y="348" text-anchor="middle" font-size="12" letter-spacing="0.1em">SLOWEST</text>
    </g>
  </g>

  <!-- ============ TRAP ============ -->
  <g class="explainer-scene" data-scene-id="trap">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The discount trap</text>
    <!-- contribution shrinks -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="80" y="146" font-size="11" letter-spacing="0.1em">CONTRIBUTION / COVER</text>
      <rect x="80" y="160" height="50" rx="4" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:380ms" width="300"/>
      <text x="362" y="192" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">$18</text>
      <text class="text-stone" x="400" y="192" font-size="13">→ Tuesday</text>
    </g>
    <g data-anim="rise" style="--delay:760ms">
      <rect x="80" y="230" height="50" rx="4" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:980ms" width="200"/>
      <text x="262" y="262" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">less</text>
      <text class="text-rust" x="300" y="262" font-size="13">→ after the discount</text>
    </g>
    <!-- break-even slides UP -->
    <g data-anim="fade" style="--delay:1500ms">
      <text class="text-stone" x="560" y="146" text-anchor="middle" font-size="11" letter-spacing="0.1em">BREAK-EVEN COVERS</text>
      <line x1="560" y1="360" x2="560" y2="180" stroke="var(--rust,#B8541A)" stroke-width="2"/>
      <path d="M553 192 L560 176 L567 192 Z" fill="var(--rust,#B8541A)"/>
      <text class="text-rust" x="600" y="280" font-family="Fraunces, Georgia, serif" font-size="20">slides up</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1900ms">Busier on Friday, further from break-even than Tuesday.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="180" text-anchor="middle">Break-even</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="260" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">A line, not a number.</text>
    <text data-anim="fade" style="--delay:780ms" class="text-stone" x="400" y="320" text-anchor="middle" font-size="14">Every pricing and cost decision moves it. Know where yours sits.</text>
    <line data-anim="grow-x" style="--delay:980ms; transform-origin:center" x1="340" y1="350" x2="460" y2="350" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
