// Create user, SSR page shell hosting the client-side form (CSR).
// Registration uses the public POST /user/register endpoint.

import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateUserForm } from "@/components/dashboard/users/user-form";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/users/create-user");
  }

export default function CreateUserPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <CreateUserForm />
        </Suspense>
    );
}
