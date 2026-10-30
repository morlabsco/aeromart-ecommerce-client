// Newsletter subscribers manager, SSR page.
// The list intentionally loads up to 300 subscribers in one request so the
// admin's search + export-all stay instant and client-side.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllSubscribers } from "@/lib/services/newsletter";
import { unwrapList } from "@/lib/services/api-client";
import { NewsletterManager } from "@/components/dashboard/v4/newsletter";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/newsletter");
}

async function NewsletterContent() {
    const result = await getAllSubscribers({ limit: 300, sort: "-createdAt" });
    const subscribers = unwrapList(result);

    return <NewsletterManager subscribers={subscribers} />;
}

export default function NewsletterPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <NewsletterContent />
        </Suspense>
    );
}
