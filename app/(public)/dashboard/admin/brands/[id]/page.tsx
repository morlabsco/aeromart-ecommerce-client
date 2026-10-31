// Brand details, SSR page (view single).
// Backend has no GET /brand/:id, so the list is fetched and the brand is
// looked up by id.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllBrands } from "@/lib/services/brand";
import { unwrapData } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { BrandDetails } from "@/components/dashboard/brands/brand-details";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";
import { getSession } from "@/lib/get-session";
import { dashboardBaseFor } from "@/lib/utils/dashboard-base";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/brands/[id]");
  }

async function BrandDetailsContent({ brandId }: { brandId: string }) {
    const [result, session] = await Promise.all([
        getAllBrands({ limit: 100 }),
        getSession(),
    ]);
    // Shared with /dashboard/manager — the session role picks the base.
    const base = dashboardBaseFor(session.user?.role);
    if (isErrorResult(result)) {
        return (
            <DetailError
                message={result.message}
                backHref={`${base}/brands/all-brands`}
            />
        );
    }
    const brand = unwrapData(result)?.find((b) => b._id === brandId);
    if (!brand) notFound();

    return <BrandDetails brand={brand} base={base} />;
}

export default async function BrandDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="detail" />}>
            <BrandDetailsContent brandId={id} />
        </Suspense>
    );
}
