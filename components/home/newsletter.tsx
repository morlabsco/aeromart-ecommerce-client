"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, ArrowRight, Check } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { fadeUp, viewportOnce } from "../shared/reveal"

export function Newsletter({ heading }: { heading?: string }) {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    toast.success("Thanks for subscribing!")
    setEmail("")
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section className="bg-primary/80 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary-foreground/10 mb-6">
            <Mail className="size-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            {heading || "Stay in the loop"}
          </h2>
          <p className="mt-3 text-primary-foreground/80 text-lg">
            Subscribe for early access to new collections, exclusive offers, and style inspiration.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:border-primary-foreground/40 focus-visible:ring-primary-foreground/20"
              required
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 cursor-pointer"
            >
              {submitted ? (
                <>
                  <Check className="size-4 mr-1.5" /> Subscribed
                </>
              ) : (
                <>
                  Subscribe <ArrowRight className="size-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>
          <p className="mt-4 text-xs text-primary-foreground/60">
            No spam, ever. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
