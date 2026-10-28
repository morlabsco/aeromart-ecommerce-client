// Theme color derivation for the Settings module.
//
// The theme editor exposes only 5 base colors (primary, secondary,
// background, foreground, destructive) per theme. Everything else in the
// shadcn-style color set is derived from those five so the full set can be
// sent to the backend without overwhelming the admin with inputs.
//
// Working space: oklch (l 0-1, c 0-0.4, h 0-360). Helpers round to 3
// decimals for stability, matching the CSS the storefront consumes.

import { converter, parse, wcagLuminance } from "culori";
import type { SettingsColorSet } from "@/lib/types/backend";

const toOklch = converter("oklch");
const toRgb = converter("rgb");

interface Oklch {
    l: number;
    c: number;
    h: number;
    alpha?: number;
}

/** Parses any CSS color string to an oklch object, or null when unparseable. */
function toOklchColor(value: string): Oklch | null {
    const color = parse(value);
    if (!color) return null;
    const oklch = toOklch(color) as unknown as Oklch;
    if (!oklch || typeof oklch.l !== "number") return null;
    return oklch;
}

/** Formats an oklch object as a CSS `oklch(l c h)` string. */
function formatOklch({ l, c, h, alpha }: Oklch): string {
    const alphaPart =
        typeof alpha === "number" && alpha < 1 ? ` / ${alpha.toFixed(3)}` : "";
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)}${alphaPart})`;
}

/**
 * Picks a readable foreground for a given background: light text by default
 * (buttons/chips on a brand color read as white-on-color by convention), and
 * dark text only when the background is genuinely light. A raw
 * black-vs-white contrast race picks near-black for mid-tone brand colors,
 * which renders as black text inside primary buttons and checkboxes.
 */
function readableOn(background: string): string {
    const parsed = toOklchColor(background);
    if (!parsed) return background;

    return parsed.l > 0.72
        ? formatOklch({ ...parsed, l: 0.14, c: 0.03 })
        : formatOklch({ ...parsed, l: 0.97, c: 0.01 });
}

/**
 * Blends two colors toward each other. `weight` is the amount of `to` mixed
 * in (0 = fully `from`, 1 = fully `to`). Works in oklch so results stay
 * perceptually smooth.
 */
function mix(from: string, to: string, weight: number): string {
    const a = toOklchColor(from);
    const b = toOklchColor(to);
    if (!a || !b) return from;

    const t = Math.min(1, Math.max(0, weight));
    const hueDelta = ((b.h - a.h + 540) % 360) - 180;
    return formatOklch({
        l: a.l + (b.l - a.l) * t,
        c: a.c + (b.c - a.c) * t,
        h: a.h + hueDelta * t,
        alpha: a.alpha ?? b.alpha,
    });
}

/**
 * Rotates the hue of a color. Useful for building a distinct chart palette
 * that still shares the theme's character.
 */
function rotateHue(value: string, degrees: number): string {
    const parsed = toOklchColor(value);
    if (!parsed) return value;
    return formatOklch({
        ...parsed,
        h: ((parsed.h + degrees) % 360 + 360) % 360,
    });
}

/**
 * Derives the full shadcn-style color set from the 4 editable base colors.
 * `destructive` is not editable in the UI anymore, so it is carried through
 * unchanged (the stored value is passed in). Unparseable inputs are carried
 * through as-is so a partial/custom value never silently breaks the theme.
 */
export function deriveColorSet(base: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    destructive: string;
}): SettingsColorSet {
    const { primary, secondary, background, foreground, destructive } = base;

    const primaryForeground = readableOn(primary);
    const secondaryForeground = readableOn(secondary);

    // Neutral, desaturated derivatives of the base surfaces.
    const muted = mix(background, foreground, 0.06);
    const mutedForeground = mix(foreground, background, 0.35);
    const border = mix(foreground, background, 0.9);
    const input = border;

    // Accent mirrors secondary (same relationship shadcn uses).
    const accent = secondary;
    const accentForeground = secondaryForeground;

    // Surfaces that follow the background.
    const card = background;
    const cardForeground = foreground;
    const popover = background;
    const popoverForeground = foreground;

    // Ring follows the primary brand color.
    const ring = primary;

    // Sidebar mirrors the main surfaces.
    const sidebar = background;
    const sidebarForeground = foreground;
    const sidebarPrimary = primary;
    const sidebarPrimaryForeground = primaryForeground;
    const sidebarAccent = accent;
    const sidebarAccentForeground = accentForeground;
    const sidebarBorder = border;
    const sidebarRing = ring;

    // Chart palette: hue-spread around the primary hue.
    const chart1 = primary;
    const chart2 = rotateHue(primary, 60);
    const chart3 = rotateHue(primary, 120);
    const chart4 = rotateHue(primary, 180);
    const chart5 = rotateHue(primary, 240);

    return {
        primary,
        primaryForeground,
        secondary,
        secondaryForeground,
        background,
        foreground,
        accent,
        accentForeground,
        muted,
        mutedForeground,
        border,
        destructive,
        ring,
        card,
        cardForeground,
        popover,
        popoverForeground,
        input,
        chart1,
        chart2,
        chart3,
        chart4,
        chart5,
        sidebar,
        sidebarForeground,
        sidebarPrimary,
        sidebarPrimaryForeground,
        sidebarAccent,
        sidebarAccentForeground,
        sidebarBorder,
        sidebarRing,
    };
}

/** Lightness of a color in oklch (0-1), or null when unparseable. */
export function colorLightness(value: string): number | null {
    const parsed = toOklchColor(value);
    return parsed ? parsed.l : null;
}

/** Relative luminance of a color (for display contrast hints). */
export function colorLuminance(value: string): number | null {
    try {
        const color = parse(value);
        if (!color) return null;
        return wcagLuminance(toRgb(color));
    } catch {
        return null;
    }
}
