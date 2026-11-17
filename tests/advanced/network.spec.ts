/**
 * Role: network control (plan NET-01 and section 6 "HAR record/replay"). Playwright sits
 * between the browser and the internet, so a test can block, change or replace any
 * request the page makes. Here: block all pictures, and record a page's traffic to a file
 * and replay it with the network switched off.
 *
 * Seen on the live site on 2026-11-16: the Products page requests 6 product pictures
 * (/assets/*.jpg) plus scripts, styles and fonts; SauceDemo has no data API of its own.
 */
import { test, expect } from '../../src/fixtures/test';
import { allProducts, products, PRODUCT_COUNT } from '../../src/data/products';

/**
 * NET-01: with every picture blocked, the Products page still lists all products and
 * shopping still works. (A real use: faster runs, or proving a page survives a broken
 * image server.)
 *
 * SELENIUM JAVA EQUIVALENT:
 *   // Selenium core cannot intercept requests. Chromium-only workaround with the
 *   // DevTools Protocol:
 *   @Test @Tag("regression")
 *   void net01_pageWorksWithImagesBlocked() {
 *       ChromeDriver chrome = (ChromeDriver) driver;
 *       chrome.executeCdpCommand("Network.enable", Map.of());
 *       chrome.executeCdpCommand("Network.setBlockedURLs",
 *           Map.of("urls", List.of("*.jpg", "*.jpeg", "*.png", "*.gif", "*.webp")));
 *       driver.get(baseUrl + "/inventory.html");
 *       assertEquals(6, driver.findElements(By.cssSelector("[data-test='inventory-item']")).size());
 *       Long width = (Long) ((JavascriptExecutor) driver).executeScript(
 *           "return document.querySelector(\"[data-test='inventory-item'] img\").naturalWidth;");
 *       assertEquals(0L, width);
 *       inventoryPage.addToCart(Products.BACKPACK);
 *       wait.until(ExpectedConditions.textToBe(By.cssSelector("[data-test='shopping-cart-badge']"), "1"));
 *   }
 *
 * DIFFERENCE: page.route() works the same in Chromium, Firefox and WebKit and can decide
 *   per request with any logic (here: by resource type, not by file extension). Selenium
 *   needs Chrome DevTools commands (Chromium only), Selenium 4's NetworkInterceptor (also
 *   Chromium), or an external proxy such as BrowserMob for other browsers.
 */
test('NET-01: block images via network mocking; page still functional', { tag: '@regression' }, async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  let blockedImages = 0;

  await test.step('Block every image request', async () => {
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'image') {
        blockedImages += 1;
        await route.abort();
      } else {
        await route.continue();
      }
    });
  });

  await test.step('Products page still lists every product', async () => {
    await inventoryPage.open();
    await inventoryPage.expectLoaded();
    await expect(inventoryPage.itemNames).toHaveText(allProducts.map((product) => product.name));
  });

  await test.step('The pictures really were blocked', async () => {
    const widths = await inventoryPage.itemImages.evaluateAll((images) =>
      images.map((img) => (img as HTMLImageElement).naturalWidth),
    );
    expect(widths).toEqual(allProducts.map(() => 0));
    expect(blockedImages).toBeGreaterThanOrEqual(PRODUCT_COUNT);
  });

  await test.step('Shopping still works', async () => {
    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.header.expectCartCount(1);
    await inventoryPage.header.openCart();
    await expect(cartPage.itemNames).toHaveText([products.backpack.name]);
  });
});

/**
 * Groups the HAR test, which records the LOGIN page and therefore starts logged out.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   class HarReplayTest extends BaseTest {
 *       @BeforeEach
 *       void startLoggedOut() {
 *           driver.manage().deleteAllCookies();
 *       }
 *   }
 *
 * DIFFERENCE: test.use sets storageState for this group only; a fresh Selenium driver is
 *   logged out by default.
 */
test.describe('HAR record and replay', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * ADV-05: record the login page's network traffic into a HAR file, then load the page
   * again in a browser context that is OFFLINE, served entirely from that file.
   * A HAR ("HTTP Archive") is a standard JSON recording of requests and responses.
   * The file is written to this test's output folder and is not committed.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   // No built-in equivalent. Usual workaround: BrowserMob Proxy records a HAR ...
   *   BrowserMobProxy proxy = new BrowserMobProxyServer();
   *   proxy.start(0);
   *   ChromeOptions options = new ChromeOptions();
   *   options.setProxy(ClientUtil.createSeleniumProxy(proxy));
   *   options.setAcceptInsecureCerts(true);
   *   WebDriver driver = new ChromeDriver(options);
   *   proxy.newHar("login");
   *   driver.get(baseUrl);
   *   proxy.getHar().writeTo(new File("target/login.har"));
   *   // ... but REPLAYING it needs a separate mock server (for example WireMock) set up
   *   // with the recorded responses, and the application pointed at that server.
   *
   * DIFFERENCE: routeFromHAR does both halves in one line each: { update: true } records,
   *   and without it the same call replays; { notFound: 'abort' } blocks anything that was
   *   not recorded. With Selenium, recording needs a proxy, and replay needs a mock server.
   *   Typical real use: record the API answers of a slow or unstable backend once, then run
   *   UI tests against the recording.
   */
  test('ADV-05: record a HAR, then replay the page with the network offline', { tag: '@regression' }, async ({
    browser,
    baseURL,
  }, testInfo) => {
    const harPath = testInfo.outputPath('login-page.har');

    await test.step('Record: open the login page with HAR recording on', async () => {
      const recording = await browser.newContext({ baseURL });
      await recording.routeFromHAR(harPath, { update: true });
      const page = await recording.newPage();
      await page.goto('/');
      await expect(page.getByTestId('login-button')).toBeVisible();
      await recording.close(); // the HAR file is written when the context closes
    });

    await test.step('Replay: an offline browser shows the same page from the HAR file', async () => {
      const replay = await browser.newContext({ baseURL, offline: true });
      try {
        await replay.routeFromHAR(harPath, { notFound: 'abort' });
        const page = await replay.newPage();
        await page.goto('/');
        await expect(page.getByTestId('login-button')).toBeVisible();
        await expect(page.getByTestId('username')).toHaveAttribute('placeholder', 'Username');
      } finally {
        await replay.close();
      }
    });
  });
});
