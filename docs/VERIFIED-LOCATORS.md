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

## Not yet verified
- Product detail page locators (INV-06), sorting results, special-user behaviors.
- Whether the session really ends after 10 minutes of use (only the cookie lifetime was read), and tax with more than one item (CHK-02).
