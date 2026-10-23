import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { themes, DEFAULT_NICHE } from "../../lib/theme.config"
import { Reveal } from "../shared/reveal"

const theme = themes[DEFAULT_NICHE]

const gradientPresets = [
  "from-primary/80 to-accent/80",
  "from-accent/80 to-primary/80",
  "from-primary/70 to-accent/60",
]

export interface CategoryItem {
  name: string
  slug: string
  image: string
}

function hasImage(item: { image: string }) {
  return item.image && item.image.length > 0
}

interface CategoriesProps {
  categories?: CategoryItem[]
}

export function Categories({ categories: serverCategories }: CategoriesProps = {}) {
  const categories = serverCategories && serverCategories.length > 0
    ? serverCategories
    : theme.categories

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <Reveal>
        <div className="flex items-end justify-between mb-8 lg:mb-12">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Collections</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Shop by Category</h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {categories.map((cat, index) => (
          <Reveal key={cat.slug} delay={index * 0.08}>
            <Link
              href={`/products?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-muted h-64 sm:h-72 lg:h-80 block"
            >
              {hasImage(cat) ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientPresets[index % gradientPresets.length]}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                <h3 className="text-2xl lg:text-3xl font-bold text-white">{cat.name}</h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Shop Now <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
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
