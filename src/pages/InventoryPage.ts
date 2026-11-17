/**
 * Role: page object for the Products page (/inventory.html): the product cards, their
 * "Add to cart" / "Remove" buttons, the sort dropdown and the links to product details.
 */
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { Product, SortOption } from '../data/products';

export class InventoryPage extends BasePage {
  protected readonly path = '/inventory.html';
  protected readonly titleText = 'Products';

  /** All product cards on the page. */
  readonly items: Locator;
  /** The product names, in the order shown on the page. */
  readonly itemNames: Locator;
  /** The product prices, in the order shown on the page. */
  readonly itemPrices: Locator;
  /** The product pictures, one per card. */
  readonly itemImages: Locator;
  /** The sort dropdown (a normal HTML <select>). */
  readonly sortDropdown: Locator;
  /** The label that shows which sort option is active. */
  readonly activeSortOption: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemImages = this.items.getByRole('img');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.activeSortOption = page.getByTestId('active-option');
  }

  /**
   * Returns the card of one product: of all the cards, the one that contains that
   * product's title link ("item-<id>-title-link").
   *
   * SELENIUM JAVA EQUIVALENT:
   *   WebElement card(Product product) {
   *       return driver.findElements(By.cssSelector("[data-test='inventory-item']")).stream()
   *           .filter(c -> !c.findElements(By.cssSelector(
   *               "[data-test='item-" + product.getId() + "-title-link']")).isEmpty())
   *           .findFirst()
   *           .orElseThrow();
   *   }
   *   // or one XPath:
   *   // //*[@data-test='inventory-item'][.//*[@data-test='item-4-title-link']]
   *
   * DIFFERENCE: filter({ has }) narrows a list of elements to those containing another
   *   element, and the result is still a lazy locator. Selenium has no filter on locators;
   *   you loop over WebElements (which can go stale) or write an XPath with a nested
   *   condition, which CSS cannot express.
   */
  card(product: Product): Locator {
    return this.items.filter({ has: this.titleLink(product) });
  }

  /**
   * Returns the product-name link of one product; clicking it opens the detail page.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   By titleLink(Product product) {
   *       return By.cssSelector("[data-test='item-" + product.getId() + "-title-link']");
   *   }
   *
   * DIFFERENCE: Same idea; getByTestId avoids writing the attribute selector by hand.
   */
  titleLink(product: Product): Locator {
    return this.page.getByTestId(`item-${product.id}-title-link`);
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

  /**
   * Clicks "Remove" for one product on the Products page.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(removeButton(product)))
   *       .click();
   *
   * DIFFERENCE: Auto-waiting click in Playwright versus explicit WebDriverWait in Selenium.
   */
  async removeFromCart(product: Product): Promise<void> {
    await this.removeButton(product).click();
  }

  /**
   * Chooses an option in the sort dropdown, by its value ("az", "za", "lohi", "hilo").
   *
   * SELENIUM JAVA EQUIVALENT:
   *   import org.openqa.selenium.support.ui.Select;
   *
   *   WebElement dropdown = new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(
   *           By.cssSelector("[data-test='product-sort-container']")));
   *   new Select(dropdown).selectByValue(option.getValue());
   *
   * DIFFERENCE: selectOption() is a method of every locator and auto-waits for the
   *   dropdown and the option. Selenium needs the separate Select helper class wrapped
   *   around a WebElement, plus a wait. Both only work on a real <select>; a custom
   *   dropdown built from <div>s is clicked like any other element in either tool.
   */
  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option.value);
  }

  /**
   * Opens the detail page of one product by clicking its name.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(titleLink(product)))
   *       .click();
   *
   * DIFFERENCE: Auto-waiting click in Playwright versus explicit WebDriverWait in Selenium.
   */
  async openProductDetail(product: Product): Promise<void> {
    await this.titleLink(product).click();
  }
}
