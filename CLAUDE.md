# CLAUDE.md — SauceDemo Playwright Framework

## Purpose
Build a production-style Playwright + TypeScript automation framework for https://www.saucedemo.com (plus supporting practice sites) so I can learn modern automation end to end, and compare every feature with Selenium Java. The plan, test catalog and scope are in `docs/SAUCEDEMO-PLAN.md`. Treat that file as the source of truth and keep test case IDs unchanged.

## About me
I am an experienced QA/Test Lead (about 14 years) with strong manual, functional, SIT/UAT and regression experience, but limited hands-on automation. Explain the why, not just the syntax, in simple language. My goal is to understand, run, debug and review this framework myself, not just own working code.

## How to work
- Build in the phases defined in `docs/SAUCEDEMO-PLAN.md`, in priority order. Within a phase, work without stopping for approval on each file. At the end of each phase, stop, summarize what was built, and wait for my go-ahead.
- After each meaningful change, run the relevant tests (`npx playwright test ...`) and report the actual result. Never claim a test passes without running it.
- When a test fails, explain the root cause (locator, synchronization, test data, environment, code or application defect) before fixing it, and explain why the fix works.
- Verify every locator, error message, value and behavior on the live site before using it. Never invent selectors, messages, API endpoints or behavior. If something cannot be verified, say so.
- Commit in small, logical commits with clear messages. For each commit, tell me in 2–4 lines what it does and why. Push to GitHub at the end of each phase.
- Ask before adding scope beyond the plan, installing packages not named in the plan, or any destructive action (force push, deleting branches or files, rewriting history).
- If usage limits look tight, finish the current phase cleanly so the repo is always runnable.

## Coding standards
- TypeScript, Playwright Test runner, Page Object Model plus custom fixtures.
- Locator priority: getByRole / getByLabel / getByTestId (`data-test`) before CSS; no brittle XPath.
- No hard waits (`waitForTimeout`) unless justified in a comment. Use web-first assertions.
- No hardcoded credentials or URLs in tests: use `.env` (with `.env.example` committed, `.env` git-ignored) and GitHub Actions secrets. Never print secrets in logs.
- Every test is independent, tagged (`@smoke` / `@regression`), named with its test case ID, and asserts the real business outcome (totals, order, state), not just visibility.
- Use `test.step()` for business-readable steps. Mark known application defects with `test.fail` plus a comment, never by weakening the assertion.
- Run ESLint (Playwright plugin) and fix issues before committing.

## Teaching and documentation
- Every file gets a short header comment explaining its role in the framework.
- For each feature, add a section to `docs/SELENIUM-COMPARISON.md`: how Playwright does it, the Selenium Java equivalent with a code snippet, and which approach is better and why. Where Selenium has no direct equivalent, say so and show the usual workaround.
- Keep `docs/TRACEABILITY.md` updated: test ID, description, spec file, pages, locators, expected result, automation status, execution status, defects.
- README must include setup, run commands, and the order in which to study the files.
- After each phase, give me one small exercise (explain or modify a piece of code).

## Communication
- Be concise between steps; detailed in the docs.
- At each phase stop, list: files created, tests added, test results (actual), commits made, and anything unverified.
## Selenium Java comparison (required for every feature)
- For every feature you build, add or update a section in `docs/SELENIUM-COMPARISON.md`
  in the same commit as the code. A phase is not complete without it.
- Each section must have:
  1. What the feature does, in simple language.
  2. The Playwright code we used (short snippet from our framework).
  3. The Selenium Java equivalent as a working snippet (Selenium 4, JUnit 5 or TestNG).
  4. Key differences (waits, locators, setup, reporting).
  5. Which is better here and why.
  6. If Selenium has no direct equivalent (for example storageState, fixtures, trace viewer,
     route mocking), say so and show the usual workaround.
- Phase 1 topics: config, .env, locators (getByTestId vs By.cssSelector), auto-waiting vs
  WebDriverWait, Page Object Model, fixtures vs @BeforeEach/base class, storageState vs
  cookie injection, test.step vs Allure steps, tags vs TestNG groups, GitHub Actions run.
## Selenium Java notes inside the code (required)
Every method in `src/` and every `test()` in `tests/` must have a JSDoc comment directly above it with this block. A hook checks this after every file write and will send the file back if a block is missing.

```ts
/**
 * <What this does, in one or two simple sentences.>
 *
 * SELENIUM JAVA EQUIVALENT:
 *   <Working Selenium 4 Java code doing the same thing, e.g.>
 *   new WebDriverWait(driver, Duration.ofSeconds(10))
 *       .until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-test='login-button']")))
 *       .click();
 *
 * DIFFERENCE: <Why the Playwright version is shorter/safer/different, e.g. auto-waiting,
 *   web-first assertions, fixtures, storageState. If Selenium has no direct equivalent,
 *   say so and name the usual workaround.>
 */
```

- Config files (`playwright.config.ts`, `global-setup.ts`) get a file-level block instead of per-method blocks.
- Also add or update the matching section in `docs/SELENIUM-COMPARISON.md` in the same commit. A phase is not complete without it.
