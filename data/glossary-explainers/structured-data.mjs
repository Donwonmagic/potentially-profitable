// Glossary explainer — STRUCTURED DATA
//
// What structured data actually is (a hidden, machine-readable label written
// in a format called schema, stating in plain code what a page is — a
// restaurant, its hours, a dish's price), why it exists (search engines and
// AI do not want to guess what "open till 10" means), what it earns (the rich
// result — stars, hours, menu in the search — and an AI Overview that can
// quote your price without inventing one), and the one job that is actually
// yours (most platforms emit the label; you make sure it MATCHES the page —
// a label that disagrees with the page is worse than none). The only figure
// is an illustrative $14 dish price — no measured data, no invented stats.

export default {
  term_slug: 'structured-data',
  term_head: 'Structured data, in 90 seconds.',
  subhead:   'The label that lets a search engine quote you with confidence.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'label',  caption: 'Los datos estructurados son una etiqueta oculta y legible por máquinas en tu página — escrita en un formato que se llama schema — que dice en código sencillo: esto es un restaurante, este es el horario, este plato cuesta catorce dólares. Las personas leen la página; las máquinas leen la etiqueta.' },
    { id: 'guess',  caption: 'Los buscadores y la IA no quieren adivinar. "Abierto hasta las 10" en una página podría significar hoy, o los viernes, o el año pasado. La etiqueta elimina la adivinanza — horario, precio, calificación, dirección, dichos de una forma que la máquina no puede malinterpretar.' },
    { id: 'payoff', caption: 'Así es como te ganas el resultado enriquecido — las estrellas, el horario, el menú apareciendo dentro del propio buscador — y así un AI Overview puede citar tu precio sin inventarlo. Sin etiqueta, no hay cita con confianza.' },
    { id: 'match',  caption: 'No la escribes a mano. La mayoría de las plataformas la emiten; tu trabajo es asegurarte de que COINCIDA con la página — el mismo horario, el mismo precio — y que cubra el restaurante, el menú, el horario. Una etiqueta que contradice la página es peor que ninguna.' },
    { id: 'land',   caption: 'Los datos estructurados son tú diciéndole a la máquina qué eres, en su propio idioma. Dilo con claridad, o déjalo a la adivinanza.' },
  ],
  scenes: [
    { id: 'label',  ms: 14000, caption: 'Structured data is a hidden, machine-readable label on your page — written in a format called schema — that says in plain code: this is a restaurant, these are the hours, this dish costs fourteen dollars. Humans read the page; machines read the label.' },
    { id: 'guess',  ms: 16000, caption: 'Search engines and AI do not want to guess. "Open till 10" on a page could mean today, or Fridays, or last year. The label removes the guesswork — hours, price, rating, address, stated in a way the machine cannot misread.' },
    { id: 'payoff', ms: 15000, caption: 'That is how you earn the rich result — the stars, the hours, the menu showing up right in the search — and how an AI Overview can quote your price without making one up. No label, no confident quote.' },
    { id: 'match',  ms: 15000, caption: 'You do not hand-write it. Most platforms emit it; your job is to make sure it matches the page — same hours, same price — and covers the restaurant, the menu, the hours. A label that disagrees with the page is worse than none.' },
    { id: 'land',   ms: 14000, caption: 'Structured data is you telling the machine what you are, in its own language. Say it clearly, or leave it to guess.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of how structured data labels a restaurant page so a search engine can quote it with confidence">
  <defs>
    <linearGradient id="sd-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#sd-bg)"/>

  <!-- ============ LABEL ============ -->
  <g class="explainer-scene" data-scene-id="label">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The hidden label</text>
    <!-- the page humans read -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="190" y="104" text-anchor="middle" font-size="11" letter-spacing="0.12em">HUMANS READ THIS</text>
      <rect x="80" y="120" width="220" height="290" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="106" y="168" font-family="Fraunces, Georgia, serif" font-size="22">Corner Diner</text>
      <rect x="106" y="190" width="168" height="8" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="106" y="208" width="168" height="8" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <rect x="106" y="226" width="130" height="8" rx="4" fill="var(--cream-2,#F3EEE3)"/>
      <text class="text-stone" x="106" y="290" font-size="13">Open till 10</text>
      <line x1="106" y1="306" x2="274" y2="306" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="106" y="338" font-size="13">Skillet burger</text>
      <text class="text-soft" x="274" y="338" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="18">$14</text>
    </g>
    <!-- the label machines read -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-teal" x="610" y="104" text-anchor="middle" font-size="11" letter-spacing="0.12em">MACHINES READ THIS</text>
      <rect x="500" y="120" width="220" height="290" rx="12" fill="var(--teal,#1F4E5B)"/>
      <text x="524" y="160" font-family="Fraunces, Georgia, serif" font-size="11" letter-spacing="0.1em" fill="var(--cream,#FAF7F2)">SCHEMA · THE LABEL</text>
      <line x1="524" y1="174" x2="696" y2="174" stroke="rgba(250,247,242,0.3)"/>
      <text x="524" y="208" font-family="ui-monospace, monospace" font-size="13" fill="var(--cream,#FAF7F2)">type: Restaurant</text>
      <text x="524" y="240" font-family="ui-monospace, monospace" font-size="13" fill="var(--cream,#FAF7F2)">hours: till 10pm</text>
      <text x="524" y="272" font-family="ui-monospace, monospace" font-size="13" fill="var(--cream,#FAF7F2)">dish: burger</text>
      <text x="524" y="304" font-family="ui-monospace, monospace" font-size="13" fill="var(--cream,#FAF7F2)">price: $14</text>
      <text x="524" y="336" font-family="ui-monospace, monospace" font-size="13" fill="var(--cream,#FAF7F2)">address: ...</text>
    </g>
    <text class="text-stone" x="400" y="450" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1500ms">Same page. One side for people, one side for machines.</text>
  </g>

  <!-- ============ GUESS ============ -->
  <g class="explainer-scene" data-scene-id="guess">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">No more guessing</text>
    <!-- the ambiguous phrase -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="250" y="92" width="300" height="64" rx="10" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="400" y="133" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">&#8220;Open till 10&#8221;</text>
    </g>
    <!-- three guesses -->
    <g data-anim="fade" style="--delay:600ms">
      <line x1="400" y1="156" x2="180" y2="210" stroke="var(--line-dark,#D4CCBC)" stroke-dasharray="3 3"/>
      <line x1="400" y1="156" x2="400" y2="210" stroke="var(--line-dark,#D4CCBC)" stroke-dasharray="3 3"/>
      <line x1="400" y1="156" x2="620" y2="210" stroke="var(--line-dark,#D4CCBC)" stroke-dasharray="3 3"/>
      <text class="text-rust" x="180" y="234" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30">today?</text>
      <text class="text-rust" x="400" y="234" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30">Fridays?</text>
      <text class="text-rust" x="620" y="234" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30">last year?</text>
    </g>
    <!-- the label resolves it -->
    <g data-anim="rise" style="--delay:1200ms">
      <text class="text-teal" x="400" y="296" text-anchor="middle" font-size="24">&#8595;</text>
      <rect x="210" y="312" width="380" height="76" rx="10" fill="var(--teal,#1F4E5B)"/>
      <text x="400" y="345" text-anchor="middle" font-size="12" letter-spacing="0.1em" fill="rgba(250,247,242,0.75)">THE LABEL SAYS</text>
      <text x="400" y="373" text-anchor="middle" font-family="ui-monospace, monospace" font-size="16" fill="var(--cream,#FAF7F2)">closes: 22:00, every day</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">Hours, price, rating, address &#8212; stated so the machine cannot misread.</text>
  </g>

  <!-- ============ PAYOFF ============ -->
  <g class="explainer-scene" data-scene-id="payoff">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">What it earns: the rich result</text>
    <!-- the rich search result -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="140" y="92" width="520" height="200" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="172" y="134" font-family="Fraunces, Georgia, serif" font-size="22">Corner Diner</text>
      <!-- stars -->
      <g data-anim="fade" style="--delay:600ms">
        <text x="172" y="170" font-size="18" fill="var(--rust,#B8541A)">&#9733; &#9733; &#9733; &#9733; &#9733;</text>
        <text class="text-stone" x="280" y="170" font-size="13">rating &#183; reviews</text>
      </g>
      <!-- hours -->
      <g data-anim="fade" style="--delay:850ms">
        <text class="text-soft" x="172" y="202" font-size="14">Open &#183; closes 10 PM</text>
      </g>
      <!-- menu chip -->
      <g data-anim="fade" style="--delay:1100ms">
        <rect x="172" y="222" width="180" height="44" rx="8" fill="var(--cream-2,#F3EEE3)"/>
        <text class="text-stone" x="188" y="240" font-size="11" letter-spacing="0.06em">MENU</text>
        <text class="text-soft" x="188" y="258" font-size="13">Skillet burger</text>
        <text class="text-soft" x="338" y="258" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="15">$14</text>
      </g>
    </g>
    <!-- AI Overview quoting the price -->
    <g data-anim="rise" style="--delay:1300ms">
      <rect x="140" y="312" width="520" height="84" rx="10" fill="var(--cream,#FAF7F2)" stroke="var(--teal,#1F4E5B)" stroke-dasharray="4 3"/>
      <text class="text-teal" x="166" y="342" font-size="11" letter-spacing="0.1em">AI OVERVIEW</text>
      <text class="text-soft" x="166" y="372" font-size="15" font-style="italic">&#8220;The skillet burger runs $14.&#8221;</text>
    </g>
    <text class="text-stone" x="400" y="436" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">No label, no confident quote.</text>
  </g>

  <!-- ============ MATCH ============ -->
  <g class="explainer-scene" data-scene-id="match">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Your one job: make it match</text>
    <!-- matched pair (teal) -->
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-teal" x="210" y="108" text-anchor="middle" font-size="11" letter-spacing="0.1em">MATCHES &#183; TRUSTED</text>
      <!-- page -->
      <rect x="80" y="124" width="120" height="96" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="140" y="156" text-anchor="middle" font-size="11">PAGE</text>
      <text class="text-soft" x="140" y="192" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="24">$14</text>
      <!-- label -->
      <rect x="220" y="124" width="120" height="96" rx="8" fill="var(--teal,#1F4E5B)"/>
      <text x="280" y="156" text-anchor="middle" font-size="11" fill="rgba(250,247,242,0.75)">LABEL</text>
      <text x="280" y="192" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="24" fill="var(--cream,#FAF7F2)">$14</text>
      <text class="text-teal" x="210" y="248" text-anchor="middle" font-size="22">&#10003;</text>
    </g>
    <!-- mismatched pair (rust) -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-rust" x="590" y="108" text-anchor="middle" font-size="11" letter-spacing="0.1em">DISAGREES &#183; WORSE THAN NONE</text>
      <!-- page -->
      <rect x="460" y="124" width="120" height="96" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="520" y="156" text-anchor="middle" font-size="11">PAGE</text>
      <text class="text-soft" x="520" y="192" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="24">$14</text>
      <!-- label -->
      <rect x="600" y="124" width="120" height="96" rx="8" fill="var(--rust,#B8541A)"/>
      <text x="660" y="156" text-anchor="middle" font-size="11" fill="rgba(250,247,242,0.8)">LABEL</text>
      <text x="660" y="192" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="24" fill="var(--cream,#FAF7F2)">$12</text>
      <text class="text-rust" x="590" y="248" text-anchor="middle" font-size="22">&#10007;</text>
    </g>
    <!-- coverage row -->
    <g data-anim="fade" style="--delay:1500ms">
      <text class="text-stone" x="400" y="312" text-anchor="middle" font-size="13" letter-spacing="0.06em">AND COVER WHAT MATTERS</text>
      <rect x="206" y="330" width="120" height="40" rx="20" fill="var(--cream,#FAF7F2)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="266" y="355" text-anchor="middle" font-size="14">restaurant</text>
      <rect x="340" y="330" width="120" height="40" rx="20" fill="var(--cream,#FAF7F2)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="400" y="355" text-anchor="middle" font-size="14">menu</text>
      <rect x="474" y="330" width="120" height="40" rx="20" fill="var(--cream,#FAF7F2)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="534" y="355" text-anchor="middle" font-size="14">hours</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1900ms">Most platforms emit the label. You make sure it tells the truth.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="166" text-anchor="middle">Structured data</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="244" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="38" font-style="italic" fill="var(--ink,#14161A)">Tell it, or leave it to guess.</text>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="308" text-anchor="middle" font-size="14">You, telling the machine what you are &#8212; in its own language.</text>
    <line data-anim="grow-x" style="--delay:1020ms; transform-origin:center" x1="340" y1="338" x2="460" y2="338" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
