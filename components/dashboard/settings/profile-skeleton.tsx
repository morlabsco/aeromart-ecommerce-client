import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-56 mt-2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-3 w-56" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="space-y-2">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
