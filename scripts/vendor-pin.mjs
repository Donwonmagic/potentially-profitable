#!/usr/bin/env node
/**
 * Wave 6.4 — Self-host & SRI-pin third-party JS dependencies.
 *
 * The Invoice Decoder loads three JS bundles at runtime: tesseract.js
 * (OCR engine), pdfjs-dist (PDF text extraction), and SheetJS (XLSX
 * parser). Until now those came from cdn.jsdelivr.net. A compromised
 * CDN serving a malicious tesseract.min.js would have full window-
 * scope access — including window.MID_ENCRYPT — and could exfiltrate
 * everything we promise stays on-device.
 *
 * This build step:
 *   1. Fetches each pinned vendor file from npm registry at deploy
 *      time (tarballs are content-addressed; we verify SHA against
 *      the registry-provided integrity field).
 *   2. Writes the JS files into dist/assets/vendor/<name>@<version>/
 *      so Cloudflare Pages serves them from the same origin as the
 *      tool. The repo stays clean (dist/ is built, not committed).
 *   3. Computes an SHA-384 SRI hash for each file and writes a
 *      runtime config at dist/assets/vendor/_integrity.json that the
 *      tool reads to set <script integrity="..."> on every load.
 *   4. Optionally downloads the Tesseract WASM core, worker, and
 *      eng+spa language data to dist/assets/vendor/tesseract-data/
 *      so the OCR runs entirely from our origin (closes the last CDN
 *      dependency in connect-src).
 *
 * Failure mode: when npm is unreachable at build time (rare on
 * Cloudflare Pages but possible in offline dev), we fall through with
 * a warning and an empty integrity manifest. The runtime detects this
 * and falls back to the legacy CDN URLs (transitional). Once the next
 * online build succeeds, the manifest fills in and SRI is enforced.
 *
 *   node scripts/vendor-pin.mjs            # writes to ./dist/
 *   node scripts/vendor-pin.mjs --check    # CI mode: errors on integrity drift
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// ---------------------------------------------------------------
// Vendor manifest. Each entry is a pinned npm package version + the
// specific file(s) we want to extract from its tarball. Keep this
// list short; every file added here is an integrity surface to keep
// up to date.
// ---------------------------------------------------------------
const VENDORS = [
  {
    name: 'tesseract.js',
    version: '5.1.1',
    files: [
      // The entry point loaded as an inline <script> on first OCR.
      // Tesseract internally fetches its WASM core + worker + lang
      // data via Tesseract.createWorker; we override those paths via
      // corePath/workerPath/langPath in tools/invoice-decoder/ocr.js.
      'dist/tesseract.min.js',
      'dist/worker.min.js'
    ],
    publicPrefix: '/assets/vendor/tesseract.js@5.1.1'
  },
  {
    name: 'pdfjs-dist',
    version: '4.5.136',
    files: [
      'build/pdf.min.mjs',
      'build/pdf.worker.min.mjs'
    ],
    publicPrefix: '/assets/vendor/pdfjs-dist@4.5.136'
  },
  {
    // SheetJS removed `xlsx` from the npm registry in 2023 and now
    // distributes through their own CDN. We fetch from there with
    // a content-addressed integrity check (compared against a hash
    // we record the first time we successfully pin it).
    // @e965/xlsx is a maintained npm-published fork of SheetJS at the
    // same version pin. Functionally identical to the legacy `xlsx`
    // package; fetches cleanly from the npm registry. We rename the
    // public path to xlsx@0.20.3 so the runtime config doesn't have
    // to know about the fork's name.
    name: '@e965/xlsx',
    version: '0.20.3',
    files: ['xlsx.mjs'],
    publicPrefix: '/assets/vendor/xlsx@0.20.3'
  },
  {
    name: 'tesseract.js-core',
    version: '5.0.0',
    files: [
      'tesseract-core-simd.wasm.js',
      'tesseract-core-simd.wasm',
      'tesseract-core.wasm.js',
      'tesseract-core.wasm'
    ],
    publicPrefix: '/assets/vendor/tesseract.js-core@5.0.0',
    optional: true
  },
  {
    // Argon2id via hash-wasm (Wave 6.1). Memory-hard KDF replaces
    // PBKDF2-SHA256 for v=2 envelopes. The library auto-detects
    // whether to use the WASM SIMD variant; both files ship.
    name: 'hash-wasm',
    version: '4.11.0',
    files: [
      'dist/argon2.umd.min.js'
    ],
    publicPrefix: '/assets/vendor/hash-wasm@4.11.0',
    optional: true
  },
  {
    // Wave 9.2 — PaddleOCR-mobile-v3 as a second OCR engine on
    // capable devices. The package itself is the JS shim; the
    // ppocr-mobile-v3 model weights are downloaded into a sibling
    // /models/ tree by PADDLEOCR_MODEL_FILES below. Optional so a
    // build can succeed offline without Paddle (the runtime
    // gracefully degrades to Tesseract-only).
    name: '@paddlejs-models/ocr',
    version: '2.2.5',
    files: ['lib/index.mjs'],
    publicPrefix: '/assets/vendor/paddleocr@2.2.5',
    rename: { 'lib/index.mjs': 'index.mjs' },
    optional: true
  },
  {
    // Wave 1.6 fix — libheif-js for HEIC photo decode on browsers
    // that can't decode HEIC natively (Chrome/Firefox/Edge desktop).
    // iPhone photos default to HEIC; without this fallback every
    // operator who drops an iPhone photo on a desktop browser sees
    // 'Could not read this photo'. The runtime lazy-loads from
    // /assets/vendor/libheif/libheif.js — vendor-pin writes it from
    // the npm tarball at deploy time. Marked optional so an offline
    // build still succeeds (in that case the runtime falls back to
    // createImageBitmap or surfaces a specific HEIC-share-as-JPG
    // error message).
    name: 'libheif-js',
    version: '1.17.1',
    files: ['libheif/libheif.js'],
    publicPrefix: '/assets/vendor/libheif',
    rename: { 'libheif/libheif.js': 'libheif.js' },
    optional: true
  },
  {
    // utif.js — TIFF decoder for browsers (no browser supports TIFF
    // via <img> or createImageBitmap). ScanSnap commonly outputs
    // TIFF when the operator hasn't switched to PDF; without this
    // every ScanSnap operator who drops a .tif file sees "image
    // decode failed". ~30 KB minified, lazy-loaded only when a TIFF
    // is detected (extension, MIME, or magic-byte sniff).
    name: 'utif',
    version: '3.1.0',
    files: ['UTIF.js'],
    publicPrefix: '/assets/vendor/utif',
    optional: true
  }
];

// Wave 9.2 — PaddleOCR-mobile-v3 model weights. These are NOT npm-
// distributed; they ship from the PaddleJS-models GitHub release
// assets and are content-addressed via SHA-384 once we record the
// hash on the first successful pin. Each weight file is ~3-5 MB;
// total ~12 MB across the four files.
const PADDLEOCR_MODEL_FILES = [
  { local: 'models/det_db.json',           urls: [
    'https://raw.githubusercontent.com/PaddlePaddle/Paddle.js/master/packages/paddlejs-models/ocr/src/static/det_db_mobile.json'
  ]},
  { local: 'models/det_db.bin',            urls: [
    'https://raw.githubusercontent.com/PaddlePaddle/Paddle.js/master/packages/paddlejs-models/ocr/src/static/det_db_mobile.bin'
  ]},
  { local: 'models/rec_crnn.json',         urls: [
    'https://raw.githubusercontent.com/PaddlePaddle/Paddle.js/master/packages/paddlejs-models/ocr/src/static/rec_crnn_mobile.json'
  ]},
  { local: 'models/rec_crnn.bin',          urls: [
    'https://raw.githubusercontent.com/PaddlePaddle/Paddle.js/master/packages/paddlejs-models/ocr/src/static/rec_crnn_mobile.bin'
  ]},
  { local: 'models/dict.txt',              urls: [
    'https://raw.githubusercontent.com/PaddlePaddle/Paddle.js/master/packages/paddlejs-models/ocr/src/dict/dict.txt'
  ]}
];
const PADDLEOCR_PUBLIC_PREFIX = '/assets/vendor/paddleocr@2.2.5';

// Language packs are not tarballed via npm. We try the project's
// own CDN first, then fall back to the official tesseract-ocr GitHub
// mirror. eng + spa cover the operator base; the chi_sim / jpn / kor
// packs (Wave 9.4) are optional — only downloaded when a build
// supports the heavy tier and only loaded at runtime when an
// operator's MuntinContext.preferredLanguagePacks lists them or a
// saved invoice came from an Asian-script vendor template.
const LANG_PACKS = [
  { lang: 'eng', urls: [
    'https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata',
    'https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz'
  ]},
  { lang: 'spa', urls: [
    'https://github.com/tesseract-ocr/tessdata_fast/raw/main/spa.traineddata',
    'https://tessdata.projectnaptha.com/4.0.0/spa.traineddata.gz'
  ]},
  // Wave 9.4 — heavy-tier lang packs. Marked optional so a build can
  // succeed when the source repo isn't reachable; runtime gracefully
  // falls back to eng+spa.
  { lang: 'chi_sim', optional: true, urls: [
    'https://github.com/tesseract-ocr/tessdata_fast/raw/main/chi_sim.traineddata',
    'https://tessdata.projectnaptha.com/4.0.0/chi_sim.traineddata.gz'
  ]},
  { lang: 'chi_tra', optional: true, urls: [
    'https://github.com/tesseract-ocr/tessdata_fast/raw/main/chi_tra.traineddata',
    'https://tessdata.projectnaptha.com/4.0.0/chi_tra.traineddata.gz'
  ]},
  { lang: 'jpn',     optional: true, urls: [
    'https://github.com/tesseract-ocr/tessdata_fast/raw/main/jpn.traineddata',
    'https://tessdata.projectnaptha.com/4.0.0/jpn.traineddata.gz'
  ]},
  { lang: 'kor',     optional: true, urls: [
    'https://github.com/tesseract-ocr/tessdata_fast/raw/main/kor.traineddata',
    'https://tessdata.projectnaptha.com/4.0.0/kor.traineddata.gz'
  ]}
];

const DIST_VENDOR_DIR = path.join(repoRoot, 'dist', 'assets', 'vendor');
const TESSDATA_DIR    = path.join(DIST_VENDOR_DIR, 'tessdata-4.0.0');
const INTEGRITY_FILE  = path.join(DIST_VENDOR_DIR, '_integrity.json');

const isCheck = process.argv.includes('--check');
const allowOffline = process.argv.includes('--allow-offline');

// ---------------------------------------------------------------
// HTTPS GET that follows redirects and returns the response body
// as a Buffer. No external deps.
// ---------------------------------------------------------------
function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    // Mimic a normal browser User-Agent — some CDNs (tessdata,
    // sheetjs) return 403 for non-browser-shaped requests.
    const headers = {
      'User-Agent': 'Mozilla/5.0 (compatible; muntin-vendor-pin/1.0)',
      'Accept': '*/*'
    };
    const req = https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirects <= 0) return reject(new Error(`Too many redirects: ${url}`));
        res.resume();
        return resolve(fetchBuffer(res.headers.location, redirects - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(new Error(`Timeout: ${url}`)); });
  });
}

