/**
 * Role: checkout tests (plan section 5, CHK-01 to CHK-09): the end-to-end purchase,
 * totals, required fields, Cancel buttons, the empty cart after an order, and checkout
 * with an empty cart (a known defect). These tests start logged in as standard_user
 * through the saved session, with an empty cart.
 */
import { test, expect } from '../../../src/fixtures/test';
import { allProducts, products } from '../../../src/data/products';
import { orderConfirmation, validCustomer } from '../../../src/data/checkout';
import { checkoutErrors } from '../../../src/data/messages';
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

/**
 * CHK-02: with all six products in the cart, the overview lists every product and price,
 * and item total, tax (8%) and grand total equal what we calculate from the prices.
 * Verified on the live site: Item total $129.94, Tax $10.40, Total $140.34.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void chk02_multipleItemsTotalsAreCorrect() {
 *       seedCart(Products.ALL);
 *       driver.get(baseUrl + "/cart.html");
 *       cartPage.checkout();
 *       checkoutInfoPage.fillCustomer(Customers.VALID);
 *       checkoutInfoPage.continueToOverview();
 *       wait.until(ExpectedConditions.urlContains("checkout-step-two"));
 *       BigDecimal itemTotal = Products.ALL.stream().map(Product::getPrice)
 *           .reduce(BigDecimal.ZERO, BigDecimal::add);
 *       BigDecimal tax = itemTotal.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
 *       assertEquals("Item total: $" + itemTotal, text("[data-test='subtotal-label']"));
 *       assertEquals("Tax: $" + tax, text("[data-test='tax-label']"));
 *       assertEquals("Total: $" + itemTotal.add(tax), text("[data-test='total-label']"));
 *   }
 *
 * DIFFERENCE: The arithmetic is the same idea in both. Java uses BigDecimal for exact
 *   money; in TypeScript adding prices as numbers gives tiny rounding errors
 *   (129.94000000000003), so the sum is rounded to cents with roundToCents().
 */
test('CHK-02: multiple items: item total, tax and grand total correct', { tag: '@regression' }, async ({
  seedCart,
  cartPage,
  checkoutInfoPage,
  checkoutOverviewPage,
}) => {
  const itemTotal = roundToCents(allProducts.reduce((sum, product) => sum + product.price, 0));
  const tax = calculateTax(itemTotal);
  const total = roundToCents(itemTotal + tax);

  await test.step('Start checkout with all six products in the cart', async () => {
    await seedCart(allProducts);
    await cartPage.open();
    await expect(cartPage.items).toHaveCount(allProducts.length);
    await cartPage.checkout();
    await checkoutInfoPage.fillCustomer(validCustomer);
    await checkoutInfoPage.continueToOverview();
    await checkoutOverviewPage.expectLoaded();
  });

  await test.step('Overview lists every product with its price', async () => {
    await expect(checkoutOverviewPage.itemNames).toHaveText(allProducts.map((product) => product.name));
    await expect(checkoutOverviewPage.itemPrices).toHaveText(allProducts.map((product) => formatUsd(product.price)));
  });

  await test.step('Item total, tax and total match the calculation', async () => {
    await expect(checkoutOverviewPage.subtotalLabel).toHaveText(`Item total: ${formatUsd(itemTotal)}`);
    await expect(checkoutOverviewPage.taxLabel).toHaveText(`Tax: ${formatUsd(tax)}`);
    await expect(checkoutOverviewPage.totalLabel).toHaveText(`Total: ${formatUsd(total)}`);
  });
});

/**
 * CHK-03 to CHK-05: each of the three customer fields is required. One test per field,
 * generated from the table: the field is left empty, Continue is clicked, and the exact
 * message must appear while the user stays on the information step.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @ParameterizedTest(name = "{0}: {1} required") @Tag("regression")
 *   @CsvSource({
 *       "CHK-03, First name,  '',   User, 12345, Error: First Name is required",
 *       "CHK-04, Last name,   Test, '',   12345, Error: Last Name is required",
 *       "CHK-05, Postal code, Test, User, '',    Error: Postal Code is required"
 *   })
 *   void requiredField(String id, String field, String first, String last, String zip, String expectedError) {
 *       seedCart(List.of(Products.BACKPACK));
 *       driver.get(baseUrl + "/checkout-step-one.html");
 *       checkoutInfoPage.fillCustomer(new Customer(first, last, zip));
 *       checkoutInfoPage.continueToOverview();
 *       WebElement error = wait.until(ExpectedConditions.visibilityOfElementLocated(
 *           By.cssSelector("[data-test='error']")));
 *       assertEquals(expectedError, error.getText());
 *       assertEquals(baseUrl + "/checkout-step-one.html", driver.getCurrentUrl());
 *   }
 *
 * DIFFERENCE: A `for` loop over a table instead of @ParameterizedTest/@CsvSource. The
 *   spread syntax { ...validCustomer, lastName: '' } builds "a valid customer except for
 *   one field" in one expression; in Java that is a builder or a copy constructor.
 */
