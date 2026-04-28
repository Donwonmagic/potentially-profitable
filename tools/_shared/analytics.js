/**
 * Shared analytics helpers for the Muntin Digital toolkit.
 *
 * Today every URL/audit tool logs the audited URL UNREDACTED in
 * Plausible event properties:
 *   window.plausible('Speed Test', { props: { score: 65, url: url } })
 *
 * If a user audits `https://example.com/admin/secret`, the path
 * `/admin/secret` is sent to Plausible's collector. Sensitive admin
 * URLs leak into analytics. The bucket signal we actually want is
 * the host (so we can see which TLDs / hosts get audited most),
 * not the path.
 *
 * `redactUrlForAnalytics(url)` strips:
 *   - path (replaced with `/`)
 *   - query string
 *   - fragment
 *   - port (kept; same-host logical entity)
 *   - userinfo (rare, always sensitive)
 *
 * Returns the redacted form `protocol://host` (no trailing slash so
 * it's compact in Plausible's UI). Returns the input unchanged when
 * URL parsing fails — at worst the leak is what you had before.
 *
 * Pure function; safe to import in Node tests.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinAnalytics = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function redactUrlForAnalytics(url) {
    if (typeof url !== 'string' || !url) return '';
    var trimmed = url.trim();
    if (!trimmed) return '';
    // URL parser is built into the browser + Node; safe across both.
    try {
      var u = new URL(trimmed);
      // Drop userinfo, path, query, fragment. Keep protocol + host
      // (which includes port if present).
      return u.protocol + '//' + u.host;
    } catch (_) {
      // If parsing fails, the value isn't a valid URL — return empty
      // rather than the raw input to be safe. Callers can then choose
      // to omit the prop entirely or use a placeholder.
      return '';
    }
  }

  return {
    redactUrlForAnalytics: redactUrlForAnalytics
  };
}));
