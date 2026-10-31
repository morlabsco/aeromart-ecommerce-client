import Link from "next/link"
import { BadgeCheck, Mail, Phone, ShieldCheck } from "lucide-react"
import { WhatsAppIcon } from "@/components/shared/brand-icons"
import { PageHero } from "@/components/shared/page-hero"
import { getSettings } from "@/lib/services/settings"
import { buildDefaultReturnRefundHtml } from "@/lib/policy-default-content";
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
 * Policy content (docs/data/return-&-refund-policy.md) — Bangla + English
 * mix, rendered through the default font stack (Jost for Latin, Hind Siliguri
 * for Bangla). The brand name, contact numbers and tagline are injected from
 * the LIVE settings so the copy stays store-accurate.
 *
 * TODO(dashboard): this static builder becomes the fallback when the policy
 * moves into the settings singleton behind the dashboard rich-text editor —
 * keep the shape (intro + numbered sections + contact) stable.
 * ------------------------------------------------------------------------- */

interface PolicyItem {
  /** Bold Bangla/English lead, e.g. "Manufacturing Defect:". */
  lead?: string
  text: string
}


/**
 * Return & Refund Policy — full Bangla + English policy content
 * (docs/data/return-&-refund-policy.md) in the Nittonova editorial style:
 * PageHero banner, an intro commitment card, numbered white section cards
 * with Bengali-numeral chips, and a charcoal contact panel wired to the
 * LIVE brand settings (name, phone, email, tagline). The content builder is
 * data-driven so the upcoming dashboard rich-text editor can replace the
 * source without touching the layout.
 */
export default async function RefundPolicyPage() {
  const settings = unwrapData(await getSettings())
  const theme = themes[DEFAULT_NICHE]
  const brandName = settings?.brand?.name || "AeroMart"
  const tagline = settings?.brand?.tagline || theme.tagline
  const phone = settings?.contact?.phone || "09644553309"
  const email = settings?.contact?.email || "support@example.com"
  const whatsapp = phone.replace(/[^\d+]/g, "").replace(/^\+/, "")

  // Dashboard editor override — when the admin has saved custom policy HTML
  // (Settings → Return & Refund), it replaces the built-in intro + numbered
  // cards inside the SAME shell (hero, contact panel). Empty = the shipped
  // default page, so the built-in design is never lost.
  const override = settings?.policy?.returnRefund?.trim() || ""

  return (
    <div className="bg-hero-surface">
      <PageHero
        eyebrow="Policies"
        title="Return & Refund Policy"
        subtitle={`রিটার্ন, রিপ্লেসমেন্ট ও রিফান্ড পলিসি — ${brandName}-এর প্রতিটি পণ্য শিপমেন্টের আগে যথাসম্ভব পরীক্ষা করে পাঠানো হয়।`}
      />

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {override ? (
          /* ── Admin-authored policy (Settings → Return & Refund) ── */
          <div className="rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8">
            <div
              className="rich-description text-[15px] leading-[1.9]"
              dangerouslySetInnerHTML={{ __html: override }}
            />
          </div>
        ) : (
          /* ── Default policy (full 8-section content, shared with the
           *    dashboard editor's "Load default policy" button) ── */
          <div className="rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8">
            <div
              className="rich-description text-[15px] leading-[1.9]"
              dangerouslySetInnerHTML={{
                __html: buildDefaultReturnRefundHtml(brandName),
              }}
            />
          </div>
        )}

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
