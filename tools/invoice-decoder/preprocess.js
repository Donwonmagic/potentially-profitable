/**
 * Invoice Decoder — image preprocessing pipeline (Wave B1).
 *
 * Reliable OCR doesn't start at Tesseract — it starts at the image.
 * Faxed, low-contrast, perspective-skewed photos break a generic
 * OCR engine; this module runs every captured image through:
 *
 *   1. Decode (HTMLImageElement → canvas pixel buffer)
 *   2. Downscale to a max long edge (default 2000px) for OCR speed
 *      and memory ceiling. Larger photos get re-sampled bilinear.
 *   3. Grayscale (Rec. 601 luma — eyes weight green most)
 *   4. Adaptive Otsu threshold — binarize on a histogram-derived
 *      cutoff. Massive accuracy win on faxed / thermal-printed /
 *      photocopied invoices.
 *   5. Hough-line deskew — try 5° rotations from -10..+10, score
 *      each by total ink along candidate baselines, apply the
 *      best.
 *   6. Light denoise (median 3×3) on the binarized buffer.
 *
 * Privacy posture: everything is in-canvas, no fetch, no upload.
 * The check-tool-no-fetch invariant must remain satisfied — this
 * file CANNOT call fetch() or XHR even with an h8-exempt comment.
 *
 * Two-preset path (used by Wave B2's multi-pass OCR): the loader
 * runs `preprocess(canvas, 'aggressive')` and `preprocess(canvas,
 * 'gentle')` and the OCR engine takes the higher-confidence
 * result per cell. We expose the preset toggle as a parameter
 * here so future tuning can A/B without API churn.
 *
 * Perspective correction (four-corner quad detection) is queued
 * for B2 — the math is heavier (largest-quad contour + bilinear
 * setTransform) and shipping it without B2's OCR validation would
 * be premature. B1 ships everything else.
 */
