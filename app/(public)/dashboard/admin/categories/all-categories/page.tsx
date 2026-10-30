// All categories list, SSR page using the category module (getAllCategories).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllCategories } from "@/lib/services/category";
import { unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { CategoriesTable } from "@/components/dashboard/categories/categories";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/categories/all-categories");
  }

async function AllCategoriesContent() {
    const result = await getAllCategories({ limit: 200, sort: "-createdAt" });
    const categories = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;

    return <CategoriesTable categories={categories} meta={meta} />;
}

export default function AllCategoriesPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <AllCategoriesContent />
        </Suspense>
    );
}
