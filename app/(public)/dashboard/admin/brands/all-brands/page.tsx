// All brands list, SSR page using the brand module (getAllBrands).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllBrands } from "@/lib/services/brand";
import { unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { BrandsTable } from "@/components/dashboard/brands/brands";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/brands/all-brands");
  }

async function AllBrandsContent() {
    const result = await getAllBrands({ limit: 10, sort: "-createdAt" });
    const brands = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;

    return <BrandsTable brands={brands} meta={meta} />;
}

export default function AllBrandsPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <AllBrandsContent />
        </Suspense>
    );
}
