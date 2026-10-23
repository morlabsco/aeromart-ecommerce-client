import { NotFoundPage } from "@/components/shared/not-found-page";

export default function DashboardNotFound() {
    return (
        <NotFoundPage
            title="Page not found"
            message="We couldn't find that page in your dashboard. It may have been moved or no longer exists."
            backHref="/dashboard"
            backLabel="Back to Dashboard"
        />
    );
}
