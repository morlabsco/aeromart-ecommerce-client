import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CouponDetailsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-56 mt-2" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="rounded-lg border p-4 space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
