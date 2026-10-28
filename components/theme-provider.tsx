// Server component that injects the storefront theme from the Settings
// singleton as CSS variables. Falls back to the static theme.config when the
// backend is unreachable so the site still renders.

import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import type { SettingsColorSet, SettingsTheme } from "@/lib/types/backend";

const CSS_VAR_KEYS: { key: keyof SettingsColorSet; cssVar: string }[] = [
  { key: "primary", cssVar: "--primary" },
  { key: "primaryForeground", cssVar: "--primary-foreground" },
  { key: "secondary", cssVar: "--secondary" },
  { key: "secondaryForeground", cssVar: "--secondary-foreground" },
  { key: "background", cssVar: "--background" },
  { key: "foreground", cssVar: "--foreground" },
  { key: "accent", cssVar: "--accent" },
  { key: "accentForeground", cssVar: "--accent-foreground" },
  { key: "muted", cssVar: "--muted" },
  { key: "mutedForeground", cssVar: "--muted-foreground" },
  { key: "border", cssVar: "--border" },
  { key: "destructive", cssVar: "--destructive" },
  { key: "ring", cssVar: "--ring" },
  { key: "card", cssVar: "--card" },
  { key: "cardForeground", cssVar: "--card-foreground" },
  { key: "popover", cssVar: "--popover" },
  { key: "popoverForeground", cssVar: "--popover-foreground" },
  { key: "input", cssVar: "--input" },
  { key: "chart1", cssVar: "--chart-1" },
  { key: "chart2", cssVar: "--chart-2" },
  { key: "chart3", cssVar: "--chart-3" },
  { key: "chart4", cssVar: "--chart-4" },
  { key: "chart5", cssVar: "--chart-5" },
  { key: "sidebar", cssVar: "--sidebar" },
  { key: "sidebarForeground", cssVar: "--sidebar-foreground" },
  { key: "sidebarPrimary", cssVar: "--sidebar-primary" },
  { key: "sidebarPrimaryForeground", cssVar: "--sidebar-primary-foreground" },
  { key: "sidebarAccent", cssVar: "--sidebar-accent" },
  { key: "sidebarAccentForeground", cssVar: "--sidebar-accent-foreground" },
  { key: "sidebarBorder", cssVar: "--sidebar-border" },
  { key: "sidebarRing", cssVar: "--sidebar-ring" },
];

function buildColorCss(colors: Partial<SettingsColorSet>): string {
  return CSS_VAR_KEYS.filter(({ key }) => colors[key])
    .map(({ key, cssVar }) => `${cssVar}: ${colors[key]};`)
    .join("\n");
}

/**
 * Families loaded via next/font resolve to their optimized CSS variables so
 * the admin setting picks up the self-hosted font; any other family keeps
 * the admin's name with the Bangla companion appended so Bengali text always
 * has a fallback.
 */
const FONT_STACKS: Record<string, string> = {
  Jost: "var(--font-jost), var(--font-hind), sans-serif",
}

function fontStackFor(family: string): string {
  return FONT_STACKS[family] ?? `"${family}", var(--font-hind), sans-serif`
}

function buildThemeCss(theme: SettingsTheme): string {
  const light = buildColorCss(theme.colors);
  const dark = theme.dark.enabled ? buildColorCss(theme.dark.colors) : "";
  const fontFamily = theme.fonts.family
    ? `--font-sans: ${fontStackFor(theme.fonts.family)};`
    : "";
  const fontMono = theme.fonts.mono
    ? `--font-mono: ${theme.fonts.mono}, ui-monospace, monospace;`
    : "";
  const radius = theme.radius ? `--radius: ${theme.radius};` : "";
  const sizes = theme.fonts.sizes
    ? [
        `--text-h1: ${theme.fonts.sizes.h1};`,
        `--text-h2: ${theme.fonts.sizes.h2};`,
        `--text-h3: ${theme.fonts.sizes.h3};`,
        `--text-body: ${theme.fonts.sizes.body};`,
        `--text-small: ${theme.fonts.sizes.small};`,
      ].join("\n")
    : "";

  return [
    `:root {\n${light}\n${fontFamily}\n${fontMono}\n${radius}\n${sizes}\n}`,
    dark ? `.dark {\n${dark}\n}` : "",
    theme.globalCss || "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function ThemeProvider() {
  const result = await getSettings();
  const settings = unwrapData(result);

  if (!settings) return null;

  return <style dangerouslySetInnerHTML={{ __html: buildThemeCss(settings.theme) }} />;
}
