// Glossary explainer — MENU MIX
//
// Menu mix is the share each dish is of everything you sell. Because your
// "average margin" is really a weighted average, the mix — not the price —
// often decides the bottom line. Same menu, same prices: shift what sells
// and the margin moves with it. One illustrative worked example (two $15
// dishes, 70/30 vs 30/70) — no measured operator data, nothing else invented.

export default {
  term_slug: 'menu-mix',
  term_head: 'Menu mix, in 90 seconds.',
  subhead:   'Why what sells moves your margin more than what you charge.',
  duration_ms: 73000,
  audio_url: null,
  scenes_es: [
    { id: 'define', caption: 'El menu mix es la parte que representa cada plato del total de lo que vendes. Si la hamburguesa es una de cada cuatro cuentas y la ensalada es una de cada veinte, tu "margen promedio" en realidad es un promedio ponderado — lo manda lo que de verdad se vende.' },
    { id: 'lever',  caption: 'Aquí está lo que casi todos pasan por alto: puedes cambiar tu resultado final sin tocar un solo precio — solo moviendo el mix. Vende más del plato de margen alto y menos del de margen bajo, y el mismo menu a los mismos precios deja más dinero.' },
    { id: 'worked', caption: 'Dos platos, quince dólares cada uno. La pasta deja once; el bistec deja seis. Vende setenta de pasta a treinta de bistec y dejas nueve con cincuenta por cuenta. Inviértelo a treinta-setenta y dejas siete con cincuenta — mismos precios, dos dólares menos por cuenta, puro mix.' },
    { id: 'move',   caption: 'Así que diseña el mix: la posición en la carta, la descripción, la mención del mesero, el especial. Lleva al cliente hacia los platos que dejan más. Es la palanca de margen más barata que tienes, porque el cliente nunca ve un cambio de precio.' },
    { id: 'land',   caption: 'El precio es lo que cobras. El mix es lo que ellos eligen. Mueve el mix y el margen se mueve con él — sin que se note.' },
  ],
  scenes: [
    { id: 'define', ms: 13000, caption: 'Menu mix is the share each dish is of everything you sell. If the burger is a quarter of your covers and the salad is one in twenty, your "average margin" is really a weighted average — dominated by whatever actually moves.' },
    { id: 'lever',  ms: 15000, caption: 'Here is the part most operators miss: you can change your bottom line without touching a single price — just by shifting the mix. Sell more of the high-margin dish and less of the low one, and the same menu at the same prices makes more money.' },
    { id: 'worked', ms: 16000, caption: 'Two dishes, each fifteen dollars. The pasta keeps eleven; the steak keeps six. Sell seventy pasta to thirty steak and you keep nine dollars fifty a cover. Flip it to thirty-seventy and you keep seven-fifty — same prices, two dollars a cover less, purely from the mix.' },
    { id: 'move',   ms: 15000, caption: 'So engineer the mix: menu placement, the description, the server’s mention, the special. Steer guests toward the dishes that keep more. It is the cheapest margin lever you have, because the guest never sees a price change.' },
    { id: 'land',   ms: 14000, caption: 'Price is what you charge. Mix is what they pick. Move the mix and the margin moves with it — quietly.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant menu mix as a margin lever">
  <defs>
    <linearGradient id="mx-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#mx-bg)"/>

  <!-- ============ DEFINE ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The share of what sells</text>
    <text class="text-stone" x="80" y="120" font-size="11" letter-spacing="0.1em" data-anim="fade" style="--delay:120ms">EVERY COVER YOU SELL · 100%</text>
    <!-- stacked share bar across x=80..720 (width 640) -->
    <g data-anim="grow-x" style="--delay:300ms; transform-origin:80px 0">
      <!-- burger 25% = 160 wide -->
      <rect x="80"  y="150" width="160" height="64" fill="var(--rust,#B8541A)"/>
      <!-- pasta 40% = 256 wide -->
      <rect x="240" y="150" width="256" height="64" fill="var(--teal,#1F4E5B)"/>
      <!-- steak 20% = 128 wide -->
      <rect x="496" y="150" width="128" height="64" fill="var(--teal,#1F4E5B)" opacity="0.62"/>
      <!-- sides 10% = 64 wide -->
      <rect x="624" y="150" width="64"  height="64" fill="var(--rust,#B8541A)" opacity="0.55"/>
      <!-- salad 5% = 32 wide (the sliver) -->
      <rect x="688" y="150" width="32"  height="64" fill="var(--rust,#B8541A)" opacity="0.30"/>
    </g>
    <!-- labels -->
    <g data-anim="fade" style="--delay:900ms">
      <text x="160" y="240" text-anchor="middle" font-size="13" fill="var(--ink,#14161A)">burger · 25%</text>
      <text x="368" y="240" text-anchor="middle" font-size="13" fill="var(--ink,#14161A)">pasta · 40%</text>
      <text x="560" y="240" text-anchor="middle" font-size="13" fill="var(--ink,#14161A)">steak · 20%</text>
    </g>
    <!-- the sliver call-out -->
    <g data-anim="rise" style="--delay:1200ms">
      <line x1="704" y1="214" x2="704" y2="266" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <text class="text-rust" x="704" y="288" text-anchor="middle" font-size="12">salad · 5%</text>
      <text class="text-rust" x="704" y="306" text-anchor="middle" font-size="11">(1 in 20)</text>
    </g>
    <text class="text-soft" x="400" y="400" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1600ms">Your "average margin" is a weighted average — the big slices set it.</text>
  </g>

  <!-- ============ LEVER ============ -->
  <g class="explainer-scene" data-scene-id="lever">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Same prices, different mix</text>
    <!-- Menu A: low-margin heavy -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="90" y="100" width="270" height="250" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="114" y="138" font-size="11" letter-spacing="0.1em">SAME MENU · SAME PRICES</text>
      <text class="text-soft" x="114" y="180" font-size="14">Pasta — $15</text>
      <text class="text-soft" x="114" y="210" font-size="14">Steak — $15</text>
      <line x1="114" y1="232" x2="336" y2="232" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="114" y="262" font-size="12">mix tilts to low-margin</text>
      <line x1="114" y1="288" x2="336" y2="288" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="114" y="318" font-size="12">margin per cover</text>
      <text class="text-rust" x="336" y="320" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="26">less</text>
    </g>
    <!-- arrow -->
    <text class="text-stone" x="400" y="232" text-anchor="middle" font-size="30" data-anim="fade" style="--delay:800ms">→</text>
    <text class="text-stone" x="400" y="262" text-anchor="middle" font-size="12" font-style="italic" data-anim="fade" style="--delay:800ms">shift the mix</text>
    <!-- Menu B: high-margin heavy -->
    <g data-anim="rise" style="--delay:1000ms">
      <rect x="440" y="100" width="270" height="250" rx="14" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="464" y="138" font-size="11" letter-spacing="0.1em">SAME MENU · SAME PRICES</text>
      <text class="text-soft" x="464" y="180" font-size="14">Pasta — $15</text>
      <text class="text-soft" x="464" y="210" font-size="14">Steak — $15</text>
      <line x1="464" y1="232" x2="686" y2="232" stroke="var(--line,#E8E2D6)"/>
      <text class="text-teal" x="464" y="262" font-size="12">mix tilts to high-margin</text>
      <line x1="464" y1="288" x2="686" y2="288" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="464" y="318" font-size="12">margin per cover</text>
      <text class="text-teal" x="686" y="320" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="26">more</text>
    </g>
    <text class="text-soft" x="400" y="430" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1700ms">Not one price changed. The bottom line did.</text>
  </g>

  <!-- ============ WORKED ============ -->
  <g class="explainer-scene" data-scene-id="worked">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Two dishes · $15 each</text>
    <!-- the per-dish margins -->
    <g data-anim="fade" style="--delay:120ms">
      <text class="text-stone" x="80" y="96" font-size="13">Pasta keeps <tspan class="text-teal" font-family="Fraunces, Georgia, serif" font-size="18">$11</tspan> · Steak keeps <tspan class="text-rust" font-family="Fraunces, Georgia, serif" font-size="18">$6</tspan></text>
    </g>
    <!-- Case A: 70 pasta / 30 steak -->
    <g data-anim="rise" style="--delay:300ms">
      <rect x="80" y="120" width="300" height="200" rx="12" fill="var(--teal-tint,#E8F1F3)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="104" y="156" font-size="12" letter-spacing="0.1em">70% PASTA · 30% STEAK</text>
      <text class="text-stone" x="104" y="194" font-size="13">0.70 × $11 = $7.70</text>
      <text class="text-stone" x="104" y="220" font-size="13">0.30 × $6&nbsp; = $1.80</text>
      <line x1="104" y1="240" x2="356" y2="240" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="104" y="278" font-size="12">margin per cover</text>
      <text class="text-teal" x="356" y="300" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="40">$9.50</text>
    </g>
    <!-- Case B: 30 pasta / 70 steak -->
    <g data-anim="rise" style="--delay:800ms">
      <rect x="420" y="120" width="300" height="200" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="444" y="156" font-size="12" letter-spacing="0.1em">30% PASTA · 70% STEAK</text>
      <text class="text-stone" x="444" y="194" font-size="13">0.30 × $11 = $3.30</text>
      <text class="text-stone" x="444" y="220" font-size="13">0.70 × $6&nbsp; = $4.20</text>
      <line x1="444" y1="240" x2="696" y2="240" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="444" y="278" font-size="12">margin per cover</text>
      <text class="text-rust" x="696" y="300" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="40">$7.50</text>
    </g>
    <text class="text-soft" x="400" y="362" text-anchor="middle" font-size="15" font-style="italic" data-anim="fade" style="--delay:1400ms">Same prices. Two dollars a cover — purely from the mix.</text>
  </g>

  <!-- ============ MOVE ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The levers that move the mix</text>
    <!-- four nudges -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="60"  y="120" width="160" height="68" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="140" y="160" text-anchor="middle" font-size="14">placement</text>
      <rect x="240" y="120" width="160" height="68" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="320" y="160" text-anchor="middle" font-size="14">description</text>
      <rect x="420" y="120" width="160" height="68" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="500" y="160" text-anchor="middle" font-size="14">server mention</text>
      <rect x="600" y="120" width="140" height="68" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="670" y="160" text-anchor="middle" font-size="14">the special</text>
    </g>
    <!-- arrows nudging toward the high-margin dish -->
    <g data-anim="fade" style="--delay:900ms">
      <text class="text-stone" x="400" y="230" text-anchor="middle" font-size="26">↓</text>
      <text class="text-stone" x="400" y="256" text-anchor="middle" font-size="12" font-style="italic">steer the mix</text>
    </g>
    <!-- destination: high-margin dish -->
    <g data-anim="rise" style="--delay:1100ms">
      <rect x="260" y="276" width="280" height="92" rx="12" fill="var(--teal-tint,#E8F1F3)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="400" y="312" text-anchor="middle" font-size="13" letter-spacing="0.1em">TOWARD THE DISH THAT KEEPS MORE</text>
      <text class="text-teal" x="400" y="348" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">the high-margin plate</text>
    </g>
    <text class="text-soft" x="400" y="424" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1600ms">The cheapest margin lever you have — the guest never sees a price change.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="170" text-anchor="middle">Menu mix</text>
    <g data-anim="rise" style="--delay:380ms">
      <text x="400" y="248" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34" fill="var(--ink,#14161A)">Price is what you charge.</text>
      <text x="400" y="296" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34" font-style="italic" fill="var(--ink,#14161A)">Mix is what they pick.</text>
    </g>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="356" text-anchor="middle" font-size="15">Move the mix and the margin moves with it — quietly.</text>
    <line data-anim="grow-x" style="--delay:1040ms; transform-origin:center" x1="340" y1="386" x2="460" y2="386" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
