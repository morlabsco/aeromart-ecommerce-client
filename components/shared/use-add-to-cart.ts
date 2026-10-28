"use client"

import { toast } from "sonner"
import { useCartStore } from "@/lib/store/app-store"
import type { Product } from "@/lib/types"

/**
 * Variant-aware add-to-cart used by every product surface (grid card, list
 * row, …). Picks the first in-stock SKU for variant products, checks stock
 * and surfaces toasts — one implementation, no per-card copies.
 */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem)

  return (product: Product, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (product.hasVariants) {
      // Default-select the first in-stock variant so cards can add to cart
      // directly without forcing the customer to the product page.
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
}
