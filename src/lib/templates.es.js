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


// D10: Spanish visual frame — tracks every D9 improvement made to
// the English htmlShell. Same markup, same inline styles, same
// bulletproof button helpers; only the footer link routes to the
// /es/ locale so a Spanish reader lands on the Spanish site when
// they click through.
function htmlShell(title, bodyHtml, receivedBecause) {
  const footerReason = receivedBecause
    ? '<p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:#6B6B6B;">' + escapeHtml(receivedBecause) + '</p>'
    : '';
  return [
    '<!doctype html>',
    '<html lang="es"><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="x-apple-disable-message-reformatting">',
    '<title>' + escapeHtml(title) + '</title>',
    '</head>',
    '<body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;color:#14161A;">',
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#FAF7F2;padding:32px 16px;">',
    '<tr><td align="center">',
    '<table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:560px;background:#ffffff;border:1px solid #E8E2D6;border-radius:12px;overflow:hidden;">',
    '<tr><td style="padding:32px 36px;">',
    '<p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1F4E5B;">Muntin Digital</p>',
    '<h1 style="margin:0 0 20px;font-size:22px;font-weight:500;color:#14161A;font-family:Georgia,\'Times New Roman\',serif;letter-spacing:-0.01em;line-height:1.25;">' + escapeHtml(title) + '</h1>',
    bodyHtml,
    '</td></tr>',
    '<tr><td style="padding:20px 36px;background:#F3EEE3;border-top:1px solid #E8E2D6;font-size:12px;color:#6B6B6B;">',
    footerReason,
    'Muntin Digital · Silver Spring, MD · <a href="https://muntin.digital/es/" style="color:#1F4E5B;text-decoration:none;font-weight:600;">muntin.digital</a>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>',
  ].join('\n');
}

