import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { storefrontMetadata } from "@/lib/metadata";
import Contact from "../../../components/public/contact/contact";

export const generateMetadata = () =>
  storefrontMetadata({
    title: "Contact Us",
    description: "Get in touch with our team, we're here to help.",
  });

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
