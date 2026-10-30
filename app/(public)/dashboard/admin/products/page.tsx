// Products module page, SSR + CSR.
// Uses the product module (getAllProducts). Data is fetched server-side with
// tag-based caching and streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts } from "@/lib/services/product";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { ProductsTable } from "@/components/dashboard/products/products";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/products");
  }

async function ProductsContent() {
    const [result, settingsResult] = await Promise.all([
        getAllProducts({ limit: 10, sort: "-createdAt" }),
        getSettings(),
    ]);
    const products = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;
    const brandCurrency =
        unwrapData(settingsResult)?.brand?.currency ?? "usd";

    return (
        <ProductsTable
            products={products}
            meta={meta}
            brandCurrency={brandCurrency}
        />
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <ProductsContent />
        </Suspense>
    );
}
