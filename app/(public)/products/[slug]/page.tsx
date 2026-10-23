import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/services/product";
import { getAllReviews } from "@/lib/services/review";
import { getSession } from "@/lib/get-session";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { toStorefrontProduct } from "@/lib/utils/product-adapter";
import ProductDetails from "../../../../components/public/products/[slug]/product-details";
import { notFound } from "next/navigation";
import type { Review } from "@/lib/types/backend";

export const dynamic = "force-dynamic";

function ProductDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="h-4 w-28 bg-muted rounded animate-pulse mb-6" />
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-2xl bg-muted animate-pulse" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-4 rounded bg-muted animate-pulse" />
            ))}
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-9 w-40 bg-muted rounded animate-pulse" />
          <div className="h-20 w-full bg-muted rounded animate-pulse" />
          <div className="h-12 w-full sm:w-64 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-16">
        <div className="h-7 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="grid sm:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
          ))}
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
  const products = unwrapList(result).map((p) => toStorefrontProduct(p, "usd"));
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = product.brand
    ? `Product Details - ${product.brand}`
    : `Product Details - ${product.title}`;

  return {
    title,
    description: product.description?.slice(0, 160) ?? "Product details.",
    openGraph: {
      title,
      description: product.description?.slice(0, 160),
      images: product.images?.length ? [{ url: product.images[0] }] : [],
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
  const brandCurrency =
    unwrapData(settingsResult)?.brand?.currency ?? "usd";
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
