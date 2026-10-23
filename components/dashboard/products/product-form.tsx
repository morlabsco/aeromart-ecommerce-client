"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createProduct } from "@/lib/services/product";
import { currencySymbol } from "@/lib/utils/currency";
import { isErrorResult } from "@/lib/utils/result";
import type {
    Brand,
    Category,
    ProductColorOption,
    ProductOfferPrice,
    ProductSpecification,
    ProductVariant,
    ProductVariantAxis,
} from "@/lib/types/backend";
import { FeatureListEditor } from "@/components/dashboard/shared/feature-list-editor";
import { KeyValueListEditor } from "@/components/dashboard/shared/key-value-list-editor";
import { ProductImageUploader } from "@/components/dashboard/shared/product-image-uploader";
import {
    AttributesEditor,
    ColorOptionsEditor,
    OfferPriceEditor,
    VariantsEditor,
} from "@/components/dashboard/shared/product-pricing-editors";

const productSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, { message: "Product name must be at least 2 characters." }),
    description: z
        .string()
        .trim()
        .min(10, { message: "Description must be at least 10 characters." }),
    price: z.coerce
        .number()
        .positive({ message: "Price must be greater than 0." }),
    weight: z.coerce
        .number()
        .nonnegative({ message: "Weight cannot be negative." }),
    stock: z.coerce
        .number()
        .int({ message: "Stock must be a whole number." })
        .min(0, { message: "Stock cannot be negative." })
        .optional(),
    isActive: z.boolean(),
});

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormValues = z.output<typeof productSchema>;

interface CreateProductFormProps {
    brands: Brand[];
    categories: Category[];
    /** Active store currency, applied server-side on create (brand.currency). */
    brandCurrency?: string;
}

const MAX_IMAGES = 10;

