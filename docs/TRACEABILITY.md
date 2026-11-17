# Traceability Matrix

Maps every test case in `docs/SAUCEDEMO-PLAN.md` (section 5) to its automation.
Test case IDs are never changed. Locators are `data-test` values unless stated otherwise.

**Last execution:** 2026-11-16, local (Windows 11), `npx playwright test`:
20 passed, 0 failed (5 smoke tests × chromium, firefox, webkit, mobile-chrome).
GitHub Actions result: see the Actions tab; not recorded here yet.

**Status words:** *Automated* = test exists and runs. *Planned* = not written yet.
*Passed/Failed* = result of the last execution above. *Not run* = no test yet.

## Authentication

| ID | Description | Tag | Spec file | Pages | Key locators | Expected result | Automation | Execution | Defects |
|---|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Valid login (standard_user) lands on Products page | smoke | `tests/ui/auth/auth.spec.ts` | LoginPage, InventoryPage | `username`, `password`, `login-button`, `title`, `inventory-item` | URL `/inventory.html`, title "Products", 6 products, cookie `session-username` = standard_user | Automated | Passed (4/4 projects) | None |
| AUTH-02 | Wrong password shows error | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-03 | Unknown username shows error | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-04 | Empty username shows required error | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-05 | Empty password shows required error | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-06 | locked_out_user blocked with locked-out error | smoke | `tests/ui/auth/auth.spec.ts` | LoginPage | `username`, `password`, `login-button`, `error` | Error "Epic sadface: Sorry, this user has been locked out.", stays on `/`, no products shown | Automated | Passed (4/4 projects) | None. Observation: a `session-username` cookie is still set after the refused login; to be examined with AUTH-07 |
| AUTH-07 | Inventory URL without login is blocked | regression | — | LoginPage | — | — | Planned (Phase 2) | Not run | — |
| AUTH-08 | Logout returns to login; protected pages blocked afterwards | smoke | `tests/ui/auth/auth.spec.ts` | InventoryPage, Menu, LoginPage | role button "Open Menu", `logout-sidebar-link`, `login-button`, `error` | After logout: URL `/`, Login button visible, session cookie removed; opening `/inventory.html` returns to `/` with "Epic sadface: You can only access '/inventory.html' when you are logged in." | Automated | Passed (4/4 projects) | None |

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
| CART-01 | Add one item, badge shows 1 | smoke | `tests/ui/cart/cart.spec.ts` | InventoryPage, Header, CartPage | `add-to-cart-sauce-labs-backpack`, `remove-sauce-labs-backpack`, `shopping-cart-badge`, `shopping-cart-link`, `cart-list`, `inventory-item-name`, `inventory-item-price`, `item-quantity` | No badge at start; after adding: badge "1", button becomes "Remove"; cart lists exactly "Sauce Labs Backpack", "$29.99", quantity "1" | Automated | Passed (4/4 projects) | None |
| CART-02 | Add multiple items, badge count matches | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CART-03 | Remove from inventory page updates badge | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CART-04 | Remove from cart page | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CART-05 | Cart persists across navigation and reload | regression | — | — | — | — | Planned (Phase 2) | Not run | — |
| CART-06 | Continue Shopping returns to inventory, cart intact | regression | — | — | — | — | Planned (Phase 2) | Not run | — |

## Checkout

| ID | Description | Tag | Spec file | Pages | Key locators | Expected result | Automation | Execution | Defects |
|---|---|---|---|---|---|---|---|---|---|
| CHK-01 | End-to-end purchase of one item, confirmation shown | smoke | `tests/ui/checkout/checkout.spec.ts` | InventoryPage, Header, CartPage, CheckoutInfoPage, CheckoutOverviewPage, CheckoutCompletePage | `checkout`, `firstName`, `lastName`, `postalCode`, `continue`, `subtotal-label`, `tax-label`, `total-label`, `finish`, `complete-header`, `complete-text` | Overview: "Item total: $29.99", "Tax: $2.40", "Total: $32.39" (calculated from price, 8% tax); complete page: "Thank you for your order!" and dispatch text; cart badge gone | Automated | Passed (4/4 projects) | None |
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
| MOB-01 | Smoke suite on mobile viewport | smoke | `mobile-chrome` project in `playwright.config.ts` (Pixel 7 emulation, `grep: /@smoke/`); no separate spec file | Automated | Passed (5/5 smoke tests) |
| API-01..04 | Create, read, update, delete on practice API | regression | — | Planned (Phase 4) | Not run |