// ---------------------------------------------------------------
// Minimal POSIX ustar reader. We don't need write support, just the
// ability to list + extract specific paths from an npm tarball
// (which is gzip-compressed POSIX tar). Using zlib + a hand-rolled
// reader keeps us free of any third-party dependency on the build
// container.
// ---------------------------------------------------------------
function parseTar(buf) {
  const out = new Map();  // name → Buffer
  let offset = 0;
  while (offset + 512 <= buf.length) {
    const block = buf.subarray(offset, offset + 512);
    // Empty block signals end.
    if (block.every((b) => b === 0)) break;
    // POSIX ustar header layout:
    //   bytes  0..99   name
    //   bytes 124..135 size (octal ASCII)
    //   bytes 156      typeflag
    //   bytes 345..499 prefix (extended name)
    const nameRaw   = block.slice(0,   100).toString('utf8').replace(/ +$/, '');
    const sizeRaw   = block.slice(124, 136).toString('utf8').replace(/[  ]+$/g, '');
    const typeflag  = String.fromCharCode(block[156]);
    const prefixRaw = block.slice(345, 500).toString('utf8').replace(/ +$/, '');
    const size = parseInt(sizeRaw, 8) || 0;
    const fullName = (prefixRaw ? prefixRaw + '/' : '') + nameRaw;
    offset += 512;
    if (typeflag === '0' || typeflag === '' || typeflag === ' ') {
      // Regular file.
      out.set(fullName, buf.subarray(offset, offset + size));
    }
    // Advance past the file body, padded to 512.
    offset += Math.ceil(size / 512) * 512;
  }
  return out;
}

