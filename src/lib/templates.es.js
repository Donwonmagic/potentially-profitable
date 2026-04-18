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
// Helper: subtype voice (restaurant flavor used by the /es/
// checklist). Mirrors the shape of checklistKind() in the EN file
// so the downstream email code reads identically; only the copy is
// translated. Kept local to this file on purpose — the subtype
// vocabulary is email-copy concern, not a shared validation rule.
// ============================================================
const RESTAURANT_SUBTYPES_ES = {
  'all':         { label: 'Restaurante',      subjectNoun: 'restaurante',         tailoredTo: null },
  'fine-dining': { label: 'Alta cocina',      subjectNoun: 'restaurante',         tailoredTo: 'alta cocina' },
  'casual':      { label: 'Casual / barrio',  subjectNoun: 'restaurante',         tailoredTo: 'restaurante de barrio' },
  'fast-casual': { label: 'Fast-casual',      subjectNoun: 'restaurante',         tailoredTo: 'fast-casual' },
  'bar':         { label: 'Bar / coctel',     subjectNoun: 'bar',                 tailoredTo: 'bar' },
  'cafe':        { label: 'Caf\u00e9 / panader\u00eda', subjectNoun: 'caf\u00e9', tailoredTo: 'caf\u00e9 / panader\u00eda' },
  'truck':       { label: 'Food truck',       subjectNoun: 'food truck',          tailoredTo: 'food truck' },
};

function checklistKindEs(body) {
  const businessField = String(body.restaurant || body.business || '').trim();
  const rawSubtype = String(body.subtype || 'all').trim();
  const subtype = RESTAURANT_SUBTYPES_ES[rawSubtype] ? rawSubtype : 'all';
  const voice = RESTAURANT_SUBTYPES_ES[subtype];
  return {
    subtype,
    subtypeLabel:  voice.label,
    tailoredTo:    voice.tailoredTo,
    subjectNoun:   voice.subjectNoun,
    titleLead:     'Tu lista de verificaci\u00f3n de sitio web de ' + voice.subjectNoun,
    businessLabel: 'Restaurante',
    businessField,
    items:         30,
    pageUrl:       'https://muntin.digital/es/resources/restaurant-website-checklist/',
    pdfUrl:        'https://muntin.digital/es/resources/restaurant-website-checklist/muntin-restaurant-website-checklist-es.pdf',
    auditUrl:      'https://muntin.digital/tools/audits/restaurant/?lang=es',
  };
}


// ============================================================
// 2. CHECKLIST — notification to Don (Spanish request)
// ============================================================

