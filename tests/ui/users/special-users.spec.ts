/**
 * Role: tests for SauceDemo's special users (plan section 5, USR-01 to USR-03). The site
 * misbehaves ON PURPOSE for these accounts so that testers can practise finding defects:
 *   - problem_user: wrong pictures, sorting ignored, some buttons dead, a form field broken
 *   - performance_glitch_user: login takes about five seconds
 *   - error_user: some actions fail with errors
 * Everything asserted here was observed on the live site on 2026-11-16.
 *
 * How the defects are written down: each test states the CORRECT behaviour (the same
 * expectation we have for standard_user) and is marked test.fail with a defect id. The
 * test is expected to fail; the run stays green; and if the behaviour ever changes the
 * report says "passed unexpectedly". The assertions are never weakened to make them pass.
 * (USR-04, visual_user, is in visual-user.spec.ts.)
 */
import { test, expect } from '../../../src/fixtures/test';
import { users } from '../../../src/data/users';
import { allProducts, expectedOrder, products, sortOptions, PRODUCT_COUNT } from '../../../src/data/products';
import { validCustomer } from '../../../src/data/checkout';

// These tests log in as other users, so they must not start with standard_user's session.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * USR-01: problem_user. Four known broken behaviours, one test each.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   class ProblemUserTest extends BaseTest {
 *       @BeforeEach
 *       void loginAsProblemUser() {
 *           driver.get(baseUrl);
 *           loginPage.login(Users.PROBLEM);
 *           wait.until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
 *       }
 *       // @Test methods ...
 *   }
 *
 * DIFFERENCE: test.describe + test.beforeEach equals a test class with @BeforeEach. The
 *   login itself comes from the loginAs fixture, which any spec file can ask for; in
 *   Selenium the shared login lives in BaseTest or a helper class.
 */
test.describe('USR-01 problem_user', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs(users.problem);
  });

  /**
   * Expected: every product has its own picture. Observed: all six cards show the same
   * picture (/assets/sl-404-....jpg).
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test(groups = "regression", expectedExceptions = AssertionError.class,
   *         description = "DEF-P1: problem_user sees the same picture on every product")   // TestNG
   *   public void usr01_everyProductHasItsOwnPicture() {
   *       Set<String> sources = driver.findElements(By.cssSelector("[data-test='inventory-item'] img"))
   *           .stream().map(img -> img.getAttribute("src")).collect(Collectors.toSet());
   *       Assert.assertEquals(sources.size(), 6);
   *   }
   *
   * DIFFERENCE: test.fail is built in and reports "passed unexpectedly" if the defect
   *   disappears. JUnit 5 has no equivalent (only @Disabled, which skips); TestNG's
   *   expectedExceptions = AssertionError.class is the closest.
   */
  test.fail('USR-01: problem_user - every product has its own picture', {
    tag: '@regression',
    annotation: { type: 'defect', description: 'DEF-P1: all six products show the same picture' },
  }, async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(PRODUCT_COUNT);
    const sources = await inventoryPage.itemImages.evaluateAll((images) =>
      images.map((img) => img.getAttribute('src')),
    );
    // Fails today: 1 distinct picture instead of 6 (DEF-P1).
    expect(new Set(sources).size).toBe(PRODUCT_COUNT);
  });

  /**
   * Expected: choosing "Name (Z to A)" reverses the list. Observed: the dropdown stays on
   * "Name (A to Z)" and the order does not change.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test(groups = "regression", expectedExceptions = {AssertionError.class, TimeoutException.class},
   *         description = "DEF-P2: sorting is ignored for problem_user")
   *   public void usr01_sortingZToAReordersProducts() {
   *       new Select(driver.findElement(By.cssSelector("[data-test='product-sort-container']")))
   *           .selectByValue("za");
   *       wait.until(d -> texts("[data-test='inventory-item-name']").equals(expectedZToA));
   *   }
   *
   * DIFFERENCE: Same as above; note that a failed WebDriverWait throws TimeoutException,
   *   not AssertionError, so both must be listed in TestNG.
   */
  test.fail('USR-01: problem_user - sorting Z to A reorders the products', {
    tag: '@regression',
    annotation: { type: 'defect', description: 'DEF-P2: sort selection is ignored' },
  }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy(sortOptions.nameDesc);
    // Fails today: the list stays in A-to-Z order (DEF-P2).
    await expect(inventoryPage.itemNames).toHaveText(expectedOrder(sortOptions.nameDesc).map((product) => product.name));
  });

  /**
   * Expected: all six products can be added, badge shows 6. Observed: only Backpack, Bike
   * Light and Onesie are added (badge 3); the other three buttons do nothing.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test(groups = "regression", expectedExceptions = {AssertionError.class, TimeoutException.class},
   *         description = "DEF-P3: three products cannot be added for problem_user")
   *   public void usr01_allProductsCanBeAddedToCart() {
   *       for (Product p : Products.ALL) {
   *           driver.findElement(By.cssSelector("[data-test='add-to-cart-" + p.getSlug() + "']")).click();
   *       }
   *       wait.until(ExpectedConditions.textToBe(By.cssSelector("[data-test='shopping-cart-badge']"), "6"));
   *   }
   *
   * DIFFERENCE: Same as above.
   */
  test.fail('USR-01: problem_user - all products can be added to the cart', {
    tag: '@regression',
    annotation: { type: 'defect', description: 'DEF-P3: Bolt T-Shirt, Fleece Jacket and Red T-Shirt cannot be added' },
  }, async ({ inventoryPage }) => {
    for (const product of allProducts) {
      await inventoryPage.addToCart(product);
    }
    // Fails today: the badge shows 3 (DEF-P3).
    await inventoryPage.header.expectCartCount(PRODUCT_COUNT);
  });

  /**
   * Expected: the checkout form keeps what is typed in each field. Observed: typing the
   * last name overwrites the first name and the Last Name field stays empty, so checkout
   * cannot be completed ("Error: Last Name is required").
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test(groups = "regression", expectedExceptions = AssertionError.class,
   *         description = "DEF-P4: Last Name cannot be entered by problem_user")
   *   public void usr01_checkoutFormKeepsTheLastName() {
   *       seedCart(List.of(Products.BACKPACK));
   *       driver.get(baseUrl + "/checkout-step-one.html");
   *       checkoutInfoPage.fillCustomer(Customers.VALID);
   *       Assert.assertEquals(driver.findElement(By.cssSelector("[data-test='firstName']"))
   *           .getAttribute("value"), "Test");
   *       Assert.assertEquals(driver.findElement(By.cssSelector("[data-test='lastName']"))
   *           .getAttribute("value"), "User");
   *   }
   *
   * DIFFERENCE: toHaveValue reads what is really in the field and retries;
   *   getAttribute("value") (or getDomProperty in Selenium 4) reads it once.
   */
  test.fail('USR-01: problem_user - checkout form keeps the last name', {
    tag: '@regression',
    annotation: { type: 'defect', description: 'DEF-P4: typing the last name changes the first name; Last Name stays empty' },
  }, async ({ seedCart, checkoutInfoPage }) => {
    await seedCart([products.backpack]);
    await checkoutInfoPage.open();
    await checkoutInfoPage.fillCustomer(validCustomer);
    // Fails today: first name holds "User" and last name is empty (DEF-P4).
    await expect(checkoutInfoPage.firstNameInput).toHaveValue(validCustomer.firstName);
    await expect(checkoutInfoPage.lastNameInput).toHaveValue(validCustomer.lastName);
  });
});

