// Glossary explainer — SERVICE CHARGE
//
// What a service charge actually is: a fixed percentage the restaurant adds
// to every check — typically in the 18–20% range — that belongs to the HOUSE,
// not automatically to the server. Clears the central misconception (a service
// charge is NOT a tip), explains why operators use it (predictable, shareable
// pay that closes the back-of-house gap tipping cannot), names the catch
// (taxed differently, must be disclosed, reads as a hidden fee if sprung), and
// the move (say it everywhere). The 18–20% band is framed as typical; no other
// figures are invented.

export default {
  term_slug: 'service-charge',
  term_head: 'Service charge, in 90 seconds.',
  subhead:   'A flat fee on the check — and why it is not a tip.',
  duration_ms: 74000,
  audio_url: null,
  scenes_es: [
    { id: 'define', caption: 'Un cargo por servicio es un porcentaje fijo que el restaurante suma a cada cuenta — digamos 18 o 20 por ciento. Esa plata es de la casa, no del mesero automáticamente. Una propina es decisión del cliente y es dinero del mesero. Un cargo por servicio es ingreso del restaurante, que luego él decide cómo repartir.' },
    { id: 'why',    caption: 'Los restaurantes lo usan para volver el pago predecible. En vez de que el salón viva de propinas que suben y bajan mientras la cocina gana un sueldo fijo, la casa junta un porcentaje conocido y le paga a todos — meseros y cocineros — un sueldo estable y repartible. Así es como un operador cierra la brecha de pago de la cocina que la propina no alcanza a cubrir.' },
    { id: 'catch',  caption: 'Pero como es plata del restaurante, tributa distinto, tiene que estar declarado con claridad en el menú y en la cuenta, y puede leerse como un cargo escondido si lo sueltas de golpe. El cliente perdona un cargo por servicio del que le avisaron; resiente el que descubre al pie de la cuenta.' },
    { id: 'move',   caption: 'Así que si cambias, dilo en todas partes — menú, sitio web, la cuenta, las propias palabras del mesero — y dile al cliente qué financia: un sueldo justo para la cocina, sin propina esperada. La transparencia es todo el juego.' },
    { id: 'land',   caption: 'Una propina premia al mesero. Un cargo por servicio financia la casa. Ninguno está mal — pero solo uno tiene que explicarse antes de que llegue la cuenta.' },
  ],
  scenes: [
    { id: 'define', ms: 15000, caption: 'A service charge is a fixed percentage the restaurant adds to every check — say eighteen or twenty percent. That money belongs to the house, not automatically to the server. A tip is the guest’s choice and the server’s money. A service charge is the restaurant’s revenue, which it then decides how to share.' },
    { id: 'why',    ms: 16000, caption: 'Restaurants use it to make pay predictable. Instead of the front-of-house living on swingy tips while the kitchen earns a flat wage, the house pools a known percentage and pays everyone — servers and cooks — a steady, shareable wage. It is how an operator closes the back-of-house pay gap that tipping cannot.' },
    { id: 'catch',  ms: 16000, caption: 'But because it is the restaurant’s money, it is taxed differently, it has to be disclosed clearly on the menu and the check, and it can read as a hidden fee if you spring it. Guests forgive a service charge they were told about; they resent one they discover at the bottom of the bill.' },
    { id: 'move',   ms: 13000, caption: 'So if you switch, say it everywhere — menu, website, the check, the server’s own words — and tell guests what it funds: a fair kitchen wage, no tip expected. The transparency is the whole game.' },
    { id: 'land',   ms: 14000, caption: 'A tip rewards the server. A service charge funds the house. Neither is wrong — but only one of them has to be explained before the check lands.' },
  ],
  svg: `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram of a restaurant service charge: a flat house fee on the check, and why it is not a tip">
  <defs>
    <linearGradient id="sc-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--cream-2,#F3EEE3)"/>
      <stop offset="100%" stop-color="var(--cream,#FAF7F2)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#sc-bg)"/>

  <!-- ============ DEFINE ============ -->
  <g class="explainer-scene" data-scene-id="define">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">House money, not a tip</text>
    <!-- the check, with the service line -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="70" y="100" width="300" height="300" rx="10" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <text class="text-stone" x="94" y="140" font-size="11" letter-spacing="0.12em">GUEST CHECK</text>
      <line x1="94" y1="158" x2="346" y2="158" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="94" y="196" font-size="14">Food &amp; drink</text>
      <text class="text-soft" x="346" y="196" text-anchor="end" font-size="14">subtotal</text>
      <line x1="94" y1="218" x2="346" y2="218" stroke="var(--line,#E8E2D6)"/>
      <rect x="86" y="238" width="268" height="56" rx="6" fill="var(--teal-tint,#E8F1F3)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="100" y="262" font-size="13">Service charge</text>
      <text class="text-teal" x="346" y="276" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="26">18–20%</text>
      <text class="text-stone" x="100" y="334" font-size="12" font-style="italic">added to every check</text>
    </g>
    <!-- two destinations -->
    <g data-anim="fade" style="--delay:900ms">
      <text class="text-stone" x="470" y="172" font-size="26">→</text>
      <rect x="520" y="142" width="220" height="64" rx="10" fill="var(--teal,#1F4E5B)"/>
      <text x="630" y="170" text-anchor="middle" font-size="13" letter-spacing="0.06em" fill="var(--cream,#FAF7F2)">SERVICE CHARGE</text>
      <text x="630" y="192" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="18" fill="var(--cream,#FAF7F2)">the house</text>
    </g>
    <g data-anim="fade" style="--delay:1300ms">
      <text class="text-stone" x="470" y="330" font-size="26">→</text>
      <rect x="520" y="300" width="220" height="64" rx="10" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <text class="text-rust" x="630" y="328" text-anchor="middle" font-size="13" letter-spacing="0.06em">TIP</text>
      <text class="text-rust" x="630" y="350" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="18">the server</text>
    </g>
    <text class="text-stone" x="630" y="252" text-anchor="middle" font-size="13" font-style="italic" data-anim="fade" style="--delay:1700ms">Different money. Different owner.</text>
  </g>

  <!-- ============ WHY ============ -->
  <g class="explainer-scene" data-scene-id="why">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Why operators use it</text>
    <!-- the pool -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="300" y="96" width="200" height="84" rx="12" fill="var(--teal,#1F4E5B)"/>
      <text x="400" y="130" text-anchor="middle" font-size="13" letter-spacing="0.06em" fill="var(--cream,#FAF7F2)">SERVICE-CHARGE POOL</text>
      <text x="400" y="158" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" fill="var(--cream,#FAF7F2)">18–20%</text>
    </g>
    <!-- split lines to both seats -->
    <g data-anim="fade" style="--delay:760ms">
      <path d="M360 180 L240 270" stroke="var(--teal,#1F4E5B)" stroke-width="2" fill="none"/>
      <path d="M440 180 L560 270" stroke="var(--teal,#1F4E5B)" stroke-width="2" fill="none"/>
    </g>
    <!-- server seat -->
    <g data-anim="rise" style="--delay:1000ms">
      <rect x="130" y="270" width="220" height="118" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <circle cx="240" cy="312" r="16" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M218 350 q22 -26 44 0" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <text class="text-soft" x="240" y="376" text-anchor="middle" font-size="14">server · steady wage</text>
    </g>
    <!-- cook seat -->
    <g data-anim="rise" style="--delay:1200ms">
      <rect x="450" y="270" width="220" height="118" rx="12" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <path d="M544 296 a16 16 0 0 1 32 0 l0 8 -32 0 z" fill="none" stroke="var(--rust,#B8541A)" stroke-width="2"/>
      <line x1="544" y1="320" x2="576" y2="320" stroke="var(--rust,#B8541A)" stroke-width="2"/>
      <text class="text-soft" x="560" y="376" text-anchor="middle" font-size="14">cook · steady wage</text>
    </g>
    <text class="text-stone" x="400" y="440" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1700ms">Closes the kitchen pay gap tipping cannot.</text>
  </g>

  <!-- ============ CATCH ============ -->
  <g class="explainer-scene" data-scene-id="catch">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Told vs sprung</text>
    <!-- disclosed: forgiven (teal) -->
    <g data-anim="rise" style="--delay:140ms">
      <rect x="70" y="110" width="300" height="270" rx="12" fill="var(--white,#fff)" stroke="var(--teal,#1F4E5B)" stroke-width="1.5"/>
      <text class="text-teal" x="94" y="148" font-size="11" letter-spacing="0.1em">DISCLOSED ON THE MENU</text>
      <rect x="94" y="170" width="252" height="64" rx="8" fill="var(--teal-tint,#E8F1F3)"/>
      <text class="text-teal" x="108" y="198" font-size="13">A 20% service charge</text>
      <text class="text-teal" x="108" y="220" font-size="13">funds a fair kitchen wage.</text>
      <text class="text-stone" x="94" y="276" font-size="13">Guest reads it before ordering.</text>
      <text class="text-teal" x="220" y="336" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30" font-style="italic">forgiven</text>
    </g>
    <!-- surprise: resented (rust) -->
    <g data-anim="rise" style="--delay:900ms">
      <rect x="430" y="110" width="300" height="270" rx="12" fill="var(--white,#fff)" stroke="var(--rust,#B8541A)" stroke-width="1.5"/>
      <text class="text-rust" x="454" y="148" font-size="11" letter-spacing="0.1em">SPRUNG AT THE BOTTOM</text>
      <line x1="454" y1="186" x2="706" y2="186" stroke="var(--line,#E8E2D6)"/>
      <text class="text-soft" x="454" y="212" font-size="13">subtotal</text>
      <text class="text-soft" x="706" y="212" text-anchor="end" font-size="13">…</text>
      <line x1="454" y1="230" x2="706" y2="230" stroke="var(--line,#E8E2D6)"/>
      <text class="text-rust" x="454" y="262" font-size="13">+ service charge</text>
      <text class="text-rust" x="706" y="262" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="18">surprise</text>
      <text class="text-stone" x="454" y="296" font-size="13" font-style="italic">Guest finds it after the meal.</text>
      <text class="text-rust" x="580" y="350" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30" font-style="italic">resented</text>
    </g>
    <text class="text-stone" x="400" y="430" text-anchor="middle" font-size="13" data-anim="fade" style="--delay:1500ms">Same fee. Taxed differently, and it must be disclosed.</text>
  </g>

  <!-- ============ MOVE ============ -->
  <g class="explainer-scene" data-scene-id="move">
    <text class="scene-label text-stone" x="40" y="46" data-anim="fade">Disclose everywhere</text>
    <g data-anim="rise" style="--delay:140ms">
      <rect x="150" y="96" width="500" height="56" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <circle cx="184" cy="124" r="10" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M179 124 l4 4 7 -8" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <text class="text-soft" x="212" y="130" font-size="15">On the menu</text>
    </g>
    <g data-anim="rise" style="--delay:380ms">
      <rect x="150" y="166" width="500" height="56" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <circle cx="184" cy="194" r="10" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M179 194 l4 4 7 -8" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <text class="text-soft" x="212" y="200" font-size="15">On the website</text>
    </g>
    <g data-anim="rise" style="--delay:620ms">
      <rect x="150" y="236" width="500" height="56" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <circle cx="184" cy="264" r="10" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M179 264 l4 4 7 -8" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <text class="text-soft" x="212" y="270" font-size="15">On the check</text>
    </g>
    <g data-anim="rise" style="--delay:860ms">
      <rect x="150" y="306" width="500" height="56" rx="8" fill="var(--white,#fff)" stroke="var(--line-dark,#D4CCBC)"/>
      <circle cx="184" cy="334" r="10" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <path d="M179 334 l4 4 7 -8" fill="none" stroke="var(--teal,#1F4E5B)" stroke-width="2"/>
      <text class="text-soft" x="212" y="340" font-size="15">In the server’s own words</text>
    </g>
    <text class="text-rust" x="400" y="424" text-anchor="middle" font-size="14" font-style="italic" data-anim="fade" style="--delay:1200ms">A fair kitchen wage. No tip expected.</text>
  </g>

  <!-- ============ LAND ============ -->
  <g class="explainer-scene" data-scene-id="land">
    <rect x="0" y="0" width="800" height="500" fill="var(--cream,#FAF7F2)" data-anim="fade"/>
    <text data-anim="rise" style="--delay:200ms" class="scene-label text-teal" x="400" y="150" text-anchor="middle">Tip vs service charge</text>
    <g data-anim="rise" style="--delay:420ms">
      <text x="400" y="232" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34" fill="var(--ink,#14161A)">A tip rewards the server.</text>
      <text x="400" y="282" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34" fill="var(--ink,#14161A)">A service charge funds the house.</text>
    </g>
    <text data-anim="fade" style="--delay:900ms" class="text-stone" x="400" y="344" text-anchor="middle" font-size="15" font-style="italic">Only one has to be explained before the check lands.</text>
    <line data-anim="grow-x" style="--delay:1200ms; transform-origin:center" x1="340" y1="374" x2="460" y2="374" stroke="var(--rust,#B8541A)" stroke-width="2"/>
  </g>
</svg>`,
};
