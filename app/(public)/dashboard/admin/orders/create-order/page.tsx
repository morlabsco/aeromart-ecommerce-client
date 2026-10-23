// Create order, SSR page shell hosting the client-side form (CSR).
// Products and coupons are fetched server-side to populate the form.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts } from "@/lib/services/product";
import { getAllCoupons } from "@/lib/services/coupon";
import { getSettings } from "@/lib/services/settings";
import { unwrapList, unwrapData } from "@/lib/services/api-client";
import { CreateOrderForm } from "@/components/dashboard/orders/order-form";
import { FormSkeleton } from "@/components/dashboard/shared/form-skeleton";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/orders/create-order");
  }

async function CreateOrderContent() {
    const [productsResult, couponsResult, settingsResult] = await Promise.all([
        getAllProducts({ limit: 100 }),
        getAllCoupons({ limit: 100 }),
        getSettings(),
    ]);
    const products = unwrapList(productsResult);
    const coupons = unwrapList(couponsResult);
    const settings = unwrapData(settingsResult);
    const brandCurrency = settings?.brand?.currency ?? "usd";

    return (
        <CreateOrderForm
            products={products}
            coupons={coupons}
            brandCurrency={brandCurrency}
            deliveryOptions={settings?.brand?.deliveryOptions ?? []}
        />
    );
}

export default function CreateOrderPage() {
    return (
        <Suspense fallback={<FormSkeleton />}>
            <CreateOrderContent />
        </Suspense>
    );
}
