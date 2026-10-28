import { PublicShell } from "../../components/layout/public-shell";

const Layout = async ({ children }: { children: React.ReactNode }) => (
  <PublicShell>{children}</PublicShell>
);

export default Layout;
