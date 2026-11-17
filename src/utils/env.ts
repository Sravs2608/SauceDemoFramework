/**
 * Role: the single place where the framework reads its settings (URL, users, password).
 * Tests and page objects never read `process.env` directly and never contain a URL or a
 * password; they import `env` from here. Locally the values come from the `.env` file,
 * in GitHub Actions they come from the workflow (the password from a repository secret).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');
const envFile = path.join(projectRoot, '.env');

// Node's built-in .env loader (no extra package needed). Variables that are already set,
// for example by GitHub Actions, are NOT overwritten, so CI values always win.
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

/**
 * Returns the value of a required setting, or stops the run with a clear message that
 * names the missing variable. The value itself is never printed, so secrets stay out of logs.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   // Usually a ConfigReader class over a .properties file or System.getenv():
 *   static String required(String name) {
 *       String value = System.getenv(name);
 *       if (value == null || value.isBlank()) {
 *           throw new IllegalStateException("Missing required setting: " + name);
 *       }
 *       return value;
 *   }
 *
 * DIFFERENCE: Same idea in both tools; this is plain Node/Java, not a Playwright or Selenium
 *   feature. Node can load a .env file natively (process.loadEnvFile). Java has no built-in
 *   .env support, so Selenium projects use config.properties, Maven -D system properties,
 *   or the third-party dotenv-java library.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required setting "${name}". Copy .env.example to .env and fill it in ` +
        `(or define it as a variable/secret in GitHub Actions).`,
    );
  }
  return value.trim();
}

/** All settings the framework needs, read once when the run starts. */
export const env = {
  baseUrl: required('BASE_URL'),
  standardUser: required('STANDARD_USER'),
  lockedOutUser: required('LOCKED_OUT_USER'),
  password: required('SAUCE_PASSWORD'),
};

/**
 * Where global-setup.ts saves the logged-in session of standard_user, and where
 * playwright.config.ts tells every test to load it from. The folder is git-ignored.
 */
export const STORAGE_STATE = path.join(projectRoot, '.auth', 'standard-user.json');
