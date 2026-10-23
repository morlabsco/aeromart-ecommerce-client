import type { Metadata } from "next";
import Register from "../../../components/auth/register/register";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getSettings();
  const settings = unwrapData(result);
  const brand = settings?.brand.name || "Attor";
  return {
    title: `Create Account - ${brand}`,
    robots: { index: false, follow: false },
  };
}

const Page = async () => {
  const result = await getSettings();
  const settings = unwrapData(result);

  return (
    <div>
      <Register brand={settings?.brand ?? null} />
    </div>
  );
};

export default Page;
