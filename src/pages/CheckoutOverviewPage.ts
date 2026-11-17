/**
 * Role: page object for checkout step two, "Checkout: Overview" (/checkout-step-two.html):
 * the items being bought, the item total, tax and grand total, and the Finish button.
 */
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutOverviewPage extends BasePage {
  protected readonly path = '/checkout-step-two.html';
  protected readonly titleText = 'Checkout: Overview';

  readonly itemNames: Locator;
  /** Shows e.g. "Item total: $29.99". */
  readonly subtotalLabel: Locator;
  /** Shows e.g. "Tax: $2.40". */
  readonly taxLabel: Locator;
  /** Shows e.g. "Total: $32.39". */
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;
  readonly itemPrices: Locator;

  constructor(page: Page) {
    super(page);
    this.cancelButton = page.getByTestId('cancel');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
  }

  /**
   * Clicks Finish to place the order.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-test='finish']")))
   *       .click();
   *
   * DIFFERENCE: Auto-waiting click in Playwright versus explicit WebDriverWait in Selenium.
   *   On small screens the Finish button is below the fold; Playwright scrolls it into view
   *   as part of click(), where Selenium sometimes needs Actions.moveToElement or a
   *   JavaScript scrollIntoView first.
   */
  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  /**
   * Clicks Cancel. On the overview it returns to the Products page (not to the cart).
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-test='cancel']")))
   *       .click();
   *
   * DIFFERENCE: Auto-waiting click in Playwright versus explicit WebDriverWait in Selenium.
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
