"use client";

import { Suspense, useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
    LayoutGrid,
    List,
    SlidersHorizontal,
    X,
    SearchX,
    ChevronDown,
    Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "../../../components/shared/reveal";
import { useQueryParams } from "../../../lib/hooks/use-query-params";
import { ProductCard, getProductPricing } from "../../../components/shared/product-card";
import { useAddToCart } from "../../../components/shared/use-add-to-cart";
import { StarRating } from "../../../components/shared/star-rating";
import { PageHero } from "../../../components/shared/page-hero";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Slider } from "../../../components/ui/slider";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import { Pagination } from "../../../components/ui/pagination";
import { cn } from "@/lib/utils";
import type { Product } from "../../../lib/types";
import type { Category, Brand } from "../../../lib/types/backend";
import { formatCurrency } from "../../../lib/utils/currency";

/* ---------------------------------------------------------------------------
 * Nittonova Shop page: centered breadcrumb + "All Products (N)" heading, a
 * toolbar with a left Filters trigger (opens a left slide-in drawer with
 * categories / brands / colors / price / stock), a custom brand Sort menu
 * (no browser select) and the grid/list view toggle, then the product grid
 * with pagination below it only.
 * ------------------------------------------------------------------------- */

const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS = [
    { value: "newest", label: "Latest" },
    { value: "oldest", label: "Oldest" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
] as const;

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-card p-4 shadow-sm">
                    <div className="aspect-square rounded-lg bg-muted" />
                    <div className="mt-4 h-3 w-1/2 rounded bg-muted" />
                    <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
                    <div className="mt-3 h-4 w-1/3 rounded bg-muted" />
                    <div className="mt-4 h-10 rounded-lg bg-muted" />
                </div>
            ))}
        </div>
    );
}

/** Grid/list view toggle (two squares, active side charcoal — per reference). */
function ViewToggle({
    view,
    onChange,
}: {
    view: "grid" | "list";
    onChange: (v: "grid" | "list") => void;
}) {
    const btn = (mode: "grid" | "list", Icon: typeof LayoutGrid, label: string) => (
        <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-label={label}
            aria-pressed={view === mode}
            className={cn(
                "flex h-10 w-10 cursor-pointer items-center justify-center transition-colors",
                view === mode
                    ? "bg-header-nav text-header-nav-foreground"
                    : "bg-card text-muted-foreground hover:text-brand",
            )}
        >
            <Icon className="size-4" />
        </button>
    );
    return (
        <div className="flex overflow-hidden rounded-lg border border-border shadow-xs">
            {btn("grid", LayoutGrid, "Grid view")}
            {btn("list", List, "List view")}
        </div>
    );
}

/**
 * Custom sort menu — brand-owned, no browser select. Transparent trigger
 * with primary-colored label (matching the Filters trigger), menu drops in
 * below the button with a check on the active option.
 */
