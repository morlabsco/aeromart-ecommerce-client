// Create product, SSR page shell hosting the client-side multipart form (CSR).
// Brands and categories are fetched server-side to populate the form selects.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllBrands } from "@/lib/services/brand";
import { getAllCategories } from "@/lib/services/category";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { CreateProductForm } from "@/components/dashboard/products/product-form";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/products/create-product");
  }

async function CreateProductContent() {
    const [brandsResult, categoriesResult, settingsResult] = await Promise.all([
        getAllBrands({ limit: 100 }),
        getAllCategories({ limit: 100 }),
        getSettings(),
    ]);

    const brands = unwrapList(brandsResult);
    const categories = unwrapList(categoriesResult);
    const brandCurrency =
        unwrapData(settingsResult)?.brand?.currency ?? "usd";

    return (
        <CreateProductForm
            brands={brands}
            categories={categories}
            brandCurrency={brandCurrency}
        />
    );
}

export default function CreateProductPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <CreateProductContent />
        </Suspense>
    );
}
