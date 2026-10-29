import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { storefrontMetadata } from "@/lib/metadata";
import { TrackOrderClient } from "@/components/public/track-order/track-order-client";

export const dynamic = "force-dynamic";

export const generateMetadata = () =>
  storefrontMetadata({
    title: "Track Order",
    description: "Track your order status and delivery updates in real time.",
  });

export default async function TrackOrderPage({
    searchParams,
}: {
    searchParams: Promise<{ orderId?: string }>;
}) {
    // Live brand currency — prices on this page always match the storefront,
    // even for old orders stamped with a different currency.
    const brandCurrency = unwrapData(await getSettings())?.brand?.currency;
    return <TrackOrderClient searchParams={searchParams} currency={brandCurrency} />;
}
