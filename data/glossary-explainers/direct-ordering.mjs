// Glossary explainer — DIRECT ORDERING
//
// What direct ordering is — the guest ordering through a channel the operator
// owns (their site, POS link, or app) instead of a marketplace — and why it
// matters twice over: the money that stays in the house when you skip the
// marketplace cut, and the customer you keep instead of renting. All figures
// are an illustrative worked example — a 15-30% marketplace band, one $40
// order, a ~$10 gap — not measured operator data.

export default {
  term_slug: 'direct-ordering',
  term_head: 'Direct ordering, in 90 seconds.',
  subhead:   'Taking the order yourself instead of renting the customer.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'what',  caption: 'Pedido directo es el comensal ordenando por un canal que es tuyo — tu sitio, tu enlace de punto de venta, tu app — en lugar de un marketplace. La misma comida, quizá hasta la misma entrega, pero el pedido, y el cliente, llegan a ti.' },
    { id: 'money', caption: 'Un marketplace se queda del 15 a 30 por ciento de cada pedido. El pedido directo te cuesta el procesamiento de pago — un pequeño porcentaje — y nada más. En un pedido de $40, esa brecha son unos diez dólares que se quedan en la casa.' },
    { id: 'prize', caption: 'El dinero es la victoria pequeña. La grande: te quedas con el cliente. Su nombre, su correo, su próximo pedido — tuyos para hacerlo volver, en lugar de ser del agregador para revendérselo al lugar de la esquina.' },
    { id: 'move',  caption: 'No tienes que soltar los marketplaces. Úsalos para que te descubran, y luego convierte: una tarjeta en cada bolsa, un mejor precio en tu propia página, una razón para saltarse la app la próxima vez.' },
    { id: 'land',  caption: 'El marketplace te renta un pedido. El pedido directo se queda con el cliente. Que te encuentren allá; que vuelvan acá.' },
  ],
  scenes: [
    { id: 'what',  ms: 14000, caption: 'Direct ordering is the guest ordering through a channel you own — your site, your POS link, your app — instead of a marketplace. The same food, maybe even the same delivery, but the order, and the customer, come to you.' },
    { id: 'money', ms: 15000, caption: 'A marketplace takes 15 to 30 percent of every order. Direct ordering costs you payment processing — a few percent — and that is it. On a $40 order, that gap is roughly ten dollars that stays in the house.' },
    { id: 'prize', ms: 16000, caption: 'The money is the small win. The big one: you get the customer. Their name, their email, their reorder — yours to bring back, instead of the aggregator’s to re-market to the place down the street.' },
    { id: 'move',  ms: 15000, caption: 'You do not have to drop the marketplaces. Use them to get found, then convert: a card in every bag, a better price on your own page, a reason to skip the app next time.' },
    { id: 'land',  ms: 14000, caption: 'The marketplace rents you an order. Direct ordering keeps the customer. Get found there; get them back here.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of direct ordering — taking the order through a channel you own instead of a delivery marketplace">
  <defs>
    <linearGradient id="do-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#do-bg)"/>

  <!-- ============ WHAT — two paths to the same kitchen ============ -->
  <g class="explainer-scene" data-scene-id="what">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Two paths to the kitchen</text>
    <!-- the kitchen, center -->
    <g data-anim="fade" style="--delay:120ms">
      <circle cx="400" cy="262" r="58" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="400" y="256" text-anchor="middle" font-size="13" letter-spacing="0.08em">YOUR</text>
      <text class="text-soft" x="400" y="278" text-anchor="middle" font-size="13" letter-spacing="0.08em">KITCHEN</text>
    </g>
    <!-- marketplace path (rust, left) -->
    <g data-anim="rise" style="--delay:300ms">
      <rect x="70" y="216" width="180" height="92" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="160" y="252" text-anchor="middle" font-size="12" letter-spacing="0.1em">MARKETPLACE</text>
      <text class="text-stone" x="160" y="280" text-anchor="middle" font-size="13">someone else’s app</text>
    </g>
    <line x1="250" y1="262" x2="338" y2="262" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="5 4" data-anim="grow-x" style="--delay:560ms"/>
    <!-- your own channel path (teal, right) -->
    <g data-anim="rise" style="--delay:820ms">
      <rect x="550" y="216" width="180" height="92" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="640" y="252" text-anchor="middle" font-size="12" letter-spacing="0.1em">YOUR CHANNEL</text>
      <text class="text-stone" x="640" y="280" text-anchor="middle" font-size="13">site · POS · app</text>
    </g>
    <line x1="550" y1="262" x2="462" y2="262" stroke="var(--teal,#1F4E5B)" stroke-width="2" data-anim="grow-x" style="--delay:1080ms"/>
    <text class="text-stone" x="400" y="404" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1400ms">Same food. The order, and the customer, come to you.</text>
  </g>

  <!-- ============ MONEY — 15-30% to marketplace vs few % direct, ~$10 stays ============ -->
  <g class="explainer-scene" data-scene-id="money">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">What it costs on a $40 order</text>
    <!-- marketplace bar: 15-30% cut -->
    <g data-anim="rise" style="--delay:140ms">
      <text class="text-stone" x="80" y="146" font-size="11" letter-spacing="0.1em">MARKETPLACE TAKES · 15–30%</text>
      <rect x="80" y="160" height="56" rx="4" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:320ms" width="528"/>
      <text x="588" y="194" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">15–30%</text>
    </g>
    <!-- direct bar: a few % processing -->
    <g data-anim="rise" style="--delay:820ms">
      <text class="text-stone" x="80" y="266" font-size="11" letter-spacing="0.1em">DIRECT COSTS · PROCESSING</text>
      <rect x="80" y="280" height="56" rx="4" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:1000ms" width="70"/>
      <text class="text-soft" x="166" y="314" font-family="Fraunces, Georgia, serif" font-size="20">a few %</text>
    </g>
    <!-- the gap that stays in the house -->
    <g data-anim="rise" style="--delay:1600ms">
      <rect x="600" y="252" width="160" height="112" rx="12" fill="rgba(31,78,91,0.10)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-stone" x="680" y="288" text-anchor="middle" font-size="12">stays in the house</text>
      <text class="text-teal" x="680" y="332" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">≈ $10</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:2000ms">The cut you skip is money you keep.</text>
  </g>

  <!-- ============ PRIZE — the customer goes to YOU, not the aggregator + a rival ============ -->
  <g class="explainer-scene" data-scene-id="prize">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Who gets the customer</text>
    <!-- the customer record -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="320" y="96" width="160" height="84" rx="10" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="400" y="128" text-anchor="middle" font-size="13">name · email</text>
      <text class="text-soft" x="400" y="152" text-anchor="middle" font-size="13">the reorder</text>
    </g>
    <!-- DIRECT: arrow down to YOU (teal) -->
    <g data-anim="rise" style="--delay:560ms">
      <line x1="300" y1="180" x2="200" y2="300" stroke="var(--teal,#1F4E5B)" stroke-width="2" data-anim="grow-x" style="--delay:560ms"/>
      <rect x="100" y="300" width="200" height="84" rx="12" fill="rgba(31,78,91,0.10)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="200" y="334" text-anchor="middle" font-size="12" letter-spacing="0.1em">DIRECT → YOU</text>
      <text class="text-stone" x="200" y="360" text-anchor="middle" font-size="13">yours to bring back</text>
    </g>
    <!-- MARKETPLACE: arrow to aggregator then a rival (rust) -->
    <g data-anim="rise" style="--delay:1100ms">
      <line x1="500" y1="180" x2="560" y2="300" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="5 4" data-anim="grow-x" style="--delay:1100ms"/>
      <rect x="500" y="300" width="130" height="84" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="565" y="338" text-anchor="middle" font-size="11" letter-spacing="0.08em">AGGREGATOR</text>
      <text class="text-stone" x="565" y="362" text-anchor="middle" font-size="12">keeps the list</text>
    </g>
    <g data-anim="fade" style="--delay:1600ms">
      <line x1="630" y1="342" x2="678" y2="342" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="4 3"/>
      <rect x="678" y="312" width="92" height="60" rx="10" fill="rgba(184,84,26,0.10)" stroke="var(--rust,#B8541A)" stroke-dasharray="4 3"/>
      <text class="text-rust" x="724" y="340" text-anchor="middle" font-size="12">the place</text>
      <text class="text-rust" x="724" y="356" text-anchor="middle" font-size="12">down the street</text>
    </g>
    <text class="text-stone" x="400" y="450" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:2000ms">The money is the small win. The customer is the big one.</text>
  </g>

  <!-- ============ MOVE — get found on the marketplace, then convert to direct ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Get found there, convert here</text>
    <!-- marketplace for discovery -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="60" y="190" width="220" height="120" rx="14" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="170" y="232" text-anchor="middle" font-size="12" letter-spacing="0.1em">MARKETPLACE</text>
      <text class="text-soft" x="170" y="268" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="26">get found</text>
      <text class="text-stone" x="170" y="292" text-anchor="middle" font-size="12">a new guest discovers you</text>
    </g>
    <!-- the convert arrow -->
    <g data-anim="grow-x" style="--delay:760ms">
      <line x1="288" y1="250" x2="510" y2="250" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M504 243 L520 250 L504 257 Z" fill="var(--teal,#1F4E5B)"/>
    </g>
    <text class="text-teal" x="400" y="238" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:1000ms">convert</text>
    <!-- order direct -->
    <g data-anim="rise" style="--delay:1200ms">
      <rect x="520" y="190" width="220" height="120" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="630" y="232" text-anchor="middle" font-size="12" letter-spacing="0.1em">YOUR CHANNEL</text>
      <text class="text-soft" x="630" y="268" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="26">order direct</text>
      <text class="text-stone" x="630" y="292" text-anchor="middle" font-size="12">card in the bag · better price</text>
    </g>
    <text class="text-stone" x="400" y="404" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">You do not have to drop the marketplaces — just give a reason to skip the app next time.</text>
  </g>

  <!-- ============ LAND — the punchline ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="160" text-anchor="middle">Direct ordering</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="244" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">The marketplace rents an order.</text>
    <text data-anim="rise" style="--delay:560ms" x="400" y="296" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">Direct ordering keeps the customer.</text>
    <text data-anim="fade" style="--delay:980ms" class="text-stone" x="400" y="356" text-anchor="middle" font-size="14">Get found there; get them back here.</text>
    <line data-anim="grow-x" style="--delay:1180ms; transform-origin:center" x1="340" y1="386" x2="460" y2="386" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
