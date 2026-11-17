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
