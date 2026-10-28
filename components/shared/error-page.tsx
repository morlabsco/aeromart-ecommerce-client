"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHero } from "@/components/shared/page-hero";
import { cn } from "@/lib/utils";

interface ErrorPageProps {
    /** Short title, e.g. "Something went wrong". */
    title?: string;
    /** Friendly description shown to the user. */
    message?: string;
    /** Link the secondary button navigates to. */
    backHref: string;
    /** Text for the secondary button. */
    backLabel?: string;
    /** Next.js error recovery — re-renders the segment. */
    reset?: () => void;
    /** Error code shown in the hero eyebrow, e.g. "500". */
    code?: string;
}

/**
 * Error boundary state for Next.js `error.tsx` files, built as a sibling of
 * the track-order-style 404: gradient command hero ("Error 500"), cream
 * surface below with a centered white card (destructive icon tile, message)
 * and a Try-again (re-runs the segment) + back action pair. Client component
 * so it can call the `reset` handler.
 */
export function ErrorPage({
    title = "Something went wrong",
    message = "An unexpected error occurred while loading this page. Please try again.",
    backHref,
    backLabel = "Go Back",
    reset,
    code = "500",
}: ErrorPageProps) {
    return (
        <div className="bg-hero-surface">
            <PageHero
                eyebrow={`Error ${code}`}
                title={title}
                subtitle="An unexpected error occurred — you can retry right here, nothing was lost."
            />

            <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[1.75rem] bg-card p-6 text-center shadow-sm sm:p-10">
                    <span className="mx-auto flex size-13 items-center justify-center rounded-2xl bg-destructive p-3.5 text-destructive-foreground">
                        <AlertTriangle className="size-6" />
                    </span>
                    <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                        {message}
                    </p>

                    {/* Actions — stacked on mobile, row from sm up */}
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        {reset ? (
                            <button
                                type="button"
                                onClick={reset}
                                className={cn(
                                    buttonVariants({ variant: "brand", size: "xl" }),
                                    "cursor-pointer px-8"
                                )}
                            >
                                <RotateCcw className="size-4" />
                                Try Again
                            </button>
                        ) : null}
                        <Link
                            href={backHref}
                            className={cn(
                                buttonVariants({ variant: "outline", size: "xl" }),
                                "border-[1.5px] px-8 font-bold"
                            )}
                        >
                            <ArrowLeft className="size-4" />
                            {backLabel}
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
