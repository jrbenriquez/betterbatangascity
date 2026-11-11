# Static LGU website template

This unofficial Batangas City community portal uses plain HTML, CSS, JavaScript and JSON. It has no framework or added dependencies. Build it once and serve the resulting files from any static host; production needs no application server or database. The city name is filled in; unverified officials, contacts, fees, statistics and records remain placeholders.

## Preview and build

```sh
npm run dev
# Open http://localhost:8000
npm run build
npm run serve:dist
# Open http://localhost:8080
```

`npm run dev` previews the source locally, including the news editor at `/admin/news-editor.html`. Edit a page or shared template and reload the browser to see the change. This development server is only for local editing.

`npm run build` audits the rendered pages, expands shared templates, and copies an explicit list of public assets into `dist/`. It does not install dependencies, change the version or merge another application. Upload the contents of `dist/` to your static host. Links include `.html` where needed, so Apache rewrite rules are optional. `npm run package` produces a cPanel archive. Publish the built `dist/` directory, since source pages contain template includes.

## Shared header and footer

Edit `templates/header.html` to change navigation, the header logo or language buttons across all 51 full pages. Edit `templates/footer.html` to change shared footer links and text. The standalone offline page keeps its compact layout.

Page files contain `<!-- include:header -->` and `<!-- include:footer -->` in place of repeated markup. Four pages use `<!-- include:footer no-margin-top -->` to preserve their existing footer spacing. Each page's main content stays in its original HTML file.

Within a shared template, prefix internal links and assets with `{{root}}`, for example `href="{{root}}services/"`. The renderer calculates the correct relative path for every page, including deployments in a subdirectory. Header links marked with `data-nav="services"` are highlighted automatically in the services section. These are the only template features; browser search, news JSON, styles and translations keep using the existing JavaScript.

## Fill in the template

Every literal `<placeholder>` identifies content that needs review and replacement. HTML uses `&lt;placeholder&gt;` so it displays visibly. JSON and translations use the literal string. Keep placeholders as text when rendering them in JavaScript.

- The two `assets/images/logo/template-logo*.svg` assets currently say Batangas City. Replace their artwork and the generic favicon when branding is ready.
- Fill in page titles, descriptions, local history, addresses, contacts, official names, office schedules, fees, processing times and local guidance in the HTML pages.
- Fill in the matching values for English and Filipino in `assets/js/translations.js`. Content identifiers are intentionally neutral. A language switch must not restore another municipality's records.
- Replace the example records in `data/` with verified local records. Statistics, financial amounts, project summaries, legislative records and competitiveness values remain placeholders. Empty charts do not depict zero-valued statistics. Wire verified numeric datasets to charts before enabling them.
- Contact, social, donation, appointment, document and former external portal links awaiting configuration have no `href` and carry `data-placeholder="<placeholder>"` and `aria-disabled="true"`. Set a verified URL, remove those attributes, and review its label before enabling a link. Embedded social feeds show a placeholder and make no social API requests.
- The planned public domain is `betterbatangascity.org`; canonical URLs and the sitemap use it. Domain configuration does not imply government affiliation.
- Review all legal and service guidance for the target LGU before publication. General service categories are navigation examples, not a verified citizen's charter.

Search for `&lt;placeholder&gt;` in HTML and `<placeholder>` in JSON/JavaScript to locate incomplete fields. Technical numbers such as CSS dimensions, versions, service step labels and API coordinates are configuration, not local records.

## Browser APIs

`assets/js/site-config.js` is the shared public configuration. Weather requests use Open-Meteo at **13.7565, 121.0587 (Batangas City)** with `Asia/Manila` time. The OpenStreetMap iframe shows the same location. PHP exchange rates use the public ExchangeRate-API endpoint and are national currency data. These requests run in the visitor's browser and require an internet connection; they do not require an application server or API key. If an API is unavailable, its display remains `<placeholder>` rather than showing invented data.

The site includes no analytics measurement ID, Facebook synchronization workflow, FTP publishing credentials, appointment backend or automatic data publication. The service worker clears previous offline caches and does not cache sensitive local records. Old browser storage is not used for weather or financial data.

## Validation

```sh
npm run audit:template
npm run test:layouts
npm run build
npx playwright test tests/template.spec.js --project=chrome
```

The audit checks public source for old branding, local identifiers, phone numbers, email links, tracking IDs, old coordinates and dangling local assets. Browser tests verify placeholders, language switching, static navigation and Batangas City weather requests, including API failures.

## License

See [LICENSE](LICENSE). The original copyright notices are retained as required by the source license. They are legal attribution, not template contact information or a claim of government affiliation. Other personal contact information and municipality-specific records have been removed from the public template.

## Interface maintenance and visual comparisons

Shared interface styles live in `assets/css/interface.css`. The existing blue brand and spacing scale are retained. `assets/js/interface.js` supplies keyboard-accessible FAQs/tabs, local table scrolling and readable template markers. The notice and optional local-information strip are shared templates. Missing records still display `<placeholder>`; unavailable actions stay inactive. Fonts and icons are local assets with their license notices alongside them.

See [the interface review](docs/interface-review.md) for the applied skills, evidence, verified scope, test commands and screenshot reproduction. The before/after gallery is generated outside the production build.

## GitHub Pages

The deployment configuration targets `https://betterbatangascity.org` and publishes built `dist/` files after successful main validation. Follow [the hosting and DNS setup guide](docs/github-pages.md) before activating it. DNS and repository Pages settings are not changed by a local build.
