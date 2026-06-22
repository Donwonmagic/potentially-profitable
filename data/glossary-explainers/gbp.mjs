// Glossary explainer — GOOGLE BUSINESS PROFILE
//
// What a Google Business Profile actually is (the panel Google builds and
// controls when someone searches your name or "restaurants near me"), why
// it is the real decision surface — not the website — for the diner picking
// a place tonight, the three levers that keep you in the local map pack, and
// the weekly storefront habits that tend it. Qualitative throughout: the
// only traffic framing is the widely-true "for most restaurants it gets far
// more views than the website." No statistics, no percentages, no operator
// data anywhere.

export default {
  term_slug: 'gbp',
  term_head: 'Google Business Profile, in 90 seconds.',
  subhead:   'Your real homepage — the one most diners never click past.',
  duration_ms: 73000,
  audio_url: null,
  scenes_es: [
    { id: 'what',  caption: 'Tu Perfil de Empresa en Google es el panel que aparece cuando alguien busca tu nombre o "restaurantes cerca de mí": el horario, las fotos, las reseñas, el pin del mapa, y los botones de llamar, cómo llegar y pedir. Es gratis, y Google decide cómo se ve.' },
    { id: 'real',  caption: 'Para la mayoría de los restaurantes, la ficha de Google recibe muchas más visitas que el sitio web. El comensal que decide dónde cenar esta noche lee la ficha — las fotos, las reseñas más recientes, si dice abierto ahora — y reserva o se sube al carro sin entrar nunca a tu página.' },
    { id: 'three', caption: 'Tres palancas hacen casi todo el trabajo: horario exacto y la categoría correcta, un goteo constante de fotos nuevas, y reseñas respondidas. Un horario viejo o una categoría equivocada te sacan, sin ruido, del paquete de mapas local — justo donde se toma la decisión.' },
    { id: 'move',  caption: 'Así que trátalo como la fachada que es. Corrige el horario antes de cada feriado, sube unas fotos cada semana, y responde cada reseña — buena y mala — en menos de un día.' },
    { id: 'land',  caption: 'Tu sitio web es donde cuentas tu historia. Tu ficha de Google es donde de verdad se toma la decisión. Cuida la ficha primero.' },
  ],
  scenes: [
    { id: 'what',  ms: 14000, caption: 'Your Google Business Profile is the panel that appears when someone searches your name or "restaurants near me" — hours, photos, reviews, the map pin, and the call, directions, and order buttons. It is free, and Google controls the layout.' },
    { id: 'real',  ms: 16000, caption: 'For most restaurants it gets far more views than the website. The diner deciding where to eat tonight reads the profile — the photos, the latest reviews, whether it says open now — and books or drives over without ever clicking through to your site.' },
    { id: 'three', ms: 15000, caption: 'Three levers do most of the work: accurate hours and the right category, a steady drip of fresh photos, and answered reviews. Stale hours or a wrong category quietly drop you out of the local map pack — where the decision happens.' },
    { id: 'move',  ms: 14000, caption: 'So treat it like the storefront it is. Fix hours before every holiday, post a few photos every week, and reply to every review — good and bad — within a day.' },
    { id: 'land',  ms: 14000, caption: 'Your website is where you tell your story. Your Google profile is where the decision actually gets made. Tend the profile first.' },
  ],
  svg: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of what a Google Business Profile is and why it is the real decision surface for diners">
  <defs>
    <linearGradient id="gb-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#gb-bg)"/>

  <!-- ============ WHAT — the profile panel Google builds ============ -->
  <g class="explainer-scene" data-scene-id="what">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The panel Google builds</text>
    <g data-anim="rise" style="--delay:160ms">
      <!-- the profile card -->
      <rect x="220" y="80" width="360" height="360" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="244" y="124" font-family="Fraunces, Georgia, serif" font-size="24">The Corner Table</text>
      <text class="text-stone" x="244" y="146" font-size="12">Neighborhood bistro · $$</text>
      <!-- stars + open now -->
      <text class="text-rust" x="244" y="176" font-size="16" letter-spacing="0.12em">★★★★★</text>
      <text class="text-teal" x="356" y="176" font-size="12">Open now · until 10 PM</text>
      <line x1="244" y1="192" x2="556" y2="192" stroke="var(--line,#E8E2D6)"/>
    </g>
    <!-- photo strip -->
    <g data-anim="fade" style="--delay:700ms">
      <rect x="244" y="206" width="96" height="64" rx="4" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <rect x="352" y="206" width="96" height="64" rx="4" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <rect x="460" y="206" width="96" height="64" rx="4" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="244" y="294" font-size="11" letter-spacing="0.1em">PHOTOS · HOURS · REVIEWS · MAP PIN</text>
    </g>
    <!-- action buttons -->
    <g data-anim="rise" style="--delay:1050ms">
      <rect x="244" y="312" width="96" height="40" rx="20" fill="var(--teal,#1F4E5B)"/>
      <text x="292" y="337" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">Call</text>
      <rect x="352" y="312" width="96" height="40" rx="20" fill="var(--teal,#1F4E5B)"/>
      <text x="400" y="337" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">Directions</text>
      <rect x="460" y="312" width="96" height="40" rx="20" fill="var(--rust,#B8541A)"/>
      <text x="508" y="337" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">Order</text>
    </g>
    <text class="text-stone" x="400" y="408" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:1450ms">Free — and Google controls the layout.</text>
  </g>

  <!-- ============ REAL — profile views vs website views (qualitative) ============ -->
  <g class="explainer-scene" data-scene-id="real">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Where diners actually look</text>
    <!-- big profile block -->
    <g data-anim="grow-x" style="--delay:200ms">
      <rect x="80" y="150" width="470" height="150" rx="10" fill="var(--teal,#1F4E5B)"/>
      <text x="100" y="196" font-size="13" letter-spacing="0.1em" fill="var(--cream,#FAF7F2)">GOOGLE PROFILE</text>
      <text x="100" y="252" font-family="Fraunces, Georgia, serif" font-size="34" fill="var(--cream,#FAF7F2)">Most of the looking</text>
    </g>
    <!-- small website block -->
    <g data-anim="grow-x" style="--delay:900ms">
      <rect x="80" y="320" width="150" height="70" rx="10" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="100" y="352" font-size="12" letter-spacing="0.1em">WEBSITE</text>
      <text class="text-soft" x="100" y="378" font-size="14">a fraction</text>
    </g>
    <text class="text-soft" x="560" y="350" font-size="15" font-style="italic" data-anim="fade" style="--delay:1400ms">Far more eyes land here<tspan x="560" dy="22">than on your site.</tspan></text>
  </g>

  <!-- ============ THREE — the levers ============ -->
  <g class="explainer-scene" data-scene-id="three">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Three levers that move it</text>
    <g data-anim="rise" style="--delay:140ms">
      <rect x="60"  y="120" width="210" height="150" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="165" y="172" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">Hours</text>
      <text class="text-teal" x="165" y="200" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">+ category</text>
      <text class="text-stone" x="165" y="236" text-anchor="middle" font-size="12">accurate &amp; correct</text>
    </g>
    <g data-anim="rise" style="--delay:420ms">
      <rect x="295" y="120" width="210" height="150" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="400" y="172" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">Fresh</text>
      <text class="text-teal" x="400" y="200" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">photos</text>
      <text class="text-stone" x="400" y="236" text-anchor="middle" font-size="12">a steady drip</text>
    </g>
    <g data-anim="rise" style="--delay:700ms">
      <rect x="530" y="120" width="210" height="150" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="635" y="172" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">Answered</text>
      <text class="text-teal" x="635" y="200" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">reviews</text>
      <text class="text-stone" x="635" y="236" text-anchor="middle" font-size="12">good and bad</text>
    </g>
    <g data-anim="fade" style="--delay:1100ms">
      <rect x="170" y="320" width="460" height="74" rx="12" fill="rgba(184,84,26,0.08)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="400" y="352" text-anchor="middle" font-size="14">Stale hours or a wrong category drop you out of</text>
      <text class="text-rust" x="400" y="376" text-anchor="middle" font-size="14" font-style="italic">the local map pack — where the decision happens.</text>
    </g>
  </g>

  <!-- ============ MOVE — the weekly checklist ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Tend it like a storefront</text>
    <g data-anim="rise" style="--delay:160ms">
      <rect x="160" y="110" width="480" height="290" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="190" y="152" font-size="12" letter-spacing="0.12em">THE STOREFRONT HABIT</text>
      <line x1="190" y1="170" x2="610" y2="170" stroke="var(--line,#E8E2D6)"/>
    </g>
    <g data-anim="rise" style="--delay:480ms">
      <rect x="190" y="196" width="22" height="22" rx="4" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M195 207 l5 5 l8 -11" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text class="text-soft" x="228" y="213" font-size="16">Fix hours before every holiday</text>
    </g>
    <g data-anim="rise" style="--delay:720ms">
      <rect x="190" y="252" width="22" height="22" rx="4" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M195 263 l5 5 l8 -11" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text class="text-soft" x="228" y="269" font-size="16">Post a few photos every week</text>
    </g>
    <g data-anim="rise" style="--delay:960ms">
      <rect x="190" y="308" width="22" height="22" rx="4" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M195 319 l5 5 l8 -11" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text class="text-soft" x="228" y="325" font-size="16">Reply to every review within a day</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="13" font-style="italic" data-anim="fade" style="--delay:1300ms">Small habits, kept — not a one-time setup.</text>
  </g>

  <!-- ============ LAND — the punchline ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="170" text-anchor="middle">Google Business Profile</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="250" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">Tend the profile first.</text>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="312" text-anchor="middle" font-size="15">The website tells your story. The profile is where the decision gets made.</text>
    <line data-anim="grow-x" style="--delay:1020ms; transform-origin:center" x1="340" y1="344" x2="460" y2="344" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
