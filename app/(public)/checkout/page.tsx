import type { Metadata } from "next";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import Checkout from "../../../components/public/checkout/checkout";

export async function generateMetadata(): Promise<Metadata> {
  const settingsResult = await getSettings();
  const brand = unwrapData(settingsResult)?.brand?.name ?? null;
  return {
    title: brand ? `Checkout - ${brand}` : "Checkout",
    description: "Complete your purchase securely.",
  };
}

const Page = () => {
  return (
    <div>
      <Checkout />
    </div>
  );
};

export default Page;
