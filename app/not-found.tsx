import { NotFoundPage } from "@/components/shared/not-found-page";
import { PublicShell } from "@/components/layout/public-shell";

// Root 404 (unmatched URLs render under the ROOT layout, which has no site
// chrome) — wrapped in the shared PublicShell so it presents the same
// header/footer frame as every other public page.
export default async function RootNotFound() {
    return (
        <PublicShell>
            <NotFoundPage
                title="Page not found"
                message="We couldn't find the page you're looking for. It may have been moved or no longer exists."
                backHref="/"
                backLabel="Return to Home"
            />
        </PublicShell>
    );
}
