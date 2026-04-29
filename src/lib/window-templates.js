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
]);

export function quickRepliesForLocale(locale) {
  const code = locale === 'es' ? 'es' : 'en';
  return QUICK_REPLIES.map((q) => ({ id: q.id, text: q[code] }));
}
