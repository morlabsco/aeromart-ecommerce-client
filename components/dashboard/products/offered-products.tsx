"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OfferPriceEditor } from "@/components/dashboard/shared/product-pricing-editors";
import {
    BadgePercent,
    CalendarClock,
    CheckCircle2,
    Eye,
    Loader2,
    Pencil,
    Plus,
    Search,
    Tag,
    TimerOff,
    Trash2,
    TrendingUp,
    Zap,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
    getAllProducts,
    updateProductOffer,
} from "@/lib/services/product";
import { formatCurrency } from "@/lib/utils/currency";
import { getOfferStatus, offerSaleInfo } from "@/lib/utils/offer";
import { isErrorResult } from "@/lib/utils/result";
import type { Product, ProductOfferPrice } from "@/lib/types/backend";
import { serverErrorMessage } from "@/lib/utils/form-feedback";

/** Offer lifecycle → Badge variant + label. */
const STATUS_BADGE: Record<
    string,
    { label: string; className: string }
> = {
    live: { label: "Live now", className: "bg-success/15 text-success" },
    scheduled: {
        label: "Scheduled",
        className: "bg-info/15 text-info",
    },
    expired: { label: "Expired", className: "bg-muted text-muted-foreground" },
    inactive: {
        label: "Inactive",
        className: "bg-warning/15 text-warning",
    },
};

/** yyyy-MM-dd → "30 Nov 2026" (short, locale-stable for table cells). */
function formatDate(value?: string): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

interface OfferedProductsTableProps {
    products: Product[];
    /** Live brand currency — offer prices render in it. */
    brandCurrency?: string;
}

/**
 * Offered Products manager — every product carrying an offerPrice in one
 * table: live/scheduled/expired/inactive status, one-dialog offer editing
 * (reuses the product form's OfferPriceEditor) and one-click removal, so
 * admins never open the full product form just to change a discount.
 */
