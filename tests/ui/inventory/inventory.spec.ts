/**
 * Role: Products page tests (plan section 5, INV-01 to INV-06): what each product card
 * shows, the four sort orders, and the product detail page. All tests start logged in as
 * standard_user through the saved session.
 */
import { test, expect } from '../../../src/fixtures/test';
import { allProducts, expectedOrder, products, sortOptions, PRODUCT_COUNT } from '../../../src/data/products';
import { formatUsd } from '../../../src/utils/money';

/**
 * INV-01: every product card shows its name, its price, a loaded picture of that product
 * and an "Add to cart" button, and no two products share a picture.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void inv01_allProductsShowNamePriceImageAndAddButton() {
 *       driver.get(baseUrl + "/inventory.html");
 *       wait.until(ExpectedConditions.numberOfElementsToBe(
 *           By.cssSelector("[data-test='inventory-item']"), 6));
 *       assertEquals(expectedNames, texts("[data-test='inventory-item-name']"));
 *       assertEquals(expectedPrices, texts("[data-test='inventory-item-price']"));
 *       Set<String> sources = new HashSet<>();
 *       for (WebElement img : driver.findElements(By.cssSelector("[data-test='inventory-item'] img"))) {
 *           Long width = (Long) ((JavascriptExecutor) driver)
 *               .executeScript("return arguments[0].naturalWidth;", img);
 *           assertTrue(width > 0, "image did not load: " + img.getAttribute("alt"));
 *           sources.add(img.getAttribute("src"));
 *       }
 *       assertEquals(6, sources.size());
 *   }
 *   // texts(css) = driver.findElements(By.cssSelector(css)).stream().map(WebElement::getText).toList()
 *
 * DIFFERENCE: toHaveText with an array checks the whole list (count, order, text) in one
 *   retrying assertion. "Is the image really loaded" needs JavaScript in both tools
 *   (naturalWidth); Playwright wraps it in expect.poll so it retries while images load,
 *   where Selenium reads the value once.
 */
test('INV-01: all products show name, price, image, add button', { tag: '@regression' }, async ({ inventoryPage }) => {
  await test.step('Open the Products page', async () => {
    await inventoryPage.open();
    await inventoryPage.expectLoaded();
  });

  await test.step('Names and prices match the catalogue', async () => {
    await expect(inventoryPage.itemNames).toHaveText(allProducts.map((product) => product.name));
    await expect(inventoryPage.itemPrices).toHaveText(allProducts.map((product) => formatUsd(product.price)));
  });

  await test.step('Every card has its own loaded picture and an Add to cart button', async () => {
    for (const product of allProducts) {
      const image = inventoryPage.card(product).getByRole('img');
      await expect(image).toHaveAttribute('alt', product.name);
      // naturalWidth is 0 until the browser has really downloaded and decoded the picture.
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth), {
          message: `picture of "${product.name}" should load`,
        })
        .toBeGreaterThan(0);
      await expect(inventoryPage.addToCartButton(product)).toHaveText('Add to cart');
    }
  });

  await test.step('No two products share the same picture', async () => {
    const sources = await inventoryPage.itemImages.evaluateAll((images) =>
      images.map((img) => img.getAttribute('src')),
    );
    expect(new Set(sources).size).toBe(PRODUCT_COUNT);
  });
});

/**
 * INV-02 to INV-05: the four sort options. One test per option, generated from the table
 * below. Each test first switches to a DIFFERENT order (`startFrom`), so that selecting
 * the option under test really has to change the page (important for A to Z, which is
 * the default order).
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @ParameterizedTest(name = "{0}") @Tag("regression")
 *   @EnumSource(SortOption.class)
 *   void inv02to05_sortShowsProductsInTheRightOrder(SortOption option) {
 *       driver.get(baseUrl + "/inventory.html");
 *       Select sort = new Select(wait.until(ExpectedConditions.elementToBeClickable(
 *           By.cssSelector("[data-test='product-sort-container']"))));
 *       sort.selectByValue(option.startFrom().getValue());
 *       // the page redraws: locate the dropdown again to avoid a stale element
 *       sort = new Select(driver.findElement(By.cssSelector("[data-test='product-sort-container']")));
 *       sort.selectByValue(option.getValue());
 *       List<String> expectedNames = Products.expectedOrder(option).stream().map(Product::getName).toList();
 *       wait.until(d -> texts("[data-test='inventory-item-name']").equals(expectedNames));
 *       assertEquals(option.getLabel(),
 *           driver.findElement(By.cssSelector("[data-test='active-option']")).getText());
 *   }
 *
 * DIFFERENCE: After sorting, React redraws the list. Playwright's list assertion simply
 *   retries until the order matches. In Selenium the WebElements read before the redraw are
 *   stale, so the dropdown and the list must be located again and a custom wait
 *   (a lambda in wait.until) is needed for "the list equals the expected order".
 */
