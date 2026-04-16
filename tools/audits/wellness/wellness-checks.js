/**
 * Wellness Studio Audit — Platform Patterns & Priority Checks
 *
 * This file defines the detection patterns and scoring checks for the
 * wellness studio website audit tool. It mirrors the architecture of
 * the restaurant audit (tools/audits/restaurant/) but with industry-
 * specific patterns for yoga studios, spas, salons, massage practices,
 * Pilates studios, and boutique fitness spaces.
 *
 * Detection categories:
 *   booking    — class/appointment scheduling platforms
 *   commerce   — retail / e-commerce for products, memberships, gift cards
 *   maps       — embedded maps and directions
 *   phone      — tap-to-call phone links
 *
 * Each platform pattern is a substring match against all URLs found
 * in the page's HTML (links, scripts, iframes, image sources). If
 * any URL contains the pattern string, the platform is detected.
 */

var PLATFORM_PATTERNS = {
  booking: {
    label: 'Online booking',
    hosts: [
      // --- Major wellness/fitness booking platforms ---
      { pattern: 'mindbody',         name: 'Mindbody' },
      { pattern: 'mindbodyonline',   name: 'Mindbody' },
      { pattern: 'healcode',         name: 'Mindbody (HealCode)' },
      { pattern: 'vagaro',           name: 'Vagaro' },
      { pattern: 'fresha',           name: 'Fresha' },
      { pattern: 'shedul',           name: 'Fresha (Shedul)' },
      { pattern: 'booksy',           name: 'Booksy' },
      { pattern: 'acuityscheduling', name: 'Acuity Scheduling' },
      { pattern: 'squareup',         name: 'Square Appointments' },
      { pattern: 'square.site',      name: 'Square Appointments' },
      { pattern: 'squarecdn',        name: 'Square Appointments' },
      { pattern: 'wellnessliving',   name: 'WellnessLiving' },
      { pattern: 'glofox',           name: 'Glofox' },
      { pattern: 'pike13',           name: 'Pike13' },
      { pattern: 'mariana-tek',      name: 'Mariana Tek' },
      { pattern: 'marianatek',       name: 'Mariana Tek' },
      { pattern: 'clubready',        name: 'ClubReady' },
      { pattern: 'zenoti',           name: 'Zenoti' },
      { pattern: 'booker.com',       name: 'Booker' },
      { pattern: 'boulevard.io',     name: 'Boulevard' },
      { pattern: 'getblvd',          name: 'Boulevard' },
      { pattern: 'mangomint',        name: 'Mangomint' },
      { pattern: 'schedulicity',     name: 'Schedulicity' },
      { pattern: 'getsling',         name: 'Sling' },
      { pattern: 'styleseat',        name: 'StyleSeat' },
      { pattern: 'salonrunner',      name: 'SalonRunner' },
      { pattern: 'rosy.com',         name: 'Rosy Salon' },
      { pattern: 'rosysalonsoftware', name: 'Rosy Salon' },
      { pattern: 'phorest',          name: 'Phorest' },
      { pattern: 'timely.com',       name: 'Timely' },
      { pattern: 'gettimely',        name: 'Timely' },
      { pattern: 'massagebook',      name: 'MassageBook' },
      { pattern: 'noterro',          name: 'Noterro' },
      { pattern: 'janeapp',          name: 'Jane App' },
      { pattern: 'cliniko',          name: 'Cliniko' },
      { pattern: 'gymdesk',          name: 'Gymdesk' },
      { pattern: 'wodify',           name: 'Wodify' },
      { pattern: 'pushpress',        name: 'PushPress' },
      { pattern: 'zen-planner',      name: 'Zen Planner' },
      { pattern: 'zenplanner',       name: 'Zen Planner' },
      { pattern: 'fitnesstexter',    name: 'Fitness Texter' },
      { pattern: 'momoyoga',         name: 'Momoyoga' },
      { pattern: 'momence',          name: 'Momence' },
      { pattern: 'teamup',           name: 'TeamUp' },
      { pattern: 'fitsw',            name: 'FitSW' },
      { pattern: 'arketa',           name: 'Arketa' },
      // --- General scheduling (also used by wellness businesses) ---
      { pattern: 'calendly',         name: 'Calendly' },
      { pattern: 'setmore',          name: 'Setmore' },
      { pattern: 'appointy',         name: 'Appointy' },
      { pattern: 'youcanbook.me',    name: 'YouCanBookMe' },
      { pattern: 'ycbm',             name: 'YouCanBookMe' },
      { pattern: 'simplebooklet',    name: 'SimplyBook.me' },
      { pattern: 'simplybook',       name: 'SimplyBook.me' },
      { pattern: 'goreserva',        name: 'Reserva' }
    ]
  },
  commerce: {
    label: 'Online shop / memberships',
    hosts: [
      // --- Wellness-specific retail + membership ---
      { pattern: 'shopify',          name: 'Shopify' },
      { pattern: 'myshopify',        name: 'Shopify' },
      { pattern: 'cdn.shopify',      name: 'Shopify' },
      { pattern: 'squarespace',      name: 'Squarespace Commerce' },
      { pattern: 'wix.com',          name: 'Wix' },
      { pattern: 'stripe.com',       name: 'Stripe' },
      { pattern: 'js.stripe',        name: 'Stripe' },
      { pattern: 'paypal',           name: 'PayPal' },
      // --- Gift card / membership platforms ---
      { pattern: 'giftup',           name: 'GiftUp!' },
      { pattern: 'squaregiftcard',   name: 'Square Gift Cards' },
      { pattern: 'yiftee',           name: 'Yiftee' },
      { pattern: 'giftfly',          name: 'Giftfly' }
    ]
  },
  maps: {
    label: 'Maps / directions',
    hosts: [
      { pattern: 'google.com/maps',  name: 'Google Maps' },
      { pattern: 'maps.google',      name: 'Google Maps' },
      { pattern: 'maps.googleapis',  name: 'Google Maps (embed)' },
      { pattern: 'maps.apple',       name: 'Apple Maps' },
      { pattern: 'mapbox',           name: 'Mapbox' },
      { pattern: 'bing.com/maps',    name: 'Bing Maps' },
      { pattern: 'openstreetmap',    name: 'OpenStreetMap' },
      { pattern: 'waze.com',         name: 'Waze' },
      { pattern: 'leaflet',          name: 'Leaflet' }
    ]
  }
};

