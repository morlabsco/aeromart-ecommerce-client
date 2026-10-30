"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toggleUserStatus } from "@/lib/services/user";
import { isErrorResult } from "@/lib/utils/result";
import type { User } from "@/lib/types/backend";
import { serverErrorMessage } from "@/lib/utils/form-feedback";

interface UpdateUserFormProps {
    user: User;
}

export function UpdateUserForm({ user }: UpdateUserFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [isActive, setIsActive] = useState(user.isActive);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const result = await toggleUserStatus(user._id);

            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }

            toast.success(result.message ?? "User status updated successfully");
            router.push(`/dashboard/admin/users/${user._id}`);
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Update User</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    {user.name}, manage account status
                </p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="text-base">Account Status</CardTitle>
                    <CardDescription>
                        Toggling off deactivates the user account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="flex items-center justify-between py-1.5">
                            <div>
                                <Label htmlFor="isActive" className="cursor-pointer">
                                    Active
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isActive
                                        ? "This account is currently active."
                                        : "This account is currently inactive."}
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Users className="mr-2 h-4 w-4" />
                                        Update Status
                                    </>
                                )}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
