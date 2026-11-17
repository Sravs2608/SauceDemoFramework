# Traceability Matrix

Maps every test case in `docs/SAUCEDEMO-PLAN.md` (section 5) to its automation.
Test case IDs are never changed. Locators are `data-test` values unless stated otherwise.

**Status words:** *Automated* = test exists and runs. *Planned* = not written yet.
*Not run* = no test yet. *Intermittent* = passes in some runs and fails in others.

## Execution history (2026-11-16, local, Windows 11)

| # | Command / conditions | Result |
|---|---|---|
| E1 | `npx playwright test`, all 4 projects, 8 workers, no retries (first run) | 20 passed |
| E2 | Same, second run | 19 passed, 1 failed (AUTH-08 webkit) |
| E3 | Same, with `--trace retain-on-failure`, three runs | 16 passed / 4 failed; 19 passed / 1 failed (AUTH-08 webkit); 20 passed |
| E4 | Same, `--repeat-each=2` | 39 passed, 1 failed (AUTH-01 webkit) |
| E5 | Same, one more run | 16 passed, 4 failed |
| E6 | AUTH-08 only, webkit, `--repeat-each=40`, 8 workers, no retries | 40 passed |
| E7 | `npx playwright test --grep @smoke --project=chromium`, 4 workers | 5 passed (51.0 s; slow, single tests up to 14.8 s) |
| E8 | AUTH-08 only, webkit, `--repeat-each=10`, 4 workers, 1 retry (after adding the URL check) | 6 passed, 3 flaky (passed on retry), 1 failed (timed out twice) |

Not yet executed: the full suite on all projects with the current settings (4 workers,
1 retry), and any run in GitHub Actions.

## Defects / Notes

**N1 — Intermittent environment failures (open, cause not confirmed).** In full runs,
different tests fail at random on different browsers. The errors were:

- `Test timeout of 30000ms exceeded.`
- `Test timeout of 30000ms exceeded while setting up "page".`
- `Tearing down "context" exceeded the test timeout of 30000ms.`
- `Error: page.goto: SSL connect error`
- `Error: page.goto: net::ERR_ABORTED; maybe frame was detached?`

Affected at least once: AUTH-01 (chromium, webkit, mobile-chrome), AUTH-06 (chromium,
mobile-chrome), AUTH-08 (webkit), CART-01 (chromium), CHK-01 (chromium, firefox,
mobile-chrome). In the traces that were read, locators were found and assertions passed
within milliseconds; the time was lost opening a page, navigating, or closing the browser
context. Category: **environment** (network to the site and/or this PC), not locator, data,
code or application. Mitigation in place: 4 workers locally, 1 retry locally / 2 in CI.
The investigation was stopped before the cause was identified.

**N2 — AUTH-08 on webkit (open).** Twice (E2, E3) the test failed at the step "Opening the
Products page directly is blocked" with `expect(locator).toHaveText(expected) failed`,
locator `getByTestId('error')`, `element(s) not found` after 5000 ms. A URL assertion was
added before the message check. In E8 that specific error did not occur, but 4 of 10
first attempts timed out as in N1, so the test is still unstable on webkit. Category:
**not determined** (synchronization or environment). No application defect is claimed.

**N3 — Observation, not a confirmed defect.** A refused login as `locked_out_user` still
leaves a `session-username` cookie in the browser. To be examined with AUTH-07 in Phase 2.

## Authentication

| ID | Description | Tag | Spec file | Pages | Key locators | Expected result | Automation | Execution | Defects |
|---|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Valid login (standard_user) lands on Products page | smoke | `tests/ui/auth/auth.spec.ts` | LoginPage, InventoryPage | `username`, `password`, `login-button`, `title`, `inventory-item` | URL `/inventory.html`, title "Products", 6 products, cookie `session-username` = standard_user | Automated | Passed on chromium; intermittent in full runs (see N1) | None |
| AUTH-02 | Wrong password shows error | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-03 | Unknown username shows error | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-04 | Empty username shows required error | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-05 | Empty password shows required error | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-06 | locked_out_user blocked with locked-out error | smoke | `tests/ui/auth/auth.spec.ts` | LoginPage | `username`, `password`, `login-button`, `error` | Error "Epic sadface: Sorry, this user has been locked out.", stays on `/`, no products shown | Automated | Passed on chromium; intermittent in full runs (see N1) | None. Observation: a `session-username` cookie is still set after the refused login; to be examined with AUTH-07 |
| AUTH-07 | Inventory URL without login is blocked | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-08 | Logout returns to login; protected pages blocked afterwards | smoke | `tests/ui/auth/auth.spec.ts` | InventoryPage, Menu, LoginPage | role button "Open Menu", `logout-sidebar-link`, `login-button`, `error` | After logout: URL `/`, Login button visible, session cookie removed; opening `/inventory.html` returns to `/` with "Epic sadface: You can only access '/inventory.html' when you are logged in." | Automated | Passed on chromium; **unstable on webkit** (see N1, N2) | No application defect confirmed |

