/**
 * Role: authentication tests (plan section 5, AUTH-xx). Phase 1 holds the three smoke
 * cases: AUTH-01 valid login, AUTH-06 locked-out user, AUTH-08 logout. The remaining
 * AUTH cases are added in Phase 2.
 */
import { test, expect } from '../../../src/fixtures/test';
import { users } from '../../../src/data/users';
import { PRODUCT_COUNT } from '../../../src/data/products';
import { loginErrors, restrictedPageError } from '../../../src/data/messages';

/**
 * Groups the tests that must start on the login page, logged OUT. The config gives every
 * test the saved standard_user session, so this group replaces it with an empty one.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   // A test class is the group; a fresh driver has no cookies, so it starts logged out.
 *   class LoginTest extends BaseTest {
 *       @BeforeEach
 *       void startLoggedOut() {
 *           driver.manage().deleteAllCookies();
 *           driver.get(baseUrl);
 *       }
 *   }
 *
 * DIFFERENCE: test.describe groups tests like a Java test class, and test.use changes a
 *   config setting for just that group. In Selenium "logged out" is the default and being
 *   logged in is the extra work (cookie injection); here it is the other way round because
 *   storageState makes logged-in the default.
 */
test.describe('Authentication - starting logged out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * AUTH-01: a valid user logs in and lands on the Products page with the full catalogue.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test @Tag("smoke")
   *   void auth01_validLoginLandsOnProductsPage() {
   *       driver.get(baseUrl);
   *       loginPage.login(Users.STANDARD);
   *       WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
   *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
   *       assertEquals("Products",
   *           driver.findElement(By.cssSelector("[data-test='title']")).getText());
   *       assertEquals(6,
   *           driver.findElements(By.cssSelector("[data-test='inventory-item']")).size());
   *       assertEquals("standard_user",
   *           driver.manage().getCookieNamed("session-username").getValue());
   *   }
   *
   * DIFFERENCE: The tag is part of the test declaration ({ tag: '@smoke' }) instead of an
   *   annotation, test.step gives named steps in the report without an extra library
   *   (Selenium: Allure @Step), and toHaveCount retries until six products are rendered,
   *   where findElements(...).size() counts whatever exists at that instant.
   */
  test('AUTH-01: valid login (standard_user) lands on Products page', { tag: '@smoke' }, async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    await test.step('Open the login page', async () => {
      await loginPage.open();
      await loginPage.expectLoaded();
    });

    await test.step('Log in as standard_user', async () => {
      await loginPage.login(users.standard);
    });

    await test.step('Products page is shown with all products', async () => {
      await inventoryPage.expectLoaded();
      await expect(inventoryPage.items).toHaveCount(PRODUCT_COUNT);
    });

    await test.step('A session exists for the logged-in user', async () => {
      const cookies = await page.context().cookies();
      const session = cookies.find((cookie) => cookie.name === 'session-username');
      expect(session?.value).toBe(users.standard.username);
    });
  });

  /**
   * AUTH-06: the locked-out user is refused with the locked-out message and stays on the
   * login page.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test @Tag("smoke")
   *   void auth06_lockedOutUserIsBlocked() {
   *       driver.get(baseUrl);
   *       loginPage.login(Users.LOCKED_OUT);
   *       WebElement error = new WebDriverWait(driver, Duration.ofSeconds(5))
   *           .until(ExpectedConditions.visibilityOfElementLocated(
   *               By.cssSelector("[data-test='error']")));
   *       assertEquals("Epic sadface: Sorry, this user has been locked out.", error.getText());
   *       assertEquals(baseUrl + "/", driver.getCurrentUrl());
   *       assertTrue(driver.findElements(By.cssSelector("[data-test='inventory-item']")).isEmpty());
   *   }
   *
   * DIFFERENCE: toHaveText waits for the message and compares the exact text in one step.
   *   In Selenium, waiting for the element and asserting its text are two separate calls.
   */
  test('AUTH-06: locked_out_user is blocked with locked-out error', { tag: '@smoke' }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await test.step('Open the login page', async () => {
      await loginPage.open();
    });

    await test.step('Try to log in as locked_out_user', async () => {
      await loginPage.login(users.lockedOut);
    });

    await test.step('Login is refused with the locked-out message', async () => {
      await expect(loginPage.errorMessage).toHaveText(loginErrors.lockedOut);
      await loginPage.expectLoaded();
      await expect(inventoryPage.items).toHaveCount(0);
    });
  });

  const rejectedLogins = [
    {
      id: 'AUTH-02',
      title: 'wrong password shows error',
      username: users.standard.username,
      password: 'wrong_password',
      expectedError: loginErrors.credentialsMismatch,
    },
    {
      id: 'AUTH-03',
      title: 'unknown username shows error',
      username: 'no_such_user',
      password: users.standard.password,
      expectedError: loginErrors.credentialsMismatch,
    },
    {
      id: 'AUTH-04',
      title: 'empty username shows required error',
      username: '',
      password: users.standard.password,
      expectedError: loginErrors.usernameRequired,
    },
    {
      id: 'AUTH-05',
      title: 'empty password shows required error',
      username: users.standard.username,
      password: '',
      expectedError: loginErrors.passwordRequired,
    },
  ];

  /**
   * AUTH-02 to AUTH-05: four rejected logins that differ only in their data (what is
   * typed, which message is expected). The test body is written once and the loop creates
   * one separate, independently reported test per row of `rejectedLogins`.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @ParameterizedTest(name = "{0}: {1}")
   *   @Tag("regression")
   *   @CsvSource(nullValues = "EMPTY", value = {
   *       "AUTH-02, wrong password,  standard_user, wrong_password, Epic sadface: Username and password do not match any user in this service",
   *       "AUTH-03, unknown user,    no_such_user,  secret_sauce,   Epic sadface: Username and password do not match any user in this service",
   *       "AUTH-04, empty username,  '',            secret_sauce,   Epic sadface: Username is required",
   *       "AUTH-05, empty password,  standard_user, '',             Epic sadface: Password is required"
   *   })
   *   void rejectedLogin(String id, String title, String username, String password, String expectedError) {
   *       driver.get(baseUrl);
   *       loginPage.login(new User(username, password));
   *       WebElement error = new WebDriverWait(driver, Duration.ofSeconds(5))
   *           .until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("[data-test='error']")));
   *       assertEquals(expectedError, error.getText());
   *       assertEquals(baseUrl + "/", driver.getCurrentUrl());
   *   }
   *   // TestNG: @Test(dataProvider = "rejectedLogins") with a @DataProvider method
   *
   * DIFFERENCE: Playwright has no special annotation for data-driven tests; a plain
   *   `for` loop around test() does it, because tests are just function calls. JUnit 5
   *   needs @ParameterizedTest with a source (@CsvSource, @MethodSource) and TestNG needs
   *   a @DataProvider. In all three, each row is reported as its own test.
   */
  for (const attempt of rejectedLogins) {
    test(`${attempt.id}: ${attempt.title}`, { tag: '@regression' }, async ({ loginPage, inventoryPage }) => {
      await test.step('Open the login page', async () => {
        await loginPage.open();
      });

      await test.step('Submit the login form', async () => {
        await loginPage.login({ username: attempt.username, password: attempt.password });
      });

      await test.step('Login is refused with the expected message', async () => {
        await expect(loginPage.errorMessage).toHaveText(attempt.expectedError);
        // The site marks the fields in red by adding the class "input_error".
        await expect(loginPage.usernameInput).toHaveClass(/input_error/);
        await loginPage.expectLoaded();
        await expect(inventoryPage.items).toHaveCount(0);
      });
    });
  }

  /**
   * AUTH-07: protected pages cannot be opened by typing their address while logged out.
   * The application sends the visitor back to the login page with a message naming the
   * page. Checked for the Products page and the cart.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @ParameterizedTest @Tag("regression")
   *   @ValueSource(strings = {"/inventory.html", "/cart.html"})
   *   void auth07_protectedPageIsBlockedWithoutLogin(String path) {
   *       driver.get(baseUrl + path);
   *       WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
   *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/"));
   *       WebElement error = wait.until(ExpectedConditions.visibilityOfElementLocated(
   *           By.cssSelector("[data-test='error']")));
   *       assertEquals("Epic sadface: You can only access '" + path + "' when you are logged in.",
   *           error.getText());
   *   }
   *
   * DIFFERENCE: page.goto uses the relative address with baseURL; the redirect and the
   *   message are checked with retrying assertions, so no explicit wait is written.
   */
  test('AUTH-07: inventory URL without login is blocked', { tag: '@regression' }, async ({ page, loginPage }) => {
    for (const path of ['/inventory.html', '/cart.html']) {
      await test.step(`Opening ${path} directly returns to login with a message`, async () => {
        await page.goto(path);
        await expect(page).toHaveURL('/');
        await expect(loginPage.errorMessage).toHaveText(restrictedPageError(path));
        await loginPage.expectLoaded();
      });
    }
  });
});

