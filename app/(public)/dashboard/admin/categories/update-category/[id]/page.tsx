// Update category, SSR page. Fetches the category (via list lookup) and
// renders a pre-filled update form.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllCategories } from "@/lib/services/category";
import { unwrapData } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { UpdateCategoryForm } from "@/components/dashboard/categories/update-category-form";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/categories/update-category/[id]");
  }

async function UpdateCategoryContent({ categoryId }: { categoryId: string }) {
    const result = await getAllCategories({ limit: 100 });
    if (isErrorResult(result)) {
        return <DetailError message={result.message} backHref="/dashboard/admin/categories" />;
    }
    const categories = unwrapData(result) ?? [];
    const category = categories.find((c) => c._id === categoryId);
    if (!category) notFound();

    return <UpdateCategoryForm category={category} categories={categories} />;
}

export default async function UpdateCategoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <UpdateCategoryContent categoryId={id} />
        </Suspense>
    );
}
