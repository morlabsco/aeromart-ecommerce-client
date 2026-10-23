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
import { BrandDetailsSkeleton } from "@/components/dashboard/brands/brand-details-skeleton";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/brands/[id]");
  }

async function BrandDetailsContent({ brandId }: { brandId: string }) {
    const result = await getAllBrands({ limit: 100 });
    if (isErrorResult(result)) {
        return <DetailError message={result.message} backHref="/dashboard/admin/brands" />;
    }
    const brand = unwrapData(result)?.find((b) => b._id === brandId);
    if (!brand) notFound();

    return <BrandDetails brand={brand} />;
}

export default async function BrandDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<BrandDetailsSkeleton />}>
            <BrandDetailsContent brandId={id} />
        </Suspense>
    );
}
