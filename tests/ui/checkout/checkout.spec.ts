/**
 * Role: checkout tests (plan section 5, CHK-xx). Phase 1 holds the smoke case CHK-01, the
 * end-to-end purchase; the remaining CHK cases are added in Phase 2. These tests start
 * logged in as standard_user through the saved session, with an empty cart.
 */
import { test, expect } from '../../../src/fixtures/test';
import { products } from '../../../src/data/products';
import { orderConfirmation, validCustomer } from '../../../src/data/checkout';
import { calculateTax, formatUsd, roundToCents } from '../../../src/utils/money';

/**
 * CHK-01: buy one product end to end and check the money (item total, tax, grand total)
 * and the order confirmation.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("smoke")
 *   void chk01_endToEndPurchaseOfOneItem() {
 *       injectSessionCookie();                       // see global-setup.ts notes
 *       driver.get(baseUrl + "/inventory.html");
 *       WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
 *       wait.until(ExpectedConditions.elementToBeClickable(
 *           By.cssSelector("[data-test='add-to-cart-sauce-labs-backpack']"))).click();
 *       driver.findElement(By.cssSelector("[data-test='shopping-cart-link']")).click();
 *       wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-test='checkout']"))).click();
 *       wait.until(ExpectedConditions.visibilityOfElementLocated(
 *           By.cssSelector("[data-test='firstName']"))).sendKeys("Test");
 *       driver.findElement(By.cssSelector("[data-test='lastName']")).sendKeys("User");
 *       driver.findElement(By.cssSelector("[data-test='postalCode']")).sendKeys("12345");
 *       driver.findElement(By.cssSelector("[data-test='continue']")).click();
 *       wait.until(ExpectedConditions.urlContains("checkout-step-two"));
 *       assertEquals("Item total: $29.99", text("[data-test='subtotal-label']"));
 *       assertEquals("Tax: $2.40", text("[data-test='tax-label']"));
 *       assertEquals("Total: $32.39", text("[data-test='total-label']"));
 *       driver.findElement(By.cssSelector("[data-test='finish']")).click();
 *       wait.until(ExpectedConditions.urlContains("checkout-complete"));
 *       assertEquals("Thank you for your order!", text("[data-test='complete-header']"));
 *       assertTrue(driver.findElements(By.cssSelector("[data-test='shopping-cart-badge']")).isEmpty());
 *   }
 *   // text(css) = driver.findElement(By.cssSelector(css)).getText()
 *
 * DIFFERENCE: Every click and fill in the Playwright version waits for its element, so
 *   the flow across five pages contains no explicit wait at all. Each test.step becomes a
 *   collapsible step in the HTML report and trace; Selenium needs Allure (@Step or
 *   Allure.step) for that. If this test fails in CI, the trace shows a screenshot, DOM
 *   snapshot and network log for every step; Selenium has no trace viewer, only the
 *   screenshots and logs you add yourself.
 */
test('CHK-01: end-to-end purchase of one item, confirmation shown', { tag: '@smoke' }, async ({
  inventoryPage,
  cartPage,
  checkoutInfoPage,
  checkoutOverviewPage,
  checkoutCompletePage,
}) => {
  const product = products.backpack;
  // Expected money is calculated from the product price, not copied from the page.
  const itemTotal = product.price;
  const tax = calculateTax(itemTotal);
  const total = roundToCents(itemTotal + tax);

  await test.step(`Add "${product.name}" to the cart`, async () => {
    await inventoryPage.open();
    await inventoryPage.addToCart(product);
    await inventoryPage.header.expectCartCount(1);
  });

  await test.step('Open the cart and start checkout', async () => {
    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();
    await expect(cartPage.itemNames).toHaveText([product.name]);
    await cartPage.checkout();
  });

  await test.step('Enter customer information', async () => {
    await checkoutInfoPage.expectLoaded();
    await checkoutInfoPage.fillCustomer(validCustomer);
    await checkoutInfoPage.continueToOverview();
  });

  await test.step('Overview shows the product and the correct totals', async () => {
    await checkoutOverviewPage.expectLoaded();
    await expect(checkoutOverviewPage.itemNames).toHaveText([product.name]);
    await expect(checkoutOverviewPage.subtotalLabel).toHaveText(`Item total: ${formatUsd(itemTotal)}`);
    await expect(checkoutOverviewPage.taxLabel).toHaveText(`Tax: ${formatUsd(tax)}`);
    await expect(checkoutOverviewPage.totalLabel).toHaveText(`Total: ${formatUsd(total)}`);
  });

  await test.step('Finish the order', async () => {
    await checkoutOverviewPage.finish();
  });

  await test.step('Order confirmation is shown and the cart is empty', async () => {
    await checkoutCompletePage.expectLoaded();
    await expect(checkoutCompletePage.completeHeader).toHaveText(orderConfirmation.header);
    await expect(checkoutCompletePage.completeText).toHaveText(orderConfirmation.text);
    await checkoutCompletePage.header.expectCartCount(0);
  });
});
