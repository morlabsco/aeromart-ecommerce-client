// Customer profile page, SSR page hosting profile update and password change.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getMyProfile } from "@/lib/services/user";
import { unwrapData } from "@/lib/services/api-client";
import { DashboardProfileV4 } from "@/components/dashboard/v4/profile";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/customer/profile");
  }

async function ProfileContent() {
    const result = await getMyProfile();
    const profile = unwrapData(result);

    if (result instanceof Error || !profile) {
        const message =
            result instanceof Error ? result.message : "User not found!";
        return <DetailError message={message} backHref="/dashboard/customer" />;
    }

    return <DashboardProfileV4 profile={profile} />;
}

export default function CustomerProfilePage() {
    return (
        <Suspense fallback={<PageSkeleton variant="detail" />}>
            <ProfileContent />
        </Suspense>
    );
}
