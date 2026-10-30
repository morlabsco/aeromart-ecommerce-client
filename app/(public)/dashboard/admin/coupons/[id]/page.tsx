// Coupon details, SSR page (view single). Uses GET /coupon/:couponId (admin).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getCouponById } from "@/lib/services/coupon";
import { isErrorResult } from "@/lib/utils/result";
import { CouponDetails } from "@/components/dashboard/coupons/coupon-details";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/coupons/[id]");
  }

async function CouponDetailsContent({ couponId }: { couponId: string }) {
    const result = await getCouponById(couponId);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Coupon not found!";
        return <DetailError message={message} backHref="/dashboard/admin/coupons" />;
    }
    return <CouponDetails coupon={result.data} />;
}

export default async function CouponDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="detail" />}>
            <CouponDetailsContent couponId={id} />
        </Suspense>
    );
}