/**
 * Groups the tests that start already logged in, using the session saved by
 * global-setup.ts. No login steps are needed inside these tests.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   class LogoutTest extends BaseTest {
 *       @BeforeEach
 *       void startLoggedIn() {
 *           driver.get(baseUrl);
 *           driver.manage().addCookie(new Cookie("session-username", "standard_user", "/"));
 *       }
 *   }
 *
 * DIFFERENCE: Nothing needs to be written here in Playwright; storageState from the
 *   config is applied automatically. Selenium has no equivalent, so each class injects the
 *   cookie itself or logs in through the UI before every test.
 */
test.describe('Authentication - starting from the saved session', () => {
  /**
   * AUTH-08: after logout the user is back on the login page, the session is gone and a
   * protected page can no longer be opened.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   @Test @Tag("smoke")
   *   void auth08_logoutBlocksProtectedPages() {
   *       driver.get(baseUrl + "/inventory.html");
   *       WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
   *       wait.until(ExpectedConditions.elementToBeClickable(By.id("react-burger-menu-btn"))).click();
   *       wait.until(ExpectedConditions.elementToBeClickable(
   *           By.cssSelector("[data-test='logout-sidebar-link']"))).click();
   *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/"));
   *       assertNull(driver.manage().getCookieNamed("session-username"));
   *       driver.get(baseUrl + "/inventory.html");
   *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/"));
   *       WebElement error = wait.until(ExpectedConditions.visibilityOfElementLocated(
   *           By.cssSelector("[data-test='error']")));
   *       assertEquals("Epic sadface: You can only access '/inventory.html' when you are logged in.",
   *           error.getText());
   *   }
   *
   * DIFFERENCE: The test begins on the Products page without logging in (storageState).
   *   Logging out here does not affect any other test, because every Playwright test has
   *   its own browser context with its own copy of the cookies; the saved file is not
   *   changed. In Selenium, tests sharing one driver would all be logged out.
   */
  test('AUTH-08: logout returns to login and protected pages are blocked afterwards', { tag: '@smoke' }, async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    await test.step('Open the Products page using the saved session', async () => {
      await inventoryPage.open();
      await inventoryPage.expectLoaded();
    });

    await test.step('Log out from the menu', async () => {
      await inventoryPage.menu.logout();
    });

    await test.step('Login page is shown and the session is gone', async () => {
      await loginPage.expectLoaded();
      const cookies = await page.context().cookies();
      expect(cookies.some((cookie) => cookie.name === 'session-username')).toBe(false);
    });

    await test.step('Opening the Products page directly is blocked', async () => {
      await inventoryPage.open();
      // First wait until the application has sent us back to the login address, then
      // read the message. This makes the order of events explicit: redirect, then error.
      await expect(page).toHaveURL('/');
      await expect(loginPage.errorMessage).toHaveText(restrictedPageError('/inventory.html'));
      await loginPage.expectLoaded();
      await expect(inventoryPage.items).toHaveCount(0);
    });
  });
});
