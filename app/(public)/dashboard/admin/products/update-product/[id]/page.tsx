// Update product, SSR page. Fetches the product, brands, and categories, and
// renders a pre-filled update form.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getProductById } from "@/lib/services/product";
import { getAllBrands } from "@/lib/services/brand";
import { getAllCategories } from "@/lib/services/category";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { UpdateProductForm } from "@/components/dashboard/products/update-product-form";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

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
            ? `Update Product - ${product.brand.name}`
            : `Update Product - ${product.name}`,
        robots: { index: false, follow: false },
    };
}

async function UpdateProductContent({ productId }: { productId: string }) {
    const [productResult, brandsResult, categoriesResult, settingsResult] = await Promise.all([
        getProductById(productId),
        getAllBrands({ limit: 100 }),
        getAllCategories({ limit: 100 }),
        getSettings(),
    ]);

    if (isErrorResult(productResult) || !productResult.data) {
        const message =
            isErrorResult(productResult)
                ? productResult.message
                : "Product not found!";
        return <DetailError message={message} backHref="/dashboard/admin/products" />;
    }

    const brandCurrency =
        unwrapData(settingsResult)?.brand?.currency ?? "usd";

    return (
        <UpdateProductForm
            product={productResult.data}
            brands={unwrapList(brandsResult)}
            categories={unwrapList(categoriesResult)}
            brandCurrency={brandCurrency}
        />
    );
}

export default async function UpdateProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <UpdateProductContent productId={id} />
        </Suspense>
    );
}
