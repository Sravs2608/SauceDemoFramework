/**
 * Role: the footer shown on every logged-in page: three social-media links (each opens
 * in a NEW browser tab, target="_blank") and the copyright line with the current year.
 * Like Header and Menu, it is a component object shared through BasePage. It has only
 * locators, no actions; tests click the links themselves because what they do next
 * (wait for the new tab) is the point of those tests.
 *
 * Verified on the live site on 2026-11-16:
 *   social-x        -> https://x.com/saucelabs
 *   social-facebook -> https://www.facebook.com/saucelabs
 *   social-linkedin -> https://www.linkedin.com/company/sauce-labs/
 *   footer-copy     -> "© <year> Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy"
 *
 * Selenium Java equivalent: a Footer class holding By locators
 * (By.cssSelector("[data-test='social-linkedin']") and so on), created in BasePage.
 */
import { type Locator, type Page } from '@playwright/test';

export class Footer {
  readonly xLink: Locator;
  readonly facebookLink: Locator;
  readonly linkedInLink: Locator;
  readonly copyright: Locator;

  constructor(page: Page) {
    this.xLink = page.getByTestId('social-x');
    this.facebookLink = page.getByTestId('social-facebook');
    this.linkedInLink = page.getByTestId('social-linkedin');
    this.copyright = page.getByTestId('footer-copy');
  }
}
