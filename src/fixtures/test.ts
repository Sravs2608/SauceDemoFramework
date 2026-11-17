/**
 * Role: our own version of Playwright's `test`, extended with ready-made page objects and
 * two helpers (seedCart, loginAs). Spec files import `test` and `expect` from HERE, not
 * from '@playwright/test'. A test then simply asks for what it needs by name:
 *
 *     test('...', async ({ inventoryPage, cartPage }) => { ... });
 *
 * and Playwright creates those objects for that test only. Nothing is created that the
 * test did not ask for, and nothing is shared between tests.
 */
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import type { Product } from '../data/products';
import type { User } from '../data/users';

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  seedCart: (items: Product[]) => Promise<void>;
  loginAs: (user: User) => Promise<void>;
};

/** How long we allow a login to take. performance_glitch_user needs about 5 seconds. */
const LOGIN_TIMEOUT_MS = 15_000;

/**
 * Registers one fixture per page object. Each fixture receives the built-in `page`
 * fixture (a fresh browser tab in a fresh, isolated browser context for every test),
 * wraps it in a page object and hands it to the test through `use(...)`.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   public abstract class BaseTest {
 *       protected WebDriver driver;
 *       protected LoginPage loginPage;
 *       protected InventoryPage inventoryPage;
 *       protected CartPage cartPage;
 *
 *       @BeforeEach
 *       void setUp() {
 *           driver = new ChromeDriver();
 *           loginPage = new LoginPage(driver);
 *           inventoryPage = new InventoryPage(driver);
 *           cartPage = new CartPage(driver);
 *       }
 *
 *       @AfterEach
 *       void tearDown() {
 *           driver.quit();
 *       }
 *   }
 *   // every test class: class CartTest extends BaseTest { ... }
 *
 * DIFFERENCE: Selenium has no fixtures. The usual workaround is a BaseTest class with
 *   @BeforeEach/@AfterEach (JUnit 5) or @BeforeMethod/@AfterMethod (TestNG) that every test
 *   class extends; it builds everything for every test whether needed or not, and parallel
 *   runs need a ThreadLocal<WebDriver>. Playwright fixtures are created on demand, per
 *   test, with setup and teardown in one place, and the browser/context/page lifecycle
 *   (including closing it) is handled by the built-in `page` fixture.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutInfoPage: async ({ page }, use) => {
    await use(new CheckoutInfoPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },

  /**
   * seedCart(items): puts products into the cart WITHOUT clicking through the UI, then
   * leaves the browser on the Products page. SauceDemo keeps the cart in the browser's
   * localStorage under "cart-contents" as a list of product ids (verified, e.g. [4,0]),
   * so we write that list directly and reload. Use it when the cart is only the starting
   * point of a test (checkout tests); tests ABOUT adding to the cart still use the buttons.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   void seedCart(List<Product> items) {
   *       driver.get(baseUrl + "/inventory.html");
   *       String ids = items.stream().map(p -> String.valueOf(p.getId()))
   *           .collect(Collectors.joining(",", "[", "]"));
   *       ((JavascriptExecutor) driver).executeScript(
   *           "window.localStorage.setItem('cart-contents', arguments[0]);", ids);
   *       driver.navigate().refresh();
   *   }
   *
   * DIFFERENCE: page.evaluate() runs JavaScript in the page and passes arguments as real
   *   values; Selenium does the same through JavascriptExecutor with arguments[0]. The
   *   difference is in packaging: here it is a fixture any test can ask for by name, in
   *   Selenium it is a helper method on BaseTest or a utility class.
   */
  seedCart: async ({ page }, use) => {
    await use(async (items: Product[]) => {
      const ids = items.map((item) => item.id);
      await page.goto('/inventory.html');
      await page.evaluate((cartIds) => {
        window.localStorage.setItem('cart-contents', JSON.stringify(cartIds));
      }, ids);
      await page.reload();
    });
  },

  /**
   * loginAs(user): logs in through the login page and waits until the Products page is
   * shown. For tests that need a user other than the saved standard_user session. The
   * wait is longer than the default 5 seconds because performance_glitch_user's login
   * takes about 5 seconds (measured 5.2 s on 2026-11-16).
   *
   * SELENIUM JAVA EQUIVALENT:
   *   void loginAs(User user) {
   *       driver.manage().deleteAllCookies();
   *       driver.get(baseUrl);
   *       loginPage.login(user);
   *       new WebDriverWait(driver, Duration.ofSeconds(15))
   *           .until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
   *   }
   *
   * DIFFERENCE: The same steps. In Playwright the longer limit is given to one assertion
   *   ({ timeout }), and it returns the moment the page is ready; nothing sleeps. Selenium's
   *   WebDriverWait behaves the same way; the anti-pattern in both tools is Thread.sleep /
   *   waitForTimeout, which always waits the full time.
   */
  loginAs: async ({ page, loginPage, inventoryPage }, use) => {
    await use(async (user: User) => {
      await loginPage.open();
      await loginPage.login(user);
      await expect(page).toHaveURL('/inventory.html', { timeout: LOGIN_TIMEOUT_MS });
      await inventoryPage.expectLoaded();
    });
  },
});

export { expect } from '@playwright/test';
