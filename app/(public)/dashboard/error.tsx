"use client";

import { ErrorPage } from "@/components/shared/error-page";

export default function DashboardError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <ErrorPage
            title="Something went wrong"
            message="We couldn't load this page. Please try again, or head back to your dashboard."
            backHref="/dashboard"
            backLabel="Back to Dashboard"
            reset={reset}
            code="500"
        />
    );
}
