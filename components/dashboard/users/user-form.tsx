"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/services/user";
import { isErrorResult } from "@/lib/utils/result";

const userSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Enter a valid email." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type UserFormValues = z.infer<typeof userSchema>;

export function CreateUserForm() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const onSubmit = handleSubmit(async (values: UserFormValues) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const result = await registerUser({
                ...values,
                role: "customer",
            });

            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message ?? "User created successfully");
            // Reset so the form is ready for another entry.
            reset();
            router.push("/dashboard/admin/users/all-users");
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Create User</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Register a new customer account
                </p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="text-base">Account Details</CardTitle>
                    <CardDescription>
                        The new user will be able to log in with these credentials.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4" noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Rahim Uddin"
                                {...register("name")}
                                aria-invalid={!!errors.name}
                            />
                            {errors.name && (
                                <p className="text-[11px] font-medium text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="rahimuddin@example.com"
                                {...register("email")}
                                aria-invalid={!!errors.email}
                            />
                            {errors.email && (
                                <p className="text-[11px] font-medium text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register("password")}
                                aria-invalid={!!errors.password}
                            />
                            {errors.password && (
                                <p className="text-[11px] font-medium text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create User
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
