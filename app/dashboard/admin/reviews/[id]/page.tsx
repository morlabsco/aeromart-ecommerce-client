// Admin review details, SSR page (view single). Uses GET /review/:reviewId.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getReviewById } from "@/lib/services/review";
import { isErrorResult } from "@/lib/utils/result";
import { ReviewDetails } from "@/components/dashboard/reviews/review-details";
import { ReviewsSkeleton } from "@/components/dashboard/reviews/reviews-skeleton";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/reviews/[id]");
}

async function ReviewContent({ reviewId }: { reviewId: string }) {
    const result = await getReviewById(reviewId);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Review not found!";
        return <DetailError message={message} backHref="/dashboard/admin/reviews" />;
    }
    return <ReviewDetails review={result.data} />;
}

export default async function ReviewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<ReviewsSkeleton />}>
            <ReviewContent reviewId={id} />
        </Suspense>
    );
}
