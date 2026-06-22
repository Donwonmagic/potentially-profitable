// Glossary explainer — THE MAP PACK (the local 3-pack)
//
// What the map pack is (the little map plus three businesses at the top of a
// local "near me" search, above the regular blue links), why it is the most
// valuable spot on the page (most local taps go to those three; off the pack
// is below the fold for a diner deciding right now), how Google fills the
// three slots (relevance, distance, prominence), and the concrete move (you
// cannot move your address, but category, a fresh reviewed profile, and
// activity move relevance and prominence every week). Qualitative throughout.
// The only quantitative claim is the structural "three" slots — factual, not
// a statistic. No click-through percentages, no operator data, no figures.
// Pairs with the Google Business Profile explainer (which names the map pack
// as "where the decision happens"); this one opens that box up.

export default {
  term_slug: 'map-pack',
  term_head: 'The map pack, in 90 seconds.',
  subhead:   'The three local results that win the search — and how they are chosen.',
  duration_ms: 73000,
  audio_url: null,
  scenes_es: [
    { id: 'what',  caption: 'El paquete de mapas es ese mapita con tres negocios que se sienta arriba de todo en una búsqueda local — "tacos cerca de mí". Tres lugares, por encima de los enlaces azules de siempre. Para una búsqueda de "cerca de mí", es el espacio más valioso de toda la página.' },
    { id: 'why',   caption: 'La mayoría de los toques locales van a esos tres. Si no estás en el paquete, quedas debajo del pliegue para el comensal que está decidiendo ahora mismo — aunque tu sitio web sea el mejor de todos. La mejor página no gana si nadie baja a verla.' },
    { id: 'picks', caption: 'Google pesa tres cosas para llenar los lugares. Relevancia: si tu categoría y tu ficha coinciden con lo que se buscó. Distancia: qué tan cerca estás de quien busca. Y prominencia: reseñas, actividad, qué tan conocido eres. La distancia no la puedes mover; la relevancia y la prominencia, sí.' },
    { id: 'move',  caption: 'Así que clava la categoría correcta, mantén la ficha de Google fresca y con reseñas respondidas, y el paquete es donde ese trabajo rinde. La distancia no la cambias; las otras dos las mueves cada semana.' },
    { id: 'land',  caption: 'El paquete de mapas es la nueva puerta de entrada para el "cerca de mí". Tres asientos — gánate uno siendo la respuesta obvia, activa y cercana.' },
  ],
  scenes: [
    { id: 'what',  ms: 14000, caption: 'The map pack is the little map plus three businesses sitting at the top of a local search — "tacos near me." Three slots, above the regular blue links. For "near me" intent, it is the most valuable real estate on the page.' },
    { id: 'why',   ms: 15000, caption: 'Most local taps go to those three. If you are not in the pack, you are below the fold for the diner deciding right now — even when your website is the better one. The best page does not win if nobody scrolls to it.' },
    { id: 'picks', ms: 16000, caption: 'Google weighs three things to fill the slots. Relevance: does your category and profile match the search. Distance: how close you are to the searcher. And prominence: reviews, activity, how known you are. You cannot move your address, but you can move relevance and prominence.' },
    { id: 'move',  ms: 14000, caption: 'So nail the category, keep the Google profile fresh and reviewed, and the pack is where that work pays off. Distance you cannot change; the other two you can, every week.' },
    { id: 'land',  ms: 14000, caption: 'The map pack is the new front door for "near me." Three seats — earn one by being the obvious, active, nearby answer.' },
  ],
  svg: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of the local map pack — the three results at the top of a near-me search and how Google chooses them by relevance, distance, and prominence">
  <defs>
    <linearGradient id="mp-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#mp-bg)"/>

  <!-- ============ WHAT — the map + three slots, above the blue links ============ -->
  <g class="explainer-scene" data-scene-id="what">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The top of a "near me" search</text>
    <!-- the search bar -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="120" y="74" width="560" height="40" rx="20" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="146" y="100" font-size="15">tacos near me</text>
      <circle cx="640" cy="94" r="9" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <line x1="647" y1="101" x2="656" y2="110" stroke="var(--teal,#1F4E5B)" stroke-width="2" stroke-linecap="round"/>
    </g>
    <!-- the map strip with three pins -->
    <g data-anim="rise" style="--delay:420ms">
      <rect x="120" y="130" width="560" height="84" rx="10" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <path d="M120 188 q140 -30 280 -8 q140 22 280 -10" fill="none" stroke="var(--line-dark,#D4CCBC)" stroke-width="2"/>
      <g fill="var(--rust,#B8541A)">
        <path d="M250 152 a13 13 0 1 0 0.01 0 z" />
        <path d="M250 188 l-9 -16 a13 13 0 0 1 18 0 z" />
        <path d="M408 158 a13 13 0 1 0 0.01 0 z" />
        <path d="M408 194 l-9 -16 a13 13 0 0 1 18 0 z" />
        <path d="M556 150 a13 13 0 1 0 0.01 0 z" />
        <path d="M556 186 l-9 -16 a13 13 0 0 1 18 0 z" />
      </g>
      <circle cx="250" cy="152" r="6" fill="var(--cream,#FAF7F2)"/>
      <circle cx="408" cy="158" r="6" fill="var(--cream,#FAF7F2)"/>
      <circle cx="556" cy="150" r="6" fill="var(--cream,#FAF7F2)"/>
    </g>
    <!-- the three pack slots -->
    <g data-anim="rise" style="--delay:720ms">
      <rect x="120" y="226" width="560" height="44" rx="8" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <circle cx="146" cy="248" r="11" fill="var(--teal,#1F4E5B)"/>
      <text x="146" y="252" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">1</text>
      <rect x="170" y="240" width="210" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <text class="text-rust" x="600" y="252" font-size="13" letter-spacing="0.1em">★★★★★</text>

      <rect x="120" y="278" width="560" height="44" rx="8" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <circle cx="146" cy="300" r="11" fill="var(--teal,#1F4E5B)"/>
      <text x="146" y="304" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">2</text>
      <rect x="170" y="292" width="244" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <text class="text-rust" x="600" y="304" font-size="13" letter-spacing="0.1em">★★★★☆</text>

      <rect x="120" y="330" width="560" height="44" rx="8" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <circle cx="146" cy="352" r="11" fill="var(--teal,#1F4E5B)"/>
      <text x="146" y="356" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">3</text>
      <rect x="170" y="344" width="190" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <text class="text-rust" x="600" y="356" font-size="13" letter-spacing="0.1em">★★★★★</text>
    </g>
    <!-- the blue links, below the fold line -->
    <g data-anim="fade" style="--delay:1100ms">
      <line x1="120" y1="392" x2="680" y2="392" stroke="var(--line-dark,#D4CCBC)" stroke-dasharray="5 4"/>
      <text class="text-stone" x="120" y="386" font-size="10" letter-spacing="0.12em">THE BLUE LINKS · BELOW</text>
      <rect x="120" y="406" width="300" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
      <rect x="120" y="422" width="420" height="7" rx="3" fill="var(--line,#E8E2D6)"/>
    </g>
    <text class="text-stone" x="400" y="470" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1500ms">Three slots, above the regular results — the best spot on the page.</text>
  </g>

  <!-- ============ WHY — most taps go to the three ============ -->
  <g class="explainer-scene" data-scene-id="why">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Where the local taps go</text>
    <!-- the pack -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="80" y="96" width="320" height="44" rx="8" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <circle cx="106" cy="118" r="11" fill="var(--teal,#1F4E5B)"/>
      <text x="106" y="122" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">1</text>
      <rect x="130" y="110" width="200" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="80" y="150" width="320" height="44" rx="8" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <circle cx="106" cy="172" r="11" fill="var(--teal,#1F4E5B)"/>
      <text x="106" y="176" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">2</text>
      <rect x="130" y="164" width="230" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="80" y="204" width="320" height="44" rx="8" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <circle cx="106" cy="226" r="11" fill="var(--teal,#1F4E5B)"/>
      <text x="106" y="230" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">3</text>
      <rect x="130" y="218" width="180" height="9" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <text class="text-teal" x="80" y="278" font-size="12" letter-spacing="0.1em">THE THREE · WHERE TAPS LAND</text>
    </g>
    <!-- arrows of attention flowing into the three -->
    <g data-anim="grow-x" style="--delay:700ms">
      <line x1="470" y1="118" x2="410" y2="118" stroke="var(--teal,#1F4E5B)" stroke-width="3"/>
      <path d="M410 118 l12 -6 v12 z" fill="var(--teal,#1F4E5B)"/>
      <line x1="470" y1="172" x2="410" y2="172" stroke="var(--teal,#1F4E5B)" stroke-width="3"/>
      <path d="M410 172 l12 -6 v12 z" fill="var(--teal,#1F4E5B)"/>
      <line x1="470" y1="226" x2="410" y2="226" stroke="var(--teal,#1F4E5B)" stroke-width="3"/>
      <path d="M410 226 l12 -6 v12 z" fill="var(--teal,#1F4E5B)"/>
    </g>
    <text class="text-soft" x="490" y="176" font-size="15" font-style="italic" data-anim="fade" style="--delay:1050ms">Most local taps<tspan x="490" dy="22">go to those three.</tspan></text>
    <!-- below the fold: a better site nobody sees -->
    <g data-anim="fade" style="--delay:1350ms">
      <line x1="80" y1="320" x2="720" y2="320" stroke="var(--rust,#B8541A)" stroke-dasharray="6 4"/>
      <text class="text-rust" x="80" y="312" font-size="11" letter-spacing="0.12em">BELOW THE FOLD</text>
      <rect x="80" y="338" width="280" height="64" rx="10" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="100" y="366" font-size="13">your website</text>
      <text class="text-soft" x="100" y="388" font-size="13" font-style="italic">— maybe the better one</text>
      <text class="text-rust" x="400" y="378" font-size="14">The best page does not win if nobody scrolls to it.</text>
    </g>
  </g>

  <!-- ============ PICKS — relevance / distance / prominence ============ -->
  <g class="explainer-scene" data-scene-id="picks">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">How Google fills the three slots</text>
    <!-- relevance — movable (teal) -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="50" y="110" width="220" height="200" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="160" y="160" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="24">Relevance</text>
      <text class="text-stone" x="160" y="190" text-anchor="middle" font-size="13">does your category</text>
      <text class="text-stone" x="160" y="210" text-anchor="middle" font-size="13">+ profile match</text>
      <text class="text-stone" x="160" y="230" text-anchor="middle" font-size="13">the search</text>
      <rect x="98" y="262" width="124" height="24" rx="12" fill="var(--teal,#1F4E5B)"/>
      <text x="160" y="278" text-anchor="middle" font-size="11" fill="var(--cream,#FAF7F2)" letter-spacing="0.08em">MOVABLE</text>
    </g>
    <!-- distance — fixed (greyed) -->
    <g data-anim="rise" style="--delay:420ms">
      <rect x="290" y="110" width="220" height="200" rx="14" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="400" y="160" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="24">Distance</text>
      <text class="text-stone" x="400" y="190" text-anchor="middle" font-size="13">how close you are</text>
      <text class="text-stone" x="400" y="210" text-anchor="middle" font-size="13">to the searcher</text>
      <rect x="338" y="262" width="124" height="24" rx="12" fill="none" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="400" y="278" text-anchor="middle" font-size="11" letter-spacing="0.08em">FIXED</text>
    </g>
    <!-- prominence — movable (teal) -->
    <g data-anim="rise" style="--delay:700ms">
      <rect x="530" y="110" width="220" height="200" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="640" y="160" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="24">Prominence</text>
      <text class="text-stone" x="640" y="190" text-anchor="middle" font-size="13">reviews, activity,</text>
      <text class="text-stone" x="640" y="210" text-anchor="middle" font-size="13">how known</text>
      <text class="text-stone" x="640" y="230" text-anchor="middle" font-size="13">you are</text>
      <rect x="578" y="262" width="124" height="24" rx="12" fill="var(--teal,#1F4E5B)"/>
      <text x="640" y="278" text-anchor="middle" font-size="11" fill="var(--cream,#FAF7F2)" letter-spacing="0.08em">MOVABLE</text>
    </g>
    <text class="text-stone" x="400" y="370" text-anchor="middle" font-size="15" font-style="italic" data-anim="fade" style="--delay:1150ms">You cannot move your address — but two of the three you can.</text>
  </g>

  <!-- ============ MOVE — the weekly loop feeding the pack ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The work that pays off here</text>
    <!-- the weekly loop -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="70" y="120" width="190" height="64" rx="10" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="165" y="150" text-anchor="middle" font-size="15">Right category</text>
      <text class="text-stone" x="165" y="170" text-anchor="middle" font-size="12">relevance</text>
      <rect x="70" y="208" width="190" height="64" rx="10" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="165" y="238" text-anchor="middle" font-size="15">Fresh profile</text>
      <text class="text-stone" x="165" y="258" text-anchor="middle" font-size="12">activity</text>
      <rect x="70" y="296" width="190" height="64" rx="10" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="165" y="326" text-anchor="middle" font-size="15">Answered reviews</text>
      <text class="text-stone" x="165" y="346" text-anchor="middle" font-size="12">prominence</text>
    </g>
    <!-- arrows feeding the pack -->
    <g data-anim="grow-x" style="--delay:780ms">
      <line x1="260" y1="152" x2="470" y2="216" stroke="var(--teal,#1F4E5B)" stroke-width="2.5"/>
      <line x1="260" y1="240" x2="470" y2="240" stroke="var(--teal,#1F4E5B)" stroke-width="2.5"/>
      <line x1="260" y1="328" x2="470" y2="264" stroke="var(--teal,#1F4E5B)" stroke-width="2.5"/>
      <path d="M470 216 l-14 -1 l7 11 z" fill="var(--teal,#1F4E5B)"/>
      <path d="M470 240 l-12 -6 v12 z" fill="var(--teal,#1F4E5B)"/>
      <path d="M470 264 l-7 -11 l14 -1 z" fill="var(--teal,#1F4E5B)"/>
    </g>
    <!-- the pack, won -->
    <g data-anim="rise" style="--delay:1050ms">
      <rect x="480" y="176" width="250" height="128" rx="14" fill="rgba(31,78,91,0.10)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="605" y="212" text-anchor="middle" font-size="11" letter-spacing="0.12em">THE THREE SLOTS</text>
      <rect x="504" y="226" width="202" height="18" rx="6" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="504" y="250" width="202" height="18" rx="6" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="504" y="274" width="202" height="18" rx="6" fill="var(--teal,#1F4E5B)"/>
      <text x="605" y="287" text-anchor="middle" font-size="11" fill="var(--cream,#FAF7F2)" letter-spacing="0.06em">YOU</text>
    </g>
    <text class="text-stone" x="400" y="400" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1450ms">Distance you cannot change. The other two, every week.</text>
  </g>

  <!-- ============ LAND — the punchline ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="166" text-anchor="middle">The map pack</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="244" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">The new front door.</text>
    <!-- three seats -->
    <g data-anim="fade" style="--delay:760ms">
      <circle cx="346" cy="300" r="16" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <text class="text-teal" x="346" y="305" text-anchor="middle" font-size="14">1</text>
      <circle cx="400" cy="300" r="16" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <text class="text-teal" x="400" y="305" text-anchor="middle" font-size="14">2</text>
      <circle cx="454" cy="300" r="16" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <text class="text-teal" x="454" y="305" text-anchor="middle" font-size="14">3</text>
    </g>
    <text data-anim="fade" style="--delay:1020ms" class="text-stone" x="400" y="356" text-anchor="middle" font-size="15">Three seats — earn one by being the obvious, active, nearby answer.</text>
    <line data-anim="grow-x" style="--delay:1240ms; transform-origin:center" x1="340" y1="384" x2="460" y2="384" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
