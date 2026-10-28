"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/shared/star-rating"
import { useAddToCart } from "@/components/shared/use-add-to-cart"
import type { Product } from "@/lib/types"
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency"

/** Display price / reference price / discount shared by card + list row. */
export function getProductPricing(product: Product) {
  const salePrice = getOfferPrice(product.price, product.offerPrice)
  const hasSale = salePrice !== null && salePrice < product.price
  const displayPrice = hasSale && salePrice !== null ? salePrice : product.price
  const referencePrice =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : hasSale
      ? product.price
      : undefined
  const discountPercent =
    referencePrice && referencePrice > 0
      ? Math.round((1 - displayPrice / referencePrice) * 100)
      : null
  return { displayPrice, referencePrice, discountPercent }
}

/**
 * The app-wide Nittonova product card (from the cropped Trending reference):
 * white rounded card, square contain-fit image, charcoal "Trending" chip +
 * orange discount pill, brand star rating row, one-line bold name, orange
 * price with strikethrough reference, full-width outlined orange
 * Add-to-Cart (variant-aware, stock-checked, toast feedback).
 * Every product grid in the app renders THIS card — no per-page cards.
 */
export function ProductCard({ product }: { product: Product }) {
  const addToCart = useAddToCart()
  const { displayPrice, referencePrice, discountPercent } = getProductPricing(product)

  return (
    <div className="group relative flex h-full flex-col rounded-xl bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg sm:p-4">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-lg bg-background"
      >
        {product.image && product.image.length > 0 ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(min-width: 1280px) 224px, (min-width: 1024px) 25vw, 45vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted p-4">
            <span className="line-clamp-3 text-center text-sm font-bold text-muted-foreground">
              {product.title}
            </span>
          </div>
        )}

        {(discountPercent || product.featured) && (
          <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
            {product.featured && (
              <span className="rounded-full bg-header-nav px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-header-nav-foreground">
                Trending
              </span>
            )}
            {discountPercent && (
              <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-brand-foreground">
                -{discountPercent}%
              </span>
            )}
          </div>
        )}

        {!product.isActive && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-scrim/50 backdrop-blur-[2px]">
            <span className="rounded-full bg-scrim/70 px-4 py-1.5 text-sm font-semibold text-scrim-foreground">
              Unavailable
            </span>
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <StarRating rating={product.rating} count={product.reviewCount} mode="compact" />
        <Link href={`/products/${product.slug}`} className="mt-1">
          <h3 className="truncate text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-brand sm:text-[15px]">
            {product.title}
          </h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-brand sm:text-xl">
            {formatCurrency(displayPrice, product.currency)}
          </span>
          {referencePrice && referencePrice > displayPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(referencePrice, product.currency)}
            </span>
          )}
        </div>
        <Button
          variant="brandOutline"
          onClick={(e) => addToCart(product, e)}
          className="mt-3 h-10 w-full"
        >
          <ShoppingBag className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </div>
  )
}
