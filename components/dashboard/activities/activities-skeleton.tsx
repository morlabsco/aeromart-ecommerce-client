import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ActivitiesSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-56 mt-2" />
                </div>
                <Skeleton className="h-9 w-44" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-5 w-24 rounded-full" />
                            </div>
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-9 w-24 ml-auto" />
                </div>
                <div className="rounded-lg border overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 p-4 border-b last:border-0"
                        >
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-4 flex-1 max-w-[360px]" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-28 ml-auto" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-4 w-40" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}
