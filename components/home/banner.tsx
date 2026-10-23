"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import type { HeroSlide } from "@/lib/types/backend"

const gradientPresets = [
  "from-primary to-accent",
  "from-accent to-primary/80",
  "from-primary/90 to-accent/70",
]

function hasImage(slide: { image: string }) {
  return slide.image && slide.image.length > 0
}

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
    if (!api) return

    const interval = setInterval(() => {
      if (interactedRef.current) return
      if (api.canScrollNext()) api.scrollNext()
      else api.scrollTo(0)
    }, 5000)

    return () => clearInterval(interval)
  }, [api])

  const handleInteraction = (fn: () => void) => {
    interactedRef.current = true
    fn()
  }

  return (
    <section className="relative overflow-hidden">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent className="-ml-0">
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="relative h-full flex items-center">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />

                {/* Background - image or theme gradient */}
                {hasImage(slide) ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradientPresets[index % gradientPresets.length]}`}
                  />
                )}

                {/* Content */}
                <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-2xl"
                  >
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                      {slide.headline}
                    </h1>
                    <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-zinc-300 max-w-xl leading-relaxed">
                      {slide.subtext}
                    </p>
                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Link
                        href={slide.ctaLink || "/products"}
                        className="inline-flex h-10 sm:h-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-red-900 text-sm sm:text-base px-6 sm:px-8 font-medium transition-all outline-none select-none"
                      >
                        {slide.ctaText}
                      </Link>
                      <Link
                        href="/about"
                        className="inline-flex h-10 sm:h-9 items-center justify-center rounded-lg border border-white/20 text-white hover:bg-white/10 text-sm sm:text-base px-6 sm:px-8 font-medium transition-all outline-none select-none"
                      >
                        Learn More
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Previous/Next arrows */}
        <button
          onClick={() => handleInteraction(() => api?.scrollPrev())}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center size-9 sm:size-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-primary/40 transition-all cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-4 sm:size-5" />
        </button>
        <button
          onClick={() => handleInteraction(() => api?.scrollNext())}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center size-9 sm:size-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-primary/40 transition-all cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="size-4 sm:size-5" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleInteraction(() => api?.scrollTo(index))}
              className={`rounded-full transition-all duration-300 ${
                index === current
                  ? "w-6 sm:w-8 h-1.5 sm:h-2 bg-white"
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </section>
  )
}
