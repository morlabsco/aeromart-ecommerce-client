"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Ticket, Trash2, Eye, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiMeta, Coupon } from "@/lib/types/backend";
import { deleteCoupon, updateCoupon } from "@/lib/services/coupon";
import { isErrorResult } from "@/lib/utils/result";
import { InstantStatusSelect } from "@/components/dashboard/shared/instant-status-select";
import { serverErrorMessage } from "@/lib/utils/form-feedback";
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

interface CouponsTableProps {
    coupons: Coupon[];
    meta?: ApiMeta;
}

export function CouponsTable({ coupons, meta }: CouponsTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

    const activeCoupons = coupons.filter((c) => c.isActive).length;
    const percentageCoupons = coupons.filter((c) => c.discountType === "percentage").length;

    const stats = [
        {
            label: "Total Coupons",
            value: meta?.total ?? coupons.length,
            icon: Ticket,
            trend: `${activeCoupons} active`,
            up: activeCoupons / (coupons.length || 1) > 0.5,
        },
        {
            label: "Active",
            value: activeCoupons,
            icon: Ticket,
            trend: `${((activeCoupons / (coupons.length || 1)) * 100).toFixed(0)}% of total`,
            up: activeCoupons / (coupons.length || 1) > 0.5,
        },
        {
            label: "Percentage",
            value: percentageCoupons,
            icon: Ticket,
            trend: "Discount type",
            up: true,
        },
    ];

    const columns: ColumnDef<Coupon>[] = useMemo(
        () => [
            {
                accessorKey: "code",
                header: "Code",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-mono text-sm font-medium">
                        {row.original.code}
                    </span>
                ),
            },
            {
                accessorKey: "discountType",
                header: "Type",
                enableSorting: true,
                cell: ({ row }) => (
                    <Badge variant="outline" className="text-xs capitalize">
                        {row.original.discountType}
                    </Badge>
                ),
            },
            {
                accessorKey: "discountValue",
                header: "Discount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium tabular-nums">
                        {row.original.discountType === "percentage"
                            ? `${row.original.discountValue}%`
                            : `$${row.original.discountValue.toFixed(2)}`}
                    </span>
                ),
            },
            {
                accessorKey: "minOrderAmount",
                header: "Min Order",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm tabular-nums">
                        ${row.original.minOrderAmount.toFixed(2)}
                    </span>
                ),
            },
            {
                accessorKey: "startDate",
                header: "Valid From",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {new Date(row.original.startDate).toLocaleDateString()}
                    </span>
                ),
            },
            {
                accessorKey: "endDate",
                header: "Valid Until",
                enableSorting: true,
                cell: ({ row }) => {
                    const expired = new Date(row.original.endDate) < new Date();
                    return (
                        <span
                            className={
                                expired
                                    ? "text-sm text-destructive"
                                    : "text-sm text-muted-foreground"
                            }
                        >
                            {new Date(row.original.endDate).toLocaleDateString()}
                        </span>
                    );
                },
            },
            {
                accessorKey: "isActive",
                header: "Status",
                enableSorting: true,
                cell: ({ row }) => (
                    <InstantStatusSelect
                        value={row.original.isActive ? "Active" : "Inactive"}
                        options={[
                            { value: "Active", label: "Active" },
                            { value: "Inactive", label: "Inactive" },
                        ]}
                        onUpdate={(next) =>
                            updateCoupon(row.original._id, {
                                isActive: next === "Active",
                            })
                        }
                        onSuccess={() => router.refresh()}
                    />
                ),
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`View ${row.original.code}`} render={<a href={`/dashboard/admin/coupons/${row.original._id}`} />}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`Update ${row.original.code}`} render={<a href={`/dashboard/admin/coupons/update-coupon/${row.original._id}`} />}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setCouponToDelete(row.original)}
                            aria-label={`Delete ${row.original.code}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    const confirmDelete = () => {
        if (!couponToDelete) return;
        startTransition(async () => {
            const result = await deleteCoupon(couponToDelete._id);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                setCouponToDelete(null);
                return;
            }
            toast.success(result.message ?? "Coupon deleted successfully");
            setCouponToDelete(null);
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Coupons</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage discount coupons
                    </p>
                </div>
                <Button render={<a href="/dashboard/admin/coupons/create-coupon" />}>
                    Create Coupon
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                data={coupons}
                searchKey="code"
                searchPlaceholder="Search coupons..."
                pageSize={8}
            />

            <AlertDialog open={!!couponToDelete} onOpenChange={(open) => !open && setCouponToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium">{couponToDelete?.code}</span>?
                            This will soft-delete the coupon.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setCouponToDelete(null)}
                            disabled={isPending}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isPending}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                            {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
