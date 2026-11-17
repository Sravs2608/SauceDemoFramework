# SauceDemo Playwright Framework — Plan and Scope

## 1. Goal
Learn modern UI and API automation by building a complete, production-style Playwright framework, and keep Selenium Java comparison notes for every feature so I can lead automation discussions and review code in either tool.

## 2. Decisions
| Item | Decision | Reason |
|---|---|---|
| Tool | Playwright | Modern, auto-waiting, built-in runner, tracing, API testing, sharding |
| Language | TypeScript | Full Playwright Test runner, fixtures, UI Mode, projects. Playwright Java has no built-in test runner |
| Main app | https://www.saucedemo.com | Built for automation practice, stable `data-test` attributes |
| Alerts, iframes, uploads, downloads, windows | https://the-internet.herokuapp.com | SauceDemo has none of these |
| UI + backend validation | A practice app with both UI and API (to be confirmed online before use) | SauceDemo has no backend |
| API tests | Public practice API (to be confirmed) | SauceDemo has no API |
| Environment | Windows, VS Code, Node.js, GitHub (personal repo) | Already installed |
| Repo | `<Sravs2608/SauceDemoFramework` — to fill in | |

## 3. Build phases (priority order)
1. **Core framework:** config, `.env`, page objects, fixtures, auth reuse (storageState), smoke tests, GitHub Actions smoke pipeline.
2. **Regression suite:** all remaining SauceDemo test cases in section 5.
3. **Advanced topics:** section 6 items.
4. **Second sites:** the-internet tests, UI-to-backend validation, API tests.
5. **Docs:** README with study order, TRACEABILITY, SELENIUM-COMPARISON, DEBUGGING-GUIDE, FLAKY-TESTS guide.

## 4. Proposed structure
```
saucedemo-playwright/
├─ .github/workflows/playwright.yml
├─ playwright.config.ts
├─ global-setup.ts
├─ .env.example
├─ src/
│  ├─ pages/          BasePage, LoginPage, InventoryPage, ProductDetailPage,
│  │                  CartPage, CheckoutInfoPage, CheckoutOverviewPage,
│  │                  CheckoutCompletePage, components/ (Header, Menu, Footer)
│  ├─ fixtures/       custom test fixtures
│  ├─ data/           users, products, test data builders
│  ├─ api/            API clients
│  └─ utils/          shared helpers
├─ tests/
│  ├─ ui/             auth, inventory, cart, checkout, users, app
│  ├─ advanced/       contexts, network, visual, a11y, clock, aria
│  ├─ internet/       alerts, frames, upload, download, windows
│  ├─ backend/        UI-to-backend validation
│  └─ api/
└─ docs/              TRACEABILITY, SELENIUM-COMPARISON,
                      DEBUGGING-GUIDE, FLAKY-TESTS
```

## 5. Test case catalog
Exact messages and values are verified on the live site, not assumed.

### Authentication
| ID | Description | Tag |
|---|---|---|
| AUTH-01 | Valid login (standard_user) lands on Products page | smoke |
| AUTH-02 | Wrong password shows error | regression |
| AUTH-03 | Unknown username shows error | regression |
| AUTH-04 | Empty username shows required error | regression |
| AUTH-05 | Empty password shows required error | regression |
| AUTH-06 | locked_out_user blocked with locked-out error | smoke |
| AUTH-07 | Inventory URL without login is blocked | regression |
| AUTH-08 | Logout returns to login; protected pages blocked afterwards | smoke |

### Inventory
| ID | Description | Tag |
|---|---|---|
| INV-01 | All products show name, price, image, add button | regression |
| INV-02 | Sort Name A–Z, verify actual order | regression |
| INV-03 | Sort Name Z–A, verify actual order | regression |
| INV-04 | Sort Price low–high, verify actual order | regression |
| INV-05 | Sort Price high–low, verify actual order | regression |
| INV-06 | Product detail matches listing name and price | regression |

### Cart
| ID | Description | Tag |
|---|---|---|
| CART-01 | Add one item, badge shows 1 | smoke |
| CART-02 | Add multiple items, badge count matches | regression |
| CART-03 | Remove from inventory page updates badge | regression |
| CART-04 | Remove from cart page | regression |
| CART-05 | Cart persists across navigation and reload | regression |
| CART-06 | Continue Shopping returns to inventory, cart intact | regression |

