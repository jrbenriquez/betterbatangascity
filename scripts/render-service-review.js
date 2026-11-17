const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );
function data() {
  return JSON.parse(fs.readFileSync(path.join(root, 'data/service-review.json'), 'utf8'));
}
function pages(review, values) {
  const numbers = [...new Set(values)].sort((a, b) => a - b);
  const ranges = [];
  for (const n of numbers) {
    const last = ranges.at(-1);
    if (last && n === last[1] + 1) last[1] = n;
    else ranges.push([n, n]);
  }
  return ranges
    .map(
      ([a, b]) =>
        `<a href="${esc(review.source.url)}#page=${a}">${a === b ? `p. ${a}` : `pp. ${a}–${b}`}</a>`
    )
    .join(', ');
}
const allServices = (review) => [...review.services, ...(review.additionalServices || [])];
const labels = {
  'confirmed-city': 'Documented city service',
  'revise-scope': 'Services with specific scopes',
  'external-referral': 'Barangay or external agency',
  'not-established': 'Program confirmation needed',
};
function renderOffice(review, id) {
  const o = review.offices[id];
  return `<article class="charter-office" id="office-${esc(id)}"><h3>${esc(o.name)}</h3><p><i class="bi bi-geo-alt" aria-hidden="true"></i> ${esc(o.address)}</p>${o.locationNote ? `<p class="charter-note">${esc(o.locationNote)}</p>` : ''}<p class="charter-source"><span data-i18n="charter-office-source">Charter office directory:</span> ${pages(review, [o.directoryPage])}</p></article>`;
}
function renderServiceReview(relative) {
  const review = data();
  const slug = path.posix.basename(relative, '.html');
  const id = review.detailPageOffices[slug];
  if (!id) throw Error(`No charter office mapping for ${relative}`);
  const aliases = {
    'municipal-civil-registrar': 'civil-registrar',
    'municipal-general-services': 'general-services',
    mswdo: 'mswdo-services',
    'human-resource-management': 'human-resource',
  };
  const entry = review.services.find((e) => e.id === (aliases[slug] || slug));
  return `<section class="charter-review section" aria-label="2026 Charter office and service reference"><div class="container"><div class="charter-panel"><h2 data-i18n="charter-before-visit">Before you visit</h2>${renderOffice(review, id)}${entry ? `<p class="charter-scope">${esc(entry.publicSummary)}</p><p class="charter-source"><span data-i18n="charter-service-source">Service reference:</span> ${pages(review, entry.pages)}</p>` : ''}<p class="charter-note" data-i18n="charter-guidance-limit">The office location and service scope above are based on the 2026 Charter. Use the cited official transaction for its complete requirements, fees and processing times; confirm current arrangements with the office before travelling.</p><a href="{{root}}services/verified-directory.html" data-i18n="charter-directory-link">View the service map and office directory →</a></div></div></section>`;
}
function renderServiceGuide(relative) {
  const review = data();
  const slug = path.posix.basename(relative, '.html');
  const id = review.detailPageOffices[slug];
  const specific = ['birth-certificate', 'marriage-certificate', 'death-certificate'];
  const entries = allServices(review).filter((e) =>
    specific.includes(slug) ? e.id === slug : e.officeIds.includes(id)
  );
  return `<section class="section"><div class="container"><h2 data-i18n="charter-transactions">Choose the right transaction</h2><p data-i18n="charter-category-intro">Use the service-specific Charter reference to check eligibility, documents, fees and processing times before applying.</p><div class="charter-service-list">${entries.map((e) => `<article class="charter-service"><h3>${esc(e.recommendedTitle)}</h3><p>${esc(e.publicSummary)}</p><p class="charter-source">${pages(review, e.pages)}</p><a href="{{root}}services/verified-directory.html#${esc(e.id)}" data-i18n="charter-location-details">Office location and service details →</a></article>`).join('')}</div><section class="charter-group charter-faq"><h2 data-i18n="charter-applying">Applying for this service</h2><div class="faq-item"><button class="faq-question" type="button" data-i18n="charter-checklist-question">Which requirements, fees and processing time apply?</button><div class="faq-answer" hidden><p data-i18n="charter-checklist-answer">Open the cited official Charter transaction and follow its complete checklist and fee/time table. Different applicant categories and transaction types can have different requirements. The source links above identify the relevant pages.</p></div></div><div class="faq-item"><button class="faq-question" type="button" data-i18n="charter-venue-question">Is the office address always the service venue?</button><div class="faq-answer" hidden><p data-i18n="charter-office-limit">These are administrative office addresses from the Charter. Clinic, inspection, field-service and operating-site locations can differ; follow the service-specific note before travelling.</p></div></div></section></div></section>`;
}

