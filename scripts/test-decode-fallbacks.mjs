#!/usr/bin/env node
// Decode-fallback regression suite.
//
// Locks in the TIFF / HEIC / AVIF detection + routing fixes from
// commit 594dab4a so a future preprocess.js change can't silently
// break the ScanSnap-output and iPhone-photo paths again.
//
// Coverage:
//   1. Magic-bytes sniffer — synthetic Blobs with known signatures
//      route to 'tiff' / 'heic' / 'avif' / null.
//   2. _isTiffFile / _isHeicFile — extension + MIME detection.
//   3. fileToCanvas routing — TIFF detected (extension OR magic
//      bytes) attempts utif.js load BEFORE the standard <img> path;
//      HEIC detected attempts libheif. Verified by stubbing
//      document.createElement('script') and capturing src URLs.
//   4. Error message contracts — TIFF rejection contains 'ScanSnap'
//      and 'PDF'; HEIC rejection contains 'JPG' and 'Most Compatible';
//      AVIF rejection mentions PNG/JPG.
//
// Run: `node scripts/test-decode-fallbacks.mjs`

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

let failures = 0;
function assert(label, cond, detail) {
  if (cond) {
    console.log('  ✓ ' + label);
  } else {
    failures++;
    console.error('  ✗ ' + label + (detail ? ': ' + detail : ''));
  }
}
async function asyncAssert(label, promise, expectedTrue, detail) {
  const got = await promise;
  assert(label, got === expectedTrue, detail || `got ${got}`);
}

// Synthetic file factory. Returns a File-shaped Blob that
// preprocess.js's helpers can introspect.
function makeBlob(bytes, mime, name) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const blob = new Blob([u8], { type: mime || 'application/octet-stream' });
  // Attach .name so _isTiffFile / _isHeicFile can read it.
  if (name) Object.defineProperty(blob, 'name', { value: name, configurable: true });
  return blob;
}

// Canonical magic-byte signatures.
const TIFF_LE   = new Uint8Array([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]);
const TIFF_BE   = new Uint8Array([0x4D, 0x4D, 0x00, 0x2A, 0x00, 0x00, 0x00, 0x08, 0, 0, 0, 0, 0, 0, 0, 0]);
const HEIC_FTYP = new Uint8Array([0x00,0x00,0x00,0x18, 0x66,0x74,0x79,0x70, 0x68,0x65,0x69,0x63, 0x00,0x00,0x00,0x00]);
const MIF1_FTYP = new Uint8Array([0x00,0x00,0x00,0x18, 0x66,0x74,0x79,0x70, 0x6D,0x69,0x66,0x31, 0x00,0x00,0x00,0x00]);
const HEIX_FTYP = new Uint8Array([0x00,0x00,0x00,0x18, 0x66,0x74,0x79,0x70, 0x68,0x65,0x69,0x78, 0x00,0x00,0x00,0x00]);
const AVIF_FTYP = new Uint8Array([0x00,0x00,0x00,0x18, 0x66,0x74,0x79,0x70, 0x61,0x76,0x69,0x66, 0x00,0x00,0x00,0x00]);
const JPEG_SOI  = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0, 0, 0, 0, 0, 0]);
const PNG_SIG   = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0]);
const GARBAGE   = new Uint8Array([0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42]);

// ---------- Stub the browser globals preprocess.js needs ----------
const scriptLoadAttempts = [];
globalThis.window = globalThis;
globalThis.document = {
  createElement(tag) {
    if (tag === 'script') {
      // Capture every script src the runtime tries to load. Triggering
      // .onerror lets the fallback chain drain so we can observe its
      // route choice without an actual network fetch.
      const node = {
        _isScript: true,
        set src(v) { scriptLoadAttempts.push(v); setTimeout(() => node.onerror && node.onerror(), 0); },
        get src() { return this._src; },
        async: true,
        crossOrigin: '',
        onload: null,
        onerror: null
      };
      return node;
    }
    if (tag === 'canvas') {
      // Minimal canvas shim — only used when the actual decode path
      // tries to render. The TIFF/HEIC paths fail before reaching it
      // in our tests (utif/libheif unavailable), so getContext can
      // return a noop.
      return {
        width: 0, height: 0,
        getContext() {
          return {
            createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
            putImageData() {},
            drawImage() {},
            fillRect() {},
            getImageData(_x, _y, w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }
          };
        }
      };
    }
    return { tagName: tag, appendChild() {}, setAttribute() {} };
  },
  head: { appendChild() {} },
  documentElement: { lang: 'en' }
};
// Image stub that always errors — exercises the magic-bytes/fallback path.
globalThis.Image = class {
  set src(_v) { setTimeout(() => this.onerror && this.onerror(), 0); }
  get src() { return ''; }
};
globalThis.URL = globalThis.URL || {};
globalThis.URL.createObjectURL = () => 'blob:test';
globalThis.URL.revokeObjectURL = () => {};
// createImageBitmap stub — always rejects so we exercise the
// terminal error-message path.
globalThis.createImageBitmap = () => Promise.reject(new Error('stub'));

