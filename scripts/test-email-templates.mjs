#!/usr/bin/env node
// D9: email template regression test (EN).
// Run via: `node scripts/test-email-templates.mjs`
//
// Covers: the six exported template functions return the expected
// { subject, html, text } shape, the shared htmlShell renders
// viewport + visible brand marker, notifications don't leak the
// "you received this because" user-footer copy, user-facing
// auto-responders DO, the primaryCta / secondaryCta helpers
// produce bulletproof table-wrapped anchors, and inputs are
// HTML-escaped into subjects + bodies.
//
// No test coverage existed for the email templates prior to this
// sprint, so these golden-path + XSS assertions are gap coverage
// alongside the D9 refactor. D10 will mirror to ES with its own
// suite.

import {
  intakeNotification,
  intakeAutoResponder,
  checklistNotification,
  checklistAutoResponder,
  auditReportNotification,
  auditReportAutoResponder,
  auditDeepReportNotification,
  auditDeepReportAutoResponder,
  primaryCta,
  secondaryCta,
} from '../src/lib/templates.js';

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// Every template must return this shape.
function assertShape(label, out) {
  assert(label + ': has subject', out && typeof out.subject === 'string' && out.subject.length > 0);
  assert(label + ': has html',    out && typeof out.html    === 'string' && out.html.length    > 0);
  assert(label + ': has text',    out && typeof out.text    === 'string' && out.text.length    > 0);
}

// HTML shell invariants shared by all six templates.
function assertShellInvariants(label, html) {
  assert(label + ': doctype',              html.toLowerCase().startsWith('<!doctype html>'));
  assert(label + ': viewport meta',        html.indexOf('name="viewport"') !== -1);
  assert(label + ': charset meta',         html.indexOf('charset="utf-8"') !== -1);
  assert(label + ': apple-disable-reformatting', html.indexOf('x-apple-disable-message-reformatting') !== -1);
  assert(label + ': Muntin eyebrow',       html.indexOf('Muntin Digital') !== -1);
  assert(label + ': footer link to site',  html.indexOf('href="https://muntin.digital/"') !== -1);
}

// --- CTA helpers produce bulletproof markup ------------------------
{
  const pri = primaryCta('https://example.com/x', 'Click me');
  assert('primaryCta: wraps in table',        pri.startsWith('<table'));
  assert('primaryCta: includes anchor',       pri.indexOf('<a href="https://example.com/x"') !== -1);
  assert('primaryCta: includes label',        pri.indexOf('Click me') !== -1);
  assert('primaryCta: pill border-radius',    pri.indexOf('border-radius:999px') !== -1);
  assert('primaryCta: teal background',       pri.indexOf('#1F4E5B') !== -1);
  assert('primaryCta: trailing arrow',        pri.indexOf('&rarr;') !== -1);

  const sec = secondaryCta('https://example.com/y', 'Maybe');
  assert('secondaryCta: wraps in table',      sec.startsWith('<table'));
  assert('secondaryCta: cream background',    sec.indexOf('bgcolor="#FAF7F2"') !== -1);
  assert('secondaryCta: teal border',         sec.indexOf('border:1px solid #1F4E5B') !== -1);
  assert('secondaryCta: teal text',           sec.indexOf('color:#1F4E5B') !== -1);
}

// --- CTA HTML-escapes its inputs -----------------------------------
{
  const pri = primaryCta('https://example.com/?q=<script>', '<b>xss</b>');
  assert('primaryCta: escapes url',   pri.indexOf('<script>') === -1,   'got: ' + pri);
  assert('primaryCta: escapes label', pri.indexOf('<b>xss</b>') === -1, 'got: ' + pri);
  assert('primaryCta: keeps entity-encoded label',
    pri.indexOf('&lt;b&gt;xss&lt;/b&gt;') !== -1);
}

// --- 1. intakeNotification (to Don) --------------------------------
{
  const out = intakeNotification({
    name: 'Ada Lovelace', email: 'ada@example.com',
    business: 'Lovelace Cafe', website: 'https://lovelacecafe.example',
    services: 'Website + Care Plan', goals: 'Open a new location',
  });
  assertShape('intakeNotification', out);
  assertShellInvariants('intakeNotification', out.html);
  assert('intakeNotification: subject mentions name',     out.subject.indexOf('Ada Lovelace') !== -1);
  assert('intakeNotification: subject mentions business', out.subject.indexOf('Lovelace Cafe') !== -1);
  assert('intakeNotification: html includes email',       out.html.indexOf('ada@example.com') !== -1);
  // Notifications to Don don't carry the "you received this because" footer.
  assert('intakeNotification: NO received-because copy',
    out.html.indexOf('You submitted') === -1 && out.html.indexOf('You requested') === -1);
}

