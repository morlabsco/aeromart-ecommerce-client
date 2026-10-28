"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Trash2,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Tag,
  Minus,
  Plus,
  Truck,
  Store,
  MapPin,
  Package,
  Lock,
} from "lucide-react"
import { useCartStore } from "../../../lib/store/app-store"
import { ThemedImage } from "../../../components/shared/themed-image"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "../../../lib/utils"
import { toast } from "sonner"
import { createOrder } from "@/lib/services/order"
import { getCouponByCode } from "@/lib/services/coupon"
import { getSettings } from "../../../lib/services/settings"
import { stripeInit, sslCommerzInit, bkashInit } from "@/lib/services/payment"
import { PHONE_ERROR_MESSAGE, PHONE_REGEX } from "@/lib/utils/phone"
import { formatCurrency, getOfferPrice } from "../../../lib/utils/currency"
import type { CartItem } from "../../../lib/types"
import type { Coupon, PaymentMethod, SettingsDeliveryOption } from "../../../lib/types/backend"
import { isErrorResult } from "../../../lib/utils/result"

/* ---------------------------------------------------------------------------
 * Nittonova checkout (from the cropped reference): cream page, numbered white
 * section cards (customer info → address → delivery method → coupon →
 * payment) with box radios, and a sticky Order Summary card with the orange
 * PLACE ORDER. Two steps kept: Review (editable cart) → Details.
 * ------------------------------------------------------------------------- */

type PaymentOption = PaymentMethod | "stripe" | "sslcommerz" | "bkash"

interface DeliveryChoice {
  id: string
  label: string
  description: string
  charge: number
  icon: typeof Store
}

/** Fallback options used when the backend/settings are unreachable. */
const FALLBACK_DELIVERY_OPTIONS: DeliveryChoice[] = [
  { id: "pickup", label: "Store Pickup", description: "Collect your order from our store.", charge: 0, icon: Store },
  { id: "inside-dhaka", label: "Inside Dhaka", description: "Delivery within Dhaka city.", charge: 90, icon: MapPin },
  { id: "outside-dhaka", label: "Outside Dhaka", description: "Delivery anywhere else in the country.", charge: 150, icon: Truck },
]

const DELIVERY_ICONS: Record<string, typeof Store> = {
  pickup: Store,
  "store-pickup": Store,
  "inside-dhaka": MapPin,
  "outside-dhaka": Truck,
  international: Package,
}

function optionIcon(name: string): typeof Store {
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return DELIVERY_ICONS[key] ?? DELIVERY_ICONS.pickup
}

function toDeliveryChoices(options: SettingsDeliveryOption[] | undefined): DeliveryChoice[] {
  if (!options || options.length === 0) return FALLBACK_DELIVERY_OPTIONS
  return options
    .filter((o) => o.isActive)
    .map((o) => ({
      id: o.name,
      label: o.name,
      description: o.country
        ? `Delivery to ${o.country}`
        : "Store pickup or international delivery",
      charge: o.charge,
      icon: optionIcon(o.name),
    }))
}

/** Computes the discount amount a coupon gives on a subtotal. */
function useCouponDiscount(coupon: Coupon | null, subtotalAmount: number): number {
  if (!coupon) return 0
  const raw =
    coupon.discountType === "percentage"
      ? (subtotalAmount * coupon.discountValue) / 100
      : coupon.discountValue
  return Math.min(
    Math.max(0, raw),
    coupon.maxDiscountAmount > 0 ? coupon.maxDiscountAmount : raw
  )
}

/** Effective unit price of a cart line: variant price, then offer, then base. */
function lineUnitPrice(item: CartItem): number {
  if (item.variantSku) {
    const sku = item.product.variantSkus?.find((s) => s.sku === item.variantSku)
    if (sku?.price != null) {
      return getOfferPrice(sku.price, item.product.offerPrice) ?? sku.price
    }
  }
  return getOfferPrice(item.product.price, item.product.offerPrice) ?? item.product.price
}

