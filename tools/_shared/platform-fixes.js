/**
 * Shared per-platform fix-recipe registry for the Muntin Digital toolkit.
 *
 * Problem: every diagnostic tool — speed-test, seo-grader, schema-check,
 * mobile-check, audits, gbp-grader — tells the owner *what* is wrong but
 * stops at developer-shaped remediation ("ask your developer to wrap the
 * number in a tel: link"). The everyday owner *is* the developer, and
 * they're on Wix / Squarespace / WordPress / Webflow / Toast Sites /
 * Square Online / GoDaddy / Shopify. They need a 3-step admin-pane
 * recipe.
 *
 * This module is the single registry, keyed by (platform, fixId), so
 * a fix-recipe written once for "edit your title tag on Squarespace"
 * can be rendered consistently in seo-grader, audits, and storefront-
 * health drill-downs.
 *
 * Resolution order:
 *   1. exact platform match → use its steps
 *   2. fallback to 'generic' recipe (always present)
 *   3. if fixId itself is unknown → return null (caller should hide
 *      the fix-it-yourself UI rather than render a stub)
 *
 * Platform IDs (kebab-case, stable):
 *   wix · squarespace · wordpress · webflow · shopify · toast-sites ·
 *   square-online · godaddy · bentobox · popmenu · custom · generic
 *
 * Fix IDs (kebab-case, stable; share with check IDs in restaurant-
 * checks.js where applicable):
 *   viewport-meta       — add or fix the mobile viewport meta tag
 *   image-compress      — replace a heavy hero image with a compressed one
 *   title-meta-edit     — edit the page <title> and meta description
 *   jsonld-inject       — paste a JSON-LD <script> block in <head>
 *   hours-edit          — update opening hours
 *   tap-target-padding  — make tap targets / buttons larger
 *   alt-text-bulk       — add alt text to images
 *   tel-link            — wrap phone number in tel: link
 *   maps-link           — wrap address in Google Maps link
 *
 * Caller pattern:
 *
 *   var platform = MuntinContext.get('platform') || 'generic';
 *   var recipe = MuntinPlatformFixes.get('viewport-meta', platform);
 *   if (recipe) renderRecipe(recipe);
 *
 * Each recipe is a small object — short steps, no marketing fluff.
 *
 *   { platform, fixId, etaMinutes, steps: [string, ...],
 *     deepLink?: string, screenshot?: string, note?: string }
 */

