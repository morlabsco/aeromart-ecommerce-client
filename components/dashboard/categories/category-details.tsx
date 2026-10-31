import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import type { Category } from "@/lib/types/backend";

interface CategoryDetailsProps {
    category: Category;
    /** Dashboard URL base (/dashboard/admin or /dashboard/manager) — the
     *  page derives it from the session role; relative "../" hrefs resolve
     *  against the URL directory and land on the role overview instead of
     *  the categories list. */
    base?: string;
}

export function CategoryDetails({
    category,
    base = "/dashboard/admin",
}: CategoryDetailsProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Category details
                    </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Button
                        variant="outline"
                        render={<Link href={`${base}/categories/all-categories`} />}
                        className="flex w-full items-center justify-center gap-2 sm:w-auto"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button
                        render={
                            <Link
                                href={`${base}/categories/update-category/${category._id}`}
                            />
                        }
                        className="flex w-full items-center justify-center gap-2 sm:w-auto"
                    >
                        <Pencil className="h-4 w-4" />
                        Update
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Overview</CardTitle>
                    <CardDescription>Category information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden flex items-center justify-center text-lg font-bold text-muted-foreground">
                            {category.icon ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={category.icon}
                                    alt={category.name}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                category.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{category.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{category.slug}</p>
                        </div>
                    </div>

                    {category.description && (
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Description</p>
                            <p className="text-sm mt-1">{category.description}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Parent</p>
                            <p className="text-sm font-medium mt-1">
                                {category.parent ? category.parent.name : "None (top-level)"}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge
                                variant={category.isActive ? "secondary" : "destructive"}
                                className="mt-1 text-xs"
                            >
                                {category.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(category.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Last Updated</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(category.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
