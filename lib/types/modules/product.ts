// Product module types, docs/v7-backend-usage-guide.md §7.

export interface ProductCategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductBrandRef {
  _id: string;
  name: string;
  logo?: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface ProductImage {
  publicId: string;
  url: string;
  order: number;
}

export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface ProductOfferPrice {
  type: "flat" | "percentage";
  value: number;
  startAt?: string;
  endAt?: string;
  isActive?: boolean;
}

export interface ProductVariant {
  sku: string;
  attributes: Record<string, string>;
  price?: number;
  stock: number;
  /** Variant image slots: existing images `{ publicId, order }`, new ones `{}`. */
  imageUrls?: (
    | { publicId: string; url?: string; order?: number }
    | Record<string, never>
  )[];
  isActive?: boolean;
}

export interface ProductVariantAxis {
  key: string;
  values: string[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  /** Currency code, e.g. "usd" (default), "bdt", "eur", "gbp", "inr", "aed", "aud", "cad". */
  currency: string;
  stock: number;
  weight: number;
  category: ProductCategoryRef;
  brand: ProductBrandRef;
  imageUrls: ProductImage[];
  isActive: boolean;
  averageRating: number;
  ratingCount: number;
  availableColors: string[];
  specification: ProductSpecification[];
  keyFeatures: string[];
  offerPrice?: ProductOfferPrice;
  colorOptions?: ProductColorOption[];
  /** Variant axes (every variant's attribute key+value must be declared here). */
  attributes?: ProductVariantAxis[];
  variants?: ProductVariant[];
  hasVariants?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  stock?: number;
  weight: number;
  category: string;
  brand: string;
  availableColors?: string[];
  specification?: ProductSpecification[];
  keyFeatures?: string[];
  isActive?: boolean;
  colorOptions?: ProductColorOption[];
  /** Variant axes: every variant's attribute key+value must be declared here. */
  attributes?: ProductVariantAxis[];
  variants?: ProductVariant[];
  hasVariants?: boolean;
  offerPrice?: ProductOfferPrice;
}

/** Update payload: supports image management via keepImages/removedImageIds. */
export interface UpdateProductPayload extends Partial<ProductPayload> {
  keepImages?: { publicId: string; order: number }[];
  removedImageIds?: string[];
}
