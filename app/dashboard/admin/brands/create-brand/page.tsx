// Create brand, SSR page shell hosting the client-side multipart form (CSR).

import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateBrandForm } from "@/components/dashboard/brands/brand-form";
import { FormSkeleton } from "@/components/dashboard/shared/form-skeleton";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/brands/create-brand");
  }

export default function CreateBrandPage() {
    return (
        <Suspense fallback={<FormSkeleton />}>
            <CreateBrandForm />
        </Suspense>
    );
}
