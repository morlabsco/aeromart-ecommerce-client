// Update brand, SSR page. Fetches the brand (via list lookup) and renders a
// pre-filled update form.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllBrands } from "@/lib/services/brand";
import { unwrapData } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { UpdateBrandForm } from "@/components/dashboard/brands/update-brand-form";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/brands/update-brand/[id]");
  }

async function UpdateBrandContent({ brandId }: { brandId: string }) {
    const result = await getAllBrands({ limit: 100 });
    if (isErrorResult(result)) {
        return <DetailError message={result.message} backHref="/dashboard/admin/brands" />;
    }
    const brand = unwrapData(result)?.find((b) => b._id === brandId);
    if (!brand) notFound();

    return <UpdateBrandForm brand={brand} />;
}

export default async function UpdateBrandPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <UpdateBrandContent brandId={id} />
        </Suspense>
    );
}