/**
 * USR-02: performance_glitch_user. The login takes about five seconds (measured 5.2 s),
 * which is longer than the default 5-second assertion timeout. The test must still pass
 * without any fixed sleep.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void usr02_slowLoginCompletesWithoutHardWaits() {
 *       driver.get(baseUrl);
 *       loginPage.login(Users.PERFORMANCE_GLITCH);
 *       // NOT Thread.sleep(6000): wait for the condition, with a generous upper limit
 *       new WebDriverWait(driver, Duration.ofSeconds(15))
 *           .until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
 *       assertEquals(6, driver.findElements(By.cssSelector("[data-test='inventory-item']")).size());
 *   }
 *
 * DIFFERENCE: Both tools solve this the same way: a condition-based wait with a longer
 *   limit for this one step ({ timeout: 15_000 } inside loginAs / WebDriverWait of 15 s).
 *   The wait ends as soon as the page arrives. A hard wait (waitForTimeout / Thread.sleep)
 *   would cost the full time on every run and still fail on a slower day.
 */
test('USR-02: performance_glitch_user login completes without hard waits', { tag: '@regression' }, async ({
  loginAs,
  inventoryPage,
}) => {
  // This account is slow by design (the test took up to 22 s in parallel runs). test.slow()
  // triples the 30 s limit for this test only; it does not add any waiting.
  test.slow();

  await test.step('Log in as performance_glitch_user and wait for the Products page', async () => {
    await loginAs(users.performanceGlitch);
  });

  await test.step('Products page is complete and usable', async () => {
    await expect(inventoryPage.items).toHaveCount(PRODUCT_COUNT);
    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.header.expectCartCount(1);
  });
});

