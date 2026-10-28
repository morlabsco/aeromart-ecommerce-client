"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ChevronDown, LayoutDashboard, LogOut, Menu, Phone, Search, ShoppingBag, User, X } from "lucide-react"
import { useCartStore, useUIStore } from "../../lib/store/app-store"
import { themes, DEFAULT_NICHE } from "../../lib/theme.config"
import { formatCurrency } from "../../lib/utils/currency"
import { cn } from "../../lib/utils"
import { SearchBox } from "./search-box"
import type { SettingsBrand, NavbarLink } from "@/lib/types/backend"

interface HeaderProps {
  /** Brand from the settings singleton (server-fetched). */
  brand?: SettingsBrand | null
  /** Public navbar links from settings. */
  navLinks?: NavbarLink[]
  /** Signed-in user from the session; powers the account menu. */
  user?: { name?: string | null; email?: string | null; role?: string | null } | null
}

const FALLBACK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

/** Two-line stacked label used by the desktop action groups. */
const stackedLabel = "text-[11px] leading-tight text-muted-foreground"
const stackedValue = "text-sm font-bold leading-tight text-foreground"

/**
 * Nittonova (ECS NOVA) header, built from the cropped reference screenshots
 * in /public/images/references.
 *
 * Desktop: white main bar (logo left, rectangular bordered search with an
 * orange magnifier button in the center, Support / Account / Cart groups on
 * the right) above a charcoal category-nav row with white title-case links.
 * Mobile: plain white bar (hamburger left, horizontally centered logo,
 * plain search icon and cart in a gray circle with a ringed badge), a
 * full-screen large-input search overlay, and a left slide-in drawer
 * (MENU heading, uppercase items with dividers, LOGIN pinned at the bottom).
 */
