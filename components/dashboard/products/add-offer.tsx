"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OfferPriceEditor } from "@/components/dashboard/shared/product-pricing-editors";
import {
    ArrowLeft,
    ArrowRight,
    BadgePercent,
    CheckCircle2,
    Loader2,
    PackageSearch,
    Search,
    Zap,
} from "lucide-react";
import { getAllProducts, updateProductOffer } from "@/lib/services/product";
import { formatCurrency } from "@/lib/utils/currency";
import { getOfferStatus, offerSaleInfo } from "@/lib/utils/offer";
import { isErrorResult } from "@/lib/utils/result";
import { serverErrorMessage } from "@/lib/utils/form-feedback";
import type { Product, ProductOfferPrice } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Add Offer page — the full-screen sibling of the manager's Quick Add modal.
 * Step 1: search the catalog (image, SKU, price, stock, current offer).
 * Step 2: configure the discount with a live sale-price preview, then save.
 * ------------------------------------------------------------------------- */

interface AddOfferProps {
    /** Live brand currency — preview prices render in it. */
    brandCurrency?: string;
}

const SEARCH_FIELDS =
    "name,price,currency,stock,sku,imageUrls,offerPrice,hasVariants,isActive";

export function AddOffer({ brandCurrency = "usd" }: AddOfferProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    /* ── Step 1: search ── */
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const [results, setResults] = useState<Product[]>([]);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Step 2: configure ── */
    const [picked, setPicked] = useState<Product | null>(null);
    const [offer, setOffer] = useState<ProductOfferPrice | null>(null);
    const [saving, setSaving] = useState(false);

    /* Debounced catalog search — same service the Quick Add modal uses. */
    useEffect(() => {
        const term = searchTerm.trim();
        if (term.length < 2) {
            setResults([]);
            setSearching(false);
            setSearchError(false);
            return;
        }
        setSearching(true);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            const result = await getAllProducts({
                searchTerm: term,
                limit: 12,
                fields: SEARCH_FIELDS,
            });
            setSearching(false);
            if (isErrorResult(result)) {
                setSearchError(true);
                setResults([]);
                return;
            }
            setSearchError(false);
            setResults(result.data ?? []);
        }, 350);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [searchTerm]);

    const pickProduct = (product: Product) => {
        setPicked(product);
        setOffer(
            product.offerPrice
                ? { ...product.offerPrice }
                : { type: "flat", value: 0, isActive: true },
        );
        // Keep the picked step visible when returning from step 2.
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const preview = picked && offer && offer.value > 0
        ? offerSaleInfo(picked.price, offer)
        : null;
    const displayCurrency = brandCurrency ?? picked?.currency;

    const invalidRange =
        !!offer?.startAt &&
        !!offer?.endAt &&
        new Date(offer.startAt) >= new Date(offer.endAt);

    const save = () => {
        if (!picked || !offer) return;
        if (!(offer.value > 0)) {
            toast.error("Set a discount value greater than zero.");
            return;
        }
        if (invalidRange) {
            toast.error("Offer end date must be after the start date.");
            return;
        }
        setSaving(true);
        startTransition(async () => {
            const result = await updateProductOffer(picked._id, offer);
            setSaving(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(`Offer saved for "${picked.name}"`);
            router.push("/dashboard/admin/products/offered-products");
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Add Offer</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Pick a product from the catalog and set its discount —
                        it applies across the storefront instantly.
                    </p>
                </div>
                <Button
                    variant="outline"
                    render={
                        <Link href="/dashboard/admin/products/offered-products" />
                    }
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Offered Products
                </Button>
            </div>

            {/* ── Steps rail ── */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span
                    className={
                        picked
                            ? "inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success"
                            : "inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-foreground"
                    }
                >
                    {picked ? <CheckCircle2 className="h-3.5 w-3.5" /> : "1"}
                    Pick product
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
                <span
                    className={
                        picked
                            ? "inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-foreground"
                            : "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground"
                    }
                >
                    2
                    Set discount
                </span>
            </div>

            {/* ── Step 1: catalog search ── */}
            <Card>
                <CardContent className="p-5 sm:p-6">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by product name or description…"
                            className="pl-9"
                            aria-label="Search products"
                        />
                    </div>

                    <div className="mt-4 space-y-2">
                        {searching && (
                            <p className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching…
                            </p>
                        )}
                        {searchError && !searching && (
                            <p className="px-2 py-6 text-sm text-muted-foreground">
                                Couldn’t load products right now — check your
                                connection and try again.
                            </p>
                        )}
                        {!searching && !searchError && searchTerm.trim().length < 2 && (
                            <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
                                <PackageSearch className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">
                                    Type at least 2 characters to search the
                                    catalog.
                                </p>
                            </div>
                        )}
                        {!searching &&
                            !searchError &&
                            searchTerm.trim().length >= 2 &&
                            results.length === 0 && (
                                <p className="px-2 py-6 text-sm text-muted-foreground">
                                    No products match “{searchTerm}”.
                                </p>
                            )}

                        {results.map((product) => {
                            const hasOffer = !!product.offerPrice;
                            const offerStatus = getOfferStatus(product.offerPrice);
                            const outOfStock =
                                !product.hasVariants && product.stock <= 0;
                            return (
                                <button
                                    key={product._id}
                                    type="button"
                                    onClick={() => pickProduct(product)}
                                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card p-3 text-left transition-colors hover:border-brand/40 hover:bg-brand/5"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                                        {product.imageUrls?.[0] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.imageUrls[0].url}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            product.name.charAt(0)
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {product.name}
                                        </p>
                                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                            <span>
                                                {formatCurrency(
                                                    product.price,
                                                    brandCurrency ?? product.currency,
                                                )}
                                            </span>
                                            {product.sku && (
                                                <span className="font-mono">
                                                    · {product.sku}
                                                </span>
                                            )}
                                            {outOfStock ? (
                                                <span className="font-medium text-destructive">
                                                    · Out of stock
                                                </span>
                                            ) : (
                                                <span>
                                                    ·{" "}
                                                    {product.hasVariants
                                                        ? "Variant product"
                                                        : `${product.stock} in stock`}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    {hasOffer && (
                                        <Badge
                                            variant="warning"
                                            className="hidden shrink-0 sm:inline-flex"
                                        >
                                            Has offer{offerStatus ? ` · ${offerStatus}` : ""}
                                        </Badge>
                                    )}
                                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ── Step 2: configure the discount ── */}
            {picked && (
                <Card>
                    <CardContent className="space-y-4 p-5 sm:p-6">
                        {/* Picked product summary */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                                    {picked.imageUrls?.[0] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={picked.imageUrls[0].url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        picked.name.charAt(0)
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                        {picked.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Regular price:{" "}
                                        {formatCurrency(picked.price, displayCurrency)}
                                        {picked.sku ? ` · ${picked.sku}` : ""}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setPicked(null);
                                    setOffer(null);
                                }}
                            >
                                Change product
                            </Button>
                        </div>

                        {picked.offerPrice && (
                            <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
                                This product already has an offer — saving
                                replaces it.
                            </p>
                        )}

                        <OfferPriceEditor value={offer} onChange={setOffer} />

                        {/* Live sale-price preview */}
                        {preview && (
                            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
                                <BadgePercent className="h-5 w-5 shrink-0 text-brand" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Storefront preview
                                    </p>
                                    <p className="mt-1 flex flex-wrap items-baseline gap-2">
                                        <span className="text-sm text-muted-foreground line-through">
                                            {formatCurrency(picked.price, displayCurrency)}
                                        </span>
                                        <span className="text-xl font-bold text-brand">
                                            {formatCurrency(preview.salePrice, displayCurrency)}
                                        </span>
                                        <Badge variant="highlight">
                                            −{preview.percent}% off
                                        </Badge>
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPicked(null);
                                    setOffer(null);
                                }}
                                disabled={saving || isPending}
                            >
                                Back
                            </Button>
                            <Button
                                variant="brand"
                                onClick={save}
                                disabled={saving || isPending || !offer}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-4 w-4" />
                                        Save Offer
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
