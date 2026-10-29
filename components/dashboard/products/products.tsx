"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, Trash2, Eye, Pencil, ExternalLink } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiMeta, Product } from "@/lib/types/backend";
import { deleteProduct, toggleProductStatus } from "@/lib/services/product";
import { InstantStatusSelect } from "@/components/dashboard/shared/instant-status-select";
import { formatCurrency } from "@/lib/utils/currency";
import { isErrorResult } from "@/lib/utils/result";
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

interface ProductsTableProps {
    products: Product[];
    meta?: ApiMeta;
    /** Fallback currency for legacy products missing a currency code. */
    brandCurrency?: string;
}

export function ProductsTable({ products, meta, brandCurrency = "usd" }: ProductsTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const currency = brandCurrency;

    const activeProducts = products.filter((p) => p.isActive).length;
    const inStockProducts = products.filter((p) => p.stock > 0).length;
    const avgRating = products.length
        ? products.reduce((sum, p) => sum + p.averageRating, 0) / products.length
        : 0;

    const stats = [
        {
            label: "Total Products",
            value: meta?.total ?? products.length,
            icon: Package,
            trend: `${activeProducts} active`,
            up: activeProducts / (products.length || 1) > 0.5,
        },
        {
            label: "In Stock",
            value: inStockProducts,
            icon: Package,
            trend: `${((inStockProducts / (products.length || 1)) * 100).toFixed(0)}% of total`,
            up: inStockProducts / (products.length || 1) > 0.5,
        },
        {
            label: "Avg Price",
            value: formatCurrency(
                products.reduce((sum, p) => sum + p.price, 0) /
                    (products.length || 1),
                products[0]?.currency ?? currency
            ),
            icon: Package,
            trend: `From ${products.length} products`,
            up: true,
        },
        {
            label: "Avg Rating",
            value: avgRating.toFixed(1),
            icon: Package,
            trend: `${products.reduce((sum, p) => sum + p.ratingCount, 0)} reviews`,
            up: avgRating >= 4,
        },
    ];

    const columns: ColumnDef<Product>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Product",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {row.original.imageUrls[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={row.original.imageUrls[0].url}
                                    alt={row.original.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                row.original.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{row.original.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {row.original.slug}
                                {row.original.sku ? ` · ${row.original.sku}` : ""}
                            </p>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "price",
                header: "Price",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium tabular-nums">
                        {formatCurrency(row.original.price, row.original.currency ?? currency)}
                    </span>
                ),
            },
            {
                accessorKey: "category",
                header: "Category",
                enableSorting: true,
                cell: ({ row }) => (
                    <Badge variant="outline" className="text-xs">
                        {row.original.category?.name ?? "—"}
                    </Badge>
                ),
            },
            {
                accessorKey: "brand",
                header: "Brand",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm">{row.original.brand?.name ?? "—"}</span>
                ),
            },
            {
                accessorKey: "stock",
                header: "Stock",
                enableSorting: true,
                cell: ({ row }) => {
                    const stock = row.original.stock;
                    return (
                        <Badge
                            variant={stock > 20 ? "secondary" : stock > 0 ? "outline" : "destructive"}
                            className="text-xs"
                        >
                            {stock > 20 ? "In Stock" : stock > 0 ? "Low Stock" : "Out of Stock"}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "averageRating",
                header: "Rating",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums text-sm">
                        {row.original.averageRating.toFixed(1)} ({row.original.ratingCount})
                    </span>
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
                            toggleProductStatus(
                                row.original._id,
                                next === "Active"
                            )
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`View ${row.original.name}`} render={<a href={`/dashboard/admin/products/${row.original._id}`} />}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`Open ${row.original.name} on storefront`} title="View on storefront" render={<a href={`/products/${row.original.slug}`} target="_blank" rel="noopener noreferrer" />}>
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`Update ${row.original.name}`} render={<a href={`/dashboard/admin/products/update-product/${row.original._id}`} />}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setProductToDelete(row.original)}
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
        if (!productToDelete) return;
        startTransition(async () => {
            const result = await deleteProduct(productToDelete._id);
            if (isErrorResult(result)) {
                toast.error(result.message);
                setProductToDelete(null);
                return;
            }
            toast.success(result.message ?? "Product deleted successfully");
            setProductToDelete(null);
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Products</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your product catalog
                    </p>
                </div>
                <Button render={<a href="/dashboard/admin/products/create-product" />}>
                    Create Product
                </Button>
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
                data={products}
                searchKey="name"
                searchPlaceholder="Search products..."
                pageSize={8}
            />

            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium">{productToDelete?.name}</span>?
                            This will soft-delete the product.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setProductToDelete(null)}
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
