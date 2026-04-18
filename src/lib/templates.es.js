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
// TODO — add Spanish peers for:
//   checklistNotification         (es/resources/*)
//   checklistAutoResponder
//   auditReportNotification       (es/tools/audits/*)
//   auditReportAutoResponder
//   auditDeepReportNotification
//   auditDeepReportAutoResponder
//
// As long as they're not exported here, templates.js falls
// through to the English versions. That's safe during rollout
// because the Spanish pages that would post to those endpoints
// don't exist yet.
// ============================================================