export function CreateProductForm({ brands, categories, brandCurrency = "usd" }: CreateProductFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [brandId, setBrandId] = useState<string>("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
    const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
    const [colorOptions, setColorOptions] = useState<ProductColorOption[]>([]);
    const [offerPrice, setOfferPrice] = useState<ProductOfferPrice | null>(null);
    const [hasVariants, setHasVariants] = useState(false);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [attributes, setAttributes] = useState<ProductVariantAxis[]>([]);
    const [variantImageFiles, setVariantImageFiles] = useState<
        { variantIndex: number; files: File[] }[]
    >([]);
    const [selectErrors, setSelectErrors] = useState<{
        brand?: string;
        category?: string;
    }>({});

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm<ProductFormInput, unknown, ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            weight: 0,
            stock: 0,
            isActive: true,
        },
    });

    const isActive = watch("isActive");

    const onSubmit = handleSubmit(async (values: ProductFormValues) => {
        if (submitting) return;
        const errs: { brand?: string; category?: string } = {};
        if (!brandId) errs.brand = "Please select a brand.";
        if (!categoryId) errs.category = "Please select a category.";
        if (errs.brand || errs.category) {
            setSelectErrors(errs);
            toast.error("Please select a brand and a category.");
            return;
        }
        setSelectErrors({});

        setSubmitting(true);
        try {
            const formData = new FormData();
            const payload: Record<string, unknown> = {
                name: values.name,
                description: values.description,
                price: values.price,
                weight: values.weight,
                stock: values.stock ?? 0,
                brand: brandId,
                category: categoryId,
                keyFeatures,
                specification: specifications,
                isActive: values.isActive,
                colorOptions,
            };
            if (offerPrice) payload.offerPrice = offerPrice;
            if (hasVariants) {
                // Every variant's attribute keys AND values must be declared in
                // the axes, else the backend returns 400 (guide §7.3). Color
                // options are included as a "Color" axis when variants use them.
                const colorNames = colorOptions
                    .map((c) => c.name.trim())
                    .filter(Boolean);
                const axes = [
                    ...(colorNames.length > 0
                        ? [{ key: "Color", values: colorNames }]
                        : []),
                    ...attributes
                        // Drop any manual "Color" axis, colors are added from
                        // Color Options only (prevents duplicates on updates).
                        .filter(
                            (axis) =>
                                axis.key.trim().toLowerCase() !== "color"
                        )
                        .map((axis) => ({
                            key: axis.key.trim(),
                            values: [
                                ...new Set(
                                    variants
                                        .map(
                                            (v) =>
                                                v.attributes[axis.key]?.trim()
                                        )
                                        .filter((v): v is string => !!v)
                                ),
                            ],
                        }))
                        .filter((axis) => axis.key && axis.values.length > 0),
                ];

                // Block variants with empty/NaN stock instead of silently dropping them.
                const hasInvalidStock = variants.some(
                    (v) => !Number.isFinite(v.stock) || v.stock < 0
                );
                if (hasInvalidStock) {
                    toast.error(
                        "Every variant needs a valid stock quantity (0 or more)."
                    );
                    return;
                }

                const sendVariants = variants.map((v, i) => {
                    const files =
                        variantImageFiles.find((f) => f.variantIndex === i)
                            ?.files ?? [];
                    return {
                        ...v,
                        // Existing slots + `{}` placeholders for new uploads.
                        imageUrls: [
                            ...(v.imageUrls ?? []),
                            ...files.map(() => ({})),
                        ],
                    };
                });

                payload.hasVariants = true;
                payload.attributes = axes;
                payload.variants = sendVariants;
                // Flat pool of variant images, consumed in variant order.
                const flatVariantImages = variantImageFiles.flatMap(
                    (v) => v.files
                );
                flatVariantImages.forEach((file) =>
                    formData.append("variantImages", file)
                );
            }
            formData.append("data", JSON.stringify(payload));
            imageFiles.forEach((file) => formData.append("images", file));

            const result = await createProduct(formData);

            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message ?? "Product created successfully");
            // Reset so the form is ready for another entry.
            reset();
            setImageFiles([]);
            setBrandId("");
            setCategoryId("");
            setKeyFeatures([]);
            setSpecifications([]);
            setColorOptions([]);
            setOfferPrice(null);
            setHasVariants(false);
            setVariants([]);
            router.push("/dashboard/admin/products/all-products");
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Product</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Add a new product to your catalog
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Product Details</CardTitle>
                        <CardDescription>
                            Core information about the product.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4" noValidate>
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Smartphone X"
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
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Short description of the product"
                                    {...register("description")}
                                    aria-invalid={!!errors.description}
                                />
                                {errors.description && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {errors.description.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">
                                        Price ({currencySymbol(brandCurrency)})
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register("price")}
                                        aria-invalid={!!errors.price}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        New products inherit the store currency ({brandCurrency.toUpperCase()}) automatically.
                                    </p>
                                    {errors.price && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {errors.price.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Weight (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register("weight")}
                                        aria-invalid={!!errors.weight}
                                    />
                                    {errors.weight && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {errors.weight.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stock</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        min="0"
                                        {...register("stock")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-2 pt-1.5">
                                        <Switch
                                            id="isActive"
                                            checked={isActive}
                                            onCheckedChange={(value) =>
                                                setValue("isActive", value)
                                            }
                                        />
                                        <Label htmlFor="isActive" className="cursor-pointer">
                                            {isActive ? "Active" : "Inactive"}
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Select
                                        value={brandId}
                                        onValueChange={(value) => {
                                            setBrandId(String(value ?? ""));
                                            if (selectErrors.brand) {
                                                setSelectErrors((prev) => ({
                                                    ...prev,
                                                    brand: undefined,
                                                }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full cursor-pointer">
                                            <SelectValue placeholder="Select brand">
                                                {(value) =>
                                                    brands.find((b) => b._id === String(value))?.name ??
                                                    (value ? String(value) : null)
                                                }
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {brands.length === 0 && (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    No brands available
                                                </div>
                                            )}
                                            {brands.map((brand) => (
                                                <SelectItem
                                                    key={brand._id}
                                                    value={brand._id}
                                                    label={brand.name}
                                                    className="cursor-pointer"
                                                >
                                                    {brand.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectErrors.brand && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {selectErrors.brand}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={categoryId}
                                        onValueChange={(value) => {
                                            setCategoryId(String(value ?? ""));
                                            if (selectErrors.category) {
                                                setSelectErrors((prev) => ({
                                                    ...prev,
                                                    category: undefined,
                                                }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full cursor-pointer">
                                            <SelectValue placeholder="Select category">
                                                {(value) =>
                                                    categories.find((c) => c._id === String(value))?.name ??
                                                    (value ? String(value) : null)
                                                }
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.length === 0 && (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    No categories available
                                                </div>
                                            )}
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category._id}
                                                    value={category._id}
                                                    label={category.name}
                                                    className="cursor-pointer"
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectErrors.category && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {selectErrors.category}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <FeatureListEditor
                                    label="Key Features"
                                    items={keyFeatures}
                                    onChange={setKeyFeatures}
                                    placeholder="5G Support"
                                />
                            </div>

                            <div className="space-y-4">
                                <KeyValueListEditor
                                    label="Specifications"
                                    items={specifications}
                                    onChange={setSpecifications}
                                    keyPlaceholder="RAM"
                                    valuePlaceholder="8GB"
                                    addLabel="Add Row"
                                />
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <ColorOptionsEditor
                                    value={colorOptions}
                                    onChange={setColorOptions}
                                />
                            </div>

                            <div className="space-y-4">
                                <AttributesEditor
                                    value={attributes}
                                    onChange={setAttributes}
                                />
                            </div>

                            <div className="space-y-4">
                                <VariantsEditor
                                    hasVariants={hasVariants}
                                    onHasVariantsChange={setHasVariants}
                                    value={variants}
                                    onChange={setVariants}
                                    attributes={attributes}
                                    colors={colorOptions}
                                    onImagesChange={setVariantImageFiles}
                                />
                            </div>

                            <div className="space-y-4">
                                <OfferPriceEditor
                                    value={offerPrice}
                                    onChange={setOfferPrice}
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
                                            <Package className="mr-2 h-4 w-4" />
                                            Create Product
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

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Product Images</CardTitle>
                        <CardDescription>
                            Upload up to {MAX_IMAGES} images. Drag to reorder.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ProductImageUploader
                            files={imageFiles}
                            onChange={setImageFiles}
                            maxImages={MAX_IMAGES}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
