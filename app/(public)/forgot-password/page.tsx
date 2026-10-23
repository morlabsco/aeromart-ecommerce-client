import type { Metadata } from "next";
import ForgotPassword from "../../../components/auth/forgot-password/forgot-password";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

const Page = () => (
  <div>
    <ForgotPassword />
  </div>
);

export default Page;
