"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Menu, X } from "lucide-react"
import { useCartStore, useUIStore } from "../../lib/store/app-store"
import { themes, DEFAULT_NICHE } from "../../lib/theme.config"
import type { SettingsBrand, NavbarLink } from "@/lib/types/backend"

interface HeaderProps {
  /** Brand from the settings singleton (server-fetched). */
  brand?: SettingsBrand | null
  /** Public navbar links from settings. */
  navLinks?: NavbarLink[]
}

const FALLBACK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function Header({ brand, navLinks }: HeaderProps) {
  const items = useCartStore((state) => state.items)
  const setCartOpen = useUIStore((s) => s.setCartOpen)
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen)
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen)

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  // Fall back to the static theme config when settings aren't available.
  const theme = themes[DEFAULT_NICHE]
  const brandName = brand?.name || theme.brand
  const brandLogo = brand?.logo || theme.logo
  const tagline = brand?.tagline || theme.tagline

  const formattedBrand =
    brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase()
  const hasLogo = brandLogo.length > 0

  const links =
    navLinks && navLinks.length > 0
      ? navLinks
          .filter((l) => l.label && l.url)
          .map((l) => ({ href: l.url, label: l.label }))
      : FALLBACK_LINKS

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" title={tagline}>
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
          <span className="text-lg font-bold hover:text-primary tracking-tight">
            {formattedBrand}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium px-3 py-2 rounded-lg transition-colors hover:text-white hover:bg-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 text-zinc-600 hover:text-white dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors rounded-lg hover:bg-primary cursor-pointer"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-primary text-[10px] font-bold">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-600 hover:text-white dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-primary cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-zinc-950 px-4 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-zinc-600 hover:text-white dark:text-zinc-400 dark:hover:text-zinc-100 py-2 transition-colors hover:bg-primary px-4 rounded-lg"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
