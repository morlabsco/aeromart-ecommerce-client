// Create coupon, SSR page shell hosting the client-side form (CSR).

import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateCouponForm } from "@/components/dashboard/coupons/coupon-form";
import { FormSkeleton } from "@/components/dashboard/shared/form-skeleton";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/coupons/create-coupon");
  }

export default function CreateCouponPage() {
    return (
        <Suspense fallback={<FormSkeleton />}>
            <CreateCouponForm />
        </Suspense>
    );
}
