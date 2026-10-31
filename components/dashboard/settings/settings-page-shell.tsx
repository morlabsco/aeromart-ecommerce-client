// Shared server layout for the route-based Settings pages.
import { SettingsNav } from "@/components/dashboard/settings/settings-nav";
// TEMPORARILY DISABLED (user decision, 31/10/2026): the niche preset
// apply/reset feature is parked — applying a preset can clobber the
// hand-tuned Nittonova theme. The owner manages the theme manually per
// section. Re-enable by rendering <PresetButton /> again.
// import { PresetButton } from "@/components/dashboard/settings/preset-button";
import type { Settings } from "@/lib/types/backend";

interface SettingsPageShellProps {
    settings: Settings | null;
    /** Renders the section content for the loaded settings. */
    children: (settings: Settings) => React.ReactNode;
    /** Fallback when settings failed to load. */
    fallback?: React.ReactNode;
}

export function SettingsPageShell({
    settings,
    children,
    fallback,
}: SettingsPageShellProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage brand identity, theme and all website sections
                    </p>
                </div>
                {/* PresetButton parked — see the note at the top of this file. */}
            </div>

            <SettingsNav />

            {settings ? children(settings) : (fallback ?? null)}
        </div>
    );
}
