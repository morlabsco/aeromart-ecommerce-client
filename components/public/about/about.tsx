import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Quote } from "lucide-react"
import { themes, DEFAULT_NICHE } from "@/lib/theme.config"
import { PageHero } from "@/components/shared/page-hero"
import type { SettingsAbout, SettingsBrand } from "@/lib/types/backend"

const theme = themes[DEFAULT_NICHE]

const VALUES = [
  { title: "Original, always", text: "Every product on our shelf is sourced genuinely — no clones, no compromises." },
  { title: "Delivery you can set your watch to", text: "Orders leave our floor fast and arrive when we say they will." },
  { title: "Returns without the runaround", text: "Changed your mind? Our return policy is short, fair and human." },
  { title: "Service from real people", text: "Message us and a person — not a bot — answers with an actual answer." },
]

/**
 * About page — an editorial take on the Nittonova identity: a charcoal
 * masthead with stat chips, drop-cap story beside an orange-framed photo,
 * a full-bleed orange mission band, numbered values, and a stat ledger.
 * No generic card grids — every section is its own composition.
 */
export default function About({ about, brand }: { about: SettingsAbout | null; brand: SettingsBrand | null }) {
  const brandName = brand?.name || theme.brand
  const tagline = brand?.tagline || "Quality you can feel, service you can trust"
  const story = about?.story || "We started with one simple belief — everyday products should feel a little less ordinary, and buying them should feel a lot more honest."
  const mission = about?.mission || "Our mission is to deliver thoughtfully curated, high-quality products that make everyday life a little more beautiful."
  const image = about?.image || theme.about.image
  const stats = about?.stats?.length
    ? about.stats
    : [
        { label: "Happy Customers", value: "10k+" },
        { label: "Products Curated", value: "1,200+" },
        { label: "Cities Served", value: "64" },
      ]

  return (
    <div className="bg-hero-surface">
      {/* ── Gradient masthead ──────────────────────────────────────── */}
      <PageHero
        align="left"
        eyebrow={`About ${brandName}`}
        title={tagline}
        subtitle={`${story.split(".")[0]}.`}
      >
        {/* stat chips */}
        <div className="flex flex-wrap gap-2.5">
          {stats.map((stat) => (
            <span
              key={stat.label}
              className="inline-flex items-baseline gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10"
            >
              <span className="text-base font-extrabold text-brand">{stat.value}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
                {stat.label}
              </span>
            </span>
          ))}
        </div>

        <Link
          href="/products"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-8 text-sm font-bold text-brand-foreground transition-transform duration-300 hover:scale-[1.03]"
        >
          Shop the collection <ArrowRight className="size-4" />
        </Link>
      </PageHero>

      {/* ── Story: drop-cap prose + orange-framed photo ───────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              01 — How it started
            </p>
            <span className="mt-3 block h-1 w-12 rounded-full bg-brand" aria-hidden="true" />
            <p className="mt-7 text-[17px] leading-[1.85] text-foreground/90 first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:font-extrabold first-letter:leading-[0.85] first-letter:text-brand sm:text-lg">
              {story}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div aria-hidden="true" className="absolute -right-3 -top-3 h-full w-full rounded-[2rem] bg-brand sm:-right-5 sm:-top-5" />
            <div className="relative overflow-hidden rounded-[2rem] shadow-lg">
              <Image src={image} alt={brandName} width={880} height={660} className="h-auto w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Full-bleed orange mission band ────────────────────────── */}
      <section className="bg-brand">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-10">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-header-nav text-brand">
              <Quote className="size-6" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-header-nav/70">
                02 — Our mission
              </p>
              <p className="mt-3 max-w-4xl text-xl font-bold leading-snug text-header-nav sm:text-2xl lg:text-[1.75rem]">
                {mission}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Numbered values — editorial rows, not cards ───────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          03 — What we stand for
        </p>
        <span className="mt-3 block h-1 w-12 rounded-full bg-brand" aria-hidden="true" />

        <div className="mt-8">
          {VALUES.map((value, index) => (
            <div
              key={value.title}
              className="group grid grid-cols-[auto_1fr] items-start gap-5 border-t border-header-nav/15 py-7 transition-all duration-300 last:border-b hover:translate-x-1.5 sm:grid-cols-[auto_1fr_1.2fr] sm:gap-8 sm:py-8"
            >
              <span className="text-3xl font-extrabold tabular-nums text-brand/40 transition-colors duration-300 group-hover:text-brand sm:text-5xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="pt-1 text-base font-bold uppercase tracking-wide text-foreground sm:text-lg">
                {value.title}
              </h3>
              <p className="col-span-2 text-sm leading-relaxed text-muted-foreground sm:col-span-1 sm:pt-1.5 sm:text-[15px]">
                {value.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing charcoal CTA ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-header-nav px-6 py-14 text-center sm:px-10 sm:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -bottom-24 size-80 rounded-full bg-brand/20 blur-3xl" />
          <h2 className="relative text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to see what the fuss is about?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-white/60">
            Thousands of products, honest prices, and a team that actually answers.
          </p>
          <Link
            href="/products"
            className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-9 text-sm font-bold text-brand-foreground transition-transform duration-300 hover:scale-[1.03]"
          >
            Start shopping <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
