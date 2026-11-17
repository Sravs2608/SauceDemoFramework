/**
 * Role: cart tests (plan section 5, CART-01 to CART-06): adding, removing, persistence
 * and Continue Shopping. These tests start logged in as standard_user through the saved
 * session, with an empty cart.
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

/**
 * CART-02: adding several products makes the badge count match, and the cart lists
 * exactly those products with their prices, in the order they were added.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void cart02_addMultipleItemsBadgeCountMatches() {
 *       driver.get(baseUrl + "/inventory.html");
 *       By badge = By.cssSelector("[data-test='shopping-cart-badge']");
 *       int added = 0;
 *       for (Product p : List.of(Products.BACKPACK, Products.BIKE_LIGHT, Products.RED_T_SHIRT)) {
 *           inventoryPage.addToCart(p);
 *           wait.until(ExpectedConditions.textToBe(badge, String.valueOf(++added)));
 *       }
 *       driver.findElement(By.cssSelector("[data-test='shopping-cart-link']")).click();
 *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/cart.html"));
 *       assertEquals(List.of("Sauce Labs Backpack", "Sauce Labs Bike Light",
 *           "Test.allTheThings() T-Shirt (Red)"),
 *           texts("[data-test='cart-list'] [data-test='inventory-item-name']"));
 *   }
 *
 * DIFFERENCE: The badge is re-checked after every click with a retrying assertion, so the
 *   test proves the count follows each action, without one explicit wait per step.
 */
test('CART-02: add multiple items, badge count matches', { tag: '@regression' }, async ({ inventoryPage, cartPage }) => {
  const chosen = [products.backpack, products.bikeLight, products.redTShirt];

  await test.step('Open the Products page with an empty cart', async () => {
    await inventoryPage.open();
    await inventoryPage.header.expectCartCount(0);
  });

  await test.step('Add three products; the badge counts up each time', async () => {
    let expectedCount = 0;
    for (const product of chosen) {
      await inventoryPage.addToCart(product);
      expectedCount += 1;
      await inventoryPage.header.expectCartCount(expectedCount);
    }
  });

  await test.step('Cart lists exactly those products and prices', async () => {
    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();
    await expect(cartPage.itemNames).toHaveText(chosen.map((product) => product.name));
    await expect(cartPage.itemPrices).toHaveText(chosen.map((product) => formatUsd(product.price)));
    await expect(cartPage.itemQuantities).toHaveText(chosen.map(() => '1'));
  });
});

/**
 * CART-03: removing a product on the Products page lowers the badge, turns the button
 * back into "Add to cart" and leaves the other product in the cart.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void cart03_removeFromInventoryPageUpdatesBadge() {
 *       driver.get(baseUrl + "/inventory.html");
 *       inventoryPage.addToCart(Products.BACKPACK);
 *       inventoryPage.addToCart(Products.BIKE_LIGHT);
 *       By badge = By.cssSelector("[data-test='shopping-cart-badge']");
 *       wait.until(ExpectedConditions.textToBe(badge, "2"));
 *       inventoryPage.removeFromCart(Products.BACKPACK);
 *       wait.until(ExpectedConditions.textToBe(badge, "1"));
 *       assertEquals("Add to cart", driver.findElement(
 *           By.cssSelector("[data-test='add-to-cart-sauce-labs-backpack']")).getText());
 *       assertTrue(driver.findElements(
 *           By.cssSelector("[data-test='remove-sauce-labs-backpack']")).isEmpty());
 *   }
 *
 * DIFFERENCE: toHaveCount(0) waits for the Remove button to disappear. Selenium's
 *   findElements(...).isEmpty() answers immediately and, with an implicit wait set, first
 *   blocks for the whole implicit-wait time when the element is (correctly) absent.
 */
test('CART-03: remove from inventory page updates badge', { tag: '@regression' }, async ({ inventoryPage, cartPage }) => {
  const removed = products.backpack;
  const kept = products.bikeLight;

  await test.step('Add two products', async () => {
    await inventoryPage.open();
    await inventoryPage.addToCart(removed);
    await inventoryPage.addToCart(kept);
    await inventoryPage.header.expectCartCount(2);
  });

  await test.step(`Remove "${removed.name}" on the Products page`, async () => {
    await inventoryPage.removeFromCart(removed);
  });

  await test.step('Badge shows 1 and the button is "Add to cart" again', async () => {
    await inventoryPage.header.expectCartCount(1);
    await expect(inventoryPage.addToCartButton(removed)).toHaveText('Add to cart');
    await expect(inventoryPage.removeButton(removed)).toHaveCount(0);
    await expect(inventoryPage.removeButton(kept)).toBeVisible();
  });

  await test.step('Cart contains only the product that was kept', async () => {
    await inventoryPage.header.openCart();
    await expect(cartPage.itemNames).toHaveText([kept.name]);
  });
});

