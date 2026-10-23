import { ProductShelf } from "../shared/product-shelf"
import type { Product } from "@/lib/types"

interface FeaturedProductsProps {
  products?: Product[]
}

/**
 * "Trending" shelf — Nittonova home section: top-rated active products on
 * the cream surface, rendered through the shared ProductShelf.
 */
export function FeaturedProducts({ products: serverProducts }: FeaturedProductsProps = {}) {
  // Backend products have no `featured` flag on the list payload; treat
  // top-rated active products as trending.
  const trending = (serverProducts ?? [])
    .filter((p) => p.isActive)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10)

  if (trending.length === 0) return null

  return (
    <ProductShelf
      title="Trending"
      products={trending}
      viewAllHref="/products"
      sectionClassName="bg-hero-surface"
    />
  )
}
