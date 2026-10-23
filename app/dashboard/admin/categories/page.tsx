// Categories module page, SSR + CSR.
// Uses the category module (getAllCategories). Data is fetched server-side
// with tag-based caching and streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllCategories } from "@/lib/services/category";
import { unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { CategoriesTable } from "@/components/dashboard/categories/categories";
import { CategoriesSkeleton } from "@/components/dashboard/categories/categories-skeleton";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/categories");
  }

async function CategoriesContent() {
    const result = await getAllCategories({ limit: 10, sort: "-createdAt" });
    const categories = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;

    return <CategoriesTable categories={categories} meta={meta} />;
}

export default function CategoriesPage() {
    return (
        <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesContent />
        </Suspense>
    );
}
