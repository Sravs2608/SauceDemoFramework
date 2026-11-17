/**
 * Role: the product catalogue as test data. Every value here was read from the live site
 * (see docs/VERIFIED-LOCATORS.md, verified 2026-11-16). Tests use these objects to choose
 * what to buy and to calculate expected prices and totals.
 *
 * `slug` is the part of the button's data-test value that identifies the product:
 * "add-to-cart-<slug>" and "remove-<slug>".
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

/** Number of products the inventory page lists. */
export const PRODUCT_COUNT = Object.keys(products).length;
