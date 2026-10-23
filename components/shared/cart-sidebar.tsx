"use client"

import { X, ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { useCartStore, useUIStore } from "../../lib/store/app-store"
import { ScrollArea } from "../ui/scroll-area"
import { cn } from "../../lib/utils"
import { formatCurrency, getOfferPrice } from "../../lib/utils/currency"
import Link from "next/link"
import { ThemedImage } from "./themed-image"
import { toast } from "sonner"
import type { CartItem } from "@/lib/types"

/** Effective unit price of a cart line: variant price (offer-applied), then offer, then base. */
function lineUnitPrice(item: CartItem): number {
  if (item.variantSku) {
    const sku = item.product.variantSkus?.find((s) => s.sku === item.variantSku)
    if (sku?.price != null) {
      return getOfferPrice(sku.price, item.product.offerPrice) ?? sku.price
    }
  }
  return getOfferPrice(item.product.price, item.product.offerPrice) ?? item.product.price
}

export function CartSidebar() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotal = useCartStore((s) => s.subtotal)
  const isCartOpen = useUIStore((s) => s.isCartOpen)
  const setCartOpen = useUIStore((s) => s.setCartOpen)

  // Derive the count from the reactive items slice so the header updates
  // immediately when items change (no stale "10 items").
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  const itemKey = (item: (typeof items)[number]) =>
    `${item.product.id}-${item.variantSku ?? ""}-${JSON.stringify(item.variant)}`

  const changeQty = (item: (typeof items)[number], delta: number) => {
    const next = item.quantity + delta
    if (next < 1) return
    const result =
      item.variant && Object.keys(item.variant).length > 0
        ? updateItemQuantity(item.product.id, next, item.variant, item.variantSku)
        : updateQuantity(item.product.id, next)
    if (!result.ok || result.capped) {
      toast.error(
        result.available === 0
          ? `"${item.product.title}" is out of stock`
          : `Only ${result.available} of "${item.product.title}" are available`
      )
    }
  }

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl transition-transform duration-300 ease-in-out",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold block leading-none">Your Cart</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {count} {count === 1 ? "item" : "items"}
                </span>
              </div>
            </div>
            <button onClick={() => setCartOpen(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer" aria-label="Close cart">
              <X className="h-5 w-5" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">Your cart is empty</p>
              <Link
                href="/products"
                onClick={() => setCartOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 px-4 text-sm font-medium transition-all outline-none select-none"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={itemKey(item)}
                      className="flex gap-4 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                    >
                      <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                        <ThemedImage
                          src={
                            item.product.variantSkus?.find(
                              (s) => s.sku === item.variantSku
                            )?.imageUrls?.[0] ?? item.product.image
                          }
                          alt={item.product.title}
                          fallbackText={item.product.title}
                          fill
                          className="object-cover"
                          placeholderClassName="text-xs"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="text-sm font-medium hover:text-primary hover:underline line-clamp-1"
                        >
                          {item.product.title}
                        </Link>
                        {item.variant && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")}
                            {item.variantSku && (
                              <span className="font-mono ml-1">· {item.variantSku}</span>
                            )}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatCurrency(lineUnitPrice(item), item.product.currency)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => changeQty(item, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm w-6 text-center font-medium tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => changeQty(item, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.product.id, item.variant, item.variantSku)}
                            className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={clearCart}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear Cart
                  </button>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(subtotal(), items[0]?.product.currency)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Shipping calculated at checkout</p>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="inline-flex w-full h-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 px-2.5 text-sm font-medium transition-all outline-none select-none"
                >
                  Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
