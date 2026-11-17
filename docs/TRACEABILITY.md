# Traceability Matrix

Maps every test case in `docs/SAUCEDEMO-PLAN.md` (section 5) to its automation.
Test case IDs are never changed. Locators are `data-test` values unless stated otherwise.

**Status words**
- *Automated* = test exists and runs. *Planned* = not written yet.
- *Passed* = passed in the last Chromium regression run (E10 below).
- *Expected failure* = the test asserts the correct behaviour, the application does not
  behave that way (known defect), and the test is marked `test.fail`. It is counted as
  passed by the runner and will be reported as "passed unexpectedly" if the defect is fixed.
- *Not run* = no test yet.

## Summary (after Phase 2)

| Area | Test cases in plan | Automated | Tests in code |
|---|---|---|---|
| Authentication | 8 | 8 | 8 |
| Inventory | 6 | 6 | 6 |
| Cart | 6 | 6 | 6 |
| Checkout | 9 | 9 | 9 |
| Special users | 4 | 4 | 10 |
| App state | 1 | 1 | 2 |
| Mobile (MOB-01) | 1 | 1 | (project, no own spec) |
| NET-01, A11Y-01 | 2 | 0 | Planned, Phase 3 |
| API-01..04 | 4 | 0 | Planned, Phase 4 |

41 tests in code: 31 normal + 10 marked `test.fail` (known defects).

## Execution history

| # | Date | Command / conditions | Result |
|---|---|---|---|
| E1 | 2026-11-16 | `npx playwright test`, all 4 projects, 8 workers, no retries (first run, 5 smoke tests) | 20 passed |
| E2 | 2026-11-16 | Same, second run | 19 passed, 1 failed (AUTH-08 webkit) |
| E3 | 2026-11-16 | Same, with `--trace retain-on-failure`, three runs | 16 passed / 4 failed; 19 passed / 1 failed (AUTH-08 webkit); 20 passed |
| E4 | 2026-11-16 | Same, `--repeat-each=2` | 39 passed, 1 failed (AUTH-01 webkit) |
| E5 | 2026-11-16 | Same, one more run | 16 passed, 4 failed |
| E6 | 2026-11-16 | AUTH-08 only, webkit, `--repeat-each=40`, 8 workers, no retries | 40 passed |
| E7 | 2026-11-16 | `npx playwright test --grep @smoke --project=chromium`, 4 workers | 5 passed (51.0 s; slow) |
| E8 | 2026-11-16 | AUTH-08 only, webkit, `--repeat-each=10`, 4 workers, 1 retry | 6 passed, 3 flaky, 1 failed (timeouts) |
| E9 | 2026-11-16 | Phase 2, per group on chromium (4 workers, 1 retry): auth 8, inventory + cart 12, checkout 9, users 10, app 2 | All passed. One flaky result in the first users run (USR-02), root cause found and fixed, see N4 |
| E10 | 2026-11-16 | **`npx playwright test --project=chromium`** (full suite, 4 workers, 1 retry) | **41 passed (41.1 s)**: 31 passed + 10 expected failures; 0 flaky, 0 retries |

Not executed yet: the Phase 2 tests on firefox, webkit and mobile-chrome; the full suite on
all projects with the current settings; any run in GitHub Actions (needs the
`SAUCE_PASSWORD` repository secret).

## Authentication — `tests/ui/auth/auth.spec.ts`

