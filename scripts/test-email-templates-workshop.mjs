#!/usr/bin/env node
// Phase 1 + 3 + 4 — Workshop email-template regression test.
//
// Covers: the three Workshop-side templates return { subject, html,
// text }, locale dispatch hits the ES variant when locale='es', the
// destructive copy in accountDeleteEmail explicitly says "permanent"
// (legal/UX requirement), and watchDiffEmail subjects carry enough
// signal that an inbox preview is decision-ready (kind + direction
// + magnitude + title).

import {
  magicLinkEmail,
  accountDeleteEmail,
  watchDiffEmail,
} from '../src/lib/templates.js';

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertShape(label, out) {
  assert(label + ': returns object', typeof out === 'object' && out !== null);
  assert(label + ': has subject string',
    typeof out.subject === 'string' && out.subject.length > 0);
  assert(label + ': has html string',
    typeof out.html === 'string' && out.html.length > 0);
  assert(label + ': has text string',
    typeof out.text === 'string' && out.text.length > 0);
}

// ---------- magicLinkEmail ----------
{
  const out = magicLinkEmail({
    email: 'don@muntin.digital',
    link: 'https://muntin.digital/api/auth/verify?token=ABCDEF1234&returnTo=%2Fworkbench%2F',
    returnTo: '/workbench/',
    locale: 'en',
  });
  assertShape('EN magicLinkEmail', out);
  assert('EN magicLinkEmail: subject names the surface',
    out.subject.indexOf('Muntin Workshop') !== -1);
  assert('EN magicLinkEmail: html contains the verify link',
    out.html.indexOf('/api/auth/verify') !== -1);
  assert('EN magicLinkEmail: copy says "15 minutes"',
    out.html.indexOf('15 minutes') !== -1);
  assert('EN magicLinkEmail: signed by Don',
    out.html.indexOf('— Don') !== -1);
}
{
  const out = magicLinkEmail({
    email: 'don@muntin.digital',
    link: 'https://muntin.digital/api/auth/verify?token=ABCDEF1234&returnTo=%2Fes%2Fworkbench%2F',
    returnTo: '/es/workbench/',
    locale: 'es',
  });
  assertShape('ES magicLinkEmail', out);
  assert('ES magicLinkEmail: Spanish subject',
    out.subject.indexOf('Taller de Muntin') !== -1);
  assert('ES magicLinkEmail: ES copy says "15 minutos"',
    out.html.indexOf('15 minutos') !== -1);
}

// ---------- accountDeleteEmail ----------
{
  const out = accountDeleteEmail({
    email: 'don@muntin.digital',
    link: 'https://muntin.digital/api/auth/account-delete-confirm?token=ABCDEF1234',
    locale: 'en',
  });
  assertShape('EN accountDeleteEmail', out);
  assert('EN accountDeleteEmail: subject says Confirm + delete',
    out.subject.toLowerCase().indexOf('confirm') !== -1 &&
    out.subject.toLowerCase().indexOf('delete') !== -1);
  assert('EN accountDeleteEmail: html explicitly says "permanent"',
    out.html.toLowerCase().indexOf('permanent') !== -1);
  assert('EN accountDeleteEmail: html shows the email being deleted',
    out.html.indexOf('don@muntin.digital') !== -1);
  assert('EN accountDeleteEmail: html contains the confirm link',
    out.html.indexOf('/api/auth/account-delete-confirm') !== -1);
  assert('EN accountDeleteEmail: explicit "no undo" framing',
    out.html.toLowerCase().indexOf('no undo') !== -1);
  assert('EN accountDeleteEmail: ignore-if-not-you instruction',
    out.html.toLowerCase().indexOf('ignore') !== -1);
}
{
  const out = accountDeleteEmail({
    email: 'don@muntin.digital',
    link: 'https://muntin.digital/api/auth/account-delete-confirm?token=ABCDEF1234',
    locale: 'es',
  });
  assertShape('ES accountDeleteEmail', out);
  assert('ES accountDeleteEmail: Spanish subject',
    out.subject.toLowerCase().indexOf('elimina') !== -1);
  assert('ES accountDeleteEmail: html says "permanente"',
    out.html.toLowerCase().indexOf('permanente') !== -1);
  assert('ES accountDeleteEmail: ES no-undo framing',
    out.html.toLowerCase().indexOf('no hay deshacer') !== -1);
}

// ---------- watchDiffEmail ----------
{
  const out = watchDiffEmail({
    locale: 'en',
    kindLabel: 'Speed test',
    title: 'pizzajoint.example',
    oldScore: 82,
    newScore: 76,
    link: 'https://muntin.digital/tools/speed-test/?saved=ABCDEFGHJK',
    watchUrl: 'https://muntin.digital/workbench/',
  });
  assertShape('EN watchDiffEmail (drop)', out);
  assert('EN watchDiffEmail: subject names kind + direction + magnitude',
    out.subject.indexOf('Speed test') !== -1 &&
    out.subject.indexOf('dropped') !== -1 &&
    out.subject.indexOf('6 pts') !== -1);
  assert('EN watchDiffEmail: subject includes the title',
    out.subject.indexOf('pizzajoint.example') !== -1);
  assert('EN watchDiffEmail: html shows old AND new score',
    out.html.indexOf('82') !== -1 && out.html.indexOf('76') !== -1);
  assert('EN watchDiffEmail: html contains the deep link',
    out.html.indexOf('/tools/speed-test/?saved=') !== -1);
  assert('EN watchDiffEmail: html links to manage watches',
    out.html.indexOf('/workbench/') !== -1);
}
{
  const out = watchDiffEmail({
    locale: 'en',
    kindLabel: 'SEO check',
    title: 'pizzajoint.example',
    oldScore: 60,
    newScore: 72,
  });
  assert('EN watchDiffEmail (improve): subject says "improved"',
    out.subject.indexOf('improved') !== -1);
}
{
  const out = watchDiffEmail({
    locale: 'es',
    kindLabel: 'Prueba de velocidad',
    title: 'pizzajoint.example',
    oldScore: 82,
    newScore: 76,
    link: 'https://muntin.digital/es/tools/speed-test/?saved=ABCDEFGHJK',
    watchUrl: 'https://muntin.digital/es/workbench/',
  });
  assertShape('ES watchDiffEmail (drop)', out);
  assert('ES watchDiffEmail: Spanish "bajó" in subject',
    out.subject.indexOf('bajó') !== -1);
  assert('ES watchDiffEmail: html links to ES /workbench/',
    out.html.indexOf('/es/workbench/') !== -1);
}
{
  const out = watchDiffEmail({
    locale: 'en',
    kindLabel: 'Schema check',
    title: 'pizzajoint.example',
    oldScore: null,
    newScore: 100,
  });
  assert('EN watchDiffEmail (state-only, missing oldScore): subject says "changed"',
    out.subject.indexOf('changed') !== -1);
}

if (failures === 0) {
  console.log('\n✓ all workshop email-template assertions pass');
  process.exit(0);
} else {
  console.error('\n✗ ' + failures + ' assertion(s) failed');
  process.exit(1);
}
