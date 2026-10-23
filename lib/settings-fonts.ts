// Font family + size options for the Settings theme editor.

export interface FontOption {
  /** CSS font-family value. */
  value: string;
  /** Display name shown in the select. */
  label: string;
  /** Sample text style (font-family override for the demo). */
  demo?: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { value: "Inter", label: "Inter", demo: "font-sans" },
  { value: "system-ui", label: "System UI", demo: "font-sans" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica Neue", label: "Helvetica Neue" },
  { value: "Verdana", label: "Verdana" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Georgia", label: "Georgia", demo: "font-serif" },
  { value: "Times New Roman", label: "Times New Roman", demo: "font-serif" },
  { value: "Garamond", label: "Garamond", demo: "font-serif" },
  { value: "Palatino Linotype", label: "Palatino Linotype", demo: "font-serif" },
  { value: "Courier New", label: "Courier New", demo: "font-mono" },
  { value: "Consolas", label: "Consolas", demo: "font-mono" },
  { value: "Menlo", label: "Menlo", demo: "font-mono" },
  { value: "Monaco", label: "Monaco", demo: "font-mono" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Raleway", label: "Raleway" },
  { value: "Nunito", label: "Nunito" },
  { value: "Merriweather", label: "Merriweather", demo: "font-serif" },
  { value: "Playfair Display", label: "Playfair Display", demo: "font-serif" },
  { value: "Source Sans 3", label: "Source Sans 3" },
  { value: "Ubuntu", label: "Ubuntu" },
  { value: "Segoe UI", label: "Segoe UI" },
];

/** A font stack matching the option, with sensible fallbacks. */
export function fontStack(value: string): string {
  return `${value}, system-ui, sans-serif`;
}

export interface FontSizeOption {
  /** CSS size value, e.g. "1rem". */
  value: string;
  label: string;
}

export const FONT_SIZE_UNITS = ["px", "rem", "em", "%", "pt", "pc", "vw", "vh", "vmin", "vmax", "ch", "ex"] as const;

export type FontSizeUnit = (typeof FONT_SIZE_UNITS)[number];

/** Builds a set of size options for a unit (common magnitudes). */
export function sizeOptionsForUnit(unit: FontSizeUnit): FontSizeOption[] {
  const magnitudes: Record<FontSizeUnit, number[]> = {
    px: [8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96],
    rem: [0.5, 0.625, 0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5, 4, 4.5, 5, 6],
    em: [0.5, 0.625, 0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5, 4, 5, 6],
    "%": [50, 62.5, 75, 87.5, 100, 112.5, 125, 150, 175, 200, 250, 300, 350, 400, 500],
    pt: [6, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48],
    pc: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5],
    vw: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15],
    vh: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15],
    vmin: [1, 2, 3, 4, 5, 6, 8, 10, 12],
    vmax: [1, 2, 3, 4, 5, 6, 8, 10, 12],
    ch: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20],
    ex: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20],
  };
  const values = magnitudes[unit] ?? [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
  return values.map((n) => ({
    value: `${n}${unit}`,
    label: `${n}${unit}`,
  }));
}

/** Parses a CSS size (e.g. "1.25rem") into { amount, unit }. */
export function parseCssSize(value: string): { amount: string; unit: string } {
  const match = value.trim().match(/^(-?[\d.]+)([a-z%]+)$/i);
  if (!match) return { amount: value.trim(), unit: "" };
  return { amount: match[1], unit: match[2].toLowerCase() };
}
