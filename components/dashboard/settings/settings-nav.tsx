"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const SETTINGS_SECTIONS = [
    { href: "/dashboard/admin/settings/brand", label: "Brand" },
    { href: "/dashboard/admin/settings/theme", label: "Theme" },
    { href: "/dashboard/admin/settings/hero", label: "Hero" },
    { href: "/dashboard/admin/settings/testimonials", label: "Testimonials" },
    { href: "/dashboard/admin/settings/navbar", label: "Navbar" },
    { href: "/dashboard/admin/settings/footer", label: "Footer" },
    { href: "/dashboard/admin/settings/contact", label: "Contact" },
    { href: "/dashboard/admin/settings/about", label: "About" },
    { href: "/dashboard/admin/settings/limited-offer", label: "Limited Offer" },
    { href: "/dashboard/admin/settings/seo", label: "SEO" },
    { href: "/dashboard/admin/settings/return-refund", label: "Return & Refund" },
] as const;

/** Sub-navigation for the route-based Settings section. */
export function SettingsNav() {
    const pathname = usePathname();

    return (
        <nav
            className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 p-2"
            aria-label="Settings sections"
        >
            {SETTINGS_SECTIONS.map((section) => {
                const active =
                    pathname === section.href ||
                    pathname.startsWith(`${section.href}/`);
                return (
                    <Link
                        key={section.href}
                        href={section.href}
                        className={cn(
                            "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors",
                            active
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {section.label}
                    </Link>
                );
            })}
        </nav>
    );
}
