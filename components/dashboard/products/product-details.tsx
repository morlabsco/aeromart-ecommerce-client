"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Maximize2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import type { Product } from "@/lib/types/backend";

interface ProductDetailsProps {
    product: Product;
    /** Fallback currency for legacy products missing a currency code. */
    brandCurrency?: string;
}

/** Main image with hover-to-zoom following the cursor. */
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
    const [zoom, setZoom] = useState(false);
    const [origin, setOrigin] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setOrigin({ x, y });
    };

    return (
        <div
            className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted cursor-crosshair select-none"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={handleMouseMove}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                className="h-full w-full object-cover transition-transform duration-150 ease-out will-change-transform"
                style={{
                    transform: zoom ? "scale(2.5)" : "scale(1)",
                    transformOrigin: `${origin.x}% ${origin.y}%`,
                }}
            />
            <span className="absolute bottom-2 right-2 rounded-md bg-scrim/50 px-2 py-1 text-[10px] text-scrim-foreground flex items-center gap-1 pointer-events-none">
                <Maximize2 className="h-3 w-3" />
                Hover to zoom
            </span>
        </div>
    );
}

export function ProductDetails({ product, brandCurrency = "usd" }: ProductDetailsProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const currency = brandCurrency ?? product.currency;

    const images = [...(product.imageUrls ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((img) => img.url);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {product.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {product.slug}
                        {product.sku ? ` · SKU: ${product.sku}` : ""}
                        {product.brand?.name
                            ? ` · ${product.brand.name}`
                            : ""}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" render={<Link href="/dashboard/admin/products" />} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    {product.slug && (
                        <Button
                            variant="outline"
                            render={
                                <a
                                    href={`/products/${product.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                />
                            }
                            className="flex items-center gap-2"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View on Storefront
                        </Button>
                    )}
                    <Button render={<Link href={`/dashboard/admin/products/update-product/${product._id}`} />} className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        Update
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gallery */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Images</CardTitle>
                        <CardDescription>
                            {images.length > 0
                                ? `${images.length} image${images.length === 1 ? "" : "s"} · hover to zoom`
                                : "No images uploaded"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {images.length > 0 ? (
                            <>
                                <ZoomableImage
                                    src={images[selectedImage]}
                                    alt={product.name}
                                />

                                {images.length > 1 && (
                                    <div className="grid grid-cols-5 gap-2">
                                        {images.map((url, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setSelectedImage(i)}
                                                className={cn(
                                                    "relative aspect-square overflow-hidden rounded-md border-2 transition-all cursor-pointer",
                                                    selectedImage === i
                                                        ? "border-primary ring-1 ring-primary/30"
                                                        : "border-border hover:border-primary/40"
                                                )}
                                                aria-label={`View image ${i + 1}`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={url}
                                                    alt={`${product.name} ${i + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex h-56 w-full items-center justify-center rounded-lg bg-muted">
                                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                    <X className="h-6 w-6" />
                                    <span className="text-sm">
                                        No images available
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Overview</CardTitle>
                        <CardDescription>Product information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{product.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="rounded-lg border p-4">
                                <p className="text-xs text-muted-foreground">Price</p>
                                <p className="text-sm font-medium mt-1">
                                    {formatCurrency(product.price, currency)}
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs text-muted-foreground">Stock</p>
                                <Badge
                                    variant={product.stock > 20 ? "secondary" : product.stock > 0 ? "outline" : "destructive"}
                                    className="mt-1 text-xs"
                                >
                                    {product.stock > 20 ? "In Stock" : product.stock > 0 ? "Low Stock" : "Out of Stock"}
                                </Badge>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs text-muted-foreground">Weight</p>
                                <p className="text-sm font-medium mt-1">{product.weight} kg</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs text-muted-foreground">Category</p>
                                <p className="text-sm font-medium mt-1">{product.category?.name ?? "—"}</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs text-muted-foreground">Brand</p>
                                <p className="text-sm font-medium mt-1">{product.brand?.name ?? "—"}</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs text-muted-foreground">Status</p>
                                <Badge
                                    variant={product.isActive ? "secondary" : "outline"}
                                    className="mt-1 text-xs"
                                >
                                    {product.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs text-muted-foreground">Rating</p>
                                <p className="text-sm font-medium mt-1">
                                    {product.averageRating.toFixed(1)} ({product.ratingCount})
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs text-muted-foreground">Created</p>
                                <p className="text-sm font-medium mt-1">
                                    {new Date(product.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {product.keyFeatures.length > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Key Features</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.keyFeatures.map((feature) => (
                                        <Badge key={feature} variant="outline" className="text-xs">
                                            {feature}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {product.specification.length > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Specifications</p>
                                <div className="rounded-lg border overflow-hidden">
                                    {product.specification.map((spec, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between px-4 py-2 border-b last:border-0 text-sm"
                                        >
                                            <span className="text-muted-foreground">{spec.key}</span>
                                            <span className="font-medium">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
