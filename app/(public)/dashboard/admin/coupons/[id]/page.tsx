// Coupon details, SSR page (view single). Uses GET /coupon/:couponId (admin).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getCouponById } from "@/lib/services/coupon";
import { isErrorResult } from "@/lib/utils/result";
import { CouponDetails } from "@/components/dashboard/coupons/coupon-details";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";
import { getSession } from "@/lib/get-session";
import { dashboardBaseFor } from "@/lib/utils/dashboard-base";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/coupons/[id]");
  }

async function CouponDetailsContent({ couponId }: { couponId: string }) {
    const [result, session] = await Promise.all([
        getCouponById(couponId),
        getSession(),
    ]);
    // Shared with /dashboard/manager — the session role picks the base.
    const base = dashboardBaseFor(session.user?.role);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Coupon not found!";
        return (
            <DetailError
                message={message}
                backHref={`${base}/coupons/all-coupons`}
            />
        );
    }
    return <CouponDetails coupon={result.data} base={base} />;
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
