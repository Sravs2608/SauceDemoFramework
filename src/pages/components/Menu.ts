/**
 * Role: the slide-out "burger" menu available on every logged-in page (All Items, About,
 * Logout, Reset App State). Like Header, it is a component object shared through BasePage.
 */
import { type Locator, type Page } from '@playwright/test';

export class Menu {
  readonly openButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    // The burger button has no data-test attribute, so we find it the way a user or a
    // screen reader does: a button whose accessible name is "Open Menu".
    this.openButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
  }

  /**
   * Opens the side menu.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   new WebDriverWait(driver, Duration.ofSeconds(10))
   *       .until(ExpectedConditions.elementToBeClickable(By.id("react-burger-menu-btn")))
   *       .click();
   *
   * DIFFERENCE: Playwright can locate by ARIA role and accessible name (getByRole), which
   *   matches what the user sees and survives id/class changes. Selenium has no role
   *   locator; the usual choice is By.id / By.cssSelector, or an XPath on the button text.
   */
  async open(): Promise<void> {
    await this.openButton.click();
  }

  /**
   * Opens the menu and clicks Logout. The menu slides in with an animation; the click on
   * Logout waits automatically until the link is visible and has stopped moving.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
   *   wait.until(ExpectedConditions.elementToBeClickable(By.id("react-burger-menu-btn"))).click();
   *   wait.until(ExpectedConditions.elementToBeClickable(
   *       By.cssSelector("[data-test='logout-sidebar-link']"))).click();
   *
   * DIFFERENCE: Playwright checks that the element is "stable" (not animating) before it
   *   clicks. Selenium's elementToBeClickable only checks visible + enabled, so on animated
   *   menus the click can land while the menu is still sliding and fail with
   *   ElementClickInterceptedException; teams then add extra waits or a JavaScript click.
   */
  async logout(): Promise<void> {
    await this.open();
    await this.logoutLink.click();
  }
}
