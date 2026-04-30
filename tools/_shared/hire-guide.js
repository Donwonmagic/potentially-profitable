/**
 * Shared "who to hire" guide.
 *
 * Originally lived inside tools/audits/restaurant/index.html as
 * AUDIT_HIRE_BY_PLATFORM — extracted here so every tool that
 * surfaces an effort:'dev' or effort:'rebuild' fix can offer the
 * owner the same "if you don't have a developer, here's who to
 * find" disclosure without re-typing the budget ranges, profile
 * names, and directory links.
 *
 * Privacy posture: pure data + render. No fetches, no analytics
 * dispatched here — the caller can wire its own Plausible event
 * if it wants attribution. The platform key is read from
 * MuntinContext.platform when present (written by tech-stack on
 * detection); falls back to 'generic' otherwise.
 */
(function (root) {
  'use strict';

  var TABLE = {
    wix:          { budgetUsd: '$300–$1,500',     profile: 'Wix Partner (certified freelancer)',                directoryUrl: 'https://www.wix.com/marketplace/wix-partners',                                                directoryLabel: 'Wix Marketplace' },
    squarespace:  { budgetUsd: '$300–$1,800',     profile: 'Squarespace Circle Member',                         directoryUrl: 'https://www.squarespace.com/circle/find-an-expert',                                          directoryLabel: 'Squarespace Circle directory' },
    wordpress:    { budgetUsd: '$500–$3,500',     profile: 'WordPress freelancer (Codeable, Upwork, or local)', directoryUrl: 'https://codeable.io/',                                                                       directoryLabel: 'Codeable (curated WP freelancers)' },
    shopify:      { budgetUsd: '$500–$2,500',     profile: 'Shopify Expert',                                    directoryUrl: 'https://experts.shopify.com/',                                                               directoryLabel: 'Shopify Experts directory' },
    webflow:      { budgetUsd: '$1,500–$5,000',   profile: 'Webflow Expert',                                    directoryUrl: 'https://webflow.com/experts',                                                                directoryLabel: 'Webflow Experts directory' },
    bentobox:     { budgetUsd: 'Included in plan',profile: 'BentoBox in-house support',                         directoryUrl: 'https://getbento.com/contact/',                                                              directoryLabel: 'BentoBox support' },
    godaddy:      { budgetUsd: '$200–$800',       profile: 'GoDaddy Pro Marketplace freelancer',                directoryUrl: 'https://www.godaddy.com/pro/marketplace',                                                    directoryLabel: 'GoDaddy Pro Marketplace' },
    custom:       { budgetUsd: '$1,000–$8,000',   profile: 'Restaurant-specialised web freelancer or studio',   directoryUrl: 'https://www.upwork.com/search/profiles/?q=restaurant%20website%20wordpress',                 directoryLabel: 'Upwork (restaurant + web)' },
    generic:      { budgetUsd: 'Varies by platform', profile: 'Web freelancer familiar with your CMS',          directoryUrl: 'https://www.upwork.com/',                                                                    directoryLabel: 'Upwork' }
  };

  // Spanish equivalents for the small set of strings that read
  // weirdly in English on the ES tree. Falls back to English when
  // a key is missing — the budget ranges and directory URLs are
  // locale-neutral.
  var TABLE_ES = {
    wix:          { profile: 'Partner certificado de Wix' },
    squarespace:  { profile: 'Miembro de Squarespace Circle' },
    wordpress:    { profile: 'Freelancer de WordPress (Codeable, Upwork o local)' },
    shopify:      { profile: 'Experto de Shopify' },
    webflow:      { profile: 'Experto de Webflow' },
    bentobox:     { profile: 'Soporte interno de BentoBox', budgetUsd: 'Incluido en el plan' },
    godaddy:      { profile: 'Freelancer del Marketplace de GoDaddy Pro' },
    custom:       { profile: 'Freelancer o estudio especializado en restaurantes' },
    generic:      { profile: 'Freelancer familiarizado con tu CMS', budgetUsd: 'Depende de la plataforma' }
  };

  function lookup(platformKey, locale) {
    var key = (platformKey || 'generic').toLowerCase();
    var base = TABLE[key] || TABLE.generic;
    if (locale === 'es') {
      var override = TABLE_ES[key] || TABLE_ES.generic;
      return {
        budgetUsd:      override.budgetUsd      || base.budgetUsd,
        profile:        override.profile        || base.profile,
        directoryUrl:   base.directoryUrl,
        directoryLabel: base.directoryLabel
      };
    }
    return base;
  }

  function fromContext(opts) {
    opts = opts || {};
    var platformKey = opts.platform;
    if (!platformKey && root.MuntinContext && typeof root.MuntinContext.read === 'function') {
      try {
        var ctx = root.MuntinContext.read();
        if (ctx && typeof ctx.platform === 'string') platformKey = ctx.platform;
      } catch (_) {}
    }
    return lookup(platformKey, opts.locale);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Render a <details> disclosure block. opts:
  //   platform   — explicit platform key (else read from MuntinContext)
  //   locale     — 'es' for Spanish strings; default 'en'
  //   scope      — 'self' | 'dev' | 'rebuild'; tunes the summary line
  //   class      — extra class names on the <details>
  //   summary    — override the default summary text
  function renderDisclosure(opts) {
    opts = opts || {};
    var locale = opts.locale === 'es' ? 'es' : 'en';
    var hire = fromContext({ platform: opts.platform, locale: locale });
    var defaultSummaryEn = (opts.scope === 'rebuild')
      ? "Don't have a developer for the rebuild? →"
      : "Don't have a developer? Here's who to find. →";
    var defaultSummaryEs = (opts.scope === 'rebuild')
      ? '¿No tienes un dev para la reconstrucción? →'
      : '¿No tienes un desarrollador? Aquí cómo encontrarlo. →';
    var summary = opts.summary || (locale === 'es' ? defaultSummaryEs : defaultSummaryEn);
    var lblBudget   = (locale === 'es') ? 'Presupuesto típico' : 'Typical budget';
    var lblProfile  = (locale === 'es') ? 'Quién buscar'        : 'Who to look for';
    var lblWhereEn  = 'Where to look';
    var lblWhereEs  = 'Dónde buscar';
    var lblWhere    = (locale === 'es') ? lblWhereEs : lblWhereEn;
    var lblHelpEn   = 'A 30-minute scoping call usually pays for itself — most platform-native freelancers will give you a free quote on a small task.';
    var lblHelpEs   = 'Una llamada de 30 minutos para alcance suele pagarse sola — la mayoría de freelancers nativos de la plataforma dan presupuesto gratis para tareas pequeñas.';
    var help        = (locale === 'es') ? lblHelpEs : lblHelpEn;
    var classAttr   = opts.class ? ' class="' + escapeHtml(opts.class) + '"' : ' class="hire-guide"';
    return '<details' + classAttr + '>' +
      '<summary class="hire-guide-summary">' + escapeHtml(summary) + '</summary>' +
      '<div class="hire-guide-body">' +
        '<dl class="hire-guide-dl">' +
          '<dt>' + escapeHtml(lblBudget) + '</dt><dd>' + escapeHtml(hire.budgetUsd) + '</dd>' +
          '<dt>' + escapeHtml(lblProfile) + '</dt><dd>' + escapeHtml(hire.profile) + '</dd>' +
          '<dt>' + escapeHtml(lblWhere) + '</dt><dd><a href="' + escapeHtml(hire.directoryUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(hire.directoryLabel) + '</a></dd>' +
        '</dl>' +
        '<p class="hire-guide-note">' + escapeHtml(help) + '</p>' +
      '</div>' +
    '</details>';
  }

  root.MuntinHire = {
    PLATFORMS: TABLE,
    lookup:           lookup,
    fromContext:      fromContext,
    renderDisclosure: renderDisclosure
  };

})(typeof window !== 'undefined' ? window : this);
