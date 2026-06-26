// Glossary explainer — CONTRIBUTION MARGIN
//
// CM dollars vs CM percent. The "30%-food-cost appetizer vs
// 40%-food-cost entrée" trap that catches operators who optimize
// on percentages. Visualises 100 covers split between the two and
// stacks the dollars to show which one actually pays the rent.

export default {
  term_slug: 'contribution-margin',
  term_head: 'Contribution margin, in 90 seconds.',
  subhead:   'Why CM dollars — not CM percent — pays the rent.',
  duration_ms: 90000,
  audio_url: null,
  scenes_es: [
    { id: 'two-dishes', caption: 'Dos platos. Un aperitivo de $10 con 30% de costo de comida. Un plato fuerte de $30 con 40% de costo de comida. ¿Cuál es la opción "mejor"?' },
    { id: 'percents',   caption: 'Casi todos los dueños eligen el aperitivo. 30% es el "mejor" porcentaje. Es la respuesta entrenada. Es la respuesta equivocada.' },
    { id: 'dollars',    caption: 'El aperitivo te deja siete dólares. El plato fuerte te deja dieciocho. Margen de contribución en dólares — no en porcentaje. El plato "más caro" casi triplica la contribución.' },
    { id: 'mix',        caption: 'Cien cubiertos. Pongamos ochenta aperitivos contra cuarenta platos fuertes — los aperitivos venden el doble. Aperitivos: $560. Platos fuertes: $720. El plato "peor" todavía gana.' },
    { id: 'rent',       caption: 'Aquí está por qué importa. La renta no se paga en porcentajes — se paga en dólares. La columna "peor" cubre los costos fijos primero. La columna "mejor" se queda corta.' },
    { id: 'land',       caption: 'Optimiza en dólares. Los porcentajes son una corazonada. Los dólares son una decisión.' },
  ],
  scenes: [
    { id: 'two-dishes', ms: 13000, caption: 'Two dishes. A ten-dollar appetizer at 30 percent food cost. A thirty-dollar entrée at 40 percent food cost. Which one is the "better" option?' },
    { id: 'percents',   ms: 12000, caption: 'Almost every operator picks the appetizer. Thirty percent is the "better" number. That’s the trained answer. It’s the wrong answer.' },
    { id: 'dollars',    ms: 17000, caption: 'The appetizer leaves you seven dollars. The entrée leaves you eighteen. Contribution margin in dollars — not in percent. The "more expensive" dish nearly triples the contribution.' },
    { id: 'mix',        ms: 17000, caption: 'A hundred covers. Imagine eighty appetizers against forty entrées — the apps sell twice as often. Appetizers: $560. Entrées: $720. The "worse" dish still wins.' },
    { id: 'rent',       ms: 17000, caption: 'Here’s why it matters. Rent isn’t paid in percentages — it’s paid in dollars. The "worse" column covers fixed costs first. The "better" column comes up short.' },
    { id: 'land',       ms: 14000, caption: 'Optimize on dollars. Percentages are a hunch. Dollars are a decision.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of contribution margin">
  <defs>
    <linearGradient id="cm-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#cm-bg)"/>

  <!-- ============ TWO DISHES ============ -->
  <g class="explainer-scene" data-scene-id="two-dishes">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Two dishes · which is "better"?</text>
    <g data-anim="rise" style="--delay:160ms">
      <rect x="100" y="120" width="260" height="260" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="124" y="160" font-size="11" letter-spacing="0.1em">APPETIZER</text>
      <text class="text-soft" x="124" y="216" font-family="Fraunces, Georgia, serif" font-size="48">$10</text>
      <text class="text-stone" x="124" y="248" font-size="13">menu price</text>
      <line x1="124" y1="276" x2="336" y2="276" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="124" y="306" font-size="14">Food cost · 30%</text>
      <text class="text-stone" x="124" y="328" font-size="12">$3 ingredient cost</text>
    </g>
    <g data-anim="rise" style="--delay:340ms">
      <rect x="440" y="120" width="260" height="260" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="464" y="160" font-size="11" letter-spacing="0.1em">ENTRÉE</text>
      <text class="text-soft" x="464" y="216" font-family="Fraunces, Georgia, serif" font-size="48">$30</text>
      <text class="text-stone" x="464" y="248" font-size="13">menu price</text>
      <line x1="464" y1="276" x2="676" y2="276" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="464" y="306" font-size="14">Food cost · 40%</text>
      <text class="text-stone" x="464" y="328" font-size="12">$12 ingredient cost</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1100ms">Pick one. Which is "better"?</text>
  </g>

  <!-- ============ PERCENTS ============ -->
  <g class="explainer-scene" data-scene-id="percents">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The trained answer</text>
    <g>
      <rect x="100" y="160" width="260" height="180" rx="14" fill="var(--teal-tint,#E8F1F3)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="124" y="200" font-size="11" letter-spacing="0.1em">APPETIZER</text>
      <text class="text-teal" x="124" y="266" font-family="Fraunces, Georgia, serif" font-size="56">30%</text>
      <text class="text-stone" x="124" y="296" font-size="13">food cost · "better"</text>
      <path data-anim="pop" style="--delay:600ms" d="M 220 300 l 30 -30 l 30 30 l -15 0 l 0 30 l -30 0 l 0 -30 z" fill="var(--status-good,#1F6B3A)"/>
    </g>
    <g>
      <rect x="440" y="160" width="260" height="180" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="464" y="200" font-size="11" letter-spacing="0.1em">ENTRÉE</text>
      <text class="text-soft" x="464" y="266" font-family="Fraunces, Georgia, serif" font-size="56">40%</text>
      <text class="text-stone" x="464" y="296" font-size="13">food cost · "worse"</text>
      <path data-anim="pop" style="--delay:600ms" d="M 560 300 l 30 30 l 30 -30 l -15 0 l 0 -30 l -30 0 l 0 30 z" fill="var(--rust,#B8541A)"/>
    </g>
    <text class="text-rust" x="400" y="420" text-anchor="middle" font-size="16" font-style="italic" data-anim="fade" style="--delay:1100ms">The trained answer is the wrong answer.</text>
  </g>

  <!-- ============ DOLLARS ============ -->
  <g class="explainer-scene" data-scene-id="dollars">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Read the dollars instead</text>
    <!-- Appetizer column -->
    <g>
      <text class="text-stone" x="180" y="100" text-anchor="middle" font-size="11" letter-spacing="0.1em">APPETIZER</text>
      <rect x="120" y="120" width="120" height="240" rx="6" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <!-- food cost piece (bottom 30%) -->
      <rect x="120" y="288" width="120" height="72" fill="var(--rust,#B8541A)" data-anim="grow-y" style="--delay:120ms"/>
      <text class="text-stone" x="180" y="332" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">$3 cost</text>
      <!-- contribution piece (top 70%) -->
      <rect x="120" y="120" width="120" height="168" fill="var(--status-good,#1F6B3A)" data-anim="grow-y" style="--delay:600ms; transform-origin:bottom center"/>
      <text class="text-stone" x="180" y="220" text-anchor="middle" font-size="13" fill="var(--cream,#FAF7F2)">CM</text>
      <text class="text-stone" x="180" y="240" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">$7</text>
      <text class="text-soft" x="180" y="394" text-anchor="middle" font-size="13">$10 menu price</text>
    </g>
    <!-- Entrée column -->
    <g>
      <text class="text-stone" x="540" y="100" text-anchor="middle" font-size="11" letter-spacing="0.1em">ENTRÉE</text>
      <rect x="480" y="120" width="120" height="240" rx="6" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <rect x="480" y="264" width="120" height="96" fill="var(--rust,#B8541A)" data-anim="grow-y" style="--delay:300ms"/>
      <text class="text-stone" x="540" y="320" text-anchor="middle" font-size="12" fill="var(--cream,#FAF7F2)">$12 cost</text>
      <rect x="480" y="120" width="120" height="144" fill="var(--status-good,#1F6B3A)" data-anim="grow-y" style="--delay:780ms; transform-origin:bottom center"/>
      <text class="text-stone" x="540" y="184" text-anchor="middle" font-size="13" fill="var(--cream,#FAF7F2)">CM</text>
      <text class="text-stone" x="540" y="208" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="28" fill="var(--cream,#FAF7F2)">$18</text>
      <text class="text-soft" x="540" y="394" text-anchor="middle" font-size="13">$30 menu price</text>
    </g>
    <text class="text-stone" x="380" y="240" text-anchor="middle" font-size="32" data-anim="pop" style="--delay:1200ms">vs</text>
    <text class="text-good" x="400" y="450" text-anchor="middle" font-size="16" data-anim="fade" style="--delay:1400ms" font-weight="500">The "worse" dish nearly triples the contribution.</text>
  </g>

  <!-- ============ MIX ============ -->
  <g class="explainer-scene" data-scene-id="mix">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">100 covers · realistic mix</text>
    <!-- Appetizer dots: 80 -->
    <g data-anim="rise" style="--delay:120ms">
      <text class="text-stone" x="180" y="110" text-anchor="middle" font-size="11" letter-spacing="0.1em">80 APPETIZERS</text>
      <g transform="translate(80, 130)">
        ${Array.from({ length: 80 }).map((_, i) => {
          const col = i % 10, row = Math.floor(i / 10);
          return `<circle cx="${col * 22 + 10}" cy="${row * 22 + 10}" r="6" fill="var(--teal,#1F4E5B)" opacity="0.85"/>`;
        }).join('')}
      </g>
      <text class="text-stone" x="180" y="328" text-anchor="middle" font-size="12">×  $7 CM each</text>
      <rect x="80" y="350" width="200" height="40" rx="6" fill="var(--status-good,#1F6B3A)"/>
      <text class="text-stone" x="180" y="378" text-anchor="middle" font-size="20" fill="var(--cream,#FAF7F2)" font-family="Fraunces, Georgia, serif">$560 total</text>
    </g>
    <!-- Entrée dots: 40 -->
    <g data-anim="rise" style="--delay:480ms">
      <text class="text-stone" x="540" y="110" text-anchor="middle" font-size="11" letter-spacing="0.1em">40 ENTRÉES</text>
      <g transform="translate(440, 130)">
        ${Array.from({ length: 40 }).map((_, i) => {
          const col = i % 10, row = Math.floor(i / 10);
          return `<circle cx="${col * 22 + 10}" cy="${row * 22 + 10}" r="7" fill="var(--rust,#B8541A)"/>`;
        }).join('')}
      </g>
      <text class="text-stone" x="540" y="328" text-anchor="middle" font-size="12">×  $18 CM each</text>
      <rect x="440" y="350" width="200" height="40" rx="6" fill="var(--status-good,#1F6B3A)"/>
      <text class="text-stone" x="540" y="378" text-anchor="middle" font-size="20" fill="var(--cream,#FAF7F2)" font-family="Fraunces, Georgia, serif">$720 total</text>
    </g>
    <text class="text-good" x="400" y="438" text-anchor="middle" font-size="16" data-anim="fade" style="--delay:1100ms" font-weight="500">The "worse" dish still wins.</text>
  </g>

  <!-- ============ RENT ============ -->
  <g class="explainer-scene" data-scene-id="rent">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Rent doesn’t care about percentages</text>
    <!-- Bar 1: appetizer-only night -->
    <g>
      <text class="text-stone" x="80" y="120" font-size="11" letter-spacing="0.1em">APP-HEAVY NIGHT · $560 CM</text>
      <rect x="80" y="138" width="640" height="44" rx="6" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <rect x="80" y="138" width="294" height="44" rx="6" fill="var(--status-good,#1F6B3A)" data-anim="grow-x" style="--delay:200ms"/>
      <text x="86" y="166" font-size="13" fill="var(--cream,#FAF7F2)">CM $560</text>
      <!-- fixed-cost line at $620 -->
      <line x1="406" y1="120" x2="406" y2="200" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="4 3" data-anim="fade" style="--delay:1100ms"/>
      <text class="text-rust" x="406" y="220" text-anchor="middle" font-size="11" data-anim="fade" style="--delay:1100ms">fixed costs · $620</text>
      <text class="text-rust" x="660" y="166" text-anchor="end" font-size="12" font-weight="500" data-anim="fade" style="--delay:1300ms">SHORT</text>
    </g>
    <!-- Bar 2: entrée-heavy night -->
    <g>
      <text class="text-stone" x="80" y="280" font-size="11" letter-spacing="0.1em">ENTRÉE-HEAVY NIGHT · $720 CM</text>
      <rect x="80" y="298" width="640" height="44" rx="6" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
      <rect x="80" y="298" width="378" height="44" rx="6" fill="var(--status-good,#1F6B3A)" data-anim="grow-x" style="--delay:560ms"/>
      <text x="86" y="326" font-size="13" fill="var(--cream,#FAF7F2)">CM $720</text>
      <!-- same fixed-cost line at same x position -->
      <line x1="406" y1="280" x2="406" y2="360" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="4 3" data-anim="fade" style="--delay:1100ms"/>
      <text class="text-good" x="660" y="326" text-anchor="end" font-size="12" font-weight="500" data-anim="fade" style="--delay:1500ms">PROFITABLE</text>
    </g>
    <text class="text-soft" x="400" y="430" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1700ms" font-style="italic">The "better" night is the one that clears the dashed line.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="180" text-anchor="middle">Contribution margin</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="260" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44" font-style="italic" fill="var(--ink,#14161A)">Optimize on dollars.</text>
    <text data-anim="fade" style="--delay:780ms" class="text-stone" x="400" y="320" text-anchor="middle" font-size="14">Percentages are a hunch. Dollars are a decision.</text>
    <line data-anim="grow-x" style="--delay:980ms; transform-origin:center" x1="340" y1="350" x2="460" y2="350" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
