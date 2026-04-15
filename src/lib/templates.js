// ============================================================
// Email templates
// ============================================================
//
// Six templates total — one notification + one auto-responder for
// each of the three form endpoints. Each template returns a
// { subject, html, text } object so sendEmail() can use it
// directly without any further formatting.
//
// Voice: the same voice as the rest of the site. First-person
// singular, direct, no marketing filler, no "Dear valued customer"
// crap. Notifications to Don are terse and data-dense because he's
// already a subscriber. Auto-responders to users are warmer because
// they're the first actual contact with the studio.

import { escapeHtml, prettyUrl } from './validation.js';


// ------------------------------------------------------------
// Shared layout helpers
// ------------------------------------------------------------
//
// A plain-text HTML email shell with Muntin's brand colors. No
// external CSS, no web fonts — email clients strip or distrust
// both. Inline styles only. Kept minimal so Gmail, Outlook,
// Apple Mail, and Fastmail all render it consistently.

function htmlShell(title, bodyHtml) {
  return [
    '<!doctype html>',
    '<html><body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;color:#14161A;">',
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF7F2;padding:32px 16px;">',
    '<tr><td align="center">',
    '<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #E8E2D6;border-radius:12px;overflow:hidden;">',
    '<tr><td style="padding:32px 36px;">',
    '<p style="margin:0 0 20px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6B6B;">Muntin Digital</p>',
    '<h1 style="margin:0 0 20px;font-size:22px;font-weight:500;color:#14161A;font-family:Georgia,\'Times New Roman\',serif;letter-spacing:-0.01em;">' + escapeHtml(title) + '</h1>',
    bodyHtml,
    '</td></tr>',
    '<tr><td style="padding:20px 36px;background:#F3EEE3;border-top:1px solid #E8E2D6;font-size:12px;color:#6B6B6B;">',
    'Muntin Digital · Silver Spring, MD · <a href="https://muntin.digital/" style="color:#1F4E5B;text-decoration:none;">muntin.digital</a>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>',
  ].join('\n');
}

// Plain-text separator used between field blocks in notifications.
// Two newlines + divider + two newlines so it reads cleanly in any
// terminal-ish mail client.
const TXT_DIV = '\n\n--------------------------------\n\n';


// ============================================================
// 1. INTAKE FORM
// ============================================================
//
// The intake form is the main conversion path — someone saw the
// site, read enough to trust it, filled out a contact form. The
// notification email should give Don everything he needs to write
// a thoughtful first reply without opening Cloudflare's dashboard
// or the site. The auto-responder should confirm receipt and set
// expectation for the reply window without feeling automated.

