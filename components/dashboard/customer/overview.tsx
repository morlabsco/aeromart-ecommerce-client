"use client";

import { useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Mail,
    Phone,
    CalendarDays,
    ShoppingCart,
    UserCog,
    MapPin,
    Package,
    DollarSign,
    Clock,
    CheckCircle2,
    Eye,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import type { Order, User } from "@/lib/types/backend";

interface CustomerOverviewProps {
    profile: User | null;
    orders: Order[];
    /** Fallback currency for money display (brand currency). */
    brandCurrency?: string;
}

const statusStyles: Record<string, string> = {
    Completed:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Shipped:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Processing:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Pending:
        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    Cancelled:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function initials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export function CustomerOverview({ profile, orders, brandCurrency = "usd" }: CustomerOverviewProps) {
    const currency = brandCurrency;
    const stats = useMemo(() => {
        const totalOrders = orders.length;
        const paid = orders.filter(
            (o) => o.paymentStatus === "Paid" && o.status !== "Cancelled"
        );
        const totalSpent = paid.reduce((sum, o) => sum + o.finalAmount, 0);
        const pending = orders.filter((o) => o.status === "Pending").length;
        const completed = orders.filter((o) => o.status === "Completed").length;
        return [
            { label: "Total Orders", value: totalOrders, icon: Package },
            {
                label: "Total Spent",
                value: formatCurrency(totalSpent, currency, {
                    minimumFractionDigits: 2,
                }),
                icon: DollarSign,
            },
            { label: "Pending", value: pending, icon: Clock },
            { label: "Completed", value: completed, icon: CheckCircle2 },
        ];
    }, [orders, currency]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">My Account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Your profile and order summary
                </p>
            </div>

            {/* Profile card */}
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center gap-4">
                        <Avatar className="size-14 rounded-full">
                            {profile?.photoUrl ? (
                                <AvatarImage
                                    src={profile.photoUrl}
                                    alt={profile.name}
                                />
                            ) : null}
                            <AvatarFallback className="rounded-full text-lg">
                                {profile?.name ? initials(profile.name) : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">
                                {profile?.name ?? "Welcome"}
                            </CardTitle>
                            <CardDescription>
                                Customer account overview
                            </CardDescription>
                        </div>
                        <Badge
                            variant="secondary"
                            className="ml-auto capitalize"
                        >
                            {profile?.role ?? "customer"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Email
                                </p>
                                <p className="text-sm font-medium truncate">
                                    {profile?.email ?? "—"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Phone
                                </p>
                                <p className="text-sm font-medium truncate">
                                    {profile?.phoneNo || "—"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Address
                                </p>
                                <p className="text-sm font-medium truncate">
                                    {profile?.address || "—"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Member Since
                                </p>
                                <p className="text-sm font-medium">
                                    {profile?.createdAt
                                        ? new Date(profile.createdAt).toLocaleDateString()
                                        : "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Order stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardContent className="p-5">
                                <div className="inline-flex p-1.5 rounded-lg bg-primary/10 mb-2">
                                    <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <p className="text-xl font-bold tabular-nums">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {stat.label}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Recent orders */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Recent Orders</CardTitle>
                        <CardDescription>
                            Your latest orders
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        render={<Link href="/dashboard/customer/orders" />}
                        className="gap-1.5"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        View All
                    </Button>
                </CardHeader>
                <CardContent>
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Package className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground mt-3">
                                No orders yet. When you place an order, it will
                                show up here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {orders.map((order) => (
                                <div
                                    key={order._id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                            {order.orderId ||
                                                order._id.slice(-8)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleDateString()}
                                            {" · "}
                                            {order.products.reduce(
                                                (n, p) => n + p.quantity,
                                                0
                                            )}{" "}
                                            item
                                            {order.products.reduce(
                                                (n, p) => n + p.quantity,
                                                0
                                            ) === 1
                                                ? ""
                                                : "s"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold tabular-nums">
                                            {formatCurrency(order.finalAmount, order.currency ?? currency)}
                                        </span>
                                        <span
                                            className={cn(
                                                "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                                                statusStyles[order.status] ??
                                                    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                            )}
                                        >
                                            {order.status}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            aria-label={`View order ${order.orderId || order._id}`}
                                            render={
                                                <Link
                                                    href={`/dashboard/customer/orders/${order._id}`}
                                                />
                                            }
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            render={
                                <Link href="/dashboard/customer/orders" />
                            }
                            className="gap-2"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            My Orders
                        </Button>
                        <Button
                            variant="outline"
                            render={
                                <Link href="/dashboard/customer/profile" />
                            }
                            className="gap-2"
                        >
                            <UserCog className="h-4 w-4" />
                            Manage Profile
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
