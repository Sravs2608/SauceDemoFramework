/**
 * Role: page object for the detail page of one product (/inventory-item.html?id=<id>):
 * its name, description, price, the add/remove button and "Back to products".
 * Locators verified on the live site on 2026-11-16. This page has no heading element.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { Product } from '../data/products';

export class ProductDetailPage extends BasePage {
  protected readonly path = '/inventory-item.html';
  protected readonly titleText = null;

  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  /** On this page the button is simply "add-to-cart" (no product slug in the value). */
  readonly addToCartButton: Locator;
  /** Replaces the add button once the product is in the cart ("remove"). */
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('inventory-item-name');
    this.description = page.getByTestId('inventory-item-desc');
    this.price = page.getByTestId('inventory-item-price');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.removeButton = page.getByTestId('remove');
    this.backButton = page.getByTestId('back-to-products');
  }

  /**
   * Checks that the browser is on the detail page of the given product: the address ends
   * with "?id=" and that product's id.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(5))
   *       .until(ExpectedConditions.urlToBe(baseUrl + "/inventory-item.html?id=" + product.getId()));
   *
   * DIFFERENCE: toHaveURL retries until the address matches and resolves the relative
   *   address against baseURL. Selenium needs an explicit wait and the full URL string.
   */
  async expectLoadedFor(product: Product): Promise<void> {
    await expect(this.page).toHaveURL(`${this.path}?id=${product.id}`);
  }

  /**
   * Clicks "Back to products" to return to the Products page.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(
   *           By.cssSelector("[data-test='back-to-products']")))
   *       .click();
   *
   * DIFFERENCE: Auto-waiting click in Playwright versus explicit WebDriverWait in Selenium.
   */
  async backToProducts(): Promise<void> {
    await this.backButton.click();
  }
}
