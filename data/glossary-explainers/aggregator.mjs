// Glossary explainer — AGGREGATOR (delivery marketplace app)
//
// What an aggregator actually is — a marketplace app (DoorDash, Uber Eats,
// Grubhub) that lists many restaurants, takes the order, and dispatches a
// driver — and the real trade underneath it: discovery for a commission,
// with the aggregator owning the customer. Pairs with the COMMISSION
// explainer (which covers the money on one order); this one is about who
// owns the guest. The only figure used is the standard, widely-cited
// commission band, framed qualitatively as "often 15 to 30 percent."

export default {
  term_slug: 'aggregator',
  term_head: 'Aggregator, in 90 seconds.',
  subhead:   'Who actually owns the customer when the order comes through an app.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'what',  caption: 'Un agregador es una app de marketplace — DoorDash, Uber Eats, Grubhub — que lista muchos restaurantes, toma el pedido y manda un repartidor. En su pantalla, tú eres una baldosa más en una cuadrícula llena de competidores.' },
    { id: 'trade', caption: 'Te traen un alcance que no podrías comprar por tu cuenta — millones de usuarios de la app buscando qué cenar — a cambio de una tajada de cada pedido, a menudo del 15 a 30 por ciento. Ese es el trato sobre la mesa: que te descubran, a cambio de una comisión.' },
    { id: 'catch', caption: 'La trampa no es solo la tarifa. El agregador es dueño del cliente. Ellos guardan el nombre, el correo, el historial de pedidos; tú recibes un ticket impreso. Así que mañana le pueden vender a ese mismo comensal una oferta del restaurante de la otra cuadra.' },
    { id: 'move',  caption: 'Entonces usa los agregadores para lo único que hacen bien — que te encuentre alguien que aún no te conocía. Y luego dale a ese comensal una razón para venir directo la próxima vez: una tarjeta en la bolsa, una mejor oferta en tu propia página de pedidos.' },
    { id: 'land',  caption: 'Un agregador te alquila un cliente por pedido. Tu propio canal te deja quedarte con uno. Usa el alquiler para llenar los asientos que sí son tuyos.' },
  ],
  scenes: [
    { id: 'what',  ms: 14000, caption: 'An aggregator is a marketplace app — DoorDash, Uber Eats, Grubhub — that lists many restaurants, takes the order, and dispatches a driver. On their screen, you are one tile in a grid of competitors.' },
    { id: 'trade', ms: 15000, caption: 'They bring reach you could not buy on your own — millions of app users browsing for dinner — in exchange for a cut of every order, often 15 to 30 percent. That is the deal on the table: discovery for a commission.' },
    { id: 'catch', ms: 16000, caption: 'The catch is not just the fee. The aggregator owns the customer. They hold the name, the email, the order history; you get a printed ticket. So tomorrow they can market that same guest a deal at the restaurant down the street.' },
    { id: 'move',  ms: 15000, caption: 'So use aggregators for the one thing they do well — getting found by someone who did not already know you. Then give that guest a reason to come direct next time: a card in the bag, a better deal on your own ordering page.' },
    { id: 'land',  ms: 14000, caption: 'An aggregator rents you a customer by the order. Your own channel lets you keep one. Use the rental to fill the seats you own.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of how a delivery aggregator app works and who owns the customer">
  <defs>
    <linearGradient id="ag-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#ag-bg)"/>

  <!-- ============ WHAT — a grid of restaurant tiles, one highlighted, a driver ============ -->
  <g class="explainer-scene" data-scene-id="what">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">One tile in the grid</text>
    <!-- phone frame holding the marketplace grid -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="80" y="86" width="380" height="360" rx="22" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="270" y="122" text-anchor="middle" font-size="11" letter-spacing="0.12em">THE APP · NEAR YOU</text>
      <line x1="108" y1="138" x2="432" y2="138" stroke="var(--line,#E8E2D6)"/>
    </g>
    <!-- six restaurant tiles; row 1 middle is highlighted ("you") -->
    <g data-anim="rise" style="--delay:520ms">
      <rect x="112" y="160" width="96" height="110" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <rect x="222" y="160" width="96" height="110" rx="8" fill="var(--teal,#1F4E5B)" stroke="var(--teal,#1F4E5B)"/>
      <text x="270" y="210" text-anchor="middle" font-size="11" letter-spacing="0.08em" fill="var(--cream,#FAF7F2)">YOU</text>
      <text x="270" y="232" text-anchor="middle" font-size="10" fill="var(--cream,#FAF7F2)">one of many</text>
      <rect x="332" y="160" width="96" height="110" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <rect x="112" y="290" width="96" height="110" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <rect x="222" y="290" width="96" height="110" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <rect x="332" y="290" width="96" height="110" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="160" y="220" text-anchor="middle" font-size="11">a rival</text>
      <text class="text-stone" x="380" y="220" text-anchor="middle" font-size="11">a rival</text>
      <text class="text-stone" x="160" y="350" text-anchor="middle" font-size="11">a rival</text>
      <text class="text-stone" x="270" y="350" text-anchor="middle" font-size="11">a rival</text>
      <text class="text-stone" x="380" y="350" text-anchor="middle" font-size="11">a rival</text>
    </g>
    <!-- the aggregator takes the order, sends a driver -->
    <g data-anim="rise" style="--delay:1000ms">
      <rect x="520" y="170" width="200" height="80" rx="10" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="540" y="200" font-size="11" letter-spacing="0.1em">TAKES THE ORDER</text>
      <text class="text-soft" x="540" y="228" font-size="14">lists everyone, routes it</text>
      <!-- simple driver / scooter icon -->
      <g data-anim="rise" style="--delay:1300ms">
        <circle cx="560" cy="330" r="18" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="3"/>
        <circle cx="660" cy="330" r="18" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="3"/>
        <path d="M560 330 L600 330 L620 300 L648 300" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
        <rect x="592" y="288" width="34" height="26" rx="4" fill="var(--rust,#B8541A)"/>
        <text class="text-stone" x="610" y="372" text-anchor="middle" font-size="12">dispatches a driver</text>
      </g>
    </g>
    <text class="text-stone" x="610" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">A marketplace, not a menu.</text>
  </g>

  <!-- ============ TRADE — reach -> arrow -> a 15-30% slice off an order ============ -->
  <g class="explainer-scene" data-scene-id="trade">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Discovery for a commission</text>
    <!-- the reach they bring: a big audience -->
    <g data-anim="rise" style="--delay:140ms">
      <text class="text-stone" x="80" y="138" font-size="11" letter-spacing="0.1em">WHAT THEY BRING</text>
      <rect x="80" y="156" width="260" height="200" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <!-- a crowd of dots = millions of app users -->
      <g fill="var(--teal,#1F4E5B)">
        <circle cx="120" cy="200" r="7"/><circle cx="150" cy="200" r="7"/><circle cx="180" cy="200" r="7"/><circle cx="210" cy="200" r="7"/><circle cx="240" cy="200" r="7"/><circle cx="270" cy="200" r="7"/><circle cx="300" cy="200" r="7"/>
        <circle cx="120" cy="230" r="7"/><circle cx="150" cy="230" r="7"/><circle cx="180" cy="230" r="7"/><circle cx="210" cy="230" r="7"/><circle cx="240" cy="230" r="7"/><circle cx="270" cy="230" r="7"/><circle cx="300" cy="230" r="7"/>
        <circle cx="120" cy="260" r="7"/><circle cx="150" cy="260" r="7"/><circle cx="180" cy="260" r="7"/><circle cx="210" cy="260" r="7"/><circle cx="240" cy="260" r="7"/><circle cx="270" cy="260" r="7"/><circle cx="300" cy="260" r="7"/>
      </g>
      <text class="text-teal" x="210" y="312" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">reach</text>
      <text class="text-stone" x="210" y="336" text-anchor="middle" font-size="12">app users browsing for dinner</text>
    </g>
    <!-- arrow: the trade -->
    <g data-anim="fade" style="--delay:900ms">
      <line x1="356" y1="256" x2="452" y2="256" stroke="var(--line-dark,#D4CCBC)" stroke-width="2"/>
      <path d="M452 256 L440 248 L440 264 Z" fill="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="404" y="240" text-anchor="middle" font-size="12" font-style="italic">in exchange for</text>
    </g>
    <!-- what they take: a 15-30% slice off one order -->
    <g data-anim="rise" style="--delay:1200ms">
      <text class="text-stone" x="468" y="138" font-size="11" letter-spacing="0.1em">WHAT THEY TAKE · EVERY ORDER</text>
      <rect x="468" y="156" width="252" height="48" rx="4" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)"/>
      <rect x="468" y="156" height="48" rx="4" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:1400ms" width="100"/>
      <text class="text-stone" x="594" y="186" text-anchor="middle" font-size="12">the order</text>
      <text class="text-rust" x="594" y="270" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="48">15–30%</text>
      <text class="text-stone" x="594" y="298" text-anchor="middle" font-size="12">a cut of every order</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1900ms">That is the deal on the table.</text>
  </g>

  <!-- ============ CATCH — customer data flows to the aggregator; bare ticket; re-marketed to a rival ============ -->
  <g class="explainer-scene" data-scene-id="catch">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Who owns the customer</text>
    <!-- the guest -->
    <g data-anim="rise" style="--delay:140ms">
      <circle cx="120" cy="170" r="26" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <circle cx="120" cy="162" r="9" fill="var(--teal,#1F4E5B)"/>
      <path d="M104 186 a16 12 0 0 1 32 0" fill="var(--teal,#1F4E5B)"/>
      <text class="text-stone" x="120" y="222" text-anchor="middle" font-size="12">the guest</text>
    </g>
    <!-- the data flows to the aggregator -->
    <g data-anim="fade" style="--delay:520ms">
      <line x1="156" y1="170" x2="300" y2="170" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M300 170 L288 162 L288 178 Z" fill="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="228" y="156" text-anchor="middle" font-size="12" font-style="italic">name · email · history</text>
    </g>
    <g data-anim="rise" style="--delay:800ms">
      <rect x="312" y="116" width="220" height="112" rx="12" fill="var(--teal,#1F4E5B)"/>
      <text x="422" y="150" text-anchor="middle" font-size="11" letter-spacing="0.1em" fill="var(--cream,#FAF7F2)">THE AGGREGATOR KEEPS</text>
      <text x="422" y="180" text-anchor="middle" font-size="14" fill="var(--cream,#FAF7F2)">the name, the email,</text>
      <text x="422" y="202" text-anchor="middle" font-size="14" fill="var(--cream,#FAF7F2)">the order history</text>
    </g>
    <!-- the restaurant gets a bare ticket -->
    <g data-anim="rise" style="--delay:1100ms">
      <line x1="120" y1="196" x2="120" y2="296" stroke="var(--line-dark,#D4CCBC)" stroke-dasharray="3 3"/>
      <path d="M120 296 L112 284 L128 284 Z" fill="var(--line-dark,#D4CCBC)"/>
      <rect x="78" y="300" width="84" height="96" rx="6" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <line x1="92" y1="324" x2="148" y2="324" stroke="var(--line,#E8E2D6)"/>
      <line x1="92" y1="342" x2="148" y2="342" stroke="var(--line,#E8E2D6)"/>
      <line x1="92" y1="360" x2="130" y2="360" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="120" y="420" text-anchor="middle" font-size="12">you get a ticket</text>
    </g>
    <!-- tomorrow: re-marketed to the rival down the street -->
    <g data-anim="fade" style="--delay:1500ms">
      <line x1="534" y1="172" x2="600" y2="172" stroke="var(--rust,#B8541A)" stroke-width="2"/>
      <path d="M600 172 L588 164 L588 180 Z" fill="var(--rust,#B8541A)"/>
      <text class="text-rust" x="567" y="156" text-anchor="middle" font-size="11" font-style="italic">tomorrow</text>
    </g>
    <g data-anim="rise" style="--delay:1700ms">
      <rect x="610" y="120" width="150" height="112" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="685" y="152" text-anchor="middle" font-size="11" letter-spacing="0.08em">A DEAL FROM</text>
      <text class="text-soft" x="685" y="180" text-anchor="middle" font-size="14">the restaurant</text>
      <text class="text-soft" x="685" y="200" text-anchor="middle" font-size="14">down the street</text>
    </g>
    <text class="text-stone" x="430" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:2100ms">They market your guest. Same guest, a rival's deal.</text>
  </g>

  <!-- ============ MOVE — aggregator for discovery -> arrow -> order direct (card in bag) ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Rent the find, keep the guest</text>
    <!-- use the aggregator for the one thing it does -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="70" y="130" width="280" height="220" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="94" y="170" font-size="11" letter-spacing="0.1em">USE THE AGGREGATOR FOR</text>
      <text class="text-soft" x="94" y="216" font-family="Fraunces, Georgia, serif" font-size="30">Getting found</text>
      <text class="text-stone" x="94" y="252" font-size="14">by someone who did not</text>
      <text class="text-stone" x="94" y="272" font-size="14">already know you.</text>
      <line x1="94" y1="296" x2="326" y2="296" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="94" y="326" font-size="13" font-style="italic">The one thing it does well.</text>
    </g>
    <!-- arrow: then move them direct -->
    <g data-anim="fade" style="--delay:900ms">
      <line x1="366" y1="240" x2="446" y2="240" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M446 240 L434 232 L434 248 Z" fill="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="406" y="224" text-anchor="middle" font-size="12" font-style="italic">next time</text>
    </g>
    <!-- come direct: card in the bag, your own page -->
    <g data-anim="rise" style="--delay:1200ms">
      <rect x="460" y="130" width="270" height="220" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="484" y="170" font-size="11" letter-spacing="0.1em">GIVE THEM A REASON TO</text>
      <text class="text-soft" x="484" y="216" font-family="Fraunces, Georgia, serif" font-size="30">Order direct</text>
      <!-- a small card-in-the-bag glyph -->
      <g data-anim="rise" style="--delay:1500ms">
        <rect x="484" y="244" width="48" height="32" rx="4" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
        <line x1="492" y1="256" x2="524" y2="256" stroke="var(--teal,#1F4E5B)"/>
        <line x1="492" y1="266" x2="514" y2="266" stroke="var(--teal,#1F4E5B)"/>
        <text class="text-stone" x="548" y="265" font-size="13">a card in the bag</text>
      </g>
      <text class="text-stone" x="484" y="312" font-size="13">a better deal on your</text>
      <text class="text-stone" x="484" y="332" font-size="13">own ordering page</text>
    </g>
    <text class="text-stone" x="400" y="420" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1900ms">Found on theirs. Kept on yours.</text>
  </g>

  <!-- ============ LAND — the punchline ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="160" text-anchor="middle">Aggregator</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="244" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="38" font-style="italic" fill="var(--ink,#14161A)">Rents you a customer</text>
    <text data-anim="rise" style="--delay:560ms" x="400" y="296" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="38" font-style="italic" fill="var(--ink,#14161A)">by the order.</text>
    <text data-anim="fade" style="--delay:980ms" class="text-stone" x="400" y="356" text-anchor="middle" font-size="14">Your own channel lets you keep one. Use the rental to fill the seats you own.</text>
    <line data-anim="grow-x" style="--delay:1180ms; transform-origin:center" x1="340" y1="386" x2="460" y2="386" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
