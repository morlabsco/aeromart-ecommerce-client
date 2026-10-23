"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { themes, DEFAULT_NICHE } from "@/lib/theme.config";
import type {
  SettingsBrand,
  SettingsContact,
} from "@/lib/types/backend";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email address."),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const FALLBACK_CONTACT: SettingsContact = {
  address: "123 Commerce Street, Dhaka",
  phone: "+880 1234 567890",
  email: "support@example.com",
  hours: "Mon - Sat: 9am - 6pm",
  mapEmbedUrl: "",
  social: { twitter: "", instagram: "", facebook: "" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

export default function Contact({
  contact,
  brand,
}: {
  contact?: SettingsContact | null;
  brand?: SettingsBrand | null;
}) {
  const theme = themes[DEFAULT_NICHE];
  const data = contact ?? FALLBACK_CONTACT;
  const brandName = brand?.name || theme.brand;

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<ContactFormValues>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormValues, string>>
  >({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<
        Record<keyof ContactFormValues, string>
      > = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ContactFormValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setSending(true);
    // Simulate sending to the backend (no contact endpoint yet).
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSent(true);
    toast.success("Message sent! We'll get back to you soon.");
  };

  const contactItems = [
    {
      icon: MapPin,
      label: "Our Address",
      value: data.address,
      href: data.mapEmbedUrl
        ? data.mapEmbedUrl
        : `https://maps.google.com/?q=${encodeURIComponent(data.address)}`,
    },
    { icon: Phone, label: "Call Us", value: data.phone, href: `tel:${data.phone}` },
    { icon: Mail, label: "Email Us", value: data.email, href: `mailto:${data.email}` },
    { icon: Clock, label: "Opening Hours", value: data.hours },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="text-center max-w-2xl mx-auto mb-14 lg:mb-20"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Contact Us
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="mt-5 text-4xl lg:text-5xl font-bold tracking-tight"
          >
            Let&apos;s <span className="text-primary">Talk</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-lg text-muted-foreground"
          >
            Have a question or need help with an order? We&apos;d love to hear
            from {brandName}.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
          {/* Contact info */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="lg:col-span-2 space-y-4"
          >
            {contactItems.map((item) => {
              const Icon = item.icon;
              const Inner = (
                <div className="group flex items-start gap-4 rounded-2xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
              return (
                <motion.div key={item.label} variants={fadeUp}>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {Inner}
                    </a>
                  ) : (
                    Inner
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Form */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="lg:col-span-3"
          >
            <div className="relative rounded-3xl border bg-card p-6 sm:p-10 shadow-xl">
              {/* Gradient border accent */}
              <div className="absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-10 w-10" />
                  </motion.div>
                  <h3 className="mt-6 text-2xl font-bold">Message Sent!</h3>
                  <p className="mt-2 max-w-sm text-muted-foreground">
                    Thanks for reaching out to {brandName}. Our team will get
                    back to you within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-8"
                    onClick={() => {
                      setSent(false);
                      setForm({ name: "", email: "", subject: "", message: "" });
                    }}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Your name"
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="you@example.com"
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <Input
                      id="subject"
                      value={form.subject ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      placeholder="How can we help?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      placeholder="Tell us a bit more about your question..."
                      className={errors.message ? "border-red-500" : ""}
                    />
                    {errors.message && (
                      <p className="text-xs text-red-500">{errors.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      We typically reply within 24 hours.
                    </p>
                    <Button
                      type="submit"
                      disabled={sending}
                      className="w-full sm:w-auto px-8"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
