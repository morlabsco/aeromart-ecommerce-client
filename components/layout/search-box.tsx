"use client"

import { useEffect, useId, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, PackageOpen, Search } from "lucide-react"
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { StorefrontOfferPrice } from "@/lib/types"

/** One live-search suggestion row. */
interface Suggestion {
  slug: string
  name: string
  /** Effective price (offer applied when active). */
  price: number
  /** Base price to strike through when an offer is active, else null. */
  referencePrice: number | null
  currency: string
  image: string
}

interface SearchBoxProps {
  /** Focus the input on mount (used by the mobile search panel). */
  autoFocus?: boolean
  /** Live store currency from the brand settings — price display fallback. */
  currency?: string | null
  /** Notified when the box closes itself (Escape, outside tap, navigation). */
  onClose?: () => void
  className?: string
}

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 350
const MAX_RESULTS = 6
/** Cap cached terms so the map can't grow unbounded in a long session. */
const MAX_CACHE_ENTRIES = 20

/**
 * Session-level cache shared by both header instances: typing a previous
 * term again resolves instantly with zero requests.
 */
const suggestionCache = new Map<string, Suggestion[]>()

/**
 * Cleans raw input into a safe search query. The backend builds a $regex
 * from this string, so regex metacharacters are stripped client-side to
 * keep malformed (or malicious) input from erroring or hammering the server.
 */
function sanitizeQuery(raw: string): string {
  return raw
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 60)
}

/** Raw shape of the fields requested from the public product endpoint. */
type ApiSuggestion = {
  name?: string
  slug?: string
  price?: number
  currency?: string
  offerPrice?: StorefrontOfferPrice | null
  imageUrls?: { url?: string; order?: number }[]
}

