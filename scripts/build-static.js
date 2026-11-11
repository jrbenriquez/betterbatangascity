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
const { folders, files } = require('./static-files');
const { renderPage } = require('./render-templates');
for (const name of [...folders, ...files])
  fs.cpSync(path.join(root, name), path.join(output, name), { recursive: true });
function renderDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) renderDirectory(file);
    else if (entry.name.endsWith('.html')) {
      const source = path.join(root, path.relative(output, file));
      fs.writeFileSync(file, renderPage(source));
    }
  }
}
renderDirectory(output);
console.log('Static site built in dist/. Preview: npm run serve:dist');