/**
 * Text-based detection patterns — scanned against the visible text
 * and link labels in the page HTML (not URLs). Used for detecting
 * intent signals that don't have a platform URL attached.
 */
var TEXT_PATTERNS = {
  booking: [
    /book\s*(a\s*)?(class|session|appointment|treatment|service)/i,
    /schedule\s*(a\s*)?(class|session|appointment|visit)/i,
    /reserve\s*(a\s*)?(spot|space|mat|class)/i,
    /sign\s*up\s*for\s*(a\s*)?(class|session|workshop)/i,
    /book\s*(now|online|today)/i,
    /view\s*(class\s*)?schedule/i,
    /class\s*schedule/i,
    /book\s*this\s*class/i
  ],
  introOffer: [
    /first\s*(class|visit|session)\s*(free|complimentary)/i,
    /intro\s*(offer|rate|special|package)/i,
    /new\s*client\s*(special|offer|discount)/i,
    /try\s*(a\s*)?(free|complimentary)\s*(class|session)/i,
    /\$\d+\s*(for|intro|first|trial)/i,
    /free\s*trial/i,
    /new\s*student\s*(special|rate)/i,
    /welcome\s*offer/i
  ],
  giftCards: [
    /gift\s*card/i,
    /gift\s*certificate/i,
    /buy\s*a\s*gift/i,
    /give\s*the\s*gift/i
  ],
  pricing: [
    /pricing/i,
    /rates/i,
    /membership/i,
    /packages/i,
    /class\s*pass/i,
    /drop[\s-]*in\s*rate/i,
    /monthly\s*(membership|unlimited)/i
  ]
};

/**
 * Priority checks — the 9 industry-specific checks the wellness
 * audit runs, in display order. Each check has a type that maps to
 * its detection method:
 *
 *   'audit'       — Lighthouse audit by ID (from PageSpeed API)
 *   'phone'       — tel: link or phone number text detection
 *   'platform'    — URL pattern detection from PLATFORM_PATTERNS
 *   'conversions' — booking platform or booking-text detection
 *   'schema'      — JSON-LD schema type detection
 *   'services'    — service menu / class schedule page detection
 *   'intro-offer' — first-visit / trial offer text detection
 *
 * Weight determines how much the check affects the overall score.
 * Effort tells the owner who can fix it (self / dev / rebuild).
 */
