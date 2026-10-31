import Link from "next/link"
import { BadgeCheck, Check, Mail, Phone, ShieldCheck } from "lucide-react"
import { WhatsAppIcon } from "@/components/shared/brand-icons"
import { PageHero } from "@/components/shared/page-hero"
import { getSettings } from "@/lib/services/settings"
import {
  bengaliNumeral,
  defaultReturnRefundSections,
  type PolicySectionData,
} from "@/lib/policy-sections"
import { unwrapData } from "@/lib/services/api-client"
import { themes, DEFAULT_NICHE } from "@/lib/theme.config"
import { storefrontMetadata } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export const generateMetadata = () =>
  storefrontMetadata({
    title: "Return & Refund Policy",
    description:
      "রিটার্ন, রিপ্লেসমেন্ট ও রিফান্ড পলিসি — how returns, replacements, refunds and warranty claims work.",
  });

/* ---------------------------------------------------------------------------
 * Return & Refund Policy — the Nittonova editorial design RESTORED (31/10):
 * PageHero banner, the ShieldCheck intro commitment card, NUMBERED white
 * section cards with Bengali-numeral chips (BadgeCheck bullets with bold
 * leads, checklist panel, brand callout) and the charcoal contact panel
 * wired to the LIVE brand settings.
 *
 * Content source: the STRUCTURED sections saved from the dashboard
 * (Settings → Return & Refund edits a section list, not one HTML blob) —
 * an EMPTY list falls back to the shipped 8-section defaults, so the
 * design and content are never lost, only overridden section by section.
 * ------------------------------------------------------------------------- */

function PolicySectionCard({
  index,
  section,
}: {
  index: number
  section: PolicySectionData
}) {
  return (
    <section className="rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-header-nav text-sm font-extrabold tabular-nums text-header-nav-foreground">
          {bengaliNumeral(index + 1)}
        </span>
        <h2 className="text-[17px] font-bold leading-snug text-foreground sm:text-lg">
          {section.title}
        </h2>
      </div>

      {section.intro && (
        <p className="mt-4 text-[15px] leading-[1.9] text-foreground">
          {section.intro}
        </p>
      )}

      {(section.paragraphs ?? []).length > 0 && (
        <div className="mt-4 space-y-3">
          {(section.paragraphs ?? []).map((paragraph, i) => (
            <p
              key={i}
              className="text-[15px] leading-[1.9] text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {(section.items ?? []).length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {(section.items ?? []).map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-[15px] leading-[1.85] text-muted-foreground"
            >
              <BadgeCheck className="mt-1 size-4.5 shrink-0 text-brand" />
              <span>
                {item.lead && (
                  <strong className="font-bold text-foreground">
                    {item.lead}{" "}
                  </strong>
                )}
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {(section.checklist ?? []).length > 0 && (
        <div className="mt-5 rounded-xl bg-muted/60 p-4">
          <ul className="space-y-2">
            {(section.checklist ?? []).map((entry, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={3} />
                {entry}
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.callout && (
        <div className="mt-5 rounded-xl border-l-4 border-brand bg-brand/5 p-4">
          <p className="text-sm leading-relaxed text-foreground">
            {section.callout}
          </p>
        </div>
      )}

      {section.note && (
        <p className="mt-4 text-sm italic leading-relaxed text-muted-foreground">
          {section.note}
        </p>
      )}
    </section>
  )
}

export default async function RefundPolicyPage() {
  const settings = unwrapData(await getSettings())
  const theme = themes[DEFAULT_NICHE]
  const brandName = settings?.brand?.name || "AeroMart"
  const tagline = settings?.brand?.tagline || theme.tagline
  const phone = settings?.contact?.phone || "09644553309"
  const email = settings?.contact?.email || "support@example.com"
  const whatsapp = phone.replace(/[^\d+]/g, "").replace(/^\+/, "")

  // Dashboard-managed sections — empty list = the shipped defaults.
  const saved = settings?.policy?.sections ?? []
  const sections: PolicySectionData[] =
    saved.length > 0 ? saved : defaultReturnRefundSections(brandName)

  return (
    <div className="bg-hero-surface">
      <PageHero
        eyebrow="Policies"
        title="Return & Refund Policy"
        subtitle={`রিটার্ন, রিপ্লেসমেন্ট ও রিফান্ড পলিসি — ${brandName}-এর প্রতিটি পণ্য শিপমেন্টের আগে যথাসম্ভব পরীক্ষা করে পাঠানো হয়।`}
      />

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* ── Intro commitment card ─────────────────────────────── */}
        <div className="rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
              <ShieldCheck className="size-6" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                রিটার্ন, রিপ্লেসমেন্ট ও রিফান্ড পলিসি
              </h2>
              <p className="mt-2 text-[15px] leading-[1.9] text-muted-foreground">
                {brandName}-তে আমরা গ্রাহকের সন্তুষ্টি এবং পণ্যের মানকে সর্বোচ্চ
                গুরুত্ব দিয়ে থাকি। প্রতিটি পণ্য শিপমেন্টের আগে যথাসম্ভব পরীক্ষা
                করে পাঠানো হয়। তারপরও আপনার কেনা পণ্যে কোনো সমস্যা দেখা দিলে
                নিচের Return, Replacement &amp; Refund Policy অনুসরণ করুন।
              </p>
            </div>
          </div>
        </div>

        {/* ── Numbered policy sections ──────────────────────────── */}
        <div className="mt-5 space-y-5">
          {sections.map((section, i) => (
            <PolicySectionCard key={`${i}-${section.title}`} index={i} section={section} />
          ))}
        </div>

        {/* ── Contact panel — wired to the live brand details ──── */}
        <div className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-header-nav px-6 py-10 sm:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand/20 blur-3xl"
          />
          <div className="relative flex flex-col items-start gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-header-nav-foreground/60">
                যোগাযোগ
              </p>
              <p className="mt-2 max-w-md text-[15px] font-semibold leading-relaxed text-header-nav-foreground">
                Return, Replacement, Refund অথবা Warranty সংক্রান্ত যেকোনো
                প্রয়োজনে {brandName} Support Team-এর সঙ্গে যোগাযোগ করুন।
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-header-nav-foreground/40">
                {tagline}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto">
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="inline-flex h-11 items-center gap-2.5 rounded-full bg-brand px-6 text-sm font-bold text-brand-foreground transition-transform duration-300 hover:scale-[1.03]"
              >
                <Phone className="size-4" />
                {phone}
              </a>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2.5 rounded-full bg-[#25D366] px-6 text-sm font-bold text-white transition-transform duration-300 hover:scale-[1.03] hover:bg-[#1fb857]"
              >
                <WhatsAppIcon className="size-4" />
                WhatsApp
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex h-11 items-center gap-2.5 rounded-full bg-card px-6 text-sm font-bold text-foreground transition-transform duration-300 hover:scale-[1.03]"
              >
                <Mail className="size-4 text-brand" />
                {email}
              </a>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Questions about a return?{" "}
          <Link
            href="/contact"
            className="font-semibold text-brand underline-offset-4 transition-colors hover:underline"
          >
            Contact support
          </Link>
        </p>
      </section>
    </div>
  )
}
