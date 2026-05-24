#!/usr/bin/env node
// Fixture-based smoke test for the L14 generator.
//
// The generator is the bootcamp's terminal deliverable — every bug in
// it lands on the operator's deployed site. The templates have unit
// tests for individual renderers; this script asserts the whole
// buildBundle() pipeline produces a 7-file site for representative
// operator states (complete, partial, empty) and that the output
// passes a few structural assertions specific bugs have hit:
//
//   • home <title> doesn't duplicate the restaurant name
//   • tel: href is canonical RFC 3966 form (digits + optional +)
//   • Maps href doesn't contain encoded newlines
//   • footer renders as a single inline line
//   • multi-line addresses become <br/>-separated, not raw \n
//   • multi-paragraph customer copy renders as multiple <p>
//   • empty / missing fields don't throw and emit placeholder copy
//
// Runs as a regular script; exits 1 on any failing assertion.
//
//   node scripts/check-l14-generator-output.mjs

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const generatorUrl = pathToFileURL(path.join(repoRoot, 'course/m4-launch/generator/generator.js')).href;

const { buildBundle } = await import(generatorUrl);

const failures = [];
let assertions = 0;

function eq(actual, expected, label) {
  assertions++;
  if (actual !== expected) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function truthy(v, label) {
  assertions++;
  if (!v) failures.push(`${label}: expected truthy, got ${JSON.stringify(v)}`);
}
function falsy(v, label) {
  assertions++;
  if (v) failures.push(`${label}: expected falsy, got ${JSON.stringify(v)}`);
}
function matches(s, re, label) {
  assertions++;
  if (!re.test(s)) failures.push(`${label}: ${re} did not match in ${JSON.stringify(s.slice(0, 120))}…`);
}
function noMatch(s, re, label) {
  assertions++;
  if (re.test(s)) failures.push(`${label}: ${re} unexpectedly matched in ${JSON.stringify(s.slice(0, 200))}…`);
}

const EXPECTED_FILES = ['index.html', 'menu.html', 'about.html', 'contact.html', 'sitemap.xml', 'robots.txt', 'README.md'];

// ---- fixture 1: complete operator ------------------------------------
const complete = {
  restaurantProfile: {
    name: "Jolene's Cafe",
    cuisine: 'Modern American breakfast',
    address: '8245 Georgia Ave\nSilver Spring, MD 20910',
    phone: '+1 (301) 555-0142'
  },
  palette: ['#2A4F3B', '#F5EFE3', '#1A1A1A'],
  onePromise: 'The Saturday-morning breakfast place where your kids can color while you actually read the paper.',
  customerParagraph: 'Carla and Mike, mid-thirties, two kids under seven.\n\nThey care about real eggs and real coffee.',
  dishes: [
    { name: 'Two-egg breakfast', price: '11' },
    { name: 'Avocado toast', price: '10' }
  ],
  hours: {
    monday: { closed: true },
    tuesday: { open: '07:00', close: '14:00' },
    sunday: { open: '08:00', close: '14:00' }
  },
  deployTarget: 'cloudflare'
};

const enBundle = buildBundle(complete, { locale: 'en' });
const esBundle = buildBundle(complete, { locale: 'es' });

eq(Object.keys(enBundle).sort().join(','), EXPECTED_FILES.slice().sort().join(','), 'complete.en: bundle filenames');
eq(Object.keys(esBundle).sort().join(','), EXPECTED_FILES.slice().sort().join(','), 'complete.es: bundle filenames');

// Home title: just the restaurant name, no duplication.
const homeTitle = enBundle['index.html'].match(/<title>([^<]+)<\/title>/)[1];
eq(homeTitle, 'Jolene&#39;s Cafe', 'complete.en: home title is restaurant name only');

// Sub-page titles: "Section · Restaurant Name"
const menuTitle = enBundle['menu.html'].match(/<title>([^<]+)<\/title>/)[1];
eq(menuTitle, 'Menu · Jolene&#39;s Cafe', 'complete.en: menu title has section + name');

const aboutTitleEs = esBundle['about.html'].match(/<title>([^<]+)<\/title>/)[1];
matches(aboutTitleEs, /Jolene/, 'complete.es: about title includes restaurant name');

// tel: href is RFC 3966 canonical (digits + leading +).
const telHref = enBundle['contact.html'].match(/href="(tel:[^"]+)"/)[1];
eq(telHref, 'tel:+13015550142', 'complete.en: tel: href is canonical');

