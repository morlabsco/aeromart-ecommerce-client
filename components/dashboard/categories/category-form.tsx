"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImagePlus, Layers, Loader2 } from "lucide-react";
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
import { createCategory } from "@/lib/services/category";
import { isErrorResult } from "@/lib/utils/result";
import type { Category } from "@/lib/types/backend";
import { serverErrorMessage } from "@/lib/utils/form-feedback";

const categorySchema = z.object({
    name: z.string().min(1, { message: "Category name is required." }),
    description: z.string().optional(),
    isActive: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CreateCategoryFormProps {
    categories: Category[];
}

export function CreateCategoryForm({ categories }: CreateCategoryFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [parentId, setParentId] = useState<string>("none");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "", description: "", isActive: true },
    });

    const isActive = watch("isActive");

    const onSubmit = handleSubmit(async (values: CategoryFormValues) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append(
                "data",
                JSON.stringify({
                    name: values.name,
                    description: values.description || undefined,
                    parent: parentId === "none" ? null : parentId,
                    isActive: values.isActive,
                })
            );
            if (iconFile) {
                formData.append("icon", iconFile);
            }

            const result = await createCategory(formData);

            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }

            toast.success(result.message ?? "Category created successfully");
            // Reset so the form is ready for another entry.
            reset();
            setIconFile(null);
            setParentId("none");
            if (fileInputRef.current) fileInputRef.current.value = "";
            router.push("/dashboard/admin/categories/all-categories");
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Category</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Add a new category or subcategory
                </p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="text-base">Category Details</CardTitle>
                    <CardDescription>
                        Leave the parent empty for a top-level category.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4" noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input
                                id="name"
                                placeholder="Electronics"
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
                                placeholder="Short description of this category"
                                {...register("description")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Parent Category</Label>
                            <Select
                                value={parentId}
                                onValueChange={(value) => setParentId(value ?? "none")}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (top-level)</SelectItem>
                                    {categories
                                        .filter((c) => !c.parent)
                                        .map((category) => (
                                            <SelectItem
                                                key={category._id}
                                                value={category._id}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon</Label>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                    {iconFile ? iconFile.name : "Choose file"}
                                </Button>
                                <Input
                                    id="icon"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
                                />
                                {iconFile && (
                                    <span className="text-xs text-muted-foreground">
                                        {(iconFile.size / 1024).toFixed(0)} KB
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-1.5">
                            <div>
                                <Label htmlFor="isActive" className="cursor-pointer">
                                    Active
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Inactive categories are hidden from the storefront.
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
                                        <Layers className="mr-2 h-4 w-4" />
                                        Create Category
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
