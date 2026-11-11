# BetterLGU interface review and implementation

## Scope and coverage

Scope: all 52 public HTML pages and the local news editor, shared templates, every application stylesheet (including embedded styles), and shared navigation, search, local information, news and popup behavior. The existing static HTML/CSS/JavaScript stack, Inter typeface, Bootstrap icon family, blue brand and spacing tokens remain in use. No framework or production package dependency was added.

Reference: [jakubkrehel/skills](https://github.com/jakubkrehel/skills/tree/8b254eb75dadf3615a6abce87aed28e1b6e4d77c/skills), pinned to `8b254eb`. Applied `better-ui`, `better-layout` and `better-interface`; the interface review also loaded the owning accessibility, writing, typography and colors skills. Project conventions inspected: `CONTRIBUTING.md`, `README.md`, existing CSS tokens and shared templates. The target repository has no AGENTS.md, separate design-system guide, Storybook or interface ADRs.

| Domain        | Evidence inspected                                                                                                                                                     | Result                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Accessibility | Shared navigation, nine FAQ buttons, search, six indicator tabs, two legislative tabs, popup focus/inert state, editor labels/errors; axe on 16 representative screens | Confirmed findings fixed; keyboard tests pass                                                  |
| Layout        | All 53 screens at 1440, 390 and 320px; narrow tables; 200% text resize; FIL and homepage RTL stress                                                                    | No page-level overflow in the 159 captured checks                                              |
| Writing       | Unavailable appointment/social actions, news and weather empty/error states, editor errors, incomplete-record indicators, unofficial identity                          | Misleading live/available claims replaced; recovery actions supplied; EN/FIL updated           |
| Typography    | Existing Inter loading, mobile inputs, wrapping descriptions, numerical information, placeholder values                                                                | Inputs at least 16px; text remains selectable; long values wrap; numbers use tabular figures   |
| Colors        | Rendered axe contrast checks, a separate opaque-solid text-pair scan across all public pages, input-boundary measurements and semantic status roles                    | Confirmed failing pairs fixed; measured examples below                                         |
| UI polish     | Surfaces, input boundaries, hover/pressed/disabled states, reduced motion, transitions and scroll containment                                                          | Shared surface rules, named transitions, hover-capability guards and exact 0.96 press feedback |

The screenshot gallery contains **32 before/after pairs**: desktop and mobile views of 16 representative screens. It includes the homepage, service directory, a service detail page, government, officials, statistics, budget, legislation, news, contact, FAQ, privacy, accessibility, error, offline and editor views. All other pages are included in the layout/runtime sweep. Local facts and the accuracy of existing service guidance were not independently verified; placeholder records remain placeholders.

## Findings

Each row groups one root cause. “After” describes the implemented result; no unresolved HIGH finding remains within the verified scope.

| Severity | Domain                 | Location                                                                                                                | Before                                                                                                               | After                                                                                                                                              | Why                                                                                          |
| -------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| HIGH     | Layout                 | `templates/notice.html:1`; former `.hotline-bar` markup across 51 pages                                                 | A cloned scrolling strip of unconfigured numbers extended the page beyond phone widths                               | A wrapping unofficial-portal notice replaces the strip; verified contacts remain a separate page                                                   | Reflow at 320px; removes inaccessible off-screen placeholder controls and misleading urgency |
| HIGH     | Layout                 | `assets/js/interface.js:32`; process tables throughout `service-details/`                                               | Wide tables expanded the page by hundreds of pixels                                                                  | Tables scroll inside labeled, keyboard-focusable regions with visible instructions when needed                                                     | Keep two-dimensional information available without making the whole page scroll horizontally |
| HIGH     | Accessibility          | `assets/js/interface.js:68`; `service-details/birth-certificate.html:463`; `service-details/death-certificate.html:883` | FAQ questions were click handlers on divs                                                                            | Native buttons support Enter/Space and expose expanded state and answer ownership                                                                  | WCAG 2.1.1: every pointer path needs a keyboard path                                         |
| HIGH     | Accessibility          | `assets/js/interface.js:85`; `statistics/index.html`; `legislative/index.html`                                          | Indicator tabs did not switch panels; selected state was incomplete                                                  | Keyboard-operated tabs expose selection, relationships and visible panels; unsupported fiscal periods are explicitly disabled                      | WCAG 2.1.1 and 4.1.2: controls must work and expose their state                              |
| HIGH     | Accessibility / colors | `assets/css/interface.css:17`; shared skip link, inputs, footer and status badges                                       | Light text/status colors failed required contrast; an overriding card style could leave its text white on white      | Context-specific semantic colors and visible input/focus boundaries; restored service-directory card text                                          | WCAG 1.4.3 and 1.4.11; measured examples below                                               |
| HIGH     | Writing                | `index.html` appointment/social sections; `assets/js/news.js`; `assets/js/info-bar.js:7`                                | Unconfigured actions looked enabled; social copy promised real-time posts; unavailable data offered no next step     | Explicit unavailable states, inactive action styling, unpublished-news guidance and weather retry; records stay placeholders                       | Do not promise an unavailable action; explain recovery beside the affected content           |
| HIGH     | Accessibility          | `assets/js/volunteer-popup.js:11`; `assets/js/interface.js` disabled-action guard                                       | Popup focus trapping did not make its background inert; disabled anchors could still run click handlers              | Background becomes inert until dismissal; unavailable actions cannot activate                                                                      | Modal semantics and disabled-state behavior must match their presentation                    |
| HIGH     | Accessibility / UI     | `templates/info-bar.html:21`; `assets/js/info-bar.js`; `assets/css/interface.css:807`                                   | Automatic updates had no pause control; shared motion and hover rules lacked consistent preference guards            | Updates can be paused; currency no longer rotates; movement is gated by reduced-motion preference; mobile menu transitions can reverse immediately | WCAG 2.2.2; motion must not be the only feedback or ignore user preferences                  |
| HIGH     | Layout                 | `assets/css/interface.css` `.footer-cost`                                                                               | Two placeholder values were forced onto one line during 200% text resize                                             | The badge wraps within the footer column                                                                                                           | Critical content must survive text growth rather than escape the layout                      |
| MEDIUM   | Typography             | `assets/css/interface.css`; source search labels in `index.html` and `services/index.html`                              | Small controls, clamped descriptions and variable-width numerical figures made scanning and text growth inconsistent | Readable mobile inputs, full service descriptions, balanced headings, tabular numbers and visible placeholder chips                                | Typography should remain readable and stable as content changes                              |
| MEDIUM   | UI                     | Shared stylesheets and embedded page styles; `assets/js/search.js`                                                      | `transition: all`, ungated hover effects and unnecessary compositing hints appeared repeatedly                       | Named short transitions, hover-capable pointer guards, reduced decorative motion and no layout-property will-change                                | Avoid accidental animations and touch states that latch after tapping                        |
| MEDIUM   | Accessibility          | `admin/news-editor.html:555`; local editor form                                                                         | The file input had no name; the add button had zero width; invalid fields were not exposed or focused                | Named import input, usable button width, linked error text, aria-invalid and first-error focus                                                     | WCAG 1.3.1, 3.3.1 and 4.1.2; errors should identify what to fix                              |

### Measured contrast examples

Values below use the WCAG relative-luminance calculation; foreground/background pairs are opaque rendered tokens, not estimated colors.

| Pair                    | Before evidence                            | After                               | Required |
| ----------------------- | ------------------------------------------ | ----------------------------------- | -------- |
| Skip-link text          | White on red: 3.99:1                       | White on `#002170`: **14.47:1**     | 4.5:1    |
| Footer disclaimer       | A muted rendered pair failed during review | `#c7d2e6` on `#11213e`: **10.52:1** | 4.5:1    |
| Secondary text on white | Multiple inconsistent literals             | `#526078` on white: **6.36:1**      | 4.5:1    |
| Search input boundary   | Pale/transparent borders                   | `#778399` on white: **3.82:1**      | 3:1      |
| Informational badge     | `#0077be` on `#e8f0fe`: 4.18:1             | `#005f91` on `#e8f0fe`: **6.02:1**  | 4.5:1    |

The full-page opaque-solid scan also found low-contrast fee labels on the market/slaughterhouse pages, the health partner action, and a sitemap badge. Those received targeted semantic-color fixes. Gradient and translucent surfaces were inspected through the representative rendered checks and visual review; the solid-pair scan does not claim to measure every possible composited background.

## Verification

Passed:

- `npm run test:layouts`: four renderer tests.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/template.spec.js tests/interface.spec.js tests/volunteer-modal.behavior.spec.js --project=chrome --workers=3`: 37 checks passed; the additional exact press/disabled-state regression passed separately.
- All 53 screens at 1440, 390 and 320px: **159 page checks**, no page-level overflow or runtime errors after changes. Before: **51 of 53** pages overflowed at both narrow widths.
- axe WCAG A/AA-tag checks on 16 representative screens: **90 affected elements before, zero after**. These counts describe this automated sample, not every accessibility criterion or every interaction state.
- `REVIEW_BASE_URL=http://localhost:8123 node scripts/check-interface-contrast.js`: full-page opaque-solid text contrast scan across the 52 public pages; confirmed failing pairs corrected and rescanned.
- Keyboard: mobile open/close/Escape and focus restoration; FAQ Enter/Space; tab arrows/Home/End; service search; popup focus and background inertness; editor invalid-field focus.
- Reduced-motion checks, FIL expansion, 200% text resize and a narrow RTL layout stress check.
- `npm run audit:template`, production build, static deployment packaging, local-font/icon loading and `git diff --check`.

Not verified:

- Native VoiceOver/NVDA announcements and Safari/Firefox behavior.
- Live weather, exchange-rate and map providers; captures intentionally use the same unavailable-provider state without inventing data.
- Every page at every intermediate browser width, full RTL localization, or every hover/animation frame in the browser Animations panel. Runtime tests exercise the supported interactions and preference states; the app continues to support EN and FIL only.

## Reproduce the screenshots

The two capture phases must run against their corresponding source revisions. `before` was captured from `f1f09bc`; `after` is this implementation. The same capture assets, clock, locale, dimensions and external-provider failures are used for both.

```sh
npm run dev
# In another terminal, prepare an evidence directory once:
mkdir -p review-artifacts/capture-assets
cp assets/fonts/inter-latin-variable.woff2 review-artifacts/capture-assets/inter.woff2
cp assets/vendor/bootstrap-icons.css review-artifacts/capture-assets/bootstrap-icons.css
cp assets/vendor/bootstrap-icons.woff2 review-artifacts/capture-assets/bootstrap-icons.woff2
REVIEW_BASE_URL=http://localhost:8000 node scripts/capture-interface.js after
node scripts/interface-report.js
```

To reproduce the original baseline, serve commit `f1f09bc` from a separate worktree, keeping the capture script and asset cache in the current checkout:

```sh
git worktree add /tmp/betterlgu-before f1f09bc
PORT=8001 node /tmp/betterlgu-before/scripts/dev.js
# In another terminal, from the current checkout:
REVIEW_BASE_URL=http://localhost:8001 node scripts/capture-interface.js before
```

Open `review-artifacts/index.html` to select a screen/viewport, compare full-page screenshots and scroll both columns together. The output directory is git-ignored and excluded from deployment. The capture scripts use existing Playwright tooling plus the explicit axe-core development dependency. The original font and icon license notices are stored alongside their local assets.

## Verdict

**Approve** for the inspected scope: confirmed HIGH findings are fixed. The native assistive-technology, browser and live-provider checks listed as Not verified remain outside this verdict.
