import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";

export async function generateMetadata(): Promise<Metadata> {
    const settingsResult = await getSettings();
    const brand =
        unwrapData(settingsResult)?.brand?.name ?? null;
    return {
        title: brand ? `Dashboard - ${brand}` : "Dashboard",
        robots: { index: false, follow: false },
    };
}

export default async function DashboardIndex() {
    const session = await getSession();

    if (session.user?.role === "customer") {
        redirect("/dashboard/customer");
    }
    
    redirect("/dashboard/admin");
}