export function intakeNotification(body) {
  const name     = String(body.name || '—').trim();
  const email    = String(body.email || '—').trim();
  const business = String(body.business || '').trim();
  const website  = String(body.website || '').trim();
  const services = String(body.services || '—').trim();
  const goals    = String(body.goals || '—').trim();
  const budget   = String(body.budget || '').trim();
  const referral = String(body.referral || '').trim();

  const subject = 'New project inquiry — ' + name + (business ? ' @ ' + business : '');

  const html = htmlShell(
    'New project inquiry',
    [
      field('From',     escapeHtml(name) + ' &lt;' + escapeHtml(email) + '&gt;'),
      business ? field('Business', escapeHtml(business)) : '',
      website  ? field('Current site', '<a href="' + escapeHtml(website) + '" style="color:#1F4E5B;">' + escapeHtml(prettyUrl(website)) + '</a>') : '',
      field('Interested in', escapeHtml(services)),
      budget   ? field('Budget',   escapeHtml(budget)) : '',
      field('Goals', '<div style="white-space:pre-wrap;">' + escapeHtml(goals) + '</div>'),
      referral ? field('Heard about us via', escapeHtml(referral)) : '',
      '<p style="margin:24px 0 0;padding:12px 16px;background:#E8F1F3;border-left:3px solid #1F4E5B;font-size:13px;color:#2A2D33;">Reply directly to this email to respond to ' + escapeHtml(name.split(' ')[0] || name) + ' — the Reply-To header is set.</p>',
    ].join('\n')
  );

  const txt = [
    'New project inquiry',
    '',
    'From: ' + name + ' <' + email + '>',
    business ? 'Business: ' + business : '',
    website  ? 'Current site: ' + website : '',
    'Interested in: ' + services,
    budget   ? 'Budget: ' + budget : '',
    '',
    'Goals:',
    goals,
    '',
    referral ? 'Heard about us via: ' + referral : '',
    '',
    '--',
    'Reply to this email to respond directly.',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}

export function intakeAutoResponder(body) {
  const firstName = String(body.name || '').trim().split(/\s+/)[0] || 'there';
  const subject = 'Got your note — reply within 24 hours';

  const html = htmlShell(
    'Thanks for reaching out',
    [
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Hi ' + escapeHtml(firstName) + ',</p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Don here. Your note came through — I read every one personally, and I\'ll reply within 24 hours (usually much faster) with specific thoughts on what you described.</p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Before I write back, I\'ll take a look at your current site, your menu, and your Google Business Profile if you have one, so the reply starts with real specifics about your situation — not a generic intro template.</p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">If something comes up on your end in the meantime, you can reply to this email and it lands in my actual inbox.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">— Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital · Silver Spring, MD</span></p>',
    ].join('\n')
  );

  const txt = [
    'Hi ' + firstName + ',',
    '',
    'Don here. Your note came through — I read every one personally, and I\'ll reply within 24 hours (usually much faster) with specific thoughts on what you described.',
    '',
    'Before I write back, I\'ll take a look at your current site, your menu, and your Google Business Profile if you have one, so the reply starts with real specifics about your situation — not a generic intro template.',
    '',
    'If something comes up on your end in the meantime, you can reply to this email and it lands in my actual inbox.',
    '',
    '— Don',
    'Muntin Digital · Silver Spring, MD',
  ].join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 2. CHECKLIST PDF REQUEST
// ============================================================
//
// Lower-intent form than intake — someone wanted the checklist as
// a PDF for their team. The auto-responder walks them back to the
// interactive version on the site (which is strictly better) and
// offers the Print-as-PDF affordance. Notification to Don is
// terse since this is mostly a lead signal for email nurture, not
// an immediate reply candidate.

export function checklistNotification(body) {
  const email      = String(body.email || '—').trim();
  const restaurant = String(body.restaurant || '').trim();
  const subject    = 'Checklist PDF requested' + (restaurant ? ' — ' + restaurant : '');

  const html = htmlShell(
    'Restaurant Website Checklist — PDF request',
    [
      field('From',       escapeHtml(email)),
      restaurant ? field('Restaurant', escapeHtml(restaurant)) : '',
      '<p style="margin:24px 0 0;font-size:13px;color:#6B6B6B;">Auto-responder already sent; no manual follow-up required unless you want to nurture this lead.</p>',
    ].join('\n')
  );

  const txt = [
    'Restaurant Website Checklist — PDF request',
    '',
    'From: ' + email,
    restaurant ? 'Restaurant: ' + restaurant : '',
    '',
    '--',
    'Auto-responder already sent.',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}

export function checklistAutoResponder(body) {
  const subject = 'Your restaurant website checklist';

  const html = htmlShell(
    'Your restaurant website checklist',
    [
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Thanks for asking. Here\'s the fastest way to get the checklist in the format you want:</p>',
      '<p style="margin:0 0 20px;"><a href="https://muntin.digital/resources/restaurant-website-checklist/" style="display:inline-block;padding:12px 22px;background:#1F4E5B;color:#FAF7F2;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">Open the interactive checklist</a></p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">The interactive version lets you check items off as you go (your progress saves automatically, even if you close the tab), and there\'s a <strong>Print or save as PDF</strong> button at the top of the page that produces a clean print-ready copy you can share with your team.</p>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">If there\'s a specific item you\'d like a second opinion on for your restaurant, reply to this email with your URL and I\'ll take a look. No list, no drip, no newsletter — just a real response.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">— Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital · Silver Spring, MD</span></p>',
    ].join('\n')
  );

  const txt = [
    'Thanks for asking. Here\'s the fastest way to get the checklist in the format you want:',
    '',
    'Open the interactive checklist: https://muntin.digital/resources/restaurant-website-checklist/',
    '',
    'The interactive version lets you check items off as you go (your progress saves automatically, even if you close the tab), and there\'s a "Print or save as PDF" button at the top of the page that produces a clean print-ready copy you can share with your team.',
    '',
    'If there\'s a specific item you\'d like a second opinion on for your restaurant, reply to this email with your URL and I\'ll take a look. No list, no drip, no newsletter — just a real response.',
    '',
    '— Don',
    'Muntin Digital · Silver Spring, MD',
  ].join('\n');

  return { subject, html, text: txt };
}


// ============================================================
// 3. AUDIT REPORT EMAIL
// ============================================================
//
// The audit-report form is the richest of the three — it carries
// Sprint 6c payload fields: overall score, restaurant readiness,
// the full shareable link, a one-line summary, and lists of
// failing / unverified checks. The notification to Don AND the
// auto-responder to the user both surface this context so the
// email actually acts as the deliverable, not just a receipt.

export function auditReportNotification(body) {
  const email       = String(body.email || '—').trim();
  const auditedUrl  = String(body.audited_url || '').trim();
  const overall     = String(body.overall_score || '—').trim();
  const readiness   = String(body.restaurant_readiness || '—').trim();
  const shareLink   = String(body.shareable_link || '').trim();
  const summary     = String(body.summary || '').trim();
  const failing     = String(body.failing_checks || '').trim();
  const unverified  = String(body.unverified_checks || '').trim();
  const corrections = String(body.user_corrections || '').trim();

  const subject = 'Audit report requested — ' + (prettyUrl(auditedUrl) || email) + ' (' + overall + '/100)';

  const html = htmlShell(
    'Audit report requested',
    [
      field('From',       escapeHtml(email)),
      field('Audited',    auditedUrl ? '<a href="' + escapeHtml(auditedUrl) + '" style="color:#1F4E5B;">' + escapeHtml(prettyUrl(auditedUrl)) + '</a>' : '—'),
      field('Overall',    escapeHtml(overall) + '/100'),
      field('Restaurant readiness', escapeHtml(readiness) + (readiness !== 'N/A' && readiness !== '—' ? '/100' : '')),
      summary  ? field('Summary', escapeHtml(summary)) : '',
      failing  ? field('Failing checks', '<div style="white-space:pre-wrap;color:#B8541A;">' + escapeHtml(failing.replace(/; /g, '\n')) + '</div>') : '',
      unverified ? field('Unverified', '<div style="white-space:pre-wrap;color:#6b7a8a;">' + escapeHtml(unverified.replace(/; /g, '\n')) + '</div>') : '',
      corrections ? field('User corrections', '<div style="color:#2A2D33;font-size:13px;">' + escapeHtml(corrections) + '</div>') : '',
      shareLink ? '<p style="margin:20px 0 0;"><a href="' + escapeHtml(shareLink) + '" style="color:#1F4E5B;font-weight:600;">Open this audit in the tool →</a></p>' : '',
    ].join('\n')
  );

  const txt = [
    'Audit report requested',
    '',
    'From: ' + email,
    auditedUrl ? 'Audited: ' + auditedUrl : '',
    'Overall: ' + overall + '/100',
    'Restaurant readiness: ' + readiness + (readiness !== 'N/A' && readiness !== '—' ? '/100' : ''),
    summary ? 'Summary: ' + summary : '',
    '',
    failing ? 'Failing checks:\n' + failing.split('; ').map(f => '  - ' + f).join('\n') : '',
    '',
    unverified ? "Couldn't verify:\n" + unverified.split('; ').map(f => '  - ' + f).join('\n') : '',
    '',
    corrections ? 'User corrections: ' + corrections : '',
    '',
    shareLink ? 'Open in tool: ' + shareLink : '',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}

export function auditReportAutoResponder(body) {
  const auditedUrl = String(body.audited_url || '').trim();
  const overall    = String(body.overall_score || '').trim();
  const summary    = String(body.summary || '').trim();
  const shareLink  = String(body.shareable_link || '').trim();

  const pretty = prettyUrl(auditedUrl);
  const subject = 'Your audit report — ' + (pretty || 'Muntin Digital') + (overall ? ' (' + overall + '/100)' : '');

  const html = htmlShell(
    'Your restaurant website audit',
    [
      pretty  ? '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Here\'s the audit report for <strong>' + escapeHtml(pretty) + '</strong>.</p>' : '',
      overall ? '<p style="margin:0 0 20px;padding:20px;background:#F3EEE3;border-radius:12px;text-align:center;"><span style="display:block;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B6B6B;margin-bottom:8px;">Overall score</span><span style="font-size:48px;font-weight:500;color:#1F4E5B;font-family:Georgia,serif;">' + escapeHtml(overall) + '<span style="font-size:22px;color:#6B6B6B;">/100</span></span>' + (summary ? '<br><span style="font-size:13px;color:#2A2D33;margin-top:8px;display:inline-block;">' + escapeHtml(summary) + '</span>' : '') + '</p>' : '',
      shareLink ? '<p style="margin:0 0 20px;"><a href="' + escapeHtml(shareLink) + '" style="display:inline-block;padding:12px 22px;background:#1F4E5B;color:#FAF7F2;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">Open the full interactive report</a></p>' : '',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">The audit tool is a scanner — it\'s good, but it\'s not me. If you want a human second opinion on what to fix first (and what to ignore), reply to this email with any questions or book a free 20-minute call:</p>',
      '<p style="margin:0 0 20px;"><a href="https://calendly.com/dongoldstein-accts/muntinconsult" style="color:#1F4E5B;font-weight:600;">Book a 20-min call →</a></p>',
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6B6B6B;">No marketing list, no drip, no newsletter. I\'ll only email you if you reply to this one.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">— Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital · Silver Spring, MD</span></p>',
    ].filter(Boolean).join('\n')
  );

  const txt = [
    pretty  ? 'Here\'s the audit report for ' + pretty + '.' : 'Here\'s your audit report.',
    overall ? '' : '',
    overall ? 'Overall score: ' + overall + '/100' : '',
    summary ? summary : '',
    '',
    shareLink ? 'Open the full interactive report: ' + shareLink : '',
    '',
    'The audit tool is a scanner — it\'s good, but it\'s not me. If you want a human second opinion on what to fix first (and what to ignore), reply to this email with any questions or book a free 20-minute call:',
    '',
    'https://calendly.com/dongoldstein-accts/muntinconsult',
    '',
    'No marketing list, no drip, no newsletter. I\'ll only email you if you reply to this one.',
    '',
    '— Don',
    'Muntin Digital · Silver Spring, MD',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}


// ------------------------------------------------------------
// Shared field helper — renders a labeled block in the HTML shell
// ------------------------------------------------------------

function field(label, valueHtml) {
  return (
    '<div style="margin:0 0 16px;">' +
      '<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6B6B6B;">' + escapeHtml(label) + '</p>' +
      '<div style="font-size:15px;line-height:1.5;color:#14161A;">' + valueHtml + '</div>' +
    '</div>'
  );
}
