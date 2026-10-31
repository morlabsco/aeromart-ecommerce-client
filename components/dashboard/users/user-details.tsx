import Link from "next/link";
import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import type { User } from "@/lib/types/backend";

interface UserDetailsProps {
    user: User;
    /** True when the admin is viewing their OWN profile. */
    isSelf?: boolean;
    /** Role of the viewer (drives the back link base). */
    selfRole?: string;
}

/** Client boundary for the inline role switcher. */
import { RoleSelectControl } from "./role-select-control";

export function UserDetails({ user, isSelf = false, selfRole = "admin" }: UserDetailsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">User details</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        render={
                            <Link
                                href={
                                    selfRole === "manager"
                                        ? "/dashboard/manager"
                                        : "/dashboard/admin/users"
                                }
                            />
                        }
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button render={<Link href={`/dashboard/admin/users/update-user/${user._id}`} />} className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        Update
                    </Button>
                </div>
            </div>

            {isSelf && (
                <div className="flex items-start gap-3 rounded-xl border border-info/40 bg-info/10 p-4">
                    <Info className="mt-0.5 size-5 shrink-0 text-info" />
                    <div>
                        <p className="text-sm font-bold text-foreground">
                            This is your own profile
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            Role and status controls are locked here — your
                            admin role is managed directly in the database,
                            and deactivating yourself would lock you out.
                            Edit your details from the{" "}
                            <Link
                                href={
                                    selfRole === "manager"
                                        ? "/dashboard/manager/profile"
                                        : "/dashboard/admin/profile"
                                }
                                className="font-semibold text-brand hover:underline"
                            >
                                profile page
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Overview</CardTitle>
                    <CardDescription>User information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        {user.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={user.photoUrl}
                                alt={user.name}
                                className="h-14 w-14 shrink-0 rounded-full bg-muted object-cover"
                            />
                        ) : (
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                            {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                        </div>
                        )}
                        <div>
                            <p className="text-lg font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Role</p>
                            <div className="mt-1">
                                <RoleSelectControl user={user} />
                            </div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge
                                variant={user.isActive ? "secondary" : "destructive"}
                                className="mt-1 text-xs"
                            >
                                {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Last Login</p>
                            <p className="text-sm font-medium mt-1">
                                {user.lastLogin
                                    ? new Date(user.lastLogin).toLocaleDateString()
                                    : "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Joined</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
