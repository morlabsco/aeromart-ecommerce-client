"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotFoundPageProps {
    /** Short title, e.g. "Page not found". */
    title?: string;
    /** Friendly description shown to the user. */
    message?: string;
    /** Link the "Go back" button navigates to. */
    backHref: string;
    /** Text for the "Go back" button. */
    backLabel?: string;
    /** Error code shown at the bottom, e.g. "404". */
    code?: string;
}

/**
 * Full-width, centered 404 state for Next.js `not-found.tsx` boundaries.
 * Replaces the default Next.js 404 with a branded, friendly page.
 */
export function NotFoundPage({
    title = "Page not found",
    message = "The page you are looking for doesn't exist, was moved, or is temporarily unavailable.",
    backHref,
    backLabel = "Go Back",
    code = "404",
}: NotFoundPageProps) {
    return (
        <div className="relative flex min-h-[75vh] w-full items-center justify-center overflow-hidden px-4 py-16">
            {/* Decorative background , theme-tinted (matches the failed/error pages) */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-destructive/10 blur-3xl dark:bg-destructive/15" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-warning/10 blur-3xl" />

            <div className="relative w-full max-w-lg">
                {/* Gradient border , theme-aware */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-destructive via-destructive/70 to-warning" />

                <div className="relative flex flex-col items-center rounded-2xl bg-card px-6 py-12 shadow-xl sm:px-10 sm:py-14">
                    {/* Icon */}
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 sm:h-28 sm:w-28">
                        <FileQuestion className="h-14 w-14 text-destructive" />
                    </div>

                    <h1 className="text-center text-3xl font-bold tracking-tight text-destructive sm:text-4xl">
                        {title}
                    </h1>
                    <p className="mx-auto mt-3 max-w-sm text-center text-sm text-muted-foreground sm:text-base">
                        {message}
                    </p>

                    <Link
                        href={backHref}
                        className={cn(
                            buttonVariants({ variant: "outline" }),
                            "mt-8 inline-flex items-center gap-2"
                        )}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {backLabel}
                    </Link>

                    <div className="mt-10 text-sm text-muted-foreground/60">
                        Error Code: {code}
                    </div>
                </div>
            </div>
        </div>
    );
}
