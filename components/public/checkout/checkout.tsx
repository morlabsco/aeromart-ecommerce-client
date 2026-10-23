"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Trash2, CreditCard, CheckCircle, ArrowLeft, Loader2, Tag, Minus, Plus, Truck, Store, MapPin, Package } from "lucide-react"
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
import { getSettings } from "@/lib/services/settings"
import { stripeInit, sslCommerzInit, bkashInit } from "@/lib/services/payment"
import { PHONE_ERROR_MESSAGE, PHONE_REGEX } from "@/lib/utils/phone"
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency"
import type { CartItem } from "@/lib/types"
import type { Coupon, PaymentMethod, SettingsDeliveryOption } from "@/lib/types/backend"
import { isErrorResult } from "@/lib/utils/result"

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
        <div key={axis.name} className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-zinc-500 w-14 shrink-0">
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
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                  }`}
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
        className="text-xs font-medium text-primary hover:underline disabled:text-zinc-400 disabled:no-underline disabled:cursor-not-allowed"
      >
        {sameSku ? "Current selection" : "Apply selection"}
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

  // Load delivery options from the store's brand settings (active ones only).
  useEffect(() => {
    let cancelled = false
    getSettings().then((result) => {
      if (cancelled) return
      const settings = isErrorResult(result) ? null : result.data
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
        toast.error(`Minimum order amount for this coupon is ${formatCurrency(coupon.minOrderAmount, items[0]?.product.currency)}`)
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
          currency: items[0]?.product.currency ?? "usd",
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
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 h-16 w-16 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-zinc-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Add some products to get started</p>
        <Link
          href="/products"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 px-2.5 text-sm font-medium transition-all outline-none select-none"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

      <div className="flex gap-2 mb-8">
        {(["cart", "info"] as const).map((s, i) => {
          const active = step === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors cursor-pointer",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                  active ? "bg-primary-foreground/20" : "bg-zinc-200 dark:bg-zinc-700"
                )}
              >
                {active && step === "cart" ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="text-sm font-medium">
                {s === "cart" ? "Review" : "Details"}
              </span>
            </button>
          )
        })}
      </div>

      {step === "cart" ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.product.id}-${JSON.stringify(item.variant)}`} className="flex gap-4 p-4 rounded-xl border bg-white dark:bg-zinc-900">
                <div className="relative h-24 w-24 shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
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
                    placeholderClassName="text-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-1">{item.product.title}</h3>
                  {item.variant && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      {item.variantSku && (
                        <span className="font-mono ml-1">· {item.variantSku}</span>
                      )}
                    </p>
                  )}
                  <p className="text-sm font-semibold mt-1">{formatCurrency(lineUnitPrice(item) * item.quantity, item.product.currency)}</p>

                  {/* Quantity modify */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => changeQty(item, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm w-8 text-center font-medium tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(item, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id, item.variant, item.variantSku)}
                      className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Change variant (variant products only) */}
                  {(item.product.variants?.length ?? 0) > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-medium text-zinc-500 mb-1.5">
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
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl border bg-white dark:bg-zinc-900 p-6 space-y-4 sticky top-24">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal ({itemCount()} items)</span>
                  <span>{formatCurrency(subtotal(), items[0]?.product.currency)}</span>
                </div>
                {offerDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Offer Discount</span>
                    <span>-{formatCurrency(offerDiscount, items[0]?.product.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Delivery</span>
                  <span className={deliveryCharge === 0 ? "text-green-600" : ""}>
                    {deliveryCharge === 0
                      ? "Free"
                      : formatCurrency(deliveryCharge, items[0]?.product.currency)}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(finalTotal, items[0]?.product.currency)}</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => setStep("info")}>
                Proceed to Details
              </Button>
              <Link
                href="/products"
                className="inline-flex w-full h-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-2.5 text-sm font-medium transition-all outline-none select-none"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-white dark:bg-zinc-900 p-6 space-y-8">
              <h3 className="font-semibold">Customer Information</h3>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-8">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={errors.name ? "border-red-500" : ""} />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={errors.email ? "border-red-500" : ""} />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={errors.phone ? "border-red-500" : ""} />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>

              {!isPickup && (
                <>
                  <h3 className="font-semibold pt-6 border-t">Delivery Address</h3>

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address Line 1</Label>
                      <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={errors.address ? "border-red-500" : ""} />
                      {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                      <Input id="address2" value={form.address2} onChange={(e) => setForm({ ...form, address2: e.target.value })} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-x-6 gap-y-8">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={errors.city ? "border-red-500" : ""} />
                        {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={errors.state ? "border-red-500" : ""} />
                        {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input id="zip" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={errors.zip ? "border-red-500" : ""} />
                        {errors.zip && <p className="text-xs text-red-500">{errors.zip}</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <h3 className="font-semibold pt-6 border-t">Delivery Method</h3>
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
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-data-[state=checked]:border-primary"
                    >
                      <RadioGroupItem value={option.id} className="mt-0.5" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium text-sm">
                          <Icon className="h-4 w-4 shrink-0 text-primary" />
                          {option.label}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 leading-snug">
                          {option.description}
                        </p>
                        <p className="text-sm font-semibold mt-2">
                          {option.charge === 0
                            ? "Free"
                            : formatCurrency(option.charge, items[0]?.product.currency)}
                        </p>
                      </div>
                    </Label>
                  )
                })}
              </RadioGroup>

              <h3 className="font-semibold pt-6 border-t">Coupon</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{appliedCoupon.code}</p>
                      <p className="text-xs text-zinc-500">
                        {appliedCoupon.discountType === "percentage"
                          ? `${appliedCoupon.discountValue}% off`
                          : `${formatCurrency(appliedCoupon.discountValue, items[0]?.product.currency)} off`}
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
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              )}

              <h3 className="font-semibold pt-6 border-t">Payment Method</h3>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentOption)}
                className="space-y-2"
              >
                <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer has-data-[state=checked]:border-primary">
                  <RadioGroupItem value="COD" />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-xs text-zinc-500">Pay when your order arrives.</p>
                  </div>
                </Label>
                <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer has-data-[state=checked]:border-primary">
                  <RadioGroupItem value="stripe" />
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/stripe-pay-logo.png"
                      alt="Stripe"
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="h-6 w-auto object-contain"
                    />
                    <div>
                      <p className="font-medium">Stripe</p>
                      <p className="text-xs text-zinc-500">Pay securely with a card.</p>
                    </div>
                  </div>
                </Label>
                <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer has-data-[state=checked]:border-primary">
                  <RadioGroupItem value="sslcommerz" />
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/sslcommerz-pay-logo.png"
                      alt="SSLCommerz"
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="h-6 w-auto object-contain"
                    />
                    <div>
                      <p className="font-medium">SSLCommerz</p>
                      <p className="text-xs text-zinc-500">Bangladesh online payment gateway.</p>
                    </div>
                  </div>
                </Label>
                <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer has-data-[state=checked]:border-primary">
                  <RadioGroupItem value="bkash" />
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/bkash-pay-logo.png"
                      alt="bKash"
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="h-6 w-auto object-contain"
                    />
                    <div>
                      <p className="font-medium">bKash</p>
                      <p className="text-xs text-zinc-500">Bangladesh mobile wallet.</p>
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl border bg-white dark:bg-zinc-900 p-6 space-y-4 sticky top-24">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.product.id}-${JSON.stringify(item.variant)}`} className="flex justify-between text-sm">
                    <span className="text-zinc-500 line-clamp-1">
                      {item.product.title}
                      {item.variant && (
                        <span className="text-xs">
                          {" "}
                          ({Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")})
                        </span>
                      )}
                      {" "}× {item.quantity}
                    </span>
                    <span>{formatCurrency(lineUnitPrice(item) * item.quantity, item.product.currency)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal</span>
                  <span>{formatCurrency(subtotal(), items[0]?.product.currency)}</span>
                </div>
                {offerDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Offer Discount</span>
                    <span>-{formatCurrency(offerDiscount, items[0]?.product.currency)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-{formatCurrency(discount, items[0]?.product.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Delivery</span>
                  <span className={deliveryCharge === 0 ? "text-green-600" : ""}>
                    {deliveryCharge === 0
                      ? "Free"
                      : formatCurrency(deliveryCharge, items[0]?.product.currency)}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(finalTotal, items[0]?.product.currency)}</span>
                </div>
              </div>
              <Button className="w-full" onClick={handlePlaceOrder} disabled={placing}>
                {placing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("cart")} disabled={placing}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
