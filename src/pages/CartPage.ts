/**
 * Role: page object for the cart page (/cart.html): the list of chosen items with their
 * names, prices and quantities, and the Checkout button.
 */
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  protected readonly path = '/cart.html';
  protected readonly titleText = 'Your Cart';

  /** One entry per product in the cart. */
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    // Chaining: search only inside the cart list, not the whole page.
    const cartList = page.getByTestId('cart-list');
    this.items = cartList.getByTestId('inventory-item');
    this.itemNames = cartList.getByTestId('inventory-item-name');
    this.itemPrices = cartList.getByTestId('inventory-item-price');
    this.itemQuantities = cartList.getByTestId('item-quantity');
    this.checkoutButton = page.getByTestId('checkout');
  }

  /**
   * Clicks Checkout to start the checkout flow.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-test='checkout']")))
   *       .click();
   *
   * DIFFERENCE: Auto-waiting click in Playwright versus explicit WebDriverWait in Selenium.
   *   The chained locators above (cartList.getByTestId(...)) correspond to
   *   cartList.findElements(By.cssSelector(...)) in Selenium, but stay lazy and never go stale.
   */
  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
