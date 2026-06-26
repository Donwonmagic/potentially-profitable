// Glossary explainer — CORE WEB VITALS
//
// What Core Web Vitals are (three field measurements of how a page actually
// feels to a real visitor — how fast the main content loads, how quickly it
// reacts to a tap, and whether the layout jumps around as it loads), why they
// matter twice over (a ranking signal AND a conversion signal — a slow, jumpy
// page ranks lower and loses the hungry guest before the menu appears), the
// three scores in plain terms (LCP, INP, CLS, translated into what the guest
// feels), the unglamorous fixes (compress the hero image, cut heavy scripts,
// set image sizes so nothing shifts — a diet, not a rebuild), and the landing
// (the visitor never reads a speed score; they feel it and leave). The only
// number used is Google's published ~2.5s good-LCP threshold — a factual
// standard, not an invented figure. Every other quantitative claim is avoided
// on purpose. This is a translation-of-jargon explainer, not a numbers one.

export default {
  term_slug: 'core-web-vitals',
  term_head: 'Core Web Vitals, in 90 seconds.',
  subhead:   'The three speed scores Google grades your site on — and your guest feels.',
  duration_ms: 73000,
  audio_url: null,
  scenes_es: [
    { id: 'what',  caption: 'Las Core Web Vitals son tres medidas de cómo se SIENTE de verdad tu página para un visitante real: qué tan rápido carga el contenido principal, qué tan rápido responde a un toque, y si las cosas saltan de lugar mientras carga. Google las mide en visitas reales, no en un laboratorio.' },
    { id: 'why',   caption: 'Son una señal de posicionamiento y una señal de conversión al mismo tiempo. Una página lenta y saltarina posiciona más abajo Y pierde al comensal con hambre que se va antes de que aparezca tu menú. Aquí la velocidad no es vanidad — son cubiertos.' },
    { id: 'three', caption: 'En palabras simples: LCP — ¿lo grande, tu foto principal o el menú, apareció rápido, en menos de unos dos segundos y medio? INP — cuando tocaron "Reservar", ¿respondió de inmediato? CLS — ¿el botón se quedó quieto, o se movió mientras cargaba la página y tocaron mal?' },
    { id: 'move',  caption: 'Los arreglos no tienen glamour: comprime la foto principal gigante, recorta los scripts más pesados, y fija el tamaño de las imágenes para que nada salte. Rara vez necesitas rehacer el sitio — necesitas ponerlo a dieta.' },
    { id: 'land',  caption: 'Tu visitante nunca lee una puntuación de velocidad. La siente, y se va si se hace lenta. Construye para el pulgar, en un teléfono, en un estacionamiento.' },
  ],
  scenes: [
    { id: 'what',  ms: 14000, caption: 'Core Web Vitals are three measurements of how your page actually feels to a real visitor: how fast the main content loads, how quickly it reacts to a tap, and whether things jump around while it loads. Google measures them on real visits, not in a lab.' },
    { id: 'why',   ms: 15000, caption: 'They are a ranking signal and a conversion signal at once. A slow, jumpy page ranks lower and loses the hungry guest who bounces before your menu even appears. Speed is not vanity here — it is covers.' },
    { id: 'three', ms: 16000, caption: 'In plain terms: LCP — did the big thing, your hero photo or menu, show up fast, under about two and a half seconds? INP — when they tapped “Reserve,” did it respond right away? CLS — did the button stay put, or shift as the page loaded so they mis-tapped?' },
    { id: 'move',  ms: 14000, caption: 'The fixes are unglamorous: compress the giant hero image, cut the heaviest scripts, and set sizes on images so nothing jumps. You rarely need a rebuild — you need a diet.' },
    { id: 'land',  ms: 14000, caption: 'Your visitor never reads a speed score. They feel it, and they leave if it drags. Build for the thumb on a phone in a parking lot.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of Core Web Vitals — the three speed scores a real visitor feels and Google grades">
  <defs>
    <linearGradient id="cw-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#cw-bg)"/>

  <!-- ============ WHAT ============ -->
  <g class="explainer-scene" data-scene-id="what">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Three things a real visitor feels</text>
    <!-- the phone, loading a restaurant page -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="150" y="92" width="190" height="330" rx="26" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)" stroke-width="2"/>
      <rect x="166" y="118" width="158" height="118" rx="8" fill="var(--cream-2,#F3EEE3)"/>
      <text class="text-stone" x="245" y="182" text-anchor="middle" font-size="12" letter-spacing="0.08em">HERO PHOTO</text>
      <rect x="166" y="252" width="158" height="9" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="166" y="270" width="158" height="9" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="166" y="288" width="120" height="9" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="186" y="340" width="118" height="34" rx="17" fill="var(--teal,#1F4E5B)"/>
      <text x="245" y="362" text-anchor="middle" font-size="13" fill="var(--cream,#FAF7F2)" letter-spacing="0.04em">Reserve</text>
    </g>
    <!-- three gauges, the three vitals -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-stone" x="555" y="118" text-anchor="middle" font-size="11" letter-spacing="0.1em">LOAD</text>
      <rect x="450" y="132" width="210" height="40" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <rect x="462" y="146" width="120" height="12" rx="6" fill="var(--teal,#1F4E5B)"/>
      <text class="text-stone" x="555" y="218" text-anchor="middle" font-size="11" letter-spacing="0.1em">RESPONSE</text>
      <rect x="450" y="232" width="210" height="40" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <rect x="462" y="246" width="170" height="12" rx="6" fill="var(--teal,#1F4E5B)"/>
      <text class="text-stone" x="555" y="318" text-anchor="middle" font-size="11" letter-spacing="0.1em">STABILITY</text>
      <rect x="450" y="332" width="210" height="40" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <rect x="462" y="346" width="90" height="12" rx="6" fill="var(--rust,#B8541A)"/>
    </g>
    <text class="text-stone" x="400" y="456" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1500ms">Measured on real visits, not in a lab.</text>
  </g>

  <!-- ============ WHY ============ -->
  <g class="explainer-scene" data-scene-id="why">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">A ranking signal and a conversion signal</text>
    <!-- left: ranking falls -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="80" y="110" width="300" height="290" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="230" y="146" text-anchor="middle" font-size="12" letter-spacing="0.1em">SEARCH RANKING</text>
      <rect x="120" y="174" width="220" height="8" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="120" y="206" width="220" height="8" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="120" y="238" width="220" height="8" rx="4" fill="var(--line,#E8E2D6)"/>
      <!-- the down arrow: slow page sinks -->
      <g data-anim="fade" style="--delay:700ms">
        <line x1="230" y1="280" x2="230" y2="350" stroke="var(--rust,#B8541A)" stroke-width="3"/>
        <path d="M214 336 L230 358 L246 336 Z" fill="var(--rust,#B8541A)"/>
        <text class="text-rust" x="230" y="386" text-anchor="middle" font-size="13" font-style="italic">slow page ranks lower</text>
      </g>
    </g>
    <!-- right: guest bounces -->
    <g data-anim="rise" style="--delay:900ms">
      <rect x="420" y="110" width="300" height="290" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="570" y="146" text-anchor="middle" font-size="12" letter-spacing="0.1em">THE HUNGRY GUEST</text>
      <!-- a little figure, leaving -->
      <circle cx="520" cy="250" r="22" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)"/>
      <rect x="504" y="278" width="32" height="56" rx="10" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)"/>
      <g data-anim="fade" style="--delay:1300ms">
        <line x1="560" y1="288" x2="652" y2="288" stroke="var(--rust,#B8541A)" stroke-width="3"/>
        <path d="M638 272 L660 288 L638 304 Z" fill="var(--rust,#B8541A)"/>
        <text class="text-rust" x="606" y="338" text-anchor="middle" font-size="13" font-style="italic">bounces before the menu</text>
      </g>
    </g>
    <text class="text-soft" x="400" y="446" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" data-anim="fade" style="--delay:1700ms">Speed is not vanity — it is covers.</text>
  </g>

  <!-- ============ THREE ============ -->
  <g class="explainer-scene" data-scene-id="three">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The three, in plain terms</text>
    <!-- LCP card: did the big thing load fast? stopwatch under ~2.5s -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="44" y="92" width="230" height="320" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="159" y="128" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30">LCP</text>
      <text class="text-stone" x="159" y="152" text-anchor="middle" font-size="12">did the big thing load fast?</text>
      <!-- stopwatch -->
      <circle cx="159" cy="234" r="48" fill="var(--cream,#FAF7F2)" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <rect x="149" y="178" width="20" height="10" rx="3" fill="var(--teal,#1F4E5B)"/>
      <line x1="159" y1="234" x2="159" y2="200" stroke="var(--teal,#1F4E5B)" stroke-width="3"/>
      <line x1="159" y1="234" x2="184" y2="244" stroke="var(--rust,#B8541A)" stroke-width="3"/>
      <text class="text-rust" x="159" y="332" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="28">&lt; 2.5s</text>
      <text class="text-stone" x="159" y="362" text-anchor="middle" font-size="11">hero photo or menu, up fast</text>
    </g>
    <!-- INP card: did the tap respond? -->
    <g data-anim="rise" style="--delay:700ms">
      <rect x="285" y="92" width="230" height="320" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="400" y="128" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30">INP</text>
      <text class="text-stone" x="400" y="152" text-anchor="middle" font-size="12">did the tap respond?</text>
      <!-- a finger tap -> instant -->
      <rect x="350" y="200" width="100" height="40" rx="20" fill="var(--teal,#1F4E5B)"/>
      <text x="400" y="225" text-anchor="middle" font-size="13" fill="var(--cream,#FAF7F2)">Reserve</text>
      <circle cx="400" cy="220" r="30" fill="none" stroke="var(--rust,#B8541A)" stroke-width="2" opacity="0.6"/>
      <path d="M392 256 L392 290 L386 284 M392 290 L398 284" fill="none" stroke="var(--stone,#7A7468)" stroke-width="2"/>
      <text class="text-rust" x="400" y="332" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" font-style="italic">right away</text>
      <text class="text-stone" x="400" y="362" text-anchor="middle" font-size="11">tap to reaction, instant</text>
    </g>
    <!-- CLS card: did the button stay put? -->
    <g data-anim="rise" style="--delay:1200ms">
      <rect x="526" y="92" width="230" height="320" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <text class="text-rust" x="641" y="128" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30">CLS</text>
      <text class="text-stone" x="641" y="152" text-anchor="middle" font-size="12">did the button stay put?</text>
      <!-- a button that shifted: ghost position + moved position -->
      <rect x="566" y="196" width="120" height="36" rx="18" fill="none" stroke="var(--rust,#B8541A)" stroke-dasharray="4 3"/>
      <text class="text-stone" x="626" y="219" text-anchor="middle" font-size="11" font-style="italic">was here</text>
      <rect x="596" y="244" width="120" height="36" rx="18" fill="var(--rust,#B8541A)"/>
      <text x="656" y="267" text-anchor="middle" font-size="13" fill="var(--cream,#FAF7F2)">Reserve</text>
      <path d="M640 234 L668 240" stroke="var(--rust,#B8541A)" stroke-width="2"/>
      <path d="M660 234 L668 240 L660 247" fill="none" stroke="var(--rust,#B8541A)" stroke-width="2"/>
      <text class="text-rust" x="641" y="332" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="20" font-style="italic">it shifted</text>
      <text class="text-stone" x="641" y="362" text-anchor="middle" font-size="11">so the thumb mis-tapped</text>
    </g>
  </g>

  <!-- ============ MOVE ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Put the page on a diet</text>
    <!-- compress the hero image -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="70" y="120" width="200" height="200" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <rect x="98" y="150" width="144" height="92" rx="8" fill="var(--cream-2,#F3EEE3)"/>
      <text class="text-stone" x="170" y="202" text-anchor="middle" font-size="12">hero image</text>
      <g data-anim="grow-x" style="--delay:500ms">
        <line x1="118" y1="268" x2="222" y2="268" stroke="var(--teal,#1F4E5B)" stroke-width="3"/>
        <path d="M210 258 L226 268 L210 278 Z" fill="var(--teal,#1F4E5B)"/>
        <path d="M130 258 L114 268 L130 278 Z" fill="var(--teal,#1F4E5B)"/>
      </g>
      <text class="text-teal" x="170" y="300" text-anchor="middle" font-size="13">compress it</text>
    </g>
    <!-- cut the heaviest scripts -->
    <g data-anim="rise" style="--delay:600ms">
      <rect x="300" y="120" width="200" height="200" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <rect x="328" y="150" width="144" height="14" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="328" y="172" width="144" height="14" rx="4" fill="var(--rust,#B8541A)" opacity="0.5"/>
      <rect x="328" y="194" width="144" height="14" rx="4" fill="var(--line,#E8E2D6)"/>
      <rect x="328" y="216" width="144" height="14" rx="4" fill="var(--rust,#B8541A)" opacity="0.5"/>
      <line x1="320" y1="179" x2="480" y2="201" stroke="var(--rust,#B8541A)" stroke-width="2.5" data-anim="grow-x" style="--delay:1000ms"/>
      <line x1="320" y1="223" x2="480" y2="201" stroke="var(--rust,#B8541A)" stroke-width="2.5" data-anim="grow-x" style="--delay:1100ms"/>
      <text class="text-rust" x="400" y="300" text-anchor="middle" font-size="13">cut heavy scripts</text>
    </g>
    <!-- set image sizes so nothing jumps -->
    <g data-anim="rise" style="--delay:1000ms">
      <rect x="530" y="120" width="200" height="200" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <rect x="558" y="150" width="144" height="92" rx="8" fill="none" stroke="var(--teal,#1F4E5B)" stroke-dasharray="5 4"/>
      <text class="text-teal" x="630" y="174" text-anchor="middle" font-size="11" letter-spacing="0.06em">WIDTH</text>
      <text class="text-teal" x="630" y="226" text-anchor="middle" font-size="11" letter-spacing="0.06em">HEIGHT</text>
      <text class="text-stone" x="630" y="200" text-anchor="middle" font-size="12">space reserved</text>
      <text class="text-teal" x="630" y="300" text-anchor="middle" font-size="13">set image sizes</text>
    </g>
    <text class="text-soft" x="400" y="430" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" data-anim="fade" style="--delay:1500ms">A diet, not a rebuild.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="160" text-anchor="middle">Core Web Vitals</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="240" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="38" font-style="italic" fill="var(--ink,#14161A)">Nobody reads the score.</text>
    <text data-anim="rise" style="--delay:560ms" x="400" y="292" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="38" font-style="italic" fill="var(--ink,#14161A)">They feel it, and leave.</text>
    <text data-anim="fade" style="--delay:1000ms" class="text-stone" x="400" y="352" text-anchor="middle" font-size="14">Build for the thumb on a phone in a parking lot.</text>
    <line data-anim="grow-x" style="--delay:1200ms; transform-origin:center" x1="340" y1="382" x2="460" y2="382" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
