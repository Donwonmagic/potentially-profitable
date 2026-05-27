// ============================================================
// /blog/<slug>/ → /library/<slug>/ redirect map
// ============================================================
//
// Phase 7 (May 2026) split moved evergreen reference content from
// /blog/ to /library/. The 53 resulting permanent redirects used to
// live in /_redirects, but Cloudflare Workers Static Assets caps a
// project at 100 _redirects rules total. With the legacy entries
// (URL history, tool sunsets, /resources/ folds, ES native-slug
// migrations, …) we were over budget and `wrangler versions upload`
// failed with code 100324.
//
// The Worker is dispatched on every request anyway, so handling
// these in-code costs ~one Map lookup per request and frees the
// _redirects file for the platform-only rules that need wildcards.
//
// Three categories below match the comment structure that used to
// live in _redirects:
//
//   1. EN kept-slug moves    — same slug, /blog/ → /library/.
//   2. EN rename moves       — slug de-timed (no "-2026", clearer noun).
//   3. EN merge bundles      — multiple sources collapse to one target.
//   4. ES kept-slug moves    — native-slug ES posts moved to /es/library/.
//   5. ES rename moves       — ES Group B (slug preserved, namespace
//                              shift only — content team hasn't yet
//                              translated de-timed names).
//   6. ES cross-language     — early bilingual-publishing legacy paths
//                              (/es/blog/<en-slug>/) routed to the
//                              best available ES or EN target.
//
// Every entry is a 301 (permanent). The redirect target is the path
// only — no protocol, no host — because the platform resolves the
// origin from the incoming Request. Trailing slashes are preserved
// to keep canonical-URL alignment with the rendered HTML.

