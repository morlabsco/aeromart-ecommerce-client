import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/services/product";
import { getAllReviews } from "@/lib/services/review";
import { getSession } from "@/lib/get-session";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { toStorefrontProduct } from "@/lib/utils/product-adapter";
import { storefrontMetadata } from "@/lib/metadata";
import ProductDetails from "../../../../components/public/products/[slug]/product-details";
import { notFound } from "next/navigation";
import type { Review } from "@/lib/types/backend";

export const dynamic = "force-dynamic";

function ProductDetailsSkeleton() {
  return (
    <div className="bg-hero-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Breadcrumb */}
        <div className="h-4 w-44 rounded bg-muted animate-pulse" />

        {/* Gallery + buy box */}
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: main image + thumbnail strip (thumbs below on mobile) */}
          <div className="min-w-0 space-y-4">
            <div className="aspect-square w-full rounded-lg bg-card animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="size-16 shrink-0 rounded-lg bg-card animate-pulse sm:size-20"
                />
              ))}
            </div>
          </div>

          {/* Right: buy box */}
          <div className="min-w-0 space-y-5">
            <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="size-4 rounded bg-muted animate-pulse" />
              ))}
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </div>
            {/* Cream price panel */}
            <div className="h-[4.5rem] rounded-xl bg-muted animate-pulse" />
            {/* Spec bullets */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
              ))}
            </div>
            {/* Variant pills */}
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
            {/* Quantity + availability */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-32 rounded-full bg-muted animate-pulse" />
              <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
            </div>
            {/* ADD TO CART / BUY NOW pair */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="h-11 flex-1 rounded-lg bg-muted animate-pulse" />
              <div className="h-11 flex-1 rounded-lg bg-muted animate-pulse" />
            </div>
            {/* Quick contact pair */}
            <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
              <div className="h-11 rounded-lg bg-muted animate-pulse" />
              <div className="h-11 rounded-lg bg-muted animate-pulse" />
            </div>
            {/* Trust badges */}
            <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-9 shrink-0 rounded-full bg-muted animate-pulse" />
                  <div className="h-3 w-full rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description card */}
        <div className="mt-12 lg:mt-16">
          <div className="rounded-2xl bg-card p-6 shadow-sm sm:p-8">
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="mt-6 space-y-2.5">
              <div className="h-3.5 w-full rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-11/12 rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12 lg:mt-16">
          <div className="h-4 w-52 rounded bg-muted animate-pulse" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-card shadow-sm animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAllProducts({ limit: 200 });
  const products = unwrapList(result).map((p) => toStorefrontProduct(p));
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return storefrontMetadata({ title: "Product Not Found" });
  }

  // The PRODUCT NAME is the page title (composed through the SEO template,
  // e.g. "Massage Gun LM-130 | AeroMart"); social shares carry the product
  // image, falling back to the store's SEO image.
  const description =
    product.description?.slice(0, 160) ?? "Product details.";
  const metadata = await storefrontMetadata({
    title: product.title,
    description,
  });
  const image = product.images?.[0];
  return {
    ...metadata,
    openGraph: {
      ...(metadata.openGraph ?? {}),
      images: image ? [image] : metadata.openGraph?.images,
    },
    twitter: {
      ...(metadata.twitter ?? {}),
      images: image ? [image] : metadata.twitter?.images,
    },
  };
}

async function ProductDetailsData({ slug }: { slug: string }) {
  // Backend has no slug lookup, fetch the list (populated with slug) and find.
  const [productsResult, reviewsResult, session, settingsResult] =
    await Promise.all([
      getAllProducts({ limit: 200 }),
      getAllReviews({ limit: 100 }),
      getSession(),
      getSettings(),
    ]);
  const settings = unwrapData(settingsResult);
  const brandCurrency = settings?.brand?.currency ?? "usd";
  const contactPhone = settings?.contact?.phone ?? null;
  const products = unwrapList(productsResult).map((p) =>
    toStorefrontProduct(p, brandCurrency)
  );
  const product = products.find((p) => p.slug === slug);

  if (!product) notFound();

  const allReviews = unwrapList(reviewsResult);
  // Reviews reference the product by _id; the storefront product id is the _id.
  const reviews = allReviews.filter(
    (r) => r.product?._id === product.id && !r.isFlagged
  );

  const related = products
    .filter((p) => p.id !== product.id && p.isActive)
    .slice(0, 4);

  return (
    <div className="product-details-page">
      <ProductDetails
        product={product}
        related={related}
        reviews={reviews as Review[]}
        canReview={session.isAuthenticated && session.user?.role === "customer"}
        productId={product.id}
        contactPhone={contactPhone}
      />
    </div>
  );
}

const ProductDetailsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  return (
    <Suspense fallback={<ProductDetailsSkeleton />}>
      <ProductDetailsData slug={slug} />
    </Suspense>
  );
};

export default ProductDetailsPage;
