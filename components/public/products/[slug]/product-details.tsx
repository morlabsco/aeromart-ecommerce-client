"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer, viewportOnce } from "@/components/shared/reveal"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Phone,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Zap,
  MessageSquareOff,
  MessageCircle,
} from "lucide-react"
import { useCartStore, useUIStore } from "@/lib/store/app-store"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProductCard } from "@/components/shared/product-card"
import { StarRating } from "@/components/shared/star-rating"
import { toast } from "sonner"
import { createReview } from "@/lib/services/review"
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency"
import type { Product } from "@/lib/types"
import type { Review } from "@/lib/types/backend"
import { isErrorResult } from "@/lib/utils/result"
import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
 * Nittonova product details (from the cropped reference): vertical thumbnail
 * gallery with an arrowed square main image, a buy box with the cream price
 * panel + spec bullets + pill quantity stepper + ADD TO CART / BUY NOW pair,
 * a collapsible DESCRIPTION card, a rating-bars reviews section and a
 * Similar Products grid of the shared ProductCard.
 * ------------------------------------------------------------------------- */

/* ── Zoomable main image ── */
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setOrigin({ x, y })
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-lg border border-border/60 bg-card"
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 45vw"
        priority
        className="object-contain p-4 transition-transform duration-150 ease-out will-change-transform"
        style={{
          transform: zoom ? "scale(2)" : "scale(1)",
          transformOrigin: `${origin.x}% ${origin.y}%`,
        }}
      />
    </div>
  )
}

/* ── Avatar tint rotation for review cards (theme tokens only) ── */
const AVATAR_TINTS = [
  "bg-brand text-brand-foreground",
  "bg-header-nav text-header-nav-foreground",
  "bg-teal text-teal-foreground",
  "bg-highlight text-highlight-foreground",
]

/* ── Main component ── */
interface ProductDetailsProps {
  product: Product
  related?: Product[]
  reviews?: Review[]
  /** Whether the current customer can write a review (logged-in customer). */
  canReview?: boolean
  /** Backend product id used when creating a review. */
  productId?: string
  /** Support phone from settings — powers the CALL / WhatsApp quick row. */
  contactPhone?: string | null
}