var PRIORITY_CHECKS = [
  {
    type: 'audit',
    audit: 'viewport',
    weight: 2.0,
    anchor: '#mobile',
    effort: 'dev',
    minutes: 5,
    impact: 'Without a viewport tag, every phone visitor sees a broken desktop layout. Most wellness booking happens on phones — someone Googling "yoga near me" on a lunch break is on mobile.',
    pass: 'Your site fits on a phone screen',
    passNote: 'Your pages render at phone width automatically — essential since most wellness clients search on mobile.',
    fail: 'Your site is not set up for phones',
    failNote: 'Without a viewport meta tag, mobile browsers render your site at desktop width. Everything looks tiny. This is a one-line fix: <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code>.',
    unverified: "We couldn't check if your site fits on a phone",
    unverifiedNote: "Lighthouse couldn't evaluate the viewport tag on this run. Re-audit in a few seconds."
  },
  {
    type: 'audit',
    audit: 'tap-targets',
    weight: 1.0,
    anchor: '#mobile',
    effort: 'dev',
    minutes: 20,
    impact: 'Every missed tap is a frustrated client. The "Book a Class" button is the most-tapped element on a wellness site — if it\'s too small, you\'re losing bookings.',
    pass: 'Your buttons are big enough to tap',
    passNote: 'Your action buttons are big enough to hit on the first try with a thumb.',
    fail: 'Some of your buttons are too small to tap reliably',
    failNote: 'Buttons under 44×44 pixels cause misses. Bump padding to at least 12px on every side, especially on your "Book" and "Schedule" buttons.',
    unverified: "We couldn't check your buttons",
    unverifiedNote: "Lighthouse couldn't evaluate tap targets. Re-audit in a few seconds."
  },
  {
    type: 'audit',
    audit: 'color-contrast',
    weight: 1.0,
    anchor: '#trust',
    effort: 'dev',
    minutes: 15,
    impact: 'Wellness clients skew older than the general population. If your service descriptions fail contrast, you\'re losing the exact demographic most likely to book.',
    pass: 'Your text is readable for everyone',
    passNote: 'Your text meets WCAG AA contrast ratios — readable for everyone, including clients with reading glasses.',
    fail: 'Some of your text is hard to read',
    failNote: 'Light text on light backgrounds is a common wellness-site aesthetic choice that costs readability. Darken your body text — aim for WCAG AA (4.5:1 ratio for normal text).',
    unverified: "We couldn't check your text contrast",
    unverifiedNote: "Lighthouse couldn't evaluate color contrast. Re-audit in a few seconds."
  },
  {
    type: 'audit',
    audit: 'font-size',
    weight: 1.0,
    anchor: '#mobile',
    effort: 'dev',
    minutes: 10,
    impact: 'Service descriptions, class times, and pricing all need to be readable at arm\'s length on a phone. Text below 16px forces iOS to zoom on focus.',
    pass: 'Your text is legible without pinch-zooming',
    passNote: 'Body text is above the mobile readability threshold — clients can read service descriptions without zooming.',
    fail: 'Your text is too small on a phone',
    failNote: 'More than 40% of your text is below the legibility threshold. Set body font-size to at least 16px.',
    unverified: "We couldn't check your text size",
    unverifiedNote: "Lighthouse couldn't evaluate font sizes. Re-audit in a few seconds."
  },
  {
    type: 'phone',
    weight: 1.5,
    anchor: '#basics',
    effort: 'self',
    minutes: 2,
    impact: 'Phone calls are how most first-time wellness clients ask the questions that close the booking: "Do I need to bring a mat?" "Is the steam room open?" "Can I come if I\'m pregnant?" A tappable phone number removes the last barrier.',
    pass: 'Visitors can tap your phone number to call',
    passNote: 'A tappable phone number is on your page — clients can call with one tap for those pre-booking questions.',
    passNoteText: 'We found a phone number but it\'s not wrapped in a <code>tel:</code> link. Mobile visitors have to copy it manually. Ask your developer to wrap it in <code>&lt;a href="tel:+1..."&gt;</code>.',
    fail: "We couldn't find a phone number on your site",
    failNote: 'No click-to-call link and no visible phone number. Wellness clients call with questions before their first visit — give them a number.',
    unverified: "We couldn't confirm whether you have a phone number",
    unverifiedNote: "We might have missed it. Check that your number is visible and wrapped in a <code>tel:</code> link."
  },
  {
    type: 'platform',
    platforms: ['maps'],
    weight: 1.0,
    anchor: '#conversions',
    effort: 'dev',
    minutes: 15,
    impact: 'First-time wellness clients are often nervous about finding the space — especially yoga studios and massage practices in non-obvious locations. An embedded map removes that friction entirely.',
    pass: 'Visitors can get directions with one tap',
    passNote: '{detected} is on your site — first-time clients can find you without guessing.',
    fail: null,
    failNote: null,
    unverified: "We didn't see a map on your site",
    unverifiedNote: "We scan for Google Maps, Apple Maps, Mapbox, and others. If your address is plain text only, consider wrapping it in a Google Maps link."
  },
  {
    type: 'conversions',
    platforms: ['booking'],
    weight: 2.0,
    anchor: '#conversions',
    effort: 'dev',
    minutes: 60,
    impact: 'Online booking is the single biggest conversion lever for a wellness business. A client who has to call or email to book is a client who might not bother — especially for drop-in classes.',
    pass: 'Clients can book online',
    passNote: '{detected} on your site — clients can book a class or appointment directly without calling.',
    passNoteText: "We found text that suggests online booking (like 'Book a Class' or 'Schedule Now') but couldn't match it to a specific platform.",
    fail: null,
    failNote: null,
    unverified: "We couldn't detect online booking",
    unverifiedNote: "We scan for 50+ booking platforms including Mindbody, Vagaro, Fresha, Booksy, Acuity, Square Appointments, WellnessLiving, Glofox, Pike13, and more. If yours is on the list and we missed it, tell us below."
  },
  {
    type: 'services',
    weight: 1.0,
    anchor: '#basics',
    effort: 'rebuild',
    minutes: 180,
    impact: 'A new client needs to understand what you offer before they book. A clear service menu or class schedule — in real HTML, not a PDF — is the second most visited page on every wellness site after the homepage.',
    pass: 'Your services or class schedule opens as a real page',
    passNote: 'Your service menu or class schedule is accessible as an HTML page — readable on any device without downloading a file.',
    fail: 'Your services page is a PDF or image',
    failNote: 'PDF service menus don\'t scale on phones and can\'t be crawled effectively by Google. Replace it with a real HTML page.',
    unverified: "We couldn't find a services or class schedule page",
    unverifiedNote: "We looked for links containing 'services', 'classes', 'schedule', 'treatments', 'menu', or 'offerings'. If yours is named differently, we missed it."
  },
  {
    type: 'schema',
    weight: 0.5,
    anchor: '#findability',
    effort: 'dev',
    minutes: 20,
    impact: 'Schema markup tells Google exactly what kind of business you are. Wellness businesses with proper schema show up in local search rich results with hours, ratings, and service types — without it, you get a plain blue link.',
    pass: 'Google knows your site is a wellness business',
    passNote: 'Your site publishes structured data that tells Google what kind of business you are — this helps you show up in local search with rich details.',
    fail: null,
    failNote: null,
    unverified: "Google doesn't know what kind of business this is",
    unverifiedNote: "Your site is missing business schema markup. Ask your developer to add JSON-LD with a type like HealthAndBeautyBusiness, SportsActivityLocation, DaySpa, or YogaStudio — it's a 10-line change with real SEO impact."
  }
];

// Schema types we recognize as wellness-related
var WELLNESS_SCHEMA_TYPES = [
  'HealthAndBeautyBusiness',
  'BeautySalon',
  'DaySpa',
  'HairSalon',
  'NailSalon',
  'TattooParlor',
  'SportsActivityLocation',
  'ExerciseGym',
  'HealthClub',
  'YogaStudio',       // custom (not in schema.org but commonly used)
  'PilatesStudio',    // custom
  'FitnessCenter',    // custom
  'MassageTherapy',   // custom
  'LocalBusiness',
  'Place'
];