// Maps href: no %0A from raw newlines in the address.
const mapsHref = enBundle['contact.html'].match(/href="(https:\/\/www\.google\.com[^"]+)"/)[1];
noMatch(mapsHref, /%0A/, 'complete.en: Maps href has no encoded newline');
matches(mapsHref, /Georgia%20Ave/, 'complete.en: Maps href URL-encodes address');

// Multi-line address renders with <br/>, not raw \n.
const contactBody = enBundle['contact.html'];
matches(contactBody, /<address[^>]*>[^<]*Georgia Ave<br\/>Silver Spring/, 'complete.en: address has <br/> between lines');
noMatch(contactBody, /Georgia Ave\nSilver/, 'complete.en: no raw \\n inside address');

// Footer renders as one inline line (newlines flattened).
const footerText = contactBody.match(/<footer[^>]*>([^<]+)/)[1];
noMatch(footerText, /\n/, 'complete.en: footer text has no raw newline');
matches(footerText, /Jolene.+8245 Georgia Ave Silver Spring/, 'complete.en: footer inlines address');

// Multi-paragraph customer copy → two <p> tags.
const aboutBody = enBundle['about.html'];
const pCount = (aboutBody.match(/<p>/g) || []).length;
truthy(pCount >= 2, 'complete.en: about body has at least 2 <p> for two-paragraph customer copy');

// Hours table: closed day shows the closed span.
matches(contactBody, /<th[^>]*>Monday<\/th><td><span class="closed">Closed/, 'complete.en: closed day shows Closed span');
// ES locale: closed label is "Cerrado".
matches(esBundle['contact.html'], /Cerrado/, 'complete.es: closed label is Cerrado');