const sortCases = [
  { id: 'INV-02', title: 'sort Name A–Z shows the actual order', option: sortOptions.nameAsc, startFrom: sortOptions.nameDesc },
  { id: 'INV-03', title: 'sort Name Z–A shows the actual order', option: sortOptions.nameDesc, startFrom: sortOptions.nameAsc },
  { id: 'INV-04', title: 'sort Price low–high shows the actual order', option: sortOptions.priceAsc, startFrom: sortOptions.nameAsc },
  { id: 'INV-05', title: 'sort Price high–low shows the actual order', option: sortOptions.priceDesc, startFrom: sortOptions.nameAsc },
];

for (const sortCase of sortCases) {
  test(`${sortCase.id}: ${sortCase.title}`, { tag: '@regression' }, async ({ inventoryPage }) => {
    const expected = expectedOrder(sortCase.option);

    await test.step(`Open the Products page sorted by "${sortCase.startFrom.label}"`, async () => {
      await inventoryPage.open();
      await inventoryPage.sortBy(sortCase.startFrom);
      await expect(inventoryPage.activeSortOption).toHaveText(sortCase.startFrom.label);
    });

    await test.step(`Sort by "${sortCase.option.label}"`, async () => {
      await inventoryPage.sortBy(sortCase.option);
    });

    await test.step('Products appear in the calculated order', async () => {
      await expect(inventoryPage.activeSortOption).toHaveText(sortCase.option.label);
      await expect(inventoryPage.itemNames).toHaveText(expected.map((product) => product.name));
      await expect(inventoryPage.itemPrices).toHaveText(expected.map((product) => formatUsd(product.price)));
    });
  });
}

/**
 * INV-06: the detail page of a product shows the same name and price as its card on the
 * Products page, and both match our catalogue data.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   @Test @Tag("regression")
 *   void inv06_productDetailMatchesListing() {
 *       driver.get(baseUrl + "/inventory.html");
 *       WebElement card = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(
 *           "//*[@data-test='inventory-item'][.//*[@data-test='item-5-title-link']]")));
 *       String listedName = card.findElement(By.cssSelector("[data-test='inventory-item-name']")).getText();
 *       String listedPrice = card.findElement(By.cssSelector("[data-test='inventory-item-price']")).getText();
 *       driver.findElement(By.cssSelector("[data-test='item-5-title-link']")).click();
 *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/inventory-item.html?id=5"));
 *       assertEquals(listedName, driver.findElement(By.cssSelector("[data-test='inventory-item-name']")).getText());
 *       assertEquals(listedPrice, driver.findElement(By.cssSelector("[data-test='inventory-item-price']")).getText());
 *       driver.findElement(By.cssSelector("[data-test='back-to-products']")).click();
 *       wait.until(ExpectedConditions.urlToBe(baseUrl + "/inventory.html"));
 *   }
 *
 * DIFFERENCE: The card is found with filter({ has }) instead of an XPath. The listing
 *   texts are read into variables BEFORE navigating (plain strings are safe to keep);
 *   keeping the card WebElement across the navigation in Selenium would make it stale.
 */
test('INV-06: product detail matches listing name and price', { tag: '@regression' }, async ({
  inventoryPage,
  productDetailPage,
}) => {
  const product = products.fleeceJacket;
  let listedName = '';
  let listedPrice = '';

  await test.step(`Read "${product.name}" on the Products page`, async () => {
    await inventoryPage.open();
    const card = inventoryPage.card(product);
    await expect(card.getByTestId('inventory-item-name')).toHaveText(product.name);
    await expect(card.getByTestId('inventory-item-price')).toHaveText(formatUsd(product.price));
    listedName = await card.getByTestId('inventory-item-name').innerText();
    listedPrice = await card.getByTestId('inventory-item-price').innerText();
  });

  await test.step('Open its detail page', async () => {
    await inventoryPage.openProductDetail(product);
    await productDetailPage.expectLoadedFor(product);
  });

  await test.step('Detail page shows the same name and price as the listing', async () => {
    await expect(productDetailPage.name).toHaveText(listedName);
    await expect(productDetailPage.price).toHaveText(listedPrice);
    await expect(productDetailPage.addToCartButton).toHaveText('Add to cart');
  });

  await test.step('Back to products returns to the Products page', async () => {
    await productDetailPage.backToProducts();
    await inventoryPage.expectLoaded();
  });
});
