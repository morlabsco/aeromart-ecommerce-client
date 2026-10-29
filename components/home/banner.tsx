"use client"

import { useState, useEffect, useRef } from "react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { CarouselDots } from "../shared/carousel-dots"
import type { HeroSlide } from "@/lib/types/backend"

/**
 * Nittonova hero banner, built from the cropped reference
 * (nittonova-home-page-large-device-hero-section.png).
 *
 * The reference is a single composed banner image (headline, logo and
 * products baked into the artwork) shown inset from the page edges with
 * ~8px rounded corners on a cream surface — no text overlay, no arrows.
 * Each settings hero slide renders the same way; slides without an image
 * fall back to a coded cream composition so the section never breaks.
 * With a single slide there are no indicators, exactly like the reference.
 */
export function Banner({ slides }: { slides: HeroSlide[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const interactedRef = useRef(false)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    api.on("reInit", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api || slides.length < 2) return
    const interval = setInterval(() => {
      if (interactedRef.current) return
      if (api.canScrollNext()) api.scrollNext()
      else api.scrollTo(0)
    }, 5000)
    return () => clearInterval(interval)
  }, [api, slides.length])

  if (!slides || slides.length === 0) return null

  return (
    <section aria-label="Featured promotions" className="bg-hero-surface">
      {/* The max-width inset wraps the CAROUSEL VIEWPORT, not each slide —
          embla's overflow-hidden viewport then clips slide transitions
          exactly at the banner's rounded edge, so incoming/outgoing artwork
          never sweeps across the full page width outside this container. */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:pt-6">
        <div className="relative">
          <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
            <CarouselContent className="-ml-0">
              {slides.map((slide, index) => (
                <CarouselItem key={index} className="pl-0">
                  {slide.image && slide.image.length > 0 ? (
                    /* Composed banner artwork, inset with rounded corners */
                    <div
                      role="img"
                      aria-label={slide.headline || "Promotion banner"}
                      className="aspect-[16/9] w-full rounded-lg bg-cover bg-center sm:aspect-[16/8] lg:aspect-[14/5]"
                      style={{ backgroundImage: `url(${slide.image})` }}
                    />
                  ) : (
                    /* Coded fallback for slides without artwork */
                    <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-4 rounded-lg bg-gradient-to-br from-[#EDE5D4] to-[#C4B69E] px-6 text-center sm:aspect-[16/8] lg:aspect-[14/5]">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-2xl font-bold text-brand-foreground">
                        ★
                      </span>
                      {slide.headline && (
                        <h1 className="max-w-xl text-2xl font-bold uppercase tracking-wide text-foreground sm:text-4xl">
                          {slide.headline}
                        </h1>
                      )}
                      {slide.subtext && (
                        <p className="max-w-md text-sm text-foreground/70 sm:text-base">{slide.subtext}</p>
                      )}
                      {slide.ctaText && (
                        <a
                          href={slide.ctaLink || "/products"}
                          className="mt-2 inline-flex h-10 items-center rounded-full bg-brand px-8 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
                        >
                          {slide.ctaText}
                        </a>
                      )}
                    </div>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Dots only when rotating multiple banners; single-slide stays clean
              like the reference (shared CarouselDots — same style as
              testimonials). */}
          <CarouselDots
            count={slides.length}
            current={current}
            onSelect={(index) => {
              interactedRef.current = true
              api?.scrollTo(index)
            }}
            className="absolute bottom-0.5 left-1/2 z-30 -translate-x-1/2 lg:bottom-1.5"
          />
        </div>
      </div>
      {/* Cream breathing room below the banner before the next section */}
      <div className="h-3 sm:h-4 lg:h-6" />
    </section>
  )
}
