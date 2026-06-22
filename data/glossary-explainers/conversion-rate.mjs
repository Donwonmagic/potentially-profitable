// Glossary explainer — CONVERSION RATE
//
// What conversion rate measures (the share of visitors who do the thing
// you wanted), why lifting it usually beats buying more traffic, where it
// leaks through friction, and how to find and fix the worst step. All
// figures are one illustrative worked example — a thousand visitors, a
// reservation page — not measured operator data.

export default {
  term_slug: 'conversion-rate',
  term_head: 'Conversion rate, in 90 seconds.',
  subhead:   'The metric that turns traffic into covers — or does not.',
  duration_ms: 73000,
  audio_url: null,
  scenes_es: [
    { id: 'define', caption: 'La tasa de conversión es la proporción de visitantes que hacen lo que querías que hicieran — reservar una mesa, empezar un pedido, tocar para llamar. Mil personas entran a tu página de reservas, veinte reservan: esa es una tasa de conversión del dos por ciento.' },
    { id: 'beats',  caption: 'Los operadores persiguen más tráfico. Pero duplicar tu conversión suele ser más barato y más rápido que duplicar tus visitantes. Las mismas mil personas al cuatro por ciento en vez del dos son el doble de reservas — con cero dólares extra gastados en marketing.' },
    { id: 'leaks',  caption: 'Se escapa por la fricción. Un widget de reservas a tres toques de distancia, un número de teléfono que no es tocar-para-llamar en el celular, un menú que es un PDF lento. Cada paso de más va dejando ir, en silencio, a la gente que ya estaba lista para decir que sí.' },
    { id: 'move',   caption: 'Así que mira el embudo — visitantes, luego página, luego acción. Encuentra el paso con la mayor caída y quita una sola pieza de fricción. Un toque menos, un botón más claro. Medido, no adivinado.' },
    { id: 'land',   caption: 'El tráfico es quién apareció. La conversión es a quién no perdiste. Arregla la fuga antes de comprar más agua.' },
  ],
  scenes: [
    { id: 'define', ms: 13000, caption: 'Conversion rate is the share of visitors who do the thing you wanted — book a table, start an order, tap to call. A thousand people land on your reservation page, twenty book: that is a two percent conversion rate.' },
    { id: 'beats',  ms: 16000, caption: 'Operators chase more traffic. But doubling your conversion is usually cheaper and faster than doubling your visitors. The same thousand people at four percent instead of two is twice the bookings — with zero extra spent on marketing.' },
    { id: 'leaks',  ms: 15000, caption: 'It leaks through friction. A reservation widget three taps deep, a phone number that is not click-to-call on a phone, a menu that is a slow PDF. Every extra step quietly sheds the people who were ready to say yes.' },
    { id: 'move',   ms: 15000, caption: 'So watch the funnel — visitors, then page, then action. Find the step with the biggest drop-off and remove one piece of friction. One tap fewer, one clearer button. Measured, not guessed.' },
    { id: 'land',   ms: 14000, caption: 'Traffic is who showed up. Conversion is who you did not lose. Fix the leak before you buy more water.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant conversion rate: visitors becoming bookings, why lifting conversion beats buying traffic, and where it leaks">
  <defs>
    <linearGradient id="cr-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#cr-bg)"/>

  <!-- ============ DEFINE ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">What it measures</text>
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="150" y="200" text-anchor="middle" font-size="12" letter-spacing="0.1em">LANDED ON THE PAGE</text>
      <text class="text-soft" x="150" y="256" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44">1,000</text>
      <text class="text-stone" x="150" y="284" text-anchor="middle" font-size="13">visitors</text>
    </g>
    <g data-anim="rise" style="--delay:600ms">
      <text class="text-stone" x="400" y="200" text-anchor="middle" font-size="12" letter-spacing="0.1em">BOOKED A TABLE</text>
      <text class="text-soft" x="400" y="256" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44">20</text>
      <text class="text-stone" x="400" y="284" text-anchor="middle" font-size="13">reservations</text>
    </g>
    <text class="text-stone" x="610" y="248" text-anchor="middle" font-size="34" data-anim="fade" style="--delay:1000ms">=</text>
    <g data-anim="rise" style="--delay:1300ms">
      <text class="text-rust" x="700" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="72">2%</text>
    </g>
    <text class="text-stone" x="400" y="372" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">20 of 1,000 do the thing you wanted. That is the rate.</text>
  </g>

  <!-- ============ BEATS MORE TRAFFIC ============ -->
  <g class="explainer-scene" data-scene-id="beats">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Lift the rate, not the crowd</text>
    <!-- both columns start from the SAME 1,000 visitors -->
    <text class="text-stone" x="400" y="104" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:120ms">Same 1,000 visitors · zero extra spend</text>
    <!-- column A: 2% -> 20 -->
    <g data-anim="rise" style="--delay:300ms">
      <text class="text-stone" x="230" y="150" text-anchor="middle" font-size="11" letter-spacing="0.1em">AT 2%</text>
      <rect x="160" y="300" width="140" height="44" rx="6" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:500ms"/>
      <text x="230" y="328" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="20" fill="var(--cream,#FAF7F2)">20</text>
      <text class="text-stone" x="230" y="372" text-anchor="middle" font-size="13">bookings</text>
    </g>
    <!-- column B: 4% -> 40 (taller bar, twice the height of the 2% bar) -->
    <g data-anim="rise" style="--delay:800ms">
      <text class="text-stone" x="570" y="150" text-anchor="middle" font-size="11" letter-spacing="0.1em">AT 4%</text>
      <rect x="500" y="256" width="140" height="88" rx="6" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:1000ms"/>
      <text x="570" y="308" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="26" fill="var(--cream,#FAF7F2)">40</text>
      <text class="text-stone" x="570" y="372" text-anchor="middle" font-size="13">bookings</text>
    </g>
    <text class="text-teal" x="400" y="420" text-anchor="middle" font-size="15" font-style="italic" data-anim="fade" style="--delay:1500ms">Double the rate, double the bookings — for nothing more.</text>
  </g>

  <!-- ============ WHERE IT LEAKS ============ -->
  <g class="explainer-scene" data-scene-id="leaks">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Friction sheds the ready</text>
    <!-- a funnel: wide at top (ready visitors), narrowing past each friction step -->
    <g data-anim="fade" style="--delay:120ms">
      <polygon points="180,110 620,110 470,400 330,400" fill="var(--cream-2,#F3EEE3)" stroke="var(--line,#E8E2D6)"/>
    </g>
    <text class="text-stone" x="400" y="138" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:300ms">people ready to say yes</text>
    <!-- step 1: 3-tap widget -->
    <g data-anim="rise" style="--delay:500ms">
      <line x1="206" y1="190" x2="594" y2="190" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="5 4"/>
      <text class="text-rust" x="610" y="194" font-size="13">reservation widget · 3 taps deep</text>
    </g>
    <!-- step 2: no click-to-call -->
    <g data-anim="rise" style="--delay:900ms">
      <line x1="240" y1="260" x2="560" y2="260" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="5 4"/>
      <text class="text-rust" x="576" y="264" font-size="13">phone not click-to-call</text>
    </g>
    <!-- step 3: slow PDF -->
    <g data-anim="rise" style="--delay:1300ms">
      <line x1="274" y1="330" x2="526" y2="330" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="5 4"/>
      <text class="text-rust" x="542" y="334" font-size="13">menu is a slow PDF</text>
    </g>
    <text class="text-soft" x="400" y="388" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:1700ms">the few who push through</text>
  </g>

  <!-- ============ THE MOVE ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Find the biggest drop, fix one thing</text>
    <!-- three funnel stages as falling bars: visitors -> page -> action -->
    <g data-anim="rise" style="--delay:140ms">
      <text class="text-stone" x="120" y="150" text-anchor="middle" font-size="11" letter-spacing="0.1em">VISITORS</text>
      <rect x="70" y="170" width="100" height="220" rx="6" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:300ms"/>
      <text x="120" y="290" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">1,000</text>
    </g>
    <g data-anim="rise" style="--delay:500ms">
      <text class="text-stone" x="300" y="150" text-anchor="middle" font-size="11" letter-spacing="0.1em">REACHED PAGE</text>
      <rect x="250" y="240" width="100" height="150" rx="6" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:660ms"/>
      <text x="300" y="320" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="20" fill="var(--cream,#FAF7F2)">650</text>
    </g>
    <!-- biggest drop is page -> action: highlight this step -->
    <g data-anim="rise" style="--delay:900ms">
      <text class="text-rust" x="540" y="150" text-anchor="middle" font-size="11" letter-spacing="0.1em">TOOK ACTION</text>
      <rect x="490" y="360" width="100" height="30" rx="6" fill="var(--rust,#B8541A)" data-anim="grow-x" style="--delay:1060ms"/>
      <text x="540" y="382" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="15" fill="var(--cream,#FAF7F2)">20</text>
    </g>
    <!-- the highlighted gap: biggest drop-off, one step removed -->
    <g data-anim="fade" style="--delay:1400ms">
      <rect x="350" y="240" width="240" height="150" fill="rgba(184,84,26,0.08)" stroke="var(--rust,#B8541A)" stroke-dasharray="4 3"/>
      <text class="text-rust" x="660" y="300" font-size="14" font-style="italic">biggest drop</text>
      <text class="text-teal" x="660" y="328" font-size="13">remove one tap here</text>
    </g>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="170" text-anchor="middle">Conversion rate</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="248" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="38" fill="var(--ink,#14161A)">Who you did not lose.</text>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="308" text-anchor="middle" font-size="15" font-style="italic">Traffic is who showed up. Fix the leak before you buy more water.</text>
    <line data-anim="grow-x" style="--delay:1100ms; transform-origin:center" x1="340" y1="338" x2="460" y2="338" stroke="var(--rust,#B8541A)" stroke-width="2"/>
  </g>
</svg>`,
};
