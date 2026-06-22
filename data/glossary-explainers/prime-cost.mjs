// Glossary explainer — PRIME COST
//
// Food cost % + labor cost % = prime cost. The single best one-number
// pulse of an independent restaurant's operating health. Healthy band:
// 55–65%. Above 70%: unsustainable without a hard change. Six scenes
// move from "two restaurants, same revenue" to "what a 3-point food
// fix and a trimmed lunch shift do to the bar."

export default {
  term_slug: 'prime-cost',
  term_head: 'Prime cost, in 90 seconds.',
  subhead:   'The one-number pulse of operational health.',
  duration_ms: 90000,
  audio_url: null,
  scenes_es: [
    { id: 'open',      caption: 'Dos restaurantes en la misma esquina. Mismo ingreso, $80,000 al mes. Uno está creciendo. El otro pierde plata cada lunes. ¿Por qué? El costo primo.' },
    { id: 'formula',   caption: 'Costo primo es solo dos números. Costo de comida más costo de mano de obra, expresados como porcentaje de las ventas. La fórmula completa cabe en una servilleta.' },
    { id: 'band',      caption: 'Hay un rango. Los independientes saludables aterrizan entre 55% y 65%. Por encima de 70% no es lento — es insostenible. Cada punto sobre la meta es margen que sale por la puerta de la cocina.' },
    { id: 'breakdown', caption: 'El restaurante A vive en 58%. Comida en 30%, mano de obra en 28%. El B vive en 71%. Comida en 36%, mano de obra en 35%. Mismas ventas. Una pierde, otra paga la renta.' },
    { id: 'fix',       caption: 'Mira lo que pasa cuando actúas. Recorta el costo de comida tres puntos: especificaciones de porción, registros de merma, una auditoría a proveedores. Aplana el turno de almuerzo del miércoles. Bajas a 65%. Igual cantidad de cubiertos. Margen recuperado.' },
    { id: 'land',      caption: 'El costo primo es la única palanca semanal que en realidad puedes mover. Conoce el número. Decide hacia él.' },
  ],
  scenes: [
    { id: 'open',      ms: 13000, caption: 'Two restaurants on the same corner. Same revenue, $80,000 a month. One is growing. The other loses money every Monday. Why? Prime cost.' },
    { id: 'formula',   ms: 13000, caption: 'Prime cost is just two numbers. Food cost plus labor cost, expressed as a percentage of sales. The whole formula fits on a napkin.' },
    { id: 'band',      ms: 17000, caption: 'There’s a band. Healthy independents land between fifty-five and sixty-five percent. Over seventy is not slow — it’s unsustainable. Every point over target is margin walking out the kitchen door.' },
    { id: 'breakdown', ms: 18000, caption: 'Restaurant A lives at 58 percent. Food at 30, labor at 28. Restaurant B is at 71. Food at 36, labor at 35. Same revenue. One loses every month, the other pays rent.' },
    { id: 'fix',       ms: 17000, caption: 'Watch what happens when you act. Cut food cost three points — portion specs, waste logs, a supplier audit. Flatten Wednesday’s lunch shift. You drop to 65. Same covers. Margin back.' },
    { id: 'land',      ms: 12000, caption: 'Prime cost is the one weekly lever you can actually move. Know the number. Decide toward it.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant prime cost">
  <defs>
    <linearGradient id="pc-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#pc-bg)"/>

  <!-- ============ OPEN ============ -->
  <g class="explainer-scene" data-scene-id="open">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Same corner · same revenue</text>
    <g data-anim="rise" style="--delay:120ms">
      <rect x="100" y="120" width="260" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="124" y="160" font-size="11" letter-spacing="0.1em">RESTAURANT A</text>
      <text class="text-soft" x="124" y="206" font-size="40" font-family="Fraunces, Georgia, serif" font-weight="500">$80,000</text>
      <text class="text-stone" x="124" y="232" font-size="13">monthly revenue</text>
      <line x1="124" y1="252" x2="336" y2="252" stroke="var(--line,#E8E2D6)"/>
      <text class="text-good" x="124" y="288" font-size="14">Growing.</text>
      <path d="M 124 312 L 336 296" stroke="var(--status-good,#1F6B3A)" stroke-width="2" fill="none"/>
    </g>
    <g data-anim="rise" style="--delay:280ms">
      <rect x="440" y="120" width="260" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-stone" x="464" y="160" font-size="11" letter-spacing="0.1em">RESTAURANT B</text>
      <text class="text-soft" x="464" y="206" font-size="40" font-family="Fraunces, Georgia, serif" font-weight="500">$80,000</text>
      <text class="text-stone" x="464" y="232" font-size="13">monthly revenue</text>
      <line x1="464" y1="252" x2="676" y2="252" stroke="var(--line,#E8E2D6)"/>
      <text class="text-rust" x="464" y="288" font-size="14">Losing money on Mondays.</text>
      <path d="M 464 296 L 676 314" stroke="var(--rust,#B8541A)" stroke-width="2" fill="none"/>
    </g>
    <text class="text-soft" x="400" y="430" text-anchor="middle" font-size="16" data-anim="fade" style="--delay:1100ms">Same number on top. Different number underneath.</text>
  </g>

  <!-- ============ FORMULA ============ -->
  <g class="explainer-scene" data-scene-id="formula">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The whole formula</text>
    <g data-anim="rise" style="--delay:200ms">
      <text x="400" y="220" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44" fill="var(--ink,#14161A)">Food</text>
      <text x="400" y="270" text-anchor="middle" font-size="40" fill="var(--stone,#6B6B6B)">+</text>
      <text x="400" y="316" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44" fill="var(--ink,#14161A)">Labor</text>
    </g>
    <line data-anim="grow-x" style="--delay:1100ms; transform-origin:center" x1="280" y1="350" x2="520" y2="350" stroke="var(--teal,#1F4E5B)" stroke-width="3"/>
    <text data-anim="rise" style="--delay:1280ms" x="400" y="402" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44" fill="var(--teal,#1F4E5B)" font-style="italic">Prime cost</text>
    <text data-anim="fade" style="--delay:1700ms" class="text-stone" x="400" y="448" text-anchor="middle" font-size="13">…as a % of sales</text>
  </g>

  <!-- ============ BAND ============ -->
  <g class="explainer-scene" data-scene-id="band">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The healthy band</text>
    <!-- ruler from 0% to 100% -->
    <line class="axis-line-strong" x1="100" y1="270" x2="700" y2="270" data-anim="grow-x" style="--delay:80ms"/>
    <!-- ticks -->
    <g data-anim="fade" style="--delay:300ms">
      <line x1="100" y1="262" x2="100" y2="278" class="axis-line-strong"/>
      <text x="100" y="304" text-anchor="middle" font-size="12" class="text-stone">40%</text>
      <line x1="250" y1="262" x2="250" y2="278" class="axis-line-strong"/>
      <text x="250" y="304" text-anchor="middle" font-size="12" class="text-stone">50%</text>
      <line x1="400" y1="262" x2="400" y2="278" class="axis-line-strong"/>
      <text x="400" y="304" text-anchor="middle" font-size="12" class="text-stone">60%</text>
      <line x1="550" y1="262" x2="550" y2="278" class="axis-line-strong"/>
      <text x="550" y="304" text-anchor="middle" font-size="12" class="text-stone">70%</text>
      <line x1="700" y1="262" x2="700" y2="278" class="axis-line-strong"/>
      <text x="700" y="304" text-anchor="middle" font-size="12" class="text-stone">80%</text>
    </g>
    <!-- healthy band (55%–65%) -->
    <rect x="325" y="240" width="150" height="60" fill="rgba(31,107,58,0.18)" rx="4" data-anim="grow-x" style="--delay:520ms; transform-origin:left center"/>
    <text class="text-good" x="400" y="234" text-anchor="middle" font-size="13" font-weight="500" data-anim="fade" style="--delay:900ms">healthy 55–65%</text>
    <!-- danger zone (>70%) -->
    <rect x="550" y="240" width="150" height="60" fill="rgba(184,84,26,0.18)" rx="4" data-anim="grow-x" style="--delay:680ms; transform-origin:left center"/>
    <text class="text-rust" x="625" y="234" text-anchor="middle" font-size="13" font-weight="500" data-anim="fade" style="--delay:1100ms">unsustainable &gt;70%</text>
    <!-- under-60% lean zone -->
    <text class="text-stone" x="200" y="340" text-anchor="middle" font-size="11" data-anim="fade" style="--delay:1280ms">lean / quick-service</text>
    <text class="text-stone" x="625" y="340" text-anchor="middle" font-size="11" data-anim="fade" style="--delay:1280ms">red flags · cut now</text>
  </g>

  <!-- ============ BREAKDOWN ============ -->
  <g class="explainer-scene" data-scene-id="breakdown">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Restaurant A vs Restaurant B</text>
    <!-- A bars -->
    <g data-anim="rise" style="--delay:120ms">
      <text class="text-stone" x="80" y="120" font-size="11" letter-spacing="0.1em">RESTAURANT A · 58% prime</text>
      <rect x="80" y="140" height="36" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:240ms" width="180"/>
      <text class="text-stone" x="86" y="164" font-size="13" fill="var(--cream,#FAF7F2)">food 30%</text>
      <rect x="260" y="140" height="36" fill="var(--teal-dark,#143640)" data-anim="grow-x" style="--delay:380ms; transform-origin:left center" width="168"/>
      <text class="text-stone" x="266" y="164" font-size="13" fill="var(--cream,#FAF7F2)">labor 28%</text>
      <rect x="428" y="140" height="36" fill="var(--line,#E8E2D6)" width="252"/>
      <text class="text-stone" x="556" y="164" text-anchor="middle" font-size="12">remainder 42%</text>
    </g>
    <!-- B bars -->
    <g data-anim="rise" style="--delay:520ms">
      <text class="text-stone" x="80" y="240" font-size="11" letter-spacing="0.1em">RESTAURANT B · 71% prime</text>
      <rect x="80" y="260" height="36" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:660ms" width="216"/>
      <text class="text-stone" x="86" y="284" font-size="13" fill="var(--cream,#FAF7F2)">food 36%</text>
      <rect x="296" y="260" height="36" fill="#8A3E16" data-anim="grow-x" style="--delay:800ms; transform-origin:left center" width="210"/>
      <text class="text-stone" x="302" y="284" font-size="13" fill="var(--cream,#FAF7F2)">labor 35%</text>
      <rect x="506" y="260" height="36" fill="var(--line,#E8E2D6)" width="174"/>
      <text class="text-stone" x="593" y="284" text-anchor="middle" font-size="12">remainder 29%</text>
    </g>

    <text class="text-soft" x="400" y="370" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1500ms">Same revenue. 13 points of difference.</text>
    <text class="text-rust" x="400" y="395" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1700ms" font-weight="500">≈ $10,400/month gone.</text>
  </g>

  <!-- ============ FIX ============ -->
  <g class="explainer-scene" data-scene-id="fix">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Restaurant B · two moves</text>
    <!-- Before bar (red) -->
    <g>
      <text class="text-stone" x="80" y="130" font-size="11" letter-spacing="0.1em">BEFORE · 71%</text>
      <rect x="80" y="150" height="36" fill="var(--rust,#B8541A)" width="216"/>
      <text class="text-stone" x="86" y="174" font-size="13" fill="var(--cream,#FAF7F2)">food 36%</text>
      <rect x="296" y="150" height="36" fill="#8A3E16" width="210"/>
      <text class="text-stone" x="302" y="174" font-size="13" fill="var(--cream,#FAF7F2)">labor 35%</text>
    </g>
    <!-- Two intervention chips -->
    <g data-anim="rise" style="--delay:300ms">
      <rect x="80" y="220" rx="999" width="270" height="36" fill="var(--teal-tint,#E8F1F3)"/>
      <text class="text-teal" x="100" y="244" font-size="13">– 3 pts food: portions · waste · supplier audit</text>
    </g>
    <g data-anim="rise" style="--delay:600ms">
      <rect x="370" y="220" rx="999" width="280" height="36" fill="var(--teal-tint,#E8F1F3)"/>
      <text class="text-teal" x="390" y="244" font-size="13">– 3 pts labor: trim Wed lunch shift</text>
    </g>
    <!-- After bar (teal) -->
    <g data-anim="rise" style="--delay:1000ms">
      <text class="text-stone" x="80" y="310" font-size="11" letter-spacing="0.1em">AFTER · 65%</text>
      <rect x="80" y="330" height="36" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:1240ms" width="198"/>
      <text class="text-stone" x="86" y="354" font-size="13" fill="var(--cream,#FAF7F2)">food 33%</text>
      <rect x="278" y="330" height="36" fill="var(--teal-dark,#143640)" data-anim="grow-x" style="--delay:1400ms; transform-origin:left center" width="192"/>
      <text class="text-stone" x="284" y="354" font-size="13" fill="var(--cream,#FAF7F2)">labor 32%</text>
    </g>
    <text class="text-good" x="400" y="424" text-anchor="middle" font-size="16" data-anim="fade" style="--delay:1900ms" font-weight="500">Same covers. ≈ $4,800/month back.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="180" text-anchor="middle">Prime cost</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="260" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44" font-style="italic" fill="var(--ink,#14161A)">Know the number.</text>
    <text data-anim="fade" style="--delay:780ms" class="text-stone" x="400" y="320" text-anchor="middle" font-size="14">It’s the one weekly lever you can actually move.</text>
    <line data-anim="grow-x" style="--delay:980ms; transform-origin:center" x1="340" y1="350" x2="460" y2="350" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
