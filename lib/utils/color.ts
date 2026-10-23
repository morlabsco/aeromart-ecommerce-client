// Color helpers for the Settings module.
// Converts any CSS color (hex, rgb, hsl) into the oklch() format used by the
// storefront theme variables. Falls back gracefully for values already in
// oklch or unparseable input.

import { converter, formatHex, formatRgb, parse, type Color } from "culori";

const toOklchSpace = converter("oklch");

/** Formats an oklch color object as the CSS `oklch(l c h / alpha)` string. */
function formatOklch(color: Color): string {
    const oklch = toOklchSpace(color) as unknown as {
        mode: "oklch";
        l: number;
        c: number;
        h: number;
        alpha?: number;
    };
    if (!oklch || oklch.mode !== "oklch") return "";
    const l = oklch.l;
    const c = oklch.c;
    const h = oklch.h;
    // Round to 3 decimals for stability (matches shadcn/tailwind style).
    const lStr = l.toFixed(3);
    const cStr = c.toFixed(3);
    const hStr = h.toFixed(3);
    if (typeof oklch.alpha === "number" && oklch.alpha < 1) {
        return `oklch(${lStr} ${cStr} ${hStr} / ${oklch.alpha.toFixed(3)})`;
    }
    return `oklch(${lStr} ${cStr} ${hStr})`;
}

/**
 * Converts any supported CSS color string to oklch.
 * Returns the original string when it is already oklch or cannot be parsed.
 */
export function convertToOklch(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return input;
    if (/^oklch\(/i.test(trimmed)) return trimmed;
    try {
        const color = parse(trimmed);
        if (!color) return input;
        return formatOklch(color);
    } catch {
        return input;
    }
}

/**
 * Converts an oklch string to a hex color (for the color picker's value).
 * Returns null when it can't be converted (e.g. alpha colors).
 */
export function oklchToHex(input: string): string | null {
    try {
        const color = parse(input.trim());
        if (!color) return null;
        const hex = formatHex(color);
        return hex === "#00000000" ? null : hex;
    } catch {
        return null;
    }
}

/**
 * Converts an oklch string to a rgb() string (fallback for the picker).
 */
export function oklchToRgb(input: string): string | null {
    try {
        const color = parse(input.trim());
        if (!color) return null;
        return formatRgb(color);
    } catch {
        return null;
    }
}

export { formatHex };
