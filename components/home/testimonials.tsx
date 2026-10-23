"use client"

import { Star, Quote } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer, viewportOnce } from "../shared/reveal"
import { CarouselDots } from "../shared/carousel-dots"
import type { TestimonialItem } from "@/lib/types/backend"

export function Testimonials({
  heading,
  items,
}: {
  heading: string
  items: TestimonialItem[]
}) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

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

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="text-center mb-10 lg:mb-14"
      >
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Testimonials</p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          {heading || "What Our Customers Say"}
        </h2>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
      >
        <Carousel
          setApi={setApi}
          opts={{
            loop: true,
            align: "start",
            slidesToScroll: 1,
          }}
          className="w-full cursor-grab active:cursor-grabbing select-none"
        >
          <CarouselContent className="-ml-4">
            {items.map((t, index) => (
              <CarouselItem
                key={index}
                className="pl-4 pt-px pb-px basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <motion.div
                  variants={fadeUp}
                  className="h-full bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col"
                >
                  <Quote className="size-8 text-primary/30 mb-4" />
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${
                          i < t.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-foreground/90 leading-relaxed mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground overflow-hidden">
                      {t.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.avatar} alt={t.name} className="object-cover size-full" />
                      ) : (
                        t.name.split(" ").map((n) => n[0]).join("")
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </motion.div>

      {/* Dots — same shared style as the hero banner */}
      <CarouselDots
        count={items.length}
        current={current}
        onSelect={(index) => api?.scrollTo(index)}
        className="mt-4 justify-center"
      />
    </section>
  )
}
