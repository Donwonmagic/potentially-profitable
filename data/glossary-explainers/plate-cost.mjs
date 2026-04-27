// Glossary explainer — PLATE COST
//
// What it actually costs in ingredients to send one finished plate
// to the pass. Walks through the AP / yield / EP correction with a
// whole halibut, then composes a recipe (fish + vegetables + sauce)
// into a single plate cost. Closes on the gut-vs-audit framing.

export default {
  term_slug: 'plate-cost',
  term_head: 'Plate cost, in 90 seconds.',
  subhead:   'What it actually costs to send one plate to the pass.',
  duration_ms: 90000,
  audio_url: null,
  scenes_es: [
    { id: 'invoice',  caption: 'Llega el pescado. La factura dice $22 por libra. Halibut entero — fácil de leer en una hoja de costos. Ese número va a engañar a casi todos los dueños esta noche.' },
    { id: 'trim',     caption: 'Lo limpias. Quitas la cabeza, las espinas, la cola. Cocinas el filete y se encoge un poco. De la libra que compraste, te llegan al pase ocho onzas de pescado utilizable. El rendimiento es del 50%.' },
    { id: 'ep',       caption: 'Eso significa que tu costo real por onza usable no es $22 — es $44. Costo de compra dividido por rendimiento. Costo de la porción comestible. Si cobras como si fueran $22, te estás cobrando a ti mismo el 50% de cada plato.' },
    { id: 'recipe',   caption: 'Suma la receta. Seis onzas de halibut a $44 EP — son $16,50. Cuatro onzas de vegetales — son $1,40. Dos onzas de salsa beurre blanc — son $1,35. Costo total del plato: $19,25.' },
    { id: 'price',    caption: 'A 30% de costo de comida, ese plato necesita aterrizar en $64. Si lo pones a $42 porque "$22 por libra parecía bien", estás vendiendo plata a $0,75 por dólar todas las noches.' },
    { id: 'land',     caption: 'La mayoría de los independientes trabaja desde la corazonada del chef. La matemática del rendimiento convierte la corazonada en una auditoría — costeable plato por plato, defendible factura por factura.' },
  ],
  scenes: [
    { id: 'invoice', ms: 13000, caption: 'The fish arrives. The invoice says twenty-two dollars a pound. Whole halibut — clean, easy to read on a cost sheet. That number is about to mislead almost every owner tonight.' },
    { id: 'trim',    ms: 16000, caption: 'You clean it. Pull the head, the bones, the tail. Cook the fillet and it shrinks a little more. Out of the pound you bought, eight usable ounces make it to the pass. Yield: fifty percent.' },
    { id: 'ep',      ms: 17000, caption: 'Which means your real cost per usable ounce isn’t twenty-two dollars — it’s forty-four. Purchase cost divided by yield. Edible-portion cost. Charge like it was twenty-two and you’re billing yourself fifty percent of every plate.' },
    { id: 'recipe',  ms: 17000, caption: 'Add up the recipe. Six ounces of halibut at $44 EP — sixteen-fifty. Four ounces of vegetables — a dollar-forty. Two ounces of beurre blanc — a dollar thirty-five. Plate cost: nineteen twenty-five.' },
    { id: 'price',   ms: 14000, caption: 'At a 30 percent food cost, that plate needs to land at sixty-four dollars. List it at forty-two because twenty-two-a-pound looked fine, and you’re selling silver at seventy-five cents on the dollar — every night.' },
    { id: 'land',    ms: 13000, caption: 'Most independents work from the chef’s gut. Yield math turns the gut into an audit — costable dish by dish, defensible invoice by invoice.' },
  ],
  svg: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant plate cost">
  <defs>
    <linearGradient id="pl-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#pl-bg)"/>

  <!-- ============ INVOICE ============ -->
  <g class="explainer-scene" data-scene-id="invoice">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The invoice</text>
    <g data-anim="rise" style="--delay:160ms">
      <rect x="180" y="100" width="440" height="320" rx="10" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="200" y="138" font-size="11" letter-spacing="0.12em">PURVEYOR · APR 26</text>
      <line x1="200" y1="158" x2="600" y2="158" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="200" y="194" font-size="14">Halibut, whole</text>
      <text class="text-stone" x="200" y="212" font-size="12">side · ice-packed · 1 lb</text>
      <text class="text-soft" x="600" y="194" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">$22.00</text>
      <text class="text-stone" x="600" y="212" text-anchor="end" font-size="11">per lb</text>
      <line x1="200" y1="238" x2="600" y2="238" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="200" y="280" font-size="12">SUBTOTAL</text>
      <text class="text-soft" x="600" y="280" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">$22.00</text>
    </g>
    <text class="text-rust" x="400" y="450" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1400ms">This number is about to mislead almost every owner tonight.</text>
  </g>

  <!-- ============ TRIM ============ -->
  <g class="explainer-scene" data-scene-id="trim">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Trim · bone · cook</text>
    <!-- whole fish bar (1 lb = 16 oz) — visualized as a bar of 16 segments -->
    <g data-anim="rise" style="--delay:120ms">
      <text class="text-stone" x="80" y="146" font-size="11" letter-spacing="0.1em">PURCHASED · 16 oz</text>
      <g>
        <rect x="80" y="160" width="528" height="50" fill="var(--teal,#1F4E5B)" rx="4"/>
        <text class="text-stone" x="344" y="192" text-anchor="middle" font-size="13" fill="var(--cream,#FAF7F2)">whole halibut · 1 lb</text>
      </g>
    </g>
    <!-- trimmed: 8 usable oz (50%) -->
    <g data-anim="rise" style="--delay:600ms">
      <text class="text-stone" x="80" y="276" font-size="11" letter-spacing="0.1em">EDIBLE PORTION · 8 oz · 50% yield</text>
      <rect x="80" y="290" height="50" fill="var(--status-good,#1F6B3A)" rx="4" data-anim="grow-x" style="--delay:880ms" width="264"/>
      <rect x="344" y="290" height="50" fill="rgba(184,84,26,0.15)" rx="4" stroke="var(--rust,#B8541A)" stroke-dasharray="4 3" stroke-width="1" data-anim="fade" style="--delay:1100ms" width="264"/>
      <text class="text-stone" x="212" y="322" text-anchor="middle" font-size="13" fill="var(--cream,#FAF7F2)">8 oz fillet, plated</text>
      <text class="text-rust" x="476" y="322" text-anchor="middle" font-size="12">8 oz · head, bones, shrink</text>
    </g>
    <text class="text-stone" x="400" y="416" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1500ms" font-style="italic">Half the fish never makes it to a plate.</text>
  </g>

  <!-- ============ EP CORRECTION ============ -->
  <g class="explainer-scene" data-scene-id="ep">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The correction</text>
    <!-- equation -->
    <g data-anim="rise" style="--delay:160ms">
      <text x="400" y="180" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" fill="var(--ink,#14161A)">
        $22 ÷ 0.50 = <tspan fill="var(--teal,#1F4E5B)">$44</tspan>
      </text>
      <text x="400" y="220" text-anchor="middle" font-size="14" class="text-stone">AP cost ÷ yield = EP cost (per usable oz, ×16 = per usable lb)</text>
    </g>
    <!-- two stacked rows: AP price tag vs EP price tag -->
    <g data-anim="rise" style="--delay:700ms">
      <rect x="180" y="280" width="200" height="80" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="200" y="310" font-size="11" letter-spacing="0.1em">AS-PURCHASED</text>
      <text class="text-soft" x="200" y="346" font-family="Fraunces, Georgia, serif" font-size="32">$22 / lb</text>
    </g>
    <g data-anim="rise" style="--delay:900ms">
      <rect x="420" y="280" width="200" height="80" rx="8" fill="var(--teal-tint,#E8F1F3)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="440" y="310" font-size="11" letter-spacing="0.1em">EDIBLE PORTION</text>
      <text class="text-teal" x="440" y="346" font-family="Fraunces, Georgia, serif" font-size="32">$44 / lb</text>
    </g>
    <text class="text-soft" x="400" y="424" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1300ms">Same fish. Honest cost.</text>
  </g>

  <!-- ============ RECIPE ============ -->
  <g class="explainer-scene" data-scene-id="recipe">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Compose the plate · halibut entrée</text>
    <!-- Three rows: ingredient · qty · cost -->
    <g data-anim="rise" style="--delay:120ms">
      <rect x="100" y="100" width="600" height="60" rx="8" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="124" y="138" font-size="14">Halibut fillet</text>
      <text class="text-stone" x="380" y="138" font-size="13">6 oz · $44 EP</text>
      <text class="text-soft" x="676" y="138" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">$16.50</text>
    </g>
    <g data-anim="rise" style="--delay:340ms">
      <rect x="100" y="170" width="600" height="60" rx="8" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="124" y="208" font-size="14">Seasonal vegetables</text>
      <text class="text-stone" x="380" y="208" font-size="13">4 oz · $5.60 EP</text>
      <text class="text-soft" x="676" y="208" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">$1.40</text>
    </g>
    <g data-anim="rise" style="--delay:560ms">
      <rect x="100" y="240" width="600" height="60" rx="8" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="124" y="278" font-size="14">Beurre blanc</text>
      <text class="text-stone" x="380" y="278" font-size="13">2 oz · $10.80 EP</text>
      <text class="text-soft" x="676" y="278" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">$1.35</text>
    </g>
    <line data-anim="grow-x" style="--delay:780ms" x1="100" y1="324" x2="700" y2="324" stroke="var(--ink,#14161A)" stroke-width="2"/>
    <g data-anim="rise" style="--delay:1000ms">
      <text class="text-stone" x="124" y="368" font-size="13" letter-spacing="0.1em">PLATE COST</text>
      <text class="text-teal" x="676" y="380" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="40" font-weight="500">$19.25</text>
    </g>
  </g>

  <!-- ============ PRICE ============ -->
  <g class="explainer-scene" data-scene-id="price">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Price for the room you want</text>
    <!-- Healthy menu price -->
    <g data-anim="rise" style="--delay:120ms">
      <rect x="100" y="120" width="280" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="124" y="160" font-size="11" letter-spacing="0.1em">PRICE FOR 30% FOOD COST</text>
      <text class="text-soft" x="124" y="220" font-family="Fraunces, Georgia, serif" font-size="56">$64</text>
      <text class="text-stone" x="124" y="252" font-size="13">menu listing</text>
      <line x1="124" y1="280" x2="356" y2="280" stroke="var(--line,#E8E2D6)"/>
      <text class="text-good" x="124" y="312" font-size="13">Margin where it should be.</text>
    </g>
    <!-- Wrong menu price -->
    <g data-anim="rise" style="--delay:380ms">
      <rect x="420" y="120" width="280" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="444" y="160" font-size="11" letter-spacing="0.1em">PRICED FROM AP COST</text>
      <text class="text-soft" x="444" y="220" font-family="Fraunces, Georgia, serif" font-size="56">$42</text>
      <text class="text-stone" x="444" y="252" font-size="13">menu listing</text>
      <line x1="444" y1="280" x2="676" y2="280" stroke="var(--line,#E8E2D6)"/>
      <text class="text-rust" x="444" y="312" font-size="13" font-style="italic">Selling silver at $0.75 on the $1.</text>
    </g>
    <text class="text-soft" x="400" y="430" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1500ms">Same plate. Two different businesses.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="180" text-anchor="middle">Plate cost</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="260" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44" font-style="italic" fill="var(--ink,#14161A)">Audit, not gut.</text>
    <text data-anim="fade" style="--delay:780ms" class="text-stone" x="400" y="320" text-anchor="middle" font-size="14">Defensible invoice by invoice. Costable dish by dish.</text>
    <line data-anim="grow-x" style="--delay:980ms; transform-origin:center" x1="340" y1="350" x2="460" y2="350" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
