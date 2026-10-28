import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AuthShellProps {
  /** Which tab is active; also controls tab visibility (hidden when omitted). */
  active?: "login" | "register"
  children: ReactNode
}

/** Shared label style for auth form fields. */
export const authLabelClass = "ml-0.5 block text-xs font-semibold text-foreground"

/**
 * Nittonova auth card (from the cropped auth reference): cream page surface,
 * centered white rounded card with a segmented Login/Register tab switcher
 * (active tab filled brand orange). Login and register pages render their
 * forms inside this shell, within the public site chrome.
 */
export function AuthShell({ active, children }: AuthShellProps) {
  const tabClass = (isActive: boolean) =>
    cn(
      "flex h-10 items-center justify-center rounded-lg text-sm font-bold transition-all",
      isActive
        ? "bg-brand text-brand-foreground shadow-sm"
        : "cursor-pointer text-muted-foreground hover:text-foreground"
    )

  return (
    <section className="bg-hero-surface px-4 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl bg-card p-6 shadow-sm sm:p-8">
          {active && (
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="Authentication">
              <Link href="/login" className={tabClass(active === "login")} aria-current={active === "login" ? "page" : undefined}>
                Login
              </Link>
              <Link href="/register" className={tabClass(active === "register")} aria-current={active === "register" ? "page" : undefined}>
                Register
              </Link>
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  )
}
