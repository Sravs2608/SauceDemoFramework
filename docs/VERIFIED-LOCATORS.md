# Verified Locators and Messages — SauceDemo

Verified on the live site https://www.saucedemo.com on 2026-11-16 (browser inspection).
Use these values in page objects. Re-verify anything not listed here before using it.

## Session / state (important for storageState)
- Login sets cookie `session-username=<username>`. This is what keeps you logged in.
- Cart is stored in localStorage key `cart-contents` as a JSON array of item ids, e.g. `[4]`.
- After a completed order, `cart-contents` is removed and the cart badge disappears.
- Password for all users: `secret_sauce` (shown on the login page; keep it in `.env` anyway).

## Login page (`/`)
| Element | data-test | Notes |
|---|---|---|
| Username input | `username` | id `user-name`, placeholder "Username" |
| Password input | `password` | id `password`, placeholder "Password" |
| Login button | `login-button` | `<input type=submit value="Login">` |
| Error message | `error` | `<h3>` |
| Error dismiss | `error-button` | aria-label "Dismiss error" |

Inputs get class `input_error` after an error.

| Case | Exact error text |
|---|---|
| Empty username (AUTH-04) | `Epic sadface: Username is required` |
| Empty password (AUTH-05) | `Epic sadface: Password is required` |
| Wrong password (AUTH-02) | `Epic sadface: Username and password do not match any user in this service` |
| Unknown user (AUTH-03) | same as wrong password |
| locked_out_user (AUTH-06) | `Epic sadface: Sorry, this user has been locked out.` |

## Inventory (`/inventory.html`)
- Page title: `title` → "Products"
- List: `inventory-list`; each card: `inventory-item`
- Inside a card: `inventory-item-name`, `inventory-item-desc`, `inventory-item-price`, image `inventory-item-<slug>-img`, title link `item-<id>-title-link`, image link `item-<id>-img-link`
- Add button: `add-to-cart-<slug>` (text "Add to cart") → becomes `remove-<slug>` (text "Remove")
- Sort dropdown: `product-sort-container`; options value/text: `az` Name (A to Z), `za` Name (Z to A), `lohi` Price (low to high), `hilo` Price (high to low)
- Current sort label: `active-option` (default "Name (A to Z)")

| id | Product | slug | Price |
|---|---|---|---|
| 4 | Sauce Labs Backpack | sauce-labs-backpack | $29.99 |
| 0 | Sauce Labs Bike Light | sauce-labs-bike-light | $9.99 |
| 1 | Sauce Labs Bolt T-Shirt | sauce-labs-bolt-t-shirt | $15.99 |
| 5 | Sauce Labs Fleece Jacket | sauce-labs-fleece-jacket | $49.99 |
| 2 | Sauce Labs Onesie | sauce-labs-onesie | $7.99 |
| 3 | Test.allTheThings() T-Shirt (Red) | test.allthethings()-t-shirt-(red) | $15.99 |

The last slug contains `.` and `()`, so prefer `getByTestId()` (exact attribute match) over a CSS selector for it.