export const BLOG_LIBRARY_REDIRECTS = new Map([
  // EN kept-slug moves
  ['/blog/can-chatgpt-write-your-restaurant-website/',                       '/library/can-chatgpt-write-your-restaurant-website/'],
  ['/blog/does-my-restaurant-need-a-website/',                               '/library/does-my-restaurant-need-a-website/'],
  ['/blog/how-to-get-cited-in-google-ai-overviews-restaurant/',              '/library/how-to-get-cited-in-google-ai-overviews-restaurant/'],
  ['/blog/how-to-get-more-google-reviews-for-your-restaurant/',              '/library/how-to-get-more-google-reviews-for-your-restaurant/'],
  ['/blog/how-to-raise-restaurant-menu-prices-without-losing-reservations/', '/library/how-to-raise-restaurant-menu-prices-without-losing-reservations/'],
  ['/blog/how-to-read-restaurant-google-search-console/',                    '/library/how-to-read-restaurant-google-search-console/'],
  ['/blog/how-to-set-up-google-business-profile-for-your-restaurant/',       '/library/how-to-set-up-google-business-profile-for-your-restaurant/'],
  ['/blog/how-to-tell-if-a-restaurant-tool-is-safe/',                        '/library/how-to-tell-if-a-restaurant-tool-is-safe/'],
  ['/blog/my-restaurant-isnt-on-google-maps-10-minute-diagnostic/',          '/library/my-restaurant-isnt-on-google-maps-10-minute-diagnostic/'],
  ['/blog/restaurant-photo-spec-sheet/',                                     '/library/restaurant-photo-spec-sheet/'],
  ['/blog/toast-vs-square-vs-clover-for-restaurants/',                       '/library/toast-vs-square-vs-clover-for-restaurants/'],
  ['/blog/what-should-be-on-a-restaurant-website/',                          '/library/what-should-be-on-a-restaurant-website/'],
  ['/blog/when-to-rebuild-your-restaurant-website/',                         '/library/when-to-rebuild-your-restaurant-website/'],
  ['/blog/wix-vs-custom-for-restaurants/',                                   '/library/wix-vs-custom-for-restaurants/'],

  // EN rename moves (de-timed)
  ['/blog/how-much-does-a-custom-restaurant-website-cost-in-2026/',          '/library/custom-restaurant-website-pricing/'],
  ['/blog/uber-eats-vs-doordash-vs-grubhub-restaurant-math-2026/',           '/library/third-party-delivery-comparison/'],
  ['/blog/service-charges-vs-tipping-restaurant-operator-math-2026/',        '/library/service-charge-vs-tipping-model/'],
  ['/blog/how-to-respond-to-google-reviews-restaurant-playbook-2026/',       '/library/google-review-response-playbook/'],
  ['/blog/loyalty-programs-for-independent-restaurants-what-works-2026/',    '/library/loyalty-program-roi/'],
  ['/blog/should-your-restaurant-have-an-app-in-2026/',                      '/library/restaurant-app-decision/'],
  ['/blog/google-ai-mode-reservation-booking-restaurant-2026/',              '/library/ai-mode-reservation-strategy/'],

  // EN merge bundles — schema markup guide
  ['/blog/restaurant-schema-markup-6-types-google-uses/',                    '/library/restaurant-schema-markup-guide/'],
  ['/blog/restaurant-schema-markup-complete-paste-ready-example/',           '/library/restaurant-schema-markup-guide/'],
  // EN merge bundles — reservation conversion guide (funnel + checklist + find-a-table)
  ['/blog/why-your-restaurant-loses-reservations-every-night/',              '/library/reservation-conversion-guide/'],
  ['/blog/five-restaurant-website-changes-recover-one-percent-margin/',      '/library/reservation-conversion-guide/'],
  ['/blog/how-to-recover-reservations-from-googles-find-a-table/',           '/library/reservation-conversion-guide/'],
  // EN merge bundles — third-party delivery economics
  ['/blog/an-honest-doordash-math-for-independent-restaurants-2026/',        '/library/third-party-delivery-economics/'],
  ['/blog/is-doordash-worth-it-for-restaurants-in-2026/',                    '/library/third-party-delivery-economics/'],

  // ES kept-slug moves (native Spanish slugs)
  ['/es/blog/como-hacer-sitio-web-para-mi-restaurante/',                     '/es/library/como-hacer-sitio-web-para-mi-restaurante/'],
  ['/es/blog/como-lograr-que-google-cite-tu-restaurante-en-ai-overview/',    '/es/library/como-lograr-que-google-cite-tu-restaurante-en-ai-overview/'],
  ['/es/blog/como-leer-google-search-console-de-tu-restaurante/',            '/es/library/como-leer-google-search-console-de-tu-restaurante/'],
  ['/es/blog/como-saber-si-una-herramienta-de-restaurante-es-segura/',       '/es/library/como-saber-si-una-herramienta-de-restaurante-es-segura/'],
  ['/es/blog/cuando-rehacer-tu-sitio-web-de-restaurante/',                   '/es/library/cuando-rehacer-tu-sitio-web-de-restaurante/'],
  ['/es/blog/especificaciones-de-fotos-para-restaurantes/',                  '/es/library/especificaciones-de-fotos-para-restaurantes/'],
  ['/es/blog/mi-restaurante-no-aparece-en-google-maps/',                     '/es/library/mi-restaurante-no-aparece-en-google-maps/'],

  // ES Group B — ES counterparts of EN-renamed posts; ES slugs preserved
  // pending translation review (de-timing still TBD).
  ['/es/blog/cuanto-cuesta-una-pagina-web-para-restaurante-2026/',                    '/es/library/cuanto-cuesta-una-pagina-web-para-restaurante-2026/'],
  ['/es/blog/uber-eats-vs-doordash-vs-grubhub-cuentas-para-restaurante-2026/',        '/es/library/uber-eats-vs-doordash-vs-grubhub-cuentas-para-restaurante-2026/'],
  ['/es/blog/cargos-por-servicio-vs-propina-cuentas-para-operador-restaurante-2026/', '/es/library/cargos-por-servicio-vs-propina-cuentas-para-operador-restaurante-2026/'],
  ['/es/blog/como-responder-resenas-google-restaurante-playbook-2026/',               '/es/library/como-responder-resenas-google-restaurante-playbook-2026/'],
  ['/es/blog/programas-de-lealtad-para-restaurantes-independientes-2026/',            '/es/library/programas-de-lealtad-para-restaurantes-independientes-2026/'],
  ['/es/blog/reserva-en-google-ai-mode-restaurante-2026/',                            '/es/library/reserva-en-google-ai-mode-restaurante-2026/'],

  // Cross-language: legacy /es/blog/<en-slug>/ paths from early
  // bilingual-publishing. Cluster 9 (Wave 5b) prefers ES targets
  // when a native ES merge primary exists; otherwise points at the
  // EN library article.
  ['/es/blog/how-to-tell-if-a-restaurant-tool-is-safe/',                              '/es/library/como-saber-si-una-herramienta-de-restaurante-es-segura/'],
  ['/es/blog/restaurant-photo-spec-sheet/',                                           '/es/library/especificaciones-de-fotos-para-restaurantes/'],
  ['/es/blog/when-to-rebuild-your-restaurant-website/',                               '/es/library/cuando-rehacer-tu-sitio-web-de-restaurante/'],
  ['/es/blog/how-to-read-restaurant-google-search-console/',                          '/es/library/como-leer-google-search-console-de-tu-restaurante/'],
  ['/es/blog/how-much-does-a-custom-restaurant-website-cost-in-2026/',                '/es/library/cuanto-cuesta-una-pagina-web-para-restaurante-2026/'],
  ['/es/blog/should-your-restaurant-have-an-app-in-2026/',                            '/library/restaurant-app-decision/'],
  ['/es/blog/restaurant-schema-markup-complete-paste-ready-example/',                 '/es/library/los-6-tipos-de-schema-markup-que-google-usa/'],
  ['/es/blog/five-restaurant-website-changes-recover-one-percent-margin/',            '/library/reservation-conversion-guide/'],
  ['/es/blog/how-to-recover-reservations-from-googles-find-a-table/',                 '/library/reservation-conversion-guide/'],
  ['/es/blog/is-doordash-worth-it-for-restaurants-in-2026/',                          '/es/library/como-salir-de-doordash-mi-restaurante/'],
  ['/es/blog/schema-markup-para-restaurante-ejemplo/',                                '/es/library/los-6-tipos-de-schema-markup-que-google-usa/'],
  ['/es/blog/why-your-restaurant-loses-reservations-every-night/',                    '/library/reservation-conversion-guide/'],
  ['/es/blog/los-6-tipos-de-schema-markup-que-google-usa/',                           '/es/library/los-6-tipos-de-schema-markup-que-google-usa/'],
  ['/es/blog/como-salir-de-doordash-mi-restaurante/',                                 '/es/library/como-salir-de-doordash-mi-restaurante/'],
]);

// Returns the redirect target path for a /blog/ or /es/blog/ pathname,
// or null if no mapping exists. Pure function — the caller wraps the
// result in a Response with the appropriate status (301).
export function lookupBlogLibraryRedirect(pathname) {
  return BLOG_LIBRARY_REDIRECTS.get(pathname) || null;
}
