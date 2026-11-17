/**
 * Role: soft assertions (plan section 6, "Soft assertions"). A normal expect() stops the
 * test at the first failure. expect.soft() records the failure and lets the test carry
 * on, so ONE run reports EVERY wrong field on a screen. The test is still marked failed
 * at the end if any soft assertion failed.
 *
 * Use it for several independent facts on one screen (like the order summary below). Do
 * not use it for steps that later steps depend on: if login fails there is no point in
 * continuing.
 */
import { test, expect } from '../../src/fixtures/test';
import { products } from '../../src/data/products';
import { orderConfirmation, orderOverview, validCustomer } from '../../src/data/checkout';
import { calculateTax, formatUsd, roundToCents } from '../../src/utils/money';

/**
 * ADV-08: every field of the checkout overview is checked with soft assertions; the test
 * then stops before "Finish" if any of them failed, and otherwise completes the order.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void adv08_overviewFieldsCheckedTogether() {
 *       seedCart(List.of(Products.BACKPACK, Products.ONESIE));
 *       driver.get(baseUrl + "/checkout-step-one.html");
 *       checkoutInfoPage.fillCustomer(Customers.VALID);
 *       checkoutInfoPage.continueToOverview();
 *       wait.until(ExpectedConditions.urlContains("checkout-step-two"));
 *       // JUnit 5: assertAll runs every check and reports all failures together
 *       assertAll("order summary",
 *           () -> assertEquals("SauceCard #31337", text("[data-test='payment-info-value']")),
 *           () -> assertEquals("Free Pony Express Delivery!", text("[data-test='shipping-info-value']")),
 *           () -> assertEquals("Item total: $37.98", text("[data-test='subtotal-label']")),
 *           () -> assertEquals("Tax: $3.04", text("[data-test='tax-label']")),
 *           () -> assertEquals("Total: $41.02", text("[data-test='total-label']")));
 *       driver.findElement(By.cssSelector("[data-test='finish']")).click();
 *   }
 *   // TestNG: SoftAssert soft = new SoftAssert(); soft.assertEquals(...); ... soft.assertAll();
 *
 * DIFFERENCE: All three have the feature: expect.soft (Playwright), assertAll (JUnit 5),
 *   SoftAssert (TestNG, where forgetting the final assertAll() silently hides failures).
 *   Playwright's soft assertions still auto-wait and retry like normal ones, and each
 *   failure appears in the report with its own step and line.
 */
test('ADV-08: soft assertions report every wrong field of the order summary', { tag: '@regression' }, async ({
  seedCart,
  checkoutInfoPage,
  checkoutOverviewPage,
  checkoutCompletePage,
}) => {
  const chosen = [products.backpack, products.onesie];
  const itemTotal = roundToCents(chosen.reduce((sum, product) => sum + product.price, 0));
  const tax = calculateTax(itemTotal);
  const total = roundToCents(itemTotal + tax);

  await test.step('Go to the overview with two products', async () => {
    await seedCart(chosen);
    await checkoutInfoPage.open();
    await checkoutInfoPage.fillCustomer(validCustomer);
    await checkoutInfoPage.continueToOverview();
    await checkoutOverviewPage.expectLoaded(); // hard: nothing below makes sense otherwise
  });

  await test.step('Check every summary field (soft: all are checked even if one fails)', async () => {
    await expect.soft(checkoutOverviewPage.itemNames).toHaveText(chosen.map((product) => product.name));
    await expect.soft(checkoutOverviewPage.itemPrices).toHaveText(chosen.map((product) => formatUsd(product.price)));
    await expect.soft(checkoutOverviewPage.paymentInfo).toHaveText(orderOverview.paymentInfo);
    await expect.soft(checkoutOverviewPage.shippingInfo).toHaveText(orderOverview.shippingInfo);
    await expect.soft(checkoutOverviewPage.subtotalLabel).toHaveText(`Item total: ${formatUsd(itemTotal)}`);
    await expect.soft(checkoutOverviewPage.taxLabel).toHaveText(`Tax: ${formatUsd(tax)}`);
    await expect.soft(checkoutOverviewPage.totalLabel).toHaveText(`Total: ${formatUsd(total)}`);
  });

  await test.step('Do not place the order if any summary field was wrong', async () => {
    expect(test.info().errors).toHaveLength(0);
  });

  await test.step('Finish the order', async () => {
    await checkoutOverviewPage.finish();
    await checkoutCompletePage.expectLoaded();
    await expect(checkoutCompletePage.completeHeader).toHaveText(orderConfirmation.header);
  });
});