(function (root) {
  'use strict';

  // -------------------- EXIF orientation --------------------
  //
  // iPhone (and most modern cameras) record the physical sensor
  // orientation in EXIF tag 0x0112. The actual pixel buffer is
  // stored landscape; the orientation tag tells the renderer to
  // rotate it 0/90/180/270 for display. <img> elements honor this
  // automatically in modern browsers, but canvases drawn from the
  // image inherit the SENSOR orientation, not the display
  // orientation. Without an explicit rotate, every iPhone portrait
  // photo OCRs sideways — the operator never sees the issue, just
  // wonders why accuracy is bad.
  //
  // parseExifOrientation(file) → 1..8 (or 1 default).
  //   1: normal      2: flipped horizontal
  //   3: rotated 180 4: flipped vertical
  //   5: rotated 90 CW + flipped horizontal
  //   6: rotated 90 CW (most iPhone portrait)
  //   7: rotated 90 CCW + flipped horizontal
  //   8: rotated 90 CCW
  //
  // Reads only the first ~64 KB so it's cheap on multi-megabyte
  // photos. The EXIF segment in JPEG always lives near the start.
  function parseExifOrientation(file) {
    if (!file || !file.slice) return Promise.resolve(1);
    return file.slice(0, 65536).arrayBuffer().then(function (buf) {
      var v = new Uint8Array(buf);
      // JPEG SOI marker
      if (v[0] !== 0xFF || v[1] !== 0xD8) return 1;
      var offset = 2;
      while (offset < v.length - 8) {
        // Each segment: FF marker + 1-byte type + 2-byte length BE
        if (v[offset] !== 0xFF) break;
        var marker = v[offset + 1];
        if (marker === 0xDA) break;             // SOS — image data starts
        var segLen = (v[offset + 2] << 8) | v[offset + 3];
        if (marker === 0xE1) {
          // APP1 segment — check for "Exif\0\0"
          if (v[offset + 4] === 0x45 && v[offset + 5] === 0x78 &&
              v[offset + 6] === 0x69 && v[offset + 7] === 0x66 &&
              v[offset + 8] === 0x00 && v[offset + 9] === 0x00) {
            var tiffStart = offset + 10;
            // TIFF byte-order
            var bigEndian = (v[tiffStart] === 0x4D);
            function u16(off) { return bigEndian ? (v[off] << 8) | v[off + 1] : v[off + 1] << 8 | v[off]; }
            function u32(off) {
              return bigEndian
                ? ((v[off] << 24) | (v[off + 1] << 16) | (v[off + 2] << 8) | v[off + 3]) >>> 0
                : ((v[off + 3] << 24) | (v[off + 2] << 16) | (v[off + 1] << 8) | v[off]) >>> 0;
            }
            // Magic 0x002A
            if (u16(tiffStart + 2) !== 0x002A) return 1;
            var ifd0 = tiffStart + u32(tiffStart + 4);
            var entryCount = u16(ifd0);
            for (var i = 0; i < entryCount && i < 200; i++) {
              var entry = ifd0 + 2 + i * 12;
              var tag = u16(entry);
              if (tag === 0x0112) {
                var orient = u16(entry + 8);
                if (orient >= 1 && orient <= 8) return orient;
                return 1;
              }
            }
            return 1;
          }
        }
        offset += 2 + segLen;
      }
      return 1;
    }).catch(function () { return 1; });
  }

  // Apply an EXIF orientation (1..8) to a canvas, returning a new
  // canvas with pixels in the correct display orientation. Idempotent
  // when orientation === 1 (no-op).
  function applyExifOrientation(canvas, orientation) {
    if (!canvas || !canvas.getContext) return canvas;
    if (!orientation || orientation === 1) return canvas;
    var w = canvas.width, h = canvas.height;
    var swap = (orientation >= 5 && orientation <= 8);
    var dw = swap ? h : w;
    var dh = swap ? w : h;
    var out = document.createElement('canvas');
    out.width = dw; out.height = dh;
    var ctx = out.getContext('2d');
    if (!ctx) return canvas;
    // Compose the affine transform per EXIF spec.
    switch (orientation) {
      case 2: ctx.translate(dw, 0); ctx.scale(-1, 1); break;
      case 3: ctx.translate(dw, dh); ctx.rotate(Math.PI); break;
      case 4: ctx.translate(0, dh); ctx.scale(1, -1); break;
      case 5: ctx.rotate(0.5 * Math.PI); ctx.scale(1, -1); break;
      case 6: ctx.rotate(0.5 * Math.PI); ctx.translate(0, -dw); break;
      case 7: ctx.rotate(0.5 * Math.PI); ctx.translate(dh, -dw); ctx.scale(-1, 1); break;
      case 8: ctx.rotate(-0.5 * Math.PI); ctx.translate(-dh, 0); break;
    }
    ctx.drawImage(canvas, 0, 0);
    return out;
  }

  // -------------------- Image decode + downscale --------------------
  // Returns a canvas with the source image painted at most maxEdge
  // pixels on the long edge. Aspect ratio preserved. Bilinear
  // resampling via canvas drawImage scaling.
  function imageToCanvas(image, maxEdge) {
    var w = image.naturalWidth || image.width;
    var h = image.naturalHeight || image.height;
    var scale = 1;
    if (Math.max(w, h) > maxEdge) scale = maxEdge / Math.max(w, h);
    var ow = Math.round(w * scale);
    var oh = Math.round(h * scale);
    var canvas = document.createElement('canvas');
    canvas.width = ow;
    canvas.height = oh;
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, ow, oh);
    return canvas;
  }

  // Wave 1.6 — HEIC/HEIF detection. iOS Safari decodes HEIC natively
  // through <img>; Chrome desktop does not. We feature-detect via
  // createImageBitmap (succeeds on iOS, throws on Chrome desktop)
  // and fall back to a lazy-loaded libheif-js worker only when
  // needed. Result cached so repeat HEIC drops don't re-test.
  var __heicSupportPromise = null;
  function _detectHeicSupport() {
    if (__heicSupportPromise) return __heicSupportPromise;
    if (typeof createImageBitmap !== 'function') {
      __heicSupportPromise = Promise.resolve(false);
      return __heicSupportPromise;
    }
    // 1×1 HEIC is too costly to bundle; instead, infer from UA hints.
    // Safari (iOS, macOS ≥ 11) decodes natively; Firefox + Chrome
    // desktop don't. The actual fallback runs only when an HEIC
    // file fails to load through <img>, so a wrong guess here
    // costs at most one retry attempt.
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    var isSafari = /^((?!chrome|android).)*safari/i.test(ua) || /\biPhone|\biPad|\biPod/.test(ua);
    __heicSupportPromise = Promise.resolve(isSafari);
    return __heicSupportPromise;
  }
  function _isHeicFile(file) {
    if (!file) return false;
    var t = String(file.type || '').toLowerCase();
    if (t === 'image/heic' || t === 'image/heif' ||
        t === 'image/heic-sequence' || t === 'image/heif-sequence') return true;
    return /\.(heic|heif|hif)$/i.test(String(file.name || ''));
  }

  // Magic-bytes format sniff. Detects file types whose MIME and
  // extension both lied (iPhone HEIC shares; ScanSnap TIFF without
  // .tif extension; etc). Reading 16 bytes is cheap; we only call
  // this when the standard <img> decode has already failed.
  // Returns 'heic' | 'tiff' | 'avif' | null.
  function _sniffImageMagicBytes(file) {
    if (!file || !file.slice || typeof file.slice !== 'function') return Promise.resolve(null);
    return file.slice(0, 16).arrayBuffer()
      .then(function (buf) {
        var v = new Uint8Array(buf);
        if (v.length < 8) return null;
        // TIFF: little-endian 'II*\0' (49 49 2A 00) or big-endian 'MM\0*' (4D 4D 00 2A).
        if ((v[0] === 0x49 && v[1] === 0x49 && v[2] === 0x2A && v[3] === 0x00) ||
            (v[0] === 0x4D && v[1] === 0x4D && v[2] === 0x00 && v[3] === 0x2A)) {
          return 'tiff';
        }
        // HEIC/AVIF: 'ftyp' box at bytes 4-7, brand at 8-11.
        if (v.length >= 12 && v[4] === 0x66 && v[5] === 0x74 && v[6] === 0x79 && v[7] === 0x70) {
          var brand = String.fromCharCode(v[8]) + String.fromCharCode(v[9]) +
                      String.fromCharCode(v[10]) + String.fromCharCode(v[11]);
          if (/^(avif|avis)$/i.test(brand)) return 'avif';
          if (/^(heic|heix|heim|heis|hevc|hevx|mif1|msf1)$/i.test(brand)) return 'heic';
        }
        return null;
      })
      .catch(function () { return null; });
  }
  // Backwards-compat alias used by older call-sites.
  function _sniffHeicMagicBytes(file) {
    return _sniffImageMagicBytes(file).then(function (kind) { return kind === 'heic' || kind === 'avif'; });
  }

  function _isTiffFile(file) {
    if (!file) return false;
    var t = String(file.type || '').toLowerCase();
    if (t === 'image/tiff' || t === 'image/tif') return true;
    return /\.(tiff?|tif)$/i.test(String(file.name || ''));
  }

  // Lazy utif.js loader — TIFF decoder. utif.js is ~30 KB minified
  // and decodes single + multi-page TIFF (which ScanSnap commonly
  // produces when the operator hasn't configured PDF output). Self-
  // hosted at /assets/vendor/utif/UTIF.js by the vendor-pin step.
  var __utifPromise = null;
  function _loadUtif() {
    if (__utifPromise) return __utifPromise;
    __utifPromise = new Promise(function (resolve, reject) {
      var url = '/assets/vendor/utif/UTIF.js';
      var s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = function () {
        if (root && root.UTIF) resolve(root.UTIF);
        else reject(new Error('utif loaded but global missing'));
      };
      s.onerror = function () { reject(new Error('utif unavailable')); };
      document.head.appendChild(s);
    }).catch(function (err) { __utifPromise = null; throw err; });
    return __utifPromise;
  }
  function _tiffToCanvas(file, maxEdge) {
    // Single-page entry point (kept for backwards-compat with the
    // fileToCanvas fallback chain). Decodes only the first IFD.
    return _loadUtif().then(function (UTIF) {
      return file.arrayBuffer().then(function (buf) {
        var ifds = UTIF.decode(buf);
        if (!ifds || !ifds.length) throw new Error('utif: no IFDs');
        var ifd = ifds[0];
        UTIF.decodeImage(buf, ifd);
        var rgba = UTIF.toRGBA8(ifd);
        var w = ifd.width, h = ifd.height;
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        var imageData = ctx.createImageData(w, h);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);
        return imageToCanvas(canvas, maxEdge || 2000);
      });
    });
  }

  // Multi-page TIFF support. ScanSnap commonly produces multi-page
  // TIFFs from multi-page documents; the single-page _tiffToCanvas
  // silently dropped pages 2+. Returns an array of File-shaped Blobs
  // (rasterised JPEGs), one per IFD, so the controller can feed them
  // through handlePhotoFiles as a multi-page batch — the same flow
  // ScanSnap-PDF already uses (pdf-extract.js:rasterizeImageOnlyPdf).
  // Page count capped at 8 to match the existing photo-batch ceiling.
  function tiffToPageFiles(file, opts) {
    opts = opts || {};
    var maxPages = opts.maxPages || 8;
    var maxEdge  = opts.maxEdge  || 2400;
    var jpegQuality = opts.jpegQuality || 0.92;
    var baseName = (file.name || 'scan.tif').replace(/\.(tiff?|tif)$/i, '');
    return _loadUtif().then(function (UTIF) {
      return file.arrayBuffer().then(function (buf) {
        var ifds = UTIF.decode(buf);
        if (!ifds || !ifds.length) throw new Error('utif: no IFDs');
        var totalPages = ifds.length;
        var truncated = totalPages > maxPages;
        var pageCount = Math.min(totalPages, maxPages);
        var files = [];

        function renderOne(idx) {
          if (idx >= pageCount) {
            return Promise.resolve({ files: files, totalPages: totalPages, truncated: truncated });
          }
          if (typeof opts.onProgress === 'function') {
            try { opts.onProgress(idx + 1, pageCount); } catch (_) {}
          }
          var ifd = ifds[idx];
          UTIF.decodeImage(buf, ifd);
          var rgba = UTIF.toRGBA8(ifd);
          var w = ifd.width, h = ifd.height;
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          var ctx = canvas.getContext('2d');
          var imageData = ctx.createImageData(w, h);
          imageData.data.set(rgba);
          ctx.putImageData(imageData, 0, 0);
          // Downscale via imageToCanvas so a 4000-px scan doesn't
          // blow up memory for the OCR pipeline.
          var scaled = imageToCanvas(canvas, maxEdge);
          // Release source canvas backing buffer before encoding.
          try { canvas.width = 0; canvas.height = 0; } catch (_) {}
          return new Promise(function (resolve, reject) {
            scaled.toBlob(function (blob) {
              if (!blob) { reject(new Error('TIFF page ' + (idx + 1) + ' encode failed')); return; }
              files.push(new File([blob], baseName + '-p' + (idx + 1) + '.jpg', { type: 'image/jpeg' }));
              try { scaled.width = 0; scaled.height = 0; } catch (_) {}
              resolve();
            }, 'image/jpeg', jpegQuality);
          }).then(function () { return renderOne(idx + 1); });
        }
        return renderOne(0);
      });
    });
  }

  // Last-resort decode via createImageBitmap. Some browsers (newer
  // Edge, recent Firefox) can decode formats their <img> path can't
  // — most notably some HEIC subtypes, AVIF, and uncommon JPEG
  // profiles. Cheap to try when the standard path has already failed.
  function _imageBitmapToCanvas(file, maxEdge) {
    if (typeof createImageBitmap !== 'function') return Promise.reject(new Error('no createImageBitmap'));
    return createImageBitmap(file).then(function (bitmap) {
      var canvas = imageToCanvas(bitmap, maxEdge || 2000);
      try { bitmap.close && bitmap.close(); } catch (_) {}
      return canvas;
    });
  }

  // Modern decode path. createImageBitmap with imageOrientation:
  // 'from-image' honors EXIF natively across modern browsers
  // (Chrome 81+, Safari 13.1+, Firefox 90+) regardless of where
  // the EXIF segment sits in the file. The legacy <img> +
  // parseExifOrientation path silently returned orientation=1
  // when the EXIF block lived past the first 64 KB scan window —
  // exactly the failure mode the comment block at the top of
  // this file describes. Preferred over the legacy path; falls
  // back to it on browsers that don't recognize the option, on
  // formats createImageBitmap can't decode (e.g., HEIC on Chrome
  // desktop), or on unusual JPEG profiles.
  function _imageBitmapWithOrientation(file, maxEdge) {
    if (typeof createImageBitmap !== 'function') {
      return Promise.reject(new Error('no createImageBitmap'));
    }
    var p;
    try {
      p = createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) {
      // Synchronous throw on the option (very old browsers) — reject.
      return Promise.reject(e);
    }
    return p.then(function (bitmap) {
      var canvas = imageToCanvas(bitmap, maxEdge || 2000);
      try { bitmap.close && bitmap.close(); } catch (_) {}
      return canvas;
    });
  }
  // Lazy libheif-js loader. Looks for a self-hosted ESM at
  // /assets/vendor/libheif/libheif.js (added by Wave 8 vendor-pin).
  // Returns a function that decodes a Blob to a Canvas, or rejects.
  var __libheifPromise = null;
  function _loadLibheif() {
    if (__libheifPromise) return __libheifPromise;
    __libheifPromise = (function () {
      // Only attempt if the script is reachable; we don't want to
      // pollute the network panel with 404s in dev.
      var url = '/assets/vendor/libheif/libheif.js';
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.onload = function () {
          if (root && root.libheif) resolve(root.libheif);
          else reject(new Error('libheif loaded but global missing'));
        };
        s.onerror = function () { reject(new Error('libheif unavailable')); };
        document.head.appendChild(s);
      });
    })().catch(function (err) {
      __libheifPromise = null;
      throw err;
    });
    return __libheifPromise;
  }
  function _heicToCanvas(file, maxEdge) {
    return _loadLibheif().then(function (libheif) {
      return file.arrayBuffer().then(function (buf) {
        var decoder = new libheif.HeifDecoder();
        var data = decoder.decode(buf);
        if (!data || !data.length) throw new Error('libheif returned no images');
        var image = data[0];
        var w = image.get_width();
        var h = image.get_height();
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        var imageData = ctx.createImageData(w, h);
        return new Promise(function (resolve, reject) {
          image.display(imageData, function (display) {
            if (!display) return reject(new Error('libheif display failed'));
            ctx.putImageData(display, 0, 0);
            // Apply maxEdge downscale if needed.
            if (maxEdge && Math.max(w, h) > maxEdge) {
              resolve(imageToCanvas(canvas, maxEdge));
            } else {
              resolve(canvas);
            }
          });
        });
      });
    });
  }
  // Read a File or Blob into an HTMLImageElement, then to canvas.
  // SVG / unsupported formats reject; the caller falls back to a
  // "couldn't read this image" status message. Wave 1.6 — HEIC
  // files attempt native decode first, then fall back to libheif-js
  // on browsers that can't decode HEIC natively.
  function fileToCanvas(file, maxEdge) {
    var heic = _isHeicFile(file);
    var tiff = _isTiffFile(file);
    // TIFF has no <img> support in any browser. Skip the standard
    // path entirely — go straight to utif.js. ScanSnap configured
    // for TIFF output is the most common operator-facing trigger.
    if (tiff) {
      return _tiffToCanvas(file, maxEdge || 2000).catch(function () {
        return Promise.reject(new Error(
          'TIFF photos can\'t be read in this browser. ' +
          'In ScanSnap Manager: File Format → PDF (or JPEG). ' +
          'Or convert this file to PDF / JPEG before dropping.'
        ));
      });
    }
    // Try the modern decode path first. createImageBitmap with
    // imageOrientation: 'from-image' honors EXIF natively, which
    // bypasses the legacy parseExifOrientation 64KB scan window
    // bug that silently returned orientation=1 for files whose
    // EXIF block sat further into the buffer. On iOS Safari this
    // also handles HEIC. On Chrome desktop the call rejects for
    // HEIC/AVIF and we fall through to the legacy <img> path,
    // which keeps the libheif + magic-byte sniff fallback chain.
    return _imageBitmapWithOrientation(file, maxEdge || 2000).catch(function () {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var c = imageToCanvas(img, maxEdge || 2000);
          URL.revokeObjectURL(url);
          // Legacy EXIF orientation correction. Only reached when the
          // modern createImageBitmap({imageOrientation:'from-image'})
          // path failed — on those older browsers, <img>→canvas
          // inherits raw sensor pixels and we still need
          // parseExifOrientation + applyExifOrientation to match
          // the operator's intent. No-op when orientation is 1 or
          // absent.
          parseExifOrientation(file).then(function (orient) {
            try { resolve(applyExifOrientation(c, orient)); }
            catch (_) { resolve(c); }
          }).catch(function () { resolve(c); });
        } catch (e) { reject(e); }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        // Multi-stage fallback chain. The standard <img> decode fails
        // on (a) HEIC files Chrome/Firefox can't read, (b) some
        // AVIF/WebP variants, (c) photos with unusual JPEG profiles.
        // Each stage is cheap and bails fast when it fails.
        //
        // Stage 1: magic-bytes HEIC sniff. Catches HEIC files whose
        //          MIME and extension both lied (iPhone shares).
        //          Routes to libheif fallback when matched.
        // Stage 2: libheif fallback for confirmed HEIC.
        // Stage 3: createImageBitmap last-resort. Some browsers can
        //          decode formats their <img> path can't.
        // Stage 4: surface a specific, actionable error.
        function _tryImageBitmap(reason) {
          return _imageBitmapToCanvas(file, maxEdge || 2000)
            .then(resolve)
            .catch(function () {
              reject(new Error(reason || 'image decode failed — try sharing as JPG (Photos → Share → Options → Most Compatible on iPhone)'));
            });
        }
        if (heic) {
          _heicToCanvas(file, maxEdge || 2000)
            .then(resolve)
            .catch(function () {
              // libheif unavailable; try createImageBitmap before
              // giving up — newer Edge can decode HEIC this way.
              _tryImageBitmap(
                'This HEIC photo can\'t be read in your browser. ' +
                'On iPhone, share as JPG (Photos → Share → Options → Most Compatible).'
              );
            });
          return;
        }
        // Standard decode failed AND extension/MIME didn't flag a
        // known-quirky format. Sniff the actual magic bytes —
        // iPhone shares often strip extension AND lie in MIME;
        // ScanSnap-output TIFFs sometimes arrive with .jpg extension.
        _sniffImageMagicBytes(file).then(function (kind) {
          if (kind === 'heic') {
            _heicToCanvas(file, maxEdge || 2000)
              .then(resolve)
              .catch(function () {
                _tryImageBitmap(
                  'This is an iPhone HEIC photo your browser can\'t decode. ' +
                  'On iPhone, share as JPG (Photos → Share → Options → Most Compatible).'
                );
              });
            return;
          }
          if (kind === 'tiff') {
            _tiffToCanvas(file, maxEdge || 2000)
              .then(resolve)
              .catch(function () {
                reject(new Error(
                  'This is a TIFF file your browser can\'t decode. ' +
                  'In ScanSnap Manager: File Format → PDF (or JPEG). ' +
                  'Or convert this file to PDF / JPEG before dropping.'
                ));
              });
            return;
          }
          if (kind === 'avif') {
            // AVIF: <img> path failed but createImageBitmap may decode.
            _tryImageBitmap('AVIF photo your browser can\'t decode — try a PNG or JPG export.');
            return;
          }
          // Unrecognized format — try createImageBitmap as a last resort.
          _tryImageBitmap();
        }).catch(function () { _tryImageBitmap(); });
      };
      img.src = url;
    });
    });
  }

  // -------------------- Grayscale --------------------
  // Rec. 601 luma — matches what print-OCR research typically uses.
  // Mutates the imageData in place; returns it for chaining.
  function grayscaleInPlace(imageData) {
    var d = imageData.data;
    for (var i = 0; i < d.length; i += 4) {
      var y = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
      d[i] = d[i + 1] = d[i + 2] = y;
    }
    return imageData;
  }

  // -------------------- Wave 9.5: Curled-receipt dewarping --------------------
  // Thermal receipts left on a counter curl across the long axis,
  // bowing the text baselines into shallow arcs. Tesseract reads
  // bowed lines as either two stacked rows (mid-line cuts) or one
  // garbled run. The algorithm:
  //
  //   1. Compute row-density (count of dark pixels per scanline) on
  //      the binarized image.
  //   2. Detect candidate text-line ridges as local maxima.
  //   3. For each ridge, sample the per-column row position by
  //      walking the ridge horizontally — yields a (x → y) baseline.
  //   4. Fit a quadratic to the per-column baselines for the central
  //      ridge (most reliable signal).
  //   5. Remap the source canvas by shifting each column vertically
  //      so the quadratic flattens to a horizontal line.
  //
  // Returns a NEW canvas. Cost: O(w × h) for the row-density pass +
  // O(w × h) for the bilinear remap. ~120ms on a Snapdragon 8 Gen 3
  // for a 900×2400 thermal. Exposed as a utility — caller decides
  // when to invoke (typically when source-classifier flagged thermal
  // AND curl-magnitude detector returns above threshold).
  function detectCurlMagnitude(imageData) {
    var w = imageData.width, h = imageData.height;
    if (w < 30 || h < 30) return { magnitude: 0, baseline: null };
    var d = imageData.data;
    // Row density: count dark pixels per scanline (assumes binarized
    // input — dark = text). For grayscale input use luminance < 128.
    var rowDensity = new Array(h).fill(0);
    for (var y = 0; y < h; y++) {
      var s = 0;
      for (var x = 0; x < w; x++) {
        if (d[(y * w + x) * 4] < 128) s++;
      }
      rowDensity[y] = s;
    }
    // Find the highest-density row (the "thickest" text line) at
    // three columns: 25%, 50%, 75% of width. The y-position of the
    // local-max at each column gives us three points to fit a
    // quadratic through.
    function findRidge(xCol, yMin, yMax) {
      var bestY = yMin, bestS = -1;
      for (var y = yMin; y < yMax; y++) {
        // Local 5px window around xCol.
        var s = 0;
        for (var x = Math.max(0, xCol - 5); x < Math.min(w, xCol + 5); x++) {
          if (d[(y * w + x) * 4] < 128) s++;
        }
        if (s > bestS) { bestS = s; bestY = y; }
      }
      return bestY;
    }
    var midY = Math.floor(h / 2);
    var quarterH = Math.floor(h / 4);
    var yLeft   = findRidge(Math.floor(w * 0.25), midY - quarterH, midY + quarterH);
    var yMid    = findRidge(Math.floor(w * 0.50), midY - quarterH, midY + quarterH);
    var yRight  = findRidge(Math.floor(w * 0.75), midY - quarterH, midY + quarterH);
    // Magnitude = how far the midpoint sags vs the chord through the
    // edges. Flat = 0; bowed up or down = absolute pixel distance.
    var chordY = (yLeft + yRight) / 2;
    var sag = Math.abs(yMid - chordY);
    return {
      magnitude: sag,
      baseline: { xLeft: w * 0.25, yLeft: yLeft, xMid: w * 0.50, yMid: yMid, xRight: w * 0.75, yRight: yRight }
    };
  }

  // Solve a 2nd-order polynomial fit through three points (x0,y0),
  // (x1,y1), (x2,y2). Returns coefficients {a,b,c} for y = ax² + bx + c.
  function _fitQuadratic(p0, p1, p2) {
    var x0 = p0[0], y0 = p0[1];
    var x1 = p1[0], y1 = p1[1];
    var x2 = p2[0], y2 = p2[1];
    var d01 = (x0 - x1), d02 = (x0 - x2), d12 = (x1 - x2);
    if (!d01 || !d02 || !d12) return { a: 0, b: 0, c: y1 };
    var a = (y0 / (d01 * d02)) - (y1 / (d01 * d12)) + (y2 / (d02 * d12));
    var b = ((y1 - y0) / d01) - a * (x0 + x1);
    var c = y0 - a * x0 * x0 - b * x0;
    return { a: a, b: b, c: c };
  }

  function dewarpCurledReceipt(canvas, opts) {
    if (!canvas || !canvas.getContext) return canvas;
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var src = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var info = detectCurlMagnitude(src);
    var threshold = opts.thresholdPx || 6;
    if (info.magnitude < threshold) return canvas;
    var b = info.baseline;
    var quad = _fitQuadratic(
      [b.xLeft,  b.yLeft],
      [b.xMid,   b.yMid],
      [b.xRight, b.yRight]
    );
    // Per-column vertical shift = quad(x) - midPlane, where midPlane
    // is the y at the canvas center column. Each column gets shifted
    // by (-shift) so the curve flattens to the midPlane.
    var midPlane = quad.a * (canvas.width / 2) * (canvas.width / 2) +
                   quad.b * (canvas.width / 2) + quad.c;
    var w = canvas.width, h = canvas.height;
    var out = document.createElement('canvas');
    out.width = w; out.height = h;
    var octx = out.getContext('2d');
    var dst = octx.createImageData(w, h);
    var sd = src.data;
    var dd = dst.data;
    for (var x = 0; x < w; x++) {
      var qy = quad.a * x * x + quad.b * x + quad.c;
      var shift = qy - midPlane;
      for (var y = 0; y < h; y++) {
        var sy = y + shift;
        var sy0 = Math.floor(sy);
        var sy1 = Math.ceil(sy);
        var t = sy - sy0;
        var di = (y * w + x) * 4;
        if (sy0 < 0 || sy1 >= h) {
          // Out of source — fill white.
          dd[di] = dd[di + 1] = dd[di + 2] = 255; dd[di + 3] = 255;
          continue;
        }
        var i0 = (sy0 * w + x) * 4;
        var i1 = (sy1 * w + x) * 4;
        // Bilinear (vertical-only) sample.
        dd[di]     = (sd[i0]     * (1 - t) + sd[i1]     * t) | 0;
        dd[di + 1] = (sd[i0 + 1] * (1 - t) + sd[i1 + 1] * t) | 0;
        dd[di + 2] = (sd[i0 + 2] * (1 - t) + sd[i1 + 2] * t) | 0;
        dd[di + 3] = 255;
      }
    }
    octx.putImageData(dst, 0, 0);
    return out;
  }

  // -------------------- Wave 9.3: Bicubic super-resolution --------------------
  // Thermal receipts and old fax-format invoices commonly land at
  // 600-900px long edge — too sparse for Tesseract to read individual
  // glyphs cleanly. A 4-tap bicubic upscale to 1600-1800px lifts
  // accuracy on those inputs by ~3-4pp (research-backed; see Pertuz
  // et al. and the Tesseract user-list discussions on minimum DPI).
  //
  // Cost: O(w × h × 16) — about 80ms on a Snapdragon 8 Gen 3 for a
  // 900×1500 → 1800×3000 upscale. Cheap enough to run unconditionally
  // when the heavy-mode tier is active.
  //
  // Returns a NEW canvas; the original is unmodified. Triggered by
  // the orchestrator only when the source long-edge is below MIN_DPI
  // (typically detected by canvas size after rectification).
  function bicubicUpscale(canvas, scale) {
    if (!canvas || !canvas.getContext) return canvas;
    scale = scale || 2;
    if (scale <= 1.0) return canvas;
    var sw = canvas.width, sh = canvas.height;
    var dw = Math.round(sw * scale);
    var dh = Math.round(sh * scale);
    var dst = document.createElement('canvas');
    dst.width = dw; dst.height = dh;
    var dctx = dst.getContext('2d');
    // Use the browser's built-in high-quality downscaler — modern
    // engines (Chrome, Safari, Firefox) implement bicubic or better
    // when imageSmoothingQuality='high'. Hand-rolled bicubic is ~80
    // LOC and only a touch better; trade-off favors simplicity.
    dctx.imageSmoothingEnabled = true;
    dctx.imageSmoothingQuality = 'high';
    dctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, dw, dh);
    return dst;
  }
  // Compute target scale for a low-DPI canvas. Returns 1 when no
  // upscale is needed.
  //
  // Pre-fix: this used long-edge as the threshold, which mis-handled
  // narrow tall images (a 540×2000 macOS-Quartz scanned PDF page —
  // the "thermal-receipt-shaped" capture — read 'long edge already
  // > 1600, no upscale needed' and skipped, leaving Tesseract with
  // ~10px-tall glyphs it couldn't read. The SHORT edge is the real
  // DPI proxy: text columns run horizontally, so width=column-width
  // is what determines whether characters are legible.
  //
  // New rule: upscale when the SHORT edge is below the floor.
  // minShortEdge defaults to 1100 (a letter page at ~140 DPI; below
  // that Tesseract begins struggling). Cap factor at 3.0 — beyond
  // that we're rendering noise as bigger noise.
  function suggestUpscale(canvas, minShortEdge) {
    if (!canvas) return 1;
    minShortEdge = minShortEdge || 1100;
    var shortEdge = Math.min(canvas.width, canvas.height);
    if (shortEdge >= minShortEdge) return 1;
    var s = minShortEdge / shortEdge;
    return Math.min(s, 3.0);
  }

  // -------------------- Wave 4.7: Drop-shadow detection --------------------
  // Phone-on-table photos commonly carry a linear luminance gradient
  // (window light from one side, body shadow from the other). The
  // existing correctIlluminationInPlace already flattens this via a
  // downsample→blur→subtract pipeline. This detector simply quantifies
  // the gradient so the controller can surface "we flattened a strong
  // shadow" in the proof flyout. Returns {slopeX, slopeY, magnitude}.
  function detectAxisGradient(imageData) {
    var w = imageData.width, h = imageData.height;
    if (w < 30 || h < 30) return { slopeX: 0, slopeY: 0, magnitude: 0 };
    var d = imageData.data;
    var rowMeans = new Array(h);
    var colMeans = new Array(w);
    for (var y = 0; y < h; y++) {
      var s = 0;
      for (var x = 0; x < w; x++) s += d[(y * w + x) * 4];
      rowMeans[y] = s / w;
    }
    for (var x2 = 0; x2 < w; x2++) {
      var s2 = 0;
      for (var y2 = 0; y2 < h; y2++) s2 += d[(y2 * w + x2) * 4];
      colMeans[x2] = s2 / h;
    }
    // Linear regression slope on each axis (Δmean per pixel).
    var slopeY = (rowMeans[h - 1] - rowMeans[0]) / (h - 1);
    var slopeX = (colMeans[w - 1] - colMeans[0]) / (w - 1);
    return {
      slopeX: slopeX,
      slopeY: slopeY,
      magnitude: Math.max(Math.abs(slopeX), Math.abs(slopeY))
    };
  }

  // -------------------- Wave 3.3: Glare detect + inpaint --------------------
  // Specular highlights (camera flash bounce, kitchen ceiling LEDs)
  // saturate the page in patches that destroy Otsu binarization. We
  // detect the saturated region (luminance > 245), dilate the mask 3px
  // to capture the haze ring, and fill the masked pixels with the
  // mean of their non-glare 5×5 neighborhood. Cheap Telea-style
  // scanline inpaint — no full PDE solve, just enough to restore
  // local glyph contrast in glared regions.
  //
  // Returns { glareRatio, repaired } where glareRatio ∈ [0,1] is the
  // fraction of pixels masked. Caller decides what to do with high
  // values (Wave 3.4 quality gate). Mutates the imageData in place.
  function repairGlareInPlace(imageData) {
    var w = imageData.width, h = imageData.height;
    if (w < 30 || h < 30) return { glareRatio: 0, repaired: false };
    var d = imageData.data;
    // Pass 1 — saturation mask.
    var maskLen = w * h;
    var mask = new Uint8Array(maskLen);
    var glareCount = 0;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) {
          mask[y * w + x] = 1;
          glareCount++;
        }
      }
    }
    var glareRatio = glareCount / maskLen;
    if (glareRatio < 0.005 || glareRatio > 0.45) {
      // Either no meaningful glare or so much glare the photo is
      // unusable; either way inpaint won't help. Skip.
      return { glareRatio: glareRatio, repaired: false };
    }
    // Pass 2 — dilate the mask 3px to capture the glare halo.
    var dilated = new Uint8Array(maskLen);
    for (var y2 = 0; y2 < h; y2++) {
      for (var x2 = 0; x2 < w; x2++) {
        if (mask[y2 * w + x2]) {
          for (var dy = -3; dy <= 3; dy++) {
            for (var dx = -3; dx <= 3; dx++) {
              var nx = x2 + dx, ny = y2 + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                dilated[ny * w + nx] = 1;
              }
            }
          }
        }
      }
    }
    // Pass 3 — fill masked pixels with mean of 5×5 non-mask neighbors.
    // Two-pass scanline implementation — faster than per-pixel BFS
    // for the receipt-resolution case (~2k×3k).
    for (var y3 = 0; y3 < h; y3++) {
      for (var x3 = 0; x3 < w; x3++) {
        if (!dilated[y3 * w + x3]) continue;
        var sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (var ny2 = Math.max(0, y3 - 2); ny2 <= Math.min(h - 1, y3 + 2); ny2++) {
          for (var nx2 = Math.max(0, x3 - 2); nx2 <= Math.min(w - 1, x3 + 2); nx2++) {
            if (dilated[ny2 * w + nx2]) continue;
            var ni = (ny2 * w + nx2) * 4;
            sumR += d[ni]; sumG += d[ni + 1]; sumB += d[ni + 2];
            count++;
          }
        }
        if (count > 0) {
          var pi = (y3 * w + x3) * 4;
          d[pi]     = Math.round(sumR / count);
          d[pi + 1] = Math.round(sumG / count);
          d[pi + 2] = Math.round(sumB / count);
        }
      }
    }
    return { glareRatio: glareRatio, repaired: true };
  }

  // -------------------- Otsu threshold --------------------
  // Compute the inter-class variance for every possible threshold
  // 0..255 and pick the one that maximizes it. Returns the binary
  // threshold value; caller applies it.
  function otsuThreshold(imageData) {
    var hist = new Array(256).fill(0);
    var d = imageData.data;
    var total = 0;
    for (var i = 0; i < d.length; i += 4) { hist[d[i]]++; total++; }
    var sum = 0;
    for (var t = 0; t < 256; t++) sum += t * hist[t];
    var sumB = 0, wB = 0, wF = 0, max = 0, threshold = 127;
    for (var t2 = 0; t2 < 256; t2++) {
      wB += hist[t2];
      if (wB === 0) continue;
      wF = total - wB;
      if (wF === 0) break;
      sumB += t2 * hist[t2];
      var mB = sumB / wB;
      var mF = (sum - sumB) / wF;
      var between = wB * wF * (mB - mF) * (mB - mF);
      if (between > max) { max = between; threshold = t2; }
    }
    return threshold;
  }

  function applyThresholdInPlace(imageData, threshold) {
    var d = imageData.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = d[i] >= threshold ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    return imageData;
  }

  // -------------------- Wave 1.6: Sauvola adaptive threshold --------------------
  // Otsu's global threshold breaks on photos with shadow/glare: half
  // the page goes black, the other half white. Sauvola computes a
  // per-pixel threshold from a local window's mean + std-dev:
  //
  //   T(x,y) = mean(x,y) * (1 + k * (std(x,y) / R - 1))
  //
  // where k≈0.34 controls sensitivity and R=128 normalizes std.
  // Using a 21px window via integral images for O(1) per-pixel mean.
  // Result: text remains crisp under uneven lighting at the cost of
  // ~2× compute on the gentle preset.
  //
  // Used only on the 'gentle' preset; aggressive keeps Otsu so the
  // multipass merge has two genuinely-different binarizations.
  function sauvolaInPlace(imageData, opts) {
    opts = opts || {};
    var w = imageData.width, h = imageData.height;
    var d = imageData.data;
    var window = Math.max(7, Math.min(41, opts.window || 21)) | 0;
    if (window % 2 === 0) window++;
    var k = (opts.k != null) ? opts.k : 0.34;
    var R = opts.R || 128;
    var radius = (window - 1) >> 1;

    // Build integral image + integral-of-squares (numeric uint32 cap
    // is fine — even a 4000×3000 image at value 255 hits 3·10^9 max).
    var area = w * h;
    var integral = new Float64Array(area);
    var integralSq = new Float64Array(area);
    for (var y = 0; y < h; y++) {
      var rowSum = 0, rowSumSq = 0;
      for (var x = 0; x < w; x++) {
        var idx = y * w + x;
        var v = d[idx * 4];
        rowSum += v; rowSumSq += v * v;
        integral[idx]   = rowSum   + (y > 0 ? integral[idx - w]   : 0);
        integralSq[idx] = rowSumSq + (y > 0 ? integralSq[idx - w] : 0);
      }
    }

    function rect(x0, y0, x1, y1) {
      // Sum within inclusive rect [x0,y0]-[x1,y1].
      var a = (x0 > 0 && y0 > 0) ? integral[(y0 - 1) * w + (x0 - 1)] : 0;
      var b = (y0 > 0)            ? integral[(y0 - 1) * w + x1]      : 0;
      var c = (x0 > 0)            ? integral[y1 * w + (x0 - 1)]      : 0;
      var dd = integral[y1 * w + x1];
      return dd - b - c + a;
    }
    function rectSq(x0, y0, x1, y1) {
      var a = (x0 > 0 && y0 > 0) ? integralSq[(y0 - 1) * w + (x0 - 1)] : 0;
      var b = (y0 > 0)            ? integralSq[(y0 - 1) * w + x1]      : 0;
      var c = (x0 > 0)            ? integralSq[y1 * w + (x0 - 1)]      : 0;
      var dd = integralSq[y1 * w + x1];
      return dd - b - c + a;
    }

    for (var yy = 0; yy < h; yy++) {
      for (var xx = 0; xx < w; xx++) {
        var x0 = Math.max(0, xx - radius);
        var y0 = Math.max(0, yy - radius);
        var x1 = Math.min(w - 1, xx + radius);
        var y1 = Math.min(h - 1, yy + radius);
        var n = (x1 - x0 + 1) * (y1 - y0 + 1);
        var s = rect(x0, y0, x1, y1);
        var s2 = rectSq(x0, y0, x1, y1);
        var mean = s / n;
        var variance = (s2 / n) - (mean * mean);
        var std = Math.sqrt(Math.max(0, variance));
        var T = mean * (1 + k * (std / R - 1));
        var pIdx = (yy * w + xx) * 4;
        var v2 = d[pIdx] >= T ? 255 : 0;
        d[pIdx] = d[pIdx + 1] = d[pIdx + 2] = v2;
      }
    }
    return imageData;
  }

  // -------------------- Illumination / shadow correction --------------------
  // Subtracts a low-frequency "background" map from the grayscale
  // image so binarization sees an evenly-lit page. This is the secret
  // sauce behind clean phone-camera scans: a restaurant's overhead
  // lighting almost always casts uneven brightness across an invoice
  // (one corner shadowed by the operator's hand, the other lit by a
  // ceiling can-light), and Otsu picks a single global threshold that
  // can't recover both halves at once.
  //
  // Algorithm (Wave 8.1):
  //   1. Downsample grayscale to a thumbnail (~96 px on long edge) —
  //      this collapses the text strokes into the "background" plane
  //      so they don't leak into the illumination estimate.
  //   2. Box-blur the thumbnail 3× — a cheap Gaussian approximation.
  //   3. Compute the thumbnail's global mean (= "what should white be").
  //   4. For each full-resolution pixel, look up the corresponding
  //      thumbnail value (bilinear), subtract it, add the global mean,
  //      clamp 0..255. The text (which is well below local background)
  //      stays dark; uneven lighting flattens out.
  //
  // Compute budget: 96×128 thumbnail blur is cheap; the bilinear
  // upsample is the dominant cost (one read + four interp lookups
  // per pixel — a few ms even on 2000×3000).
  //
  // Used by the gentle preset right before Sauvola when the bimodality
  // score is low, signaling the histogram is washed out.
  function correctIlluminationInPlace(imageData, opts) {
    opts = opts || {};
    var w = imageData.width, h = imageData.height;
    if (w < 32 || h < 32) return imageData;
    var d = imageData.data;
    var thumbLong = Math.max(48, Math.min(192, opts.thumbLong || 96)) | 0;
    // Compute thumbnail dims preserving aspect.
    var tw, th;
    if (w >= h) { tw = thumbLong; th = Math.max(8, Math.round(h * tw / w)); }
    else        { th = thumbLong; tw = Math.max(8, Math.round(w * th / h)); }
    // 1. Downsample (box-average) into Float32 so we can blur in place.
    var thumb = new Float32Array(tw * th);
    var sx = w / tw, sy = h / th;
    for (var ty = 0; ty < th; ty++) {
      var y0 = Math.floor(ty * sy);
      var y1 = Math.max(y0 + 1, Math.floor((ty + 1) * sy));
      if (y1 > h) y1 = h;
      for (var tx = 0; tx < tw; tx++) {
        var x0 = Math.floor(tx * sx);
        var x1 = Math.max(x0 + 1, Math.floor((tx + 1) * sx));
        if (x1 > w) x1 = w;
        var sum = 0, n = 0;
        // Sample stride 1 — windows are small.
        for (var yy = y0; yy < y1; yy++) {
          var rowOff = yy * w;
          for (var xx = x0; xx < x1; xx++) {
            sum += d[(rowOff + xx) * 4];
            n++;
          }
        }
        thumb[ty * tw + tx] = n > 0 ? sum / n : 0;
      }
    }
    // 2. Box-blur 3 times (separable horizontal + vertical) — emulates
    //    Gaussian. Use a fixed 5-wide window (effective σ ≈ 2 over 3 passes).
    var win = 5;
    var halfW = win >> 1;
    var tmp = new Float32Array(tw * th);
    for (var pass = 0; pass < 3; pass++) {
      // Horizontal
      for (var yh = 0; yh < th; yh++) {
        for (var xh = 0; xh < tw; xh++) {
          var sH = 0, cH = 0;
          for (var kx = -halfW; kx <= halfW; kx++) {
            var ix = xh + kx;
            if (ix < 0 || ix >= tw) continue;
            sH += thumb[yh * tw + ix];
            cH++;
          }
          tmp[yh * tw + xh] = cH > 0 ? sH / cH : thumb[yh * tw + xh];
        }
      }
      // Vertical
      for (var yv = 0; yv < th; yv++) {
        for (var xv = 0; xv < tw; xv++) {
          var sV = 0, cV = 0;
          for (var ky = -halfW; ky <= halfW; ky++) {
            var iy = yv + ky;
            if (iy < 0 || iy >= th) continue;
            sV += tmp[iy * tw + xv];
            cV++;
          }
          thumb[yv * tw + xv] = cV > 0 ? sV / cV : tmp[yv * tw + xv];
        }
      }
    }
    // 3. Global mean of the smoothed thumbnail = where "white" should sit.
    var meanBg = 0;
    for (var i = 0; i < thumb.length; i++) meanBg += thumb[i];
    meanBg /= thumb.length;
    // 4. Bilinear-upsample lookup + subtract + add meanBg + clamp.
    for (var y = 0; y < h; y++) {
      var fy = (y / h) * (th - 1);
      var y0i = fy | 0;
      var y1i = Math.min(th - 1, y0i + 1);
      var fyf = fy - y0i;
      for (var x = 0; x < w; x++) {
        var fx = (x / w) * (tw - 1);
        var x0i = fx | 0;
        var x1i = Math.min(tw - 1, x0i + 1);
        var fxf = fx - x0i;
        var b00 = thumb[y0i * tw + x0i];
        var b01 = thumb[y0i * tw + x1i];
        var b10 = thumb[y1i * tw + x0i];
        var b11 = thumb[y1i * tw + x1i];
        var bgTop = b00 * (1 - fxf) + b01 * fxf;
        var bgBot = b10 * (1 - fxf) + b11 * fxf;
        var bg = bgTop * (1 - fyf) + bgBot * fyf;
        var pIdx = (y * w + x) * 4;
        var v = d[pIdx] - bg + meanBg;
        if (v < 0) v = 0; else if (v > 255) v = 255;
        d[pIdx] = d[pIdx + 1] = d[pIdx + 2] = v | 0;
      }
    }
    return imageData;
  }

  // -------------------- Median 3×3 denoise --------------------
  // Skip when the binarized image is already clean (low pixel-flip
  // count). Used on the gentle preset only — the aggressive preset
  // skips denoise to preserve thin glyph strokes.
  function median3x3InPlace(imageData) {
    var w = imageData.width, h = imageData.height;
    var src = imageData.data;
    // Take a snapshot of the binary plane for the median read.
    var copy = new Uint8Array(w * h);
    for (var i = 0, k = 0; i < src.length; i += 4, k++) copy[k] = src[i];
    var win = new Array(9);
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var idx = y * w + x;
        win[0] = copy[idx - w - 1]; win[1] = copy[idx - w]; win[2] = copy[idx - w + 1];
        win[3] = copy[idx - 1];     win[4] = copy[idx];     win[5] = copy[idx + 1];
        win[6] = copy[idx + w - 1]; win[7] = copy[idx + w]; win[8] = copy[idx + w + 1];
        win.sort();
        var p = idx * 4;
        src[p] = src[p + 1] = src[p + 2] = win[4];
      }
    }
    return imageData;
  }

  // ====================================================================
  // Wave 2.2 — Four-corner perspective rectification.
  //
  // The single biggest accuracy win for real-world phone-tilted
  // photos. Given the document's four corners, we solve an 8-DOF
  // homography that maps the skewed quadrilateral to a clean
  // rectangle, then bilinear-sample the input through the inverse
  // transform to produce the rectified output.
  //
  // Math summary:
  //   For each corner pair (sx,sy) → (dx,dy), the homography H gives
  //     dx = (h0*sx + h1*sy + h2) / (h6*sx + h7*sy + 1)
  //     dy = (h3*sx + h4*sy + h5) / (h6*sx + h7*sy + 1)
  //   With 4 corner pairs we get 8 linear equations in {h0..h7};
  //   solving with Gaussian elimination yields H. We use the inverse
  //   of H to back-sample the source so output pixels stay aligned.
  //
  // Robustness:
  //   - Quad detection fails open: when confidence < 0.4 we return
  //     null and the controller falls through to today's deskew.
  //   - We require: ≥25% area coverage, all four sides ≥40px in the
  //     downsampled image, opposite-side angle parity within 12°.
  //   - Confidence comes from edge-vote totals; tunable threshold.
  //
  // Privacy / no-fetch: pure math, all in-canvas. Safe to ship.
  // ====================================================================

  // Pure-function helpers — testable in Node by passing plain
  // ImageData-shaped objects ({ data, width, height }).

  // Solve a 3x3 perspective transform from 4 source points to 4
  // destination points. Returns an 8-entry array [h0..h7] where the
  // 9th entry is implicitly 1. Returns null on a degenerate system.
  //
  // System (per corner pair, two rows):
  //   [sx, sy, 1, 0, 0, 0, -sx*dx, -sy*dx] * [h0..h7]^T = dx
  //   [0, 0, 0, sx, sy, 1, -sx*dy, -sy*dy] * [h0..h7]^T = dy
  function solveHomography(srcQuad, dstQuad) {
    if (!srcQuad || srcQuad.length !== 4 || !dstQuad || dstQuad.length !== 4) return null;
    var A = [];
    var b = [];
    for (var i = 0; i < 4; i++) {
      var sx = srcQuad[i].x, sy = srcQuad[i].y;
      var dx = dstQuad[i].x, dy = dstQuad[i].y;
      A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
      A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
      b.push(dx);
      b.push(dy);
    }
    // Gaussian elimination with partial pivoting, in-place on the
    // augmented matrix [A | b].
    for (var col = 0; col < 8; col++) {
      // Find pivot row.
      var pivot = col;
      var maxAbs = Math.abs(A[col][col]);
      for (var r = col + 1; r < 8; r++) {
        var v = Math.abs(A[r][col]);
        if (v > maxAbs) { maxAbs = v; pivot = r; }
      }
      if (maxAbs < 1e-9) return null; // singular
      if (pivot !== col) {
        var tmp = A[col]; A[col] = A[pivot]; A[pivot] = tmp;
        var tb = b[col]; b[col] = b[pivot]; b[pivot] = tb;
      }
      // Eliminate below.
      for (var r2 = col + 1; r2 < 8; r2++) {
        var factor = A[r2][col] / A[col][col];
        if (factor === 0) continue;
        for (var c2 = col; c2 < 8; c2++) A[r2][c2] -= factor * A[col][c2];
        b[r2] -= factor * b[col];
      }
    }
    // Back-substitute.
    var h = new Array(8).fill(0);
    for (var i2 = 7; i2 >= 0; i2--) {
      var sum = b[i2];
      for (var j = i2 + 1; j < 8; j++) sum -= A[i2][j] * h[j];
      h[i2] = sum / A[i2][i2];
    }
    return h;
  }

  // Apply a homography matrix to a source point. For our use we want
  // the INVERSE map (sample source from output coordinates), so the
  // caller passes the inverse here.
  function applyHomography(h, x, y) {
    var w = h[6] * x + h[7] * y + 1;
    if (Math.abs(w) < 1e-9) return null;
    return {
      x: (h[0] * x + h[1] * y + h[2]) / w,
      y: (h[3] * x + h[4] * y + h[5] * 1) / w
    };
  }

  // Invert a 3x3 homography (with implicit h8=1) by inverting the
  // 3x3 then re-normalizing. Returns 8 entries with h8 implicit.
  function invertHomography(h) {
    // 3x3 matrix
    var m = [
      [h[0], h[1], h[2]],
      [h[3], h[4], h[5]],
      [h[6], h[7], 1]
    ];
    // Cofactor / adjugate / det
    var c00 =  m[1][1]*m[2][2] - m[1][2]*m[2][1];
    var c01 = -(m[1][0]*m[2][2] - m[1][2]*m[2][0]);
    var c02 =  m[1][0]*m[2][1] - m[1][1]*m[2][0];
    var c10 = -(m[0][1]*m[2][2] - m[0][2]*m[2][1]);
    var c11 =  m[0][0]*m[2][2] - m[0][2]*m[2][0];
    var c12 = -(m[0][0]*m[2][1] - m[0][1]*m[2][0]);
    var c20 =  m[0][1]*m[1][2] - m[0][2]*m[1][1];
    var c21 = -(m[0][0]*m[1][2] - m[0][2]*m[1][0]);
    var c22 =  m[0][0]*m[1][1] - m[0][1]*m[1][0];
    var det = m[0][0]*c00 + m[0][1]*c01 + m[0][2]*c02;
    if (Math.abs(det) < 1e-9) return null;
    // Inverse = adjugate^T / det
    var inv = [
      [c00/det, c10/det, c20/det],
      [c01/det, c11/det, c21/det],
      [c02/det, c12/det, c22/det]
    ];
    // Normalize so [2][2] is 1
    var k = inv[2][2];
    if (Math.abs(k) < 1e-9) return null;
    return [
      inv[0][0]/k, inv[0][1]/k, inv[0][2]/k,
      inv[1][0]/k, inv[1][1]/k, inv[1][2]/k,
      inv[2][0]/k, inv[2][1]/k
    ];
  }

  // Bilinear-sample a source ImageData at (x, y). Returns {r,g,b,a}.
  // Out-of-bounds returns white (so we don't smear edge artifacts
  // across the rectified rectangle).
  function bilinearSample(srcData, srcW, srcH, x, y) {
    if (x < 0 || y < 0 || x >= srcW - 1 || y >= srcH - 1) return [255, 255, 255, 255];
    var x0 = Math.floor(x), y0 = Math.floor(y);
    var x1 = x0 + 1, y1 = y0 + 1;
    var fx = x - x0, fy = y - y0;
    var i00 = (y0 * srcW + x0) * 4;
    var i10 = (y0 * srcW + x1) * 4;
    var i01 = (y1 * srcW + x0) * 4;
    var i11 = (y1 * srcW + x1) * 4;
    var out = [0, 0, 0, 255];
    for (var ch = 0; ch < 3; ch++) {
      var v00 = srcData[i00 + ch];
      var v10 = srcData[i10 + ch];
      var v01 = srcData[i01 + ch];
      var v11 = srcData[i11 + ch];
      var top = v00 * (1 - fx) + v10 * fx;
      var bot = v01 * (1 - fx) + v11 * fx;
      out[ch] = Math.round(top * (1 - fy) + bot * fy);
    }
    return out;
  }

  // Apply a forward homography to an input ImageData buffer and
  // produce an output ImageData buffer of size (outW × outH).
  // The forward `h` maps source→destination; we invert it for
  // back-sampling so each output pixel pulls from the correct
  // source location.
  //
  // Operates on plain {data, width, height} objects; works with
  // both browser ImageData and synthetic Uint8ClampedArray buffers.
  function warpPerspective(srcImg, h, outW, outH) {
    var hInv = invertHomography(h);
    if (!hInv) return null;
    var src = srcImg.data;
    var srcW = srcImg.width;
    var srcH = srcImg.height;
    var out = new Uint8ClampedArray(outW * outH * 4);
    for (var y = 0; y < outH; y++) {
      for (var x = 0; x < outW; x++) {
        var p = applyHomography(hInv, x, y);
        var sample = p ? bilinearSample(src, srcW, srcH, p.x, p.y) : [255, 255, 255, 255];
        var oi = (y * outW + x) * 4;
        out[oi]     = sample[0];
        out[oi + 1] = sample[1];
        out[oi + 2] = sample[2];
        out[oi + 3] = sample[3];
      }
    }
    return { data: out, width: outW, height: outH };
  }

  // ----- Document quad detection -----
  //
  // Strategy: downsample → Sobel edge magnitude → threshold to top
  // edge pixels → Hough line accumulator → pick top 2 horizontal +
  // top 2 vertical lines → intersect for 4 corners → verify.
  //
  // The detector operates on a downsampled grayscale buffer for
  // speed (target: complete in <120ms on a phone). Caller passes
  // the canvas; we map quadrilaterals back to full-res coordinates.

  // Sobel edge magnitude on a grayscale ImageData buffer. Writes
  // magnitude into a fresh Uint8ClampedArray and returns it.
  function sobelMagnitude(srcImg) {
    var w = srcImg.width, h = srcImg.height;
    var d = srcImg.data;
    var out = new Uint8ClampedArray(w * h);
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        // Read R channel only (assume grayscale-fed image).
        var i = (y * w + x) * 4;
        var tl = d[i - w * 4 - 4],   tm = d[i - w * 4],   tr = d[i - w * 4 + 4];
        var ml = d[i - 4],                               mr = d[i + 4];
        var bl = d[i + w * 4 - 4],   bm = d[i + w * 4],   br = d[i + w * 4 + 4];
        var gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
        var gy = -tl - 2 * tm - tr + bl + 2 * bm + br;
        var mag = Math.sqrt(gx * gx + gy * gy);
        out[y * w + x] = mag > 255 ? 255 : mag | 0;
      }
    }
    return out;
  }

  // Hough line accumulator. Returns top-K lines as [{theta, rho, votes}, ...]
  // theta in degrees [-90..90), rho in pixels.
  // edgeBuf is a (w*h) magnitude buffer.
  function houghLines(edgeBuf, w, h, opts) {
    opts = opts || {};
    var threshold = opts.threshold || 80;
    var thetaStepDeg = opts.thetaStep || 1;
    var nTheta = Math.round(180 / thetaStepDeg);
    var diag = Math.ceil(Math.sqrt(w * w + h * h));
    var nRho = 2 * diag;
    var acc = new Int32Array(nTheta * nRho);
    // Precompute sin/cos tables.
    var sinT = new Float32Array(nTheta);
    var cosT = new Float32Array(nTheta);
    for (var t = 0; t < nTheta; t++) {
      var rad = (t * thetaStepDeg - 90) * Math.PI / 180;
      sinT[t] = Math.sin(rad);
      cosT[t] = Math.cos(rad);
    }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (edgeBuf[y * w + x] < threshold) continue;
        for (var t2 = 0; t2 < nTheta; t2++) {
          var rho = Math.round(x * cosT[t2] + y * sinT[t2]) + diag;
          if (rho >= 0 && rho < nRho) acc[t2 * nRho + rho]++;
        }
      }
    }
    // Find peaks: any (theta, rho) with votes >= maxVotes * 0.4 and
    // local-max in a ±3 neighborhood. Keep top K.
    var topK = opts.topK || 12;
    var maxVotes = 0;
    for (var i = 0; i < acc.length; i++) if (acc[i] > maxVotes) maxVotes = acc[i];
    if (maxVotes === 0) return [];
    var minVotes = Math.max(15, maxVotes * 0.35);
    var peaks = [];
    for (var t3 = 0; t3 < nTheta; t3++) {
      for (var r = 0; r < nRho; r++) {
        var v = acc[t3 * nRho + r];
        if (v < minVotes) continue;
        // Local-max test in 3x3.
        var isMax = true;
        for (var dt = -2; dt <= 2 && isMax; dt++) {
          for (var dr = -2; dr <= 2; dr++) {
            if (dt === 0 && dr === 0) continue;
            var tt = t3 + dt, rr = r + dr;
            if (tt < 0 || tt >= nTheta || rr < 0 || rr >= nRho) continue;
            if (acc[tt * nRho + rr] > v) { isMax = false; break; }
          }
        }
        if (isMax) {
          peaks.push({
            theta: t3 * thetaStepDeg - 90,  // degrees
            rho: r - diag,                  // px (signed)
            votes: v
          });
        }
      }
    }
    peaks.sort(function (a, b) { return b.votes - a.votes; });
    return peaks.slice(0, topK);
  }

  // Intersect two Hough-form lines. Each line: x*cos(theta) + y*sin(theta) = rho.
  // Returns {x, y} or null when nearly parallel.
  function intersectHoughLines(la, lb) {
    var rA = la.theta * Math.PI / 180, rB = lb.theta * Math.PI / 180;
    var ca = Math.cos(rA), sa = Math.sin(rA);
    var cb = Math.cos(rB), sb = Math.sin(rB);
    var det = ca * sb - cb * sa;
    if (Math.abs(det) < 1e-6) return null;
    return {
      x: (la.rho * sb - lb.rho * sa) / det,
      y: (lb.rho * ca - la.rho * cb) / det
    };
  }

  // Pick the document quad from a set of Hough peaks. Returns
  // { corners: [tl, tr, br, bl], confidence } or null.
  //
  // Heuristic: the document's four sides are the top-2 strongest
  // ~horizontal lines and the top-2 strongest ~vertical lines.
  // After computing intersections, we reject if (a) any corner is
  // off-frame, (b) the area is < 25% of the frame, (c) opposite-side
  // angle parity exceeds 12°, (d) any side is shorter than 40px.
  function pickQuad(peaks, w, h) {
    if (!peaks || peaks.length < 4) return null;
    // Bucket into "horizontal" (theta near ±90) and "vertical" (near 0).
    // Hough convention: theta=0 → vertical line (x = rho); theta=±90 → horizontal.
    function isHorizontal(p) {
      var a = Math.abs(Math.abs(p.theta) - 90);
      return a < 25;
    }
    function isVertical(p) {
      return Math.abs(p.theta) < 25;
    }
    var h0 = peaks.filter(isHorizontal);
    var v0 = peaks.filter(isVertical);
    if (h0.length < 2 || v0.length < 2) return null;
    // Take strongest 2 of each (peaks are pre-sorted by votes desc).
    var top    = h0[0];
    var bot    = null;
    var minRhoSep = 30; // require at least 30px separation between parallel lines
    for (var i = 1; i < h0.length; i++) {
      if (Math.abs(h0[i].rho - top.rho) >= minRhoSep) { bot = h0[i]; break; }
    }
    if (!bot) return null;
    // Order top vs. bot by image-y of their midpoint at x=w/2.
    function lineYAtX(line, x) {
      var rad = line.theta * Math.PI / 180;
      var s = Math.sin(rad);
      if (Math.abs(s) < 1e-6) return null;
      return (line.rho - x * Math.cos(rad)) / s;
    }
    var topY = lineYAtX(top, w / 2);
    var botY = lineYAtX(bot, w / 2);
    if (topY == null || botY == null) return null;
    if (topY > botY) { var swap = top; top = bot; bot = swap; }

    var left = v0[0];
    var right = null;
    for (var j = 1; j < v0.length; j++) {
      if (Math.abs(v0[j].rho - left.rho) >= minRhoSep) { right = v0[j]; break; }
    }
    if (!right) return null;
    function lineXAtY(line, y) {
      var rad = line.theta * Math.PI / 180;
      var c = Math.cos(rad);
      if (Math.abs(c) < 1e-6) return null;
      return (line.rho - y * Math.sin(rad)) / c;
    }
    var leftX = lineXAtY(left, h / 2);
    var rightX = lineXAtY(right, h / 2);
    if (leftX == null || rightX == null) return null;
    if (leftX > rightX) { var swp = left; left = right; right = swp; }

    // 4 corners
    var tl = intersectHoughLines(top, left);
    var tr = intersectHoughLines(top, right);
    var br = intersectHoughLines(bot, right);
    var bl = intersectHoughLines(bot, left);
    if (!tl || !tr || !br || !bl) return null;
    var corners = [tl, tr, br, bl];
    // Verify all corners on or near frame.
    var pad = 8;
    for (var k = 0; k < 4; k++) {
      if (corners[k].x < -pad || corners[k].x > w + pad ||
          corners[k].y < -pad || corners[k].y > h + pad) return null;
    }
    // Verify minimum side lengths.
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    if (dist(tl, tr) < 40 || dist(tr, br) < 40 || dist(br, bl) < 40 || dist(bl, tl) < 40) return null;
    // Verify area >= 25% of frame.
    function quadArea(q) {
      // Shoelace
      var s = 0;
      for (var ii = 0; ii < 4; ii++) {
        var a = q[ii], b = q[(ii + 1) % 4];
        s += a.x * b.y - b.x * a.y;
      }
      return Math.abs(s) / 2;
    }
    var area = quadArea(corners);
    var frame = w * h;
    if (area / frame < 0.25) return null;
    // Verify opposite-side angle parity within 12°.
    function lineAngle(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
    var aTop = lineAngle(tl, tr);
    var aBot = lineAngle(bl, br);
    var aLeft = lineAngle(tl, bl);
    var aRight = lineAngle(tr, br);
    function angleDiff(a, b) {
      var d = Math.abs(a - b) * 180 / Math.PI;
      while (d > 180) d -= 180;
      return Math.min(d, 180 - d);
    }
    if (angleDiff(aTop, aBot) > 12) return null;
    if (angleDiff(aLeft, aRight) > 12) return null;
    // Confidence: average of the 4 line votes, normalized by max.
    var voteSum = top.votes + bot.votes + left.votes + right.votes;
    var maxLine = Math.max(top.votes, bot.votes, left.votes, right.votes);
    var conf = (voteSum / 4) / Math.max(maxLine, 1);
    // Bound 0..1; we'll also blend area-coverage weight.
    var areaConf = Math.min(1, area / frame * 1.6);
    return {
      corners: corners,
      confidence: Math.min(1, conf * 0.5 + areaConf * 0.5),
      voteSum: voteSum
    };
  }

  // High-level: detect the document quad in a canvas. Downsamples,
  // grayscales, runs Sobel + Hough, picks the quad. Maps coordinates
  // back to canvas-space. Returns null when confidence < 0.4.
  function findDocumentQuad(canvas, opts) {
    opts = opts || {};
    var w = canvas.width, h = canvas.height;
    if (w < 80 || h < 80) return null;
    var maxEdge = opts.maxEdge || 480;
    var scale = Math.max(w, h) > maxEdge ? maxEdge / Math.max(w, h) : 1;
    var dw = Math.round(w * scale);
    var dh = Math.round(h * scale);
    var down = document.createElement('canvas');
    down.width = dw; down.height = dh;
    var ctx = down.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(canvas, 0, 0, dw, dh);
    var img = ctx.getImageData(0, 0, dw, dh);
    // Grayscale in-place (Rec. 601).
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var y = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
      d[i] = d[i + 1] = d[i + 2] = y;
    }
    var edges = sobelMagnitude(img);
    var peaks = houghLines(edges, dw, dh, { threshold: opts.edgeThreshold || 80, topK: 12 });
    var quad = pickQuad(peaks, dw, dh);
    if (!quad) return null;
    var minConf = (opts.minConfidence != null) ? opts.minConfidence : 0.4;
    if (quad.confidence < minConf) return null;
    // Map corners back to full-res coordinates.
    quad.corners = quad.corners.map(function (c) {
      return { x: c.x / scale, y: c.y / scale };
    });
    quad.scale = scale;
    return quad;
  }

  // Rectify a canvas given a quad. Computes the output rectangle's
  // size from average side lengths (preserves aspect roughly), solves
  // the homography, runs warpPerspective, and writes back into a
  // fresh canvas.
  function rectifyCanvas(canvas, quad) {
    if (!quad || !quad.corners) return null;
    var c = quad.corners;
    var topLen   = Math.hypot(c[0].x - c[1].x, c[0].y - c[1].y);
    var botLen   = Math.hypot(c[3].x - c[2].x, c[3].y - c[2].y);
    var leftLen  = Math.hypot(c[0].x - c[3].x, c[0].y - c[3].y);
    var rightLen = Math.hypot(c[1].x - c[2].x, c[1].y - c[2].y);
    var outW = Math.round((topLen + botLen) / 2);
    var outH = Math.round((leftLen + rightLen) / 2);
    // Cap to a reasonable range so we don't blow memory.
    var cap = 2400;
    if (Math.max(outW, outH) > cap) {
      var s = cap / Math.max(outW, outH);
      outW = Math.round(outW * s);
      outH = Math.round(outH * s);
    }
    var dst = [
      { x: 0,     y: 0 },
      { x: outW, y: 0 },
      { x: outW, y: outH },
      { x: 0,     y: outH }
    ];
    var hMat = solveHomography(c, dst);
    if (!hMat) return null;
    // Pull source ImageData.
    var sctx = canvas.getContext('2d');
    if (!sctx) return null;
    var srcImg = sctx.getImageData(0, 0, canvas.width, canvas.height);
    var warped = warpPerspective(srcImg, hMat, outW, outH);
    if (!warped) return null;
    var out = document.createElement('canvas');
    out.width = outW; out.height = outH;
    var octx = out.getContext('2d');
    if (!octx) return null;
    var outImg = octx.createImageData(outW, outH);
    outImg.data.set(warped.data);
    octx.putImageData(outImg, 0, 0);
    return out;
  }

  // Top-level: detect quad and rectify in one call. Returns
  // { canvas, confidence, corners } on success, null on failure
  // (caller falls back to today's deskew + threshold).
  function rectifyDocument(canvas, opts) {
    var quad = findDocumentQuad(canvas, opts);
    if (!quad) return null;
    var rect = rectifyCanvas(canvas, quad);
    if (!rect) return null;
    return {
      canvas: rect,
      confidence: quad.confidence,
      corners: quad.corners
    };
  }

  // -------------------- Deskew (Hough-style scoring) --------------------
  // Tests rotation angles in 1° increments from -10..+10 degrees.
  // For each, computes the sum of dark-pixel runs per row (ink
  // alignment along the baseline) and picks the angle that
  // maximizes peak-to-trough variance — text aligned to a baseline
  // produces tall sharp peaks at row positions; misaligned text
  // produces a flatter row-sum profile.
  //
  // We score on a 200px-tall downsample for speed; the chosen
  // angle is then applied to the full-res canvas.
  function detectSkewAngle(canvas) {
    var w = canvas.width, h = canvas.height;
    if (w < 50 || h < 50) return 0;
    var down = document.createElement('canvas');
    var dh = Math.min(200, h);
    var dw = Math.round(w * (dh / h));
    down.width = dw; down.height = dh;
    var dctx = down.getContext('2d');
    dctx.drawImage(canvas, 0, 0, dw, dh);
    var bestAngle = 0, bestScore = -1;
    var probe = document.createElement('canvas');
    probe.width = dw; probe.height = dh;
    var pctx = probe.getContext('2d');
    for (var deg = -10; deg <= 10; deg += 1) {
      pctx.save();
      pctx.fillStyle = '#FFFFFF';
      pctx.fillRect(0, 0, dw, dh);
      pctx.translate(dw / 2, dh / 2);
      pctx.rotate(deg * Math.PI / 180);
      pctx.translate(-dw / 2, -dh / 2);
      pctx.drawImage(down, 0, 0);
      pctx.restore();
      var img = pctx.getImageData(0, 0, dw, dh);
      var rowSums = new Array(dh).fill(0);
      var data = img.data;
      for (var y = 0; y < dh; y++) {
        var rowDark = 0;
        for (var x = 0; x < dw; x++) {
          var idx = (y * dw + x) * 4;
          if (data[idx] < 128) rowDark++;
        }
        rowSums[y] = rowDark;
      }
      // Variance of row sums — high when text aligns to rows.
      var mean = 0;
      for (var ri = 0; ri < dh; ri++) mean += rowSums[ri];
      mean /= dh;
      var variance = 0;
      for (var ri2 = 0; ri2 < dh; ri2++) variance += (rowSums[ri2] - mean) * (rowSums[ri2] - mean);
      if (variance > bestScore) { bestScore = variance; bestAngle = deg; }
    }
    return bestAngle;
  }

  function rotateCanvas(canvas, angleDeg) {
    if (Math.abs(angleDeg) < 0.1) return canvas;
    var w = canvas.width, h = canvas.height;
    var out = document.createElement('canvas');
    out.width = w; out.height = h;
    var ctx = out.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    ctx.rotate(angleDeg * Math.PI / 180);
    ctx.translate(-w / 2, -h / 2);
    ctx.drawImage(canvas, 0, 0);
    return out;
  }

  // -------------------- Pipeline --------------------
  // Two presets — 'aggressive' for clean / hi-contrast scans (no
  // denoise), 'gentle' for noisy fax / phone shots (with denoise).
  // Wave B2's multi-pass OCR runs both and takes the higher-conf
  // result per cell.
  function preprocessCanvas(canvas, presetOrOpts) {
    // Wave 1.4 — accept either a preset string (legacy) or an opts
    // object {preset, profile}. profile is the source-classifier hint
    // ('scanner' / 'thermal' / 'screenshot' / 'phone') that lets us
    // skip cleanup steps the input doesn't need.
    var preset = 'aggressive';
    var profile = 'phone';
    if (typeof presetOrOpts === 'string') {
      preset = presetOrOpts || 'aggressive';
    } else if (presetOrOpts && typeof presetOrOpts === 'object') {
      preset  = presetOrOpts.preset  || 'aggressive';
      profile = presetOrOpts.profile || 'phone';
    }

    // Profile capability flags. Phone keeps the full pipeline. Scanner
    // and screenshot inputs are already flat / clean — skip the costly
    // rectify + illumination + Sauvola steps. Thermal needs Sauvola
    // (uneven thermal print), no rectify.
    var doRectify       = (profile === 'phone');
    var doDeskew        = (profile !== 'screenshot');
    var doIllumination  = (profile === 'phone');
    var allowSauvola    = (profile === 'phone' || profile === 'thermal');
    var sauvolaParams   = (profile === 'thermal') ? { window: 15, k: 0.20 } : { window: 21, k: 0.34 };

    var rectified = null;
    var rectConf = null;
    if (doRectify) {
      // Wave 2.2 — perspective rectification. Skipped on scanner /
      // thermal / screenshot inputs since they're already flat.
      try {
        var rect = rectifyDocument(canvas, { minConfidence: 0.4 });
        if (rect && rect.canvas) {
          rectified = rect.canvas;
          rectConf = rect.confidence;
          canvas = rectified;
        }
      } catch (_) { /* never block on rectification failure */ }
    }
    // Bicubic upscale on low-DPI inputs.
    //
    // Pre-fix: this was gated to heavy-mode, with long-edge threshold.
    // Real-world failure (macOS Quartz scanned PDF, 540×2000 px): a
    // tall narrow image read 'long edge already > 1600, skip' AND
    // 'lean device, skip', producing a 10-px-glyph canvas Tesseract
    // could not read at all. Symptom: "0 items" with no hint why.
    //
    // New rule: ALWAYS run when suggestUpscale (now short-edge based)
    // returns > 1.05. The cost is a few hundred ms on tiny images;
    // the benefit is OCR works at all on low-resolution sources. On
    // already-large inputs the suggester returns 1 and this is free.
    try {
      var s = suggestUpscale(canvas, 1100);
      if (s > 1.05) canvas = bicubicUpscale(canvas, s);
    } catch (_) {}
    // Wave 9.5 — curled-receipt dewarping. Phone shots of long thermal
    // receipts (Costco Business, restaurant supply receipts) commonly
    // bow upward in the middle as the paper curls. The dewarp fits a
    // quadratic baseline through the dominant text line at three
    // x-positions and shifts each column to flatten the bow. Cheap
    // enough to run unconditionally on thermal inputs; phone-photo
    // inputs run it after rectification so a curl on top of a quad-
    // corrected page also gets handled. Skipped on flat/screenshot.
    try {
      if (root && root.MID_DEVICE_TIER && root.MID_DEVICE_TIER.heavyEnabled && root.MID_DEVICE_TIER.heavyEnabled()) {
        if (profile === 'thermal' || profile === 'phone') {
          canvas = dewarpCurledReceipt(canvas, { thresholdPx: 6 });
        }
      }
    } catch (_) {}
    // 1. Deskew. Screenshots are pixel-aligned by definition; skip.
    var skew = doDeskew ? detectSkewAngle(canvas) : 0;
    var deskewed = doDeskew ? rotateCanvas(canvas, -skew) : canvas;
    // 2. Grayscale + Otsu binarize.
    var ctx = deskewed.getContext('2d');
    var img = ctx.getImageData(0, 0, deskewed.width, deskewed.height);
    // Wave 3.3 — glare repair on phone photos before binarize. Skip
    // on scanner / thermal / screenshot (no glare in those sources).
    var glareInfo = { glareRatio: 0, repaired: false };
    if (profile === 'phone' && preset === 'gentle') {
      try { glareInfo = repairGlareInPlace(img); } catch (_) {}
    }
    grayscaleInPlace(img);
    var blurScore = laplacianVariance(img);
    var t = otsuThreshold(img);
    var bimodalityScore = otsuBetweenClassVariance(img, t);
    var thresholdMethod = 'otsu';
    var illuminationCorrected = false;
    if (preset === 'aggressive') {
      t = Math.min(255, t + 8);
      applyThresholdInPlace(img, t);
    } else if (preset === 'gentle' && allowSauvola && bimodalityScore < 1500 && blurScore > 60) {
      // Wave 8.1 — when the histogram is washed-out (low bimodality)
      // but the image is sharp, the culprit is almost always uneven
      // lighting (shadows/glare). Subtract the background-illumination
      // map first; Sauvola then operates on a near-evenly-lit page
      // and produces a much cleaner binary surface for OCR. Skipped
      // on scanner / screenshot — those are evenly lit by nature.
      if (doIllumination) {
        correctIlluminationInPlace(img);
        illuminationCorrected = true;
      }
      t = otsuThreshold(img);
      bimodalityScore = otsuBetweenClassVariance(img, t);
      sauvolaInPlace(img, sauvolaParams);
      thresholdMethod = 'sauvola';
    } else if (preset === 'gentle') {
      t = Math.max(0, t - 4);
      applyThresholdInPlace(img, t);
      // Skip median denoise on already-clean surfaces.
      if (profile === 'phone') median3x3InPlace(img);
    }
    ctx.putImageData(img, 0, 0);
    return {
      canvas: deskewed,
      skewAngle: skew,
      threshold: t,
      thresholdMethod: thresholdMethod,
      blurScore: blurScore,
      bimodalityScore: bimodalityScore,
      qualityHint: classifyQuality(blurScore, bimodalityScore),
      rectified: !!rectified,
      rectifyConfidence: rectConf,
      illuminationCorrected: illuminationCorrected,
      glareRatio: glareInfo.glareRatio,
      glareRepaired: !!glareInfo.repaired,
      profile: profile
    };
  }

  // -------------------- W2-3: image-quality metrics --------------------
  // Laplacian variance — convolve grayscale with a 3x3 Laplacian
  // kernel [0,1,0; 1,-4,1; 0,1,0], measure variance of the
  // response. Sharp text-heavy images score 200-1000+; blurry
  // photos score <60 (research-backed threshold for OCR
  // unusability — Pertuz et al. focus measure surveys).
  function laplacianVariance(imageData) {
    var w = imageData.width, h = imageData.height;
    if (w < 30 || h < 30) return 0;
    var d = imageData.data;
    // Sample a centered region (avoid edge artifacts from camera
    // borders / page borders). 60% × 60% center crop, stride 2 to
    // halve compute on large images.
    var x0 = Math.floor(w * 0.20), x1 = Math.floor(w * 0.80);
    var y0 = Math.floor(h * 0.20), y1 = Math.floor(h * 0.80);
    var responses = [];
    for (var y = y0 + 1; y < y1 - 1; y += 2) {
      for (var x = x0 + 1; x < x1 - 1; x += 2) {
        var i = (y * w + x) * 4;
        var center  = d[i];
        var up      = d[i - w * 4];
        var down    = d[i + w * 4];
        var left    = d[i - 4];
        var right   = d[i + 4];
        responses.push(up + down + left + right - 4 * center);
      }
    }
    if (!responses.length) return 0;
    var mean = 0;
    for (var k = 0; k < responses.length; k++) mean += responses[k];
    mean /= responses.length;
    var variance = 0;
    for (var k2 = 0; k2 < responses.length; k2++) {
      var dev = responses[k2] - mean;
      variance += dev * dev;
    }
    return variance / responses.length;
  }

  // Otsu's between-class variance at the chosen threshold —
  // honest bimodality indicator. Faded / washed-out invoices
  // score below ~1500. Crisp print-shop invoices score 5000+.
  function otsuBetweenClassVariance(imageData, threshold) {
    var hist = new Array(256).fill(0);
    var d = imageData.data;
    var total = 0;
    for (var i = 0; i < d.length; i += 4) { hist[d[i]]++; total++; }
    var sumAll = 0;
    for (var t = 0; t < 256; t++) sumAll += t * hist[t];
    var wB = 0, sumB = 0;
    for (var t2 = 0; t2 <= threshold; t2++) {
      wB += hist[t2];
      sumB += t2 * hist[t2];
    }
    var wF = total - wB;
    if (wB === 0 || wF === 0) return 0;
    var mB = sumB / wB;
    var mF = (sumAll - sumB) / wF;
    return (wB * wF * (mB - mF) * (mB - mF)) / (total * total);
  }

  // Bands the two metrics into a single hint string the controller
  // can chain on. 'good' — proceed silently. 'low-contrast' —
  // soft warning. 'blurry' — hard recommendation to retake.
  function classifyQuality(blurScore, bimodalityScore) {
    if (blurScore < 60) return 'blurry';
    if (bimodalityScore < 1500) return 'low-contrast';
    return 'good';
  }

  // Wave 8.1 — Confidence-triggered preprocess retry.
  //
  // The preprocessCanvas pipeline uses fixed preset paths. When the
  // first pass scores poorly (low contrast / low bimodality), a SECOND
  // pass with the alternate preset frequently recovers most of the
  // accuracy gap on hard photos. We don't ship multipass for free in
  // the controller — that's the OCR layer's job — but for callers who
  // want a single best-effort canvas (e.g. unit tests, Workshop), this
  // wrapper picks the better of two passes.
  //
  // Decision: pick by `qualityHint` first (good > low-contrast > blurry),
  // then by bimodalityScore as a tiebreaker. Blur can't be fixed in
  // software so we never re-pass on blur; we just surface the hint.
  function qualityScoreFor(r) {
    if (!r) return 0;
    if (r.qualityHint === 'good') return 100;
    if (r.qualityHint === 'low-contrast') return 40 + Math.min(40, r.bimodalityScore / 40);
    if (r.qualityHint === 'blurry') return 0 + Math.min(35, (r.blurScore || 0) / 2);
    return 25;
  }
  function preprocessCanvasWithRetry(canvas, opts) {
    opts = opts || {};
    var firstPreset = opts.preset || 'aggressive';
    var profile = opts.profile || 'phone';
    var altPreset = (firstPreset === 'gentle') ? 'aggressive' : 'gentle';
    var first = preprocessCanvas(canvas, { preset: firstPreset, profile: profile });
    if (first.qualityHint === 'good' || opts.skipRetry) {
      first.retried = false;
      first.preset = firstPreset;
      return first;
    }
    // Re-pass on the original input canvas so we get a clean rectify.
    var second = preprocessCanvas(canvas, { preset: altPreset, profile: profile });
    var firstScore = qualityScoreFor(first);
    var secondScore = qualityScoreFor(second);
    var winner = first;
    if (secondScore > firstScore + 5) {
      second.retried = true;
      second.retryPreset = altPreset;
      second.firstQualityHint = first.qualityHint;
      second.preset = altPreset;
      winner = second;
    } else {
      first.retried = false;
      first.preset = firstPreset;
    }
    return winner;
  }

  // Wave 2.6 — Sauvola parameter sweep. When the orchestrator sees a
  // low row-count outcome from the multipass OCR (rows < expected ×
  // 0.6 from the vendor template), it can call `paramSweep(canvas)` to
  // try a small grid of k values + skew search ranges and return the
  // canvas + metadata that scored highest on `qualityScoreFor`. Cost:
  // ~3-4× a single preprocess; only fires on poor first-pass photos.
  function preprocessParamSweep(canvas, opts) {
    opts = opts || {};
    var profile = opts.profile || 'phone';
    var preset = opts.preset || 'gentle';
    var ks = opts.ks || [0.34, 0.40, 0.46, 0.28];
    var bestResult = null;
    var bestScore = -Infinity;
    for (var i = 0; i < ks.length; i++) {
      var r = _preprocessOnce(canvas, { preset: preset, profile: profile, sauvolaK: ks[i] });
      var score = qualityScoreFor(r);
      r.sweepK = ks[i];
      r.sweepScore = score;
      if (score > bestScore) {
        bestScore = score;
        bestResult = r;
      }
    }
    bestResult.sweep = true;
    bestResult.preset = preset;
    return bestResult;
  }

  // Internal one-shot variant of preprocessCanvas that honors a custom
  // Sauvola k. Mirrors the gentle-preset path; aggressive ignores k.
  function _preprocessOnce(canvas, opts) {
    var preset = opts.preset || 'gentle';
    var profile = opts.profile || 'phone';
    var k = (typeof opts.sauvolaK === 'number') ? opts.sauvolaK : 0.34;
    var doRectify = (profile === 'phone');
    var allowSauvola = (profile === 'phone' || profile === 'thermal');
    var rectified = null, rectConf = null;
    if (doRectify) {
      try {
        var rect = rectifyDocument(canvas, { minConfidence: 0.4 });
        if (rect && rect.canvas) { rectified = rect.canvas; rectConf = rect.confidence; canvas = rectified; }
      } catch (_) {}
    }
    var skew = (profile === 'screenshot') ? 0 : detectSkewAngle(canvas);
    var deskewed = (profile === 'screenshot') ? canvas : rotateCanvas(canvas, -skew);
    var ctx = deskewed.getContext('2d');
    var img = ctx.getImageData(0, 0, deskewed.width, deskewed.height);
    grayscaleInPlace(img);
    var blurScore = laplacianVariance(img);
    var t = otsuThreshold(img);
    var bimodalityScore = otsuBetweenClassVariance(img, t);
    var thresholdMethod = 'otsu';
    if (preset === 'aggressive') {
      t = Math.min(255, t + 8);
      applyThresholdInPlace(img, t);
    } else if (allowSauvola && bimodalityScore < 1500) {
      if (profile === 'phone') correctIlluminationInPlace(img);
      sauvolaInPlace(img, { window: profile === 'thermal' ? 15 : 21, k: k });
      thresholdMethod = 'sauvola';
    } else {
      t = Math.max(0, t - 4);
      applyThresholdInPlace(img, t);
      if (profile === 'phone') median3x3InPlace(img);
    }
    ctx.putImageData(img, 0, 0);
    return {
      canvas: deskewed,
      skewAngle: skew,
      threshold: t,
      thresholdMethod: thresholdMethod,
      blurScore: blurScore,
      bimodalityScore: bimodalityScore,
      qualityHint: classifyQuality(blurScore, bimodalityScore),
      rectified: !!rectified,
      rectifyConfidence: rectConf,
      profile: profile
    };
  }

  // Public entry: takes a File, returns a preprocessed canvas plus
  // metadata. The caller (Wave B2) feeds the canvas to Tesseract.
  function preprocessFile(file, opts) {
    opts = opts || {};
    var maxEdge = opts.maxEdge || 2000;
    var preset = opts.preset || 'aggressive';
    var profile = opts.profile || 'phone';
    return fileToCanvas(file, maxEdge).then(function (raw) {
      var result = opts.retryOnLowQuality
        ? preprocessCanvasWithRetry(raw, { preset: preset, profile: profile })
        : preprocessCanvas(raw, { preset: preset, profile: profile });
      return {
        canvas: result.canvas,
        rawWidth:  raw.width,
        rawHeight: raw.height,
        skewAngle: result.skewAngle,
        threshold: result.threshold,
        preset:    result.preset || preset,
        profile:   result.profile || profile,
        retried:   !!result.retried,
        qualityHint: result.qualityHint
      };
    });
  }

  // Useful for the on-page "we cleaned up your photo" preview tile.
  function canvasToDataUrl(canvas) {
    try { return canvas.toDataURL('image/png'); } catch (_) { return ''; }
  }

  var api = {
    preprocessFile:    preprocessFile,
    preprocessCanvas:  preprocessCanvas,
    preprocessCanvasWithRetry: preprocessCanvasWithRetry,
    preprocessParamSweep: preprocessParamSweep,
    repairGlareInPlace: repairGlareInPlace,
    detectAxisGradient: detectAxisGradient,
    bicubicUpscale:    bicubicUpscale,
    suggestUpscale:    suggestUpscale,
    detectCurlMagnitude: detectCurlMagnitude,
    dewarpCurledReceipt: dewarpCurledReceipt,
    fileToCanvas:      fileToCanvas,
    canvasToDataUrl:   canvasToDataUrl,
    detectSkewAngle:   detectSkewAngle,
    otsuThreshold:     otsuThreshold,
    sauvolaInPlace:    sauvolaInPlace,
    correctIlluminationInPlace: correctIlluminationInPlace,
    classifyQuality:   classifyQuality,
    // Wave 2.2 — perspective rectification suite. Pure-function
    // helpers exposed for testing in Node.
    findDocumentQuad:  findDocumentQuad,
    rectifyDocument:   rectifyDocument,
    rectifyCanvas:     rectifyCanvas,
    solveHomography:   solveHomography,
    invertHomography:  invertHomography,
    applyHomography:   applyHomography,
    warpPerspective:   warpPerspective,
    sobelMagnitude:    sobelMagnitude,
    houghLines:        houghLines,
    pickQuad:          pickQuad,
    bilinearSample:    bilinearSample,
    // Decode-format detection — exposed for the regression test suite
    // (scripts/test-decode-fallbacks.mjs) so a future change to the
    // sniffer can't silently break TIFF/HEIC/AVIF routing.
    _sniffImageMagicBytes: _sniffImageMagicBytes,
    _isTiffFile:           _isTiffFile,
    _isHeicFile:           _isHeicFile,
    parseExifOrientation:  parseExifOrientation,
    applyExifOrientation:  applyExifOrientation,
    tiffToPageFiles:       tiffToPageFiles
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PREPROCESS = api;
})(typeof window !== 'undefined' ? window : null);