async function fetchSuggestions(
  query: string,
  signal: AbortSignal
): Promise<Suggestion[]> {
  const params = new URLSearchParams({
    searchTerm: query,
    limit: String(MAX_RESULTS),
    isActive: "true",
    // Keep the payload light — the dropdown only needs enough to render a row.
    fields: "name,slug,price,currency,offerPrice,imageUrls",
  })
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_API}/product?${params}`,
    { signal, cache: "no-store" }
  )
  if (!res.ok) throw new Error("Search request failed")
  const body: { data?: ApiSuggestion[] } = await res.json()

  return (body.data ?? []).flatMap((p) => {
    const slug = p.slug?.trim()
    const name = p.name?.trim()
    if (!slug || !name) return []
    const base = Number(p.price) || 0
    const offer = getOfferPrice(base, p.offerPrice)
    const image =
      [...(p.imageUrls ?? [])]
        .filter((img) => img.url)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url ?? ""
    return [
      {
        slug,
        name,
        price: offer ?? base,
        referencePrice: offer !== null && offer < base ? base : null,
        currency: p.currency ?? "",
        image,
      },
    ]
  })
}

/**
 * Nittonova-style search: bordered rectangular input with the orange
 * magnifier button. As the user types (debounced, min 2 characters) a
 * dropdown lists matching products — image, title and price rows with
 * hover/keyboard highlighting — above a centered "View all results for
 * "<query>"" button that opens the full products page. Requests are
 * debounced, aborted when superseded and cached per term, so typing is
 * always smooth and the backend never sees a request per keystroke.
 */
export function SearchBox({ autoFocus, currency, onClose, className }: SearchBoxProps) {
  const router = useRouter()
  const listId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [term, setTerm] = useState("")
  /** null = no completed search for the current term yet. */
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const query = sanitizeQuery(term)

  // Debounced live search: only fires for valid queries, aborts stale
  // requests and resolves cached terms without touching the network.
  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions(null)
      setStatus("idle")
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    const cached = suggestionCache.get(query)
    if (cached) {
      setSuggestions(cached)
      setStatus("idle")
      setOpen(true)
      setActiveIndex(-1)
      return
    }

    setStatus("loading")
    setOpen(true)
    setActiveIndex(-1)
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetchSuggestions(query, controller.signal)
        .then((results) => {
          if (suggestionCache.size >= MAX_CACHE_ENTRIES) {
            const oldest = suggestionCache.keys().next().value
            if (oldest !== undefined) suggestionCache.delete(oldest)
          }
          suggestionCache.set(query, results)
          setSuggestions(results)
          setStatus("idle")
        })
        .catch((error: unknown) => {
          if ((error as Error)?.name === "AbortError") return
          setSuggestions(null)
          setStatus("error")
        })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Close on outside taps. `onClose` also lets the mobile search panel
  // dismiss itself; on desktop it is a no-op.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (wrapperRef.current?.contains(e.target as Node)) return
      setOpen(false)
      setActiveIndex(-1)
      onClose?.()
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open, onClose])

  function closeAfterNavigation() {
    setOpen(false)
    setTerm("")
    setSuggestions(null)
    setActiveIndex(-1)
    onClose?.()
    inputRef.current?.blur()
  }

  function goToAllResults() {
    closeAfterNavigation()
    router.push(query ? `/products?search=${encodeURIComponent(query)}` : "/products")
  }

  function goToSuggestion(suggestion: Suggestion) {
    closeAfterNavigation()
    router.push(`/products/${suggestion.slug}`)
  }

  const showList = open && status === "idle" && (suggestions?.length ?? 0) > 0

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && showList) {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, (suggestions?.length ?? 0) - 1))
    } else if (e.key === "ArrowUp" && showList) {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const suggestion = activeIndex >= 0 ? suggestions?.[activeIndex] : undefined
      if (suggestion) goToSuggestion(suggestion)
      else goToAllResults()
    } else if (e.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
      onClose?.()
    }
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="flex h-11 w-full overflow-hidden rounded-md border border-input bg-background transition-shadow focus-within:border-ring/50 focus-within:ring-2 focus-within:ring-ring/25">
        <input
          ref={inputRef}
          type="search"
          value={term}
          autoFocus={autoFocus}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => suggestions && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search for products..."
          aria-label="Search products"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
          }
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none md:text-sm"
        />
        <button
          type="button"
          onClick={goToAllResults}
          aria-label="Search"
          className="flex w-12 shrink-0 cursor-pointer items-center justify-center bg-brand text-brand-foreground transition-colors hover:bg-brand/90"
        >
          {status === "loading" ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Search className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      {open && query.length >= MIN_QUERY_LENGTH && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 animate-in fade-in slide-in-from-top-1 overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl">
          {status === "loading" && (
            <ul aria-hidden="true" className="p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex animate-pulse items-center gap-3 px-1 py-2.5">
                  <span className="size-12 shrink-0 rounded-lg bg-muted" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3.5 w-3/5 rounded bg-muted" />
                    <span className="block h-3 w-1/4 rounded bg-muted" />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {status === "error" && (
            <div className="px-4 py-5 text-center text-sm text-muted-foreground">
              Couldn&apos;t load suggestions right now.
              <br />
              Try your search again in a moment.
            </div>
          )}

          {status === "idle" && suggestions !== null && suggestions.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
              <PackageOpen className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
              No products found for &ldquo;{query}&rdquo;
            </div>
          )}

          {showList && (
            <ul id={listId} role="listbox" aria-label="Search suggestions">
              {suggestions!.map((s, i) => (
                <li key={s.slug} id={`${listId}-opt-${i}`} role="option" aria-selected={i === activeIndex}>
                  <Link
                    href={`/products/${s.slug}`}
                    onClick={() => goToSuggestion(s)}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 transition-colors",
                      i === activeIndex ? "bg-muted" : "hover:bg-muted"
                    )}
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {s.image ? (
                        <Image
                          src={s.image}
                          alt=""
                          width={48}
                          height={48}
                          sizes="48px"
                          className="size-12 object-contain"
                        />
                      ) : (
                        <PackageOpen className="size-5 text-muted-foreground/60" strokeWidth={1.5} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground transition-colors group-hover:text-brand">
                        {s.name}
                      </span>
                    </span>
                    {/* Price column — right-aligned after the title, sale
                        price big with the deducted reference beneath it */}
                    <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                      <span className="text-base font-extrabold leading-tight text-brand">
                        {formatCurrency(s.price, currency || s.currency)}
                      </span>
                      {s.referencePrice !== null && (
                        <span className="text-xs leading-tight text-muted-foreground line-through">
                          {formatCurrency(s.referencePrice, currency || s.currency)}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {query.length >= MIN_QUERY_LENGTH && status !== "loading" && (
            <div className="border-t border-border/60 p-2.5 text-center">
              <button
                type="button"
                onClick={goToAllResults}
                className="inline-block cursor-pointer rounded-lg px-4 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand/10"
              >
                View all results for &ldquo;{query}&rdquo; &hellip;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