export function checklistNotification(body) {
  const email = String(body.email || '\u2014').trim();
  const k = checklistKindEs(body);
  const subtypeTag = k.subtype === 'all' ? 'restaurante' : k.subtypeLabel.toLowerCase();
  const subject = 'PDF de checklist solicitado (' + subtypeTag + ')' + (k.businessField ? ' \u2014 ' + k.businessField : '');

  const html = htmlShell(
    'Lista de verificaci\u00f3n \u2014 solicitud de PDF',
    [
      field('De', escapeHtml(email)),
      k.subtype !== 'all' ? field('Subtipo', escapeHtml(k.subtypeLabel)) : '',
      k.businessField ? field(k.businessLabel, escapeHtml(k.businessField)) : '',
      '<p style="margin:24px 0 0;font-size:13px;color:#6B6B6B;">Auto-respuesta con el enlace al PDF ya enviada. No requiere seguimiento manual salvo que quieras trabajar este lead.</p>',
    ].filter(Boolean).join('\n')
  );

  const txt = [
    'Lista de verificaci\u00f3n \u2014 solicitud de PDF',
    '',
    'De: ' + email,
    k.subtype !== 'all' ? 'Subtipo: ' + k.subtypeLabel : '',
    k.businessField ? k.businessLabel + ': ' + k.businessField : '',
    '',
    '--',
    'Auto-respuesta con el enlace al PDF ya enviada.',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 2b. CHECKLIST — auto-responder to the visitor (Spanish)
// ============================================================

export function checklistAutoResponder(body) {
  const k = checklistKindEs(body);
  const biz = k.businessField;
  const subject = biz ? k.titleLead + ' \u2014 ' + biz : k.titleLead;

  const tailoredLine = k.tailoredTo ? ' personalizada para <strong>' + escapeHtml(k.tailoredTo) + '</strong>' : '';
  const tailoredLineTxt = k.tailoredTo ? ' personalizada para ' + k.tailoredTo : '';
  const opening = biz
    ? 'Aqu\u00ed est\u00e1 el PDF para <strong>' + escapeHtml(biz) + '</strong>' + tailoredLine + '. Impr\u00edmelo, ponlo en el tablero de la oficina o p\u00e1salo por el equipo en la pr\u00f3xima reuni\u00f3n \u2014 est\u00e1 hecho para marcarse con un boli.'
    : 'Aqu\u00ed est\u00e1 tu PDF' + tailoredLine + '. Impr\u00edmelo, ponlo en el tablero de la oficina o p\u00e1salo por el equipo en la pr\u00f3xima reuni\u00f3n \u2014 est\u00e1 hecho para marcarse con un boli.';
  const openingTxt = biz
    ? 'Aqu\u00ed est\u00e1 el PDF para ' + biz + tailoredLineTxt + '. Impr\u00edmelo, ponlo en el tablero de la oficina o p\u00e1salo por el equipo en la pr\u00f3xima reuni\u00f3n \u2014 est\u00e1 hecho para marcarse con un boli.'
    : 'Aqu\u00ed est\u00e1 tu PDF' + tailoredLineTxt + '. Impr\u00edmelo, ponlo en el tablero de la oficina o p\u00e1salo por el equipo en la pr\u00f3xima reuni\u00f3n \u2014 est\u00e1 hecho para marcarse con un boli.';

  const kindsLine = 'restaurante (alta cocina, casual, bar, caf\u00e9, food truck)';

  const html = htmlShell(
    k.titleLead + (biz ? ' \u2014 ' + biz : ''),
    [
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#2A2D33;">' + opening + '</p>',
      '<p style="margin:0 0 10px;">' +
        '<a href="' + k.pdfUrl + '" style="display:inline-block;padding:14px 26px;background:#1F4E5B;color:#FAF7F2;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px;">Descargar el PDF &rarr;</a>' +
      '</p>',
      '<p style="margin:0 0 22px;font-size:13px;color:#6B6B6B;">Tama\u00f1o carta \u00b7 ' + k.items + ' verificaciones \u00b7 se abre en tu navegador.</p>',

      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Si prefieres marcar los \u00edtems en pantalla, la versi\u00f3n interactiva guarda tu progreso en este dispositivo y te deja personalizar la lista seg\u00fan tu tipo de ' + kindsLine + ' para que los \u00edtems N/A salgan de tu puntuaci\u00f3n:</p>',
      '<p style="margin:0 0 24px;"><a href="' + k.pageUrl + '" style="color:#1F4E5B;font-weight:600;">Abrir la lista interactiva &rarr;</a></p>',

      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">\u00bfQuieres una segunda opini\u00f3n humana despu\u00e9s de correrla? Responde a este correo con tu URL y la reviso de verdad \u2014 sin lista, sin newsletter, sin drip, solo una respuesta m\u00eda.</p>',
      '<p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#2A2D33;">O si prefieres que yo haga las verificaciones y te escriba la lista de arreglos:</p>',
      '<p style="margin:0 0 20px;"><a href="https://calendly.com/dongoldstein-accts/muntinconsult" style="display:inline-block;padding:10px 18px;background:#FAF7F2;color:#1F4E5B;text-decoration:none;border:1px solid #1F4E5B;border-radius:999px;font-weight:600;font-size:14px;">Reservar una llamada de 20 min &rarr;</a></p>',

      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">\u2014 Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital \u00b7 Silver Spring, MD</span></p>',
    ].join('\n')
  );

  const txt = [
    openingTxt,
    '',
    'Descarga el PDF: ' + k.pdfUrl,
    '(Tama\u00f1o carta \u00b7 ' + k.items + ' verificaciones)',
    '',
    'O abre la versi\u00f3n interactiva \u2014 guarda tu progreso en este dispositivo y te deja personalizar seg\u00fan tu tipo de ' + kindsLine + ':',
    k.pageUrl,
    '',
    '\u00bfQuieres una segunda opini\u00f3n humana despu\u00e9s de correrla? Responde a este correo con tu URL y la reviso de verdad \u2014 sin lista, sin drip, sin newsletter.',
    '',
    'O si prefieres que yo haga las verificaciones y te escriba la lista de arreglos, reserva una llamada de 20 min:',
    'https://calendly.com/dongoldstein-accts/muntinconsult',
    '',
    '\u2014 Don',
    'Muntin Digital \u00b7 Silver Spring, MD',
  ].join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 3. AUDIT REPORT (standard tier) \u2014 notification to Don
// ============================================================
// Triggered when a Spanish-speaking visitor submits the "email me
// the PDF" form on the audit tool with locale=es. Stays terse and
// label-driven so Don\u2019s inbox keeps its Spanish/English visual
// consistency across sources.

export function auditReportNotification(body) {
  const email       = String(body.email || '\u2014').trim();
  const auditedUrl  = String(body.audited_url || '').trim();
  const overall     = String(body.overall_score || '\u2014').trim();
  const readiness   = String(body.restaurant_readiness || '\u2014').trim();
  const shareLink   = String(body.shareable_link || '').trim();
  const summary     = String(body.summary || '').trim();
  const failing     = String(body.failing_checks || '').trim();
  const unverified  = String(body.unverified_checks || '').trim();
  const corrections = String(body.user_corrections || '').trim();

  const subject = 'Informe de auditor\u00eda solicitado \u2014 ' + (prettyUrl(auditedUrl) || email) + ' (' + overall + '/100)';

  const html = htmlShell(
    'Informe de auditor\u00eda solicitado',
    [
      field('De',          escapeHtml(email)),
      field('Auditado',    auditedUrl ? '<a href="' + escapeHtml(auditedUrl) + '" style="color:#1F4E5B;">' + escapeHtml(prettyUrl(auditedUrl)) + '</a>' : '\u2014'),
      field('General',     escapeHtml(overall) + '/100'),
      field('Preparaci\u00f3n del restaurante', escapeHtml(readiness) + (readiness !== 'N/A' && readiness !== '\u2014' ? '/100' : '')),
      summary  ? field('Resumen', escapeHtml(summary)) : '',
      failing  ? field('Verificaciones fallidas', '<div style="white-space:pre-wrap;color:#B8541A;">' + escapeHtml(failing.replace(/; /g, '\n')) + '</div>') : '',
      unverified ? field('Sin verificar', '<div style="white-space:pre-wrap;color:#6b7a8a;">' + escapeHtml(unverified.replace(/; /g, '\n')) + '</div>') : '',
      corrections ? field('Correcciones del usuario', '<div style="color:#2A2D33;font-size:13px;">' + escapeHtml(corrections) + '</div>') : '',
      shareLink ? '<p style="margin:20px 0 0;"><a href="' + escapeHtml(shareLink) + '" style="color:#1F4E5B;font-weight:600;">Abrir esta auditor\u00eda en la herramienta &rarr;</a></p>' : '',
    ].filter(Boolean).join('\n')
  );

  const txt = [
    'Informe de auditor\u00eda solicitado',
    '',
    'De: ' + email,
    auditedUrl ? 'Auditado: ' + auditedUrl : '',
    'General: ' + overall + '/100',
    'Preparaci\u00f3n del restaurante: ' + readiness + (readiness !== 'N/A' && readiness !== '\u2014' ? '/100' : ''),
    summary ? 'Resumen: ' + summary : '',
    '',
    failing ? 'Verificaciones fallidas:\n' + failing.split('; ').map(f => '  - ' + f).join('\n') : '',
    '',
    unverified ? 'Sin verificar:\n' + unverified.split('; ').map(f => '  - ' + f).join('\n') : '',
    '',
    corrections ? 'Correcciones del usuario: ' + corrections : '',
    '',
    shareLink ? 'Abrir en la herramienta: ' + shareLink : '',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 3b. AUDIT REPORT (standard tier) \u2014 auto-responder to visitor
// ============================================================

export function auditReportAutoResponder(body) {
  const auditedUrl = String(body.audited_url || '').trim();
  const overall    = String(body.overall_score || '').trim();
  const summary    = String(body.summary || '').trim();
  const shareLink  = String(body.shareable_link || '').trim();

  const pretty = prettyUrl(auditedUrl);
  const subject = 'Tu informe de auditor\u00eda \u2014 ' + (pretty || 'Muntin Digital') + (overall ? ' (' + overall + '/100)' : '');

  const html = htmlShell(
    'Auditor\u00eda de tu sitio web de restaurante',
    [
      pretty  ? '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Aqu\u00ed est\u00e1 el informe de auditor\u00eda para <strong>' + escapeHtml(pretty) + '</strong>.</p>' : '',
      overall ? '<p style="margin:0 0 20px;padding:20px;background:#F3EEE3;border-radius:12px;text-align:center;"><span style="display:block;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B6B6B;margin-bottom:8px;">Puntuaci\u00f3n general</span><span style="font-size:48px;font-weight:500;color:#1F4E5B;font-family:Georgia,serif;">' + escapeHtml(overall) + '<span style="font-size:22px;color:#6B6B6B;">/100</span></span>' + (summary ? '<br><span style="font-size:13px;color:#2A2D33;margin-top:8px;display:inline-block;">' + escapeHtml(summary) + '</span>' : '') + '</p>' : '',
      shareLink ? '<p style="margin:0 0 20px;"><a href="' + escapeHtml(shareLink) + '" style="display:inline-block;padding:12px 22px;background:#1F4E5B;color:#FAF7F2;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">Abrir el informe interactivo completo</a></p>' : '',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">La herramienta de auditor\u00eda es un esc\u00e1ner \u2014 es buena, pero no soy yo. Si quieres una segunda opini\u00f3n humana sobre qu\u00e9 arreglar primero (y qu\u00e9 ignorar), responde a este correo con tus preguntas o reserva una llamada gratis de 20 minutos:</p>',
      '<p style="margin:0 0 20px;"><a href="https://calendly.com/dongoldstein-accts/muntinconsult" style="color:#1F4E5B;font-weight:600;">Reservar una llamada de 20 min &rarr;</a></p>',
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6B6B6B;">Sin lista de marketing, sin drip, sin newsletter. Solo te escribo si respondes a este correo.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">\u2014 Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital \u00b7 Silver Spring, MD</span></p>',
    ].filter(Boolean).join('\n')
  );

  const txt = [
    pretty  ? 'Aqu\u00ed est\u00e1 el informe de auditor\u00eda para ' + pretty + '.' : 'Aqu\u00ed est\u00e1 tu informe de auditor\u00eda.',
    overall ? 'Puntuaci\u00f3n general: ' + overall + '/100' : '',
    summary || '',
    '',
    shareLink ? 'Abrir el informe interactivo completo: ' + shareLink : '',
    '',
    'La herramienta de auditor\u00eda es un esc\u00e1ner \u2014 es buena, pero no soy yo. Si quieres una segunda opini\u00f3n humana sobre qu\u00e9 arreglar primero, responde a este correo o reserva una llamada gratis de 20 minutos:',
    '',
    'https://calendly.com/dongoldstein-accts/muntinconsult',
    '',
    'Sin lista de marketing, sin drip, sin newsletter. Solo te escribo si respondes a este correo.',
    '',
    '\u2014 Don',
    'Muntin Digital \u00b7 Silver Spring, MD',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 4. AUDIT DEEP REPORT \u2014 notification to Don (with PDF)
// ============================================================

export function auditDeepReportNotification(body) {
  const email       = String(body.email || '\u2014').trim();
  const auditedUrl  = String(body.audited_url || '').trim();
  const overall     = String(body.overall_score || '\u2014').trim();
  const subtype     = String(body.subtype || '').trim();
  const shareLink   = String(body.shareable_link || '').trim();
  const source      = String(body.source || '').trim();
  const hasPdf      = typeof body.pdf_b64 === 'string' && body.pdf_b64.length > 0;

  const subject = 'PDF de auditor\u00eda solicitado \u2014 ' + (prettyUrl(auditedUrl) || email) + ' (' + overall + '/100)';

  const html = htmlShell(
    'PDF de auditor\u00eda solicitado',
    [
      field('De',       escapeHtml(email)),
      field('Auditado', auditedUrl ? '<a href="' + escapeHtml(auditedUrl) + '" style="color:#1F4E5B;">' + escapeHtml(prettyUrl(auditedUrl)) + '</a>' : '\u2014'),
      field('General',  escapeHtml(overall) + '/100'),
      field('Subtipo',  escapeHtml(subtype || 'restaurante')),
      source ? field('Origen', escapeHtml(source)) : '',
      hasPdf ? field('PDF', 'Adjunto a este correo \u2014 el mismo archivo que recibi\u00f3 el usuario.') : field('PDF', '<em style="color:#B8541A;">Sin adjunto \u2014 la generaci\u00f3n del PDF en el cliente fall\u00f3; el usuario igual recibi\u00f3 el cuerpo HTML.</em>'),
      shareLink ? '<p style="margin:20px 0 0;"><a href="' + escapeHtml(shareLink) + '" style="color:#1F4E5B;font-weight:600;">Abrir esta auditor\u00eda en la herramienta &rarr;</a></p>' : '',
    ].filter(Boolean).join('\n')
  );

  const txt = [
    'PDF de auditor\u00eda solicitado',
    '',
    'De: ' + email,
    auditedUrl ? 'Auditado: ' + auditedUrl : '',
    'General: ' + overall + '/100',
    'Subtipo: ' + (subtype || 'restaurante'),
    source ? 'Origen: ' + source : '',
    hasPdf ? 'PDF: adjunto a este correo.' : 'PDF: sin adjunto (fall\u00f3 la generaci\u00f3n en el cliente).',
    '',
    shareLink ? 'Abrir en la herramienta: ' + shareLink : '',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 4b. AUDIT DEEP REPORT \u2014 auto-responder (PDF included)
// ============================================================
//
// Subtype intros mirror the EN AUDIT_DEEP_REPORT_INTROS table.
// Short, specific, restaurant-operator voice.
const AUDIT_DEEP_REPORT_INTROS_ES = {
  'fine-dining':    'Para alta cocina, lo primero que miro es si las reservas se quedan en tu propio sitio (Resy, Tock, SevenRooms o un widget embebido) en lugar de pasar todo por OpenTable \u2014 ah\u00ed es donde vive el margen de la reserva y los datos de primera mano del cliente.',
  'casual-dining':  'Para restaurantes casuales, la auditor\u00eda marca si capturas reservas Y pedidos en l\u00ednea directos. Si falta una, el ingreso se va a OpenTable, DoorDash o a un competidor que tiene las dos.',
  'fast-casual':    'Para fast-casual, la auditor\u00eda es casi todo sobre pedidos en l\u00ednea directos. Cada pedido que pasa por Toast o ChowNow en vez de DoorDash te ahorra 20\u201330% de comisi\u00f3n y construye una lista de clientes propia.',
  'cafe':           'Para caf\u00e9s, la auditor\u00eda se apoya m\u00e1s en la claridad de horarios, un tel\u00e9fono y mapa tocables, y un men\u00fa legible en el tel\u00e9fono al sol. Eso es ~80% de lo que tu tr\u00e1fico matinal realmente necesita.',
  'bakery':         'Para panader\u00edas, la se\u00f1al m\u00e1s fuerte es si el pedido de pasteles personalizados o de boda tiene un lugar en tu sitio. Esos pedidos de 500\u20132000 USD rara vez se cierran por DM de Instagram \u2014 un formulario dedicado se paga r\u00e1pido.',
  'bar-pub':        'Para bares y pubs, la auditor\u00eda revisa el flujo de reserva de eventos privados, la visibilidad del happy hour y la cadencia de rotaci\u00f3n de cocteles / grifos. Control de edad y menciones de prensa son se\u00f1ales de confianza que tambi\u00e9n marcamos.',
  'pizzeria':       'Para pizzer\u00edas, la auditor\u00eda es sobre pedido directo y claridad de zona de entrega. Cada pizza por Slice / DoorDash / Grubhub te cuesta 20\u201330% de comisi\u00f3n; un flujo directo en Toast o ChowNow lo corta a la mitad y te deja el cliente.',
  'food-truck':     'Para food trucks, la auditor\u00eda prioriza un calendario visible / p\u00e1gina de \u201cd\u00f3nde estamos hoy\u201d y un intake de catering. Instagram genera descubrimiento, pero el trabajo del sitio es convertir un visitante curioso en una reserva de catering o un pickup.',
  'ghost-kitchen':  'Para ghost kitchens, la auditor\u00eda marca si los enlaces a agregadores est\u00e1n prominentes y si el sitio dice claramente que es solo delivery, para que los clientes no manejen a un local cerrado. La paridad entre men\u00fa y agregador es la palanca oculta de conversi\u00f3n.',
  'catering-only':  'Para negocios solo de catering, la auditor\u00eda es sobre una cosa: si tu sitio convierte a un planner de eventos en una solicitud de cotizaci\u00f3n estructurada. ezCater, CaterTrax, Tripleseat o un RFQ a medida \u2014 sin eso, los planners comparando proveedores se van con un competidor m\u00e1s claro.',
  'restaurant':     'Esta es una auditor\u00eda espec\u00edfica para restaurantes \u2014 las verificaciones prioritarias abajo son las que de verdad mueven el comportamiento de los clientes en nuestra experiencia construyendo sitios para restaurantes independientes.'
};

function deepReportIntroForEs(subtypeId) {
  if (subtypeId && AUDIT_DEEP_REPORT_INTROS_ES[subtypeId]) {
    return AUDIT_DEEP_REPORT_INTROS_ES[subtypeId];
  }
  return AUDIT_DEEP_REPORT_INTROS_ES.restaurant;
}

export function auditDeepReportAutoResponder(body) {
  const auditedUrl = String(body.audited_url || '').trim();
  const overall    = String(body.overall_score || '').trim();
  const subtype    = String(body.subtype || '').trim();
  const shareLink  = String(body.shareable_link || '').trim();
  const hasPdf     = typeof body.pdf_b64 === 'string' && body.pdf_b64.length > 0;

  const pretty = prettyUrl(auditedUrl);
  const subject = 'Auditor\u00eda de tu sitio web de restaurante \u2014 ' + (pretty || 'Muntin Digital') + (overall ? ' (' + overall + '/100)' : '');

  const intro = deepReportIntroForEs(subtype);

  const html = htmlShell(
    'Auditor\u00eda de tu sitio web de restaurante',
    [
      pretty  ? '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Aqu\u00ed est\u00e1 tu informe personalizado para <strong>' + escapeHtml(pretty) + '</strong>. El PDF completo est\u00e1 adjunto a este correo \u2014 cubre la puntuaci\u00f3n, tus tres principales arreglos, cada verificaci\u00f3n prioritaria de restaurante que hicimos, y una p\u00e1gina de pr\u00f3ximos pasos.</p>' : '',
      overall ? '<p style="margin:0 0 20px;padding:20px;background:#F3EEE3;border-radius:12px;text-align:center;"><span style="display:block;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B6B6B;margin-bottom:8px;">Puntuaci\u00f3n general</span><span style="font-size:48px;font-weight:500;color:#1F4E5B;font-family:Georgia,serif;">' + escapeHtml(overall) + '<span style="font-size:22px;color:#6B6B6B;">/100</span></span></p>' : '',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">' + escapeHtml(intro) + '</p>',
      hasPdf
        ? '<p style="margin:0 0 18px;padding:14px 18px;background:#E8F1F3;border-left:4px solid #1F4E5B;border-radius:8px;font-size:15px;line-height:1.55;color:#14161A;"><strong>Tu PDF est\u00e1 adjunto.</strong><br>Gu\u00e1rdalo, re\u00e9nv\u00edalo a tu desarrollador o agencia de marketing, o impr\u00edmelo para marcarlo a mano \u2014 est\u00e1 hecho para usarse.</p>'
        : '',
      shareLink ? '<p style="margin:0 0 20px;"><a href="' + escapeHtml(shareLink) + '" style="display:inline-block;padding:12px 22px;background:#1F4E5B;color:#FAF7F2;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">Abrir el informe interactivo</a></p>' : '',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Si quieres una segunda opini\u00f3n humana sobre qu\u00e9 arreglar primero, responde a este correo con tus preguntas o reserva una llamada gratis de 20 minutos:</p>',
      '<p style="margin:0 0 20px;"><a href="https://calendly.com/dongoldstein-accts/muntinconsult" style="color:#1F4E5B;font-weight:600;">Reservar una llamada de 20 min &rarr;</a></p>',
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6B6B6B;">Sin lista de marketing, sin drip, sin newsletter. Solo te escribo si respondes a este correo.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">\u2014 Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital \u00b7 Silver Spring, MD</span></p>',
    ].filter(Boolean).join('\n')
  );

  const txt = [
    pretty  ? 'Aqu\u00ed est\u00e1 tu informe personalizado para ' + pretty + '. El PDF completo est\u00e1 adjunto.' : 'Aqu\u00ed est\u00e1 tu informe personalizado. El PDF completo est\u00e1 adjunto.',
    overall ? 'Puntuaci\u00f3n general: ' + overall + '/100' : '',
    '',
    intro,
    '',
    hasPdf ? 'Tu PDF est\u00e1 adjunto a este correo. Gu\u00e1rdalo, re\u00e9nv\u00edalo o impr\u00edmelo \u2014 est\u00e1 hecho para usarse.' : '',
    shareLink ? 'Abrir el informe interactivo: ' + shareLink : '',
    '',
    'Si quieres una segunda opini\u00f3n humana sobre qu\u00e9 arreglar primero, responde a este correo o reserva una llamada gratis de 20 minutos:',
    'https://calendly.com/dongoldstein-accts/muntinconsult',
    '',
    'Sin lista de marketing, sin drip, sin newsletter. Solo te escribo si respondes a este correo.',
    '',
    '\u2014 Don',
    'Muntin Digital \u00b7 Silver Spring, MD',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}
