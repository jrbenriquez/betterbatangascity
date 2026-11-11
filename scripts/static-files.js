// One allowlist for the production build and the local preview.
const folders = [
  'assets',
  'data',
  'accessibility',
  'budget',
  'contact',
  'faq',
  'government',
  'legislative',
  'news',
  'privacy',
  'service-details',
  'services',
  'sitemap',
  'statistics',
  'terms',
];
const files = [
  'index.html',
  'CNAME',
  '.nojekyll',
  '403.html',
  '404.html',
  '500.html',
  'offline.html',
  'manifest.webmanifest',
  'robots.txt',
  'sitemap.xml',
  'sw.js',
  'version.json',
  '.htaccess',
  'LICENSE',
];

module.exports = { folders, files };
