import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/services/product";
import { getAllCategories } from "@/lib/services/category";
import { getAllBrands } from "@/lib/services/brand";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { toStorefrontProduct } from "@/lib/utils/product-adapter";
import Products from "../../../components/public/products/products";

export const dynamic = "force-dynamic";

function ProductsPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-9 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-muted rounded animate-pulse sm:hidden" />
      </div>
      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <aside className="w-56 shrink-0 hidden sm:block">
          <div className="space-y-6 sticky top-24">
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-32 bg-muted rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 w-28 bg-muted rounded animate-pulse" />
              ))}
            </div>
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
            <div className="h-8 bg-muted rounded-lg animate-pulse" />
            <div className="h-6 bg-muted rounded-lg animate-pulse" />
          </div>
        </aside>
        {/* Grid skeleton */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-xl bg-muted mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                <div className="h-5 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function ProductsData() {
  const [productsResult, categoriesResult, brandsResult, settingsResult] =
    await Promise.all([
      getAllProducts({ limit: 100 }),
      getAllCategories({ limit: 100 }),
      getAllBrands({ limit: 100 }),
      getSettings(),
    ]);
  const brandCurrency =
    unwrapData(settingsResult)?.brand?.currency ?? "usd";
  const products = unwrapList(productsResult).map((p) =>
    toStorefrontProduct(p, brandCurrency)
  );
  const categories = unwrapList(categoriesResult).filter((c) => c.isActive);
  const brands = unwrapList(brandsResult).filter((b) => b.isActive);

  return (
    <div className="products-page">
      <Products
        products={products}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}

const ProductsPage = () => {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsData />
    </Suspense>
  );
};

export async function generateMetadata(): Promise<Metadata> {
  const settingsResult = await getSettings();
  const brand = unwrapData(settingsResult)?.brand?.name ?? null;
  return {
    title: brand ? `All Products - ${brand}` : "All Products",
    description: "Browse our full collection of curated products.",
  };
}

export default ProductsPage;
