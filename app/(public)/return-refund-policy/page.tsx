import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, Mail, Phone, ShieldCheck } from "lucide-react"
import { WhatsAppIcon } from "@/components/shared/brand-icons"
import { PageHero } from "@/components/shared/page-hero"
import { getSettings } from "@/lib/services/settings"
import { unwrapData } from "@/lib/services/api-client"
import { themes, DEFAULT_NICHE } from "@/lib/theme.config"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description:
    "রিটার্ন, রিপ্লেসমেন্ট ও রিফান্ড পলিসি — how returns, replacements, refunds and warranty claims work.",
}

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

interface PolicySection {
  /** Bengali numeral shown in the chip, e.g. "০১". */
  no: string
  title: string
  paragraphs?: string[]
  intro?: string
  items?: PolicyItem[]
  /** Trailing parenthetical/note line rendered muted. */
  note?: string
  /** Nested checklist under a paragraph. */
  checklist?: string[]
  /** Highlighted callout (বিশেষ দ্রষ্টব্য). */
  callout?: string
}

/** Latin digits → Bengali digits, zero-padded to two places ("০১", "০২"…). */
const bn = (n: number) =>
  n
    .toString()
    .padStart(2, "0")
    .replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)])

function buildSections(brand: string): PolicySection[] {
  return [
    {
      no: bn(1),
      title: "ডেলিভারির সময় পণ্য যাচাই বাধ্যতামূলক",
      paragraphs: [
        `পণ্যে Manufacturing Defect থাকলে, ডেলিভারির সময় ড্যামেজ অবস্থায় পাওয়া গেলে অথবা ভুল পণ্য পাঠানো হলে Delivery Man-এর সামনে পণ্যটি চেক করে Confirm করার পরই Return/Replacement Request করতে পারবেন।`,
        `Delivery Man-এর কাছ থেকে পণ্য গ্রহণ করার পর Broken, Defected বা Wrong Product সংক্রান্ত Return/Replacement Request গ্রহণ করা হবে না।`,
        `উপরোক্ত কারণগুলোর বাইরে অন্য কোনো কারণে পণ্য Return করতে চাইলে, প্রযোজ্য ক্ষেত্রে নির্ধারিত Delivery Charge প্রদান করে Return Request করতে পারবেন।`,
      ],
    },
    {
      no: bn(2),
      title: "3 দিনের রিপ্লেসমেন্ট গ্যারান্টি",
      paragraphs: [
        `পণ্য হাতে পাওয়ার দিন থেকে ${brand}-এর 3 দিনের Replacement Guarantee কার্যকর থাকবে।`,
        `Delivery Man-এর সামনে পণ্য যাচাই করে সঠিক ও কার্যকর অবস্থায় বুঝে নেওয়ার পর, স্বাভাবিক ব্যবহারের মধ্যে যদি পণ্যটি হঠাৎ কাজ করা বন্ধ করে দেয় অথবা কোনো Manufacturing/Technical Defect দেখা দেয়, তাহলে Delivery Date থেকে 3 দিনের মধ্যে ${brand} Support Team-এর কাছে Claim করতে হবে।`,
        `3 দিনের পর করা Replacement Request সাধারণত গ্রহণযোগ্য হবে না, যদি না পণ্যটির জন্য আলাদা Warranty প্রযোজ্য থাকে।`,
      ],
      callout: `বিশেষ দ্রষ্টব্য: ${brand}-এর কিছু পণ্যে আলাদা Warranty থাকতে পারে। Warranty-এর সময়কাল ও শর্ত Product Page, Invoice, Warranty Card অথবা সংশ্লিষ্ট Sales Information-এ উল্লেখ থাকবে।`,
    },
    {
      no: bn(3),
      title: "যেসব ক্ষেত্রে রিপ্লেসমেন্ট প্রযোজ্য",
      intro: "নিচের পরিস্থিতিতে Replacement Request গ্রহণ করা হতে পারে:",
      items: [
        { lead: "Manufacturing Defect:", text: "পণ্যটি Manufacturing বা Technical সমস্যার কারণে সঠিকভাবে কাজ না করলে।" },
        { lead: "ডেলিভারির সময় ড্যামেজ:", text: "পণ্যটি ভাঙা বা Physical Damage অবস্থায় পাওয়া গেলে।" },
        { lead: "ভুল পণ্য:", text: "অর্ডার করা পণ্যের পরিবর্তে অন্য Product, Model, Size, Color বা Variant পাঠানো হলে।" },
        { lead: "পণ্য বা Accessories মিসিং:", text: "প্যাকেজে থাকার কথা এমন Product বা Accessories না থাকলে। এক্ষেত্রে Unboxing Video প্রয়োজন হবে।" },
      ],
      note: "(উপরের ক্ষেত্রে অবশ্যই Delivery Man-এর সামনে পণ্য চেক করে বিষয়টি Confirm করতে হবে।)",
    },
    {
      no: bn(4),
      title: "যেসব ক্ষেত্রে রিটার্ন, রিপ্লেসমেন্ট বা রিফান্ড প্রযোজ্য নয়",
      intro: "নিচের পরিস্থিতিতে Return, Replacement বা Refund গ্রহণযোগ্য নাও হতে পারে:",
      items: [
        { lead: "ব্যবহারকারীর কারণে ক্ষতি:", text: "হাত থেকে পড়ে যাওয়া, আঘাত লাগা, ভুল ব্যবহার, অসতর্কতা অথবা Accident-এর কারণে পণ্য নষ্ট হলে।" },
        { lead: "পানি বা Liquid Damage:", text: "পানি, আর্দ্রতা বা অন্য কোনো তরলের কারণে পণ্য ক্ষতিগ্রস্ত হলে, যদি না সংশ্লিষ্ট পণ্যে এ ধরনের Damage Coverage স্পষ্টভাবে উল্লেখ থাকে।" },
        { lead: "Electrical Damage:", text: "Voltage Fluctuation, Short Circuit, Power Surge, ভুল Power Source অথবা ভুল/অসামঞ্জস্যপূর্ণ Charger, Adapter, Cable বা Power Supply ব্যবহারের কারণে পণ্য নষ্ট হলে।" },
        { lead: "Unauthorized Repair:", text: `${brand}-এর অনুমোদন ছাড়া পণ্য খুলে ফেলা, Repair, Modification বা Tampering করা হলে।` },
        { lead: "পছন্দ পরিবর্তন:", text: "সঠিক ও কার্যকর পণ্য পাওয়ার পর শুধুমাত্র ভালো না লাগা, প্রয়োজন না থাকা বা মত পরিবর্তনের কারণে Return/Refund গ্রহণযোগ্য নয়।" },
        { lead: "ব্যবহারের পর Physical Damage:", text: "পণ্য ব্যবহারের পর Scratch, Crack, Broken Parts অথবা অন্য কোনো Physical Damage হলে।" },
        { lead: "Box বা Accessories হারানো:", text: "Original Box, Accessories, Manual, Warranty Card, Label বা পণ্যের সঙ্গে দেওয়া কোনো অংশ হারিয়ে গেলে বা নষ্ট করলে।" },
        { lead: "ভুলভাবে ব্যবহার:", text: "পণ্যের নির্ধারিত ব্যবহারবিধির বাইরে ব্যবহার করার কারণে সমস্যা হলে।" },
      ],
    },
    {
      no: bn(5),
      title: "বাধ্যতামূলক Unboxing Video",
      intro: "নিচের ধরনের অভিযোগের ক্ষেত্রে Unboxing Video বাধ্যতামূলক:",
      items: [
        { text: "ভাঙা পণ্য" },
        { text: "Physical Damage" },
        { text: "ভুল পণ্য" },
        { text: "পণ্য বা Accessories মিসিং" },
      ],
      paragraphs: [
        "ডেলিভারি প্যাকেটটি প্রথমবার খোলার সময় শুরু থেকে শেষ পর্যন্ত একটি পরিষ্কার ও Continuous Video ধারণ করুন।",
        "ভিডিওতে স্পষ্টভাবে দেখা যেতে হবে:",
      ],
      checklist: [
        "প্যাকেট খোলার আগের অবস্থা",
        "Shipping Label / Order Information",
        "সম্পূর্ণ Unboxing Process",
        "Product ও Accessories",
        "কোনো Damage, Wrong Product বা Missing Item থাকলে সেটি",
      ],
      note: "যথাযথ Unboxing Video ছাড়া Physical Damage, Missing Item বা Wrong Product সংক্রান্ত অভিযোগ গ্রহণযোগ্য নাও হতে পারে।",
    },
    {
      no: bn(6),
      title: "কিভাবে Replacement Request করবেন?",
      intro: "আপনার সমস্যাটি আমাদের Policy-এর আওতাভুক্ত হলে:",
      items: [
        { lead: `${brand} Support-এ যোগাযোগ করুন:`, text: "পণ্য পাওয়ার 3 দিনের মধ্যে আমাদের জানান।" },
        { lead: "Order Information দিন:", text: "Order ID, অর্ডারে ব্যবহৃত Phone Number এবং সমস্যার বিস্তারিত জানান।" },
        { lead: "প্রমাণ পাঠান:", text: "সমস্যার পরিষ্কার ছবি/ভিডিও এবং প্রয়োজন হলে Unboxing Video পাঠান।" },
        { lead: "Verification:", text: "আমাদের Support Team আপনার অভিযোগ ও প্রমাণ যাচাই করবে।" },
        { lead: "পণ্য ফেরত পাঠানো:", text: "Request Approved হলে পণ্য ফেরত পাঠানোর নিয়ম ও প্রয়োজনীয় তথ্য জানানো হবে।" },
        { lead: "Inspection:", text: "পণ্যটি আমাদের কাছে পৌঁছানোর পর প্রয়োজন অনুযায়ী যাচাই করে Replacement বা Warranty Service প্রদান করা হবে।" },
      ],
    },
    {
      no: bn(7),
      title: "রিফান্ড পলিসি",
      paragraphs: [
        `যোগ্য Product Issue-এর ক্ষেত্রে ${brand} সাধারণত Replacement অথবা Warranty Service প্রদানকে অগ্রাধিকার দেয়।`,
        "সঠিক এবং কার্যকর পণ্য পাওয়ার পর শুধুমাত্র মত পরিবর্তনের কারণে Refund প্রযোজ্য হবে না।",
        "বিশেষ কোনো পরিস্থিতিতে Refund অনুমোদিত হলে Refund-এর মাধ্যম এবং Processing Time আমাদের Support Team থেকে জানিয়ে দেওয়া হবে।",
      ],
    },
    {
      no: bn(8),
      title: "Warranty Service",
      paragraphs: [
        "যেসব পণ্যে আলাদা Warranty রয়েছে, সেই পণ্যের নির্ধারিত Warranty Period এবং Conditions অনুযায়ী Warranty Service প্রদান করা হবে।",
        "সাধারণত Warranty শুধুমাত্র যোগ্য Manufacturing বা Technical Defect-এর ক্ষেত্রে প্রযোজ্য। Physical Damage, Accidental Damage, Water Damage, Electrical Damage অথবা ভুল ব্যবহারের কারণে হওয়া ক্ষতি Warranty-এর আওতাভুক্ত হবে না—যদি সংশ্লিষ্ট পণ্যের Warranty Terms-এ আলাদাভাবে উল্লেখ না থাকে।",
      ],
    },
  ]
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
  const sections = buildSections(brandName)

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
          {sections.map((section) => (
            <section
              key={section.no}
              className="rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-header-nav text-sm font-extrabold tabular-nums text-header-nav-foreground">
                  {section.no}
                </span>
                <h2 className="text-[17px] font-bold leading-snug text-foreground sm:text-lg">
                  {section.title}
                </h2>
              </div>
              <span
                aria-hidden="true"
                className="mt-4 block h-1 w-12 rounded-full bg-brand"
              />

              {section.intro && (
                <p className="mt-5 text-[15px] leading-[1.9] text-foreground/90">
                  {section.intro}
                </p>
              )}

              {section.items && section.items.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {section.items.map((item, i) => (
                    <li
                      key={`${section.no}-${i}`}
                      className="flex gap-3 text-[15px] leading-[1.9] text-muted-foreground"
                    >
                      <BadgeCheck
                        className="mt-1.5 size-4 shrink-0 text-brand"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span>
                        {item.lead && (
                          <span className="font-bold text-foreground">
                            {item.lead}{" "}
                          </span>
                        )}
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {section.paragraphs && section.paragraphs.length > 0 && (
                <div
                  className={
                    section.intro || section.items?.length ? "mt-4" : "mt-5"
                  }
                >
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 24)}
                      className="mt-3 text-[15px] leading-[1.9] text-muted-foreground first:mt-0"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              {section.checklist && section.checklist.length > 0 && (
                <ul className="mt-3 space-y-2 rounded-2xl bg-muted/50 p-4 sm:p-5">
                  {section.checklist.map((entry) => (
                    <li
                      key={entry}
                      className="flex items-center gap-2.5 text-sm leading-relaxed text-foreground/90"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full bg-brand"
                      />
                      {entry}
                    </li>
                  ))}
                </ul>
              )}

              {section.callout && (
                <p className="mt-5 rounded-2xl border-l-4 border-brand bg-brand/5 p-4 text-sm leading-[1.85] text-foreground">
                  {section.callout}
                </p>
              )}

              {section.note && (
                <p className="mt-4 text-sm italic leading-relaxed text-muted-foreground">
                  {section.note}
                </p>
              )}
            </section>
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