// --- 2. intakeAutoResponder (to user) ------------------------------
{
  const out = intakeAutoResponder({ name: 'Ada Lovelace', email: 'ada@example.com' });
  assertShape('intakeAutoResponder', out);
  assertShellInvariants('intakeAutoResponder', out.html);
  assert('intakeAutoResponder: subject says "Got your note"',
    out.subject.indexOf('Got your note') !== -1);
  assert('intakeAutoResponder: greets by first name only',
    out.html.indexOf('Hi Ada,') !== -1);
  assert('intakeAutoResponder: receive-because copy in footer',
    out.html.indexOf('You submitted the contact form') !== -1);
}

// --- 3. checklistNotification -------------------------------------
{
  const out = checklistNotification({
    email: 'chef@example.com', restaurant: 'Chef de Mer', subtype: 'fine-dining',
  });
  assertShape('checklistNotification', out);
  assertShellInvariants('checklistNotification', out.html);
  assert('checklistNotification: subject has subtype tag',
    out.subject.indexOf('(fine dining)') !== -1);
  assert('checklistNotification: subject has business',
    out.subject.indexOf('Chef de Mer') !== -1);
  assert('checklistNotification: NO received-because footer',
    out.html.indexOf('You requested') === -1);
}

// --- 4. checklistAutoResponder ------------------------------------
{
  const out = checklistAutoResponder({
    email: 'chef@example.com', restaurant: 'Chef de Mer', subtype: 'fine-dining',
  });
  assertShape('checklistAutoResponder', out);
  assertShellInvariants('checklistAutoResponder', out.html);
  assert('checklistAutoResponder: subject includes business',
    out.subject.indexOf('Chef de Mer') !== -1);
  assert('checklistAutoResponder: primaryCta present',
    out.html.indexOf('Download the PDF') !== -1 && out.html.indexOf('<table') !== -1);
  assert('checklistAutoResponder: Calendly CTA via secondary helper',
    out.html.indexOf('calendly.com/dongoldstein-accts/muntinconsult') !== -1);
  assert('checklistAutoResponder: received-because footer present',
    out.html.indexOf('You requested the') !== -1 && out.html.indexOf('checklist PDF') !== -1);
}

// --- 5. auditReportNotification -----------------------------------
{
  const out = auditReportNotification({
    email: 'owner@example.com',
    audited_url: 'https://pizzajoint.example/',
    overall_score: '78',
    restaurant_readiness: '82',
    shareable_link: 'https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK',
    summary: 'Solid footing.',
  });
  assertShape('auditReportNotification', out);
  assertShellInvariants('auditReportNotification', out.html);
  assert('auditReportNotification: subject carries score',
    out.subject.indexOf('78/100') !== -1);
  assert('auditReportNotification: html includes share link',
    out.html.indexOf('?s=ABCDEFGHJK') !== -1);
  assert('auditReportNotification: NO received-because footer',
    out.html.indexOf('You requested an email copy') === -1);
}

// --- 6. auditReportAutoResponder ----------------------------------
{
  const out = auditReportAutoResponder({
    audited_url: 'https://pizzajoint.example/',
    overall_score: '78',
    summary: 'Solid footing.',
    shareable_link: 'https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK',
  });
  assertShape('auditReportAutoResponder', out);
  assertShellInvariants('auditReportAutoResponder', out.html);
  assert('auditReportAutoResponder: score card present',
    out.html.indexOf('Overall score') !== -1 && out.html.indexOf('78') !== -1);
  assert('auditReportAutoResponder: shareable permalink heading',
    out.html.indexOf('Your shareable permalink') !== -1);
  assert('auditReportAutoResponder: primaryCta routes to share link',
    out.html.indexOf('href="https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK"') !== -1);
  assert('auditReportAutoResponder: received-because footer present',
    out.html.indexOf('You requested an email copy of your audit report') !== -1);
}

// --- 7. auditDeepReportNotification -------------------------------
{
  const out = auditDeepReportNotification({
    email: 'owner@example.com',
    audited_url: 'https://pizzajoint.example/',
    overall_score: '78',
    subtype: 'casual-dining',
    pdf_b64: 'abc', // any truthy string signals attached-PDF branch
  });
  assertShape('auditDeepReportNotification', out);
  assertShellInvariants('auditDeepReportNotification', out.html);
  assert('auditDeepReportNotification: subject mentions PDF request',
    out.subject.indexOf('Audit PDF requested') !== -1);
  assert('auditDeepReportNotification: reports attached PDF status',
    out.html.indexOf('Attached to this email') !== -1);
}

// --- 8. auditDeepReportAutoResponder ------------------------------
{
  const out = auditDeepReportAutoResponder({
    audited_url: 'https://pizzajoint.example/',
    overall_score: '78',
    subtype: 'casual-dining',
    shareable_link: 'https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK',
    pdf_b64: 'abc',
  });
  assertShape('auditDeepReportAutoResponder', out);
  assertShellInvariants('auditDeepReportAutoResponder', out.html);
  assert('auditDeepReportAutoResponder: subtype-specific intro',
    out.html.indexOf('casual-dining') !== -1 || out.html.indexOf('casual dining') !== -1
      || out.html.indexOf('reservations AND direct online ordering') !== -1,
    'subtype intro not detected');
  assert('auditDeepReportAutoResponder: permalink heading',
    out.html.indexOf('Your shareable permalink') !== -1);
  assert('auditDeepReportAutoResponder: primaryCta routes to share link',
    out.html.indexOf('href="https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK"') !== -1);
  assert('auditDeepReportAutoResponder: received-because footer present',
    out.html.indexOf('You requested the full audit PDF') !== -1);
  assert('auditDeepReportAutoResponder: no-drip reassurance',
    out.html.indexOf('No marketing list') !== -1);
}

