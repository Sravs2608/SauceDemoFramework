/**
 * Role: the parent of every page object. It holds what all pages share: the Playwright
 * `page`, the header and menu components, the page title element, and the two actions
 * every page needs (open it, check that it is loaded). Each child class only declares its
 * own address, its expected title and its own elements.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { Header } from './components/Header';
import { Menu } from './components/Menu';
import { Footer } from './components/Footer';

export abstract class BasePage {
  readonly page: Page;
  readonly header: Header;
  readonly menu: Menu;
  readonly footer: Footer;
  /** The heading under the header bar, e.g. "Products" or "Your Cart". */
  readonly title: Locator;

  /** Address of the page relative to BASE_URL, e.g. '/cart.html'. */
  protected abstract readonly path: string;
  /** Expected heading text, or null for a page without one (the login page). */
  protected abstract readonly titleText: string | null;

  constructor(page: Page) {
    this.page = page;
    this.header = new Header(page);
    this.menu = new Menu(page);
    this.footer = new Footer(page);
    this.title = page.getByTestId('title');
  }

  /**
   * Opens this page directly by its address. The address is relative; Playwright puts the
   * `baseURL` from playwright.config.ts in front of it.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   driver.get(ConfigReader.get("BASE_URL") + path);
   *
   * DIFFERENCE: Playwright has a built-in `baseURL` setting, so page objects only carry the
   *   relative path. Selenium has no baseURL concept; you join the strings yourself in a
   *   BasePage or config helper.
   */
  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  /**
   * Checks that the browser is really on this page: the address matches and, when the page
   * has a heading, the heading shows the expected text.
   *
   * SELENIUM JAVA EQUIVALENT:
   *   WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
   *   wait.until(ExpectedConditions.urlToBe(baseUrl + path));
   *   if (titleText != null) {
   *       wait.until(ExpectedConditions.textToBe(By.cssSelector("[data-test='title']"), titleText));
   *   }
   *
   * DIFFERENCE: toHaveURL and toHaveText retry automatically until they pass or time out,
   *   and on failure the report shows expected vs actual plus the last page state. In
   *   Selenium a failed wait throws a TimeoutException with far less detail, and comparing
   *   driver.getCurrentUrl() without a wait fails if the navigation has not finished.
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(this.path);
    if (this.titleText !== null) {
      await expect(this.title).toHaveText(this.titleText);
    }
  }
}
