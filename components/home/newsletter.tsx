"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Mail, ArrowRight, Check } from "lucide-react"
import { toast } from "sonner"

/**
 * Newsletter strip, restyled for the Nittonova theme — every color flows
 * from the centralized tokens: cream panel on the page background, white
 * icon circle with a brand-orange glyph, bold heading with the signature
 * orange dash, and a pill email input with an orange subscribe button.
 */
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
    <section aria-label="Newsletter" className="bg-background py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/40 bg-hero-surface px-6 py-10 text-center sm:px-10 lg:py-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-sm">
            <Mail className="h-6 w-6 text-brand" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 text-[26px] font-bold tracking-tight text-foreground sm:text-3xl">
            {heading || "Stay in the loop"}
          </h2>
          <span className="mx-auto mt-2 block h-1 w-12 rounded-full bg-brand" aria-hidden="true" />
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground">
            Subscribe for early access to new collections, exclusive offers, and style inspiration.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 flex-1 rounded-full border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring/25"
              required
            />
            <button
              type="submit"
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-brand px-8 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
            >
              {submitted ? (
                <>
                  <Check className="size-4" /> Subscribed
                </>
              ) : (
                <>
                  Subscribe <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground/70">No spam, ever. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  )
}
