/**
 * Role: shows how to react to things the BROWSER does (plan section 6, "Page events &
 * browser handling"): a JavaScript alert, and a link that opens a new tab. SauceDemo has
 * exactly these two; file upload, download and iframes are covered on the-internet in
 * Phase 4.
 *
 * The pattern is the same for every event: FIRST say what you are waiting for, THEN do
 * the action that causes it. If the action comes first, the event may already be over.
 */
import { test, expect } from '../../src/fixtures/test';
import { users } from '../../src/data/users';
import { sortOptions } from '../../src/data/products';

/**
 * Groups the alert test, which must log in as error_user and therefore starts logged out.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   class BrowserAlertTest extends BaseTest {
 *       @BeforeEach
 *       void startLoggedOut() {
 *           driver.manage().deleteAllCookies();
 *       }
 *   }
 *
 * DIFFERENCE: test.use changes a config setting (here storageState) for one group of
 *   tests; in Selenium a fresh driver is logged out by default and logging in is the extra
 *   step.
 */
test.describe('Browser alert', () => {
  // error_user is the only account for which the site shows an alert (when sorting).
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * ADV-03: catch a browser alert, read its type and text, and accept it.
   * (The alert itself is error_user's known defect DEF-E1; this test is about HANDLING a
   * dialog, so it asserts what the dialog says.)
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test @Tag("regression")
   *   void adv03_alertIsCaughtAndAccepted() {
   *       driver.get(baseUrl);
   *       loginPage.login(Users.ERROR);
   *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
   *       new Select(driver.findElement(By.cssSelector("[data-test='product-sort-container']")))
   *           .selectByValue("za");
   *       Alert alert = wait.until(ExpectedConditions.alertIsPresent());
   *       assertEquals("Sorting is broken! This error has been reported to Backtrace.", alert.getText());
   *       alert.accept();
   *   }
   *
   * DIFFERENCE: Opposite order. In Playwright you register a handler BEFORE the action,
   *   because the action does not finish while the alert is open; with no handler at all,
   *   Playwright dismisses dialogs automatically. In Selenium you act first, then switch to
   *   the alert (driver.switchTo().alert() / alertIsPresent); an alert nobody handles makes
   *   the next command throw UnhandledAlertException.
   */
  test('ADV-03: browser alert is caught, read and accepted', { tag: '@regression' }, async ({
    page,
    loginAs,
    inventoryPage,
  }) => {
    await loginAs(users.error);

    let dialogType = '';
    let dialogMessage = '';

    await test.step('Tell Playwright what to do when a dialog appears', async () => {
      page.once('dialog', (dialog) => {
        dialogType = dialog.type();
        dialogMessage = dialog.message();
        void dialog.accept();
      });
    });

    await test.step('Trigger the alert by sorting', async () => {
      await inventoryPage.sortBy(sortOptions.nameDesc);
    });

    await test.step('The alert was caught with the expected text', async () => {
      await expect.poll(() => dialogMessage).toBe('Sorting is broken! This error has been reported to Backtrace.');
      expect(dialogType).toBe('alert');
    });
  });
});

/**
 * ADV-04: the footer's LinkedIn link opens in a new tab; the test gets hold of the new
 * tab, checks its address, and confirms the original tab is untouched.
 *
 * So that the test does not depend on linkedin.com being reachable (it answers automated
 * browsers with a challenge page), requests to that site are answered by a tiny stub page
 * of our own (network mocking with route.fulfill). The address of the new tab is still
 * the real one.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void adv04_footerLinkOpensNewTab() {
 *       driver.get(baseUrl + "/inventory.html");
 *       String original = driver.getWindowHandle();
 *       driver.findElement(By.cssSelector("[data-test='social-linkedin']")).click();
 *       wait.until(ExpectedConditions.numberOfWindowsToBe(2));
 *       for (String handle : driver.getWindowHandles()) {
 *           if (!handle.equals(original)) {
 *               driver.switchTo().window(handle);
 *           }
 *       }
 *       wait.until(ExpectedConditions.urlContains("linkedin.com/company/sauce-labs"));
 *       driver.close();                        // closes the new tab
 *       driver.switchTo().window(original);    // must switch back by hand
 *       assertEquals(baseUrl + "/inventory.html", driver.getCurrentUrl());
 *   }
 *
 * DIFFERENCE: In Playwright the new tab is simply another Page object; both tabs can be
 *   used at the same time and nothing is "switched". Selenium has one focus: you collect
 *   window handles, switchTo().window(...) the new one, and switch back afterwards;
 *   forgetting to switch back is a classic cause of NoSuchElementException. Stubbing the
 *   external site has no Selenium equivalent short of a proxy (BrowserMob) or Chromium-only
 *   DevTools commands.
 */
test('ADV-04: footer link opens a new tab', { tag: '@regression' }, async ({ page, context, inventoryPage }) => {
  const linkedInUrl = 'https://www.linkedin.com/company/sauce-labs/';

  await test.step('Answer requests to linkedin.com with a stub page', async () => {
    await context.route(/^https:\/\/www\.linkedin\.com\//, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>LinkedIn stub</title><h1>Stub</h1>' }),
    );
  });

  await test.step('Footer links point to the right places and open in a new tab', async () => {
    await inventoryPage.open();
    await expect(inventoryPage.footer.xLink).toHaveAttribute('href', 'https://x.com/saucelabs');
    await expect(inventoryPage.footer.facebookLink).toHaveAttribute('href', 'https://www.facebook.com/saucelabs');
    await expect(inventoryPage.footer.linkedInLink).toHaveAttribute('href', linkedInUrl);
    await expect(inventoryPage.footer.linkedInLink).toHaveAttribute('target', '_blank');
  });

  await test.step('Click LinkedIn and take hold of the new tab', async () => {
    const newTabPromise = page.waitForEvent('popup'); // first: say what we wait for
    await inventoryPage.footer.linkedInLink.click(); // then: the action that causes it
    const newTab = await newTabPromise;

    await expect(newTab).toHaveURL(linkedInUrl);
    await expect(newTab).toHaveTitle('LinkedIn stub');
    expect(context.pages()).toHaveLength(2);
    await newTab.close();
  });

  await test.step('The original tab is still on the Products page', async () => {
    await inventoryPage.expectLoaded();
  });
});
