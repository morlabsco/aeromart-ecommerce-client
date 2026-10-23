import { CreditCard, RotateCcw, ShieldCheck, Truck } from "lucide-react"

/**
 * Nittonova features strip (from the cropped footer-features reference):
 * a soft cream panel with four items — orange icon in a white circle,
 * uppercase bold title, muted subtitle. Responsive: one per row on phones,
 * two on small screens, four with vertical dividers on desktop.
 */
const FEATURES = [
  { icon: Truck, title: "Fast Delivery", description: "Quick delivery at your doorstep" },
  { icon: ShieldCheck, title: "Original Products", description: "100% original & premium" },
  { icon: RotateCcw, title: "Easy Return", description: "Hassle free return policy" },
  { icon: CreditCard, title: "Secure Payment", description: "Safe & secure transactions" },
]

export function FeaturesBar() {
  return (
    <section aria-label="Store features" className="bg-background py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 rounded-2xl border border-border/40 bg-hero-surface sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border/50">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="flex items-center justify-center gap-4 border-b border-border/50 px-6 py-6 last:border-b-0 sm:border-b-0 lg:py-8"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card shadow-sm">
                  <Icon className="h-6 w-6 text-brand" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-wide text-foreground">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
