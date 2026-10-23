import type { Metadata } from "next";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { TrackOrderClient } from "@/components/public/track-order/track-order-client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getSettings();
  const settings = unwrapData(result);
  const brand = settings?.brand.name || "Attor";
  return {
    title: `Track Order - ${brand}`,
    description:
      "Track your order status and delivery updates in real time.",
  };
}

export default function TrackOrderPage({
    searchParams,
}: {
    searchParams: Promise<{ orderId?: string }>;
}) {
    return <TrackOrderClient searchParams={searchParams} />;
}
