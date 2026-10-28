import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { CartSidebar } from "../../components/shared/cart-sidebar";
import { ChatWidget } from "../../components/shared/chat-widget";
import { getSettings } from "@/lib/services/settings";
import { getAllCategories } from "@/lib/services/category";
import { getSession } from "@/lib/get-session";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import type { NavbarLink, SettingsBrand, SettingsContact, SettingsFooter } from "@/lib/types/backend";

const link = (label: string, url: string): NavbarLink => ({
  label,
  url,
  order: 0,
  children: [],
});

const Layout = async ({ children }: { children: React.ReactNode }) => {
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

  const brand: SettingsBrand | null = settings?.brand ?? null;
  const footer: SettingsFooter | null = settings?.footer ?? null;
  const contact: SettingsContact | null = settings?.contact ?? null;
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
};

export default Layout;
