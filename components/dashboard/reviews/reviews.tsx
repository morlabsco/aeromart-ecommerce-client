"use client";

import { useMemo } from "react";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Star, Flag, CheckCircle2, MessageSquare, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Review } from "@/lib/types/backend";

function Stars({ value }: { value: number }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        "h-3.5 w-3.5",
                        i < Math.round(value)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                    )}
                />
            ))}
        </span>
    );
}

interface ReviewsTableProps {
    reviews: Review[];
}

export function ReviewsTable({ reviews }: ReviewsTableProps) {
    const totalCount = reviews.length;
    const flaggedCount = reviews.filter((r) => r.isFlagged).length;
    const verifiedCount = reviews.filter((r) => r.isVerifiedPurchase).length;
    const avgRating =
        totalCount > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
            : 0;

    const stats = [
        {
            label: "Total Reviews",
            value: totalCount,
            icon: MessageSquare,
            trend: `${flaggedCount} flagged`,
            up: flaggedCount === 0,
        },
        {
            label: "Flagged",
            value: flaggedCount,
            icon: Flag,
            trend: "Needs review",
            up: flaggedCount === 0,
        },
        {
            label: "Verified",
            value: verifiedCount,
            icon: CheckCircle2,
            trend: "Verified purchases",
            up: true,
        },
        {
            label: "Avg Rating",
            value: avgRating > 0 ? avgRating.toFixed(1) : "—",
            icon: Star,
            trend: "Across all reviews",
            up: avgRating >= 3,
        },
    ];

    const columns: ColumnDef<Review>[] = useMemo(
        () => [
            {
                accessorKey: "product.name",
                header: "Product",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium text-sm">
                        {row.original.product?.name ?? "—"}
                    </span>
                ),
            },
            {
                accessorKey: "user.name",
                header: "Customer",
                cell: ({ row }) => (
                    <div>
                        <p className="text-sm">{row.original.user?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.user?.email}
                        </p>
                    </div>
                ),
            },
            {
                accessorKey: "rating",
                header: "Rating",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="inline-flex items-center gap-2">
                        <Stars value={row.original.rating} />
                        <span className="text-xs text-muted-foreground">
                            {row.original.rating}
                        </span>
                    </span>
                ),
            },
            {
                accessorKey: "description",
                header: "Review",
                cell: ({ row }) => (
                    <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
                        {row.original.description}
                    </span>
                ),
            },
            {
                id: "badges",
                header: "Status",
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1.5">
                        {row.original.isVerifiedPurchase && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Verified
                            </Badge>
                        )}
                        {row.original.isFlagged ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                Flagged
                            </Badge>
                        ) : (
                            <Badge variant="outline">Active</Badge>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "createdAt",
                header: "Date",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {new Date(row.original.createdAt).toLocaleDateString()}
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
                            aria-label="View review"
                            render={
                                <a
                                    href={`/dashboard/admin/reviews/${row.original._id}`}
                                />
                            }
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Reviews
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {reviews.length} reviews · {flaggedCount} flagged ·{" "}
                        {verifiedCount} verified
                    </p>
                </div>
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
                data={reviews}
                searchPlaceholder="Search reviews..."
            />
        </div>
    );
}
