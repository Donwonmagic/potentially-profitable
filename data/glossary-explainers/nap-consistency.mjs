// Glossary explainer — NAP CONSISTENCY
//
// What NAP consistency is (your Name, Address, and Phone stated identically
// everywhere they appear — Google, Yelp, your own site, the delivery apps,
// old directories), why it matters (search engines build confidence by
// cross-checking; agreement earns trust and a place in the local map pack,
// disagreement makes the engine hedge), the non-obvious part (the damage is
// invisible — every mismatch is a small doubt and you never see the ranking
// you quietly did not get), and the move (pick one exact format, write it
// down, fix it everywhere, re-check after any move or new number).
// Qualitative throughout. The only "number" is the illustrative "thirty
// sources," and format examples like "Ste 200" versus "Suite 200." No
// statistics, no click-through or ranking percentages, no operator data.
// Pairs with the Google Business Profile and map-pack explainers — the
// engine counts who agrees, then decides who gets the map-pack seat.

export default {
  term_slug: 'nap-consistency',
  term_head: 'NAP consistency, in 90 seconds.',
  subhead:   'Why your name, address, and phone must match everywhere — exactly.',
  duration_ms: 73000,
  audio_url: null,
  scenes_es: [
    { id: 'define', caption: 'NAP son tres letras: Nombre, Dirección y Teléfono — los tres datos sencillos de tu restaurante. Consistencia de NAP quiere decir que son idénticos en todas partes donde aparecen: Google, Yelp, tu propio sitio, las apps de entrega, los directorios viejos. El mismo número de local, el mismo "Calle" o "C.", el mismo formato de teléfono, todas las veces.' },
    { id: 'why',    caption: 'Los buscadores construyen confianza cotejando. Cuando treinta fuentes dicen el mismo nombre, la misma dirección y el mismo teléfono, Google se cree el dato — y se cree en ti lo suficiente para ponerte en el paquete de mapas local. Cuando no coinciden, duda, y te resbalas hacia abajo.' },
    { id: 'killer', caption: 'El daño es invisible. Una ficha vieja con tu teléfono anterior; "Local 200" en un sitio y "Suite 200" en otro; un directorio con un error de dedo. Cada desajuste es una pequeña duda — y nunca llegas a ver la posición que, calladito, no te dieron.' },
    { id: 'move',   caption: 'Así que elige un formato exacto. Anótalo. Luego arréglalo en todas partes — primero Google, después los directorios grandes, y al final caza los viejos. Vuelve a revisar después de cada mudanza o cada teléfono nuevo.' },
    { id: 'land',   caption: 'La máquina no te puede pedir que confirmes. Solo cuenta quién coincide. Haz que cada fuente cuente la misma historia.' },
  ],
  scenes: [
    { id: 'define', ms: 14000, caption: 'NAP is Name, Address, Phone — the three plain facts about your restaurant. NAP consistency means they are identical everywhere they appear: Google, Yelp, your own site, the delivery apps, old directories. Same suite number, same "St." or "Street," same phone format, every time.' },
    { id: 'why',    ms: 15000, caption: 'Search engines build confidence by cross-checking. When thirty sources all state the same name, address, and phone, Google trusts the fact — and trusts you enough to put you in the local map pack. When they disagree, it hedges, and you slip.' },
    { id: 'killer', ms: 16000, caption: 'The damage is invisible. An old listing with your previous phone number; "Ste 200" on one site and "Suite 200" on another; a directory with a typo. Each mismatch is a small doubt — and you never see the ranking you quietly did not get.' },
    { id: 'move',   ms: 14000, caption: 'So pick one exact format. Write it down. Then fix it everywhere — Google first, then the big directories, then hunt the stale ones. Re-check after any move or new phone number.' },
    { id: 'land',   ms: 14000, caption: 'The machine cannot ask you to confirm. It just counts who agrees. Make every source tell the same story.' },
  ],
  svg: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of NAP consistency — name, address, and phone matching across every source so search engines can cross-check and trust your restaurant">
  <defs>
    <linearGradient id="np-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#np-bg)"/>

  <!-- ============ DEFINE — the three plain facts on a clean card ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Three plain facts</text>
    <g data-anim="rise" style="--delay:160ms">
      <rect x="230" y="92" width="340" height="316" rx="14" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="262" y="128" font-size="11" letter-spacing="0.12em">N · A · P</text>
      <line x1="262" y1="144" x2="538" y2="144" stroke="var(--line,#E8E2D6)"/>
    </g>
    <g data-anim="rise" style="--delay:440ms">
      <text class="text-stone" x="262" y="184" font-size="11" letter-spacing="0.1em">NAME</text>
      <text class="text-soft" x="262" y="212" font-family="Fraunces, Georgia, serif" font-size="24">The Corner Table</text>
    </g>
    <g data-anim="rise" style="--delay:720ms">
      <text class="text-stone" x="262" y="256" font-size="11" letter-spacing="0.1em">ADDRESS</text>
      <text class="text-soft" x="262" y="284" font-family="Fraunces, Georgia, serif" font-size="24">814 Main St, Ste 200</text>
    </g>
    <g data-anim="rise" style="--delay:1000ms">
      <text class="text-stone" x="262" y="328" font-size="11" letter-spacing="0.1em">PHONE</text>
      <text class="text-soft" x="262" y="356" font-family="Fraunces, Georgia, serif" font-size="24">(301) 555-0142</text>
    </g>
    <text class="text-stone" x="400" y="440" text-anchor="middle" font-size="13" font-style="italic" data-anim="fade" style="--delay:1380ms">Same facts — stated identically everywhere.</text>
  </g>

  <!-- ============ WHY — many matching sources earn the trusted map-pack seat ============ -->
  <g class="explainer-scene" data-scene-id="why">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Agreement builds trust</text>
    <!-- ~30 matching source chips, all identical -->
    <g data-anim="fade" style="--delay:140ms">
      <rect x="60"  y="92"  width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="126" y="92"  width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="192" y="92"  width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="258" y="92"  width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="324" y="92"  width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="60"  y="124" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="126" y="124" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="192" y="124" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="258" y="124" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="324" y="124" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="60"  y="156" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="126" y="156" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="192" y="156" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="258" y="156" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="324" y="156" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="60"  y="188" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="126" y="188" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="192" y="188" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="258" y="188" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="324" y="188" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="60"  y="220" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="126" y="220" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="192" y="220" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="258" y="220" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="324" y="220" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="60"  y="252" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="126" y="252" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="192" y="252" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="258" y="252" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
      <rect x="324" y="252" width="58" height="22" rx="11" fill="var(--cream-2,#F3EEE3)" stroke="var(--teal,#1F4E5B)"/>
    </g>
    <text class="text-stone" x="222" y="300" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:600ms">~30 sources, all saying the same thing</text>
    <!-- the cross-check arrow -->
    <text class="text-stone" x="432" y="178" text-anchor="middle" font-size="34" data-anim="fade" style="--delay:900ms">&#8594;</text>
    <!-- the trusted map-pack seat -->
    <g data-anim="grow-x" style="--delay:1100ms">
      <rect x="470" y="120" width="270" height="120" rx="12" fill="var(--teal,#1F4E5B)"/>
      <text x="490" y="160" font-size="12" letter-spacing="0.1em" fill="var(--cream,#FAF7F2)">VERDICT</text>
      <text x="490" y="200" font-family="Fraunces, Georgia, serif" font-size="28" fill="var(--cream,#FAF7F2)">Trusted</text>
    </g>
    <text class="text-teal" x="605" y="276" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1500ms">— and handed a map-pack seat.</text>
  </g>

  <!-- ============ KILLER — a few disagreeing sources, the invisible slip ============ -->
  <g class="explainer-scene" data-scene-id="killer">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">The damage is invisible</text>
    <g data-anim="rise" style="--delay:160ms">
      <rect x="60" y="96" width="320" height="58" rx="8" fill="rgba(184,84,26,0.08)" stroke="var(--rust,#B8541A)"/>
      <text class="text-stone" x="80" y="122" font-size="11" letter-spacing="0.1em">OLD DIRECTORY</text>
      <text class="text-rust" x="80" y="144" font-size="15">(301) 555-0142 &#8594; old number</text>
    </g>
    <g data-anim="rise" style="--delay:440ms">
      <rect x="60" y="166" width="320" height="58" rx="8" fill="rgba(184,84,26,0.08)" stroke="var(--rust,#B8541A)"/>
      <text class="text-stone" x="80" y="192" font-size="11" letter-spacing="0.1em">FORMAT MISMATCH</text>
      <text class="text-rust" x="80" y="214" font-size="15">"Ste 200" vs "Suite 200"</text>
    </g>
    <g data-anim="rise" style="--delay:720ms">
      <rect x="60" y="236" width="320" height="58" rx="8" fill="rgba(184,84,26,0.08)" stroke="var(--rust,#B8541A)"/>
      <text class="text-stone" x="80" y="262" font-size="11" letter-spacing="0.1em">TYPO</text>
      <text class="text-rust" x="80" y="284" font-size="15">814 Maine St &#8594; misspelled</text>
    </g>
    <!-- the engine hedges -->
    <g data-anim="fade" style="--delay:1080ms">
      <text class="text-stone" x="432" y="200" text-anchor="middle" font-size="34">&#8594;</text>
      <rect x="470" y="120" width="270" height="120" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)" stroke-dasharray="4 3"/>
      <text class="text-stone" x="490" y="160" font-size="12" letter-spacing="0.1em">VERDICT</text>
      <text class="text-rust" x="490" y="200" font-family="Fraunces, Georgia, serif" font-size="28">Hedged</text>
    </g>
    <text class="text-stone" x="400" y="356" text-anchor="middle" font-size="15" font-style="italic" data-anim="fade" style="--delay:1480ms">You never see the ranking you quietly did not get.</text>
  </g>

  <!-- ============ MOVE — pick one format, then fix everywhere ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Pick one format, fix everywhere</text>
    <!-- the one written-down format -->
    <g data-anim="rise" style="--delay:160ms">
      <rect x="60" y="120" width="220" height="150" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-stone" x="170" y="156" text-anchor="middle" font-size="11" letter-spacing="0.1em">ONE EXACT FORMAT</text>
      <text class="text-teal" x="170" y="196" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22">Write it down</text>
      <text class="text-stone" x="170" y="232" text-anchor="middle" font-size="12">your single source of truth</text>
    </g>
    <!-- arrow into the fix order -->
    <text class="text-stone" x="312" y="200" text-anchor="middle" font-size="32" data-anim="fade" style="--delay:520ms">&#8594;</text>
    <!-- fix order: Google -> directories -> stale -->
    <g data-anim="rise" style="--delay:700ms">
      <rect x="350" y="124" width="390" height="42" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="372" y="151" font-size="15">1 &#183; Google first</text>
    </g>
    <g data-anim="rise" style="--delay:940ms">
      <rect x="350" y="178" width="390" height="42" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="372" y="205" font-size="15">2 &#183; the big directories</text>
    </g>
    <g data-anim="rise" style="--delay:1180ms">
      <rect x="350" y="232" width="390" height="42" rx="8" fill="var(--cream-2,#F3EEE3)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-soft" x="372" y="259" font-size="15">3 &#183; hunt the stale ones</text>
    </g>
    <!-- the re-check loop -->
    <g data-anim="fade" style="--delay:1500ms">
      <rect x="160" y="330" width="480" height="64" rx="12" fill="rgba(31,78,91,0.10)" stroke="var(--teal,#1F4E5B)"/>
      <text class="text-teal" x="400" y="368" text-anchor="middle" font-size="14">Re-check after any move or new phone number.</text>
    </g>
  </g>

  <!-- ============ LAND — the punchline ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="166" text-anchor="middle">NAP consistency</text>
    <text data-anim="rise" style="--delay:380ms" x="400" y="248" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="38" font-style="italic" fill="var(--ink,#14161A)">Make every source agree.</text>
    <text data-anim="fade" style="--delay:820ms" class="text-stone" x="400" y="310" text-anchor="middle" font-size="15">The machine cannot ask you to confirm. It just counts who agrees.</text>
    <line data-anim="grow-x" style="--delay:1020ms; transform-origin:center" x1="340" y1="342" x2="460" y2="342" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
  </g>
</svg>`,
};