// D10: CTA button helpers (ES mirror of primaryCta / secondaryCta
// in templates.js). Same bulletproof table-wrapped anchor, same
// visual palette — only the arrow and label differ per call site.
export function primaryCta(url, label) {
  return _buttonTable(url, label, '#1F4E5B', '#FAF7F2', '#1F4E5B');
}
export function secondaryCta(url, label) {
  return _buttonTable(url, label, '#FAF7F2', '#1F4E5B', '#1F4E5B');
}
function _buttonTable(url, label, bg, color, border) {
  return [
    '<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 8px;">',
    '<tr><td align="center" bgcolor="' + bg + '" style="background:' + bg + ';border-radius:999px;border:1px solid ' + border + ';">',
    '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener" ' +
      'style="display:inline-block;padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;' +
      'font-size:14px;font-weight:600;line-height:1;color:' + color + ';text-decoration:none;border-radius:999px;">' +
      escapeHtml(label) + ' &rarr;' +
    '</a>',
    '</td></tr>',
    '</table>',
  ].join('');
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
    ].join('\n'),
    'Enviaste el formulario de contacto en muntin.digital.'
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
// /es/learn/checklists/restaurant-website-checklist/. The form carries
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
    pageUrl:       'https://muntin.digital/es/learn/checklists/restaurant-website-checklist/',
    // D12b: pdfUrl retired alongside the static Puppeteer-rendered
    // PDF. The interactive page IS the deliverable; printing /
    // saving-as-PDF is a browser-native affordance on the live URL.
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
      '<p style="margin:24px 0 0;font-size:13px;color:#6B6B6B;">La autorespuesta con el enlace del checklist en vivo ya se envió al usuario. No hace falta seguimiento manual, a menos que quieras nutrir el lead. El contacto vino del sitio en español, así que conviene responder en español.</p>',
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
    'La autorespuesta con el enlace del checklist en vivo ya se envió al usuario.',
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
    ? 'Aquí está tu checklist del sitio para <strong>' + escapeHtml(biz) + '</strong>' + tailoredLine + '. Ábrelo abajo, marca los ítems conforme avanzas, y guarda o imprime una copia cuando necesites un impreso para la cocina o una reunión de planeación.'
    : 'Aquí está tu checklist del sitio' + tailoredLine + '. Ábrelo abajo, marca los ítems conforme avanzas, y guarda o imprime una copia cuando necesites un impreso para la cocina o una reunión de planeación.';

  const openingTxt = biz
    ? 'Aquí está tu checklist del sitio para ' + biz + tailoredLineTxt + '. Ábrelo abajo, marca los ítems conforme avanzas, y guarda o imprime una copia cuando necesites un impreso para la cocina o una reunión de planeación.'
    : 'Aquí está tu checklist del sitio' + tailoredLineTxt + '. Ábrelo abajo, marca los ítems conforme avanzas, y guarda o imprime una copia cuando necesites un impreso para la cocina o una reunión de planeación.';

  const kindsLine = 'restaurante (alta cocina, casual, bar, café, food truck)';

  const html = htmlShell(
    k.titleLead + (biz ? ' — ' + biz : ''),
    [
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#2A2D33;">' + opening + '</p>',

      primaryCta(k.pageUrl, 'Abrir tu checklist'),
      '<p style="margin:0 0 22px;font-size:13px;color:#6B6B6B;">' + k.items + ' chequeos · adaptado a ' + kindsLine + ' para que los ítems N/A salgan del puntaje · tu avance se guarda en este dispositivo.</p>',

      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">¿Quieres un segundo par de ojos humanos después de correrlo? Responde a este correo con tu URL y le doy una mirada real — sin lista, sin goteo, sin newsletter, solo una respuesta de mi parte.</p>',
      '<p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#2A2D33;">O si prefieres que yo corra los chequeos por ti y te escriba la lista de arreglos:</p>',
      secondaryCta('https://calendly.com/dongoldstein-accts/muntinconsult', 'Agenda una llamada de 20 min'),
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',

      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">— Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital · Silver Spring, MD</span></p>',
    ].join('\n'),
    'Solicitaste el checklist del sitio para tu ' + k.subjectNoun + '.'
  );

  const txt = [
    openingTxt,
    '',
    'Abrir tu checklist: ' + k.pageUrl,
    '(' + k.items + ' chequeos, adaptado a ' + kindsLine + ' para que los ítems N/A salgan del puntaje. Tu avance se guarda en este dispositivo; guarda o imprime cuando quieras desde tu navegador.)',
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
// 4. AUDIT REPORT (standard tier) \u2014 notification to Don
// ============================================================

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

  const subject = '[ES] Informe de auditor\u00eda solicitado \u2014 ' + (prettyUrl(auditedUrl) || email) + ' (' + overall + '/100)';

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
      shareLink ? '<p style="margin:0 0 10px;font-size:14px;color:#2A2D33;"><strong>Tu enlace permanente para compartir</strong> \u2014 reen\u00edalo a colaboradores, gu\u00e1rdalo para m\u00e1s tarde, o \u00e1brelo cuando quieras:</p>' : '',
      shareLink ? primaryCta(shareLink, 'Abrir el informe interactivo') : '',
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">La herramienta de auditor\u00eda es un esc\u00e1ner \u2014 es buena, pero no soy yo. Si quieres una segunda opini\u00f3n humana sobre qu\u00e9 arreglar primero (y qu\u00e9 ignorar), responde a este correo con tus preguntas o agenda una llamada gratis de 20 minutos:</p>',
      secondaryCta('https://calendly.com/dongoldstein-accts/muntinconsult', 'Agenda una llamada de 20 min'),
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6B6B6B;">Sin lista de marketing, sin goteo, sin newsletter. Solo te escribo si respondes a este correo.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">\u2014 Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital \u00b7 Silver Spring, MD</span></p>',
    ].filter(Boolean).join('\n'),
    'Solicitaste una copia por correo de tu informe de auditor\u00eda.'
  );

  const txt = [
    pretty  ? 'Aqu\u00ed est\u00e1 el informe de auditor\u00eda para ' + pretty + '.' : 'Aqu\u00ed est\u00e1 tu informe de auditor\u00eda.',
    overall ? 'Puntuaci\u00f3n general: ' + overall + '/100' : '',
    summary || '',
    '',
    shareLink ? 'Abrir el informe interactivo completo: ' + shareLink : '',
    '',
    'La herramienta de auditor\u00eda es un esc\u00e1ner \u2014 es buena, pero no soy yo. Si quieres una segunda opini\u00f3n humana sobre qu\u00e9 arreglar primero, responde a este correo o agenda una llamada gratis de 20 minutos:',
    '',
    'https://calendly.com/dongoldstein-accts/muntinconsult',
    '',
    'Sin lista de marketing, sin goteo, sin newsletter. Solo te escribo si respondes a este correo.',
    '',
    '\u2014 Don',
    'Muntin Digital \u00b7 Silver Spring, MD',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 5. AUDIT DEEP REPORT \u2014 notification + auto-responder (with PDF)
// ============================================================

export function auditDeepReportNotification(body) {
  const email       = String(body.email || '\u2014').trim();
  const auditedUrl  = String(body.audited_url || '').trim();
  const overall     = String(body.overall_score || '\u2014').trim();
  const subtype     = String(body.subtype || '').trim();
  const shareLink   = String(body.shareable_link || '').trim();
  const source      = String(body.source || '').trim();
  const hasPdf      = typeof body.pdf_b64 === 'string' && body.pdf_b64.length > 0;

  const subject = '[ES] PDF de auditor\u00eda solicitado \u2014 ' + (prettyUrl(auditedUrl) || email) + ' (' + overall + '/100)';

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
      shareLink ? '<p style="margin:0 0 10px;font-size:14px;color:#2A2D33;"><strong>Tu enlace permanente para compartir</strong> \u2014 reen\u00edalo a colaboradores, gu\u00e1rdalo para m\u00e1s tarde, o \u00e1brelo cuando quieras:</p>' : '',
      shareLink ? primaryCta(shareLink, 'Abrir el informe interactivo') : '',
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Si quieres una segunda opini\u00f3n humana sobre qu\u00e9 arreglar primero, responde a este correo con tus preguntas o agenda una llamada gratis de 20 minutos:</p>',
      secondaryCta('https://calendly.com/dongoldstein-accts/muntinconsult', 'Agenda una llamada de 20 min'),
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6B6B6B;">Sin lista de marketing, sin goteo, sin newsletter. Solo te escribo si respondes a este correo.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">\u2014 Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital \u00b7 Silver Spring, MD</span></p>',
    ].filter(Boolean).join('\n'),
    'Solicitaste el PDF completo de auditor\u00eda por correo.'
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
    'Si quieres una segunda opini\u00f3n humana sobre qu\u00e9 arreglar primero, responde a este correo o agenda una llamada gratis de 20 minutos:',
    'https://calendly.com/dongoldstein-accts/muntinconsult',
    '',
    'Sin lista de marketing, sin goteo, sin newsletter. Solo te escribo si respondes a este correo.',
    '',
    '\u2014 Don',
    'Muntin Digital \u00b7 Silver Spring, MD',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}

