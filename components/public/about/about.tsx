"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Shield,
  HeartHandshake,
  ArrowRight,
  Store,
} from "lucide-react";
import { themes, DEFAULT_NICHE } from "@/lib/theme.config";
import { ThemedImage } from "@/components/shared/themed-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SettingsAbout, SettingsBrand } from "@/lib/types/backend";

const FALLBACK_ABOUT: SettingsAbout = {
  story:
    "We started with a simple belief: premium products should be accessible to everyone. What began as a small passion project has grown into a brand loved by thousands.",
  mission:
    "Our mission is to deliver thoughtfully crafted, high-quality products that make everyday life a little more beautiful , backed by honest service and lasting value.",
  image: "",
  stats: [
    { label: "Happy Customers", value: "10K+" },
    { label: "Products", value: "250+" },
    { label: "Years", value: "5+" },
  ],
};

const values = [
  {
    icon: Sparkles,
    title: "Quality First",
    description:
      "Every product is crafted from premium materials and rigorously tested for durability and comfort.",
  },
  {
    icon: Shield,
    title: "Sustainable Practices",
    description:
      "We're committed to ethical sourcing and sustainable manufacturing every step of the way.",
  },
  {
    icon: HeartHandshake,
    title: "Customer Obsessed",
    description:
      "Your satisfaction drives everything we do. We design with you in mind.",
  },
];

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

export default function About({
  about,
  brand,
}: {
  about?: SettingsAbout | null;
  brand?: SettingsBrand | null;
}) {
  const theme = themes[DEFAULT_NICHE];
  const data = about ?? FALLBACK_ABOUT;
  const brandName = brand?.name || theme.brand;
  const image = data.image || theme.about.image;

  return (
    <div className="relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="text-center max-w-2xl mx-auto mb-16 lg:mb-24"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary"
          >
            <Store className="h-3.5 w-3.5" />
            About Us
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="mt-5 text-4xl lg:text-5xl font-bold tracking-tight"
          >
            Our <span className="text-primary">Story</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-lg text-muted-foreground"
          >
            The people, purpose and passion behind {brandName}.
          </motion.p>
        </motion.div>

        {/* Story + image */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20 lg:mb-28"
        >
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 text-primary mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Who we are
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              Crafted with care, <br className="hidden sm:block" />
              built on <span className="text-primary">trust</span>.
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>{data.story}</p>
              <p>{data.mission}</p>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              {data.stats.length > 0 &&
                data.stats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={fadeUp}
                    className="rounded-2xl border bg-card p-4 text-center"
                  >
                    <p className="text-2xl lg:text-3xl font-bold text-primary">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="relative"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border shadow-xl">
              <ThemedImage
                src={image}
                alt={`About ${brandName}`}
                fallbackText={brandName}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {/* Floating accent card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute -bottom-6 -left-4 sm:-left-8 rounded-2xl border bg-card px-6 py-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                {brand?.logo || theme.logo ? (
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-primary/10 p-1.5">
                    <Image
                      src={brand?.logo || theme.logo}
                      alt={brandName}
                      width={44}
                      height={44}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Store className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold">{brandName}</p>
                  <p className="text-xs text-muted-foreground">
                    Premium since day one
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Values */}
        <div className="mb-20 lg:mb-24">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Our <span className="text-primary">Values</span>
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              What drives us every day
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  variants={fadeUp}
                  className="group rounded-2xl border bg-card p-8 text-center transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
                >
                  <div className="mx-auto inline-flex p-3.5 rounded-2xl bg-primary/10 text-primary mb-5 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {v.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="relative overflow-hidden rounded-3xl border bg-card p-10 lg:p-14 text-center shadow-xl"
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <h2 className="relative text-3xl lg:text-4xl font-bold tracking-tight">
            Ready to explore {brandName}?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">
            Browse our curated collection and discover products made to last.
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/products" />}>
              Shop Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" })
              )}
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