## Header and menu (all logged-in pages)
- Cart link: `shopping-cart-link`; badge: `shopping-cart-badge` (absent when cart is empty)
- Menu open button: `#react-burger-menu-btn` (no data-test; button text "Open Menu"), close: `img[data-test=close-menu]` / button "Close Menu"
- Menu links: `inventory-sidebar-link` (All Items), `dynamic-catalog-sidebar-link` (Dynamic Catalog — new, not in plan), `about-sidebar-link` (https://saucelabs.com/), `logout-sidebar-link`, `reset-sidebar-link`
- Footer: `footer`, `social-x`, `social-facebook`, `social-linkedin`, `footer-copy`

## Cart (`/cart.html`)
- Title "Your Cart"; list `cart-list`; item `inventory-item`; quantity `item-quantity`
- Buttons: `remove-<slug>`, `continue-shopping` ("Continue Shopping"), `checkout` ("Checkout")

## Checkout information (`/checkout-step-one.html`)
- Title "Checkout: Your Information"
- Inputs: `firstName` ("First Name"), `lastName` ("Last Name"), `postalCode` ("Zip/Postal Code")
- Buttons: `cancel`, `continue` (`<input type=submit>`)
- Errors (`error`): `Error: First Name is required`, `Error: Last Name is required`, `Error: Postal Code is required`

## Checkout overview (`/checkout-step-two.html`)
- Title "Checkout: Overview"
- `payment-info-value` "SauceCard #31337"; `shipping-info-value` "Free Pony Express Delivery!"
- `subtotal-label` "Item total: $29.99", `tax-label` "Tax: $2.40", `total-label` "Total: $32.39" (one Backpack)
- Tax observed = 8% of item total, rounded to cents (29.99 × 0.08 = 2.3992 → 2.40). Confirm with more items in CHK-02.
- Buttons: `cancel`, `finish`

## Checkout complete (`/checkout-complete.html`)
- Title "Checkout: Complete!"
- `complete-header` "Thank you for your order!"
- `complete-text` "Your order has been dispatched, and will arrive just as fast as the pony can get there!"
- `back-to-products` ("Back Home"), `generate-pdf-order` (new, not in plan), image `pony-express`

## Verified during Phase 1 (2026-11-16, Playwright script against the live site)
- Session cookie details: `session-username`, domain `www.saucedemo.com`, path `/`, not httpOnly, sameSite Lax, **expires 10 minutes after login**. A cookie with the same name/value and no expiry date is also accepted by the site.
- Opening a protected page while logged out redirects to `/` and shows (`error`): `Epic sadface: You can only access '/inventory.html' when you are logged in.` Same pattern verified for `/cart.html`.
- Logout (menu → `logout-sidebar-link`) goes to `/` and removes the `session-username` cookie.
- Menu button is found by role: `getByRole('button', { name: 'Open Menu' })` (1 match). The logout link is not visible until the menu is opened.
- After a successful login the URL is `/inventory.html` and 6 `inventory-item` cards are shown.
- Observation: a failed login as `locked_out_user` still leaves a `session-username` cookie in the browser, although the error is shown and the user stays on `/`. Whether that cookie then gives access to protected pages has not been checked (candidate for AUTH-07 in Phase 2).
- Mobile viewport (Pixel 7 emulation, 412×839): login, add to cart, checkout, menu and logout use the same locators and behave the same.
- Pages render a moment after the URL changes (React), so read text with retrying assertions, not straight after a URL check.

## Verified during Phase 2 (2026-11-16, Playwright script against the live site)

### Login
- Both fields empty → `Epic sadface: Username is required`. After any login error the username input has class `input_error form_input error`. Clicking `error-button` removes the message.
- With the cookie `session-username=locked_out_user` (left by the refused login), `/inventory.html` is still blocked. Not a defect.

### Inventory
- Sort dropdown `product-sort-container` is a real `<select>`; default value `az`.
- Orders shown: `za` Red T-Shirt, Onesie, Fleece Jacket, Bolt T-Shirt, Bike Light, Backpack. `lohi` $7.99, $9.99, $15.99 (Bolt), $15.99 (Red), $29.99, $49.99. `hilo` $49.99, $29.99, $15.99 (Bolt), $15.99 (Red), $9.99, $7.99.
- Each card has one `<img>` with `alt` = product name, `data-test="inventory-item-<slug>-img"`, and its own `/assets/....jpg` source.

### Product detail (`/inventory-item.html?id=<id>`)
- `inventory-item-name`, `inventory-item-desc`, `inventory-item-price`, image `item-<slug>-img`, button `add-to-cart` (becomes `remove`), `back-to-products` ("Back to products"). No `title` element. Reached from `item-<id>-title-link` or `item-<id>-img-link`.

### Cart and checkout
- `cart-contents` in localStorage lists ids in the order added (e.g. `[4,0,1]`); writing that key and reloading fills the cart (used by the `seedCart` fixture).
- The cart survives reloads; removing on the cart page updates list and badge; `continue-shopping` → `/inventory.html`.
- All three checkout fields empty → `Error: First Name is required`.
- `cancel` on step one → `/cart.html`; `cancel` on the overview → `/inventory.html`; cart unchanged in both cases.
- Totals: 2 items (Backpack + Bike Light) `Item total: $39.98`, `Tax: $3.20`, `Total: $43.18`. All 6 items `Item total: $129.94`, `Tax: $10.40`, `Total: $140.34`. Tax = 8% rounded to cents, confirmed.
- Overview labels: `payment-info-label` "Payment Information:", `shipping-info-label` "Shipping Information:", `total-info-label` "Price Total".
- **Empty cart:** Checkout is enabled and the whole flow completes: `Item total: $0`, `Tax: $0.00`, `Total: $0.00`, then "Thank you for your order!" (DEF-01).

### Reset App State (`reset-sidebar-link`)
- Removes the badge and `cart-contents`; the menu stays open; the sort order is not reset; product buttons keep showing "Remove" until the page is reloaded (DEF-02).

### Special users
- **problem_user:** all pictures `/assets/sl-404-....jpg`; sorting ignored; only Backpack, Bike Light and Onesie can be added, and nothing can be removed on the Products page; Backpack title link opens `?id=5` (Fleece Jacket); in checkout, typing the last name lands in First Name and Last Name stays empty → `Error: Last Name is required`.
- **error_user:** sorting raises the alert `Sorting is broken! This error has been reported to Backtrace.`; the same three products cannot be added (page error "Failed to add item to the cart."); remove fails; Last Name stays empty but Continue works; Finish does nothing.
- **visual_user:** Backpack picture is `sl-404`; prices are different random numbers on every load; menu icon has class `visual_failure`; two names have class `align_right`; the last button has class `btn_inventory_misaligned`. Functions (sort, add, remove, checkout) work.
- **performance_glitch_user:** login measured at 5.2 s; the address changes at once and the content follows; everything else works normally.

## Verified during Phase 3 (2026-11-16, Playwright script against the live site)

### Roles and accessible names (Products page)
- Sort dropdown: role `combobox`, name "Sort products" (`aria-label`).
- Cart icon (`shopping-cart-link`, an `<a>`): role `button`, name "Cart, empty", and "Cart, 1 items" with one product.
- Six buttons named "Add to cart"; product name and picture are buttons named "View details for <product>"; pictures are `img` named by the product.
- 3 links on the page (the footer social links). `getByText('Sauce Labs')` matches 8 elements; `getByText('Sauce Labs Backpack', { exact: true })` matches 1.
- Cards: 2 contain "$15.99"; 4 do not contain "T-Shirt".
- Structure containers: `primary-header`, `secondary-header`, `header-container`, `inventory-container`.

### Login page
- `getByRole('textbox', { name: 'Username' })`, `getByPlaceholder('Username')`, `getByLabel('Username')` and `getByRole('button', { name: 'Login' })` each match 1 element. The form has the accessible name "Login".

### Footer
- `social-x` → `https://x.com/saucelabs`; `social-facebook` → `https://www.facebook.com/saucelabs`; `social-linkedin` → `https://www.linkedin.com/company/sauce-labs/`. All `target="_blank"`, `rel="noreferrer"`; each opens a new tab whose opener is the original page.
- linkedin.com answers automated browsers with a challenge page, so ADV-04 stubs it.
- `footer-copy`: "© <year> Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy"; the year comes from the JavaScript clock.
- Menu `about-sidebar-link` → `https://saucelabs.com/` (same tab, no target).

### Network
- Products page requests: 1 document, 2 stylesheets, 1 script, 2 fetch, 3 fonts, 6 images (`/assets/*.jpg`). Hosts: `www.saucedemo.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `events.backtrace.io`.
- With all images aborted the page lists 6 products and add-to-cart works.

### Accessibility (axe-core)
- WCAG 2.0/2.1 A and AA tags: 0 violations on login and Products pages.
- All rules: `page-has-heading-one` (both pages) and `region` (login logo), both moderate, best-practice only.

### Clock and session
- With `page.clock` set to 2031 the footer reads "© 2031".
- No JavaScript session timer: after 11 mocked minutes navigation and reload still work.

### Alert
- error_user, sorting: dialog type `alert`, message `Sorting is broken! This error has been reported to Backtrace.` The action that triggers it does not finish until the dialog is handled.

## Not yet verified
- Whether the session really ends after 10 real minutes (only the cookie lifetime was read).
- `dynamic-catalog-sidebar-link`, `generate-pdf-order` (new on the site, not in the plan).
