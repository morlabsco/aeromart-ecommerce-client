"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { fadeUp, viewportOnce } from "../shared/reveal"
import { ThemedImage } from "../shared/themed-image"
import type { SettingsAbout, SettingsBrand } from "@/lib/types/backend"

export function BrandStory({
  brand,
  about,
}: {
  brand: SettingsBrand
  about: SettingsAbout
}) {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden bg-muted"
          >
            <ThemedImage
              src={about.image}
              alt={brand.name}
              fallbackText={brand.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase w-fit mb-6">
              <Sparkles className="size-3.5" />
              Our Story
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
              Crafted with intention. Worn with confidence.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {about.story}
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {about.mission}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                Read Our Story
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 text-base font-medium text-foreground transition-all hover:bg-muted"
              >
                Shop Collection
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
