/**
 * Invoice Decoder — Source classifier (Wave 1.2).
 *
 * Single entry point all intake routes through. Reads cheap signals
 * (MIME, extension, EXIF segment, PDF /Producer string) without loading
 * heavy parsers, returns:
 *
 *   {
 *     kind: 'pdf-text' | 'pdf-image' | 'pdf-hybrid' | 'image-scanner' |
 *           'image-phone' | 'image-thermal' | 'image-screenshot' | 'tabular' | 'unknown',
 *     preprocessProfile: 'scanner' | 'phone' | 'thermal' | 'screenshot' | 'none',
 *     vendorHint: string|null,
 *     scannerHint: string|null,
 *     confidence: number,
 *     signals: { producer?, creator?, exifMake?, exifModel?, width?, height?,
 *                aspect?, sizePerPage?, isScreenshotDim? }
 *   }
 *
 * `kind === 'pdf-hybrid'` and `'pdf-text'` are best guesses from a
 * cheap header peek; pdf-extract.js still re-classifies authoritatively
 * once it has the page-by-page text content (Wave 1.3).
 *
 * Privacy posture: nothing leaves the device. We read at most 64KB of
 * the file head for PDF metadata and a small EXIF window for images.
 */
(function (root) {
  'use strict';

  // Scanner Producer / Creator regex — covers the common desktop and
  // mobile scanners that emit image-only PDFs. Matched against /Producer
  // and /Creator strings parsed out of the PDF header.
  var SCANNER_PRODUCER_RE =
    /(scansnap|adobe\s*scan|brother|epson\s*scan|canoscan|canon\s*ij|hp\s*scan|fujitsu|kodak\s*alaris|xerox\s*workcentre|ricoh|kyocera|microsoft\s*lens|camscanner|genius\s*scan|notebloc|tiny\s*scanner|swiftscan)/i;

  // Common iOS/Android screenshot dimensions (long edge × short edge,
  // both orientations). If decoded image dims match within ±2px, flag.
  var SCREENSHOT_DIMS = [
    [1170, 2532], [1290, 2796], [1179, 2556], [1284, 2778],
    [1125, 2436], [828, 1792], [1242, 2688], [750, 1334],
    [1080, 1920], [1080, 2340], [1080, 2400], [1440, 3120],
    [1440, 2960], [1440, 3200], [1080, 2160], [720, 1280],
    [1366, 768], [1280, 720], [1920, 1080], [2560, 1440],
    [2880, 1800], [1440, 900], [1680, 1050], [1280, 800]
  ];

  function _ext(name) {
    var n = String(name || '').toLowerCase();
    var m = /\.([a-z0-9]+)$/.exec(n);
    return m ? m[1] : '';
  }

  function _looksLikeCsv(f) {
    var ext = _ext(f && f.name);
    if (ext === 'csv' || ext === 'tsv' || ext === 'xlsx' || ext === 'xls') return true;
    var t = String(f && f.type || '').toLowerCase();
    return (
      t === 'text/csv' ||
      t === 'text/tab-separated-values' ||
      t === 'application/vnd.ms-excel' ||
      t === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }

  function _looksLikePdf(f) {
    var t = String(f && f.type || '').toLowerCase();
    if (t === 'application/pdf') return true;
    return _ext(f && f.name) === 'pdf';
  }

  function _looksLikeImage(f) {
    var t = String(f && f.type || '').toLowerCase();
    if (t.indexOf('image/') === 0) return true;
    return /^(jpe?g|png|heic|heif|webp|tiff?|bmp|gif)$/.test(_ext(f && f.name));
  }

  // Read first N bytes of a file as a Uint8Array. PDFs hide their
  // metadata trailer near EOF, so we also peek the tail.
  function _readHead(file, bytes) {
    return file.slice(0, bytes).arrayBuffer().then(function (buf) {
      return new Uint8Array(buf);
    });
  }
  function _readTail(file, bytes) {
    var start = Math.max(0, file.size - bytes);
    return file.slice(start, file.size).arrayBuffer().then(function (buf) {
      return new Uint8Array(buf);
    });
  }

  // Decode bytes as latin1 (1:1 byte→char). PDF strings are mostly
  // ASCII; non-ASCII bytes don't cross 0xFF and won't break our regex.
  function _bytesToLatin1(bytes) {
    var out = '';
    var len = bytes.length;
    for (var i = 0; i < len; i += 8192) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, len)));
    }
    return out;
  }

  // Extract /Producer (...) and /Creator (...) from a PDF byte slice.
  // PDF strings are escaped — for our purposes (regex-matching against
  // a handful of vendor names), naive de-escape is enough.
  function _extractPdfStrings(bytesLatin1) {
    function pluck(key) {
      var re = new RegExp('\\/' + key + '\\s*\\(((?:\\\\.|[^()\\\\])*)\\)');
      var m = re.exec(bytesLatin1);
      if (!m) {
        // Some PDFs use hex-string syntax for these keys.
        var reHex = new RegExp('\\/' + key + '\\s*<([0-9a-fA-F\\s]+)>');
        var mh = reHex.exec(bytesLatin1);
        if (mh) {
          var hex = mh[1].replace(/\s+/g, '');
          var s = '';
          for (var i = 0; i + 1 < hex.length; i += 2) {
            s += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
          }
          return s;
        }
        return null;
      }
      // Unescape \( \) \\ — minimal subset.
      return m[1]
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
    }
    return {
      producer: pluck('Producer'),
      creator: pluck('Creator'),
      title: pluck('Title')
    };
  }

  // Best-effort PDF page count from the head bytes — counts /Type /Page
  // occurrences. Inaccurate on linearized PDFs and lazy object streams,
  // but good enough for size-per-page heuristics; pdf-extract gets the
  // authoritative count later.
  function _peekPdfPageCount(bytesLatin1) {
    var matches = bytesLatin1.match(/\/Type\s*\/Page\b/g);
    return matches ? matches.length : 0;
  }

  function _classifyPdf(file) {
    // Read head and tail. /Producer typically lives in the trailer
    // metadata dict near EOF; some PDFs put it in the head /Info dict.
    return Promise.all([
      _readHead(file, 64 * 1024),
      _readTail(file, 64 * 1024)
    ]).then(function (parts) {
      var headStr = _bytesToLatin1(parts[0]);
      var tailStr = _bytesToLatin1(parts[1]);
      var combined = headStr + '\n' + tailStr;
      var meta = _extractPdfStrings(combined);
      var producer = meta.producer || '';
      var creator = meta.creator || '';
      var pages = _peekPdfPageCount(headStr) || 1;
      var sizePerPage = file.size / Math.max(1, pages);

      // Detect scanner-produced PDFs.
      var producerMatch = SCANNER_PRODUCER_RE.exec(producer + ' ' + creator);
      var scannerHint = producerMatch ? (producer || creator).trim() : null;

      // Vendor hint from filename.
      var vendorHint = _vendorHintFromFilename(file.name);

      // Decision:
      //   Scanner-produced → pdf-image
      //   Else size-per-page > 200KB AND no XObject/Im* refs in head → likely raster heavy
      //   Else pdf-text (will be confirmed by pdf-extract.js Wave 1.3)
      var hasFontRef = /\/Font\b/.test(headStr);
      var hasImageRef = /\/(XObject|Image\b|Im0|Im1|Im2)/.test(headStr);
      var kind, confidence;
      if (scannerHint) {
        kind = 'pdf-image';
        confidence = 0.9;
      } else if (sizePerPage > 200 * 1024 && !hasFontRef && hasImageRef) {
        kind = 'pdf-image';
        confidence = 0.7;
      } else if (sizePerPage < 60 * 1024 && hasFontRef) {
        kind = 'pdf-text';
        confidence = 0.85;
      } else {
        kind = 'pdf-hybrid';
        confidence = 0.5;
      }

      return {
        kind: kind,
        preprocessProfile: kind === 'pdf-text' ? 'none' : 'scanner',
        vendorHint: vendorHint,
        scannerHint: scannerHint,
        confidence: confidence,
        signals: {
          producer: producer || null,
          creator: creator || null,
          pagesPeeked: pages,
          sizePerPage: Math.round(sizePerPage),
          hasFontRef: hasFontRef,
          hasImageRef: hasImageRef
        }
      };
    }).catch(function () {
      // If header read fails, fall back to coarse classification.
      return {
        kind: 'pdf-hybrid',
        preprocessProfile: 'scanner',
        vendorHint: _vendorHintFromFilename(file.name),
        scannerHint: null,
        confidence: 0.3,
        signals: { producer: null, creator: null, error: true }
      };
    });
  }

  // Read EXIF Make/Model from a JPEG. APP1 segment after SOI (FFD8 FFE1).
  // Bare-bones: we walk the TIFF IFD0 looking for tags 0x010F (Make) and
  // 0x0110 (Model). Returns nulls for non-JPEG or absent EXIF.
  function _readJpegExif(file) {
    if (!file.type || !/jpeg|jpg/i.test(file.type)) {
      // Still try based on extension
      if (!/jpe?g$/i.test(file.name || '')) return Promise.resolve({});
    }
    return _readHead(file, 64 * 1024).then(function (bytes) {
      try {
        if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return {};
        var i = 2;
        while (i < bytes.length - 4) {
          if (bytes[i] !== 0xFF) break;
          var marker = bytes[i + 1];
          var segLen = (bytes[i + 2] << 8) | bytes[i + 3];
          if (marker === 0xE1 && segLen > 8) {
            // EXIF: "Exif\0\0" then TIFF header
            var sig =
              String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
            if (sig === 'Exif') {
              var tiffStart = i + 10;
              var bigEndian = (bytes[tiffStart] === 0x4D);
              var u16 = function (off) {
                return bigEndian
                  ? (bytes[off] << 8) | bytes[off + 1]
                  : (bytes[off + 1] << 8) | bytes[off];
              };
              var u32 = function (off) {
                return bigEndian
                  ? ((bytes[off] << 24) | (bytes[off + 1] << 16) |
                     (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0
                  : ((bytes[off + 3] << 24) | (bytes[off + 2] << 16) |
                     (bytes[off + 1] << 8) | bytes[off]) >>> 0;
              };
              var ifd0 = tiffStart + u32(tiffStart + 4);
              var entries = u16(ifd0);
              var make = null;
              var model = null;
              for (var k = 0; k < entries; k++) {
                var entry = ifd0 + 2 + k * 12;
                var tag = u16(entry);
                var typ = u16(entry + 2);
                var cnt = u32(entry + 4);
                if ((tag === 0x010F || tag === 0x0110) && typ === 2) {
                  var dataOff = cnt > 4 ? tiffStart + u32(entry + 8) : entry + 8;
                  var s = '';
                  for (var c = 0; c < cnt && bytes[dataOff + c]; c++) {
                    s += String.fromCharCode(bytes[dataOff + c]);
                  }
                  if (tag === 0x010F) make = s.trim();
                  if (tag === 0x0110) model = s.trim();
                }
              }
              return { make: make, model: model };
            }
          }
          if (marker === 0xDA) break; // SOS — start of scan
          i += 2 + segLen;
        }
      } catch (_) { /* empty EXIF */ }
      return {};
    }).catch(function () { return {}; });
  }

  // Decode just enough of an image to learn its width/height. Returns
  // { width, height } or {}. Uses createImageBitmap when available
  // (works for HEIC on iOS Safari), falls back to <img>.
  function _imageDimensions(file) {
    if (typeof createImageBitmap === 'function') {
      return createImageBitmap(file).then(function (bm) {
        var d = { width: bm.width, height: bm.height };
        try { bm.close && bm.close(); } catch (_) {}
        return d;
      }).catch(function () { return _imageDimsFallback(file); });
    }
    return _imageDimsFallback(file);
  }
  function _imageDimsFallback(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        try { URL.revokeObjectURL(url); } catch (_) {}
      };
      img.onerror = function () {
        resolve({});
        try { URL.revokeObjectURL(url); } catch (_) {}
      };
      img.src = url;
    });
  }

  function _isScreenshotDim(w, h) {
    if (!w || !h) return false;
    for (var i = 0; i < SCREENSHOT_DIMS.length; i++) {
      var a = SCREENSHOT_DIMS[i][0], b = SCREENSHOT_DIMS[i][1];
      if ((Math.abs(w - a) <= 2 && Math.abs(h - b) <= 2) ||
          (Math.abs(w - b) <= 2 && Math.abs(h - a) <= 2)) return true;
    }
    return false;
  }

  function _classifyImage(file) {
    return Promise.all([_readJpegExif(file), _imageDimensions(file)])
      .then(function (parts) {
        var exif = parts[0] || {};
        var dim = parts[1] || {};
        var w = dim.width, h = dim.height;
        var aspect = (w && h) ? Math.max(w, h) / Math.min(w, h) : null;
        var hasExif = !!(exif.make || exif.model);

        var kind, profile, confidence;

        // Phone heuristics — EXIF Make/Model present and matches a phone OEM.
        var makeLower = String(exif.make || '').toLowerCase();
        var modelLower = String(exif.model || '').toLowerCase();
        var isPhone =
          /apple|google|samsung|xiaomi|oneplus|huawei|oppo|vivo|motorola|sony|asus|nokia/i.test(makeLower) ||
          /iphone|pixel|galaxy|redmi|oneplus/i.test(modelLower);

        // Thermal: tall narrow image (aspect > 2.5 and width < 900)
        var isThermal = aspect && aspect > 2.5 && Math.min(w, h) < 900;

        // Screenshot: matches a known screen dimension AND no EXIF Make
        var isScreenshot = !hasExif && _isScreenshotDim(w, h);

        // Scanner-flatbed: no EXIF, letter/A4-ish aspect, decent size.
        var isFlatbed = !hasExif && !isScreenshot && !isThermal &&
          aspect && aspect >= 1.2 && aspect <= 1.6 && Math.min(w, h) >= 1500;

        if (isThermal) {
          kind = 'image-thermal'; profile = 'thermal'; confidence = 0.8;
        } else if (isScreenshot) {
          kind = 'image-screenshot'; profile = 'screenshot'; confidence = 0.85;
        } else if (isPhone) {
          kind = 'image-phone'; profile = 'phone'; confidence = 0.9;
        } else if (isFlatbed) {
          kind = 'image-scanner'; profile = 'scanner'; confidence = 0.75;
        } else {
          // Default to phone-photo full pipeline. It's the safe fallback —
          // the cleanup steps are extra cycles, never destructive.
          kind = 'image-phone'; profile = 'phone'; confidence = 0.4;
        }

        return {
          kind: kind,
          preprocessProfile: profile,
          vendorHint: _vendorHintFromFilename(file.name),
          scannerHint: null,
          confidence: confidence,
          signals: {
            exifMake: exif.make || null,
            exifModel: exif.model || null,
            width: w || null,
            height: h || null,
            aspect: aspect,
            isScreenshotDim: isScreenshot
          }
        };
      });
  }

  function _vendorHintFromFilename(name) {
    var n = String(name || '').toLowerCase();
    if (/sysco/.test(n)) return 'sysco';
    if (/us[\-_\s]?foods/.test(n)) return 'us-foods';
    if (/gfs|gordon[\-_\s]?food/.test(n)) return 'gfs';
    if (/restaurant[\-_\s]?depot|rdepot/.test(n)) return 'restaurant-depot';
    if (/shamrock/.test(n)) return 'shamrock';
    if (/sygma/.test(n)) return 'sygma';
    if (/cheney/.test(n)) return 'cheney';
    if (/keith/.test(n)) return 'ben-e-keith';
    if (/baldor/.test(n)) return 'baldor';
    if (/freshpoint/.test(n)) return 'freshpoint';
    return null;
  }

  function classify(file) {
    if (!file) {
      return Promise.resolve({
        kind: 'unknown',
        preprocessProfile: 'phone',
        vendorHint: null,
        scannerHint: null,
        confidence: 0,
        signals: {}
      });
    }
    if (_looksLikeCsv(file)) {
      return Promise.resolve({
        kind: 'tabular',
        preprocessProfile: 'none',
        vendorHint: _vendorHintFromFilename(file.name),
        scannerHint: null,
        confidence: 0.95,
        signals: {}
      });
    }
    if (_looksLikePdf(file)) {
      return _classifyPdf(file);
    }
    if (_looksLikeImage(file)) {
      return _classifyImage(file);
    }
    return Promise.resolve({
      kind: 'unknown',
      preprocessProfile: 'phone',
      vendorHint: null,
      scannerHint: null,
      confidence: 0,
      signals: {}
    });
  }

  // Synchronous coarse sniff — used for quick UI hints before the
  // async classify() resolves. Just MIME/extension; no signals.
  function classifySync(file) {
    if (!file) return { kind: 'unknown', preprocessProfile: 'phone' };
    if (_looksLikeCsv(file)) return { kind: 'tabular', preprocessProfile: 'none' };
    if (_looksLikePdf(file)) return { kind: 'pdf-hybrid', preprocessProfile: 'scanner' };
    if (_looksLikeImage(file)) return { kind: 'image-phone', preprocessProfile: 'phone' };
    return { kind: 'unknown', preprocessProfile: 'phone' };
  }

  var api = {
    classify: classify,
    classifySync: classifySync,
    looksLikeCsv: _looksLikeCsv,
    looksLikePdf: _looksLikePdf,
    looksLikeImage: _looksLikeImage,
    _readJpegExif: _readJpegExif,
    _extractPdfStrings: _extractPdfStrings,
    _isScreenshotDim: _isScreenshotDim,
    SCANNER_PRODUCER_RE: SCANNER_PRODUCER_RE
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_SOURCE_CLASSIFIER = api;
})(typeof window !== 'undefined' ? window : null);
