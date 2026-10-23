// Users module page, SSR + CSR.
// Uses the user module (getAllUsers). Data is fetched server-side with
// tag-based caching and streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllUsers } from "@/lib/services/user";
import { unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { UsersTable } from "@/components/dashboard/users/users";
import { UsersSkeleton } from "@/components/dashboard/users/users-skeleton";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/users");
  }

async function UsersContent() {
    const result = await getAllUsers({ limit: 10, sort: "-createdAt" });
    const users = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;

    return <UsersTable users={users} meta={meta} />;
}

export default function UsersPage() {
    return (
        <Suspense fallback={<UsersSkeleton />}>
            <UsersContent />
        </Suspense>
    );
}
