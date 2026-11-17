# Playwright vs Selenium Java — feature by feature

This document grows with the framework. Every time a feature is built, a section is added
here **in the same commit as the code**, so the comparison always matches what is really in
the repo. Each section quotes Playwright code from this framework and behaviour verified on
the live site.

The same comparison also lives next to the code: every method in `src/` and every `test()`
in `tests/` carries a `SELENIUM JAVA EQUIVALENT` comment block. Use the code comments for
the line-by-line view and this document for the bigger picture.

Each section has the same six parts:

1. **What it does** — the feature in simple language.
2. **Playwright (our code)** — a short snippet taken from this framework.
3. **Selenium Java equivalent** — a Selenium 4 snippet (JUnit 5 unless stated).
4. **Key differences** — waits, locators, setup, reporting.
5. **Which is better here and why.**
6. **No direct equivalent?** — if Selenium cannot do it natively, the usual workaround.

The Selenium snippets are written to be correct Selenium 4 / JUnit 5 code, but they have
**not been compiled or run** in this repository (there is no Java project here).

---

## 1. Settings and secrets (`.env`)

**Files:** `.env.example`, `src/utils/env.ts`, `src/data/users.ts`

### 1. What it does
The URL, usernames and password are not written in any test. They live in a local `.env`
file that Git ignores, and one small file (`env.ts`) reads them and stops the run with a
clear message if one is missing. In GitHub Actions the same names are supplied by the
pipeline, with the password coming from an encrypted secret.

### 2. Playwright (our code)
```ts
// src/utils/env.ts
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);          // built into Node, no extra package
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required setting "${name}". Copy .env.example to .env ...`);
  }
  return value.trim();
}

export const env = {
  baseUrl: required('BASE_URL'),
  standardUser: required('STANDARD_USER'),
  lockedOutUser: required('LOCKED_OUT_USER'),
  password: required('SAUCE_PASSWORD'),
};
```

### 3. Selenium Java equivalent
```java
// src/test/java/config/ConfigReader.java
public final class ConfigReader {
    private static final Properties PROPS = new Properties();

    static {
        // config.properties is git-ignored; config.properties.example is committed
        try (InputStream in = Files.newInputStream(Path.of("config.properties"))) {
            PROPS.load(in);
        } catch (IOException ignored) {
            // no file (for example in CI): fall back to environment variables only
        }
    }

    public static String required(String name) {
        String value = System.getenv(name);          // CI value wins
        if (value == null || value.isBlank()) {
            value = PROPS.getProperty(name);
        }
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required setting: " + name);
        }
        return value.trim();
    }
}

// usage
String baseUrl = ConfigReader.required("BASE_URL");
```

### 4. Key differences
| | Playwright + Node | Selenium Java |
|---|---|---|
| File format | `.env` (NAME=value) | `config.properties`, or Maven `-Dname=value` |
| Loading | `process.loadEnvFile()` built into Node | `Properties.load()`, or the dotenv-java library |
| Where it is used | `baseURL` in `playwright.config.ts` | A `BasePage`/`BaseTest` joins the URL by hand |
| CI | Environment variables from the workflow | Same |

### 5. Which is better here and why
Neither tool wins: this is ordinary configuration handling, and the discipline is the same
(nothing secret in Git, fail fast with a message that names the variable but not the value).
Playwright is slightly more convenient only because the value plugs straight into the
built-in `baseURL` setting.

### 6. No direct equivalent?
Not applicable; both can do this. One caution that applies to **both** tools: values typed
into a field appear in reports (Playwright's trace and HTML report show `fill("...")`
arguments; Allure shows `@Step` parameters). SauceDemo's password is public, so this is
acceptable here; on a real project the report artifacts must be treated as sensitive.

### Related: ESLint
`eslint.config.mjs` adds a safety net Selenium Java does not need: it fails the build when
an `await` is missing in front of a Playwright call. In Java every WebDriver call blocks
until it returns, so that mistake cannot happen; in TypeScript a forgotten `await` lets the
test run ahead of the browser and creates flaky tests. The Playwright ESLint plugin also
flags hard waits and `test.only`. The nearest Java tools are Checkstyle and SonarLint.

---

## 2. Locators (`getByTestId` / `getByRole` vs `By.cssSelector`)

**Files:** every file in `src/pages/`

### 1. What it does
A locator tells the tool how to find an element on the page. SauceDemo marks almost every
element with a `data-test="..."` attribute meant for automation, so we use that first, and
fall back to "find it the way a user would" (by role and visible name) where there is none.

### 2. Playwright (our code)
```ts
// playwright.config.ts: tell getByTestId which attribute the site uses
use: { testIdAttribute: 'data-test' }

