// Create user, SSR page shell hosting the client-side form (CSR).
// Registration uses the public POST /user/register endpoint.

import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateUserForm } from "@/components/dashboard/users/user-form";
import { FormSkeleton } from "@/components/dashboard/shared/form-skeleton";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/users/create-user");
  }

export default function CreateUserPage() {
    return (
        <Suspense fallback={<FormSkeleton />}>
            <CreateUserForm />
        </Suspense>
    );
}