### Checkout
| ID | Description | Tag |
|---|---|---|
| CHK-01 | End-to-end purchase of one item, confirmation shown | smoke |
| CHK-02 | Multiple items: item total, tax and grand total correct | regression |
| CHK-03 | First name required | regression |
| CHK-04 | Last name required | regression |
| CHK-05 | Postal code required | regression |
| CHK-06 | Cancel on information step returns to cart | regression |
| CHK-07 | Cancel on overview returns to inventory | regression |
| CHK-08 | After order completes, cart is empty | regression |
| CHK-09 | Checkout with empty cart — observe and document actual behavior | regression |

### Special users
| ID | Description | Tag |
|---|---|---|
| USR-01 | problem_user: detect known broken behaviors | regression |
| USR-02 | performance_glitch_user: login completes without hard waits | regression |
| USR-03 | error_user: detect action failures | regression |
| USR-04 | visual_user: visual comparison catches UI differences | regression |

### App state and cross-cutting
| ID | Description | Tag |
|---|---|---|
| APP-01 | Reset App State clears cart | regression |
| NET-01 | Block images via network mocking; page still functional | regression |
| A11Y-01 | Accessibility scan on login and inventory pages | regression |
| MOB-01 | Smoke suite on mobile viewport | smoke |
| API-01..04 | Create, read, update, delete on practice API | regression |

Manual-only: look-and-feel judgment beyond pixel comparison; exploratory checks on problem_user.

## 6. Advanced topics to cover
| Topic | What to learn | Priority | Where |
|---|---|---|---|
| Advanced locators | getByRole, getByLabel, getByTestId, chaining, filter() | Essential | SauceDemo |
| Auto-waiting & web-first assertions | Actionability, retrying assertions, no hard waits | Essential | SauceDemo (performance_glitch_user) |
| Browser contexts & isolation | Multiple users, separate sessions and cookies | High | SauceDemo (two users, two carts) |
| Page events & browser handling | Alerts, popups, new tabs, downloads, uploads | High | SauceDemo footer links + the-internet |
| Frames and iframes | Embedded content | High | the-internet |
| Debugging & UI Mode | --debug, UI Mode, Inspector, trace viewer | Essential | Debugging guide + exercises |
| Sharding | Split runs across CI machines, merge reports | High | GitHub Actions matrix |
| Test annotations | skip, fixme, slow, fail, describe.configure | Medium | Throughout |
| Time mocking | page.clock for expiry/timeouts | High | SauceDemo session expiry, if verified |
| Backend validation | Create via UI, verify via API/backend | High | UI + API practice app |
| Test architecture | Utilities, data builders, environment setup | High | Throughout |
| Test quality | Flaky-test investigation, independence, cleanup | Essential | FLAKY-TESTS guide |
| test.step() | Business-readable report steps | High | Throughout |
| Soft assertions | expect.soft for multi-field checks | Medium | Checkout overview |
| ARIA snapshots | toMatchAriaSnapshot structural checks | Medium | Inventory page |
| API-based setup/cleanup | Fast, stable test data | High | Backend tests |
| HAR record/replay | Replay network traffic | Medium | Advanced |
| Codegen | Locator discovery, and its limits | Medium | Debugging guide |
| ESLint (Playwright plugin) | Catch missing await and anti-patterns | Medium | Project setup |
| CI secrets | Credentials in GitHub Actions | High | Pipeline |

## 7. CI/CD
- GitHub Actions: smoke on every push and pull request; full regression on manual trigger.
- Browsers: Chromium, Firefox, WebKit; mobile viewport project for smoke.
- Sharded regression with merged HTML report.
- HTML report, traces, screenshots and videos uploaded as artifacts.
- Credentials from GitHub Actions secrets.

## 8. Documentation deliverables
- **README:** setup, run commands, and the order in which to study the files.
- **TRACEABILITY.md:** test ID, description, spec file, pages, locators, expected result, automation status, execution status, defects.
- **SELENIUM-COMPARISON.md:** per feature — Playwright approach, Selenium Java equivalent with snippet, which is better and why, workaround where Selenium has no equivalent.
- **DEBUGGING-GUIDE.md:** UI Mode, --debug, Inspector, trace viewer, codegen, with exercises.
- **FLAKY-TESTS.md:** how to investigate and fix flaky tests.

## 9. Open items
- [ ] GitHub repo name
- [ ] Confirm the-internet.herokuapp.com is acceptable
- [ ] Confirm UI + API practice app (verify it is online)
- [ ] Confirm public practice API (verify it is online)
- [ ] Verify whether SauceDemo session expires on a timer (for page.clock)

## 10. Time and model
- Estimated 5–6 hours including local run-and-fix cycles.
- Built on Claude Fable 5.2 while available; later study and maintenance with Opus.
