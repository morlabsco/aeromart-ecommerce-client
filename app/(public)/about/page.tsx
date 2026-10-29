import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { storefrontMetadata } from "@/lib/metadata";
import About from "../../../components/public/about/about";

export const generateMetadata = () =>
  storefrontMetadata({
    title: "About Us",
    description: "Learn about our story, mission and the people behind the brand.",
  });

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
