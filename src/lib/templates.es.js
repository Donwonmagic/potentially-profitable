// ============================================================
// Spanish email templates
// ============================================================
//
// Locale pair to templates.js. Every function exported here is a
// named peer of one in templates.js — when the dispatcher in
// templates.js sees body.locale === 'es' and a function exists
// here, it routes to this file.
//
// Voice: same register as the rest of the Spanish surface of the
// site. First-person singular, direct, tú-form, DMV-Hispanic
// register (neutral Latin American, no voseo, no vosotros). The
// notification-to-Don emails stay terse and data-dense —
// translating every label noun to Spanish so his inbox reads in
// the same language as the site the visitor came from, but the
// information density doesn't change.
//
// NOT every English template has a Spanish peer yet. The
// dispatcher falls through to English for any function missing
// here — acceptable during rollout because the only user-facing
// Spanish form today is the intake on /es/index.html. Checklist
// and audit-report templates will be added in follow-up sprints
// once their respective Spanish pages land.

import { escapeHtml, prettyUrl } from './validation.js';


// Shell matches the English one visually — same colors, same
// border treatment — with Spanish footer text so recipients don't
// see "Silver Spring, MD" paired with an English line break after
// reading a Spanish body.
function htmlShell(title, bodyHtml) {
  return [
    '<!doctype html>',
    '<html lang="es"><body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;color:#14161A;">',
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF7F2;padding:32px 16px;">',
    '<tr><td align="center">',
    '<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #E8E2D6;border-radius:12px;overflow:hidden;">',
    '<tr><td style="padding:32px 36px;">',
    '<p style="margin:0 0 20px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6B6B;">Muntin Digital</p>',
    '<h1 style="margin:0 0 20px;font-size:22px;font-weight:500;color:#14161A;font-family:Georgia,\'Times New Roman\',serif;letter-spacing:-0.01em;">' + escapeHtml(title) + '</h1>',
    bodyHtml,
    '</td></tr>',
    '<tr><td style="padding:20px 36px;background:#F3EEE3;border-top:1px solid #E8E2D6;font-size:12px;color:#6B6B6B;">',
    'Muntin Digital · Silver Spring, MD · <a href="https://muntin.digital/es/" style="color:#1F4E5B;text-decoration:none;">muntin.digital</a>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>',
  ].join('\n');
}

// A key/value row. Same visual as the English template's field().
function field(label, value) {
  return [
    '<div style="margin-bottom:18px;">',
    '<p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6B6B6B;">' + escapeHtml(label) + '</p>',
    '<div style="font-size:15px;line-height:1.5;color:#14161A;">' + value + '</div>',
    '</div>',
  ].join('');
}


// ============================================================
// 1. INTAKE — notification to Don
// ============================================================

