"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import {
    Activity as ActivityIcon,
    CalendarRange,
    Eye,
    Loader2,
    Trash2,
    Trash,
    TrendingUp,
    TrendingDown,
    History,
    FileText,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";
import type { ApiMeta, Activity, ActivityModule, ActivityType } from "@/lib/types/backend";
import { clearActivities, clearSingleActivity } from "@/lib/services/activity";
import { isErrorResult } from "@/lib/utils/result";

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

interface ActivitiesTableProps {
    activities: Activity[];
    meta?: ApiMeta;
}

export function ActivitiesTable({ activities, meta }: ActivitiesTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [confirmSingle, setConfirmSingle] = useState<Activity | null>(null);
    const [confirmBulk, setConfirmBulk] = useState<"range" | "all" | null>(null);
    const [rangeOpen, setRangeOpen] = useState(false);
    const [range, setRange] = useState<DateRange | undefined>(undefined);

    const typeCounts = activities.reduce(
        (acc, a) => {
            acc[a.type] = (acc[a.type] ?? 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );
    const createCount = typeCounts.create ?? 0;
    const updateCount = typeCounts.update ?? 0;
    const deleteCount = typeCounts.delete ?? 0;

    const stats = [
        {
            label: "Total Activities",
            value: meta?.total ?? activities.length,
            icon: ActivityIcon,
            trend: "All modules",
            up: true,
        },
        {
            label: "Creates",
            value: createCount,
            icon: FileText,
            trend: "create events",
            up: true,
        },
        {
            label: "Updates",
            value: updateCount,
            icon: TrendingUp,
            trend: "update/status events",
            up: updateCount >= 0,
        },
        {
            label: "Deletes",
            value: deleteCount,
            icon: TrendingDown,
            trend: "delete events",
            up: deleteCount === 0,
        },
    ];

    const columns: ColumnDef<Activity>[] = useMemo(
        () => [
            {
                accessorKey: "module",
                header: "Module",
                enableSorting: true,
                cell: ({ row }) => (
                    <span
                        className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                            MODULE_BADGE[row.original.module] ??
                                "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                    >
                        {row.original.module}
                    </span>
                ),
            },
            {
                accessorKey: "type",
                header: "Type",
                enableSorting: true,
                cell: ({ row }) => (
                    <span
                        className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                            TYPE_BADGE[row.original.type] ??
                                "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                    >
                        {row.original.type}
                    </span>
                ),
            },
            {
                accessorKey: "message",
                header: "Message",
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="text-sm line-clamp-1 max-w-[360px]">
                        {row.original.message}
                    </span>
                ),
            },
            {
                accessorKey: "reference",
                header: "Reference",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground">
                        {row.original.reference || "—"}
                    </span>
                ),
            },
            {
                accessorKey: "createdAt",
                header: "Date",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {new Date(row.original.createdAt).toLocaleString()}
                    </span>
                ),
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={`View activity ${row.original._id}`}
                            render={<a href={`/dashboard/admin/activities/${row.original._id}`} />}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmSingle(row.original)}
                            aria-label={`Clear activity ${row.original._id}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    const confirmClearSingle = () => {
        if (!confirmSingle) return;
        startTransition(async () => {
            const result = await clearSingleActivity(confirmSingle._id);
            setConfirmSingle(null);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(result.message ?? "Activity cleared");
            router.refresh();
        });
    };

    const confirmClearRange = () => {
        const from = range?.from;
        const to = range?.to;
        if (!from || !to) return;
        startTransition(async () => {
            // Inclusive range: to date is end-of-day.
            const endOfDay = new Date(to);
            endOfDay.setHours(23, 59, 59, 999);
            const result = await clearActivities({
                from: from.toISOString(),
                to: endOfDay.toISOString(),
            });
            setConfirmBulk(null);
            setRangeOpen(false);
            setRange(undefined);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(
                result.data?.deletedCount
                    ? `${result.data.deletedCount} activities cleared`
                    : "Activities cleared"
            );
            router.refresh();
        });
    };

    const confirmClearAll = () => {
        startTransition(async () => {
            const result = await clearActivities({ clearAll: true });
            setConfirmBulk(null);
            setRangeOpen(false);
            setRange(undefined);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(
                result.data?.deletedCount
                    ? `${result.data.deletedCount} activities cleared`
                    : "All activities cleared"
            );
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Activities</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Platform audit log
                    </p>
                </div>
                <Popover open={rangeOpen} onOpenChange={setRangeOpen}>
                    <PopoverTrigger
                        render={
                            <Button variant="outline" className="gap-2" />
                        }
                    >
                        <CalendarRange className="h-4 w-4" />
                        Clear by Date Range
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-0">
                        <div className="p-3 border-b">
                            <p className="text-sm font-medium">Clear activities</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Select a date range to delete, or clear everything.
                            </p>
                        </div>
                        <Calendar
                            mode="range"
                            selected={range}
                            onSelect={(next) => setRange(next ?? undefined)}
                            numberOfMonths={1}
                            className="rounded-md"
                        />
                        <div className="flex items-center justify-between gap-2 p-3 border-t">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1.5"
                                disabled={isPending}
                                onClick={() => {
                                    setRangeOpen(false);
                                    setConfirmBulk("all");
                                }}
                            >
                                <Trash className="h-3.5 w-3.5" />
                                Clear All
                            </Button>
                            <Button
                                size="sm"
                                className="gap-1.5"
                                disabled={isPending || !range?.from || !range.to}
                                onClick={() => {
                                    setRangeOpen(false);
                                    setConfirmBulk("range");
                                }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear Range
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="inline-flex p-1.5 rounded-lg bg-primary/10">
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <Badge
                                        variant={stat.up ? "secondary" : "destructive"}
                                        className="gap-0.5 text-[10px]"
                                    >
                                        {stat.up ? (
                                            <TrendingUp className="h-2.5 w-2.5" />
                                        ) : (
                                            <TrendingDown className="h-2.5 w-2.5" />
                                        )}
                                        {stat.trend}
                                    </Badge>
                                </div>
                                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {stat.label}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <DashboardDataTable
                columns={columns}
                data={activities}
                searchKey="message"
                searchPlaceholder="Search activities..."
                pageSize={10}
            />

            <AlertDialog open={!!confirmSingle} onOpenChange={(open) => !open && setConfirmSingle(null)}>
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
                            onClick={confirmClearSingle}
                            disabled={isPending}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                            {isPending ? "Clearing..." : "Clear Activity"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={confirmBulk !== null}
                onOpenChange={(open) => !open && setConfirmBulk(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmBulk === "all" ? "Clear All Activities" : "Clear Activities in Range"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmBulk === "all" ? (
                                <>Are you sure you want to clear <span className="font-medium">all</span> activity records? This permanently removes the entire audit log.</>
                            ) : (
                                <>Are you sure you want to clear the activities recorded between{" "}
                                <span className="font-medium">
                                    {range?.from?.toLocaleDateString()}
                                </span>{" "}
                                and{" "}
                                <span className="font-medium">
                                    {range?.to?.toLocaleDateString()}
                                </span>
                                ? This cannot be undone.</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBulk === "all" ? confirmClearAll : confirmClearRange}
                            disabled={isPending}
                            className="bg-red-100 text-primary hover:bg-red-200"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Clearing...
                                </>
                            ) : (
                                "Yes, Clear"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
                <History className="h-3.5 w-3.5" />
                Activities are recorded automatically by the backend service layer.
            </div>
        </div>
    );
}
