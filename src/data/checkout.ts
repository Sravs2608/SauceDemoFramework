/**
 * Role: test data and expected texts for the checkout flow. The expected texts were read
 * from the live site (docs/VERIFIED-LOCATORS.md, verified 2026-11-16).
 *
 * Selenium Java projects keep this in a POJO/record plus a constants class; this is a
 * test-data pattern, not a tool feature.
 */
export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/** A valid customer for the "Checkout: Your Information" step. Any non-empty values work. */
export const validCustomer: Customer = {
  firstName: 'Test',
  lastName: 'User',
  postalCode: '12345',
};

/** Fixed texts shown on the "Checkout: Overview" page (same for every order). */
export const orderOverview = {
  paymentInfo: 'SauceCard #31337',
  shippingInfo: 'Free Pony Express Delivery!',
};

/** Texts shown on the "Checkout: Complete!" page after a successful order. */
export const orderConfirmation = {
  header: 'Thank you for your order!',
  text: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
};
