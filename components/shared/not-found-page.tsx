import Link from "next/link";
import { SearchX, Home, LayoutGrid } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHero } from "@/components/shared/page-hero";
import { cn } from "@/lib/utils";

interface NotFoundPageProps {
    /** Short title, e.g. "Page not found". */
    title?: string;
    /** Friendly description shown to the user. */
    message?: string;
    /** Link the primary button navigates to. */
    backHref: string;
    /** Text for the primary button. */
    backLabel?: string;
    /** Error code shown in the hero eyebrow, e.g. "404". */
    code?: string;
}

/**
 * 404 state for Next.js `not-found.tsx` boundaries, built as a replica of
 * the /track-order page: gradient command hero up top, cream surface below
 * with a centered white card (icon tile, heading, copy) and the Return /
 * Products actions. Server-safe — no client JS needed.
 */
export function NotFoundPage({
    title = "Page not found",
    message = "The page you are looking for doesn't exist, was moved, or is temporarily unavailable.",
    backHref,
    backLabel = "Return to Home",
    code = "404",
}: NotFoundPageProps) {
    return (
        <div className="bg-hero-surface">
            <PageHero
                eyebrow={`Error ${code}`}
                title="This page took a wrong turn"
                subtitle="The link you followed doesn't lead anywhere — but everything else is right where you left it."
            />

            <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[1.75rem] bg-card p-6 text-center shadow-sm sm:p-10">
                    <span className="mx-auto flex size-13 items-center justify-center rounded-2xl bg-brand p-3.5 text-brand-foreground">
                        <SearchX className="size-6" />
                    </span>
                    <h2 className="mt-5 text-lg font-bold text-foreground sm:text-xl">
                        {title}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                        {message}
                    </p>

                    {/* Actions — stacked on mobile, row from sm up */}
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href={backHref}
                            className={cn(
                                buttonVariants({ variant: "brand", size: "xl" }),
                                "px-8"
                            )}
                        >
                            <Home className="size-4" />
                            {backLabel}
                        </Link>
                        <Link
                            href="/products"
                            className={cn(
                                buttonVariants({ variant: "outline", size: "xl" }),
                                "border-[1.5px] px-8 font-bold"
                            )}
                        >
                            <LayoutGrid className="size-4" />
                            Products
                        </Link>
                    </div>

                    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
                        Error code: {code}
                    </p>
                </div>
            </section>
        </div>
    );
}
