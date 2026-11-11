#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { renderPage } = require('./render-templates');
const root = path.resolve(__dirname, '..');
const excluded = new Set([
  '.git',
  'node_modules',
  'dist',
  'test-results',
  'playwright-report',
  'release',
  'review-artifacts',
]);
const blocked = new RegExp(
  [
    'so' + 'la(?:n|en)',
    'viz' + 'caya',
    'da' + 'cayo',
    'tiong' + 'son',
    '16' + '\\.5167',
    '121' + '\\.1833',
    'G-' + '8777S9SP9X',
    '09' + '274008033',
    '69' + ',?296',
    '(?:href|action)=["\']mailto:',
    '(?:googletagmanager|google-analytics)\\.com',
  ].join('|'),
  'i'
);
// Batangas City LGU public listing, transcribed from the user-supplied source.
// Keep this allowlist explicit so other unconfigured contact links still fail.
const publishedContacts = new Set([
  'tel:+639992226626',
  'tel:+63437231511',
  'tel:+63434257163',
  'tel:+639156021984',
  'tel:+63437232030',
  'tel:+639164291515',
  'tel:+639996946805',
  'tel:+63437023902',
  'tel:+639568267017',
  'tel:16211',
  'tel:16222874',
  'sms:+639209716211',
  'sms:+639175516211',
  'tel:+63433003592',
  'tel:+639494142633',
  'tel:+63439806928',
  'tel:+63437409738',
  'tel:+63437230911',
  'tel:+63437231605',
  'tel:+63437234144',
  'tel:+63437232508',
  'tel:+63434038642',
  'tel:+639189942074',
]);
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
      !/\.(?:html|css|js|json|svg|xml|md|txt|webmanifest|yml|sh|py)$/.test(e.name) &&
      !e.name.startsWith('.')
    )
      continue;
    let source;
    try {
      source = file.endsWith('.html') ? renderPage(file) : fs.readFileSync(file, 'utf8');
    } catch (error) {
      problems.push(path.relative(root, file) + ': ' + error.message);
      continue;
    }
    const normalizedSource = source.normalize('NFKD').replace(/\p{M}/gu, '');
    count++;
    if (blocked.test(normalizedSource))
      problems.push(path.relative(root, file) + ': obsolete identity, record, contact or tracker');
    if (file.endsWith('.html')) {
      for (const match of source.matchAll(/\bhref=["']((?:tel|sms):[^"']+)["']/gi)) {
        if (!publishedContacts.has(match[1]))
          problems.push(
            path.relative(root, file) + ': contact is not in the published city listing'
          );
      }
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