// --- XSS: adversarial business name is HTML-escaped everywhere ----
{
  const xss = intakeNotification({
    name: '<script>alert(1)</script>',
    email: 'x@example.com',
    business: '" onload="alert(1)',
    services: '—',
    goals: '<img src=x onerror=alert(1)>',
  });
  // Subject is plain-text so raw chars are fine there; HTML body must escape.
  assert('XSS: no raw <script> tag in html',   xss.html.indexOf('<script>alert(1)</script>') === -1);
  assert('XSS: no raw <img tag in html',       xss.html.indexOf('<img src=x') === -1);
  assert('XSS: entity-encoded script tag',     xss.html.indexOf('&lt;script&gt;alert(1)&lt;/script&gt;') !== -1);
  assert('XSS: entity-encoded img tag',        xss.html.indexOf('&lt;img src=x onerror=alert(1)&gt;') !== -1);
}

// --- D10: Spanish locale dispatch ----------------------------------
// Every template in templates.js accepts body.locale === 'es' and
// routes to the matching function in templates.es.js. These
// assertions verify the dispatch AND that the ES template picks up
// the same D9 shell improvements (viewport meta, brand eyebrow,
// receivedBecause footer, primaryCta/secondaryCta helpers).
{
  const out = intakeAutoResponder({ name: 'Ada Lovelace', email: 'a@b.com', locale: 'es' });
  assertShape('ES intakeAutoResponder', out);
  // lang attribute ES-specific.
  assert('ES intakeAutoResponder: html lang="es"',
    out.html.indexOf('lang="es"') !== -1);
  // Same shell invariants (viewport, charset, eyebrow) — ES inherits.
  assert('ES intakeAutoResponder: viewport meta',
    out.html.indexOf('name="viewport"') !== -1);
  assert('ES intakeAutoResponder: brand eyebrow',
    out.html.indexOf('Muntin Digital') !== -1);
  // ES-specific copy.
  assert('ES intakeAutoResponder: Spanish subject',
    out.subject.indexOf('Recibí tu mensaje') !== -1 || out.subject.indexOf('Recibí tu mensaje') !== -1);
  assert('ES intakeAutoResponder: ES received-because footer',
    out.html.indexOf('Enviaste el formulario de contacto') !== -1);
}
{
  const out = checklistAutoResponder({
    email: 'a@b.com', restaurant: 'Chef de Mer', subtype: 'fine-dining', locale: 'es',
  });
  assertShape('ES checklistAutoResponder', out);
  assert('ES checklistAutoResponder: primaryCta label ES',
    out.html.indexOf('Descargar el PDF') !== -1);
  assert('ES checklistAutoResponder: secondaryCta label ES',
    out.html.indexOf('Agenda una llamada de 20 min') !== -1);
  assert('ES checklistAutoResponder: ES received-because footer',
    out.html.indexOf('Solicitaste el PDF del checklist') !== -1);
}
{
  const out = auditReportAutoResponder({
    audited_url: 'https://pizzajoint.example/',
    overall_score: '78',
    shareable_link: 'https://muntin.digital/es/tools/audits/restaurant/?s=ABCDEFGHJK',
    locale: 'es',
  });
  assertShape('ES auditReportAutoResponder', out);
  assert('ES auditReportAutoResponder: Spanish permalink heading',
    out.html.indexOf('Tu enlace permanente para compartir') !== -1);
  assert('ES auditReportAutoResponder: primaryCta label ES',
    out.html.indexOf('Abrir el informe interactivo') !== -1);
  assert('ES auditReportAutoResponder: ES received-because footer',
    out.html.indexOf('Solicitaste una copia por correo') !== -1);
}
{
  const out = auditDeepReportAutoResponder({
    audited_url: 'https://pizzajoint.example/',
    overall_score: '78',
    subtype: 'casual-dining',
    shareable_link: 'https://muntin.digital/es/tools/audits/restaurant/?s=ABCDEFGHJK',
    pdf_b64: 'abc',
    locale: 'es',
  });
  assertShape('ES auditDeepReportAutoResponder', out);
  assert('ES auditDeepReportAutoResponder: Spanish permalink heading',
    out.html.indexOf('Tu enlace permanente para compartir') !== -1);
  assert('ES auditDeepReportAutoResponder: ES received-because footer',
    out.html.indexOf('Solicitaste el PDF completo') !== -1);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll email-template tests passed.');
