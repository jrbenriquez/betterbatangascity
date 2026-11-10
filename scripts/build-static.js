#!/usr/bin/env node
/* Build only explicitly approved static assets; no React, backend or secrets. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
execFileSync(process.execPath, [path.join(__dirname, 'audit-template.js')], { stdio: 'inherit' });
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
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
for (const name of [...folders, ...files])
  fs.cpSync(path.join(root, name), path.join(output, name), { recursive: true });
console.log('Static site built in dist/. Preview: npm run serve:dist');
