# Playwright vs Selenium Java — feature by feature

This document grows with the framework. Every time a feature is built, a section is added
here **in the same commit as the code**, so the comparison always matches what is really in
the repo. Nothing is written here ahead of the code, because each section must quote the
Playwright code we actually used and behavior we actually verified on the live site.

The same comparison also lives next to the code: every method in `src/` and every `test()`
in `tests/` carries a `SELENIUM JAVA EQUIVALENT` comment block (see `CLAUDE.md`). Use the
code comments for the line-by-line view and this document for the bigger picture.

## How each section is laid out

1. **What it does** — the feature in simple language.
2. **Playwright (our code)** — a short snippet taken from this framework.
3. **Selenium Java equivalent** — a working Selenium 4 snippet (JUnit 5 or TestNG).
4. **Key differences** — waits, locators, setup, reporting.
5. **Which is better here and why.**
6. **No direct equivalent?** — if Selenium cannot do it natively, this says so and shows the
   usual workaround.

## Status

| Phase | Topic | Section status |
|-------|-------|----------------|
| 1 | Config (`playwright.config.ts`) | Not built yet |
| 1 | `.env` and secrets | Not built yet |
| 1 | Locators (`getByTestId` vs `By.cssSelector`) | Not built yet |
| 1 | Auto-waiting vs `WebDriverWait` | Not built yet |
| 1 | Page Object Model | Not built yet |
| 1 | Fixtures vs `@BeforeEach` / base class | Not built yet |
| 1 | `storageState` vs cookie injection | Not built yet |
| 1 | `test.step` vs Allure steps | Not built yet |
| 1 | Tags vs TestNG groups | Not built yet |
| 1 | GitHub Actions run | Not built yet |

## Sections

_No features have been built yet. The first sections will be added with the Phase 1 code._
