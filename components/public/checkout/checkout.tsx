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
  Lock,
  Copy,
} from "lucide-react"
import { useCartStore } from "../../../lib/store/app-store"
import { ThemedImage } from "../../../components/shared/themed-image"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { DistrictCombobox } from "../../../components/public/checkout/district-combobox"
import { cn } from "../../../lib/utils"
import { toast } from "sonner"
import { createOrder } from "@/lib/services/order"
import { getCouponByCode } from "@/lib/services/coupon"
import { getSettings } from "../../../lib/services/settings"
import { stripeInit } from "@/lib/services/payment"
import { PHONE_ERROR_MESSAGE, PHONE_REGEX } from "@/lib/utils/phone"
import { focusFirstInvalidField, notifyInvalidFields } from "@/lib/utils/form-feedback"
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

type PaymentOption = PaymentMethod | "stripe" | "bkash-manual" | "bank-manual"

/**
 * Manual payment destinations (docs/data/payment-info.md). Shown to the
 * customer with copy buttons; the payment references they submit are stored
 * on the order's notes for admin verification.
 */
const BKASH_NUMBER = "+8801823803467"
const BANK_DETAILS = [
  { label: "Bank", value: "Prime Bank PLC" },
  { label: "Account Name", value: "MD JUBAYER AHMED" },
  { label: "Account No", value: "3115212035625" },
  { label: "Branch", value: "IBB, Amberkhana Branch, Sylhet" },
  { label: "Routing No", value: "170910046" },
] as const

interface DeliveryChoice {
  id: string
  label: string
  description: string
  charge: number
}

/** Fallback options used when the backend/settings are unreachable. */
const FALLBACK_DELIVERY_OPTIONS: DeliveryChoice[] = [
  { id: "pickup", label: "Store Pickup", description: "Collect your order from our store.", charge: 0 },
  { id: "inside-dhaka", label: "Inside Dhaka", description: "Delivery within Dhaka city.", charge: 90 },
  { id: "outside-dhaka", label: "Outside Dhaka", description: "Delivery anywhere else in the country.", charge: 150 },
]

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

