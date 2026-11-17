/**
 * Role: ARIA snapshots (plan section 6, "ARIA snapshots"). An ARIA snapshot describes a
 * part of the page the way a screen reader perceives it: roles, names and nesting, written
 * as a small indented list. toMatchAriaSnapshot compares the page with that description.
 *
 * It sits between two other kinds of check:
 *   - single assertions (toHaveText ...) check one fact at a time;
 *   - screenshots (toHaveScreenshot) check every pixel and break on any styling change;
 *   - an ARIA snapshot checks the STRUCTURE of a whole block in one assertion and ignores
 *     colours, fonts and layout, so it works on every browser and operating system.
 *
 * The snapshots below were generated from the live site on 2026-11-16 with
 * locator.ariaSnapshot(). The template may leave out children; listed ones must be present
 * in that order.
 */
import { test, expect } from '../../src/fixtures/test';
import { products } from '../../src/data/products';

/**
 * ADV-07: the sort control and a product card on the Products page have the expected
 * accessible structure.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   // No equivalent. The same facts need one assertion each:
 *   @Test @Tag("regression")
 *   void adv07_inventoryStructure() {
 *       driver.get(baseUrl + "/inventory.html");
 *       WebElement sort = driver.findElement(By.cssSelector("[data-test='product-sort-container']"));
 *       assertEquals("Sort products", sort.getAccessibleName());       // Selenium 4
 *       assertEquals("combobox", sort.getAriaRole());                  // Selenium 4
 *       List<String> options = new Select(sort).getOptions().stream().map(WebElement::getText).toList();
 *       assertEquals(List.of("Name (A to Z)", "Name (Z to A)", "Price (low to high)", "Price (high to low)"), options);
 *       assertEquals("Name (A to Z)", new Select(sort).getFirstSelectedOption().getText());
 *       WebElement img = driver.findElement(By.cssSelector("img[alt='Sauce Labs Backpack']"));
 *       assertTrue(img.isDisplayed());
 *       // ... and so on for every button and name
 *   }
 *
 * DIFFERENCE: Selenium 4 can read one element's role and name (getAriaRole,
 *   getAccessibleName) but cannot describe or compare a whole tree. The snapshot replaces
 *   a dozen separate assertions and, when it fails, shows a readable diff of the structure.
 */
test('ADV-07: ARIA snapshot of the sort control and a product card', { tag: '@regression' }, async ({ page, inventoryPage }) => {
  await inventoryPage.open();
  await inventoryPage.expectLoaded();

  await test.step('Sort control: a combobox named "Sort products" with four options', async () => {
    await expect(page.getByTestId('secondary-header')).toMatchAriaSnapshot(`
      - combobox "Sort products":
        - option "Name (A to Z)" [selected]
        - option "Name (Z to A)"
        - option "Price (low to high)"
        - option "Price (high to low)"
    `);
  });

  await test.step('Backpack card: picture, name button and an Add to cart button', async () => {
    await expect(inventoryPage.card(products.backpack)).toMatchAriaSnapshot(`
      - button "View details for Sauce Labs Backpack":
        - img "Sauce Labs Backpack"
      - button "View details for Sauce Labs Backpack": Sauce Labs Backpack
      - button "Add to cart"
    `);
  });

  await test.step('Header: menu button, title and an empty cart', async () => {
    await expect(page.getByTestId('primary-header')).toMatchAriaSnapshot(`
      - button "Open Menu"
      - text: Swag Labs
      - button "Cart, empty"
    `);
  });
});