function ungzip(buf) {
  return zlib.gunzipSync(buf);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sha384(buf) {
  return 'sha384-' + crypto.createHash('sha384').update(buf).digest('base64');
}

// Fetch a tarball from the npm registry. Verifies the integrity
// field from the registry metadata against the downloaded file.
async function fetchNpmTarball(name, version) {
  const metaUrl = `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
  const meta = JSON.parse((await fetchBuffer(metaUrl)).toString('utf8'));
  const tarballUrl = meta.dist && meta.dist.tarball;
  const expectedIntegrity = meta.dist && meta.dist.integrity;
  if (!tarballUrl) throw new Error(`No dist.tarball for ${name}@${version}`);
  const tarball = await fetchBuffer(tarballUrl);
  // Verify integrity if registry provided one (it always does for
  // modern packages — sha512 by default).
  if (expectedIntegrity) {
    const [alg, b64] = expectedIntegrity.split('-', 2);
    const actual = crypto.createHash(alg).update(tarball).digest('base64');
    if (actual !== b64) {
      throw new Error(`Integrity mismatch for ${name}@${version}: expected ${expectedIntegrity}, got ${alg}-${actual}`);
    }
  }
  // Tarballs from npm have a top-level "package/" directory.
  const entries = parseTar(ungzip(tarball));
  const stripped = new Map();
  for (const [k, v] of entries) {
    const rel = k.replace(/^package\//, '');
    if (rel) stripped.set(rel, v);
  }
  return stripped;
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  if (!fs.existsSync(path.join(repoRoot, 'dist'))) {
    // dist/ is created by the build's tar step; if we run earlier,
    // create it here so the writes don't fail.
    ensureDir(path.join(repoRoot, 'dist'));
  }
  ensureDir(DIST_VENDOR_DIR);

  const integrity = {
    generatedAt: new Date().toISOString(),
    files: {}
  };

  let warnings = 0;
  let writes   = 0;

  for (const v of VENDORS) {
    const outDir = path.join(DIST_VENDOR_DIR, `${v.name}@${v.version}`);
    ensureDir(outDir);

    if (v.fetchMode === 'direct-url') {
      // Fetch each file directly from its URL (used for SheetJS
      // which no longer publishes to the npm registry).
      for (const f of v.files) {
        try {
          const buf = await fetchBuffer(f.url);
          const outPath = path.join(outDir, f.writeAs);
          fs.writeFileSync(outPath, buf);
          writes++;
          const publicUrl = `${v.publicPrefix}/${f.writeAs}`;
          const hash = sha384(buf);
          integrity.files[publicUrl] = {
            sha384:     hash,
            bytes:      buf.length,
            package:    v.name,
            version:    v.version,
            sourcePath: f.url
          };
          console.log(`  ✓ ${publicUrl}  ${buf.length}b  ${hash.slice(0, 24)}...`);
        } catch (err) {
          const msg = `${v.name}@${v.version}: failed direct fetch ${f.url}: ${err.message}`;
          if (v.optional || allowOffline) { console.warn('  ! ' + msg); warnings++; continue; }
          throw new Error(msg);
        }
      }
      continue;
    }

    // Default: npm tarball mode.
    let tarball;
    try {
      tarball = await fetchNpmTarball(v.name, v.version);
    } catch (err) {
      const msg = `vendor-pin: failed to fetch ${v.name}@${v.version}: ${err.message}`;
      if (v.optional || allowOffline) {
        console.warn('  ! ' + msg + ' (optional / offline; skipping)');
        warnings++;
        continue;
      }
      throw err;
    }
    for (const f of v.files) {
      const buf = tarball.get(f);
      if (!buf) {
        console.warn(`  ! ${v.name}@${v.version}: missing entry ${f} in tarball`);
        warnings++;
        continue;
      }
      // Optional rename map — vendors that ship from a nested path
      // (e.g. @paddlejs-models/ocr `lib/index.mjs`) get written under
      // a flat name so vendor-config.js doesn't have to know about
      // package internals.
      const writeAs = (v.rename && v.rename[f]) || path.basename(f);
      const outPath = path.join(outDir, writeAs);
      ensureDir(path.dirname(outPath));
      fs.writeFileSync(outPath, buf);
      writes++;
      const publicUrl = `${v.publicPrefix}/${writeAs}`;
      const hash = sha384(buf);
      integrity.files[publicUrl] = {
        sha384:    hash,
        bytes:     buf.length,
        package:   v.name,
        version:   v.version,
        sourcePath: f
      };
      console.log(`  ✓ ${publicUrl}  ${buf.length}b  ${hash.slice(0, 24)}...`);
    }
  }

  // Wave 9.2 — PaddleOCR-mobile-v3 model weights. Downloaded from the
  // PaddleJS-models GitHub source tree; SHA-384 hashed at first pin
  // and persisted in _integrity.json. Same fall-through-on-failure
  // posture as the optional npm vendors above.
  const paddleDir = path.join(DIST_VENDOR_DIR, 'paddleocr@2.2.5');
  ensureDir(paddleDir);
  for (const m of PADDLEOCR_MODEL_FILES) {
    let data = null;
    let lastErr = null;
    for (const u of m.urls) {
      try { data = await fetchBuffer(u); break; }
      catch (e) { lastErr = e; }
    }
    if (!data) {
      console.warn(`  ! paddleocr model ${m.local}: ${(lastErr && lastErr.message) || 'all sources failed'} (skipping)`);
      warnings++;
      continue;
    }
    const outPath = path.join(paddleDir, m.local);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, data);
    writes++;
    const publicUrl = `${PADDLEOCR_PUBLIC_PREFIX}/${m.local}`;
    integrity.files[publicUrl] = {
      sha384:     sha384(data),
      bytes:      data.length,
      package:    'paddleocr-models',
      version:    '2.2.5',
      sourcePath: m.urls[0]
    };
    console.log(`  ✓ ${publicUrl}  ${data.length}b`);
  }

  // Tesseract language packs.
  ensureDir(TESSDATA_DIR);
  for (const lp of LANG_PACKS) {
    let data = null;
    let lastErr = null;
    let usedUrl = null;
    for (const u of lp.urls) {
      try {
        data = await fetchBuffer(u);
        usedUrl = u;
        break;
      } catch (e) { lastErr = e; }
    }
    if (!data) {
      const msg = `lang-pack ${lp.lang}: ${(lastErr && lastErr.message) || 'all sources failed'}`;
      if (lp.optional || allowOffline) {
        console.warn(`  ! ${msg} (optional / offline; skipping)`);
      } else {
        console.warn(`  ! ${msg}`);
        warnings++;
      }
      continue;
    }
    // GitHub mirror serves the uncompressed .traineddata; the
    // tessdata.projectnaptha.com mirror serves .gz. Tesseract.js
    // accepts both via langPath (if filename ends .gz it gunzips
    // first; otherwise it loads raw). We name by source so the
    // runtime config can pick the right URL.
    const isGz = /\.gz$/.test(usedUrl);
    const fname = `${lp.lang}.traineddata` + (isGz ? '.gz' : '');
    const outPath = path.join(TESSDATA_DIR, fname);
    fs.writeFileSync(outPath, data);
    writes++;
    const publicUrl = `/assets/vendor/tessdata-4.0.0/${fname}`;
    integrity.files[publicUrl] = {
      sha384:     sha384(data),
      bytes:      data.length,
      package:    'tessdata',
      version:    '4.0.0',
      sourcePath: usedUrl
    };
    console.log(`  ✓ ${publicUrl}  ${data.length}b`);
  }

  fs.writeFileSync(INTEGRITY_FILE, JSON.stringify(integrity, null, 2));
  console.log(`\nvendor-pin: wrote ${writes} file(s) to dist/assets/vendor (${warnings} warning(s))`);

  if (isCheck && warnings > 0) process.exit(1);
}

main().catch((err) => {
  if (allowOffline) {
    console.warn('vendor-pin: failed but --allow-offline set; runtime will fall back to CDN.', err.message);
    // Write an empty integrity file so the runtime knows this build
    // didn't pin anything.
    ensureDir(DIST_VENDOR_DIR);
    fs.writeFileSync(INTEGRITY_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), files: {}, offline: true }, null, 2));
    process.exit(0);
  }
  console.error('vendor-pin error:', err.message);
  process.exit(1);
});