// src/pages/LoginPage.ts
this.usernameInput = page.getByTestId('username');
this.loginButton   = page.getByTestId('login-button');

// src/pages/components/Menu.ts: no data-test on the burger button, so use role + name
this.openButton = page.getByRole('button', { name: 'Open Menu' });

// src/pages/CartPage.ts: chaining = search only inside the cart list
const cartList = page.getByTestId('cart-list');
this.itemNames = cartList.getByTestId('inventory-item-name');

// src/pages/InventoryPage.ts: locator built from test data
addToCartButton(product: Product): Locator {
  return this.page.getByTestId(`add-to-cart-${product.slug}`);
}
```

### 3. Selenium Java equivalent
```java
By usernameInput = By.cssSelector("[data-test='username']");
By loginButton   = By.cssSelector("[data-test='login-button']");

// no role locator in Selenium: use the id, or XPath on the text
By openMenuButton = By.id("react-burger-menu-btn");
// By.xpath("//button[normalize-space()='Open Menu']")

// chaining
WebElement cartList = driver.findElement(By.cssSelector("[data-test='cart-list']"));
List<WebElement> itemNames =
    cartList.findElements(By.cssSelector("[data-test='inventory-item-name']"));

// locator built from test data
By addToCartButton(Product product) {
    return By.cssSelector("[data-test='add-to-cart-" + product.getSlug() + "']");
}
```

### 4. Key differences
| | Playwright `Locator` | Selenium `By` / `WebElement` |
|---|---|---|
| When is the element looked up? | Every time the locator is used (lazy) | `findElement` looks it up once and returns a `WebElement` |
| Stale elements | Cannot happen | `StaleElementReferenceException` when the page redraws after you stored a `WebElement` |
| More than one match | Error ("strict mode violation") on actions | `findElement` silently takes the first match |
| Test-id attribute | `getByTestId`, attribute name set once in config | Hand-written CSS attribute selector each time |
| Role / label / text | `getByRole`, `getByLabel`, `getByText` built in | No equivalent; XPath or CSS |
| Odd characters in the value | `getByTestId('add-to-cart-test.allthethings()-t-shirt-(red)')` just works | Works inside a quoted attribute selector, but easy to get wrong with id/class shortcuts |

We met strict mode for real while verifying the site: reading `inventory-item-name` on the
Products page failed because six elements matched. Selenium would have returned the first
product without complaint, which is how tests end up checking the wrong element.

### 5. Which is better here and why
Playwright. The locators are lazy (no stale elements when React redraws), strict (no
silent "first match"), and `getByRole` covers the one element that has no `data-test`.
With `@FindBy` and PageFactory, Selenium page objects look tidy too, but the stale-element
and first-match problems remain.

### 6. No direct equivalent?
`getByRole` / `getByLabel` have no Selenium equivalent. The workaround is XPath or CSS on
ids, classes or text, which is more brittle. Selenium 4's "relative locators"
(`with(By.tagName("input")).below(...)`) are a different idea and not a substitute.

---

## 3. Auto-waiting and web-first assertions vs `WebDriverWait`

**Files:** `src/pages/components/Header.ts`, `src/pages/BasePage.ts`, all tests

### 1. What it does
Web pages update a moment after you act. The tool must wait for the page to be ready
before the next click or check, otherwise tests fail at random ("flaky"). SauceDemo is a
React app: while verifying it we saw that the page content changes slightly *after* the
URL changes, exactly the kind of timing gap that causes flaky tests.

### 2. Playwright (our code)
```ts
// Actions wait by themselves (visible, stable, enabled, not covered) before acting
await this.cartLink.click();
await this.usernameInput.fill(user.username);

