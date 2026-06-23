// Glossary explainer — CALIBRATION (track record)
//
// Whether a confidence label earns its name: a "strong" call is only
// strong if strong calls actually come true more often. Walks the test
// (grade a long run of past calls, read the rate per tier — not any one
// call), shows the climbing bars (weak ~48%, medium ~51%, strong ~58%),
// draws the coin-flip baseline near 50% across them, and lands on
// "earned, not decorative." Every figure is the Cost Index's own
// published calibration record — weak ~48%, medium ~51%, strong ~58%,
// baseline ~50%, across 1,877 scored calls (/cost-index/calibration.json).

export default {
  term_slug: 'calibration',
  term_head: 'Calibration, in 90 seconds.',
  subhead:   'Does the confidence label earn its name?',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'label', caption: 'Una etiqueta de confianza solo vale la pena leerla si se la ha ganado. "Fuerte" debería significar algo más que un presentimiento — debería significar que las llamadas que se etiquetan fuertes de verdad se cumplen más seguido. Si no, la palabra es decoración.' },
    { id: 'test',  caption: 'Así es la prueba. Calificas una larga racha de llamadas pasadas, y para cada nivel revisas con qué frecuencia las llamadas de ese nivel de verdad se cumplieron. Tener razón una vez no prueba nada — hasta una moneda cae cara la mitad del tiempo. Lo que importa es la tasa a lo largo de muchas llamadas.' },
    { id: 'bars',  caption: 'Esto es lo que mostró el Cost Index. Las llamadas débiles se cumplieron cerca del cuarenta y ocho por ciento de las veces, las medias cerca del cincuenta y uno, y las fuertes cerca del cincuenta y ocho. Cada nivel por encima del anterior — una gráfica de barras que sube, igual que la tarjeta del propio término.' },
    { id: 'baseline', caption: 'Compáralo con una moneda al aire — cerca del cincuenta por ciento. Traza esa línea a través de las barras. "Fuerte", cerca del cincuenta y ocho, de verdad le gana. "Débil", cerca del cuarenta y ocho, honestamente apenas la alcanza. Así sabes que las etiquetas cargan información de verdad, no solo confianza.' },
    { id: 'land',  caption: 'Las etiquetas se ganan, no son decorativas. Cuando el Cost Index dice fuerte, esa palabra tiene un historial detrás. El registro completo es público en diagonal cost guion index diagonal calibration punto json.' },
  ],
  scenes: [
    { id: 'label', ms: 14000, caption: 'A confidence label is only worth reading if it is earned. "Strong" should mean more than a hunch — it should mean that calls labeled strong actually come true more often. If it does not, the word is decoration.' },
    { id: 'test',  ms: 16000, caption: 'Here is the test. You grade a long run of past calls, and for each level you check how often calls at that level actually came true. Being right once proves nothing — even a coin lands heads half the time. What matters is the rate across many calls.' },
    { id: 'bars',  ms: 15000, caption: 'Here is what the Cost Index showed. Weak calls came true about forty-eight percent of the time, medium about fifty-one, and strong about fifty-eight. Each tier above the last — a climbing bar chart, the same look as the term card itself.' },
    { id: 'baseline', ms: 15000, caption: 'Compare that to a coin flip — about fifty percent. Draw that line across the bars. "Strong," near fifty-eight, genuinely beats it. "Weak," near forty-eight, honestly barely does. That is how you know the labels carry real information, not just confidence.' },
    { id: 'land',  ms: 14000, caption: 'The labels are earned, not decorative. When the Cost Index says strong, that word has a track record behind it. The full record is public at slash cost dash index slash calibration dot json.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of calibration — testing whether the Cost Index confidence labels match their real hit-rates against a coin-flip baseline">
  <defs>
    <linearGradient id="cal-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#cal-bg)"/>

  <!-- ============ LABEL: a label is only worth reading if earned ============ -->
  <g class="explainer-scene" data-scene-id="label">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">A label has to earn its name</text>
    <!-- the word "strong" as a badge -->
    <g data-anim="pop" style="--delay:200ms">
      <rect x="270" y="150" width="260" height="92" rx="14" fill="var(--teal,#1F4E5B)"/>
      <text class="scene-label" x="400" y="190" text-anchor="middle" font-size="13" fill="var(--cream,#FAF7F2)">CONFIDENCE LABEL</text>
      <text x="400" y="224" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34" fill="var(--cream,#FAF7F2)">"strong"</text>
    </g>
    <!-- the two readings of the same word -->
    <g data-anim="rise" style="--delay:800ms">
      <text class="text-rust" x="240" y="320" text-anchor="middle" font-size="15" font-style="italic">a hunch?</text>
      <text class="text-stone" x="400" y="320" text-anchor="middle" font-size="20">vs</text>
      <text class="text-teal" x="560" y="320" text-anchor="middle" font-size="15" font-style="italic">a checked claim?</text>
    </g>
    <text class="text-stone" x="400" y="418" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1300ms">If the word is not earned, it is decoration.</text>
  </g>

  <!-- ============ TEST: grade many calls, read the rate per tier ============ -->
  <g class="explainer-scene" data-scene-id="test">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Grade a long run · read the rate</text>
    <!-- one call proves nothing -->
    <g data-anim="rise" style="--delay:160ms">
      <circle cx="120" cy="150" r="20" fill="var(--cream,#FAF7F2)" stroke="var(--ink-soft,#3A3A36)" stroke-width="2"/>
      <path d="M111 150 l6 7 l12 -14" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text class="text-stone" x="156" y="146" font-size="13">one right call</text>
      <text class="text-stone" x="156" y="166" font-size="13" font-style="italic">proves nothing — a coin does that too</text>
    </g>
    <!-- the long run: a grid of graded calls -->
    <g data-anim="fade" style="--delay:560ms">
      <text class="scene-label text-stone" x="80" y="222" font-size="11">A LONG RUN OF PAST CALLS, GRADED</text>
    </g>
    <g data-anim="fade" style="--delay:760ms">
      <rect x="80" y="236" width="640" height="64" rx="8" fill="rgba(31,78,91,0.05)" stroke="var(--line,#E8E2D6)"/>
      <g fill="var(--teal,#1F4E5B)">
        <circle cx="108" cy="258" r="6"/><circle cx="138" cy="258" r="6"/><circle cx="198" cy="258" r="6"/><circle cx="258" cy="258" r="6"/><circle cx="318" cy="258" r="6"/><circle cx="408" cy="258" r="6"/><circle cx="468" cy="258" r="6"/><circle cx="528" cy="258" r="6"/><circle cx="588" cy="258" r="6"/><circle cx="648" cy="258" r="6"/><circle cx="678" cy="258" r="6"/>
        <circle cx="108" cy="280" r="6"/><circle cx="168" cy="280" r="6"/><circle cx="228" cy="280" r="6"/><circle cx="288" cy="280" r="6"/><circle cx="378" cy="280" r="6"/><circle cx="438" cy="280" r="6"/><circle cx="498" cy="280" r="6"/><circle cx="558" cy="280" r="6"/><circle cx="618" cy="280" r="6"/><circle cx="678" cy="280" r="6"/>
      </g>
      <g fill="var(--rust,#B8541A)">
        <circle cx="168" cy="258" r="6"/><circle cx="228" cy="258" r="6"/><circle cx="288" cy="258" r="6"/><circle cx="348" cy="258" r="6"/><circle cx="438" cy="258" r="6"/><circle cx="498" cy="258" r="6"/><circle cx="558" cy="258" r="6"/><circle cx="618" cy="258" r="6"/>
        <circle cx="138" cy="280" r="6"/><circle cx="198" cy="280" r="6"/><circle cx="258" cy="280" r="6"/><circle cx="318" cy="280" r="6"/><circle cx="348" cy="280" r="6"/><circle cx="408" cy="280" r="6"/><circle cx="468" cy="280" r="6"/><circle cx="528" cy="280" r="6"/><circle cx="588" cy="280" r="6"/><circle cx="648" cy="280" r="6"/>
      </g>
    </g>
    <g data-anim="rise" style="--delay:1200ms">
      <text class="text-soft" x="400" y="362" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">For each tier, how often did it come true?</text>
    </g>
    <text class="text-stone" x="400" y="418" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">The rate across many calls is the point — not any one call.</text>
  </g>

  <!-- ============ BARS: weak ~48, medium ~51, strong ~58 ============ -->
  <!-- axis at y=400; 100% spans 290px up to y=110. height = rate * 290. -->
  <g class="explainer-scene" data-scene-id="bars">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Calls that came true, by tier</text>
    <!-- axis -->
    <line x1="120" y1="400" x2="700" y2="400" stroke="var(--line-dark,#D4CCBC)" stroke-width="2" data-anim="fade" style="--delay:120ms"/>
    <!-- WEAK: 48% -> 139px, gold (the highlighted bar, like the OG card) -->
    <g data-anim="grow-y" style="--delay:360ms">
      <rect x="180" y="261" width="120" height="139" rx="4" fill="var(--gold,#C8862A)"/>
    </g>
    <g data-anim="fade" style="--delay:760ms">
      <text x="240" y="248" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30" fill="var(--gold,#C8862A)">48%</text>
      <text class="text-stone" x="240" y="424" text-anchor="middle" font-size="14">weak</text>
    </g>
    <!-- MEDIUM: 51% -> 148px, dark -->
    <g data-anim="grow-y" style="--delay:560ms">
      <rect x="350" y="252" width="120" height="148" rx="4" fill="var(--teal,#1F4E5B)"/>
    </g>
    <g data-anim="fade" style="--delay:960ms">
      <text x="410" y="239" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30" fill="var(--teal,#1F4E5B)">51%</text>
      <text class="text-stone" x="410" y="424" text-anchor="middle" font-size="14">medium</text>
    </g>
    <!-- STRONG: 58% -> 168px, dark -->
    <g data-anim="grow-y" style="--delay:760ms">
      <rect x="520" y="232" width="120" height="168" rx="4" fill="var(--teal,#1F4E5B)"/>
    </g>
    <g data-anim="fade" style="--delay:1160ms">
      <text x="580" y="219" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30" fill="var(--teal,#1F4E5B)">58%</text>
      <text class="text-stone" x="580" y="424" text-anchor="middle" font-size="14">strong</text>
    </g>
    <text class="text-stone" x="400" y="462" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1600ms">Each tier comes true more often than the one below it.</text>
  </g>

  <!-- ============ BASELINE: the 50% coin-flip line across the bars ============ -->
  <!-- same axis/scale as BARS; 50% baseline sits at y = 400 - 0.50*290 = 255. -->
  <g class="explainer-scene" data-scene-id="baseline">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Against a coin flip</text>
    <line x1="120" y1="400" x2="700" y2="400" stroke="var(--line-dark,#D4CCBC)" stroke-width="2" data-anim="fade" style="--delay:120ms"/>
    <!-- the three bars, muted, so the baseline reads -->
    <g data-anim="fade" style="--delay:200ms">
      <rect x="180" y="261" width="120" height="139" rx="4" fill="var(--gold,#C8862A)"/>
      <rect x="350" y="252" width="120" height="148" rx="4" fill="var(--teal,#1F4E5B)"/>
      <rect x="520" y="232" width="120" height="168" rx="4" fill="var(--teal,#1F4E5B)"/>
      <text class="text-stone" x="240" y="424" text-anchor="middle" font-size="13">weak</text>
      <text class="text-stone" x="410" y="424" text-anchor="middle" font-size="13">medium</text>
      <text class="text-stone" x="580" y="424" text-anchor="middle" font-size="13">strong</text>
    </g>
    <!-- the 50% coin-flip baseline drawn across all three -->
    <line x1="120" y1="255" x2="700" y2="255" stroke="var(--rust,#B8541A)" stroke-width="2.5" stroke-dasharray="7 5" data-anim="grow-x" style="--delay:560ms"/>
    <g data-anim="fade" style="--delay:1100ms">
      <rect x="120" y="166" width="178" height="42" rx="8" fill="var(--cream,#FAF7F2)" stroke="var(--rust,#B8541A)"/>
      <text class="text-rust" x="209" y="184" text-anchor="middle" font-size="12" letter-spacing="0.08em">COIN FLIP</text>
      <text x="209" y="202" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="16" fill="var(--rust,#B8541A)">about 50%</text>
    </g>
    <!-- verdicts: strong beats it, weak barely does -->
    <text class="text-teal" x="580" y="222" text-anchor="middle" font-size="13" font-style="italic" data-anim="fade" style="--delay:1500ms">beats it</text>
    <text class="text-stone" x="240" y="248" text-anchor="middle" font-size="13" font-style="italic" data-anim="fade" style="--delay:1500ms">barely does</text>
    <text class="text-stone" x="400" y="462" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1900ms">"Strong" genuinely beats chance. "Weak" honestly barely does.</text>
  </g>

  <!-- ============ LAND: earned, not decorative ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="170" text-anchor="middle">Earned, not decorative</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="252" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="42" font-style="italic" fill="var(--ink,#14161A)">The label has a record.</text>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="312" text-anchor="middle" font-size="15">The full record is public:</text>
    <text data-anim="fade" style="--delay:1000ms" class="text-teal" x="400" y="340" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="18">/cost-index/calibration.json</text>
    <line data-anim="grow-x" style="--delay:1240ms; transform-origin:center" x1="340" y1="372" x2="460" y2="372" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
