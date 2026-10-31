import type { Product, VariantSku } from "@/lib/types";

/**
 * Derives the pickable variant axes for a storefront product, hardened for
 * real-world data:
 *
 *   , declared axes keep only in-stock options , but when EVERY option is out
 *     of stock the axis still renders its full option list (the picker must
 *     stay visible; CTAs handle the Out-of-Stock state)
 *   , attributes present on the SKU rows but missing a declared axis are
 *     synthesized (legacy products whose axis list was lost — this made
 *     color/size pickers disappear entirely)
 *   , SKU rows with no attributes at all leave the axes empty — callers fall
 *     back to a default SKU (see `defaultAttributelessSku`)
 */

export interface VariantAxis {
    name: string;
    options: string[];
}

export function deriveVariantAxes(product: {
    variants?: VariantAxis[];
    variantSkus?: VariantSku[];
}): VariantAxis[] {
    const skus = product.variantSkus ?? [];

    const withStockFallback = (axis: VariantAxis): VariantAxis => {
        const inStock = axis.options.filter((option) =>
            skus.some(
                (s) => s.attributes?.[axis.name] === option && s.stock > 0
            )
        );
        return {
            ...axis,
            options: inStock.length > 0 ? inStock : axis.options,
        };
    };

    const declared = (product.variants ?? []).map(withStockFallback);

    const skuAttributeNames = Array.from(
        new Set(skus.flatMap((s) => Object.keys(s.attributes ?? {})))
    );
    const synthesized = skuAttributeNames
        .filter((name) => !declared.some((a) => a.name === name))
        .map((name) =>
            withStockFallback({
                name,
                options: Array.from(
                    new Set(
                        skus
                            .filter((s) => s.attributes?.[name])
                            .map((s) => s.attributes[name])
                    )
                ),
            })
        );

    return [...declared, ...synthesized].filter((a) => a.options.length > 0);
}

/**
 * The SKU a product with attribute-less variant rows resolves to when there
 * is nothing to pick: first in-stock row, else the first row (honest
 * Out-of-Stock state). Returns undefined for normal pickable products.
 */
export function defaultAttributelessSku(
    product: Pick<Product, "variants" | "variantSkus">
): VariantSku | undefined {
    const axes = deriveVariantAxes(product);
    if (axes.length > 0) return undefined;
    const skus = product.variantSkus ?? [];
    return skus.find((s) => s.stock > 0) ?? skus[0];
}

/**
 * The concrete SKU matching a full attribute selection, or undefined while
 * the selection is incomplete (never throws on missing attributes).
 */
export function resolveVariantSku(
    product: Pick<Product, "variantSkus">,
    selection: Record<string, string>
): VariantSku | undefined {
    const names = Object.keys(selection);
    if (names.length === 0) return undefined;
    return (product.variantSkus ?? []).find((s) =>
        names.every(
            (name) =>
                s.attributes?.[name] !== undefined &&
                s.attributes[name] === selection[name]
        )
    );
}
