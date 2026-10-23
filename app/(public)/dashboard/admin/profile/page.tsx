// Profile page, SSR page hosting the profile update and password change forms.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getMyProfile } from "@/lib/services/user";
import { unwrapData } from "@/lib/services/api-client";
import { ProfilePageContent } from "@/components/dashboard/settings/profile-content";
import { ProfileSkeleton } from "@/components/dashboard/settings/profile-skeleton";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/profile");
  }

async function ProfileContent() {
    const result = await getMyProfile();
    const profile = unwrapData(result);

    if (result instanceof Error || !profile) {
        const message =
            result instanceof Error ? result.message : "User not found!";
        return <DetailError message={message} backHref="/dashboard/admin" />;
    }

    return <ProfilePageContent profile={profile} />;
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<ProfileSkeleton />}>
            <ProfileContent />
        </Suspense>
    );
}
