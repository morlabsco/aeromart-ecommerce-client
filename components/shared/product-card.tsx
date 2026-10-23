"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Eye, Star } from "lucide-react"
import { useCartStore } from "../../lib/store/app-store"
import { Product } from "../../lib/types"
import { toast } from "sonner"
import { Button, buttonVariants } from "../ui/button"
import { cn } from "@/lib/utils"
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency"

function hasImage(product: Product) {
  return product.image && product.image.length > 0
}

function ProductImage({ product, className }: { product: Product; className?: string }) {
  if (hasImage(product)) {
    return (
      <Image
        src={product.image}
        alt={product.title}
        fill
        className={className}
      />
    )
  }
  // No photo: show a themed gradient with the product title so it's clear the
  // product simply doesn't have images.
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/80 to-accent/80 p-4 ${className ?? ""}`}
    >
      <span className="line-clamp-3 text-center text-lg font-bold text-white/95 drop-shadow-sm">
        {product.title}
      </span>
    </div>
  )
}

interface ProductCardProps {
  product: Product
  variant?: "default" | "compact" | "minimal"
}

const imageStyles: Record<string, string> = {
  default: "aspect-[3/4] rounded-xl mb-4",
  compact: "aspect-square rounded-lg mb-3",
  minimal: "aspect-[4/5] rounded-xl",
}

function RatingStars({ rating, reviewCount, size = "sm" }: { rating: number; reviewCount: number; size?: "sm" | "lg" }) {
  return (
    <div className={`flex items-center gap-1.5 ${size === "lg" ? "mt-2" : "mt-1.5"}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"} ${
              i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
            }`}
          />
        ))}
      </div>
      <span className={`${size === "lg" ? "text-sm" : "text-xs"} text-zinc-500 dark:text-zinc-400`}>
        {rating}
        <span className="text-zinc-300 dark:text-zinc-600"> ({reviewCount})</span>
      </span>
    </div>
  )
}

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const { addItem } = useCartStore()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.hasVariants) {
      // Default-select the first in-stock variant so the card can add to cart
      // directly without forcing the customer to the product page first.
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

  // Active offer price (from offerPrice) + discount percent.
  const salePrice = getOfferPrice(product.price, product.offerPrice)
  const hasSale = salePrice !== null && salePrice < product.price
  const displayPrice = hasSale && salePrice !== null ? salePrice : product.price
  const referencePrice = product.compareAtPrice && product.compareAtPrice > product.price
    ? product.compareAtPrice
    : hasSale
    ? product.price
    : undefined
  const discountPercent =
    referencePrice && referencePrice > 0
      ? Math.round((1 - displayPrice / referencePrice) * 100)
      : null

  // ── Minimal variant ──
  if (variant === "minimal") {
    return (
      <Link href={`/products/${product.slug}`} className="group block">
        <div className={`relative ${imageStyles.minimal} overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm hover:shadow-lg transition-shadow duration-300`}>
          <ProductImage product={product} className="object-cover transition-transform duration-700 group-hover:scale-110" />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

          {/* Discount badge */}
          {discountPercent && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold shadow-lg z-10">
              -{discountPercent}%
            </span>
          )}

          {/* Hover content */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
            <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-2 leading-snug">
              {product.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-white text-base font-bold">{formatCurrency(displayPrice, product.currency)}</span>
              {referencePrice && referencePrice > displayPrice && (
                <span className="text-zinc-300 text-xs line-through">{formatCurrency(referencePrice, product.currency)}</span>
              )}
            </div>
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="sm" />
          </div>
        </div>
      </Link>
    )
  }

  // Not using this one - this block can be removed or deleted (verify first)
  // ── Compact variant ──
  if (variant === "compact") {
    return (
      <Link href={`/products/${product.slug}`} className="group block h-full">
        <div className={`relative ${imageStyles.compact} overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm hover:shadow-lg transition-shadow duration-300`}>
          <ProductImage
            product={product}
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {discountPercent && (
            <span className="absolute top-2 left-2 px-2 py-1 rounded-md bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold shadow-lg z-10">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{product.title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{product.category}</p>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{formatCurrency(displayPrice, product.currency)}</span>
            {referencePrice && referencePrice > displayPrice && (
              <span className="text-xs text-zinc-400 line-through">{formatCurrency(referencePrice, product.currency)}</span>
            )}
          </div>
          <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="sm" />
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </button>
            <span className="flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // ── Default variant ──
  return (
    <div className="group flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <ProductImage
          product={product}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent && (
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold shadow-lg">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg">
              Featured
            </span>
          )}
        </div>

        {!product.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px] z-10">
            <span className="text-white text-sm font-semibold bg-black/70 px-4 py-1.5 rounded-full">Unavailable</span>
          </div>
        )}

      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">{product.category}</p>

        <Link href={`/products/${product.slug}`}>
          <h3 className="text-base sm:text-lg font-bold line-clamp-2 leading-snug hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>

        <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="lg" />

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(displayPrice, product.currency)}</span>
          {referencePrice && referencePrice > displayPrice && (
            <span className="text-sm text-zinc-400 line-through">{formatCurrency(referencePrice, product.currency)}</span>
          )}
        </div>

        {/* Description excerpt on larger screens */}
        {product.description && (
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-2 hidden sm:block">
            {product.description}
          </p>
        )}

        {/* CTA row */}
        <div className="flex gap-2 mt-auto pt-4">
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="flex-1 flex items-center gap-1.5 h-9 text-xs sm:text-sm cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Add to Cart
          </Button>
          <Link
            href={`/products/${product.slug}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex items-center gap-1.5 h-9 px-3",
            )}
          >
            <Eye className="block h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Details</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
