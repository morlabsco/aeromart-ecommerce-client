import Link from "next/link";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * TableLink — the clickable primary label for a dashboard table's first
 * column. Jumps straight to the row's single view; hover shifts the color to
 * brand so rows read as tappable without stealing space from a button.
 * ------------------------------------------------------------------------- */

export function TableLink({
    href,
    children,
    className,
    mono = false,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
    /** Monospace labels (order ids, coupon codes) keep the code look. */
    mono?: boolean;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "min-w-0 truncate font-medium text-foreground underline-offset-4 transition-colors hover:text-brand hover:underline",
                mono && "font-mono text-sm",
                className,
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </Link>
    );
}
