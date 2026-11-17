# SauceDemoFramework

A production-style **Playwright + TypeScript** test automation framework for
[saucedemo.com](https://www.saucedemo.com), built phase by phase as a learning project,
with a Selenium Java comparison for every feature.

**Status:** Phase 1 (core framework + smoke tests), Phase 2 (regression suite) and Phase 3
(advanced topics) complete: 52 tests, of which 10 are known application defects marked
`test.fail`. Plan and phases:
[docs/SAUCEDEMO-PLAN.md](docs/SAUCEDEMO-PLAN.md). Results and defects:
[docs/TRACEABILITY.md](docs/TRACEABILITY.md).

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
| `tests/advanced/` | One spec per advanced topic: locators, contexts, events, network, accessibility, clock, ARIA, soft assertions |
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
| `npm run test:regression` | Only `@regression` tests |
| `npm run test:chromium` | All tests, Chromium only (fastest) |
| `npx playwright test tests/ui/cart` | One folder |
| `npx playwright test tests/advanced --project=chromium` | The advanced-topic tests |
| `npx playwright test --shard=1/4` | One quarter of the suite (how CI splits the full run) |
| `npx playwright test -g "CHK-01"` | One test by its ID |
| `npx playwright test --project=chromium --headed` | Watch the browser |
| `npm run test:ui` | UI Mode: pick tests, watch them, time-travel through steps |
| `npx playwright test -g "CHK-01" --project=chromium --debug` | Step through with the Inspector |
| `npm run report` | Open the last HTML report |
| `npm run lint` / `npm run typecheck` | Static checks (run both before committing) |
| `npx playwright test visual-user --project=chromium --update-snapshots` | Approve a new baseline screenshot after an intended design change |

### Reading the results

- `ok` = passed. `x` next to a test that is counted under "passed" = an **expected
  failure**: a known application defect, marked `test.fail` (see the Defects table in
  `docs/TRACEABILITY.md`).
- `flaky` = failed, then passed on the automatic retry. Treat it as a problem to look at,
  not as a pass.
- "passed unexpectedly" = a `test.fail` test passed, so the defect seems fixed: remove the mark.
- Locally 4 tests run in parallel and a failed test is retried once (2 workers, 2 retries in CI).
- The two visual tests (USR-04) run only on Chromium on Windows and are skipped elsewhere.

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
12. `docs/SELENIUM-COMPARISON.md` sections 1–10 — the Phase 1 topics side by side with Selenium Java.
13. `docs/TRACEABILITY.md` — test case → automation → result → defects.

Phase 2 (regression suite), in this order:

14. `src/data/products.ts` (`sortOptions`, `expectedOrder`) and `src/data/messages.ts`.
15. `tests/ui/auth/auth.spec.ts`, AUTH-02 to AUTH-05 — one test body, a table of data.
16. `src/pages/InventoryPage.ts` (`card`, `sortBy`) → `tests/ui/inventory/inventory.spec.ts`.
17. `src/fixtures/test.ts` (`seedCart`, `loginAs`) → the rest of `cart.spec.ts` and `checkout.spec.ts`.
18. CHK-09 in `checkout.spec.ts` and `tests/ui/app/app-state.spec.ts` — known defects with `test.fail`.
19. `tests/ui/users/special-users.spec.ts` — broken users and the slow user.
20. `tests/ui/users/visual-user.spec.ts` — screenshot comparison.
21. `docs/SELENIUM-COMPARISON.md` sections 11–16.

Phase 3 (advanced topics, `tests/advanced/`). Each spec is independent; this order goes
from familiar to new:

22. `locators.spec.ts` — every way to find an element.
23. `soft-assertions.spec.ts` — check many fields, report all failures.
24. `events.spec.ts` — alerts and new tabs ("listen first, then act").
25. `contexts.spec.ts` — two users in one test.
26. `network.spec.ts` — block requests; record and replay traffic (HAR).
27. `aria.spec.ts` — check the structure of a block in one assertion.
28. `clock.spec.ts` — change the date the page sees.
29. `a11y.spec.ts` — accessibility scan with axe.
30. `.github/workflows/playwright.yml`, jobs `regression` and `merge-reports` — sharding.
31. `docs/SELENIUM-COMPARISON.md` sections 17–24.

Tip: run `npm run test:ui`, open CHK-01 and click through the steps while reading
`tests/ui/checkout/checkout.spec.ts`.

## Conventions

- Test titles start with the test case ID from the plan (`AUTH-01: ...`) and carry a tag.
- Locators: `getByRole` / `getByLabel` / `getByTestId` (`data-test`) before CSS; no XPath.
- No hard waits; assertions are web-first (`await expect(locator)...`).
- No URL or credential in tests; everything comes from `.env` / CI secrets.
- Known application defects are marked with `test.fail` and a comment, never by weakening an assertion.
