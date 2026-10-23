"use client"

import { Lock, ShieldCheck, RefreshCw, Headphones } from "lucide-react"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer, viewportOnce } from "../shared/reveal"

const features = [
  {
    icon: Lock,
    title: "Secure Payments",
    description: "Your transactions are always protected",
  },
  {
    icon: ShieldCheck,
    title: "Premium Quality",
    description: "Crafted to last a lifetime",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "30-day hassle-free returns",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "We're here to help anytime",
  },
]

export function FeaturesBar() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="flex items-center gap-3"
              >
                <div className="inline-flex items-center justify-center size-10 rounded-full bg-muted text-primary shrink-0">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
