/**
 * Role: cart tests (plan section 5, CART-xx). Phase 1 holds the smoke case CART-01; the
 * remaining CART cases are added in Phase 2. These tests start logged in as standard_user
 * through the saved session, with an empty cart.
 */
import { test, expect } from '../../../src/fixtures/test';
import { products } from '../../../src/data/products';
import { formatUsd } from '../../../src/utils/money';

/**
 * CART-01: adding one product shows 1 on the cart badge, and the cart really contains
 * that product with the right price and quantity.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("smoke")
 *   void cart01_addOneItemBadgeShowsOne() {
 *       injectSessionCookie();                       // see global-setup.ts notes
 *       driver.get(baseUrl + "/inventory.html");
 *       WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
 *       By badge = By.cssSelector("[data-test='shopping-cart-badge']");
 *       assertTrue(driver.findElements(badge).isEmpty());
 *       wait.until(ExpectedConditions.elementToBeClickable(
 *           By.cssSelector("[data-test='add-to-cart-sauce-labs-backpack']"))).click();
 *       wait.until(ExpectedConditions.textToBe(badge, "1"));
 *       assertEquals("Remove", driver.findElement(
 *           By.cssSelector("[data-test='remove-sauce-labs-backpack']")).getText());
 *       driver.findElement(By.cssSelector("[data-test='shopping-cart-link']")).click();
 *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/cart.html"));
 *       assertEquals("Sauce Labs Backpack", driver.findElement(
 *           By.cssSelector("[data-test='cart-list'] [data-test='inventory-item-name']")).getText());
 *       assertEquals("$29.99", driver.findElement(
 *           By.cssSelector("[data-test='cart-list'] [data-test='inventory-item-price']")).getText());
 *       assertEquals("1", driver.findElement(By.cssSelector("[data-test='item-quantity']")).getText());
 *   }
 *
 * DIFFERENCE: The Playwright test starts on the Products page already logged in and with
 *   an empty cart, because each test gets a new browser context loaded from storageState.
 *   toHaveText on a list locator (itemNames) checks "exactly these items, in this order"
 *   in one retrying assertion; Selenium needs findElements, a stream().map(getText) and
 *   an explicit wait before it.
 */
test('CART-01: add one item, badge shows 1', { tag: '@smoke' }, async ({ inventoryPage, cartPage }) => {
  const product = products.backpack;

  await test.step('Open the Products page with an empty cart', async () => {
    await inventoryPage.open();
    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(0);
  });

  await test.step(`Add "${product.name}" to the cart`, async () => {
    await inventoryPage.addToCart(product);
  });

  await test.step('Cart badge shows 1 and the button changes to Remove', async () => {
    await inventoryPage.header.expectCartCount(1);
    await expect(inventoryPage.removeButton(product)).toHaveText('Remove');
    await expect(inventoryPage.addToCartButton(product)).toHaveCount(0);
  });

  await test.step('Cart page lists exactly that product, quantity 1', async () => {
    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();
    await expect(cartPage.itemNames).toHaveText([product.name]);
    await expect(cartPage.itemPrices).toHaveText([formatUsd(product.price)]);
    await expect(cartPage.itemQuantities).toHaveText(['1']);
  });
});
