// User details, SSR page (view single).
// Backend has no GET /user/:id, so the list is fetched and the user is
// looked up by id.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllUsers } from "@/lib/services/user";
import { unwrapData } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { UserDetails } from "@/components/dashboard/users/user-details";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/users/[id]");
  }

async function UserDetailsContent({ userId }: { userId: string }) {
    const result = await getAllUsers({ limit: 100 });
    if (isErrorResult(result)) {
        return <DetailError message={result.message} backHref="/dashboard/admin/users" />;
    }
    const user = unwrapData(result)?.find((u) => u._id === userId);
    if (!user) notFound();

    return <UserDetails user={user} />;
}

export default async function UserDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="detail" />}>
            <UserDetailsContent userId={id} />
        </Suspense>
    );
}