export function Header({ brand, navLinks, user }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const items = useCartStore((state) => state.items)
  const subtotal = useCartStore((s) => s.subtotal)
  const setCartOpen = useUIStore((s) => s.setCartOpen)
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen)
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen)

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)
  // Prefer the live brand currency from settings over the product snapshot.
  const cartTotal = formatCurrency(subtotal(), brand?.currency ?? items[0]?.product.currency)

  // Fall back to the static theme config when settings aren't available.
  const theme = themes[DEFAULT_NICHE]
  const brandName = brand?.name || theme.brand
  const brandLogo = brand?.logo || theme.logo
  const tagline = brand?.tagline || theme.tagline

  // Render the brand name exactly as the admin typed it — no forced casing.
  const hasLogo = brandLogo.length > 0

  const links =
    navLinks && navLinks.length > 0
      ? navLinks
          .filter((l) => l.label && l.url)
          .map((l) => ({ href: l.url, label: l.label }))
      : FALLBACK_LINKS

  // Lock body scroll and close the drawer on Escape while it is open. The
  // search panel is a dropdown, not a modal — the page stays scrollable and
  // the SearchBox closes itself on Escape / outside taps.
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setMobileMenuOpen(false)
      setSearchOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [isMobileMenuOpen, setMobileMenuOpen])

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background">
        {/* Main bar: white, logo / search / action groups on desktop,
            hamburger / centered logo / icons on mobile */}
        <div className="border-b border-border/60 md:border-b-0">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-20 sm:px-6 lg:h-[5.25rem] lg:px-8">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="-ml-2 cursor-pointer p-2 text-foreground md:hidden"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>

            {/* Logo — absolutely centered on mobile, static on desktop */}
            <Link
              href="/"
              title={tagline}
              className="absolute left-1/2 flex -translate-x-1/2 shrink-0 items-center gap-1.5 md:static md:translate-x-0"
            >
              {brand?.logoOnly && hasLogo ? (
                /* Logo-only mode: the artwork at its natural aspect, uncropped */
                <Image
                  src={brandLogo}
                  alt={brandName}
                  width={0}
                  height={0}
                  sizes="200px"
                  className="h-9 w-auto max-w-[170px] object-contain sm:h-10 md:h-11 md:max-w-[200px]"
                />
              ) : (
                <>
                  {hasLogo ? (
                    <Image
                      src={brandLogo}
                      alt={brandName}
                      width={40}
                      height={40}
                      className="h-9 w-9 object-contain md:h-10 md:w-10"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-lg font-bold text-brand-foreground md:h-10 md:w-10">
                      {brandName.charAt(0)}
                    </span>
                  )}
                  <span className="text-base font-extrabold tracking-tight text-foreground md:text-xl">
                    {brandName}
                  </span>
                </>
              )}
            </Link>

            {/* Search (desktop): bordered rectangle + orange magnifier button,
                with live product suggestions as you type */}
            <div className="hidden flex-1 justify-center px-4 md:flex lg:px-8">
              <SearchBox currency={brand?.currency} className="w-full max-w-xl" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 md:gap-5 lg:gap-6">
              {/* Mobile: search icon toggles the dropdown search panel */}
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="cursor-pointer p-2 text-foreground md:hidden"
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <Search className="h-[22px] w-[22px]" strokeWidth={1.5} />
              </button>
              {/* Mobile: cart in a gray circle with a ringed badge */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-muted md:hidden"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-[18px] w-[18px] text-foreground" strokeWidth={1.5} />
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted-foreground/60 px-1 text-[9px] font-semibold text-background ring-2 ring-background">
                  {cartCount}
                </span>
              </button>

              {/* Desktop: Support group */}
              <Link href="/contact" className="group hidden items-center gap-2 md:flex">
                <Phone
                  className="h-[22px] w-[22px] text-foreground transition-colors group-hover:text-brand"
                  strokeWidth={1.5}
                />
                <span className="flex flex-col">
                  <span className={stackedLabel}>Support</span>
                  <span className={cn(stackedValue, "transition-colors group-hover:text-brand")}>Contact Us</span>
                </span>
              </Link>

              {/* Desktop: Account menu — opens on hover, focusable for
                  keyboard users. Logged out shows Login/Register buttons;
                  logged in shows the user, RBAC links, and Logout. */}
              <div className="group relative hidden md:block">
                <Link href="/login" className="flex items-center gap-2">
                  <User
                    className="h-[22px] w-[22px] text-foreground transition-colors group-hover:text-brand"
                    strokeWidth={1.5}
                  />
                  <span className="flex flex-col">
                    <span className={stackedLabel}>Account</span>
                    <span className={cn(stackedValue, "transition-colors group-hover:text-brand")}>
                      {user ? user.name ?? "Account" : "Sign In"}
                    </span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:rotate-180" />
                </Link>

                <div className="invisible absolute right-0 top-full z-50 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="w-60 rounded-xl border border-border/60 bg-card p-2 shadow-xl">
                    {!user ? (
                      <div className="space-y-2 p-1">
                        <Link
                          href="/login"
                          className="flex h-10 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
                        >
                          Login
                        </Link>
                        <Link
                          href="/register"
                          className="flex h-10 items-center justify-center rounded-lg border-[1.5px] border-brand text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
                        >
                          Register
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Signed in as
                          </p>
                          <p className="mt-0.5 truncate text-sm font-bold text-foreground">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="my-1 h-px bg-border/60" />
                        {(user.role === "admin"
                          ? [
                              { label: "Dashboard", href: "/dashboard/admin" },
                              { label: "Orders", href: "/dashboard/admin/orders" },
                              { label: "Products", href: "/dashboard/admin/products" },
                            ]
                          : [
                              { label: "Dashboard", href: "/dashboard/customer" },
                              { label: "My Orders", href: "/dashboard/customer/orders" },
                              { label: "My Reviews", href: "/dashboard/customer/reviews" },
                            ]
                        ).map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-brand"
                          >
                            {item.label}
                          </Link>
                        ))}
                        <div className="my-1 h-px bg-border/60" />
                        <Link
                          href="/logout"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop: Cart group with live total */}
              <button
                onClick={() => setCartOpen(true)}
                className="group hidden cursor-pointer items-center gap-2 md:flex"
                aria-label="Open cart"
              >
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <ShoppingBag
                    className="h-5 w-5 text-foreground transition-colors group-hover:text-brand"
                    strokeWidth={1.5}
                  />
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-background px-0.5 text-[8px] font-bold text-foreground">
                    {cartCount}
                  </span>
                </span>
                <span className="flex flex-col text-left">
                  <span className={stackedLabel}>Cart</span>
                  <span className={cn(stackedValue, "transition-colors group-hover:text-brand")}>{cartTotal}</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Category nav (desktop): charcoal bar, white title-case links */}
        <nav className="hidden bg-header-nav md:block" aria-label="Main navigation">
          <div className="mx-auto flex h-12 max-w-7xl items-center justify-center gap-8 px-4 sm:px-6 lg:gap-10 lg:px-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-1 text-sm font-semibold text-header-nav-foreground transition-colors hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile: search panel — the same concept search as desktop
            (input + live suggestions), dropping in under the header bar */}
        {searchOpen && (
          <div className="absolute inset-x-0 top-full z-50 animate-in fade-in slide-in-from-top-2 border-b border-border/60 bg-background shadow-lg md:hidden">
            <div className="px-4 py-3">
              <SearchBox
                autoFocus
                currency={brand?.currency}
                onClose={() => setSearchOpen(false)}
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer — left slide-in panel over a scrim */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-scrim/50 transition-opacity duration-300 md:hidden",
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[75%] max-w-xs flex-col bg-card shadow-xl transition-transform duration-300 md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4">
          <span className="text-sm font-bold uppercase tracking-widest text-foreground">
            Menu
          </span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="cursor-pointer rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block border-b border-border/60 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="shrink-0 space-y-1 border-t border-border/60 p-4">
          {user ? (
            <>
              <Link
                href={user.role === "admin" ? "/dashboard/admin" : "/dashboard/customer"}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-bold uppercase tracking-widest text-foreground transition-colors hover:text-brand"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/logout"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-bold uppercase tracking-widest text-destructive transition-colors hover:opacity-80"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-bold uppercase tracking-widest text-foreground transition-colors hover:text-brand"
              >
                <User className="h-4 w-4" />
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-bold uppercase tracking-widest text-foreground transition-colors hover:text-brand"
              >
                <User className="h-4 w-4" />
                Register
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
