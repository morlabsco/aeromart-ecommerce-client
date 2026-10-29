export type Niche = "clothing" | "eyewear" | "perfume_oil"

export interface StorefrontOfferPrice {
  type: "flat" | "percentage"
  value: number
  startAt?: string
  endAt?: string
  isActive?: boolean
}

export interface Product {
  id: string
  title: string
  slug: string
  /** Product-level stock code (parent SKU; variants carry their own). */
  sku?: string
  description: string
  fullDescription: string
  price: number
  compareAtPrice?: number
  /** Effective sale price from an active offer, if any. */
  offerPrice?: StorefrontOfferPrice
  /** Backend currency code, e.g. "usd", "bdt", "eur", "gbp", "aud". */
  currency?: string
  category: string
  brand?: string
  image: string
  images: string[]
  isActive: boolean
  featured: boolean
  ctaLabel: string
  variants?: Variant[]
  /** Concrete SKUs (attribute combos) when the product has variants. */
  variantSkus?: VariantSku[]
  /** Named color swatches for a color picker, when present. */
  colorOptions?: ColorOption[]
  /** True when the product requires a variant selection. */
  hasVariants?: boolean
  stock?: number
  rating: number
  reviewCount: number
  createdAt: string
  /** Short spec bullets shown on cards and the details buy box. */
  keyFeatures?: string[]
}

export interface Variant {
  name: string
  options: string[]
}

/** A concrete selectable SKU with its attribute combo and pricing/stock. */
export interface VariantSku {
  sku: string
  attributes: Record<string, string>
  price?: number
  stock: number
  /** Per-variant images (ordered); falls back to the product gallery when empty. */
  imageUrls?: string[]
}

export interface ColorOption {
  name: string
  hex: string
}

export interface Category {
  id: string
  name: string
  slug: string
  image: string
  productCount: number
}

export interface CartItem {
  product: Product
  quantity: number
  variant?: Record<string, string>
  /** Concrete SKU chosen when the product has variants. */
  variantSku?: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  createdAt: string
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: { productId: string; title: string; price: number; quantity: number }[]
  subtotal: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    country: string
  }
  statusHistory: { status: OrderStatus; timestamp: string }[]
  createdAt: string
  updatedAt: string
}

export interface Testimonial {
  id: string
  name: string
  avatar: string
  rating: number
  text: string
  role?: string
}

export interface SiteOffer {
  id: string
  productId: string
  title: string
  description: string
  image: string
  price: number
  compareAtPrice?: number
  ctaLabel: string
  isActive: boolean
}
