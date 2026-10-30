// Category details, SSR page (view single).
// Backend has no GET /category/:id, so the list is fetched and the category
// is looked up by id.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllCategories } from "@/lib/services/category";
import { unwrapData } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { CategoryDetails } from "@/components/dashboard/categories/category-details";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/categories/[id]");
  }

async function CategoryDetailsContent({ categoryId }: { categoryId: string }) {
    const result = await getAllCategories({ limit: 100 });
    if (isErrorResult(result)) {
        return <DetailError message={result.message} backHref="/dashboard/admin/categories" />;
    }
    const category = unwrapData(result)?.find((c) => c._id === categoryId);
    if (!category) notFound();

    return <CategoryDetails category={category} />;
}

export default async function CategoryDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="detail" />}>
            <CategoryDetailsContent categoryId={id} />
        </Suspense>
    );
}