export default function ProductDetails({
  product,
  related,
  reviews = [],
  canReview = false,
  productId,
  contactPhone,
}: ProductDetailsProps) {
  const router = useRouter()
  const { addItem } = useCartStore()
  const { setCartOpen } = useUIStore()

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [descriptionOpen, setDescriptionOpen] = useState(true)
  const [visibleReviews, setVisibleReviews] = useState(6)

  // Review form state.
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const handleSubmitReview = async () => {
    if (!productId) return
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("Please select a star rating (1–5).")
      return
    }
    if (reviewText.trim().length < 5) {
      setReviewError("Please write at least a few words about the product.")
      return
    }
    setReviewError(null)
    setSubmittingReview(true)
    try {
      const result = await createReview({
        rating: reviewRating,
        description: reviewText.trim(),
        product: productId,
      })
      if (isErrorResult(result)) {
        setReviewError(result.message)
        toast.error(result.message)
        return
      }
      toast.success("Review submitted! Thank you.")
      setReviewRating(0)
      setReviewText("")
      router.refresh()
    } finally {
      setSubmittingReview(false)
    }
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link
          href="/products"
          className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
        >
          Back to Products
        </Link>
      </div>
    )
  }

  const relatedProducts = (related ?? []).filter(
    (p) => p.id !== product.id && p.isActive
  )

  // Offer-aware pricing: an active offerPrice overrides the base price.
  const salePrice = getOfferPrice(product.price, product.offerPrice)
  const hasOffer = salePrice !== null && salePrice < product.price

  const axes = (product.variants ?? []).map((axis) => ({
    ...axis,
    options: axis.options.filter((option) =>
      (product.variantSkus ?? []).some(
        (s) => s.attributes[axis.name] === option && s.stock > 0
      )
    ),
  }))

  // The concrete SKU matching the current selection, if complete.
  const selectedSku =
    axes.length > 0 && axes.every((a) => selectedVariants[a.name])
      ? product.variantSkus?.find((s) =>
          axes.every((a) => s.attributes[a.name] === selectedVariants[a.name])
        )
      : undefined

  const variantSelected = axes.length === 0 || Boolean(selectedSku)

  // Images: when the chosen SKU carries its own gallery, use it; otherwise
  // fall back to the product's main images.
  const skuImages = selectedSku?.imageUrls?.length ? selectedSku.imageUrls : []
  const galleryImages =
    skuImages.length > 0
      ? skuImages
      : product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : []

  // Price shown reflects the chosen variant while an offer is active: the
  // offer is applied on top of the variant's price (backend: variant.price ??
  // product.price). Without an offer the product price stands regardless of
  // the selected variant.
  const skuBasePrice = selectedSku?.price ?? product.price
  const skuSalePrice = hasOffer
    ? getOfferPrice(skuBasePrice, product.offerPrice) ?? skuBasePrice
    : undefined
  const displayPrice =
    skuSalePrice ?? (hasOffer && salePrice !== null ? salePrice : product.price)

  // Strikethrough shows the pre-offer price so the savings are visible.
  const referencePrice = hasOffer
    ? selectedSku?.price != null
      ? selectedSku.price
      : product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : product.price
    : product.compareAtPrice && product.compareAtPrice > product.price
    ? product.compareAtPrice
    : undefined
  const discount =
    referencePrice && referencePrice > 0
      ? Math.round((1 - displayPrice / referencePrice) * 100)
      : null

  // Stock of the resolved SKU (or base stock) to cap the quantity.
  const maxStock = selectedSku?.stock ?? product.stock ?? Infinity

  // Reset gallery index when the selected SKU changes its image set.
  useEffect(() => {
    setSelectedImage(0)
  }, [selectedSku?.sku])

  const stepImage = (dir: 1 | -1) =>
    setSelectedImage((i) =>
      galleryImages.length === 0
        ? 0
        : (i + dir + galleryImages.length) % galleryImages.length
    )

  const guardAndAdd = () => {
    if (!variantSelected) {
      toast.error("Please select all options to continue.")
      return null
    }
    const result = addItem(
      product,
      quantity,
      Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
      selectedSku?.sku
    )
    if (!result.ok || result.capped) {
      toast.error(
        result.available === 0
          ? `"${product.title}" is out of stock`
          : `Only ${result.available} of "${product.title}" are available`
      )
      return null
    }
    return result
  }

  const handleAddToCart = () => {
    if (guardAndAdd()) toast.success("Added to cart!")
  }

  const handleBuyNow = () => {
    if (guardAndAdd()) {
      setCartOpen(false)
      router.push("/checkout")
    }
  }

  // Review distribution for the summary bars.
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => Math.round(r.rating) === star).length
  )
  const ratingMax = Math.max(1, ...ratingCounts)
  const shownReviews = reviews.slice(0, visibleReviews)

  const whatsappHref = contactPhone
    ? `https://wa.me/${contactPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
        `Hi! I'm interested in "${product.title}".`
      )}`
    : null

  /* ── Thumbnail strip (vertical on desktop, horizontal on mobile) ── */
  const thumb = (img: string, i: number) => (
    <button
      key={i}
      onClick={() => setSelectedImage(i)}
      className={cn(
        "relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200 sm:size-20",
        selectedImage === i
          ? "border-brand shadow-md"
          : "border-transparent bg-card hover:border-brand/50"
      )}
      aria-label={`View image ${i + 1}`}
    >
      <Image src={img} alt="" fill sizes="80px" className="object-contain p-1" />
    </button>
  )

  return (
    <div className="bg-hero-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <Link href="/" className="inline-block transition-colors hover:text-brand">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/products" className="inline-block transition-colors hover:text-brand">
            Shop
          </Link>
          {product.category && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                href={`/products?category=${encodeURIComponent(product.category)}`}
                className="inline-block transition-colors hover:text-brand"
              >
                {product.category}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="line-clamp-1 max-w-[16rem] font-semibold text-foreground">
            {product.title}
          </span>
        </nav>

        {/* ── Main grid ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12"
        >
          {/* ── Left: gallery — vertical thumbs + arrowed main image ── */}
          <motion.div variants={fadeUp}>
            {galleryImages.length > 0 ? (
              <div className="flex flex-col-reverse gap-4 lg:flex-row">
                {galleryImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide lg:max-h-[560px] lg:flex-col lg:overflow-y-auto lg:pb-0 lg:pr-1">
                    {galleryImages.map(thumb)}
                  </div>
                )}
                <div className="relative flex-1">
                  <ZoomableImage
                    src={galleryImages[selectedImage]}
                    alt={product.title}
                  />
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={() => stepImage(-1)}
                        aria-label="Previous image"
                        className="absolute -left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:border-brand hover:text-brand lg:flex"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        onClick={() => stepImage(1)}
                        aria-label="Next image"
                        className="absolute -right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:border-brand hover:text-brand lg:flex"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-card">
                <span className="text-5xl font-bold text-muted-foreground/40">
                  {product.title.charAt(0)}
                </span>
              </div>
            )}
          </motion.div>

          {/* ── Right: buy box ── */}
          <motion.div variants={fadeUp} className="space-y-5">
            {/* Title + rating */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                {product.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <StarRating rating={product.rating} />
                <span className="text-sm text-muted-foreground">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({product.reviewCount} Reviews)
                </span>
                {product.brand && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {product.brand}
                  </span>
                )}
              </div>
            </div>

            {/* Cream price panel */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-hero-surface p-4 sm:p-5">
              <span className="text-3xl font-extrabold text-brand">
                {formatCurrency(displayPrice, product.currency)}
              </span>
              {referencePrice && referencePrice > displayPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(referencePrice, product.currency)}
                </span>
              )}
              {discount !== null && (
                <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
                  -{discount}% OFF
                </span>
              )}
            </div>

            {/* Spec bullets */}
            {product.keyFeatures && product.keyFeatures.length > 0 && (
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {product.keyFeatures.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {/* ── Variant picker ── */}
            {axes.length > 0 && (
              <div className="space-y-4">
                {axes.map((axis) => {
                  const isColor =
                    axis.name.toLowerCase().includes("color") ||
                    axis.name.toLowerCase().includes("colour")
                  return (
                    <div key={axis.name}>
                      <h3 className="mb-2 text-sm font-bold text-foreground">
                        {axis.name}:{" "}
                        <span className="font-normal text-muted-foreground">
                          {selectedVariants[axis.name] || "Select"}
                        </span>
                      </h3>
                      {isColor ? (
                        <div className="flex flex-wrap gap-2">
                          {axis.options.map((option) => {
                            const color =
                              product.colorOptions?.find(
                                (c) =>
                                  c.name.toLowerCase() === option.toLowerCase()
                              )?.hex ?? "#ccc"
                            const active = selectedVariants[axis.name] === option
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [axis.name]: option,
                                  }))
                                }
                                title={option}
                                aria-label={`Color ${option}`}
                                className={cn(
                                  "size-9 cursor-pointer rounded-full border-2 transition-all duration-200",
                                  active
                                    ? "scale-110 border-brand ring-2 ring-brand/30"
                                    : "border-border hover:border-foreground/40"
                                )}
                                style={{ backgroundColor: color }}
                              />
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {axis.options.map((option) => {
                            const active = selectedVariants[axis.name] === option
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [axis.name]: option,
                                  }))
                                }
                                className={cn(
                                  "cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200",
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
                      )}
                    </div>
                  )
                })}

                {selectedSku && (
                  <p className="text-xs text-muted-foreground">
                    SKU: <span className="font-mono">{selectedSku.sku}</span>
                    {selectedSku.stock > 0 && (
                      <span className="ml-2">· {selectedSku.stock} in stock</span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* ── Quantity — pill stepper ── */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-border bg-card">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-brand"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 select-none text-center text-base font-bold">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Increase quantity"
                  disabled={quantity >= maxStock}
                >
                  <Plus className="size-4" />
                </button>
              </div>
              {maxStock !== Infinity && maxStock > 0 && (
                <span className="text-xs text-muted-foreground">
                  {maxStock} available
                </span>
              )}
            </div>

            {/* ── ADD TO CART / BUY NOW ── */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="brandOutline"
                size="xl"
                className="flex-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="size-5" />
                Add to Cart
              </Button>
              <Button
                variant="brand"
                size="xl"
                className="flex-1"
                onClick={handleBuyNow}
              >
                <Zap className="size-5" />
                Buy Now
              </Button>
            </div>

            {/* ── Quick contact row (settings-driven, hidden without a phone) ── */}
            {contactPhone && (
              <div className="grid grid-cols-2 gap-3">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal/15 text-sm font-bold text-teal-foreground transition-colors hover:bg-teal/25"
                  >
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </a>
                )}
                <a
                  href={`tel:${contactPhone.replace(/\s/g, "")}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-header-nav text-sm font-bold text-header-nav-foreground transition-opacity hover:opacity-90"
                >
                  <Phone className="size-4" />
                  Call
                </a>
              </div>
            )}

            {/* ── Trust badges ── */}
            <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                  <Truck className="size-4 text-brand" />
                </span>
                Fast &amp; secure delivery
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                  <ShieldCheck className="size-4 text-brand" />
                </span>
                100% authentic products
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                  <RotateCcw className="size-4 text-brand" />
                </span>
                Easy return &amp; refund
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Description card (collapsible) ── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 lg:mt-16"
        >
          <div className="rounded-2xl bg-card p-6 shadow-sm sm:p-8">
            <button
              type="button"
              onClick={() => setDescriptionOpen((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between gap-4"
              aria-expanded={descriptionOpen}
            >
              <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-foreground">
                Description
              </h2>
              <ChevronDown
                className={cn(
                  "size-5 text-muted-foreground transition-transform duration-300",
                  descriptionOpen && "rotate-180"
                )}
              />
            </button>
            {descriptionOpen && (
              <div className="mt-6 space-y-6">
                {product.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                )}
                {product.fullDescription && (
                  <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    {product.fullDescription
                      .split(/\n+/)
                      .filter(Boolean)
                      .map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                  </div>
                )}
                {product.keyFeatures && product.keyFeatures.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
                      Key Features
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {product.keyFeatures.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.section>

        {/* ── Reviews ── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 lg:mt-16"
        >
          <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-foreground">
            Customer Reviews ({reviews.length})
          </h2>

          {reviews.length > 0 && (
            /* Summary: big average + distribution bars */
            <div className="mt-6 grid gap-8 rounded-2xl bg-card p-6 shadow-sm sm:grid-cols-2 sm:p-8">
              <div className="flex flex-col items-center justify-center gap-2 border-border/60 sm:border-r sm:pr-8">
                <span className="text-5xl font-extrabold text-foreground">
                  {product.rating.toFixed(1)}
                </span>
                <StarRating rating={product.rating} size="lg" />
                <span className="text-sm text-muted-foreground">
                  {reviews.length} review{reviews.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-2.5 sm:pl-2">
                {[5, 4, 3, 2, 1].map((star, i) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-3 text-right text-xs font-semibold text-muted-foreground">
                      {star}
                    </span>
                    <Star className="size-3.5 fill-brand text-brand" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${(ratingCounts[i] / ratingMax) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs text-muted-foreground">
                      {ratingCounts[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified-purchase gate notice */}
          {!canReview && (
            <div className="mt-6 rounded-full bg-warning/15 px-5 py-2.5 text-center text-xs font-semibold text-warning">
              Only customers who have purchased this product can leave a review.
            </div>
          )}

          {/* ── Write a review (logged-in customers) ── */}
          {canReview && (
            <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm sm:p-8">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground">
                Write a Review
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-foreground">
                    Your Rating
                  </Label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewRating(i + 1)}
                        aria-label={`Rate ${i + 1} star${i + 1 > 1 ? "s" : ""}`}
                        className="cursor-pointer p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "size-7",
                            i < reviewRating
                              ? "fill-brand text-brand"
                              : "fill-muted-foreground/30 text-muted-foreground/30"
                          )}
                        />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {reviewRating}/5
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="review-text"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Your Review
                  </Label>
                  <Textarea
                    id="review-text"
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="What did you like or dislike about this product?"
                  />
                </div>

                {reviewError && (
                  <p className="text-sm text-destructive">{reviewError}</p>
                )}

                <Button
                  variant="brand"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-hero-surface">
                <MessageSquareOff className="size-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No reviews yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Be the first to share your thoughts on this product.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {shownReviews.map((review, i) => (
                  <div
                    key={review._id}
                    className="rounded-2xl bg-card p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                            AVATAR_TINTS[i % AVATAR_TINTS.length]
                          )}
                        >
                          {(review.user?.name ?? "A").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {review.user?.name ?? "Anonymous"}
                            </span>
                            {review.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                                <Check className="size-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="mt-1">
                            <StarRating rating={review.rating} />
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {review.description}
                    </p>
                  </div>
                ))}
              </div>

              {visibleReviews < reviews.length && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleReviews((v) => v + 6)}
                    className="inline-block cursor-pointer rounded-full border border-border bg-hero-surface px-8 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-brand hover:text-brand"
                  >
                    Load More Reviews
                  </button>
                </div>
              )}
            </>
          )}
        </motion.section>

        {/* ── Similar products ── */}
        {relatedProducts.length > 0 && (
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="mt-12 lg:mt-16"
          >
            <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-foreground">
              Similar Products
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
