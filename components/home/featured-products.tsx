import Link from "next/link"
import { ProductCard } from "../shared/product-card"
import { ArrowRight } from "lucide-react"
import { Reveal } from "../shared/reveal"
import type { Product } from "@/lib/types"

interface FeaturedProductsProps {
  products?: Product[]
}

export function FeaturedProducts({ products: serverProducts }: FeaturedProductsProps = {}) {
  // Backend products have no `featured` flag; treat top-rated active products
  // as featured (docs/v8/01.md: featured rendered from products by filtering).
  const featured = (serverProducts ?? [])
    .filter((p) => p.isActive)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)

  if (featured.length === 0) return null

  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <Reveal>
          <div className="flex items-end justify-between mb-8 lg:mb-12">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Curated Picks</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Featured Products</h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              View All <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.07}>
              <ProductCard product={product} variant="minimal" />
            </Reveal>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