| ID | Description | Tag | Pages | Key locators | Expected result | Automation | Execution (E10) | Defects |
|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Valid login (standard_user) lands on Products page | smoke | LoginPage, InventoryPage | `username`, `password`, `login-button`, `title`, `inventory-item` | URL `/inventory.html`, title "Products", 6 products, cookie `session-username` = standard_user | Automated | Passed | None (see N1) |
| AUTH-02 | Wrong password shows error | regression | LoginPage | `error`, `username` | "Epic sadface: Username and password do not match any user in this service"; field gets class `input_error`; stays on `/` | Automated | Passed | None |
| AUTH-03 | Unknown username shows error | regression | LoginPage | `error` | Same message as AUTH-02; stays on `/` | Automated | Passed | None |
| AUTH-04 | Empty username shows required error | regression | LoginPage | `error` | "Epic sadface: Username is required" | Automated | Passed | None |
| AUTH-05 | Empty password shows required error | regression | LoginPage | `error` | "Epic sadface: Password is required" | Automated | Passed | None |
| AUTH-06 | locked_out_user blocked with locked-out error | smoke | LoginPage | `error` | "Epic sadface: Sorry, this user has been locked out."; stays on `/`; no products | Automated | Passed | None (see N1, N3) |
| AUTH-07 | Inventory URL without login is blocked | regression | LoginPage | `error` | `/inventory.html` and `/cart.html` both return to `/` with "Epic sadface: You can only access '<path>' when you are logged in." | Automated | Passed | None |
| AUTH-08 | Logout returns to login; protected pages blocked afterwards | smoke | InventoryPage, Menu, LoginPage | role button "Open Menu", `logout-sidebar-link`, `login-button`, `error` | After logout: URL `/`, Login button visible, session cookie removed; `/inventory.html` returns to `/` with the message | Automated | Passed on chromium; unstable on webkit (N2) | No application defect confirmed |

## Inventory — `tests/ui/inventory/inventory.spec.ts`

| ID | Description | Tag | Pages | Key locators | Expected result | Automation | Execution (E10) | Defects |
|---|---|---|---|---|---|---|---|---|
| INV-01 | All products show name, price, image, add button | regression | InventoryPage | `inventory-item`, `inventory-item-name`, `inventory-item-price`, role img, `add-to-cart-<slug>` | 6 names and prices equal the catalogue; each picture has the product name as alt text, is loaded (naturalWidth > 0) and is unique; each button says "Add to cart" | Automated | Passed | None |
| INV-02 | Sort Name A–Z, verify actual order | regression | InventoryPage | `product-sort-container`, `active-option` | After switching from Z–A: label "Name (A to Z)", names and prices in calculated A–Z order | Automated | Passed | None |
| INV-03 | Sort Name Z–A, verify actual order | regression | InventoryPage | same | Label "Name (Z to A)", calculated Z–A order | Automated | Passed | None |
| INV-04 | Sort Price low–high, verify actual order | regression | InventoryPage | same | Label "Price (low to high)": $7.99, $9.99, $15.99, $15.99, $29.99, $49.99 with matching names | Automated | Passed | None |
| INV-05 | Sort Price high–low, verify actual order | regression | InventoryPage | same | Label "Price (high to low)": $49.99 … $7.99 with matching names | Automated | Passed | None |
| INV-06 | Product detail matches listing name and price | regression | InventoryPage, ProductDetailPage | `item-5-title-link`, `inventory-item-name`, `inventory-item-price`, `add-to-cart`, `back-to-products` | Fleece Jacket: URL `/inventory-item.html?id=5`; name and price equal the listing; Back to products returns to `/inventory.html` | Automated | Passed | None |

## Cart — `tests/ui/cart/cart.spec.ts`

