// Glossary explainer — ASPECT RATIO
//
// One source frame, eight destination surfaces. Web hero (16:9), OG
// card (1.91:1), Yelp featured (3:2), GBP cover (16:9), Instagram
// grid (1:1), Instagram story (9:16), menu inline (4:3), Apple Maps
// (4:3). Walks through what bad cropping does to a great photo, then
// shows the "compose at 3:2 with eight crops in mind" approach.

export default {
  term_slug: 'aspect-ratio',
  term_head: 'Aspect ratio, in 90 seconds.',
  subhead:   'One source frame · eight destinations.',
  duration_ms: 90000,
  audio_url: null,
  scenes_es: [
    { id: 'frame',     caption: 'Una foto. Bien iluminada, bien compuesta. La sirviente entra al encuadre, gira el plato, el sous chef pone la guarnición. La cámara dispara a tres por dos. Una toma — esto es lo que el restaurante usa para todo.' },
    { id: 'surfaces',  caption: 'Excepto que "todo" no es un destino. Es ocho. El hero web a 16:9. La tarjeta de Open Graph a 1,91:1. La portada de Yelp a 3:2. La portada de Google Business a 16:9. La parrilla de Instagram a 1:1. La historia a 9:16. El inline del menú a 4:3. Apple Maps a 4:3.' },
    { id: 'bad',       caption: 'Súbela tal cual y mira lo que rompe. La cabeza del plato cortada en el hero. La portada de Yelp con el logo donde iba el ingrediente. El cuadro del menú con un tercio del plato vacío. La parrilla de Instagram cortando la salsa.' },
    { id: 'compose',   caption: 'La solución no es ocho fotos. Es una foto, encuadrada con ocho recortes en mente. Componer al 3:2, dejar respiro arriba y abajo, dejar respiro a la izquierda. Cada destino encuentra su forma adentro.' },
    { id: 'good',      caption: 'Misma foto. Ocho recortes. El hero respira. La OG funciona. La parrilla de Instagram queda cuadrada en el plato. La historia tiene aire para el copy en la parte de abajo. La pasada de cinco minutos en una sesión, no una segunda jornada de fotos.' },
    { id: 'land',      caption: 'No estás tomando ocho fotos. Estás componiendo una foto consciente de ocho destinos. Esa es toda la diferencia.' },
  ],
  scenes: [
    { id: 'frame',    ms: 14000, caption: 'One photograph. Well-lit, well-composed. The server steps into frame, turns the plate, the sous-chef sets the garnish. The camera fires at 3:2. One shot — this is what the restaurant uses everywhere.' },
    { id: 'surfaces', ms: 18000, caption: 'Except "everywhere" isn’t one destination. It’s eight. Web hero at 16:9. Open Graph card at 1.91:1. Yelp featured at 3:2. Google Business cover at 16:9. Instagram grid at 1:1. Story at 9:16. Menu inline at 4:3. Apple Maps at 4:3.' },
    { id: 'bad',      ms: 16000, caption: 'Push it as-is and watch what breaks. The plate’s top cut off in the hero. Yelp featured with the logo where the garnish was. The menu inline with a third of the plate empty. The Instagram grid cropping the sauce.' },
    { id: 'compose',  ms: 16000, caption: 'The fix isn’t eight photos. It’s one photo, framed with eight crops in mind. Compose at 3:2, leave breathing room top and bottom, leave breathing room on the left. Every destination finds its shape inside.' },
    { id: 'good',     ms: 14000, caption: 'Same shot. Eight crops. The hero breathes. OG works. The Instagram grid lands square on the plate. The story has air for caption copy at the bottom. A five-minute pass on shoot day — not a second photo session.' },
    { id: 'land',     ms: 12000, caption: 'You’re not taking eight photos. You’re composing one photo aware of eight destinations. That’s the entire difference.' },
  ],
  svg: `<svg width="800" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of photo aspect ratios">
  <defs>
    <linearGradient id="ar-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
    <!-- A schematic "dish on a plate" used inside every crop. Lets the
         same source content render at any aspect without bringing in a
         real raster image. -->
    <symbol id="dish-tile" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
      <rect width="600" height="400" fill="#3a2a18"/>
      <!-- table -->
      <rect y="280" width="600" height="120" fill="#5a3f22"/>
      <!-- plate -->
      <ellipse cx="300" cy="240" rx="180" ry="40" fill="#000" opacity="0.18"/>
      <ellipse cx="300" cy="232" rx="180" ry="50" fill="#f3eee3"/>
      <ellipse cx="300" cy="226" rx="166" ry="44" fill="#fff"/>
      <!-- food (warm-toned dish) -->
      <ellipse cx="300" cy="222" rx="120" ry="28" fill="#b8541a"/>
      <ellipse cx="280" cy="216" rx="90" ry="22" fill="#c28b2e"/>
      <ellipse cx="320" cy="220" rx="60" ry="14" fill="#8a6018"/>
      <!-- garnish -->
      <circle cx="240" cy="210" r="6" fill="#1F6B3A"/>
      <circle cx="360" cy="210" r="5" fill="#1F6B3A"/>
      <circle cx="290" cy="206" r="4" fill="#fff"/>
      <!-- hand on the right edge, just suggesting it -->
      <path d="M 540 230 q 30 -10 50 0 q -10 20 -30 26 q -20 6 -30 -10 z" fill="#d8b496" opacity="0.5"/>
    </symbol>
  </defs>
  <rect width="800" height="500" fill="url(#ar-bg)"/>

  <!-- ============ FRAME ============ -->
  <g class="explainer-scene" data-scene-id="frame">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">One source frame · 3:2</text>
    <!-- A 3:2 frame, centered. 480 × 320. -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="160" y="120" width="480" height="320" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <use href="#dish-tile" x="160" y="120" width="480" height="320"/>
      <!-- corner ticks -->
      <path d="M 160 110 l 0 -10 l 10 0" stroke="var(--ink,#14161A)" stroke-width="1.5" fill="none" data-anim="fade" style="--delay:600ms"/>
      <path d="M 640 110 l 0 -10 l -10 0" stroke="var(--ink,#14161A)" stroke-width="1.5" fill="none" data-anim="fade" style="--delay:600ms"/>
      <path d="M 160 450 l 0 10 l 10 0" stroke="var(--ink,#14161A)" stroke-width="1.5" fill="none" data-anim="fade" style="--delay:600ms"/>
      <path d="M 640 450 l 0 10 l -10 0" stroke="var(--ink,#14161A)" stroke-width="1.5" fill="none" data-anim="fade" style="--delay:600ms"/>
      <text class="text-stone" x="400" y="100" text-anchor="middle" font-size="11" letter-spacing="0.12em" data-anim="fade" style="--delay:780ms">SOURCE · 3 : 2</text>
    </g>
  </g>

  <!-- ============ SURFACES ============ -->
  <g class="explainer-scene" data-scene-id="surfaces">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Eight destinations · canonical aspects</text>
    <!-- Row of 8 small reference rectangles, each labelled with its ratio. -->
    <!-- Row layout: 2 rows of 4, each tile ~140×72 with caption.   -->
    ${[
      { x: 60,  y: 100, w: 144, h: 81,  ratio: '16 : 9', label: 'Web hero' },
      { x: 240, y: 100, w: 154, h: 81,  ratio: '1.91 : 1', label: 'Open Graph' },
      { x: 430, y: 100, w: 121, h: 81,  ratio: '3 : 2', label: 'Yelp featured' },
      { x: 590, y: 100, w: 144, h: 81,  ratio: '16 : 9', label: 'Google Business' },
      { x: 60,  y: 260, w: 100, h: 100, ratio: '1 : 1', label: 'Instagram grid' },
      { x: 200, y: 260, w: 56,  h: 100, ratio: '9 : 16', label: 'IG story' },
      { x: 300, y: 260, w: 132, h: 99,  ratio: '4 : 3', label: 'Menu inline' },
      { x: 480, y: 260, w: 132, h: 99,  ratio: '4 : 3', label: 'Apple Maps' },
    ].map((t, i) => `
      <g data-anim="pop" style="--delay:${i * 110}ms">
        <rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
        <use href="#dish-tile" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}"/>
        <text x="${t.x + t.w / 2}" y="${t.y + t.h + 18}" text-anchor="middle" font-size="11" class="text-stone">${t.label}</text>
        <text x="${t.x + t.w / 2}" y="${t.y + t.h + 32}" text-anchor="middle" font-size="10" class="text-teal" font-weight="500">${t.ratio}</text>
      </g>
    `).join('')}
    <text class="text-soft" x="400" y="468" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1300ms" font-style="italic">No two surfaces want the same shape.</text>
  </g>

  <!-- ============ BAD ============ -->
  <g class="explainer-scene" data-scene-id="bad">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Push as-is · what breaks</text>
    <!-- 4 mis-cropped surfaces -->
    <!-- Web hero: top of plate cut off -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="60" y="100" width="320" height="180" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <svg x="60" y="100" width="320" height="180" viewBox="0 30 600 280" preserveAspectRatio="xMidYMid slice">
        <use href="#dish-tile" x="0" y="0" width="600" height="400"/>
      </svg>
      <text class="text-stone" x="220" y="296" text-anchor="middle" font-size="11">Web hero · 16:9</text>
      <text class="text-rust" x="220" y="312" text-anchor="middle" font-size="11" font-weight="500">top of plate cropped off</text>
    </g>
    <!-- OG: text overlay zone falls on the dish -->
    <g data-anim="rise" style="--delay:340ms">
      <rect x="420" y="100" width="320" height="167" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <use href="#dish-tile" x="420" y="100" width="320" height="167"/>
      <rect x="420" y="220" width="320" height="47" fill="var(--ink,#14161A)" opacity="0.78"/>
      <text x="436" y="252" font-size="13" fill="var(--cream,#FAF7F2)">muntin.digital — restaurant audit</text>
      <text class="text-stone" x="580" y="280" text-anchor="middle" font-size="11">Open Graph · 1.91:1</text>
      <text class="text-rust" x="580" y="296" text-anchor="middle" font-size="11" font-weight="500">caption bar lands on the food</text>
    </g>
    <!-- IG grid: sauce cropped -->
    <g data-anim="rise" style="--delay:520ms">
      <rect x="60" y="320" width="120" height="120" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <svg x="60" y="320" width="120" height="120" viewBox="80 0 440 400" preserveAspectRatio="xMidYMid slice">
        <use href="#dish-tile" x="0" y="0" width="600" height="400"/>
      </svg>
      <text class="text-stone" x="120" y="456" text-anchor="middle" font-size="11">IG grid · 1:1</text>
      <text class="text-rust" x="120" y="472" text-anchor="middle" font-size="11" font-weight="500">edges of plate gone</text>
    </g>
    <!-- Menu inline: 1/3 of plate empty -->
    <g data-anim="rise" style="--delay:700ms">
      <rect x="220" y="320" width="180" height="135" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <svg x="220" y="320" width="180" height="135" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <use href="#dish-tile" x="100" y="100" width="600" height="400"/>
      </svg>
      <text class="text-stone" x="310" y="471" text-anchor="middle" font-size="11">Menu inline · 4:3</text>
      <text class="text-rust" x="310" y="487" text-anchor="middle" font-size="11" font-weight="500">third of frame empty</text>
    </g>
    <!-- Apple Maps: cropped to a sliver -->
    <g data-anim="rise" style="--delay:880ms">
      <rect x="440" y="320" width="180" height="135" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <svg x="440" y="320" width="180" height="135" viewBox="200 100 400 200" preserveAspectRatio="xMidYMid slice">
        <use href="#dish-tile" x="0" y="0" width="600" height="400"/>
      </svg>
      <text class="text-stone" x="530" y="471" text-anchor="middle" font-size="11">Apple Maps · 4:3</text>
      <text class="text-rust" x="530" y="487" text-anchor="middle" font-size="11" font-weight="500">no context, just sauce</text>
    </g>
  </g>

  <!-- ============ COMPOSE ============ -->
  <g class="explainer-scene" data-scene-id="compose">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Compose at 3:2 with breathing room</text>
    <!-- Source frame -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="160" y="100" width="480" height="320" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <use href="#dish-tile" x="160" y="100" width="480" height="320"/>
    </g>
    <!-- Overlay outlines for each destination, anchored to dish -->
    <!-- 16:9 hero -->
    <rect x="160" y="160" width="480" height="200" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2.5" stroke-dasharray="6 4" data-anim="grow-x" style="--delay:520ms"/>
    <text x="652" y="262" font-size="11" class="text-teal" data-anim="fade" style="--delay:900ms">16:9 hero</text>
    <!-- 1:1 IG -->
    <rect x="280" y="100" width="240" height="240" fill="none" stroke="var(--rust,#B8541A)" stroke-width="2" stroke-dasharray="4 3" data-anim="pop" style="--delay:760ms"/>
    <text x="528" y="116" font-size="11" class="text-rust" data-anim="fade" style="--delay:1100ms">1:1 IG</text>
    <!-- 9:16 story (vertical) -->
    <rect x="319" y="100" width="180" height="320" fill="none" stroke="#8A6018" stroke-width="2" stroke-dasharray="4 3" data-anim="pop" style="--delay:980ms"/>
    <text x="328" y="116" font-size="11" fill="#8A6018" data-anim="fade" style="--delay:1240ms">9:16 story</text>
    <!-- Headline -->
    <text class="text-soft" x="400" y="460" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1500ms" font-style="italic">Every destination fits inside one mindful frame.</text>
  </g>

  <!-- ============ GOOD ============ -->
  <g class="explainer-scene" data-scene-id="good">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Same shot · eight clean crops</text>
    ${[
      { x: 60,  y: 100, w: 144, h: 81,  ratio: '16:9',   label: 'Web hero' },
      { x: 240, y: 100, w: 154, h: 81,  ratio: '1.91:1', label: 'Open Graph' },
      { x: 430, y: 100, w: 121, h: 81,  ratio: '3:2',    label: 'Yelp featured' },
      { x: 590, y: 100, w: 144, h: 81,  ratio: '16:9',   label: 'Google Business' },
      { x: 60,  y: 260, w: 100, h: 100, ratio: '1:1',    label: 'IG grid' },
      { x: 200, y: 260, w: 56,  h: 100, ratio: '9:16',   label: 'IG story' },
      { x: 300, y: 260, w: 132, h: 99,  ratio: '4:3',    label: 'Menu inline' },
      { x: 480, y: 260, w: 132, h: 99,  ratio: '4:3',    label: 'Apple Maps' },
    ].map((t, i) => `
      <g data-anim="pop" style="--delay:${i * 90}ms">
        <rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="var(--white,#fff)" stroke="var(--status-good,#1F6B3A)" stroke-width="1.5"/>
        <use href="#dish-tile" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}"/>
        <text x="${t.x + t.w / 2}" y="${t.y + t.h + 18}" text-anchor="middle" font-size="11" class="text-stone">${t.label}</text>
        <text x="${t.x + t.w / 2}" y="${t.y + t.h + 32}" text-anchor="middle" font-size="10" class="text-good" font-weight="500">${t.ratio} · ✓</text>
      </g>
    `).join('')}
    <text class="text-good" x="400" y="468" text-anchor="middle" font-size="14" data-anim="fade" style="--delay:1100ms" font-weight="500">A five-minute pass on shoot day — not a second photo session.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="180" text-anchor="middle">Aspect ratio</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="260" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="44" font-style="italic" fill="var(--ink,#14161A)">One frame, eight crops.</text>
    <text data-anim="fade" style="--delay:780ms" class="text-stone" x="400" y="320" text-anchor="middle" font-size="14">Compose for the destinations, not the camera.</text>
    <line data-anim="grow-x" style="--delay:980ms; transform-origin:center" x1="340" y1="350" x2="460" y2="350" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
