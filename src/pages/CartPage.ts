/**
 * Role: page object for the cart page (/cart.html): the list of chosen items with their
 * names, prices and quantities, and the Remove, Continue Shopping and Checkout buttons.
 */
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { Product } from '../data/products';

export class CartPage extends BasePage {
  protected readonly path = '/cart.html';
  protected readonly titleText = 'Your Cart';

  /** One entry per product in the cart. */
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    // Chaining: search only inside the cart list, not the whole page.
    const cartList = page.getByTestId('cart-list');
    this.items = cartList.getByTestId('inventory-item');
    this.itemNames = cartList.getByTestId('inventory-item-name');
    this.itemPrices = cartList.getByTestId('inventory-item-price');
    this.itemQuantities = cartList.getByTestId('item-quantity');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
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

  /**
   * Clicks "Remove" for one product in the cart.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(
   *           By.cssSelector("[data-test='remove-" + product.getSlug() + "']")))
   *       .click();
   *
   * DIFFERENCE: Auto-waiting click in Playwright versus explicit WebDriverWait in Selenium.
   */
  async removeItem(product: Product): Promise<void> {
    await this.page.getByTestId(`remove-${product.slug}`).click();
  }

  /**
   * Clicks "Continue Shopping" to go back to the Products page.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(
   *           By.cssSelector("[data-test='continue-shopping']")))
   *       .click();
   *
   * DIFFERENCE: Auto-waiting click in Playwright versus explicit WebDriverWait in Selenium.
   */
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
