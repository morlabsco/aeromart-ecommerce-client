import Image from "next/image"
import Link from "next/link"
import { ArrowRight, HeartHandshake, Package, RefreshCcw, ShieldCheck, Target, Truck } from "lucide-react"
import { themes, DEFAULT_NICHE } from "@/lib/theme.config"
import type { SettingsAbout, SettingsBrand } from "@/lib/types/backend"

const theme = themes[DEFAULT_NICHE]

const VALUES = [
  { icon: ShieldCheck, title: "Original Products", text: "Every item is sourced genuinely — 100% original & premium." },
  { icon: Truck, title: "Fast Delivery", text: "Quick delivery at your doorstep, every single time." },
  { icon: RefreshCcw, title: "Easy Return", text: "A hassle-free return policy, no questions asked." },
  { icon: HeartHandshake, title: "Honest Service", text: "Real people, real help — before and after you buy." },
]

/**
 * About page, designed in the Nittonova tone: cream surface, white rounded
 * cards, charcoal icon squares, orange accents and the signature dash —
 * an editorial "story" layout rather than a generic marketing grid.
 */
export default function About({ about, brand }: { about: SettingsAbout | null; brand: SettingsBrand | null }) {
  const brandName = brand?.name || theme.brand
  const story = about?.story || "We started with one simple belief — everyday products should feel a little less ordinary."
  const mission = about?.mission || "Our mission is to deliver thoughtfully curated, high-quality products that make everyday life a little more beautiful."
  const image = about?.image || theme.about.image
  const stats = about?.stats?.length ? about.stats : [{ label: "Happy Customers", value: "10k+" }, { label: "Products Curated", value: "1,200+" }, { label: "Cities Served", value: "64" }]

  return (
    <div className="bg-hero-surface">
      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Our Story</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              The people behind {brandName}
            </h1>
            <span className="mt-4 block h-1 w-14 rounded-full bg-brand" aria-hidden="true" />
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {story}
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {mission}
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-7 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
            >
              Shop the collection <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl shadow-sm">
              <Image
                src={image}
                alt={brandName}
                width={880}
                height={660}
                className="h-auto w-full object-cover"
              />
            </div>
            {/* Floating stat chip */}
            <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-header-nav px-5 py-4 shadow-lg">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                <Package className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-lg font-extrabold leading-none text-white">{stats[0]?.value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                  {stats[0]?.label}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-header-nav p-5 text-center sm:p-6">
              <p className="text-2xl font-extrabold text-brand sm:text-3xl">{stat.value}</p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission + values */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8 lg:pb-24">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col justify-center rounded-2xl bg-card p-7 shadow-sm sm:p-9 lg:col-span-2">
            <span className="flex size-12 items-center justify-center rounded-xl bg-header-nav text-white">
              <Target className="size-5" strokeWidth={1.75} />
            </span>
            <h2 className="mt-5 text-xl font-bold text-foreground sm:text-2xl">What drives us</h2>
            <span className="mt-3 block h-1 w-10 rounded-full bg-brand" aria-hidden="true" />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {mission}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
            {VALUES.map((value) => {
              const Icon = value.icon
              return (
                <div
                  key={value.title}
                  className="group rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-header-nav text-white transition-colors duration-300 group-hover:bg-brand">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
