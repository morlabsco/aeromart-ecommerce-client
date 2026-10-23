"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImagePlus, Loader2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createBrand } from "@/lib/services/brand";
import { isErrorResult } from "@/lib/utils/result";

const brandSchema = z.object({
    name: z.string().min(1, { message: "Brand name is required." }),
    isActive: z.boolean(),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export function CreateBrandForm() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm<BrandFormValues>({
        resolver: zodResolver(brandSchema),
        defaultValues: { name: "", isActive: true },
    });

    const isActive = watch("isActive");

    const onSubmit = handleSubmit(async (values: BrandFormValues) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("data", JSON.stringify({ name: values.name, isActive: values.isActive }));
            if (logoFile) {
                formData.append("logo", logoFile);
            }

            const result = await createBrand(formData);

            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message ?? "Brand created successfully");
            // Reset so the form is ready for another entry.
            reset();
            setLogoFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            router.push("/dashboard/admin/brands/all-brands");
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Brand</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Add a new brand to your catalog
                </p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="text-base">Brand Details</CardTitle>
                    <CardDescription>
                        The logo is optional and uploaded as multipart form data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4" noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="name">Brand Name</Label>
                            <Input
                                id="name"
                                placeholder="Nike"
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
                            <Label htmlFor="logo">Logo</Label>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                    {logoFile ? logoFile.name : "Choose file"}
                                </Button>
                                <Input
                                    id="logo"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                                />
                                {logoFile && (
                                    <span className="text-xs text-muted-foreground">
                                        {(logoFile.size / 1024).toFixed(0)} KB
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
                                    Inactive brands are hidden from the storefront.
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
                                        <Tags className="mr-2 h-4 w-4" />
                                        Create Brand
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
