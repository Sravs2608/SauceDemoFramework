/**
 * Role: application-state tests (plan section 5, APP-01): the "Reset App State" menu
 * item. Starts logged in as standard_user through the saved session.
 */
import { test, expect } from '../../../src/fixtures/test';
import { products } from '../../../src/data/products';

/**
 * APP-01: Reset App State empties the cart: the badge disappears, nothing is left in the
 * browser's storage, and the cart page is empty.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void app01_resetAppStateClearsCart() {
 *       driver.get(baseUrl + "/inventory.html");
 *       inventoryPage.addToCart(Products.BACKPACK);
 *       inventoryPage.addToCart(Products.BIKE_LIGHT);
 *       wait.until(ExpectedConditions.elementToBeClickable(By.id("react-burger-menu-btn"))).click();
 *       wait.until(ExpectedConditions.elementToBeClickable(
 *           By.cssSelector("[data-test='reset-sidebar-link']"))).click();
 *       By badge = By.cssSelector("[data-test='shopping-cart-badge']");
 *       wait.until(ExpectedConditions.numberOfElementsToBe(badge, 0));
 *       assertNull(((JavascriptExecutor) driver)
 *           .executeScript("return window.localStorage.getItem('cart-contents');"));
 *       driver.get(baseUrl + "/cart.html");
 *       assertTrue(driver.findElements(
 *           By.cssSelector("[data-test='cart-list'] [data-test='inventory-item']")).isEmpty());
 *   }
 *
 * DIFFERENCE: Same flow. The menu animation needs no extra handling in Playwright (it
 *   waits for the link to stop moving); in Selenium this menu is a classic source of
 *   ElementClickInterceptedException.
 */
test('APP-01: Reset App State clears cart', { tag: '@regression' }, async ({ page, inventoryPage, cartPage }) => {
  await test.step('Add two products', async () => {
    await inventoryPage.open();
    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.addToCart(products.bikeLight);
    await inventoryPage.header.expectCartCount(2);
  });

  await test.step('Choose Reset App State in the menu', async () => {
    await inventoryPage.menu.resetAppState();
  });

  await test.step('Cart badge is gone and nothing is stored in the browser', async () => {
    await inventoryPage.header.expectCartCount(0);
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('cart-contents')), {
        message: 'cart-contents should be removed from localStorage',
      })
      .toBeNull();
  });

  await test.step('Cart page is empty', async () => {
    await cartPage.open();
    await cartPage.expectLoaded();
    await expect(cartPage.items).toHaveCount(0);
  });
});

/**
 * APP-01 (button state): after Reset App State the product buttons should go back to
 * "Add to cart", because the cart is empty.
 *
 * KNOWN DEFECT DEF-02 (observed on the live site, 2026-11-16): the cart is emptied, but
 * products that were in it still show "Remove" until the page is reloaded. The test is
 * marked test.fail (expected to fail while the defect exists).
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test(groups = "regression", expectedExceptions = {AssertionError.class, TimeoutException.class},
 *         description = "DEF-02: Remove buttons stay after Reset App State")          // TestNG
 *   public void app01_resetAppStateRestoresAddToCartButtons() {
 *       driver.get(baseUrl + "/inventory.html");
 *       inventoryPage.addToCart(Products.BACKPACK);
 *       menu.resetAppState();
 *       wait.until(ExpectedConditions.numberOfElementsToBe(
 *           By.cssSelector("[data-test='remove-sauce-labs-backpack']"), 0));
 *       Assert.assertTrue(driver.findElement(
 *           By.cssSelector("[data-test='add-to-cart-sauce-labs-backpack']")).isDisplayed());
 *   }
 *
 * DIFFERENCE: test.fail is built in and reports "passed unexpectedly" when the defect is
 *   fixed. JUnit 5 offers only @Disabled (the test is skipped); TestNG's
 *   expectedExceptions is the nearest equivalent.
 */
test.fail('APP-01: Reset App State restores the "Add to cart" buttons', {
  tag: '@regression',
  annotation: { type: 'defect', description: 'DEF-02: buttons still show "Remove" after Reset App State until the page is reloaded' },
}, async ({ inventoryPage }) => {
  const product = products.backpack;

  await test.step('Add a product, then reset the app state', async () => {
    await inventoryPage.open();
    await inventoryPage.addToCart(product);
    await expect(inventoryPage.removeButton(product)).toBeVisible();
    await inventoryPage.menu.resetAppState();
    await inventoryPage.header.expectCartCount(0);
  });

  await test.step('Expected: the product button says "Add to cart" again', async () => {
    // Fails today: the button still says "Remove" (DEF-02).
    await expect(inventoryPage.removeButton(product)).toHaveCount(0);
    await expect(inventoryPage.addToCartButton(product)).toBeVisible();
  });
});
