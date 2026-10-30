// Activity details, SSR page (view single). Uses GET /activity/:activityId.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getActivityById } from "@/lib/services/activity";
import { isErrorResult } from "@/lib/utils/result";
import { ActivityDetails } from "@/components/dashboard/activities/activity-details";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/activities/[id]");
  }

async function ActivityContent({ activityId }: { activityId: string }) {
    const result = await getActivityById(activityId);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Activity not found!";
        return <DetailError message={message} backHref="/dashboard/admin/activities" />;
    }
    return <ActivityDetails activity={result.data} />;
}

export default async function ActivityPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="detail" />}>
            <ActivityContent activityId={id} />
        </Suspense>
    );
}