// README: deployTarget=cloudflare filters to Cloudflare-only steps.
const readme = enBundle['README.md'];
matches(readme, /## Cloudflare Pages/, 'complete.en: README has Cloudflare section');
noMatch(readme, /## Netlify/, 'complete.en: README skips Netlify when deployTarget=cloudflare');
noMatch(readme, /## Vercel/, 'complete.en: README skips Vercel when deployTarget=cloudflare');

// Menu prices are normalized to $-prefix.
matches(enBundle['menu.html'], /\$11/, 'complete.en: menu price has $ prefix');
matches(enBundle['menu.html'], /Avocado toast/, 'complete.en: menu shows second dish');

// Sitemap lists all 4 HTML pages.
const sitemap = enBundle['sitemap.xml'];
matches(sitemap, /<loc>index\.html<\/loc>/, 'complete.en: sitemap lists index.html');
matches(sitemap, /<loc>menu\.html<\/loc>/, 'complete.en: sitemap lists menu.html');
matches(sitemap, /<loc>about\.html<\/loc>/, 'complete.en: sitemap lists about.html');
matches(sitemap, /<loc>contact\.html<\/loc>/, 'complete.en: sitemap lists contact.html');

// Robots references the sitemap.
matches(enBundle['robots.txt'], /Sitemap: sitemap\.xml/, 'complete.en: robots references sitemap');

// ---- fixture 2: partial operator (no phone, no hours, no customer) ---
const partial = {
  restaurantProfile: { name: 'Test Diner', cuisine: 'American' },
  palette: ['#1F4E5B', '#FAF7F2', '#14161A'],
  onePromise: 'A test diner.',
  dishes: [{ name: 'Pancakes', price: '7' }]
};

const partialBundle = buildBundle(partial, { locale: 'en' });
eq(Object.keys(partialBundle).length, EXPECTED_FILES.length, 'partial: still produces all 7 files');

// Missing phone → placeholder.
const partialContact = partialBundle['contact.html'];
matches(partialContact, /Add your phone in Lesson 10/, 'partial: phone shows placeholder');
matches(partialContact, /Set your hours in Lesson 10/, 'partial: hours show placeholder');

// Missing customer paragraph → about page falls back to placeholder.
const partialAbout = partialBundle['about.html'];
matches(partialAbout, /<em>/, 'partial: about uses em for missing customer paragraph');

// Missing deployTarget → README shows all three hosts.
const partialReadme = partialBundle['README.md'];
matches(partialReadme, /## Cloudflare Pages/, 'partial: README shows Cloudflare');
matches(partialReadme, /## Netlify/, 'partial: README shows Netlify');
matches(partialReadme, /## Vercel/, 'partial: README shows Vercel');

// ---- fixture 3: empty operator (nothing filled) ----------------------
// The readiness checklist won't enable the button for this case, but if
// somebody enables the button via devtools the templates still need to
// not throw and emit something sensible.
let emptyBundle;
try {
  emptyBundle = buildBundle({}, { locale: 'en' });
  truthy(emptyBundle && emptyBundle['index.html'], 'empty: buildBundle({}) returns a bundle');
} catch (err) {
  failures.push(`empty: buildBundle({}) threw — ${err.message}`);
}

if (emptyBundle) {
  // Empty home should still produce valid HTML.
  matches(emptyBundle['index.html'], /<!doctype html>/, 'empty: home is valid HTML');
  // Empty menu shows "menu coming soon" placeholder.
  matches(emptyBundle['menu.html'], /Menu coming soon|Menú próximamente/, 'empty: menu shows coming-soon placeholder');
  // Empty contact has placeholders.
  matches(emptyBundle['contact.html'], /Add your address in Lesson 1/, 'empty: contact has address placeholder');
}

// ---- fixture 4: ES locale completeness -------------------------------
const esEmpty = buildBundle({}, { locale: 'es' });
matches(esEmpty['menu.html'], /Menú próximamente/, 'es-empty: menu placeholder is Spanish');
matches(esEmpty['contact.html'], /Agrega tu dirección en la Lección 1/, 'es-empty: contact address placeholder is Spanish');
matches(esEmpty['contact.html'], /Marca tus horarios en la Lección 10/, 'es-empty: hours-missing placeholder is Spanish');

// ---- fixture 5: edge cases ------------------------------------------
// safePrice strips internal whitespace.
const wsBundle = buildBundle({
  restaurantProfile: { name: 'X' },
  palette: ['#1F4E5B', '#FAF7F2', '#14161A'],
  dishes: [{ name: 'Item', price: '$ 12' }]
}, { locale: 'en' });
matches(wsBundle['menu.html'], /\$12(?!\d)/, 'edge: safePrice strips "$ 12" to "$12"');

// README mdSafe strips backticks from restaurant name.
const mdBundle = buildBundle({
  restaurantProfile: { name: 'Joe`s [Bad]` Café' }
}, { locale: 'en' });
const mdReadme = mdBundle['README.md'];
noMatch(mdReadme.split('\n')[0], /[`\[\]]/, 'edge: README first line has no markdown-active chars from name');

// ---- report ---------------------------------------------------------
console.log(`\n[l14-generator-output] Ran ${assertions} assertion(s) across 5 fixture(s).`);

if (failures.length) {
  console.log(`\n[l14-generator-output] FAIL — ${failures.length} assertion(s) failed:`);
  for (const f of failures) console.log(`  • ${f}`);
  process.exit(1);
}

console.log('[l14-generator-output] OK — all assertions passed.');
process.exit(0);