// Assertions retry until true or the timeout (5 s by default) passes
await expect(this.page).toHaveURL(this.path);
await expect(this.title).toHaveText(this.titleText);
await expect(this.cartBadge).toHaveText(String(count));
await expect(this.cartBadge).toHaveCount(0);                   // badge is gone
await expect(cartPage.itemNames).toHaveText([product.name]);   // exactly this list
```
There is no `waitForTimeout` (hard wait) anywhere in the framework.

### 3. Selenium Java equivalent
```java
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

wait.until(ExpectedConditions.elementToBeClickable(
        By.cssSelector("[data-test='shopping-cart-link']"))).click();

WebElement username = wait.until(ExpectedConditions.visibilityOfElementLocated(
        By.cssSelector("[data-test='username']")));
username.clear();
username.sendKeys(user.getUsername());

wait.until(ExpectedConditions.urlToBe(baseUrl + "/cart.html"));
wait.until(ExpectedConditions.textToBe(By.cssSelector("[data-test='title']"), "Your Cart"));
wait.until(ExpectedConditions.textToBe(By.cssSelector("[data-test='shopping-cart-badge']"), "1"));
wait.until(ExpectedConditions.numberOfElementsToBe(
        By.cssSelector("[data-test='shopping-cart-badge']"), 0));

// list of texts: wait first, then collect and compare
By cartItemNames = By.cssSelector("[data-test='cart-list'] [data-test='inventory-item-name']");
wait.until(ExpectedConditions.numberOfElementsToBe(cartItemNames, 1));
List<String> names = driver.findElements(cartItemNames)
    .stream().map(WebElement::getText).toList();
assertEquals(List.of("Sauce Labs Backpack"), names);
```

### 4. Key differences
| | Playwright | Selenium |
|---|---|---|
| Waiting before an action | Automatic, part of `click()` / `fill()` | You add `WebDriverWait` + `ExpectedConditions` |
| "Stable" (not animating) check | Yes | No; clicks during animations can be intercepted |
| Assertion | `expect(locator)` retries | `assertEquals` checks once; wait separately |
| Failure message | Expected vs received, locator, call log | `TimeoutException` with the condition name |
| Implicit wait | Not needed | Exists, but mixing implicit and explicit waits is discouraged |

### 5. Which is better here and why
Playwright. Waiting is the largest source of flaky UI tests, and here it is the default
behaviour instead of something each engineer must remember on each line. The Selenium
version is correct but roughly twice as long, and a single forgotten wait brings back
flakiness.

### 6. No direct equivalent?
Selenium has no retrying assertions. The workaround is `WebDriverWait` before `assertEquals`,
or the Awaitility library (`await().untilAsserted(...)`), or a wrapper such as Selenide,
which adds Playwright-style auto-waiting on top of Selenium.

---

## 4. Page Object Model

**Files:** `src/pages/BasePage.ts`, the page classes, `src/pages/components/`

### 1. What it does
Each screen gets one class that knows where its elements are and what a user can do
there. Tests read like business steps (`loginPage.login(users.standard)`), and when the
application changes a locator, one class is fixed instead of every test. Parts that appear
on many screens (header, menu) are "components" written once.

### 2. Playwright (our code)
```ts
// src/pages/BasePage.ts
export abstract class BasePage {
  readonly header: Header;
  readonly menu: Menu;
  readonly title: Locator;
  protected abstract readonly path: string;
  protected abstract readonly titleText: string | null;

  constructor(page: Page) {
    this.page = page;
    this.header = new Header(page);
    this.menu = new Menu(page);
    this.title = page.getByTestId('title');
  }

  async open(): Promise<void> {
    await this.page.goto(this.path);            // relative to baseURL
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(this.path);
    if (this.titleText !== null) {
      await expect(this.title).toHaveText(this.titleText);
    }
  }
}

