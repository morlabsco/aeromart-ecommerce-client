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

  // Public nav: core routes, the top 3 categories, and the return & refund
  // policy. Signed-in user links live in the header account menu instead.
  const links: NavbarLink[] = [
    link("Home", "/"),
    link("Products", "/products"),
    ...categories.slice(0, 3).map((c) => link(c.name, `/products?category=${c.slug}`)),
    link("Track Order", "/track-order"),
    link("Return & Refund Policy", "/return-refund-policy"),
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
