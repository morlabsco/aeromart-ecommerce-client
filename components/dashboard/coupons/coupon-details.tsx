import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import type { Coupon } from "@/lib/types/backend";

interface CouponDetailsProps {
    coupon: Coupon;
}

export function CouponDetails({ coupon }: CouponDetailsProps) {
    const expired = new Date(coupon.endDate) < new Date();

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{coupon.code}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Coupon details
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" render={<Link href="/dashboard/admin/coupons" />} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button render={<Link href={`/dashboard/admin/coupons/update-coupon/${coupon._id}`} />} className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        Update
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Overview</CardTitle>
                    <CardDescription>Coupon information</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Code</p>
                            <p className="text-sm font-medium mt-1 font-mono">{coupon.code}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Type</p>
                            <Badge variant="outline" className="mt-1 text-xs capitalize">
                                {coupon.discountType}
                            </Badge>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Discount</p>
                            <p className="text-sm font-medium mt-1">
                                {coupon.discountType === "percentage"
                                    ? `${coupon.discountValue}%`
                                    : `$${coupon.discountValue.toFixed(2)}`}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Min Order</p>
                            <p className="text-sm font-medium mt-1">
                                ${coupon.minOrderAmount.toFixed(2)}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Max Discount</p>
                            <p className="text-sm font-medium mt-1">
                                ${coupon.maxDiscountAmount.toFixed(2)}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Applies To</p>
                            <p className="text-sm font-medium mt-1">
                                {coupon.applicableProducts && coupon.applicableProducts.length > 0
                                    ? `${coupon.applicableProducts.length} selected product${coupon.applicableProducts.length === 1 ? "" : "s"} only`
                                    : "The whole order"}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <div className="flex gap-2 mt-1">
                                <Badge
                                    variant={coupon.isActive ? "secondary" : "destructive"}
                                    className="text-xs"
                                >
                                    {coupon.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {expired && (
                                    <Badge variant="outline" className="text-xs">
                                        Expired
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Start Date</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(coupon.startDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">End Date</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(coupon.endDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(coupon.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
