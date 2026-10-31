import { Footer } from "./footer";
import { Header } from "./header";
import { CartSidebar } from "../shared/cart-sidebar";
import { ChatWidget } from "../shared/chat-widget";
import { getSettings } from "@/lib/services/settings";
import { getAllCategories } from "@/lib/services/category";
import { getSession } from "@/lib/get-session";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import type { NavbarLink } from "@/lib/types/backend";

const link = (label: string, url: string): NavbarLink => ({
  label,
  url,
  order: 0,
  children: [],
});

/**
 * The public storefront chrome — site header (with the live nav), footer,
 * cart sidebar and chat widget. Extracted from the (public) layout so
 * out-of-group boundaries (the ROOT 404, which renders under the root
 * layout only) can present the exact same page frame.
 */
export async function PublicShell({ children }: { children: React.ReactNode }) {
  const [settingsResult, session, categoriesResult] = await Promise.all([
    getSettings(),
    getSession(),
    getAllCategories({ limit: 5 }),
  ]);
  const settings = unwrapData(settingsResult);

  const categories = unwrapList(categoriesResult)
    .slice(0, 5)
    .map((c) => ({ name: c.name, slug: c.slug }));

  // Public nav, in a fixed standard the admin cannot accidentally break:
  //
  //   Home · Products · Special Offers · { top categories, capped } ·
  //   [custom links from Settings , Navbar] · Track Order · Return & Refund Policy
  //
  // The head, tail and category block are ALWAYS present (user decision);
  // the settings navbar section can only ADD custom links between the
  // categories and the tail — never remove the core set. The category cap
  // keeps the charcoal bar from overflowing on narrower desktop widths.
  const MAX_NAV_CATEGORIES = 3;

  const coreLinks: NavbarLink[] = [
    link("Home", "/"),
    link("Products", "/products"),
    link("Special Offers", "/products?offer=true"),
    ...categories
      .slice(0, MAX_NAV_CATEGORIES)
      .map((c) => link(c.name, `/products?category=${c.slug}`)),
    link("Track Order", "/track-order"),
    link("Return & Refund Policy", "/return-refund-policy"),
  ];

  const coreUrls = new Set(coreLinks.map((l) => l.url));
  const seenUrls = new Set<string>();
  const customLinks = [...(settings?.navbar?.links ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter(
      (l) =>
        l?.label &&
        l?.url &&
        !coreUrls.has(l.url) && // can't duplicate the core set
        !seenUrls.has(l.url) && // or itself
        seenUrls.add(l.url),    // track what's been kept
    )
    .map((l) => link(l.label, l.url));

  const tailCount = 2; // Track Order + Return & Refund Policy
  const links: NavbarLink[] = [
    ...coreLinks.slice(0, coreLinks.length - tailCount),
    ...customLinks,
    ...coreLinks.slice(coreLinks.length - tailCount),
  ].filter((l) => l?.label && l?.url);

  const brand = settings?.brand ?? null;
  const footer = settings?.footer ?? null;
  const contact = settings?.contact ?? null;
  const user = session.isAuthenticated ? session.user ?? null : null;

  return (
    <div>
      <Header brand={brand} navLinks={links} user={user} />
      {children}
      <Footer brand={brand} footer={footer} contact={contact} categories={categories} />
      <CartSidebar currency={brand?.currency} />
      <ChatWidget contact={contact} />
    </div>
  );
}