/** Unit price before any offer is applied (variant price ?? product price). */
function lineBasePrice(item: CartItem): number {
  if (item.variantSku) {
    const sku = item.product.variantSkus?.find((s) => s.sku === item.variantSku)
    if (sku?.price != null) return sku.price
  }
  return item.product.price
}

/** Total savings from active product offers across the cart lines. */
function offerDiscountFor(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + (lineBasePrice(item) - lineUnitPrice(item)) * item.quantity,
    0
  )
}

/** Numbered micro-label heading shared by every checkout section. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">
      {children}
    </h3>
  )
}

/**
 * Lets a customer change the variant of an item already in the cart. The old
 * line is removed and the new selection is re-added with the same quantity, so
 * the SKU-keyed cart stays consistent.
 */
function VariantSwitcher({
  item,
  onSwap,
}: {
  item: CartItem
  onSwap: (nextSku: string, nextVariant: Record<string, string>) => void
}) {
  const axes = (item.product.variants ?? []).map((axis) => ({
    ...axis,
    options: axis.options.filter((option) =>
      (item.product.variantSkus ?? []).some(
        (s) => s.attributes[axis.name] === option && s.stock > 0
      )
    ),
  }))

  const [selection, setSelection] = useState<Record<string, string>>(
    item.variant ?? {}
  )

  const resolvedSku =
    axes.length > 0 && axes.every((a) => selection[a.name])
      ? item.product.variantSkus?.find((s) =>
          axes.every((a) => s.attributes[a.name] === selection[a.name])
        )
      : undefined

  const sameSku = resolvedSku?.sku === item.variantSku

  return (
    <div className="space-y-2">
      {axes.map((axis) => (
        <div key={axis.name} className="flex flex-wrap items-center gap-2">
          <span className="w-14 shrink-0 text-xs font-semibold text-muted-foreground">
            {axis.name}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {axis.options.map((option) => {
              const active = selection[axis.name] === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setSelection((prev) => ({ ...prev, [axis.name]: option }))
                  }
                  className={cn(
                    "cursor-pointer rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-muted-foreground hover:border-brand/50 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={!resolvedSku || sameSku}
        onClick={() => {
          if (resolvedSku) onSwap(resolvedSku.sku, selection)
        }}
        className="cursor-pointer text-xs font-semibold text-brand transition-transform duration-300 hover:translate-x-1 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline disabled:hover:translate-x-0"
      >
        {sameSku ? "Current selection" : "Apply selection →"}
      </button>
    </div>
  )
}

export default function Checkout() {
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal)
  const clearCart = useCartStore((s) => s.clearCart)
  const itemCount = useCartStore((s) => s.itemCount)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()
  const [step, setStep] = useState<"cart" | "info">("cart")
  const [placing, setPlacing] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>("COD")
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryChoice[]>(FALLBACK_DELIVERY_OPTIONS)
  const [deliveryOption, setDeliveryOption] = useState<string>(FALLBACK_DELIVERY_OPTIONS[1].id)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponBusy, setCouponBusy] = useState(false)
  const [brandCurrency, setBrandCurrency] = useState<string | null>(null)

  // Load delivery options + the live display currency from the brand settings.
  useEffect(() => {
    let cancelled = false
    getSettings().then((result) => {
      if (cancelled) return
      const settings = isErrorResult(result) ? null : result.data
      setBrandCurrency(settings?.brand?.currency ?? null)
      const choices = toDeliveryChoices(settings?.brand?.deliveryOptions)
      if (choices.length === 0) return
      setDeliveryOptions(choices)
      // Default to the first non-free option if possible, else first.
      const defaultChoice = choices.find((c) => c.charge > 0) ?? choices[0]
      setDeliveryOption((prev) =>
        choices.some((c) => c.id === prev) ? prev : defaultChoice.id
      )
    })
    return () => {
      cancelled = true
    }
  }, [])

  const activeDelivery =
    deliveryOptions.find((o) => o.id === deliveryOption) ?? deliveryOptions[1]
  const deliveryCharge = activeDelivery.charge
  // "Pickup"-style options have a zero charge → no delivery address needed.
  const isPickup = deliveryCharge === 0

  // Discounted total after applying the coupon, plus delivery charge.
  const discount = useCouponDiscount(appliedCoupon, subtotal())
  // Savings from active product offers already reflected in the subtotal.
  const offerDiscount = offerDiscountFor(items)
  const finalTotal = Math.max(0, subtotal() - discount + deliveryCharge)

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

  /** Replaces an item's variant with a newly chosen SKU (same quantity). */
  const swapVariant = (
    item: (typeof items)[number],
    nextSku: string,
    nextVariant: Record<string, string>
  ) => {
    removeItem(item.product.id, item.variant, item.variantSku)
    const result = addItem(item.product, item.quantity, nextVariant, nextSku)
    if (!result.ok || result.capped) {
      toast.error(
        result.available === 0
          ? `"${item.product.title}" is out of stock`
          : `Only ${result.available} of "${item.product.title}" are available`
      )
    }
  }

  const applyCoupon = async () => {
    const code = couponCode.trim()
    if (!code) return
    setCouponBusy(true)
    try {
      const result = await getCouponByCode(code)
      if (isErrorResult(result)) {
        toast.error(result.message)
        return
      }
      const coupon = result.data
      if (subtotal() < coupon.minOrderAmount) {
        toast.error(`Minimum order amount for this coupon is ${formatCurrency(coupon.minOrderAmount, currency)}`)
        return
      }
      setAppliedCoupon(coupon)
      toast.success(`Coupon ${coupon.code} applied!`)
    } finally {
      setCouponBusy(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Name is required"
    if (!form.email.trim()) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format"
    if (!form.phone.trim()) errs.phone = "Phone is required"
    else if (!PHONE_REGEX.test(form.phone)) errs.phone = PHONE_ERROR_MESSAGE
    // Delivery address is only required when shipping (not store pickup).
    if (!isPickup) {
      if (!form.address.trim()) errs.address = "Address is required"
      if (!form.city.trim()) errs.city = "City is required"
      if (!form.state.trim()) errs.state = "State is required"
      if (!form.zip.trim()) errs.zip = "ZIP code is required"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePlaceOrder = async () => {
    if (!validate()) return

    // A variant product must always carry its concrete SKU.
    const missingSku = items.find(
      (i) =>
        (i.product.hasVariants ||
          (i.product.variants?.length ?? 0) > 0 ||
          (i.product.variantSkus?.length ?? 0) > 0) &&
        !i.variantSku
    )
    if (missingSku) {
      toast.error(
        `"${missingSku.product.title}" needs a variant selected. Go back and choose its options.`
      )
      setStep("cart")
      return
    }

    const shippingAddress = isPickup
      ? "Store Pickup"
      : [
          form.address,
          form.address2,
          form.city,
          form.state,
          form.zip,
          form.country,
        ].filter(Boolean).join(", ")

    const finalAmount = finalTotal
    const orderItems = items.map((i) => ({
      product: i.product.id,
      quantity: i.quantity,
      ...(i.variantSku ? { variant: { sku: i.variantSku } } : {}),
    }))

    setPlacing(true)
    try {
      // 1. Create the order on the backend. Totals are computed server-side.
      const orderResult = await createOrder({
        products: orderItems,
        coupon: appliedCoupon?.code,
        deliveryOptionName: activeDelivery.label,
        recipientName: form.name,
        phoneNo: form.phone,
        shippingAddress,
        paymentMethod: paymentMethod === "COD" ? "COD" : "Online",
      })

      if (isErrorResult(orderResult)) {
        toast.error(orderResult.message)
        return
      }

      const orderId = orderResult.data._id

      // 2. COD → done, go home.
      if (paymentMethod === "COD") {
        clearCart()
        toast.success("Order placed successfully! Payment on delivery.")
        router.push("/")
        return
      }

      // 3. Online gateways → initiate and redirect to the gateway.
      let gatewayUrl: string | null = null

      if (paymentMethod === "stripe") {
        const res = await stripeInit(orderId, {
          amount: finalAmount,
          currency: currency ?? "usd",
        })
        if (isErrorResult(res)) { toast.error(res.message); return }
        gatewayUrl = res.data.gatewayUrl
      } else if (paymentMethod === "sslcommerz") {
        const res = await sslCommerzInit(orderId, {
          total_amount: finalAmount,
          cus_name: form.name,
          cus_email: form.email,
          cus_phone: form.phone,
          cus_add1: form.address,
          cus_city: form.city,
          cus_state: form.state,
          cus_postcode: form.zip,
          cus_country: form.country,
          ship_name: form.name,
          ship_add1: form.address,
          ship_city: form.city,
          ship_state: form.state,
          ship_postcode: form.zip,
          ship_country: form.country,
        })
        if (isErrorResult(res)) { toast.error(res.message); return }
        gatewayUrl = res.data.gatewayUrl
      } else if (paymentMethod === "bkash") {
        const res = await bkashInit(orderId, { amount: finalAmount, customerNumber: form.phone })
        if (isErrorResult(res)) { toast.error(res.message); return }
        gatewayUrl = res.data.gatewayUrl
      }

      if (gatewayUrl) {
        clearCart()
        window.location.href = gatewayUrl
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to place order. Please try again.")
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-hero-surface">
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <span className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-card shadow-sm">
            <CreditCard className="size-9 text-brand" strokeWidth={1.5} />
          </span>
          <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Add some products to get started — your checkout will be ready in seconds.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-8 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  // Prefer the live brand currency from settings — cart item snapshots can
  // carry a currency stamped before the admin switched the store currency.
  const currency = brandCurrency ?? items[0]?.product.currency

  const field = (
    id: keyof typeof form,
    label: string,
    optional = false,
    type = "text"
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={form[id]}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        aria-invalid={!!errors[id]}
      />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  )

  /* ── Order summary card (shared by both steps) ── */
  const summaryCard = (
    <div className="sticky top-24 space-y-4 rounded-2xl bg-card p-6 shadow-sm">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">
        Order Summary
      </h3>
      <div className="max-h-64 space-y-3 overflow-y-auto">
        {items.map((item) => (
          <div
            key={`${item.product.id}-${JSON.stringify(item.variant)}`}
            className="flex items-center gap-3"
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-background">
              <ThemedImage
                src={
                  item.product.variantSkus?.find((s) => s.sku === item.variantSku)
                    ?.imageUrls?.[0] ?? item.product.image
                }
                alt={item.product.title}
                fallbackText={item.product.title}
                fill
                className="object-contain"
                placeholderClassName="text-[9px]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-bold text-foreground">
                {item.product.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.variant &&
                  `${Object.entries(item.variant)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")} · `}
                × {item.quantity}
              </p>
            </div>
            <span className="text-xs font-bold tabular-nums text-foreground">
              {formatCurrency(lineUnitPrice(item) * item.quantity, currency)}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal ({itemCount()} items)</span>
          <span className="tabular-nums">{formatCurrency(subtotal(), currency)}</span>
        </div>
        {offerDiscount > 0 && (
          <div className="flex justify-between text-success">
            <span>Offer Discount</span>
            <span>-{formatCurrency(offerDiscount, currency)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount ({appliedCoupon?.code})</span>
            <span>-{formatCurrency(discount, currency)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery</span>
          <span className={cn("tabular-nums", deliveryCharge === 0 && "text-success")}>
            {deliveryCharge === 0
              ? "Free"
              : formatCurrency(deliveryCharge, currency)}
          </span>
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-sm font-bold uppercase tracking-wide text-foreground">Total</span>
        <span className="text-xl font-extrabold text-brand tabular-nums">
          {formatCurrency(finalTotal, currency)}
        </span>
      </div>
      {step === "cart" ? (
        <>
          <Button variant="brand" size="xl" className="w-full" onClick={() => setStep("info")}>
            Proceed to Details
          </Button>
          <Link
            href="/products"
            className="block text-center text-sm font-semibold text-brand transition-transform duration-300 hover:translate-x-1"
          >
            Continue Shopping
          </Link>
        </>
      ) : (
        <>
          <Button
            variant="brand"
            size="xl"
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <Lock className="size-4" />
                Place Order
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setStep("cart")}
            disabled={placing}
          >
            <ArrowLeft className="size-4" /> Back to Cart
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="bg-hero-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Breadcrumb + heading */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link href="/" className="inline-block transition-colors hover:text-brand">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-foreground">Checkout</span>
        </nav>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground lg:text-4xl">
            Checkout{" "}
            <span className="font-bold text-muted-foreground">({itemCount()})</span>
          </h1>
        </div>

        {/* Steps */}
        <div className="mb-8 mt-6 flex gap-2">
          {(["cart", "info"] as const).map((s, i) => {
            const active = step === s
            const done = s === "cart" && step === "info"
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 transition-colors",
                  active
                    ? "border-header-nav bg-header-nav text-header-nav-foreground"
                    : done
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-border bg-card text-muted-foreground hover:border-brand/50 hover:text-brand"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded text-[11px] font-bold",
                    active ? "bg-header-nav-foreground/20" : "bg-muted"
                  )}
                >
                  {done ? <CheckCircle className="size-3.5" /> : i + 1}
                </span>
                <span className="text-sm font-semibold">
                  {s === "cart" ? "Review" : "Details"}
                </span>
              </button>
            )
          })}
        </div>

        {step === "cart" ? (
          /* ── Step 1: review the cart ── */
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${JSON.stringify(item.variant)}`}
                  className="rounded-2xl bg-card p-4 shadow-sm sm:p-5"
                >
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-background sm:h-28 sm:w-28">
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
                        placeholderClassName="text-sm"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.product.slug}`}
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
                        {formatCurrency(lineUnitPrice(item), currency)}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-full border border-border">
                          <button
                            type="button"
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
                            type="button"
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
                            item.product.currency
                          )}
                        </span>
                        <button
                          type="button"
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

                  {/* Change variant (variant products only) */}
                  {(item.product.variants?.length ?? 0) > 0 && (
                    <div className="mt-4 border-t border-border/60 pt-4">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">
                        Change options
                      </p>
                      <VariantSwitcher
                        item={item}
                        onSwap={(nextSku, nextVariant) =>
                          swapVariant(item, nextSku, nextVariant)
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="lg:col-span-1">{summaryCard}</div>
          </div>
        ) : (
          /* ── Step 2: details ── */
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Customer information */}
              <section className="space-y-5 rounded-2xl bg-card p-6 shadow-sm sm:p-8">
                <SectionTitle>01 · Customer Information</SectionTitle>
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">{field("name", "Full Name")}</div>
                  {field("email", "Email", false, "email")}
                  {field("phone", "Phone")}
                </div>
              </section>

              {/* Delivery address */}
              {!isPickup && (
                <section className="space-y-5 rounded-2xl bg-card p-6 shadow-sm sm:p-8">
                  <SectionTitle>02 · Delivery Address</SectionTitle>
                  <div className="space-y-5">
                    {field("address", "Address Line 1")}
                    {field("address2", "Address Line 2", true)}
                    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-3">
                      {field("city", "City")}
                      {field("state", "State")}
                      {field("zip", "ZIP Code")}
                    </div>
                  </div>
                </section>
              )}

              {/* Delivery method */}
              <section className="space-y-5 rounded-2xl bg-card p-6 shadow-sm sm:p-8">
                <SectionTitle>{isPickup ? "02" : "03"} · Delivery Method</SectionTitle>
                <RadioGroup
                  value={deliveryOption}
                  onValueChange={(value) => setDeliveryOption(value)}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {deliveryOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <Label
                        key={option.id}
                        className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors has-data-[state=checked]:border-brand has-data-[state=checked]:bg-brand/5"
                      >
                        <span className="flex items-start gap-3">
                          <RadioGroupItem value={option.id} className="mt-0.5" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-header-nav">
                                <Icon className="size-3.5 text-header-nav-foreground" />
                              </span>
                              {option.label}
                            </span>
                            <span className="mt-1.5 block text-xs leading-snug text-muted-foreground">
                              {option.description}
                            </span>
                            <span className="mt-2 block text-sm font-extrabold text-brand">
                              {option.charge === 0
                                ? "Free"
                                : formatCurrency(option.charge, currency)}
                            </span>
                          </span>
                        </span>
                      </Label>
                    )
                  })}
                </RadioGroup>
              </section>

              {/* Coupon */}
              <section className="space-y-5 rounded-2xl bg-card p-6 shadow-sm sm:p-8">
                <SectionTitle>{isPickup ? "03" : "04"} · Coupon</SectionTitle>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-success/40 bg-success/10 p-4">
                    <div className="flex items-center gap-2.5">
                      <Tag className="size-4 text-success" />
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appliedCoupon.discountType === "percentage"
                            ? `${appliedCoupon.discountValue}% off`
                            : `${formatCurrency(appliedCoupon.discountValue, currency)} off`}
                        </p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={removeCoupon}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Coupon code (e.g. SAVE20)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={applyCoupon}
                      disabled={couponBusy || !couponCode.trim()}
                    >
                      {couponBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                )}
              </section>

              {/* Payment method */}
              <section className="space-y-5 rounded-2xl bg-card p-6 shadow-sm sm:p-8">
                <SectionTitle>{isPickup ? "04" : "05"} · Payment Method</SectionTitle>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentOption)}
                  className="space-y-2.5"
                >
                  <Label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-colors has-data-[state=checked]:border-brand has-data-[state=checked]:bg-brand/5">
                    <RadioGroupItem value="COD" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">
                        Pay when your order arrives.
                      </p>
                    </div>
                  </Label>
                  {(
                    [
                      {
                        value: "stripe",
                        logo: "/images/stripe-pay-logo.png",
                        alt: "Stripe",
                        title: "Stripe",
                        desc: "Pay securely with a card.",
                      },
                      {
                        value: "sslcommerz",
                        logo: "/images/sslcommerz-pay-logo.png",
                        alt: "SSLCommerz",
                        title: "SSLCommerz",
                        desc: "Bangladesh online payment gateway.",
                      },
                      {
                        value: "bkash",
                        logo: "/images/bkash-pay-logo.png",
                        alt: "bKash",
                        title: "bKash",
                        desc: "Bangladesh mobile wallet.",
                      },
                    ] as const
                  ).map((method) => (
                    <Label
                      key={method.value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-colors has-data-[state=checked]:border-brand has-data-[state=checked]:bg-brand/5"
                    >
                      <RadioGroupItem value={method.value} />
                      <div className="flex items-center gap-3">
                        <Image
                          src={method.logo}
                          alt={method.alt}
                          width={0}
                          height={0}
                          sizes="100vw"
                          className="h-6 w-auto object-contain"
                        />
                        <div>
                          <p className="text-sm font-bold text-foreground">{method.title}</p>
                          <p className="text-xs text-muted-foreground">{method.desc}</p>
                        </div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </section>
            </div>

            <div className="lg:col-span-1">{summaryCard}</div>
          </div>
        )}
      </div>
    </div>
  )
}
