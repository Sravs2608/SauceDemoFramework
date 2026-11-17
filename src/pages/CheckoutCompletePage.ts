/**
 * Role: page object for the order confirmation page, "Checkout: Complete!"
 * (/checkout-complete.html): the thank-you header, the dispatch text and Back Home.
 */
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutCompletePage extends BasePage {
  protected readonly path = '/checkout-complete.html';
  protected readonly titleText = 'Checkout: Complete!';

  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  /**
   * Clicks Back Home to return to the Products page.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(
   *           By.cssSelector("[data-test='back-to-products']")))
   *       .click();
   *
   * DIFFERENCE: Auto-waiting click in Playwright versus explicit WebDriverWait in Selenium.
   */
  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
