import type { ProductOfferPrice } from "@/lib/types/backend";

/** Lifecycle of a product offer, mirroring the storefront's getOfferPrice. */
export type OfferStatus = "live" | "scheduled" | "expired" | "inactive";

/**
 * Classifies an offer for the Offered Products manager:
 * - inactive: turned off or a zero value (the storefront shows no discount)
 * - scheduled: start date is still in the future
 * - expired: end date has passed
 * - live: active, positive and inside its window right now
 * A missing start/end date counts as "always open", same as the storefront.
 */
export function getOfferStatus(
  offer: ProductOfferPrice | null | undefined,
): OfferStatus | null {
  if (!offer) return null;
  if (offer.isActive === false || !(offer.value > 0)) return "inactive";

  const now = Date.now();
  if (offer.startAt && new Date(offer.startAt).getTime() > now)
    return "scheduled";
  if (offer.endAt && new Date(offer.endAt).getTime() < now) return "expired";
  return "live";
}

/** Sale price and whole-number percent off an offer gives on a base price. */
export function offerSaleInfo(price: number, offer: ProductOfferPrice) {
  const salePrice =
    offer.type === "flat"
      ? Math.max(0, price - offer.value)
      : Math.max(0, price * (1 - offer.value / 100));
  return {
    salePrice,
    percent: price > 0 ? Math.round((1 - salePrice / price) * 100) : 0,
  };
}
