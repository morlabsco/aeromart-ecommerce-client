import { ProductShelf } from "../shared/product-shelf"
import { getOfferPrice, hasActiveOffer } from "@/lib/utils/currency"
import type { Product } from "@/lib/types"

interface SpecialOffersProps {
  products?: Product[]
}

/** Fraction off (0–1) a live offer gives — drives the biggest-first sort. */
function discountRatio(product: Product): number {
  const salePrice = getOfferPrice(product.price, product.offerPrice)
  return salePrice !== null ? 1 - salePrice / product.price : 0
}

/**
 * "Special Offers" shelf — Nittonova home section right after Trending:
 * every active product whose offer is live right now (active, in its date
 * window, positive value), biggest discount first. The section only renders
 * when at least one offered product exists — no offers, no section.
 */
export function SpecialOffers({ products: serverProducts }: SpecialOffersProps = {}) {
  const offered = (serverProducts ?? [])
    .filter((p) => p.isActive && hasActiveOffer(p.price, p.offerPrice))
    .sort((a, b) => discountRatio(b) - discountRatio(a))
    .slice(0, 10)

  if (offered.length === 0) return null

  return (
    <ProductShelf
      title="Special Offers"
      products={offered}
      viewAllHref="/products?offer=true"
      ariaLabel="Special offers"
      bottomRule
    />
  )
}
