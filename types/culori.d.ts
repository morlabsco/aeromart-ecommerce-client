declare module "culori" {
  export interface Color {
    mode: string;
    alpha?: number;
  }

  export type Converter = <T extends string>(mode: T) => (color: string | Color) => Color;

  export const converter: Converter;
  export function parse(color: string): Color | undefined;
  export function formatHex(color: Color | string): string;
  export function formatRgb(color: Color | string): string;
  export function formatHsl(color: Color | string): string;

  /** WCAG relative luminance of a color. */
  export function wcagLuminance(color: Color | string): number;

  /** WCAG contrast ratio between two colors (1-21). */
  export function wcagContrast(a: Color | string, b: Color | string): number;
}
