import type { Metadata } from "next";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import Contact from "../../../components/public/contact/contact";

export async function generateMetadata(): Promise<Metadata> {
  const settingsResult = await getSettings();
  const settings = unwrapData(settingsResult);
  const brand = settings?.brand?.name ?? null;
  return {
    title: brand ? `Contact Us - ${brand}` : "Contact Us",
    description: "Get in touch with our team, we're here to help.",
  };
}

const Page = async () => {
  const settingsResult = await getSettings();
  const settings = unwrapData(settingsResult);

  return (
    <div>
      <Contact
        contact={settings?.contact ?? null}
        brand={settings?.brand ?? null}
      />
    </div>
  );
};

export default Page;
