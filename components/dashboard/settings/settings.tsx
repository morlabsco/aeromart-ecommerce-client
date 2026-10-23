"use client";

import { Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Settings page is being rebuilt around a dynamic Settings/Design module on
 * the backend (theme, banner, website sections). All previous static features
 * were removed per docs/v8/01.md Works 2.
 */
export function DashboardSettingsContent() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Configure your store design and sections
                </p>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                        <Settings2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        Dynamic settings for theme, banner and website sections
                        will be available here shortly.
                    </p>
                    <Badge variant="outline" className="mt-4">
                        In Progress
                    </Badge>
                </CardContent>
            </Card>
        </div>
    );
}
