const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const partials = new Set(['header', 'footer']);

function renderPage(file) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  return renderHtml(fs.readFileSync(file, 'utf8'), relative);
}

function renderHtml(source, relative) {
  const prefix = (path.posix.relative(path.posix.dirname(relative), '.') || '.') + '/';
  const section = relative === 'index.html' ? 'home' : relative.split('/')[0];
  const active =
    section === 'service-details' ? 'services' : section === 'budget' ? 'transparency' : section;
  const content = source.replace(
    /<!--\s*include:([^\s]+)(?:\s+([^\s]+))?\s*-->/g,
    (_, name, modifier) => {
      if (!partials.has(name)) throw new Error(`Unknown shared template "${name}" in ${relative}`);
      if (modifier && !(name === 'footer' && modifier === 'no-margin-top')) {
        throw new Error(`Unknown template modifier "${modifier}" in ${relative}`);
      }
      const partial = fs.readFileSync(path.join(root, 'templates', name + '.html'), 'utf8').trim();
      return modifier
        ? partial.replace('class="site-footer"', 'class="site-footer no-margin-top"')
        : partial;
    }
  );
  return content
    .replace(/\{\{root\}\}/g, prefix)
    .replace(/\bdata-nav="([a-z-]+)"/g, (_, target) => {
      if (target !== active) return '';
      const exact = relative === 'index.html' || relative === section + '/index.html';
      return `class="active" aria-current="${exact ? 'page' : 'location'}"`;
    });
}

module.exports = { renderPage, renderHtml };
