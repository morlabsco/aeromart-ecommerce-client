// Customer Overview, SSR page.
// Shows the signed-in customer's profile summary + recent orders.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getMyProfile } from "@/lib/services/user";
import { getMyOrders } from "@/lib/services/order";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { CustomerOverviewV4 } from "@/components/dashboard/v4/customer-overview";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const settingsResult = await getSettings();
    const brand =
        unwrapData(settingsResult)?.brand?.name ?? null;
    return {
        title: brand ? `My Account - ${brand}` : "My Account",
        description: "Your profile and order summary.",
        robots: { index: false, follow: false },
    };
}

async function CustomerOverviewContent() {
    const [profileResult, ordersResult, settingsResult] = await Promise.all([
        getMyProfile(),
        getMyOrders({ limit: 100, sort: "-createdAt" }),
        getSettings(),
    ]);

    const profile = unwrapData(profileResult);
    const orders = unwrapList(ordersResult);
    const brandCurrency =
        unwrapData(settingsResult)?.brand?.currency ?? "usd";

    return (
        <CustomerOverviewV4
            profile={profile}
            orders={orders}
            brandCurrency={brandCurrency}
        />
    );
}

export default function CustomerOverviewPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <CustomerOverviewContent />
        </Suspense>
    );
}
