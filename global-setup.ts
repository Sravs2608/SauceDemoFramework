/**
 * Role: runs ONCE before the whole test run. It logs in as standard_user through the real
 * login page and saves the resulting browser state (cookies + localStorage) to
 * .auth/standard-user.json. playwright.config.ts then loads that file into every test
 * (`storageState`), so tests start already logged in and do not repeat the login steps.
 * Tests that must start logged out (the login tests) switch this off with test.use().
 *
 * What we verified on the live site (2026-11-16): logging in sets one cookie,
 * `session-username=<username>`, and that cookie is what keeps you logged in. The site
 * gives it a lifetime of only 10 minutes. A long regression run could outlive it, so after
 * saving we turn it into a session cookie (no expiry date) inside the saved file. Verified:
 * the site accepts the cookie without an expiry. Not timed: a run longer than 10 minutes.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   Selenium has no storageState. The usual workaround is cookie injection: log in once,
 *   keep the cookies, and add them to each new driver before opening a protected page.
 *
 *   // once, e.g. in @BeforeSuite (TestNG) or @BeforeAll (JUnit 5)
 *   WebDriver driver = new ChromeDriver();
 *   driver.get(baseUrl);
 *   new LoginPage(driver).login(standardUser);
 *   new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.urlContains("inventory"));
 *   Set<Cookie> savedCookies = driver.manage().getCookies();
 *   driver.quit();
 *
 *   // in every test's setup
 *   driver.get(baseUrl);                      // must be on the domain before adding cookies
 *   for (Cookie c : savedCookies) {
 *       driver.manage().addCookie(new Cookie(c.getName(), c.getValue(), c.getPath()));
 *   }
 *   driver.get(baseUrl + "/inventory.html");
 *
 * DIFFERENCE: storageState saves cookies AND localStorage in one call and Playwright
 *   applies it before the first page loads. With Selenium you must first open a page on
 *   the same domain, add each cookie by hand, and copy localStorage separately with
 *   JavascriptExecutor; sharing the cookies between parallel threads is also your job.
 *   Note: settings under `use` in the config (baseURL, testIdAttribute) apply to tests,
 *   not to this file, which is why both are set explicitly below.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium, selectors } from '@playwright/test';
import { LoginPage } from './src/pages/LoginPage';
import { InventoryPage } from './src/pages/InventoryPage';
import { users } from './src/data/users';
import { env, STORAGE_STATE } from './src/utils/env';

export default async function globalSetup(): Promise<void> {
  selectors.setTestIdAttribute('data-test');

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL: env.baseUrl });
    const page = await context.newPage();

    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(users.standard);
    // Do not save anything until the login has really succeeded.
    await new InventoryPage(page).expectLoaded();

    const state = await context.storageState();
    for (const cookie of state.cookies) {
      if (cookie.name === 'session-username') {
        cookie.expires = -1; // -1 = session cookie: no expiry date
      }
    }

    fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
    fs.writeFileSync(STORAGE_STATE, JSON.stringify(state, null, 2));
  } finally {
    await browser.close();
  }
}
