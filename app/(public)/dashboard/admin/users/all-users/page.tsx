// Users list, SSR page using the user module (getAllUsers).
// Data is fetched server-side with tag-based caching and streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllUsers } from "@/lib/services/user";
import { unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { UsersTable } from "@/components/dashboard/users/users";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/users/all-users");
  }

async function UsersContent() {
    const result = await getAllUsers({ limit: 10, sort: "-createdAt" });
    const users = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;

    return <UsersTable users={users} meta={meta} />;
}

export default function AllUsersPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <UsersContent />
        </Suspense>
    );
}
