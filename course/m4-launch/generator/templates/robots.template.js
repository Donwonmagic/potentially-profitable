/**
 * Generator template: robots.txt.
 *
 * Allows all crawlers. Standard, dull, correct — matches the L14
 * lesson's description of the file.
 */

export function renderRobots() {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: sitemap.xml',
    ''
  ].join('\n');
}
