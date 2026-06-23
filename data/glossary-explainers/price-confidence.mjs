// Glossary explainer — CONFIDENCE (LEVEL vs TREND)
//
// A price carries two separate certainties, not one: how sure we are of the
// dollar figure (LEVEL) and how sure we are of which way it is moving (TREND).
// The two are scored apart, they can disagree, and the headline takes the
// LOWER of the pair so it never claims more certainty than its weaker half can
// hold. The labels are the qualitative tiers from the Cost Index methodology —
// high / medium / low / directional — not invented numbers. The beef example
// (trend high, level medium → headline medium) is the illustrative one already
// published on the glossary term page.

export default {
  term_slug: 'price-confidence',
  term_head: 'Confidence, in 90 seconds.',
  subhead:   'Two certainties, scored apart — and why the headline takes the lower.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'two',   caption: 'Un precio carga dos certezas distintas, no una. La primera: qué tan seguro estás del dólar — la cifra exacta de hoy. La segunda: qué tan seguro estás de la dirección — si va para arriba, para abajo o plano. Son dos preguntas diferentes, así que se califican por separado.' },
    { id: 'level', caption: 'La primera es el NIVEL: qué tan seguro estás del dólar. Es alta cuando varias fuentes independientes coinciden en el mismo precio. Con una sola fuente baja a media, y sin un dólar citable no marca nivel. Es un medidor sobre la cifra en sí.' },
    { id: 'trend', caption: 'La segunda es la TENDENCIA: qué tan seguro estás de la dirección. Es alta cuando las fuentes coinciden limpiamente en hacia dónde se mueve. Pero un camino dentado y ruidoso queda topado en baja, por muy alineadas que estén las puntas — el ruido no es una tendencia.' },
    { id: 'differ', caption: 'Pueden diferir. Estás seguro de la dirección mientras el dólar exacto sigue borroso — y también al revés. El Cost Index está seguro de que la res está subiendo pero no fija el dólar exacto: tendencia alta, nivel medio. Puedes actuar sobre la dirección sin confiar en el centavo.' },
    { id: 'lower', caption: 'Por eso el titular toma la MENOR de las dos. Tendencia alta, nivel medio: el titular se lee medio. Una lectura solo es tan confiable como su mitad más débil, así que el número nunca promete más certeza de la que su lado más flojo puede sostener.' },
  ],
  scenes: [
    { id: 'two',   ms: 15000, caption: 'A price carries two different certainties, not one. The first: how sure you are of the dollar — the exact figure today. The second: how sure you are of the direction — whether it is heading up, down, or flat. They are two different questions, so they get scored apart.' },
    { id: 'level', ms: 14000, caption: 'The first is LEVEL: how sure you are of the dollar. It runs high when several independent sources agree on the same price. One source alone drops it to medium, and with no citable dollar it scores no level at all. It is a meter on the figure itself.' },
    { id: 'trend', ms: 16000, caption: 'The second is TREND: how sure you are of the direction. It runs high when sources cleanly agree on which way it is moving. But a jagged, noisy path is capped at low no matter how the endpoints line up — noise is not a trend.' },
    { id: 'differ', ms: 15000, caption: 'They can differ. You are sure of the direction while the exact dollar stays fuzzy — and the other way around too. The Cost Index is sure beef is climbing but will not pin the exact dollar: trend high, level medium. You can act on the direction without trusting the cent.' },
    { id: 'lower', ms: 14000, caption: 'So the headline takes the LOWER of the two. Trend high, level medium: the headline reads medium. A reading is only as trustworthy as its weakest half, so the number never promises more certainty than its shakier side can hold.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of price confidence: level certainty about the dollar and trend certainty about the direction, scored apart, with the headline taking the lower of the two">
  <defs>
    <linearGradient id="pc-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#pc-bg)"/>

  <!-- ============ TWO: one price, two certainties ============ -->
  <g class="explainer-scene" data-scene-id="two">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Two certainties, not one</text>
    <!-- the price at the center -->
    <g data-anim="pop" style="--delay:140ms">
      <text class="text-teal" x="400" y="150" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="56">$6.40 / lb</text>
      <text class="text-stone" x="400" y="180" text-anchor="middle" font-size="13" font-style="italic">one price · two separate questions</text>
    </g>
    <!-- left question: the dollar -->
    <g data-anim="rise" style="--delay:520ms">
      <rect x="70" y="250" width="300" height="150" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="94" y="290" font-size="11" letter-spacing="0.1em">LEVEL</text>
      <text class="text-stone" x="94" y="326" font-size="16">How sure of the dollar?</text>
      <text class="text-soft" x="94" y="356" font-size="13">the exact figure, right now</text>
      <text class="text-soft" x="94" y="380" font-size="13">$6.40 — or is it $6.10? $6.80?</text>
    </g>
    <!-- right question: the direction -->
    <g data-anim="rise" style="--delay:900ms">
      <rect x="430" y="250" width="300" height="150" rx="14" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <text class="text-rust" x="454" y="290" font-size="11" letter-spacing="0.1em">TREND</text>
      <text class="text-stone" x="454" y="326" font-size="16">How sure of the direction?</text>
      <text class="text-soft" x="454" y="356" font-size="13">which way is it heading</text>
      <text class="text-soft" x="454" y="380" font-size="13">up, down, or flat</text>
    </g>
    <text class="text-stone" x="400" y="446" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1400ms">Two different questions — so they get scored apart.</text>
  </g>

  <!-- ============ LEVEL: the dial on the dollar ============ -->
  <g class="explainer-scene" data-scene-id="level">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Level — how sure of the dollar</text>
    <!-- semicircle gauge: low (left) -> medium -> high (right) -->
    <g data-anim="fade" style="--delay:160ms">
      <path d="M 240 320 A 160 160 0 0 1 560 320" fill="none" stroke="var(--line,#E8E2D6)" stroke-width="20" stroke-linecap="round"/>
      <!-- high zone (right third) in teal -->
      <path d="M 506 215 A 160 160 0 0 1 560 320" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="20" stroke-linecap="round"/>
    </g>
    <!-- tier labels under the arc -->
    <text class="text-stone" x="240" y="350" text-anchor="middle" font-size="12" data-anim="fade" style="--delay:300ms">no dollar</text>
    <text class="text-stone" x="400" y="178" text-anchor="middle" font-size="12" data-anim="fade" style="--delay:400ms">medium</text>
    <text class="text-teal"  x="560" y="350" text-anchor="middle" font-size="12" data-anim="fade" style="--delay:500ms">high</text>
    <!-- needle pointing to HIGH (right): sources agree on the dollar -->
    <g data-anim="pop" style="--delay:900ms" transform="rotate(58 400 320)">
      <line x1="400" y1="320" x2="400" y2="180" stroke="var(--rust,#B8541A)" stroke-width="4" stroke-linecap="round"/>
    </g>
    <circle cx="400" cy="320" r="9" fill="var(--rust,#B8541A)" data-anim="pop" style="--delay:900ms"/>
    <g data-anim="rise" style="--delay:1300ms">
      <text class="text-teal" x="400" y="392" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34">HIGH</text>
      <text class="text-stone" x="400" y="422" text-anchor="middle" font-size="14">several independent sources agree on the price</text>
    </g>
    <text class="text-stone" x="400" y="460" text-anchor="middle" font-size="13" font-style="italic" data-anim="fade" style="--delay:1700ms">One source alone is medium · no citable dollar is no level.</text>
  </g>

  <!-- ============ TREND: the second dial, noise caps it ============ -->
  <g class="explainer-scene" data-scene-id="trend">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Trend — how sure of the direction</text>
    <!-- LEFT: clean agreement -> high -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="210" y="98" text-anchor="middle" font-size="11" letter-spacing="0.1em">SOURCES CLEANLY AGREE</text>
      <!-- a clean rising path -->
      <polyline points="100,250 150,235 200,210 250,180 320,150" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="3" data-anim="grow-x" style="--delay:360ms"/>
      <text class="text-teal" x="210" y="320" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30">HIGH</text>
      <text class="text-stone" x="210" y="348" text-anchor="middle" font-size="13">one direction, agreed</text>
    </g>
    <!-- divider -->
    <line x1="400" y1="90" x2="400" y2="370" stroke="var(--line,#E8E2D6)" data-anim="fade" style="--delay:700ms"/>
    <!-- RIGHT: jagged noisy path -> capped at low -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-stone" x="590" y="98" text-anchor="middle" font-size="11" letter-spacing="0.1em">A JAGGED, NOISY PATH</text>
      <!-- a noisy zig-zag, endpoints still rise but it is noise -->
      <polyline points="480,210 520,168 560,232 600,176 640,236 700,188" fill="none" stroke="var(--rust,#B8541A)" stroke-width="3" data-anim="grow-x" style="--delay:1100ms"/>
      <text class="text-rust" x="590" y="320" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30">LOW</text>
      <text class="text-stone" x="590" y="348" text-anchor="middle" font-size="13">capped, however the ends line up</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1600ms">Noise is not a trend — a jagged path is held at low.</text>
  </g>

  <!-- ============ DIFFER: the two can disagree ============ -->
  <g class="explainer-scene" data-scene-id="differ">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">They can differ</text>
    <text class="text-stone" x="400" y="92" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:120ms">Beef is climbing — but the exact dollar stays fuzzy.</text>
    <!-- LEVEL: medium (dial mid) -->
    <g data-anim="rise" style="--delay:300ms">
      <text class="text-teal" x="230" y="150" text-anchor="middle" font-size="11" letter-spacing="0.1em">LEVEL</text>
      <path d="M 130 270 A 100 100 0 0 1 330 270" fill="none" stroke="var(--line,#E8E2D6)" stroke-width="16" stroke-linecap="round"/>
      <!-- needle straight up = medium -->
      <line x1="230" y1="270" x2="230" y2="182" stroke="var(--rust,#B8541A)" stroke-width="4" stroke-linecap="round" data-anim="pop" style="--delay:600ms"/>
      <circle cx="230" cy="270" r="7" fill="var(--rust,#B8541A)" data-anim="pop" style="--delay:600ms"/>
      <text class="text-stone" x="230" y="316" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="26">MEDIUM</text>
      <text class="text-soft" x="230" y="342" text-anchor="middle" font-size="13">the dollar is fuzzy</text>
    </g>
    <!-- TREND: high (clean climb) -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-rust" x="570" y="150" text-anchor="middle" font-size="11" letter-spacing="0.1em">TREND</text>
      <polyline points="480,300 520,280 560,250 600,215 660,185" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="3" data-anim="grow-x" style="--delay:1100ms"/>
      <text class="text-teal" x="570" y="320" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="26">HIGH</text>
      <text class="text-soft" x="570" y="342" text-anchor="middle" font-size="13">the climb is clear</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">Act on the direction without trusting the cent.</text>
  </g>

  <!-- ============ LOWER: the headline takes the weaker half ============ -->
  <g class="explainer-scene" data-scene-id="lower">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text class="scene-label text-teal" x="400" y="60" text-anchor="middle" data-anim="fade">The headline takes the lower</text>
    <!-- the two halves feed down to one headline -->
    <g data-anim="rise" style="--delay:200ms">
      <rect x="120" y="100" width="200" height="78" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <text class="text-rust" x="220" y="132" text-anchor="middle" font-size="11" letter-spacing="0.1em">LEVEL</text>
      <text class="text-stone" x="220" y="160" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="24">MEDIUM</text>
    </g>
    <g data-anim="rise" style="--delay:380ms">
      <rect x="480" y="100" width="200" height="78" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="580" y="132" text-anchor="middle" font-size="11" letter-spacing="0.1em">TREND</text>
      <text class="text-stone" x="580" y="160" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="24">HIGH</text>
    </g>
    <!-- arrows funnel down -->
    <path d="M 220 178 L 360 250" fill="none" stroke="var(--rust,#B8541A)" stroke-width="2" data-anim="grow-x" style="--delay:760ms"/>
    <path d="M 580 178 L 440 250" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2" data-anim="grow-x" style="--delay:760ms"/>
    <!-- min() gate -->
    <text class="text-stone" x="400" y="232" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:1000ms">take the lower of the two</text>
    <!-- the headline -->
    <g data-anim="pop" style="--delay:1300ms">
      <rect x="280" y="262" width="240" height="96" rx="14" fill="var(--teal,#1F4E5B)"/>
      <text x="400" y="296" text-anchor="middle" font-size="11" letter-spacing="0.1em" fill="var(--cream,#FAF7F2)">HEADLINE CONFIDENCE</text>
      <text x="400" y="338" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34" fill="var(--cream,#FAF7F2)">MEDIUM</text>
    </g>
    <text data-anim="rise" style="--delay:1700ms" x="400" y="408" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="26" font-style="italic" fill="var(--ink,#14161A)">As strong as its weaker half.</text>
    <text data-anim="fade" style="--delay:2000ms" class="text-stone" x="400" y="442" text-anchor="middle" font-size="14">It never claims more certainty than the shakier side can hold.</text>
  </g>
</svg>`,
};
