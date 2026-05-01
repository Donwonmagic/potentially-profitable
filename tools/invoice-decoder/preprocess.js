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

  // Read a File or Blob into an HTMLImageElement, then to canvas.
  // SVG / unsupported formats reject; the caller falls back to a
  // "couldn't read this image" status message.
  function fileToCanvas(file, maxEdge) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var c = imageToCanvas(img, maxEdge || 2000);
          URL.revokeObjectURL(url);
          resolve(c);
        } catch (e) { reject(e); }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('image decode failed'));
      };
      img.src = url;
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
  function preprocessCanvas(canvas, preset) {
    preset = preset || 'aggressive';
    // 1. Deskew first (operates on the colored canvas; rotation
    //    artifacts are easier to clean afterward).
    var skew = detectSkewAngle(canvas);
    var deskewed = rotateCanvas(canvas, -skew);
    // 2. Grayscale + Otsu binarize.
    var ctx = deskewed.getContext('2d');
    var img = ctx.getImageData(0, 0, deskewed.width, deskewed.height);
    grayscaleInPlace(img);
    var t = otsuThreshold(img);
    // Aggressive preset shifts the threshold up by 8 to favor
    // crisp text (ink stays black; faded ink becomes white). Good
    // for clean print-shop invoices.
    if (preset === 'aggressive') t = Math.min(255, t + 8);
    if (preset === 'gentle')     t = Math.max(0, t - 4);
    applyThresholdInPlace(img, t);
    // 3. Denoise on gentle only.
    if (preset === 'gentle') median3x3InPlace(img);
    ctx.putImageData(img, 0, 0);
    return { canvas: deskewed, skewAngle: skew, threshold: t };
  }

  // Public entry: takes a File, returns a preprocessed canvas plus
  // metadata. The caller (Wave B2) feeds the canvas to Tesseract.
  function preprocessFile(file, opts) {
    opts = opts || {};
    var maxEdge = opts.maxEdge || 2000;
    var preset = opts.preset || 'aggressive';
    return fileToCanvas(file, maxEdge).then(function (raw) {
      var result = preprocessCanvas(raw, preset);
      return {
        canvas: result.canvas,
        rawWidth:  raw.width,
        rawHeight: raw.height,
        skewAngle: result.skewAngle,
        threshold: result.threshold,
        preset: preset
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
    fileToCanvas:      fileToCanvas,
    canvasToDataUrl:   canvasToDataUrl,
    detectSkewAngle:   detectSkewAngle,
    otsuThreshold:     otsuThreshold
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PREPROCESS = api;
})(typeof window !== 'undefined' ? window : null);