/** One copyable manual-payment detail row: label, value, copy button. */
function CopyRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error("Couldn't copy — please copy it manually.")
    }
  }
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
        highlight ? "border-brand/40 bg-brand/5" : "border-border bg-card"
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={cn("truncate text-sm font-bold tabular-nums", highlight ? "text-brand" : "text-foreground")}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-brand hover:text-brand"
      >
        <Copy className="size-3.5" />
      </button>
    </div>
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
    district: "",
    notes: "",
  })
  // References the customer submits for manual payments (bKash / bank) so
  // the admin can verify and mark the order paid.
  const [manualPayment, setManualPayment] = useState({
    bkashSender: "",
    bkashTrxId: "",
    bankRef: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>("COD")
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryChoice[]>(FALLBACK_DELIVERY_OPTIONS)
  const [deliveryOption, setDeliveryOption] = useState<string>(FALLBACK_DELIVERY_OPTIONS[1].id)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Terms acceptance — required before the order can be placed.
  const [agreedTerms, setAgreedTerms] = useState(false)
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
    // Email is optional — only validate the format when provided.
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email format"
    if (!form.phone.trim()) errs.phone = "Phone is required"
    else if (!PHONE_REGEX.test(form.phone)) errs.phone = PHONE_ERROR_MESSAGE
    // Delivery address is only required when shipping (not store pickup).
    if (!isPickup) {
      if (!form.address.trim()) errs.address = "Address is required"
      if (!form.district.trim()) errs.district = "Please select your district"
    }
    // Manual payments need their verification references.
    if (paymentMethod === "bkash-manual") {
      if (!manualPayment.bkashSender.trim()) errs.bkashSender = "Your bKash sender number is required"
      if (!manualPayment.bkashTrxId.trim()) errs.bkashTrxId = "The bKash Transaction ID is required"
    }
    if (paymentMethod === "bank-manual" && !manualPayment.bankRef.trim()) {
      errs.bankRef = "The NPSB transaction reference number is required"
    }
    // The policy agreement gates the order, like every other field.
    if (!agreedTerms) {
      errs.terms = "Please accept the Terms, Privacy & Refund Policy to continue"
    }
    setErrors(errs)
    return errs
  }

  const handlePlaceOrder = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      // Tell the user what's missing instead of failing silently — the
      // fields carry their inline errors + aria-invalid; this names them
      // and brings the first one into view.
      notifyInvalidFields(
        Object.keys(errs),
        {
          name: "Customer Name",
          email: "Email",
          phone: "Mobile Number",
          address: "Address",
          district: "District",
          bkashSender: "bKash Sender Number",
          bkashTrxId: "bKash Transaction ID",
          bankRef: "NPSB Reference",
          terms: "Policy agreement",
        },
        "place your order",
      )
      focusFirstInvalidField()
      return
    }

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
      : [form.address.trim(), form.district.trim(), "Bangladesh"]
          .filter(Boolean)
          .join(", ")

    const finalAmount = finalTotal
    const orderItems = items.map((i) => ({
      product: i.product.id,
      quantity: i.quantity,
      ...(i.variantSku ? { variant: { sku: i.variantSku } } : {}),
    }))

    // The order's `notes` carry the customer's special instructions plus the
    // manual-payment references the admin needs to verify the payment.
    const notesParts: string[] = []
    if (form.notes.trim()) notesParts.push(`Note: ${form.notes.trim()}`)
    if (paymentMethod === "bkash-manual") {
      notesParts.push(
        `bKash (manual) — Sender: ${manualPayment.bkashSender.trim()}, TrxID: ${manualPayment.bkashTrxId.trim()}`
      )
    }
    if (paymentMethod === "bank-manual") {
      notesParts.push(`Bank (manual) — NPSB Ref: ${manualPayment.bankRef.trim()}`)
    }
    const notes = notesParts.length > 0 ? notesParts.join(" | ") : undefined

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
        notes,
        paymentMethod: paymentMethod === "COD" ? "COD" : "Online",
      })

      if (isErrorResult(orderResult)) {
        toast.error(orderResult.message)
        return
      }

      const orderId = orderResult.data._id
      const friendlyOrderId = orderResult.data.orderId ?? orderId

      // 2. COD and manual payments → no gateway, land on the order success
      //    page with the shareable order id.
      if (paymentMethod === "COD" || paymentMethod === "bkash-manual" || paymentMethod === "bank-manual") {
        clearCart()
        toast.success(
          paymentMethod === "COD"
            ? "Order placed successfully! Payment on delivery."
            : "Order placed! We will confirm your payment shortly."
        )
        router.push(`/order/success?orderId=${encodeURIComponent(friendlyOrderId)}`)
        return
      }

      // 3. Stripe → initiate and redirect to the hosted checkout page.
      const res = await stripeInit(orderId, {
        amount: finalAmount,
        currency: currency ?? "usd",
      })
      if (isErrorResult(res)) { toast.error(res.message); return }

      clearCart()
      window.location.href = res.data.gatewayUrl
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
    type = "text",
    placeholder?: string
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
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        aria-invalid={!!errors[id]}
      />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  )

  /** Manual-payment reference input (bKash sender / TrxID, NPSB ref). */
  const manualField = (
    id: keyof typeof manualPayment,
    label: string,
    placeholder: string,
    type = "text"
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={manualPayment[id]}
        placeholder={placeholder}
        onChange={(e) =>
          setManualPayment({ ...manualPayment, [id]: e.target.value })
        }
        aria-invalid={!!errors[id]}
        className="bg-card"
      />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  )

  /* ── Order summary card (shared by both steps) ── */
  const summaryCard = (
    <div className="sticky top-20 space-y-4 rounded-2xl bg-card p-6 shadow-sm min-[860px]:top-[9.5rem] lg:top-[9.75rem]">
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
            <span className="flex flex-col items-end gap-0.5">
              {lineBasePrice(item) > lineUnitPrice(item) && (
                <span className="text-[11px] tabular-nums text-muted-foreground line-through decoration-muted-foreground/60">
                  {formatCurrency(lineBasePrice(item) * item.quantity, currency)}
                </span>
              )}
              <span className="text-xs font-bold tabular-nums text-foreground">
                {formatCurrency(lineUnitPrice(item) * item.quantity, currency)}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal ({itemCount()} items)</span>
          {/* Base prices (before offers) — the offer line below is the actual
              deduction; subtotal() alone is already offer-adjusted. */}
          <span className="tabular-nums">
            {formatCurrency(subtotal() + offerDiscount, currency)}
          </span>
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
          {/* Policy agreement — part of the same form's validation, so it
              lives right above the CTA it gates */}
          <div className="space-y-1.5">
            <Label
              htmlFor="checkout-terms"
              className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed font-normal text-muted-foreground"
            >
              <Checkbox
                id="checkout-terms"
                checked={agreedTerms}
                onCheckedChange={(checked) => {
                  setAgreedTerms(checked === true)
                  if (checked === true && errors.terms) {
                    setErrors((prev) => {
                      const { terms, ...rest } = prev
                      return rest
                    })
                  }
                }}
                aria-invalid={!!errors.terms}
                className="mt-0.5"
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/return-refund-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline font-semibold text-brand underline-offset-4 transition-colors hover:underline"
                >
                  Terms, Privacy &amp; Refund Policy
                </Link>
                .
              </span>
            </Label>
            {errors.terms && (
              <p className="text-xs text-destructive">{errors.terms}</p>
            )}
          </div>
          <Button
            variant="brand"
            size="xl"
            className={cn(
              "w-full",
              !placing && "animate-wiggle motion-reduce:animate-none"
            )}
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
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
                  {field("name", "Customer Name", false, "text", "Your Full Name")}
                  {field("phone", "Mobile Number", false, "tel", "01XXXXXXXXX")}
                  {field("email", "Email", true, "email", "rahimuddin@example.com")}
                </div>
              </section>

              {/* Delivery address */}
              {!isPickup && (
                <section className="space-y-5 rounded-2xl bg-card p-6 shadow-sm sm:p-8">
                  <SectionTitle>02 · Delivery Address</SectionTitle>
                  <div className="space-y-5">
                    {field(
                      "address",
                      "Address",
                      false,
                      "text",
                      "Road No. / Apartment / House No. / Street / Area / Ward"
                    )}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-foreground">
                        District
                      </Label>
                      <DistrictCombobox
                        value={form.district}
                        onChange={(district) => setForm({ ...form, district })}
                        invalid={!!errors.district}
                      />
                      {errors.district && (
                        <p className="text-xs text-destructive">{errors.district}</p>
                      )}
                    </div>
                    {field(
                      "notes",
                      "Special Notes",
                      true,
                      "text",
                      "Any delivery instruction we should know about…"
                    )}
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
                  {deliveryOptions.map((option) => (
                    <Label
                      key={option.id}
                      className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors has-data-[state=checked]:border-brand has-data-[state=checked]:bg-brand/5"
                    >
                      <span className="flex items-start gap-3">
                        <RadioGroupItem value={option.id} className="mt-0.5" />
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-foreground">
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
                  ))}
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
                  {/* Stripe — hosted card checkout (gateway redirect + invoice flow) */}
                  <Label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-colors has-data-[state=checked]:border-brand has-data-[state=checked]:bg-brand/5">
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
                        <p className="text-sm font-bold text-foreground">Stripe</p>
                        <p className="text-xs text-muted-foreground">Pay securely with your card.</p>
                      </div>
                    </div>
                  </Label>

                  {/* bKash — manual send-money with reference verification */}
                  <Label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-colors has-data-[state=checked]:border-brand has-data-[state=checked]:bg-brand/5">
                    <RadioGroupItem value="bkash-manual" />
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 shrink-0 items-center px-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/icons/bkash-logo.svg"
                          alt="bKash"
                          className="h-5 w-auto object-contain"
                        />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          bKash{" "}
                          <span className="text-xs font-semibold text-muted-foreground">
                            (Manual)
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Send Money from your bKash app, then submit the Transaction ID.
                        </p>
                      </div>
                    </div>
                  </Label>

                  {/* Bank — manual NPSB transfer with reference verification */}
                  <Label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-colors has-data-[state=checked]:border-brand has-data-[state=checked]:bg-brand/5">
                    <RadioGroupItem value="bank-manual" />
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 shrink-0 items-center px-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/icons/bank-transfer-logo.svg"
                          alt="Bank transfer"
                          className="h-7 w-auto object-contain"
                        />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          Bank Transfer{" "}
                          <span className="text-xs font-semibold text-muted-foreground">
                            (Manual)
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          NPSB transfer to our account, then submit the reference number.
                        </p>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>

                {/* Manual payment details for the selected method — copyable
                    destination info + the references we verify against */}
                {paymentMethod === "bkash-manual" && (
                  <div className="space-y-4 rounded-xl border border-brand/30 bg-brand/5 p-4 sm:p-5">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Send the total{" "}
                      <span className="font-bold text-foreground">
                        {formatCurrency(finalTotal, currency)}
                      </span>{" "}
                      to this bKash number using <span className="font-semibold text-foreground">Send Money</span>,
                      then enter your sender number and the Transaction ID below. We confirm your
                      order as soon as the payment is verified.
                    </p>
                    <CopyRow label="bKash Number" value={BKASH_NUMBER} highlight />
                    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                      {manualField(
                        "bkashSender",
                        "Your bKash Number",
                        "01XXXXXXXXX",
                        "tel"
                      )}
                      {manualField(
                        "bkashTrxId",
                        "Transaction ID",
                        "e.g. 9F3KX2PQ"
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === "bank-manual" && (
                  <div className="space-y-4 rounded-xl border border-brand/30 bg-brand/5 p-4 sm:p-5">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Transfer the total{" "}
                      <span className="font-bold text-foreground">
                        {formatCurrency(finalTotal, currency)}
                      </span>{" "}
                      to this account through NPSB / BEFTN, then enter the transaction
                      reference number below so we can verify and confirm your order.
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {BANK_DETAILS.map((detail) => (
                        <CopyRow
                          key={detail.label}
                          label={detail.label}
                          value={detail.value}
                          highlight={detail.label === "Account No"}
                        />
                      ))}
                    </div>
                    {manualField(
                      "bankRef",
                      "NPSB Transaction Reference No",
                      "Reference number from your bank"
                    )}
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-1">{summaryCard}</div>
          </div>
        )}
      </div>
    </div>
  )
}
