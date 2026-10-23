// Update user, SSR page. Fetches the user (via list lookup) and renders a
// status toggle form.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllUsers } from "@/lib/services/user";
import { unwrapData } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { UpdateUserForm } from "@/components/dashboard/users/update-user-form";
import { FormSkeleton } from "@/components/dashboard/shared/form-skeleton";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/users/update-user/[id]");
  }

async function UpdateUserContent({ userId }: { userId: string }) {
    const result = await getAllUsers({ limit: 100 });
    if (isErrorResult(result)) {
        return <DetailError message={result.message} backHref="/dashboard/admin/users" />;
    }
    const user = unwrapData(result)?.find((u) => u._id === userId);
    if (!user) notFound();

    return <UpdateUserForm user={user} />;
}

export default async function UpdateUserPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<FormSkeleton />}>
            <UpdateUserContent userId={id} />
        </Suspense>
    );
}
