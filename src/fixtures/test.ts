/**
 * Role: our own version of Playwright's `test`, extended with ready-made page objects.
 * Spec files import `test` and `expect` from HERE, not from '@playwright/test'. A test then
 * simply asks for what it needs by name:
 *
 *     test('...', async ({ inventoryPage, cartPage }) => { ... });
 *
 * and Playwright creates those objects for that test only. Nothing is created that the
 * test did not ask for, and nothing is shared between tests.
 */
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';

type PageObjects = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
};

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
export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
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
});

export { expect } from '@playwright/test';
