import Link from "next/link"
import Image from "next/image"
import { Mail, MapPin, Phone } from "lucide-react"
import { themes, DEFAULT_NICHE } from "../../lib/theme.config"
import { socialPlatformIcon } from "../shared/brand-icons"
import type { SettingsBrand, SettingsContact, SettingsFooter } from "@/lib/types/backend"

/** Capitalized platform name, e.g. "twitter" -> "Twitter". */
function platformLabel(platform: string): string {
  return platform.charAt(0).toUpperCase() + platform.slice(1)
}

interface FooterProps {
  /** Brand from the settings singleton (server-fetched). */
  brand?: SettingsBrand | null
  /** Footer section from the settings singleton. */
  footer?: SettingsFooter | null
  /** Contact section from the settings singleton, powers "Get in Touch". */
  contact?: SettingsContact | null
  /** Top categories (max 5) for the Categories column. */
  categories?: { name: string; slug: string }[]
}

/**
 * Nittonova footer, built from the cropped reference
 * (nittonova-home-page-large-device-footer.png): white footer with a warm
 * top border, four columns — brand block (logo, description, socials),
 * two settings link columns with uppercase letterspaced headings, and a
 * "Get In Touch" column of gray icon tiles — above a light bottom bar with
 * the copyright and a letterspaced "Secure Payments" note.
 */
export function Footer({ brand, footer, contact, categories }: FooterProps) {
  const theme = themes[DEFAULT_NICHE]

  const brandName = brand?.name || theme.brand
  const brandLogo = brand?.logo || theme.logo
  // Brand name renders exactly as the admin typed it — no forced casing.
  const hasLogo = brandLogo.length > 0

  const description = footer?.description || theme.footer.description
  const copyrightText =
    footer?.copyrightText || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`

  const socialLinks = footer?.socialLinks?.filter((s) => s.platform && s.url) ?? []

  // Footer link columns: Quick Links (first settings column + the refund
  // policy) and a Categories column built from the live category list.
  const quickLinks = footer?.columns?.[0]?.links?.filter((l) => l.label && l.url) ?? [
    { label: "Products", url: "/products" },
    { label: "Contact", url: "/contact" },
  ]
  const columns = [
    {
      title: footer?.columns?.[0]?.title ?? "Quick Links",
      links: [...quickLinks, { label: "Return & Refund Policy", url: "/return-refund-policy" }],
    },
    ...((categories ?? []).length > 0
      ? [
          {
            title: "Categories",
            links: categories!.slice(0, 5).map((c) => ({
              label: c.name,
              url: `/products?category=${c.slug}`,
            })),
          },
        ]
      : []),
  ]

  // "Get In Touch" rows — only fields the settings actually provide.
  // Location opens Google Maps; phone/email use tel:/mailto: links.
  const contactRows = [
    contact?.address && {
      icon: MapPin,
      label: "Location",
      value: contact.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
      external: true,
    },
    contact?.phone && { icon: Phone, label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` },
    contact?.email && { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string; href?: string; external?: boolean }[]

  const columnHeading = "text-sm font-bold uppercase tracking-widest text-foreground"
  const columnLink =
    "inline-block text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:translate-x-1 hover:text-brand"

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          {/* Brand block */}
          <div>
            <Link
              href="/"
              aria-label={`${brandName} — home`}
              className="flex items-center gap-2 transition-opacity hover:opacity-90"
            >
              {brand?.logoOnly && hasLogo ? (
                /* Logo-only mode: natural aspect, uncropped */
                <Image
                  src={brandLogo}
                  alt={brandName}
                  width={0}
                  height={0}
                  sizes="220px"
                  className="h-10 w-auto max-w-[200px] object-contain sm:h-11"
                />
              ) : (
                <>
                  {hasLogo ? (
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
                      <Image
                        src={brandLogo}
                        alt={brandName}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-lg font-bold text-brand-foreground">
                      {brandName.charAt(0)}
                    </div>
                  )}
                  <span className="text-lg font-extrabold tracking-tight text-foreground">
                    {brandName}
                  </span>
                </>
              )}
            </Link>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{description}</p>

            {socialLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {socialLinks.map((social) => {
                  const Icon = socialPlatformIcon(social.platform)
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={platformLabel(social.platform)}
                      aria-label={platformLabel(social.platform)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-brand transition-colors hover:border-brand hover:bg-brand hover:text-brand-foreground"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Links / Categories / Get in Touch grouped to the right,
              clearly separated from the brand block on large devices. */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:gap-12">
            {/* Link columns from settings */}
            {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className={columnHeading}>{col.title}</h3>
              <ul className="mt-6 space-y-3.5">
                {col.links.map((link, i) => (
                  <li key={`${col.title}-${i}`}>
                    <Link href={link.url} className={columnLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Get in touch */}
          {contactRows.length > 0 && (
            <div>
              <h3 className={columnHeading}>Get In Touch</h3>
              <ul className="mt-6 space-y-4">
                {contactRows.map((row) => {
                  const Icon = row.icon
                  const RowTag = (row.href ? "a" : "div") as "a"
                  return (
                    <li key={row.label}>
                      <RowTag
                        href={row.href}
                        target={row.external ? "_blank" : undefined}
                        rel={row.external ? "noopener noreferrer" : undefined}
                        className="group flex cursor-pointer items-center gap-3"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card">
                          <Icon className="h-5 w-5 text-foreground transition-colors duration-300 group-hover:text-brand" strokeWidth={1.5} />
                        </span>
                        <span>
                          <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                            {row.label}
                          </span>
                          <span className="block max-w-[180px] text-[15px] font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-brand">
                            {row.value}
                          </span>
                        </span>
                      </RowTag>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/60 bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>
            {copyrightText}{" "}
            <span className="text-muted-foreground">
              · Built by{" "}
              <a
                href="https://morlabs.co"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand hover:underline"
              >
                Morlabs
              </a>
            </span>
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Secure Payments
          </p>
        </div>
      </div>
    </footer>
  )
}