| ID | Description | Tag | Pages | Key locators | Expected result | Automation | Execution (E10) | Defects |
|---|---|---|---|---|---|---|---|---|
| CART-01 | Add one item, badge shows 1 | smoke | InventoryPage, Header, CartPage | `add-to-cart-<slug>`, `remove-<slug>`, `shopping-cart-badge`, `cart-list`, `item-quantity` | No badge at start; badge "1"; button "Remove"; cart lists Backpack, $29.99, quantity 1 | Automated | Passed | None (see N1) |
| CART-02 | Add multiple items, badge count matches | regression | InventoryPage, Header, CartPage | same | Badge counts 1, 2, 3 after each add; cart lists the three products and prices in the order added | Automated | Passed | None |
| CART-03 | Remove from inventory page updates badge | regression | InventoryPage, Header, CartPage | `remove-<slug>` | Badge 2 → 1; button back to "Add to cart"; cart holds only the other product | Automated | Passed | None |
| CART-04 | Remove from cart page | regression | CartPage, Header | `remove-<slug>` | Item disappears from the cart list; badge 2 → 1 | Automated | Passed | None |
| CART-05 | Cart persists across navigation and reload | regression | InventoryPage, ProductDetailPage, CartPage | `shopping-cart-badge` | Badge stays 2 after reload, after visiting a detail page, and after reloading the cart; both items listed | Automated | Passed | None |
| CART-06 | Continue Shopping returns to inventory, cart intact | regression | CartPage, InventoryPage | `continue-shopping` | URL `/inventory.html`; badge 1; product still shows "Remove" | Automated | Passed | None |

## Checkout — `tests/ui/checkout/checkout.spec.ts`

| ID | Description | Tag | Pages | Key locators | Expected result | Automation | Execution (E10) | Defects |
|---|---|---|---|---|---|---|---|---|
| CHK-01 | End-to-end purchase of one item, confirmation shown | smoke | Inventory, Cart, CheckoutInfo, CheckoutOverview, CheckoutComplete | `checkout`, `firstName`, `lastName`, `postalCode`, `continue`, `subtotal-label`, `tax-label`, `total-label`, `finish`, `complete-header`, `complete-text` | "Item total: $29.99", "Tax: $2.40", "Total: $32.39" (calculated); "Thank you for your order!"; badge gone | Automated | Passed | None (see N1) |
| CHK-02 | Multiple items: item total, tax and grand total correct | regression | Cart, CheckoutInfo, CheckoutOverview | same | All six products: "Item total: $129.94", "Tax: $10.40", "Total: $140.34" (calculated, 8% tax) | Automated | Passed | None |
| CHK-03 | First name required | regression | CheckoutInfoPage | `error` | "Error: First Name is required"; stays on step one | Automated | Passed | None |
| CHK-04 | Last name required | regression | CheckoutInfoPage | `error` | "Error: Last Name is required"; stays on step one | Automated | Passed | None |
| CHK-05 | Postal code required | regression | CheckoutInfoPage | `error` | "Error: Postal Code is required"; stays on step one | Automated | Passed | None |
| CHK-06 | Cancel on information step returns to cart | regression | CheckoutInfoPage, CartPage | `cancel` | URL `/cart.html`; both products still in the cart | Automated | Passed | None |
| CHK-07 | Cancel on overview returns to inventory | regression | CheckoutOverviewPage, InventoryPage | `cancel` | URL `/inventory.html`; badge 1; product shows "Remove" | Automated | Passed | None |
| CHK-08 | After order completes, cart is empty | regression | CheckoutComplete, CartPage, InventoryPage | `shopping-cart-badge`, localStorage `cart-contents` | No badge; `cart-contents` removed; cart page has 0 items; products show "Add to cart" | Automated | Passed | None |
| CHK-09 | Checkout with empty cart — observe and document actual behavior | regression | CartPage | `checkout` | **Expected (our assumption):** user stays on `/cart.html`. **Actual:** checkout opens and can be completed: "Item total: $0", "Tax: $0.00", "Total: $0.00", "Thank you for your order!" | Automated (`test.fail`) | Expected failure | **DEF-01** |

## Special users — `tests/ui/users/`

