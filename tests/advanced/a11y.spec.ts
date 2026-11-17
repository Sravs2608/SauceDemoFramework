/**
 * Role: automated accessibility checks (plan A11Y-01). The axe-core engine (package
 * @axe-core/playwright, by Deque) inspects the page and reports violations of the WCAG
 * rules: missing labels, poor colour contrast, wrong ARIA attributes and so on.
 *
 * Scope: WCAG 2.0 and 2.1, levels A and AA (the levels most laws and contracts refer to).
 * Result on the live site on 2026-11-16: 0 violations on both pages.
 *
 * Two limits to keep in mind:
 *   - An automated scan finds only part of all accessibility problems (commonly quoted as
 *     roughly a third to a half). Keyboard use, focus order and screen-reader sense still
 *     need a human.
 *   - Outside our scope, axe's "best-practice" rules do report two moderate findings:
 *     no level-one heading on either page, and the login logo outside any landmark. They
 *     are recorded in docs/TRACEABILITY.md as observations, not WCAG failures.
 */
import { AxeBuilder } from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { test, expect } from '../../src/fixtures/test';

const WCAG_A_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Scans the current page, attaches the full axe result to the report as JSON, and
 * returns a short readable line per violated rule (empty list = clean).
 *
 * SELENIUM JAVA EQUIVALENT:
 *   // dependency: com.deque.html.axe-core:selenium
 *   static List<String> scan(WebDriver driver) {
 *       Results results = new AxeBuilder()
 *           .withTags(List.of("wcag2a", "wcag2aa", "wcag21a", "wcag21aa"))
 *           .analyze(driver);
 *       return results.getViolations().stream()
 *           .map(v -> v.getId() + " [" + v.getImpact() + "]: " + v.getHelp())
 *           .toList();
 *   }
 *
 * DIFFERENCE: Almost none. axe-core is a separate engine with official bindings for both
 *   tools, and the builder API is nearly identical. Attaching the JSON to the report is
 *   built in here (testInfo.attach); with Selenium you use Allure.addAttachment.
 */
async function scanForWcagViolations(page: Page, testInfo: TestInfo, label: string): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_A_AA).analyze();
  await testInfo.attach(`axe-results-${label}.json`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
  return results.violations.map(
    (violation) => `${violation.id} [${violation.impact}]: ${violation.help} (${violation.nodes.length} element(s))`,
  );
}

/**
 * Groups the login-page scan, which must start logged out.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   class LoginAccessibilityTest extends BaseTest {
 *       @BeforeEach
 *       void startLoggedOut() {
 *           driver.manage().deleteAllCookies();
 *       }
 *   }
 *
 * DIFFERENCE: test.use sets storageState for this group only; a fresh Selenium driver is
 *   logged out by default.
 */
test.describe('A11Y-01 login page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * A11Y-01 (login page): no WCAG 2.1 A/AA violations.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test @Tag("regression")
   *   void a11y01_loginPageHasNoWcagViolations() {
   *       driver.get(baseUrl);
   *       wait.until(ExpectedConditions.visibilityOfElementLocated(
   *           By.cssSelector("[data-test='login-button']")));
   *       assertEquals(List.of(), AccessibilityHelper.scan(driver));
   *   }
   *
   * DIFFERENCE: Same test in both tools. Comparing a list of readable lines with an empty
   *   list makes the failure message show exactly which rules were broken.
   */
  test('A11Y-01: login page has no WCAG A/AA violations', { tag: '@regression' }, async ({ page, loginPage }, testInfo) => {
    await loginPage.open();
    await loginPage.expectLoaded();

    const violations = await scanForWcagViolations(page, testInfo, 'login');
    expect(violations).toEqual([]);
  });
});

/**
 * A11Y-01 (Products page): no WCAG 2.1 A/AA violations.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void a11y01_inventoryPageHasNoWcagViolations() {
 *       injectSessionCookie();
 *       driver.get(baseUrl + "/inventory.html");
 *       wait.until(ExpectedConditions.numberOfElementsToBe(
 *           By.cssSelector("[data-test='inventory-item']"), 6));
 *       assertEquals(List.of(), AccessibilityHelper.scan(driver));
 *   }
 *
 * DIFFERENCE: Same test in both tools; the page must be fully rendered before scanning in
 *   either, because axe only sees what is in the page at that moment.
 */
test('A11Y-01: inventory page has no WCAG A/AA violations', { tag: '@regression' }, async ({
  page,
  inventoryPage,
}, testInfo) => {
  await inventoryPage.open();
  await inventoryPage.expectLoaded();
  await expect(inventoryPage.items).toHaveCount(6);

  const violations = await scanForWcagViolations(page, testInfo, 'inventory');
  expect(violations).toEqual([]);
});