/**
 * USR-03: error_user. Three actions that fail for this account, one test each.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   class ErrorUserTest extends BaseTest {
 *       @BeforeEach
 *       void loginAsErrorUser() {
 *           driver.get(baseUrl);
 *           loginPage.login(Users.ERROR);
 *           wait.until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
 *       }
 *       // @Test methods ...
 *   }
 *
 * DIFFERENCE: Same as the problem_user group: describe + beforeEach + fixture versus a
 *   test class with @BeforeEach.
 */
test.describe('USR-03 error_user', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs(users.error);
  });

  /**
   * Expected: choosing "Name (Z to A)" reverses the list. Observed: a browser alert says
   * "Sorting is broken! This error has been reported to Backtrace." and the order stays.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test(groups = "regression",
   *         expectedExceptions = {AssertionError.class, TimeoutException.class, UnhandledAlertException.class},
   *         description = "DEF-E1: sorting raises an alert for error_user")
   *   public void usr03_sortingZToAReordersProducts() {
   *       new Select(driver.findElement(By.cssSelector("[data-test='product-sort-container']")))
   *           .selectByValue("za");
   *       wait.until(d -> texts("[data-test='inventory-item-name']").equals(expectedZToA));
   *   }
   *
   * DIFFERENCE: Playwright dismisses an unexpected alert automatically and carries on, so
   *   the test fails on the real problem (wrong order). In Selenium an open alert blocks
   *   the browser: the next command throws UnhandledAlertException until you call
   *   driver.switchTo().alert().dismiss().
   */
  test.fail('USR-03: error_user - sorting Z to A reorders the products', {
    tag: '@regression',
    annotation: { type: 'defect', description: 'DEF-E1: sorting shows the alert "Sorting is broken!" and does nothing' },
  }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy(sortOptions.nameDesc);
    // Fails today: the list stays in A-to-Z order (DEF-E1).
    await expect(inventoryPage.itemNames).toHaveText(expectedOrder(sortOptions.nameDesc).map((product) => product.name));
  });

  /**
   * Expected: all six products can be added, badge shows 6. Observed: three products are
   * not added (badge 3) and the page logs "Failed to add item to the cart."
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test(groups = "regression", expectedExceptions = {AssertionError.class, TimeoutException.class},
   *         description = "DEF-E2: three products cannot be added for error_user")
   *   public void usr03_allProductsCanBeAddedToCart() {
   *       for (Product p : Products.ALL) {
   *           driver.findElement(By.cssSelector("[data-test='add-to-cart-" + p.getSlug() + "']")).click();
   *       }
   *       wait.until(ExpectedConditions.textToBe(By.cssSelector("[data-test='shopping-cart-badge']"), "6"));
   *   }
   *
   * DIFFERENCE: Same as the problem_user test. Playwright can also listen for JavaScript
   *   errors of the page (page.on('pageerror')); Selenium reads them afterwards from the
   *   browser log (driver.manage().logs().get(LogType.BROWSER), Chromium only).
   */
  test.fail('USR-03: error_user - all products can be added to the cart', {
    tag: '@regression',
    annotation: { type: 'defect', description: 'DEF-E2: Bolt T-Shirt, Fleece Jacket and Red T-Shirt cannot be added' },
  }, async ({ inventoryPage }) => {
    for (const product of allProducts) {
      await inventoryPage.addToCart(product);
    }
    // Fails today: the badge shows 3 (DEF-E2).
    await inventoryPage.header.expectCartCount(PRODUCT_COUNT);
  });

  /**
   * Expected: clicking Finish on the overview completes the order. Observed: nothing
   * happens; the user stays on the overview and no confirmation appears.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test(groups = "regression", expectedExceptions = {AssertionError.class, TimeoutException.class},
   *         description = "DEF-E3: Finish does nothing for error_user")
   *   public void usr03_finishCompletesTheOrder() {
   *       seedCart(List.of(Products.BACKPACK));
   *       driver.get(baseUrl + "/checkout-step-one.html");
   *       checkoutInfoPage.fillCustomer(Customers.VALID);
   *       checkoutInfoPage.continueToOverview();
   *       wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-test='finish']"))).click();
   *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/checkout-complete.html"));
   *   }
   *
   * DIFFERENCE: Same as above.
   */
  test.fail('USR-03: error_user - Finish completes the order', {
    tag: '@regression',
    annotation: { type: 'defect', description: 'DEF-E3: Finish button does nothing; the order cannot be completed' },
  }, async ({ seedCart, checkoutInfoPage, checkoutOverviewPage, checkoutCompletePage }) => {
    await seedCart([products.backpack]);
    await checkoutInfoPage.open();
    await checkoutInfoPage.fillCustomer(validCustomer);
    await checkoutInfoPage.continueToOverview();
    await checkoutOverviewPage.expectLoaded();
    await checkoutOverviewPage.finish();
    // Fails today: the page stays on the overview (DEF-E3).
    await checkoutCompletePage.expectLoaded();
  });
});
