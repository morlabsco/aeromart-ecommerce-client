"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BadgeCheck, Menu, Search, ShoppingCart, Truck, User, X } from "lucide-react"
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
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
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

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const term = searchTerm.trim()
    router.push(term ? `/products?searchTerm=${encodeURIComponent(term)}` : "/products")
    setSearchTerm("")
    setMobileMenuOpen(false)
  }

  const searchInputClasses =
    "w-full border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/30"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Utility top bar */}
      <div className="hidden border-b border-border/60 bg-muted/50 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <p className="flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5 text-success" />
            100% original &amp; premium products
          </p>
          <p className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-brand" />
            Quick delivery at your doorstep
          </p>
        </div>
      </div>

      {/* Main bar: logo, search, actions */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" title={tagline}>
          {hasLogo ? (
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-box">
              <Image
                src={brandLogo}
                alt={formattedBrand}
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-box bg-primary font-display text-base font-semibold uppercase text-primary-foreground">
              {formattedBrand.charAt(0)}
            </div>
          )}
          <span className="font-display text-xl font-semibold uppercase tracking-tight text-foreground transition-colors hover:text-primary">
            {formattedBrand}
          </span>
        </Link>

        {/* Search (desktop) */}
        <form role="search" onSubmit={handleSearch} className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for products..."
              aria-label="Search products"
              className={`h-10 rounded-badge pl-10 pr-[4.5rem] ${searchInputClasses}`}
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 h-7 -translate-y-1/2 cursor-pointer rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Search
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <Link
            href="/login"
            aria-label="Account"
            title="Account"
            className="hidden rounded-full p-2.5 text-foreground transition-colors hover:bg-muted hover:text-primary md:block"
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="relative cursor-pointer rounded-full p-2.5 text-foreground transition-colors hover:bg-muted hover:text-primary"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-badge bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="cursor-pointer rounded-full p-2.5 text-foreground transition-colors hover:bg-muted md:hidden"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Category nav row (desktop) */}
      <nav className="hidden border-t border-border/60 md:block" aria-label="Main navigation">
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative py-1 font-display text-[13px] font-medium uppercase tracking-wider text-foreground/80 transition-colors hover:text-primary"
            >
              {link.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile panel: search + navigation */}
      {isMobileMenuOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 border-t border-border bg-background px-4 py-4 md:hidden">
          <form role="search" onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for products..."
                aria-label="Search products"
                className={`h-11 rounded-md pl-9 pr-3 ${searchInputClasses}`}
              />
            </div>
          </form>
          <nav aria-label="Mobile navigation" className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-border/50 py-3 font-display text-sm font-medium uppercase tracking-wider text-foreground/90 transition-colors last:border-0 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
