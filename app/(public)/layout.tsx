import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { CartSidebar } from "../../components/shared/cart-sidebar";
import { getSettings } from "@/lib/services/settings";
import { getSession } from "@/lib/get-session";
import { unwrapData } from "@/lib/services/api-client";
import type { NavbarLink, SettingsBrand, SettingsFooter } from "@/lib/types/backend";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const [settingsResult, session] = await Promise.all([
    getSettings(),
    getSession(),
  ]);
  const settings = unwrapData(settingsResult);
  const groups = settings?.navbar?.groups;

  // Navbar rule: main links first, then role-based links.
  // Logged out -> auth group; logged in -> customer group (customer) or
  // admin group (admin). The public group is skipped for now.
  const links: NavbarLink[] = [
    ...(settings?.navbar?.links ?? []),
    ...(session.isAuthenticated
      ? session.isAdmin
        ? groups?.admin ?? []
        : groups?.customer ?? []
      : groups?.auth ?? []),
  ].filter((l) => l?.label && l?.url);

  const brand = settings?.brand;
  const footer = settings?.footer;

  return (
    <div>
      <Header brand={brand ?? null} navLinks={links} />
      {children}
      <Footer brand={brand ?? null} footer={footer ?? null} />
      <CartSidebar />
    </div>
  );
};

export default Layout;