// src/pages/CartPage.ts
export class CartPage extends BasePage {
  protected readonly path = '/cart.html';
  protected readonly titleText = 'Your Cart';
  // ...locators in the constructor...
  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
```

### 3. Selenium Java equivalent
```java
public abstract class BasePage {
    protected final WebDriver driver;
    protected final WebDriverWait wait;
    protected final Header header;
    private final By title = By.cssSelector("[data-test='title']");

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        this.header = new Header(driver);
    }

    protected abstract String path();
    protected abstract String titleText();

    public void open() {
        driver.get(ConfigReader.required("BASE_URL") + path());
    }

    public void expectLoaded() {
        wait.until(ExpectedConditions.urlToBe(ConfigReader.required("BASE_URL") + path()));
        if (titleText() != null) {
            wait.until(ExpectedConditions.textToBe(title, titleText()));
        }
    }
}

public class CartPage extends BasePage {
    private final By checkoutButton = By.cssSelector("[data-test='checkout']");

    public CartPage(WebDriver driver) { super(driver); }

    @Override protected String path() { return "/cart.html"; }
    @Override protected String titleText() { return "Your Cart"; }

    public void checkout() {
        wait.until(ExpectedConditions.elementToBeClickable(checkoutButton)).click();
    }
}
```

### 4. Key differences
- The pattern is the same in both tools; it comes from the Selenium world.
- Playwright page objects hold `Locator`s (lazy), so they can be created in the constructor
  before the page is even open. Selenium page objects should hold `By` values (or use
  `@FindBy` + `PageFactory`, which builds lazy proxies); holding real `WebElement`s goes stale.
- Selenium page objects carry a `WebDriverWait`; Playwright ones do not need it.
- Our page objects expose locators publicly so that tests can assert on them with `expect`.
  Actions live in the page object, business assertions live in the test. The only checks
  inside page objects are state checks (`expectLoaded`, `expectCartCount`).

### 5. Which is better here and why
A tie on the pattern, with less code on the Playwright side because the waits disappear.
A reviewer coming from Selenium can read these classes straight away.

### 6. No direct equivalent?
Not applicable; both support the pattern.

---

## 5. Configuration (`playwright.config.ts`)

**File:** `playwright.config.ts`

### 1. What it does
One file answers the run-level questions: where are the tests, which browsers, how many in
parallel, retry or not, what evidence to keep on failure, which report, which base URL.

### 2. Playwright (our code)
```ts
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: isCI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.baseUrl,
    testIdAttribute: 'data-test',
    storageState: STORAGE_STATE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, grep: /@smoke/ },
  ],
});
```

### 3. Selenium Java equivalent
Selenium is a browser-driving library, not a test runner, so the same settings are spread
over several files. A typical TestNG setup:

```xml
<!-- testng.xml: what runs, in parallel, once per browser -->
<suite name="SauceDemo" parallel="methods" thread-count="4">
  <test name="chromium">
    <parameter name="browser" value="chrome"/>
    <packages><package name="tests.ui.*"/></packages>
  </test>
  <test name="firefox">
    <parameter name="browser" value="firefox"/>
    <packages><package name="tests.ui.*"/></packages>
  </test>
</suite>
```
```java
// DriverFactory.java: which browser, headless or not, one driver per thread
public final class DriverFactory {
    private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();

    public static WebDriver start(String browser) {
        WebDriver driver = switch (browser) {
            case "firefox" -> new FirefoxDriver(new FirefoxOptions().addArguments("-headless"));
            default        -> new ChromeDriver(new ChromeOptions().addArguments("--headless=new"));
        };
        DRIVER.set(driver);
        return driver;
    }

    public static WebDriver get() { return DRIVER.get(); }

    public static void stop() {
        DRIVER.get().quit();
        DRIVER.remove();
    }
}

// RetryAnalyzer.java: retries
public class RetryAnalyzer implements IRetryAnalyzer {
    private int attempts = 0;
    @Override
    public boolean retry(ITestResult result) {
        return attempts++ < 2;
    }
}

