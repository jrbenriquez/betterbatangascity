# Button sizing review

Reviewed 11 November 2026 after the install and volunteer close controls were reported as oval.

The rendered sweep covered all 52 public pages and the local editor at 320, 390 and 1440px: 159 page checks and 894 visible control instances (native buttons, button-role controls, submit/button inputs and `.btn` links, including repeated shared controls). It checked circular aspect ratios and internal content overflow. The follow-up exercised the first-visit volunteer popup, install and update notices, mobile navigation, the open search dropdown, and EN/FIL search-submit sizing at the same widths. CSS circle declarations and JavaScript-generated button markup were also inspected.

| Control                             | Finding                                                                      | Change                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Volunteer close                     | 36×44px after the shared minimum height                                      | 44×44px; removed redundant enlarged pseudo-element target       |
| Install dismiss                     | 28×44px                                                                      | 44×44px; no flex shrink or padding                              |
| Update dismiss                      | 37×44px                                                                      | 44×44px with centered glyph; retains its rounded-square styling |
| Search submit                       | 40×48px from conflicting logical width and inherited height                  | Explicit 44×44px dimensions                                     |
| Open search category filters        | Labels clipped when six buttons shrank into one mobile row                   | Wrapping rows, readable labels and a minimum inline size        |
| Legacy circular `.search-btn` style | Unused currently; same 40px width versus shared 44px minimum-height conflict | Matching 44×44px dimensions for future use                      |

After fixes, the rendered sweep found no internal button-content overflow or distorted circular controls. The follow-up confirmed 44×44px icon controls, working close/dismiss actions and full search-category labels at all three widths. The mobile menu button was already 44×44px. Production build and template audit pass. Screenshot and JSON evidence were supplied with the task.

This is a sizing and clipping audit in Chromium, not a complete accessibility or functional certification. Rectangular text buttons and pill controls intentionally have unequal width and height. Not every possible browser, content record, translation expansion or interaction state was exercised.
