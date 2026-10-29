// Settings module types, docs/v7-backend-usage-guide.md §15 (singleton document).

export interface SettingsDeliveryOption {
  name: string;
  charge: number;
  country?: string;
  isActive: boolean;
}

export interface SettingsBrand {
  name: string;
  tagline: string;
  description: string;
  niche: string;
  nicheLabel: string;
  logo: string;
  favicon: string;
  /** When true, show only the logo (natural aspect, uncropped) — no name text. */
  logoOnly?: boolean;
  /** Active store currency code, e.g. "usd" (single string, per backend §15.2). */
  currency?: string;
  /** Delivery options used by order creation to resolve the charge. */
  deliveryOptions?: SettingsDeliveryOption[];
}

export interface SettingsColorSet {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  foreground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
  ring: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  input: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface SettingsTheme {
  colors: SettingsColorSet;
  dark: { enabled: boolean; colors: Partial<SettingsColorSet> };
  fonts: {
    family: string;
    mono: string;
    sizes: { h1: string; h2: string; h3: string; body: string; small: string };
  };
  radius: string;
  globalCss: string;
}

export interface NavbarLink {
  label: string;
  url: string;
  order: number;
  children: NavbarLink[];
}

export interface NavbarGroups {
  public: NavbarLink[];
  auth: NavbarLink[];
  customer: NavbarLink[];
  admin: NavbarLink[];
}

export interface SettingsNavbar {
  links: NavbarLink[];
  groups: NavbarGroups;
}

export interface HeroSlide {
  image: string;
  headline: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
  order: number;
}

export interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatar: string;
  order: number;
}

export interface SettingsFooterColumnLink {
  label: string;
  url: string;
}

export interface SettingsFooterColumn {
  title: string;
  links: SettingsFooterColumnLink[];
}

export interface SettingsSocialLink {
  platform: string;
  url: string;
}

export interface SettingsFooter {
  description: string;
  columns: SettingsFooterColumn[];
  socialLinks: SettingsSocialLink[];
  copyrightText: string;
  newsletter: { enabled: boolean; heading: string };
}

export interface SettingsContact {
  address: string;
  phone: string;
  email: string;
  hours: string;
  mapEmbedUrl: string;
  social: { twitter: string; instagram: string; facebook: string };
}

export interface SettingsAboutStat {
  label: string;
  value: string;
}

export interface SettingsAbout {
  story: string;
  mission: string;
  image: string;
  stats: SettingsAboutStat[];
}

export interface SettingsLimitedOffer {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  endsAt: string;
}

/**
 * Store-wide SEO (dashboard → Settings → SEO). Every field falls back
 * gracefully when empty: title → brand name, ogImage → first hero slide →
 * brand logo.
 */
export interface SettingsSeo {
  /** Home page meta title — keep it the plain brand name for the home page. */
  title: string;
  /** Next.js title pattern for sub-pages, must contain %s, e.g. "%s | Attor". */
  titleTemplate: string;
  /** Meta description used for the search snippet. */
  description: string;
  /** Comma-separated meta keywords. */
  keywords: string;
  /** Social share image (Open Graph / Twitter), recommended 1200×630. */
  ogImage: string;
  /** When true the storefront sends noindex, nofollow. */
  noindex: boolean;
}

export interface Settings {
  _id: string;
  brand: SettingsBrand;
  theme: SettingsTheme;
  hero: { slides: HeroSlide[] };
  testimonials: { heading: string; items: TestimonialItem[] };
  navbar: SettingsNavbar;
  footer: SettingsFooter;
  contact: SettingsContact;
  about: SettingsAbout;
  limitedOffer: SettingsLimitedOffer;
  /** Optional until older settings docs are saved with the SEO section. */
  seo?: SettingsSeo;
  createdAt: string;
  updatedAt: string;
}

export type SettingsSectionKey =
  | "theme"
  | "hero"
  | "testimonials"
  | "navbar"
  | "footer"
  | "contact"
  | "about"
  | "limitedOffer"
  | "seo";
