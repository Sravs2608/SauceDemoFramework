/**
 * Role: page object for checkout step one, "Checkout: Your Information"
 * (/checkout-step-one.html): first name, last name, postal code and the Continue button.
 */
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { Customer } from '../data/checkout';

export class CheckoutInfoPage extends BasePage {
  protected readonly path = '/checkout-step-one.html';
  protected readonly titleText = 'Checkout: Your Information';

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
  }

  /**
   * Fills the three customer fields.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
   *   wait.until(ExpectedConditions.visibilityOfElementLocated(
   *       By.cssSelector("[data-test='firstName']"))).sendKeys(customer.getFirstName());
   *   driver.findElement(By.cssSelector("[data-test='lastName']")).sendKeys(customer.getLastName());
   *   driver.findElement(By.cssSelector("[data-test='postalCode']")).sendKeys(customer.getPostalCode());
   *
   * DIFFERENCE: fill() waits for each field, clears it and sets the whole value at once.
   *   sendKeys() types key by key, appends to whatever is already in the field, and needs
   *   a wait in front of the first field after a page change.
   */
  async fillCustomer(customer: Customer): Promise<void> {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.postalCodeInput.fill(customer.postalCode);
  }

  /**
   * Clicks Continue to go to the order overview.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   driver.findElement(By.cssSelector("[data-test='continue']")).click();
   *
   * DIFFERENCE: Nearly identical here because the button is already on screen; Playwright
   *   still verifies it is visible, stable and enabled before clicking.
   */
  async continueToOverview(): Promise<void> {
    await this.continueButton.click();
  }
}
