"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActivityModuleBadge, ActivityTypeBadge } from "@/components/shared/activity-badges";
import { getAllActivities } from "@/lib/services/activity";
import { isErrorResult } from "@/lib/utils/result";
import { cn } from "@/lib/utils";
import type { Activity } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Notifications quick view — the topbar bell opens a compact recent-activity
 * panel (last 6 events, who did them, how long ago) instead of bouncing the
 * user to the full activities page; a "View all" link still goes there.
 * Loads on first open only, and refreshes when re-opened after >60s.
 * ------------------------------------------------------------------------- */

const REFRESH_AFTER_MS = 60_000;

function timeAgo(iso: string): string {
    const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
    });
}

export function NotificationsPopover() {
    const [open, setOpen] = useState(false);
    const [activities, setActivities] = useState<Activity[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadedAtRef = useRef(0);

    const load = (force = false) => {
        const fresh = Date.now() - loadedAtRef.current < REFRESH_AFTER_MS;
        if (!force && fresh && activities) return;
        setLoading(true);
        setError(null);
        getAllActivities({ limit: 6, sort: "-createdAt" })
            .then((result) => {
                if (isErrorResult(result)) {
                    setError(result.message ?? "Couldn't load activity");
                    setActivities([]);
                } else {
                    setActivities(result.data ?? []);
                    loadedAtRef.current = Date.now();
                }
            })
            .catch(() => setError("Couldn't load activity"))
            .finally(() => setLoading(false));
    };

    // First open loads; re-opens refresh when the cache is stale.
    useEffect(() => {
        if (open) load(activities === null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <button
                        type="button"
                        aria-label="Notifications"
                        title="Recent activity"
                        className="relative flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    />
                }
            >
                <Bell className="size-4.5" />
                <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 size-2 rounded-full bg-brand ring-2 ring-card"
                />
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={10}
                className="w-[min(24rem,calc(100vw-2rem))] p-0"
            >
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <p className="text-sm font-bold text-foreground">
                        Recent activity
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Last {activities?.length ?? 6}
                    </span>
                </div>

                <div className="max-h-[22rem] overflow-y-auto">
                    {loading && (
                        <div className="space-y-2 px-4 py-4">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-9 animate-pulse rounded-lg bg-muted"
                                    style={{ animationDelay: `${i * 90}ms` }}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm font-medium text-destructive">{error}</p>
                            <button
                                type="button"
                                onClick={() => load(true)}
                                className="mt-2 cursor-pointer text-xs font-semibold text-brand hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {!loading && !error && (activities?.length ?? 0) === 0 && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm font-medium text-foreground">
                                No activity yet
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Store actions will appear here as they happen.
                            </p>
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        (activities ?? []).map((activity) => (
                            <Link
                                key={activity._id}
                                href={`/dashboard/admin/activities/${activity._id}`}
                                onClick={() => setOpen(false)}
                                className="flex items-start gap-3 border-b border-border/40 px-4 py-3 transition-colors last:border-0 hover:bg-muted/50"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
                                        {activity.message}
                                    </span>
                                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        <ActivityTypeBadge type={activity.type} />
                                        <ActivityModuleBadge module={activity.module} />
                                        <span className="text-[11px] text-muted-foreground">
                                            {activity.performedBy
                                                ? activity.performedBy.name
                                                : "System"}
                                            {" · "}
                                            {timeAgo(activity.createdAt)}
                                        </span>
                                    </span>
                                </span>
                            </Link>
                        ))}
                </div>

                <div className="border-t border-border/60 p-2">
                    <Link
                        href="/dashboard/admin/activities"
                        onClick={() => setOpen(false)}
                        className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-brand",
                            "transition-colors hover:bg-brand/10"
                        )}
                    >
                        View all activity
                        <ChevronRight className="size-4" />
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
