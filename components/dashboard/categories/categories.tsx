"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Layers, Trash2, Eye, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiMeta, Category } from "@/lib/types/backend";
import { deleteCategory, toggleCategoryStatus } from "@/lib/services/category";
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

interface CategoriesTableProps {
    categories: Category[];
    meta?: ApiMeta;
}

export function CategoriesTable({ categories, meta }: CategoriesTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const activeCategories = categories.filter((c) => c.isActive).length;
    const subCategories = categories.filter((c) => c.parent).length;

    const stats = [
        {
            label: "Total Categories",
            value: meta?.total ?? categories.length,
            icon: Layers,
            trend: `${activeCategories} active`,
            up: activeCategories / (categories.length || 1) > 0.5,
        },
        {
            label: "Active",
            value: activeCategories,
            icon: Layers,
            trend: `${((activeCategories / (categories.length || 1)) * 100).toFixed(0)}% of total`,
            up: activeCategories / (categories.length || 1) > 0.5,
        },
        {
            label: "Subcategories",
            value: subCategories,
            icon: Layers,
            trend: "With a parent",
            up: true,
        },
    ];

    const columns: ColumnDef<Category>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Category",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {row.original.icon ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={row.original.icon}
                                    alt={row.original.name}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                row.original.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{row.original.name}</p>
                            <p className="text-xs text-muted-foreground">{row.original.slug}</p>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "parent",
                header: "Parent",
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.parent ? (
                        <Badge variant="outline" className="text-xs">
                            {row.original.parent.name}
                        </Badge>
                    ) : (
                        <span className="text-sm text-muted-foreground">—</span>
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
                            toggleCategoryStatus(
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`View ${row.original.name}`} render={<a href={`/dashboard/admin/categories/${row.original._id}`} />}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`Update ${row.original.name}`} render={<a href={`/dashboard/admin/categories/update-category/${row.original._id}`} />}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setCategoryToDelete(row.original)}
                            aria-label={`Delete ${row.original.name}`}
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
        if (!categoryToDelete) return;
        startTransition(async () => {
            const result = await deleteCategory(categoryToDelete._id);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                setCategoryToDelete(null);
                return;
            }
            toast.success(result.message ?? "Category deleted successfully");
            setCategoryToDelete(null);
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Organize your product catalog
                    </p>
                </div>
                <Button render={<a href="/dashboard/admin/categories/create-category" />}>
                    Create Category
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
                data={categories}
                searchKey="name"
                searchPlaceholder="Search categories..."
                pageSize={8}
            />

            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium">{categoryToDelete?.name}</span>?
                            This will soft-delete the category.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setCategoryToDelete(null)}
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