/**
 * CART-04: removing a product on the cart page takes it out of the list and lowers the
 * badge. The cart is prepared with seedCart (no clicking), because adding is not what
 * this test is about.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void cart04_removeFromCartPage() {
 *       seedCart(List.of(Products.BACKPACK, Products.ONESIE));   // JavascriptExecutor + localStorage
 *       driver.get(baseUrl + "/cart.html");
 *       wait.until(ExpectedConditions.elementToBeClickable(
 *           By.cssSelector("[data-test='remove-sauce-labs-backpack']"))).click();
 *       By names = By.cssSelector("[data-test='cart-list'] [data-test='inventory-item-name']");
 *       wait.until(ExpectedConditions.numberOfElementsToBe(names, 1));
 *       assertEquals("Sauce Labs Onesie", driver.findElement(names).getText());
 *       assertEquals("1", driver.findElement(By.cssSelector("[data-test='shopping-cart-badge']")).getText());
 *   }
 *
 * DIFFERENCE: seedCart is a fixture the test asks for by name; in Selenium it is a helper
 *   inherited from BaseTest. Both write the same localStorage entry.
 */
test('CART-04: remove from cart page', { tag: '@regression' }, async ({ seedCart, cartPage }) => {
  const removed = products.backpack;
  const kept = products.onesie;

  await test.step('Start with two products in the cart', async () => {
    await seedCart([removed, kept]);
    await cartPage.open();
    await expect(cartPage.itemNames).toHaveText([removed.name, kept.name]);
    await cartPage.header.expectCartCount(2);
  });

  await test.step(`Remove "${removed.name}" in the cart`, async () => {
    await cartPage.removeItem(removed);
  });

  await test.step('Only the other product remains and the badge shows 1', async () => {
    await expect(cartPage.itemNames).toHaveText([kept.name]);
    await cartPage.header.expectCartCount(1);
  });
});

/**
 * CART-05: the cart survives moving between pages and reloading the browser tab.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void cart05_cartPersistsAcrossNavigationAndReload() {
 *       driver.get(baseUrl + "/inventory.html");
 *       inventoryPage.addToCart(Products.BACKPACK);
 *       inventoryPage.addToCart(Products.BOLT_T_SHIRT);
 *       driver.navigate().refresh();
 *       By badge = By.cssSelector("[data-test='shopping-cart-badge']");
 *       wait.until(ExpectedConditions.textToBe(badge, "2"));
 *       driver.findElement(By.cssSelector("[data-test='shopping-cart-link']")).click();
 *       driver.navigate().refresh();
 *       wait.until(ExpectedConditions.numberOfElementsToBe(
 *           By.cssSelector("[data-test='cart-list'] [data-test='inventory-item']"), 2));
 *   }
 *
 * DIFFERENCE: page.reload() equals driver.navigate().refresh(). After a refresh every
 *   WebElement found earlier is stale in Selenium and must be located again; Playwright
 *   locators are simply used again.
 */
test('CART-05: cart persists across navigation and reload', { tag: '@regression' }, async ({
  page,
  inventoryPage,
  productDetailPage,
  cartPage,
}) => {
  const chosen = [products.backpack, products.boltTShirt];

  await test.step('Add two products', async () => {
    await inventoryPage.open();
    for (const product of chosen) {
      await inventoryPage.addToCart(product);
    }
    await inventoryPage.header.expectCartCount(2);
  });

  await test.step('Reload the Products page: badge and Remove buttons are still there', async () => {
    await page.reload();
    await inventoryPage.header.expectCartCount(2);
    for (const product of chosen) {
      await expect(inventoryPage.removeButton(product)).toBeVisible();
    }
  });

  await test.step('Visit a product detail page and come back: cart unchanged', async () => {
    await inventoryPage.openProductDetail(products.onesie);
    await productDetailPage.header.expectCartCount(2);
    await productDetailPage.backToProducts();
    await inventoryPage.header.expectCartCount(2);
  });

  await test.step('Open the cart and reload it: both products are still listed', async () => {
    await inventoryPage.header.openCart();
    await page.reload();
    await cartPage.expectLoaded();
    await expect(cartPage.itemNames).toHaveText(chosen.map((product) => product.name));
    await cartPage.header.expectCartCount(2);
  });
});

/**
 * CART-06: "Continue Shopping" goes back to the Products page and the cart is untouched.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void cart06_continueShoppingKeepsCart() {
 *       seedCart(List.of(Products.BIKE_LIGHT));
 *       driver.get(baseUrl + "/cart.html");
 *       wait.until(ExpectedConditions.elementToBeClickable(
 *           By.cssSelector("[data-test='continue-shopping']"))).click();
 *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
 *       assertEquals("1", driver.findElement(By.cssSelector("[data-test='shopping-cart-badge']")).getText());
 *       assertTrue(driver.findElement(
 *           By.cssSelector("[data-test='remove-sauce-labs-bike-light']")).isDisplayed());
 *   }
 *
 * DIFFERENCE: Same flow; the Playwright version has no explicit waits.
 */
test('CART-06: Continue Shopping returns to inventory, cart intact', { tag: '@regression' }, async ({
  seedCart,
  cartPage,
  inventoryPage,
}) => {
  const product = products.bikeLight;

  await test.step('Start on the cart page with one product', async () => {
    await seedCart([product]);
    await cartPage.open();
    await expect(cartPage.itemNames).toHaveText([product.name]);
  });

  await test.step('Click Continue Shopping', async () => {
    await cartPage.continueShopping();
  });

  await test.step('Products page is shown and the product is still in the cart', async () => {
    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(1);
    await expect(inventoryPage.removeButton(product)).toBeVisible();
  });
});