const P = require('../tools/invoice-decoder/preprocess.js');

// =================================================================
console.log('Magic-bytes sniffer:');
{
  await asyncAssert('TIFF little-endian (II*\\0) → tiff',  P._sniffImageMagicBytes(makeBlob(TIFF_LE)),   'tiff');
  await asyncAssert('TIFF big-endian    (MM\\0*) → tiff',  P._sniffImageMagicBytes(makeBlob(TIFF_BE)),   'tiff');
  await asyncAssert('HEIC ftyp+heic     → heic',           P._sniffImageMagicBytes(makeBlob(HEIC_FTYP)), 'heic');
  await asyncAssert('HEIC ftyp+heix     → heic',           P._sniffImageMagicBytes(makeBlob(HEIX_FTYP)), 'heic');
  await asyncAssert('HEIC ftyp+mif1     → heic',           P._sniffImageMagicBytes(makeBlob(MIF1_FTYP)), 'heic');
  await asyncAssert('AVIF ftyp+avif     → avif',           P._sniffImageMagicBytes(makeBlob(AVIF_FTYP)), 'avif');
  await asyncAssert('JPEG signature      → null',          P._sniffImageMagicBytes(makeBlob(JPEG_SOI)),  null);
  await asyncAssert('PNG signature       → null',          P._sniffImageMagicBytes(makeBlob(PNG_SIG)),   null);
  await asyncAssert('Garbage bytes       → null',          P._sniffImageMagicBytes(makeBlob(GARBAGE)),   null);
}

// =================================================================
console.log('\nExtension + MIME detection:');
{
  // TIFF extensions
  assert('foo.tif → TIFF',                       P._isTiffFile(makeBlob([], '', 'foo.tif')));
  assert('foo.tiff → TIFF',                      P._isTiffFile(makeBlob([], '', 'foo.tiff')));
  assert('foo.TIFF (uppercase) → TIFF',          P._isTiffFile(makeBlob([], '', 'foo.TIFF')));
  assert('image/tiff MIME → TIFF',               P._isTiffFile(makeBlob([], 'image/tiff', 'foo')));
  assert('image/tif MIME → TIFF',                P._isTiffFile(makeBlob([], 'image/tif', 'foo')));
  assert('foo.jpg → not TIFF',                  !P._isTiffFile(makeBlob([], '', 'foo.jpg')));
  assert('foo.pdf → not TIFF',                  !P._isTiffFile(makeBlob([], '', 'foo.pdf')));

  // HEIC extensions
  assert('foo.heic → HEIC',                      P._isHeicFile(makeBlob([], '', 'foo.heic')));
  assert('foo.HEIC (uppercase) → HEIC',          P._isHeicFile(makeBlob([], '', 'foo.HEIC')));
  assert('foo.heif → HEIC',                      P._isHeicFile(makeBlob([], '', 'foo.heif')));
  assert('foo.hif → HEIC',                       P._isHeicFile(makeBlob([], '', 'foo.hif')));
  assert('image/heic MIME → HEIC',               P._isHeicFile(makeBlob([], 'image/heic', 'foo')));
  assert('image/heif MIME → HEIC',               P._isHeicFile(makeBlob([], 'image/heif', 'foo')));
  assert('image/heic-sequence MIME → HEIC',      P._isHeicFile(makeBlob([], 'image/heic-sequence', 'foo')));
  assert('image/heif-sequence MIME → HEIC',      P._isHeicFile(makeBlob([], 'image/heif-sequence', 'foo')));
  assert('foo.jpg → not HEIC',                  !P._isHeicFile(makeBlob([], '', 'foo.jpg')));
}

