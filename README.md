# SauceDemoFramework

A production-style **Playwright + TypeScript** test automation framework for
[saucedemo.com](https://www.saucedemo.com), built phase by phase as a learning project,
with a Selenium Java comparison for every feature.

**Status:** Phase 1 (core framework + smoke tests) complete. Plan and phases:
[docs/SAUCEDEMO-PLAN.md](docs/SAUCEDEMO-PLAN.md).

## What is in here

| Path | What it is |
|---|---|
| `playwright.config.ts` | Central settings: browsers, parallel run, retries, report, saved login |
| `global-setup.ts` | Logs in once before the run and saves the session |
| `src/utils/` | Settings reader (`env.ts`) and money helpers |
| `src/data/` | Test data: users, products, customer, exact messages |
| `src/pages/` | Page objects (one class per screen) and shared components |
| `src/fixtures/test.ts` | Our `test` with page objects ready to use |
| `tests/ui/` | The tests, grouped by feature |
| `.github/workflows/playwright.yml` | CI pipeline (GitHub Actions) |
| `docs/` | Plan, verified locators, traceability matrix, Selenium comparison |

## Setup (once)

Needs Node.js 22 or newer (built on 24) and Git.

```bash
git clone https://github.com/Sravs2608/SauceDemoFramework.git
cd SauceDemoFramework
npm ci                                             # install exact dependency versions
npx playwright install chromium firefox webkit     # download the browsers
```

Create your settings file: copy `.env.example` to `.env` and fill in `SAUCE_PASSWORD`
(the password shown on the SauceDemo login page). `.env` is ignored by Git.

```bash
copy .env.example .env        # Windows (PowerShell / cmd)
cp .env.example .env          # macOS / Linux / Git Bash
```

For GitHub Actions, add a repository secret named `SAUCE_PASSWORD`
(Settings → Secrets and variables → Actions → New repository secret).

## Run commands

| Command | What it does |
|---|---|
| `npm test` | All tests, all browsers (headless) |
| `npm run test:smoke` | Only `@smoke` tests |
| `npm run test:regression` | Only `@regression` tests (none yet; they arrive in Phase 2) |
| `npm run test:chromium` | All tests, Chromium only (fastest) |
| `npx playwright test tests/ui/cart` | One folder |
| `npx playwright test -g "CHK-01"` | One test by its ID |
| `npx playwright test --project=chromium --headed` | Watch the browser |
| `npm run test:ui` | UI Mode: pick tests, watch them, time-travel through steps |
| `npx playwright test -g "CHK-01" --project=chromium --debug` | Step through with the Inspector |
| `npm run report` | Open the last HTML report |
| `npm run lint` / `npm run typecheck` | Static checks (run both before committing) |

## Study order

Read the files in this order; each has a header comment explaining its role, and every
method and test has a `SELENIUM JAVA EQUIVALENT` note.

1. `docs/SAUCEDEMO-PLAN.md` — what we are building and why.
2. `docs/VERIFIED-LOCATORS.md` — what was checked on the live site.
3. `.env.example` → `src/utils/env.ts` — where settings come from.
4. `src/data/users.ts`, `products.ts`, `checkout.ts`, `messages.ts` — test data.
5. `src/pages/LoginPage.ts` — the simplest page object. Then `BasePage.ts`, which it extends.
6. `src/pages/components/Header.ts` and `Menu.ts` — shared pieces of UI.
7. `src/pages/InventoryPage.ts`, `CartPage.ts`, then the three `Checkout*Page.ts` files.
8. `src/fixtures/test.ts` — how page objects reach the tests.
9. `tests/ui/cart/cart.spec.ts` — the shortest test. Then `checkout.spec.ts`, then `auth.spec.ts`.
10. `global-setup.ts` and `playwright.config.ts` — why tests start logged in, and the run settings.
11. `.github/workflows/playwright.yml` — the same run in CI.
12. `docs/SELENIUM-COMPARISON.md` — the ten topics side by side with Selenium Java.
13. `docs/TRACEABILITY.md` — test case → automation → result.

Tip: run `npm run test:ui`, open CHK-01 and click through the steps while reading
`tests/ui/checkout/checkout.spec.ts`.

## Conventions

- Test titles start with the test case ID from the plan (`AUTH-01: ...`) and carry a tag.
- Locators: `getByRole` / `getByLabel` / `getByTestId` (`data-test`) before CSS; no XPath.
- No hard waits; assertions are web-first (`await expect(locator)...`).
- No URL or credential in tests; everything comes from `.env` / CI secrets.
- Known application defects are marked with `test.fail` and a comment, never by weakening an assertion.
