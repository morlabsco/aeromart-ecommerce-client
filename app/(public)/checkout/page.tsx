import type { Metadata } from "next";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { getMyProfile } from "@/lib/services/user";
import Checkout from "../../../components/public/checkout/checkout";

export async function generateMetadata(): Promise<Metadata> {
  const settingsResult = await getSettings();
  const brand = unwrapData(settingsResult)?.brand?.name ?? null;
  return {
    title: brand ? `Checkout - ${brand}` : "Checkout",
    description: "Complete your purchase securely.",
  };
}

const Page = async () => {
  // The signed-in customer's profile powers the checkout quick-fill ("ship
  // to my saved details"); guests simply don't get the toggle.
  const profile = unwrapData(await getMyProfile());

  return (
    <div>
      <Checkout
        profile={
          profile
            ? {
                name: profile.name ?? "",
                phone: profile.phoneNo ?? "",
                email: profile.email ?? "",
                address: profile.address ?? "",
              }
            : null
        }
      />
    </div>
  );
};

export default Page;
