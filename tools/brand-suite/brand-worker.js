/**
 * Brand Suite — palette-extraction Web Worker.
 *
 * Imported by the IIFE in ./index.html via `new Worker('./brand-worker.js')`.
 * Keeps the UI responsive when k-means runs on large images.
 *
 * Privacy invariants enforced by architecture:
 *   - importScripts only loads `./brand-suite.js` (same origin, no CDN).
 *   - The worker has no fetch / XHR / WebSocket traffic — it only
 *     receives pixel arrays via postMessage and returns palette objects.
 *   - Nothing is persisted; the worker dies when the tab closes.
 *
 * Message protocol:
 *   in:  { type: 'extract', pixels: Array<[r,g,b]>, k, seed, requestId }
 *   out: { type: 'palette', palette: Array<{hex, dominancePct}>, requestId }
 *        or { type: 'error',   message: string,              requestId }
 *
 * requestId is echoed so the caller can correlate requests with
 * responses if they queue multiple extractions.
 */

importScripts('./brand-suite.js');

self.addEventListener('message', function(ev) {
  var msg = ev.data || {};
  var requestId = msg.requestId || null;

  try {
    if (msg.type !== 'extract') {
      self.postMessage({ type: 'error', message: 'Unknown message type', requestId: requestId });
      return;
    }
    if (!self.BS || typeof self.BS.extractPalette !== 'function') {
      self.postMessage({ type: 'error', message: 'brand-suite.js not loaded in worker', requestId: requestId });
      return;
    }
    var palette = self.BS.extractPalette(msg.pixels || [], {
      k: msg.k || 5,
      seed: msg.seed || 1,
      maxIterations: msg.maxIterations || 8,
      mergeThreshold: msg.mergeThreshold
    });
    self.postMessage({ type: 'palette', palette: palette, requestId: requestId });
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: (err && err.message) ? err.message : 'Unknown worker error',
      requestId: requestId
    });
  }
});
