import { DashboardShell } from "@/components/dashboard/v4/shell";
import { getSession } from "@/lib/get-session";
import { getSettings } from "@/lib/services/settings";
import { getMyProfile } from "@/lib/services/user";
import { unwrapData } from "@/lib/services/api-client";

/* Dashboard v4 foundation — renders inside the usual storefront chrome
 * (header + footer, from the (public) group). The Nittonova dashboard
 * reference: a big padded, centered container holding the two rounded
 * panels — charcoal sidebar + quick-view/content section.
 *
 * v4 stage 1 (foundation only): overview, newsletter and profile ship in
 * the new design; the previous dashboard's feature pages are parked under
 * "_parked" folders and return one by one after the design is verified. */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [session, profileResult, settingsResult] = await Promise.all([
        getSession(),
        getMyProfile(),
        getSettings(),
    ]);
    const profile = unwrapData(profileResult);
    const brand = unwrapData(settingsResult)?.brand ?? null;

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
                <DashboardShell user={user} brand={brand}>
                    {children}
                </DashboardShell>
            </div>
        </div>
    );
}