(function (root) {
  'use strict';

  // The registry is a flat map keyed by `${fixId}|${platform}`. New
  // entries: just add to RECIPES. Missing platform falls back to the
  // 'generic' entry under the same fixId.
  var RECIPES = {

    // --------- title-meta-edit ----------
    'title-meta-edit|wix': {
      etaMinutes: 5,
      steps: [
        'In your Wix dashboard, click the page in the left sidebar (Home, Menu, etc.).',
        'Click the "SEO Basics" tab at the top of the page editor.',
        'Type your new Title Tag (under 60 characters) and Meta Description (under 155 characters).',
        'Click Save, then Publish.'
      ],
      note: 'Wix can take up to 48 hours to reflect changes in Google search results.'
    },
    'title-meta-edit|squarespace': {
      etaMinutes: 5,
      steps: [
        'Open the page you want to edit. In the left sidebar, click the gear icon next to the page name.',
        'Click "SEO" in the page settings panel.',
        'Type your new SEO Title and SEO Description.',
        'Click Save.'
      ]
    },
    'title-meta-edit|wordpress': {
      etaMinutes: 5,
      steps: [
        'Open the page in WordPress (Pages → All Pages → click the page).',
        'Scroll to the Yoast SEO, Rank Math, or AIOSEO box (whichever is installed).',
        'Edit the SEO Title and Meta Description.',
        'Click Update.'
      ],
      note: 'If none of those plugins is installed, the title comes from the page title field at the top.'
    },
    'title-meta-edit|shopify': {
      etaMinutes: 5,
      steps: [
        'In your Shopify admin, go to Online Store → Pages.',
        'Click the page you want to edit.',
        'Scroll to "Search engine listing" and click Edit.',
        'Type your new Page Title and Meta Description, then click Save.'
      ]
    },
    'title-meta-edit|generic': {
      etaMinutes: 5,
      steps: [
        'Find the page settings or SEO settings in your website admin.',
        'Look for fields labeled "Title Tag," "Page Title," "SEO Title," or "Meta Description."',
        'Type your new title (under 60 characters) and description (under 155 characters).',
        'Save and publish.'
      ]
    },

    // --------- viewport-meta ----------
    'viewport-meta|wix': {
      etaMinutes: 1,
      steps: [
        'Wix handles the mobile viewport tag automatically — you don\'t edit it directly.',
        'Open your site in the editor and click the phone icon at the top to switch to Mobile view.',
        'If anything is misaligned, adjust it in mobile view; Wix will set the viewport correctly.',
        'Click Publish.'
      ],
      note: 'If a mobile-viewport check still fails on a Wix site, the issue is usually a third-party embed overriding the tag — open your Embed elements and remove any custom <meta> tags.'
    },
    'viewport-meta|squarespace': {
      etaMinutes: 1,
      steps: [
        'Squarespace ships the mobile viewport tag automatically on all templates.',
        'If a Code Injection block has overridden it, go to Settings → Advanced → Code Injection.',
        'Remove any line that contains <meta name="viewport"> from the Header field.',
        'Save.'
      ]
    },
    'viewport-meta|wordpress': {
      etaMinutes: 5,
      steps: [
        'Most modern WordPress themes ship the viewport tag. Check by viewing your site\'s page source (right-click → View Source) and searching for "viewport".',
        'If missing, edit your theme\'s header.php (Appearance → Theme File Editor → header.php).',
        'In the <head> section, paste: <meta name="viewport" content="width=device-width, initial-scale=1">',
        'Click Update File.'
      ],
      note: 'If your theme is third-party, contact the theme author rather than editing the file directly — your edit may be overwritten on the next theme update.'
    },
    'viewport-meta|generic': {
      etaMinutes: 5,
      steps: [
        'In your site\'s admin, find Settings → Code Injection, or your theme\'s header file.',
        'In the <head> section, paste: <meta name="viewport" content="width=device-width, initial-scale=1">',
        'Save and publish.'
      ]
    },

    // --------- jsonld-inject ----------
    'jsonld-inject|wix': {
      etaMinutes: 5,
      steps: [
        'In your Wix dashboard, go to Settings → Marketing & SEO → SEO Tools → Custom Code.',
        'Click + Add Custom Code.',
        'Paste your <script type="application/ld+json"> block into the code box.',
        'Set "Add Code to Pages" to All Pages and "Place Code in" to Head.',
        'Apply and Publish.'
      ]
    },
    'jsonld-inject|squarespace': {
      etaMinutes: 5,
      steps: [
        'Go to Settings → Advanced → Code Injection.',
        'Paste your <script type="application/ld+json"> block into the Header field.',
        'Click Save.'
      ],
      note: 'On Squarespace 7.0 templates, Code Injection is under Settings → Advanced. On 7.1, the path is the same.'
    },
    'jsonld-inject|wordpress': {
      etaMinutes: 10,
      steps: [
        'Install a header/footer plugin like "Insert Headers and Footers" or "WPCode" (Plugins → Add New).',
        'After activating, go to Settings → WPCode → Header & Footer (or Insert Headers and Footers).',
        'Paste your <script type="application/ld+json"> block into the Scripts in Header field.',
        'Save.'
      ],
      note: 'Many SEO plugins (Yoast Premium, Rank Math, AIOSEO) emit Restaurant schema automatically — check those settings before pasting manually.'
    },
    'jsonld-inject|shopify': {
      etaMinutes: 10,
      steps: [
        'In your Shopify admin, go to Online Store → Themes → Actions → Edit code.',
        'Open layout/theme.liquid in the file tree.',
        'Find the closing </head> tag and paste your <script type="application/ld+json"> block just before it.',
        'Click Save.'
      ]
    },
    'jsonld-inject|generic': {
      etaMinutes: 10,
      steps: [
        'Find your site\'s Code Injection, Custom Code, or theme header file.',
        'Paste the <script type="application/ld+json">…</script> block inside <head>.',
        'Save and publish.',
        'Verify with the Rich Results Test at search.google.com/test/rich-results.'
      ]
    },

    // --------- image-compress ----------
    'image-compress|wix': {
      etaMinutes: 5,
      steps: [
        'In Wix Editor, click the heavy image and click Settings → Replace Image.',
        'Upload a compressed copy (use the Speed Test\'s built-in compressor, or any web tool).',
        'Wix will serve the new image at multiple sizes automatically.',
        'Publish.'
      ]
    },
    'image-compress|squarespace': {
      etaMinutes: 5,
      steps: [
        'Open the page and double-click the heavy image.',
        'Click Replace and upload a compressed copy (under 500 KB recommended).',
        'Save.'
      ],
      note: 'Squarespace caps source uploads at 20 MB but serves a smaller version automatically. Compressing the source still helps because the server has less to work with.'
    },
    'image-compress|wordpress': {
      etaMinutes: 10,
      steps: [
        'Install an image-optimization plugin like Smush, ShortPixel, or EWWW (Plugins → Add New).',
        'Run a bulk-optimize from the plugin\'s settings page.',
        'For new uploads, optimization runs automatically.'
      ]
    },
    'image-compress|generic': {
      etaMinutes: 5,
      steps: [
        'Compress the image to under 500 KB (use the Speed Test\'s compressor or any online JPEG/WebP converter).',
        'Re-upload the compressed version in your site admin, replacing the original.',
        'Save and verify with the Speed Test again.'
      ]
    },

    // --------- tel-link ----------
    'tel-link|wix': {
      etaMinutes: 3,
      steps: [
        'Click the phone number text in the Wix Editor.',
        'In the formatting toolbar, click the link icon.',
        'Choose "Phone Number" and type your number with country code (e.g. +1 301 555 1234).',
        'Click Done, then Publish.'
      ]
    },
    'tel-link|squarespace': {
      etaMinutes: 3,
      steps: [
        'Highlight the phone number in your text block.',
        'Click the link icon in the toolbar.',
        'Type tel:+13015551234 (replace with your actual number, including country code).',
        'Save.'
      ]
    },
    'tel-link|wordpress': {
      etaMinutes: 3,
      steps: [
        'Edit the page or widget where the phone number appears.',
        'Highlight the number, click the link icon, and type tel:+13015551234.',
        'Update.'
      ]
    },
    'tel-link|generic': {
      etaMinutes: 3,
      steps: [
        'Highlight the phone number in your site editor.',
        'Add a link with the URL tel:+1XXXXXXXXXX (your number, with country code, no spaces).',
        'Save.'
      ]
    }
  };

  function get(fixId, platform) {
    if (!fixId) return null;
    var p = (platform || 'generic').toLowerCase();
    var key = fixId + '|' + p;
    if (RECIPES[key]) {
      return Object.assign({ platform: p, fixId: fixId }, RECIPES[key]);
    }
    var fallback = RECIPES[fixId + '|generic'];
    if (fallback) {
      return Object.assign({ platform: 'generic', fixId: fixId, fallback: true }, fallback);
    }
    return null;
  }

  // List the platforms that have a custom (non-generic) recipe for a
  // given fix. Useful for rendering a tab picker that highlights which
  // platforms have a tailored recipe.
  function platformsWithRecipe(fixId) {
    if (!fixId) return [];
    var prefix = fixId + '|';
    var out = [];
    Object.keys(RECIPES).forEach(function (k) {
      if (k.indexOf(prefix) === 0) {
        var p = k.slice(prefix.length);
        if (p !== 'generic') out.push(p);
      }
    });
    return out.sort();
  }

  // Known fix IDs (drives a Storybook-style "what fixes do we cover" page
  // and lets callers validate they're not asking for a typo).
  function knownFixIds() {
    var ids = {};
    Object.keys(RECIPES).forEach(function (k) {
      ids[k.split('|')[0]] = true;
    });
    return Object.keys(ids).sort();
  }

  // Known platforms across all recipes (excluding 'generic'), useful
  // for rendering a default tab order.
  function knownPlatforms() {
    var ps = {};
    Object.keys(RECIPES).forEach(function (k) {
      var p = k.split('|')[1];
      if (p && p !== 'generic') ps[p] = true;
    });
    return Object.keys(ps).sort();
  }

  // `Object.assign` polyfill for older browsers (IE11). Restaurant
  // owners on ancient hardware exist; the rest of the toolkit ships
  // ES5-compatible code already.
  if (typeof Object.assign !== 'function') {
    Object.assign = function (target) {
      if (target == null) throw new TypeError('Cannot convert undefined or null to object');
      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i];
        if (src != null) {
          for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) to[k] = src[k];
        }
      }
      return to;
    };
  }

  var api = {
    get: get,
    platformsWithRecipe: platformsWithRecipe,
    knownFixIds: knownFixIds,
    knownPlatforms: knownPlatforms
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MuntinPlatformFixes = api;
  }
})(typeof self !== 'undefined' ? self : this);
