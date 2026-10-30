// Create brand, SSR page shell hosting the client-side multipart form (CSR).

import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateBrandForm } from "@/components/dashboard/brands/brand-form";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/brands/create-brand");
  }

export default function CreateBrandPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <CreateBrandForm />
        </Suspense>
    );
}
