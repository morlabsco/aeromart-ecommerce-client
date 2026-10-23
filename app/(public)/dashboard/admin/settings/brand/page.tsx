// Settings, Brand (route-based section). SSR + skeleton-first.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { SettingsPageShell } from "@/components/dashboard/settings/settings-page-shell";
import { BrandSettingsContent } from "@/components/dashboard/settings/brand-settings-content";
import { SettingsSkeleton } from "@/components/dashboard/settings/settings-skeleton";
import { settingsSectionMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return settingsSectionMetadata("brand");
}

async function BrandContent() {
    const result = await getSettings();
    const settings = unwrapData(result);

    return (
        <SettingsPageShell
            settings={settings}
            fallback={
                <p className="text-sm text-muted-foreground">
                    Settings could not be loaded from the backend. Make sure it
                    is seeded (npm run seed:settings).
                </p>
            }
        >
            {(loaded) => <BrandSettingsContent brand={loaded.brand} />}
        </SettingsPageShell>
    );
}

export default function BrandSettingsPage() {
    return (
        <Suspense fallback={<SettingsSkeleton />}>
            <BrandContent />
        </Suspense>
    );
}