| ID | Test | Tag | Spec | Expected result (correct behaviour) | Actual | Automation | Execution (E10) | Defects |
|---|---|---|---|---|---|---|---|---|
| USR-01 | problem_user - every product has its own picture | regression | `special-users.spec.ts` | 6 different picture sources | All 6 cards show `/assets/sl-404-….jpg` | Automated (`test.fail`) | Expected failure | **DEF-P1** |
| USR-01 | problem_user - sorting Z to A reorders the products | regression | `special-users.spec.ts` | Z–A order | Dropdown stays on "Name (A to Z)", order unchanged | Automated (`test.fail`) | Expected failure | **DEF-P2** |
| USR-01 | problem_user - all products can be added to the cart | regression | `special-users.spec.ts` | Badge 6 | Badge 3: Bolt T-Shirt, Fleece Jacket, Red T-Shirt are not added | Automated (`test.fail`) | Expected failure | **DEF-P3** |
| USR-01 | problem_user - checkout form keeps the last name | regression | `special-users.spec.ts` | First name "Test", last name "User" | Typing the last name overwrites the first name; Last Name stays empty | Automated (`test.fail`) | Expected failure | **DEF-P4** |
| USR-02 | performance_glitch_user login completes without hard waits | regression | `special-users.spec.ts` | Products page with 6 products appears (about 5 s); a product can be added | As expected | Automated | Passed | None (see N4) |
| USR-03 | error_user - sorting Z to A reorders the products | regression | `special-users.spec.ts` | Z–A order | Alert "Sorting is broken! This error has been reported to Backtrace."; order unchanged | Automated (`test.fail`) | Expected failure | **DEF-E1** |
| USR-03 | error_user - all products can be added to the cart | regression | `special-users.spec.ts` | Badge 6 | Badge 3; page error "Failed to add item to the cart." | Automated (`test.fail`) | Expected failure | **DEF-E2** |
| USR-03 | error_user - Finish completes the order | regression | `special-users.spec.ts` | `/checkout-complete.html` | Finish does nothing; stays on the overview | Automated (`test.fail`) | Expected failure | **DEF-E3** |
| USR-04 | baseline - standard_user Products page matches the approved screenshot | regression | `visual-user.spec.ts` | Screenshot equals the baseline (≤ 1% pixels differ, footer masked) | As expected | Automated (chromium on Windows only) | Passed | None |
| USR-04 | visual_user Products page matches the approved screenshot | regression | `visual-user.spec.ts` | Same picture as the baseline | Wrong Backpack picture, different prices on every load, misaligned names and button, different menu icon | Automated (`test.fail`, chromium on Windows only) | Expected failure | **DEF-V1** |

## App state and cross-cutting

| ID | Test | Tag | Spec / where | Expected result | Automation | Execution (E10) | Defects |
|---|---|---|---|---|---|---|---|
| APP-01 | Reset App State clears cart | regression | `tests/ui/app/app-state.spec.ts` | Badge gone; `cart-contents` removed; cart page empty | Automated | Passed | None |
| APP-01 | Reset App State restores the "Add to cart" buttons | regression | `tests/ui/app/app-state.spec.ts` | Button says "Add to cart" again. **Actual:** still "Remove" until reload | Automated (`test.fail`) | Expected failure | **DEF-02** |
| MOB-01 | Smoke suite on mobile viewport | smoke | `mobile-chrome` project in `playwright.config.ts` (Pixel 7, `grep: /@smoke/`) | The five smoke tests pass on a 412×839 viewport | Automated | Not run in E10 (chromium only); intermittent in Phase 1 full runs (N1) | None |
| NET-01 | Block images via network mocking; page still functional | regression | — | — | Planned (Phase 3) | Not run | — |
| A11Y-01 | Accessibility scan on login and inventory pages | regression | — | — | Planned (Phase 3) | Not run | — |
| API-01..04 | Create, read, update, delete on practice API | regression | — | — | Planned (Phase 4) | Not run | — |

## Defects

All observed on the live site on 2026-11-16. Each has a strict test marked `test.fail`.

