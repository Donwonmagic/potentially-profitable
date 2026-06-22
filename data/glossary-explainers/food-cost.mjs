// Glossary explainer — FOOD COST
//
// What the food-cost percentage actually measures (ingredients / sales),
// why the number alone is neither good nor bad, and the trap that costs
// operators real money: the gap between theoretical food cost (what the
// recipes say) and actual food cost (what the month-end statement says).
// All figures are an illustrative worked example — one burger, one
// hypothetical month — not measured operator data.

export default {
  term_slug: 'food-cost',
  term_head: 'Food cost, in 90 seconds.',
  subhead:   'What the percentage measures — and the gap it hides.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'formula',     caption: 'El costo de comida en porcentaje es una sola división: lo que costaron los ingredientes, dividido entre lo que cobraste. Una hamburguesa que te cuesta cuatro con cincuenta en comida, vendida a quince, corre un costo de comida del treinta por ciento. Esa es toda la fórmula.' },
    { id: 'target',      caption: 'Treinta está bien. La mayoría de las cocinas de servicio completo apuntan a algún punto entre los veintitantos altos y los treinta y pico — pero el porcentaje por sí solo no es ni bueno ni malo. Lo que importa es el margen que deja después de pagar mano de obra, renta y todo lo demás.' },
    { id: 'theoretical', caption: 'Aquí está la trampa. Tus recetas dicen treinta por ciento — ese es el costo teórico, el número si cada plato saliera exactamente como lo costeaste. El estado de fin de mes dice treinta y seis. Esa brecha de seis puntos es la verdadera historia.' },
    { id: 'gap',         caption: 'La brecha es sobre-porción, merma, cortesías, robo, y precios que subieron desde la última vez que costeaste la receta. En un restaurante que hace ochenta mil al mes en ventas de comida, seis puntos son unos cuatro mil ochocientos dólares — cada mes.' },
    { id: 'land',        caption: 'Así que no persigas un porcentaje más bajo abaratando el plato. Persigue la brecha: cuenta, porciona según la receta, y vuelve a costear cuando se mueve una factura. El porcentaje es lo que cuesta; la brecha es lo que de verdad puedes recuperar.' },
  ],
  scenes: [
    { id: 'formula',     ms: 15000, caption: 'Food cost percent is one division: what the ingredients cost, divided by what you charged. A burger that costs you four-fifty in food, sold at fifteen, runs a thirty percent food cost. That is the whole formula.' },
    { id: 'target',      ms: 14000, caption: 'Thirty is fine. Most full-service kitchens aim somewhere from the high twenties to the mid thirties — but the percent alone is neither good nor bad. What matters is the margin it leaves after labor, rent, and everything else gets paid.' },
    { id: 'theoretical', ms: 15000, caption: 'Here is the trap. Your recipes say thirty percent — that is theoretical food cost, the number if every plate went out exactly as costed. The month-end statement says thirty-six. That six-point gap is the real story.' },
    { id: 'gap',         ms: 16000, caption: 'The gap is over-portioning, waste, comps, theft, and prices that crept up since you last costed the recipe. On a restaurant doing eighty thousand a month in food sales, six points is roughly forty-eight hundred dollars — every month.' },
    { id: 'land',        ms: 14000, caption: 'So do not chase a lower percent by cheapening the plate. Chase the gap: count, portion to the recipe, and re-cost when an invoice moves. The percent is what it costs; the gap is what you can actually win back.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant food cost percentage and the theoretical-versus-actual gap">
  <defs>
    <linearGradient id="fc-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#fc-bg)"/>

  <!-- ============ FORMULA ============ -->
  <g class="explainer-scene" data-scene-id="formula">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The formula</text>
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="150" y="210" text-anchor="middle" font-size="12" letter-spacing="0.1em">FOOD COST</text>
      <text class="text-soft" x="150" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">$4.50</text>
      <line x1="60" y1="290" x2="240" y2="290" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="150" y="320" text-anchor="middle" font-size="12" letter-spacing="0.1em">MENU PRICE</text>
      <text class="text-soft" x="150" y="372" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">$15.00</text>
    </g>
    <text class="text-stone" x="330" y="290" text-anchor="middle" font-size="40" data-anim="fade" style="--delay:700ms">=</text>
    <g data-anim="rise" style="--delay:1000ms">
      <text class="text-rust" x="560" y="300" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="96">30%</text>
      <text class="text-stone" x="560" y="350" text-anchor="middle" font-size="14" font-style="italic">that is the whole formula</text>
    </g>
  </g>

  <!-- ============ TARGET ============ -->
  <g class="explainer-scene" data-scene-id="target">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The target band</text>
    <g data-anim="fade" style="--delay:120ms">
      <line x1="80" y1="270" x2="720" y2="270" stroke="var(--line-dark,#D4CCBC)" stroke-width="2"/>
      <text class="text-stone" x="80" y="300" font-size="12">0%</text>
      <text class="text-stone" x="400" y="300" text-anchor="middle" font-size="12">25%</text>
      <text class="text-stone" x="720" y="300" text-anchor="end" font-size="12">50%</text>
    </g>
    <!-- band: high-20s to mid-30s -> ~27% to ~35% on a 0-50 axis spanning x=80..720 -->
    <rect x="425" y="248" width="178" height="44" rx="6" fill="rgba(31,78,91,0.14)" stroke="var(--teal,#1F4E5B)" stroke-dasharray="4 3" data-anim="grow-x" style="--delay:500ms"/>
    <text class="text-soft" x="514" y="234" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:900ms">most kitchens aim here</text>
    <!-- 30% marker -->
    <g data-anim="rise" style="--delay:1200ms">
      <line x1="464" y1="240" x2="464" y2="300" stroke="var(--rust,#B8541A)" stroke-width="2"/>
      <text class="text-rust" x="464" y="330" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="20">30%</text>
    </g>
    <text class="text-stone" x="400" y="400" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1600ms">The percent alone is not the verdict — the margin it leaves is.</text>
  </g>

  <!-- ============ THEORETICAL vs ACTUAL ============ -->
  <g class="explainer-scene" data-scene-id="theoretical">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Theoretical vs actual</text>
    <!-- theoretical 30% (teal) -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="80" y="150" font-size="11" letter-spacing="0.1em">RECIPE SAYS · THEORETICAL</text>
      <rect x="80" y="164" height="56" rx="4" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:400ms" width="396"/>
      <text x="456" y="200" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="24" fill="var(--cream,#FAF7F2)">30%</text>
    </g>
    <!-- actual 36% (rust) -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-stone" x="80" y="280" font-size="11" letter-spacing="0.1em">STATEMENT SAYS · ACTUAL</text>
      <rect x="80" y="294" height="56" rx="4" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:1100ms" width="475"/>
      <text x="535" y="330" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="24" fill="var(--cream,#FAF7F2)">36%</text>
    </g>
    <!-- the gap bracket -->
    <g data-anim="fade" style="--delay:1700ms">
      <rect x="476" y="164" width="79" height="186" fill="rgba(184,84,26,0.10)" stroke="var(--rust,#B8541A)" stroke-dasharray="3 3"/>
      <text class="text-rust" x="600" y="262" font-size="15" font-style="italic">six-point gap</text>
    </g>
  </g>

  <!-- ============ THE GAP ============ -->
  <g class="explainer-scene" data-scene-id="gap">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">What the gap is made of</text>
    <g data-anim="rise" style="--delay:140ms">
      <rect x="70"  y="120" width="150" height="60" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="145" y="156" text-anchor="middle" font-size="14">over-portioning</text>
      <rect x="240" y="120" width="150" height="60" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="315" y="156" text-anchor="middle" font-size="14">waste</text>
      <rect x="410" y="120" width="150" height="60" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="485" y="156" text-anchor="middle" font-size="14">comps &amp; theft</text>
      <rect x="580" y="120" width="150" height="60" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="655" y="156" text-anchor="middle" font-size="14">price creep</text>
    </g>
    <g data-anim="rise" style="--delay:900ms">
      <rect x="210" y="250" width="380" height="120" rx="12" fill="rgba(184,84,26,0.08)" stroke="var(--rust,#B8541A)"/>
      <text class="text-stone" x="400" y="288" text-anchor="middle" font-size="13">6 points on $80,000/mo food sales</text>
      <text class="text-rust" x="400" y="338" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">≈ $4,800</text>
      <text class="text-stone" x="400" y="360" text-anchor="middle" font-size="12">every month</text>
    </g>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The move</text>
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-soft" x="400" y="220" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34">Chase the gap,</text>
      <text class="text-soft" x="400" y="266" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34">not the percent.</text>
    </g>
    <text class="text-stone" x="400" y="340" text-anchor="middle" font-size="15" font-style="italic" data-anim="fade" style="--delay:900ms">The percent is what it costs. The gap is what you can win back.</text>
  </g>
</svg>`,
};
