import type { Metadata } from "next";
import Login from "../../../components/auth/login/login";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getSettings();
  const settings = unwrapData(result);
  const brand = settings?.brand.name || "Attor";
  return {
    title: `Sign In - ${brand}`,
    robots: { index: false, follow: false },
  };
}

const Page = () => <Login />;

export default Page;