const requiredFieldCases = [
  { id: 'CHK-03', title: 'first name required', customer: { ...validCustomer, firstName: '' }, expectedError: checkoutErrors.firstNameRequired },
  { id: 'CHK-04', title: 'last name required', customer: { ...validCustomer, lastName: '' }, expectedError: checkoutErrors.lastNameRequired },
  { id: 'CHK-05', title: 'postal code required', customer: { ...validCustomer, postalCode: '' }, expectedError: checkoutErrors.postalCodeRequired },
];

for (const fieldCase of requiredFieldCases) {
  test(`${fieldCase.id}: ${fieldCase.title}`, { tag: '@regression' }, async ({ seedCart, checkoutInfoPage }) => {
    await test.step('Open the information step with one product in the cart', async () => {
      await seedCart([products.backpack]);
      await checkoutInfoPage.open();
      await checkoutInfoPage.expectLoaded();
    });

    await test.step('Leave one field empty and click Continue', async () => {
      await checkoutInfoPage.fillCustomer(fieldCase.customer);
      await checkoutInfoPage.continueToOverview();
    });

    await test.step('The required-field message is shown and the step does not change', async () => {
      await expect(checkoutInfoPage.errorMessage).toHaveText(fieldCase.expectedError);
      await checkoutInfoPage.expectLoaded();
    });
  });
}

/**
 * CHK-06: Cancel on the information step goes back to the cart, with the cart unchanged.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void chk06_cancelOnInformationStepReturnsToCart() {
 *       seedCart(List.of(Products.BACKPACK, Products.ONESIE));
 *       driver.get(baseUrl + "/checkout-step-one.html");
 *       wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-test='cancel']"))).click();
 *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/cart.html"));
 *       assertEquals(List.of("Sauce Labs Backpack", "Sauce Labs Onesie"),
 *           texts("[data-test='cart-list'] [data-test='inventory-item-name']"));
 *   }
 *
 * DIFFERENCE: Same flow; no explicit waits in the Playwright version.
 */
test('CHK-06: cancel on information step returns to cart', { tag: '@regression' }, async ({
  seedCart,
  checkoutInfoPage,
  cartPage,
}) => {
  const chosen = [products.backpack, products.onesie];

  await test.step('Open the information step with two products in the cart', async () => {
    await seedCart(chosen);
    await checkoutInfoPage.open();
    await checkoutInfoPage.expectLoaded();
  });

  await test.step('Click Cancel', async () => {
    await checkoutInfoPage.cancel();
  });

  await test.step('Cart page is shown with both products still in it', async () => {
    await cartPage.expectLoaded();
    await expect(cartPage.itemNames).toHaveText(chosen.map((product) => product.name));
    await cartPage.header.expectCartCount(2);
  });
});

/**
 * CHK-07: Cancel on the overview goes to the Products page (not the cart), and the cart
 * is unchanged.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void chk07_cancelOnOverviewReturnsToInventory() {
 *       seedCart(List.of(Products.BACKPACK));
 *       driver.get(baseUrl + "/checkout-step-one.html");
 *       checkoutInfoPage.fillCustomer(Customers.VALID);
 *       checkoutInfoPage.continueToOverview();
 *       wait.until(ExpectedConditions.urlContains("checkout-step-two"));
 *       driver.findElement(By.cssSelector("[data-test='cancel']")).click();
 *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
 *       assertEquals("1", driver.findElement(By.cssSelector("[data-test='shopping-cart-badge']")).getText());
 *   }
 *
 * DIFFERENCE: Same flow; no explicit waits in the Playwright version.
 */
test('CHK-07: cancel on overview returns to inventory', { tag: '@regression' }, async ({
  seedCart,
  checkoutInfoPage,
  checkoutOverviewPage,
  inventoryPage,
}) => {
  const product = products.backpack;

  await test.step('Go to the overview with one product', async () => {
    await seedCart([product]);
    await checkoutInfoPage.open();
    await checkoutInfoPage.fillCustomer(validCustomer);
    await checkoutInfoPage.continueToOverview();
    await checkoutOverviewPage.expectLoaded();
  });

  await test.step('Click Cancel', async () => {
    await checkoutOverviewPage.cancel();
  });

  await test.step('Products page is shown and the product is still in the cart', async () => {
    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(1);
    await expect(inventoryPage.removeButton(product)).toBeVisible();
  });
});

