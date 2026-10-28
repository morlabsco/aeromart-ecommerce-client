"use client"

import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react"
import { useCartStore, useUIStore } from "@/lib/store/app-store"
import { ScrollArea } from "../ui/scroll-area"
import { buttonVariants } from "../ui/button"
import { cn } from "@/lib/utils"
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency"
import Link from "next/link"
import { ThemedImage } from "./themed-image"
import { toast } from "sonner"
import type { CartItem } from "@/lib/types"

/**
 * Nittonova cart drawer (from the cropped cart references): white slide-out
 * with a "Shopping Cart" header + count chip, product rows (image, title,
 * variant, orange unit price, pill stepper, bold line total), and a footer
 * with subtotal, orange CHECKOUT and a Continue Shopping link.
 */
function lineUnitPrice(item: CartItem): number {
  if (item.variantSku) {
    const sku = item.product.variantSkus?.find((s) => s.sku === item.variantSku)
    if (sku?.price != null) {
      return getOfferPrice(sku.price, item.product.offerPrice) ?? sku.price
    }
  }
  return getOfferPrice(item.product.price, item.product.offerPrice) ?? item.product.price
}

export function CartSidebar({
  /** Live store currency from the brand settings — preferred for display. */
  currency,
}: {
  currency?: string | null
} = {}) {
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
        <div
          className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card shadow-2xl transition-transform duration-300 ease-in-out",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Shopping cart"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-foreground">Shopping Cart</h2>
              {count > 0 && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-brand-foreground">
                  {count}
                </span>
              )}
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {items.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-hero-surface">
                <ShoppingCart className="size-9 text-brand" strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground">Your cart is empty</h3>
                <p className="mt-1.5 max-w-[16rem] text-sm text-muted-foreground">
                  Explore our products and add the items you love — they&apos;ll show up here.
                </p>
              </div>
              <Link
                href="/products"
                onClick={() => setCartOpen(false)}
                className={cn(buttonVariants({ variant: "brand", size: "xl" }), "px-8")}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              {/* ── Item rows ── */}
              <ScrollArea className="flex-1 px-5">
                <div className="divide-y divide-border/60">
                  {items.map((item) => (
                    <div key={itemKey(item)} className="flex gap-4 py-4">
                      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-background">
                        <ThemedImage
                          src={
                            item.product.variantSkus?.find(
                              (s) => s.sku === item.variantSku
                            )?.imageUrls?.[0] ?? item.product.image
                          }
                          alt={item.product.title}
                          fallbackText={item.product.title}
                          fill
                          className="object-contain"
                          placeholderClassName="text-xs"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="line-clamp-2 text-sm font-bold text-foreground transition-colors hover:text-brand"
                        >
                          {item.product.title}
                        </Link>
                        {item.variant && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {Object.entries(item.variant)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-extrabold text-brand">
                          {formatCurrency(
                            lineUnitPrice(item),
                            currency ?? item.product.currency
                          )}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-full border border-border">
                            <button
                              onClick={() => changeQty(item, -1)}
                              className="flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-brand"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-7 select-none text-center text-sm font-bold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => changeQty(item, 1)}
                              className="flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-brand"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-foreground">
                            {formatCurrency(
                              lineUnitPrice(item) * item.quantity,
                              currency ?? item.product.currency
                            )}
                          </span>
                          <button
                            onClick={() =>
                              removeItem(item.product.id, item.variant, item.variantSku)
                            }
                            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remove item"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* ── Footer ── */}
              <div className="space-y-3 border-t border-border px-5 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-lg font-extrabold text-brand tabular-nums">
                    {formatCurrency(subtotal(), currency ?? items[0]?.product.currency)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping &amp; taxes calculated at checkout
                </p>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className={cn(buttonVariants({ variant: "brand", size: "xl" }), "w-full")}
                >
                  Checkout
                  <ArrowRight className="size-4" />
                </Link>
                <div className="flex items-center justify-between">
                  <Link
                    href="/products"
                    onClick={() => setCartOpen(false)}
                    className="inline-block text-sm font-semibold text-brand transition-transform duration-300 hover:translate-x-1"
                  >
                    Continue Shopping
                  </Link>
                  <button
                    onClick={clearCart}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Clear Cart
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
