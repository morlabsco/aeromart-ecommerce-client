// Currency formatting for the storefront.
//
// Products carry a currency code from the backend (usd, bdt, eur, gbp, inr,
// aed, aud, cad ...). This helper renders amounts consistently: USD uses "$",
// BDT uses the "BDT" label, others use their symbol or code.
import type { StorefrontOfferPrice } from "@/lib/types";

/** Returns the effective sale price when an offer is active, else null. */
export function getOfferPrice(
  price: number,
  offer?: StorefrontOfferPrice | null
): number | null {
  if (!offer || offer.isActive === false) return null;
  const now = Date.now();
  if (offer.startAt && new Date(offer.startAt).getTime() > now) return null;
  if (offer.endAt && new Date(offer.endAt).getTime() < now) return null;
  if (offer.value <= 0) return null;
  return offer.type === "flat"
    ? Math.max(0, price - offer.value)
    : Math.max(0, price * (1 - offer.value / 100));
}

/** True when the product has an active offer (sale price differs). */
export function hasActiveOffer(
  price: number,
  offer?: StorefrontOfferPrice | null
): boolean {
  const sale = getOfferPrice(price, offer);
  return sale !== null && sale < price;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: "$",
  eur: "€",
  gbp: "£",
  inr: "₹",
  aed: "AED ",
  aud: "A$",
  cad: "C$",
};

/** Currencies rendered with their code label instead of a symbol. */
const CODE_LABEL_CURRENCIES: Record<string, string> = {
  bdt: "BDT",
};

/** Returns the display symbol/label for a currency code (lowercased). */
export function currencySymbol(currency: string | undefined | null): string {
  if (!currency) return "$";
  const code = currency.toLowerCase();
  if (CODE_LABEL_CURRENCIES[code]) return CODE_LABEL_CURRENCIES[code];
  return CURRENCY_SYMBOLS[code] ?? `${code.toUpperCase()} `;
}

/** Formats an amount with the currency, e.g. $1,250 or $1,250.50 or BDT 1,250.
 *  Whole-number amounts render without trailing zeros; decimals show only when
 *  there is a real fractional part. Pass `minimumFractionDigits` to force
 *  decimals (e.g. financial totals). */
export function formatCurrency(
  amount: number,
  currency?: string | null,
  options?: { minimumFractionDigits?: number }
): string {
  const label = currencySymbol(currency);
  const forceDigits = options?.minimumFractionDigits ?? 0;
  const hasFraction = !Number.isInteger(amount);
  const digits = Math.max(forceDigits, hasFraction ? 2 : 0);
  const number = amount.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  // BDT label goes after the amount ("1,250.00 BDT"); symbols go before.
  return CODE_LABEL_CURRENCIES[currency?.toLowerCase() ?? ""]
    ? `${number} ${label}`
    : `${label}${number}`;
}
