// Settings → Return & Refund (route-based section). SSR + skeleton-first.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { SettingsPageShell } from "@/components/dashboard/settings/settings-page-shell";
import { PolicySettingsContent } from "@/components/dashboard/settings/policy-settings-content";
import { settingsSectionMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return settingsSectionMetadata("return-refund");
}

async function ReturnRefundContent() {
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
            {(loaded) => <PolicySettingsContent settings={loaded} />}
        </SettingsPageShell>
    );
}

export default function ReturnRefundSettingsPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <ReturnRefundContent />
        </Suspense>
    );
}
