// All coupons list, SSR page using the coupon module (getAllCoupons).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllCoupons } from "@/lib/services/coupon";
import { unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { CouponsTable } from "@/components/dashboard/coupons/coupons";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/coupons/all-coupons");
  }

async function AllCouponsContent() {
    const result = await getAllCoupons({ limit: 10, sort: "-createdAt" });
    const coupons = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;

    return <CouponsTable coupons={coupons} meta={meta} />;
}

export default function AllCouponsPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <AllCouponsContent />
        </Suspense>
    );
}
