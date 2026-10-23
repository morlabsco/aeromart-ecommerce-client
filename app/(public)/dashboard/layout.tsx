import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/get-session";
import { getSettings } from "@/lib/services/settings";
import { getMyProfile } from "@/lib/services/user";
import { unwrapData } from "@/lib/services/api-client";

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
    const sessionWithPhoto = session.user
        ? {
              ...session,
              user: {
                  ...session.user,
                  photoUrl: profile?.photoUrl ?? null,
              },
          }
        : session;

    return (
        <div className="bg-hero-surface">
            <SidebarProvider
                className="mx-auto w-full max-w-[1920px] border-x **:data-[slot=sidebar-container]:relative!"
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar
                    variant="sidebar"
                    session={sessionWithPhoto}
                    brand={brand}
                />
                <SidebarInset className="bg-transparent">
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                                {children}
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
