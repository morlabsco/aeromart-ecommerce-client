"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/shared/page-hero";
import type { SettingsBrand, SettingsContact } from "@/lib/types/backend";

const FALLBACK_CONTACT: SettingsContact = {
  address: "123 Commerce Street, Dhaka",
  phone: "+880 1234 567890",
  email: "support@example.com",
  hours: "Mon - Sat: 9am - 6pm",
  mapEmbedUrl: "",
  social: { twitter: "", instagram: "", facebook: "" },
};

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email address."),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const fieldClass = (hasError?: boolean) =>
  cn(
    "h-11 w-full rounded-lg border bg-background px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60",
    hasError
      ? "border-destructive focus:ring-2 focus:ring-destructive/30"
      : "border-input focus:border-brand/50 focus:ring-2 focus:ring-ring/25"
  );

/**
 * Contact page in the Nittonova tone: cream surface, a "Get in Touch" card
 * with icon-tile rows and a white form card. Submitting composes an email
 * to the store's support address (no backend endpoint exists for messages).
 */
export default function Contact({ contact, brand }: { contact: SettingsContact | null; brand: SettingsBrand | null }) {
  const data = contact ?? FALLBACK_CONTACT;
  const brandName = brand?.name ?? "us";

  const [sending, setSending] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const mapsUrl = data.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`
    : "";

  const rows = [
    data.address && { icon: MapPin, label: "Location", value: data.address, href: mapsUrl, external: true },
    data.phone && { icon: Phone, label: "Phone", value: data.phone, href: `tel:${data.phone.replace(/\s/g, "")}` },
    data.email && { icon: Mail, label: "Email", value: data.email, href: `mailto:${data.email}` },
    data.hours && { icon: Clock, label: "Hours", value: data.hours },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string; href?: string; external?: boolean }[];

  const socials = Object.entries(data.social ?? {})
    .filter(([, url]) => url)
    .map(([platform, url]) => ({ platform, url }));

  const onSubmit = handleSubmit((values) => {
    if (!data.email) return;
    setSending(true);
    const subject = encodeURIComponent(values.subject || `Message from ${values.name}`);
    const body = encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`);
    window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`;
    toast.success("Opening your email app…");
    setSending(false);
    reset();
  });

  return (
    <div className="bg-hero-surface">
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        subtitle={`Questions about an order, a product, or anything else? The ${brandName} team is one message away.`}
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Get in touch */}
          <div className="rounded-2xl bg-card p-6 shadow-sm sm:p-8 lg:col-span-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Get in Touch</h2>
            <ul className="mt-6 space-y-5">
              {rows.map((row) => {
                const Icon = row.icon;
                const content = (
                  <>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card">
                      <Icon className="size-5 text-foreground transition-colors duration-300 group-hover:text-brand" strokeWidth={1.5} />
                    </span>
                    <span>
                      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="block max-w-[200px] text-[15px] font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-brand">
                        {row.value}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={row.label}>
                    {row.href ? (
                      <a
                        href={row.href}
                        target={row.external ? "_blank" : undefined}
                        rel={row.external ? "noopener noreferrer" : undefined}
                        className="group flex cursor-pointer items-center gap-3"
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="group flex items-center gap-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            {socials.length > 0 && (
              <div className="mt-8 border-t border-border/60 pt-6">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Follow us</p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {socials.map((social) => (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 items-center rounded-full border border-border px-4 text-xs font-semibold capitalize text-muted-foreground transition-colors hover:border-brand hover:bg-brand hover:text-brand-foreground"
                    >
                      {social.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {data.mapEmbedUrl ? (
              <a
                href={data.mapEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex h-11 items-center justify-center gap-2 rounded-lg bg-header-nav text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                <MapPin className="size-4" /> Find us on the map
              </a>
            ) : null}
          </div>

          {/* Form */}
          <div className="rounded-2xl bg-card p-6 shadow-sm sm:p-8 lg:col-span-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Send a Message</h2>
            <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="ml-0.5 block text-xs font-semibold text-foreground">
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    {...register("name")}
                    placeholder="John Doe"
                    autoComplete="name"
                    className={fieldClass(!!errors.name)}
                  />
                  {errors.name && <p className="text-[11px] font-medium text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="ml-0.5 block text-xs font-semibold text-foreground">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    {...register("email")}
                    placeholder="name@example.com"
                    inputMode="email"
                    autoComplete="email"
                    className={fieldClass(!!errors.email)}
                  />
                  {errors.email && <p className="text-[11px] font-medium text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-subject" className="ml-0.5 block text-xs font-semibold text-foreground">
                  Subject <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="contact-subject"
                  {...register("subject")}
                  placeholder="How can we help?"
                  className={fieldClass()}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="ml-0.5 block text-xs font-semibold text-foreground">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  {...register("message")}
                  placeholder="Tell us a little more…"
                  rows={5}
                  className={cn(fieldClass(!!errors.message), "h-auto resize-none py-3")}
                />
                {errors.message && (
                  <p className="text-[11px] font-medium text-destructive">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60 sm:w-auto sm:px-10"
              >
                <Send className="size-4" />
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Map embed — or a designed directions panel when not configured */}
        {data.mapEmbedUrl ? (
          <div className="mt-6 overflow-hidden rounded-2xl shadow-sm">
            <iframe
              src={data.mapEmbedUrl}
              title="Store location map"
              className="h-72 w-full border-0 sm:h-96"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-header-nav px-6 py-10 sm:px-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand/20 blur-3xl" />
            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-brand p-3.5 text-brand-foreground">
                  <MapPin className="size-6" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">
                    Visit our store
                  </p>
                  <p className="mt-1 max-w-sm text-[15px] font-semibold leading-snug text-white">
                    {data.address}
                  </p>
                </div>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand px-7 text-sm font-bold text-brand-foreground transition-transform duration-300 hover:scale-[1.03]"
                >
                  <MapPin className="size-4" /> Open in Google Maps
                </a>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
