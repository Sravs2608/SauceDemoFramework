/**
 * Role: the product catalogue and the sort options as test data. Every value here was read
 * from the live site (see docs/VERIFIED-LOCATORS.md, verified 2026-11-16). Tests use these
 * objects to choose what to buy and to calculate expected prices, totals and sort orders.
 *
 * `slug` is the part of the button's data-test value that identifies the product:
 * "add-to-cart-<slug>" and "remove-<slug>". `id` is used in the detail-page address
 * (/inventory-item.html?id=<id>), in the link "item-<id>-title-link" and in the cart
 * stored in the browser (localStorage "cart-contents", e.g. [4,0]).
 *
 * Selenium Java projects keep the same data in an enum, a POJO list or a JSON/Excel file;
 * this is a test-data pattern, not a tool feature.
 */
export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
}

export const products = {
  backpack: { id: 4, name: 'Sauce Labs Backpack', slug: 'sauce-labs-backpack', price: 29.99 },
  bikeLight: { id: 0, name: 'Sauce Labs Bike Light', slug: 'sauce-labs-bike-light', price: 9.99 },
  boltTShirt: { id: 1, name: 'Sauce Labs Bolt T-Shirt', slug: 'sauce-labs-bolt-t-shirt', price: 15.99 },
  fleeceJacket: { id: 5, name: 'Sauce Labs Fleece Jacket', slug: 'sauce-labs-fleece-jacket', price: 49.99 },
  onesie: { id: 2, name: 'Sauce Labs Onesie', slug: 'sauce-labs-onesie', price: 7.99 },
  redTShirt: {
    id: 3,
    name: 'Test.allTheThings() T-Shirt (Red)',
    slug: 'test.allthethings()-t-shirt-(red)',
    price: 15.99,
  },
} satisfies Record<string, Product>;

/** All products in the order the Products page shows them by default (Name A to Z). */
export const allProducts: Product[] = Object.values(products);

/** Number of products the inventory page lists. */
export const PRODUCT_COUNT = allProducts.length;

export interface SortOption {
  /** The <option value="..."> in the sort dropdown. */
  value: 'az' | 'za' | 'lohi' | 'hilo';
  /** The text the user sees for that option. */
  label: string;
}

export const sortOptions = {
  nameAsc: { value: 'az', label: 'Name (A to Z)' },
  nameDesc: { value: 'za', label: 'Name (Z to A)' },
  priceAsc: { value: 'lohi', label: 'Price (low to high)' },
  priceDesc: { value: 'hilo', label: 'Price (high to low)' },
} satisfies Record<string, SortOption>;

/**
 * Works out, from our own data, the order the products SHOULD appear in for a sort
 * option. The test compares this with the order really shown on the page, so the page is
 * checked against an independent calculation and not against itself.
 * Two products cost $15.99; the site lists them in name order within the same price for
 * both price sorts (verified), which is what a stable sort of the A-to-Z list gives.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   static List<Product> expectedOrder(SortOption option) {
 *       List<Product> byName = new ArrayList<>(ALL_PRODUCTS);
 *       byName.sort(Comparator.comparing(Product::getName));
 *       switch (option) {
 *           case NAME_DESC:  Collections.reverse(byName); return byName;
 *           case PRICE_ASC:  byName.sort(Comparator.comparing(Product::getPrice)); return byName;
 *           case PRICE_DESC: byName.sort(Comparator.comparing(Product::getPrice).reversed()); return byName;
 *           default:         return byName;
 *       }
 *   }
 *
 * DIFFERENCE: None; plain language code. List.sort in Java and Array.sort in JavaScript
 *   are both stable, so equal prices keep their name order in either language.
 */
export function expectedOrder(option: SortOption): Product[] {
  const byName = [...allProducts].sort((a, b) => a.name.localeCompare(b.name));
  switch (option.value) {
    case 'za':
      return byName.reverse();
    case 'lohi':
      return byName.sort((a, b) => a.price - b.price);
    case 'hilo':
      return byName.sort((a, b) => b.price - a.price);
    default:
      return byName;
  }
}
