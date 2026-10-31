"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Package, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllProducts } from "@/lib/services/product";
import { isErrorResult } from "@/lib/utils/result";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Coupon product picker — scopes a coupon to specific products. Left empty
 * (the default) the coupon applies to the whole order; picking products
 * restricts both the min-amount check and the discount to those lines.
 * Search-as-you-type over the catalog (debounced, server-side regex), with
 * selected products pinned at the top as removable chips.
 * ------------------------------------------------------------------------- */

interface PickerProduct {
    _id: string;
    name: string;
    slug?: string;
    sku?: string;
    price?: number;
    imageUrls?: { url?: string }[];
}

export function CouponProductPicker({
    selected,
    onChange,
}: {
    /** Selected product ids. */
    selected: string[];
    onChange: (ids: string[]) => void;
}) {
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [results, setResults] = useState<PickerProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounce the search term (min 2 chars like the storefront search).
    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 350);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        let cancelled = false;
        if (debounced.length < 2) {
            setResults([]);
            setError(null);
            return;
        }
        setLoading(true);
        getAllProducts({ searchTerm: debounced, limit: 8, isActive: "true" })
            .then((result) => {
                if (cancelled) return;
                if (isErrorResult(result)) {
                    setError(result.message ?? "Search failed");
                    setResults([]);
                } else {
                    setError(null);
                    setResults((result.data ?? []) as PickerProduct[]);
                }
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [debounced]);

    const toggle = (id: string) => {
        onChange(
            selected.includes(id)
                ? selected.filter((s) => s !== id)
                : [...selected, id]
        );
    };

    const selectedProducts = useMemo(
        () =>
            results.filter((p) => selected.includes(p._id)).concat(
                // Ids chosen earlier that aren't in the current result page.
                selected
                    .filter(
                        (id) => !results.some((r) => r._id === id)
                    )
                    .map((id) => ({ _id: id, name: "" }))
            ),
        [results, selected]
    );

    return (
        <div className="space-y-3 rounded-lg border border-border/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <Label className="text-xs font-medium">
                        Apply to specific products
                    </Label>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        Leave empty and the coupon applies to the whole order.
                        Pick products and only their cart subtotal counts
                        toward the minimum , and receives the discount.
                    </p>
                </div>
                {selected.length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange([])}
                        className="text-xs text-muted-foreground hover:text-destructive"
                    >
                        Clear all
                    </Button>
                )}
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedProducts.map((product) => (
                        <Badge
                            key={product._id}
                            variant="secondary"
                            className="gap-1 pr-1 font-normal"
                        >
                            <span className="max-w-[180px] truncate">
                                {product.name || product._id.slice(-8)}
                            </span>
                            <button
                                type="button"
                                onClick={() => toggle(product._id)}
                                aria-label={`Remove ${product.name || product._id}`}
                                className="flex size-4 cursor-pointer items-center justify-center rounded-full hover:bg-destructive/20"
                            >
                                <X className="size-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products by name… (min 2 characters)"
                    className="h-9 pl-9 text-sm"
                    aria-label="Search products to scope the coupon"
                />
            </div>

            {/* Results */}
            {loading && (
                <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Searching…
                </p>
            )}
            {!loading && debounced.length >= 2 && error && (
                <p className="px-1 text-xs text-destructive">{error}</p>
            )}
            {!loading && debounced.length >= 2 && !error && results.length === 0 && (
                <p className="px-1 text-xs text-muted-foreground">
                    No products match “{debounced}”.
                </p>
            )}
            {!loading && debounced.length < 2 && (
                <p className="px-1 text-xs text-muted-foreground">
                    Type at least 2 characters to search the catalog.
                </p>
            )}
            {results.length > 0 && (
                <ul className="max-h-56 space-y-1 overflow-y-auto">
                    {results.map((product) => {
                        const isSelected = selected.includes(product._id);
                        return (
                            <li key={product._id}>
                                <button
                                    type="button"
                                    onClick={() => toggle(product._id)}
                                    aria-pressed={isSelected}
                                    className={cn(
                                        "flex w-full cursor-pointer items-center gap-3 rounded-lg border p-2 text-left transition-colors",
                                        isSelected
                                            ? "border-brand/60 bg-brand/10"
                                            : "border-border/60 hover:border-brand/40 hover:bg-muted/50"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex size-4.5 shrink-0 items-center justify-center rounded border",
                                            isSelected
                                                ? "border-brand bg-brand text-brand-foreground"
                                                : "border-border"
                                        )}
                                    >
                                        {isSelected && (
                                            <Check className="size-3" strokeWidth={3} />
                                        )}
                                    </span>
                                    {product.imageUrls?.[0]?.url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={product.imageUrls[0].url}
                                            alt=""
                                            className="size-8 shrink-0 rounded bg-muted object-contain"
                                        />
                                    ) : (
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
                                            <Package className="size-3.5 text-muted-foreground" />
                                        </span>
                                    )}
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">
                                            {product.name}
                                        </span>
                                        {product.sku && (
                                            <span className="block font-mono text-[10px] text-muted-foreground">
                                                {product.sku}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
