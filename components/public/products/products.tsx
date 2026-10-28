"use client";

import { Suspense, useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
    Search,
    LayoutGrid,
    List,
    SlidersHorizontal,
    X,
    SearchX,
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
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Pagination } from "../../../components/ui/pagination";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import type { Category, Brand } from "@/lib/types/backend";
import { formatCurrency, currencySymbol } from "@/lib/utils/currency";

/* ---------------------------------------------------------------------------
 * Nittonova Shop page (from the cropped products-page references): breadcrumb
 * + "Shop (N)" heading, charcoal sort box + grid/list toggle, FILTER sidebar
 * (pill search, icon category list, brands, price, stock) and a product grid
 * of the shared ProductCard with pagination above and below the grid.
 * ------------------------------------------------------------------------- */

const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS = [
    { value: "newest", label: "Featured" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "rating", label: "Top Rated" },
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
        sort: "newest",
        minPrice: "",
        maxPrice: "",
        inStock: "",
        page: "1",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [view, setView] = useState<"grid" | "list">("grid");

    // Header search used to push ?searchTerm=; keep it working alongside ?search=.
    const searchParam = params.search || params.searchTerm || "";

    // Local, uncontrolled search input for lag-free typing. Commits to the URL
    // params only after the user pauses (debounced), so keystrokes never push
    // a router navigation.
    const [searchDraft, setSearchDraft] = useState(searchParam);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setSearchDraft(searchParam);
    }, [searchParam]);

    const handleSearchChange = useCallback(
        (value: string) => {
            setSearchDraft(value);
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
            searchDebounceRef.current = setTimeout(() => {
                setParams({ search: value, searchTerm: "", page: "1" });
            }, 350);
        },
        [setParams],
    );

    // Clear the debounce on unmount.
    useEffect(() => {
        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, []);

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

        // Price range filter
        const minP = Number(params.minPrice) || 0;
        const maxP = Number(params.maxPrice) || Infinity;
        result = result.filter((p) => p.price >= minP && p.price <= maxP);

        // Stock filter
        if (params.inStock === "true") {
            result = result.filter((p) => (p.stock ?? 0) > 0);
        }

        switch (params.sort) {
            case "price-asc":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                result.sort((a, b) => b.price - a.price);
                break;
            case "rating":
                result.sort((a, b) => b.rating - a.rating);
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

    const hasActiveFilters =
        Boolean(searchParam) ||
        activeCategoryName !== "all" ||
        params.brand !== "all" ||
        Boolean(params.minPrice) ||
        Boolean(params.maxPrice) ||
        params.inStock === "true";

    const clearFilters = () =>
        setParams({
            search: "",
            searchTerm: "",
            category: "all",
            brand: "all",
            minPrice: "",
            maxPrice: "",
            inStock: "",
            page: "1",
        });

    const currencyLabel = products[0]?.currency
        ? currencySymbol(products[0].currency)
        : "$";

    const sortLabel =
        SORT_OPTIONS.find((o) => o.value === params.sort)?.label ?? "Featured";

    const goToPage = (p: number) => {
        setParams({ page: String(p) });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /* ------------------------------ filter panel ------------------------------ */

    const filterPanel = (
        <div className="space-y-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">
                Filter
            </p>

            {/* Pill search with the orange magnifier button */}
            <form
                className="flex items-center gap-1 rounded-full border border-border bg-card p-1 pl-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    setParams({ search: searchDraft, searchTerm: "", page: "1" });
                }}
            >
                <Search className="size-4 shrink-0 text-muted-foreground/60" />
                <input
                    value={searchDraft}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search"
                    aria-label="Search products"
                    className="h-9 w-full min-w-0 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                <Button
                    type="submit"
                    variant="brand"
                    size="icon-sm"
                    aria-label="Search"
                    className="shrink-0 rounded-full"
                >
                    <Search className="size-4" />
                </Button>
            </form>

            {/* Category — icon rows like the reference sidebar */}
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
                            All
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
                                All
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
                            placeholder={`${currencyLabel}${priceBounds.min}`}
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
                            placeholder={`${currencyLabel}${priceBounds.max}`}
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

            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-3.5 w-3.5" /> Clear filters
                </Button>
            )}
        </div>
    );

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

    /* --------------------------------- toolbar -------------------------------- */

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                {filtered.length} item{filtered.length === 1 ? "" : "s"} are found
            </p>
            <div className="flex items-center gap-3">
                <Select
                    value={params.sort}
                    onValueChange={(value) =>
                        setParams({ sort: value ?? "newest", page: "1" })
                    }
                >
                    <SelectTrigger
                        aria-label="Sort products"
                        className="h-10 w-full border-header-nav bg-header-nav text-header-nav-foreground shadow-none hover:bg-header-nav/90 sm:w-52"
                    >
                        <SelectValue>
                            <span className="font-semibold">
                                Sort by: {sortLabel}
                            </span>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <ViewToggle view={view} onChange={setView} />
                <Button
                    variant="brand"
                    className="sm:hidden"
                    onClick={() => setShowFilters(true)}
                >
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
            </div>
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
                {/* Breadcrumb */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
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
                                Shop
                            </a>
                            <span aria-hidden="true">/</span>
                            <span className="font-semibold text-foreground">
                                {activeCategoryName}
                            </span>
                        </>
                    ) : (
                        <span className="font-semibold text-foreground">Shop</span>
                    )}
                </nav>

                {/* Title */}
                <motion.h1
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="mt-3 text-3xl font-bold uppercase tracking-tight text-foreground lg:text-4xl"
                >
                    Shop{" "}
                    <span className="font-bold text-muted-foreground">
                        ({filtered.length})
                    </span>
                </motion.h1>

                <div className="mt-6">{toolbar}</div>

                <div className="mt-2 flex gap-8">
                    {/* Desktop sidebar */}
                    <aside className="hidden w-60 shrink-0 sm:block">
                        <div className="sticky top-24 pb-6">{filterPanel}</div>
                    </aside>

                    {/* Mobile filter bottom sheet */}
                    {showFilters && (
                        <div className="fixed inset-0 z-50 sm:hidden">
                            <div
                                className="absolute inset-0 bg-scrim/50 backdrop-blur-sm"
                                onClick={() => setShowFilters(false)}
                            />
                            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-hero-surface p-5 shadow-2xl">
                                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="font-bold">Filters</h2>
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        aria-label="Close filters"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                {filterPanel}
                                <Button
                                    variant="brand"
                                    size="xl"
                                    className="mt-6 w-full"
                                    onClick={() => setShowFilters(false)}
                                >
                                    Show {filtered.length} results
                                </Button>
                            </div>
                        </div>
                    )}

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        key={`${activeCategoryName}-${params.brand}-${params.page}-${view}`}
                        className="min-w-0 flex-1"
                    >
                        {paginated.length === 0 ? (
                            emptyState
                        ) : (
                            <>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={goToPage}
                                />
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
