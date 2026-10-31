"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
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
import { DistrictCombobox } from "@/components/public/checkout/district-combobox";
import { UpazilaCombobox } from "@/components/public/checkout/upazila-combobox";
import { FormLayoutToggle, type FormLayout } from "@/components/dashboard/shared/form-layout-toggle";
import { cn } from "@/lib/utils";
import { PHONE_ERROR_MESSAGE, PHONE_REGEX } from "@/lib/utils/phone";
import { formatCurrency, getOfferPrice } from "@/lib/utils/currency";
import { isErrorResult } from "@/lib/utils/result";
import { serverErrorMessage } from "@/lib/utils/form-feedback";
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
    const [layout, setLayout] = useState<FormLayout>("two");
    const [district, setDistrict] = useState("");
    const [upazila, setUpazila] = useState("");
    const [pickerQuery, setPickerQuery] = useState("");
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

    /** Adds a product line from the picker (offers apply on display). */
    const addLine = (product: Product) => {
        setLines((prev) => [
            ...prev,
            { productId: product._id, quantity: 1, unitPrice: product.price },
        ]);
    };

    /** Picker results — name, product SKU or any variant SKU match. */
    const pickerResults = (() => {
        const q = pickerQuery.trim().toLowerCase();
        if (q.length < 2) return [];
        return products
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.sku ?? "").toLowerCase().includes(q) ||
                    (p.variants ?? []).some((v) =>
                        v.sku.toLowerCase().includes(q),
                    ),
            )
            .slice(0, 8);
    })();

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
                shippingAddress: [
                    values.shippingAddress,
                    upazila || null,
                    district || null,
                ]
                    .filter(Boolean)
                    .join(", "),
                paymentMethod,
            });

            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }

            toast.success(result.message ?? "Order created successfully");
            // Reset so the form is ready for another entry.
            reset();
            setLines([]);
            setCoupon("");
            setCouponMode("select");
            setPaymentMethod("COD");
            setDistrict("");
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
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Create Order</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Place a new customer order
                    </p>
                </div>
                <FormLayoutToggle value={layout} onChange={setLayout} />
            </div>

            <div
                className={
                    layout === "two"
                        ? "grid grid-cols-1 items-start gap-6 lg:grid-cols-2"
                        : "grid grid-cols-1 gap-6"
                }
            >
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
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                                                {product?.imageUrls?.[0] ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={product.imageUrls[0].url}
                                                        alt={product?.name ?? ""}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    (product?.name ?? "?").charAt(0)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold">
                                                    {product?.name ?? "Unknown product"}
                                                </p>
                                                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                                                    {product?.sku && (
                                                        <span className="font-mono">
                                                            {product.sku}
                                                        </span>
                                                    )}
                                                    <span>
                                                        {isVariantProduct
                                                            ? "Select a variant below"
                                                            : `Stock: ${maxStock}`}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <div className="w-28 space-y-1.5">
                                                <Label htmlFor={`qty-${index}`}>
                                                    Qty
                                                </Label>
                                                <div className="flex h-9 items-center rounded-lg border border-input">
                                                    <button
                                                        type="button"
                                                        aria-label="Decrease quantity"
                                                        onClick={() =>
                                                            changeQuantity(
                                                                index,
                                                                line.quantity - 1,
                                                            )
                                                        }
                                                        className="flex h-full w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                                    >
                                                        <Minus className="size-3.5" />
                                                    </button>
                                                    <input
                                                        id={`qty-${index}`}
                                                        type="number"
                                                        min={1}
                                                        max={Math.max(1, maxStock)}
                                                        value={line.quantity}
                                                        onChange={(e) =>
                                                            changeQuantity(
                                                                index,
                                                                Number(e.target.value),
                                                            )
                                                        }
                                                        aria-label={`Quantity for ${product?.name ?? "item"}`}
                                                        className="h-full min-w-0 flex-1 border-x border-input bg-transparent text-center text-sm tabular-nums outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label="Increase quantity"
                                                        onClick={() =>
                                                            changeQuantity(
                                                                index,
                                                                line.quantity + 1,
                                                            )
                                                        }
                                                        className="flex h-full w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                                    >
                                                        <Plus className="size-3.5" />
                                                    </button>
                                                </div>
                                                {line.quantity >= maxStock && (
                                                    <p className="text-[10px] font-medium text-destructive">
                                                        Max stock reached
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-0.5 text-right">
                                                <p className="text-sm font-semibold tabular-nums">
                                                    {formatCurrency(
                                                        effectiveUnitPrice(line) *
                                                            line.quantity,
                                                        brandCurrency,
                                                    )}
                                                </p>
                                                {hasOfferOnLine(line) && (
                                                    <p className="text-xs text-muted-foreground line-through">
                                                        {formatCurrency(
                                                            baseUnitPrice(line) *
                                                                line.quantity,
                                                            brandCurrency,
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeLine(index)}
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>


                                    {hasOfferOnLine(line) && (
                                        <div className="flex items-center gap-2 rounded-md bg-success/10 border border-success/30 px-3 py-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-success bg-success/20 rounded px-1.5 py-0.5">
                                                Offer
                                            </span>
                                            <p className="text-xs text-success">
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

                        {/* ── Product picker: search by name, SKU or variant SKU ── */}
                        <div className="space-y-2 rounded-lg border border-dashed p-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={pickerQuery}
                                    onChange={(e) => setPickerQuery(e.target.value)}
                                    placeholder="Search products by name or SKU to add…"
                                    className="pl-9"
                                    aria-label="Search products to add"
                                />
                            </div>
                            {pickerQuery.trim().length < 2 ? (
                                <p className="px-1 py-1.5 text-xs text-muted-foreground">
                                    Type at least 2 characters — matches product
                                    names, product SKUs and variant SKUs.
                                </p>
                            ) : pickerResults.length === 0 ? (
                                <p className="px-1 py-1.5 text-xs text-muted-foreground">
                                    No products match “{pickerQuery}”.
                                </p>
                            ) : (
                                <div className="max-h-64 space-y-1 overflow-y-auto">
                                    {pickerResults.map((product) => {
                                        const sale = getOfferPrice(
                                            product.price,
                                            product.offerPrice ?? null,
                                        );
                                        const hasOffer =
                                            sale !== null && sale < product.price;
                                        const outOfStock =
                                            !product.hasVariants &&
                                            product.stock <= 0;
                                        return (
                                            <button
                                                key={product._id}
                                                type="button"
                                                disabled={outOfStock}
                                                onClick={() => {
                                                    addLine(product);
                                                    setPickerQuery("");
                                                }}
                                                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5 text-left transition-colors hover:border-brand/40 hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-xs font-bold text-muted-foreground">
                                                    {product.imageUrls?.[0] ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={product.imageUrls[0].url}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        product.name.charAt(0)
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {product.name}
                                                    </p>
                                                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                                                        {product.sku && (
                                                            <span className="font-mono">
                                                                {product.sku}
                                                            </span>
                                                        )}
                                                        {hasOffer ? (
                                                            <span>
                                                                <span className="line-through">
                                                                    {formatCurrency(product.price, brandCurrency)}
                                                                </span>{" "}
                                                                {formatCurrency(sale!, brandCurrency)}
                                                            </span>
                                                        ) : (
                                                            <span>
                                                                {formatCurrency(product.price, brandCurrency)}
                                                            </span>
                                                        )}
                                                        <span>
                                                            ·{" "}
                                                            {product.hasVariants
                                                                ? `${product.variants?.length ?? 0} variants`
                                                                : outOfStock
                                                                  ? "Out of stock"
                                                                  : `${product.stock} in stock`}
                                                        </span>
                                                    </p>
                                                </div>
                                                <Plus className="h-4 w-4 shrink-0 text-brand" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-sm text-muted-foreground">
                                Subtotal (base)
                            </span>
                            <span className="font-semibold tabular-nums">
                                {formatCurrency(baseSubtotal, brandCurrency)}
                            </span>
                        </div>
                        {offerDiscount > 0 && (
                            <div className="flex items-center justify-between text-sm text-success">
                                <span>Offer discount</span>
                                <span className="font-semibold tabular-nums">
                                    −{formatCurrency(offerDiscount, brandCurrency)}
                                </span>
                            </div>
                        )}
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
                                        placeholder="Rahim Uddin"
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
                                <Label>District</Label>
                                <DistrictCombobox
                                    value={district}
                                    onChange={(next) => {
                                        // A new district invalidates the upazila.
                                        setDistrict(next);
                                        setUpazila("");
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Upazila</Label>
                                <UpazilaCombobox
                                    district={district}
                                    value={upazila}
                                    onChange={setUpazila}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shippingAddress">
                                    Address (road / house / area)
                                </Label>
                                <Input
                                    id="shippingAddress"
                                    placeholder="Road No. 12, House 4, Ambarkhana"
                                    {...register("shippingAddress")}
                                    aria-invalid={!!errors.shippingAddress}
                                />
                                {errors.shippingAddress && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {errors.shippingAddress.message}
                                    </p>
                                )}
                                <p className="text-[11px] text-muted-foreground">
                                    Saved as “Road…, Upazila, District”.
                                </p>
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
                                                <div className="flex items-center justify-between rounded-md bg-success/10 border border-success/30 px-3 py-1.5">
                                                    <p className="text-xs text-success">
                                                        Coupon discount (
                                                        {selectedCoupon.code})
                                                    </p>
                                                    <p className="text-xs font-semibold text-success tabular-nums">
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
                                            <div className="flex items-center justify-between rounded-md bg-success/10 border border-success/30 px-3 py-1.5">
                                                <p className="text-xs text-success">
                                                    Coupon discount (
                                                    {selectedCoupon.code})
                                                </p>
                                                <p className="text-xs font-semibold text-success tabular-nums">
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
                                        Subtotal (base)
                                    </span>
                                    <span className="font-medium tabular-nums">
                                        {formatCurrency(baseSubtotal, brandCurrency)}
                                    </span>
                                </div>
                                {offerDiscount > 0 && (
                                    <div className="flex items-center justify-between text-sm text-success">
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
                                    <div className="flex items-center justify-between text-sm text-success">
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
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Delivery
                                    </span>
                                    <span className="font-medium tabular-nums">
                                        {deliveryCharge === 0
                                            ? "Free"
                                            : formatCurrency(deliveryCharge, brandCurrency)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-1.5">
                                    <span className="text-sm font-medium">
                                        Total
                                    </span>
                                    <span className="text-lg font-bold tabular-nums">
                                        {formatCurrency(
                                            finalSubtotal + deliveryCharge,
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
