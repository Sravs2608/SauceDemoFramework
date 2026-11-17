/**
 * Role: visual comparison tests (plan section 5, USR-04). A screenshot of the Products
 * page as standard_user is stored in Git as the approved picture ("baseline", in the
 * folder visual-user.spec.ts-snapshots next to this file). Each run takes a new screenshot
 * and compares it with the baseline pixel by pixel.
 *
 * Why this exists: visual_user sees the same texts and elements as everyone else, so
 * ordinary assertions pass; only a picture comparison notices a wrong image, a misaligned
 * button or a rotated icon.
 *
 * Limits (important):
 *   - Screenshots differ between browsers and operating systems (fonts, anti-aliasing),
 *     so a baseline is only valid for the browser + OS it was made on. Ours was made with
 *     Chromium on Windows. These tests are therefore skipped on other browsers and on
 *     other systems, which includes the Linux machines of GitHub Actions.
 *   - To approve a new baseline after an intended design change:
 *       npx playwright test visual-user --project=chromium --update-snapshots
 */
import { test, expect } from '../../../src/fixtures/test';
import { users } from '../../../src/data/users';
import { PRODUCT_COUNT } from '../../../src/data/products';

const BASELINE = 'products-page.png';
const SCREENSHOT_OPTIONS = {
  fullPage: true,
  // Allow tiny rendering noise (up to 1% of the pixels); real defects change far more.
  maxDiffPixelRatio: 0.01,
};

test.beforeEach(async ({ browserName, isMobile }) => {
  // Justified skip: a pixel baseline is only valid for the browser + OS it was made on.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(
    browserName !== 'chromium' || isMobile || process.platform !== 'win32',
    'The baseline screenshot exists only for desktop Chromium on Windows.',
  );
});

/**
 * USR-04 (baseline check): the Products page as standard_user matches the approved
 * screenshot. This proves the comparison itself works and the baseline is still valid;
 * without it, the visual_user test below could "fail as expected" for the wrong reason.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   // Selenium has no screenshot comparison. Usual workaround: the AShot library
 *   // (ru.yandex.qatools.ashot) or a paid service (Applitools, Percy).
 *   @Test @Tag("regression")
 *   void usr04_standardUserMatchesBaseline() throws IOException {
 *       injectSessionCookie();
 *       driver.get(baseUrl + "/inventory.html");
 *       wait.until(ExpectedConditions.numberOfElementsToBe(By.cssSelector("[data-test='inventory-item']"), 6));
 *       BufferedImage actual = new AShot()
 *           .shootingStrategy(ShootingStrategies.viewportPasting(100))
 *           .takeScreenshot(driver).getImage();
 *       BufferedImage expected = ImageIO.read(new File("src/test/resources/baselines/products-page.png"));
 *       ImageDiff diff = new ImageDiffer().makeDiff(expected, actual);
 *       assertFalse(diff.hasDiff(), "Products page differs from the baseline");
 *   }
 *
 * DIFFERENCE: toHaveScreenshot is built in: it waits until two consecutive screenshots
 *   are identical (page has stopped changing), freezes animations, compares with the
 *   stored file, and on failure attaches expected / actual / diff pictures to the report.
 *   With Selenium you add a library, manage baseline files and thresholds yourself, and
 *   attach the diff image to the report by hand.
 */
test('USR-04: baseline - standard_user Products page matches the approved screenshot', { tag: '@regression' }, async ({
  page,
  inventoryPage,
}) => {
  await test.step('Open the Products page as standard_user', async () => {
    await inventoryPage.open();
    await expect(inventoryPage.items).toHaveCount(PRODUCT_COUNT);
  });

  await test.step('Page looks the same as the approved screenshot', async () => {
    // mask: the footer text contains the current year ("© 2026"); it is painted over in
    // both pictures so the comparison does not start failing every January.
    await expect(page).toHaveScreenshot(BASELINE, {
      ...SCREENSHOT_OPTIONS,
      mask: [page.getByTestId('footer-copy')],
    });
  });
});

/**
 * USR-04: the visual comparison catches the UI differences shown to visual_user.
 * Expected: the Products page looks the same for every user.
 *
 * KNOWN DEFECT DEF-V1 (observed on the live site, 2026-11-16) for visual_user: the
 * Backpack shows a wrong picture, prices are different numbers on every page load, two
 * product names are right-aligned, one "Add to cart" button is misaligned and the menu
 * icon is drawn differently. The test is marked test.fail: it is expected to fail while
 * the differences exist, which shows that the comparison detects them.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test(groups = "regression", expectedExceptions = AssertionError.class,
 *         description = "DEF-V1: visual differences for visual_user")              // TestNG
 *   public void usr04_visualUserMatchesBaseline() throws IOException {
 *       driver.get(baseUrl);
 *       loginPage.login(Users.VISUAL);
 *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
 *       BufferedImage actual = new AShot()
 *           .shootingStrategy(ShootingStrategies.viewportPasting(100))
 *           .takeScreenshot(driver).getImage();
 *       BufferedImage expected = ImageIO.read(new File("src/test/resources/baselines/products-page.png"));
 *       Assert.assertFalse(new ImageDiffer().makeDiff(expected, actual).hasDiff());
 *   }
 *
 * DIFFERENCE: Same as the baseline test: built in versus an added library. Both tools
 *   share the real limitation of pixel comparison: baselines are tied to one browser and
 *   operating system.
 */
test.describe('USR-04 visual_user', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * See the block above: compares visual_user's Products page with the standard_user
   * baseline and is expected to fail (DEF-V1).
   *
   * SELENIUM JAVA EQUIVALENT:
   *   // see usr04_visualUserMatchesBaseline() in the block above (AShot + ImageDiffer,
   *   // TestNG expectedExceptions = AssertionError.class)
   *
   * DIFFERENCE: toHaveScreenshot is built in; Selenium needs AShot or a visual-testing
   *   service.
   */
  test.fail('USR-04: visual_user Products page matches the approved screenshot', {
    tag: '@regression',
    annotation: { type: 'defect', description: 'DEF-V1: wrong Backpack picture, changing prices, misaligned names/button, different menu icon' },
  }, async ({ page, loginAs, inventoryPage }) => {
    await test.step('Log in as visual_user', async () => {
      await loginAs(users.visual);
      await expect(inventoryPage.items).toHaveCount(PRODUCT_COUNT);
    });

    await test.step('Expected: page looks the same as the approved screenshot', async () => {
      // Fails today: the picture differs from the baseline (DEF-V1).
      await expect(page).toHaveScreenshot(BASELINE, {
        ...SCREENSHOT_OPTIONS,
        mask: [page.getByTestId('footer-copy')],
      });
    });
  });
});