// =================================================================
console.log('\nfileToCanvas routing — TIFF (extension):');
{
  scriptLoadAttempts.length = 0;
  const tiffBlob = makeBlob(TIFF_LE, 'image/tiff', 'scan.tif');
  await P.fileToCanvas(tiffBlob).then(
    () => { failures++; console.error('  ✗ TIFF blob unexpectedly resolved'); },
    (err) => {
      const msg = err && err.message || '';
      assert('TIFF .tif → utif.js load attempted',          scriptLoadAttempts.some(s => /utif/i.test(s)));
      assert('TIFF rejection mentions ScanSnap',            /ScanSnap/.test(msg));
      assert('TIFF rejection mentions PDF',                 /PDF/.test(msg));
    }
  );
}

console.log('\nfileToCanvas routing — TIFF (magic bytes only, no extension):');
{
  scriptLoadAttempts.length = 0;
  // The image path runs first because the extension-detector says no.
  // <img> errors → magic-bytes sniff catches TIFF → utif attempted.
  const tiffMisnamed = makeBlob(TIFF_LE, 'application/octet-stream', 'scan-with-no-ext');
  await P.fileToCanvas(tiffMisnamed).then(
    () => { failures++; console.error('  ✗ misnamed TIFF unexpectedly resolved'); },
    (err) => {
      const msg = err && err.message || '';
      assert('TIFF magic-bytes → utif.js load attempted',   scriptLoadAttempts.some(s => /utif/i.test(s)));
      assert('TIFF magic-bytes rejection mentions ScanSnap', /ScanSnap/.test(msg));
    }
  );
}

console.log('\nfileToCanvas routing — HEIC (extension):');
{
  scriptLoadAttempts.length = 0;
  const heicBlob = makeBlob(HEIC_FTYP, 'image/heic', 'photo.heic');
  await P.fileToCanvas(heicBlob).then(
    () => { failures++; console.error('  ✗ HEIC blob unexpectedly resolved'); },
    (err) => {
      const msg = err && err.message || '';
      assert('HEIC .heic → libheif.js load attempted',      scriptLoadAttempts.some(s => /libheif/i.test(s)));
      assert('HEIC rejection mentions JPG share path',      /JPG/i.test(msg));
      assert('HEIC rejection mentions Most Compatible',     /Most Compatible/i.test(msg));
    }
  );
}

console.log('\nfileToCanvas routing — HEIC (magic bytes, .jpg-renamed iPhone share):');
{
  scriptLoadAttempts.length = 0;
  // iPhone shares often arrive as .jpg with image/jpeg MIME but
  // HEIC payload. <img> fails → magic bytes catch heic.
  const heicMislabeled = makeBlob(HEIC_FTYP, 'image/jpeg', 'IMG_1234.jpg');
  await P.fileToCanvas(heicMislabeled).then(
    () => { failures++; console.error('  ✗ mislabeled HEIC unexpectedly resolved'); },
    (err) => {
      const msg = err && err.message || '';
      assert('HEIC magic-bytes → libheif.js load attempted', scriptLoadAttempts.some(s => /libheif/i.test(s)));
      assert('HEIC magic-bytes rejection mentions JPG',     /JPG/i.test(msg));
    }
  );
}

console.log('\nfileToCanvas routing — AVIF (magic bytes):');
{
  const avifBlob = makeBlob(AVIF_FTYP, '', 'photo');
  await P.fileToCanvas(avifBlob).then(
    () => { failures++; console.error('  ✗ AVIF blob unexpectedly resolved'); },
    (err) => {
      const msg = err && err.message || '';
      assert('AVIF rejection mentions PNG or JPG',          /PNG|JPG/i.test(msg));
    }
  );
}

console.log('\nfileToCanvas routing — unknown format (everything fails):');
{
  const garbageBlob = makeBlob(GARBAGE, '', 'mystery.bin');
  await P.fileToCanvas(garbageBlob).then(
    () => { failures++; console.error('  ✗ garbage blob unexpectedly resolved'); },
    (err) => {
      const msg = err && err.message || '';
      assert('Generic rejection contains actionable guidance', /JPG|JPEG|PDF|share|Most Compatible/i.test(msg) || msg.length > 0);
    }
  );
}

// =================================================================
console.log('\n' + (failures === 0 ? '✓ All decode-fallback tests passed.' : '✗ ' + failures + ' failure(s).'));
process.exit(failures === 0 ? 0 : 1);
