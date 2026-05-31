// Phase W.1 (The Window) — quick-reply templates Don taps from his
// phone in the admin composer. Each ≤2 sentences, in his voice, no
// sign-off (Don signs once or not at all). Editable here without
// redeploy logic — just commit a new version.
//
// Locale-aware. Used by /admin/window/index.html (EN) and
// /es/admin/window/index.html (ES).

export const QUICK_REPLIES = Object.freeze([
  {
    id: 'need-the-url',
    en: "I'd want to see the site first — drop a URL when you have a sec, and I'll look before I answer.",
    es: 'Primero quiero ver el sitio — pásame el enlace cuando puedas y lo reviso antes de responder.',
  },
  {
    id: 'yes-and-scope',
    en: "Yes, that's something I can help with. Want me to scope it properly? I can send a short note back with what it'd take.",
    es: 'Sí, eso lo puedo hacer. ¿Quieres que lo dimensione bien? Te mando una nota corta con lo que implicaría.',
  },
  {
    id: 'quick-yes-with-tool',
    en: 'Quick yes — that\'s a {tool} thing. Here\'s the tool, takes about a minute: {link}',
    es: 'Sí, rápido — eso es cosa de {tool}. Aquí está, te toma como un minuto: {link}',
  },
  {
    id: 'soft-no',
    en: "I don't think we're the right fit for this one — but here's the thing I'd actually do in your spot: {thought}.",
    es: 'No creo que seamos lo indicado para esto — pero esto es lo que yo haría en tu lugar: {pensamiento}.',
  },
  {
    id: 'saving-it',
    en: "Need a few days on this — saving it to my desk and I'll come back with a real answer, not a rushed one.",
    es: 'Necesito unos días con esto — lo guardo en el escritorio y vuelvo con una respuesta de verdad, no apurada.',
  },
  // ── Phase 8.3a — topic-grouped additions. Same rules: ≤2 sentences,
  //    Don's voice, no sign-off, placeholders for the variable bits. ──
  {
    id: 'audit-first',
    en: "Before I weigh in, run it through my free storefront check — about a minute, and it shows the big gaps: {link}. Send me what it flags.",
    es: 'Antes de opinar, pásalo por mi chequeo gratuito de escaparate — como un minuto, y muestra los huecos grandes: {link}. Mándame lo que marque.',
  },
  {
    id: 'care-plan',
    en: "This is the kind of thing a Care Plan covers — I keep an eye on it monthly so you don't have to. Want me to walk you through what's included?",
    es: 'Esto es justo lo que cubre un Care Plan — lo reviso cada mes para que tú no tengas que hacerlo. ¿Quieres que te explique qué incluye?',
  },
  {
    id: 'firm-no',
    en: "Straight answer: this is outside what I do well, and you'd be better served by someone who specializes in {area}. Not going to pretend otherwise.",
    es: 'Respuesta directa: esto está fuera de lo que hago bien, y te serviría mejor alguien especializado en {area}. No te voy a decir lo contrario.',
  },
  {
    id: 'scope-price',
    en: "Happy to put a real number on it. Tell me the one outcome you care about most and I'll send back a scoped price — not a vague range.",
    es: 'Con gusto le pongo un número real. Dime el resultado que más te importa y te mando un precio dimensionado — no un rango vago.',
  },
  {
    id: 'booked',
    en: "I'm booked solid right now — if it can wait a bit, I'll do it right; if it can't, email me and I'll point you to someone good.",
    es: 'Ahora mismo estoy lleno — si puede esperar un poco, lo hago bien; si no, escríbeme y te recomiendo a alguien bueno.',
  },
]);

export function quickRepliesForLocale(locale) {
  const code = locale === 'es' ? 'es' : 'en';
  return QUICK_REPLIES.map((q) => ({ id: q.id, text: q[code] }));
}
