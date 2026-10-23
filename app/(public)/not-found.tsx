import { NotFoundPage } from "@/components/shared/not-found-page";

export default function PublicNotFound() {
    return (
        <NotFoundPage
            title="Page not found"
            message="We couldn't find the page you're looking for. It may have been moved or no longer exists."
            backHref="/"
            backLabel="Back to Home"
        />
    );
}
