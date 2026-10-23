// Brands module page, SSR + CSR.
// Uses the brand module (getAllBrands). Data is fetched server-side with
// tag-based caching and streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllBrands } from "@/lib/services/brand";
import { unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { BrandsTable } from "@/components/dashboard/brands/brands";
import { BrandsSkeleton } from "@/components/dashboard/brands/brands-skeleton";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/brands");
  }

async function BrandsContent() {
    const result = await getAllBrands({ limit: 10, sort: "-createdAt" });
    const brands = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;

    return <BrandsTable brands={brands} meta={meta} />;
}

export default function BrandsPage() {
    return (
        <Suspense fallback={<BrandsSkeleton />}>
            <BrandsContent />
        </Suspense>
    );
}
