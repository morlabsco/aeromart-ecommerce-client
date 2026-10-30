// Create category, SSR page shell hosting the client-side multipart form (CSR).
// Categories are fetched server-side to populate the parent select.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllCategories } from "@/lib/services/category";
import { unwrapList } from "@/lib/services/api-client";
import { CreateCategoryForm } from "@/components/dashboard/categories/category-form";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/categories/create-category");
  }

async function CreateCategoryContent() {
    const result = await getAllCategories({ limit: 100 });
    const categories = unwrapList(result);

    return <CreateCategoryForm categories={categories} />;
}

export default function CreateCategoryPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <CreateCategoryContent />
        </Suspense>
    );
}
