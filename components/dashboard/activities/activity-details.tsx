"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Trash2, History } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { clearSingleActivity } from "@/lib/services/activity";
import { isErrorResult } from "@/lib/utils/result";
import type { Activity, ActivityModule, ActivityType } from "@/lib/types/backend";

const MODULE_BADGE: Record<string, string> = {
    Order: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Product: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Brand: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    Category: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    User: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Coupon: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Review: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    Settings: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Payment: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

const TYPE_BADGE: Record<string, string> = {
    create: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    update: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    status: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    preset: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

interface ActivityDetailsProps {
    activity: Activity;
}

export function ActivityDetails({ activity }: ActivityDetailsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [confirmClear, setConfirmClear] = useState(false);

    const handleClear = () => {
        startTransition(async () => {
            const result = await clearSingleActivity(activity._id);
            setConfirmClear(false);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(result.message ?? "Activity cleared");
            router.push("/dashboard/admin/activities");
            router.refresh();
        });
    };

    const metadata = activity.metadata ?? {};

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Activity</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Audit log entry
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" render={<Link href="/dashboard/admin/activities" />} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button variant="destructive" onClick={() => setConfirmClear(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Activity
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{activity.message}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Module</p>
                            <span
                                className={cn(
                                    "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                    MODULE_BADGE[activity.module] ??
                                        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                )}
                            >
                                {activity.module}
                            </span>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Type</p>
                            <span
                                className={cn(
                                    "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                    TYPE_BADGE[activity.type] ??
                                        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                )}
                            >
                                {activity.type}
                            </span>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Reference</p>
                            <p className="text-sm font-mono font-medium mt-1">
                                {activity.reference || "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Reference ID</p>
                            <p className="text-sm font-mono font-medium mt-1 break-all">
                                {activity.referenceId || "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Performed By</p>
                            <p className="text-sm font-medium mt-1">
                                {activity.performedBy || "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Recorded At</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(activity.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {Object.keys(metadata).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                                <tbody>
                                    {Object.entries(metadata).map(([key, value]) => (
                                        <tr key={key} className="border-b last:border-0">
                                            <td className="px-4 py-2.5 font-medium text-muted-foreground w-1/3 align-top">
                                                {key}
                                            </td>
                                            <td className="px-4 py-2.5 break-all font-mono text-xs">
                                                {typeof value === "object"
                                                    ? JSON.stringify(value)
                                                    : String(value)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                This entry was recorded automatically by the backend.
            </div>

            <AlertDialog open={confirmClear} onOpenChange={(open) => !open && setConfirmClear(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Activity</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to clear this activity record?
                            This removes it from the audit log permanently.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClear}
                            disabled={isPending}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Clearing...
                                </>
                            ) : (
                                "Clear Activity"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
