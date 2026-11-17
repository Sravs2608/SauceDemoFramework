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

  // Retries: a failed test is run again, 1 time locally and up to 2 times in CI. A test
  // that fails and then passes is reported as "flaky" (not as passed), so the problem
  // stays visible. Retries protect the run from one-off environment hiccups (we saw
  // random network errors and timeouts); they are not a way to hide a real defect.
  retries: isCI ? 2 : 1,
  // 4 locally as a safe default: with Playwright's default (8 on this machine) full runs
  // had random timeouts. The cause is not confirmed yet. 2 in CI (smaller machines).
  workers: isCI ? 2 : 4,

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

    // Trace = a recording of every step (DOM snapshot, network, console) that you open
    // with `npx playwright show-trace`. 'on-first-retry' records it only when a failed
    // test is retried, so passing tests pay no cost and every retried failure has one.
    trace: 'on-first-retry',

    // Screenshot of the page at the moment a test fails. Nothing is saved for passes.
    screenshot: 'only-on-failure',

    // Video of the whole test. It is recorded for every test but kept only when the
    // test fails; videos of passing tests are deleted.
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
