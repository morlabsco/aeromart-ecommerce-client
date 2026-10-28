import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeroProps {
  /** Small orange uppercase label above the title. */
  eyebrow: string
  title: ReactNode
  subtitle?: string
  /** Left-aligned (editorial) or centered (command) composition. */
  align?: "left" | "center"
  /** Extra content under the subtitle — chips, CTAs, search forms. */
  children?: ReactNode
}

/**
 * Shared page banner — a deep charcoal-to-primary gradient (so it reads
 * distinctly against the black header nav bar) with a violet glow, a soft
 * brand-orange counter-glow, orange eyebrow, and large white title.
 * Powers the About / Contact / Track Order pages; reuse on any page.
 */
export function PageHero({ eyebrow, title, subtitle, align = "center", children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-header-nav">
      {/* primary glow */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute size-96 rounded-full bg-primary/40 blur-3xl",
          align === "center" ? "-left-24 -top-24" : "-right-24 -top-24"
        )}
      />
      {/* brand counter-glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-20 size-72 rounded-full bg-brand/20 blur-3xl"
      />

      <div
        className={cn(
          "relative mx-auto px-4 py-14 sm:px-6 sm:py-16",
          align === "center"
            ? "max-w-3xl text-center sm:py-18"
            : "max-w-7xl py-16 text-left sm:py-20 lg:py-24"
        )}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand">{eyebrow}</p>
        <h1
          className={cn(
            "mt-4 text-3xl font-bold tracking-tight text-header-nav-foreground sm:text-4xl",
            align === "center" ? "" : "max-w-3xl sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "mt-4 text-sm text-header-nav-foreground/60 sm:text-base",
              align === "center" ? "mx-auto max-w-md" : "max-w-2xl"
            )}
          >
            {subtitle}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}