// ScreenshotListener.java: evidence on failure
public class ScreenshotListener implements ITestListener {
    @Override
    public void onTestFailure(ITestResult result) {
        File shot = ((TakesScreenshot) DriverFactory.get()).getScreenshotAs(OutputType.FILE);
        // copy the file into the report folder / attach to Allure
    }
}
```
Mobile emulation in Selenium is Chrome-only, through
`ChromeOptions.setExperimentalOption("mobileEmulation", Map.of("deviceName", "Pixel 7"))`.

### 4. Key differences
| Setting | Playwright | Selenium Java |
|---|---|---|
| Browsers | `projects` array | `DriverFactory` + `testng.xml` parameters |
| Parallel | `fullyParallel`, `workers` | `testng.xml` / Surefire forks + `ThreadLocal<WebDriver>` |
| Retries | `retries: 2` | `IRetryAnalyzer` class |
| Screenshot / video / trace | Three lines under `use` | Listener for screenshots; video and trace need other tools |
| Report | Built-in HTML reporter | Allure / ExtentReports dependency |
| Base URL | `baseURL` | Your own config helper |
| Safari engine | WebKit on Windows/Linux/macOS | SafariDriver, macOS only |
| Driver binaries | `npx playwright install` | Selenium Manager (built into Selenium 4.6+) |

### 5. Which is better here and why
Playwright, clearly, for setup effort: what took a DriverFactory, a retry class, a listener,
an XML file and a reporting library is about thirty lines here. Selenium's advantage is
freedom: it plugs into any runner, language and grid a company already has.

### 6. No direct equivalent?
Selenium has no single config file and no trace recording. The workaround is the
collection of classes above plus a reporting library; there is no workaround that gives a
Playwright-style trace (DOM snapshot + network + console for every step).

---

## 6. Fixtures vs `@BeforeEach` / base class

**File:** `src/fixtures/test.ts`

### 1. What it does
A fixture is something a test needs before it starts (a page, a page object, test data),
prepared automatically and cleaned up afterwards. A test asks for fixtures by name in its
parameter list and gets exactly those, freshly made for that test.

### 2. Playwright (our code)
```ts
// src/fixtures/test.ts
export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  // ...one per page object
});

// a test asks only for what it uses
test('CART-01: add one item, badge shows 1', { tag: '@smoke' }, async ({ inventoryPage, cartPage }) => {
  await inventoryPage.open();
  // ...
});
```
`page` itself is a built-in fixture: a new tab in a new, isolated browser context per test,
closed automatically when the test ends. Code written before `use(...)` is setup; code
after it is teardown.

### 3. Selenium Java equivalent
```java
public abstract class BaseTest {
    protected WebDriver driver;
    protected String baseUrl;
    protected LoginPage loginPage;
    protected InventoryPage inventoryPage;
    protected CartPage cartPage;

