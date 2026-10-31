import Link from "next/link";
import { PackageSearch } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import type { OrderProductItem } from "@/lib/types/modules/order";

/* ---------------------------------------------------------------------------
 * OrderItemsCard — the ordered-products card shared by the admin and
 * customer order detail pages. Each line shows the product's image, its
 * linked name, variant + pricing snapshot and the line total.
 *
 * Edge cases handled here:
 *   , deleted products (the server populate returns null) keep the row and
 *     the order's own price/quantity snapshot — nothing crashes
 *   , products without a usable image fall back to a muted icon tile
 *   , long names truncate instead of blowing out the row on phones.
 * ------------------------------------------------------------------------- */

interface OrderItemsCardProps {
    products: OrderProductItem[];
    /** Currency the prices render in (resolved by the page). */
    currency: string;
}

export function OrderItemsCard({ products, currency }: OrderItemsCardProps) {
    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-base">Items</CardTitle>
                <CardDescription>Products in this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {products.map((item, i) => {
                    const product = item.product;
                    // First gallery entry with a URL — legacy seeded products
                    // can carry publicId-only entries.
                    const image = product?.imageUrls?.find(
                        (img) => img.url,
                    )?.url;
                    const name = product?.name ?? "Deleted product";
                    return (
                        <div
                            key={`${product?._id ?? "deleted"}-${i}`}
                            className="flex items-center gap-3 rounded-lg border p-3 sm:p-4"
                        >
                            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                                {image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={image}
                                        alt={name}
                                        className="size-full object-contain"
                                    />
                                ) : (
                                    <PackageSearch className="size-5 text-muted-foreground/60" />
                                )}
                            </span>
                            <div className="min-w-0 flex-1">
                                {product?.slug ? (
                                    <Link
                                        href={`/products/${product.slug}`}
                                        className="block truncate text-sm font-medium underline-offset-4 transition-colors hover:text-brand hover:underline"
                                    >
                                        {name}
                                    </Link>
                                ) : (
                                    <p className="truncate text-sm font-medium">
                                        {name}
                                    </p>
                                )}
                                {item.variant && (
                                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                                        {Object.entries(
                                            item.variant.attributes ?? {}
                                        )
                                            .map(
                                                ([key, value]) =>
                                                    `${key}: ${value}`
                                            )
                                            .join(" · ")}
                                        {item.variant.sku && (
                                            <span className="font-mono">
                                                {" "}
                                                · {item.variant.sku}
                                            </span>
                                        )}
                                    </p>
                                )}
                                <p className="mt-0.5 flex flex-wrap items-baseline gap-1.5 text-xs text-muted-foreground">
                                    <span>
                                        {item.quantity} ×{" "}
                                        {(item.baseUnitPrice ?? item.unitPrice) >
                                        item.unitPrice ? (
                                            <>
                                                <span className="mr-1 line-through decoration-muted-foreground/60">
                                                    {formatCurrency(
                                                        item.baseUnitPrice ??
                                                            item.unitPrice,
                                                        currency
                                                    )}
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {formatCurrency(
                                                        item.unitPrice,
                                                        currency
                                                    )}
                                                </span>
                                            </>
                                        ) : (
                                            formatCurrency(
                                                item.unitPrice,
                                                currency
                                            )
                                        )}
                                    </span>
                                </p>
                            </div>
                            <p className="shrink-0 text-right text-sm font-medium tabular-nums">
                                {formatCurrency(
                                    item.quantity * item.unitPrice,
                                    currency
                                )}
                            </p>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
