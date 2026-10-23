import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description:
    "Our refund and return policy — how returns work, eligibility, timelines, and how to request a refund.",
};

/** Static placeholder styled with the Nittonova theme — the full design
 *  reference will replace this layout later. */
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Return Eligibility",
    body: [
      "Products can be returned within 7 days of delivery if they are unused, in their original packaging, and accompanied by the invoice or order ID.",
      "Items marked as non-returnable at the time of purchase (e.g. hygiene-sealed goods) cannot be returned unless they arrive damaged or defective.",
    ],
  },
  {
    title: "How to Request a Refund",
    body: [
      "Contact our support team with your order ID, a short description of the issue, and photos of the product where applicable.",
      "Once the request is approved, we arrange a pickup or ask you to ship the item back. Refunds are issued after the returned item passes inspection.",
    ],
  },
  {
    title: "Refund Timelines",
    body: [
      "Approved refunds are processed within 3–7 business days. The time for the amount to reflect in your account depends on your bank or payment provider.",
      "Online payments are refunded to the original payment method; cash on delivery orders are refunded via mobile banking or bank transfer.",
    ],
  },
  {
    title: "Damaged or Wrong Items",
    body: [
      "If you receive a damaged, defective, or incorrect item, notify us within 48 hours of delivery with photos — we cover the full return cost and replacement shipping.",
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <section className="bg-hero-surface px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-card p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Return &amp; Refund Policy
          </h1>
          <span className="mt-2 block h-1 w-12 rounded-full bg-brand" aria-hidden="true" />
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            We want you to love what you ordered. If something isn&apos;t right, here is
            exactly how returns and refunds work.
          </p>

          <div className="mt-8 space-y-8">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="text-sm leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 border-t border-border/60 pt-6 text-sm text-muted-foreground">
            Questions about a return?{" "}
            <a href="/contact" className="font-semibold text-brand hover:underline underline-offset-4">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
