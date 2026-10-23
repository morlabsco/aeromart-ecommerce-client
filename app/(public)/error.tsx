"use client";

import { ErrorPage } from "@/components/shared/error-page";

export default function PublicError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <ErrorPage
            title="Something went wrong"
            message="We couldn't load this page. Please try again, or head back to the home page."
            backHref="/"
            backLabel="Back to Home"
            reset={reset}
            code="500"
        />
    );
}