export function intakeNotification(body) {
  const name     = String(body.name || '—').trim();
  const email    = String(body.email || '—').trim();
  const business = String(body.business || '').trim();
  const website  = String(body.website || '').trim();
  const services = String(body.services || '—').trim();
  const goals    = String(body.goals || '—').trim();
  const budget   = String(body.budget || '').trim();
  const referral = String(body.referral || '').trim();

  // Prefix tells Don at a glance that the inquiry came through the
  // Spanish surface of the site, so his reply starts in Spanish.
  const subject = '[ES] Consulta nueva — ' + name + (business ? ' @ ' + business : '');

  const html = htmlShell(
    'Consulta nueva (desde el sitio en español)',
    [
      field('De',           escapeHtml(name) + ' &lt;' + escapeHtml(email) + '&gt;'),
      business ? field('Negocio',     escapeHtml(business)) : '',
      website  ? field('Sitio actual','<a href="' + escapeHtml(website) + '" style="color:#1F4E5B;">' + escapeHtml(prettyUrl(website)) + '</a>') : '',
      field('Le interesa',  escapeHtml(services)),
      budget   ? field('Presupuesto', escapeHtml(budget)) : '',
      field('Metas',        '<div style="white-space:pre-wrap;">' + escapeHtml(goals) + '</div>'),
      referral ? field('Nos conoció por', escapeHtml(referral)) : '',
      '<p style="margin:24px 0 0;padding:12px 16px;background:#E8F1F3;border-left:3px solid #1F4E5B;font-size:13px;color:#2A2D33;">Responde directamente a este correo para contestarle a ' + escapeHtml(name.split(' ')[0] || name) + ' — el header Reply-To ya está configurado. El contacto vino del sitio en español, así que conviene responder en español.</p>',
    ].join('\n')
  );

  const txt = [
    'Consulta nueva (desde el sitio en español)',
    '',
    'De: ' + name + ' <' + email + '>',
    business ? 'Negocio: ' + business : '',
    website  ? 'Sitio actual: ' + website : '',
    'Le interesa: ' + services,
    budget   ? 'Presupuesto: ' + budget : '',
    '',
    'Metas:',
    goals,
    '',
    referral ? 'Nos conoció por: ' + referral : '',
    '',
    '--',
    'El contacto vino del sitio en español; conviene responder en español.',
    'Responde a este correo directamente.',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 2. INTAKE — auto-responder to the user
// ============================================================

export function intakeAutoResponder(body) {
  const firstName = String(body.name || '').trim().split(/\s+/)[0] || 'hola';
  const subject = 'Recibí tu mensaje — te contesto en 24 horas';

  const html = htmlShell(
    'Gracias por escribir',
    [
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Hola ' + escapeHtml(firstName) + ',</p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Soy Don. Tu mensaje me llegó — leo todos personalmente, y te contesto dentro de 24 horas (casi siempre mucho antes) con ideas concretas sobre lo que me describiste.</p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Antes de escribir, voy a darle una mirada a tu sitio actual, a tu menú y a tu Google Business Profile si lo tienes, para que la respuesta arranque con especificidades reales de tu situación, no con una plantilla genérica.</p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Si te surge algo mientras tanto, puedes responder a este correo y cae directo en mi bandeja real.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">— Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital · Silver Spring, MD</span></p>',
    ].join('\n')
  );

  const txt = [
    'Hola ' + firstName + ',',
    '',
    'Soy Don. Tu mensaje me llegó — leo todos personalmente, y te contesto dentro de 24 horas (casi siempre mucho antes) con ideas concretas sobre lo que me describiste.',
    '',
    'Antes de escribir, voy a darle una mirada a tu sitio actual, a tu menú y a tu Google Business Profile si lo tienes, para que la respuesta arranque con especificidades reales de tu situación, no con una plantilla genérica.',
    '',
    'Si te surge algo mientras tanto, puedes responder a este correo y cae directo en mi bandeja real.',
    '',
    '— Don',
    'Muntin Digital · Silver Spring, MD',
  ].join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 3. CHECKLIST PDF REQUEST — Spanish auto-responder + notification
// ============================================================
//
// Fires when someone submits the /api/checklist form on
// /es/resources/restaurant-website-checklist/. The form carries
// <input name="locale" value="es"> so templates.js dispatches
// here.
//
// Subtype voice map is Spanish-independent — the Spanish
// operator-facing labels ('Alta cocina', 'Bar / cocteles') match
// the 'Tailor to' pills on the /es/ checklist page and the
// Restaurant Subtypes section of /es/glossary/, so the whole
// Spanish surface of the site speaks one vocabulary. Item count
// tracks whatever the /es/ page actually has on disk at time
// of the last sprint — the English page is currently 30 items
// after a main-branch redesign, but the Spanish page is still
// the authored 24 and the catch-up sprint (11r) will bring
// them in sync.

const RESTAURANT_SUBTYPES_ES = {
  'all':          { subjectNoun: 'restaurante',    tailoredTo: '',                                    label: 'Restaurante' },
  'fine-dining':  { subjectNoun: 'restaurante',    tailoredTo: 'salones de alta cocina',              label: 'Alta cocina' },
  'casual':       { subjectNoun: 'restaurante',    tailoredTo: 'lugares casuales / de barrio',        label: 'Casual / de barrio' },
  'fast-casual':  { subjectNoun: 'fast-casual',    tailoredTo: 'restaurantes fast-casual',            label: 'Fast-casual' },
  'bar':          { subjectNoun: 'bar',            tailoredTo: 'bares y coctelerías',                 label: 'Bar / cocteles' },
  'cafe':         { subjectNoun: 'café',           tailoredTo: 'cafés y panaderías',                  label: 'Café / panadería' },
  'truck':        { subjectNoun: 'food truck',     tailoredTo: 'food trucks y pop-ups',               label: 'Food truck / pop-up' },
};

function checklistKindEs(body) {
  const businessField = String(body.restaurant || body.business || '').trim();
  const rawSubtype = String(body.subtype || 'all').trim();
  const subtype    = RESTAURANT_SUBTYPES_ES[rawSubtype] ? rawSubtype : 'all';
  const voice      = RESTAURANT_SUBTYPES_ES[subtype];

  // Subject noun gets "el/la" agreement — 'café' uses 'el', 'food
  // truck' and most subtype nouns are masculine, so default to 'el'
  // and override where needed. Keeps the subject line grammatical
  // when personalized with the business name.
  const titleLead = 'Tu checklist para sitios de ' + voice.subjectNoun;

  return {
    kind:          'restaurant',
    subtype,
    subtypeLabel:  voice.label,
    tailoredTo:    voice.tailoredTo,
    titleLead,
    subjectNoun:   voice.subjectNoun,
    businessLabel: 'Restaurante',
    businessField,
    items:         30,
    pageUrl:       'https://muntin.digital/es/resources/restaurant-website-checklist/',
    pdfUrl:        'https://muntin.digital/resources/restaurant-website-checklist/muntin-restaurant-website-checklist.pdf',
    auditUrl:      'https://muntin.digital/es/tools/audits/restaurant/',
  };
}

export function checklistNotification(body) {
  const email = String(body.email || '—').trim();
  const k     = checklistKindEs(body);

  // Don's inbox sees '[ES]' prefix as a glance-level signal that
  // the lead came from the Spanish surface of the site and his
  // reply should start in Spanish.
  const subtypeTag = k.subtype === 'all' ? 'restaurante' : k.subtypeLabel.toLowerCase();
  const subject = '[ES] Checklist PDF solicitado (' + subtypeTag + ')' + (k.businessField ? ' — ' + k.businessField : '');

  const html = htmlShell(
    'Checklist de sitio de restaurante — solicitud de PDF',
    [
      field('De',       escapeHtml(email)),
      k.subtype !== 'all' ? field('Subtipo', escapeHtml(k.subtypeLabel)) : '',
      k.businessField ? field(k.businessLabel, escapeHtml(k.businessField)) : '',
      '<p style="margin:24px 0 0;font-size:13px;color:#6B6B6B;">La autorespuesta con el enlace del PDF ya se envió al usuario. No hace falta seguimiento manual, a menos que quieras nutrir el lead. El contacto vino del sitio en español, así que conviene responder en español.</p>',
    ].join('\n')
  );

  const txt = [
    'Checklist de sitio de restaurante — solicitud de PDF',
    '',
    'De: ' + email,
    k.subtype !== 'all' ? 'Subtipo: ' + k.subtypeLabel : '',
    k.businessField ? k.businessLabel + ': ' + k.businessField : '',
    '',
    '--',
    'La autorespuesta con el enlace del PDF ya se envió al usuario.',
    'El contacto vino del sitio en español; conviene responder en español.',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}

export function checklistAutoResponder(body) {
  const k = checklistKindEs(body);
  const biz = k.businessField;

  const subject = biz
    ? k.titleLead + ' — ' + biz
    : k.titleLead;

  // Opener: addresses the business by name + calls out that the
  // PDF is tailored to the subtype when one was picked. When the
  // subtype stayed 'all', the copy stays neutral.
  const tailoredLine = k.tailoredTo
    ? ' hecho a la medida de <strong>' + escapeHtml(k.tailoredTo) + '</strong>'
    : '';
  const tailoredLineTxt = k.tailoredTo
    ? ' hecho a la medida de ' + k.tailoredTo
    : '';

  const opening = biz
    ? 'Aquí está el PDF para <strong>' + escapeHtml(biz) + '</strong>' + tailoredLine + '. Imprímelo, clávalo en el tablero de la oficina trasera, o pásalo por el equipo en la próxima reunión de staff — está pensado para marcarse con lápiz.'
    : 'Aquí está tu PDF' + tailoredLine + '. Imprímelo, clávalo en el tablero de la oficina trasera, o pásalo por el equipo en la próxima reunión de staff — está pensado para marcarse con lápiz.';

  const openingTxt = biz
    ? 'Aquí está el PDF para ' + biz + tailoredLineTxt + '. Imprímelo, clávalo en el tablero de la oficina trasera, o pásalo por el equipo en la próxima reunión de staff — está pensado para marcarse con lápiz.'
    : 'Aquí está tu PDF' + tailoredLineTxt + '. Imprímelo, clávalo en el tablero de la oficina trasera, o pásalo por el equipo en la próxima reunión de staff — está pensado para marcarse con lápiz.';

  const kindsLine = 'restaurante (alta cocina, casual, bar, café, food truck)';

  const html = htmlShell(
    k.titleLead + (biz ? ' — ' + biz : ''),
    [
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#2A2D33;">' + opening + '</p>',

      '<p style="margin:0 0 10px;">' +
        '<a href="' + k.pdfUrl + '" style="display:inline-block;padding:14px 26px;background:#1F4E5B;color:#FAF7F2;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px;">Descargar el PDF &rarr;</a>' +
      '</p>',
      '<p style="margin:0 0 22px;font-size:13px;color:#6B6B6B;">Tamaño carta · ' + k.items + ' chequeos · abre en tu navegador.</p>',

      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Si prefieres marcar los ítems en pantalla, la versión interactiva guarda tu avance en este dispositivo y deja que ajustes el checklist a tu tipo de ' + kindsLine + ' para que los ítems N/A salgan del puntaje:</p>',
      '<p style="margin:0 0 24px;"><a href="' + k.pageUrl + '" style="color:#1F4E5B;font-weight:600;">Abrir el checklist interactivo &rarr;</a></p>',

      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">¿Quieres un segundo par de ojos humanos después de correrlo? Responde a este correo con tu URL y le doy una mirada real — sin lista, sin goteo, sin newsletter, solo una respuesta de mi parte.</p>',
      '<p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#2A2D33;">O si prefieres que yo corra los chequeos por ti y te escriba la lista de arreglos:</p>',
      '<p style="margin:0 0 20px;"><a href="https://calendly.com/dongoldstein-accts/muntinconsult" style="display:inline-block;padding:10px 18px;background:#FAF7F2;color:#1F4E5B;text-decoration:none;border:1px solid #1F4E5B;border-radius:999px;font-weight:600;font-size:14px;">Agenda una llamada de 20 min &rarr;</a></p>',

      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">— Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital · Silver Spring, MD</span></p>',
    ].join('\n')
  );

  const txt = [
    openingTxt,
    '',
    'Descargar el PDF: ' + k.pdfUrl,
    '(Tamaño carta · ' + k.items + ' chequeos)',
    '',
    'O abre la versión interactiva — guarda tu avance en este dispositivo y deja que ajustes el checklist a tu tipo de ' + kindsLine + ' para que los ítems N/A salgan del puntaje:',
    k.pageUrl,
    '',
    '¿Quieres un segundo par de ojos humanos después de correrlo? Responde a este correo con tu URL y le doy una mirada real — sin lista, sin goteo, sin newsletter, solo una respuesta de mi parte.',
    '',
    'O si prefieres que yo corra los chequeos por ti y te escriba la lista de arreglos, agenda una llamada de 20 min:',
    'https://calendly.com/dongoldstein-accts/muntinconsult',
    '',
    '— Don',
    'Muntin Digital · Silver Spring, MD',
  ].join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// TODO — add Spanish peers for:
//   auditReportNotification       (es/tools/audits/*)
//   auditReportAutoResponder
//   auditDeepReportNotification
//   auditDeepReportAutoResponder
//
// As long as they're not exported here, templates.js falls
// through to the English versions. That's safe during rollout
// because the Spanish pages that would post to those endpoints
// don't exist yet or are acceptable to return English responses
// on until a focused sprint wires them up.
// ============================================================
