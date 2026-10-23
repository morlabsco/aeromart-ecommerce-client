import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import type { Brand } from "@/lib/types/backend";

interface BrandDetailsProps {
    brand: Brand;
}

export function BrandDetails({ brand }: BrandDetailsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{brand.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Brand details
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" render={<Link href="/dashboard/admin/brands" />} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button render={<Link href={`/dashboard/admin/brands/update-brand/${brand._id}`} />} className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        Update
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Overview</CardTitle>
                    <CardDescription>Brand information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden flex items-center justify-center text-lg font-bold text-muted-foreground">
                            {brand.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={brand.logo}
                                    alt={brand.name}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                brand.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{brand.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{brand._id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge
                                variant={brand.isActive ? "secondary" : "destructive"}
                                className="mt-1 text-xs"
                            >
                                {brand.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Created By</p>
                            <p className="text-sm font-medium mt-1">
                                {brand.createdBy && typeof brand.createdBy === "object"
                                    ? brand.createdBy.name
                                    : "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(brand.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Last Updated</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(brand.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
