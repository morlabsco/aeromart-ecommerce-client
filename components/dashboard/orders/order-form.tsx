"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createOrder } from "@/lib/services/order";
import { PHONE_ERROR_MESSAGE, PHONE_REGEX } from "@/lib/utils/phone";
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency";
import { isErrorResult } from "@/lib/utils/result";
import type {
    Coupon,
    PaymentMethod,
    Product,
    SettingsDeliveryOption,
} from "@/lib/types/backend";

const orderSchema = z.object({
    recipientName: z.string().min(2, { message: "Recipient name is required." }),
    phoneNo: z
        .string()
        .regex(PHONE_REGEX, { message: PHONE_ERROR_MESSAGE }),
    shippingAddress: z.string().min(5, { message: "Shipping address is required." }),
    notes: z.string().optional(),
    deliveryOptionName: z
        .string()
        .min(1, { message: "Delivery option is required." }),
});

type OrderFormInput = z.input<typeof orderSchema>;
type OrderFormValues = z.output<typeof orderSchema>;

interface CreateOrderFormProps {
    products: Product[];
    coupons?: Coupon[];
    /** Fallback currency for price display (brand currency). */
    brandCurrency?: string;
    /** Delivery options from the store's brand settings (backend resolves the charge). */
    deliveryOptions?: SettingsDeliveryOption[];
}

interface OrderLine {
    productId: string;
    variantSku?: string;
    quantity: number;
    unitPrice: number;
}