/**
 * CHK-08: after an order is completed the cart is empty everywhere: no badge, nothing
 * stored in the browser, an empty cart page, and "Add to cart" buttons on the Products page.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void chk08_afterOrderCompletesCartIsEmpty() {
 *       seedCart(List.of(Products.BACKPACK, Products.BIKE_LIGHT));
 *       completeCheckout(Customers.VALID);            // info -> overview -> finish
 *       wait.until(ExpectedConditions.urlContains("checkout-complete"));
 *       assertTrue(driver.findElements(By.cssSelector("[data-test='shopping-cart-badge']")).isEmpty());
 *       Object stored = ((JavascriptExecutor) driver)
 *           .executeScript("return window.localStorage.getItem('cart-contents');");
 *       assertNull(stored);
 *       driver.get(baseUrl + "/cart.html");
 *       assertTrue(driver.findElements(
 *           By.cssSelector("[data-test='cart-list'] [data-test='inventory-item']")).isEmpty());
 *   }
 *
 * DIFFERENCE: Reading localStorage is JavaScript in both tools (page.evaluate vs
 *   JavascriptExecutor). expect.poll retries the read until it is null, in case the
 *   application clears the storage a moment after showing the confirmation.
 */
test('CHK-08: after order completes, cart is empty', { tag: '@regression' }, async ({
  page,
  seedCart,
  checkoutInfoPage,
  checkoutOverviewPage,
  checkoutCompletePage,
  cartPage,
  inventoryPage,
}) => {
  const chosen = [products.backpack, products.bikeLight];

  await test.step('Complete an order for two products', async () => {
    await seedCart(chosen);
    await checkoutInfoPage.open();
    await checkoutInfoPage.fillCustomer(validCustomer);
    await checkoutInfoPage.continueToOverview();
    await expect(checkoutOverviewPage.itemNames).toHaveText(chosen.map((product) => product.name));
    await checkoutOverviewPage.finish();
    await checkoutCompletePage.expectLoaded();
  });

  await test.step('No cart badge and nothing stored in the browser', async () => {
    await checkoutCompletePage.header.expectCartCount(0);
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('cart-contents')), {
        message: 'cart-contents should be removed from localStorage',
      })
      .toBeNull();
  });

  await test.step('Cart page is empty', async () => {
    await checkoutCompletePage.header.openCart();
    await cartPage.expectLoaded();
    await expect(cartPage.items).toHaveCount(0);
  });

  await test.step('Products page offers "Add to cart" again for the bought products', async () => {
    await inventoryPage.open();
    for (const product of chosen) {
      await expect(inventoryPage.addToCartButton(product)).toBeVisible();
    }
  });
});

/**
 * CHK-09: checkout with an EMPTY cart. Expected: it should not be possible to start a
 * checkout with nothing in the cart (the user should stay on the cart page).
 *
 * KNOWN DEFECT DEF-01 (observed on the live site, 2026-11-16): the Checkout button works
 * with an empty cart, and the flow can be finished: overview shows "Item total: $0",
 * "Tax: $0.00", "Total: $0.00" and the confirmation says "Thank you for your order!".
 * The expected behaviour above is our assumption; SauceDemo publishes no requirement.
 * The test is marked test.fail: it is EXPECTED to fail while the defect exists, and the
 * run stays green. If the application is fixed, this test will be reported as
 * "passed unexpectedly", telling us to remove the mark.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   // JUnit 5 has no "expected to fail" mark. Closest options:
 *   @Test @Tag("regression")
 *   @Disabled("DEF-01: checkout is possible with an empty cart")     // skipped, never runs
 *   void chk09_checkoutWithEmptyCartIsNotPossible() {
 *       driver.get(baseUrl + "/cart.html");
 *       assertTrue(driver.findElements(
 *           By.cssSelector("[data-test='cart-list'] [data-test='inventory-item']")).isEmpty());
 *       driver.findElement(By.cssSelector("[data-test='checkout']")).click();
 *       assertEquals(baseUrl + "/cart.html", driver.getCurrentUrl());
 *   }
 *   // TestNG: @Test(enabled = false), or
 *   //         @Test(expectedExceptions = AssertionError.class), which is "expected to fail"
 *
 * DIFFERENCE: test.fail still RUNS the test and checks that it fails, so a fix in the
 *   application is noticed automatically. @Disabled / enabled=false just skips the test,
 *   so nobody notices when the defect is fixed (or gets worse). TestNG's
 *   expectedExceptions = AssertionError.class is the nearest real equivalent.
 */
test.fail('CHK-09: checkout with empty cart is not possible', {
  tag: '@regression',
  annotation: { type: 'defect', description: 'DEF-01: checkout can be started and completed with an empty cart' },
}, async ({ page, cartPage }) => {
  await test.step('Open the cart with nothing in it', async () => {
    await cartPage.open();
    await cartPage.expectLoaded();
    await expect(cartPage.items).toHaveCount(0);
  });

  await test.step('Click Checkout', async () => {
    await cartPage.checkout();
  });

  await test.step('Expected: the user stays on the cart page', async () => {
    // Fails today: the application opens /checkout-step-one.html (DEF-01).
    await expect(page).toHaveURL('/cart.html');
  });
});
