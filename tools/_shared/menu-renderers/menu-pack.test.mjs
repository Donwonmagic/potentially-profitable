/**
 * Unit tests — tools/_shared/menu-renderers/menu-pack.js
 * Run via:  node --test tools/_shared/menu-renderers/menu-pack.test.mjs
 *
 * Coverage focus: README authoring (EN + ES), mailto template,
 * manifest shape, v3 → row-stream conversion, end-to-end pack
 * assembly using mocked emitters + JSZip.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SCHEMA = require('../menu-schema.js');
const PACK = require('./menu-pack.js');

function seed() {
  return SCHEMA.migrate({
    rows: [
      { kind: 'section', name: 'Antipasti' },
      { kind: 'dish', name: 'Bruschetta', price: '8',  desc: 'house bread', allergens: ['DF'] },
      { kind: 'section', name: 'Pasta' },
      { kind: 'dish', name: 'Carbonara',  price: '18', allergens: ['E', 'GF'] }
    ],
    theme: 'trattoria',
    meta: { businessName: 'Da Marco', cuisine: 'italian', locale: 'en' }
  });
}

// ============== README ==============
test('buildReadmeEN includes printer + web dev + staff sections', () => {
  const md = PACK._buildReadmeEN({
    businessName: 'Da Marco',
    includePdf: true, includeQr: true, includeJsonld: true,
    includeText: true, includeMarkdown: true, includeMailto: true
  });
  assert.match(md, /^# Menu pack — Da Marco/m);
  assert.match(md, /## For your print shop/);
  assert.match(md, /## For your web developer/);
  assert.match(md, /## For your staff/);
  assert.match(md, /CMYK/);
  assert.match(md, /3 mm bleed/);
  assert.match(md, /schema\.org\/Menu/);
});

test('buildReadmeES mirrors structure in Spanish', () => {
  const md = PACK._buildReadmeES({
    businessName: 'Da Marco',
    includePdf: true, includeQr: true, includeText: true, includeMailto: true
  });
  assert.match(md, /^# Pack del menú — Da Marco/m);
  assert.match(md, /## Para tu imprenta/);
  assert.match(md, /## Para tu encargado de sitio web/);
  assert.match(md, /## Para el staff/);
  assert.match(md, /CMYK/);
});

test('buildReadmeEN handles missing PDF gracefully (no broken instructions)', () => {
  const md = PACK._buildReadmeEN({
    businessName: 'X',
    includePdf: false, includeQr: true, includeText: true
  });
  assert.match(md, /No print PDF was included/);
});

test('buildReadmeEN omits the JSON-LD paragraph when not included', () => {
  const md = PACK._buildReadmeEN({
    businessName: 'X', includePdf: true, includeQr: true,
    includeJsonld: false, includeText: true, includeMailto: true
  });
  // The "If your CMS only takes a JSON-LD snippet" paragraph is
  // gated on includeJsonld.
  assert.doesNotMatch(md, /If your CMS only takes a JSON-LD snippet/);
});

// ============== Mailto ==============
test('buildMailtoEN produces a complete printer-ready email', () => {
  const txt = PACK._buildMailtoEN({
    businessName: 'Da Marco',
    pdfName: 'da-marco.pdf',
    paperLabel: 'Letter (8.5 × 11 in)',
    pageCount: 4
  });
  assert.match(txt, /^Subject: Menu print job for Da Marco/m);
  assert.match(txt, /File:\s+da-marco\.pdf/);
  assert.match(txt, /Paper:\s+Letter/);
  assert.match(txt, /Page count:\s+4/);
  assert.match(txt, /Bleed:\s+3 mm/);
  assert.match(txt, /CMYK/);
});

test('buildMailtoES translates printer-ready email correctly', () => {
  const txt = PACK._buildMailtoES({
    businessName: 'Da Marco',
    pdfName: 'da-marco.pdf',
    paperLabel: 'Carta',
    pageCount: 4
  });
  assert.match(txt, /^Asunto: Trabajo de impresión de menú para Da Marco/m);
  assert.match(txt, /Archivo:\s+da-marco\.pdf/);
  assert.match(txt, /Páginas:\s+4/);
});

// ============== Manifest ==============
test('buildManifest captures business + menu + theme + file index', () => {
  const m = PACK._buildManifest({
    businessName: 'Da Marco',
    cuisine: 'italian',
    locale: 'en',
    sectionCount: 2,
    dishCount: 4,
    allergenRegime: 'us-fda9',
    themeId: 'trattoria',
    paperKey: 'letter'
  }, [{ name: 'README.md', kind: 'guide' }, { name: 'menu.pdf', kind: 'pdf' }]);
  assert.equal(m.v, 1);
  assert.equal(m.business.name, 'Da Marco');
  assert.equal(m.menu.dishes, 4);
  assert.equal(m.menu.allergenRegime, 'us-fda9');
  assert.equal(m.theme.id, 'trattoria');
  assert.equal(m.files.length, 2);
});

// ============== v3 → row-stream ==============
test('_menuToRows emits sections + dishes in position order', () => {
  const m = seed();
  const rows = PACK._menuToRows(m);
  assert.equal(rows[0].kind, 'section');
  assert.equal(rows[0].name, 'Antipasti');
  assert.equal(rows[1].kind, 'dish');
  assert.equal(rows[1].name, 'Bruschetta');
  assert.deepEqual(rows[1].allergens, ['DF']);
  // Pasta section + dish
  const pastaIdx = rows.findIndex(r => r.kind === 'section' && r.name === 'Pasta');
  assert.ok(pastaIdx > 0);
  assert.equal(rows[pastaIdx + 1].name, 'Carbonara');
});

test('_makeSlug normalizes business names', () => {
  assert.equal(PACK._makeSlug("Joe's Taqueria & Cantina"), 'joe-s-taqueria-cantina');
  assert.equal(PACK._makeSlug(''), 'menu');
  assert.equal(PACK._makeSlug(null), 'menu');
});

// ============== End-to-end pack assembly with mocks ==============
test('exportPack assembles a ZIP via mocked JSZip + mocked emitters', async () => {
  // Minimal JSZip mock: collects file calls into a map; generateAsync
  // returns a synthetic Blob whose body is the JSON-serialized map.
  function makeMockJSZip() {
    const filesIn = {};
    return {
      file: function (name, body) { filesIn[name] = body; return this; },
      generateAsync: function () {
        // Return a "blob" that's just the file index for assertion.
        return Promise.resolve({ __mockFiles: Object.keys(filesIn).slice(),
                                 __mockFileBodies: filesIn });
      }
    };
  }
  const JSZipMock = function () { return makeMockJSZip(); };

  const calls = { pdf: 0, qr: 0, text: 0, md: 0, ld: 0 };
  const blob = await PACK.exportPack({
    canonicalMenu: seed(),
    locale: 'en',
    businessName: 'Da Marco',
    paperLabel: 'Letter (8.5 × 11 in)',
    pageCount: 4,
    loadJSZip: () => Promise.resolve(JSZipMock),
    exportText: (o) => { calls.text++; return 'TEXT BODY ' + o.title; },
    exportMd:   (o) => { calls.md++;   return 'MD BODY ' + o.title; },
    emitJsonld: (m, o) => { calls.ld++; return JSON.stringify({ '@type': 'Menu', name: m.meta.businessName }); }
    // No exportPdf / exportQrZip → pack ships without them; README
    // declares "no PDF was included".
  });

  assert.equal(calls.text, 1);
  assert.equal(calls.md, 1);
  assert.equal(calls.ld, 1);
  assert.ok(blob.__mockFiles.includes('README.md'));
  assert.ok(blob.__mockFiles.includes('mailto-printer.txt'));
  assert.ok(blob.__mockFiles.includes('menu.txt'));
  assert.ok(blob.__mockFiles.includes('menu.md'));
  assert.ok(blob.__mockFiles.includes('menu.jsonld'));
  assert.ok(blob.__mockFiles.includes('manifest.json'));
  // Manifest carries dish count.
  const manifest = JSON.parse(blob.__mockFileBodies['manifest.json']);
  assert.equal(manifest.menu.dishes, 2);
  assert.equal(manifest.business.name, 'Da Marco');
});

test('exportPack rejects when canonicalMenu is missing', async () => {
  await assert.rejects(
    PACK.exportPack({ loadJSZip: () => Promise.resolve(function () { return {}; }) }),
    /canonicalMenu required/
  );
});

test('exportPack rejects when no JSZip loader is available', async () => {
  await assert.rejects(
    PACK.exportPack({ canonicalMenu: seed() }),
    /no JSZip loader/
  );
});

test('exportPack pulls disclaimer from canonical menu meta into PDF/HTML opts', async () => {
  const menu = seed();
  menu.meta.disclaimer = 'Please inform your server of any allergies.';

  let pdfOptsSeen = null;
  let htmlOptsSeen = null;
  const JSZipMock = function () {
    return {
      file: () => {},
      generateAsync: () => Promise.resolve({})
    };
  };
  await PACK.exportPack({
    canonicalMenu: menu,
    locale: 'en',
    businessName: 'X',
    loadJSZip: () => Promise.resolve(JSZipMock),
    exportPdf: (opts) => { pdfOptsSeen = opts; return Promise.resolve(null); },
    // No QR (skip the inner-zip extraction path)
    exportText: () => '',
    exportMd: () => '',
    emitJsonld: () => '{}'
  });

  assert.ok(pdfOptsSeen);
  assert.equal(pdfOptsSeen.footer.disclaimer, 'Please inform your server of any allergies.');
});

test('exportPack ES locale emits the Spanish README + mailto', async () => {
  let readmeBody = null;
  let mailtoBody = null;
  const JSZipMock = function () {
    return {
      file: function (name, body) {
        if (name === 'README.md') readmeBody = body;
        if (name === 'mailto-printer.txt') mailtoBody = body;
      },
      generateAsync: () => Promise.resolve({})
    };
  };
  await PACK.exportPack({
    canonicalMenu: seed(),
    locale: 'es',
    businessName: 'Da Marco',
    loadJSZip: () => Promise.resolve(JSZipMock),
    exportText: () => '',
    exportMd: () => '',
    emitJsonld: () => ''
  });
  assert.match(readmeBody, /^# Pack del menú/m);
  assert.match(mailtoBody, /^Asunto: Trabajo de impresión/m);
});