// ============================================================
// 7. D11: Re-audit 30-day reminder (ES)
// ============================================================
//
// ES peer of reauditReminder in templates.js. Same shape, same
// shell, localized copy. Routing happens in templates.js via the
// standard locale dispatcher.

export function reauditReminder(body) {
  const pretty    = String(body.pretty    || '').trim();
  const auditLink = String(body.auditLink || '').trim();
  const subject = 'Hora de re-auditar ' + (pretty || 'tu sitio') + ' \u2014 recordatorio de 30 d\u00edas';

  const html = htmlShell(
    'Hora de re-auditar',
    [
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Hola,</p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Hace aproximadamente 30 d\u00edas auditaste <strong>' + escapeHtml(pretty || 'tu sitio') + '</strong> con la herramienta gratuita de Muntin Digital.</p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Si arreglaste alguno de los hallazgos, ejecutar una nueva auditor\u00eda mostrar\u00e1 exactamente qu\u00e9 se resolvi\u00f3 y cu\u00e1nto subi\u00f3 tu puntuaci\u00f3n.</p>',
      primaryCta(auditLink, 'Re-auditar mi sitio'),
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6B6B6B;">Sin lista de marketing, sin goteo, sin newsletter. Solo te escribo si respondes a este correo.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">\u2014 Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital \u00b7 Silver Spring, MD</span></p>',
    ].join('\n'),
    'Solicitaste un recordatorio de 30 d\u00edas para re-auditar ' + (pretty || 'tu sitio') + '.'
  );

  const txt = [
    'Hola,',
    '',
    'Hace aproximadamente 30 d\u00edas auditaste ' + (pretty || 'tu sitio') + ' con la herramienta gratuita de Muntin Digital.',
    '',
    'Si arreglaste alguno de los hallazgos, ejecutar una nueva auditor\u00eda mostrar\u00e1 exactamente qu\u00e9 se resolvi\u00f3 y cu\u00e1nto subi\u00f3 tu puntuaci\u00f3n.',
    '',
    'Ejecutar nueva auditor\u00eda: ' + auditLink,
    '',
    'Sin lista de marketing, sin goteo de correos, sin bolet\u00edn. Solo te escribir\u00e9 si respondes a este mensaje.',
    '',
    '\u2014 Don',
    'Muntin Digital',
  ].join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// Sprint 0 (Workshop) \u2014 magic-link sign-in email (ES)
// ============================================================
//
// Spanish peer of templates.js#magicLinkEmail. The dispatcher in
// templates.js routes here when body.locale === 'es'.

export function magicLinkEmail(body) {
  const link = String(body.link || '').trim();
  const subject = 'Tu enlace de acceso al Taller de Muntin';

  const html = htmlShell(
    'Acceder al Taller',
    [
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Haz clic en el bot\u00f3n para iniciar sesi\u00f3n. El enlace funciona una sola vez y vence en <strong>15 minutos</strong>.</p>',
      primaryCta(link, 'Iniciar sesi\u00f3n'),
      '<div style="height:8px;line-height:8px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6B6B6B;">Si el bot\u00f3n no funciona, pega este enlace en tu navegador:</p>',
      '<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#1F4E5B;word-break:break-all;"><a href="' + escapeHtml(link) + '" style="color:#1F4E5B;text-decoration:underline;">' + escapeHtml(link) + '</a></p>',
      '<p style="margin:24px 0 0;font-size:14px;line-height:1.55;color:#6B6B6B;">Si no solicitaste este correo, puedes ignorarlo \u2014 no se realiza ninguna acci\u00f3n hasta que se haga clic en el enlace, y vence solo.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">\u2014 Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital \u00b7 Silver Spring, MD</span></p>',
    ].join('\n'),
    'Solicitaste un enlace de acceso desde muntin.digital.'
  );

  const txt = [
    'Acceder al Taller de Muntin.',
    '',
    'Haz clic en el enlace para iniciar sesi\u00f3n. Funciona una sola vez y vence en 15 minutos.',
    '',
    link,
    '',
    'Si no solicitaste este correo, puedes ignorarlo \u2014 no se realiza ninguna acci\u00f3n hasta que se haga clic en el enlace, y vence solo.',
    '',
    '\u2014 Don',
    'Muntin Digital',
  ].join('\n');

  return { subject, html, text: txt };
}

