// Glossary explainer — CHARM PRICING
//
// What charm pricing is (a price ending just under a round number —
// $9.95 instead of $10), why the eye reads it as cheaper than it is,
// why it signals value on a volume menu, the non-obvious twist that the
// same ending signals "cheap" and backfires on a premium plate, and the
// move: match the price ending to the room. All prices are illustrative
// examples, not measured operator data or cited research.

export default {
  term_slug: 'charm-pricing',
  term_head: 'Charm pricing, in 90 seconds.',
  subhead:   'Why $9.95 is not the same as $10 — and when it backfires.',
  duration_ms: 73000,
  audio_url: null,
  scenes_es: [
    { id: 'define',   caption: 'Charm pricing es terminar un precio justo por debajo de un número redondo — $9.95 en lugar de $10. El ojo lee de izquierda a derecha, se ancla en el nueve, y lo archiva como "nueve y algo", un poco más barato de lo que realmente es.' },
    { id: 'works',    caption: 'Señala valor. Un plato a $9.95 se lee como una buena oferta y empuja al comensal sensible al precio a cruzar la línea — que es exactamente por qué los menús de comida rápida-casual y de valor se apoyan en esto.' },
    { id: 'backfire', caption: 'Pero charm pricing también señala barato. En un plato fuerte de $48 en un salón de mantel blanco, un ".95" se lee como una mesa de saldos y abarata el momento sin que lo notes. La alta cocina redondea a $48, incluso a $50, a propósito.' },
    { id: 'move',     caption: 'Así que haz que el final del precio combine con el salón. Valor y volumen: ponlo con charm, noventa y cinco centavos. Premium y plato insignia: redondéalo, dólares limpios. El final del precio es un tono, no solo un número.' },
    { id: 'land',     caption: 'El centavo nunca fue por el centavo. Es la señal que manda — "oferta" o "calidad". Elige la que el salón espera.' },
  ],
  scenes: [
    { id: 'define',   ms: 13000, caption: 'Charm pricing is ending a price just under a round number — $9.95 instead of $10. The eye reads left to right, anchors on the nine, and files it as nine-something, a little cheaper than it really is.' },
    { id: 'works',    ms: 15000, caption: 'It signals value. A $9.95 plate reads as a good deal and nudges the price-sensitive guest over the line — which is exactly why fast-casual and value menus lean on it.' },
    { id: 'backfire', ms: 16000, caption: 'But charm pricing also signals cheap. On a $48 entrée at a white-tablecloth room, a ".95" reads like a discount rack and quietly cheapens the experience. Fine dining rounds to $48, even $50, on purpose.' },
    { id: 'move',     ms: 15000, caption: 'So match the ending to the room. Value and volume: charm-price it, dollar-ninety-five. Premium and signature: round it, clean dollars. The price ending is a tone, not just a number.' },
    { id: 'land',     ms: 14000, caption: 'The penny was never about the penny. It is the signal it sends — deal or quality. Choose the one the room expects.' },
  ],
  svg: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of charm pricing — why a price ending just under a round number reads as cheaper, and when it backfires">
  <defs>
    <linearGradient id="ch-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#ch-bg)"/>

  <!-- ============ DEFINE — $9.95 (9 highlighted) vs $10.00, eye anchors left ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Just under the round number</text>
    <!-- the charm price, with the leading 9 carrying the weight -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="230" y="180" text-anchor="middle" font-size="12" letter-spacing="0.1em">WHAT THE MENU SAYS</text>
      <text x="230" y="270" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="84">
        <tspan class="text-rust">$9</tspan><tspan class="text-soft" font-size="48">.95</tspan>
      </text>
    </g>
    <!-- the eye reads left to right and lands on the 9 -->
    <g data-anim="grow-x" style="--delay:700ms; transform-origin:left">
      <line x1="150" y1="300" x2="300" y2="300" stroke="var(--rust,#B8541A)" stroke-width="2"/>
      <path d="M300 300 l-12 -6 l0 12 z" fill="var(--rust,#B8541A)"/>
    </g>
    <text class="text-rust" x="230" y="330" text-anchor="middle" font-size="13" font-style="italic" data-anim="fade" style="--delay:1100ms">the eye anchors here</text>
    <!-- what it really is -->
    <g data-anim="rise" style="--delay:1400ms">
      <text class="text-stone" x="570" y="180" text-anchor="middle" font-size="12" letter-spacing="0.1em">WHAT IT NEARLY IS</text>
      <text class="text-soft" x="570" y="270" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="84">$10</text>
    </g>
    <text class="text-stone" x="570" y="330" text-anchor="middle" font-size="13" font-style="italic" data-anim="fade" style="--delay:1700ms">a nickel away</text>
    <!-- the read -->
    <text class="text-stone" x="400" y="420" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:2000ms">Filed as "nine-something" — a little cheaper than it really is.</text>
  </g>

  <!-- ============ WORKS — value menu of $X.95 prices, a "good deal" tag ============ -->
  <g class="explainer-scene" data-scene-id="works">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">On a value menu, it signals a deal</text>
    <!-- the menu card -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="120" y="90" width="420" height="320" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="148" y="130" font-size="11" letter-spacing="0.12em">VALUE MENU · FAST-CASUAL</text>
      <line x1="148" y1="148" x2="512" y2="148" stroke="var(--line,#E8E2D6)"/>
    </g>
    <g data-anim="rise" style="--delay:380ms">
      <text class="text-soft" x="148" y="194" font-size="15">Carne taco plate</text>
      <text class="text-soft" x="512" y="194" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">$8.95</text>
    </g>
    <g data-anim="rise" style="--delay:560ms">
      <text class="text-soft" x="148" y="244" font-size="15">Chopped bowl</text>
      <text class="text-soft" x="512" y="244" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">$9.95</text>
    </g>
    <g data-anim="rise" style="--delay:740ms">
      <text class="text-soft" x="148" y="294" font-size="15">House burrito</text>
      <text class="text-soft" x="512" y="294" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">$11.95</text>
    </g>
    <g data-anim="rise" style="--delay:920ms">
      <text class="text-soft" x="148" y="344" font-size="15">Loaded fries</text>
      <text class="text-soft" x="512" y="344" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="22">$6.95</text>
    </g>
    <!-- the "good deal" tag -->
    <g data-anim="rise" style="--delay:1200ms">
      <rect x="560" y="200" width="190" height="100" rx="12" fill="rgba(31,78,91,0.10)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="655" y="248" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="26">good deal</text>
      <text class="text-stone" x="655" y="278" text-anchor="middle" font-size="12">reads as friendly</text>
    </g>
    <text class="text-stone" x="400" y="448" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1600ms">Nudges the price-sensitive guest over the line.</text>
  </g>

  <!-- ============ BACKFIRE — $48.95 vs $48 on a fine-dining menu, .95 flagged rust ============ -->
  <g class="explainer-scene" data-scene-id="backfire">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">In a premium room, it signals cheap</text>
    <!-- the wrong way: charm-priced entrée -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="80" y="110" width="300" height="250" rx="14" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="104" y="150" font-size="11" letter-spacing="0.1em">WHITE-TABLECLOTH · CHARM-PRICED</text>
      <text class="text-soft" x="104" y="200" font-size="15" font-style="italic">Dry-aged ribeye</text>
      <text x="104" y="272" font-family="Fraunces, Georgia, serif" font-size="56">
        <tspan class="text-soft">$48</tspan><tspan class="text-rust">.95</tspan>
      </text>
      <!-- flag the .95 -->
      <line x1="232" y1="240" x2="280" y2="318" stroke="var(--rust,#B8541A)" stroke-dasharray="3 3" data-anim="fade" style="--delay:900ms"/>
      <text class="text-rust" x="220" y="338" font-size="12" font-style="italic" data-anim="fade" style="--delay:1100ms">reads like a discount rack</text>
    </g>
    <!-- the right way: rounded entrée -->
    <g data-anim="rise" style="--delay:500ms">
      <rect x="420" y="110" width="300" height="250" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="444" y="150" font-size="11" letter-spacing="0.1em">WHITE-TABLECLOTH · ROUNDED</text>
      <text class="text-soft" x="444" y="200" font-size="15" font-style="italic">Dry-aged ribeye</text>
      <text class="text-soft" x="444" y="272" font-family="Fraunces, Georgia, serif" font-size="56">$48</text>
      <line x1="444" y1="300" x2="676" y2="300" stroke="var(--line,#E8E2D6)"/>
      <text class="text-teal" x="444" y="332" font-size="12" font-style="italic">clean, confident, on purpose</text>
    </g>
    <text class="text-stone" x="400" y="406" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1500ms">Fine dining rounds to $48, even $50 — the ".95" quietly cheapens the room.</text>
  </g>

  <!-- ============ MOVE — two rooms matched: value (charm) vs premium (round) ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Match the ending to the room</text>
    <!-- value room -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="80" y="110" width="300" height="250" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="104" y="150" font-size="11" letter-spacing="0.1em">VALUE · VOLUME</text>
      <text class="text-soft" x="104" y="224" font-family="Fraunces, Georgia, serif" font-size="52">$9.95</text>
      <line x1="104" y1="256" x2="356" y2="256" stroke="var(--line,#E8E2D6)"/>
      <text class="text-teal" x="104" y="290" font-size="14">Charm-price it.</text>
      <text class="text-stone" x="104" y="318" font-size="13">dollar-ninety-five says "deal"</text>
    </g>
    <!-- premium room -->
    <g data-anim="rise" style="--delay:420ms">
      <rect x="420" y="110" width="300" height="250" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="444" y="150" font-size="11" letter-spacing="0.1em">PREMIUM · SIGNATURE</text>
      <text class="text-soft" x="444" y="224" font-family="Fraunces, Georgia, serif" font-size="52">$48</text>
      <line x1="444" y1="256" x2="676" y2="256" stroke="var(--line,#E8E2D6)"/>
      <text class="text-teal" x="444" y="290" font-size="14">Round it.</text>
      <text class="text-stone" x="444" y="318" font-size="13">clean dollars say "quality"</text>
    </g>
    <!-- matched -->
    <g data-anim="fade" style="--delay:1200ms">
      <line x1="380" y1="235" x2="420" y2="235" stroke="var(--line-dark,#D4CCBC)" stroke-width="2"/>
      <text class="text-stone" x="400" y="424" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" font-style="italic">The price ending is a tone, not just a number.</text>
    </g>
  </g>

  <!-- ============ LAND — the punchline ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="170" text-anchor="middle">Charm pricing</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="252" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">The penny was never</text>
    <text data-anim="rise" style="--delay:560ms" x="400" y="304" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">about the penny.</text>
    <text data-anim="fade" style="--delay:980ms" class="text-stone" x="400" y="364" text-anchor="middle" font-size="14">It is the signal it sends — "deal" or "quality." Choose the one the room expects.</text>
    <line data-anim="grow-x" style="--delay:1180ms; transform-origin:center" x1="340" y1="394" x2="460" y2="394" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
