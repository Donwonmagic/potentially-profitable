// Glossary explainer — PREDICTION BAND
//
// What a prediction band actually is — a calibrated low-to-high range
// around a forecast, not a single guessed number — and why the range is
// the honesty. Walks the idea from one lonely forecast figure, to a
// band, to what "80% coverage" promises, to how a conformal band sets
// its own width from past misses, and closes on the Cost Index's
// verified result: walked forward across 84 ingredients and 5,929
// scored steps, the band held about 84% of the time — a touch more than
// the 80% target, the honest direction to err. The only measured figures
// spoken are the calibration record's: 80% target (nominal 0.8), ~84%
// realized (0.836), 84 ingredients, 5,929 scored steps. The dollar
// numbers and "8 of 10 dots" are one illustrative example, labeled as
// such in the prose.

export default {
  term_slug: 'prediction-band',
  term_head: 'The prediction band, in 90 seconds.',
  subhead:   'A calibrated range, not a single guess.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'guess',    caption: 'Un solo número de pronóstico esconde qué tan inseguro es. Por ejemplo, "el precio será cuatro dólares con veinte la próxima semana" suena exacto, pero no te dice nada sobre cuánto se podría mover. Un número solitario, sin margen de error, finge una certeza que nadie tiene.' },
    { id: 'band',     caption: 'Una banda lo arregla. En lugar de un solo número, publicas un rango de bajo a alto alrededor de la línea del pronóstico — por ejemplo, entre cuatro dólares con cinco y cuatro con cuarenta. El ancho de la banda es la honestidad: una banda angosta afirma mucho, una banda ancha admite la duda.' },
    { id: 'coverage', caption: 'La cobertura es la promesa. Una banda construida para una cobertura del ochenta por ciento dice que el valor real debería caer dentro, en el largo plazo, alrededor de ocho de cada diez veces. Por ejemplo: de diez semanas, esperarías que unas ocho caigan dentro de la banda y unas dos se salgan.' },
    { id: 'conformal',caption: 'Conformal quiere decir que el ancho sale de los propios errores pasados del método, no de una suposición. Mides qué tan lejos ha quedado el pronóstico antes, y dimensionas la banda con eso: más ancha donde el método se ha equivocado, más angosta donde ha sido confiable.' },
    { id: 'verified', caption: 'Y se verifica. Caminando hacia adelante a través de ochenta y cuatro ingredientes y cinco mil novecientos veintinueve pasos evaluados, la banda de verdad se sostuvo alrededor del ochenta y cuatro por ciento de las veces — un poquito más que la promesa del ochenta por ciento. Cubrir un poco de más es la dirección honesta para equivocarse.' },
  ],
  scenes: [
    { id: 'guess',    ms: 13000, caption: 'A single forecast number hides how unsure it is. For example, "the price will be four-twenty next week" sounds exact, but it tells you nothing about how far it could move. A lone number, with no error bars, fakes a certainty nobody has.' },
    { id: 'band',     ms: 15000, caption: 'A band fixes that. Instead of one number, you publish a low-to-high range around the forecast line — for example, somewhere between four-oh-five and four-forty. The width of the band is the honesty: a tight band claims a lot, a wide band admits the doubt.' },
    { id: 'coverage', ms: 16000, caption: 'Coverage is the promise. A band built for eighty percent coverage is saying the real value should land inside it, over a long run, about eight times out of ten. For example: across ten weeks, you would expect roughly eight to land inside the band and about two to fall outside.' },
    { id: 'conformal',ms: 15000, caption: 'Conformal means the width is set from the method’s own past misses, not from an assumption. You score how far off the forecast has been before, then size the band from that — wider where it has been wrong, tighter where it has been reliable.' },
    { id: 'verified', ms: 15000, caption: 'And it is verified. Walked forward across eighty-four ingredients and five thousand nine hundred twenty-nine scored steps, the band actually held about eighty-four percent of the time — a touch more than the eighty percent promise. Covering a little extra is the honest direction to err.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of a prediction band: a single forecast number, then a shaded low-to-high range around the forecast line, eighty percent coverage shown as eight of ten points inside, a conformal band that widens where the method has missed, and the Cost Index result of about eighty-four percent coverage across eighty-four ingredients and 5,929 scored steps">
  <defs>
    <linearGradient id="pb-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
    <linearGradient id="pb-band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="var(--teal,#1F4E5B)" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="var(--teal,#1F4E5B)" stop-opacity="0.10"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#pb-bg)"/>

  <!-- ============ GUESS: one lonely forecast number ============ -->
  <g class="explainer-scene" data-scene-id="guess">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">One number, no error bars</text>
    <!-- a bare axis with a single dot floating on it -->
    <g data-anim="fade" style="--delay:140ms">
      <line class="axis-line" x1="120" y1="380" x2="680" y2="380"/>
      <text class="text-stone" x="120" y="408" font-size="11" letter-spacing="0.06em">next week</text>
    </g>
    <!-- the single forecast figure -->
    <g data-anim="pop" style="--delay:360ms">
      <circle cx="400" cy="250" r="9" fill="var(--rust,#B8541A)"/>
      <line x1="400" y1="259" x2="400" y2="380" stroke="var(--rust,#B8541A)" stroke-width="1.25" stroke-dasharray="3 4"/>
    </g>
    <g data-anim="rise" style="--delay:620ms">
      <text class="text-teal" x="400" y="180" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="56">$4.20</text>
      <text class="text-stone" x="400" y="214" text-anchor="middle" font-size="13">a single forecast</text>
    </g>
    <text class="text-rust" x="400" y="446" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1100ms">A lone number fakes a certainty nobody has.</text>
  </g>

  <!-- ============ BAND: a low-to-high range around the line ============ -->
  <g class="explainer-scene" data-scene-id="band">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">A range, not a point</text>
    <g data-anim="fade" style="--delay:120ms">
      <line class="axis-line" x1="120" y1="400" x2="700" y2="400"/>
    </g>
    <!-- the shaded band (grows up from baseline), high edge ~150, low edge ~300 -->
    <g data-anim="grow-y" style="--delay:300ms; transform-origin:center bottom">
      <path d="M120,150 L260,134 L400,158 L540,140 L700,162 L700,300 L540,286 L400,308 L260,282 L120,300 Z" fill="url(#pb-band)" stroke="var(--teal,#1F4E5B)" stroke-width="1" stroke-opacity="0.35"/>
    </g>
    <!-- the forecast line down the middle of the band -->
    <g data-anim="grow-x" style="--delay:820ms">
      <polyline points="120,225 260,208 400,233 540,213 700,212" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <!-- edge labels -->
    <g data-anim="fade" style="--delay:1240ms">
      <text class="text-stone" x="116" y="138" text-anchor="end" font-size="12">high $4.40</text>
      <text class="text-stone" x="116" y="304" text-anchor="end" font-size="12">low $4.05</text>
      <text class="text-teal" x="712" y="216" font-size="12">forecast</text>
    </g>
    <text class="text-soft" x="400" y="456" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1500ms">Width is the honesty: tight claims a lot, wide admits doubt (example range).</text>
  </g>

  <!-- ============ COVERAGE: 8 of 10 inside, 2 outside ============ -->
  <g class="explainer-scene" data-scene-id="coverage">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Built for 80% coverage</text>
    <!-- band band as a horizontal channel -->
    <g data-anim="grow-x" style="--delay:160ms">
      <rect x="90" y="150" width="620" height="150" rx="6" fill="url(#pb-band)" stroke="var(--teal,#1F4E5B)" stroke-width="1" stroke-opacity="0.35"/>
      <line x1="90" y1="225" x2="710" y2="225" stroke="var(--teal,#1F4E5B)" stroke-width="2" stroke-dasharray="2 5"/>
    </g>
    <g data-anim="fade" style="--delay:520ms">
      <text class="text-teal" x="96" y="142" font-size="11" letter-spacing="0.1em">INSIDE THE BAND</text>
    </g>
    <!-- 8 points inside (teal) -->
    <g data-anim="pop" style="--delay:640ms"><circle cx="140" cy="200" r="8" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:700ms"><circle cx="205" cy="252" r="8" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:760ms"><circle cx="270" cy="186" r="8" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:820ms"><circle cx="335" cy="240" r="8" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:880ms"><circle cx="400" cy="210" r="8" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:940ms"><circle cx="465" cy="262" r="8" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:1000ms"><circle cx="530" cy="192" r="8" fill="var(--teal,#1F4E5B)"/></g>
    <g data-anim="pop" style="--delay:1060ms"><circle cx="660" cy="246" r="8" fill="var(--teal,#1F4E5B)"/></g>
    <!-- 2 points outside (rust) -->
    <g data-anim="pop" style="--delay:1180ms"><circle cx="595" cy="118" r="8" fill="var(--rust,#B8541A)"/></g>
    <g data-anim="pop" style="--delay:1240ms"><circle cx="640" cy="338" r="8" fill="var(--rust,#B8541A)"/></g>
    <g data-anim="rise" style="--delay:1380ms">
      <text class="text-teal" x="250" y="400" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34">~8 inside</text>
      <text class="text-rust" x="540" y="400" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34">~2 outside</text>
    </g>
    <text class="text-stone" x="400" y="450" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">For example: about eight of ten land inside, two fall out.</text>
  </g>

  <!-- ============ CONFORMAL: width set from past misses ============ -->
  <g class="explainer-scene" data-scene-id="conformal">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Width from its own misses</text>
    <g data-anim="fade" style="--delay:120ms">
      <line class="axis-line" x1="110" y1="400" x2="710" y2="400"/>
    </g>
    <!-- adaptive band: tight on the left (reliable), wide on the right (was wrong) -->
    <g data-anim="grow-x" style="--delay:300ms">
      <path d="M110,210 L310,206 L510,170 L710,120 L710,250 L510,266 L310,256 L110,250 Z" fill="url(#pb-band)" stroke="var(--teal,#1F4E5B)" stroke-width="1" stroke-opacity="0.35"/>
      <polyline points="110,230 310,231 510,218 710,185" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <!-- tight marker (left) -->
    <g data-anim="rise" style="--delay:900ms">
      <line x1="170" y1="206" x2="170" y2="250" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <text class="text-teal" x="170" y="300" text-anchor="middle" font-size="12">tighter</text>
      <text class="text-stone" x="170" y="320" text-anchor="middle" font-size="11">been reliable</text>
    </g>
    <!-- wide marker (right) -->
    <g data-anim="rise" style="--delay:1160ms">
      <line x1="660" y1="128" x2="660" y2="244" stroke="var(--rust,#B8541A)" stroke-width="2"/>
      <text class="text-rust" x="660" y="300" text-anchor="middle" font-size="12">wider</text>
      <text class="text-stone" x="660" y="320" text-anchor="middle" font-size="11">been wrong</text>
    </g>
    <text class="text-soft" x="400" y="452" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1500ms">Past misses set the width — no assumption about the data’s shape.</text>
  </g>

  <!-- ============ VERIFIED: walked forward, held ~84% ============ -->
  <g class="explainer-scene" data-scene-id="verified">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="fade" class="scene-label text-teal" x="400" y="92" text-anchor="middle">Walked forward, it held</text>
    <!-- target vs realized, two bars on a 0-100 track -->
    <g data-anim="rise" style="--delay:200ms">
      <text class="text-stone" x="120" y="168" font-size="11" letter-spacing="0.1em">PROMISED</text>
      <rect x="120" y="180" height="40" rx="4" fill="var(--stone,#6B6358)" opacity="0.35" width="448"/>
      <text x="120" y="180" font-size="0"> </text>
    </g>
    <g data-anim="rise" style="--delay:240ms">
      <text class="text-stone" x="576" y="208" font-size="16">80% target</text>
    </g>
    <g data-anim="rise" style="--delay:520ms">
      <text class="text-teal" x="120" y="262" font-size="11" letter-spacing="0.1em">REALIZED</text>
      <rect x="120" y="274" height="40" rx="4" fill="var(--teal,#1F4E5B)" data-anim="grow-x" style="--delay:680ms" width="470"/>
      <text x="120" y="274" font-size="0"> </text>
    </g>
    <g data-anim="fade" style="--delay:1100ms">
      <text class="text-teal" x="600" y="302" font-family="Fraunces, Georgia, serif" font-size="26">~84%</text>
    </g>
    <g data-anim="fade" style="--delay:1340ms">
      <text class="text-stone" x="400" y="372" text-anchor="middle" font-size="14">across 84 ingredients · 5,929 scored steps</text>
    </g>
    <text data-anim="rise" style="--delay:1560ms" x="400" y="424" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="26" font-style="italic" fill="var(--ink,#14161A)">A touch more than promised.</text>
    <text data-anim="fade" style="--delay:1880ms" class="text-stone" x="400" y="458" text-anchor="middle" font-size="14">Covering a little extra is the honest direction to err.</text>
  </g>
</svg>`,
};