export function OfferedProductsTable({
    products,
    brandCurrency = "usd",
}: OfferedProductsTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    /* ── Offer editor dialog (edit an existing offer) ── */
    const [editing, setEditing] = useState<Product | null>(null);
    const [draftOffer, setDraftOffer] = useState<ProductOfferPrice | null>(null);
    const [saving, setSaving] = useState(false);

    /* ── Add-offer dialog (pick a product, then the same editor) ── */
    const [adding, setAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<Product[]>([]);
    const [picked, setPicked] = useState<Product | null>(null);
    const [newOffer, setNewOffer] = useState<ProductOfferPrice | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Remove confirmation ── */
    const [removing, setRemoving] = useState<Product | null>(null);

    const currency = brandCurrency;

    const stats = useMemo(() => {
        const by = { live: 0, scheduled: 0, expired: 0, inactive: 0 };
        for (const p of products) {
            const status = getOfferStatus(p.offerPrice);
            if (status) by[status] += 1;
        }
        return by;
    }, [products]);

    const saveOffer = (product: Product, offer: ProductOfferPrice | null) => {
        if (offer) {
            const invalidRange =
                offer.startAt &&
                offer.endAt &&
                new Date(offer.startAt) >= new Date(offer.endAt);
            if (invalidRange) {
                toast.error("Offer end date must be after the start date.");
                return;
            }
            if (!(offer.value > 0)) {
                toast.error("Set a discount value greater than zero.");
                return;
            }
        }
        setSaving(true);
        startTransition(async () => {
            const result = await updateProductOffer(product._id, offer);
            setSaving(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(
                offer
                    ? `Offer saved for "${product.name}"`
                    : `Offer removed from "${product.name}"`,
            );
            setEditing(null);
            setAdding(false);
            setPicked(null);
            setNewOffer(null);
            setRemoving(null);
            router.refresh();
        });
    };

    /* Debounced product search inside the Add Offer dialog. */
    useEffect(() => {
        if (!adding) return;
        const term = searchTerm.trim();
        if (term.length < 2) {
            setResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            const result = await getAllProducts({ searchTerm: term, limit: 6 });
            setSearching(false);
            if (isErrorResult(result)) {
                setResults([]);
                return;
            }
            setResults(result.data ?? []);
        }, 350);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [searchTerm, adding]);

    const columns: ColumnDef<Product>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Product",
                enableSorting: true,
                cell: ({ row }) => {
                    const offer = row.original.offerPrice;
                    const info = offer
                        ? offerSaleInfo(row.original.price, offer)
                        : null;
                    return (
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-xs font-bold text-muted-foreground">
                                {row.original.imageUrls?.[0] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={row.original.imageUrls[0].url}
                                        alt={row.original.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    row.original.name.charAt(0)
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {row.original.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {formatCurrency(
                                        row.original.price,
                                        currency ?? row.original.currency,
                                    )}
                                    {info
                                        ? ` → ${formatCurrency(
                                              info.salePrice,
                                              currency ?? row.original.currency,
                                          )} (−${info.percent}%)`
                                        : ""}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "offer",
                header: "Discount",
                cell: ({ row }) => {
                    const offer = row.original.offerPrice;
                    if (!offer) return <span className="text-sm text-muted-foreground">—</span>;
                    return (
                        <Badge variant="secondary" className="gap-1 text-xs">
                            <Tag className="h-3 w-3" />
                            {offer.type === "percentage"
                                ? `${offer.value}% off`
                                : `${formatCurrency(offer.value, currency ?? row.original.currency)} off`}
                        </Badge>
                    );
                },
            },
            {
                id: "period",
                header: "Period",
                cell: ({ row }) => {
                    const offer = row.original.offerPrice;
                    return (
                        <p className="text-xs text-muted-foreground">
                            {formatDate(offer?.startAt)} — {formatDate(offer?.endAt)}
                        </p>
                    );
                },
            },
            {
                id: "status",
                header: "Status",
                cell: ({ row }) => {
                    const status = getOfferStatus(row.original.offerPrice);
                    if (!status) return null;
                    const badge = STATUS_BADGE[status];
                    return (
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${badge.className}`}
                        >
                            {badge.label}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={`View ${row.original.name}`}
                            render={
                                <a
                                    href={`/dashboard/admin/products/${row.original._id}`}
                                />
                            }
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={`Edit offer on ${row.original.name}`}
                            onClick={() => {
                                setEditing(row.original);
                                setDraftOffer(
                                    row.original.offerPrice
                                        ? { ...row.original.offerPrice }
                                        : null,
                                );
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            aria-label={`Remove offer from ${row.original.name}`}
                            onClick={() => setRemoving(row.original)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [currency],
    );

    const statCards = [
        {
            label: "Live Now",
            value: stats.live,
            icon: BadgePercent,
            hint: "Shown on the storefront",
        },
        {
            label: "Scheduled",
            value: stats.scheduled,
            icon: CalendarClock,
            hint: "Waiting for their start date",
        },
        {
            label: "Expired",
            value: stats.expired,
            icon: TimerOff,
            hint: "Hidden — end date passed",
        },
        {
            label: "Inactive",
            value: stats.inactive,
            icon: TrendingUp,
            hint: "Turned off or zero value",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Offered Products
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create, update and remove discounts in one place — no
                        need to open each product.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAdding(true);
                            setSearchTerm("");
                            setResults([]);
                            setPicked(null);
                            setNewOffer(null);
                        }}
                    >
                        <Zap className="h-4 w-4" /> Quick Add Offer
                    </Button>
                    <Button
                        variant="brand"
                        render={
                            <Link href="/dashboard/admin/products/offered-products/add" />
                        }
                    >
                        <Plus className="h-4 w-4" /> Add Offer
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardContent className="p-5">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="inline-flex rounded-lg bg-primary/10 p-1.5">
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                                <p className="text-xl font-bold tabular-nums">
                                    {stat.value}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {stat.label}
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground/70">
                                    {stat.hint}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <DashboardDataTable
                columns={columns}
                data={products}
                searchKey="name"
                searchPlaceholder="Search offered products..."
                pageSize={8}
            />

            {/* ── Edit offer dialog ── */}
            <Dialog
                open={!!editing}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit offer — {editing?.name}</DialogTitle>
                        <DialogDescription>
                            Changes apply instantly across the storefront.
                        </DialogDescription>
                    </DialogHeader>
                    <OfferPriceEditor
                        value={draftOffer}
                        onChange={setDraftOffer}
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditing(null)}
                            disabled={saving || isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => editing && saveOffer(editing, draftOffer)}
                            disabled={saving || isPending}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Save Offer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Add offer dialog: search → pick → editor ── */}
            <Dialog
                open={adding}
                onOpenChange={(open) => {
                    if (!open) {
                        setAdding(false);
                        setPicked(null);
                        setNewOffer(null);
                    }
                }}
            >
                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Quick add an offer</DialogTitle>
                        <DialogDescription>
                            Search your catalog, pick a product and set its
                            discount.
                        </DialogDescription>
                    </DialogHeader>

                    {!picked ? (
                        <div className="space-y-3">
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
                            <div className="max-h-[420px] space-y-1 overflow-y-auto">
                                {searching && (
                                    <p className="flex items-center gap-2 px-2 py-4 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Searching…
                                    </p>
                                )}
                                {!searching && searchTerm.trim().length >= 2 && results.length === 0 && (
                                    <p className="px-2 py-4 text-sm text-muted-foreground">
                                        No products match “{searchTerm}”.
                                    </p>
                                )}
                                {!searching && searchTerm.trim().length < 2 && (
                                    <p className="px-2 py-4 text-sm text-muted-foreground">
                                        Type at least 2 characters to search.
                                    </p>
                                )}
                                {results.map((product) => (
                                    <button
                                        key={product._id}
                                        type="button"
                                        onClick={() => {
                                            setPicked(product);
                                            setNewOffer(
                                                product.offerPrice
                                                    ? { ...product.offerPrice }
                                                    : {
                                                          type: "flat",
                                                          value: 0,
                                                          isActive: true,
                                                      },
                                            );
                                        }}
                                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-border hover:bg-muted/50"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-xs font-bold text-muted-foreground">
                                            {product.imageUrls?.[0] ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={product.imageUrls[0].url}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                product.name.charAt(0)
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(
                                                    product.price,
                                                    currency ?? product.currency,
                                                )}
                                                {product.offerPrice
                                                    ? " · already has an offer (editing it)"
                                                    : ""}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                        {picked.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(
                                            picked.price,
                                            currency ?? picked.currency,
                                        )}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPicked(null)}
                                >
                                    Change product
                                </Button>
                            </div>
                            <OfferPriceEditor
                                value={newOffer}
                                onChange={setNewOffer}
                            />
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setPicked(null)}
                                    disabled={saving || isPending}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={() => picked && saveOffer(picked, newOffer)}
                                    disabled={saving || isPending}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Save Offer
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Remove offer confirmation ── */}
            <AlertDialog
                open={!!removing}
                onOpenChange={(open) => !open && setRemoving(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Offer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove the discount from{" "}
                            <span className="font-medium">{removing?.name}</span>?
                            The product goes back to its regular price everywhere.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setRemoving(null)}
                            disabled={saving || isPending}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => removing && saveOffer(removing, null)}
                            disabled={saving || isPending}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                            {saving || isPending ? "Removing..." : "Remove Offer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
