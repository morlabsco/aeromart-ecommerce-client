// Settings index, redirects to the Brand section (route-based settings).

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { settingsSectionMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return settingsSectionMetadata("settings");
}

export default function SettingsIndexPage() {
    redirect("/dashboard/admin/settings/brand");
}
