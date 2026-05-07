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
    // Slice 2 — onnxruntime-web powers the next-generation OCR pipeline
    // built on ONNX models (PP-OCRv4 + DocLayNet + TableFormer) borrowed
    // from Docling's architecture. Replaces Tesseract.js as the primary
    // recognition engine in the v2 path. Optional so a build can succeed
    // offline; the runtime falls back to the Tesseract pipeline when
    // ORT is missing or the engineV2 flag is off.
    //
    // We pin both the ESM entry point and the WASM kernel binaries.
    // ORT lazy-imports the WASM blob whose name matches the build
    // mode it picks (SIMD-threaded preferred, plain WASM fallback for
    // iOS Safari without cross-origin isolation). MJS files are loaded
    // via dynamic import; WASM files are streamed via instantiate-
    // Streaming from same-origin URLs the runtime resolves through
    // MID_VENDORS_CFG.
    name: 'onnxruntime-web',
    version: '1.20.1',
    files: [
      'dist/ort.min.mjs',
      'dist/ort.min.js',
      'dist/ort-wasm-simd-threaded.mjs',
      'dist/ort-wasm-simd-threaded.wasm',
      'dist/ort-wasm-simd-threaded.jsep.mjs',
      'dist/ort-wasm-simd-threaded.jsep.wasm'
    ],
    publicPrefix: '/assets/vendor/onnxruntime-web@1.20.1',
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
  },
  // ----------------------------------------------------------------
  // Wave A4 — Menu Design Suite CDN libraries.
  //
  // The orchestrator currently lazy-loads these from cdn.jsdelivr.net
  // on first export. Pinning them locally gives us:
  //   1. Privacy posture: no outbound request to jsdelivr after first
  //      cache hit; offline-after-first-use stays the brand promise.
  //   2. Resilience: if jsdelivr is blocked (corporate network, CDN
  //      outage, country block), the operator's PDF still ships from
  //      our origin.
  //   3. Optional SRI: the runtime can read the SHA-384 from the
  //      manifest at /assets/vendor/_integrity.json and pin every
  //      <script integrity> attribute, killing CDN-supply-chain risk.
  //
  // All entries are `optional: true` so a build that can't reach the
  // npm registry succeeds with the runtime falling back to CDN.
  // ----------------------------------------------------------------
  {
    name: 'jspdf',
    version: '2.5.2',
    files: ['dist/jspdf.umd.min.js'],
    publicPrefix: '/assets/vendor/jspdf@2.5.2',
    optional: true
  },
  {
    name: 'svg2pdf.js',
    version: '2.4.0',
    files: ['dist/svg2pdf.umd.min.js'],
    publicPrefix: '/assets/vendor/svg2pdf.js@2.4.0',
    optional: true
  },
  {
    name: 'pdf-lib',
    version: '1.17.1',
    files: ['dist/pdf-lib.min.js'],
    publicPrefix: '/assets/vendor/pdf-lib@1.17.1',
    optional: true
  },
  {
    name: 'html2canvas',
    version: '1.4.1',
    files: ['dist/html2canvas.min.js'],
    publicPrefix: '/assets/vendor/html2canvas@1.4.1',
    optional: true
  },
  {
    name: 'jszip',
    version: '3.10.1',
    files: ['dist/jszip.min.js'],
    publicPrefix: '/assets/vendor/jszip@3.10.1',
    optional: true
  },
  {
    name: 'qrcode-generator',
    version: '1.4.4',
    files: ['qrcode.js'],
    publicPrefix: '/assets/vendor/qrcode-generator@1.4.4',
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

// Slice 2 — ONNX model weights for the next-generation pipeline.
// Apache-2.0 licensed throughout; redistribution permitted with the
// NOTICE files captured below. Total payload at full tier:
//   lean   (every device):    ~10 MB compressed (PP-OCRv3 det+rec+dict+cls)
//   capable (silent upgrade): ~17 MB compressed (PP-OCRv4 det+rec+dict)
//   heavy  (lazy on demand):  ~65 MB compressed (DocLayNet heron + TableFormer fast)
// All entries follow the same warn-and-continue posture as
// PADDLEOCR_MODEL_FILES — a build that can't reach the source
// succeeds with a console warning, and the runtime gracefully
// degrades to the legacy Tesseract pipeline.
//
// Source URLs are best-known mirrors as of 2026-05; if a mirror
// 404s during a build, add a fallback URL to the entry's `urls`
// array. ONNX exports of PP-OCR live on swhl/RapidOCR (the
// upstream RapidOCR project's official HF mirror); Docling
// layout + table models live on ds4sd/docling-models (IBM
// Research's official repo behind the Docling Python package).
const ONNX_MODEL_FILES = [
  // ---------- PP-OCRv3 mobile (lean tier — every device) ----------
  { local: 'ppocr@v3-en/det.onnx', urls: [
    'https://huggingface.co/swhl/RapidOCR/resolve/main/PP-OCRv3/ch_PP-OCRv3_det_infer.onnx',
    'https://github.com/RapidAI/RapidOCR/releases/download/v1.3.0/ch_PP-OCRv3_det_infer.onnx'
  ]},
  { local: 'ppocr@v3-en/rec.onnx', urls: [
    'https://huggingface.co/swhl/RapidOCR/resolve/main/PP-OCRv3/en_PP-OCRv3_rec_infer.onnx',
    'https://github.com/RapidAI/RapidOCR/releases/download/v1.3.0/en_PP-OCRv3_rec_infer.onnx'
  ]},
  { local: 'ppocr@v3-en/dict.txt', urls: [
    'https://huggingface.co/swhl/RapidOCR/resolve/main/PP-OCRv3/en_dict.txt',
    'https://raw.githubusercontent.com/RapidAI/RapidOCR/main/python/rapidocr_onnxruntime/models/dict/en_dict.txt'
  ]},
  { local: 'ppocr@v3-en/cls.onnx', urls: [
    'https://huggingface.co/swhl/RapidOCR/resolve/main/PP-OCRv3/ch_ppocr_mobile_v2.0_cls_infer.onnx'
  ]},

  // ---------- PP-OCRv4 mobile (capable tier — silent background upgrade) ----------
  { local: 'ppocr@v4-en/det.onnx', urls: [
    'https://huggingface.co/swhl/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_det_infer.onnx',
    'https://github.com/RapidAI/RapidOCR/releases/download/v1.4.0/ch_PP-OCRv4_det_infer.onnx'
  ]},
  { local: 'ppocr@v4-en/rec.onnx', urls: [
    'https://huggingface.co/swhl/RapidOCR/resolve/main/PP-OCRv4/en_PP-OCRv4_rec_infer.onnx',
    'https://github.com/RapidAI/RapidOCR/releases/download/v1.4.0/en_PP-OCRv4_rec_infer.onnx'
  ]},
  { local: 'ppocr@v4-en/dict.txt', urls: [
    'https://huggingface.co/swhl/RapidOCR/resolve/main/PP-OCRv4/en_dict.txt',
    'https://raw.githubusercontent.com/RapidAI/RapidOCR/main/python/rapidocr_onnxruntime/models/dict/en_dict.txt'
  ]},

  // ---------- Docling layout + table models (heavy tier — lazy) ----------
  { local: 'ds4sd@v2/docling-layout-heron.onnx', urls: [
    'https://huggingface.co/ds4sd/docling-models/resolve/main/model_artifacts/layout/onnx/heron.onnx',
    'https://huggingface.co/ds4sd/docling-layout-heron/resolve/main/model.onnx'
  ]},
  { local: 'ds4sd@v2/tableformer-fast.onnx', urls: [
    'https://huggingface.co/ds4sd/docling-models/resolve/main/model_artifacts/tableformer/onnx/fast.onnx',
    'https://huggingface.co/ds4sd/docling-tableformer-fast/resolve/main/model.onnx'
  ]},

  // ---------- Apache-2.0 NOTICE / LICENSE files (redistribution requirement) ----------
  // Audit fix (build H5): PP-OCRv3 ships on EVERY device (the lean
  // tier — every operator gets it whether they trigger V2 escalation
  // or not), but its LICENSE was missing from this list. PaddleOCR
  // is Apache-2.0; redistribution requires the LICENSE alongside the
  // weights. Add ppocr@v3-en/LICENSE with the same source as v4
  // (single LICENSE file at the repo root covers both versions
  // since they share lineage).
  { local: 'ppocr@v3-en/LICENSE', urls: [
    'https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/LICENSE'
  ]},
  { local: 'ppocr@v4-en/LICENSE', urls: [
    'https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/LICENSE'
  ]},
  { local: 'ds4sd@v2/LICENSE', urls: [
    'https://raw.githubusercontent.com/DS4SD/docling-models/main/LICENSE'
  ]}
];
const ONNX_MODELS_PUBLIC_PREFIX = '/assets/vendor';

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

// Audit fix: hash-drift verification. expected-integrity.json is
// committed to the repo. Each entry is a sha384 the build expects
// to match; any drift fails the build. The first time this is
// enabled in CI, run `node scripts/vendor-pin.mjs --bootstrap-expected`
// once to write the expected file, commit it, and from then on
// upstream re-uploads (HuggingFace `resolve/main` is mutable —
// supply-chain vector noted in the build audit) trigger a deploy
// failure instead of silently swapping model weights.
const EXPECTED_INTEGRITY_FILE = path.join(repoRoot, 'scripts', 'expected-integrity.json');

const isCheck = process.argv.includes('--check');
const allowOffline = process.argv.includes('--allow-offline');
const bootstrapExpected = process.argv.includes('--bootstrap-expected');

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
      // Audit fix: capture Content-Length up front so we can verify
      // the body wasn't truncated mid-fetch (a CDN edge fail can
      // close the connection cleanly with partial content and the
      // 'end' event still fires; without this guard, vendor-pin
      // would write a malformed ONNX model and the tool would throw
      // MODEL_LOAD at every operator).
      const declaredLength = res.headers['content-length']
        ? parseInt(res.headers['content-length'], 10)
        : null;
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (declaredLength !== null && buf.length !== declaredLength) {
          return reject(new Error(
            `Content-Length mismatch: ${url} declared ${declaredLength} bytes, ` +
            `body is ${buf.length} bytes (likely truncated)`
          ));
        }
        resolve(buf);
      });
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

  // Slice 2 — ONNX models (PP-OCRv3, PP-OCRv4, DocLayNet, TableFormer).
  // Same warn-and-continue posture as PaddleOCR weights above. Failed
  // entries trip a single console warning and the runtime falls back
  // to the legacy Tesseract pipeline at first invoice.
  for (const m of ONNX_MODEL_FILES) {
    let data = null;
    let lastErr = null;
    let usedUrl = null;
    for (const u of m.urls) {
      try { data = await fetchBuffer(u); usedUrl = u; break; }
      catch (e) { lastErr = e; }
    }
    if (!data) {
      console.warn(`  ! onnx-model ${m.local}: ${(lastErr && lastErr.message) || 'all sources failed'} (skipping)`);
      warnings++;
      continue;
    }
    const outPath = path.join(DIST_VENDOR_DIR, m.local);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, data);
    writes++;
    const publicUrl = `${ONNX_MODELS_PUBLIC_PREFIX}/${m.local}`;
    integrity.files[publicUrl] = {
      sha384:     sha384(data),
      bytes:      data.length,
      package:    'onnx-models',
      version:    'v3+v4+ds4sd-v2',
      sourcePath: usedUrl
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

  // Audit fix: minimum-file-count guard. Without this, an HF/CDN
  // partial outage can produce a "successful" build that ships
  // with no ONNX models and no integrity manifest entries — the
  // tool then runs V1-only forever and no telemetry surfaces the
  // regression. The threshold (20) is below the expected total
  // (~27: VENDORS + 5 PaddleOCR + 11 ONNX + 6 lang packs) but high
  // enough that any meaningful category-wide failure trips it.
  // Local dev with --allow-offline can still skip by passing
  // --skip-min-writes-check, but production deploys (which run
  // without --allow-offline since the deploy-blocker fix) must
  // hit the floor.
  const MIN_TOTAL_WRITES = 20;
  const skipMinCheck = process.argv.includes('--skip-min-writes-check');
  if (writes < MIN_TOTAL_WRITES && !skipMinCheck) {
    const msg = `vendor-pin: only ${writes} file(s) written (minimum ${MIN_TOTAL_WRITES}). ` +
                `Refusing to write integrity.json — this would silently ship a deploy ` +
                `without ONNX models / lang packs.`;
    if (allowOffline) {
      console.warn('  ! ' + msg + ' (allowed because --allow-offline)');
    } else {
      throw new Error(msg);
    }
  }

  // Audit fix: hash-drift verification against committed expected
  // hashes. Catches the supply-chain attack vector where HuggingFace
  // upstream silently re-uploads model weights at the same
  // resolve/main URL. If expected-integrity.json doesn't exist yet,
  // we warn (first-deploy bootstrap mode); --bootstrap-expected
  // overwrites the file with current hashes for legitimate updates.
  let expected = null;
  if (fs.existsSync(EXPECTED_INTEGRITY_FILE)) {
    try { expected = JSON.parse(fs.readFileSync(EXPECTED_INTEGRITY_FILE, 'utf8')); }
    catch (_) { expected = null; }
  }
  if (expected && expected.files && !bootstrapExpected) {
    const drifts = [];
    for (const [url, expHash] of Object.entries(expected.files)) {
      const actual = integrity.files[url];
      if (!actual) continue;  // file not in this build; not a drift
      const actualHash = `sha384-${actual.sha384}`;
      if (actualHash !== expHash) {
        drifts.push(`  - ${url}\n      expected: ${expHash.slice(0, 48)}...\n      actual:   ${actualHash.slice(0, 48)}...`);
      }
    }
    if (drifts.length) {
      throw new Error(
        `vendor-pin: hash drift on ${drifts.length} file(s) vs expected-integrity.json:\n` +
        drifts.join('\n') + '\n' +
        `If this drift is intentional (e.g., legitimate model upgrade), run:\n` +
        `  node scripts/vendor-pin.mjs --bootstrap-expected\n` +
        `to update expected-integrity.json, review the diff, and commit.`
      );
    }
    console.log(`vendor-pin: integrity drift check passed (${Object.keys(expected.files).length} expected entries).`);
  } else if (!bootstrapExpected) {
    console.warn(
      `  ! no ${path.relative(repoRoot, EXPECTED_INTEGRITY_FILE)} found — supply-chain ` +
      `drift detection is OFF. Run \`node scripts/vendor-pin.mjs --bootstrap-expected\` ` +
      `once and commit the result to enable.`
    );
  }
  if (bootstrapExpected) {
    const bootstrap = {
      version: 1,
      generatedAt: new Date().toISOString(),
      note: 'Hashes the build expects to find. Hash drift fails the build (catches supply-chain attacks via mutable URLs like HuggingFace resolve/main). Update via: node scripts/vendor-pin.mjs --bootstrap-expected',
      files: {}
    };
    for (const [url, info] of Object.entries(integrity.files)) {
      bootstrap.files[url] = `sha384-${info.sha384}`;
    }
    fs.writeFileSync(EXPECTED_INTEGRITY_FILE, JSON.stringify(bootstrap, null, 2));
    console.log(`\nvendor-pin: bootstrapped ${Object.keys(bootstrap.files).length} entries to ${path.relative(repoRoot, EXPECTED_INTEGRITY_FILE)}`);
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
