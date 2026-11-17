const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const review = require('../../data/service-review.json');
const search = require('../../data/services.json').services;
const { renderHtml, renderPage } = require('../render-templates');

test('every indexed service keeps source-backed routing and stable identity', () => {
  assert.equal(review.services.length, 57);
  assert.equal(search.length, 57);
  assert.deepEqual(new Set(search.map((e) => e.id)), new Set(review.services.map((e) => e.id)));
  for (const entry of review.services) {
    const record = search.find((e) => e.id === entry.id);
    assert.equal(record.verificationStatus, entry.status, entry.id);
    assert.equal(record.description, entry.publicSummary, entry.id);
    assert.deepEqual(record.charterPages, entry.pages, entry.id);
    assert.equal(record.fee, '<placeholder>', entry.id);
    assert.equal(record.processingTime, '<placeholder>', entry.id);
  }
});

test('all evidence references identify existing source pages and known offices', () => {
  assert.equal(review.source.pages, 1133);
  assert.match(review.source.sha256, /^[a-f0-9]{64}$/);
  for (const entry of [...review.services, ...review.additionalServices]) {
    for (const id of entry.officeIds) assert.ok(review.offices[id], `${entry.id}: ${id}`);
    for (const page of entry.pages)
      assert.ok(Number.isInteger(page) && page >= 1 && page <= 1133, entry.id);
    if (entry.status === 'confirmed-city') assert.ok(entry.pages.length > 0, entry.id);
  }
  const directory = renderHtml(
    '<!-- include:service-directory -->',
    'services/verified-directory.html'
  );
  for (const entry of [...review.services, ...review.additionalServices])
    assert.ok(directory.includes(`id="${entry.id}"`));
  for (const id of Object.keys(review.offices)) assert.ok(directory.includes(`id="office-${id}"`));
});

test('office addresses preserve the charter distinctions rather than defaulting to City Hall', () => {
  const bplo = renderPage(
    path.resolve(__dirname, '../../service-details/business-permits-licensing.html')
  );
  const engineer = renderPage(
    path.resolve(__dirname, '../../service-details/municipal-engineering.html')
  );
  const hr = renderPage(
    path.resolve(__dirname, '../../service-details/human-resource-management.html')
  );
  assert.match(bplo, /BayMall, 4th Floor/);
  assert.match(engineer, /P\. Hererra, Barangay Kumintang Ibaba/);
  assert.match(hr, /Bagong Pag-asa Building/);
  assert.match(engineer, /does not establish a separate OSCP street address/);
  assert.doesNotMatch(hr, /Municipal Hall/);
});

test('all existing detail routes render reviewed guidance without the inherited workflows', () => {
  for (const name of Object.keys(review.detailPageOffices)) {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../service-details', name + '.html'),
      'utf8'
    );
    const output = renderHtml(source, 'service-details/' + name + '.html');
    assert.match(output, /Before you visit/);
    assert.match(output, /2026 Charter/);
    assert.match(output, /#page=11(?:29|30|31)/);
    assert.match(output, /complete checklist and fee\/time table/);
    assert.doesNotMatch(
      output,
      /<!--\s*include:|Municipal Hall|Sangguniang Bayan|SEEDO|Slaughter of Hog/
    );
  }
});
