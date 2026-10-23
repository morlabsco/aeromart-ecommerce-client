// Product details, SSR page (view single). Uses GET /product/:productId.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getProductById } from "@/lib/services/product";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { ProductDetails } from "@/components/dashboard/products/product-details";
import { ProductDetailsSkeleton } from "@/components/dashboard/products/product-details-skeleton";
import { DetailError } from "@/components/dashboard/shared/detail-error";

export const dynamic = "force-dynamic";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const result = await getProductById(id);
    const product = unwrapData(result);

    if (!product) {
        return { title: "Product Not Found", robots: { index: false } };
    }

    return {
        title: product.brand?.name
            ? `Product Details - ${product.brand.name}`
            : `Product Details - ${product.name}`,
        description: product.description?.slice(0, 160),
        robots: { index: false, follow: false },
    };
}

async function ProductDetailsContent({ productId }: { productId: string }) {
    const [result, settingsResult] = await Promise.all([
        getProductById(productId),
        getSettings(),
    ]);
    if (isErrorResult(result) || !result.data) {
        const message =
            isErrorResult(result) ? result.message : "Product not found!";
        return <DetailError message={message} backHref="/dashboard/admin/products" />;
    }
    const brandCurrency =
        unwrapData(settingsResult)?.brand?.currency ?? "usd";
    return (
        <ProductDetails
            product={result.data}
            brandCurrency={brandCurrency}
        />
    );
}

export default async function ProductDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<ProductDetailsSkeleton />}>
            <ProductDetailsContent productId={id} />
        </Suspense>
    );
}
