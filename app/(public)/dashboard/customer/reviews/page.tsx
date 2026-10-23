// Customer "My Reviews" page (GET /review/my-reviews).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getMyReviews } from "@/lib/services/review";
import { unwrapList } from "@/lib/services/api-client";
import { MyReviews } from "@/components/dashboard/customer/my-reviews";
import { ReviewsSkeleton } from "@/components/dashboard/reviews/reviews-skeleton";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/customer/reviews");
}

async function MyReviewsContent() {
    const result = await getMyReviews({ limit: 50, sort: "-createdAt" });
    if (result instanceof Error) {
        return (
            <DetailError
                message={result.message}
                backHref="/dashboard/customer"
            />
        );
    }
    const reviews = unwrapList(result);
    return <MyReviews reviews={reviews} />;
}

export default function CustomerReviewsPage() {
    return (
        <Suspense fallback={<ReviewsSkeleton />}>
            <MyReviewsContent />
        </Suspense>
    );
}