    @BeforeEach
    void setUp() {
        baseUrl = ConfigReader.required("BASE_URL");
        driver = new ChromeDriver(new ChromeOptions().addArguments("--headless=new"));
        loginPage = new LoginPage(driver);
        inventoryPage = new InventoryPage(driver);
        cartPage = new CartPage(driver);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}

class CartTest extends BaseTest {
    @Test
    void cart01_addOneItemBadgeShowsOne() {
        // driver and page objects come from BaseTest
    }
}
```

### 4. Key differences
- **On demand:** a fixture is built only if the test names it. `BaseTest.setUp()` builds
  everything for every test.
- **Composition:** a test can combine any fixtures. A Java class can extend only one base
  class, so shared setup tends to pile up in one large `BaseTest`.
- **Setup and teardown together:** both sit in one function around `use()`. In Java they
  are two separate methods that must be kept in step.
- **Isolation:** the built-in `page` fixture gives each test its own browser context
  (cookies, localStorage). That is why AUTH-08 can log out without disturbing any other test.
- **Parallel safety:** fixtures are per test by design. Selenium needs `ThreadLocal<WebDriver>`.

### 5. Which is better here and why
Playwright. Fixtures remove the base class, and tests state their needs in their own
signature, which makes each test easier to read and review.

### 6. No direct equivalent?
Selenium (with JUnit/TestNG) has no fixtures. The usual workaround is the `BaseTest` class
shown above. JUnit 5 extensions with a `ParameterResolver` can inject objects into test
methods and come closest, but few Selenium projects use them.

---

## 7. Login reuse: `storageState` vs cookie injection

**Files:** `global-setup.ts`, `playwright.config.ts` (`storageState`), `tests/ui/auth/auth.spec.ts`

### 1. What it does
Logging in through the UI before every test is slow and adds a failure point to tests
that are not about login. Instead we log in **once** before the run, save the browser's
cookies and localStorage to a file, and start every test from that saved state. Only the
login tests switch it off.

What we verified on SauceDemo: login sets one cookie, `session-username=<username>`, and
that cookie is the session. The site gives it a 10-minute lifetime, so global setup saves
it as a session cookie (no expiry date) to keep long runs safe. The cart lives in
localStorage (`cart-contents`), which is empty in the saved file, so every test starts
with an empty cart.

### 2. Playwright (our code)
```ts
// global-setup.ts (runs once)
const context = await browser.newContext({ baseURL: env.baseUrl });
const page = await context.newPage();
const loginPage = new LoginPage(page);
await loginPage.open();
await loginPage.login(users.standard);
await new InventoryPage(page).expectLoaded();   // save only after login really worked

const state = await context.storageState();
for (const cookie of state.cookies) {
  if (cookie.name === 'session-username') {
    cookie.expires = -1;                         // session cookie, no 10-minute limit
  }
}
fs.writeFileSync(STORAGE_STATE, JSON.stringify(state, null, 2));

// playwright.config.ts: every test starts from that file
use: { storageState: STORAGE_STATE }

// tests/ui/auth/auth.spec.ts: login tests start logged out
test.use({ storageState: { cookies: [], origins: [] } });
```

### 3. Selenium Java equivalent
```java
public final class SessionStore {
    private static Set<Cookie> savedCookies;

    // call once, e.g. from @BeforeAll in a suite-level class or TestNG @BeforeSuite
    public static synchronized void loginOnce(String baseUrl, User user) {
        if (savedCookies != null) {
            return;
        }
        WebDriver driver = new ChromeDriver(new ChromeOptions().addArguments("--headless=new"));
        try {
            driver.get(baseUrl);
            new LoginPage(driver).login(user);
            new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("inventory.html"));
            savedCookies = driver.manage().getCookies();
        } finally {
            driver.quit();
        }
    }

    // call in @BeforeEach of tests that should start logged in
    public static void apply(WebDriver driver, String baseUrl) {
        driver.get(baseUrl);                       // must be on the domain first
        for (Cookie c : savedCookies) {
            // rebuild without the expiry date -> session cookie
            driver.manage().addCookie(new Cookie(c.getName(), c.getValue(), c.getPath()));
        }
        driver.get(baseUrl + "/inventory.html");
    }
}
```

### 4. Key differences
| | Playwright `storageState` | Selenium cookie injection |
|---|---|---|
| What is saved | Cookies + localStorage, one call | Cookies only; localStorage needs `JavascriptExecutor` |
| When applied | Before the first page loads | After opening a page on the domain, then reload |
| Per-test isolation | Each test gets its own copy | Your code must add cookies to each new driver |
| Switch off for some tests | `test.use({ storageState: ... })` | A different base class or a flag |
| Several users | One file per user | One cookie set per user, managed by you |

### 5. Which is better here and why
Playwright. It is a built-in, three-line feature, and it is also why the smoke tests are
short: CART-01 and CHK-01 contain no login step at all.

### 6. No direct equivalent?
Correct, Selenium has no `storageState`. The workaround is the cookie injection above.
Things to tell a Selenium team: cookies can only be added for the domain currently open,
`HttpOnly`/`Secure` flags must be preserved when the site uses them, and localStorage or
sessionStorage must be copied separately with JavaScript.

**Not verified:** a single run lasting longer than 10 minutes (the reason for removing the
expiry date). The site accepting a `session-username` cookie without an expiry date *was*
verified.

---

## 8. Readable steps: `test.step` vs Allure steps

**Files:** all spec files in `tests/ui/`

### 1. What it does
A test is split into named business steps. The report then reads like a manual test case
("Add Sauce Labs Backpack to the cart", "Overview shows the product and the correct
totals"), and a failure points at the step that broke, not just at a line number.

### 2. Playwright (our code)
```ts
// tests/ui/checkout/checkout.spec.ts
await test.step('Overview shows the product and the correct totals', async () => {
  await checkoutOverviewPage.expectLoaded();
  await expect(checkoutOverviewPage.itemNames).toHaveText([product.name]);
  await expect(checkoutOverviewPage.subtotalLabel).toHaveText(`Item total: ${formatUsd(itemTotal)}`);
  await expect(checkoutOverviewPage.taxLabel).toHaveText(`Tax: ${formatUsd(tax)}`);
  await expect(checkoutOverviewPage.totalLabel).toHaveText(`Total: ${formatUsd(total)}`);
});
```

### 3. Selenium Java equivalent
Selenium and JUnit have no step concept. The usual answer is Allure (extra dependency
`io.qameta.allure:allure-junit5`, plus the Allure command line to build the report):

```java
import static io.qameta.allure.Allure.step;

