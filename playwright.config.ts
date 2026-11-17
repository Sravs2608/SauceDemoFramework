/**
 * Role: the central settings file of the framework. It tells Playwright where the tests
 * are, which browsers to run them on, how many run in parallel, what to record when a test
 * fails, and which login session every test starts with.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   Selenium has no single config file, because Selenium is only a browser-driving library;
 *   the same settings are spread over several files and classes:
 *
 *   // pom.xml           -> dependencies (selenium-java, junit-jupiter / testng, allure)
 *   // testng.xml        -> which tests run, parallel="methods" thread-count="4", one
 *   //                      <test> block per browser with <parameter name="browser" .../>
 *   // config.properties -> base.url=https://www.saucedemo.com
 *   // DriverFactory.java:
 *   public static WebDriver create(String browser) {
 *       return switch (browser) {
 *           case "firefox" -> new FirefoxDriver();
 *           case "safari"  -> new SafariDriver();
 *           default        -> new ChromeDriver(new ChromeOptions().addArguments("--headless=new"));
 *       };
 *   }
 *   // Retries     -> a TestNG IRetryAnalyzer class (or the JUnit Pioneer @RetryingTest)
 *   // Screenshots -> a TestNG listener / JUnit extension calling
 *   //                ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE) on failure
 *   // Report      -> Allure or ExtentReports added as a separate dependency
 *
 * DIFFERENCE: Playwright Test is a browser library AND a test runner, so browsers
 *   ("projects"), parallel workers, retries, screenshots, videos, traces, the HTML report
 *   and the base URL are all switched on here in a few lines. In Selenium each of those is
 *   a separate piece you choose, add and wire together yourself. Trace viewer and
 *   storageState have no Selenium equivalent at all (see docs/SELENIUM-COMPARISON.md).
 *   WebKit (Safari's engine) runs on Windows and Linux with Playwright; SafariDriver only
 *   runs on macOS.
 */
import { defineConfig, devices } from '@playwright/test';
import { env, STORAGE_STATE } from './src/utils/env';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',

  // Logs in once before the whole run and saves the session (see global-setup.ts).
  globalSetup: './global-setup.ts',

  // Run all tests in parallel, including tests inside the same file. Safe because every
  // test gets its own isolated browser context (own cookies, own cart).
  fullyParallel: true,

  // In CI, fail the run if someone committed test.only by mistake.
  forbidOnly: isCI,

  // Retry only in CI. Locally a failure should be seen and understood immediately.
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,

  // 'list' prints progress in the terminal; 'html' builds the report in playwright-report/.
  reporter: isCI
    ? [['list'], ['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    // Lets page objects use relative addresses such as page.goto('/cart.html').
    baseURL: env.baseUrl,

    // SauceDemo marks elements with data-test="..."; this makes getByTestId() read it.
    testIdAttribute: 'data-test',

    // Every test starts already logged in as standard_user (session saved by global setup).
    storageState: STORAGE_STATE,

    // Evidence for failures: a full trace on the first retry, plus screenshot and video.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // One "project" per browser. The same tests run once in each project.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // MOB-01: the smoke suite again on a phone-sized screen (Pixel 7 emulation).
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, grep: /@smoke/ },
  ],
});
