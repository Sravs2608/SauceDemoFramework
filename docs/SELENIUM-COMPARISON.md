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
