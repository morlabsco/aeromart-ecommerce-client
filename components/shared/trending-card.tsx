"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Star } from "lucide-react"
import { toast } from "sonner"
import { useCartStore } from "../../lib/store/app-store"
import type { Product } from "@/lib/types"
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency"

/**
 * Nittonova-style product card (from the cropped Trending reference):
 * white rounded card, square contain-fit image, charcoal "Trending" chip +
 * orange discount pill, single-star rating row, one-line bold name, orange
 * price with strikethrough reference, full-width outlined orange
 * Add-to-Cart (variant-aware, stock-checked, toast feedback).
 */
export function TrendingCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (product.hasVariants) {
      // Default-select the first in-stock variant so the card can add to
      // cart directly without forcing the customer to the product page.
      const firstSku = product.variantSkus?.find((s) => s.stock > 0)
      if (!firstSku) {
        toast.info("No variant is currently in stock")
        return
      }
      const result = addItem(product, 1, firstSku.attributes, firstSku.sku)
      if (!result.ok || result.capped) {
        toast.error(
          result.available === 0
            ? `"${product.title}" is out of stock`
            : `Only ${result.available} of "${product.title}" are available`
        )
        return
      }
      toast.success("Added to cart")
      return
    }
    const result = addItem(product)
    if (!result.ok || result.capped) {
      toast.error(
        result.available === 0
          ? `"${product.title}" is out of stock`
          : `Only ${result.available} of "${product.title}" are available`
      )
      return
    }
    toast.success("Added to cart")
  }

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

  return (
    <div className="group relative flex flex-col rounded-xl bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg sm:p-4">
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
              <span className="rounded-full bg-header-nav px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <span className="rounded-full bg-black/70 px-4 py-1.5 text-sm font-semibold text-white">
              Unavailable
            </span>
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-brand text-brand" />
          <span className="text-xs font-bold text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>
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
            <span className="text-xs text-zinc-400 line-through">
              {formatCurrency(referencePrice, product.currency)}
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          className="mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-brand bg-transparent text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          <ShoppingBag className="h-4 w-4" />
          Add to Cart
        </button>
      </div>
    </div>
  )
}
