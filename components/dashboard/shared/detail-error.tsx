import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DetailErrorProps {
    message: string;
    backHref: string;
}

/** Friendly error state shown on detail pages when the API call fails. */
export function DetailError({ message, backHref }: DetailErrorProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="inline-flex p-3 rounded-full bg-destructive/10 mb-4">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold">Something went wrong</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">{message}</p>
                <Button variant="outline" className="mt-6" render={<Link href={backHref} />}>
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </Button>
            </CardContent>
        </Card>
    );
}
