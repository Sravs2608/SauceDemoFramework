/**
 * Role: a guided tour of Playwright's locator toolbox (plan section 6, "Advanced
 * locators"). The page objects mostly use getByTestId; this file shows the other ways to
 * find elements, on the Products page, with every count and name verified on the live
 * site on 2026-11-16.
 *
 * Locators are written directly in this test on purpose: the locators themselves are
 * what is being demonstrated. In normal tests they belong in page objects.
 *
 * Test IDs: the plan gives no IDs to the section 6 topics, so they are numbered ADV-01
 * onwards here and in docs/TRACEABILITY.md.
 */
import { test, expect } from '../../src/fixtures/test';
import { products, PRODUCT_COUNT } from '../../src/data/products';

/**
 * ADV-01: find elements by role and name, by text and alt text, by filtering a list, by
 * position, and by chaining; then use such a locator for a real action.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void adv01_locatorStrategies() {
 *       driver.get(baseUrl + "/inventory.html");
 *       // role + accessible name -> no equivalent; use the attribute that provides the name
 *       WebElement sort = driver.findElement(By.cssSelector("select[aria-label='Sort products']"));
 *       assertEquals("az", sort.getAttribute("value"));
 *       // alt text
 *       driver.findElement(By.cssSelector("img[alt='Sauce Labs Backpack']"));
 *       // exact text -> XPath
 *       driver.findElement(By.xpath("//*[normalize-space(text())='Sauce Labs Backpack']"));
 *       // filter a list by text it contains -> XPath with a nested condition
 *       List<WebElement> at1599 = driver.findElements(By.xpath(
 *           "//*[@data-test='inventory-item'][.//*[@data-test='inventory-item-price'][.='$15.99']]"));
 *       assertEquals(2, at1599.size());
 *       // "does NOT contain" -> not(...)
 *       assertEquals(4, driver.findElements(By.xpath(
 *           "//*[@data-test='inventory-item'][not(contains(., 'T-Shirt'))]")).size());
 *       // position
 *       List<WebElement> cards = driver.findElements(By.cssSelector("[data-test='inventory-item']"));
 *       WebElement first = cards.get(0), third = cards.get(2), last = cards.get(cards.size() - 1);
 *       // chain: inside the Onesie card, the button
 *       driver.findElement(By.xpath("//*[@data-test='inventory-item'][contains(., 'Sauce Labs Onesie')]//button")).click();
 *   }
 *
 * DIFFERENCE: Playwright locates by what the user perceives (role, accessible name, label,
 *   text) and can filter and chain locators while keeping them lazy and strict. Selenium
 *   offers id, name, class, tag, link text, CSS and XPath; anything about roles, text
 *   content or "contains / does not contain" ends up as XPath, which is longer and breaks
 *   more easily. Selenium 4 relative locators (above/below/near) solve a different problem.
 */
test('ADV-01: advanced locators - role, text, filter, position and chaining', { tag: '@regression' }, async ({
  page,
  inventoryPage,
}) => {
  await inventoryPage.open();
  const cards = page.getByTestId('inventory-item');

  await test.step('By role and accessible name', async () => {
    // A <select> has the role "combobox"; its name comes from aria-label="Sort products".
    await expect(page.getByRole('combobox', { name: 'Sort products' })).toHaveValue('az');
    // Six buttons share the name "Add to cart": fine for counting, too vague for clicking.
    await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(PRODUCT_COUNT);
    // The cart icon announces its state in its accessible name.
    await expect(page.getByRole('button', { name: 'Cart, empty' })).toHaveAttribute('data-test', 'shopping-cart-link');
  });

  await test.step('By alt text and by exact text', async () => {
    await expect(page.getByAltText(products.backpack.name)).toBeVisible();
    await expect(page.getByText(products.backpack.name, { exact: true })).toBeVisible();
    // Without exact, getByText matches any text CONTAINING the words (8 elements here).
    await expect(page.getByText('Sauce Labs')).toHaveCount(8);
  });

  await test.step('By filtering a list: has text / does not have text', async () => {
    await expect(cards.filter({ hasText: '$15.99' })).toHaveCount(2);
    await expect(cards.filter({ hasText: '$15.99' }).getByTestId('inventory-item-name')).toHaveText([
      products.boltTShirt.name,
      products.redTShirt.name,
    ]);
    await expect(cards.filter({ hasNotText: 'T-Shirt' })).toHaveCount(4);
  });

  await test.step('By position: first, last, nth', async () => {
    await expect(cards.first().getByTestId('inventory-item-name')).toHaveText(products.backpack.name);
    await expect(cards.nth(2).getByTestId('inventory-item-name')).toHaveText(products.boltTShirt.name);
    await expect(cards.last().getByTestId('inventory-item-name')).toHaveText(products.redTShirt.name);
  });

  await test.step('Chaining: the button inside one filtered card, used for a real action', async () => {
    const onesieCard = cards.filter({ hasText: products.onesie.name });
    await onesieCard.getByRole('button', { name: 'Add to cart' }).click();
    await expect(onesieCard.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cart, 1 items' })).toBeVisible();
    await inventoryPage.header.expectCartCount(1);
  });
});
