// ============================================================
// Tools migration (2026-06-26) — retired-tool 301 redirect map
// ============================================================
//
// Eight off-funnel tools were retired when the company narrowed to the
// product-only cost-intelligence funnel (Cost Index + the live cost
// tools + Muntin Ledger):
//
//   gbp-grader, store-hours, storefront-health, menu-copy,
//   photo-brief, menu-converter, brand-suite, and the restaurant
//   audit that lived at tools/audits/restaurant/.
//
// These 301s would naturally live in /_redirects, but that file is
// already near Cloudflare's 100-rule cap (deploy error 100324 when
// exceeded — see src/lib/blog-library-redirects.js for the same
// constraint). The Worker is dispatched on every request anyway, so an
// in-code prefix match costs ~one lookup and frees the platform budget.
//
// Replacement-target map (decided in the migration handoff):
//   menu-copy, menu-converter → /tools/menu-engineering/  (menu-related)
//   gbp-grader, store-hours, storefront-health, photo-brief,
//   brand-suite, audits/restaurant → /tools/  (the tools catalog)
//
// ES mirrors map to the /es/ prefix of the same target. Every redirect
// is a 301 (permanent). Targets are path-only — the platform resolves
// the origin from the incoming Request. The match is by path PREFIX so
// the tool root AND any sub-path / deep-linked asset both redirect (no
// per-asset wildcard rules needed).

// Tool slug (relative to /tools/ or /es/tools/) → EN catalog target.
// The ES handler prefixes /es to the target.
const RETIRED_TOOL_TARGETS = new Map([
  ['menu-copy',          '/tools/menu-engineering/'],
  ['menu-converter',     '/tools/menu-engineering/'],
  ['gbp-grader',         '/tools/'],
  ['store-hours',        '/tools/'],
  ['storefront-health',  '/tools/'],
  ['photo-brief',        '/tools/'],
  ['brand-suite',        '/tools/'],
  ['audits/restaurant',  '/tools/'],
]);

/**
 * Resolve a retired-tool path to its 301 target, or null if the path
 * is not a retired tool. Handles the tool root and any sub-path:
 *   /tools/gbp-grader/          → /tools/
 *   /tools/gbp-grader/card.png  → /tools/
 *   /es/tools/menu-copy/        → /es/tools/menu-engineering/
 *
 * @param {string} pathname  request URL pathname (decoded)
 * @returns {string|null}     301 target path, or null
 */
export function lookupToolRedirect(pathname) {
  let rest = null;
  let esPrefix = '';
  if (pathname.startsWith('/tools/')) {
    rest = pathname.slice('/tools/'.length);
  } else if (pathname.startsWith('/es/tools/')) {
    rest = pathname.slice('/es/tools/'.length);
    esPrefix = '/es';
  } else {
    return null;
  }

  for (const [slug, target] of RETIRED_TOOL_TARGETS) {
    // Match the slug root exactly or as a path prefix (slug followed by
    // '/' or end-of-string). Prevents 'menu-copy' from matching e.g.
    // a hypothetical 'menu-copybook' sibling.
    if (rest === slug || rest === slug + '/' || rest.startsWith(slug + '/')) {
      if (esPrefix && target.startsWith('/tools/')) {
        return '/es' + target;
      }
      return esPrefix + target;
    }
  }
  return null;
}

export { RETIRED_TOOL_TARGETS };
