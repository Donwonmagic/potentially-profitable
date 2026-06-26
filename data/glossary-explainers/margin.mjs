// Glossary explainer — MARGIN
//
// What margin actually is — the share of the PRICE you keep after cost —
// and why it is not markup. Walks one worked example (a $12 cocktail that
// costs $3) through the margin-vs-markup mix-up, shows the money the
// confusion costs, lands the price = cost / (1 - margin) rule, and closes
// on "price to the margin." All figures are one illustrative worked
// example plus standard arithmetic — not measured operator data.

export default {
  term_slug: 'margin',
  term_head: 'Margin, in 90 seconds.',
  subhead:   'What you keep after cost — and why it is not markup.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'keep',  caption: 'El margen es la parte del PRECIO que te quedas después del costo. Vendes un cóctel de doce dólares que te cuesta tres en licor, y te quedas con nueve — un margen del setenta y cinco por ciento. El margen siempre es una tajada del precio.' },
    { id: 'mixup', caption: 'Aquí es donde todos tropiezan. Ese mismo trago es un MARKUP del trescientos por ciento — multiplicaste el costo de tres por cuatro. El markup se mide contra el costo; el margen, contra el precio. El mismo trago: "trescientos por ciento" o "setenta y cinco por ciento", solo dos denominadores distintos.' },
    { id: 'cost',  caption: 'La confusión cuesta dinero. "Quiero un margen del treinta por ciento, así que le pongo un markup del treinta por ciento" en realidad te deja en un margen del veintitrés por ciento. Para llegar de verdad a un margen del treinta por ciento, le pones un markup de cerca del cuarenta y tres por ciento. Si los confundes, cobras de menos en cada plato.' },
    { id: 'rule',  caption: 'La forma limpia: el precio es igual al costo dividido entre uno menos el margen que quieres. Un costo de tres dólares con un margen objetivo del setenta por ciento es tres entre cero punto treinta — diez dólares. No es tres por uno punto setenta.' },
    { id: 'land',  caption: 'El markup es cuánto le agregaste. El margen es cuánto te quedas. Siempre pon el precio según el margen — lo que te quedas es el único número que paga la renta.' },
  ],
  scenes: [
    { id: 'keep',  ms: 14000, caption: 'Margin is the share of the price you keep after cost. Sell a twelve-dollar cocktail that costs you three in liquor and you keep nine — a seventy-five percent margin. Margin is always a slice of the price.' },
    { id: 'mixup', ms: 16000, caption: 'Here is where everyone trips. That same drink is a three-hundred percent markup — you multiplied the three-dollar cost by four. Markup is measured against cost; margin against price. Same drink: three hundred percent or seventy-five percent, just two different denominators.' },
    { id: 'cost',  ms: 15000, caption: 'The mix-up costs money. "I want a thirty percent margin, so I will mark it up thirty percent" actually leaves you at a twenty-three percent margin. To truly hit a thirty percent margin you mark up about forty-three percent. Confuse them and you under-price every plate.' },
    { id: 'rule',  ms: 15000, caption: 'The clean way: price equals cost divided by one minus the margin you want. A three-dollar cost at a seventy percent target margin is three divided by zero-point-three — ten dollars. Not three times one-point-seven.' },
    { id: 'land',  ms: 14000, caption: 'Markup is how much you added. Margin is how much you keep. Always price to the margin — the keep is the only number that pays rent.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant margin, how it differs from markup, and pricing to a target margin">
  <defs>
    <linearGradient id="mg-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#mg-bg)"/>

  <!-- ============ KEEP: margin is a slice of price ============ -->
  <g class="explainer-scene" data-scene-id="keep">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">A slice of the price</text>
    <!-- the $12 price bar, split cost + keep -->
    <g data-anim="rise" style="--delay:140ms">
      <text class="text-stone" x="80" y="150" font-size="11" letter-spacing="0.1em">$12 MENU PRICE</text>
    </g>
    <!-- cost slice: $3 of $12 = 1/4 of 600px = 150px -->
    <g data-anim="grow-x" style="--delay:300ms">
      <rect x="80" y="166" width="150" height="64" rx="4" fill="var(--rust,#B8541A)"/>
      <text class="text-stone" x="155" y="204" text-anchor="middle" font-size="13" fill="var(--cream,#FAF7F2)">cost $3</text>
    </g>
    <!-- keep slice: $9 of $12 = 3/4 of 600px = 450px -->
    <g data-anim="grow-x" style="--delay:620ms">
      <rect x="230" y="166" width="450" height="64" rx="4" fill="var(--teal,#1F4E5B)"/>
      <text class="text-stone" x="455" y="204" text-anchor="middle" font-size="14" fill="var(--cream,#FAF7F2)">you keep $9</text>
    </g>
    <g data-anim="rise" style="--delay:1000ms">
      <text class="text-teal" x="400" y="320" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="72">75%</text>
      <text class="text-stone" x="400" y="356" text-anchor="middle" font-size="14">margin = keep $9 ÷ price $12</text>
    </g>
    <text class="text-stone" x="400" y="420" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1500ms">Margin is always measured against the price.</text>
  </g>

  <!-- ============ MIXUP: same drink, two denominators ============ -->
  <g class="explainer-scene" data-scene-id="mixup">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Same drink, two denominators</text>
    <!-- LEFT: margin against price -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="70" y="110" width="300" height="250" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="94" y="150" font-size="11" letter-spacing="0.1em">MARGIN · AGAINST PRICE</text>
      <text class="text-stone" x="94" y="186" font-size="13">$9 keep ÷ $12 price</text>
      <text class="text-teal" x="220" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="56">75%</text>
      <line x1="94" y1="296" x2="346" y2="296" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="94" y="328" font-size="13">denominator: the price</text>
    </g>
    <!-- RIGHT: markup against cost -->
    <g data-anim="rise" style="--delay:520ms">
      <rect x="430" y="110" width="300" height="250" rx="14" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="454" y="150" font-size="11" letter-spacing="0.1em">MARKUP · AGAINST COST</text>
      <text class="text-stone" x="454" y="186" font-size="13">$9 added ÷ $3 cost</text>
      <text class="text-rust" x="580" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="56">300%</text>
      <line x1="454" y1="296" x2="706" y2="296" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="454" y="328" font-size="13">denominator: the cost</text>
    </g>
    <text class="text-soft" x="400" y="430" text-anchor="middle" font-size="15" font-style="italic" data-anim="fade" style="--delay:1100ms">Same drink. Two different numbers — because the bottom changed.</text>
  </g>

  <!-- ============ COST: the confusion under-prices ============ -->
  <g class="explainer-scene" data-scene-id="cost">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Mark up 30% and you miss</text>
    <!-- wrong path: mark up 30% -> 23% margin -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="80" y="148" font-size="11" letter-spacing="0.1em">"MARK IT UP 30%"</text>
      <rect x="80" y="162" height="56" rx="4" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:380ms" width="276"/>
      <text x="336" y="198" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">+30%</text>
    </g>
    <g data-anim="fade" style="--delay:800ms">
      <text class="text-stone" x="400" y="198" text-anchor="middle" font-size="28">→</text>
      <text class="text-rust" x="560" y="190" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">23%</text>
      <text class="text-stone" x="560" y="214" text-anchor="middle" font-size="12">margin you actually get</text>
    </g>
    <!-- right path: 43% markup needed for a true 30% margin -->
    <g data-anim="rise" style="--delay:1100ms">
      <text class="text-stone" x="80" y="298" font-size="11" letter-spacing="0.1em">FOR A REAL 30% MARGIN</text>
      <rect x="80" y="312" height="56" rx="4" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:1300ms" width="396"/>
      <text x="456" y="348" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">+43%</text>
    </g>
    <g data-anim="fade" style="--delay:1700ms">
      <text class="text-stone" x="560" y="348" text-anchor="middle" font-size="14">the markup it really takes</text>
    </g>
    <text class="text-rust" x="400" y="446" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:2000ms">Confuse the two and you under-price every plate.</text>
  </g>

  <!-- ============ RULE: price = cost / (1 - margin) ============ -->
  <g class="explainer-scene" data-scene-id="rule">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The one formula</text>
    <g data-anim="rise" style="--delay:160ms">
      <text x="400" y="170" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34" fill="var(--ink,#14161A)">
        price = cost ÷ (1 − margin)
      </text>
    </g>
    <!-- worked: $3 / 0.30 = $10 -->
    <g data-anim="rise" style="--delay:600ms">
      <text x="400" y="270" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44" fill="var(--ink,#14161A)">
        $3 ÷ 0.30 = <tspan fill="var(--teal,#1F4E5B)">$10</tspan>
      </text>
      <text x="400" y="306" text-anchor="middle" font-size="13" class="text-stone">$3 cost · 70% target margin · 1 − 0.70 = 0.30</text>
    </g>
    <!-- the trap, struck through -->
    <g data-anim="fade" style="--delay:1200ms">
      <text class="text-rust" x="400" y="372" text-anchor="middle" font-size="20" text-decoration="line-through">not $3 × 1.70</text>
    </g>
    <text class="text-soft" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1600ms">Divide by what you keep — never multiply the cost.</text>
  </g>

  <!-- ============ LAND: the punchline ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="160" text-anchor="middle">Markup adds. Margin keeps.</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="252" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="42" font-style="italic" fill="var(--ink,#14161A)">Price to the margin.</text>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="312" text-anchor="middle" font-size="15">The keep is the only number that pays rent.</text>
    <line data-anim="grow-x" style="--delay:1020ms; transform-origin:center" x1="340" y1="342" x2="460" y2="342" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