@Test
void chk01_endToEndPurchaseOfOneItem() {
    step("Overview shows the product and the correct totals", () -> {
        overviewPage.expectLoaded();
        assertEquals(List.of("Sauce Labs Backpack"), overviewPage.itemNames());
        assertEquals("Item total: $29.99", overviewPage.subtotalText());
        assertEquals("Tax: $2.40", overviewPage.taxText());
        assertEquals("Total: $32.39", overviewPage.totalText());
    });
}

// or as an annotation on a page-object method
@Step("Fill customer information for {customer.firstName}")
public void fillCustomer(Customer customer) { ... }
```

### 4. Key differences
| | Playwright `test.step` | Allure steps |
|---|---|---|
| Installation | Built in | Extra dependency + AspectJ agent for `@Step` + report generator |
| Shown in | HTML report, trace viewer, UI Mode | Allure report |
| Evidence per step | Trace attaches DOM snapshot, screenshot, network per action | What you attach yourself (`Allure.addAttachment`) |
| Style | Inline in the test | Inline lambda or `@Step` annotation on methods |

### 5. Which is better here and why
Playwright for zero setup and for the link to the trace viewer. Allure's report is richer
for management reporting (history, trends, categories), and Allure can also be used with
Playwright if that is ever needed.

### 6. No direct equivalent?
Correct, nothing built into Selenium/JUnit/TestNG. Workarounds: Allure (above),
ExtentReports `test.log(...)`, or Cucumber, where each Gherkin line is a step.

---

## 9. Tags vs TestNG groups / JUnit tags

**Files:** all spec files, `playwright.config.ts` (`grep` on the mobile project), `package.json` scripts

### 1. What it does
Each test is labelled `@smoke` or `@regression` so a subset can be run: a fast smoke check
on every push, the full regression on demand.

### 2. Playwright (our code)
```ts
test('AUTH-01: valid login (standard_user) lands on Products page', { tag: '@smoke' }, async ({ ... }) => {
  // ...
});
```
```bash
npx playwright test --grep @smoke          # only smoke      (npm run test:smoke)
npx playwright test --grep @regression     # only regression (npm run test:regression)
npx playwright test --grep-invert @smoke   # everything except smoke
```
```ts
// playwright.config.ts: the mobile project runs only smoke tests (MOB-01)
{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, grep: /@smoke/ }
```

### 3. Selenium Java equivalent
```java
// JUnit 5
@Test
@Tag("smoke")
void auth01_validLoginLandsOnProductsPage() { ... }
// run: mvn test -Dgroups=smoke          exclude: mvn test -DexcludedGroups=smoke

// TestNG
@Test(groups = {"smoke"})
public void auth01_validLoginLandsOnProductsPage() { ... }
// run: mvn test -Dgroups=smoke
```
```xml
<!-- or in testng.xml -->
<test name="smoke">
  <groups><run><include name="smoke"/></run></groups>
  <packages><package name="tests.ui.*"/></packages>
