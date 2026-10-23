"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { CartItem, Customer, Order, OrderStatus, Product, SiteOffer } from "../types"
import { products as defaultProducts } from "../data/products"
import { orders as defaultOrders } from "../data/orders"
import { customers as defaultCustomers } from "../data/customers"
import { defaultOffer } from "../data/offer"
import { getOfferPrice } from "../utils/currency"

// ── Cart Store (persisted so the cart survives page reloads / sessions) ──

interface CartState {
  items: CartItem[]
  addItem: (
    product: Product,
    quantity?: number,
    variant?: Record<string, string>,
    variantSku?: string
  ) => CartMutationResult
  removeItem: (productId: string, variant?: Record<string, string>, variantSku?: string) => void
  updateQuantity: (productId: string, quantity: number) => CartMutationResult
  updateItemQuantity: (
    productId: string,
    quantity: number,
    variant?: Record<string, string>,
    variantSku?: string
  ) => CartMutationResult
  clearCart: () => void
  itemCount: () => number
  subtotal: () => number
}

/** Keys a cart line by product id + chosen variant so separate SKUs stay separate. */
function itemKey(
  productId: string,
  variant?: Record<string, string>,
  variantSku?: string
): string {
  return `${productId}|${variantSku ?? ""}|${JSON.stringify(variant ?? {})}`
}

/** Effective unit price of a cart line: variant price (offer-applied), then offer, then base. */
function lineUnitPrice(item: CartItem): number {
  if (item.variantSku) {
    const sku = item.product.variantSkus?.find((s) => s.sku === item.variantSku)
    if (sku?.price != null) {
      // Backend applies the product offer on top of the variant price.
      return getOfferPrice(sku.price, item.product.offerPrice) ?? sku.price
    }
  }
  return getOfferPrice(item.product.price, item.product.offerPrice) ?? item.product.price
}

/** Max purchasable quantity of a cart line: variant stock when a variant is
 *  chosen, else the product's own stock. Infinity when unknown. */
function lineMaxStock(item: CartItem): number {
  if (item.variantSku) {
    const sku = item.product.variantSkus?.find((s) => s.sku === item.variantSku)
    if (sku && typeof sku.stock === "number" && Number.isFinite(sku.stock)) {
      return sku.stock
    }
  }
  return item.product.stock != null && Number.isFinite(item.product.stock)
    ? item.product.stock
    : Infinity
}

/** Result of a cart mutation, letting the UI explain stock limits clearly. */
export interface CartMutationResult {
  ok: boolean
  /** True when the requested quantity was capped by available stock. */
  capped?: boolean
  /** Maximum quantity the line can hold. */
  available?: number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1, variant, variantSku) => {
        // Variant products must always be added with a concrete SKU; silently
        // ignoring them here would let a non-variant line into the cart.
        const needsSku =
          product.hasVariants ||
          (product.variantSkus?.length ?? 0) > 0 ||
          (product.variants?.length ?? 0) > 0
        if (needsSku && !variantSku) {
          console.warn(
            `[cart] ${product.title} requires a variant SKU, addItem blocked.`
          )
          return { ok: false }
        }

        const maxStock = lineMaxStock({
          product,
          quantity,
          variant,
          variantSku,
        })
        if (maxStock <= 0) {
          return { ok: false, capped: true, available: 0 }
        }

        const existing = get().items.find(
          (i) =>
            itemKey(i.product.id, i.variant, i.variantSku) ===
            itemKey(product.id, variant, variantSku)
        )
        const merged = Math.min((existing?.quantity ?? 0) + quantity, maxStock)
        const capped = merged < (existing?.quantity ?? 0) + quantity

        set((state) => {
          const key = itemKey(product.id, variant, variantSku)
          const line = state.items.find(
            (i) => itemKey(i.product.id, i.variant, i.variantSku) === key
          )
          if (line) {
            return {
              items: state.items.map((i) =>
                itemKey(i.product.id, i.variant, i.variantSku) === key
                  ? { ...i, quantity: merged }
                  : i
              ),
            }
          }
          return { items: [...state.items, { product, quantity: merged, variant, variantSku }] }
        })
        return { ok: true, capped, available: maxStock }
      },
      removeItem: (productId, variant, variantSku) => {
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i.product.id, i.variant, i.variantSku) !== itemKey(productId, variant, variantSku)
          ),
        }))
      },
      updateQuantity: (productId, quantity) => {
        const line = get().items.find((i) => i.product.id === productId)
        if (!line) return { ok: false }
        const maxStock = lineMaxStock(line)
        const clamped = Math.max(1, Math.min(quantity, maxStock))
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity: clamped } : i
          ),
        }))
        return { ok: true, capped: clamped !== quantity, available: maxStock }
      },
      updateItemQuantity: (productId, quantity, variant, variantSku) => {
        const key = itemKey(productId, variant, variantSku)
        const line = get().items.find(
          (i) => itemKey(i.product.id, i.variant, i.variantSku) === key
        )
        if (!line) return { ok: false }
        const maxStock = lineMaxStock(line)
        const clamped = Math.max(1, Math.min(quantity, maxStock))
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.product.id, i.variant, i.variantSku) === key
              ? { ...i, quantity: clamped }
              : i
          ),
        }))
        return { ok: true, capped: clamped !== quantity, available: maxStock }
      },
      clearCart: () => set({ items: [] }),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + lineUnitPrice(i) * i.quantity, 0),
    }),
    {
      name: "demo-ecomm-cart",
      partialize: (state) => ({ items: state.items }) as CartState,
    }
  )
)

// ── Product Store (Dashboard CRUD) ──

interface ProductState {
  products: Product[]
  getProduct: (slug: string) => Product | undefined
  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: defaultProducts,
  getProduct: (slug) => get().products.find((p) => p.slug === slug),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProduct: (id) => set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
}))

// ── Order Store (Dashboard) ──

interface OrderState {
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  getOrders: () => Order[]
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: defaultOrders,
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              statusHistory: [
                ...o.statusHistory,
                { status, timestamp: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    })),
  getOrders: () => get().orders,
}))

// ── Customer Store (Dashboard) ──

interface CustomerState {
  customers: Customer[]
  findCustomerByEmailOrPhone: (email: string, phone: string) => Customer | undefined
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: defaultCustomers,
  findCustomerByEmailOrPhone: (email, phone) =>
    get().customers.find((c) => c.email === email || c.phone === phone),
  addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomer: (id, updates) =>
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
}))

// ── Offer Store ──

interface OfferState {
  offer: SiteOffer
  updateOffer: (offer: SiteOffer) => void
}

export const useOfferStore = create<OfferState>((set) => ({
  offer: defaultOffer,
  updateOffer: (offer) => set({ offer }),
}))

// ── UI Store ──

interface UIState {
  isCartOpen: boolean
  setCartOpen: (open: boolean) => void
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  setCartOpen: (open) => set({ isCartOpen: open }),
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
}))
