import Link from "next/link"
import { ProductCard } from "../shared/product-card"
import { ArrowRight } from "lucide-react"
import { Reveal } from "../shared/reveal"
import type { Product } from "@/lib/types"

interface NewArrivalsProps {
  products?: Product[]
}

export function NewArrivals({ products: serverProducts }: NewArrivalsProps = {}) {
  const newArrivals = (serverProducts ?? [])
    .filter((p) => p.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  if (newArrivals.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <Reveal>
        <div className="flex items-end justify-between mb-8 lg:mb-12">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Just In</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">New Arrivals</h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {newArrivals.map((product, i) => (
          <Reveal key={product.id} delay={i * 0.07}>
            <ProductCard product={product} />
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
    </section>
  )
}
