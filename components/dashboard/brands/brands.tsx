"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Tags, Trash2, Eye, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiMeta, Brand } from "@/lib/types/backend";
import { deleteBrand, toggleBrandStatus } from "@/lib/services/brand";
import { isErrorResult } from "@/lib/utils/result";
import { InstantStatusSelect } from "@/components/dashboard/shared/instant-status-select";
import { serverErrorMessage } from "@/lib/utils/form-feedback";
import { TableLink } from "@/components/dashboard/shared/table-link";
import { useCanDelete } from "@/components/dashboard/v4/dashboard-user";
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

interface BrandsTableProps {
    brands: Brand[];
    meta?: ApiMeta;
}

export function BrandsTable({ brands, meta }: BrandsTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
    // Deletes are admin-only — managers create/update but never delete.
    const canDelete = useCanDelete();

    const activeBrands = brands.filter((b) => b.isActive).length;

    const stats = [
        {
            label: "Total Brands",
            value: meta?.total ?? brands.length,
            icon: Tags,
            trend: `${activeBrands} active`,
            up: activeBrands / (brands.length || 1) > 0.5,
        },
        {
            label: "Active Brands",
            value: activeBrands,
            icon: Tags,
            trend: `${((activeBrands / (brands.length || 1)) * 100).toFixed(0)}% of total`,
            up: activeBrands / (brands.length || 1) > 0.5,
        },
        {
            label: "Inactive Brands",
            value: brands.length - activeBrands,
            icon: Tags,
            trend: "Soft-deleted",
            up: false,
        },
    ];

    const handleDelete = (brand: Brand) => {
        setBrandToDelete(brand);
    };

    const confirmDelete = () => {
        if (!brandToDelete) return;
        startTransition(async () => {
            const result = await deleteBrand(brandToDelete._id);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                setBrandToDelete(null);
                return;
            }
            toast.success(result.message ?? "Brand deleted successfully");
            setBrandToDelete(null);
            router.refresh();
        });
    };

    const columns: ColumnDef<Brand>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Brand",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {row.original.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={row.original.logo}
                                    alt={row.original.name}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                row.original.name.charAt(0)
                            )}
                        </div>
                        <div className="min-w-0">
                            <TableLink href={`/dashboard/admin/brands/${row.original._id}`} className="text-sm">
                                {row.original.name}
                            </TableLink>
                            <p className="truncate text-xs text-muted-foreground">{row.original._id}</p>
                        </div>
                    </div>
                ),
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
                            toggleBrandStatus(
                                row.original._id,
                                next === "Active"
                            )
                        }
                        onSuccess={() => router.refresh()}
                    />
                ),
            },
            {
                accessorKey: "createdAt",
                header: "Created",
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`View ${row.original.name}`} render={<a href={`/dashboard/admin/brands/${row.original._id}`} />}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`Update ${row.original.name}`} render={<a href={`/dashboard/admin/brands/update-brand/${row.original._id}`} />}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
<Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(row.original)}
                            aria-label={`Delete ${row.original.name}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
                    </div>
                ),
            },
        ],
        [canDelete]
    );

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Brands</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your product brands
                    </p>
                </div>
                <Button render={<a href="/dashboard/admin/brands/create-brand" />}>
                    Create Brand
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
                data={brands}
                searchKey="name"
                searchPlaceholder="Search brands..."
                pageSize={8}
            />

            <AlertDialog open={!!brandToDelete} onOpenChange={(open) => !open && setBrandToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Brand</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium">{brandToDelete?.name}</span>?
                            This will soft-delete the brand.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setBrandToDelete(null)}
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
