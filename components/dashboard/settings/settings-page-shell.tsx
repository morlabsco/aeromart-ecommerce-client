// Shared server layout for the route-based Settings pages.
import { SettingsNav } from "@/components/dashboard/settings/settings-nav";
import { PresetButton } from "@/components/dashboard/settings/preset-button";
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
                <PresetButton />
            </div>

            <SettingsNav />

            {settings ? children(settings) : (fallback ?? null)}
        </div>
    );
}
