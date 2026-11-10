# Static LGU website template

This template contains plain HTML, CSS, JavaScript and JSON. Serve it from any static host; it needs no backend, database, React build, credentials, analytics account or scheduled job.

## Preview and build

```sh
npm run dev
# Open http://localhost:8000
npm run build
npm run serve:dist
# Open http://localhost:8080
```

`npm run build` audits the source and copies an explicit list of public assets into `dist/`. It does not install dependencies, change the version or merge another application. Upload the contents of `dist/` to your static host. Links include `.html` where needed, so Apache rewrite rules are optional. `npm run package` produces a cPanel archive.

## Fill in the template

Every literal `<placeholder>` identifies content that needs review and replacement. HTML uses `&lt;placeholder&gt;` so it displays visibly. JSON and translations use the literal string. Keep placeholders as text when rendering them in JavaScript.

- Replace the two `assets/images/logo/template-logo*.svg` assets and the generic favicon.
- Fill in page titles, descriptions, local history, addresses, contacts, official names, office schedules, fees, processing times and local guidance in the HTML pages.
- Fill in the matching values for English and Filipino in `assets/js/translations.js`. Content identifiers are intentionally neutral. A language switch must not restore another municipality's records.
- Replace the example records in `data/` with verified local records. Statistics, financial amounts, project summaries, legislative records and competitiveness values remain placeholders. Empty charts do not depict zero-valued statistics. Wire verified numeric datasets to charts before enabling them.
- Contact, social, donation, appointment, document and former external portal links awaiting configuration have no `href` and carry `data-placeholder="<placeholder>"` and `aria-disabled="true"`. Set a verified URL, remove those attributes, and review its label before enabling a link. Embedded social feeds show a placeholder and make no social API requests.
- Configure a real site domain before adding canonical URLs, structured organization metadata and absolute URLs to `sitemap.xml`. No domain or government affiliation is assumed.
- Review all legal and service guidance for the target LGU before publication. General service categories are navigation examples, not a verified citizen's charter.

Search for `&lt;placeholder&gt;` in HTML and `<placeholder>` in JSON/JavaScript to locate incomplete fields. Technical numbers such as CSS dimensions, versions, service step labels and API coordinates are configuration, not local records.

## Browser APIs

`assets/js/site-config.js` is the shared public configuration. Weather requests use Open-Meteo at **13.7565, 121.0587 (Batangas City)** with `Asia/Manila` time. The OpenStreetMap iframe shows the same location. PHP exchange rates use the public ExchangeRate-API endpoint and are national currency data. These requests run in the visitor's browser and require an internet connection; they do not require an application server or API key. If an API is unavailable, its display remains `<placeholder>` rather than showing invented data.

The site includes no analytics measurement ID, Facebook synchronization workflow, FTP publishing credentials, appointment backend or automatic data publication. The service worker clears previous offline caches and does not cache sensitive local records. Old browser storage is not used for weather or financial data.

## Validation

```sh
npm run audit:template
npm run build
npx playwright test tests/template.spec.js --project=chrome
```

The audit checks public source for old branding, local identifiers, phone numbers, email links, tracking IDs, old coordinates and dangling local assets. Browser tests verify placeholders, language switching, static navigation and Batangas City weather requests, including API failures.

## License

See [LICENSE](LICENSE). The original copyright notices are retained as required by the source license. They are legal attribution, not template contact information or a claim of government affiliation. Other personal contact information and municipality-specific records have been removed from the public template.