| ID | Test | Summary | Kind |
|---|---|---|---|
| DEF-01 | CHK-09 | Checkout can be started and completed with an empty cart ($0.00 order confirmed with "Thank you for your order!") | Our finding. Expected behaviour is an assumption (no published requirement) |
| DEF-02 | APP-01 | After Reset App State the cart is empty but product buttons still say "Remove" until the page is reloaded | Our finding. Same caveat |
| DEF-P1 | USR-01 | problem_user: every product shows the same picture | Built into SauceDemo on purpose |
| DEF-P2 | USR-01 | problem_user: sort selection is ignored | On purpose |
| DEF-P3 | USR-01 | problem_user: Bolt T-Shirt, Fleece Jacket and Red T-Shirt cannot be added to the cart | On purpose |
| DEF-P4 | USR-01 | problem_user: typing the last name changes the first name; Last Name stays empty, checkout cannot continue | On purpose |
| DEF-E1 | USR-03 | error_user: sorting shows the alert "Sorting is broken! This error has been reported to Backtrace." and does nothing | On purpose |
| DEF-E2 | USR-03 | error_user: the same three products cannot be added ("Failed to add item to the cart.") | On purpose |
| DEF-E3 | USR-03 | error_user: Finish does nothing; the order cannot be completed | On purpose |
| DEF-V1 | USR-04 | visual_user: wrong Backpack picture, prices change on every load, misaligned names/button, different menu icon | On purpose |

Also observed for these users but not automated (candidates for manual/exploratory notes):
problem_user and error_user cannot remove items on the Products page; problem_user's
Backpack link opens the Fleece Jacket detail page (`?id=5`); error_user's Last Name field
stays empty but Continue still works.

## Notes

**N1 — Intermittent environment failures (open, cause not confirmed).** In Phase 1 full
runs on all four projects with 8 workers, different tests failed at random with:

- `Test timeout of 30000ms exceeded.`
- `Test timeout of 30000ms exceeded while setting up "page".`
- `Tearing down "context" exceeded the test timeout of 30000ms.`
- `Error: page.goto: SSL connect error`
- `Error: page.goto: net::ERR_ABORTED; maybe frame was detached?`

Affected at least once: AUTH-01, AUTH-06, AUTH-08, CART-01, CHK-01 on various browsers. In
the traces that were read, locators were found and assertions passed within milliseconds;
the time was lost opening a page, navigating, or closing the browser context. Category:
**environment**, not locator, data, code or application. Mitigation: 4 workers locally,
1 retry locally / 2 in CI. Not seen in any Phase 2 chromium run (E9, E10). The
investigation was stopped by decision before the cause was identified.

**N2 — AUTH-08 on webkit (open).** Twice (E2, E3) it failed at "Opening the Products page
directly is blocked" with `expect(locator).toHaveText(expected) failed`, locator
`getByTestId('error')`, `element(s) not found` after 5000 ms. A URL assertion was added
before the message check. In E8 that error did not occur, but 4 of 10 first attempts timed
out as in N1. Category: **not determined** (synchronization or environment). Not re-run on
webkit in Phase 2.

**N3 — Closed: locked_out_user cookie.** A refused login as `locked_out_user` leaves a
`session-username=locked_out_user` cookie in the browser. Checked in Phase 2: with that
cookie, `/inventory.html` is still blocked and returns to `/` with the "You can only
access" message. No access is gained, so this is not a defect.

**N4 — Closed: USR-02 was flaky in its first version (test code, synchronization).** Error:
`expect(locator).toHaveText(expected) failed`, locator `getByTestId('title')`, expected
"Products", `element(s) not found` after 5000 ms, at `src/pages/BasePage.ts:64` called from
the `loginAs` fixture. Root cause: for performance_glitch_user the address changes to
`/inventory.html` immediately and the content appears about 5 seconds later; the 15-second
limit was on the URL check only, leaving the content check with the default 5 seconds.
Fix: the 15-second limit is now also on the "Products" heading, and the test is marked
`test.slow()`. Verified with `--repeat-each=5`: 5 passed, no retries.
