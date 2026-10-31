"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { TableLink } from "@/components/dashboard/shared/table-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Eye, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiMeta, User } from "@/lib/types/backend";
import { toggleUserStatus } from "@/lib/services/user";
import { isErrorResult } from "@/lib/utils/result";
import { InstantStatusSelect } from "@/components/dashboard/shared/instant-status-select";

interface UsersTableProps {
    users: User[];
    meta?: ApiMeta;
}

export function UsersTable({ users, meta }: UsersTableProps) {
    const router = useRouter();
    const activeUsers = users.filter((u) => u.isActive).length;
    const adminUsers = users.filter((u) => u.role === "admin").length;
    const customerUsers = users.filter((u) => u.role === "customer").length;

    const stats = [
        {
            label: "Total Users",
            value: meta?.total ?? users.length,
            icon: Users,
            trend: `${activeUsers} active`,
            up: activeUsers / (users.length || 1) > 0.5,
        },
        {
            label: "Active Users",
            value: activeUsers,
            icon: Users,
            trend: `${((activeUsers / (users.length || 1)) * 100).toFixed(0)}% of total`,
            up: activeUsers / (users.length || 1) > 0.5,
        },
        {
            label: "Admins",
            value: adminUsers,
            icon: Users,
            trend: "Admin accounts",
            up: true,
        },
        {
            label: "Customers",
            value: customerUsers,
            icon: Users,
            trend: "Customer accounts",
            up: true,
        },
    ];

    const columns: ColumnDef<User>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Name",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {row.original.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                            <TableLink href={`/dashboard/admin/users/${row.original._id}`} className="text-sm">
                                {row.original.name}
                            </TableLink>
                            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "role",
                header: "Role",
                enableSorting: true,
                cell: ({ row }) => (
                    <Badge
                        variant={row.original.role === "admin" ? "secondary" : "outline"}
                        className="text-xs capitalize"
                    >
                        {row.original.role}
                    </Badge>
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
                        onUpdate={async () => {
                            const result = await toggleUserStatus(row.original._id);
                            return isErrorResult(result)
                                ? result
                                : { message: result.message };
                        }}
                        onSuccess={() => router.refresh()}
                    />
                ),
            },
            {
                accessorKey: "lastLogin",
                header: "Last Login",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.lastLogin
                            ? new Date(row.original.lastLogin).toLocaleDateString()
                            : "—"}
                    </span>
                ),
            },
            {
                accessorKey: "createdAt",
                header: "Joined",
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`View ${row.original.name}`} render={<a href={`/dashboard/admin/users/${row.original._id}`} />}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`Update ${row.original.name}`} render={<a href={`/dashboard/admin/users/update-user/${row.original._id}`} />}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and manage registered users
                    </p>
                </div>
                <Button render={<a href="/dashboard/admin/users/create-user" />}>
                    Create User
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
                data={users}
                searchKey="name"
                searchPlaceholder="Search by name or email..."
                pageSize={8}
            />
        </div>
    );
}
