#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const excluded = new Set([
  '.git',
  'node_modules',
  'dist',
  'test-results',
  'playwright-report',
  'release',
]);
const blocked = new RegExp(
  [
    'so' + 'lano',
    'viz' + 'caya',
    'da' + 'cayo',
    'tiong' + 'son',
    '16' + '\\.5167',
    '121' + '\\.1833',
    'G-' + '8777S9SP9X',
    '09' + '274008033',
    '69' + ',?296',
    '(?:href|action)=["\'](?:tel:|mailto:)',
    '(?:googletagmanager|google-analytics)\\.com',
  ].join('|'),
  'i'
);
const problems = [];
let count = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excluded.has(e.name)) continue;
    const file = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(file);
      continue;
    }
    if (e.name === 'LICENSE') continue; // Original copyright notices are legally required.
    if (
      !/\.(?:html|js|json|svg|xml|md|txt|webmanifest|yml|sh|py)$/.test(e.name) &&
      !e.name.startsWith('.')
    )
      continue;
    const source = fs.readFileSync(file, 'utf8');
    count++;
    if (blocked.test(source))
      problems.push(path.relative(root, file) + ': obsolete identity, record, contact or tracker');
    if (file.endsWith('.html')) {
      if (/<placeholder(?:\s|>)/i.test(source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')))
        problems.push(path.relative(root, file) + ': unescaped placeholder tag');
      for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
        const url = match[1].split(/[?#]/)[0];
        if (!url || /^(?:[a-z]+:|\/\/)/i.test(url)) continue;
        const target = url.startsWith('/')
          ? path.join(root, url)
          : path.resolve(path.dirname(file), url);
        if (!fs.existsSync(target))
          problems.push(path.relative(root, file) + ': missing local asset or link ' + url);
      }
      for (const match of source.matchAll(/<a\b[^>]*data-placeholder[^>]*>/g)) {
        if (/\bhref=/.test(match[0]))
          problems.push(path.relative(root, file) + ': unconfigured link is active');
      }
    }
  }
}
walk(root);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(
  `Template audit passed (${count} source files; original license attribution retained).`
);
