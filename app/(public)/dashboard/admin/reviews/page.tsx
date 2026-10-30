// Admin reviews list, SSR page (GET /review).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllReviews } from "@/lib/services/review";
import { unwrapList } from "@/lib/services/api-client";
import { ReviewsTable } from "@/components/dashboard/reviews/reviews";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/reviews");
}

async function ReviewsContent() {
    const result = await getAllReviews({ limit: 20, sort: "-createdAt" });
    if (result instanceof Error) {
        return <DetailError message={result.message} backHref="/dashboard/admin" />;
    }
    const reviews = unwrapList(result);
    return <ReviewsTable reviews={reviews} />;
}

export default function ReviewsPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <ReviewsContent />
        </Suspense>
    );
}
