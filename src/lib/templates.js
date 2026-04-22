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
import * as ES from './templates.es.js';


// ------------------------------------------------------------
// Locale dispatch
// ------------------------------------------------------------
//
// Each template below is a thin dispatcher: if the form body
// carries a recognized non-default locale AND the Spanish
// module exports a function with the same name, we route to
// it; otherwise we fall through to the English implementation.
//
// This keeps the /api/* worker handlers locale-unaware — they
// just pass the parsed form body to the template functions,
// which read body.locale themselves. Adding a third locale is
// a matter of (1) shipping a templates.<code>.js module with
// the subset of functions you want translated, and (2) adding
// the code to SUPPORTED_LOCALES below.
const SUPPORTED_LOCALES = new Set(['en', 'es']);

export function pickLocale(body) {
  const raw = String((body && body.locale) || 'en').trim().toLowerCase();
  return SUPPORTED_LOCALES.has(raw) ? raw : 'en';
}


// ------------------------------------------------------------
// Shared layout helpers
// ------------------------------------------------------------
//
// A plain-text HTML email shell with Muntin's brand colors. No
// external CSS, no web fonts — email clients strip or distrust
// both. Inline styles only. Kept minimal so Gmail, Outlook,
// Apple Mail, and Fastmail all render it consistently.

// D9: visual frame for every outgoing email. Shared between
// notifications (to Don) and auto-responders (to users) so a change
// here propagates to all six templates. Options:
//
//   title           — H1 above the body
//   bodyHtml        — pre-rendered HTML for the main content
//   receivedBecause — short one-liner (e.g. "You requested the
//                     restaurant website checklist PDF.") that
//                     surfaces in the cream footer on user-facing
//                     templates. Omitted for notifications (Don
//                     knows why he's getting the mail).
//
// Inline styles only — email clients strip <style> blocks and web
// fonts. Viewport meta added so the 560px card centers cleanly on
// mobile Gmail / Apple Mail / Outlook iOS. Bulletproof Outlook via
// <!--[if mso]> conditional font fallbacks in the root body style.
function htmlShell(title, bodyHtml, receivedBecause) {
  const footerReason = receivedBecause
    ? '<p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:#6B6B6B;">' + escapeHtml(receivedBecause) + '</p>'
    : '';
  return [
    '<!doctype html>',
    '<html lang="en"><head>',
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
    'Muntin Digital · Silver Spring, MD · <a href="https://muntin.digital/" style="color:#1F4E5B;text-decoration:none;font-weight:600;">muntin.digital</a>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>',
  ].join('\n');
}

// D9: CTA button helpers. Outlook-safe via table-wrapped anchor —
// Outlook 2016+ on Windows ignores button padding on raw <a> tags,
// but a <table>-wrapped button with cell padding renders correctly
// everywhere. Two variants: primary (filled teal) + secondary
// (teal-border, cream fill). Pure string builders — no dependencies.
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
  const locale = pickLocale(body);
  if (locale === 'es' && typeof ES.intakeNotification === 'function') {
    return ES.intakeNotification(body);
  }
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
  const locale = pickLocale(body);
  if (locale === 'es' && typeof ES.intakeAutoResponder === 'function') {
    return ES.intakeAutoResponder(body);
  }
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
    ].join('\n'),
    "You submitted the contact form at muntin.digital."
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
// Someone filled out the "Or have me email a copy" form on the
// restaurant-checklist page. The auto-responder is the actual
// deliverable: a personalized email with a direct link to the
// static PDF that lives alongside the page (generated by
// scripts/render-checklist-pdfs.mjs). Business-name personalization
// pulls from body.restaurant (or body.business as a fallback) so
// the subject line and body can address the person's actual
// restaurant instead of a generic "Thanks for asking".

// Subtype voice maps — keep in lockstep with VOICE_MAP in assets/site.js.
// Each row gives a noun for the subject line ("Your <subjectNoun>
// website checklist"), a phrase for the opener ("tailored to
// <tailoredTo>"), and a full human label that shows up on Don's
// notification email so the triage line gets the specific kind.
const RESTAURANT_SUBTYPES = {
  'all':          { subjectNoun: 'restaurant',        tailoredTo: '',                          label: 'Restaurant' },
  'fine-dining':  { subjectNoun: 'restaurant',        tailoredTo: 'fine-dining rooms',         label: 'Fine dining' },
  'casual':       { subjectNoun: 'restaurant',        tailoredTo: 'casual / neighborhood spots', label: 'Casual / neighborhood' },
  'fast-casual':  { subjectNoun: 'fast-casual',       tailoredTo: 'fast-casual restaurants',   label: 'Fast-casual' },
  'bar':          { subjectNoun: 'bar',               tailoredTo: 'bars & cocktail rooms',     label: 'Bar / cocktail' },
  'cafe':         { subjectNoun: 'cafe',              tailoredTo: 'cafes & bakeries',          label: 'Cafe / bakery' },
  'truck':        { subjectNoun: 'food truck',        tailoredTo: 'food trucks & pop-ups',     label: 'Food truck / pop-up' },
};

