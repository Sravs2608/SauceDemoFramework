/**
 * Role: shows browser contexts (plan section 6, "Browser contexts & isolation"). A
 * browser context is like a brand-new private browser window: its own cookies, its own
 * localStorage, its own login. One test can open several contexts in the SAME browser and
 * act as several users at the same time.
 *
 * Normally the `page` fixture creates one context per test for us. Here we create two by
 * hand, so two things the fixture did automatically become our job: passing baseURL, and
 * closing the contexts at the end. (Video and trace are also not recorded for contexts
 * made by hand.)
 */
import { test, expect } from '../../src/fixtures/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { InventoryPage } from '../../src/pages/InventoryPage';
import { users } from '../../src/data/users';
import { products } from '../../src/data/products';

/**
 * ADV-02: two users logged in at the same time in two contexts have separate sessions
 * and separate carts, and logging one out does not affect the other.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void adv02_twoUsersHaveSeparateSessionsAndCarts() {
 *       WebDriver driverA = new ChromeDriver();   // a second, complete browser process
 *       WebDriver driverB = new ChromeDriver();
 *       try {
 *           driverA.get(baseUrl);
 *           new LoginPage(driverA).login(Users.STANDARD);
 *           driverB.get(baseUrl);
 *           new LoginPage(driverB).login(Users.VISUAL);
 *           new InventoryPage(driverA).addToCart(Products.BACKPACK);
 *           new InventoryPage(driverA).addToCart(Products.BIKE_LIGHT);
 *           new InventoryPage(driverB).addToCart(Products.ONESIE);
 *           assertEquals("2", badgeText(driverA));
 *           assertEquals("1", badgeText(driverB));
 *           assertEquals("standard_user", driverA.manage().getCookieNamed("session-username").getValue());
 *           assertEquals("visual_user", driverB.manage().getCookieNamed("session-username").getValue());
 *       } finally {
 *           driverA.quit();
 *           driverB.quit();
 *       }
 *   }
 *
 * DIFFERENCE: A Playwright context is created in milliseconds inside one running browser.
 *   Selenium has no context concept: isolation means a second WebDriver, i.e. a second
 *   browser process (seconds to start, much more memory). Opening a new tab or window with
 *   driver.switchTo().newWindow(...) does NOT isolate anything: tabs of one driver share
 *   cookies and storage.
 */
test('ADV-02: two users in two browser contexts keep separate sessions and carts', { tag: '@regression' }, async ({
  browser,
  baseURL,
}) => {
  const loggedOut = { cookies: [], origins: [] };
  const contextA = await browser.newContext({ baseURL, storageState: loggedOut });
  const contextB = await browser.newContext({ baseURL, storageState: loggedOut });

  try {
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const inventoryA = new InventoryPage(pageA);
    const inventoryB = new InventoryPage(pageB);

    await test.step('User A (standard_user) and user B (visual_user) log in side by side', async () => {
      const loginA = new LoginPage(pageA);
      const loginB = new LoginPage(pageB);
      await loginA.open();
      await loginB.open();
      await loginA.login(users.standard);
      await loginB.login(users.visual);
      await inventoryA.expectLoaded();
      await inventoryB.expectLoaded();
    });

    await test.step('A adds two products, B adds one', async () => {
      await inventoryA.addToCart(products.backpack);
      await inventoryA.addToCart(products.bikeLight);
      await inventoryB.addToCart(products.onesie);
    });

    await test.step('Each user sees only their own cart and session', async () => {
      await inventoryA.header.expectCartCount(2);
      await inventoryB.header.expectCartCount(1);
      await expect(inventoryB.removeButton(products.backpack)).toHaveCount(0);

      const sessionA = (await contextA.cookies()).find((cookie) => cookie.name === 'session-username');
      const sessionB = (await contextB.cookies()).find((cookie) => cookie.name === 'session-username');
      expect(sessionA?.value).toBe(users.standard.username);
      expect(sessionB?.value).toBe(users.visual.username);
    });

    await test.step('A logs out; B is still logged in with the cart intact', async () => {
      await inventoryA.menu.logout();
      await new LoginPage(pageA).expectLoaded();

      await pageB.reload();
      await inventoryB.expectLoaded();
      await inventoryB.header.expectCartCount(1);
    });
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
