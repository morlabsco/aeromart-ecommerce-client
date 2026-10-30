import { DashboardShell } from "@/components/dashboard/v4/shell";
import { getSession } from "@/lib/get-session";
import { getMyProfile } from "@/lib/services/user";
import { unwrapData } from "@/lib/services/api-client";

/* Dashboard v4 foundation — renders inside the usual storefront chrome
 * (header + footer, from the (public) group). The Nittonova dashboard
 * reference: a big padded, centered container holding the two rounded
 * panels — charcoal sidebar + quick-view/content section. */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [session, profileResult] = await Promise.all([
        getSession(),
        getMyProfile(),
    ]);
    const profile = unwrapData(profileResult);

    // Merge the profile's photo into the session user so the sidebar avatar
    // resolves on load (the JWT payload does not carry photoUrl).
    const user = session.user
        ? {
              name: session.user.name,
              email: session.user.email ?? profile?.email ?? "",
              role: session.user.role,
              photoUrl: profile?.photoUrl ?? null,
          }
        : null;

    return (
        <div className="bg-background py-8 sm:py-10 lg:py-14">
            <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
                <DashboardShell user={user}>
                    {children}
                </DashboardShell>
            </div>
        </div>
    );
}