// Shared dispatch — resolves subtype + personalization fields from a
// form body. Restaurant is the only checklist kind now that wellness
// has been retired; the shape stays 'kind'-keyed in case a second
// vertical returns in the future.
function checklistKind(body) {
  // Restaurant forms historically send `restaurant`; accept either
  // `business` or `restaurant` so a stray field name doesn't blank
  // the personalization.
  const businessField = String(body.restaurant || body.business || '').trim();

  // The site's "Tailor to" pill row rides along via a hidden
  // subtype input. Unknown values fall back to 'all' so a stray
  // subtype doesn't blank the email.
  const rawSubtype = String(body.subtype || 'all').trim();
  const subtype    = RESTAURANT_SUBTYPES[rawSubtype] ? rawSubtype : 'all';
  const voice      = RESTAURANT_SUBTYPES[subtype];

  const titleLead  = 'Your ' + voice.subjectNoun + ' website checklist';

  return {
    kind:          'restaurant',
    subtype,
    subtypeLabel:  voice.label,
    tailoredTo:    voice.tailoredTo,
    titleLead,
    subjectNoun:   voice.subjectNoun,
    businessLabel: 'Restaurant',
    businessField,
    items:         24,
    pageUrl:       'https://muntin.digital/resources/restaurant-website-checklist/',
    pdfUrl:        'https://muntin.digital/resources/restaurant-website-checklist/muntin-restaurant-website-checklist.pdf',
    auditUrl:      'https://muntin.digital/tools/audits/restaurant/',
  };
}

