/**
 * Role: small money helpers so tests can CALCULATE the expected checkout totals from the
 * product prices instead of hardcoding strings like "$32.39". If a price changes in
 * src/data/products.ts, the expected totals follow automatically.
 */

/**
 * Sales tax rate observed on the live checkout overview page on 2026-11-16:
 * item total $29.99 -> tax $2.40, i.e. 8% rounded to cents. Verified with one item only;
 * CHK-02 (Phase 2) will confirm it with several items.
 */
export const TAX_RATE = 0.08;

/**
 * Rounds an amount to whole cents, e.g. 2.3992 -> 2.4.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   static BigDecimal roundToCents(BigDecimal amount) {
 *       return amount.setScale(2, RoundingMode.HALF_UP);
 *   }
 *
 * DIFFERENCE: Plain language code in both cases, nothing tool-specific. Java projects
 *   normally use BigDecimal for money; in TypeScript we round after multiplying by 100,
 *   which is accurate enough for these small test amounts.
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculates the tax the application should show for a given item total.
 *
 * SELENIUM JAVA EQUIVALENT:
 *   static BigDecimal calculateTax(BigDecimal itemTotal) {
 *       return itemTotal.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
 *   }
 *
 * DIFFERENCE: None in approach. The point in both tools is that the test computes the
 *   expected value independently and compares it with what the page shows, instead of
 *   copying the number from the page into the test.
 */
export function calculateTax(itemTotal: number): number {
  return roundToCents(itemTotal * TAX_RATE);
}

/**
 * Formats a number the way the site prints prices, e.g. 2.4 -> "$2.40".
 *
 * SELENIUM JAVA EQUIVALENT:
 *   static String formatUsd(BigDecimal amount) {
 *       return "$" + amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
 *   }
 *
 * DIFFERENCE: None; simple string formatting in either language.
 */
export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
