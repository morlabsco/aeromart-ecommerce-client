import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
    return (
        <main className="space-y-16 lg:space-y-24">
            <div className="relative h-[70vh] min-h-[480px] w-full">
                <Skeleton className="h-full w-full rounded-none" />
            </div>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Skeleton className="h-9 w-56 mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-72 rounded-2xl" />
                    ))}
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Skeleton className="h-9 w-56 mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))}
                </div>
            </div>
        </main>
    );
}
