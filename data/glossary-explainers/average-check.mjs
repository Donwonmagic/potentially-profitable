// Glossary explainer — AVERAGE CHECK
//
// What average check is (total sales / covers), why the per-cover number
// gets ignored even though small moves compound across a full week, the
// two ways to raise it (price vs mix), and why the spread between servers
// is a training problem, not a pricing one. All figures are an
// illustrative worked example — one internally-consistent night — not
// measured operator data.

export default {
  term_slug: 'average-check',
  term_head: 'Average check, in 90 seconds.',
  subhead:   'The lever that moves more than a price increase.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'define', caption: 'El cheque promedio es las ventas totales divididas entre los cubiertos. Cuatro mil doscientos dólares en ventas entre ciento veinte cubiertos da un cheque promedio de treinta y cinco dólares. Un solo número, por persona.' },
    { id: 'small',  caption: 'Se siente pequeño, así que lo ignoran. Pero suma apenas dos dólares por cubierto — una guarnición, una ronda más — y con ciento veinte cubiertos por noche, seis noches a la semana, eso son mil cuatrocientos cuarenta dólares semanales. Unos setenta y cinco mil al año, en cosas que ya vendes.' },
    { id: 'mix',    caption: 'Lo subes de dos maneras: precio, o mezcla — lo que la gente realmente pide. Un mesero que coloca una entrada y un postre por mesa mueve el cheque más que un aumento de precio en todo el menú, y ningún comensal se siente exprimido.' },
    { id: 'move',   caption: 'Así que mídelo por turno y por mesero. La diferencia entre tu mejor mesero y el promedio, multiplicada por los cubiertos, es dinero que está ahí — y es un problema de capacitación, no de precios.' },
    { id: 'land',   caption: 'No siempre necesitas más comensales. Muchas veces necesitas dos dólares más de los que ya están sentados.' },
  ],
  scenes: [
    { id: 'define', ms: 13000, caption: 'Average check is total sales divided by covers. Forty-two hundred dollars in sales across a hundred twenty covers is a thirty-five dollar average check. One number, per person.' },
    { id: 'small',  ms: 16000, caption: 'It feels small, so it gets ignored. But add just two dollars per cover — one side, one extra round — and at a hundred twenty covers a night, six nights a week, that is fourteen hundred forty dollars a week. Roughly seventy-five thousand a year, on items you already sell.' },
    { id: 'mix',    ms: 15000, caption: 'You raise it two ways: price, or mix — what people actually order. A server who lands one appetizer and one dessert per table moves the check more than a menu-wide price bump, and no guest feels squeezed.' },
    { id: 'move',   ms: 15000, caption: 'So track it by shift and by server. The spread between your best server and your average one, times covers, is found money — and it is a training problem, not a pricing problem.' },
    { id: 'land',   ms: 14000, caption: 'You do not always need more guests. Often you need two more dollars from the ones already sitting down.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of restaurant average check: sales divided by covers, and how two dollars per cover compounds across a week and a year">
  <defs>
    <linearGradient id="ac-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#ac-bg)"/>

  <!-- ============ DEFINE ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The definition</text>
    <g data-anim="rise" style="--delay:160ms">
      <text class="text-stone" x="150" y="210" text-anchor="middle" font-size="12" letter-spacing="0.1em">SALES</text>
      <text class="text-soft" x="150" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">$4,200</text>
      <line x1="50" y1="290" x2="250" y2="290" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="150" y="320" text-anchor="middle" font-size="12" letter-spacing="0.1em">COVERS</text>
      <text class="text-soft" x="150" y="372" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">120</text>
    </g>
    <text class="text-stone" x="330" y="290" text-anchor="middle" font-size="40" data-anim="fade" style="--delay:700ms">=</text>
    <g data-anim="rise" style="--delay:1000ms">
      <text class="text-teal" x="560" y="300" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="96">$35</text>
      <text class="text-stone" x="560" y="350" text-anchor="middle" font-size="14" font-style="italic">one number, per person</text>
    </g>
  </g>

  <!-- ============ SMALL · IT COMPOUNDS ============ -->
  <g class="explainer-scene" data-scene-id="small">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Two dollars, compounded</text>
    <!-- step 1: +$2 per cover -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="60" y="110" width="200" height="86" rx="10" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="160" y="138" text-anchor="middle" font-size="11" letter-spacing="0.1em">PER COVER</text>
      <text class="text-rust" x="160" y="178" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34">+$2</text>
    </g>
    <text class="text-stone" x="290" y="160" text-anchor="middle" font-size="26" data-anim="fade" style="--delay:420ms">&#215;</text>
    <!-- step 2: x 120 covers x 6 nights -->
    <g data-anim="rise" style="--delay:560ms">
      <rect x="320" y="110" width="220" height="86" rx="10" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="430" y="138" text-anchor="middle" font-size="11" letter-spacing="0.1em">120 COVERS &#215; 6 NIGHTS</text>
      <text class="text-soft" x="430" y="178" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34">720</text>
    </g>
    <!-- step 3: = $1,440 / week -->
    <g data-anim="rise" style="--delay:1000ms">
      <rect x="560" y="110" width="180" height="86" rx="10" fill="rgba(31,78,91,0.10)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-stone" x="650" y="138" text-anchor="middle" font-size="11" letter-spacing="0.1em">PER WEEK</text>
      <text class="text-teal" x="650" y="178" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="32">$1,440</text>
    </g>
    <!-- bar growing to the year total -->
    <g data-anim="fade" style="--delay:1500ms">
      <text class="text-stone" x="60" y="284" font-size="11" letter-spacing="0.1em">&#215; 52 WEEKS</text>
      <rect x="60" y="298" height="60" rx="6" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:1700ms" width="680"/>
      <text x="720" y="336" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="34" fill="var(--cream,#FAF7F2)">&#8776; $75,000 / yr</text>
    </g>
    <text class="text-stone" x="400" y="416" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:2100ms">On items you already sell.</text>
  </g>

  <!-- ============ MIX vs PRICE ============ -->
  <g class="explainer-scene" data-scene-id="mix">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Two ways up: price or mix</text>
    <!-- LEFT: a guest check that grows by mix -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="80" y="96" width="300" height="300" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="104" y="132" font-size="11" letter-spacing="0.1em">MIX &#183; ONE TABLE</text>
      <line x1="104" y1="148" x2="356" y2="148" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="104" y="182" font-size="14">Two entr&#233;es</text>
      <text class="text-stone" x="356" y="182" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="18">$48</text>
      <text class="text-rust" x="104" y="218" font-size="14">+ 1 appetizer</text>
      <text class="text-rust" x="356" y="218" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="18">+$12</text>
      <text class="text-rust" x="104" y="254" font-size="14">+ 1 dessert</text>
      <text class="text-rust" x="356" y="254" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="18">+$10</text>
      <line x1="104" y1="282" x2="356" y2="282" stroke="var(--ink,#14161A)" stroke-width="1.5"/>
      <text class="text-stone" x="104" y="322" font-size="12" letter-spacing="0.1em">CHECK</text>
      <text class="text-teal" x="356" y="328" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="32">$70</text>
      <text class="text-stone" x="104" y="364" font-size="13" font-style="italic">No guest feels squeezed.</text>
    </g>
    <!-- RIGHT: a flat menu-wide price bump -->
    <g data-anim="rise" style="--delay:600ms">
      <rect x="420" y="96" width="300" height="300" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="444" y="132" font-size="11" letter-spacing="0.1em">PRICE &#183; MENU-WIDE BUMP</text>
      <line x1="444" y1="148" x2="696" y2="148" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="444" y="194" font-size="14">Every line item up</text>
      <text class="text-soft" x="696" y="194" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="18">+5%</text>
      <text class="text-stone" x="444" y="244" font-size="13">Every guest sees it.</text>
      <text class="text-stone" x="444" y="270" font-size="13">Every guest does the math.</text>
      <line x1="444" y1="298" x2="696" y2="298" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="444" y="338" font-size="13" font-style="italic">Smaller move. More friction.</text>
    </g>
  </g>

  <!-- ============ MOVE · SERVER SPREAD ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Track it by server</text>
    <!-- four server bars, ascending; spread between best and average is the prize -->
    <g data-anim="rise" style="--delay:120ms">
      <text class="text-stone" x="80" y="128" font-size="11" letter-spacing="0.1em">AVG CHECK BY SERVER</text>
    </g>
    <!-- baseline -->
    <line x1="80" y1="380" x2="720" y2="380" stroke="var(--line-dark,#D4CCBC)" stroke-width="2" data-anim="fade" style="--delay:200ms"/>
    <!-- Server A: $31 -->
    <g data-anim="rise" style="--delay:320ms">
      <rect x="110" y="232" width="90" height="148" rx="4" fill="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="155" y="222" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="18">$31</text>
      <text class="text-stone" x="155" y="400" text-anchor="middle" font-size="12">Server A</text>
    </g>
    <!-- Server B: $33 -->
    <g data-anim="rise" style="--delay:480ms">
      <rect x="250" y="216" width="90" height="164" rx="4" fill="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="295" y="206" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="18">$33</text>
      <text class="text-stone" x="295" y="400" text-anchor="middle" font-size="12">Server B</text>
    </g>
    <!-- the house average marker line at $35 -->
    <g data-anim="fade" style="--delay:900ms">
      <line x1="80" y1="200" x2="720" y2="200" stroke="var(--teal,#1F4E5B)" stroke-width="1.5" stroke-dasharray="5 4"/>
      <text class="text-teal" x="724" y="204" font-size="12">house avg $35</text>
    </g>
    <!-- Server C: $35 (at the average) -->
    <g data-anim="rise" style="--delay:640ms">
      <rect x="390" y="200" width="90" height="180" rx="4" fill="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="435" y="190" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="18">$35</text>
      <text class="text-stone" x="435" y="400" text-anchor="middle" font-size="12">Server C</text>
    </g>
    <!-- Server D: best, $44 -->
    <g data-anim="rise" style="--delay:800ms">
      <rect x="530" y="128" width="90" height="252" rx="4" fill="var(--rust,#B8541A)"/>
      <text class="text-rust" x="575" y="118" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="20">$44</text>
      <text class="text-stone" x="575" y="400" text-anchor="middle" font-size="12">Server D</text>
    </g>
    <!-- the spread bracket between average and best -->
    <g data-anim="fade" style="--delay:1300ms">
      <line x1="650" y1="128" x2="650" y2="200" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <line x1="644" y1="128" x2="656" y2="128" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <line x1="644" y1="200" x2="656" y2="200" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <text class="text-rust" x="664" y="168" font-size="13" font-style="italic">the spread</text>
      <text class="text-stone" x="664" y="186" font-size="12">&#215; covers = found money</text>
    </g>
    <text class="text-stone" x="400" y="452" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1600ms">A training problem, not a pricing problem.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="180" text-anchor="middle">Average check</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="262" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40" font-style="italic" fill="var(--ink,#14161A)">Two more dollars.</text>
    <text data-anim="fade" style="--delay:780ms" class="text-stone" x="400" y="320" text-anchor="middle" font-size="15">Not always more guests &#8212; more from the ones already sitting down.</text>
    <line data-anim="grow-x" style="--delay:980ms; transform-origin:center" x1="340" y1="350" x2="460" y2="350" stroke="var(--rust,#B8541A)" stroke-width="2"/>
  </g>
</svg>`,
};
