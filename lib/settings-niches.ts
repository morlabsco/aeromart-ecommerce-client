// Niche presets supported by the Settings module (docs §15.4).

export interface NicheOption {
  value: string;
  label: string;
}

export const NICHE_OPTIONS: NicheOption[] = [
  { value: "clothing", label: "Clothing" },
  { value: "perfume_oil", label: "Perfume Oil" },
  { value: "eyewear", label: "Eyewear" },
  { value: "shoes", label: "Shoes" },
  { value: "watches", label: "Watches" },
  { value: "electronics", label: "Electronics" },
  { value: "pet_animal", label: "Pet & Animal" },
  { value: "furniture", label: "Furniture" },
  { value: "cosmetics", label: "Cosmetics" },
  { value: "sports", label: "Sports" },
  { value: "jewelry", label: "Jewelry" },
];

export const NICHE_LABELS: Record<string, string> = Object.fromEntries(
  NICHE_OPTIONS.map((n) => [n.value, n.label])
);
