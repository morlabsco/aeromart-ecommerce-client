"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorPageProps {
    /** Short title, e.g. "Something went wrong". */
    title?: string;
    /** Friendly description shown to the user. */
    message?: string;
    /** Link the "Go back" button navigates to. */
    backHref: string;
    /** Text for the "Go back" button. */
    backLabel?: string;
    /** Next.js error recovery , re-renders the segment. */
    reset?: () => void;
    /** Error code shown at the bottom, e.g. "500". */
    code?: string;
}

/**
 * Full-width, centered error state for Next.js `error.tsx` boundaries.
 * Shows a friendly message, a "Try again" reset and a "Go back" link so the
 * user never sees a raw runtime error.
 */
export function ErrorPage({
    title = "Something went wrong",
    message = "An unexpected error occurred while loading this page. Please try again.",
    backHref,
    backLabel = "Go Back",
    reset,
    code = "Error",
}: ErrorPageProps) {
    return (
        <div className="relative flex min-h-[75vh] w-full items-center justify-center overflow-hidden px-4 py-16">
            {/* Decorative background , theme-tinted (matches the failed payment page) */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-destructive/10 blur-3xl dark:bg-destructive/15" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/15" />

            <div className="relative w-full max-w-lg">
                {/* Gradient border , theme-aware */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-destructive via-destructive/70 to-amber-400 dark:from-destructive dark:via-destructive/70 dark:to-amber-500" />

                <div className="relative flex flex-col items-center rounded-2xl bg-card px-6 py-10 shadow-xl sm:px-8 sm:py-12">
                    {/* Icon */}
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 sm:h-20 sm:w-20">
                        <AlertTriangle className="h-8 w-8 text-destructive sm:h-10 sm:w-10" />
                    </div>

                    <h1 className="text-center text-xl font-bold tracking-tight text-destructive sm:text-2xl">
                        {title}
                    </h1>
                    <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
                        {message}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        {reset && (
                            <Button type="button" onClick={reset}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                        )}
                        <Link
                            href={backHref}
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "inline-flex items-center gap-2"
                            )}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {backLabel}
                        </Link>
                    </div>

                    <div className="mt-8 text-sm text-muted-foreground/60">
                        Error Code: {code}
                    </div>
                </div>
            </div>
        </div>
    );
}
