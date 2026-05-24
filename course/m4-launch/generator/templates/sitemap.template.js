/**
 * Generator template: sitemap.xml.
 *
 * Lists the four pages with the current date as lastmod. The operator
 * has no domain yet at generation time, so URLs are relative — Google
 * accepts relative URLs in sitemaps when served from the same origin.
 * The README points operators at the (optional) step of editing the
 * sitemap to use absolute URLs after deploy.
 */

const PAGES = [
  { loc: 'index.html',   priority: '1.0' },
  { loc: 'menu.html',    priority: '0.9' },
  { loc: 'about.html',   priority: '0.7' },
  { loc: 'contact.html', priority: '0.8' }
];

export function renderSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const entries = PAGES.map((p) => [
    '  <url>',
    '    <loc>' + p.loc + '</loc>',
    '    <lastmod>' + today + '</lastmod>',
    '    <priority>' + p.priority + '</priority>',
    '  </url>'
  ].join('\n')).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    ''
  ].join('\n');
}
