// Glossary explainer — LABOR COST
//
// What labor actually costs as a share of sales (total labor / sales),
// why the wage on the schedule undercounts the real number (taxes,
// benefits, overtime), how labor pairs with food into prime cost, and
// the one lever that moves it — scheduling to the demand curve.
// The dollar figures are an illustrative worked example; the "under
// about sixty percent" prime-cost ceiling is a labeled rule of thumb,
// not measured operator data.

export default {
  term_slug: 'labor-cost',
  term_head: 'Labor cost, in 90 seconds.',
  subhead:   'What labor really costs as a share of sales — and the prime-cost rule.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'define', caption: 'El costo de mano de obra en porcentaje es la mano de obra total dividida entre las ventas. Treinta mil dólares de nómina sobre cien mil dólares de ventas es un costo de mano de obra del treinta por ciento. Una sola división, la misma forma que el costo de comida.' },
    { id: 'hidden', caption: 'El sueldo que aparece en el horario no es el costo completo. Los impuestos sobre la nómina, las prestaciones y las horas extra empujan tu costo real de mano de obra entre un diez y un quince por ciento por encima del sueldo base — el número que llega al estado de resultados es más grande que el que marca la tarjeta.' },
    { id: 'prime',  caption: 'Costo de comida más costo de mano de obra es igual al costo primo — los dos costos controlables más grandes en un solo número. La regla general con la que trabaja la mayoría de los operadores de servicio completo: mantén el costo primo por debajo de un sesenta por ciento, más o menos. Treinta por ciento de comida más treinta por ciento de mano de obra te deja justo en el borde.' },
    { id: 'lever',  caption: 'La mano de obra no se arregla recortando gente a media jornada. Programas según la curva de demanda — ajustas a la gente en el piso con los comensales que entran por la puerta, hora por hora, turno por turno.' },
    { id: 'land',   caption: 'La mano de obra es el único costo grande que manejas en tiempo real. El costo primo te dice si hay margen; el horario es donde de verdad lo encuentras.' },
  ],
  scenes: [
    { id: 'define', ms: 14000, caption: 'Labor cost percent is total labor divided by sales. Thirty thousand dollars of labor on a hundred thousand dollars of sales is a thirty percent labor cost. One division, the same shape as food cost.' },
    { id: 'hidden', ms: 15000, caption: 'The wage on the schedule is not the whole cost. Payroll taxes, benefits, and overtime push your real labor cost roughly ten to fifteen percent above base wages — the number that hits the P&L is bigger than the one on the timecard.' },
    { id: 'prime',  ms: 16000, caption: 'Food cost plus labor cost equals prime cost — the two biggest controllable costs in one number. The rule of thumb most full-service operators work to: keep prime under about sixty percent. Thirty percent food plus thirty percent labor lands you right at the edge.' },
    { id: 'lever',  ms: 15000, caption: 'You do not fix labor by cutting people mid-shift. You schedule to the demand curve — match the people on the floor to the covers coming through the door, hour by hour, shift by shift.' },
    { id: 'land',   ms: 14000, caption: 'Labor is the one big cost you steer in real time. Prime cost tells you whether there is room; the schedule is where you actually find it.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant labor cost as a share of sales and the prime-cost rule of thumb">
  <defs>
    <linearGradient id="lc-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#lc-bg)"/>

  <!-- ============ DEFINE ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The formula</text>
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="150" y="210" text-anchor="middle" font-size="12" letter-spacing="0.1em">TOTAL LABOR</text>
      <text class="text-soft" x="150" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">$30,000</text>
      <line x1="50" y1="290" x2="250" y2="290" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="150" y="320" text-anchor="middle" font-size="12" letter-spacing="0.1em">SALES</text>
      <text class="text-soft" x="150" y="372" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">$100,000</text>
    </g>
    <text class="text-stone" x="330" y="290" text-anchor="middle" font-size="40" data-anim="fade" style="--delay:700ms">=</text>
    <g data-anim="rise" style="--delay:1000ms">
      <text class="text-rust" x="560" y="300" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="96">30%</text>
      <text class="text-stone" x="560" y="350" text-anchor="middle" font-size="14" font-style="italic">same shape as food cost</text>
    </g>
    <!-- the share, drawn as a single bar under the result -->
    <g data-anim="fade" style="--delay:1500ms">
      <rect x="420" y="378" width="280" height="20" rx="4" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <rect x="420" y="378" width="84" height="20" rx="4" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:1700ms"/>
      <text class="text-stone" x="560" y="420" text-anchor="middle" font-size="12">30 cents of every sales dollar</text>
    </g>
  </g>

  <!-- ============ HIDDEN ON-COSTS ============ -->
  <g class="explainer-scene" data-scene-id="hidden">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The wage is not the whole cost</text>
    <!-- base wage bar (teal) -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="80" y="170" font-size="11" letter-spacing="0.1em">ON THE SCHEDULE · BASE WAGE</text>
      <rect x="80" y="184" height="56" rx="4" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:400ms" width="440"/>
      <text x="500" y="220" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">base</text>
    </g>
    <!-- on-cost extension (+10-15%, rust) -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-stone" x="80" y="300" font-size="11" letter-spacing="0.1em">ON THE P&amp;L · REAL LABOR COST</text>
      <rect x="80" y="314" height="56" rx="4" fill="var(--teal,#1F4E5B)" width="440"/>
      <rect x="520" y="314" height="56" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:1100ms" width="66"/>
      <text class="text-rust" x="588" y="306" font-size="13" font-style="italic">+10–15%</text>
    </g>
    <!-- the on-costs, named -->
    <text class="text-stone" x="400" y="420" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1700ms" font-style="italic">Payroll taxes, benefits, overtime — bigger than the timecard.</text>
  </g>

  <!-- ============ PRIME COST ============ -->
  <g class="explainer-scene" data-scene-id="prime">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Food + labor = prime cost</text>
    <!-- ceiling line at ~60% -->
    <g data-anim="fade" style="--delay:120ms">
      <line x1="80" y1="120" x2="720" y2="120" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="6 4"/>
      <text class="text-rust" x="720" y="112" text-anchor="end" font-size="13" font-style="italic">rule of thumb: keep prime under ~60%</text>
    </g>
    <!-- axis -->
    <g data-anim="fade" style="--delay:200ms">
      <line x1="280" y1="400" x2="520" y2="400" stroke="var(--line-dark,#D4CCBC)"/>
    </g>
    <!-- stacked bar: food 30% (teal) + labor 30% on top, total 60% to the ceiling -->
    <!-- axis: y=400 is 0%, y=120 is 60% -> 280px spans 60 points -> ~4.667px/pt; 30pt = 140px each -->
    <g data-anim="grow-y" style="--delay:600ms; transform-box:fill-box; transform-origin:bottom">
      <rect x="320" y="260" width="160" height="140" fill="var(--teal,#1F4E5B)"/>
      <text x="400" y="338" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">30%</text>
      <text class="text-stone" x="400" y="364" text-anchor="middle" font-size="11" fill="var(--cream,#FAF7F2)">FOOD</text>
    </g>
    <g data-anim="grow-y" style="--delay:1100ms; transform-box:fill-box; transform-origin:bottom">
      <rect x="320" y="120" width="160" height="140" fill="var(--rust,#B8541A)"/>
      <text x="400" y="198" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">30%</text>
      <text class="text-stone" x="400" y="224" text-anchor="middle" font-size="11" fill="var(--cream,#FAF7F2)">LABOR</text>
    </g>
    <text class="text-soft" x="610" y="252" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34" data-anim="fade" style="--delay:1600ms">= 60%</text>
    <text class="text-stone" x="610" y="284" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:1600ms">right at the edge</text>
  </g>

  <!-- ============ LEVER ============ -->
  <g class="explainer-scene" data-scene-id="lever">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Schedule to the demand curve</text>
    <!-- axis -->
    <g data-anim="fade" style="--delay:120ms">
      <line x1="80" y1="380" x2="720" y2="380" stroke="var(--line-dark,#D4CCBC)" stroke-width="2"/>
      <text class="text-stone" x="80"  y="404" font-size="11">11a</text>
      <text class="text-stone" x="250" y="404" text-anchor="middle" font-size="11">1p</text>
      <text class="text-stone" x="420" y="404" text-anchor="middle" font-size="11">5p</text>
      <text class="text-stone" x="590" y="404" text-anchor="middle" font-size="11">7p</text>
      <text class="text-stone" x="720" y="404" text-anchor="end" font-size="11">10p</text>
    </g>
    <!-- demand curve: lunch bump, dip, dinner peak -->
    <path d="M80,360 C150,300 200,250 250,250 C320,250 360,330 420,330 C500,330 540,150 590,150 C650,150 690,300 720,330" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="3" stroke-linecap="round" data-anim="grow-x" style="--delay:400ms"/>
    <text class="text-teal" x="250" y="232" text-anchor="middle" font-size="12" data-anim="fade" style="--delay:1100ms">lunch</text>
    <text class="text-teal" x="590" y="132" text-anchor="middle" font-size="12" data-anim="fade" style="--delay:1100ms">dinner peak</text>
    <!-- staffing dots matched under the curve -->
    <g data-anim="fade" style="--delay:1400ms" fill="var(--rust,#B8541A)">
      <circle cx="120" cy="368" r="5"/>
      <circle cx="230" cy="368" r="5"/><circle cx="248" cy="368" r="5"/>
      <circle cx="410" cy="368" r="5"/>
      <circle cx="570" cy="368" r="5"/><circle cx="588" cy="368" r="5"/><circle cx="606" cy="368" r="5"/>
      <circle cx="700" cy="368" r="5"/>
    </g>
    <text class="text-stone" x="400" y="452" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">Match the floor to the covers — hour by hour, not mid-shift.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The move</text>
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-soft" x="400" y="220" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34">Steer it in</text>
      <text class="text-soft" x="400" y="266" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34">real time.</text>
    </g>
    <text class="text-stone" x="400" y="340" text-anchor="middle" font-size="15" font-style="italic" data-anim="fade" style="--delay:900ms">Prime cost tells you whether there is room. The schedule is where you find it.</text>
  </g>
</svg>`,
};
