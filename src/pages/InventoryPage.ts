/**
 * Role: page object for the Products page (/inventory.html): the product cards and their
 * "Add to cart" / "Remove" buttons.
 */
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { Product } from '../data/products';

export class InventoryPage extends BasePage {
  protected readonly path = '/inventory.html';
  protected readonly titleText = 'Products';

  /** All product cards on the page. */
  readonly items: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
  }

  /**
   * Returns the "Add to cart" button of one product. The button's data-test value is
   * "add-to-cart-" followed by the product slug.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   By addToCartButton(Product product) {
   *       return By.cssSelector("[data-test='add-to-cart-" + product.getSlug() + "']");
   *   }
   *
   * DIFFERENCE: A Playwright Locator is a description of how to find the element; it is
   *   looked up fresh every time it is used, so it can never go "stale". The closest
   *   Selenium equivalent is returning a By (not a WebElement): a stored WebElement throws
   *   StaleElementReferenceException once React redraws the button.
   */
  addToCartButton(product: Product): Locator {
    return this.page.getByTestId(`add-to-cart-${product.slug}`);
  }

  /**
   * Returns the "Remove" button of one product. It replaces the "Add to cart" button once
   * the product is in the cart; its data-test value is "remove-" followed by the slug.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   By removeButton(Product product) {
   *       return By.cssSelector("[data-test='remove-" + product.getSlug() + "']");
   *   }
   *
   * DIFFERENCE: Same as addToCartButton. Note that one slug contains "." and "()"
   *   ("test.allthethings()-t-shirt-(red)"); getByTestId matches the attribute value
   *   exactly, while a hand-written CSS/XPath string needs careful quoting for such values.
   */
  removeButton(product: Product): Locator {
    return this.page.getByTestId(`remove-${product.slug}`);
  }

  /**
   * Clicks "Add to cart" for one product.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(addToCartButton(product)))
   *       .click();
   *
   * DIFFERENCE: Playwright's click() auto-waits until the button is visible, stable and
   *   enabled; Selenium needs the explicit WebDriverWait in front of click().
   */
  async addToCart(product: Product): Promise<void> {
    await this.addToCartButton(product).click();
  }
}
