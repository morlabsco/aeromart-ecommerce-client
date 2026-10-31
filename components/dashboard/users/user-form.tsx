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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createUserByAdmin } from "@/lib/services/user";
import { isErrorResult } from "@/lib/utils/result";
import { serverErrorMessage } from "@/lib/utils/form-feedback";
import { notifyInvalidFields } from "@/lib/utils/form-feedback";

const userSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Enter a valid email." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    phoneNo: z
        .string()
        .trim()
        .regex(/^$|^[0-9+\-\s]{6,14}$/, "Enter a valid phone number (6–14 digits).")
        .optional(),
    role: z.enum(["customer", "manager", "admin"]),
});

type UserFormValues = z.infer<typeof userSchema>;

const ROLE_HINTS: Record<UserFormValues["role"], string> = {
    customer: "Customers shop and track their own orders.",
    manager:
        "Managers create and update orders, products, offers, categories, brands, coupons and reviews — but never delete. No settings or user management.",
    admin: "Full access: everything, including deletes, settings and users.",
};

export function CreateUserForm() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [role, setRole] = useState<UserFormValues["role"]>("customer");

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: { name: "", email: "", password: "", phoneNo: "", role: "customer" },
    });

    const onInvalid = (invalid: Record<string, { message?: string }>) => {
        notifyInvalidFields(
            Object.keys(invalid),
            { name: "Name", email: "Email", password: "Password", phoneNo: "Phone Number", role: "Role" },
            "create the user",
        );
    };

    const onSubmit = handleSubmit(async (values: UserFormValues) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const result = await createUserByAdmin({
                name: values.name,
                email: values.email,
                password: values.password,
                role: values.role,
                ...(values.phoneNo ? { phoneNo: values.phoneNo } : {}),
            });

            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }

            toast.success(result.message ?? "User created successfully");
            // Reset so the form is ready for another entry.
            reset();
            setRole("customer");
            router.push("/dashboard/admin/users/all-users");
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    }, onInvalid);

    const changeRole = (value: string) => {
        const next = (value || "customer") as UserFormValues["role"];
        setRole(next);
        setValue("role", next, { shouldValidate: true });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Create User</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Add a customer, manager or admin account
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

                        <div className="space-y-2">
                            <Label htmlFor="phoneNo">
                                Phone <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                            <Input
                                id="phoneNo"
                                inputMode="tel"
                                placeholder="01700000000"
                                {...register("phoneNo")}
                                aria-invalid={!!errors.phoneNo}
                            />
                            {errors.phoneNo && (
                                <p className="text-[11px] font-medium text-destructive">
                                    {errors.phoneNo.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={(v) => changeRole(String(v ?? ""))}>
                                <SelectTrigger id="role" className="w-full">
                                    <SelectValue placeholder="Choose a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                {ROLE_HINTS[role]}
                            </p>
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
