#!/usr/bin/env node
// Local preview only. Production still consists entirely of static files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { renderPage } = require('./render-templates');
const { folders, files } = require('./static-files');
const root = path.resolve(__dirname, '..');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end();
  }
  try {
    const url = new URL(request.url, 'http://localhost');
    const name = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const target = path.resolve(root, name);
    const relative = path.relative(root, target);
    const first = relative.split(path.sep)[0];
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      !(files.includes(relative) || folders.includes(first) || first === 'admin') ||
      relative.split(path.sep).some((part) => part.startsWith('.'))
    ) {
      response.writeHead(404);
      return response.end('Not found');
    }
    let file = target;
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        response.writeHead(301, { Location: url.pathname + '/' + url.search });
        return response.end();
      }
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file) && !path.extname(file)) file += '.html';
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404);
      return response.end('Not found');
    }
    const extension = path.extname(file);
    const body = extension === '.html' ? renderPage(file) : fs.readFileSync(file);
    response.writeHead(200, {
      'Content-Type': types[extension] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 500);
    response.end(error instanceof URIError ? 'Invalid URL' : error.message);
  }
});

server.listen(Number(process.env.PORT || 8000), '0.0.0.0', () => {
  console.log(`Local preview: http://localhost:${server.address().port}`);
  console.log('Edit pages or templates and reload. Nothing is published automatically.');
});
