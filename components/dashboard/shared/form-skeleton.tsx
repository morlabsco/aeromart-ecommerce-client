import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function FormSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
            </div>
            <Card>
                <CardContent className="p-6 space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