export function checklistNotification(body) {
  const locale = pickLocale(body);
  if (locale === 'es' && typeof ES.checklistNotification === 'function') {
    return ES.checklistNotification(body);
  }
  const email = String(body.email || '—').trim();
  const k     = checklistKind(body);

  // Inbox-preview-friendly subject: subtype label + business.
  // The subtype gives Don a stronger lead signal — a food-truck or
  // bar requester is often a narrower win than a generic one.
  const subtypeTag = k.subtype === 'all' ? 'restaurant' : k.subtypeLabel.toLowerCase();
  const subject = 'Checklist PDF requested (' + subtypeTag + ')' + (k.businessField ? ' — ' + k.businessField : '');

  const html = htmlShell(
    'Restaurant Website Checklist — PDF request',
    [
      field('From',     escapeHtml(email)),
      k.subtype !== 'all' ? field('Subtype', escapeHtml(k.subtypeLabel)) : '',
      k.businessField ? field(k.businessLabel, escapeHtml(k.businessField)) : '',
      '<p style="margin:24px 0 0;font-size:13px;color:#6B6B6B;">Auto-responder with the PDF link already sent to the user. No manual follow-up required unless you want to nurture this lead.</p>',
    ].join('\n')
  );

  const txt = [
    'Restaurant Website Checklist — PDF request',
    '',
    'From: ' + email,
    k.subtype !== 'all' ? 'Subtype: ' + k.subtypeLabel : '',
    k.businessField ? k.businessLabel + ': ' + k.businessField : '',
    '',
    '--',
    'Auto-responder with the PDF link already sent to the user.',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}

export function checklistAutoResponder(body) {
  const locale = pickLocale(body);
  if (locale === 'es' && typeof ES.checklistAutoResponder === 'function') {
    return ES.checklistAutoResponder(body);
  }
  const k = checklistKind(body);
  const biz = k.businessField;

  // Subject personalization: business name if given, subtype noun
  // always ("Your food truck website checklist — Bessie Burger").
  const subject = biz
    ? k.titleLead + ' — ' + biz
    : k.titleLead;

  // Opener: addresses the business by name + explicitly calls out
  // that the PDF is tailored to the subtype when one was picked.
  // When the user left subtype as 'all' we keep the copy neutral so
  // it doesn't sound like we're making something up.
  const tailoredLine = k.tailoredTo
    ? ' tailored for <strong>' + escapeHtml(k.tailoredTo) + '</strong>'
    : '';
  const tailoredLineTxt = k.tailoredTo
    ? ' tailored for ' + k.tailoredTo
    : '';

  const opening = biz
    ? 'Here\'s the PDF for <strong>' + escapeHtml(biz) + '</strong>' + tailoredLine + '. Print it, pin it to the back-office board, or pass it around the team at your next staff meeting — it\'s built to be marked up with a pen.'
    : 'Here\'s your PDF' + tailoredLine + '. Print it, pin it to the back-office board, or pass it around the team at your next staff meeting — it\'s built to be marked up with a pen.';

  const openingTxt = biz
    ? 'Here\'s the PDF for ' + biz + tailoredLineTxt + '. Print it, pin it to the back-office board, or pass it around the team at your next staff meeting — it\'s built to be marked up with a pen.'
    : 'Here\'s your PDF' + tailoredLineTxt + '. Print it, pin it to the back-office board, or pass it around the team at your next staff meeting — it\'s built to be marked up with a pen.';

  const kindsLine = 'restaurant (fine dining, casual, bar, cafe, food truck)';

  const html = htmlShell(
    k.titleLead + (biz ? ' — ' + biz : ''),
    [
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#2A2D33;">' + opening + '</p>',

      // Primary CTA — Outlook-safe bulletproof button.
      primaryCta(k.pdfUrl, 'Download the PDF'),
      '<p style="margin:0 0 22px;font-size:13px;color:#6B6B6B;">Letter-size · ' + k.items + ' checks · opens in your browser.</p>',

      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">If you\'d rather check items off on screen, the interactive version keeps your progress on your device and lets you tailor the checklist to your kind of ' + kindsLine + ' so N/A items drop out of your score:</p>',
      '<p style="margin:0 0 24px;"><a href="' + k.pageUrl + '" style="color:#1F4E5B;font-weight:600;">Open the interactive checklist &rarr;</a></p>',

      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Want a human second opinion after you run it? Reply to this email with your URL and I\'ll take a real look — no list, no drip, no newsletter, just a response from me.</p>',
      // Soft conversion nudge — the bread-and-butter of the studio
      // is custom builds + Care Plans. Putting Calendly here gives
      // the user a clear next move without making the email feel
      // sales-pitchy: it sits AFTER the deliverable + the
      // reply-with-questions invitation.
      '<p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#2A2D33;">Or if you\'d rather have me run the checks for you and write the fix list:</p>',
      secondaryCta('https://calendly.com/dongoldstein-accts/muntinconsult', 'Book a 20-min call'),
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',

      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">— Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital · Silver Spring, MD</span></p>',
    ].join('\n'),
    'You requested the ' + k.subjectNoun + ' website checklist PDF.'
  );

  const txt = [
    openingTxt,
    '',
    'Download the PDF: ' + k.pdfUrl,
    '(Letter-size · ' + k.items + ' checks)',
    '',
    'Or open the interactive version — it keeps your progress on your device and lets you tailor the checklist to your kind of ' + kindsLine + ' so N/A items drop out of your score:',
    k.pageUrl,
    '',
    'Want a human second opinion after you run it? Reply to this email with your URL and I\'ll take a real look — no list, no drip, no newsletter, just a response from me.',
    '',
    'Or if you\'d rather have me run the checks for you and write the fix list, book a 20-min call:',
    'https://calendly.com/dongoldstein-accts/muntinconsult',
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
  const locale = pickLocale(body);
  if (locale === 'es' && typeof ES.auditReportNotification === 'function') {
    return ES.auditReportNotification(body);
  }
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
  const locale = pickLocale(body);
  if (locale === 'es' && typeof ES.auditReportAutoResponder === 'function') {
    return ES.auditReportAutoResponder(body);
  }
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
      shareLink ? '<p style="margin:0 0 10px;font-size:14px;color:#2A2D33;"><strong>Your shareable permalink</strong> — forward to collaborators, bookmark for later, or re-open anytime:</p>' : '',
      shareLink ? primaryCta(shareLink, 'Open the interactive report') : '',
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">The audit tool is a scanner — it\'s good, but it\'s not me. If you want a human second opinion on what to fix first (and what to ignore), reply to this email with any questions or book a free 20-minute call:</p>',
      secondaryCta('https://calendly.com/dongoldstein-accts/muntinconsult', 'Book a 20-min call'),
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6B6B6B;">No marketing list, no drip, no newsletter. I\'ll only email you if you reply to this one.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">— Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital · Silver Spring, MD</span></p>',
    ].filter(Boolean).join('\n'),
    'You requested an email copy of your audit report.'
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
// Phase J3: auditDeepReport templates (notification + auto-reply)
// ------------------------------------------------------------
// Triggered when the client-side deep-gate form (/api/audit-report
// with interest === 'restaurant-audit-deep-report') unlocks the
// full deep-tier report. Same envelope as auditReport but with:
//
//   - subtype-aware intro paragraph (each of the 10 canonical
//     subtypes gets a dedicated opening line via
//     AUDIT_DEEP_REPORT_INTROS below).
//   - a prominent link to the printable permalink (Phase J6
//     encodes the report payload into the URL so the owner can
//     print / save as PDF directly from a browser tab).
//   - longer auto-responder body since the owner traded email
//     for it; we want to earn the conversion with useful content.

const AUDIT_DEEP_REPORT_INTROS = {
  'fine-dining':    'For fine-dining restaurants, the first thing I look for is whether reservations are staying on your own site (Resy, Tock, SevenRooms, or an embedded widget) instead of routing entirely through OpenTable — that\'s where booking margin and first-party customer data live.',
  'casual-dining':  'For casual-dining restaurants, the audit flags whether you\'re capturing BOTH reservations AND direct online ordering. Missing either one sends revenue to OpenTable, DoorDash, or a competitor that has both.',
  'fast-casual':    'For fast-casual restaurants, the audit is almost entirely about direct online ordering. Every order that flows through Toast or ChowNow instead of DoorDash keeps the 20-30% commission in your pocket AND builds a first-party customer list.',
  'cafe':           'For cafes, the audit leans hardest on hours clarity, a tappable phone and map, and a menu that reads cleanly on a phone in sunlight. That\'s ~80% of what your morning traffic actually needs.',
  'bakery':         'For bakeries, the audit\'s biggest signal is whether custom-cake and wedding-cake intake has a home on your site. Those $500-$2000 orders rarely convert through Instagram DMs — a dedicated intake form pays for itself fast.',
  'bar-pub':        'For bars and pubs, the audit looks hardest at event / private-party booking flows, happy-hour visibility, and the cocktail / draft-list rotation cadence. Age-gating and press mentions are trust signals we also flag.',
  'pizzeria':       'For pizzerias, the audit is about direct ordering and delivery-zone clarity. Every Slice / DoorDash / Grubhub pie costs you 20-30% commission; a direct Toast or ChowNow flow cuts that in half and owns the customer.',
  'food-truck':     'For food trucks, the audit prioritizes a visible schedule / today\'s-location page and catering inquiry intake. Instagram drives discovery, but the site\'s job is to convert a curious visitor into a catering booking or a lunch pickup.',
  'ghost-kitchen':  'For ghost kitchens, the audit flags whether aggregator links are prominent and whether the site explicitly states delivery-only so customers don\'t drive to a closed storefront. Clear menu-to-aggregator parity is the hidden conversion lever.',
  'catering-only':  'For catering-only businesses, the audit is about one thing: whether your site converts an event planner into a structured quote request. ezCater, CaterTrax, Tripleseat, or a custom RFQ form - without one, planners comparing vendors leave for a competitor with clearer info.',
  'restaurant':     'This is a restaurant-specific audit — the priority checks below are the ones that actually move customer behavior in our experience of building sites for independent restaurants.'
};

function deepReportIntroFor(subtypeId) {
  if (subtypeId && AUDIT_DEEP_REPORT_INTROS[subtypeId]) {
    return AUDIT_DEEP_REPORT_INTROS[subtypeId];
  }
  return AUDIT_DEEP_REPORT_INTROS.restaurant;
}

export function auditDeepReportNotification(body) {
  const locale = pickLocale(body);
  if (locale === 'es' && typeof ES.auditDeepReportNotification === 'function') {
    return ES.auditDeepReportNotification(body);
  }
  const email       = String(body.email || '—').trim();
  const auditedUrl  = String(body.audited_url || '').trim();
  const overall     = String(body.overall_score || '—').trim();
  const subtype     = String(body.subtype || '').trim();
  const shareLink   = String(body.shareable_link || '').trim();
  const source      = String(body.source || '').trim();
  const hasPdf      = typeof body.pdf_b64 === 'string' && body.pdf_b64.length > 0;

  const subject = 'Audit PDF requested — ' + (prettyUrl(auditedUrl) || email) + ' (' + overall + '/100)';

  const html = htmlShell(
    'Audit PDF requested',
    [
      field('From',    escapeHtml(email)),
      field('Audited', auditedUrl ? '<a href="' + escapeHtml(auditedUrl) + '" style="color:#1F4E5B;">' + escapeHtml(prettyUrl(auditedUrl)) + '</a>' : '—'),
      field('Overall', escapeHtml(overall) + '/100'),
      field('Subtype', escapeHtml(subtype || 'restaurant')),
      source ? field('Source', escapeHtml(source)) : '',
      hasPdf ? field('PDF', 'Attached to this email — same file the user received.') : field('PDF', '<em style="color:#B8541A;">Not attached — client-side PDF build failed, user still got the HTML body.</em>'),
      shareLink ? '<p style="margin:20px 0 0;"><a href="' + escapeHtml(shareLink) + '" style="color:#1F4E5B;font-weight:600;">Open this audit in the tool →</a></p>' : '',
    ].join('\n')
  );

  const txt = [
    'Audit PDF requested',
    '',
    'From: ' + email,
    auditedUrl ? 'Audited: ' + auditedUrl : '',
    'Overall: ' + overall + '/100',
    'Subtype: ' + (subtype || 'restaurant'),
    source ? 'Source: ' + source : '',
    hasPdf ? 'PDF: attached to this email.' : 'PDF: not attached (client build failed).',
    '',
    shareLink ? 'Open in tool: ' + shareLink : '',
  ].filter(Boolean).join('\n');

  return { subject, html, text: txt };
}

export function auditDeepReportAutoResponder(body) {
  const locale = pickLocale(body);
  if (locale === 'es' && typeof ES.auditDeepReportAutoResponder === 'function') {
    return ES.auditDeepReportAutoResponder(body);
  }
  const auditedUrl = String(body.audited_url || '').trim();
  const overall    = String(body.overall_score || '').trim();
  const subtype    = String(body.subtype || '').trim();
  const shareLink  = String(body.shareable_link || '').trim();
  const hasPdf     = typeof body.pdf_b64 === 'string' && body.pdf_b64.length > 0;

  const pretty = prettyUrl(auditedUrl);
  const subject = 'Your restaurant website audit — ' + (pretty || 'Muntin Digital') + (overall ? ' (' + overall + '/100)' : '');

  const intro = deepReportIntroFor(subtype);

  const html = htmlShell(
    'Your restaurant website audit',
    [
      pretty  ? '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">Here\'s your custom audit report for <strong>' + escapeHtml(pretty) + '</strong>. The full PDF is attached to this email — it covers the score, your top three fixes, every restaurant-priority check we ran, and a page of next steps.</p>' : '',
      overall ? '<p style="margin:0 0 20px;padding:20px;background:#F3EEE3;border-radius:12px;text-align:center;"><span style="display:block;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B6B6B;margin-bottom:8px;">Overall score</span><span style="font-size:48px;font-weight:500;color:#1F4E5B;font-family:Georgia,serif;">' + escapeHtml(overall) + '<span style="font-size:22px;color:#6B6B6B;">/100</span></span></p>' : '',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">' + escapeHtml(intro) + '</p>',
      hasPdf
        ? '<p style="margin:0 0 18px;padding:14px 18px;background:#E8F1F3;border-left:4px solid #1F4E5B;border-radius:8px;font-size:15px;line-height:1.55;color:#14161A;"><strong>Your PDF is attached.</strong><br>Save it, forward it to your developer or marketing agency, or print it out to mark up by hand — it\'s built to be used.</p>'
        : '',
      shareLink ? '<p style="margin:0 0 10px;font-size:14px;color:#2A2D33;"><strong>Your shareable permalink</strong> — forward to collaborators, bookmark for later, or re-open anytime:</p>' : '',
      shareLink ? primaryCta(shareLink, 'Open the interactive report') : '',
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A2D33;">If you want a human second opinion on what to fix first, reply to this email with any questions or book a free 20-minute call:</p>',
      secondaryCta('https://calendly.com/dongoldstein-accts/muntinconsult', 'Book a 20-min call'),
      '<div style="height:12px;line-height:12px;">&nbsp;</div>',
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6B6B6B;">No marketing list, no drip, no newsletter. I\'ll only email you if you reply to this one.</p>',
      '<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#2A2D33;">— Don<br><span style="color:#6B6B6B;font-size:13px;">Muntin Digital · Silver Spring, MD</span></p>',
    ].filter(Boolean).join('\n'),
    'You requested the full audit PDF delivered by email.'
  );

  const txt = [
    pretty  ? 'Here\'s your custom audit report for ' + pretty + '. The full PDF is attached.' : 'Here\'s your custom audit report. The full PDF is attached.',
    overall ? 'Overall score: ' + overall + '/100' : '',
    '',
    intro,
    '',
    hasPdf ? 'Your PDF is attached to this email. Save, forward, or print — built to be used.' : '',
    shareLink ? 'Open the interactive report: ' + shareLink : '',
    '',
    'If you want a human second opinion on what to fix first, reply to this email or book a free 20-minute call:',
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