function SortMenu({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: PointerEvent) => {
            if (ref.current?.contains(e.target as Node)) return;
            setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const label =
        SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Latest";

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Sort products"
                className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-brand transition-colors hover:bg-brand/10"
            >
                Sort by: {label}
                <ChevronDown
                    className={cn(
                        "size-4 transition-transform duration-200",
                        open && "rotate-180",
                    )}
                />
            </button>
            {open && (
                <div
                    role="listbox"
                    aria-label="Sort options"
                    className="absolute right-0 top-full z-40 mt-2 w-60 animate-in fade-in slide-in-from-top-1 overflow-hidden rounded-xl border border-border/60 bg-card py-1.5 shadow-xl"
                >
                    {SORT_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={option.value === value}
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                            className={cn(
                                "flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors",
                                option.value === value
                                    ? "font-bold text-brand"
                                    : "text-foreground hover:bg-muted hover:text-brand",
                            )}
                        >
                            {option.label}
                            {option.value === value && <Check className="size-4" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Nittonova list-row card (the list half of the view toggle). */
function ProductListRow({ product }: { product: Product }) {
    const addToCart = useAddToCart();
    const { displayPrice, referencePrice, discountPercent } = getProductPricing(product);

    return (
        <div className="group flex gap-4 rounded-xl bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:gap-6 sm:p-5">
            <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-lg bg-background sm:w-40">
                {product.image && product.image.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted p-3 text-center text-xs font-bold text-muted-foreground">
                        {product.title}
                    </div>
                )}
                {discountPercent && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground">
                        -{discountPercent}%
                    </span>
                )}
                {!product.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-scrim/50">
                        <span className="rounded-full bg-scrim/70 px-3 py-1 text-xs font-semibold text-scrim-foreground">
                            Unavailable
                        </span>
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <StarRating rating={product.rating} count={product.reviewCount} mode="compact" />
                <h3 className="mt-1 line-clamp-2 text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-brand sm:text-[15px]">
                    {product.title}
                </h3>
                <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-brand">
                        {formatCurrency(displayPrice, product.currency)}
                    </span>
                    {referencePrice && referencePrice > displayPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(referencePrice, product.currency)}
                        </span>
                    )}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                    <Button variant="brandOutline" onClick={(e) => addToCart(product, e)}>
                        Add to Cart
                    </Button>
                    <a
                        href={`/products/${product.slug}`}
                        className="inline-block text-sm font-semibold text-brand transition-transform duration-300 hover:translate-x-1"
                    >
                        View details
                    </a>
                </div>
            </div>
        </div>
    );
}

interface ProductsPageContentProps {
    products: Product[];
    categories: Category[];
    brands: Brand[];
}

function ProductsPageContent({
    products,
    categories,
    brands,
}: ProductsPageContentProps) {
    const [params, setParams] = useQueryParams({
        search: "",
        searchTerm: "",
        category: "all",
        brand: "all",
        color: "all",
        sort: "newest",
        minPrice: "",
        maxPrice: "",
        inStock: "",
        page: "1",
    });
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [view, setView] = useState<"grid" | "list">("grid");

    // Header search used to push ?searchTerm=; keep it working alongside ?search=.
    const searchParam = params.search || params.searchTerm || "";

    // Category links anywhere in the app use the slug; older links used the
    // name. Resolve whichever arrived to a canonical category name.
    const rawCategory = params.category;
    const activeCategory =
        rawCategory && rawCategory !== "all"
            ? categories.find(
                  (c) => c.slug === rawCategory || c.name === rawCategory,
              )
            : undefined;
    const activeCategoryName =
        activeCategory?.name ??
        (rawCategory && rawCategory !== "all" ? rawCategory : "all");

    // Derive slider bounds from all products
    const priceBounds = useMemo(() => {
        const prices = products.map((p) => p.price);
        return {
            min: prices.length ? Math.floor(Math.min(...prices)) : 0,
            max: prices.length ? Math.ceil(Math.max(...prices)) : 1000,
        };
    }, [products]);

    // Numeric price values for slider (local state for fluid dragging)
    const [sliderValue, setSliderValue] = useState<[number, number]>([
        Number(params.minPrice) || priceBounds.min,
        Number(params.maxPrice) || priceBounds.max,
    ]);

    // Sync slider from URL when params change externally
    useEffect(() => {
        setSliderValue([
            Number(params.minPrice) || priceBounds.min,
            Number(params.maxPrice) || priceBounds.max,
        ]);
    }, [params.minPrice, params.maxPrice, priceBounds.min, priceBounds.max]);

    const commitSlider = useCallback(
        (value: [number, number]) => {
            setParams({
                minPrice: value[0] > priceBounds.min ? String(value[0]) : "",
                maxPrice: value[1] < priceBounds.max ? String(value[1]) : "",
                page: "1",
            });
        },
        [priceBounds, setParams],
    );

    // Colors present across the catalog (colorOptions is the backend's single
    // source of truth for colors). Hidden when no product declares any.
    const availableColors = useMemo(() => {
        const byName = new Map<string, string>();
        for (const p of products) {
            for (const c of p.colorOptions ?? []) {
                if (!c.name || byName.has(c.name)) continue;
                byName.set(c.name, c.hex || "");
            }
        }
        return [...byName.entries()]
            .map(([name, hex]) => ({ name, hex }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [products]);

    const filtered = useMemo(() => {
        let result = products.filter((p) => p.isActive);

        if (searchParam) {
            const q = searchParam.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q),
            );
        }

        if (activeCategoryName !== "all") {
            result = result.filter((p) => p.category === activeCategoryName);
        }

        if (params.brand !== "all") {
            result = result.filter((p) => p.brand === params.brand);
        }

        if (params.color !== "all" && params.color) {
            result = result.filter((p) =>
                p.colorOptions?.some((c) => c.name === params.color),
            );
        }

        // Price range filter
        const minP = Number(params.minPrice) || 0;
        const maxP = Number(params.maxPrice) || Infinity;
        result = result.filter((p) => p.price >= minP && p.price <= maxP);

        // Stock filter
        if (params.inStock === "true") {
            result = result.filter((p) => (p.stock ?? 0) > 0);
        }

        switch (params.sort) {
            case "oldest":
                result.sort(
                    (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime(),
                );
                break;
            case "price-asc":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                result.sort((a, b) => b.price - a.price);
                break;
            case "name-asc":
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "name-desc":
                result.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case "newest":
            default:
                result.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                );
                break;
        }

        return result;
    }, [
        products,
        searchParam,
        activeCategoryName,
        params.brand,
        params.color,
        params.sort,
        params.minPrice,
        params.maxPrice,
        params.inStock,
    ]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(
        Math.max(1, Number(params.page) || 1),
        totalPages,
    );
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );
    const rangeStart =
        paginated.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const rangeEnd = (currentPage - 1) * ITEMS_PER_PAGE + paginated.length;

    const hasActiveFilters =
        Boolean(searchParam) ||
        activeCategoryName !== "all" ||
        params.brand !== "all" ||
        (params.color !== "all" && Boolean(params.color)) ||
        Boolean(params.minPrice) ||
        Boolean(params.maxPrice) ||
        params.inStock === "true";

    const clearFilters = () =>
        setParams({
            search: "",
            searchTerm: "",
            category: "all",
            brand: "all",
            color: "all",
            minPrice: "",
            maxPrice: "",
            inStock: "",
            page: "1",
        });

    const goToPage = (p: number) => {
        setParams({ page: String(p) });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Lock body scroll and close on Escape while the filter drawer is open.
    useEffect(() => {
        if (!filtersOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setFiltersOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [filtersOpen]);

    /* ------------------------------- empty state ------------------------------- */

    const emptyState = (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-card px-6 py-20 text-center shadow-sm">
            <span className="flex size-24 items-center justify-center rounded-2xl bg-muted">
                <SearchX className="size-10 text-muted-foreground" strokeWidth={1.5} />
            </span>
            <h2 className="mt-6 text-xl font-bold text-foreground">
                No products found
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                We couldn&apos;t find anything matching your filters. Try clearing
                them or browsing another category.
            </p>
            {hasActiveFilters && (
                <Button
                    variant="brand"
                    size="xl"
                    onClick={clearFilters}
                    className="mt-6"
                >
                    Clear all filters
                </Button>
            )}
        </div>
    );

    /* ---------------------------------- page ---------------------------------- */

    return (
        <div className="bg-hero-surface">
            {activeCategory && (
                <PageHero
                    eyebrow="Category"
                    title={activeCategory.name}
                    subtitle={activeCategory.description || undefined}
                />
            )}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                {/* Breadcrumb + heading — centered */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                    <a href="/" className="inline-block transition-colors hover:text-brand">
                        Home
                    </a>
                    <span aria-hidden="true">/</span>
                    {activeCategoryName !== "all" ? (
                        <>
                            <a
                                href="/products"
                                className="inline-block transition-colors hover:text-brand"
                            >
                                Products
                            </a>
                            <span aria-hidden="true">/</span>
                            <span className="font-semibold text-foreground">
                                {activeCategoryName}
                            </span>
                        </>
                    ) : (
                        <span className="font-semibold text-foreground">Products</span>
                    )}
                </nav>

                <motion.h1
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="mt-3 text-center text-3xl font-bold uppercase tracking-tight text-foreground lg:text-4xl"
                >
                    All Products{" "}
                    <span className="font-bold text-muted-foreground">
                        ({filtered.length})
                    </span>
                </motion.h1>

                {/* Toolbar: Filters (left) · result count (center) · sort + view (right) */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(true)}
                        aria-label="Open filters"
                        className="flex h-10 w-fit cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-bold text-brand transition-colors hover:bg-brand/10"
                    >
                        <SlidersHorizontal className="size-4" />
                        Filters
                        {hasActiveFilters && (
                            <span
                                className="ml-0.5 size-2 rounded-full bg-brand"
                                aria-hidden="true"
                            />
                        )}
                    </button>
                    <p className="text-sm text-muted-foreground sm:flex-1 sm:text-center">
                        Showing {rangeStart}–{rangeEnd} of {filtered.length}{" "}
                        product{filtered.length === 1 ? "" : "s"}
                    </p>
                    <div className="flex items-center gap-3 sm:justify-end">
                        <SortMenu
                            value={params.sort}
                            onChange={(value) =>
                                setParams({ sort: value, page: "1" })
                            }
                        />
                        <ViewToggle view={view} onChange={setView} />
                    </div>
                </div>

                {/* Filter drawer — left slide-in panel over a scrim */}
                <div
                    className={cn(
                        "fixed inset-0 z-50 bg-scrim/50 transition-opacity duration-300",
                        filtersOpen
                            ? "opacity-100"
                            : "pointer-events-none opacity-0",
                    )}
                    onClick={() => setFiltersOpen(false)}
                    aria-hidden="true"
                />
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm flex-col bg-card shadow-xl transition-transform duration-300",
                        filtersOpen ? "translate-x-0" : "-translate-x-full",
                    )}
                    aria-label="Product filters"
                    aria-hidden={!filtersOpen}
                    inert={!filtersOpen}
                >
                    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-5">
                        <span className="text-sm font-bold uppercase tracking-widest text-foreground">
                            Filters
                        </span>
                        <button
                            onClick={() => setFiltersOpen(false)}
                            className="cursor-pointer rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
                            aria-label="Close filters"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-7 overflow-y-auto p-5">
                        {/* Category */}
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Category</h3>
                            <ul className="mt-3 space-y-1">
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => setParams({ category: "all", page: "1" })}
                                        className={cn(
                                            "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                                            activeCategoryName === "all"
                                                ? "font-bold text-brand"
                                                : "text-muted-foreground hover:text-brand",
                                        )}
                                    >
                                        All Categories
                                    </button>
                                </li>
                                {categories.map((cat) => (
                                    <li key={cat._id}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setParams({ category: cat.slug, page: "1" })
                                            }
                                            className={cn(
                                                "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                                                activeCategoryName === cat.name
                                                    ? "font-bold text-brand"
                                                    : "text-muted-foreground hover:text-brand",
                                            )}
                                        >
                                            <span
                                                role="img"
                                                aria-hidden="true"
                                                className={cn(
                                                    "h-5 w-5 shrink-0 rounded-sm bg-contain bg-center bg-no-repeat",
                                                    !cat.icon && "bg-muted",
                                                )}
                                                style={
                                                    cat.icon
                                                        ? { backgroundImage: `url(${cat.icon})` }
                                                        : undefined
                                                }
                                            />
                                            {cat.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Brand */}
                        {brands.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Brand</h3>
                                <ul className="mt-3 space-y-1">
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => setParams({ brand: "all", page: "1" })}
                                            className={cn(
                                                "block w-full cursor-pointer rounded-lg px-2 py-1 text-left text-sm transition-colors",
                                                params.brand === "all"
                                                    ? "font-bold text-brand"
                                                    : "text-muted-foreground hover:text-brand",
                                            )}
                                        >
                                            All Brands
                                        </button>
                                    </li>
                                    {brands.map((b) => (
                                        <li key={b._id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setParams({ brand: b.name, page: "1" })
                                                }
                                                className={cn(
                                                    "block w-full cursor-pointer rounded-lg px-2 py-1 text-left text-sm transition-colors",
                                                    params.brand === b.name
                                                        ? "font-bold text-brand"
                                                        : "text-muted-foreground hover:text-brand",
                                                )}
                                            >
                                                {b.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Color */}
                        {availableColors.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Color</h3>
                                <ul className="mt-3 space-y-1">
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => setParams({ color: "all", page: "1" })}
                                            className={cn(
                                                "block w-full cursor-pointer rounded-lg px-2 py-1 text-left text-sm transition-colors",
                                                params.color === "all" || !params.color
                                                    ? "font-bold text-brand"
                                                    : "text-muted-foreground hover:text-brand",
                                            )}
                                        >
                                            All Colors
                                        </button>
                                    </li>
                                    {availableColors.map((c) => (
                                        <li key={c.name}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setParams({ color: c.name, page: "1" })
                                                }
                                                className={cn(
                                                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                                                    params.color === c.name
                                                        ? "font-bold text-brand"
                                                        : "text-muted-foreground hover:text-brand",
                                                )}
                                            >
                                                <span
                                                    role="img"
                                                    aria-hidden="true"
                                                    className={cn(
                                                        "size-4 shrink-0 rounded-full border border-border",
                                                        !c.hex && "bg-muted",
                                                    )}
                                                    style={
                                                        c.hex
                                                            ? { backgroundColor: c.hex }
                                                            : undefined
                                                    }
                                                />
                                                {c.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Price */}
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Price</h3>
                            <div className="mt-4 space-y-3">
                                <Slider
                                    value={sliderValue}
                                    min={priceBounds.min}
                                    max={priceBounds.max}
                                    onValueChange={(value) => {
                                        const [min, max] = value as number[];
                                        setSliderValue([min, max]);
                                    }}
                                    onValueCommitted={(value) => {
                                        const [min, max] = value as number[];
                                        commitSlider([min, max]);
                                    }}
                                />
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={params.minPrice}
                                        onChange={(e) =>
                                            setParams({ minPrice: e.target.value, page: "1" })
                                        }
                                        className="h-9 text-xs"
                                        aria-label="Minimum price"
                                    />
                                    <span className="text-xs text-muted-foreground">—</span>
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={params.maxPrice}
                                        onChange={(e) =>
                                            setParams({ maxPrice: e.target.value, page: "1" })
                                        }
                                        className="h-9 text-xs"
                                        aria-label="Maximum price"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stock */}
                        <Label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                            <Checkbox
                                checked={params.inStock === "true"}
                                onCheckedChange={(checked: boolean) =>
                                    setParams({ inStock: checked ? "true" : "", page: "1" })
                                }
                            />
                            In Stock Only
                        </Label>
                    </div>

                    {/* Big charcoal clear button */}
                    <div className="shrink-0 border-t border-border/60 p-4">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="h-12 w-full cursor-pointer rounded-lg bg-header-nav text-sm font-bold uppercase tracking-wide text-header-nav-foreground transition-colors hover:bg-header-nav/90"
                        >
                            Clear Filters
                        </button>
                    </div>
                </aside>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    key={`${activeCategoryName}-${params.brand}-${params.color}-${params.page}-${view}`}
                    className="mt-2"
                >
                    {paginated.length === 0 ? (
                        emptyState
                    ) : (
                        <>
                            {view === "grid" ? (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                                    {paginated.map((product) => (
                                        <motion.div key={product.id} variants={fadeUp}>
                                            <ProductCard product={product} />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {paginated.map((product) => (
                                        <motion.div key={product.id} variants={fadeUp}>
                                            <ProductListRow product={product} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                            />
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default function Products({
    products,
    categories,
    brands,
}: {
    products: Product[];
    categories: Category[];
    brands: Brand[];
}) {
    return (
        <Suspense fallback={<SkeletonGrid />}>
            <ProductsPageContent
                products={products}
                categories={categories}
                brands={brands}
            />
        </Suspense>
    );
}
