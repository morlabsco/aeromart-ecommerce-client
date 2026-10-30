// Activities, SSR page listing the platform audit log (GET /activity).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllActivities } from "@/lib/services/activity";
import { isErrorResult } from "@/lib/utils/result";
import { ActivitiesTable } from "@/components/dashboard/activities/activities";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/activities");
  }

async function ActivitiesContent() {
    const result = await getAllActivities({ limit: 200, sort: "-createdAt" });
    if (isErrorResult(result)) {
        return <DetailError message={result.message} backHref="/dashboard/admin" />;
    }
    return <ActivitiesTable activities={result.data} meta={result.meta} />;
}

export default function ActivitiesPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <ActivitiesContent />
        </Suspense>
    );
}
