const test = require('node:test');
const assert = require('node:assert/strict');
const { renderHtml } = require('../render-templates');

test('the shared header works at the root and in nested directories', () => {
  const home = renderHtml('<!-- include:header -->', 'index.html');
  assert.match(home, /src="\.\/assets\/images\/logo\/template-logo.svg"/);
  assert.match(home, /<a(?=[^>]*aria-current="page")(?=[^>]*data-i18n="nav-home")[^>]*>/);
  const nested = renderHtml('<!-- include:header -->', 'service-details/birth-certificate.html');
  assert.match(nested, /href="\.\.\/services\/certificates.html"/);
  assert.match(nested, /<a(?=[^>]*aria-current="location")(?=[^>]*data-i18n="nav-services")[^>]*>/);
  assert.doesNotMatch(nested, /\{\{root\}\}|data-nav=|include:header/);
  const deeper = renderHtml('<!-- include:header -->', 'services/permits/example.html');
  assert.match(deeper, /src="\.\.\/\.\.\/assets\//);
});

test('a section landing page marks its own navigation item', () => {
  const government = renderHtml('<!-- include:header -->', 'government/index.html');
  assert.match(
    government,
    /<a(?=[^>]*aria-current="page")(?=[^>]*data-i18n="nav-government")[^>]*>/
  );
  assert.equal((government.match(/class="active"/g) || []).length, 1);
});

test('footer spacing variants retain the same shared content', () => {
  const normal = renderHtml('<!-- include:footer -->', 'index.html');
  const flush = renderHtml('<!-- include:footer no-margin-top -->', 'index.html');
  assert.equal(flush.replace('site-footer no-margin-top', 'site-footer'), normal);
  assert.match(normal, /unofficial community information portal for Batangas City/);
  assert.match(normal, /href="\.\/privacy\/"/);
});

test('misspelled includes and unsupported modifiers fail rather than publishing a missing layout', () => {
  assert.throws(
    () => renderHtml('<!-- include:missing -->', 'index.html'),
    /Unknown shared template/
  );
  assert.throws(
    () => renderHtml('<!-- include:footer invalid -->', 'index.html'),
    /Unknown template modifier/
  );
});
