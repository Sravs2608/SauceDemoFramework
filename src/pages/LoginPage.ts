/**
 * Role: page object for the login page (address "/"). It knows where the username,
 * password, Login button and error message are, and how to log in. Tests call
 * `loginPage.login(user)` and never touch a locator for this page directly.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { User } from '../data/users';

export class LoginPage extends BasePage {
  protected readonly path = '/';
  protected readonly titleText = null;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    // getByTestId reads the data-test attribute (configured as testIdAttribute).
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
  }

  /**
   * Types the username and password and clicks Login. It does not check the result,
   * because the same action is used for successful and for rejected logins; the test
   * decides what should happen next.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
   *   WebElement username = wait.until(ExpectedConditions.visibilityOfElementLocated(
   *       By.cssSelector("[data-test='username']")));
   *   username.clear();
   *   username.sendKeys(user.getUsername());
   *   WebElement password = driver.findElement(By.cssSelector("[data-test='password']"));
   *   password.clear();
   *   password.sendKeys(user.getPassword());
   *   driver.findElement(By.cssSelector("[data-test='login-button']")).click();
   *
   * DIFFERENCE: fill() waits for the field to be visible and editable, clears it and sets
   *   the value in one call; Selenium needs a wait, clear() and sendKeys(). getByTestId
   *   targets the data-test attribute directly, where Selenium writes it as a CSS attribute
   *   selector by hand.
   */
  async login(user: User): Promise<void> {
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.loginButton.click();
  }

  /**
   * Checks that the login page is shown: the address is "/" and the Login button is
   * visible. (The login page has no heading, so the BasePage check is replaced here.)
   *
   * SELENIUM JAVA EQUIVALENT:
   *   WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
   *   wait.until(ExpectedConditions.urlToBe(baseUrl + "/"));
   *   wait.until(ExpectedConditions.visibilityOfElementLocated(
   *       By.cssSelector("[data-test='login-button']")));
   *
   * DIFFERENCE: Same checks, but Playwright's assertions retry on their own and report
   *   expected vs actual on failure; Selenium needs explicit waits and gives a bare
   *   TimeoutException.
   */
  override async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(this.path);
    await expect(this.loginButton).toBeVisible();
  }
}
