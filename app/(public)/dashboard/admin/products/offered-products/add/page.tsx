// Add Offer — full-page offer creation (the sibling of the Quick Add modal
// on the Offered Products manager): catalog search → discount editor with a
// live storefront price preview.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { AddOffer } from "@/components/dashboard/products/add-offer";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/products/offered-products/add", {
        title: { absolute: "Add Offer" },
    });
}

async function AddOfferContent() {
    const settingsResult = await getSettings();
    const brandCurrency = unwrapData(settingsResult)?.brand?.currency ?? "usd";

    return <AddOffer brandCurrency={brandCurrency} />;
}

export default function AddOfferPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <AddOfferContent />
        </Suspense>
    );
}