function renderServiceDirectory() {
  const review = data();
  return `<section class="section"><div class="container"><p data-i18n="charter-review-date">Reviewed against the 2026 (2nd Edition) Citizen’s Charter on 11 November 2026. Source confirmation does not guarantee today’s schedule, funding or online availability.</p><p><a href="${esc(review.source.url)}" data-i18n="charter-open-source">Read the official Citizen’s Charter (PDF, 1,133 pages)</a></p><nav class="charter-index" aria-label="Service review sections">${Object.entries(
    labels
  )
    .map(
      ([key, label]) =>
        `<a href="#${key}">${label} (${allServices(review).filter((e) => e.status === key).length})</a>`
    )
    .join(
      ''
    )}<a href="#offices" data-i18n="charter-offices">Office locations</a></nav>${Object.entries(
    labels
  )
    .map(
      ([key, label]) =>
        `<section class="charter-group" id="${key}"><h2>${label}</h2>${key === 'not-established' ? '<p>Not established means this Charter does not confirm the service as described. It does not prove that no such service exists.</p>' : ''}<div class="charter-service-list">${allServices(
          review
        )
          .filter((e) => e.status === key)
          .map(
            (e) =>
              `<article class="charter-service" id="${esc(e.id)}"><h3>${esc(e.recommendedTitle)}</h3><p>${esc(e.publicSummary)}</p><p class="charter-routing">${e.officeIds.map((id) => `<a href="#office-${esc(id)}">${esc(review.offices[id].name)}</a>`).join(' · ') || 'Ask the relevant barangay or agency to confirm its application location.'}</p>${e.pages.length ? `<p class="charter-source">${pages(review, e.pages)}</p>` : '<p class="charter-note">No matching city transaction established; provider verification is still required.</p>'}</article>`
          )
          .join('')}</div></section>`
    )
    .join(
      ''
    )}<section class="charter-group" id="offices"><h2 data-i18n="charter-offices">Office locations</h2><p data-i18n="charter-office-limit">These are administrative office addresses from the Charter. Clinic, inspection, field-service and operating-site locations can differ; follow the service-specific note before travelling.</p><div class="charter-office-list">${Object.keys(
    review.offices
  )
    .map((id) => renderOffice(review, id))
    .join('')}</div></section></div></section>`;
}

function renderServiceCategory(relative) {
  const review = data();
  const category = path.posix.basename(relative, '.html');
  const search = JSON.parse(
    fs.readFileSync(path.join(root, 'data/services.json'), 'utf8')
  ).services;
  const ids = new Set(
    search
      .filter(
        (e) =>
          e.categoryId === category ||
          (category === 'business' && e.categoryId === 'online' && e.id.includes('business')) ||
          (category === 'tax-payments' && e.categoryId === 'online' && !e.id.includes('business'))
      )
      .map((e) => e.id)
  );
  const entries = allServices(review).filter((e) => ids.has(e.id) || e.categoryId === category);
  return `<section class="section"><div class="container"><p data-i18n="charter-category-intro">Use the service-specific Charter reference to check eligibility, documents, fees and processing times before applying.</p><p><a href="verified-directory.html" data-i18n="charter-directory-link">View the service map and office directory →</a></p><div class="charter-service-list">${entries.map((e) => `<article class="charter-service" id="${esc(e.id)}"><p class="charter-note">${esc(labels[e.status])}</p><h2>${esc(e.recommendedTitle)}</h2><p>${esc(e.publicSummary)}</p><p>${e.officeIds.map((id) => `<a href="verified-directory.html#office-${esc(id)}">${esc(review.offices[id].name)}</a>`).join(' · ') || 'Confirm the location with the relevant barangay or agency.'}</p><p><a href="verified-directory.html#${esc(e.id)}" data-i18n="charter-location-details">Office location and service details →</a></p>${e.pages.length ? `<p class="charter-source">${pages(review, e.pages)}</p>` : ''}</article>`).join('')}</div>${category === 'health' ? '<p class="charter-hospital-link"><a href="{{root}}contact/#hospitals" data-i18n="charter-hospital-link">Hospital phone numbers →</a></p>' : ''}</div></section>`;
}

module.exports = {
  renderServiceReview,
  renderServiceDirectory,
  renderServiceCategory,
  renderServiceGuide,
};
