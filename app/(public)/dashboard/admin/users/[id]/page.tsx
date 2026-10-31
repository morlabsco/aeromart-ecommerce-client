// User details, SSR page (view single).
// Backend has no GET /user/:id, so the list is fetched and the user is
// looked up by id.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getUserById } from "@/lib/services/user";
import { getSession } from "@/lib/get-session";
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
    const [result, session] = await Promise.all([
        getUserById(userId),
        getSession(),
    ]);
    if (isErrorResult(result)) {
        return <DetailError message={result.message} backHref="/dashboard/admin/users" />;
    }
    const user = result.data;
    if (!user) notFound();

    return (
        <UserDetails
            user={user}
            isSelf={session.user?.userId === userId}
            selfRole={session.user?.role ?? "admin"}
        />
    );
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
