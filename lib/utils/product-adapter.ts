// Adapter: map backend API products (docs/v7-backend-usage-guide.md §7) into the
// storefront Product shape used by ProductCard and the public pages.
import type { Product as ApiProduct } from "@/lib/types/backend";
import type { Product, VariantSku } from "@/lib/types";

/**
 * Map a backend product into the storefront shape. The backend attaches the
 * store currency to each product at create time, but when the field is missing
 * (e.g. older data), fall back to the brand currency passed by the page.
 */
export function toStorefrontProduct(
  product: ApiProduct,
  brandCurrency = "usd"
): Product {
    const sortedImages = [...(product.imageUrls ?? [])].sort(
        (a, b) => a.order - b.order
    );
    const cover = sortedImages[0]?.url ?? "";

    // Variant axes (Color → [Black, White], Size → [S, M]) drive the picker.
    const variants = (product.attributes ?? []).map((axis) => ({
        name: axis.key,
        options: axis.values,
    }));

    // Concrete SKUs let us resolve price/stock/images for a chosen combo.
    const variantSkus: VariantSku[] = (product.variants ?? []).map((v) => ({
        sku: v.sku,
        attributes: v.attributes,
        price: v.price,
        stock: v.stock,
        imageUrls: [...(v.imageUrls ?? [])]
            .filter((img) => "url" in img && img.url)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((img) => (img as { url: string }).url),
    }));

    return {
        id: product._id,
        title: product.name,
        slug: product.slug,
        description: product.description,
        fullDescription: product.description,
        price: product.price,
        currency: product.currency || brandCurrency,
        offerPrice: product.offerPrice,
        category: product.category?.name ?? "",
        brand: product.brand?.name ?? "",
        image: cover,
        images: sortedImages.map((img) => img.url),
        isActive: product.isActive,
        featured: false,
        ctaLabel: "Shop Now",
        variants,
        variantSkus,
        colorOptions: product.colorOptions,
        hasVariants: product.hasVariants ?? (product.variants?.length ?? 0) > 0,
        stock: product.stock,
        rating: product.averageRating,
        reviewCount: product.ratingCount,
        createdAt: product.createdAt,
        keyFeatures: product.keyFeatures ?? [],
    };
}
