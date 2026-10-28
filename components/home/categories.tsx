"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { themes, DEFAULT_NICHE } from "../../lib/theme.config"

const theme = themes[DEFAULT_NICHE]

export interface CategoryItem {
  name: string
  slug: string
  image: string
}

function CategoryTile({ cat }: { cat: CategoryItem }) {
  return (
    <Link
      href={`/products?category=${cat.slug}`}
      className="group flex h-[160px] w-[160px] flex-col rounded-2xl border border-border/70 bg-muted p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand hover:bg-card hover:shadow-lg sm:h-32 sm:w-32 lg:h-36 lg:w-36"
    >
      {cat.image && cat.image.length > 0 ? (
        <span
          role="img"
          aria-label={cat.name}
          className="relative flex-1 rounded-xl bg-contain bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-[1.03]"
          style={{ backgroundImage: `url(${cat.image})` }}
        />
      ) : (
        <span className="relative flex flex-1 items-center justify-center rounded-xl bg-background/60 text-2xl font-bold uppercase text-muted-foreground">
          {cat.name.charAt(0)}
        </span>
      )}
      {/* Plain text title on a clean strip — no chip background */}
      <span className="flex h-8 shrink-0 items-center justify-center">
        <span className="w-full truncate text-center text-[12px] font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
          {cat.name}
        </span>
      </span>
    </Link>
  )
}

/**
 * Nittonova categories strip: squared-rounded tiles with inner padding —
 * the image sits inset with its own rounding and the title is plain text in
 * a clean strip below it. Hover lifts the box, transitions its background
 * to white, zooms the image slightly, and turns the title primary.
 *
 * Few tiles: the row is a plain centered flex list (guaranteed centering,
 * nothing to scroll). Enough tiles to overflow: it becomes a draggable
 * looping carousel that auto-shifts (pauses on hover, stops after a manual
 * drag). The component measures the tiles on mount and on resize and
 * switches between the two modes by itself.
 */
export function Categories({ categories: serverCategories }: { categories?: CategoryItem[] } = {}) {
  const categories = serverCategories && serverCategories.length > 0
    ? serverCategories
    : theme.categories

  const [api, setApi] = useState<CarouselApi>()
  const [fits, setFits] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const hoveredRef = useRef(false)
  const interactedRef = useRef(false)

  useEffect(() => {
    if (!api || fits) return
    const interval = setInterval(() => {
      if (hoveredRef.current || interactedRef.current) return
      if (api.canScrollNext()) api.scrollNext()
      else api.scrollTo(0)
    }, 3500)
    return () => clearInterval(interval)
  }, [api, fits])

  // Carousel mode: when the tiles no longer overflow the viewport, switch
  // to the static centered row.
  useEffect(() => {
    if (!api) return
    const check = () => {
      const container = api.containerNode()
      const root = api.rootNode()
      if (container.scrollWidth <= root.clientWidth + 1) setFits(true)
    }
    check()
    api.on("reInit", check)
    window.addEventListener("resize", check)
    return () => {
      api.off("reInit", check)
      window.removeEventListener("resize", check)
    }
  }, [api])

  // Static mode: when the row starts overflowing again, switch back to the
  // draggable carousel.
  useEffect(() => {
    if (!fits || !listRef.current) return
    const check = () => {
      const el = listRef.current
      if (el && el.scrollWidth > el.clientWidth + 1) setFits(false)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [fits])

  if (!categories || categories.length === 0) return null

  return (
    <section
      aria-label="Shop by category"
      className="bg-background py-8 sm:py-10 lg:py-12"
      onMouseEnter={() => (hoveredRef.current = true)}
      onMouseLeave={() => (hoveredRef.current = false)}
      onPointerDown={() => (interactedRef.current = true)}
    >
      {/* Same max-width and gutters as the hero banner above it */}
      <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-5 lg:px-8">
        {fits ? (
          // Few tiles: centered, nothing to scroll.
          <ul ref={listRef} className="flex list-none justify-center gap-4 py-4">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <CategoryTile cat={cat} />
              </li>
            ))}
          </ul>
        ) : (
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true, dragFree: true }}
            className="w-full"
          >
            {/* py on the viewport gives the hover lift + shadow room inside
                the overflow-hidden clip box (clipping happens at the padding
                edge, so the animation stays fully visible). */}
            <CarouselContent viewportClassName="py-4">
              {categories.map((cat) => (
                <CarouselItem key={cat.slug} className="basis-auto pl-4">
                  <CategoryTile cat={cat} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
      </div>
    </section>
  )
}
