"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { fadeUp, viewportOnce } from "../shared/reveal"
import type { SettingsLimitedOffer } from "@/lib/types/backend"

export function OfferSection({ offer }: { offer: SettingsLimitedOffer }) {
  if (!offer.enabled) return null

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="relative overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className="grid lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[520px]"
          >
            {offer.image ? (
              <Image
                src={offer.image}
                alt={offer.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/80" />
            )}
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col justify-center p-8 sm:p-12 lg:p-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase w-fit mb-6">
              <Clock className="size-3.5" />
              {offer.badge || "Limited Offer"}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
              {offer.title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-md">
              {offer.subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={offer.ctaLink || "/products"}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                {offer.ctaText}
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 text-base font-medium text-foreground transition-all hover:bg-muted"
              >
                Browse Collection
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
