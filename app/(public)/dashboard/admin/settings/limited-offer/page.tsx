// Settings, Limited Offer (route-based section). SSR + skeleton-first.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { SettingsPageShell } from "@/components/dashboard/settings/settings-page-shell";
import { SectionEditorContent } from "@/components/dashboard/settings/section-editor-content";
import { SettingsSkeleton } from "@/components/dashboard/settings/settings-skeleton";
import { settingsSectionMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return settingsSectionMetadata("limited-offer");
}

async function LimitedOfferContent() {
    const result = await getSettings();
    const settings = unwrapData(result);

    return (
        <SettingsPageShell settings={settings}>
            {(loaded) => (
                <SectionEditorContent settings={loaded} section="limitedOffer" />
            )}
        </SettingsPageShell>
    );
}

export default function LimitedOfferSettingsPage() {
    return (
        <Suspense fallback={<SettingsSkeleton />}>
            <LimitedOfferContent />
        </Suspense>
    );
}
