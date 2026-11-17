/**
 * Role: the header bar shown on every logged-in page (cart icon and cart badge).
 * It is a "component object": a piece of UI that appears on many pages is described once
 * and reused by every page object through BasePage, instead of being copied into each one.
 */
import { expect, type Locator, type Page } from '@playwright/test';

export class Header {
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    // The badge element only exists while the cart has items; it is absent for an empty cart.
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  /**
   * Clicks the cart icon to open the cart page.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(
   *           By.cssSelector("[data-test='shopping-cart-link']")))
   *       .click();
   *
   * DIFFERENCE: Playwright's click() waits by itself until the element is attached, visible,
   *   stable and enabled, so no explicit wait is written. Selenium's click() acts immediately,
   *   so a WebDriverWait is normally added in front of it.
   */
  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /**
   * Checks the number on the cart badge. For 0 it checks that the badge is not there at all,
   * because the application removes the badge when the cart is empty.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
   *   By badge = By.cssSelector("[data-test='shopping-cart-badge']");
   *   if (count == 0) {
   *       wait.until(ExpectedConditions.numberOfElementsToBe(badge, 0));
   *   } else {
   *       wait.until(ExpectedConditions.textToBe(badge, String.valueOf(count)));
   *   }
   *
   * DIFFERENCE: Playwright's expect() is a "web-first assertion": it re-checks the page until
   *   the condition is true or 5 seconds pass, so wait and assertion are one line. In Selenium
   *   the wait (WebDriverWait) and the assertion (assertEquals) are separate things, and a
   *   plain assertEquals(badge.getText(), "1") fails if the badge has not updated yet.
   */
  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toHaveCount(0);
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }
}
