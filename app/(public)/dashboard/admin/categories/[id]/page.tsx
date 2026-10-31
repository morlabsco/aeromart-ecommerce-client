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
import { getSession } from "@/lib/get-session";
import { dashboardBaseFor } from "@/lib/utils/dashboard-base";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/categories/[id]");
  }

async function CategoryDetailsContent({ categoryId }: { categoryId: string }) {
    const [result, session] = await Promise.all([
        getAllCategories({ limit: 100 }),
        getSession(),
    ]);
    // Shared with /dashboard/manager — the session role picks the base.
    const base = dashboardBaseFor(session.user?.role);
    if (isErrorResult(result)) {
        return (
            <DetailError
                message={result.message}
                backHref={`${base}/categories/all-categories`}
            />
        );
    }
    const category = unwrapData(result)?.find((c) => c._id === categoryId);
    if (!category) notFound();

    return <CategoryDetails category={category} base={base} />;
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
