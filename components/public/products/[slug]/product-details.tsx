"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer, viewportOnce } from "@/components/shared/reveal"
import {
  ChevronLeft,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Zap,
  MessageSquareOff,
} from "lucide-react"
import { useCartStore, useUIStore } from "../../../../lib/store/app-store"
import { Button } from "../../../../components/ui/button"
import { Label } from "../../../../components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import { ProductCard } from "../../../../components/shared/product-card"
import { toast } from "sonner"
import { createReview } from "@/lib/services/review"
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency"
import type { Product } from "@/lib/types"
import type { Review } from "@/lib/types/backend"
import { isErrorResult } from "@/lib/utils/result"

/* ── Rating stars (reusable) ── */
function Rating({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < value
              ? "fill-amber-400 text-amber-400"
              : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
          }`}
        />
      ))}
    </div>
  )
}

/* ── Zoomable image ── */
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
      className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 cursor-crosshair"
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
        className="object-cover transition-transform duration-150 ease-out will-change-transform"
        style={{
          transform: zoom ? "scale(2.5)" : "scale(1)",
          transformOrigin: `${origin.x}% ${origin.y}%`,
        }}
      />
    </div>
  )
}

/* ── Main component ── */
interface ProductDetailsProps {
  product: Product
  related?: Product[]
  reviews?: Review[]
  /** Whether the current customer can write a review (logged-in customer). */
  canReview?: boolean
  /** Backend product id used when creating a review. */
  productId?: string
}

export default function ProductDetails({
  product,
  related,
  reviews = [],
  canReview = false,
  productId,
}: ProductDetailsProps) {
  const router = useRouter()
  const { addItem } = useCartStore()
  const { setCartOpen } = useUIStore()

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

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
          className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 px-2.5 text-sm font-medium transition-all outline-none select-none"
        >
          Back to Products
        </Link>
      </div>
    )
  }

  const allImages =
    product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : []

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
  const skuImages = selectedSku?.imageUrls?.length
    ? selectedSku.imageUrls
    : []
  const galleryImages =
    skuImages.length > 0
      ? skuImages
      : product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : []
  const activeImages = galleryImages.length > 0 ? galleryImages : allImages

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

  // Strikethrough shows the pre-offer price so the savings are visible: the
  // selected variant's own price when it has one, else compareAtPrice (when
  // higher) or the product price.
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

  const handleAddToCart = () => {
    if (!variantSelected) {
      toast.error("Please select all options to continue.")
      return
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
      return
    }
    toast.success("Added to cart!")
  }

  const handleBuyNow = () => {
    if (!variantSelected) {
      toast.error("Please select all options to continue.")
      return
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
      return
    }
    setCartOpen(false)
    router.push("/checkout")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Products
      </Link>

      {/* ── Main grid ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid lg:grid-cols-2 gap-8 lg:gap-12"
      >
        {/* ── Left: image gallery ── */}
        <motion.div variants={fadeUp} className="space-y-4">
          {activeImages.length > 0 ? (
            <>
              <ZoomableImage src={activeImages[selectedImage]} alt={product.title} />

              {/* Thumbnails */}
              {activeImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {activeImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                        selectedImage === i
                          ? "border-primary ring-1 ring-primary/30 shadow-md"
                          : "border-transparent bg-zinc-100 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-4xl font-bold text-zinc-300 dark:text-zinc-600">
                {product.title.charAt(0)}
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Right: product info ── */}
        <motion.div variants={fadeUp} className="space-y-6">
          {/* Category & title */}
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
              {product.category && (
                <p className="text-sm">
                  <span className="text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-wider mr-1.5">
                    Category
                  </span>
                  <span className="font-medium text-primary uppercase tracking-wider">
                    {product.category}
                  </span>
                </p>
              )}
              {product.brand && (
                <p className="text-sm">
                  <span className="text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-wider mr-1.5">
                    Brand
                  </span>
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    {product.brand}
                  </span>
                </p>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight">
              {product.title}
            </h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <Rating value={Math.round(product.rating)} size="md" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {product.rating}
              <span className="text-zinc-300 dark:text-zinc-600"> ({product.reviewCount} reviews)</span>
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatCurrency(displayPrice, product.currency)}</span>
            {referencePrice && referencePrice > displayPrice && (
              <>
                <span className="text-lg text-zinc-400 line-through">{formatCurrency(referencePrice, product.currency)}</span>
                {discount !== null && (
                  <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 text-xs font-bold">
                    {discount}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {product.fullDescription}
          </p>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* ── Variant picker ── */}
          {axes.length > 0 && (
            <div className="space-y-4">
              {axes.map((axis) => {
                const isColor =
                  axis.name.toLowerCase().includes("color") ||
                  axis.name.toLowerCase().includes("colour")
                return (
                  <div key={axis.name}>
                    <h3 className="text-sm font-semibold mb-2">
                      {axis.name}:{" "}
                      <span className="font-normal text-zinc-500">
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
                          const active =
                            selectedVariants[axis.name] === option
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
                              className={`h-9 w-9 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                                active
                                  ? "border-primary ring-2 ring-primary/30 scale-110"
                                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {axis.options.map((option) => {
                          const active =
                            selectedVariants[axis.name] === option
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
                              className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 cursor-pointer ${
                                active
                                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                              }`}
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
                    <span className="ml-2">
                      · {selectedSku.stock} in stock
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* ── Quantity ── */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold text-lg select-none">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Increase quantity"
                disabled={quantity >= maxStock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {maxStock !== Infinity && maxStock > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {maxStock} available
              </p>
            )}
          </div>

          {/* ── Buy Now + Add to cart ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1 text-base px-6 min-h-9 sm:min-h-10 cursor-pointer"
              onClick={handleBuyNow}
            >
              <Zap className="h-5 w-5 mr-2" />
              Buy Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 text-base px-6 min-h-9 sm:min-h-10 cursor-pointer"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-52 w-5 mr-2" />
              Add to Cart
            </Button>
          </div>

          {/* ── Trust badges ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <Truck className="h-5 w-5 shrink-0 text-primary" />
              <span>Free shipping on orders over {formatCurrency(200, product.currency)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
              <span>Premium quality guaranteed</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <RotateCcw className="h-5 w-5 shrink-0 text-primary" />
              <span>30-day easy returns</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Reviews section ── */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-16 lg:mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">Customer Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 mt-1">
                <Rating value={Math.round(product.rating)} size="md" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {product.rating} out of 5 ({reviews.length} reviews)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Write a review (logged-in customers) ── */}
        {canReview && (
          <div className="mb-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 sm:p-8">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Your Rating</Label>
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
                        className={`h-7 w-7 ${
                          i < reviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
                        }`}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="ml-2 text-sm text-zinc-500">
                      {reviewRating}/5
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-text" className="block text-sm font-medium">
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
                <p className="text-sm text-red-500">{reviewError}</p>
              )}

              <Button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview
                  ? "Submitting..."
                  : "Submit Review"}
              </Button>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <MessageSquareOff className="h-7 w-7 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold">No reviews yet</h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Be the first to share your thoughts on this product.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <Rating value={Math.round(review.rating)} size="sm" />
                  {review.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="h-3 w-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                  &ldquo;{review.description}&rdquo;
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-sm font-semibold">
                    {review.user?.name ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ── Related products ── */}
      {relatedProducts.length > 0 && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 lg:mt-20"
        >
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p, i) => (
              <motion.div key={p.id} variants={fadeUp} transition={{ delay: i * 0.06 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  )
}
