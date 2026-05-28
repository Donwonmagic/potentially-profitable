// Phase 7 — shared list of /library/<slug>/ directories that are NOT
// articles but collection-landing pages. Every check/inject script
// that walks library/ should skip these so collection landings don't
// fail article-rubric checks or get article-only sentinel injections.
//
// To add a new collection landing later, append the slug here. The
// affected scripts pick up the change with no per-script edit.

export const NON_ARTICLE_LIBRARY_SLUGS = new Set([
  'menu-design-cuisines',
  'menu-design-themes',
]);

/**
 * True when a slug under /library/ or /es/library/ is a collection
 * landing (not an article) and should be skipped by article walks.
 */
export function isNonArticleLibrarySlug(slug) {
  return NON_ARTICLE_LIBRARY_SLUGS.has(slug);
}
