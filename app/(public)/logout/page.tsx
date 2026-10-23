import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { LogoutView } from "@/components/public/logout/logout-view";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getSettings();
  const settings = unwrapData(result);
  const brand = settings?.brand.name || "Attor";
  return {
    title: `Logout - ${brand}`,
    description: "Logging you out of your account.",
  };
}

export default async function LogoutPage() {
  const session = await getSession();

  // No active session -> nothing to log out, send visitors home.
  if (!session.isAuthenticated) {
    redirect("/");
  }

  return <LogoutView />;
}
