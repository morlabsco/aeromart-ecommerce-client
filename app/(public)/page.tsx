import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/services/product";
import { getAllCategories } from "@/lib/services/category";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { toStorefrontProduct } from "@/lib/utils/product-adapter";
import { Categories } from "../../components/home/categories"
import { FeaturedProducts } from "../../components/home/featured-products"
import { NewArrivals } from "../../components/home/new-arrivals"
import { OfferSection } from "../../components/home/offer-section"
import { BrandStory } from "../../components/home/brand-story"
import { Testimonials } from "../../components/home/testimonials"
import { Newsletter } from "../../components/home/newsletter"
import { FeaturesBar } from "../../components/home/features-bar"
import { Banner } from "@/components/home/banner"
import { HomeSkeleton } from "@/components/home/home-skeleton"

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getSettings();
  const settings = unwrapData(result);
  const brand = settings?.brand.name || "Attor";
  return {
    title: `${brand} - Premium Collection`,
    description: settings?.brand.description || "Discover curated products crafted for the modern individual.",
    openGraph: {
      title: `${brand}, Premium Collection`,
      description: settings?.brand.description,
    },
  };
}

async function HomeData() {
  const [productsResult, categoriesResult, settingsResult] = await Promise.all([
    getAllProducts({ limit: 100 }),
    getAllCategories({ limit: 20 }),
    getSettings(),
  ]);

  const brandCurrency = unwrapData(settingsResult)?.brand?.currency ?? "usd";
  const products = unwrapList(productsResult).map((p) =>
    toStorefrontProduct(p, brandCurrency)
  );
  const categories = unwrapList(categoriesResult).map((c) => ({
    name: c.name,
    slug: c.slug,
    image: c.icon ?? "",
  }));
  const settings = unwrapData(settingsResult);

  return (
    <main>
      <Banner slides={settings?.hero.slides ?? []} />
      <FeaturesBar />
      <Categories categories={categories} />
      <FeaturedProducts products={products} />
      <NewArrivals products={products} />
      <OfferSection
        offer={settings?.limitedOffer ?? { enabled: false, badge: "", title: "", subtitle: "", ctaText: "", ctaLink: "", image: "", endsAt: "" }}
      />
      {settings && (
        <BrandStory brand={settings.brand} about={settings.about} />
      )}
      {settings && (
        <Testimonials
          heading={settings.testimonials.heading}
          items={settings.testimonials.items}
        />
      )}
      {settings?.footer.newsletter.enabled && (
        <Newsletter heading={settings.footer.newsletter.heading} />
      )}
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeData />
    </Suspense>
  )
}
