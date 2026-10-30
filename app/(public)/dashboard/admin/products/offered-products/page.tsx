// Offered Products — every product carrying an offerPrice, manageable in one
// place (edit / remove / add offers without opening each product form).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts } from "@/lib/services/product";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { OfferedProductsTable } from "@/components/dashboard/products/offered-products";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/products/offered-products");
}

async function OfferedProductsContent() {
    // hasOffer=true → live, scheduled, expired and inactive offers alike —
    // the manager shows the full picture, not just what is public today.
    const [result, settingsResult] = await Promise.all([
        getAllProducts({ hasOffer: "true", limit: 200, sort: "-updatedAt" }),
        getSettings(),
    ]);
    const products = unwrapList(result);
    const brandCurrency = unwrapData(settingsResult)?.brand?.currency ?? "usd";

    return (
        <OfferedProductsTable
            products={products}
            brandCurrency={brandCurrency}
        />
    );
}

export default function OfferedProductsPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <OfferedProductsContent />
        </Suspense>
    );
}
