import { ProductShelf } from "../shared/product-shelf"
import type { Product } from "@/lib/types"
import type { CategoryItem } from "./categories"

/** Nittonova renders one shelf per category (Massager, Kitchen, Gadget...).
 *  We cap both dimensions so a big catalog stays performant on the home page. */
const MAX_SHELVES = 10
const MAX_PRODUCTS_PER_SHELF = 10

interface CategoryShelvesProps {
  categories?: CategoryItem[]
  products?: Product[]
}

/**
 * Category-wise product shelves. Dynamically builds one shelf per category
 * that has at least one active product — new categories appear on the home
 * page automatically, empty ones are skipped, and the whole block renders
 * nothing when there is no category data or no matches. Each shelf is the
 * shared ProductShelf, so the design stays consistent app-wide.
 */
export function CategoryShelves({ categories, products }: CategoryShelvesProps) {
  const allProducts = products ?? []

  const shelves = (categories ?? [])
    .map((category) => ({
      ...category,
      shelfProducts: allProducts
        .filter(
          (p) =>
            p.isActive &&
            p.category &&
            p.category.toLowerCase() === category.name.toLowerCase()
        )
        .slice(0, MAX_PRODUCTS_PER_SHELF),
    }))
    .filter((shelf) => shelf.shelfProducts.length > 0)
    .slice(0, MAX_SHELVES)

  if (shelves.length === 0) return null

  return (
    <>
      {shelves.map((shelf) => (
        <ProductShelf
          key={shelf.slug}
          title={shelf.name}
          products={shelf.shelfProducts}
          viewAllHref={`/products?category=${shelf.slug}`}
          ariaLabel={`${shelf.name} products`}
        />
      ))}
    </>
  )
}
