import type { Metadata } from "next";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import About from "../../../components/public/about/about";

export async function generateMetadata(): Promise<Metadata> {
  const settingsResult = await getSettings();
  const settings = unwrapData(settingsResult);
  const brand = settings?.brand?.name ?? null;
  return {
    title: brand ? `About Us - ${brand}` : "About Us",
    description: "Learn about our story, mission and the people behind the brand.",
  };
}

const Page = async () => {
  const settingsResult = await getSettings();
  const settings = unwrapData(settingsResult);

  return (
    <div>
      <About
        about={settings?.about ?? null}
        brand={settings?.brand ?? null}
      />
    </div>
  );
};

export default Page;
