import { ProductCard } from "./product-card"
import { SectionHeader } from "./section-header"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProductShelfProps {
  title: string
  products: Product[]
  /** When provided, renders the orange "View All" link. */
  viewAllHref?: string
  /** Extra classes for the section wrapper (e.g. a background); defaults to
   *  the plain page background. */
  sectionClassName?: string
  /** Accessible label; defaults to "<title> products". */
  ariaLabel?: string
}

/**
 * Reusable Nittonova product shelf: a section header (title + orange dash +
 * optional View All) above a responsive grid of ProductCards. Powers the
 * home page's Trending and category-wise shelves, and is meant for any
 * other page that shows a row of products.
 */
export function ProductShelf({
  title,
  products,
  viewAllHref,
  sectionClassName,
  ariaLabel,
}: ProductShelfProps) {
  if (!products || products.length === 0) return null

  return (
    <section
      aria-label={ariaLabel ?? `${title} products`}
      className={cn("py-10 sm:py-12 lg:py-14", sectionClassName)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={title} viewAllHref={viewAllHref} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
