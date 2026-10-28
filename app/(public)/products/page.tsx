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
    <div className="bg-hero-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Centered breadcrumb + heading (matches the page layout) */}
        <div className="mx-auto h-4 w-36 rounded bg-muted animate-pulse" />
        <div className="mx-auto mt-4 h-9 w-64 max-w-full rounded bg-muted animate-pulse" />

        {/* Toolbar: Filters · result count · sort + view toggle */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="h-10 w-28 shrink-0 rounded-lg bg-muted animate-pulse" />
          <div className="hidden h-4 w-48 rounded bg-muted animate-pulse sm:block" />
          <div className="flex shrink-0 items-center gap-3">
            <div className="h-10 w-36 rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-[5.5rem] rounded-lg bg-muted animate-pulse" />
          </div>
        </div>

        {/* Product card grid — same columns as the real grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-card p-3 shadow-sm sm:p-4"
            >
              <div className="aspect-square rounded-lg bg-muted animate-pulse" />
              <div className="mt-4 h-3 w-1/2 rounded bg-muted animate-pulse" />
              <div className="mt-2 h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="mt-3 h-4 w-1/3 rounded bg-muted animate-pulse" />
              <div className="mt-4 h-10 rounded-lg bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* Bottom pagination: Previous · numbers · Next */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <div className="h-9 w-[5.25rem] rounded-lg bg-muted animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
          ))}
          <div className="h-9 w-[4.5rem] rounded-lg bg-muted animate-pulse" />
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
