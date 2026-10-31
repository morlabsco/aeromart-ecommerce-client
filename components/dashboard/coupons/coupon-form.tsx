"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createCoupon } from "@/lib/services/coupon";
import { parseLocalDate, toLocalDateString } from "@/lib/utils/date";
import { isErrorResult } from "@/lib/utils/result";
import { serverErrorMessage } from "@/lib/utils/form-feedback";
import { CouponProductPicker } from "@/components/dashboard/coupons/coupon-product-picker";

const couponSchema = z
    .object({
        code: z.string().min(1, { message: "Coupon code is required." }),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.coerce
            .number()
            .positive({ message: "Discount must be positive." }),
        minOrderAmount: z.coerce.number().min(0).optional(),
        maxDiscountAmount: z.coerce.number().min(0).optional(),
        startDate: z.string().min(1, { message: "Start date is required." }),
        endDate: z.string().min(1, { message: "End date is required." }),
        isActive: z.boolean(),
    })
    .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
        message: "End date must be after start date.",
        path: ["endDate"],
    });

type CouponFormInput = z.input<typeof couponSchema>;
type CouponFormValues = z.output<typeof couponSchema>;

export function CreateCouponForm() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    // Product scope — empty = whole order.
    const [applicableProducts, setApplicableProducts] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm<CouponFormInput, unknown, CouponFormValues>({
        resolver: zodResolver(couponSchema),
        defaultValues: {
            code: "",
            discountType: "percentage",
            discountValue: 0,
            minOrderAmount: 0,
            maxDiscountAmount: 0,
            startDate: "",
            endDate: "",
            isActive: true,
        },
    });

    const isActive = watch("isActive");
    const discountType = watch("discountType");
    const startDate = watch("startDate");
    const endDate = watch("endDate");

    const onSubmit = handleSubmit(async (values: CouponFormValues) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const result = await createCoupon({
                code: values.code,
                discountType: values.discountType,
                discountValue: values.discountValue,
                minOrderAmount: values.minOrderAmount || 0,
                maxDiscountAmount: values.maxDiscountAmount || 0,
                applicableProducts,
                startDate: values.startDate,
                endDate: values.endDate,
                isActive: values.isActive,
            });

            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }

            toast.success(result.message ?? "Coupon created successfully");
            // Reset so the form is ready for another entry.
            reset();
            router.push("/dashboard/admin/coupons/all-coupons");
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Coupon</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Create a discount coupon for customers
                </p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="text-base">Coupon Details</CardTitle>
                    <CardDescription>
                        Codes are stored uppercase and are case-insensitive.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4" noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="code">Code</Label>
                            <Input
                                id="code"
                                placeholder="SAVE20"
                                {...register("code")}
                                aria-invalid={!!errors.code}
                            />
                            {errors.code && (
                                <p className="text-[11px] font-medium text-destructive">
                                    {errors.code.message}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select
                                    value={discountType}
                                    onValueChange={(value) =>
                                        setValue(
                                            "discountType",
                                            (value ?? "percentage") as "percentage" | "fixed"
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed ($)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discountValue">
                                    Discount {discountType === "percentage" ? "(%)" : "($)"}
                                </Label>
                                <Input
                                    id="discountValue"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register("discountValue")}
                                    aria-invalid={!!errors.discountValue}
                                />
                                {errors.discountValue && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {errors.discountValue.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minOrderAmount">Min Order Amount ($)</Label>
                                <Input
                                    id="minOrderAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register("minOrderAmount")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxDiscountAmount">Max Discount ($)</Label>
                                <Input
                                    id="maxDiscountAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register("maxDiscountAmount")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger
                                        render={
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start gap-2 font-normal",
                                                    !startDate && "text-muted-foreground"
                                                )}
                                            />
                                        }
                                    >
                                        <CalendarIcon className="h-4 w-4" />
                                        {startDate
                                            ? parseLocalDate(startDate).toLocaleDateString()
                                            : "Pick a date"}
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={startDate ? parseLocalDate(startDate) : undefined}
                                            onSelect={(date) =>
                                                setValue(
                                                    "startDate",
                                                    date ? toLocalDateString(date) : ""
                                                )
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.startDate && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {errors.startDate.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover>
                                    <PopoverTrigger
                                        render={
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start gap-2 font-normal",
                                                    !endDate && "text-muted-foreground"
                                                )}
                                            />
                                        }
                                    >
                                        <CalendarIcon className="h-4 w-4" />
                                        {endDate
                                            ? parseLocalDate(endDate).toLocaleDateString()
                                            : "Pick a date"}
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={endDate ? parseLocalDate(endDate) : undefined}
                                            onSelect={(date) =>
                                                setValue(
                                                    "endDate",
                                                    date ? toLocalDateString(date) : ""
                                                )
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.endDate && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {errors.endDate.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <CouponProductPicker
                            selected={applicableProducts}
                            onChange={setApplicableProducts}
                        />

                        <div className="flex items-center justify-between py-1.5">
                            <div>
                                <Label htmlFor="isActive" className="cursor-pointer">
                                    Active
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Inactive coupons cannot be applied.
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={(value) => setValue("isActive", value)}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Ticket className="mr-2 h-4 w-4" />
                                        Create Coupon
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