## Inventory

| ID | Description | Tag | Automation | Execution |
|---|---|---|---|---|
| INV-01 | All products show name, price, image, add button | regression | Planned (Phase 2) | Not run |
| INV-02 | Sort Name A–Z, verify actual order | regression | Planned (Phase 2) | Not run |
| INV-03 | Sort Name Z–A, verify actual order | regression | Planned (Phase 2) | Not run |
| INV-04 | Sort Price low–high, verify actual order | regression | Planned (Phase 2) | Not run |
| INV-05 | Sort Price high–low, verify actual order | regression | Planned (Phase 2) | Not run |
| INV-06 | Product detail matches listing name and price | regression | Planned (Phase 2) | Not run |

## Cart

| ID | Description | Tag | Spec file | Pages | Key locators | Expected result | Automation | Execution | Defects |
|---|---|---|---|---|---|---|---|---|---|
| CART-01 | Add one item, badge shows 1 | smoke | `tests/ui/cart/cart.spec.ts` | InventoryPage, Header, CartPage | `add-to-cart-sauce-labs-backpack`, `remove-sauce-labs-backpack`, `shopping-cart-badge`, `shopping-cart-link`, `cart-list`, `inventory-item-name`, `inventory-item-price`, `item-quantity` | No badge at start; after adding: badge "1", button becomes "Remove"; cart lists exactly "Sauce Labs Backpack", "$29.99", quantity "1" | Automated | Passed on chromium; intermittent in full runs (see N1) | None |
| CART-02 | Add multiple items, badge count matches | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CART-03 | Remove from inventory page updates badge | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CART-04 | Remove from cart page | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CART-05 | Cart persists across navigation and reload | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CART-06 | Continue Shopping returns to inventory, cart intact | regression | — | — | — | — | Planned (Phase 2) | Not run | — |

## Checkout

| ID | Description | Tag | Spec file | Pages | Key locators | Expected result | Automation | Execution | Defects |
|---|---|---|---|---|---|---|---|---|---|
| CHK-01 | End-to-end purchase of one item, confirmation shown | smoke | `tests/ui/checkout/checkout.spec.ts` | InventoryPage, Header, CartPage, CheckoutInfoPage, CheckoutOverviewPage, CheckoutCompletePage | `checkout`, `firstName`, `lastName`, `postalCode`, `continue`, `subtotal-label`, `tax-label`, `total-label`, `finish`, `complete-header`, `complete-text` | Overview: "Item total: $29.99", "Tax: $2.40", "Total: $32.39" (calculated from price, 8% tax); complete page: "Thank you for your order!" and dispatch text; cart badge gone | Automated | Passed on chromium; intermittent in full runs (see N1) | None |
| CHK-02 | Multiple items: item total, tax and grand total correct | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CHK-03 | First name required | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CHK-04 | Last name required | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CHK-05 | Postal code required | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CHK-06 | Cancel on information step returns to cart | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CHK-07 | Cancel on overview returns to inventory | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CHK-08 | After order completes, cart is empty | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CHK-09 | Checkout with empty cart — observe and document actual behavior | regression | — | — | — | — | Planned (Phase 2) | Not run | — |

## Special users

| ID | Description | Tag | Automation | Execution |
|---|---|---|---|---|
| USR-01 | problem_user: detect known broken behaviors | regression | Planned (Phase 2) | Not run |
| USR-02 | performance_glitch_user: login completes without hard waits | regression | Planned (Phase 2) | Not run |
| USR-03 | error_user: detect action failures | regression | Planned (Phase 2) | Not run |
| USR-04 | visual_user: visual comparison catches UI differences | regression | Planned (Phase 2) | Not run |

## App state and cross-cutting

| ID | Description | Tag | Where | Automation | Execution |
|---|---|---|---|---|---|
| APP-01 | Reset App State clears cart | regression | — | Planned (Phase 2) | Not run |
| NET-01 | Block images via network mocking; page still functional | regression | — | Planned (Phase 3) | Not run |
| A11Y-01 | Accessibility scan on login and inventory pages | regression | — | Planned (Phase 3) | Not run |
| MOB-01 | Smoke suite on mobile viewport | smoke | `mobile-chrome` project in `playwright.config.ts` (Pixel 7 emulation, `grep: /@smoke/`); no separate spec file | Automated | Intermittent in full runs (see N1) |
| API-01..04 | Create, read, update, delete on practice API | regression | — | Planned (Phase 4) | Not run |
