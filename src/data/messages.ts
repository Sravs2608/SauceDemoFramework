/**
 * Role: the exact error messages the application shows, copied from the live site
 * (docs/VERIFIED-LOCATORS.md, checked on 2026-11-16). Keeping them in one file means a
 * wording change in the application is fixed in one place.
 *
 * Selenium Java projects use a constants class or a messages.properties file for this.
 */
export const loginErrors = {
  /** Shown for a wrong password AND for an unknown username (same text for both). */
  credentialsMismatch: 'Epic sadface: Username and password do not match any user in this service',
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
};

/** Shown on "Checkout: Your Information" when a field is left empty. */
export const checkoutErrors = {
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
};

/**
 * Builds the message shown when a protected page is opened without being logged in.
 * Verified for '/inventory.html' and '/cart.html'.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   static String restrictedPage(String path) {
 *       return String.format("Epic sadface: You can only access '%s' when you are logged in.", path);
 *   }
 *
 * DIFFERENCE: None; plain string building in either language.
 */
export function restrictedPageError(path: string): string {
  return `Epic sadface: You can only access '${path}' when you are logged in.`;
}
