// Glossary explainer — MEASURED, DERIVED, ABSENT
//
// The three honesty states a data product can put on any reading:
// MEASURED (a published government series shown as-is — highest
// confidence, solid line, source link + report date), DERIVED (a
// labeled estimate from public inputs — dashed line, confidence band,
// an "estimate" badge, never passed off as a measurement), and ABSENT
// (no usable public series — a greyed card that names the structural
// reason, e.g. a confidentiality suppression, instead of inventing a
// number). The payoff: you can always tell which of the three any
// reading is before you trust it. The concept is qualitative — no
// numeric claims; the cheddar / edible-portion beef / niche-herb
// example is illustrative, matching the term page.

export default {
  term_slug: 'measured-derived-absent',
  term_head: 'Measured, derived, absent — in 90 seconds.',
  subhead:   'The three honesty states behind every reading.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'intro',    caption: 'Cada lectura de precio lleva exactamente una de tres etiquetas de honestidad: medida, derivada o ausente. La etiqueta no te dice solo el número — te dice cuánto confiar en él. Una buena lectura nunca te deja adivinando en cuál de las tres cae.' },
    { id: 'measured', caption: 'Medida es la de mayor confianza: una serie publicada por el gobierno, mostrada tal cual. El cheddar sale directo del reporte lácteo, así que se dibuja con una línea sólida, un enlace a la fuente y la fecha del reporte. Nada inventado, nada estimado — solo el número publicado, que puedes ir a verificar tú mismo.' },
    { id: 'derived',  caption: 'Derivada es una estimación, y lo dice abiertamente. Cuando no existe una serie directa, la armamos a partir de insumos públicos y la dibujamos con una línea punteada, una banda de confianza y una insignia de "estimado". El corte de res en porción comestible se calcula así. Una estimación etiquetada — jamás disfrazada de medición.' },
    { id: 'absent',   caption: 'Ausente significa que no hay datos públicos utilizables, así que lo decimos en vez de inventar un número. Una hierba de nicho aparece como una tarjeta gris que nombra el motivo estructural — por ejemplo, una supresión por confidencialidad de celdas pequeñas. Un hueco con nombre es más confiable que un número inventado en silencio.' },
    { id: 'land',     caption: 'Medida, derivada o ausente: un hecho publicado, una estimación etiquetada o un hueco honesto. Siempre puedes ver en cuál de las tres cae cualquier lectura — antes de apostar una decisión en ella.' },
  ],
  scenes: [
    { id: 'intro',    ms: 14000, caption: 'Every price reading carries exactly one of three honesty labels: measured, derived, or absent. The label tells you more than the number — it tells you how far to trust it. A good reading never leaves you guessing which of the three it is.' },
    { id: 'measured', ms: 15000, caption: 'Measured is the highest confidence: a published government series, shown as-is. Cheddar comes straight from the dairy report, so it is drawn with a solid line, a source link, and the report date. Nothing invented, nothing estimated — just the published number, which you can go check yourself.' },
    { id: 'derived',  ms: 16000, caption: 'Derived is an estimate, and it says so out loud. When no direct series exists, we build one from public inputs and draw it with a dashed line, a confidence band, and an "estimate" badge. Edible-portion beef is figured this way. A labeled estimate — never dressed up as a measurement.' },
    { id: 'absent',   ms: 15000, caption: 'Absent means there is no usable public data, so we say so instead of inventing a number. A niche herb shows up as a greyed card that names the structural reason — for example, a small-cell confidentiality suppression. A named gap is more trustworthy than a quietly invented number.' },
    { id: 'land',     ms: 14000, caption: 'Measured, derived, or absent: a published fact, a labeled estimate, or an honest gap. You can always tell which of the three any reading is — before you bet a decision on it.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of the measured, derived, and absent data-honesty states: a solid sourced line, a dashed estimate with a confidence band, and a named gap">
  <defs>
    <linearGradient id="mda-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#mda-bg)"/>

  <!-- ============ INTRO: one of three labels ============ -->
  <g class="explainer-scene" data-scene-id="intro">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">One of three labels</text>
    <text class="text-soft" x="400" y="92" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:120ms">Every reading gets exactly one — and the label tells you how far to trust it.</text>
    <!-- MEASURED row -->
    <g data-anim="rise" style="--delay:300ms">
      <rect x="120" y="130" width="560" height="74" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <circle cx="158" cy="167" r="9" fill="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="186" y="160" font-size="14" font-weight="700" letter-spacing="0.06em">MEASURED</text>
      <text class="text-soft" x="186" y="184" font-size="13">a published series, shown as-is — highest confidence</text>
    </g>
    <!-- DERIVED row -->
    <g data-anim="rise" style="--delay:620ms">
      <rect x="120" y="216" width="560" height="74" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <circle cx="158" cy="253" r="9" fill="none" stroke="var(--rust,#B8541A)" stroke-width="2.5" stroke-dasharray="3 3"/>
      <text class="text-rust" x="186" y="246" font-size="14" font-weight="700" letter-spacing="0.06em">DERIVED</text>
      <text class="text-soft" x="186" y="270" font-size="13">a labeled estimate from public inputs — said out loud</text>
    </g>
    <!-- ABSENT row -->
    <g data-anim="rise" style="--delay:940ms">
      <rect x="120" y="302" width="560" height="74" rx="12" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)"/>
      <circle cx="158" cy="339" r="9" fill="none" stroke="var(--line-dark,#D4CCBC)" stroke-width="2.5"/>
      <text class="text-stone" x="186" y="332" font-size="14" font-weight="700" letter-spacing="0.06em">ABSENT</text>
      <text class="text-soft" x="186" y="356" font-size="13">no usable public data — named, not invented</text>
    </g>
    <text class="text-stone" x="400" y="426" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1300ms">You never have to guess which of the three a reading is.</text>
  </g>

  <!-- ============ MEASURED: solid line, sourced ============ -->
  <g class="explainer-scene" data-scene-id="measured">
    <text class="scene-label text-teal" x="40" y="46" data-anim="fade">Measured · highest confidence</text>
    <text class="text-soft" x="40" y="74" font-size="13" data-anim="fade" style="--delay:120ms">Cheddar, straight from the dairy report.</text>
    <!-- axes -->
    <g data-anim="rise" style="--delay:260ms">
      <line x1="120" y1="380" x2="120" y2="140" stroke="var(--line-dark,#D4CCBC)"/>
      <line x1="120" y1="380" x2="560" y2="380" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="110" y="148" text-anchor="end" font-size="10">$ / lb</text>
      <text class="text-stone" x="560" y="398" text-anchor="end" font-size="10">weeks</text>
    </g>
    <!-- solid measured line -->
    <path d="M132 320 L240 296 L348 308 L456 252 L548 236" stroke="var(--teal,#1F4E5B)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" data-anim="grow-x" style="--delay:520ms"/>
    <!-- measured dots -->
    <g data-anim="fade" style="--delay:1100ms">
      <circle cx="132" cy="320" r="4" fill="var(--teal,#1F4E5B)"/>
      <circle cx="240" cy="296" r="4" fill="var(--teal,#1F4E5B)"/>
      <circle cx="348" cy="308" r="4" fill="var(--teal,#1F4E5B)"/>
      <circle cx="456" cy="252" r="4" fill="var(--teal,#1F4E5B)"/>
      <circle cx="548" cy="236" r="4" fill="var(--teal,#1F4E5B)"/>
    </g>
    <!-- source + date chip -->
    <g data-anim="rise" style="--delay:1300ms">
      <rect x="600" y="200" width="172" height="120" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="620" y="232" font-size="11" font-weight="700" letter-spacing="0.06em">SOURCE</text>
      <text class="text-soft" x="620" y="256" font-size="13">dairy sales report</text>
      <line x1="620" y1="272" x2="752" y2="272" stroke="var(--line,#E8E2D6)"/>
      <text class="text-stone" x="620" y="294" font-size="11">report date attached</text>
      <text class="text-teal" x="620" y="312" font-size="12" text-decoration="underline">go check it yourself</text>
    </g>
    <text class="text-stone" x="400" y="446" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1800ms">A solid line, shown exactly as the agency published it.</text>
  </g>

  <!-- ============ DERIVED: dashed line, band, estimate badge ============ -->
  <g class="explainer-scene" data-scene-id="derived">
    <text class="scene-label text-rust" x="40" y="46" data-anim="fade">Derived · a labeled estimate</text>
    <text class="text-soft" x="40" y="74" font-size="13" data-anim="fade" style="--delay:120ms">Edible-portion beef — built from public inputs, never measured.</text>
    <!-- axes -->
    <g data-anim="rise" style="--delay:260ms">
      <line x1="120" y1="380" x2="120" y2="140" stroke="var(--line-dark,#D4CCBC)"/>
      <line x1="120" y1="380" x2="560" y2="380" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="110" y="148" text-anchor="end" font-size="10">$ / lb</text>
      <text class="text-stone" x="560" y="398" text-anchor="end" font-size="10">weeks</text>
    </g>
    <!-- confidence band (honest about uncertainty) -->
    <path d="M132 268 L240 250 L348 262 L456 228 L548 210 L548 270 L456 286 L348 318 L240 308 L132 320 Z" fill="rgba(184,84,26,0.12)" data-anim="fade" style="--delay:520ms"/>
    <!-- dashed derived line -->
    <path d="M132 294 L240 280 L348 290 L456 256 L548 240" stroke="var(--rust,#B8541A)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 6" data-anim="grow-x" style="--delay:820ms"/>
    <!-- band label -->
    <text class="text-rust" x="300" y="346" font-size="12" font-style="italic" data-anim="fade" style="--delay:1300ms">a wide band reads as an honest estimate</text>
    <!-- estimate badge -->
    <g data-anim="rise" style="--delay:1100ms">
      <rect x="612" y="206" width="150" height="40" rx="20" fill="var(--gold,#C8862A)"/>
      <text x="687" y="231" text-anchor="middle" font-size="13" font-weight="700" letter-spacing="0.05em" fill="var(--cream,#FAF7F2)">ESTIMATE</text>
    </g>
    <g data-anim="fade" style="--delay:1500ms">
      <text class="text-soft" x="612" y="278" font-size="12">dashed line +</text>
      <text class="text-soft" x="612" y="296" font-size="12">confidence band +</text>
      <text class="text-soft" x="612" y="314" font-size="12">a link to the method</text>
    </g>
    <text class="text-stone" x="400" y="446" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1900ms">Honest that it is an estimate — never dressed up as a measurement.</text>
  </g>

  <!-- ============ ABSENT: a named gap, not a number ============ -->
  <g class="explainer-scene" data-scene-id="absent">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Absent · a named gap</text>
    <text class="text-soft" x="40" y="74" font-size="13" data-anim="fade" style="--delay:120ms">A niche herb — no usable public series.</text>
    <!-- the greyed card -->
    <g data-anim="rise" style="--delay:300ms">
      <rect x="160" y="116" width="480" height="248" rx="16" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)" stroke-width="1.5" stroke-dasharray="10 7"/>
      <text class="text-stone" x="400" y="166" text-anchor="middle" font-size="13" font-weight="700" letter-spacing="0.08em">NO PUBLIC DATA — HERE'S WHY</text>
      <!-- struck-through "invented number" -->
      <g data-anim="fade" style="--delay:760ms">
        <text class="text-soft" x="400" y="222" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="40">— · —</text>
        <line x1="330" y1="212" x2="470" y2="212" stroke="var(--rust,#B8541A)" stroke-width="2.5"/>
      </g>
      <text class="text-stone" x="400" y="262" text-anchor="middle" font-size="13" font-style="italic" data-anim="fade" style="--delay:1000ms">no invented price stands in</text>
      <!-- the reason -->
      <g data-anim="rise" style="--delay:1200ms">
        <rect x="200" y="286" width="400" height="52" rx="10" fill="var(--white,#fff)" stroke="var(--line,#E8E2D6)"/>
        <text class="text-soft" x="400" y="310" text-anchor="middle" font-size="12.5">reason: small-cell confidentiality</text>
        <text class="text-soft" x="400" y="328" text-anchor="middle" font-size="12.5">suppression in the public source</text>
      </g>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">A named gap is more trustworthy than a quietly invented number.</text>
  </g>

  <!-- ============ LAND: you can always tell ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="118" text-anchor="middle">Measured · derived · absent</text>
    <!-- three labeled keys, one line each -->
    <g data-anim="rise" style="--delay:380ms">
      <line x1="232" y1="176" x2="312" y2="176" stroke="var(--teal,#1F4E5B)" stroke-width="3.5" stroke-linecap="round"/>
      <text class="text-soft" x="328" y="181" font-size="14">a published fact</text>
    </g>
    <g data-anim="rise" style="--delay:560ms">
      <line x1="232" y1="212" x2="312" y2="212" stroke="var(--rust,#B8541A)" stroke-width="3" stroke-linecap="round" stroke-dasharray="8 6"/>
      <text class="text-soft" x="328" y="217" font-size="14">a labeled estimate</text>
    </g>
    <g data-anim="rise" style="--delay:740ms">
      <line x1="232" y1="248" x2="312" y2="248" stroke="var(--line-dark,#D4CCBC)" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 8"/>
      <text class="text-soft" x="328" y="253" font-size="14">an honest gap</text>
    </g>
    <text data-anim="rise" style="--delay:960ms" x="400" y="332" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="38" font-style="italic" fill="var(--ink,#14161A)">Always tell which it is.</text>
    <text data-anim="fade" style="--delay:1320ms" class="text-stone" x="400" y="378" text-anchor="middle" font-size="15">Then decide how far to trust it.</text>
    <line data-anim="grow-x" style="--delay:1520ms; transform-origin:center" x1="340" y1="408" x2="460" y2="408" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
