import Link from "next/link"
import Image from "next/image"
import {
    AtSign,
    Briefcase,
    Camera,
    Globe,
    Send,
    ThumbsUp,
    Users,
    Video,
} from "lucide-react"
import { themes, DEFAULT_NICHE } from "../../lib/theme.config"
import type { SettingsBrand, SettingsFooter } from "@/lib/types/backend"

const FALLBACK_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/dashboard", label: "Dashboard" },
]

const PAYMENT_LOGOS = [
  { src: "/images/bkash-pay-logo.png", alt: "bKash", className: "h-6" },
  { src: "/images/sslcommerz-pay-types-logo.png", alt: "SSLCommerz", className: "h-6" },
  { src: "/images/stripe-pay-logo.png", alt: "Stripe", className: "h-6" },
]

/** Maps a social platform name to the closest available lucide icon. */
const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: ThumbsUp,
  instagram: Camera,
  twitter: AtSign,
  youtube: Video,
  linkedin: Briefcase,
  tiktok: Video,
  pinterest: ThumbsUp,
  whatsapp: Users,
  telegram: Send,
  discord: Users,
}

/** Capitalized platform name, e.g. "twitter" -> "Twitter". */
function platformLabel(platform: string): string {
  return platform.charAt(0).toUpperCase() + platform.slice(1)
}

/** Resolves the icon for a platform, falling back to a globe for unknowns. */
function platformIcon(platform: string) {
  return SOCIAL_ICONS[platform.toLowerCase()] ?? Globe
}

interface FooterProps {
  /** Brand from the settings singleton (server-fetched). */
  brand?: SettingsBrand | null
  /** Footer section from the settings singleton (server-fetched). */
  footer?: SettingsFooter | null
}

export function Footer({ brand, footer }: FooterProps) {
  const theme = themes[DEFAULT_NICHE]

  const brandName = brand?.name || theme.brand
  const brandLogo = brand?.logo || theme.logo
  const formattedBrand =
    brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase()
  const hasLogo = brandLogo.length > 0

  const description = footer?.description || theme.footer.description
  const copyrightText = footer?.copyrightText || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`

  const socialLinks = footer?.socialLinks?.filter(
    (s) => s.platform && s.url
  ) ?? []

  // Footer columns from settings (each column has a title + links).
  const columns = footer?.columns?.length
    ? footer.columns.filter((c) => c.title && c.links?.length > 0)
    : [
        {
          title: "Quick Links",
          links: FALLBACK_LINKS.map((l) => ({ label: l.label, url: l.href })),
        },
      ]

  return (
    <footer className="border-t bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {hasLogo ? (
                <div className="flex items-center justify-center h-9 w-9 rounded-lg text-primary-foreground overflow-hidden">
                  <Image
                    src={brandLogo}
                    alt={formattedBrand}
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  {formattedBrand.charAt(0)}
                </div>
              )}
              <span className="text-base font-bold">{formattedBrand}</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
              {description}
            </p>

            {/* Payment logos */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                We accept:
              </span>
              <div className="flex items-center gap-2">
                {PAYMENT_LOGOS.map((logo) => (
                  <div
                    key={logo.alt}
                    className="flex h-9 items-center justify-center rounded-md border bg-white px-2 dark:bg-zinc-900"
                    title={logo.alt}
                  >
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className={`w-auto object-contain ${logo.className}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Follow Us</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {socialLinks.map((social) => {
                    const Icon = platformIcon(social.platform)
                    return (
                      <a
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.platform}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-primary hover:text-white dark:text-zinc-400 dark:hover:bg-primary dark:hover:text-white"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {platformLabel(social.platform)}
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer columns from settings */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold mb-4">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link, i) => (
                  <li key={`${col.title}-${i}`}>
                    <Link
                      href={link.url}
                      className="text-sm text-zinc-600 hover:text-primary dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {copyrightText}
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Built by{" "}
              <a
                href="https://morlabs.co"
                target="_blank"
                className="hover:text-primary hover:underline"
              >
                Morlabs
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