export function CreateOrderForm({
    products,
    coupons = [],
    brandCurrency = "usd",
    deliveryOptions = [],
}: CreateOrderFormProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [submitting, setSubmitting] = useState(false);
    const [lines, setLines] = useState<OrderLine[]>([]);
    const [coupon, setCoupon] = useState("");
    const [couponMode, setCouponMode] = useState<"select" | "custom">("select");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
    const isCustomer = pathname.startsWith("/dashboard/customer");

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<OrderFormInput, unknown, OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            recipientName: "",
            phoneNo: "",
            shippingAddress: "",
            notes: "",
            deliveryOptionName: "",
        },
    });

    const deliveryOptionName = watch("deliveryOptionName") || "";

    const activeDelivery = deliveryOptions.find(
        (d) => d.name === deliveryOptionName
    );
    const deliveryCharge = activeDelivery?.charge ?? 0;

    const productOf = (line: OrderLine) =>
        products.find((p) => p._id === line.productId);

    const variantOf = (line: OrderLine) => {
        const product = productOf(line);
        if (!product || !line.variantSku) return undefined;
        return product.variants?.find((v) => v.sku === line.variantSku);
    };

    /** Base unit price before offer (variant price overrides product price). */
    const baseUnitPrice = (line: OrderLine) => {
        const product = productOf(line);
        if (!product) return 0;
        const variant = variantOf(line);
        return variant?.price ?? product.price;
    };

    /** Effective unit price after an active product offer (guide §8 pricing). */
    const effectiveUnitPrice = (line: OrderLine) => {
        const product = productOf(line);
        if (!product) return 0;
        const base = baseUnitPrice(line);
        const sale = getOfferPrice(base, product.offerPrice ?? null);
        return sale !== null && sale < base ? sale : base;
    };

    const hasOfferOnLine = (line: OrderLine) => {
        const product = productOf(line);
        if (!product) return false;
        const base = baseUnitPrice(line);
        const sale = getOfferPrice(base, product.offerPrice ?? null);
        return sale !== null && sale < base;
    };

    /** Max orderable quantity for a line (variant stock if variant chosen, else product stock). */
    const maxStockOf = (line: OrderLine) => {
        const product = productOf(line);
        if (!product) return 0;
        if (product.hasVariants) {
            const variant = variantOf(line);
            return variant ? variant.stock : 0;
        }
        return product.stock;
    };

    const addLine = () => {
        const first = products[0];
        if (!first) return;
        setLines((prev) => [
            ...prev,
            { productId: first._id, quantity: 1, unitPrice: first.price },
        ]);
    };

    const updateLine = (index: number, updates: Partial<OrderLine>) => {
        setLines((prev) =>
            prev.map((line, i) => {
                if (i !== index) return line;
                const next = { ...line, ...updates };
                if (updates.productId) {
                    const product = products.find(
                        (p) => p._id === updates.productId
                    );
                    if (product) {
                        // Store the base price; offers are applied on display.
                        next.unitPrice = product.price;
                        // Changing product resets any chosen variant.
                        next.variantSku = undefined;
                        next.quantity = 1;
                    }
                }
                if (updates.variantSku) {
                    const product = products.find(
                        (p) => p._id === next.productId
                    );
                    const variant = product?.variants?.find(
                        (v) => v.sku === updates.variantSku
                    );
                    if (variant) {
                        next.unitPrice = variant.price ?? product?.price ?? 0;
                        next.quantity = 1;
                    }
                }
                return next;
            })
        );
    };

    const changeQuantity = (index: number, value: number) => {
        setLines((prev) =>
            prev.map((line, i) => {
                if (i !== index) return line;
                const max = maxStockOf(line);
                const clamped = Math.min(Math.max(1, value), Math.max(1, max));
                return { ...line, quantity: clamped };
            })
        );
    };

    const removeLine = (index: number) => {
        setLines((prev) => prev.filter((_, i) => i !== index));
    };

    const selectedCoupon = coupons.find((c) => c.code === coupon) ?? null;

    /** Sum of original (base) prices before any offer/coupon. */
    const baseSubtotal = lines.reduce(
        (sum, line) => sum + baseUnitPrice(line) * line.quantity,
        0
    );
    /** Effective price after product offers (what the backend charges). */
    const subtotal = lines.reduce(
        (sum, line) => sum + effectiveUnitPrice(line) * line.quantity,
        0
    );
    /** Savings from active product offers. */
    const offerDiscount = baseSubtotal - subtotal;

    /** Coupon discount per guide §12: percentage of subtotal, capped by maxDiscountAmount. */
    const couponDiscount = (() => {
        if (!selectedCoupon || subtotal <= 0) return 0;
        const raw =
            selectedCoupon.discountType === "percentage"
                ? (subtotal * selectedCoupon.discountValue) / 100
                : selectedCoupon.discountValue;
        return Math.min(
            Math.max(0, raw),
            selectedCoupon.maxDiscountAmount > 0
                ? selectedCoupon.maxDiscountAmount
                : raw
        );
    })();

    /** Amount the customer actually pays (offer-adjusted, minus coupon). */
    const finalSubtotal = Math.max(0, subtotal - couponDiscount);

    const onSubmit = handleSubmit(async (values: OrderFormValues) => {
        if (submitting) return;
        if (lines.length === 0) {
            toast.error("Add at least one product to the order.");
            return;
        }
        // Guard: variant products need a variant selected; stock must not exceed.
        for (const line of lines) {
            const product = productOf(line);
            if (!product) {
                toast.error("A selected product is no longer available.");
                return;
            }
            if (product.hasVariants && !line.variantSku) {
                toast.error(
                    `"${product.name}" has variants, select a variant first.`
                );
                return;
            }
            const max = maxStockOf(line);
            if (line.quantity > max) {
                toast.error(
                    `Only ${max} in stock for ${product.name}${
                        line.variantSku ? ` (${line.variantSku})` : ""
                    }.`
                );
                return;
            }
        }

        setSubmitting(true);
        try {
            const result = await createOrder({
                products: lines.map((line) => ({
                    product: line.productId,
                    quantity: line.quantity,
                    ...(line.variantSku ? { variant: { sku: line.variantSku } } : {}),
                })),
                coupon: coupon || undefined,
                deliveryOptionName: values.deliveryOptionName,
                recipientName: values.recipientName,
                phoneNo: values.phoneNo,
                notes: values.notes || undefined,
                shippingAddress: values.shippingAddress,
                paymentMethod,
            });

            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message ?? "Order created successfully");
            // Reset so the form is ready for another entry.
            reset();
            setLines([]);
            setCoupon("");
            setCouponMode("select");
            setPaymentMethod("COD");
            router.push(
                isCustomer
                    ? "/dashboard/customer/orders/my-orders"
                    : "/dashboard/admin/orders/all-orders"
            );
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Order</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Place a new customer order
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Order Items</CardTitle>
                        <CardDescription>
                            Select products and quantities for this order.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lines.length === 0 && (
                            <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                                No items yet, add a product below.
                            </p>
                        )}

                        {lines.map((line, index) => {
                            const product = productOf(line);
                            const variant = variantOf(line);
                            const maxStock = maxStockOf(line);
                            const isVariantProduct =
                                product?.hasVariants === true;
                            return (
                                <div
                                    key={index}
                                    className="space-y-3 rounded-md border p-3"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                        <div className="flex-1 space-y-2 min-w-0">
                                            <Label>Product</Label>
                                            <Select
                                                value={line.productId}
                                                onValueChange={(value) =>
                                                    updateLine(index, {
                                                        productId: String(
                                                            value ?? ""
                                                        ),
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-full cursor-pointer">
                                                    <SelectValue placeholder="Select product">
                                                        {(value) =>
                                                            products.find(
                                                                (p) =>
                                                                    p._id ===
                                                                    String(value)
                                                            )?.name ??
                                                            (value
                                                                ? String(value)
                                                                : null)
                                                        }
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.length === 0 && (
                                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                            No products available
                                                        </div>
                                                    )}
                                                    {products.map((p) => {
                                                        const sale = getOfferPrice(
                                                            p.price,
                                                            p.offerPrice ??
                                                                null
                                                        );
                                                        const hasOffer =
                                                            sale !== null &&
                                                            sale < p.price;
                                                        return (
                                                            <SelectItem
                                                                key={p._id}
                                                                value={p._id}
                                                                label={p.name}
                                                                className="cursor-pointer"
                                                            >
                                                                {p.name},{" "}
                                                                {hasOffer ? (
                                                                    <>
                                                                        <span className="line-through text-muted-foreground">
                                                                            {formatCurrency(
                                                                                p.price,
                                                                                p.currency ??
                                                                                    brandCurrency
                                                                            )}
                                                                        </span>{" "}
                                                                        {formatCurrency(
                                                                            sale!,
                                                                            p.currency ??
                                                                                brandCurrency
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    formatCurrency(
                                                                        p.price,
                                                                        p.currency ??
                                                                            brandCurrency
                                                                    )
                                                                )}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-full sm:w-24 space-y-2">
                                            <Label htmlFor={`qty-${index}`}>
                                                Qty (max {maxStock})
                                            </Label>
                                            <Input
                                                id={`qty-${index}`}
                                                type="number"
                                                min="1"
                                                max={Math.max(1, maxStock)}
                                                value={line.quantity}
                                                onChange={(e) =>
                                                    changeQuantity(
                                                        index,
                                                        Number(e.target.value)
                                                    )
                                                }
                                            />
                                            {line.quantity >= maxStock && (
                                                <p className="text-[10px] font-medium text-destructive">
                                                    Max stock reached
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right flex items-start justify-between gap-2 sm:block">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-medium tabular-nums pt-0.5">
                                                    {formatCurrency(
                                                        effectiveUnitPrice(
                                                            line
                                                        ) * line.quantity,
                                                        brandCurrency
                                                    )}
                                                </p>
                                                {hasOfferOnLine(line) && (
                                                    <p className="text-xs text-muted-foreground line-through">
                                                        {formatCurrency(
                                                            baseUnitPrice(
                                                                line
                                                            ) * line.quantity,
                                                            brandCurrency
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    removeLine(index)
                                                }
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {hasOfferOnLine(line) && (
                                        <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 px-3 py-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 rounded px-1.5 py-0.5">
                                                Offer
                                            </span>
                                            <p className="text-xs text-green-700 dark:text-green-400">
                                                {formatCurrency(
                                                    baseUnitPrice(line),
                                                    brandCurrency
                                                )}{" "}
                                                →{" "}
                                                {formatCurrency(
                                                    effectiveUnitPrice(line),
                                                    brandCurrency
                                                )}{" "}
                                                per unit
                                            </p>
                                        </div>
                                    )}

                                    {isVariantProduct && (
                                        <div className="space-y-2">
                                            <Label>Variant</Label>
                                            {(product?.variants?.length ?? 0) ===
                                            0 ? (
                                                <p className="text-xs text-muted-foreground border rounded-md px-3 py-2">
                                                    This product has no variants
                                                    defined yet.
                                                </p>
                                            ) : (
                                                <Select
                                                    value={
                                                        line.variantSku ?? ""
                                                    }
                                                    onValueChange={(value) =>
                                                        updateLine(index, {
                                                            variantSku: String(
                                                                value ?? ""
                                                            ),
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="w-full cursor-pointer">
                                                        <SelectValue placeholder="Select a variant">
                                                            {(value) => {
                                                                const v = String(
                                                                    value ?? ""
                                                                );
                                                                const found =
                                                                    product?.variants?.find(
                                                                        (x) =>
                                                                            x.sku ===
                                                                            v
                                                                    );
                                                                if (!found)
                                                                    return v || null;
                                                                const base =
                                                                    found.price ??
                                                                    product.price;
                                                                const sale =
                                                                    getOfferPrice(
                                                                        base,
                                                                        product
                                                                            .offerPrice ??
                                                                            null
                                                                    );
                                                                const hasOffer =
                                                                    sale !==
                                                                        null &&
                                                                    sale < base;
                                                                const priceLabel = hasOffer
                                                                    ? `${formatCurrency(
                                                                          base,
                                                                          brandCurrency
                                                                      )} → ${formatCurrency(
                                                                          sale!,
                                                                          brandCurrency
                                                                      )}`
                                                                    : formatCurrency(
                                                                          base,
                                                                          brandCurrency
                                                                      );
                                                                return `${found.sku}, ${Object.entries(
                                                                    found.attributes ??
                                                                        {}
                                                                )
                                                                    .map(
                                                                        ([
                                                                            k,
                                                                            val,
                                                                        ]) =>
                                                                            `${k}: ${val}`
                                                                    )
                                                                    .join(", ")} · ${priceLabel} (${found.stock} in stock)`;
                                                            }}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {product?.variants?.map(
                                                            (variantItem) => {
                                                                const base =
                                                                    variantItem.price ??
                                                                    product.price;
                                                                const sale =
                                                                    getOfferPrice(
                                                                        base,
                                                                        product
                                                                            .offerPrice ??
                                                                            null
                                                                    );
                                                                const hasOffer =
                                                                    sale !==
                                                                        null &&
                                                                    sale < base;
                                                                return (
                                                                    <SelectItem
                                                                        key={
                                                                            variantItem.sku
                                                                        }
                                                                        value={
                                                                            variantItem.sku
                                                                        }
                                                                        label={
                                                                            variantItem.sku
                                                                        }
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {variantItem.sku}{" "}
                                                                        —{" "}
                                                                        {Object.entries(
                                                                            variantItem.attributes ??
                                                                                {}
                                                                        )
                                                                            .map(
                                                                                ([
                                                                                    k,
                                                                                    val,
                                                                                ]) =>
                                                                                    `${k}: ${val}`
                                                                            )
                                                                            .join(
                                                                                ", "
                                                                            )}{" "}
                                                                        ·{" "}
                                                                        {hasOffer ? (
                                                                            <>
                                                                                <span className="line-through text-muted-foreground">
                                                                                    {formatCurrency(
                                                                                        base,
                                                                                        brandCurrency
                                                                                    )}
                                                                                </span>{" "}
                                                                                {formatCurrency(
                                                                                    sale!,
                                                                                    brandCurrency
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            formatCurrency(
                                                                                base,
                                                                                brandCurrency
                                                                            )
                                                                        )}{" "}
                                                                        (
                                                                        {variantItem.stock}{" "}
                                                                        in stock)
                                                                    </SelectItem>
                                                                );
                                                            }
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    )}

                                    {variant && (
                                        <p className="text-xs text-muted-foreground">
                                            Unit price:{" "}
                                            {hasOfferOnLine(line) ? (
                                                <>
                                                    <span className="line-through">
                                                        {formatCurrency(
                                                            baseUnitPrice(
                                                                line
                                                            ),
                                                            brandCurrency
                                                        )}
                                                    </span>{" "}
                                                    {formatCurrency(
                                                        effectiveUnitPrice(
                                                            line
                                                        ),
                                                        brandCurrency
                                                    )}
                                                </>
                                            ) : (
                                                formatCurrency(
                                                    baseUnitPrice(line),
                                                    brandCurrency
                                                )
                                            )}{" "}
                                            · Stock: {variant.stock}
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        <Button type="button" variant="outline" onClick={addLine}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>

                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-sm text-muted-foreground">Subtotal</span>
                            <span className="font-semibold tabular-nums">
                                {formatCurrency(subtotal, brandCurrency)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Order Details</CardTitle>
                        <CardDescription>
                            Shipping, payment, and optional coupon.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4" noValidate>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="recipientName">Recipient Name</Label>
                                    <Input
                                        id="recipientName"
                                        placeholder="John Doe"
                                        {...register("recipientName")}
                                        aria-invalid={!!errors.recipientName}
                                    />
                                    {errors.recipientName && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {errors.recipientName.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNo">Phone Number</Label>
                                    <Input
                                        id="phoneNo"
                                        placeholder="+8801712345678"
                                        {...register("phoneNo")}
                                        aria-invalid={!!errors.phoneNo}
                                    />
                                    {errors.phoneNo && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {errors.phoneNo.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="shippingAddress">Shipping Address</Label>
                                <Textarea
                                    id="shippingAddress"
                                    placeholder="123 Main Street, Dhaka"
                                    {...register("shippingAddress")}
                                    aria-invalid={!!errors.shippingAddress}
                                />
                                {errors.shippingAddress && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {errors.shippingAddress.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deliveryOptionName">
                                        Delivery Option
                                    </Label>
                                    {deliveryOptions.length === 0 ? (
                                        <Input
                                            id="deliveryOptionName"
                                            placeholder="Inside Dhaka"
                                            {...register("deliveryOptionName")}
                                        />
                                    ) : (
                                        <Select
                                            value={deliveryOptionName}
                                            onValueChange={(value) =>
                                                setValue(
                                                    "deliveryOptionName",
                                                    String(value ?? ""),
                                                    { shouldValidate: true }
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full cursor-pointer">
                                                <SelectValue placeholder="Select a delivery option">
                                                    {(value) => {
                                                        const v = String(
                                                            value ?? ""
                                                        );
                                                        const found =
                                                            deliveryOptions.find(
                                                                (d) =>
                                                                    d.name === v
                                                            );
                                                        return found
                                                            ? `${found.name} · ${
                                                                  found.charge ===
                                                                  0
                                                                      ? "Free"
                                                                      : formatCurrency(
                                                                            found.charge,
                                                                            brandCurrency
                                                                        )
                                                              }`
                                                            : v || null;
                                                    }}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {deliveryOptions
                                                    .filter((d) => d.isActive)
                                                    .map((d) => (
                                                        <SelectItem
                                                            key={d.name}
                                                            value={d.name}
                                                            label={d.name}
                                                            className="cursor-pointer"
                                                        >
                                                            {d.name} ·{" "}
                                                            {d.charge === 0
                                                                ? "Free"
                                                                : formatCurrency(
                                                                      d.charge,
                                                                      brandCurrency
                                                                  )}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {errors.deliveryOptionName && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {errors.deliveryOptionName.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select
                                        value={paymentMethod}
                                        onValueChange={(value) =>
                                            setPaymentMethod(
                                                (value ?? "COD") as PaymentMethod
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full cursor-pointer">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="COD">
                                                Cash on Delivery
                                            </SelectItem>
                                            <SelectItem value="Online">
                                                Online
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label>Coupon</Label>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant={couponMode === "select" ? "secondary" : "ghost"}
                                            size="sm"
                                            className="h-7 px-2 text-xs cursor-pointer"
                                            onClick={() => {
                                                setCouponMode("select");
                                                setCoupon("");
                                            }}
                                        >
                                            Select
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={couponMode === "custom" ? "secondary" : "ghost"}
                                            size="sm"
                                            className="h-7 px-2 text-xs cursor-pointer"
                                            onClick={() => {
                                                setCouponMode("custom");
                                                setCoupon("");
                                            }}
                                        >
                                            Custom
                                        </Button>
                                    </div>
                                </div>

                                {couponMode === "select" ? (
                                    coupons.length === 0 ? (
                                        <p className="text-sm text-muted-foreground border rounded-md px-3 py-2.5">
                                            No coupons available
                                        </p>
                                    ) : (
                                        <>
                                            <Select
                                                value={coupon}
                                                onValueChange={(value) =>
                                                    setCoupon(String(value ?? ""))
                                                }
                                            >
                                                <SelectTrigger className="w-full cursor-pointer">
                                                    <SelectValue placeholder="Select a coupon">
                                                        {(value) => {
                                                            const v = String(value ?? "");
                                                            return (
                                                                coupons.find((c) => c.code === v)?.code ??
                                                                (v || null)
                                                            );
                                                        }}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {coupons.map((c) => (
                                                        <SelectItem
                                                            key={c._id}
                                                            value={c.code}
                                                            label={c.code}
                                                            className="cursor-pointer"
                                                        >
                                                            {c.code},{" "}
                                                            {c.discountType === "percentage"
                                                                ? `${c.discountValue}%`
                                                                : `${formatCurrency(c.discountValue, brandCurrency)}`}{" "}
                                                            off
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedCoupon && (
                                                <div className="flex items-center justify-between rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 px-3 py-1.5">
                                                    <p className="text-xs text-green-700 dark:text-green-400">
                                                        Coupon discount (
                                                        {selectedCoupon.code})
                                                    </p>
                                                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 tabular-nums">
                                                        −
                                                        {formatCurrency(
                                                            couponDiscount,
                                                            brandCurrency
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )
                                ) : (
                                    <>
                                        <Input
                                            id="coupon"
                                            placeholder="SAVE20 (optional)"
                                            value={coupon}
                                            onChange={(e) =>
                                                setCoupon(e.target.value)
                                            }
                                        />
                                        {selectedCoupon && (
                                            <div className="flex items-center justify-between rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 px-3 py-1.5">
                                                <p className="text-xs text-green-700 dark:text-green-400">
                                                    Coupon discount (
                                                    {selectedCoupon.code})
                                                </p>
                                                <p className="text-xs font-semibold text-green-700 dark:text-green-400 tabular-nums">
                                                    −
                                                    {formatCurrency(
                                                        couponDiscount,
                                                        brandCurrency
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Please call before delivery"
                                    {...register("notes")}
                                />
                            </div>

                            <div className="space-y-1.5 rounded-md bg-muted/50 px-4 py-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Subtotal
                                    </span>
                                    <span className="font-medium tabular-nums">
                                        {formatCurrency(subtotal, brandCurrency)}
                                    </span>
                                </div>
                                {offerDiscount > 0 && (
                                    <div className="flex items-center justify-between text-sm text-green-700 dark:text-green-400">
                                        <span>Offer discount</span>
                                        <span className="font-medium tabular-nums">
                                            −
                                            {formatCurrency(
                                                offerDiscount,
                                                brandCurrency
                                            )}
                                        </span>
                                    </div>
                                )}
                                {couponDiscount > 0 && (
                                    <div className="flex items-center justify-between text-sm text-green-700 dark:text-green-400">
                                        <span>
                                            Coupon discount ({coupon})
                                        </span>
                                        <span className="font-medium tabular-nums">
                                            −
                                            {formatCurrency(
                                                couponDiscount,
                                                brandCurrency
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between border-t pt-1.5">
                                    <span className="text-sm font-medium">
                                        Total (delivery + tax added
                                        server-side)
                                    </span>
                                    <span className="text-lg font-bold tabular-nums">
                                        {formatCurrency(
                                            finalSubtotal,
                                            brandCurrency
                                        )}
                                    </span>
                                </div>
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
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            Create Order
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
        </div>
    );
}
