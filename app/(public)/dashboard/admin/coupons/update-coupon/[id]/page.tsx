// Update coupon, SSR page. Fetches the coupon by id and renders a
// pre-filled update form.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getCouponById } from "@/lib/services/coupon";
import { isErrorResult } from "@/lib/utils/result";
import { UpdateCouponForm } from "@/components/dashboard/coupons/update-coupon-form";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/coupons/update-coupon/[id]");
  }

async function UpdateCouponContent({ couponId }: { couponId: string }) {
    const result = await getCouponById(couponId);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Coupon not found!";
        return <DetailError message={message} backHref="/dashboard/admin/coupons" />;
    }
    return <UpdateCouponForm coupon={result.data} />;
}

export default async function UpdateCouponPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <UpdateCouponContent couponId={id} />
        </Suspense>
    );
}
