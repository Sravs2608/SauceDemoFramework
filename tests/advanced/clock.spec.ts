/**
 * Role: time mocking with page.clock (plan section 6, "Time mocking"). page.clock replaces
 * the page's JavaScript clock (Date, setTimeout, setInterval), so a test can pretend it is
 * another day or let hours pass in an instant, without waiting.
 *
 * What we found on the live site on 2026-11-16 (this settles the plan's open item
 * "does the SauceDemo session expire on a timer?"):
 *   - The footer's copyright year comes from the JavaScript clock: with the clock set to
 *     2031 it reads "© 2031". That is what the test below uses.
 *   - The login session is NOT run by a JavaScript timer. It is a browser cookie with a
 *     10-minute lifetime, and cookie lifetimes are enforced by the browser's real clock,
 *     which page.clock does not touch. Fast-forwarding 11 mocked minutes leaves the user
 *     logged in. So session expiry cannot be tested with page.clock on this site; an
 *     expired session is equivalent to having no cookie, which AUTH-07 already covers.
 */
import { test, expect } from '../../src/fixtures/test';

/**
 * ADV-06: with the clock set to a date in 2031 the footer shows "© 2031"; after 11
 * mocked minutes the user is still logged in (documents that there is no session timer
 * in the page).
 *
 * SELENIUM JAVA EQUIVALENT:
 *   // Selenium has no clock control. Workaround: overwrite Date in the page with
 *   // JavaScript BEFORE the application loads, which needs a Chromium-only DevTools call:
 *   @Test @Tag("regression")
 *   void adv06_footerYearFollowsTheClock() {
 *       ((ChromeDriver) driver).executeCdpCommand("Page.addScriptToEvaluateOnNewDocument", Map.of(
 *           "source",
 *           "const fixed = new Date('2031-03-15T10:00:00').getTime();" +
 *           "const RealDate = Date;" +
 *           "Date = class extends RealDate {" +
 *           "  constructor(...args) { super(...(args.length ? args : [fixed])); }" +
 *           "  static now() { return fixed; }" +
 *           "};"));
 *       injectSessionCookie();
 *       driver.get(baseUrl + "/inventory.html");
 *       String footer = driver.findElement(By.cssSelector("[data-test='footer-copy']")).getText();
 *       assertTrue(footer.contains("© 2031"));
 *   }
 *   // Moving time FORWARD (timers firing) has no practical Selenium workaround; teams
 *   // shorten the timeout in a test environment or really wait.
 *
 * DIFFERENCE: page.clock.install() sets the time and page.clock.fastForward() makes
 *   timers fire as if the time had passed, in every browser. Selenium offers nothing
 *   built in; the Date override above is fragile, Chromium-only, and does not move timers.
 */
test('ADV-06: page.clock controls the date the page sees', { tag: '@regression' }, async ({ page, inventoryPage, cartPage }) => {
  await test.step('Set the page clock to 15 March 2031, before the page loads', async () => {
    await page.clock.install({ time: new Date('2031-03-15T10:00:00') });
  });

  await test.step('Footer shows the mocked year', async () => {
    await inventoryPage.open();
    await inventoryPage.expectLoaded();
    await expect(inventoryPage.footer.copyright).toContainText('© 2031');
  });

  await test.step('Let 11 minutes pass instantly; the session is still valid', async () => {
    await page.clock.fastForward('11:00');
    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();
  });
});