</test>
```

### 4. Key differences
- Same idea and same power in both. Tags belong to the test runner (Playwright Test,
  JUnit, TestNG), not to Selenium itself.
- Playwright tags appear in the test title in the report (`... @smoke`) and can be combined
  per project in the config, as we do for mobile.
- TestNG groups can also declare dependencies between groups (`dependsOnGroups`);
  Playwright deliberately has nothing similar because tests must be independent.

### 5. Which is better here and why
A tie. Use whichever runner you have; the practice (tag everything, keep smoke small and
fast) matters more than the syntax.

### 6. No direct equivalent?
Not applicable; both support it.

---

## 10. Running in GitHub Actions

**File:** `.github/workflows/playwright.yml`

### 1. What it does
Every push and pull request starts a clean Linux machine in GitHub that installs the
project, runs lint and the smoke tests on all browsers, and keeps the HTML report. The
full suite can be started by hand. The password comes from an encrypted repository secret.

### 2. Playwright (our code)
```yaml
env:
  BASE_URL: https://www.saucedemo.com
  STANDARD_USER: standard_user
  LOCKED_OUT_USER: locked_out_user
  SAUCE_PASSWORD: ${{ secrets.SAUCE_PASSWORD }}
steps:
  - uses: actions/checkout@v7
  - uses: actions/setup-node@v7
    with:
      node-version: 24
      cache: npm
  - run: npm ci
  - run: npx playwright install --with-deps chromium firefox webkit
  - run: npx playwright test --grep @smoke
  - uses: actions/upload-artifact@v7
    if: ${{ !cancelled() }}
    with:
      name: playwright-report
      path: playwright-report/
```

### 3. Selenium Java equivalent
```yaml
env:
  BASE_URL: https://www.saucedemo.com
  STANDARD_USER: standard_user
  LOCKED_OUT_USER: locked_out_user
  SAUCE_PASSWORD: ${{ secrets.SAUCE_PASSWORD }}
steps:
  - uses: actions/checkout@v7
  - uses: actions/setup-java@v4
    with:
      distribution: temurin
      java-version: 21
      cache: maven
  # Chrome and Firefox are preinstalled on ubuntu-latest; Selenium Manager (4.6+)
  # downloads the matching chromedriver / geckodriver on first use.
  - run: mvn -B test -Dgroups=smoke -Dbrowser=chrome
  - run: mvn -B test -Dgroups=smoke -Dbrowser=firefox
  - uses: actions/upload-artifact@v7
    if: ${{ !cancelled() }}
    with:
      name: test-report
      path: |
        target/surefire-reports/
        target/allure-results/
```
(`actions/setup-java@v4` is the version I know; check for a newer one before using it.
The other action versions were checked against GitHub on 2026-11-16.)

### 4. Key differences
| | Playwright | Selenium Java |
|---|---|---|
| Browsers in CI | `playwright install --with-deps` installs pinned browser builds, the same ones as on your laptop | Uses whatever Chrome/Firefox the runner image has; versions drift over time |
| Safari engine | WebKit runs on the Linux runner | Needs a macOS runner (slower, costs more minutes) or a cloud grid |
| All browsers | One command runs every project | One Maven run per browser, or a matrix, or Selenium Grid |
| Headless | Default | You add `--headless=new` in `ChromeOptions` |
| Failure evidence | Report with trace, screenshot, video | Surefire XML + whatever your listeners saved |
| Secrets | `${{ secrets.X }}` → environment variable | Same |

### 5. Which is better here and why
Playwright. The pinned browsers remove the classic "passes locally, fails in CI because
Chrome updated" problem, WebKit runs on Linux, and the uploaded trace usually explains a
CI-only failure without re-running anything. The pipeline structure itself is the same for
both tools.

### 6. No direct equivalent?
Selenium has no trace artifact and no Safari-engine run on Linux. Workarounds: screenshots
and browser logs saved by a listener, a video recorder such as Selenoid/Selenium Grid
video, and macOS runners or a cloud provider (Sauce Labs, BrowserStack) for Safari.
