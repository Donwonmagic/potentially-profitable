// Glossary explainer — PRICE ELASTICITY
//
// How much your orders actually move when your price moves — and the
// misconception that costs operators money: treating every item as
// elastic and chasing order count instead of total dollars kept.
// Walks one worked example: 100 burgers at $14 = $1,400 versus 95 at
// $15 = $1,425 — five fewer orders, twenty-five more dollars. All
// figures are an illustrative worked example, not measured operator data.

export default {
  term_slug: 'elasticity',
  term_head: 'Price elasticity, in 90 seconds.',
  subhead:   'Whether a price bump actually loses you orders.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'define', caption: 'Elasticidad es cuánto se mueven tus pedidos cuando se mueve tu precio. Subes un plato un dólar y vendes bastante menos — eso es elástico. Lo subes un dólar y vendes más o menos lo mismo — eso es inelástico. Casi todos los dueños suponen que cada plato es elástico. La mayoría no lo es.' },
    { id: 'test',   caption: 'La prueba honesta no es "¿perdí pedidos?" — es "¿me quedé con más dólares en total?". Vende cien hamburguesas a catorce dólares y eso son mil cuatrocientos. Súbelas a quince, vende noventa y cinco, y eso son mil cuatrocientos veinticinco. Perdiste cinco pedidos y ganaste más dinero.' },
    { id: 'where',  caption: 'La elasticidad no es pareja. Tu plato estrella y el de siempre de tus clientes habituales son inelásticos — sube esos. El producto que la gente compara de precio, una guarnición o un refresco, es elástico — déjalo. Sube el equivocado y caen los cubiertos.' },
    { id: 'move',   caption: 'Así que no subas todo el menú un porcentaje plano. Sube los platos inelásticos, mantén los elásticos, y mira los dólares totales por semana — no la cantidad de pedidos.' },
    { id: 'land',   caption: 'La pregunta nunca es "¿perderé un pedido?". Es "¿me quedaré con más dinero?". Ponle precio al plato, no al miedo.' },
  ],
  scenes: [
    { id: 'define', ms: 14000, caption: 'Elasticity is how much your orders move when your price moves. Raise a dish a dollar and sell noticeably fewer — that is elastic. Raise it a dollar and sell about the same — that is inelastic. Most operators assume every item is elastic. Most items are not.' },
    { id: 'test',   ms: 16000, caption: 'The honest test is not "did I lose orders" — it is "did I keep more total dollars." Sell a hundred burgers at fourteen dollars and that is fourteen hundred. Raise to fifteen, sell ninety-five, and that is fourteen twenty-five. You lost five orders and made more money.' },
    { id: 'where',  ms: 15000, caption: 'Elasticity is not uniform. Your signature dish and your regulars’ usual are inelastic — raise those. The price-shopped commodity, a side or a soda, is elastic — leave it. Raise the wrong one and covers drop.' },
    { id: 'move',   ms: 15000, caption: 'So do not raise the whole menu by a flat percent. Raise the inelastic items, hold the elastic ones, and watch total dollars per week — not order count.' },
    { id: 'land',   ms: 14000, caption: 'The question is never "will I lose an order." It is "will I keep more money." Price the dish, not the fear.' },
  ],
  svg: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant price elasticity and keeping total dollars">
  <defs>
    <linearGradient id="el-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#el-bg)"/>

  <!-- ============ DEFINE ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Elastic vs inelastic</text>
    <!-- elastic dish: steep curve — orders fall hard when price rises -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-rust" x="220" y="120" text-anchor="middle" font-size="12" letter-spacing="0.1em">ELASTIC DISH</text>
      <line x1="100" y1="380" x2="100" y2="150" stroke="var(--line-dark,#D4CCBC)"/>
      <line x1="100" y1="380" x2="340" y2="380" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="90" y="150" text-anchor="end" font-size="10">orders</text>
      <text class="text-stone" x="340" y="398" text-anchor="end" font-size="10">price</text>
      <path d="M110 170 L330 360" stroke="var(--rust,#B8541A)" stroke-width="3" fill="none" data-anim="grow-x" style="--delay:400ms"/>
      <text class="text-rust" x="220" y="340" text-anchor="middle" font-size="13" font-style="italic">+$1 → sell far fewer</text>
    </g>
    <!-- inelastic dish: flat curve — orders barely move when price rises -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-teal" x="580" y="120" text-anchor="middle" font-size="12" letter-spacing="0.1em">INELASTIC DISH</text>
      <line x1="460" y1="380" x2="460" y2="150" stroke="var(--line-dark,#D4CCBC)"/>
      <line x1="460" y1="380" x2="700" y2="380" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="450" y="150" text-anchor="end" font-size="10">orders</text>
      <text class="text-stone" x="700" y="398" text-anchor="end" font-size="10">price</text>
      <path d="M470 190 L690 215" stroke="var(--teal,#1F4E5B)" stroke-width="3" fill="none" data-anim="grow-x" style="--delay:1100ms"/>
      <text class="text-teal" x="580" y="340" text-anchor="middle" font-size="13" font-style="italic">+$1 → sell about the same</text>
    </g>
    <text class="text-stone" x="400" y="450" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">Most operators assume every item is elastic. Most are not.</text>
  </g>

  <!-- ============ THE TEST ============ -->
  <g class="explainer-scene" data-scene-id="test">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The honest test · total dollars</text>
    <!-- before: 100 x $14 = $1,400 -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="80" y="120" width="280" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="104" y="160" font-size="11" letter-spacing="0.1em">BEFORE</text>
      <text class="text-soft" x="104" y="200" font-size="15">100 burgers × $14</text>
      <line x1="104" y1="224" x2="336" y2="224" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="104" y="262" font-size="12">total dollars</text>
      <text class="text-soft" x="336" y="304" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="48">$1,400</text>
    </g>
    <!-- after: 95 x $15 = $1,425 -->
    <g data-anim="rise" style="--delay:700ms">
      <rect x="440" y="120" width="280" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="464" y="160" font-size="11" letter-spacing="0.1em">AFTER · +$1</text>
      <text class="text-soft" x="464" y="200" font-size="15">95 burgers × $15</text>
      <line x1="464" y1="224" x2="696" y2="224" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="464" y="262" font-size="12">total dollars</text>
      <text class="text-teal" x="696" y="304" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="48">$1,425</text>
    </g>
    <text class="text-stone" x="400" y="290" text-anchor="middle" font-size="34" data-anim="fade" style="--delay:1200ms">→</text>
    <g data-anim="fade" style="--delay:1500ms">
      <text class="text-teal" x="400" y="424" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="28">+$25</text>
      <text class="text-rust" x="400" y="450" text-anchor="middle" font-size="13" font-style="italic">−5 orders · more money</text>
    </g>
  </g>

  <!-- ============ WHERE IT LIVES ============ -->
  <g class="explainer-scene" data-scene-id="where">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">It is not uniform</text>
    <!-- inelastic side: raise (teal) -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="80" y="110" width="300" height="280" rx="14" fill="rgba(31,78,91,0.07)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="104" y="148" font-size="11" letter-spacing="0.1em">INELASTIC · RAISE</text>
      <rect x="104" y="172" width="252" height="56" rx="8" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="124" y="206" font-size="14">the signature dish</text>
      <rect x="104" y="244" width="252" height="56" rx="8" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="124" y="278" font-size="14">a regular’s usual</text>
      <text class="text-teal" x="230" y="356" text-anchor="middle" font-size="14" font-style="italic">orders hold</text>
    </g>
    <!-- elastic side: hold (rust) -->
    <g data-anim="rise" style="--delay:700ms">
      <rect x="420" y="110" width="300" height="280" rx="14" fill="rgba(184,84,26,0.07)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="444" y="148" font-size="11" letter-spacing="0.1em">ELASTIC · HOLD</text>
      <rect x="444" y="172" width="252" height="56" rx="8" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="464" y="206" font-size="14">a side</text>
      <rect x="444" y="244" width="252" height="56" rx="8" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="464" y="278" font-size="14">a soda</text>
      <text class="text-rust" x="570" y="356" text-anchor="middle" font-size="14" font-style="italic">covers drop</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1400ms">Raise the wrong one and covers drop.</text>
  </g>

  <!-- ============ THE MOVE ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The move</text>
    <!-- bad: flat % across the whole menu -->
    <g data-anim="rise" style="--delay:140ms">
      <text class="text-rust" x="80" y="124" font-size="11" letter-spacing="0.1em">FLAT % BUMP · BAD</text>
      <rect x="80" y="140" width="120" height="44" rx="6" fill="rgba(184,84,26,0.14)" stroke="var(--rust,#B8541A)"/>
      <rect x="210" y="140" width="120" height="44" rx="6" fill="rgba(184,84,26,0.14)" stroke="var(--rust,#B8541A)"/>
      <rect x="340" y="140" width="120" height="44" rx="6" fill="rgba(184,84,26,0.14)" stroke="var(--rust,#B8541A)"/>
      <rect x="470" y="140" width="120" height="44" rx="6" fill="rgba(184,84,26,0.14)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="335" y="210" text-anchor="middle" font-size="13" font-style="italic">every item up the same — the elastic ones bleed</text>
    </g>
    <!-- good: targeted — raise inelastic, hold elastic -->
    <g data-anim="rise" style="--delay:800ms">
      <text class="text-teal" x="80" y="278" font-size="11" letter-spacing="0.1em">TARGETED RAISE · GOOD</text>
      <rect x="80" y="294" width="120" height="44" rx="6" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:1000ms"/>
      <text class="text-stone" x="140" y="322" text-anchor="middle" font-size="11" fill="var(--cream,#FAF7F2)">raise</text>
      <rect x="210" y="294" width="120" height="44" rx="6" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="270" y="322" text-anchor="middle" font-size="11">hold</text>
      <rect x="340" y="294" width="120" height="44" rx="6" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:1100ms"/>
      <text class="text-stone" x="400" y="322" text-anchor="middle" font-size="11" fill="var(--cream,#FAF7F2)">raise</text>
      <rect x="470" y="294" width="120" height="44" rx="6" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="530" y="322" text-anchor="middle" font-size="11">hold</text>
    </g>
    <text class="text-soft" x="400" y="426" text-anchor="middle" font-size="15" font-style="italic" data-anim="fade" style="--delay:1500ms">Watch total dollars per week — not order count.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="170" text-anchor="middle">Price elasticity</text>
    <g data-anim="rise" style="--delay:380ms">
      <text x="400" y="248" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">Price the dish,</text>
      <text x="400" y="300" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">not the fear.</text>
    </g>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="360" text-anchor="middle" font-size="14">Never "will I lose an order." Always "will I keep more money."</text>
    <line data-anim="grow-x" style="--delay:1020ms; transform-origin:center" x1="340" y1="392" x2="460" y2="392" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
