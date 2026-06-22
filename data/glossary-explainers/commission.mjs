// Glossary explainer — COMMISSION (delivery-marketplace take-rate)
//
// What the commission (take-rate) a delivery marketplace charges actually
// does to one order: the cut off the top, the fee stack riding alongside
// it, what little contribution survives once food and labor are subtracted,
// and the side-by-side against the same order through a channel you own.
// All figures are an illustrative worked example — one $40 order at a 30%
// commission — not measured operator data.

export default {
  term_slug: 'commission',
  term_head: 'Commission, in 90 seconds.',
  subhead:   'The cut a marketplace takes from every order — and what is left.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'cut',    caption: 'La comisión — el take-rate — es el porcentaje que un marketplace de delivery se queda de cada pedido. En un pedido de $40 a una comisión del 30%, eso son $12 que salen primero, antes de que se mueva cualquier otra cosa.' },
    { id: 'stack',  caption: 'La comisión no es la única línea. Ese mismo pedido de $40 también carga unos $1,20 de procesamiento de pago, y a menudo una tarifa opcional de listado promocionado encima, si pagas por aparecer destacado.' },
    { id: 'lands',  caption: 'Ahora resta lo que costó la comida y la mano de obra para prepararla. Después del 30%, el procesamiento, la comida y el trabajo, la contribución que de verdad llega a la caja en ese pedido de $40 es delgada — a menudo apenas unos pocos dólares.' },
    { id: 'toggle', caption: 'El mismísimo pedido por tu propio sitio o tu punto de venta cuesta más o menos $3 a $5 de procesamiento — no $12 de comisión. La diferencia entre esos dos números es el peaje.' },
    { id: 'land',   caption: 'El peaje es el modelo de negocio, no una tarifa que negocias a la baja. Usa los marketplaces para que te descubran; mueve los pedidos repetidos a un canal que sea tuyo.' },
  ],
  scenes: [
    { id: 'cut',    ms: 15000, caption: 'Commission — the take-rate — is the percent a delivery marketplace keeps from each order. On a $40 order at a 30 percent commission, that is twelve dollars off the top, before anything else moves.' },
    { id: 'stack',  ms: 15000, caption: 'Commission is not the only line. That same $40 order also carries about a dollar-twenty in payment processing, and often an optional promoted-listing fee on top if you pay for placement.' },
    { id: 'lands',  ms: 16000, caption: 'Now subtract what the food cost and the labor to make it. After the 30 percent cut, the processing, the food, and the labor, the contribution that actually reaches the till on a $40 marketplace order is thin — often just a few dollars.' },
    { id: 'toggle', ms: 14000, caption: 'The exact same order through your own site or POS costs roughly three to five dollars in processing — not twelve in commission. The gap between those two is the rake.' },
    { id: 'land',   ms: 14000, caption: 'The rake is the business model, not a fee you negotiate down. Use marketplaces for discovery; move the repeat orders to a channel you own.' },
  ],
  svg: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of a delivery-marketplace commission take-rate on one example order">
  <defs>
    <linearGradient id="cm-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#cm-bg)"/>

  <!-- ============ CUT — $40 order, 30% ($12) off the top ============ -->
  <g class="explainer-scene" data-scene-id="cut">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The cut off the top</text>
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="150" y="200" text-anchor="middle" font-size="12" letter-spacing="0.1em">ONE ORDER</text>
      <text class="text-soft" x="150" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="56">$40</text>
      <text class="text-stone" x="150" y="296" text-anchor="middle" font-size="12">on the marketplace</text>
    </g>
    <text class="text-stone" x="300" y="252" text-anchor="middle" font-size="34" data-anim="fade" style="--delay:600ms">×</text>
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-stone" x="400" y="200" text-anchor="middle" font-size="12" letter-spacing="0.1em">COMMISSION</text>
      <text class="text-rust" x="400" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="56">30%</text>
      <text class="text-stone" x="400" y="296" text-anchor="middle" font-size="12">the take-rate</text>
    </g>
    <text class="text-stone" x="500" y="252" text-anchor="middle" font-size="34" data-anim="fade" style="--delay:1300ms">=</text>
    <g data-anim="rise" style="--delay:1600ms">
      <rect x="588" y="190" width="172" height="120" rx="12" fill="rgba(184,84,26,0.10)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="674" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="48">$12</text>
      <text class="text-stone" x="674" y="290" text-anchor="middle" font-size="12">off the top</text>
    </g>
    <text class="text-stone" x="400" y="404" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:2000ms">Before anything else moves.</text>
  </g>

  <!-- ============ STACK — $12 commission + $1.20 processing + promo ============ -->
  <g class="explainer-scene" data-scene-id="stack">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The fee stack</text>
    <!-- commission -->
    <g data-anim="rise" style="--delay:140ms">
      <text class="text-stone" x="80" y="146" font-size="11" letter-spacing="0.1em">COMMISSION · 30%</text>
      <rect x="80" y="160" height="48" rx="4" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:320ms" width="528"/>
      <text x="588" y="190" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">$12.00</text>
    </g>
    <!-- payment processing -->
    <g data-anim="rise" style="--delay:760ms">
      <text class="text-stone" x="80" y="246" font-size="11" letter-spacing="0.1em">PAYMENT PROCESSING</text>
      <rect x="80" y="260" height="48" rx="4" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:940ms" width="53"/>
      <text class="text-soft" x="148" y="290" font-family="Fraunces, Georgia, serif" font-size="20">$1.20</text>
    </g>
    <!-- promoted listing (optional) -->
    <g data-anim="rise" style="--delay:1300ms">
      <text class="text-stone" x="80" y="346" font-size="11" letter-spacing="0.1em">PROMOTED LISTING · OPTIONAL</text>
      <rect x="80" y="360" height="48" rx="4" fill="rgba(184,84,26,0.15)" stroke="var(--rust,#B8541A)" stroke-dasharray="4 3" data-anim="grow-x" style="--delay:1480ms" width="120"/>
      <text class="text-rust" x="214" y="390" font-size="13" font-style="italic">if you pay for placement</text>
    </g>
    <text class="text-stone" x="400" y="452" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1900ms">Commission is not the only line.</text>
  </g>

  <!-- ============ LANDS — what reaches the till shrinks to a few dollars ============ -->
  <g class="explainer-scene" data-scene-id="lands">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">What reaches the till</text>
    <!-- starting bar: $40 -->
    <g data-anim="rise" style="--delay:120ms">
      <text class="text-stone" x="80" y="132" font-size="11" letter-spacing="0.1em">ORDER · $40</text>
      <rect x="80" y="146" width="640" height="54" rx="4" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)"/>
    </g>
    <!-- subtractions stacked left to right within the bar -->
    <g data-anim="grow-x" style="--delay:520ms">
      <rect x="80"  y="146" width="192" height="54" fill="var(--rust,#B8541A)"/>
    </g>
    <g data-anim="grow-x" style="--delay:760ms">
      <rect x="272" y="146" width="20"  height="54" fill="var(--teal,#1F4E5B)"/>
    </g>
    <g data-anim="grow-x" style="--delay:1000ms">
      <rect x="292" y="146" width="240" height="54" fill="rgba(20,22,26,0.30)"/>
    </g>
    <g data-anim="grow-x" style="--delay:1240ms">
      <rect x="532" y="146" width="140" height="54" fill="rgba(20,22,26,0.18)"/>
    </g>
    <!-- legend -->
    <g data-anim="fade" style="--delay:1500ms">
      <text class="text-stone" x="176" y="232" text-anchor="middle" font-size="12">commission</text>
      <text class="text-stone" x="282" y="248" text-anchor="middle" font-size="11">fees</text>
      <text class="text-stone" x="412" y="232" text-anchor="middle" font-size="12">food cost</text>
      <text class="text-stone" x="602" y="232" text-anchor="middle" font-size="12">labor</text>
    </g>
    <!-- what's left -->
    <g data-anim="rise" style="--delay:1800ms">
      <rect x="672" y="146" width="48" height="54" fill="var(--status-good,#1F6B3A)"/>
      <line x1="696" y1="200" x2="696" y2="300" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-good" x="608" y="338" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="32">a few $</text>
      <text class="text-stone" x="608" y="362" text-anchor="middle" font-size="12">contribution to the till</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:2200ms">Thin, once the cut and the kitchen are paid.</text>
  </g>

  <!-- ============ TOGGLE — $12 commission vs $3-5 direct ============ -->
  <g class="explainer-scene" data-scene-id="toggle">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Same order, two channels</text>
    <!-- marketplace -->
    <g data-anim="rise" style="--delay:120ms">
      <rect x="100" y="120" width="280" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="124" y="160" font-size="11" letter-spacing="0.1em">THROUGH THE MARKETPLACE</text>
      <text class="text-soft" x="124" y="224" font-family="Fraunces, Georgia, serif" font-size="56">$12</text>
      <text class="text-stone" x="124" y="256" font-size="13">commission on the order</text>
      <line x1="124" y1="284" x2="356" y2="284" stroke="var(--line,#E8E2D6)"/>
      <text class="text-rust" x="124" y="316" font-size="13" font-style="italic">A 30% cut, every time.</text>
    </g>
    <!-- direct -->
    <g data-anim="rise" style="--delay:380ms">
      <rect x="420" y="120" width="280" height="240" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="444" y="160" font-size="11" letter-spacing="0.1em">THROUGH YOUR OWN SITE · POS</text>
      <text class="text-soft" x="444" y="224" font-family="Fraunces, Georgia, serif" font-size="56">$3–5</text>
      <text class="text-stone" x="444" y="256" font-size="13">processing on the order</text>
      <line x1="444" y1="284" x2="676" y2="284" stroke="var(--line,#E8E2D6)"/>
      <text class="text-good" x="444" y="316" font-size="13">No commission line.</text>
    </g>
    <!-- the rake bracket -->
    <g data-anim="fade" style="--delay:1500ms">
      <text class="text-rust" x="400" y="424" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" font-style="italic">The gap between them is the rake.</text>
    </g>
  </g>

  <!-- ============ LAND — the punchline ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="170" text-anchor="middle">Commission</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="252" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">The rake is the model,</text>
    <text data-anim="rise" style="--delay:560ms" x="400" y="304" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">not a fee you negotiate.</text>
    <text data-anim="fade" style="--delay:980ms" class="text-stone" x="400" y="364" text-anchor="middle" font-size="14">Marketplaces for discovery. Repeat orders on a channel you own.</text>
    <line data-anim="grow-x" style="--delay:1180ms; transform-origin:center" x1="340" y1="394" x2="460" y2="394" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
